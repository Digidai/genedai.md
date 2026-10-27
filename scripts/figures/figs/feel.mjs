// Feel: a rep counter. A barbell on a guided rack rises and lowers; each rep advances the counter dial.
import * as k from "../kit/iso-kit.mjs";
import { studio, figure } from "../studio.mjs";

export default function feel() {
  const PLATE = { x: -70, y: -40, w: 140, d: 80, r: 6 };
  const TOP = 44, LO = 14, HI = 28;
  const s = studio([...k.boxCorners(PLATE, -11, 0), [-40, 0, TOP + 2], [40, 0, TOP + 2]], { azimuth: 40 });
  const { G, P, at, S, L, D, slab, bench, post, dial, moving, move, needle, needleSvg } = s;
  const out = [bench(PLATE, { label: { x: 38, y: 20, w: 22, d: 11, r: 1 } })];
  out.push(post(-40, -8, 2.2, 0, TOP));
  out.push(post(40, -8, 2.2, 0, TOP));
  out.push(slab({ x: -43, y: -11, w: 86, d: 6, r: 1.5 }, TOP, 3, { tone: "mid" }, 4, 0.5));
  out.push(D([-40, 40].map((x) => at([x, -8, TOP + 3])), { size: 0.45 }));
  // Barbell: bar along x with plates; slides on the posts.
  const F = G.frameAlong([-52, -8, LO], [1, 0, 0]);
  const bar = [
    slab({ x: -52, y: -9.2, w: 104, d: 2.4, r: 1.1 }, LO - 1.2, 2.4, { tone: "mid" }, 4, 0.2),
    ...[[6, 9.5], [10, 7], [94, 7], [98, 9.5]].map(([s0, r], i) => S(G.disc(s0, s0 + (i % 3 === 0 ? 3 : 2.4), r, F, P), i === 3 ? { tone: "hi", lit: true } : { tone: "hi" })),
    slab({ x: -44, y: -11, w: 8, d: 6, r: 1.2 }, LO - 2, 4, { tone: "mid" }, 3, 0.4),
    slab({ x: 36, y: -11, w: 8, d: 6, r: 1.2 }, LO - 2, 4, { tone: "mid" }, 3, 0.4),
  ];
  out.push(moving("bar", bar.join("")));
  out.push(slab({ x: -12, y: 10, w: 24, d: 16, r: 2 }, 0, 4, { tone: "mid" }, 4, 0.5));
  out.push(dial(0, 18, 9, 4, 3, { ticks: 30, every: 5 }));
  out.push(needleSvg("reps"));
  const track = [[0, 0], [0.2, HI - LO], [0.5, 0], [0.7, HI - LO]];
  const parts = [
    move("bar", [0, 0, 1], track),
    needle("reps", { c: [0, 18, 7.2], plane: "z", r0: 1.4, r1: 6.6, track: [[0, 0], [0.45, 0], [0.5, 0.1], [0.95, 0.1], [0.99, 0.2]] }),
  ];
  const svg = figure({ label: "A barbell on a guided rack on a bench. It rises and lowers between two posts, and the counter dial in front advances with each rep.", body: out });
  return { svg, P, loop: 4.4, still: 0.2, parts };
}
