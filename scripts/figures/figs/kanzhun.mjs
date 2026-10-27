// Kanzhun.com: a review ballot. Employees' review cards drop through the slot of a ballot box;
// the tally dial beside it advances with every card that lands.
import * as k from "../kit/iso-kit.mjs";
import { studio, figure } from "../studio.mjs";

export default function kanzhun() {
  const PLATE = { x: -84, y: -40, w: 168, d: 80, r: 6 };
  const BOX = { x: -36, y: -24, w: 44, d: 40, r: 3 };
  const BH = 30;
  const s = studio([...k.boxCorners(PLATE, -11, 0), [BOX.x, BOX.y, BH + 34]], { azimuth: 40 });
  const { P, at, L, D, slab, bench, post, dial, moving, move, fade, needle, needleSvg, cyl } = s;

  const out = [bench(PLATE)];
  // A stack of sealed reviews waiting at the back.
  for (let i = 0; i < 5; i++) out.push(slab({ x: 22 + i * 0.6, y: -37, w: 18, d: 12, r: 1 }, i * 1.4, 1.2, { tone: i === 4 ? "hi" : "mid" }, 3, 0.2));
  // Ballot box: body, lid with lip, slot, hinge pins, seam.
  out.push(slab(BOX, 0, BH, { tone: "mid", inner: L(k.sideSeam(BOX, 6, P, 4), { tone: "faint" }) }, 4, 0.8));
  const LID = { x: BOX.x - 1.5, y: BOX.y - 1.5, w: BOX.w + 3, d: BOX.d + 3, r: 3.5 };
  out.push(slab(LID, BH, 3, { tone: "mid" }, 4, 0.6));
  const SLOT = { x: BOX.x + BOX.w / 2 - 1.4, y: BOX.y + 8, w: 2.8, d: 24, r: 1.2 };
  out.push(slab(SLOT, BH + 3, 0.2, { tone: "lo", crease: "none" }, 3, 0));
  out.push(L(k.planOutline(k.insetPlan(LID, 3), BH + 3, P), { tone: "faint" }));
  out.push(D(k.corners(LID, 3).map(([x, y]) => at([x, y, BH + 3])), { size: 0.45 }));
  // Card above the slot (drawn after the box), sliding down into it.
  const cardPlan = { x: SLOT.x + 0.6, y: SLOT.y + 2, w: 1.4, d: 20, r: 0.3 };
  const DROP = 18;
  const card = moving("card", slab(cardPlan, BH + 4, 16, { tone: "hi", lit: true }, 2, 0) +
    [0.3, 0.55, 0.8].map((t) => L(k.segment([cardPlan.x + 1.4, cardPlan.y + 3, BH + 4 + 16 * t], [cardPlan.x + 1.4, cardPlan.y + 3 + 12 * (t === 0.55 ? 0.6 : 0.9), BH + 4 + 16 * t], P), { tone: "lo", free: true })).join(""));
  // Clip the card at the line of the slot so it disappears into the box.
  const cx = SLOT.x + SLOT.w / 2;
  const A = k.iso([cx, SLOT.y - 6, BH + 3], P), B = k.iso([cx, SLOT.y + SLOT.d + 6, BH + 3], P);
  const v = [B[0] - A[0], B[1] - A[1]];
  const f = (p) => p.map((n) => n.toFixed(1)).join(" ");
  out.push(`<clipPath id="kz-slot"><path d="M${f([A[0] - v[0] * 9, A[1] - v[1] * 9])}L${f([B[0] + v[0] * 9, B[1] + v[1] * 9])}L${f([B[0] + v[0] * 9, -600])}L${f([A[0] - v[0] * 9, -600])}Z"/></clipPath>`);
  out.push(`<g clip-path="url(#kz-slot)">${card}</g>`);
  // Tally dial on a pedestal at the front right.
  out.push(post(44, 14, 3, 0, 12));
  out.push(dial(44, 14, 11, 12, 4, { ticks: 50, every: 10 }));
  out.push(needleSvg("tally"));
  out.push(cyl(44, 14, 1.3, 16, 0.6, { tone: "mid" }, 14));

  const parts = [
    move("card", [0, 0, -1], [[0, 0], [0.15, 0], [0.5, DROP], [0.98, DROP]]),
    fade("card", [[0, 0], [0.12, 1], [0.5, 1], [0.52, 0], [0.97, 0]]),
    needle("tally", { c: [44, 14, 16.2], plane: "z", r0: 2, r1: 8.6, track: [[0, 0.1], [0.5, 0.1], [0.62, 0.3], [0.9, 0.3], [0.99, 0.1]] }),
  ];
  const svg = figure({
    label: "A ballot box on a bench with a stack of review cards behind it. A lit review card slides down through the slot in the lid, and the tally dial beside the box advances when it lands.",
    body: out,
  });
  return { svg, P, loop: 4.8, still: 0.3, parts };
}
