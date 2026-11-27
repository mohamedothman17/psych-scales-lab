/* Theories library: index, theory pages, theory-to-activity map, "which theory explains this?" practice,
   and applied models as fill-in training templates. Content lives in data/theories*.js. */
(function () {
  'use strict';
  var H = window.Hub, esc = H.esc, $ = H.$, $$ = H.$$;
  var FILES = ['data/theories.js', 'data/theories-2.js', 'data/theories-extra.js'];
  var T = null, BY = {}, ORDER = [], loading = null;
  var filt = { fam: '', ev: '', q: '' }, mapSt = { skill: '', q: '' }, editing = {}, drafts = {};

  var SHORT = { piaget: 'بياجيه', vygotsky: 'فيجوتسكي', erikson: 'إريكسون', bronfenbrenner: 'النظم البيئية', attachment: 'التعلّق', bandura: 'باندورا',
    infoproc: 'معالجة المعلومات', baddeley: 'الذاكرة العاملة', ef: 'الوظائف التنفيذية', cogload: 'الحمل المعرفي', sdt: 'تقرير المصير', srl: 'التنظيم الذاتي',
    mindset: 'عقلية النمو', chc: 'كاتل-هورن-كارول', gardner: 'الذكاءات المتعددة', renzulli: 'الحلقات الثلاث' };
  /* Star positions: wide chart (1000 x 430) and tall chart for phones (400 x 560). */
  var POS = { piaget: [868, 96, 318, 62], vygotsky: [742, 58, 196, 96], erikson: [806, 196, 330, 150], bronfenbrenner: [920, 268, 236, 196], attachment: [716, 262, 344, 240],
    infoproc: [590, 110, 92, 52], baddeley: [508, 196, 60, 138], ef: [612, 300, 128, 206],
    bandura: [420, 62, 190, 300], cogload: [392, 330, 300, 340], srl: [316, 168, 84, 318],
    sdt: [196, 74, 250, 428], mindset: [118, 172, 342, 486],
    chc: [214, 290, 72, 416], gardner: [70, 318, 150, 506], renzulli: [150, 384, 52, 520] };
  var LINKS = [['piaget', 'vygotsky'], ['piaget', 'erikson'], ['erikson', 'bronfenbrenner'], ['erikson', 'attachment'], ['infoproc', 'baddeley'], ['baddeley', 'ef'],
    ['bandura', 'srl'], ['srl', 'cogload'], ['sdt', 'mindset'], ['chc', 'gardner'], ['chc', 'renzulli']];

  /* ---------- data ---------- */
  function need(done) {
    if (T) return done(true);
    if (loading) { loading.push(done); return; }
    loading = [done];
    var left = FILES.length, bad = false;
    function end() {
      if (--left) return;
      var q = loading; loading = null;
      if (!bad && window.HubTheories && window.HubTheories.models && window.HubTheories.list.length) index(window.HubTheories);
      q.forEach(function (f) { f(!!T); });
    }
    FILES.forEach(function (src) {
      var s = document.createElement('script'); s.src = src; s.async = false;
      s.onload = end; s.onerror = function () { bad = true; s.remove(); end(); };
      document.head.appendChild(s);
    });
  }
  function index(data) {
    T = data; BY = {}; ORDER = [];
    T.families.forEach(function (f) { T.list.forEach(function (t) { if (t.family === f.id) ORDER.push(t); }); });
    ORDER.forEach(function (t, i) { t.no = (i < 9 ? '0' : '') + (i + 1); BY[t.id] = t; });
  }
  function store() {
    var d = H.data('theories');
    if (d.v !== 1) { d.v = 1; d.quiz = {}; d.forms = {}; }
    if (!d.quiz || typeof d.quiz !== 'object') d.quiz = {};
    if (!d.forms || typeof d.forms !== 'object') d.forms = {};
    return d;
  }
  function fam(id) { return T.families.filter(function (f) { return f.id === id; })[0] || T.families[0]; }
  function ev(id) { return T.evidence.filter(function (e) { return e.id === id; })[0] || T.evidence[3]; }
  function skill(id) { return T.skills.filter(function (s) { return s.id === id; })[0]; }
  function norm(s) {
    return String(s || '').toLowerCase().replace(/[ً-ْٰـ]/g, '').replace(/[أإآ]/g, 'ا').replace(/ة/g, 'ه').replace(/ى/g, 'ي').replace(/[^a-z0-9ء-ي]+/g, ' ').trim();
  }
  function ltr(s) { return '<bdi dir="ltr" lang="en">' + esc(s) + '</bdi>'; }

  /* ---------- drawing ---------- */
  /* Evidence mark: four growth rings, as many solid as the evidence level. Always shown with its label in words. */
  function rings(level, cls) {
    var out = '<svg class="mth-rings' + (cls ? ' ' + cls : '') + '" viewBox="-20 -20 40 40" aria-hidden="true" focusable="false">';
    for (var i = 4; i >= 1; i--) out += '<circle r="' + (i * 4.2 + 1) + '" class="' + (i <= level ? 'on' : 'off') + '"/>';
    return out + '<circle r="1.8" class="dot"/></svg>';
  }
  function evMark(status) { var e = ev(status); return '<span class="mth-ev" data-ev="' + e.level + '">' + rings(e.level) + '<span>' + esc(e.id) + '</span></span>'; }
  function star(r) { var k = Math.round(r * 15) / 100; return 'M0 ' + -r + 'Q' + k + ' ' + -k + ' ' + r + ' 0Q' + k + ' ' + k + ' 0 ' + r + 'Q' + -k + ' ' + k + ' ' + -r + ' 0Q' + -k + ' ' + -k + ' 0 ' + -r + 'Z'; }
  function chart() {
    var tall = window.matchMedia && window.matchMedia('(max-width:700px)').matches, o = tall ? 2 : 0, w = tall ? 400 : 1000, h = tall ? 560 : 430;
    var s = '<svg class="mth-chart' + (tall ? ' tall' : '') + '" viewBox="0 0 ' + w + ' ' + h + '" role="group" aria-label="خريطة النظريات: كل نجمة نظرية، وكل مجموعة عيلة">';
    for (var g = 1; g < 5; g++) s += '<path class="grid" d="M0 ' + (h * g / 5) + 'Q' + w / 2 + ' ' + (h * g / 5 - 46) + ' ' + w + ' ' + (h * g / 5) + '"/>';
    LINKS.forEach(function (l) { var a = POS[l[0]], b = POS[l[1]]; s += '<line class="link" data-a="' + l[0] + '" data-b="' + l[1] + '" x1="' + a[o] + '" y1="' + a[o + 1] + '" x2="' + b[o] + '" y2="' + b[o + 1] + '"/>'; });
    ORDER.forEach(function (t, i) {
      var p = POS[t.id], f = fam(t.family), big = ev(t.evidence.status).level;
      s += '<a class="mth-star t-' + f.tone + '" href="#theories/t/' + t.id + '" data-id="' + t.id + '" aria-label="' + esc(t.title.ar + '، ' + t.evidence.status) + '">' +
        '<g transform="translate(' + p[o] + ' ' + p[o + 1] + ')"><circle class="hit" r="' + (tall ? 27 : 30) + '"/><circle class="halo" r="' + (9 + big * 3) + '"/>' +
        '<path class="pt" data-tw="' + (i % 5) + '" d="' + star(7 + big * 2) + '"/>' +
        '<text class="no" y="-' + (16 + big * 2) + '" text-anchor="middle">' + t.no + '</text>' +
        '<text class="nm" y="' + (30 + big * 2) + '" text-anchor="middle">' + esc(SHORT[t.id]) + '</text></g></a>';
    });
    return s + '</svg>';
  }
  var GLYPH = {
    map: '<svg viewBox="0 0 120 60" aria-hidden="true"><path d="M10 30h100" /><circle cx="10" cy="30" r="7" class="f"/><circle cx="43" cy="30" r="7"/><circle cx="77" cy="30" r="7"/><circle cx="110" cy="30" r="7" class="f"/><path d="m56 24 6 6-6 6M90 24l6 6-6 6M23 24l6 6-6 6"/></svg>',
    quiz: '<svg viewBox="0 0 120 60" aria-hidden="true"><circle cx="30" cy="30" r="20"/><circle cx="62" cy="30" r="20"/><circle cx="94" cy="30" r="20" class="f"/></svg>',
    models: '<svg viewBox="0 0 120 60" aria-hidden="true"><path d="M8 54h22V42h22V30h22V18h22V6h16"/><circle cx="19" cy="34" r="4" class="f"/></svg>'
  };
  function subnav(cur) {
    var items = [['', 'المكتبة'], ['map', 'دوّر بالنشاط'], ['quiz', 'أنهي نظرية؟'], ['models', 'نماذج تطبيقية']];
    return '<nav class="mth-sub mth-noprint" aria-label="أجزاء المكتبة">' + items.map(function (x) {
      return '<a href="#theories' + (x[0] ? '/' + x[0] : '') + '"' + (x[0] === cur ? ' aria-current="page"' : '') + '>' + x[1] + '</a>';
    }).join('') + '</nav>';
  }

  /* ---------- library home ---------- */
  function matches(t) {
    if (filt.fam && t.family !== filt.fam) return false;
    if (filt.ev && t.evidence.status !== filt.ev) return false;
    if (filt.q) { var q = norm(filt.q); if (q && norm(t.title.ar + ' ' + t.title.en + ' ' + t.theorists.join(' ') + ' ' + SHORT[t.id]).indexOf(q) < 0) return false; }
    return true;
  }
  function home(main) {
    var n = ORDER.length, acts = 0; ORDER.forEach(function (t) { acts += t.activities.length; });
    var h = '<header class="head mth-head"><p class="mth-kicker">مكتبة النظريات النفسية</p>' +
      '<h1 class="mega"><span class="num">' + n + '</span> نظرية <em>تشتغل بيها</em> مش تحفظها</h1>' +
      '<p class="lead">كل نظرية هنا معاها: دليلها قوي قد إيه، نقدها، مثال من الحياة، وأنشطة تتعمل في البيت أو الفصل مع حدود تفسيرها. مفيش حاجة هنا تشخيص ولا اختبار ذكاء.</p></header>';
    h += '<div class="mth-top"><section class="mth-sky" aria-label="خريطة النظريات"><div class="mth-sky-in">' + chart() +
      '<p class="mth-sky-note">حجم النجمة على قد قوة الدليل. دوس على أي نجمة تفتح نظريتها.</p></div></section>' +
      '<div class="mth-doors">' +
      '<a class="block sun mth-door" href="#theories/map"><span class="block-label">' + acts + ' نشاط من ' + n + ' نظرية</span><strong>دوّر بالنشاط أو بالمهارة</strong>' + GLYPH.map + '</a>' +
      '<a class="block violet mth-door" href="#theories/quiz"><span class="block-label">' + T.vignettes.length + ' موقف قصير</span><strong>أنهي نظرية بتفسّر الحالة دي؟</strong>' + GLYPH.quiz + '</a>' +
      '<a class="block coral mth-door" href="#theories/models"><span class="block-label">' + T.models.length + ' قوالب تتملي وتتطبع</span><strong>نماذج تطبيقية للتدريب</strong>' + GLYPH.models + '</a>' +
      '</div></div>';
    h += '<section class="mth-find" aria-label="تصفية النظريات"><div class="mth-search"><label for="mth-q">دوّر باسم النظرية أو صاحبها، بالعربي أو الإنجليزي</label>' +
      '<input type="text" id="mth-q" inputmode="search" autocomplete="off" value="' + esc(filt.q) + '" placeholder="مثال: Piaget أو التعلّق"></div>' +
      '<div class="mth-fgroup" role="group" aria-label="العيلة"><span class="mth-flabel">العيلة</span>' +
      chipSet('fam', [['', 'الكل']].concat(T.families.map(function (f) { return [f.id, f.id]; })), filt.fam) + '</div>' +
      '<div class="mth-fgroup" role="group" aria-label="قوة الدليل"><span class="mth-flabel">قوة الدليل</span>' +
      chipSet('ev', [['', 'الكل']].concat(T.evidence.map(function (e) { return [e.id, e.id, rings(e.level)]; })), filt.ev) + '</div>' +
      '<p class="mth-count" id="mth-count" role="status"></p></section>';
    T.families.forEach(function (f, i) {
      var list = ORDER.filter(function (t) { return t.family === f.id; });
      h += '<section class="mth-fam' + (i % 2 ? ' flip' : '') + '" data-fam="' + esc(f.id) + '"><div class="block ' + f.tone + ' mth-famhead"><span class="block-label">عيلة</span><h2 class="block-title">' + esc(f.id) + '</h2><p>' + esc(f.say) + '</p>' +
        '<span class="mth-famn num" aria-hidden="true">' + list.length + '</span></div><ol class="mth-list">' +
        list.map(function (t) {
          return '<li data-id="' + t.id + '"><a class="mth-row" href="#theories/t/' + t.id + '"><span class="mth-no num">' + t.no + '</span>' +
            '<span class="mth-ttl"><strong>' + esc(t.title.ar) + '</strong><span class="mth-en">' + ltr(t.title.en) + '</span><span class="mth-who">' + esc(t.theorists.map(function (x) { return x.split(' (')[0]; }).join('، ')) + '</span></span>' +
            evMark(t.evidence.status) + '</a></li>';
        }).join('') + '</ol></section>';
    });
    h += '<p class="mth-none" id="mth-none" hidden>مفيش نظرية بالمواصفات دي. <button type="button" class="btn" id="mth-clear">امسح التصفية</button></p>' + legend();
    main.innerHTML = h;
    function apply() {
      var shown = 0;
      ORDER.forEach(function (t) {
        var ok = matches(t); if (ok) shown++;
        var li = $('.mth-list li[data-id="' + t.id + '"]', main); if (li) li.hidden = !ok;
        var st = $('.mth-star[data-id="' + t.id + '"]', main); if (st) st.classList.toggle('dim', !ok);
      });
      $$('.mth-fam', main).forEach(function (s) { s.hidden = !$$('li', s).some(function (li) { return !li.hidden; }); });
      $$('.mth-chart .link', main).forEach(function (l) { l.classList.toggle('dim', !(matches(BY[l.getAttribute('data-a')]) && matches(BY[l.getAttribute('data-b')]))); });
      $('#mth-count', main).textContent = shown === n ? 'كل النظريات ظاهرة: ' + n : 'ظاهر ' + shown + ' من ' + n;
      $('#mth-none', main).hidden = shown > 0;
      $$('.mth-chips button', main).forEach(function (b) { b.setAttribute('aria-pressed', String(filt[b.getAttribute('data-g')] === b.getAttribute('data-v'))); });
    }
    main.addEventListener('click', function (e) {
      var b = e.target.closest && e.target.closest('.mth-chips button');
      if (b && main.contains(b) && filt.hasOwnProperty(b.getAttribute('data-g'))) { filt[b.getAttribute('data-g')] = b.getAttribute('data-v'); apply(); }
      if (e.target.id === 'mth-clear') { filt.fam = filt.ev = filt.q = ''; $('#mth-q', main).value = ''; apply(); $('#mth-q', main).focus(); }
    });
    $('#mth-q', main).addEventListener('input', function () { filt.q = this.value; apply(); });
    apply();
  }
  function chipSet(group, list, cur) {
    return '<div class="mth-chips">' + list.map(function (x) {
      return '<button type="button" data-g="' + group + '" data-v="' + esc(x[0]) + '" aria-pressed="' + (x[0] === cur) + '">' + (x[2] || '') + '<span>' + esc(x[1]) + '</span></button>';
    }).join('') + '</div>';
  }
  function legend() {
    return '<section class="mth-legend" aria-labelledby="mth-leg-h"><h2 id="mth-leg-h">علامة قوة الدليل بتتقري إزاي؟</h2><dl>' + T.evidence.map(function (e) {
      return '<div><dt>' + rings(e.level) + esc(e.id) + '</dt><dd>' + esc(e.say) + '</dd></div>';
    }).join('') + '</dl><p class="small muted">التقدير ده حكم تحريري مبني على الصورة العامة في المراجع الأساسية، ولسه محتاج مراجعة متخصص. مش حكم نهائي على النظرية.</p></section>';
  }

  /* ---------- theory page ---------- */
  function chain(t, a) {
    var steps = [['النظرية', t.title.ar], ['المفهوم', a.construct], ['السلوك اللي يتلاحظ', a.observe], ['النشاط', a.name], ['البيانات', a.data], ['حدود التفسير', a.limits]];
    return '<ol class="mth-chain" aria-label="من النظرية لحدود التفسير">' + steps.map(function (s, i) {
      return '<li class="k' + i + '"><span class="mth-step num" aria-hidden="true">' + (i + 1) + '</span><span class="mth-k">' + s[0] + '</span><span class="mth-v">' + esc(s[1]) + '</span></li>';
    }).join('') + '</ol>';
  }
  function activity(t, a, withTheory) {
    return '<article class="mth-act"><header><h3>' + esc(a.name) + '</h3><p class="mth-actmeta"><span class="num">' + esc(a.age) + '</span>' +
      a.skills.map(function (s) { var k = skill(s); return k ? '<a href="#theories/map/' + k.id + '">' + esc(k.ar) + '</a>' : ''; }).join('') +
      (withTheory ? '<a class="mth-from" href="#theories/t/' + t.id + '">من: ' + esc(SHORT[t.id]) + '</a>' : '') + '</p></header>' +
      '<p class="mth-how"><strong>تتعمل إزاي: </strong>' + esc(a.how) + '</p>' + chain(t, a) + '</article>';
  }
  function tlink(id, note) {
    var o = BY[id]; if (!o) return '';
    return '<li><a href="#theories/t/' + o.id + '"><span class="num">' + o.no + '</span><strong>' + esc(o.title.ar) + '</strong>' + (note ? '<small>' + note + '</small>' : '') + H.ic('fwd') + '</a></li>';
  }
  function ul(list) { return '<ul class="mth-ul">' + list.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul>'; }
  function theory(main, id) {
    var t = BY[id];
    if (!t) { main.innerHTML = subnav('') + '<header class="head"><h1>النظرية دي مش موجودة</h1><p class="lead">ممكن الرابط يكون اتغيّر.</p><p><a class="btn primary" href="#theories">ارجع للمكتبة</a></p></header>'; return; }
    var f = fam(t.family), e = ev(t.evidence.status), i = ORDER.indexOf(t), prev = ORDER[i - 1], next = ORDER[i + 1];
    var unverified = t.refs.some(function (r) { return !r.verified; });
    var h = subnav('') + '<article class="mth-page">' +
      '<div class="mth-hero"><header class="block ' + f.tone + ' mth-title"><p class="block-label"><span class="num">' + t.no + '</span> · عيلة ' + esc(f.id) + '</p>' +
      '<h1>' + esc(t.title.ar) + '</h1><p class="mth-en">' + ltr(t.title.en) + '</p>' +
      '<p class="mth-by">' + esc(t.theorists.join('، ')) + '</p><p class="mth-period">' + esc(t.period) + '</p></header>' +
      '<aside class="mth-evbox" data-ev="' + e.level + '" aria-labelledby="mth-ev-h">' + rings(e.level, 'big') + '<p class="mth-evk" id="mth-ev-h">قوة الدليل</p><p class="mth-evv">' + esc(e.id) + '</p>' +
      '<p class="mth-evsay">' + esc(e.say) + '</p><p>' + esc(t.evidence.why) + '</p>' +
      '<details><summary>الدرجات الأربعة معناها إيه؟</summary><dl>' + T.evidence.map(function (x) { return '<div><dt>' + rings(x.level) + esc(x.id) + '</dt><dd>' + esc(x.say) + '</dd></div>'; }).join('') + '</dl></details></aside></div>';
    h += '<section class="mth-core"><h2>الفكرة الأساسية</h2><p>' + esc(t.core) + '</p></section>';
    h += '<section class="mth-ex"><h2>من الحياة</h2><p>' + esc(t.example) + '</p></section>';
    h += '<section class="mth-sec"><h2>المفاهيم الأساسية</h2><dl class="mth-dl">' + t.concepts.map(function (c) { return '<div><dt>' + esc(c.t) + '</dt><dd>' + esc(c.d) + '</dd></div>'; }).join('') + '</dl></section>';
    if (t.parts) h += '<section class="mth-sec"><h2>' + esc(t.parts.label) + '</h2><' + (t.parts.ordered ? 'ol' : 'ul') + ' class="mth-parts' + (t.parts.ordered ? ' ord' : '') + '">' +
      t.parts.items.map(function (p, k) { return '<li><span class="mth-pn num" aria-hidden="true">' + (t.parts.ordered ? k + 1 : '') + '</span><strong>' + esc(p.t) + '</strong><span>' + esc(p.d) + '</span></li>'; }).join('') + '</' + (t.parts.ordered ? 'ol' : 'ul') + '></section>';
    h += '<div class="mth-two"><section class="mth-sec"><h2>بتفترض إيه؟</h2>' + ul(t.assumptions) + '</section><section class="mth-sec"><h2>بتتطبّق في إيه؟</h2>' + ul(t.applications) +
      '<p class="mth-ctx"><strong>السن أو السياق: </strong>' + esc(t.context) + '</p></section></div>';
    h += '<section class="mth-sec mth-acts"><h2>من النظرية للنشاط</h2><p class="muted">كل نشاط ماشي على نفس السلسلة، وآخر حلقة فيها دايماً حدود التفسير. الأنشطة دي للملاحظة والدعم، مش اختبارات.</p>' +
      t.activities.map(function (a) { return activity(t, a, false); }).join('') + '</section>';
    h += '<div class="mth-two"><section class="mth-sec"><h2>مفاهيمها بتتقاس إزاي؟</h2>' + ul(t.measures) +
      '<p class="small muted">الأدوات المذكورة أجنبية الأصل. وجود ترجمة عربية ليها مش معناه إنها متقنّنة على البيئة المصرية أو العربية: راجع دراسات التقنين قبل أي استخدام.</p></section>' +
      '<section class="mth-sec mth-crit"><h2>النقد</h2>' + ul(t.criticisms) + '</section></div>';
    h += '<section class="mth-sec mth-rel"><h2>نظريات قريبة ونظريات بتختلف معاها</h2><div class="mth-two">' +
      '<div><h3>قريبة أو مكمّلة</h3>' + (t.related.length ? '<ul class="mth-links">' + t.related.map(function (x) { return tlink(x); }).join('') + '</ul>' : '<p class="muted">مفيش في المكتبة حالياً.</p>') + '</div>' +
      '<div><h3>بتفسّر بشكل مختلف</h3>' + (t.opposing.length ? '<ul class="mth-links opp">' + t.opposing.map(function (x) { return tlink(x); }).join('') + '</ul>' : '<p class="muted">مفيش نظرية في المكتبة حالياً بتعارضها بشكل مباشر.</p>') + '</div></div></section>';
    h += '<section class="mth-sec mth-refs"><h2>المراجع الأساسية</h2>' + (unverified ? '<p class="mth-warn" role="note">' + H.ic('clock') + '<span>المراجع لسه متراجعتش من مصدرها. اتأكد من بيانات أي مرجع قبل ما تستشهد بيه.</span></p>' : '') +
      '<ul>' + t.refs.map(function (r) { return '<li><span dir="ltr" lang="en">' + esc(r.authors) + ' (' + esc(r.year) + ').</span> <cite><bdi>' + esc(r.title) + '</bdi></cite>' + (r.verified ? '' : ' <span class="mth-unv">لسه متراجعش</span>') + '</li>'; }).join('') + '</ul></section>';
    h += '<nav class="mth-pager mth-noprint" aria-label="نظريات تانية">' + (prev ? '<a href="#theories/t/' + prev.id + '">' + H.ic('back') + '<span><small>اللي قبلها</small>' + esc(SHORT[prev.id]) + '</span></a>' : '<span></span>') +
      (next ? '<a class="nx" href="#theories/t/' + next.id + '"><span><small>اللي بعدها</small>' + esc(SHORT[next.id]) + '</span>' + H.ic('fwd') + '</a>' : '<span></span>') + '</nav></article>';
    main.innerHTML = h;
  }

  /* ---------- cross-library activity map ---------- */
  function allActs() { var out = []; ORDER.forEach(function (t) { t.activities.forEach(function (a) { out.push({ t: t, a: a }); }); }); return out; }
  function mapView(main, sk) {
    if (sk !== undefined) mapSt.skill = skill(sk) ? sk : '';
    var acts = allActs();
    var h = subnav('map') + '<header class="head"><h1 class="mega">دوّر <em>بالنشاط</em> أو بالمهارة</h1>' +
      '<p class="lead">' + acts.length + ' نشاط من كل النظريات في مكان واحد. اختار مهارة، وشوف كل نشاط جاي من أنهي نظرية ولأنهي سن.</p></header>' +
      '<section class="mth-find" aria-label="تصفية الأنشطة"><div class="mth-search"><label for="mth-aq">دوّر في اسم النشاط أو المفهوم</label><input type="text" id="mth-aq" autocomplete="off" value="' + esc(mapSt.q) + '" placeholder="مثال: الأرقام بالعكس"></div>' +
      '<div class="mth-fgroup" role="group" aria-label="المهارة"><span class="mth-flabel">المهارة</span>' +
      chipSet('skill', [['', 'الكل']].concat(T.skills.map(function (s) { return [s.id, s.ar]; })), mapSt.skill) + '</div><p class="mth-count" id="mth-acount" role="status"></p></section>' +
      '<div id="mth-alist" class="mth-alist"></div>' +
      '<p class="mth-foot-note">الأنشطة دي أدوات ملاحظة ودعم. ولا واحد منها اختبار مقنّن، ومفيش منها درجة تتقارن بأطفال تانيين.</p>';
    main.innerHTML = h;
    function draw() {
      var q = norm(mapSt.q), list = acts.filter(function (x) {
        if (mapSt.skill && x.a.skills.indexOf(mapSt.skill) < 0) return false;
        return !q || norm(x.a.name + ' ' + x.a.construct + ' ' + x.t.title.ar + ' ' + x.t.title.en).indexOf(q) > -1;
      });
      var k = skill(mapSt.skill);
      $('#mth-acount', main).textContent = (k ? k.ar + ': ' : '') + (list.length ? H.plural(list.length, 'نشاط واحد', 'نشاطين', 'أنشطة', 'نشاط') : 'مفيش نشاط بالمواصفات دي');
      $('#mth-alist', main).innerHTML = list.map(function (x) {
        return '<details class="mth-arow"><summary><span class="mth-aname"><strong>' + esc(x.a.name) + '</strong><span>' + esc(x.a.construct) + '</span></span>' +
          '<span class="mth-aage num">' + esc(x.a.age) + '</span><span class="mth-ath t-' + fam(x.t.family).tone + '">' + esc(SHORT[x.t.id]) + '</span>' + H.ic('plus') + '</summary>' +
          '<div class="mth-abody">' + activity(x.t, x.a, true) + '</div></details>';
      }).join('');
      $$('.mth-chips button', main).forEach(function (b) { b.setAttribute('aria-pressed', String(mapSt.skill === b.getAttribute('data-v'))); });
    }
    main.addEventListener('click', function (e) {
      var b = e.target.closest && e.target.closest('.mth-chips button');
      if (b && main.contains(b) && b.getAttribute('data-g') === 'skill') { mapSt.skill = b.getAttribute('data-v'); draw(); }
    });
    $('#mth-aq', main).addEventListener('input', function () { mapSt.q = this.value; draw(); });
    draw();
  }

  /* ---------- which theory explains this? ---------- */
  function quizStats() {
    var q = store().quiz, tried = 0, right = 0, attempts = 0, correct = 0;
    T.vignettes.forEach(function (v) { var r = q[v.id]; if (r && r[0] > 0) { tried++; attempts += r[0]; correct += r[1]; if (r[1] > 0) right++; } });
    return { tried: tried, right: right, attempts: attempts, correct: correct };
  }
  function quiz(main, at) {
    var V = T.vignettes, n = Math.min(V.length, Math.max(1, parseInt(at, 10) || firstOpen())), v = V[n - 1], d = store(), picked = null;
    function firstOpen() { var q = store().quiz; for (var i = 0; i < V.length; i++) if (!q[V[i].id]) return i + 1; return 1; }
    function progress() {
      var s = quizStats(), q = d.quiz;
      return '<section class="mth-prog" aria-label="تقدّمك"><ol class="mth-dots">' + V.map(function (x, i) {
        var r = q[x.id], st = !r ? 'new' : r[1] > 0 ? 'ok' : 'try', lab = !r ? 'لسه' : r[1] > 0 ? 'اتجاوب صح' : 'اتجرّب';
        return '<li><a href="#theories/quiz/' + (i + 1) + '" class="' + st + '"' + (i + 1 === n ? ' aria-current="step"' : '') + '><span class="num">' + (i + 1) + '</span><span class="sr"> ' + lab + '</span></a></li>';
      }).join('') + '</ol><p class="mth-progline" id="mth-progline">' + (s.attempts ? 'جرّبت <b class="num">' + s.tried + '</b> من <b class="num">' + V.length + '</b> موقف · <b class="num">' + s.attempts + '</b> محاولة · <b class="num">' + s.correct + '</b> منها صح' : 'لسه مجاوبتش على أي موقف. الأرقام هنا بتاعتك إنت بس، ومحفوظة على جهازك.') + '</p></section>';
    }
    function body() {
      var r = d.quiz[v.id], h = '<section class="mth-vig"><p class="mth-vno">موقف <span class="num">' + n + '</span> من <span class="num">' + V.length + '</span>' +
        (r ? ' · محاولاتك هنا: <span class="num" id="mth-vtries">' + r[0] + '</span>، صح: <span class="num" id="mth-vok">' + r[1] + '</span>' : '') + '</p>' +
        '<blockquote id="mth-vtext">' + esc(v.text) + '</blockquote><h2 id="mth-vq">أنهي نظرية أقرب لتفسير الموقف ده؟</h2><div class="mth-opts" role="group" aria-labelledby="mth-vq">' +
        v.options.map(function (o) {
          var t = BY[o], cls = picked ? (o === v.answer ? ' right' : o === picked ? ' wrong' : '') : '';
          return '<button type="button" class="mth-opt' + cls + '" data-o="' + o + '"' + (picked ? ' disabled' : '') + '><strong>' + esc(t.title.ar) + '</strong><span>' + ltr(t.title.en) + '</span>' +
            (picked && o === v.answer ? '<em>الأقرب</em>' : picked && o === picked ? '<em>اختيارك</em>' : '') + '</button>';
        }).join('') + '</div>';
      if (picked) {
        var good = picked === v.answer;
        h += '<div class="mth-fb ' + (good ? 'good' : 'miss') + '" id="mth-fb" tabindex="-1"><h3>' + (good ? 'ده الأقرب فعلاً' : 'مش الأقرب هنا') + '</h3><p>' + esc(v.why) + '</p>' +
          '<h4>نظريتين قدام نفس الموقف</h4><div class="mth-vs">' + v.contrast.map(function (c) {
            var t = BY[c.id]; return '<div><p class="mth-vsh"><a href="#theories/t/' + t.id + '">' + esc(SHORT[t.id]) + '</a> هتتوقع</p><p>' + esc(c.says) + '</p></div>';
          }).join('') + '</div><p class="small">الموقف مكتوب للتدريب. في الواقع أكتر من نظرية بتشرح جزء من نفس الحالة، والحكم بيحتاج معلومات أكتر من فقرة.</p>' +
          '<p class="row">' + (n < V.length ? '<a class="btn primary" href="#theories/quiz/' + (n + 1) + '">الموقف اللي بعده</a>' : '<a class="btn primary" href="#theories">خلّصت المواقف: ارجع للمكتبة</a>') +
          '<button type="button" class="btn" id="mth-again">جرّب تاني</button></p></div>';
      }
      return h + '</section>';
    }
    function draw(focus) {
      main.innerHTML = subnav('quiz') + '<header class="head"><h1 class="mega">أنهي نظرية <em>بتفسّر</em> الحالة دي؟</h1>' +
        '<p class="lead">مواقف قصيرة من البيت والفصل. اختار الأقرب، وشوف نظريتين مختلفتين كانوا هيتوقعوا إيه.</p></header>' + progress() + body() +
        (quizStats().attempts ? '<p class="mth-reset"><button type="button" class="btn danger" id="mth-reset">امسح تقدّمي</button></p>' : '');
      if (focus) { var f = $('#mth-fb', main); if (f) f.focus(); }
    }
    main.onclick = function (e) {
      var b = e.target.closest && e.target.closest('.mth-opt');
      if (b && !picked) {
        picked = b.getAttribute('data-o');
        var r = d.quiz[v.id] || [0, 0]; r[0]++; if (picked === v.answer) r[1]++; d.quiz[v.id] = r; H.save(); draw(true);
      } else if (e.target.id === 'mth-again') { picked = null; draw(); var o = $('.mth-opt', main); if (o) o.focus(); }
      else if (e.target.id === 'mth-reset') {
        if (window.confirm('تمسح كل محاولاتك في المواقف؟')) { d.quiz = {}; H.save(); picked = null; draw(); H.toast('اتمسح'); }
      }
    };
    draw();
  }

  /* ---------- applied models ---------- */
  function daCalc(max, pre, post) {
    if ([max, pre, post].some(function (x) { return x === '' || x == null || !isFinite(+x); })) return null;
    max = +max; pre = +pre; post = +post;
    if (max <= 0 || pre < 0 || post < 0 || pre > max || post > max) return { err: 'راجع الأرقام: الدرجتين لازم يكونوا بين 0 وأقصى درجة.' };
    var gain = post - pre;
    return { gain: gain, norm: max > pre ? Math.round(gain / (max - pre) * 100) / 100 : null };
  }
  function zpdCalc(rows) {
    var c = [0, 0, 0, 0, 0], n = 0, sum = 0;
    rows.forEach(function (r) { if (/^[0-4]$/.test(String(r.level))) { c[+r.level]++; n++; sum += +r.level; } });
    return { n: n, counts: c, mean: n ? Math.round(sum / n * 100) / 100 : null };
  }
  function models(main) {
    main.innerHTML = subnav('models') + '<header class="head"><h1 class="mega">نماذج تطبيقية <em>للتدريب</em></h1>' +
      '<p class="lead">كل نموذج فيه حالة افتراضية تمشي معاها خطوة خطوة، وبعدها قالب فاضي تملاه، تطبعه، وتحفظه على جهازك.</p></header>' +
      '<p class="mth-warn big" role="note">' + H.ic('guide') + '<span>النماذج دي أدوات تدريب وتنظيم تفكير. مش أدوات تشخيص، ومفيش منها قرار عن طفل من غير متخصص مؤهل وتقييم كامل.</span></p>' +
      '<div class="mth-models">' + T.models.map(function (m, i) {
        var saved = (store().forms[m.id] || []).length;
        return '<a class="block ' + m.tone + ' mth-model m' + i + '" href="#theories/models/' + m.id + '"><span class="block-label">' + ltr(m.title.en) + '</span><strong>' + esc(m.title.ar) + '</strong><p>' + esc(m.say) + '</p>' +
          '<span class="mth-saved">' + (saved ? 'محفوظ عندك: <span class="num">' + saved + '</span>' : 'حالة افتراضية + قالب فاضي') + '</span></a>';
      }).join('') + '</div>';
  }
  function walk(m) {
    var w = m.walk, h = '<section class="mth-walk" aria-labelledby="mth-walk-h"><p class="mth-fict">حالة افتراضية للتدريب</p><h2 id="mth-walk-h">' + esc(w.who) + '</h2>';
    if (w.task) h += '<p class="mth-task">' + esc(w.task) + '</p>';
    if (m.id === 'zpd') {
      h += '<ol class="mth-ladder" id="mth-ladder">' + w.steps.map(function (s, i) {
        return '<li data-i="' + i + '"' + (i ? ' hidden' : '') + (s.ok ? ' class="hit"' : '') + '><span class="mth-rung num" aria-hidden="true">' + i + '</span><div><h3>' + esc(s.t) + '</h3><p class="mth-say">' + esc(s.d) + '</p><p class="mth-resp"><strong>اللي حصل: </strong>' + esc(s.r) + '</p>' +
          (s.ok ? '<p class="mth-hitnote">نجحت هنا. الدرجتين اللي فوق متعرضين عشان تشوف شكلهم بس.</p>' : '') + '</div></li>';
      }).join('') + '</ol><p class="row mth-noprint"><button type="button" class="btn primary" id="mth-up">لسه واقفة: اطلع درجة</button><button type="button" class="btn" id="mth-down" hidden>ابدأ من الأول</button></p>' +
        '<p class="mth-end" id="mth-wend" hidden>' + esc(w.end) + '</p>';
    } else if (w.steps) {
      h += '<ol class="mth-steps">' + w.steps.map(function (s, i) { return '<li><span class="mth-rung num" aria-hidden="true">' + (i + 1) + '</span><div><h3>' + esc(s.t) + '</h3><p>' + esc(s.d) + '</p></div></li>'; }).join('') + '</ol>';
    }
    if (w.table) h += '<div class="mth-tablewrap"><table class="mth-table"><thead><tr>' + w.table.head.map(function (x) { return '<th scope="col">' + esc(x) + '</th>'; }).join('') + '</tr></thead><tbody>' +
      w.table.rows.map(function (r) { return '<tr>' + r.map(function (c, i) { return '<td data-h="' + esc(w.table.head[i]) + '">' + esc(c) + '</td>'; }).join('') + '</tr>'; }).join('') + '</tbody></table></div>';
    if (w.list) h += '<dl class="mth-dl five">' + w.list.map(function (x) { return '<div><dt>' + esc(x.t) + '</dt><dd>' + esc(x.d) + '</dd></div>'; }).join('') + '</dl>';
    if (w.end && m.id !== 'zpd') h += '<p class="mth-end">' + esc(w.end) + '</p>';
    return h + '</section>';
  }
  function blank(m) { var r = { id: '', at: '', f: {}, rows: m.form.rows ? [{}] : [] }; return r; }
  function fieldHtml(x, val) { return '<div class="mth-f' + (x.type === 'area' ? ' wide' : '') + '">' + H.field('mth-f-' + x.k, x.label, val == null ? '' : val, x.hint, x.type) + '</div>'; }
  function rowHtml(m, r, i) {
    var R = m.form.rows;
    return '<fieldset class="mth-rowset" data-i="' + i + '"><legend>' + esc(R.label) + ' <span class="num">' + (i + 1) + '</span></legend>' + R.cols.map(function (c) {
      var id = 'mth-r-' + i + '-' + c.k, v = r[c.k] == null ? '' : r[c.k];
      return '<div class="mth-f"><label for="' + id + '">' + esc(c.label) + '</label>' + (c.opts ? '<select id="' + id + '" data-rk="' + c.k + '"><option value="">اختار…</option>' + H.opts(c.opts, String(v)) + '</select>' :
        '<textarea id="' + id + '" data-rk="' + c.k + '" rows="2">' + esc(v) + '</textarea>') + '</div>';
    }).join('') + '<button type="button" class="btn icon mth-del" data-del="' + i + '" aria-label="امسح ' + esc(R.label) + ' ' + (i + 1) + '">' + H.ic('trash') + '</button></fieldset>';
  }
  function model(main, id) {
    var m = T.models.filter(function (x) { return x.id === id; })[0];
    if (!m) return models(main);
    var d = store(); if (!Array.isArray(d.forms[id])) d.forms[id] = [];
    var rec = drafts[id] || blank(m);
    function read() {
      m.form.fields.concat(m.form.tail || []).forEach(function (x) { var el = $('#mth-f-' + x.k, main); if (el) rec.f[x.k] = el.value; });
      if (m.form.rows) rec.rows = $$('.mth-rowset', main).map(function (fs) { var o = {}; $$('[data-rk]', fs).forEach(function (el) { o[el.getAttribute('data-rk')] = el.value; }); return o; });
      drafts[id] = rec;
    }
    function result() {
      if (id === 'da') {
        var c = daCalc(rec.f.max, rec.f.pre, rec.f.post);
        if (!c) return '<p class="muted">اكتب أقصى درجة والدرجتين عشان يتحسب الكسب.</p>';
        if (c.err) return '<p class="mth-err">' + esc(c.err) + '</p>';
        return '<dl class="mth-out"><div><dt>الكسب</dt><dd class="num" id="mth-gain">' + c.gain + '</dd><dd class="small">البعدي − القبلي = ' + (+rec.f.post) + ' − ' + (+rec.f.pre) + '</dd></div>' +
          '<div><dt>الكسب النسبي</dt><dd class="num" id="mth-ngain">' + (c.norm == null ? 'لا يُحسب' : c.norm) + '</dd><dd class="small">' + (c.norm == null ? 'القبلي وصل لأقصى درجة، فمفيش مساحة تحسّن تتقاس.' : '(البعدي − القبلي) ÷ (الأقصى − القبلي)') + '</dd></div></dl>' +
          '<p class="small">الرقمين وصف للجلسة دي بس: مالهمش معايير، وما يتقارنوش بين أطفال أو مهام مختلفة.</p>';
      }
      if (id === 'zpd') {
        var z = zpdCalc(rec.rows);
        if (!z.n) return '<p class="muted">اختار درجة المساعدة لكل مهمة عشان يطلع الملخص.</p>';
        return '<dl class="mth-out"><div><dt>مهام مسجّلة</dt><dd class="num" id="mth-zn">' + z.n + '</dd></div><div><dt>متوسط درجة المساعدة</dt><dd class="num" id="mth-zmean">' + z.mean + '</dd><dd class="small">مجموع الدرجات ÷ عدد المهام، من 0 لـ 4</dd></div></dl>' +
          '<ol class="mth-bars" aria-label="عدد المهام عند كل درجة">' + z.counts.map(function (k, i) { return '<li><span class="num">' + i + '</span><span class="mth-bar"><i data-w="' + (k / z.n) + '"></i></span><span class="num">' + k + '</span></li>'; }).join('') + '</ol>';
      }
      return '';
    }
    function savedList() {
      var L = d.forms[id];
      if (!L.length) return '<p class="muted">لسه محفظتش حاجة. اللي بتحفظه بيفضل على الجهاز ده بس.</p>';
      return '<ul class="mth-savedlist">' + L.map(function (r) {
        return '<li><button type="button" class="mth-open" data-open="' + esc(r.id) + '"><strong>' + esc(r.f.code || 'من غير رمز') + '</strong><span class="num" dir="ltr">' + esc(r.at) + '</span></button>' +
          '<button type="button" class="btn icon" data-rm="' + esc(r.id) + '" aria-label="امسح المحفوظ ' + esc(r.f.code || '') + '">' + H.ic('trash') + '</button></li>';
      }).join('') + '</ul>';
    }
    function printout() {
      var F = m.form, h = '<h1>' + esc(m.title.ar) + '</h1><p>' + esc(H.today()) + ' · قالب تدريب وتنظيم معلومات، مش تشخيص.</p><dl>';
      F.fields.forEach(function (x) { h += '<dt>' + esc(x.label) + '</dt><dd>' + esc(rec.f[x.k] || '—') + '</dd>'; });
      h += '</dl>';
      if (F.rows) h += '<table><thead><tr><th>#</th>' + F.rows.cols.map(function (c) { return '<th>' + esc(c.label) + '</th>'; }).join('') + '</tr></thead><tbody>' + rec.rows.map(function (r, i) {
        return '<tr><td>' + (i + 1) + '</td>' + F.rows.cols.map(function (c) { return '<td>' + esc(r[c.k] || '—') + '</td>'; }).join('') + '</tr>'; }).join('') + '</tbody></table>';
      if (F.tail) { h += '<dl>'; F.tail.forEach(function (x) { h += '<dt>' + esc(x.label) + '</dt><dd>' + esc(rec.f[x.k] || '—') + '</dd>'; }); h += '</dl>'; }
      var c = id === 'da' ? daCalc(rec.f.max, rec.f.pre, rec.f.post) : null;
      if (c && !c.err) h += '<p>الكسب: ' + c.gain + (c.norm == null ? '' : ' · الكسب النسبي: ' + c.norm) + '</p>';
      var z = id === 'zpd' ? zpdCalc(rec.rows) : null;
      if (z && z.n) h += '<p>متوسط درجة المساعدة: ' + z.mean + ' (' + z.n + ' مهام)</p>';
      return h + '<p>' + esc(m.caution) + '</p>';
    }
    function bars() { $$('.mth-bar i', main).forEach(function (b) { b.style.setProperty('transform', 'scaleX(' + (+b.getAttribute('data-w') || 0) + ')'); }); }
    function draw() {
      var F = m.form, th = m.theory && BY[m.theory];
      main.innerHTML = subnav('models') + '<div class="mth-noprint"><header class="head"><p class="mth-kicker"><a href="#theories/models">نماذج تطبيقية</a> / ' + ltr(m.title.en) + '</p><h1>' + esc(m.title.ar) + '</h1><p class="lead">' + esc(m.say) + '</p>' +
        (th ? '<p class="small">مبني على: <a href="#theories/t/' + th.id + '">' + esc(th.title.ar) + '</a></p>' : '') + '</header>' +
        '<p class="mth-warn big" role="note">' + H.ic('guide') + '<span><strong>مش أداة تشخيص. </strong>' + esc(m.caution) + '</span></p>' + walk(m) +
        '<section class="mth-form" aria-labelledby="mth-form-h"><h2 id="mth-form-h">قالبك</h2><p class="muted">اكتب رمز بدل اسم الطفل. اللي بتكتبه بيتحفظ على الجهاز ده بس لما تدوس «احفظ».</p>' +
        '<form id="mth-f" novalidate><div class="mth-fields">' + F.fields.map(function (x) { return fieldHtml(x, rec.f[x.k]); }).join('') + '</div>' +
        (F.rows ? '<div id="mth-rows">' + rec.rows.map(function (r, i) { return rowHtml(m, r, i); }).join('') + '</div><p><button type="button" class="btn" id="mth-add">' + H.ic('plus') + esc(F.rows.add) + '</button></p>' : '') +
        (F.tail ? '<div class="mth-fields">' + F.tail.map(function (x) { return fieldHtml(x, rec.f[x.k]); }).join('') + '</div>' : '') +
        '<div class="mth-result" id="mth-result" role="status">' + result() + '</div>' +
        '<p class="row mth-actions"><button type="submit" class="btn primary">' + (rec.id ? 'احفظ التعديل' : 'احفظ على الجهاز') + '</button><button type="button" class="btn" id="mth-print">' + H.ic('print') + 'اطبع</button><button type="button" class="btn ghost" id="mth-new">قالب جديد فاضي</button></p></form></section>' +
        '<section class="mth-savedsec" aria-labelledby="mth-saved-h"><h2 id="mth-saved-h">المحفوظ عندك</h2><div id="mth-saved">' + savedList() + '</div></section></div>' +
        '<section class="mth-printout" id="mth-printout" aria-hidden="true"></section>';
      bars();
    }
    function refresh() { read(); $('#mth-result', main).innerHTML = result(); bars(); }
    main.oninput = function (e) { if (e.target.closest && e.target.closest('#mth-f')) refresh(); };
    main.onchange = main.oninput;
    main.onsubmit = function (e) {
      if (e.target.id !== 'mth-f') return;
      e.preventDefault(); read();
      var L = d.forms[id], copy = { id: rec.id || H.uid(), at: H.today(), f: rec.f, rows: rec.rows };
      var at = -1; L.forEach(function (r, i) { if (r.id === copy.id) at = i; });
      if (at > -1) L[at] = copy; else { L.unshift(copy); if (L.length > 30) L.length = 30; }
      rec = drafts[id] = JSON.parse(JSON.stringify(copy));
      if (H.save()) H.toast('اتحفظ');
      draw();
    };
    main.onclick = function (e) {
      var b = e.target.closest && e.target.closest('button'); if (!b || !main.contains(b)) return;
      if (b.id === 'mth-up') {
        var next = $('#mth-ladder li[hidden]', main);
        if (next) { next.hidden = false; if (!H.calm() && next.animate) next.animate([{ opacity: 0, transform: 'translateY(10px)' }, { opacity: 1, transform: 'none' }], { duration: 320, easing: 'cubic-bezier(.2,.8,.2,1)' }); }
        if (!$('#mth-ladder li[hidden]', main)) { b.hidden = true; $('#mth-wend', main).hidden = false; }
        $('#mth-down', main).hidden = false;
      } else if (b.id === 'mth-down') { read(); draw(); }
      else if (b.id === 'mth-add') { read(); rec.rows.push({}); draw(); var last = $$('.mth-rowset', main).pop(); if (last) $('textarea,select', last).focus(); }
      else if (b.hasAttribute('data-del')) { read(); rec.rows.splice(+b.getAttribute('data-del'), 1); if (!rec.rows.length) rec.rows.push({}); draw(); }
      else if (b.id === 'mth-print') { read(); $('#mth-printout', main).innerHTML = printout(); window.print(); }
      else if (b.id === 'mth-new') { rec = drafts[id] = blank(m); draw(); H.toast('قالب فاضي'); }
      else if (b.hasAttribute('data-open')) {
        var r = d.forms[id].filter(function (x) { return x.id === b.getAttribute('data-open'); })[0];
        if (r) { rec = drafts[id] = JSON.parse(JSON.stringify(r)); draw(); $('#mth-form-h', main).scrollIntoView(); }
      } else if (b.hasAttribute('data-rm')) {
        if (!window.confirm('تمسح المحفوظ ده من الجهاز؟')) return;
        d.forms[id] = d.forms[id].filter(function (x) { return x.id !== b.getAttribute('data-rm'); });
        if (rec.id === b.getAttribute('data-rm')) rec.id = '';
        H.save(); read(); draw(); H.toast('اتمسح');
      }
    };
    draw();
  }

  /* ---------- router ---------- */
  H.register('theories', function (main, a, b) {
    main.onclick = main.oninput = main.onchange = main.onsubmit = null;
    need(function (ok) {
      if ((location.hash || '').slice(1).split('/')[0] !== 'theories') return;
      if (!ok) { main.innerHTML = '<header class="head"><h1>مكتبة النظريات</h1><p class="lead">محتوى المكتبة ما اتحمّلش. اتأكد من النت وجرّب تاني.</p><p><a class="btn" href="#home">رجوع للرئيسية</a></p></header>'; return; }
      /* each view gets a fresh node so listeners from the previous view never pile up */
      var box = document.createElement('div'); box.className = 'mth'; main.innerHTML = ''; main.appendChild(box);
      if (a === 't') theory(box, b);
      else if (a === 'map') mapView(box, b || '');
      else if (a === 'quiz') quiz(box, b);
      else if (a === 'models') { if (b) model(box, b); else models(box); }
      else home(box);
    });
  });
  /* exposed for the end-to-end test: pure calculations only */
  H.theoriesCalc = { da: daCalc, zpd: zpdCalc };
})();
