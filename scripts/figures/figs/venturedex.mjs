// VentureDex: a card index of startups. The drawer stands open on rows of company cards; one lit card rises,
// and its funding rounds grow on it as bars, round by round, beside a row of investor dots.
import * as k from "../kit/iso-kit.mjs";
import { studio, figure } from "../studio.mjs";

export default function venturedex() {
  const PLATE = { x: -70, y: -46, w: 140, d: 92, r: 6 };
  const s = studio([...k.boxCorners(PLATE, -11, 0), [-40, -30, 40], [40, 46, 30]], { azimuth: 50 });
  const { P, at, L, D, slab, bench, moving, move, fade } = s;
  const out = [bench(PLATE, { label: { x: 40, y: 26, w: 22, d: 11, r: 1 } })];
  // Cabinet: two drawers stacked; the lower one opens toward +y.
  const CAB = { x: -34, y: -34, w: 44, d: 50, r: 2 };
  // Built as a floor, two side walls and an upper case, so the open lower bay is truly empty.
  const WALL = 4;
  out.push(slab(CAB, 0, 3, { tone: "mid" }, 4, 0.4));
  out.push(slab({ x: CAB.x, y: CAB.y, w: CAB.w, d: WALL, r: 1 }, 3, 15, { tone: "mid" }, 3, 0.3));
  out.push(slab({ x: CAB.x, y: CAB.y + WALL, w: WALL, d: CAB.d - WALL, r: 1 }, 3, 15, { tone: "mid" }, 3, 0.3));
  out.push(slab({ x: CAB.x + CAB.w - WALL, y: CAB.y + WALL, w: WALL, d: CAB.d - WALL, r: 1 }, 3, 15, { tone: "mid" }, 3, 0.3));
  out.push(slab(CAB, 18, 18, { tone: "mid" }, 4, 0.6));
  out.push(slab({ x: CAB.x - 1, y: CAB.y - 1, w: CAB.w + 2, d: CAB.d + 2, r: 2.5 }, 36, 2, { tone: "mid" }, 4, 0.5));
  // Upper drawer front with pull and label holder.
  const fy = CAB.y + CAB.d;
  out.push(slab({ x: CAB.x + 4, y: fy, w: CAB.w - 8, d: 1.4, r: 0.4 }, 21, 13, { tone: "mid" }, 3, 0.3));
  out.push(slab({ x: -16, y: fy + 1.4, w: 8, d: 2, r: 0.6 }, 26, 2, { tone: "hi" }, 3, 0.3));
  // Lower drawer: box with cards, built closed, moves +y.
  const OPEN = 30;
  const DR = { x: CAB.x + 4, y: CAB.y + 4 + OPEN, w: CAB.w - 8, d: CAB.d - 3, r: 1 };
  const drawer = [slab({ ...DR, d: DR.d }, 3, 2, { tone: "mid" }, 3, 0.3)];
  drawer.push(slab({ x: DR.x, y: DR.y, w: 1.6, d: DR.d, r: 0.4 }, 5, 10, { tone: "mid" }, 3, 0.2));
  const cards = [];
  for (let i = 0; i < 9; i++) {
    const y = DR.y + 6 + i * 4.4;
    const lit = i === 5;
    // The lit company card carries its funding rounds as rising bars and a row of investor dots.
    const fy = y + 0.8, bx = DR.x + 7;
    const rounds = [3, 5, 7.5, 10].map((h, r) => moving(`round${r}`, L(k.segment([bx + r * 4.4, fy, 7], [bx + r * 4.4, fy, 7 + h], P), { tone: "lit", free: true, width: 1.6 })));
    cards.push(lit ? moving("card", slab({ x: DR.x + 3, y, w: DR.w - 6, d: 0.8, r: 0.2 }, 5, 14, { tone: "hi", lit: true }, 2, 0) +
      L(k.segment([bx - 2, fy, 7], [bx + 15.2, fy, 7], P), { tone: "mid", free: true }) + rounds.join("") +
      D([0, 1, 2].map((i) => at([bx + 20 + i * 2.4, fy, 16])), { size: 0.55, tone: "hi" }) +
      slab({ x: DR.x + 6, y, w: 8, d: 0.8, r: 0.2 }, 19, 3, { tone: "hi", lit: true }, 2, 0))
      : slab({ x: DR.x + 3, y, w: DR.w - 6, d: 0.8, r: 0.2 }, 5, 10, { tone: "hi" }, 2, 0) + (i % 3 === 0 ? slab({ x: DR.x + 4 + (i * 7) % 20, y, w: 7, d: 0.8, r: 0.2 }, 15, 2.4, { tone: "hi" }, 2, 0) : ""));
  }
  drawer.push(...cards);
  drawer.push(slab({ x: DR.x + DR.w - 1.6, y: DR.y, w: 1.6, d: DR.d, r: 0.4 }, 5, 10, { tone: "mid" }, 3, 0.2));
  drawer.push(slab({ x: CAB.x + 2, y: DR.y + DR.d, w: CAB.w - 4, d: 1.6, r: 0.4 }, 3, 15, { tone: "mid" }, 3, 0.3));
  drawer.push(D([at([CAB.x + 6, DR.y + DR.d + 1.6, 15]), at([CAB.x + CAB.w - 6, DR.y + DR.d + 1.6, 15])], { size: 0.4 }));
  drawer.push(slab({ x: -16, y: DR.y + DR.d + 1.6, w: 8, d: 2, r: 0.6 }, 9, 2, { tone: "hi" }, 3, 0.3));
  out.push(drawer.join(""));
  const parts = [
    move("card", [0, 0, 1], [[0, 0], [0.2, 0], [0.4, 9], [0.75, 9], [0.95, 0]]),
    ...[0, 1, 2, 3].map((r) => fade(`round${r}`, [[0, 0], [0.4 + r * 0.06, 0], [0.44 + r * 0.06, 1], [0.8, 1], [0.86, 0]])),
  ];
  const svg = figure({ label: "A card-index cabinet on a bench. The lower drawer stands open on rows of company cards, and one lit card rises out of the row; its funding rounds grow on it as bars, round by round, beside a row of investor dots, and it sinks back.", body: out });
  return { svg, P, loop: 5.4, still: 0.7, parts };
}
