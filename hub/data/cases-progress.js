/* Session log and progress for the case workbench: goal attainment scaling, per-goal charts with the baseline
   phase marked, a transparent "what went with improvement" count, next-session prompts and two printable reports. */
(function () {
  'use strict';
  var made = null;
  window.HubCasesProgress = function (A) {
    if (made) return made;
    var H = A.H, esc = H.esc, $ = H.$, $$ = H.$$, K = A.K;
    var P3 = { eng: ['الاندماج', ['قليل', 'متوسط', 'عالي']], eff: ['المجهود', ['قليل', 'متوسط', 'عالي']], mood: ['المزاج', ['متضايق', 'عادي', 'مبسوط']] };
    var GL = [[-2, 'أقل بكتير من المتوقع'], [-1, 'أقل من المتوقع'], [0, 'المتوقع'], [1, 'أحسن من المتوقع'], [2, 'أحسن بكتير من المتوقع']];

    function sorted(c) { return (c.sessions || []).slice().sort(function (a, b) { return a.d < b.d ? -1 : a.d > b.d ? 1 : 0; }); }
    function series(c, gid) { var A1 = [], B1 = []; sorted(c).forEach(function (s) { var v = (s.rate || {})[gid]; if (v == null || v === '') return; (s.ph === 'base' ? A1 : B1).push(+v); }); return { A: A1, B: B1, all: A1.concat(B1) }; }
    /* Kiresuk & Sherman summary score with equal weights and the conventional inter-goal correlation of 0.3. */
    function gasT(x) { var n = x.length; if (!n) return NaN; return 50 + 10 * x.reduce(function (s, v) { return s + v; }, 0) / Math.sqrt(0.7 * n + 0.3 * n * n); }
    function sessT(s) { var x = Object.keys(s.rate || {}).filter(function (k) { return s.rate[k] !== '' && s.rate[k] != null; }).map(function (k) { return +s.rate[k]; }); return x.length ? gasT(x) : NaN; }
    /* For each technique: in how many sessions that used it did the goal ratings, summed, rise / stay / fall
       compared with the session before. Association only. */
    function worked(c) {
      var ss = sorted(c), o = {};
      for (var i = 1; i < ss.length; i++) {
        var net = 0, any = false; Object.keys(ss[i].rate || {}).forEach(function (g) { var a = ss[i - 1].rate && ss[i - 1].rate[g], b = ss[i].rate[g]; if (a == null || a === '' || b == null || b === '') return; net += b - a; any = true; });
        if (!any) continue;
        (ss[i].techs || []).forEach(function (t) { o[t] = o[t] || { up: 0, same: 0, down: 0 }; o[t][net > 0 ? 'up' : net < 0 ? 'down' : 'same']++; });
      }
      return Object.keys(o).map(function (t) { return { t: t, l: A.label(K.TECHS, t) || t, up: o[t].up, same: o[t].same, down: o[t].down }; }).sort(function (a, b) { return b.up - a.up || a.down - b.down; });
    }
    function stalled(c) { return (c.goals || []).filter(function (g) { var a = series(c, g.id).all; if (a.length < 3) return false; var l = a.slice(-3); return l[1] <= l[0] && l[2] <= l[0] && l[2] < 0; }); }
    function nextUp(c) {
      var ss = sorted(c), last = ss[ss.length - 1], items = [];
      if (last && last.carry) items.push(['carry', 'من الجلسة اللي فاتت: ' + last.carry]);
      if (last && last.home) items.push(['home', 'اسأل عن نشاط البيت: ' + last.home]);
      K.PLANS.forEach(function (p) { var st = (c.plans || {})[p.id]; if (st && st.on && A.addDays(st.start, p.days) <= H.today() && !Object.keys(st.out || {}).some(function (k) { return st.out[k]; })) items.push(['due', 'خطة «' + p.t + '» ميعادها جه: سجّل اللي لقيته في جدول القرار.']); });
      stalled(c).forEach(function (g) { items.push(['stall', 'الهدف «' + g.t + '» ما اتحركش في آخر 3 جلسات: راجع الخطة أو الهدف نفسه.']); });
      return items;
    }
    function kidLog(c) { try { var l = ((H.state().mods || {}).kids || {}).log; l = l && c.kidId ? l[c.kidId] : null; return Array.isArray(l) ? l.slice(-8).reverse() : []; } catch (e) { return []; } }
    function techChoices(c) {
      var on = [], rest = []; K.HYPS.forEach(function (h) { if ((c.hyps[h.id] || {}).on) K.HANDLE[h.id].techs.forEach(function (t) { if (on.indexOf(t) < 0) on.push(t); }); });
      K.TECHS.forEach(function (t) { if (on.indexOf(t[0]) < 0) rest.push(t[0]); });
      return { on: on, rest: rest };
    }
    function goalChart(c, g) { var s = series(c, g.id); return s.all.length ? A.phaseChart(s.A, s.B, { lo: -2, hi: 2, a: 'خط قاعدي', b: 'تدخّل', label: 'تقدّم الهدف: ' + g.t }) : '<p class="muted small">لسه مفيش تقييم للهدف ده.</p>'; }
    function change(c, g) { var a = series(c, g.id).all; return a.length > 1 ? a[a.length - 1] - a[0] : null; }

    var form = null;
    function tab(c) {
      var S = H.state(), ss = sorted(c), up = nextUp(c), tc = techChoices(c), w = worked(c), base = '#cases/c/' + c.id, log = kidLog(c);
      var h = A.caseHead(c, 'sess') + '<header class="mcases-th"><h2>الجلسات والتقدّم</h2><p class="lead">دقيقتين بعد كل جلسة. التقدّم بيتقاس بأهداف إنت اللي بتكتب درجاتها، مقارنةً ببداية الطفل نفسه مش بغيره.</p></header>';
      h += '<section class="mcases-nextup"><h3>الجلسة الجاية</h3>' + (up.length ? '<ul>' + up.map(function (x) { return '<li class="n-' + x[0] + '">' + esc(x[1]) + '</li>'; }).join('') + '</ul>' : '<p class="muted">مفيش حاجة معلّقة. ' + (ss.length ? '' : 'عرّف هدف واحد على الأقل وسجّل أول جلسة.') + '</p>') + '</section>';
      /* goals */
      h += '<section class="mcases-sec"><div class="sec"><h2>الأهداف <span class="num">' + c.goals.length + '</span></h2><button class="btn" type="button" data-act="g-new">' + H.ic('plus') + 'هدف جديد</button></div>';
      if (form === 'goal') h += '<form class="card form mcases-gf" id="mcases-gf"><div class="fld">' + H.field('g-t', 'الهدف بلغة بسيطة', '', 'هيظهر لولي الأمر زي ما هو. مثال: «يقعد يكمّل واجب 10 دقايق».') + '</div><p class="small muted">اكتب وصف يتشاف لكل درجة. المستوى 0 هو اللي متوقع يوصله في آخر المدة، و-2 غالبًا مستواه دلوقتي.</p>' + GL.map(function (l) { return '<div class="fld mcases-an"><label for="g-a' + l[0] + '"><b class="num" dir="ltr">' + (l[0] > 0 ? '+' : '') + l[0] + '</b> ' + l[1] + '</label><input type="text" id="g-a' + l[0] + '" maxlength="120"></div>'; }).join('') + '<p class="small err" role="alert" id="g-err"></p><p class="row"><button class="btn primary" type="submit">احفظ الهدف</button><button class="btn" type="button" data-act="cancel">إلغاء</button></p></form>';
      h += c.goals.length ? '<div class="mcases-goals">' + c.goals.map(function (g) { var a = series(c, g.id).all, last = a.length ? a[a.length - 1] : null; return '<article class="mcases-goal"><header><h3>' + esc(g.t) + '</h3><span class="mcases-gnow">' + (last == null ? 'لسه' : '<b class="num" dir="ltr">' + (last > 0 ? '+' : '') + last + '</b>') + '</span></header>' + goalChart(c, g) + '<details><summary>درجات الهدف</summary><ol class="mcases-anl">' + GL.map(function (l, i) { return '<li><b class="num" dir="ltr">' + (l[0] > 0 ? '+' : '') + l[0] + '</b> ' + esc(g.an[i] || l[1]) + '</li>'; }).join('') + '</ol><button class="btn danger" type="button" data-act="g-del" data-id="' + g.id + '">امسح الهدف</button></details></article>'; }).join('') + '</div>' : (form === 'goal' ? '' : '<p class="muted">لسه مفيش أهداف. الهدف الكويس سلوك يتشاف، وله 5 درجات من «أقل بكتير من المتوقع» لـ«أحسن بكتير».</p>');
      h += '</section>';
      /* session form */
      h += '<section class="mcases-sec"><div class="sec"><h2>سجّل جلسة</h2>' + (form === 'sess' ? '' : '<button class="btn primary" type="button" data-act="s-new">' + H.ic('plus') + 'جلسة جديدة</button>') + '</div>';
      if (form === 'sess') {
        function techBox(t) { return '<label><input type="checkbox" name="tech" value="' + t + '"><span>' + esc(A.label(K.TECHS, t)) + '</span></label>'; }
        var act = K.PLANS.filter(function (p) { return (c.plans[p.id] || {}).on; }), week = (c.abc || []).filter(function (e) { return e.d > A.addDays(H.today(), -7); }).length;
        h += '<form class="card form mcases-sf" id="mcases-sf"><div class="two"><div class="fld"><label for="se-d">التاريخ</label><input type="date" id="se-d" value="' + H.today() + '"></div><div class="fld">' + H.field('se-dur', 'المدة بالدقايق', '', '', 'number') + '</div><div class="fld"><label for="se-ph">المرحلة</label><select id="se-ph"><option value="base"' + (ss.some(function (s) { return s.ph === 'int'; }) ? '' : ' selected') + '>خط قاعدي (قبل التدخّل)</option><option value="int"' + (ss.some(function (s) { return s.ph === 'int'; }) ? ' selected' : '') + '>تدخّل</option></select></div></div>' +
          '<fieldset><legend>اتعمل إيه؟</legend>' + (tc.on.length ? '<p class="small muted">من خطة التعامل اللي اخترتها:</p>' : '') + '<div class="mcases-pick">' + tc.on.map(techBox).join('') + act.map(function (p) { return '<label><input type="checkbox" name="plan" value="' + p.id + '"><span>خطة تأكد: ' + esc(p.t) + '</span></label>'; }).join('') + '</div><details' + (tc.on.length ? '' : ' open') + '><summary>أساليب تانية</summary><div class="mcases-pick">' + tc.rest.map(techBox).join('') + '</div></details><div class="fld">' + H.field('se-did', 'تفاصيل (اختياري)', '', '', 'text') + '</div></fieldset>' +
          '<fieldset><legend>استجابة الطفل</legend><div class="mcases-p3">' + Object.keys(P3).map(function (k) { return '<div role="radiogroup" aria-label="' + P3[k][0] + '"><span>' + P3[k][0] + '</span>' + P3[k][1].map(function (l, i) { return '<label><input type="radio" name="' + k + '" value="' + (i + 1) + '"><span>' + l + '</span></label>'; }).join('') + '</div>'; }).join('') + '</div><div class="fld">' + H.field('se-note', 'ملاحظات', '', '', 'text') + '</div></fieldset>' +
          '<div class="two"><div class="fld">' + H.field('se-ok', 'إيه اللي نجح؟', '', '', 'area') + '</div><div class="fld">' + H.field('se-no', 'وإيه اللي ما نجحش؟', '', '', 'area') + '</div><div class="fld">' + H.field('se-home', 'نشاط البيت', '', 'هيظهر في تقرير ولي الأمر', 'text') + '</div><div class="fld">' + H.field('se-carry', 'للجلسة الجاية', '', '', 'text') + '</div></div>' +
          (c.goals.length ? '<fieldset><legend>تقييم الأهداف النهارده</legend>' + c.goals.map(function (g) { return '<div class="fld mcases-rate"><label for="ra-' + g.id + '">' + esc(g.t) + '</label><select id="ra-' + g.id + '" data-goal="' + g.id + '"><option value="">ما اتقيّمش</option>' + GL.map(function (l, i) { return '<option value="' + l[0] + '">' + (l[0] > 0 ? '+' : '') + l[0] + ' · ' + esc(g.an[i] || l[1]) + '</option>'; }).join('') + '</select></div>'; }).join('') + '</fieldset>' : '<p class="notice">عرّف هدف الأول علشان تقدر تقيّمه كل جلسة.</p>') +
          '<div class="two"><div class="fld">' + H.field('se-cnt', 'عدّ السلوك الأسبوع ده (اختياري)', '', 'من ورقة التسجيل. تسجيلات ABC في آخر 7 أيام هنا: ' + week, 'number') + '</div></div>' +
          (log.length ? '<fieldset><legend>نتايج أنشطة من قسم الألعاب (اختياري)</legend><div class="mcases-pick">' + log.map(function (e, i) { return '<label><input type="checkbox" name="act" value="' + i + '"><span>' + esc(String(e.a || 'نشاط')) + ' · ' + esc(String(e.d || '')) + ' · مستوى ' + esc(String(e.lvl || 0)) + '</span></label>'; }).join('') + '</div></fieldset>' : '') +
          '<p class="small err" role="alert" id="se-err"></p><p class="form-end row"><button class="btn primary" type="submit">احفظ الجلسة</button><button class="btn" type="button" data-act="cancel">إلغاء</button></p></form>';
      }
      h += '</section>';
      /* timeline */
      if (ss.length) {
        h += '<section class="mcases-sec"><div class="sec"><h2>الخط الزمني <span class="num">' + ss.length + '</span></h2><span class="row"><a class="btn" href="#cases/print/' + c.id + '.progress">' + H.ic('print') + 'تقرير للمشرف</a><a class="btn" href="#cases/print/' + c.id + '.family">تقرير لولي الأمر</a></span></div><ol class="mcases-time">' + ss.map(function (s, i) {
          var T = sessT(s);
          return '<li class="p-' + s.ph + '"><div class="mcases-tdot" aria-hidden="true"><span class="num">' + (i + 1) + '</span></div><div class="mcases-tb"><p class="mcases-tm">' + A.fmtD(s.d) + (s.dur ? ' · <span class="num">' + esc(s.dur) + '</span> دقيقة' : '') + ' · <b>' + (s.ph === 'base' ? 'خط قاعدي' : 'تدخّل') + '</b></p>' +
            ((s.techs || []).length || (s.plans || []).length ? '<p class="mcases-techs">' + (s.techs || []).map(function (t) { return '<span>' + esc(A.label(K.TECHS, t)) + '</span>'; }).join('') + (s.plans || []).map(function (p) { var pl = A.byId(K.PLANS, p); return pl ? '<span>' + esc(pl.t) + '</span>' : ''; }).join('') + '</p>' : '') +
            '<p class="small">' + Object.keys(P3).filter(function (k) { return s[k]; }).map(function (k) { return P3[k][0] + ': ' + P3[k][1][s[k] - 1]; }).join(' · ') + '</p>' + (s.did ? '<p>' + esc(s.did) + '</p>' : '') + (s.ok ? '<p><b>نجح:</b> ' + esc(s.ok) + '</p>' : '') + (s.no ? '<p><b>ما نجحش:</b> ' + esc(s.no) + '</p>' : '') + (s.home ? '<p><b>نشاط البيت:</b> ' + esc(s.home) + '</p>' : '') +
            (Object.keys(s.rate || {}).length ? '<p class="mcases-rates">' + c.goals.filter(function (g) { return s.rate[g.id] != null && s.rate[g.id] !== ''; }).map(function (g) { var v = +s.rate[g.id]; return '<span>' + esc(g.t) + ' <b class="num" dir="ltr">' + (v > 0 ? '+' : '') + v + '</b></span>'; }).join('') + (isNaN(T) ? '' : '<span class="t">درجة GAS المجمّعة <b class="num">' + A.r2(T) + '</b></span>') + '</p>' : '') +
            (s.cnt !== '' && s.cnt != null ? '<p class="small">عدّ السلوك: <b class="num">' + esc(s.cnt) + '</b></p>' : '') + ((s.acts || []).length ? '<p class="small">أنشطة مرفقة: ' + s.acts.map(function (e) { return esc(String(e.a)) + ' (مستوى ' + esc(String(e.lvl)) + ')'; }).join('، ') + '</p>' : '') +
            '<button class="btn icon" type="button" data-act="s-del" data-id="' + s.id + '" aria-label="امسح الجلسة">' + H.ic('trash') + '</button></div></li>';
        }).join('') + '</ol><p class="small muted">درجة GAS المجمّعة = 50 + 10 × مجموع الدرجات ÷ جذر(0.7 × عدد الأهداف + 0.3 × مربّع عدد الأهداف)، بأوزان متساوية (Kiresuk و Sherman، 1968). 50 معناها «المتوقع». وصفية بس، والدرجات إنت اللي بتحطها.</p></section>';
        h += '<section class="mcases-sec mcases-worked"><div class="sec"><h2>إيه اللي نجح؟</h2></div>' + (w.length ? '<div class="tablewrap"><table class="mcases-wt"><thead><tr><th scope="col">الأسلوب</th><th scope="col">جلسات الأهداف طلعت فيها</th><th scope="col">ثبتت</th><th scope="col">نزلت</th></tr></thead><tbody>' + w.map(function (x) { return '<tr data-t="' + x.t + '"><th scope="row">' + esc(x.l) + '</th><td class="num up">' + x.up + '</td><td class="num">' + x.same + '</td><td class="num down">' + x.down + '</td></tr>'; }).join('') + '</tbody></table></div>' : '<p class="muted">محتاجين جلستين متقيّمين على الأقل وفيهم أساليب متعلّمة.</p>') + '<p class="mcases-caveat">ده عدّ لارتباط، مش إثبات: الجلسة بتتحسب «طلعت» لو مجموع درجات الأهداف زاد عن الجلسة اللي قبلها. ممكن التحسن يكون لسبب تاني خالص.</p></section>';
      }
      if ((S.kids || []).length) h += '<section class="mcases-sec"><div class="fld mcases-link"><label for="se-kid">اربط الحالة بطفل مسجّل (علشان ترفق نتايج أنشطته)</label><select id="se-kid"><option value="">من غير ربط</option>' + S.kids.map(function (k) { return '<option value="' + k.id + '"' + (k.id === c.kidId ? ' selected' : '') + '>' + esc(A.firstName(k.child)) + '</option>'; }).join('') + '</select></div></section>';
      h += '<p class="mcases-next"><a class="btn primary" href="' + base + '.file">كمّل: الملف</a></p>' + A.disclaimer();
      A.paint(h, { click: function (act, t) {
        if (act === 'g-new') { form = 'goal'; tab(c); A.refocus('#g-t'); }
        else if (act === 's-new') { form = 'sess'; tab(c); A.refocus('#se-d'); }
        else if (act === 'cancel') { form = null; tab(c); }
        else if (act === 'g-del') { var id = t.getAttribute('data-id'); c.goals = c.goals.filter(function (g) { return g.id !== id; }); c.sessions.forEach(function (s) { if (s.rate) delete s.rate[id]; }); H.save(); tab(c); }
        else if (act === 's-del') { c.sessions = c.sessions.filter(function (s) { return s.id !== t.getAttribute('data-id'); }); H.save(); tab(c); }
      }, change: function (el) { if (el.id === 'se-kid') { c.kidId = el.value; H.save(); tab(c); } },
      submit: function (f) {
        function v(id) { var el = $('#' + id); return el ? el.value.trim() : ''; }
        if (f.id === 'mcases-gf') {
          var t = v('g-t'); if (!t) { $('#g-err').textContent = 'اكتب الهدف.'; return; }
          var an = GL.map(function (l) { return v('g-a' + l[0]); }); if (!an[0] || !an[2]) { $('#g-err').textContent = 'اكتب على الأقل وصف المستوى -2 (مستواه دلوقتي) والمستوى 0 (المتوقع).'; return; }
          c.goals.push({ id: H.uid(), t: t, an: an }); form = null; H.save(); tab(c);
        }
        if (f.id === 'mcases-sf') {
          var s = { id: H.uid(), d: v('se-d') || H.today(), dur: v('se-dur'), ph: v('se-ph'), did: v('se-did'), note: v('se-note'), ok: v('se-ok'), no: v('se-no'), home: v('se-home'), carry: v('se-carry'), cnt: v('se-cnt') === '' ? '' : +v('se-cnt'), rate: {}, acts: [] };
          s.techs = $$('input[name=tech]:checked', f).map(function (x) { return x.value; }); s.plans = $$('input[name=plan]:checked', f).map(function (x) { return x.value; });
          Object.keys(P3).forEach(function (k) { var r = $('input[name=' + k + ']:checked', f); s[k] = r ? +r.value : 0; });
          $$('select[data-goal]', f).forEach(function (el) { if (el.value !== '') s.rate[el.getAttribute('data-goal')] = +el.value; });
          $$('input[name=act]:checked', f).forEach(function (x) { var e = log[+x.value]; if (e) s.acts.push({ a: e.a, d: e.d, lvl: e.lvl || 0, n: e.n || 0, err: e.err || 0 }); });
          if (!s.techs.length && !s.plans.length && !s.did) { $('#se-err').textContent = 'اختار أسلوب واحد على الأقل أو اكتب اللي اتعمل.'; return; }
          c.sessions.push(s); form = null; H.save(); H.toast('اتحفظ'); tab(c);
        }
      } });
    }

    function word(d) { return d == null ? 'لسه في الأول' : d > 0 ? 'أحسن من بدايته' : d < 0 ? 'محتاج وقت ودعم أكتر' : 'زي بدايته لحد دلوقتي'; }
    function report(c, kind) {
      var ss = sorted(c), mins = ss.reduce(function (s, x) { return s + (parseFloat(x.dur) || 0); }, 0), used = [], homes = [];
      ss.forEach(function (s) { (s.techs || []).forEach(function (t) { if (used.indexOf(t) < 0) used.push(t); }); if (s.home && homes.indexOf(s.home) < 0) homes.push(s.home); });
      if (kind === 'family') {
        return '<h2>متابعة ' + esc(c.code) + '</h2><p>من ' + (ss.length ? A.fmtD(ss[0].d) + ' لـ ' + A.fmtD(ss[ss.length - 1].d) : '—') + ' · <span class="num">' + ss.length + '</span> جلسة</p>' +
          '<h3>اشتغلنا على إيه</h3>' + (used.length ? '<ul>' + used.map(function (t) { var e = K.TECHS.filter(function (x) { return x[0] === t; })[0]; return '<li>' + esc(e ? e[2] : t) + '</li>'; }).join('') + '</ul>' : '<p>—</p>') +
          '<h3>إيه اللي اتغيّر مقارنةً ببدايته هو</h3>' + (c.goals.length ? '<ul>' + c.goals.map(function (g) { return '<li><b>' + esc(g.t) + ':</b> ' + word(change(c, g)) + '.</li>'; }).join('') + '</ul>' : '<p>لسه بنحدد الأهداف.</p>') + '<p class="small">المقارنة مع الطفل نفسه في أول المتابعة، مش مع أي طفل تاني.</p>' +
          '<h3>تعملوا إيه في البيت</h3>' + (homes.length ? '<ul>' + homes.slice(-4).map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul>' : '<p>هنتفق عليه في الجلسة الجاية.</p>') + '<p>كل طفل بيتقدّم بسرعته. تشجيعكم على المحاولة، مش بس على النتيجة، بيفرق كتير.</p>';
      }
      var w = worked(c), tl = A.tally(c), up = nextUp(c);
      return '<h2>تقرير تقدّم: ' + esc(c.code) + '</h2><p class="mcases-draft">مسودة يعتمدها الأخصائي. مش تشخيص.</p><p>الفترة: ' + (ss.length ? A.fmtD(ss[0].d) + ' لـ ' + A.fmtD(ss[ss.length - 1].d) : '—') + ' · الجلسات: <span class="num">' + ss.length + '</span> (خط قاعدي ' + ss.filter(function (s) { return s.ph === 'base'; }).length + '، تدخّل ' + ss.filter(function (s) { return s.ph !== 'base'; }).length + ') · إجمالي الدقايق: <span class="num">' + mins + '</span></p>' +
        '<h3>الأهداف (مقياس بلوغ الأهداف GAS)</h3>' + (c.goals.length ? c.goals.map(function (g) { var a = series(c, g.id).all, d = change(c, g); return '<div class="mcases-rg"><h4>' + esc(g.t) + '</h4><p>أول تقييم: <b class="num" dir="ltr">' + (a.length ? a[0] : '—') + '</b> · آخر تقييم: <b class="num" dir="ltr">' + (a.length ? a[a.length - 1] : '—') + '</b> · الفرق: <b class="num" dir="ltr">' + (d == null ? '—' : (d > 0 ? '+' : '') + d) + '</b></p>' + goalChart(c, g) + '<ol class="mcases-anl">' + GL.map(function (l, i) { return '<li><b class="num" dir="ltr">' + (l[0] > 0 ? '+' : '') + l[0] + '</b> ' + esc(g.an[i] || l[1]) + '</li>'; }).join('') + '</ol></div>'; }).join('') : '<p>مفيش أهداف متعرّفة.</p>') +
        '<h3>الأساليب وارتباطها بتغيّر الأهداف</h3>' + (w.length ? '<table class="mcases-sumt"><thead><tr><th>الأسلوب</th><th>طلعت</th><th>ثبتت</th><th>نزلت</th></tr></thead><tbody>' + w.map(function (x) { return '<tr><th scope="row">' + esc(x.l) + '</th><td class="num">' + x.up + '</td><td class="num">' + x.same + '</td><td class="num">' + x.down + '</td></tr>'; }).join('') + '</tbody></table><p class="small">عدّ لارتباط بين الأسلوب وتغيّر مجموع درجات الأهداف عن الجلسة السابقة. مش إثبات سببية.</p>' : '<p>البيانات لسه قليلة.</p>') +
        '<h3>لوحة الفرضيات</h3><ul>' + K.HYPS.map(function (hp) { return '<li>' + esc(hp.t) + ': معاها ' + tl[hp.id].plus.length + '، ضدها ' + tl[hp.id].minus.length + ((c.hyps[hp.id] || {}).on ? ' (بتتفحص)' : '') + '</li>'; }).join('') + '</ul>' +
        '<h3>الجلسات</h3><table class="mcases-sumt"><thead><tr><th>التاريخ</th><th>المرحلة</th><th>اتعمل</th><th>نجح / ما نجحش</th></tr></thead><tbody>' + ss.map(function (s) { return '<tr><td>' + A.fmtD(s.d) + '</td><td>' + (s.ph === 'base' ? 'خط قاعدي' : 'تدخّل') + '</td><td>' + (s.techs || []).map(function (t) { return esc(A.label(K.TECHS, t)); }).join('، ') + (s.did ? ' ' + esc(s.did) : '') + '</td><td>' + esc(s.ok || '') + (s.no ? ' / ' + esc(s.no) : '') + '</td></tr>'; }).join('') + '</tbody></table>' +
        '<h3>المطلوب الجاي</h3>' + (up.length ? '<ul>' + up.map(function (x) { return '<li>' + esc(x[1]) + '</li>'; }).join('') + '</ul>' : '<p>—</p>') + '<p>ملاحظات المشرف: ______________________________________________</p>';
    }
    made = { tab: tab, report: report, series: series, gasT: gasT, worked: worked, stalled: stalled, sorted: sorted, nextUp: nextUp };
    return made;
  };
})();
