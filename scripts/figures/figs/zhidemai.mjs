// Zhidemai (SMZDM, "what's worth buying"): a worth-it balance. A lit deal on the left pan
// against list-price weights on the right. As the community's "worth it" votes stack up in front,
// the beam tips toward the deal and the pointer reads "worth it".
import * as k from "../kit/iso-kit.mjs";
import { studio, figure } from "../studio.mjs";

export default function zhidemai() {
  const PLATE = { x: -76, y: -36, w: 152, d: 72, r: 6 };
  const Z = 40, LEN = 36, PAN_Z = 16, PAN_R = 11, HOOK = 3, BY = 4.2; // the beam hangs in front of the pivot, at y = BY
  const s = studio([...k.boxCorners(PLATE, -11, 0), [-LEN, 0, Z + 18], [LEN, 0, Z + 6]], { azimuth: 30 });
  const { G, P, at, L, D, slab, cyl, disc, rod, bench, owned, moving, move, fade, needle, needleSvg } = s;
  const out = [bench(PLATE, { label: { x: 44, y: 18, w: 22, d: 11, r: 1 } })];

  // A pan hangs from a hook under the beam end by three strings (recorded as thin rods).
  function pan(x, load) {
    return owned("pan", () => {
      const g = [];
      g.push(cyl(x, BY, PAN_R, PAN_Z, 1.6, { tone: "mid", name: "pan.dish" }, 40, 0.4));
      g.push(L(k.ring(x, BY, PAN_R - 1.6, PAN_Z + 1.6, P, 36), { tone: "faint" }));
      g.push(load);
      const ends = [90, 210, 330].map((deg) => [x + Math.cos((deg * Math.PI) / 180) * (PAN_R - 1), BY + Math.sin((deg * Math.PI) / 180) * (PAN_R - 1), PAN_Z + 1.6]);
      for (const e of ends) g.push(rod([e, [x, BY, Z - 1 - HOOK]], 0.25, L(k.segment(e, [x, BY, Z - 1 - HOOK], P), { tone: "mid" }) + D([at(e)], { size: 0.5, tone: "hi" }), "pan.string"));
      g.push(cyl(x, BY, 1, Z - 1.1 - HOOK, HOOK, { tone: "mid", name: "pan.hook" }, 14));
      return g.join("");
    });
  }
  const deal = slab({ x: -LEN - 4.5, y: BY - 3.5, w: 9, d: 7, r: 1.2 }, PAN_Z + 1.6, 6, { tone: "hi", lit: true, name: "deal" }, 4, 0.5) +
    L(k.lineOnTop([-LEN - 4.5, BY], [-LEN + 4.5, BY], PAN_Z + 7.6, P), { tone: "lo" });
  let z = PAN_Z + 1.6;
  const weights = [[6.4, 4.6], [5.2, 3.8], [4, 3.2]].map(([r, h]) => { const w = cyl(LEN, BY, r, z, h, { tone: "mid", name: "weight" }, 32, 0.4); z += h; return w; }).join("") +
    cyl(LEN, BY, 1.4, z, 1.8, { tone: "mid", name: "weight.knob" }, 14);

  // The beam tips in turns; the pans follow the beam ends.
  const keys = [0, 0.25, 0.6, 0.8];
  const tilt = [0, 0.032, 0.032, 0];
  const beamTrack = keys.map((t, i) => [t, tilt[i]]);
  const endTrack = (sign) => keys.map((t, i) => [t, sign * LEN * Math.sin(tilt[i] * Math.PI * 2)]);

  out.push(moving("panL", pan(-LEN, deal)));
  // Column on a foot, the pivot block, the scale plate behind the pointer.
  out.push(owned("stand", () => {
    const o = [cyl(0, 0, 9, 0, 3, { tone: "mid", name: "stand.foot-disc" }, 36, 0.5)];
    o.push(cyl(0, 0, 2.6, 3, Z - 6, { tone: "mid", crease: "none", name: "stand.column" }, 24));
    o.push(L(k.sideArc(0, 0, 2.6, 14, P, 16) + k.sideArc(0, 0, 2.6, 26, P, 16), { tone: "faint" }));
    o.push(slab({ x: -5, y: -3, w: 10, d: 6, r: 1.2 }, Z - 3, 6, { tone: "mid", name: "stand.pivot" }, 4, 0.4));
    const SC = { x: -9, y: -3, w: 18, d: 1.2, r: 0.4 };
    o.push(slab(SC, Z + 3, 12, { tone: "mid", name: "stand.scale" }, 2, 0.2));
    const ticks = [];
    for (let i = -4; i <= 4; i++) {
      const a = ((i * 2.4 * Math.PI) / 180) * 3;
      ticks.push(k.segment([Math.sin(a) * 9.4, SC.y + SC.d, Z + Math.cos(a) * 9.4], [Math.sin(a) * (i === 0 ? 12 : 11), SC.y + SC.d, Z + Math.cos(a) * (i === 0 ? 12 : 11)], P));
    }
    o.push(L(ticks.join(""), { tone: "mid" }));
    return o.join("");
  }));
  // The beam is drawn as a tipping line and recorded as a rod through the pivot at rest.
  out.push(rod([[-LEN, BY, Z], [LEN, BY, Z]], 1.1, needleSvg("beam", { tone: "hi", width: 2.2 }), "beam"));
  out.push(needleSvg("pointer", { tone: "lit", width: 1 }));
  out.push(disc(G.frameAlong([0, BY + 1.1, Z], [0, 1, 0]), 0, 1.4, 1.8, { tone: "mid", name: "stand.pin" }));
  out.push(moving("panR", pan(LEN, weights)));

  // The community's votes in front: "worth it" chips (marked with a check) stack up one by one
  // against a single "not worth it" chip (marked with a cross), and the beam tips as they land.
  const VB = { x: -26, y: 18, w: 30, d: 12, r: 2 };
  out.push(slab(VB, 0, 3, { tone: "mid" }, 4, 0.5));
  out.push(L(k.onTop([[-19, 27.6], [-17.4, 28.8], [-14.6, 26.2]], 3, P), { tone: "lit", free: true }));
  out.push(L(k.onTop([[-5.4, 26.2], [-2.6, 28.8]], 3, P) + k.onTop([[-5.4, 28.8], [-2.6, 26.2]], 3, P), { tone: "mid", free: true }));
  const CH = 1.6, VOTES = 4;
  for (let i = 0; i < VOTES; i++) out.push(moving(`vote${i}`, cyl(-16, 22.6, 3.6, 3 + i * CH, CH, { tone: "hi", lit: true, name: "vote" }, 28, 0.3)));
  out.push(cyl(-4, 22.6, 3.6, 3, CH, { tone: "hi", name: "vote.no" }, 28, 0.3));

  const parts = [
    needle("beam", { c: [0, BY, Z], plane: "y", r0: LEN, r1: LEN, track: beamTrack }),
    needle("pointer", { c: [0, -1.2, Z], plane: "y", r0: 3.4, r1: 12, track: beamTrack.map(([t, v]) => [t, 0.25 - v]) }),
    move("panL", [0, 0, 1], endTrack(-1)),
    move("panR", [0, 0, 1], endTrack(1)),
    ...Array.from({ length: VOTES }, (_, i) => fade(`vote${i}`, [[0, 0], [0.02 + i * 0.05, 0], [0.05 + i * 0.05, 1], [0.7, 1], [0.76, 0]])),
  ];
  const svg = figure({
    label: "A beam balance on a bench. A lit deal sits on the left pan and list-price weights on the right. In front, the community's worth-it votes stack up one by one against a single not-worth-it vote, and as they land the beam tips toward the deal and the pointer swings to read worth it.",
    body: out,
  });
  return { svg, P, loop: 5.2, still: 0.45, parts, through: [] };
}
