// Zhidemai (SMZDM, "what's worth buying"): a worth-it balance. A lit deal on the left pan
// against list-price weights on the right; the beam tips and the pointer reads "worth it".
import * as k from "../kit/iso-kit.mjs";
import { studio, figure } from "../studio.mjs";

export default function zhidemai() {
  const PLATE = { x: -76, y: -36, w: 152, d: 72, r: 6 };
  const Z = 40, LEN = 36, PAN_Z = 16, PAN_R = 11;
  const s = studio([...k.boxCorners(PLATE, -11, 0), [-LEN, 0, Z + 18], [LEN, 0, Z + 6]], { azimuth: 30 });
  const { P, at, L, D, slab, cyl, bench, moving, move, needle, needleSvg } = s;
  const out = [bench(PLATE, { label: { x: 44, y: 18, w: 22, d: 11, r: 1 } })];

  function pan(x, load) {
    const g = [];
    g.push(cyl(x, 0, PAN_R, PAN_Z, 1.6, { tone: "mid" }, 40, 0.4));
    g.push(L(k.ring(x, 0, PAN_R - 1.6, PAN_Z + 1.6, P, 36), { tone: "faint" }));
    g.push(load);
    const ends = [90, 210, 330].map((deg) => [x + Math.cos((deg * Math.PI) / 180) * (PAN_R - 1), Math.sin((deg * Math.PI) / 180) * (PAN_R - 1), PAN_Z + 1.6]);
    for (const e of ends) g.push(L(k.segment(e, [x, 0, Z - 2], P), { tone: "mid" }));
    g.push(D(ends.map((e) => at(e)), { size: 0.5, tone: "hi" }));
    g.push(cyl(x, 0, 1.2, Z - 3, 2, { tone: "mid" }, 14));
    return g.join("");
  }
  const deal = slab({ x: -LEN - 6, y: -5, w: 12, d: 10, r: 1.4 }, PAN_Z + 1.6, 8, { tone: "hi", lit: true }, 4, 0.6) +
    L(k.lineOnTop([-LEN - 4, 0], [-LEN + 4, 0], PAN_Z + 9.6, P), { tone: "lo" });
  const weights = [0, 4.6, 8.4].map((z, i) => cyl(LEN, 0, [6.4, 5.2, 4][i], PAN_Z + 1.6 + z, [4.6, 3.8, 3.2][i], { tone: "mid" }, 32, 0.4)).join("") +
    cyl(LEN, 0, 1.4, PAN_Z + 13.8, 1.8, { tone: "mid" }, 14);

  // Tilt in turns; pans follow the beam ends.
  const keys = [0, 0.25, 0.5, 0.75];
  const tilt = [0, 0.032, 0.032, 0];
  const beamTrack = keys.map((t, i) => [t, tilt[i]]);
  const endTrack = (sign) => keys.map((t, i) => [t, sign * LEN * Math.sin(tilt[i] * Math.PI * 2)]);

  out.push(moving("panL", pan(-LEN, deal)));
  // Column, foot and the scale plate behind the pointer.
  out.push(cyl(0, 0, 9, 0, 3, { tone: "mid" }, 36, 0.5));
  out.push(cyl(0, 0, 2.6, 3, Z - 5, { tone: "mid", crease: "none" }, 24));
  out.push(L(k.sideArc(0, 0, 2.6, 14, P, 16) + k.sideArc(0, 0, 2.6, 26, P, 16), { tone: "faint" }));
  out.push(slab({ x: -5, y: -3, w: 10, d: 6, r: 1.2 }, Z - 3, 6, { tone: "mid" }, 4, 0.4));
  const SC = { x: -9, y: -4.2, w: 18, d: 1.2, r: 0.4 };
  out.push(slab(SC, Z + 6, 12, { tone: "mid" }, 2, 0.2));
  const ticks = [];
  for (let i = -4; i <= 4; i++) {
    const a = (i * 2.4 * Math.PI) / 180 * 3;
    const r0 = 13, r1 = i === 0 ? 15.5 : 14.6;
    ticks.push(k.segment([Math.sin(a) * r0, SC.y + SC.d, Z + Math.cos(a) * r0], [Math.sin(a) * r1, SC.y + SC.d, Z + Math.cos(a) * r1], P));
  }
  out.push(L(ticks.join(""), { tone: "mid" }));
  out.push(needleSvg("beam", { tone: "hi", width: 2.2 }));
  out.push(needleSvg("pointer", { tone: "lit", width: 1 }));
  out.push(cyl(0, 3, 1.8, Z - 1.8, 3.6, { tone: "mid" }, 16));
  out.push(moving("panR", pan(LEN, weights)));

  const parts = [
    needle("beam", { c: [0, 0, Z], plane: "y", r0: LEN, r1: LEN, track: beamTrack }),
    needle("pointer", { c: [0, -1.6, Z], plane: "y", r0: 1, r1: 14, track: beamTrack.map(([t, v]) => [t, 0.25 - v]) }),
    move("panL", [0, 0, 1], endTrack(-1)),
    move("panR", [0, 0, 1], endTrack(1)),
  ];
  const svg = figure({
    label: "A beam balance on a bench. A lit deal sits on the left pan and list-price weights on the right; the beam tips toward the deal and the pointer swings across the scale to read worth it.",
    body: out,
  });
  return { svg, P, loop: 5.2, still: 0.4, parts };
}
