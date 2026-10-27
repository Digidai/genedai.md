// Dora Tech: a gear train on a bench, a small team driving a larger wheel.
import * as k from "../kit/iso-kit.mjs";
import { studio, figure } from "../studio.mjs";

export default function dora() {
  const PLATE = { x: -54, y: -40, w: 104, d: 70, r: 6 };
  const Z = 12, H = 4;
  const A = [-16, -6], RA = 22, TA = 30;
  const B = [A[0] + RA + 13.2 + 2.4, -6], RB = 13.2, TB = 18;
    const s = studio([...k.boxCorners(PLATE, -11, 0), [A[0], A[1] - RA - 3, Z + H + 6], [B[0] + RB + 3, B[1], Z + H]], { azimuth: 42 });
  const { P, L, D, at, slab, cyl, bench, post, moving, needle, needleSvg } = s;
  const out = [bench(PLATE, { label: { x: 20, y: 17, w: 20, d: 10, r: 1 }, strip: false })];

  function gear([x, y], R, name, teeth) {
    const g = [];
    g.push(post(x, y, 2.4, 0, Z, { cap: false }));
    g.push(cyl(x, y, R, Z, H, { tone: "hi", crease: "lo" }, 64, 0.5));
    g.push(L(k.ring(x, y, R - 2.4, Z + H, P, 56) + k.ring(x, y, 4.6, Z + H, P, 24), { tone: "faint" }));
    g.push(needleSvg(`${name}t`, { tone: "mid", width: 1.6 }));
    g.push(needleSvg(`${name}s`, { tone: "lo", width: 1 }));
    g.push(needleSvg(`${name}m`, { tone: "lit", width: 1.2 }));
    g.push(cyl(x, y, 3, Z + H, 1.6, { tone: "mid" }, 20));
    g.push(D([at([x, y, Z + H + 1.6])], { size: 0.6, tone: "hi" }));
    void teeth;
    return g.join("");
  }
  out.push(gear(A, RA, "a", TA));
  out.push(gear(B, RB, "b", TB));

  const turns = 2; // A turns twice per loop, B 2 * 30/18 = 10/3 — loop of 3 A turns keeps B integral.
  void turns;
  const tA = [[0, 0], [1, 3]], tB = [[0, 0.5 / TB], [1, 0.5 / TB - 5]];
  const spec = (name, c, R, teeth, track) => [
    needle(`${name}t`, { c, plane: "z", r0: -(R - 0.2), r1: R + 2.2, count: teeth, track, linear: true }),
    needle(`${name}s`, { c, plane: "z", r0: -4.6, r1: R - 2.4, count: 5, track, linear: true }),
    needle(`${name}m`, { c, plane: "z", r0: -4.6, r1: R - 2.4, count: 1, track, linear: true }),
  ];
  const parts = [...spec("a", [A[0], A[1], Z + H], RA, TA, tA), ...spec("b", [B[0], B[1], Z + H], RB, TB, tB)];
  const svg = figure({
    label: "Two meshing spur gears on posts on a bench, the small gear driving the large one; one spoke of each is lit so the turning is easy to follow.",
    body: out,
  });
  return { svg, P, loop: 24, still: 0.05, parts };
}
