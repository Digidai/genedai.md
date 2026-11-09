// Feel: a weekly check-in board. Three rows of habit holes across seven days; each day the habits are
// checked in by dropping a lit peg into that day's holes, and the streak dial in front advances.
import * as k from "../kit/iso-kit.mjs";
import { studio, figure } from "../studio.mjs";

export default function feel() {
  const PLATE = { x: -76, y: -44, w: 152, d: 88, r: 6 };
  const s = studio([...k.boxCorners(PLATE, -11, 0), [-50, -30, 16]], { azimuth: 40 });
  const { P, at, L, D, slab, cyl, bench, dial, moving, move, fade, needle, needleSvg } = s;
  const out = [bench(PLATE, { strip: false, label: { x: 44, y: 24, w: 22, d: 11, r: 1 } })];

  // The board: a tray with a habit name (rule lines) at the head of each row.
  const BOARD = { x: -62, y: -32, w: 112, d: 42, r: 3 };
  const BZ = 3;
  out.push(slab(BOARD, 0, BZ, { tone: "mid" }, 4, 0.6));
  const ROWS = [-22, -11, 0], DAYS = 7, X0 = -30, DX = 11;
  out.push(L(ROWS.map((y) => k.lineOnTop([BOARD.x + 5, y], [BOARD.x + 5 + [16, 12, 18][ROWS.indexOf(y)], y], BZ, P)).join(""), { tone: "lo", free: true }));
  out.push(D(Array.from({ length: DAYS }, (_, d) => at([X0 + d * DX, BOARD.y + 3, BZ])), { size: 0.4, tone: "lo" }));

  // A hole for every habit and day; on its day each habit's lit peg drops into its hole.
  const R = 2.6, H = 6, DROP = 9;
  out.push(L(ROWS.flatMap((y) => Array.from({ length: DAYS }, (_, d) => k.ring(X0 + d * DX, y, R, BZ, P, 24))).join(""), { tone: "lo" }));
  out.push(L(ROWS.flatMap((y) => Array.from({ length: DAYS }, (_, d) => k.ring(X0 + d * DX, y, R * 0.45, BZ, P, 16))).join(""), { tone: "faint" }));
  const pegs = [];
  for (const y of ROWS) for (let d = 0; d < DAYS; d++) pegs.push([X0 + d * DX, y, d]);
  pegs.sort((a, b) => s.depth([a[0], a[1], 0]) - s.depth([b[0], b[1], 0]));
  const byDay = Array.from({ length: DAYS }, () => []);
  for (const [x, y, d] of pegs) byDay[d].push(cyl(x, y, R, BZ, H, { tone: "hi", lit: true, name: "peg" }, 24, 0.4) + L(k.ring(x, y, R - 1, BZ + H, P, 20), { tone: "lo" }));
  byDay.forEach((svg, d) => out.push(moving(`day${d}`, svg.join(""))));

  // Streak dial on a low drum at the front.
  out.push(cyl(-30, 26, 10, 0, 3, { tone: "mid" }, 40, 0.5));
  out.push(dial(-30, 26, 8, 3, 3, { ticks: 28, every: 7 }));
  out.push(needleSvg("streak"));

  const t0 = 0.06, dt = 0.11;
  const parts = Array.from({ length: DAYS }, (_, d) => fade(`day${d}`, [[0, 0], [t0 + d * dt - 0.03, 0], [t0 + d * dt, 1], [0.92, 1], [0.97, 0]]));
  for (let d = 0; d < DAYS; d++) parts.push(move(`day${d}`, [0, 0, 1], [[0, DROP], [t0 + d * dt - 0.03, DROP], [t0 + d * dt + 0.03, 0], [0.92, 0], [0.97, DROP]]));
  const track = [[0, 0]];
  for (let d = 0; d < DAYS; d++) track.push([t0 + d * dt, d / 28], [t0 + d * dt + 0.03, (d + 1) / 28]);
  track.push([0.92, DAYS / 28], [0.98, 0]);
  parts.push(needle("streak", { c: [-30, 26, 6.2], plane: "z", r0: 1.2, r1: 5.8, track }));

  const svg = figure({
    label: "A weekly check-in board on a bench: three rows of habit holes across seven days. Day by day, lit pegs drop into that day's holes as the habits are checked in, and the streak dial in front advances one step per day.",
    body: out,
  });
  return { svg, P, loop: 5.6, still: 0.6, steps: [[0, 0.1], [0.36, 0.45], [0.69, 0.86]], parts };
}
