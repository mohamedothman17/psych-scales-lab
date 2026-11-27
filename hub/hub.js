/* Hub app: hash router + local store. No dependencies. All user text is escaped through esc(). */
(function () {
  'use strict';
  var BRAND = 'مَلَكة';
  var LABS = {
    scales: 'https://mohamedothman17.github.io/psych-scales-lab/',
    stats: 'https://mohamedothman17.github.io/psych-stats-lab/'
  };
  var KEY = 'hub-v1', THEME_KEY = 'hub-theme';
  var main = document.getElementById('main');

  /* ---------- theme (runs before the first render) ---------- */
  var darkMq = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
  function storedTheme() { try { var t = localStorage.getItem(THEME_KEY); return t === 'dark' || t === 'light' ? t : ''; } catch (e) { return ''; } }
  function applyTheme(force) {
    var t = force || storedTheme() || (darkMq && darkMq.matches ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', t);
    var m = document.querySelector('meta[name="theme-color"]'); if (m) m.setAttribute('content', t === 'dark' ? '#0e0b1f' : '#f3f5fa');
    return t;
  }
  var theme = applyTheme();
  if (darkMq) { var onMq = function () { if (!storedTheme()) { theme = applyTheme(); drawTheme(); } }; if (darkMq.addEventListener) darkMq.addEventListener('change', onMq); else if (darkMq.addListener) darkMq.addListener(onMq); }

  /* ---------- store ---------- */
  var S = load();
  function load() {
    var d = { role: '', profile: {}, projects: [], kids: [] };
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
  function toast(msg) { var t = document.getElementById('toast'); t.textContent = msg; t.hidden = false; clearTimeout(toastT); toastT = setTimeout(function () { t.hidden = true; }, 3200); }
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
    home: '<path d="M3.5 9.2 10 3.5l6.5 5.7v6.3a1 1 0 0 1-1 1h-3.3v-4.3H7.8v4.3H4.5a1 1 0 0 1-1-1z"/>',
    projects: '<circle cx="4.5" cy="14.5" r="1.6"/><circle cx="10" cy="5.5" r="1.6"/><circle cx="15.5" cy="12" r="1.6"/><path d="m5.4 13.1 3.7-6.2M11.2 6.7l3.3 4.1"/>',
    profile: '<circle cx="10" cy="7" r="3"/><path d="M4 16.5c.8-2.8 3.1-4.2 6-4.2s5.2 1.4 6 4.2"/>',
    family: '<circle cx="10" cy="10" r="6.5"/><path d="M7.3 11.7c.7 1 1.6 1.5 2.7 1.5s2-.5 2.7-1.5"/><circle cx="7.8" cy="8.5" r=".6" fill="currentColor" stroke="none"/><circle cx="12.2" cy="8.5" r=".6" fill="currentColor" stroke="none"/>',
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
    document.getElementById('roleBtn').innerHTML = ic('profile') + '<span>' + (S.role ? 'أنا: ' + ROLES[S.role] : 'اختار دورك') + '</span>';
    drawTheme();
  }
  function drawTheme() {
    var b = document.getElementById('themeBtn'), toDark = theme !== 'dark', label = toDark ? 'الوضع الداكن' : 'الوضع الفاتح';
    b.innerHTML = ic(toDark ? 'moon' : 'sun') + '<span>' + label + '</span>';
    b.setAttribute('aria-label', 'بدّل إلى ' + label);
  }
  document.getElementById('roleBtn').addEventListener('click', function () { location.hash = '#role'; });
  document.getElementById('themeBtn').addEventListener('click', function () {
    var t = theme === 'dark' ? 'light' : 'dark';
    try { localStorage.setItem(THEME_KEY, t); } catch (e) {}
    theme = applyTheme(t); drawTheme();
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
    for (i = 0; i < (mobile ? 30 : 60); i++) dots += '<circle cx="' + f1(r() * W) + '" cy="' + f1(r() * H) + '" r="' + (r() < 0.2 ? 1.1 : 0.6) + '" opacity="' + f1(0.25 + r() * 0.5) + '"/>';
    h += '<g class="sky-field">' + dots + '</g>';
    for (i = 0; i < pts.length - 1; i++) {
      h += '<path class="' + (done[i] && done[i + 1] ? 'link-done' : (done[i] && i + 1 === nx) ? 'link-next' : 'link-todo') + '" d="M' + pts[i][0] + ' ' + pts[i][1] + 'L' + pts[i + 1][0] + ' ' + pts[i + 1][1] + '"/>';
    }
    STEPS.forEach(function (s, k) {
      var x = pts[k][0], y = pts[k][1], isNext = k === nx;
      var up = mobile ? k === 4 : (k === 0 || ys[k - 1] > y) && (k === 9 || ys[k + 1] > y) && k > 0;
      function lab(dy) { return '<text class="t" x="' + x + '" y="' + (up ? y - dy + 12 : y + dy) + '">' + esc(s[1]) + '</text>'; }
      var num = mobile ? '' : '<text class="n" x="' + x + '" y="' + (up ? y + (isNext ? 58 : 30) : y - (isNext ? 50 : 22)) + '">' + pad2(k + 1) + '</text>';
      if (isNext) {
        var a = mobile ? [38, 26, 18, 11, 18, 44] : [58, 40, 27, 16, 26, 62];
        h += '<g class="st next"><circle cx="' + x + '" cy="' + y + '" r="' + a[0] + '" fill="url(#glow)"/><circle class="halo h3" cx="' + x + '" cy="' + y + '" r="' + a[1] + '"/><circle class="halo h2" cx="' + x + '" cy="' + y + '" r="' + a[2] + '"/><circle class="halo h1" cx="' + x + '" cy="' + y + '" r="' + a[3] + '"/>' +
          '<use href="#star4" x="' + (x - a[4] / 2) + '" y="' + (y - a[4] / 2) + '" width="' + a[4] + '" height="' + a[4] + '"/>' + num + lab(a[5]) + '</g>';
      } else if (done[k]) {
        var z = mobile ? 15 : 19;
        h += '<g class="st done"><circle cx="' + x + '" cy="' + y + '" r="' + z + '" fill="url(#glowS)"/><use href="#star4" x="' + (x - z / 2) + '" y="' + (y - z / 2) + '" width="' + z + '" height="' + z + '"/>' + num + lab(mobile ? 27 : 31) + '</g>';
      } else {
        h += '<g class="st todo"><circle cx="' + x + '" cy="' + y + '" r="' + (mobile ? 3.6 : 4.5) + '"/>' + num + lab(mobile ? 24 : 28) + '</g>';
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
      h += '<polygon class="g-gap' + (done[i] && done[(i + 1) % 10] ? ' on' : '') + '" points="' + [loc(a - 18, r1, 0), loc(a, u2, -w), loc(a, R, 0), loc(b, R, 0), loc(b, u2, w)].join(' ') + '"/>';
    }
    for (i = 0; i < 10; i++) {
      a = ax(i);
      var cls = done[i] ? 'done' : i === nx ? 'next' : 'todo';
      h += '<polygon class="g-petal ' + cls + '" points="' + [loc(a, r0, 0), loc(a, u1, w), loc(a, u2, w), loc(a, R, 0), loc(a, u2, -w), loc(a, u1, -w)].join(' ') + '"/>';
      if (big) { var t = loc(a, 61, 0).split(','); h += '<text class="g-num ' + cls + '" x="' + t[0] + '" y="' + f1(+t[1] + 4.5) + '">' + (i + 1) + '</text>'; }
    }
    h += '<polygon class="g-star" points="' + star.join(' ') + '"/><text class="g-big" x="0" y="' + (big ? 6 : 10) + '">' + n + '</text>' + (big ? '<text class="g-of" x="0" y="18">من ' + STEPS.length + '</text>' : '');
    return h + '</svg>';
  }

  /* Growth rings: 1 to 3 rings for a self-reported level. */
  var LEVELS = { 'مبتدئ': 1, 'متوسط': 2, 'متقدم': 3 };
  function rings(level) {
    var h = '<svg class="rings" viewBox="0 0 96 96" aria-hidden="true" focusable="false"><circle class="rg-orbit" cx="48" cy="48" r="45"/>';
    for (var k = 3; k >= 1; k--) h += '<circle class="rg' + (k <= level ? ' on' : '') + '" cx="48" cy="48" r="' + (k * 13 + 2) + '"/>';
    return h + '</svg>';
  }
  var TOYS = '<svg class="toys" viewBox="0 0 200 220" aria-hidden="true" focusable="false"><rect class="toy-a" x="28" y="128" width="78" height="78" rx="14"/><circle class="toy-w" cx="54" cy="158" r="5"/><circle class="toy-w" cx="82" cy="158" r="5"/><path class="toy-smile" d="M54 176c8 9 20 9 28 0"/><path class="toy-b" d="M112 206a44 44 0 0 1 88 0z"/><path class="toy-c" d="M34 128 70 62l36 66z"/><circle class="toy-d" cx="150" cy="118" r="30"/><circle class="toy-e" cx="150" cy="118" r="12"/><rect class="toy-w" x="20" y="14" width="40" height="40" rx="10" transform="rotate(-14 40 34)"/></svg>';

  /* ---------- views ---------- */
  var V = {};

  V.role = function () {
    var cards = [
      ['researcher', 'باحث', 'ماجستير أو دكتوراه أو باحث مستقل. عاوز تمشي بمشروعك من السؤال للتحليل.', 'projects'],
      ['student', 'طالب', 'بتدرس علم نفس وعاوز تتعلم القياس والإحصاء وتجرّب مشروع صغير.', 'library'],
      ['specialist', 'أخصائي', 'بتتابع حالات أو أطفال، وعاوز أنشطة وخطط متابعة مبنية على أساس علمي.', 'guide'],
      ['parent', 'ولي أمر', 'عاوز أنشطة تنمّي قدرات ابنك أو بنتك (من أولى لسادسة ابتدائي) وتتابع تقدّمه.', 'family']
    ];
    main.innerHTML = '<header class="head"><h1>إنت مين؟</h1><p class="lead">اختيارك بيحدد الأقسام اللي تظهر لك. تقدر تغيّره في أي وقت.</p></header><div class="roles">' + cards.map(function (c) {
      var on = S.role === c[0];
      return '<button class="role-card' + (on ? ' on' : '') + '" type="button" data-role="' + c[0] + '" aria-pressed="' + on + '"><span class="role-ic">' + ic(c[3]) + '</span><span class="role-txt"><span class="role-name">' + c[1] + '</span><span class="muted">' + c[2] + '</span></span>' + (on ? '<span class="tag">اختيارك الحالي</span>' : '') + '</button>';
    }).join('') + '</div>';
    $$('[data-role]', main).forEach(function (b) { b.addEventListener('click', function () { S.role = b.getAttribute('data-role'); save(); location.hash = '#home'; }); });
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
    var h = '<section class="tile sky" aria-labelledby="sky-t">';
    if (p) {
      var n = progress(p), nx = null;
      STEPS.some(function (s) { if (!stepDone(p, s[0])) { nx = s; return true; } return false; });
      h += '<div class="sky-head"><div><p class="sky-kicker">آخر مشروع اشتغلت عليه · ' + fmtDate(p.updated) + '</p><h2 id="sky-t">' + esc(p.title || 'مشروع من غير عنوان') + '</h2></div>' +
        '<p class="sky-count"><span class="big num">' + n + '</span><span class="of">من ' + STEPS.length + '</span><span class="lbl">أجزاء مكتملة</span></p></div>' +
        starChart(p, false) + starChart(p, true) +
        '<div class="sky-foot"><p class="sky-next">' + (nx ? '<span class="pill">الخطوة الجاية</span><strong>' + nx[1] + '</strong><span class="sky-hint">' + esc(stepHint(nx[0])) + '</span>' : '<span class="pill">اكتملت</span><span class="sky-hint">كل الأجزاء العشرة مكتوبة. راجعها مع مشرفك واطبع نسخة.</span>') + '</p>' +
        '<div class="row"><a class="btn onsky" href="#project/' + p.id + '">افتح المشروع</a>' + (nx ? '<a class="btn primary" href="#project/' + p.id + '/' + nx[0] + '">كمّل: ' + nx[1] + '</a>' : '') + '</div></div>';
    } else {
      h += '<div class="sky-head"><div><h2 id="sky-t">مشروعك البحثي بيبدأ من سؤال</h2><p class="sky-lead">عشر محطات من السؤال لحد ملاحظات المشرف. كل جزء تكمّله بينوّر نجمة، والمرشد بيقولك إيه الناقص.</p></div></div>' +
        starChart(null, false) + starChart(null, true) +
        '<div class="sky-foot"><p class="sky-next"><span class="sky-hint">لسه مفيش مشاريع على الجهاز ده.</span></p><div class="row"><button class="btn primary" type="button" id="homeNew">ابدأ أول مشروع</button></div></div>';
    }
    return h + '</section>';
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
    var h = '<section class="tile guide"><div class="tile-head"><span class="tile-ic">' + ic('guide') + '</span><h2>مرشد الاختبار الإحصائي</h2></div>';
    if (!p) return h + '<p class="muted">بيقرا متغيرات مشروعك ومستوى قياسها، ويقترح الاختبار المناسب ويقولك ليه. أول ما تبدأ مشروع هيشتغل.</p><p class="guide-sub">بيقرا 3 حاجات</p>' + READS + '</section>';
    var r = recommend(p);
    if (!r) h += '<p class="guide-ask">ناقص متغير مستقل ومتغير تابع</p><p class="muted">اكتبهم في جزء المتغيرات، وهنقترح الاختبار المناسب.</p><p class="guide-sub">بيقرا 3 حاجات</p>' + READS + '<p class="tile-end"><a class="btn" href="#project/' + p.id + '/variables">اكتب المتغيرات</a></p>';
    else if (r.need) h += '<p class="guide-ask">' + esc(r.need) + '</p><p class="guide-sub">بيقرا 3 حاجات</p>' + READS + '<p class="tile-end"><a class="btn" href="#project/' + p.id + '/' + (r.need.indexOf('التصميم') > -1 ? 'design' : 'variables') + '">كمّل الناقص</a></p>';
    else if (!r.recs.length) h += '<p class="muted">مفيش اقتراح جاهز للتركيبة دي من المتغيرات. راجع مستوى القياس في جزء المتغيرات.</p><p class="tile-end"><a class="btn" href="#project/' + p.id + '/variables">افتح المتغيرات</a></p>';
    else {
      var x = r.recs[0];
      h += '<p class="guide-test">' + esc(x.test) + '</p><p class="guide-why">' + esc(x.why) + '</p>' + schema(p) + (x.alt ? '<p class="guide-alt"><span>لو الافتراضات مش متحققة</span>' + esc(x.alt) + '</p>' : '') + '<p class="guide-sub">افحص قبل ما تحلل</p><ul class="checks">' + x.check.slice(0, 2).map(function (c) { return '<li>' + ic('clock') + '<span>' + esc(c) + '</span></li>'; }).join('') + '</ul>' +
        '<p class="tile-end"><a class="btn" href="#project/' + p.id + '/analysis">افتح المرشد</a><span class="tag">حسب متغيراتك</span></p>';
    }
    return h + '</section>';
  }
  function skillsTile() {
    var sk = [['stats', 'الإحصاء'], ['psychometrics', 'القياس النفسي']], any = sk.some(function (k) { return LEVELS[S.profile[k[0]]]; }), d = profileDone();
    return '<section class="tile skills"><div class="tile-head"><h2>ملكاتك</h2>' + (any ? '<span class="tag quiet">من كلامك</span>' : '') + '</div><div class="skill-row">' + sk.map(function (k) {
      var v = S.profile[k[0]], lv = LEVELS[v] || 0;
      return '<div class="skill">' + rings(lv) + '<p class="skill-name">' + k[1] + '</p><p class="skill-lv' + (lv ? '' : ' none') + '">' + (lv ? esc(v) : 'لسه ما حددتش') + '</p></div>';
    }).join('') + '</div><p class="tile-note">' + (any ? 'كل حلقة مستوى إنت اللي حددته في ملفك. مفيش قياس من عندنا.' : 'حدد مستواك في ملفك، والحلقات تتملى على أساسه.') + '</p>' +
      '<p class="tile-end"><a class="btn" href="#profile">' + (d ? 'عدّل ملفك' : 'كمّل ملفك') + '</a><span class="muted small num">' + d + ' من ' + PF.length + ' حقل مكتمل</span></p></section>';
  }
  function kidsTile(r) {
    var k = S.kids[0], more = S.kids.length - 1, title = r === 'specialist' ? 'الأطفال اللي بتابعهم' : 'أولادي';
    return '<section class="tile kid' + (k ? '' : ' empty') + '"><div class="kid-txt"><h2 class="kid-label">' + title + '</h2>' +
      (k ? '<p class="kid-name">' + esc(k.child) + '</p><p class="kid-grade">' + esc(k.grade) + (more > 0 ? ' · و' + plural(more, 'طفل كمان', 'طفلين كمان', 'أطفال كمان', 'طفل كمان') : '') + '</p><p class="kid-soon">الأنشطة قريباً</p><a class="btn onkid" href="#family">افتح المتابعة</a>'
        : '<p class="kid-name small-name">سجّل طفلك</p><p class="kid-grade">من أولى لسادسة ابتدائي، بموافقة ولي الأمر.</p><p class="kid-soon">الأنشطة قريباً</p><a class="btn onkid" href="#family">ابدأ التسجيل</a>') +
      '</div>' + TOYS + '</section>';
  }
  function labsTile() {
    return '<section class="tile labs"><h2>المعامل</h2>' +
      '<a class="lab" href="' + LABS.scales + '"><span class="tile-ic">' + ic('measure') + '</span><span><strong>معمل القياس النفسي</strong><small>ثبات، صدق، وتحليل بنود</small></span></a>' +
      '<a class="lab" href="' + LABS.stats + '"><span class="tile-ic">' + ic('stats') + '</span><span><strong>معمل الإحصاء النفسي</strong><small>اختبارات، حجم أثر، وقوة</small></span></a></section>';
  }
  function soonTile() {
    return '<section class="tile soon"><h2>لسه بنبنيها</h2><ul>' + [
      ['library', 'مكتبة النظريات النفسية', 'كل نظرية بأدلتها ونقدها وأنشطتها'],
      ['games', 'ألعاب وأنشطة الأطفال', 'ذاكرة، انتباه، استدلال، مرونة، إبداع'],
      ['ops', 'بحوث العمليات واتخاذ القرار', 'توزيع العينة، الميزانية مقابل القوة، الجدولة'],
      ['opps', 'مستكشف الأدبيات والفرص', 'أبحاث بروابطها، ومنح متراجعة بتاريخها'],
      ['career', 'التوجيه المهني والبورتفوليو', 'ميولك، مساراتك، وملف إنجازاتك']
    ].map(function (c) { return '<li>' + ic(c[0]) + '<span><strong>' + c[1] + '</strong><small>' + c[2] + '</small></span><span class="tag soon-tag">قريباً</span></li>'; }).join('') + '</ul></section>';
  }

  V.home = function () {
    var r = S.role, h = '', works = !r || r === 'researcher' || r === 'student' || r === 'specialist', kids = !r || r === 'parent' || r === 'specialist';
    var p = works ? latest() : null;
    if (!r) {
      h += '<section class="hero"><div class="hero-main"><h1><span class="hero-brand">' + esc(BRAND) + '</span>من القدرة للإنجاز</h1><p class="lead">منصة واحدة للباحث والأخصائي وولي الأمر. بتمشي معاك من أول سؤال لحد نتيجة تقدر تثبتها.</p>' +
        '<p><a class="btn primary big" href="#role">ابدأ: اختار دورك</a></p></div>' +
        '<ol class="q" aria-label="خمس أسئلة بنمشي معاك فيها"><li>أنا أقدر أبقى إيه؟</li><li>عندي إيه دلوقتي من قدرات ومهارات؟</li><li>أطوّر إيه بعد كده، وأثبت إزاي إني اتحسنت؟</li><li>أشتغل على أنهي بحث أو مشكلة حقيقية؟</li><li>إنجازاتي تفتح لي أنهي فرص؟</li></ol></section>';
    } else {
      var t, lead = '';
      if (r === 'parent') {
        t = S.kids.length ? 'متابعة ' + (S.kids.length === 1 ? esc(S.kids[0].child) : 'أولادك') : 'سجّل طفلك علشان تبدأ';
        lead = S.kids.length ? 'مسجّل عندك <em class="num">' + plural(S.kids.length, 'طفل واحد', 'طفلين', 'أطفال', 'طفل') + '</em>. الأنشطة لسه بنجهّزها.' : 'التسجيل بياخد دقيقة، وبموافقة ولي الأمر.';
      } else if (p) {
        var left = STEPS.length - progress(p);
        t = left ? 'فاضل لك <em class="num">' + plural(left, 'جزء واحد', 'جزئين', 'أجزاء', 'جزء') + '</em> وتكمّل خطة بحثك' : 'خطة بحثك <em>اكتملت</em>';
        lead = 'عندك <span class="num">' + plural(S.projects.length, 'مشروع واحد', 'مشروعين', 'مشاريع', 'مشروع') + '</span> على الجهاز ده.';
      } else { t = 'ابدأ مشروعك البحثي الأول'; lead = 'هنمشي معاك خطوة خطوة، من السؤال لخطة التحليل.'; }
      h += '<header class="head hello"><h1>' + t + '</h1><p class="lead">' + lead + '</p></header>';
    }
    h += '<div class="bento b-' + (r || 'guest') + '">' + (works ? skyTile(p) + guideTile(p) + skillsTile() : '') + (kids ? kidsTile(r) : '') + labsTile() + soonTile() + '</div>';
    main.innerHTML = h;
    var nb = $('#homeNew'); if (nb) nb.addEventListener('click', newProject);
  };

  V.labs = function () {
    main.innerHTML = '<header class="head"><h1>المعامل</h1><p class="lead">الموقعين الأصليين شغالين زي ما هم. افتح المعمل اللي محتاجه.</p></header><div class="lab-grid">' +
      '<a class="lab-card" href="' + LABS.scales + '"><span class="tile-ic lg">' + ic('measure') + '</span><h2>معمل القياس النفسي</h2><p class="muted">بناء المقاييس، الثبات والصدق، تحليل البنود، بنك المقاييس، ووضع الامتحان.</p><span class="go">افتح المعمل</span></a>' +
      '<a class="lab-card" href="' + LABS.stats + '"><span class="tile-ic lg">' + ic('stats') + '</span><h2>معمل الإحصاء النفسي</h2><p class="muted">الاختبارات الإحصائية، حجم العينة والقوة، قراءة مخرجات SPSS، وكتابة النتايج.</p><span class="go">افتح المعمل</span></a></div>';
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
  var DESIGNS = ['وصفي ارتباطي', 'وصفي مقارن', 'تجريبي (مجموعتين مستقلتين)', 'تجريبي (قياس قبلي وبعدي لنفس المجموعة)', 'شبه تجريبي', 'طولي', 'بناء وتقنين مقياس', 'نوعي', 'مختلط'];
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
      return '<a class="pcard" href="#project/' + p.id + '"><span class="pcard-ros">' + rosette(p, false) + '</span><span class="pcard-body"><h2>' + esc(p.title || 'مشروع من غير عنوان') + '</h2><span class="pcard-meta num">' + n + ' من ' + STEPS.length + ' أجزاء مكتملة</span>' +
        '<span class="pcard-sub">' + (nx ? 'الجاي: ' + nx[1] : 'كل الأجزاء مكتملة') + ' · آخر تعديل ' + fmtDate(p.updated) + '</span></span></a>';
    }).join('') + '</div>';
    main.innerHTML = h;
    $('#newP').addEventListener('click', newProject);
  };

  V.project = function (id, step) {
    var p = proj(id);
    if (!p) { main.innerHTML = '<div class="card empty"><p class="empty-t">المشروع ده مش موجود على الجهاز ده.</p><p><a class="btn" href="#projects">رجوع للمشاريع</a></p></div>'; return; }
    step = step || 'overview';
    var h = '<p class="crumb"><a href="#projects">' + ic('back') + 'كل المشاريع</a></p>' +
      '<div class="ptitle"><label for="ptitle">عنوان المشروع</label><textarea id="ptitle" rows="1" placeholder="اكتب عنوان مبدئي">' + esc(p.title) + '</textarea></div>' +
      '<div class="steps" role="tablist" aria-label="أجزاء المشروع"><button type="button" role="tab" data-step="overview" class="ov" aria-selected="' + (step === 'overview') + '"><span class="dot">' + ic('projects') + '</span><span class="lbl">نظرة عامة</span></button>' +
      STEPS.map(function (s, i) { var ok = stepDone(p, s[0]); return '<button type="button" role="tab" data-step="' + s[0] + '" class="' + (ok ? 'done' : '') + '" aria-selected="' + (step === s[0]) + '"><span class="dot num">' + (ok ? ic('check') : i + 1) + '</span><span class="lbl">' + s[1] + '</span>' + (ok ? sr('مكتمل') : '') + '</button>'; }).join('') + '</div><div id="pane"></div>';
    main.innerHTML = h;
    var strip = $('.steps', main), cur = $('[aria-selected="true"]', strip);
    if (cur) strip.scrollLeft = cur.offsetLeft - (strip.clientWidth - cur.offsetWidth) / 2;
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
  };
  function touch(p) { p.updated = today(); save(); }

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

  function textPane(p, step, pane) {
    p.d = p.d || {};
    pane.innerHTML = '<form class="card form">' + TEXT[step].map(function (f) { return field('f-' + f[0], f[1], p.d[f[0]] || '', f[2], f[3]); }).join('') +
      '<p class="muted small autosave" id="saved" aria-live="polite">' + ic('check') + 'بيتحفظ لوحده وإنت بتكتب.</p></form>' + nextBtn(p, step);
    $$('[data-f]', pane).forEach(function (el) {
      el.addEventListener('input', function () { p.d[el.id.slice(2)] = el.value; touch(p); });
    });
  }
  function nextBtn(p, step) {
    var i = STEPS.map(function (s) { return s[0]; }).indexOf(step), n = STEPS[i + 1];
    return '<p class="row step-end"><a class="btn" href="#project/' + p.id + '/overview">نظرة عامة</a>' + (n ? '<a class="btn primary" href="#project/' + p.id + '/' + n[0] + '">التالي: ' + n[1] + '</a>' : '') + '</p>';
  }

  function designPane(p, pane) {
    pane.innerHTML = '<form class="card form">' + sel('f-design', 'تصميم البحث', DESIGNS, p.design) +
      sel('f-paired', 'القياسات على نفس الأفراد ولا أفراد مختلفين؟', [['ind', 'مجموعات مستقلة (أفراد مختلفين)'], ['rel', 'قياسات مرتبطة (نفس الأفراد أو أزواج متناظرة)']], p.paired, 'ده بيحدد نوع الاختبار الإحصائي') +
      field('f-dnote', 'ملاحظات على التصميم', (p.d || {}).dnote || '', 'الضبط، التوزيع العشوائي، مصادر التهديد للصدق الداخلي', 'area') + '</form>' + nextBtn(p, 'design');
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
        '</tbody></table></div><p class="vars-end"><button class="btn" type="button" id="addV">' + ic('plus') + 'ضيف متغير</button></p></div>' + advise(p) + nextBtn(p, 'variables');
      $('#addV').addEventListener('click', function () { p.vars.push({ name: '', role: p.vars.length ? 'dv' : 'iv', level: 'scale', groups: '', tool: '' }); touch(p); draw(); });
      $$('tr[data-i]', pane).forEach(function (tr) {
        var v = p.vars[+tr.getAttribute('data-i')];
        $$('[data-k]', tr).forEach(function (el) {
          el.addEventListener('change', function () { v[el.getAttribute('data-k')] = el.value; touch(p); draw(); });
        });
        $('[data-del]', tr).addEventListener('click', function () { p.vars.splice(+tr.getAttribute('data-i'), 1); touch(p); draw(); });
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
      return '<div class="kid-card"><span class="kid-av" aria-hidden="true">' + esc(String(k.child || '').trim().charAt(0)) + '</span><div><h2>' + esc(k.child) + '</h2><p class="kid-meta"><span class="num">' + esc(k.age) + '</span> سنين · ' + esc(k.grade) + '</p><p class="small kid-consent">موافقة ولي الأمر: ' + esc(k.guardian) + ' · ' + fmtDate(k.date) + '</p><span class="tag soon-tag">الأنشطة قريباً</span></div></div>';
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
    if (!V[r]) r = 'home';
    drawNav(r === 'project' ? 'projects' : r);
    V[r](parts[1], parts[2]);
    document.title = BRAND + ' — منصة البحث وتنمية القدرات';
    if (route.ready) { main.focus({ preventScroll: true }); window.scrollTo(0, 0); }
    route.ready = true;
  }
  window.addEventListener('hashchange', route);
  route();
})();
