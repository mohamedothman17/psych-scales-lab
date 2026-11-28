/* Operations research and decision tools. Shell, shared helpers and the first four tools.
   The calculation core is hub/data/decide-calc.js; the remaining tools are in hub/data/decide-more.js. */
(function () {
  'use strict';
  var H = window.Hub, esc = H.esc, $ = H.$, $$ = H.$$, ic = H.ic;
  var X = window.HubDecide = { tools: {}, order: ['ahp', 'topsis', 'strata', 'power', 'sched', 'queue', 'short'], model: {}, py: {} };
  var C = null, D = null, loaded = false, waiting = null;

  /* ---------- loading the two companion files ---------- */
  function script(src, done) { var s = document.createElement('script'); s.src = src; s.onload = function () { done(true); }; s.onerror = function () { done(false); }; document.head.appendChild(s); }
  function ensure(done) {
    if (loaded) return done(true);
    if (waiting) { waiting.push(done); return; }
    waiting = [done];
    function end(ok) { loaded = ok; C = X.C = window.HubDecideCalc; var q = waiting; waiting = null; q.forEach(function (f) { f(ok); }); }
    script('data/decide-calc.js', function (ok) { if (!ok) return end(false); C = X.C = window.HubDecideCalc; script('data/decide-more.js', end); });
  }

  /* ---------- small helpers ---------- */
  var AR = '٠١٢٣٤٥٦٧٨٩';
  function num(v) {
    if (typeof v === 'number') return v;
    v = String(v == null ? '' : v).trim().replace(/[٠-٩]/g, function (d) { return AR.indexOf(d); }).replace(/[٬\s]/g, '');
    if (/^-?\d{1,3}(,\d{3})+(\.\d+)?$/.test(v)) v = v.replace(/,/g, ''); else v = v.replace(/[٫,،]/g, '.');
    if (v === '') return NaN; var x = Number(v); return isFinite(x) ? x : NaN;
  }
  function fx(x, d) { if (x == null || !isFinite(x)) return '—'; return Number(x).toFixed(d == null ? 2 : d); }
  function f(x, d) { return '<bdi class="num" dir="ltr">' + fx(x, d) + '</bdi>'; }
  function fi(x) { if (x == null || !isFinite(x)) return '—'; var s = String(Math.round(x)).replace(/\B(?=(\d{3})+(?!\d))/g, ','); return '<bdi class="num" dir="ltr">' + s + '</bdi>'; }
  function pct(x, d) { return x == null || !isFinite(x) ? '—' : '<bdi class="num" dir="ltr">' + (x * 100).toFixed(d == null ? 1 : d) + '%</bdi>'; }
  function setPath(o, path, val) { var p = path.split('.'), i; for (i = 0; i < p.length - 1; i++) { if (o[p[i]] == null || typeof o[p[i]] !== 'object') o[p[i]] = {}; o = o[p[i]]; } o[p[p.length - 1]] = val; }
  function inp(path, val, label, o) {
    o = o || {};
    return '<label class="mdc-f' + (o.cls ? ' ' + o.cls : '') + '"><span class="mdc-fl">' + esc(label) + (o.hint ? '<span class="hint">' + esc(o.hint) + '</span>' : '') + '</span><input type="text"' + (o.text ? '' : ' inputmode="decimal" dir="ltr" class="num"') + ' data-p="' + path + '" value="' + esc(val == null ? '' : val) + '"' + (o.ph ? ' placeholder="' + esc(o.ph) + '"' : '') + ' autocomplete="off"></label>';
  }
  function cell(path, val, aria, text, ph) { return '<input type="text"' + (text ? '' : ' inputmode="decimal" dir="ltr" class="num"') + ' data-p="' + path + '" aria-label="' + esc(aria) + '" value="' + esc(val == null ? '' : val) + '"' + (ph ? ' placeholder="' + esc(ph) + '"' : '') + ' autocomplete="off">'; }
  function pick(path, val, label, list, o) {
    o = o || {};
    return '<label class="mdc-f"><span class="mdc-fl">' + esc(label) + (o.hint ? '<span class="hint">' + esc(o.hint) + '</span>' : '') + '</span><select data-p="' + path + '"' + (o.re ? ' data-re' : '') + '>' + H.opts(list, val) + '</select></label>';
  }
  function rm(act, arg, what) { return '<button class="btn icon mdc-x" type="button" data-act="' + act + '" data-arg="' + esc(arg) + '" aria-label="امسح ' + esc(what) + '"><svg class="ic" viewBox="0 0 20 20" aria-hidden="true"><path d="M5 5l10 10M15 5L5 15"/></svg></button>'; }
  function add(act, label, off) { return '<button class="btn mdc-add" type="button" data-act="' + act + '"' + (off ? ' disabled' : '') + '><svg class="ic" viewBox="0 0 20 20" aria-hidden="true"><path d="M10 4v12M4 10h12"/></svg>' + esc(label) + '</button>'; }
  function wait(msg) { return { html: '<div class="mdc-wait"><svg viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="24" r="19" class="a"/><circle cx="24" cy="24" r="11" class="b"/><circle cx="24" cy="24" r="3" class="c"/></svg><p>' + msg + '</p></div>' }; }
  function bars(rows) {
    return '<ol class="mdc-bars">' + rows.map(function (r, i) { return '<li class="' + (r.top ? 'top' : '') + '"><span class="mdc-bar-l">' + (r.rank ? '<b class="num">' + r.rank + '</b>' : '') + esc(r.label) + '</span><span class="mdc-bar-t"><i data-w="' + Math.max(0, Math.min(100, r.frac * 100)).toFixed(2) + '" data-i="' + i + '"></i></span><span class="mdc-bar-v">' + r.val + '</span></li>'; }).join('') + '</ol>';
  }
  var DASH = ['', '7 4', '2 4', '10 3 2 3', '1 5', '12 4'];
  /* o: {x0,x1,y0,y1,xl,yl,series:[{name,pts:[[x,y]]}],vmarks:[{x,label}],hmarks:[{y,label}],xfmt,yfmt,label} */
  function chart(o) {
    var W = 640, Ht = 340, L = 64, R = 22, T = 22, B = 60, pw = W - L - R, ph = Ht - T - B, g = '', i;
    function sx(x) { return L + (x - o.x0) / ((o.x1 - o.x0) || 1) * pw; } function sy(y) { return T + (1 - (y - o.y0) / ((o.y1 - o.y0) || 1)) * ph; }
    var xf = o.xfmt || function (v) { return fx(v, 2); }, yf = o.yfmt || function (v) { return fx(v, 2); };
    for (i = 0; i <= 4; i++) { var yv = o.y0 + (o.y1 - o.y0) * i / 4, yy = sy(yv); g += '<line class="grid" x1="' + L + '" x2="' + (W - R) + '" y1="' + yy.toFixed(1) + '" y2="' + yy.toFixed(1) + '"/><text class="tick" x="' + (L - 8) + '" y="' + (yy + 4).toFixed(1) + '" text-anchor="end">' + yf(yv) + '</text>'; }
    for (i = 0; i <= 4; i++) { var xv = o.x0 + (o.x1 - o.x0) * i / 4, xx = sx(xv); g += '<text class="tick" x="' + xx.toFixed(1) + '" y="' + (Ht - B + 22) + '" text-anchor="middle">' + xf(xv) + '</text>'; }
    g += '<line class="axis" x1="' + L + '" x2="' + (W - R) + '" y1="' + (Ht - B) + '" y2="' + (Ht - B) + '"/>';
    g += '<text class="lab" x="' + (L + pw / 2) + '" y="' + (Ht - 8) + '" text-anchor="middle">' + esc(o.xl || '') + '</text>';
    (o.hmarks || []).forEach(function (m) { if (m.y < o.y0 || m.y > o.y1) return; var y = sy(m.y).toFixed(1); g += '<line class="mark" x1="' + L + '" x2="' + (W - R) + '" y1="' + y + '" y2="' + y + '"/><text class="mlab" x="' + (W - R - 4) + '" y="' + (y - 6) + '" text-anchor="end">' + esc(m.label) + '</text>'; });
    (o.vmarks || []).forEach(function (m, k) { if (m.x < o.x0 || m.x > o.x1) return; var x = sx(m.x), right = x > L + pw * 0.6; g += '<line class="mark v' + (m.cls ? ' ' + m.cls : '') + '" x1="' + x.toFixed(1) + '" x2="' + x.toFixed(1) + '" y1="' + T + '" y2="' + (Ht - B) + '"/><text class="mlab" x="' + (x + (right ? -6 : 6)).toFixed(1) + '" y="' + (T + 14 + k * 24) + '" text-anchor="' + (right ? 'end' : 'start') + '">' + esc(m.label) + '</text>'; });
    o.series.forEach(function (s, k) {
      var d = s.pts.map(function (p, j) { return (j ? 'L' : 'M') + sx(p[0]).toFixed(1) + ' ' + sy(Math.max(o.y0, Math.min(o.y1, p[1]))).toFixed(1); }).join('');
      g += '<path class="ser s' + (k % 6) + '" d="' + d + '"' + (DASH[k % 6] ? ' stroke-dasharray="' + DASH[k % 6] + '"' : '') + '/>';
    });
    (o.dots || []).forEach(function (p) { g += '<circle class="dot' + (p.cls ? ' ' + p.cls : '') + '" cx="' + sx(p.x).toFixed(1) + '" cy="' + sy(p.y).toFixed(1) + '" r="6"/>'; });
    var leg = o.series.length > 1 ? '<ul class="mdc-legend">' + o.series.map(function (s, k) { return '<li><svg viewBox="0 0 34 8" aria-hidden="true"><line class="ser s' + (k % 6) + '" x1="1" x2="33" y1="4" y2="4"' + (DASH[k % 6] ? ' stroke-dasharray="' + DASH[k % 6] + '"' : '') + '/></svg>' + esc(s.name) + '</li>'; }).join('') + '</ul>' : '';
    return '<figure class="mdc-fig"><svg class="mdc-chart" viewBox="0 0 ' + W + ' ' + Ht + '" role="img" aria-label="' + esc(o.label || '') + '" direction="ltr">' + g + '</svg>' + leg + (o.cap ? '<figcaption>' + o.cap + '</figcaption>' : '') + '</figure>';
  }
  function dl(name, text, type) {
    var a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text], { type: type || 'text/plain;charset=utf-8' })); a.download = name;
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(function () { URL.revokeObjectURL(a.href); }, 2000);
  }
  function csv(rows) { return '﻿' + rows.map(function (r) { return r.map(function (c) { c = c == null ? '' : String(c); return /[",\n]/.test(c) ? '"' + c.replace(/"/g, '""') + '"' : c; }).join(','); }).join('\r\n'); }
  function name(x, i, word) { return (x && x.name && String(x.name).trim()) || word + ' ' + (i + 1); }
  function human() { return '<aside class="mdc-human"><svg viewBox="0 0 40 40" aria-hidden="true"><circle cx="20" cy="13" r="6"/><path d="M8 34c1-8 6-11 12-11s11 3 12 11"/><path class="t" d="M25 28l3 3 6-7"/></svg><div><strong>دعم قرار، مش قرار.</strong> الناتج هنا مسودة بتساعد المسؤول يفكّر. أي حاجة تخص أشخاص لازم يراجعها ويعتمدها إنسان مسؤول باسمه قبل ما تتنفّذ.</div></aside>'; }
  X.h = { num: num, f: f, fi: fi, fx: fx, pct: pct, inp: inp, cell: cell, pick: pick, rm: rm, add: add, wait: wait, bars: bars, chart: chart, dl: dl, csv: csv, name: name, human: human, esc: esc };

  /* ---------- glyphs: one drawing per tool ---------- */
  var G = {
    ahp: '<circle cx="18" cy="60" r="9"/><circle cx="78" cy="60" r="9"/><circle cx="48" cy="16" r="9"/><path d="M27 60h42M23 52l19-28M73 52L54 24"/><path class="f" d="M44 60l4-5 4 5-4 5z"/>',
    topsis: '<path d="M10 78h78M10 78V8"/><circle cx="34" cy="56" r="5"/><circle cx="52" cy="38" r="5"/><circle cx="64" cy="60" r="5"/><path class="f" d="M80 10l2.600 6.400L89 19l-6.400 2.600L80 28l-2.600-6.400L71 19l6.400-2.600z"/><path class="d" d="M56 34l19-12"/>',
    strata: '<path d="M8 22c14-8 26 8 40 0s26 8 40 0M8 48c14-8 26 8 40 0s26 8 40 0M8 74c14-8 26 8 40 0s26 8 40 0"/><circle class="f" cx="24" cy="33" r="3.500"/><circle class="f" cx="50" cy="35" r="3.500"/><circle class="f" cx="72" cy="33" r="3.500"/><circle class="f" cx="36" cy="60" r="3.500"/><circle class="f" cx="64" cy="61" r="3.500"/>',
    power: '<path d="M10 80h78M10 80V10"/><path d="M12 76c22-2 26-56 74-60"/><path class="d" d="M10 30h78"/><circle class="f" cx="52" cy="30" r="5"/>',
    sched: '<rect x="10" y="12" width="76" height="68" rx="8"/><path d="M10 34h76M10 57h76M35 12v68M61 12v68"/><rect class="f" x="39" y="38" width="18" height="15" rx="3"/><rect class="f" x="14" y="61" width="17" height="15" rx="3"/><rect class="f" x="65" y="16" width="17" height="14" rx="3"/>',
    queue: '<circle cx="14" cy="50" r="6"/><circle cx="32" cy="50" r="6"/><circle cx="50" cy="50" r="6"/><path d="M62 50h10M68 45l5 5-5 5"/><rect x="76" y="26" width="14" height="48" rx="4"/><circle class="f" cx="83" cy="38" r="3"/><circle class="f" cx="83" cy="62" r="3"/>',
    short: '<rect x="6" y="18" width="84" height="20" rx="5"/><path d="M18 18v8M30 18v8M42 18v8M54 18v8M66 18v8M78 18v8"/><path d="M48 44v10M43 50l5 5 5-5"/><rect class="f" x="26" y="60" width="44" height="20" rx="5"/>',
    wizard: '<path class="d" d="M12 70c20 0 12-40 34-40s14 26 38 14"/><circle cx="12" cy="70" r="6"/><circle cx="46" cy="30" r="6"/><path class="f" d="M84 30l3.200 8L95 41l-7.800 3.200L84 52l-3.200-7.800L73 41l7.800-3z"/>'
  };
  function glyph(id) { return '<svg class="mdc-glyph" viewBox="0 0 96 90" aria-hidden="true" focusable="false">' + (G[id] || '') + '</svg>'; }
  X.glyph = glyph;

  /* ---------- home ---------- */
  function home(main) {
    var T = X.tools, look = { ahp: 'sun', topsis: 'lilac', strata: 'mint', power: 'coral' };
    var first = ['ahp', 'topsis', 'strata', 'power'].map(function (id, i) {
      return '<a class="mdc-tile block ' + look[id] + ' t' + (i + 1) + '" href="#decide/' + id + '" data-glow-host><span class="mdc-no num">' + T[id].no + '</span>' + glyph(id) + '<strong>' + esc(T[id].title) + '</strong><span class="mdc-say">' + esc(T[id].say) + '</span></a>';
    }).join('');
    var rest = ['sched', 'queue', 'short'].map(function (id) {
      return '<li><a href="#decide/' + id + '"><span class="mdc-no num">' + T[id].no + '</span>' + glyph(id) + '<span class="mdc-row-t"><strong>' + esc(T[id].title) + '</strong><span>' + esc(T[id].say) + '</span></span>' + ic('back', 'mdc-go') + '</a></li>';
    }).join('');
    main.innerHTML = '<div class="mdc mdc-home"><header class="head mdc-head"><p class="mdc-kicker">بحوث العمليات واتخاذ القرار</p><h1 class="mega" data-reveal="words">قرارك <em>بالحساب</em> مش بالتخمين</h1>' +
      '<p class="lead">سبع أدوات بتشتغل على جهازك: تقارن بدائل، توزّع عينة، توازن الميزانية مع قوة الاختبار، وتنظّم جلسات. كل أداة معاها شرح ومثال من علم النفس تقدر تحمّله وتجرّب.</p></header>' +
      '<section class="mdc-grid" data-stagger="70">' +
      '<a class="mdc-wiz" href="#decide/wizard" data-glow-host><span class="mdc-wiz-in">' + glyph('wizard') + '<span class="mdc-wiz-k">مش عارف تبدأ منين؟</span><strong>من المشكلة للنموذج</strong><span class="mdc-say">جاوب على سؤالين، ونوصّلك للأداة المناسبة ونكتب لك النموذج الرياضي وسكربت بايثون بأرقامك.</span><span class="btn primary">ابدأ من مشكلتك</span></span></a>' +
      first + '</section>' +
      '<section class="mdc-more"><h2>وكمان للمراكز والمقاييس</h2><ul class="mdc-rows">' + rest + '</ul></section>' +
      '<p class="mdc-foot">كل الحسابات بتتم على جهازك ومفيش حاجة بتتبعت لأي مكان. الأدوات دي بتحسب وتقارن؛ القرار نفسه مسؤوليتك، ومفيش هنا تشخيص ولا ترتيب لأشخاص.</p></div>';
  }

  /* ---------- tool page ---------- */
  function toolPage(main, id) {
    var t = X.tools[id], st = D[id] || (D[id] = t.def()), last = null, timer = null;
    main.innerHTML = '<div class="mdc mdc-tool mdc-t-' + id + '"><p class="crumb"><a href="#decide">' + ic('back') + 'كل أدوات القرار</a></p>' +
      '<header class="head mdc-thead"><span class="mdc-no num" aria-hidden="true">' + t.no + '</span><div><h1>' + esc(t.title) + '</h1><p class="lead">' + esc(t.say) + '</p></div></header>' +
      '<section class="mdc-explain block ' + t.color + '">' + glyph(id) + '<dl><div><dt>بتعمل إيه</dt><dd>' + t.what + '</dd></div><div><dt>تستخدمها إمتى</dt><dd>' + t.when + '</dd></div><div><dt>مثال</dt><dd>' + t.ex + '</dd></div></dl>' +
      '<p class="mdc-explain-act"><button class="btn inked" type="button" data-act="example">حمّل المثال وجرّب</button><button class="btn ghost mdc-reset" type="button" data-act="reset">ابدأ من فاضي</button></p></section>' +
      (t.people ? human() : '') +
      '<section class="mdc-work"><div class="mdc-form" id="mdc-form"></div><div class="mdc-out" id="mdc-out" aria-live="polite"></div></section>' +
      '<section class="mdc-export" id="mdc-export"><h2>خُد النتيجة معاك</h2><div class="row"><button class="btn" type="button" data-act="print">' + ic('print') + 'اطبع / PDF</button><button class="btn" type="button" data-act="csv">' + ic('download') + 'جدول CSV</button><button class="btn" type="button" data-act="json">' + ic('download') + 'ملف JSON</button><button class="btn" type="button" data-act="py">' + ic('download') + 'سكربت بايثون</button></div><p class="small muted">مدخلاتك بتتحفظ تلقائي على الجهاز ده بس.</p></section>' +
      '<details class="mdc-model"><summary>النموذج الرياضي اللي ورا الأداة</summary><div class="mdc-model-in">' + (X.model[id] || '') + '</div></details></div>';
    var root = $('.mdc-tool', main), form = $('#mdc-form', root), out = $('#mdc-out', root);
    function widths(el) { $$('[data-w]', el).forEach(function (b) { b.style.setProperty('--w', b.getAttribute('data-w') + '%'); b.style.setProperty('--i', b.getAttribute('data-i') || 0); }); }
    function drawForm() { form.innerHTML = t.form(st); if (t.sync) t.sync(form, st); }
    function drawOut() {
      var r; try { r = t.out(st); } catch (e) { r = wait('فيه رقم مش مظبوط في المدخلات. راجعها.'); if (window.console) console.warn(e); }
      last = r; out.innerHTML = r.html; widths(out); $('#mdc-export', root).classList.toggle('off', !r.csv);
    }
    function later() { clearTimeout(timer); timer = setTimeout(drawOut, 140); }
    function stamp() { return id + '-' + H.today(); }
    root.addEventListener('input', function (e) {
      var el = e.target, p = el.getAttribute && el.getAttribute('data-p'); if (!p || el.tagName === 'SELECT') return;
      setPath(st, p, el.type === 'checkbox' ? el.checked : el.value); H.save(); if (t.sync) t.sync(form, st, el); later();
    });
    root.addEventListener('change', function (e) {
      var el = e.target, p = el.getAttribute && el.getAttribute('data-p'); if (!p) return;
      if (el.tagName === 'SELECT') { setPath(st, p, el.value); H.save(); if (el.hasAttribute('data-re')) drawForm(); drawOut(); }
      else if (el.type === 'checkbox') { if (el.hasAttribute('data-re')) drawForm(); drawOut(); }
    });
    root.addEventListener('click', function (e) {
      var b = e.target.closest && e.target.closest('[data-act]'); if (!b || b.disabled) return;
      var act = b.getAttribute('data-act'), arg = b.getAttribute('data-arg');
      if (act === 'example') { st = D[id] = t.example(); H.save(); drawForm(); drawOut(); H.toast('اتحمّل المثال. غيّر أي رقم وشوف النتيجة.'); form.scrollIntoView({ block: 'start', behavior: H.calm() ? 'auto' : 'smooth' }); return; }
      if (act === 'reset') { st = D[id] = t.def(); H.save(); drawForm(); drawOut(); return; }
      if (act === 'print') { window.print(); return; }
      if (act === 'csv' || act === 'json') {
        if (!last || !last.csv) { H.toast('كمّل المدخلات الأول عشان يبقى فيه نتيجة.'); return; }
        if (t.gate) { var why = t.gate(st); if (why) { H.toast(why); var g = $('[data-gate]', form); if (g) g.focus(); return; } }
        if (act === 'csv') dl('decide-' + stamp() + '.csv', csv(last.csv), 'text/csv;charset=utf-8');
        else dl('decide-' + stamp() + '.json', JSON.stringify({ tool: id, title: t.title, date: H.today(), note: t.people ? 'DRAFT decision support. A named responsible person must review and sign off before use.' : undefined, inputs: st, results: last.json }, null, 2), 'application/json');
        return;
      }
      if (act === 'py') { dl('decide-' + id + '.py', X.py[id](st), 'text/x-python;charset=utf-8'); return; }
      var r = t.act ? t.act(st, act, arg, b) : null; H.save();
      if (r === 'go') return; if (r !== 'out') { var keep = b.getAttribute('data-keep'); drawForm(); if (keep) { var again = $('[data-keep="' + keep + '"]', form); if (again) again.focus(); } }
      drawOut();
    });
    drawForm(); drawOut();
  }

  /* ---------- 01 AHP ---------- */
  var VERB = ['متساويين', 'بين المتساوي والبسيط', 'بدرجة بسيطة', 'بين البسيط والقوي', 'بدرجة قوية', 'بين القوي والقوي جداً', 'بدرجة قوية جداً', 'بين القوي جداً والأقصى', 'لأقصى درجة'];
  function pairKey(a, b) { return a.id + '|' + b.id; }
  function pairVals(list, map) { var v = []; for (var i = 0; i < list.length; i++) for (var j = i + 1; j < list.length; j++) v.push(-(+((map || {})[pairKey(list[i], list[j])]) || 0)); return v; }
  function ahpAll(st) {
    var A = C.ahpMatrix(st.crit.length, pairVals(st.crit, st.cv)), R = C.ahp(A), local = [], per = [];
    st.crit.forEach(function (c) { var M = C.ahpMatrix(st.alts.length, pairVals(st.alts, (st.av || {})[c.id])), r = C.ahp(M); per.push({ A: M, r: r }); });
    st.alts.forEach(function (a, i) { local.push(per.map(function (p) { return p.r.w[i]; })); });
    function score(w) { return local.map(function (row) { var s = 0; for (var j = 0; j < w.length; j++) s += w[j] * row[j]; return s; }); }
    return { A: A, R: R, per: per, local: local, score: score, scores: score(R.w) };
  }
  X.ahpAll = ahpAll;
  X.tools.ahp = {
    no: '01', title: 'المقارنة الزوجية (AHP)', color: 'sun', say: 'قارن كل اتنين مع بعض، واطلع بأوزان للمعايير وترتيب للبدائل',
    what: 'بتحوّل أحكامك من نوع «ده أهم من ده بقد إيه» لأوزان رقمية للمعايير، وبعدها بترتّب البدائل. وبتنبّهك لو أحكامك بتناقض بعضها.',
    when: 'لما القرار معتمد على خبرة وتقدير مش على أرقام جاهزة: اختيار مقياس، برنامج إرشادي، مكان تطبيق، أو موضوع رسالة.',
    ex: 'باحثة بتختار بين 3 مقاييس للقلق على 4 معايير: الخصائص السيكومترية، الملاءمة الثقافية، وقت التطبيق، والتكلفة. الأحكام في المثال افتراضية للتوضيح.',
    def: function () { return { crit: [{ id: 'c1', name: '' }, { id: 'c2', name: '' }], alts: [{ id: 'a1', name: '' }, { id: 'a2', name: '' }], cv: {}, av: {}, tab: 'crit', sens: '' }; },
    example: function () {
      var s = { crit: [{ id: 'c1', name: 'الخصائص السيكومترية' }, { id: 'c2', name: 'الملاءمة الثقافية' }, { id: 'c3', name: 'وقت التطبيق' }, { id: 'c4', name: 'التكلفة والإتاحة' }], alts: [{ id: 'a1', name: 'المقياس أ' }, { id: 'a2', name: 'المقياس ب' }, { id: 'a3', name: 'المقياس ج' }], cv: {}, av: {}, tab: 'crit', sens: 'c1' };
      s.cv = { 'c1|c2': -1, 'c1|c3': -4, 'c1|c4': -5, 'c2|c3': -2, 'c2|c4': -4, 'c3|c4': -1 };
      s.av = { c1: { 'a1|a2': -2, 'a1|a3': -4, 'a2|a3': -2 }, c2: { 'a1|a2': 2, 'a1|a3': -1, 'a2|a3': -3 }, c3: { 'a1|a2': 3, 'a1|a3': 5, 'a2|a3': 2 }, c4: { 'a1|a2': 0, 'a1|a3': 4, 'a2|a3': 4 } };
      return s;
    },
    form: function (st) {
      function list(key, word, max, title, hint) {
        return '<div class="mdc-list"><h3>' + title + '</h3><p class="small muted">' + hint + '</p>' + st[key].map(function (x, i) { return '<div class="mdc-li">' + cell(key + '.' + i + '.name', x.name, word + ' ' + (i + 1), true, word + ' ' + (i + 1)) + (st[key].length > 2 ? rm('del-' + key, i, word + ' ' + (i + 1)) : '') + '</div>'; }).join('') + add('add-' + key, 'زوّد ' + word, st[key].length >= max) + '</div>';
      }
      var tabs = [['crit', 'المعايير مع بعض']].concat(st.crit.map(function (c, i) { return [c.id, 'البدائل في: ' + name(c, i, 'معيار')]; }));
      if (!tabs.some(function (x) { return x[0] === st.tab; })) st.tab = 'crit';
      var isC = st.tab === 'crit', items = isC ? st.crit : st.alts, word = isC ? 'معيار' : 'بديل', base = isC ? 'cv' : 'av.' + st.tab, map = isC ? st.cv : (st.av[st.tab] || {}), rows = '';
      for (var i = 0; i < items.length; i++) for (var j = i + 1; j < items.length; j++) {
        var k = pairKey(items[i], items[j]), a = name(items[i], i, word), b = name(items[j], j, word);
        rows += '<div class="mdc-pair"><span class="mdc-pa">' + esc(a) + '</span><input type="range" dir="rtl" min="-8" max="8" step="1" data-p="' + base + '.' + k + '" data-pair data-a="' + esc(a) + '" data-b="' + esc(b) + '" value="' + (+map[k] || 0) + '" aria-label="' + esc(a + ' مقابل ' + b) + '"><span class="mdc-pb">' + esc(b) + '</span><output class="mdc-pv"></output></div>';
      }
      return '<div class="card mdc-card"><h2>1. اكتب المعايير والبدائل</h2><div class="mdc-two">' + list('crit', 'معيار', 7, 'المعايير', 'هتحكم على البدائل بإيه؟ من 2 لـ 7.') + list('alts', 'بديل', 6, 'البدائل', 'الاختيارات اللي بتفاضل بينها. من 2 لـ 6.') + '</div></div>' +
        '<div class="card mdc-card"><h2>2. قارن كل اتنين</h2><p class="muted">حرّك المؤشر ناحية الأهم. في النص معناها متساويين، وآخر الطرف معناها أهم لأقصى درجة (9 على مقياس ساعتي).</p>' +
        '<div class="mdc-tabs" role="tablist">' + tabs.map(function (x) { return '<button type="button" role="tab" aria-selected="' + (x[0] === st.tab) + '" data-act="tab" data-arg="' + esc(x[0]) + '" data-keep="tab-' + esc(x[0]) + '">' + esc(x[1]) + '</button>'; }).join('') + '</div>' +
        '<p class="mdc-ask">' + (isC ? 'أنهي معيار أهم في قرارك؟' : 'من ناحية «' + esc(name(st.crit.filter(function (c) { return c.id === st.tab; })[0], st.crit.map(function (c) { return c.id; }).indexOf(st.tab), 'معيار')) + '»: أنهي بديل أفضل؟') + '</p>' +
        '<div class="mdc-pairs">' + rows + '</div></div>';
    },
    sync: function (form, st, el) {
      var isC = st.tab === 'crit';
      (el && el.hasAttribute('data-pair') ? [el] : el ? [] : $$('[data-pair]', form)).forEach(function (r) {
        var s = +r.value, o = r.parentNode.querySelector('.mdc-pv'), who = s < 0 ? r.getAttribute('data-a') : r.getAttribute('data-b'), n = Math.abs(s) + 1;
        var txt = s === 0 ? 'متساويين' : '«' + who + '» ' + (isC ? 'أهم' : 'أفضل') + ' ' + VERB[n - 1] + ' (' + n + ')';
        o.textContent = txt; r.setAttribute('aria-valuetext', txt); r.parentNode.classList.toggle('on', s !== 0);
        r.parentNode.classList.toggle('a', s < 0); r.parentNode.classList.toggle('b', s > 0);
      });
    },
    act: function (st, act, arg) {
      if (act === 'tab') { st.tab = arg; return; }
      var m = /^(add|del)-(crit|alts)$/.exec(act); if (!m) { if (act === 'toTopsis') { var r = ahpAll(st), T = D.topsis || (D.topsis = X.tools.topsis.def()), old = T.crit; T.crit = st.crit.map(function (c, i) { return { id: old[i] ? old[i].id : H.uid(), name: name(c, i, 'معيار'), w: r.R.w[i].toFixed(4), kind: old[i] ? old[i].kind : 'benefit' }; }); T.fromAhp = H.today(); H.save(); H.go('#decide/topsis'); return 'go'; } return; }
      if (m[1] === 'add') st[m[2]].push({ id: H.uid(), name: '' }); else { var gone = st[m[2]].splice(+arg, 1)[0]; if (m[2] === 'crit' && gone) delete st.av[gone.id]; }
    },
    out: function (st) {
      var r = ahpAll(st), cn = st.crit.map(function (c, i) { return name(c, i, 'معيار'); }), an = st.alts.map(function (a, i) { return name(a, i, 'بديل'); });
      var touched = Object.keys(st.cv || {}).some(function (k) { return +st.cv[k]; }) || Object.keys(st.av || {}).some(function (c) { return Object.keys(st.av[c] || {}).some(function (k) { return +st.av[c][k]; }); });
      var order = C.rank(r.scores), top = order[0], mx = r.scores[top], wo = C.rank(r.R.w);
      var mats = [{ label: 'المعايير مع بعض', tab: 'crit', r: r.R, A: r.A, names: cn, n: cn.length }].concat(r.per.map(function (p, i) { return { label: 'البدائل في: ' + cn[i], tab: st.crit[i].id, r: p.r, A: p.A, names: an, n: an.length }; }));
      var badN = 0, cons = mats.map(function (m) {
        var okc = m.r.cr <= 0.10 + 1e-12, msg = '';
        if (m.n < 3) msg = '<span class="mdc-cr-s">مقارنة واحدة بس، فمفيش تناقض ممكن.</span>';
        else if (!okc) {
          badN++; var w = C.ahpWorst(m.A, m.r.w)[0], said = w.a >= 1 ? w.a : 1 / w.a, imp = w.implied >= 1 ? w.implied : 1 / w.implied, sameSide = (w.a >= 1) === (w.implied >= 1);
          msg = '<span class="mdc-cr-s">أكتر حكم مش ماشي مع الباقي: «' + esc(m.names[w.i]) + '» مقابل «' + esc(m.names[w.j]) + '». إنت اخترت ' + (w.a === 1 ? 'متساويين' : '«' + esc(m.names[w.a >= 1 ? w.i : w.j]) + '» بدرجة ' + f(said, 0)) + '، وباقي أحكامك بتقول ' + (sameSide ? 'حوالي ' + f(imp, 1) : '«' + esc(m.names[w.implied >= 1 ? w.i : w.j]) + '» هو الأرجح بحوالي ' + f(imp, 1)) + '. راجعه هو الأول.</span><button class="btn" type="button" data-act="tab" data-arg="' + esc(m.tab) + '">راجِع المقارنات دي</button>';
        }
        return '<li class="' + (okc ? 'ok' : 'warn') + '"><span class="mdc-cr-n">' + esc(m.label) + '</span><span class="mdc-cr-v">CR = ' + f(m.r.cr, 3) + '</span><span class="mdc-cr-t">' + (okc ? ic('check') + 'متسق' : '<svg class="ic" viewBox="0 0 20 20" aria-hidden="true"><path d="M10 3l8 14H2z"/><path d="M10 8v4M10 14.500v.500"/></svg>محتاج مراجعة') + '</span>' + msg + '</li>';
      }).join('');
      var si = Math.max(0, st.crit.map(function (c) { return c.id; }).indexOf(st.sens)), sw = C.sweep(r.R.w, si, r.score, 200);
      var series = an.map(function (n, a) { return { name: n, pts: sw.grid.map(function (g) { return [g.t, g.s[a]]; }) }; }), ymax = 0; sw.grid.forEach(function (g) { g.s.forEach(function (v) { if (v > ymax) ymax = v; }); });
      var stable = sw.flips.length ? sw.flips.map(function (fl) { return 'لو وزن «' + esc(cn[si]) + '» ' + (fl.t > r.R.w[si] ? 'زاد لحد' : 'نزل لحد') + ' حوالي ' + f(fl.t, 2) + '، الأول يتبدّل بين «' + esc(an[fl.from]) + '» و«' + esc(an[fl.to]) + '».'; }).join(' ') : 'مهما غيّرت وزن «' + esc(cn[si]) + '» من 0 لـ 1، «' + esc(an[top]) + '» بيفضل الأول. الترتيب ثابت قدام المعيار ده.';
      var near = sw.flips.filter(function (fl) { return Math.abs(fl.t - r.R.w[si]) < 0.1; }).length;
      var html = (touched ? '' : '<p class="notice">لسه كل المقارنات على «متساويين»، فكل الأوزان متساوية. حرّك المؤشرات أو حمّل المثال.</p>') +
        '<div class="mdc-hero"><p class="mdc-hero-k">الأول في الترتيب</p><p class="mdc-hero-v">' + esc(an[top]) + '</p><p class="mdc-hero-s">بدرجة ' + f(mx, 3) + ' من 1' + (order.length > 1 ? '، وبعده «' + esc(an[order[1]]) + '» بـ ' + f(r.scores[order[1]], 3) : '') + '</p></div>' +
        '<div class="mdc-res"><h3>ترتيب البدائل</h3>' + bars(order.map(function (a, k) { return { label: an[a], rank: k + 1, frac: r.scores[a] / mx, val: f(r.scores[a], 3), top: k === 0 }; })) + '</div>' +
        '<div class="mdc-res"><h3>أوزان المعايير</h3>' + bars(wo.map(function (c) { return { label: cn[c], frac: r.R.w[c] / r.R.w[wo[0]], val: pct(r.R.w[c]) }; })) + '</div>' +
        '<div class="mdc-res"><h3>اتساق أحكامك</h3><p class="small muted">نسبة الاتساق CR = مؤشر الاتساق ÷ المؤشر العشوائي لساعتي. المقبول 0.10 أو أقل.</p><ul class="mdc-cr">' + cons + '</ul>' + (badN ? '<p class="notice">فيه ' + badN + ' مجموعة مقارنات فوق 0.10. النتيجة تتقري بحذر لحد ما تراجعها.</p>' : '') + '</div>' +
        '<div class="mdc-res"><h3>حساسية الترتيب</h3><label class="mdc-f mdc-sens"><span class="mdc-fl">غيّر وزن أنهي معيار؟</span><select data-p="sens">' + H.opts(st.crit.map(function (c, i) { return [c.id, cn[i]]; }), st.crit[si].id) + '</select></label>' +
        chart({ x0: 0, x1: 1, y0: 0, y1: Math.ceil(ymax * 10) / 10 || 1, xl: 'وزن «' + cn[si] + '»', series: series, vmarks: [{ x: r.R.w[si], label: 'وزنك الحالي ' + fx(r.R.w[si], 2) }], label: 'درجة كل بديل لما وزن المعيار يتغير من 0 إلى 1' }) +
        '<p>' + stable + (near ? ' <strong>نقطة التبديل قريبة من وزنك الحالي، فالقرار حسّاس: راجع أحكامك في المعيار ده.</strong>' : '') + '</p><p class="small muted">باقي المعايير بتحتفظ بنسبها لبعض وهي بتتقسّم على الباقي. الدقة 0.005.</p></div>' +
        '<div class="mdc-next"><button class="btn" type="button" data-act="toTopsis">استخدم الأوزان دي في TOPSIS' + ic('back') + '</button></div>';
      var rows = [['AHP', H.today()], [], ['المعيار', 'الوزن']].concat(cn.map(function (n, i) { return [n, r.R.w[i].toFixed(4)]; }), [[], ['البديل', 'الدرجة', 'الترتيب']], order.map(function (a, k) { return [an[a], r.scores[a].toFixed(4), k + 1]; }), [[], ['المصفوفة', 'lambda max', 'CI', 'CR']], mats.map(function (m) { return [m.label, m.r.lambda.toFixed(4), m.r.ci.toFixed(4), m.r.cr.toFixed(4)]; }));
      return { html: html, csv: rows, json: { criteria: cn.map(function (n, i) { return { name: n, weight: r.R.w[i] }; }), alternatives: an.map(function (n, i) { return { name: n, score: r.scores[i], rank: order.indexOf(i) + 1, local: r.local[i] }; }), consistency: mats.map(function (m) { return { matrix: m.label, lambdaMax: m.r.lambda, CI: m.r.ci, RI: m.r.ri, CR: m.r.cr }; }) } };
    }
  };

  /* ---------- 02 TOPSIS ---------- */
  X.tools.topsis = {
    no: '02', title: 'الأقرب للمثالي (TOPSIS)', color: 'lilac', say: 'رتّب بدائل عندك أرقامها على كذا معيار، بعضها مكسب وبعضها تكلفة',
    what: 'بترتّب البدائل حسب قربها من «البديل المثالي» (أحسن قيمة في كل معيار) وبعدها عن «أسوأ بديل»، مع أوزان للمعايير.',
    when: 'لما يبقى عندك جدول أرقام فعلي: كل بديل وقيمته على كل معيار. ولو المعايير مختلفة الوحدات (جنيه، دقايق، درجات) عادي.',
    ex: 'باحث بيختار مدرسة يطبّق فيها من 4 مدارس حسب: عدد الطلاب المتاحين، المسافة، تكلفة التطبيق، ودرجة تعاون الإدارة. الأرقام افتراضية للتوضيح.',
    def: function () { return { crit: [{ id: 'k1', name: '', w: '1', kind: 'benefit' }, { id: 'k2', name: '', w: '1', kind: 'benefit' }], alts: [{ id: 'b1', name: '' }, { id: 'b2', name: '' }], x: {}, sens: '' }; },
    example: function () {
      return { crit: [{ id: 'k1', name: 'عدد الطلاب المتاحين', w: '0.35', kind: 'benefit' }, { id: 'k2', name: 'المسافة (كم)', w: '0.15', kind: 'cost' }, { id: 'k3', name: 'تكلفة التطبيق (جنيه)', w: '0.20', kind: 'cost' }, { id: 'k4', name: 'تعاون الإدارة (1-10)', w: '0.30', kind: 'benefit' }],
        alts: [{ id: 'b1', name: 'المدرسة 1' }, { id: 'b2', name: 'المدرسة 2' }, { id: 'b3', name: 'المدرسة 3' }, { id: 'b4', name: 'المدرسة 4' }],
        x: { b1: { k1: '420', k2: '12', k3: '1800', k4: '8' }, b2: { k1: '610', k2: '35', k3: '2600', k4: '6' }, b3: { k1: '300', k2: '5', k3: '1200', k4: '9' }, b4: { k1: '520', k2: '22', k3: '2100', k4: '5' } }, sens: 'k1' };
    },
    form: function (st) {
      var A = D.ahp, canImport = A && A.crit && A.crit.length >= 2 && Object.keys(A.cv || {}).some(function (k) { return +A.cv[k]; });
      var head = '<tr><th scope="col" class="mdc-corner">المعيار</th>' + st.crit.map(function (c, j) { return '<th scope="col"><span class="mdc-th">' + cell('crit.' + j + '.name', c.name, 'اسم المعيار ' + (j + 1), true, 'معيار ' + (j + 1)) + (st.crit.length > 2 ? rm('del-crit', j, 'المعيار ' + (j + 1)) : '') + '</span></th>'; }).join('') + '</tr>';
      var wrow = '<tr class="mdc-meta"><th scope="row">الوزن</th>' + st.crit.map(function (c, j) { return '<td>' + cell('crit.' + j + '.w', c.w, 'وزن المعيار ' + (j + 1)) + '</td>'; }).join('') + '</tr>';
      var krow = '<tr class="mdc-meta"><th scope="row">نوعه</th>' + st.crit.map(function (c, j) { return '<td><select data-p="crit.' + j + '.kind" aria-label="نوع المعيار ' + (j + 1) + '">' + H.opts([['benefit', 'مكسب: الأكبر أحسن'], ['cost', 'تكلفة: الأصغر أحسن']], c.kind) + '</select></td>'; }).join('') + '</tr>';
      var body = st.alts.map(function (a, i) { return '<tr><th scope="row"><span class="mdc-th">' + cell('alts.' + i + '.name', a.name, 'اسم البديل ' + (i + 1), true, 'بديل ' + (i + 1)) + (st.alts.length > 2 ? rm('del-alts', i, 'البديل ' + (i + 1)) : '') + '</span></th>' + st.crit.map(function (c, j) { return '<td>' + cell('x.' + a.id + '.' + c.id, (st.x[a.id] || {})[c.id], 'قيمة البديل ' + (i + 1) + ' على المعيار ' + (j + 1)) + '</td>'; }).join('') + '</tr>'; }).join('');
      return '<div class="card mdc-card"><h2>جدول القرار</h2><p class="muted">اكتب كل بديل في صف وكل معيار في عمود. الأوزان بتتقسم على مجموعها تلقائي، فمش لازم مجموعها يبقى 1.</p>' +
        '<div class="mdc-scroll" tabindex="0" role="group" aria-label="جدول القرار"><table class="mdc-matrix"><thead>' + head + '</thead><tbody>' + wrow + krow + body + '</tbody></table></div>' +
        '<div class="row mdc-acts">' + add('add-alts', 'زوّد بديل', st.alts.length >= 12) + add('add-crit', 'زوّد معيار', st.crit.length >= 8) + (canImport ? '<button class="btn" type="button" data-act="fromAhp">هات الأوزان من AHP</button>' : '') + '</div>' +
        (st.fromAhp ? '<p class="small muted">الأوزان جاية من نتيجة AHP المحفوظة على الجهاز. تقدر تعدّلها.</p>' : '') + '</div>';
    },
    act: function (st, act, arg) {
      if (act === 'add-crit') st.crit.push({ id: H.uid(), name: '', w: '1', kind: 'benefit' });
      else if (act === 'add-alts') st.alts.push({ id: H.uid(), name: '' });
      else if (act === 'del-crit') st.crit.splice(+arg, 1);
      else if (act === 'del-alts') { var g = st.alts.splice(+arg, 1)[0]; if (g) delete st.x[g.id]; }
      else if (act === 'fromAhp') { var r = ahpAll(D.ahp); st.crit = D.ahp.crit.map(function (c, i) { var o = st.crit[i]; return { id: o ? o.id : H.uid(), name: name(c, i, 'معيار'), w: r.R.w[i].toFixed(4), kind: o ? o.kind : 'benefit' }; }); st.fromAhp = H.today(); H.toast('اتنقلت أوزان ' + st.crit.length + ' معايير من AHP.'); }
    },
    out: function (st) {
      var cn = st.crit.map(function (c, i) { return name(c, i, 'معيار'); }), an = st.alts.map(function (a, i) { return name(a, i, 'بديل'); });
      var w = st.crit.map(function (c) { return num(c.w); }), Xm = st.alts.map(function (a) { return st.crit.map(function (c) { return num((st.x[a.id] || {})[c.id]); }); });
      var missing = 0; Xm.forEach(function (r) { r.forEach(function (v) { if (isNaN(v)) missing++; }); });
      if (missing) return wait('فاضل ' + missing + ' خانة في الجدول. اكتب رقم لكل بديل على كل معيار، أو حمّل المثال.');
      if (w.some(function (v) { return isNaN(v) || v < 0; }) || !(w.reduce(function (a, b) { return a + b; }, 0) > 0)) return wait('الأوزان لازم تبقى أرقام موجبة، وواحد منها على الأقل أكبر من صفر.');
      var kinds = st.crit.map(function (c) { return c.kind; }), sw0 = w.reduce(function (a, b) { return a + b; }, 0), wn = w.map(function (v) { return v / sw0; });
      function score(ww) { return C.topsis(Xm, ww, kinds).cc; }
      var T = C.topsis(Xm, wn, kinds), order = C.rank(T.cc), top = order[0];
      var si = Math.max(0, st.crit.map(function (c) { return c.id; }).indexOf(st.sens)), sw = C.sweep(wn, si, score, 100);
      var series = an.map(function (n, a) { return { name: n, pts: sw.grid.map(function (g) { return [g.t, g.s[a]]; }) }; });
      var stable = sw.flips.length ? sw.flips.map(function (fl) { return 'عند وزن حوالي ' + f(fl.t, 2) + ' لـ«' + esc(cn[si]) + '» الأول يتبدّل بين «' + esc(an[fl.from]) + '» و«' + esc(an[fl.to]) + '».'; }).join(' ') : 'مهما غيّرت وزن «' + esc(cn[si]) + '»، «' + esc(an[top]) + '» بيفضل الأول.';
      var gap = order.length > 1 ? T.cc[top] - T.cc[order[1]] : 1;
      var html = '<div class="mdc-hero"><p class="mdc-hero-k">الأقرب للمثالي</p><p class="mdc-hero-v">' + esc(an[top]) + '</p><p class="mdc-hero-s">معامل القرب ' + f(T.cc[top], 3) + ' من 1' + (order.length > 1 ? '، والفرق عن التاني ' + f(gap, 3) + (gap < 0.03 ? ' (فرق صغير: البديلين قريبين جداً)' : '') : '') + '</p></div>' +
        '<div class="mdc-res"><h3>الترتيب بمعامل القرب</h3>' + bars(order.map(function (a, k) { return { label: an[a], rank: k + 1, frac: T.cc[a], val: f(T.cc[a], 3), top: k === 0 }; })) + '<p class="small muted">معامل القرب = البعد عن الأسوأ ÷ (البعد عن المثالي + البعد عن الأسوأ). كل ما يقرب من 1 يبقى أحسن.</p></div>' +
        '<div class="mdc-res"><h3>التفاصيل</h3><div class="mdc-scroll" tabindex="0" role="group" aria-label="تفاصيل الحساب"><table class="mdc-table"><thead><tr><th scope="col">البديل</th><th scope="col">البعد عن المثالي</th><th scope="col">البعد عن الأسوأ</th><th scope="col">معامل القرب</th></tr></thead><tbody>' + order.map(function (a) { return '<tr><th scope="row">' + esc(an[a]) + '</th><td>' + f(T.dPlus[a], 4) + '</td><td>' + f(T.dMinus[a], 4) + '</td><td>' + f(T.cc[a], 4) + '</td></tr>'; }).join('') + '</tbody></table></div>' +
        '<p class="small muted">الأوزان بعد التوحيد: ' + cn.map(function (n, j) { return esc(n) + ' ' + pct(wn[j]); }).join('، ') + '. التوحيد بطريقة المتجه (كل قيمة ÷ جذر مجموع مربعات عمودها).</p></div>' +
        '<div class="mdc-res"><h3>حساسية الترتيب</h3><label class="mdc-f mdc-sens"><span class="mdc-fl">غيّر وزن أنهي معيار؟</span><select data-p="sens">' + H.opts(st.crit.map(function (c, i) { return [c.id, cn[i]]; }), st.crit[si].id) + '</select></label>' +
        chart({ x0: 0, x1: 1, y0: 0, y1: 1, xl: 'وزن «' + cn[si] + '»', series: series, vmarks: [{ x: wn[si], label: 'وزنك الحالي ' + fx(wn[si], 2) }], label: 'معامل القرب لكل بديل لما وزن المعيار يتغير' }) + '<p>' + stable + '</p><p class="small muted">الدقة 0.01. TOPSIS بيقارن البدائل ببعض، فإضافة بديل جديد أو حذف واحد ممكن يغيّر الترتيب.</p></div>';
      var rows = [['TOPSIS', H.today()], [], ['المعيار', 'الوزن', 'النوع', 'المثالي (موزون)', 'الأسوأ (موزون)']].concat(cn.map(function (n, j) { return [n, wn[j].toFixed(4), kinds[j], T.best[j].toFixed(5), T.worst[j].toFixed(5)]; }), [[], ['البديل'].concat(cn, ['D+', 'D-', 'C', 'الترتيب'])], an.map(function (n, i) { return [n].concat(Xm[i], [T.dPlus[i].toFixed(5), T.dMinus[i].toFixed(5), T.cc[i].toFixed(5), order.indexOf(i) + 1]); }));
      return { html: html, csv: rows, json: { weights: wn, kinds: kinds, ideal: T.best, antiIdeal: T.worst, alternatives: an.map(function (n, i) { return { name: n, dPlus: T.dPlus[i], dMinus: T.dMinus[i], closeness: T.cc[i], rank: order.indexOf(i) + 1 }; }) } };
    }
  };

  /* ---------- 03 stratified allocation ---------- */
  X.tools.strata = {
    no: '03', title: 'توزيع العينة الطبقية', color: 'mint', say: 'وزّع عينتك على طبقات المجتمع: متناسب، نيمان، أو أمثل بالتكلفة',
    what: 'بتقسّم حجم العينة الكلي على الطبقات بثلاث طرق، وبتحسب الخطأ المعياري لكل طريقة وتقارنه بالعينة العشوائية البسيطة.',
    when: 'لما مجتمعك مقسوم لفئات معروفة أحجامها (نوع المدرسة، الفرقة، المحافظة) وعايز عينة تمثّلها بأقل خطأ أو أقل تكلفة.',
    ex: 'دراسة عن قلق الامتحان في 3 أنواع مدارس مختلفة في الحجم والتباين وتكلفة الوصول. أرقام المثال افتراضية للتوضيح.',
    def: function () { return { rows: [{ id: 's1', name: '', N: '', S: '', mean: '', c: '' }, { id: 's2', name: '', N: '', S: '', mean: '', c: '' }], mode: 'n', n: '', min: '2', budget: '', fixed: '' }; },
    example: function () { return { rows: [{ id: 's1', name: 'حكومي', N: '6000', S: '8', mean: '42', c: '20' }, { id: 's2', name: 'خاص', N: '2500', S: '11', mean: '47', c: '35' }, { id: 's3', name: 'تجريبي', N: '1500', S: '14', mean: '51', c: '30' }], mode: 'n', n: '400', min: '30', budget: '11000', fixed: '1000' }; },
    form: function (st) {
      var rows = st.rows.map(function (r, i) { return '<tr><th scope="row"><span class="mdc-th">' + cell('rows.' + i + '.name', r.name, 'اسم الطبقة ' + (i + 1), true, 'طبقة ' + (i + 1)) + (st.rows.length > 2 ? rm('del', i, 'الطبقة ' + (i + 1)) : '') + '</span></th><td>' + cell('rows.' + i + '.N', r.N, 'حجم الطبقة ' + (i + 1)) + '</td><td>' + cell('rows.' + i + '.S', r.S, 'الانحراف المعياري في الطبقة ' + (i + 1)) + '</td><td>' + cell('rows.' + i + '.mean', r.mean, 'متوسط الطبقة ' + (i + 1), false, 'اختياري') + '</td><td>' + cell('rows.' + i + '.c', r.c, 'تكلفة المشارك في الطبقة ' + (i + 1), false, 'اختياري') + '</td></tr>'; }).join('');
      return '<div class="card mdc-card"><h2>الطبقات</h2><p class="muted">الانحراف المعياري بييجي من دراسة سابقة أو استطلاعية. لو مش معاك، اكتب نفس الرقم لكل الطبقات وهيبقى نيمان زي المتناسب.</p>' +
        '<div class="mdc-scroll" tabindex="0" role="group" aria-label="جدول الطبقات"><table class="mdc-matrix"><thead><tr><th scope="col" class="mdc-corner">الطبقة</th><th scope="col">حجمها في المجتمع N</th><th scope="col">الانحراف المعياري S</th><th scope="col">المتوسط المتوقع</th><th scope="col">تكلفة المشارك</th></tr></thead><tbody>' + rows + '</tbody></table></div>' +
        '<div class="row mdc-acts">' + add('add', 'زوّد طبقة', st.rows.length >= 12) + '</div></div>' +
        '<div class="card mdc-card"><h2>القيود</h2><div class="mdc-fields">' + pick('mode', st.mode, 'المعروف عندك إيه؟', [['n', 'حجم العينة الكلي'], ['budget', 'الميزانية']], { re: true }) +
        (st.mode === 'budget' ? inp('budget', st.budget, 'الميزانية الكلية') + inp('fixed', st.fixed, 'تكاليف ثابتة', { hint: 'اختياري: تصاريح، طباعة، مواصلات' }) : inp('n', st.n, 'حجم العينة الكلي n')) +
        inp('min', st.min, 'أقل عدد في أي طبقة', { hint: 'عشان تقدر تحسب تباين جوّه الطبقة: 2 على الأقل' }) + '</div></div>';
    },
    act: function (st, act, arg) { if (act === 'add') st.rows.push({ id: H.uid(), name: '', N: '', S: '', mean: '', c: '' }); else if (act === 'del') st.rows.splice(+arg, 1); },
    out: function (st) {
      var nm = st.rows.map(function (r, i) { return name(r, i, 'طبقة'); }), S = st.rows.map(function (r) { var m = num(r.mean), c = num(r.c); return { N: num(r.N), S: num(r.S), mean: isNaN(m) ? undefined : m, c: isNaN(c) ? 0 : c }; });
      if (S.some(function (s) { return !(s.N >= 1) || s.N !== Math.floor(s.N) || !(s.S >= 0); })) return wait('اكتب لكل طبقة حجمها N (عدد صحيح) وانحرافها المعياري S، أو حمّل المثال.');
      var haveCost = S.every(function (s) { return s.c > 0; }), min = num(st.min); if (isNaN(min) || min < 0) min = 0;
      var Ntot = S.reduce(function (a, s) { return a + s.N; }, 0), n, cost = null, fixed = num(st.fixed); if (isNaN(fixed)) fixed = 0;
      if (st.mode === 'budget') {
        if (!haveCost) return wait('عشان نحسب من الميزانية، اكتب تكلفة المشارك في كل طبقة.');
        var B = num(st.budget); if (!(B > 0)) return wait('اكتب الميزانية الكلية.');
        cost = C.allocate(S, 'cost', { budget: B, fixed: fixed, min: min });
        if (!cost) return wait('الميزانية دي ما تكفيش أقل عدد مطلوب في كل طبقة بعد التكاليف الثابتة. زوّد الميزانية أو قلّل الحد الأدنى.');
        n = cost.total;
      } else {
        n = num(st.n); if (!(n >= 1) || n !== Math.floor(n)) return wait('اكتب حجم العينة الكلي (عدد صحيح).');
        if (n > Ntot) return wait('حجم العينة (' + fi(n) + ') أكبر من المجتمع كله (' + fi(Ntot) + ').');
        if (haveCost) cost = C.allocate(S, 'cost', { n: n, min: min });
      }
      var prop = C.allocate(S, 'prop', { n: n, min: min }), ney = C.allocate(S, 'neyman', { n: n, min: min });
      if (!prop || !ney) return wait('الحد الأدنى لكل طبقة (' + fi(min) + ') × عدد الطبقات أكبر من العينة الكلية، أو فيه طبقة أصغر من المطلوب. قلّل الحد الأدنى أو كبّر العينة.');
      var M = [{ k: 'prop', label: 'متناسب', r: prop }, { k: 'neyman', label: 'نيمان', r: ney }]; if (cost) M.push({ k: 'cost', label: 'أمثل بالتكلفة', r: cost });
      M.forEach(function (m) { m.v = C.stratVar(S, m.r.n); m.cost = haveCost ? C.stratCost(S, m.r.n, st.mode === 'budget' ? fixed : 0) : null; });
      var srs = M[0].v, best = M.slice().sort(function (a, b) { return a.v.seStrat - b.v.seStrat; })[0], maxn = 0; M.forEach(function (m) { m.r.n.forEach(function (v) { if (v > maxn) maxn = v; }); });
      var tbl = '<div class="mdc-scroll" tabindex="0" role="group" aria-label="التوزيع على الطبقات"><table class="mdc-table"><thead><tr><th scope="col">الطبقة</th><th scope="col">نسبتها</th>' + M.map(function (m) { return '<th scope="col">' + m.label + '</th>'; }).join('') + '</tr></thead><tbody>' +
        S.map(function (s, h) { return '<tr><th scope="row">' + esc(nm[h]) + '</th><td>' + pct(s.N / Ntot) + '</td>' + M.map(function (m) { return '<td class="mdc-nh"><b>' + fi(m.r.n[h]) + '</b><span class="mdc-mini"><i data-w="' + (m.r.n[h] / maxn * 100).toFixed(1) + '"></i></span></td>'; }).join('') + '</tr>'; }).join('') +
        '</tbody><tfoot><tr><th scope="row">المجموع</th><td></td>' + M.map(function (m) { return '<td><b>' + fi(m.v.n) + '</b></td>'; }).join('') + '</tr><tr><th scope="row">الخطأ المعياري للمتوسط</th><td></td>' + M.map(function (m) { return '<td>' + f(m.v.seStrat, 4) + '</td>'; }).join('') + '</tr><tr><th scope="row">هامش الخطأ 95%</th><td></td>' + M.map(function (m) { return '<td>± ' + f(1.96 * m.v.seStrat, 3) + '</td>'; }).join('') + '</tr><tr><th scope="row">أثر التصميم</th><td></td>' + M.map(function (m) { return '<td>' + f(m.v.deff, 3) + '</td>'; }).join('') + '</tr>' + (haveCost ? '<tr><th scope="row">التكلفة</th><td></td>' + M.map(function (m) { return '<td>' + fi(m.cost) + '</td>'; }).join('') + '</tr>' : '') + '</tfoot></table></div>';
      var say = 'بنفس العدد (' + fi(n) + ')، العينة العشوائية البسيطة خطأها المعياري ' + f(srs.seSrs, 4) + '. ';
      say += best.v.deff < 1 ? 'توزيع «' + best.label + '» بينزّله لـ ' + f(best.v.seStrat, 4) + '، يعني أثر تصميم ' + f(best.v.deff, 2) + ': كأنك كسبت ' + pct(1 / best.v.deff - 1, 0) + ' مشاركين زيادة من غير ما تجمعهم.' : 'الطبقية هنا ما كسبتش دقة عن العشوائية البسيطة (أثر التصميم ' + f(best.v.deff, 2) + ').';
      var notes = [];
      if (!srs.haveMeans) notes.push('ما كتبتش متوسطات الطبقات، فالمقارنة بالعشوائية البسيطة محسوبة كأن المتوسطات متساوية. لو المتوسطات مختلفة فعلاً، مكسب الطبقية هيبقى أكبر من المعروض.');
      if (!haveCost && st.mode === 'n') notes.push('اكتب تكلفة المشارك في كل طبقة عشان يظهر التوزيع الأمثل بالتكلفة.');
      M.forEach(function (m) { var capped = []; m.r.n.forEach(function (v, h) { if (v >= S[h].N) capped.push(nm[h]); }); if (capped.length) notes.push('في «' + m.label + '»: ' + capped.map(esc).join('، ') + ' اتاخدت كلها (حصر شامل) لأن نصيبها أكبر من حجمها.'); });
      var html = '<div class="mdc-hero"><p class="mdc-hero-k">أدق توزيع بنفس العدد</p><p class="mdc-hero-v">' + best.label + '</p><p class="mdc-hero-s">' + S.map(function (s, h) { return esc(nm[h]) + ' ' + fi(best.r.n[h]); }).join(' · ') + '</p></div>' +
        '<div class="mdc-res"><h3>التوزيع بالطرق ' + (M.length === 3 ? 'التلاتة' : 'الاتنين') + '</h3>' + tbl + '<p>' + say + '</p>' + (notes.length ? '<ul class="mdc-notes">' + notes.map(function (x) { return '<li>' + x + '</li>'; }).join('') + '</ul>' : '') +
        '<p class="small muted">متناسب: nₕ ∝ Nₕ. نيمان: nₕ ∝ NₕSₕ. أمثل بالتكلفة: nₕ ∝ NₕSₕ ÷ √cₕ. الكسور بتتقرّب بطريقة أكبر باقي عشان المجموع يفضل زي ما هو. الخطأ المعياري فيه تصحيح المجتمع المحدود.</p></div>';
      var rows = [['توزيع العينة الطبقية', H.today()], [], ['الطبقة', 'N', 'S', 'المتوسط', 'تكلفة المشارك'].concat(M.map(function (m) { return m.label; }))].concat(S.map(function (s, h) { return [nm[h], s.N, s.S, s.mean == null ? '' : s.mean, s.c || ''].concat(M.map(function (m) { return m.r.n[h]; })); }), [['المجموع', Ntot, '', '', ''].concat(M.map(function (m) { return m.v.n; })), ['SE', '', '', '', ''].concat(M.map(function (m) { return m.v.seStrat.toFixed(5); })), ['أثر التصميم', '', '', '', ''].concat(M.map(function (m) { return m.v.deff.toFixed(4); })), ['SE للعشوائية البسيطة', srs.seSrs.toFixed(5)]], haveCost ? [['التكلفة', '', '', '', ''].concat(M.map(function (m) { return m.cost; }))] : []);
      return { html: html, csv: rows, json: { n: n, populationN: Ntot, seSRS: srs.seSrs, betweenStrataMeansUsed: srs.haveMeans, methods: M.map(function (m) { return { method: m.k, allocation: m.r.n, se: m.v.seStrat, designEffect: m.v.deff, cost: m.cost }; }), strata: nm } };
    }
  };

  /* ---------- 04 budget and power ---------- */
  var DES = { ind: { label: 'مجموعتين مستقلتين (اختبار t)', es: 'd', unit: 'في كل مجموعة', conv: 'صغير 0.2، متوسط 0.5، كبير 0.8' }, paired: { label: 'قياسين مرتبطين (اختبار t المرتبط)', es: 'dz', unit: 'زوج', conv: 'dz = متوسط الفروق ÷ انحرافها المعياري' }, anova: { label: 'تحليل تباين أحادي (k مجموعات)', es: 'f', unit: 'في كل مجموعة', conv: 'صغير 0.10، متوسط 0.25، كبير 0.40' }, corr: { label: 'معامل ارتباط بيرسون', es: 'r', unit: 'مشارك', conv: 'صغير 0.1، متوسط 0.3، كبير 0.5' } };
  function projGuess() {
    var ps = (H.state().projects || []).slice().sort(function (a, b) { return String(b.updated || '') < String(a.updated || '') ? -1 : 1; });
    for (var i = 0; i < ps.length; i++) {
      var p = ps[i], vs = (p.vars || []).filter(function (v) { return v.name; }), iv = vs.filter(function (v) { return v.role === 'iv'; })[0], dv = vs.filter(function (v) { return v.role === 'dv'; })[0];
      if (!iv || !dv || dv.level !== 'scale') continue;
      var g = parseInt(iv.groups, 10) || 0, rel = p.paired === 'rel', o = null;
      if (iv.level === 'scale') o = { design: 'corr', why: 'متغيرين كمّيين: «' + iv.name + '» و«' + dv.name + '»' };
      else if (rel && g <= 2) o = { design: 'paired', why: 'قياسين مرتبطين على «' + dv.name + '»' };
      else if (!rel && g === 2) o = { design: 'ind', why: 'مجموعتين مستقلتين في «' + iv.name + '»' };
      else if (!rel && g >= 3) o = { design: 'anova', k: g, why: g + ' مجموعات مستقلة في «' + iv.name + '»' };
      if (o) { o.title = p.title || 'مشروع من غير عنوان'; return o; }
    }
    return null;
  }
  function powerCalc(st) {
    var d = st.design, es = num(st.es), alpha = num(st.alpha), tails = st.tails === '1' ? 1 : 2, target = num(st.power), k = Math.round(num(st.k));
    if (!DES[d]) return { err: 'اختار التصميم.' };
    if (!(es > 0)) return { err: 'اكتب حجم الأثر المتوقع (رقم أكبر من صفر).' };
    if (d === 'corr' && es >= 1) return { err: 'معامل الارتباط لازم يبقى أقل من 1.' };
    if (!(alpha > 0 && alpha <= 0.2)) return { err: 'مستوى الدلالة α لازم يبقى بين 0 و 0.20 (المعتاد 0.05).' };
    if (!(target >= 0.5 && target < 1)) return { err: 'القوة المستهدفة لازم تبقى بين 0.50 و 0.99 (المعتاد 0.80).' };
    if (d === 'anova' && !(k >= 2 && k <= 12)) return { err: 'عدد المجموعات لازم يبقى من 2 لـ 12.' };
    var per = num(st.per), fixed = num(st.fixed), budget = num(st.budget), m = st.cl ? num(st.m) : NaN, pc = st.cl ? num(st.pc) : NaN, icc = st.cl ? num(st.icc) : NaN;
    if (isNaN(per) || per < 0) per = 0; if (isNaN(fixed) || fixed < 0) fixed = 0;
    if (st.cl && icc >= 1) return { err: 'معامل الارتباط داخل المجموعة ICC لازم يبقى أقل من 1.' };
    var deff = st.cl && m > 1 && icc > 0 ? C.deffCluster(m, icc) : 1, cost = { per: per, fixed: fixed, clusterSize: st.cl && m >= 1 ? m : 0, perCluster: st.cl && pc > 0 ? pc : 0 };
    function pw(n) { var p = C.power(d, es, n / deff, alpha, tails, k); return isNaN(p) ? 0 : p; }
    var lo = C.minN(d), hi = lo, need = null;
    if (pw(lo) >= target) need = lo; else { while (pw(hi) < target && hi < 2e6) { lo = hi; hi *= 2; } if (hi < 2e6) { while (hi - lo > 1) { var mid = Math.floor((lo + hi) / 2); if (pw(mid) >= target) hi = mid; else lo = mid; } need = hi; } }
    var out = { d: d, es: es, alpha: alpha, tails: tails, target: target, k: k, deff: deff, cost: cost, pw: pw, need: need, hasCost: per > 0 || cost.perCluster > 0, budget: budget > 0 ? budget : null };
    if (need) { out.needPeople = C.people(d, need, k); out.needPower = pw(need); out.needCost = C.cost(d, need, k, cost); out.alt = [0.8, 0.9, 0.95].map(function (t) { var a = C.minN(d), b = a; if (pw(a) >= t) return [t, a]; while (pw(b) < t && b < 2e6) { a = b; b *= 2; } while (b - a > 1) { var q = Math.floor((a + b) / 2); if (pw(q) >= t) b = q; else a = q; } return [t, b]; }); }
    if (out.budget && out.hasCost) { var an = C.affordN(d, out.budget, k, cost); out.afford = an; out.affordPower = an >= C.minN(d) ? pw(an) : 0; out.affordPeople = C.people(d, an, k); out.affordCost = an ? C.cost(d, an, k, cost) : 0; }
    return out;
  }
  X.powerCalc = powerCalc;
  X.tools.power = {
    no: '04', title: 'الميزانية مقابل قوة الاختبار', color: 'coral', say: 'محتاج كام مشارك؟ وميزانيتك تجيب قوة قد إيه؟',
    what: 'بتحسب حجم العينة اللازم عشان اختبارك يلقط الأثر لو موجود، وتكلفته، والقوة اللي ميزانيتك تقدر تشتريها، وبترسم القوة قصاد الميزانية.',
    when: 'قبل جمع البيانات: وإنت بتكتب الخطة أو بتطلب تمويل، أو لما المشرف يسألك «ليه العدد ده؟».',
    ex: 'تجربة لبرنامج تدريبي على قلق الامتحان بمجموعتين، أثر متوقع متوسط (d = 0.5)، المشارك بيكلّف 40 جنيه، وفيه 1500 تكاليف ثابتة، والميزانية 6000. الأرقام افتراضية.',
    def: function () { return { design: 'ind', es: '0.5', alpha: '0.05', tails: '2', power: '0.80', k: '3', per: '', fixed: '', budget: '', cl: false, m: '', pc: '', icc: '' }; },
    example: function () { return { design: 'ind', es: '0.5', alpha: '0.05', tails: '2', power: '0.80', k: '3', per: '40', fixed: '1500', budget: '6000', cl: false, m: '', pc: '', icc: '' }; },
    form: function (st) {
      var g = projGuess(), ds = DES[st.design] || DES.ind;
      return (g ? '<div class="mdc-prefill"><p><strong>من مشروعك «' + esc(g.title) + '»:</strong> ' + esc(g.why) + '، يعني التصميم المناسب: ' + esc(DES[g.design].label) + '.</p><button class="btn" type="button" data-act="prefill">املأ التصميم من مشروعي</button></div>' : '') +
        '<div class="card mdc-card"><h2>الاختبار</h2><div class="mdc-fields">' + pick('design', st.design, 'التصميم', Object.keys(DES).map(function (k) { return [k, DES[k].label]; }), { re: true }) +
        inp('es', st.es, 'حجم الأثر المتوقع (' + ds.es + ')', { hint: ds.conv }) + (st.design === 'anova' ? inp('k', st.k, 'عدد المجموعات k') : '') +
        inp('alpha', st.alpha, 'مستوى الدلالة α') + (st.design === 'anova' ? '' : pick('tails', st.tails, 'الاختبار', [['2', 'بذيلين (غير موجّه)'], ['1', 'بذيل واحد (فرض موجّه)']])) + inp('power', st.power, 'القوة المستهدفة', { hint: 'المعتاد 0.80' }) + '</div>' +
        '<p class="small muted">حجم الأثر خُده من دراسات سابقة أو من أصغر أثر يهمّك عملياً، مش من أمنيتك. تصنيف كوهين (صغير، متوسط، كبير) مجرد عُرف.</p></div>' +
        '<div class="card mdc-card"><h2>التكلفة والميزانية</h2><div class="mdc-fields">' + inp('per', st.per, 'تكلفة المشارك الواحد', { hint: 'طباعة، وقت، حافز' }) + inp('fixed', st.fixed, 'تكاليف ثابتة', { hint: 'اختياري' }) + inp('budget', st.budget, 'الميزانية المتاحة', { hint: 'اختياري' }) + '</div>' +
        '<label class="mdc-check"><input type="checkbox" data-p="cl" data-re' + (st.cl ? ' checked' : '') + '><span>المشاركين جايين في مجموعات جاهزة (فصول، مدارس، مراكز)</span></label>' +
        (st.cl ? '<div class="mdc-fields">' + inp('m', st.m, 'عدد المشاركين في المجموعة') + inp('pc', st.pc, 'تكلفة الوصول لكل مجموعة', { hint: 'اختياري' }) + inp('icc', st.icc, 'الارتباط داخل المجموعة ICC', { hint: 'اختياري. بيكبّر العينة المطلوبة' }) + '</div>' : '') + '</div>';
    },
    act: function (st, act) { if (act === 'prefill') { var g = projGuess(); if (g) { st.design = g.design; if (g.k) st.k = String(g.k); H.toast('اتملى التصميم من مشروعك. راجع حجم الأثر.'); } } },
    out: function (st) {
      var r = powerCalc(st); if (r.err) return wait(r.err);
      var ds = DES[r.d], u = ds.unit, grp = r.d === 'ind' ? 2 : r.d === 'anova' ? r.k : 1;
      if (!r.need) return wait('الأثر ده صغير جداً: العينة المطلوبة أكبر من مليونين. راجع حجم الأثر.');
      var hero = '<div class="mdc-hero"><p class="mdc-hero-k">العينة اللازمة لقوة ' + f(r.target, 2) + '</p><p class="mdc-hero-v"><span class="num" data-count="' + r.need + '">' + r.need + '</span> <small>' + u + '</small></p><p class="mdc-hero-s">' + (grp > 1 ? 'يعني ' + fi(r.needPeople) + ' مشارك في ' + grp + ' مجموعات. ' : r.d === 'paired' ? 'كل زوج = نفس الشخص مرتين أو شخصين متناظرين. ' : '') + 'القوة الفعلية عند العدد ده ' + f(r.needPower, 4) + '.' + (r.hasCost ? ' التكلفة ' + fi(r.needCost) + '.' : '') + '</p></div>';
      var verdict = '';
      if (r.budget && r.hasCost) {
        var enough = r.afford >= r.need;
        verdict = '<div class="mdc-verdict ' + (enough ? 'ok' : 'warn') + '"><h3>' + (enough ? ic('check') + 'ميزانيتك تكفّي' : 'ميزانيتك ما تكفّيش القوة المستهدفة') + '</h3><p>' +
          (r.afford < C.minN(r.d) ? 'الميزانية (' + fi(r.budget) + ') ما تكفيش حتى أقل عينة بعد التكاليف الثابتة.' : 'بـ ' + fi(r.budget) + ' تقدر تجيب <strong>' + fi(r.afford) + ' ' + u + '</strong>' + (grp > 1 ? ' (' + fi(r.affordPeople) + ' مشارك)' : '') + '، والقوة ساعتها <strong>' + f(r.affordPower, 3) + '</strong>.') + ' ' +
          (enough ? 'يفضل معاك ' + fi(r.budget - r.needCost) + ' بعد العينة اللازمة.' : 'ناقصك ' + fi(r.needCost - r.budget) + ' عشان توصل للقوة ' + f(r.target, 2) + '. يا تزوّد الميزانية، يا تقلّل تكلفة المشارك، يا تختار تصميم أوفر (القياس المتكرر مثلاً)، يا تقبل إن الدراسة قوتها أقل وتكتب ده في الحدود.') + '</p></div>';
      } else if (!r.hasCost) verdict = '<p class="notice">اكتب تكلفة المشارك عشان نحسب التكلفة ونرسم القوة قصاد الميزانية.</p>';
      var fig, pts = [], i;
      if (r.hasCost) {
        var c0 = C.cost(r.d, C.minN(r.d), r.k, r.cost), c1 = Math.max(r.needCost * 1.6, (r.budget || 0) * 1.15, c0 * 2), lastN = -1, lastP = 0;
        for (i = 0; i <= 90; i++) { var b = c0 + (c1 - c0) * i / 90, n = C.affordN(r.d, b, r.k, r.cost); if (n !== lastN) { lastP = r.pw(n); lastN = n; } pts.push([b, lastP]); }
        var vm = [{ x: r.needCost, label: 'اللازم ' + fx(r.needCost, 0) }]; if (r.budget) vm.push({ x: r.budget, label: 'ميزانيتك ' + fx(r.budget, 0), cls: 'b' });
        fig = chart({ x0: c0, x1: c1, y0: 0, y1: 1, xl: 'الميزانية', xfmt: function (v) { return fx(v, 0); }, series: [{ name: 'القوة', pts: pts }], hmarks: [{ y: r.target, label: 'القوة المستهدفة ' + fx(r.target, 2) }], vmarks: vm, dots: r.budget && r.afford >= C.minN(r.d) && r.budget <= c1 ? [{ x: r.budget, y: r.affordPower }] : [], label: 'منحنى القوة مقابل الميزانية' });
      } else {
        var n1 = Math.max(Math.ceil(r.need * 1.8), C.minN(r.d) + 10), n0 = C.minN(r.d);
        for (i = 0; i <= 70; i++) { var nn = Math.round(n0 + (n1 - n0) * i / 70); pts.push([nn, r.pw(nn)]); }
        fig = chart({ x0: n0, x1: n1, y0: 0, y1: 1, xl: 'العدد ' + u, xfmt: function (v) { return fx(v, 0); }, series: [{ name: 'القوة', pts: pts }], hmarks: [{ y: r.target, label: 'القوة المستهدفة ' + fx(r.target, 2) }], vmarks: [{ x: r.need, label: 'اللازم ' + r.need }], label: 'منحنى القوة مقابل حجم العينة' });
      }
      var alt = '<div class="mdc-scroll" tabindex="0" role="group" aria-label="العينة حسب القوة"><table class="mdc-table"><thead><tr><th scope="col">القوة</th><th scope="col">العدد ' + u + '</th><th scope="col">إجمالي المشاركين</th>' + (r.hasCost ? '<th scope="col">التكلفة</th>' : '') + '</tr></thead><tbody>' + r.alt.map(function (a) { return '<tr><th scope="row">' + f(a[0], 2) + '</th><td>' + fi(a[1]) + '</td><td>' + fi(C.people(r.d, a[1], r.k)) + '</td>' + (r.hasCost ? '<td>' + fi(C.cost(r.d, a[1], r.k, r.cost)) + '</td>' : '') + '</tr>'; }).join('') + '</tbody></table></div>';
      var how = { ind: 'توزيع t اللامركزي', paired: 'توزيع t اللامركزي', anova: 'توزيع F اللامركزي', corr: 'التوزيع الدقيق لمعامل الارتباط في مجتمع ثنائي الاعتدال' }[r.d];
      var html = hero + verdict + '<div class="mdc-res"><h3>' + (r.hasCost ? 'القوة قصاد الميزانية' : 'القوة قصاد حجم العينة') + '</h3>' + fig + '<p class="small muted">المنحنى بيطلع بسرعة في الأول وبعدين بيتسطّح: كل جنيه زيادة بعد نقطة معيّنة بيشتري قوة أقل.</p></div>' +
        '<div class="mdc-res"><h3>لو عايز قوة أعلى</h3>' + alt + '</div>' +
        (r.deff > 1 ? '<p class="notice">عشان المشاركين في مجموعات جاهزة، العينة اتكبّرت بأثر التصميم 1 + (m − 1) × ICC = ' + f(r.deff, 2) + '. ده تقريب معروف بيفترض مجموعات متساوية الحجم؛ التحليل نفسه لازم يراعي التجمّع (نموذج متعدد المستويات مثلاً).</p>' : '') +
        '<p class="small muted mdc-method">طريقة الحساب: ' + how + '، بحساب عددي مباشر (مش تقريب بالتوزيع الطبيعي). النتائج اتراجعت على قيم G*Power المعروفة وعلى مكتبة SciPy' + (r.d === 'corr' ? '، وبتطابق خيار «Exact: bivariate normal model» في G*Power' : '') + '. بتفترض اعتدالية وتجانس تباين ومجموعات متساوية.</p>';
      var rows = [['الميزانية مقابل القوة', H.today()], [], ['التصميم', ds.label], ['حجم الأثر (' + ds.es + ')', r.es], ['alpha', r.alpha], ['الذيول', r.d === 'anova' ? '' : r.tails], ['القوة المستهدفة', r.target]].concat(r.d === 'anova' ? [['عدد المجموعات', r.k]] : [], [['أثر التصميم', r.deff.toFixed(4)], ['العدد اللازم (' + u + ')', r.need], ['إجمالي المشاركين', r.needPeople], ['القوة الفعلية', r.needPower.toFixed(4)]], r.hasCost ? [['تكلفة العينة اللازمة', r.needCost]] : [], r.afford != null ? [['الميزانية', r.budget], ['العدد المتاح بالميزانية', r.afford], ['القوة بالميزانية', r.affordPower.toFixed(4)]] : [], [[], [r.hasCost ? 'الميزانية' : 'n', 'القوة']], pts.map(function (p) { return [Math.round(p[0]), p[1].toFixed(4)]; }));
      return { html: html, csv: rows, json: { design: r.d, effectSize: r.es, alpha: r.alpha, tails: r.tails, targetPower: r.target, groups: grp, designEffect: r.deff, requiredN: r.need, requiredPeople: r.needPeople, achievedPower: r.needPower, requiredCost: r.hasCost ? r.needCost : null, budget: r.budget, affordableN: r.afford == null ? null : r.afford, powerAtBudget: r.afford == null ? null : r.affordPower, curve: pts } };
    }
  };

  /* ---------- entry ---------- */
  function view(main, a, b) {
    D = H.data('decide'); if (D.v !== 1) D.v = 1; X.D = D;
    if (!a) home(main);
    else if (a === 'wizard') X.wizard(main, b);
    else if (X.tools[a]) toolPage(main, a);
    else main.innerHTML = '<header class="head"><h1>الأداة دي مش موجودة</h1><p><a class="btn" href="#decide">كل أدوات القرار</a></p></header>';
    if (D.last !== (a || '')) { D.last = a || ''; H.save(); }
  }
  X.toolPage = toolPage;
  H.register('decide', function (main, a, b) {
    if (loaded) return view(main, a, b);
    ensure(function (ok) {
      if ((location.hash || '').slice(1).split('/')[0] !== 'decide') return;
      if (!ok) { main.innerHTML = '<header class="head"><h1>بحوث العمليات والقرار</h1><p class="lead">ملفات القسم ما اتحمّلتش. اتأكد من النت وجرّب تاني.</p><p><a class="btn" href="#home">رجوع للرئيسية</a></p></header>'; return; }
      view(main, a, b); if (window.HubMotion && window.HubMotion.after) { try { window.HubMotion.after(main, 'decide'); } catch (e) {} }
    });
  });
})();
