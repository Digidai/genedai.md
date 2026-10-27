// Builds public/cards.js: the hover-card figures (anatomy isometric SVG), card text and runtime.
// Run: node scripts/figures/build.mjs   (re-run after editing anything in scripts/figures/)
import { readFileSync, writeFileSync, readdirSync, mkdirSync, rmSync } from "node:fs";
import { resolve } from "node:path";
import { ISO_CSS } from "./kit/iso-kit.mjs";
import ENTS from "./entities.mjs";
import { finish } from "./studio.mjs";
import * as A from "./kit/audit.mjs";

const HERE = import.meta.dirname;
const OUT = resolve(HERE, "../../public/cards.js");
const FIG_DIR = resolve(HERE, "../../public/figs");
const only = process.argv.find((a) => a.startsWith("--only="))?.slice(7);
const auditing = process.argv.includes("--audit");
let problems = 0;

if (!only) rmSync(FIG_DIR, { recursive: true, force: true });
mkdirSync(FIG_DIR, { recursive: true });
let n = 0, figBytes = 0;
for (const id of Object.keys(ENTS)) {
  n++;
  const file = resolve(HERE, "figs", `${id}.mjs`);
  if (!readdirSync(resolve(HERE, "figs")).includes(`${id}.mjs`)) { console.warn(`no figure for ${id}`); continue; }
  if (only && only !== id) continue;
  const { default: build } = await import(file);
  const fig = build();
  const done = finish(fig, { audit: auditing });
  fig.svg = done.svg;
  if (auditing) {
    const r = done.result;
    // Moving parts that pass through a real opening the shapes can't model (a slot, a bore) are listed per figure.
    const through = fig.through ?? [];
    const pairIn = (list, x, y) => list.some(([a, b]) => (x.startsWith(a) && y.startsWith(b)) || (x.startsWith(b) && y.startsWith(a)));
    r.supports.sunk = r.supports.sunk.filter((d) => !pairIn(through, d.a, d.b));
    // A part seen through an opening is clipped by it, so its order against the opening's walls doesn't show.
    r.depth.problems = r.depth.problems.filter((d) => !pairIn(fig.hidden ?? [], d.front, d.back));
    const seen = new Map();
    for (const c of r.flight) {
      if (through.some(([a, b]) => (c.tube.startsWith(a) && c.other.startsWith(b)) || (c.tube.startsWith(b) && c.other.startsWith(a)))) continue;
      const key = [c.tube, c.other].sort().join("|");
      if (!seen.has(key) || seen.get(key).clearance > c.clearance) seen.set(key, c);
    }
    r.flight = [...seen.values()];
    // One line per misordered pair, with how many poses it shows in.
    const pairs = new Map();
    for (const d of r.depth.problems) {
      const key = `${d.front}|${d.back}`;
      const had = pairs.get(key);
      if (had) had.n++, had.area = Math.max(had.area, d.area);
      else pairs.set(key, { ...d, n: 1 });
    }
    r.depth.problems = [...pairs.values()].map((d) => ({ ...d, label: `${d.n} poses, e.g. ${d.label}` }));
    const count = A.failures(r);
    problems += count;
    console.log(`\n── ${id}: ${count ? `${count} problem${count === 1 ? "" : "s"}` : "audit passed"} · ${done.R.items.length} items`);
    if (count) console.log(A.report(r).split("\n").filter((line) => !/: 0 /.test(line) && !/^\w[^:]*: 0$/.test(line)).join("\n"));
  }
  const P = { origin: fig.P.origin.map((v) => +v.toFixed(3)), scale: +fig.P.scale.toFixed(5), azimuth: fig.P.azimuth, elevation: fig.P.elevation };
  const json = JSON.stringify({ svg: fig.svg, P, loop: fig.loop, still: fig.still ?? 0, parts: fig.parts });
  writeFileSync(resolve(FIG_DIR, `${id}.json`), json);
  figBytes += json.length;
  console.log(`  ${id}: ${(json.length / 1024).toFixed(1)} KB`);
  ENTS[id].fig = `Fig ${n}`;
}

const CARD_CSS = `
.ent-card{position:fixed;z-index:200;width:min(336px,calc(100vw - 16px));background:var(--anatomy-card);color:var(--text-primary);border-radius:10px;box-shadow:var(--shadow-card);overflow:hidden;opacity:0;transform:translateY(4px);transition:opacity .16s ease,transform .16s ease}
.ent-card.on{opacity:1;transform:none}
.ent-card[data-theme="light"]{--anatomy-card:#fbfaf7;--anatomy-paper:#fbfaf7}
.ent-card[data-theme="dark"]{--anatomy-card:#201f1a;--anatomy-paper:#201f1a;--anatomy-face:#29281f;--anatomy-top:#2a2922;--anatomy-shade-0:#1a1914;--anatomy-shade-1:#1d1c17;--anatomy-shade-2:#21201a;--anatomy-shade-3:#25241d;--anatomy-lit-top:#34332b;--anatomy-lit-shade:#2b2a23;--anatomy-halo:#0a0a08}
.ent-plate{position:relative;padding:22px 8px 18px;border-bottom:1px solid var(--border-default)}
.ent-stage{aspect-ratio:320/184}
.ent-corner{position:absolute;font:10px/1 var(--font-mono);letter-spacing:.06em;color:var(--text-tertiary);white-space:nowrap}
.ent-corner[data-c="fig"]{top:9px;left:12px}
.ent-corner[data-c="kind"]{top:9px;right:12px;text-transform:uppercase;letter-spacing:.1em}
.ent-corner[data-c="hint"]{bottom:8px;left:12px;text-transform:uppercase;letter-spacing:.1em}
.ent-body{padding:12px 14px 14px}
.ent-title{font-size:15px;line-height:1.35}
.ent-title strong{font-weight:600}
.ent-title span{font:12px var(--font-mono);color:var(--text-tertiary);margin-left:4px}
.ent-desc{margin-top:4px;font:14px/1.55 var(--font-serif);color:var(--text-secondary)}
.ent-links{display:flex;flex-wrap:wrap;gap:6px 14px;margin-top:10px;font:12px var(--font-mono)}
.ent-links a{color:var(--accent);text-decoration:underline;text-decoration-thickness:1px;text-underline-offset:3px}
.ent-blades path{fill:var(--anatomy-face);stroke:var(--anatomy-hi);stroke-width:var(--anatomy-weight);stroke-linejoin:round;vector-effect:non-scaling-stroke}
.ent-blades path[data-lit]{fill:var(--anatomy-lit-top);stroke:var(--anatomy-lit)}
@media (prefers-reduced-motion:reduce){.ent-card{transition:none}}
@media print{.ent-card{display:none!important}}
`;

const pose = readFileSync(resolve(HERE, "pose.js"), "utf8");
const ui = readFileSync(resolve(HERE, "ui.js"), "utf8");
const css = (ISO_CSS + CARD_CSS).replace(/\s*\n\s*/g, "");
const js = `// Generated by scripts/figures/build.mjs — do not edit.
// Figures drawn with the Anatomy kit (https://github.com/wheresryan22/anatomy, MIT).
const ENTS = ${JSON.stringify(ENTS)};
const CSS = ${JSON.stringify(css)};
${pose}
${ui}
export { start, pose };
`;
if (!only) {
  writeFileSync(OUT, js);
  await import("../stamp-assets.mjs"); // new cards.js → new script URLs
}
if (auditing) {
  console.log(problems ? `\naudit failed: ${problems} problems` : "\naudit passed for every figure");
  if (problems) process.exitCode = 1;
}
console.log(`wrote public/cards.js (${(Buffer.byteLength(js) / 1024).toFixed(1)} KB) and public/figs/ (${(figBytes / 1024).toFixed(1)} KB)`);
