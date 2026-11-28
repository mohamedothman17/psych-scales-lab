/* Children's play activities: developmental play and observation tasks, not standardised tests.
   Routes: #kids (picker) · #kids/about · #kids/<child> (journey) · #kids/<child>/<activity> (play)
           #kids/<child>/parent · #kids/<child>/spec · #kids/<child>/plan
   Test flags in the page query: ?kseed=<int> fixes the random sequence, ?kfast=<0..1> scales every delay. */
(function () {
  'use strict';
  var H = window.Hub, esc = H.esc, $ = H.$, $$ = H.$$;
  var Q = {}; location.search.replace(/[?&]([^=&]+)=([^&]*)/g, function (_, k, v) { Q[k] = decodeURIComponent(v); });
  var SEED = Q.kseed != null ? (parseInt(Q.kseed, 10) || 1) : null, SPEED = Q.kfast != null ? Math.max(0, Math.min(1, +Q.kfast || 0)) : 1;

  /* ---------- core: random numbers, staircase, generators (pure, exposed for tests) ---------- */
  function makeRng(seed) { var a = seed >>> 0; return function () { a = (a + 0x6D2B79F5) >>> 0; var t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  function rint(r, n) { return Math.floor(r() * n); }
  function shuffle(r, arr) { var a = arr.slice(); for (var i = a.length - 1; i > 0; i--) { var j = rint(r, i + 1), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function sample(r, n, k) { var a = []; for (var i = 0; i < n; i++) a.push(i); return shuffle(r, a).slice(0, k); }

  /* Staircase: one level up after a success; one level down after two misses in a row. `best` is the highest level passed. */
  function Stair(start, min, max) { this.level = start; this.min = min; this.max = max; this.miss = 0; this.best = 0; this.trail = []; }
  Stair.prototype.result = function (ok) {
    this.trail.push(this.level + (ok ? '+' : '-'));
    if (ok) { if (this.level > this.best) this.best = this.level; this.miss = 0; if (this.level < this.max) this.level++; }
    else { this.miss++; if (this.miss >= 2) { this.miss = 0; if (this.level > this.min) this.level--; } }
    return this.level;
  };

  var STAR_POS = [[16, 14], [50, 9], [83, 19], [33, 37], [67, 42], [13, 62], [47, 66], [81, 71], [30, 88]];
  function genStars(r, n) { return sample(r, STAR_POS.length, n); }

  /* Go/no-go order: 3 go to 1 no-go in every four trials, never two no-go in a row, first trial is go. */
  function genGng(r, n) {
    var out = [];
    while (out.length < n) { var ch; do { ch = shuffle(r, [1, 1, 1, 0]); } while ((!out.length && !ch[0]) || (out.length && !out[out.length - 1] && !ch[0])); out = out.concat(ch); }
    return out.slice(0, n);
  }
  var GNG_WIN = [0, 1800, 1500, 1250, 1050, 900, 750];
  var FLIP_RUN = [0, 5, 4, 3, 2, 1];
  /* Rule-switch cards: bins are (shape 0, colour 0) and (shape 1, colour 1); every card conflicts: it matches one bin by shape and the other by colour. */
  function flipAnswer(rule, card) { return rule === 'c' ? card.c : card.s; }

  /* Pattern items. A token is {s: shape, c: colour, z: size}. Rows repeat a unit per attribute; grids vary attributes by row and column. */
  var PAT_MAX = 8;
  function genPattern(r, level) {
    var S = sample(r, 4, 3), C = sample(r, 4, 3), cells = [], miss, it = { level: level, kind: level >= 7 ? 'grid' : 'row' }, i;
    function row(len, sS, sC, sZ) { for (i = 0; i < len; i++) cells.push({ s: sS[i % sS.length], c: sC[i % sC.length], z: sZ ? sZ[i % sZ.length] : 2 }); }
    if (level <= 1) { row(6, [S[0], S[1]], [C[0], C[1]]); miss = 5; it.unit = 2; }
    else if (level === 2) { var u = r() < 0.5 ? [0, 1, 1] : [0, 0, 1]; row(7, u.map(function (k) { return S[k]; }), u.map(function (k) { return C[k]; })); miss = 6; it.unit = 3; }
    else if (level === 3) { row(7, S, C); miss = 6; it.unit = 3; }
    else if (level === 4) { row(7, [S[0], S[1]], C); miss = 6; it.unit = 6; }
    else if (level === 5) { row(7, S, [C[0]], r() < 0.5 ? [0, 2] : [2, 0]); miss = 6; it.unit = 6; }
    else if (level === 6) { row(8, [S[0], S[1]], C); miss = 3 + rint(r, 2); it.unit = 6; }
    else if (level === 7) { for (i = 0; i < 9; i++) cells.push({ s: S[Math.floor(i / 3)], c: C[i % 3], z: 2 }); miss = 8; }
    else { for (i = 0; i < 9; i++) cells.push({ s: S[(Math.floor(i / 3) + i % 3) % 3], c: C[Math.floor(i / 3)], z: 2 }); miss = rint(r, 9); }
    var ans = cells[miss], seen = {}, cand = [], key = function (t) { return t.s + '' + t.c + t.z; };
    var vs = {}, vc = {}, vz = {}; cells.forEach(function (t) { vs[t.s] = 1; vc[t.c] = 1; vz[t.z] = 1; });
    var ks = Object.keys(vs).map(Number), kc = Object.keys(vc).map(Number), kz = Object.keys(vz).map(Number);
    if (kc.length < 2) kc.push(C[1]);
    ks.forEach(function (s) { kc.forEach(function (c) { kz.forEach(function (z) { var t = { s: s, c: c, z: z }; if (key(t) !== key(ans)) cand.push(t); }); }); });
    var shown = {}; cells.forEach(function (t, k) { if (k !== miss) shown[key(t)] = 1; });
    function diff(t) { return (shown[key(t)] ? 0 : 10) + (t.s !== ans.s) + (t.c !== ans.c) + (t.z !== ans.z); }
    cand = shuffle(r, cand).sort(function (a, b) { return diff(a) - diff(b); });
    var opts = [ans], nOpt = level <= 2 ? 3 : 4;
    cand.forEach(function (t) { if (opts.length < nOpt && !seen[key(t)]) { seen[key(t)] = 1; opts.push(t); } });
    opts = shuffle(r, opts);
    it.cells = cells.map(function (t, k) { return k === miss ? null : t; }); it.miss = miss; it.answer = ans; it.options = opts; it.ai = opts.indexOf(ans);
    return it;
  }
  var PAT_SAY = [0, 'نمط من شكلين بيتبادلوا', 'نمط فيه شكل بيتكرر مرتين', 'نمط من تلات أشكال', 'نمط الشكل فيه بيتغيّر بإيقاع واللون بإيقاع تاني', 'نمط فيه الشكل والحجم بيتغيّروا مع بعض', 'نمط بإيقاعين والناقص في النص', 'جدول: الشكل حسب الصف واللون حسب العمود', 'جدول كل صف وكل عمود فيه الأشكال التلاتة'];
  function towerMin(n) { return Math.pow(2, n) - 1; }

  /* ---------- stored data ---------- */
  function D() { var d = H.data('kids'); if (!d.v) { d.v = 1; d.log = {}; d.notes = {}; d.plans = {}; d.sound = false; d.da = true; } return d; }
  function logOf(id) { var d = D(); if (!Array.isArray(d.log[id])) d.log[id] = []; return d.log[id]; }
  function kidsList() { return (H.state().kids || []); }
  function kidBy(id) { return kidsList().filter(function (k) { return k.id === id; })[0]; }
  function ofAct(id, a) { return logOf(id).filter(function (s) { return s.a === a; }); }

  /* ---------- activities ---------- */
  var ACTS = {
    stars: { name: 'النجوم المنوّرة', tone: 'night', cons: 'wm', da: true, mins: 4, line: 'النجوم هتنوّر واحدة واحدة. افتكر الترتيب ودوس زيّها.', unit: 'طول التسلسل', max: 9,
      about: 'النجوم بتنوّر بترتيب، والطفل يعيد نفس الترتيب. كل ما ينجح التسلسل يطول نجمة.', basis: 'الذاكرة العاملة البصرية-المكانية في نموذج بادلي وهيتش، على طريقة مهمة مكعبات كورسي.' },
    gng: { name: 'قطّة ولا كلب؟', tone: 'mint', cons: 'inh', da: false, mins: 3, line: 'لما القطة تطلّ سلّم عليها بسرعة. لما الكلب يطلّ استنى وما تدوسش.', unit: 'درجة السرعة', max: 6,
      about: 'القطة بتظهر كتير فالإيد بتتعود تدوس، والكلب بيظهر قليل والمطلوب إن الطفل يمسك نفسه.', basis: 'الكفّ (ضبط الاستجابة) كأحد مكوّنات الوظائف التنفيذية عند ميياكي وزملائه ودايموند، على طريقة مهام Go/No-Go.' },
    flip: { name: 'غيّر القاعدة', tone: 'lilac', cons: 'flex', da: false, mins: 4, line: 'حُط الكارت في السلة الصح. خلّي بالك: القاعدة هتتغيّر من اللون للشكل.', unit: 'درجة التبديل', max: 5,
      about: 'الطفل بيفرز كروت حسب اللون، وبعدين القاعدة بتتقلب للشكل. كل ما ينجح التبديل بيبقى أسرع.', basis: 'المرونة المعرفية (التحويل بين القواعد) في الوظائف التنفيذية، على طريقة مهمة فرز البطاقات بتغيير البُعد (DCCS) عند زيلازو.' },
    pattern: { name: 'كمّل النمط', tone: 'sun', cons: 'reason', da: true, mins: 4, line: 'بصّ على الصف. إيه اللي ييجي مكان علامة الاستفهام؟', unit: 'مستوى النمط', max: PAT_MAX,
      about: 'صف أشكال ماشي بنظام وفيه مكان فاضي. الطفل يختار اللي يكمّل النظام، والأنماط بتتعقّد واحدة واحدة.', basis: 'الاستدلال الاستقرائي (من الاستدلال السائل في نموذج كاتل-هورن-كارول)، على طريقة مهام إكمال الأنماط والمصفوفات.' },
    tower: { name: 'برج الحلقات', tone: 'coral', cons: 'plan', da: false, mins: 4, line: 'انقل البرج كله للعمود اللي عليه النجمة. حلقة واحدة كل مرة، والكبيرة ما تقعدش فوق الصغيرة.', unit: 'عدد الحلقات', max: 4,
      about: 'برج من حلقات لازم يتنقل لعمود تاني بأقل حركات. بنسجّل عدد الحركات مقابل أقل عدد ممكن.', basis: 'التخطيط كوظيفة تنفيذية، على طريقة برج هانوي.' }
  };
  var ORDER = ['stars', 'gng', 'flip', 'pattern', 'tower'];
  var CONS = {
    wm: { name: 'الذاكرة العاملة', plain: 'إنه يشيل معلومة في دماغه شوية ويستخدمها', acts: ['stars'],
      home: ['لعبة «رحت السوق واشتريت…»: كل واحد يعيد اللي اتقال ويزوّد حاجة.', 'اقلب 6 كروت متشابهة اتنين اتنين والعبوا «فين التانية؟».', 'اطلب منه طلب من خطوتين أو تلاتة ورا بعض وشوف هيفتكرهم إزاي.'],
      watch: 'بيعيد التعليمات لنفسه؟ بينسى آخر خطوة ولا أولها؟ بيستخدم صوابعه أو كلام بصوت واطي؟' },
    inh: { name: 'ضبط الاستجابة (الكفّ)', plain: 'إنه يمسك نفسه عن حركة اتعوّد عليها', acts: ['gng'],
      home: ['لعبة «سيمون بيقول»: ينفّذ بس لما تتقال الكلمة.', 'لعبة «تماثيل»: اتحرّكوا مع الأغنية واثبتوا أول ما تقف.', 'لعبة «عكسك»: قول «فوق» وهو يشاور تحت.'],
      watch: 'بيدوس قبل ما يشوف؟ بيهدّي نفسه بعد الغلطة؟ التسرّع بيزيد مع التعب أو آخر الجلسة؟' },
    flex: { name: 'المرونة المعرفية', plain: 'إنه يغيّر طريقته لما القاعدة تتغيّر', acts: ['flip'],
      home: ['افرزوا كروت الكوتشينة مرة باللون ومرة بالشكل ومرة بالرقم.', 'رتّبوا اللعب مرة حسب الحجم ومرة حسب النوع.', 'لعبة «استخدامات تانية»: المعلقة ممكن تبقى إيه غير إنها معلقة؟'],
      watch: 'بيكمّل بالقاعدة القديمة بعد التغيير؟ بيصحّح نفسه من غير ما حد يقول؟ بيقول القاعدة بصوت مسموع؟' },
    reason: { name: 'الاستدلال بالأنماط', plain: 'إنه يلاقي النظام اللي ماشية بيه الحاجات ويكمّله', acts: ['pattern'],
      home: ['اعمل نمط بالخرز أو المكعبات أو الغطيان واطلب منه يكمّله، وبعدين هو يعملّك نمط.', 'لعبة «مين مش شبه الباقي؟» بحاجات من البيت، واسأله ليه.', 'نمط بالتصفيق والخبط: صقفة صقفة خبطة… وهو يكمّل.'],
      watch: 'بيشرح اختياره إزاي؟ بيبصّ على الصف كله ولا آخر شكل بس؟ أي درجة تلميح بتكفيه؟' },
    plan: { name: 'التخطيط', plain: 'إنه يفكّر في الخطوات قبل ما يبدأ', acts: ['tower'],
      home: ['متاهات على الورق: يمشي بصباعه الأول وبعدين بالقلم.', 'خلّيه يقول خطوات عمل ساندوتش بالترتيب قبل ما يبدأ.', 'ابنِ شكل بالمكعبات واطلب منه يعمل زيّه.'],
      watch: 'بيقف يفكّر قبل أول حركة؟ بيرجع في حركة غلط ولا يكمّل عليها؟ بيتضايق لما الحل يطول؟' }
  };
  var CAVEAT = 'دي أنشطة لعب وملاحظة، مش اختبارات مقننة، ومفيش لها معايير مصرية. أي تغيّر بين جلسة والتانية ممكن يكون سببه التعوّد على اللعبة أو مزاج الطفل أو الجهاز أو المكان، مش بالضرورة تغيّر في القدرة نفسها. مفيش هنا تشخيص ولا مقارنة بأطفال تانيين.';

  /* ---------- drawing ---------- */
  var SHAPES = ['دايرة', 'مربع', 'مثلث', 'نجمة'], COLS = ['أصفر سادة', 'بنفسجي مخطّط', 'أخضر منقّط', 'وردي مقلّم'], SIZES = ['صغير', 'وسط', 'كبير'];
  var STAR5 = 'M0-42 11.500-15.800 40-13 18.600 6 24.700 34-0 19.500-24.700 34-18.600 6-40-13-11.500-15.800Z';
  function shapeEl(s, attrs) {
    if (CUR) return '<path d="' + CUR.sil[s] + '" stroke-linejoin="round" ' + attrs + '/>';
    if (s === 0) return '<circle r="38" ' + attrs + '/>';
    if (s === 1) return '<rect x="-36" y="-36" width="72" height="72" rx="9" ' + attrs + '/>';
    if (s === 2) return '<path d="M0-40 43 34-43 34Z" stroke-linejoin="round" ' + attrs + '/>';
    return '<path d="' + STAR5 + '" stroke-linejoin="round" ' + attrs + '/>';
  }
  function tokName(t) { return (CUR ? CUR.silN[t.s] : SHAPES[t.s]) + ' ' + COLS[t.c] + (t.z != null && t.z !== 2 ? ' ' + SIZES[t.z] : ''); }
  /* Colour always travels with a texture (plain, stripes, dots, bars), so it is never the only cue. */
  function token(t, cls) {
    var k = [0.56, 0.78, 1][t.z == null ? 2 : t.z];
    return '<svg class="mkids-tok' + (cls ? ' ' + cls : '') + '" viewBox="-50 -50 100 100" role="img" aria-label="' + tokName(t) + '" data-s="' + t.s + '" data-c="' + t.c + '" data-z="' + (t.z == null ? 2 : t.z) + '"><g transform="scale(' + k + ')">' +
      shapeEl(t.s, 'class="mkids-c' + t.c + '"') + (t.c ? shapeEl(t.s, 'fill="url(#mkids-tx' + t.c + ')"') : '') + shapeEl(t.s, 'class="mkids-edge"') + '</g></svg>';
  }
  var DEFS = '<svg class="mkids-defs" width="0" height="0" aria-hidden="true" focusable="false"><defs>' +
    '<pattern id="mkids-tx1" width="12" height="12" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="5" height="12" fill="#fff" fill-opacity=".62"/></pattern>' +
    '<pattern id="mkids-tx2" width="14" height="14" patternUnits="userSpaceOnUse"><circle cx="7" cy="7" r="3.200" fill="#130d35" fill-opacity=".72"/></pattern>' +
    '<pattern id="mkids-tx3" width="12" height="12" patternUnits="userSpaceOnUse"><rect width="12" height="4" fill="#130d35" fill-opacity=".6"/></pattern>' +
    '</defs></svg>';
  function buddy(mood, cls) {
    var mouth = mood === 'oh' ? '<circle cx="60" cy="104" r="6" fill="#fff"/>' : mood === 'calm' ? '<path d="M48 104h24" stroke="#fff" stroke-width="5" stroke-linecap="round" fill="none"/>' : '<path d="M44 99q16 15 32 0" stroke="#fff" stroke-width="5.500" stroke-linecap="round" fill="none"/>';
    return '<svg class="mkids-buddy' + (cls ? ' ' + cls : '') + '" viewBox="0 0 120 136" aria-hidden="true" focusable="false"><path class="mkids-b-hat" d="M60 6 100 62H20Z" stroke-linejoin="round"/><rect class="mkids-b-body" x="20" y="58" width="80" height="74" rx="14"/><circle cx="45" cy="84" r="5.500" fill="#fff"/><circle cx="75" cy="84" r="5.500" fill="#fff"/>' + mouth + '</svg>';
  }
  function cat() {
    return '<svg class="mkids-animal" viewBox="0 0 200 200" role="img" aria-label="قطة"><path class="mkids-cat-f" d="M38 22 78 62H122L162 22 170 104A70 66 0 1 1 30 104Z" stroke-linejoin="round"/><path class="mkids-ear" d="M52 48 74 68H56ZM148 48 126 68H144Z"/>' +
      '<ellipse cx="74" cy="104" rx="9" ry="13" class="mkids-ink"/><ellipse cx="126" cy="104" rx="9" ry="13" class="mkids-ink"/><path class="mkids-ink" d="M92 126h16l-8 9Z"/><path class="mkids-ln" d="M100 135q-10 14-22 6M100 135q10 14 22 6M56 128H18M58 138 22 148M144 128h38M142 138l36 10"/></svg>';
  }
  function dog() {
    return '<svg class="mkids-animal" viewBox="0 0 200 200" role="img" aria-label="كلب"><rect class="mkids-dog-f" x="42" y="30" width="116" height="140" rx="50"/><path class="mkids-dog-e" d="M48 40C10 36 8 92 22 132 44 128 54 92 56 56ZM152 40c38-4 40 52 26 92-22-4-32-40-34-76Z" stroke-linejoin="round"/>' +
      '<circle cx="78" cy="88" r="9" class="mkids-ink"/><circle cx="122" cy="88" r="9" class="mkids-ink"/><ellipse class="mkids-dog-m" cx="100" cy="132" rx="34" ry="26"/><ellipse cx="100" cy="118" rx="12" ry="8" class="mkids-ink"/><path class="mkids-tongue" d="M90 138h20v10a10 10 0 0 1-20 0Z"/></svg>';
  }
  function star(cls) { return '<svg class="' + (cls || 'mkids-st') + '" viewBox="-10 -10 20 20" aria-hidden="true" focusable="false"><use href="#star4" x="-10" y="-10" width="20" height="20"/></svg>'; }
  var ART = {
    stars: '<svg class="mkids-art" viewBox="0 0 120 120" aria-hidden="true" focusable="false"><path class="mkids-a-line" d="M22 30 60 54 96 24M60 54 44 96"/><use href="#star4" x="6" y="14" width="32" height="32"/><use href="#star4" x="38" y="32" width="44" height="44"/><use href="#star4" x="84" y="12" width="24" height="24"/><use href="#star4" x="32" y="84" width="24" height="24"/></svg>',
    gng: '<svg class="mkids-art" viewBox="0 0 120 120" aria-hidden="true" focusable="false"><path class="mkids-a-fill" d="M22 18 46 42H74L98 18l5 50a43 40 0 1 1-86 0Z" stroke-linejoin="round"/><ellipse cx="46" cy="68" rx="5.500" ry="8" class="mkids-a-ink"/><ellipse cx="74" cy="68" rx="5.500" ry="8" class="mkids-a-ink"/><path class="mkids-a-ink" d="M55 82h10l-5 6Z"/></svg>',
    flip: '<svg class="mkids-art" viewBox="0 0 120 120" aria-hidden="true" focusable="false"><rect class="mkids-a-fill" x="10" y="26" width="46" height="62" rx="9" transform="rotate(-8 33 57)"/><rect class="mkids-a-fill2" x="64" y="30" width="46" height="62" rx="9" transform="rotate(8 87 61)"/><circle class="mkids-a-ink" cx="33" cy="57" r="11"/><rect class="mkids-a-ink" x="77" y="51" width="20" height="20" rx="3"/><path class="mkids-a-line" d="M44 108q16 10 32 0m-6-6 7 6-8 5"/></svg>',
    pattern: '<svg class="mkids-art" viewBox="0 0 120 120" aria-hidden="true" focusable="false"><circle class="mkids-a-fill" cx="24" cy="38" r="15"/><rect class="mkids-a-fill2" x="46" y="23" width="30" height="30" rx="5"/><circle class="mkids-a-fill" cx="98" cy="38" r="15"/><rect class="mkids-a-fill2" x="9" y="68" width="30" height="30" rx="5"/><circle class="mkids-a-fill" cx="61" cy="83" r="15"/><rect class="mkids-a-q" x="83" y="68" width="30" height="30" rx="5"/></svg>',
    tower: '<svg class="mkids-art" viewBox="0 0 120 120" aria-hidden="true" focusable="false"><path class="mkids-a-line" d="M60 14v84M14 100h92"/><rect class="mkids-a-fill" x="20" y="76" width="80" height="20" rx="10"/><rect class="mkids-a-fill2" x="32" y="54" width="56" height="20" rx="10"/><rect class="mkids-a-fill" x="44" y="32" width="32" height="20" rx="10"/></svg>'
  };
  var HAND = '<svg class="mkids-hand" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M8 12V5.500a1.500 1.500 0 0 1 3 0V11m0-1V4a1.500 1.500 0 0 1 3 0v6m0-4.500a1.500 1.500 0 0 1 3 0V11m0-2.500a1.500 1.500 0 0 1 3 0V15a6.500 6.500 0 0 1-12.300 3L4 14.200a1.600 1.600 0 0 1 2.600-1.800L8 14" fill="none" stroke="currentColor" stroke-width="1.800" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  function fmtDate(iso) { var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso || '')); return '<bdi class="num" dir="ltr">' + (m ? m[3] + '/' + m[2] + '/' + m[1] : esc(iso)) + '</bdi>'; }
  function n(v) { return '<bdi class="num">' + esc(v) + '</bdi>'; }

  /* ---------- cartoon characters: one house style (round bodies, big eyes, bold outline), all original ---------- */
  function faceOf(cx, cy, k, mood) {
    var m = mood === 'yay' ? '<path class="mo f" d="M-14-2q14 24 28 0Z"/>' : mood === 'oh' ? '<ellipse class="mo f" cx="0" cy="5" rx="6" ry="8"/>' : mood === 'calm' ? '<path class="mo" d="M-9 3q9 8 18 0"/>' : '<path class="mo" d="M-13 0q13 15 26 0"/>';
    return '<g transform="translate(' + cx + ' ' + cy + ') scale(' + k + ')"><g class="mkids-eyes"><ellipse class="ey" cx="-21" cy="0" rx="12.500" ry="14.500"/><ellipse class="ey" cx="21" cy="0" rx="12.500" ry="14.500"/><circle class="pu" cx="-19" cy="2" r="7.500"/><circle class="pu" cx="23" cy="2" r="7.500"/><circle class="gl" cx="-22" cy="-2.500" r="2.800"/><circle class="gl" cx="20" cy="-2.500" r="2.800"/></g>' +
      '<circle class="ck" cx="-36" cy="19" r="7"/><circle class="ck" cx="36" cy="19" r="7"/><g transform="translate(0 21)">' + m + '</g></g>';
  }
  var WH = function (x, y, r) { return '<circle class="a3" cx="' + x + '" cy="' + y + '" r="' + r + '"/><circle class="a2 n" cx="' + x + '" cy="' + y + '" r="' + (r * 0.38).toFixed(1) + '"/>'; };
  /* body markup · face [x, y, scale] · top-of-head anchor for an accessory · default body colour · Arabic name */
  var CH = {
    block: { n: 'مكعّب', col: 3, face: [100, 122, 1], top: [100, 22], body: '<path class="a1" d="M100 16 150 82H50Z"/><rect class="m" x="44" y="78" width="112" height="100" rx="22"/>' },
    cat: { n: 'قطة', col: 0, face: [100, 112, 1], top: [100, 52], body: '<path class="m" d="M38 26 76 60H124L162 26 170 106A70 64 0 1 1 30 106Z"/><path class="a1 n" d="M52 50 72 68H56ZM148 50 128 68H144Z"/><path class="l" d="M50 128H20M52 140 24 150M150 128h30M148 140l28 10"/>' },
    dog: { n: 'كلب', col: 3, face: [100, 98, 1], top: [100, 36], body: '<path class="a5" d="M50 44C14 40 10 96 24 134 46 130 54 94 56 58ZM150 44c36-4 40 52 26 90-22-4-30-40-32-76Z"/><rect class="m" x="44" y="34" width="112" height="138" rx="54"/><ellipse class="a2" cx="100" cy="134" rx="32" ry="24"/>' },
    alien: { n: 'فضائي', col: 1, face: [100, 110, 1], top: [100, 42], body: '<path class="l" d="M72 48 58 20M128 48l14-28"/><circle class="a4" cx="57" cy="17" r="10"/><circle class="a4" cx="143" cy="17" r="10"/><path class="m" d="M100 40C150 40 174 78 174 110 174 152 140 176 100 176S26 152 26 110C26 78 50 40 100 40Z"/>' },
    rocket: { n: 'صاروخ', col: 2, face: [100, 92, 0.800], top: [100, 16], body: '<path class="a5" d="M58 116 24 164 64 152ZM142 116l34 48-40-12Z"/><path class="a4" d="M82 158h36l-8 28H90Z"/><path class="m" d="M100 12C138 44 148 92 142 160H58C52 92 62 44 100 12Z"/>' },
    car: { n: 'عربية', col: 0, face: [100, 104, 0.850], top: [100, 62], body: '<path class="m" d="M20 124C20 104 32 98 46 96L64 60H136L154 96C168 98 180 106 180 124V150H20Z"/>' + WH(60, 152, 19) + WH(140, 152, 19) },
    bus: { n: 'أتوبيس', col: 3, face: [100, 104, 1], top: [100, 26], body: WH(70, 164, 16) + WH(130, 164, 16) + '<rect class="m" x="38" y="24" width="124" height="138" rx="24"/><rect class="a2" x="54" y="38" width="92" height="16" rx="8"/>' },
    fish: { n: 'سمكة', col: 2, face: [84, 98, 0.850], top: [84, 52], body: '<path class="a4" d="M146 100 188 62V138Z"/><path class="a4" d="M78 58 104 30 116 62Z"/><path class="m" d="M14 100C36 50 112 44 160 100 112 156 36 150 14 100Z"/>' },
    octo: { n: 'أخطبوط', col: 3, face: [100, 92, 1], top: [100, 26], body: '<path class="m" d="M100 24C148 24 168 62 162 100L174 164 150 142 136 176 118 144 100 178 82 144 64 176 50 142 26 164 38 100C32 62 52 24 100 24Z"/>' },
    dino: { n: 'ديناصور', col: 1, face: [100, 112, 1], top: [100, 40], body: '<path class="a1" d="M58 62 72 22 92 48 110 14 128 48 148 26 152 64Z"/><path class="m" d="M100 46C150 46 174 82 174 114 174 154 140 176 100 176S26 154 26 114C26 82 50 46 100 46Z"/><path class="a2 n" d="M78 158l7 10 7-10ZM108 158l7 10 7-10Z"/>' },
    egg: { n: 'بيضة', col: 4, face: [100, 134, 0.800], top: [100, 20], body: '<path class="m" d="M100 18C142 18 164 84 164 118A64 60 0 0 1 36 118C36 84 58 18 100 18Z"/><path class="l" d="M42 88 62 104 80 86 100 106 120 86 138 104 158 88"/><circle class="a1 n" cx="78" cy="56" r="8"/><circle class="a1 n" cx="122" cy="62" r="6"/>' },
    bot: { n: 'روبوت مدوّر', col: 0, face: [100, 90, 0.850], top: [100, 14], body: '<path class="l" d="M100 44V20"/><circle class="a1" cx="100" cy="16" r="10"/><circle class="m" cx="100" cy="110" r="68"/><rect class="a3" x="50" y="68" width="100" height="40" rx="20"/>' },
    box: { n: 'روبوت مربّع', col: 3, face: [100, 98, 1], top: [100, 20], body: '<path class="l" d="M78 42V22M122 42V22"/><rect class="a5" x="18" y="82" width="22" height="44" rx="7"/><rect class="a5" x="160" y="82" width="22" height="44" rx="7"/><rect class="m" x="36" y="40" width="128" height="130" rx="18"/><path class="l" d="M82 148h36"/>' },
    dragon: { n: 'تنين', col: 2, face: [100, 108, 1], top: [100, 40], body: '<path class="a4" d="M32 124 4 96 10 146ZM168 124l28-28-6 50Z"/><path class="a4" d="M58 60 44 16 84 46ZM142 60l14-44-40 30Z"/><path class="m" d="M100 40C148 40 170 76 170 110 170 152 138 176 100 176S30 152 30 110C30 76 52 40 100 40Z"/>' },
    tower: { n: 'برج', col: 4, face: [100, 98, 0.900], top: [100, 26], body: '<path class="m" d="M42 28H68V50H88V28H112V50H132V28H158V176H42Z"/><path class="a5" d="M84 176V148a16 16 0 0 1 32 0v28Z"/>' },
    apple: { n: 'تفاحة', col: 1, face: [100, 114, 1], top: [84, 44], body: '<path class="l" d="M100 50C100 32 108 22 118 16"/><path class="a6" d="M118 18c20-8 34 2 34 14-16 8-30 2-34-14Z"/><path class="m" d="M100 52C124 36 174 48 172 102 170 148 136 182 100 170 64 182 30 148 28 102 26 48 76 36 100 52Z"/>' },
    carrot: { n: 'جزرة', col: 0, face: [100, 86, 0.800], top: [100, 34], body: '<path class="a6" d="M82 44 66 10 94 30 104 4 116 32 140 14 120 46Z"/><path class="m" d="M56 46C82 30 120 30 144 46 154 94 126 152 100 188 74 152 46 94 56 46Z"/><path class="l" d="M74 130h14M112 146h14"/>' }
  };
  var ACCS = [['', 'من غير'], ['hat', 'طرطور'], ['bow', 'فيونكة'], ['glasses', 'نضارة'], ['crown', 'تاج']], BCOL = ['أصفر', 'أخضر', 'وردي', 'بنفسجي', 'لافندر', 'تركواز'];
  function toon(id, o) {
    o = o || {}; var C = CH[id] || CH.block, f = C.face, t = C.top, a = '';
    if (o.acc === 'hat') a = '<g transform="translate(' + t[0] + ' ' + t[1] + ')"><path class="a1" d="M-20 6 0-36 20 6Z"/><circle class="a4" cx="0" cy="-38" r="7"/></g>';
    else if (o.acc === 'bow') a = '<g transform="translate(' + (t[0] + 26) + ' ' + (t[1] + 6) + ')"><path class="a1" d="M0 0-22-13V13ZM0 0 22-13V13Z"/><circle class="a1" r="7"/></g>';
    else if (o.acc === 'crown') a = '<g transform="translate(' + t[0] + ' ' + t[1] + ')"><path class="a4" d="M-24 6V-18L-11-5 0-26 11-5 24-18V6Z"/></g>';
    else if (o.acc === 'glasses') a = '<g transform="translate(' + f[0] + ' ' + f[1] + ') scale(' + f[2] + ')"><path class="l" d="M-39 0a18 18 0 1 0 36 0a18 18 0 1 0-36 0ZM3 0a18 18 0 1 0 36 0a18 18 0 1 0-36 0ZM-3 0H3"/></g>';
    return '<svg class="mkids-toon mkids-bc' + (o.col == null ? C.col : o.col) + (o.cls ? ' ' + o.cls : '') + '" viewBox="-6 -6 212 212" ' + (o.label ? 'role="img" aria-label="' + esc(o.label) + '"' : 'aria-hidden="true" focusable="false"') + ' data-ch="' + id + '" data-mood="' + (o.mood || 'smile') + '"><g class="mkids-toon-b">' + C.body + faceOf(f[0], f[1], f[2], o.mood) + a + '</g></svg>';
  }
  var GEAR = (function () { var p = [], i, a, r; for (i = 0; i < 32; i++) { a = (i + 0.5) * Math.PI / 16; r = (i % 4 < 2) ? 40 : 29; p.push((r * Math.cos(a)).toFixed(1) + ' ' + (r * Math.sin(a)).toFixed(1)); } return 'M' + p.join('L') + 'Z'; })();
  var WHEELS = 'M-30 24a10 10 0 1 0 20 0a10 10 0 1 0-20 0ZM10 24a10 10 0 1 0 20 0a10 10 0 1 0-20 0Z';
  /* A theme changes what things look like and how prompts are worded. It never changes the task: the same four
     silhouettes x four colour-and-texture fills x three sizes carry the pattern and rule-switch tasks; go and no-go
     are two characters that differ in outline and in colour; the memory tiles are nine identical objects. */
  var THEMES = {
    animals: { name: 'حيوانات', tone: 'mint', go: 'cat', nogo: 'dog', goN: ['القطة', 1], nogoN: ['الكلب', 0], gq: 'قطّة ولا كلب؟', tile: 3, tiles: 'العصافير', one: 'عصفورة', silN: ['قطة', 'أرنب', 'دب', 'عصفورة'],
      sil: ['M-34-38-14-20H14L34-38 37 6A37 32 0 0 1-37 6Z', 'M-24-2C-34-46-10-48-8-14H8C10-48 34-46 24-2A30 27 0 1 1-24-2Z', 'M-30 6a30 30 0 1 0 60 0a30 30 0 1 0-60 0ZM-42-24a13 13 0 1 0 26 0a13 13 0 1 0-26 0ZM16-24a13 13 0 1 0 26 0a13 13 0 1 0-26 0Z', 'M-14 2a27 27 0 1 0 54 0a27 27 0 1 0-54 0ZM-12-10-42 0-12 12ZM22-22 30-42 40-18Z'],
      scene: '<path d="M0 60V34Q60 6 120 30T240 26T400 22V60Z"/>' },
    space: { name: 'فضاء', tone: 'night', go: 'alien', nogo: 'rocket', goN: ['الفضائي', 0], nogoN: ['الصاروخ', 0], gq: 'فضائي ولا صاروخ؟', tile: 3, tiles: 'النجوم', one: 'نجمة', silN: ['صاروخ', 'كوكب', 'هلال', 'نجمة'],
      sil: ['M0-42C14-30 18-12 18 8L32 28H12L8 38H-8L-12 28H-32L-18 8C-18-12-14-30 0-42Z', 'M-28 0a28 28 0 1 0 56 0a28 28 0 1 0-56 0ZM-44 12Q0 30 44-12L42-4Q0 44-42 20Z', 'M12-40A40 40 0 1 0 40 14 32 32 0 0 1 12-40Z', STAR5],
      scene: '<circle cx="30" cy="20" r="3"/><circle cx="96" cy="42" r="2"/><circle cx="150" cy="14" r="2.500"/><circle cx="214" cy="38" r="3"/><circle cx="270" cy="12" r="2"/><circle cx="330" cy="40" r="2.500"/><circle cx="380" cy="18" r="3"/>' },
    cars: { name: 'عربيات', tone: 'sun', go: 'car', nogo: 'bus', goN: ['العربية', 1], nogoN: ['الأتوبيس', 0], gq: 'عربية ولا أتوبيس؟', tile: 3, tiles: 'العلامات', one: 'علامة', silN: ['عربية', 'قمع', 'لوري', 'علامة'],
      sil: ['M-40 10C-40-2-30-4-24-6L-14-26H14L26-6C36-4 40 0 40 10V24H-40Z' + WHEELS, 'M-8-40H8L26 22H38V38H-38V22H-26Z', 'M-40-22H6V-6H26L40 10V24H-40Z' + WHEELS, 'M0-42 28-14 0 14-28-14ZM-6 12H6V42H-6Z'],
      scene: '<path d="M0 60V28H400V60Z"/><path class="d" d="M10 44h40M90 44h40M170 44h40M250 44h40M330 44h40"/>' },
    sea: { name: 'بحر وأسماك', tone: 'teal', go: 'fish', nogo: 'octo', goN: ['السمكة', 1], nogoN: ['الأخطبوط', 0], gq: 'سمكة ولا أخطبوط؟', tile: 2, tiles: 'نقط المية', one: 'نقطة مية', silN: ['سمكة', 'مركب', 'نقطة مية', 'نجمة بحر'],
      sil: ['M-40 0C-24-28 8-28 20-8L40-26V26L20 8C8 28-24 28-40 0Z', 'M-40 8H40L28 34H-28ZM-5-42V0H-32ZM5-30V0H28Z', 'M0-42C18-14 29 0 29 12A29 29 0 0 1-29 12C-29 0-18-14 0-42Z', STAR5],
      scene: '<path d="M0 60V26q25-18 50 0t50 0 50 0 50 0 50 0 50 0 50 0 50 0V60Z"/>' },
    dinos: { name: 'ديناصورات', tone: 'coral', go: 'dino', nogo: 'egg', goN: ['الديناصور', 0], nogoN: ['البيضة', 1], gq: 'ديناصور ولا بيضة؟', tile: 0, tiles: 'البيض', one: 'بيضة', silN: ['بيضة', 'جبل', 'ورقة شجر', 'عضمة'],
      sil: ['M0-40C23-40 33-6 33 10A33 30 0 0 1-33 10C-33-6-23-40 0-40Z', 'M-42 32-24-4-12 12 0-38 12 12 24-4 42 32Z', 'M0-42C34-22 36 16 0 42-36 16-34-22 0-42Z', 'M-20-8H20A12 12 0 1 1 36-16 12 12 0 1 1 36 16 12 12 0 1 1 20 8H-20A12 12 0 1 1-36 16 12 12 0 1 1-36-16 12 12 0 1 1-20-8Z'],
      scene: '<path d="M0 60V40L60 8 100 40 160 20 220 44 300 4 360 40 400 30V60Z"/>' },
    robots: { name: 'روبوتات', tone: 'lilac', go: 'bot', nogo: 'box', goN: ['الروبوت المدوّر', 0], nogoN: ['الروبوت المربّع', 0], gq: 'مدوّر ولا مربّع؟', tile: 1, tiles: 'الشرارات', one: 'شرارة', silN: ['ترس', 'شرارة', 'راس روبوت', 'بطارية'],
      sil: [GEAR, 'M10-42-28 6H-4L-12 42 28-8H4Z', 'M-32-18H32V34H-32ZM-5-28H5V-18H-5ZM-9-36a9 9 0 1 0 18 0a9 9 0 1 0-18 0Z', 'M-24-30H-9V-41H9V-30H24V40H-24Z'],
      scene: '<path d="M0 60V30H40V14H80V36H130V8H170V30H230V18H270V40H320V12H360V34H400V60Z"/>' },
    castle: { name: 'حواديت وقلعة', tone: 'night', go: 'dragon', nogo: 'tower', goN: ['التنين', 0], nogoN: ['البرج', 0], gq: 'تنين ولا برج؟', tile: 0, tiles: 'التيجان', one: 'تاج', silN: ['تاج', 'درع', 'برج', 'مفتاح'],
      sil: ['M-40 30V-24L-19 0 0-34 19 0 40-24V30Z', 'M-33-38H33V2C33 24 14 36 0 42-14 36-33 24-33 2Z', 'M-27-40H-13V-27H-7V-40H7V-27H13V-40H27V40H-27Z', 'M-42 0a17 17 0 1 0 34 0a17 17 0 1 0-34 0ZM-10-7H42V15H31V5H22V15H11V5H-10Z'],
      scene: '<path d="M0 60V24H20V36H40V24H60V36H80V24H100V36H120V24H140V36H160V24H180V36H200V24H220V36H240V24H260V36H280V24H300V36H320V24H340V36H360V24H380V36H400V60Z"/>' },
    food: { name: 'أكل وفاكهة', tone: 'sun', go: 'apple', nogo: 'carrot', goN: ['التفاحة', 1], nogoN: ['الجزرة', 1], gq: 'تفاحة ولا جزرة؟', tile: 0, tiles: 'التفاح', one: 'تفاحة', silN: ['تفاحة', 'جزرة', 'عيش الغراب', 'موزة'],
      sil: ['M0-22C10-36 38-30 36-2 34 26 16 42 0 35-16 42-34 26-36-2-38-30-10-36 0-22ZM-3-22C-3-34 4-40 11-43L14-36C7-34 4-30 4-22Z', 'M-22-26C-8-36 14-32 24-20L-28 42C-38 20-36-12-22-26Z', 'M-40-2A40 36 0 0 1 40-2ZM-13-2H13V30A13 11 0 0 1-13 30Z', 'M-36-30C-30 14 6 36 40 24 14 50-44 30-36-30Z'],
      scene: '<path d="M0 60V30q20 26 40 0t40 0 40 0 40 0 40 0 40 0 40 0 40 0 40 0 40 0V60Z"/>' }
  };
  var TH_ORDER = ['animals', 'space', 'cars', 'sea', 'dinos', 'robots', 'castle', 'food'], CUR = null;
  function thOf(id) { return THEMES[id] || THEMES.animals; }
  function thName(id) { return THEMES[id] ? THEMES[id].name : 'قبل الثيمات'; }
  function tileSvg(T) { return '<svg class="mkids-st" viewBox="-50 -50 100 100" aria-hidden="true" focusable="false"><path d="' + T.sil[T.tile] + '" stroke-linejoin="round"/></svg>'; }
  function scene(T) { return '<svg class="mkids-scene" viewBox="0 0 400 60" preserveAspectRatio="none" aria-hidden="true" focusable="false">' + T.scene + '</svg>'; }
  /* per-child choices: theme, theme lock, companion, sensory fit */
  function cfg(id) {
    var d = D(); if (!d.kid) d.kid = {}; var k = d.kid[id] || (d.kid[id] = {});
    if (!THEMES[k.th]) k.th = 'animals';
    if (!k.bud || !CH[k.bud.ch]) k.bud = { ch: 'block', col: 3, acc: '', name: '' };
    if (!k.fit) k.fit = { calm: false, still: false, contrast: false, big: false, mute: false, len: 'normal' };
    return k;
  }
  function locked(id) { var k = cfg(id); return k.lock == null ? logOf(id).some(function (s) { return s.n > 0; }) : !!k.lock; }
  var LEN = { short: ['قصيرة (حوالي دقيقتين)', 0.600], normal: ['عادية (3 لـ 5 دقايق)', 1], long: ['أطول شوية', 1.400] };
  function gWords(T) {
    var g = T.goN, x = T.nogoN, it = function (w) { return (w[1] ? 'دي ' : 'ده ') + w[0]; };
    return { intro: 'لما ' + g[0] + (g[1] ? ' تطلّ' : ' يطلّ') + ' سلّم ' + (g[1] ? 'عليها' : 'عليه') + ' بسرعة. لما ' + x[0] + (x[1] ? ' تطلّ' : ' يطلّ') + ' استنى وما تدوسش.',
      go: it(g) + ': سلّم ' + (g[1] ? 'عليها' : 'عليه') + '!', nogo: it(x) + ': استنى، ما تدوسش.', fa: it(x) + '! ' + (x[1] ? 'نستناها تعدّي.' : 'نستناه يعدّي.'),
      miss: g[0] + (g[1] ? ' مشيت' : ' مشي') + '. المرة الجاية نلحق' + (g[1] ? 'ها.' : 'ه.'), main: 'سلّم على ' + g[0] + ' بس.' };
  }

  /* ---------- play shell ---------- */
  var STOP = { stop: true }, LIVE = null, PLAY_HASH = '', AC = null, CAP_MS = 270000;
  var OK_SAY = ['برافو على تركيزك!', 'حلو قوي، كمّل!', 'شاطر إنك بصّيت كويس!', 'تمام كده، كمّل!'], TRY_SAY = ['قرّبت! نجرب واحدة تانية.', 'ولا يهمّك، المهم إنك بتحاول.', 'محاولة حلوة، نكمّل.'];
  function kill() {
    var c = LIVE; if (!c) return; LIVE = null; c.dead = true;
    c.rej.splice(0).forEach(function (f) { f(STOP); });
    c.keys.forEach(function (f) { document.removeEventListener('keydown', f, true); });
    document.documentElement.classList.remove('mkids-lock');
  }
  /* The play screen is mounted on <body>, above the navigation, and the rest of the page is made inert while it is open. */
  function unmount() {
    kill(); CUR = null;
    $$('.mkids-play').forEach(function (el) { el.parentNode.removeChild(el); });
    $$('[data-mkids-inert]').forEach(function (el) { el.inert = false; el.removeAttribute('data-mkids-inert'); });
  }
  window.addEventListener('hashchange', function () { if (PLAY_HASH && location.hash !== PLAY_HASH) { PLAY_HASH = ''; unmount(); } });
  function beep(k) {
    if (!D().sound) return;
    try { AC = AC || new (window.AudioContext || window.webkitAudioContext)(); var o = AC.createOscillator(), g = AC.createGain(); o.frequency.value = 330 * Math.pow(1.122, k % 9); g.gain.value = 0.07; o.connect(g); g.connect(AC.destination); o.start(); g.gain.exponentialRampToValueAtTime(0.0001, AC.currentTime + 0.2); o.stop(AC.currentTime + 0.22); } catch (e) {}
  }
  function play(main, kid, id) {
    var A = ACTS[id], d = D(), K = cfg(kid.id), T = CUR = thOf(K.th), F = K.fit, B = K.bud, plain = F.contrast || F.calm;
    function bud(mood, cls) { return toon(B.ch, { mood: mood, col: B.col, acc: B.acc, cls: cls }); }
    main.innerHTML = '<h1 class="sr">' + A.name + '</h1>';
    var root = document.createElement('div'); root.className = 'mkids-play mkids-t-' + (plain ? 'plain' : T.tone) + (F.contrast ? ' mkids-f-contrast' : F.calm ? ' mkids-f-calm' : '') + (F.still ? ' mkids-f-still' : '') + (F.big ? ' mkids-f-big' : ''); root.id = 'mkids-play'; root.dataset.act = id; root.dataset.theme = K.th; root.dataset.phase = 'intro';
    $$('body > *').forEach(function (el) { if (!/^(SCRIPT|LINK|STYLE)$/.test(el.tagName) && el.id !== 'toast' && !el.inert) { el.inert = true; el.setAttribute('data-mkids-inert', ''); } });
    document.body.appendChild(root); PLAY_HASH = location.hash;
    root.innerHTML = DEFS + (plain ? '' : scene(T)) +
      '<header class="mkids-bar"><button type="button" class="mkids-stop" id="mkids-stop">' + HAND + '<span>مش عاوز ألعب دلوقتي</span></button><div class="mkids-dots" id="mkids-dots" aria-hidden="true"></div></header>' +
      '<div class="mkids-say"><span id="mkids-bud">' + bud() + '</span><p id="mkids-line" role="status" aria-live="polite"></p></div>' +
      '<div class="mkids-stage" id="mkids-stage"></div>';
    var stage = $('#mkids-stage', root), line = $('#mkids-line', root), praise = 0;
    var c = LIVE = {
      hash: location.hash, stage: stage, rng: makeRng(SEED != null ? SEED : (Date.now() ^ (Math.random() * 1e9)) >>> 0), dead: false, rej: [], keys: [], da: false, t0: 0, started: false,
      res: { lvl: 0, n: 0, err: 0, hints: null, x: {} }, dev: {},
      T: T, count: function (k) { return Math.max(1, Math.round(k * LEN[F.len][1])); },
      say: function (t, mood, cls) { line.textContent = t; $('#mkids-bud', root).innerHTML = bud(mood, cls); },
      wait: function (ms) {
        return new Promise(function (res, rej) {
          if (c.dead) return rej(STOP);
          c.rej.push(rej);
          setTimeout(function () { var i = c.rej.indexOf(rej); if (i > -1) c.rej.splice(i, 1); if (c.dead || !root.isConnected) rej(STOP); else res(); }, ms * SPEED);
        });
      },
      tap: function (sel) {
        return new Promise(function (res, rej) {
          if (c.dead) return rej(STOP);
          c.rej.push(rej);
          function on(e) {
            var t = e.target.closest ? e.target.closest(sel) : null;
            if (!t || !stage.contains(t) || t.disabled || t.getAttribute('aria-disabled') === 'true') return;
            stage.removeEventListener('click', on); var i = c.rej.indexOf(rej); if (i > -1) c.rej.splice(i, 1); res(t);
          }
          stage.addEventListener('click', on);
        });
      },
      onKey: function (f) { c.keys.push(f); document.addEventListener('keydown', f, true); },
      dots: function (done, total) { var h = ''; for (var i = 0; i < total; i++) h += '<i' + (i < done ? ' class="on"' : '') + '></i>'; $('#mkids-dots', root).innerHTML = h; },
      late: function () { return Date.now() - c.t0 > CAP_MS; },
      sfx: F.mute ? function () {} : beep,
      cheer: function (ok, ms) { c.say(ok ? OK_SAY[praise++ % OK_SAY.length] : TRY_SAY[praise++ % TRY_SAY.length], ok ? 'yay' : 'calm', ok ? 'hop' : 'nod'); if (ok) c.sfx(7); return c.wait(ms || 1000); }
    };
    document.documentElement.classList.add('mkids-lock');
    root.addEventListener('pointerdown', function (e) { var k = e.pointerType || 'mouse'; c.dev[k] = (c.dev[k] || 0) + 1; }, true);
    root.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ' || /^Arrow/.test(e.key)) c.dev.keyboard = (c.dev.keyboard || 0) + 1; }, true);

    function finish(done) {
      if (c.ended) return; c.ended = true;
      var saved = null;
      if (c.started) {
        var dv = Object.keys(c.dev).sort(function (a, b) { return c.dev[b] - c.dev[a]; })[0] || 'unknown', now = new Date();
        saved = { id: H.uid(), d: H.today(), t: ('0' + now.getHours()).slice(-2) + ':' + ('0' + now.getMinutes()).slice(-2), a: id, done: done ? 1 : 0, lvl: c.res.lvl || 0, n: c.res.n || 0, err: c.res.err || 0,
          hints: c.res.hints, da: c.da ? 1 : 0, th: K.th, len: F.len, dur: Math.round((Date.now() - c.t0) / 1000), dev: dv, vp: window.innerWidth + 'x' + window.innerHeight, x: c.res.x || {}, note: '' };
        var lg = logOf(kid.id); lg.push(saved); if (lg.length > 300) lg.splice(0, lg.length - 300);
        H.save();
      }
      kill();
      root.dataset.phase = 'end'; $('#mkids-stop', root).hidden = true; $('#mkids-dots', root).innerHTML = '';
      line.textContent = ''; $('.mkids-say', root).hidden = true;
      var NOTES = ['الطفل كان تعبان', 'في دوشة', 'اللعب اتقاطع', 'كان مركّز ومبسوط'];
      stage.innerHTML = '<div class="mkids-end"><div class="mkids-end-art">' + bud(done ? 'yay' : '', done ? 'hop' : '') + (saved ? star('mkids-prize') : '') + '</div>' +
        '<h1>' + (done ? 'خلصنا يا ' : 'تمام يا ') + esc(kid.child) + '!</h1>' +
        '<p class="mkids-end-line">' + (done ? 'شكراً إنك لعبت وركّزت. نجمة جديدة اتضافت لرحلتك.' : saved ? 'نكمّل في وقت تاني. شكراً إنك جرّبت، ونجمتك محفوظة.' : 'نلعب في وقت تاني لما تحب.') + '</p>' +
        (B.name ? '<p class="mkids-end-bud">' + esc(B.name) + ' بيقولك: استمتعت باللعب معاك.</p>' : '') +
        '<a class="mkids-go" id="mkids-home" href="#kids/' + esc(kid.id) + '">رجوع للرحلة</a>' +
        (saved ? '<div class="mkids-note"><p>للكبار: ملاحظة عن الجلسة (اختياري)</p><div class="mkids-chips">' + NOTES.map(function (t) { return '<button type="button" class="mkids-chip" aria-pressed="false">' + t + '</button>'; }).join('') + '</div>' +
          '<label class="sr" for="mkids-note">ملاحظة</label><input type="text" id="mkids-note" maxlength="160" placeholder="أو اكتب ملاحظتك"></div>' : '') + '</div>';
      if (saved) {
        var inp = $('#mkids-note', stage), keep = function () { saved.note = inp.value.trim(); H.save(); };
        inp.addEventListener('input', keep);
        $$('.mkids-chip', stage).forEach(function (b) { b.addEventListener('click', function () { var on = b.getAttribute('aria-pressed') !== 'true'; b.setAttribute('aria-pressed', on); var parts = inp.value.split('، ').filter(function (p) { return p && p !== b.textContent; }); if (on) parts.push(b.textContent); inp.value = parts.join('، '); keep(); }); });
        if (done && window.HubMotion && !H.calm()) try { window.HubMotion.burst($('.mkids-prize', stage), 12); } catch (e) {}
      }
      $('#mkids-home', stage).focus();
    }
    $('#mkids-stop', root).addEventListener('click', function () { finish(false); });
    c.say(id === 'gng' ? gWords(T).intro : id === 'stars' ? T.tiles + ' هتنوّر واحدة واحدة. افتكر الترتيب ودوس زيّها.' : A.line);
    stage.innerHTML = '<div class="mkids-intro"><div class="mkids-intro-art' + (id === 'gng' ? ' pair' : '') + '">' + (id === 'gng' ? toon(T.go) + toon(T.nogo) : id === 'stars' ? '<span class="mkids-intro-tile">' + tileSvg(T) + '</span>' : ART[id]) + '</div><h1>' + (id === 'gng' ? T.gq : A.name) + '</h1>' +
      '<button type="button" class="mkids-go" id="mkids-start">يلا نلعب</button>' +
      (A.da ? '<label class="mkids-da"><input type="checkbox" id="mkids-da"' + (d.da ? ' checked' : '') + '><span>للكبار: مساعدة متدرّجة لما يتعثّر (إعادة، ثم توضيح، ثم نحلّها سوا)</span></label>' : '') + '</div>';
    $('#mkids-start', stage).addEventListener('click', function () {
      if (A.da) { c.da = $('#mkids-da', stage).checked; d.da = c.da; }
      c.started = true; c.t0 = Date.now(); root.dataset.phase = 'play';
      GAMES[id](c).then(function () { finish(true); }, function (e) { if (e !== STOP) { finish(false); throw e; } });
    });
    $('#mkids-start', stage).focus();
  }

  /* ---------- the games ---------- */
  var GAMES = {};

  /* Spatial sequence memory: nine stars in a fixed scattered layout; one star a second; no star twice in a sequence. */
  GAMES.stars = async function (c) {
    c.stage.innerHTML = '<div class="mkids-sky" id="mkids-sky" data-mode="wait">' + STAR_POS.map(function (p, i) { return '<button type="button" class="mkids-star" data-i="' + i + '" aria-label="' + c.T.one + ' ' + (i + 1) + '">' + tileSvg(c.T) + '<b class="mkids-ord" aria-hidden="true"></b></button>'; }).join('') + '</div>';
    var sky = $('#mkids-sky', c.stage), bs = $$('.mkids-star', sky);
    bs.forEach(function (b, i) { b.style.setProperty('left', STAR_POS[i][0] + '%'); b.style.setProperty('top', STAR_POS[i][1] + '%'); });
    function mode(m) { sky.dataset.mode = m; bs.forEach(function (b) { b.setAttribute('aria-disabled', m === 'go' || m === 'guide' ? 'false' : 'true'); }); }
    async function show(seq, nums) {
      mode('watch'); await c.wait(600);
      for (var k = 0; k < seq.length; k++) { var b = bs[seq[k]]; b.classList.add('lit'); if (nums) { b.classList.add('num'); $('.mkids-ord', b).textContent = k + 1; } c.sfx(seq[k]); await c.wait(nums ? 1000 : 700); b.classList.remove('lit'); await c.wait(300); }
      if (nums) { await c.wait(700); bs.forEach(function (x) { x.classList.remove('num'); $('.mkids-ord', x).textContent = ''; }); }
    }
    async function attempt(seq) {
      mode('go'); var got = [];
      while (got.length < seq.length) { var b = await c.tap('.mkids-star'); got.push(+b.dataset.i); b.classList.add('tap'); c.sfx(+b.dataset.i); unTap(b); }
      mode('wait'); await c.wait(300); return got.join() === seq.join();
    }
    function unTap(b) { setTimeout(function () { b.classList.remove('tap'); }, 380 * SPEED + 20); }
    async function guided(seq) {
      mode('guide');
      for (var k = 0; k < seq.length; k++) { var b = bs[seq[k]], t; b.classList.add('lit'); do { t = await c.tap('.mkids-star'); } while (t !== b); c.sfx(seq[k]); b.classList.remove('lit'); await c.wait(200); }
      mode('wait');
    }
    async function trial(len, scored) {
      var seq = genStars(c.rng, len), hint = 0, h = scored ? 1 : 3, first, ok;
      sky.dataset.len = len;
      c.say('بصّ على ' + c.T.tiles + '…'); await show(seq); c.say('دورك! دوس عليهم بنفس الترتيب.'); first = ok = await attempt(seq);
      while (!ok && (c.da || !scored) && h <= 3) {
        hint = h;
        if (h === 1) { c.say('نشوفهم تاني براحة.', 'calm'); await show(seq); c.say('دورك!'); ok = await attempt(seq); }
        else if (h === 2) { c.say('المرة دي كل واحدة عليها رقمها.', 'calm'); await show(seq, true); c.say('دورك!'); ok = await attempt(seq); }
        else { c.say('نعملها سوا: دوس على اللي منوّرة.'); await guided(seq); ok = true; }
        h++;
      }
      return { first: first, hint: hint };
    }
    c.say('نجرّب الأول.'); await c.wait(900);
    sky.dataset.practice = '1';
    for (var p = 0; p < 2; p++) { var pr = await trial(2, false); await c.cheer(pr.first || true, 900); }
    delete sky.dataset.practice;
    var stair = new Stair(2, 2, 9), N = c.count(10);
    if (c.da) c.res.hints = [0, 0, 0, 0];
    for (var t = 0; t < N && !c.late(); t++) {
      c.dots(t, N);
      var r = await trial(stair.level, true);
      c.res.n++; if (!r.first) c.res.err++; if (c.da) c.res.hints[r.hint]++;
      stair.result(r.first); c.res.lvl = stair.best; c.res.x.trail = stair.trail.join(' ');
      c.dots(t + 1, N); await c.cheer(r.first);
    }
  };

  /* Go/no-go: the cat (go, 3 in 4) builds the habit of pressing; the dog (no-go, 1 in 4) asks the child to hold back. */
  GAMES.gng = async function (c) {
    c.stage.innerHTML = '<div class="mkids-gng"><div class="mkids-hole" id="mkids-hole" data-kind="" data-last=""><div class="mkids-peek" id="mkids-peek"></div><span class="mkids-fb" id="mkids-fb" aria-hidden="true">' + star() + '</span></div>' +
      '<button type="button" class="mkids-wave" id="mkids-wave">' + HAND + '<span>سلّم!</span></button></div>';
    var T = c.T, W = gWords(T), hole = $('#mkids-hole', c.stage), peek = $('#mkids-peek', c.stage), btn = $('#mkids-wave', c.stage);
    var open = false, pressed = null, t0 = 0, wake = null, x = c.res.x = { go: 0, nogo: 0, hit: 0, miss: 0, fa: 0, cr: 0, early: 0, rts: [], trail: '' };
    function press(e) {
      if (e.type === 'keydown') { if ((e.key !== ' ' && e.key !== 'Enter') || e.repeat || (e.target.closest && e.target.closest('.mkids-stop'))) return; e.preventDefault(); }
      if (!open) { x.early++; return; }
      if (pressed == null) { pressed = performance.now() - t0; btn.classList.add('down'); if (wake) wake(); }
    }
    btn.addEventListener('pointerdown', press); hole.addEventListener('pointerdown', press); c.onKey(press);
    async function trial(go, win, teach) {
      hole.dataset.kind = ''; peek.innerHTML = ''; btn.classList.remove('down');
      await c.wait(700 + rint(c.rng, 5) * 100);
      pressed = null; peek.innerHTML = go ? toon(T.go, { label: T.goN[0] }) : toon(T.nogo, { label: T.nogoN[0] }); hole.dataset.kind = go ? 'go' : 'nogo'; t0 = performance.now(); open = true;
      if (teach) c.say(go ? W.go : W.nogo, go ? '' : 'calm');
      await new Promise(function (res, rej) { wake = res; c.wait(win).then(res, rej); });
      open = false; wake = null;
      var resp = pressed != null, kind = go ? (resp ? 'hit' : 'miss') : (resp ? 'fa' : 'cr');
      hole.dataset.last = kind; hole.dataset.kind = '';
      if (kind === 'hit') { hole.classList.add('yay'); c.sfx(6); await c.wait(380); hole.classList.remove('yay'); }
      else if (kind === 'fa') { c.say(W.fa, 'calm', 'nod'); await c.wait(1100); }
      else if (kind === 'miss') { c.say(W.miss, 'calm', 'nod'); await c.wait(900); }
      else { if (teach) c.say('برافو، استنيت!'); await c.wait(teach ? 900 : 300); }
      peek.innerHTML = '';
      return { kind: kind, rt: resp ? Math.round(pressed) : null };
    }
    c.say('نجرّب الأول.'); await c.wait(900);
    hole.dataset.practice = '1';
    var pr = [1, 1, 0, 1]; for (var p = 0; p < pr.length; p++) await trial(pr[p], 2600, true);
    delete hole.dataset.practice;
    c.say('يلا بجد! ' + W.main); await c.wait(1200);
    var order = genGng(c.rng, Math.max(12, Math.round(c.count(36) / 12) * 12)), stair = new Stair(1, 1, 6), bErr = 0, BLOCK = 6;
    for (var t = 0; t < order.length && !c.late(); t++) {
      c.dots(t, order.length);
      if (t % BLOCK === 0) c.say(W.main);
      var r = await trial(order[t], GNG_WIN[stair.level], false);
      c.res.n++; if (order[t]) x.go++; else x.nogo++; x[r.kind]++;
      if (r.kind === 'hit') x.rts.push(r.rt);
      if (r.kind === 'miss' || r.kind === 'fa') { c.res.err++; bErr++; }
      if ((t + 1) % BLOCK === 0) { stair.result(bErr <= 1); bErr = 0; c.res.lvl = stair.best; x.trail = stair.trail.join(' '); }
    }
    c.dots(order.length, order.length);
  };

  /* Rule switching: sort by colour first, then the rule turns to shape and keeps turning; shorter runs as the child succeeds. */
  GAMES.flip = async function (c) {
    var BIN = [{ s: 0, c: 0 }, { s: 1, c: 1 }], CARD = [{ s: 0, c: 1 }, { s: 1, c: 0 }], RN = { c: 'باللون', s: 'بالشكل' };
    var CUE = { c: '<svg class="mkids-cue" viewBox="0 0 64 40" aria-hidden="true" focusable="false"><rect x="2" y="4" width="28" height="32" rx="8" class="mkids-c0"/><rect x="34" y="4" width="28" height="32" rx="8" class="mkids-c1"/><rect x="34" y="4" width="28" height="32" rx="8" fill="url(#mkids-tx1)"/></svg>',
      s: '<svg class="mkids-cue" viewBox="0 0 64 40" aria-hidden="true" focusable="false"><circle cx="16" cy="20" r="13" class="mkids-out"/><rect x="36" y="7" width="26" height="26" rx="4" class="mkids-out"/></svg>' };
    c.stage.innerHTML = '<div class="mkids-flip"><div class="mkids-rule" id="mkids-rule" data-rule=""></div><div class="mkids-card" id="mkids-card"></div>' +
      '<div class="mkids-bins">' + BIN.map(function (b, i) { return '<button type="button" class="mkids-bin" data-b="' + i + '" aria-label="سلة: ' + tokName(b) + '">' + token(b) + '</button>'; }).join('') + '</div></div>';
    var ruleEl = $('#mkids-rule', c.stage), cardEl = $('#mkids-card', c.stage), bins = $$('.mkids-bin', c.stage);
    c.onKey(function (e) {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      var right = bins[0].getBoundingClientRect().left > bins[1].getBoundingClientRect().left ? bins[0] : bins[1];
      e.preventDefault(); (e.key === 'ArrowRight' ? right : (right === bins[0] ? bins[1] : bins[0])).click();
    });
    async function setRule(rule, changed) {
      ruleEl.dataset.rule = rule; ruleEl.innerHTML = CUE[rule] + '<strong>' + RN[rule] + '</strong>';
      if (changed) { ruleEl.classList.add('new'); c.say('القاعدة اتغيّرت! دلوقتي بنلعب ' + RN[rule] + '.', 'oh'); c.sfx(8); await c.wait(1500); ruleEl.classList.remove('new'); }
      else c.say('دلوقتي بنلعب ' + RN[rule] + '.');
    }
    async function trial(rule) {
      var card = CARD[rint(c.rng, 2)];
      cardEl.innerHTML = token(card); cardEl.dataset.s = card.s; cardEl.dataset.c = card.c; cardEl.dataset.n = (+cardEl.dataset.n || 0) + 1;
      var b = await c.tap('.mkids-bin'), ok = +b.dataset.b === flipAnswer(rule, card);
      cardEl.innerHTML = ''; cardEl.dataset.s = ''; b.classList.add(ok ? 'ok' : 'no'); cardEl.dataset.last = ok ? 'ok' : 'no';
      if (ok) { c.sfx(5); await c.wait(380); } else { c.say('دلوقتي بنلعب ' + RN[rule] + '. نكمّل!', 'calm'); await c.wait(1200); }
      b.classList.remove('ok', 'no');
      return ok;
    }
    var k, rule = 'c';
    cardEl.dataset.practice = '1';
    await setRule('c'); for (k = 0; k < 2; k++) await trial('c');
    await setRule('s', true); for (k = 0; k < 2; k++) await trial('s');
    delete cardEl.dataset.practice;
    c.say('يلا بجد!'); await c.wait(1000);
    var stair = new Stair(1, 1, 5), total = c.count(30), t = 0, run = 0, x = c.res.x = { sw: 0, swErr: 0, stayErr: 0, pre: 0, trail: '' };
    await setRule(rule);
    while (t < total && !c.late()) {
      var len = run === 0 ? 5 : stair.level === 5 ? 1 + rint(c.rng, 2) : FLIP_RUN[stair.level], runErr = 0;
      for (k = 0; k < len && t < total; k++) {
        c.dots(t, total);
        var ok = await trial(rule); t++; c.res.n = t;
        if (!ok) { c.res.err++; runErr++; if (run === 0) x.pre++; else if (k === 0) x.swErr++; else x.stayErr++; }
      }
      if (run > 0) { stair.result(runErr === 0); c.res.lvl = stair.best; x.trail = stair.trail.join(' '); }
      run++;
      if (t < total && !c.late()) { rule = rule === 'c' ? 's' : 'c'; x.sw++; await setRule(rule, true); }
    }
    c.dots(total, total);
  };

  /* Pattern completion with graded help: look again, then the structure is marked, then the answer is shown. */
  GAMES.pattern = async function (c) {
    function draw(it) {
      c.stage.innerHTML = '<div class="mkids-pat" id="mkids-pat" data-level="' + it.level + '"' + (SEED != null ? ' data-ai="' + it.ai + '"' : '') + '><div class="mkids-seq mkids-' + it.kind + '" id="mkids-seq">' +
        it.cells.map(function (t, i) { return '<span class="mkids-cell' + (t ? '' : ' q') + '" data-i="' + i + '">' + (t ? token(t) : '<b aria-label="المكان الناقص">؟</b>') + '</span>'; }).join('') + '</div>' +
        '<div class="mkids-opts" role="group" aria-label="الاختيارات">' + it.options.map(function (t, i) { return '<button type="button" class="mkids-opt" data-o="' + i + '">' + token(t) + '</button>'; }).join('') + '</div></div>';
    }
    async function trial(level, scored) {
      var it = genPattern(c.rng, level), hint = 0, h = scored ? 1 : 3; draw(it);
      var pat = $('#mkids-pat', c.stage), cells = $$('.mkids-cell', pat), opts = $$('.mkids-opt', pat), k;
      c.say('إيه اللي ييجي مكان علامة الاستفهام؟');
      async function pick() { var b = await c.tap('.mkids-opt'), o = +b.dataset.o; pat.dataset.picks = (+pat.dataset.picks || 0) + 1; if (o !== it.ai) b.classList.add('tried'); return o === it.ai; }
      var first = await pick(), ok = first;
      while (!ok && (c.da || !scored) && h <= 3) {
        hint = h; pat.dataset.hint = h;
        if (h === 1) {
          c.say('بصّ تاني على الأشكال واحد واحد.', 'calm');
          cells.forEach(function (x) { x.classList.add('veil'); });
          for (k = 0; k < cells.length; k++) { await c.wait(320); cells[k].classList.remove('veil'); }
        } else if (h === 2) {
          c.say('شوف اللي بيتكرّر.', 'calm');
          cells.forEach(function (x, i) {
            if (it.kind === 'grid') { if (Math.floor(i / 3) === Math.floor(it.miss / 3) || i % 3 === it.miss % 3) x.classList.add('hl'); }
            else if (it.unit <= 3) x.classList.add('g' + (Math.floor(i / it.unit) % 2));
            else if (it.cells[i] && it.cells[i].s === it.answer.s) x.classList.add('hl');
          });
          var off = opts.filter(function (b) { return b.classList.contains('tried'); })[0]; if (off) off.setAttribute('aria-disabled', 'true');
        } else {
          c.say('ده اللي بيكمّل النمط. دوس عليه.');
          opts.forEach(function (b, i) { if (i === it.ai) b.classList.add('want'); else b.setAttribute('aria-disabled', 'true'); });
        }
        ok = await pick(); h++;
      }
      if (!ok) { c.say('اللي بيكمّل النمط هو ده.', 'calm'); opts[it.ai].classList.add('want'); }
      cells[it.miss].innerHTML = token(it.answer); cells[it.miss].classList.add('filled');
      opts.forEach(function (b) { b.setAttribute('aria-disabled', 'true'); });
      await c.wait(ok ? 500 : 1500);
      return { first: first, hint: hint };
    }
    c.say('نجرّب الأول.'); await c.wait(900);
    var pr = await trial(1, false); await c.cheer(true, 900);
    var stair = new Stair(1, 1, PAT_MAX), N = c.count(10);
    if (c.da) c.res.hints = [0, 0, 0, 0];
    for (var t = 0; t < N && !c.late(); t++) {
      c.dots(t, N);
      var r = await trial(stair.level, true);
      c.res.n++; if (!r.first) c.res.err++; if (c.da) c.res.hints[r.hint]++;
      stair.result(r.first); c.res.lvl = stair.best; c.res.x.trail = stair.trail.join(' ');
      c.dots(t + 1, N); await c.cheer(r.first, 900);
    }
  };

  /* Ring tower: move the whole tower to the starred peg. Moves are counted against the minimum 2^n - 1; nothing is shown to the child. */
  GAMES.tower = async function (c) {
    async function round(nd) {
      var pegs = [[], [], []], moves = 0, bad = 0, sel = -1, min = towerMin(nd), cap = min * 4, last = 0, i;
      for (i = nd; i >= 1; i--) pegs[0].push(i);
      function draw() {
        c.stage.innerHTML = '<div class="mkids-tower" id="mkids-tower" data-discs="' + nd + '" data-moves="' + moves + '">' + [0, 1, 2].map(function (p) {
          return '<button type="button" class="mkids-peg' + (p === 2 ? ' goal' : '') + (p === sel ? ' sel' : '') + '" data-p="' + p + '" data-top="' + (pegs[p][pegs[p].length - 1] || 0) + '" aria-label="العمود ' + (p + 1) + (p === 2 ? ' (الهدف)' : '') + ': ' + pegs[p].length + ' حلقات' + (p === sel ? '، متشال منه حلقة' : '') + '">' +
            (p === 2 ? star('mkids-flag') : '') + '<span class="mkids-rod"></span><span class="mkids-stack">' + pegs[p].map(function (dk) { return '<i class="mkids-disc d' + dk + '"></i>'; }).join('') + '</span></button>';
        }).join('') + '</div>';
        var f = $('.mkids-peg[data-p="' + last + '"]', c.stage); if (f && c.dev.keyboard) f.focus();
      }
      while (pegs[2].length < nd && moves < cap) {
        draw();
        var p = +(await c.tap('.mkids-peg')).dataset.p; last = p;
        if (sel < 0) { if (pegs[p].length) sel = p; }
        else if (p === sel) sel = -1;
        else {
          var dk = pegs[sel][pegs[sel].length - 1], top = pegs[p][pegs[p].length - 1];
          if (top && top < dk) { bad++; c.say('الكبيرة ما تقعدش فوق الصغيرة. جرّب عمود تاني.', 'oh'); }
          else { pegs[sel].pop(); pegs[p].push(dk); moves++; c.sfx(moves); c.say('انقل البرج كله لعمود النجمة.'); }
          sel = -1;
        }
      }
      draw(); await c.wait(500);
      return { solved: pegs[2].length === nd, moves: moves, bad: bad, min: min };
    }
    c.say('نجرّب الأول ببرج صغير.'); await c.wait(900);
    await round(2); await c.cheer(true, 900);
    var stair = new Stair(3, 2, 4), R = c.count(3), x = c.res.x = { rounds: '' }, rs = [];
    for (var t = 0; t < R && !c.late(); t++) {
      c.dots(t, R); c.say('انقل البرج كله لعمود النجمة.');
      var nd = stair.level, r = await round(nd);
      c.res.n++; c.res.err += r.bad; if (r.solved && nd > c.res.lvl) c.res.lvl = nd;
      rs.push(nd + ':' + (r.solved ? r.moves : 'x' + r.moves) + '/' + r.min); x.rounds = rs.join(' ');
      stair.result(r.solved && r.moves <= 2 * r.min);
      c.dots(t + 1, R); await c.cheer(r.solved, 1000);
    }
  };

  /* ---------- words for a session: what happened, in plain numbers, and the child's own earlier session ---------- */
  function median(a) { if (!a || !a.length) return null; var s = a.slice().sort(function (p, q) { return p - q; }), m = s.length >> 1; return s.length % 2 ? s[m] : Math.round((s[m - 1] + s[m]) / 2); }
  function nStars(k) { return H.plural(k, 'نجمة واحدة', 'نجمتين', 'نجوم', 'نجمة'); }
  function times(k) { return k === 0 ? 'ولا مرة' : H.plural(k, 'مرة واحدة', 'مرتين', 'مرات', 'مرة'); }
  function helped(s) { return s.hints ? s.hints[1] + s.hints[2] + s.hints[3] : 0; }
  function describe(s) {
    var x = s.x || {};
    if (!s.n) return 'بدأ اللعبة ووقف قبل أول محاولة محسوبة.';
    if (s.a === 'stars') return (s.lvl ? 'وصل لتسلسل طوله ' + s.lvl + ' وعاده لوحده' : 'جرّب تسلسلات طولها 2 ولسه ما عادش واحد لوحده') + '، في ' + s.n + ' محاولات.' + (s.hints ? ' احتاج مساعدة في ' + helped(s) + ' منها.' : '');
    if (s.a === 'gng') { var g = thOf(s.th).goN, ng = thOf(s.th).nogoN; return g[0] + (g[1] ? ' ظهرت ' : ' ظهر ') + times(x.go) + ' وسلّم ' + (g[1] ? 'عليها' : 'عليه') + ' في ' + x.hit + ' منها. ' + ng[0] + (ng[1] ? ' ظهرت ' : ' ظهر ') + times(x.nogo) + ' واستنى في ' + x.cr + ' منها.'; }
    if (s.a === 'flip') return 'فرز ' + s.n + ' كارت. القاعدة اتغيّرت ' + times(x.sw) + '، وأول كارت بعد التغيير اتحط في مكانه الصح في ' + (x.sw - x.swErr) + ' منها.';
    if (s.a === 'pattern') return (s.lvl ? 'كمّل لوحده أنماط لحد المستوى ' + s.lvl + ' من ' + PAT_MAX + ' (' + PAT_SAY[s.lvl] + ')' : 'جرّب أنماط المستوى الأول ولسه ما كمّلش واحد لوحده') + '، في ' + s.n + ' أنماط.' + (s.hints ? ' احتاج مساعدة في ' + helped(s) + ' منها.' : '');
    if (s.a === 'tower') { var best = towerBest(s); return s.lvl ? 'نقل برج من ' + s.lvl + ' حلقات في ' + best.moves + ' حركة (أقل عدد ممكن ' + best.min + ').' : 'جرّب برج الحلقات ولسه ما نقلوش كله.'; }
    return '';
  }
  function towerBest(s) { var best = null; String((s.x || {}).rounds || '').split(' ').forEach(function (r) { var m = /^(\d):(\d+)\/(\d+)$/.exec(r); if (m && +m[1] === s.lvl && (!best || +m[2] < best.moves)) best = { moves: +m[2], min: +m[3] }; }); return best || { moves: 0, min: towerMin(s.lvl || 3) }; }
  function compare(s, p) {
    if (!p) return 'دي أول جلسة محسوبة في اللعبة دي، فمفيش حاجة نقارن بيها لسه.';
    if ((s.th || '') !== (p.th || '')) return compare(s, { a: p.a, lvl: p.lvl, n: p.n, x: p.x, th: s.th, hints: p.hints }) + ' الجلستين بثيمين مختلفين (' + thName(s.th) + ' و' + thName(p.th) + ')، فالمقارنة أقل دقة.';
    var x = s.x || {}, y = p.x || {}, same = 'زي المرة اللي فاتت';
    if (s.a === 'stars') return s.lvl === p.lvl ? 'أطول تسلسل ' + same + ' (' + s.lvl + ').' : 'أطول تسلسل المرة دي ' + s.lvl + '، والمرة اللي فاتت ' + p.lvl + '.';
    if (s.a === 'gng') return 'داس من غير ما يستنى ' + times(x.fa) + ' من ' + x.nogo + '، والمرة اللي فاتت ' + times(y.fa) + ' من ' + y.nogo + '. ما لحقش يسلّم ' + times(x.miss) + '، والمرة اللي فاتت ' + times(y.miss) + '.';
    if (s.a === 'flip') return 'غلط في أول كارت بعد التغيير ' + times(x.swErr) + ' من ' + x.sw + '، والمرة اللي فاتت ' + times(y.swErr) + ' من ' + y.sw + '.';
    if (s.a === 'pattern') return s.lvl === p.lvl ? 'نفس مستوى المرة اللي فاتت (' + s.lvl + ').' : 'المستوى المرة دي ' + s.lvl + '، والمرة اللي فاتت ' + p.lvl + '.';
    if (s.a === 'tower') { var a = towerBest(s), b = towerBest(p); return s.lvl && p.lvl ? 'المرة دي ' + s.lvl + ' حلقات في ' + a.moves + ' حركة، والمرة اللي فاتت ' + p.lvl + ' حلقات في ' + b.moves + ' حركة.' : 'المرة اللي فاتت ' + (p.lvl ? 'نقل برج من ' + p.lvl + ' حلقات.' : 'ما نقلش البرج كله.'); }
    return '';
  }
  function detail(s) {
    var x = s.x || {};
    if (s.a === 'gng') return 'go ' + x.go + ' · hit ' + x.hit + ' · miss ' + x.miss + ' · no-go ' + x.nogo + ' · false alarm ' + x.fa + ' · early ' + x.early + ' · median RT ' + (median(x.rts) == null ? '-' : median(x.rts) + ' ms') + ' (n=' + (x.rts || []).length + ') · blocks ' + (x.trail || '-');
    if (s.a === 'flip') return 'switches ' + x.sw + ' · switch-trial errors ' + x.swErr + ' · repeat-trial errors ' + x.stayErr + ' · pre-switch errors ' + x.pre + ' · runs ' + (x.trail || '-');
    if (s.a === 'tower') return 'rounds (discs:moves/minimum) ' + (x.rounds || '-') + ' · illegal attempts ' + s.err;
    return 'trials (level+/-) ' + (x.trail || '-');
  }
  var DEV = { touch: 'لمس', mouse: 'ماوس', pen: 'قلم', keyboard: 'كيبورد', unknown: 'غير معروف' };
  function nextAct(id) { var best = ORDER[0], bn = 1e9; ORDER.forEach(function (a) { var k = ofAct(id, a).length; if (k < bn) { bn = k; best = a; } }); return best; }
  function days(id) { var o = {}; logOf(id).forEach(function (s) { o[s.d] = 1; }); return Object.keys(o).length; }

  /* ---------- views ---------- */
  function crumb(kid, here) { return '<p class="mkids-crumb"><a href="#kids">الأطفال</a>' + (kid ? ' <span aria-hidden="true">‹</span> <a href="#kids/' + esc(kid.id) + '">رحلة ' + esc(kid.child) + '</a>' : '') + (here ? ' <span aria-hidden="true">‹</span> <span>' + here + '</span>' : '') + '</p>'; }
  function grown(kid, cur) {
    var spec = H.state().role === 'specialist', L = [['parent', 'متابعة ولي الأمر'], ['spec', 'عرض الأخصائي'], ['plan', 'مسودة خطة التنمية'], ['fit', 'تخصيص حسب الطفل']].filter(function (l) { return spec || l[0] === 'parent' || l[0] === 'fit'; });
    return '<nav class="mkids-grown" aria-label="للكبار"><span class="mkids-grown-l">للكبار</span>' + L.map(function (l) { return '<a class="btn' + (cur === l[0] ? ' on' : '') + '" href="#kids/' + esc(kid.id) + '/' + l[0] + '"' + (cur === l[0] ? ' aria-current="page"' : '') + '>' + l[1] + '</a>'; }).join('') + '<a class="btn ghost" href="#kids/about">عن الألعاب</a></nav>';
  }
  var TONES = ['mint', 'sun', 'lilac', 'coral'];
  function face(i) { var t = { s: i % 4, c: i % 4, z: 2 }; return '<span class="mkids-face">' + token(t) + '<svg class="mkids-face-f" viewBox="-50 -50 100 100" aria-hidden="true" focusable="false"><circle cx="-13" cy="-4" r="5"/><circle cx="13" cy="-4" r="5"/><path d="M-13 12q13 11 26 0"/></svg></span>'; }

  function vEmpty(main) {
    main.innerHTML = '<header class="head"><h1 class="mega" data-reveal="words">ألعاب <em>وأنشطة</em> الأطفال</h1><p class="lead">الألعاب بتشتغل لطفل مسجّل بموافقة ولي أمره. التسجيل بياخد دقيقة.</p></header>' +
      '<section class="mkids-empty block tile mint"><div class="mkids-empty-art">' + buddy() + '</div><div><h2>لسه مفيش طفل مسجّل</h2><p>سجّل الطفل الأول من صفحة «أولادي»، وبعدها ارجع هنا وابدأوا اللعب.</p><p class="row"><a class="btn inked big" href="#family">سجّل طفل</a><a class="btn onblock" href="#kids/about">عن الألعاب</a></p></div></section>' +
      '<p class="notice mkids-cav">' + CAVEAT + '</p>';
  }
  function vPick(main) {
    var d = D(), ks = kidsList();
    main.innerHTML = DEFS + '<header class="head"><h1 class="mega" data-reveal="words">مين هيلعب <em>النهارده</em>؟</h1><p class="lead">اختار الطفل. كل جلسة لعب من 3 لـ 5 دقايق، وزرار «مش عاوز ألعب دلوقتي» موجود في كل شاشة.</p></header>' +
      '<div class="mkids-pick" data-stagger="80">' + ks.map(function (k, i) {
        var cnt = logOf(k.id).length;
        return '<a class="mkids-kid block tile ' + TONES[i % 4] + '" href="#kids/' + esc(k.id) + '" data-kid="' + esc(k.id) + '">' + face(i + 1) + '<strong>' + esc(k.child) + '</strong><span class="mkids-kid-m">' + esc(k.grade) + '</span><span class="mkids-kid-s">' + star() + (cnt ? n(cnt) + ' ' + (cnt === 1 ? 'نجمة' : cnt === 2 ? 'نجمتين' : cnt <= 10 ? 'نجوم' : 'نجمة') : 'أول رحلة') + '</span></a>';
      }).join('') + '</div>' +
      '<section class="mkids-adults"><h2>للكبار</h2><div class="row"><a class="btn" href="#kids/about">إيه اللي الألعاب دي بتمرّنه؟</a><a class="btn" href="#family">سجّل طفل تاني</a>' +
      '<button type="button" class="btn" id="mkids-sound" aria-pressed="' + (d.sound ? 'true' : 'false') + '">' + (d.sound ? 'الصوت شغّال' : 'الصوت مقفول') + '</button></div><p class="notice mkids-cav">' + CAVEAT + '</p></section>';
    $('#mkids-sound', main).addEventListener('click', function () { d.sound = !d.sound; H.save(); this.setAttribute('aria-pressed', d.sound ? 'true' : 'false'); this.textContent = d.sound ? 'الصوت شغّال' : 'الصوت مقفول'; if (d.sound) beep(4); });
  }
  function vJourney(main, kid) {
    var lg = logOf(kid.id), cnt = lg.length, nx = nextAct(kid.id), lap = cnt % 10, dn = days(kid.id), A = ACTS[nx], K = cfg(kid.id);
    var P = [[70, 196], [168, 118], [262, 190], [352, 92], [452, 168], [548, 70], [640, 150], [736, 62], [826, 142], [930, 60]], path = 'M' + P.map(function (p) { return p[0] + ' ' + p[1]; }).join(' L');
    var map = '<svg class="mkids-map-svg" viewBox="0 0 1000 250" role="img" aria-label="خريطة الرحلة: ' + lap + ' من 10 نجوم في اللفة دي"><path class="mkids-trail" d="' + path + '"/>' + (lap > 1 ? '<path class="mkids-trail on" d="M' + P.slice(0, lap).map(function (p) { return p[0] + ' ' + p[1]; }).join(' L') + '"/>' : '') +
      P.map(function (p, i) { var on = i < lap, nxt = i === lap, z = on ? 46 : nxt ? 40 : 22; return (nxt ? '<circle class="mkids-here" cx="' + p[0] + '" cy="' + p[1] + '" r="30"/>' : '') + '<use class="mkids-node' + (on ? ' on' : nxt ? ' next' : '') + '" href="#star4" x="' + (p[0] - z / 2) + '" y="' + (p[1] - z / 2) + '" width="' + z + '" height="' + z + '"/>'; }).join('') + '</svg>';
    var stickers = ''; for (var i = 0; i < Math.min(dn, 12); i++) stickers += face(i);
    main.innerHTML = DEFS + crumb() + '<header class="head mkids-j-head"><h1 class="mega">رحلة <em>' + esc(kid.child) + '</em></h1></header>' +
      '<div class="mkids-j"><section class="mkids-map tile" data-reveal><div class="mkids-map-top"><p class="mkids-count"><span class="num" id="mkids-total">' + cnt + '</span><span>' + (cnt === 1 ? 'نجمة' : cnt === 2 ? 'نجمتين' : cnt >= 3 && cnt <= 10 ? 'نجوم' : 'نجمة') + ' في رحلتك</span></p><p class="mkids-map-say">كل مرة تلعب وتحاول، نجمة جديدة بتنوّر.</p></div>' + map +
      (dn ? '<div class="mkids-stickers"><span class="mkids-stickers-l">' + (dn === 1 ? 'يوم لعب واحد' : dn === 2 ? 'يومين لعب' : n(dn) + ' ' + (dn <= 10 ? 'أيام لعب' : 'يوم لعب')) + '</span>' + stickers + '</div>' : '') + '</section>' +
      '<a class="mkids-next block tile ' + (A.tone === 'night' ? 'mkids-night' : A.tone) + '" href="#kids/' + esc(kid.id) + '/' + nx + '" id="mkids-next" data-act="' + nx + '" data-glow-host><span class="block-label">اللعبة الجاية</span><strong class="block-title">' + (nx === 'gng' ? thOf(K.th).gq : A.name) + '</strong>' + ART[nx] + '<span class="mkids-playbtn">يلا نلعب</span></a>' +
      '<a class="mkids-me tile" href="#kids/' + esc(kid.id) + '/me" id="mkids-me"><span class="mkids-me-b">' + toon(K.bud.ch, { col: K.bud.col, acc: K.bud.acc }) + '</span><span class="mkids-me-t"><strong>' + (K.bud.name ? esc(K.bud.name) : 'صاحبك في اللعب') + '</strong><span>بتحب إيه؟ دلوقتي: ' + thOf(K.th).name + '</span></span><span class="mkids-me-go">غيّر الشكل</span></a>' +
      '<ul class="mkids-acts">' + ORDER.filter(function (a) { return a !== nx; }).map(function (a) { var k = ofAct(kid.id, a).length; return '<li><a class="mkids-act ' + (ACTS[a].tone === 'night' ? 'mkids-night' : ACTS[a].tone) + '" href="#kids/' + esc(kid.id) + '/' + a + '" data-act="' + a + '">' + ART[a] + '<strong>' + ACTS[a].name + '</strong><span class="mkids-act-n">' + (k ? star() + n(k) : 'جديدة') + '</span></a></li>'; }).join('') + '</ul></div>' +
      grown(kid);
  }

  function vParent(main, kid) {
    var lg = logOf(kid.id), acts = ORDER.filter(function (a) { return ofAct(kid.id, a).length; }).sort(function (a, b) { var x = ofAct(kid.id, a), y = ofAct(kid.id, b); return lg.indexOf(y[y.length - 1]) - lg.indexOf(x[x.length - 1]); });
    var h = DEFS + crumb(kid, 'متابعة ولي الأمر') + '<header class="head"><h1 class="mega">' + esc(kid.child) + ' <em>عمل إيه</em>؟</h1><p class="lead">وصف بسيط للي حصل في اللعب، ومقارنة بجلسات ' + esc(kid.child) + ' نفسه بس. مفيش مستويات ولا مقارنة بأطفال تانيين.</p></header>' + grown(kid, 'parent');
    if (!lg.length) h += '<section class="mkids-none tile"><h2>لسه مفيش جلسات</h2><p>أول ما ' + esc(kid.child) + ' يلعب أول لعبة، هتلاقي هنا وصف للي حصل.</p><p><a class="btn primary" href="#kids/' + esc(kid.id) + '">افتح الرحلة</a></p></section>';
    else {
      var last = lg[lg.length - 1], C = CONS[ACTS[last.a].cons], tip = C.home[(ofAct(kid.id, last.a).length - 1) % C.home.length];
      h += '<div class="mkids-pgrid"><div class="mkids-reps">' + acts.map(function (a, i) {
        var ss = ofAct(kid.id, a), s = ss[ss.length - 1], scored = ss.filter(function (q) { return q.n > 0 && q !== s; }), prev = scored[scored.length - 1], notes = ss.filter(function (q) { return q.note; }).slice(-3);
        return '<article class="mkids-rep tile' + (i === 0 ? ' first' : '') + '" data-act="' + a + '"><div class="mkids-rep-art mkids-tone-' + ACTS[a].tone + '">' + ART[a] + '</div><div class="mkids-rep-b"><h2>' + ACTS[a].name + '</h2><p class="mkids-rep-what">' + esc(describe(s)) + '</p>' +
          (s.n ? '<p class="mkids-rep-cmp">' + esc(compare(s, prev)) + '</p>' : '') + (s.done ? '' : '<p class="small muted">الجلسة دي وقفت قبل آخرها، وده عادي.</p>') +
          '<p class="small muted">آخر جلسة ' + fmtDate(s.d) + ' · ' + (ss.length === 1 ? 'جلسة واحدة' : ss.length === 2 ? 'جلستين' : n(ss.length) + ' جلسات') + ' · الثيم: ' + thName(s.th) + ' · اللعبة بتمرّن ' + CONS[ACTS[a].cons].plain + '.</p>' +
          (notes.length ? '<ul class="mkids-rep-notes">' + notes.map(function (q) { return '<li>' + fmtDate(q.d) + ': ' + esc(q.note) + '</li>'; }).join('') + '</ul>' : '') + '</div></article>';
      }).join('') + '</div><aside class="mkids-side"><section class="mkids-tip block tile sun"><span class="block-label">نشاط للبيت من غير شاشة</span><h2>' + C.name + '</h2><p>' + tip + '</p><p class="small">اللعب ده للمتعة والتمرين مع بعض، مش واجب ولا امتحان.</p></section>' +
        '<p class="notice mkids-cav">' + CAVEAT + '</p></aside></div>';
    }
    main.innerHTML = h;
  }

  function chart(ss, A) {
    var W = 280, Hh = 140, L = 26, R = 12, T = 24, B = 22, max = A.max, pts = ss.map(function (s, i) { return [ss.length === 1 ? (L + (W - R)) / 2 : L + i * (W - L - R) / (ss.length - 1), T + (Hh - T - B) * (1 - s.lvl / max), s]; });
    var g = ''; for (var y = 0; y <= max; y += max > 6 ? 3 : 2) { var yy = T + (Hh - T - B) * (1 - y / max); g += '<line class="mkids-grid" x1="' + L + '" x2="' + (W - R) + '" y1="' + yy + '" y2="' + yy + '"/><text class="mkids-tick" x="' + (L - 6) + '" y="' + (yy + 4) + '" text-anchor="end">' + y + '</text>'; }
    return '<svg class="mkids-chart" viewBox="0 0 ' + W + ' ' + Hh + '" role="img" aria-label="' + A.unit + ' عبر ' + ss.length + ' جلسات: ' + ss.map(function (s) { return s.lvl; }).join('، ') + '">' + g +
      (pts.length > 1 ? '<polyline class="mkids-line" points="' + pts.map(function (p) { return p[0].toFixed(1) + ',' + p[1].toFixed(1); }).join(' ') + '"/>' : '') +
      pts.map(function (p) { return (p[2].done ? '<circle class="mkids-pt" cx="' + p[0].toFixed(1) + '" cy="' + p[1].toFixed(1) + '" r="5"/>' : '<rect class="mkids-pt part" x="' + (p[0] - 4.5).toFixed(1) + '" y="' + (p[1] - 4.5).toFixed(1) + '" width="9" height="9"/>') + '<text class="mkids-val" x="' + p[0].toFixed(1) + '" y="' + (p[1] - 9).toFixed(1) + '" text-anchor="middle">' + p[2].lvl + '</text>'; }).join('') +
      '<text class="mkids-tick" x="' + L + '" y="' + (Hh - 5) + '" text-anchor="start">1</text>' + (ss.length > 1 ? '<text class="mkids-tick" x="' + (W - R) + '" y="' + (Hh - 5) + '" text-anchor="end">' + ss.length + '</text>' : '') + '</svg>';
  }
  function csv(kid) {
    var cols = ['child_id', 'child', 'date', 'time', 'activity', 'completed', 'difficulty_reached', 'trials', 'errors', 'graded_help', 'hint0', 'hint1', 'hint2', 'hint3', 'duration_s', 'device', 'viewport', 'details', 'hit_rt_ms_raw', 'adult_note', 'theme', 'session_length'];
    function q(v) { v = v == null ? '' : String(v); if (/^[=+\-@]/.test(v)) v = "'" + v; return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; }
    var rows = logOf(kid.id).map(function (s) { var hh = s.hints || ['', '', '', '']; return [kid.id, kid.child, s.d, s.t, s.a, s.done, s.lvl, s.n, s.err, s.da, hh[0], hh[1], hh[2], hh[3], s.dur, s.dev, s.vp, detail(s), ((s.x || {}).rts || []).join(' '), s.note, s.th || '', s.len || ''].map(q).join(','); });
    return '﻿' + cols.join(',') + '\n' + rows.join('\n') + '\n';
  }
  function gate(main, kid, what) {
    if (H.state().role === 'specialist') return false;
    main.innerHTML = crumb(kid, what) + '<header class="head"><h1>' + what + '</h1><p class="lead">الصفحة دي للأخصائي. لو إنت أخصائي، غيّر دورك من زرار الدور، وبعدها ارجع هنا.</p><p class="row"><a class="btn primary" href="#role">غيّر الدور</a><a class="btn" href="#kids/' + esc(kid.id) + '/parent">متابعة ولي الأمر</a></p></header>';
    return true;
  }
  function vSpec(main, kid) {
    if (gate(main, kid, 'عرض الأخصائي')) return;
    var d = D(), lg = logOf(kid.id);
    var h = crumb(kid, 'عرض الأخصائي') + '<header class="head"><h1 class="mega">أرقام <em>' + esc(kid.child) + '</em> الخام</h1><p class="lead">' + esc(kid.grade) + ' · ' + n(kid.age) + ' سنة · ' + (lg.length === 1 ? 'جلسة واحدة' : lg.length === 2 ? 'جلستين' : n(lg.length) + ' جلسات') + '. أرقام وصفية من لعب على جهاز شخصي، من غير تفسير معياري.</p></header>' + grown(kid, 'spec') + '<p class="notice mkids-cav">' + CAVEAT + '</p>' +
      '<div class="mkids-thnote card"><p><strong>الثيم والمتابعة.</strong> الثيم بيغيّر الشكل بس، لكن مقارنة جلسات اتلعبت بثيمات مختلفة بتزوّد التشويش: المثيرات شكلها مختلف حتى لو المهمة واحدة. الثيم الحالي: <strong>' + thName(cfg(kid.id).th) + '</strong>.</p><button type="button" class="btn" id="mkids-lock" aria-pressed="' + (locked(kid.id) ? 'true' : 'false') + '">' + (locked(kid.id) ? 'الثيم متثبّت للمتابعة (دوس للفك)' : 'ثبّت الثيم للمتابعة') + '</button></div>';
    if (!lg.length) h += '<section class="mkids-none tile"><h2>لسه مفيش جلسات</h2><p>الجدول والرسم هيظهروا بعد أول جلسة لعب.</p></section>';
    else {
      h += '<section class="mkids-charts" aria-label="الصعوبة اللي وصلها عبر الجلسات">' + ORDER.filter(function (a) { return ofAct(kid.id, a).length; }).map(function (a) {
        var ss = ofAct(kid.id, a), hs = [0, 0, 0, 0], any = false; ss.forEach(function (s) { if (s.hints) { any = true; s.hints.forEach(function (v, i) { hs[i] += v; }); } });
        var ths = []; ss.forEach(function (q) { var t = thName(q.th); if (ths.indexOf(t) < 0) ths.push(t); });
        return '<figure class="mkids-fig tile" data-act="' + a + '"><figcaption><strong>' + ACTS[a].name + '</strong><span class="small muted">' + ACTS[a].unit + ' (من ' + ACTS[a].max + ') في كل جلسة</span></figcaption>' + chart(ss, ACTS[a]) +
          (any ? '<p class="mkids-hints small" data-hints="' + hs.join(',') + '">درجات المساعدة في كل المحاولات: من غير ' + n(hs[0]) + ' · إعادة ' + n(hs[1]) + ' · توضيح ' + n(hs[2]) + ' · حل مشترك ' + n(hs[3]) + '</p>' : ACTS[a].da ? '<p class="mkids-hints small muted">المساعدة المتدرجة كانت مقفولة.</p>' : '') + (ths.length > 1 ? '<p class="mkids-mixed small">الجلسات دي بأكتر من ثيم (' + ths.join('، ') + ')، فالفروق بينها فيها تشويش زيادة.</p>' : '') + '</figure>';
      }).join('') + '</section><p class="small muted">الدايرة جلسة كملت، والمربع جلسة وقفت قبل آخرها. المحور الأفقي ترتيب الجلسة.</p>' +
        '<section class="mkids-raw card"><div class="mkids-raw-h"><h2>كل الجلسات</h2><button type="button" class="btn primary" id="mkids-csv">' + H.ic('download') + 'نزّل CSV</button></div>' +
        '<div class="tablewrap" tabindex="0" role="region" aria-label="جدول الجلسات"><table class="mkids-table"><thead><tr><th>التاريخ</th><th>اللعبة</th><th>الثيم</th><th>كملت</th><th>الصعوبة</th><th>محاولات</th><th>أخطاء</th><th>مساعدة 0/1/2/3</th><th>المدة (ث)</th><th>الجهاز</th><th>تفاصيل خام</th><th>ملاحظة الكبير</th></tr></thead><tbody>' +
        lg.slice().reverse().map(function (s) { return '<tr data-act="' + s.a + '"><td>' + fmtDate(s.d) + ' <bdi class="num small muted">' + esc(s.t) + '</bdi></td><td>' + ACTS[s.a].name + '</td><td>' + thName(s.th) + '</td><td>' + (s.done ? 'أيوه' : 'وقفت') + '</td><td class="num">' + s.lvl + '</td><td class="num">' + s.n + '</td><td class="num">' + s.err + '</td><td class="num"><bdi dir="ltr">' + (s.hints ? s.hints.join('/') : '-') + '</bdi></td><td class="num">' + s.dur + '</td><td>' + (DEV[s.dev] || esc(s.dev)) + ' <bdi class="num small muted" dir="ltr">' + esc(s.vp) + '</bdi></td><td class="mkids-det"><bdi dir="ltr">' + esc(detail(s)) + '</bdi></td><td>' + esc(s.note) + '</td></tr>'; }).join('') +
        '</tbody></table></div><p class="small muted">الصعوبة: أعلى درجة نجح فيها الطفل من غير مساعدة. أزمنة الاستجابة بيانات خام بس: توقيت المتصفح والموبايل مش دقيق كفاية لمقارنات، وبيتأثر بالجهاز والشاشة. المدة بتشمل التجربة والشرح.</p></section>';
    }
    h += '<section class="mkids-obs card"><label for="mkids-obs">ملاحظات الأخصائي عن ' + esc(kid.child) + '<span class="hint">سلوك الطفل وقت اللعب، ظروف الجلسة، وأي حاجة الأرقام ما بتقولهاش. بتتحفظ على الجهاز ده.</span></label><textarea id="mkids-obs">' + esc(d.notes[kid.id] || '') + '</textarea><p class="row mkids-obs-end"><a class="btn" href="#kids/' + esc(kid.id) + '/plan">افتح مسودة خطة التنمية</a></p></section>';
    main.innerHTML = h;
    $('#mkids-obs', main).addEventListener('input', function () { d.notes[kid.id] = this.value; H.save(); });
    $('#mkids-lock', main).addEventListener('click', function () { cfg(kid.id).lock = !locked(kid.id); H.save(); vSpec(main, kid); $('#mkids-lock', main).focus(); H.toast(locked(kid.id) ? 'الثيم اتثبّت' : 'الثيم اتفك'); });
    var b = $('#mkids-csv', main); if (b) b.addEventListener('click', function () {
      var a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv(kid)], { type: 'text/csv;charset=utf-8' })); a.download = 'kids-sessions-' + kid.id + '.csv'; document.body.appendChild(a); a.click(); a.remove(); setTimeout(function () { URL.revokeObjectURL(a.href); }, 4000); H.toast('الملف نزل');
    });
  }

  function propose(cid) {
    var C = CONS[cid], dt = new Date(Date.now() + 28 * 864e5), rev = ('0' + dt.getDate()).slice(-2) + '/' + ('0' + (dt.getMonth() + 1)).slice(-2) + '/' + dt.getFullYear();
    return { cons: cid, goal: 'فرص لعب منتظمة تمرّن ' + C.name + ': ' + C.plain + '.',
      tool: C.acts.map(function (a) { return '«' + ACTS[a].name + '»' + (ACTS[a].da ? ' مع المساعدة المتدرجة' : ''); }).join('، ') + '، مع لعبة تانية من اختيار الطفل علشان التنويع.',
      off: C.home.join('\n'), freq: '3 مرات في الأسبوع، في أيام متفرقة', dur: 'من 10 لـ 15 دقيقة: لعبة واحدة على المنصة (3 لـ 5 دقايق) ونشاط واحد من غير شاشة',
      watch: C.watch + '\nوكمان: مزاج الطفل، التعب، الدوشة، والجهاز المستخدم في كل جلسة.', review: 'بعد 4 أسابيع (' + rev + '): نراجع الملاحظات مع ولي الأمر ونقرر نكمّل أو نعدّل.', note: '' };
  }
  var PF = [['goal', 'الهدف', 'area'], ['tool', 'أنشطة على المنصة', 'area'], ['off', 'أنشطة من غير شاشة', 'area'], ['freq', 'التكرار', 'area'], ['dur', 'مدة الجلسة', 'area'], ['watch', 'نلاحظ إيه', 'area'], ['review', 'موعد المراجعة', 'area'], ['note', 'ملاحظات الأخصائي', 'area']];
  function vPlan(main, kid) {
    if (gate(main, kid, 'مسودة خطة التنمية')) return;
    var d = D(), pl = d.plans[kid.id] || null;
    main.innerHTML = crumb(kid, 'مسودة خطة التنمية') + '<div class="mkids-plan"><header class="head"><p class="mkids-stamp">مسودة يعتمدها الأخصائي</p><h1>خطة تنمية فردية: ' + esc(kid.child) + '</h1><p class="lead">' + esc(kid.grade) + ' · ' + n(kid.age) + ' سنة · ' + fmtDate(pl && pl.date || H.today()) + '</p></header>' + grown(kid, 'plan') +
      '<section class="card mkids-plan-pick"><div class="mkids-plan-row"><div class="fld">' + H.sel('mkids-cons', 'الهدف هيركّز على إيه؟', Object.keys(CONS).map(function (k) { return [k, CONS[k].name]; }), pl ? pl.cons : '', 'الاقتراح نقطة بداية بس. كل خانة تحت تتعدّل.') + '</div><button type="button" class="btn primary" id="mkids-prop">اقترح خطة</button></div><p class="err" id="mkids-plan-err" role="alert"></p></section>' +
      '<form class="card form mkids-plan-f" id="mkids-plan-f"' + (pl ? '' : ' hidden') + '>' + PF.map(function (f) { return '<div class="fld mkids-pf" data-k="' + f[0] + '">' + H.field('mkids-p-' + f[0], f[1], pl ? pl[f[0]] : '', '', f[2] || 'text') + '<div class="mkids-print" aria-hidden="true"></div></div>'; }).join('') +
      '<p class="notice mkids-plan-cav">مقترح مبدئي مبني على طبيعة الألعاب، مش على قياس مقنن. الدليل العلمي على إن التمرّن على ألعاب زي دي بينتقل أثره للدراسة والحياة اليومية محدود ومختلَف عليه، فالخطة بتوصف فرص لعب وملاحظة، مش علاج. القرار للأخصائي بعد ما يشوف الطفل.</p>' +
      '<p class="mkids-sign">اعتماد الأخصائي: الاسم ........................ التوقيع ........................ التاريخ ................</p>' +
      '<p class="form-end row"><button type="button" class="btn primary" id="mkids-print">اطبع المسودة</button><span class="small muted" id="mkids-plan-saved" role="status"></span></p></form></div>';
    var form = $('#mkids-plan-f', main);
    function mirror() { $$('.mkids-pf', form).forEach(function (w) { $('.mkids-print', w).textContent = $('input,textarea', w).value; }); }
    function fill() { PF.forEach(function (f) { $('#mkids-p-' + f[0], main).value = pl[f[0]] || ''; }); form.hidden = false; mirror(); }
    $('#mkids-prop', main).addEventListener('click', function () {
      var v = $('#mkids-cons', main).value, err = $('#mkids-plan-err', main);
      if (!v) { err.textContent = 'اختار الهدف الأول.'; return; }
      err.textContent = '';
      if (pl && pl.cons && !window.confirm('الاقتراح الجديد هيمسح اللي مكتوب في الخطة. نكمّل؟')) return;
      pl = d.plans[kid.id] = propose(v); pl.date = H.today(); H.save(); fill(); H.toast('اتحفظ');
    });
    form.addEventListener('input', function (e) { var w = e.target.closest('.mkids-pf'); if (!w || !pl) return; pl[w.dataset.k] = e.target.value; H.save(); mirror(); $('#mkids-plan-saved', main).textContent = 'اتحفظ على الجهاز'; });
    $('#mkids-print', main).addEventListener('click', function () { mirror(); window.print(); });
    if (pl) mirror();
  }

  function vAbout(main) {
    main.innerHTML = DEFS + crumb(null, 'عن الألعاب') + '<header class="head"><h1 class="mega" data-reveal="words">اللعب <em>شغل الطفل</em></h1><p class="lead">وهو بيلعب، الطفل بيتمرّن على إنه يفتكر، ويستنى، ويغيّر طريقته، ويلاقي النظام في الحاجات. الصفحة دي بتشرح كل لعبة بتمرّن إيه، وإيه اللي المنصة ما بتدّعيهوش.</p></header>' +
      '<section class="mkids-why"><div class="mkids-why-t tile block lilac"><h2>ليه اللعب مهم؟</h2><p>في اللعب الطفل بيجرّب من غير خوف من الغلط: بيحاول، يغلط، ويحاول تاني. وده نفسه التمرين.</p><p>ولما كبير يلعب معاه ويساعده «على قدّ الحاجة» (يعيد، يوضّح، وبعدين يورّيه)، الطفل بيعمل مع المساعدة حاجات لسه ما يقدرش عليها لوحده. دي فكرة فيجوتسكي عن «منطقة النمو القريبة»، وعليها مبنية المساعدة المتدرجة في ألعابنا.</p></div>' +
      '<div class="mkids-why-s tile"><h2>إزاي تلعبوا</h2><ul><li>جلسة قصيرة: من 3 لـ 5 دقايق، ولعبة واحدة تكفي.</li><li>مكان هادي والطفل مش تعبان ولا جعان.</li><li>امدح المحاولة والتركيز، مش النتيجة.</li><li>لو قال «مش عاوز»، وقفوا. الزرار موجود علشان كده.</li></ul></div></section>' +
      '<section class="mkids-thabout tile"><h2>الثيمات والشخصيات: بتغيّر إيه وما بتغيّرش إيه</h2><div class="mkids-thabout-row">' + TH_ORDER.map(function (t) { return '<span class="mkids-thabout-c mkids-tone-' + THEMES[t].tone + '">' + toon(THEMES[t].go) + '</span>'; }).join('') + '</div>' +
      '<p>الطفل بيختار اللي بيحبه (' + TH_ORDER.map(function (t) { return THEMES[t].name; }).join('، ') + ') وبيختار صاحب يلعب معاه ويسمّيه. كل الشخصيات مرسومة للمنصة مخصوص.</p>' +
      '<ul><li><strong>بيتغيّر:</strong> شكل الشخصيات والأشياء، الخلفية، وكلام التعليمات.</li><li><strong>ما بيتغيّرش:</strong> المهمة نفسها. عدد المحاولات، ترتيبها، قواعد الصعوبة، وطريقة التسجيل واحدة في كل الثيمات. في كل ثيم فيه 4 أشكال مختلفة في حدودها الخارجية، ونفس الألوان الأربعة كل لون بنقشته، وشخصيتين مختلفتين في الشكل واللون للعبة «استنى».</li><li><strong>اللي ما نعرفوش:</strong> ما قسناش إن الأشكال في كل الثيمات سهلة التمييز بنفس الدرجة. علشان كده بنسجّل الثيم مع كل جلسة، وبننصح بتثبيت ثيم واحد لما يكون الهدف المتابعة.</li><li><strong>تخصيص حسب الطفل:</strong> للكبار اختيارات لألوان أهدى، حركة أقل، تباين أعلى، أهداف أكبر، من غير صوت، ومدة الجلسة، علشان الطفل اللي بيتشتّت أو بيتضايق بسرعة.</li></ul></section>' +
      '<section class="mkids-games"><h2>كل لعبة بتمرّن إيه</h2>' + ORDER.map(function (a, i) { var A = ACTS[a], C = CONS[A.cons]; return '<article class="mkids-game' + (i % 2 ? ' alt' : '') + '"><div class="mkids-game-art mkids-tone-' + A.tone + '">' + ART[a] + '</div><div><h3>' + A.name + '</h3><p class="mkids-game-c">' + C.name + ': ' + C.plain + '.</p><p>' + A.about + '</p><p class="small muted">الأساس العلمي: ' + A.basis + '</p><p class="small"><strong>في البيت:</strong> ' + C.home[0] + '</p></div></article>'; }).join('') + '</section>' +
      '<section class="mkids-not tile"><h2>اللي المنصة ما بتدّعيهوش</h2><ul><li>دي مش اختبارات ذكاء ولا اختبارات مقننة، ومفيش لها معايير مصرية نقارن بيها.</li><li>مفيش تشخيص. الأرقام ما تقولش إن الطفل عنده مشكلة أو ما عندوش.</li><li>مش بنقارن طفلك بأي طفل تاني، ولا بنحط له مستوى أو لقب.</li><li>الفرق بين جلسة والتانية ممكن يكون تعوّد على اللعبة، أو مزاج، أو تعب، أو جهاز مختلف، أو دوشة.</li><li>ما نقدرش نوعد إن اللعب هنا «يرفع» الذاكرة أو التركيز في المدرسة. الدليل العلمي على انتقال أثر ألعاب التدريب للحياة اليومية محدود ومختلَف عليه.</li><li>أزمنة الاستجابة على الموبايل والمتصفح مش دقيقة، وبنسجّلها كبيانات خام بس.</li></ul><p>لو عندك قلق على طفلك، كلّم أخصائي نفسي أو طبيب أطفال. المنصة ما تغنيش عن ده.</p><p class="row"><a class="btn primary" href="#kids">روح للألعاب</a></p></section>';
  }

  function vMe(main, kid, focusSel) {
    var K = cfg(kid.id), lk = locked(kid.id), B = K.bud, chars = ['block'].concat(TH_ORDER.map(function (t) { return THEMES[t].go; }));
    function radio(cls, attr, val, on, inner, off) { return '<button type="button" class="' + cls + '" role="radio" aria-checked="' + (on ? 'true' : 'false') + '" ' + attr + '="' + val + '"' + (off ? ' disabled' : '') + '>' + inner + '</button>'; }
    main.innerHTML = crumb(kid, 'بتحب إيه؟') + '<header class="head"><h1 class="mega">بتحب <em>إيه</em>؟</h1><p class="lead">اختار اللي تحبه، والألعاب كلها هتلبسه.</p></header>' +
      (lk ? '<p class="notice" id="mkids-locknote">الشكل متثبّت دلوقتي علشان المتابعة تبقى أوضح. الكبار يقدروا يفكّوه من «تخصيص حسب الطفل».</p>' : '') +
      '<div class="mkids-themes" role="radiogroup" aria-label="الثيم">' + TH_ORDER.map(function (t) { var T = THEMES[t]; return radio('mkids-th mkids-tone-' + T.tone, 'data-th', t, K.th === t, '<span class="mkids-th-art">' + toon(T.go) + toon(T.nogo, { cls: 'mkids-th-2' }) + '</span><strong>' + T.name + '</strong>', lk && K.th !== t); }).join('') + '</div>' +
      '<section class="mkids-budsec tile"><div class="mkids-bud-prev" id="mkids-bud-prev">' + toon(B.ch, { col: B.col, acc: B.acc, mood: 'yay' }) + '<strong id="mkids-bud-name">' + (B.name ? esc(B.name) : 'صاحبك') + '</strong></div><div class="mkids-bud-opts"><h2>صاحبك في اللعب</h2>' +
      '<div class="mkids-chs" role="radiogroup" aria-label="الشخصية">' + chars.map(function (ch) { return radio('mkids-ch', 'data-ch', ch, B.ch === ch, toon(ch, { col: B.ch === ch ? B.col : null }) + '<span class="sr">' + CH[ch].n + '</span>'); }).join('') + '</div>' +
      '<h3>اللون</h3><div class="mkids-cols" role="radiogroup" aria-label="لون الصاحب">' + BCOL.map(function (nm, i) { return radio('mkids-sw mkids-bc' + i, 'data-col', i, B.col === i, '<i></i><span>' + nm + '</span>'); }).join('') + '</div>' +
      '<h3>حاجة يلبسها</h3><div class="mkids-accs" role="radiogroup" aria-label="إكسسوار">' + ACCS.map(function (a) { return radio('mkids-ac', 'data-acc', a[0] || 'none', B.acc === a[0], '<span>' + a[1] + '</span>'); }).join('') + '</div>' +
      '<label for="mkids-bname">اسم صاحبك<span class="hint">للكبار: اختاروا اسم للشخصية، مش اسم الطفل الكامل. الاسم بيتحفظ على الجهاز ده بس.</span></label><input type="text" id="mkids-bname" maxlength="16" value="' + esc(B.name) + '" autocomplete="off"></div></section>' +
      '<p class="mkids-me-end"><a class="mkids-playbtn" href="#kids/' + esc(kid.id) + '">يلا على الرحلة</a></p>';
    main.onclick = null;
    $$('[role=radio]', main).forEach(function (b) {
      b.addEventListener('click', function () {
        var sel;
        if (b.dataset.th) { if (locked(kid.id)) return; K.th = b.dataset.th; sel = '[data-th="' + K.th + '"]'; }
        else if (b.dataset.ch) { B.ch = b.dataset.ch; B.col = CH[B.ch].col; sel = '[data-ch="' + B.ch + '"]'; }
        else if (b.dataset.col) { B.col = +b.dataset.col; sel = '[data-col="' + B.col + '"]'; }
        else { B.acc = b.dataset.acc === 'none' ? '' : b.dataset.acc; sel = '[data-acc="' + b.dataset.acc + '"]'; }
        H.save(); vMe(main, kid, sel);
      });
    });
    $('#mkids-bname', main).addEventListener('input', function () { B.name = this.value.trim().slice(0, 16); H.save(); $('#mkids-bud-name', main).textContent = B.name || 'صاحبك'; });
    if (focusSel && $(focusSel, main)) $(focusSel, main).focus();
  }
  var FITS = [['calm', 'ألوان وخلفيات أهدى', 'خلفية سادة هادية من غير رسومات في الخلفية.'], ['still', 'حركة أقل', 'الشخصيات ما بترمش ولا بتتنطط، والانتقالات فورية.'], ['contrast', 'تباين أعلى', 'خلفية بيضا وحدود أتخن.'], ['big', 'أهداف أكبر', 'زراير وأشكال أكبر للّمس.'], ['mute', 'من غير صوت', 'يقفل الأصوات للطفل ده حتى لو الصوت شغّال.']];
  function vFit(main, kid) {
    var K = cfg(kid.id), F = K.fit;
    main.innerHTML = crumb(kid, 'تخصيص حسب الطفل') + '<header class="head"><h1 class="mega">على <em>مقاس</em> ' + esc(kid.child) + '</h1><p class="lead">اختيارات للكبار تخلّي اللعب مريح للطفل اللي بيتشتّت أو بيتضايق من الزحمة والحركة. بتتطبّق على كل الألعاب لـ' + esc(kid.child) + ' بس.</p></header>' + grown(kid, 'fit') +
      '<div class="mkids-fit"><section class="card"><h2>الإحساس والراحة</h2>' + FITS.map(function (f) { return '<label class="mkids-check"><input type="checkbox" data-fit="' + f[0] + '"' + (F[f[0]] ? ' checked' : '') + '><span><strong>' + f[1] + '</strong><small>' + f[2] + '</small></span></label>'; }).join('') +
      '<div class="fld mkids-len"><label for="mkids-len">مدة الجلسة<span class="hint">بتغيّر عدد المحاولات بس، وبتتسجّل مع كل جلسة.</span></label><select id="mkids-len">' + H.opts(Object.keys(LEN).map(function (k) { return [k, LEN[k][0]]; }), F.len) + '</select></div></section>' +
      '<section class="card"><h2>الثيم والمتابعة</h2><p>الثيم الحالي: <strong>' + thName(K.th) + '</strong>. الطفل بيغيّره من «بتحب إيه؟» في رحلته.</p><label class="mkids-check"><input type="checkbox" id="mkids-lockbox"' + (locked(kid.id) ? ' checked' : '') + '><span><strong>ثبّت الثيم للمتابعة</strong><small>بيتفعّل لوحده بعد أول جلسة محسوبة، علشان مقارنة الجلسات ببعض ما يدخلش فيها اختلاف الشكل. فكّه لو متعة الطفل بالتغيير أهم عندك من المقارنة.</small></span></label>' +
      '<p class="row"><a class="btn" href="#kids/' + esc(kid.id) + '/me">افتح «بتحب إيه؟»</a><a class="btn primary" href="#kids/' + esc(kid.id) + '">رجوع للرحلة</a></p></section></div>';
    $$('[data-fit]', main).forEach(function (i) { i.addEventListener('change', function () { F[i.dataset.fit] = i.checked; H.save(); H.toast('اتحفظ'); }); });
    $('#mkids-len', main).addEventListener('change', function () { F.len = LEN[this.value] ? this.value : 'normal'; H.save(); H.toast('اتحفظ'); });
    $('#mkids-lockbox', main).addEventListener('change', function () { K.lock = this.checked; H.save(); H.toast('اتحفظ'); });
  }

  H.register('kids', function (main, a, b) {
    unmount(); D();
    if (a === 'about') return vAbout(main);
    if (!kidsList().length) return vEmpty(main);
    var kid = a ? kidBy(a) : null;
    if (!kid) return vPick(main);
    if (ACTS[b]) return play(main, kid, b);
    if (b === 'parent') return vParent(main, kid);
    if (b === 'spec') return vSpec(main, kid);
    if (b === 'plan') return vPlan(main, kid);
    if (b === 'me') return vMe(main, kid);
    if (b === 'fit') return vFit(main, kid);
    vJourney(main, kid);
  });
  window.HubKids = { makeRng: makeRng, Stair: Stair, genStars: genStars, genGng: genGng, genPattern: genPattern, flipAnswer: flipAnswer, towerMin: towerMin, median: median, describe: describe, compare: compare, csv: csv, GNG_WIN: GNG_WIN, FLIP_RUN: FLIP_RUN, STAR_POS: STAR_POS, ACTS: ACTS, THEMES: THEMES, TH_ORDER: TH_ORDER, CH: CH,
    art: function (t) { var T = THEMES[t], o; CUR = T; o = [toon(T.go), toon(T.nogo), tileSvg(T), scene(T)].concat([0, 1, 2, 3].map(function (s) { return token({ s: s, c: s, z: 2 }); })); CUR = null; return o; },
    words: function (t) { return gWords(THEMES[t]); } };
})();
