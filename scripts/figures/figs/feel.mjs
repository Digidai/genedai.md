// Feel: a rep counter. A barbell is lifted off the J-hooks of a rack and lowered again;
// each rep advances the counter dial in front of the rack.
import * as k from "../kit/iso-kit.mjs";
import { studio, figure } from "../studio.mjs";

export default function feel() {
  const PLATE = { x: -70, y: -40, w: 140, d: 80, r: 6 };
  const TOP = 46, BAR_Y = -1, BAR_R = 1.2;
  const HOOK = 14, LIFT = 14;                 // the bar rests on the hooks at z = HOOK + BAR_R
  const UP = -8;                              // the uprights stand behind the bar
  const s = studio([...k.boxCorners(PLATE, -11, 0), [-56, BAR_Y, HOOK + LIFT + 12], [-40, UP, TOP + 2]], { azimuth: 40 });
  const { G, P, at, L, D, slab, disc, bench, post, dial, owned, moving, move, needle, needleSvg } = s;
  const out = [bench(PLATE, { label: { x: 38, y: 22, w: 22, d: 11, r: 1 } })];

  // Rack: two uprights, a crossbar on top, a J-hook on the front of each upright.
  out.push(owned("rack", () => {
    const o = [post(-40, UP, 2.2, 0, TOP), post(40, UP, 2.2, 0, TOP)];
    o.push(slab({ x: -43, y: UP - 3, w: 86, d: 6, r: 1.5 }, TOP, 3, { tone: "mid", name: "rack.crossbar" }, 4, 0.5));
    o.push(D([-40, 40].map((x) => at([x, UP, TOP + 3])), { size: 0.45 }));
    for (const x of [-40, 40]) {
      o.push(slab({ x: x - 1.6, y: UP + 2.2, w: 3.2, d: BAR_Y - UP - 2.2 + 2.4, r: 0.6 }, HOOK - 2, 2, { tone: "mid", name: "rack.hook" }, 3, 0.3));
      o.push(slab({ x: x - 1.6, y: BAR_Y + 1.4, w: 3.2, d: 1, r: 0.4 }, HOOK, 2.4, { tone: "mid", name: "rack.hook-lip" }, 3, 0.2));
    }
    return o.join("");
  }));

  // Barbell: the bar in front of the uprights, plates outside them.
  const F = G.frameAlong([-56, BAR_Y, HOOK + BAR_R], [1, 0, 0]);
  // The bar is cut where the plates sit, so each piece meets a plate face to face.
  const bar = [[0, 8], [14, 98], [104, 112]].map(([s0, s1]) => disc(F, s0, s1, BAR_R, { tone: "mid", crease: "none", name: "bar" }));
  for (const [s0, s1, r, lit] of [[8, 11, 9.5, false], [11, 14, 7.5, false], [98, 101, 7.5, false], [101, 104, 9.5, true]])
    bar.push(disc(F, s0, s1, r, { tone: "hi", lit, name: "plate" }));
  out.push(moving("bar", bar.join("")));

  // Rep counter in front.
  out.push(slab({ x: -12, y: 14, w: 24, d: 16, r: 2 }, 0, 4, { tone: "mid", name: "counter.base" }, 4, 0.5));
  out.push(dial(0, 22, 9, 4, 3, { ticks: 30, every: 5 }));
  out.push(needleSvg("reps"));
  const parts = [
    move("bar", [0, 0, 1], [[0, 0], [0.2, LIFT], [0.5, 0], [0.7, LIFT]]),
    needle("reps", { c: [0, 22, 7.2], plane: "z", r0: 1.4, r1: 6.6, track: [[0, 0], [0.45, 0], [0.5, 0.1], [0.95, 0.1], [0.99, 0.2]] }),
  ];
  const svg = figure({ label: "A barbell on the J-hooks of a rack on a bench. It is lifted and lowered twice, and the counter dial in front advances with each rep.", body: out });
  return { svg, P, loop: 4.4, still: 0.2, parts };
}
