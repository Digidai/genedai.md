// BOSS Zhipin: direct chat. A candidate's terminal and the boss's terminal are joined by one rail,
// no middle desk; a message runs to the boss, shows on the boss's screen, and the reply runs back.
import * as k from "../kit/iso-kit.mjs";
import { studio, figure } from "../studio.mjs";

export default function bosszhipin() {
  const PLATE = { x: -100, y: -34, w: 200, d: 68, r: 6 };
  const H = 26;
  const s = studio([...k.boxCorners(PLATE, -11, 0), [-70, -9, H + 14], [70, 5, H + 18]], { azimuth: 54 });
  const { G, P, at, L, D, slab, bench, post, moving, move, fade, disc } = s;

  // Each terminal has a chat screen: two earlier lines, and a new one that lights when a message lands.
  function station(x, who) {
    const out = [];
    const base = { x: x - 15, y: -14, w: 30, d: 26, r: 2.5 };
    out.push(slab(base, 0, 4, { tone: "mid" }, 4, 0.6));
    out.push(D(k.corners(base, 3).map(([cx, cy]) => at([cx, cy, 4])), { size: 0.45 }));
    out.push(post(x, -1, 2.4, 4, H));
    const head = { x: x - 12, y: -10, w: 24, d: 15, r: 2 };
    out.push(slab(head, H, 13, { tone: "mid", inner: L(k.sideSeam(head, H + 4, P, 4), { tone: "faint" }) }, 4, 0.6));
    const top = H + 13;
    const screen = k.insetPlan(head, 2.6);
    out.push(slab(screen, top, 0.4, { tone: "lo", crease: "none" }, 3, 0));
    // Chat lines alternate sides, like bubbles from the two people.
    const row = (i, share, right) => {
      const y = screen.y + 2.4 + i * 2.9, w = (screen.w - 4.8) * share;
      const x0 = right ? screen.x + screen.w - 2.4 - w : screen.x + 2.4;
      return k.lineOnTop([x0, y], [x0 + w, y], top + 0.4, P);
    };
    out.push(L(row(0, 0.6, false) + row(1, 0.45, true), { tone: "mid", free: true }));
    out.push(moving(`msg-${who}`, L(row(2, 0.7, who === "boss"), { tone: "lit", free: true })));
    return out.join("");
  }

  const RAIL = { x: -58, y: -2.5, w: 116, d: 5, r: 1.2 };
  const RZ = H + 7;
  const rail = slab(RAIL, RZ, 3, { tone: "mid" }, 3, 0.4) + D([-40, -14, 14, 40].map((x) => at([x, 0, RZ + 3])), { size: 0.4, tone: "lo" });
  const X0 = -48, X1 = 48;
  const F = G.frameAlong([X0, 0, RZ + 7.4], [1, 0, 0]);
  const capsule = moving("capsule",
    slab({ x: X0 - 5, y: -3.5, w: 10, d: 7, r: 1.6 }, RZ + 3, 1.2, { tone: "mid" }, 3, 0.3) +
    disc(F, -6, 6, 3.2, { tone: "hi", lit: true }) +
    L(G.arcOf(F, -2.5, 3.2, P) + G.arcOf(F, 2.5, 3.2, P), { tone: "lo" }));

  // The candidate's message runs to the boss and shows on the boss's screen; the boss's reply runs back.
  const D1 = X1 - X0;
  const parts = [
    move("capsule", [1, 0, 0], [[0, 0], [0.06, 0], [0.34, D1], [0.5, D1], [0.78, 0]]),
    fade("msg-boss", [[0, 0], [0.34, 0], [0.38, 1], [0.93, 1], [0.98, 0]]),
    fade("msg-cand", [[0, 0], [0.78, 0], [0.82, 1], [0.93, 1], [0.98, 0]]),
  ];
  const svg = figure({
    label: "Two terminals on a bench joined by one rail: the candidate's on the left, the boss's on the right. The candidate's message runs straight to the boss and appears on the boss's chat screen; the boss's reply runs back and appears on the candidate's.",
    body: [bench(PLATE, { label: { x: -86, y: 18, w: 24, d: 11, r: 1 } }), station(-70, "cand"), rail, capsule, station(70, "boss")],
  });
  return { svg, P, loop: 5.6, still: 0.86, parts };
}
