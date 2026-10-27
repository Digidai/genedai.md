// VentureDex: a card index. A long drawer of company cards; the drawer slides open and one lit card rises.
import * as k from "../kit/iso-kit.mjs";
import { studio, figure } from "../studio.mjs";

export default function venturedex() {
  const PLATE = { x: -70, y: -46, w: 140, d: 92, r: 6 };
  const s = studio([...k.boxCorners(PLATE, -11, 0), [-40, -30, 40], [40, 46, 30]], { azimuth: 50 });
  const { P, at, L, D, slab, bench, moving, move } = s;
  const out = [bench(PLATE, { label: { x: 40, y: 26, w: 22, d: 11, r: 1 } })];
  // Cabinet: two drawers stacked; the lower one opens toward +y.
  const CAB = { x: -34, y: -34, w: 44, d: 50, r: 2 };
  out.push(slab(CAB, 0, 36, { tone: "mid", inner: L(k.sideSeam(CAB, 18, P, 4), { tone: "faint" }) }, 4, 0.6));
  out.push(slab({ x: CAB.x - 1, y: CAB.y - 1, w: CAB.w + 2, d: CAB.d + 2, r: 2.5 }, 36, 2, { tone: "mid" }, 4, 0.5));
  // Upper drawer front with pull and label holder.
  const fy = CAB.y + CAB.d;
  out.push(slab({ x: CAB.x + 4, y: fy, w: CAB.w - 8, d: 1.4, r: 0.4 }, 21, 13, { tone: "mid" }, 3, 0.3));
  out.push(slab({ x: -16, y: fy + 1.4, w: 8, d: 2, r: 0.6 }, 26, 2, { tone: "hi" }, 3, 0.3));
  // Lower drawer: box with cards, built closed, moves +y.
  const DR = { x: CAB.x + 4, y: CAB.y + 4, w: CAB.w - 8, d: CAB.d - 3, r: 1 };
  const drawer = [slab({ ...DR, d: DR.d }, 3, 2, { tone: "mid" }, 3, 0.3)];
  drawer.push(slab({ x: DR.x, y: DR.y, w: 1.6, d: DR.d, r: 0.4 }, 5, 10, { tone: "mid" }, 3, 0.2));
  const cards = [];
  for (let i = 0; i < 9; i++) {
    const y = DR.y + 6 + i * 4.4;
    const lit = i === 5;
    cards.push(lit ? moving("card", slab({ x: DR.x + 3, y, w: DR.w - 6, d: 0.8, r: 0.2 }, 5, 14, { tone: "hi", lit: true }, 2, 0) + slab({ x: DR.x + 6, y, w: 8, d: 0.8, r: 0.2 }, 19, 3, { tone: "hi", lit: true }, 2, 0))
      : slab({ x: DR.x + 3, y, w: DR.w - 6, d: 0.8, r: 0.2 }, 5, 12, { tone: "hi" }, 2, 0) + (i % 3 === 0 ? slab({ x: DR.x + 4 + (i * 7) % 20, y, w: 7, d: 0.8, r: 0.2 }, 17, 2.4, { tone: "hi" }, 2, 0) : ""));
  }
  drawer.push(...cards);
  drawer.push(slab({ x: DR.x + DR.w - 1.6, y: DR.y, w: 1.6, d: DR.d, r: 0.4 }, 5, 10, { tone: "mid" }, 3, 0.2));
  drawer.push(slab({ x: CAB.x + 2, y: DR.y + DR.d, w: CAB.w - 4, d: 1.6, r: 0.4 }, 3, 15, { tone: "mid" }, 3, 0.3));
  drawer.push(slab({ x: -16, y: DR.y + DR.d + 1.6, w: 8, d: 2, r: 0.6 }, 9, 2, { tone: "hi" }, 3, 0.3));
  drawer.push(D([at([CAB.x + 6, DR.y + DR.d + 1.6, 15]), at([CAB.x + CAB.w - 6, DR.y + DR.d + 1.6, 15])], { size: 0.4 }));
  out.push(moving("drawer", drawer.join("")));
  const parts = [
    move("drawer", [0, 1, 0], [[0, 0], [0.12, 0], [0.38, 30], [0.85, 30]]),
    move("card", [0, 0, 1], [[0, 0], [0.38, 0], [0.5, 9], [0.72, 9], [0.82, 0]]),
  ];
  const svg = figure({ label: "A card-index cabinet on a bench. The lower drawer slides open to show rows of company cards, and one lit card rises out of the row.", body: out });
  return { svg, P, loop: 5.4, still: 0.6, parts };
}
