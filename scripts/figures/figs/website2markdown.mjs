// Website2Markdown: a page goes through a pair of rollers and comes out as plain Markdown lines.
import * as k from "../kit/iso-kit.mjs";
import { studio, figure } from "../studio.mjs";

export default function website2markdown() {
  const PLATE = { x: -90, y: -34, w: 180, d: 68, r: 6 };
  const s = studio([...k.boxCorners(PLATE, -11, 0), [0, -20, 30]], { azimuth: 40 });
  const { G, P, at, S, L, D, slab, bench, post, knob, moving, move, fade } = s;
  const out = [bench(PLATE, { label: { x: -80, y: 18, w: 22, d: 11, r: 1 } })];
  const BED = { x: -78, y: -14, w: 156, d: 24, r: 1.5 };
  out.push(slab(BED, 0, 3, { tone: "mid" }, 4, 0.4));
  // Rolling mill in the middle: two side frames and two rollers along y.
  for (const y of [-20, 12]) out.push(slab({ x: -8, y, w: 16, d: 6, r: 1.5 }, 0, 26, { tone: "mid" }, 4, 0.5));
  const roll = (z) => S(G.disc(0, 32, 4.2, G.frameAlong([0, -18, z], [0, 1, 0]), P), { tone: "hi", crease: "lo" });
  out.push(roll(8.6));
  // Web page coming in (x < 0): card with a header bar, image box and text blocks.
  const PG = { x: -70, y: -10, w: 22, d: 16, r: 0.6 };
  const page = [slab(PG, 3, 0.5, { tone: "hi", crease: "none" }, 3, 0), slab({ x: PG.x + 1.5, y: PG.y + 1.5, w: PG.w - 3, d: 3, r: 0.3 }, 3.5, 0.6, { tone: "mid" }, 3, 0), slab({ x: PG.x + 1.5, y: PG.y + 6, w: 8, d: 8, r: 0.3 }, 3.5, 1.2, { tone: "mid" }, 3, 0)];
  for (let i = 0; i < 3; i++) page.push(L(k.lineOnTop([PG.x + 12, PG.y + 7 + i * 3], [PG.x + PG.w - 2, PG.y + 7 + i * 3], 3.6, P), { tone: "lo", free: true }));
  out.push(moving("page", page.join("")));
  // Markdown sheet going out (x > 0): "#" heading mark and plain lines.
  const MD = { x: 14, y: -10, w: 22, d: 16, r: 0.6 };
  const md = [slab(MD, 3, 0.5, { tone: "hi", lit: true, crease: "none" }, 3, 0)];
  md.push(L(k.onTop([[MD.x + 2.4, MD.y + 2.4], [MD.x + 2.4, MD.y + 5]], 3.6, P) + k.onTop([[MD.x + 3.6, MD.y + 2.4], [MD.x + 3.6, MD.y + 5]], 3.6, P) + k.onTop([[MD.x + 1.8, MD.y + 3.2], [MD.x + 4.4, MD.y + 3.2]], 3.6, P) + k.onTop([[MD.x + 1.8, MD.y + 4.2], [MD.x + 4.4, MD.y + 4.2]], 3.6, P), { tone: "lit", free: true }));
  md.push(L(k.lineOnTop([MD.x + 6, MD.y + 3.7], [MD.x + 16, MD.y + 3.7], 3.6, P), { tone: "lit", free: true }));
  for (let i = 0; i < 4; i++) md.push(L(k.lineOnTop([MD.x + 2.4, MD.y + 7.5 + i * 2.2], [MD.x + 2.4 + (MD.w - 5) * [0.9, 0.7, 0.85, 0.5][i], MD.y + 7.5 + i * 2.2], 3.6, P), { tone: "mid", free: true }));
  out.push(moving("md", md.join("")));
  out.push(roll(16.6));
  out.push(slab({ x: -8, y: -20, w: 16, d: 38, r: 1.5 }, 22, 4, { tone: "mid" }, 4, 0.5));
  out.push(knob(0, 22, 3, 14, 3));
  out.push(post(0, 18.5, 1.2, 12, 15, { collar: false, cap: false }));
  void D; void at;
  const parts = [
    move("page", [1, 0, 0], [[0, 0], [0.45, 48]], { linear: true }),
    fade("page", [[0, 0], [0.06, 1], [0.38, 1], [0.45, 0], [0.99, 0]]),
    move("md", [1, 0, 0], [[0, -10], [0.45, -10], [0.95, 38]], { linear: true }),
    fade("md", [[0, 0], [0.45, 0], [0.5, 1], [0.88, 1], [0.95, 0]]),
  ];
  const svg = figure({ label: "A small rolling mill on a bench. A web page with a header, an image and text feeds into the rollers, and a plain Markdown sheet with a heading mark and lines of text comes out the other side.", body: out });
  return { svg, P, loop: 5, still: 0.7, parts };
}
