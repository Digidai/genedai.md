// HireAI Directory: five eras. Five display stands of rising height in a row; a lit carriage visits each in turn.
import * as k from "../kit/iso-kit.mjs";
import { studio, figure } from "../studio.mjs";

export default function hireai() {
  const PLATE = { x: -84, y: -34, w: 168, d: 68, r: 6 };
  const s = studio([...k.boxCorners(PLATE, -11, 0), [64, -10, 40]], { azimuth: 34 });
  const { P, at, L, D, slab, cyl, bench, moving, move } = s;
  const out = [bench(PLATE, { label: { x: -74, y: 18, w: 22, d: 11, r: 1 } })];
  const XS = [-56, -26, 4, 34, 64];
  XS.forEach((x, i) => {
    const h = 8 + i * 7;
    const plan = { x: x - 9, y: -18, w: 18, d: 16, r: 1.6 };
    out.push(slab(plan, 0, h, { tone: "mid", inner: L(k.sideSeam(plan, h - 3, P, 4), { tone: "faint" }) }, 4, 0.5));
    // Products on each era's stand: more and smaller as time goes on.
    const n = i + 1;
    // Spread them evenly inside the stand top so neighbours never touch.
    const r = n >= 5 ? 1.5 : n === 4 ? 2 : 2.2, spread = 2 * (9 - r - 0.5);
    for (let j = 0; j < n; j++) out.push(cyl(n === 1 ? x : x - spread / 2 + (spread / (n - 1)) * j, -10, r, h, 3 + (j % 2), { tone: "hi" }, 18));
  });
  out.push(slab({ x: -70, y: 6, w: 148, d: 5, r: 1 }, 0, 2.4, { tone: "mid" }, 3, 0.4));
  const ticks = k.topTicks(-66, 74, 3.5, 5, 6.6, 2.4, [1.4, 2.6], P);
  out.push(L(ticks.minor, { tone: "lo" }), L(ticks.major, { tone: "mid" }));
  out.push(D(XS.map((x) => at([x, 8.5, 2.4])), { size: 0.7, tone: "hi" }));
  const car = slab({ x: XS[0] - 5, y: 4, w: 10, d: 9, r: 1.6 }, 2.4, 3, { tone: "hi", lit: true }, 4, 0.4) + cyl(XS[0], 8.5, 1, 5.4, 6, { tone: "mid" }, 12) + cyl(XS[0], 8.5, 2, 11.4, 1.2, { tone: "hi", lit: true }, 16);
  out.push(moving("car", car));
  const track = [];
  XS.forEach((x, i) => { track.push([i * 0.19, x - XS[0]], [i * 0.19 + 0.1, x - XS[0]]); });
  const parts = [move("car", [1, 0, 0], track)];
  const svg = figure({ label: "Five display stands of rising height on a bench, one per era of HR technology, each holding more products than the last. A lit carriage on a ruled track stops in front of each era in turn.", body: out });
  return { svg, P, loop: 7, still: 0.86, parts };
}
