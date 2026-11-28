/* Decision section, second part: scheduling, queueing, short forms, the problem-to-model guide,
   the written models and the Python script generators. Loaded by mod-decide.js. */
(function () {
  'use strict';
  var H = window.Hub, X = window.HubDecide, C = X.C, h = X.h, esc = H.esc, $ = H.$, $$ = H.$$, ic = H.ic;
  var num = h.num, f = h.f, fi = h.fi, pct = h.pct, inp = h.inp, cell = h.cell, wait = h.wait, name = h.name, rm = h.rm, add = h.add;

  /* ---------- 05 schedule ---------- */
  function schedModel(st) {
    var slots = st.slots, specs = st.specs.map(function (s) { var c = num(s.cap); return { avail: slots.map(function (t) { return !!(s.av || {})[t.id]; }), cap: isNaN(c) ? -1 : Math.max(0, Math.floor(c)) }; });
    var ids = st.specs.map(function (s) { return s.id; }), cases = st.cases.map(function (c) { return { st: slots.map(function (t) { return +((c.st || {})[t.id]) || 0; }), pref: ids.indexOf(c.pref) }; });
    return { specs: specs, cases: cases };
  }
  X.schedModel = schedModel;
  X.tools.sched = {
    no: '05', title: 'جدولة الجلسات وتوزيع الحالات', color: 'violet', people: true, say: 'وزّع الحالات على الأخصائيين والمواعيد حسب المتاح والسعة والتفضيلات',
    what: 'بتسكّن أكبر عدد ممكن من الحالات في مواعيد متاحة للطرفين من غير ما أخصائي يتحمّل فوق سعته، وبعدها بتقلّل التفضيلات اللي ما اتحققتش. وبتكتب سبب كل تسكين.',
    when: 'لما يبقى عندك حالات أكتر من إنك توزّعها في دماغك: مركز إرشاد، عيادة مدرسية، أو مواعيد تطبيق فردي لمشاركين في بحث.',
    ex: '8 حالات بأكواد (من غير أسماء) و3 أخصائيين و4 مواعيد في الأسبوع. البيانات افتراضية.',
    def: function () { return { slots: [{ id: 't1', name: '' }, { id: 't2', name: '' }], specs: [{ id: 'p1', name: '', cap: '', av: {} }], cases: [{ id: 'q1', code: '', st: {}, pref: '' }], reviewer: '' }; },
    example: function () {
      var s = { slots: [{ id: 't1', name: 'الأحد 10' }, { id: 't2', name: 'الأحد 12' }, { id: 't3', name: 'الثلاثاء 10' }, { id: 't4', name: 'الخميس 11' }], specs: [{ id: 'p1', name: 'أخصائي أ', cap: '3', av: { t1: 1, t2: 1, t3: 1, t4: 1 } }, { id: 'p2', name: 'أخصائي ب', cap: '3', av: { t1: 1, t3: 1, t4: 1 } }, { id: 'p3', name: 'أخصائي ج', cap: '2', av: { t2: 1, t4: 1 } }], cases: [], reviewer: '' };
      var raw = [['2100', 'p1'], ['1200', ''], ['0210', 'p2'], ['1021', ''], ['2001', 'p3'], ['0120', ''], ['1102', 'p1'], ['0012', '']];
      raw.forEach(function (r, i) { var o = {}; s.slots.forEach(function (t, j) { o[t.id] = +r[0][j]; }); s.cases.push({ id: 'q' + (i + 1), code: 'ح-0' + (i + 1), st: o, pref: r[1] }); });
      return s;
    },
    form: function (st) {
      var sn = st.slots.map(function (t, i) { return name(t, i, 'ميعاد'); }), pn = st.specs.map(function (p, i) { return name(p, i, 'أخصائي'); });
      var th = sn.map(function (n) { return '<th scope="col">' + esc(n) + '</th>'; }).join('');
      var TRI = ['مش متاح', 'متاح', 'مفضّل'];
      return '<div class="card mdc-card"><h2>1. المواعيد</h2><p class="muted">كل ميعاد = جلسة واحدة لكل أخصائي. من 1 لـ 8.</p><div class="mdc-fields">' + st.slots.map(function (t, i) { return '<div class="mdc-li">' + cell('slots.' + i + '.name', t.name, 'الميعاد ' + (i + 1), true, 'ميعاد ' + (i + 1)) + (st.slots.length > 1 ? rm('del-slots', i, 'الميعاد ' + (i + 1)) : '') + '</div>'; }).join('') + '</div>' + add('add-slots', 'زوّد ميعاد', st.slots.length >= 8) + '</div>' +
        '<div class="card mdc-card"><h2>2. الأخصائيين</h2><p class="muted">دوس على الخانة عشان تبدّل بين متاح ومش متاح. السعة = أقصى عدد جلسات ياخدها (سيبها فاضية لو من غير حد).</p><div class="mdc-scroll" tabindex="0" role="group" aria-label="الأخصائيين"><table class="mdc-matrix"><thead><tr><th scope="col" class="mdc-corner">الأخصائي</th><th scope="col">السعة</th>' + th + '</tr></thead><tbody>' +
        st.specs.map(function (p, i) { return '<tr><th scope="row"><span class="mdc-th">' + cell('specs.' + i + '.name', p.name, 'الأخصائي ' + (i + 1), true, 'أخصائي ' + (i + 1)) + (st.specs.length > 1 ? rm('del-specs', i, 'الأخصائي ' + (i + 1)) : '') + '</span></th><td>' + cell('specs.' + i + '.cap', p.cap, 'سعة الأخصائي ' + (i + 1), false, 'من غير حد') + '</td>' + st.slots.map(function (t, j) { var on = (p.av || {})[t.id] ? 1 : 0; return '<td><button type="button" class="mdc-tri" data-s="' + on + '" data-act="av" data-arg="' + i + '|' + t.id + '" data-keep="av' + i + '-' + j + '" aria-label="' + esc(pn[i] + '، ' + sn[j] + ': ' + TRI[on]) + '">' + TRI[on] + '</button></td>'; }).join('') + '</tr>'; }).join('') + '</tbody></table></div>' + add('add-specs', 'زوّد أخصائي', st.specs.length >= 6) + '</div>' +
        '<div class="card mdc-card"><h2>3. الحالات</h2><p class="muted"><strong>اكتب أكواد بس، من غير أسماء.</strong> دوس على الخانة: مش متاح ← متاح ← مفضّل.</p><div class="mdc-scroll" tabindex="0" role="group" aria-label="الحالات"><table class="mdc-matrix"><thead><tr><th scope="col" class="mdc-corner">كود الحالة</th>' + th + '<th scope="col">أخصائي مطلوب</th></tr></thead><tbody>' +
        st.cases.map(function (c, i) { return '<tr><th scope="row"><span class="mdc-th">' + cell('cases.' + i + '.code', c.code, 'كود الحالة ' + (i + 1), true, 'ح-' + (i + 1)) + (st.cases.length > 1 ? rm('del-cases', i, 'الحالة ' + (i + 1)) : '') + '</span></th>' + st.slots.map(function (t, j) { var s = +((c.st || {})[t.id]) || 0; return '<td><button type="button" class="mdc-tri" data-s="' + s + '" data-act="cs" data-arg="' + i + '|' + t.id + '" data-keep="cs' + i + '-' + j + '" aria-label="' + esc((c.code || 'حالة ' + (i + 1)) + '، ' + sn[j] + ': ' + TRI[s]) + '">' + TRI[s] + '</button></td>'; }).join('') + '<td><select data-p="cases.' + i + '.pref" aria-label="الأخصائي المطلوب للحالة ' + (i + 1) + '"><option value="">أي أخصائي</option>' + H.opts(st.specs.map(function (p, k) { return [p.id, pn[k]]; }), c.pref) + '</select></td></tr>'; }).join('') + '</tbody></table></div>' + add('add-cases', 'زوّد حالة', st.cases.length >= 40) + '</div>' +
        '<div class="card mdc-card"><h2>4. مين هيراجع؟</h2>' + '<label class="mdc-f"><span class="mdc-fl">اسم المسؤول اللي هيراجع المسودة ويعتمدها<span class="hint">لازم عشان تنزّل الجدول. الاسم بيتكتب على المسودة.</span></span><input type="text" data-p="reviewer" data-gate value="' + esc(st.reviewer || '') + '" autocomplete="off"></label></div>';
    },
    gate: function (st) { return String(st.reviewer || '').trim() ? '' : 'اكتب اسم المسؤول اللي هيراجع المسودة الأول.'; },
    act: function (st, act, arg) {
      var a = String(arg || '').split('|'), m = /^(add|del)-(slots|specs|cases)$/.exec(act);
      if (act === 'av') { var p = st.specs[+a[0]]; p.av = p.av || {}; p.av[a[1]] = p.av[a[1]] ? 0 : 1; }
      else if (act === 'cs') { var c = st.cases[+a[0]]; c.st = c.st || {}; c.st[a[1]] = ((+c.st[a[1]] || 0) + 1) % 3; }
      else if (m && m[1] === 'add') st[m[2]].push(m[2] === 'slots' ? { id: H.uid(), name: '' } : m[2] === 'specs' ? { id: H.uid(), name: '', cap: '', av: {} } : { id: H.uid(), code: '', st: {}, pref: '' });
      else if (m) st[m[2]].splice(+arg, 1);
    },
    out: function (st) {
      var sn = st.slots.map(function (t, i) { return name(t, i, 'ميعاد'); }), pn = st.specs.map(function (p, i) { return name(p, i, 'أخصائي'); }), cn = st.cases.map(function (c, i) { return String(c.code || '').trim() || 'ح-' + (i + 1); });
      var M = schedModel(st);
      if (!M.specs.some(function (s) { return s.avail.some(Boolean); })) return wait('حدّد مواعيد متاحة لأخصائي واحد على الأقل، أو حمّل المثال.');
      if (!M.cases.some(function (c) { return c.st.some(Boolean); })) return wait('حدّد لكل حالة المواعيد المتاحة ليها.');
      var r = C.schedule(st.slots.length, M.specs, M.cases, 1, 1), rev = String(st.reviewer || '').trim();
      var unS = 0, unP = 0; r.detail.forEach(function (d) { if (!d) return; if (d.hadSlotPref && !d.slotPref) unS++; if (d.specAsked && !d.specMet) unP++; });
      var grid = '<div class="mdc-scroll" tabindex="0" role="group" aria-label="مسودة الجدول"><table class="mdc-table mdc-grid-s"><thead><tr><th scope="col">الأخصائي</th>' + sn.map(function (n) { return '<th scope="col">' + esc(n) + '</th>'; }).join('') + '<th scope="col">الحمل</th></tr></thead><tbody>' + pn.map(function (n, p) {
        var load = 0, tds = sn.map(function (x, t) { var who = -1; r.detail.forEach(function (d, i) { if (d && d.p === p && d.t === t) who = i; }); if (who > -1) load++; return '<td>' + (who > -1 ? '<span class="mdc-seat">' + esc(cn[who]) + '</span>' : M.specs[p].avail[t] ? '<span class="mdc-free">فاضي</span>' : '<span class="mdc-free">—</span>') + '</td>'; }).join('');
        return '<tr><th scope="row">' + esc(n) + '</th>' + tds + '<td>' + fi(load) + (M.specs[p].cap >= 0 ? ' من ' + fi(M.specs[p].cap) : '') + '</td></tr>';
      }).join('') + '</tbody></table></div>';
      var why = '<ul class="mdc-why">' + r.detail.map(function (d, i) {
        if (!d) { var any = false; M.specs.forEach(function (s) { s.avail.forEach(function (a, t) { if (a && M.cases[i].st[t]) any = true; }); }); return '<li><span class="mdc-seat">' + esc(cn[i]) + '</span><p class="un">ما اتسكّنتش</p><p class="r un">' + (any ? 'كل الأماكن الممكنة ليها اتملت، أو سعة الأخصائيين المتاحين في مواعيدها خلصت. محتاجة ميعاد زيادة أو سعة أكبر.' : 'مفيش ولا ميعاد مشترك بين المتاح ليها والمتاح لأي أخصائي.') + '</p></li>'; }
        var rs = ['الحالة والأخصائي متاحين في الميعاد ده'];
        if (d.slotPref) rs.push('وهو من مواعيدها المفضّلة'); else if (d.hadSlotPref) rs.push('الميعاد مش من المفضّلة عندها: تسكينها في مفضّل كان هيقلّل عدد الحالات المتسكّنة أو يكسر تفضيلات أكتر');
        if (d.specAsked) rs.push(d.specMet ? 'ومع الأخصائي المطلوب' : 'مش مع الأخصائي المطلوب: هو مش متاح في مواعيدها أو سعته خلصت');
        return '<li><span class="mdc-seat">' + esc(cn[i]) + '</span><p><strong>' + esc(sn[d.t]) + '</strong> مع <strong>' + esc(pn[d.p]) + '</strong></p><p class="r">' + rs.join('، ') + '.</p></li>';
      }).join('') + '</ul>';
      var html = '<div class="mdc-draft"><span class="mdc-draft-k">مسودة، مش جدول نهائي</span><p>' + (rev ? 'يراجعها ويعتمدها: <strong>' + esc(rev) + '</strong>. ' : '<strong>لسه ما اتكتبش اسم المسؤول عن المراجعة.</strong> ') + 'الأداة ما تعرفش حاجة عن الحالات غير المواعيد والتفضيلات. الأولوية الإكلينيكية، والعلاقة العلاجية، وظروف كل حالة قرار المسؤول، مش قرار الخوارزمية.</p></div>' +
        '<ul class="mdc-stats"><li><b class="num">' + r.placed + ' من ' + M.cases.length + '</b><span>حالة اتسكّنت</span></li><li><b class="num">' + unS + '</b><span>تفضيل ميعاد ما اتحققش</span></li><li><b class="num">' + unP + '</b><span>طلب أخصائي ما اتحققش</span></li></ul>' +
        '<div class="mdc-res"><h3>المسودة</h3>' + grid + '</div><div class="mdc-res"><h3>سبب كل تسكين</h3>' + why + '</div>' +
        '<p class="small muted mdc-method">الطريقة: ' + (r.method === 'hungarian' ? 'الخوارزمية المجرية (Hungarian) لمسألة التعيين، لأن سعة الأخصائيين مش مقيِّدة هنا.' : 'تدفق بأقل تكلفة (min-cost max-flow) لأن فيه سعات مقيِّدة.') + ' الطريقتين بيدّوا حل أمثل مضبوط مش تقريبي: أكبر عدد متسكّن أولاً، وبعده أقل عدد تفضيلات مكسورة. ممكن يبقى فيه أكتر من حل بنفس الجودة، والأداة بتعرض واحد منهم. الحالات كلها بتتعامل بنفس الوزن، ومفيش ترتيب للحالات حسب «الاحتياج».</p>';
      var rows = [['DRAFT مسودة تحتاج مراجعة واعتماد', H.today()], ['المراجِع المسؤول', rev], [], ['كود الحالة', 'الميعاد', 'الأخصائي', 'تفضيل الميعاد', 'الأخصائي المطلوب']].concat(r.detail.map(function (d, i) { return d ? [cn[i], sn[d.t], pn[d.p], d.hadSlotPref ? (d.slotPref ? 'اتحقق' : 'ما اتحققش') : 'مفيش', d.specAsked ? (d.specMet ? 'اتحقق' : 'ما اتحققش') : 'مفيش'] : [cn[i], 'ما اتسكّنتش', '', '', '']; }));
      return { html: html, csv: rows, json: { status: 'DRAFT', reviewer: rev, method: r.method, exact: true, placed: r.placed, cases: M.cases.length, unmetSlotPreferences: unS, unmetSpecialistRequests: unP, assignments: r.detail.map(function (d, i) { return d ? { code: cn[i], slot: sn[d.t], specialist: pn[d.p], slotPreferred: d.slotPref, specialistRequestMet: d.specAsked ? d.specMet : null } : { code: cn[i], slot: null }; }) } };
    }
  };

  /* ---------- 06 queueing ---------- */
  X.tools.queue = {
    no: '06', title: 'طابور الانتظار وعدد الأخصائيين', color: 'lilac', say: 'محتاج كام أخصائي عشان الانتظار ما يطولش؟',
    what: 'بتحسب نسبة انشغال الأخصائيين، واحتمال إن اللي ييجي يستنى، ومتوسط الانتظار وطول الطابور، وأقل عدد أخصائيين يحقق انتظار مقبول.',
    when: 'لتخطيط خدمة بييجي لها الناس من غير ميعاد: مركز إرشاد جامعي، خط مساندة، أو عيادة مفتوحة. لو الشغل كله بمواعيد محجوزة، النموذج ده مش ليك.',
    ex: 'مركز إرشاد بييجي له في المتوسط 4 حالات في الساعة، والجلسة 40 دقيقة، وفيه 4 أخصائيين، والمطلوب انتظار 5 دقايق في المتوسط. الأرقام افتراضية.',
    def: function () { return { lam: '', svc: '', c: '', target: '' }; },
    example: function () { return { lam: '4', svc: '40', c: '4', target: '5' }; },
    form: function (st) {
      return '<div class="card mdc-card"><h2>الخدمة</h2><div class="mdc-fields">' + inp('lam', st.lam, 'متوسط اللي بييجوا في الساعة') + inp('svc', st.svc, 'متوسط مدة الجلسة بالدقايق') + inp('c', st.c, 'عدد الأخصائيين الموجودين') + inp('target', st.target, 'أقصى متوسط انتظار مقبول بالدقايق', { hint: 'اختياري' }) + '</div>' +
        '<p class="small muted">خُد المتوسطات من سجل فعلي لأسبوعين على الأقل، وفي ساعات الذروة لوحدها لو الضغط مش ثابت.</p></div>';
    },
    out: function (st) {
      var lam = num(st.lam), svc = num(st.svc), c = num(st.c), tg = num(st.target);
      if (!(lam > 0) || !(svc > 0)) return wait('اكتب متوسط الوصول في الساعة ومتوسط مدة الجلسة، أو حمّل المثال.');
      if (!(c >= 1) || c !== Math.floor(c) || c > 200) return wait('اكتب عدد الأخصائيين (عدد صحيح).');
      var mu = 60 / svc, r = C.mmc(lam, mu, c), cmin = Math.floor(lam / mu) + 1, need = tg > 0 ? C.mmcStaff(lam, mu, tg / 60) : null;
      var rowsT = [], k; for (k = Math.max(1, cmin - 1); k <= Math.max(cmin + 5, c + 1, (need || 0) + 1) && rowsT.length < 12; k++) rowsT.push([k, C.mmc(lam, mu, k)]);
      var tbl = '<div class="mdc-scroll" tabindex="0" role="group" aria-label="مقارنة عدد الأخصائيين"><table class="mdc-table"><thead><tr><th scope="col">عدد الأخصائيين</th><th scope="col">نسبة الانشغال</th><th scope="col">احتمال الانتظار</th><th scope="col">متوسط الانتظار (دقيقة)</th><th scope="col">متوسط الطابور</th></tr></thead><tbody>' + rowsT.map(function (x) { var q = x[1], me = x[0] === c, nd = x[0] === need; return '<tr><th scope="row">' + fi(x[0]) + (me ? ' (الحالي)' : '') + (nd ? ' (المطلوب)' : '') + '</th>' + (q.stable ? '<td>' + pct(q.rho) + '</td><td>' + pct(q.pw) + '</td><td>' + f(q.wq * 60, 1) + '</td><td>' + f(q.lq, 2) + '</td>' : '<td>' + pct(q.rho) + '</td><td colspan="3">الطابور بيكبر من غير حد</td>') + '</tr>'; }).join('') + '</tbody></table></div>';
      var warn = '<p class="notice">النموذج M/M/c بيفترض إن الناس بتيجي عشوائي (بواسون)، ومدة الجلسة متغيّرة (أُسّية)، والكل بيستنى دوره ومحدش بيمشي. الجلسات اللي مدتها شبه ثابتة بتخلّي الانتظار الحقيقي أقل شوية من المحسوب. اعتبر الأرقام تقدير للتخطيط، مش وعد.</p>';
      var head;
      if (!r.stable) head = '<div class="mdc-verdict warn"><h3>العدد ده ما يكفيش</h3><p>الحمل ' + f(r.a, 2) + ' جلسة في نفس الوقت في المتوسط، و' + fi(c) + ' أخصائيين نسبة انشغالهم ' + pct(r.rho, 0) + '. الطابور هيفضل يكبر. أقل عدد يخلّي الخدمة مستقرة: <strong>' + fi(cmin) + '</strong>.</p></div>';
      else head = '<div class="mdc-hero"><p class="mdc-hero-k">متوسط الانتظار قبل الجلسة</p><p class="mdc-hero-v"><span class="num">' + h.fx(r.wq * 60, 1) + '</span> <small>دقيقة</small></p><p class="mdc-hero-s">' + pct(r.pw, 0) + ' من اللي بييجوا بيستنوا، واللي بيستنى فعلاً بيستنى في المتوسط ' + f(60 / r.rate, 1) + ' دقيقة.</p></div>' +
        '<ul class="mdc-stats"><li><b class="num">' + (r.rho * 100).toFixed(0) + '%</b><span>نسبة انشغال الأخصائيين</span></li><li><b class="num">' + h.fx(r.lq, 2) + '</b><span>متوسط عدد المنتظرين</span></li><li><b class="num">' + h.fx(r.w * 60, 1) + '</b><span>دقيقة: الانتظار + الجلسة</span></li>' + (tg > 0 ? '<li><b class="num">' + (C.mmcTail(r, tg / 60) * 100).toFixed(1) + '%</b><span>احتمال الانتظار أكتر من ' + h.fx(tg, 0) + ' دقيقة</span></li>' : '') + '</ul>';
      var staff = tg > 0 ? '<div class="mdc-verdict ' + (need && need <= c ? 'ok' : 'warn') + '"><h3>' + (need && need <= c ? ic('check') + 'العدد الحالي يحقق الهدف' : 'محتاج ' + (need ? fi(need) + ' أخصائيين' : 'أكتر من 200 أخصائي')) + '</h3><p>أقل عدد يخلّي متوسط الانتظار ' + f(tg, 0) + ' دقايق أو أقل: <strong>' + (need ? fi(need) : '—') + '</strong>' + (need && need > c ? '، يعني ' + fi(need - c) + ' زيادة عن الموجود.' : '.') + (r.stable && r.rho > 0.85 ? ' خد بالك: انشغال فوق 85% معناه إن أي زيادة صغيرة في الوصول بتطوّل الطابور بسرعة، وكمان مفيش وقت للتوثيق والراحة.' : '') + '</p></div>' : '';
      var html = head + staff + '<div class="mdc-res"><h3>لو غيّرت العدد</h3>' + tbl + '</div>' + warn;
      var csv = [['طابور الانتظار M/M/c', H.today()], [], ['الوصول في الساعة', lam], ['مدة الجلسة (دقيقة)', svc], ['معدل الخدمة في الساعة', mu.toFixed(4)], ['الحمل (إرلانج)', r.a.toFixed(4)], [], ['عدد الأخصائيين', 'الانشغال', 'احتمال الانتظار', 'متوسط الانتظار (دقيقة)', 'متوسط الطابور']].concat(rowsT.map(function (x) { var q = x[1]; return q.stable ? [x[0], q.rho.toFixed(4), q.pw.toFixed(4), (q.wq * 60).toFixed(3), q.lq.toFixed(4)] : [x[0], q.rho.toFixed(4), 'غير مستقر', '', '']; }), need ? [[], ['العدد المطلوب للهدف', need]] : []);
      return { html: html, csv: csv, json: { arrivalsPerHour: lam, serviceMinutes: svc, servers: c, offeredLoad: r.a, utilisation: r.rho, stable: r.stable, pWait: r.pw, meanWaitMinutes: r.stable ? r.wq * 60 : null, meanQueue: r.lq, staffForTarget: need, table: rowsT.map(function (x) { return { servers: x[0], utilisation: x[1].rho, pWait: x[1].pw, waitMinutes: x[1].stable ? x[1].wq * 60 : null }; }) } };
    }
  };

  /* ---------- 07 short form ---------- */
  function parseItems(text) {
    var items = [], bad = [];
    String(text || '').split(/\r?\n/).forEach(function (line, i) {
      if (!line.trim()) return; var p = line.split(/[,\t;،]/).map(function (x) { return x.trim(); });
      var d = num(p[2]), b = p[3] === undefined || p[3] === '' ? NaN : num(p[3]);
      if (!p[0] || !p[1] || isNaN(d)) { bad.push(i + 1); return; }
      items.push({ code: p[0], area: p[1], disc: d, diff: isNaN(b) ? null : b });
    });
    return { items: items, bad: bad };
  }
  function parseMins(text, areas, each) { var m = {}; areas.forEach(function (a) { m[a] = each; }); String(text || '').split(/[,،\n]/).forEach(function (x) { var p = x.split(/[=:]/); if (p.length === 2 && areas.indexOf(p[0].trim()) > -1 && !isNaN(num(p[1]))) m[p[0].trim()] = Math.max(0, Math.floor(num(p[1]))); }); return m; }
  X.parseItems = parseItems;
  X.tools.short = {
    no: '07', title: 'تجميع صورة مختصرة من مقياس', color: 'mint', people: true, say: 'اختار أحسن k بنود مع الحفاظ على تمثيل كل مجال',
    what: 'من جدول بنودك (المجال، ومعامل التمييز أو ارتباط البند بالدرجة الكلية، والصعوبة لو موجودة) بتختار مجموعة البنود اللي مجموع تمييزها أعلى، بشرط كل مجال ياخد حقه.',
    when: 'لما المقياس طويل على المفحوصين وعايز صورة أقصر، ومعاك تحليل بنود من عينة حقيقية.',
    ex: 'مقياس من 16 بند في 4 مجالات، والمطلوب 8 بنود: 2 على الأقل من كل مجال، ومتوسط صعوبة بين 0.40 و 0.60. الأرقام افتراضية.',
    def: function () { return { text: '', k: '', each: '1', mins: '', lo: '', hi: '' }; },
    example: function () {
      var a = ['الخوف من التقييم', 'التجنب', 'الأعراض الجسمية', 'القلق في التفاعل'], d = [.62, .48, .55, .31, .58, .44, .37, .66, .29, .52, .61, .40, .57, .35, .49, .63], b = [.45, .62, .38, .71, .52, .30, .66, .48, .25, .55, .41, .74, .50, .33, .58, .44];
      return { text: d.map(function (x, i) { return 'ب' + (i + 1) + '، ' + a[i % 4] + '، ' + x.toFixed(2) + '، ' + b[i].toFixed(2); }).join('\n'), k: '8', each: '2', mins: '', lo: '0.40', hi: '0.60' };
    },
    form: function (st) {
      return '<div class="card mdc-card mdc-paste"><h2>البنود</h2><label class="mdc-f"><span class="mdc-fl">بند في كل سطر: الكود، المجال، التمييز، الصعوبة<span class="hint">افصل بفاصلة. التمييز = ارتباط البند المصحَّح بالدرجة الكلية أو معامل التمييز. الصعوبة اختيارية (نسبة من 0 لـ 1). تقدر تلصق من Excel.</span></span><textarea data-p="text" spellcheck="false">' + esc(st.text) + '</textarea></label></div>' +
        '<div class="card mdc-card"><h2>القيود</h2><div class="mdc-fields">' + inp('k', st.k, 'عدد بنود الصورة المختصرة k') + inp('each', st.each, 'أقل عدد من كل مجال') + inp('mins', st.mins, 'استثناءات لمجالات معيّنة', { text: true, hint: 'اختياري. مثال: التجنب=3، الأعراض الجسمية=1' }) + inp('lo', st.lo, 'أقل متوسط صعوبة', { hint: 'اختياري' }) + inp('hi', st.hi, 'أعلى متوسط صعوبة', { hint: 'اختياري' }) + '</div></div>';
    },
    out: function (st) {
      var P = parseItems(st.text), items = P.items, k = num(st.k);
      if (items.length < 2) return wait('الصق جدول البنود (الكود، المجال، التمييز، الصعوبة) أو حمّل المثال.' + (P.bad.length ? ' السطور دي مش مقروءة: ' + P.bad.join('، ') + '.' : ''));
      if (!(k >= 1) || k !== Math.floor(k) || k >= items.length) return wait('اكتب k: عدد صحيح أقل من عدد البنود (' + items.length + ').');
      var areas = []; items.forEach(function (it) { if (areas.indexOf(it.area) < 0) areas.push(it.area); });
      var each = num(st.each); if (isNaN(each) || each < 0) each = 0; var mins = parseMins(st.mins, areas, Math.floor(each));
      var lo = num(st.lo), hi = num(st.hi), useD = !isNaN(lo) || !isNaN(hi);
      if (useD && items.some(function (it) { return it.diff === null; })) return wait('حطّيت قيد على الصعوبة، بس فيه بنود من غير صعوبة. اكتب الصعوبة لكل البنود أو شيل القيد.');
      var r = C.shortForm(items, k, mins, isNaN(lo) ? undefined : lo, isNaN(hi) ? undefined : hi, 3e6);
      if (!r.ok) return wait(r.why === 'mins' ? 'مجموع الحد الأدنى للمجالات أكبر من k. قلّل الحد الأدنى أو كبّر k.' : r.why === 'limit' ? 'المسألة كبيرة ومالقيناش حل في الحد المسموح. خفّف القيود.' : 'مفيش مجموعة بنود تحقق كل القيود دي مع بعض. وسّع مدى الصعوبة أو قلّل الحد الأدنى.');
      var top = C.shortForm(items, k, {}, undefined, undefined, 1e5), cnt = {}, tc = {}; areas.forEach(function (a) { cnt[a] = 0; tc[a] = 0; });
      r.set.forEach(function (i) { cnt[items[i].area]++; }); top.set.forEach(function (i) { tc[items[i].area]++; });
      var all = items.reduce(function (s, it) { return s + it.disc; }, 0) / items.length, lost = areas.filter(function (a) { return tc[a] < mins[a]; });
      var by = areas.map(function (a) { return '<tr><th scope="row">' + esc(a) + '</th><td>' + fi(cnt[a]) + ' من ' + fi(items.filter(function (it) { return it.area === a; }).length) + '</td><td>' + r.set.filter(function (i) { return items[i].area === a; }).map(function (i) { return '<span class="mdc-seat">' + esc(items[i].code) + '</span> ' + f(items[i].disc, 2); }).join('  ') + '</td></tr>'; }).join('');
      var html = '<div class="mdc-hero"><p class="mdc-hero-k">الصورة المختصرة المقترحة (' + fi(k) + ' بنود)</p><p class="mdc-hero-v">' + r.set.map(function (i) { return esc(items[i].code); }).join(' · ') + '</p><p class="mdc-hero-s">متوسط التمييز ' + f(r.meanDisc, 3) + ' (المقياس الكامل ' + f(all, 3) + ')' + (items[0].diff !== null ? '، ومتوسط الصعوبة ' + f(r.meanDiff, 3) : '') + '</p></div>' +
        '<div class="mdc-res"><h3>التغطية</h3><div class="mdc-scroll" tabindex="0" role="group" aria-label="تغطية المجالات"><table class="mdc-table mdc-grid-s"><thead><tr><th scope="col">المجال</th><th scope="col">المختار</th><th scope="col">البنود وتمييزها</th></tr></thead><tbody>' + by + '</tbody></table></div>' +
        '<p>' + (lost.length ? 'لو أخدت أعلى ' + fi(k) + ' بنود في التمييز من غير قيود، متوسط التمييز كان هيبقى ' + f(top.meanDisc, 3) + ' بس ' + lost.map(function (a) { return '«' + esc(a) + '»'; }).join(' و') + ' كان هيتمثّل بأقل من المطلوب. القيود كلّفتك ' + f(top.meanDisc - r.meanDisc, 3) + ' في متوسط التمييز مقابل الحفاظ على محتوى المقياس.' : 'أعلى البنود تمييزاً بتحقق القيود لوحدها' + (Math.abs(top.sum - r.sum) > 1e-9 ? ' ما عدا قيد الصعوبة، واللي كلّف ' + f(top.meanDisc - r.meanDisc, 3) + ' في متوسط التمييز.' : '، فالقيود ما كلّفتش حاجة.')) + '</p></div>' +
        '<p class="small muted mdc-method">الطريقة: ' + (r.exact ? 'تفريع وتحديد (branch and bound)، والحل أمثل مضبوط: مفيش مجموعة تانية تحقق القيود ومجموع تمييزها أعلى (اتفحص ' + fi(r.nodes) + ' احتمال).' : 'تفريع وتحديد وقف عند حد البحث، فده أحسن حل لقيناه ومش مضمون إنه الأمثل. خفّف القيود أو قلّل البنود للحصول على حل مضبوط.') + '</p>' +
        '<p class="notice">ده اقتراح إحصائي مش مقياس جاهز. اختيار البنود من نفس العينة بيضخّم الأرقام، فالصورة المختصرة لازم تتطبّق على عينة جديدة ويتحسب ثباتها وصدقها من الأول، ومتخصص يراجع إن محتوى كل مجال لسه متمثّل. ودرجاتها ما تتفسّرش بمعايير المقياس الكامل.</p>';
      var csv = [['صورة مختصرة', H.today()], ['الحل', r.exact ? 'أمثل مضبوط' : 'أفضل حل موجود (غير مضمون)'], [], ['الكود', 'المجال', 'التمييز', 'الصعوبة', 'مختار']].concat(items.map(function (it, i) { return [it.code, it.area, it.disc, it.diff === null ? '' : it.diff, r.set.indexOf(i) > -1 ? 1 : 0]; }), [[], ['متوسط التمييز', r.meanDisc.toFixed(4)], ['متوسط الصعوبة', items[0].diff !== null ? r.meanDiff.toFixed(4) : '']]);
      return { html: html, csv: csv, json: { k: k, exact: r.exact, nodes: r.nodes, selected: r.set.map(function (i) { return items[i]; }), meanDiscrimination: r.meanDisc, meanDifficulty: items[0].diff !== null ? r.meanDiff : null, coverage: cnt, unconstrainedTopK: { meanDiscrimination: top.meanDisc, coverage: tc }, note: 'Statistical suggestion only. Re-validate on a new sample.' } };
    }
  };

  /* ---------- written models ---------- */
  function mm(t) { return '<pre class="mdc-math">' + esc(t) + '</pre>'; }
  function model(vars, obj, cons, note) { return '<dl><dt>متغيرات القرار</dt><dd>' + vars + '</dd><dt>دالة الهدف</dt><dd>' + obj + '</dd><dt>القيود</dt><dd>' + cons + '</dd></dl>' + (note ? '<p class="small muted">' + note + '</p>' : ''); }
  X.model = {
    ahp: model('وزن لكل معيار w_i، ودرجة محلية لكل بديل تحت كل معيار v_ai.' + mm('w = (w_1 … w_n),  w_i > 0'), 'المتجه الذاتي الرئيسي لمصفوفة المقارنات A، وبعده الدرجة الكلية:' + mm('A w = λmax w\nscore_a = Σ_i  w_i · v_ai'), 'المصفوفة تبادلية، والأوزان مجموعها 1، والاتساق مقبول:' + mm('a_ji = 1 / a_ij,   Σ w_i = 1\nCI = (λmax − n) / (n − 1)\nCR = CI / RI(n) ≤ 0.10'), 'RI من جدول ساعتي: 0.58، 0.90، 1.12، 1.24، 1.32، 1.41، 1.45، 1.49 لـ n من 3 لـ 10. المتجه الذاتي بيتحسب بالتكرار (power iteration).'),
    topsis: model('مفيش متغيرات قرار بالمعنى الحرفي: بنحسب لكل بديل معامل قرب C_a.' + mm('x_aj = قيمة البديل a على المعيار j'), 'رتّب تنازلياً حسب:' + mm('r_aj = x_aj / sqrt(Σ_a x_aj²)\nv_aj = w_j · r_aj\nD+_a = sqrt(Σ_j (v_aj − v+_j)²)\nD−_a = sqrt(Σ_j (v_aj − v−_j)²)\nC_a = D−_a / (D+_a + D−_a)'), 'المثالي والأسوأ حسب نوع المعيار:' + mm('v+_j = max_a v_aj  (مكسب)   أو   min_a v_aj  (تكلفة)\nv−_j = العكس\nΣ w_j = 1'), ''),
    strata: model('عدد المشاركين من كل طبقة.' + mm('n_h  صحيح،  h = 1 … H'), 'أقل تباين لمتوسط العينة الطبقية:' + mm('min  Var = Σ_h  W_h² · S_h² / n_h · (1 − n_h / N_h)\nW_h = N_h / N'), 'حجم ثابت أو ميزانية، وحدود لكل طبقة:' + mm('Σ_h n_h = n        أو        c0 + Σ_h c_h · n_h ≤ B\nm ≤ n_h ≤ N_h'), 'الحل المعروف: n_h ∝ N_h (متناسب)، n_h ∝ N_h·S_h (نيمان)، n_h ∝ N_h·S_h/√c_h (أمثل بالتكلفة).'),
    power: model('حجم العينة.' + mm('n  صحيح (في كل مجموعة، أو أزواج، أو كلي)'), 'أقل عينة تحقق القوة، أو أعلى قوة في حدود الميزانية:' + mm('min n   s.t.  Power(n; ES, α) ≥ 1 − β\nأو\nmax Power(n; ES, α)   s.t.  Cost(n) ≤ B'), 'التكلفة والقوة:' + mm('Cost(n) = F + c · n · g + c_cl · ceil(n · g / m)\nPower = P( |T| > t_crit ),   T ~ noncentral t(df, δ)\nδ = d·sqrt(n/2)  (مستقلتين)   |   δ = dz·sqrt(n)  (مرتبط)\nANOVA:  λ = f² · N,   F ~ noncentral F(k−1, N−k, λ)'), 'g عدد المجموعات، m حجم المجموعة الجاهزة. مع ICC العينة الفعّالة = n ÷ (1 + (m − 1)·ICC).'),
    sched: model('متغير ثنائي لكل (حالة، أخصائي، ميعاد).' + mm('x_ipt ∈ {0, 1}   = 1 لو الحالة i مع الأخصائي p في الميعاد t'), 'أكبر عدد متسكّن أولاً، وبعده أقل تفضيلات مكسورة:' + mm('lexmin  ( −Σ x_ipt ,  Σ pen_ipt · x_ipt )\npen_ipt = [t مش مفضّل للحالة i] + [p مش الأخصائي المطلوب]'), mm('Σ_p Σ_t x_ipt ≤ 1            كل حالة مرة واحدة بالكتير\nΣ_i x_ipt ≤ 1                 جلسة واحدة لكل أخصائي في الميعاد\nΣ_i Σ_t x_ipt ≤ cap_p         سعة الأخصائي\nx_ipt = 0  لو الحالة أو الأخصائي مش متاح في t'), 'مصفوفة القيود هنا من نوع شبكات التدفق، فالحل الأمثل بيطلع صحيح من غير تفريع.'),
    queue: model('عدد الأخصائيين.' + mm('c  صحيح'), 'أقل عدد يحقق هدف الانتظار:' + mm('min c   s.t.  Wq(c) ≤ W*'), 'صيغ M/M/c (إرلانج C):' + mm('a = λ / μ,   ρ = a / c < 1\nP0 = [ Σ_{k=0}^{c−1} a^k / k!  +  a^c / (c! · (1 − ρ)) ]^−1\nPw = a^c / (c! · (1 − ρ)) · P0\nLq = Pw · ρ / (1 − ρ),   Wq = Lq / λ\nP(wait > t) = Pw · exp(−(c·μ − λ) · t)'), ''),
    short: model('متغير ثنائي لكل بند.' + mm('y_i ∈ {0, 1}   = 1 لو البند i في الصورة المختصرة'), 'أعلى مجموع تمييز:' + mm('max  Σ_i  d_i · y_i'), mm('Σ_i y_i = k\nΣ_{i ∈ مجال a} y_i ≥ m_a          لكل مجال\nlo · k ≤ Σ_i b_i · y_i ≤ hi · k     متوسط الصعوبة'), 'd_i تمييز البند و b_i صعوبته.')
  };

  /* ---------- Python scripts ---------- */
  function J(x) { return JSON.stringify(x); }
  function pyHead(t, needs) { return '# -*- coding: utf-8 -*-\n# ' + t + '\n# Reproduces the model from the decision tools with the numbers you entered.\n# Requires: ' + needs + '\n'; }
  X.py = {
    ahp: function (st) {
      var r = X.ahpAll(st), cn = st.crit.map(function (c, i) { return name(c, i, 'معيار'); }), an = st.alts.map(function (a, i) { return name(a, i, 'بديل'); });
      return pyHead('AHP: principal eigenvector, consistency ratio and final ranking', 'numpy') + 'import numpy as np\n\ncriteria = ' + J(cn) + '\nalternatives = ' + J(an) + '\nA = np.array(' + J(r.A) + ')\nper_criterion = [np.array(m) for m in ' + J(r.per.map(function (p) { return p.A; })) + ']\nRI = {1: 0, 2: 0, 3: 0.58, 4: 0.90, 5: 1.12, 6: 1.24, 7: 1.32, 8: 1.41, 9: 1.45, 10: 1.49}\n\ndef priorities(M):\n    vals, vecs = np.linalg.eig(M)\n    i = np.argmax(vals.real)\n    w = np.abs(vecs[:, i].real)\n    w = w / w.sum()\n    n = len(M)\n    lam = vals[i].real\n    ci = (lam - n) / (n - 1) if n > 1 else 0.0\n    cr = ci / RI[n] if RI[n] else 0.0\n    return w, lam, ci, cr\n\nw, lam, ci, cr = priorities(A)\nprint("criteria weights:")\nfor name, x in zip(criteria, w):\n    print("  %s: %.4f" % (name, x))\nprint("lambda max = %.4f, CI = %.4f, CR = %.4f" % (lam, ci, cr))\nlocal = []\nfor name, M in zip(criteria, per_criterion):\n    v, l2, c2, r2 = priorities(M)\n    local.append(v)\n    print("alternatives under %s: CR = %.4f" % (name, r2))\nscores = np.array(local).T @ w\nfor k in np.argsort(-scores):\n    print("%s: %.4f" % (alternatives[k], scores[k]))\n';
    },
    topsis: function (st) {
      var cn = st.crit.map(function (c, i) { return name(c, i, 'معيار'); }), an = st.alts.map(function (a, i) { return name(a, i, 'بديل'); });
      var Xm = st.alts.map(function (a) { return st.crit.map(function (c) { var v = num((st.x[a.id] || {})[c.id]); return isNaN(v) ? 0 : v; }); });
      return pyHead('TOPSIS with vector normalisation', 'numpy') + 'import numpy as np\n\ncriteria = ' + J(cn) + '\nalternatives = ' + J(an) + '\nX = np.array(' + J(Xm) + ', dtype=float)\nweights = np.array(' + J(st.crit.map(function (c) { var v = num(c.w); return isNaN(v) ? 0 : v; })) + ', dtype=float)\nkinds = ' + J(st.crit.map(function (c) { return c.kind; })) + '  # benefit: larger is better, cost: smaller is better\n\nw = weights / weights.sum()\nV = X / np.sqrt((X ** 2).sum(axis=0)) * w\nbest = np.array([V[:, j].min() if kinds[j] == "cost" else V[:, j].max() for j in range(len(w))])\nworst = np.array([V[:, j].max() if kinds[j] == "cost" else V[:, j].min() for j in range(len(w))])\nd_plus = np.sqrt(((V - best) ** 2).sum(axis=1))\nd_minus = np.sqrt(((V - worst) ** 2).sum(axis=1))\ncloseness = d_minus / (d_plus + d_minus)\nfor k in np.argsort(-closeness):\n    print("%s: C = %.4f (D+ = %.4f, D- = %.4f)" % (alternatives[k], closeness[k], d_plus[k], d_minus[k]))\n';
    },
    strata: function (st) {
      var rows = st.rows.map(function (r, i) { return [name(r, i, 'طبقة'), num(r.N) || 0, num(r.S) || 0, num(r.c) > 0 ? num(r.c) : 1]; });
      return pyHead('Stratified sample allocation: proportional, Neyman and cost-optimal', 'Python 3 standard library only') + 'import math\n\n# name, N_h, S_h, cost per participant\nstrata = ' + J(rows) + '\nn = ' + (num(st.n) > 0 ? Math.floor(num(st.n)) : 100) + '\nminimum = ' + (num(st.min) >= 0 ? Math.floor(num(st.min)) : 0) + '\n\ndef share(weights, n, lo, hi):\n    """Proportional shares with bounds; largest remainders keep the total equal to n."""\n    H = len(weights)\n    fixed = [None] * H\n    while True:\n        left = n - sum(v for v in fixed if v is not None)\n        sw = sum(w for w, v in zip(weights, fixed) if v is None)\n        val = [fixed[h] if fixed[h] is not None else left * weights[h] / sw for h in range(H)]\n        over = [h for h in range(H) if fixed[h] is None and val[h] > hi[h]]\n        if over:\n            for h in over:\n                fixed[h] = hi[h]\n            continue\n        under = [h for h in range(H) if fixed[h] is None and val[h] < lo[h]]\n        if under:\n            for h in under:\n                fixed[h] = lo[h]\n            continue\n        break\n    out = [int(fixed[h]) if fixed[h] is not None else int(math.floor(val[h] + 1e-9)) for h in range(H)]\n    free = sorted([h for h in range(H) if fixed[h] is None], key=lambda h: -(val[h] - math.floor(val[h] + 1e-9)))\n    i = 0\n    while sum(out) < n and free:\n        h = free[i % len(free)]\n        if out[h] < hi[h]:\n            out[h] += 1\n        i += 1\n    return out\n\nN = sum(s[1] for s in strata)\nlo = [min(minimum, s[1]) for s in strata]\nhi = [s[1] for s in strata]\nmethods = {\n    "proportional": [s[1] for s in strata],\n    "neyman": [s[1] * s[2] for s in strata],\n    "cost-optimal": [s[1] * s[2] / math.sqrt(s[3]) for s in strata],\n}\nfor label, wts in methods.items():\n    nh = share(wts, n, lo, hi)\n    var = sum((s[1] / N) ** 2 * s[2] ** 2 / m * (1 - m / s[1]) for s, m in zip(strata, nh) if m > 0)\n    cost = sum(s[3] * m for s, m in zip(strata, nh))\n    print(label, nh, "SE = %.4f" % math.sqrt(var), "cost = %.0f" % cost)\n';
    },
    power: function (st) {
      var r = X.powerCalc(st), d = r.err ? 'ind' : r.d;
      return pyHead('Sample size, power and budget', 'numpy, scipy') + 'import math\nimport numpy as np\nfrom scipy import stats, special, integrate\n\ndesign = ' + J(d) + '  # ind, paired, anova, corr\neffect = ' + (r.err ? 0.5 : r.es) + '\nalpha = ' + (r.err ? 0.05 : r.alpha) + '\ntails = ' + (r.err ? 2 : r.tails) + '\ntarget = ' + (r.err ? 0.8 : r.target) + '\nk = ' + (r.err || !(r.k >= 2) ? 3 : r.k) + '  # groups, used by anova\ncost_per_person = ' + (r.err ? 0 : r.cost.per) + '\nfixed_cost = ' + (r.err ? 0 : r.cost.fixed) + '\ncluster_size = ' + (r.err ? 0 : r.cost.clusterSize) + '\ncost_per_cluster = ' + (r.err ? 0 : r.cost.perCluster) + '\ndesign_effect = ' + (r.err ? 1 : r.deff) + '\nbudget = ' + (r.err || !r.budget ? 'None' : r.budget) + '\n\ndef r_density(r, n, rho):\n    lg = (math.log(n - 2) + special.gammaln(n - 1) - special.gammaln(n - 0.5) - 0.5 * math.log(2 * math.pi)\n          + (n - 1) / 2 * math.log(1 - rho ** 2) - (n - 1.5) * math.log(1 - rho * r) + (n - 4) / 2 * math.log(1 - r * r))\n    return math.exp(lg) * special.hyp2f1(0.5, 0.5, n - 0.5, (1 + rho * r) / 2)\n\ndef power(n):\n    n = n / design_effect\n    if design in ("ind", "paired"):\n        df = 2 * n - 2 if design == "ind" else n - 1\n        nc = effect * math.sqrt(n / 2) if design == "ind" else effect * math.sqrt(n)\n        tc = stats.t.ppf(1 - alpha / tails, df)\n        p = stats.nct.sf(tc, df, nc)\n        return p + (stats.nct.cdf(-tc, df, nc) if tails == 2 else 0)\n    if design == "anova":\n        N = n * k\n        return stats.ncf.sf(stats.f.ppf(1 - alpha, k - 1, N - k), k - 1, N - k, effect ** 2 * N)\n    tc = stats.t.ppf(1 - alpha / tails, n - 2)\n    rc = tc / math.sqrt(tc ** 2 + n - 2)\n    inside = integrate.quad(r_density, -rc if tails == 2 else -1, rc, args=(n, effect), limit=200)[0]\n    return 1 - inside\n\ndef people(n):\n    return n * (2 if design == "ind" else k if design == "anova" else 1)\n\ndef cost(n):\n    c = fixed_cost + people(n) * cost_per_person\n    if cluster_size and cost_per_cluster:\n        c += math.ceil(people(n) / cluster_size) * cost_per_cluster\n    return c\n\nn = 4 if design == "corr" else 2\nwhile power(n) < target:\n    n += 1\nprint("required n = %d (people: %d), power = %.4f, cost = %.0f" % (n, people(n), power(n), cost(n)))\nif budget is not None and (cost_per_person or cost_per_cluster):\n    m = 0\n    while cost(m + 1) <= budget:\n        m += 1\n    if m >= (4 if design == "corr" else 2):\n        print("budget %.0f buys n = %d, power = %.4f" % (budget, m, power(m)))\n    else:\n        print("the budget does not cover the smallest possible sample")\n';
    },
    sched: function (st) {
      var M = X.schedModel(st);
      return pyHead('Session schedule as a binary programme. DRAFT output: a named responsible person must review it.', 'numpy, scipy 1.9 or newer') + 'import numpy as np\nfrom scipy.optimize import milp, LinearConstraint, Bounds\n\nslots = ' + J(st.slots.map(function (t, i) { return name(t, i, 'ميعاد'); })) + '\nspecialists = ' + J(st.specs.map(function (p, i) { return name(p, i, 'أخصائي'); })) + '\ncapacity = ' + J(M.specs.map(function (s) { return s.cap < 0 ? 999 : s.cap; })) + '\navailable = ' + J(M.specs.map(function (s) { return s.avail.map(function (a) { return a ? 1 : 0; }); })) + '  # specialist x slot\ncodes = ' + J(st.cases.map(function (c, i) { return String(c.code || '').trim() || 'ح-' + (i + 1); })) + '\nstate = ' + J(M.cases.map(function (c) { return c.st; })) + '  # case x slot: 0 no, 1 available, 2 preferred\nwanted = ' + J(M.cases.map(function (c) { return c.pref; })) + '  # requested specialist index, -1 for none\n\n# one binary variable per feasible (case, specialist, slot)\nkeys, pen = [], []\nfor i in range(len(codes)):\n    has_pref = 2 in state[i]\n    for p in range(len(specialists)):\n        for t in range(len(slots)):\n            if state[i][t] and available[p][t]:\n                keys.append((i, p, t))\n                pen.append((1 if has_pref and state[i][t] != 2 else 0) + (1 if wanted[i] >= 0 and wanted[i] != p else 0))\nBIG = 10 * len(codes) + 10  # placing a case always beats any number of unmet preferences\ncost = np.array(pen, dtype=float) - BIG\nrows, upper = [], []\nfor i in range(len(codes)):  # each case at most once\n    rows.append([1 if k[0] == i else 0 for k in keys]); upper.append(1)\nfor p in range(len(specialists)):\n    rows.append([1 if k[1] == p else 0 for k in keys]); upper.append(capacity[p])  # capacity\n    for t in range(len(slots)):  # one session per specialist per slot\n        rows.append([1 if k[1] == p and k[2] == t else 0 for k in keys]); upper.append(1)\nres = milp(cost, constraints=LinearConstraint(np.array(rows), -np.inf, np.array(upper)), integrality=np.ones(len(keys)), bounds=Bounds(0, 1))\nplaced = [k for k, v in zip(keys, res.x) if v > 0.5]\nprint("DRAFT - needs review and sign-off by a named responsible person")\nprint("placed %d of %d, unmet preferences %d" % (len(placed), len(codes), sum(pen[keys.index(k)] for k in placed)))\nfor i, p, t in sorted(placed):\n    print(codes[i], "->", slots[t], "/", specialists[p])\n';
    },
    queue: function (st) {
      return pyHead('M/M/c queue (Erlang C) and staffing for a target mean wait', 'Python 3 standard library only') + 'from math import factorial, exp\n\narrivals_per_hour = ' + (num(st.lam) > 0 ? num(st.lam) : 4) + '\nservice_minutes = ' + (num(st.svc) > 0 ? num(st.svc) : 40) + '\nservers = ' + (num(st.c) >= 1 ? Math.floor(num(st.c)) : 4) + '\ntarget_wait_minutes = ' + (num(st.target) > 0 ? num(st.target) : 'None') + '\n\nlam, mu = arrivals_per_hour, 60.0 / service_minutes\n\ndef mmc(c):\n    a = lam / mu\n    rho = a / c\n    if rho >= 1:\n        return None\n    p0 = 1 / (sum(a ** k / factorial(k) for k in range(c)) + a ** c / factorial(c) / (1 - rho))\n    pw = a ** c / factorial(c) / (1 - rho) * p0\n    lq = pw * rho / (1 - rho)\n    return {"utilisation": rho, "p_wait": pw, "queue": lq, "wait_minutes": lq / lam * 60}\n\nr = mmc(servers)\nprint("unstable: the queue grows without limit" if r is None else r)\nif target_wait_minutes is not None:\n    c = int(lam / mu) + 1\n    while mmc(c) is None or mmc(c)["wait_minutes"] > target_wait_minutes:\n        c += 1\n    print("servers needed for the target:", c, mmc(c))\n';
    },
    short: function (st) {
      var P = X.parseItems(st.text), areas = []; P.items.forEach(function (it) { if (areas.indexOf(it.area) < 0) areas.push(it.area); });
      var each = num(st.each); if (isNaN(each) || each < 0) each = 0; var mins = parseMins(st.mins, areas, Math.floor(each)), lo = num(st.lo), hi = num(st.hi);
      return pyHead('Short-form assembly as a binary programme. A statistical suggestion: re-validate on a new sample.', 'numpy, scipy 1.9 or newer') + 'import numpy as np\nfrom scipy.optimize import milp, LinearConstraint, Bounds\n\n# code, content area, discrimination, difficulty (None when missing)\nitems = [' + P.items.map(function (it) { return '(' + J(it.code) + ', ' + J(it.area) + ', ' + it.disc + ', ' + (it.diff === null ? 'None' : it.diff) + ')'; }).join(', ') + ']\nk = ' + (num(st.k) >= 1 ? Math.floor(num(st.k)) : 1) + '\nminimum = {' + areas.map(function (a) { return J(a) + ': ' + mins[a]; }).join(', ') + '}\ndiff_lo = ' + (isNaN(lo) ? 'None' : lo) + '\ndiff_hi = ' + (isNaN(hi) ? 'None' : hi) + '\n\nn = len(items)\ndisc = np.array([it[2] for it in items], dtype=float)\nrows, lower, upper = [np.ones(n)], [k], [k]  # exactly k items\nfor area, m in minimum.items():  # content coverage\n    rows.append(np.array([1.0 if it[1] == area else 0.0 for it in items])); lower.append(m); upper.append(np.inf)\nif diff_lo is not None or diff_hi is not None:  # mean difficulty window\n    rows.append(np.array([it[3] for it in items], dtype=float))\n    lower.append(-np.inf if diff_lo is None else diff_lo * k - 1e-9); upper.append(np.inf if diff_hi is None else diff_hi * k + 1e-9)\nres = milp(-disc, constraints=LinearConstraint(np.array(rows), np.array(lower), np.array(upper)), integrality=np.ones(n), bounds=Bounds(0, 1))\nif res.x is None:\n    print("no set of items meets all the constraints")\nelse:\n    chosen = [it for it, v in zip(items, res.x) if v > 0.5]\n    print("Optimal")\n    print("selected:", [it[0] for it in chosen])\n    print("mean discrimination = %.4f" % (sum(it[2] for it in chosen) / k))\n';
    }
  };
  function parseMinsExport() { return parseMins; } void parseMinsExport;

  /* ---------- 08 from the problem to the model ---------- */
  var GOALS = [['choose', 'أختار بين بدائل على أكتر من معيار', 'ahp'], ['strata', 'أوزّع عينتي على فئات المجتمع', 'strata'], ['power', 'أعرف العينة اللي تكفي، أو ميزانيتي تجيب إيه', 'power'], ['sched', 'أوزّع حالات أو مشاركين على أخصائيين ومواعيد', 'sched'], ['queue', 'أعرف محتاج كام أخصائي عشان الانتظار ما يطولش', 'queue'], ['short', 'أختصر مقياس طويل وأحافظ على مجالاته', 'short']];
  var QUICK = {
    ahp: [['alts', 'البدائل، افصل بفاصلة', true], ['crit', 'المعايير، افصل بفاصلة', true]], topsis: [['alts', 'البدائل، افصل بفاصلة', true], ['crit', 'المعايير، افصل بفاصلة', true]],
    strata: [['n', 'حجم العينة الكلي']], power: [['es', 'حجم الأثر المتوقع'], ['per', 'تكلفة المشارك'], ['budget', 'الميزانية']], queue: [['lam', 'الوصول في الساعة'], ['svc', 'مدة الجلسة بالدقايق'], ['c', 'عدد الأخصائيين']], short: [['k', 'عدد بنود الصورة المختصرة']], sched: []
  };
  function splitList(s) { return String(s || '').split(/[,،\n]/).map(function (x) { return x.trim(); }).filter(Boolean); }
  function applyQuick(D, tool, q) {
    var t = X.tools[tool], st = D[tool] || (D[tool] = t.def()), n = 0;
    (QUICK[tool] || []).forEach(function (fld) {
      var v = String(q[fld[0]] || '').trim(); if (!v) return; n++;
      if (fld[0] === 'alts' || fld[0] === 'crit') { var L = splitList(v).slice(0, fld[0] === 'crit' ? 7 : 6); if (L.length < 2) { n--; return; } st[fld[0]] = L.map(function (nm, i) { var o = st[fld[0]][i] || {}; return tool === 'topsis' && fld[0] === 'crit' ? { id: o.id || H.uid(), name: nm, w: o.w || '1', kind: o.kind || 'benefit' } : { id: o.id || H.uid(), name: nm }; }); }
      else st[fld[0]] = v;
    });
    return n;
  }
  X.wizard = function (main) {
    var D = X.D, W = D.wiz || (D.wiz = { goal: '', data: '', q: {} }); W.q = W.q || {};
    function tool() { var g = GOALS.filter(function (x) { return x[0] === W.goal; })[0]; if (!g) return ''; if (W.goal === 'choose') return W.data === 'yes' ? 'topsis' : W.data === 'no' ? 'ahp' : ''; return g[2]; }
    function draw(focus) {
      var id = tool(), t = id && X.tools[id];
      var html = '<div class="mdc mdc-wizard"><p class="crumb"><a href="#decide">' + ic('back') + 'كل أدوات القرار</a></p><header class="head mdc-thead"><span class="mdc-no num" aria-hidden="true">08</span><div><h1>من المشكلة للنموذج</h1><p class="lead">قول لنا عايز تعمل إيه، ونوصّلك للأداة المناسبة، ونكتب لك النموذج الرياضي وسكربت بايثون تشغّله بنفسك.</p></div></header>' +
        '<section class="mdc-q"><h2>1. عايز تعمل إيه؟</h2><ul class="mdc-opts">' + GOALS.map(function (g) { return '<li><button type="button" class="mdc-opt" data-goal="' + g[0] + '" aria-pressed="' + (W.goal === g[0]) + '">' + X.glyph(g[2]) + '<span>' + esc(g[1]) + '</span></button></li>'; }).join('') + '</ul></section>' +
        (W.goal === 'choose' ? '<section class="mdc-q" id="mdc-q2"><h2>2. عندك رقم لكل بديل على كل معيار؟</h2><ul class="mdc-opts"><li><button type="button" class="mdc-opt" data-data="yes" aria-pressed="' + (W.data === 'yes') + '">' + X.glyph('topsis') + '<span>أيوه، معايا جدول أرقام (تكلفة، وقت، درجات)</span></button></li><li><button type="button" class="mdc-opt" data-data="no" aria-pressed="' + (W.data === 'no') + '">' + X.glyph('ahp') + '<span>لأ، هحكم بخبرتي وأقارن كل اتنين مع بعض</span></button></li></ul></section>' : '');
      if (t) {
        var has = !!D[id], q = QUICK[id] || [];
        html += '<section class="mdc-route" id="mdc-route"><div class="mdc-route-a block ' + t.color + '">' + X.glyph(id) + '<p class="block-label">الأداة المناسبة</p><strong>' + esc(t.title) + '</strong><p>' + t.what + '</p>' + (t.people ? '<p><strong>ناتجها مسودة لازم يراجعها مسؤول.</strong></p>' : '') +
          (q.length ? '<div class="mdc-quick">' + q.map(function (fld) { return '<label class="mdc-f"><span class="mdc-fl">' + esc(fld[1]) + '</span><input type="text" data-q="' + fld[0] + '"' + (fld[2] ? '' : ' inputmode="decimal" dir="ltr" class="num"') + ' value="' + esc(W.q[fld[0]] || '') + '" autocomplete="off"></label>'; }).join('') + '<p class="small">اللي تكتبه هنا هيتملى في الأداة. سيبه فاضي لو عايز تبدأ من هناك.</p></div>' : '') +
          '<div class="row"><button class="btn inked" type="button" id="mdc-open">افتح الأداة</button><button class="btn onblock" type="button" id="mdc-py">' + ic('download') + 'سكربت بايثون</button></div><p class="small">' + (has ? 'السكربت هيتكتب بالأرقام المحفوظة عندك في الأداة دي.' : 'لسه مفيش أرقام محفوظة في الأداة دي، فالسكربت هيتكتب بأرقام المثال.') + '</p></div>' +
          '<div class="mdc-route-b"><h2>النموذج الرياضي</h2><div class="mdc-model-in">' + X.model[id] + '</div></div></section>';
      }
      main.innerHTML = html + '</div>';
      var root = $('.mdc-wizard', main);
      $$('[data-goal]', root).forEach(function (b) { b.addEventListener('click', function () { W.goal = b.getAttribute('data-goal'); if (W.goal !== 'choose') W.data = ''; H.save(); draw(W.goal === 'choose' ? '#mdc-q2' : '#mdc-route'); }); });
      $$('[data-data]', root).forEach(function (b) { b.addEventListener('click', function () { W.data = b.getAttribute('data-data'); H.save(); draw('#mdc-route'); }); });
      $$('[data-q]', root).forEach(function (el) { el.addEventListener('input', function () { W.q[el.getAttribute('data-q')] = el.value; H.save(); }); });
      var o = $('#mdc-open', root); if (o) o.addEventListener('click', function () { var n = applyQuick(D, id, W.q); H.save(); if (n) H.toast('اتملى اللي كتبته في الأداة.'); H.go('#decide/' + id); });
      var p = $('#mdc-py', root); if (p) p.addEventListener('click', function () { applyQuick(D, id, W.q); H.save(); h.dl('decide-' + id + '.py', X.py[id](D[id] && !isBlank(id, D[id]) ? D[id] : X.tools[id].example())); });
      if (focus) { var el = $(focus, root); if (el) { el.scrollIntoView({ block: 'start', behavior: H.calm() ? 'auto' : 'smooth' }); var fb = $('button, input', el); if (fb) fb.focus({ preventScroll: true }); } }
    }
    function isBlank(id, st) { return JSON.stringify(st) === JSON.stringify(X.tools[id].def()); }
    draw();
  };
})();
