// Dora Tech: a shared self-service printer. A phone sends the job (its screen lights up and the printer's
// QR panel answers), then the printed sheet slides out onto the output tray.
import * as k from "../kit/iso-kit.mjs";
import { studio, figure } from "../studio.mjs";

export default function dora() {
  const PLATE = { x: -66, y: -42, w: 132, d: 84, r: 6 };
  const BODY = { x: -34, y: -28, w: 52, d: 36, r: 3 };
  const BH = 26;
  const s = studio([...k.boxCorners(PLATE, -11, 0), [BODY.x, BODY.y, BH + 6]], { azimuth: 38 });
  const { P, at, L, D, slab, bench, owned, moving, fade, move } = s;
  const out = [bench(PLATE, { label: { x: 34, y: 24, w: 22, d: 11, r: 1 } })];
  const front = BODY.y + BODY.d;

  out.push(owned("printer", () => {
    const o = [];
    o.push(slab(BODY, 0, BH, { tone: "mid", name: "printer.body", inner: L(k.sideSeam(BODY, 9, P, 4), { tone: "faint" }) }, 4, 0.8));
    // Output slot: a closed slot outline on the front face.
    const slot = [[BODY.x + 8, front, 9.4], [BODY.x + BODY.w - 8, front, 9.4], [BODY.x + BODY.w - 8, front, 11], [BODY.x + 8, front, 11]];
    o.push(L(k.segment(slot[0], slot[1], P) + k.segment(slot[1], slot[2], P) + k.segment(slot[2], slot[3], P) + k.segment(slot[3], slot[0], P), { tone: "lo" }));
    const LID = k.insetPlan(BODY, 1.5);
    o.push(slab(LID, BH, 2, { tone: "mid", name: "printer.lid" }, 4, 0.5));
    // Paper feed at the back of the lid with a stack of blank sheets.
    const FEED = { x: BODY.x + 6, y: BODY.y + 2, w: 34, d: 12, r: 1 };
    o.push(slab(FEED, BH + 2, 1.2, { tone: "mid", name: "printer.feed" }, 3, 0.3));
    for (let i = 0; i < 3; i++) o.push(slab(k.insetPlan(FEED, 1.6), BH + 3.2 + i * 0.6, 0.6, { tone: "hi", crease: "none", name: "printer.paper" }, 3, 0));
    // QR panel on the lid, at the front right.
    const PANEL = { x: BODY.x + BODY.w - 18, y: front - 15, w: 14, d: 11, r: 1 };
    o.push(slab(PANEL, BH + 2, 0.8, { tone: "lo", name: "printer.panel" }, 3, 0.2));
    const qr = [];
    for (let r = 0; r < 5; r++) for (let c = 0; c < 5; c++) if ((r * 7 + c * 3 + r * c) % 3 !== 1) qr.push(at([PANEL.x + 2.2 + c * 1.6, PANEL.y + 2.2 + r * 1.6, BH + 2.8]));
    o.push(D(qr, { size: 0.42, tone: "mid" }));
    o.push(slab({ x: BODY.x + 6, y: front, w: BODY.w - 12, d: 20, r: 1.2 }, 6, 1.2, { tone: "mid", name: "printer.tray" }, 3, 0.3));
    return o.join("");
  }));

  // The printed sheet, lit, on the tray.
  const SHEET = { x: BODY.x + 9, y: front + 1, w: BODY.w - 18, d: 15, r: 0.4 };
  const lines = [0.8, 0.55, 0.7, 0.4].map((share, i) => L(k.lineOnTop([SHEET.x + 3, SHEET.y + 3 + i * 3], [SHEET.x + 3 + (SHEET.w - 6) * share, SHEET.y + 3 + i * 3], 7.6, P), { tone: "mid", free: true })).join("");
  out.push(moving("sheet", slab(SHEET, 7.2, 0.4, { tone: "hi", lit: true, crease: "none", name: "sheet" }, 3, 0) + lines));

  // The phone that sends the job.
  const PHONE = { x: 30, y: -24, w: 12, d: 22, r: 2 };
  out.push(owned("phone", () => slab(PHONE, 0, 1.6, { tone: "mid", name: "phone.body" }, 6, 0.4) + L(k.planOutline(k.insetPlan(PHONE, 1.4), 1.6, P, 4), { tone: "lo" })));
  out.push(moving("screen", slab(k.insetPlan(PHONE, 1.6), 1.6, 0.2, { tone: "hi", lit: true, crease: "none", name: "phone.screen" }, 4, 0)));

  const parts = [
    fade("screen", [[0, 0], [0.04, 1], [0.24, 1], [0.3, 0]]),
    fade("sheet", [[0, 0], [0.3, 0], [0.36, 1], [0.9, 1], [0.96, 0]]),
    move("sheet", [0, 1, 0], [[0, 0], [0.3, 0], [0.55, 3], [0.97, 3]]),
  ];
  const svg = figure({
    label: "A shared self-service printer on a bench, with a phone beside it. The phone's screen lights up as it sends a job, then a printed sheet slides out of the slot onto the output tray.",
    body: out,
  });
  return { svg, P, loop: 5, still: 0.6, parts };
}
