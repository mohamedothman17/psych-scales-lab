/* Hub app: hash router + local store. No dependencies. All user text is escaped through esc(). */
(function () {
  'use strict';
  var BRAND = 'مَلَكة';
  var LABS = {
    scales: 'https://mohamedothman17.github.io/psych-scales-lab/',
    stats: 'https://mohamedothman17.github.io/psych-stats-lab/'
  };
  var KEY = 'hub-v1', THEME_KEY = 'hub-theme', INTRO_KEY = 'hub-intro';
  var main = document.getElementById('main');

  /* ---------- theme (runs before the first render) ---------- */
  var darkMq = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
  function storedTheme() { try { var t = localStorage.getItem(THEME_KEY); return t === 'dark' || t === 'light' ? t : ''; } catch (e) { return ''; } }
  function applyTheme(force) {
    var t = force || storedTheme() || (darkMq && darkMq.matches ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', t);
    var m = document.querySelector('meta[name="theme-color"]'); if (m) m.setAttribute('content', t === 'dark' ? '#0c032c' : '#eae7fe');
    return t;
  }
  var theme = applyTheme();
  if (darkMq) { var onMq = function () { if (!storedTheme()) { theme = applyTheme(); drawTheme(); } }; if (darkMq.addEventListener) darkMq.addEventListener('change', onMq); else if (darkMq.addListener) darkMq.addListener(onMq); }

  /* ---------- store ---------- */
  var S = load();
  function load() {
    var d = { role: '', profile: {}, projects: [], kids: [], mods: {} };
    try { var j = JSON.parse(localStorage.getItem(KEY) || 'null'); if (j && typeof j === 'object') { for (var k in d) if (j[k] != null) d[k] = j[k]; } } catch (e) {}
    if (!Array.isArray(d.projects)) d.projects = [];
    if (!Array.isArray(d.kids)) d.kids = [];
    return d;
  }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); return true; } catch (e) { toast('مقدرناش نحفظ على الجهاز. المساحة ممكن تكون مليانة.'); return false; } }
  function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }

  /* ---------- helpers ---------- */
  function esc(v) { return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  var toastT;
  function toast(msg) { var t = document.getElementById('toast'); t.innerHTML = (msg === 'اتحفظ' || msg === 'اتسجّل' ? ic('check') : '') + '<span>' + esc(msg) + '</span>'; t.hidden = false; clearTimeout(toastT); toastT = setTimeout(function () { t.hidden = true; }, 3200); }
  function today() { return new Date().toISOString().slice(0, 10); }
  function opts(list, cur) { return list.map(function (o) { var v = Array.isArray(o) ? o[0] : o, l = Array.isArray(o) ? o[1] : o; return '<option value="' + esc(v) + '"' + (v === cur ? ' selected' : '') + '>' + esc(l) + '</option>'; }).join(''); }
  function field(id, label, val, hint, type) {
    var h = hint ? '<span class="hint">' + esc(hint) + '</span>' : '';
    if (type === 'area') return '<label for="' + id + '">' + esc(label) + h + '</label><textarea id="' + id + '" data-f="' + id + '">' + esc(val) + '</textarea>';
    return '<label for="' + id + '">' + esc(label) + h + '</label><input type="' + (type || 'text') + '" id="' + id + '" data-f="' + id + '" value="' + esc(val) + '">';
  }
  function sel(id, label, list, cur, hint) {
    return '<label for="' + id + '">' + esc(label) + (hint ? '<span class="hint">' + esc(hint) + '</span>' : '') + '</label><select id="' + id + '" data-f="' + id + '"><option value="">اختار…</option>' + opts(list, cur) + '</select>';
  }

  function fmtDate(iso) { var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso || '')); return '<bdi class="num" dir="ltr">' + (m ? m[3] + '/' + m[2] + '/' + m[1] : esc(iso)) + '</bdi>'; }
  function sr(t) { return '<span class="sr">' + t + '</span>'; }
  function plural(n, one, two, few, many) { return n === 1 ? one : n === 2 ? two : n >= 3 && n <= 10 ? n + ' ' + few : n + ' ' + many; }

  /* ---------- icons: small inline SVG, drawn with the current text colour ---------- */
  var ICONS = {
    home: '<path class="fill" d="M10 1.5Q11.300 8.700 18.500 10 11.300 11.300 10 18.500 8.700 11.300 1.500 10 8.700 8.700 10 1.500Z"/>',
    projects: '<polygon points="10,1.5 11.300,6 15,3.100 13.400,7.500 18.100,7.400 14.300,10 18.100,12.600 13.400,12.500 15,16.900 11.300,14 10,18.500 8.700,14 5,16.900 6.600,12.500 1.900,12.600 5.700,10 1.900,7.400 6.600,7.500 5,3.100 8.700,6"/>',
    steps: '<circle cx="4.5" cy="14.5" r="1.6"/><circle cx="10" cy="5.5" r="1.6"/><circle cx="15.5" cy="12" r="1.6"/><path d="m5.4 13.1 3.7-6.2M11.2 6.7l3.3 4.1"/>',
    profile: '<circle cx="10" cy="10" r="8"/><circle cx="9.500" cy="10.700" r="5"/><circle class="fill" cx="9" cy="11.400" r="2"/>',
    user: '<circle cx="10" cy="7" r="3"/><path d="M4 16.5c.8-2.8 3.1-4.2 6-4.2s5.2 1.4 6 4.2"/>',
    family: '<rect x="2.500" y="10.500" width="7" height="7" rx="1.500"/><path d="M6 2.800 9.600 9H2.400z"/><circle cx="14.300" cy="7.200" r="3.200"/><path d="M11.500 17.500a3.500 3.500 0 0 1 7 0z"/>',
    labs: '<path d="M8 3.5v4.6L4.2 15a1 1 0 0 0 .9 1.5h9.8a1 1 0 0 0 .9-1.5L12 8.1V3.5M7 3.5h6M6.3 12h7.4"/>',
    measure: '<path d="M3 13.5 13.5 3l3.5 3.5L6.5 17zM6 10.5 7.5 12M8.5 8l1.5 1.5M11 5.5 12.5 7"/>',
    stats: '<path d="M2.5 15.5c3 0 3.7-11 7.5-11s4.5 11 7.5 11M10 4.5v11"/>',
    library: '<path d="M10 5.2C8.3 4 6.2 3.7 3.5 3.9v11c2.7-.2 4.8.1 6.5 1.3 1.700-1.2 3.8-1.5 6.5-1.3v-11c-2.7-.2-4.8.1-6.5 1.3zM10 5.2v11"/>',
    games: '<rect x="3.5" y="3.5" width="5.500" height="5.5" rx="1.2"/><circle cx="13.800" cy="6.2" r="2.8"/><path d="m6.2 11.500 3 5h-6zM11.500 11.500h5v5h-5z"/>',
    ops: '<path d="M3.5 16.5h13M5.5 13.5v-3M10 13.5v-7M14.5 13.5V4"/>',
    opps: '<path d="M10 2.800 11.700 8.300 17.200 10l-5.500 1.700L10 17.200 8.300 11.700 2.800 10l5.500-1.700z"/>',
    career: '<rect x="3" y="6.500" width="14" height="9.500" rx="1.500"/><path d="M7.500 6.500V5a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1v1.500M3 11h14"/>',
    guide: '<circle cx="10" cy="10" r="6.800"/><path d="m12.800 7.200-1.500 4.100-4.100 1.500 1.500-4.100z"/>',
    check: '<path d="m5 10.500 3.300 3.300L15 6.800"/>',
    plus: '<path d="M10 4.500v11M4.500 10h11"/>',
    close: '<path d="m5.500 5.500 9 9M14.500 5.500l-9 9"/>',
    fwd: '<path d="m12 5-5 5 5 5"/>',
    back: '<path d="m8 5 5 5-5 5"/>',
    sun: '<circle cx="10" cy="10" r="3.200"/><path d="M10 2.800v1.700M10 15.500v1.700M2.800 10h1.700M15.500 10h1.700M4.900 4.900l1.200 1.200M13.900 13.900l1.200 1.200M4.900 15.100l1.200-1.200M13.900 6.100l1.200-1.200"/>',
    moon: '<path d="M16 11.600A6.300 6.300 0 0 1 8.400 4a6.300 6.300 0 1 0 7.600 7.600z"/>',
    more: '<circle cx="4.500" cy="10" r="1.100"/><circle cx="10" cy="10" r="1.100"/><circle cx="15.500" cy="10" r="1.100"/>',
    print: '<path d="M6 7V3.500h8V7M6 14H4.500a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1h11a1 1 0 0 1 1 1v5a1 1 0 0 1-1 1H14M6 11.500h8v5H6z"/>',
    download: '<path d="M10 3.500v9M6.500 9.200l3.500 3.500 3.500-3.500M4 16h12"/>',
    trash: '<path d="M4 6h12M8 6V4.200h4V6M5.500 6l.7 10h7.600l.7-10M8.500 9v4.500M11.500 9v4.500"/>',
    clock: '<circle cx="10" cy="10" r="6.500"/><path d="M10 6.500V10l2.300 1.500"/>'
  };
  ICONS.theories = ICONS.library; ICONS.kids = ICONS.games; ICONS.decide = ICONS.ops; ICONS.explore = ICONS.opps; ICONS.assistant = ICONS.guide;
  function ic(name, cls) { return '<svg class="ic' + (cls ? ' ' + cls : '') + '" viewBox="0 0 20 20" aria-hidden="true" focusable="false">' + (ICONS[name] || '') + '</svg>'; }

  /* ---------- roles & nav ---------- */
  var ROLES = { researcher: 'باحث', specialist: 'أخصائي', parent: 'ولي أمر', student: 'طالب' };
  var NAV = [
    ['home', 'الرئيسية', null, 'الرئيسية'],
    ['projects', 'مشاريعي البحثية', ['researcher', 'student', 'specialist'], 'مشاريعي'],
    ['profile', 'ملفي', ['researcher', 'student', 'specialist'], 'ملفي'],
    ['family', 'أولادي', ['parent', 'specialist'], 'أولادي'],
    ['labs', 'المعامل', null, 'المعامل']
  ];
  /* Sections that live in their own files (hub/mod-<name>.js + .css) and load on first visit.
     A section file calls Hub.register(name, function (main, a, b) { ... }). Flip `ready` once the file ships. */
  var MODS = {
    theories: { title: 'مكتبة النظريات', short: 'النظريات', say: 'كل نظرية بأدلتها ونقدها وأنشطتها', roles: null, ready: true },
    kids: { title: 'ألعاب وأنشطة الأطفال', short: 'الألعاب', say: 'ذاكرة، انتباه، استدلال، مرونة، إبداع', roles: ['parent', 'specialist'], ready: true },
    decide: { title: 'بحوث العمليات والقرار', short: 'القرار', say: 'توزيع العينة، الميزانية مقابل القوة، مقارنة البدائل', roles: ['researcher', 'student', 'specialist'], ready: true },
    explore: { title: 'مستكشف الأدبيات والفرص', short: 'الأدبيات', say: 'أبحاث بروابطها، وفرص متراجعة بتاريخها', roles: ['researcher', 'student', 'specialist'], ready: true },
    cases: { title: 'محاكي الأخصائي', short: 'الحالات', say: 'احكي الحالة، وخد فروض وخطة تتأكد بيها', roles: ['specialist'], ready: true },
    assistant: { title: 'المساعد الذكي', short: 'المساعد', say: 'اسأله عن بحثك، أو خلّيه يشتغل معاك خطوة خطوة', roles: null, ready: true }
  };
  Object.keys(MODS).forEach(function (k) { if (MODS[k].ready) NAV.splice(NAV.length - 1, 0, [k, MODS[k].title, MODS[k].roles, MODS[k].short]); });
  var MOD_VIEWS = {}, MOD_LOADING = {};
  function loadMod(name, done) {
    if (MOD_VIEWS[name]) return done(true);
    if (MOD_LOADING[name]) { MOD_LOADING[name].push(done); return; }
    MOD_LOADING[name] = [done];
    function end(ok) { var q = MOD_LOADING[name] || []; delete MOD_LOADING[name]; q.forEach(function (f) { f(ok && !!MOD_VIEWS[name]); }); }
    var l = document.createElement('link'); l.rel = 'stylesheet'; l.href = 'mod-' + name + '.css'; document.head.appendChild(l);
    var sc = document.createElement('script'); sc.src = 'mod-' + name + '.js'; sc.onload = function () { end(true); }; sc.onerror = function () { end(false); };
    document.head.appendChild(sc);
  }
  function modView(name, a, b) {
    var m = MODS[name];
    main.innerHTML = '<header class="head"><h1>' + esc(m.title) + '</h1><p class="lead" role="status">جارٍ التحميل…</p></header>';
    loadMod(name, function (ok) {
      if ((location.hash || '').slice(1).split('/')[0] !== name) return;
      if (ok) { MOD_VIEWS[name](main, a, b); stage(name); }
      else main.innerHTML = '<header class="head"><h1>' + esc(m.title) + '</h1><p class="lead">القسم ده لسه بنجهّزه، أو النت قطع. جرّب تاني بعد شوية.</p><p><a class="btn" href="#home">رجوع للرئيسية</a></p></header>';
    });
  }
  var TAB_MAX = 5;
  function drawNav(route) {
    var items = NAV.filter(function (n) { return !n[2] || !S.role || n[2].indexOf(S.role) > -1; });
    function link(n, short) {
      var badge = !short && n[0] === 'projects' && S.projects.length ? '<span class="count num">' + S.projects.length + '</span>' : '';
      return '<a href="#' + n[0] + '"' + (route === n[0] ? ' aria-current="page"' : '') + '>' + ic(n[0]) + '<span>' + (short ? n[3] : n[1]) + '</span>' + badge + '</a>';
    }
    document.getElementById('brandName').textContent = BRAND;
    document.getElementById('nav').innerHTML = items.map(function (n) { return link(n, false); }).join('');
    var tabs = document.getElementById('tabs'), shown = items, rest = [];
    if (items.length > TAB_MAX) { shown = items.slice(0, TAB_MAX - 1); rest = items.slice(TAB_MAX - 1); }
    tabs.innerHTML = shown.map(function (n) { return link(n, true); }).join('') + (rest.length ?
      '<button type="button" id="moreBtn" aria-expanded="false" aria-controls="morePop"' + (rest.some(function (n) { return n[0] === route; }) ? ' class="on"' : '') + '>' + ic('more') + '<span>المزيد</span></button>' +
      '<div class="more-pop" id="morePop" hidden>' + rest.map(function (n) { return link(n, false); }).join('') + '</div>' : '');
    tabs.className = 'tabs n' + (shown.length + (rest.length ? 1 : 0));
    var mb = document.getElementById('moreBtn');
    if (mb) mb.addEventListener('click', function () { var pop = document.getElementById('morePop'); pop.hidden = !pop.hidden; mb.setAttribute('aria-expanded', String(!pop.hidden)); });
    document.getElementById('roleBtn').innerHTML = ic('user') + '<span>' + (S.role ? 'أنا: ' + ROLES[S.role] : 'اختار دورك') + '</span>';
    document.getElementById('skipBtn').hidden = !(route === 'home' && !S.role && !introSeen());
    drawTheme();
  }
  function drawTheme() {
    var b = document.getElementById('themeBtn'), toDark = theme !== 'dark', label = toDark ? 'الوضع الداكن' : 'الوضع الفاتح';
    b.innerHTML = ic(toDark ? 'moon' : 'sun') + '<span>' + label + '</span>';
    b.setAttribute('aria-label', 'بدّل إلى ' + label);
  }
  function calm() { return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches); }
  document.getElementById('roleBtn').addEventListener('click', function () {
    var c = document.getElementById('choose');
    if (c) c.scrollIntoView({ behavior: calm() ? 'auto' : 'smooth' }); else location.hash = '#role';
  });
  document.getElementById('skipBtn').addEventListener('click', function (e) { e.preventDefault(); setIntro(true); goHome(); });
  /* Theme change sweeps out from the toggle as a growing circle when the browser can do it. */
  document.getElementById('themeBtn').addEventListener('click', function () {
    var t = theme === 'dark' ? 'light' : 'dark', btn = this, root = document.documentElement;
    try { localStorage.setItem(THEME_KEY, t); } catch (e) {}
    function apply() { theme = applyTheme(t); drawTheme(); window.dispatchEvent(new Event('hub:theme')); }
    if (!document.startViewTransition || calm()) { apply(); return; }
    var r = btn.getBoundingClientRect(), x = r.left + r.width / 2, y = r.top + r.height / 2, far = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));
    root.classList.add('theming');
    var vt = document.startViewTransition(apply), done = function () { root.classList.remove('theming'); };
    vt.ready.then(function () {
      root.animate({ clipPath: ['circle(0px at ' + x + 'px ' + y + 'px)', 'circle(' + Math.ceil(far) + 'px at ' + x + 'px ' + y + 'px)'] }, { duration: 560, easing: 'cubic-bezier(.4,0,.2,1)', pseudoElement: '::view-transition-new(root)' });
    }).catch(function () {});
    vt.finished.then(done, done); vt.updateCallbackDone.catch(function () {});
  });

  /* ---------- drawings: star chart, girih rosette, growth rings ---------- */
  function f1(n) { return Math.round(n * 10) / 10; }
  function seeded(seed) { return function () { seed = (seed * 16807) % 2147483647; return seed / 2147483647; }; }
  function pad2(n) { return (n < 10 ? '0' : '') + n; }

  /* Ten steps as a constellation. Lit = step complete; the first incomplete step carries the halo. */
  function starChart(p, mobile) {
    var W = mobile ? 340 : 760, H = mobile ? 236 : 300, i, h;
    var ys = mobile ? [44, 28, 54, 30, 50, 150, 176, 146, 172, 152] : [150, 92, 176, 118, 66, 158, 204, 132, 188, 108];
    var pts = STEPS.map(function (s, k) { return [f1(mobile ? (k < 5 ? 298 - 64 * k : 42 + 64 * (k - 5)) : W - 62 - k * (W - 124) / 9), ys[k]]; });
    var done = STEPS.map(function (s) { return p ? stepDone(p, s[0]) : false; });
    var nx = done.indexOf(false), n = done.filter(Boolean).length;
    var label = p ? 'خريطة أجزاء المشروع: ' + n + ' من ' + STEPS.length + ' مكتملة' + (nx > -1 ? '، والجزء الجاي ' + STEPS[nx][1] : '') : 'خريطة أجزاء المشروع العشرة. لسه مفيش جزء مكتمل.';
    h = '<svg class="chart ' + (mobile ? 'chart-m' : 'chart-d') + '" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(label) + '">';
    var cy = H * 4.1, rays = '';
    for (i = 0; i < 5; i++) rays += 'M' + W / 2 + ' ' + cy + 'L' + f1(W * (0.04 + i * 0.23)) + ' 0';
    h += '<g class="sky-grid"><circle cx="' + W / 2 + '" cy="' + cy + '" r="' + f1(H * 3.3) + '"/><circle cx="' + W / 2 + '" cy="' + cy + '" r="' + f1(H * 3.55) + '"/><circle cx="' + W / 2 + '" cy="' + cy + '" r="' + f1(H * 3.8) + '"/><path d="' + rays + '"/></g>';
    var r = seeded(mobile ? 7 : 11), dots = '';
    for (i = 0; i < (mobile ? 30 : 60); i++) dots += '<circle class="tw' + (i % 4) + '" cx="' + f1(r() * W) + '" cy="' + f1(r() * H) + '" r="' + (r() < 0.2 ? 1.1 : 0.6) + '" opacity="' + f1(0.25 + r() * 0.5) + '"/>';
    h += '<g class="sky-field">' + dots + '</g>';
    for (i = 0; i < pts.length - 1; i++) {
      h += '<path class="lk ' + (done[i] && done[i + 1] ? 'link-done" pathLength="1' : (done[i] && i + 1 === nx) ? 'link-next' : 'link-todo') + '" data-d="' + (520 + i * 110) + '" d="M' + pts[i][0] + ' ' + pts[i][1] + 'L' + pts[i + 1][0] + ' ' + pts[i + 1][1] + '"/>';
    }
    var lit = '', run = 0;
    for (i = 0; i < pts.length; i++) { if (done[i] && (i === 0 || done[i - 1])) { lit += (run ? 'L' : 'M') + pts[i][0] + ' ' + pts[i][1]; run++; } else if (i > 0 && !done[i]) break; }
    if (run > 1) h += '<path class="comet" pathLength="100" d="' + lit + '"/>';
    function wrap(k, body, state) {
      if (!p) return body;
      var tx = pts[k][0], ty = pts[k][1] - (mobile ? 30 : 40), tw = state.length * 7.5 + 22;
      return '<a class="sta" href="#project/' + p.id + '/' + STEPS[k][0] + '" aria-label="' + esc(STEPS[k][1] + ': ' + state) + '">' + body +
        '<g class="tip" aria-hidden="true"><rect x="' + f1(tx - tw / 2) + '" y="' + (ty - 15) + '" width="' + f1(tw) + '" height="22" rx="11"/><text x="' + tx + '" y="' + ty + '">' + state + '</text></g></a>';
    }
    STEPS.forEach(function (s, k) {
      var x = pts[k][0], y = pts[k][1], isNext = k === nx;
      var up = mobile ? k === 4 : (k === 0 || ys[k - 1] > y) && (k === 9 || ys[k + 1] > y) && k > 0;
      function lab(dy) { return '<text class="t" x="' + x + '" y="' + (up ? y - dy + 12 : y + dy) + '">' + esc(s[1]) + '</text>'; }
      var num = mobile ? '' : '<text class="n" x="' + x + '" y="' + (up ? y + (isNext ? 58 : 30) : y - (isNext ? 50 : 22)) + '">' + pad2(k + 1) + '</text>';
      if (isNext) {
        var a = mobile ? [38, 26, 18, 11, 18, 44] : [58, 40, 27, 16, 26, 62];
        h += wrap(k, '<g class="st next" data-d="' + (460 + k * 110) + '"><circle cx="' + x + '" cy="' + y + '" r="' + a[0] + '" fill="url(#glow)"/><circle class="halo h3" cx="' + x + '" cy="' + y + '" r="' + a[1] + '"/><circle class="halo h2" cx="' + x + '" cy="' + y + '" r="' + a[2] + '"/><circle class="halo h1" cx="' + x + '" cy="' + y + '" r="' + a[3] + '"/>' +
          '<use href="#star4" x="' + (x - a[4] / 2) + '" y="' + (y - a[4] / 2) + '" width="' + a[4] + '" height="' + a[4] + '"/>' + num + lab(a[5]) + '</g>', 'الخطوة الجاية');
      } else if (done[k]) {
        var z = mobile ? 15 : 19;
        h += wrap(k, '<g class="st done" data-d="' + (460 + k * 110) + '"><circle cx="' + x + '" cy="' + y + '" r="' + z + '" fill="url(#glowS)"/><use href="#star4" x="' + (x - z / 2) + '" y="' + (y - z / 2) + '" width="' + z + '" height="' + z + '"/>' + num + lab(mobile ? 27 : 31) + '</g>', 'مكتمل');
      } else {
        h += wrap(k, '<g class="st todo" data-d="' + (460 + k * 110) + '"><circle class="hit" cx="' + x + '" cy="' + y + '" r="16"/><circle cx="' + x + '" cy="' + y + '" r="' + (mobile ? 3.6 : 4.5) + '"/>' + num + lab(mobile ? 24 : 28) + '</g>', 'ناقص');
      }
    });
    return h + '</svg>';
  }

  /* Ten-fold girih rosette: one petal per step, filled when the step is complete; the next step is the accent petal. */
  function rosette(p, big) {
    var R = 100, r1 = 44, r0 = 25, u2 = 73, rad = Math.PI / 180, u1 = r1 * Math.cos(18 * rad), w = r1 * Math.sin(18 * rad), i, a, b;
    function loc(ang, u, v) { var c = Math.cos(ang * rad), s = Math.sin(ang * rad); return f1(u * c - v * s) + ',' + f1(u * s + v * c); }
    function ax(k) { return -90 - 36 * k; }
    var done = STEPS.map(function (s) { return p ? stepDone(p, s[0]) : false; });
    var nx = p ? done.indexOf(false) : -1, n = done.filter(Boolean).length, frame = [], star = [];
    for (i = 0; i < 10; i++) { frame.push(loc(ax(i), R, 0)); star.push(loc(ax(i), r0, 0)); star.push(loc(ax(i) - 18, r1, 0)); }
    var h = '<svg class="ros' + (big ? ' big' : '') + '" viewBox="-104 -104 208 208" role="img" aria-label="' + n + ' من ' + STEPS.length + ' أجزاء مكتملة"><polygon class="g-frame" points="' + frame.join(' ') + '"/>';
    for (i = 0; i < 10; i++) {
      a = ax(i); b = ax(i + 1);
      h += '<polygon class="g-gap' + (done[i] && done[(i + 1) % 10] ? ' on' : '') + '" data-d="' + (700 + i * 70) + '" points="' + [loc(a - 18, r1, 0), loc(a, u2, -w), loc(a, R, 0), loc(b, R, 0), loc(b, u2, w)].join(' ') + '"/>';
    }
    for (i = 0; i < 10; i++) {
      a = ax(i);
      var cls = done[i] ? 'done' : i === nx ? 'next' : 'todo';
      h += '<polygon class="g-petal ' + cls + '" data-d="' + (300 + i * 70) + '" points="' + [loc(a, r0, 0), loc(a, u1, w), loc(a, u2, w), loc(a, R, 0), loc(a, u2, -w), loc(a, u1, -w)].join(' ') + '"/>';
      if (big) { var t = loc(a, 61, 0).split(','); h += '<text class="g-num ' + cls + '" x="' + t[0] + '" y="' + f1(+t[1] + 4.5) + '">' + (i + 1) + '</text>'; }
    }
    h += '<polygon class="g-star" points="' + star.join(' ') + '"/><text class="g-big" data-count="' + n + '" x="0" y="' + (big ? 6 : 10) + '">' + n + '</text>' + (big ? '<text class="g-of" x="0" y="18">من ' + STEPS.length + '</text>' : '');
    return h + '</svg>';
  }

  /* Growth rings: 1 to 3 rings for a self-reported level, drawn off-centre like a cut trunk. */
  var LEVELS = { 'مبتدئ': 1, 'متوسط': 2, 'متقدم': 3 };
  function rings(level, cls) {
    var h = '<svg class="rings' + (cls ? ' ' + cls : '') + '" viewBox="0 0 120 120" aria-hidden="true" focusable="false">';
    for (var k = 3; k >= 1; k--) h += '<circle class="rg r' + k + (k <= level ? ' on' : '') + '" data-d="' + (700 + k * 160) + '" cx="' + (60 - (3 - k) * 3) + '" cy="' + (60 + (3 - k) * 4) + '" r="' + (k * 18 - 2) + '"/>';
    return h + '</svg>';
  }
  /* Girih geometry at scale k around 0,0: frame, ten petals, the gaps between them, the central star. */
  function girih(k) {
    var R = 100 * k, r1 = 44 * k, r0 = 25 * k, u2 = 73 * k, rad = Math.PI / 180, u1 = r1 * Math.cos(18 * rad), w = r1 * Math.sin(18 * rad), o = { frame: [], star: [], gaps: [], petals: [], tips: [] }, i, a, b;
    function loc(ang, u, v) { var c = Math.cos(ang * rad), s = Math.sin(ang * rad); return f1(u * c - v * s) + ',' + f1(u * s + v * c); }
    for (i = 0; i < 10; i++) {
      a = -90 - 36 * i; b = a - 36;
      o.frame.push(loc(a, R, 0)); o.star.push(loc(a, r0, 0)); o.star.push(loc(a - 18, r1, 0));
      o.gaps.push([loc(a - 18, r1, 0), loc(a, u2, -w), loc(a, R, 0), loc(b, R, 0), loc(b, u2, w)].join(' '));
      o.petals.push([loc(a, r0, 0), loc(a, u1, w), loc(a, u2, w), loc(a, R, 0), loc(a, u2, -w), loc(a, u1, -w)].join(' '));
      o.tips.push(loc(a, R, 0));
    }
    return o;
  }
  /* A quiet ground of interlocking rosettes, used as texture behind colour blocks. */
  function tessellation(cls) {
    var W = 640, H = 420, D = 200 * Math.cos(18 * Math.PI / 180), e2 = [D * Math.cos(72 * Math.PI / 180), -D * Math.sin(72 * Math.PI / 180)], g = girih(1), d = '', i, j;
    function add(pts, x, y) { d += 'M' + pts.map(function (p) { var q = p.split(','); return f1(+q[0] + x) + ' ' + f1(+q[1] + y); }).join('L') + 'Z'; }
    for (i = -3; i <= 5; i++) for (j = -3; j <= 5; j++) {
      var x = i * D + j * e2[0], y = 60 + j * e2[1];
      if (x < -110 || x > W + 110 || y < -110 || y > H + 110) continue;
      add(g.star, x, y); add(g.frame, x, y); g.petals.forEach(function (p) { add(p.split(' '), x, y); });
    }
    return '<svg class="tess' + (cls ? ' ' + cls : '') + '" viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false"><path d="' + d + '"/></svg>';
  }
  var TOYS = '<svg class="toys" viewBox="0 0 200 220" aria-hidden="true" focusable="false"><g class="toy t1"><rect class="toy-w" x="20" y="14" width="40" height="40" rx="10" transform="rotate(-14 40 34)"/></g><g class="toy t2"><path class="toy-b" d="M112 206a44 44 0 0 1 88 0z"/></g><g class="toy t3"><circle class="toy-d" cx="150" cy="118" r="30"/><circle class="toy-e" cx="150" cy="118" r="12"/></g><g class="toy t4"><rect class="toy-a" x="28" y="128" width="78" height="78" rx="14"/><g class="toy-eyes"><circle class="toy-w" cx="54" cy="158" r="5"/><circle class="toy-w" cx="82" cy="158" r="5"/></g><path class="toy-smile" d="M54 176c8 9 20 9 28 0"/></g><g class="toy t5"><path class="toy-c" d="M34 128 70 62l36 66z"/></g></svg>';
  /* The three motifs as large glyphs: stars (discover), rosette (connect), rings (grow). */
  function motif(name) {
    if (name === 'star') return '<svg class="motif" viewBox="-60 -60 120 120" aria-hidden="true" focusable="false"><path class="mo-line" d="M-38-20 2 6 34-30M2 6-14 40"/><use href="#star4" x="-52" y="-34" width="28" height="28"/><use href="#star4" x="-17" y="-13" width="38" height="38"/><use href="#star4" x="24" y="-40" width="20" height="20"/><use href="#star4" x="-23" y="31" width="18" height="18"/></svg>';
    if (name === 'rosette') { var g = girih(0.5); return '<svg class="motif" viewBox="-60 -60 120 120" aria-hidden="true" focusable="false"><polygon class="mo-frame" points="' + g.frame.join(' ') + '"/>' + g.petals.map(function (p, i) { return '<polygon class="mo-petal' + (i % 2 ? ' alt' : '') + '" points="' + p + '"/>'; }).join('') + '<polygon class="mo-core" points="' + g.star.join(' ') + '"/></svg>'; }
    if (name === 'rings') return '<svg class="motif" viewBox="0 0 120 120" aria-hidden="true" focusable="false"><circle class="mo-r r3" cx="60" cy="60" r="52"/><circle class="mo-r r2" cx="57" cy="64" r="35"/><circle class="mo-r r1" cx="54" cy="68" r="17"/></svg>';
    return TOYS;
  }

  /* ---------- views ---------- */
  var V = {};

  var ROLE_CARDS = [
    ['researcher', 'باحث', 'ماجستير أو دكتوراه أو باحث مستقل. عاوز تمشي بمشروعك من السؤال للتحليل.', 'night', 'star'],
    ['student', 'طالب', 'بتدرس علم نفس وعاوز تتعلم القياس والإحصاء وتجرّب مشروع صغير.', 'violet', 'rosette'],
    ['specialist', 'أخصائي', 'بتتابع حالات أو أطفال، وعاوز أنشطة وخطط متابعة مبنية على أساس علمي.', 'sun', 'rings'],
    ['parent', 'ولي أمر', 'عاوز أنشطة تنمّي قدرات ابنك أو بنتك (من أولى لسادسة ابتدائي) وتتابع تقدّمه.', 'mint', 'toys']
  ];
  function roleChoices() {
    return '<div class="choices">' + ROLE_CARDS.map(function (c, i) {
      var on = S.role === c[0];
      return '<button class="choice c-' + c[3] + (on ? ' on' : '') + '" type="button" data-role="' + c[0] + '" data-d="' + (i * 80) + '" aria-pressed="' + on + '"><span class="choice-art">' + motif(c[4]) + '</span><span class="choice-name">' + c[1] + '</span><span class="choice-say">' + c[2] + '</span>' + (on ? '<span class="choice-on">' + ic('check') + 'اختيارك الحالي</span>' : '') + '</button>';
    }).join('') + '</div>';
  }
  function bindRoles() {
    $$('[data-role]', main).forEach(function (b) {
      b.addEventListener('click', function (e) {
        S.role = b.getAttribute('data-role'); save();
        var at = location.hash;
        if (window.HubMotion && window.HubMotion.flood && !calm()) window.HubMotion.flood(b, e, function () { if (location.hash !== at) return; if ((at || '#home') === '#home') route(); else location.hash = '#home'; });
        else goHome();
      });
    });
  }
  function goHome() { if ((location.hash || '#home') === '#home') go(); else location.hash = '#home'; }

  V.role = function () {
    main.innerHTML = '<header class="head"><h1 class="mega" data-reveal="words">إنت مين؟</h1><p class="lead">اختيارك بيحدد الأقسام اللي تظهر لك. تقدر تغيّره في أي وقت.</p></header>' + roleChoices();
    bindRoles();
  };

  /* ---------- home ---------- */
  function latest() {
    if (!S.projects.length) return null;
    return S.projects.slice().sort(function (a, b) { var x = String(a.updated || ''), y = String(b.updated || ''); return x < y ? 1 : x > y ? -1 : 0; })[0];
  }
  function newProject() {
    var p = { id: uid(), title: '', design: '', paired: '', d: {}, vars: [], created: today(), updated: today() };
    S.projects.unshift(p); save(); location.hash = '#project/' + p.id;
  }
  function stepHint(k) {
    if (k === 'variables') return 'اكتب متغير مستقل ومتغير تابع على الأقل.';
    if (k === 'design') return 'حدد تصميم البحث، والمجموعات مستقلة ولا مرتبطة.';
    return TEXT[k][0][1] + ': ' + TEXT[k][0][2];
  }
  function skyTile(p) {
    var h = '<section class="tile sky" aria-labelledby="sky-t" data-d="0" data-glow><div class="sky-ring" aria-hidden="true"></div><div class="sky-ros">' + rosette(p, false) + '</div><div class="sky-in">';
    if (p) {
      var n = progress(p), nx = null;
      STEPS.some(function (s) { if (!stepDone(p, s[0])) { nx = s; return true; } return false; });
      h += '<div class="sky-head"><p class="sky-kicker">آخر مشروع اشتغلت عليه · ' + fmtDate(p.updated) + '</p><h2 id="sky-t">' + esc(p.title || 'مشروع من غير عنوان') + '</h2><p class="sky-count num"><span data-count="' + n + '">' + n + '</span> من ' + STEPS.length + ' أجزاء مكتملة</p></div>' +
        starChart(p, false) + starChart(p, true) +
        '<div class="sky-foot"><p class="sky-next">' + (nx ? '<span class="sky-label">الخطوة الجاية</span><strong>' + nx[1] + '</strong><span class="sky-hint">' + esc(stepHint(nx[0])) + '</span>' : '<span class="sky-label">اكتملت</span><span class="sky-hint">كل الأجزاء العشرة مكتوبة. راجعها مع مشرفك واطبع نسخة.</span>') + '</p>' +
        '<div class="row"><a class="btn onsky" href="#project/' + p.id + '">افتح المشروع</a>' + (nx ? '<a class="btn primary mag" href="#project/' + p.id + '/' + nx[0] + '">كمّل: ' + nx[1] + '</a>' : '') + '</div></div>';
    } else {
      h += '<div class="sky-head"><h2 id="sky-t">مشروعك البحثي بيبدأ من سؤال</h2><p class="sky-lead">عشر محطات من السؤال لحد ملاحظات المشرف. كل جزء تكمّله بينوّر نجمة، والمرشد بيقولك إيه الناقص.</p></div>' +
        starChart(null, false) + starChart(null, true) +
        '<div class="sky-foot"><p class="sky-next"><span class="sky-hint">لسه مفيش مشاريع على الجهاز ده.</span></p><div class="row"><button class="btn primary mag" type="button" id="homeNew">ابدأ أول مشروع</button></div></div>';
    }
    return h + '</div></section>';
  }
  /* A small schematic of the comparison the guide is recommending. Illustrative shape only, not data. */
  function schema(p) {
    var vs = (p.vars || []).filter(function (v) { return v.name; });
    var d = vs.filter(function (v) { return v.role === 'dv'; })[0], x = vs.filter(function (v) { return v.role === 'iv'; })[0];
    if (!d || !x) return '';
    var h = '<svg class="schema" viewBox="0 0 220 84" aria-hidden="true" focusable="false">', r = seeded(5), i, k, y;
    if (d.level === 'nominal') {
      for (i = 0; i < 2; i++) for (k = 0; k < 2; k++) h += '<rect class="sc-cell c' + ((i + k) % 2) + '" x="' + (68 + k * 44) + '" y="' + (6 + i * 37) + '" width="40" height="33" rx="6"/>';
    } else if (x.level === 'scale') {
      h += '<path class="sc-line" d="M24 70 196 14"/>';
      for (i = 0; i < 12; i++) { var cx = 30 + i * 14.5; h += '<circle class="sc-dot" cx="' + f1(cx) + '" cy="' + f1(68 - (cx - 24) * 0.325 + (r() - 0.5) * 22) + '" r="3.6"/>'; }
    } else {
      var g = Math.min(Math.max(parseInt(x.groups, 10) || 2, 2), 4), col = function (j) { return f1(220 - (j + 0.5) * 220 / g); };
      if (p.paired === 'rel') {
        for (i = 0; i < 4; i++) {
          var ysub = [], pth = '';
          for (k = 0; k < g; k++) { ysub.push(f1(16 + i * 17 - k * 5 + (r() - 0.5) * 8)); pth += (k ? 'L' : 'M') + col(k) + ' ' + ysub[k]; }
          h += '<path class="sc-line" d="' + pth + '"/>';
          for (k = 0; k < g; k++) h += '<circle class="sc-dot' + (k ? '' : ' open') + '" cx="' + col(k) + '" cy="' + ysub[k] + '" r="4.2"/>';
        }
      } else {
        for (k = 0; k < g; k++) {
          y = 54 - k * (28 / (g - 1));
          h += '<path class="sc-line" d="M' + f1(+col(k) - 22) + ' ' + f1(y) + 'h44"/>';
          for (i = 0; i < 6; i++) h += '<circle class="sc-dot" cx="' + f1(+col(k) - 17 + i * 6.8) + '" cy="' + f1(y + (r() - 0.5) * 30) + '" r="3.4"/>';
        }
      }
    }
    return h + '</svg>';
  }
  var READS = '<ul class="reads"><li><span class="num">01</span>دور كل متغير: مستقل ولا تابع</li><li><span class="num">02</span>مستوى القياس: اسمي، ترتيبي، كمّي</li><li><span class="num">03</span>عدد المجموعات، ومستقلة ولا مرتبطة</li></ul>';
  function guideTile(p) {
    var h = '<section class="tile block sun guide" data-d="90"><h2 class="block-label">مرشد الاختبار الإحصائي</h2>';
    if (!p) return h + '<p class="guide-ask">بيقرا متغيرات مشروعك ويقترح الاختبار المناسب ويقولك ليه.</p>' + READS + '</section>';
    var r = recommend(p);
    if (!r) h += '<p class="guide-ask">ناقص متغير مستقل ومتغير تابع</p><p>اكتبهم في جزء المتغيرات، وهنقترح الاختبار المناسب.</p>' + READS + '<p class="tile-end"><a class="btn inked" href="#project/' + p.id + '/variables">اكتب المتغيرات</a></p>';
    else if (r.need) h += '<p class="guide-ask">' + esc(r.need) + '</p>' + READS + '<p class="tile-end"><a class="btn inked" href="#project/' + p.id + '/' + (r.need.indexOf('التصميم') > -1 ? 'design' : 'variables') + '">كمّل الناقص</a></p>';
    else if (!r.recs.length) h += '<p class="guide-ask">مفيش اقتراح جاهز للتركيبة دي من المتغيرات.</p><p>راجع مستوى القياس في جزء المتغيرات.</p><p class="tile-end"><a class="btn inked" href="#project/' + p.id + '/variables">افتح المتغيرات</a></p>';
    else {
      var x = r.recs[0];
      h += '<p class="guide-test">' + esc(x.test) + '</p><p class="guide-why">' + esc(x.why) + '</p>' + schema(p) + '<p class="guide-sub">افحص قبل ما تحلل</p><ul class="checks">' + x.check.slice(0, 2).map(function (c) { return '<li>' + esc(c) + '</li>'; }).join('') + '</ul>' +
        '<p class="tile-end"><a class="btn inked" href="#project/' + p.id + '/analysis">افتح المرشد</a></p>';
    }
    return h + '</section>';
  }
  function skillsTile() {
    var sk = [['stats', 'الإحصاء'], ['psychometrics', 'القياس النفسي']], any = sk.some(function (k) { return LEVELS[S.profile[k[0]]]; }), d = profileDone();
    return '<section class="tile block violet skills" data-d="180">' + tessellation() + '<div class="skills-in"><h2 class="block-title">ملكاتك</h2><p class="skills-note">' + (any ? 'من كلامك إنت في ملفك. مفيش قياس من عندنا.' : 'حدد مستواك في ملفك، والحلقات تتملى على أساسه.') + '</p><div class="skill-row">' + sk.map(function (k) {
      var v = S.profile[k[0]], lv = LEVELS[v] || 0;
      return '<div class="skill">' + rings(lv) + '<p class="skill-name">' + k[1] + '</p><p class="skill-lv' + (lv ? '' : ' none') + '">' + (lv ? esc(v) : 'لسه ما حددتش') + '</p></div>';
    }).join('') + '</div><p class="tile-end"><a class="btn onblock" href="#profile">' + (d ? 'عدّل ملفك' : 'كمّل ملفك') + '</a><span class="num">' + d + ' من ' + PF.length + ' حقل مكتمل</span></p></div></section>';
  }
  function kidsTile(r) {
    var k = S.kids[0], more = S.kids.length - 1, title = r === 'specialist' ? 'الأطفال اللي بتابعهم' : 'أولادي';
    return '<section class="tile block mint kid' + (k ? '' : ' empty') + '" data-d="260"><div class="kid-txt"><h2 class="block-label">' + title + '</h2>' +
      (k ? '<p class="kid-name">' + esc(k.child) + '</p><p class="kid-grade">' + esc(k.grade) + (more > 0 ? ' · و' + plural(more, 'طفل كمان', 'طفلين كمان', 'أطفال كمان', 'طفل كمان') : '') + '</p><a class="btn inked" href="#kids">افتح الأنشطة</a>'
        : '<p class="kid-name small-name">سجّل طفلك</p><p class="kid-grade">من أولى لسادسة ابتدائي، بموافقة ولي الأمر.</p><a class="btn inked" href="#family">ابدأ التسجيل</a>') +
      '</div>' + TOYS + '</section>';
  }
  var LAB_ART = {
    measure: '<svg class="lab-art" viewBox="0 0 96 96" aria-hidden="true" focusable="false"><rect x="10" y="34" width="76" height="28" rx="5" transform="rotate(-24 48 48)"/><path d="M24.500 47.800l3.700 8.200M34.500 43.300l5.300 12M44.600 38.800l3.700 8.200M54.600 34.300l5.300 12M64.700 29.800l3.700 8.200"/></svg>',
    stats: '<svg class="lab-art" viewBox="0 0 96 96" aria-hidden="true" focusable="false"><path d="M6 76c18 0 22-56 42-56s24 56 42 56"/><path d="M48 20v56M6 76h84"/><circle cx="48" cy="20" r="4.500"/></svg>'
  };
  function labsTile() {
    return '<div class="labs" data-d="340"><a class="tile block coral lab" href="' + LABS.scales + '">' + LAB_ART.measure + '<span class="lab-name">معمل القياس النفسي</span><span class="lab-say">ثبات، صدق، وتحليل بنود</span></a>' +
      '<a class="tile block lilac lab" href="' + LABS.stats + '">' + LAB_ART.stats + '<span class="lab-name">معمل الإحصاء النفسي</span><span class="lab-say">اختبارات، حجم أثر، وقوة</span></a></div>';
  }
  function soonTile() {
    var later = Object.keys(MODS).filter(function (k) { return !MODS[k].ready; }).map(function (k) { return [MODS[k].title, MODS[k].say]; });
    later.push(['التوجيه المهني والبورتفوليو', 'ميولك، مساراتك، وملف إنجازاتك']);
    var open = Object.keys(MODS).filter(function (k) { var m = MODS[k]; return m.ready && (!m.roles || !S.role || m.roles.indexOf(S.role) > -1); });
    var look = { theories: ['violet', 'rosette'], kids: ['mint', 'toys'], decide: ['coral', 'rings'], explore: ['night', 'star'], assistant: ['sun', 'star'] };
    return (open.length ? '<section class="mods" data-d="380"><h2>أقسام المنصة</h2><ul>' + open.map(function (k, i) { var lk = look[k] || [['lilac', 'sun', 'coral', 'violet'][i % 4], ['star', 'rosette', 'rings'][i % 3]]; return '<li><a class="mod m-' + lk[0] + '" href="#' + k + '" data-glow><span class="mod-art">' + motif(lk[1]) + '</span><strong>' + MODS[k].title + '</strong><small>' + MODS[k].say + '</small></a></li>'; }).join('') + '</ul></section>' : '') +
      '<section class="soon" data-d="420"><h2>قريباً</h2><ul>' + later.map(function (c) { return '<li><strong>' + c[0] + '</strong><small>' + c[1] + '</small></li>'; }).join('') + '</ul></section>';
  }

  /* The welcome: five scroll scenes for a first visit. Static and complete as markup; motion.js brings it to life. */
  var QUESTIONS = ['أنا أقدر أبقى إيه؟', 'عندي إيه دلوقتي من قدرات ومهارات؟', 'أطوّر إيه بعد كده، وأثبت إزاي إني اتحسنت؟', 'أشتغل على أنهي بحث أو مشكلة حقيقية؟', 'إنجازاتي تفتح لي أنهي فرص؟'];
  function morphStage() {
    var g = girih(1.5), r = seeded(23), i, h = '<svg class="morph" id="morph" viewBox="-230 -230 460 460" aria-hidden="true" focusable="false">';
    h += '<g class="m-rings">' + [[206, 0, 0, 'a'], [158, -6, 8, 'b'], [112, -12, 16, 'c'], [70, -18, 24, 'd']].map(function (c) { return '<circle class="m-ring ' + c[3] + '" cx="' + c[1] + '" cy="' + c[2] + '" r="' + c[0] + '"/>'; }).join('') + '</g>';
    h += '<g class="m-ripples">' + [0, 1, 2].map(function (k) { return '<circle class="m-ripple" cx="0" cy="0" r="' + (150 + k * 30) + '"/>'; }).join('') + '</g>';
    h += '<g class="m-ros"><polygon class="m-frame" pathLength="1" points="' + g.frame.join(' ') + '"/>' + g.petals.map(function (p) { return '<polygon class="m-out" pathLength="1" points="' + p + '"/>'; }).join('') + g.gaps.map(function (p) { return '<polygon class="m-gap" points="' + p + '"/>'; }).join('') + g.petals.map(function (p, k) { return '<polygon class="m-petal c' + (k % 5) + '" points="' + p + '"/>'; }).join('') + '<polygon class="m-core" points="' + g.star.join(' ') + '"/></g>';
    var scatter = [], line = '';
    var sx = [176, 118, 150, 60, 22, -40, -96, -70, -150, -190], sy = [-150, -60, 70, -120, 30, 150, -20, -170, 110, -70];
    for (i = 0; i < 10; i++) scatter.push([f1(sx[i] + (r() - 0.5) * 24), f1(sy[i] + (r() - 0.5) * 24)]);
    scatter.forEach(function (q, n) { line += (n ? 'L' : 'M') + q[0] + ' ' + q[1]; });
    h += '<path class="m-line" pathLength="1" d="' + line + '"/><g class="m-stars">';
    for (i = 0; i < 10; i++) {
      var s = 16 + Math.round(r() * 18), ring = [206, 158, 112, 70][i % 4], oa = (i * 97 + 30) * Math.PI / 180, off = [0, 0, -6, 8, -12, 16, -18, 24];
      h += '<g class="m-star" data-p0="' + scatter[i].join(',') + '" data-p1="' + g.tips[i] + '" data-p2="' + f1(off[(i % 4) * 2] + Math.cos(oa) * ring) + ',' + f1(off[(i % 4) * 2 + 1] + Math.sin(oa) * ring) + '"><use href="#star4" x="' + (-s / 2) + '" y="' + (-s / 2) + '" width="' + s + '" height="' + s + '"/></g>';
    }
    return h + '</g></svg>';
  }
  function marquee(rev) {
    var one = QUESTIONS.map(function (t) { return '<span class="mq-i">' + t + '</span><svg class="mq-s" viewBox="-10 -10 20 20"><use href="#star4" x="-10" y="-10" width="20" height="20"/></svg>'; }).join('');
    return '<div class="marquee' + (rev ? ' rev' : '') + '" aria-hidden="true"><div class="marquee-in">' + one + one + '</div></div>';
  }
  function welcome() {
    var ch = [
      ['نجوم', 'بتكتشف اللي عندك', [0, 1], 'star'],
      ['زخرفة', 'بتربطه في بناء واحد', [2, 3], 'rosette'],
      ['حلقات', 'وبيكبر بالممارسة', [4], 'rings']
    ];
    return '<div class="intro" id="intro"><canvas class="aurora intro-aurora" data-aurora aria-hidden="true"></canvas><canvas class="intro-sky" id="introSky" aria-hidden="true"></canvas>' +
      '<section class="scene s1"><h1 class="s1-title"><span class="s1-brand">' + esc(BRAND) + '</span><span class="s1-line">من القدرة</span> <span class="s1-line">للإنجاز</span></h1>' +
      '<p class="s1-lead">منصة واحدة للباحث والأخصائي وولي الأمر. بتمشي معاك من أول سؤال لحد نتيجة تقدر تثبتها.</p><p class="s1-cue" aria-hidden="true"><span>انزل</span><i></i></p></section>' +
      marquee(false) + '<div class="story"><div class="stage">' + morphStage() + '</div>' + ch.map(function (c, i) {
        return '<section class="scene ch ch' + (i + 1) + '"><div class="ch-in"><div class="ch-glyph rv">' + motif(c[3]) + '</div><p class="ch-no num rv">' + pad2(i + 1) + '</p><h2 class="ch-word rv"><span class="wm"><span>' + c[0] + '</span></span></h2><p class="ch-say rv">' + c[1] + '</p><ol class="ch-q">' + c[2].map(function (q) { return '<li class="rv"><span class="num">' + pad2(q + 1) + '</span>' + QUESTIONS[q] + '</li>'; }).join('') + '</ol></div></section>';
      }).join('') + '</div>' + marquee(true) +
      '<section class="scene s5" id="choose"><h2 class="s5-title">إنت مين؟</h2><p class="s5-lead">اختيارك بيحدد الأقسام اللي تظهر لك. تقدر تغيّره في أي وقت.</p>' + roleChoices() + '</section></div>';
  }
  function introSeen() { try { return localStorage.getItem(INTRO_KEY) === '1'; } catch (e) { return introSeen.mem; } }
  function setIntro(v) { introSeen.mem = v; try { if (v) localStorage.setItem(INTRO_KEY, '1'); else localStorage.removeItem(INTRO_KEY); } catch (e) {} }

  V.home = function () {
    var r = S.role, h = '', works = !r || r === 'researcher' || r === 'student' || r === 'specialist', kids = !r || r === 'parent' || r === 'specialist';
    var p = works ? latest() : null;
    if (!r && !introSeen()) {
      main.innerHTML = welcome();
      document.body.classList.add('is-intro');
      bindRoles();
      if (window.HubMotion) window.HubMotion.intro($('#intro'));
      return;
    }
    var t, lead = '';
    if (!r) {
      t = 'من القدرة <em>للإنجاز</em>'; lead = 'لسه ما اخترتش دورك. اختاره علشان نرتّب لك الأقسام اللي تهمك.';
    } else if (r === 'parent') {
      t = S.kids.length ? 'متابعة <em>' + (S.kids.length === 1 ? esc(S.kids[0].child) : 'أولادك') + '</em>' : 'سجّل طفلك <em>علشان تبدأ</em>';
      lead = S.kids.length ? 'مسجّل عندك ' + plural(S.kids.length, 'طفل واحد', 'طفلين', 'أطفال', 'طفل') + '. افتح الأنشطة وابدأ جلسة قصيرة.' : 'التسجيل بياخد دقيقة، وبموافقة ولي الأمر.';
    } else if (p) {
      var left = STEPS.length - progress(p);
      t = left ? 'فاضل لك <em class="num">' + plural(left, 'جزء واحد', 'جزئين', 'أجزاء', 'جزء') + '</em> وتكمّل خطة بحثك' : 'خطة بحثك <em>اكتملت</em>';
      lead = 'عندك ' + plural(S.projects.length, 'مشروع واحد', 'مشروعين', 'مشاريع', 'مشروع') + ' على الجهاز ده.';
    } else { t = 'ابدأ مشروعك <em>البحثي الأول</em>'; lead = 'هنمشي معاك خطوة خطوة، من السؤال لخطة التحليل.'; }
    h += '<header class="head dash-head"><canvas class="aurora" data-aurora aria-hidden="true"></canvas><h1 class="mega" data-reveal="words">' + t + '</h1><p class="lead">' + lead + '</p>' + (r ? '' : '<p class="row dash-cta"><a class="btn primary big mag" href="#role">ابدأ: اختار دورك</a><button class="btn" type="button" id="replayIntro">شوف المقدمة</button></p>') + '</header>';
    h += '<div class="bento b-' + (r || 'guest') + '">' + (works ? skyTile(p) + guideTile(p) + skillsTile() : '') + (kids ? kidsTile(r) : '') + labsTile() + soonTile() + '</div>';
    main.innerHTML = h;
    var nb = $('#homeNew'); if (nb) nb.addEventListener('click', newProject);
    var rp = $('#replayIntro'); if (rp) rp.addEventListener('click', function () { setIntro(false); go(); });
  };

  V.labs = function () {
    main.innerHTML = '<header class="head"><h1 class="mega" data-reveal="words">المعامل</h1><p class="lead">الموقعين الأصليين شغالين زي ما هم. افتح المعمل اللي محتاجه.</p></header><div class="lab-grid">' +
      '<a class="tile block coral lab big" data-d="0" href="' + LABS.scales + '">' + LAB_ART.measure + '<span class="lab-name">معمل القياس النفسي</span><span class="lab-say">بناء المقاييس، الثبات والصدق، تحليل البنود، بنك المقاييس، ووضع الامتحان.</span><span class="go">افتح المعمل</span></a>' +
      '<a class="tile block lilac lab big" data-d="90" href="' + LABS.stats + '">' + LAB_ART.stats + '<span class="lab-name">معمل الإحصاء النفسي</span><span class="lab-say">الاختبارات الإحصائية، حجم العينة والقوة، قراءة مخرجات SPSS، وكتابة النتايج.</span><span class="go">افتح المعمل</span></a></div>';
  };

  /* ---------- researcher profile ---------- */
  var PF = [
    ['level', 'المرحلة الدراسية', ['ليسانس/بكالوريوس', 'دبلوم', 'ماجستير', 'دكتوراه', 'بعد الدكتوراه', 'ممارس من غير دراسة حالية']],
    ['field', 'التخصص', null, 'مثال: علم نفس تربوي، إكلينيكي، قياس وتقويم'],
    ['stage', 'إنت فين في بحثك؟', ['لسه بدوّر على موضوع', 'عندي موضوع وبكتب الخطة', 'بجمع بيانات', 'بحلّل', 'بكتب', 'خلّصت وبنشر']],
    ['interests', 'اهتماماتك البحثية', null, 'افصل بينهم بفاصلة'],
    ['stats', 'مستواك في الإحصاء', ['مبتدئ', 'متوسط', 'متقدم']],
    ['psychometrics', 'مستواك في القياس النفسي', ['مبتدئ', 'متوسط', 'متقدم']],
    ['software', 'برامج بتستخدمها', null, 'SPSS، R، JASP، Excel…'],
    ['hours', 'ساعات متاحة في الأسبوع', null, null, 'number'],
    ['months', 'المدة المتاحة للبحث (بالشهور)', null, null, 'number'],
    ['sample', 'تقدر توصل لأنهي عينة؟', null, 'مثال: طلبة جامعة، تلاميذ ابتدائي، مرضى عيادة'],
    ['supervisor', 'عندك مشرف؟', ['آه', 'لأ', 'لسه']],
    ['goal', 'هدفك الجاي', null, 'مثال: أخلّص الخطة قبل شهر 3']
  ];
  function profileDone() { return PF.filter(function (f) { return String(S.profile[f[0]] || '').trim(); }).length; }
  V.profile = function () {
    var p = S.profile;
    main.innerHTML = '<header class="head"><h1>ملفي كباحث</h1><p class="lead">كل اللي هنا من كلامك إنت، وتقدر تعدّله أو تمسحه في أي وقت. إحنا مش بنستنتج عنك حاجة من نفسنا.</p></header>' +
      '<form class="card form" id="pf"><div class="two">' + PF.map(function (f) {
        return '<div class="fld">' + (f[2] ? sel('pf-' + f[0], f[1], f[2], p[f[0]] || '', f[3]) : field('pf-' + f[0], f[1], p[f[0]] || '', f[3], f[4])) + '</div>';
      }).join('') + '</div><div class="row form-end"><button class="btn primary" type="submit">احفظ</button><button class="btn danger" type="button" id="pfClear">امسح الملف</button></div></form>';
    $('#pf').addEventListener('submit', function (e) {
      e.preventDefault();
      PF.forEach(function (f) { S.profile[f[0]] = $('#pf-' + f[0]).value.trim(); });
      if (save()) toast('اتحفظ');
    });
    $('#pfClear').addEventListener('click', function () { if (confirm('تمسح ملفك كله؟')) { S.profile = {}; save(); V.profile(); toast('اتمسح'); } });
  };

  /* ---------- projects ---------- */
  var STEPS = [
    ['question', 'السؤال'], ['background', 'الخلفية'], ['variables', 'المتغيرات'], ['hypotheses', 'الفروض'], ['design', 'التصميم'],
    ['instruments', 'الأدوات'], ['sample', 'العينة'], ['analysis', 'التحليل'], ['ethics', 'الأخلاقيات'], ['notes', 'ملاحظات المشرف']
  ];
  var TEXT = {
    question: [['problem', 'مشكلة البحث', 'إيه المشكلة اللي شايفها، وليه مهمة؟', 'area'], ['q', 'أسئلة البحث', 'سؤال في كل سطر', 'area']],
    background: [['theory', 'الإطار النظري', 'النظرية أو النموذج اللي بتبني عليه', 'area'], ['lit', 'أهم الدراسات السابقة', 'اكتب المرجع والرابط أو DOI لكل دراسة. متكتبش مرجع مش قريته.', 'area'], ['gap', 'الفجوة اللي بتسدّها', 'دي «فجوة محتملة» لحد ما تراجع الأدبيات مراجعة منظمة.', 'area']],
    hypotheses: [['h', 'الفروض', 'فرض في كل سطر، واكتب اتجاهه لو له اتجاه', 'area']],
    instruments: [['tools', 'المقاييس والأدوات', 'لكل أداة: اسمها، صاحبها، نسختها العربية، وثباتها في دراسات سابقة', 'area'], ['perm', 'إذن الاستخدام', 'خدت إذن من صاحب المقياس؟ ولا المقياس متاح للاستخدام؟', 'area']],
    sample: [['pop', 'المجتمع والعينة', 'مين، ومنين، وبأنهي طريقة اختيار', 'area'], ['n', 'الحجم المستهدف', 'احسبه من معمل الإحصاء (حجم العينة والقوة) واكتب الأساس', 'text']],
    analysis: [['plan', 'خطة التحليل', 'لكل فرض: الاختبار، وإيه الافتراضات اللي هتفحصها', 'area']],
    ethics: [['irb', 'موافقة لجنة الأخلاقيات', 'اسم اللجنة، وحالة الطلب', 'text'], ['consent', 'الموافقة المستنيرة وسرية البيانات', 'هتاخد الموافقة إزاي، وهتحفظ البيانات فين', 'area']],
    notes: [['sup', 'ملاحظات المشرف', 'اكتب الملاحظة وتاريخها', 'area'], ['next', 'الخطوة الجاية', 'حاجة واحدة محددة وموعدها', 'text']]
  };
  var DESIGNS = ['وصفي ارتباطي', 'وصفي مقارن', 'تجريبي (مجموعتين مستقلتين)', 'تجريبي (قياس قبلي وبعدي لنفس المجموعة)', 'شبه تجريبي', 'تصميم الحالة الواحدة (AB / ABAB / خطوط قاعدية متعددة)', 'طولي', 'بناء وتقنين مقياس', 'نوعي', 'مختلط'];
  var ROLE_V = [['iv', 'مستقل'], ['dv', 'تابع'], ['med', 'وسيط'], ['mod', 'معدِّل'], ['cov', 'ضابط']];
  var LEVEL_V = [['nominal', 'اسمي (فئات)'], ['ordinal', 'ترتيبي'], ['scale', 'كمّي (فتري/نسبي)']];

  function proj(id) { for (var i = 0; i < S.projects.length; i++) if (S.projects[i].id === id) return S.projects[i]; return null; }
  function stepDone(p, k) {
    if (k === 'variables') return (p.vars || []).some(function (v) { return v.role === 'dv' && v.name; }) && (p.vars || []).some(function (v) { return v.role === 'iv' && v.name; });
    if (k === 'design') return !!p.design;
    return TEXT[k].every(function (f) { return String((p.d || {})[f[0]] || '').trim(); });
  }
  function progress(p) { return STEPS.filter(function (s) { return stepDone(p, s[0]); }).length; }

  V.projects = function () {
    var h = '<div class="sec"><h1>مشاريعي البحثية</h1><button class="btn primary" id="newP" type="button">' + ic('plus') + 'مشروع جديد</button></div>';
    if (!S.projects.length) h += '<div class="card empty"><div class="empty-art">' + rosette(null, false) + '</div><p class="empty-t">لسه مفيش مشاريع.</p><p>المشروع بيجمع سؤالك ومتغيراتك وتصميمك وخطة تحليلك، وبيقولك إيه الناقص.</p></div>';
    else h += '<div class="plist">' + S.projects.map(function (p) {
      var n = progress(p), nx = null;
      STEPS.some(function (s) { if (!stepDone(p, s[0])) { nx = s; return true; } return false; });
      return '<a class="pcard" data-d="' + (S.projects.indexOf(p) * 70) + '" href="#project/' + p.id + '"><span class="pcard-ros">' + rosette(p, false) + '</span><span class="pcard-body"><h2>' + esc(p.title || 'مشروع من غير عنوان') + '</h2><span class="pcard-meta num">' + n + ' من ' + STEPS.length + ' أجزاء مكتملة</span>' +
        '<span class="pcard-sub">' + (nx ? 'الجاي: ' + nx[1] : 'كل الأجزاء مكتملة') + ' · آخر تعديل ' + fmtDate(p.updated) + '</span></span></a>';
    }).join('') + '</div>';
    main.innerHTML = h;
    $('#newP').addEventListener('click', newProject);
    $$('.pcard', main).forEach(function (c) { c.addEventListener('click', function () { var r1 = $('.pcard-ros', c), t1 = $('h2', c); if (r1) r1.style.viewTransitionName = 'pros'; if (t1) t1.style.viewTransitionName = 'ptitle'; }); });
  };

  V.project = function (id, step) {
    var p = proj(id);
    if (!p) { main.innerHTML = '<div class="card empty"><p class="empty-t">المشروع ده مش موجود على الجهاز ده.</p><p><a class="btn" href="#projects">رجوع للمشاريع</a></p></div>'; return; }
    step = step || 'overview';
    var h = '<p class="crumb"><a href="#projects">' + ic('back') + 'كل المشاريع</a></p>' +
      '<div class="ptitle"><span class="pros" id="pros">' + rosette(p, false) + '</span><div class="ptitle-f"><label for="ptitle">عنوان المشروع</label><textarea id="ptitle" rows="1" placeholder="اكتب عنوان مبدئي">' + esc(p.title) + '</textarea></div></div>' +
      '<div class="steps" role="tablist" aria-label="أجزاء المشروع"><button type="button" role="tab" data-step="overview" class="ov" aria-selected="' + (step === 'overview') + '"><span class="dot">' + ic('steps') + '</span><span class="lbl">نظرة عامة</span></button>' +
      STEPS.map(function (s, i) { var ok = stepDone(p, s[0]); return '<button type="button" role="tab" data-step="' + s[0] + '" class="' + (ok ? 'done' : '') + '" aria-selected="' + (step === s[0]) + '"><span class="dot num">' + (ok ? ic('check') : i + 1) + '</span><span class="lbl">' + s[1] + '</span>' + (ok ? sr('مكتمل') : '') + '</button>'; }).join('') + '</div><div id="pane"></div>';
    main.innerHTML = h;
    var strip = $('.steps', main), cur = $('[aria-selected="true"]', strip);
    if (cur) strip.scrollLeft = cur.offsetLeft - (strip.clientWidth - cur.offsetWidth) / 2;
    $$('button', strip).forEach(function (b, i) { b.style.setProperty('--i', i); });
    var ti = $('#ptitle');
    function fit() { ti.style.height = 'auto'; ti.style.height = ti.scrollHeight + 'px'; }
    fit();
    ti.addEventListener('input', fit);
    ti.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); ti.blur(); } });
    ti.addEventListener('change', function () { p.title = this.value.replace(/\s+/g, ' ').trim(); this.value = p.title; fit(); touch(p); });
    $$('[data-step]', main).forEach(function (b) { b.addEventListener('click', function () { location.hash = '#project/' + p.id + '/' + b.getAttribute('data-step'); }); });
    var pane = $('#pane');
    if (step === 'overview') overview(p, pane);
    else if (step === 'variables') varsPane(p, pane);
    else if (step === 'design') designPane(p, pane);
    else if (TEXT[step]) textPane(p, step, pane);
    else overview(p, pane);
    if (step === 'analysis') pane.insertAdjacentHTML('afterbegin', advise(p));
    var was = STEPS.map(function (s) { return stepDone(p, s[0]); });
    touch.after = function (q) {
      if (q !== p || !$('#pros')) return;
      var now = STEPS.map(function (s) { return stepDone(p, s[0]); }), gained = [], changed = false;
      var names = [];
      now.forEach(function (ok, i) {
        if (ok === was[i]) return;
        changed = true;
        var b = $('.steps [data-step="' + STEPS[i][0] + '"]');
        if (b) { b.classList.toggle('done', ok); $('.dot', b).innerHTML = ok ? ic('check') : String(i + 1); }
        if (ok) { gained.push(b); names.push(STEPS[i][1]); }
      });
      was = now;
      if (!changed) return;
      var em = $('#pros'); em.innerHTML = rosette(p, false);
      $$('[data-d]', em).forEach(function (el) { el.style.animationDelay = '0ms'; });
      if (!gained.length) return;
      var all = now.every(Boolean), M = window.HubMotion;
      if (M && !calm()) { M.turn(em); gained.forEach(function (b) { if (b) M.burst($('.dot', b), 12); }); if (all) M.celebrate(); }
      toast(all ? 'كمّلت الأجزاء العشرة' : 'جزء «' + names[0] + '» اكتمل');
    };
  };
  function touch(p) { p.updated = today(); save(); if (touch.after) touch.after(p); }
  function tick() { var s = $('#saved'); if (!s) return; s.classList.remove('tick'); void s.offsetWidth; s.classList.add('tick'); }

  function overview(p, pane) {
    var n = progress(p);
    pane.innerHTML = '<div class="card over"><div class="over-ros">' + rosette(p, true) + '</div><div class="over-body"><h2>إيه الناقص في مشروعك؟</h2><p class="muted small num">' + n + ' من ' + STEPS.length + ' أجزاء مكتملة</p><ul class="todo">' +
      STEPS.map(function (s, i) { var ok = stepDone(p, s[0]); return '<li><a href="#project/' + p.id + '/' + s[0] + '"><span class="mk ' + (ok ? 'ok' : 'no') + ' num" aria-hidden="true">' + (ok ? ic('check') : i + 1) + '</span><span>' + s[1] + '</span>' + (ok ? '' : '<span class="muted small miss">(ناقص)</span>') + '</a></li>'; }).join('') + '</ul></div></div>' +
      advise(p) +
      '<div class="card tools" id="ptools"><h2>أدوات</h2><div class="row"><a class="btn" href="' + LABS.stats + '">' + ic('stats') + 'افتح معمل الإحصاء</a><a class="btn" href="' + LABS.scales + '">' + ic('measure') + 'افتح معمل القياس</a><button class="btn" type="button" id="pPrint">' + ic('print') + 'اطبع / PDF</button><button class="btn" type="button" id="pExport">' + ic('download') + 'نزّل نسخة (JSON)</button><button class="btn danger" type="button" id="pDel">' + ic('trash') + 'امسح المشروع</button></div></div>';
    $('#pPrint').addEventListener('click', function () { printable(p); });
    $('#pExport').addEventListener('click', function () {
      var a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([JSON.stringify(p, null, 2)], { type: 'application/json' }));
      a.download = 'project-' + p.id + '.json'; document.body.appendChild(a); a.click(); a.remove();
    });
    $('#pDel').addEventListener('click', function () { if (confirm('تمسح المشروع ده نهائي؟')) { S.projects = S.projects.filter(function (x) { return x.id !== p.id; }); save(); location.hash = '#projects'; } });
  }

  /* ---------- «اشرح لي» and «اقترح لي»: rule-based help inside the project workspace ---------- */
  /* Each entry: what it means, why it matters, a short example, a common mistake. Plain text, no citations. */
  var EXPLAIN = {
    problem: ['مشكلة البحث هي الحاجة اللي مش معروفة أو مش مفهومة كفاية وإنت عاوز دراستك توضّحها. بتتكتب كفقرة قصيرة: إيه اللي بنلاحظه، وإيه اللي لسه مش عارفينه.',
      'هي اللي بتحدد كل اللي بعدها: الأسئلة والمتغيرات والتصميم. لو المشكلة مش واضحة، باقي الخطة هيبقى مش مترابط.',
      'طلبة الفرقة الأولى بيشتكوا من قلق الامتحانات، ومش معروف هل التدريب على تنظيم الوقت بيقلل القلق ده ولا لأ.',
      'إنك تكتب موضوع عام (زي «القلق عند الطلبة») بدل مشكلة محددة فيها حاجة ناقصة محتاجة إجابة.'],
    q: ['أسئلة البحث هي الصيغة المحددة للي إنت عاوز تعرفه، وكل سؤال لازم يتجاوب من البيانات اللي هتجمعها.',
      'كل سؤال بيقابله فرض وتحليل إحصائي. عدد الأسئلة ونوعها هو اللي بيحدد حجم الشغل كله.',
      'هل توجد فروق في قلق الامتحان بين الطلبة اللي اتدربوا على تنظيم الوقت واللي ما اتدربوش؟',
      'سؤال إجابته «آه أو لأ» من غير متغيرات قابلة للقياس، أو سؤال واسع ميتجاوبش بدراسة واحدة.'],
    theory: ['الإطار النظري هو النظرية أو النموذج اللي بيفسر ليه المتغيرات بتاعتك المفروض تبقى مرتبطة ببعض.',
      'من غيره النتايج بتبقى أرقام من غير تفسير. وهو اللي بيخليك تتوقع اتجاه العلاقة وتكتب فروض موجّهة.',
      'دراسة عن أثر التدريب على الكفاءة الذاتية ممكن تبني على نظرية الكفاءة الذاتية: الخبرات الناجحة بترفع ثقة الفرد في قدرته.',
      'إنك تسرد نظريات كتير من غير ما توضّح أنهي واحدة بتبني عليها فروضك وإزاي.'],
    lit: ['الدراسات السابقة هي الأبحاث المنشورة القريبة من موضوعك: عملوا إيه، على مين، ولقوا إيه.',
      'بتعرّفك اللي اتعمل قبل كده، والمقاييس المستخدمة، وحجم الأثر المتوقع اللي هتحتاجه في حساب حجم العينة.',
      'لكل دراسة اكتب: المؤلف والسنة، العينة، الأدوات، وأهم نتيجة، ومعاها الرابط أو DOI.',
      'إنك تكتب مرجع ما قريتوش بنفسك، أو تنقل نتيجة من ملخص دراسة تانية من غير ما ترجع للأصل.'],
    gap: ['الفجوة هي الحاجة اللي الدراسات السابقة ما غطّتهاش: عينة مختلفة، متغير ما اتدرسش، أو نتايج متعارضة.',
      'هي مبرر وجود دراستك. من غير فجوة واضحة، البحث بيبقى تكرار من غير إضافة.',
      'أغلب دراسات برامج تنظيم الوقت اتعملت على طلبة ثانوي، ومفيش دراسات كفاية على طلبة الجامعة في مصر.',
      'إنك تقول «مفيش دراسات» من غير مراجعة منظمة. الأدق تقول «في حدود اطلاع الباحث».'],
    h: ['الفرض هو إجابة متوقعة لسؤال البحث، مكتوبة بشكل يتقبل الاختبار الإحصائي. ممكن يكون موجّه (بيحدد الاتجاه) أو غير موجّه.',
      'الفرض هو اللي بيتحول لاختبار إحصائي. نوعه (موجّه ولا لأ) بيأثر على طريقة قراءة الدلالة.',
      'توجد فروق ذات دلالة إحصائية في قلق الامتحان بين المجموعة التجريبية والضابطة لصالح التجريبية (القلق أقل).',
      'إنك تكتب فرض موجّه من غير سند نظري أو دراسات سابقة تدعم الاتجاه، أو تغيّر الفرض بعد ما تشوف النتايج.'],
    design: ['تصميم البحث هو خطة الدراسة: هتقارن مجموعات، ولا هتقيس علاقات، ولا هتتابع نفس الأفراد على فترات.',
      'التصميم هو اللي بيحدد إنت تقدر تقول «سبب» ولا «علاقة» بس، وبيحدد الاختبار الإحصائي المناسب.',
      'تجريبي بمجموعتين: مجموعة بتاخد البرنامج ومجموعة لأ، والتوزيع عشوائي، والقياس بعد البرنامج.',
      'إنك تستنتج سببية من تصميم ارتباطي، أو تسمّي التصميم «تجريبي» من غير توزيع عشوائي ومجموعة ضابطة.'],
    paired: ['السؤال هنا: الدرجات اللي هتقارنها جاية من نفس الأفراد (قبلي وبعدي مثلاً) ولا من أفراد مختلفين؟',
      'القياسات المرتبطة ليها اختبارات مختلفة عن المجموعات المستقلة. اختيار غلط هنا بيدّي نتيجة غلط.',
      'قياس القلق لنفس الطلبة قبل البرنامج وبعده = قياسات مرتبطة. مقارنة طلبة علمي بطلبة أدبي = مجموعات مستقلة.',
      'إنك تعامل القياس القبلي والبعدي لنفس الأفراد كأنهم مجموعتين مستقلتين.'],
    dnote: ['هنا بتكتب إزاي هتضبط الدراسة: التوزيع العشوائي، تثبيت الظروف، والحاجات اللي ممكن تأثر على النتيجة غير المتغير المستقل.',
      'الضبط هو اللي بيخلي النتيجة ترجع للمتغير المستقل مش لحاجة تانية. ده اسمه الصدق الداخلي.',
      'المجموعتين اتطبق عليهم المقياس في نفس الأسبوع ونفس القاعة، والتوزيع اتعمل بالقرعة.',
      'إنك تتجاهل تهديدات معروفة زي تسرّب المشاركين، أو أثر القياس القبلي، أو أحداث حصلت أثناء التجربة.'],
    tools: ['الأدوات هي المقاييس أو الاختبارات اللي هتقيس بيها كل متغير. لكل أداة: اسمها، صاحبها، عدد بنودها، ونسختها العربية.',
      'لو الأداة مش ثابتة وصادقة على عينة شبه عينتك، النتايج كلها هتبقى محل شك.',
      'مقياس قلق الامتحان (اكتب صاحبه وسنة النسخة العربية)، 20 بند، ومعامل ألفا في دراسات سابقة على طلبة جامعة.',
      'إنك تستخدم مقياس مترجم من غير ما تتحقق من ثباته وصدقه على عينتك، أو تعدّل البنود من غير ما تعيد التقنين.'],
    perm: ['إذن الاستخدام هو موافقة صاحب المقياس أو الناشر إنك تستخدمه، أو التأكد إنه متاح للاستخدام البحثي.',
      'في مقاييس ليها حقوق نشر، واستخدامها من غير إذن ممكن يمنع نشر بحثك.',
      'راسلت مُعِدّ النسخة العربية بالإيميل وخدت موافقة مكتوبة، واحتفظت بنسخة منها في ملاحق الرسالة.',
      'إنك تفترض إن أي مقياس منشور في بحث يبقى متاح للاستخدام من غير إذن.'],
    pop: ['المجتمع هو كل الناس اللي عاوز تعمّم عليهم النتيجة، والعينة هي الجزء اللي هتطبّق عليه فعلاً. اكتب مين، ومنين، واتاختاروا إزاي.',
      'طريقة اختيار العينة هي اللي بتحدد إنت تقدر تعمّم على مين. العينة المتاحة تعميمها أضيق من العشوائية.',
      'المجتمع: طلبة الفرقة الأولى بكلية الآداب. العينة: 120 طالب وطالبة اتاختاروا عشوائياً من كشوف الفرقة.',
      'إنك تعمّم على مجتمع أوسع من اللي عينتك اتسحبت منه، أو متكتبش معايير الاشتمال والاستبعاد.'],
    n: ['الحجم المستهدف هو عدد المشاركين اللي محتاجه علشان الاختبار الإحصائي يقدر يكشف الأثر لو موجود.',
      'عينة صغيرة ممكن تطلّع «مفيش فرق» والفرق موجود فعلاً. ده اسمه ضعف القوة الإحصائية.',
      'لاختبار t لمجموعتين مستقلتين، بحجم أثر متوسط (d = 0.5) وقوة 0.80 وألفا 0.05، محتاج حوالي 64 في كل مجموعة.',
      'إنك تختار العدد «على حسب المتاح» من غير حساب قوة، أو تنسى تزوّد نسبة للتسرّب المتوقع.'],
    plan: ['خطة التحليل بتقول، لكل فرض: أنهي اختبار هتستخدمه، وأنهي افتراضات هتفحصها قبله، وهتعمل إيه لو الافتراضات مش متحققة.',
      'كتابة الخطة قبل جمع البيانات بتحميك من إنك تجرّب اختبارات كتير وتختار اللي طلّع دلالة.',
      'الفرض الأول: اختبار t للعينات المستقلة بعد فحص الاعتدالية وتجانس التباين، ولو مش متحققين: Mann-Whitney. وهكتب Cohen\'s d وفترة الثقة.',
      'إنك تكتفي بقيمة p من غير حجم الأثر وفترة الثقة، أو تعمل مقارنات كتير من غير تصحيح.'],
    irb: ['موافقة لجنة الأخلاقيات هي تصريح رسمي من لجنة في جامعتك أو مؤسستك إن الدراسة مش هتضر المشاركين.',
      'أغلب المجلات مش بتنشر بحث على بشر من غير رقم موافقة، ولازم تاخدها قبل ما تبدأ جمع البيانات.',
      'لجنة أخلاقيات البحث العلمي بالكلية، الطلب اتقدّم ومستني الرد. (اكتب رقم الموافقة وتاريخها لما تطلع.)',
      'إنك تبدأ التطبيق قبل ما الموافقة تطلع، أو تغيّر في الإجراءات بعد الموافقة من غير ما تبلّغ اللجنة.'],
    consent: ['الموافقة المستنيرة معناها إن المشارك عارف هدف الدراسة، والمطلوب منه، وحقه ينسحب، قبل ما يوافق. والسرية معناها إن بياناته محدش يعرف إنها بتاعته.',
      'دي حقوق المشارك الأساسية. ومع الأطفال لازم موافقة ولي الأمر وكمان قبول الطفل نفسه.',
      'هوزّع ورقة موافقة مكتوبة قبل التطبيق، والاستبيانات من غير أسماء، والبيانات على جهاز بكلمة سر ومحدش يطّلع عليها غير الباحث والمشرف.',
      'إنك تجمع أسماء أو أرقام تليفونات مش محتاجها، أو تدّي إحساس إن المشاركة إجبارية (زي ربطها بدرجات).'],
    sup: ['هنا بتسجّل ملاحظات مشرفك بعد كل مقابلة: طلب إيه، واتفقتوا على إيه، وبتاريخ إمتى.',
      'التسجيل بيمنع إنك تنسى تعديل مطلوب، وبيبقى مرجع لو حصل اختلاف بعدين على اللي اتفقتوا عليه.',
      '2026/03/10: المشرف طلب تقليل عدد الفروض لتلاتة، وإضافة دراستين عربيتين حديثتين للخلفية.',
      'إنك تكتب الملاحظة من الذاكرة بعد أسابيع، أو متسجّلش إنت نفّذتها ولا لأ.'],
    next: ['الخطوة الجاية هي حاجة واحدة محددة هتعملها بعد كده، ومعاها ميعاد.',
      'خطوة واحدة واضحة بميعاد أسهل تتنفذ من قايمة طويلة. وهي أول حاجة هتشوفها لما تفتح المشروع تاني.',
      'أراسل مُعِدّ المقياس لطلب الإذن قبل يوم الخميس.',
      'إنك تكتب هدف كبير (زي «أخلّص الرسالة») بدل خطوة تقدر تبدأها النهارده.'],
    'v-name': ['اسم المتغير هو الخاصية اللي بتقيسها أو بتتحكم فيها، مكتوبة بشكل محدد يتقاس.',
      'الاسم الواضح بيخلي الفروض والتحليل مفهومين، والمرشد الإحصائي بيستخدمه في اقتراحاته.',
      '«قلق الامتحان» أوضح من «الحالة النفسية». و«نوع التدريب (برنامج / بدون)» أوضح من «التدريب».',
      'إنك تكتب مفهوم واسع ملوش مقياس محدد، أو تجمع متغيرين في اسم واحد.'],
    'v-role': ['دور المتغير: المستقل هو اللي بتغيّره أو بتقارن على أساسه، والتابع هو اللي بتقيس أثره. الوسيط بيفسّر العلاقة، والمعدِّل بيغيّر قوتها، والضابط بتثبّت أثره.',
      'الدور هو اللي بيحدد شكل الفرض ونوع التحليل. نفس المتغير ممكن يبقى مستقل في دراسة وتابع في دراسة تانية.',
      'البرنامج التدريبي (مستقل) ← قلق الامتحان (تابع). الكفاءة الذاتية ممكن تكون وسيط، والنوع ممكن يكون معدِّل.',
      'الخلط بين الوسيط والمعدِّل: الوسيط بيجاوب «إزاي الأثر بيحصل»، والمعدِّل بيجاوب «عند مين الأثر أقوى».'],
    'v-level': ['مستوى القياس: اسمي يعني فئات من غير ترتيب (زي النوع)، ترتيبي يعني فئات بترتيب (زي المستوى التعليمي)، وكمّي يعني درجات بمسافات متساوية (زي درجة مقياس).',
      'المستوى هو اللي بيحدد أنهي إحصاءات ينفع تتحسب. المتوسط مثلاً ملوش معنى مع متغير اسمي.',
      'المجموعة (تجريبية / ضابطة) = اسمي. ترتيب الطالب في الفصل = ترتيبي. الدرجة الكلية على مقياس القلق = كمّي.',
      'إنك تعامل أرقام الترميز (1 = ذكر، 2 = أنثى) كأنها كمّية، أو تعامل بند واحد من مقياس ليكرت كأنه كمّي من غير تبرير.'],
    'v-groups': ['عدد المجموعات هو عدد الفئات في المتغير الاسمي أو الترتيبي، أو عدد مرات القياس لو القياسات متكررة.',
      'مجموعتين ليهم اختبارات (زي t) وأكتر من مجموعتين ليهم اختبارات تانية (زي ANOVA).',
      'تجريبية وضابطة = 2. قياس قبلي وبعدي وتتبعي = 3.',
      'إنك تقارن أكتر من مجموعتين باختبارات t متكررة من غير تصحيح، وده بيزوّد احتمال الخطأ من النوع الأول.'],
    'v-tool': ['«بيتقاس بإيه» يعني الأداة اللي هتطلّع منها درجة المتغير ده: مقياس، اختبار، ملاحظة، أو سجل.',
      'ربط كل متغير بأداته بيكشف بدري لو فيه متغير لسه ملوش طريقة قياس.',
      'قلق الامتحان ← مقياس قلق الامتحان، الدرجة الكلية. التحصيل ← درجات آخر العام من سجلات الكلية.',
      'إنك تسيب متغير من غير أداة، أو تستخدم سؤال واحد لقياس مفهوم مركّب.']
  };
  var EX_LABELS = ['يعني إيه', 'ليه مهم', 'مثال', 'غلطة شائعة'];
  function explainHtml(key) {
    var e = EXPLAIN[key]; if (!e) return '';
    return '<dl class="xp">' + e.map(function (t, i) { return '<div><dt>' + EX_LABELS[i] + '</dt><dd>' + esc(t) + '</dd></div>'; }).join('') + '</dl>';
  }
  function named(p, role) { return (p.vars || []).filter(function (v) { return v.name && v.role === role; }); }
  function q(name) { return '«' + name + '»'; }
  function effectSize(test) {
    if (/MANOVA/.test(test)) return 'مربع إيتا الجزئي (partial η²) لكل متغير تابع';
    if (/ANOVA/.test(test)) return 'مربع إيتا (η²) أو مربع إيتا الجزئي';
    if (/اختبار t/.test(test)) return 'Cohen\'s d';
    if (/الانحدار اللوجستي/.test(test)) return 'نسبة الأرجحية (Odds Ratio) وفترة ثقتها';
    if (/الانحدار المتعدد/.test(test)) return 'R² ومعاملات بيتا المعيارية';
    if (/بيرسون/.test(test)) return 'معامل الارتباط r نفسه و r²';
    if (/سبيرمان/.test(test)) return 'معامل سبيرمان ρ نفسه';
    if (/McNemar/.test(test)) return 'نسبة الأرجحية (Odds Ratio)';
    if (/مربع كاي/.test(test)) return 'Cramér\'s V (أو φ لجدول 2×2)';
    if (/Friedman/.test(test)) return 'Kendall\'s W';
    if (/Kruskal/.test(test)) return 'مربع إبسلون (ε²)';
    if (/Wilcoxon|Mann-Whitney/.test(test)) return 'r = Z ÷ √N';
    return 'حجم الأثر المناسب للاختبار';
  }
  function childSample(p) { return S.kids.length > 0 || /أطفال|اطفال|طفل|تلاميذ|تلميذ/.test(String((p.d || {}).pop || '')); }
  /* Each rule returns { text } or { need }. Drafts only use what the researcher already entered. */
  var SUGGEST = {
    q: function (p) {
      var iv = named(p, 'iv'), dv = named(p, 'dv'), out = [];
      if (!iv.length || !dv.length) return { need: 'اكتب الأول متغير مستقل ومتغير تابع (بالاسم) في جزء «المتغيرات».' };
      dv.forEach(function (d) { iv.forEach(function (x) {
        out.push(x.level === 'scale' || x.level === 'ordinal' && d.level !== 'scale' ? 'هل توجد علاقة بين ' + q(x.name) + ' و' + q(d.name) + '؟' : 'هل توجد فروق في ' + q(d.name) + ' ترجع إلى ' + q(x.name) + '؟');
      }); });
      named(p, 'med').forEach(function (m) { out.push('هل يتوسط ' + q(m.name) + ' العلاقة بين ' + q(iv[0].name) + ' و' + q(dv[0].name) + '؟'); });
      named(p, 'mod').forEach(function (m) { out.push('هل تختلف العلاقة بين ' + q(iv[0].name) + ' و' + q(dv[0].name) + ' باختلاف ' + q(m.name) + '؟'); });
      return { text: out.join('\n') };
    },
    h: function (p) {
      var iv = named(p, 'iv'), dv = named(p, 'dv'), out = [];
      if (!iv.length || !dv.length) return { need: 'اكتب الأول متغير مستقل ومتغير تابع (بالاسم) في جزء «المتغيرات».' };
      var x = iv[0], d = dv[0], rel = p.paired === 'rel';
      if (x.level === 'scale') {
        out.push('غير موجّه: توجد علاقة ارتباطية ذات دلالة إحصائية بين ' + q(x.name) + ' و' + q(d.name) + '.');
        out.push('موجّه (لو النظرية بتدعم اتجاه): توجد علاقة [موجبة / سالبة] ذات دلالة إحصائية بين ' + q(x.name) + ' و' + q(d.name) + '.');
      } else if (d.level === 'nominal') {
        out.push('غير موجّه: توجد علاقة ذات دلالة إحصائية بين ' + q(x.name) + ' و' + q(d.name) + '.');
      } else {
        var what = rel ? 'قياسات ' + q(x.name) : 'مجموعات ' + q(x.name);
        out.push('غير موجّه: توجد فروق ذات دلالة إحصائية في ' + q(d.name) + ' بين ' + what + '.');
        out.push('موجّه (لو النظرية بتدعم اتجاه): ' + (d.level === 'scale' ? 'متوسط ' : 'رتب ') + q(d.name) + ' في [اكتب ' + (rel ? 'القياس' : 'المجموعة') + '] أعلى منه في [اكتب ' + (rel ? 'القياس التاني' : 'المجموعة التانية') + '].');
      }
      named(p, 'med').forEach(function (m) { out.push('وساطة: يتوسط ' + q(m.name) + ' العلاقة بين ' + q(x.name) + ' و' + q(d.name) + ' (الأثر غير المباشر دال إحصائياً).'); });
      named(p, 'mod').forEach(function (m) { out.push('تعديل: تختلف قوة العلاقة بين ' + q(x.name) + ' و' + q(d.name) + ' باختلاف مستوى ' + q(m.name) + ' (التفاعل دال إحصائياً).'); });
      if (!p.design) out.push('ملحوظة: لسه ما حددتش تصميم البحث. الفروض السببية محتاجة تصميم تجريبي.');
      else if (/ارتباطي|مقارن/.test(p.design)) out.push('ملحوظة: تصميمك ' + p.design + '، فالصياغة تبقى «علاقة» أو «فروق» من غير ألفاظ سببية زي «أثر».');
      return { text: out.join('\n') };
    },
    tools: function (p) {
      var vs = (p.vars || []).filter(function (v) { return v.name; });
      if (!vs.length) return { need: 'اكتب متغيراتك الأول في جزء «المتغيرات»، ومعاها كل متغير بيتقاس بإيه.' };
      return { text: vs.map(function (v) { return '- ' + q(v.name) + ': ' + (v.tool ? v.tool + ' [اكتب: صاحب الأداة، النسخة العربية، عدد البنود، وثباتها في دراسات سابقة]' : '[لسه ما كتبتش بيتقاس بإيه في جدول المتغيرات]'); }).join('\n') };
    },
    pop: function (p) {
      if (!p.design) return { need: 'حدد «تصميم البحث» الأول في جزء «التصميم».' };
      var t = 'المجتمع: [مين بالظبط، ومنين].\n', ds = p.design;
      if (/مجموعتين مستقلتين/.test(ds)) t += 'العينة: [العدد] مشارك، بيتوزعوا عشوائياً على مجموعتين: تجريبية وضابطة.\n';
      else if (/قبلي وبعدي/.test(ds)) t += 'العينة: [العدد] مشارك في مجموعة واحدة، بيتقاسوا قبل البرنامج وبعده.\n';
      else if (/شبه تجريبي/.test(ds)) t += 'العينة: [العدد] مشارك في مجموعات قائمة بالفعل (زي فصول)، من غير توزيع عشوائي. اكتب إزاي هتتأكد إن المجموعات متكافئة.\n';
      else if (/ارتباطي/.test(ds)) t += 'العينة: [العدد] مشارك، كلهم بيتطبق عليهم كل المقاييس مرة واحدة.\n';
      else if (/مقارن/.test(ds)) t += 'العينة: [العدد] مشارك، مقسّمين على المجموعات اللي هتقارن بينها: [اكتب عدد كل مجموعة].\n';
      else if (/طولي/.test(ds)) t += 'العينة: [العدد] مشارك، بيتابعوا على [عدد] قياسات. اكتب نسبة التسرّب المتوقعة.\n';
      else if (/تقنين/.test(ds)) t += 'العينة: عينة استطلاعية [العدد] لتجربة البنود، وعينة تقنين [العدد] لحساب الثبات والصدق.\n';
      else if (/نوعي/.test(ds)) t += 'المشاركون: [العدد] مشارك اتاختاروا قصدياً، لحد ما توصل للتشبّع.\n';
      else t += 'العينة: [العدد] مشارك. اكتب أنهي جزء منهم للشق الكمّي وأنهي للشق النوعي.\n';
      t += 'طريقة الاختيار: [عشوائية بسيطة / طبقية / متاحة].\nمعايير الاشتمال والاستبعاد: [اكتبها].\nالحجم: احسبه من معمل الإحصاء (حجم العينة والقوة)، واكتبه في «الحجم المستهدف» مع الأساس.';
      return { text: t };
    },
    plan: function (p) {
      var r = recommend(p);
      if (!r) return { need: 'اكتب الأول متغير مستقل ومتغير تابع (بالاسم) في جزء «المتغيرات».' };
      if (r.need) return { need: r.need };
      if (!r.recs.length) return { need: 'مفيش اقتراح جاهز للتركيبة دي من المتغيرات. راجع مستوى القياس في جزء «المتغيرات».' };
      var t = r.recs.map(function (x) {
        return 'الاختبار: ' + x.test + '\nليه: ' + x.why + '\nأفحص قبل التحليل: ' + x.check.join('؛ ') + (x.alt ? '\nلو الافتراضات مش متحققة: ' + x.alt : '') + '\nأكتب مع النتيجة: ' + effectSize(x.test) + '، وفترة الثقة 95%.';
      }).join('\n\n');
      if (r.extra.length) t += '\n\n' + r.extra.join('\n');
      return { text: t };
    },
    consent: function (p) {
      var kid = childSample(p), t = [];
      if (kid) {
        t.push('- موافقة مكتوبة من ولي أمر كل طفل قبل التطبيق.', '- قبول الطفل نفسه بلغة بسيطة يفهمها، ومن حقه يرفض أو يوقف في أي وقت حتى لو ولي الأمر وافق.', '- التطبيق في وقت ومكان مناسبين للطفل، وفي وجود مسؤول من المدرسة لو التطبيق هناك.');
      } else {
        t.push('- موافقة مستنيرة مكتوبة من كل مشارك قبل التطبيق: هدف الدراسة، المطلوب منه، والوقت المتوقع.', '- المشاركة اختيارية، ومن حق المشارك ينسحب في أي وقت من غير أي ضرر عليه.');
      }
      t.push('- البيانات من غير أسماء: كود لكل مشارك، وجدول الأكواد محفوظ لوحده.', '- حفظ البيانات: [فين، ومين يقدر يطّلع عليها، وهتتمسح إمتى].', '- النتايج بتتعرض مجمّعة، ومحدش يتعرّف عليه منها.');
      if (kid) t.push('- النتايج مش تشخيص، ومتتبنيش عليها قرارات عن الطفل.');
      return { text: (kid ? 'العينة فيها أطفال، فالمطلوب:\n' : '') + t.join('\n') };
    },
    next: function (p) {
      var nx = null;
      STEPS.some(function (s) { if (s[0] !== 'notes' && !stepDone(p, s[0])) { nx = s; return true; } return false; });
      if (!nx) return { text: 'كل الأجزاء مكتوبة. اطبع نسخة من «نظرة عامة» وراجعها مع مشرفك، وحدد ميعاد المقابلة: [التاريخ].' };
      return { text: 'أكمّل جزء «' + nx[1] + '» (' + stepHint(nx[0]) + ') قبل [اكتب الميعاد].' };
    }
  };
  /* A field with its help row. Markup only; helpWire() attaches behaviour. */
  function helpRow(key) {
    var h = '<div class="helprow">';
    if (EXPLAIN[key]) h += '<button class="chipbtn" type="button" data-explain="' + key + '" aria-expanded="false" aria-controls="xp-' + key + '">اشرح لي</button>';
    if (SUGGEST[key]) h += '<button class="chipbtn sug" type="button" data-suggest="' + key + '" aria-expanded="false" aria-controls="sg-' + key + '">اقترح لي</button>';
    return h + '</div>' + (EXPLAIN[key] ? '<div class="xpanel" id="xp-' + key + '" hidden></div>' : '') + (SUGGEST[key] ? '<div class="spanel" id="sg-' + key + '" role="region" aria-label="مسودة مقترحة" hidden></div>' : '');
  }
  function helpWire(p, root) {
    $$('[data-explain]', root).forEach(function (b) {
      b.addEventListener('click', function () {
        var key = b.getAttribute('data-explain'), box = document.getElementById('xp-' + key), open = box.hidden;
        if (b.hasAttribute('data-shared')) $$('[data-shared]', root).forEach(function (o) { if (o !== b) { o.setAttribute('aria-expanded', 'false'); document.getElementById('xp-' + o.getAttribute('data-explain')).hidden = true; } });
        if (open) box.innerHTML = explainHtml(key);
        box.hidden = !open; b.setAttribute('aria-expanded', String(open));
      });
    });
    $$('[data-suggest]', root).forEach(function (b) {
      b.addEventListener('click', function () {
        var key = b.getAttribute('data-suggest'), box = document.getElementById('sg-' + key), el = document.getElementById('f-' + key);
        if (!box.hidden) { box.hidden = true; b.setAttribute('aria-expanded', 'false'); return; }
        var r = SUGGEST[key](p);
        if (r.need) box.innerHTML = '<p class="sg-need">' + esc(r.need) + '</p><p class="row"><button class="btn" type="button" data-skip="' + key + '">تمام</button></p>';
        else box.innerHTML = '<p class="sg-label">مسودة مقترحة: راجعها مع مشرفك</p><p class="sg-text">' + esc(r.text).replace(/\n/g, '<br>') + '</p>' +
          (el.value.trim() ? '<p class="sg-note">عندك نص مكتوب في الخانة دي. الاقتراح هيتضاف تحته، ومش هيمسح حاجة.</p>' : '') +
          '<p class="row"><button class="btn primary" type="button" data-use="' + key + '">استخدم الاقتراح</button><button class="btn" type="button" data-skip="' + key + '">تجاهل</button></p>';
        box.hidden = false; b.setAttribute('aria-expanded', 'true');
        var skip = $('[data-skip]', box), use = $('[data-use]', box);
        skip.addEventListener('click', function () { box.hidden = true; b.setAttribute('aria-expanded', 'false'); b.focus(); });
        if (use) use.addEventListener('click', function () {
          var cur = el.value.replace(/\s+$/, '');
          el.value = (cur ? cur + '\n\n' : '') + r.text;
          el.dispatchEvent(new Event('input', { bubbles: true }));
          box.hidden = true; b.setAttribute('aria-expanded', 'false'); el.focus();
          toast(cur ? 'الاقتراح اتضاف تحت اللي كتبته' : 'الاقتراح اتحط في الخانة. عدّله براحتك');
        });
      });
    });
  }

  function textPane(p, step, pane) {
    p.d = p.d || {};
    pane.innerHTML = '<form class="card form">' + TEXT[step].map(function (f) { return '<div class="hf">' + field('f-' + f[0], f[1], p.d[f[0]] || '', f[2], f[3]) + helpRow(f[0]) + '</div>'; }).join('') +
      '<p class="muted small autosave" id="saved" aria-live="polite">' + ic('check') + 'بيتحفظ لوحده وإنت بتكتب.</p></form>' + nextBtn(p, step);
    $$('[data-f]', pane).forEach(function (el) {
      el.addEventListener('input', function () { p.d[el.id.slice(2)] = el.value; touch(p); tick(); });
    });
    helpWire(p, pane);
  }
  function nextBtn(p, step) {
    var i = STEPS.map(function (s) { return s[0]; }).indexOf(step), n = STEPS[i + 1];
    return '<p class="row step-end"><a class="btn" href="#project/' + p.id + '/overview">نظرة عامة</a>' + (n ? '<a class="btn primary" href="#project/' + p.id + '/' + n[0] + '">التالي: ' + n[1] + '</a>' : '') + '</p>';
  }

  function designPane(p, pane) {
    pane.innerHTML = '<form class="card form"><div class="hf">' + sel('f-design', 'تصميم البحث', DESIGNS, p.design) + helpRow('design') + '</div>' +
      '<div class="hf">' + sel('f-paired', 'القياسات على نفس الأفراد ولا أفراد مختلفين؟', [['ind', 'مجموعات مستقلة (أفراد مختلفين)'], ['rel', 'قياسات مرتبطة (نفس الأفراد أو أزواج متناظرة)']], p.paired, 'ده بيحدد نوع الاختبار الإحصائي') + helpRow('paired') + '</div>' +
      '<div class="hf">' + field('f-dnote', 'ملاحظات على التصميم', (p.d || {}).dnote || '', 'الضبط، التوزيع العشوائي، مصادر التهديد للصدق الداخلي', 'area') + helpRow('dnote') + '</div></form>' + nextBtn(p, 'design');
    helpWire(p, pane);
    $('#f-design').addEventListener('change', function () { p.design = this.value; touch(p); });
    $('#f-paired').addEventListener('change', function () { p.paired = this.value; touch(p); });
    $('#f-dnote').addEventListener('input', function () { p.d = p.d || {}; p.d.dnote = this.value; touch(p); });
  }

  function varsPane(p, pane) {
    p.vars = p.vars || [];
    function draw() {
      pane.innerHTML = '<div class="card vars"><h2>متغيرات البحث</h2><p class="muted small">اكتبهم مرة واحدة هنا. مرشد الاختبار الإحصائي بيقرا منهم.</p><div class="tablewrap"><table><thead><tr><th>اسم المتغير</th><th>دوره</th><th>مستوى القياس</th><th>عدد المجموعات</th><th>بيتقاس بإيه</th><th>' + sr('مسح') + '</th></tr></thead><tbody>' +
        (p.vars.length ? p.vars.map(function (v, i) {
          return '<tr data-i="' + i + '"><td><input type="text" data-k="name" aria-label="اسم المتغير" value="' + esc(v.name) + '"></td><td><select data-k="role" aria-label="دوره">' + opts(ROLE_V, v.role) + '</select></td><td><select data-k="level" aria-label="مستوى القياس">' + opts(LEVEL_V, v.level) + '</select></td><td><input type="number" min="2" data-k="groups" aria-label="عدد المجموعات" value="' + esc(v.groups || '') + '"' + (v.level === 'scale' ? ' disabled' : '') + '></td><td><input type="text" data-k="tool" aria-label="بيتقاس بإيه" value="' + esc(v.tool || '') + '"></td><td><button class="btn ghost icon" type="button" data-del aria-label="امسح المتغير">' + ic('close') + '</button></td></tr>';
        }).join('') : '<tr class="none"><td colspan="6" class="muted">لسه مفيش متغيرات.</td></tr>') +
        '</tbody></table></div><p class="vars-end"><button class="btn" type="button" id="addV">' + ic('plus') + 'ضيف متغير</button></p>' +
        '<div class="helprow cols"><span class="helprow-t">اشرح لي:</span>' + [['v-name', 'اسم المتغير'], ['v-role', 'دوره'], ['v-level', 'مستوى القياس'], ['v-groups', 'عدد المجموعات'], ['v-tool', 'بيتقاس بإيه']].map(function (c) { return '<button class="chipbtn" type="button" data-shared data-explain="' + c[0] + '" aria-expanded="false" aria-controls="xp-' + c[0] + '">' + c[1] + '</button>'; }).join('') + '</div>' +
        ['v-name', 'v-role', 'v-level', 'v-groups', 'v-tool'].map(function (k) { return '<div class="xpanel" id="xp-' + k + '" hidden></div>'; }).join('') + '</div>' + advise(p) + nextBtn(p, 'variables');
      helpWire(p, pane);
      $('#addV').addEventListener('click', function () {
        p.vars.push({ name: '', role: p.vars.length ? 'dv' : 'iv', level: 'scale', groups: '', tool: '' }); touch(p); draw();
        var row = $('tr[data-i="' + (p.vars.length - 1) + '"]', pane);
        if (row && row.animate && !calm()) row.animate([{ opacity: 0, transform: 'translateY(-14px)' }, { opacity: 1, transform: 'none' }], { duration: 360, easing: 'cubic-bezier(.16,1,.3,1)' });
      });
      $$('tr[data-i]', pane).forEach(function (tr) {
        var v = p.vars[+tr.getAttribute('data-i')];
        $$('[data-k]', tr).forEach(function (el) {
          el.addEventListener('change', function () { v[el.getAttribute('data-k')] = el.value; touch(p); draw(); });
        });
        $('[data-del]', tr).addEventListener('click', function () {
          var idx = +tr.getAttribute('data-i');
          function drop() {
            var tops = $$('tr[data-i]', pane).map(function (x) { return x.getBoundingClientRect().top; });
            p.vars.splice(idx, 1); touch(p); draw();
            if (calm()) return;
            $$('tr[data-i]', pane).forEach(function (x, k) { var from = tops[k >= idx ? k + 1 : k], dy = from - x.getBoundingClientRect().top; if (dy && x.animate) x.animate([{ transform: 'translateY(' + dy + 'px)' }, { transform: 'none' }], { duration: 320, easing: 'cubic-bezier(.16,1,.3,1)' }); });
          }
          if (tr.animate && !calm()) tr.animate([{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'translateX(-24px)' }], { duration: 170, easing: 'ease-in' }).onfinish = drop; else drop();
        });
      });
    }
    draw();
  }

  /* ---------- statistical decision guide ---------- */
  function recommend(p) {
    var vs = (p.vars || []).filter(function (v) { return v.name; });
    var dv = vs.filter(function (v) { return v.role === 'dv'; }), iv = vs.filter(function (v) { return v.role === 'iv'; });
    var med = vs.some(function (v) { return v.role === 'med'; }), mod = vs.some(function (v) { return v.role === 'mod'; }), cov = vs.some(function (v) { return v.role === 'cov'; });
    if (!dv.length || !iv.length) return null;
    var out = [], d = dv[0], x = iv[0], rel = p.paired === 'rel', g = parseInt(x.groups, 10) || 0;
    function add(test, why, alt, check) { out.push({ test: test, why: why, alt: alt, check: check }); }
    if (dv.length > 1 && d.level === 'scale' && x.level !== 'scale') add('MANOVA (تحليل التباين المتعدد)', 'عندك أكتر من متغير تابع كمّي ومتغير مستقل فئوي.', 'ANOVA لكل متغير تابع مع تصحيح للمقارنات المتعددة', ['الاعتدالية المتعددة', 'تجانس مصفوفات التغاير (Box\'s M)', 'الارتباط بين المتغيرات التابعة']);
    if (iv.length > 1 && d.level === 'scale') {
      var allCat = iv.every(function (v) { return v.level !== 'scale'; });
      add(allCat ? 'ANOVA عاملي (تحليل التباين الثنائي أو أكتر)' : 'الانحدار المتعدد', allCat ? 'متغير تابع كمّي وأكتر من متغير مستقل فئوي، وده بيختبر التفاعل بينهم كمان.' : 'متغير تابع كمّي وأكتر من متنبئ.', null, allCat ? ['اعتدالية البواقي', 'تجانس التباين (Levene)'] : ['خطية العلاقة', 'اعتدالية البواقي', 'تجانس التباين', 'التعدد الخطي (VIF)', 'استقلال البواقي']);
    } else if (d.level === 'scale' && x.level !== 'scale') {
      if (!g) return { need: 'اكتب عدد المجموعات للمتغير المستقل «' + x.name + '» علشان نحدد الاختبار.' };
      if (!p.paired) return { need: 'حدد في جزء «التصميم»: المجموعات مستقلة ولا القياسات مرتبطة.' };
      if (g === 2) rel ? add('اختبار t للعينات المرتبطة', 'متغير تابع كمّي، وقياسين على نفس الأفراد.', 'Wilcoxon للرتب المؤشَّرة', ['اعتدالية الفروق بين القياسين']) : add('اختبار t للعينات المستقلة', 'متغير تابع كمّي، ومجموعتين مستقلتين.', 'Mann-Whitney U (ولو التباين مش متجانس: Welch t)', ['اعتدالية المتغير التابع في كل مجموعة', 'تجانس التباين (Levene)']);
      else rel ? add('ANOVA للقياسات المتكررة', 'متغير تابع كمّي، و' + g + ' قياسات على نفس الأفراد.', 'Friedman', ['الاعتدالية', 'الكروية (Mauchly)، ولو مش متحققة استخدم تصحيح Greenhouse-Geisser']) : add('ANOVA أحادي الاتجاه', 'متغير تابع كمّي، و' + g + ' مجموعات مستقلة.', 'Kruskal-Wallis (ولو التباين مش متجانس: Welch ANOVA)', ['اعتدالية البواقي', 'تجانس التباين (Levene)', 'لو الفرق دال: مقارنات بعدية (Tukey أو Bonferroni)']);
    } else if (d.level === 'scale' && x.level === 'scale') {
      add('معامل ارتباط بيرسون، أو الانحدار الخطي البسيط لو هدفك التنبؤ', 'المتغيرين كمّيين.', 'معامل سبيرمان', ['خطية العلاقة (شكل الانتشار)', 'الاعتدالية', 'القيم المتطرفة']);
    } else if (d.level === 'ordinal') {
      if (x.level === 'scale' || x.level === 'ordinal') add('معامل ارتباط سبيرمان', 'المتغير التابع ترتيبي.', 'Kendall tau لو العينة صغيرة أو فيه قيم متساوية كتير', ['العلاقة مطّردة (monotonic)']);
      else if (!g) return { need: 'اكتب عدد المجموعات للمتغير المستقل «' + x.name + '».' };
      else if (!p.paired) return { need: 'حدد في جزء «التصميم»: المجموعات مستقلة ولا القياسات مرتبطة.' };
      else if (g === 2) add(rel ? 'Wilcoxon للرتب المؤشَّرة' : 'Mann-Whitney U', 'المتغير التابع ترتيبي ومجموعتين ' + (rel ? 'مرتبطتين.' : 'مستقلتين.'), null, ['شكل التوزيع متشابه في المجموعتين لو هتفسّر الفرق كفرق في الوسيط']);
      else add(rel ? 'Friedman' : 'Kruskal-Wallis', 'المتغير التابع ترتيبي و' + g + ' مجموعات ' + (rel ? 'مرتبطة.' : 'مستقلة.'), null, ['لو الفرق دال: مقارنات بعدية مع تصحيح (Dunn أو Bonferroni)']);
    } else if (d.level === 'nominal') {
      if (x.level === 'scale') add((parseInt(d.groups, 10) || 2) > 2 ? 'الانحدار اللوجستي المتعدد الفئات' : 'الانحدار اللوجستي الثنائي', 'المتغير التابع فئوي والمتنبئ كمّي.', null, ['خطية اللوجيت', 'حجم عينة كفاية لكل فئة', 'التعدد الخطي لو فيه أكتر من متنبئ']);
      else add(rel ? 'اختبار McNemar' : 'مربع كاي للاستقلال', 'المتغيرين فئويين' + (rel ? ' والقياسات مرتبطة.' : '.'), rel ? null : 'اختبار فيشر الدقيق لو فيه خلايا تكرارها المتوقع أقل من 5', ['التكرار المتوقع في كل خلية 5 أو أكتر', 'استقلال المشاهدات']);
    }
    var extra = [];
    if (med) extra.push('عندك متغير وسيط: استخدم تحليل الوساطة بطريقة Bootstrapping (زي PROCESS نموذج 4)، ومتستنتجش سببية من بيانات ارتباطية.');
    if (mod) extra.push('عندك متغير معدِّل: اختبر التفاعل بتحليل التعديل (PROCESS نموذج 1)، ومركِز المتغيرات الكمّية قبل حساب التفاعل.');
    if (cov && d.level === 'scale') extra.push('عندك متغير ضابط: مع متغير مستقل فئوي استخدم ANCOVA، ومع متنبئات كمّية دخّله في الانحدار.');
    return { recs: out, extra: extra };
  }
  function advise(p) {
    var r = recommend(p), head = '<div class="advice-head"><span class="tile-ic">' + ic('guide') + '</span><h3>مرشد الاختبار الإحصائي</h3></div>';
    if (!r) return '<div class="advice warn">' + head + '<p>اكتب متغير مستقل ومتغير تابع على الأقل في جزء <a href="#project/' + p.id + '/variables">المتغيرات</a>، وهنقترح الاختبار المناسب.</p></div>';
    if (r.need) return '<div class="advice warn">' + head + '<p>' + esc(r.need) + '</p></div>';
    return '<div class="advice">' + head + r.recs.map(function (x) {
      return '<div class="rec"><div class="rec-main"><p class="rec-test"><strong>' + esc(x.test) + '</strong></p><p class="small">ليه: ' + esc(x.why) + '</p>' + (x.alt ? '<p class="small">لو الافتراضات مش متحققة: ' + esc(x.alt) + '</p>' : '') + '</div><div class="rec-checks"><p class="small rec-sub">افحص قبل ما تحلل:</p><ul class="small checks">' + x.check.map(function (c) { return '<li>' + ic('clock') + '<span>' + esc(c) + '</span></li>'; }).join('') + '</ul></div></div>';
    }).join('') + r.extra.map(function (e) { return '<p class="small extra">' + esc(e) + '</p>'; }).join('') +
      '<p class="small muted advice-note">الاقتراح ده مبني على أول متغير تابع وأول متغير مستقل ومستوى قياسهم زي ما كتبتهم. راجعه مع مشرفك، واكتب حجم الأثر وفترة الثقة مع أي نتيجة.</p><p><a class="btn" href="' + LABS.stats + '">' + ic('stats') + 'نفّذه في معمل الإحصاء</a></p></div>';
  }

  function printable(p) {
    var h = '<h1>' + esc(p.title || 'مشروع بحثي') + '</h1><p class="muted small">آخر تعديل ' + fmtDate(p.updated) + '</p>';
    h += '<div class="card"><h2>التصميم</h2><p>' + esc(p.design || '—') + '</p><p>' + esc((p.d || {}).dnote || '') + '</p></div>';
    h += '<div class="card"><h2>المتغيرات</h2><ul>' + (p.vars || []).map(function (v) { return '<li>' + esc(v.name) + ' — ' + esc(label(ROLE_V, v.role)) + '، ' + esc(label(LEVEL_V, v.level)) + (v.tool ? '، بيتقاس بـ' + esc(v.tool) : '') + '</li>'; }).join('') + '</ul></div>';
    STEPS.forEach(function (s) { if (!TEXT[s[0]]) return; h += '<div class="card"><h2>' + s[1] + '</h2>' + TEXT[s[0]].map(function (f) { return '<h3>' + esc(f[1]) + '</h3><p>' + esc((p.d || {})[f[0]] || '—').replace(/\n/g, '<br>') + '</p>'; }).join('') + '</div>'; });
    main.innerHTML = '<p class="row"><a class="btn" href="#project/' + p.id + '">رجوع</a></p><div class="printout">' + h + advise(p) + '</div>';
    setTimeout(function () { window.print(); }, 150);
  }
  function label(list, v) { for (var i = 0; i < list.length; i++) if (list[i][0] === v) return list[i][1]; return ''; }

  /* ---------- family: guardian consent + children ---------- */
  var GRADES = ['أولى ابتدائي', 'تانية ابتدائي', 'تالتة ابتدائي', 'رابعة ابتدائي', 'خامسة ابتدائي', 'سادسة ابتدائي'];
  V.family = function () {
    var h = '<header class="head"><h1>' + (S.role === 'specialist' ? 'الأطفال اللي بتابعهم' : 'أولادي') + '</h1></header>';
    if (S.kids.length) h += '<div class="kids">' + S.kids.map(function (k) {
      return '<div class="kid-card"><span class="kid-av" aria-hidden="true">' + esc(String(k.child || '').trim().charAt(0)) + '</span><div><h2>' + esc(k.child) + '</h2><p class="kid-meta"><span class="num">' + esc(k.age) + '</span> سنين · ' + esc(k.grade) + '</p><p class="small kid-consent">موافقة ولي الأمر: ' + esc(k.guardian) + ' · ' + fmtDate(k.date) + '</p><a class="btn" href="#kids">افتح الأنشطة</a><a class="btn" href="#cases/parent/' + esc(k.id) + '">احكي للأخصائي عن ' + esc(k.child) + '</a></div></div>';
    }).join('') + '</div>';
    h += '<div class="sec"><h2>تسجيل طفل</h2></div><form class="card form" id="kf" novalidate>' +
      '<p class="notice">الأنشطة هنا للتنمية والمتابعة. مش اختبار ذكاء ولا تشخيص، ونتايجها مينفعش يتبني عليها قرار مصيري عن الطفل.</p><div class="two">' +
      '<div class="fld">' + field('k-guardian', 'اسم ولي الأمر', '') + '</div><div class="fld">' + field('k-child', 'اسم الابن أو البنت', '') + '</div>' +
      '<div class="fld">' + field('k-age', 'السن', '', 'من 5 لـ13 سنة', 'number') + '</div><div class="fld">' + sel('k-grade', 'الصف الدراسي', GRADES, '') + '</div></div>' +
      '<label class="check" for="k-ok"><input type="checkbox" id="k-ok"><span>أنا ولي أمر الطفل، وموافق إنه يستخدم أنشطة المنصة وإن نتايج الأنشطة تتسجل لمتابعة تقدّمه.</span></label>' +
      '<p id="k-err" class="small err" role="alert"></p><p class="form-end"><button class="btn primary" type="submit">سجّل</button></p></form>';
    main.innerHTML = h;
    var err = $('#k-err');
    $('#kf').addEventListener('submit', function (e) {
      e.preventDefault();
      var g = $('#k-guardian').value.trim(), c = $('#k-child').value.trim(), a = parseInt($('#k-age').value, 10), gr = $('#k-grade').value, ok = $('#k-ok').checked;
      var m = !g ? 'اكتب اسم ولي الأمر.' : !c ? 'اكتب اسم الابن أو البنت.' : !(a >= 5 && a <= 13) ? 'السن لازم يكون من 5 لـ13 سنة.' : !gr ? 'اختار الصف الدراسي.' : !ok ? 'لازم موافقة ولي الأمر علشان نسجّل الطفل.' : '';
      if (m) { err.textContent = m; return; }
      S.kids.push({ id: uid(), guardian: g, child: c, age: a, grade: gr, date: today(), consent: 'v1' });
      save(); V.family(); toast('اتسجّل');
    });
  };

  /* ---------- router ---------- */
  function route() {
    var parts = (location.hash || '#home').slice(1).split('/'), r = parts[0];
    if (!V[r] && !MODS[r]) r = 'home';
    if (window.HubMotion) window.HubMotion.stop();
    touch.after = null;
    document.body.classList.remove('is-intro');
    document.body.classList.toggle('on-assistant', r === 'assistant' || r === 'kids');
    if (MODS[r]) modView(r, parts[1], parts[2]); else V[r](parts[1], parts[2]);
    drawNav(r === 'project' ? 'projects' : r);
    document.title = BRAND + ' — منصة البحث وتنمية القدرات';
    if (route.ready) { main.focus({ preventScroll: true }); window.scrollTo(0, 0); }
    route.ready = true;
    stage(r);
  }
  /* After a render: hand each marked element its place in the entrance sequence, and count numbers up. */
  function stage(r) {
    $$('[data-d]', main).forEach(function (el) { el.style.animationDelay = el.getAttribute('data-d') + 'ms'; });
    if (!calm()) $$('text[data-count]', main).forEach(function (el) {
      var to = +el.getAttribute('data-count'), t0 = 0;
      if (!(to > 0)) return;
      function step(t) { if (!t0) { t0 = t + 500; el.textContent = '0'; } var k = Math.min(1, Math.max(0, (t - t0) / 800)); el.textContent = String(Math.round(to * (1 - Math.pow(1 - k, 3)))); if (k < 1 && el.isConnected) requestAnimationFrame(step); else el.textContent = String(to); }
      requestAnimationFrame(step);
    });
    if (window.HubMotion) window.HubMotion.after(main, r);
  }
  /* Route changes cross-fade through the View Transitions API where it exists; otherwise they are instant. */
  var ORDER = ['home', 'projects', 'project', 'profile', 'family', 'theories', 'kids', 'decide', 'explore', 'assistant', 'labs', 'role'];
  function rank(hash) { var a = (hash || '#home').slice(1).split('/'), i = ORDER.indexOf(a[0]); if (i < 0) i = 0; if (a[0] === 'project') i += (STEPS.map(function (x) { return x[0]; }).indexOf(a[2]) + 2) / 100; return i; }
  var lastRank = rank(location.hash);
  function go() {
    var nr = rank(location.hash); document.documentElement.setAttribute('data-dir', nr >= lastRank ? 'fwd' : 'back'); lastRank = nr;
    if (route.ready && document.startViewTransition && !calm()) { try { var vt = document.startViewTransition(route), quiet = function () {}; vt.ready.catch(quiet); vt.finished.catch(quiet); vt.updateCallbackDone.catch(quiet); return; } catch (e) {} }
    route();
  }
  /* What a section file may use. Section data lives under S.mods[name] and is saved with the rest. */
  window.Hub = {
    register: function (name, fn) { if (MODS[name]) MOD_VIEWS[name] = fn; },
    data: function (name) { if (!S.mods || typeof S.mods !== 'object') S.mods = {}; if (!S.mods[name]) S.mods[name] = {}; return S.mods[name]; },
    state: function () { return S; }, save: save, esc: esc, $: $, $$: $$, toast: toast, ic: ic, field: field, sel: sel, opts: opts,
    loadMod: loadMod, uid: uid, today: today, plural: plural, calm: calm, labs: LABS, go: function (hash) { location.hash = hash; }
  };
  /* Floating launcher: opens the assistant as a panel over the current page. */
  (function () {
    var fab = document.createElement('button');
    fab.type = 'button'; fab.className = 'assist-fab'; fab.setAttribute('aria-label', 'افتح المساعد');
    fab.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M12 2.5l2.2 6.3 6.3 2.2-6.3 2.2L12 19.5l-2.2-6.3-6.3-2.2 6.3-2.2z" fill="currentColor"/><circle cx="19" cy="5" r="1.6" fill="currentColor"/></svg><span>المساعد</span>';
    fab.addEventListener('click', function () {
      loadMod('assistant', function (ok) {
        if (ok && window.HubAssistant && window.HubAssistant.open) window.HubAssistant.open({ context: { label: document.title, route: (location.hash || '#home').slice(1) } });
        else location.hash = '#assistant';
      });
    });
    document.body.appendChild(fab);
  })();
  window.addEventListener('hashchange', go);
  route();
  setTimeout(function () { document.documentElement.classList.remove('boot'); }, 1800);
})();
