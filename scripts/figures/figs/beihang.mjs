// Beihang: a thrust stand. An engine nacelle on a sliding sled pushes against a spring; the gauge reads thrust.
import * as k from "../kit/iso-kit.mjs";
import { studio, figure } from "../studio.mjs";

export default function beihang() {
  const PLATE = { x: -84, y: -34, w: 168, d: 68, r: 6 };
  const Z = 18;
  const s = studio([...k.boxCorners(PLATE, -11, 0), [-50, 0, Z + 12], [67, 0, Z + 18]], { azimuth: 36 });
  const { G, P, at, S, L, D, slab, bench, post, dial, moving, move, needle, needleSvg, disc, turned } = s;
  const out = [bench(PLATE, { label: { x: -74, y: 18, w: 22, d: 11, r: 1 } })];
  for (const y of [-12, 8]) { out.push(slab({ x: -66, y, w: 100, d: 4, r: 1 }, 0, 3, { tone: "mid" }, 3, 0.4)); out.push(D([-60, 28].map((x) => at([x, y + 2, 3])), { size: 0.4 })); }
  const coils = (dx) => L(k.coil(4 + dx, 40, [-2, Z - 2], 3.2, 6, "x", P).back + k.coil(4 + dx, 40, [-2, Z - 2], 3.2, 6, "x", P).front, { tone: "mid" });
  out.push(coils(0));
  // Fixed block with gauge at +x; spring between sled and block.
  out.push(slab({ x: 40, y: -14, w: 14, d: 28, r: 2 }, 0, 20, { tone: "mid" }, 4, 0.6));
  out.push(post(58, 0, 2, 0, 24, { cap: false }));
  out.push(dial(58, 0, 9, 24, 3, { ticks: 30, every: 5 }));
  out.push(needleSvg("thrust"));
  // Sled with the nacelle (lathe), moving along +x.
  const F = G.frameAlong([-52, -2, Z], [1, 0, 0]);
  const prof = [[0, 0], [0, 7], [4, 9, 1], [26, 9.6, 1], [44, 8, 1], [56, 5.4], [56, 0]];
  const sled = [
    slab({ x: -60, y: -14, w: 44, d: 26, r: 2 }, 3, 3, { tone: "mid" }, 4, 0.5),
    post(-46, -2, 1.8, 6, Z - 9.05, { collar: false, cap: false }),
    post(-22, -2, 1.8, 6, Z - 9.24, { collar: false, cap: false }),
    turned(prof, F, { tone: "hi", lit: true }),
    L(G.arcOf(F, 10, 9.3, P) + G.arcOf(F, 40, 8.3, P), { tone: "faint" }),
    disc(F, -1.4, 0, 6, { tone: "mid" }),
  ];
  out.push(moving("sled", sled.join("")));
  const track = [[0, 0], [0.15, 0], [0.4, 8], [0.7, 8], [0.9, 0]];
  const parts = [move("sled", [1, 0, 0], track), needle("thrust", { c: [58, 0, 27.2], plane: "z", r0: 1.4, r1: 6.6, track: track.map(([t, v]) => [t, v / 24]) })];
  const svg = figure({ label: "An engine nacelle on a sled riding two rails. When it fires it pushes the sled forward against a spring, and the gauge at the end reads the thrust.", body: out });
  return { svg, P, loop: 5, still: 0.5, parts };
}
