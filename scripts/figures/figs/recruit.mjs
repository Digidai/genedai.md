// Recruit Navigator: a chart table. A board of category pins joined by routes; a lit puck travels a route from the root.
import * as k from "../kit/iso-kit.mjs";
import { studio, figure } from "../studio.mjs";

export default function recruit() {
  const PLATE = { x: -80, y: -46, w: 160, d: 92, r: 6 };
  const s = studio([...k.boxCorners(PLATE, -11, 0), [-60, -30, 14]], { azimuth: 44 });
  const { P, L, D, slab, cyl, bench, moving, fade } = s;
  const out = [bench(PLATE, { strip: false, label: { x: 50, y: 28, w: 22, d: 11, r: 1 } })];
  const BOARD = { x: -66, y: -36, w: 120, d: 62, r: 3 };
  out.push(slab(BOARD, 0, 3, { tone: "mid" }, 4, 0.6));
  out.push(D(k.dotGrid(BOARD.x + 5, BOARD.y + 5, 23, 12, 5, 3, P), { size: 0.3, tone: "faint" }));
  const ROOT = [-52, -4];
  const mids = [[-22, -24], [-22, -4], [-22, 16]];
  const leaves = [[10, -30], [10, -18], [10, -8], [10, 4], [10, 14], [10, 22], [38, -24], [38, -8], [38, 10]];
  const links = [...mids.map((m) => [ROOT, m]), [mids[0], leaves[0]], [mids[0], leaves[1]], [mids[1], leaves[2]], [mids[1], leaves[3]], [mids[2], leaves[4]], [mids[2], leaves[5]], [leaves[1], leaves[6]], [leaves[3], leaves[7]], [leaves[4], leaves[8]]];
  const route = (a, b) => { const mx = (a[0] + b[0]) / 2; return k.onTop([a, [mx, a[1]], [mx, b[1]], b], 3, P); };
  out.push(L(links.map(([a, b]) => route(a, b)).join(""), { tone: "lo" }));
  const pathTo = [ROOT, mids[1], leaves[3], leaves[7]];
  out.push(L(pathTo.slice(1).map((b, i) => route(pathTo[i], b)).join(""), { tone: "hi" }));
  // The route to one resource lights up leg by leg, then the resource's pin lights.
  const parts = [];
  pathTo.slice(1).forEach((b, i) => {
    out.push(moving(`leg${i}`, L(route(pathTo[i], b), { tone: "lit" })));
    parts.push(fade(`leg${i}`, [[0, 0], [0.08 + i * 0.16, 0], [0.16 + i * 0.16, 1], [0.86, 1], [0.94, 0]]));
  });
  const pins = [[ROOT, 4, 6], ...mids.map((m) => [m, 3, 4]), ...leaves.map((l) => [l, 2.2, 3])].sort((a, b) => s.depth([...a[0], 0]) - s.depth([...b[0], 0]));
  for (const [[x, y], r, h] of pins) out.push(cyl(x, y, r, 3, h, { tone: "hi" }, 24, 0.3));
  const [gx, gy] = pathTo[pathTo.length - 1];
  out.push(moving("goal", cyl(gx, gy, 2.2, 6, 0.6, { tone: "hi", lit: true, name: "goal" }, 20)));
  parts.push(fade("goal", [[0, 0], [0.56, 0], [0.62, 1], [0.86, 1], [0.94, 0]]));
  const svg = figure({ label: "A chart table on a bench: a board of category pins joined by routes branching from one root. A route lights up leg by leg from the root to one resource, whose pin then lights.", body: out });
  return { svg, P, loop: 6, still: 0.85, parts };
}
