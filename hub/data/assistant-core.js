/* Assistant core: Arabic text matching, retrieval, statistics, the tool registry, the offline brain and the
   model client. No DOM work here; the page (mod-assistant.js) renders what these functions return. */
(function () {
  'use strict';
  var H = window.Hub, KBD = window.HubAssistantKB;
  if (!H || !KBD) return;

  /* ================= text ================= */
  var AR_DIGITS = '٠١٢٣٤٥٦٧٨٩', FA_DIGITS = '۰۱۲۳۴۵۶۷۸۹';
  function norm(s) {
    return String(s == null ? '' : s).toLowerCase()
      .replace(/[ً-ٰٟـ]/g, '')
      .replace(/[أإآٱ]/g, 'ا').replace(/ى/g, 'ي').replace(/ة/g, 'ه').replace(/ؤ/g, 'و').replace(/ئ/g, 'ي')
      .replace(/[٠-٩]/g, function (c) { return String(AR_DIGITS.indexOf(c)); })
      .replace(/[۰-۹]/g, function (c) { return String(FA_DIGITS.indexOf(c)); })
      .replace(/[^ء-يa-z0-9.%²]+/g, ' ').replace(/\s+/g, ' ').trim();
  }
  var STOP = {};
  ('في من علي عن الي او و يا هو هي ده دي دا اللي انا انت احنا هل ما ماذا ايه يعني بس كده لو ان اني انه مع بين كل اي ' +
    'عايز عاوز عايزه عاوزه محتاج محتاجه ممكن لو سمحت طيب بقي كمان برضه لي ليا لك بتاع بتاعي بتاعه هنا هناك فيه ' +
    'كيف متي لماذا اين the a an of to is are how what in for and or my i').split(' ').forEach(function (w) { STOP[w] = 1; });
  /* Egyptian and variant spellings folded onto one form (keys and values already normalised). */
  var SYN = {
    'ازاي': 'كيف', 'ازى': 'كيف', 'امتي': 'متي', 'ليه': 'لماذا', 'فين': 'اين', 'استبيان': 'مقياس', 'استبانه': 'مقياس', 'استبيانات': 'مقياس', 'مقاييس': 'مقياس',
    'مصداقيه': 'صدق', 'موثوقيه': 'ثبات', 'فرضيه': 'فرض', 'فرضيات': 'فرض', 'فروض': 'فرض', 'فرضيتي': 'فرض', 'داله': 'دلاله', 'معنويه': 'دلاله', 'معنوي': 'دلاله',
    'عينات': 'عينه', 'عينتي': 'عينه', 'مجموعات': 'مجموعه', 'مجموعتين': 'مجموعه', 'متغيرات': 'متغير', 'متغيرين': 'متغير', 'اختبارات': 'اختبار', 'تست': 'اختبار', 'test': 'اختبار',
    'نظريات': 'نظريه', 'دراسات': 'دراسه', 'ابحاث': 'بحث', 'بحوث': 'بحث', 'رسايل': 'رساله', 'رسائل': 'رساله', 'رسالتي': 'رساله', 'بنود': 'بند', 'عبارات': 'بند', 'عباره': 'بند', 'فقرات': 'بند', 'فقره': 'بند',
    'اطفال': 'طفل', 'عيال': 'طفل', 'عيل': 'طفل', 'ولادي': 'طفل', 'اولادي': 'طفل', 'ابني': 'طفل', 'بنتي': 'طفل', 'الولد': 'طفل', 'مشاريع': 'مشروع', 'مشاريعي': 'مشروع', 'مشروعي': 'مشروع',
    'احسب': 'حساب', 'احسبلي': 'حساب', 'يتحسب': 'حساب', 'بحسب': 'حساب', 'اكتب': 'كتابه', 'بكتب': 'كتابه', 'يتكتب': 'كتابه', 'اصيغ': 'صياغه', 'صيغه': 'صياغه',
    'correlation': 'ارتباط', 'reliability': 'ثبات', 'validity': 'صدق', 'sample': 'عينه', 'anova': 'انوفا', 'regression': 'انحدار', 'hypothesis': 'فرض', 'ethics': 'اخلاقيات',
    'كرونباك': 'كرونباخ', 'الفا': 'الفا', 'ت': 't', 'تي': 't', 'احصائي': 'احصاء', 'احصائيه': 'احصاء', 'الاحصائي': 'احصاء', 'قبلي': 'قبلي', 'بعدي': 'بعدي', 'اخلاقي': 'اخلاقيات', 'اخلاقيه': 'اخلاقيات',
    'مراجع': 'مرجع', 'مصادر': 'مرجع', 'مصدر': 'مرجع', 'توثيق': 'مرجع', 'تحكيم': 'محكمين', 'محكم': 'محكمين', 'تشخص': 'تشخيص', 'يشخص': 'تشخيص', 'شخص': 'تشخيص'
  };
  function stem(w) {
    if (SYN[w]) return SYN[w];
    var m = /^(وال|بال|فال|كال|لل|ال)(.{2,})$/.exec(w);
    if (m) w = m[2];
    if (SYN[w]) return SYN[w];
    if (w.length >= 5 && /(ات|ين|ون)$/.test(w)) w = w.slice(0, -2);
    return SYN[w] || w;
  }
  function tokens(s) {
    return norm(s).split(' ').filter(function (w) { return w && !STOP[w]; }).map(stem).filter(function (w) { return w && !STOP[w]; });
  }

  /* ================= retrieval (BM25 over title, search words and answer) ================= */
  var DOCS = KBD.entries.map(function (e) {
    var tf = {}, len = 0;
    [[e[1], 3], [e[2], 2], [e[3], 1]].forEach(function (f) { tokens(f[0]).forEach(function (t) { tf[t] = (tf[t] || 0) + f[1]; len += f[1]; }); });
    return { id: e[0], title: e[1], answer: e[3], go: e[4] || '', tf: tf, len: len, tt: tokens(e[1] + ' ' + e[2]) };
  });
  var DF = {}, AVG = 0;
  DOCS.forEach(function (d) { AVG += d.len; Object.keys(d.tf).forEach(function (t) { DF[t] = (DF[t] || 0) + 1; }); });
  AVG /= DOCS.length;
  function search(q, n) {
    var qt = tokens(q), seen = {}, out = [];
    qt = qt.filter(function (t) { if (seen[t]) return false; seen[t] = 1; return true; });
    if (!qt.length) return [];
    DOCS.forEach(function (d) {
      var s = 0, hit = 0, strong = 0;
      qt.forEach(function (t) {
        var f = d.tf[t]; if (!f) return;
        var idf = Math.log(1 + (DOCS.length - DF[t] + 0.5) / (DF[t] + 0.5));
        s += idf * f * 2.4 / (f + 1.4 * (0.4 + 0.6 * d.len / AVG)); hit++;
        if (d.tt.indexOf(t) > -1) strong++;
      });
      if (hit) out.push({ doc: d, score: s, cover: hit / qt.length, strong: strong });
    });
    out.sort(function (a, b) { return b.score - a.score; });
    return out.slice(0, n || 3);
  }
  function entry(id) { for (var i = 0; i < DOCS.length; i++) if (DOCS[i].id === id) return DOCS[i]; return null; }

  /* ================= statistics ================= */
  function lgamma(x) {
    var c = [76.18009172947146, -86.50532032941677, 24.01409824083091, -1.231739572450155, 0.001208650973866179, -0.000005395239384953], y = x, t = x + 5.5, s = 1.000000000190015;
    t -= (x + 0.5) * Math.log(t);
    for (var j = 0; j < 6; j++) s += c[j] / ++y;
    return -t + Math.log(2.5066282746310005 * s / x);
  }
  function betacf(a, b, x) {
    var m, m2, aa, c = 1, d = 1 - (a + b) * x / (a + 1), h; if (Math.abs(d) < 1e-30) d = 1e-30; d = 1 / d; h = d;
    for (m = 1; m <= 300; m++) {
      m2 = 2 * m; aa = m * (b - m) * x / ((a + m2 - 1) * (a + m2));
      d = 1 + aa * d; if (Math.abs(d) < 1e-30) d = 1e-30; c = 1 + aa / c; if (Math.abs(c) < 1e-30) c = 1e-30; d = 1 / d; h *= d * c;
      aa = -(a + m) * (a + b + m) * x / ((a + m2) * (a + m2 + 1));
      d = 1 + aa * d; if (Math.abs(d) < 1e-30) d = 1e-30; c = 1 + aa / c; if (Math.abs(c) < 1e-30) c = 1e-30; d = 1 / d;
      var del = d * c; h *= del; if (Math.abs(del - 1) < 1e-12) break;
    }
    return h;
  }
  function ibeta(x, a, b) {
    if (x <= 0) return 0; if (x >= 1) return 1;
    var bt = Math.exp(lgamma(a + b) - lgamma(a) - lgamma(b) + a * Math.log(x) + b * Math.log(1 - x));
    return x < (a + 1) / (a + b + 2) ? bt * betacf(a, b, x) / a : 1 - bt * betacf(b, a, 1 - x) / b;
  }
  function tcdf(t, df) { var p = 0.5 * ibeta(df / (df + t * t), df / 2, 0.5); return t > 0 ? 1 - p : p; }
  function tinv(p, df) { var lo = -60, hi = 60, i, mid; for (i = 0; i < 90; i++) { mid = (lo + hi) / 2; if (tcdf(mid, df) < p) lo = mid; else hi = mid; } return (lo + hi) / 2; }
  function phi(z) { /* standard normal CDF through the regularised incomplete gamma relation of erf */
    var x = Math.abs(z) / Math.SQRT2, t = 1 / (1 + 0.5 * x);
    var e = t * Math.exp(-x * x - 1.26551223 + t * (1.00002368 + t * (0.37409196 + t * (0.09678418 + t * (-0.18628806 + t * (0.27886807 + t * (-1.13520398 + t * (1.48851587 + t * (-0.82215223 + t * 0.17087277)))))))));
    return z >= 0 ? 1 - e / 2 : e / 2;
  }
  function zinv(p) { var lo = -9, hi = 9, i, mid; for (i = 0; i < 80; i++) { mid = (lo + hi) / 2; if (phi(mid) < p) lo = mid; else hi = mid; } return (lo + hi) / 2; }
  /* Noncentral t CDF: integrate the normal CDF over the distribution of s = sqrt(chi2/df) (Simpson's rule). */
  function nctcdf(t, df, delta) {
    var sd = 1 / Math.sqrt(2 * df), a = Math.max(1e-9, 1 - 9 * sd), b = 1 + 9 * sd, n = 600, h = (b - a) / n, sum = 0, i, s, w, lg;
    var k = Math.log(2) + (df / 2) * Math.log(df / 2) - lgamma(df / 2);
    for (i = 0; i <= n; i++) {
      s = a + i * h; w = i === 0 || i === n ? 1 : i % 2 ? 4 : 2;
      lg = k + (df - 1) * Math.log(s) - df * s * s / 2;
      sum += w * phi(t * s - delta) * Math.exp(lg);
    }
    return sum * h / 3;
  }
  function tPower(df, delta, alpha, tails) {
    var tc = tinv(1 - alpha / tails, df), p = 1 - nctcdf(tc, df, delta);
    return tails === 2 ? p + nctcdf(-tc, df, delta) : p;
  }
  /* Smallest n reaching the target power. two_t: n per group; paired_t: number of pairs; corr: total n (Fisher z). */
  function sampleSize(a) {
    var test = a.test, es = Math.abs(+a.effect), alpha = a.alpha == null ? 0.05 : +a.alpha, power = a.power == null ? 0.8 : +a.power, tails = +a.tails === 1 ? 1 : 2, n, p;
    if (['two_t', 'paired_t', 'corr'].indexOf(test) < 0) return { error: 'test' };
    if (!(es > 0) || !(alpha > 0 && alpha < 0.5) || !(power > 0.5 && power < 1)) return { error: 'range' };
    if (test === 'corr') {
      if (es >= 1) return { error: 'range' };
      var zr = 0.5 * Math.log((1 + es) / (1 - es));
      n = Math.ceil(Math.pow((zinv(1 - alpha / tails) + zinv(power)) / zr, 2) + 3);
      return { test: test, n: n, total: n, effect: es, alpha: alpha, power: power, tails: tails, method: 'fisher' };
    }
    if (es < 0.02) return { error: 'range' };
    var za = zinv(1 - alpha / tails), zb = zinv(power);
    n = Math.max(2, Math.floor((test === 'two_t' ? 2 : 1) * Math.pow((za + zb) / es, 2)) - 2);
    for (var guard = 0; guard < 4000; guard++, n++) {
      p = test === 'two_t' ? tPower(2 * n - 2, es * Math.sqrt(n / 2), alpha, tails) : tPower(n - 1, es * Math.sqrt(n), alpha, tails);
      if (p >= power) break;
    }
    return { test: test, n: n, total: test === 'two_t' ? 2 * n : n, effect: es, alpha: alpha, power: power, tails: tails, achieved: Math.round(p * 1000) / 1000, method: 'nct' };
  }

  /* ================= platform model (mirrors the project fields in hub.js) ================= */
  var FIELDS = {
    title: ['overview', 'عنوان المشروع'], problem: ['question', 'مشكلة البحث'], q: ['question', 'أسئلة البحث'], theory: ['background', 'الإطار النظري'],
    lit: ['background', 'أهم الدراسات السابقة'], gap: ['background', 'الفجوة'], h: ['hypotheses', 'الفروض'], tools: ['instruments', 'المقاييس والأدوات'],
    perm: ['instruments', 'إذن الاستخدام'], pop: ['sample', 'المجتمع والعينة'], n: ['sample', 'الحجم المستهدف'], plan: ['analysis', 'خطة التحليل'],
    irb: ['ethics', 'موافقة لجنة الأخلاقيات'], consent: ['ethics', 'الموافقة المستنيرة والسرية'], sup: ['notes', 'ملاحظات المشرف'], next: ['notes', 'الخطوة الجاية'], dnote: ['design', 'ملاحظات على التصميم']
  };
  var STEP_FIELDS = { question: ['problem', 'q'], background: ['theory', 'lit', 'gap'], hypotheses: ['h'], instruments: ['tools', 'perm'], sample: ['pop', 'n'], analysis: ['plan'], ethics: ['irb', 'consent'], notes: ['sup', 'next'] };
  var STEP_NAMES = { question: 'السؤال', background: 'الخلفية', variables: 'المتغيرات', hypotheses: 'الفروض', design: 'التصميم', instruments: 'الأدوات', sample: 'العينة', analysis: 'التحليل', ethics: 'الأخلاقيات', notes: 'ملاحظات المشرف' };
  var STEP_ORDER = ['question', 'background', 'variables', 'hypotheses', 'design', 'instruments', 'sample', 'analysis', 'ethics', 'notes'];
  var ROLE_AR = { researcher: 'باحث', student: 'طالب', specialist: 'أخصائي', parent: 'ولي أمر' };
  var VROLE = { iv: 'مستقل', dv: 'تابع', med: 'وسيط', mod: 'معدِّل', cov: 'ضابط' }, VLEVEL = { nominal: 'اسمي', ordinal: 'ترتيبي', scale: 'كمّي' };
  var SECTIONS = { home: 'الرئيسية', projects: 'مشاريعي البحثية', profile: 'ملفي', family: 'أولادي', labs: 'المعامل', theories: 'مكتبة النظريات', kids: 'ألعاب وأنشطة الأطفال', decide: 'بحوث العمليات والقرار', explore: 'مستكشف الأدبيات', assistant: 'المساعد', role: 'اختيار الدور' };

  function S() { return H.state(); }
  function stepDone(p, k) {
    if (k === 'variables') return (p.vars || []).some(function (v) { return v.role === 'dv' && v.name; }) && (p.vars || []).some(function (v) { return v.role === 'iv' && v.name; });
    if (k === 'design') return !!p.design;
    return STEP_FIELDS[k].every(function (f) { return String((p.d || {})[f] || '').trim(); });
  }
  function nextStep(p) { for (var i = 0; i < STEP_ORDER.length; i++) if (!stepDone(p, STEP_ORDER[i])) return STEP_ORDER[i]; return ''; }
  function pname(p) { return p.title || 'مشروع من غير عنوان'; }
  function findProject(ref) {
    var ps = S().projects, r = norm(ref), i;
    if (!ps.length) return null;
    if (!r) return ps.length === 1 ? ps[0] : null;
    for (i = 0; i < ps.length; i++) if (ps[i].id === ref) return ps[i];
    for (i = 0; i < ps.length; i++) if (ps[i].title && (norm(ps[i].title) === r || norm(ps[i].title).indexOf(r) > -1 || r.indexOf(norm(ps[i].title)) > -1)) return ps[i];
    if (/^\d+$/.test(r) && ps[+r - 1]) return ps[+r - 1];
    return null;
  }
  function clip(s, n) { s = String(s == null ? '' : s).replace(/\s+/g, ' ').trim(); return s.length > n ? s.slice(0, n - 1) + '…' : s; }

  /* The decision guide, same rules as the guide inside a project page. p needs { vars, paired }. */
  function recommend(p) {
    var vs = (p.vars || []).filter(function (v) { return v.name; });
    var dv = vs.filter(function (v) { return v.role === 'dv'; }), iv = vs.filter(function (v) { return v.role === 'iv'; });
    var med = vs.some(function (v) { return v.role === 'med'; }), mod = vs.some(function (v) { return v.role === 'mod'; }), cov = vs.some(function (v) { return v.role === 'cov'; });
    if (!dv.length || !iv.length) return null;
    var out = [], d = dv[0], x = iv[0], rel = p.paired === 'rel', g = parseInt(x.groups, 10) || 0;
    function add(test, why, alt, check) { out.push({ test: test, why: why, alt: alt, check: check }); }
    if (dv.length > 1 && d.level === 'scale' && x.level !== 'scale') add('MANOVA (تحليل التباين المتعدد)', 'عندك أكتر من متغير تابع كمّي ومتغير مستقل فئوي.', 'ANOVA لكل متغير تابع مع تصحيح للمقارنات المتعددة', ['الاعتدالية المتعددة', 'تجانس مصفوفات التغاير (Box M)', 'الارتباط بين المتغيرات التابعة']);
    if (iv.length > 1 && d.level === 'scale') {
      var allCat = iv.every(function (v) { return v.level !== 'scale'; });
      add(allCat ? 'ANOVA عاملي (تحليل التباين الثنائي أو أكتر)' : 'الانحدار المتعدد', allCat ? 'متغير تابع كمّي وأكتر من متغير مستقل فئوي، وده بيختبر التفاعل بينهم كمان.' : 'متغير تابع كمّي وأكتر من متنبئ.', null, allCat ? ['اعتدالية البواقي', 'تجانس التباين (Levene)'] : ['خطية العلاقة', 'اعتدالية البواقي', 'تجانس التباين', 'التعدد الخطي (VIF)', 'استقلال البواقي']);
    } else if (d.level === 'scale' && x.level !== 'scale') {
      if (!g) return { need: 'groups', say: 'المتغير المستقل «' + x.name + '» فيه كام مجموعة؟' };
      if (!p.paired) return { need: 'paired', say: 'المجموعات أفراد مختلفين، ولا نفس الأفراد اتقاسوا أكتر من مرة؟' };
      if (g === 2) rel ? add('اختبار t للعينات المرتبطة', 'متغير تابع كمّي، وقياسين على نفس الأفراد.', 'Wilcoxon للرتب المؤشَّرة', ['اعتدالية الفروق بين القياسين']) : add('اختبار t للعينات المستقلة', 'متغير تابع كمّي، ومجموعتين مستقلتين.', 'Mann-Whitney U (ولو التباين مش متجانس: Welch t)', ['اعتدالية المتغير التابع في كل مجموعة', 'تجانس التباين (Levene)']);
      else rel ? add('ANOVA للقياسات المتكررة', 'متغير تابع كمّي، و' + g + ' قياسات على نفس الأفراد.', 'Friedman', ['الاعتدالية', 'الكروية (Mauchly)، ولو مش متحققة استخدم تصحيح Greenhouse-Geisser']) : add('ANOVA أحادي الاتجاه', 'متغير تابع كمّي، و' + g + ' مجموعات مستقلة.', 'Kruskal-Wallis (ولو التباين مش متجانس: Welch ANOVA)', ['اعتدالية البواقي', 'تجانس التباين (Levene)', 'لو الفرق دال: مقارنات بعدية (Tukey أو Bonferroni)']);
    } else if (d.level === 'scale' && x.level === 'scale') {
      add('معامل ارتباط بيرسون، أو الانحدار الخطي البسيط لو هدفك التنبؤ', 'المتغيرين كمّيين.', 'معامل سبيرمان', ['خطية العلاقة (شكل الانتشار)', 'الاعتدالية', 'القيم المتطرفة']);
    } else if (d.level === 'ordinal') {
      if (x.level === 'scale' || x.level === 'ordinal') add('معامل ارتباط سبيرمان', 'المتغير التابع ترتيبي.', 'Kendall tau لو العينة صغيرة أو فيه قيم متساوية كتير', ['العلاقة مطّردة (monotonic)']);
      else if (!g) return { need: 'groups', say: 'المتغير المستقل «' + x.name + '» فيه كام مجموعة؟' };
      else if (!p.paired) return { need: 'paired', say: 'المجموعات أفراد مختلفين، ولا نفس الأفراد اتقاسوا أكتر من مرة؟' };
      else if (g === 2) add(rel ? 'Wilcoxon للرتب المؤشَّرة' : 'Mann-Whitney U', 'المتغير التابع ترتيبي ومجموعتين ' + (rel ? 'مرتبطتين.' : 'مستقلتين.'), null, ['شكل التوزيع متشابه في المجموعتين لو هتفسّر الفرق كفرق في الوسيط']);
      else add(rel ? 'Friedman' : 'Kruskal-Wallis', 'المتغير التابع ترتيبي و' + g + ' مجموعات ' + (rel ? 'مرتبطة.' : 'مستقلة.'), null, ['لو الفرق دال: مقارنات بعدية مع تصحيح (Dunn أو Bonferroni)']);
    } else if (d.level === 'nominal') {
      if (x.level === 'scale') add((parseInt(d.groups, 10) || 2) > 2 ? 'الانحدار اللوجستي المتعدد الفئات' : 'الانحدار اللوجستي الثنائي', 'المتغير التابع فئوي والمتنبئ كمّي.', null, ['خطية اللوجيت', 'حجم عينة كفاية لكل فئة', 'التعدد الخطي لو فيه أكتر من متنبئ']);
      else add(rel ? 'اختبار McNemar' : 'مربع كاي للاستقلال', 'المتغيرين فئويين' + (rel ? ' والقياسات مرتبطة.' : '.'), rel ? null : 'اختبار فيشر الدقيق لو فيه خلايا تكرارها المتوقع أقل من 5', ['التكرار المتوقع في كل خلية 5 أو أكتر', 'استقلال المشاهدات']);
    }
    var extra = [];
    if (med) extra.push('عندك متغير وسيط: استخدم تحليل الوساطة بطريقة Bootstrapping، ومتستنتجش سببية من بيانات ارتباطية.');
    if (mod) extra.push('عندك متغير معدِّل: اختبر التفاعل بتحليل التعديل، ومركِز المتغيرات الكمّية قبل حساب التفاعل.');
    if (cov && d.level === 'scale') extra.push('عندك متغير ضابط: مع متغير مستقل فئوي استخدم ANCOVA، ومع متنبئات كمّية دخّله في الانحدار.');
    return { recs: out, extra: extra };
  }
  function recText(r) {
    return r.recs.map(function (x) {
      return '**' + x.test + '**\nليه: ' + x.why + (x.alt ? '\nلو الافتراضات مش متحققة: ' + x.alt : '') + '\nافحص قبل ما تحلل:\n' + x.check.map(function (c) { return '- ' + c; }).join('\n');
    }).join('\n\n') + (r.extra.length ? '\n\n' + r.extra.join('\n') : '') + '\n\nده اقتراح مبني على اللي قلته، راجعه مع مشرفك واكتب حجم الأثر مع النتيجة.';
  }

  /* ================= tool registry ================= */
  var mem = function () { var d = H.data('assistant'); if (!Array.isArray(d.reading)) d.reading = []; if (!Array.isArray(d.drafts)) d.drafts = []; return d; };
  var TOOLS = [], BY = {};
  function tool(t) { TOOLS.push(t); BY[t.name] = t; }
  var str = { type: 'string' }, num = { type: 'number' };

  tool({
    name: 'get_state', mutates: false,
    description: 'يقرا دور المستخدم وملفه ومشاريعه البحثية (العنوان، الأجزاء المكتملة، الخطوة الجاية، المتغيرات). لا يرجّع أسماء أطفال.',
    parameters: { type: 'object', properties: {}, additionalProperties: false },
    run: function () {
      var s = S(), ps = s.projects.map(function (p) {
        var done = STEP_ORDER.filter(function (k) { return stepDone(p, k); }).length, nx = nextStep(p);
        return { id: p.id, title: pname(p), design: p.design || '', paired: p.paired || '', done: done, of: 10, next: nx ? STEP_NAMES[nx] : '', vars: (p.vars || []).filter(function (v) { return v.name; }).map(function (v) { return { name: v.name, role: VROLE[v.role] || '', level: VLEVEL[v.level] || '', groups: v.groups || '' }; }) };
      });
      var say = (s.role ? 'دورك: ' + ROLE_AR[s.role] + '.\n' : 'لسه مخترتش دور.\n');
      if (!ps.length) say += 'مفيش مشاريع على الجهاز ده لسه. قولّي «اعمل مشروع بعنوان …» ونبدأ.';
      else say += ps.map(function (p) { return '**' + p.title + '**: ' + p.done + ' من 10 أجزاء مكتملة' + (p.next ? '، والجاي «' + p.next + '».' : '، وكل الأجزاء مكتوبة.'); }).join('\n');
      var p0 = s.projects[0], link = p0 ? { label: 'افتح «' + clip(pname(p0), 28) + '»', hash: '#project/' + p0.id + (nextStep(p0) ? '/' + nextStep(p0) : '') } : { label: 'مشاريعي البحثية', hash: '#projects' };
      return { ok: true, say: say, link: link, data: { role: s.role || '', level: (s.profile || {}).level || '', field: (s.profile || {}).field || '', projects: ps, children_registered: s.kids.length } };
    }
  });

  tool({
    name: 'create_project', mutates: true,
    description: 'ينشئ مشروع بحثي جديد بعنوان. يتعرض على المستخدم للتأكيد قبل التنفيذ.',
    parameters: { type: 'object', properties: { title: str }, required: ['title'], additionalProperties: false },
    check: function (a) { return clip(a.title, 160) ? '' : 'title'; },
    preview: function (a) { return { title: 'هنشئ مشروع جديد', rows: [['العنوان', clip(a.title, 160)]], note: 'هيتحفظ على جهازك في «مشاريعي البحثية».' }; },
    run: function (a) {
      var p = { id: H.uid(), title: clip(a.title, 160), design: '', paired: '', d: {}, vars: [], created: H.today(), updated: H.today() };
      S().projects.unshift(p); H.save();
      return { ok: true, say: 'اتعمل مشروع «' + p.title + '». تحب نبدأ بمشكلة البحث ولا بالمتغيرات؟', link: { label: 'افتح المشروع', hash: '#project/' + p.id }, data: { id: p.id, title: p.title }, project: p.id };
    }
  });

  tool({
    name: 'set_project_field', mutates: true,
    description: 'يكتب نص في خانة من خانات مشروع كمسودة يأكدها المستخدم. الخانات: ' + Object.keys(FIELDS).join(', ') + '. mode: replace أو append.',
    parameters: { type: 'object', properties: { project: str, field: { type: 'string', enum: Object.keys(FIELDS) }, value: str, mode: { type: 'string', enum: ['replace', 'append'] } }, required: ['field', 'value'], additionalProperties: false },
    check: function (a) { if (!FIELDS[a.field]) return 'field'; if (!String(a.value || '').trim()) return 'value'; if (!findProject(a.project)) return 'project'; return ''; },
    preview: function (a) {
      var p = findProject(a.project), old = a.field === 'title' ? p.title : (p.d || {})[a.field] || '', nv = a.mode === 'append' && old ? old + '\n' + a.value : a.value;
      return { title: 'هكتب في «' + FIELDS[a.field][1] + '»', rows: [['المشروع', pname(p)], ['الموجود دلوقتي', old ? clip(old, 140) : 'فاضي'], ['هيبقى', clip(nv, 400)]], note: 'دي مسودة: راجعها وعدّلها بأسلوبك من صفحة المشروع.' };
    },
    run: function (a) {
      var p = findProject(a.project), v = String(a.value).slice(0, 4000);
      p.d = p.d || {};
      if (a.field === 'title') p.title = clip(v, 160);
      else p.d[a.field] = a.mode === 'append' && p.d[a.field] ? p.d[a.field] + '\n' + v : v;
      p.updated = H.today(); H.save();
      return { ok: true, say: 'اتكتب في «' + FIELDS[a.field][1] + '» بمشروع «' + pname(p) + '».', link: { label: 'راجعها في المشروع', hash: '#project/' + p.id + '/' + FIELDS[a.field][0] }, data: { project: p.id, field: a.field }, project: p.id };
    }
  });

  tool({
    name: 'add_variable', mutates: true,
    description: 'يضيف متغير لجدول متغيرات مشروع. role: iv/dv/med/mod/cov. level: nominal/ordinal/scale. groups لعدد المجموعات لو فئوي.',
    parameters: { type: 'object', properties: { project: str, name: str, role: { type: 'string', enum: ['iv', 'dv', 'med', 'mod', 'cov'] }, level: { type: 'string', enum: ['nominal', 'ordinal', 'scale'] }, groups: num }, required: ['name', 'role', 'level'], additionalProperties: false },
    check: function (a) { if (!clip(a.name, 80)) return 'name'; if (!VROLE[a.role]) return 'role'; if (!VLEVEL[a.level]) return 'level'; if (!findProject(a.project)) return 'project'; return ''; },
    preview: function (a) { return { title: 'هضيف متغير', rows: [['المشروع', pname(findProject(a.project))], ['الاسم', clip(a.name, 80)], ['الدور', VROLE[a.role]], ['مستوى القياس', VLEVEL[a.level]]].concat(a.groups ? [['عدد المجموعات', String(a.groups)]] : []) }; },
    run: function (a) {
      var p = findProject(a.project); p.vars = p.vars || [];
      p.vars.push({ name: clip(a.name, 80), role: a.role, level: a.level, groups: a.level === 'scale' ? '' : (a.groups ? String(parseInt(a.groups, 10)) : ''), tool: '' });
      p.updated = H.today(); H.save();
      return { ok: true, say: 'اتضاف المتغير «' + clip(a.name, 80) + '» (' + VROLE[a.role] + '، ' + VLEVEL[a.level] + ').', link: { label: 'جدول المتغيرات', hash: '#project/' + p.id + '/variables' }, data: { project: p.id, vars: p.vars.length }, project: p.id };
    }
  });

  tool({
    name: 'recommend_test', mutates: false,
    description: 'مرشد الاختبار الإحصائي. إما لمشروع (project) من متغيراته، أو لحالة موصوفة: dv_level و iv_level (nominal/ordinal/scale) و groups و paired (ind/rel).',
    parameters: { type: 'object', properties: { project: str, dv_level: str, iv_level: str, groups: num, paired: { type: 'string', enum: ['ind', 'rel'] } }, additionalProperties: false },
    run: function (a) {
      var p = null, src = '';
      if (a.dv_level && a.iv_level) p = { paired: a.paired || '', vars: [{ name: 'المستقل', role: 'iv', level: a.iv_level, groups: a.groups || '' }, { name: 'التابع', role: 'dv', level: a.dv_level, groups: '' }] };
      else { p = findProject(a.project); if (p) src = pname(p); }
      if (!p) return { ok: false, say: 'محتاج أعرف المتغيرات الأول: إما مشروع فيه جدول متغيرات، أو قولّي نوع المتغير التابع والمستقل.', data: { error: 'no_input' } };
      var r = recommend(p);
      if (!r) return { ok: false, say: 'مشروع «' + src + '» محتاج متغير مستقل ومتغير تابع على الأقل في جدول المتغيرات.', link: { label: 'جدول المتغيرات', hash: '#project/' + p.id + '/variables' }, data: { error: 'no_variables' } };
      if (r.need) return { ok: false, say: r.say, need: r.need, data: { error: 'need_' + r.need } };
      if (!r.recs.length) return { ok: false, say: 'التركيبة دي مش متغطية في المرشد. اوصفها لمشرفك أو لمتخصص إحصاء.', data: { error: 'not_covered' } };
      return { ok: true, say: (src ? 'لمشروع «' + src + '»:\n' : '') + recText(r), link: src ? { label: 'افتح خطة التحليل', hash: '#project/' + p.id + '/analysis' } : { label: 'نفّذه في معمل الإحصاء', hash: '#labs' }, data: r, project: p.id || '' };
    }
  });

  tool({
    name: 'sample_size', mutates: false,
    description: 'يحسب أصغر حجم عينة للقوة المطلوبة. test: two_t (مجموعتين مستقلتين، effect = Cohen d)، paired_t (قياسين مرتبطين، effect = dz)، corr (ارتباط بيرسون، effect = r). الافتراضي alpha 0.05 و power 0.80 وذيلين.',
    parameters: { type: 'object', properties: { test: { type: 'string', enum: ['two_t', 'paired_t', 'corr'] }, effect: num, alpha: num, power: num, tails: num }, required: ['test', 'effect'], additionalProperties: false },
    run: function (a) {
      var r = sampleSize(a);
      if (r.error) return { ok: false, say: r.error === 'test' ? 'بحسب دلوقتي لتلات حالات بس: t لمجموعتين مستقلتين، t للمرتبطة، ومعامل الارتباط.' : 'القيم دي بره المدى المعقول. حجم الأثر لازم يكون أكبر من صفر (والارتباط أقل من 1)، وألفا بين 0 و0.5، والقوة بين 0.5 و1.', data: r };
      var what = r.test === 'two_t' ? '**' + r.n + ' في كل مجموعة** (الإجمالي ' + r.total + ')' : r.test === 'paired_t' ? '**' + r.n + ' فرد** كل واحد بقياسين' : '**' + r.n + ' فرد**';
      var es = r.test === 'corr' ? 'r = ' + r.effect : 'd = ' + r.effect;
      return {
        ok: true, data: r,
        say: 'محتاج ' + what + '.\nالأساس: ' + es + '، ألفا = ' + r.alpha + '، القوة = ' + r.power + '، ' + (r.tails === 2 ? 'ذيلين' : 'ذيل واحد') + '.\n' +
          (r.method === 'nct' ? 'الحساب بتوزيع t اللامركزي.' : 'الحساب بتقريب Fisher z، والطرق الدقيقة ممكن تفرق فرد واحد.') + ' زوّد نسبة للتسرب المتوقع، واكتب مصدر حجم الأثر اللي افترضته.',
        link: { label: 'القوة وحجم العينة في معمل الإحصاء', hash: '#labs' }
      };
    }
  });

  tool({
    name: 'open_section', mutates: false,
    description: 'يعرض للمستخدم رابط لقسم في المنصة: ' + Object.keys(SECTIONS).join(', ') + '. مع explore ممكن query للبحث. مع project و step يفتح جزء من مشروع.',
    parameters: { type: 'object', properties: { section: str, query: str, project: str, step: str }, additionalProperties: false },
    run: function (a) {
      var p = a.project ? findProject(a.project) : null, hash, label;
      if (p) { hash = '#project/' + p.id + (STEP_NAMES[a.step] ? '/' + a.step : ''); label = 'افتح «' + clip(pname(p), 26) + '»' + (STEP_NAMES[a.step] ? ': ' + STEP_NAMES[a.step] : ''); }
      else if (SECTIONS[a.section]) {
        hash = '#' + a.section; label = 'افتح ' + SECTIONS[a.section];
        if (a.section === 'explore' && clip(a.query, 120)) { hash = '#explore/search/' + encodeURIComponent(clip(a.query, 120)); label = 'دوّر في الأدبيات عن «' + clip(a.query, 40) + '»'; }
      } else return { ok: false, say: 'مش لاقي القسم ده. الأقسام: ' + Object.keys(SECTIONS).map(function (k) { return SECTIONS[k]; }).join('، ') + '.', data: { error: 'unknown_section' } };
      return { ok: true, say: 'اتفضل، الرابط جاهز:', link: { label: label, hash: hash }, data: { shown_link: hash } };
    }
  });

  var theoriesCache = null;
  function loadTheories() {
    if (theoriesCache) return Promise.resolve(theoriesCache);
    var g = window.HubTheories || window.HubTheoriesData;
    if (g) return Promise.resolve(theoriesCache = g);
    /* Only ask the network when the theories section is live on this copy, so a missing file is not requested. */
    if (!document.querySelector('a[href="#theories"]')) return Promise.resolve(null);
    return fetch('data/theories.json').then(function (r) { return r.ok ? r.json() : null; }).then(function (j) { return theoriesCache = j; }).catch(function () { return null; });
  }
  function flatTheories(j) {
    var out = [];
    (function walk(x, depth) {
      if (!x || depth > 4) return;
      if (Array.isArray(x)) { x.forEach(function (y) { walk(y, depth + 1); }); return; }
      if (typeof x !== 'object') return;
      var name = x.title || x.name || x.ar || x.name_ar || x.title_ar || x.t;
      if (typeof name === 'string' && name.length < 140) {
        var text = Object.keys(x).map(function (k) { return typeof x[k] === 'string' ? x[k] : Array.isArray(x[k]) && typeof x[k][0] === 'string' ? x[k].join(' ') : ''; }).join(' ');
        out.push({ id: x.id || x.slug || '', name: name, sum: x.summary || x.sum || x.brief || x.say || x.core || '', text: text });
      }
      Object.keys(x).forEach(function (k) { if (typeof x[k] === 'object') walk(x[k], depth + 1); });
    })(j, 0);
    return out;
  }
  tool({
    name: 'search_theories', mutates: false, async: true,
    description: 'يبحث في مكتبة النظريات بتاعة المنصة لو متاحة ويرجّع أقرب النظريات. لو المكتبة مش متاحة بيقول كده.',
    parameters: { type: 'object', properties: { query: str }, required: ['query'], additionalProperties: false },
    run: function (a) {
      return loadTheories().then(function (j) {
        if (!j) return { ok: false, say: 'مكتبة النظريات لسه مش متاحة على النسخة دي، فمش هقدر أبحث فيها. ومش هخمّن محتوى نظرية من عندي.', data: { error: 'not_available' } };
        var qt = tokens(a.query), list = flatTheories(j).map(function (t) {
          var nt = tokens(t.name), all = tokens(t.text), s = 0;
          qt.forEach(function (q) { if (nt.indexOf(q) > -1) s += 3; else if (all.indexOf(q) > -1) s += 1; });
          return { t: t, s: s };
        }).filter(function (x) { return x.s > 0; }).sort(function (x, y) { return y.s - x.s; }).slice(0, 3);
        if (!list.length) return { ok: false, say: 'ملقتش في مكتبة النظريات حاجة قريبة من «' + clip(a.query, 60) + '».', link: { label: 'افتح مكتبة النظريات', hash: '#theories' }, data: { results: [] } };
        return { ok: true, say: 'لقيت في مكتبة النظريات:\n' + list.map(function (x) { return '- **' + x.t.name + '**' + (x.t.sum ? ': ' + clip(x.t.sum, 160) : ''); }).join('\n'), link: { label: 'افتح مكتبة النظريات', hash: list[0].t.id ? '#theories/' + list[0].t.id : '#theories' }, data: { results: list.map(function (x) { return { name: x.t.name, summary: clip(x.t.sum, 300) }; }) } };
      });
    }
  });

  tool({
    name: 'search_kb', mutates: false,
    description: 'يبحث في قاعدة معرفة المنصة (استخدام المنصة، المنهج، الإحصاء، القياس، الأخلاقيات، كتابة النتائج). استخدمه قبل الإجابة عن سؤال علمي.',
    parameters: { type: 'object', properties: { query: str }, required: ['query'], additionalProperties: false },
    run: function (a) {
      var r = search(a.query, 3);
      return { ok: r.length > 0, say: r.length ? r[0].doc.answer : 'مفيش حاجة قريبة في قاعدة المعرفة.', data: { results: r.map(function (x) { return { title: x.doc.title, text: x.doc.answer }; }) } };
    }
  });

  tool({
    name: 'add_reading', mutates: true,
    description: 'يضيف عنصر لقايمة القراءة (عنوان، ورابط اختياري، وملاحظة). لا تضف مرجع لم يذكره المستخدم أو لم يأتِ من نتيجة بحث.',
    parameters: { type: 'object', properties: { title: str, url: str, note: str }, required: ['title'], additionalProperties: false },
    check: function (a) { return clip(a.title, 200) ? '' : 'title'; },
    preview: function (a) { return { title: 'هضيف لقايمة القراءة', rows: [['العنوان', clip(a.title, 200)]].concat(safeUrl(a.url) ? [['الرابط', safeUrl(a.url)]] : []).concat(a.note ? [['ملاحظة', clip(a.note, 200)]] : []) }; },
    run: function (a) {
      var d = mem(); d.reading.unshift({ id: H.uid(), title: clip(a.title, 200), url: safeUrl(a.url), note: clip(a.note, 200), added: H.today() });
      d.reading = d.reading.slice(0, 60); H.save();
      return { ok: true, say: 'اتضاف لقايمة القراءة. عندك دلوقتي ' + d.reading.length + '.', data: { count: d.reading.length } };
    }
  });
  function safeUrl(u) { u = String(u || '').trim(); return /^https?:\/\/[^\s<>"']{4,400}$/i.test(u) ? u : ''; }

  tool({
    name: 'draft_abc', mutates: true,
    description: 'يجهّز هيكل سجل ABC (سوابق، سلوك، توابع) ويحفظه في المسودات بعد تأكيد المستخدم. يستخدم كود للطفل وليس اسمه.',
    parameters: { type: 'object', properties: { behavior: str, antecedent: str, consequence: str, setting: str }, additionalProperties: false },
    preview: function (a) { return { title: 'هحفظ مسودة سجل ABC', rows: [['المحتوى', clip(abcText(a), 260)]], note: 'هتتحفظ في «مسوداتي» على جهازك. اكتب كود بدل اسم الطفل.' }; },
    run: function (a) { return saveDraft('سجل ABC', abcText(a)); }
  });
  function abcText(a) {
    function v(x, hint) { return clip(x, 300) || '……… (' + hint + ')'; }
    return 'سجل ABC\nكود الطفل: ………  التاريخ: ' + H.today() + '  الوقت: ………\nالمكان والموقف: ' + v(a.setting, 'فين، ومين موجود، وكان مطلوب منه إيه') +
      '\n\nA السوابق: ' + v(a.antecedent, 'إيه اللي حصل قبل السلوك مباشرة') + '\nB السلوك: ' + v(a.behavior, 'وصف يتشاف ويتعدّ، من غير تفسير') + '\nC التوابع: ' + v(a.consequence, 'إيه اللي حصل بعده على طول، ومن مين') +
      '\n\nالمدة أو التكرار: ………\nملاحظات: ………\n\nسجّل 10 مرات على الأقل قبل أي استنتاج عن وظيفة السلوك. السجل ده للملاحظة، ومش تشخيص، ولازم يراجعه المتخصص المسؤول عن الحالة.';
  }
  tool({
    name: 'draft_5ps', mutates: true,
    description: 'يجهّز هيكل صياغة حالة بنموذج 5Ps ويحفظه في المسودات بعد تأكيد المستخدم. فرضيات للمراجعة وليس تشخيصاً.',
    parameters: { type: 'object', properties: { presenting: str, predisposing: str, precipitating: str, perpetuating: str, protective: str }, additionalProperties: false },
    preview: function (a) { return { title: 'هحفظ مسودة صياغة 5Ps', rows: [['المحتوى', clip(fiveText(a), 260)]], note: 'هتتحفظ في «مسوداتي» على جهازك. اكتب كود بدل اسم الحالة.' }; },
    run: function (a) { return saveDraft('صياغة 5Ps', fiveText(a)); }
  });
  function fiveText(a) {
    function v(x, hint) { return clip(x, 400) || '……… (' + hint + ')'; }
    return 'صياغة الحالة: نموذج 5Ps\nكود الحالة: ………  التاريخ: ' + H.today() +
      '\n\n1. المشكلة الحالية (Presenting): ' + v(a.presenting, 'إيه اللي بيحصل، من إمتى، وبيأثر على إيه') +
      '\n2. العوامل المهيِّئة (Predisposing): ' + v(a.predisposing, 'تاريخ النمو، الأسرة، خبرات سابقة') +
      '\n3. العوامل المرسِّبة (Precipitating): ' + v(a.precipitating, 'إيه اللي حصل قبل ما المشكلة تظهر أو تزيد') +
      '\n4. العوامل المديمة (Perpetuating): ' + v(a.perpetuating, 'إيه اللي مخليها مستمرة') +
      '\n5. العوامل الواقية (Protective): ' + v(a.protective, 'نقاط القوة والدعم المتاح') +
      '\n\nدي فرضيات شغل تتراجع مع كل معلومة جديدة، ومش تشخيص. أي قرار عن الحالة لازم يراجعه متخصص مسؤول.';
  }
  function saveDraft(kind, text) {
    var d = mem(); d.drafts.unshift({ id: H.uid(), kind: kind, text: text, added: H.today() }); d.drafts = d.drafts.slice(0, 20); H.save();
    return { ok: true, say: 'اتحفظت في «مسوداتي». تقدر تنسخها أو تطبعها وتملاها.\n\n' + text, data: { saved: kind } };
  }

  /* Checks tool arguments against the declared schema before anything runs. */
  function validate(t, a) {
    if (!a || typeof a !== 'object' || Array.isArray(a)) return 'args';
    var pr = t.parameters.properties || {}, k;
    for (k in a) if (!pr[k]) delete a[k];
    for (k in pr) {
      if (a[k] == null) continue;
      if (pr[k].type === 'number') { a[k] = Number(a[k]); if (!isFinite(a[k])) return k; }
      else { a[k] = String(a[k]).slice(0, 4000); if (pr[k].enum && pr[k].enum.indexOf(a[k]) < 0) return k; }
    }
    var req = t.parameters.required || [];
    for (var i = 0; i < req.length; i++) if (a[req[i]] == null || a[req[i]] === '') return req[i];
    return t.check ? t.check(a) : '';
  }
  function runTool(name, args) {
    var t = BY[name]; if (!t) return Promise.resolve({ ok: false, say: 'الأداة دي مش موجودة.', data: { error: 'unknown_tool' } });
    var bad = validate(t, args); if (bad) return Promise.resolve({ ok: false, say: 'ناقص أو غلط: ' + bad, data: { error: 'invalid_' + bad } });
    try { return Promise.resolve(t.run(args)); } catch (e) { return Promise.resolve({ ok: false, say: 'حصلت مشكلة وأنا بنفّذ.', data: { error: 'failed' } }); }
  }

  /* ================= offline brain ================= */
  var ctx = { pending: null, project: '', last: '' };
  function reset() { ctx = { pending: null, project: '', last: '' }; }
  function has(n, re) { return re.test(n); }
  var RE = {
    selfHard: /(انتحر|هنتحر|اموت نفسي|اقتل نفسي|اذي نفسي|ااذي نفسي|اءذي نفسي|انهي حياتي|اخلص من حياتي|مش (عايز|عاوز|قادر) اعيش|نفسي اموت|(عايز|عاوز|عايزه|عاوزه) اموت|مليش لازمه|kill myself|suicidal)/,
    selfSoft: /(انتحار|ايذاء النفس|suicide)/,
    research: /(دراسه|دراسات|بحث|ابحاث|مقياس|ادبيات|رساله|عينه|فرض|متغير|نظريه)/,
    childWord: /(طفل|اطفال|ابني|بنتي|ابنه|بنته|تلميذ|تلميذه|ولد|بنت|عيل|عيال|ولادي|اولادي|طالب عندي|حاله عندي)/,
    harm: /(بيضرب|بضرب|يضرب|بيتضرب|اتضرب|تحرش|اعتداء|اغتصاب|بيتعذب|ايذاء|عنف|بيتاذي|في خطر|بيحبسه|بيحرق)/,
    diag: /(تشخيص|شخص|شخصلي|عنده توحد|عندها توحد|توحد|فرط حركه|نقص انتباه|adhd|صعوبات تعلم|نسبه ذكاء|معدل ذكاء|\biq\b|متخلف|متاخر عقليا|تاخر عقلي|غبي|ذكي ولا)/,
    write: /(اكتب|اكتبلي|اعمللي|اعملي|جهزلي|خلصلي|الفلي|الف).{0,24}(الرساله|رسالتي|الفصل|فصل|الاطار النظري|البحث كله|المقدمه|الدراسات السابقه|خطه البحث كامله)/,
    refs: /((هات|هاتلي|اديني|رشحلي|اقترحلي|عايز|عاوز|محتاج|اكتبلي).{0,16}(مراجع|دراسات سابقه|دراسات|دراسه|مصادر|ابحاث) (عن|في|علي|حول) |(هات|هاتلي|اديني).{0,10}(doi|مراجع|مصادر))/,
    hello: /^(اهلا|هلا|السلام عليكم|سلام|صباح|مساء|هاي|hi|hello|ازيك|مرحبا|يا instinct)/,
    thanks: /^(شكرا|متشكر|تسلم|ميرسي|thanks|جزاك)/,
    who: /(انت مين|اسمك ايه|بتعمل ايه|تقدر تعمل ايه|تساعدني في ايه|تساعدني ازاي|بتشتغل ازاي|ايه فايدتك|^مساعده$|^help$)/,
    yes: /^(ايوه|اه|اها|تمام|نفذ|موافق|اوكي|ok|okay|ماشي|يلا|اكيد|نعم|صح)( |$)/,
    no: /^(لا|لأ|الغي|الغاء|مش عايز|مش عاوز|بلاش|استني|cancel)( |$)/,
    size: /(حجم (ال)?عينه|احسب.{0,12}عينه|كام (مفحوص|فرد|مشارك|طالب محتاج)|عدد (ال)?عينه|sample size)/,
    test: /((انهي|اي|ايه|ما|ايه هو) (ال)?(اختبار|تحليل)|احلل ب|احللها ب|اختبار (احصاء |)مناسب|التحليل المناسب|ارشح.{0,10}اختبار|رشحلي.{0,10}اختبار|اختار.{0,10}اختبار|استخدم (انهي|اي) اختبار|statistical test)/,
    create: /((اعمل|اعملي|انشي|انشا|انشيء|ابدا|ضيف|اضف|سجل|افتح)( لي| ليا)? مشروع|مشروع (بحثي )?جديد)/,
    suggest: /(اقترح|اقترحلي|ساعدني اصيغ|صيغلي|صياغه|قالب).{0,20}(فرض|فروض|سوال|اسيله|اسءله)/,
    addVar: /(ضيف|اضف|سجل|زود)( لي)? (ال)?متغير/,
    setF: /^(اكتب|اكتبلي|حط|سجل|ضيف|اضف|غير|عدل|خلي)( |$)/,
    open: /^(افتح|افتحلي|وديني|روح|خدني|وريني صفحه|عايز اروح|عاوز اروح)( |$)/,
    find: /(دور|دورلي|ابحث|ابحثلي|هات|لاقيلي).{0,14}(عن|في|علي) (.+)$/,
    reading: /(قايمه القراءه|قايمه القرايه|قايمه القراءه|للقراءه|اقراه بعدين|reading list)/,
    abc: /(abc|ايه بي سي|سجل سلوك|سوابق وتوابع)/, five: /(5ps|5 ps|5p|خمسه بي|صياغه (ال)?حاله)/,
    make: /(جهز|جهزلي|اعمل|اعملي|سجل|هيكل|نموذج|استماره|قالب|ابدا|املا)/,
    state: /(مشاريعي|مشاريع عندي|واقف فين|وصلت لفين|الخطوه الجايه|ايه الناقص|اكمل ايه|اعمل ايه دلوقتي|ملخص مشروع)/
  };
  var FIELD_WORDS = [['title', /(عنوان)/], ['n', /(الحجم المستهدف|حجم العينه المستهدف)/], ['h', /(فرض|فروض)/], ['problem', /(مشكله)/], ['q', /(سوال|اسيله|اسءله|تساول)/], ['theory', /(الاطار النظري|اطار نظري|النظريه)/], ['lit', /(الدراسات السابقه|دراسات سابقه)/], ['gap', /(فجوه)/],
    ['tools', /(الادوات|ادوات|المقاييس|المقياس)/], ['perm', /(اذن)/], ['pop', /(المجتمع|العينه)/], ['plan', /(خطه التحليل|التحليل)/], ['irb', /(لجنه)/], ['consent', /(الموافقه|السريه|الاخلاقيات)/], ['sup', /(ملاحظات المشرف|ملاحظه المشرف|المشرف)/], ['next', /(الخطوه الجايه)/], ['dnote', /(التصميم)/]];
  var SECTION_WORDS = [['theories', /(نظريات|النظريات|نظريه)/], ['decide', /(القرار|بحوث العمليات)/], ['explore', /(الادبيات|المستكشف|الفرص|مستكشف)/], ['projects', /(مشاريعي|المشاريع|مشروع)/], ['profile', /(ملفي|الملف|بروفايل)/], ['family', /(اولادي|ولادي|الاطفال اللي)/], ['kids', /(الالعاب|العاب|انشطه)/], ['labs', /(المعامل|معمل)/], ['role', /(الدور|دوري|الادوار)/], ['home', /(الرييسيه|الرءيسيه|الرئيسيه)/]];

  function afterColon(raw) { var m = /[:：]\s*([\s\S]+)$/.exec(raw); return m ? m[1].trim() : ''; }
  function quoted(raw) { var m = /[«"“]([^»"”]{2,300})[»"”]/.exec(raw); return m ? m[1].trim() : ''; }
  function afterWord(raw, words) { var m = new RegExp('(?:' + words + ')\\s+([\\s\\S]{2,})$').exec(raw); return m ? m[1].trim().replace(/[.؟?!]+$/, '') : ''; }
  function number(n) { var m = /(\d+(?:\.\d+)?)/.exec(n); return m ? parseFloat(m[1]) : null; }
  function projectFrom(n) {
    var ps = S().projects, i;
    for (i = 0; i < ps.length; i++) if (ps[i].title && norm(ps[i].title).length > 2 && n.indexOf(norm(ps[i].title)) > -1) return ps[i];
    if (ctx.project) for (i = 0; i < ps.length; i++) if (ps[i].id === ctx.project) return ps[i];
    return ps.length === 1 ? ps[0] : null;
  }
  function askProject(tool, args, raw) {
    var ps = S().projects;
    if (!ps.length) return { text: 'لسه مفيش مشاريع على الجهاز. نعمل مشروع الأول؟ قولّي عنوانه.', pend: { tool: 'create_project', args: {}, slot: 'title' }, src: 'ask' };
    return { text: 'على أنهي مشروع؟', chips: ps.slice(0, 5).map(function (p, i) { return pname(p) === 'مشروع من غير عنوان' ? String(i + 1) : pname(p); }), pend: { tool: tool, args: args, slot: 'project' }, src: 'ask' };
  }

  /* Each slot knows how to read itself from a reply and what to ask when it is missing. */
  var SLOTS = {
    title: { ask: 'عنوان المشروع إيه؟ (ينفع عنوان مؤقت وتغيّره بعدين)', read: function (raw) { var v = quoted(raw) || afterColon(raw) || raw.trim(); return v.length >= 2 ? clip(v, 160) : null; } },
    project: { ask: 'على أنهي مشروع؟', read: function (raw) { var p = findProject(raw); return p ? p.id : null; } },
    value: { ask: 'اكتب النص اللي عايزه يتحط.', read: function (raw) { var v = afterColon(raw) || raw.trim(); return v.length >= 2 ? v : null; } },
    name: { ask: 'اسم المتغير إيه؟', read: function (raw) { var v = quoted(raw) || afterColon(raw) || raw.trim(); return v.length >= 2 ? clip(v, 80) : null; } },
    role: { ask: 'دوره إيه في البحث؟', chips: ['مستقل', 'تابع', 'وسيط', 'معدِّل', 'ضابط'], read: function (raw, n) { return /مستقل/.test(n) ? 'iv' : /تابع/.test(n) ? 'dv' : /وسيط/.test(n) ? 'med' : /معدل/.test(n) ? 'mod' : /ضابط|مصاحب/.test(n) ? 'cov' : null; } },
    level: { ask: 'بيتقاس إزاي؟', chips: ['درجة كمّية', 'ترتيبي', 'فئات (اسمي)'], read: function (raw, n) { return readLevel(n); } },
    kind: {
      ask: 'عايز تقارن بين مجموعات، ولا تدرس علاقة بين متغيرين؟', chips: ['مقارنة مجموعتين', 'مقارنة 3 مجموعات أو أكتر', 'علاقة بين متغيرين'],
      read: function (raw, n) { var g = readGroups(n); if (g) return g; if (/(علاقه|ارتباط|تنبو|يتنبا)/.test(n)) return 'rel2'; return null; }
    },
    paired: { ask: 'المجموعات أفراد مختلفين، ولا نفس الأفراد اتقاسوا أكتر من مرة؟', chips: ['أفراد مختلفين', 'نفس الأفراد (قبلي وبعدي)'], read: function (raw, n) { return readPaired(n); } },
    dv: { ask: 'المتغير التابع (النتيجة اللي بتقيسها) شكله إيه؟', chips: ['درجة كمّية', 'ترتيبي', 'فئات (اسمي)'], read: function (raw, n) { return readLevel(n); } },
    stest: { ask: 'هتحسب حجم العينة لأنهي تحليل؟', chips: ['مقارنة مجموعتين مستقلتين', 'قبلي وبعدي لنفس الأفراد', 'معامل ارتباط'], read: function (raw, n) { return /(ارتباط|علاقه|بيرسون)/.test(n) ? 'corr' : /(قبلي|بعدي|نفس الافراد|مرتبط|قبل وبعد)/.test(n) ? 'paired_t' : /(مجموعتين|مستقل|تجريبيه|ضابطه|مقارنه|فرق)/.test(n) ? 'two_t' : null; } },
    effect: {
      ask: 'حجم الأثر اللي متوقعه قد إيه؟ اكتب رقم (زي 0.5)، أو اختار بقاعدة Cohen التقريبية:', chips: ['صغير', 'متوسط', 'كبير'],
      read: function (raw, n, args) { var v = number(n), c = args.test === 'corr'; if (v != null && v > 0 && v < 5) return v; return /صغير|ضعيف/.test(n) ? (c ? 0.1 : 0.2) : /متوسط/.test(n) ? (c ? 0.3 : 0.5) : /كبير|قوي/.test(n) ? (c ? 0.5 : 0.8) : null; }
    }
  };
  function readLevel(n) { return /(ترتيبي|رتب|ترتيب)/.test(n) ? 'ordinal' : /(فيات|فءات|فئات|فئوي|فيوي|اسمي|نعم ولا|ناجح|تكرار|نسب)/.test(n) ? 'nominal' : /(كمي|درجه|درجات|مقياس|متوسط|رقم|فتري|نسبي)/.test(n) ? 'scale' : null; }
  function readPaired(n) { return /(قبلي|بعدي|قبل وبعد|نفس الافراد|نفس الطلاب|نفس الاطفال|مرتبط|متكرر|ازواج)/.test(n) ? 'rel' : /(مختلفين|مستقلتين|مستقله|مستقلين|تجريبيه وضابطه|ضابطه|ذكور واناث|بنين وبنات)/.test(n) ? 'ind' : null; }
  function readGroups(n) {
    if (/(تلات|ثلاث|اربع|خمس|اكتر من مجموعتين|اكثر من مجموعتين|3 مجموعات|4 مجموعات|5 مجموعات|3 قياسات|تتبعي)/.test(n)) return /اربع|4/.test(n) ? 'g4' : /خمس|5/.test(n) ? 'g5' : 'g3';
    if (/(مجموعتين|مجموعتان|تجريبيه وضابطه|ذكور واناث|بنين وبنات|قبلي وبعدي|قبل وبعد|قياسين)/.test(n)) return 'g2';
    return null;
  }

  /* Tools whose arguments are gathered one question at a time. `need` lists the slots in the order asked. */
  var FLOWS = {
    create_project: { need: ['title'] },
    set_project_field: { need: ['project', 'value'] },
    add_variable: { need: ['project', 'name', 'role', 'level'] },
    recommend_adhoc: { need: ['kind', 'paired', 'dv'], skip: function (a, s) { return s === 'paired' && a.kind === 'rel2'; } },
    sample_size: { need: ['stest', 'effect'] }
  };
  function proceed(flow, args) {
    var f = FLOWS[flow], i, s, key;
    for (i = 0; i < f.need.length; i++) {
      s = f.need[i]; key = s === 'stest' ? 'test' : s;
      if (f.skip && f.skip(args, s)) continue;
      if (args[key] == null || args[key] === '') {
        if (s === 'project') { var q = askProject(flow, args); return q; }
        return { text: SLOTS[s].ask, chips: SLOTS[s].chips, pend: { tool: flow, args: args, slot: s }, src: 'ask' };
      }
    }
    return finish(flow, args);
  }
  function finish(flow, args) {
    if (flow === 'recommend_adhoc') {
      var k = args.kind, a2 = { dv_level: args.dv, iv_level: k === 'rel2' ? (args.dv === 'nominal' ? 'nominal' : 'scale') : 'nominal', groups: k === 'rel2' ? 0 : +k.slice(1), paired: args.paired || 'ind' };
      if (k === 'rel2' && args.dv === 'ordinal') a2.iv_level = 'ordinal';
      return { call: { tool: 'recommend_test', args: a2 } };
    }
    return { call: { tool: flow, args: args } };
  }

  function kbReply(d, lead) { ctx.last = d.title; return { text: (lead || '') + d.answer, links: d.go ? [{ label: 'افتح: ' + (SECTIONS[d.go.slice(1)] || 'القسم'), hash: d.go }] : [], title: d.title, src: 'kb', kb: d.id }; }
  function related(id, q) { return search(q, 4).filter(function (r) { return r.doc.id !== id && r.score > 2.2; }).slice(0, 2).map(function (r) { return r.doc.title; }); }

  /* Returns { text, chips, links, src } or { call: { tool, args } } for the page to run (with confirmation when it changes data). */
  function think(raw, env) { var r = think0(raw, env); ctx.pending = r.pend || null; return r; }
  function think0(raw, env) {
    var n = norm(raw), p, v, m;
    env = env || {};
    /* safety first, before any pending question */
    if (has(n, RE.selfHard) || (has(n, RE.selfSoft) && !has(n, RE.research))) { ctx.pending = null; return { text: KBD.crisis.self, src: 'safety', crisis: true }; }
    if (has(n, RE.harm) && has(n, RE.childWord)) { ctx.pending = null; return { text: KBD.crisis.child, src: 'safety', crisis: true }; }

    if (ctx.pending) {
      var pd = ctx.pending, slot = SLOTS[pd.slot], key = pd.slot === 'stest' ? 'test' : pd.slot;
      if (has(n, RE.no)) { ctx.pending = null; return { text: 'تمام، لغيتها. لو حبيت نرجع لها قولّي.', src: 'ask' }; }
      v = slot.read(raw, n, pd.args);
      if (v != null) { pd.args[key] = v; ctx.pending = null; return proceed(pd.tool, pd.args); }
      if (pd.tries || looksNew(n)) ctx.pending = null;
      else { pd.tries = 1; return { text: 'مفهمتش ردّك. ' + slot.ask, chips: pd.slot === 'project' ? S().projects.slice(0, 5).map(function (x) { return pname(x); }) : slot.chips, pend: pd, src: 'ask' }; }
    }

    if (has(n, RE.selfSoft)) return { text: 'لو السؤال ده عنك أو عن حد قريب منك: خط الصحة النفسية 16328 أو 08008880700، والإسعاف 123.\n\nولو هو سؤال بحثي: أنا مش بألّف مراجع، فالأحسن تدوّر في مستكشف الأدبيات، واتأكد إن أدواتك فيها بروتوكول واضح للتعامل مع أي مشارك في خطر، وإن لجنة الأخلاقيات وافقت عليه.', links: [{ label: 'مستكشف الأدبيات', hash: '#explore' }], src: 'safety' };
    if (has(n, RE.diag) && (has(n, RE.childWord) || env.role === 'parent' || /(عندي|انا)/.test(n))) return kbReply(entry('c-nodx'));
    if (has(n, RE.write)) return kbReply(entry('w-own'));
    if (has(n, RE.reading) && !has(n, /(ضيف|اضف|احفظ|سجل|زود)/)) { var rd = mem().reading; return { text: rd.length ? 'في قايمة القراءة ' + rd.length + ':\n' + rd.slice(0, 8).map(function (x) { return '- ' + x.title; }).join('\n') : 'قايمة القراءة فاضية. قولّي «ضيف لقايمة القراءة: العنوان» وأنا أحفظه.', src: 'tool' }; }
    if (has(n, RE.reading)) { v = afterColon(raw) || quoted(raw); m = /(https?:\/\/\S+)/.exec(raw); if (v && m) v = v.replace(m[1], '').trim(); if (!v) return { text: 'اكتب العنوان بعد نقطتين، زي: ضيف لقايمة القراءة: عنوان البحث', src: 'ask' }; return { call: { tool: 'add_reading', args: { title: v, url: m ? m[1] : '' } } }; }
    if (has(n, RE.refs) || (m = RE.find.exec(n)) && !/(نظريات|النظريات|مكتبه النظريات)/.test(n)) {
      v = afterWord(raw, 'عن|على') || '';
      return { text: 'أنا مش بألّف مراجع ولا بكتب دراسات من الذاكرة، علشان ميطلعش مرجع مش موجود. اللي ينفع: تدوّر في مستكشف الأدبيات وهو بيجيب أبحاث حقيقية بروابطها.', links: [v ? { label: 'دوّر عن «' + clip(v, 40) + '»', hash: '#explore/search/' + encodeURIComponent(clip(v, 120)) } : { label: 'مستكشف الأدبيات', hash: '#explore' }], src: 'unknown' };
    }
    if (m && /(نظريات|النظريات)/.test(n)) return { call: { tool: 'search_theories', args: { query: afterWord(raw, 'عن') || raw } } };

    if (has(n, RE.size) && !/(عاملي|تحليل عاملي)/.test(n) && !/^(يعني ايه|ايه هو|ما هو)/.test(n)) {
      var sa = {}; v = SLOTS.stest.read(raw, n); if (v) sa.test = v;
      m = /(?:d|r|اثر|الاثر|ارتباط)\s*=?\s*(\d*\.\d+)/.exec(n); if (m) sa.effect = parseFloat(m[1]);
      else if (sa.test && /(صغير|متوسط|كبير)/.test(n)) sa.effect = SLOTS.effect.read(raw, n, sa);
      m = /(?:قوه|power)\s*=?\s*(0?\.\d+|\d{2})/.exec(n); if (m) { v = parseFloat(m[1]); sa.power = v > 1 ? v / 100 : v; }
      m = /(?:الفا|alpha)\s*=?\s*(0?\.\d+)/.exec(n); if (m) sa.alpha = parseFloat(m[1]);
      return proceed('sample_size', sa);
    }
    if (has(n, RE.test)) {
      p = /(مشروع|مشروعي)/.test(n) || !readGroups(n) && !/(علاقه|ارتباط)/.test(n) ? projectFrom(n) : null;
      if (p && recommend(p)) return { call: { tool: 'recommend_test', args: { project: p.id } } };
      var ra = {}; v = SLOTS.kind.read(raw, n); if (v) ra.kind = v;
      v = readPaired(n); if (v) ra.paired = v;
      if (ra.kind === 'rel2' && !readLevel(n.replace(/علاقه|ارتباط/g, ''))) ra.dv = /(ترتيبي|رتب)/.test(n) ? 'ordinal' : 'scale';
      v = readLevel(n.replace(/مقياس/g, '')); if (v) ra.dv = v;
      return proceed('recommend_adhoc', ra);
    }
    if (has(n, RE.create)) { v = quoted(raw) || afterColon(raw) || afterWord(raw, 'بعنوان|عنوانه|اسمه|عن'); return proceed('create_project', v ? { title: v } : {}); }
    if (has(n, RE.suggest)) return suggest(n);
    if (has(n, RE.addVar)) {
      var va = {}; p = projectFrom(n); if (p) va.project = p.id;
      v = quoted(raw) || afterColon(raw) || afterWord(raw, 'اسمه|باسم'); if (v) va.name = v;
      v = SLOTS.role.read(raw, n.replace(/متغير/g, '')); if (v) va.role = v;
      v = readLevel(n); if (v) va.level = v;
      m = readGroups(n); if (m && va.level !== 'scale') va.groups = +m.slice(1);
      return proceed('add_variable', va);
    }
    if (has(n, RE.abc) && has(n, RE.make)) return { call: { tool: 'draft_abc', args: {} } };
    if (has(n, RE.five) && has(n, RE.make)) return { call: { tool: 'draft_5ps', args: {} } };
    if (has(n, RE.setF)) {
      for (var i = 0; i < FIELD_WORDS.length; i++) if (FIELD_WORDS[i][1].test(n)) {
        var fa = { field: FIELD_WORDS[i][0], mode: /^(ضيف|اضف)/.test(n) ? 'append' : 'replace' };
        p = projectFrom(n); if (p) fa.project = p.id;
        v = afterColon(raw) || quoted(raw); if (v) fa.value = v;
        return proceed('set_project_field', fa);
      }
    }
    if (has(n, RE.open)) {
      for (var j = 0; j < SECTION_WORDS.length; j++) if (SECTION_WORDS[j][1].test(n)) {
        p = SECTION_WORDS[j][0] === 'projects' ? projectFrom(n) : null;
        return { call: { tool: 'open_section', args: p && /مشروع/.test(n) && !/مشاريعي|المشاريع/.test(n) ? { project: p.id } : { section: SECTION_WORDS[j][0] } } };
      }
    }
    if (has(n, RE.state)) return { call: { tool: 'get_state', args: {} } };
    if (has(n, RE.who)) return kbReply(entry('p-assistant'));
    if (has(n, RE.thanks)) return { text: 'العفو. لو فيه حاجة تانية في البحث أنا موجود.', src: 'chat' };
    if (has(n, RE.hello) && tokens(raw).length <= 3) return { text: 'أهلاً بيك. قولّي واقف فين في شغلك، أو اختار حاجة من دول:', chips: starters(env.role).slice(0, 3), src: 'chat' };

    /* knowledge base, with the previous topic as context for short follow-ups */
    var qt = tokens(raw), r = search(raw, 3);
    if (ctx.last && qt.length <= 3 && (!r.length || r[0].score < 4.2)) { var r2 = search(ctx.last + ' ' + raw, 3); if (r2.length && (!r.length || r2[0].score > r[0].score)) r = r2; }
    if (r.length) {
      var top = r[0], sure = top.score >= 5.2 && top.cover >= 0.5 && top.strong >= 1 || top.score >= 3.4 && top.cover >= 0.66 && top.strong >= 1;
      if (sure) { var rep = kbReply(top.doc); rep.chips = related(top.doc.id, raw); return rep; }
      if (top.score >= 2.6 && top.strong >= 1) { var rep2 = kbReply(top.doc, 'مش متأكد إني فهمت سؤالك بالظبط. أقرب حاجة عندي عن «' + top.doc.title + '»:\n\n'); rep2.src = 'kb-weak'; rep2.chips = r.slice(1).filter(function (x) { return x.score >= 2.2; }).map(function (x) { return x.doc.title; }); return rep2; }
    }
    return unknown(raw);
  }
  function looksNew(n) { return ['size', 'test', 'create', 'suggest', 'addVar', 'open', 'state', 'who', 'reading', 'refs'].some(function (k) { return RE[k].test(n); }) || n.split(' ').length > 9; }
  function unknown(raw) {
    return {
      text: 'معنديش إجابة موثوقة عن ده في الوضع الحالي، ومش هخمّن. أنا شغّال دلوقتي بقاعدة معرفة عن استخدام المنصة والمنهج والإحصاء والقياس.\n\nجرّب تكتب السؤال بكلمة المصطلح نفسه (زي: الثبات، حجم الأثر، ANOVA)، أو دوّر عنه في الأدبيات.',
      links: [{ label: 'دوّر في الأدبيات', hash: '#explore/search/' + encodeURIComponent(clip(raw, 120)) }], chips: ['تقدر تساعدني في إيه؟'], src: 'unknown'
    };
  }
  /* Drafts a hypothesis frame from the project's own variables; the user edits and confirms it. */
  function suggest(n) {
    var p = projectFrom(n), isQ = /(سوال|اسيله|اسءله)/.test(n);
    if (!p) p = S().projects[0];
    if (!p) return { text: 'علشان أقترح صياغة محتاج مشروع فيه متغير مستقل ومتغير تابع. نعمل مشروع؟ قولّي عنوانه.', pend: { tool: 'create_project', args: {}, slot: 'title' }, src: 'ask' };
    var iv = (p.vars || []).filter(function (v) { return v.role === 'iv' && v.name; })[0], dv = (p.vars || []).filter(function (v) { return v.role === 'dv' && v.name; })[0];
    if (!iv || !dv) return { text: 'مشروع «' + pname(p) + '» لسه مفيهوش متغير مستقل ومتغير تابع. اكتبهم الأول وأنا أقترح قالب من أسمائهم، وإنت تعدّله.', links: [{ label: 'جدول المتغيرات', hash: '#project/' + p.id + '/variables' }], src: 'ask' };
    var text, cat = iv.level !== 'scale';
    if (isQ) text = cat ? 'هل توجد فروق في ' + dv.name + ' ترجع إلى ' + iv.name + '؟' : 'هل توجد علاقة بين ' + iv.name + ' و' + dv.name + '؟';
    else text = cat ? 'توجد فروق ذات دلالة إحصائية في ' + dv.name + ' ترجع إلى ' + iv.name + '.' : 'توجد علاقة ذات دلالة إحصائية بين ' + iv.name + ' و' + dv.name + '.';
    ctx.project = p.id;
    return { call: { tool: 'set_project_field', args: { project: p.id, field: isQ ? 'q' : 'h', value: text, mode: 'append' } }, lead: 'ده قالب مبني على متغيراتك، مش صياغة نهائية. لو النظرية أو الدراسات السابقة بتدعم اتجاه معيّن، خلّيه موجّه واكتب الاتجاه بنفسك.' };
  }
  function setPending(p) { ctx.pending = p || null; }
  function noteProject(id) { if (id) ctx.project = id; }

  var STARTERS = {
    researcher: ['أنهي اختبار إحصائي مناسب لبحثي؟', 'احسب حجم العينة', 'اعمل مشروع جديد', 'أكتب نتيجة اختبار t بأسلوب APA إزاي؟', 'إيه الفرق بين الوسيط والمعدِّل؟'],
    student: ['يعني إيه حجم الأثر؟', 'إزاي أكتب فرض صح؟', 'إيه الفرق بين الثبات والصدق؟', 'اعمل مشروع جديد', 'إمتى أستخدم ANOVA؟'],
    specialist: ['جهّز سجل ABC', 'جهّز صياغة حالة 5Ps', 'إزاي أكتب ملاحظة عن طفل؟', 'تصميم الحالة الواحدة', 'إيه الفرق بين المسح والتشخيص؟'],
    parent: ['إمتى أروح لمتخصص؟', 'ألعاب تدريب المخ بتزوّد الذكاء؟', 'إزاي أسجّل ابني في المنصة؟', 'القراءة مع الطفل', 'ليه المنصة مش بتشخّص؟']
  };
  function starters(role) { return STARTERS[role] || STARTERS.researcher; }

  /* ================= privacy: names never leave the device ================= */
  function nameMap() {
    var s = S(), map = [], seen = {};
    function add(name, code) { name = String(name || '').trim(); if (name.length < 2 || seen[name]) return; seen[name] = 1; map.push([name, code]); name.split(/\s+/).forEach(function (part) { if (part.length >= 3 && !seen[part]) { seen[part] = 1; map.push([part, code]); } }); }
    s.kids.forEach(function (k, i) { add(k.child, 'طفل-' + (i + 1)); add(k.guardian, 'ولي-أمر-' + (i + 1)); });
    add((s.profile || {}).name, 'المستخدم');
    map.sort(function (a, b) { return b[0].length - a[0].length; });
    return map;
  }
  function escRe(x) { return x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
  function redact(text, map) {
    var t = String(text == null ? '' : text);
    (map || nameMap()).forEach(function (m) { t = t.replace(new RegExp(escRe(m[0]), 'g'), m[1]); });
    return t.replace(/[\w.+-]+@[\w-]+\.[\w.-]+/g, '[بريد محذوف]').replace(/(?:\+?20|0)1[0125]\d{8}/g, '[رقم محذوف]').replace(/\b\d{14}\b/g, '[رقم محذوف]');
  }
  function restore(text, map) {
    var t = String(text == null ? '' : text), done = {};
    (map || nameMap()).forEach(function (m) { if (done[m[1]]) return; done[m[1]] = 1; t = t.split(m[1]).join(m[0]); });
    return t;
  }
  /* Local check that needs no model: flags reference-looking text in a model answer. */
  function refFlags(text) {
    var t = String(text || ''), out = [];
    if (/\b10\.\d{4,9}\/\S+/.test(t) || /doi\.org/i.test(t)) out.push('فيه DOI في الإجابة. افتحه واتأكد إنه بيودّي لنفس البحث قبل ما تستخدمه.');
    if (/\(\s*[A-Zء-ي][^()]{1,40}[,،]\s*(19|20)\d{2}[a-z]?\s*\)/.test(t) || /\b[A-Z][a-z]+ (and|&) [A-Z][a-z]+,? \(?(19|20)\d{2}/.test(t) || /et al\./.test(t)) out.push('فيه مراجع مذكورة. المساعد ممكن يغلط في الأسماء والسنين، فراجعها من مصدرها قبل ما تكتبها.');
    return out;
  }
  function crisisIn(text) { var n = norm(text); return has(n, RE.selfHard) ? 'self' : has(n, RE.harm) && has(n, RE.childWord) ? 'child' : has(n, RE.selfSoft) && !has(n, RE.research) ? 'self' : ''; }

  /* ================= model client ================= */
  var ERR = {
    quota_exceeded: 'خلصت حصة النهارده من النموذج. كمّل دلوقتي بالوضع بدون اتصال، وارجع بكرة.',
    rate_limited: 'الطلبات ورا بعض بسرعة. استنى دقيقة وجرّب تاني.',
    origin_not_allowed: 'الخادم رافض العنوان اللي الموقع شغّال منه. صاحب المنصة محتاج يضيفه في إعدادات الخادم.',
    auth_invalid: 'بيانات الدخول مش مقبولة. اخرج وادخل تاني، أو راجع المفتاح.',
    too_large: 'الرسالة أو المحادثة طويلة قوي. قصّرها أو ابدأ محادثة جديدة.',
    bad_request: 'الخادم مفهمش الطلب. ممكن يكون إصداره أقدم من الموقع.',
    provider_unavailable: 'النموذج مش متاح دلوقتي. جرّب بعد شوية، أو كمّل بالوضع بدون اتصال.',
    refused: 'النموذج اعتذر عن الرد على الطلب ده.',
    network: 'مفيش اتصال بالخادم. اتأكد من النت أو من عنوان الخادم في الإعدادات.',
    blocked: 'المتصفح منع الاتصال بالعنوان ده. إعدادات أمان الموقع محتاجة تسمح بيه.',
    not_configured: 'لسه مفيش خادم أو مفتاح متسجل في الإعدادات.',
    unknown: 'حصلت مشكلة مش متوقعة مع النموذج.'
  };
  function toolSpecs() { return TOOLS.map(function (t) { return { name: t.name, description: t.description, parameters: t.parameters }; }); }
  function fail(code, extra) { var e = new Error(code); e.code = ERR[code] ? code : 'unknown'; e.say = ERR[e.code]; if (extra) e.extra = extra; return e; }

  /* One round with the configured endpoint. onDelta receives text as it streams. Resolves { text, calls, meta }. */
  function askWorker(cfg, body, onDelta, signal) {
    var headers = { 'content-type': 'application/json', accept: 'text/event-stream' };
    if (cfg.token) headers.authorization = 'Bearer ' + cfg.token;
    if (cfg.client) headers['x-client-id'] = cfg.client;
    return fetch(cfg.base.replace(/\/+$/, '') + '/v1/chat', { method: 'POST', headers: headers, body: JSON.stringify(body), signal: signal }).then(function (res) {
      if (!res.ok) return res.json().catch(function () { return {}; }).then(function (j) { throw fail((j.error || {}).code || (res.status === 429 ? 'rate_limited' : res.status >= 500 ? 'provider_unavailable' : 'bad_request')); });
      var out = { text: '', calls: [], meta: {} };
      function onEvent(ev) {
        if (ev.type === 'delta' && ev.text) { out.text += ev.text; if (onDelta) onDelta(ev.text); }
        else if (ev.type === 'tool_call') out.calls.push({ id: ev.id || H.uid(), name: ev.name, args: ev.args || {}, meta: ev.meta });
        else if (ev.type === 'done') out.meta = ev;
        else if (ev.type === 'error') throw fail(ev.code);
      }
      if (!res.body || !res.body.getReader) return res.text().then(function (t) { parseSse(t + '\n\n', onEvent); return out; });
      var reader = res.body.getReader(), dec = new TextDecoder(), buf = '';
      return (function pump() {
        return reader.read().then(function (r) {
          buf += dec.decode(r.value || new Uint8Array(), { stream: !r.done });
          var cut = buf.lastIndexOf('\n\n');
          if (cut > -1) { parseSse(buf.slice(0, cut + 2), onEvent); buf = buf.slice(cut + 2); }
          if (r.done) { if (buf.trim()) parseSse(buf + '\n\n', onEvent); return out; }
          return pump();
        });
      })();
    }, function (e) { throw e && e.name === 'AbortError' ? e : fail('network'); });
  }
  function parseSse(chunk, onEvent) {
    chunk.split(/\r?\n\r?\n/).forEach(function (block) {
      var data = block.split(/\r?\n/).filter(function (l) { return l.indexOf('data:') === 0; }).map(function (l) { return l.slice(5).trim(); }).join('');
      if (!data || data === '[DONE]') return;
      var ev; try { ev = JSON.parse(data); } catch (e) { return; }
      onEvent(ev);
    });
  }

  /* Direct calls with the user's own key. Used only when the site's security policy lists the provider's host. */
  var BYOK = {
    gemini: { host: 'https://generativelanguage.googleapis.com', model: 'gemini-flash-latest', label: 'Gemini' },
    claude: { host: 'https://api.anthropic.com', model: 'claude-opus-5-5', label: 'Claude' }
  };
  function askDirect(cfg, body, onDelta, signal) {
    var P = window.HubAssistantPrompt, sys = P.system + '\n\nدور المستخدم: ' + (ROLE_AR[body.role] || 'غير محدد') + '.', req, url, headers;
    if (cfg.provider === 'gemini') {
      url = BYOK.gemini.host + '/v1beta/models/' + encodeURIComponent(cfg.model || BYOK.gemini.model) + ':generateContent';
      headers = { 'content-type': 'application/json', 'x-goog-api-key': cfg.key };
      req = {
        systemInstruction: { parts: [{ text: sys }] }, generationConfig: { maxOutputTokens: 1024 },
        tools: [{ functionDeclarations: body.tools.map(function (t) { var p = JSON.parse(JSON.stringify(t.parameters)); delete p.additionalProperties; return Object.keys(p.properties).length ? { name: t.name, description: t.description, parameters: p } : { name: t.name, description: t.description }; }) }],
        contents: body.messages.map(function (m) {
          if (m.role === 'tool') return { role: 'user', parts: [{ functionResponse: { name: m.name, response: { result: m.content } } }] };
          if (m.role === 'assistant') return { role: 'model', parts: (m.content ? [{ text: m.content }] : []).concat((m.tool_calls || []).map(function (c) { var part = { functionCall: { name: c.name, args: c.args } }; if (c.meta && c.meta.thoughtSignature) part.thoughtSignature = c.meta.thoughtSignature; return part; })) };
          return { role: 'user', parts: [{ text: m.content }] };
        })
      };
    } else {
      url = BYOK.claude.host + '/v1/messages';
      headers = { 'content-type': 'application/json', 'x-api-key': cfg.key, 'anthropic-version': '2026-10-21', 'anthropic-dangerous-direct-browser-access': 'true' };
      var msgs = [];
      body.messages.forEach(function (m) {
        var last = msgs[msgs.length - 1];
        if (m.role === 'tool') { var blk = { type: 'tool_result', tool_use_id: m.tool_call_id, content: m.content }; if (last && last.role === 'user' && Array.isArray(last.content) && last.content[0].type === 'tool_result') last.content.push(blk); else msgs.push({ role: 'user', content: [blk] }); }
        else if (m.role === 'assistant') msgs.push({ role: 'assistant', content: (m.raw && m.raw.length ? m.raw : (m.content ? [{ type: 'text', text: m.content }] : []).concat((m.tool_calls || []).map(function (c) { return { type: 'tool_use', id: c.id, name: c.name, input: c.args }; }))) });
        else msgs.push({ role: 'user', content: m.content });
      });
      req = { model: cfg.model || BYOK.claude.model, max_tokens: 4096, system: sys, messages: msgs, output_config: { effort: 'low' }, tools: body.tools.map(function (t) { return { name: t.name, description: t.description, input_schema: t.parameters }; }) };
    }
    return fetch(url, { method: 'POST', headers: headers, body: JSON.stringify(req), signal: signal }).then(function (res) {
      return res.json().catch(function () { return {}; }).then(function (j) {
        if (!res.ok) throw fail(res.status === 401 || res.status === 403 ? 'auth_invalid' : res.status === 429 ? 'quota_exceeded' : res.status === 413 ? 'too_large' : res.status >= 500 ? 'provider_unavailable' : 'bad_request');
        var out = { text: '', calls: [], meta: { provider: cfg.provider, model: req.model || cfg.model || BYOK.gemini.model } };
        if (cfg.provider === 'gemini') {
          (((j.candidates || [])[0] || {}).content || {}).parts && j.candidates[0].content.parts.forEach(function (p) {
            if (p.text && !p.thought) out.text += p.text;
            if (p.functionCall) out.calls.push({ id: H.uid(), name: p.functionCall.name, args: p.functionCall.args || {}, meta: p.thoughtSignature ? { thoughtSignature: p.thoughtSignature } : undefined });
          });
        } else {
          if (j.stop_reason === 'refusal') throw fail('refused');
          out.raw = j.content || [];
          out.raw.forEach(function (b) { if (b.type === 'text') out.text += b.text; if (b.type === 'tool_use') out.calls.push({ id: b.id, name: b.name, args: b.input || {} }); });
        }
        if (out.text && onDelta) onDelta(out.text);
        return out;
      });
    }, function (e) { throw e && e.name === 'AbortError' ? e : fail('network'); });
  }

  /* The agent loop. io: { delta(text), confirm(tool, args) -> Promise<bool>, status(text), tool(name, result) }. */
  function agent(cfg, history, io, signal) {
    var map = nameMap(), msgs = history.map(function (m) { return { role: m.role, content: redact(m.content, map) }; }), rounds = 0, usedTools = [];
    var role = S().role || '', ask = cfg.mode === 'byok' ? askDirect : askWorker;
    function round() {
      if (++rounds > 5) return Promise.resolve({ text: 'وقفت هنا علشان الطلب خد خطوات كتير. قولّي أكمّل في أنهي جزء.', usedTools: usedTools, meta: {} });
      var body = { v: 1, stream: true, role: role, messages: msgs, tools: toolSpecs() };
      return ask(cfg, body, function (d) { io.delta(restore(d, map)); }, signal).then(function (out) {
        if (!out.calls.length) return { text: restore(out.text, map), usedTools: usedTools, meta: out.meta };
        msgs.push({ role: 'assistant', content: out.text || '', tool_calls: out.calls, raw: out.raw || out.meta.raw });
        if (out.text) io.delta('\n\n');
        return out.calls.reduce(function (chain, c) {
          return chain.then(function () {
            var t = BY[c.name], args = c.args && typeof c.args === 'object' ? c.args : {};
            Object.keys(args).forEach(function (k) { if (typeof args[k] === 'string') args[k] = restore(args[k], map); });
            var bad = t ? validate(t, args) : 'tool';
            if (bad) { msgs.push({ role: 'tool', tool_call_id: c.id, name: c.name, content: JSON.stringify({ ok: false, error: 'invalid_' + bad }) }); return; }
            var go = t.mutates ? io.confirm(t, args) : Promise.resolve(true);
            return go.then(function (yes) {
              if (!yes) { msgs.push({ role: 'tool', tool_call_id: c.id, name: c.name, content: JSON.stringify({ ok: false, error: 'user_declined' }) }); return; }
              io.status(c.name);
              return runTool(c.name, args).then(function (r) {
                usedTools.push(c.name); io.tool(c.name, r);
                msgs.push({ role: 'tool', tool_call_id: c.id, name: c.name, content: redact(JSON.stringify({ ok: r.ok, result: r.data, shown_to_user: clip(r.say, 600) }), map) });
              });
            });
          });
        }, Promise.resolve()).then(round);
      });
    }
    return round();
  }
  function redTeam(cfg, question, answer, signal) {
    if (cfg.mode !== 'worker') return Promise.resolve(null);
    var headers = { 'content-type': 'application/json' }; if (cfg.token) headers.authorization = 'Bearer ' + cfg.token; if (cfg.client) headers['x-client-id'] = cfg.client;
    return fetch(cfg.base.replace(/\/+$/, '') + '/v1/check', { method: 'POST', headers: headers, body: JSON.stringify({ v: 1, question: redact(question), answer: redact(answer) }), signal: signal })
      .then(function (r) { return r.ok ? r.json() : null; }).then(function (j) { return j && j.verdict === 'flag' && Array.isArray(j.issues) ? j.issues.slice(0, 3).map(function (x) { return clip(x, 220); }) : j && j.verdict === 'pass' ? [] : null; }).catch(function () { return null; });
  }

  window.HubAssistantCore = {
    norm: norm, tokens: tokens, search: search, entry: entry, sampleSize: sampleSize, tPower: tPower, recommend: recommend,
    tools: TOOLS, tool: function (n) { return BY[n]; }, runTool: runTool, validate: validate, toolSpecs: toolSpecs,
    think: think, setPending: setPending, noteProject: noteProject, reset: reset, starters: starters, proceed: proceed,
    nameMap: nameMap, redact: redact, restore: restore, refFlags: refFlags, crisisIn: crisisIn,
    agent: agent, redTeam: redTeam, errors: ERR, byok: BYOK, roles: ROLE_AR, sections: SECTIONS, mem: mem, clip: clip, count: DOCS.length
  };
})();
