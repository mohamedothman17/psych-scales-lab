/* Calculation core for the decision and operations-research section.
   Pure functions, no DOM. Loaded by mod-decide.js in the browser and by the test file in Node. */
(function (root) {
  'use strict';
  var C = {};

  /* ---------- special functions ---------- */
  var LG = [76.18009172947146, -86.50532032941677, 24.01409824083091, -1.231739572450155, 0.1208650973866179e-2, -0.5395239384953e-5];
  function lgamma(x) {
    if (x < 0.5) return Math.log(Math.PI / Math.abs(Math.sin(Math.PI * x))) - lgamma(1 - x);
    var y = x, t = x + 5.5, s = 1.000000000190015; t -= (x + 0.5) * Math.log(t);
    for (var j = 0; j < 6; j++) s += LG[j] / ++y;
    return -t + Math.log(2.5066282746310005 * s / x);
  }
  function betacf(x, a, b) {
    var FP = 1e-300, qab = a + b, qap = a + 1, qam = a - 1, c = 1, d = 1 - qab * x / qap;
    if (Math.abs(d) < FP) d = FP; d = 1 / d; var h = d;
    for (var m = 1; m <= 600; m++) {
      var m2 = 2 * m, aa = m * (b - m) * x / ((qam + m2) * (a + m2));
      d = 1 + aa * d; if (Math.abs(d) < FP) d = FP; c = 1 + aa / c; if (Math.abs(c) < FP) c = FP; d = 1 / d; h *= d * c;
      aa = -(a + m) * (qab + m) * x / ((a + m2) * (qap + m2));
      d = 1 + aa * d; if (Math.abs(d) < FP) d = FP; c = 1 + aa / c; if (Math.abs(c) < FP) c = FP; d = 1 / d;
      var del = d * c; h *= del; if (Math.abs(del - 1) < 1e-15) break;
    }
    return h;
  }
  /* regularised incomplete beta I_x(a,b) */
  function ibeta(x, a, b) {
    if (x <= 0) return 0; if (x >= 1) return 1;
    var bt = Math.exp(lgamma(a + b) - lgamma(a) - lgamma(b) + a * Math.log(x) + b * Math.log(1 - x));
    return x < (a + 1) / (a + b + 2) ? bt * betacf(x, a, b) / a : 1 - bt * betacf(1 - x, b, a) / b;
  }
  /* standard normal CDF, double precision (Hart's rational approximation as given by West, 2005) */
  function normCdf(x) {
    var z = Math.abs(x), c;
    if (z > 37) c = 0;
    else {
      var e = Math.exp(-z * z / 2), b;
      if (z < 7.07106781186547) {
        b = 3.52624965998911e-02 * z + 0.700383064443688; b = b * z + 6.37396220353165; b = b * z + 33.912866078383; b = b * z + 112.079291497871; b = b * z + 221.213596169931; b = b * z + 220.206867912376; c = e * b;
        b = 8.83883476483184e-02 * z + 1.75566716318264; b = b * z + 16.064177579207; b = b * z + 86.7807322029461; b = b * z + 296.564248779674; b = b * z + 637.333633378831; b = b * z + 793.826512519948; b = b * z + 440.413735824752; c = c / b;
      } else { b = z + 0.65; b = z + 4 / b; b = z + 3 / b; b = z + 2 / b; b = z + 1 / b; c = e / b / 2.506628274631; }
    }
    return x > 0 ? 1 - c : c;
  }
  function bisect(f, lo, hi, n) { for (var i = 0; i < (n || 200); i++) { var m = (lo + hi) / 2; if (f(m)) hi = m; else lo = m; } return (lo + hi) / 2; }
  function normInv(p) { return bisect(function (x) { return normCdf(x) >= p; }, -40, 40, 120); }
  function tCdf(t, df) { var p = 0.5 * ibeta(df / (df + t * t), df / 2, 0.5); return t > 0 ? 1 - p : p; }
  function tInv(p, df) { return bisect(function (x) { return tCdf(x, df) >= p; }, -1e4, 1e4, 200); }
  function fCdf(x, d1, d2) { return x <= 0 ? 0 : ibeta(d1 * x / (d1 * x + d2), d1 / 2, d2 / 2); }
  function fInv(p, d1, d2) { return bisect(function (x) { return fCdf(x, d1, d2) >= p; }, 0, 1e5, 200); }
  function simpson(f, a, b, n) { var h = (b - a) / n, s = f(a) + f(b); for (var i = 1; i < n; i++) s += f(a + i * h) * (i % 2 ? 4 : 2); return s * h / 3; }

  /* Noncentral t CDF by direct numerical integration of its definition:
     T = (Z + delta) / sqrt(V/df), so P(T <= t) = E[ Phi(t*s/sqrt(df) - delta) ] with s = sqrt(V) chi-distributed. */
  function nctCdf(t, df, delta) {
    var c = -(df / 2 - 1) * Math.LN2 - lgamma(df / 2), r = Math.sqrt(df), lo = Math.max(0, r - 9), hi = r + 9;
    return simpson(function (s) {
      var dens = s === 0 ? (df === 1 ? Math.exp(c) : 0) : Math.exp((df - 1) * Math.log(s) - s * s / 2 + c);
      return dens * normCdf(t * s / r - delta);
    }, lo, hi, 720);
  }
  /* Noncentral F upper tail: Poisson mixture of central beta CDFs. */
  function ncfSf(f, d1, d2, lam) {
    if (f <= 0) return 1;
    var x = d1 * f / (d1 * f + d2), h = lam / 2, j0 = Math.floor(h), sum = 0, j, term;
    function pois(j) { return h === 0 ? (j === 0 ? 1 : 0) : Math.exp(-h + j * Math.log(h) - lgamma(j + 1)); }
    for (j = j0; j < j0 + 5000; j++) { var pw = pois(j); term = pw * ibeta(x, d1 / 2 + j, d2 / 2); sum += term; if (pw < 1e-14 && j > j0 + 5) break; }
    for (j = j0 - 1; j >= 0; j--) { var pv = pois(j); sum += pv * ibeta(x, d1 / 2 + j, d2 / 2); if (pv < 1e-14) break; }
    return Math.max(0, Math.min(1, 1 - sum));
  }
  /* Gauss hypergeometric series 2F1(a,b;c;z) for |z|<1 */
  function hyp2f1(a, b, c, z) { var s = 1, t = 1; for (var k = 0; k < 2000; k++) { t *= (a + k) * (b + k) / ((c + k) * (k + 1)) * z; s += t; if (Math.abs(t) < 1e-16 * Math.abs(s)) break; } return s; }
  /* Exact density of the sample correlation r under a bivariate normal population with correlation rho (Hotelling's form). */
  function rDensity(r, n, rho) {
    var lg = Math.log(n - 2) + lgamma(n - 1) - lgamma(n - 0.5) - 0.5 * Math.log(2 * Math.PI) + (n - 1) / 2 * Math.log(1 - rho * rho) - (n - 1.5) * Math.log(1 - rho * r);
    var one = 1 - r * r; if (one <= 0) return n === 4 ? Math.exp(lg) * hyp2f1(0.5, 0.5, n - 0.5, (1 + rho * r) / 2) : 0;
    return Math.exp(lg + (n - 4) / 2 * Math.log(one)) * hyp2f1(0.5, 0.5, n - 0.5, (1 + rho * r) / 2);
  }
  C.fn = { lgamma: lgamma, ibeta: ibeta, normCdf: normCdf, normInv: normInv, tCdf: tCdf, tInv: tInv, fCdf: fCdf, fInv: fInv, nctCdf: nctCdf, ncfSf: ncfSf, rDensity: rDensity, simpson: simpson };

  /* ---------- power ---------- */
  /* design: 'ind' (two independent groups, n = per group), 'paired' (n = pairs), 'anova' (k groups, n = per group), 'corr' (n = total).
     es: d, dz, f or r.  tails: 1 or 2 (anova is always the omnibus F test). */
  C.power = function (design, es, n, alpha, tails, k) {
    es = Math.abs(es); tails = tails === 1 ? 1 : 2;
    var df, tc, ncp;
    if (design === 'ind' || design === 'paired') {
      if (design === 'ind') { if (n < 2) return NaN; df = 2 * n - 2; ncp = es * Math.sqrt(n / 2); } else { if (n < 2) return NaN; df = n - 1; ncp = es * Math.sqrt(n); }
      tc = tInv(1 - alpha / tails, df);
      return 1 - nctCdf(tc, df, ncp) + (tails === 2 ? nctCdf(-tc, df, ncp) : 0);
    }
    if (design === 'anova') { k = k || 3; if (n < 2) return NaN; var N = n * k, d1 = k - 1, d2 = N - k; return ncfSf(fInv(1 - alpha, d1, d2), d1, d2, es * es * N); }
    if (design === 'corr') {
      if (n < 4) return NaN; if (es >= 1) return 1;
      tc = tInv(1 - alpha / tails, n - 2); var rc = tc / Math.sqrt(tc * tc + n - 2);
      var mid = simpson(function (r) { return rDensity(r, n, es); }, tails === 2 ? -rc : -1 + 1e-9, rc, 2000);
      if (tails === 1 && n === 4) mid = 1 - simpson(function (r) { return rDensity(r, n, es); }, rc, 1, 2000);
      return Math.max(0, Math.min(1, 1 - mid));
    }
    return NaN;
  };
  C.minN = function (design) { return design === 'corr' ? 4 : 2; };
  /* smallest n (in the design's own unit) reaching the target power; null when it is beyond 1e6 */
  C.needN = function (design, es, alpha, target, tails, k) {
    if (!(Math.abs(es) > 0)) return null;
    var lo = C.minN(design), hi = lo; if (C.power(design, es, lo, alpha, tails, k) >= target) return lo;
    while (C.power(design, es, hi, alpha, tails, k) < target) { lo = hi; hi *= 2; if (hi > 1e6) return null; }
    while (hi - lo > 1) { var m = Math.floor((lo + hi) / 2); if (C.power(design, es, m, alpha, tails, k) >= target) hi = m; else lo = m; }
    return hi;
  };
  C.people = function (design, n, k) { return design === 'ind' ? 2 * n : design === 'anova' ? (k || 3) * n : n; };
  /* cost of a study with n units; c = {per, fixed, clusterSize, perCluster} */
  C.cost = function (design, n, k, c) {
    var p = C.people(design, n, k), t = (c.fixed || 0) + p * (c.per || 0);
    if (c.clusterSize > 0 && c.perCluster > 0) t += Math.ceil(p / c.clusterSize) * c.perCluster;
    return t;
  };
  /* largest n affordable within the budget (0 when even the minimum does not fit) */
  C.affordN = function (design, budget, k, c) {
    var lo = 0, hi = 1; if (C.cost(design, C.minN(design), k, c) > budget) return 0;
    if (!((c.per || 0) > 0) && !(c.clusterSize > 0 && c.perCluster > 0)) return Infinity;
    while (C.cost(design, hi, k, c) <= budget) { lo = hi; hi *= 2; if (hi > 1e7) return lo; }
    while (hi - lo > 1) { var m = Math.floor((lo + hi) / 2); if (C.cost(design, m, k, c) <= budget) lo = m; else hi = m; }
    return lo;
  };
  /* design effect for cluster sampling with equal cluster size m and intraclass correlation icc: 1 + (m-1)*icc */
  C.deffCluster = function (m, icc) { return m > 1 && icc > 0 ? 1 + (m - 1) * icc : 1; };

  /* ---------- AHP ---------- */
  C.RI = [0, 0, 0, 0.58, 0.90, 1.12, 1.24, 1.32, 1.41, 1.45, 1.49];
  /* principal eigenvector by power iteration; A is a positive reciprocal matrix */
  C.ahp = function (A) {
    var n = A.length, w = [], i, j, it;
    for (i = 0; i < n; i++) w.push(1 / n);
    if (n === 1) return { w: [1], lambda: 1, ci: 0, ri: 0, cr: 0, iter: 0 };
    for (it = 0; it < 1000; it++) {
      var v = [], s = 0, diff = 0;
      for (i = 0; i < n; i++) { var t = 0; for (j = 0; j < n; j++) t += A[i][j] * w[j]; v.push(t); s += t; }
      for (i = 0; i < n; i++) { v[i] /= s; diff = Math.max(diff, Math.abs(v[i] - w[i])); }
      w = v; if (diff < 1e-13) break;
    }
    var lam = 0; for (i = 0; i < n; i++) { var u = 0; for (j = 0; j < n; j++) u += A[i][j] * w[j]; lam += u / w[i]; } lam /= n;
    var ci = (lam - n) / (n - 1), ri = C.RI[n] || 1.49;
    return { w: w, lambda: lam, ci: ci, ri: ri, cr: ri ? ci / ri : 0, iter: it };
  };
  /* judgements ranked by how far they are from what the weights imply: e = a_ij * w_j / w_i (1 means perfectly consistent) */
  C.ahpWorst = function (A, w) {
    var out = [], n = A.length;
    for (var i = 0; i < n; i++) for (var j = i + 1; j < n; j++) { var e = A[i][j] * w[j] / w[i]; out.push({ i: i, j: j, a: A[i][j], implied: w[i] / w[j], dev: Math.max(e, 1 / e) }); }
    return out.sort(function (x, y) { return y.dev - x.dev; });
  };
  /* reciprocal matrix from upper-triangle slider values: v in -8..8, v>=0 means row is (v+1) times the column, v<0 the opposite */
  C.ahpMatrix = function (n, vals) {
    var A = [], i, j, k = 0; for (i = 0; i < n; i++) { A.push([]); for (j = 0; j < n; j++) A[i].push(1); }
    for (i = 0; i < n; i++) for (j = i + 1; j < n; j++) { var v = +vals[k++] || 0, a = v >= 0 ? v + 1 : 1 / (1 - v); A[i][j] = a; A[j][i] = 1 / a; }
    return A;
  };
  C.saaty = function (ratio) { var a = ratio >= 1 ? ratio : 1 / ratio, s = Math.max(1, Math.min(9, Math.round(a))); return ratio >= 1 ? s - 1 : -(s - 1); };
  /* weights when criterion k is moved to t and the others keep their proportions */
  C.shift = function (w, k, t) {
    var rest = 1 - w[k], n = w.length;
    return w.map(function (x, i) { return i === k ? t : rest > 1e-12 ? x * (1 - t) / rest : (1 - t) / (n - 1); });
  };
  /* sweep one weight from 0 to 1; scoreFn(weights) -> scores per alternative. Returns the grid and where the leader changes. */
  C.sweep = function (w, k, scoreFn, steps) {
    steps = steps || 100; var grid = [], flips = [], prev = -1;
    for (var s = 0; s <= steps; s++) {
      var t = s / steps, sc = scoreFn(C.shift(w, k, t)), best = 0;
      for (var a = 1; a < sc.length; a++) if (sc[a] > sc[best] + 1e-12) best = a;
      if (prev > -1 && best !== prev) flips.push({ t: t, from: prev, to: best });
      prev = best; grid.push({ t: t, s: sc });
    }
    return { grid: grid, flips: flips };
  };
  C.rank = function (scores) { var idx = scores.map(function (s, i) { return i; }); idx.sort(function (a, b) { return scores[b] - scores[a] || a - b; }); return idx; };

  /* ---------- TOPSIS ---------- */
  /* X[alt][crit], w weights (normalised inside), kinds[crit] = 'benefit' | 'cost'. Vector normalisation. */
  C.topsis = function (X, w, kinds) {
    var m = X.length, n = w.length, sw = 0, i, j; for (j = 0; j < n; j++) sw += w[j];
    var V = [], best = [], worst = [];
    for (i = 0; i < m; i++) V.push([]);
    for (j = 0; j < n; j++) {
      var norm = 0; for (i = 0; i < m; i++) norm += X[i][j] * X[i][j]; norm = Math.sqrt(norm);
      var mx = -Infinity, mn = Infinity;
      for (i = 0; i < m; i++) { var v = norm ? X[i][j] / norm * w[j] / sw : 0; V[i][j] = v; if (v > mx) mx = v; if (v < mn) mn = v; }
      best.push(kinds[j] === 'cost' ? mn : mx); worst.push(kinds[j] === 'cost' ? mx : mn);
    }
    var dp = [], dm = [], cc = [];
    for (i = 0; i < m; i++) {
      var a = 0, b = 0; for (j = 0; j < n; j++) { a += Math.pow(V[i][j] - best[j], 2); b += Math.pow(V[i][j] - worst[j], 2); }
      a = Math.sqrt(a); b = Math.sqrt(b); dp.push(a); dm.push(b); cc.push(a + b > 0 ? b / (a + b) : 0.5);
    }
    return { V: V, best: best, worst: worst, dPlus: dp, dMinus: dm, cc: cc };
  };

  /* ---------- stratified allocation ---------- */
  /* Share an integer total n over strata in proportion to weights, with integer lower bounds lo[h] and upper bounds hi[h].
     Bounded strata are fixed and the rest re-shared; the remainder goes to the largest fractional parts. Total is preserved. */
  C.share = function (weights, n, lo, hi) {
    var H = weights.length, fixed = [], val = [], h, guard = 0, sumLo = 0, sumHi = 0;
    for (h = 0; h < H; h++) { sumLo += lo[h]; sumHi += hi[h]; fixed.push(false); val.push(0); }
    if (n < sumLo || n > sumHi) return null;
    while (guard++ < 4 * H + 4) {
      var left = n, sw = 0, free = 0; for (h = 0; h < H; h++) { if (fixed[h]) left -= val[h]; else { sw += weights[h]; free++; } }
      if (!free) break;
      var over = false, under = false;
      for (h = 0; h < H; h++) if (!fixed[h]) val[h] = sw > 0 ? left * weights[h] / sw : left / free;
      for (h = 0; h < H; h++) if (!fixed[h] && val[h] > hi[h] + 1e-9) { val[h] = hi[h]; fixed[h] = true; over = true; }
      if (over) continue;
      for (h = 0; h < H; h++) if (!fixed[h] && val[h] < lo[h] - 1e-9) { val[h] = lo[h]; fixed[h] = true; under = true; }
      if (!under) break;
    }
    var out = val.map(function (v, i) { return fixed[i] ? Math.round(v) : Math.floor(v + 1e-9); }), tot = 0; for (h = 0; h < H; h++) tot += out[h];
    var order = val.map(function (v, i) { return i; }).filter(function (i) { return !fixed[i]; }).sort(function (a, b) { return (val[b] - Math.floor(val[b] + 1e-9)) - (val[a] - Math.floor(val[a] + 1e-9)) || weights[b] - weights[a]; });
    var p = 0, spin = 0;
    while (tot < n && order.length && spin < 10 * H + n) { var q = order[p % order.length]; if (out[q] < hi[q]) { out[q]++; tot++; } p++; spin++; }
    if (tot < n) for (h = 0; h < H && tot < n; h++) while (out[h] < hi[h] && tot < n) { out[h]++; tot++; }
    return { n: out, real: val };
  };
  /* strata: [{N, S, c, mean}], method: 'prop' | 'neyman' | 'cost'. opts: {n, min, budget, fixed} */
  C.allocate = function (strata, method, opts) {
    var H = strata.length, min = Math.max(0, Math.floor(opts.min || 0)), wts = [], lo = [], hi = [], h, n = opts.n;
    for (h = 0; h < H; h++) {
      var s = strata[h], c = s.c > 0 ? s.c : 1;
      wts.push(method === 'prop' ? s.N : method === 'neyman' ? s.N * s.S : s.N * s.S / Math.sqrt(c));
      lo.push(Math.min(min, s.N)); hi.push(s.N);
    }
    if (method === 'cost' && opts.budget > 0) {
      var a = 0, b = 0; for (h = 0; h < H; h++) { var ch = strata[h].c > 0 ? strata[h].c : 1; a += strata[h].N * strata[h].S / Math.sqrt(ch); b += strata[h].N * strata[h].S * Math.sqrt(ch); }
      var avail = opts.budget - (opts.fixed || 0); if (!(avail > 0) || !(b > 0)) return null;
      n = Math.floor(avail * a / b + 1e-9); var res = null, sumHi = 0; for (h = 0; h < H; h++) sumHi += hi[h]; n = Math.min(n, sumHi);
      for (; n > 0; n--) { res = C.share(wts, n, lo, hi); if (res && C.stratCost(strata, res.n, opts.fixed) <= opts.budget + 1e-9) break; res = null; }
      if (!res) return null; res.total = n; return res;
    }
    var r = C.share(wts, n, lo, hi); if (r) r.total = n; return r;
  };
  C.stratCost = function (strata, nh, fixed) { var t = fixed || 0; for (var h = 0; h < strata.length; h++) t += nh[h] * (strata[h].c > 0 ? strata[h].c : 0); return t; };
  /* variance of the stratified mean with finite population correction, and the simple-random-sample comparison */
  C.stratVar = function (strata, nh) {
    var N = 0, h, mu = 0, haveMeans = strata.every(function (s) { return typeof s.mean === 'number' && isFinite(s.mean); });
    for (h = 0; h < strata.length; h++) N += strata[h].N;
    for (h = 0; h < strata.length; h++) mu += strata[h].N / N * (haveMeans ? strata[h].mean : 0);
    var v = 0, n = 0, ss = 0, ok = true;
    for (h = 0; h < strata.length; h++) {
      var s = strata[h], W = s.N / N; n += nh[h];
      if (nh[h] > 0) v += W * W * s.S * s.S / nh[h] * (1 - nh[h] / s.N); else if (s.S > 0 && s.N > 0) ok = false;
      ss += (s.N - 1) * s.S * s.S + s.N * Math.pow((haveMeans ? s.mean : 0) - mu, 2);
    }
    var S2 = N > 1 ? ss / (N - 1) : 0, vs = n > 0 ? S2 / n * (1 - n / N) : NaN;
    return { n: n, N: N, varStrat: ok ? v : NaN, seStrat: ok ? Math.sqrt(v) : NaN, S2: S2, varSrs: vs, seSrs: Math.sqrt(vs), deff: ok && vs > 0 ? v / vs : NaN, haveMeans: haveMeans };
  };

  /* ---------- assignment ---------- */
  /* Hungarian algorithm (Kuhn-Munkres with potentials), minimising. cost is rows x cols with rows <= cols.
     Returns the column chosen for each row. Exact. */
  C.hungarian = function (cost) {
    var n = cost.length, m = cost[0].length, u = [], v = [], p = [], way = [], i, j;
    for (i = 0; i <= n; i++) u.push(0); for (j = 0; j <= m; j++) { v.push(0); p.push(0); way.push(0); }
    for (i = 1; i <= n; i++) {
      p[0] = i; var j0 = 0, minv = [], used = []; for (j = 0; j <= m; j++) { minv.push(Infinity); used.push(false); }
      do {
        used[j0] = true; var i0 = p[j0], delta = Infinity, j1 = 0;
        for (j = 1; j <= m; j++) if (!used[j]) { var cur = cost[i0 - 1][j - 1] - u[i0] - v[j]; if (cur < minv[j]) { minv[j] = cur; way[j] = j0; } if (minv[j] < delta) { delta = minv[j]; j1 = j; } }
        for (j = 0; j <= m; j++) if (used[j]) { u[p[j]] += delta; v[j] -= delta; } else minv[j] -= delta;
        j0 = j1;
      } while (p[j0] !== 0);
      do { var j2 = way[j0]; p[j0] = p[j2]; j0 = j2; } while (j0);
    }
    var ans = []; for (i = 0; i < n; i++) ans.push(-1);
    for (j = 1; j <= m; j++) if (p[j]) ans[p[j] - 1] = j - 1;
    return ans;
  };
  /* Minimum-cost maximum flow by successive shortest augmenting paths (Bellman-Ford). Exact for integer capacities. */
  function Flow(n) { this.n = n; this.g = []; for (var i = 0; i < n; i++) this.g.push([]); }
  Flow.prototype.add = function (a, b, cap, cost) { var e = { to: b, cap: cap, cost: cost, rev: this.g[b].length }; this.g[a].push(e); this.g[b].push({ to: a, cap: 0, cost: -cost, rev: this.g[a].length - 1 }); return e; };
  Flow.prototype.run = function (s, t) {
    var flow = 0, cost = 0, n = this.n, g = this.g;
    for (;;) {
      var dist = [], pv = [], pe = [], inq = [], i; for (i = 0; i < n; i++) { dist.push(Infinity); pv.push(-1); pe.push(-1); inq.push(false); }
      dist[s] = 0; var q = [s]; inq[s] = true;
      while (q.length) { var x = q.shift(); inq[x] = false; for (i = 0; i < g[x].length; i++) { var e = g[x][i]; if (e.cap > 0 && dist[x] + e.cost < dist[e.to] - 1e-12) { dist[e.to] = dist[x] + e.cost; pv[e.to] = x; pe[e.to] = i; if (!inq[e.to]) { q.push(e.to); inq[e.to] = true; } } } }
      if (dist[t] === Infinity) break;
      var f = Infinity, y; for (y = t; y !== s; y = pv[y]) f = Math.min(f, g[pv[y]][pe[y]].cap);
      for (y = t; y !== s; y = pv[y]) { var ed = g[pv[y]][pe[y]]; ed.cap -= f; g[y][ed.rev].cap += f; }
      flow += f; cost += f * dist[t];
    }
    return { flow: flow, cost: cost };
  };
  C.Flow = Flow;
  /* Draft schedule.
     slots: number of time slots. specs: [{avail:[bool per slot], cap}]. cases: [{st:[0 none,1 available,2 preferred per slot], pref: specialist index or -1}].
     wSlot / wSpec: penalty for a non-preferred slot / not the requested specialist.
     Seats are (specialist, slot) pairs. First the number of placed cases is maximised, then the penalty is minimised. Both methods are exact. */
  C.schedule = function (slots, specs, cases, wSlot, wSpec) {
    wSlot = wSlot == null ? 1 : wSlot; wSpec = wSpec == null ? 1 : wSpec;
    var seats = [], p, t, i, k;
    for (p = 0; p < specs.length; p++) for (t = 0; t < slots; t++) if (specs[p].avail[t]) seats.push({ p: p, t: t });
    function pen(i, s) { var c = cases[i]; if (!c.st[s.t]) return null; return (c.st[s.t] === 2 || !c.st.some(function (x) { return x === 2; }) ? 0 : wSlot) + (c.pref > -1 && c.pref !== s.p ? wSpec : 0); }
    var binding = specs.some(function (sp, pi) { var own = seats.filter(function (s) { return s.p === pi; }).length; return (sp.cap >= 0 ? sp.cap : Infinity) < Math.min(own, cases.length); });
    var out = [], method;
    for (i = 0; i < cases.length; i++) out.push(-1);
    if (!cases.length) return { seats: seats, assign: out, method: 'none', penalty: 0, placed: 0 };
    if (!binding) {
      method = 'hungarian';
      var BIG = 1e6, HUGE = 1e9, M = [];
      for (i = 0; i < cases.length; i++) { var row = []; for (k = 0; k < seats.length; k++) { var c0 = pen(i, seats[k]); row.push(c0 === null ? HUGE : c0); } for (k = 0; k < cases.length; k++) row.push(BIG); M.push(row); }
      var a = C.hungarian(M); for (i = 0; i < cases.length; i++) out[i] = a[i] < seats.length && M[i][a[i]] < BIG ? a[i] : -1;
    } else {
      method = 'flow';
      var nC = cases.length, nS = seats.length, nP = specs.length, S = 0, T = 1 + nC + nS + nP, F = new Flow(T + 1), edges = [];
      for (i = 0; i < nC; i++) F.add(S, 1 + i, 1, 0);
      for (i = 0; i < nC; i++) for (k = 0; k < nS; k++) { var c1 = pen(i, seats[k]); if (c1 !== null) edges.push({ i: i, k: k, e: F.add(1 + i, 1 + nC + k, 1, c1) }); }
      for (k = 0; k < nS; k++) F.add(1 + nC + k, 1 + nC + nS + seats[k].p, 1, 0);
      for (p = 0; p < nP; p++) F.add(1 + nC + nS + p, T, Math.max(0, specs[p].cap >= 0 ? specs[p].cap : nC), 0);
      F.run(S, T);
      edges.forEach(function (x) { if (x.e.cap === 0) out[x.i] = x.k; });
    }
    var total = 0, placed = 0, detail = [];
    for (i = 0; i < cases.length; i++) {
      if (out[i] < 0) { detail.push(null); continue; }
      var s = seats[out[i]], c = cases[i], hasPref = c.st.some(function (x) { return x === 2; });
      var d = { p: s.p, t: s.t, slotPref: c.st[s.t] === 2, hadSlotPref: hasPref, specAsked: c.pref > -1, specMet: c.pref === s.p, pen: pen(i, s) };
      total += d.pen; placed++; detail.push(d);
    }
    return { seats: seats, assign: out, detail: detail, method: method, penalty: total, placed: placed };
  };

  /* ---------- queueing: M/M/c ---------- */
  C.mmc = function (lam, mu, c) {
    var a = lam / mu, rho = a / c;
    if (!(lam > 0) || !(mu > 0) || !(c >= 1)) return null;
    if (rho >= 1) return { a: a, rho: rho, stable: false };
    var sum = 0, term = 1, k; for (k = 0; k < c; k++) { if (k > 0) term *= a / k; sum += term; }
    var last = term * a / c, p0 = 1 / (sum + last / (1 - rho)), pw = last / (1 - rho) * p0, lq = pw * rho / (1 - rho), wq = lq / lam;
    return { a: a, rho: rho, stable: true, p0: p0, pw: pw, lq: lq, wq: wq, w: wq + 1 / mu, l: lq + a, rate: c * mu - lam };
  };
  C.mmcTail = function (r, t) { return r.pw * Math.exp(-r.rate * t); };
  /* smallest c with mean wait <= target (same time unit as the rates) */
  C.mmcStaff = function (lam, mu, targetWq, max) {
    for (var c = Math.max(1, Math.floor(lam / mu) + 1); c <= (max || 200); c++) { var r = C.mmc(lam, mu, c); if (r && r.stable && r.wq <= targetWq + 1e-12) return c; }
    return null;
  };

  /* ---------- short-form assembly ---------- */
  /* items: [{area, disc, diff}], k items, mins: {area: minimum count}, diffLo/diffHi: optional bounds on the mean difficulty.
     Maximises the sum of disc. Branch and bound; exact unless the node limit is reached. */
  C.shortForm = function (items, k, mins, diffLo, diffHi, limit) {
    limit = limit || 2e6; mins = mins || {};
    var n = items.length, ord = items.map(function (x, i) { return i; }).sort(function (a, b) { return items[b].disc - items[a].disc || a - b; });
    var useDiff = typeof diffLo === 'number' || typeof diffHi === 'number', lo = typeof diffLo === 'number' ? diffLo * k : -Infinity, hi = typeof diffHi === 'number' ? diffHi * k : Infinity;
    var areas = Object.keys(mins).filter(function (a) { return mins[a] > 0; }), pre = [0], i, a;
    for (i = 0; i < n; i++) pre.push(pre[i] + items[ord[i]].disc);
    var sufA = [], sufMin = [], sufMax = [];
    for (i = 0; i <= n; i++) { sufA.push({}); sufMin.push(Infinity); sufMax.push(-Infinity); }
    for (i = n - 1; i >= 0; i--) { var it = items[ord[i]]; areas.forEach(function (ar) { sufA[i][ar] = (sufA[i + 1][ar] || 0) + (it.area === ar ? 1 : 0); }); sufMin[i] = Math.min(sufMin[i + 1], +it.diff || 0); sufMax[i] = Math.max(sufMax[i + 1], +it.diff || 0); }
    var best = -Infinity, bestSet = null, nodes = 0, cut = false, cur = [], cnt = {}, need = 0;
    areas.forEach(function (ar) { cnt[ar] = 0; need += mins[ar]; });
    if (k > n || need > k) return { ok: false, why: need > k ? 'mins' : 'k' };
    function dfs(pos, sum, dsum, need) {
      if (cut) return; if (++nodes > limit) { cut = true; return; }
      var left = k - cur.length;
      if (left === 0) { if (need === 0 && (!useDiff || (dsum >= lo - 1e-9 && dsum <= hi + 1e-9)) && sum > best + 1e-12) { best = sum; bestSet = cur.slice(); } return; }
      if (n - pos < left || need > left) return;
      if (sum + pre[pos + left] - pre[pos] <= best + 1e-12) return;
      for (var q = 0; q < areas.length; q++) if (mins[areas[q]] - cnt[areas[q]] > (sufA[pos][areas[q]] || 0)) return;
      if (useDiff && (dsum + left * sufMax[pos] < lo - 1e-9 || dsum + left * sufMin[pos] > hi + 1e-9)) return;
      var it = items[ord[pos]], ar = it.area, counts = cnt[ar] !== undefined && cnt[ar] < mins[ar];
      cur.push(ord[pos]); if (cnt[ar] !== undefined) cnt[ar]++;
      dfs(pos + 1, sum + it.disc, dsum + (+it.diff || 0), need - (counts ? 1 : 0));
      cur.pop(); if (cnt[ar] !== undefined) cnt[ar]--;
      dfs(pos + 1, sum, dsum, need);
    }
    dfs(0, 0, 0, need);
    if (!bestSet) return { ok: false, why: cut ? 'limit' : 'infeasible', nodes: nodes };
    var ds = 0; bestSet.forEach(function (x) { ds += +items[x].diff || 0; });
    return { ok: true, exact: !cut, set: bestSet.slice().sort(function (x, y) { return x - y; }), sum: best, meanDisc: best / k, meanDiff: ds / k, nodes: nodes };
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = C; else root.HubDecideCalc = C;
})(typeof window !== 'undefined' ? window : this);
