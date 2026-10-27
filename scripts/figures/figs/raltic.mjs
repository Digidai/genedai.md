// Raltic: an approval stamp. An agent's proof sheet slides under a press; the stamp comes down and marks it approved.
import * as k from "../kit/iso-kit.mjs";
import { studio, figure } from "../studio.mjs";

export default function raltic() {
  const PLATE = { x: -76, y: -38, w: 152, d: 76, r: 6 };
  const TOP = 46;
  const s = studio([...k.boxCorners(PLATE, -11, 0), [0, -20, TOP + 8]], { azimuth: 40 });
  const { P, at, L, D, slab, cyl, bench, post, knob, moving, move, fade } = s;
  const out = [bench(PLATE, { label: { x: 44, y: 18, w: 22, d: 11, r: 1 } })];
  out.push(slab({ x: -20, y: -28, w: 40, d: 16, r: 2 }, 0, 4, { tone: "mid" }, 4, 0.5));
  out.push(post(-12, -22, 2.4, 4, TOP));
  out.push(post(12, -22, 2.4, 4, TOP));
  out.push(slab({ x: -16, y: -26, w: 32, d: 30, r: 2 }, TOP, 6, { tone: "mid" }, 4, 0.6));
  out.push(knob(0, -18, 3, TOP + 6, 3));
  // Feed tray and the sheet sliding in along x.
  out.push(slab({ x: -64, y: -12, w: 92, d: 26, r: 1.5 }, 0, 2, { tone: "mid" }, 4, 0.3));
  const SH = { x: -58, y: -9, w: 22, d: 20, r: 0.6 };
  const sheet = [slab(SH, 2, 0.4, { tone: "hi", crease: "none" }, 3, 0)];
  for (let i = 0; i < 4; i++) sheet.push(L(k.lineOnTop([SH.x + 3, SH.y + 4 + i * 3.4], [SH.x + 3 + (SH.w - 6) * [0.8, 0.6, 0.7, 0.4][i], SH.y + 4 + i * 3.4], 2.4, P), { tone: "lo", free: true }));
  sheet.push(moving("mark", L(k.ring(SH.x + SH.w / 2, SH.y + SH.d / 2, 5, 2.45, P, 32) + k.onTop([[SH.x + 8, SH.y + 10], [SH.x + 10.5, SH.y + 12.5], [SH.x + 14.5, SH.y + 7]], 2.45, P), { tone: "lit" })));
  out.push(moving("sheet", sheet.join("")));
  // Ram and stamp coming down over the sheet's stop position (x = 0).
  const ram = [cyl(0, 0, 1.8, 14, TOP - 14, { tone: "mid", crease: "none" }, 16), slab({ x: -7, y: -7, w: 14, d: 14, r: 2 }, 8, 6, { tone: "hi", lit: true }, 4, 0.5), slab({ x: -8, y: -8, w: 16, d: 16, r: 2 }, 14, 2, { tone: "mid" }, 4, 0.3)];
  out.push(slab({ x: -8, y: -24, w: 16, d: 30, r: 1.5 }, TOP - 6, 6, { tone: "mid" }, 4, 0.4));
  out.push(moving("ram", ram.join("")));
  const parts = [
    move("sheet", [1, 0, 0], [[0, 0], [0.25, 47], [0.75, 47], [0.95, 92]]),
    fade("sheet", [[0, 0], [0.05, 1], [0.88, 1], [0.95, 0]]),
    move("ram", [0, 0, 1], [[0, 0], [0.3, 0], [0.4, -5.6], [0.5, 0]]),
    fade("mark", [[0, 0], [0.4, 0], [0.42, 1], [0.95, 1], [0.97, 0]]),
  ];
  const svg = figure({ label: "A stamp press on a bench. A proof sheet slides in on a tray, the lit stamp comes down, and the sheet leaves marked approved with a check in a ring.", body: out });
  return { svg, P, loop: 4.6, still: 0.6, parts };
}
