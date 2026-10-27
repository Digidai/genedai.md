// ModernCV: a letterpress. The platen closes on a sheet and prints a resume layout; the sheet slides out.
import * as k from "../kit/iso-kit.mjs";
import { studio, figure } from "../studio.mjs";

export default function moderncv() {
  const PLATE = { x: -70, y: -42, w: 140, d: 84, r: 6 };
  const TOP = 40;
  const s = studio([...k.boxCorners(PLATE, -11, 0), [0, -24, TOP + 10]], { azimuth: 42 });
  const { P, L, slab, cyl, bench, post, knob, moving, move, fade } = s;
  const out = [bench(PLATE, { label: { x: 38, y: 22, w: 22, d: 11, r: 1 } })];
  out.push(slab({ x: -24, y: -30, w: 48, d: 46, r: 2 }, 0, 5, { tone: "mid" }, 4, 0.6));
  for (const x of [-20, 20]) out.push(post(x, -24, 2.4, 5, TOP));
  out.push(slab({ x: -24, y: -28, w: 48, d: 8, r: 2 }, TOP, 5, { tone: "mid" }, 4, 0.5));
  out.push(knob(0, -24, 3, TOP + 5, 3));
  // Sheet on the bed: a resume being printed.
  const SH = { x: -12, y: -14, w: 24, d: 26, r: 0.4 };
  const sheet = [slab(SH, 5, 0.4, { tone: "hi", crease: "none" }, 3, 0)];
  const ink = [L(k.planOutline({ x: SH.x + 2, y: SH.y + 2.4, w: 5, d: 5, r: 2.5 }, 5.45, P, 6), { tone: "lit" })];
  ink.push(L(k.lineOnTop([SH.x + 9, SH.y + 3.4], [SH.x + 20, SH.y + 3.4], 5.45, P) + k.lineOnTop([SH.x + 9, SH.y + 5.6], [SH.x + 16, SH.y + 5.6], 5.45, P), { tone: "lit", free: true }));
  for (let i = 0; i < 6; i++) ink.push(L(k.lineOnTop([SH.x + 2, SH.y + 10 + i * 2.6], [SH.x + 2 + (SH.w - 4) * [0.5, 0.9, 0.8, 0.5, 0.9, 0.7][i], SH.y + 10 + i * 2.6], 5.45, P), { tone: i % 3 === 0 ? "hi" : "mid", free: true }));
  sheet.push(moving("ink", ink.join("")));
  out.push(moving("sheet", sheet.join("")));
  // Platen on two guide sleeves coming down.
  const platen = [cyl(-20, -24, 3.6, 22, 6, { tone: "mid" }, 20), cyl(20, -24, 3.6, 22, 6, { tone: "mid" }, 20), slab({ x: -16, y: -18, w: 32, d: 32, r: 2 }, 22, 5, { tone: "hi", lit: true }, 4, 0.6), slab({ x: -22, y: -27, w: 44, d: 9, r: 1.5 }, 24, 4, { tone: "mid" }, 4, 0.4)];
  out.push(moving("platen", platen.join("")));
  const parts = [
    move("platen", [0, 0, 1], [[0, 0], [0.18, 0], [0.3, -16.4], [0.4, -16.4], [0.52, 0]]),
    fade("ink", [[0, 0], [0.32, 0], [0.36, 1], [0.95, 1], [0.97, 0]]),
    move("sheet", [0, 1, 0], [[0, 0], [0.55, 0], [0.85, 28], [0.9, 28], [0.92, 0]]),
    fade("sheet", [[0, 1], [0.84, 1], [0.9, 0], [0.93, 0], [0.98, 1]]),
  ];
  const svg = figure({ label: "A small letterpress on a bench. The lit platen comes down on a blank sheet, lifts to show a printed resume layout with a photo circle, a name and sections, and the sheet slides out.", body: out });
  return { svg, P, loop: 5.2, still: 0.6, parts };
}
