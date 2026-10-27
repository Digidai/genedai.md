// ModernCV: a template press. One of four resume templates is picked; the platen closes on a sheet
// and prints that layout; the sheet slides out.
import * as k from "../kit/iso-kit.mjs";
import { studio, figure } from "../studio.mjs";

export default function moderncv() {
  const PLATE = { x: -70, y: -42, w: 140, d: 84, r: 6 };
  const TOP = 40;
  const s = studio([...k.boxCorners(PLATE, -11, 0), [0, -24, TOP + 10]], { azimuth: 42 });
  const { P, L, slab, cyl, bench, post, knob, moving, move, fade } = s;
  const out = [bench(PLATE, { label: { x: 40, y: 22, w: 22, d: 11, r: 1 } })];
  // A tall bed so the platen's stroke is short; it runs on a screw that slides inside the crosshead.
  const BT = 18, GAP = 4;
  out.push(slab({ x: -24, y: -30, w: 48, d: 70, r: 2 }, 0, BT, { tone: "mid" }, 4, 0.6));
  for (const x of [-20, 20]) out.push(post(x, -24, 2.4, BT, TOP));
  // Template tray at the right: four layouts; the selected one (photo and lines, lit) is what gets printed.
  const TR = { x: 30, y: -30, w: 34, d: 44, r: 2 };
  out.push(slab(TR, 0, 3, { tone: "mid" }, 4, 0.5));
  const tile = (c, r) => ({ x: TR.x + 2 + c * 16, y: TR.y + 2 + r * 21, w: 14, d: 19, r: 0.5 });
  const TZ = 3.6, row = (t, y, a, b) => k.lineOnTop([t.x + a, t.y + y], [t.x + b, t.y + y], TZ, P);
  const layouts = [
    (t) => [row(t, 3, 2, 12), row(t, 6, 4, 10)].concat([9, 11.5, 14, 16.5].map((y) => row(t, y, 2, 12))),          // centred header
    (t) => [k.lineOnTop([t.x + 4.6, t.y + 1.5], [t.x + 4.6, t.y + t.d - 1.5], TZ, P)].concat([3, 6, 9, 12, 15].map((y) => row(t, y, 6.2, 12))), // sidebar
    (t) => [k.planOutline({ x: t.x + 1.6, y: t.y + 1.6, w: 4, d: 4, r: 2 }, TZ, P, 6), row(t, 2.6, 7, 12), row(t, 4.6, 7, 10.4)].concat([8.4, 10.6, 12.8, 15, 17.2].map((y, i) => row(t, y, 1.6, i % 2 ? 9 : 12))), // photo
    (t) => [3, 5.6, 8.2, 10.8, 13.4, 16].flatMap((y) => [row(t, y, 1.6, 6.2), row(t, y, 7.8, 12.4)]),             // two columns
  ];
  [[0, 0], [1, 0], [0, 1], [1, 1]].forEach(([c, r], i) => {
    const t = tile(c, r), lit = i === 2;
    out.push(slab(t, 3, 0.6, lit ? { tone: "hi", lit: true, crease: "none" } : { tone: "hi", crease: "none" }, 3, 0));
    out.push(L(layouts[i](t).join(""), { tone: lit ? "mid" : "lo", free: true }));
    if (lit) out.push(moving("pick", L(k.planOutline({ x: t.x - 0.8, y: t.y - 0.8, w: t.w + 1.6, d: t.d + 1.6, r: 1 }, 3, P), { tone: "lit" })));
  });

  // Sheet on the bed: a resume being printed.
  const SH = { x: -12, y: -14, w: 24, d: 26, r: 0.4 };
  const SZ = BT + 0.4, IZ = BT + 0.45;
  const sheet = [slab(SH, BT, 0.4, { tone: "hi", crease: "none" }, 3, 0)];
  const ink = [L(k.planOutline({ x: SH.x + 2, y: SH.y + 2.4, w: 5, d: 5, r: 2.5 }, IZ, P, 6), { tone: "lit" })];
  ink.push(L(k.lineOnTop([SH.x + 9, SH.y + 3.4], [SH.x + 20, SH.y + 3.4], IZ, P) + k.lineOnTop([SH.x + 9, SH.y + 5.6], [SH.x + 16, SH.y + 5.6], IZ, P), { tone: "lit", free: true }));
  for (let i = 0; i < 6; i++) ink.push(L(k.lineOnTop([SH.x + 2, SH.y + 10 + i * 2.6], [SH.x + 2 + (SH.w - 4) * [0.5, 0.9, 0.8, 0.5, 0.9, 0.7][i], SH.y + 10 + i * 2.6], IZ, P), { tone: i % 3 === 0 ? "hi" : "mid", free: true }));
  sheet.push(moving("ink", ink.join("")));
  out.push(moving("sheet", sheet.join("")));
  // Platen with a back arm carrying the screw; the screw is drawn before the crosshead, which hides its top.
  const PZ = SZ + GAP;
  out.push(moving("platen", cyl(0, -22, 1.8, PZ + 5, TOP + 5 - (PZ + 5), { tone: "mid", crease: "none", name: "screw" }, 16)));
  out.push(slab({ x: -24, y: -28, w: 48, d: 8, r: 2 }, TOP, 5, { tone: "mid", name: "crosshead" }, 4, 0.5));
  out.push(knob(0, -24, 3, TOP + 5, 3));
  out.push(moving("platen", slab({ x: -16, y: -18, w: 32, d: 32, r: 2 }, PZ, 5, { tone: "hi", lit: true }, 4, 0.6) + slab({ x: -4, y: -26, w: 8, d: 8, r: 1.2 }, PZ, 5, { tone: "mid" }, 4, 0.4)));
  const parts = [
    move("platen", [0, 0, 1], [[0, 0], [0.18, 0], [0.3, -GAP], [0.4, -GAP], [0.52, 0]]),
    fade("ink", [[0, 0], [0.32, 0], [0.36, 1], [0.95, 1], [0.97, 0]]),
    fade("pick", [[0, 0], [0.04, 0], [0.1, 1], [0.92, 1], [0.97, 0]]),
    move("sheet", [0, 1, 0], [[0, 0], [0.55, 0], [0.85, 24], [0.9, 24], [0.92, 0]]),
    fade("sheet", [[0, 1], [0.84, 1], [0.9, 0], [0.93, 0], [0.98, 1]]),
  ];
  const svg = figure({ label: "A small letterpress on a bench beside a tray of four resume templates. One template, with a photo and lines, is picked and outlined; the lit platen comes down on a blank sheet, lifts to show a printed resume layout with a photo circle, a name and sections, and the sheet slides out.", body: out });
  return { svg, P, loop: 5.2, still: 0.6, parts, through: [["screw", "crosshead"]], hidden: [["screw", "crosshead"]] };
}
