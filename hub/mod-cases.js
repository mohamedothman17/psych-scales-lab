/* Case-reasoning workbench. Decision support for a qualified adult: it lays out what was told, several competing
   hypotheses and ways to check them. It never diagnoses and never rules on a child.
   Routes: #cases, #cases/new, #cases/c/<id>.<tab>[.<arg>], #cases/print/<id>.<kind>[.<arg>], #cases/train[/<id>],
   #cases/parent (the one screen a parent may open). Data lives in Hub.data('cases') on this device only. */
(function () {
  'use strict';
  var H = window.Hub, esc = H.esc, $ = H.$, $$ = H.$$, K = null, RX = null, main = null;
  var INF = { spec: ['أ', 'الأخصائي'], parent: ['و', 'ولي الأمر'], teacher: ['م', 'المدرّس'] };
  var TABS = [['story', 'الرواية والعناصر'], ['hyp', 'الفرضيات'], ['plans', 'خطط التأكد'], ['handle', 'التعامل'], ['sess', 'الجلسات والتقدّم'], ['file', 'الملف']];
  var DEPS = ['data/cases-data.js', 'data/cases-progress.js', 'data/cases-research.js'], loading = null;

  function D() {
    var d = H.data('cases');
    if (!d.v) d.v = 1;
    ['cases', 'accounts', 'train'].forEach(function (k) { if (!Array.isArray(d[k])) d[k] = []; });
    return d;
  }
  function getCase(id) { return D().cases.filter(function (c) { return c.id === id; })[0] || null; }
  function fmtD(iso) { var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(iso || '')); return '<bdi class="num" dir="ltr">' + (m ? m[3] + '/' + m[2] + '/' + m[1] : esc(iso || '')) + '</bdi>'; }
  function addDays(iso, n) { var d = new Date(iso + 'T12:00:00Z'); if (isNaN(d)) return iso; d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); }
  function byId(list, id) { for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i]; return null; }
  function label(pairs, k) { for (var i = 0; i < pairs.length; i++) if (pairs[i][0] === k) return pairs[i][1]; return ''; }
  function r2(x) { return Math.round(x * 100) / 100; }

  /* ---------- Arabic normalisation and extraction ---------- */
  function normCh(ch) {
    var c = ch.charCodeAt(0);
    if ((c >= 0x064B && c <= 0x065F) || c === 0x0670 || c === 0x0640) return '';
    if (ch === 'أ' || ch === 'إ' || ch === 'آ' || ch === 'ٱ') return 'ا';
    if (ch === 'ى') return 'ي'; if (ch === 'ة') return 'ه'; if (ch === 'ؤ') return 'و'; if (ch === 'ئ') return 'ي';
    if (c >= 0x0660 && c <= 0x0669) return String(c - 0x0660);
    return ch.toLowerCase();
  }
  function normAr(s) { var o = ''; for (var i = 0; i < s.length; i++) o += normCh(s[i]); return o; }
  /* Returns the normalised text and, for each of its characters, the index of the source character. */
  function norm(text) {
    text = String(text || ''); var out = '', map = [];
    for (var i = 0; i < text.length; i++) {
      var c = normCh(text[i]); if (!c) continue;
      if (!/[ء-ي0-9a-z]/.test(c)) c = ' ';
      if (c === ' ' && (out === '' || out.charAt(out.length - 1) === ' ')) continue;
      out += c; map.push(i);
    }
    return { s: out, map: map };
  }
  var NEG = { test: function (b) { return /(?:^| )(?:مش|مب|لا|ولا|مفيش|مافيش|من غير|بطل|بطلت|محدش) $/.test(b) || (/(?:^| )ما $/.test(b) && !/(?:بعد|كل|اول|ساعه|قبل|زي|وقت|لحد|طول|لما|يوم|بدل) ما $/.test(b)); } };
  function compile() {
    RX = K.LEX.map(function (e) {
      var loose = e[1] === 'set' || e[1] === 'who', src = normAr(e[3]).replace(/%/g, '(?:ب?[يتنا]|ب)');
      return { k: e[0], c: e[1], l: e[2], o: e[4] || {}, loose: loose, re: new RegExp((loose ? '()' : '(?:^| )([وف])?') + '(م[ا]?)?(?:' + src + ')(ش)?', 'g') };
    });
  }
  function slice(n, a, b) { return n.map.length && b > a ? String(n.src).slice(n.map[a], n.map[b - 1] + 1).trim() : ''; }
  var DUR = /(?:^| )(من(?:ذ)? (?:حوالي |تقريبا )?(?:\d+ )?(?:يومين|يوم|ايام|اسبوعين|اسبوع|اسابيع|شهرين|شهر|شهور|اشهر|سنتين|سنه|سنين|سنوات|ترم|زمان|وهو صغير|وهي صغيره|اول ما دخل\S*(?: \S+)?|ساعه ما(?: \S+){1,3}))/g;
  var FRQ = /(?:^| )((?:\d+ مرات|\d+ مره|مرتين|مره) (?:في|ف|كل) (?:اليوم|يوم|الاسبوع|اسبوع|الحصه|حصه|الشهر)|كل يوم|يوميا|كل حصه|كل اسبوع|على طول|طول الوقت|طول اليوم|دايما)/g;
  var LIKE = /(?:^| )[وف]?(?:ب?[يت]حب|شاطر في|شاطره في|بيتبسط ب|بتتبسط ب|هوايته|هوايتها) ((?:ال)?[ء-ي]{3,}(?: و(?:ال)?[ء-ي]{3,})?)/g;
  var AGE = /(?:عنده|عندها|عمره|عمرها|سنه|سنها) (\d{1,2}) (?:سنين|سنه|سنوات)/;
  function extract(text) {
    var n = norm(text), chips = [], deny = [], seen = {}, m; n.src = text;
    RX.forEach(function (x) {
      x.re.lastIndex = 0;
      while ((m = x.re.exec(n.s))) {
        if (m.index === x.re.lastIndex) x.re.lastIndex++;
        var at = m.index + (n.s.charAt(m.index) === ' ' ? 1 : 0), before = n.s.slice(Math.max(0, at - 14), at);
        var negated = !x.loose && ((m[2] && m[3]) || NEG.test(before));
        if (!x.loose && m[2] && !m[3] && !negated) continue;
        if (negated) { if (deny.indexOf(x.k) < 0) deny.push(x.k); continue; }
        if (seen[x.k]) continue; seen[x.k] = 1;
        chips.push({ k: x.k, c: x.c, l: x.l, d: x.o.d || '', t: x.o.t || [], rk: x.o.rk || '', ev: slice(n, at, m.index + m[0].length) });
        (x.o.opp || []).forEach(function (o) { if (deny.indexOf(o) < 0) deny.push(o); });
      }
    });
    function free(re, cat, key, pre) {
      re.lastIndex = 0; var i = 0;
      while ((m = re.exec(n.s)) && i < 4) {
        var at = m.index + m[0].indexOf(m[1]), ev = slice(n, at, at + m[1].length);
        if (cat === 'str' && NEG.test(n.s.slice(Math.max(0, m.index - 6), m.index + 1))) continue;
        if (ev) chips.push({ k: key + (i++), c: cat, l: (pre || '') + ev, d: '', t: cat === 'dur' && /صغير|زمان|سن|اول ما دخل/.test(m[1]) ? ['long'] : [], rk: '', ev: ev });
      }
    }
    free(DUR, 'dur', 'since'); free(FRQ, 'dur', 'freq'); free(LIKE, 'str', 'likes', 'بيحب ');
    var both = seen.home && seen.school && !seen.onlyhome && !seen.onlyschool && !seen.everywhere;
    var a = AGE.exec(n.s);
    return { chips: chips.filter(function (c) { return !(seen[c.k] && deny.indexOf(c.k) > -1 && c.c === 'str'); }), deny: deny, age: a && +a[1] >= 3 && +a[1] <= 18 ? +a[1] : null, both: both };
  }

  /* ---------- case model ---------- */
  function infText(c, inf) {
    var i = c.intake || {};
    if (inf === 'spec') return [i.narr, i.before, i.after, i.changes, i.since, i.freq].filter(Boolean).join(' . ');
    if (inf === 'teacher') return (c.inf && c.inf.teacher) || '';
    var p = c.inf && c.inf.parent; if (!p) return '';
    return typeof p === 'string' ? p : [p.worry, p.where, p.since, p.before, p.after, p.tried, p.good, p.sleep, p.changes, p.hope].filter(Boolean).join(' . ');
  }
  function rawChip(cat, text, inf) { text = String(text || '').trim(); return text ? { id: H.uid(), k: '', c: cat, l: text.slice(0, 60), d: '', t: [], rk: '', ev: '', inf: inf, src: 'field' } : null; }
  /* Re-read every informant's text. Chips the specialist edited or added stay; chips they removed stay removed. */
  function scan(c) {
    var keep = (c.chips || []).filter(function (x) { return x.src !== 'auto' && x.src !== 'field'; }), out = keep.slice(), has = {};
    keep.forEach(function (x) { if (x.k) has[x.inf + ':' + x.k] = 1; });
    c.gone = c.gone || {}; c.deny = {}; c.inf = c.inf || {};
    ['spec', 'parent', 'teacher'].forEach(function (inf) {
      var t = infText(c, inf); c.deny[inf] = [];
      if (!t.trim()) return;
      var r = extract(t); c.deny[inf] = r.deny;
      if (inf === 'spec' && r.age && !(c.intake || {}).age) c.intake.age = String(r.age);
      r.chips.forEach(function (x) { var key = inf + ':' + x.k; if (c.gone[key] || has[key]) return; has[key] = 1; x.id = H.uid(); x.inf = inf; x.src = 'auto'; out.push(x); });
      var fields = inf === 'spec' ? [['ant', c.intake.before], ['con', c.intake.after], ['ctx', c.intake.changes], ['dur', c.intake.since], ['dur', c.intake.freq]] :
        inf === 'parent' && typeof c.inf.parent === 'object' ? [['ant', c.inf.parent.before], ['con', c.inf.parent.after], ['str', c.inf.parent.good], ['ctx', c.inf.parent.changes], ['dur', c.inf.parent.since]] : [];
      fields.forEach(function (f) {
        if (!f[1] || !String(f[1]).trim()) return;
        var sub = extract(f[1]).chips.filter(function (x) { return x.c === f[0]; });
        if (!sub.length && !c.gone[inf + ':raw:' + f[1]]) { var rc = rawChip(f[0], f[1], inf); rc.raw = f[1]; out.push(rc); }
      });
    });
    var w = (c.intake || {}).where, wk = w === 'both' ? 'everywhere' : w === 'home' ? 'home' : w === 'school' ? 'school' : '';
    if (wk && !has['spec:' + wk] && !c.gone['spec:' + wk]) { var e = K.LEX.filter(function (x) { return x[0] === wk; })[0]; out.push({ id: H.uid(), k: wk, c: 'set', l: e[2], d: '', t: (e[4] || {}).t || [], rk: '', ev: '', inf: 'spec', src: 'auto' }); }
    c.chips = out; c.updated = H.today();
    return c;
  }
  function newCase(intake, parentAcc) {
    var d = D(), c = { id: H.uid(), code: intake.code || ('حالة-' + (d.cases.length + 1)), date: H.today(), updated: H.today(), intake: intake, inf: {}, chips: [], gone: {}, hyps: {}, plans: {}, abc: [], ab: [], goals: [], sessions: [], five: {}, gridm: {} };
    if (parentAcc) { c.inf.parent = parentAcc.a; c.kidId = parentAcc.kidId || ''; c.accId = parentAcc.id; if (!intake.age && parentAcc.kid) { intake.age = String(parentAcc.kid.a || ''); intake.grade = parentAcc.kid.g || ''; } parentAcc.used = c.id; }
    scan(c); d.cases.unshift(c); H.save(); return c;
  }
  function risks(c) { var seen = {}; return (c.chips || []).filter(function (x) { return x.c === 'risk' && x.rk && !seen[x.rk] && (seen[x.rk] = 1); }); }
  function domains(c) { var o = {}; (c.chips || []).forEach(function (x) { if (x.c === 'beh' && x.d) o[x.d] = (o[x.d] || 0) + 1; }); return K.DOMAINS.filter(function (d) { return o[d[0]]; }).map(function (d) { return [d[0], d[1], o[d[0]]]; }); }
  var ANTI = { med: ['medok'], real: ['onesetting'], ctx: ['multi'], exag: [], model: [], func: [], adult: [] };
  function feeds(c, h) {
    var pro = [], con = [];
    (c.chips || []).forEach(function (x) {
      var t = x.t || [];
      if (x.h === h.id) { pro.push(x); return; }
      if (t.some(function (y) { return h.tags.indexOf(y) > -1; }) || (x.c === 'beh' && (h.id === 'real' || h.doms.indexOf(x.d) > -1)) || (h.id === 'real' && t.indexOf('long') > -1)) pro.push(x);
      else if (t.some(function (y) { return ANTI[h.id].indexOf(y) > -1; })) con.push(x);
    });
    return { pro: pro, con: con };
  }
  /* Transparent tallies: one mark per decision-table row the specialist confirmed. No weights, no probabilities. */
  function tally(c) {
    var o = {}; K.HYPS.forEach(function (h) { o[h.id] = { plus: [], minus: [] }; });
    K.PLANS.forEach(function (p) {
      var st = (c.plans || {})[p.id]; if (!st || !st.out) return;
      p.rows.forEach(function (r, i) { if (st.out[i] !== 'y') return; Object.keys(r.e).forEach(function (h) { o[h][r.e[h] > 0 ? 'plus' : 'minus'].push({ plan: p.t, f: r.f, s: r.s }); }); });
    });
    return o;
  }
  /* Consistency grid: which informant reports each behaviour, and where they contradict each other. */
  function grid(c) {
    var active = ['spec', 'parent', 'teacher'].filter(function (i) { return infText(c, i).trim(); }), rows = {}, order = [];
    function row(k, l) { if (!rows[k]) { rows[k] = { k: k, l: l, by: {} }; order.push(k); } return rows[k]; }
    (c.chips || []).forEach(function (x) { if ((x.c === 'beh' || x.c === 'set') && x.k) row(x.k, x.l).by[x.inf] = 'y'; });
    active.forEach(function (i) { ((c.deny || {})[i] || []).forEach(function (k) { var e = K.LEX.filter(function (x) { return x[0] === k; })[0]; if (e && e[1] === 'beh' && (rows[k] || active.length > 1)) { var r = row(k, e[2]); if (!r.by[i]) r.by[i] = 'n'; } }); });
    Object.keys(c.gridm || {}).forEach(function (key) { var p = key.split(':'); if (rows[p[0]]) rows[p[0]].by[p[1]] = c.gridm[key]; });
    var list = order.map(function (k) {
      var r = rows[k], y = active.filter(function (i) { return r.by[i] === 'y'; }).length, n = active.filter(function (i) { return r.by[i] === 'n'; }).length;
      r.kind = y && n ? 'differ' : active.length > 1 && y === active.length ? 'agree' : y === 1 && active.length > 1 ? 'only' : y > 1 ? 'most' : y ? 'single' : 'none';
      return r;
    }).filter(function (r) { return r.kind !== 'none'; });
    function count(k) { return list.filter(function (r) { return r.kind === k; }).length; }
    return { active: active, rows: list, agree: count('agree') + count('most'), differ: count('differ'), only: count('only') };
  }

  /* ---------- single-case statistics (also used by the research hand-over) ---------- */
  var sc = {
    mean: function (a) { return a.length ? a.reduce(function (s, x) { return s + x; }, 0) / a.length : NaN; },
    median: function (a) { if (!a.length) return NaN; var s = a.slice().sort(function (x, y) { return x - y; }), m = Math.floor(s.length / 2); return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; },
    sd: function (a) { if (a.length < 2) return NaN; var m = sc.mean(a); return Math.sqrt(a.reduce(function (s, x) { return s + (x - m) * (x - m); }, 0) / (a.length - 1)); },
    slope: function (a) { var n = a.length; if (n < 2) return NaN; var mx = (n - 1) / 2, my = sc.mean(a), sxy = 0, sxx = 0; a.forEach(function (y, x) { sxy += (x - mx) * (y - my); sxx += (x - mx) * (x - mx); }); return sxy / sxx; },
    /* dir = 1 when higher is better, -1 when lower is better */
    pnd: function (A, B, dir) { if (!A.length || !B.length) return NaN; var ext = dir > 0 ? Math.max.apply(null, A) : Math.min.apply(null, A); return B.filter(function (b) { return dir > 0 ? b > ext : b < ext; }).length / B.length; },
    pairs: function (A, B, dir) { var pos = 0, neg = 0, tie = 0; A.forEach(function (a) { B.forEach(function (b) { var d = (b - a) * dir; if (d > 0) pos++; else if (d < 0) neg++; else tie++; }); }); return { pos: pos, neg: neg, tie: tie, n: A.length * B.length }; },
    nap: function (A, B, dir) { var p = sc.pairs(A, B, dir); return p.n ? (p.pos + 0.5 * p.tie) / p.n : NaN; },
    kendallS: function (A, dir) { var s = 0; for (var i = 0; i < A.length; i++) for (var j = i + 1; j < A.length; j++) { var d = (A[j] - A[i]) * dir; s += d > 0 ? 1 : d < 0 ? -1 : 0; } return s; },
    tau: function (A, B, dir) { var p = sc.pairs(A, B, dir); return p.n ? (p.pos - p.neg) / p.n : NaN; },
    tauU: function (A, B, dir) { var p = sc.pairs(A, B, dir); return p.n ? (p.pos - p.neg - sc.kendallS(A, dir)) / p.n : NaN; },
    immediacy: function (A, B) { return A.length && B.length ? sc.mean(B.slice(0, 3)) - sc.mean(A.slice(-3)) : NaN; },
    all: function (A, B, dir) {
      return { nA: A.length, nB: B.length, meanA: sc.mean(A), meanB: sc.mean(B), medA: sc.median(A), medB: sc.median(B), sdA: sc.sd(A), sdB: sc.sd(B), slopeA: sc.slope(A), slopeB: sc.slope(B),
        imm: sc.immediacy(A, B), pnd: sc.pnd(A, B, dir), nap: sc.nap(A, B, dir), tau: sc.tau(A, B, dir), tauU: sc.tauU(A, B, dir), sA: sc.kendallS(A, dir) };
    }
  };
  /* Phase chart: baseline points, a dashed phase line, intervention points. Values are plotted as recorded. */
  function phaseChart(A, B, opt) {
    opt = opt || {}; var all = A.concat(B), n = all.length; if (!n) return '';
    var lo = opt.lo != null ? opt.lo : Math.min(0, Math.min.apply(null, all)), hi = opt.hi != null ? opt.hi : Math.max.apply(null, all); if (hi === lo) hi = lo + 1;
    var W = 560, Ht = 240, L = 44, R = 16, T = 28, Bm = 34, pw = W - L - R, ph = Ht - T - Bm;
    function X(i) { return L + (n === 1 ? pw / 2 : pw * i / (n - 1)); } function Y(v) { return T + ph - ph * (v - lo) / (hi - lo); }
    var ticks = [lo, (lo + hi) / 2, hi], h = '<svg class="mcases-chart" viewBox="0 0 ' + W + ' ' + Ht + '" role="img" aria-label="' + esc(opt.label || 'رسم المرحلتين') + '" direction="ltr">';
    ticks.forEach(function (t) { h += '<line class="mcases-grid" x1="' + L + '" x2="' + (W - R) + '" y1="' + Y(t) + '" y2="' + Y(t) + '"/><text class="mcases-tick num" x="' + (L - 8) + '" y="' + (Y(t) + 4) + '" text-anchor="end">' + r2(t) + '</text>'; });
    function line(arr, off, cls) { if (!arr.length) return ''; return '<polyline class="' + cls + '" fill="none" points="' + arr.map(function (v, i) { return X(off + i) + ',' + Y(v); }).join(' ') + '"/>' + arr.map(function (v, i) { return '<circle class="' + cls + '-dot" cx="' + X(off + i) + '" cy="' + Y(v) + '" r="5"><title>' + (off + i + 1) + ': ' + v + '</title></circle>'; }).join(''); }
    if (A.length && B.length) { var px = (X(A.length - 1) + X(A.length)) / 2; h += '<rect class="mcases-base" x="' + L + '" y="' + T + '" width="' + (px - L) + '" height="' + ph + '"/><line class="mcases-phase" x1="' + px + '" x2="' + px + '" y1="' + (T - 10) + '" y2="' + (T + ph) + '"/>'; }
    if (A.length) h += '<text class="mcases-ph-t" x="' + X(0) + '" y="16">' + esc(opt.a || 'أ: قبل') + '</text>';
    if (B.length) h += '<text class="mcases-ph-t" x="' + X(A.length) + '" y="16">' + esc(opt.b || 'ب: بعد') + '</text>';
    h += line(A, 0, 'mcases-la') + line(B, A.length, 'mcases-lb');
    for (var i = 0; i < n; i += Math.max(1, Math.ceil(n / 10))) h += '<text class="mcases-tick num" x="' + X(i) + '" y="' + (Ht - 12) + '" text-anchor="middle">' + (i + 1) + '</text>';
    return h + '</svg>';
  }

  /* ---------- parent account share code ---------- */
  var ACC_KEYS = ['worry', 'where', 'since', 'before', 'after', 'tried', 'good', 'sleep', 'changes', 'hope'];
  function b64e(s) { return btoa(unescape(encodeURIComponent(s))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); }
  function b64d(s) { s = s.replace(/-/g, '+').replace(/_/g, '/'); while (s.length % 4) s += '='; return decodeURIComponent(escape(atob(s))); }
  function sum(s) { var x = 7; for (var i = 0; i < s.length; i++) x = (x * 31 + s.charCodeAt(i)) % 1679615; return x.toString(36); }
  function firstName(s) { return String(s || '').trim().split(/\s+/)[0].slice(0, 20); }
  function accPayload(acc) { var a = {}; ACC_KEYS.forEach(function (k) { if (acc.a[k]) a[k] = String(acc.a[k]).slice(0, 1500); }); return { v: 1, t: 'parent-account', d: acc.date, k: { n: firstName(acc.kid.n), a: acc.kid.a, g: acc.kid.g }, a: a }; }
  function accCode(acc) { var b = b64e(JSON.stringify(accPayload(acc))); return 'MLK1.' + b + '.' + sum(b); }
  /* Accepts a share code or the JSON file's text. Returns { acc } or { err }. */
  function accParse(text) {
    text = String(text || '').trim(); var o;
    try {
      if (/^MLK\d+\./.test(text)) {
        var p = text.split('.'); if (p[0] !== 'MLK1') return { err: 'الكود ده من نسخة تانية مش مدعومة هنا.' };
        if (p.length !== 3 || sum(p[1]) !== p[2]) return { err: 'الكود ناقص أو اتغيّر وهو بيتنسخ. اطلب من ولي الأمر يبعته تاني.' };
        o = JSON.parse(b64d(p[1]));
      } else o = JSON.parse(text);
    } catch (e) { return { err: 'مش قادرين نقرا الكود ده. اتأكد إنك نسخته كله.' }; }
    if (!o || o.t !== 'parent-account') return { err: 'ده مش ملف رواية ولي أمر.' };
    if (o.v !== 1) return { err: 'الملف ده من نسخة تانية مش مدعومة هنا.' };
    if (!o.a || typeof o.a !== 'object' || !o.k || typeof o.k !== 'object') return { err: 'الملف ناقص.' };
    var a = {}, any = false; ACC_KEYS.forEach(function (k) { if (typeof o.a[k] === 'string' && o.a[k].trim()) { a[k] = o.a[k].slice(0, 1500); any = true; } });
    if (!any) return { err: 'الرواية فاضية.' };
    var age = parseInt(o.k.a, 10);
    return { acc: { id: H.uid(), v: 1, kidId: '', kid: { n: firstName(o.k.n), a: age >= 3 && age <= 18 ? age : '', g: String(o.k.g || '').slice(0, 30) }, date: /^\d{4}-\d{2}-\d{2}$/.test(o.d) ? o.d : H.today(), a: a, src: 'import' } };
  }

  /* ---------- small view helpers ---------- */
  function paint(html, on) {
    main.innerHTML = '<div class="mcases">' + html + '</div>';
    main.onclick = on && on.click ? function (e) { var t = e.target.closest('[data-act]'); if (t && main.contains(t)) on.click(t.getAttribute('data-act'), t, e); } : null;
    main.onchange = on && on.change ? function (e) { on.change(e.target, e); } : null;
    main.oninput = on && on.input ? function (e) { on.input(e.target, e); } : null;
    main.onsubmit = on && on.submit ? function (e) { e.preventDefault(); on.submit(e.target, e); } : null;
  }
  function refocus(sel) { var el = sel && $(sel, main); if (el) el.focus({ preventScroll: true }); }
  function disclaimer() { return '<p class="mcases-truth">' + H.ic('guide') + '<span>الأداة دي بتساعدك تفكّر وتنظّم. مش بتشخّص ومش بتحكم على طفل، والقرار قرارك إنت كمتخصص.</span></p>'; }
  function crumb(links) { return '<nav class="mcases-crumb" aria-label="المسار">' + links.map(function (l) { return l[0] ? '<a href="' + l[0] + '">' + esc(l[1]) + '</a>' : '<span>' + esc(l[1]) + '</span>'; }).join('<i aria-hidden="true">‹</i>') + '</nav>'; }
  function web() {
    var pts = [[100, 22], [163, 52], [178, 118], [136, 172], [64, 172], [22, 118], [37, 52]], h = '<svg class="mcases-web" viewBox="0 0 200 200" aria-hidden="true" focusable="false">';
    pts.forEach(function (p, i) { h += '<line class="w-l' + (i % 3 === 0 ? ' on' : '') + '" x1="100" y1="100" x2="' + p[0] + '" y2="' + p[1] + '"/>'; });
    h += '<polygon class="w-p" points="' + pts.map(function (p) { return p.join(','); }).join(' ') + '"/>';
    pts.forEach(function (p, i) { h += '<use href="#star4" class="w-s s' + (i % 3) + '" x="' + (p[0] - 9) + '" y="' + (p[1] - 9) + '" width="18" height="18"/>'; });
    return h + '<circle class="w-c" cx="100" cy="100" r="15"/><circle class="w-c2" cx="100" cy="100" r="5"/></svg>';
  }
  function safePanel(list) {
    if (!list.length) return '';
    return '<section class="mcases-safe" role="region" aria-label="تنبيه أمان" id="mcases-safe"><div class="mcases-safe-h"><svg viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="24" r="21" fill="none" stroke="currentColor" stroke-width="3"/><path d="M24 12v15M24 33v3" stroke="currentColor" stroke-width="4" stroke-linecap="round"/></svg><div><h2>قبل أي خطة: فيه حاجة في الرواية محتاجة وقفة</h2><p>ده مش حكم ولا اتهام لحد. ده تنبيه إن أمان الطفل ييجي الأول.</p></div></div>' +
      '<ul class="mcases-safe-f">' + list.map(function (x) { var r = K.RISK[x.rk]; return '<li><strong>' + esc(r[0]) + '</strong>' + (x.ev ? ' <q>' + esc(x.ev) + '</q>' : '') + '<span>' + esc(r[1]) + '</span></li>'; }).join('') + '</ul>' +
      '<div class="mcases-safe-g"><div><h3>الخطوات</h3><ol>' + K.SAFE.steps.map(function (s) { return '<li>' + esc(s) + '</li>'; }).join('') + '</ol></div><div><h3>أرقام مهمة</h3><ul class="mcases-nums">' + K.SAFE.nums.map(function (n) { return '<li><span>' + esc(n[0]) + '</span><a class="num" dir="ltr" href="tel:' + n[1] + '">' + n[1] + '</a></li>'; }).join('') + '</ul><p class="small">' + esc(K.SAFE.note) + '</p></div></div></section>';
  }
  function chipHtml(x, multi) { return '<button type="button" class="mcases-chip c-' + x.c + (x.src === 'auto' ? '' : ' mine') + '" data-act="chip" data-id="' + x.id + '" title="' + esc(x.ev ? 'من النص: ' + x.ev : 'اضغط للتعديل') + '">' + (multi ? '<i class="mcases-inf i-' + x.inf + '" aria-label="' + INF[x.inf][1] + '">' + INF[x.inf][0] + '</i>' : '') + '<span>' + esc(x.l) + '</span></button>'; }
  function chipList(list, tiny) { return list.length ? '<span class="mcases-mini">' + list.map(function (x) { return '<span class="c-' + x.c + '">' + esc(x.l) + '</span>'; }).join('') + '</span>' : (tiny ? '' : '<span class="muted small">مفيش عنصر من الرواية بيغذّيها لسه.</span>'); }

  /* ---------- home ---------- */
  function vHome() {
    var d = D(), waiting = d.accounts.filter(function (a) { return !a.used; }), msg = '';
    function draw() {
      var h = '<header class="head mcases-hero"><div><p class="mcases-kicker">محاكي الأخصائي للحالات الخاصة</p><h1 class="mega" data-reveal="words">احكي الحالة. <em>وافحص الفروض</em> قبل ما تحكم.</h1><p class="lead">اكتب اللي سمعته عن الطفل. هنطلّع العناصر المهمة، ونحط جنبها أكتر من تفسير، وخطط تتأكد بيها مين فيهم الأقرب.</p><p class="row"><a class="btn primary big" href="#cases/new" data-magnet>' + H.ic('plus') + 'حالة جديدة</a><a class="btn" href="#cases/train">حالات للتدريب</a></p></div>' + web() + '</header>' + disclaimer();
      if (waiting.length) h += '<section class="mcases-wait"><h2>رواية ولي الأمر <span class="num">' + waiting.length + '</span></h2><ul>' + waiting.map(function (a) { return '<li><div><strong>' + esc(a.kid.n || 'طفل') + '</strong><span class="small muted"> · ' + (a.kid.a ? esc(a.kid.a) + ' سنين · ' : '') + esc(a.kid.g || '') + ' · ' + fmtD(a.date) + (a.src === 'import' ? ' · مستوردة' : '') + '</span><p class="small">' + esc(String(a.a.worry || '').slice(0, 110)) + '</p></div><span class="row"><button class="btn" type="button" data-act="acc2case" data-id="' + a.id + '">حوّلها لحالة</button><button class="btn icon" type="button" data-act="accdel" data-id="' + a.id + '" aria-label="امسح الرواية">' + H.ic('trash') + '</button></span></li>'; }).join('') + '</ul></section>';
      h += '<div class="sec"><h2>الحالات</h2><span class="row">' + (d.cases.length > 1 ? '<a class="btn" href="#cases/study">ادرس مجموعة حالات</a>' : '') + '<button class="btn" type="button" data-act="imp-open" aria-expanded="' + (msg !== '' || vHome.imp ? 'true' : 'false') + '">استورد رواية ولي أمر</button></span></div>';
      if (vHome.imp) h += '<form class="card form mcases-imp" id="mcases-imp"><label for="imp-code">الصق الكود اللي بعته ولي الأمر</label><textarea id="imp-code" dir="ltr" placeholder="MLK1…"></textarea><label for="imp-file">أو افتح الملف (.json)</label><input type="file" id="imp-file" accept=".json,application/json"><p class="small err" role="alert" id="imp-err">' + esc(msg) + '</p><p class="form-end"><button class="btn primary" type="submit">استورد</button></p></form>';
      if (!d.cases.length) h += '<div class="empty mcases-empty">' + web() + '<p class="empty-t">لسه مفيش حالات</p><p>ابدأ بحالة جديدة، أو جرّب حالة تدريبية الأول.</p></div>';
      else h += '<ul class="mcases-list" data-stagger="60">' + d.cases.map(function (c, i) {
        var dm = domains(c), rk = risks(c).length, act = Object.keys(c.plans || {}).filter(function (k) { return c.plans[k].on; }).length;
        return '<li><a class="mcases-case t' + (i % 4) + '" href="#cases/c/' + c.id + '"><span class="mcases-code">' + esc(c.code) + '</span><span class="mcases-meta">' + fmtD(c.date) + (c.intake.age ? ' · ' + esc(c.intake.age) + ' سنين' : '') + '</span><span class="mcases-doms">' + (dm.length ? dm.map(function (x) { return esc(x[1]); }).join(' · ') : 'لسه مفيش عناصر') + '</span><span class="mcases-stat">' + (rk ? '<b class="warn">' + H.ic('guide') + 'تنبيه أمان</b>' : '') + '<b><span class="num">' + act + '</span> خطط شغّالة</b><b><span class="num">' + (c.sessions || []).length + '</span> جلسات</b></span></a></li>';
      }).join('') + '</ul>';
      paint(h, { click: function (act, t) {
        if (act === 'imp-open') { vHome.imp = !vHome.imp; msg = ''; draw(); refocus('#imp-code'); }
        if (act === 'acc2case') { var a = byId(d.accounts, t.getAttribute('data-id')); if (a) { var c = newCase({ code: 'حالة-' + (d.cases.length + 1), narr: '' }, a); H.go('#cases/c/' + c.id); } }
        if (act === 'accdel') { d.accounts = d.accounts.filter(function (a) { return a.id !== t.getAttribute('data-id'); }); H.save(); waiting = d.accounts.filter(function (a) { return !a.used; }); draw(); }
      }, submit: function () {
        var f = $('#imp-file').files[0];
        function take(text) { var r = accParse(text); if (r.err) { msg = r.err; draw(); return; } d.accounts.unshift(r.acc); H.save(); vHome.imp = false; msg = ''; waiting = d.accounts.filter(function (a) { return !a.used; }); draw(); H.toast('اتستوردت الرواية'); }
        if (f) { var fr = new FileReader(); fr.onload = function () { take(fr.result); }; fr.readAsText(f); } else take($('#imp-code').value);
      } });
    }
    draw();
  }

  /* ---------- intake ---------- */
  var WHERE = [['home', 'في البيت'], ['school', 'في المدرسة'], ['both', 'في الاتنين'], ['other', 'مكان تاني']];
  var CHK = [['hear', 'السمع'], ['vis', 'النظر'], ['sleep', 'النوم'], ['health', 'الصحة العامة']], CHKV = [['ok', 'اتفحص وسليم'], ['prob', 'فيه مشكلة'], ['no', 'لسه متفحصش']];
  var GRADES = ['حضانة', 'أولى ابتدائي', 'تانية ابتدائي', 'تالتة ابتدائي', 'رابعة ابتدائي', 'خامسة ابتدائي', 'سادسة ابتدائي', 'إعدادي'];
  function intakeFields(i) {
    i = i || {};
    return '<div class="two"><div class="fld">' + H.field('in-age', 'السن', i.age || '', '', 'number') + '</div><div class="fld">' + H.sel('in-grade', 'الصف', GRADES, i.grade || '') + '</div><div class="fld">' + H.sel('in-where', 'بيحصل فين؟', WHERE, i.where || '') + '</div><div class="fld">' + H.field('in-who', 'مين اللي بلّغ؟', i.who || '', 'أم، مدرّسة، إنت شفت بنفسك…') + '</div><div class="fld">' + H.field('in-since', 'من إمتى؟', i.since || '', 'من شهرين، من أول السنة…') + '</div><div class="fld">' + H.field('in-freq', 'كل قد إيه؟', i.freq || '', '3 مرات في اليوم، كل حصة…') + '</div></div>' +
      '<div class="two"><div class="fld">' + H.field('in-before', 'إيه اللي بيحصل قبله على طول؟', i.before || '', '', 'area') + '</div><div class="fld">' + H.field('in-after', 'وإيه اللي بيحصل بعده؟', i.after || '', 'الكبار بيعملوا إيه؟ الطفل بياخد إيه أو بيخلص من إيه؟', 'area') + '</div></div>' +
      '<fieldset class="mcases-chk"><legend>اتفحص قبل كده؟</legend>' + CHK.map(function (c) { return '<div class="fld"><label for="in-' + c[0] + '">' + c[1] + '</label><select id="in-' + c[0] + '"><option value="">مش عارف</option>' + H.opts(CHKV, (i.chk || {})[c[0]] || '') + '</select></div>'; }).join('') + '</fieldset>' +
      '<div class="two"><div class="fld">' + H.field('in-changes', 'تغييرات قريبة في البيت أو المدرسة', i.changes || '', 'مولود، نقل، خلاف، مدرّس جديد…', 'area') + '</div><div class="fld">' + H.field('in-tried', 'إيه اللي اتجرّب قبل كده؟', i.tried || '', '', 'area') + '</div></div>';
  }
  function readIntake(i) {
    i = i || {}; function v(id) { var el = $('#' + id); return el ? el.value.trim() : ''; }
    ['age', 'grade', 'where', 'who', 'since', 'freq', 'before', 'after', 'changes', 'tried'].forEach(function (k) { i[k] = v('in-' + k); });
    i.chk = {}; CHK.forEach(function (c) { i.chk[c[0]] = v('in-' + c[0]); });
    return i;
  }
  function vNew() {
    var timer = 0;
    var h = crumb([['#cases', 'الحالات'], ['', 'حالة جديدة']]) + '<header class="head"><h1>حالة جديدة</h1><p class="lead">اكتب زي ما سمعت، بالعامية. كل اللي هتكتبه بيفضل على الجهاز ده بس.</p></header>' +
      '<form class="mcases-intake" id="mcases-new" novalidate><div class="mcases-in-main"><div class="card form"><div class="fld">' + H.field('in-code', 'كود أو اسم دلع للحالة', '', 'من غير الاسم الحقيقي. مثال: «س-3» أو «العصفور».') + '</div>' +
      '<p class="notice mcases-noname">ما تكتبش اسم الطفل الكامل ولا اسم أهله أو مدرسته. استخدم حرف أو كود.</p>' +
      '<div class="fld">' + H.field('in-narr', 'الرواية', '', 'السلوك اللي بيتشاف، فين، إمتى، مع مين، وإيه اللي الطفل شاطر فيه.', 'area') + '</div><p class="small err" role="alert" id="in-warn"></p></div>' +
      '<details class="card form mcases-more" open><summary>أسئلة سريعة تكمّل الصورة</summary>' + intakeFields() + '</details>' +
      '<p class="small err" role="alert" id="in-err"></p><p class="mcases-end"><button class="btn primary big" type="submit">طلّع العناصر</button><a class="btn" href="#cases">إلغاء</a></p></div>' +
      '<aside class="mcases-live" aria-live="polite"><h2>اللي التقطناه لحد دلوقتي</h2><div id="mcases-live"><p class="muted">ابدأ اكتب، والعناصر هتظهر هنا. تقدر تعدّلها كلها بعدين.</p></div></aside></form>' + disclaimer();
    function live() {
      var t = [$('#in-narr').value, $('#in-before').value, $('#in-after').value, $('#in-changes').value].join(' . '), r = extract(t), box = $('#mcases-live');
      $('#in-warn').textContent = /(?:^|\s)(?:اسمه|اسمها|اسم الطفل)\s/.test(t) ? 'شكلك كتبت اسم. امسحه واستخدم كود: الأسماء مش محتاجينها.' : '';
      if (!r.chips.length) { box.innerHTML = '<p class="muted">' + (t.replace(/[\s.]/g, '').length > 20 ? 'لسه مش لاقطين عناصر معروفة. كمّل، وهتقدر تضيف عناصر بإيدك في الخطوة الجاية.' : 'ابدأ اكتب، والعناصر هتظهر هنا. تقدر تعدّلها كلها بعدين.') + '</p>'; return; }
      var rk = r.chips.filter(function (x) { return x.c === 'risk'; });
      box.innerHTML = (rk.length ? '<p class="mcases-live-risk">' + H.ic('guide') + 'فيه علامة خطر في الكلام. هتلاقي الخطوات أول ما تفتح الحالة.</p>' : '') + K.CATS.map(function (c) { var l = r.chips.filter(function (x) { return x.c === c[0]; }); return l.length ? '<div class="mcases-live-g"><h3>' + c[1] + '</h3>' + chipList(l, 1) + '</div>' : ''; }).join('');
    }
    paint(h, { input: function () { clearTimeout(timer); timer = setTimeout(live, 250); }, submit: function () {
      var i = readIntake({}); i.narr = $('#in-narr').value.trim(); i.code = $('#in-code').value.trim();
      if ((i.narr + i.before + i.after).length < 15) { $('#in-err').textContent = 'اكتب الرواية الأول، ولو سطرين.'; $('#in-narr').focus(); return; }
      var c = newCase(i); H.go('#cases/c/' + c.id);
    } });
  }

  /* ---------- case workbench ---------- */
  function caseHead(c, tab) {
    var rk = risks(c);
    return crumb([['#cases', 'الحالات'], ['', c.code]]) + '<header class="mcases-chead"><div><h1>' + esc(c.code) + '</h1><p class="small muted">' + fmtD(c.date) + (c.intake.age ? ' · ' + esc(c.intake.age) + ' سنين' : '') + (c.intake.grade ? ' · ' + esc(c.intake.grade) : '') + ' · على الجهاز ده بس</p></div></header>' +
      '<nav class="mcases-tabs" aria-label="أجزاء الحالة">' + TABS.map(function (t, i) { return '<a href="#cases/c/' + c.id + '.' + t[0] + '"' + (t[0] === tab ? ' aria-current="page"' : '') + '><span class="num">' + (i + 1) + '</span>' + t[1] + '</a>'; }).join('') + '</nav>' + safePanel(rk);
  }
  function vCase(id, tab, arg) {
    var c = getCase(id); if (!c) { paint('<header class="head"><h1>الحالة مش موجودة</h1><p class="lead">ممكن تكون اتمسحت، أو اتسجّلت على جهاز تاني.</p><p><a class="btn" href="#cases">رجوع للحالات</a></p></header>'); return; }
    tab = byId(TABS.map(function (t) { return { id: t[0] }; }), tab) ? tab : 'story';
    ({ story: tStory, hyp: tHyp, plans: tPlans, handle: tHandle, file: tFile, sess: function (c, a) { window.HubCasesProgress(API).tab(c, a); } })[tab](c, arg);
  }

  var edit = null;
  function tStory(c) {
    var g = grid(c), multi = g.active.length > 1, dm = domains(c);
    function infBox(inf, body) { return '<section class="mcases-ib i-' + inf + '"><h3><i class="mcases-inf i-' + inf + '" aria-hidden="true">' + INF[inf][0] + '</i>' + INF[inf][1] + '</h3>' + body + '</section>'; }
    var p = c.inf.parent, pbody;
    if (p) pbody = '<dl class="mcases-acc">' + (typeof p === 'string' ? '<dd>' + esc(p) + '</dd>' : ACC_KEYS.filter(function (k) { return p[k]; }).map(function (k) { return '<dt>' + PQ[k][2] + '</dt><dd>' + esc(p[k]) + '</dd>'; }).join('')) + '</dl><button class="btn" type="button" data-act="p-clear">شيل الرواية دي</button>';
    else { var free = D().accounts.filter(function (a) { return !a.used; }); pbody = '<p class="small muted">مفيش رواية من ولي الأمر لسه. ممكن ولي الأمر يكتبها من صفحته، أو تكتب إنت اللي قاله.</p>' + (free.length ? '<label for="p-pick">روايات مستنية</label><select id="p-pick"><option value="">اختار…</option>' + free.map(function (a) { return '<option value="' + a.id + '">' + esc((a.kid.n || 'طفل') + ' · ' + a.date) + '</option>'; }).join('') + '</select>' : '') + '<label for="p-text">أو اكتب اللي ولي الأمر قاله</label><textarea id="p-text"></textarea><button class="btn" type="button" data-act="p-save">ضيف رواية ولي الأمر</button>'; }
    var h = caseHead(c, 'story') + '<section class="mcases-sec"><div class="sec"><h2>الروايات</h2><span class="small muted">كل رواية بتتقري بنفس الطريقة، والعناصر بتتعلّم بحرف صاحبها.</span></div><div class="mcases-infs">' +
      infBox('spec', '<label for="s-narr" class="sr">ملاحظاتك</label><textarea id="s-narr">' + esc(c.intake.narr || '') + '</textarea><details class="mcases-more"><summary>الأسئلة السريعة</summary>' + intakeFields(c.intake) + '</details><button class="btn" type="button" data-act="s-save">احفظ واقرا تاني</button>') +
      infBox('parent', pbody) +
      infBox('teacher', '<label for="t-text" class="sr">رواية المدرّس</label><textarea id="t-text" placeholder="اكتب اللي المدرّس أو المدرّسة قالوه">' + esc(c.inf.teacher || '') + '</textarea><button class="btn" type="button" data-act="t-save">احفظ رواية المدرّس</button>') + '</div></section>';
    h += '<section class="mcases-sec"><div class="sec"><h2>العناصر</h2><span class="row"><button class="btn" type="button" data-act="chip-add">' + H.ic('plus') + 'ضيف عنصر</button>' + assistBtn() + '</span></div><p class="small muted">كل عنصر تقدر تعدّله أو تمسحه. مفيش استنتاج مستخبي: اللي شايفه هنا هو كل اللي الأداة فهمته.</p>';
    if (edit) h += chipEditor(c);
    h += '<div class="mcases-board">' + K.CATS.map(function (cat) { var l = c.chips.filter(function (x) { return x.c === cat[0]; }); return '<div class="mcases-grp g-' + cat[0] + (l.length ? '' : ' none') + '"><h3>' + cat[1] + '<span class="num">' + l.length + '</span></h3><div class="mcases-chips">' + (l.length ? l.map(function (x) { return chipHtml(x, multi); }).join('') : '<span class="muted small">مفيش</span>') + '</div></div>'; }).join('') + '</div>';
    h += '<div class="mcases-doms-b"><h3>المجالات اللي السلوك واقع فيها</h3>' + (dm.length ? '<ul>' + dm.map(function (x) { return '<li><b class="num">' + x[2] + '</b><span>' + esc(x[1]) + '</span></li>'; }).join('') + '</ul>' : '<p class="muted small">لسه مفيش سلوك متصنّف.</p>') + '<p class="small muted">دي مجالات وصفية علشان تنظّم التفكير، مش أسماء اضطرابات.</p></div></section>';
    h += '<section class="mcases-sec"><div class="sec"><h2>مقارنة المصادر</h2></div>' + gridHtml(c, g) + '</section><p class="mcases-next"><a class="btn primary" href="#cases/c/' + c.id + '.hyp">كمّل: الفرضيات</a></p>' + disclaimer();
    paint(h, { click: function (act, t) {
      if (act === 's-save') { c.intake.narr = $('#s-narr').value.trim(); readIntake(c.intake); scan(c); H.save(); H.toast('اتحفظ'); tStory(c); }
      else if (act === 't-save') { c.inf.teacher = $('#t-text').value.trim(); scan(c); H.save(); H.toast('اتحفظ'); tStory(c); }
      else if (act === 'p-save') { var pk = $('#p-pick'), a = pk && pk.value ? byId(D().accounts, pk.value) : null, tx = $('#p-text').value.trim(); if (a) { c.inf.parent = a.a; c.accId = a.id; c.kidId = a.kidId || c.kidId || ''; a.used = c.id; } else if (tx) c.inf.parent = tx; else { H.toast('اكتب الرواية أو اختار واحدة'); return; } scan(c); H.save(); tStory(c); }
      else if (act === 'p-clear') { var old = c.accId && byId(D().accounts, c.accId); if (old) old.used = ''; c.inf.parent = null; c.accId = ''; scan(c); H.save(); tStory(c); }
      else if (act === 'chip-add') { edit = { id: '', l: '', c: 'beh', d: '', h: '' }; tStory(c); refocus('#ce-l'); }
      else if (act === 'chip') { var x = byId(c.chips, t.getAttribute('data-id')); edit = { id: x.id, l: x.l, c: x.c, d: x.d || '', h: x.h || '' }; tStory(c); refocus('#ce-l'); }
      else if (act === 'ce-cancel') { edit = null; tStory(c); }
      else if (act === 'ce-del') { var y = byId(c.chips, edit.id); if (y) { c.gone[y.inf + ':' + (y.k || 'raw:' + (y.raw || y.l))] = 1; c.chips = c.chips.filter(function (z) { return z.id !== y.id; }); } edit = null; H.save(); tStory(c); }
      else if (act === 'cell') { var key = t.getAttribute('data-k'), cur = t.getAttribute('data-v'); c.gridm[key] = cur === 'y' ? 'n' : cur === 'n' ? '' : 'y'; H.save(); tStory(c); refocus('[data-k="' + key + '"]'); }
      else if (act === 'assist') askAssistant(c);
    }, submit: function (f) {
      if (f.id !== 'mcases-ce') return;
      var l = $('#ce-l').value.trim(); if (!l) { $('#ce-l').focus(); return; }
      var x = edit.id ? byId(c.chips, edit.id) : null, cat = $('#ce-c').value;
      if (!x) { x = { id: H.uid(), k: '', t: [], rk: '', ev: '', inf: 'spec' }; c.chips.push(x); }
      if (x.k && x.src === 'auto') c.gone[x.inf + ':' + x.k] = 0;
      x.l = l; x.c = cat; x.d = cat === 'beh' ? $('#ce-d').value : ''; x.h = $('#ce-h').value; x.src = 'mine';
      if (cat !== 'risk') x.rk = '';
      edit = null; H.save(); tStory(c);
    } });
  }
  function chipEditor() {
    return '<form class="mcases-ce" id="mcases-ce"><h3>' + (edit.id ? 'تعديل عنصر' : 'عنصر جديد') + '</h3><div class="mcases-ce-g"><div class="fld"><label for="ce-l">النص</label><input type="text" id="ce-l" value="' + esc(edit.l) + '" maxlength="80"></div><div class="fld"><label for="ce-c">النوع</label><select id="ce-c">' + H.opts(K.CATS, edit.c) + '</select></div><div class="fld"><label for="ce-d">المجال (للسلوك)</label><select id="ce-d"><option value="">من غير</option>' + H.opts(K.DOMAINS, edit.d) + '</select></div><div class="fld"><label for="ce-h">بيغذّي فرضية</label><select id="ce-h"><option value="">سيبها للأداة</option>' + H.opts(K.HYPS.map(function (x) { return [x.id, x.t]; }), edit.h) + '</select></div></div><p class="row"><button class="btn primary" type="submit">احفظ</button><button class="btn" type="button" data-act="ce-cancel">إلغاء</button>' + (edit.id ? '<button class="btn danger" type="button" data-act="ce-del">امسح العنصر</button>' : '') + '</p></form>';
  }
  var KIND = { agree: ['متفقين', 'ok'], most: ['أكتر من مصدر', 'ok'], differ: ['مختلفين', 'bad'], only: ['مصدر واحد بس', 'one'], single: ['', ''] };
  function gridHtml(c, g, printable) {
    if (!g.rows.length) return '<p class="muted">لسه مفيش سلوك أو مكان متسجّل علشان نقارن.</p>';
    var cols = ['spec', 'parent', 'teacher'];
    var h = (g.active.length < 2 ? '<p class="notice">عندك مصدر واحد بس. ضيف رواية ولي الأمر أو المدرّس علشان المقارنة يبقى ليها معنى.</p>' : '<ul class="mcases-gsum"><li class="ok"><b class="num">' + g.agree + '</b>متفقين عليه</li><li class="bad"><b class="num">' + g.differ + '</b>مختلفين عليه</li><li class="one"><b class="num">' + g.only + '</b>مصدر واحد بس قاله</li></ul>') +
      '<div class="tablewrap"><table class="mcases-grid-t"><thead><tr><th scope="col">السلوك أو المكان</th>' + cols.map(function (i) { return '<th scope="col">' + INF[i][1] + '</th>'; }).join('') + '<th scope="col">الخلاصة</th></tr></thead><tbody>' + g.rows.map(function (r) {
        return '<tr class="k-' + r.kind + '"><th scope="row">' + esc(r.l) + '</th>' + cols.map(function (i) { var v = r.by[i] || '', on = g.active.indexOf(i) > -1, txt = v === 'y' ? 'قاله' : v === 'n' ? 'نفاه' : on ? 'ما اتكلمش عنه' : 'مفيش رواية'; return '<td>' + (printable || !on ? '<span class="mcases-cell v-' + (v || 'x') + '">' + txt + '</span>' : '<button type="button" class="mcases-cell v-' + (v || 'x') + '" data-act="cell" data-k="' + r.k + ':' + i + '" data-v="' + v + '" aria-label="' + esc(r.l + '، ' + INF[i][1] + ': ' + txt + '. اضغط للتغيير') + '">' + txt + '</button>') + '</td>'; }).join('') + '<td>' + (KIND[r.kind][0] ? '<span class="mcases-kind ' + KIND[r.kind][1] + '">' + KIND[r.kind][0] + '</span>' : '') + '</td></tr>';
      }).join('') + '</tbody></table></div><p class="small muted">«ما اتكلمش عنه» مش معناها إنه مش موجود: اسأل المصدر ده عنه صراحةً، وعدّل الخانة بالضغط عليها.</p>';
    return h;
  }

  function tHyp(c) {
    var tl = tally(c), i = c.intake || {}, unchecked = CHK.filter(function (k) { return !(i.chk || {})[k[0]] || i.chk[k[0]] === 'no'; }).map(function (k) { return k[1]; });
    var h = caseHead(c, 'hyp') + '<header class="mcases-th"><h2>سبع فرضيات تتفحص، <em>ومفيش واحدة فيهم «الإجابة»</em></h2><p class="lead">الترتيب ده ترتيب شغل (الصحة الأول)، مش ترتيب احتمال. علّم على اللي ناوي تفحصها، وروح لخطط التأكد.</p></header><div class="mcases-hyps">';
    K.HYPS.forEach(function (hp, n) {
      var f = feeds(c, hp), t = tl[hp.id], on = !!(c.hyps[hp.id] || {}).on;
      h += '<article class="mcases-hyp h-' + hp.id + ' tone-' + hp.tone + (on ? ' on' : '') + '" id="hyp-' + hp.id + '"><div class="mcases-hyp-top"><span class="mcases-hno num">' + (n + 1) + '</span><p class="mcases-hk">فرضية تتفحص</p><h3>' + esc(hp.t) + '</h3><p class="mcases-hq">' + esc(hp.q) + '</p></div>' +
        '<div class="mcases-hyp-body"><p>' + esc(hp.why) + '</p><div class="mcases-feed"><h4>عناصر من الرواية بتغذّيها <span class="num">' + f.pro.length + '</span></h4>' + chipList(f.pro) + (hp.id === 'med' && unchecked.length ? '<p class="small mcases-unchk">لسه مش متأكدين من فحص: ' + esc(unchecked.join('، ')) + '.</p>' : '') + (f.con.length ? '<h4>عناصر بتشدّ عكسها <span class="num">' + f.con.length + '</span></h4>' + chipList(f.con) : '') + '</div>' +
        '<div class="mcases-tally" aria-label="حصيلة خطط التأكد"><div class="plus"><b class="num">' + t.plus.length + '</b><span>شواهد معاها</span></div><div class="minus"><b class="num">' + t.minus.length + '</b><span>شواهد ضدها</span></div><p class="small">' + (t.plus.length + t.minus.length ? 'من خطط التأكد اللي علّمت نتايجها.' : 'لسه مفيش نتايج من خطط التأكد.') + '</p></div>' +
        (t.plus.length + t.minus.length ? '<ul class="mcases-why">' + t.plus.map(function (x) { return '<li class="plus"><b>مع:</b> ' + esc(x.f) + ' <span class="small muted">(' + esc(x.plan) + ')</span></li>'; }).join('') + t.minus.map(function (x) { return '<li class="minus"><b>ضد:</b> ' + esc(x.f) + ' <span class="small muted">(' + esc(x.plan) + ')</span></li>'; }).join('') + '</ul>' : '') +
        '<details><summary>إيه اللي يقوّيها وإيه اللي يضعّفها؟</summary><div class="mcases-sa"><div><h4>يقوّيها</h4><ul>' + hp.sup.map(function (s) { return '<li>' + esc(s) + '</li>'; }).join('') + '</ul></div><div><h4>يضعّفها</h4><ul>' + hp.agn.map(function (s) { return '<li>' + esc(s) + '</li>'; }).join('') + '</ul></div></div></details>' +
        (hp.note ? '<details class="mcases-note"><summary>' + esc(hp.note.h) + '</summary>' + hp.note.p.map(function (s) { return '<p>' + esc(s) + '</p>'; }).join('') + '</details>' : '') +
        '<p class="mcases-hyp-end"><button type="button" class="btn' + (on ? ' inked' : '') + '" data-act="hyp" data-id="' + hp.id + '" aria-pressed="' + on + '">' + (on ? H.ic('check') + 'هتفحصها' : 'هفحصها') + '</button><span class="small muted">خطط بتفحصها: ' + K.PLANS.filter(function (p) { return p.tests.indexOf(hp.id) > -1; }).map(function (p) { return '<a href="#cases/c/' + c.id + '.plans.' + p.id + '">' + p.L + '</a>'; }).join(' · ') + '</span></p></div></article>';
    });
    h += '</div><p class="mcases-next"><a class="btn primary" href="#cases/c/' + c.id + '.plans">كمّل: خطط التأكد</a></p>' + disclaimer();
    paint(h, { click: function (act, t) { if (act === 'hyp') { var id = t.getAttribute('data-id'); c.hyps[id] = { on: !(c.hyps[id] || {}).on }; H.save(); tHyp(c); refocus('[data-act=hyp][data-id=' + id + ']'); } } });
  }

  var ABC_A = ['طلب أو مهمة', 'منع حاجة', 'الكبار مشغولين', 'وقت انتقال', 'لوحده', 'حاجة تانية'], ABC_C = ['اهتمام أو كلام', 'المهمة اتشالت أو اتأجلت', 'خد اللي عايزه', 'اتساب لوحده', 'عقاب أو زعيق', 'مفيش رد فعل', 'حاجة تانية'];
  function abSeries(c) { var s = (c.ab || []).slice().sort(function (a, b) { return a.d < b.d ? -1 : a.d > b.d ? 1 : 0; }); return { A: s.filter(function (x) { return x.ph === 'A'; }).map(function (x) { return x.n; }), B: s.filter(function (x) { return x.ph === 'B'; }).map(function (x) { return x.n; }), all: s }; }
  function planState(c, p) { var st = c.plans[p.id]; if (!st || !st.on) return ['', 'لسه ما بدأتش']; var due = addDays(st.start, p.days), n = Object.keys(st.out || {}).filter(function (k) { return st.out[k]; }).length; return n ? ['done', 'اتسجّل ' + n + ' نتيجة'] : due <= H.today() ? ['due', 'ميعادها جه'] : ['on', 'شغّالة']; }
  function tPlans(c, pid) {
    var p = byId(K.PLANS, pid);
    if (!p) {
      var chosen = K.HYPS.filter(function (h) { return (c.hyps[h.id] || {}).on; }).map(function (h) { return h.id; });
      var h = caseHead(c, 'plans') + '<header class="mcases-th"><h2>خطط التأكد</h2><p class="lead">كل خطة مستقلة ومحددة بوقت، وفيها ورقة تسجيل تتطبع وجدول قرار: «لو لقيت كذا، الفرضية دي أقوى أو أضعف». استخدم أكتر من خطة: خطة واحدة عمرها ما بتكفي.</p></header><ol class="mcases-plans">';
      K.PLANS.forEach(function (pl) {
        var st = planState(c, pl), rec = pl.tests.some(function (t) { return chosen.indexOf(t) > -1; });
        h += '<li class="mcases-plan s-' + st[0] + (rec ? ' rec' : '') + '"><a href="#cases/c/' + c.id + '.plans.' + pl.id + '"><span class="mcases-pl">' + pl.L + '</span><span class="mcases-pt"><strong>' + esc(pl.t) + '</strong><small>' + esc(pl.why) + '</small><small class="mcases-ptest">بتفحص: ' + pl.tests.map(function (t) { return esc(byId(K.HYPS, t).t); }).join(' · ') + '</small></span><span class="mcases-pd"><b class="num">' + pl.days + '</b> يوم<i>' + st[1] + '</i>' + (rec ? '<em>مناسبة للي اخترته</em>' : '') + '</span></a></li>';
      });
      h += '</ol><p class="mcases-next"><a class="btn primary" href="#cases/c/' + c.id + '.handle">كمّل: التعامل</a><a class="btn" href="#cases/c/' + c.id + '.hyp">شوف لوحة الفرضيات</a></p>' + disclaimer();
      paint(h); return;
    }
    var st = c.plans[p.id] || (c.plans[p.id] = { on: false, start: '', out: {}, notes: '' }), base = '#cases/c/' + c.id + '.plans';
    var hh = caseHead(c, 'plans') + '<p><a class="mcases-back" href="' + base + '">' + H.ic('back') + 'كل الخطط</a></p><article class="mcases-pv"><header><span class="mcases-pl big">' + p.L + '</span><div><h2>' + esc(p.t) + '</h2><p class="lead">' + esc(p.why) + '</p><p class="mcases-ptime">' + H.ic('clock') + 'المدة: <b class="num">' + p.days + '</b> يوم' + (st.on ? ' · بدأت ' + fmtD(st.start) + ' · ميعادها ' + fmtD(addDays(st.start, p.days)) : '') + '</p></div></header>' +
      '<p class="row"><button type="button" class="btn' + (st.on ? '' : ' primary') + '" data-act="start">' + (st.on ? 'وقّف الخطة' : 'ابدأ الخطة النهارده') + '</button><a class="btn" href="#cases/print/' + c.id + '.sheet.' + p.id + '">' + H.ic('print') + 'ورقة التسجيل</a></p>' +
      '<div class="mcases-pcols"><section><h3>الخطوات</h3><ol>' + p.steps.map(function (s) { return '<li>' + esc(s) + '</li>'; }).join('') + '</ol></section><section><h3>هتسجّل إيه</h3><ul>' + p.rec.map(function (s) { return '<li>' + esc(s) + '</li>'; }).join('') + '</ul><p class="mcases-limits"><b>حدودها:</b> ' + esc(p.limits) + '</p></section></div>';
    if (p.id === 'multi') hh += '<section class="mcases-tool"><h3>جدول الاتساق</h3>' + gridHtml(c, grid(c)) + '<p class="small"><a href="#cases/c/' + c.id + '.story">ضيف رواية مصدر تاني</a></p></section>';
    if (p.id === 'abc') {
      var ca = {}, cc = {}; c.abc.forEach(function (e) { ca[e.a] = (ca[e.a] || 0) + 1; cc[e.c] = (cc[e.c] || 0) + 1; });
      function bars(o, n) { var ks = Object.keys(o).sort(function (a, b) { return o[b] - o[a]; }); return ks.length ? '<ul class="mcases-bars">' + ks.map(function (k) { return '<li><span>' + esc(k) + '</span><b class="num">' + o[k] + ' من ' + n + '</b><i data-w="' + Math.round(100 * o[k] / n) + '"></i></li>'; }).join('') + '</ul>' : ''; }
      hh += '<section class="mcases-tool"><h3>سجل ABC <span class="num">' + c.abc.length + '</span></h3><form class="mcases-abc" id="mcases-abc"><div class="fld"><label for="abc-d">التاريخ</label><input type="date" id="abc-d" value="' + H.today() + '"></div><div class="fld"><label for="abc-p">المكان</label><select id="abc-p">' + H.opts(['البيت', 'الفصل', 'اللعب', 'مكان تاني'], 'البيت') + '</select></div><div class="fld"><label for="abc-a">قبل (A)</label><select id="abc-a">' + H.opts(ABC_A, '') + '</select></div><div class="fld"><label for="abc-b">السلوك (B)</label><input type="text" id="abc-b" maxlength="80"></div><div class="fld"><label for="abc-c">بعد (C)</label><select id="abc-c">' + H.opts(ABC_C, '') + '</select></div><button class="btn" type="submit">سجّل</button></form>' +
        (c.abc.length ? '<div class="mcases-pcols"><div><h4>اللي قبله</h4>' + bars(ca, c.abc.length) + '</div><div><h4>اللي بعده</h4>' + bars(cc, c.abc.length) + '</div></div><p class="small muted">دي أعداد من اللي سجّلته، مش نسب احتمال. النمط بيبان بعد 10 تسجيلات أو أكتر.</p><div class="tablewrap"><table class="mcases-log"><thead><tr><th>التاريخ</th><th>المكان</th><th>قبل</th><th>السلوك</th><th>بعد</th><th></th></tr></thead><tbody>' + c.abc.map(function (e, i) { return '<tr><td>' + fmtD(e.d) + '</td><td>' + esc(e.p) + '</td><td>' + esc(e.a) + '</td><td>' + esc(e.b) + '</td><td>' + esc(e.c) + '</td><td><button class="btn icon" type="button" data-act="abc-del" data-i="' + i + '" aria-label="امسح التسجيل">' + H.ic('trash') + '</button></td></tr>'; }).join('') + '</tbody></table></div>' : '') + '</section>';
    }
    if (p.id === 'ab') {
      var s = abSeries(c), dir = c.abDir === 'up' ? 1 : -1, r = sc.all(s.A, s.B, dir);
      hh += '<section class="mcases-tool"><h3>العدّ اليومي</h3><form class="mcases-abc" id="mcases-ab"><div class="fld"><label for="ab-d">التاريخ</label><input type="date" id="ab-d" value="' + H.today() + '"></div><div class="fld"><label for="ab-ph">المرحلة</label><select id="ab-ph"><option value="A">أ: قبل التغيير</option><option value="B"' + (s.B.length ? ' selected' : '') + '>ب: بعد التغيير</option></select></div><div class="fld"><label for="ab-n">العدد</label><input type="number" id="ab-n" min="0" step="1"></div><button class="btn" type="submit">سجّل</button></form>' +
        '<div class="fld mcases-dir"><label for="ab-dir">الهدف إن العدد</label><select id="ab-dir"><option value="down">يقل (سلوك عايزينه يقل)</option><option value="up"' + (dir > 0 ? ' selected' : '') + '>يزيد (مهارة عايزينها تزيد)</option></select></div>' +
        (s.all.length ? phaseChart(s.A, s.B, { label: 'العدّ قبل التغيير وبعده' }) + '<dl class="mcases-stats"><div><dt>متوسط المرحلة أ</dt><dd class="num" id="ab-ma">' + (s.A.length ? r2(r.meanA) : '—') + '</dd></div><div><dt>متوسط المرحلة ب</dt><dd class="num" id="ab-mb">' + (s.B.length ? r2(r.meanB) : '—') + '</dd></div><div><dt>نقط «ب» اللي عدّت أحسن نقطة في «أ» (PND)</dt><dd class="num" id="ab-pnd">' + (s.A.length && s.B.length ? Math.round(r.pnd * 100) + '%' : '—') + '</dd></div></dl><p class="small muted">المتوسط = مجموع العدّ ÷ عدد الأيام. PND = عدد نقط «ب» الأحسن من أحسن نقطة في «أ» ÷ عدد نقط «ب». مؤشرات وصفية، ومع أقل من 5 نقط في كل مرحلة ما يتبنيش عليها حكم.</p><ul class="mcases-pts">' + s.all.map(function (e) { return '<li><span>' + fmtD(e.d) + ' · ' + (e.ph === 'A' ? 'أ' : 'ب') + ' · <b class="num">' + e.n + '</b></span><button class="btn icon" type="button" data-act="ab-del" data-id="' + e.id + '" aria-label="امسح النقطة">' + H.ic('trash') + '</button></li>'; }).join('') + '</ul>' : '<p class="muted">سجّل أول عدّ علشان الرسم يظهر.</p>') + '</section>';
    }
    hh += '<section class="mcases-dt"><h3>جدول القرار</h3><p class="small muted">علّم على اللي لقيته فعلًا. كل علامة بتتحسب مرة واحدة في لوحة الفرضيات، وبتقدر تشيلها.</p><ul>' + p.rows.map(function (r, i) {
      var v = (st.out || {})[i] || '', eff = Object.keys(r.e).map(function (k) { return '<span class="' + (r.e[k] > 0 ? 'plus' : 'minus') + '">«' + esc(byId(K.HYPS, k).t) + '» ' + (r.e[k] > 0 ? 'أقوى' : 'أضعف') + '</span>'; }).join('') || '<span class="zero">ما بتغيّرش العدّ</span>';
      return '<li class="' + (v === 'y' ? 'yes' : v === 'n' ? 'no' : '') + '"><p class="mcases-if"><b>لو لقيت:</b> ' + esc(r.f) + '</p><p class="mcases-then"><b>يبقى:</b> ' + eff + '</p><p class="small">' + esc(r.s) + '</p><p class="row"><button type="button" class="btn' + (v === 'y' ? ' inked' : '') + '" data-act="out" data-i="' + i + '" data-v="y" aria-pressed="' + (v === 'y') + '">لقيت ده</button><button type="button" class="btn' + (v === 'n' ? ' inked' : '') + '" data-act="out" data-i="' + i + '" data-v="n" aria-pressed="' + (v === 'n') + '">ما لقيتوش</button></p></li>';
    }).join('') + '</ul></section><section class="mcases-tool"><label for="pl-notes">ملاحظاتك على الخطة دي</label><textarea id="pl-notes">' + esc(st.notes || '') + '</textarea></section></article><p class="mcases-next"><a class="btn primary" href="#cases/c/' + c.id + '.hyp">شوف لوحة الفرضيات اتغيرت إزاي</a><a class="btn" href="' + base + '">كل الخطط</a></p>';
    paint(hh, { click: function (act, t) {
      if (act === 'start') { st.on = !st.on; if (st.on && !st.start) st.start = H.today(); H.save(); tPlans(c, pid); }
      else if (act === 'out') { var i = t.getAttribute('data-i'), v = t.getAttribute('data-v'); st.out = st.out || {}; st.out[i] = st.out[i] === v ? '' : v; if (!st.on) { st.on = true; st.start = st.start || H.today(); } H.save(); tPlans(c, pid); refocus('[data-act=out][data-i="' + i + '"][data-v=' + v + ']'); }
      else if (act === 'abc-del') { c.abc.splice(+t.getAttribute('data-i'), 1); H.save(); tPlans(c, pid); }
      else if (act === 'ab-del') { c.ab = c.ab.filter(function (e) { return e.id !== t.getAttribute('data-id'); }); H.save(); tPlans(c, pid); }
      else if (act === 'cell') { var key = t.getAttribute('data-k'), cur = t.getAttribute('data-v'); c.gridm[key] = cur === 'y' ? 'n' : cur === 'n' ? '' : 'y'; H.save(); tPlans(c, pid); }
    }, change: function (el) {
      if (el.id === 'pl-notes') { st.notes = el.value; H.save(); }
      if (el.id === 'ab-dir') { c.abDir = el.value; H.save(); tPlans(c, pid); }
    }, submit: function (f) {
      if (f.id === 'mcases-abc') { var a = $('#abc-a').value, cc2 = $('#abc-c').value, b = $('#abc-b').value.trim(); if (!a || !cc2 || !b) { H.toast('اكتب السلوك واختار اللي قبله واللي بعده'); return; } c.abc.push({ d: $('#abc-d').value || H.today(), p: $('#abc-p').value, a: a, b: b, c: cc2 }); H.save(); tPlans(c, pid); refocus('#abc-b'); }
      if (f.id === 'mcases-ab') { var n = parseFloat($('#ab-n').value); if (!(n >= 0)) { H.toast('اكتب العدد'); return; } c.ab.push({ id: H.uid(), d: $('#ab-d').value || H.today(), ph: $('#ab-ph').value, n: n }); H.save(); tPlans(c, pid); refocus('#ab-n'); }
    } });
    $$('[data-w]', main).forEach(function (el) { el.style.setProperty('--w', el.getAttribute('data-w') + '%'); });
  }

  function tHandle(c) {
    var chosen = K.HYPS.filter(function (h) { return (c.hyps[h.id] || {}).on; }), list = chosen.length ? chosen : K.HYPS;
    var h = caseHead(c, 'handle') + '<header class="mcases-th"><h2>التعامل: خطوات أولى ومتحفّظة</h2><p class="lead">' + (chosen.length ? 'دي الخطوات المناسبة للفرضيات اللي اخترت تفحصها.' : 'لسه ما اخترتش فرضيات، فعارضين الخطوات لكل الفرضيات.') + ' كلها دعم أولي: مش برنامج علاجي، ومفيهاش أي كلام عن أدوية.</p></header>' +
      '<aside class="mcases-dont"><h3>ما تعملش</h3><ul>' + K.DONT.map(function (s) { return '<li>' + esc(s) + '</li>'; }).join('') + '</ul></aside>' + (c.intake.tried ? '<p class="mcases-tried"><b>اتجرّب قبل كده:</b> ' + esc(c.intake.tried) + '</p>' : '') + '<div class="mcases-hl">';
    list.forEach(function (hp) {
      var g = K.HANDLE[hp.id];
      h += '<section class="mcases-hc tone-' + hp.tone + '"><h3><span class="small">لو الفرضية دي قويت</span>' + esc(hp.t) + '</h3><div class="mcases-hc-b"><div><h4>اعمل</h4><ul>' + g.doo.map(function (s) { return '<li>' + esc(s) + '</li>'; }).join('') + '</ul><p class="mcases-techs">' + g.techs.map(function (t) { return '<span>' + esc(label(K.TECHS, t)) + '</span>'; }).join('') + '</p></div><div><h4>حوّل لمين وإمتى</h4><ul>' + g.refer.map(function (s) { return '<li>' + esc(s) + '</li>'; }).join('') + '</ul></div></div></section>';
    });
    h += '</div><p class="mcases-next"><a class="btn primary" href="#cases/c/' + c.id + '.sess">كمّل: الجلسات والتقدّم</a></p>' + disclaimer();
    paint(h);
  }

  /* 5Ps formulation draft: assembled from the chips, then edited by the specialist. */
  var P5 = [['pres', 'المشكلة الحالية (Presenting)'], ['predis', 'عوامل مهيِّئة (Predisposing)'], ['precip', 'عوامل مفجِّرة (Precipitating)'], ['perp', 'عوامل بتخلّيها تستمر (Perpetuating)'], ['prot', 'عوامل حماية (Protective)']];
  function fiveDraft(c) {
    function L(f) { return c.chips.filter(f).map(function (x) { return x.l; }).filter(function (v, i, a) { return a.indexOf(v) === i; }).join('، '); }
    function tg(x, list) { return (x.t || []).some(function (t) { return list.indexOf(t) > -1; }); }
    return {
      pres: [L(function (x) { return x.c === 'beh'; }), L(function (x) { return x.c === 'set'; }), L(function (x) { return x.c === 'dur'; })].filter(Boolean).join(' · '),
      predis: L(function (x) { return x.c === 'ctx' && tg(x, ['med', 'model']) || tg(x, ['long']); }),
      precip: L(function (x) { return x.c === 'ant' || (x.c === 'ctx' && tg(x, ['change', 'bully'])); }),
      perp: L(function (x) { return x.c === 'con' || (x.c === 'ctx' && tg(x, ['adult', 'gain'])); }),
      prot: L(function (x) { return x.c === 'str'; })
    };
  }
  function summaryHtml(c) {
    var tl = tally(c), g = grid(c), dm = domains(c);
    var h = '<h2>ملخص الحالة: ' + esc(c.code) + '</h2><p class="mcases-draft">مسودة يعتمدها الأخصائي. مش تشخيص.</p><p>' + fmtD(c.date) + (c.intake.age ? ' · السن ' + esc(c.intake.age) : '') + (c.intake.grade ? ' · ' + esc(c.intake.grade) : '') + '</p>';
    h += '<h3>العناصر</h3><dl class="mcases-sum">' + K.CATS.map(function (cat) { var l = c.chips.filter(function (x) { return x.c === cat[0]; }); return l.length ? '<dt>' + cat[1] + '</dt><dd>' + l.map(function (x) { return esc(x.l); }).join('، ') + '</dd>' : ''; }).join('') + '</dl>';
    h += '<h3>المجالات</h3><p>' + (dm.map(function (x) { return esc(x[1]); }).join('، ') || '—') + '</p>';
    if (g.active.length > 1) h += '<h3>مقارنة المصادر</h3><p>متفقين على ' + g.agree + '، مختلفين على ' + g.differ + '، ومصدر واحد بس قال ' + g.only + '.</p>';
    h += '<h3>لوحة الفرضيات</h3><table class="mcases-sumt"><thead><tr><th>الفرضية</th><th>هتتفحص؟</th><th>عناصر من الرواية</th><th>شواهد معاها</th><th>شواهد ضدها</th></tr></thead><tbody>' + K.HYPS.map(function (hp) { return '<tr><th scope="row">' + esc(hp.t) + '</th><td>' + ((c.hyps[hp.id] || {}).on ? 'آه' : '—') + '</td><td class="num">' + feeds(c, hp).pro.length + '</td><td class="num">' + tl[hp.id].plus.length + '</td><td class="num">' + tl[hp.id].minus.length + '</td></tr>'; }).join('') + '</tbody></table><p class="small">الأعداد دي عدّ للشواهد اللي اتسجّلت، مش احتمالات.</p>';
    var act = K.PLANS.filter(function (p) { return (c.plans[p.id] || {}).on; });
    h += '<h3>خطط التأكد</h3>' + (act.length ? '<ul>' + act.map(function (p) { var st = c.plans[p.id]; return '<li><b>' + esc(p.t) + '</b> (بدأت ' + fmtD(st.start) + ')' + p.rows.map(function (r, i) { return st.out[i] === 'y' ? '<br>لقيت: ' + esc(r.f) : ''; }).join('') + (st.notes ? '<br>ملاحظات: ' + esc(st.notes) : '') + '</li>'; }).join('') + '</ul>' : '<p>لسه مفيش خطة بدأت.</p>');
    var f = fiveDraft(c);
    h += '<h3>صياغة الحالة (5Ps)</h3><dl class="mcases-sum">' + P5.map(function (p) { return '<dt>' + p[1] + '</dt><dd>' + esc((c.five || {})[p[0]] != null ? c.five[p[0]] : f[p[0]]) .replace(/\n/g, '<br>') + '</dd>'; }).join('') + '</dl>';
    return h;
  }
  function tFile(c) {
    var f = fiveDraft(c), confirmDel = false;
    function draw() {
      var h = caseHead(c, 'file') + '<header class="mcases-th"><h2>ملف الحالة</h2><p class="lead">كل حاجة هنا مسودة. راجعها، عدّلها، واعتمدها إنت.</p></header>' +
        '<section class="card form"><div class="fld">' + H.field('f-code', 'كود الحالة', c.code) + '</div><p class="row mcases-file-a"><a class="btn primary" href="#cases/print/' + c.id + '.summary">' + H.ic('print') + 'ملخص الحالة للطباعة</a>' + (window.HubCasesResearch ? '<a class="btn" href="#cases/research/' + c.id + '">حوّلها لبحث</a>' : '') + '</p></section>' +
        '<section class="card form mcases-five"><h2>صياغة 5Ps <span class="mcases-draft">مسودة يعتمدها الأخصائي</span></h2><p class="small muted">المسودة متجمّعة من العناصر زي ما هي. الربط بينها والمعنى شغلك إنت.</p>' + P5.map(function (p) { return '<div class="fld"><label for="five-' + p[0] + '">' + p[1] + '</label><textarea id="five-' + p[0] + '">' + esc((c.five || {})[p[0]] != null ? c.five[p[0]] : f[p[0]]) + '</textarea></div>'; }).join('') + '<p class="row"><button class="btn" type="button" data-act="five-reset">رجّع المسودة من العناصر</button></p></section>' +
        '<section class="mcases-danger"><h2>مسح الحالة</h2>' + (confirmDel ? '<p>هتتمسح الحالة وكل تسجيلاتها من الجهاز ده ومش هترجع.</p><p class="row"><button class="btn danger" type="button" data-act="del-yes">امسحها نهائي</button><button class="btn" type="button" data-act="del-no">لأ، سيبها</button></p>' : '<button class="btn danger" type="button" data-act="del">امسح الحالة</button>') + '</section>';
      paint(h, { click: function (act) {
        if (act === 'five-reset') { c.five = {}; H.save(); draw(); }
        if (act === 'del') { confirmDel = true; draw(); refocus('[data-act=del-no]'); }
        if (act === 'del-no') { confirmDel = false; draw(); }
        if (act === 'del-yes') { var d = D(); d.cases = d.cases.filter(function (x) { return x.id !== c.id; }); d.accounts.forEach(function (a) { if (a.used === c.id) a.used = ''; }); H.save(); H.go('#cases'); }
      }, change: function (el) {
        if (el.id === 'f-code') { c.code = el.value.trim() || c.code; H.save(); H.toast('اتحفظ'); }
        var m = /^five-(\w+)$/.exec(el.id); if (m) { c.five = c.five || {}; c.five[m[1]] = el.value; H.save(); H.toast('اتحفظ'); }
      } });
    }
    draw();
  }

  /* ---------- print views ---------- */
  function vPrint(id, kind, arg) {
    var c = getCase(id); if (!c) { vHome(); return; }
    var body = '', back = '#cases/c/' + c.id + '.file';
    if (kind === 'sheet') {
      var p = byId(K.PLANS, arg) || K.PLANS[0]; back = '#cases/c/' + c.id + '.plans.' + p.id;
      body = '<h2>ورقة تسجيل: ' + esc(p.t) + '</h2><p>كود الحالة: ' + esc(c.code) + ' · المدة: ' + p.days + ' يوم · اللي بيسجّل: ____________</p><p class="small">' + esc(p.limits) + '</p><h3>هتسجّل إيه</h3><ul>' + p.rec.map(function (s) { return '<li>' + esc(s) + '</li>'; }).join('') + '</ul><table class="mcases-sheet"><thead><tr>' + p.sheet.map(function (s) { return '<th>' + esc(s) + '</th>'; }).join('') + '</tr></thead><tbody>' + new Array(13).join('<tr>' + p.sheet.map(function () { return '<td></td>'; }).join('') + '</tr>') + '</tbody></table><h3>جدول القرار</h3><table class="mcases-sumt"><thead><tr><th>لو لقيت</th><th>يبقى</th></tr></thead><tbody>' + p.rows.map(function (r) { return '<tr><td>' + esc(r.f) + '</td><td>' + (Object.keys(r.e).map(function (k) { return '«' + esc(byId(K.HYPS, k).t) + '» ' + (r.e[k] > 0 ? 'أقوى' : 'أضعف'); }).join('، ') || 'ما بتغيّرش العدّ') + '. ' + esc(r.s) + '</td></tr>'; }).join('') + '</tbody></table>';
    } else if ((kind === 'progress' || kind === 'family') && window.HubCasesProgress) { body = window.HubCasesProgress(API).report(c, kind); back = '#cases/c/' + c.id + '.sess'; }
    else body = summaryHtml(c);
    paint('<p class="row mcases-pbar"><a class="btn" href="' + back + '">رجوع</a><button class="btn primary" type="button" data-act="print">' + H.ic('print') + 'اطبع</button></p><div class="printout mcases-print">' + body + '<p class="small mcases-pfoot">اتعمل على منصة مَلَكة. أداة مساعدة للأخصائي، مش تشخيص.</p></div>', { click: function (act) { if (act === 'print') window.print(); } });
  }

  /* ---------- training ---------- */
  function vTrain(id) {
    var d = D(), t = byId(K.TRAIN, id);
    if (!t) {
      var h = crumb([['#cases', 'الحالات'], ['', 'حالات للتدريب']]) + '<header class="head"><h1 class="mega" data-reveal="words">اتمرّن على <em>التفكير</em> قبل الحكم.</h1><p class="lead">8 حالات من تأليفنا، مش أطفال حقيقيين. اقرا، اختار الفرضيات اللي تستاهل الفحص وخطة تتأكد بيها، وبعدين قارن بتفكير الخبير.</p></header><ol class="mcases-tl" data-stagger="50">' + K.TRAIN.map(function (x, i) {
        var n = d.train.filter(function (a) { return a.t === x.id; }).length;
        return '<li><a href="#cases/train/' + x.id + '" class="t' + (i % 4) + '"><span class="num">' + (i + 1) + '</span><strong>' + esc(x.t) + '</strong><small>' + (n ? 'حاولت ' + n + (n === 1 ? ' مرة' : ' مرات') : 'لسه ما جرّبتهاش') + '</small></a></li>';
      }).join('') + '</ol><p class="small muted">المحاولات بتتسجّل على الجهاز ده بس: <span class="num" id="mcases-att">' + d.train.length + '</span> محاولة.</p>';
      paint(h); return;
    }
    var done = null, err = '';
    function draw() {
      var ex = extract(t.n), h = crumb([['#cases', 'الحالات'], ['#cases/train', 'حالات للتدريب'], ['', t.t]]) + '<article class="mcases-tr"><p class="mcases-fict">' + esc(K.FICT) + '</p><h1>' + esc(t.t) + '</h1><blockquote class="mcases-narr">' + esc(t.n) + '</blockquote>';
      if (!done) {
        h += '<form id="mcases-trf"><fieldset><legend>أنهي فرضيات تستاهل تتفحص الأول؟</legend><div class="mcases-pick">' + K.HYPS.map(function (hp) { return '<label><input type="checkbox" name="h" value="' + hp.id + '"><span>' + esc(hp.t) + '</span></label>'; }).join('') + '</div></fieldset><fieldset><legend>هتبدأ بأنهي خطة تأكد؟</legend><div class="mcases-pick">' + K.PLANS.map(function (p) { return '<label><input type="checkbox" name="p" value="' + p.id + '"><span>' + esc(p.t) + '</span></label>'; }).join('') + '</div></fieldset><p class="small err" role="alert">' + esc(err) + '</p><p><button class="btn primary big" type="submit">ورّيني تفكير الخبير</button></p></form>';
      } else {
        var good = t.strong.concat(t.also), hit = done.h.filter(function (x) { return t.strong.indexOf(x) > -1; }).length, phit = done.p.filter(function (x) { return t.plans.indexOf(x) > -1; }).length;
        h += '<section class="mcases-res" id="mcases-res"><div class="mcases-score"><div><b class="num">' + hit + ' من ' + t.strong.length + '</b><span>من الفرضيات اللي الخبير يبدأ بيها</span></div><div><b class="num">' + phit + ' من ' + t.plans.length + '</b><span>من الخطط اللي الخبير يبدأ بيها</span></div></div>' +
          '<h2>تفكير الخبير</h2><p>' + esc(t.why) + '</p><h3>الفرضيات</h3><ul class="mcases-cmp">' + K.HYPS.map(function (hp) { var s = t.strong.indexOf(hp.id) > -1, a = t.also.indexOf(hp.id) > -1, y = done.h.indexOf(hp.id) > -1; return '<li class="' + (s ? 'strong' : a ? 'also' : '') + '"><span>' + esc(hp.t) + '</span><b>' + (s ? 'يبدأ بيها' : a ? 'تتحط في الحساب' : 'مش أولوية هنا') + '</b><i>' + (y ? 'إنت اخترتها' : '') + '</i></li>'; }).join('') + '</ul>' +
          '<h3>كل خطة كانت هتكشف إيه</h3><dl class="mcases-show">' + K.PLANS.filter(function (p) { return t.show[p.id]; }).map(function (p) { return '<dt class="' + (t.plans.indexOf(p.id) > -1 ? 'rec' : '') + '">' + esc(p.t) + (done.p.indexOf(p.id) > -1 ? ' <i>(اخترتها)</i>' : '') + '</dt><dd>' + esc(t.show[p.id]) + '</dd>'; }).join('') + '</dl>' +
          '<h3>العناصر اللي الأداة التقطتها من الرواية</h3>' + chipList(ex.chips) + '<p class="small muted">مفيش إجابة واحدة صح: الخبير نفسه بيبدأ بفرضيات وبيغيّرها مع البيانات. ' + (good.length < 7 ? 'والفرضيات التانية ما اتشالتش، بس مش أول حاجة تتفحص هنا.' : '') + '</p><p class="row"><button class="btn" type="button" data-act="again">جرّب تاني</button><a class="btn primary" href="#cases/train">حالة تانية</a></p></section>';
      }
      paint(h + '</article>', { submit: function (f) {
        var hs = $$('input[name=h]:checked', f).map(function (x) { return x.value; }), ps = $$('input[name=p]:checked', f).map(function (x) { return x.value; });
        if (!hs.length || !ps.length) { err = 'اختار فرضية واحدة وخطة واحدة على الأقل.'; draw(); return; }
        done = { t: t.id, d: H.today(), h: hs, p: ps }; d.train.push(done); if (d.train.length > 200) d.train.shift(); H.save(); draw(); refocus('#mcases-res');
      }, click: function (act) { if (act === 'again') { done = null; err = ''; draw(); } } });
    }
    draw();
  }

  /* ---------- parent's account ---------- */
  var PQ = {
    worry: ['إيه اللي قلقك على ابنك أو بنتك؟', 'احكي براحتك وبكلامك. مثال على موقف حصل قريب هيساعد جدًا.', 'اللي مقلق ولي الأمر'],
    where: ['ده بيحصل فين وإمتى؟', 'في البيت، في المدرسة، عند حد من العيلة… الصبح، وقت الواجب، قبل النوم…', 'فين وإمتى'],
    since: ['من إمتى تقريبًا؟', 'من شهر، من أول السنة، من وهو صغير…', 'من إمتى'],
    before: ['إيه اللي بيحصل قبله على طول؟', 'كان بيعمل إيه؟ حد طلب منه حاجة؟ حد منعه من حاجة؟', 'قبله'],
    after: ['وإنتو بتعملوا إيه ساعتها؟ وهو بيعمل إيه بعدها؟', '', 'بعده'],
    tried: ['جرّبتوا إيه قبل كده؟ وإيه اللي نفع ولو شوية؟', '', 'اللي اتجرّب'],
    good: ['هو شاطر في إيه وبيحب إيه؟', 'أي حاجة: لعبة، هواية، مادة، طبع حلو فيه.', 'بيحب إيه وشاطر في إيه'],
    sleep: ['نومه وأكله وصحته عاملين إزاي؟', 'بينام إمتى؟ بيفطر قبل المدرسة؟ اتكشف على سمعه ونظره؟ بياخد أي علاج؟', 'النوم والصحة'],
    changes: ['فيه حاجة اتغيرت قريب في البيت أو المدرسة؟', 'مولود جديد، نقل، سفر، مدرّس جديد، مشكلة مع زمايله…', 'تغييرات قريبة'],
    hope: ['نفسك إيه يتغير؟', 'لو الأمور اتحسنت، هتعرف منين؟', 'اللي ولي الأمر نفسه يتغير']
  };
  function shareBox(acc) {
    var code = accCode(acc);
    return '<section class="mcases-share" id="mcases-share"><h2>اتحفظت. شكرًا ليك.</h2><p>لو الأخصائي بيستخدم نفس الجهاز ده، هيلاقيها عنده على طول. ولو على جهاز تاني، ابعت له الكود ده.</p><label for="sh-code">الكود</label><textarea id="sh-code" readonly dir="ltr">' + esc(code) + '</textarea><p class="row"><button class="btn primary" type="button" data-act="copy">انسخ الكود</button><button class="btn" type="button" data-act="file">' + H.ic('download') + 'نزّل ملف</button>' + (navigator.share ? '<button class="btn" type="button" data-act="share">ابعت للأخصائي</button>' : '') + '</p><p class="small muted">الكود فيه اللي كتبته، واسم الدلع أو الاسم الأول، والسن والصف بس. مفيهوش اسمك ولا أي بيانات تانية.</p></section>';
  }
  function vParent(kidId) {
    var S = H.state(), d = D(), kids = S.kids || [], kid = byId(kids, kidId) || kids[0], saved = null;
    function draw() {
      var h = '<header class="head"><h1 class="mega">احكي لنا عن <em>' + esc(kid ? firstName(kid.child) : 'ابنك أو بنتك') + '</em>.</h1><p class="lead">اللي هتكتبه هنا بيساعد الأخصائي يفهم الصورة من ناحيتك. مفيش إجابة صح أو غلط.</p></header>' +
        '<p class="mcases-warm">ده مش اختبار، ومش حكم عليك ولا على ابنك. إنت أكتر حد عارفه، وكلامك بيكمّل اللي الأخصائي بيشوفه. اكتب اللي تقدر عليه وسيب الباقي.</p>';
      if (!kids.length) { paint(h + '<div class="card"><p>علشان الرواية تتربط بطفلك، سجّله الأول. التسجيل بياخد دقيقة.</p><p><a class="btn primary" href="#family">سجّل طفلك</a></p></div>'); return; }
      if (saved) h += shareBox(saved) + '<p class="row"><button class="btn" type="button" data-act="more">اكتب رواية تانية</button><a class="btn" href="#home">رجوع للرئيسية</a></p>';
      else h += '<form class="card form mcases-pf" id="mcases-pf" novalidate>' + (kids.length > 1 ? '<div class="fld"><label for="pa-kid">بتحكي عن مين؟</label><select id="pa-kid">' + kids.map(function (k) { return '<option value="' + k.id + '"' + (k.id === kid.id ? ' selected' : '') + '>' + esc(firstName(k.child)) + '</option>'; }).join('') + '</select></div>' : '') +
        ACC_KEYS.map(function (k, i) { return '<div class="fld mcases-q"><span class="mcases-qn num" aria-hidden="true">' + (i + 1) + '</span>' + H.field('pa-' + k, PQ[k][0], '', PQ[k][1], k === 'since' ? 'text' : 'area') + '</div>'; }).join('') +
        '<p class="small muted">يُفضّل ما تكتبش أسماء كاملة لحد. «أخوه الكبير» أو «المدرّسة» كفاية.</p><p class="small err" role="alert" id="pa-err"></p><p class="form-end"><button class="btn primary big" type="submit">احفظ وابعت للأخصائي</button></p></form>';
      var mine = d.accounts.filter(function (a) { return a.src !== 'import' && kids.some(function (k) { return k.id === a.kidId; }); });
      if (mine.length && !saved) h += '<section class="mcases-mine"><h2>روايات كتبتها قبل كده</h2><ul>' + mine.map(function (a) { return '<li><span>' + esc(a.kid.n) + ' · ' + fmtD(a.date) + '</span><button class="btn" type="button" data-act="reshare" data-id="' + a.id + '">الكود</button></li>'; }).join('') + '</ul></section>';
      h += '<aside class="mcases-urgent"><h2>لو فيه خطر دلوقتي</h2><p>لو خايف على سلامة الطفل أو حد بيأذيه، ما تستناش: كلّم خط نجدة الطفل <a class="num" dir="ltr" href="tel:16000">16000</a>، أو الإسعاف <a class="num" dir="ltr" href="tel:123">123</a>. وللدعم النفسي: <a class="num" dir="ltr" href="tel:16328">16328</a>.</p><p class="small">اتأكد إن الأرقام شغّالة في بلدك.</p></aside>';
      paint(h, { submit: function () {
        var a = {}, any = false; ACC_KEYS.forEach(function (k) { var v = $('#pa-' + k).value.trim(); if (v) { a[k] = v.slice(0, 1500); any = true; } });
        if (!a.worry) { $('#pa-err').textContent = 'اكتب ولو سطر في أول سؤال: إيه اللي قلقك؟'; $('#pa-worry').focus(); return; }
        var pk = $('#pa-kid'); if (pk) kid = byId(kids, pk.value) || kid;
        saved = { id: H.uid(), v: 1, kidId: kid.id, kid: { n: firstName(kid.child), a: kid.age, g: kid.grade }, date: H.today(), a: a, src: 'local' };
        d.accounts.unshift(saved); H.save(); draw(); refocus('#sh-code'); window.scrollTo(0, 0);
      }, click: function (act, t) {
        if (act === 'more') { saved = null; draw(); }
        if (act === 'reshare') { saved = byId(d.accounts, t.getAttribute('data-id')); draw(); window.scrollTo(0, 0); }
        if (!saved) return;
        var code = accCode(saved);
        if (act === 'copy') { if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(code).then(function () { H.toast('اتنسخ الكود'); }, function () { $('#sh-code').select(); H.toast('حدّد الكود وانسخه يدوي'); }); else { $('#sh-code').select(); H.toast('حدّد الكود وانسخه يدوي'); } }
        if (act === 'file') download('parent-account-' + saved.date + '.json', JSON.stringify(accPayload(saved)), 'application/json');
        if (act === 'share') navigator.share({ title: 'رواية ولي الأمر', text: code }).catch(function () {});
      } });
    }
    draw();
  }
  function download(name, text, type) {
    var a = document.createElement('a'), url = URL.createObjectURL(new Blob([text], { type: type || 'text/plain' }));
    a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(function () { URL.revokeObjectURL(url); }, 2000);
    API.lastDownload = { name: name, text: text };
  }

  /* ---------- assistant hand-over: de-identified chips only, the narrative only with consent ---------- */
  function assistBtn() { return window.HubAssistant || $('.assist-fab', document) ? '<button class="btn" type="button" data-act="assist">حلّل مع مُحكَم</button>' : ''; }
  function assistText(c, withNarr) {
    var auto = c.chips.filter(function (x) { return x.k && x.src === 'auto'; }), mine = c.chips.length - auto.length;
    var t = 'حالة طفل (من غير أي بيانات تعريفية)' + (c.intake.age ? '، السن ' + c.intake.age : '') + '. العناصر:\n' + K.CATS.map(function (cat) { var l = auto.filter(function (x) { return x.c === cat[0]; }); return l.length ? '- ' + cat[1] + ': ' + l.map(function (x) { return x.l; }).join('، ') : ''; }).filter(Boolean).join('\n') + (mine ? '\n(وفيه ' + mine + ' عنصر كتبه الأخصائي بإيده ومش مبعوت.)' : '') + '\nساعدني أفكر في فرضيات بديلة وطرق تأكد. من غير تشخيص.';
    if (withNarr) t += '\n\nالرواية (بموافقة الأخصائي): ' + (c.intake.narr || '');
    return t;
  }
  function askAssistant(c) {
    var box = document.createElement('dialog'); box.className = 'mcases-dlg';
    box.innerHTML = '<h2>حلّل مع مُحكَم</h2><p>هنبعت لمُحكَم العناصر اللي الأداة التقطتها بس، من غير كود الحالة ومن غير النص.</p><pre id="as-prev"></pre><label class="check" for="as-ok"><input type="checkbox" id="as-ok"><span>ابعت كمان نص الرواية. أنا راجعته ومفيهوش أسماء ولا بيانات تعرّف بالطفل.</span></label><p class="row"><button class="btn primary" type="button" id="as-go">افتح مُحكَم</button><button class="btn" type="button" id="as-no">إلغاء</button></p>';
    document.body.appendChild(box);
    function prev() { $('#as-prev', box).textContent = assistText(c, $('#as-ok', box).checked); }
    prev(); $('#as-ok', box).addEventListener('change', prev);
    function close() { if (box.close) box.close(); box.remove(); }
    $('#as-no', box).addEventListener('click', close);
    $('#as-go', box).addEventListener('click', function () {
      var text = assistText(c, $('#as-ok', box).checked), ctx = { label: 'محاكي الأخصائي: حالة من غير بيانات تعريفية' }; close(); API.lastAssist = text;
      if (window.HubAssistant) { window.HubAssistant.open({ context: ctx, ask: text }); return; }
      var fab = $('.assist-fab', document), n = 0; if (!fab) return; fab.click();
      var iv = setInterval(function () { if (window.HubAssistant && $('dialog[open] .massistant-ctx', document)) { clearInterval(iv); window.HubAssistant.open({ context: ctx }); window.HubAssistant.ask(text); } else if (++n > 60) clearInterval(iv); }, 150);
    });
    if (box.showModal) box.showModal(); else box.setAttribute('open', '');
  }

  /* ---------- router ---------- */
  var API = { H: H, K: null, D: D, getCase: getCase, fmtD: fmtD, addDays: addDays, byId: byId, label: label, r2: r2, paint: paint, refocus: refocus, caseHead: caseHead, crumb: crumb, disclaimer: disclaimer, sc: sc, phaseChart: phaseChart, tally: tally, feeds: feeds, grid: grid, domains: domains, abSeries: abSeries, extract: extract, norm: norm, scan: scan, newCase: newCase, accCode: accCode, accParse: accParse, accPayload: accPayload, firstName: firstName, download: download, assistText: assistText, web: web };
  window.HubCases = API;
  function route(a, b) {
    var S = H.state(), parts = String(b || '').split('.');
    if (S.role === 'parent' || a === 'parent') { vParent(b); return; }
    if (a === 'new') vNew();
    else if (a === 'c') vCase(parts[0], parts[1], parts[2]);
    else if (a === 'print') vPrint(parts[0], parts[1], parts[2]);
    else if (a === 'train') vTrain(b);
    else if ((a === 'research' || a === 'study') && window.HubCasesResearch) window.HubCasesResearch(API).view(a, parts);
    else vHome();
  }
  function ready(cb) {
    if (K) return cb();
    if (loading) { loading.push(cb); return; }
    loading = [cb]; var i = 0;
    (function next() {
      if (i === DEPS.length) { K = API.K = window.HubCasesData; if (K) compile(); var q = loading; loading = null; q.forEach(function (f) { f(); }); return; }
      var s = document.createElement('script'); s.src = DEPS[i++]; s.onload = next; s.onerror = next; document.head.appendChild(s);
    })();
  }
  H.register('cases', function (m, a, b) {
    main = m; var sync = true;
    ready(function () {
      if ((location.hash || '').slice(1).split('/')[0] !== 'cases') return;
      if (!K) { main.innerHTML = '<header class="head"><h1>محاكي الأخصائي</h1><p class="lead">القسم ما اتحمّلش. اتأكد من النت وجرّب تاني.</p></header>'; return; }
      edit = null; route(a, b);
      if (!sync && window.HubMotion && window.HubMotion.after) window.HubMotion.after(main, 'cases');
    });
    sync = false;
  });
})();
