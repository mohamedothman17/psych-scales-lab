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
    if (s === 0) return '<circle r="38" ' + attrs + '/>';
    if (s === 1) return '<rect x="-36" y="-36" width="72" height="72" rx="9" ' + attrs + '/>';
    if (s === 2) return '<path d="M0-40 43 34-43 34Z" stroke-linejoin="round" ' + attrs + '/>';
    return '<path d="' + STAR5 + '" stroke-linejoin="round" ' + attrs + '/>';
  }
  function tokName(t) { return SHAPES[t.s] + ' ' + COLS[t.c] + (t.z != null && t.z !== 2 ? ' ' + SIZES[t.z] : ''); }
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

  /* ---------- play shell ---------- */
  var STOP = { stop: true }, LIVE = null, AC = null, CAP_MS = 270000;
  var OK_SAY = ['برافو على تركيزك!', 'حلو قوي، كمّل!', 'شاطر إنك بصّيت كويس!', 'تمام كده، كمّل!'], TRY_SAY = ['قرّبت! نجرب واحدة تانية.', 'ولا يهمّك، المهم إنك بتحاول.', 'محاولة حلوة، نكمّل.'];
  function kill() {
    var c = LIVE; if (!c) return; LIVE = null; c.dead = true;
    c.rej.splice(0).forEach(function (f) { f(STOP); });
    c.keys.forEach(function (f) { document.removeEventListener('keydown', f, true); });
    document.documentElement.classList.remove('mkids-lock');
  }
  window.addEventListener('hashchange', kill);
  function beep(k) {
    if (!D().sound) return;
    try { AC = AC || new (window.AudioContext || window.webkitAudioContext)(); var o = AC.createOscillator(), g = AC.createGain(); o.frequency.value = 330 * Math.pow(1.122, k % 9); g.gain.value = 0.07; o.connect(g); g.connect(AC.destination); o.start(); g.gain.exponentialRampToValueAtTime(0.0001, AC.currentTime + 0.2); o.stop(AC.currentTime + 0.22); } catch (e) {}
  }
  function play(main, kid, id) {
    var A = ACTS[id], d = D();
    main.innerHTML = DEFS + '<div class="mkids-play mkids-t-' + A.tone + '" id="mkids-play" data-act="' + id + '" data-phase="intro">' +
      '<header class="mkids-bar"><button type="button" class="mkids-stop" id="mkids-stop">' + HAND + '<span>مش عاوز ألعب دلوقتي</span></button><div class="mkids-dots" id="mkids-dots" aria-hidden="true"></div></header>' +
      '<div class="mkids-say"><span id="mkids-bud">' + buddy() + '</span><p id="mkids-line" role="status" aria-live="polite"></p></div>' +
      '<div class="mkids-stage" id="mkids-stage"></div></div>';
    var root = $('#mkids-play', main), stage = $('#mkids-stage', root), line = $('#mkids-line', root), praise = 0;
    var c = LIVE = {
      stage: stage, rng: makeRng(SEED != null ? SEED : (Date.now() ^ (Math.random() * 1e9)) >>> 0), dead: false, rej: [], keys: [], da: false, t0: 0, started: false,
      res: { lvl: 0, n: 0, err: 0, hints: null, x: {} }, dev: {},
      say: function (t, mood) { line.textContent = t; $('#mkids-bud', root).innerHTML = buddy(mood); },
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
      sfx: beep,
      cheer: function (ok, ms) { c.say(ok ? OK_SAY[praise++ % OK_SAY.length] : TRY_SAY[praise++ % TRY_SAY.length], ok ? '' : 'calm'); if (ok) beep(7); return c.wait(ms || 1000); }
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
          hints: c.res.hints, da: c.da ? 1 : 0, dur: Math.round((Date.now() - c.t0) / 1000), dev: dv, vp: window.innerWidth + 'x' + window.innerHeight, x: c.res.x || {}, note: '' };
        var lg = logOf(kid.id); lg.push(saved); if (lg.length > 300) lg.splice(0, lg.length - 300);
        H.save();
      }
      kill();
      root.dataset.phase = 'end'; $('#mkids-stop', root).hidden = true; $('#mkids-dots', root).innerHTML = '';
      line.textContent = ''; $('.mkids-say', root).hidden = true;
      var NOTES = ['الطفل كان تعبان', 'في دوشة', 'اللعب اتقاطع', 'كان مركّز ومبسوط'];
      stage.innerHTML = '<div class="mkids-end"><div class="mkids-end-art">' + buddy(done ? '' : 'calm') + (saved ? star('mkids-prize') : '') + '</div>' +
        '<h1>' + (done ? 'خلصنا يا ' : 'تمام يا ') + esc(kid.child) + '!</h1>' +
        '<p class="mkids-end-line">' + (done ? 'شكراً إنك لعبت وركّزت. نجمة جديدة اتضافت لرحلتك.' : saved ? 'نكمّل في وقت تاني. شكراً إنك جرّبت، ونجمتك محفوظة.' : 'نلعب في وقت تاني لما تحب.') + '</p>' +
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
    c.say(A.line);
    stage.innerHTML = '<div class="mkids-intro"><div class="mkids-intro-art">' + ART[id] + '</div><h1>' + A.name + '</h1>' +
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
    c.stage.innerHTML = '<div class="mkids-sky" id="mkids-sky" data-mode="wait">' + STAR_POS.map(function (p, i) { return '<button type="button" class="mkids-star" data-i="' + i + '" aria-label="نجمة ' + (i + 1) + '">' + star() + '<b class="mkids-ord" aria-hidden="true"></b></button>'; }).join('') + '</div>';
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
      c.say('بصّ على النجوم…'); await show(seq); c.say('دورك! دوس عليهم بنفس الترتيب.'); first = ok = await attempt(seq);
      while (!ok && (c.da || !scored) && h <= 3) {
        hint = h;
        if (h === 1) { c.say('نشوفهم تاني براحة.', 'calm'); await show(seq); c.say('دورك!'); ok = await attempt(seq); }
        else if (h === 2) { c.say('المرة دي كل نجمة عليها رقمها.', 'calm'); await show(seq, true); c.say('دورك!'); ok = await attempt(seq); }
        else { c.say('نعملها سوا: دوس على النجمة اللي منوّرة.'); await guided(seq); ok = true; }
        h++;
      }
      return { first: first, hint: hint };
    }
    c.say('نجرّب الأول.'); await c.wait(900);
    sky.dataset.practice = '1';
    for (var p = 0; p < 2; p++) { var pr = await trial(2, false); await c.cheer(pr.first || true, 900); }
    delete sky.dataset.practice;
    var stair = new Stair(2, 2, 9), N = 10;
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
    var hole = $('#mkids-hole', c.stage), peek = $('#mkids-peek', c.stage), btn = $('#mkids-wave', c.stage);
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
      pressed = null; peek.innerHTML = go ? cat() : dog(); hole.dataset.kind = go ? 'cat' : 'dog'; t0 = performance.now(); open = true;
      if (teach) c.say(go ? 'دي القطة: سلّم عليها!' : 'ده الكلب: استنى، ما تدوسش.', go ? '' : 'calm');
      await new Promise(function (res, rej) { wake = res; c.wait(win).then(res, rej); });
      open = false; wake = null;
      var resp = pressed != null, kind = go ? (resp ? 'hit' : 'miss') : (resp ? 'fa' : 'cr');
      hole.dataset.last = kind; hole.dataset.kind = '';
      if (kind === 'hit') { hole.classList.add('yay'); c.sfx(6); await c.wait(380); hole.classList.remove('yay'); }
      else if (kind === 'fa') { c.say('ده كلب! نستناه يعدّي.', 'calm'); await c.wait(1100); }
      else if (kind === 'miss') { c.say('القطة مشيت. المرة الجاية نلحقها.', 'calm'); await c.wait(900); }
      else { if (teach) c.say('برافو، استنيت!'); await c.wait(teach ? 900 : 300); }
      peek.innerHTML = '';
      return { kind: kind, rt: resp ? Math.round(pressed) : null };
    }
    c.say('نجرّب الأول.'); await c.wait(900);
    hole.dataset.practice = '1';
    var pr = [1, 1, 0, 1]; for (var p = 0; p < pr.length; p++) await trial(pr[p], 2600, true);
    delete hole.dataset.practice;
    c.say('يلا بجد! سلّم على القطة بس.'); await c.wait(1200);
    var order = genGng(c.rng, 36), stair = new Stair(1, 1, 6), bErr = 0, BLOCK = 6;
    for (var t = 0; t < order.length && !c.late(); t++) {
      c.dots(t, order.length);
      if (t % BLOCK === 0) c.say('سلّم على القطة بس.');
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
    var stair = new Stair(1, 1, 5), total = 30, t = 0, run = 0, x = c.res.x = { sw: 0, swErr: 0, stayErr: 0, pre: 0, trail: '' };
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
      async function pick() { var b = await c.tap('.mkids-opt'), o = +b.dataset.o; if (o !== it.ai) b.classList.add('tried'); return o === it.ai; }
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
          opts.forEach(function (b) { if (b.classList.contains('tried')) b.setAttribute('aria-disabled', 'true'); });
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
    var stair = new Stair(1, 1, PAT_MAX), N = 10;
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
    var stair = new Stair(3, 2, 4), R = 3, x = c.res.x = { rounds: '' }, rs = [];
    for (var t = 0; t < R && !c.late(); t++) {
      c.dots(t, R); c.say('انقل البرج كله لعمود النجمة.');
      var nd = stair.level, r = await round(nd);
      c.res.n++; c.res.err += r.bad; if (r.solved && nd > c.res.lvl) c.res.lvl = nd;
      rs.push(nd + ':' + (r.solved ? r.moves : 'x' + r.moves) + '/' + r.min); x.rounds = rs.join(' ');
      stair.result(r.solved && r.moves <= 2 * r.min);
      c.dots(t + 1, R); await c.cheer(r.solved, 1000);
    }
  };

  /*__VIEWS__*/
})();
