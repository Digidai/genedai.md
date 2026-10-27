// Kanzhun.com: a review ballot. Employees' review cards drop through the slot of a ballot box;
// when one lands, the company panel beside it updates its star rating and adds a salary bar.
import * as k from "../kit/iso-kit.mjs";
import { studio, figure } from "../studio.mjs";

export default function kanzhun() {
  const PLATE = { x: -84, y: -40, w: 168, d: 80, r: 6 };
  const BOX = { x: -36, y: -24, w: 44, d: 40, r: 3 };
  const BH = 30;
  const s = studio([...k.boxCorners(PLATE, -11, 0), [BOX.x, BOX.y, BH + 34]], { azimuth: 40 });
  const { P, at, L, D, slab, bench, post, moving, move, fade } = s;

  const out = [bench(PLATE)];
  // A stack of sealed reviews waiting at the back.
  for (let i = 0; i < 5; i++) out.push(slab({ x: 22 + i * 0.6, y: -37, w: 18, d: 12, r: 1 }, i * 1.2, 1.2, { tone: i === 4 ? "hi" : "mid" }, 3, 0.2));
  // Ballot box: body, lid with lip, slot, hinge pins, seam.
  out.push(slab(BOX, 0, BH, { tone: "mid", name: "box", inner: L(k.sideSeam(BOX, 6, P, 4), { tone: "faint" }) }, 4, 0.8));
  const LID = { x: BOX.x - 1.5, y: BOX.y - 1.5, w: BOX.w + 3, d: BOX.d + 3, r: 3.5 };
  out.push(slab(LID, BH, 3, { tone: "mid", name: "lid" }, 4, 0.6));
  const SLOT = { x: BOX.x + BOX.w / 2 - 1.4, y: BOX.y + 8, w: 2.8, d: 24, r: 1.2 };
  out.push(L(k.planOutline(k.insetPlan(LID, 3), BH + 3, P), { tone: "faint" }));
  out.push(D(k.corners(LID, 3).map(([x, y]) => at([x, y, BH + 3])), { size: 0.45 }));
  out.push(slab(SLOT, BH + 3, 0.2, { tone: "lo", crease: "none", name: "slot" }, 3, 0));
  // Card standing in the slot (drawn after the box), sliding down into it.
  const cardPlan = { x: SLOT.x + 0.6, y: SLOT.y + 2, w: 1.4, d: 20, r: 0.3 };
  const DROP = 18;
  const card = moving("card", slab(cardPlan, BH + 3.2, 16, { tone: "hi", lit: true, name: "card" }, 2, 0) +
    [0.3, 0.55, 0.8].map((t) => L(k.segment([cardPlan.x + 1.4, cardPlan.y + 3, BH + 3.2 + 16 * t], [cardPlan.x + 1.4, cardPlan.y + 3 + 12 * (t === 0.55 ? 0.6 : 0.9), BH + 3.2 + 16 * t], P), { tone: "lo", free: true })).join(""), { clip: "kz-slot" });
  // Clip the card at the line of the slot so it disappears into the box.
  const cx = SLOT.x + SLOT.w / 2;
  const A = k.iso([cx, SLOT.y - 6, BH + 3], P), B = k.iso([cx, SLOT.y + SLOT.d + 6, BH + 3], P);
  const v = [B[0] - A[0], B[1] - A[1]];
  const f = (p) => p.map((n) => n.toFixed(1)).join(" ");
  out.push(`<clipPath id="kz-slot"><path d="M${f([A[0] - v[0] * 9, A[1] - v[1] * 9])}L${f([B[0] + v[0] * 9, B[1] + v[1] * 9])}L${f([B[0] + v[0] * 9, -600])}L${f([A[0] - v[0] * 9, -600])}Z"/></clipPath>`);
  out.push(card);
  // Company profile panel beside the box: a star rating and salary bars on its front face.
  out.push(slab({ x: 28, y: 4, w: 30, d: 14, r: 2 }, 0, 3, { tone: "mid" }, 4, 0.5));
  out.push(post(43, 9, 2, 3, 12, { cap: false }));
  const PANEL = { x: 24, y: 7, w: 38, d: 4, r: 1 };
  out.push(slab(PANEL, 12, 26, { tone: "mid" }, 3, 0.4));
  const fy = PANEL.y + PANEL.d;
  const star = (cx, cz, r) => {
    const pts = [];
    for (let i = 0; i <= 10; i++) {
      const a = (i * Math.PI) / 5, rr = i % 2 ? r * 0.45 : r;
      pts.push([cx + Math.sin(a) * rr, fy, cz + Math.cos(a) * rr]);
    }
    return pts.slice(1).map((p, i) => k.segment(pts[i], p, P)).join("");
  };
  const SX = (i) => PANEL.x + 6 + i * 6.4, SZ = 32.5;
  out.push(L([0, 1, 2, 3].map((i) => star(SX(i), SZ, 2.4)).join(""), { tone: "lit" }));
  out.push(L(star(SX(4), SZ, 2.4), { tone: "faint" }));
  out.push(moving("star", L(star(SX(4), SZ, 2.4), { tone: "lit" })));
  // Salary bars, one per report; a new one appears when a review lands.
  const bar = (i, share) => k.segment([PANEL.x + 4, fy, 25 - i * 3.6], [PANEL.x + 4 + (PANEL.w - 8) * share, fy, 25 - i * 3.6], P);
  out.push(L(bar(0, 0.7) + bar(1, 0.9) + bar(2, 0.55), { tone: "hi", free: true }));
  out.push(moving("salary", L(bar(3, 0.8), { tone: "lit", free: true })));

  const parts = [
    move("card", [0, 0, -1], [[0, 0], [0.15, 0], [0.5, DROP], [0.98, DROP]]),
    fade("card", [[0, 0], [0.12, 1], [0.5, 1], [0.52, 0], [0.97, 0]]),
    fade("star", [[0, 0], [0.52, 0], [0.58, 1], [0.92, 1], [0.97, 0]]),
    fade("salary", [[0, 0], [0.56, 0], [0.62, 1], [0.92, 1], [0.97, 0]]),
  ];
  const svg = figure({
    label: "A ballot box on a bench with a stack of review cards behind it. A lit review card slides down through the slot in the lid. When it lands, the company panel beside the box updates: its star rating fills to five and a new salary bar appears.",
    body: out,
  });
  // The card genuinely passes through the slot; the clip hides the part inside the box.
  const pass = [["card", "box"], ["card", "lid"], ["card", "slot"]];
  return { svg, P, loop: 4.8, still: 0.3, parts, through: pass, hidden: pass };
}
