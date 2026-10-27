// Shared drawing helpers for the hover-card figures, bound to one projection.
// Every figure stands on the same bench: a plate on four feet with a groove,
// corner screws, a ruler strip and a label plate, so the set reads as one series.
import * as k from "./kit/iso-kit.mjs";
import * as G from "./kit/lathe.mjs";

export const W = 320;
export const H = 184;

export function studio(points, { azimuth = 40, elevation = 30, pad = 16 } = {}) {
  const P = k.fitProjection(points, W, H, { pad, azimuth, elevation });
  const at = (p) => k.iso(p, P);
  const S = (paths, style) => k.solidSvg(paths, style);
  const L = (d, style) => k.lineSvg(d, style);
  const D = (pts, style) => k.dotsSvg(pts, style);
  const slab = (plan, z, h, style = {}, steps = 4, bevel = 0.5) => S(k.slabOf(plan, z, h, P, steps, bevel), style);
  const cyl = (x, y, r, z, h, style = {}, steps = 28, bevel = 0) => S(k.cylinder(x, y, r, z, h, P, steps, bevel), style);
  const depth = (p) => k.depthOf(p, P);
  const byDepth = (pts) => [...pts].sort((a, b) => depth([a[0], a[1], a[2] ?? 0]) - depth([b[0], b[1], b[2] ?? 0]));
  const screw = (x, y, z, ring = 1.4) => L(k.ring(x, y, ring, z, P, 14), { tone: "lo" }) + D([at([x, y, z])], { size: 0.45 });

  // Bench plate on feet. The figure's mechanism is drawn on top of z = 0.
  function bench(plan, { strip = true, label = null, plateH = 7, footH = 4 } = {}) {
    const out = [`<path class="iso-halo" d="${k.haloOf(plan, -plateH - footH, plateH, P)}"/>`];
    for (const [x, y] of byDepth(k.corners(plan, 14))) {
      out.push(cyl(x, y, 5, -plateH - footH, 1.2, { tone: "lo" }, 24));
      out.push(cyl(x, y, 3.8, -plateH - footH + 1.2, footH - 1.2, { tone: "mid" }, 24));
    }
    out.push(slab(plan, -plateH, plateH, { tone: "mid" }, 8, 1.2));
    out.push(L(k.planOutline(k.insetPlan(plan, 3.5), 0, P), { tone: "lo" }));
    for (const [x, y] of k.corners(plan, 7)) out.push(screw(x, y, 0));
    if (strip) {
      const s = { x: plan.x + 14, y: plan.y + plan.d - 10.5, w: plan.w * 0.52, d: 5, r: 0.8 };
      out.push(slab(s, 0, 0.5, { tone: "lo", crease: "none" }, 3, 0));
      const t = k.topTicks(s.x + 3, s.x + s.w - 3, 3, 5, s.y + 0.6, 0.5, [1.5, 2.8], P);
      out.push(L(t.minor, { tone: "lo" }), L(t.major, { tone: "mid" }));
    }
    if (label) out.push(labelPlate(label));
    return out.join("");
  }

  // Small engraved label plate: three rule lines stand for printed text.
  function labelPlate(plan) {
    const out = [slab(plan, 0, 0.6, { tone: "lo" }, 3, 0)];
    out.push(L(k.planOutline(k.insetPlan(plan, 1.2), 0.6, P, 3), { tone: "faint" }));
    const y0 = plan.y + plan.d * 0.3;
    const gap = plan.d * 0.2;
    [0.7, 0.5, 0.6].forEach((share, i) => {
      out.push(L(k.lineOnTop([plan.x + 3, y0 + gap * i], [plan.x + 3 + (plan.w - 6) * share, y0 + gap * i], 0.6, P), { tone: "lo", free: true }));
    });
    out.push(D([at([plan.x + plan.w - 2.4, plan.y + 2.4, 0.6]), at([plan.x + plan.w - 2.4, plan.y + plan.d - 2.4, 0.6])], { size: 0.4 }));
    return out.join("");
  }

  // Post with collar, seam rings and a cap.
  function post(x, y, r, z0, z1, { collar = true, cap = true, tone = "mid" } = {}) {
    const out = [];
    if (collar) out.push(cyl(x, y, r + 1.6, z0, 2.4, { tone }, 24));
    const base = collar ? z0 + 2.4 : z0;
    out.push(cyl(x, y, r, base, z1 - base, { tone, crease: "none" }, 24));
    if (cap) out.push(cyl(x, y, r + 0.6, z1, 1.4, { tone }, 24));
    return out.join("");
  }

  // Knurled knob with a pointer line on top.
  function knob(x, y, r, z, h, { tone = "mid", turn = 0 } = {}) {
    const a = turn * Math.PI * 2;
    return (
      cyl(x, y, r, z, h, { tone }, 28) +
      L(k.knurl(x, y, r, z, z + h, Math.round(r * 5), P), { tone: "lo" }) +
      L(k.lineOnTop([x, y], [x + Math.cos(a) * (r - 0.6), y + Math.sin(a) * (r - 0.6)], z + h, P), { tone: "hi" })
    );
  }

  // Face-up dial with knurled bezel and ticks; the needle is drawn separately (it moves).
  function dial(x, y, R, z, h, { ticks = 40, every = 5 } = {}) {
    const top = z + h;
    const t = k.radialTicks(x, y, R - 2, ticks, every, top, [1, 2], P);
    return (
      cyl(x, y, R, z, h, { tone: "hi", crease: "lo" }, 48, 0.6) +
      L(k.knurl(x, y, R, top - 2.2, top, Math.round(R * 4), P, 0.3), { tone: "lo" }) +
      L(k.sideArc(x, y, R, top - 2.2, P, 32), { tone: "faint" }) +
      L(k.ring(x, y, R - 1.4, top, P, 48), { tone: "lo" }) +
      L(t.minor, { tone: "lo" }) +
      L(t.major, { tone: "mid" })
    );
  }

  // A moving group, drawn at rest; the runtime translates it along `vec` (world units).
  const moving = (name, inner) => `<g data-part="${name}">${inner}</g>`;
  const move = (name, vec, track, extra = {}) => ({ type: "move", part: name, vec: k.axisVector(P, vec), track, ...extra });
  const fade = (name, track, extra = {}) => ({ type: "fade", part: name, track, ...extra });
  // A line that turns about `c` in a plane: "z" = face-up dial, "x"/"y" = vertical plane across that axis.
  const needle = (name, spec) => ({ type: "needle", part: name, ...spec });
  const blades = (name, spec) => ({ type: "blades", part: name, ...spec });
  const bladesSvg = (name, count) => `<g data-part="${name}" class="ent-blades">${'<path d=""/>'.repeat(count)}</g>`;
  const needleSvg = (name, { tone = "lit", width = 1.1 } = {}) => `<path data-part="${name}" class="iso-line" data-tone="${tone}" d="" style="stroke-width:${width}"/>`;

  return { P, k, G, at, S, L, D, slab, cyl, depth, byDepth, screw, bench, labelPlate, post, knob, dial, moving, move, fade, needle, blades, bladesSvg, needleSvg };
}

export function figure({ label, body }) {
  return k.figureSvg({ width: W, height: H, label, body });
}
