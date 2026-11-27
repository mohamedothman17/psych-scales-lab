/* Hub app: hash router + local store. No dependencies. All user text is escaped through esc(). */
(function () {
  'use strict';
  var BRAND = 'مَلَكة';
  var LABS = {
    scales: 'https://mohamedothman17.github.io/psych-scales-lab/',
    stats: 'https://mohamedothman17.github.io/psych-stats-lab/'
  };
  var KEY = 'hub-v1';
  var main = document.getElementById('main');

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

  /* ---------- roles & nav ---------- */
  var ROLES = { researcher: 'باحث', specialist: 'أخصائي', parent: 'ولي أمر', student: 'طالب' };
  var NAV = [
    ['home', 'الرئيسية', null],
    ['projects', 'مشاريعي البحثية', ['researcher', 'student', 'specialist']],
    ['profile', 'ملفي', ['researcher', 'student', 'specialist']],
    ['family', 'أولادي', ['parent', 'specialist']],
    ['labs', 'المعامل', null]
  ];
  function drawNav(route) {
    document.getElementById('brandName').textContent = BRAND;
    document.getElementById('nav').innerHTML = NAV.filter(function (n) { return !n[2] || !S.role || n[2].indexOf(S.role) > -1; }).map(function (n) {
      return '<a href="#' + n[0] + '"' + (route === n[0] ? ' aria-current="page"' : '') + '>' + n[1] + '</a>';
    }).join('');
    document.getElementById('roleBtn').textContent = S.role ? 'أنا: ' + ROLES[S.role] : 'اختار دورك';
  }
  document.getElementById('roleBtn').addEventListener('click', function () { location.hash = '#role'; });

  /* ---------- views ---------- */
  var V = {};

  V.role = function () {
    var cards = [
      ['researcher', 'باحث', 'ماجستير أو دكتوراه أو باحث مستقل. عاوز تمشي بمشروعك من السؤال للتحليل.'],
      ['student', 'طالب', 'بتدرس علم نفس وعاوز تتعلم القياس والإحصاء وتجرّب مشروع صغير.'],
      ['specialist', 'أخصائي', 'بتتابع حالات أو أطفال، وعاوز أنشطة وخطط متابعة مبنية على أساس علمي.'],
      ['parent', 'ولي أمر', 'عاوز أنشطة تنمّي قدرات ابنك أو بنتك (من أولى لسادسة ابتدائي) وتتابع تقدّمه.']
    ];
    main.innerHTML = '<h1>إنت مين؟</h1><p class="muted">اختيارك بيحدد الأقسام اللي تظهر لك. تقدر تغيّره في أي وقت.</p><div class="grid">' + cards.map(function (c) {
      return '<button class="card" type="button" data-role="' + c[0] + '"><h2>' + c[1] + '</h2><p class="muted">' + c[2] + '</p>' + (S.role === c[0] ? '<span class="tag">اختيارك الحالي</span>' : '') + '</button>';
    }).join('') + '</div>';
    $$('[data-role]', main).forEach(function (b) { b.style.textAlign = 'start'; b.addEventListener('click', function () { S.role = b.getAttribute('data-role'); save(); location.hash = '#home'; }); });
  };

  V.home = function () {
    var r = S.role, h = '';
    h += '<section class="hero"><h1>' + esc(BRAND) + ': من القدرة للإنجاز</h1><p>منصة واحدة للباحث والأخصائي وولي الأمر. بتمشي معاك من أول سؤال لحد نتيجة تقدر تثبتها.</p>' +
      '<ol class="q"><li>أنا أقدر أبقى إيه؟</li><li>عندي إيه دلوقتي من قدرات ومهارات؟</li><li>أطوّر إيه بعد كده، وأثبت إزاي إني اتحسنت؟</li><li>أشتغل على أنهي بحث أو مشكلة حقيقية؟</li><li>إنجازاتي تفتح لي أنهي فرص؟</li></ol>' +
      (r ? '' : '<p><a class="btn primary" href="#role">ابدأ: اختار دورك</a></p>') + '</section>';
    if (r === 'researcher' || r === 'student' || r === 'specialist') {
      var n = S.projects.length, last = S.projects[0];
      h += '<div class="sec"><h2>شغلك</h2></div><div class="grid">' +
        '<a class="card" href="#projects"><h3>مشاريعي البحثية</h3><p class="muted">' + (n ? 'عندك ' + n + ' مشروع. آخر واحد: «' + esc(last.title || 'من غير عنوان') + '».' : 'لسه مفيش مشاريع. ابدأ أول مشروع وهنمشي معاك خطوة خطوة.') + '</p><span class="go">' + (n ? 'كمّل' : 'ابدأ مشروع') + ' ←</span></a>' +
        '<a class="card" href="#profile"><h3>ملفي كباحث</h3><p class="muted">' + (profileDone() + ' من ' + PF.length) + ' حقل مكتمل. كل ما الملف يكمل، الاقتراحات تبقى أدق.</p><span class="go">عدّل الملف ←</span></a></div>';
    }
    if (r === 'parent' || r === 'specialist') {
      h += '<div class="sec"><h2>الأطفال</h2></div><div class="grid"><a class="card" href="#family"><h3>' + (r === 'parent' ? 'أولادي' : 'الأطفال اللي بتابعهم') + '</h3><p class="muted">' + (S.kids.length ? 'مسجّل ' + S.kids.length + '.' : 'سجّل الطفل بموافقة ولي الأمر علشان تبدأ الأنشطة.') + '</p><span class="go">افتح ←</span></a></div>';
    }
    h += '<div class="sec"><h2>أقسام المنصة</h2></div><div class="grid">' + [
      ['مساحة المشروع البحثي', 'سؤالك، متغيراتك، تصميمك، وخطة التحليل في مكان واحد.', 'شغّال', '#projects'],
      ['مرشد الاختبار الإحصائي', 'بيقرا متغيرات مشروعك ويقولك أنهي اختبار وليه.', 'شغّال', '#projects'],
      ['معمل القياس ومعمل الإحصاء', 'الموقعين الأصليين، وبقوا معامل تابعة للمنصة.', 'شغّال', '#labs'],
      ['موافقة ولي الأمر وتسجيل الطفل', 'من أولى لسادسة ابتدائي.', 'شغّال', '#family'],
      ['مكتبة النظريات النفسية', 'كل نظرية بأدلتها ونقدها وأنشطتها.', 'قريباً', ''],
      ['ألعاب وأنشطة الأطفال', 'ذاكرة، انتباه، استدلال، مرونة، إبداع.', 'قريباً', ''],
      ['بحوث العمليات واتخاذ القرار', 'AHP، توزيع العينة، الميزانية مقابل القوة، الجدولة.', 'قريباً', ''],
      ['مستكشف الأدبيات والفرص', 'أبحاث حقيقية بروابطها، ومنح متراجعة بتاريخها.', 'قريباً', ''],
      ['التوجيه المهني والبورتفوليو', 'ميولك، مساراتك، وملف إنجازاتك.', 'قريباً', '']
    ].map(function (c) {
      var soon = c[2] !== 'شغّال', tag = '<span class="tag' + (soon ? ' soon' : '') + '">' + c[2] + '</span>';
      var body = '<h3>' + c[0] + '</h3><p class="muted">' + c[1] + '</p>' + tag;
      return soon ? '<div class="card">' + body + '</div>' : '<a class="card" href="' + c[3] + '">' + body + '</a>';
    }).join('') + '</div>';
    main.innerHTML = h;
  };

  V.labs = function () {
    main.innerHTML = '<h1>المعامل</h1><p class="muted">الموقعين الأصليين شغالين زي ما هم. افتح المعمل اللي محتاجه.</p><div class="grid">' +
      '<a class="card" href="' + LABS.scales + '"><h2>معمل القياس النفسي</h2><p class="muted">بناء المقاييس، الثبات والصدق، تحليل البنود، بنك المقاييس، ووضع الامتحان.</p><span class="go">افتح المعمل ←</span></a>' +
      '<a class="card" href="' + LABS.stats + '"><h2>معمل الإحصاء النفسي</h2><p class="muted">الاختبارات الإحصائية، حجم العينة والقوة، قراءة مخرجات SPSS، وكتابة النتايج.</p><span class="go">افتح المعمل ←</span></a></div>';
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
    main.innerHTML = '<h1>ملفي كباحث</h1><p class="muted">كل اللي هنا من كلامك إنت، وتقدر تعدّله أو تمسحه في أي وقت. إحنا مش بنستنتج عنك حاجة من نفسنا.</p>' +
      '<form class="card" id="pf"><div class="two">' + PF.map(function (f) {
        return '<div>' + (f[2] ? sel('pf-' + f[0], f[1], f[2], p[f[0]] || '', f[3]) : field('pf-' + f[0], f[1], p[f[0]] || '', f[3], f[4])) + '</div>';
      }).join('') + '</div><div class="row"><button class="btn primary" type="submit">احفظ</button><button class="btn danger" type="button" id="pfClear">امسح الملف</button></div></form>';
    $('.row', main).style.marginTop = '1rem';
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
    var h = '<div class="sec"><h1>مشاريعي البحثية</h1><button class="btn primary" id="newP" type="button">مشروع جديد</button></div>';
    if (!S.projects.length) h += '<div class="card empty"><p>لسه مفيش مشاريع.</p><p>المشروع بيجمع سؤالك ومتغيراتك وتصميمك وخطة تحليلك، وبيقولك إيه الناقص.</p></div>';
    else h += '<div class="grid">' + S.projects.map(function (p) {
      var n = progress(p);
      return '<a class="card" href="#project/' + p.id + '"><h2>' + esc(p.title || 'مشروع من غير عنوان') + '</h2><div class="meter" role="img" aria-label="' + n + ' من ' + STEPS.length + '"><i data-w="' + Math.round(n / STEPS.length * 100) + '"></i></div><p class="muted small">' + n + ' من ' + STEPS.length + ' أجزاء مكتملة · آخر تعديل ' + esc(p.updated || '') + '</p></a>';
    }).join('') + '</div>';
    main.innerHTML = h; widths();
    $('#newP').addEventListener('click', function () {
      var p = { id: uid(), title: '', design: '', paired: '', d: {}, vars: [], created: today(), updated: today() };
      S.projects.unshift(p); save(); location.hash = '#project/' + p.id;
    });
  };
  function widths() { $$('[data-w]', main).forEach(function (i) { i.style.width = i.getAttribute('data-w') + '%'; }); }

  V.project = function (id, step) {
    var p = proj(id);
    if (!p) { main.innerHTML = '<div class="card empty"><p>المشروع ده مش موجود على الجهاز ده.</p><a class="btn" href="#projects">رجوع للمشاريع</a></div>'; return; }
    step = step || 'overview';
    var h = '<p class="small"><a href="#projects">← كل المشاريع</a></p>' +
      '<label for="ptitle" class="small muted">عنوان المشروع</label><input type="text" id="ptitle" value="' + esc(p.title) + '" placeholder="اكتب عنوان مبدئي">' +
      '<div class="steps" role="tablist" aria-label="أجزاء المشروع"><button type="button" role="tab" data-step="overview" aria-selected="' + (step === 'overview') + '">نظرة عامة</button>' +
      STEPS.map(function (s) { return '<button type="button" role="tab" data-step="' + s[0] + '" class="' + (stepDone(p, s[0]) ? 'done' : '') + '" aria-selected="' + (step === s[0]) + '">' + s[1] + '</button>'; }).join('') + '</div><div id="pane"></div>';
    main.innerHTML = h;
    $('#ptitle').addEventListener('change', function () { p.title = this.value.trim(); touch(p); });
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
    pane.innerHTML = '<div class="card"><h2>إيه الناقص في مشروعك؟</h2><div class="meter" role="img" aria-label="' + n + ' من ' + STEPS.length + '"><i data-w="' + Math.round(n / STEPS.length * 100) + '"></i></div><p class="muted small">' + n + ' من ' + STEPS.length + ' أجزاء مكتملة</p><ul class="todo">' +
      STEPS.map(function (s) { var ok = stepDone(p, s[0]); return '<li><span class="' + (ok ? 'ok' : 'no') + '" aria-hidden="true">' + (ok ? '✓' : '○') + '</span><a href="#project/' + p.id + '/' + s[0] + '">' + s[1] + (ok ? '' : ' <span class="muted small">(ناقص)</span>') + '</a></li>'; }).join('') + '</ul></div>' +
      advise(p) +
      '<div class="card" id="ptools"><h2>أدوات</h2><div class="row"><a class="btn" href="' + LABS.stats + '">افتح معمل الإحصاء</a><a class="btn" href="' + LABS.scales + '">افتح معمل القياس</a><button class="btn" type="button" id="pPrint">اطبع / PDF</button><button class="btn" type="button" id="pExport">نزّل نسخة (JSON)</button><button class="btn danger" type="button" id="pDel">امسح المشروع</button></div></div>';
    $('#ptools', pane).style.marginTop = '1rem'; widths();
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
    pane.innerHTML = '<form class="card">' + TEXT[step].map(function (f) { return field('f-' + f[0], f[1], p.d[f[0]] || '', f[2], f[3]); }).join('') +
      '<p class="muted small" id="saved" aria-live="polite">بيتحفظ لوحده وإنت بتكتب.</p></form>' + nextBtn(p, step);
    $$('[data-f]', pane).forEach(function (el) {
      el.addEventListener('input', function () { p.d[el.id.slice(2)] = el.value; touch(p); });
    });
  }
  function nextBtn(p, step) {
    var i = STEPS.map(function (s) { return s[0]; }).indexOf(step), n = STEPS[i + 1];
    return '<p class="row"><a class="btn" href="#project/' + p.id + '/overview">نظرة عامة</a>' + (n ? '<a class="btn primary" href="#project/' + p.id + '/' + n[0] + '">التالي: ' + n[1] + ' ←</a>' : '') + '</p>';
  }

  function designPane(p, pane) {
    pane.innerHTML = '<form class="card">' + sel('f-design', 'تصميم البحث', DESIGNS, p.design) +
      sel('f-paired', 'القياسات على نفس الأفراد ولا أفراد مختلفين؟', [['ind', 'مجموعات مستقلة (أفراد مختلفين)'], ['rel', 'قياسات مرتبطة (نفس الأفراد أو أزواج متناظرة)']], p.paired, 'ده بيحدد نوع الاختبار الإحصائي') +
      field('f-dnote', 'ملاحظات على التصميم', (p.d || {}).dnote || '', 'الضبط، التوزيع العشوائي، مصادر التهديد للصدق الداخلي', 'area') + '</form>' + nextBtn(p, 'design');
    $('#f-design').addEventListener('change', function () { p.design = this.value; touch(p); });
    $('#f-paired').addEventListener('change', function () { p.paired = this.value; touch(p); });
    $('#f-dnote').addEventListener('input', function () { p.d = p.d || {}; p.d.dnote = this.value; touch(p); });
  }

  function varsPane(p, pane) {
    p.vars = p.vars || [];
    function draw() {
      pane.innerHTML = '<div class="card"><h2>متغيرات البحث</h2><p class="muted small">اكتبهم مرة واحدة هنا. مرشد الاختبار الإحصائي بيقرا منهم.</p><div class="tablewrap"><table><thead><tr><th>اسم المتغير</th><th>دوره</th><th>مستوى القياس</th><th>عدد المجموعات</th><th>بيتقاس بإيه</th><th></th></tr></thead><tbody>' +
        (p.vars.length ? p.vars.map(function (v, i) {
          return '<tr data-i="' + i + '"><td><input type="text" data-k="name" aria-label="اسم المتغير" value="' + esc(v.name) + '"></td><td><select data-k="role" aria-label="دوره">' + opts(ROLE_V, v.role) + '</select></td><td><select data-k="level" aria-label="مستوى القياس">' + opts(LEVEL_V, v.level) + '</select></td><td><input type="number" min="2" data-k="groups" aria-label="عدد المجموعات" value="' + esc(v.groups || '') + '"' + (v.level === 'scale' ? ' disabled' : '') + '></td><td><input type="text" data-k="tool" aria-label="بيتقاس بإيه" value="' + esc(v.tool || '') + '"></td><td><button class="btn ghost" type="button" data-del aria-label="امسح المتغير">✕</button></td></tr>';
        }).join('') : '<tr><td colspan="6" class="muted">لسه مفيش متغيرات.</td></tr>') +
        '</tbody></table></div><p><button class="btn" type="button" id="addV">ضيف متغير</button></p></div>' + advise(p) + nextBtn(p, 'variables');
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
    var r = recommend(p);
    if (!r) return '<div class="advice warn"><h3>مرشد الاختبار الإحصائي</h3><p>اكتب متغير مستقل ومتغير تابع على الأقل في جزء <a href="#project/' + p.id + '/variables">المتغيرات</a>، وهنقترح الاختبار المناسب.</p></div>';
    if (r.need) return '<div class="advice warn"><h3>مرشد الاختبار الإحصائي</h3><p>' + esc(r.need) + '</p></div>';
    return '<div class="advice"><h3>مرشد الاختبار الإحصائي</h3>' + r.recs.map(function (x) {
      return '<p><strong>' + esc(x.test) + '</strong></p><p class="small">ليه: ' + esc(x.why) + '</p>' + (x.alt ? '<p class="small">لو الافتراضات مش متحققة: ' + esc(x.alt) + '</p>' : '') + '<p class="small">افحص قبل ما تحلل:</p><ul class="small">' + x.check.map(function (c) { return '<li>' + esc(c) + '</li>'; }).join('') + '</ul>';
    }).join('') + r.extra.map(function (e) { return '<p class="small">' + esc(e) + '</p>'; }).join('') +
      '<p class="small muted">الاقتراح ده مبني على أول متغير تابع وأول متغير مستقل ومستوى قياسهم زي ما كتبتهم. راجعه مع مشرفك، واكتب حجم الأثر وفترة الثقة مع أي نتيجة.</p><p><a class="btn" href="' + LABS.stats + '">نفّذه في معمل الإحصاء</a></p></div>';
  }

  function printable(p) {
    var h = '<h1>' + esc(p.title || 'مشروع بحثي') + '</h1><p class="muted small">آخر تعديل ' + esc(p.updated) + '</p>';
    h += '<div class="card"><h2>التصميم</h2><p>' + esc(p.design || '—') + '</p><p>' + esc((p.d || {}).dnote || '') + '</p></div>';
    h += '<div class="card"><h2>المتغيرات</h2><ul>' + (p.vars || []).map(function (v) { return '<li>' + esc(v.name) + ' — ' + esc(label(ROLE_V, v.role)) + '، ' + esc(label(LEVEL_V, v.level)) + (v.tool ? '، بيتقاس بـ' + esc(v.tool) : '') + '</li>'; }).join('') + '</ul></div>';
    STEPS.forEach(function (s) { if (!TEXT[s[0]]) return; h += '<div class="card"><h2>' + s[1] + '</h2>' + TEXT[s[0]].map(function (f) { return '<h3>' + esc(f[1]) + '</h3><p>' + esc((p.d || {})[f[0]] || '—').replace(/\n/g, '<br>') + '</p>'; }).join('') + '</div>'; });
    main.innerHTML = '<p class="row"><a class="btn" href="#project/' + p.id + '">رجوع</a></p>' + h + advise(p);
    setTimeout(function () { window.print(); }, 150);
  }
  function label(list, v) { for (var i = 0; i < list.length; i++) if (list[i][0] === v) return list[i][1]; return ''; }

  /* ---------- family: guardian consent + children ---------- */
  var GRADES = ['أولى ابتدائي', 'تانية ابتدائي', 'تالتة ابتدائي', 'رابعة ابتدائي', 'خامسة ابتدائي', 'سادسة ابتدائي'];
  V.family = function () {
    var h = '<h1>' + (S.role === 'specialist' ? 'الأطفال اللي بتابعهم' : 'أولادي') + '</h1>';
    if (S.kids.length) h += '<div class="grid">' + S.kids.map(function (k) {
      return '<div class="card"><h2>' + esc(k.child) + '</h2><p class="muted">' + esc(k.age) + ' سنين · ' + esc(k.grade) + '</p><p class="small muted">موافقة ولي الأمر: ' + esc(k.guardian) + ' · ' + esc(k.date) + '</p><span class="tag soon">الأنشطة قريباً</span></div>';
    }).join('') + '</div>';
    h += '<div class="sec"><h2>تسجيل طفل</h2></div><form class="card" id="kf" novalidate>' +
      '<p class="muted">الأنشطة هنا للتنمية والمتابعة. مش اختبار ذكاء ولا تشخيص، ونتايجها مينفعش يتبني عليها قرار مصيري عن الطفل.</p><div class="two">' +
      '<div>' + field('k-guardian', 'اسم ولي الأمر', '') + '</div><div>' + field('k-child', 'اسم الابن أو البنت', '') + '</div>' +
      '<div>' + field('k-age', 'السن', '', 'من 5 لـ13 سنة', 'number') + '</div><div>' + sel('k-grade', 'الصف الدراسي', GRADES, '') + '</div></div>' +
      '<label class="check" for="k-ok"><input type="checkbox" id="k-ok"><span>أنا ولي أمر الطفل، وموافق إنه يستخدم أنشطة المنصة وإن نتايج الأنشطة تتسجل لمتابعة تقدّمه.</span></label>' +
      '<p id="k-err" class="small" role="alert"></p><p><button class="btn primary" type="submit">سجّل</button></p></form>';
    main.innerHTML = h;
    var err = $('#k-err'); err.style.color = 'var(--bad)';
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
