/* From recorded cases to a research project draft: an ethics gate, single-case indices computed from the recorded
   series, a project written into the hub's project list, an item pool for the psychometrics lab, a long-format
   export for the statistics lab, a literature search link and an implications worksheet. Research copies carry
   codes only. */
(function () {
  'use strict';
  var made = null;
  window.HubCasesResearch = function (A) {
    if (made) return made;
    var H = A.H, esc = H.esc, $ = H.$, $$ = H.$$, K = A.K, sc = A.sc, DRAFT = 'مسودة: راجعها مع مشرفك';
    var GATE = [
      ['consent', 'معايا موافقة كتابية من ولي الأمر على استخدام بيانات الطفل في البحث. دي موافقة منفصلة عن موافقته على الخدمة نفسها.'],
      ['irb', 'معايا موافقة لجنة أخلاقيات البحث (أو قدّمت الطلب ومش هنشر ولا هجمع بيانات بحثية قبل الموافقة).'],
      ['deid', 'النسخة البحثية من غير أي بيانات تعريفية: كود بس، من غير اسم دلع ولا نص الرواية ولا اسم مدرسة أو مكان.'],
      ['resp', 'فاهم إن المنصة ما تقدرش تتأكد من أي حاجة من دول، وإن المسؤولية عليّ أنا.']
    ];
    var DESIGNS = [
      ['AB', 'خط قاعدي ثم تدخّل (AB)', 'مرحلتين ورا بعض. أبسط تصميم وأضعفهم: بيوصف تغيّر، ومايثبتش إن التدخّل هو السبب.'],
      ['ABAB', 'السحب والإرجاع (ABAB)', 'بعد التدخّل نرجع للخط القاعدي ثم ندخّل تاني. لو السلوك اتغيّر مع كل دخول وخروج، الدليل أقوى. مايتعملش لو سحب التدخّل هيأذي الطفل أو لو المهارة مش بترجع.'],
      ['MBL', 'الخطوط القاعدية المتعددة', 'نفس التدخّل بيبدأ في أوقات مختلفة عند أكتر من طفل أو سلوك أو مكان. لو كل خط اتغيّر بس لما التدخّل وصله، الدليل أقوى ومن غير سحب.'],
      ['CC', 'المحك المتغيّر', 'الهدف بيتحط على درجات بتعلى بالتدريج، والسلوك بيتبع كل محك جديد. مناسب للمهارات اللي بتتبني خطوة خطوة.']
    ];
    var BANDS = {
      pnd: 'تفسير متعارف عليه (Scruggs و Mastropieri): فوق 90% أثر كبير، 70 لـ90% أثر واضح، 50 لـ70% مشكوك فيه، أقل من 50% مفيش أثر واضح. نقطة واحدة شاذة في الخط القاعدي ممكن تنزّله للصفر.',
      nap: 'تفسير متعارف عليه (Parker و Vannest، 2009): لحد 0.65 ضعيف، 0.66 لـ0.92 متوسط، 0.93 لـ1 كبير. 0.5 معناها مفيش فرق.',
      tau: 'تفسير متعارف عليه (Vannest و Ninci، 2015): لحد 0.20 صغير، 0.20 لـ0.60 متوسط، 0.60 لـ0.80 كبير، فوق 0.80 كبير جدًا. بالمقام ده القيمة ممكن تعدّي 1.'
    };
    var ITEMS = {
      inatt: ['بيبص بعيد عن المهمة أثناء الشرح'], hyper: ['بيقوم من مكانه من غير إذن'], impuls: ['بيقاطع غيره قبل ما يخلّص كلامه', 'بيجاوب قبل ما السؤال يخلص'], forget: ['بينسى أدواته اللي محتاجها للحصة'], unfinished: ['بيسيب المهمة قبل ما تخلص'],
      read: ['بيغلط في قراية كلمات من مستوى صفه'], write: ['بيغلط في كتابة كلمات اتعلّمها'], math: ['بيغلط في مسائل جمع وطرح من مستوى صفه'], taskrefuse: ['بيرفض يبدأ المهمة المطلوبة'],
      speechlate: ['بيستخدم جمل أقصر من زمايله'], stutter: ['بيكرر أول صوت في الكلمة'], artic: ['بينطق بعض الحروف بشكل مش واضح'], noresp: ['ما بيردّش لما حد ينادي اسمه من أول مرة'], understand: ['بيطلب إعادة التعليمات'],
      fear: ['بيقول إنه خايف من موقف معيّن'], cry: ['بيعيّط أثناء اليوم الدراسي'], sad: ['بيرفض يشارك في لعب كان بيحبه'], sep: ['بيمسك في ولي أمره وقت الانفصال'], schoolrefuse: ['بيرفض ينزل للمدرسة'],
      withdraw: ['بيقعد لوحده في الفسحة'], nofriends: ['ما بيبدأش لعب مع زمايله'], eyecontact: ['ما بيبصّش للي بيكلمه'],
      tantrum: ['بيصرخ لما طلبه يترفض'], aggress: ['بيضرب طفل تاني'], defy: ['بيرفض ينفّذ تعليمات مباشرة'], lie: ['بيحكي حاجة مختلفة عن اللي حصل'], steal: ['بياخد حاجة مش بتاعته من غير إذن'], breaks: ['بيرمي أو بيكسر حاجات'],
      noise: ['بيسد ودانه من الأصوات العالية'], tics: ['بيعمل حركة سريعة متكررة في الوش أو الكتف'], repet: ['بيكرر حركة بجسمه أو إيديه'], clumsy: ['بيمسك القلم بطريقة بتتعبه'],
      stomach: ['بيشتكي من وجع بطن'], headache: ['بيشتكي من صداع'], vomit: ['بيرجّع قبل النزول للمدرسة'], tired: ['بينام أثناء الحصة'],
      sleepprob: ['بياخد أكتر من نص ساعة علشان ينام'], nightmare: ['بيصحى مفزوع بالليل'], bedwet: ['بيبل سريره بالليل'], eatless: ['بيسيب أغلب أكله']
    };
    var EN = { att: 'attention hyperactivity classroom intervention', lrn: 'reading difficulty intervention primary school', lang: 'childhood stuttering speech language intervention', emo: 'child anxiety school refusal intervention', soc: 'social skills intervention children', cond: 'challenging behavior function-based intervention', sens: 'tics sensory behavior children intervention', som: 'functional abdominal pain school anxiety children', slp: 'sleep problems children behavioral intervention' };

    function R() { var d = A.D(); if (!Array.isArray(d.research)) d.research = []; return d.research; }
    function rec(ids) { var key = ids.slice().sort().join('+'), r = R().filter(function (x) { return x.key === key; })[0]; if (!r) { r = { id: H.uid(), key: key, cases: ids.slice(), date: H.today(), gate: null, summary: '', impl: {}, projectId: '' }; R().push(r); } return r; }
    /* Every recorded series of a case that has both phases. */
    function seriesOf(c) {
      var out = [], ab = A.abSeries(c), P = window.HubCasesProgress ? window.HubCasesProgress(A) : null;
      if (ab.A.length || ab.B.length) out.push({ id: 'ab', l: 'العدّ اليومي للسلوك', how: 'عدّ مباشر يومي في فترة ملاحظة ثابتة', A: ab.A, B: ab.B, dir: c.abDir === 'up' ? 1 : -1, level: 'scale' });
      if (P) {
        var ss = P.sorted(c), ca = [], cb = [];
        ss.forEach(function (s) { if (s.cnt === '' || s.cnt == null) return; (s.ph === 'base' ? ca : cb).push(+s.cnt); });
        if (ca.length || cb.length) out.push({ id: 'cnt', l: 'عدّ السلوك الأسبوعي من الجلسات', how: 'عدّ أسبوعي من أوراق التسجيل', A: ca, B: cb, dir: -1, level: 'scale' });
        (c.goals || []).forEach(function (g, i) { var s = P.series(c, g.id); if (s.all.length) out.push({ id: 'g:' + g.id, l: 'الهدف ' + (i + 1) + ': ' + g.t, how: 'مقياس بلوغ الأهداف (من -2 لـ+2) بتقييم الأخصائي كل جلسة', A: s.A, B: s.B, dir: 1, level: 'ordinal', goal: g.t }); });
      }
      return out;
    }
    function usable(c) { return seriesOf(c).filter(function (s) { return s.A.length && s.B.length; }); }
    function fx(x, pct) { return x == null || isNaN(x) ? '—' : pct ? Math.round(x * 100) + '%' : String(A.r2(x)); }
    function indices(s) {
      var r = sc.all(s.A, s.B, s.dir), better = s.dir > 0 ? 'الأعلى أحسن' : 'الأقل أحسن';
      function row(id, name, a, b, mean) { return '<tr data-ix="' + id + '"><th scope="row">' + name + '</th><td class="num" dir="ltr">' + a + '</td><td class="num" dir="ltr">' + b + '</td><td>' + mean + '</td></tr>'; }
      function one(id, name, v, mean) { return '<tr data-ix="' + id + '"><th scope="row">' + name + '</th><td class="num" dir="ltr" colspan="2">' + v + '</td><td>' + mean + '</td></tr>'; }
      return '<div class="tablewrap"><table class="mcases-ix"><thead><tr><th scope="col">المؤشر</th><th scope="col">أ: خط قاعدي</th><th scope="col">ب: تدخّل</th><th scope="col">معناه</th></tr></thead><tbody>' +
        row('n', 'عدد النقط', r.nA, r.nB, 'أقل من 5 نقط في المرحلة بيخلّي كل اللي تحت ضعيف.') +
        row('mean', 'المستوى (المتوسط)', fx(r.meanA), fx(r.meanB), 'متوسط كل مرحلة. ' + better + '.') +
        row('median', 'المستوى (الوسيط)', fx(r.medA), fx(r.medB), 'أقل تأثرًا بالنقط الشاذة.') +
        row('slope', 'الاتجاه (الميل لكل جلسة)', fx(r.slopeA), fx(r.slopeB), 'ميل خط المربعات الصغرى. لو الخط القاعدي نفسه ماشي ناحية التحسن، الفرق بين المرحلتين مش كله من التدخّل.') +
        row('sd', 'التذبذب (الانحراف المعياري)', fx(r.sdA), fx(r.sdB), 'كل ما التذبذب أعلى، قراية الفرق أصعب.') +
        one('imm', 'فورية التغيّر', fx(r.imm), 'متوسط أول 3 نقط في «ب» ناقص متوسط آخر 3 نقط في «أ». تغيّر فوري وواضح بيقوّي الربط بالتدخّل.') +
        one('pnd', 'PND: نسبة النقط غير المتداخلة', fx(r.pnd, 1), 'نسبة نقط «ب» الأحسن من أحسن نقطة في «أ». ' + BANDS.pnd) +
        one('nap', 'NAP: عدم التداخل لكل الأزواج', fx(r.nap), 'من كل أزواج (نقطة من أ، نقطة من ب): نسبة الأزواج اللي «ب» فيها أحسن، والتعادل بنص. ' + BANDS.nap) +
        one('tau', 'Tau (أ مقابل ب)', fx(r.tau), '(أزواج التحسن ناقص أزواج التراجع) ÷ كل الأزواج.') +
        one('tauu', 'Tau-U بعد تصحيح اتجاه الخط القاعدي', fx(r.tauU), 'نفس Tau بعد طرح اتجاه الخط القاعدي (S = ' + r.sA + ') من البسط، والمقام عدد أزواج أ×ب (Parker وزملاؤه، 2011). ' + BANDS.tau) +
        '</tbody></table></div>';
    }
    var LIMITS = 'حدود لازم تتكتب في أي تقرير: السلاسل قصيرة، والقياسات المتتالية على نفس الطفل مرتبطة ببعضها (ارتباط ذاتي) فالمؤشرات دي وصفية ومفيهاش دلالة إحصائية هنا، وتصميم AB بيوصف ارتباط مش سببية. الإثبات محتاج تكرار: سحب وإرجاع، أو خطوط قاعدية متعددة، أو حالات تانية.';
    function fit(cases, sers) {
      if (cases.length > 1) { var lens = sers.map(function (s) { return s ? s.A.length : 0; }), diff = lens.some(function (l) { return l !== lens[0]; }); return diff ? ['MBL', 'الخطوط القاعدية عندك مختلفة الطول بين الحالات (' + lens.join('، ') + ' نقطة)، وده أقرب لخطوط قاعدية متعددة عبر المشاركين. اتأكد إن التدخّل بدأ عند كل حالة في وقت مختلف فعلًا، وإن ده كان مخطط له.'] : ['AB', 'الخطوط القاعدية كلها بنفس الطول (' + lens[0] + ')، فده أقرب لسلسلة حالات AB متكررة، مش خطوط قاعدية متعددة.']; }
      return ['AB', 'اللي اتسجّل فعلًا مرحلة خط قاعدي واحدة ثم مرحلة تدخّل واحدة، يعني AB. لو عايز دليل أقوى خطط من الأول لسحب وإرجاع أو لخطوط قاعدية متعددة عبر أهداف أو أماكن.'];
    }
    function behKeys(cases) { var seen = {}, out = []; cases.forEach(function (c) { c.chips.forEach(function (x) { if (x.c === 'beh' && x.k && x.src === 'auto' && !seen[x.k]) { seen[x.k] = 1; out.push(x); } }); }); return out; }
    function techsOf(cases) { var o = []; cases.forEach(function (c) { (c.sessions || []).forEach(function (s) { if (s.ph !== 'base') (s.techs || []).forEach(function (t) { if (o.indexOf(t) < 0) o.push(t); }); }); }); return o.map(function (t) { return A.label(K.TECHS, t); }); }
    function pool(cases) { var items = []; behKeys(cases).forEach(function (x) { (ITEMS[x.k] || []).forEach(function (t) { items.push({ n: items.length + 1, domain: A.label(K.DOMAINS, x.d), item: t }); }); }); return items; }
    function csv(rows) { return rows.map(function (r) { return r.map(function (v) { v = String(v); return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; }).join(','); }).join('\n'); }
    function longRows(cases, pick) {
      var rows = [['case', 'series', 'session', 'phase', 'value']];
      cases.forEach(function (c, i) { var list = pick ? [pick[i]].filter(Boolean) : seriesOf(c); list.forEach(function (s, j) { var sid = s.id.indexOf('g:') === 0 ? 'goal' + (j + 1) : s.id; s.A.concat(s.B).forEach(function (v, n) { rows.push(['C' + (i + 1), sid, n + 1, n < s.A.length ? 'A' : 'B', v]); }); }); });
      return rows;
    }
    function query(cases) {
      var tags = {}, doms = {}; cases.forEach(function (c) { c.chips.forEach(function (x) { (x.t || []).forEach(function (t) { tags[t] = 1; }); if (x.c === 'beh' && x.d) doms[x.d] = (doms[x.d] || 0) + 1; }); });
      var top = Object.keys(doms).sort(function (a, b) { return doms[b] - doms[a]; })[0];
      var q = tags.escape ? 'escape-maintained behavior intervention' : tags.attention ? 'attention-maintained behavior functional communication training' : EN[top] || 'child behavior intervention';
      return q + ' single-case';
    }
    /* Writes a project in the hub's own shape. Every text field is a draft built from codes and lexicon labels. */
    function makeProject(cases, sers, r) {
      var S = H.state(), beh = behKeys(cases).map(function (x) { return x.l; }), techs = techsOf(cases), f = fit(cases, sers), dz = A.byId(DESIGNS.map(function (d) { return { id: d[0], t: d[1] }; }), f[0]).t, multi = cases.length > 1;
      var goals = []; sers.forEach(function (s) { if (s && s.goal && goals.indexOf(s.goal) < 0) goals.push(s.goal); });
      var iv = techs.length ? techs.join('، ') : 'التدخّل (اكتب وصفه)', dvs = [];
      cases.forEach(function (c) { seriesOf(c).forEach(function (s) { var name = s.goal || s.l; if (!dvs.some(function (d) { return d.name === name; })) dvs.push({ name: name, role: 'dv', level: s.level, groups: '', tool: s.how }); }); });
      var codes = cases.map(function (c, i) { return 'ح' + (i + 1); }), ages = cases.map(function (c) { return c.intake.age; }).filter(Boolean);
      var p = { id: H.uid(), title: 'مسودة: أثر تدخّل سلوكي على ' + (beh[0] || 'السلوك المستهدف') + (multi ? ' (سلسلة حالات)' : ' (حالة واحدة)'), design: 'تجريبي (قياس قبلي وبعدي لنفس المجموعة)', paired: 'rel', created: H.today(), updated: H.today(), vars: [{ name: 'التدخّل: ' + iv, role: 'iv', level: 'nominal', groups: 2, tool: 'مرحلتين: خط قاعدي ثم تدخّل' }].concat(dvs.slice(0, 6)), d: {} };
      p.d.problem = DRAFT + '\n' + (multi ? cases.length + ' أطفال' : 'طفل') + ' في المرحلة الابتدائية ظهر عندهم: ' + (beh.join('، ') || '—') + '. المشكلة البحثية: هل التدخّل اللي اتطبّق ارتبط بتغيّر في السلوك ده مقارنةً بالخط القاعدي؟' + (r.summary ? '\nملخص من غير بيانات تعريفية: ' + r.summary : '');
      p.d.q = DRAFT + '\n' + dvs.slice(0, 6).map(function (d) { return 'هل «' + d.name + '» اتغيّر في مرحلة التدخّل عن الخط القاعدي؟'; }).join('\n') + '\nهل التغيّر كان فوري ومستمر؟';
      p.d.theory = DRAFT + '\nاكتب الإطار اللي بنيت عليه التدخّل (مثلًا: التقييم الوظيفي للسلوك، التعلّم بالملاحظة). راجع مكتبة النظريات.';
      p.d.lit = ''; p.d.gap = DRAFT + '\nفجوة محتملة لحد ما تراجع الأدبيات: قلة دراسات الحالة الواحدة المنشورة بالعربية عن التدخّل ده في السياق المدرسي المصري. دي جملة تتأكد منها بالبحث، مش حقيقة.';
      p.d.h = DRAFT + '\n' + dvs.slice(0, 6).map(function (d) { var up = d.level === 'ordinal'; return '«' + d.name + '» ' + (up ? 'يعلى' : 'يقل') + ' في مرحلة التدخّل عن الخط القاعدي.'; }).join('\n');
      p.d.dnote = DRAFT + '\nالتصميم الفعلي: تصميم حالة واحدة، ' + dz + '. ' + f[1] + '\nقائمة التصميمات في المنصة مفيهاش «حالة واحدة»، فاخترنا أقرب اختيار (قياسات متكررة على نفس الأفراد). ' + LIMITS;
      p.d.tools = DRAFT + '\n' + dvs.map(function (d) { return d.name + ': ' + d.tool + '.'; }).join('\n') + '\nمحتاج تضيف: اتفاق بين ملاحظين اتنين على جزء من الجلسات، ووصف إجرائي لكل سلوك.';
      p.d.perm = 'أدوات من إعداد الباحث (ملاحظة مباشرة ومقياس بلوغ أهداف).';
      p.d.pop = DRAFT + '\n' + (multi ? cases.length + ' حالات' : 'حالة واحدة') + ' بأكواد (' + codes.join('، ') + ')' + (ages.length ? '، السن: ' + ages.join('، ') + ' سنة' : '') + '. عينة قصدية من حالات متابعة فعلية. النتايج متتعممش على غيرهم.';
      p.d.n = String(cases.length);
      p.d.plan = DRAFT + '\nتحليل بصري للرسم (المستوى، الاتجاه، التذبذب، فورية التغيّر، التداخل) + مؤشرات عدم التداخل: PND و NAP و Tau-U مع تصحيح اتجاه الخط القاعدي. المؤشرات وصفية.' + (multi ? ' عبر الحالات: وصف كل حالة لوحدها، ولو الحالات 6 أو أكتر ممكن مقارنة متوسط المرحلتين باختبار ويلكوكسون للأزواج.' : '') + '\n' + LIMITS;
      p.d.irb = 'الأخصائي أقرّ يوم ' + r.gate.at + ' إن معاه موافقة اللجنة أو قدّم الطلب. اكتب اسم اللجنة ورقم الموافقة.';
      p.d.consent = DRAFT + '\nالأخصائي أقرّ يوم ' + r.gate.at + ' بوجود موافقة كتابية من ولي الأمر على الاستخدام البحثي (منفصلة عن موافقة الخدمة)، وإن البيانات بأكواد بس. المنصة ما اتأكدتش من ده. اكتب: مكان حفظ الموافقات، ومين له حق يشوف البيانات، وحق الانسحاب.';
      p.d.sup = ''; p.d.next = 'راجع المسودة دي مع المشرف قبل أي خطوة.';
      S.projects.unshift(p); r.projectId = p.id; H.save(); return p;
    }

    function pick() {
      var d = A.D(), err = '';
      function draw() {
        A.paint(A.crumb([['#cases', 'الحالات'], ['', 'ادرس مجموعة حالات']]) + '<header class="head"><h1>ادرس مجموعة حالات</h1><p class="lead">اختار حالتين أو أكتر فيهم خط قاعدي وبيانات تدخّل. هنتعامل معاهم كسلسلة حالات أو خطوط قاعدية متعددة.</p></header><form id="mcases-pickf" class="card form"><div class="mcases-pick">' + d.cases.map(function (c) { var ok = usable(c).length; return '<label><input type="checkbox" name="c" value="' + c.id + '"' + (ok ? '' : ' disabled') + '><span>' + esc(c.code) + ' <small class="muted">' + (ok ? ok + ' سلسلة جاهزة' : 'محتاج خط قاعدي وتدخّل') + '</small></span></label>'; }).join('') + '</div><p class="small err" role="alert">' + esc(err) + '</p><p class="form-end"><button class="btn primary" type="submit">كمّل</button></p></form>', { submit: function (f) {
          var ids = $$('input[name=c]:checked', f).map(function (x) { return x.value; }); if (ids.length < 2) { err = 'اختار حالتين على الأقل.'; draw(); return; } H.go('#cases/study/' + ids.join('.'));
        } });
      }
      draw();
    }
    function view(a, parts) {
      var ids = parts.filter(Boolean), cases = ids.map(A.getCase).filter(Boolean);
      if (a === 'study' && cases.length < 2) { pick(); return; }
      if (!cases.length) { H.go('#cases'); return; }
      var multi = cases.length > 1, r = rec(cases.map(function (c) { return c.id; })), err = '', sel = {};
      function chosen() { return cases.map(function (c) { var u = usable(c); return A.byId(u, sel[c.id]) || u[0] || null; }); }
      function draw() {
        var sers = chosen(), ready = sers.every(Boolean), back = multi ? ['#cases', 'الحالات'] : ['#cases/c/' + cases[0].id + '.file', cases[0].code];
        var h = A.crumb([back, ['', multi ? 'دراسة مجموعة حالات' : 'حوّلها لبحث']]) + '<header class="head"><h1 class="mega">من حالة لـ<em>بحث</em>.</h1><p class="lead">هنجهّز مسودة مشروع بحثي من اللي سجّلته، ونحسب مؤشرات الحالة الواحدة. كل حاجة مسودة تراجعها مع مشرفك.</p></header>';
        if (!ready) { A.paint(h + '<div class="card"><h2>لسه البيانات مش كفاية</h2><p>علشان الحالة تتحول لبحث محتاجين سلسلة واحدة على الأقل فيها نقط خط قاعدي ونقط تدخّل: عدّ يومي في خطة «خط قاعدي، تغيير صغير، وقياس تاني»، أو تقييم أهداف في جلسات متعلّمة «خط قاعدي» وجلسات «تدخّل».</p><p class="row">' + cases.map(function (c) { return '<a class="btn" href="#cases/c/' + c.id + '.sess">' + esc(c.code) + ': الجلسات</a>'; }).join('') + '</p></div>'); return; }
        if (!r.gate) {
          A.paint(h + '<form class="mcases-gate" id="mcases-gate"><h2>قبل أي حاجة: شروط أخلاقية</h2><p>تحويل سجلات متابعة لبيانات بحث له شروط. علّم على كل شرط متحقق عندك. من غيرهم مفيش نسخة بحثية.</p>' + GATE.map(function (g) { return '<label class="check" for="gate-' + g[0] + '"><input type="checkbox" id="gate-' + g[0] + '" name="gate" value="' + g[0] + '"><span>' + g[1] + '</span></label>'; }).join('') + '<p class="mcases-caveat">المنصة ما تقدرش تتحقق من الموافقات ولا من اللجنة. إحنا بنسجّل إنك علّمت على الشروط وتاريخ ده، والمسؤولية الأخلاقية والقانونية عليك.</p><p class="small err" role="alert" id="gate-err">' + esc(err) + '</p><p><button class="btn primary big" type="submit">أقرّ وأكمّل</button></p></form>', { submit: function (f) {
            var t = $$('input[name=gate]:checked', f).map(function (x) { return x.value; }); if (t.length < GATE.length) { err = 'لازم الأربع شروط كلهم. لو واحد ناقص، كمّله الأول وارجع.'; draw(); A.refocus('#gate-consent'); return; }
            r.gate = { at: H.today(), ticks: t }; err = ''; H.save(); draw();
          } });
          return;
        }
        var f = fit(cases, sers), items = pool(cases), q = query(cases), proj = r.projectId && H.state().projects.filter(function (p) { return p.id === r.projectId; })[0];
        h += '<p class="mcases-gated">' + H.ic('check') + 'أقرّيت بالشروط الأخلاقية يوم ' + A.fmtD(r.gate.at) + '. النسخة البحثية بأكواد بس.</p>';
        h += '<section class="mcases-sec"><div class="sec"><h2>تحليل الحالة الواحدة</h2></div>' + cases.map(function (c, i) {
          var u = usable(c), s = sers[i];
          return '<article class="mcases-rcase" data-case="' + (i + 1) + '"><h3>ح' + (i + 1) + (u.length > 1 ? '</h3><div class="fld mcases-link"><label for="ser-' + c.id + '">السلسلة</label><select id="ser-' + c.id + '" data-ser="' + c.id + '">' + u.map(function (x) { return '<option value="' + x.id + '"' + (x.id === s.id ? ' selected' : '') + '>' + esc(x.l) + '</option>'; }).join('') + '</select></div>' : ' · ' + esc(s.l) + '</h3>') + '<p class="small muted">' + esc(s.how) + ' · ' + (s.dir > 0 ? 'الأعلى أحسن' : 'الأقل أحسن') + '</p>' + A.phaseChart(s.A, s.B, { a: 'أ: خط قاعدي', b: 'ب: تدخّل', lo: s.level === 'ordinal' ? -2 : null, hi: s.level === 'ordinal' ? 2 : null, label: 'رسم المرحلتين للحالة ح' + (i + 1) }) + indices(s) + '</article>';
        }).join('') + '<p class="mcases-caveat">' + LIMITS + '</p></section>';
        h += '<section class="mcases-sec"><div class="sec"><h2>التصميم</h2></div><ul class="mcases-dz">' + DESIGNS.map(function (d) { return '<li class="' + (d[0] === f[0] ? 'fit' : '') + '"><h3>' + d[1] + (d[0] === f[0] ? ' <span class="mcases-draft">الأقرب للي اتسجّل</span>' : '') + '</h3><p>' + d[2] + '</p></li>'; }).join('') + '</ul><p>' + esc(f[1]) + '</p></section>';
        h += '<section class="mcases-sec card form"><h2>مشروع البحث <span class="mcases-draft">' + DRAFT + '</span></h2><div class="fld"><label for="rs-sum">ملخص من غير بيانات تعريفية (اختياري)<span class="hint">اكتبه من جديد بإيدك. الرواية الأصلية مش هتتنقل.</span></label><textarea id="rs-sum">' + esc(r.summary || '') + '</textarea></div>' + (proj ? '<p>المشروع اتعمل: <b>' + esc(proj.title) + '</b></p><p class="row"><a class="btn primary" href="#project/' + proj.id + '">افتح المشروع</a></p>' : '<p class="small muted">هيتعمل مشروع في «مشاريعي البحثية» فيه: المشكلة والأسئلة، المتغيرات (التدخّل وكل مقياس)، الفروض، وصف العينة بالأكواد، وخطة التحليل. كله مسودة.</p><p class="row"><button class="btn primary big" type="button" data-act="make">أنشئ مشروع البحث</button></p>') + '</section>';
        h += '<section class="mcases-sec"><div class="sec"><h2>إيه المقياس اللي محتاجه؟</h2></div><p>دي مسودة بنك عبارات لقائمة ملاحظة، من السلوكيات اللي اتسجّلت: عبارة لكل سلوك واحد يتشاف، ومفيش عبارة فيها سلوكين. التقدير المقترح: 0 أبدًا، 1 أحيانًا، 2 كتير، 3 دايمًا، خلال أسبوع الملاحظة.</p>' + (items.length ? '<ol class="mcases-items">' + items.map(function (x) { return '<li><span>' + esc(x.item) + '</span><small>' + esc(x.domain) + '</small></li>'; }).join('') + '</ol><p class="row"><button class="btn" type="button" data-act="items-copy">انسخ العبارات (سطر لكل عبارة)</button><button class="btn" type="button" data-act="items-csv">' + H.ic('download') + 'CSV</button><button class="btn" type="button" data-act="items-json">' + H.ic('download') + 'JSON</button><a class="btn primary" href="' + esc(H.labs.scales) + '" target="_blank" rel="noopener">افتح معمل القياس النفسي</a></p><p class="small muted">في المعمل: «ابنِ مقياسك» ثم «مقياس جديد»، وفي خطوة العبارات افتح «إضافة عبارات كثيرة دفعة واحدة» والصق العبارات. المعمل مفيهوش استيراد ملفات، فالنسخ واللصق هو الطريق. بعدها: صدق المحتوى بالمحكّمين، ثم تجريب وتحليل العبارات، ثم الثبات. العبارات دي مسودة مش مقياس.</p>' : '<p class="muted">مفيش سلوكيات من القاموس متسجّلة في الحالات دي.</p>') + '</section>';
        h += '<section class="mcases-sec"><div class="sec"><h2>التحليل الإحصائي</h2></div><p>' + (multi ? 'لكل حالة لوحدها استخدم المؤشرات اللي فوق. عبر الحالات: لو عندك 6 حالات أو أكتر، قارن متوسط الخط القاعدي بمتوسط التدخّل لكل حالة باختبار ويلكوكسون للأزواج (قياسات مرتبطة وعينة صغيرة). أقل من كده يبقى وصف بس.' : 'حالة واحدة تحليلها بصري ومؤشرات عدم تداخل، مش اختبارات مجموعات.') + ' مرشد الاختبار في صفحة المشروع بيقترح حسب المتغيرات اللي هتراجعها هناك.</p><p class="row"><button class="btn" type="button" data-act="long-csv">' + H.ic('download') + 'البيانات بصيغة طويلة (CSV)</button><a class="btn" href="' + esc(H.labs.stats) + '" target="_blank" rel="noopener">افتح معمل الإحصاء</a></p><p class="small muted">الملف فيه: كود الحالة، السلسلة، رقم الجلسة، المرحلة، القيمة. من غير أسماء ولا تواريخ.</p></section>';
        h += '<section class="mcases-sec"><div class="sec"><h2>الفجوات</h2></div><p>دوّر في الأدبيات بالكلمات دي: <bdi dir="ltr" class="mcases-q-en">' + esc(q) + '</bdi></p><p class="row"><a class="btn" href="#explore/search/' + encodeURIComponent(q) + '">دوّر في مستكشف الأدبيات</a></p><p class="small muted">قلة النتايج في قاعدة بيانات واحدة مش دليل على فجوة: جرّب مرادفات وقواعد تانية وبالعربي قبل ما تكتب «لم تُدرس».</p></section>';
        h += '<section class="mcases-sec card form mcases-impl"><h2>المترتب عليه</h2><p class="small muted">دي ورقة تملاها إنت. الأداة مش بتكتب استنتاجات.</p>' + [['practice', 'للممارسة: إيه اللي هتعمله بشكل مختلف؟'], ['family', 'للأهل والمدرّسين'], ['training', 'للتدريب وإعداد الأخصائيين'], ['future', 'لبحوث جاية'], ['limits', 'حدود الدراسة'], ['change', 'إيه اللي لو لقيته يغيّر استنتاجك؟']].map(function (x) { return '<div class="fld"><label for="im-' + x[0] + '">' + x[1] + '</label><textarea id="im-' + x[0] + '" data-impl="' + x[0] + '">' + esc((r.impl || {})[x[0]] || '') + '</textarea></div>'; }).join('') + '</section>';
        A.paint(h, { click: function (act) {
          if (act === 'make') { var p = makeProject(cases, sers, r); H.toast('اتعمل المشروع'); H.go('#project/' + p.id); }
          if (act === 'items-csv') A.download('item-pool.csv', '﻿' + csv([['n', 'domain', 'item']].concat(items.map(function (x) { return [x.n, x.domain, x.item]; }))), 'text/csv');
          if (act === 'items-json') A.download('item-pool.json', JSON.stringify({ v: 1, t: 'item-pool', scale: '0-3 frequency', items: items }, null, 1), 'application/json');
          if (act === 'items-copy') { var t = items.map(function (x) { return x.item; }).join('\n'); A.lastCopy = t; if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(t).then(function () { H.toast('اتنسخت العبارات'); }, function () { H.toast('مقدرناش ننسخ. نزّل الملف بدلها.'); }); else H.toast('المتصفح ده مش بيسمح بالنسخ. نزّل الملف بدلها.'); }
          if (act === 'long-csv') A.download('series-long.csv', csv(longRows(cases, multi ? sers : null)), 'text/csv');
        }, change: function (el) {
          if (el.id === 'rs-sum') { r.summary = el.value.trim(); H.save(); }
          var im = el.getAttribute('data-impl'); if (im) { r.impl = r.impl || {}; r.impl[im] = el.value; H.save(); H.toast('اتحفظ'); }
          var sr = el.getAttribute('data-ser'); if (sr) { sel[sr] = el.value; draw(); }
        } });
      }
      draw();
    }
    made = { view: view, seriesOf: seriesOf, usable: usable, pool: pool, query: query, longRows: longRows, fit: fit };
    return made;
  };
})();
