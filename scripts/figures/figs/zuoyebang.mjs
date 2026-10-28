// Zuoyebang: photo search. A document camera on an arm looks down at a homework sheet;
// a scan line sweeps the question, then the solution steps light up on the screen beside it.
import * as k from "../kit/iso-kit.mjs";
import { studio, figure } from "../studio.mjs";

export default function zuoyebang() {
  const PLATE = { x: -88, y: -44, w: 176, d: 88, r: 6 };
  const AZ = 40;
  const s = studio([...k.boxCorners(PLATE, -11, 0), [-56, -30, AZ + 6], [56, -18, 40]], { azimuth: 44 });
  const { P, at, L, D, slab, cyl, bench, post, knob, moving, move, fade } = s;
  const out = [bench(PLATE, { label: { x: -85, y: 24, w: 22, d: 11, r: 1 } })];

  // Camera column at the back left, arm reaching over the sheet.
  out.push(slab({ x: -66, y: -38, w: 22, d: 18, r: 2 }, 0, 4, { tone: "mid" }, 4, 0.6));
  out.push(post(-55, -29, 2.6, 4, AZ));
  out.push(slab({ x: -58, y: -32, w: 46, d: 6, r: 1.5 }, AZ, 4, { tone: "mid" }, 4, 0.5));
  out.push(knob(-55, -24, 2.4, AZ - 6, 3));

  // Homework sheet on a clip board.
  const BOARD = { x: -50, y: -16, w: 58, d: 46, r: 2 };
  out.push(slab(BOARD, 0, 1.6, { tone: "mid" }, 4, 0.3));
  const SHEET = { x: -46, y: -12, w: 50, d: 38, r: 0.6 };
  out.push(slab(SHEET, 1.6, 0.3, { tone: "hi", crease: "none" }, 3, 0));
  const lines = [];
  for (let i = 0; i < 6; i++) lines.push(L(k.lineOnTop([SHEET.x + 4, SHEET.y + 6 + i * 5.4], [SHEET.x + 4 + (SHEET.w - 8) * [0.8, 0.6, 0.9, 0.5, 0.7, 0.4][i], SHEET.y + 6 + i * 5.4], 1.9, P), { tone: i < 2 ? "mid" : "lo", free: true }));
  out.push(lines.join(""));
  // Scan bar (lit) sweeping across the sheet in y.
  out.push(moving("scan", L(k.lineOnTop([SHEET.x, SHEET.y + 2], [SHEET.x + SHEET.w, SHEET.y + 2], 1.9, P), { tone: "lit" })));

  out.push(slab({ x: -30, y: -18, w: 18, d: 5, r: 1.2 }, 1.6, 2.4, { tone: "mid" }, 3, 0.4));
  // Camera head hung under the arm end: housing and lens pointing down; drawn after the sheet.
  out.push(slab({ x: -26, y: -35, w: 14, d: 12, r: 2 }, AZ - 10, 10, { tone: "mid" }, 4, 0.6));
  out.push(cyl(-19, -29, 3.4, AZ - 13, 3, { tone: "hi", crease: "lo" }, 28));
  out.push(moving("flash", L(k.ring(-19, -29, 2.2, AZ - 13, P, 24), { tone: "lit" })));

  // Solution screen on a stand at the right.
  out.push(slab({ x: 30, y: -24, w: 30, d: 16, r: 2 }, 0, 3, { tone: "mid" }, 4, 0.5));
  out.push(post(45, -18, 2, 3, 12, { cap: false }));
  const SCREEN = { x: 26, y: -22, w: 38, d: 4, r: 1 };
  const face = (y, z) => [SCREEN.x, y, z];
  out.push(slab(SCREEN, 12, 26, { tone: "mid" }, 3, 0.4));
  // Steps of the solution on the screen's front face (y = SCREEN.y + d), each its own fade group.
  const fy = SCREEN.y + SCREEN.d;
  const steps = [0.8, 0.6, 0.7, 0.45];
  steps.forEach((share, i) => {
    const z = 33 - i * 5;
    out.push(moving(`step${i}`, L(k.segment([SCREEN.x + 4, fy, z], [SCREEN.x + 4 + (SCREEN.w - 8) * share, fy, z], P), { tone: i === 3 ? "lit" : "hi", free: true })));
  });
  out.push(D([at([SCREEN.x + SCREEN.w - 3, fy, 15])], { size: 0.6, tone: "hi" }));
  void face;

  const parts = [
    move("scan", [0, 1, 0], [[0, 0], [0.08, 0], [0.38, SHEET.d - 4], [0.4, SHEET.d - 4], [0.42, 0]]),
    fade("scan", [[0, 0], [0.06, 1], [0.38, 1], [0.42, 0]]),
    fade("flash", [[0, 0], [0.04, 1], [0.1, 0], [0.99, 0]]),
    ...steps.map((_, i) => fade(`step${i}`, [[0, 0], [0.44 + i * 0.07, 0], [0.48 + i * 0.07, 1], [0.92, 1], [0.97, 0]])),
  ];
  const svg = figure({
    label: "A document camera on an arm over a homework sheet on a clipboard. The lens flashes, a scan line sweeps the question, and the steps of the solution light up one by one on the screen beside it.",
    body: out,
  });
  return { svg, P, loop: 6, still: 0.8, parts };
}
