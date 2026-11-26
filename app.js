window.ACCT_APP='scales';
/* ===== Psychometrics engine (pure functions) ===== */
const PSY = (() => {
  const sum = a => a.reduce((s, v) => s + v, 0);
  const mean = a => a.length ? sum(a) / a.length : NaN;
  const variance = a => { const n = a.length; if (n < 2) return NaN; const m = mean(a); return sum(a.map(v => (v - m) ** 2)) / (n - 1); };
  const sd = a => Math.sqrt(variance(a));
  const cov = (x, y) => { const n = x.length, mx = mean(x), my = mean(y); let s = 0; for (let i = 0; i < n; i++) s += (x[i] - mx) * (y[i] - my); return s / (n - 1); };
  const pearson = (x, y) => { const c = cov(x, y), d = sd(x) * sd(y); return d ? c / d : NaN; };
  const col = (M, j) => M.map(r => r[j]);
  const rowSums = M => M.map(r => sum(r));
  const sorted = a => a.slice().sort((x, y) => x - y);
  const median = a => { const s = sorted(a), n = s.length; return n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2; };

  /* ---- special functions ---- */
  function lgamma(z) { const c = [0.99999999999980993, 676.5203681218851, -1259.1392167224028, 771.32342877765313, -176.61502916214059, 12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7]; if (z < 0.5) return Math.log(Math.PI / Math.sin(Math.PI * z)) - lgamma(1 - z); z -= 1; let x = c[0]; for (let i = 1; i < 9; i++) x += c[i] / (z + i); const t = z + 7.5; return 0.5 * Math.log(2 * Math.PI) + (z + 0.5) * Math.log(t) - t + Math.log(x); }
  function betacf(a, b, x) { const FP = 1e-300; let qab = a + b, qap = a + 1, qam = a - 1, c = 1, d = 1 - qab * x / qap; if (Math.abs(d) < FP) d = FP; d = 1 / d; let h = d; for (let m = 1; m <= 300; m++) { const m2 = 2 * m; let aa = m * (b - m) * x / ((qam + m2) * (a + m2)); d = 1 + aa * d; if (Math.abs(d) < FP) d = FP; c = 1 + aa / c; if (Math.abs(c) < FP) c = FP; d = 1 / d; h *= d * c; aa = -(a + m) * (qab + m) * x / ((a + m2) * (qap + m2)); d = 1 + aa * d; if (Math.abs(d) < FP) d = FP; c = 1 + aa / c; if (Math.abs(c) < FP) c = FP; d = 1 / d; const del = d * c; h *= del; if (Math.abs(del - 1) < 3e-14) break; } return h; }
  function ibeta(x, a, b) { if (x <= 0) return 0; if (x >= 1) return 1; const bt = Math.exp(lgamma(a + b) - lgamma(a) - lgamma(b) + a * Math.log(x) + b * Math.log(1 - x)); return x < (a + 1) / (a + b + 2) ? bt * betacf(a, b, x) / a : 1 - bt * betacf(b, a, 1 - x) / b; }
  const tP2 = (t, df) => ibeta(df / (df + t * t), df / 2, 0.5);
  function gammaP(a, x) { if (x <= 0) return 0; if (x < a + 1) { let ap = a, s = 1 / a, d = s; for (let i = 0; i < 500; i++) { ap++; d *= x / ap; s += d; if (Math.abs(d) < Math.abs(s) * 1e-14) break; } return s * Math.exp(-x + a * Math.log(x) - lgamma(a)); } let b = x + 1 - a, c = 1e300, d = 1 / b, h = d; for (let i = 1; i < 500; i++) { const an = -i * (i - a); b += 2; d = an * d + b; if (Math.abs(d) < 1e-300) d = 1e-300; c = b + an / c; if (Math.abs(c) < 1e-300) c = 1e-300; d = 1 / d; const del = d * c; h *= del; if (Math.abs(del - 1) < 1e-14) break; } return 1 - Math.exp(-x + a * Math.log(x) - lgamma(a)) * h; }
  const chiP = (x, df) => 1 - gammaP(df / 2, x / 2);
  function erf(x) { const s = Math.sign(x); x = Math.abs(x); const t = 1 / (1 + 0.3275911 * x); const y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x); return s * y; }
  const ncdf = z => 0.5 * (1 + erf(z / Math.SQRT2));
  function binomTail(n, k) { /* P(X >= k), p = .5 */ let s = 0; for (let i = k; i <= n; i++) s += Math.exp(lgamma(n + 1) - lgamma(i + 1) - lgamma(n - i + 1) - n * Math.LN2); return s; }
  const comb = (n, k) => Math.exp(lgamma(n + 1) - lgamma(k + 1) - lgamma(n - k + 1));

  /* ---- reliability ---- */
  function alphaFromVars(k, sumItemVar, totalVar) { return (k / (k - 1)) * (1 - sumItemVar / totalVar); }
  function itemStats(M) {
    const n = M.length, k = M[0].length, tot = rowSums(M), vt = variance(tot);
    const iv = [], im = [], isd = [], rit = [], aid = [];
    for (let j = 0; j < k; j++) {
      const c = col(M, j); im.push(mean(c)); iv.push(variance(c)); isd.push(sd(c));
      const rest = tot.map((t, i) => t - c[i]);
      rit.push(pearson(c, rest));
    }
    const sIV = sum(iv), alpha = alphaFromVars(k, sIV, vt);
    for (let j = 0; j < k; j++) {
      if (k < 3) { aid.push(NaN); continue; }
      const rest = tot.map((t, i) => t - M[i][j]);
      aid.push(alphaFromVars(k - 1, sIV - iv[j], variance(rest)));
    }
    return { n, k, total: tot, totalMean: mean(tot), totalVar: vt, totalSd: Math.sqrt(vt), itemMean: im, itemVar: iv, itemSd: isd, sumItemVar: sIV, rit, alphaIfDeleted: aid, alpha };
  }
  function kr20(M) {
    const k = M[0].length, tot = rowSums(M), vt = variance(tot);
    const p = []; for (let j = 0; j < k; j++) p.push(mean(col(M, j)));
    const spq = sum(p.map(x => x * (1 - x))), n = M.length, vp = vt * (n - 1) / n; /* p·q are population variances, so the total variance must be too */
    return { k, n, p, spq, totalVar: vp, value: (k / (k - 1)) * (1 - spq / vp), mean: mean(tot) };
  }
  const kr21 = (k, M, v) => (k / (k - 1)) * (1 - (M * (k - M)) / (k * v));
  const spearmanBrown = (r, factor = 2) => factor * r / (1 + (factor - 1) * r);
  const guttman = (v1, v2, vt) => 2 * (1 - (v1 + v2) / vt);
  function splitHalf(M, mode = 'oddeven') {
    const k = M[0].length;
    const A = [], Bi = [];
    for (let j = 0; j < k; j++) { const inA = mode === 'oddeven' ? j % 2 === 0 : j < Math.ceil(k / 2); (inA ? A : Bi).push(j); }
    const h1 = M.map(r => sum(A.map(j => r[j]))), h2 = M.map(r => sum(Bi.map(j => r[j]))), tot = h1.map((v, i) => v + h2[i]);
    const r = pearson(h1, h2), v1 = variance(h1), v2 = variance(h2), vt = variance(tot);
    return { A, B: Bi, r, sb: spearmanBrown(r), guttman: guttman(v1, v2, vt), v1, v2, vt };
  }
  function kappa(T) {
    const k = T.length, N = sum(T.map(r => sum(r)));
    let po = 0; for (let i = 0; i < k; i++) po += T[i][i]; po /= N;
    let pe = 0; for (let i = 0; i < k; i++) { const ri = sum(T[i]), ci = sum(T.map(r => r[i])); pe += (ri / N) * (ci / N); }
    return { N, po, pe, kappa: (po - pe) / (1 - pe) };
  }
  function omega(loadings) {
    const sl = sum(loadings), th = loadings.map(l => 1 - l * l), st = sum(th);
    const ave = mean(loadings.map(l => l * l));
    return { sl, sl2: sl * sl, theta: th, st, omega: sl * sl / (sl * sl + st), ave };
  }
  const sem = (s, r) => s * Math.sqrt(1 - r);

  /* ---- content validity ---- */
  const cvr = (ne, N) => (ne - N / 2) / (N / 2);
  const cvrModified = (big, mid, N) => (big + mid / 2 - N / 2) / (N / 2);
  const LAWSHE = { 5: .99, 6: .99, 7: .99, 8: .75, 9: .78, 10: .62, 11: .59, 12: .56, 13: .54, 14: .51, 15: .49, 20: .42, 25: .37, 30: .33, 35: .31, 40: .29 };
  function cvrCritical(N, alpha = 0.05) { /* Ayre & Scally (2014): exact one-tailed binomial */
    for (let ne = Math.ceil(N / 2); ne <= N; ne++) if (binomTail(N, ne) <= alpha) return { ne, cvr: cvr(ne, N) };
    return { ne: N, cvr: 1 };
  }
  function lawsheCritical(N) { if (LAWSHE[N]) return LAWSHE[N]; const ks = Object.keys(LAWSHE).map(Number); const lo = ks.filter(x => x < N).pop(), hi = ks.find(x => x > N); if (!lo) return .99; if (!hi) return LAWSHE[40]; return LAWSHE[lo] + (LAWSHE[hi] - LAWSHE[lo]) * (N - lo) / (hi - lo); }
  function cvi(R /* judges x items, 1..4 */) {
    const J = R.length, k = R[0].length, icvi = [], kstar = [];
    for (let j = 0; j < k; j++) {
      const A = R.filter(r => r[j] >= 3).length, ic = A / J; icvi.push(ic);
      const pc = comb(J, A) * Math.pow(0.5, J); kstar.push((ic - pc) / (1 - pc));
    }
    return { J, k, icvi, kstar, scviAve: mean(icvi), scviUA: icvi.filter(v => v === 1).length / k };
  }
  function aikenV(ratings, lo, c) { const n = ratings.length, S = sum(ratings.map(r => r - lo)); return { n, S, V: S / (n * (c - 1)) }; }

  /* ---- item analysis ---- */
  function extremeGroups(M, frac = 0.27) {
    const n = M.length, k = M[0].length, tot = rowSums(M);
    const idx = tot.map((t, i) => [t, i]).sort((a, b) => b[0] - a[0]);
    const g = Math.max(2, Math.round(n * frac));
    const hi = idx.slice(0, g).map(x => x[1]), lo = idx.slice(n - g).map(x => x[1]);
    const res = [];
    for (let j = 0; j < k; j++) {
      const a = hi.map(i => M[i][j]), b = lo.map(i => M[i][j]);
      const ma = mean(a), mb = mean(b), va = variance(a), vb = variance(b);
      const se = Math.sqrt(va / a.length + vb / b.length);
      const t = se ? (ma - mb) / se : (ma === mb ? 0 : Infinity);
      const df = se ? Math.pow(va / a.length + vb / b.length, 2) / (Math.pow(va / a.length, 2) / (a.length - 1) + Math.pow(vb / b.length, 2) / (b.length - 1)) : a.length + b.length - 2;
      res.push({ mHi: ma, mLo: mb, t, df, p: isFinite(t) ? tP2(t, df) : 0 });
    }
    return { g, items: res };
  }
  function difficultyDiscrimination(M, frac = 0.27) { /* binary */
    const n = M.length, k = M[0].length, tot = rowSums(M);
    const idx = tot.map((t, i) => [t, i]).sort((a, b) => b[0] - a[0]);
    const g = Math.max(1, Math.round(n * frac));
    const hi = idx.slice(0, g).map(x => x[1]), lo = idx.slice(n - g).map(x => x[1]);
    const out = [];
    for (let j = 0; j < k; j++) {
      const p = mean(col(M, j)), U = sum(hi.map(i => M[i][j])), L = sum(lo.map(i => M[i][j]));
      const rest = tot.map((t, i) => t - M[i][j]);
      out.push({ p, U, L, D: (U - L) / g, rpb: pearson(col(M, j), rest) });
    }
    return { g, items: out };
  }

  /* ---- scores ---- */
  const zScore = (x, m, s) => (x - m) / s;
  const tScore = z => 50 + 10 * z;
  function percentileRank(arr, x) { const n = arr.length; const below = arr.filter(v => v < x).length, eq = arr.filter(v => v === x).length; return 100 * (below + 0.5 * eq) / n; }
  function skewKurt(a) {
    const n = a.length, m = mean(a), s = sd(a);
    const sk = n > 2 && s ? n / ((n - 1) * (n - 2)) * sum(a.map(v => ((v - m) / s) ** 3)) : NaN;
    const ku = n > 3 && s ? n * (n + 1) / ((n - 1) * (n - 2) * (n - 3)) * sum(a.map(v => ((v - m) / s) ** 4)) - 3 * (n - 1) ** 2 / ((n - 2) * (n - 3)) : NaN;
    const ses = Math.sqrt(6 * n * (n - 1) / ((n - 2) * (n + 1) * (n + 3)));
    const sek = 2 * ses * Math.sqrt((n * n - 1) / ((n - 3) * (n + 5)));
    return { skew: sk, kurt: ku, seSkew: ses, seKurt: sek };
  }
  function levels(min, max, nLevels) { const w = (max - min) / nLevels; const out = []; for (let i = 0; i < nLevels; i++) out.push([min + i * w, min + (i + 1) * w]); return { width: w, ranges: out }; }

  /* ---- DIF ---- */
  function mantelHaenszel(strata /* [{a,b,c,d}] a=ref correct b=ref wrong c=focal correct d=focal wrong */) {
    let num = 0, den = 0, A = 0, EA = 0, VA = 0;
    strata.forEach(s => {
      const N = s.a + s.b + s.c + s.d; if (N < 2) return;
      num += s.a * s.d / N; den += s.b * s.c / N;
      const nR = s.a + s.b, nF = s.c + s.d, m1 = s.a + s.c, m0 = s.b + s.d;
      A += s.a; EA += nR * m1 / N; VA += nR * nF * m1 * m0 / (N * N * (N - 1));
    });
    const alphaMH = num / den, delta = -2.35 * Math.log(alphaMH);
    const chi = VA ? Math.pow(Math.abs(A - EA) - 0.5, 2) / VA : NaN;
    const p = chiP(chi, 1);
    const ad = Math.abs(delta);
    const cls = (ad < 1 || p >= 0.05) ? 'A' : ad >= 1.5 ? 'C' : 'B';
    return { alphaMH, delta, chi, p, cls };
  }

  /* ---- matrix / factor analysis ---- */
  function corrMatrix(M) { const k = M[0].length, C = []; const cols = []; for (let j = 0; j < k; j++) cols.push(col(M, j)); for (let i = 0; i < k; i++) { C.push([]); for (let j = 0; j < k; j++) C[i].push(i === j ? 1 : pearson(cols[i], cols[j])); } return C; }
  function jacobiEigen(A0) {
    const n = A0.length, A = A0.map(r => r.slice()), V = A0.map((r, i) => r.map((_, j) => i === j ? 1 : 0));
    for (let sweep = 0; sweep < 100; sweep++) {
      let off = 0; for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) off += A[i][j] * A[i][j];
      if (off < 1e-18) break;
      for (let p = 0; p < n; p++) for (let q = p + 1; q < n; q++) {
        if (Math.abs(A[p][q]) < 1e-15) continue;
        const th = (A[q][q] - A[p][p]) / (2 * A[p][q]);
        const t = Math.sign(th || 1) / (Math.abs(th) + Math.sqrt(th * th + 1));
        const c = 1 / Math.sqrt(t * t + 1), s = t * c;
        for (let k = 0; k < n; k++) { const akp = A[k][p], akq = A[k][q]; A[k][p] = c * akp - s * akq; A[k][q] = s * akp + c * akq; }
        for (let k = 0; k < n; k++) { const apk = A[p][k], aqk = A[q][k]; A[p][k] = c * apk - s * aqk; A[q][k] = s * apk + c * aqk; }
        for (let k = 0; k < n; k++) { const vkp = V[k][p], vkq = V[k][q]; V[k][p] = c * vkp - s * vkq; V[k][q] = s * vkp + c * vkq; }
      }
    }
    const vals = A.map((r, i) => r[i]);
    const order = vals.map((v, i) => [v, i]).sort((a, b) => b[0] - a[0]);
    return { values: order.map(o => o[0]), vectors: order.map(o => V.map(r => r[o[1]])) };
  }
  function inverse(A0) {
    const n = A0.length, A = A0.map((r, i) => r.concat(r.map((_, j) => i === j ? 1 : 0)));
    for (let c = 0; c < n; c++) {
      let piv = c; for (let r = c + 1; r < n; r++) if (Math.abs(A[r][c]) > Math.abs(A[piv][c])) piv = r;
      if (Math.abs(A[piv][c]) < 1e-12) return null;
      [A[c], A[piv]] = [A[piv], A[c]];
      const d = A[c][c]; for (let j = 0; j < 2 * n; j++) A[c][j] /= d;
      for (let r = 0; r < n; r++) if (r !== c) { const f = A[r][c]; if (f) for (let j = 0; j < 2 * n; j++) A[r][j] -= f * A[c][j]; }
    }
    return A.map(r => r.slice(n));
  }
  function logDet(A) { const e = jacobiEigen(A).values; return e.every(v => v > 0) ? sum(e.map(Math.log)) : NaN; }
  function kmo(R) {
    const Ri = inverse(R); if (!Ri) return null; const k = R.length;
    let r2 = 0, p2 = 0; const msa = [];
    for (let i = 0; i < k; i++) {
      let ri = 0, pi = 0;
      for (let j = 0; j < k; j++) if (i !== j) { const pij = -Ri[i][j] / Math.sqrt(Ri[i][i] * Ri[j][j]); ri += R[i][j] ** 2; pi += pij ** 2; }
      r2 += ri; p2 += pi; msa.push(ri / (ri + pi));
    }
    return { kmo: r2 / (r2 + p2), msa };
  }
  function bartlett(R, n) { const p = R.length, ld = logDet(R); const chi = -(n - 1 - (2 * p + 5) / 6) * ld; const df = p * (p - 1) / 2; return { chi, df, p: chiP(chi, df) }; }
  function rng(seed) { let s = seed >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
  function parallelAnalysis(n, p, reps = 40, seed = 7) {
    const r = rng(seed), all = [];
    const gauss = () => { let u = 0, v = 0; while (u === 0) u = r(); v = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };
    for (let t = 0; t < reps; t++) { const X = []; for (let i = 0; i < n; i++) { const row = []; for (let j = 0; j < p; j++) row.push(gauss()); X.push(row); } all.push(jacobiEigen(corrMatrix(X)).values); }
    const meanEig = [], p95 = [];
    for (let j = 0; j < p; j++) { const v = sorted(all.map(e => e[j])); meanEig.push(mean(v)); p95.push(v[Math.min(v.length - 1, Math.floor(0.95 * v.length))]); }
    return { meanEig, p95 };
  }
  function varimax(L0, maxIt = 100) {
    const p = L0.length, m = L0[0].length; if (m < 2) return L0.map(r => r.slice());
    const h = L0.map(r => Math.sqrt(sum(r.map(x => x * x))) || 1);
    let L = L0.map((r, i) => r.map(x => x / h[i]));
    for (let it = 0; it < maxIt; it++) {
      let changed = 0;
      for (let a = 0; a < m - 1; a++) for (let b = a + 1; b < m; b++) {
        let A = 0, B = 0, C = 0, D = 0;
        for (let i = 0; i < p; i++) { const x = L[i][a], y = L[i][b], u = x * x - y * y, v = 2 * x * y; A += u; B += v; C += u * u - v * v; D += 2 * u * v; }
        const num = D - 2 * A * B / p, den = C - (A * A - B * B) / p;
        const phi = Math.atan2(num, den) / 4;
        if (Math.abs(phi) > 1e-7) { changed++; const c = Math.cos(phi), s = Math.sin(phi); for (let i = 0; i < p; i++) { const x = L[i][a], y = L[i][b]; L[i][a] = c * x + s * y; L[i][b] = -s * x + c * y; } }
      }
      if (!changed) break;
    }
    return L.map((r, i) => r.map(x => x * h[i]));
  }
  function efa(M, nf) {
    const R = corrMatrix(M), e = jacobiEigen(R), p = R.length;
    const m = nf || Math.max(1, e.values.filter(v => v > 1).length);
    const L = []; for (let i = 0; i < p; i++) { const row = []; for (let f = 0; f < m; f++) row.push(e.vectors[f][i] * Math.sqrt(Math.max(0, e.values[f]))); L.push(row); }
    for (let f = 0; f < m; f++) { const s = sum(L.map(r => r[f])); if (s < 0) L.forEach(r => r[f] = -r[f]); }
    const rot = varimax(L);
    const varExp = e.values.map(v => v / p * 100);
    return { R, eigen: e.values, varExp, nf: m, loadings: L, rotated: rot };
  }

  /* ---- descriptive helpers ---- */
  function describe(a) { const s = sorted(a); return { n: a.length, mean: mean(a), sd: sd(a), min: s[0], max: s[s.length - 1], median: median(a), ...skewKurt(a) }; }

  return { sum, mean, variance, sd, cov, pearson, median, sorted, col, rowSums, tP2, chiP, ncdf, ibeta, lgamma,
    alphaFromVars, itemStats, kr20, kr21, spearmanBrown, guttman, splitHalf, kappa, omega, sem,
    cvr, cvrModified, cvrCritical, lawsheCritical, cvi, aikenV, extremeGroups, difficultyDiscrimination,
    zScore, tScore, percentileRank, skewKurt, levels, mantelHaenszel, corrMatrix, jacobiEigen, inverse, kmo, bartlett, parallelAnalysis, varimax, efa, describe };
})();
if (typeof module !== 'undefined') module.exports = PSY;

/* ===== Core: environment, state, shell, router, helpers, gamification ===== */
"use strict";
const C = JSON.parse(document.getElementById('content').textContent);
const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fmt = (x, d = 2) => { if (x == null || !isFinite(x)) return '—'; let s = (Math.abs(x) < 1e-12 ? 0 : x).toFixed(d); return s === '-0.00' ? '0.00' : s; };
const fmtp = p => p < 0.001 ? '< .001' : fmt(p, 3).replace(/^0/, '');
const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.random() * (i + 1) | 0; [a[i], a[j]] = [a[j], a[i]]; } return a; };
const pick = (a, n) => shuffle(a).slice(0, n);
const uid = (p = '') => p + Math.random().toString(36).slice(2, 8) + Date.now().toString(36).slice(-4);
const today = () => { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
const dayDiff = (a, b) => Math.round((new Date(b + 'T12:00') - new Date(a + 'T12:00')) / 864e5);
const toNum = s => Number(String(s).replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d)).replace(/٫/g, '.').replace(/,/g, '.'));
function parseNums(s) { return String(s).replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d)).replace(/[،؛]/g, ',').replace(/٫/g, '.').split(/[\s,;]+/).filter(Boolean).map(Number).filter(v => isFinite(v)); }
function parseMatrix(s) {
  const lines = String(s).replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d)).replace(/٫/g, '.').split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  let head = null; const rows = [];
  lines.forEach((l, i) => {
    const cells = l.split(/[\t,;،]+|\s+/).filter(x => x !== '');
    const nums = cells.map(Number);
    if (nums.some(v => !isFinite(v))) { if (i === 0) head = cells; return; }
    rows.push(nums);
  });
  if (!rows.length) return { error: 'لم أجد صفوفًا رقمية. ضع كل مستجيب في سطر، وافصل بين الدرجات بمسافة أو فاصلة.' };
  const k = rows[0].length;
  if (rows.some(r => r.length !== k)) return { error: 'عدد القيم غير متساوٍ في كل الصفوف. تأكد أن كل سطر فيه درجات جميع العبارات.' };
  return { rows, k, n: rows.length, head };
}

const ICON = {
  heart: '<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/>',
  home: '<path d="M3 11 12 4l9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
  book: '<path d="M4 4h6a3 3 0 0 1 3 3v13a2 2 0 0 0-2-2H4zM20 4h-6a3 3 0 0 0-3 3v13a2 2 0 0 1 2-2h7z"/>',
  flask: '<path d="M9 3h6M10 3v6l-5 9a2 2 0 0 0 1.8 3h10.4a2 2 0 0 0 1.8-3l-5-9V3"/><path d="M7.5 15h9"/>',
  build: '<path d="M4 20h16M6 16V9l6-5 6 5v7"/><path d="M10 16v-4h4v4"/>',
  sigma: '<path d="M18 4H6l6 8-6 8h12"/>',
  cards: '<rect x="3" y="6" width="14" height="14" rx="2"/><path d="M7 3h12a2 2 0 0 1 2 2v12"/>',
  trophy: '<path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0z"/><path d="M17 5h3v2a3 3 0 0 1-3 3M7 5H4v2a3 3 0 0 0 3 3"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>',
  moon: '<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/>',
  more: '<circle cx="5" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="19" cy="12" r="1.6"/>',
  check: '<path d="m5 12 5 5 9-10"/>', x: '<path d="M6 6l12 12M18 6 6 18"/>', back: '<path d="m9 6 6 6-6 6"/>',
  fire: '<path d="M12 2c1 4 5 5.5 5 10.5A5 5 0 0 1 7 12.5c0-2 1-3.5 2-4.5 0 2 1 3 2 3 0-3-1-5 1-9z" fill="currentColor" stroke="none"/>',
  star: '<path d="m12 2 3 6.5 7 .8-5.2 4.8 1.5 7L12 17.6 5.7 21l1.5-7L2 9.3l7-.8z" fill="currentColor" stroke="none"/>',
  bolt: '<path d="M13 2 4 14h7l-1 8 9-12h-7z" fill="currentColor" stroke="none"/>',
  copy: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3"/>',
  download: '<path d="M12 3v12m0 0-5-5m5 5 5-5M4 21h16"/>', plus: '<path d="M12 5v14M5 12h14"/>', trash: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>',
  chart: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>', form: '<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 8h8M8 12h8M8 16h5"/>',
  link: '<path d="M10 14a4 4 0 0 0 6 0l3-3a4 4 0 0 0-6-6l-1 1M14 10a4 4 0 0 0-6 0l-3 3a4 4 0 0 0 6 6l1-1"/>',
  lock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>', play: '<path d="M7 4v16l13-8z"/>',
  timer: '<circle cx="12" cy="13" r="8"/><path d="M12 9v4l2 2M9 2h6"/>', redo: '<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/>',
  match: '<rect x="3" y="4" width="7" height="6" rx="1.5"/><rect x="14" y="14" width="7" height="6" rx="1.5"/><path d="M10 7h4a3 3 0 0 1 3 3v4"/>',
  calc: '<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M8 7h8M8 11h2M12 11h2M16 11v6M8 15h2M12 15h2"/>',
  shield: '<path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6z"/>', users: '<circle cx="9" cy="8" r="3.5"/><path d="M2 20a7 7 0 0 1 14 0M16 4.5a3.5 3.5 0 0 1 0 7M18 13.5a6 6 0 0 1 4 6.5"/>',
  upload: '<path d="M12 21V9m0 0-5 5m5-5 5 5M4 3h16"/>', eye: '<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  whats: '<path d="M4 20l1.5-4A8 8 0 1 1 8 18.5z"/>', gear: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>'
};
const ic = (n, cls = '') => `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICON[n] || ''}</svg>`;

/* ---------- storage ---------- */
const LS = { get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } }, set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { } } };
const KEY = 'scaleslab-v2';
const RANKS = [[0, 'مساعد باحث'], [150, 'باحث مبتدئ'], [400, 'باحث'], [800, 'باحث أول'], [1400, 'خبير قياس'], [2200, 'محكّم مقاييس'], [3200, 'عالِم قياس نفسي']];
function fresh() { return { v: 2, xp: 0, streak: 0, best: 0, last: null, goal: 40, hist: {}, read: {}, quiz: {}, cards: {}, miss: [], badges: [], quests: null, correct: 0, answered: 0, perfect: 0, labs: {}, probs: 0, matches: 0, fs: 1, theme: '', name: '', updated: 0 }; }
let S = Object.assign(fresh(), LS.get(KEY, {}));
const Cloud = { push: null }; /* set by account layer */
let saveT = null;
function save() { S.updated = Date.now(); LS.set(KEY, S); clearTimeout(saveT); if (Cloud.push) saveT = setTimeout(() => Cloud.push(S), 1500); }

/* ---------- gamification ---------- */
const rankOf = xp => { let r = RANKS[0], nx = null; RANKS.forEach((x, i) => { if (xp >= x[0]) { r = x; nx = RANKS[i + 1] || null; } }); return { name: r[1], min: r[0], next: nx }; };
const QPOOL = [
  { k: 'xp', n: 30, t: 'اجمع 30 نقطة' }, { k: 'read', n: 2, t: 'أنهِ درسين' }, { k: 'quiz', n: 1, t: 'أنهِ اختبار جزء' },
  { k: 'lab', n: 1, t: 'استخدم معملًا حسابيًا' }, { k: 'cards', n: 10, t: 'راجع 10 بطاقات' }, { k: 'items', n: 5, t: 'أضف 5 عبارات لمقياسك' }, { k: 'prob', n: 3, t: 'حل 3 مسائل حسابية' }];
function tick() {
  const t = today();
  if (S.last && S.last !== t && dayDiff(S.last, t) > 1) S.streak = 0;
  if (!S.quests || S.quests.day !== t) {
    let x = (t.split('-').join('') | 0) % 9973; const chosen = [];
    while (chosen.length < 3) { x = (x * 9301 + 49297) % 233280; const q = QPOOL[x % QPOOL.length]; if (!chosen.some(c => c.k === q.k)) chosen.push(Object.assign({ p: 0, done: false }, q)); }
    S.quests = { day: t, list: chosen };
  }
}
function quest(k, amt = 1) { if (!S.quests) return; S.quests.list.forEach(q => { if (q.k !== k || q.done) return; q.p += amt; if (q.p >= q.n) { q.done = true; S.xp += 10; toast('أنجزت مهمة اليوم: ' + q.t + ' (+10)'); } }); }
function addXP(n) {
  if (typeof MOTION !== 'undefined') MOTION.xp(n);
  const t = today(); S.xp += n; S.hist[t] = (S.hist[t] || 0) + n; quest('xp', n);
  if (S.last !== t) { S.streak = (S.last && dayDiff(S.last, t) === 1) ? S.streak + 1 : 1; S.last = t; S.best = Math.max(S.best, S.streak); if (S.streak > 1) toast('سلسلتك الآن ' + S.streak + ' أيام متتالية'); }
  checkBadges(); save(); renderStats();
}
const BADGES = [
  { id: 'first', t: 'أول درس', d: 'أنهِ أول درس', f: () => Object.keys(S.read).length >= 1 },
  { id: 'quiz1', t: 'أول اختبار', d: 'أنهِ اختبار جزء', f: () => Object.keys(S.quiz).length >= 1 },
  { id: 'lab1', t: 'أول معمل', d: 'احسب أول نتيجة في المعامل', f: () => Object.keys(S.labs).length >= 1 },
  { id: 'lab6', t: 'متمكن من المعادلات', d: 'استخدم 6 معامل مختلفة', f: () => Object.keys(S.labs).length >= 6 },
  { id: 'scale1', t: 'باني المقاييس', d: 'أنشئ أول مقياس', f: () => (typeof SCALES !== 'undefined') && SCALES.list().length >= 1 },
  { id: 'resp30', t: 'جامع البيانات', d: 'اجمع 30 استجابة لمقياسك', f: () => (typeof SCALES !== 'undefined') && SCALES.list().some(s => (s.responses || []).length >= 30) },
  { id: 's3', t: 'ثلاثة أيام', d: 'سلسلة 3 أيام', f: () => S.best >= 3 },
  { id: 's7', t: 'أسبوع بحثي', d: 'سلسلة 7 أيام', f: () => S.best >= 7 },
  { id: 'perfect', t: 'ثبات تام', d: 'اختبار كامل بلا أخطاء', f: () => S.perfect >= 1 },
  { id: 'c100', t: 'مئة إجابة صحيحة', d: '100 إجابة صحيحة', f: () => S.correct >= 100 },
  { id: 'prob10', t: 'حاسب ماهر', d: 'حل 10 مسائل حسابية', f: () => S.probs >= 10 },
  { id: 'half', t: 'نصف الطريق', d: 'أنهِ نصف الأجزاء', f: () => LEARN.doneCount() >= LEARN.total() / 2 },
  { id: 'all', t: 'عالِم قياس', d: 'أنهِ كل الأجزاء', f: () => LEARN.doneCount() >= LEARN.total() },
  { id: 'acct', t: 'عضو مسجل', d: 'أنشئ حسابًا لحفظ تقدمك', f: () => !!(window.ACCT && ACCT.signedIn()) }
];
function checkBadges() { BADGES.forEach(b => { if (!S.badges.includes(b.id) && b.f()) { S.badges.push(b.id); S.xp += 15; if (typeof MOTION !== 'undefined') setTimeout(() => MOTION.stamp('وسام: ' + b.t), 250); setTimeout(() => toast('وسام جديد: ' + b.t + ' (+15)'), 300); } }); }
function labUse(k) { const first = !S.labs[k]; S.labs[k] = (S.labs[k] || 0) + 1; quest('lab', 1); if (first) addXP(5); else save(); }

/* ---------- UI helpers ---------- */
let toastT; function toast(m) { const t = $('#toast'); t.textContent = m; t.hidden = false; clearTimeout(toastT); toastT = setTimeout(() => t.hidden = true, 2600); }
function modal(html, onMount) {
  const bg = document.createElement('div'); bg.className = 'modal-bg'; bg.setAttribute('data-lenis-prevent', ''); bg.innerHTML = `<div class="modal" role="dialog" aria-modal="true">${html}</div>`;
  document.body.appendChild(bg);
  const close = () => { bg.remove(); document.removeEventListener('keydown', onKey); };
  const onKey = e => { if (e.key === 'Escape') close(); };
  document.addEventListener('keydown', onKey);
  bg.addEventListener('click', e => { if (e.target === bg) close(); });
  $$('[data-close]', bg).forEach(b => b.onclick = close);
  onMount && onMount(bg, close);
  if (typeof MOTION !== 'undefined' && MOTION.on) gsap.from($('.modal', bg), { y: 24, autoAlpha: 0, scale: 0.97, duration: 0.32, ease: 'power3.out' });
  const f = $('input,textarea,button', bg); f && f.focus();
  return close;
}
function confirmBox(msg, yes, onYes) { modal(`<h3>تأكيد</h3><p>${esc(msg)}</p><div class="row"><button class="btn danger" id="cfY">${esc(yes)}</button><button class="btn ghost" data-close>إلغاء</button></div>`, (bg, close) => { $('#cfY', bg).onclick = () => { close(); onYes(); }; }); }
async function copyText(text) {
  try { await navigator.clipboard.writeText(text); toast('نُسخ'); return true; } catch (e) { }
  modal(`<h3>انسخ النص</h3><p class="muted small">حدّد النص ثم انسخه.</p><textarea id="cpTa" class="data" readonly></textarea><div class="row" style="margin-top:8px"><button class="btn" data-close>تم</button></div>`, bg => { const ta = $('#cpTa', bg); ta.value = text; ta.focus(); ta.select(); });
  return false;
}
async function downloadFile(name, text, mime = 'text/plain;charset=utf-8') {
  if (ENV.claude) {
    try { const dl = await window.claude.use('downloads'); if (dl) { await dl.save({ filename: name, data: text }); return; } } catch (e) { }
    return copyText(text);
  }
  try { const blob = new Blob([(/\.(csv|txt)$/i.test(name) ? '﻿' : '') + text], { type: mime }); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500); }
  catch (e) { copyText(text); }
}
function ring(pct, label, sub) { const R = 42, Cc = 2 * Math.PI * R; return `<div class="ring" role="img" aria-label="${esc(sub)}"><svg viewBox="0 0 96 96"><circle cx="48" cy="48" r="${R}" fill="none" stroke="var(--surface-2)" stroke-width="9"/><circle cx="48" cy="48" r="${R}" fill="none" stroke="var(--amber)" stroke-width="9" stroke-linecap="round" stroke-dasharray="${Cc}" stroke-dashoffset="${Cc * (1 - Math.min(1, pct))}"/></svg><div class="c"><div><b>${label}</b><small>${esc(sub)}</small></div></div></div>`; }
const frac = (a, b) => `<span class="fr"><span>${a}</span><span>${b}</span></span>`;
function tableHTML(head, rows, cls = '') { return `<div class="tw"><table class="${cls}"><thead><tr>${head.map(h => `<th>${h}</th>`).join('')}</tr></thead><tbody>${rows.map(r => `<tr${r.cls ? ` class="${r.cls}"` : ''}>${(r.cells || r).map(c => `<td${typeof c === 'object' && c && c.n ? ' class="n"' : ''}>${typeof c === 'object' && c ? c.v : c}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`; }
const N = (v, d = 2) => ({ n: 1, v: typeof v === 'number' ? fmt(v, d) : v });
function relVerdict(r) { if (!isFinite(r)) return ['bad', 'غير قابل للحساب']; if (r >= 0.9) return ['good', 'ممتاز (≥ 0.90)']; if (r >= 0.8) return ['good', 'جيد (0.80–0.89)']; if (r >= 0.7) return ['warn', 'مقبول للبحث (0.70–0.79)']; return ['bad', 'ضعيف (أقل من 0.70)']; }
function barSVG(vals, labels, opts = {}) {
  const W = 560, H = opts.h || 180, P = 26, n = vals.length, mx = Math.max(opts.max || 0, ...vals.map(v => Math.abs(v))) || 1, bw = (W - 2 * P) / n;
  let g = `<line x1="${P}" y1="${H - P}" x2="${W - P}" y2="${H - P}" stroke="var(--line)"/>`;
  if (opts.ref != null) { const y = H - P - (H - 2 * P) * opts.ref / mx; g += `<line x1="${P}" x2="${W - P}" y1="${y}" y2="${y}" stroke="var(--amber)" stroke-dasharray="4 4"/><text x="${W - P}" y="${y - 4}" text-anchor="end">${esc(opts.refLabel || '')}</text>`; }
  vals.forEach((v, i) => { const h = (H - 2 * P) * Math.max(0, v) / mx, x = P + i * bw; g += `<g><title>${esc(labels[i])}: ${fmt(v, opts.d ?? 2)}</title><rect x="${x + 2}" y="${H - P - h}" width="${Math.max(2, bw - 4)}" height="${h}" rx="3" fill="${opts.color ? opts.color(v, i) : 'var(--primary)'}"/></g>`; if (n <= 30) g += `<text x="${x + bw / 2}" y="${H - P + 14}" text-anchor="middle">${esc(labels[i])}</text>`; });
  if (opts.line) { const pts = opts.line.map((v, i) => `${P + i * bw + bw / 2},${H - P - (H - 2 * P) * Math.max(0, v) / mx}`).join(' '); g += `<polyline points="${pts}" fill="none" stroke="var(--amber)" stroke-width="2" stroke-dasharray="5 4"/>`; }
  return `<div class="chart"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(opts.label || 'رسم بياني')}">${g}</svg></div>`;
}
function histSVG(arr) {
  if (!arr.length) return '';
  const s = PSY.sorted(arr), mn = s[0], mx = s[s.length - 1], k = Math.max(5, Math.min(12, Math.ceil(1 + 3.322 * Math.log10(arr.length))));
  const w = (mx - mn) / k || 1, bins = Array(k).fill(0); arr.forEach(v => bins[Math.min(k - 1, Math.floor((v - mn) / w))]++);
  return barSVG(bins, bins.map((_, i) => fmt(mn + i * w, 0)), { d: 0, label: 'توزيع الدرجات الكلية' });
}

/* ---------- environment ---------- */
const ENV = { claude: !!(window.claude && typeof window.claude.use === 'function') };
ENV.web = !ENV.claude;

/* ---------- shell & router ---------- */
const NAV = [
  ['home', 'الرئيسية', 'home'], ['know', 'اعرف نفسك', 'heart'], ['tests', 'مكتبة الاختبارات', 'check'], ['learn', 'الدروس', 'book'], ['labs', 'المعامل', 'flask'], ['build', 'ابنِ مقياسك', 'build'], ['exam', 'أسئلة موضوعية', 'check'], ['bank', 'بنك الأسئلة', 'cards'],
  ['formulas', 'المعادلات', 'sigma'], ['laws', 'القوانين الإحصائية', 'sigma'], ['practice', 'التدريب', 'cards'], ['neuro', 'المختبر العصبي', 'flask'], ['respond', 'أجب عن مقياس', 'form'], ['schedules', 'جداول التعزيز', 'trophy'], ['me', 'إنجازاتي', 'trophy'], ['account', 'حسابي', 'user'], ['admin', 'لوحة المسؤول', 'shield']
];
const LOGO_SVG = `<svg viewBox="0 0 40 40" aria-hidden="true"><defs><linearGradient id="lgS" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#7c5cff"/><stop offset="1" stop-color="#1f1452"/></linearGradient></defs><rect width="40" height="40" rx="11" fill="url(#lgS)"/><rect x="8.5" y="7" width="23" height="27" rx="3.4" fill="#fff"/><rect x="14.5" y="5" width="11" height="4.2" rx="1.6" fill="#bef264"/><circle cx="27" cy="13.5" r="2.3" fill="#65a30d" stroke="#65a30d" stroke-width="1.3"/><path d="M25.9 13.5 l.8 .8 1.5-1.6" stroke="#fff" stroke-width="1" fill="none" stroke-linecap="round" stroke-linejoin="round"/><rect x="12" y="12.4" width="11" height="2.2" rx="1.1" fill="#b9b0e8"/><circle cx="27" cy="20.1" r="2.3" fill="#65a30d" stroke="#65a30d" stroke-width="1.3"/><path d="M25.9 20.1 l.8 .8 1.5-1.6" stroke="#fff" stroke-width="1" fill="none" stroke-linecap="round" stroke-linejoin="round"/><rect x="15" y="19.0" width="8" height="2.2" rx="1.1" fill="#b9b0e8"/><circle cx="27" cy="26.7" r="2.3" fill="#fff" stroke="#7c5cff" stroke-width="1.3"/><rect x="13" y="25.599999999999998" width="10" height="2.2" rx="1.1" fill="#b9b0e8"/></svg>`;
const GUEST_SVG = `<svg viewBox="0 0 24 24" aria-hidden="true" fill="none"><circle cx="12" cy="9" r="3.6" fill="currentColor"/><path d="M5.2 19.2c1.3-3.1 3.9-4.7 6.8-4.7s5.5 1.6 6.8 4.7" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>`;
const avatarInner = nm => nm && nm.trim() ? esc(nm.trim()[0]) : GUEST_SVG;
const VIEWS = {};
/* Lazy chunks: route-specific code and lesson text load on first use (same pattern as laws.js). */
const CHUNKS = {};
function loadChunk(src) {
  return CHUNKS[src] || (CHUNKS[src] = new Promise((res, rej) => {
    const sc = document.createElement('script'); sc.src = src; sc.async = false;
    sc.onload = res; sc.onerror = () => { delete CHUNKS[src]; sc.parentNode && sc.parentNode.removeChild(sc); rej(new Error('load ' + src)); };
    document.head.appendChild(sc);
  }));
}
VIEWS.laws = el => {
  el.style.setProperty('--lw-accent', 'var(--violet)');
  const run = () => { if (el.isConnected) LAWS.render(el, { era: 5 }); };
  if (window.LAWS) return run();
  el.innerHTML = '<p class="muted">جارٍ تحميل القوانين…</p>';
  const sc = document.createElement('script'); sc.src = 'laws.js?v=cca56bd5';
  sc.onload = run; sc.onerror = () => { el.textContent = 'تعذر تحميل صفحة القوانين. تحقق من الاتصال وحدّث الصفحة.'; };
  document.head.appendChild(sc);
};
let current = 'home';
function shell() {
  $('#app').innerHTML = `
  <aside class="rail" aria-label="التنقل">
    <a class="brand" href="#home"><span class="logo">${LOGO_SVG}</span><span>مختبر المقاييس النفسية<small>تعلّم · احسب · ابنِ مقياسك</small></span></a>
    <nav>${NAV.slice(0, 10).map(n => `<button data-go="${n[0]}">${ic(n[2])}${n[1]}</button>`).join('')}<div class="navsep">أدوات أخرى</div>${NAV.slice(10).map(n => `<button data-go="${n[0]}">${ic(n[2])}${n[1]}</button>`).join('')}</nav>
    <div class="me" id="railMe"></div>
  </aside>
  <div class="col">
    <header class="topbar">
      <a class="brand" href="#home"><span class="logo">${LOGO_SVG}</span><span>مختبر المقاييس النفسية</span></a>
      <span class="pill fire" id="pStreak" title="أيام متتالية"></span><span class="pill xp" id="pXp" title="نقاطك"></span>
      <button class="ibtn" id="bSearch" aria-label="بحث">${ic('search')}</button>
      <button class="ibtn" id="bTheme" aria-label="تبديل الوضع الليلي">${ic('moon')}</button>
      <button class="avatar" id="bAcct" aria-label="حسابي"></button>
    </header>
    <main class="main" id="view" tabindex="-1"></main>
  </div>
  <nav class="tabbar" aria-label="التنقل السفلي">${[['home', 'الرئيسية', 'home'], ['learn', 'الدروس', 'book'], ['labs', 'المعامل', 'flask'], ['build', 'ابنِ مقياسك', 'build'], ['more', 'المزيد', 'more']].map(n => `<button data-go="${n[0]}">${ic(n[2])}${n[1]}</button>`).join('')}</nav>`;
  $$('[data-go]').forEach(b => b.onclick = () => b.dataset.go === 'more' ? moreSheet() : go(b.dataset.go));
  $('#bSearch').onclick = searchSheet;
  $('#bTheme').onclick = () => { const cur = document.documentElement.dataset.theme || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'); S.theme = cur === 'dark' ? 'light' : 'dark'; applyPrefs(); save(); };
  $('#bAcct').onclick = () => go('account');
}
function moreSheet() {
  modal(`<h3>المزيد</h3><div class="stack">${[['bank', 'بنك الأسئلة', 'cards', 'كل أسئلة المادة: بحث وتصفية واختبار سريع'], ['schedules', 'جداول التعزيز وكروت العلماء', 'trophy', 'جرّب FR وVR وFI وVI وشوف السجل التراكمي، وكروتك'], ['tests', 'مكتبة الاختبارات', 'check', 'شخصية، وتقدير ذات، وضغوط، وصمود، ووحدة، وانتباه، وذكاء: مصفوفات ومتسلسلات وتدوير ذهني'], ['know', 'اعرف نفسك', 'heart', 'رحلة بشكل لعبة: المزاج والذاكرة والتركيز والحالة النفسية وحياتك الرقمية'], ['neuro', 'المختبر العصبي (TRIBE v2)', 'flask', 'تماسك عبارات مقياسك وفق التنبؤ العصبي — استكشافي'], ['exam', 'أسئلة موضوعية', 'check', 'صح وخطأ، واختيار من متعدد، وامتحان تجريبي ونموذج محلول'], ['formulas', 'المعادلات', 'sigma', 'كل معادلات الصدق والثبات بأمثلة'], ['laws', 'القوانين الإحصائية', 'sigma', '65 قانونًا من القديم للحديث: من الوسط وت وتحليل التباين إلى SEM وبايز، بمسائل محلولة'], ['practice', 'التدريب', 'cards', 'بطاقات ومطابقة ومسائل حسابية'], ['respond', 'أجب عن مقياس', 'form', 'استخدم كود المقياس الذي أرسله الباحث'], ['me', 'إنجازاتي', 'trophy', 'النقاط والأوسمة والإعدادات'], ['account', 'حسابي', 'user', 'تسجيل الدخول وحفظ التقدم'], ['admin', 'لوحة المسؤول', 'shield', 'للمسؤول فقط: فتح وقفل المراحل ومتابعة النتائج']].map(n => `<button class="linkcard" data-m="${n[0]}"><span class="ic">${ic(n[2])}</span><span><b>${n[1]}</b><span>${n[3]}</span></span></button>`).join('')}</div><div class="row" style="margin-top:12px"><button class="btn ghost" data-close>إغلاق</button></div>`,
    (bg, close) => $$('[data-m]', bg).forEach(b => b.onclick = () => { close(); go(b.dataset.m); }));
}
function go(v) { if (v === 'labs' && typeof LABS !== 'undefined') LABS.clear(); if (v === 'learn' && typeof LEARN !== 'undefined') LEARN.clearOpen(); if (v === 'exam' && typeof EXAM !== 'undefined') EXAM.clear(); if (location.hash !== '#' + v) location.hash = v; else route(); }
function route() {
  tick();
  let h = (location.hash || '#home').slice(1);
  let arg = null;
  const m = h.match(/^form-([A-Za-z0-9]+)$/); if (m) { h = 'respond'; arg = m[1]; } const tk = h.match(/^take\/([A-Za-z0-9_-]+)$/); if (tk) { h = 'take'; arg = tk[1]; } if (/^laws\/\w+$/.test(h)) h = 'laws';
  if (!VIEWS[h]) h = 'home';
  current = h;
  $$('[data-go]').forEach(b => b.setAttribute('aria-current', b.dataset.go === h || (b.dataset.go === 'more' && ['qbuild', 'take', 'bank', 'know', 'tests', 'schedules', 'admin', 'neuro', 'exam', 'formulas', 'laws', 'practice', 'respond', 'me', 'account'].includes(h)) ? 'page' : 'false'));
  const v = $('#view'); v.innerHTML = '<div class="container" id="vc"></div>';
  if (typeof MOTION !== 'undefined') MOTION.scrollTop();
  VIEWS[h]($('#vc'), arg);
  if (typeof MOTION !== 'undefined' && !VIEWS[h].lazy) MOTION.page($('#vc'));
  renderStats();
  if (!routeKeepScroll) scrollTo(0, 0); routeKeepScroll = false;
}
let routeKeepScroll = false;
function rerender() { routeKeepScroll = true; route(); }
function renderStats() {
  const done = (S.hist[today()] || 0) > 0;
  $('#pStreak').innerHTML = ic('fire') + `<span class="num">${S.streak}</span>`; $('#pStreak').style.opacity = done ? 1 : .55;
  $('#pXp').innerHTML = ic('bolt') + `<span class="num">${S.xp}</span>`;
  const nm = (window.ACCT && ACCT.displayName()) || S.name || '';
  $('#bAcct').innerHTML = avatarInner(nm); $('#bAcct').classList.toggle('guest', !(nm && nm.trim()));
  const rk = rankOf(S.xp);
  const rm = $('#railMe'); if (rm) rm.innerHTML = `<div class="row" style="gap:8px"><span class="avatar${nm && nm.trim() ? '' : ' guest'}">${avatarInner(nm)}</span><div class="grow small"><b>${esc(nm || 'زائر')}</b><div class="muted">${esc(rk.name)}</div></div></div><div class="row small"><span class="pill xp">${ic('bolt')}<span class="num">${S.xp}</span></span><span class="pill fire">${ic('fire')}<span class="num">${S.streak}</span></span></div>${window.ACCT && !ACCT.signedIn() && ACCT.available() ? `<button class="btn sm soft" data-go2="account">احفظ تقدمك بحساب</button>` : ''}<div class="row"><button class="btn sm ghost" id="rTheme">${ic('moon')} الوضع</button><button class="btn sm ghost" id="rFs">أ± الخط</button></div>`;
  $$('[data-go2]').forEach(b => b.onclick = () => go(b.dataset.go2));
  const rt = $('#rTheme'); if (rt) rt.onclick = () => $('#bTheme').click();
  const rf = $('#rFs'); if (rf) rf.onclick = () => { S.fs = S.fs >= 1.2 ? 1 : +(S.fs + 0.1).toFixed(1); applyPrefs(); save(); };
}
function applyPrefs() { if (S.theme) document.documentElement.dataset.theme = S.theme; else delete document.documentElement.dataset.theme; document.documentElement.style.setProperty('--fs', S.fs || 1); }

/* ---------- search ---------- */
function searchSheet() {
  modal(`<h3>بحث في الموقع</h3><input id="sq" type="search" placeholder="مثال: ألفا، صدق المحتوى، راش" aria-label="كلمة البحث"><div id="sr" class="stack" style="margin-top:10px;max-height:60vh;overflow:auto"></div>`, (bg, close) => {
    const q = $('#sq', bg), out = $('#sr', bg);
    q.oninput = () => {
      const k = q.value.trim(); if (k.length < 2) { out.innerHTML = '<p class="muted small">اكتب حرفين على الأقل.</p>'; return; }
      const hits = [];
      if (LEARN.ready()) LEARN.parts().forEach(p => p.sections.forEach((s, si) => { const t = LEARN.text(s); const i = t.indexOf(k); if (i >= 0 || s.title.includes(k)) hits.push({ p, si, s, snip: i >= 0 ? t.slice(Math.max(0, i - 50), i + k.length + 70) : '' }); }));
      const g = C.glossary.filter(x => x.ar.includes(k) || x.en.toLowerCase().includes(k.toLowerCase())).slice(0, 5);
      const labs = LABS.list.filter(l => l.t.includes(k) || l.d.includes(k)).slice(0, 4);
      out.innerHTML = labs.map(l => `<button class="linkcard" data-lab="${l.id}"><span class="ic">${ic('flask')}</span><span><b>${esc(l.t)}</b><span>معمل حسابي</span></span></button>`).join('') +
        g.map(x => `<div class="card"><b>${esc(x.ar)}</b> <span class="ltr muted small">${esc(x.en)}</span><p class="small" style="margin:4px 0 0">${esc(x.d)}</p></div>`).join('') +
        hits.slice(0, 30).map((h, i) => `<button class="linkcard" data-hit="${i}"><span class="ic">${ic('book')}</span><span><b>${esc(h.s.title || h.p.title)}</b><span>${esc(h.p.title)}${h.snip ? ' — …' + esc(h.snip).replace(esc(k), `<mark>${esc(k)}</mark>`) + '…' : ''}</span></span></button>`).join('') || '<p class="muted">لا نتائج. جرّب كلمة أقصر.</p>';
      $$('[data-hit]', out).forEach(b => b.onclick = () => { const h = hits[+b.dataset.hit]; close(); LEARN.open(h.p.key, h.si); });
      $$('[data-lab]', out).forEach(b => b.onclick = () => { close(); LABS.open(b.dataset.lab); });
    };
    q.oninput();
    if (!LEARN.ready()) LEARN.ensure().then(() => { if (q.isConnected) q.oninput(); }, () => { });
  });
}

/* ---------- home ---------- */
const RULES12 = ['الوضوح المفاهيمي', 'المراجعة الأدبية', 'تحديد الأبعاد', 'جدول المواصفات', 'فيض الفقرات', 'جودة الصياغة', 'سلم الاستجابة', 'صدق المحتوى', 'التجريب الاستطلاعي', 'تحليل الفقرات', 'الثبات', 'الصدق العاملي والتقنين'];
function heroX(rk, nx) {
  const lo = (RANKS.filter(r => r[0] <= S.xp).pop() || RANKS[0])[0], hi = rk.next ? rk.next[0] : lo + 1, pct = rk.next ? Math.min(100, (S.xp - lo) / (hi - lo) * 100) : 100;
  const lvl = RANKS.filter(r => r[0] <= S.xp).length, nScales = (typeof SCALES !== 'undefined') ? SCALES.list().length : 0;
  return `<section class="hx" aria-labelledby="hxT"><div class="hx-in">
    <p class="hx-kick"><span class="chip lime">${ic('star')} ${esc(rk.name)}</span><span>المستوى <b class="num">${lvl}</b> من ${RANKS.length}</span></p>
    <h1 class="hx-title" id="hxT">قِسْ ما لا يُرى، وابنِ مقياسك بيدك</h1>
    <p class="hx-sub">دروس قصيرة، ومعامل تحسب الصدق والثبات في ثوانٍ، ومعالج يبني مقياسك ويجمع بياناته ويحللها. كل خطوة تكسبك نقاطًا وتقربك من رتبة «عالِم قياس نفسي».</p>
    <div class="hx-cta"><button class="btn lime magnet" id="hCont">${ic('play')}${S.xp ? 'تابع' : 'ابدأ'}: ${esc(nx.short)}</button><button class="btn glass magnet" data-go3="build">${ic('build')}ابنِ مقياسك</button><button class="btn glass" data-go3="exam">${ic('timer')}تحدّي الامتحان</button></div>
    <div class="hx-stats"><div><b class="num" data-count="${S.xp}">${S.xp}</b><small>نقطة</small></div><div><b class="num" data-count="${S.streak}">${S.streak}</b><small>يوم متتالٍ</small></div><div><b class="num" data-count="${LEARN.doneCount()}">${LEARN.doneCount()}</b><small>من ${LEARN.total()} دروس</small></div><div><b class="num" data-count="${nScales}">${nScales}</b><small>مقياس بنيته</small></div></div>
    <div class="ruler" aria-hidden="true">${Array.from({ length: 61 }, (_, i) => `<i class="${i % 10 === 0 ? 'l' : i % 5 === 0 ? 'm' : ''}"></i>`).join('')}<span class="needle" style="left:${100 - pct}%"><b class="num">${S.xp}</b></span></div>
    <p class="ruler-cap">${rk.next ? `باقٍ <b class="num">${hi - S.xp}</b> نقطة لتصبح «${esc(rk.next[1])}»` : 'وصلت إلى أعلى رتبة. أنت عالِم قياس!'}</p>
  </div>
  <aside class="hx-live" aria-label="مثال حي: كلما زادت الاستجابات المتسقة ارتفع معامل ألفا">
    <div class="lq-head"><b>مقياس التسويف الأكاديمي</b><span>ن = <b class="lq-n num">0</b></span></div>
    ${['أؤجل المذاكرة حتى الليلة السابقة للامتحان', 'أنشغل بالهاتف عندما أجلس للمذاكرة', 'أترك المهام الصعبة إلى آخر لحظة', 'أفاجأ بقرب موعد التسليم'].map(t => `<div class="lq-row"><span>${t}</span><div class="lq-dots">${[1, 2, 3, 4, 5].map(() => '<i class="lq-dot"></i>').join('')}</div></div>`).join('')}
    <div class="lq-gauge"><svg viewBox="0 0 120 70" aria-hidden="true"><path d="M10 62a50 50 0 0 1 100 0" class="lq-bg"/><path d="M10 62a50 50 0 0 1 100 0" class="lq-arc"/></svg><div><small>ثبات ألفا كرونباخ</small><b class="lq-a num">0.00</b><small class="lq-ok">≥ 0.70 مقبول</small></div></div>
  </aside></section>`;
}
function journeyX() {
  const lit = (typeof BUILD !== 'undefined' && BUILD.bestSteps) ? BUILD.bestSteps() : 0;
  const pos = i => { const row = i < 6 ? 0 : 1, k = row ? i - 6 : i; return [row ? 90 + k * 164 : 910 - k * 164, row ? 235 : 75]; };
  const pts = RULES12.map((_, i) => pos(i));
  let d = `M ${pts[0][0]} ${pts[0][1]}`; for (let i = 1; i < 12; i++) { const [x, y] = pts[i], [px, py] = pts[i - 1]; d += i === 6 ? ` C ${px - 120} ${py}, ${px - 120} ${y}, ${x} ${y}` : ` L ${x} ${y}`; }
  return `<section class="card journey"><div class="row"><h3 class="grow" style="margin:0">${ic('trophy')} رحلة الباحث: 12 مستوى</h3><span class="chip ${lit === 12 ? 'good' : 'lime'}">${lit}/12</span></div>
    <p class="small muted" style="margin:0">كل مستوى قاعدة من قواعد بناء المقياس. أكمل خطواته في «ابنِ مقياسك» لتضيء الخريطة.</p>
    <svg class="jmap" viewBox="0 0 1000 310" role="img" aria-label="أكملت ${lit} من 12 مستوى"><path class="trail-bg" d="${d}"/><path class="trail" d="${d}" style="--lit:${lit / 11}"/>${pts.map(([x, y], i) => `<g class="jn ${i < lit ? 'lit' : i === lit ? 'now' : ''}" transform="translate(${x} ${y})"><circle r="30"/><text class="n" y="9">${i < lit ? '✓' : i + 1}</text><text class="l" y="${y > 100 ? 62 : -44}">${RULES12[i]}</text></g>`).join('')}<g class="jtoken" transform="translate(${pts[0][0]} ${pts[0][1]})"><circle r="17" class="t1"/><circle r="9" class="t2"/></g></svg>
    <ol class="jlist">${RULES12.map((r, i) => `<li class="${i < lit ? 'lit' : i === lit ? 'now' : ''}"><span>${i < lit ? '✓' : i + 1}</span>${r}</li>`).join('')}</ol>
    <div class="row"><button class="btn soft sm" data-go3="build">${ic('build')} ${lit ? 'تابع رحلتك' : 'ابدأ المستوى الأول'}</button><button class="btn ghost sm" id="hRules2">اقرأ القواعد</button></div></section>`;
}
VIEWS.home = el => {
  const t = today(), tx = S.hist[t] || 0, rk = rankOf(S.xp), nx = LEARN.next();
  const acctNudge = window.ACCT && ACCT.available() && !ACCT.signedIn();
  el.innerHTML = `
  ${heroX(rk, nx)}
  ${(() => { let k = null; try { k = JSON.parse(localStorage.getItem('know-v1') || 'null'); } catch (e) { } const n = k && k.done ? Object.keys(k.done).length : 0; return n >= 8 ? '' : `<button class="linkcard" data-go3="know" style="--c:var(--coral);--s:var(--bad-soft)"><span class="ic">${ic('heart')}</span><span><b>${n ? 'كمّل رحلة «اعرف نفسك» (' + n + ' من 8)' : 'ابدأ هنا: رحلة «اعرف نفسك»'}</b><span>اختيارية، حوالي 15 دقيقة بشكل لعبة: المزاج، والذاكرة، والتركيز، والحالة النفسية، وحياتك الرقمية: ضغط التواجد الرقمي الدائم، وعلاقتك بالذكاء الاصطناعي (الاعتماد المعرفي عليه).</span></span></button>`; })()}
  ${acctNudge ? `<div class="notice amber row"><div class="grow"><b>احفظ تقدمك على كل أجهزتك</b><span class="small">أنشئ حسابًا مجانيًا بالبريد الإلكتروني (اختياري): تحفظ نقاطك وسلسلتك ومقاييسك، وتظهر في لوحة المتصدرين.</span></div><button class="btn amber sm" data-go3="account">إنشاء حساب</button></div>` : ''}
  <div class="grid2">
    <section class="card"><h3>${ic('bolt')} مهام اليوم</h3>${S.quests.list.map(q => `<div class="quest"><span>${esc(q.t)} ${q.done ? '<span class="chip good">تم</span>' : ''}</span><span class="muted num small">+10</span><div class="pbar amber"><i style="width:${Math.min(100, q.p / q.n * 100)}%"></i></div></div>`).join('')}</section>
    <section class="card"><h3>${ic('book')} تقدمك في الدروس</h3><p class="muted small" style="margin:0 0 8px">${LEARN.doneCount()} من ${LEARN.total()} أجزاء مكتملة</p><div class="pbar good"><i style="width:${LEARN.doneCount() / LEARN.total() * 100}%"></i></div><div class="row" style="margin-top:12px"><button class="btn soft sm" data-go3="learn">كل الدروس</button><button class="btn ghost sm" data-go3="practice">تدرّب</button></div></section>
  </div>
  <div class="section-title"><h2>اختصارات</h2></div>
  <div class="grid3">
    ${[['labs', 'flask', 'المعامل الحسابية', 'ألفا، KR‑20، التجزئة النصفية، كابا، صدق المحتوى، تحليل الفقرات', '--primary', '--primary-soft'],
      ['build', 'build', 'ابنِ مقياسك', 'معالج من 12 خطوة، جمع البيانات مباشرة، وتحليل فوري', '--good', '--good-soft'],
      ['formulas', 'sigma', 'المعادلات', 'كل المعادلات برموزها ومتى تُستخدم وأمثلة محلولة', '--violet', '--violet-soft'],
      ['laws', 'sigma', 'القوانين الإحصائية', '65 قانونًا من القديم للحديث بمسائل محلولة وتدريب', '--primary', '--primary-soft'],
      ['practice', 'cards', 'التدريب', 'بطاقات مراجعة، ومطابقة، ومسائل حسابية مولدة', '--amber', '--amber-soft'],
      ['bank', 'cards', 'بنك الأسئلة', 'أكثر من 200 سؤال بإجاباتها: صح وخطأ، واختيار، ومسائل، ومقالي', '--lime', '--lime-soft'],
      ['exam', 'check', 'أسئلة موضوعية والامتحان', 'صح وخطأ واختيار من متعدد بنمط امتحان القسم، ونموذج محلول', '--bad', '--bad-soft']]
      .map(c => `<button class="linkcard" data-go3="${c[0]}" style="--c:var(${c[4]});--s:var(${c[5]})"><span class="ic">${ic(c[1])}</span><span><b>${c[2]}</b><span>${c[3]}</span></span></button>`).join('')}
  </div>
  ${journeyX()}
  <p class="foot">إعداد الطالب: محمد عثمان — الدبلوم الخاص في علم النفس · إشراف: الدكتورة نجاة زكي</p>`;
  $('#hCont').onclick = () => LEARN.open(nx.key);
  $('#hRules2').onclick = () => LEARN.open('rules12');
  $$('[data-go3]', el).forEach(b => b.onclick = () => go(b.dataset.go3));
  if (typeof MOTION !== 'undefined') { MOTION.hero($('.hx', el)); MOTION.journey($('.journey', el)); MOTION.magnetic(el); }
};

/* ===== Learn: path, lessons, interactive stepper, quizzes, practice, profile ===== */
const LEARN = (() => {
  const ORDER = C.order;
  const PARTS = []; ORDER.forEach(([u, sub, keys], ui) => keys.forEach(k => { const p = C.parts[k]; if (p) { p.unit = ui; p.short = p.title.split(' — ')[0]; PARTS.push(p); } }));
  PARTS.forEach((p, i) => { p.idx = i; p.sections.forEach((s, j) => s.id = p.key + '.' + j); });
  const byKey = k => PARTS.find(p => p.key === k);
  const strip = h => h.replace(/<img[^>]*>/g, '').replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/\s+/g, ' ').trim();
  const text = s => s._t ?? (s._t = strip(s.html));
  const isLib = p => ['gloss', 'sch', 'refs', 'apx'].includes(p.key);
  /* Section HTML lives in lessons.js and is attached on first need; the skeleton in index.html carries titles and hq (has quiz). */
  let lessonsReady = false, lessonsP = null;
  function ensureLessons() {
    if (lessonsReady) return Promise.resolve();
    return lessonsP || (lessonsP = loadChunk('lessons.js?v=fb0f982d5d').then(() => {
      const H = window.LESSONS_HTML; PARTS.forEach(p => p.sections.forEach((s, j) => { s.html = H[p.key][j]; })); lessonsReady = true;
    }, e => { lessonsP = null; throw e; }));
  }

  /* ---- question pools ---- */
  C.bank.forEach((b, i) => b.id = 'b' + i);
  C.glossary.forEach((g, i) => g.id = 'g' + i);
  C.scholars.forEach((s, i) => s.id = 's' + i);
  C.mcq.forEach((m, i) => m.id = 'm' + i);
  const glossOK = C.glossary.filter(g => g.d && g.d.length > 8 && g.en);
  const qMcq = m => ({ id: m.id, kind: 'اختيار من متعدد', q: m.q, opts: shuffle(m.o), a: m.o[m.a], explain: m.w });
  const qBank = b => ({ id: b.id, kind: 'سؤال مراجعة', q: b.q, opts: shuffle([b.a, ...pick(C.bank.filter(x => x.a !== b.a), 3).map(x => x.a)]), a: b.a, explain: b.a });
  const qGlossEn = g => ({ id: g.id + 'e', kind: 'المقابل الإنجليزي', q: 'ما المقابل الإنجليزي لمصطلح «' + g.ar + '»؟', opts: shuffle([g.en, ...pick(glossOK.filter(x => x.en !== g.en), 3).map(x => x.en)]), a: g.en, ltr: true, explain: g.ar + ' = ' + g.en + '. ' + g.d });
  const qGlossDef = g => ({ id: g.id + 'd', kind: 'المصطلح من تعريفه', q: 'أي مصطلح يطابق هذا التعريف؟ «' + g.d + '»', opts: shuffle([g.ar, ...pick(glossOK.filter(x => x.ar !== g.ar), 3).map(x => x.ar)]), a: g.ar, explain: g.ar + ' (' + g.en + ')' });
  const qSch = s => ({ id: s.id, kind: 'من صاحب الإسهام؟', q: '«' + s.c + '» — من صاحب هذا الإسهام؟', opts: shuffle([s.ar, ...pick(C.scholars.filter(x => x.ar !== s.ar), 3).map(x => x.ar)]), a: s.ar, explain: s.ar + ' (' + s.en + (s.y ? '، ' + s.y : '') + ')' });
  const qQuick = k => ({ id: 'k' + k.k, kind: 'ورقة المراجعة', q: 'ما الجملة التي تلخص محور «' + k.k + '»؟', opts: shuffle([k.v, ...pick(C.quick.filter(x => x !== k), 3).map(x => x.v)]), a: k.v, explain: k.v });
  const pool = {};
  function poolFor(p) {
    if (pool[p.key]) return pool[p.key];
    let g = [];
    if (p.key === 'intro') g = C.quick.map(k => () => qQuick(k));
    else if (p.key === 'gloss') g = glossOK.flatMap(x => [() => qGlossEn(x), () => qGlossDef(x)]);
    else if (p.key === 'sch') g = C.scholars.filter(s => s.c).map(s => () => qSch(s));
    else if (p.key === 'refs' || p.key === 'apx') g = [];
    else {
      const t = p.sections.map(text).join(' ');
      g = C.mcq.filter(m => m.part === p.key).map(m => () => qMcq(m));
      g = g.concat(C.bank.filter(b => b.part === p.key).map(b => () => qBank(b)));
      glossOK.filter(x => x.ar.length > 3 && t.includes(x.ar)).forEach(x => { g.push(() => qGlossDef(x)); g.push(() => qGlossEn(x)); });
      C.scholars.filter(s => s.c && t.includes(s.ar)).forEach(s => g.push(() => qSch(s)));
    }
    return pool[p.key] = g;
  }
  const hasQuiz = p => lessonsReady ? poolFor(p).length >= 4 : !!p.hq;
  const readCount = p => p.sections.filter(s => S.read[s.id]).length;
  const partDone = p => hasQuiz(p) ? (S.quiz[p.key]?.best || 0) >= 0.6 && readCount(p) >= Math.ceil(p.sections.length / 2) : readCount(p) === p.sections.length;
  const progress = p => { const r = readCount(p) / p.sections.length; return hasQuiz(p) ? r * 0.5 + (S.quiz[p.key]?.best || 0) * 0.5 : r; };
  const learnParts = () => PARTS.filter(p => !isLib(p));
  const next = () => learnParts().find(p => !partDone(p)) || PARTS[0];

  /* ---- path view ---- */
  VIEWS.learn = el => {
    if (openKey) return renderLesson();
    ensureLessons().catch(() => { });
    const np = next();
    el.innerHTML = `<div class="section-title"><h2>الدروس</h2><span class="muted small">${doneCount()} من ${total()} أجزاء مكتملة</span></div>` +
      ORDER.map(([u, sub, keys], ui) => `<section class="stack"><div class="unit-h"><span class="n">${ui === 0 ? '٠' : ui === ORDER.length - 1 ? ic('book') : ui}</span><div><b>${esc(u)}</b><small>${esc(sub)}</small></div></div>` +
        keys.map(byKey).filter(Boolean).map(p => { const d = partDone(p), pr = progress(p), q = S.quiz[p.key]; return `<button class="partcard ${d ? 'done' : ''} ${p === np && !d ? 'current' : ''}" data-part="${p.key}"><span class="disc">${d ? ic('check') : p.idx + 1}</span><span><b>${esc(p.title)}</b><span class="meta">${p.sections.length} أقسام · ${readCount(p)} مقروءة${q ? ' · أفضل نتيجة ' + Math.round(q.best * 100) + '٪' : ''}</span><div class="pbar ${d ? 'good' : ''}"><i style="width:${pr * 100}%"></i></div></span><span class="muted">${ic('back')}</span></button>`; }).join('') + '</section>').join('');
    $$('[data-part]', el).forEach(b => b.onclick = () => open(b.dataset.part));
  };
  let openKey = null, openSec = null;
  function open(key, si) { openKey = key; openSec = si ?? null; if (location.hash === '#learn') renderLesson(); else location.hash = 'learn'; }
  function renderLesson() {
    const p = byKey(openKey); if (!p) return;
    if (!lessonsReady) {
      $('#view').innerHTML = '<div class="container" id="vc"><p class="muted">جارٍ تحميل الدرس…</p></div>';
      ensureLessons().then(() => { if (openKey && current === 'learn') renderLesson(); }, () => { const c = $('#vc'); if (c && openKey && current === 'learn') c.innerHTML = '<p class="muted">تعذر تحميل الدرس. تحقق من الاتصال وحدّث الصفحة.</p>'; });
      return;
    }
    const el = $('#view'); el.innerHTML = '<div class="container" id="vc"></div>'; const c = $('#vc');
    c.innerHTML = `<button class="back" id="lBack">${ic('back')} كل الدروس</button>
      <header class="card lesson-head"><span class="chip blue">${esc(ORDER[p.unit][0])}</span><h1>${esc(p.title)}</h1>${p.en ? `<div class="muted small ltr" style="text-align:right">${esc(p.en)}</div>` : ''}
      <div class="row small muted"><span>${readCount(p)}/${p.sections.length} أقسام مقروءة</span>${S.quiz[p.key] ? `<span class="chip good">أفضل نتيجة ${Math.round(S.quiz[p.key].best * 100)}٪</span>` : ''}</div><div class="pbar good"><i style="width:${progress(p) * 100}%"></i></div></header>
      <div class="stack" id="secs">${p.sections.map((s, i) => { const rd = !!S.read[s.id], op = openSec === i; const n = chunks(s).length; return `<article class="sec ${rd ? 'read' : ''}" id="sec-${i}"><div class="sec-h"><span class="ck">${rd ? ic('check') : ''}</span><span class="t">${esc(s.title || p.title)}<small>${n} بطاقات · ${rd ? 'مكتمل' : '≈ ' + Math.max(1, Math.round(text(s).length / 900)) + ' د قراءة'}</small></span></div><div class="row" style="padding:0 14px 12px"><button class="btn sm" data-play="${i}">${ic('play')}${rd ? 'أعد الدرس' : 'ابدأ الدرس'}</button><button class="btn sm ghost" data-sec="${i}">${op ? 'إخفاء النص' : 'قراءة كاملة'}</button></div>${op ? `<div class="body"><div class="prose">${decorate(s.html)}</div>${rd ? '' : `<button class="btn soft" data-read="${i}">${ic('check')} أنهيت القراءة (+5)</button>`}</div>` : ''}</article>`; }).join('')}</div>
      <div class="lfoot">${hasQuiz(p) ? `<button class="btn amber" id="lQuiz">${ic('bolt')} اختبر نفسك في هذا الجزء</button>` : ''}${p.idx < PARTS.length - 1 ? `<button class="btn ghost" id="lNext">الجزء التالي ${ic('back')}</button>` : ''}</div>`;
    $('#lBack').onclick = () => { openKey = null; route(); };
    $$('[data-sec]', c).forEach(b => b.onclick = () => { const i = +b.dataset.sec; openSec = openSec === i ? null : i; renderLesson(); const e = $('#sec-' + i); e && openSec != null && e.scrollIntoView({ block: 'start' }); });
    $$('[data-play]', c).forEach(b => b.onclick = () => startStepper(p, +b.dataset.play));
    $$('[data-read]', c).forEach(b => b.onclick = () => { const s = p.sections[+b.dataset.read]; markRead(s); openSec = +b.dataset.read + 1 < p.sections.length ? +b.dataset.read + 1 : null; renderLesson(); });
    const q = $('#lQuiz'); if (q) q.onclick = () => startPartQuiz(p);
    const nx = $('#lNext'); if (nx) nx.onclick = () => open(PARTS[p.idx + 1].key);
    if (openSec != null) { const e = $('#sec-' + openSec); e && e.scrollIntoView({ block: 'start' }); } else scrollTo(0, 0);
  }
  function markRead(s, xp = 5) { if (!S.read[s.id]) { S.read[s.id] = 1; quest('read', 1); addXP(xp); } }
  const GL = new Map(); C.glossary.forEach(g => { if (g.ar.length > 2 && !GL.has(g.ar)) GL.set(g.ar, g); });
  function decorate(h) { return h.replace(/<b>([^<]{3,60})<\/b>/g, (m, t) => { const g = GL.get(t.trim()); return g ? `<b class="gl" data-g="${g.id}" tabindex="0">${t}</b>` : m; }); }
  function showDef(id) { const g = C.glossary.find(x => x.id === id); if (!g) return; let d = $('#defsheet'); if (!d) { d = document.createElement('div'); d.id = 'defsheet'; d.className = 'defsheet'; document.body.appendChild(d); } d.hidden = false; d.innerHTML = `<div class="in"><span class="chip blue">من المسرد</span><b style="font-family:var(--f-display);font-size:18px">${esc(g.ar)}</b><div class="ltr muted small" style="text-align:right">${esc(g.en)}</div><div>${esc(g.d)}</div><button class="btn ghost sm" id="defx">إغلاق</button></div>`; $('#defx').onclick = () => d.hidden = true; }
  document.addEventListener('click', e => { const b = e.target.closest && e.target.closest('b.gl'); if (b) showDef(b.dataset.g); else { const d = $('#defsheet'); if (d && !d.hidden && !e.target.closest('#defsheet')) d.hidden = true; } });
  document.addEventListener('keydown', e => { if (e.key === 'Enter' && e.target.matches && e.target.matches('b.gl')) showDef(e.target.dataset.g); });

  /* ---- stepper (cards + retrieval checks) ---- */
  function chunks(sec) {
    if (sec._c) return sec._c;
    const t = document.createElement('template'); t.innerHTML = sec.html; const out = []; let cur = [], len = 0;
    const flush = () => { if (cur.length) { out.push(cur.map(e => e.outerHTML).join('')); cur = []; len = 0; } };
    [...t.content.children].forEach(e => {
      const tag = e.tagName, l = e.textContent.length;
      if (e.classList.contains('en')) { cur.push(e); return; }
      if (tag === 'H4') { flush(); cur.push(e); return; }
      const big = tag === 'ASIDE' || tag === 'FIGURE' || e.classList.contains('tw');
      if (big) { if (cur.some(x => x.tagName !== 'H4') && len > 200) flush(); cur.push(e); flush(); return; }
      if (len + l > 650 && len > 0) flush(); cur.push(e); len += l;
    });
    flush(); return sec._c = out.length ? out : [sec.html];
  }
  const terms = {};
  function checksFor(html, p) {
    if (!terms[p.key]) { const T = new Set(); p.sections.forEach(s => { const t = document.createElement('template'); t.innerHTML = s.html; t.content.querySelectorAll('p b,li b').forEach(b => { const x = b.textContent.trim(); if (x.length >= 3 && x.length <= 40 && !/[:：]$/.test(x)) T.add(x); }); }); terms[p.key] = [...T]; }
    const t = document.createElement('template'); t.innerHTML = html; t.content.querySelectorAll('.en').forEach(x => x.remove()); const out = [];
    t.content.querySelectorAll('p,li').forEach(el => {
      if (el.closest('table')) return;
      const txt = el.textContent.replace(/\s+/g, ' ').trim();
      el.querySelectorAll('b').forEach(b => {
        const term = b.textContent.trim();
        if (term.length < 3 || term.length > 40 || /[:：]$/.test(term) || txt.startsWith(term + ':') || /^[\d.\s=<>≥≤%()−-]+$/.test(term)) return;
        const s = txt.split(/(?<=[.؛!؟])\s+/).find(x => x.includes(term)); if (!s || s.length < term.length + 30 || s.length > 300) return;
        const others = terms[p.key].filter(x => x !== term && !x.includes(term) && !term.includes(x) && !s.includes(x)); if (others.length < 3) return;
        out.push({ kind: 'أكمل الفراغ', stem: s, term, opts: shuffle([term, ...pick(others.sort((a, b) => Math.abs(a.length - term.length) - Math.abs(b.length - term.length)).slice(0, 10), 3)]), a: term });
      });
    });
    return out;
  }
  let L = null;
  function startStepper(p, si) {
    const sec = p.sections[si], ch = chunks(sec), steps = []; let since = [], made = 0;
    ch.forEach((c, i) => { steps.push({ t: 'read', html: c }); since.push(c); if ((since.length >= 2 || i === ch.length - 1) && made < 4) { const cs = since.flatMap(x => checksFor(x, p)); if (cs.length) { steps.push({ t: 'check', q: cs[Math.random() * cs.length | 0] }); made++; } since = []; } });
    L = { p, si, sec, steps, i: 0, ok: 0, checks: made, xp: 0 }; stepShow();
  }
  const top = () => `<div class="qtop"><button class="x" id="lx" aria-label="إنهاء الدرس">${ic('x')}</button><div class="qprog"><i style="width:${L.i / L.steps.length * 100}%"></i></div><span class="pill xp num">+${L.xp}</span></div>`;
  function stepShow() {
    if (L.i >= L.steps.length) return stepDone();
    const st = L.steps[L.i];
    if (st.t === 'read') {
      const k = L.steps.slice(0, L.i + 1).filter(x => x.t === 'read').length, tot = L.steps.filter(x => x.t === 'read').length;
      openOv(top() + `<div class="lcard"><div class="row small" style="margin-bottom:6px"><span class="chip blue">بطاقة ${k} من ${tot}</span><span class="muted">${esc(L.sec.title)}</span></div><div class="prose">${decorate(st.html)}</div></div><div class="sheet"><button class="btn" id="lnext">${L.steps[L.i + 1] && L.steps[L.i + 1].t === 'check' ? 'فهمت، اختبرني' : 'تابع'}</button></div>`);
      $('#lnext').onclick = () => { L.i++; stepShow(); };
    } else {
      const q = st.q; let picked = null, done = false;
      const stem = esc(q.stem).split(esc(q.term)).join('<span class="blank">' + esc(q.term) + '</span>');
      openOv(top() + `<div class="qkind">اختبر نفسك · ${q.kind}</div><div class="qtext">${stem}</div><div class="opts">${q.opts.map((o, i) => `<button class="opt" data-o="${i}" aria-pressed="false"><span class="k">${i + 1}</span><span>${esc(o)}</span></button>`).join('')}</div><div class="sheet" id="lsheet"><button class="btn" id="lcheck" disabled>تحقّق</button></div>`);
      $$('.opt').forEach(b => b.onclick = () => { if (done) return; $$('.opt').forEach(x => x.setAttribute('aria-pressed', 'false')); b.setAttribute('aria-pressed', 'true'); picked = +b.dataset.o; $('#lcheck').disabled = false; });
      $('#lcheck').onclick = () => {
        if (done || picked == null) return; done = true; const ok = q.opts[picked] === q.a; S.answered++;
        $$('.opt').forEach((b, i) => { if (q.opts[i] === q.a) b.classList.add('ok'); else if (i === picked) b.classList.add('no'); });
        $$('.blank').forEach(b => { b.style.color = 'var(--good)'; b.style.borderBottomStyle = 'solid'; });
        if (ok) { L.ok++; S.correct++; L.xp += 3; } else { const it = { id: 'c' + L.sec.id + q.a, kind: q.kind, q: q.stem.split(q.term).join('＿＿＿'), opts: q.opts, a: q.a, explain: q.stem }; if (!S.miss.some(m => m.id === it.id)) S.miss.push({ id: it.id, q: it }); if (S.miss.length > 120) S.miss.shift(); }
        save();
        $('#lsheet').innerHTML = `<div class="fb ${ok ? 'ok' : 'no'}"><b>${ok ? 'إجابة صحيحة' : 'المعلومة الصحيحة:'}</b><div class="small">${esc(q.stem)}</div>${ok ? '' : '<div class="muted small">أُضيفت إلى «مراجعة الأخطاء» في التدريب.</div>'}</div><button class="btn" id="lnext">تابع</button>`;
        $('#lnext').onclick = () => { L.i++; stepShow(); }; $('#lnext').focus();
      };
    }
    $('#lx').onclick = closeOv;
  }
  function stepDone() {
    const first = !S.read[L.sec.id]; let g = L.xp + (first ? 5 : 2); if (L.checks >= 2 && L.ok === L.checks) g += 5;
    if (first) { S.read[L.sec.id] = 1; quest('read', 1); } addXP(g);
    const p = L.p, nx = p.sections[L.si + 1];
    openOv(`<div class="result"><div class="ring" style="width:84px;height:84px;display:grid;place-items:center;border-radius:50%;background:var(--good-soft);color:var(--good)">${ic('check')}</div><h2>اكتمل الدرس</h2><p class="muted" style="margin:0">${esc(L.sec.title)}</p><div class="tiles3"><div class="tile hl"><small>نقاط</small><b>+${g}</b></div><div class="tile good"><small>استرجاع صحيح</small><b>${L.ok}/${L.checks}</b></div><div class="tile"><small>بطاقات</small><b>${L.steps.filter(x => x.t === 'read').length}</b></div></div><div class="row" style="justify-content:center">${nx ? '<button class="btn" id="lnx">الدرس التالي</button>' : (hasQuiz(p) ? '<button class="btn amber" id="lqz">اختبر نفسك في الجزء</button>' : '')}<button class="btn ghost" id="lbk">العودة</button></div></div>`);
    if (nx) $('#lnx').onclick = () => startStepper(p, L.si + 1);
    const qz = $('#lqz'); if (qz) qz.onclick = () => startPartQuiz(p);
    $('#lbk').onclick = closeOv;
  }

  /* ---- overlay & quiz engine ---- */
  function openOv(html) { let o = $('#ov'); if (!o) { o = document.createElement('div'); o.id = 'ov'; o.className = 'ov'; o.innerHTML = '<div class="in" id="ovIn"></div>'; document.body.appendChild(o); } $('#ovIn').innerHTML = html; o.hidden = false; document.body.style.overflow = 'hidden'; o.scrollTop = 0; }
  function closeOv() { const o = $('#ov'); if (o) o.hidden = true; document.body.style.overflow = ''; clearInterval(Q && Q.tm); Q = null; L = null; if (openKey && current === 'learn') renderLesson(); else rerender(); }
  let Q = null;
  function startPartQuiz(p) { const g = poolFor(p); runQuiz({ title: p.short, qs: pick(g, Math.min(8, g.length)).map(f => f()), onEnd: r => { const prev = S.quiz[p.key]?.best || 0; S.quiz[p.key] = { best: Math.max(prev, r.acc), last: today() }; quest('quiz', 1); } }); }
  function runQuiz(cfg) { Q = Object.assign({ i: 0, ok: 0, combo: 0, best: 0, xp: 0, wrong: [] }, cfg); showQ(); }
  function showQ() {
    if (Q.timer && Date.now() >= Q.deadline) return endQuiz();
    if (Q.i >= Q.qs.length) { if (Q.endless) Q.qs.push(...Q.more()); else return endQuiz(); }
    const it = Q.qs[Q.i]; let picked = null, answered = false;
    openOv(`<div class="qtop"><button class="x" id="qx" aria-label="إنهاء">${ic('x')}</button><div class="qprog"><i style="width:${(Q.timer ? Math.max(0, (Q.deadline - Date.now()) / 60000) : Q.i / Q.qs.length) * 100}%"></i></div>${Q.timer ? '<span class="pill xp num" id="qtime"></span>' : `<span class="muted num">${Q.i + 1}/${Q.qs.length}</span>`}</div>
      <div class="qkind">${esc(it.kind)}${Q.combo >= 2 ? ` · <span style="color:var(--good)">سلسلة × ${Q.combo}</span>` : ''}</div><div class="qtext">${esc(it.q)}</div>
      <div class="opts">${it.opts.map((o, i) => `<button class="opt" data-o="${i}" aria-pressed="false" ${it.ltr ? 'dir="ltr"' : ''}><span class="k">${i + 1}</span><span>${esc(o)}</span></button>`).join('')}</div>
      <div class="sheet" id="sheet"><button class="btn" id="qcheck" disabled>تحقّق</button></div>`);
    $('#qx').onclick = () => Q.i > 0 && !Q.timer ? endQuiz(true) : closeOv();
    $$('.opt').forEach(b => b.onclick = () => { if (answered) return; $$('.opt').forEach(x => x.setAttribute('aria-pressed', 'false')); b.setAttribute('aria-pressed', 'true'); picked = +b.dataset.o; $('#qcheck').disabled = false; if (Q.timer) $('#qcheck').click(); });
    $('#qcheck').onclick = () => {
      if (answered || picked == null) return; answered = true; const ok = it.opts[picked] === it.a; S.answered++;
      $$('.opt').forEach((b, i) => { if (it.opts[i] === it.a) b.classList.add('ok'); else if (i === picked) b.classList.add('no'); });
      if (ok) { Q.ok++; Q.combo++; Q.best = Math.max(Q.best, Q.combo); S.correct++; Q.xp += Q.timer ? 5 : 10 + (Q.combo >= 3 ? 5 : 0); S.miss = S.miss.filter(m => m.id !== it.id); }
      else { Q.combo = 0; Q.wrong.push(it); if (!S.miss.some(m => m.id === it.id)) S.miss.push({ id: it.id, q: it }); if (S.miss.length > 120) S.miss.shift(); }
      save();
      if (Q.timer) { Q.i++; setTimeout(() => Q && showQ(), ok ? 250 : 700); return; }
      $('#sheet').innerHTML = `<div class="fb ${ok ? 'ok' : 'no'}"><b>${ok ? 'أحسنت' : 'الإجابة الصحيحة: ' + esc(it.a)}</b>${it.explain && it.explain !== it.a ? `<div class="small muted">${esc(it.explain)}</div>` : ''}</div><button class="btn" id="qnext">تابع</button>`;
      $('#qnext').onclick = () => { Q.i++; showQ(); }; $('#qnext').focus();
    };
    if (Q.timer) { const upd = () => { const s = Math.max(0, Math.ceil((Q.deadline - Date.now()) / 1000)); const e = $('#qtime'); if (e) e.textContent = s + 'ث'; if (s <= 0 && Q) endQuiz(); }; upd(); clearInterval(Q.tm); Q.tm = setInterval(upd, 500); }
  }
  function endQuiz(early) {
    clearInterval(Q.tm); const n = Q.timer ? Q.i : Q.qs.length, acc = n ? Q.ok / n : 0;
    let bonus = 0; if (!Q.timer && !early && Q.ok === Q.qs.length && n >= 4) { bonus = 15; S.perfect++; }
    Q.onEnd && Q.onEnd({ acc, ok: Q.ok, n });
    addXP(Q.xp + bonus);
    const stars = Math.round(acc * 3);
    openOv(`<div class="result"><h2>${acc >= 0.9 ? 'نتيجة ممتازة' : acc >= 0.6 ? 'اجتزت الاختبار' : 'جولة تدريبية جيدة'}</h2><div style="font-size:30px;color:var(--amber);letter-spacing:4px">${'★'.repeat(stars)}${'☆'.repeat(3 - stars)}</div><div class="tiles3"><div class="tile hl"><small>نقاط</small><b>+${Q.xp + bonus}</b></div><div class="tile good"><small>الدقة</small><b>${Math.round(acc * 100)}%</b></div><div class="tile"><small>أطول سلسلة</small><b>${Q.best}</b></div></div>${Q.wrong.length ? `<details class="steps" style="width:100%;text-align:start"><summary>راجع أخطاءك (${Q.wrong.length})</summary>${Q.wrong.map(w => `<p><b>${esc(w.q)}</b><br><span style="color:var(--good)">✓ ${esc(w.a)}</span></p>`).join('')}</details>` : ''}<button class="btn" id="qdone" style="min-width:220px">متابعة</button></div>`);
    $('#qdone').onclick = closeOv;
  }
  document.addEventListener('keydown', e => { const o = $('#ov'); if (!o || o.hidden) return; if (e.key === 'Escape') { closeOv(); return; } if (/^[1-4]$/.test(e.key)) { const b = $(`.opt[data-o="${+e.key - 1}"]`); b && b.click(); } if (e.key === 'Enter') { const n = $('#qnext') || $('#lnext') || $('#qcheck') || $('#lcheck'); if (n && !n.disabled) { e.preventDefault(); n.click(); } } });

  /* ---- practice ---- */
  const BOX = [0, 1, 2, 4, 8, 16, 32];
  const allCards = () => [...C.bank.map(b => ({ id: b.id, f: b.q, b: b.a })), ...C.quick.map(k => ({ id: 'k' + k.k, f: k.k, b: k.v })), ...glossOK.map(g => ({ id: g.id, f: g.ar, b: g.en + ' — ' + g.d }))];
  const dueCards = () => { const t = today(); return allCards().filter(c => !S.cards[c.id] || S.cards[c.id].due <= t); };
  VIEWS.practice = el => {
    const items = [['cards', 'cards', 'بطاقات المراجعة المتباعدة', 'تقلب البطاقة وتقيّم نفسك؛ ما تعرفه يعود بعد أيام.', dueCards().length + ' بطاقة مستحقة', '--primary', '--primary-soft'],
      ['probs', 'calc', 'مسائل حسابية مولّدة', 'ألفا، KR‑20، سبيرمان–براون، جتمان، كابا، CVR، الخطأ المعياري، الدرجة التائية.', 'أرقام جديدة كل مرة', '--good', '--good-soft'],
      ['match', 'match', 'سباق المطابقة', 'طابق المصطلح العربي بمقابله الإنجليزي خلال 60 ثانية.', '+2 لكل زوج', '--amber', '--amber-soft'],
      ['mistakes', 'redo', 'مراجعة الأخطاء', 'الأسئلة التي أخطأت فيها سابقًا حتى تتقنها.', S.miss.length + ' سؤال', '--bad', '--bad-soft'],
      ['rapid', 'timer', 'تحدّي الدقيقة', 'أكبر عدد من الإجابات الصحيحة في 60 ثانية.', 'من كل الأجزاء', '--violet', '--violet-soft'],
      ['scholars', 'users', 'من صاحب الإسهام؟', 'العلماء وإسهاماتهم في القياس النفسي.', '8 أسئلة', '--primary', '--primary-soft']];
    el.innerHTML = `<div class="section-title"><h2>التدريب</h2></div><div class="grid3">${items.map(([k, i, t, d, e, c, s]) => `<button class="linkcard" data-pr="${k}" style="--c:var(${c});--s:var(${s})"><span class="ic">${ic(i)}</span><span><b>${t}</b><span>${d}</span><span class="chip" style="margin-top:6px">${e}</span></span></button>`).join('')}</div>`;
    $$('[data-pr]', el).forEach(b => b.onclick = () => practice(b.dataset.pr));
  };
  function practice(k) {
    if (k === 'cards') return cardsMode();
    if (k === 'match') return matchMode();
    if (k === 'probs') return runQuiz({ qs: Array.from({ length: 6 }, genProblem), onEnd: r => { S.probs += r.ok; quest('prob', r.ok); } });
    if (k === 'scholars') return runQuiz({ qs: pick(C.scholars.filter(s => s.c), 8).map(qSch) });
    if (k === 'mistakes') { if (!S.miss.length) return toast('لا أخطاء محفوظة. أحسنت'); return runQuiz({ qs: shuffle(S.miss.map(m => m.q)).slice(0, 10).map(q => Object.assign({}, q, { opts: shuffle(q.opts) })) }); }
    if (k === 'rapid' && !lessonsReady) return ensureLessons().then(() => practice('rapid'), () => toast('تعذر تحميل الأسئلة. تحقق من الاتصال.'));
    if (k === 'rapid') { const all = PARTS.flatMap(p => poolFor(p)); const more = () => pick(all, 20).map(g => g()); return runQuiz({ qs: more(), more, endless: true, timer: true, deadline: Date.now() + 60000 }); }
  }
  function genProblem() {
    const R = (a, b, d = 0) => +(a + Math.random() * (b - a)).toFixed(d), types = ['alpha', 'kr20', 'sb', 'gut', 'kappa', 'cvr', 'sem', 'tscore', 'kr21', 'levels'];
    const t = types[Math.random() * types.length | 0];
    let q, ans, ex;
    if (t === 'alpha') { const k = R(5, 20), sv = R(k * 0.6, k * 1.0, 1), tv = R(sv * 2.5, sv * 5, 1); ans = PSY.alphaFromVars(k, sv, tv); q = `مقياس من ${k} عبارة، مجموع تباينات العبارات = ${sv}، وتباين الدرجة الكلية = ${tv}. احسب ألفا كرونباخ.`; ex = `α = (${k}/${k - 1}) × (1 − ${sv}/${tv})`; }
    else if (t === 'kr20') { const k = R(10, 30), spq = R(k * 0.12, k * 0.22, 2), tv = R(spq * 3, spq * 6, 1); ans = PSY.alphaFromVars(k, spq, tv); q = `اختبار صح/خطأ من ${k} فقرة، Σpq = ${spq}، وتباين الدرجات = ${tv}. احسب KR‑20.`; ex = `KR‑20 = (${k}/${k - 1}) × (1 − ${spq}/${tv})`; }
    else if (t === 'kr21') { const k = R(10, 30), M = R(k * 0.4, k * 0.7, 1), v = R(k * 0.6, k * 1.4, 1); ans = PSY.kr21(k, M, v); q = `اختبار ثنائي من ${k} فقرة، متوسط الدرجات ${M} وتباينها ${v}. احسب KR‑21.`; ex = `KR‑21 = (${k}/${k - 1}) × [1 − ${M}×(${k}−${M}) ÷ (${k}×${v})]`; }
    else if (t === 'sb') { const r = R(0.4, 0.85, 2); ans = PSY.spearmanBrown(r); q = `معامل الارتباط بين نصفي اختبار = ${r}. احسب معامل الثبات بمعادلة سبيرمان–براون.`; ex = `2 × ${r} ÷ (1 + ${r})`; }
    else if (t === 'gut') { const v1 = R(3, 9, 1), v2 = R(3, 9, 1), vt = +(v1 + v2 + 2 * R(0.6, 0.9, 2) * Math.sqrt(v1 * v2)).toFixed(1); ans = PSY.guttman(v1, v2, vt); q = `تباين النصف الأول ${v1}، والثاني ${v2}، والدرجة الكلية ${vt}. احسب معامل جتمان.`; ex = `2 × [1 − (${v1} + ${v2}) ÷ ${vt}]`; }
    else if (t === 'kappa') { const po = R(0.7, 0.95, 2), pe = R(0.4, 0.6, 2); ans = (po - pe) / (1 - pe); q = `نسبة الاتفاق الملاحظ بين مقدِّرين ${po}، والمتوقع بالصدفة ${pe}. احسب كابا كوهين.`; ex = `(${po} − ${pe}) ÷ (1 − ${pe})`; }
    else if (t === 'cvr') { const N = R(8, 20), ne = R(Math.ceil(N / 2), N); ans = PSY.cvr(ne, N); q = `من ${N} محكمين قال ${ne} إن العبارة «أساسية». احسب نسبة صدق المحتوى (CVR) للوشي.`; ex = `(${ne} − ${N}/2) ÷ (${N}/2)`; }
    else if (t === 'sem') { const s = R(5, 20, 1), r = R(0.7, 0.95, 2); ans = PSY.sem(s, r); q = `الانحراف المعياري للدرجات ${s} ومعامل الثبات ${r}. احسب الخطأ المعياري للقياس.`; ex = `${s} × √(1 − ${r})`; }
    else if (t === 'tscore') { const m = R(40, 120), s = R(5, 20), x = R(m - 2 * s, m + 2 * s); ans = PSY.tScore((x - m) / s); q = `متوسط ${m} وانحراف معياري ${s}. ما الدرجة التائية T لمن حصل على ${x}؟`; ex = `z = (${x} − ${m}) ÷ ${s}؛ T = 50 + 10z`; }
    else { const lo = 1, hi = R(4, 7), n = 3; ans = (hi - lo) / n; q = `تدريج من ${lo} إلى ${hi}. ما طول الفئة لتقسيم المتوسطات إلى ${n} مستويات؟`; ex = `(${hi} − ${lo}) ÷ ${n}`; }
    const d = t === 'tscore' ? 1 : 2, A = fmt(ans, d), deltas = t === 'tscore' ? [-3.7, 2.4, 5.1] : [-0.07, 0.05, 0.12];
    const opts = shuffle([A, ...deltas.map(x => fmt(ans + x * (t === 'tscore' ? 1 : (Math.abs(ans) > 1 ? ans : 1)), d))].filter((v, i, a) => a.indexOf(v) === i)).slice(0, 4);
    if (!opts.includes(A)) opts[0] = A;
    return { id: 'pr' + t, kind: 'مسألة حسابية', q, opts, a: A, ltr: true, explain: ex + ' = ' + A };
  }
  function cardsMode() {
    const deck = shuffle(dueCards()).slice(0, 20); if (!deck.length) return toast('لا بطاقات مستحقة اليوم. عُد غدًا');
    let i = 0, known = 0;
    const show = () => {
      if (i >= deck.length) { addXP(deck.length); quest('cards', 0); openOv(`<div class="result"><h2>أنهيت المراجعة</h2><div class="tiles3"><div class="tile"><small>بطاقات</small><b>${deck.length}</b></div><div class="tile good"><small>عرفتها</small><b>${known}</b></div><div class="tile hl"><small>نقاط</small><b>+${deck.length}</b></div></div><button class="btn" id="qdone" style="min-width:220px">متابعة</button></div>`); $('#qdone').onclick = closeOv; return; }
      const c = deck[i], st = S.cards[c.id];
      openOv(`<div class="qtop"><button class="x" id="qx" aria-label="إنهاء">${ic('x')}</button><div class="qprog"><i style="width:${i / deck.length * 100}%"></i></div><span class="muted num">${i + 1}/${deck.length}</span></div><div class="qkind">بطاقة مراجعة · الصندوق ${(st && st.b) || 0}</div><div class="card3d"><button class="flip" id="flip" aria-label="اقلب البطاقة"><div class="face"><b>${esc(c.f)}</b><small class="muted">اضغط لترى الإجابة</small></div><div class="face back"><span>${esc(c.b)}</span></div></button></div><div class="sheet row" id="cb" style="justify-content:center"><button class="btn ghost" id="flipBtn">اقلب البطاقة</button></div>`);
      const flip = () => { $('#flip').classList.add('on'); $('#cb').innerHTML = '<button class="btn danger" id="no" style="flex:1">لم أعرفها</button><button class="btn" id="yes" style="flex:1">عرفتها</button>'; $('#yes').onclick = () => rate(true); $('#no').onclick = () => rate(false); };
      $('#flip').onclick = flip; $('#flipBtn').onclick = flip; $('#qx').onclick = closeOv;
    };
    const rate = ok => { const c = deck[i], s = S.cards[c.id] || { b: 0 }; s.b = ok ? Math.min(6, s.b + 1) : 0; const d = new Date(); d.setDate(d.getDate() + BOX[s.b]); s.due = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); S.cards[c.id] = s; if (ok) known++; else deck.push(c); quest('cards', 1); save(); i++; show(); };
    show();
  }
  let MT = null;
  function matchMode() {
    const pool = shuffle(glossOK.filter(g => g.en.length < 34 && g.ar.length < 30)); let k = 0, pairs = 0, sel = null; const end0 = Date.now() + 60000; let end = end0;
    const round = () => {
      const set = pool.slice(k, k + 5); k += 5; if (set.length < 5) { k = 0; return round(); }
      const Ls = shuffle(set.map(g => ({ id: g.id, t: g.ar }))), Rs = shuffle(set.map(g => ({ id: g.id, t: g.en }))); let left = 5;
      openOv(`<div class="qtop"><button class="x" id="qx" aria-label="إنهاء">${ic('x')}</button><div class="qprog"><i id="mbar" style="width:100%;background:var(--amber)"></i></div><span class="pill xp num" id="mt"></span></div><div class="qkind">طابق المصطلح بمقابله · <span class="num" id="mp">${pairs}</span> زوجًا</div><div class="mgrid" style="margin-top:12px">${Ls.map((x, i) => `<button class="opt" data-side="L" data-id="${x.id}" style="grid-column:1;grid-row:${i + 1}">${esc(x.t)}</button>`).join('')}${Rs.map((x, i) => `<button class="opt" dir="ltr" data-side="R" data-id="${x.id}" style="grid-column:2;grid-row:${i + 1}">${esc(x.t)}</button>`).join('')}</div>`);
      $('#qx').onclick = finish;
      $$('.mgrid .opt').forEach(b => b.onclick = () => {
        if (!sel || sel.dataset.side === b.dataset.side) { sel && sel.setAttribute('aria-pressed', 'false'); sel = b; b.setAttribute('aria-pressed', 'true'); return; }
        if (sel.dataset.id === b.dataset.id) { [sel, b].forEach(x => { x.classList.add('ok'); setTimeout(() => x.classList.add('gone'), 250); }); pairs++; $('#mp').textContent = pairs; if (--left === 0) setTimeout(round, 300); }
        else { [sel, b].forEach(x => { x.classList.add('no'); setTimeout(() => x.classList.remove('no'), 400); }); end -= 3000; }
        sel.setAttribute('aria-pressed', 'false'); sel = null;
      });
    };
    const finish = () => { clearInterval(MT); MT = null; if (pairs) { S.matches++; addXP(pairs * 2); } openOv(`<div class="result"><h2>انتهى السباق</h2><div class="tiles3"><div class="tile hl"><small>أزواج</small><b>${pairs}</b></div><div class="tile"><small>نقاط</small><b>+${pairs * 2}</b></div><div class="tile"><small>الزمن</small><b>60ث</b></div></div><p class="muted small">كل خطأ يخصم 3 ثوانٍ.</p><button class="btn" id="qdone" style="min-width:220px">متابعة</button></div>`); $('#qdone').onclick = closeOv; };
    round(); clearInterval(MT); MT = setInterval(() => { const s = Math.max(0, (end - Date.now()) / 1000), t = $('#mt'), b = $('#mbar'); if (t) t.textContent = Math.ceil(s) + 'ث'; if (b) b.style.width = (s / 60 * 100) + '%'; if (s <= 0) finish(); }, 250);
  }

  /* ---- profile ---- */
  VIEWS.me = el => {
    const rk = rankOf(S.xp), acc = S.answered ? Math.round(S.correct / S.answered * 100) : 0;
    const days = []; for (let i = 6; i >= 0; i--) { const d = new Date(); d.setDate(d.getDate() - i); const k = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); days.push([S.hist[k] || 0, d.toLocaleDateString('ar-EG', { weekday: 'short' })]); }
    el.innerHTML = `<div class="section-title"><h2>إنجازاتي</h2><span class="chip amber">${ic('star')} ${esc(rk.name)}</span></div>
    <div class="kpis">${[['النقاط', S.xp], ['السلسلة الحالية', S.streak + ' يوم'], ['أطول سلسلة', S.best + ' يوم'], ['الدقة', acc + '%'], ['دروس مكتملة', Object.keys(S.read).length], ['أجزاء منجزة', doneCount() + '/' + total()]].map(([a, b]) => `<div class="tile"><small>${a}</small><b>${b}</b></div>`).join('')}</div>
    <section class="card"><h3>${ic('chart')} نقاطك في آخر سبعة أيام</h3>${barSVG(days.map(d => d[0]), days.map(d => d[1]), { d: 0, ref: S.goal, refLabel: 'الهدف ' + S.goal, max: S.goal, label: 'النقاط اليومية', color: v => v >= S.goal ? 'var(--amber)' : 'var(--primary)' })}</section>
    <section class="card"><h3>${ic('trophy')} الأوسمة (${S.badges.length}/${BADGES.length})</h3><div class="badges">${BADGES.map(b => `<div class="badge ${S.badges.includes(b.id) ? '' : 'off'}"><div class="m">${ic('star')}</div><b>${b.t}</b><small>${b.d}</small></div>`).join('')}</div></section>
    <section class="card"><h3>${ic('gear')} الإعدادات</h3><div class="stack">
      <div class="row"><span class="grow">هدف النقاط اليومي</span><div class="seg">${[20, 40, 80].map(g => `<button data-goal="${g}" aria-pressed="${S.goal === g}">${g}</button>`).join('')}</div></div>
      <div class="row"><span class="grow">حجم الخط</span><div class="seg">${[[1, 'عادي'], [1.1, 'كبير'], [1.2, 'أكبر']].map(([z, t]) => `<button data-fs="${z}" aria-pressed="${(S.fs || 1) === z}">${t}</button>`).join('')}</div></div>
      <div class="row"><span class="grow">مسح كل التقدم على هذا الجهاز</span><button class="btn sm danger" id="reset">مسح</button></div></div></section>`;
    $$('[data-goal]', el).forEach(b => b.onclick = () => { S.goal = +b.dataset.goal; save(); rerender(); });
    $$('[data-fs]', el).forEach(b => b.onclick = () => { S.fs = +b.dataset.fs; applyPrefs(); save(); rerender(); });
    $('#reset').onclick = () => confirmBox('سيُمسح تقدمك ونقاطك وسلسلتك على هذا الجهاز نهائيًا.', 'نعم، امسح', () => { S = fresh(); tick(); save(); toast('بدأت من جديد'); rerender(); });
  };

  const doneCount = () => learnParts().filter(partDone).length, total = () => learnParts().length;
  return { parts: () => PARTS, text, open, ensure: ensureLessons, ready: () => lessonsReady, next: () => { const p = next(); return { key: p.key, short: p.short }; }, doneCount, total, runQuiz, openOv, closeOv, renderLesson, isOpen: () => !!openKey, clearOpen: () => { openKey = null; } };
})();

/* ===== Labs (calculators) and formulas reference ===== */
const LABS = (() => {
  const EX_LIK = `ع1 ع2 ع3 ع4 ع5
5 4 5 4 5
4 4 5 5 4
2 1 2 2 1
3 3 3 4 3
5 5 4 5 5
1 2 2 1 2
4 5 4 4 4
2 2 1 2 3
3 4 3 3 3
4 3 4 4 5`;
  const EX_BIN = `1 1 1 1 1 0
1 1 1 0 0 0
1 0 1 0 0 0
1 1 1 1 1 1
1 0 0 0 0 0
1 1 1 1 0 0
0 0 0 0 0 1
1 1 1 1 1 0`;
  const EX_BIG = (() => { /* simulated two-dimension Likert data for practice (seeded) */
    let s = 11; const r = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
    const g = () => Math.sqrt(-2 * Math.log(r() || 1e-9)) * Math.cos(2 * Math.PI * r());
    const rows = []; for (let i = 0; i < 60; i++) { const f1 = g(), f2 = 0.3 * f1 + 0.95 * g(); const row = []; for (let j = 0; j < 8; j++) { const f = j < 4 ? f1 : f2, x = 3 + 1.1 * (0.75 * f + 0.6 * g()); row.push(Math.max(1, Math.min(5, Math.round(x)))); } rows.push(row.join(' ')); }
    return rows.join('\n');
  })();

  const list = [
    { id: 'alpha', t: 'ألفا كرونباخ وتحليل العبارات', d: 'من البيانات الخام أو من التباينات: ألفا، والارتباط المصحح، وألفا عند حذف العبارة.', ic: 'calc' },
    { id: 'kr', t: 'كودر–ريتشاردسون 20 و21', d: 'ثبات الاختبارات ثنائية الدرجة (صح/خطأ).', ic: 'calc' },
    { id: 'split', t: 'التجزئة النصفية', d: 'سبيرمان–براون وجتمان من البيانات أو من المعاملات.', ic: 'calc' },
    { id: 'retest', t: 'ثبات إعادة الاختبار', d: 'ارتباط بيرسون بين تطبيقين مع رسم الانتشار.', ic: 'chart' },
    { id: 'kappa', t: 'كابا كوهين', d: 'اتفاق مقدِّرين على تصنيف اسمي (2×2 أو 3×3 أو 4×4).', ic: 'users' },
    { id: 'content', t: 'صدق المحتوى', d: 'CVR للوشي بالقيمة الحرجة، وCVI للين، ومعامل V لأيكن.', ic: 'shield' },
    { id: 'items', t: 'تحليل الفقرات', d: 'الصعوبة والتمييز للفقرات الثنائية، والمجموعتان الطرفيتان لفقرات ليكرت.', ic: 'chart' },
    { id: 'scores', t: 'الدرجات والمستويات', d: 'الدرجة الزائية والتائية والمئين، والخطأ المعياري، والمتوسط النظري وطول الفئة.', ic: 'sigma' },
    { id: 'omega', t: 'أوميغا والصدق التقاربي', d: 'أوميغا ماكدونالد ومتوسط التباين المستخلص من التشبعات.', ic: 'sigma' },
    { id: 'dif', t: 'الأداء التفاضلي (مانتل–هانزل)', d: 'نسبة الأرجحية ودلتا وتصنيف هيئة الاختبارات التربوية.', ic: 'users' },
    { id: 'efa', t: 'البنية العاملية الاستكشافية', d: 'KMO وبارتلت والجذور الكامنة والتحليل الموازي والتشبعات بعد التدوير.', ic: 'chart' },
    { id: 'sample', t: 'حجم العينة', d: 'أحجام العينات المتداولة لكل مرحلة من مراحل بناء المقياس.', ic: 'users' }
  ];
  let openId = null;
  VIEWS.labs = el => {
    if (openId) return renderLab(el, openId);
    el.innerHTML = `<div class="section-title"><h2>المعامل الحسابية</h2><span class="muted small">كل معمل يحسب النتيجة ويعرض خطوات الحل والتفسير وصياغة النتيجة</span></div>
      <div class="grid3">${list.map(l => `<button class="linkcard" data-lab="${l.id}"><span class="ic">${ic(l.ic)}</span><span><b>${l.t}</b><span>${l.d}</span>${S.labs[l.id] ? '<span class="chip good" style="margin-top:6px">استخدمته</span>' : ''}</span></button>`).join('')}</div>
      <div class="notice small"><b>طريقة إدخال البيانات</b>ضع كل مستجيب في سطر، وافصل بين درجات العبارات بمسافة أو فاصلة أو Tab (يمكن اللصق مباشرة من Excel أو SPSS). يُقبل سطر عناوين في البداية، وتُقبل الأرقام العربية.</div>`;
    $$('[data-lab]', el).forEach(b => b.onclick = () => open(b.dataset.lab));
  };
  function open(id) { openId = id; if (location.hash === '#labs') renderLab($('#vc'), id); else location.hash = 'labs'; }
  const head = (l) => `<button class="back" id="labBack">${ic('back')} كل المعامل</button><div class="section-title"><h2>${esc(l.t)}</h2></div>`;
  const used = {};
  function mark(id) { if (!used[id]) { used[id] = 1; labUse(id); } }
  function renderLab(el, id) {
    const l = list.find(x => x.id === id); if (!l) { openId = null; return VIEWS.labs(el); }
    el.innerHTML = head(l) + '<div id="labBody" class="stack"></div>';
    $('#labBack').onclick = () => { openId = null; rerender(); };
    R[id]($('#labBody'));
  }
  const matrixInput = (id, val, help) => `<div class="field"><label class="fl" for="${id}">${help || 'البيانات: كل مستجيب في سطر، والأعمدة عبارات'}</label><textarea id="${id}" class="data" spellcheck="false">${esc(val)}</textarea></div>`;
  const out = (el, html) => { el.innerHTML = html; };
  const apa = s => `<div class="apa"><b>صياغة النتيجة:</b> ${s} <button class="btn sm ghost" data-copy>${ic('copy')} نسخ</button></div>`;
  const bindCopy = el => $$('[data-copy]', el).forEach(b => b.onclick = () => copyText(b.parentElement.textContent.replace('صياغة النتيجة:', '').replace('نسخ', '').trim()));
  const num = (id, label, val, step = 'any') => `<div class="field"><label class="fl" for="${id}">${label}</label><input type="number" id="${id}" value="${val}" step="${step}"></div>`;
  const v = id => toNum($('#' + id).value);
  const seg = (name, opts, cur) => `<div class="seg" role="group">${opts.map(([k, t]) => `<button data-${name}="${k}" aria-pressed="${k === cur}">${t}</button>`).join('')}</div>`;
  const dec = x => fmt(x, 3).replace(/^0\./, '.').replace(/^-0\./, '-.');

  const R = {};
  /* ---------- alpha ---------- */
  R.alpha = el => {
    let mode = 'raw';
    const draw = () => {
      el.innerHTML = `<div class="card stack">${seg('m', [['raw', 'من البيانات الخام'], ['var', 'من التباينات']], mode)}<div id="in"></div></div><div id="res" class="stack"></div>`;
      $$('[data-m]', el).forEach(b => b.onclick = () => { mode = b.dataset.m; draw(); });
      const inp = $('#in', el), res = $('#res', el);
      if (mode === 'var') {
        inp.innerHTML = `<div class="grid3">${num('k', 'عدد العبارات k', 10)}${num('sv', 'مجموع تباينات العبارات Σσ²ᵢ', 8)}${num('tv', 'تباين الدرجة الكلية σ²ₓ', 30)}</div>`;
        const run = () => { const k = v('k'), sv = v('sv'), tv = v('tv'); if (!(k > 1 && tv > 0)) return out(res, '<div class="notice warn">أدخل k أكبر من 1 وتباينًا كليًا موجبًا.</div>'); const a = PSY.alphaFromVars(k, sv, tv), [c, t] = relVerdict(a); mark('alpha');
          out(res, `<div class="kpis"><div class="tile hl"><small>ألفا كرونباخ</small><b>${fmt(a, 3)}</b></div></div><div class="verdict ${c}">${t}</div><div class="f">α = (${k} ÷ ${k - 1}) × (1 − ${sv} ÷ ${tv}) = ${fmt(k / (k - 1), 3)} × ${fmt(1 - sv / tv, 3)} = ${fmt(a, 3)}</div>`); };
        $$('input', inp).forEach(i => i.oninput = run); run(); return;
      }
      inp.innerHTML = matrixInput('mx', EX_LIK) + `<div class="row"><button class="btn sm ghost" data-ex="lik">مثال ليكرت (10 × 5)</button><button class="btn sm ghost" data-ex="big">بيانات محاكاة (60 × 8)</button></div>`;
      const ta = $('#mx', el);
      $$('[data-ex]', el).forEach(b => b.onclick = () => { ta.value = b.dataset.ex === 'big' ? EX_BIG : EX_LIK; run(); });
      const run = () => {
        const m = parseMatrix(ta.value); if (m.error) return out(res, `<div class="notice warn">${m.error}</div>`);
        if (m.n < 3 || m.k < 2) return out(res, '<div class="notice warn">تحتاج 3 مستجيبين وعبارتين على الأقل.</div>');
        const s = PSY.itemStats(m.rows), [c, t] = relVerdict(s.alpha), names = m.head && m.head.length === m.k ? m.head : s.itemMean.map((_, i) => 'ع' + (i + 1));
        const sh = PSY.splitHalf(m.rows); mark('alpha');
        out(res, `<div class="kpis"><div class="tile hl"><small>ألفا كرونباخ</small><b>${fmt(s.alpha, 3)}</b></div><div class="tile"><small>المستجيبون n</small><b>${m.n}</b></div><div class="tile"><small>العبارات k</small><b>${m.k}</b></div><div class="tile"><small>متوسط الدرجة الكلية</small><b>${fmt(s.totalMean)}</b></div><div class="tile"><small>الانحراف المعياري</small><b>${fmt(s.totalSd)}</b></div><div class="tile"><small>سبيرمان–براون</small><b>${fmt(sh.sb, 3)}</b></div></div>
          <div class="verdict ${c}">الثبات ${t}${s.alpha > 0.95 ? ' — قيمة مرتفعة جدًا قد تعني تكرار العبارات' : ''}</div>
          <section class="card"><h3>${ic('chart')} إحصاءات العبارات</h3>${tableHTML(['العبارة', 'المتوسط', 'الانحراف', 'الارتباط المصحح', 'ألفا عند الحذف', 'الحكم'], names.map((nm, j) => { const bad = s.rit[j] < 0.3, up = s.alphaIfDeleted[j] > s.alpha + 0.005; return { cls: bad ? 'flag' : '', cells: [esc(nm), N(s.itemMean[j]), N(s.itemSd[j]), N(s.rit[j]), N(s.alphaIfDeleted[j], 3), bad ? '<span class="chip bad">راجع العبارة (r < 0.30)</span>' : up ? '<span class="chip warn">حذفها يرفع ألفا</span>' : '<span class="chip good">جيدة</span>'] }; }))}
          ${barSVG(s.rit, names, { ref: 0.3, refLabel: '0.30', max: 1, label: 'الارتباط المصحح', color: x => x < 0.3 ? 'var(--bad)' : 'var(--primary)' })}</section>
          <details class="steps"><summary>خطوات الحل</summary><div class="f">Σσ²ᵢ = ${s.itemVar.map(x => fmt(x)).join(' + ')} = ${fmt(s.sumItemVar, 3)}</div><div class="f">σ²ₓ = ${fmt(s.totalVar, 3)}</div><div class="f">α = (${m.k} ÷ ${m.k - 1}) × (1 − ${fmt(s.sumItemVar, 3)} ÷ ${fmt(s.totalVar, 3)}) = ${fmt(s.alpha, 3)}</div><p class="small muted">التباينات محسوبة بقسمة مجموع المربعات على (n − 1) كما في SPSS. الارتباط المصحح هو ارتباط العبارة بمجموع باقي العبارات بعد استبعادها.</p></details>
          ${apa(`بلغ معامل ألفا كرونباخ للمقياس (ن = ${m.n}، ${m.k} عبارات) α = ${dec(s.alpha)}، وهي قيمة تدل على ثبات ${t.split(' ')[0]}، وتراوحت معاملات الارتباط المصححة بين العبارات والدرجة الكلية بين ${dec(Math.min(...s.rit))} و${dec(Math.max(...s.rit))}.`)}`);
        bindCopy(res);
      };
      ta.oninput = run; run();
    };
    draw();
  };
  /* ---------- KR ---------- */
  R.kr = el => {
    el.innerHTML = `<div class="card stack"><h3>KR‑20 من البيانات الثنائية (0/1)</h3>${matrixInput('mx', EX_BIN, 'كل مستجيب في سطر: 1 = صحيح/موافق، 0 = خطأ')}</div><div id="r20" class="stack"></div>
      <div class="card stack"><h3>KR‑21 من المتوسط والتباين</h3><div class="grid3">${num('k', 'عدد الفقرات k', 20)}${num('M', 'متوسط الدرجات M', 12)}${num('vv', 'تباين الدرجات σ²', 16)}</div><div id="r21"></div></div>`;
    const run20 = () => {
      const m = parseMatrix($('#mx', el).value), r = $('#r20', el); if (m.error) return out(r, `<div class="notice warn">${m.error}</div>`);
      if (m.rows.some(x => x.some(y => y !== 0 && y !== 1))) return out(r, '<div class="notice warn">KR‑20 للفقرات الثنائية فقط: استخدم 0 و1. لفقرات ليكرت استخدم معمل ألفا.</div>');
      const k = PSY.kr20(m.rows), [c, t] = relVerdict(k.value), k21 = PSY.kr21(k.k, k.mean, k.totalVar); mark('kr');
      out(r, `<div class="kpis"><div class="tile hl"><small>KR‑20</small><b>${fmt(k.value, 3)}</b></div><div class="tile"><small>KR‑21 (للمقارنة)</small><b>${fmt(k21, 3)}</b></div><div class="tile"><small>Σpq</small><b>${fmt(k.spq, 3)}</b></div><div class="tile"><small>تباين الدرجات</small><b>${fmt(k.totalVar, 3)}</b></div></div><div class="verdict ${c}">الثبات ${t}</div>
        ${tableHTML(['الفقرة', 'p (نسبة الصواب)', 'q = 1 − p', 'p × q'], k.p.map((p, j) => ['ف' + (j + 1), N(p, 3), N(1 - p, 3), N(p * (1 - p), 3)]))}
        <details class="steps"><summary>خطوات الحل</summary><div class="f">KR‑20 = (${k.k} ÷ ${k.k - 1}) × (1 − ${fmt(k.spq, 3)} ÷ ${fmt(k.totalVar, 3)}) = ${fmt(k.value, 3)}</div><p class="small muted">يُحسب تباين الدرجات الكلية هنا بالقسمة على n ليتسق مع p × q (وهما تباينان على مستوى المجتمع)، وبهذا يساوي KR‑20 قيمة ألفا للبيانات الثنائية.</p></details>`);
    };
    const run21 = () => { const k = v('k'), M = v('M'), vv = v('vv'), r = $('#r21', el); if (!(k > 1 && vv > 0)) return out(r, '<div class="notice warn">أدخل قيمًا صحيحة.</div>'); const x = PSY.kr21(k, M, vv); mark('kr'); out(r, `<div class="kpis"><div class="tile hl"><small>KR‑21</small><b>${fmt(x, 3)}</b></div></div><div class="f">KR‑21 = (${k} ÷ ${k - 1}) × [1 − ${M} × (${k} − ${M}) ÷ (${k} × ${vv})] = ${fmt(x, 3)}</div>`); };
    $('#mx', el).oninput = run20; $$('#k,#M,#vv', el).forEach(i => i.oninput = run21); run20(); run21();
  };
  /* ---------- split ---------- */
  R.split = el => {
    el.innerHTML = `<div class="card stack"><h3>من البيانات</h3>${matrixInput('mx', EX_LIK)}<div class="row"><span class="small muted">طريقة التقسيم:</span><div class="seg"><button data-sm="oddeven" aria-pressed="true">فردي/زوجي</button><button data-sm="half" aria-pressed="false">النصف الأول/الثاني</button></div></div></div><div id="rs" class="stack"></div>
      <div class="grid2"><div class="card stack"><h3>سبيرمان–براون من معامل الارتباط</h3>${num('r', 'الارتباط بين النصفين r', 0.7)}${num('fac', 'معامل الإطالة (2 = اختبار كامل)', 2)}<div id="rsb"></div></div>
      <div class="card stack"><h3>جتمان من التباينات</h3><div class="grid3">${num('v1', 'σ² النصف الأول', 5)}${num('v2', 'σ² النصف الثاني', 4.5)}${num('vt', 'σ² الكلي', 18)}</div><div id="rg"></div></div></div>`;
    let sm = 'oddeven';
    const run = () => { const m = parseMatrix($('#mx', el).value), r = $('#rs', el); if (m.error) return out(r, `<div class="notice warn">${m.error}</div>`); if (m.k < 2) return out(r, '<div class="notice warn">تحتاج عبارتين على الأقل.</div>'); const s = PSY.splitHalf(m.rows, sm === 'half' ? 'half' : 'oddeven'); mark('split');
      out(r, `<div class="kpis"><div class="tile"><small>الارتباط بين النصفين</small><b>${fmt(s.r, 3)}</b></div><div class="tile hl"><small>سبيرمان–براون</small><b>${fmt(s.sb, 3)}</b></div><div class="tile hl"><small>جتمان</small><b>${fmt(s.guttman, 3)}</b></div></div>
        <p class="small muted">النصف الأول: العبارات ${s.A.map(x => x + 1).join('، ')}؛ النصف الثاني: ${s.B.map(x => x + 1).join('، ')}. ${Math.abs(s.v1 - s.v2) / Math.max(s.v1, s.v2) > 0.25 ? 'تباينا النصفين مختلفان بوضوح، فمعامل جتمان أنسب.' : 'تباينا النصفين متقاربان، فالمعاملان متقاربان.'}</p>
        <details class="steps"><summary>خطوات الحل</summary><div class="f">r_SB = 2 × ${fmt(s.r, 3)} ÷ (1 + ${fmt(s.r, 3)}) = ${fmt(s.sb, 3)}</div><div class="f">r_G = 2 × [1 − (${fmt(s.v1)} + ${fmt(s.v2)}) ÷ ${fmt(s.vt)}] = ${fmt(s.guttman, 3)}</div></details>`); };
    const runSB = () => { const r = v('r'), f = v('fac') || 2; const x = PSY.spearmanBrown(r, f); mark('split'); out($('#rsb', el), `<div class="tile hl"><small>الثبات المصحح</small><b>${fmt(x, 3)}</b></div><div class="f">${f} × ${r} ÷ (1 + ${fmt(f - 1, 2)} × ${r}) = ${fmt(x, 3)}</div>`); };
    const runG = () => { const a = v('v1'), b = v('v2'), t = v('vt'); const x = PSY.guttman(a, b, t); mark('split'); out($('#rg', el), `<div class="tile hl"><small>معامل جتمان</small><b>${fmt(x, 3)}</b></div><div class="f">2 × [1 − (${a} + ${b}) ÷ ${t}] = ${fmt(x, 3)}</div>`); };
    $$('[data-sm]', el).forEach(b => b.onclick = () => { sm = b.dataset.sm; $$('[data-sm]', el).forEach(x => x.setAttribute('aria-pressed', x === b)); run(); });
    $('#mx', el).oninput = run; $$('#r,#fac', el).forEach(i => i.oninput = runSB); $$('#v1,#v2,#vt', el).forEach(i => i.oninput = runG); run(); runSB(); runG();
  };
  /* ---------- retest ---------- */
  R.retest = el => {
    el.innerHTML = `<div class="card stack">${matrixInput('mx', '23 25\n18 20\n30 29\n25 27\n15 17\n28 26\n20 22\n33 32\n22 21\n27 29\n19 18\n24 26', 'كل مستجيب في سطر: درجة التطبيق الأول ثم الثاني')}</div><div id="rr" class="stack"></div>`;
    const run = () => {
      const m = parseMatrix($('#mx', el).value), r = $('#rr', el); if (m.error) return out(r, `<div class="notice warn">${m.error}</div>`); if (m.k !== 2) return out(r, '<div class="notice warn">أدخل عمودين فقط: التطبيق الأول والثاني.</div>');
      const x = m.rows.map(a => a[0]), y = m.rows.map(a => a[1]), rr = PSY.pearson(x, y), [c, t] = relVerdict(rr), n = x.length, tt = rr * Math.sqrt((n - 2) / (1 - rr * rr)), p = PSY.tP2(tt, n - 2); mark('retest');
      const W = 320, H = 240, P = 30, mn = Math.min(...x, ...y), mx = Math.max(...x, ...y), sc = vv => P + (W - 2 * P) * (vv - mn) / ((mx - mn) || 1);
      const pts = x.map((a, i) => `<circle cx="${sc(a)}" cy="${H - sc(y[i]) + 0}" r="4" fill="var(--primary)" opacity=".75"><title>${a} ، ${y[i]}</title></circle>`).join('');
      out(r, `<div class="kpis"><div class="tile hl"><small>معامل الثبات r</small><b>${fmt(rr, 3)}</b></div><div class="tile"><small>n</small><b>${n}</b></div><div class="tile"><small>متوسط التطبيق 1</small><b>${fmt(PSY.mean(x))}</b></div><div class="tile"><small>متوسط التطبيق 2</small><b>${fmt(PSY.mean(y))}</b></div><div class="tile"><small>الدلالة p</small><b>${fmtp(p)}</b></div></div><div class="verdict ${c}">الاستقرار ${t}</div>
        <div class="card chart" style="max-width:420px"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="رسم الانتشار"><line x1="${P}" y1="${H - P}" x2="${W - P}" y2="${H - P}" stroke="var(--line)"/><line x1="${P}" y1="${P}" x2="${P}" y2="${H - P}" stroke="var(--line)"/><line x1="${sc(mn)}" y1="${H - sc(mn)}" x2="${sc(mx)}" y2="${H - sc(mx)}" stroke="var(--amber)" stroke-dasharray="4 4"/>${pts}<text x="${W / 2}" y="${H - 6}" text-anchor="middle">التطبيق الأول</text><text x="10" y="${H / 2}" transform="rotate(-90 10 ${H / 2})" text-anchor="middle">التطبيق الثاني</text></svg></div>
        ${apa(`بلغ معامل ثبات إعادة التطبيق r(${n - 2}) = ${dec(rr)}، p ${fmtp(p).startsWith('<') ? fmtp(p) : '= ' + fmtp(p)}، مما يدل على استقرار ${t.split(' ')[0]} للدرجات عبر الزمن.`)}`); bindCopy(r);
    };
    $('#mx', el).oninput = run; run();
  };
  /* ---------- kappa ---------- */
  R.kappa = el => {
    let size = 2, T = [[20, 6], [4, 20]];
    const draw = () => {
      el.innerHTML = `<div class="card stack"><div class="row"><span class="small muted">عدد الفئات:</span>${seg('sz', [[2, '2'], [3, '3'], [4, '4']], size)}</div><p class="small muted" style="margin:0">الصفوف: تصنيفات المقدِّر الأول، والأعمدة: تصنيفات المقدِّر الثاني.</p><div class="tw"><table><thead><tr><th></th>${T.map((_, j) => `<th>م2: فئة ${j + 1}</th>`).join('')}</tr></thead><tbody>${T.map((r, i) => `<tr><th>م1: فئة ${i + 1}</th>${r.map((c, j) => `<td><input type="number" min="0" data-c="${i},${j}" value="${c}" aria-label="خلية ${i + 1}،${j + 1}" style="min-width:70px"></td>`).join('')}</tr>`).join('')}</tbody></table></div></div><div id="rk" class="stack"></div>`;
      $$('[data-sz]', el).forEach(b => b.onclick = () => { size = +b.dataset.sz; T = Array.from({ length: size }, (_, i) => Array.from({ length: size }, (_, j) => i === j ? 10 : 2)); draw(); });
      $$('[data-c]', el).forEach(i => i.oninput = () => { const [a, b] = i.dataset.c.split(',').map(Number); T[a][b] = Math.max(0, toNum(i.value) || 0); run(); });
      run();
    };
    const run = () => { const k = PSY.kappa(T), r = $('#rk', el); if (!k.N) return out(r, ''); mark('kappa');
      const lab = k.kappa < 0 ? 'أقل من الصدفة' : k.kappa <= 0.2 ? 'ضعيف جدًا' : k.kappa <= 0.4 ? 'ضعيف' : k.kappa <= 0.6 ? 'متوسط' : k.kappa <= 0.8 ? 'جيد' : 'شبه تام';
      out(r, `<div class="kpis"><div class="tile hl"><small>كابا κ</small><b>${fmt(k.kappa, 3)}</b></div><div class="tile"><small>الاتفاق الملاحظ Pₒ</small><b>${fmt(k.po, 3)}</b></div><div class="tile"><small>الاتفاق المتوقع Pₑ</small><b>${fmt(k.pe, 3)}</b></div><div class="tile"><small>N</small><b>${k.N}</b></div></div><div class="verdict ${k.kappa > 0.6 ? 'good' : k.kappa > 0.4 ? 'warn' : 'bad'}">اتفاق ${lab} (لانديس وكوخ، 1977)</div>
        <details class="steps"><summary>خطوات الحل</summary><div class="f">Pₒ = مجموع القطر ÷ N = ${fmt(k.po, 3)}</div><div class="f">Pₑ = Σ (مجموع الصف ÷ N) × (مجموع العمود ÷ N) = ${fmt(k.pe, 3)}</div><div class="f">κ = (${fmt(k.po, 3)} − ${fmt(k.pe, 3)}) ÷ (1 − ${fmt(k.pe, 3)}) = ${fmt(k.kappa, 3)}</div></details>
        ${apa(`بلغ معامل كابا كوهين لاتفاق المقدِّرين κ = ${dec(k.kappa)} (نسبة الاتفاق الملاحظ ${fmt(k.po * 100, 1)}%)، وهو اتفاق ${lab}.`)}`); bindCopy(r); };
    draw();
  };
  /* ---------- content validity ---------- */
  R.content = el => {
    let mode = 'cvr';
    const draw = () => {
      el.innerHTML = `<div class="card stack">${seg('cm', [['cvr', 'CVR (لوشي)'], ['cvi', 'CVI (لين)'], ['aiken', 'معامل V (أيكن)']], mode)}<div id="cin"></div></div><div id="cres" class="stack"></div>`;
      $$('[data-cm]', el).forEach(b => b.onclick = () => { mode = b.dataset.cm; draw(); });
      const ci = $('#cin', el), cr = $('#cres', el);
      if (mode === 'cvr') {
        ci.innerHTML = `<div class="grid3">${num('N', 'عدد المحكمين N', 10)}</div>${matrixInput('mx', '9 1\n10 0\n7 2\n6 3\n8 2\n5 4', 'كل عبارة في سطر: عدد من قالوا «أساسية» ثم (اختياريًا) عدد «مفيدة»')}<label class="row small"><input type="checkbox" id="mod"> استخدم الصيغة المعدلة (تحتسب «مفيدة» بنصف وزن)</label>`;
        const run = () => { const Nn = Math.round(v('N')), m = parseMatrix($('#mx', el).value); if (!(Nn >= 2)) return out(cr, '<div class="notice warn">أدخل عدد المحكمين.</div>'); if (m.error) return out(cr, `<div class="notice warn">${m.error}</div>`); const md = $('#mod', el).checked;
          const exact = PSY.cvrCritical(Nn), law = PSY.lawsheCritical(Nn); mark('content');
          const rows = m.rows.map((r, i) => { const x = md ? PSY.cvrModified(r[0], r[1] || 0, Nn) : PSY.cvr(r[0], Nn); const ok = x >= exact.cvr - 1e-9; return { cls: ok ? '' : 'flag', cells: ['ع' + (i + 1), N(r[0], 0), N(x), ok ? '<span class="chip good">تُقبل</span>' : '<span class="chip bad">تُراجع أو تُحذف</span>'] }; });
          const vals = m.rows.map(r => md ? PSY.cvrModified(r[0], r[1] || 0, Nn) : PSY.cvr(r[0], Nn)), keep = vals.filter(x => x >= exact.cvr - 1e-9);
          out(cr, `<div class="kpis"><div class="tile hl"><small>القيمة الحرجة (أير وسكالي)</small><b>${fmt(exact.cvr)}</b></div><div class="tile"><small>جدول لوشي الأصلي</small><b>${fmt(law)}</b></div><div class="tile"><small>CVI = متوسط CVR للمقبولة</small><b>${keep.length ? fmt(PSY.mean(keep), 3) : '—'}</b></div><div class="tile"><small>عبارات مقبولة</small><b>${keep.length}/${vals.length}</b></div></div>${tableHTML(['العبارة', 'أساسية', 'CVR', 'القرار'], rows)}
            <details class="steps"><summary>المعادلة والقيمة الحرجة</summary><div class="f">CVR = (nₑ − N/2) ÷ (N/2)${md ? '  (المعدلة: nₑ + nₘ/2)' : ''}</div><p class="small">القيمة الحرجة المحسوبة هنا من التوزيع ذي الحدين (اختبار من طرف واحد عند 0.05) كما أعاد حسابها أير وسكالي (2014): يلزم ${exact.ne} محكمين على الأقل من ${Nn} يقولون «أساسية». وجدول لوشي (1975) الأصلي يعطي ${fmt(law)} لهذا العدد.</p></details>`); };
        $$('#N,#mx,#mod', el).forEach(i => i.oninput = run); $('#mod', el).onchange = run; run();
      } else if (mode === 'cvi') {
        ci.innerHTML = matrixInput('mx', '4 4 3 4 4 3\n3 4 4 4 3 4\n2 3 2 3 4 2\n4 4 4 4 4 4\n3 3 4 2 3 3', 'كل عبارة في سطر، والأعمدة تقديرات المحكمين للصلة (1–4)');
        const run = () => { const m = parseMatrix($('#mx', el).value); if (m.error) return out(cr, `<div class="notice warn">${m.error}</div>`); const Rj = m.rows[0].map((_, j) => m.rows.map(r => r[j])); const c = PSY.cvi(Rj); mark('content');
          out(cr, `<div class="kpis"><div class="tile hl"><small>S‑CVI/Ave</small><b>${fmt(c.scviAve, 3)}</b></div><div class="tile"><small>S‑CVI/UA</small><b>${fmt(c.scviUA, 3)}</b></div><div class="tile"><small>المحكمون</small><b>${c.J}</b></div></div>
            ${tableHTML(['العبارة', 'I‑CVI', 'كابا المعدل k*', 'الحكم'], c.icvi.map((x, i) => { const ok = x >= (c.J <= 5 ? 1 : 0.78); return { cls: ok ? '' : 'flag', cells: ['ع' + (i + 1), N(x), N(c.kstar[i]), ok ? '<span class="chip good">ممتازة</span>' : '<span class="chip bad">تُراجع</span>'] }; }))}
            <div class="notice small">المحك: I‑CVI = 1 عند 5 محكمين فأقل، و≥ 0.78 عند 6 محكمين فأكثر (لين، 1986)، وS‑CVI/Ave ≥ 0.90 (بوليت وبيك، 2006). كابا المعدل يصحح احتمال الاتفاق بالصدفة.</div>`); };
        $('#mx', el).oninput = run; run();
      } else {
        ci.innerHTML = `<div class="grid3">${num('lo', 'أدنى تقدير', 1)}${num('c', 'عدد فئات التقدير c', 4)}</div>` + matrixInput('mx', '4 4 3 4 3\n3 3 4 4 4\n2 3 2 3 2', 'كل عبارة في سطر، والأعمدة تقديرات المحكمين');
        const run = () => { const lo = v('lo'), c = v('c'), m = parseMatrix($('#mx', el).value); if (m.error) return out(cr, `<div class="notice warn">${m.error}</div>`); mark('content');
          const rows = m.rows.map((r, i) => { const a = PSY.aikenV(r, lo, c); return { cls: a.V < 0.7 ? 'flag' : '', cells: ['ع' + (i + 1), N(a.S, 0), N(a.V, 3), a.V >= 0.8 ? '<span class="chip good">مرتفع</span>' : a.V >= 0.7 ? '<span class="chip warn">مقبول</span>' : '<span class="chip bad">منخفض</span>'] }; });
          out(cr, tableHTML(['العبارة', 'S = Σ(التقدير − الأدنى)', 'V', 'الحكم'], rows) + `<div class="f">V = S ÷ [n × (c − 1)]</div><p class="small muted">يُحكم على دلالة V بجداول أيكن (1985) بحسب عدد المحكمين والفئات؛ والمحك المتداول عمليًا 0.70–0.80.</p>`); };
        $$('#lo,#c,#mx', el).forEach(i => i.oninput = run); run();
      }
    };
    draw();
  };
  /* ---------- item analysis ---------- */
  R.items = el => {
    el.innerHTML = `<div class="card stack">${matrixInput('mx', EX_BIG)}<div class="row"><button class="btn sm ghost" data-ex="big">بيانات ليكرت محاكاة</button><button class="btn sm ghost" data-ex="bin">بيانات ثنائية</button><span class="small muted">نسبة المجموعتين الطرفيتين:</span><input type="number" id="frac" value="27" style="width:90px" aria-label="النسبة المئوية"></div></div><div id="ri" class="stack"></div>`;
    $$('[data-ex]', el).forEach(b => b.onclick = () => { $('#mx', el).value = b.dataset.ex === 'bin' ? EX_BIN : EX_BIG; run(); });
    const run = () => {
      const m = parseMatrix($('#mx', el).value), r = $('#ri', el); if (m.error) return out(r, `<div class="notice warn">${m.error}</div>`); if (m.n < 6) return out(r, '<div class="notice warn">تحتاج 6 مستجيبين على الأقل.</div>');
      const fr = Math.min(0.5, Math.max(0.1, v('frac') / 100)), bin = m.rows.every(x => x.every(y => y === 0 || y === 1)); mark('items');
      if (bin) {
        const d = PSY.difficultyDiscrimination(m.rows, fr);
        out(r, `<div class="notice small">بيانات ثنائية: الصعوبة p = نسبة الإجابة الصحيحة، والتمييز D = (ع − د) ÷ ن لكل مجموعة طرفية (ن = ${d.g}).</div>${tableHTML(['الفقرة', 'p (السهولة)', 'ع (العليا)', 'د (الدنيا)', 'D', 'الارتباط الثنائي المتسلسل النقطي', 'الحكم'], d.items.map((x, j) => { const dd = x.D; const lab = dd >= 0.4 ? ['good', 'تمييز جيد جدًا'] : dd >= 0.3 ? ['good', 'تمييز جيد'] : dd >= 0.2 ? ['warn', 'مقبول/يُحسَّن'] : ['bad', dd < 0 ? 'سالب: راجع المفتاح' : 'ضعيف']; return { cls: dd < 0.2 ? 'flag' : '', cells: ['ف' + (j + 1), N(x.p), N(x.U, 0), N(x.L, 0), N(x.D), N(x.rpb), `<span class="chip ${lab[0]}">${lab[1]}</span>`] }; }))}<p class="small muted">تصنيف إيبل للتمييز: ≥ 0.40 جيد جدًا، 0.30–0.39 جيد، 0.20–0.29 حدّي، أقل من 0.20 ضعيف.</p>`);
      } else {
        const s = PSY.itemStats(m.rows), e = PSY.extremeGroups(m.rows, fr);
        out(r, `<div class="notice small">بيانات متعددة الدرجات: مقارنة متوسطي المجموعتين الطرفيتين (ن = ${e.g} لكل مجموعة) باختبار ت لعينتين مستقلتين (ويلش)، مع الارتباط المصحح بالدرجة الكلية.</div>${tableHTML(['العبارة', 'المتوسط', 'متوسط العليا', 'متوسط الدنيا', 't', 'p', 'r المصحح', 'الحكم'], e.items.map((x, j) => { const ok = x.p < 0.05 && s.rit[j] >= 0.3; return { cls: ok ? '' : 'flag', cells: ['ع' + (j + 1), N(s.itemMean[j]), N(x.mHi), N(x.mLo), N(x.t), { n: 1, v: fmtp(x.p) }, N(s.rit[j]), ok ? '<span class="chip good">مميزة</span>' : '<span class="chip bad">تُراجع</span>'] }; }))}`);
      }
    };
    $$('#mx,#frac', el).forEach(i => i.oninput = run); run();
  };
  /* ---------- scores ---------- */
  R.scores = el => {
    el.innerHTML = `<div class="grid2"><div class="card stack"><h3>الدرجة المعيارية والخطأ المعياري</h3><div class="grid3">${num('m', 'المتوسط', 146.5)}${num('s', 'الانحراف المعياري', 15.95)}${num('rel', 'معامل الثبات', 0.86)}${num('x', 'درجة الفرد', 160)}</div><div id="r1"></div></div>
      <div class="card stack"><h3>المتوسط النظري ومستويات الاستجابة</h3><div class="grid3">${num('k', 'عدد العبارات', 42)}${num('lo', 'أدنى تقدير', 1)}${num('hi', 'أعلى تقدير', 5)}${num('nl', 'عدد المستويات', 3)}</div><div id="r2"></div></div></div>`;
    const r1 = () => { const m = v('m'), s = v('s'), rel = v('rel'), x = v('x'); if (!(s > 0)) return; const z = (x - m) / s, T = 50 + 10 * z, pr = PSY.ncdf(z) * 100, se = PSY.sem(s, rel); mark('scores');
      out($('#r1', el), `<div class="kpis"><div class="tile"><small>z</small><b>${fmt(z, 3)}</b></div><div class="tile hl"><small>T</small><b>${fmt(T, 1)}</b></div><div class="tile"><small>المئين (اعتدالي)</small><b>${fmt(pr, 1)}</b></div><div class="tile"><small>SEM</small><b>${fmt(se, 2)}</b></div></div><div class="f">فترة الثقة 95% = ${x} ± 1.96 × ${fmt(se, 2)} = [${fmt(x - 1.96 * se, 1)} ، ${fmt(x + 1.96 * se, 1)}]</div><p class="small muted">الدرجة الحقيقية للفرد تقع غالبًا في هذه الفترة؛ لذلك تُفسَّر الفروق الصغيرة حول درجات القطع بحذر.</p>`); };
    const r2 = () => { const k = v('k'), lo = v('lo'), hi = v('hi'), nl = Math.max(2, Math.round(v('nl'))); if (!(k > 0 && hi > lo)) return; const L = PSY.levels(lo, hi, nl), names = nl === 3 ? ['منخفض', 'متوسط', 'مرتفع'] : nl === 5 ? ['منخفض جدًا', 'منخفض', 'متوسط', 'مرتفع', 'مرتفع جدًا'] : L.ranges.map((_, i) => 'المستوى ' + (i + 1)); mark('scores');
      out($('#r2', el), `<div class="kpis"><div class="tile hl"><small>المتوسط النظري للمقياس</small><b>${fmt(k * (lo + hi) / 2, 1)}</b></div><div class="tile"><small>مدى الدرجة الكلية</small><b>${k * lo}–${k * hi}</b></div><div class="tile"><small>طول الفئة</small><b>${fmt(L.width, 2)}</b></div></div>${tableHTML(['المستوى', 'متوسط العبارة', 'الدرجة الكلية'], L.ranges.map((r, i) => [names[i], { n: 1, v: fmt(r[0], 2) + ' – ' + fmt(r[1], 2) }, { n: 1, v: fmt(r[0] * k, 1) + ' – ' + fmt(r[1] * k, 1) }]))}<p class="small muted">هذا تقسيم وصفي اصطلاحي، وليس معيارًا محكيًا ولا معياريًا؛ وللحكم المعياري استخدم الرتب المئينية لعينة التقنين.</p>`); };
    $$('#m,#s,#rel,#x', el).forEach(i => i.oninput = r1); $$('#k,#lo,#hi,#nl', el).forEach(i => i.oninput = r2); r1(); r2();
  };
  /* ---------- omega ---------- */
  R.omega = el => {
    el.innerHTML = `<div class="card stack"><div class="field"><label class="fl" for="ld">التشبعات المعيارية للعبارات (مفصولة بمسافة)</label><input type="text" id="ld" class="ltr" value="0.70 0.65 0.80 0.60 0.75"></div></div><div id="ro" class="stack"></div>`;
    const run = () => { const L = parseNums($('#ld', el).value).filter(x => Math.abs(x) <= 1), r = $('#ro', el); if (L.length < 2) return out(r, '<div class="notice warn">أدخل تشبعين على الأقل بين −1 و1.</div>'); const o = PSY.omega(L), [c, t] = relVerdict(o.omega); mark('omega');
      out(r, `<div class="kpis"><div class="tile hl"><small>أوميغا ω (= الثبات المركب CR)</small><b>${fmt(o.omega, 3)}</b></div><div class="tile ${o.ave >= 0.5 ? 'good' : 'bad'}"><small>متوسط التباين المستخلص AVE</small><b>${fmt(o.ave, 3)}</b></div><div class="tile"><small>√AVE</small><b>${fmt(Math.sqrt(o.ave), 3)}</b></div></div><div class="verdict ${c}">الثبات ${t}؛ ${o.ave >= 0.5 ? 'والصدق التقاربي متحقق (AVE ≥ 0.50)' : 'والصدق التقاربي غير متحقق (AVE < 0.50)'}</div>
        <details class="steps"><summary>خطوات الحل</summary><div class="f">Σλ = ${fmt(o.sl, 3)} ← (Σλ)² = ${fmt(o.sl2, 3)}</div><div class="f">Σθ = Σ(1 − λ²) = ${o.theta.map(x => fmt(x, 3)).join(' + ')} = ${fmt(o.st, 3)}</div><div class="f">ω = ${fmt(o.sl2, 3)} ÷ (${fmt(o.sl2, 3)} + ${fmt(o.st, 3)}) = ${fmt(o.omega, 3)}</div><div class="f">AVE = متوسط λ² = ${fmt(o.ave, 3)}</div><p class="small muted">للصدق التمييزي (فورنل ولاركر، 1981): يجب أن يزيد √AVE لكل بعد على ارتباطه بالأبعاد الأخرى.</p></details>`); };
    $('#ld', el).oninput = run; run();
  };
  /* ---------- DIF ---------- */
  R.dif = el => {
    el.innerHTML = `<div class="card stack"><p class="small muted" style="margin:0">قسّم المستجيبين إلى طبقات بحسب الدرجة الكلية، واكتب لكل طبقة في سطر: a = المرجعية صحيح/موافق، b = المرجعية خطأ، c = المستهدفة صحيح، d = المستهدفة خطأ.</p>${matrixInput('mx', '12 8 8 12\n20 10 14 16\n25 5 20 10\n18 2 16 4', 'a b c d لكل طبقة')}</div><div id="rd" class="stack"></div>`;
    const run = () => { const m = parseMatrix($('#mx', el).value), r = $('#rd', el); if (m.error) return out(r, `<div class="notice warn">${m.error}</div>`); if (m.k !== 4) return out(r, '<div class="notice warn">أدخل أربعة أعمدة a b c d لكل طبقة.</div>'); const x = PSY.mantelHaenszel(m.rows.map(q => ({ a: q[0], b: q[1], c: q[2], d: q[3] }))); mark('dif');
      const lab = { A: ['good', 'A: أداء تفاضلي ضئيل أو غير دال'], B: ['warn', 'B: أداء تفاضلي متوسط'], C: ['bad', 'C: أداء تفاضلي كبير'] }[x.cls];
      out(r, `<div class="kpis"><div class="tile"><small>α_MH</small><b>${fmt(x.alphaMH, 3)}</b></div><div class="tile hl"><small>Δ_MH</small><b>${fmt(x.delta, 2)}</b></div><div class="tile"><small>χ²_MH</small><b>${fmt(x.chi, 3)}</b></div><div class="tile"><small>p</small><b>${fmtp(x.p)}</b></div></div><div class="verdict ${lab[0]}">${lab[1]}</div>
        <details class="steps"><summary>المعادلات</summary><div class="f">α_MH = Σ(a·d/N) ÷ Σ(b·c/N)</div><div class="f">Δ_MH = −2.35 × ln(α_MH)</div><div class="f">χ²_MH = (|Σa − ΣE(a)| − 0.5)² ÷ ΣVar(a)</div><p class="small muted">Δ سالبة تعني أن المفردة أصعب على المجموعة المستهدفة. التصنيف: A إذا |Δ| < 1 أو غير دال، B إذا 1 ≤ |Δ| < 1.5، C إذا |Δ| ≥ 1.5 (هيئة الاختبارات التربوية؛ Zwick, 2012، بصورة مبسطة). والإشارة الإحصائية لا تكفي للحكم بالتحيز: تُراجع صياغة المفردة ومحتواها.</p></details>`); };
    $('#mx', el).oninput = run; run();
  };
  /* ---------- EFA ---------- */
  R.efa = el => {
    el.innerHTML = `<div class="card stack">${matrixInput('mx', EX_BIG)}<div class="row"><span class="small muted">عدد العوامل:</span><input type="number" id="nf" value="" placeholder="تلقائي" style="width:110px" aria-label="عدد العوامل"><button class="btn sm" id="go">${ic('play')} حلّل</button></div></div><div id="re" class="stack"></div>`;
    const run = () => {
      const m = parseMatrix($('#mx', el).value), r = $('#re', el); if (m.error) return out(r, `<div class="notice warn">${m.error}</div>`);
      if (m.k < 3 || m.n < m.k + 2) return out(r, '<div class="notice warn">تحتاج 3 عبارات على الأقل، وعدد مستجيبين أكبر من عدد العبارات.</div>');
      r.innerHTML = '<p class="muted">جارٍ الحساب…</p>';
      setTimeout(() => {
        const R0 = PSY.corrMatrix(m.rows), km = PSY.kmo(R0), bt = PSY.bartlett(R0, m.n), eig = PSY.jacobiEigen(R0).values, pa = PSY.parallelAnalysis(m.n, m.k, 30);
        const kaiser = eig.filter(x => x > 1).length, par = eig.filter((x, i) => x > pa.p95[i]).length || 1, nfIn = Math.round(v('nf')), nf = nfIn > 0 ? Math.min(nfIn, m.k - 1) : par;
        const fa = PSY.efa(m.rows, nf), L = fa.rotated; mark('efa');
        const kv = km ? km.kmo : NaN, kl = kv >= 0.9 ? 'رائع' : kv >= 0.8 ? 'جدير بالتقدير' : kv >= 0.7 ? 'متوسط' : kv >= 0.6 ? 'مقبول' : 'غير مقبول';
        out(r, `<div class="kpis"><div class="tile ${kv >= 0.6 ? 'good' : 'bad'}"><small>KMO</small><b>${fmt(kv, 3)}</b></div><div class="tile ${bt.p < 0.05 ? 'good' : 'bad'}"><small>بارتلت χ² (df = ${bt.df})</small><b>${fmt(bt.chi, 1)}</b></div><div class="tile"><small>دلالة بارتلت</small><b>${fmtp(bt.p)}</b></div><div class="tile"><small>عوامل كايزر (جذر > 1)</small><b>${kaiser}</b></div><div class="tile hl"><small>عوامل التحليل الموازي</small><b>${par}</b></div></div>
          <div class="verdict ${kv >= 0.6 && bt.p < 0.05 ? 'good' : 'bad'}">ملاءمة البيانات للتحليل العاملي: KMO ${kl}${bt.p < 0.05 ? '، واختبار بارتلت دال' : '، واختبار بارتلت غير دال'}</div>
          <section class="card"><h3>${ic('chart')} منحنى الجذور الكامنة مع التحليل الموازي</h3>${barSVG(eig, eig.map((_, i) => String(i + 1)), { line: pa.p95, ref: 1, refLabel: 'جذر = 1', label: 'الجذور الكامنة', color: (x, i) => x > pa.p95[i] ? 'var(--primary)' : 'var(--line)' })}<p class="small muted">الأعمدة: الجذور الكامنة للبيانات، والخط المتقطع: المئين 95 لجذور بيانات عشوائية بالحجم نفسه (هورن، 1965). يُحتفظ بالعوامل التي تتجاوز جذورها الخط.</p>
          ${tableHTML(['العامل', 'الجذر الكامن', '% التباين', 'المئين 95 العشوائي'], eig.slice(0, Math.min(8, eig.length)).map((x, i) => [String(i + 1), N(x, 3), N(fa.varExp[i], 1), N(pa.p95[i], 3)]))}</section>
          <section class="card"><h3>تشبعات المكونات الأساسية بعد تدوير فاريماكس (${nf} ${nf === 1 ? 'عامل' : 'عوامل'})</h3>${tableHTML(['العبارة', ...L[0].map((_, f) => 'ع' + (f + 1)), 'الشيوع h²', 'MSA'], L.map((row, i) => { const mx = Math.max(...row.map(Math.abs)), cross = row.filter(x => Math.abs(x) >= 0.3).length > 1; return { cls: mx < 0.4 ? 'flag' : '', cells: [(m.head && m.head[i]) ? esc(m.head[i]) : 'ع' + (i + 1), ...row.map(x => ({ n: 1, v: Math.abs(x) === mx && mx >= 0.4 ? `<b>${fmt(x)}</b>` : fmt(x) })), N(PSY.sum(row.map(x => x * x))), N(km ? km.msa[i] : NaN)].concat([]) }; }))}<p class="small muted">العبارة المظللة تشبعها الأعلى أقل من 0.40. والتشبعات المتقاطعة (≥ 0.30 على أكثر من عامل) تستدعي مراجعة الصياغة. هذا تحليل مكونات أساسية تقريبي للاستكشاف؛ وللنشر يُفضَّل تحليل المحاور الأساسية أو الأرجحية العظمى ثم التحليل العاملي التوكيدي على عينة مستقلة.</p></section>`);
      }, 20);
    };
    $('#go', el).onclick = run; run();
  };
  /* ---------- sample size ---------- */
  R.sample = el => {
    el.innerHTML = `<div class="card stack">${num('k', 'عدد عبارات المقياس', 30)}</div><div id="rsz"></div>`;
    const run = () => { const k = Math.max(1, Math.round(v('k'))); mark('sample');
      out($('#rsz', el), tableHTML(['المرحلة', 'الحجم المقترح', 'المرجع'], [
        ['المقابلات المعرفية', '5–15 فردًا من الفئة المستهدفة', 'Willis (2005)'],
        ['التجريب الاستطلاعي', '30 فردًا تقريبًا', 'متداول'],
        ['تحليل العبارات والثبات', `${Math.max(100, 5 * k)} فأكثر (5 أفراد لكل عبارة)`, 'Nunnally & Bernstein (1994)'],
        ['التحليل العاملي الاستكشافي', `${Math.max(200, 10 * k)} (10 لكل عبارة) وحد أدنى 200؛ 300 جيد، 500 جيد جدًا`, 'Comrey & Lee (1992)؛ Costello & Osborne (2005)'],
        ['التحليل العاملي التوكيدي', '200 فأكثر في عينة مستقلة عن الاستكشافية', 'Boateng et al. (2018)'],
        ['فحص الأداء التفاضلي', '200 فأكثر في كل مجموعة مقارنة', 'متداول في دراسات مانتل–هانزل'],
        ['إعادة التطبيق', '50 فأكثر بفاصل نحو أسبوعين', 'متداول']]) + '<p class="small muted">هذه قواعد إرشادية؛ والحجم المطلوب فعليًا يتوقف على قوة التشبعات وعدد العبارات لكل عامل ودرجة الاشتراكيات.</p>'); };
    $('#k', el).oninput = run; run();
  };

  /* ---------- formulas page ---------- */
  const FX = [
    ['الثبات', 'ألفا كرونباخ', "Cronbach's α", `α = ${frac('k', 'k − 1')} × [1 − ${frac('Σσ²ᵢ', 'σ²ₓ')}]`, [['k', 'عدد العبارات'], ['σ²ᵢ', 'تباين العبارة'], ['σ²ₓ', 'تباين الدرجة الكلية']], 'الاتساق الداخلي لفقرات متعددة الدرجات', 'alpha'],
    ['الثبات', 'كودر–ريتشاردسون 20', 'KR‑20', `KR‑20 = ${frac('k', 'k − 1')} × [1 − ${frac('Σpq', 'σ²ₓ')}]`, [['p', 'نسبة الصواب في الفقرة'], ['q', '1 − p']], 'الفقرات ثنائية الدرجة', 'kr'],
    ['الثبات', 'كودر–ريتشاردسون 21', 'KR‑21', `KR‑21 = ${frac('k', 'k − 1')} × [1 − ${frac('M(k − M)', 'k σ²ₓ')}]`, [['M', 'متوسط الدرجات']], 'فقرات ثنائية متقاربة الصعوبة', 'kr'],
    ['الثبات', 'سبيرمان–براون', 'Spearman–Brown', `r_SB = ${frac('2r', '1 + r')}`, [['r', 'الارتباط بين النصفين']], 'تصحيح التجزئة النصفية؛ وصيغته العامة n·r ÷ [1 + (n − 1)r] لإطالة المقياس n مرة', 'split'],
    ['الثبات', 'جتمان للتجزئة النصفية', 'Guttman split‑half', `r = 2 × [1 − ${frac('σ²₁ + σ²₂', 'σ²ₓ')}]`, [['σ²₁، σ²₂', 'تباينا النصفين']], 'عند عدم تساوي تبايني النصفين', 'split'],
    ['الثبات', 'إعادة الاختبار', 'Test–retest', `r = ${frac('Cov(X₁, X₂)', 'σ₁ σ₂')}`, [['X₁، X₂', 'درجات التطبيقين']], 'استقرار الدرجات عبر الزمن', 'retest'],
    ['الثبات', 'كابا كوهين', "Cohen's κ", `κ = ${frac('Pₒ − Pₑ', '1 − Pₑ')}`, [['Pₒ', 'الاتفاق الملاحظ'], ['Pₑ', 'الاتفاق المتوقع بالصدفة']], 'اتفاق مقدِّرين على تصنيف اسمي', 'kappa'],
    ['الثبات', 'أوميغا ماكدونالد', "McDonald's ω", `ω = ${frac('(Σλ)²', '(Σλ)² + Σθ')}`, [['λ', 'التشبع المعياري'], ['θ', '1 − λ²']], 'الاتساق الداخلي مع تشبعات غير متساوية', 'omega'],
    ['الثبات', 'الخطأ المعياري للقياس', 'SEM', 'SEM = σ √(1 − r)', [['σ', 'الانحراف المعياري'], ['r', 'معامل الثبات']], 'فترة الثقة للدرجة الفردية: X ± 1.96 SEM', 'scores'],
    ['الصدق', 'نسبة صدق المحتوى', 'Lawshe CVR', `CVR = ${frac('nₑ − N/2', 'N/2')}`, [['nₑ', 'عدد من قالوا «أساسية»'], ['N', 'عدد المحكمين']], 'قبول العبارة إذا تجاوزت القيمة الحرجة لعدد المحكمين', 'content'],
    ['الصدق', 'مؤشر صدق المحتوى للعبارة', 'I‑CVI', `I‑CVI = ${frac('عدد التقديرات 3 أو 4', 'عدد المحكمين')}`, [['S‑CVI/Ave', 'متوسط I‑CVI']], 'I‑CVI ≥ 0.78 مع 6 محكمين فأكثر', 'content'],
    ['الصدق', 'معامل V لأيكن', "Aiken's V", `V = ${frac('Σ(r − lo)', 'n(c − 1)')}`, [['r', 'تقدير المحكم'], ['lo', 'أدنى تقدير'], ['c', 'عدد الفئات']], 'اتفاق المحكمين على تدريج متعدد الدرجات', 'content'],
    ['الصدق', 'متوسط التباين المستخلص', 'AVE', `AVE = ${frac('Σλ²', 'k')}`, [['λ', 'التشبع المعياري']], 'الصدق التقاربي: AVE ≥ 0.50', 'omega'],
    ['تحليل الفقرات', 'معامل الصعوبة (السهولة)', 'Item difficulty', `p = ${frac('عدد الإجابات الصحيحة', 'عدد المجيبين')}`, [], 'كلما ارتفع p كانت الفقرة أسهل', 'items'],
    ['تحليل الفقرات', 'معامل التمييز', 'Discrimination D', `D = ${frac('ع − د', 'ن')}`, [['ع، د', 'الإجابات الصحيحة في المجموعتين العليا والدنيا'], ['ن', 'حجم كل مجموعة (27%)']], 'من −1 إلى +1؛ ≥ 0.30 جيد', 'items'],
    ['الدرجات', 'الدرجة الزائية والتائية', 'z, T', `z = ${frac('X − M', 'σ')}  ؛  T = 50 + 10z`, [], 'تحويل الدرجات الخام إلى معايير', 'scores'],
    ['الدرجات', 'طول الفئة للمستويات', 'Class width', `w = ${frac('أعلى تقدير − أدنى تقدير', 'عدد المستويات')}`, [], 'تقسيم وصفي للمتوسطات (مثل 1.33 لخماسي بثلاثة مستويات)', 'scores'],
    ['العدالة', 'دلتا مانتل–هانزل', 'MH D‑DIF', 'Δ_MH = −2.35 ln(α_MH)', [['α_MH', 'نسبة الأرجحية المشتركة']], 'تصنيف A/B/C للأداء التفاضلي', 'dif'],
    ['البنية العاملية', 'اختبار بارتلت للكروية', "Bartlett's test", 'χ² = −[n − 1 − (2p + 5)/6] ln|R|', [['p', 'عدد العبارات'], ['|R|', 'محدد مصفوفة الارتباط']], 'يجب أن يكون دالًا لملاءمة التحليل العاملي', 'efa']
  ];
  VIEWS.formulas = el => {
    const cats = [...new Set(FX.map(f => f[0]))];
    el.innerHTML = `<div class="section-title"><h2>المعادلات</h2><span class="muted small">كل معادلة مع رموزها ومتى تُستخدم، وزر لتجربتها في المعمل</span></div><button class="linkcard" data-golaws style="width:100%;margin-bottom:14px;--c:var(--violet);--s:var(--violet-soft)"><span class="ic">${ic('sigma')}</span><span><b>الجديد: 75 قانونًا تفاعليًا</b><span>15 معادلة لبناء المقاييس (ثرستون، ليكرت، جتمان، كابا، مانتل-هانزل، ICC، الخطأ المعياري للقياس، AVE وHTMT، مؤشر صدق المحتوى…) و60 قانونًا إحصائيًا، لكل منها حاسبة بأرقامك</span></span></button>` +
      cats.map(c => `<section class="stack"><h3 style="font-size:18px">${esc(c)}</h3><div class="grid2">${FX.filter(f => f[0] === c).map(f => `<article class="card formula-card"><div class="row"><b class="grow" style="font-family:var(--f-display)">${esc(f[1])}</b><span class="chip ltr">${esc(f[2])}</span></div><div class="fbox">${f[3]}</div>${f[4].length ? `<dl class="sym">${f[4].map(s => `<dt>${s[0]}</dt><dd>${esc(s[1])}</dd>`).join('')}</dl>` : ''}<p class="small muted" style="margin:0">${esc(f[5])}</p><div><button class="btn sm soft" data-try="${f[6]}">${ic('flask')} جرّب في المعمل</button></div></article>`).join('')}</div></section>`).join('') +
      `<section class="card"><h3>${ic('shield')} تفسير قيم الثبات</h3>${tableHTML(['القيمة', 'التفسير'], [['≥ 0.90', 'ممتاز، مناسب للقرارات الفردية'], ['0.80 – 0.89', 'جيد'], ['0.70 – 0.79', 'مقبول للأغراض البحثية'], ['< 0.70', 'ضعيف؛ يُراجع المقياس']])}<p class="small muted">محكات اصطلاحية؛ ولكابا: 0.41–0.60 متوسط، 0.61–0.80 جيد، > 0.80 شبه تام (لانديس وكوخ، 1977).</p></section>`;
    $$('[data-try]', el).forEach(b => b.onclick = () => open(b.dataset.try));
    const gl = $('[data-golaws]', el); if (gl) gl.onclick = () => go('laws');
  };

  return { list, open, clear: () => { openId = null; } };
})();

/* ===== Scale builder: 12-step wizard, data collection, live analysis ===== */
const SCALES = (() => {
  const K = 'scaleslab-scales-v1';
  let all = LS.get(K, []);
  const Cl = { push: null };
  const list = () => all;
  const get = id => all.find(s => s.id === id);
  let t = null;
  function save(s) { s.updated = Date.now(); const i = all.findIndex(x => x.id === s.id); if (i < 0) all.unshift(s); else all[i] = s; LS.set(K, all); clearTimeout(t); if (Cl.push) t = setTimeout(() => Cl.push(s), 1200); }
  function remove(id) { all = all.filter(s => s.id !== id); LS.set(K, all); Cl.remove && Cl.remove(id); }
  function merge(remote) { remote.forEach(r => { const l = get(r.id); if (!l || (r.updated || 0) > (l.updated || 0)) { const i = all.findIndex(x => x.id === r.id); if (i < 0) all.push(r); else all[i] = r; } }); LS.set(K, all); }
  return { list, get, save, remove, merge, cloud: Cl };
})();

/* ===== «مكتبة الاختبارات» (#tests), shared by both labs.
   Questionnaires: free published instruments in working Arabic translations (for teaching; research needs the validated
   Arabic versions): Mini-IPIP (Donnellan et al., 2006), Rosenberg Self-Esteem (1965), PSS-10 (Cohen & Williamson, 1988),
   SWLS (Diener et al., 1985), Brief Resilience Scale (Smith et al., 2008), UCLA-3 (Hughes et al., 2004), Grit-S
   (Duckworth & Quinn, 2009), ERQ (Gross & John, 2003), ASRS v1.1 Part A (WHO; Kessler et al., 2005).
   Cognitive tasks are generated by the lab (no copyrighted items): matrix reasoning, number series, verbal analogies,
   mental rotation and symbol coding. They give a profile of accuracy and speed, not an IQ (no norms yet).
   Results stay in this browser; if the person agreed in «اعرف نفسك» to share with the admin, they are copied to tests/{uid}. ===== */
var TESTS = (function () {
  var KEY = 'tests-v1', st = (function () { try { return JSON.parse(localStorage.getItem(KEY) || 'null') || { r: {} }; } catch (e) { return { r: {} }; } })();
  var save = function () { try { localStorage.setItem(KEY, JSON.stringify(st)); } catch (e) { } };
  var E = function (s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  var say = function (m) { try { toast(m); } catch (e) { } };
  var xp = function (n) { try { if (typeof addXP === 'function') addXP(n); } catch (e) { } };
  var fsOK = function () { try { return !!(window.ACCT && ACCT.fs && ACCT.fs.ready()); } catch (e) { return false; } };
  var shared = function () { return !!(window.PRIVACY && PRIVACY.ok()); };
  window.addEventListener('privacy-accepted', function () { sync(); });
  async function sync() { if (!shared() || !fsOK()) return; try { await ACCT.fs.set('tests/' + ACCT.fs.uid(), { name: (ACCT.fs.name() || '').slice(0, 60), email: ACCT.fs.email(), consent: true, results: JSON.stringify(Object.assign({}, st.r, { _p: (function () { try { if (typeof S === 'undefined' || !S) return null; var d = S.done || {}, n = Object.keys(d).filter(function (k) { return d[k]; }).length; return { xp: S.xp || 0, lessons: n, streak: S.streak || 0, site: document.title.indexOf('الإحصاء') >= 0 ? 'stats' : 'scales', at: Date.now() }; } catch (e) { return null; } })() })).slice(0, 59000), done: Object.keys(st.r).length }); } catch (e) { } }
  var A5 = ['لا تنطبق إطلاقًا', 'لا تنطبق', 'محايد', 'تنطبق', 'تنطبق تمامًا'];
  /* ---------- questionnaires: [text, reversed, subscale] ---------- */
  var Q = {
    bigfive: { t: 'العوامل الخمسة الكبرى للشخصية', s: 'Mini-IPIP · 20 عبارة', dom: 'الشخصية', ref: 'Donnellan et al., 2006 (بنك IPIP، ملكية عامة)', opts: A5, min: 1, inst: 'اقرأ كل عبارة واختار قد إيه بتوصفك عمومًا، مش زي ما تحب تكون.',
      sub: { E: 'الانبساط', A: 'الطيبة (المقبولية)', C: 'يقظة الضمير', N: 'العصابية (التقلب الانفعالي)', O: 'الانفتاح على الخبرة' },
      it: [['أنا روح أي قعدة', 0, 'E'], ['أتعاطف مع مشاعر الآخرين', 0, 'A'], ['أخلّص المهام المطلوبة مني على طول', 0, 'C'], ['مزاجي بيتقلب كتير', 0, 'N'], ['خيالي واسع', 0, 'O'], ['مبتكلمش كتير', 1, 'E'], ['مشاكل الناس مش بتهمني', 1, 'A'], ['كتير بنسى أرجّع الحاجات مكانها', 1, 'C'], ['أنا هادي معظم الوقت', 1, 'N'], ['الأفكار المجردة مش بتشدني', 1, 'O'], ['بتكلم مع ناس كتير مختلفين في المناسبات', 0, 'E'], ['بحس بمشاعر اللي حواليا', 0, 'A'], ['بحب النظام', 0, 'C'], ['بتضايق بسهولة', 0, 'N'], ['بلاقي صعوبة في فهم الأفكار المجردة', 1, 'O'], ['بفضّل أفضل في الخلفية', 1, 'E'], ['مش مهتم بالناس أوي', 1, 'A'], ['بلخبط الحاجات', 1, 'C'], ['نادرًا ما بحس بالحزن', 1, 'N'], ['خيالي مش قوي', 1, 'O']],
      score: function (a) { return subMeans(this, a); }, show: function (r) { return Object.keys(this.sub).map(function (k) { return [this.sub[k], r.sub[k], lvl5(r.sub[k])]; }, this); },
      read: 'كل عامل من 1 لـ 5. العوامل الخمسة هي أقوى نموذج مدعوم للشخصية عبر الثقافات (McCrae & Costa). مفيش «شخصية أحسن»: كل مستوى ليه مزايا وتكاليف. مثلًا يقظة الضمير العالية بتتنبأ بالأداء الدراسي، والانفتاح العالي مرتبط بالإبداع.' },
    rses: { t: 'تقدير الذات', s: 'مقياس روزنبرج · 10 عبارات', dom: 'الذات والرفاهية', ref: 'Rosenberg, 1965 (ملكية عامة)', opts: ['أعترض بشدة', 'أعترض', 'أوافق', 'أوافق بشدة'], min: 0, inst: 'العبارات دي عن نظرتك لنفسك عمومًا.',
      it: [['عمومًا أنا راضي عن نفسي', 0], ['ساعات بحس إني مش كويس خالص', 1], ['بحس إن عندي صفات حلوة كتير', 0], ['أقدر أعمل الحاجات زي أغلب الناس', 0], ['بحس إن مفيش حاجات كتير أفتخر بيها', 1], ['أكيد ساعات بحس إني ملوش لازمة', 1], ['بحس إني شخص ليه قيمة، على الأقل زي غيري', 0], ['نفسي أحترم نفسي أكتر', 1], ['في الآخر بميل إني أحس إني فاشل', 1], ['بتعامل مع نفسي بنظرة إيجابية', 0]],
      score: function (a) { return { total: sumR(this, a, 3) }; }, show: function (r) { return [['الدرجة (0–30)', r.total, r.total < 15 ? ['r', 'منخفض'] : r.total > 25 ? ['g', 'مرتفع'] : ['y', 'في المدى الطبيعي']]]; },
      read: 'أقل من 15 تقدير ذات منخفض، ومن 15 لـ 25 المدى المعتاد. تقدير الذات المنخفض مرتبط بالاكتئاب والقلق الاجتماعي، بس السببية في الاتجاهين.' },
    pss: { t: 'الضغط النفسي المدرك', s: 'PSS-10 · 10 عبارات', dom: 'الضغوط والانفعالات', ref: 'Cohen & Williamson, 1988 (مجاني للاستخدام غير التجاري)', opts: ['ولا مرة', 'تقريبًا ولا مرة', 'أحيانًا', 'كتير', 'كتير جدًا'], min: 0, inst: 'خلال الشهر اللي فات، كم مرة…',
      it: [['اتضايقت من حاجة حصلت فجأة', 0], ['حسيت إنك مش قادر تتحكم في الحاجات المهمة في حياتك', 0], ['حسيت بالتوتر والضغط', 0], ['حسيت بالثقة في قدرتك على حل مشاكلك الشخصية', 1], ['حسيت إن الأمور ماشية زي ما إنت عايز', 1], ['لقيت إنك مش قادر تلحق كل اللي مطلوب منك', 0], ['قدرت تتحكم في الحاجات اللي بتضايقك', 1], ['حسيت إنك مسيطر على الأمور', 1], ['اتعصبت من حاجات خارجة عن سيطرتك', 0], ['حسيت إن الصعوبات بتتراكم لدرجة إنك مش قادر تتغلب عليها', 0]],
      score: function (a) { return { total: sumR(this, a, 4) }; }, show: function (r) { return [['الدرجة (0–40)', r.total, r.total >= 27 ? ['r', 'ضغط مرتفع'] : r.total >= 14 ? ['y', 'ضغط متوسط'] : ['g', 'ضغط منخفض']]]; },
      read: 'المقياس ده مش بيقيس عدد الأحداث الصعبة، بيقيس قد إيه إنت شايف حياتك مش متوقعة وخارجة عن سيطرتك، وده اللي بيتنبأ بالصحة أكتر من الأحداث نفسها (نموذج Lazarus للتقييم المعرفي).' },
    swls: { t: 'الرضا عن الحياة', s: 'SWLS · 5 عبارات', dom: 'الذات والرفاهية', ref: 'Diener et al., 1985 (مجاني)', opts: ['أعترض بشدة', 'أعترض', 'أعترض قليلًا', 'محايد', 'أوافق قليلًا', 'أوافق', 'أوافق بشدة'], min: 1, inst: 'قد إيه بتوافق على كل عبارة؟',
      it: [['حياتي في أغلب الجوانب قريبة من الحياة اللي بتمناها', 0], ['ظروف حياتي ممتازة', 0], ['أنا راضي عن حياتي', 0], ['لحد دلوقتي حققت الحاجات المهمة اللي عايزها في حياتي', 0], ['لو رجعت أعيش حياتي تاني، تقريبًا مش هغيّر حاجة', 0]],
      score: function (a) { return { total: sumR(this, a, 7) }; }, show: function (r) { var t = r.total; return [['الدرجة (5–35)', t, t >= 26 ? ['g', 'راضي'] : t >= 21 ? ['g', 'راضي إلى حد ما'] : t === 20 ? ['y', 'محايد'] : t >= 15 ? ['y', 'أقل من الرضا قليلًا'] : ['r', 'غير راضي']]]; },
      read: 'الرضا عن الحياة هو الجزء المعرفي من «السعادة الذاتية»: حكمك العام على حياتك. ومختلف عن المزاج اللحظي.' },
    brs: { t: 'الصمود (التعافي من الضغوط)', s: 'Brief Resilience Scale · 6 عبارات', dom: 'الضغوط والانفعالات', ref: 'Smith et al., 2008 (مجاني)', opts: A5, min: 1, inst: 'قد إيه كل عبارة بتنطبق عليك؟',
      it: [['بفوق بسرعة بعد الأوقات الصعبة', 0], ['بلاقي صعوبة إني أعدّي الأحداث الضاغطة', 1], ['مش بياخد مني وقت طويل علشان أتعافى من موقف ضاغط', 0], ['صعب عليّ أرجع لطبيعتي لما يحصل حاجة وحشة', 1], ['عادةً بعدّي الأوقات الصعبة من غير مشاكل كبيرة', 0], ['بياخد مني وقت طويل علشان أتجاوز النكسات في حياتي', 1]],
      score: function (a) { return { mean: sumR(this, a, 5) / 6 }; }, show: function (r) { var m = r.mean; return [['المتوسط (1–5)', m.toFixed(2), m < 3 ? ['r', 'صمود منخفض'] : m > 4.3 ? ['g', 'صمود مرتفع'] : ['y', 'صمود طبيعي']]]; },
      read: 'المقياس ده بيقيس «القدرة على الارتداد» بعد الضغط، مش غياب الضغط نفسه.' },
    ucla: { t: 'الوحدة النفسية', s: 'UCLA-3 · 3 عبارات', dom: 'العلاقات', ref: 'Hughes et al., 2004 (مجاني)', opts: ['نادرًا', 'أحيانًا', 'كتير'], min: 1, inst: 'كم مرة بتحس…',
      it: [['إنك محتاج صحبة', 0], ['إنك متساب أو مستبعد', 0], ['إنك معزول عن الناس', 0]],
      score: function (a) { return { total: sumR(this, a, 3) }; }, show: function (r) { return [['الدرجة (3–9)', r.total, r.total >= 6 ? ['r', 'وحدة واضحة'] : ['g', 'مفيش وحدة واضحة']]]; },
      read: 'الوحدة إحساس بفجوة بين العلاقات اللي عايزها واللي عندك، ومش لازم تبقى لوحدك فعلًا علشان تحس بيها. والوحدة المزمنة عامل خطر صحي معروف (Holt-Lunstad et al., 2015).' },
    grit: { t: 'المثابرة والشغف (Grit)', s: 'Grit-S · 8 عبارات', dom: 'الدافعية', ref: 'Duckworth & Quinn, 2009 (مجاني للاستخدام غير التجاري)', opts: ['مش شبهي خالص', 'مش شبهي غالبًا', 'شبهي شوية', 'شبهي غالبًا', 'شبهي جدًا'], min: 1, inst: 'قد إيه كل عبارة شبهك؟',
      sub: { I: 'ثبات الاهتمام', P: 'المثابرة في المجهود' },
      it: [['الأفكار والمشاريع الجديدة ساعات بتشتتني عن القديمة', 1, 'I'], ['النكسات مش بتحبطني', 0, 'P'], ['بتعلق بفكرة أو مشروع فترة قصيرة وبعدين بفقد اهتمامي', 1, 'I'], ['أنا شغّيل', 0, 'P'], ['كتير بحط هدف وبعدين أغيّره لهدف تاني', 1, 'I'], ['بلاقي صعوبة أركز في مشاريع بتاخد أكتر من كام شهر', 1, 'I'], ['بخلّص أي حاجة ببدأها', 0, 'P'], ['أنا مجتهد', 0, 'P']],
      score: function (a) { return subMeans(this, a); }, show: function (r) { return [['ثبات الاهتمام', r.sub.I, lvl5(r.sub.I)], ['المثابرة في المجهود', r.sub.P, lvl5(r.sub.P)]]; },
      read: 'الـ Grit بيتنبأ بالاستمرار في الأهداف الطويلة. بس تحليل بعدي (Credé et al., 2017) لقى إنه قريب جدًا من يقظة الضمير، وإن جانب المثابرة أقوى في التنبؤ من جانب ثبات الاهتمام. ده مثال حي على مشكلة «تكرار المفاهيم» (Jingle-Jangle).' },
    erq: { t: 'استراتيجيات تنظيم الانفعال', s: 'ERQ · 10 عبارات', dom: 'الضغوط والانفعالات', ref: 'Gross & John, 2003 (مجاني للبحث)', opts: ['أعترض بشدة', 'أعترض', 'أعترض قليلًا', 'محايد', 'أوافق قليلًا', 'أوافق', 'أوافق بشدة'], min: 1, inst: 'العبارات دي عن طريقة تعاملك مع مشاعرك.',
      sub: { R: 'إعادة التقييم المعرفي', S: 'كبت التعبير' },
      it: [['لما أكون عايز أحس بمشاعر إيجابية أكتر، بغيّر الحاجة اللي بفكر فيها', 0, 'R'], ['بحتفظ بمشاعري لنفسي', 0, 'S'], ['لما أكون عايز أقلل مشاعر سلبية زي الحزن أو الغضب، بغيّر الحاجة اللي بفكر فيها', 0, 'R'], ['لما بحس بمشاعر إيجابية، بخلي بالي إني مبينهاش', 0, 'S'], ['في المواقف الضاغطة، بخلي نفسي أفكر فيها بطريقة تساعدني أفضل هادي', 0, 'R'], ['بتحكم في مشاعري بإني مبينهاش', 0, 'S'], ['لما أكون عايز أحس بمشاعر إيجابية أكتر، بغيّر طريقة تفكيري في الموقف', 0, 'R'], ['بتحكم في مشاعري بإني أغيّر طريقة تفكيري في الموقف اللي أنا فيه', 0, 'R'], ['لما بحس بمشاعر سلبية، بتأكد إني مبينهاش', 0, 'S'], ['لما أكون عايز أقلل مشاعر سلبية، بغيّر طريقة تفكيري في الموقف', 0, 'R']],
      score: function (a) { return subMeans(this, a); }, show: function (r) { return [['إعادة التقييم (1–7)', r.sub.R, r.sub.R >= 5 ? ['g', 'استخدام عالي'] : r.sub.R >= 3.5 ? ['y', 'متوسط'] : ['r', 'قليل']], ['الكبت (1–7)', r.sub.S, r.sub.S >= 5 ? ['r', 'استخدام عالي'] : r.sub.S >= 3.5 ? ['y', 'متوسط'] : ['g', 'قليل']]]; },
      read: 'إعادة التقييم (تغيير معنى الموقف) مرتبطة عمومًا بصحة نفسية وعلاقات أفضل، والكبت المزمن (إخفاء التعبير) مرتبط بمزاج أسوأ (Gross & John, 2003). بس في ثقافات جمعية الكبت أقل ضررًا، فالسياق مهم.' },
    asrs: { t: 'فرز اضطراب فرط الحركة وتشتت الانتباه للبالغين', s: 'ASRS v1.1 الجزء أ · 6 أسئلة', dom: 'الانتباه', ref: 'منظمة الصحة العالمية؛ Kessler et al., 2005 (مجاني)', opts: ['ولا مرة', 'نادرًا', 'أحيانًا', 'كتير', 'كتير جدًا'], min: 0, inst: 'خلال الـ 6 شهور اللي فاتوا، كم مرة…',
      it: [['بتلاقي صعوبة تخلّص التفاصيل الأخيرة في مشروع بعد ما الأجزاء الصعبة تخلص؟', 0], ['بتلاقي صعوبة ترتّب الحاجات لما تعمل مهمة محتاجة تنظيم؟', 0], ['بتنسى مواعيد أو التزامات؟', 0], ['لما يبقى عندك مهمة محتاجة تفكير كتير، بتتجنبها أو تأجل البدء فيها؟', 0], ['بتتململ أو تحرك إيديك أو رجليك لما تقعد فترة طويلة؟', 0], ['بتحس إنك نشيط زيادة ومضطر تعمل حاجات، كأن جواك موتور؟', 0]],
      score: function (a) { var sh = a.filter(function (v, i) { return i < 3 ? v >= 2 : v >= 3; }).length; return { shaded: sh, total: a.reduce(function (p, v) { return p + v; }, 0) }; }, show: function (r) { return [['الإجابات في المنطقة المظللة (من 6)', r.shaded, r.shaded >= 4 ? ['r', 'الفرز إيجابي: يستاهل تقييم متخصص'] : ['g', 'الفرز سلبي']]]; },
      read: '4 إجابات أو أكتر في «المنطقة المظللة» معناها إن الأعراض تستاهل تقييم متخصص. الفرز ده مش تشخيص: التشخيص محتاج تاريخ من الطفولة، وتأثير في أكتر من مكان، واستبعاد أسباب تانية زي القلق وقلة النوم.' }
  };
  function sumR(q, a, n) { return a.reduce(function (p, v, i) { var x = q.it[i][1] ? (n - 1 - v) : v; return p + x + q.min; }, 0); }
  function subMeans(q, a) { var s = {}, c = {}; a.forEach(function (v, i) { var it = q.it[i], n = q.opts.length, x = (it[1] ? (n - 1 - v) : v) + q.min; s[it[2]] = (s[it[2]] || 0) + x; c[it[2]] = (c[it[2]] || 0) + 1; }); var o = {}; Object.keys(s).forEach(function (k) { o[k] = +(s[k] / c[k]).toFixed(2); }); return { sub: o }; }
  function lvl5(m) { return m >= 3.8 ? ['g', 'مرتفع'] : m >= 2.6 ? ['y', 'متوسط'] : ['r', 'منخفض']; }
  /* ---------- cognitive tasks (generated) ---------- */
  function rnd(n) { return Math.floor(Math.random() * n); }
  function shuffle(a) { for (var i = a.length - 1; i > 0; i--) { var j = rnd(i + 1), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  var SH = ['circle', 'square', 'triangle'], FILL = ['#5b3fd1', 'none', '#e25d33'];
  function shapeSVG(c, x, y, r) { var f = c.f === 'none' ? 'none' : c.f, st = 'stroke="currentColor" stroke-width="2"'; if (c.s === 'circle') return '<circle cx="' + x + '" cy="' + y + '" r="' + r + '" fill="' + f + '" ' + st + '/>'; if (c.s === 'square') return '<rect x="' + (x - r) + '" y="' + (y - r) + '" width="' + 2 * r + '" height="' + 2 * r + '" fill="' + f + '" ' + st + '/>'; return '<polygon points="' + x + ',' + (y - r) + ' ' + (x + r) + ',' + (y + r) + ' ' + (x - r) + ',' + (y + r) + '" fill="' + f + '" ' + st + '/>'; }
  function cellSVG(c, size) { size = size || 64; var n = c.n, r = n > 2 ? 8 : 11, pos = n === 1 ? [[32, 32]] : n === 2 ? [[20, 32], [44, 32]] : [[32, 18], [18, 44], [46, 44]]; return '<svg viewBox="0 0 64 64" width="' + size + '" height="' + size + '" style="width:' + size + 'px;height:' + size + 'px" aria-hidden="true"><rect x="1" y="1" width="62" height="62" rx="8" fill="none" stroke="currentColor" stroke-opacity=".25"/>' + pos.map(function (p) { return shapeSVG(c, p[0], p[1], r); }).join('') + '</svg>'; }
  function matrixItem(level) { // rules: count by column, shape by row; level 2 adds fill by diagonal; level 3 also permutes order
    var sh = shuffle(SH.slice()), fl = shuffle(FILL.slice()), cells = [];
    for (var r = 0; r < 3; r++) for (var c = 0; c < 3; c++) cells.push({ n: level >= 3 ? ((r + c) % 3) + 1 : c + 1, s: sh[r], f: level >= 2 ? fl[(r + c) % 3] : fl[0] });
    var ans = cells[8], opts = [ans]; var vary = function (o) { var k = rnd(3), x = Object.assign({}, o); if (k === 0) x.n = (o.n % 3) + 1; else if (k === 1) x.s = SH[(SH.indexOf(o.s) + 1) % 3]; else x.f = FILL[(FILL.indexOf(o.f) + 1) % 3]; return x; };
    var key = function (o) { return o.n + o.s + o.f; }, seen = {}; seen[key(ans)] = 1; var guard = 0; while (opts.length < 6 && guard++ < 200) { var v = vary(opts[rnd(opts.length)]); if (!seen[key(v)]) { seen[key(v)] = 1; opts.push(v); } }
    shuffle(opts); return { cells: cells, opts: opts, ok: opts.indexOf(ans) };
  }
  function seriesItem(k) { var a = 2 + rnd(6), d = 2 + rnd(5), T = [
    function () { return [a, a + d, a + 2 * d, a + 3 * d, a + 4 * d, a + 5 * d]; },
    function () { return [a, a * 2, a * 4, a * 8, a * 16, a * 32]; },
    function () { return [a, a + d, a + d + 1, a + 2 * d + 1, a + 2 * d + 2, a + 3 * d + 2]; },
    function () { var s = [1 + rnd(3)]; for (var i = 1; i < 6; i++) s.push(s[i - 1] + i * 2); return s; },
    function () { var s = [1, 2]; for (var i = 2; i < 6; i++) s.push(s[i - 1] + s[i - 2]); return s.map(function (x) { return x + a; }); },
    function () { var b = 1 + rnd(4); return [1, 4, 9, 16, 25, 36].map(function (x) { return x + b; }); },
    function () { return [a * 3, a * 3 - d, (a * 3 - d) * 2, (a * 3 - d) * 2 - d, ((a * 3 - d) * 2 - d) * 2, ((a * 3 - d) * 2 - d) * 2 - d]; },
    function () { var s = [a]; for (var i = 1; i < 6; i++) s.push(i % 2 ? s[i - 1] * 2 : s[i - 1] - 1); return s; }][k % 8](); return { shown: s5(T), ans: T[5] }; }
  function s5(t) { return t.slice(0, 5); }
  var ANALOG = [['طبيب : مستشفى', 'مدرّس : ؟', ['مدرسة', 'كتاب', 'طالب', 'سبورة'], 0], ['عطشان : ماء', 'جوعان : ؟', ['أكل', 'نوم', 'مطبخ', 'طبق'], 0], ['ساعة : وقت', 'ترمومتر : ؟', ['حرارة', 'طول', 'وزن', 'ضغط'], 0], ['قلم : كاتب', 'فرشاة : ؟', ['رسّام', 'ألوان', 'لوحة', 'خشب'], 0], ['كثير : قليل', 'قديم : ؟', ['حديث', 'مكسور', 'غالي', 'كبير'], 0], ['عين : رؤية', 'أذن : ؟', ['سمع', 'صوت', 'كلام', 'رأس'], 0], ['بذرة : شجرة', 'طفل : ؟', ['راشد', 'لعبة', 'أم', 'مدرسة'], 0], ['سمكة : ماء', 'طائر : ؟', ['هواء', 'عش', 'ريش', 'شجرة'], 0], ['مقدمة : كتاب', 'تمهيد : ؟', ['بحث', 'قلم', 'غلاف', 'مكتبة'], 0], ['كلمة : جملة', 'نغمة : ؟', ['لحن', 'آلة', 'مغني', 'صوت'], 0], ['قطرة : محيط', 'دقيقة : ؟', ['دهر', 'ساعة يد', 'ثانية', 'جدول'], 0], ['سبب : نتيجة', 'مقدمة منطقية : ؟', ['استنتاج', 'سؤال', 'فرض', 'دليل'], 0]];
  var SHAPES = [[[0, 0], [1, 0], [2, 0], [2, 1], [0, 1], [0, 2]], [[0, 0], [1, 0], [1, 1], [1, 2], [2, 2], [3, 2]], [[0, 0], [0, 1], [1, 1], [2, 1], [2, 2], [2, 3]], [[1, 0], [0, 1], [1, 1], [2, 1], [2, 2], [3, 2]]];
  function polySVG(cells, rot, mir, size) { var pts = cells.map(function (c) { var x = mir ? -c[0] : c[0], y = c[1], a = rot * Math.PI / 180; return [x * Math.cos(a) - y * Math.sin(a), x * Math.sin(a) + y * Math.cos(a)]; }), mx = Math.min.apply(null, pts.map(function (p) { return p[0]; })), my = Math.min.apply(null, pts.map(function (p) { return p[1]; })), U = 18; return '<svg viewBox="-6 -6 96 96" width="' + (size || 120) + '" height="' + (size || 120) + '" style="width:' + (size || 120) + 'px;height:' + (size || 120) + 'px" aria-hidden="true">' + pts.map(function (p) { return '<rect x="' + ((p[0] - mx) * U) + '" y="' + ((p[1] - my) * U) + '" width="' + (U - 2) + '" height="' + (U - 2) + '" rx="3" fill="#5b3fd1"/>'; }).join('') + '</svg>'; }
  var CODE = ['◆', '●', '▲', '■', '★', '✚', '◐', '⬟', '♥'];
  var COG = {
    matrix: { t: 'الاستدلال المجرد (المصفوفات)', s: '10 مصفوفات · حوالي 6 دقايق', dom: 'القدرات العقلية', ref: 'مولّدة في المختبر بنفس فكرة مصفوفات رافن وICAR', area: 'الاستدلال' },
    series: { t: 'المتسلسلات العددية', s: '8 متسلسلات · حوالي 4 دقايق', dom: 'القدرات العقلية', ref: 'مولّدة في المختبر', area: 'الاستدلال العددي' },
    analog: { t: 'التناظر اللفظي', s: '12 سؤال · حوالي 4 دقايق', dom: 'القدرات العقلية', ref: 'من إعداد المختبر', area: 'الاستدلال اللفظي' },
    rotate: { t: 'التدوير الذهني', s: '12 محاولة · حوالي 3 دقايق', dom: 'القدرات العقلية', ref: 'على نمط Shepard & Metzler, 1971', area: 'القدرة المكانية' },
    coding: { t: 'سرعة المعالجة (ترميز الرموز)', s: '60 ثانية', dom: 'القدرات العقلية', ref: 'على نمط اختبارات ترميز الرموز', area: 'سرعة المعالجة' }
  };
  /* ---------- view ---------- */
  var root = null;
  var CSS = '.ts{max-width:960px;margin:0 auto;display:flex;flex-direction:column;gap:14px}.ts-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:10px}.ts-card{border:1px solid var(--line,#ddd);border-radius:14px;padding:14px;background:var(--surface,#fff);display:flex;flex-direction:column;gap:6px;text-align:start;color:inherit;font:inherit;cursor:pointer}.ts-card:hover,.ts-card:focus-visible{border-color:var(--primary,var(--accent,#5b3fd1))}.ts-card small{opacity:.75}.ts-done{font-size:12px;color:#1e7a3c}.ts-box{border:1px solid var(--line,#ddd);border-radius:14px;padding:16px;background:var(--surface,#fff);display:flex;flex-direction:column;gap:10px}.ts-opts{display:flex;flex-direction:column;gap:8px}.ts-scale{display:grid;grid-template-columns:repeat(auto-fit,minmax(110px,1fr));gap:6px}.ts-opt{text-align:center;border:1px solid var(--line,#ddd);border-radius:10px;padding:9px 10px;background:transparent;color:inherit;font:inherit;cursor:pointer}.ts-opt:hover,.ts-opt:focus-visible{border-color:var(--primary,var(--accent,#5b3fd1));outline:none}.ts-bar{height:7px;border-radius:5px;background:var(--line,#e5e5e5);overflow:hidden}.ts-bar i{display:block;height:100%;background:var(--primary,var(--accent,#5b3fd1))}.ts-btn{border:1px solid var(--primary,var(--accent,#5b3fd1));background:var(--primary,var(--accent,#5b3fd1));color:#fff;border-radius:10px;padding:8px 16px;font:inherit;cursor:pointer}.ts-btn.g{background:transparent;color:var(--primary,var(--accent,#5b3fd1))}.ts-mx{display:grid;grid-template-columns:repeat(3,72px);gap:6px;justify-content:center;direction:ltr}.ts-mx div{display:grid;place-items:center}.ts-mo{display:grid;grid-template-columns:repeat(3,80px);gap:8px;justify-content:center;direction:ltr}.ts-lv{display:inline-block;border-radius:999px;padding:0 10px;font-size:12px}.ts-lv.g{background:#e1f2e6;color:#1e7a3c}.ts-lv.y{background:#fbf0d5;color:#8a5a00}.ts-lv.r{background:#fbe3e1;color:#b3261e}.ts table{border-collapse:collapse;width:100%}.ts td,.ts th{border-bottom:1px solid var(--line,#e5e5e5);padding:7px 8px;text-align:start}.ts-key{display:flex;flex-wrap:wrap;gap:6px;justify-content:center;direction:ltr}.ts-key span{border:1px solid var(--line,#ccc);border-radius:8px;padding:4px 8px;font-size:18px}';
  function css() { if (document.getElementById('ts-css')) return; var s = document.createElement('style'); s.id = 'ts-css'; s.textContent = CSS; document.head.appendChild(s); }
  function frame(body) { root.innerHTML = '<div class="ts">' + body + '</div>'; try { window.scrollTo({ top: 0 }); } catch (e) { } }
  function home() {
    var doms = {}; Object.keys(Q).forEach(function (k) { (doms[Q[k].dom] = doms[Q[k].dom] || []).push(['q', k, Q[k]]); }); Object.keys(COG).forEach(function (k) { (doms[COG[k].dom] = doms[COG[k].dom] || []).push(['c', k, COG[k]]); });
    var done = Object.keys(st.r).length, total = Object.keys(Q).length + Object.keys(COG).length;
    frame('<div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px"><h2 style="margin:0">مكتبة الاختبارات</h2><span class="muted small">خلّصت ' + done + ' من ' + total + '</span></div><p class="muted" style="margin:0">مقاييس نفسية منشورة ومجانية (ترجمة عمل للتدريب)، ومهام قدرات عقلية مولّدة في المختبر. النتايج على جهازك' + (shared() ? '، ومتشاركة مع المسؤول لأنك وافقت في «اعرف نفسك»' : '') + '. <b>ده فرز وتعلّم مش تشخيص.</b></p>' +
      Object.keys(doms).map(function (d) { return '<h3 style="margin:6px 0 0">' + E(d) + '</h3><div class="ts-grid">' + doms[d].map(function (x) { var r = st.r[x[1]]; return '<button class="ts-card" data-t="' + x[0] + ':' + x[1] + '"><b>' + E(x[2].t) + '</b><small>' + E(x[2].s) + '</small>' + (r ? '<span class="ts-done">✓ اتعمل ' + E(new Date(r.at).toLocaleDateString('ar-EG')) + ' · دوس تشوف النتيجة أو تعيده</span>' : '') + '</button>'; }).join('') + '</div>'; }).join('') +
      (done ? '<div class="ts-box"><div><button class="ts-btn" id="tsProf">بروفايلي الكامل</button></div></div>' : ''));
    root.querySelectorAll('[data-t]').forEach(function (b) { b.onclick = function () { var p = b.dataset.t.split(':'); if (st.r[p[1]]) return result(p[0], p[1]); p[0] === 'q' ? runQ(p[1]) : runC(p[1]); }; });
    var pf = document.getElementById('tsProf'); if (pf) pf.onclick = profile;
  }
  function runQ(id) {
    var q = Q[id], i = 0, ans = [];
    var draw = function () { var it = q.it[i]; frame('<div class="ts-box"><div style="display:flex;justify-content:space-between"><b>' + E(q.t) + '</b><span class="muted small">' + (i + 1) + ' / ' + q.it.length + '</span></div><div class="ts-bar"><i style="width:' + (i / q.it.length * 100) + '%"></i></div>' + (i === 0 ? '<p class="muted" style="margin:0">' + E(q.inst) + '</p>' : '') + '<p style="font-size:18px;margin:4px 0">' + E(it[0]) + '</p><div class="ts-scale">' + q.opts.map(function (o, k) { return '<button class="ts-opt" data-k="' + k + '">' + E(o) + '</button>'; }).join('') + '</div>' + (i ? '<div><button class="ts-btn g" id="tsBack">رجوع</button></div>' : '') + '</div>');
      root.querySelectorAll('.ts-opt').forEach(function (b) { b.onclick = function () { ans[i] = +b.dataset.k; i++; if (i < q.it.length) draw(); else { var sc = q.score(ans); st.r[id] = Object.assign({ at: Date.now(), kind: 'q', a: ans }, sc); save(); xp(15); sync(); result('q', id); } }; });
      var bk = document.getElementById('tsBack'); if (bk) bk.onclick = function () { i--; draw(); }; };
    draw();
  }
  function runC(id) {
    if (id === 'matrix') return task(10, function (k) { return matrixItem(k < 3 ? 1 : k < 7 ? 2 : 3); }, function (it) { return '<p style="margin:0">إيه الشكل اللي يكمّل المصفوفة؟ (الخانة الأخيرة تحت)</p><div class="ts-mx">' + it.cells.map(function (c, j) { return '<div>' + (j === 8 ? '<svg viewBox="0 0 64 64" width="64" height="64" style="width:64px;height:64px"><rect x="1" y="1" width="62" height="62" rx="8" fill="none" stroke="currentColor" stroke-dasharray="4 4"/><text x="32" y="40" font-size="22" text-anchor="middle" fill="currentColor">؟</text></svg>' : cellSVG(c)) + '</div>'; }).join('') + '</div><div class="ts-mo">' + it.opts.map(function (o, j) { return '<button class="ts-opt" data-k="' + j + '" aria-label="اختيار ' + (j + 1) + '">' + cellSVG(o, 56) + '</button>'; }).join('') + '</div>'; }, function (it, k) { return k === it.ok; });
    if (id === 'series') return task(8, function (k) { return seriesItem(k); }, function (it) { return '<p style="margin:0">إيه الرقم اللي بعد كده؟</p><p style="font-size:26px;direction:ltr;text-align:center;margin:4px 0">' + it.shown.join(' ، ') + ' ، ؟</p><div style="display:flex;gap:8px;justify-content:center"><input id="tsN" inputmode="numeric" dir="ltr" style="font-size:20px;width:120px;padding:6px;border-radius:8px;border:1px solid var(--line,#ccc)"><button class="ts-btn" id="tsOk">تأكيد</button></div>'; }, function (it, k) { return +k === it.ans; }, true);
    if (id === 'analog') { var order = shuffle(ANALOG.slice()); return task(order.length, function (k) { var a = order[k], o = a[2].map(function (t, j) { return [t, j === a[3]]; }); shuffle(o); return { a: a, o: o }; }, function (it) { return '<p style="font-size:20px;margin:0;text-align:center">' + E(it.a[0]) + ' &nbsp;::&nbsp; ' + E(it.a[1]) + '</p><div class="ts-scale">' + it.o.map(function (x, j) { return '<button class="ts-opt" data-k="' + j + '">' + E(x[0]) + '</button>'; }).join('') + '</div>'; }, function (it, k) { return it.o[k][1]; }); }
    if (id === 'rotate') return task(12, function () { var s = SHAPES[rnd(SHAPES.length)], same = Math.random() < 0.5, r = [90, 180, 270][rnd(3)]; return { s: s, same: same, r: r }; }, function (it) { return '<p style="margin:0">الشكل التاني هو نفس الأول بعد ما اتلف؟ ولا صورته في المراية؟</p><div style="display:flex;gap:24px;justify-content:center;align-items:center;direction:ltr">' + polySVG(it.s, 0, false) + polySVG(it.s, it.r, !it.same) + '</div><div class="ts-scale"><button class="ts-opt" data-k="1">نفس الشكل (اتلف بس)</button><button class="ts-opt" data-k="0">صورته في المراية</button></div>'; }, function (it, k) { return (+k === 1) === it.same; });
    if (id === 'coding') return coding();
  }
  function task(N, gen, view, check, numeric) {
    var k = 0, ok = 0, rts = [], t0 = 0, items = [];
    var next = function () { if (k >= N) return done(); var it = gen(k); items.push(it); frame('<div class="ts-box"><div style="display:flex;justify-content:space-between"><b>' + E(COG[cur].t) + '</b><span class="muted small">' + (k + 1) + ' / ' + N + '</span></div><div class="ts-bar"><i style="width:' + (k / N * 100) + '%"></i></div>' + view(it) + '</div>'); t0 = performance.now();
      var ans = function (v) { rts.push(performance.now() - t0); if (check(it, v)) ok++; k++; next(); };
      if (numeric) { var inp = document.getElementById('tsN'); inp.focus(); var go = function () { if (inp.value.trim() === '') return; ans(inp.value.trim()); }; document.getElementById('tsOk').onclick = go; inp.onkeydown = function (e) { if (e.key === 'Enter') go(); }; }
      else root.querySelectorAll('.ts-opt').forEach(function (b) { b.onclick = function () { ans(+b.dataset.k); }; }); };
    var cur = Object.keys(COG).find(function (x) { return COG[x] === COG[curId]; });
    var done = function () { var s = rts.slice().sort(function (a, b) { return a - b; }); st.r[curId] = { at: Date.now(), kind: 'c', ok: ok, n: N, pct: Math.round(ok / N * 100), med: Math.round(s[Math.floor(s.length / 2)] || 0) }; save(); xp(20); sync(); result('c', curId); };
    next();
  }
  var curId = null;
  function coding() {
    var map = shuffle(CODE.slice()).slice(0, 9), ok = 0, n = 0, end = 0, cur = 0;
    frame('<div class="ts-box"><b>' + E(COG.coding.t) + '</b><p style="margin:0">كل رمز ليه رقم (في المفتاح). هيظهر رمز، ودوس رقمه بأسرع ما تقدر لمدة 60 ثانية.</p><div class="ts-key">' + map.map(function (s, i) { return '<span>' + s + ' = ' + (i + 1) + '</span>'; }).join('') + '</div><div style="font-size:54px;text-align:center" id="tsS">جاهز؟</div><div class="ts-key" id="tsPad">' + map.map(function (_, i) { return '<button class="ts-opt" data-k="' + (i + 1) + '" style="min-width:48px">' + (i + 1) + '</button>'; }).join('') + '</div><div class="muted small" id="tsT"></div><div><button class="ts-btn" id="tsGo">ابدأ</button></div></div>');
    var S = document.getElementById('tsS'), T = document.getElementById('tsT'), show = function () { cur = rnd(9); S.textContent = map[cur]; };
    document.getElementById('tsGo').onclick = function (e) { e.target.remove(); end = Date.now() + 60000; show(); var tick = setInterval(function () { var left = Math.max(0, end - Date.now()); if (!T.isConnected) return clearInterval(tick); T.textContent = '⏱ ' + Math.ceil(left / 1000) + ' ثانية · صح: ' + ok; if (!left) { clearInterval(tick); st.r.coding = { at: Date.now(), kind: 'c', ok: ok, n: n, pct: Math.min(100, Math.round(ok / 45 * 100)), acc: n ? Math.round(ok / n * 100) : 0 }; save(); xp(20); sync(); result('c', 'coding'); } }, 200); };
    root.querySelectorAll('#tsPad .ts-opt').forEach(function (b) { b.onclick = function () { if (!end || Date.now() > end) return; n++; if (+b.dataset.k === cur + 1) ok++; show(); }; });
  }
  function result(kind, id) {
    var r = st.r[id], h;
    if (kind === 'q') { var q = Q[id], rows = q.show(r); h = '<div class="ts-box"><h3 style="margin:0">' + E(q.t) + '</h3><table><tbody>' + rows.map(function (x) { return '<tr><td>' + E(x[0]) + '</td><td><b>' + E(String(x[1])) + '</b></td><td><span class="ts-lv ' + x[2][0] + '">' + E(x[2][1]) + '</span></td></tr>'; }).join('') + '</tbody></table><p style="margin:0">' + E(q.read) + '</p><p class="muted small" style="margin:0">المرجع: ' + E(q.ref) + '. الترجمة دي ترجمة عمل للتعلّم؛ للبحث استخدم النسخة العربية المقننة.</p>' + (id === 'asrs' && r.shaded >= 4 || id === 'pss' && r.total >= 27 || id === 'ucla' && r.total >= 6 ? '<div class="kn-safe" style="border:2px solid #b3261e;border-radius:12px;padding:10px">النتيجة تستاهل تتكلم مع متخصص. في مصر: خط الصحة النفسية <b dir="ltr">16328</b> أو <b dir="ltr">08008880700</b>.</div>' : '') + '<div style="display:flex;gap:8px;flex-wrap:wrap"><button class="ts-btn" id="tsHome">باقي الاختبارات</button><button class="ts-btn g" id="tsAgain">أعد الاختبار</button></div></div>'; }
    else { var c = COG[id]; h = '<div class="ts-box"><h3 style="margin:0">' + E(c.t) + '</h3><p style="margin:0;font-size:20px">' + (id === 'coding' ? 'رموز صح: <b>' + r.ok + '</b> في 60 ثانية (دقة ' + r.acc + '%)' : 'إجابات صح: <b>' + r.ok + ' من ' + r.n + '</b> (' + r.pct + '%)' + (r.med ? ' · متوسط وقت السؤال ' + (r.med / 1000).toFixed(1) + ' ث' : '')) + '</p><p style="margin:0">' + E(cogRead(id, r)) + '</p><p class="muted small" style="margin:0">' + E(c.ref) + '. المهمة دي من غير معايير لسه، فالنتيجة نسبة صح مش «معامل ذكاء». الذكاء متعدد الجوانب، والأداء بيتأثر بالتعب والتوتر والتدريب.</p><div style="display:flex;gap:8px;flex-wrap:wrap"><button class="ts-btn" id="tsHome">باقي الاختبارات</button><button class="ts-btn g" id="tsAgain">أعد المهمة</button><button class="ts-btn g" id="tsProf2">بروفايلي الكامل</button></div></div>'; }
    frame(h); document.getElementById('tsHome').onclick = home; document.getElementById('tsAgain').onclick = function () { delete st.r[id]; save(); kind === 'q' ? runQ(id) : (curId = id, runC(id)); };
    var p2 = document.getElementById('tsProf2'); if (p2) p2.onclick = profile;
  }
  function cogRead(id, r) { var p = r.pct; var t = { matrix: 'المصفوفات بتقيس الاستدلال المجرد: اكتشاف القاعدة من أمثلة، وده قلب «الذكاء السائل» (Cattell).', series: 'المتسلسلات بتقيس الاستدلال الكمي: اكتشاف النمط في الأرقام.', analog: 'التناظر اللفظي بيقيس فهم العلاقات بين المفاهيم، وبيتأثر بالمخزون اللغوي («الذكاء المتبلور»).', rotate: 'التدوير الذهني بيقيس القدرة على تخيل الأشكال وتحريكها في الذهن، وزمن الإجابة بيزيد مع زاوية الدوران (Shepard & Metzler, 1971).', coding: 'ترميز الرموز بيقيس سرعة المعالجة، وده من أكتر الجوانب حساسية للتعب والسن والقلق.' }[id]; return t + (id === 'coding' ? '' : p >= 80 ? ' أداؤك قوي في الجانب ده.' : p >= 50 ? ' أداؤك متوسط.' : ' الجانب ده ممكن يتحسن بالتدريب.'); }
  function profile() {
    var cog = Object.keys(COG).filter(function (k) { return st.r[k]; }).map(function (k) { return [COG[k].area, st.r[k].pct]; });
    var k = null; try { k = JSON.parse(localStorage.getItem('know-v1') || 'null'); } catch (e) { } if (k && k.r && k.r.span && k.r.span.best) cog.push(['الذاكرة العاملة', Math.min(100, Math.round(k.r.span.best / 9 * 100))]);
    var bars = function (rows) { return '<table><tbody>' + rows.map(function (x) { return '<tr><td style="width:40%">' + E(x[0]) + '</td><td><div class="ts-bar" style="height:12px"><i style="width:' + Math.max(2, x[1]) + '%"></i></div></td><td style="width:60px">' + x[1] + '%</td></tr>'; }).join('') + '</tbody></table>'; };
    var bf = st.r.bigfive, per = bf ? Object.keys(Q.bigfive.sub).map(function (s) { return [Q.bigfive.sub[s], Math.round((bf.sub[s] - 1) / 4 * 100)]; }) : [];
    var others = Object.keys(Q).filter(function (x) { return x !== 'bigfive' && st.r[x]; }).map(function (x) { var row = Q[x].show(st.r[x])[0]; return '<tr><td>' + E(Q[x].t) + '</td><td>' + E(String(row[1])) + '</td><td><span class="ts-lv ' + row[2][0] + '">' + E(row[2][1]) + '</span></td></tr>'; }).join('');
    var mean = cog.length ? Math.round(cog.reduce(function (p, x) { return p + x[1]; }, 0) / cog.length) : null, spread = cog.length > 1 ? Math.max.apply(null, cog.map(function (x) { return x[1]; })) - Math.min.apply(null, cog.map(function (x) { return x[1]; })) : 0;
    frame('<div style="display:flex;justify-content:space-between;align-items:center"><h2 style="margin:0">بروفايلي الكامل</h2><button class="ts-btn g" id="tsHome">رجوع</button></div>' +
      (cog.length ? '<div class="ts-box"><h3 style="margin:0">البروفايل المعرفي</h3>' + bars(cog) + '<p style="margin:0">متوسط الجوانب: <b>' + mean + '%</b>' + (spread >= 40 ? '. والفرق كبير بين أعلى وأقل جانب (' + spread + ' نقطة)، يعني قدراتك مش متساوية، وده طبيعي ومفيد تعرفه: ركّز على نقاط قوتك في طريقة المذاكرة.' : '.') + '</p><p class="muted small" style="margin:0">الجوانب دي مرتبطة ببعض في الأبحاث (العامل العام g عند سبيرمان)، بس كل جانب ليه تباين خاص (نموذج CHC). ومفيش رقم IQ هنا علشان لسه مفيش معايير.</p></div>' : '') +
      (per.length ? '<div class="ts-box"><h3 style="margin:0">الشخصية (العوامل الخمسة)</h3>' + bars(per) + '</div>' : '') +
      (others ? '<div class="ts-box"><h3 style="margin:0">المقاييس النفسية</h3><table><tbody>' + others + '</tbody></table></div>' : '') +
      '<div class="ts-box"><p class="muted small" style="margin:0">ده بروفايل للتعلّم والتأمل الذاتي، مش تشخيص. أي نتيجة مقلقة تستاهل كلام مع متخصص. والمحاضر (مسؤول الموقع) بيشوف النتايج دي بس، حسب سياسة الخصوصية.</p></div>');
    document.getElementById('tsHome').onclick = home;
  }
  var _runC = runC; runC = function (id) { curId = id; return _runC(id); };
  function mount(el) { root = el; css(); home(); }
  if (typeof VIEWS !== 'undefined') VIEWS.tests = mount;
  else { var route = function () { if ((location.hash || '').slice(1).split('/')[0] !== 'tests') return; var v = document.getElementById('view'); if (v) mount(v); }; addEventListener('hashchange', function () { setTimeout(route, 0); }); if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { setTimeout(route, 0); }); else setTimeout(route, 0); }
  return { mount: mount, Q: Q, state: function () { return st; } };
})();

/* ===== Admin page (#admin), shared by both labs (firebase accounts mode).
   The admin is whoever has a document admins/{uid} (created by hand in the Firebase console; see the setup card).
   Features: global stage gates for the know-yourself journey (step by step, fully open, open up to a stage, closed,
   automatic hold after high wellbeing scores), per-student overrides (open the next stage, release after review),
   the list of students who shared their results by name, flags, details and CSV export. ===== */
var ADMIN = (function () {
  var E = function (s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  var say = function (m) { try { toast(m); } catch (e) { } };
  var dl = function (name, text, mime) { if (typeof downloadFile === 'function') return downloadFile(name, text, mime); var a = document.createElement('a'); a.href = URL.createObjectURL(new Blob(['\ufeff' + text], { type: mime })); a.download = name; document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500); };
  var ST = ['البداية والموافقة', 'المزاج', 'الذاكرة', 'التركيز', 'الحالة النفسية', 'حياتك الرقمية: ضغط التواجد الرقمي الدائم', 'أنت والذكاء الاصطناعي: الاعتماد المعرفي على الذكاء الاصطناعي', 'النتائج'];
  var MODES = [['seq', 'مرحلة مرحلة تلقائيًا (كل مرحلة تفتح بعد اللي قبلها)'], ['open', 'كل المراحل مفتوحة'], ['upto', 'مفتوحة لحد مرحلة معينة'], ['locked', 'مقفولة']];
  var CSS = '.ad{display:flex;flex-direction:column;gap:14px;max-width:1100px;margin:0 auto}.ad-card{border:1px solid var(--line,#ddd);border-radius:14px;padding:16px;background:var(--surface,#fff);display:flex;flex-direction:column;gap:10px}.ad-card h3{margin:0}.ad-row{display:flex;flex-wrap:wrap;gap:8px;align-items:center}.ad select,.ad input[type=text]{border:1px solid var(--line,#ccc);border-radius:8px;padding:6px 8px;font:inherit;background:var(--surface,#fff);color:inherit}.ad-btn{border:1px solid var(--primary,var(--accent,#5b3fd1));background:var(--primary,var(--accent,#5b3fd1));color:#fff;border-radius:9px;padding:6px 12px;font:inherit;cursor:pointer}.ad-btn.g{background:transparent;color:var(--primary,var(--accent,#5b3fd1))}.ad-btn.r{border-color:#b3261e;background:transparent;color:#b3261e}.ad-tw{overflow-x:auto}.ad table{border-collapse:collapse;width:100%;min-width:900px;font-size:14px}.ad th,.ad td{border-bottom:1px solid var(--line,#e5e5e5);padding:7px 8px;text-align:start;vertical-align:top}.ad tr.flag td{background:rgba(179,38,30,.07)}.ad-chip{display:inline-block;border-radius:999px;padding:0 9px;font-size:12px}.ad-chip.r{background:#fbe3e1;color:#b3261e}.ad-chip.g{background:#e1f2e6;color:#1e7a3c}.ad-chip.y{background:#fbf0d5;color:#8a5a00}.ad code{direction:ltr;unicode-bidi:isolate;background:rgba(0,0,0,.06);padding:1px 6px;border-radius:6px;word-break:break-all}.ad ol li{line-height:1.9}';
  function css() { if (document.getElementById('ad-css')) return; var s = document.createElement('style'); s.id = 'ad-css'; s.textContent = CSS; document.head.appendChild(s); }
  var fsOK = function () { try { return !!(window.ACCT && ACCT.fs && ACCT.fs.ready()); } catch (e) { return false; } };
  function flags(r) { var w = r.well || {}, out = []; if (w.phq >= 10) out.push('PHQ-8 = ' + w.phq); if (w.gad >= 10) out.push('GAD-7 = ' + w.gad); if (w.who != null && w.who * 4 <= 28) out.push('WHO-5 = ' + (w.who * 4) + '%'); return out; }
  var pct = function (x) { return x == null || !isFinite(x) ? '—' : Math.round(x) + '%'; };
  function setupCard(uid, err) {
    return '<section class="ad-card"><h3>تفعيل صلاحية المسؤول (مرة واحدة)</h3>' + (err ? '<p style="margin:0;color:#b3261e">' + E(err) + '</p>' : '') + '<p style="margin:0">حسابك لسه مش مسؤول. الصلاحية بتتعمل يدويًا من Firebase علشان محدش غيرك يقدر يعملها، ومن غير ما إيميلك يظهر في الكود العام:</p><ol style="margin:0"><li>افتح Firebase Console ← مشروع الموقع ده ← <b>Firestore Database</b> ← تبويب <b>Rules</b>، والصق ملف <code>firestore.rules</code> الموجود في GitHub، ودوس <b>Publish</b>.</li><li>في تبويب <b>Data</b> دوس <b>Start collection</b> واكتب الاسم <code>admins</code>.</li><li>في <b>Document ID</b> الصق المعرّف ده: <code id="adUid">' + E(uid) + '</code> <button class="ad-btn g" id="adCp">نسخ</button></li><li>ضيف حقل اسمه <code>role</code> نوعه string وقيمته <code>admin</code>، ودوس <b>Save</b>، وبعدين ارجع حدّث الصفحة دي.</li></ol><p class="muted" style="margin:0;font-size:13px">كل موقع ليه مشروع Firebase منفصل، فاعمل الخطوات دي في المشروعين لو عايز اللوحة في الاتنين.</p></section>';
  }
  function gateForm(g) {
    g = g || { mode: 'seq', upto: 7, hold: false, note: '' };
    return '<section class="ad-card"><h3>إعدادات الرحلة لكل الطلاب</h3><div class="ad-row"><label>طريقة الفتح <select id="gM">' + MODES.map(function (m) { return '<option value="' + m[0] + '"' + (g.mode === m[0] ? ' selected' : '') + '>' + m[1] + '</option>'; }).join('') + '</select></label><label id="gUL">لحد مرحلة <select id="gU">' + ST.map(function (t, i) { return '<option value="' + i + '"' + ((g.upto != null ? g.upto : 7) === i ? ' selected' : '') + '>' + (i + 1) + '. ' + t + '</option>'; }).join('') + '</select></label></div><label class="ad-row"><input type="checkbox" id="gH" ' + (g.hold ? 'checked' : '') + '> وقّف الطالب بعد «الحالة النفسية» لو نتايجه مرتفعة (PHQ-8 أو GAD-7 من 10 فأكثر، أو WHO-5 من 28% فأقل) لحد ما أراجعها وأسمح له</label><label>رسالة تظهر للطلاب (اختياري) <input type="text" id="gN" maxlength="300" style="width:100%" value="' + E(g.note || '') + '"></label><div><button class="ad-btn" id="gS">احفظ للكل</button></div></section>';
  }
  function progCell(r, id) { var t = window.__TR && window.__TR[id], tr = {}; try { tr = t ? JSON.parse(t.results || '{}') : {}; } catch (e) { } var p = r._p || tr._p; return p ? (p.lessons + ' درس · ' + p.xp + ' نقطة' + (p.streak ? ' · سلسلة ' + p.streak : '')) : '—'; }
  function testsCell(id) { var t = window.__TR && window.__TR[id]; if (!t) return '—'; var tr = {}; try { tr = JSON.parse(t.results || '{}'); } catch (e) { } var keys = Object.keys(tr).filter(function (k) { return k !== '_p'; }); if (!keys.length) return '—'; var NM = { bigfive: 'الشخصية', rses: 'تقدير الذات', pss: 'الضغط', swls: 'الرضا', brs: 'الصمود', ucla: 'الوحدة', grit: 'المثابرة', erq: 'تنظيم الانفعال', asrs: 'فرز الانتباه', matrix: 'المصفوفات', series: 'المتسلسلات', analog: 'التناظر', rotate: 'التدوير', coding: 'السرعة' }; return '<span style="font-size:12px">' + keys.map(function (k) { var x = tr[k], v = x.total != null ? x.total : x.mean != null ? (+x.mean).toFixed(2) : x.pct != null ? x.pct + '%' : x.shaded != null ? x.shaded + '/6' : x.sub ? Object.keys(x.sub).map(function (q) { return q + ' ' + x.sub[q]; }).join(' ') : ''; return E(NM[k] || k) + ': <b>' + E(String(v)) + '</b>'; }).join('<br>') + '</span>'; }
  function studentRow(k, gt) {
    var r = {}; try { r = JSON.parse(k.results || '{}'); } catch (e) { }
    var w = r.well || {}, F = flags(r), g = gt || {}, mode = g.mode || 'inherit', when = k.updated && k.updated.toDate ? k.updated.toDate().toLocaleString('ar-EG') : '';
    var sel = '<select data-m="' + k.id + '"><option value="inherit"' + (mode === 'inherit' ? ' selected' : '') + '>زي الإعداد العام</option>' + MODES.map(function (m) { return '<option value="' + m[0] + '"' + (mode === m[0] ? ' selected' : '') + '>' + m[1].split(' (')[0] + '</option>'; }).join('') + '</select> <select data-u="' + k.id + '">' + ST.map(function (t, i) { return '<option value="' + i + '"' + ((g.upto != null ? g.upto : 7) === i ? ' selected' : '') + '>' + (i + 1) + '</option>'; }).join('') + '</select>';
    return '<tr class="' + (F.length ? 'flag' : '') + '"><td><b>' + E(k.name || '—') + '</b><br><span style="direction:ltr;unicode-bidi:isolate;font-size:12px">' + (k.email ? E(k.email) : 'بدون حساب (ضيف)') + '</span><br><span class="muted" style="font-size:12px">' + E(when) + '</span></td><td>' + (k.done || 0) + ' / 8</td><td>' + (w.who != null ? w.who * 4 + '%' : '—') + '</td><td>' + (w.phq != null ? w.phq : '—') + '</td><td>' + (w.gad != null ? w.gad : '—') + '</td><td>' + pct(r.m6 && r.m6.combined) + '</td><td>' + pct(r.m2 && r.m2.combined) + '</td><td>' + progCell(r, k.id) + '</td><td>' + testsCell(k.id) + '</td><td>' + (F.length ? '<span class="ad-chip r">تحتاج مراجعة</span><br><span style="font-size:12px">' + E(F.join('، ')) + '</span>' : '<span class="ad-chip g">لا تنبيه</span>') + (g.released ? '<br><span class="ad-chip y">مسموح بعد المراجعة</span>' : '') + '</td><td><div class="ad-row">' + sel + '</div><div class="ad-row" style="margin-top:4px"><button class="ad-btn" data-next="' + k.id + '" data-done="' + (k.done || 0) + '">افتح المرحلة التالية</button><button class="ad-btn g" data-rel="' + k.id + '">' + (g.released ? 'الغِ السماح' : 'اسمح بعد المراجعة') + '</button><button class="ad-btn g" data-save="' + k.id + '">احفظ</button></div><details style="margin-top:4px"><summary>التفاصيل</summary><pre style="white-space:pre-wrap;direction:ltr;font-size:11px;max-height:220px;overflow:auto">' + E(JSON.stringify(r, null, 1)) + (window.__TR && window.__TR[k.id] ? '\n\n--- مكتبة الاختبارات ---\n' + E(window.__TR[k.id].results) : '') + '</pre></details><button class="ad-btn r" data-del="' + k.id + '" style="margin-top:4px">امسح نتايجه</button></td></tr>';
  }
  var VIS = 'body:not(.is-admin) [data-go="admin"],body:not(.is-admin) [data-m="admin"],body:not(.is-admin) a[href="#admin"],body:not(.is-admin) button[onclick="go(\'admin\')"]{display:none!important}';
  (function () { var s = document.createElement('style'); s.textContent = VIS; document.head.appendChild(s); })();
  var known = null, lastWhy = '';
  async function ensureAdmin(tryCreate) {
    if (!fsOK()) return null; var uid = ACCT.fs.uid();
    try { var d = await ACCT.fs.get('admins/' + uid); if (d) { mark(true); return d; } } catch (e) { }
    if (!tryCreate) { mark(false); return null; }
    try { if (ACCT.fs.refresh) await ACCT.fs.refresh(); } catch (e) { }
    lastWhy = ''; if (!ACCT.fs.verified()) { lastWhy = 'unverified'; mark(false); return null; }
    try { var em = (ACCT.fs.email() || '').toLowerCase(), doc = { role: 'admin', email: em, name: (ACCT.fs.name() || '').slice(0, 60), added: '__ts__' }; await ACCT.fs.put('admins/' + uid, doc); try { await ACCT.fs.del('invites/' + em); } catch (e) { } mark(true); say('بقيت مسؤول ✓'); return doc; } catch (e) { lastWhy = /permission/i.test((e && (e.code || e.message)) || '') ? 'perm' : 'other:' + ((e && (e.code || e.message)) || ''); mark(false); return null; }
  }
  function mark(v) { known = v; document.body.classList.toggle('is-admin', !!v); }
  /* after sign-in, try once per account to claim admin: the Firestore rules accept it only for the owner's verified email or an invited one */
  function autoClaim(u) { ensureAdmin(false).then(function (d) { if (d) return; var k = 'adm-try-' + u; try { if (localStorage.getItem(k)) return; } catch (e) { } ensureAdmin(true).then(function (ok) { if (!ok && lastWhy === 'unverified') return; try { localStorage.setItem(k, '1'); } catch (e) { } }); }); }
  (function poll(n) { if (fsOK()) { var u = ACCT.fs.uid(); if (u !== poll.u) { poll.u = u; autoClaim(u); } } else if (known) mark(false); setTimeout(function () { poll(n + 1); }, n < 20 ? 1500 : 5000); })(0);
  function adminsCard(admins, invites, me) {
    return '<section class="ad-card"><h3>المسؤولين والدعوات</h3>' + '<div class="ad-tw"><table style="min-width:0"><thead><tr><th>المسؤول</th><th>الإيميل</th><th></th></tr></thead><tbody>' + admins.map(function (a) { return '<tr><td>' + E(a.name || '—') + (a.id === me ? ' <span class="ad-chip g">أنت</span>' : '') + '</td><td style="direction:ltr;unicode-bidi:isolate">' + E(a.email || '') + '</td><td>' + (a.id === me ? '' : '<button class="ad-btn r" data-rmadm="' + E(a.id) + '">شيل الصلاحية</button>') + '</td></tr>'; }).join('') + '</tbody></table></div>' +
      (invites.length ? '<p style="margin:0"><b>دعوات لسه متقبلتش:</b> ' + invites.map(function (v) { return '<span style="direction:ltr;unicode-bidi:isolate">' + E(v.id) + '</span> <button class="ad-btn g" data-rminv="' + E(v.id) + '">الغِ</button>'; }).join(' · ') + '</p>' : '') +
      '<div class="ad-row"><input type="text" id="invE" dir="ltr" placeholder="email@example.com" style="flex:1;min-width:200px" aria-label="إيميل المسؤول الجديد"><button class="ad-btn" id="invGo">ابعت دعوة مسؤول</button></div><p class="muted" style="margin:0;font-size:13px">الدعوة بتتسجل في قاعدة البيانات. ابعت للشخص لينك اللوحة ده: <code>' + E(location.origin + location.pathname + '#admin') + '</code>، ولما يسجّل دخول بنفس الإيميل (بعد تأكيده) ويفتح اللينك، بيبقى مسؤول تلقائيًا.</p></section>';
  }
  /* ---------- setup checklist: tells the owner exactly which step is missing ---------- */
  async function diagnose(el, B, why) {
    var ok = function (v) { return v ? '<span class="ad-chip g">✓</span>' : '<span class="ad-chip r">✗</span>'; }, rows = [], hasA = !!(window.ACCT && ACCT.fs), gh = /github\.io$/.test(location.hostname) || location.hostname === 'localhost';
    var site = document.title.indexOf('الإحصاء') >= 0 ? 'psych-stats-lab' : 'psych-scales-lab', base = 'https://mohamedothman17.github.io/' + site + '/';
    rows.push([gh && hasA, 'فاتح نسخة GitHub من الموقع', gh && hasA ? '' : 'اللوحة مش بتشتغل جوه النسخة المستضيفة. افتح: <a href="' + base + '#admin">' + base + '#admin</a>']);
    var signed = fsOK(); rows.push([signed, 'مسجّل دخول', signed ? E(ACCT.fs.email()) : 'افتح <a href="#account">«حسابي»</a> وسجّل دخول بالإيميل اللي هتبقى بيه مسؤول، وبعدين ارجع هنا.']);
    var ver = false, rules = null;
    if (signed) { try { if (ACCT.fs.refresh) await ACCT.fs.refresh(); } catch (e) { } ver = ACCT.fs.verified();
      rows.push([ver, 'الإيميل مؤكد', ver ? '' : 'افتح «حسابي»: دوس «إعادة إرسال الرسالة»، وافتح آخر رسالة بس. ولو اللينك فتح صفحة خطأ، انسخه والصقه في خانة «اللينك بيفتح صفحة خطأ؟». أو سجّل دخول بزرار Google.']);
      try { await ACCT.fs.get('gates/global'); rules = true; } catch (e) { rules = !/permission|insufficient/i.test((e && (e.code || e.message)) || '') ? null : false; }
      rows.push([rules, 'ملف القواعد الجديد منشور في Firebase (مشروع ' + E((window.FIREBASE_CONFIG || {}).projectId || '') + ')', rules ? '' : rules === false ? 'افتح Firebase Console ← المشروع ده ← Firestore Database ← Rules. امسح الموجود، والصق ملف <b>firestore.rules</b> اللي بعتهولك في المحادثة (اللي فيه إيميلك، مش اللي على GitHub)، ودوس <b>Publish</b>. استنى دقيقة وارجع هنا.' : 'مقدرتش أتأكد (مشكلة اتصال). حدّث الصفحة.']);
      var adm = rules && ver ? await ensureAdmin(true) : null;
      rows.push([!!adm, 'صلاحية المسؤول', adm ? '' : !rules || !ver ? 'هتتفعل تلقائيًا لما الخطوات اللي فوق تكتمل.' : 'القواعد منشورة والإيميل مؤكد، بس الإيميل ده مش الإيميل المسؤول في ملف القواعد، ومفيش دعوة ليه. اتأكد إنك داخل بالإيميل الصح.']);
      if (adm) return render(el); }
    B.innerHTML = '<section class="ad-card"><h3>تجهيز لوحة المسؤول</h3><p style="margin:0">الخطوات دي لازم كلها تبقى ✓، والصفحة بتفحصها بنفسها:</p><div class="ad-tw"><table style="min-width:0"><tbody>' + rows.map(function (r, i) { return '<tr><td style="width:36px">' + ok(r[0]) + '</td><td><b>' + (i + 1) + '. ' + r[1] + '</b>' + (r[2] ? '<div class="muted" style="font-size:13.5px;margin-top:2px">' + r[2] + '</div>' : '') + '</td></tr>'; }).join('') + '</tbody></table></div><div><button class="ad-btn" id="adTry">افحص تاني</button></div></section>';
    B.querySelector('#adTry').onclick = function () { render(el); };
  }
  async function render(el) {
    css(); el.innerHTML = '<div class="ad"><h2 style="margin:0">لوحة المسؤول</h2><div id="adB"><p class="muted">جارٍ التحميل…</p></div></div>';
    var B = el.querySelector('#adB');
    if (!(window.ACCT && ACCT.fs) || !fsOK()) { return diagnose(el, B, null); }

    var uid = ACCT.fs.uid(), adm = await ensureAdmin(true), err = '';
    if (!adm) { return diagnose(el, B, lastWhy); }
    var admins = [], invites = []; try { admins = await ACCT.fs.list('admins'); } catch (e) { } try { invites = await ACCT.fs.list('invites'); } catch (e) { }
    var know = [], gates = [], global = null;
    try { know = await ACCT.fs.list('know'); } catch (e) { err = 'تعذر قراءة النتائج: ' + (e.message || ''); }
    try { gates = await ACCT.fs.list('gates'); } catch (e) { }
    var TR = {}; try { (await ACCT.fs.list('tests')).forEach(function (t) { TR[t.id] = t; }); } catch (e) { }
    Object.keys(TR).forEach(function (id) { if (!know.some(function (k) { return k.id === id; })) know.push({ id: id, name: TR[id].name, email: TR[id].email, done: 0, results: '{}', updated: TR[id].updated }); });
    global = gates.find(function (g) { return g.id === 'global'; }) || null;
    var GT = {}; gates.forEach(function (g) { GT[g.id] = g; });
    window.__TR = TR; var onlyF = false;
    var draw = function () {
      var list = know.slice().sort(function (a, b) { return (b.updated && b.updated.seconds || 0) - (a.updated && a.updated.seconds || 0); }); var nf = list.filter(function (k) { try { return flags(JSON.parse(k.results || '{}')).length; } catch (e) { return false; } }).length;
      if (onlyF) list = list.filter(function (k) { try { return flags(JSON.parse(k.results || '{}')).length; } catch (e) { return false; } });
      B.innerHTML = (err ? '<p style="color:#b3261e">' + E(err) + '</p>' : '') + adminsCard(admins, invites, uid) + gateForm(global) +
        '<section class="ad-card"><div class="ad-row" style="justify-content:space-between"><h3>الطلاب اللي شاركوا نتايجهم (' + know.length + ')</h3><div class="ad-row"><span class="ad-chip r">تحتاج مراجعة: ' + nf + '</span><label class="ad-row"><input type="checkbox" id="adF" ' + (onlyF ? 'checked' : '') + '> اللي محتاجين مراجعة بس</label><button class="ad-btn g" id="adCsv">تصدير CSV</button><button class="ad-btn g" id="adRe">تحديث</button></div></div>' +
        (list.length ? '<div class="ad-tw"><table><thead><tr><th>الطالب</th><th>المراحل</th><th>WHO-5</th><th>PHQ-8</th><th>GAD-7</th><th>ضغط التواجد الرقمي</th><th>الاعتماد على الذكاء الاصطناعي</th><th>التقدم في الموقع</th><th>مكتبة الاختبارات</th><th>التنبيه</th><th>التحكم في مراحله</th></tr></thead><tbody>' + list.map(function (k) { return studentRow(k, GT[k.id]); }).join('') + '</tbody></table></div>' : '<p class="muted" style="margin:0">لسه مفيش طالب شارك نتايجه. المشاركة اختيارية، والطالب بيوافق عليها في أول الرحلة أو في صفحة النتائج.</p>') +
        '<p class="muted" style="margin:0;font-size:13px">النتايج دي فرز مش تشخيص. التنبيه معناه «يستاهل تتواصل معاه»، ولو فيه خطر واضح اتبع بروتوكول الأزمة مع المشرف المرخّص.</p></section>';
      var gM = B.querySelector('#gM'), uL = B.querySelector('#gUL'), sh = function () { uL.style.display = gM.value === 'upto' ? '' : 'none'; }; gM.onchange = sh; sh();
      B.querySelector('#gS').onclick = async function () { var d = { mode: gM.value, upto: +B.querySelector('#gU').value, hold: B.querySelector('#gH').checked, released: false, note: B.querySelector('#gN').value.slice(0, 300) }; try { await ACCT.fs.set('gates/global', d); global = Object.assign({ id: 'global' }, d); say('اتحفظ للكل'); } catch (e) { say('تعذر الحفظ: ' + (e.message || '')); } };
      var anBox = document.createElement('div'); B.prepend(anBox); (function loadAn() { if (window.ADMIN_AN) return ADMIN_AN.render(anBox, ACCT.fs); var sc = document.createElement('script'); sc.src = 'analytics.js?v=d5f81ad7'; sc.onload = function () { ADMIN_AN.render(anBox, ACCT.fs); }; sc.onerror = function () { anBox.innerHTML = '<p class="muted">تعذر تحميل التحليلات.</p>'; }; document.head.appendChild(sc); })();
      B.querySelector('#invGo').onclick = async function () { var em = B.querySelector('#invE').value.trim().toLowerCase(); if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(em)) return say('اكتب إيميل صحيح'); try { await ACCT.fs.put('invites/' + em, { by: uid, created: '__ts__' }); invites.push({ id: em }); say('اتسجلت الدعوة. ابعت له لينك اللوحة'); draw(); } catch (e) { say('تعذر إرسال الدعوة: ' + (e.message || '')); } };
      B.querySelectorAll('[data-rminv]').forEach(function (b) { b.onclick = async function () { try { await ACCT.fs.del('invites/' + b.dataset.rminv); invites = invites.filter(function (v) { return v.id !== b.dataset.rminv; }); draw(); } catch (e) { say('تعذر الإلغاء'); } }; });
      B.querySelectorAll('[data-rmadm]').forEach(function (b) { b.onclick = async function () { if (b.dataset.sure !== '1') { b.dataset.sure = '1'; b.textContent = 'متأكد؟ دوس تاني'; return; } try { await ACCT.fs.del('admins/' + b.dataset.rmadm); admins = admins.filter(function (v) { return v.id !== b.dataset.rmadm; }); draw(); } catch (e) { say('تعذر'); } }; });
      B.querySelector('#adF').onchange = function (e) { onlyF = e.target.checked; draw(); };
      B.querySelector('#adRe').onclick = function () { render(el); };
      B.querySelector('#adCsv').onclick = function () { var rows = [['name', 'email', 'done', 'who5_pct', 'phq8', 'gad7', 'm6_direct', 'm6_indirect', 'm6_combined', 'm2_direct', 'm2_indirect', 'm2_combined', 'digit_span', 'stroop_ms', 'probe_opened', 'cal_wrong_accepted']]; know.forEach(function (k) { var r = {}; try { r = JSON.parse(k.results || '{}'); } catch (e) { } var w = r.well || {}, sp = r.span || {}; rows.push([k.name, k.email, k.done, w.who != null ? w.who * 4 : '', w.phq, w.gad, r.m6 && r.m6.direct, r.m6 && r.m6.indirect, r.m6 && r.m6.combined, r.m2 && r.m2.direct, r.m2 && r.m2.indirect, r.m2 && r.m2.combined, sp.best, r.stroop && r.stroop.interf, sp.probe ? (sp.probe.opened ? 1 : 0) : '', r.m2 && r.m2.cal ? r.m2.cal.wrongAcc : ''].map(function (v) { return v == null ? '' : typeof v === 'number' ? Math.round(v * 100) / 100 : '"' + String(v).replace(/"/g, '""') + '"'; })); }); dl('know-results.csv', rows.map(function (r) { return r.join(','); }).join('\n'), 'text/csv;charset=utf-8'); };
      var saveG = async function (id, patch) { var cur = GT[id] || { mode: 'inherit', upto: 7, hold: false, released: false, note: '' }, d = Object.assign({ mode: cur.mode || 'inherit', upto: cur.upto != null ? cur.upto : 7, hold: false, released: !!cur.released, note: cur.note || '' }, patch); try { await ACCT.fs.set('gates/' + id, d); GT[id] = Object.assign({ id: id }, d); say('اتحفظ'); draw(); } catch (e) { say('تعذر الحفظ: ' + (e.message || '')); } };
      B.querySelectorAll('[data-save]').forEach(function (b) { b.onclick = function () { var id = b.dataset.save; saveG(id, { mode: B.querySelector('[data-m="' + id + '"]').value, upto: +B.querySelector('[data-u="' + id + '"]').value }); }; });
      B.querySelectorAll('[data-next]').forEach(function (b) { b.onclick = function () { var id = b.dataset.next, cur = GT[id], base = cur && cur.mode === 'upto' ? cur.upto + 1 : +b.dataset.done; saveG(id, { mode: 'upto', upto: Math.min(7, Math.max(1, base)), released: true }); }; });
      B.querySelectorAll('[data-rel]').forEach(function (b) { b.onclick = function () { var id = b.dataset.rel; saveG(id, { released: !(GT[id] && GT[id].released) }); }; });
      B.querySelectorAll('[data-del]').forEach(function (b) { b.onclick = async function () { var id = b.dataset.del; if (b.dataset.sure !== '1') { b.dataset.sure = '1'; b.textContent = 'متأكد؟ دوس تاني للمسح'; return; } try { await ACCT.fs.del('know/' + id); know = know.filter(function (k) { return k.id !== id; }); say('اتمسح'); draw(); } catch (e) { say('تعذر المسح'); } }; });
    };
    draw();
  }
  if (typeof VIEWS !== 'undefined') VIEWS.admin = function (el) { render(el); };
  else { var route = function () { if ((location.hash || '').slice(1).split('/')[0] !== 'admin') return; var v = document.getElementById('view'); if (v) render(v); }; addEventListener('hashchange', function () { setTimeout(route, 0); }); if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { setTimeout(route, 0); }); else setTimeout(route, 0); }
  return { render: render };
})();

/* ===== Motion layer «رحلة الباحث»: motion that explains the content rather than decorating it.
   - Hero: a live questionnaire — Likert answers get picked one by one while n grows and the α gauge fills.
   - Headline: masked word reveal (SplitText mask). Page changes: violet wipe + clip-path reveals.
   - Journey: a researcher token travels the 12-rule path with scroll (MotionPath + ScrollTrigger scrub).
   - Cards: 3D tilt with a cursor-following light. Badges: a stamp, not confetti.
   Lenis smooth scroll synced with ScrollTrigger. Reduced-motion viewers get the static, complete UI. ===== */
const MOTION = (() => {
  const G = window.gsap, ST = window.ScrollTrigger, SPLIT = window.SplitText, MP = window.MotionPathPlugin;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const on = !!G && !reduce;
  const hover = matchMedia('(hover: hover)').matches;
  let lenis = null;
  if (G) [ST, SPLIT, MP].forEach(p => p && G.registerPlugin(p));

  function initLenis() {
    if (!on || !window.Lenis || !ST) return;
    lenis = new window.Lenis({ duration: 1.1, smoothWheel: true, syncTouch: false });
    lenis.on('scroll', ST.update);
    G.ticker.add(t => lenis.raf(t * 1000));
    G.ticker.lagSmoothing(0);
    document.documentElement.classList.add('lenis');
  }
  const scrollTop = () => { if (lenis) lenis.scrollTo(0, { immediate: true }); else window.scrollTo(0, 0); };

  /* ---- page change: a violet wipe passes over, then blocks are revealed with a clip-path cut ---- */
  let wipe = null, first = true;
  function page(root) {
    if (!on || !root) return;
    ST && ST.getAll().forEach(t => t.vars && t.vars.id === 'rv' && t.kill());
    if (!first) {
      if (!wipe) { wipe = document.createElement('div'); wipe.className = 'wipe'; document.body.appendChild(wipe); }
      G.fromTo(wipe, { scaleX: 1, transformOrigin: '0% 50%' }, { scaleX: 0, duration: 0.55, ease: 'expo.inOut' });
    }
    first = false;
    const blocks = [...root.children].filter(n => n.nodeType === 1);
    const top = blocks.slice(0, 2), rest = blocks.slice(2);
    G.fromTo(top, { clipPath: 'inset(0 0 100% 0)', y: 24 }, { clipPath: 'inset(0 0 0% 0)', y: 0, duration: 0.8, ease: 'expo.out', stagger: 0.08, delay: 0.12, clearProps: 'clipPath,transform' });
    if (ST && rest.length) {
      G.set(rest, { clipPath: 'inset(0 0 100% 0)', y: 30 });
      ST.batch(rest, { id: 'rv', start: 'top 92%', once: true, onEnter: b => G.to(b, { clipPath: 'inset(0 0 0% 0)', y: 0, duration: 0.85, ease: 'expo.out', stagger: 0.08, clearProps: 'clipPath,transform' }) });
      ST.refresh();
    }
    root.querySelectorAll('.ring svg circle:last-child').forEach(c => { const d = c.getAttribute('stroke-dasharray'); if (!d) return; G.from(c, { strokeDashoffset: parseFloat(d), duration: 1.2, ease: 'power3.out', delay: 0.3 }); });
    tilt(root);
  }

  /* ---- +XP chip flies into the points pill ---- */
  function xp(n) {
    if (!n) return;
    const pill = document.querySelector('#pXp') || document.querySelector('.pill.xp');
    const f = document.createElement('div'); f.className = 'xpfloat'; f.textContent = '+' + n; document.body.appendChild(f);
    const r = pill ? pill.getBoundingClientRect() : { left: innerWidth / 2, top: 60, width: 0, height: 0 };
    if (!on) { f.style.left = (r.left + r.width / 2) + 'px'; f.style.top = (r.top + 6) + 'px'; setTimeout(() => f.remove(), 900); return; }
    G.set(f, { left: innerWidth / 2, top: innerHeight * 0.55, xPercent: -50, scale: 0.4, autoAlpha: 0 });
    G.timeline({ onComplete: () => f.remove() })
      .to(f, { scale: 1.25, autoAlpha: 1, duration: 0.3, ease: 'back.out(2.5)' })
      .to(f, { left: r.left + r.width / 2, top: r.top + r.height / 2, scale: 0.5, duration: 0.65, ease: 'power3.in' }, '+=0.15')
      .to(f, { autoAlpha: 0, duration: 0.12 })
      .add(() => pill && G.fromTo(pill, { scale: 1.3, backgroundColor: 'rgba(190,242,100,.6)' }, { scale: 1, backgroundColor: '', duration: 0.5, ease: 'elastic.out(1,.4)', clearProps: 'backgroundColor' }), '-=0.12');
  }

  /* ---- badge stamp: the medal slams in with a shock ring (used for badges and perfect scores) ---- */
  function stamp(label) {
    if (!on) return;
    const w = document.createElement('div'); w.className = 'stamp'; w.innerHTML = `<div class="ring"></div><div class="medal">${LOGO_SVG}<b>${esc(label || 'وسام جديد')}</b></div>`;
    document.body.appendChild(w);
    G.timeline({ onComplete: () => w.remove() })
      .fromTo(w.querySelector('.medal'), { scale: 2.6, rotate: -18, autoAlpha: 0 }, { scale: 1, rotate: 0, autoAlpha: 1, duration: 0.45, ease: 'power4.in' })
      .fromTo(w.querySelector('.ring'), { scale: 0.6, autoAlpha: 0.9 }, { scale: 2.4, autoAlpha: 0, duration: 0.7, ease: 'expo.out' }, '-=0.02')
      .to(w.querySelector('.medal'), { y: -6, duration: 0.1, yoyo: true, repeat: 1 }, '<')
      .to(w, { autoAlpha: 0, y: -20, duration: 0.4, delay: 1.1 });
  }
  const confetti = () => stamp('أداء كامل!');

  /* ---- hero: masked headline + live questionnaire filling the α gauge ---- */
  function hero(root) {
    if (!root) return;
    const live = root.querySelector('.hx-live');
    if (!on) return;
    const h = root.querySelector('.hx-title');
    if (h && SPLIT) { const sp = new SPLIT(h, { type: 'words', mask: 'words' }); G.from(sp.words, { yPercent: 120, duration: 0.9, ease: 'expo.out', stagger: 0.07 }); }
    G.from(root.querySelectorAll('.hx-kick, .hx-sub, .hx-cta > *, .hx-stats > div'), { y: 18, autoAlpha: 0, duration: 0.7, ease: 'expo.out', stagger: 0.05, delay: 0.3, clearProps: 'all' });
    root.querySelectorAll('[data-count]').forEach(n => { const v = +n.dataset.count || 0, o = { v: 0 }; G.to(o, { v, duration: 1.4, ease: 'expo.out', delay: 0.4, onUpdate: () => n.textContent = Math.round(o.v).toLocaleString('en-US') }); });
    const ticks = root.querySelectorAll('.ruler i'); if (ticks.length) G.from(ticks, { scaleY: 0, transformOrigin: '50% 100%', duration: 0.6, ease: 'expo.out', stagger: { each: 0.01, from: 'end' }, delay: 0.4 });
    const needle = root.querySelector('.ruler .needle'); if (needle) G.from(needle, { left: '100%', duration: 1.6, ease: 'expo.out', delay: 0.6 });
    if (live) questionnaire(live, root);
  }
  function questionnaire(live, root) {
    const rows = [...live.querySelectorAll('.lq-row')], arc = live.querySelector('.lq-arc'), val = live.querySelector('.lq-a'), nEl = live.querySelector('.lq-n'), L = arc ? arc.getTotalLength() : 0;
    const alphaAt = n => Math.min(0.91, 0.42 + 0.49 * (1 - Math.exp(-n / 9)));
    let n = 0; if (arc) G.set(arc, { strokeDasharray: L, strokeDashoffset: L });
    const round = () => {
      const tl = G.timeline({ onComplete: () => { if (document.body.contains(live)) round(); } });
      tl.to(live.querySelectorAll('.lq-dot.on'), { scale: 0.6, autoAlpha: 0.25, duration: 0.25, ease: 'power2.in', onComplete: () => live.querySelectorAll('.lq-dot.on').forEach(d => d.classList.remove('on')) });
      rows.forEach((r, i) => {
        const dots = r.querySelectorAll('.lq-dot'), pick = dots[Math.floor(Math.random() * 2) + (i % 2 ? 2 : 3)] || dots[3];
        tl.add(() => pick.classList.add('on')).fromTo(pick, { scale: 0.2 }, { scale: 1, autoAlpha: 1, duration: 0.45, ease: 'back.out(3)' }, '+=0.18');
      });
      tl.add(() => { n += 1; nEl.textContent = n; const a = alphaAt(n); G.to(arc, { strokeDashoffset: L * (1 - a), duration: 0.9, ease: 'expo.out' }); const o = { v: parseFloat(val.textContent) || 0 }; G.to(o, { v: a, duration: 0.9, ease: 'expo.out', onUpdate: () => val.textContent = o.v.toFixed(2) }); live.classList.toggle('good', a >= 0.7); }, '+=0.15')
        .to({}, { duration: 0.9 });
    };
    round();
  }

  /* ---- journey: path drawn to the current level, a token rides the path with scroll ---- */
  function journey(root) {
    if (!root) return;
    const p = root.querySelector('path.trail'), tok = root.querySelector('.jtoken');
    if (p) {
      const L = p.getTotalLength(), fr = Math.max(0, Math.min(1, +getComputedStyle(p).getPropertyValue('--lit') || 0));
      p.style.strokeDasharray = L; p.style.strokeDashoffset = L * (1 - fr);
      if (on && ST && fr > 0) G.fromTo(p, { strokeDashoffset: L }, { strokeDashoffset: L * (1 - fr), ease: 'none', scrollTrigger: { trigger: root, start: 'top 80%', end: 'center 50%', scrub: 0.8 } });
      if (tok && MP && on && ST) G.to(tok, { motionPath: { path: p, align: p, alignOrigin: [0.5, 0.5], start: 0, end: Math.max(0.0001, fr) }, ease: 'none', scrollTrigger: { trigger: root, start: 'top 80%', end: 'center 50%', scrub: 0.8 } });
      else if (tok) { const pt = p.getPointAtLength(L * fr); tok.setAttribute('transform', `translate(${pt.x} ${pt.y})`); }
    }
    if (!on || !ST) return;
    G.from(root.querySelectorAll('.jn'), { scale: 0, transformOrigin: '50% 50%', duration: 0.6, ease: 'back.out(2.4)', stagger: { each: 0.05, from: 'start' }, scrollTrigger: { trigger: root, start: 'top 80%', once: true } });
  }

  /* ---- 3D tilt with a cursor-following light ---- */
  function tilt(root) {
    if (!on || !hover) return;
    root.querySelectorAll('.linkcard, .hx-stats > div, .tile').forEach(el => {
      if (el.dataset.tilt) return; el.dataset.tilt = '1';
      const rx = G.quickTo(el, 'rotationX', { duration: 0.5, ease: 'power3' }), ry = G.quickTo(el, 'rotationY', { duration: 0.5, ease: 'power3' });
      G.set(el, { transformPerspective: 700 });
      el.addEventListener('pointermove', e => { const r = el.getBoundingClientRect(), px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height; rx((0.5 - py) * 8); ry((px - 0.5) * 10); el.style.setProperty('--mx', px * 100 + '%'); el.style.setProperty('--my', py * 100 + '%'); });
      el.addEventListener('pointerleave', () => { rx(0); ry(0); });
    });
  }
  function magnetic(root) {
    if (!on || !hover) return;
    root.querySelectorAll('.magnet').forEach(b => {
      const qx = G.quickTo(b, 'x', { duration: 0.4, ease: 'power3' }), qy = G.quickTo(b, 'y', { duration: 0.4, ease: 'power3' });
      b.addEventListener('pointermove', e => { const r = b.getBoundingClientRect(); qx((e.clientX - r.left - r.width / 2) * 0.22); qy((e.clientY - r.top - r.height / 2) * 0.3); });
      b.addEventListener('pointerleave', () => { qx(0); qy(0); });
    });
  }
  return { on, initLenis, scrollTop, page, xp, confetti, stamp, hero, journey, magnetic, tilt, get lenis() { return lenis; } };
})();

/* ===== AI assistant on the student's own account =====
   Inside the hosted preview the page asks the AI assistant through the viewer's own account (claude.use("sample")): nothing is billed to the site.
   On the public GitHub copy there is no in-page AI, so the panel builds the same request for the student to paste
   into their own AI assistant account. */
const AI = (() => {
  let samp, ready = null;
  const get = () => {
    if (!ready) ready = (async () => { try { if (window.claude && typeof window.claude.use === 'function') return await window.claude.use('sample'); } catch (e) { } return null; })();
    return ready.then(s => (samp = s));
  };
  const ERR = { not_granted: 'لم تسمح للموقع باستخدام المساعد الذكي من حسابك.', sampling_disabled: 'المساعد الذكي غير متاح لحسابك الآن.', rate_limited: 'وصلت للحد المسموح؛ حاول بعد قليل.', session_expired: 'سجّل الدخول في المساعد الذكي مرة أخرى.', refused: 'رفض المساعد الذكي هذا الطلب؛ عدّل السؤال وحاول.', invalid_json: 'الرد لم يكن بالشكل المتوقع؛ حاول مرة أخرى.' };
  const SYS = 'أنت مساعد تعليمي في مادة «بناء المقاييس النفسية» لطالب في الدبلوم الخاص في علم النفس (جامعة المنيا). أجب بالعربية الفصحى المبسطة وباختصار منظم (نقاط قصيرة)، واذكر المعادلة عند الحاجة، واربط الإجابة بما يظهر في صفحة الطالب. لا تخترع مراجع أو أرقامًا غير موجودة. إذا كان السؤال خارج القياس النفسي والإحصاء فاعتذر بلطف.';
  const TASKS = [
    ['explain', 'اشرح لي هذه الصفحة', 'اشرح لي محتوى هذه الصفحة خطوة بخطوة كأنك تشرح لزميل، وركز على المفاهيم الأساسية.'],
    ['result', 'فسّر نتائجي', 'فسّر الأرقام والنتائج الظاهرة في هذه الصفحة (الثبات، الصدق، تحليل الفقرات...) وماذا أفعل بعدها.'],
    ['quiz', 'اختبرني', 'اكتب لي 3 أسئلة اختيار من متعدد (أ، ب، ج، د) على محتوى هذه الصفحة بنمط امتحانات الدبلوم، ثم الإجابات في النهاية.'],
    ['items', 'راجع عبارات مقياسي', 'راجع صياغة عبارات المقياس الظاهرة في الصفحة وفق قواعد الصياغة الجيدة (فكرة واحدة، بلا نفي مزدوج، لغة مناسبة)، واقترح بديلًا لكل عبارة ضعيفة.'],
    ['simple', 'بسّط لي مفهومًا', 'بسّط أهم مفهوم في هذه الصفحة بمثال من الحياة اليومية لطالب جامعي.']
  ];
  const ctxText = () => {
    const vc = document.querySelector('#vc'); let t = vc ? vc.innerText : '';
    t = t.replace(/\n{2,}/g, '\n').slice(0, 4500);
    return `الصفحة الحالية: ${(location.hash || '#home').slice(1).split('/')[0]}\n----- محتوى الصفحة -----\n${t}`;
  };
  const prompt = q => `${SYS}\n\n${ctxText()}\n\n----- سؤال الطالب -----\n${q}`;
  const fmtAns = s => esc(s).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/^#{1,4}\s*(.+)$/gm, '<b>$1</b>').replace(/\n/g, '<br>');

  function open(preset) {
    modal(`<div class="ai-head"><span class="ai-orb" aria-hidden="true"></span><div class="grow"><h3 style="margin:0">المساعد الذكي</h3><p class="small muted" style="margin:0" id="aiMode">يتحقق من حسابك…</p></div><button class="ibtn" data-close aria-label="إغلاق">✕</button></div>
      <div class="seg ai-tasks" style="flex-wrap:wrap">${TASKS.map(t => `<button data-t="${t[0]}">${t[1]}</button>`).join('')}</div>
      <label class="fl" for="aiQ">أو اكتب سؤالك</label><textarea id="aiQ" placeholder="مثلًا: متى أستخدم KR‑20 بدل ألفا؟"></textarea>
      <div class="row"><button class="btn" id="aiGo">${ic('bolt')} اسأل</button><span class="small muted grow">الإجابة تعتمد على محتوى الصفحة المفتوحة.</span></div>
      <div id="aiOut" class="ai-out" aria-live="polite"></div>`, (bg, close) => {
      bg.classList.add('ai-sheet');
      const out = $('#aiOut', bg), q = $('#aiQ', bg), mode = $('#aiMode', bg);
      $$('[data-t]', bg).forEach(b => b.onclick = () => { q.value = TASKS.find(t => t[0] === b.dataset.t)[2]; ask(); });
      if (preset) q.value = preset;
      get().then(s => { mode.textContent = s ? 'يعمل بحسابك (أول مرة سيطلب إذنك)' : 'انسخ الطلب وافتحه في حسابك في أي مساعد ذكاء اصطناعي (ChatGPT أو Gemini أو غيره)'; $('#aiGo', bg).innerHTML = s ? `${ic('bolt')} اسأل` : `${ic('copy')} انسخ الطلب`; });
      let ctl = null;
      async function ask() {
        const text = q.value.trim(); if (!text) { q.focus(); return; }
        const p = prompt(text), s = await get();
        if (!s) {
          await copyText(p); out.innerHTML = `<div class="notice small"><b>نُسخ الطلب مع محتوى الصفحة</b>الصقه في حسابك الخاص، وسيجيبك مباشرة.</div><div class="row"><a class="btn sm" href="https://chatgpt.com/" target="_blank" rel="noopener">افتح مساعد الذكاء الاصطناعي</a><a class="btn sm ghost" href="https://chatgpt.com/" target="_blank" rel="noopener">افتح ChatGPT</a></div>`;
          return;
        }
        if (ctl) ctl.abort(); ctl = new AbortController();
        const btn = $('#aiGo', bg); btn.disabled = true; out.innerHTML = '<div class="ai-ans"><span class="muted">يفكر…</span></div>';
        try {
          const r = await s(p, { signal: ctl.signal, cache: false, onText: ({ text }) => { $('.ai-ans', out).innerHTML = fmtAns(text); } });
          $('.ai-ans', out).innerHTML = fmtAns(r.text) + (r.truncated ? '<p class="small muted">(الإجابة طويلة وتوقفت؛ اطلب «أكمل».)</p>' : '');
          addXP(2); quest && quest('ai', 1);
        } catch (e) { if (e && e.name === 'AbortError') return; out.innerHTML = `<div class="notice bad small">${esc(ERR[e && e.code] || 'تعذر الحصول على إجابة الآن.')}</div>`; }
        btn.disabled = false;
      }
      $('#aiGo', bg).onclick = ask;
      q.addEventListener('keydown', e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) ask(); });
    });
  }

  /* structured generation for the builder: returns [{text, dim, neg}] or null */
  async function items(s, k) {
    const sm = await get(); if (!sm || !sm.json) return null;
    const dims = s.dims.map(d => d.name + (d.def ? ` (${d.def})` : ''));
    const r = await sm.json(`أنت خبير في بناء المقاييس النفسية باللغة العربية. اكتب ${k} عبارة لقياس «${s.construct || s.name}» لدى ${s.group || 'طلاب الجامعة'}.\nالتعريف النظري: ${s.defC || '—'}\nالأبعاد: ${dims.join('، ')} — وزّع العبارات عليها.\nقواعد: فصحى واضحة، فكرة واحدة لكل عبارة، عبارة تقريرية بضمير المتكلم، بلا نفي مزدوج، ونحو ربع العبارات سالبة.\nأعد JSON فقط: {"items":[{"text":"...","dim":"اسم البعد كما هو","neg":false}]}`, { modelTier: 'default' });
    return r && Array.isArray(r.items) ? r.items : null;
  }

  function fab() {
    if (document.getElementById('aiFab')) return;
    const b = document.createElement('button'); b.id = 'aiFab'; b.className = 'ai-fab'; b.setAttribute('aria-label', 'المساعد الذكي');
    b.innerHTML = `<span class="ai-orb" aria-hidden="true"></span><span>اسأل المساعد</span>`; b.onclick = () => open();
    document.body.appendChild(b);
  }
  return { open, items, fab, available: () => get().then(Boolean), ERR };
})();

/* ===== Optional accounts =====
   Web (GitHub Pages): Firebase Authentication (email + password) + Firestore, only when
   window.FIREBASE_CONFIG is set (see SETUP-FIREBASE.md). Passwords never touch this code's
   storage: Firebase Auth stores them hashed (scrypt) on Google's servers.
   Inside the hosted preview: the viewer's own account; progress syncs through the artifact db when allowed. */
(function () {
  const APP = window.ACCT_APP || 'scales';             /* 'scales' | 'stats' */
  const cfg = window.FIREBASE_CONFIG || null;
  const OTHER = APP === 'scales' ? 'stats' : 'scales';
  const st = { mode: 'none', user: null, ready: false, fb: null, db: null, lbOptIn: true, verified: false, name: '', phone: '', failures: 0, lockUntil: 0, claudeDb: null, claudeUid: null, claudeName: '' };
  const h = s => (typeof esc === 'function' ? esc(s) : String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])));
  const getS = () => window.ACCT_HOOKS.get(), setS = x => window.ACCT_HOOKS.set(x), changed = () => window.ACCT_HOOKS.changed();
  const week7 = s => { let t = 0; for (let i = 0; i < 7; i++) { const d = new Date(); d.setDate(d.getDate() - i); const k = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); t += (s.hist && s.hist[k]) || 0; } return t; };

  /* ---------- loading the vendored SDK (same-origin files, pinned 10.12.2) ---------- */
  function loadScript(src) { return new Promise((res, rej) => { const s = document.createElement('script'); s.src = src; s.async = false; s.onload = res; s.onerror = () => rej(new Error('load ' + src)); document.head.appendChild(s); }); }

  /* ---------- email action links (verify email / reset password) handled inside the site ----------
     Works when the Firebase email templates use this site as the custom action URL, and also as the continue URL. */
  const acs = () => ({ url: location.origin + location.pathname + '#account' });
  async function sendVer(user) { try { await user.sendEmailVerification(acs()); } catch (e) { if (/continue-uri|unauthorized-domain/.test(e && e.code || '')) await user.sendEmailVerification(); else throw e; } }
  async function sendReset(auth, em) { try { await auth.sendPasswordResetEmail(em, acs()); } catch (e) { if (/continue-uri|unauthorized-domain/.test(e && e.code || '')) await auth.sendPasswordResetEmail(em); else throw e; } }
  function actionBox(html) { const d = document.createElement('div'); d.setAttribute('role', 'dialog'); d.style.cssText = 'position:fixed;inset:0;z-index:9999;display:grid;place-items:center;background:rgba(0,0,0,.45);padding:16px'; d.innerHTML = '<div style="background:var(--surface,#fff);color:var(--ink,#111);border-radius:14px;padding:18px;max-width:420px;width:100%;display:flex;flex-direction:column;gap:10px;font:inherit">' + html + '</div>'; document.body.appendChild(d); return d; }
  async function handleAction(auth) {
    const q = new URLSearchParams(location.search), mode = q.get('mode'), code = q.get('oobCode'); if (!mode || !code) return;
    const clean = () => { try { history.replaceState(null, '', location.pathname + '#account'); } catch (e) { } };
    const bad = e => { const c = (e && e.code) || ''; return /expired|invalid-action-code/.test(c) ? 'اللينك ده انتهى أو اتستخدم قبل كده. لو طلبت أكتر من رسالة، استخدم آخر رسالة بس، أو اطلب رسالة جديدة من «حسابي».' : 'حصل خطأ: ' + (c || (e && e.message) || ''); };
    try {
      if (mode === 'verifyEmail') { await auth.applyActionCode(code); clean(); await new Promise(r => { const un = auth.onAuthStateChanged(u => { un(); r(u); }); }); if (auth.currentUser) { await auth.currentUser.reload(); await auth.currentUser.getIdToken(true); st.verified = !!auth.currentUser.emailVerified; changed(); } const d = actionBox('<h3 style="margin:0">تم تأكيد بريدك ✓</h3><p style="margin:0">حسابك مفعّل دلوقتي. لو مش داخل، سجّل دخولك من «حسابي».</p><button style="padding:8px 14px;border-radius:9px;border:0;cursor:pointer">تمام</button>'); d.querySelector('button').onclick = () => d.remove(); }
      else if (mode === 'resetPassword') { const em = await auth.verifyPasswordResetCode(code); const d = actionBox('<h3 style="margin:0">كلمة مرور جديدة</h3><p style="margin:0" dir="ltr">' + String(em).replace(/[<>&"]/g, '') + '</p><label for="rpw">كلمة المرور الجديدة (8 أحرف على الأقل)</label><input id="rpw" type="password" autocomplete="new-password" style="padding:8px;border-radius:8px;border:1px solid #ccc"><div id="rpm" style="font-size:14px"></div><button style="padding:8px 14px;border-radius:9px;border:0;cursor:pointer">احفظ</button>'); d.querySelector('button').onclick = async () => { const pw = d.querySelector('#rpw').value; if (pw.length < 8) { d.querySelector('#rpm').textContent = 'كلمة المرور لازم تكون 8 أحرف على الأقل'; return; } try { await auth.confirmPasswordReset(code, pw); clean(); d.querySelector('div').innerHTML = '<h3 style="margin:0">اتغيرت كلمة المرور ✓</h3><p style="margin:0">سجّل دخولك دلوقتي بكلمة المرور الجديدة من «حسابي».</p>'; setTimeout(() => d.remove(), 4000); } catch (e) { d.querySelector('#rpm').textContent = bad(e); } }; }
      else if (mode === 'recoverEmail') { await auth.checkActionCode(code); await auth.applyActionCode(code); clean(); const d = actionBox('<h3 style="margin:0">رجع بريدك القديم ✓</h3><p style="margin:0">يُفضّل تغيّر كلمة المرور دلوقتي من «حسابي».</p><button style="padding:8px 14px;border-radius:9px;border:0;cursor:pointer">تمام</button>'); d.querySelector('button').onclick = () => d.remove(); }
    } catch (e) { clean(); const d = actionBox('<h3 style="margin:0">مقدرناش نكمّل</h3><p style="margin:0">' + bad(e) + '</p><button style="padding:8px 14px;border-radius:9px;border:0;cursor:pointer">تمام</button>'); d.querySelector('button').onclick = () => d.remove(); }
  }
  async function initFirebase() {
    const base = (window.FIREBASE_SDK_BASE || 'vendor/firebase-10.12.2/');
    await loadScript(base + 'firebase-app-compat.js'); await loadScript(base + 'firebase-auth-compat.js'); await loadScript(base + 'firebase-firestore-compat.js');
    const app = firebase.initializeApp(cfg);
    if (window.FIREBASE_APPCHECK_SITE_KEY) { try { await loadScript(base + 'firebase-app-check-compat.js'); firebase.appCheck().activate(new firebase.appCheck.ReCaptchaV3Provider(window.FIREBASE_APPCHECK_SITE_KEY), true); } catch (e) { } }
    st.fb = firebase; st.db = firebase.firestore();
    firebase.auth().useDeviceLanguage();
    handleAction(firebase.auth());
    firebase.auth().getRedirectResult().then(r => { if (r && r.user && typeof toast === 'function') toast('أهلًا بيك'); }).catch(e => { const c = (e && e.code) || ''; const m = /unauthorized-domain/.test(c) ? 'الدخول بـ Google لسه مش متفعّل على عنوان الموقع ده في Firebase.' : 'الدخول بـ Google مارجعش من صفحة Google. استخدم الإيميل وكلمة السر (أو «نسيت كلمة السر» لو حسابك اتعمل بـ Google).'; try { sessionStorage.setItem('g-err', m + (c ? ' (' + c + ')' : '')); } catch (x) { } if (typeof toast === 'function') toast(m + (c ? ' (' + c + ')' : '')); });
    firebase.auth().onAuthStateChanged(async u => {
      st.user = u; st.verified = !!(u && u.emailVerified); st.name = u ? (u.displayName || '') : '';
      st.ready = true;
      if (u) { await pullAndMerge(); hookCloud(); } else unhookCloud();
      changed();
    });
  }
  const userRef = () => st.db.collection('users').doc(st.user.uid);
  async function pullAndMerge() {
    try {
      const snap = await userRef().get(); const d = snap.exists ? snap.data() : {};
      if (d.prefs && typeof d.prefs.lb === 'boolean') st.lbOptIn = d.prefs.lb;
      st.phone = typeof d.phone === 'string' ? d.phone : '';
      st.days = d.days && typeof d.days === 'object' ? d.days : {};
      const remote = d[APP] && d[APP].state ? safeParse(d[APP].state) : null, local = getS();
      if (remote && (remote.xp || 0) > (local.xp || 0)) { setS(Object.assign({}, local, remote, { fs: local.fs, theme: local.theme })); }
      await pushState(getS(), true);
      if (APP === 'scales' && typeof SCALES !== 'undefined') {
        const qs = await userRef().collection('scales').get();
        const remoteScales = qs.docs.map(x => safeParse(x.data().json)).filter(Boolean);
        SCALES.merge(remoteScales);
        SCALES.list().forEach(s => pushScale(s));
      }
    } catch (e) {  }
  }
  const safeParse = s => { try { return JSON.parse(s); } catch (e) { return null; } };
  let lastPush = 0;
  async function pushState(s, force) {
    if (!st.user) return; const now = Date.now(); if (!force && now - lastPush < 4000) return; lastPush = now;
    const json = JSON.stringify(s); if (json.length > 400000) return;
    const ts = st.fb.firestore.FieldValue.serverTimestamp();
    try {
      const dk = (x => x.getFullYear() + '-' + String(x.getMonth() + 1).padStart(2, '0') + '-' + String(x.getDate()).padStart(2, '0'))(new Date()), days = {}, cut = Date.now() - 60 * 864e5;
      st.days = st.days || {}; st.days[dk] = Math.min(10000, (st.days[dk] | 0) + 1);
      Object.keys(st.days).forEach(k => { if (new Date(k).getTime() < cut) { days[k] = st.fb.firestore.FieldValue.delete(); delete st.days[k]; } else days[k] = st.days[k]; });
      await userRef().set({ name: (st.name || '').slice(0, 40), ...(st.user.isAnonymous ? {} : { email: (st.user.email || '').slice(0, 120) }), days, [APP]: { state: json, xp: s.xp | 0 }, updated: ts }, { merge: true });
      if (st.lbOptIn && st.verified) {
        const lbRef = st.db.collection('leaderboard').doc(st.user.uid), cur = await lbRef.get(), c = cur.exists ? cur.data() : {};
        const xpMine = Math.max(0, Math.min(1e6, s.xp | 0)), wMine = Math.max(0, Math.min(1e6, week7(s) | 0));
        const xpOther = (c.xp && c.xp[OTHER]) | 0, wOther = (c.w && c.w[OTHER]) | 0;
        await lbRef.set({ name: (st.name || 'باحث').slice(0, 40), xp: { [APP]: xpMine, [OTHER]: xpOther }, w: { [APP]: wMine, [OTHER]: wOther }, total: xpMine + xpOther, week: wMine + wOther, updated: ts });
      }
    } catch (e) {  }
  }
  async function pushScale(s) { if (!st.user || APP !== 'scales') return; const json = JSON.stringify(s); if (json.length > 900000) return; try { await userRef().collection('scales').doc(s.id).set({ json, updated: st.fb.firestore.FieldValue.serverTimestamp() }); } catch (e) {  } }
  function hookCloud() { if (typeof Cloud !== 'undefined') Cloud.push = s => pushState(s); if (typeof SCALES !== 'undefined') { SCALES.cloud.push = s => pushScale(s); SCALES.cloud.remove = id => st.user && userRef().collection('scales').doc(id).delete().catch(() => { }); } }
  function unhookCloud() { if (typeof Cloud !== 'undefined') Cloud.push = null; if (typeof SCALES !== 'undefined') { SCALES.cloud.push = null; SCALES.cloud.remove = null; } }

  /* ---------- hosted-preview mode ---------- */
  async function initClaude() {
    try {
      const [db, user] = await Promise.all([window.claude.use('db'), window.claude.use('user')]);
      if (!user) return; const id = await user.id(); st.claudeUid = id; st.claudeName = (await user.name()) || '';
      st.mode = 'claude'; st.ready = true;
      if (db && id) {
        const ref = db.collection('data/users/' + id).doc('progress-v2');
        const snap = await ref.get();
        if (snap.exists) { const r = safeParse(snap.data().json); if (r && (r.xp || 0) > (getS().xp || 0)) setS(Object.assign({}, getS(), r)); }
        let writable = true;
        const push = async s => { if (!writable) return; try { await ref.set({ json: JSON.stringify(s), updated: Date.now() }); } catch (e) { writable = false; } };
        await push(getS());
        if (writable) { st.claudeDb = db; if (typeof Cloud !== 'undefined') Cloud.push = push; }
        if (writable && typeof SCALES !== 'undefined') {
          const col = db.collection('data/users/' + id);
          try { const qs = await col.get(); SCALES.merge(qs.docs.filter(d => d.id.startsWith('scale_')).map(d => safeParse(d.data().json)).filter(Boolean)); } catch (e) { }
          SCALES.cloud.push = s => col.doc('scale_' + s.id).set({ json: JSON.stringify(s), updated: Date.now() }).catch(() => { });
          SCALES.cloud.remove = sid => col.doc('scale_' + sid).delete().catch(() => { });
        }
      }
      changed();
    } catch (e) { }
  }

  /* ---------- live forms (Firestore) ---------- */
  const forms = {
    available: () => st.mode === 'firebase' && !!st.user && st.verified,
    async panel(s, el, api) {
      const meta = s.live || null;
      const link = fid => location.origin + location.pathname + '#form-' + fid;
      const draw = () => {
        el.innerHTML = `<section class="card stack"><h3>${ic('link')} النموذج الأونلاين المباشر</h3>${s.live ? `<div class="row"><span class="live-dot" aria-hidden="true"></span><b class="grow">${s.live.open ? 'النموذج مفتوح ويستقبل الإجابات' : 'النموذج مغلق'}</b><span class="chip blue" id="liveN">${(s.liveSeen || []).length} استجابة وصلت</span></div><div class="codebox">${h(link(s.live.fid))}</div><div class="row"><button class="btn sm" id="lCp">${ic('copy')} نسخ الرابط</button><a class="btn sm ghost" target="_blank" rel="noopener noreferrer" href="https://wa.me/?text=${encodeURIComponent('أرجو الإجابة عن مقياس «' + s.name + '»: ' + link(s.live.fid))}">${ic('whats')} واتساب</a><button class="btn sm ghost" id="lTog">${s.live.open ? 'إغلاق النموذج' : 'إعادة فتحه'}</button><button class="btn sm ghost" id="lUpd">تحديث العبارات في النموذج</button></div><p class="small muted" style="margin:0">لا يحتاج المستجيب إلى حساب. الإجابات تُحفظ في حسابك فقط، ولا يقرؤها غيرك.</p>` : `<p style="margin:0">انشر نموذجًا له رابط تشاركه مع المستجيبين؛ تصل كل إجابة إلى هذا المقياس فور إرسالها.</p><button class="btn" id="lPub" style="justify-self:start">${ic('link')} نشر النموذج</button>`}</section>`;
        const pub = $('#lPub', el); if (pub) pub.onclick = async () => { try { const def = api.formDef(s); const fid = st.db.collection('forms').doc().id; await st.db.collection('forms').doc(fid).set({ owner: st.user.uid, title: s.name.slice(0, 120), def: JSON.stringify(def), open: true, created: st.fb.firestore.FieldValue.serverTimestamp() }); s.live = { fid, open: true }; s.liveSeen = []; api.save(); draw(); listen(); toast('نُشر النموذج'); } catch (e) { toast('تعذر النشر: ' + errMsg(e)); } };
        const cp = $('#lCp', el); if (cp) cp.onclick = () => copyText(link(s.live.fid));
        const tg = $('#lTog', el); if (tg) tg.onclick = async () => { try { await st.db.collection('forms').doc(s.live.fid).update({ open: !s.live.open }); s.live.open = !s.live.open; api.save(); draw(); } catch (e) { toast(errMsg(e)); } };
        const up = $('#lUpd', el); if (up) up.onclick = async () => { try { await st.db.collection('forms').doc(s.live.fid).update({ def: JSON.stringify(api.formDef(s)), title: s.name.slice(0, 120) }); api.save(); toast('حُدّثت عبارات النموذج'); } catch (e) { toast(errMsg(e)); } };
      };
      const listen = () => {
        if (!s.live) return; if (forms._un) forms._un();
        forms._un = st.db.collection('forms').doc(s.live.fid).collection('responses').onSnapshot(snap => {
          let added = 0; s.liveSeen = s.liveSeen || [];
          snap.docChanges().forEach(ch => { if (ch.type !== 'added') return; const id = ch.doc.id; if (s.liveSeen.includes(id)) return; const d = ch.doc.data(); if (!/^[0-7]{1,200}$/.test(d.r || '')) return; const res = api.addResponse(s, d.v, d.r.split('').map(Number), { src: 'live', g: String(d.g || '').slice(0, 10), a: String(d.a || '').slice(0, 3) }); if (res === 'ok') { s.liveSeen.push(id); added++; } });
          if (added) { api.save(); const n = $('#liveN'); if (n) n.textContent = s.liveSeen.length + ' استجابة وصلت'; toast('وصلت ' + added + ' استجابة جديدة'); }
        }, e => toast('انقطع الاستماع للنموذج: ' + errMsg(e)));
      };
      draw(); listen();
    },
    async respond(el, fid, api) {
      el.innerHTML = '<p class="muted">جارٍ تحميل النموذج…</p>';
      try {
        const doc = await st.db.collection('forms').doc(fid).get();
        if (!doc.exists || !doc.data().open) { el.innerHTML = '<div class="card"><h3>النموذج غير متاح</h3><p class="muted">ربما أغلقه الباحث أو أن الرابط غير صحيح.</p></div>'; return; }
        const def = safeParse(doc.data().def); if (!def || !Array.isArray(def.q) || !Array.isArray(def.l) || def.q.length > 200 || def.l.length > 7) throw new Error('bad');
        let sent = false; try { sent = localStorage.getItem('sent-' + fid) === '1'; } catch (e) { }
        if (sent) { el.innerHTML = '<div class="card"><h3>سبق أن أرسلت إجاباتك</h3><p class="muted">شكرًا لك؛ وصلت إجاباتك إلى الباحث.</p></div>'; return; }
        el.innerHTML = api.formHTML(def);
        api.bindForm(el, def, async (vals, demo) => {
          const btn = $('button[type=submit]', el); if (btn) btn.disabled = true;
          try { await st.db.collection('forms').doc(fid).collection('responses').add({ r: vals.join(''), v: String(def.v).slice(0, 20), g: String(demo.g || '').slice(0, 10), a: String(demo.a || '').slice(0, 3), ts: st.fb.firestore.FieldValue.serverTimestamp() }); try { localStorage.setItem('sent-' + fid, '1'); } catch (e) { }
            el.innerHTML = `<div class="card stack"><h3>${ic('check')} شكرًا لك</h3><p style="margin:0">وصلت إجاباتك إلى الباحث.</p></div>`; }
          catch (e) { if (btn) btn.disabled = false; toast('تعذر الإرسال: ' + errMsg(e)); }
        });
      } catch (e) { el.innerHTML = '<div class="card"><h3>تعذر تحميل النموذج</h3><p class="muted">تحقق من الرابط أو اتصال الإنترنت.</p></div>'; }
    }
  };

  /* ---------- errors (generic on sign-in to avoid account enumeration) ---------- */
  function errMsg(e) {
    const c = (e && e.code) || '';
    return ({
      'auth/email-already-in-use': 'هذا البريد مسجل بالفعل؛ جرّب تسجيل الدخول أو استعادة كلمة المرور.',
      'auth/invalid-email': 'صيغة البريد الإلكتروني غير صحيحة.',
      'auth/weak-password': 'كلمة المرور ضعيفة؛ استخدم 8 أحرف على الأقل مع حروف وأرقام.',
      'auth/invalid-credential': 'البريد أو كلمة المرور غير صحيحين.', 'auth/wrong-password': 'البريد أو كلمة المرور غير صحيحين.', 'auth/user-not-found': 'البريد أو كلمة المرور غير صحيحين.',
      'auth/too-many-requests': 'محاولات كثيرة؛ انتظر قليلًا ثم حاول مرة أخرى.',
      'auth/network-request-failed': 'تعذر الاتصال بالإنترنت.',
      'auth/requires-recent-login': 'لأسباب أمنية سجّل الخروج ثم الدخول مرة أخرى قبل هذا الإجراء.',
      'permission-denied': 'ليست لديك صلاحية لهذا الإجراء.'
    })[c] || 'حدث خطأ غير متوقع؛ حاول مرة أخرى.';
  }
  function pwStrength(p) { let s = 0; if (p.length >= 8) s++; if (p.length >= 12) s++; if (/[a-z]/i.test(p) && /\d/.test(p)) s++; if (/[^A-Za-z0-9]/.test(p)) s++; return s; }

  /* ---------- account page ---------- */

  /* ---------- real-name rule, Google sign-in, and verification by pasting the email link ---------- */
  const realName = nm => { const w = String(nm || '').trim().split(/\s+/); return nm.length <= 40 && w.length >= 2 && w.every(x => /^[A-Za-zء-ي٠-٩کگی'-]{2,}$/.test(x)) && !/\d/.test(nm); };
  const NAME_ERR = 'اكتب اسمك الحقيقي بالكامل (الاسم الأول واسم الأب على الأقل) بالحروف بس، من غير أرقام أو رموز.';
  function loadGsi() { return new Promise((res, rej) => { if (window.google && google.accounts && google.accounts.id) return res(); const s = document.createElement('script'); s.src = 'https://accounts.google.com/gsi/client'; s.async = true; s.onload = res; s.onerror = () => rej(new Error('gsi')); document.head.appendChild(s); }); }
  async function googleButton(box, onErr) {
    if (!box || st.mode !== 'firebase') return;
    const cid = window.GOOGLE_CLIENT_ID;
    if (cid) { try { await loadGsi(); google.accounts.id.initialize({ client_id: cid, callback: async r => { try { await st.fb.auth().signInWithCredential(firebase.auth.GoogleAuthProvider.credential(r.credential)); toast('أهلًا بيك'); } catch (e) { onErr(errMsg(e)); } } }); box.innerHTML = ''; google.accounts.id.renderButton(box, { theme: 'outline', size: 'large', text: 'continue_with', locale: 'ar', width: 280 }); return; } catch (e) { } }
    box.innerHTML = '<button class="btn ghost" type="button" style="width:100%"><svg viewBox="0 0 24 24" aria-hidden="true"><path fill="#4285F4" d="M22.5 12.3c0-.8-.1-1.5-.2-2.3H12v4.3h5.9a5 5 0 0 1-2.2 3.3v2.7h3.5c2.1-1.9 3.3-4.7 3.3-8z"/><path fill="#34A853" d="M12 23c3 0 5.5-1 7.3-2.7l-3.5-2.7c-1 .7-2.3 1.1-3.8 1.1-2.9 0-5.4-2-6.3-4.6H2.1v2.8A11 11 0 0 0 12 23z"/><path fill="#FBBC05" d="M5.7 14.1a6.6 6.6 0 0 1 0-4.2V7.1H2.1a11 11 0 0 0 0 9.8z"/><path fill="#EA4335" d="M12 5.4c1.6 0 3.1.6 4.2 1.7l3.1-3.1A11 11 0 0 0 2.1 7.1l3.6 2.8C6.6 7.3 9.1 5.4 12 5.4z"/></svg> متابعة بحساب Google</button>';
    box.querySelector('button').onclick = async () => { try { await st.fb.auth().signInWithPopup(new firebase.auth.GoogleAuthProvider()); toast('أهلًا بيك'); } catch (e) { const c = (e && e.code) || ''; onErr(/operation-not-allowed/.test(c) ? 'الدخول بحساب Google لسه مش مفعّل في إعدادات Firebase.' : /popup-closed|cancelled-popup/.test(c) ? 'اتقفلت نافذة Google قبل ما تكمّل.' : /unauthorized-domain/.test(c) ? 'الدخول بـ Google لسه مش متفعّل على عنوان الموقع الجديد. سجّل بالإيميل لحد ما المحاضر يفعّله.' : /network|internal|popup-blocked|web-storage/.test(c) ? (async () => { try { await st.fb.auth().signInWithRedirect(new firebase.auth.GoogleAuthProvider()); } catch (e2) { onErr('الدخول بـ Google مش شغال من المتصفح ده. افتح الموقع من Chrome، أو سجّل بالإيميل. (' + ((e2 && e2.code) || c) + ')'); } })() && 'جارٍ تحويلك لصفحة Google…' : errMsg(e) + (c ? ' (' + c + ')' : '')); } };
  }
  async function verifyFromLink(link) { const m = String(link).match(/oobCode(?:=|%3D)([A-Za-z0-9_-]+)/); if (!m) throw new Error('nolink'); await st.fb.auth().applyActionCode(m[1]); const u = st.fb.auth().currentUser; if (u) { await u.reload(); await u.getIdToken(true); st.verified = !!u.emailVerified; } }
  function renderPanel(el) {
    const s = getS(), rk = typeof rankOf === 'function' ? rankOf(s.xp).name : '';
    const perks = `<ul class="stack small" style="list-style:none;padding:0;margin:0;gap:6px">
      <li>${ic('check')} يُحفظ تقدمك (النقاط، والسلسلة، والدروس، و${APP === 'scales' ? 'مقاييسك واستجاباتها' : 'نتائج اختباراتك'}) على كل أجهزتك.</li>
      <li>${ic('check')} حساب واحد للموقعين: مختبر المقاييس ومختبر الإحصاء.</li>
      <li>${ic('check')} تظهر في لوحة المتصدرين الأسبوعية (يمكنك إخفاء اسمك).</li>
      ${APP === 'scales' ? `<li>${ic('check')} تنشر نموذج مقياسك أونلاين وتصلك الإجابات لحظيًا.</li>` : ''}
      <li>${ic('check')} وسام «عضو مسجل» و15 نقطة.</li></ul>`;
    if (st.mode === 'claude') {
      el.innerHTML = `<div class="section-title"><h2>حسابي</h2></div><section class="card stack"><div class="row"><span class="avatar${st.claudeName ? '' : ' guest'}">${typeof avatarInner === 'function' ? avatarInner(st.claudeName) : h((st.claudeName || '؟')[0])}</span><div class="grow"><b>${h(st.claudeName || 'حساب المساعد الذكي')}</b><div class="small muted">${h(rk)}</div></div></div><p class="small" style="margin:0">داخل المنصة المستضيفة يُستخدم حسابك فيها مباشرة؛ لا تحتاج إلى تسجيل منفصل.</p><div class="notice small ${st.claudeDb ? 'good' : ''}">${st.claudeDb ? 'تقدمك ومقاييسك تُحفظ في حسابك وتتزامن بين أجهزتك.' : 'تقدمك يُحفظ في هذا المتصفح. لحفظه على كل أجهزتك استخدم نسخة الموقع المنشورة على GitHub وأنشئ حسابًا هناك.'}</div></section>`;
      return;
    }
    if (st.mode !== 'firebase') {
      el.innerHTML = `<div class="section-title"><h2>حسابي</h2></div><section class="card stack"><h3>${ic('user')} التسجيل غير مفعّل في هذه النسخة بعد</h3><p style="margin:0">تقدمك محفوظ الآن في هذا المتصفح (${s.xp} نقطة، سلسلة ${s.streak} يوم). يُفعَّل التسجيل بالبريد الإلكتروني بعد ربط الموقع بمشروع Firebase مجاني (ملف SETUP-FIREBASE.md).</p><div class="field"><label class="fl" for="nmLocal">اسمك في هذا المتصفح (اختياري)</label><input type="text" id="nmLocal" maxlength="40" value="${h(s.name || '')}"></div></section><section class="card">${perks}</section>`;
      $('#nmLocal', el).onchange = e => { const x = getS(); x.name = e.target.value.trim().slice(0, 40); setS(x); changed(); };
      return;
    }
    if (!st.ready) { el.innerHTML = '<p class="muted">جارٍ التحميل…</p>'; return; }
    if (!st.user || st.user.isAnonymous) {
      let mode = 'up';
      const draw = () => {
        el.innerHTML = `<div class="section-title"><h2>حسابي</h2><span class="chip">اختياري</span></div>
        <div class="grid2"><section class="card stack"><div class="seg" role="tablist"><button data-am="up" aria-pressed="${mode === 'up'}">إنشاء حساب</button><button data-am="in" aria-pressed="${mode === 'in'}">تسجيل الدخول</button></div>
          <div id="aG"></div><div class="row small muted" style="justify-content:center">أو بالإيميل وكلمة مرور</div><form id="aForm" class="stack" novalidate>
            ${mode === 'up' ? `<div class="field"><label class="fl" for="aName">اسمك الحقيقي بالكامل (ثنائي أو ثلاثي)</label><input type="text" id="aName" maxlength="40" autocomplete="name" required placeholder="مثال: محمد أحمد عثمان"></div>` : ''}
            <div class="field"><label class="fl" for="aEmail">البريد الإلكتروني</label><input type="email" id="aEmail" autocomplete="email" required inputmode="email"></div>
            <div class="field"><label class="fl" for="aPw">كلمة المرور</label><input type="password" id="aPw" autocomplete="${mode === 'up' ? 'new-password' : 'current-password'}" minlength="8" required>${mode === 'up' ? '<div class="pbar" style="margin-top:6px"><i id="pwBar" style="width:0"></i></div><small class="muted" id="pwTxt">8 أحرف على الأقل، وحروف وأرقام.</small>' : ''}</div>
            ${mode === 'up' ? '<div class="field"><label class="fl" for="aPw2">تأكيد كلمة المرور</label><input type="password" id="aPw2" autocomplete="new-password" required></div>' : ''}
            <div id="aErr" class="notice bad small" hidden role="alert"></div>
            <button class="btn" type="submit">${mode === 'up' ? 'إنشاء الحساب' : 'دخول'}</button>
            ${mode === 'in' ? '<button class="btn ghost sm" type="button" id="aReset">نسيت كلمة المرور</button>' : ''}
          </form></section>
          <section class="card stack"><h3>${ic('star')} لماذا تنشئ حسابًا؟</h3><div class="tile hl"><small>تقدمك الحالي في هذا المتصفح</small><b style="direction:rtl;text-align:start;font-family:inherit">${s.xp} نقطة · ${s.streak} يوم</b></div>${perks}<p class="small muted" style="margin:0">الحساب اختياري تمامًا؛ كل أدوات الموقع تعمل بدونه.</p></section></div>`;
        $$('[data-am]', el).forEach(b => b.onclick = () => { mode = b.dataset.am; draw(); });
        const pw = $('#aPw', el), bar = $('#pwBar', el); if (bar) pw.oninput = () => { const k = pwStrength(pw.value); bar.style.width = k * 25 + '%'; bar.style.background = k >= 3 ? 'var(--good)' : k === 2 ? 'var(--amber)' : 'var(--bad)'; $('#pwTxt', el).textContent = ['ضعيفة جدًا', 'ضعيفة', 'متوسطة', 'جيدة', 'قوية'][k]; };
        const err = m => { const e = $('#aErr', el); e.hidden = false; e.textContent = m; };
        googleButton($('#aG', el), err);
        const rs = $('#aReset', el); if (rs) rs.onclick = async () => { const em = $('#aEmail', el).value.trim(); if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(em)) return err('اكتب بريدك الإلكتروني أولًا.'); try { await sendReset(st.fb.auth(), em); } catch (e) { } toast('إن كان البريد مسجلًا فستصلك رسالة لاستعادة كلمة المرور'); };
        $('#aForm', el).onsubmit = async e => {
          e.preventDefault(); if (Date.now() < st.lockUntil) return err('محاولات كثيرة؛ انتظر ' + Math.ceil((st.lockUntil - Date.now()) / 1000) + ' ثانية.');
          const em = $('#aEmail', el).value.trim(), p = $('#aPw', el).value;
          if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(em) || em.length > 254) return err('صيغة البريد الإلكتروني غير صحيحة.');
          const btn = $('button[type=submit]', el); btn.disabled = true;
          try {
            if (mode === 'up') {
              const nm = $('#aName', el).value.replace(/[<>]/g, '').trim().slice(0, 40);
              if (!realName(nm)) { btn.disabled = false; return err(NAME_ERR); }
              if (p.length < 8 || !(/[a-z؀-ۿ]/i.test(p) && /\d/.test(p))) { btn.disabled = false; return err('كلمة المرور: 8 أحرف على الأقل وتحتوي حروفًا وأرقامًا.'); }
              if (p !== $('#aPw2', el).value) { btn.disabled = false; return err('كلمتا المرور غير متطابقتين.'); }
              const cr = await st.fb.auth().createUserWithEmailAndPassword(em, p);
              await cr.user.updateProfile({ displayName: nm }); st.name = nm;
              try { await sendVer(cr.user); } catch (x) { }
              toast('أُنشئ حسابك. أرسلنا رسالة تأكيد لبريدك، ولو مش في الوارد بص في الـ Spam');
            } else { await st.fb.auth().signInWithEmailAndPassword(em, p); st.failures = 0; toast('مرحبًا بعودتك'); }
          } catch (x) { st.failures++; if (st.failures >= 5) { st.lockUntil = Date.now() + 30000 * Math.min(4, st.failures - 4); } btn.disabled = false; err(errMsg(x)); }
        };
      };
      draw(); return;
    }
    const u = st.user;
    el.innerHTML = `<div class="section-title"><h2>حسابي</h2></div>
      <div class="grid2"><section class="card stack"><div class="row"><span class="avatar">${typeof avatarInner === 'function' ? avatarInner(st.name || u.email) : h((st.name || u.email || '؟')[0])}</span><div class="grow"><b>${h(st.name || 'باحث')}</b><div class="small muted ltr" style="text-align:right">${h(u.email || '')}</div></div><span class="chip amber">${h(rk)}</span></div>
        ${st.verified ? '<div class="notice good small">بريدك مؤكد. تقدمك يُحفظ في حسابك تلقائيًا.</div>' : '<div class="notice warn small"><b>أكّد بريدك الإلكتروني</b>افتح الرسالة التي أرسلناها واضغط اللينك. <b>لو مش لاقيها، بص في مجلد الرسائل غير المرغوب فيها (Spam)</b> واضغط «ليست رسالة غير مرغوب فيها»، علشان الرسائل الجاية توصل الوارد. استخدم آخر رسالة بس. التأكيد مطلوب للظهور في لوحة المتصدرين ونشر النماذج.<div class="row" style="margin-top:6px"><button class="btn sm ghost" id="aVer">إعادة إرسال الرسالة</button><button class="btn sm ghost" id="aRel">تحققت، حدّث الحالة</button></div><details style="margin-top:8px"><summary><b>اللينك بيفتح صفحة خطأ؟</b></summary><p style="margin:6px 0">انسخ اللينك من الإيميل (اضغط عليه ضغطة طويلة ثم «نسخ الرابط»)، والصقه هنا، والموقع هيأكّد بريدك من غير ما يفتح صفحة Firebase.</p><div class="row"><input type="text" id="aLink" dir="ltr" class="grow" placeholder="https://...oobCode=..."><button class="btn sm" id="aLinkGo">أكّد</button></div></details></div>'}<div class="row" style="margin-top:8px"><a class="btn sm ghost" href="#admin" style="text-decoration:none">لوحة المسؤول</a><span class="muted small">للمسؤول فقط</span></div>
        ${realName(st.name || '') ? '' : '<div class="notice warn small"><b>اكتب اسمك الحقيقي بالكامل</b>مطلوب علشان مسؤول الموقع يقدر يتابعك ويساعدك.</div>'}<div class="field"><label class="fl" for="aNm">اسمك الحقيقي بالكامل</label><div class="row"><input type="text" id="aNm" maxlength="40" value="${h(st.name)}" class="grow"><button class="btn sm ghost" id="aNmS">حفظ</button></div></div>
        <div class="field"><label class="fl" for="aPh">رقم تليفونك (اختياري)</label><div class="row"><input type="tel" id="aPh" dir="ltr" inputmode="tel" maxlength="20" value="${h(st.phone)}" placeholder="+20..." class="grow"><button class="btn sm ghost" id="aPhS">حفظ</button></div><p class="small muted" style="margin:4px 0 0">يظهر لمسؤول الموقع فقط، علشان يقدر يوصل لك لو حصلت مشكلة في الإيميل.</p></div>
        <label class="row small"><input type="checkbox" id="aLb" ${st.lbOptIn ? 'checked' : ''}> اعرض اسمي في لوحة المتصدرين</label>
        <p class="small" style="margin:0"><a href="./#admin">لوحة المسؤول</a> <span class="muted">(لصاحب الموقع فقط؛ لو مش مسؤول هتظهر لك الخطوات الناقصة)</span> · <a href="./#privacy" data-pvshow>سياسة الخصوصية</a></p>
        <div class="row"><button class="btn ghost sm" id="aOut">تسجيل الخروج</button><button class="btn sm danger" id="aDel">حذف الحساب</button></div></section>
        <section class="card stack"><h3>${ic('trophy')} لوحة المتصدرين</h3><div class="seg"><button data-lb="week" aria-pressed="true">آخر 7 أيام</button><button data-lb="total" aria-pressed="false">الكل</button></div><div id="lbList"><p class="muted small">جارٍ التحميل…</p></div></section></div>`;
    const v = $('#aVer', el); if (v) v.onclick = async () => { try { await sendVer(u); toast('أُرسلت رسالة تأكيد جديدة. استخدم آخر رسالة بس، لأن الرسائل القديمة بتبطل'); } catch (e) { toast(errMsg(e)); } };
    const lg = $('#aLinkGo', el); if (lg) lg.onclick = async () => { try { await verifyFromLink($('#aLink', el).value); if (st.verified) await pushState(getS(), true); toast(st.verified ? 'تم تأكيد بريدك ✓' : 'اتأكد، حدّث الصفحة'); changed(); } catch (e) { toast(e && e.message === 'nolink' ? 'ده مش لينك التأكيد. انسخ اللينك اللي في الإيميل كله.' : /expired|invalid-action-code/.test((e && e.code) || '') ? 'اللينك ده قديم أو اتستخدم قبل كده. اطلب رسالة جديدة واستخدم آخر واحدة.' : errMsg(e)); } };
    const r = $('#aRel', el); if (r) r.onclick = async () => { await u.reload(); st.verified = st.fb.auth().currentUser.emailVerified; if (st.verified) { await st.fb.auth().currentUser.getIdToken(true); await pushState(getS(), true); } changed(); };
    $('#aNmS', el).onclick = async () => { const nm = $('#aNm', el).value.replace(/[<>]/g, '').trim().slice(0, 40); if (!realName(nm)) return toast(NAME_ERR); try { await u.updateProfile({ displayName: nm }); st.name = nm; await pushState(getS(), true); toast('حُفظ الاسم'); changed(); } catch (e) { toast(errMsg(e)); } };
    { const pb = $('#aPhS', el); if (pb) pb.onclick = async () => { const ph = $('#aPh', el).value.replace(/[^\d+\-\s()]/g, '').trim().slice(0, 20); try { await userRef().set({ phone: ph, updated: st.fb.firestore.FieldValue.serverTimestamp() }, { merge: true }); st.phone = ph; toast(ph ? 'حُفظ رقم التليفون' : 'اتمسح رقم التليفون'); } catch (e) { toast(errMsg(e)); } }; }
    $('#aLb', el).onchange = async e => { st.lbOptIn = e.target.checked; try { await userRef().set({ prefs: { lb: st.lbOptIn }, updated: st.fb.firestore.FieldValue.serverTimestamp() }, { merge: true }); if (!st.lbOptIn) await st.db.collection('leaderboard').doc(u.uid).delete(); else await pushState(getS(), true); toast(st.lbOptIn ? 'اسمك ظاهر في اللوحة' : 'أُخفي اسمك من اللوحة'); loadLb('week'); } catch (x) { toast(errMsg(x)); } };
    $('#aOut', el).onclick = () => st.fb.auth().signOut();
    $('#aDel', el).onclick = () => (typeof confirmBox === 'function' ? confirmBox : (m, y, f) => f())('سيُحذف حسابك وبياناتك المحفوظة على الخادم نهائيًا (تبقى نسخة على هذا الجهاز).', 'حذف الحساب', async () => {
      try { const uidv = u.uid; const sc = await userRef().collection('scales').get(); for (const d of sc.docs) await d.ref.delete(); const fq = await st.db.collection('forms').where('owner', '==', uidv).get(); for (const f of fq.docs) { const rs = await f.ref.collection('responses').get(); for (const r of rs.docs) await r.ref.delete(); await f.ref.delete(); } await st.db.collection('leaderboard').doc(uidv).delete().catch(() => { }); await userRef().delete(); await u.delete(); toast('حُذف الحساب'); } catch (e) { toast(errMsg(e)); }
    });
    const loadLb = async by => {
      const box = $('#lbList', el); if (!box) return;
      try {
        const qs = await st.db.collection('leaderboard').orderBy(by, 'desc').limit(20).get();
        const rows = qs.docs.map((d, i) => { const x = d.data(); const me = d.id === u.uid; return `<div class="lb-row ${me ? 'me' : ''}"><b class="num">${i + 1}</b><span>${h(x.name || 'باحث')}${me ? ' <span class="chip amber">أنت</span>' : ''}</span><span class="num">${(x[by] | 0)}</span></div>`; }).join('');
        box.innerHTML = rows || '<p class="muted small">لا أحد في اللوحة بعد. كن الأول!</p>';
        if (!st.verified) box.innerHTML += '<p class="small muted">أكّد بريدك لتظهر هنا.</p>';
      } catch (e) { box.innerHTML = `<p class="muted small">${h(errMsg(e))}</p>`; }
    };
    $$('[data-lb]', el).forEach(b => b.onclick = () => { $$('[data-lb]', el).forEach(x => x.setAttribute('aria-pressed', x === b)); loadLb(b.dataset.lb); });
    loadLb('week');
  }

  window.ACCT = {
    available: () => st.mode === 'firebase' || st.mode === 'claude',
    signedIn: () => (st.mode === 'firebase' && !!st.user) || (st.mode === 'claude' && !!st.claudeDb),
    displayName: () => st.mode === 'firebase' ? (st.user ? st.name : '') : st.mode === 'claude' ? st.claudeName : '',
    renderPanel, forms,
    // minimal Firestore access for the know-yourself journey and the admin page (firebase mode only)
    fs: {
      ready: () => st.mode === 'firebase' && !!st.user && !!st.db,
      canGuest: () => st.mode === 'firebase' && !!st.fb && !st.user,
      anon: () => !!(st.user && st.user.isAnonymous),
      guest: async nm => { nm = String(nm || '').replace(/[<>]/g, '').trim().slice(0, 40); if (!realName(nm)) throw new Error(NAME_ERR); const c = await st.fb.auth().signInAnonymously(); await c.user.updateProfile({ displayName: nm }); st.name = nm; return c.user.uid; },
      uid: () => st.user ? st.user.uid : null, email: () => st.user ? (st.user.email || '') : '', name: () => st.name || '', verified: () => !!st.verified,
      get: async p => { const d = await st.db.doc(p).get(); return d.exists ? d.data() : null; },
      set: async (p, data) => st.db.doc(p).set(Object.assign({}, data, { updated: firebase.firestore.FieldValue.serverTimestamp() })),
      list: async c => (await st.db.collection(c).get()).docs.map(d => Object.assign({ id: d.id }, d.data())),
      del: async p => st.db.doc(p).delete(),
      refresh: async () => { if (!st.user) return false; try { await st.user.reload(); } catch (e) { } const u = st.fb.auth().currentUser; if (u) { await u.getIdToken(true); st.verified = !!u.emailVerified; } return st.verified; },
      put: async (p, data) => { const d = {}; Object.keys(data).forEach(k => { d[k] = data[k] === '__ts__' ? firebase.firestore.FieldValue.serverTimestamp() : data[k]; }); return st.db.doc(p).set(d); }
    },
    init() {
      if (window.claude && typeof window.claude.use === 'function') { initClaude(); return; }
      if (cfg && cfg.apiKey && cfg.projectId) { st.mode = 'firebase'; initFirebase().catch(e => { st.mode = 'none';  changed(); }); }
    }
  };
})();

/* ===== Boot ===== */
VIEWS.account = el => ACCT.renderPanel(el);
/* Route-specific chunks: the stub loads the files (in order), then the chunk replaces VIEWS[name] with the real view. */
const CHUNK_SRC = { clib: 'clib.js?v=e169db60df', build: 'build.js?v=4028b84456', exam: 'exam.js?v=d8a2666970', neuro: 'neuro.js?v=667f4ec7ba', know: 'know.js?v=b410409037' };
const needChunks = names => Promise.all(names.map(n => loadChunk(CHUNK_SRC[n])));
const LAZY_VIEWS = { build: ['clib', 'build'], respond: ['clib', 'build'], qbuild: ['clib', 'build'], take: ['clib', 'build'], exam: ['exam'], bank: ['exam'], schedules: ['exam'], neuro: ['clib', 'build', 'neuro'], know: ['clib', 'know'] };
Object.keys(LAZY_VIEWS).forEach(name => {
  const stub = (el, arg) => {
    el.innerHTML = '<p class="muted">جارٍ التحميل…</p>';
    needChunks(LAZY_VIEWS[name]).then(() => {
      if (!el.isConnected || VIEWS[name] === stub) return;
      el.innerHTML = ''; VIEWS[name](el, arg);
      if (typeof MOTION !== 'undefined') MOTION.page(el);
      renderStats();
    }, () => { if (el.isConnected) el.innerHTML = '<p class="muted">تعذر تحميل هذه الصفحة. تحقق من الاتصال وحدّث الصفحة.</p>'; });
  };
  stub.lazy = true; VIEWS[name] = stub;
});
/* «اعرف نفسك» shares progress with the admin on privacy-accepted; run it even if its chunk is not loaded yet. */
window.addEventListener('privacy-accepted', () => { if (typeof KNOW === 'undefined') needChunks(['know']).then(() => KNOW.sync(), () => { }); });
window.ACCT_HOOKS = {
  get: () => S,
  set: x => { S = Object.assign(fresh(), x); save(); },
  changed: () => { checkBadges(); renderStats(); if (current === 'account' || current === 'home') rerender(); }
};
applyPrefs(); tick(); shell();
if (typeof MOTION !== 'undefined') MOTION.initLenis();
if (typeof AI !== 'undefined') AI.fab();
window.addEventListener('hashchange', route);
ACCT.init();
route();
/* GoatCounter visit counter — only on the public GitHub Pages copy (dashboard: https://mo-psych-stats-lab.goatcounter.com) */
(function () {
  if (!/\.github\.io$/.test(location.hostname)) return;
  const path = () => { const h = location.hash || '#home'; return location.pathname + (h.startsWith('#take/') ? '#take' : h.startsWith('#form-') ? '#form' : h); };
  const hit = () => { try { window.goatcounter && window.goatcounter.count && window.goatcounter.count({ path: path(), title: document.title }); } catch (e) { } };
  window.goatcounter = { no_onload: true };
  const gs = document.createElement('script'); gs.async = true; gs.dataset.goatcounter = 'https://mo-psych-stats-lab.goatcounter.com/count'; gs.src = 'https://gc.zgo.at/count.js'; gs.referrerPolicy = 'no-referrer'; gs.onload = hit;
  document.head.appendChild(gs); window.addEventListener('hashchange', hit);
})();
if ('serviceWorker' in navigator && location.protocol === 'https:') addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
