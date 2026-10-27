// Liepin: a headhunter's scope. A gantry carries a magnifier over rows of candidate pins;
// it scans the board and stops over the one senior pin, which is lit.
import * as k from "../kit/iso-kit.mjs";
import { studio, figure } from "../studio.mjs";

export default function liepin() {
  const PLATE = { x: -84, y: -48, w: 168, d: 96, r: 6 };
  const GZ = 30;
  const s = studio([...k.boxCorners(PLATE, -11, 0), [-60, -40, GZ + 10], [60, 40, GZ + 4]], { azimuth: 42 });
  const { P, at, L, D, slab, cyl, bench, post, moving, move, knob } = s;
  const out = [bench(PLATE, { strip: false, label: { x: 52, y: 16, w: 22, d: 12, r: 1 } })];

  // Board of candidate pins: a raised tray with a dot grid and rows of short pins.
  const BOARD = { x: -50, y: -30, w: 96, d: 60, r: 3 };
  out.push(slab(BOARD, 0, 3, { tone: "mid" }, 4, 0.6));
  out.push(L(k.planOutline(k.insetPlan(BOARD, 2.5), 3, P), { tone: "faint" }));
  const pins = [];
  for (let row = 0; row < 4; row++) for (let col = 0; col < 7; col++) pins.push([-40 + col * 13, -21 + row * 14]);
  const LIT = [-1, 7];
  pins.sort((a, b) => s.depth([a[0], a[1], 0]) - s.depth([b[0], b[1], 0]));
  for (const [x, y] of pins) {
    const lit = x === LIT[0] && y === LIT[1];
    out.push(cyl(x, y, lit ? 2.6 : 2, 3, lit ? 7 : 4, lit ? { tone: "hi", lit: true } : { tone: "mid" }, 20));
    out.push(cyl(x, y, lit ? 1.6 : 1.2, lit ? 10 : 7, 1, lit ? { tone: "hi", lit: true } : { tone: "hi" }, 16));
  }

  // Rails along x at both sides, gantry across y moving along x.
  for (const y of [-40, 36]) {
    out.push(slab({ x: -66, y, w: 132, d: 4, r: 1 }, 0, 3, { tone: "mid" }, 3, 0.4));
    out.push(D([-60, 60].map((x) => at([x, y + 2, 3])), { size: 0.4 }));
  }
  const X0 = -26;
  const gantry = [];
  for (const y of [-41, 35]) gantry.push(slab({ x: X0 - 6, y, w: 12, d: 6, r: 1.2 }, 3, 3, { tone: "mid" }, 3, 0.4));
  gantry.push(post(X0, -38, 2, 6, GZ, { collar: false, cap: false }));
  gantry.push(slab({ x: X0 - 3, y: -42, w: 6, d: 82, r: 1.4 }, GZ, 4, { tone: "mid" }, 4, 0.5));
  gantry.push(D([-38, 34].map((y) => at([X0, y, GZ + 4])), { size: 0.45 }));
  // Carriage hung under the bridge with the magnifier hanging under it.
  gantry.push(slab({ x: X0 - 5, y: 0, w: 10, d: 12, r: 1.5 }, GZ - 6, 6, { tone: "mid" }, 4, 0.5));
  gantry.push(knob(X0, 6, 2, GZ + 4, 2));
  gantry.push(cyl(X0, 6, 1.1, 18, GZ - 24, { tone: "mid", crease: "none" }, 14));
  gantry.push(cyl(X0, 6, 7, 15, 3, { tone: "hi", crease: "lo" }, 40, 0.4));
  gantry.push(L(k.ring(X0, 6, 5.2, 18, P, 36), { tone: "lit" }));
  gantry.push(post(X0, 37, 2, 6, GZ, { collar: false, cap: false }));
  out.push(moving("gantry", gantry.join("")));

  // Scan the columns, then settle over the lit pin.
  const stops = [-40, -27, -14, -1].map((x) => x - X0);
  const parts = [move("gantry", [1, 0, 0], [[0, stops[0]], [0.16, stops[1]], [0.3, stops[2]], [0.45, stops[3]], [0.8, stops[3]], [0.95, stops[0]]])];
  const svg = figure({
    label: "A pin board on a bench with four rows of candidate pins. A gantry with a magnifier scans across the board column by column and stops over the one taller, lit pin.",
    body: out,
  });
  return { svg, P, loop: 6.4, still: 0.6, parts };
}
