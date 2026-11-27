/* The assistant ("Instinct"): a chat page at #assistant and a panel any page can open with
   window.HubAssistant.open({ context }). Offline it answers from rules and a local knowledge base; with an
   endpoint or a personal key configured it runs a tool-calling loop against a language model.
   Logic lives in data/assistant-core.js; this file is the interface. */
(function () {
  'use strict';
  var H = window.Hub; if (!H) return;
  var esc = H.esc, $ = H.$, $$ = H.$$, ic = H.ic, C = null;
  var KEY_STORE = 'hub-assistant-key', DEPS = ['data/assistant-config.js', 'data/assistant-kb.js', 'data/assistant-prompt.js', 'data/assistant-core.js'];
  var loading = null, ui = null, sheet = null, busy = false, abort = null, waiting = null, blockedAt = 0;
  document.addEventListener('securitypolicyviolation', function (e) { if (/connect-src/.test(e.violatedDirective || e.effectiveDirective || '')) blockedAt = Date.now(); });

  function ready(fn) {
    if (C) return fn();
    if (!loading) {
      loading = [];
      (function next(i) {
        if (i === DEPS.length) { C = window.HubAssistantCore; var q = loading; loading = null; q.forEach(function (f) { f(); }); return; }
        var s = document.createElement('script'); s.src = DEPS[i]; s.onload = s.onerror = function () { next(i + 1); }; document.head.appendChild(s);
      })(0);
    }
    loading.push(fn);
  }

  /* ---------- stored data ---------- */
  function D() {
    var d = H.data('assistant');
    if (d.v !== 1) d.v = 1;
    if (!Array.isArray(d.msgs)) d.msgs = [];
    if (!Array.isArray(d.reading)) d.reading = [];
    if (!Array.isArray(d.drafts)) d.drafts = [];
    if (!d.cfg || typeof d.cfg !== 'object') d.cfg = {};
    var c = d.cfg;
    if (['offline', 'worker', 'byok'].indexOf(c.mode) < 0) c.mode = '';
    if (typeof c.base !== 'string') c.base = '';
    if (c.provider !== 'claude') c.provider = 'gemini';
    if (typeof c.model !== 'string') c.model = '';
    if (c.redteam !== false) c.redteam = true;
    c.consent = c.consent === true;
    if (!c.client) c.client = H.uid() + H.uid();
    return d;
  }
  function save() { var d = D(); if (d.msgs.length > 80) d.msgs = d.msgs.slice(-80); H.save(); }
  function getKey() { try { return localStorage.getItem(KEY_STORE) || ''; } catch (e) { return ''; } }
  function setKey(v) { try { if (v) localStorage.setItem(KEY_STORE, v); else localStorage.removeItem(KEY_STORE); } catch (e) {} }
  function siteBase() { var g = window.HubAssistantConfig; return g && typeof g.base === 'string' ? g.base.trim() : ''; }
  function baseUrl() { return (D().cfg.base || siteBase()).trim(); }
  /* What actually runs: a model mode needs both its settings and the user's consent. */
  function mode() {
    var c = D().cfg, m = c.mode || (siteBase() ? 'worker' : 'offline');
    if (m === 'worker' && !/^https:\/\/|^http:\/\/(localhost|127\.0\.0\.1)/.test(baseUrl())) return 'offline';
    if (m === 'byok' && !getKey()) return 'offline';
    return m;
  }
  function modeLabel() {
    var c = D().cfg, m = mode();
    if (m === 'worker') return 'نموذج ذكاء اصطناعي: ' + (PROVIDERS[c.seen] || 'خادم المنصة');
    if (m === 'byok') return 'نموذج ذكاء اصطناعي: ' + C.byok[c.provider].label + ' (مفتاحك)';
    return 'بدون اتصال: قواعد وبحث';
  }
  var PROVIDERS = { 'workers-ai': 'Workers AI', gemini: 'Gemini', claude: 'Claude', safety: 'خادم المنصة' };

  /* ---------- drawing ---------- */
  function sigil(cls) {
    var pts = [], i, a, r;
    for (i = 0; i < 16; i++) { a = Math.PI / 8 * i - Math.PI / 2; r = i % 4 === 0 ? 44 : i % 2 === 0 ? 24 : 9; pts.push((Math.cos(a) * r).toFixed(1) + ',' + (Math.sin(a) * r).toFixed(1)); }
    var ring = []; for (i = 0; i < 10; i++) { a = Math.PI / 5 * i - Math.PI / 2; ring.push((Math.cos(a) * 54).toFixed(1) + ',' + (Math.sin(a) * 54).toFixed(1)); }
    return '<svg class="massistant-sigil' + (cls ? ' ' + cls : '') + '" viewBox="-60 -60 120 120" aria-hidden="true" focusable="false"><polygon class="s-ring" points="' + ring.join(' ') + '"/><circle class="s-orbit" r="34"/><polygon class="s-star" points="' + pts.join(' ') + '"/><circle class="s-core" r="5"/><circle class="s-moon" cx="34" cy="0" r="3.4"/></svg>';
  }
  var SEND = '<svg class="ic" viewBox="0 0 20 20" aria-hidden="true" focusable="false"><path d="M16.5 10h-12M9 4.500 3.500 10 9 15.500"/></svg>';
  var GEAR = '<svg class="ic" viewBox="0 0 20 20" aria-hidden="true" focusable="false"><path d="M3.500 6h7M14.500 6h2M3.500 14h2M9.500 14h7"/><circle cx="12.500" cy="6" r="2"/><circle cx="7.500" cy="14" r="2"/></svg>';
  var STOP = '<svg class="ic" viewBox="0 0 20 20" aria-hidden="true" focusable="false"><rect x="5.500" y="5.500" width="9" height="9" rx="1.500"/></svg>';

  /* Text to safe HTML: escapes everything, keeps line breaks, **bold**, "- " lists, and isolates Latin/number runs for bidi. */
  var TEL = /^(16328|08008880700|16000|123|122)$/;
  function inline(s, care) {
    var out = '', re = /\*\*([^*]+)\*\*|([A-Za-zηχα²][A-Za-z0-9ηχα²_\-]*(?:[ ]?[(=<>≤≥+×,.:\/%][ ]?[A-Za-z0-9ηχα²_.\-()%]+)*)|(\d+(?:\.\d+)?%?)/g, last = 0, m;
    while ((m = re.exec(s))) {
      out += esc(s.slice(last, m.index));
      if (m[1] != null) out += '<strong>' + inline(m[1]) + '</strong>';
      else if (care && m[3] && TEL.test(m[3])) out += '<a class="massistant-tel num" dir="ltr" href="tel:' + m[3] + '">' + m[3] + '</a>';
      else out += '<bdi dir="ltr"' + (m[3] ? ' class="num"' : '') + '>' + esc(m[0]) + '</bdi>';
      last = m.index + m[0].length;
    }
    return out + esc(s.slice(last));
  }
  function fmt(text, care) {
    var lines = String(text || '').replace(/\r/g, '').split('\n'), h = '', list = false, para = [];
    function flush() { if (para.length) { h += '<p>' + para.join('<br>') + '</p>'; para = []; } }
    lines.forEach(function (l) {
      var m = /^\s*[-•]\s+(.*)$/.exec(l);
      if (m) { flush(); if (!list) { h += '<ul>'; list = true; } h += '<li>' + inline(m[1], care) + '</li>'; return; }
      if (list) { h += '</ul>'; list = false; }
      if (!l.trim()) flush(); else para.push(inline(l, care));
    });
    if (list) h += '</ul>'; flush();
    return h;
  }

  /* ---------- view ---------- */
  function shell(page) {
    return '<div class="massistant' + (page ? ' is-page' : ' is-sheet') + '" data-mode="offline">' +
      '<header class="massistant-top">' +
        '<div class="massistant-id">' + sigil() + '<div><p class="massistant-kicker">المساعد الذكي</p>' + (page ? '<h1 class="massistant-name" lang="en" dir="ltr">Instinct</h1>' : '<h2 class="massistant-name" id="massistant-dlg-t" lang="en" dir="ltr">Instinct</h2>') + '</div></div>' +
        '<div class="massistant-bar">' +
          '<button type="button" class="massistant-badge" data-act="settings" aria-haspopup="dialog"><span class="massistant-dot" aria-hidden="true"></span><span class="massistant-badge-t"></span></button>' +
          '<button type="button" class="btn icon" data-act="export" aria-label="نزّل المحادثة كملف نصي" title="نزّل المحادثة">' + ic('download') + '</button>' +
          '<button type="button" class="btn icon" data-act="clear" aria-label="امسح المحادثة" title="امسح المحادثة">' + ic('trash') + '</button>' +
          '<button type="button" class="btn icon" data-act="settings" aria-label="الإعدادات" title="الإعدادات">' + GEAR + '</button>' +
          (page ? '' : '<button type="button" class="btn icon" data-act="close" aria-label="اقفل المساعد">' + ic('close') + '</button>') +
        '</div>' +
      '</header>' +
      '<div class="massistant-body">' +
        '<div class="massistant-main">' +
          '<div class="massistant-ctx" hidden></div>' +
          '<div class="massistant-hero"></div>' +
          '<div class="massistant-thread" role="log" aria-live="polite" aria-label="المحادثة"></div>' +
          '<p class="massistant-status" role="status" aria-live="polite"></p>' +
        '</div>' +
        '<aside class="massistant-side" aria-label="محفوظاتي"></aside>' +
      '</div>' +
      '<form class="massistant-compose" novalidate>' +
        '<label class="sr" for="massistant-in' + (page ? '' : '-s') + '">اكتب رسالتك</label>' +
        '<textarea id="massistant-in' + (page ? '' : '-s') + '" class="massistant-in" rows="1" maxlength="2000" placeholder="اسأل عن بحثك، أو قولّي أعمل إيه…" enterkeyhint="send"></textarea>' +
        '<button type="submit" class="massistant-send" aria-label="ابعت">' + SEND + '</button>' +
        '<p class="massistant-fine">المساعد بيشرح ويساعد في الشغل. مش بيشخّص، مش بيقيّم قدرة طفل، وممكن يغلط: راجع المهم مع مشرفك أو متخصص.</p>' +
      '</form></div>';
  }

  function mount(root, opts) {
    root.innerHTML = shell(opts.page);
    var el = root.firstChild, me = { root: el, page: !!opts.page, thread: $('.massistant-thread', el), input: $('.massistant-in', el), tab: '' };
    ui = me;
    el.addEventListener('click', function (e) {
      var b = e.target.closest('[data-act],[data-say],[data-go],[data-confirm],[data-tab],[data-rm],[data-copy]'); if (!b || !el.contains(b)) return;
      if (b.hasAttribute('data-say')) return send(b.getAttribute('data-say'));
      if (b.hasAttribute('data-go')) { var hsh = b.getAttribute('data-go'); if (sheet) closeSheet(); H.go(hsh); return; }
      if (b.hasAttribute('data-confirm')) return decide(b.getAttribute('data-id'), b.getAttribute('data-confirm') === 'yes');
      if (b.hasAttribute('data-tab')) { me.tab = b.getAttribute('data-tab'); return drawHero(); }
      if (b.hasAttribute('data-rm')) return removeSaved(b.getAttribute('data-rm'), b.getAttribute('data-id'));
      if (b.hasAttribute('data-copy')) return copyDraft(b.getAttribute('data-copy'));
      var act = b.getAttribute('data-act');
      if (act === 'settings') openSettings();
      else if (act === 'export') exportChat();
      else if (act === 'clear') clearChat(b);
      else if (act === 'close') closeSheet();
    });
    $('.massistant-compose', el).addEventListener('submit', function (e) {
      e.preventDefault();
      if (busy && abort) { abort.abort(); return; }
      var v = me.input.value.trim(); if (!v) return;
      me.input.value = ''; grow(); send(v);
    });
    me.input.addEventListener('keydown', function (e) { if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); $('.massistant-compose', el).requestSubmit(); } });
    me.input.addEventListener('input', grow);
    function grow() { me.input.style.setProperty('height', 'auto'); me.input.style.setProperty('height', Math.min(me.input.scrollHeight, 160) + 'px'); }
    drawAll();
    if (opts.context) setContext(opts.context);
    return me;
  }
  function drawAll() { if (!ui) return; drawBadge(); drawHero(); drawThread(); drawSide(); }
  function drawBadge() {
    if (!ui) return;
    var m = mode(); ui.root.setAttribute('data-mode', m === 'offline' ? 'offline' : 'model');
    $('.massistant-badge-t', ui.root).textContent = modeLabel();
    $('.massistant-badge', ui.root).setAttribute('aria-label', 'الوضع الحالي: ' + modeLabel() + '. افتح الإعدادات');
  }
  function drawHero() {
    if (!ui) return;
    var box = $('.massistant-hero', ui.root), d = D();
    if (d.msgs.length) { box.innerHTML = ''; box.hidden = true; return; }
    box.hidden = false;
    var role = ui.tab || H.state().role || 'researcher', list = C.starters(role);
    box.innerHTML = '<div class="massistant-hero-head">' + sigil('big') +
      '<div><p class="mega massistant-mega">قولّي واقف فين، <em>ونكمّل سوا</em></p>' +
      '<p class="lead">' + (mode() === 'offline' ? 'شغّال دلوقتي من غير نت: بجاوب من قاعدة معرفة مكتوبة بعناية، بحسب، وبنفّذ جوه المنصة بعد ما تأكّد. لو معرفش هقولك.' : 'موصّل بنموذج لغوي. بيقرا مشاريعك بإذنك، وأي تغيير بيتعرض عليك الأول.') + '</p></div></div>' +
      '<div class="massistant-roles" role="tablist" aria-label="اقتراحات حسب الدور">' + Object.keys(C.roles).map(function (k) { return '<button type="button" role="tab" data-tab="' + k + '" aria-selected="' + (k === role) + '"' + (k === role ? ' class="on"' : '') + '>' + C.roles[k] + '</button>'; }).join('') + '</div>' +
      '<div class="massistant-starts">' + list.map(function (q, i) {
        return '<button type="button" class="massistant-start' + (i === 0 ? ' lead-q' : '') + '" data-say="' + esc(q) + '"><span>' + esc(q) + '</span>' + ic('fwd') + '</button>';
      }).join('') + '</div>';
  }
  function msgHtml(m, last) {
    var cls = 'massistant-msg ' + (m.r === 'u' ? 'me' : 'it') + (m.src === 'safety' ? ' care' : '') + (m.err ? ' err' : ''), h;
    h = '<div class="' + cls + '" data-id="' + m.id + '" data-state="done"' + (m.src ? ' data-src="' + esc(m.src) + '"' : '') + '>';
    if (m.r !== 'u') h += '<span class="massistant-who">' + (m.src === 'safety' ? 'مهم' : 'Instinct') + '</span>';
    else h += '<span class="sr">إنت: </span>';
    h += '<div class="massistant-text">' + (m.t ? fmt(m.t, m.src === 'safety') : '') + '</div>';
    if (m.confirm) h += confirmHtml(m);
    if (m.links && m.links.length) h += '<p class="massistant-links">' + m.links.map(function (l) { return '<button type="button" class="btn" data-go="' + esc(l.hash) + '">' + esc(l.label) + ic('fwd') + '</button>'; }).join('') + '</p>';
    if (m.flags && m.flags.length) h += '<div class="massistant-flags"><p class="massistant-flags-t">راجع قبل ما تعتمد</p><ul>' + m.flags.map(function (f) { return '<li>' + inline(f) + '</li>'; }).join('') + '</ul></div>';
    if (m.checked) h += '<p class="massistant-meta">' + ic('check') + 'اتراجعت مراجعة تانية وملقتش ملاحظات. ده مش ضمان.</p>';
    if (last && m.chips && m.chips.length) h += '<p class="massistant-chips">' + m.chips.map(function (c) { return '<button type="button" data-say="' + esc(c) + '">' + esc(c) + '</button>'; }).join('') + '</p>';
    return h + '</div>';
  }
  function confirmHtml(m) {
    var c = m.confirm, t = C.tool(c.tool), pv = null;
    if (c.state === 'pending') { try { pv = !C.validate(t, c.args) && t.preview(c.args); } catch (e) { pv = null; } if (!pv) c.state = 'stale'; }
    if (c.state !== 'pending') return '<p class="massistant-meta">' + (c.state === 'done' ? ic('check') + 'اتنفّذ بموافقتك.' : c.state === 'stale' ? 'الطلب ده مبقاش ينفع يتنفّذ.' : 'اتلغى، ومتغيّرش حاجة.') + '</p>';
    return '<div class="massistant-confirm" role="group" aria-label="تأكيد التغيير"><p class="massistant-confirm-k">محتاج تأكيدك</p><p class="massistant-confirm-t">' + esc(pv.title) + '</p><dl>' +
      pv.rows.map(function (r) { return '<div><dt>' + esc(r[0]) + '</dt><dd>' + inline(r[1]) + '</dd></div>'; }).join('') + '</dl>' + (pv.note ? '<p class="massistant-confirm-n">' + esc(pv.note) + '</p>' : '') +
      '<p class="row"><button type="button" class="btn inked" data-confirm="yes" data-id="' + m.id + '">نفّذ</button><button type="button" class="btn onblock" data-confirm="no" data-id="' + m.id + '">إلغاء</button></p></div>';
  }
  function drawThread() {
    if (!ui) return;
    var ms = D().msgs;
    ui.thread.innerHTML = ms.map(function (m, i) { return msgHtml(m, i === ms.length - 1); }).join('');
    ui.thread.hidden = !ms.length;
    scrollEnd(true);
  }
  function scrollEnd(instant) {
    if (!ui) return;
    var lastEl = ui.thread.lastElementChild; if (!lastEl) return;
    if (ui.page) { var r = lastEl.getBoundingClientRect(), limit = window.innerHeight - ($('.massistant-compose', ui.root).offsetHeight + 96); if (r.bottom > limit) window.scrollBy({ top: r.bottom - limit, behavior: instant || H.calm() ? 'auto' : 'smooth' }); }
    else { var b = $('.massistant-body', ui.root); b.scrollTop = b.scrollHeight; }
  }
  function drawSide() {
    if (!ui) return;
    var d = D(), h = '';
    h += '<details class="massistant-fold"' + (d.reading.length ? ' open' : '') + '><summary>قايمة القراءة<span class="num">' + d.reading.length + '</span></summary>' + (d.reading.length ? '<ul class="massistant-saved">' + d.reading.map(function (x) {
      var u = /^https?:\/\//i.test(x.url || '') ? x.url : '';
      return '<li><div>' + (u ? '<a href="' + esc(u) + '" target="_blank" rel="noopener noreferrer">' + esc(x.title) + '</a>' : '<span>' + esc(x.title) + '</span>') + (x.note ? '<small>' + esc(x.note) + '</small>' : '') + '</div><button type="button" class="btn icon" data-rm="reading" data-id="' + x.id + '" aria-label="شيل «' + esc(x.title) + '» من القايمة">' + ic('close') + '</button></li>';
    }).join('') + '</ul>' : '<p class="massistant-none">فاضية. قول: «ضيف لقايمة القراءة: العنوان».</p>') + '</details>';
    h += '<details class="massistant-fold"' + (d.drafts.length ? ' open' : '') + '><summary>مسوداتي<span class="num">' + d.drafts.length + '</span></summary>' + (d.drafts.length ? '<ul class="massistant-saved">' + d.drafts.map(function (x) {
      return '<li><div><span>' + esc(x.kind) + '</span><small class="num">' + esc(x.added) + '</small></div><button type="button" class="btn" data-copy="' + x.id + '">انسخ</button><button type="button" class="btn icon" data-rm="drafts" data-id="' + x.id + '" aria-label="امسح مسودة ' + esc(x.kind) + '">' + ic('close') + '</button></li>';
    }).join('') + '</ul>' : '<p class="massistant-none">هنا بتتحفظ هياكل ABC و5Ps اللي تطلبها.</p>') + '</details>';
    h += '<div class="massistant-can"><h3>بيعمل إيه؟</h3><ul><li>بيجاوب عن المنهج والإحصاء والقياس</li><li>بيرشّح اختبار وبيحسب حجم عينة</li><li>بينشئ مشروع وبيملى خانة كمسودة</li><li>بيجهّز سجل ABC وصياغة 5Ps</li></ul><h3>مش بيعمل إيه؟</h3><ul><li>مش بيشخّص ولا بيقيّم قدرة طفل</li><li>مش بيألّف مراجع</li><li>مش بيكتب رسالتك بدلك</li></ul></div>';
    $('.massistant-side', ui.root).innerHTML = h;
  }
  function removeSaved(kind, id) { var d = D(); d[kind] = d[kind].filter(function (x) { return x.id !== id; }); save(); drawSide(); }
  function copyDraft(id) {
    var x = D().drafts.filter(function (y) { return y.id === id; })[0]; if (!x) return;
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(x.text).then(function () { H.toast('اتنسخت'); }, function () { H.toast('مقدرناش ننسخ. افتحها من المحادثة وانسخها يدوي.'); });
    else H.toast('المتصفح ده مش بيسمح بالنسخ التلقائي.');
  }
  function setContext(c) {
    if (!ui || !c) return;
    var p = c.project ? H.state().projects.filter(function (x) { return x.id === c.project; })[0] : null, bits = [];
    if (p) { C.noteProject(p.id); bits.push('مشروع «' + (p.title || 'من غير عنوان') + '»'); }
    if (c.label) bits.push(String(c.label).slice(0, 80));
    ui.context = bits.join(' · ');
    var box = $('.massistant-ctx', ui.root); box.hidden = !bits.length; box.textContent = bits.length ? 'السياق: ' + ui.context : '';
  }

  /* ---------- conversation ---------- */
  function add(m) { m.id = H.uid(); m.ts = Date.now(); D().msgs.push(m); save(); return m; }
  function status(t) { if (ui) $('.massistant-status', ui.root).textContent = t || ''; }
  function setBusy(b) {
    busy = b; if (!ui) return;
    ui.root.classList.toggle('is-busy', b);
    var btn = $('.massistant-send', ui.root); btn.innerHTML = b && abort ? STOP : SEND; btn.setAttribute('aria-label', b && abort ? 'وقّف' : 'ابعت');
  }
  /* Shows an answer. Text appears progressively unless reduced motion is on. */
  function say(m, done) {
    add(m);
    if (!ui) return done && done();
    drawHero();
    $$('.massistant-chips', ui.thread).forEach(function (x) { x.remove(); });
    ui.thread.hidden = false;
    ui.thread.insertAdjacentHTML('beforeend', msgHtml(m, true));
    var node = ui.thread.lastElementChild, box = $('.massistant-text', node), full = m.t || '';
    if (m.r === 'u' || H.calm() || full.length < 12) { scrollEnd(); return done && done(); }
    node.setAttribute('data-state', 'typing'); box.textContent = '';
    var i = 0, step = Math.max(2, Math.ceil(full.length / 40));
    (function tick() {
      if (!node.isConnected) return done && done();
      i += step; box.textContent = full.slice(0, i);
      if (i < full.length) { scrollEnd(true); return window.setTimeout(tick, 16); }
      box.innerHTML = fmt(full, m.src === 'safety'); node.setAttribute('data-state', 'done'); scrollEnd(); if (done) done();
    })();
  }
  function fromReply(r) { return { r: 'a', t: r.text, chips: r.chips || [], links: r.links || [], src: r.src || '' }; }
  function fromTool(res) { return { r: 'a', t: res.say, links: res.link ? [res.link] : [], src: 'tool' }; }

  function send(text) {
    text = String(text || '').trim().slice(0, 2000); if (!text) return;
    ready(function () {
      var d = D(), lastM = d.msgs[d.msgs.length - 1], n = C.norm(text);
      if (busy && !waiting) return;
      say({ r: 'u', t: text });
      if (lastM && lastM.confirm && lastM.confirm.state === 'pending') {
        var held = !!waiting;
        if (!C.crisisIn(text) && /^(ايوه|اه|تمام|نفذ|موافق|اوكي|ok|ماشي|يلا|اكيد|نعم)( |$)/.test(n)) return decide(lastM.id, true);
        if (!C.crisisIn(text) && /^(لا|الغي|الغاء|بلاش|مش عايز|مش عاوز|cancel)( |$)/.test(n)) return decide(lastM.id, false);
        decide(lastM.id, false, true);
        if (held && !C.crisisIn(text)) return;
      }
      var kind = C.crisisIn(text);
      if (mode() === 'offline' || kind) return offline(text);
      if (!d.cfg.consent) return askConsent(function (ok) { if (ok) online(text); else { drawBadge(); offline(text); } });
      online(text);
    });
  }
  function offline(text) {
    var r = C.think(text, { role: H.state().role });
    if (!r.call) return say(fromReply(r));
    var t = C.tool(r.call.tool), bad = C.validate(t, r.call.args);
    if (bad) return say({ r: 'a', t: 'ناقصني حاجة علشان أنفّذ ده (' + bad + '). اكتبها لي تاني بتفصيل أكتر.', src: 'ask' });
    if (t.mutates) return say({ r: 'a', t: r.lead || '', confirm: { tool: t.name, args: r.call.args, state: 'pending' }, src: 'confirm' });
    setBusy(true);
    C.runTool(t.name, r.call.args).then(function (res) { setBusy(false); C.noteProject(res.project); say(fromTool(res)); });
  }
  /* The user's answer to a pending change. In model mode this resolves the promise the agent loop waits on. */
  function decide(id, yes, quiet) {
    var d = D(), m = d.msgs.filter(function (x) { return x.id === id; })[0]; if (!m || !m.confirm || m.confirm.state !== 'pending') return;
    var t = C.tool(m.confirm.tool), w = waiting && waiting.id === id ? waiting : null;
    m.confirm.state = yes ? 'done' : 'cancelled'; save();
    if (ui) { var node = $('[data-id="' + id + '"]', ui.thread); if (node) node.outerHTML = msgHtml(m, false); }
    if (w) { waiting = null; return w.resolve(yes); }
    if (!yes) { if (!quiet) say({ r: 'a', t: 'تمام، متغيّرش حاجة.', src: 'ask' }); return; }
    C.runTool(t.name, m.confirm.args).then(function (res) { C.noteProject(res.project); if (!res.ok) { m.confirm.state = 'stale'; save(); } say(fromTool(res)); drawSide(); });
  }

  function online(text) {
    var d = D(), cfg = { mode: mode(), base: baseUrl(), key: getKey(), provider: d.cfg.provider, model: d.cfg.model, client: d.cfg.client, token: '' };
    var hist = d.msgs.filter(function (m) { return m.t && !m.err && m.src !== 'safety' && !m.confirm; }).slice(-12).map(function (m) { return { role: m.r === 'u' ? 'user' : 'assistant', content: m.t }; });
    if (ui && ui.context && hist.length) hist[hist.length - 1].content = '[السياق الحالي في المنصة: ' + ui.context + ']\n' + hist[hist.length - 1].content;
    var hold = cfg.mode === 'worker' && d.cfg.redteam, live = null, buf = '', links = [];
    abort = window.AbortController ? new AbortController() : null;
    setBusy(true); status(hold ? 'بيكتب، وبعدها هيراجع الإجابة…' : 'بيكتب…');
    function liveNode() {
      if (live || !ui) return live;
      drawHero(); ui.thread.hidden = false;
      $$('.massistant-chips', ui.thread).forEach(function (x) { x.remove(); });
      ui.thread.insertAdjacentHTML('beforeend', '<div class="massistant-msg it" data-state="typing"><span class="massistant-who">Instinct</span><div class="massistant-text"></div></div>');
      return live = ui.thread.lastElementChild;
    }
    var io = {
      delta: function (t) { buf += t; if (hold || !liveNode()) return; $('.massistant-text', live).textContent = buf; scrollEnd(true); },
      status: function () { status('بينفّذ جوه المنصة…'); },
      tool: function (name, res) { C.noteProject(res.project); if (res.link) links.push(res.link); drawSide(); },
      confirm: function (t, args) {
        if (live) { live.remove(); live = null; }
        var lead = buf.trim(); buf = '';
        status('مستني تأكيدك');
        return new Promise(function (resolve) {
          var m = { r: 'a', t: lead, confirm: { tool: t.name, args: args, state: 'pending' }, src: 'confirm' };
          say(m, function () { waiting = { id: m.id, resolve: function (yes) { status('بيكمّل…'); resolve(yes); } }; });
        });
      }
    };
    var tokenP = window.HubAuth && typeof window.HubAuth.idToken === 'function' ? Promise.resolve(window.HubAuth.idToken()).catch(function () { return ''; }) : Promise.resolve('');
    tokenP.then(function (tok) { cfg.token = typeof tok === 'string' ? tok : ''; return C.agent(cfg, hist, io, abort && abort.signal); }).then(function (out) {
      var answer = (out.text || buf || '').trim() || 'النموذج مرجّعش رد. جرّب تاني.';
      if (out.meta && out.meta.provider) { d.cfg.seen = out.meta.provider; drawBadge(); }
      var flags = C.refFlags(answer), science = answer.length > 260 || /\d/.test(answer);
      var check = hold && science ? (status('بيراجع الإجابة مراجعة تانية…'), C.redTeam(cfg, text, answer, abort && abort.signal)) : Promise.resolve(null);
      return check.then(function (issues) {
        if (live) { live.remove(); live = null; }
        say({ r: 'a', t: answer, links: links.slice(0, 3), flags: flags.concat(issues || []), checked: !!(issues && !issues.length && !flags.length), src: 'model' });
      });
    }).catch(function (e) {
      if (live) { live.remove(); live = null; }
      if (waiting) waiting = null;
      if (e && e.name === 'AbortError') return say({ r: 'a', t: (buf.trim() ? buf.trim() + '\n\n' : '') + 'وقّفت الرد زي ما طلبت.', src: 'model' });
      var code = e && e.code || 'unknown';
      if (code === 'network' && Date.now() - blockedAt < 4000) code = 'blocked';
      say({ r: 'a', t: (C.errors[code] || C.errors.unknown) + '\n\nهجاوبك دلوقتي من الوضع بدون اتصال:', err: code, src: 'error' }, function () { offline(text); });
    }).then(function () { abort = null; setBusy(false); status(''); });
  }

  /* ---------- export and clear ---------- */
  function exportChat() {
    var ms = D().msgs; if (!ms.length) return H.toast('مفيش محادثة لسه.');
    var text = 'Instinct - محادثة من منصة مَلَكة\n' + H.today() + '\nالوضع: ' + modeLabel() + '\n\n' + ms.map(function (m) { return (m.r === 'u' ? 'إنت' : 'Instinct') + ':\n' + (m.t || '') + (m.confirm ? '\n[طلب تغيير: ' + m.confirm.tool + ' - ' + (m.confirm.state === 'done' ? 'اتنفّذ' : 'متنفّذش') + ']' : '') + (m.flags && m.flags.length ? '\n[للمراجعة: ' + m.flags.join(' | ') + ']' : ''); }).join('\n\n') + '\n\nتنبيه: المحادثة دي للمساعدة والشرح. مش تشخيص ولا بديل عن مشرفك أو متخصص.\n';
    try {
      var url = URL.createObjectURL(new Blob(['﻿' + text], { type: 'text/plain;charset=utf-8' })), a = document.createElement('a');
      a.href = url; a.download = 'instinct-' + H.today() + '.txt'; document.body.appendChild(a); a.click(); a.remove();
      window.setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
      H.toast('اتنزّلت المحادثة');
    } catch (e) { H.toast('مقدرناش ننزّل الملف من المتصفح ده.'); }
    window.HubAssistant.lastExport = text;
  }
  function clearChat(btn) {
    if (!D().msgs.length) return H.toast('المحادثة فاضية.');
    if (btn.getAttribute('data-arm') !== '1') {
      btn.setAttribute('data-arm', '1'); btn.classList.add('armed'); btn.setAttribute('aria-label', 'دوس تاني علشان تمسح المحادثة');
      H.toast('دوس تاني علشان تمسح المحادثة');
      window.setTimeout(function () { btn.removeAttribute('data-arm'); btn.classList.remove('armed'); btn.setAttribute('aria-label', 'امسح المحادثة'); }, 4000);
      return;
    }
    if (abort) abort.abort();
    D().msgs = []; save(); C.reset(); waiting = null; drawAll(); H.toast('اتمسحت المحادثة');
  }

  /* ---------- dialogs: settings and privacy ---------- */
  function dialog(cls, label, html) {
    var dlg = document.createElement('dialog'); dlg.className = 'massistant-dlg ' + cls; dlg.setAttribute('aria-labelledby', label);
    dlg.innerHTML = html; document.body.appendChild(dlg);
    dlg.addEventListener('close', function () { dlg.remove(); });
    dlg.addEventListener('click', function (e) { if (e.target === dlg) dlg.close('x'); });
    if (dlg.showModal) dlg.showModal(); else dlg.setAttribute('open', '');
    return dlg;
  }
  function privacyHtml() {
    return '<ul class="massistant-priv">' +
      '<li><strong>إيه اللي بيتبعت:</strong> نص رسائلك في المحادثة دي، دورك (باحث، طالب…)، ونتايج الأدوات اللي المساعد يستخدمها، زي عناوين مشاريعك وأسماء متغيراتها.</li>' +
      '<li><strong>لمين:</strong> لخادم المنصة، وهو بيوصّلها لمزوّد النموذج اللغوي اللي صاحب المنصة اختاره. في «وضع مفتاحي» بتروح من متصفحك للمزوّد مباشرة.</li>' +
      '<li><strong>الأسماء بتتبدّل بأكواد:</strong> أسماء الأطفال وأولياء الأمور المسجلين عندك بتتحوّل على جهازك لأكواد زي «طفل-1» قبل الإرسال، والإيميلات وأرقام التليفونات بتتشال. الخادم بيعيد الفحص ده تاني.</li>' +
      '<li><strong>اللي مش بيتبعت:</strong> باقي بياناتك على الجهاز، إلا لو المساعد طلب يقراها بأداة وإنت شايف ده في المحادثة.</li>' +
      '<li><strong>الخادم مش بيحفظ المحادثات.</strong> بيعدّ عدد الطلبات بس علشان الحصة اليومية. مزوّد النموذج ليه سياسته في الاحتفاظ بالبيانات.</li>' +
      '<li><strong>متكتبش</strong> اسم طفل أو مدرسته أو أي حاجة تعرّفه. استخدم كود.</li></ul>' +
      '<p class="small muted">الوضع بدون اتصال مش بيبعت أي حاجة ومش محتاج موافقة.</p>';
  }
  function askConsent(done) {
    var dlg = dialog('priv', 'massistant-priv-t', '<h2 id="massistant-priv-t">قبل ما نستخدم النموذج</h2>' + privacyHtml() +
      '<p class="row massistant-dlg-end"><button type="button" class="btn primary" value="yes">موافق، كمّل</button><button type="button" class="btn" value="no">خلّيني بدون اتصال</button></p>');
    var answered = false;
    $$('button[value]', dlg).forEach(function (b) { b.addEventListener('click', function () { answered = true; var yes = b.value === 'yes', c = D().cfg; if (yes) c.consent = true; else c.mode = 'offline'; save(); dlg.close(); done(yes); }); });
    dlg.addEventListener('close', function () { if (!answered) { D().cfg.mode = 'offline'; save(); done(false); } });
  }
  function openSettings() {
    var c = D().cfg, cur = c.mode || (siteBase() ? 'worker' : 'offline'), key = getKey();
    function radio(v, t, s) { return '<label class="massistant-opt"><input type="radio" name="massistant-mode" value="' + v + '"' + (cur === v ? ' checked' : '') + '><span><strong>' + t + '</strong><small>' + s + '</small></span></label>'; }
    var dlg = dialog('set', 'massistant-set-t', '<form method="dialog" class="massistant-set" novalidate><h2 id="massistant-set-t">إعدادات المساعد</h2>' +
      '<fieldset><legend>طريقة الشغل</legend>' +
      radio('offline', 'بدون اتصال: قواعد وبحث', 'شغّال دايماً ومن غير نت. مفيش حاجة بتتبعت.') +
      radio('worker', 'نموذج عن طريق خادم المنصة', 'محتاج عنوان الخادم. فيه حصة يومية.') +
      radio('byok', 'وضع مفتاحي', 'بمفتاحك الشخصي من المزوّد، ومحفوظ على جهازك ده بس.') + '</fieldset>' +
      '<div class="massistant-pane" data-for="worker"><label for="massistant-base">عنوان الخادم<span class="hint">' + (siteBase() ? 'المنصة مظبوطة على خادم جاهز. سيبه فاضي علشان تستخدمه.' : 'الرابط اللي بيطلع بعد نشر الخادم، وبيبدأ بـ https://') + '</span></label><input id="massistant-base" type="url" dir="ltr" inputmode="url" autocomplete="off" spellcheck="false" placeholder="https://…workers.dev" value="' + esc(c.base) + '">' +
      '<p class="row"><button type="button" class="btn" id="massistant-test">اختبر الاتصال</button><span class="small" id="massistant-test-r" role="status"></span></p>' +
      '<label class="check" for="massistant-red"><input type="checkbox" id="massistant-red"' + (c.redteam ? ' checked' : '') + '><span>مراجعة تانية للإجابات العلمية قبل عرضها. بتستهلك طلب زيادة من الحصة.</span></label></div>' +
      '<div class="massistant-pane" data-for="byok"><label for="massistant-prov">المزوّد</label><select id="massistant-prov"><option value="gemini"' + (c.provider === 'gemini' ? ' selected' : '') + '>Google Gemini</option><option value="claude"' + (c.provider === 'claude' ? ' selected' : '') + '>Anthropic Claude</option></select>' +
      '<label for="massistant-model">اسم النموذج<span class="hint">سيبه فاضي للافتراضي. راجع الأسماء الحالية من موقع المزوّد.</span></label><input id="massistant-model" type="text" dir="ltr" autocomplete="off" spellcheck="false" value="' + esc(c.model) + '">' +
      '<label for="massistant-key">المفتاح<span class="hint">' + (key ? 'فيه مفتاح محفوظ على الجهاز. اكتب مفتاح جديد لو عايز تغيّره.' : 'بيتحفظ على الجهاز ده بس، وبيتبعت للمزوّد مباشرة.') + '</span></label><input id="massistant-key" type="password" dir="ltr" autocomplete="off" spellcheck="false" placeholder="' + (key ? '••••••••' : '') + '">' +
      '<p class="notice small">أي حد يستخدم المتصفح ده يقدر يوصل للمفتاح، فمتحطوش على جهاز مشترك. والوضع ده بيشتغل بس لو إعدادات أمان الموقع سامحة بعنوان المزوّد.</p>' +
      (key ? '<p><button type="button" class="btn danger" id="massistant-forget">امسح المفتاح من الجهاز</button></p>' : '') + '</div>' +
      '<details class="massistant-fold in-dlg"><summary>إيه اللي بيتبعت في وضع النموذج؟</summary>' + privacyHtml() + '</details>' +
      '<p class="small err" id="massistant-set-err" role="alert"></p>' +
      '<p class="row massistant-dlg-end"><button type="submit" class="btn primary" value="save">احفظ</button><button type="button" class="btn" id="massistant-cancel">إلغاء</button></p></form>');
    function panes() { var v = ($('input[name="massistant-mode"]:checked', dlg) || {}).value; $$('.massistant-pane', dlg).forEach(function (p) { p.hidden = p.getAttribute('data-for') !== v; }); }
    $$('input[name="massistant-mode"]', dlg).forEach(function (r) { r.addEventListener('change', panes); }); panes();
    $('#massistant-cancel', dlg).addEventListener('click', function () { dlg.close('x'); });
    var fg = $('#massistant-forget', dlg); if (fg) fg.addEventListener('click', function () { setKey(''); if (D().cfg.mode === 'byok') { D().cfg.mode = 'offline'; save(); } dlg.close('x'); drawAll(); H.toast('اتمسح المفتاح'); });
    $('#massistant-test', dlg).addEventListener('click', function () {
      var out = $('#massistant-test-r', dlg), b = ($('#massistant-base', dlg).value.trim() || siteBase()).replace(/\/+$/, '');
      if (!/^https?:\/\//.test(b)) { out.textContent = 'اكتب عنوان يبدأ بـ https://'; return; }
      out.textContent = 'بنجرّب…';
      fetch(b + '/v1/health').then(function (r) { return r.ok ? r.json() : Promise.reject(); }).then(function (j) { out.textContent = j && j.ok ? 'الخادم شغّال' + (j.providers && j.providers.length ? ': ' + j.providers.join('، ') : '') : 'الخادم رد برد مش متوقع.'; }, function () { out.textContent = 'مفيش رد. اتأكد من العنوان، ومن إن أمان الموقع سامح بيه.'; });
    });
    $('form', dlg).addEventListener('submit', function (e) {
      e.preventDefault();
      var v = ($('input[name="massistant-mode"]:checked', dlg) || {}).value || 'offline', err = $('#massistant-set-err', dlg), base = $('#massistant-base', dlg).value.trim(), nk = $('#massistant-key', dlg).value.trim();
      if (v === 'worker' && !/^https:\/\/[^\s]+$|^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?/.test(base || siteBase())) { err.textContent = 'اكتب عنوان الخادم كامل ويبدأ بـ https://'; return; }
      if (v === 'byok' && !nk && !getKey()) { err.textContent = 'اكتب المفتاح الأول.'; return; }
      var c2 = D().cfg, was = mode();
      c2.mode = v; c2.base = base; c2.redteam = $('#massistant-red', dlg).checked; c2.provider = $('#massistant-prov', dlg).value === 'claude' ? 'claude' : 'gemini'; c2.model = $('#massistant-model', dlg).value.trim().slice(0, 80);
      if (nk) setKey(nk);
      save(); dlg.close('save');
      function finish() { drawAll(); H.toast('اتحفظ'); }
      if (v !== 'offline' && !c2.consent && was === 'offline') askConsent(finish); else finish();
    });
  }

  /* ---------- the panel other pages open ---------- */
  function openSheet(opts) {
    opts = opts || {};
    if ((location.hash || '').slice(1).split('/')[0] === 'assistant' && ui && ui.page && ui.root.isConnected) { setContext(opts.context); ui.input.focus(); return; }
    if (sheet) { setContext(opts.context); return; }
    sheet = document.createElement('dialog'); sheet.className = 'massistant-dlg massistant-panel'; sheet.setAttribute('aria-labelledby', 'massistant-dlg-t');
    document.body.appendChild(sheet);
    sheet.addEventListener('close', function () { if (sheet) sheet.remove(); sheet = null; if (ui && !ui.page) ui = null; });
    sheet.addEventListener('click', function (e) { if (e.target === sheet) closeSheet(); });
    mount(sheet, { page: false, context: opts.context });
    if (sheet.showModal) sheet.showModal(); else sheet.setAttribute('open', '');
    ui.input.focus();
    if (opts.ask) send(opts.ask);
  }
  function closeSheet() { var s = sheet; if (!s) return; sheet = null; if (ui && !ui.page) ui = null; if (s.close && s.open) s.close(); s.remove(); }

  window.HubAssistant = {
    open: function (opts) { ready(function () { openSheet(opts); }); },
    close: closeSheet,
    ask: function (text) { send(text); },
    lastExport: ''
  };

  H.register('assistant', function (main, a, b) {
    if (sheet) closeSheet();
    main.innerHTML = '<header class="head"><h1>المساعد الذكي</h1><p class="lead" role="status">جارٍ التحميل…</p></header>';
    ready(function () {
      if ((location.hash || '').slice(1).split('/')[0] !== 'assistant') return;
      mount(main, { page: true });
      /* #assistant/ask/<text> lets another page hand over a question */
      if (a === 'ask' && b) { var q = ''; try { q = decodeURIComponent(b); } catch (e) {} if (q) { history.replaceState(null, '', '#assistant'); send(q); } }
    });
  });
})();
