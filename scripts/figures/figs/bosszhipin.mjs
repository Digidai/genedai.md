// BOSS Zhipin: a direct line. A candidate's terminal and the boss's terminal are joined
// by one rail; a lit message capsule shuttles straight between them, no middle desk.
import * as k from "../kit/iso-kit.mjs";
import { studio, figure } from "../studio.mjs";

export default function bosszhipin() {
  const PLATE = { x: -100, y: -34, w: 200, d: 68, r: 6 };
  const H = 26;
  const s = studio([...k.boxCorners(PLATE, -11, 0), [-70, -9, H + 14], [70, 5, H + 18]], { azimuth: 54 });
  const { G, P, at, S, L, D, slab, bench, post, knob, dial, moving, move, needle, needleSvg } = s;

  function station(x, boss) {
    const out = [];
    const base = { x: x - 15, y: -14, w: 30, d: 26, r: 2.5 };
    out.push(slab(base, 0, 4, { tone: "mid" }, 4, 0.6));
    out.push(D(k.corners(base, 3).map(([cx, cy]) => at([cx, cy, 4])), { size: 0.45 }));
    out.push(post(x, -1, 2.4, 4, H));
    const head = { x: x - 12, y: -10, w: 24, d: 15, r: 2 };
    out.push(slab(head, H, 13, { tone: "mid", inner: L(k.sideSeam(head, H + 4, P, 4), { tone: "faint" }) }, 4, 0.6));
    const top = H + 13;
    if (boss) {
      out.push(dial(x, -2.5, 6.2, top, 2.4, { ticks: 24, every: 6 }));
      out.push(needleSvg("count"));
      out.push(knob(x - 9, 2.5, 1.6, top, 1.6));
    } else {
      const screen = k.insetPlan(head, 2.6);
      out.push(S(k.slabOf(screen, top, 0.4, P, 3), { tone: "lo", crease: "none" }));
      [0.75, 0.5, 0.62].forEach((share, i) => out.push(L(k.lineOnTop([screen.x + 2.4, screen.y + 2.6 + i * 3], [screen.x + 2.4 + (screen.w - 4.8) * share, screen.y + 2.6 + i * 3], top + 0.4, P), { tone: "mid", free: true })));
    }
    return out.join("");
  }

  const RAIL = { x: -58, y: -2.5, w: 116, d: 5, r: 1.2 };
  const RZ = H + 7;
  const rail = slab(RAIL, RZ, 3, { tone: "mid" }, 3, 0.4) + D([-40, -14, 14, 40].map((x) => at([x, 0, RZ + 3])), { size: 0.4, tone: "lo" });
  const X0 = -48, X1 = 48;
  const F = G.frameAlong([X0, 0, RZ + 6.4], [1, 0, 0]);
  const capsule = moving("capsule",
    slab({ x: X0 - 5, y: -3.5, w: 10, d: 7, r: 1.6 }, RZ + 3, 1.2, { tone: "mid" }, 3, 0.3) +
    S(G.disc(-6, 6, 3.2, F, P), { tone: "hi", lit: true }) +
    L(G.arcOf(F, -2.5, 3.2, P) + G.arcOf(F, 2.5, 3.2, P), { tone: "lo" }));

  // Rest at the candidate, run to the boss, wait, run back.
  const track = [[0, 0], [0.1, 0], [0.4, X1 - X0], [0.6, X1 - X0], [0.9, 0]];
  const parts = [
    move("capsule", [1, 0, 0], track),
    needle("count", { c: [70, -2.5, H + 15.6], plane: "z", r0: 1.2, r1: 4.6, track: [[0, 0], [0.4, 0], [0.47, 0.18], [0.9, 0.18], [0.97, 0]] }),
  ];
  const svg = figure({
    label: "Two terminals on a bench joined by one rail: the candidate's on the left, the boss's on the right. A lit message capsule runs straight between them, and the boss's dial counts each arrival.",
    body: [bench(PLATE, { label: { x: -86, y: 18, w: 24, d: 11, r: 1 } }), station(-70, false), rail, capsule, station(70, true)],
  });
  return { svg, P, loop: 5.6, still: 0.5, parts };
}
