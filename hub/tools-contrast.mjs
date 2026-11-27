// Contrast and colour-vision audit for the hub tokens. Run: node hub/tools-contrast.mjs  (add --md for a Markdown table)
// Reads the custom properties from hub.css for both themes, resolves var() chains and alpha layers,
// and checks every text/background pair the interface actually uses. Exits non-zero if any pair fails.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const css = readFileSync(join(dirname(fileURLToPath(import.meta.url)), 'hub.css'), 'utf8');
const block = (start) => { const i = css.indexOf(start); const j = css.indexOf('\n}', i); return css.slice(i, j); };
const parse = (txt) => Object.fromEntries([...txt.matchAll(/--([\w-]+):\s*([^;]+);/g)].map(m => [m[1], m[2].trim()]));
const light = parse(block(':root{')), dark = { ...light, ...parse(block(':root[data-theme="dark"]{')) };

function colour(v, t, depth = 0) {
  v = String(v).trim();
  let m;
  if ((m = /^var\(--([\w-]+)\)$/.exec(v))) { if (depth > 8 || !(m[1] in t)) throw new Error('unresolved ' + v); return colour(t[m[1]], t, depth + 1); }
  if ((m = /^#([0-9a-f]{6})$/i.exec(v))) return [parseInt(m[1].slice(0, 2), 16), parseInt(m[1].slice(2, 4), 16), parseInt(m[1].slice(4, 6), 16), 1];
  if ((m = /^#([0-9a-f]{3})$/i.exec(v))) return [...m[1]].map(c => parseInt(c + c, 16)).concat(1);
  if ((m = /^rgba?\(([^)]+)\)$/.exec(v))) { const p = m[1].split(',').map(Number); return [p[0], p[1], p[2], p[3] == null ? 1 : p[3]]; }
  throw new Error('cannot read colour ' + v);
}
const over = (f, b) => [0, 1, 2].map(i => f[i] * f[3] + b[i] * (1 - f[3])).concat(1);
const lum = c => { const [r, g, b] = c.map(v => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
const ratio = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
const T = n => (n.startsWith('#') || n.startsWith('rgb') ? n : `var(--${n})`);

// [where it is used, foreground, background layers (top first, last is opaque), kind]  kind: text 4.5, large 3, ui 3
const PAIRS = [
  ['body text on page', 'ink', ['bg'], 'text'], ['body text on card', 'ink', ['surface'], 'text'], ['body text on raised card', 'ink', ['surface-2'], 'text'],
  ['secondary text on page', 'ink-2', ['bg'], 'text'], ['secondary text on card', 'ink-2', ['surface'], 'text'], ['secondary text on raised card', 'ink-2', ['surface-2'], 'text'],
  ['hints and captions on page', 'ink-3', ['bg'], 'text'], ['hints and captions on card', 'ink-3', ['surface'], 'text'], ['hints on raised card', 'ink-3', ['surface-2'], 'text'], ['rail captions', 'ink-3', ['rail-bg'], 'text'],
  ['links on page', 'link', ['bg'], 'text'], ['links on card', 'link', ['surface'], 'text'],
  ['active nav item', 'nav-on', ['nav-on-bg', 'rail-bg'], 'text'], ['nav item', 'ink-2', ['rail-bg'], 'text'],
  ['primary button label', 'on-accent', ['accent'], 'text'], ['primary button label, hover', 'on-accent', ['accent-hi'], 'text'],
  ['status text on its wash', 'status', ['status-wash', 'surface'], 'text'], ['status tick on page', 'status', ['bg'], 'ui'],
  ['error text on card', 'bad', ['surface'], 'text'], ['error text on page', 'bad', ['bg'], 'text'],
  ['label on brand fill (chips, petals)', 'on-brand', ['brand'], 'text'], ['brand icon on its wash', 'brand', ['brand-wash', 'surface'], 'ui'],
  ['explain panel headings', 'em', ['brand-wash', 'surface'], 'text'], ['explain panel text', 'ink', ['brand-wash', 'surface'], 'text'],
  ['notice text', 'ink', ['warn-wash', 'surface'], 'text'], ['suggest chip label', 'ink', ['warn-wash', 'surface'], 'text'],
  ['field border on field', 'field-line', ['well'], 'ui'], ['focus ring on page', 'focus', ['bg'], 'ui'], ['focus ring on card', 'focus', ['surface'], 'ui'],
  ['toast text', 'bg', ['ink'], 'text'],
  ['sky: title, top', 'sky-ink', ['sky-a'], 'text'], ['sky: title, bottom', 'sky-ink', ['sky-b'], 'text'],
  ['sky: secondary, top', 'sky-ink-2', ['sky-a'], 'text'], ['sky: secondary, bottom', 'sky-ink-2', ['sky-b'], 'text'],
  ['sky: step numbers, top', 'sky-ink-3', ['sky-a'], 'text'], ['sky: step numbers, bottom', 'sky-ink-3', ['sky-b'], 'text'],
  ['sky: gold labels, top', 'gold', ['sky-a'], 'text'], ['sky: gold labels, bottom', 'gold', ['sky-b'], 'text'],
  ['sky: star tooltip', 'violet-950', ['#ffffff'], 'text'],
  ['sunflower block text', 'block-ink', ['sun'], 'text'], ['violet block text', '#ffffff', ['violet'], 'text'], ['violet block secondary', 'violet-50', ['violet'], 'text'],
  ['violet block level word', 'saffron-100', ['violet'], 'text'], ['mint block text', 'block-ink', ['mint'], 'text'], ['mint block secondary', 'kid-ink-2', ['mint'], 'text'],
  ['coral block text', 'block-ink', ['coral'], 'text'], ['lilac block text', 'block-ink', ['lilac'], 'text'],
  ['inked button on a block', '#ffffff', ['block-ink'], 'text'], ['light button on violet block', 'block-ink', ['#ffffff'], 'text'],
  ['night role tile, top', 'violet-50', ['violet-800'], 'text'], ['night role tile, bottom', 'violet-50', ['violet-950'], 'text'],
  ['suggested draft text', 'block-ink', ['rgba(255,255,255,.6)', 'sun'], 'text'],
  ['headline gradient, start', 'nebula-text@0', ['bg'], 'large'], ['headline gradient, middle', 'nebula-text@1', ['bg'], 'large'], ['headline gradient, end', 'nebula-text@2', ['bg'], 'large'],
  ['welcome highlight, start', '#ffffff', ['violet-700'], 'large'], ['welcome highlight, end', '#ffffff', ['coral-600'], 'large'],
  ['welcome marquee outline', 'ink', ['bg'], 'ui'], ['rosette number on core', 'ros-core-ink', ['ros-core'], 'large']
];

function stops(v, t) { return [...v.matchAll(/var\(--([\w-]+)\)/g)].map(m => colour('var(--' + m[1] + ')', t)); }
function audit(t) {
  return PAIRS.map(([where, fg, bgs, kind]) => {
    let f;
    if (fg.includes('@')) { const [name, i] = fg.split('@'); f = stops(t[name], t)[+i]; } else f = colour(T(fg), t);
    let b = colour(T(bgs[bgs.length - 1]), t);
    for (let i = bgs.length - 2; i >= 0; i--) b = over(colour(T(bgs[i]), t), b);
    if (f[3] < 1) f = over(f, b);
    const need = kind === 'text' ? 4.5 : 3;
    const r = ratio(f, b);
    return { where, kind, need, ratio: r, ok: r >= need };
  });
}

// colour-vision check: are status, error, accent and brand still told apart, and never by hue alone?
const CVD = {
  protanopia: [[0.152286, 1.052583, -0.204868], [0.114503, 0.786281, 0.099216], [-0.003882, -0.048116, 1.051998]],
  deuteranopia: [[0.367322, 0.860646, -0.227968], [0.280085, 0.672501, 0.047413], [-0.01182, 0.04294, 0.968881]],
  tritanopia: [[1.255528, -0.076749, -0.178779], [-0.078411, 0.930809, 0.147602], [0.004733, 0.691367, 0.3039]]
};
const toLin = v => { v /= 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
const oklab = c => { const [r, g, b] = c.slice(0, 3).map(toLin); const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b), m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b), s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b); return [0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s, 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s, 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s]; };
const sim = (c, M) => { const l = c.slice(0, 3).map(toLin), o = M.map(r => Math.min(1, Math.max(0, r[0] * l[0] + r[1] * l[1] + r[2] * l[2]))); return o.map(v => 255 * (v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055)); };
const dE = (a, b) => Math.hypot(...oklab(a).map((v, i) => v - oklab(b)[i]));
function cvd(t) {
  const names = ['status', 'bad', 'accent', 'brand'], out = [];
  for (let i = 0; i < names.length; i++) for (let j = i + 1; j < names.length; j++) {
    const a = colour(T(names[i]), t), b = colour(T(names[j]), t), row = { pair: names[i] + ' / ' + names[j], normal: dE(a, b) };
    for (const [k, M] of Object.entries(CVD)) row[k] = dE(sim(a, M), sim(b, M));
    out.push(row);
  }
  return out;
}

const md = process.argv.includes('--md');
let fails = 0;
for (const [name, t] of [['light', light], ['dark', dark]]) {
  const rows = audit(t), worst = [...rows].sort((a, b) => a.ratio / a.need - b.ratio / b.need).slice(0, 5);
  console.log(md ? `\n### ${name}\n\n| Pair | Needs | Ratio | |\n|---|---|---|---|` : `\n== ${name} theme ==`);
  for (const r of rows) { if (!r.ok) fails++; console.log(md ? `| ${r.where} | ${r.need}:1 | ${r.ratio.toFixed(2)}:1 | ${r.ok ? 'pass' : 'FAIL'} |` : `${r.ok ? 'pass' : 'FAIL'}  ${r.ratio.toFixed(2).padStart(6)}  (needs ${r.need})  ${r.where}`); }
  console.log((md ? '\n' : '') + 'closest to the limit: ' + worst.map(r => `${r.where} ${r.ratio.toFixed(2)}`).join('; '));
  console.log((md ? '\n' : '') + 'colour-vision distance between semantic colours (OKLab ΔE; below 0.08 would be hard to tell apart):');
  for (const r of cvd(t)) { const low = Math.min(r.protanopia, r.deuteranopia, r.tritanopia); if (low < 0.08) fails++; console.log(`  ${r.pair.padEnd(16)} normal ${r.normal.toFixed(2)}  protan ${r.protanopia.toFixed(2)}  deutan ${r.deuteranopia.toFixed(2)}  tritan ${r.tritanopia.toFixed(2)}${low < 0.08 ? '  FAIL' : ''}`); }
}
console.log(`\n${PAIRS.length} pairs per theme, ${fails} failing`);
process.exit(fails ? 1 : 0);
