// Metix AI: a shortlist sorter. Candidate pucks leave the hopper on a belt and pass
// under a gauge gate; the probe rises onto each puck and the dial reads its fit.
// The one lit puck reads past the mark and joins the shortlist tray.
import { studio, figure } from "../studio.mjs";

export default function metix() {
  const PLATE = { x: -104, y: -40, w: 208, d: 80, r: 6 };
  const s = studio([[-104, -40, -11], [104, 40, -11], [-104, 40, 0], [104, -40, 0], [0, 0, 48], [-82, -16, 34]], { azimuth: 38 });
  const { k, G, P, at, L, D, slab, cyl, bench, post, dial, moving, move, fade, needle, needleSvg, disc } = s;

  const BELT = { x: -66, y: -9.5, w: 124, d: 19, r: 2 };
  const BELT_TOP = 10;
  const PUCK_R = 6, PUCK_H = 5;
  const X0 = -56, X1 = 52;
  const GATE = 0;
  const POST_Y = 17, BAR_Z = 36;
  const PROBE_REST = BELT_TOP + 3, PROBE_UP = BELT_TOP + PUCK_H + 0.3;

  const back = [], front = [];
  back.push(bench(PLATE, { label: { x: 66, y: 14, w: 26, d: 14, r: 1 } }));

  // Shortlist tray at the right end: floor, low walls, two candidates already in it.
  const TRAY = { x: 64, y: -32, w: 30, d: 36, r: 2 };
  back.push(s.owned("tray", () => [
    slab(TRAY, 0, 2, { tone: "mid", name: "tray.floor" }, 4, 0.4),
    slab({ x: TRAY.x, y: TRAY.y, w: TRAY.w, d: 2.2, r: 0.6 }, 2, 4, { tone: "mid", name: "tray.wall" }, 3, 0.3),
    slab({ x: TRAY.x, y: TRAY.y + 2.2, w: 2.2, d: TRAY.d - 4.4, r: 0.6 }, 2, 4, { tone: "mid", name: "tray.wall" }, 3, 0.3),
    ...[[72, -22, false], [84, -12, true]].map(([x, y, lit]) => cyl(x, y, 4.6, 2, 4, lit ? { tone: "hi", lit: true, name: "tray.puck" } : { tone: "hi", name: "tray.puck" }, 28, 0.4)),
    slab({ x: TRAY.x + TRAY.w - 2.2, y: TRAY.y + 2.2, w: 2.2, d: TRAY.d - 4.4, r: 0.6 }, 2, 4, { tone: "mid", name: "tray.wall" }, 3, 0.3),
    slab({ x: TRAY.x, y: TRAY.y + TRAY.d - 2.2, w: TRAY.w, d: 2.2, r: 0.6 }, 2, 4, { tone: "mid", name: "tray.wall" }, 3, 0.3),
  ].join("")));

  // Belt: legs, two side rails, the belt surface with cleat seams, end drums.
  for (const x of [-60, 52]) for (const y of [-12, 9]) back.push(slab({ x: x - 1.5, y, w: 3, d: 3, r: 0.5 }, 0, 7, { tone: "lo" }, 3, 0.3));
  back.push(slab({ x: BELT.x, y: -12.5, w: BELT.w, d: 3, r: 1 }, 7, 4, { tone: "mid" }, 3, 0.4));
  // Back gate post goes behind the belt.
  back.push(post(GATE, -POST_Y, 2.2, 0, BAR_Z));
  const drum = (x) => disc(G.frameAlong([x, BELT.y, 9], [0, 1, 0]), 0, BELT.d, 1.4, { tone: "mid", name: "belt.drum" });
  back.push(slab(BELT, 8, 2, { tone: "lo", crease: "none", name: "belt" }, 3, 0));
  for (let x = BELT.x + 8; x < BELT.x + BELT.w - 4; x += 10) back.push(L(k.lineOnTop([x, BELT.y], [x, BELT.y + BELT.d], BELT_TOP, P), { tone: "faint" }));
  back.push(drum(BELT.x - 1.4), drum(BELT.x + BELT.w + 1.4));

  // Hopper the pucks come from, drawn over the belt's start.
  const HOP = { x: -98, y: -18, w: 26, d: 36, r: 2 };
  const pucks = [];
  const parts = [];
  const PHASES = [0, 0.25, 0.5, 0.75];
  PHASES.forEach((phase, i) => {
    const name = `puck${i}`;
    const lit = i === 0;
    pucks.push(moving(name, cyl(X0, 0, PUCK_R, BELT_TOP, PUCK_H, lit ? { tone: "hi", lit: true } : { tone: "hi" }, 32, 0.5) + L(k.ring(X0, 0, PUCK_R - 1.8, BELT_TOP + PUCK_H, P, 28), { tone: "faint" })));
    parts.push(move(name, [1, 0, 0], [[0, 0], [1, X1 - X0]], { phase, linear: true }));
    parts.push(fade(name, [[0, 0], [0.05, 1], [0.92, 1], [0.99, 0]], { phase, linear: true }));
  });

  const hopper = [
    slab(HOP, 0, 22, { tone: "mid" }, 4, 0.6),
    slab({ x: HOP.x - 2, y: HOP.y - 2, w: HOP.w + 4, d: HOP.d + 4, r: 2.5 }, 22, 12, { tone: "mid" }, 4, 0.6),
    L(k.planOutline(k.insetPlan({ x: HOP.x - 2, y: HOP.y - 2, w: HOP.w + 4, d: HOP.d + 4, r: 2.5 }, 3), 34, P), { tone: "lo" }),
    L(k.sideSeam(HOP, 11, P, 4), { tone: "faint" }),
    D(k.corners(HOP, 3).map(([x, y]) => at([x, y, 22])), { size: 0.45 }),
    disc(G.frameAlong([HOP.x + 13, HOP.y + HOP.d, 9], [0, 1, 0]), 0, 2.4, 2.4, { tone: "mid", name: "hopper.knob" }),
  ];

  // Front rail, front post, crossbar with the probe and the dial.
  const rail = slab({ x: BELT.x, y: 9.5, w: BELT.w, d: 3, r: 1 }, 7, 4, { tone: "mid" }, 3, 0.4) + D([BELT.x + 6, 0, BELT.x + BELT.w - 6].map((x) => at([x, 11, 11])), { size: 0.4 });
  const probe = moving("probe", cyl(GATE, 0, 1.6, PROBE_REST, 1.2, { tone: "hi", lit: true, name: "probe.tip" }, 16) + cyl(GATE, 0, 0.9, PROBE_REST + 1.2, BAR_Z - PROBE_REST - 1.2, { tone: "hi", crease: "none", lit: true, name: "probe.rod" }, 12));
  const gate = [
    post(GATE, POST_Y, 2.2, 0, BAR_Z),
    slab({ x: GATE - 3, y: -POST_Y - 3, w: 6, d: POST_Y * 2 + 6, r: 1.5 }, BAR_Z, 4, { tone: "mid", name: "gate.bar" }, 4, 0.5),
    D([-POST_Y, POST_Y].map((y) => at([GATE, y, BAR_Z + 4])), { size: 0.45 }),
    cyl(GATE, 0, 3, BAR_Z + 4, 2, { tone: "mid", name: "gate.boss" }, 20),
    dial(GATE, 0, 9, BAR_Z + 6, 4, { ticks: 30, every: 5 }),
    needleSvg("needle"),
    L(k.ring(GATE, 0, 1, BAR_Z + 10, P, 12), { tone: "mid" }),
  ];

  // Probe rises onto each puck as it passes the gate; the dial reads its fit.
  const centre = (phase) => (((-X0 / (X1 - X0)) - phase) % 1 + 1) % 1;
  const bumps = PHASES.map((p) => centre(p)).sort((a, b) => a - b);
  // Keyframes wrap round the loop, so a puck passing the gate at the seam is covered too.
  const keys = (hi, lo, reading = () => hi) => {
    const out = [];
    for (const c of bumps) {
      const v = reading(c);
      out.push([c - 0.1, lo], [c - 0.078, v], [c + 0.078, v], [c + 0.1, lo]);
    }
    return out.map(([t, v]) => [((t % 1) + 1) % 1, v]).sort((a, b) => a[0] - b[0]);
  };
  const fit = (c) => (Math.abs(c - centre(0)) < 1e-6 ? 0.34 : 0.12 + ((c * 7) % 1) * 0.08);
  parts.push(move("probe", [0, 0, 1], keys(PROBE_UP - PROBE_REST, 0)));
  parts.push(needle("needle", { c: [GATE, 0, BAR_Z + 10.2], plane: "z", r0: 1.6, r1: 6.6, track: keys(0, -0.04, fit) }));

  const svg = figure({
    label: "A shortlist sorter on a bench: candidate pucks leave a hopper on a belt and pass under a gauge gate; the probe rises onto each one and the dial reads its fit. The lit candidate reads past the mark and joins the shortlist tray.",
    body: [...back, ...pucks, probe, ...hopper, rail, ...gate],
  });
  return { svg, P, loop: 7.2, still: centre(0), parts, through: [["probe.rod", "gate.bar"]] };
}
