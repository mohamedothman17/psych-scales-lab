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
    cand = shuffle(r, cand).sort(function (a, b) { return diff(a) - diff(b); });
    function diff(t) { return (t.s !== ans.s) + (t.c !== ans.c) + (t.z !== ans.z); }
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

  /*__GAMES__*/
  /*__VIEWS__*/
})();
