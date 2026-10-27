// Raltic: an agent workflow room as a three-station line. A blank brief sheet sits under the agent,
// which writes its proof onto it line by line; the sheet slides under the press, the stamp marks it
// approved, and it slides on into the archive, where a lit index tab shows it is filed and searchable.
import * as k from "../kit/iso-kit.mjs";
import { studio, figure } from "../studio.mjs";

export default function raltic() {
  const PLATE = { x: -82, y: -38, w: 164, d: 76, r: 6 };
  const TOP = 46, AZ = 30;
  const s = studio([...k.boxCorners(PLATE, -11, 0), [0, -20, TOP + 8], [-47, -24, AZ + 6]], { azimuth: 40 });
  const { P, at, L, D, slab, cyl, bench, post, knob, moving, move, fade } = s;
  const out = [bench(PLATE, { label: { x: 52, y: 20, w: 22, d: 11, r: 1 } })];

  // Feed tray from the agent station through the press to the archive.
  out.push(slab({ x: -68, y: -12, w: 102, d: 26, r: 1.5 }, 0, 2, { tone: "mid" }, 4, 0.3));

  // Station 1, the agent: a column with an arm reaching over the sheet's start; its lens lights while it works.
  out.push(slab({ x: -56, y: -32, w: 18, d: 14, r: 2 }, 0, 3, { tone: "mid" }, 4, 0.5));
  out.push(post(-47, -25, 2.2, 3, AZ));
  out.push(slab({ x: -50, y: -28, w: 6, d: 30, r: 1.5 }, AZ, 4, { tone: "mid" }, 4, 0.5));
  out.push(slab({ x: -52, y: -4, w: 10, d: 10, r: 1.6 }, AZ - 7, 7, { tone: "mid" }, 4, 0.5));
  out.push(moving("agent", D([at([-49, 6, AZ - 3.5]), at([-45, 6, AZ - 3.5])], { size: 0.9, tone: "lit" })));
  out.push(cyl(-47, 1, 2.6, AZ - 9, 2, { tone: "hi", crease: "lo" }, 24));
  out.push(moving("agent", L(k.ring(-47, 1, 1.7, AZ - 9, P, 20), { tone: "lit" })));

  // Station 2, the press: posts, head and knob; the ram slides through the guide under the head.
  out.push(slab({ x: -20, y: -28, w: 40, d: 16, r: 2 }, 0, 4, { tone: "mid" }, 4, 0.5));
  out.push(post(-12, -22, 2.4, 4, TOP));
  out.push(post(12, -22, 2.4, 4, TOP));
  out.push(slab({ x: -16, y: -26, w: 32, d: 30, r: 2 }, TOP, 6, { tone: "mid" }, 4, 0.6));
  out.push(knob(0, -18, 3, TOP + 6, 3));

  // Station 3, the archive: an open-ended box with filed index cards standing at its back.
  const AR = { x: 34, y: -12, w: 28, d: 26, r: 2 };
  out.push(slab(AR, 0, 2, { tone: "mid" }, 4, 0.3));
  out.push(slab({ x: AR.x, y: AR.y, w: AR.w, d: 2, r: 0.6 }, 2, 9, { tone: "mid" }, 3, 0.3));
  for (let i = 0; i < 3; i++) out.push(slab({ x: AR.x + 4 + i * 6, y: AR.y + 2, w: 4, d: 1, r: 0.3 }, 2, 10 + (i % 2) * 2, { tone: "hi" }, 2, 0));
  out.push(moving("filed", slab({ x: AR.x + 22, y: AR.y + 2, w: 4, d: 1, r: 0.3 }, 2, 13, { tone: "hi", lit: true, name: "filed" }, 2, 0)));
  out.push(slab({ x: AR.x + AR.w - 2, y: AR.y + 2, w: 2, d: AR.d - 4, r: 0.6 }, 2, 6, { tone: "mid" }, 3, 0.3));
  out.push(slab({ x: AR.x, y: AR.y + AR.d - 2, w: AR.w, d: 2, r: 0.6 }, 2, 4, { tone: "mid" }, 3, 0.3));

  // The sheet: blank at first; the agent's proof lines appear on it, then the approval mark.
  const SH = { x: -58, y: -9, w: 22, d: 20, r: 0.6 };
  const sheet = [slab(SH, 2, 0.4, { tone: "hi", crease: "none" }, 3, 0)];
  for (let i = 0; i < 4; i++) sheet.push(moving(`proof${i}`, L(k.lineOnTop([SH.x + 3, SH.y + 4 + i * 3.4], [SH.x + 3 + (SH.w - 6) * [0.8, 0.6, 0.7, 0.4][i], SH.y + 4 + i * 3.4], 2.4, P), { tone: i === 0 ? "mid" : "lo", free: true })));
  sheet.push(moving("mark", L(k.ring(SH.x + SH.w / 2 + 4, SH.y + SH.d / 2 + 3, 4, 2.45, P, 32) + k.onTop([[SH.x + 11, SH.y + 13], [SH.x + 14.2, SH.y + 15.6], [SH.x + 17.83, SH.y + 10.17]], 2.45, P), { tone: "lit" })));
  out.push(moving("sheet", sheet.join("")));

  // The ram and stamp, drawn after the sheet; the guide block hides the rod's top.
  const ram = [cyl(0, 0, 1.8, 16, TOP - 16, { tone: "mid", crease: "none", name: "ram.rod" }, 16), slab({ x: -7, y: -7, w: 14, d: 14, r: 2 }, 8, 6, { tone: "hi", lit: true }, 4, 0.5), slab({ x: -8, y: -8, w: 16, d: 16, r: 2 }, 14, 2, { tone: "mid" }, 4, 0.3)];
  out.push(moving("ram", ram.join("")));
  out.push(slab({ x: -8, y: -24, w: 16, d: 30, r: 1.5 }, TOP - 6, 6, { tone: "mid", name: "guide" }, 4, 0.4));

  const parts = [
    fade("agent", [[0, 0], [0.04, 1], [0.2, 1], [0.23, 0]]),
    ...[0, 1, 2, 3].map((i) => fade(`proof${i}`, [[0, 0], [0.05 + i * 0.04, 0], [0.08 + i * 0.04, 1], [0.9, 1], [0.99, 0]])),
    move("sheet", [1, 0, 0], [[0, 0], [0.23, 0], [0.36, 47], [0.54, 47], [0.7, 94], [0.98, 94]]),
    fade("sheet", [[0, 0], [0.03, 1], [0.78, 1], [0.84, 0]]),
    move("ram", [0, 0, 1], [[0, 0], [0.38, 0], [0.44, -5.6], [0.5, 0]]),
    fade("mark", [[0, 0], [0.43, 0], [0.45, 1], [0.95, 1], [0.97, 0]]),
    fade("filed", [[0, 0], [0.8, 0], [0.86, 1], [0.95, 1], [0.99, 0]]),
  ];
  const svg = figure({
    label: "An agent workflow line on a bench. A blank brief sits under the agent, whose lens lights as it writes its proof onto the sheet line by line. The sheet slides under the press, the lit stamp marks it approved, and it moves on into the archive, where a lit index tab shows it is filed and searchable.",
    body: out,
  });
  return { svg, P, loop: 6.4, still: 0.46, parts, through: [["ram.rod", "guide"]] };
}
