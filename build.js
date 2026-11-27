/* Lazy chunk loaded by app.js (loadChunk) on first visit to its route. Scale builder routes (#build, #respond, #form-*, #qbuild, #take/*): AUD, BUILD, QUICK, THESIS.
   Shares the global scope of app.js (C, S, $, PSY, VIEWS, ACCT, ...). Moved verbatim from app.js. */
/* ===== Audience adaptation: age group / generation × language register, without breaking measurement =====
   Shared by the scales lab and the statistics lab. Rules:
   - wording may change; the construct, the item's direction (positive/negative), the number of response points and the
     time frame may not — otherwise the versions measure different things and cannot be compared;
   - every adapted version is checked automatically here, then empirically after data collection (DIF / invariance).
   Generation labels are birth cohorts (approximate); what drives wording is reading level and life context. */
var AUD = (function () {
  var PROFILES = [
    { id: 'alpha', t: 'الأطفال 8–12 سنة', g: 'جيل ألفا (مواليد 2013 وما بعدها)', maxW: 9, neg: false, pts: [3, 4], ctx: 'المدرسة، والبيت، والأصدقاء، والألعاب', tips: ['جمل قصيرة جدًا (أقل من 9 كلمات) وكلمات مألوفة', 'تجنب النفي والعبارات المعكوسة؛ الأطفال يخطئون في فهمها', 'تدريج من 3 نقاط بكلمات بسيطة أو وجوه', 'زمن قريب ومحدد: «هذا الأسبوع» بدل «عادةً»', 'اقرأ العبارات بصوت مرتفع للصغار'] },
    { id: 'teen', t: 'المراهقون 13–17 سنة', g: 'جيل Z (مواليد 1997–2012)', maxW: 12, neg: true, pts: [4, 5], ctx: 'المدرسة، والأصدقاء، ووسائل التواصل، والأسرة', tips: ['جمل قصيرة (حتى 12 كلمة)', 'عبارات سالبة قليلة وواضحة، ولا نفي مزدوج', 'لغة غير وعظية ولا تبدو كأسئلة الكبار', 'أكّد السرية: المراهقون أكثر حساسية للمرغوبية الاجتماعية'] },
    { id: 'youth', t: 'الشباب 18–28 سنة', g: 'جيل Z (مواليد 1997–2012)', maxW: 15, neg: true, pts: [5, 7], ctx: 'الجامعة، والعمل الأول، والعلاقات، والحياة الرقمية', tips: ['جمل مباشرة (حتى 15 كلمة)', 'التدريج الخماسي مناسب', 'الأمثلة الرقمية مقبولة في التعليمات لا في العبارات'] },
    { id: 'millennial', t: 'البالغون 29–44 سنة', g: 'جيل الألفية Y (مواليد 1981–1996)', maxW: 18, neg: true, pts: [5, 7], ctx: 'العمل، والأسرة، والأبوة والأمومة', tips: ['الصياغة القياسية مناسبة', 'راعِ ضيق الوقت: مقياس أقصر يرفع جودة الاستجابة'] },
    { id: 'genx', t: 'منتصف العمر 45–60 سنة', g: 'الجيل X (مواليد 1965–1980)', maxW: 16, neg: true, pts: [4, 5], ctx: 'العمل، والأسرة، والصحة', tips: ['فصحى ميسرة غالبًا أوضح من العامية في السياق الرسمي', 'تجنب المصطلحات الرقمية الحديثة غير الشائعة', 'خط أكبر وتباعد مريح'] },
    { id: 'older', t: 'كبار السن 60+ سنة', g: 'جيل الطفرة وما قبله (مواليد قبل 1965)', maxW: 12, neg: false, pts: [3, 4], ctx: 'الصحة، والأسرة، والأنشطة اليومية', tips: ['جمل قصيرة وخط كبير', 'تجنب العبارات المعكوسة؛ تزيد أخطاء الاستجابة', 'تدريج من 3 أو 4 نقاط بكلمات واضحة', 'يمكن التطبيق بالمقابلة بدل الورقة'] }
  ];
  var REGISTERS = [
    { id: 'fusha', t: 'فصحى رسمية', d: 'للمقاييس المقننة والبحوث المنشورة' },
    { id: 'easy', t: 'فصحى ميسرة', d: 'فصحى بكلمات شائعة وتراكيب قصيرة؛ الأنسب لمعظم الفئات' },
    { id: 'ammiya', t: 'عامية مصرية', d: 'أقرب للغة الحياة اليومية؛ مناسبة للأطفال والمراهقين والاستبيانات غير الرسمية' }
  ];
  // phrase-level dictionary (longest first). Output always needs human review.
  var EASY = [['يصعب عليّ', 'من الصعب عليّ'], ['في كثير من الأحيان', 'كثيرًا'], ['لديّ', 'عندي'], ['لدي', 'عندي'], ['المحيطون بي', 'من حولي'], ['أدائي الدراسي', 'دراستي'], ['المهام', 'الأعمال المطلوبة'], ['أتجنب', 'أبتعد عن'], ['أستطيع', 'أقدر'], ['عندما', 'لما']];
  var AMM = [
    ['لا أستطيع', 'مش قادر'], ['ليست لديّ', 'معنديش'], ['ليست لدي', 'معنديش'], ['في كثير من', 'في كتير من'], ['المواقف اليومية', 'مواقف كل يوم'], ['لا أقدر', 'مش قادر'], ['ليس لديّ', 'معنديش'], ['ليس لدي', 'معنديش'], ['في كثير من الأحيان', 'كتير'], ['في المواقف اليومية', 'في يومي'],
    ['يصعب عليّ', 'صعب عليا'], ['أجد صعوبة في', 'بلاقي صعوبة في'], ['يلاحظ المحيطون بي', 'اللي حواليا بياخدوا بالهم من'], ['المحيطون بي', 'اللي حواليا'],
    ['أشعر بالضيق', 'بتضايق'], ['أشعر بأنني', 'بحس إني'], ['أشعر أنني', 'بحس إني'], ['أشعر بـ', 'بحس بـ'], ['أشعر', 'بحس'], ['أستطيع', 'أقدر'],
    ['أفكر', 'بفكر'], ['أحب', 'بحب'], ['أتصرف', 'بتصرف'], ['أتذكر', 'فاكر'], ['أؤجل', 'بأجّل'], ['أنشغل', 'بتلهي'], ['أتجنب', 'ببعد عن'], ['أقلق', 'بقلق'], ['أخاف', 'بخاف'],
    ['أنجز', 'بخلّص'], ['أنام', 'بنام'], ['أستيقظ', 'بصحى'], ['أترك', 'بسيب'], ['أبدأ', 'ببدأ'], ['أضع', 'بحط'], ['ألتزم', 'بلتزم'], ['أواجه', 'بواجه'], ['أهرب', 'بهرب'], ['أفاجأ', 'بتفاجئ'],
    ['أجد نفسي', 'بلاقي نفسي'], ['أتمنى', 'نفسي'], ['أريد', 'عايز'], ['يظهر', 'بيبان'], ['يؤثر', 'بيأثر'], ['يستمر', 'بيفضل'], ['تتكرر', 'بتتكرر'],
    ['لديّ', 'عندي'], ['لدي', 'عندي'], ['عندما', 'لما'], ['الذي', 'اللي'], ['التي', 'اللي'], ['الذين', 'اللي'], ['هذا', 'ده'], ['هذه', 'دي'], ['هؤلاء', 'دول'],
    ['كثيرًا', 'كتير'], ['كثيرا', 'كتير'], ['أحيانًا', 'ساعات'], ['أحيانا', 'ساعات'], ['دائمًا', 'دايمًا'], ['جدًا', 'أوي'], ['الآن', 'دلوقتي'], ['كيف', 'إزاي'], ['لماذا', 'ليه'], ['ماذا', 'إيه'],
    ['ليست', 'مش'], ['ليس', 'مش'], ['لست', 'مش'], ['أكثر من غيري', 'أكتر من غيري'], ['أكثر', 'أكتر'], ['أمام', 'قدام'], ['مع ذلك', 'ومع كده'], ['فقط', 'بس'], ['أيضًا', 'كمان']
  ];
  var LABELS = {
    fusha: { 3: ['تنطبق كثيرًا', 'تنطبق أحيانًا', 'لا تنطبق'], 4: ['تنطبق دائمًا', 'تنطبق غالبًا', 'تنطبق نادرًا', 'لا تنطبق أبدًا'], 5: ['تنطبق دائمًا', 'تنطبق غالبًا', 'تنطبق أحيانًا', 'تنطبق نادرًا', 'لا تنطبق أبدًا'] },
    easy: { 3: ['كثيرًا', 'أحيانًا', 'لا'], 4: ['دائمًا', 'غالبًا', 'قليلًا', 'أبدًا'], 5: ['دائمًا', 'غالبًا', 'أحيانًا', 'نادرًا', 'أبدًا'] },
    ammiya: { 3: ['كتير', 'ساعات', 'لأ'], 4: ['دايمًا', 'غالبًا', 'قليل', 'خالص'], 5: ['دايمًا', 'غالبًا', 'ساعات', 'نادرًا', 'خالص'] }
  };
  var AGREE = { fusha: ['أوافق بشدة', 'أوافق', 'محايد', 'أرفض', 'أرفض بشدة'], easy: ['موافق جدًا', 'موافق', 'مش متأكد', 'غير موافق', 'غير موافق أبدًا'], ammiya: ['موافق جدًا', 'موافق', 'مش متأكد', 'مش موافق', 'مش موافق خالص'] };
  var NEG = /(^|\s)(لا|لم|لن|ليس|ليست|لست|غير|عدم|بدون|دون|مش|ما)(\s|$)/;
  function prof(id) { return PROFILES.filter(function (p) { return p.id === id; })[0] || PROFILES[2]; }
  function esc(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
  // whole-word replacement; a first-person verb right after «لم/لن» is left for human review (its negated form differs)
  function swap(text, dict, notes) {
    var t = ' ' + text + ' ';
    dict.slice().sort(function (a, b) { return b[0].length - a[0].length; }).forEach(function (p) {
      var tail = /بـ$/.test(p[0]) ? '' : '(?=$|[\\s.،؟!])';
      t = t.replace(new RegExp('(^|\\s)(لم\\s|لن\\s)?' + esc(p[0]) + tail, 'g'), function (m, sp, neg) {
        if (neg && /^أ/.test(p[0])) { notes && notes.push('negverb'); return m; }
        return sp + (neg || '') + p[1];
      });
    });
    return t.trim();
  }
  function adapt(text, profileId, registerId) {
    var t = String(text || '').replace(/[«»"]/g, ''), notes = [];
    if (registerId === 'ammiya') t = swap(t, AMM, notes); else if (registerId === 'easy') t = swap(t, EASY, notes);
    t = t.replace(/بـ(?=[^\s])/g, 'ب').replace(/\s+/g, ' ').replace(/\s+([.،؟])/g, '$1').trim();
    var w = check(text, t, profileId, registerId);
    if (notes.length) w.push(['warn', 'فيها فعل منفي بـ«لم/لن»؛ صُغه بالعامية يدويًا مع الحفاظ على النفي']);
    if (registerId === 'ammiya' && /(لم|لن|سوف|إنني|لكنني)\s/.test(t)) w.push(['warn', 'ما زالت فيها تراكيب فصحى؛ راجعها']);
    return { text: t, warnings: w };
  }
  // measurement-safety checks between the original and an adapted item
  function check(orig, adapted, profileId, registerId) {
    var w = [], p = prof(profileId), wc = String(adapted).split(/\s+/).filter(Boolean).length, wo = String(orig).split(/\s+/).filter(Boolean).length;
    if (!String(adapted).trim()) return [['bad', 'عبارة فارغة']];
    if (wc > p.maxW) w.push(['warn', 'أطول من المناسب لهذه الفئة (' + wc + ' كلمة؛ الحد ' + p.maxW + ')']);
    if (wo && wc > wo * 1.6 + 2) w.push(['warn', 'أطول كثيرًا من الأصل؛ تأكد أنك لم تضف معنى جديدًا']);
    var negO = NEG.test(' ' + orig + ' '), negA = NEG.test(' ' + adapted + ' ');
    if (negO !== negA) w.push(['bad', 'تغيّر اتجاه العبارة (نفي/إثبات)؛ هذا يغيّر التصحيح ويكسر المقارنة']);
    if (negA && !p.neg) w.push(['warn', 'عبارة منفية لفئة يصعب عليها النفي؛ اكتب بديلًا مثبتًا وعدّل اتجاه التصحيح في كل النسخ']);
    if ((String(adapted).match(/ و/g) || []).length >= 2) w.push(['warn', 'قد تحمل أكثر من فكرة']);
    if (/[؟?]/.test(adapted)) w.push(['warn', 'صيغة سؤال؛ اجعلها عبارة تقريرية']);
    return w;
  }
  function labels(base, profileId, registerId) {
    var n = (base || []).length, isAgree = (base || []).some(function (x) { return /أوافق|موافق|أرفض/.test(x); });
    if (n === 5 && isAgree) return AGREE[registerId] ? AGREE[registerId].slice() : base;
    var L = (LABELS[registerId] || LABELS.fusha)[n];
    return L ? L.slice() : base;
  }
  function instructions(profileId, registerId) {
    var kid = profileId === 'alpha';
    if (registerId === 'ammiya') return kid ? 'هنقرا جمل قصيرة. اختار الإجابة اللي شبهك. مفيش إجابة صح وإجابة غلط.' : 'اقرا كل جملة كويس، واختار الإجابة اللي بتعبّر عنك فعلًا. مفيش إجابة صح وغلط، وإجاباتك سرية.';
    if (registerId === 'easy') return kid ? 'اقرأ كل جملة، واختر الإجابة التي تشبهك. لا توجد إجابة صحيحة وأخرى خاطئة.' : 'اقرأ كل عبارة، واختر الإجابة التي تعبّر عنك. لا توجد إجابات صحيحة أو خاطئة، وإجاباتك سرية.';
    return null;
  }
  function prompt(items, profileId, registerId, construct) {
    var p = prof(profileId), r = REGISTERS.filter(function (x) { return x.id === registerId; })[0] || REGISTERS[0];
    return 'أنت خبير في القياس النفسي وتكييف المقاييس. أعد صياغة عبارات مقياس «' + (construct || 'السمة') + '» لتناسب ' + p.t + ' (' + p.g + ') بلغة: ' + r.t + '.\n' +
      'قواعد إلزامية حتى لا يختل القياس:\n1) احتفظ بالمعنى والسمة المقاسة نفسها؛ لا تضف ولا تحذف فكرة.\n2) احتفظ باتجاه كل عبارة (المثبتة تبقى مثبتة والمنفية تبقى منفية).\n3) احتفظ بالإطار الزمني وشدة العبارة (لا تحوّل «أحيانًا» إلى «دائمًا»).\n4) فكرة واحدة لكل عبارة، وبحد أقصى ' + p.maxW + ' كلمة.\n5) سياقات مألوفة للفئة: ' + p.ctx + '، دون تغيير ما تقيسه العبارة.\n' +
      'أعد JSON فقط: {"items":[{"id":"...","text":"..."}]}\nالعبارات:\n' + items.map(function (x) { return JSON.stringify({ id: x.id, text: x.text }); }).join('\n');
  }
  /* empirical check after data: standardization DIF (Dorans & Kulick) of each item between two versions,
     conditioning on the rest score; returns per-item STD on the item's own scale. */
  function stdDIF(rowsRef, rowsFoc, nItems, lo, hi) {
    var first = stdPass(rowsRef, rowsFoc, nItems, lo, hi, {});
    var drop = {}; first.forEach(function (x, j) { if (x.level === 'flag' || x.level === 'review') drop[j] = 1; });
    return Object.keys(drop).length && Object.keys(drop).length < nItems - 1 ? stdPass(rowsRef, rowsFoc, nItems, lo, hi, drop) : first;
  }
  function stdPass(rowsRef, rowsFoc, nItems, lo, hi, drop) {
    var out = [], R = hi - lo || 1;
    for (var j = 0; j < nItems; j++) {
      var rest = function (r) { var s = 0; for (var k = 0; k < nItems; k++) if (k !== j && !drop[k]) s += r[k]; return s; };
      var all = rowsRef.map(rest).concat(rowsFoc.map(rest)), mn = Math.min.apply(null, all), mx = Math.max.apply(null, all), B = Math.max(1, Math.min(8, Math.round((mx - mn) / 2) + 1)), bw = (mx - mn) / B || 1;
      var bin = function (v) { return Math.min(B - 1, Math.floor((v - mn) / bw)); }, sR = {}, nR = {}, sF = {}, nF = {};
      rowsRef.forEach(function (r) { var b = bin(rest(r)); sR[b] = (sR[b] || 0) + r[j]; nR[b] = (nR[b] || 0) + 1; });
      rowsFoc.forEach(function (r) { var b = bin(rest(r)); sF[b] = (sF[b] || 0) + r[j]; nF[b] = (nF[b] || 0) + 1; });
      var num = 0, den = 0; Object.keys(nF).forEach(function (b) { if (!nR[b]) return; num += nF[b] * (sF[b] / nF[b] - sR[b] / nR[b]); den += nF[b]; });
      var std = den ? num / den : NaN, rel = Math.abs(std) / R;
      out.push({ std: std, level: !isFinite(std) ? 'na' : rel < 0.1 ? 'ok' : rel < 0.2 ? 'review' : 'flag' });
    }
    return out;
  }
  function selectorsHTML(sel, idp) {
    idp = idp || 'au';
    return '<div class="aud-sel"><label class="fl" for="' + idp + 'P">الفئة العمرية المستهدفة</label><select id="' + idp + 'P">' + PROFILES.map(function (p) { return '<option value="' + p.id + '"' + (sel && sel.p === p.id ? ' selected' : '') + '>' + p.t + ' — ' + p.g + '</option>'; }).join('') + '</select>' +
      '<label class="fl" for="' + idp + 'R">لغة الصياغة</label><select id="' + idp + 'R">' + REGISTERS.map(function (r) { return '<option value="' + r.id + '"' + (sel && sel.r === r.id ? ' selected' : '') + '>' + r.t + ' — ' + r.d + '</option>'; }).join('') + '</select></div>';
  }
  function tipsHTML(profileId) { var p = prof(profileId); return '<ul class="aud-tips">' + p.tips.map(function (t) { return '<li>' + t + '</li>'; }).join('') + '</ul>'; }
  return { PROFILES: PROFILES, REGISTERS: REGISTERS, prof: prof, adapt: adapt, check: check, labels: labels, instructions: instructions, prompt: prompt, stdDIF: stdDIF, selectorsHTML: selectorsHTML, tipsHTML: tipsHTML };
})();

const BUILD = (() => {
  const PRESETS = {
    agree5: ['أوافق بشدة', 'أوافق', 'محايد', 'أرفض', 'أرفض بشدة'],
    apply5: ['تنطبق دائمًا', 'تنطبق غالبًا', 'تنطبق أحيانًا', 'تنطبق نادرًا', 'لا تنطبق أبدًا'],
    freq5: ['دائمًا', 'غالبًا', 'أحيانًا', 'نادرًا', 'أبدًا'],
    agree4: ['أوافق بشدة', 'أوافق', 'أرفض', 'أرفض بشدة'],
    three: ['نعم', 'أحيانًا', 'لا'],
    binary: ['نعم', 'لا'],
    agreeBin: ['أوافق', 'لا أوافق'],
    osgood: ['3', '2', '1', '0', '1', '2', '3'],
    apply4: ['تنطبق دائمًا', 'تنطبق غالبًا', 'تنطبق نادرًا', 'لا تنطبق أبدًا'],
    sjt4: ['أ', 'ب', 'ج', 'د'],
    forced2: ['العبارة الأولى', 'العبارة الثانية']
  };
  const METHODS = {
    thurstone: { t: 'ثرستون', en: 'Thurstone Equal-Appearing Intervals', yr: 1928, era: 'كلاسيكية', d: 'يكتب الباحث عبارات كثيرة تتدرج من الرفض الشديد إلى القبول الشديد، ويقدّرها محكمون على متصل من 1 إلى 11، وتُختار العبارات ذات الاتفاق العالي والقيم الموزعة. يختار المفحوص «أوافق» لما ينطبق، ودرجته وسيط قيم العبارات التي وافق عليها.', preset: 'agreeBin', n: k => [100, '50–100 محكم لتقدير قيم العبارات + 100 مفحوص على الأقل'] },
    likert: { t: 'ليكرت', en: 'Likert Summated Rating', yr: 1932, era: 'كلاسيكية (الأكثر استخدامًا)', d: 'عبارات موجبة وسالبة على تدريج متدرج، وتُجمع الدرجات بعد عكس السالبة. سهلة البناء والتصحيح، وتُحلل بألفا كرونباخ والتحليل العاملي.', preset: 'apply5', n: k => [Math.max(200, 10 * k), '5–10 أفراد لكل عبارة وبحد أدنى 200 للتحليل العاملي، و30–50 للتجربة الاستطلاعية'] },
    guttman: { t: 'جتمان', en: 'Guttman Cumulative Scaling', yr: 1944, era: 'كلاسيكية', d: 'عبارات مرتبة تصاعديًا في الشدة ويُجاب عنها بنعم/لا؛ من يوافق على عبارة قوية يوافق على ما قبلها. يُتحقق منها بمعامل إعادة الإنتاج (≥ 0.90).', preset: 'binary', n: k => [100, '100 فرد على الأقل لحساب معامل إعادة الإنتاج'] },
    osgood: { t: 'التمايز الدلالي', en: 'Osgood Semantic Differential', yr: 1957, era: 'كلاسيكية', d: 'يُقيَّم مفهوم واحد على أزواج من الصفات المتضادة (اكتبها: الصفة الموجبة | الصفة السالبة) بتدريج سباعي، وتمثل ثلاثة أبعاد: التقييم، والقوة، والنشاط.', preset: 'osgood', n: k => [100, '100 فرد على الأقل، ويزيد للتحليل العاملي'] },
    rasch: { t: 'راش / IRT', en: 'Rasch Model / Item Response Theory', yr: 1960, era: 'حديثة', d: 'عبارات تغطي مستويات مختلفة من شدة السمة (سهلة وصعبة التأييد)، ويُقدَّر موقع الفرد والعبارة على متصل واحد باللوجيت مستقلًا عن العينة، مع فحص المطابقة والأداء التفاضلي DIF.', preset: 'apply4', n: k => [250, '150–250 فردًا لتقديرات مستقرة (Linacre)، و500 لنماذج IRT متعددة المعالم'] },
    cat: { t: 'الاختبار التكيفي', en: 'Computerized Adaptive Testing (CAT)', yr: 1980, era: 'حديثة', d: 'بنك عبارات معايَر بنظرية الاستجابة للمفردة؛ يختار الحاسوب العبارة التالية حسب إجابات الفرد فيقيس بدقة بعدد أقل، ويتوقف عند وصول الخطأ المعياري لحد معين (مثل 0.30). هنا تبني البنك وتعايره، ويُعرض ترتيب العبارات من الأسهل للأصعب.', preset: 'apply4', n: k => [500, '500 فرد على الأقل لمعايرة بنك العبارات'] },
    sjt: { t: 'الحكم الموقفي', en: 'Situational Judgment Tests (SJT)', yr: 1990, era: 'حديثة', d: 'يُعرض موقف واقعي وأربعة تصرفات، ويختار المفحوص أفضلها. تقيس الكفايات السلوكية وتقل فيها المرغوبية الاجتماعية، والتصحيح بمفتاح يحدده الخبراء (1 للتصرف الأفضل و0 لغيره). اكتب العبارة: الموقف | أ | ب | ج | د.', preset: 'sjt4', n: k => [200, '200 فرد على الأقل + 5–10 خبراء لبناء مفتاح التصحيح'] },
    forced: { t: 'الاختيار القسري', en: 'Forced-Choice / Thurstonian IRT', yr: 2011, era: 'حديثة', d: 'عبارتان متساويتان في المرغوبية الاجتماعية من بعدين مختلفين، ويختار المفحوص الأكثر انطباقًا. تقلل التزييف، لكن درجاتها «إبسَاتية» (نسبية داخل الفرد) فلا تصلح معها ألفا والتحليل العاملي التقليدي؛ وتُحلل حديثًا بنموذج Thurstonian IRT (Brown & Maydeu-Olivares, 2011). اكتب العبارة: العبارة الأولى | العبارة الثانية؛ والعبارة الأولى تُحسب لبعد العبارة.', preset: 'forced2', n: k => [300, '300 فرد على الأقل لنموذج Thurstonian IRT'] },
    aig: { t: 'توليد بالذكاء الاصطناعي', en: 'AI-assisted Automatic Item Generation', yr: 2020, era: 'الأحدث', d: 'تُستخدم النماذج اللغوية لتوليد عبارات كثيرة من تعريف السمة، ثم يراجعها الخبراء ويحكّمونها، وتُفحص إحصائيًا (التحليل العاملي، راش). يوفر الوقت لكنه لا يغني عن التحكيم والتجريب. انسخ «طلب التوليد» من خطوة فيض الفقرات.', preset: 'agree5', n: k => [Math.max(200, 10 * k), 'مثل ليكرت: 10 أفراد لكل عبارة وبحد أدنى 200، بعد التحكيم'] }
  };
  const MORDER = ['thurstone', 'likert', 'guttman', 'osgood', 'rasch', 'cat', 'sjt', 'forced', 'aig'];
  const parts = t => (t || '').split('|').map(x => x.trim());
  /* ready-made templates (adapted from the statistics lab builder) */
  function tplItems(m, c, dims, k) {
    const q = `«${c}»`;
    const pos = [`أشعر بـ${q} في كثير من المواقف اليومية`, `يلاحظ المحيطون بي ${q} في تصرفاتي`, `أفكر في الأمور المرتبطة بـ${q} أكثر من غيري`, `يظهر ${q} لدي بوضوح عند التعامل مع الآخرين`, `يصعب عليّ التحكم في ${q} عندما أكون تحت ضغط`, `يؤثر ${q} في أدائي الدراسي أو المهني`, `أشعر بـ${q} عند مواجهة مواقف جديدة`, `أتصرف بطريقة تعكس ${q} حتى في المواقف البسيطة`, `تتكرر لدي مواقف يظهر فيها ${q}`, `أجد نفسي مدفوعًا بـ${q} في قراراتي`, `يستمر ${q} معي لفترات طويلة`, `أتذكر مواقف كثيرة شعرت فيها بـ${q}`];
    const neg = [`نادرًا ما أشعر بـ${q}`, `يمر يومي دون أن أفكر في ${q}`, `أتعامل مع الآخرين بعيدًا عن ${q}`, `أتخذ قراراتي بهدوء بعيدًا عن ${q}`];
    const D = dims.length ? dims : [null], out = [];
    const add = (text, i, extra = {}) => out.push(Object.assign({ text, dim: D[i % D.length], dir: 1 }, extra));
    if (m === 'osgood') { const P = [['جيد', 'سيئ'], ['مفيد', 'ضار'], ['ممتع', 'ممل'], ['مهم', 'تافه'], ['مريح', 'مزعج'], ['قوي', 'ضعيف'], ['عميق', 'سطحي'], ['كبير', 'صغير'], ['نشط', 'خامل'], ['سريع', 'بطيء'], ['حاد', 'هادئ']]; for (let i = 0; i < k; i++) { const p = P[i % P.length]; add(`${p[0]} | ${p[1]}`, i); } return out; }
    if (m === 'guttman') { const L = ['أحيانًا', 'مرة في الأسبوع على الأقل', 'عدة مرات في الأسبوع', 'يوميًا تقريبًا', 'لدرجة أنه يؤثر في بعض مهامي', 'لدرجة أنه يمنعني من بعض الأنشطة', 'لدرجة أنه يمنعني من معظم الأنشطة', 'لدرجة أنني أحتاج مساعدة متخصصة']; for (let i = 0; i < Math.min(k, L.length); i++) add(`أشعر بـ${q} ${L[i]}`, 0); return out; }
    if (m === 'thurstone') { const V = [[11, `${q} أمر ضروري ولا يمكن الاستغناء عنه`], [10, `${q} من أهم ما يميز الإنسان الناجح`], [9, `أرى أن ${q} له فوائد كثيرة`], [8, `${q} مفيد في أغلب المواقف`], [7, `${q} مقبول بشكل عام`], [6, `لا أمانع وجود ${q} في حياتي`], [5, `ليس لدي رأي واضح حول ${q}`], [4, `أتحفظ أحيانًا على ${q}`], [3, `${q} يسبب مشكلات أكثر مما يفيد`], [2, `أرفض ${q} في معظم المواقف`], [1, `${q} أمر ضار تمامًا ولا فائدة منه`]]; const kk = Math.min(k, V.length); for (let i = 0; i < kk; i++) { const j = Math.round(i * (V.length - 1) / Math.max(1, kk - 1)); add(V[j][1], 0, { sv: V[j][0] }); } return out; }
    if (m === 'sjt') { const C = ['في قاعة المحاضرات', 'أثناء العمل في مجموعة', 'مع أحد أفراد الأسرة', 'في مقابلة مهمة', 'مع صديق مقرب', 'قبل امتحان مهم', 'في موقف أمام الناس', 'عند تلقي نقد من شخص آخر']; for (let i = 0; i < k; i++) add(`${C[i % C.length]} واجهت موقفًا يتطلب ${q}. ماذا تفعل؟ | أتعامل مع الموقف مباشرة وبهدوء | أطلب المشورة من شخص أثق به | أؤجل التعامل مع الموقف | أنسحب من الموقف تمامًا`, i, { key: 0 }); return out; }
    if (m === 'forced') { for (let i = 0; i < k; i++) add(`${pos[i % pos.length]} | ${pos[(i + 5) % pos.length]}`, i); return out; }
    for (let i = 0; i < k; i++) { const rev = ['likert', 'aig'].includes(m) && i % 4 === 3; add(rev ? neg[Math.floor(i / 4) % neg.length] : pos[(i - Math.floor(i / 4)) % pos.length], i, { dir: rev ? -1 : 1 }); }
    return out;
  }
  function aiPrompt(s) {
    const m = METHODS[meth(s)], k = Math.round(s.target * s.mult) || 20;
    return `أنت خبير في بناء المقاييس النفسية باللغة العربية. اكتب ${k} عبارة لقياس «${s.construct || s.name}» لدى ${s.group || 'الفئة المستهدفة'} بطريقة ${m.t} (${m.en}).
التعريف النظري: ${s.defC || '—'}
الأبعاد: ${s.dims.map(d => d.name + (d.def ? ' (' + d.def + ')' : '') + ' ' + d.w + '%').join('، ')}
قواعد: فصحى واضحة، فكرة واحدة لكل عبارة، بلا نفي مزدوج، عبارات تقريرية بضمير المتكلم، مناسبة للفئة.${['likert', 'aig'].includes(meth(s)) ? ' اجعل نحو ربع العبارات سالبة وضع قبلها (−).' : ''}${meth(s) === 'sjt' ? ' اكتب كل عبارة: الموقف | تصرف أ | تصرف ب | تصرف ج | تصرف د، واجعل التصرف أ هو الأفضل.' : ''}${meth(s) === 'forced' ? ' اكتب كل عبارة زوجًا متساويًا في المرغوبية: العبارة الأولى | العبارة الثانية.' : ''}${meth(s) === 'osgood' ? ' اكتب كل عبارة زوج صفات متضادة: الصفة الموجبة | الصفة السالبة.' : ''}
اكتب كل بعد بعنوانه، ثم عباراته كل عبارة في سطر، بلا ترقيم.`;
  }
  const meth = s => s.method || 'likert';
  const STEPS = ['الوضوح المفاهيمي', 'المراجعة الأدبية', 'تحديد الأبعاد', 'جدول المواصفات', 'فيض الفقرات', 'جودة الصياغة', 'سلم الاستجابة', 'صدق المحتوى', 'التجريب الاستطلاعي', 'جمع البيانات وتحليل الفقرات', 'الثبات', 'الصدق العاملي والتقنين'];
  const blank = () => ({ id: uid('s'), name: 'مقياس جديد', construct: '', group: '', purpose: 'بحث', defC: '', defO: '', refs: [], dims: [{ id: uid('d'), name: 'البعد الأول', def: '', w: 100 }], target: 20, mult: 1.5, items: [], scale: { preset: 'apply5', labels: PRESETS.apply5.slice() }, instr: 'بين يديك مجموعة من العبارات التي تصف بعض المواقف والمشاعر. اقرأ كل عبارة بعناية، ثم اختر البديل الذي ينطبق عليك فعلًا. لا توجد إجابات صحيحة وأخرى خاطئة، وإجاباتك سرية ولن تُستخدم إلا لأغراض البحث العلمي.', demo: { gender: true, age: true }, judges: 10, pilotNotes: '', responses: [], versions: {}, step: 0, created: Date.now(), updated: Date.now() });
  function example() {
    const s = blank(); s.name = 'مقياس التسويف الأكاديمي (مثال)'; s.construct = 'التسويف الأكاديمي'; s.group = 'طلاب الجامعة';
    s.defC = 'ميل الطالب إلى تأجيل البدء في المهام الأكاديمية أو إتمامها رغم إدراكه لعواقب التأجيل، مع ما يصاحب ذلك من ضعف في إدارة الوقت وانفعالات سلبية.';
    s.defO = 'الدرجة الكلية التي يحصل عليها الطالب على المقياس المكوّن من (12) عبارة موزعة على ثلاثة أبعاد (التأجيل السلوكي، وإدارة الوقت، والقلق والتجنب)، وتدل الدرجة المرتفعة على تسويف أعلى.';
    s.refs = [{ t: 'مقياس التسويف لدى الطلاب (PASS)', a: 'Solomon & Rothblum (1984)', n: 'يقيس تكرار التسويف وأسبابه؛ غير مقنن على البيئة المصرية' }];
    const D = [['التأجيل السلوكي', 'تأخير البدء في المهام والمذاكرة', 35], ['إدارة الوقت', 'سوء تقدير الوقت والتخطيط', 30], ['القلق والتجنب', 'الانفعالات المصاحبة والهروب من المهمة', 35]].map(([n, d, w]) => ({ id: uid('d'), name: n, def: d, w }));
    s.dims = D; s.target = 12; s.mult = 1;
    const I = [['أؤجل المذاكرة حتى الليلة السابقة للامتحان', 0, 1], ['أبدأ في تكليفاتي فور استلامها', 0, -1], ['أنشغل بالهاتف عندما أجلس للمذاكرة', 0, 1], ['أترك المهام الصعبة إلى آخر لحظة', 0, 1], ['أسيء تقدير الوقت الذي تحتاجه المهمة', 1, 1], ['أضع جدولًا زمنيًا للمذاكرة وألتزم به', 1, -1], ['أفاجأ بقرب موعد التسليم', 1, 1], ['أنجز أكثر من مهمة في وقت واحد فيتعطل الجميع', 1, 1], ['أشعر بالضيق عندما أفكر في تكليف لم أبدأه', 2, 1], ['أهرب من المذاكرة بأنشطة أخرى', 2, 1], ['أواجه المهام المزعجة دون تأخير', 2, -1], ['أتجنب التفكير في المقررات الصعبة', 2, 1]];
    s.items = I.map(([t, d, dir]) => ({ id: uid('i'), text: t, dim: D[d].id, dir, src: 'استنباطي', ess: null, use: null, keep: true }));
    return s;
  }
  const kept = s => s.items.filter(i => i.keep !== false);
  const pts = s => s.scale.labels.length;
  const isBin = s => pts(s) === 2;
  const scoreOf = (s, it, raw) => { if (raw == null) return null; if (meth(s) === 'sjt') return (pts(s) - raw) === (it.key || 0) ? 1 : 0; if (meth(s) === 'forced') return raw; const hi = isBin(s) ? 1 : pts(s), lo = isBin(s) ? 0 : 1; return it.dir < 0 ? hi + lo - raw : raw; };

  /* ---- wording checks ---- */
  const NEG = /(^|\s)(لا|لم|لن|ليس|ليست|غير|عدم|بدون|دون)(\s|$)/g;
  function wordingWarnings(s, it) {
    const t = (it.text || '').trim(), w = [];
    if (!t) return [['bad', 'عبارة فارغة']];
    if (meth(s) === 'osgood') return t.includes('|') ? [] : [['warn', 'اكتبها: الصفة الموجبة | الصفة السالبة']];
    if (meth(s) === 'sjt') return parts(t).filter(Boolean).length === 1 + pts(s) ? [] : [['bad', `اكتبها: الموقف | ${pts(s)} تصرفات مفصولة بـ |`]];
    if (meth(s) === 'forced') return parts(t).filter(Boolean).length === 2 ? [] : [['bad', 'اكتبها: العبارة الأولى | العبارة الثانية']];
    const negs = (t.match(NEG) || []).length;
    if (negs >= 2) w.push(['bad', 'نفي مزدوج محتمل']);
    if (/[؟?]/.test(t)) w.push(['warn', 'صيغة سؤال؛ اجعلها عبارة تقريرية']);
    if (t.length > 90) w.push(['warn', 'طويلة (أكثر من 90 حرفًا)']);
    if (t.length < 12) w.push(['warn', 'قصيرة وغامضة']);
    if (/(^|\s)(دائما|دائمًا|أبدا|أبدًا|مطلقا|مطلقًا|إطلاقا|إطلاقًا|جميع|كل)(\s|$)/.test(t)) w.push(['warn', 'كلمة مطلقة (دائمًا/أبدًا/كل)']);
    if (/\sأو\s/.test(t) || (/\sو(?!ال)[ء-ي]{3,}/.test(t) && t.split(/\sو/).length > 2)) w.push(['warn', 'قد تحمل فكرتين']);
    const tw = new Set(t.split(/\s+/)); kept(s).forEach(o => { if (o === it || !o.text) return; const ow = new Set(o.text.trim().split(/\s+/)); const inter = [...tw].filter(x => ow.has(x)).length, uni = new Set([...tw, ...ow]).size; if (uni && inter / uni >= 0.7) w.push(['bad', 'مكررة تقريبًا مع عبارة أخرى']); });
    return w;
  }

  /* ---- step status ---- */
  function status(s) {
    const r = s.responses.filter(x => !x.pilot), k = kept(s);
    const dimCount = d => k.filter(i => i.dim === d.id).length;
    const sumW = s.dims.reduce((a, d) => a + (+d.w || 0), 0);
    const words = k.some(i => wordingWarnings(s, i).some(x => x[0] === 'bad'));
    let alpha = NaN; try { if (r.length >= 5 && k.length >= 2) alpha = analyze(s).total.alpha; } catch (e) { }
    return [
      !!(s.name && s.construct && s.defC && s.defO),
      s.refs.length >= 1,
      s.dims.length >= 1 && s.dims.every(d => d.name && d.def),
      Math.abs(sumW - 100) < 0.5 && s.target > 0,
      s.items.length >= Math.round(s.target * s.mult) && s.dims.every(d => s.items.filter(i => i.dim === d.id).length >= 3),
      k.length > 0 && !words,
      pts(s) >= 2,
      s.items.length > 0 && s.items.every(i => i.ess != null),
      !!s.pilotNotes || s.responses.some(x => x.pilot),
      r.length >= 30,
      alpha >= 0.7,
      r.length >= Math.max(100, 5 * k.length)
    ];
  }

  /* ---- analysis ---- */
  function matrix(s, items) {
    const rows = [], meta = [];
    s.responses.filter(x => !x.pilot).forEach(x => { const row = items.map(it => scoreOf(s, it, x.vals[it.id])); if (row.every(v => v != null && isFinite(v))) { rows.push(row); meta.push(x); } });
    return { rows, meta };
  }
  function analyze(s) {
    const items = kept(s), M = matrix(s, items), out = { items, n: M.rows.length, meta: M.meta };
    if (M.rows.length < 3 || items.length < 2) return out;
    out.rows = M.rows;
    out.total = PSY.itemStats(M.rows);
    out.split = items.length >= 2 ? PSY.splitHalf(M.rows) : null;
    if (isBin(s) || meth(s) === 'sjt') out.kr20 = PSY.kr20(M.rows);
    out.ext = M.rows.length >= 6 ? PSY.extremeGroups(M.rows) : null;
    if (meth(s) === 'guttman' && isBin(s)) {
      const k = items.length, p = items.map((_, j) => PSY.mean(M.rows.map(r => r[j]))), ord = p.map((v, j) => [v, j]).sort((a, b) => b[0] - a[0]).map(x => x[1]);
      let err = 0; M.rows.forEach(r => { const t = PSY.sum(r); ord.forEach((j, pos) => { const ideal = pos < t ? 1 : 0; if (r[j] !== ideal) err++; }); });
      const n = M.rows.length; out.guttman = { cr: 1 - err / (n * k), mmr: PSY.mean(p.map(v => Math.max(v, 1 - v))), order: ord, p };
    }
    if (meth(s) === 'thurstone') { out.thurstone = M.rows.map(r => { const v = items.map((it, j) => r[j] === 1 && it.sv != null ? it.sv : null).filter(x => x != null); return v.length ? PSY.median(v) : null; }); out.thMissing = items.filter(it => it.sv == null).length; }
    if (['rasch', 'cat', 'sjt'].includes(meth(s))) { const lo = isBin(s) || meth(s) === 'sjt' ? 0 : 1, hi = isBin(s) || meth(s) === 'sjt' ? 1 : pts(s); const d = items.map((_, j) => { const pp = Math.min(0.99, Math.max(0.01, (PSY.mean(M.rows.map(r => r[j])) - lo) / (hi - lo))); return Math.log((1 - pp) / pp); }); const m = PSY.mean(d); out.rasch = d.map(x => x - m); }
    out.dims = s.dims.map(d => { const idx = items.map((it, j) => it.dim === d.id ? j : -1).filter(j => j >= 0); if (idx.length < 2) return { d, idx, n: idx.length }; const sub = M.rows.map(r => idx.map(j => r[j])); const st = PSY.itemStats(sub); let om = null; if (idx.length >= 3 && M.rows.length > idx.length) { const e = PSY.efa(sub, 1); om = PSY.omega(e.loadings.map(l => Math.abs(l[0]))); } return { d, idx, n: idx.length, st, omega: om, totals: sub.map(r => PSY.sum(r)) }; });
    return out;
  }

  /* ---- codes ---- */
  const b64e = str => btoa(unescape(encodeURIComponent(str))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  const b64d = str => decodeURIComponent(escape(atob(str.replace(/-/g, '+').replace(/_/g, '/'))));
  const hash = str => { let h = 7; for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) % 1000003; return h.toString(36); };
  function version(s) { const ids = kept(s).map(i => i.id), f = activeForm(s); const v = hash(ids.join(',') + (f ? '|' + f.id : '')); s.versions = s.versions || {}; s.versions[v] = ids; s.vform = s.vform || {}; s.vform[v] = f ? f.id : 'base'; return v; }
  /* audience versions: same items, adapted wording per age group / register; responses are tagged with their version */
  const activeForm = s => (s.forms || []).find(f => f.id === s.activeForm) || null;
  const formText = (s, it, f) => { f = f === undefined ? activeForm(s) : f; return f && f.texts && f.texts[it.id] ? f.texts[it.id] : it.text; };
  function formDef(s) { const v = version(s), f = activeForm(s); return { i: s.id, v, n: s.name, in: (f && f.instr) || s.instr, l: (f && f.labels && f.labels.length === s.scale.labels.length) ? f.labels : s.scale.labels, b: isBin(s) ? 1 : 0, d: s.demo, m: meth(s), q: kept(s).map(i => formText(s, i, f)) }; }
  const scaleCode = s => 'SC1.' + b64e(JSON.stringify(formDef(s)));
  function parseScaleCode(c) { c = c.trim(); if (!c.startsWith('SC1.')) throw new Error('الكود لا يبدأ بـ SC1. تأكد أنك نسخت كود المقياس كاملًا.'); const d = JSON.parse(b64d(c.slice(4))); if (!d.q || !d.l || !d.i) throw new Error('كود المقياس غير مكتمل.'); if (d.q.length > 200 || d.l.length > 7) throw new Error('كود غير صالح.'); return d; }
  function responseCode(def, vals, demo) { const p = { i: def.i, v: def.v, r: vals.join(''), g: demo.g || '', a: demo.a || '', t: Date.now() }; p.c = hash(p.i + p.v + p.r); return 'RS1.' + b64e(JSON.stringify(p)); }
  function parseResponseCode(c) { c = c.trim(); if (!c.startsWith('RS1.')) return null; try { const p = JSON.parse(b64d(c.slice(4))); if (hash(p.i + p.v + p.r) !== p.c) return { error: 'تالف' }; return p; } catch (e) { return { error: 'تالف' }; } }
  function addResponse(s, ver, values, extra) { const ids = (s.versions || {})[ver]; if (!ids) return 'version'; if (values.length !== ids.length) return 'length'; const vals = {}; ids.forEach((id, j) => vals[id] = values[j]); s.responses.push(Object.assign({ id: uid('r'), ts: Date.now(), vals, form: (s.vform || {})[ver] || 'base' }, extra)); return 'ok'; }

  /* ---- form renderer (shared by kiosk, preview, respond) ---- */
  function formHTML(def, opts = {}) {
    const L = def.l, k = L.length;
    return `<form id="fForm" class="stack" novalidate>
      <div class="card"><h3>${esc(def.n)}</h3><p style="margin:0">${esc(def.in)}</p></div>
      ${(def.d && (def.d.gender || def.d.age)) ? `<div class="card grid2">${def.d.gender ? `<div class="field"><span class="fl">النوع</span><div class="seg" role="radiogroup" aria-label="النوع"><button type="button" data-g="ذكر" aria-pressed="false">ذكر</button><button type="button" data-g="أنثى" aria-pressed="false">أنثى</button></div></div>` : ''}${def.d.age ? `<div class="field"><label class="fl" for="fAge">العمر</label><input type="number" id="fAge" min="10" max="99" inputmode="numeric"></div>` : ''}</div>` : ''}
      <div class="form-preview card" style="padding:0">${def.q.map((q, i) => { const og = def.m === 'osgood' && q.includes('|'), pr = og ? q.split('|').map(x => x.trim()) : null, ch = (def.m === 'sjt' || def.m === 'forced') && q.includes('|') ? q.split('|').map(x => x.trim()) : null, lead = ch ? (def.m === 'sjt' ? ch[0] : 'أي العبارتين تنطبق عليك أكثر؟') : null, LL = ch ? (def.m === 'sjt' ? ch.slice(1) : ch).slice(0, k) : L; return `<fieldset class="fq" style="border:none;margin:0"><legend class="qt"><span class="num muted">${i + 1}.</span> ${og ? `<b>${esc(pr[0])}</b> <span class="muted">↔</span> <b>${esc(pr[1])}</b>` : esc(ch ? lead : q)}</legend><div class="lik${ch ? ' opts' : ''}" style="--k:${ch ? 1 : k}">${LL.map((lab, j) => `<label><input type="radio" name="q${i}" value="${def.b ? (j === 0 ? 1 : 0) : k - j}" ${opts.preview ? 'disabled' : ''}><span>${ch && def.m === 'sjt' ? esc(L[j] + ') ') : ''}${esc(lab)}</span></label>`).join('')}</div></fieldset>`; }).join('')}</div>
      ${opts.preview ? '' : `<div class="notice warn" id="fMiss" hidden></div><button class="btn" type="submit">${ic('check')} إرسال الإجابات</button>`}
    </form>`;
  }
  function bindForm(root, def, onSubmit) {
    let g = '';
    $$('[data-g]', root).forEach(b => b.onclick = () => { g = b.dataset.g; $$('[data-g]', root).forEach(x => x.setAttribute('aria-pressed', x === b)); });
    $('#fForm', root).onsubmit = e => {
      e.preventDefault();
      const vals = def.q.map((_, i) => { const c = $(`input[name="q${i}"]:checked`, root); return c ? +c.value : null; });
      const miss = vals.map((v, i) => v == null ? i + 1 : 0).filter(Boolean), m = $('#fMiss', root);
      if (miss.length) { m.hidden = false; m.textContent = 'لم تُجب عن العبارات: ' + miss.join('، ') + '. أجب عنها ثم أرسل.'; const f = $(`input[name="q${miss[0] - 1}"]`, root); f && f.closest('fieldset').scrollIntoView({ block: 'center' }); return; }
      const age = $('#fAge', root); const a = age && age.value ? String(Math.max(10, Math.min(99, Math.round(toNum(age.value))))) : '';
      onSubmit(vals, { g, a });
    };
  }

  /* ---- views ---- */
  let openId = null;
  VIEWS.build = el => { if (openId && SCALES.get(openId)) return editor(el, SCALES.get(openId)); openId = null; listView(el); };
  function listView(el) {
    const L = SCALES.list();
    el.innerHTML = `<div class="section-title"><h2>ابنِ مقياسك</h2><div class="row"><button class="btn" id="bNew">${ic('plus')} مقياس جديد</button><button class="btn ghost" id="bEx">ابدأ من مثال</button><button class="btn ghost" id="bImp">${ic('upload')} استيراد ملف مقياس</button><input type="file" id="fImp" accept=".json,application/json" hidden></div></div>
      <div class="notice small"><b>كيف يعمل؟</b>يسير المعالج على القواعد الاثنتي عشرة لبناء المقياس: من تعريف السمة إلى التحكيم والتجريب، ثم جمع الاستجابات (على جهازك مباشرة، أو بكود ترسله للمستجيبين، أو من Google Forms)، ويحسب التحليل فور وصول البيانات.</div>

      ${L.length ? `<div class="grid2">${L.map(s => { const st = status(s), done = st.filter(Boolean).length, r = s.responses.filter(x => !x.pilot).length; return `<article class="card stack" style="gap:8px"><div class="row"><b class="grow" style="font-family:var(--f-display);font-size:17px">${esc(s.name)}</b><span class="chip ${done === 12 ? 'good' : 'blue'}">${done}/12 خطوة</span></div><div class="row small muted"><span>${kept(s).length} عبارة</span><span>${s.dims.length} أبعاد</span><span>${r} استجابة</span></div><div class="pbar good"><i style="width:${done / 12 * 100}%"></i></div><div class="row"><button class="btn sm" data-open="${s.id}">فتح</button><button class="btn sm ghost" data-dup="${s.id}">نسخة</button><button class="btn sm ghost" data-del="${s.id}" aria-label="حذف">${ic('trash')}</button></div></article>`; }).join('')}</div>` : `<div class="card empty"><p>لم تنشئ مقياسًا بعد.</p><p class="small">ابدأ بمقياس جديد، أو افتح مثال «التسويف الأكاديمي» لترى الخطوات مكتملة.</p></div>`}`;
    $('#bNew').onclick = () => modal(`<h3>مقياس جديد: اختر طريقة العمل</h3><div class="stack">
      <button class="linkcard" data-nw="quick" style="--c:var(--amber);--s:var(--amber-soft)"><span class="ic">${ic('bolt')}</span><span><b>البناء السريع (مثل مختبر الإحصاء)</b><span>اختر طريقة من 9 طرق مع عالِمها ونموذج حقيقي لها، وابنِ العبارات، وأرسل المقياس بلينك أو Google Forms، واجمع الردود في Google Sheet.</span></span></button>
      <button class="linkcard" data-nw="full"><span class="ic">${ic('build')}</span><span><b>المعالج الكامل: 12 خطوة</b><span>من التعريف والأبعاد وجدول المواصفات إلى التحكيم والتجريب والتحليل والمعايير ودليل المقياس.</span></span></button>
      <button class="linkcard" data-nw="ex" style="--c:var(--good);--s:var(--good-soft)"><span class="ic">${ic('star')}</span><span><b>ابدأ من مثال جاهز</b><span>مقياس التسويف الأكاديمي (12 عبارة في 3 أبعاد) لتجرب كل الخطوات.</span></span></button>
      <button class="linkcard" data-nw="real" style="--c:var(--violet);--s:var(--violet-soft)"><span class="ic">${ic('book')}</span><span><b>نماذج حقيقية لكل طريقة ولكل عالم</b><span>ثرستون، وليكرت (روزنبرج)، وجتمان (بوجاردس)، وأوسجود، وراش، وPROMIS، والاختيار القسري.</span></span></button></div>
      <div class="row" style="margin-top:10px"><button class="btn ghost" data-close>إلغاء</button></div>`, (bg, close) => $$('[data-nw]', bg).forEach(x => x.onclick = () => { close(); const k = x.dataset.nw; if (k === 'quick') return go('qbuild'); if (k === 'real') return LEARN.open('real'); const s = k === 'ex' ? example() : blank(); SCALES.save(s); checkBadges(); openId = s.id; rerender(); }));
    $('#bEx').onclick = () => { const s = example(); SCALES.save(s); checkBadges(); openId = s.id; rerender(); };
    $('#bImp').onclick = () => $('#fImp').click();
    $('#fImp').onchange = e => { const f = e.target.files[0]; if (!f) return; const rd = new FileReader(); rd.onload = () => { try { const s = JSON.parse(rd.result); if (!s.items || !s.dims || !s.scale) throw 0; s.id = uid('s'); s.responses = Array.isArray(s.responses) ? s.responses : []; SCALES.save(s); toast('استُورد المقياس'); rerender(); } catch (err) { toast('الملف ليس ملف مقياس صالحًا'); } }; rd.readAsText(f); };
    $$('[data-open]', el).forEach(b => b.onclick = () => { openId = b.dataset.open; rerender(); });
    $$('[data-dup]', el).forEach(b => b.onclick = () => { const s = JSON.parse(JSON.stringify(SCALES.get(b.dataset.dup))); s.id = uid('s'); s.name += ' (نسخة)'; s.responses = []; s.versions = {}; SCALES.save(s); rerender(); });
    $$('[data-del]', el).forEach(b => b.onclick = () => confirmBox('سيُحذف المقياس وكل استجاباته من هذا الجهاز' + (window.ACCT && ACCT.signedIn() ? ' ومن حسابك' : '') + '.', 'حذف المقياس', () => { SCALES.remove(b.dataset.del); rerender(); }));
  }

  function editor(el, s) {
    const st = status(s), step = Math.min(11, Math.max(0, s.step || 0));
    el.innerHTML = `<button class="back" id="bBack">${ic('back')} كل المقاييس</button>
      <div class="card stack" style="gap:10px"><div class="row"><input type="text" id="sName" value="${esc(s.name)}" aria-label="اسم المقياس" style="font-family:var(--f-display);font-weight:600;font-size:18px" class="grow"><span class="chip ${st.filter(Boolean).length === 12 ? 'good' : 'blue'}">${st.filter(Boolean).length}/12</span><button class="btn sm ghost" id="bExp">${ic('download')} حفظ ملف المقياس</button></div>
      <nav class="steps-rail" aria-label="خطوات البناء">${STEPS.map((t, i) => `<button data-step="${i}" class="${st[i] ? 'done' : ''}" ${i === step ? 'aria-current="step"' : ''}><span class="n">${st[i] ? '✓' : i + 1}</span>${t}</button>`).join('')}</nav></div>
      <section class="card stack" id="stepBody"></section>
      <div class="row"><button class="btn ghost" id="bPrev" ${step === 0 ? 'disabled' : ''}>${ic('back')} السابق</button><span class="grow"></span><button class="btn" id="bNext" ${step === 11 ? 'disabled' : ''}>التالي</button></div>`;
    $('#bBack').onclick = () => { openId = null; rerender(); };
    $('#sName').onchange = e => { s.name = e.target.value.trim() || 'مقياس بلا اسم'; SCALES.save(s); };
    $('#bExp').onclick = () => downloadFile((s.name || 'scale').replace(/[^؀-ۿa-zA-Z0-9]+/g, '-') + '.json', JSON.stringify(s, null, 1), 'application/json');
    $$('[data-step]', el).forEach(b => b.onclick = () => { s.step = +b.dataset.step; SCALES.save(s); rerender(); });
    $('#bPrev').onclick = () => { s.step = step - 1; SCALES.save(s); rerender(); };
    $('#bNext').onclick = () => { s.step = step + 1; SCALES.save(s); rerender(); };
    const body = $('#stepBody');
    const intro = (i, txt) => `<div class="row"><span class="chip blue">القاعدة ${i + 1}</span><h3 class="grow" style="margin:0">${STEPS[i]}</h3>${st[i] ? '<span class="chip good">مكتملة</span>' : ''}</div><p class="muted small" style="margin:0">${txt}</p>`;
    const persist = () => { SCALES.save(s); };
    STEP[step](body, s, intro, persist, st);
  }

  const STEP = [];
  STEP[0] = (b, s, intro, persist) => {
    b.innerHTML = intro(0, 'حدد السمة التي تقيسها والفئة والغرض، ثم اكتب تعريفًا نظريًا يحدد حدودها وتعريفًا إجرائيًا يربطها بالمقياس.') + `
      <div class="grid2"><div class="field"><label class="fl" for="c1">السمة (البناء)</label><input type="text" id="c1" value="${esc(s.construct)}" placeholder="مثال: الاتزان الانفعالي"></div><div class="field"><label class="fl" for="c2">الفئة المستهدفة</label><input type="text" id="c2" value="${esc(s.group)}" placeholder="مثال: طلاب كلية التربية"></div></div>
      <div class="field"><label class="fl" for="c3">الغرض من المقياس</label><select id="c3">${['بحث', 'تشخيص وفرز', 'انتقاء', 'تقويم برنامج'].map(x => `<option ${s.purpose === x ? 'selected' : ''}>${x}</option>`).join('')}</select></div>
      <div class="field"><label class="fl" for="c4">التعريف النظري (المفاهيمي)</label><textarea id="c4" placeholder="السمة هي ...، وتتميز بـ ...، وتختلف عن ... في ...">${esc(s.defC)}</textarea></div>
      <div class="field"><label class="fl" for="c5">التعريف الإجرائي</label><textarea id="c5">${esc(s.defO)}</textarea><button class="btn sm ghost" id="tpl" type="button" style="justify-self:start">اقترح صياغة من الأبعاد</button></div>
      <div class="notice small"><b>تذكير</b>التعريف الإجرائي القوي يذكر عدد العبارات والأبعاد ودلالة الدرجة المرتفعة، لا «الدرجة على المقياس» فقط.</div>`;
    const bind = (id, f) => $('#' + id, b).onchange = e => { s[f] = e.target.value.trim(); persist(); };
    bind('c1', 'construct'); bind('c2', 'group'); bind('c3', 'purpose'); bind('c4', 'defC'); bind('c5', 'defO');
    $('#tpl', b).onclick = () => { const n = kept(s).length || s.target; s.defO = `الدرجة الكلية التي يحصل عليها ${s.group ? 'المستجيب من ' + s.group : 'المستجيب'} على مقياس ${s.construct || '...'} المكوّن من (${n}) عبارة موزعة على ${s.dims.length} ${s.dims.length > 2 ? 'أبعاد' : 'بعد'} (${s.dims.map(d => d.name).join('، ')})، وتدل الدرجة المرتفعة على مستوى أعلى من ${s.construct || 'السمة'}.`; $('#c5', b).value = s.defO; persist(); };
  };
  STEP[1] = (b, s, intro, persist) => {
    const draw = () => {
      b.innerHTML = intro(1, 'سجّل المقاييس والدراسات السابقة التي راجعتها، وما استخلصته منها من أبعاد، وسبب الحاجة إلى مقياس جديد.') +
        (s.refs.length ? tableHTML(['المقياس/الدراسة', 'المؤلف والسنة', 'ملاحظات وأبعاد', ''], s.refs.map((r, i) => [esc(r.t), esc(r.a), esc(r.n), `<button class="btn sm ghost" data-rm="${i}" aria-label="حذف">${ic('trash')}</button>`])) : '<p class="muted small">لم تضف مراجع بعد.</p>') +
        `<div class="grid3"><div class="field"><label class="fl" for="r1">المقياس أو الدراسة</label><input type="text" id="r1"></div><div class="field"><label class="fl" for="r2">المؤلف والسنة</label><input type="text" id="r2"></div><div class="field"><label class="fl" for="r3">الأبعاد والملاحظات</label><input type="text" id="r3"></div></div><button class="btn sm" id="radd" style="justify-self:start">${ic('plus')} إضافة</button>`;
      $('#radd', b).onclick = () => { const t = $('#r1', b).value.trim(); if (!t) return toast('اكتب اسم المقياس أو الدراسة'); s.refs.push({ t, a: $('#r2', b).value.trim(), n: $('#r3', b).value.trim() }); persist(); draw(); };
      $$('[data-rm]', b).forEach(x => x.onclick = () => { s.refs.splice(+x.dataset.rm, 1); persist(); draw(); });
    };
    draw();
  };
  STEP[2] = (b, s, intro, persist) => {
    const draw = () => {
      b.innerHTML = intro(2, 'قسّم السمة إلى أبعاد متجانسة داخليًا ومتمايزة فيما بينها، واكتب تعريفًا لكل بعد. يُنصح بثلاث عبارات على الأقل لكل بعد في الصورة النهائية.') +
        s.dims.map((d, i) => `<div class="grid2" style="border-top:1px solid var(--line);padding-top:10px"><div class="field"><label class="fl" for="dn${i}">اسم البعد ${i + 1}</label><input type="text" id="dn${i}" data-dn="${i}" value="${esc(d.name)}"></div><div class="field"><label class="fl" for="dd${i}">تعريفه</label><div class="row"><input type="text" id="dd${i}" data-dd="${i}" value="${esc(d.def)}" class="grow"><button class="btn sm ghost" data-drm="${i}" ${s.dims.length < 2 ? 'disabled' : ''} aria-label="حذف البعد">${ic('trash')}</button></div></div></div>`).join('') +
        `<button class="btn sm" id="dadd" style="justify-self:start">${ic('plus')} إضافة بعد</button>`;
      $$('[data-dn]', b).forEach(x => x.onchange = () => { s.dims[+x.dataset.dn].name = x.value.trim(); persist(); });
      $$('[data-dd]', b).forEach(x => x.onchange = () => { s.dims[+x.dataset.dd].def = x.value.trim(); persist(); });
      $$('[data-drm]', b).forEach(x => x.onclick = () => { const d = s.dims[+x.dataset.drm]; const moveTo = s.dims.find(o => o !== d); s.items.forEach(it => { if (it.dim === d.id) it.dim = moveTo.id; }); s.dims.splice(+x.dataset.drm, 1); persist(); draw(); });
      $('#dadd', b).onclick = () => { s.dims.push({ id: uid('d'), name: 'بعد جديد', def: '', w: 0 }); persist(); draw(); };
    };
    draw();
  };
  STEP[3] = (b, s, intro, persist) => {
    const draw = () => {
      const sumW = s.dims.reduce((a, d) => a + (+d.w || 0), 0), pool = Math.round(s.target * s.mult);
      b.innerHTML = intro(3, 'وزّع الوزن النسبي على الأبعاد (المجموع 100%)، وحدد عدد العبارات المستهدف في الصورة النهائية ومضاعف المجمّع الأولي.') +
        `<div class="grid3">${`<div class="field"><label class="fl" for="tg">العبارات في الصورة النهائية</label><input type="number" id="tg" value="${s.target}" min="2"></div><div class="field"><label class="fl" for="ml">مضاعف المجمّع الأولي (1–4)</label><input type="number" id="ml" value="${s.mult}" step="0.5" min="1" max="4"></div>`}<div class="tile ${Math.abs(sumW - 100) < 0.5 ? 'good' : 'bad'}"><small>مجموع الأوزان</small><b>${sumW}%</b></div></div>` +
        tableHTML(['البعد', 'الوزن %', 'العبارات النهائية', 'المجمّع الأولي', 'المكتوب حاليًا'], s.dims.map((d, i) => { const fin = Math.round(s.target * (+d.w || 0) / 100), have = s.items.filter(x => x.dim === d.id).length, need = Math.round(fin * s.mult); return [esc(d.name), `<input type="number" data-w="${i}" value="${d.w}" style="width:90px" aria-label="وزن ${esc(d.name)}">`, N(fin, 0), N(need, 0), { n: 1, v: `${have} ${have >= need ? '✓' : ''}` }]; })) +
        `<div class="row"><button class="btn sm ghost" id="eq">وزّع بالتساوي</button><span class="small muted">المجمّع الأولي الكلي: <b class="num">${pool}</b> عبارة</span></div>`;
      $('#tg', b).onchange = e => { s.target = Math.max(2, Math.round(toNum(e.target.value) || 2)); persist(); draw(); };
      $('#ml', b).onchange = e => { s.mult = Math.min(4, Math.max(1, toNum(e.target.value) || 1)); persist(); draw(); };
      $$('[data-w]', b).forEach(x => x.onchange = () => { s.dims[+x.dataset.w].w = Math.max(0, toNum(x.value) || 0); persist(); draw(); });
      $('#eq', b).onclick = () => { const n = s.dims.length, base = Math.floor(100 / n); s.dims.forEach((d, i) => d.w = base + (i < 100 - base * n ? 1 : 0)); persist(); draw(); };
    };
    draw();
  };
  STEP[4] = (b, s, intro, persist) => {
    const draw = () => {
      b.innerHTML = intro(4, 'اكتب عبارات أكثر من المطلوب (من مصادر استنباطية واستقرائية)، وحدد لكل عبارة بعدها واتجاهها: (+) موجبة، (−) سالبة تُعكس درجتها عند التصحيح.') +
        s.dims.map(d => { const its = s.items.filter(i => i.dim === d.id), need = Math.round(s.target * (+d.w || 0) / 100 * s.mult); return `<div class="stack" style="gap:4px"><div class="row"><b class="grow">${esc(d.name)}</b><span class="chip ${its.length >= need ? 'good' : 'warn'}">${its.length}/${need}</span></div>${its.map(it => itemRow(s, it)).join('')}<div class="row"><input type="text" placeholder="اكتب عبارة جديدة لهذا البعد ثم اضغط إضافة" data-new="${d.id}" class="grow" aria-label="عبارة جديدة في ${esc(d.name)}"><button class="btn sm" data-add="${d.id}">${ic('plus')} إضافة</button></div></div>`; }).join('<hr style="border:none;border-top:1px solid var(--line)">') +
        `<div class="row"><span class="chip">${METHODS[meth(s)].t}</span><button class="btn sm soft" id="tplGo">${ic('bolt')} مسودة من قوالب جاهزة</button><button class="btn sm lime" id="aiGen" hidden>${ic('bolt')} ولّد العبارات بمساعد الذكاء الاصطناعي</button><button class="btn sm ghost" id="aiCopy">${ic('copy')} انسخ طلب التوليد بالذكاء الاصطناعي</button></div><p class="small muted" style="margin:0">القوالب والطلب يتبعان طريقة البناء المختارة في الخطوة 7 (سلم الاستجابة). المسودة نقطة بداية فقط: عدّلها لتناسب سمتك، ثم حكّمها.</p>` +
        `<details class="steps"><summary>إضافة عبارات كثيرة دفعة واحدة</summary><p class="small muted">كل عبارة في سطر. اكتب (−) في بداية العبارة السالبة.</p><select id="bulkDim" aria-label="البعد">${s.dims.map(d => `<option value="${d.id}">${esc(d.name)}</option>`).join('')}</select><textarea id="bulk" style="margin-top:6px"></textarea><button class="btn sm" id="bulkAdd" style="margin-top:6px">إضافة الكل</button></details>`;
      bindItems(b, s, persist, draw);
      $$('[data-add]', b).forEach(x => x.onclick = () => { const inp = $(`[data-new="${x.dataset.add}"]`, b), t = inp.value.trim(); if (!t) return; s.items.push({ id: uid('i'), text: t, dim: x.dataset.add, dir: 1, src: 'استنباطي', ess: null, use: null, keep: true }); quest('items', 1); persist(); draw(); const n = $(`[data-new="${x.dataset.add}"]`, b); n && n.focus(); });
      $$('[data-new]', b).forEach(x => x.onkeydown = e => { if (e.key === 'Enter') { e.preventDefault(); $(`[data-add="${x.dataset.new}"]`, b).click(); } });
      $('#tplGo', b).onclick = () => { const k = Math.max(4, Math.round(s.target * s.mult) || 12); const its = tplItems(meth(s), s.construct || s.name || 'السمة', s.dims.map(d => d.id), k); its.forEach(x => s.items.push(Object.assign({ id: uid('i'), src: 'قالب جاهز', ess: null, use: null, keep: true }, x))); quest('items', its.length); persist(); draw(); toast(`أُضيفت ${its.length} عبارة من القوالب`); };
      if (typeof AI !== 'undefined') AI.available().then(ok => { const g = $('#aiGen', b); if (!ok || !g) return; g.hidden = false; g.onclick = async () => {
        g.disabled = true; const old = g.innerHTML; g.textContent = 'جارٍ توليد العبارات…';
        try { const k = Math.max(6, Math.round(s.target * s.mult) || 12); const its = await AI.items(s, k); if (!its || !its.length) throw { code: 'invalid_json' };
          its.forEach(x => { const d = s.dims.find(dd => dd.name === String(x.dim || '').trim()) || s.dims[0]; s.items.push({ id: uid('i'), text: String(x.text || '').trim().slice(0, 300), dim: d.id, dir: x.neg ? -1 : 1, src: 'ذكاء اصطناعي', ess: null, use: null, keep: true }); });
          quest('items', its.length); persist(); draw(); toast(`أضاف المساعد ${its.length} عبارة؛ راجعها وعدّلها قبل التحكيم`);
        } catch (e) { toast(AI.ERR[e && e.code] || 'تعذر التوليد الآن؛ استخدم القوالب أو انسخ الطلب'); g.disabled = false; g.innerHTML = old; } }; });
      $('#aiCopy', b).onclick = () => copyText(aiPrompt(s)).then(() => toast('نُسخ الطلب؛ الصقه في مساعد الذكاء الاصطناعي ثم انسخ العبارات إلى «إضافة عبارات كثيرة»'));
      $('#bulkAdd', b).onclick = () => { const d = $('#bulkDim', b).value; const lines = $('#bulk', b).value.split(/\n/).map(x => x.trim()).filter(Boolean); lines.forEach(l => { const neg = /^\(?[−-]\)?\s*/.test(l); s.items.push({ id: uid('i'), text: l.replace(/^\(?[−-]\)?\s*/, ''), dim: d, dir: neg ? -1 : 1, src: 'استنباطي', ess: null, use: null, keep: true }); }); quest('items', lines.length); persist(); draw(); };
    };
    draw();
  };
  function itemRow(s, it, opts = {}) {
    const w = wordingWarnings(s, it), n = s.items.indexOf(it) + 1;
    return `<div class="itemrow" data-row="${it.id}"><span class="no">${n}</span><div><input type="text" value="${esc(it.text)}" data-txt="${it.id}" aria-label="نص العبارة ${n}" ${it.keep === false ? 'style="text-decoration:line-through;opacity:.6"' : ''}>${w.length ? `<div class="warns">${w.map(x => `<span class="chip ${x[0]}">${x[1]}</span>`).join('')}</div>` : (opts.showOk ? '<div class="warns"><span class="chip good">لا ملاحظات</span></div>' : '')}</div><div class="row" style="gap:4px;flex-wrap:nowrap">${meth(s) === 'sjt' ? `<select data-key="${it.id}" aria-label="مفتاح التصحيح للعبارة ${n}" title="التصرف الأفضل" style="width:70px">${s.scale.labels.map((l, j) => `<option value="${j}" ${(it.key || 0) === j ? 'selected' : ''}>✔ ${esc(l)}</option>`).join('')}</select>` : ''}${meth(s) === 'thurstone' ? `<input type="number" min="1" max="11" step="0.1" data-sv="${it.id}" value="${it.sv ?? ''}" placeholder="قيمة" style="width:76px" aria-label="القيمة المقياسية للعبارة ${n}">` : ''}<button class="dirbtn ${it.dir < 0 ? 'neg' : 'pos'}" data-dir="${it.id}" aria-label="الاتجاه: ${it.dir < 0 ? 'سالبة' : 'موجبة'}" title="${it.dir < 0 ? 'سالبة (تُعكس)' : 'موجبة'}">${it.dir < 0 ? '−' : '+'}</button><button class="ibtn" data-irm="${it.id}" aria-label="حذف العبارة">${ic('trash')}</button></div></div>`;
  }
  function bindItems(b, s, persist, draw) {
    $$('[data-txt]', b).forEach(x => x.onchange = () => { const it = s.items.find(i => i.id === x.dataset.txt); it.text = x.value.trim(); persist(); draw(); });
    $$('[data-dir]', b).forEach(x => x.onclick = () => { const it = s.items.find(i => i.id === x.dataset.dir); it.dir = it.dir < 0 ? 1 : -1; persist(); draw(); });
    $$('[data-irm]', b).forEach(x => x.onclick = () => { s.items = s.items.filter(i => i.id !== x.dataset.irm); persist(); draw(); });
    $$('[data-key]', b).forEach(x => x.onchange = () => { const it = s.items.find(i => i.id === x.dataset.key); it.key = +x.value; persist(); });
    $$('[data-sv]', b).forEach(x => x.onchange = () => { const it = s.items.find(i => i.id === x.dataset.sv); const v = toNum(x.value); it.sv = isFinite(v) && v >= 1 && v <= 11 ? v : null; persist(); });
  }
  STEP[5] = (b, s, intro, persist) => {
    const draw = () => {
      const k = kept(s), bad = k.filter(i => wordingWarnings(s, i).some(x => x[0] === 'bad')).length, warn = k.filter(i => wordingWarnings(s, i).length).length;
      const bal = s.dims.map(d => { const its = k.filter(i => i.dim === d.id), neg = its.filter(i => i.dir < 0).length; return [esc(d.name), N(its.length, 0), N(neg, 0), its.length ? (neg === 0 ? '<span class="chip warn">لا توجد عبارات سالبة</span>' : neg / its.length > 0.5 ? '<span class="chip warn">السالبة أكثر من النصف</span>' : '<span class="chip good">متوازن</span>') : '—']; });
      b.innerHTML = intro(5, 'يفحص المساعد العبارات آليًا: النفي المزدوج، والعبارات المركبة، والطويلة، والكلمات المطلقة، والتكرار. الفحص الآلي مساعد فقط ولا يغني عن حكم الخبراء.') +
        `<div class="kpis"><div class="tile ${bad ? 'bad' : 'good'}"><small>ملاحظات جوهرية</small><b>${bad}</b></div><div class="tile"><small>عبارات بها تنبيهات</small><b>${warn}</b></div><div class="tile"><small>إجمالي العبارات</small><b>${k.length}</b></div></div>` +
        tableHTML(['البعد', 'العبارات', 'السالبة', 'توازن الاتجاه'], bal) +
        `<div class="stack" style="gap:0">${k.map(it => itemRow(s, it, { showOk: true })).join('')}</div>` +
        `<details class="steps"><summary>قواعد الصياغة</summary><ul class="small"><li>فكرة واحدة في كل عبارة، ولغة مناسبة للفئة.</li><li>تجنب النفي المزدوج والعبارات العامة.</li><li>عبارة تقريرية بضمير المتكلم، لا سؤال.</li><li>تجنب الإيحاء بالإجابة المرغوبة اجتماعيًا.</li><li>عبارات سالبة محسوبة (نحو الربع إلى الثلث) لضبط الموافقة المنهجية، مع فحص أدائها لاحقًا.</li></ul></details><section class="card stack aud-box" id="audBox"></section>`;
      bindItems(b, s, persist, draw);
      audPanel($('#audBox', b), s, persist);
    };
    draw();
  };
  /* ---- audience versions panel ---- */
  function audPanel(el, s, persist) {
    if (!el || typeof AUD === 'undefined') return;
    s.forms = s.forms || []; let cur = s._editForm && s.forms.find(f => f.id === s._editForm) || null;
    const k = kept(s), lo = isBin(s) ? 0 : 1;
    const draw = () => {
      const pickList = `<div class="row" style="flex-wrap:wrap;gap:6px"><span class="chip ${!cur ? 'blue' : ''}">الأصلية</span>${s.forms.map(f => `<button class="chip ${cur && cur.id === f.id ? 'lime' : ''}" data-fe="${f.id}">${esc(f.label)}</button>`).join('')}</div>`;
      let body = '';
      if (!cur) {
        body = `<div class="grid2">${AUD.selectorsHTML({ p: 'teen', r: 'ammiya' }, 'au')}<div id="auTips"></div></div><div class="row"><button class="btn sm" id="auNew">${ic('plus')} أنشئ نسخة لهذه الفئة</button></div>`;
      } else {
        const p = AUD.prof(cur.p), sameN = (cur.labels || []).length === s.scale.labels.length;
        body = `<div class="row"><b class="grow">${esc(cur.label)}</b><button class="btn sm lime" id="auAI" hidden>${ic('bolt')} حسّن الصياغة بالذكاء الاصطناعي</button><button class="btn sm ghost" id="auCp">${ic('copy')} انسخ طلب التكييف</button><button class="btn sm danger" id="auDel">${ic('trash')} احذف النسخة</button><button class="btn sm ghost" id="auBack">رجوع</button></div>
          ${AUD.tipsHTML(cur.p)}
          ${p.neg === false && k.some(i => i.dir < 0) ? '<div class="notice warn small"><b>تنبيه لهذه الفئة</b>في المقياس عبارات سالبة، وهذه الفئة يصعب عليها النفي. الحل الآمن: استبدلها بعبارات مثبتة <b>في كل النسخ</b> (بما فيها الأصلية) مع تعديل اتجاه التصحيح، حتى تبقى النسخ متكافئة.</div>' : ''}
          ${p.pts.indexOf(s.scale.labels.length) < 0 ? `<div class="notice warn small"><b>عدد نقاط التدريج</b>المناسب لهذه الفئة ${p.pts.join(' أو ')} نقاط، والمقياس ${s.scale.labels.length}. لا يمكن تغيير عدد النقاط داخل نسخة (يكسر المقارنة)؛ إن احتجت ذلك فابنِ مقياسًا مستقلًا لهذه الفئة بمعايير خاصة.</div>` : ''}
          <div class="tw"><table><thead><tr><th>#</th><th>العبارة الأصلية</th><th>صياغة هذه النسخة</th><th>فحص السلامة</th></tr></thead><tbody>${k.map((it, n) => { const w = AUD.check(it.text, cur.texts[it.id] || '', cur.p, cur.r); return `<tr><td class="num">${n + 1}</td><td class="small">${esc(it.text)}</td><td><input type="text" data-at="${it.id}" value="${esc(cur.texts[it.id] || '')}" aria-label="صياغة العبارة ${n + 1}"></td><td>${w.length ? w.map(x => `<span class="chip ${x[0]}">${x[1]}</span>`).join(' ') : '<span class="chip good">متكافئة شكليًا</span>'}</td></tr>`; }).join('')}</tbody></table></div>
          <div class="field"><span class="fl">بدائل الاستجابة لهذه النسخة (نفس العدد والترتيب)</span><div class="grid3">${(sameN ? cur.labels : s.scale.labels).map((l, i) => `<input type="text" data-al="${i}" value="${esc(l)}" aria-label="البديل ${i + 1}">`).join('')}</div></div>
          <div class="field"><label class="fl" for="auIn">تعليمات هذه النسخة</label><textarea id="auIn">${esc(cur.instr || s.instr)}</textarea></div>`;
      }
      el.innerHTML = `<div class="row"><h4 class="grow" style="margin:0">${ic('user')} نسخ حسب الفئة العمرية ولغة الصياغة</h4><span class="chip">${s.forms.length} نسخة</span></div>
        <p class="small muted" style="margin:0">اكتب نسخة من العبارات تناسب جيلًا معينًا (ألفا، Z، الألفية، X، كبار السن) بالفصحى أو الفصحى الميسرة أو العامية. يتغير <b>اللفظ</b> فقط؛ ويبقى المعنى، واتجاه العبارة، والإطار الزمني، وعدد نقاط التدريج ثابتة. وبعد جمع البيانات يقارن المعالج النسخ بالأداء التفاضلي للعبارات ليتأكد أنها تقيس السمة نفسها.</p>${pickList}${body}`;
      $$('[data-fe]', el).forEach(x => x.onclick = () => { cur = s.forms.find(f => f.id === x.dataset.fe); s._editForm = cur.id; draw(); });
      const tipsBox = $('#auTips', el), pSel = $('#auP', el); if (tipsBox && pSel) { const upd = () => tipsBox.innerHTML = AUD.tipsHTML(pSel.value); pSel.onchange = upd; upd(); }
      const nw = $('#auNew', el); if (nw) nw.onclick = () => {
        const p = $('#auP', el).value, r = $('#auR', el).value, P = AUD.prof(p), R0 = AUD.REGISTERS.find(x => x.id === r);
        const f = { id: uid('f'), p, r, label: P.t.split(' ')[0] + ' · ' + R0.t, texts: {}, labels: AUD.labels(s.scale.labels, p, r), instr: AUD.instructions(p, r) || s.instr };
        k.forEach(it => f.texts[it.id] = AUD.adapt(it.text, p, r).text);
        s.forms.push(f); cur = f; s._editForm = f.id; persist(); draw(); toast('أُنشئت النسخة بتحويل آلي أولي؛ راجع كل عبارة');
      };
      if (!cur) return;
      $$('[data-at]', el).forEach(x => x.onchange = () => { cur.texts[x.dataset.at] = x.value.trim(); persist(); draw(); });
      $$('[data-al]', el).forEach(x => x.onchange = () => { if ((cur.labels || []).length !== s.scale.labels.length) cur.labels = s.scale.labels.slice(); cur.labels[+x.dataset.al] = x.value.trim() || s.scale.labels[+x.dataset.al]; persist(); });
      $('#auIn', el).onchange = e => { cur.instr = e.target.value.trim(); persist(); };
      $('#auBack', el).onclick = () => { cur = null; s._editForm = null; draw(); };
      $('#auDel', el).onclick = () => confirmBox('ستُحذف النسخة (الاستجابات المسجلة بها تبقى موسومة باسمها).', 'حذف النسخة', () => { s.forms = s.forms.filter(f => f !== cur); if (s.activeForm === cur.id) s.activeForm = null; cur = null; s._editForm = null; persist(); draw(); });
      const items = k.map(it => ({ id: it.id, text: it.text }));
      $('#auCp', el).onclick = () => copyText(AUD.prompt(items, cur.p, cur.r, s.construct || s.name)).then(() => toast('نُسخ الطلب؛ الصقه في مساعد الذكاء الاصطناعي ثم انقل الصياغات إلى الجدول'));
      if (typeof AI !== 'undefined') AI.available().then(ok => { const g = $('#auAI', el); if (!ok || !g) return; g.hidden = false; g.onclick = async () => {
        g.disabled = true; g.textContent = 'جارٍ تكييف الصياغة…';
        try { const sm = await window.claude.use('sample'); const r = await sm.json(AUD.prompt(items, cur.p, cur.r, s.construct || s.name)); (r.items || []).forEach(x => { if (cur.texts[x.id] !== undefined && x.text) cur.texts[x.id] = String(x.text).slice(0, 300); }); persist(); draw(); toast('راجع فحص السلامة لكل عبارة'); }
        catch (e) { toast((AI.ERR || {})[e && e.code] || 'تعذر التكييف الآن'); g.disabled = false; }
      }; });
    };
    draw();
  }
  function versionsCompare(s, A) {
    if (typeof AUD === 'undefined' || !A.rows || !A.meta) return '';
    const groups = {}; A.meta.forEach((m, i) => { const f = m.form || 'base'; (groups[f] = groups[f] || []).push(A.rows[i]); });
    const keys = Object.keys(groups).filter(k2 => groups[k2].length >= 10); if (keys.length < 2) return Object.keys(groups).length > 1 ? '<div class="notice small"><b>مقارنة النسخ</b>تحتاج 10 استجابات على الأقل لكل نسخة لبدء فحص تكافؤ النسخ.</div>' : '';
    const name = k2 => k2 === 'base' ? 'الأصلية' : ((s.forms || []).find(f => f.id === k2) || { label: 'نسخة محذوفة' }).label;
    const ref = keys.indexOf('base') >= 0 ? 'base' : keys.sort((a, c) => groups[c].length - groups[a].length)[0];
    const lo = isBin(s) ? 0 : 1, hi = isBin(s) ? 1 : pts(s), nI = A.items.length;
    const sum = keys.map(k2 => { const st = PSY.itemStats(groups[k2]); return [esc(name(k2)), N(groups[k2].length, 0), N(st.alpha, 3), N(PSY.mean(groups[k2].map(r => PSY.sum(r))))]; });
    let h = `<section class="stack"><h4 style="margin:0">${ic('shield')} تكافؤ النسخ: هل تقيس السمة نفسها؟</h4>${tableHTML(['النسخة', 'ن', 'ألفا', 'متوسط الدرجة الكلية'], sum)}`;
    keys.filter(k2 => k2 !== ref).forEach(k2 => {
      const d = AUD.stdDIF(groups[ref], groups[k2], nI, lo, hi);
      h += `<p class="small" style="margin:0"><b>${esc(name(k2))}</b> مقارنة بـ <b>${esc(name(ref))}</b> (مؤشر التوحيد لدورانز وكوليك، بعد مطابقة المستجيبين على الدرجة الكلية):</p>` + tableHTML(['#', 'العبارة', 'الفرق المعياري STD', 'الحكم'], A.items.map((it, j) => ({ cls: d[j].level === 'flag' ? 'flag' : '', cells: [N(s.items.indexOf(it) + 1, 0), esc(formText(s, it, (s.forms || []).find(f => f.id === k2) || null)), N(d[j].std), d[j].level === 'ok' ? '<span class="chip good">متكافئة</span>' : d[j].level === 'review' ? '<span class="chip warn">تُراجع</span>' : d[j].level === 'flag' ? '<span class="chip bad">تحيز في الصياغة</span>' : '—'] })));
    });
    return h + '<p class="small muted">الفرق المعياري أقل من 10% من مدى التدريج = متكافئة؛ 10–20% = تُراجع؛ أكثر من 20% = الصياغة غيّرت ما تقيسه العبارة فتُعدّل. هذا فحص أولي؛ للتأكيد النهائي استخدم التحليل العاملي التوكيدي متعدد المجموعات (التكافؤ القياسي) في برنامج AMOS بموقع الإحصاء.</p></section>';
  }
  function methodPicker(s) {
    const m = METHODS[meth(s)], k = kept(s).length || s.target, r = m.n(k);
    return `<div class="field"><span class="fl">طريقة البناء (مرتبة من الأقدم إلى الأحدث)</span><div class="seg" style="flex-wrap:wrap">${MORDER.map(x => `<button data-me="${x}" aria-pressed="${meth(s) === x}">${METHODS[x].t} <span class="small muted num">${METHODS[x].yr}</span></button>`).join('')}</div>
      <div class="card" style="margin-top:8px;padding:12px"><div class="row"><b class="grow">${m.t} <span class="small muted" dir="ltr">${m.en}</span></b><span class="chip ${m.era.startsWith('كلاس') ? 'blue' : 'good'}">${m.era} · ${m.yr}</span></div><p class="small" style="margin:6px 0">${m.d}</p><div class="notice small" style="margin:0"><b>العينة المقترحة</b>${r[1]} ← الحد الأدنى ≈ <span class="num">${r[0]}</span>.</div></div></div>`;
  }
  STEP[6] = (b, s, intro, persist) => {
    const names = { agree5: 'موافقة خماسي', apply5: 'انطباق خماسي', freq5: 'تكرار خماسي', agree4: 'موافقة رباعي (بلا محايد)', apply4: 'انطباق رباعي', three: 'ثلاثي', binary: 'ثنائي (نعم/لا)', agreeBin: 'ثنائي (أوافق/لا أوافق)', osgood: 'سباعي ثنائي القطب', sjt4: 'أربعة تصرفات (أ–د)', forced2: 'اختيار بين عبارتين' };
    const draw = () => {
      b.innerHTML = intro(6, 'اختر طريقة بناء المقياس، ثم تدريجًا موحدًا لكل العبارات. البديل الأول يأخذ أعلى درجة في العبارة الموجبة، وتُعكس الدرجات تلقائيًا في العبارات السالبة.') +
        methodPicker(s) +
        `<div class="seg">${Object.keys(PRESETS).map(k => `<button data-ps="${k}" aria-pressed="${s.scale.preset === k}">${names[k]}</button>`).join('')}</div>
        <div class="grid3">${s.scale.labels.map((l, i) => `<div class="field"><label class="fl" for="lb${i}">البديل ${i + 1} (درجة ${isBin(s) ? (i === 0 ? 1 : 0) : s.scale.labels.length - i})</label><input type="text" id="lb${i}" data-lb="${i}" value="${esc(l)}"></div>`).join('')}</div>
        <div class="field"><label class="fl" for="ins">تعليمات المقياس</label><textarea id="ins">${esc(s.instr)}</textarea></div>
        <div class="row"><label class="row small"><input type="checkbox" id="dg" ${s.demo.gender ? 'checked' : ''}> سؤال النوع</label><label class="row small"><input type="checkbox" id="da" ${s.demo.age ? 'checked' : ''}> سؤال العمر</label></div>
        ${s.responses.length ? '<div class="notice warn small">لديك استجابات مسجلة؛ تغيير عدد البدائل الآن يجعل الاستجابات السابقة غير قابلة للمقارنة.</div>' : ''}`;
      $$('[data-me]', b).forEach(x => x.onclick = () => { s.method = x.dataset.me; const p = METHODS[s.method].preset; s.scale.preset = p; s.scale.labels = PRESETS[p].slice(); persist(); draw(); });
      $$('[data-ps]', b).forEach(x => x.onclick = () => { s.scale.preset = x.dataset.ps; s.scale.labels = PRESETS[x.dataset.ps].slice(); persist(); draw(); });
      $$('[data-lb]', b).forEach(x => x.onchange = () => { s.scale.labels[+x.dataset.lb] = x.value.trim() || ('بديل ' + (+x.dataset.lb + 1)); s.scale.preset = 'custom'; persist(); });
      $('#ins', b).onchange = e => { s.instr = e.target.value.trim(); persist(); };
      $('#dg', b).onchange = e => { s.demo.gender = e.target.checked; persist(); };
      $('#da', b).onchange = e => { s.demo.age = e.target.checked; persist(); };
    };
    draw();
  };
  STEP[7] = (b, s, intro, persist) => {
    const draw = () => {
      const Nj = s.judges, crit = PSY.cvrCritical(Nj), law = PSY.lawsheCritical(Nj);
      b.innerHTML = intro(7, 'اعرض العبارات على المحكمين، ثم سجّل لكل عبارة عدد من قالوا إنها «أساسية». يحسب الموقع نسبة صدق المحتوى (لوشي) ويقارنها بالقيمة الحرجة لعدد المحكمين.') +
        `<div class="grid3"><div class="field"><label class="fl" for="nj">عدد المحكمين</label><input type="number" id="nj" value="${Nj}" min="3" max="60"></div><div class="tile hl"><small>القيمة الحرجة (أير وسكالي)</small><b>${fmt(crit.cvr)}</b></div><div class="tile"><small>جدول لوشي</small><b>${fmt(law)}</b></div></div>
        <div class="row"><button class="btn sm ghost" id="cpJ">${ic('copy')} نسخ استمارة التحكيم</button><button class="btn sm ghost" id="apply">طبّق القرار: استبعد المرفوضة</button><button class="btn sm ghost" id="restore">أعد كل العبارات</button></div>` +
        tableHTML(['#', 'العبارة', 'أساسية', 'CVR', 'القرار'], s.items.map((it, i) => { const c = it.ess == null ? null : PSY.cvr(it.ess, Nj), ok = c != null && c >= crit.cvr - 1e-9; return { cls: c != null && !ok ? 'flag' : '', cells: [N(i + 1, 0), esc(it.text) + (it.keep === false ? ' <span class="chip bad">مستبعدة</span>' : ''), `<input type="number" min="0" max="${Nj}" data-ess="${it.id}" value="${it.ess ?? ''}" style="width:80px" aria-label="عدد المحكمين الذين قالوا أساسية للعبارة ${i + 1}">`, N(c), c == null ? '<span class="chip">بانتظار التحكيم</span>' : ok ? '<span class="chip good">تُقبل</span>' : '<span class="chip bad">تُراجع أو تُحذف</span>'] }; })) +
        (s.items.every(i => i.ess != null) ? `<div class="notice good small">CVI (متوسط CVR للعبارات المقبولة) = <b class="num">${fmt(PSY.mean(s.items.filter(i => PSY.cvr(i.ess, Nj) >= crit.cvr - 1e-9).map(i => PSY.cvr(i.ess, Nj))), 3)}</b></div>` : '');
      $('#nj', b).onchange = e => { s.judges = Math.max(3, Math.min(60, Math.round(toNum(e.target.value) || 10))); persist(); draw(); };
      $$('[data-ess]', b).forEach(x => x.onchange = () => { const it = s.items.find(i => i.id === x.dataset.ess); const v = x.value === '' ? null : Math.max(0, Math.min(s.judges, Math.round(toNum(x.value)))); it.ess = v; persist(); draw(); });
      $('#apply', b).onclick = () => { let n = 0; s.items.forEach(it => { if (it.ess != null && PSY.cvr(it.ess, s.judges) < crit.cvr - 1e-9) { it.keep = false; n++; } }); persist(); toast(n ? 'استُبعدت ' + n + ' عبارة من النموذج' : 'لا عبارات دون القيمة الحرجة'); draw(); };
      $('#restore', b).onclick = () => { s.items.forEach(it => it.keep = true); persist(); draw(); };
      $('#cpJ', b).onclick = () => copyText(`استمارة تحكيم: ${s.name}\nالسمة: ${s.construct}\nالتعريف الإجرائي: ${s.defO}\n\nأمام كل عبارة: (أساسية / مفيدة لكنها غير أساسية / غير ضرورية) — وملاحظاتك على الصياغة.\n\n` + s.dims.map(d => `البعد: ${d.name} — ${d.def}\n` + s.items.filter(i => i.dim === d.id).map((it) => `${s.items.indexOf(it) + 1}. ${it.text}  [   ] أساسية  [   ] مفيدة  [   ] غير ضرورية`).join('\n')).join('\n\n'));
    };
    draw();
  };
  STEP[8] = (b, s, intro, persist) => {
    const def = formDef(s), pilot = s.responses.filter(x => x.pilot).length;
    b.innerHTML = intro(8, 'جرّب النموذج على عينة صغيرة (نحو 30) واطلب من بعضهم التفكير بصوت مرتفع لكشف العبارات الغامضة. استجابات التجريب تُحفظ منفصلة ولا تدخل التحليل.') +
      `<div class="row"><button class="btn" id="kp">${ic('play')} طبّق تجريبيًا على هذا الجهاز</button><span class="chip">${pilot} استجابة تجريبية</span>${pilot ? '<button class="btn sm ghost" id="clrP">حذف استجابات التجريب</button>' : ''}</div>
      <div class="field"><label class="fl" for="pn">ملاحظات التجريب (عبارات غامضة، زمن الإجابة، تعليقات المستجيبين)</label><textarea id="pn">${esc(s.pilotNotes)}</textarea></div>
      <h4 style="margin:6px 0 0">معاينة النموذج كما يراه المستجيب</h4>${kept(s).length ? formHTML(def, { preview: true }) : '<p class="muted">أضف عبارات أولًا.</p>'}`;
    $('#pn', b).onchange = e => { s.pilotNotes = e.target.value.trim(); persist(); };
    $('#kp', b).onclick = () => kiosk(s, true);
    const cp = $('#clrP', b); if (cp) cp.onclick = () => { s.responses = s.responses.filter(x => !x.pilot); persist(); rerender(); };
  };
  STEP[9] = (b, s, intro, persist) => {
    const A = analyze(s), r = s.responses.filter(x => !x.pilot);
    const live = window.ACCT && ACCT.forms && ACCT.forms.available();
    b.innerHTML = intro(9, 'اجمع الاستجابات بالطريقة المناسبة لك، وتُضاف كلها إلى المقياس نفسه ويُحدّث التحليل فورًا.') +
      ((s.forms || []).length ? `<div class="row small"><label for="actF"><b>النسخة المستخدمة في الجمع:</b></label><select id="actF"><option value="">الأصلية</option>${s.forms.map(f => `<option value="${f.id}" ${s.activeForm === f.id ? 'selected' : ''}>${esc(f.label)}</option>`).join('')}</select><span class="muted">كل استجابة تُوسم بنسختها، ثم تُقارن النسخ تلقائيًا.</span></div>` : '') +
      `<div class="kpis"><div class="tile hl"><small>استجابات صالحة للتحليل</small><b>${A.n}</b></div><div class="tile"><small>كل الاستجابات</small><b>${r.length}</b></div><div class="tile"><small>آخر استجابة</small><b style="font-size:15px">${r.length ? new Date(Math.max(...r.map(x => x.ts))).toLocaleString('ar-EG', { dateStyle: 'short', timeStyle: 'short' }) : '—'}</b></div></div>
      <div class="grid2">
        <button class="linkcard" id="cK"><span class="ic">${ic('play')}</span><span><b>جمع مباشر على هذا الجهاز</b><span>سلّم الجهاز للمستجيبين واحدًا تلو الآخر (في قاعة أو معمل)؛ يعود النموذج فارغًا بعد كل إرسال.</span></span></button>
        <button class="linkcard" id="cL" style="--c:var(--good);--s:var(--good-soft)"><span class="ic">${ic('link')}</span><span><b>نموذج أونلاين مباشر ${live ? '<span class="live-dot" aria-hidden="true"></span>' : ''}</b><span>${live ? 'رابط تشاركه، وتصل الإجابات إلى حسابك لحظيًا.' : 'يحتاج تفعيل الحسابات (Firebase) على نسخة الموقع المنشورة على GitHub.'}</span></span></button>
        <button class="linkcard" id="cC" style="--c:var(--violet);--s:var(--violet-soft)"><span class="ic">${ic('whats')}</span><span><b>كود المقياس + أكواد الاستجابة</b><span>أرسل كود المقياس (واتساب مثلًا)؛ يجيب المستجيب من صفحة «أجب عن مقياس» ويرسل لك كودًا قصيرًا تلصقه هنا.</span></span></button>
        <button class="linkcard" id="cG" style="--c:var(--amber);--s:var(--amber-soft)"><span class="ic">${ic('form')}</span><span><b>Google Forms أو Excel</b><span>انسخ العبارات إلى Google Forms، ثم استورد ملف CSV الناتج، أو صدّر بياناتك.</span></span></button>
      </div>
      <div id="colPanel"></div>
      <div class="row small"><button class="btn sm ghost" id="simGo">${ic('bolt')} ولّد عينة افتراضية للتدريب</button>${r.some(x => x.sim) ? `<button class="btn sm ghost" id="simDel">حذف البيانات الافتراضية (${r.filter(x => x.sim).length})</button>` : ''}<span class="muted">للتدرب على التحليل قبل جمع بيانات حقيقية؛ احذفها قبل التحليل النهائي.</span></div>
      ${A.total ? itemTable(s, A) + versionsCompare(s, A) + (typeof THESIS !== 'undefined' ? THESIS.panel(s, A) : '') : `<div class="notice">التحليل يبدأ عند وصول 3 استجابات مكتملة على الأقل (ويُنصح بـ 30 فأكثر).</div>`}
      ${r.length ? `<details class="steps"><summary>إدارة الاستجابات (${r.length})</summary><div class="row" style="margin-top:8px"><button class="btn sm ghost" id="csvOut">${ic('download')} تصدير CSV</button><button class="btn sm danger" id="delAll">${ic('trash')} حذف كل الاستجابات</button></div></details>` : ''}`;
    $('#cK', b).onclick = () => kiosk(s, false); if (typeof THESIS !== 'undefined' && A.total) THESIS.bind(b, s, A);
    const af = $('#actF', b); if (af) af.onchange = () => { s.activeForm = af.value || null; persist(); toast('ستُجمع الاستجابات القادمة بنسخة: ' + af.options[af.selectedIndex].text); };
    $('#simGo', b).onclick = () => { if (!kept(s).length) return toast('أضف عبارات أولًا'); const n = Math.min(300, Math.max(30, METHODS[meth(s)].n(kept(s).length)[0])); simulate(s, n); persist(); rerender(); toast(`وُلدت ${n} استجابة افتراضية`); };
    const sd0 = $('#simDel', b); if (sd0) sd0.onclick = () => { s.responses = s.responses.filter(x => !x.sim); persist(); rerender(); };
    $('#cC', b).onclick = () => codesPanel(s, $('#colPanel', b));
    $('#cG', b).onclick = () => gformsPanel(s, $('#colPanel', b));
    $('#cL', b).onclick = () => livePanel(s, $('#colPanel', b));
    const co = $('#csvOut', b); if (co) co.onclick = () => downloadFile((s.name || 'scale') + '.csv', toCSV(s), 'text/csv;charset=utf-8');
    const da = $('#delAll', b); if (da) da.onclick = () => confirmBox('ستُحذف كل الاستجابات غير التجريبية لهذا المقياس.', 'حذف الاستجابات', () => { s.responses = s.responses.filter(x => x.pilot); persist(); rerender(); });
  };
  function simulate(s, n) {
    const its = kept(s), k = pts(s), bin = isBin(s), ver = version(s), m = meth(s);
    const gauss = () => { let u = 0, v = 0; while (!u) u = Math.random(); while (!v) v = Math.random(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };
    const lam = its.map((_, i) => 0.55 + ((i * 13) % 7) / 20), thr = its.map((it, i) => m === 'guttman' ? -1.2 + 2.4 * i / Math.max(1, its.length - 1) : m === 'thurstone' && it.sv != null ? 0 : ((i * 37) % 10 - 5) / 10);
    for (let p = 0; p < n; p++) {
      const th = gauss();
      const vals = its.map((it, j) => {
        let z = lam[j] * th + Math.sqrt(1 - lam[j] ** 2) * gauss() - thr[j];
        if (m === 'thurstone' && it.sv != null) z = 1.2 - Math.abs((th * 2 + 6) - it.sv) / 1.6 + gauss() * 0.5;
        if (m === 'sjt') { const good = z > -0.3; const key = it.key || 0; const j2 = good ? key : [0, 1, 2, 3].filter(x => x !== key)[Math.floor(Math.random() * 3)] % k; return k - j2; }
        if (bin) return z > 0 ? 1 : 0;
        const cut = [-1.3, -0.45, 0.35, 1.15, 1.9, 2.4].slice(0, k - 1); const sc = 1 + cut.filter(c => z > c).length; return it.dir < 0 ? k + 1 - sc : sc;
      });
      addResponse(s, ver, vals, { src: 'افتراضية', sim: true, g: Math.random() < 0.5 ? 'ذكر' : 'أنثى', a: String(18 + Math.floor(Math.random() * 8)) });
    }
  }
  function itemTable(s, A) {
    const t = A.total, e = A.ext;
    return `<section class="stack"><h4 style="margin:0">تحليل الفقرات (ن = ${A.n})</h4>${tableHTML(['#', 'العبارة', 'البعد', 'المتوسط', 'الانحراف', 'r المصحح', 'ألفا عند الحذف', e ? 't الطرفيتين' : '', 'الحكم'].filter(Boolean), A.items.map((it, j) => { const bad = t.rit[j] < 0.3 || (e && e.items[j].p >= 0.05); const d = s.dims.find(x => x.id === it.dim); return { cls: bad ? 'flag' : '', cells: [N(s.items.indexOf(it) + 1, 0), esc(it.text) + (it.dir < 0 ? ' <span class="chip">معكوسة</span>' : ''), esc(d ? d.name : ''), N(t.itemMean[j]), N(t.itemSd[j]), N(t.rit[j]), N(t.alphaIfDeleted[j], 3), ...(e ? [N(e.items[j].t)] : []), bad ? `<span class="chip bad">${t.rit[j] < 0.3 ? 'r < 0.30' : 'تمييز غير دال'}</span>` : '<span class="chip good">جيدة</span>'] }; }))}<p class="small muted">العبارة الضعيفة تُراجع صياغتها واتجاه تصحيحها قبل حذفها؛ وألفا عند الحذف وحدها لا تكفي للحكم (القاعدة 10).</p></section>`;
  }
  STEP[10] = (b, s, intro) => {
    const A = analyze(s);
    if (!A.total) { b.innerHTML = intro(10, 'يُحسب الثبات بعد جمع البيانات.') + '<div class="notice">اجمع 3 استجابات على الأقل في الخطوة 10.</div>'; return; }
    const [c, tx] = relVerdict(A.total.alpha);
    b.innerHTML = intro(10, 'ثبات المقياس الكلي والأبعاد: ألفا كرونباخ، وأوميغا (من تشبعات العامل الأول لكل بعد)، والتجزئة النصفية' + (isBin(s) ? '، وKR‑20 للفقرات الثنائية' : '') + '.') +
      `<div class="kpis"><div class="tile hl"><small>ألفا للمقياس الكلي</small><b>${fmt(A.total.alpha, 3)}</b></div>${A.split ? `<div class="tile"><small>سبيرمان–براون</small><b>${fmt(A.split.sb, 3)}</b></div><div class="tile"><small>جتمان</small><b>${fmt(A.split.guttman, 3)}</b></div>` : ''}${A.kr20 ? `<div class="tile"><small>KR‑20</small><b>${fmt(A.kr20.value, 3)}</b></div>` : ''}${(ci => ci ? `<div class="tile"><small>فترة الثقة 95% لألفا (Feldt)</small><b class="ltr">[${fmt(ci.lo, 3)}, ${fmt(ci.hi, 3)}]</b></div>` : '')(PSY.alphaCI ? PSY.alphaCI(A.total.alpha, A.total.n, A.total.k) : null)}<div class="tile"><small>المستجيبون n</small><b>${A.n}</b></div><div class="tile"><small>العبارات k</small><b>${A.total.k}</b></div></div><div class="verdict ${c}">الثبات الكلي ${tx}</div>` +
      tableHTML(['البعد', 'العبارات', 'ألفا', 'أوميغا', 'AVE', 'الحكم'], A.dims.map(d => d.st ? [esc(d.d.name), N(d.n, 0), N(d.st.alpha, 3), N(d.omega ? d.omega.omega : NaN, 3), N(d.omega ? d.omega.ave : NaN, 3), `<span class="chip ${relVerdict(d.st.alpha)[0]}">${relVerdict(d.st.alpha)[1]}</span>`] : [esc(d.d.name), N(d.n, 0), '—', '—', '—', '<span class="chip warn">عبارات أقل من 2</span>'])) +
      (A.dims.filter(d => d.totals).length >= 2 ? `<h4 style="margin:0">ارتباطات الأبعاد ببعضها وبالدرجة الكلية</h4>${(() => { const D = A.dims.filter(d => d.totals), tot = A.total.total; return tableHTML(['', ...D.map(d => esc(d.d.name)), 'الكلي'], D.map(a => [esc(a.d.name), ...D.map(b2 => N(a === b2 ? 1 : PSY.pearson(a.totals, b2.totals))), N(PSY.pearson(a.totals, tot))])); })()}` : '') +
      (A.guttman ? `<div class="kpis"><div class="tile ${A.guttman.cr >= 0.9 ? 'good' : 'bad'}"><small>معامل إعادة الإنتاج CR</small><b>${fmt(A.guttman.cr, 3)}</b></div><div class="tile"><small>الحد الأدنى الهامشي MMR</small><b>${fmt(A.guttman.mmr, 3)}</b></div><div class="tile"><small>تحسن الإنتاج (CR − MMR)</small><b>${fmt(A.guttman.cr - A.guttman.mmr, 3)}</b></div></div><div class="verdict ${A.guttman.cr >= 0.9 ? 'good' : 'bad'}">${A.guttman.cr >= 0.9 ? 'السلم تراكمي مقبول (CR ≥ 0.90)' : 'السلم لا يحقق شرط التراكم (CR < 0.90)'}</div><p class="small muted">ترتيب العبارات من الأسهل تأييدًا إلى الأصعب: ${A.guttman.order.map(j => s.items.indexOf(A.items[j]) + 1).join(' ← ')}</p>` : '') +
      (A.thurstone ? `<div class="notice small"><b>درجات ثرستون</b>درجة كل مستجيب = وسيط القيم المقياسية للعبارات التي وافق عليها. <b>تنبيه:</b> ألفا وKR‑20 أعلاه محسوبتان من عدد مرات الموافقة، ولا تناسبان طريقة ثرستون؛ لأن عباراتها تمتد من القبول إلى الرفض، فيوافق الفرد على العبارات القريبة من موقفه فقط (نموذج النقطة المثالية)، وقد تخرج ألفا منخفضة أو سالبة. الأنسب هنا ثبات إعادة الاختبار لدرجات ثرستون. ${A.thMissing ? `<span style="color:var(--bad)">لم تُحدَّد القيمة المقياسية لـ ${A.thMissing} عبارة (الخطوة 5).</span>` : ''}</div><div class="kpis"><div class="tile"><small>متوسط درجات ثرستون</small><b>${fmt(PSY.mean(A.thurstone.filter(x => x != null)))}</b></div><div class="tile"><small>الانحراف المعياري</small><b>${fmt(PSY.sd(A.thurstone.filter(x => x != null)))}</b></div></div>` : '') +
      (A.rasch ? `<section class="stack"><h4 style="margin:0">صعوبة تأييد العبارات: تقريب لوجيت (ليس نموذج راش كاملًا)</h4>${barSVG(A.rasch.map(x => x + 3), A.items.map(it => String(s.items.indexOf(it) + 1)), { label: 'صعوبة التأييد', d: 2, color: x => x - 3 > 0 ? 'var(--violet)' : 'var(--primary)' })}<p class="small muted">القيمة الموجبة = عبارة أصعب تأييدًا. هذه القيم تحويل لوجيت لنسبة درجات كل عبارة (مركّز عند الصفر)، وليست تقديرًا لمعالم نموذج راش ولا تتضمن مؤشرات مطابقة؛ للتقدير الدقيق بنموذج راش ومؤشرات المطابقة استخدم برنامج Winsteps أو حزمة TAM في R.</p></section>` : '') +
      `<div class="notice small">ثبات إعادة التطبيق يحتاج تطبيقًا ثانيًا على العينة نفسها بعد نحو أسبوعين؛ احسبه في «معمل ثبات إعادة الاختبار».</div>`;
  };
  STEP[11] = (b, s, intro) => {
    const A = analyze(s);
    if (!A.total || A.n < A.items.length + 2) { b.innerHTML = intro(11, 'يحتاج التحليل العاملي عددًا من الاستجابات أكبر من عدد العبارات (ويُنصح بـ 200 فأكثر).') + `<div class="notice">لديك ${A.n} استجابة صالحة و${A.items.length} عبارة.</div>`; return; }
    const R0 = PSY.corrMatrix(A.rows), km = PSY.kmo(R0), bt = PSY.bartlett(R0, A.n), nf = Math.max(1, Math.min(s.dims.length, A.items.length - 1)), fa = PSY.efa(A.rows, nf), L = fa.rotated;
    const tot = A.total.total, srt = PSY.sorted(tot), m = A.total.totalMean, sd = A.total.totalSd, uniq = [...new Set(srt)];
    const lvl = PSY.levels(isBin(s) ? 0 : 1, isBin(s) ? 1 : pts(s), 3), k = A.items.length;
    const desc = PSY.describe(tot);
    b.innerHTML = intro(11, 'الصدق العاملي (KMO وبارتلت والتشبعات بعد التدوير) ثم المعايير (الرتب المئينية والدرجات التائية) ودليل المقياس.') +
      `<div class="kpis"><div class="tile ${km && km.kmo >= 0.6 ? 'good' : 'bad'}"><small>KMO</small><b>${fmt(km ? km.kmo : NaN, 3)}</b></div><div class="tile ${bt.p < 0.05 ? 'good' : 'bad'}"><small>بارتلت</small><b>${fmtp(bt.p)}</b></div><div class="tile"><small>عوامل الجذر > 1</small><b>${fa.eigen.filter(x => x > 1).length}</b></div><div class="tile"><small>تباين مفسر (${nf} ${nf === 1 ? 'عامل' : 'عوامل'})</small><b>${fmt(PSY.sum(fa.varExp.slice(0, nf)), 1)}%</b></div></div>
      <section class="stack"><h4 style="margin:0">التشبعات بعد التدوير ومطابقتها للأبعاد المفترضة</h4>${tableHTML(['#', 'العبارة', 'البعد المفترض', ...L[0].map((_, f) => 'ع' + (f + 1))], A.items.map((it, i) => { const row = L[i], mx = Math.max(...row.map(Math.abs)); return { cls: mx < 0.4 ? 'flag' : '', cells: [N(s.items.indexOf(it) + 1, 0), esc(it.text), esc((s.dims.find(d => d.id === it.dim) || {}).name || ''), ...row.map(x => ({ n: 1, v: Math.abs(x) === mx && mx >= 0.4 ? `<b>${fmt(x)}</b>` : fmt(x) }))] }; }))}<p class="small muted">تحليل مكونات أساسية مع تدوير فاريماكس لعدد عوامل يساوي عدد الأبعاد. تحقق أن عبارات كل بعد تتشبع على العامل نفسه بقيمة ≥ 0.40، ثم أكّد البنية بالتحليل العاملي التوكيدي على عينة مستقلة.</p></section>
      <section class="stack"><h4 style="margin:0">الإحصاء الوصفي وتوزيع الدرجة الكلية</h4><div class="kpis"><div class="tile"><small>المتوسط</small><b>${fmt(desc.mean)}</b></div><div class="tile"><small>الانحراف</small><b>${fmt(desc.sd)}</b></div><div class="tile"><small>الوسيط</small><b>${fmt(desc.median)}</b></div><div class="tile"><small>الالتواء ÷ خطأه</small><b>${fmt(desc.skew / desc.seSkew)}</b></div><div class="tile"><small>التفلطح ÷ خطأه</small><b>${fmt(desc.kurt / desc.seKurt)}</b></div></div>${histSVG(tot)}</section>
      <section class="stack"><h4 style="margin:0">جدول المعايير</h4>${tableHTML(['الدرجة الخام', 'الرتبة المئينية', 'الدرجة التائية', 'المستوى (بمتوسط العبارة)'], uniq.map(x => { const im = x / k; const li = lvl.ranges.findIndex(r => im <= r[1] + 1e-9); return [N(x, 0), N(PSY.percentileRank(tot, x), 1), N(50 + 10 * (x - m) / sd, 1), ['منخفض', 'متوسط', 'مرتفع'][Math.max(0, li)]]; }))}<div class="row"><button class="btn sm ghost" id="nCsv">${ic('download')} تصدير المعايير CSV</button></div></section>
      <section class="card stack" style="background:var(--surface-2)"><h4 style="margin:0">${ic('book')} دليل المقياس وتقرير النتائج</h4><p class="small muted" style="margin:0">نص جاهز بأقسام دليل المقياس ونتائجك الفعلية، لتنقله إلى رسالتك وتراجعه.</p><div class="row"><button class="btn" id="man">${ic('copy')} نسخ دليل المقياس</button><button class="btn ghost" id="manDl">${ic('download')} تنزيل</button></div></section>`;
    $('#nCsv', b).onclick = () => downloadFile((s.name || 'scale') + '-norms.csv', 'raw,percentile,T\n' + uniq.map(x => [x, fmt(PSY.percentileRank(tot, x), 1), fmt(50 + 10 * (x - m) / sd, 1)].join(',')).join('\n'), 'text/csv;charset=utf-8');
    const text = () => manual(s, A, { km, bt, fa, nf, desc });
    $('#man', b).onclick = () => copyText(text());
    $('#manDl', b).onclick = () => downloadFile((s.name || 'scale') + '-manual.txt', text());
  };

  function manual(s, A, F) {
    const k = A.items.length, crit = PSY.cvrCritical(s.judges);
    const lines = [];
    lines.push(`دليل مقياس: ${s.name}`, '', `1) السمة: ${s.construct}`, `التعريف النظري: ${s.defC}`, `التعريف الإجرائي: ${s.defO}`, '', `2) الفئة المستهدفة: ${s.group}. الغرض: ${s.purpose}.`, '', '3) المراجعة الأدبية:', ...s.refs.map(r => `- ${r.t} (${r.a}): ${r.n}`), '', '4) الأبعاد وجدول المواصفات:');
    s.dims.forEach(d => lines.push(`- ${d.name} (${d.w}%): ${d.def} — ${A.items.filter(i => i.dim === d.id).length} عبارة`));
    lines.push('', `5) صيغة الاستجابة: ${s.scale.labels.join(' / ')}؛ وتُعكس درجات العبارات السالبة (${A.items.filter(i => i.dir < 0).map(i => s.items.indexOf(i) + 1).join('، ') || 'لا يوجد'}).`, '', `6) صدق المحتوى: عُرض المقياس على ${s.judges} محكمين، والقيمة الحرجة لنسبة صدق المحتوى ${fmt(crit.cvr)} (أير وسكالي، 2014)؛ واستُبعدت ${s.items.filter(i => i.keep === false).length} عبارة.`);
    lines.push('', `7) العينة: ${A.n} مستجيبًا.`, '', `8) الثبات: ألفا كرونباخ للمقياس الكلي = ${fmt(A.total.alpha, 3)}` + (A.split ? `، والتجزئة النصفية بمعادلة سبيرمان–براون = ${fmt(A.split.sb, 3)} وبمعادلة جتمان = ${fmt(A.split.guttman, 3)}` : '') + '.');
    A.dims.forEach(d => { if (d.st) lines.push(`- ${d.d.name}: α = ${fmt(d.st.alpha, 3)}` + (d.omega ? `، ω = ${fmt(d.omega.omega, 3)}` : '')); });
    lines.push('', `9) تحليل الفقرات: تراوحت معاملات الارتباط المصححة بين ${fmt(Math.min(...A.total.rit))} و${fmt(Math.max(...A.total.rit))}.`);
    if (F) lines.push('', `10) الصدق العاملي: KMO = ${fmt(F.km ? F.km.kmo : NaN, 3)}، واختبار بارتلت χ²(${F.bt.df}) = ${fmt(F.bt.chi, 2)}، p ${fmtp(F.bt.p).startsWith('<') ? fmtp(F.bt.p) : '= ' + fmtp(F.bt.p)}؛ وفسرت ${F.nf} ${F.nf === 1 ? 'عامل' : 'عوامل'} ${fmt(PSY.sum(F.fa.varExp.slice(0, F.nf)), 1)}% من التباين.`, '', `11) الإحصاء الوصفي للدرجة الكلية: المتوسط ${fmt(F.desc.mean)}، والانحراف المعياري ${fmt(F.desc.sd)}، والمدى ${F.desc.min}–${F.desc.max}.`);
    lines.push('', '12) التعليمات:', s.instr, '', '13) حدود الاستخدام: تُفسَّر الدرجات في ضوء خصائص عينة التقنين، ولا يُتخذ قرار فردي من درجة المقياس وحدها.');
    return lines.join('\n');
  }
  function toCSV(s) {
    const items = kept(s), head = ['id', 'time', 'source', 'gender', 'age', ...items.map((_, j) => 'item' + (j + 1)), 'total_scored', ...s.dims.map((_, i) => 'dim' + (i + 1))];
    const q = x => /[",\n]/.test(String(x)) ? '"' + String(x).replace(/"/g, '""') + '"' : x;
    const rows = s.responses.filter(x => !x.pilot).map(x => { const raw = items.map(it => x.vals[it.id] ?? ''); const sc = items.map(it => scoreOf(s, it, x.vals[it.id])); const ok = sc.every(v => v != null); return [x.id, new Date(x.ts).toISOString(), x.src || '', x.g || '', x.a || '', ...raw, ok ? PSY.sum(sc) : '', ...s.dims.map(d => ok ? PSY.sum(items.map((it, j) => it.dim === d.id ? sc[j] : 0)) : '')].map(q).join(','); });
    return head.join(',') + '\n' + rows.join('\n');
  }

  /* ---- collection panels ---- */
  function kiosk(s, pilot) {
    const def = formDef(s); if (!def.q.length) return toast('أضف عبارات أولًا');
    SCALES.save(s);
    let count = 0;
    const show = () => {
      LEARN.openOv(`<div class="qtop"><span class="chip ${pilot ? 'warn' : 'good'}">${pilot ? 'تطبيق تجريبي' : 'جمع مباشر'} · ${count} في هذه الجلسة</span><span class="grow"></span><button class="btn sm ghost" id="kEnd">إنهاء الجلسة</button></div><div id="kf" style="margin-top:12px"></div>`);
      $('#kf').innerHTML = formHTML(def); bindForm($('#kf'), def, (vals, demo) => { addResponse(s, def.v, vals, { src: pilot ? 'pilot' : 'kiosk', pilot: !!pilot, g: demo.g, a: demo.a }); count++; SCALES.save(s); checkBadges();
        $('#kf').innerHTML = `<div class="result"><div class="ring" style="width:84px;height:84px;display:grid;place-items:center;border-radius:50%;background:var(--good-soft);color:var(--good)">${ic('check')}</div><h2>شكرًا لك</h2><p class="muted">سُجلت إجاباتك. سلّم الجهاز للمستجيب التالي.</p><button class="btn" id="kNext">المستجيب التالي</button></div>`; $('#kNext').onclick = show; scrollTo(0, 0); $('#ov').scrollTop = 0; });
      $('#kEnd').onclick = () => confirmBox('إنهاء جلسة الجمع والعودة إلى المقياس؟', 'إنهاء', () => { LEARN.closeOv(); });
    };
    show();
  }
  function codesPanel(s, el) {
    const code = scaleCode(s); SCALES.save(s);
    const wa = 'https://wa.me/?text=' + encodeURIComponent(`أرجو الإجابة عن مقياس «${s.name}»:\n1) افتح موقع مختبر المقاييس النفسية واختر «أجب عن مقياس».\n2) الصق هذا الكود:\n${code}\n3) بعد الإجابة أرسل لي كود الاستجابة.`);
    el.innerHTML = `<section class="card stack"><h3>${ic('whats')} كود المقياس</h3><p class="small muted" style="margin:0">أرسل هذا الكود للمستجيبين. يفتحون صفحة «أجب عن مقياس» في الموقع، ويلصقونه، ويجيبون، ثم يرسلون لك «كود الاستجابة».</p><div class="codebox" id="scCode">${esc(code)}</div><div class="row"><button class="btn sm" id="cpSc">${ic('copy')} نسخ الكود</button><a class="btn sm ghost" href="${esc(wa)}" target="_blank" rel="noopener noreferrer">${ic('whats')} مشاركة عبر واتساب</a></div>
      <div class="field"><label class="fl" for="rc">الصق أكواد الاستجابة (كود في كل سطر، أو كلها معًا)</label><textarea id="rc" class="data" placeholder="RS1.…"></textarea></div><button class="btn" id="rcAdd" style="justify-self:start">${ic('plus')} إضافة الاستجابات</button><div id="rcMsg"></div></section>`;
    $('#cpSc', el).onclick = () => copyText(code);
    $('#rcAdd', el).onclick = () => {
      const codes = ($('#rc', el).value.match(/RS1\.[A-Za-z0-9_-]+/g) || []); let ok = 0, dup = 0, bad = 0, other = 0;
      const seen = new Set(s.responses.map(r => r.code).filter(Boolean));
      codes.forEach(c => { const p = parseResponseCode(c); if (!p || p.error) { bad++; return; } if (p.i !== s.id) { other++; return; } if (seen.has(c)) { dup++; return; } const vals = p.r.split('').map(Number); const st = addResponse(s, p.v, vals, { src: 'code', g: p.g, a: p.a, code: c }); if (st === 'ok') { ok++; seen.add(c); } else bad++; });
      SCALES.save(s); checkBadges();
      $('#rcMsg', el).innerHTML = `<div class="notice ${ok ? 'good' : 'warn'} small">أُضيفت ${ok} استجابة${dup ? `، وتُجوهلت ${dup} مكررة` : ''}${other ? `، و${other} لمقياس آخر` : ''}${bad ? `، و${bad} كود تالف أو لنسخة قديمة من العبارات` : ''}.</div>`;
      if (ok) setTimeout(rerender, 900);
    };
  }
  function gformsPanel(s, el) {
    const items = kept(s);
    const txt = `${s.name}\n\n${s.instr}\n\n` + items.map((it, i) => `${i + 1}. ${it.text}`).join('\n') + `\n\nالبدائل (لكل عبارة، سؤال «اختيار من متعدد» أو «شبكة اختيار متعدد»):\n` + s.scale.labels.join('\n');
    el.innerHTML = `<section class="card stack"><h3>${ic('form')} Google Forms</h3><ol class="small" style="margin:0"><li>أنشئ نموذجًا جديدًا في Google Forms، واستخدم سؤالًا من نوع «شبكة اختيار متعدد»: الصفوف = العبارات بالترتيب، والأعمدة = البدائل.</li><li>انسخ النص أدناه والصق العبارات والبدائل.</li><li>بعد جمع الإجابات: من تبويب «الردود» افتح جدول البيانات، ثم «ملف ← تنزيل ← CSV».</li><li>ارفع ملف CSV هنا وحدد العمود الذي تبدأ منه العبارة الأولى.</li></ol>
      <div class="row"><button class="btn sm" id="cpG">${ic('copy')} نسخ العبارات والبدائل</button></div>
      <hr style="border:none;border-top:1px solid var(--line);width:100%"><h3>${ic('upload')} استيراد CSV (Google Forms أو Excel)</h3><input type="file" id="csvIn" accept=".csv,text/csv" aria-label="ملف CSV"><div id="csvMap"></div></section>`;
    $('#cpG', el).onclick = () => copyText(txt);
    $('#csvIn', el).onchange = e => { const f = e.target.files[0]; if (!f) return; const rd = new FileReader(); rd.onload = () => csvMapper(s, parseCSV(rd.result), $('#csvMap', el)); rd.readAsText(f, 'utf-8'); };
  }
  function parseCSV(t) { const rows = []; let row = [], cur = '', q = false; t = t.replace(/^﻿/, ''); for (let i = 0; i < t.length; i++) { const ch = t[i]; if (q) { if (ch === '"') { if (t[i + 1] === '"') { cur += '"'; i++; } else q = false; } else cur += ch; } else if (ch === '"') q = true; else if (ch === ',' || ch === ';' || ch === '\t') { row.push(cur); cur = ''; } else if (ch === '\n' || ch === '\r') { if (ch === '\r' && t[i + 1] === '\n') i++; row.push(cur); rows.push(row); row = []; cur = ''; } else cur += ch; } if (cur || row.length) { row.push(cur); rows.push(row); } return rows.filter(r => r.some(c => c.trim() !== '')); }
  function csvMapper(s, rows, el) {
    if (rows.length < 2) { el.innerHTML = '<div class="notice warn">الملف فارغ أو بلا صفوف بيانات.</div>'; return; }
    const head = rows[0], items = kept(s), L = s.scale.labels, kpt = L.length;
    const guess = Math.max(0, head.findIndex(h => items[0] && h.includes(items[0].text.slice(0, 12))));
    el.innerHTML = `<div class="grid3"><div class="field"><label class="fl" for="mStart">عمود العبارة الأولى</label><select id="mStart">${head.map((h, i) => `<option value="${i}" ${i === guess ? 'selected' : ''}>${i + 1}: ${esc(h.slice(0, 40))}</option>`).join('')}</select></div><div class="field"><label class="fl" for="mG">عمود النوع (اختياري)</label><select id="mG"><option value="-1">لا يوجد</option>${head.map((h, i) => `<option value="${i}">${i + 1}: ${esc(h.slice(0, 40))}</option>`).join('')}</select></div><div class="field"><label class="fl" for="mA">عمود العمر (اختياري)</label><select id="mA"><option value="-1">لا يوجد</option>${head.map((h, i) => `<option value="${i}">${i + 1}: ${esc(h.slice(0, 40))}</option>`).join('')}</select></div></div><div id="mPrev"></div><button class="btn" id="mGo">${ic('upload')} استيراد</button>`;
    const conv = cell => { const c = String(cell).trim(); if (c === '') return null; const n = toNum(c); if (isFinite(n)) return n; const j = L.findIndex(l => l.trim() === c); if (j < 0) return null; return kpt === 2 ? (j === 0 ? 1 : 0) : kpt - j; };
    const build = () => { const st = +$('#mStart', el).value, g = +$('#mG', el).value, a = +$('#mA', el).value; const out = []; rows.slice(1).forEach(r => { const vals = items.map((_, j) => conv(r[st + j])); if (vals.every(v => v != null && (kpt === 2 ? v === 0 || v === 1 : v >= 1 && v <= kpt))) out.push({ vals, g: g >= 0 ? String(r[g] || '').slice(0, 10) : '', a: a >= 0 ? String(r[a] || '').slice(0, 3) : '' }); }); return out; };
    const prev = () => { const o = build(); $('#mPrev', el).innerHTML = `<p class="small ${o.length ? '' : 'muted'}">صفوف صالحة: <b class="num">${o.length}</b> من ${rows.length - 1}. ${o.length < rows.length - 1 ? 'الصفوف الناقصة أو التي فيها قيم خارج التدريج تُتجاهل.' : ''}</p>`; };
    $$('select', el).forEach(x => x.onchange = prev); prev();
    $('#mGo', el).onclick = () => { const o = build(); if (!o.length) return toast('لا صفوف صالحة؛ تحقق من عمود البداية'); const v = version(s); o.forEach(x => addResponse(s, v, x.vals, { src: 'csv', g: x.g, a: x.a })); SCALES.save(s); checkBadges(); toast('استُوردت ' + o.length + ' استجابة'); rerender(); };
  }
  function livePanel(s, el) {
    if (!(window.ACCT && ACCT.forms && ACCT.forms.available())) {
      el.innerHTML = `<section class="card stack"><h3>${ic('link')} النموذج الأونلاين المباشر</h3>${ENV.claude ? '<p>داخل المنصة المستضيفة لا يستطيع زوار الرابط العام حفظ إجاباتهم على الخادم؛ لذلك استخدم «كود المقياس + أكواد الاستجابة» أو «الجمع المباشر على هذا الجهاز». النموذج الأونلاين المباشر متاح في نسخة الموقع المنشورة على GitHub بعد تفعيل الحسابات.</p>' : (window.ACCT && ACCT.available() ? '<p>سجّل الدخول من صفحة «حسابي» لتنشر نموذجًا أونلاين تصل إجاباته إلى حسابك لحظيًا.</p><button class="btn" id="goAcct">تسجيل الدخول</button>' : '<p>هذه الميزة تحتاج ربط الموقع بمشروع Firebase مجاني (مرة واحدة). الخطوات في ملف <b>SETUP-FIREBASE.md</b> في المستودع. حتى ذلك الحين استخدم الكود أو الجمع المباشر.</p>')}</section>`;
      const g = $('#goAcct', el); if (g) g.onclick = () => go('account'); return;
    }
    ACCT.forms.panel(s, el, { formDef, addResponse, save: () => SCALES.save(s) });
  }

  /* ---- respond view (respondent side) ---- */
  VIEWS.respond = (el, formId) => {
    if (formId && window.ACCT && ACCT.forms && ACCT.forms.available()) return ACCT.forms.respond(el, formId, { formHTML, bindForm });
    el.innerHTML = `<div class="section-title"><h2>أجب عن مقياس</h2></div><div class="card stack"><p style="margin:0">الصق «كود المقياس» الذي أرسله لك الباحث، ثم أجب عن العبارات. ستحصل في النهاية على «كود استجابة» ترسله للباحث.</p><div class="field"><label class="fl" for="scIn">كود المقياس</label><textarea id="scIn" class="data" placeholder="SC1.…" style="min-height:90px"></textarea></div><button class="btn" id="scGo" style="justify-self:start">${ic('play')} افتح المقياس</button><div id="scErr"></div></div><div id="scForm"></div>`;
    $('#scGo', el).onclick = () => {
      let def; try { const m = $('#scIn', el).value.match(/SC1\.[A-Za-z0-9_-]+/); if (!m) throw new Error('لم أجد كود مقياس في النص الملصق.'); def = parseScaleCode(m[0]); } catch (e) { $('#scErr', el).innerHTML = `<div class="notice warn small">${esc(e.message || 'كود غير صالح')}</div>`; return; }
      $('#scErr', el).innerHTML = ''; const f = $('#scForm', el); f.innerHTML = formHTML(def);
      bindForm(f, def, (vals, demo) => {
        const code = responseCode(def, vals, demo);
        const wa = 'https://wa.me/?text=' + encodeURIComponent(code);
        f.innerHTML = `<div class="card stack"><h3>${ic('check')} شكرًا لك، اكتملت إجاباتك</h3><p style="margin:0">انسخ كود الاستجابة التالي وأرسله للباحث. إجاباتك لا تُحفظ إلا في هذا الكود.</p><div class="codebox">${esc(code)}</div><div class="row"><button class="btn" id="cpR">${ic('copy')} نسخ كود الاستجابة</button><a class="btn ghost" href="${esc(wa)}" target="_blank" rel="noopener noreferrer">${ic('whats')} إرسال عبر واتساب</a></div></div>`;
        $('#cpR', f).onclick = () => copyText(code); f.scrollIntoView({ block: 'start' });
      });
      f.scrollIntoView({ block: 'start' });
    };
  };

  /* import a scale (and optional responses) from the quick builder; rows use the builder raw convention */
  function importScale(o) {
    const s = blank(); s.name = o.name || 'مقياس مستورد'; s.construct = o.construct || ''; s.group = o.group || '';
    s.method = METHODS[o.method] ? o.method : 'likert'; s.scale = { preset: 'custom', labels: o.labels.slice(0, 7) }; if (o.instr) s.instr = o.instr;
    s.demo = { gender: false, age: false };
    const names = [...new Set(o.items.map(x => x.dim || 'عام'))]; s.dims = names.map(n => ({ id: uid('d'), name: n, def: '', w: Math.round(100 / names.length) }));
    s.items = o.items.map(x => ({ id: uid('i'), text: x.text, dim: s.dims[names.indexOf(x.dim || 'عام')].id, dir: x.dir || 1, key: x.key || 0, sv: x.sv ?? null, src: 'البناء السريع', ess: null, use: null, keep: true }));
    s.target = s.items.length; s.mult = 1;
    const v = version(s); let added = 0;
    (o.rows || []).forEach(r => { if (addResponse(s, v, r.vals, Object.assign({ src: o.src || 'مستورد' }, r.extra || {})) === 'ok') added++; });
    s.step = o.rows && o.rows.length ? 9 : 4; SCALES.save(s); checkBadges(); openId = s.id; go('build');
    return added;
  }
  const bestSteps = () => SCALES.list().reduce((m, s) => Math.max(m, status(s).filter(Boolean).length), 0);
  return { analyze, kept, formDef, importScale, bestSteps, open: id => { openId = id; go('build'); }, clear: () => { openId = null; } };
})();

/* ===== Quick scale builder — ported from the statistics lab (#lab/build): methods, templates, simulation,
   direct link, Google Forms script, Google Sheets collection. Collected responses open in the 12-step builder. ===== */
const QUICK = (() => {
  let view = null;
  const labHead = t => `<div class="section-title"><h2>${t}</h2><button class="btn sm ghost" id="qFull">${ic('build')} المعالج الكامل (12 خطوة)</button></div><div class="notice small"><b>مثل «بناء المقياس» في مختبر الإحصاء</b>اختر طريقة البناء، وولّد العبارات، وأرسل المقياس بلينك مباشر أو نموذج Google Forms، واجمع الردود في Google Sheet؛ ثم تفتح الردود في «ابنِ مقياسك» لتحليل الفقرات والثبات والصدق العاملي والمعايير.</div>`;
  const f2 = (x, d = 2) => fmt(x, d);
  const alphaOf = cols => { const rows = cols[0].map((_, i) => cols.map(c => c[i])); return PSY.itemStats(rows).alpha; };
  const SCI = { thurstone: ['لويس ثرستون (مع شيف)', 'الاتجاه نحو الكنيسة (1929)'], likert: ['رنسيس ليكرت', 'مقياس روزنبرج لتقدير الذات (1965)'], guttman: ['لويس جتمان', 'مقياس بوجاردس للبعد الاجتماعي (1925)'], osgood: ['تشارلز أوسجود', 'تمايز مفهوم «التعلم» (مجيد، 2014)'], rasch: ['جورج راش · ديفيد أندريش', 'استبيان «حب العلوم» (رايت وماسترز، 1982)'], cat: ['فريدريك لورد · ديفيد فايس', 'بنوك فقرات PROMIS'], sjt: ['موتوويدلو ودونيت وكارتر (1990)', 'اختبار الحكم الموقفي في UCAT للطب'], forced: ['آلن إدواردز · آنا براون', 'دراسة القيم؛ وجدول إدواردز (1959)'], aig: ['هومل وزملاؤه · جوتس وزملاؤه', 'مولدات الفقرات بالمحولات (2022–2024)'] };
  const relLbl = a => a >= 0.9 ? ['ممتاز', 'ok'] : a >= 0.8 ? ['جيد', 'ok'] : a >= 0.7 ? ['مقبول', 'mid'] : ['ضعيف', 'no'];
const AI={p:null};
function aiGet(){if(!AI.p)AI.p=(async()=>{try{if(window.claude&&typeof window.claude.use==="function")return await window.claude.use("sample")}catch(e){}return null})();return AI.p}
const AI_ERR={not_granted:"لم يتم السماح للموقع باستخدام المساعد الذكي من حسابك.",sampling_disabled:"المساعد الذكي غير متاح لهذا الحساب.",rate_limited:"وصلت للحد المسموح الآن، حاول بعد قليل.",session_expired:"سجّل الدخول في المساعد الذكي مرة أخرى.",refused:"رفض المساعد الذكي هذا الطلب؛ عدّل النص وحاول.",invalid_json:"الرد لم يكن بالشكل المتوقع؛ جرّب مرة أخرى."};
function aiExternal(prompt,el){
 el.innerHTML=`<p class="muted" style="margin:6px 0">استخدم حسابك في أي مساعد ذكاء اصطناعي (ChatGPT أو Gemini أو غيره): اضغط «انسخ الطلب» ثم افتح الموقع والصق (Ctrl+V).</p><div class="row"><button class="btn sm gold" data-cp>انسخ الطلب</button><a class="btn sm ghost" style="text-decoration:none" href="https://chatgpt.com/" target="_blank" rel="noopener">افتح مساعد الذكاء الاصطناعي</a><a class="btn sm ghost" style="text-decoration:none" href="https://chatgpt.com/" target="_blank" rel="noopener">افتح ChatGPT</a></div>`;
 el.querySelector("[data-cp]").onclick=()=>{const done=()=>toast("تم نسخ الطلب — الصقه في مساعد الذكاء الاصطناعي");(navigator.clipboard?navigator.clipboard.writeText(prompt).then(done,()=>fallbackCopy(prompt,done)):fallbackCopy(prompt,done))};
}
function fallbackCopy(t,cb){const ta=document.createElement("textarea");ta.value=t;document.body.appendChild(ta);ta.select();try{document.execCommand("copy");cb()}catch(e){toast("تعذر النسخ")}ta.remove()}
const METHODS=[
 {id:"thurstone",t:"طريقة ثرستون — الفترات المتساوية ظاهريًا",en:"Thurstone Equal-Appearing Intervals",yr:1928,era:"كلاسيكية",d:"يكتب الباحث عبارات كثيرة تتدرج من الرفض الشديد للقبول الشديد، ويحكم عليها محكمون على متصل من 1 إلى 11، وتُختار العبارات ذات الاتفاق العالي بقيم موزعة. المفحوص يختار «أوافق» على ما ينطبق، ودرجته = وسيط قيم العبارات التي وافق عليها.",resp:["أوافق","لا أوافق"],bin:true,n:k=>[100,"50–100 محكم لتقدير قيم العبارات + 100 مفحوص على الأقل"]},
 {id:"likert",t:"طريقة ليكرت — التقديرات التجميعية",en:"Likert Summated Rating",yr:1932,era:"كلاسيكية (الأكثر استخدامًا)",d:"عبارات موجبة وسالبة يستجيب لها المفحوص على تدريج خماسي، وتجمع الدرجات (مع عكس العبارات السالبة) في درجة كلية. سهلة البناء والتصحيح، وتحلل بألفا كرونباخ والتحليل العاملي.",resp:["موافق بشدة","موافق","محايد","غير موافق","غير موافق بشدة"],n:k=>[Math.max(200,10*k),"5–10 أفراد لكل بند وبحد أدنى 200 للتحليل العاملي، و30–50 للتجربة الاستطلاعية"]},
 {id:"guttman",t:"طريقة جتمان — التدرج التراكمي",en:"Guttman Cumulative Scaling",yr:1944,era:"كلاسيكية",d:"عبارات مرتبة تصاعديًا في الشدة؛ من يوافق على عبارة قوية يوافق بالضرورة على ما قبلها. يُتحقق منها بمعامل إعادة الإنتاج (≥ 0.90).",resp:["نعم","لا"],bin:true,n:k=>[100,"100 فرد على الأقل لحساب معامل إعادة الإنتاج"]},
 {id:"osgood",t:"التمايز الدلالي — أوسجود",en:"Osgood Semantic Differential",yr:1957,era:"كلاسيكية",d:"يُقيَّم مفهوم واحد على أزواج من الصفات المتضادة (جيد–سيئ، قوي–ضعيف…) بتدريج سباعي، وتمثل ثلاثة أبعاد: التقييم، القوة، النشاط.",resp:["1","2","3","4","5","6","7"],n:k=>[100,"100 فرد على الأقل، ويزيد للتحليل العاملي"]},
 {id:"rasch",t:"نموذج راش / نظرية الاستجابة للمفردة",en:"Rasch Model / Item Response Theory",yr:1960,era:"حديثة",d:"تُبنى البنود بحيث تغطي مستويات مختلفة من شدة السمة (سهلة وصعبة التأييد)، ويقدَّر موقع الفرد والبند على متصل واحد بالـ logit مستقلًا عن العينة. يتيح الأداء التفاضلي للمفردة DIF وفحص المطابقة.",resp:["لا تنطبق أبدًا","تنطبق نادرًا","تنطبق أحيانًا","تنطبق دائمًا"],n:k=>[250,"150–250 فردًا لتقديرات مستقرة (Linacre)، و500 لنماذج IRT متعددة المعالم"]},
 {id:"sjt",t:"اختبارات الحكم الموقفي",en:"Situational Judgment Tests (SJT)",yr:1990,era:"حديثة",d:"يُعرض موقف واقعي وعدة تصرفات، ويختار المفحوص الأفضل (والأسوأ). تقيس المهارات والكفايات السلوكية وتقل فيها المرغوبية الاجتماعية، وتحتاج مفتاحًا من الخبراء.",resp:[],n:k=>[200,"200 فرد على الأقل + 5–10 خبراء لبناء مفتاح التصحيح"]},
 {id:"forced",t:"الاختيار القسري",en:"Forced-Choice / Thurstonian IRT",yr:2011,era:"حديثة",d:"عبارتان (أو أكثر) متساويتان في المرغوبية من أبعاد مختلفة، ويختار المفحوص الأكثر انطباقًا. تقلل التزييف والمرغوبية الاجتماعية، وتُحلل حديثًا بنموذج Thurstonian IRT (Brown & Maydeu-Olivares, 2011).",resp:[],n:k=>[300,"300 فرد على الأقل لنموذج Thurstonian IRT"]},
 {id:"cat",t:"الاختبار التكيفي المحوسب",en:"Computerized Adaptive Testing (CAT)",yr:1980,era:"حديثة",d:"بنك بنود معايَر بنظرية الاستجابة للمفردة؛ يختار الحاسوب البند التالي حسب إجابات الفرد، فيقيس بدقة بعدد بنود أقل. يتوقف عند وصول الخطأ المعياري لحد معين (مثلًا 0.30).",resp:["لا تنطبق أبدًا","تنطبق نادرًا","تنطبق أحيانًا","تنطبق دائمًا"],n:k=>[500,"500 فرد على الأقل لمعايرة بنك البنود"]},
 {id:"aig",t:"توليد البنود بالذكاء الاصطناعي",en:"AI-assisted Automatic Item Generation",yr:2020,era:"الأحدث",d:"تُستخدم النماذج اللغوية لتوليد بنود كثيرة من تعريف السمة، ثم يراجعها الخبراء ويحكمونها، وتُفحص إحصائيًا (التحليل العاملي، راش). يوفر الوقت لكنه لا يغني عن التحكيم والتجريب.",resp:["موافق بشدة","موافق","محايد","غير موافق","غير موافق بشدة"],n:k=>[Math.max(200,10*k),"مثل ليكرت: 10 أفراد لكل بند وبحد أدنى 200، بعد التحكيم"]}
];
const B={m:null,res:null,aud:null};
const respOf=m=>B.aud&&typeof AUD!=="undefined"&&m.resp&&m.resp.length?AUD.labels(m.resp,B.aud.p,B.aud.r):m.resp;
const q=c=>`«${c}»`;
function tplItems(m,c,dims,k){
 const pos=[`أشعر بـ${q(c)} في كثير من المواقف اليومية.`,`يلاحظ المحيطون بي ${q(c)} في تصرفاتي.`,`أفكر في الأمور المرتبطة بـ${q(c)} أكثر من غيري.`,`يظهر ${q(c)} لدي بوضوح عند التعامل مع الآخرين.`,`يصعب عليّ التحكم في ${q(c)} عندما أكون تحت ضغط.`,`يؤثر ${q(c)} في أدائي الدراسي أو المهني.`,`أشعر بـ${q(c)} عند مواجهة مواقف جديدة.`,`أتصرف بطريقة تعكس ${q(c)} حتى في المواقف البسيطة.`,`تتكرر لدي مواقف يظهر فيها ${q(c)}.`,`أجد نفسي مدفوعًا بـ${q(c)} في قراراتي.`,`يستمر ${q(c)} معي لفترات طويلة.`,`أتذكر مواقف كثيرة شعرت فيها بـ${q(c)}.`];
 const neg=[`نادرًا ما أشعر بـ${q(c)}.`,`لا يؤثر ${q(c)} في علاقاتي بالآخرين.`,`أستطيع أن أمضي يومي دون أن أفكر في ${q(c)}.`,`لا يلاحظ أحد ${q(c)} في سلوكي.`];
 const D=dims.length?dims:["عام"];const out=[];
 if(m==="osgood"){const P=[["جيد","سيئ","التقييم"],["مفيد","ضار","التقييم"],["ممتع","ممل","التقييم"],["مهم","تافه","التقييم"],["مريح","مزعج","التقييم"],["إيجابي","سلبي","التقييم"],["قوي","ضعيف","القوة"],["كبير","صغير","القوة"],["صعب","سهل","القوة"],["عميق","سطحي","القوة"],["نشط","خامل","النشاط"],["سريع","بطيء","النشاط"],["متغير","ثابت","النشاط"],["حاد","هادئ","النشاط"]];for(let i=0;i<k;i++){const p=P[i%P.length];out.push({text:`${p[0]} ـــ ـــ ـــ ـــ ـــ ـــ ـــ ${p[1]}`,dim:p[2],reverse:i%3===2})}return out}
 if(m==="guttman"){const L=["أحيانًا","مرة في الأسبوع على الأقل","عدة مرات في الأسبوع","يوميًا تقريبًا","لدرجة أنه يؤثر على بعض مهامي","لدرجة أنه يمنعني من بعض الأنشطة","لدرجة أنه يمنعني من معظم الأنشطة","لدرجة أنني أحتاج مساعدة متخصصة"];for(let i=0;i<k;i++)out.push({text:`أشعر بـ${q(c)} ${L[Math.min(i,L.length-1)]}${i>=L.length?` (مستوى ${i+1})`:""}.`,dim:"تراكمي",value:i+1});return out}
 if(m==="thurstone"){const V=[[11,`${q(c)} أمر ضروري ولا يمكن الاستغناء عنه.`],[10,`${q(c)} من أهم ما يميز الإنسان الناجح.`],[9,`أرى أن ${q(c)} له فوائد كثيرة.`],[8,`${q(c)} مفيد في أغلب المواقف.`],[7,`${q(c)} مقبول بشكل عام.`],[6,`لا أمانع وجود ${q(c)} في حياتي.`],[5,`ليس لدي رأي واضح حول ${q(c)}.`],[4,`أتحفظ أحيانًا على ${q(c)}.`],[3,`${q(c)} يسبب مشكلات أكثر مما يفيد.`],[2,`أرفض ${q(c)} في معظم المواقف.`],[1,`${q(c)} أمر ضار تمامًا ولا فائدة منه.`]];for(let i=0;i<k;i++){const j=Math.round(i*(V.length-1)/Math.max(1,k-1));out.push({text:V[j][1],dim:"الاتجاه",value:V[j][0]})}return out}
 if(m==="sjt"){const C=["في قاعة المحاضرات","أثناء العمل في مجموعة","مع أحد أفراد الأسرة","في مقابلة مهمة","مع صديق مقرب","أثناء امتحان","في موقف عام أمام الناس","عند تلقي نقد من شخص آخر"];for(let i=0;i<k;i++)out.push({text:`${C[i%C.length]}، واجهت موقفًا يتطلب ${q(c)}. ماذا تفعل؟`,dim:D[i%D.length],options:["أتعامل مع الموقف مباشرة وبهدوء","أطلب المساعدة أو المشورة من شخص أثق به","أؤجل التعامل مع الموقف لوقت لاحق","أنسحب من الموقف تمامًا"],key:"الأفضل: أ — الأسوأ: د (يُراجع المفتاح مع الخبراء)"});return out}
 if(m==="forced"){for(let i=0;i<k;i++){const a=pos[i%pos.length],b=pos[(i+5)%pos.length];out.push({text:"أي العبارتين تنطبق عليك أكثر؟",dim:`${D[i%D.length]} / ${D[(i+1)%D.length]}`,options:[a,b]})}return out}
 const lv=["سهل التأييد","متوسط","صعب التأييد"];
 for(let i=0;i<k;i++){const rev=(m==="likert"||m==="aig")&&(i%4===3);const t=rev?neg[Math.floor(i/4)%neg.length]:pos[(i-Math.floor(i/4))%pos.length];const it={text:t,dim:D[i%D.length],reverse:rev};if(m==="rasch"||m==="cat"){it.level=lv[i%3];it.value=+(-1.5+3*(i%3)/2+((i*37)%10-5)/20).toFixed(2)}out.push(it)}
 return out;
}
function simulate(items,n,binary,steps){
 const k=items.length,lam=items.map((_,i)=>.55+((i*13)%7)/20),thr=items.map(it=>it.value!=null&&Math.abs(it.value)<4?it.value/2:0);
 const gauss=()=>{let u=0,v=0;while(!u)u=Math.random();while(!v)v=Math.random();return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v)};
 const rows=[];for(let p=0;p<n;p++){const th=gauss();rows.push(items.map((it,j)=>{const z=lam[j]*th+Math.sqrt(1-lam[j]**2)*gauss()-thr[j];if(binary)return z>0?1:0;const cut=[-1.3,-.45,.35,1.15,1.9].slice(0,steps-1);return 1+cut.filter(c=>z>c).length}))}
 return rows;
}
function labBuild(){
 const step=()=>{if(!B.m){view.innerHTML=labHead("البناء السريع للمقياس")+`<div class="panel"><h3>1) اختر طريقة البناء</h3><p class="muted" style="margin-top:0">مرتبة من الأقدم إلى الأحدث.</p><div class="meth">${METHODS.map(m=>`<button class="opt" data-m="${m.id}"><b>${m.t}</b><span class="yr">${m.yr}</span> <span class="chip ${m.era.startsWith("كلاس")?"":"gold"}">${m.era}</span><span class="en" style="display:block;text-align:start">${m.en}</span><small>${m.d}</small><span class="sci">${ic("user")} ${SCI[m.id][0]} · <b>نموذج حقيقي:</b> ${SCI[m.id][1]}</span></button>`).join("")}</div><div class="row"><button class="btn sm soft" id="qReal">${ic("book")} شاهد النماذج الحقيقية لكل طريقة ولكل عالم</button></div></div><div class="panel" id="collect0"></div>`;renderCollect($("#collect0"));$("#qReal").onclick=()=>LEARN.open("real");$$("[data-m]").forEach(b=>b.onclick=()=>{B.m=METHODS.find(x=>x.id===b.dataset.m);B.res=null;step();window.scrollTo(0,0)});return}
  const m=B.m;
  view.innerHTML=labHead("البناء السريع للمقياس")+`<div class="panel"><div class="row" style="justify-content:space-between"><span class="chip">${m.t} · ${m.yr}</span><button class="btn sm ghost" id="chg">تغيير الطريقة</button></div><p class="muted">${m.d}</p>
  <h3>2) بيانات المقياس</h3><div class="g2"><div><label class="fl" for="bLib">المفهوم المراد قياسه</label><select id="bLib">${typeof CLIB!=="undefined"?CLIB.list.map(c=>`<option value="${c.id}" ${(B.lib||"social_anx")===c.id?"selected":""}>${esc(c.n)}${c.dev?" (مقياس أصيل قيد التطوير)":""}${c.type==="attitude"?" (اتجاه)":""}</option>`).join(""):""}<option value="" ${B.lib===""?"selected":""}>مفهوم آخر (أكتبه بنفسي)</option></select><input type="text" id="bC" value="${esc(B.c||"")}" placeholder="اكتب اسم المفهوم" ${B.lib===""?"":"hidden"} style="margin-top:6px"></div><div><label class="fl" for="bP">الفئة المستهدفة</label><input type="text" id="bP" value="${esc(B.p||"طلاب الجامعة")}"></div></div>
  <div class="g2"><div><label class="fl" for="bK">عدد البنود (الأسئلة)</label><input type="number" id="bK" min="3" max="60" value="${B.k||12}"></div><div><label class="fl" for="bN">حجم العينة المخطط</label><input type="number" id="bN" min="10" max="2000" value="${B.n||200}"></div></div>
  <label class="fl" for="bPath">مسار القياس</label><select id="bPath"><option value="direct" ${B.path==="direct"?"selected":""}>مباشر: عبارات سلوكية صريحة لا تذكر اسم المفهوم</option><option value="indirect" ${B.path==="indirect"?"selected":""}>غير مباشر: مواقف غامضة، ومواقف سلوكية، وتقدير عن الآخرين، واختيار قسري</option><option value="both" ${!B.path||B.path==="both"?"selected":""}>الاثنان معًا (موصى به): 3 درجات ومؤشر الفجوة</option></select><div id="bLibInfo"></div><label class="fl" for="bD">الأبعاد (افصل بينها بفاصلة — اختياري)</label><input type="text" id="bD" value="${esc(B.d!=null?B.d:"المعرفي، الوجداني، السلوكي")}">${typeof AUD!=="undefined"?`<details class="aud-q" ${B.aud?"open":""}><summary><b>الفئة العمرية ولغة الصياغة</b> <span class="muted">(${B.aud?esc(AUD.prof(B.aud.p).t)+" · "+esc((AUD.REGISTERS.find(x=>x.id===B.aud.r)||{}).t||""):"اختياري: الافتراضي فصحى للشباب"})</span></summary>${AUD.selectorsHTML(B.aud||{p:"youth",r:"fusha"},"qa")}<div id="qaTips"></div><p class="muted" style="font-size:13.5px;margin:4px 0 0">تتغير ألفاظ العبارات والبدائل فقط؛ المعنى واتجاه العبارة وعدد البدائل ثابتة حتى لا يختل القياس. وللمقارنة بين نسخ لفئات مختلفة ابنِ نسخًا من المقياس نفسه في المعالج الكامل (خطوة جودة الصياغة) ليفحص تكافؤها تلقائيًا.</p></details>`:""}<div id="bRec"></div>
  <div class="row" style="margin-top:12px"><button class="btn" id="bTpl">ابنِ المقياس من مخطط المفهوم</button><button class="btn gold" id="bAI" hidden>ابنِ الأسئلة بالذكاء الاصطناعي</button></div><div id="bExt"></div></div><div id="bOut"></div>`;
  $("#chg").onclick=()=>{B.m=null;step()};
  const vals=()=>{B.lib=$("#bLib")?$("#bLib").value:"";B.path=$("#bPath")?$("#bPath").value:"direct";const LC=B.lib&&typeof CLIB!=="undefined"?CLIB.get(B.lib):null;if(LC){B.c=LC.n;$("#bD").value=LC.facets.map(f=>f[1]).join("، ")}else B.c=$("#bC").value.trim()||"السمة";B.p=$("#bP").value.trim();B.k=Math.max(3,Math.min(60,+$("#bK").value||12));B.n=Math.max(10,Math.min(2000,+$("#bN").value||100));B.d=$("#bD").value;return{c:B.c,p:B.p,k:B.k,n:B.n,dims:B.d.split(/[،,]/).map(s=>s.trim()).filter(Boolean)}};
  const aiPrompt=()=>{const v=vals();return `أنت خبير في بناء المقاييس النفسية باللغة العربية. ابنِ ${v.k} بندًا لقياس «${v.c}» لدى ${v.p||"الفئة المستهدفة"} باستخدام ${m.t} (${m.en}).${v.dims.length?` الأبعاد: ${v.dims.join("، ")} — وزّع البنود عليها بالتساوي.`:""}
قواعد إلزامية: ابدأ بتعريف إجرائي للمفهوم من نظرية منشورة واذكر جوانبه. لا تذكر اسم المفهوم أو مرادفًا صريحًا له داخل أي عبارة؛ اكتب مؤشرات محددة (فكرة أو شعور أو سلوك أو عرض جسدي) في موقف محدد. فكرة واحدة لكل عبارة، بلا نفي مزدوج ولا كلمات مطلقة ولا مصطلحات إكلينيكية، ومناسبة للفئة المستهدفة. العبارات العكسية تصف الطرف المقابل للسمة وليست نفيًا.${B.path!=="direct"?" أضف عبارات غير مباشرة: مواقف غامضة لها تفسير مهدد وتفسيران محايدان، ومواقف سلوكية ببدائل موزونة 0–2، وسؤال تقدير عن الآخرين؛ وضع أوزان البدائل في w.":""}${m.id==="likert"||m.id==="aig"?" اجعل نحو 25% من البنود سالبة (معكوسة).":""}${m.id==="thurstone"?" أعطِ كل عبارة قيمة مقترحة من 1 إلى 11 في value، موزعة على المتصل.":""}${m.id==="guttman"?" رتّب العبارات تصاعديًا في الشدة وضع ترتيبها في value.":""}${m.id==="rasch"||m.id==="cat"?" نوّع صعوبة التأييد وضع صعوبة مقترحة بالـ logit من -2 إلى 2 في value.":""}${m.id==="osgood"?" كل بند زوج صفات متضادة بالشكل: صفة ـــ صفة، وdim أحد: التقييم، القوة، النشاط.":""}${m.id==="sjt"?" كل بند موقف واقعي قصير مع 4 تصرفات في options ومفتاح الأفضل والأسوأ في key.":""}${m.id==="forced"?" كل بند: text = «أي العبارتين تنطبق عليك أكثر؟» وoptions عبارتان متقاربتان في المرغوبية الاجتماعية من بعدين مختلفين.":""}
أعد JSON فقط بهذا الشكل:
{"instructions":"تعليمات للمفحوص","items":[{"text":"...","dim":"...","reverse":false,"value":null,"options":[],"w":[],"key":""}],"notes":"ملاحظات للباحث عن التحكيم والتحليل"}`};
  const rec=()=>{const v=vals();const r=m.n(v.k);$("#bRec").innerHTML=`<div class="verdict ${v.n>=r[0]?"ok":"mid"}">العينة المقترحة لهذه الطريقة: ${r[1]} ← الحد الأدنى المقترح ≈ ${r[0]}. عينتك (${v.n}) ${v.n>=r[0]?"كافية ✔":"أقل من المقترح"}.</div>`;aiExternal(aiPrompt(),$("#bExt"))};
  ["bC","bP","bK","bN","bD"].forEach(i=>$("#"+i).oninput=rec);const libInfo=()=>{const sel=$("#bLib");if(!sel)return;const LC=sel.value&&typeof CLIB!=="undefined"?CLIB.get(sel.value):null;$("#bC").hidden=!!LC;$("#bD").disabled=!!LC;if(LC)$("#bD").value=LC.facets.map(f=>f[1]).join("، ");const F=LC?CLIB.fit(m.id,LC):null;$("#bLibInfo").innerHTML=LC?`<p class="muted" style="font-size:13.5px;margin:6px 0">${esc(LC.def)}</p>${F?`<div class="verdict ${F.block?"no":"mid"}">${esc(F.msg)}</div>`:""}`:`<p class="muted" style="font-size:13.5px;margin:6px 0">لمفهوم غير موجود في المكتبة استخدم زرار الذكاء الاصطناعي (أو انسخ الطلب لمساعد الذكاء الاصطناعي)، وهو ملتزم بنفس قواعد البناء.</p>`;B.res=null;const o=$("#bOut");if(o)o.innerHTML="";rec()};if($("#bLib")){$("#bLib").onchange=libInfo;$("#bPath").onchange=()=>{B.res=null;rec()};libInfo()}if($("#qaP")){const au=()=>{B.aud={p:$("#qaP").value,r:$("#qaR").value};$("#qaTips").innerHTML=AUD.tipsHTML(B.aud.p);B.res=null;const o=$("#bOut");if(o)o.innerHTML=""};$("#qaP").onchange=au;$("#qaR").onchange=au;$("#qaTips").innerHTML=AUD.tipsHTML((B.aud||{p:"youth"}).p)}rec();
  $("#bTpl").onclick=()=>{const v=vals();const au=B.aud;if(!B.lib||typeof CLIB==="undefined"){toast("المفهوم ده مش في المكتبة: استخدم زرار الذكاء الاصطناعي أو انسخ الطلب لمساعد الذكاء الاصطناعي");return}const L=CLIB.build(m.id,B.lib,B.path,v.k);if(!L.items.length){$("#bOut").innerHTML=`<div class="panel"><div class="verdict no">${esc(L.warn||"لا توجد عبارات لهذه الطريقة")}</div></div>`;return}let its=L.items;if(au&&typeof AUD!=="undefined"&&(au.r!=="fusha"))its=its.map(it=>Object.assign({},it,{text:AUD.adapt(it.text,au.p,au.r).text,options:(it.options||[]).map(o=>AUD.adapt(o,au.p,au.r).text)}));B.res={instructions:(au&&typeof AUD!=="undefined"&&AUD.instructions(au.p,au.r))||L.instructions,items:its,notes:L.notes+(au&&typeof AUD!=="undefined"?" مُكيّف لفئة: "+AUD.prof(au.p).t+"، راجع كل عبارة فالتحويل الآلي مسودة.":""),src:"lib",lib:B.lib};show()};
  aiGet().then(s=>{const btn=$("#bAI");if(!s||!btn)return;btn.hidden=false;btn.onclick=async()=>{btn.disabled=true;const old=btn.textContent;btn.textContent="جارٍ البناء… (قد يستغرق دقيقة)";
   try{const r=await s.json(aiPrompt(),{cache:false});if(!r||!Array.isArray(r.items)||!r.items.length)throw{code:"invalid_json"};B.res={instructions:String(r.instructions||""),items:r.items.map(x=>({text:String(x.text||""),dim:String(x.dim||""),reverse:!!x.reverse,value:x.value==null||x.value===""?null:+x.value,options:Array.isArray(x.options)?x.options.map(String):[],w:Array.isArray(x.w)&&x.w.length?x.w.map(Number):null,kind:Array.isArray(x.options)&&x.options.length?"sjt":"d",key:String(x.key||"")})).filter(x=>x.text),notes:String(r.notes||""),src:"ai"};show()}
   catch(e){toast(AI_ERR[e&&e.code]||"تعذر البناء الآن، استخدم القوالب الجاهزة أو انسخ الطلب لمساعد الذكاء الاصطناعي.")}
   btn.disabled=false;btn.textContent=old}});
  if(B.res)show();
 };
 function show(){const m=B.m,r=B.res,o=$("#bOut");if(!o)return;const v={c:B.c,n:B.n};
  const resp=respOf(m);const its=r.items;
  let h=`<div class="panel"><div class="row" style="justify-content:space-between"><h3 style="margin:0">3) مقياس ${esc(v.c)}</h3><span class="chip ${r.src==="ai"?"gold":""}">${r.src==="ai"?"مولّد بالذكاء الاصطناعي":"من مخطط المفهوم: مسودة علمية للتحكيم"}</span></div>
  <p><b>التعليمات:</b> ${esc(r.instructions||defInstr(m))}</p>`;
  const LC=(r.lib||B.lib)&&typeof CLIB!=="undefined"?CLIB.get(r.lib||B.lib):null;its.forEach((it,i)=>{const QF=typeof CLIB!=="undefined"?CLIB.quality(it,LC||{n:v.c,leak:[],type:"trait"}):[];h+=`<div class="qitem"><b>${i+1}.</b> ${esc(it.text)} ${it.reverse?'<span class="rev">(معكوس)</span>':""}${it.kind&&it.kind!=="d"&&typeof CLIB!=="undefined"?` <span class="chip">${CLIB.KIND[it.kind]||""}</span>`:""}${QF.map(q=>` <span class="chip ${q[0]==="bad"?"bad":"warn"}">${esc(q[1])}</span>`).join("")}<div class="muted" style="font-size:13.5px">${it.dim?"البعد: "+esc(it.dim):""}${it.value!=null&&isFinite(it.value)?` · ${m.id==="thurstone"?"القيمة المقترحة":m.id==="guttman"?"الترتيب":"الصعوبة (logit)"}: ${it.value}`:""}${it.level?" · "+it.level:""}</div>${it.options&&it.options.length?`<div class="sc">${it.options.map((op,j)=>`<span>${"أبجدهوز"[j]||j+1}) ${esc(op)}</span>`).join("")}</div>${it.key?`<div class="muted" style="font-size:13.5px">المفتاح: ${esc(it.key)}</div>`:""}`:resp.length?`<div class="sc">${resp.map(x=>`<span>${x}</span>`).join("")}</div>`:""}</div>`});
  h+=`<p class="muted" style="font-size:14px">${esc(r.notes||"")}</p><div class="box warn"><b>قبل التطبيق</b>هذه مسودة: اعرضها على 5–10 محكمين (صدق المحتوى CVR/CVI)، وجرّبها على عينة استطلاعية 30–50 فردًا، وعدّل الصياغة.</div>
  ${LC?(()=>{const cv=CLIB.coverage(its,LC);return `<details class="box" open><summary><b>مخطط المفهوم (Blueprint)</b></summary><p><b>التعريف الإجرائي:</b> ${esc(LC.def)}</p><p><b>الإطار النظري:</b> ${esc(LC.theory)}</p><p><b>الجوانب:</b> ${LC.facets.map(f=>esc(f[1])).join("، ")}</p><p><b>خطة الصدق مقدمًا:</b> يُتوقع ارتباط موجب مع: ${LC.nomo.pos.map(esc).join("، ")}${LC.nomo.neg.length?"؛ وسالب مع: "+LC.nomo.neg.map(esc).join("، "):""}${LC.nomo.none&&LC.nomo.none.length?"؛ وارتباط ضعيف أو منعدم مع: "+LC.nomo.none.map(esc).join("، "):""}. سجّل هذه التوقعات قبل جمع البيانات.</p>${cv.n?`<p><b>مصفوفة التغطية (العبارات المباشرة):</b></p><table class="otbl"><thead><tr>${cv.head.map(x=>`<th>${x}</th>`).join("")}</tr></thead><tbody>${cv.rows.map(rw=>`<tr>${rw.map(x=>`<td>${typeof x==="number"?x:esc(x)}</td>`).join("")}</tr>`).join("")}</tbody></table><p class="muted" style="font-size:13.5px">العبارات العكسية ${cv.rev} من ${cv.n} (${Math.round(cv.pr*100)}%)${cv.pr<.15?": أقل من المقترح (15% إلى 40%)":cv.pr>.5?": أكثر من المقترح":""}${cv.empty.length?". جوانب بلا عبارات: "+cv.empty.map(esc).join("، "):""}</p>`:""}</details><details class="box"><summary><b>مفتاح التصحيح (لا يظهر للمفحوص)</b></summary><table class="otbl"><thead><tr><th>#</th><th>النوع</th><th>الجانب</th><th>التصحيح</th></tr></thead><tbody>${CLIB.keyRows(its).map(rw=>`<tr>${rw.map(x=>`<td>${esc(String(x))}</td>`).join("")}</tr>`).join("")}</tbody></table><p class="muted" style="font-size:13.5px">${its.some(x=>x.w)&&its.some(x=>x.kind==="d")?"تُحسب 3 درجات: المباشرة (نسبة من الحد الأقصى)، وغير المباشرة (مجموع الأوزان)، والمجمّعة. والفرق بين المباشرة وغير المباشرة مؤشر للتجميل أو ضعف الاستبصار، ويُحلل كمتغير بحثي.":""}</p></details>`})():""}<div class="row"><button class="btn sm" id="bCopy">نسخ المقياس</button><button class="btn sm ghost" onclick="window.print()">طباعة / PDF</button></div></div>`;
  const sim=["sjt","forced"].includes(m.id)?null:true;
  if(sim)h+=`<div class="panel"><h3>4) جرّب التحليل على عينة افتراضية (${v.n} فردًا)</h3><p class="muted" style="margin-top:0">نولّد استجابات افتراضية لـ ${v.n} فردًا على بنودك (بعد عكس البنود السالبة) لتتدرب على حساب الثبات.</p><button class="btn sm gold" id="bSim">ولّد البيانات واحسب الثبات</button><div id="bSimOut"></div></div>`;
  o.innerHTML=h;o.scrollIntoView({behavior:"smooth",block:"start"});
  $("#bCopy").onclick=()=>{const t=`مقياس ${v.c}\n${r.instructions||defInstr(m)}\n\n`+its.map((it,i)=>`${i+1}. ${it.text}${it.reverse?" (معكوس)":""}${it.options&&it.options.length?"\n   "+it.options.map((x,j)=>("أبجدهوز"[j]||j+1)+") "+x).join("\n   "):""}`).join("\n")+(resp.length&&!(its[0].options&&its[0].options.length)?`\n\nالبدائل: ${resp.join(" / ")}`:"");const done=()=>toast("تم نسخ المقياس");navigator.clipboard?navigator.clipboard.writeText(t).then(done,()=>fallbackCopy(t,done)):fallbackCopy(t,done)};
  sharePanel(o);
  const sb=$("#bSim");if(sb)sb.onclick=()=>{const bin=!!m.bin,steps=Math.max(2,resp.length||5);if(its.some(x=>x.options&&x.options.length)&&its.some(x=>!(x.options&&x.options.length))){toast("المحاكاة للعبارات المباشرة فقط؛ اختر المسار المباشر للتجربة");return}const rows=simulate(its,Math.min(v.n,2000),bin,steps);const cols=its.map((_,j)=>rows.map(rw=>rw[j]));const a=alphaOf(cols);
   
   $("#bSimOut").innerHTML=`<div class="kpis" style="margin-top:10px"><div class="kpi hl"><small>${bin?"KR-20 / ألفا":"ألفا كرونباخ"}</small><b>${f2(a,3)}</b></div><div class="kpi"><small>عدد الأفراد</small><b>${rows.length}</b></div><div class="kpi"><small>عدد البنود</small><b>${its.length}</b></div></div><div class="verdict ${relLbl(a)[1]}">الثبات ${relLbl(a)[0]} (بيانات افتراضية للتدريب فقط — النتيجة الحقيقية تأتي من تطبيقك الفعلي)</div><div class="row"><button class="btn sm" id="bSimGo">حلّل البيانات الافتراضية بالتفصيل في «ابنِ مقياسك»</button></div>`;$("#bSimGo").onclick=()=>{const Q=buildQ();respToScale(Q,rows.map(rw=>({n:"",d:[],a:rw.map((x,j)=>simIdx(Q,Q.items[j].r?(bin?1-x:steps+1-x):x,bin,steps))})),0,"افتراضية")}};
 }
 step();
}
const PUBLIC_URL="https://mohamedothman17.github.io/psych-scales-lab/";
const QKEY="scaleslab-lastQ";
const b64e=u8=>{let bin="";for(let i=0;i<u8.length;i+=8192)bin+=String.fromCharCode.apply(null,u8.subarray(i,i+8192));return btoa(bin).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"")};
const b64d=s=>{s=s.replace(/-/g,"+").replace(/_/g,"/");while(s.length%4)s+="=";const bin=atob(s);return Uint8Array.from(bin,c=>c.charCodeAt(0))};
async function packQ(obj){const u=new TextEncoder().encode(JSON.stringify(obj));if(window.CompressionStream){try{const buf=new Uint8Array(await new Response(new Blob([u]).stream().pipeThrough(new CompressionStream("deflate-raw"))).arrayBuffer());return"z"+b64e(buf)}catch(e){}}return"j"+b64e(u)}
async function unpackQ(s){const k=s[0],u=b64d(s.slice(1));if(k==="j")return JSON.parse(new TextDecoder().decode(u));if(k==="z"){if(!window.DecompressionStream)throw new Error("old browser");return JSON.parse(await new Response(new Blob([u]).stream().pipeThrough(new DecompressionStream("deflate-raw"))).text())}throw new Error("bad")}
const hashStr=s=>{let h=5381;for(let i=0;i<s.length;i++)h=((h<<5)+h+s.charCodeAt(i))>>>0;return h.toString(36)};
function buildQ(){const m=B.m,r=B.res,dirs={likert:"d",aig:"d",thurstone:"b",guttman:"b",osgood:"a",rasch:"a",cat:"a",sjt:"o",forced:"o"};
 const nm=$("#shName")?$("#shName").checked:true,dm=$$("#shDemo input:checked").map(i=>i.value);
 const Q={v:1,t:"مقياس "+(B.c||""),ins:r.instructions||defInstr(m),sc:respOf(m),s:dirs[m.id]||"a",m:m.id,nm,dm,items:r.items.map(it=>{const o={x:it.text};if(it.dim)o.g=it.dim;if(m.id==="thurstone"&&it.value!=null)o.v=it.value;if(it.options&&it.options.length)o.o=it.options;if(it.w)o.w=it.w;if(it.reverse)o.r=1;return o})};
 Q.id=hashStr(JSON.stringify([Q.t,Q.sc,Q.items]));const g=gsCfg();if(g&&$("#shGS")&&$("#shGS").checked)Q.ep=g.url;return Q}
/* --- Google Sheets as the responses server (Apps Script web app) --- */
const GSKEY="scaleslab-gs";
function gsCfg(){try{const g=JSON.parse(localStorage.getItem(GSKEY)||"null");return g&&g.url&&g.key?g:null}catch(e){return null}}
function gsScript(key){return String.raw`// خادم ردود «مختبر المقاييس النفسية» — Google Apps Script
// 1) اضغط Run على الدالة setup ووافق على الصلاحيات
// 2) Deploy ← New deployment ← Web app ← Execute as: Me ← Who has access: Anyone ← Deploy
// 3) انسخ Web app URL والصقه في الموقع
var SECRET = "__KEY__";

function setup() {
  var ss = getSS_();
  Logger.log("تم إنشاء شيت الردود: " + ss.getUrl());
  Logger.log("الخطوة التالية: Deploy ← New deployment ← Web app ← Who has access: Anyone");
}
function getSS_() {
  var p = PropertiesService.getScriptProperties(), id = p.getProperty("SSID");
  if (id) { try { return SpreadsheetApp.openById(id); } catch (e) {} }
  var ss = SpreadsheetApp.create("ردود مقاييس مختبر المقاييس النفسية");
  p.setProperty("SSID", ss.getId());
  return ss;
}
function json_(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}
function sheetFor_(ss, qid, title, create) {
  var tag = " - " + qid;
  var sh = ss.getSheets().filter(function (s) { var n = s.getName(); return n.slice(-tag.length) === tag; })[0];
  if (!sh && create) sh = ss.insertSheet(String(title || "مقياس").replace(/[:\\\/?*\[\]]/g, "").slice(0, 60) + tag);
  return sh;
}
function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    var d = JSON.parse(e.postData.contents);
    var qid = String(d.qid || "").replace(/[^a-z0-9]/g, "").slice(0, 20);
    if (!qid) return json_({ ok: false });
    var sh = sheetFor_(getSS_(), qid, d.t, true);
    if (sh.getLastRow() === 0) sh.appendRow(["التاريخ"].concat(d.h || []).concat(["raw"]));
    var row = [new Date()];
    if (d.nm) row.push(String(d.n || "").slice(0, 100));
    (d.d || []).forEach(function (x) { row.push(String(x).slice(0, 100)); });
    (d.s || []).forEach(function (x) { row.push(x); });
    row.push(JSON.stringify({ n: d.n || "", d: d.d || [], a: d.a || [] }));
    sh.appendRow(row);
    return json_({ ok: true });
  } finally {
    lock.releaseLock();
  }
}
function doGet(e) {
  var p = (e && e.parameter) || {};
  if (p.key !== SECRET) return json_({ ok: false, error: "key" });
  if (p.ping) return json_({ ok: true, sheet: getSS_().getUrl() });
  var sh = sheetFor_(getSS_(), String(p.qid || ""), "", false);
  if (!sh || sh.getLastRow() < 2) return json_({ ok: true, rows: [] });
  var v = sh.getRange(2, sh.getLastColumn(), sh.getLastRow() - 1, 1).getValues();
  var rows = [];
  v.forEach(function (r) { try { rows.push(JSON.parse(r[0])); } catch (x) {} });
  return json_({ ok: true, rows: rows });
}`.replace("__KEY__",key)}
function renderGS(el,onChange){const g=gsCfg();
 if(g){el.innerHTML=`<div class="verdict ok" style="margin:8px 0">✔ مربوط بـ Google Sheets — الردود هتتحفظ تلقائيًا في الشيت بتاعك.</div><div class="row"><button class="btn sm ghost" id="gsTest">اختبر الربط</button>${g.sheet?`<a class="btn sm ghost" style="text-decoration:none" target="_blank" rel="noopener" href="${esc(g.sheet)}">افتح شيت الردود</a>`:""}<button class="btn sm ghost" id="gsOff">فصل الربط</button></div>`;
  $("#gsOff",el).onclick=()=>confirmBox("فصل الربط؟ الردود المحفوظة في الشيت لن تُمسح.","فصل الربط",()=>{try{localStorage.removeItem(GSKEY)}catch(e){}renderGS(el,onChange);onChange&&onChange()});
  $("#gsTest",el).onclick=async()=>{const r=await gsPing(g.url,g.key);toast(r?"✔ الربط شغال":"تعذر الاتصال؛ تأكد من النشر بـ Anyone")};return}
 let key="";try{const u=new Uint8Array(16);crypto.getRandomValues(u);key=b64e(u)}catch(e){key=Math.random().toString(36).slice(2)+Date.now().toString(36)}
 const code=gsScript(key);
 el.innerHTML=`<div class="box note" style="margin-top:8px"><b>الإعداد مرة واحدة فقط (دقيقتين) — بحسابك في جوجل</b><ol style="margin:4px 0"><li>اضغط «نسخ كود السيرفر».</li><li>افتح <a href="https://script.google.com/home/projects/create" target="_blank" rel="noopener">script.google.com</a> (مشروع جديد)، امسح الموجود والصق الكود، واحفظ (Ctrl+S).</li><li>اختر الدالة <b>setup</b> من الأعلى واضغط <b>Run ▶</b>، ووافق على الصلاحيات (لو ظهر «Google hasn't verified this app»: Advanced ← Go to project ← Allow).</li><li>اضغط <b>Deploy ← New deployment</b> ← اختر النوع <b>Web app</b> ← Execute as: <b>Me</b> ← Who has access: <b>Anyone</b> ← <b>Deploy</b>.</li><li>انسخ <b>Web app URL</b> (ينتهي بـ /exec) والصقه تحت واضغط «اربط».</li></ol>الكود فيه <b>مفتاح سري</b> خاص بك: بيه بس تقدر تسحب الردود، وهو محفوظ على جهازك ومش موجود في لينك المفحوصين.</div>
 <div class="codebox">${esc(code)}</div><div class="row" style="margin-top:8px"><button class="btn sm gold" id="gsCp">نسخ كود السيرفر</button><a class="btn sm ghost" style="text-decoration:none" target="_blank" rel="noopener" href="https://script.google.com/home/projects/create">افتح Google Apps Script</a></div>
 <label class="fl" for="gsUrl">Web app URL</label><input type="text" id="gsUrl" style="direction:ltr" placeholder="https://script.google.com/macros/s/.../exec"><div class="row" style="margin-top:8px"><button class="btn sm" id="gsSave">اربط</button></div>`;
 $("#gsCp",el).onclick=()=>{const d=()=>toast("تم نسخ كود السيرفر");navigator.clipboard?navigator.clipboard.writeText(code).then(d,()=>fallbackCopy(code,d)):fallbackCopy(code,d)};
 $("#gsSave",el).onclick=async()=>{const url=$("#gsUrl",el).value.trim();if(!/^https:\/\/script\.google\.com\/macros\/s\/[\w-]+\/exec$/.test(url)){toast("اللينك لازم يبدأ بـ https://script.google.com/macros/s/ وينتهي بـ /exec");return}
  const b=$("#gsSave",el);b.disabled=true;b.textContent="جارٍ الاختبار…";const r=await gsPing(url,key);b.disabled=false;b.textContent="اربط";
  if(!r){toast("الاتصال فشل: تأكد إنك نشرت بـ Who has access: Anyone وإنك لزقت نفس الكود");return}
  try{localStorage.setItem(GSKEY,JSON.stringify({url,key,sheet:r.sheet||""}))}catch(e){}toast("✔ تم الربط بـ Google Sheets");renderGS(el,onChange);onChange&&onChange()};
}
async function gsPing(url,key){try{const r=await fetch(url+"?ping=1&key="+encodeURIComponent(key));const j=await r.json();return j&&j.ok?j:null}catch(e){return null}}
async function gsPost(ep,payload){try{const r=await fetch(ep,{method:"POST",body:JSON.stringify(payload)});const j=await r.json();return j&&j.ok?"ok":"fail"}catch(e){try{await fetch(ep,{method:"POST",mode:"no-cors",body:JSON.stringify(payload)});return"maybe"}catch(e2){return"fail"}}}
function sharePanel(o){const p=document.createElement("div");p.className="panel";
 p.innerHTML=`<h3>5) أرسل المقياس للمفحوصين</h3>
 <label class="row" style="gap:8px"><input type="checkbox" id="shName" checked> <b>إلزام المفحوص بكتابة اسمه</b></label>
 <p class="muted" style="margin:6px 0 2px">بيانات إضافية تطلبها (اختياري):</p><div class="row" id="shDemo">${["النوع","العمر","الكلية / التخصص","الفرقة الدراسية"].map(d=>`<label class="row" style="gap:6px"><input type="checkbox" value="${d}"> ${d}</label>`).join("")}</div>
 <div class="panel" style="background:var(--good-soft);border-color:var(--good);margin:12px 0 0"><h3 style="margin-bottom:4px">📊 حفظ الردود تلقائيًا في Google Sheets (موصى به)</h3><p class="muted" style="margin:0">لما المفحوص يدوس «إرسال» إجاباته تتسجل مباشرة في شيت على حسابك، من غير أكواد.</p><label class="row" style="gap:8px;margin-top:8px" id="shGSw"><input type="checkbox" id="shGS" checked> احفظ ردود هذا المقياس في Google Sheet</label><div id="gsBox"></div></div>
 <div class="row" style="margin-top:12px"><button class="btn" id="shLink">🔗 أنشئ لينك مباشر للمقياس</button><button class="btn ghost" id="shGF">📝 أنشئ نموذج Google Forms</button></div><div id="shOut"></div>`;
 o.appendChild(p);
 const gsUpd=()=>{$("#shGSw").hidden=!gsCfg()};renderGS($("#gsBox"),gsUpd);gsUpd();
 const c=document.createElement("div");c.className="panel";c.id="collect";o.appendChild(c);renderCollect(c);
 $("#shLink").onclick=async()=>{const Q=buildQ();try{localStorage.setItem(QKEY,JSON.stringify(Q))}catch(e){}const code=await packQ(Q);const url=PUBLIC_URL+"#take/"+code;
  $("#shOut").innerHTML=`<div class="box tip" style="margin-top:12px"><b>اللينك جاهز ✔</b>ابعته لأي حد؛ بيفتح من غير أي تسجيل، ويجاوب على الأسئلة${Q.nm?" بعد كتابة اسمه (إلزامي)":""}. ${Q.ep?"إجاباته هتتسجل تلقائيًا في Google Sheet بتاعك، وتسحبها تحت بزرار واحد.":"بعد ما يخلّص هيظهر له «كود ردّ» يبعته لك على واتساب، وأنت تجمع الأكواد تحت. (اربط Google Sheets فوق عشان الردود توصل تلقائيًا.)"}</div><input type="text" readonly value="${esc(url)}" style="direction:ltr" onclick="this.select()"><div class="row" style="margin-top:8px"><button class="btn sm gold" id="cpL">نسخ اللينك</button><a class="btn sm ghost" style="text-decoration:none" target="_blank" rel="noopener" href="https://wa.me/?text=${encodeURIComponent("برجاء الإجابة على "+Q.t+":\n"+url)}">إرسال على واتساب</a><a class="btn sm ghost" style="text-decoration:none" target="_blank" rel="noopener" href="${esc(url)}">جرّبه بنفسك</a></div>${url.length>6000?`<p class="muted" style="font-size:14px">⚠ اللينك طويل (${url.length} حرف) لكثرة البنود؛ يعمل في المتصفحات وواتساب، وإذا قُطع فقلل عدد البنود أو استخدم Google Forms.</p>`:""}`;
  $("#cpL").onclick=()=>{const d=()=>toast("تم نسخ اللينك");navigator.clipboard?navigator.clipboard.writeText(url).then(d,()=>fallbackCopy(url,d)):fallbackCopy(url,d)};renderCollect(c)};
 $("#shGF").onclick=()=>{const Q=buildQ();const code=gfScript(Q);
  $("#shOut").innerHTML=`<div class="box note" style="margin-top:12px"><b>إنشاء النموذج على Google Forms تلقائيًا (دقيقة واحدة)</b><ol style="margin:4px 0"><li>اضغط «نسخ الكود».</li><li>افتح <a href="https://script.google.com/home/projects/create" target="_blank" rel="noopener">script.google.com</a> بحسابك في جوجل (مشروع جديد).</li><li>امسح الموجود والصق الكود (Ctrl+V) ثم اضغط <b>Run ▶</b>.</li><li>وافق على الصلاحيات (Review permissions ← اختر حسابك ← Allow). لو ظهر «Google hasn't verified this app» اضغط Advanced ثم Go to project.</li><li>في <b>Execution log</b> هيظهر لك <b>لينك النموذج للمشاركين</b> ولينك التعديل، ونموذجك هيكون في Google Forms ومعاه Google Sheet للردود.</li></ol>${Q.nm?"الاسم مضاف كسؤال إلزامي.":""} بعد جمع الردود: من Google Sheets اعمل File ← Download ← CSV، واستورده في «ابنِ مقياسك» (خطوة جمع البيانات ← Google Forms أو Excel).</div><div class="codebox">${esc(code)}</div><div class="row" style="margin-top:8px"><button class="btn sm gold" id="cpG">نسخ الكود</button><a class="btn sm ghost" style="text-decoration:none" target="_blank" rel="noopener" href="https://script.google.com/home/projects/create">افتح Google Apps Script</a></div>`;
  $("#cpG").onclick=()=>{const d=()=>toast("تم نسخ كود Google Forms");navigator.clipboard?navigator.clipboard.writeText(code).then(d,()=>fallbackCopy(code,d)):fallbackCopy(code,d)}};
}
function gfScript(Q){const opts=Q.sc&&Q.sc.length?Q.sc:null;const items=Q.items.map(it=>({text:it.x,options:it.o||opts||["نعم","لا"]}));
 return `// كود إنشاء نموذج Google Forms — مختبر المقاييس النفسية
function createScaleForm() {
  var TITLE = ${JSON.stringify(Q.t)};
  var INSTRUCTIONS = ${JSON.stringify(Q.ins)};
  var REQUIRE_NAME = ${Q.nm?"true":"false"};
  var DEMOGRAPHICS = ${JSON.stringify(Q.dm)};
  var ITEMS = ${JSON.stringify(items,null,1)};

  var form = FormApp.create(TITLE);
  form.setDescription(INSTRUCTIONS);
  form.setProgressBar(true);
  if (REQUIRE_NAME) form.addTextItem().setTitle('الاسم').setRequired(true);
  DEMOGRAPHICS.forEach(function (d) { form.addTextItem().setTitle(d).setRequired(true); });
  ITEMS.forEach(function (it, i) {
    form.addMultipleChoiceItem().setTitle((i + 1) + '. ' + it.text).setChoiceValues(it.options).setRequired(true);
  });
  var sheet = SpreadsheetApp.create(TITLE + ' - الردود');
  form.setDestination(FormApp.DestinationType.SPREADSHEET, sheet.getId());
  Logger.log('لينك النموذج للمشاركين: ' + form.getPublishedUrl());
  Logger.log('لينك تعديل النموذج: ' + form.getEditUrl());
  Logger.log('شيت الردود: ' + sheet.getUrl());
}`}
function scoreOf(Q,i,idx){if(Q.items[i]&&Q.items[i].w)return Q.items[i].w[idx];const it=Q.items[i],n=(it.o&&it.o.length)||(Q.sc&&Q.sc.length)||2;if(Q.s==="b")return idx===0?1:0;if(Q.s==="d")return n-idx;return idx+1}
function renderCollect(c){let Q=null;try{Q=JSON.parse(localStorage.getItem(QKEY)||"null")}catch(e){}
 if(!Q){c.innerHTML=`<h3>6) جمّع الردود وحللها</h3><p class="muted" style="margin:0">أنشئ اللينك المباشر أولًا، ثم الصق هنا أكواد الردود اللي توصلك.</p>`;return}
 const g=gsCfg();
 c.innerHTML=`<h3>6) جمّع ردود «${esc(Q.t)}» وحللها</h3>${Q.ep&&g&&g.url===Q.ep?`<div class="row" style="margin-bottom:10px"><button class="btn gold" id="rcPull">📥 اسحب الردود من Google Sheet</button>${g.sheet?`<a class="btn sm ghost" style="text-decoration:none" target="_blank" rel="noopener" href="${esc(g.sheet)}">افتح الشيت</a>`:""}</div><p class="muted" style="margin-top:0">أو لو حد بعتلك كود رد يدوي (لو النت كان ضعيف عنده) الصقه هنا:</p>`:`<p class="muted" style="margin-top:0">الصق رسائل الواتساب أو أكواد الردود كما هي (كل كود يبدأ بـ RSP1)، حتى لو كانت كلها في رسالة واحدة.</p>`}<textarea id="rcIn" style="min-height:110px" placeholder="RSP1:..."></textarea><div class="row" style="margin-top:8px"><button class="btn" id="rcGo">حوّل الأكواد إلى بيانات وحللها</button></div><div id="rcOut"></div>`;
 const pull=$("#rcPull",c);if(pull)pull.onclick=async()=>{pull.disabled=true;pull.textContent="جارٍ السحب…";let j=null;try{const r=await fetch(g.url+"?key="+encodeURIComponent(g.key)+"&qid="+encodeURIComponent(Q.id));j=await r.json()}catch(e){}pull.disabled=false;pull.textContent="📥 اسحب الردود من Google Sheet";
  if(!j||!j.ok){$("#rcOut",c).innerHTML=`<div class="verdict no">تعذر الاتصال بالشيت${j&&j.error==="key"?" (المفتاح غير مطابق — هل غيّرت الكود؟)":""}. جرّب من نسخة GitHub للموقع، وتأكد من النشر بـ Anyone.</div>`;return}
  if(!j.rows.length){$("#rcOut",c).innerHTML=`<div class="verdict mid">لا توجد ردود بعد على هذا المقياس.</div>`;return}respToScale(Q,j.rows,0,'Google Sheet')};
 $("#rcGo",c).onclick=()=>{const txt=$("#rcIn",c).value,re=/RSP1:([a-z0-9]+):([A-Za-z0-9_-]+)/g;let mm,rows=[],bad=0,other=0;while((mm=re.exec(txt))){if(mm[1]!==Q.id){other++;continue}try{rows.push(JSON.parse(new TextDecoder().decode(b64d(mm[2]))))}catch(e){bad++}}
  if(!rows.length){$("#rcOut",c).innerHTML=`<div class="verdict no">لم أجد أكواد صالحة لهذا المقياس${other?` (${other} كود تخص مقياسًا آخر)`:""}.</div>`;return}
  respToScale(Q,rows,bad,'كود رد')};
}
async function renderTake(code){let Q;try{Q=await unpackQ(code)}catch(e){view.innerHTML=`<div class="panel verdict no">الرابط غير صالح أو ناقص. اطلب من الباحث إرسال الرابط كاملًا.</div>`;return}
 const opts=it=>it.o||Q.sc||[];
 view.innerHTML=`<div class="lhead"><h2>${esc(Q.t)}</h2><p style="margin:6px 0 0">${esc(Q.ins)}</p></div>
 ${Q.nm||Q.dm.length?`<div class="panel">${Q.nm?`<label class="fl" for="tkN">الاسم <span style="color:var(--bad)">*</span></label><input type="text" id="tkN" autocomplete="name">`:""}${Q.dm.map((d,i)=>`<label class="fl" for="tkD${i}">${esc(d)} <span style="color:var(--bad)">*</span></label><input type="text" id="tkD${i}">`).join("")}</div>`:""}
 ${Q.items.map((it,i)=>`<div class="tk-item" id="tk${i}"><b>${i+1}.</b> ${esc(it.x)}<div class="tk-opts ${it.o?"col":""}">${opts(it).map((op,k)=>`<label><input type="radio" name="tq${i}" value="${k}"> ${esc(op)}</label>`).join("")}</div></div>`).join("")}
 <div class="row"><button class="btn" id="tkGo">إرسال الإجابات</button></div><div id="tkOut"></div><p class="muted" style="font-size:13.5px;margin-top:16px">لا يتم حفظ إجاباتك على أي خادم؛ تُرسل فقط للباحث عن طريق الكود.</p>`;
 $("#tkGo").onclick=async()=>{let miss=0;const a=Q.items.map((_,i)=>{const s=$(`input[name="tq${i}"]:checked`);$("#tk"+i).classList.toggle("miss",!s);if(!s)miss++;return s?+s.value:-1});
  const n=Q.nm?$("#tkN").value.trim():"";const d=Q.dm.map((_,i)=>$("#tkD"+i).value.trim());
  if(Q.nm&&!n){toast("اكتب اسمك أولًا");$("#tkN").focus();return}if(d.some(x=>!x)){toast("أكمل البيانات المطلوبة");return}if(miss){toast(`باقي ${miss} سؤال بدون إجابة`);const f=$(".tk-item.miss");f&&f.scrollIntoView({behavior:"smooth",block:"center"});return}
  const rc=`RSP1:${Q.id}:${b64e(new TextEncoder().encode(JSON.stringify({n,d,a})))}`;
  $("#tkGo").disabled=true;
  if(Q.ep&&/^https:\/\/script\.google\.com\/macros\/s\/[\w-]+\/exec$/.test(Q.ep)){$("#tkGo").textContent="جارٍ الإرسال…";
   const h=[...(Q.nm?["الاسم"]:[]),...Q.dm,...Q.items.map((it,i)=>"q"+(i+1)+": "+it.x.slice(0,40))];
   const st=await gsPost(Q.ep,{qid:Q.id,t:Q.t,h,nm:Q.nm,n,d,a,s:a.map((x,i)=>scoreOf(Q,i,x))});
   if(st!=="fail"){$("#tkGo").textContent="تم الإرسال";$("#tkOut").innerHTML=`<div class="panel" style="margin-top:12px;text-align:center"><div style="font-size:48px">✅</div><h3 style="justify-content:center">تم إرسال إجاباتك بنجاح${n?" يا "+esc(n):""}. شكرًا لمشاركتك!</h3><p class="muted">يمكنك إغلاق الصفحة الآن.</p><details class="steps" style="text-align:start"><summary>لو طلب منك الباحث كود الرد</summary><div class="codebox">${esc(rc)}</div></details></div>`;$("#tkOut").scrollIntoView({behavior:"smooth"});return}
   toast("تعذر الإرسال التلقائي — ابعت الكود للباحث")}
  $("#tkGo").textContent="إرسال الإجابات";$("#tkOut").innerHTML=`<div class="panel" style="margin-top:12px"><h3>✔ شكرًا${n?" يا "+esc(n):""}! خطوة أخيرة</h3><p>ابعت كود الرد ده للباحث (الأسهل بزر الواتساب):</p><div class="codebox">${esc(rc)}</div><div class="row" style="margin-top:10px"><a class="btn gold" style="text-decoration:none" target="_blank" rel="noopener" href="https://wa.me/?text=${encodeURIComponent("ردي على "+Q.t+":\n"+rc)}">إرسال على واتساب</a><button class="btn ghost" id="tkCp">نسخ الكود</button><a class="btn ghost" style="text-decoration:none" href="mailto:?subject=${encodeURIComponent("رد "+Q.t)}&body=${encodeURIComponent(rc)}">إرسال بالإيميل</a></div></div>`;
  $("#tkCp").onclick=()=>{const dn=()=>toast("تم نسخ الكود");navigator.clipboard?navigator.clipboard.writeText(rc).then(dn,()=>fallbackCopy(rc,dn)):fallbackCopy(rc,dn)};$("#tkOut").scrollIntoView({behavior:"smooth"})};
}
function defInstr(m){return m.id==="thurstone"?"ضع علامة أمام العبارات التي توافق عليها فقط.":m.id==="guttman"?"أجب بنعم أو لا على كل عبارة.":m.id==="osgood"?"قيّم المفهوم على كل زوج من الصفات بوضع علامة في الخانة الأقرب لرأيك (1 = الصفة اليمنى، 7 = الصفة اليسرى).":m.id==="sjt"?"اقرأ كل موقف واختر التصرف الذي ستقوم به فعلًا.":m.id==="forced"?"اختر من كل زوج العبارة التي تنطبق عليك أكثر، حتى لو انطبقت الاثنتان.":"اقرأ كل عبارة واختر البديل الذي يعبر عنك بصدق، لا توجد إجابات صحيحة أو خاطئة."}
  /* simulated score -> chosen option index, following the link's scoring direction */
  function simIdx(Q, x, bin, steps) { if (Q.s === 'b' || bin) return x ? 0 : 1; if (Q.s === 'd') return steps - x; return x - 1; }
  /* collected link/Sheet responses -> a scale in the 12-step builder (raw values follow the builder convention) */
  function respToScale(Q, rows, bad, src) {
    const opts = it => it.o || Q.sc || [];
    const kind = Q.m === 'sjt' ? 'sjt' : Q.m === 'forced' ? 'forced' : Q.s;
    let labels, raw;
    if (kind === 'sjt') { labels = ['أ', 'ب', 'ج', 'د']; raw = idx => 4 - idx; }
    else if (kind === 'forced') { labels = ['العبارة الأولى', 'العبارة الثانية']; raw = idx => idx === 0 ? 1 : 0; }
    else if (kind === 'b') { labels = Q.sc.slice(0, 2); raw = idx => idx === 0 ? 1 : 0; }
    else if (kind === 'd') { labels = Q.sc.slice(); raw = idx => labels.length - idx; }
    else { labels = Q.sc.slice().reverse(); raw = idx => idx + 1; }
    const items = Q.items.map(it => {
      let text = it.x;
      if (kind === 'sjt') text = [it.x, ...opts(it).slice(0, 4)].join(' | ');
      else if (kind === 'forced') text = opts(it).slice(0, 2).join(' | ');
      else if (Q.m === 'osgood') { const p = it.x.split(/\s*(?:ـــ\s*)+/).filter(Boolean); if (p.length === 2) text = p.join(' | '); }
      return { text, dim: it.g || '', dir: it.r ? -1 : 1, sv: it.v ?? null, key: 0 };
    });
    const seen = new Set(); let dup = 0; const out = [];
    rows.forEach(rw => { const k = JSON.stringify(rw); if (seen.has(k)) { dup++; return; } seen.add(k); out.push({ vals: Q.items.map((_, i) => { const a = rw.a && rw.a[i]; return a == null || a < 0 ? null : raw(a); }), extra: rw.n ? { name: String(rw.n).slice(0, 100) } : {} }); });
    const n = BUILD.importScale({ name: Q.t, method: Q.m, labels, instr: Q.ins, items, rows: out, src });
    toast(`تم تحويل ${n} رد إلى «ابنِ مقياسك»${dup ? ` (حُذف ${dup} مكرر)` : ''}${bad ? ` — ${bad} كود تالف` : ''}`);
  }
  VIEWS.qbuild = el => { view = el; el.classList.add('qb'); el.onclick = e => { if (e.target.closest('#qFull')) go('build'); }; labBuild(); };
  VIEWS.take = (el, code) => { view = el; el.classList.add('qb'); renderTake(code || ''); };
  return { reset: () => { B.m = null; B.res = null; } };
})();

/* ===== Thesis tools for a collected scale (Scales Lab, builder step 9).
   1) Careless responding: long-string, intra-individual response variability (IRV), Mahalanobis D² (Meade & Craig, 2012;
      Curran, 2016), and the effect of excluding flagged cases on reliability.
   2) Total omega from a one-factor solution (McDonald, 1999) next to alpha.
   3) Norms: percentile ranks and normalised T scores for every observed raw score.
   4) Redundant items: high zero-order and partial correlations together (a simplified screen inspired by Unique Variable
      Analysis, Christensen, Garrido & Golino, 2023).
   5) Short form by ant colony optimisation (Leite, Huang & Marcoulides, 2008): maximises reliability, the correlation with
      the full score and facet coverage at the same time.
   6) An Arabic, APA-style Word report of the psychometric results. ===== */
var THESIS = (function () {
  var f = function (x, d) { return x == null || !isFinite(x) ? '—' : (+x).toFixed(d == null ? 2 : d); };
  var H = function (s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  function alphaOf(rows) { try { return PSY.itemStats(rows).alpha; } catch (e) { return NaN; } }
  function sub(rows, idx) { return rows.map(function (r) { return idx.map(function (j) { return r[j]; }); }); }
  /* ---------- 1) careless responding ---------- */
  function careless(rows) {
    var n = rows.length, k = rows[0].length, R = PSY.corrMatrix(rows), means = [], sds = [];
    for (var j = 0; j < k; j++) { var c = PSY.col(rows, j); means.push(PSY.mean(c)); sds.push(PSY.sd(c) || 1); }
    var Ri = null; try { Ri = PSY.inverse(R); } catch (e) { }
    var out = rows.map(function (r, i) {
      var ls = 1, run = 1; for (var j = 1; j < k; j++) { if (r[j] === r[j - 1]) { run++; ls = Math.max(ls, run); } else run = 1; }
      var irv = PSY.sd(r), d2 = NaN;
      if (Ri && n > k + 2) { var z = r.map(function (v, j) { return (v - means[j]) / sds[j]; }); d2 = 0; for (var a = 0; a < k; a++) for (var b = 0; b < k; b++) d2 += z[a] * Ri[a][b] * z[b]; }
      var p = isFinite(d2) ? PSY.chiP(d2, k) : NaN;
      var why = []; if (ls >= Math.max(6, Math.ceil(k * 0.8))) why.push('سلسلة إجابات متطابقة (' + ls + ')'); if (irv === 0) why.push('تباين صفري'); if (p < 0.001) why.push('مسافة ماهالانوبس متطرفة');
      return { i: i, ls: ls, irv: irv, d2: d2, p: p, why: why };
    });
    var bad = out.filter(function (x) { return x.why.length; }), keep = rows.filter(function (_, i) { return !out[i].why.length; });
    return { all: out, bad: bad, aBefore: alphaOf(rows), aAfter: keep.length > k ? alphaOf(keep) : NaN, nAfter: keep.length };
  }
  /* ---------- 2) omega total ---------- */
  function omegaTotal(rows) { try { if (rows[0].length < 3 || rows.length <= rows[0].length) return null; var e = PSY.efa(rows, 1); return PSY.omega(e.loadings.map(function (l) { return Math.abs(l[0]); })); } catch (e) { return null; } }
  /* ---------- 3) norms ---------- */
  function norms(tot) {
    var n = tot.length, s = tot.slice().sort(function (a, b) { return a - b; }), vals = Array.from(new Set(s));
    var inv = function (p) { var a = [-39.69683028665376, 220.9460984245205, -275.9285104469687, 138.357751867269, -30.66479806614716, 2.506628277459239], b = [-54.47609879822406, 161.5858368580409, -155.6989798598866, 66.80131188771972, -13.28068155288572], c = [-0.007784894002430293, -0.3223964580411365, -2.400758277161838, -2.549732539343734, 4.374664141464968, 2.938163982698783], d = [0.007784695709041462, 0.3224671290700398, 2.445134137142996, 3.754408661907416], q, r; if (p < 0.02425) { q = Math.sqrt(-2 * Math.log(p)); return (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1); } if (p > 1 - 0.02425) { q = Math.sqrt(-2 * Math.log(1 - p)); return -(((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1); } q = p - 0.5; r = q * q; return (((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q / (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1); };
    return vals.map(function (v) { var below = s.filter(function (x) { return x < v; }).length, eq = s.filter(function (x) { return x === v; }).length, pr = (below + eq / 2) / n; return { raw: v, pr: pr * 100, T: 50 + 10 * inv(Math.min(0.999, Math.max(0.001, pr))), n: eq }; });
  }
  /* ---------- 4) redundancy ---------- */
  function redundancy(rows, items) {
    var k = rows[0].length, R = PSY.corrMatrix(rows), P = null, out = []; try { P = PSY.inverse(R); } catch (e) { }
    for (var a = 0; a < k; a++) for (var b = a + 1; b < k; b++) { var r = R[a][b], pr = P ? -P[a][b] / Math.sqrt(P[a][a] * P[b][b]) : NaN; if (r >= 0.6 && (pr >= 0.4 || !isFinite(pr)) || r >= 0.8) out.push({ a: a, b: b, r: r, pr: pr }); }
    return out.sort(function (x, y) { return y.r - x.r; });
  }
  /* ---------- 5) short form by ant colony optimisation ---------- */
  function shortForm(rows, items, K) {
    var k = rows[0].length; K = Math.max(3, Math.min(k - 1, K)); var full = PSY.rowSums(rows), tau = items.map(function () { return 1; }), dims = items.map(function (it) { return it.dim || '_'; }), D = Array.from(new Set(dims));
    function score(idx) { var S = sub(rows, idx), a = alphaOf(S), r = PSY.pearson(PSY.rowSums(S), full), cov = D.filter(function (d) { return idx.some(function (j) { return dims[j] === d; }); }).length / D.length; if (!isFinite(a)) return -1; return 0.45 * a + 0.4 * r + 0.15 * cov; }
    var best = null, bestS = -Infinity, ANTS = 24, IT = 50;
    for (var it = 0; it < IT; it++) {
      var gen = [];
      for (var an = 0; an < ANTS; an++) { var pool = tau.map(function (t, j) { return [j, t]; }), pick = []; while (pick.length < K) { var tot = pool.reduce(function (s, x) { return s + x[1]; }, 0), r = Math.random() * tot, acc = 0, q = 0; for (; q < pool.length; q++) { acc += pool[q][1]; if (acc >= r) break; } q = Math.min(q, pool.length - 1); pick.push(pool[q][0]); pool.splice(q, 1); } pick.sort(function (a, b) { return a - b; }); var sc = score(pick); gen.push([pick, sc]); if (sc > bestS) { bestS = sc; best = pick; } }
      gen.sort(function (a, b) { return b[1] - a[1]; }); tau = tau.map(function (t) { return Math.max(0.05, t * 0.85); }); gen.slice(0, 4).forEach(function (g) { g[0].forEach(function (j) { tau[j] += g[1]; }); });
    }
    var S = sub(rows, best); return { idx: best, alpha: alphaOf(S), r: PSY.pearson(PSY.rowSums(S), full), aFull: alphaOf(rows), K: K };
  }
  /* ---------- UI ---------- */
  function panel(s, A) {
    if (!A || !A.rows || A.rows.length < 10 || A.items.length < 3) return '<details class="steps"><summary>أدوات الرسالة</summary><p class="muted small">تحتاج 10 استجابات مكتملة و3 عبارات على الأقل.</p></details>';
    return '<details class="steps" id="thBox"><summary>أدوات الرسالة: الاستجابات المتهاونة، وأوميجا، والمعايير، والتكرار، والصورة المختصرة، وتقرير Word</summary><div id="thOut" class="stack" style="margin-top:10px"><p class="muted small">افتح القسم لحساب النتائج.</p></div></details>';
  }
  function compute(s, A) {
    var rows = A.rows, items = A.items, k = items.length, C = careless(rows), om = omegaTotal(rows), tot = PSY.rowSums(rows), NR = norms(tot), RD = redundancy(rows, items), SF = shortForm(rows, items, Math.ceil(k / 2));
    return { C: C, om: om, NR: NR, RD: RD, SF: SF, n: rows.length, k: k };
  }
  function html(s, A, X) {
    var items = A.items, t = function (i) { return (i + 1) + '. ' + H(items[i].text || items[i].t || ''); };
    var h = '<h4 style="margin:0">1) الاستجابات العشوائية والمتهاونة</h4>' +
      (X.C.bad.length ? tableHTML(['المستجيب', 'أطول سلسلة متطابقة', 'التباين الفردي', 'D² (p)', 'السبب'], X.C.bad.slice(0, 40).map(function (b) { return [String(b.i + 1), String(b.ls), f(b.irv), f(b.d2, 1) + ' (' + (b.p < 0.001 ? '<.001' : f(b.p, 3)) + ')', H(b.why.join('، '))]; })) : '<div class="notice good small">لا توجد استجابات مشتبه بها وفق المؤشرات الثلاثة.</div>') +
      '<p class="small" style="margin:0">ألفا قبل الاستبعاد = ' + f(X.C.aBefore, 3) + ' (ن = ' + X.n + ')، وبعد استبعاد ' + X.C.bad.length + ' حالة = ' + f(X.C.aAfter, 3) + ' (ن = ' + X.C.nAfter + '). لا تحذف آليًا: راجع كل حالة، واذكر المعيار في الرسالة.</p>' +
      '<h4 style="margin:0">2) أوميجا الكلي</h4><p class="small" style="margin:0">ω = ' + f(X.om ? X.om.omega : NaN, 3) + ' مقابل α = ' + f(X.C.aBefore, 3) + '. أوميجا لا تفترض تساوي التشبعات (التكافؤ التاوي) كما تفترضها ألفا، ولذلك يوصى بتقريرهما معًا (McDonald, 1999؛ Dunn et al., 2014).</p>' +
      '<h4 style="margin:0">3) جدول المعايير (الدرجة الكلية)</h4>' + tableHTML(['الدرجة الخام', 'عدد الأفراد', 'الرتبة المئينية', 'الدرجة التائية المعدلة'], X.NR.map(function (r) { return [f(r.raw, 0), String(r.n), f(r.pr, 1), f(r.T, 0)]; })) + '<p class="muted small" style="margin:0">معايير مؤقتة من عينتك فقط. المعايير الحقيقية تحتاج عينة ممثلة وكبيرة (عادة 500 فأكثر) ومقسمة حسب السن والنوع.</p>' +
      '<h4 style="margin:0">4) عبارات قد تكون مكررة</h4>' + (X.RD.length ? tableHTML(['العبارة الأولى', 'العبارة الثانية', 'r', 'r الجزئي'], X.RD.slice(0, 15).map(function (d) { return [t(d.a), t(d.b), f(d.r, 2), f(d.pr, 2)]; })) + '<p class="muted small" style="margin:0">ارتباط مرتفع مع ارتباط جزئي مرتفع يعني غالبًا أن العبارتين تقولان الشيء نفسه بصياغتين، فيرتفع الثبات بشكل زائف. احتفظ بالأوضح منهما.</p>' : '<div class="notice good small">لا توجد أزواج عبارات مكررة واضحة.</div>') +
      '<h4 style="margin:0">5) الصورة المختصرة (خوارزمية مستعمرة النمل)</h4><p class="small" style="margin:0">أفضل ' + X.SF.K + ' عبارات: ' + X.SF.idx.map(function (j) { return j + 1; }).join('، ') + '. ألفا المختصرة = ' + f(X.SF.alpha, 3) + ' (الكاملة ' + f(X.SF.aFull, 3) + ')، والارتباط بالدرجة الكاملة r = ' + f(X.SF.r, 3) + '.</p><p class="muted small" style="margin:0">الخوارزمية بتوازن الثبات والارتباط بالصورة الكاملة وتغطية الأبعاد. لازم تتأكد من الصورة المختصرة على عينة مستقلة، لأن اختيارها من نفس البيانات بيرفع النتايج بشكل متفائل.</p>' +
      '<div class="row"><button class="btn sm" id="thDoc">' + ic('download') + ' تقرير الخصائص السيكومترية (Word)</button><button class="btn sm ghost" id="thRe">أعد الحساب</button></div>';
    return h;
  }
  function report(s, A, X) {
    var items = A.items, st = PSY.itemStats(A.rows);
    var rows = items.map(function (it, j) { return '<tr><td>' + (j + 1) + '</td><td>' + H(it.text || '') + '</td><td>' + f(st.im ? st.im[j] : NaN) + '</td><td>' + f(st.isd ? st.isd[j] : NaN) + '</td><td>' + f(st.rit ? st.rit[j] : NaN) + '</td><td>' + f(st.aid ? st.aid[j] : NaN, 3) + '</td></tr>'; }).join('');
    var dims = (A.dims || []).filter(function (d) { return d.st; }).map(function (d) { return '<tr><td>' + H(d.d.name) + '</td><td>' + d.n + '</td><td>' + f(d.st.alpha, 3) + '</td><td>' + f(d.omega ? d.omega.omega : NaN, 3) + '</td></tr>'; }).join('');
    var doc = '<html dir="rtl" lang="ar"><head><meta charset="utf-8"><title>الخصائص السيكومترية</title><style>body{font-family:"Simplified Arabic","Traditional Arabic",Arial;font-size:14pt;line-height:1.8}h1{font-size:18pt;text-align:center}h2{font-size:15pt}table{border-collapse:collapse;width:100%;margin:8pt 0}td,th{border:1px solid #000;padding:4pt;font-size:12pt}caption{font-weight:bold;text-align:right;padding:4pt 0}</style></head><body>' +
      '<h1>الخصائص السيكومترية لمقياس «' + H(s.name || 'المقياس') + '»</h1>' +
      '<h2>أولًا: العينة</h2><p>طُبق المقياس على عينة استطلاعية قوامها (' + A.n + ') مستجيبًا. وفُحصت الاستجابات العشوائية والمتهاونة بثلاثة مؤشرات: أطول سلسلة إجابات متطابقة، والتباين الفردي في الاستجابة، ومسافة ماهالانوبس (Meade & Craig, 2012)، فتبيّن وجود (' + X.C.bad.length + ') حالة مشتبه بها.</p>' +
      '<h2>ثانيًا: وصف المقياس</h2><p>يتكون المقياس في صورته الحالية من (' + items.length + ') عبارة' + ((s.dims || []).length ? ' موزعة على (' + s.dims.length + ') أبعاد هي: ' + s.dims.map(function (d) { return H(d.name); }).join('، ') : '') + '.</p>' +
      '<h2>ثالثًا: الاتساق الداخلي وتحليل العبارات</h2><table><caption>جدول (1): المتوسطات والانحرافات المعيارية ومعاملات ارتباط العبارة بالدرجة الكلية المصححة وألفا عند حذف العبارة</caption><tr><th>م</th><th>العبارة</th><th>م</th><th>ع</th><th>ر المصحح</th><th>α عند الحذف</th></tr>' + rows + '</table>' +
      '<h2>رابعًا: الثبات</h2><p>بلغ معامل ألفا كرونباخ للمقياس الكلي (' + f(X.C.aBefore, 3) + ')، ومعامل أوميجا ماكدونالد (' + f(X.om ? X.om.omega : NaN, 3) + ')' + (A.split ? '، ومعامل التجزئة النصفية بمعادلة سبيرمان–براون (' + f(A.split.sb, 3) + ')' : '') + '. ويُعد أوميجا أدق من ألفا لأنه لا يفترض تساوي تشبعات العبارات (Dunn, Baguley & Brunsden, 2014).</p>' + (dims ? '<table><caption>جدول (2): ثبات الأبعاد</caption><tr><th>البعد</th><th>العبارات</th><th>α</th><th>ω</th></tr>' + dims + '</table>' : '') +
      '<h2>خامسًا: الصورة المختصرة</h2><p>باستخدام خوارزمية مستعمرة النمل (Leite et al., 2008) اختيرت (' + X.SF.K + ') عبارات هي: ' + X.SF.idx.map(function (j) { return j + 1; }).join('، ') + '، وبلغ ثباتها (' + f(X.SF.alpha, 3) + ') وارتباطها بالصورة الكاملة (' + f(X.SF.r, 3) + '). وتحتاج إلى تأكيد على عينة مستقلة.</p>' +
      '<h2>سادسًا: المعايير المؤقتة</h2><table><caption>جدول (3): الدرجات الخام والرتب المئينية والدرجات التائية المعدلة</caption><tr><th>الدرجة الخام</th><th>الرتبة المئينية</th><th>الدرجة التائية</th></tr>' + X.NR.map(function (r) { return '<tr><td>' + f(r.raw, 0) + '</td><td>' + f(r.pr, 1) + '</td><td>' + f(r.T, 0) + '</td></tr>'; }).join('') + '</table>' +
      '<p style="font-size:11pt">ملاحظة: أُعدّ هذا التقرير آليًا في مختبر المقاييس النفسية كمسودة، ويجب مراجعة الأرقام والصياغة، واستكمال أدلة الصدق (التحليل العاملي التوكيدي، والصدق التقاربي والتمييزي) قبل اعتماده في الرسالة.</p>' +
      '<h2>المراجع</h2><p dir="ltr" style="text-align:left;font-size:11pt">Dunn, T. J., Baguley, T., & Brunsden, V. (2014). From alpha to omega. British Journal of Psychology, 105(3), 399–412.<br>Leite, W. L., Huang, I.-C., & Marcoulides, G. A. (2008). Item selection for the development of short forms of scales using an ant colony optimization algorithm. Multivariate Behavioral Research, 43(3), 411–431.<br>McDonald, R. P. (1999). Test theory: A unified treatment. Erlbaum.<br>Meade, A. W., & Craig, S. B. (2012). Identifying careless responses in survey data. Psychological Methods, 17(3), 437–455.</p></body></html>';
    downloadFile('psychometric-report.doc', doc, 'application/msword');
  }
  function bind(el, s, A) {
    var box = el.querySelector('#thBox'); if (!box) return; var X = null;
    var run = function () { var o = el.querySelector('#thOut'); o.innerHTML = '<p class="muted small">جارٍ الحساب…</p>'; setTimeout(function () { try { X = compute(s, A); o.innerHTML = html(s, A, X); o.querySelector('#thDoc').onclick = function () { report(s, A, X); }; o.querySelector('#thRe').onclick = run; } catch (e) { o.innerHTML = '<div class="notice bad small">تعذر الحساب: ' + H(e.message) + '</div>'; } }, 30); };
    box.addEventListener('toggle', function () { if (box.open && !X) run(); });
  }
  return { panel: panel, bind: bind, careless: careless, norms: norms, redundancy: redundancy, shortForm: shortForm, omegaTotal: omegaTotal };
})();
