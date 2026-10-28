// Shared drawing helpers for the hover-card figures, bound to one projection.
// Every figure stands on the same bench: a plate on four feet with a groove,
// corner screws, a ruler strip and a label plate, so the set reads as one series.
//
// Each solid a helper draws is also recorded as its true 3D shape (kit/audit.mjs).
// Helpers return a marker string; finish() turns the markers back into SVG in the
// painter's order the kit settles from real depth, across every pose of the loop,
// and can audit the geometry (node build.mjs --audit).
import * as k from "./kit/iso-kit.mjs";
import * as G from "./kit/lathe.mjs";
import * as A from "./kit/audit.mjs";

export const W = 320;
export const H = 184;
const MARK = /\u0001(\d+)\u0002/g;
let current = null;
// The official logo for the figure being built ({ href, aspect }), printed on its label plate. Set by build.mjs.
let logo = null;
export const useLogo = (l) => { logo = l; };

export function studio(points, { azimuth = 40, elevation = 30, pad = 16 } = {}) {
  const P = k.fitProjection(points, W, H, { pad, azimuth, elevation });
  const reg = [];
  const parts = new Map();
  const owners = [];
  const counts = new Map();
  const nameFor = (base) => {
    const n = (counts.get(base) ?? 0) + 1;
    counts.set(base, n);
    return n === 1 ? base : `${base}#${n}`;
  };
  const owner = () => owners[owners.length - 1];

  // Put one drawn solid with its recorded shape; returns its marker.
  function item(core, shape, name, kind) {
    const probe = shape({});
    const b = A.boundsOf(probe);
    const c = [0, 1, 2].map((i) => Math.round((b.min[i] + b.max[i]) / 2));
    const id = nameFor(name ?? `${owner() ? `${owner()}.` : ""}${kind}(${c.join(",")})`);
    const meta = { name: id, owner: owner() };
    reg.push({ core, shape: shape(meta), name: id });
    return `\u0001${reg.length - 1}\u0002`;
  }
  // Items drawn inside fn share an owner: they may touch or sink into each other.
  function owned(name, fn) {
    owners.push(nameFor(name));
    try { return fn(); } finally { owners.pop(); }
  }

  const at = (p) => k.iso(p, P);
  const L = (d, style) => k.lineSvg(d, style);
  const D = (pts, style) => k.dotsSvg(pts, style);
  const S = (paths, style) => k.solidSvg(paths, style);
  const named = ({ name, ...style }) => [name, style];
  const slab = (plan, z, h, style = {}, steps = 4, bevel = 0.5) => {
    const [name, st] = named(style);
    return item(S(k.slabOf(plan, z, h, P, steps, bevel), st), (m) => A.slab(plan, z, h, m, steps), name, "slab");
  };
  const cyl = (x, y, r, z, h, style = {}, steps = 28, bevel = 0) => {
    const [name, st] = named(style);
    return item(S(k.cylinder(x, y, r, z, h, P, steps, bevel), st), (m) => A.cylinder(x, y, r, z, h, m), name, "cyl");
  };
  const disc = (F, s0, s1, r, style = {}) => {
    const [name, st] = named(style);
    return item(S(G.disc(s0, s1, r, F, P), st), (m) => A.disc(F, s0, s1, r, m), name, "disc");
  };
  const turned = (profile, F, style = {}) => {
    const [name, st] = named(style);
    return item(S(G.solidOf(profile, F, P), st), (m) => A.solid(F, profile, m), name, "turned");
  };
  // A slender physical part drawn as a line (a string, a spring, a beam drawn as a moving needle):
  // recorded as a tube of radius r along its rest-pose centreline.
  const rod = (points, r, markup, name) => item(markup, (m) => A.tube(points, r, m), name, "rod");
  const depth = (p) => k.depthOf(p, P);
  const byDepth = (pts) => [...pts].sort((a, b) => depth([a[0], a[1], a[2] ?? 0]) - depth([b[0], b[1], b[2] ?? 0]));
  const screw = (x, y, z, ring = 1.4) => L(k.ring(x, y, ring, z, P, 14), { tone: "lo" }) + D([at([x, y, z])], { size: 0.45 });

  // Bench plate on feet. The figure's mechanism is drawn on top of z = 0.
  function bench(plan, { strip = true, label = null, plateH = 7, footH = 4 } = {}) {
    const out = [`<path class="iso-halo" d="${k.haloOf(plan, -plateH - footH, plateH, P)}"/>`];
    for (const [x, y] of byDepth(k.corners(plan, 14))) {
      out.push(cyl(x, y, 5, -plateH - footH, 1.2, { tone: "lo", name: "stand.foot-pad" }, 24));
      out.push(cyl(x, y, 3.8, -plateH - footH + 1.2, footH - 1.2, { tone: "mid", name: "stand.foot" }, 24));
    }
    out.push(slab(plan, -plateH, plateH, { tone: "mid", name: "stand.plate" }, 8, 1.2));
    out.push(L(k.planOutline(k.insetPlan(plan, 3.5), 0, P), { tone: "lo" }));
    for (const [x, y] of k.corners(plan, 7)) out.push(screw(x, y, 0));
    if (strip) {
      const s = { x: plan.x + 14, y: plan.y + plan.d - 10.5, w: plan.w * 0.52, d: 5, r: 0.8 };
      out.push(slab(s, 0, 0.5, { tone: "lo", crease: "none", name: "stand.ruler" }, 3, 0));
      const t = k.topTicks(s.x + 3, s.x + s.w - 3, 3, 5, s.y + 0.6, 0.5, [1.5, 2.8], P);
      out.push(L(t.minor, { tone: "lo" }), L(t.major, { tone: "mid" }));
    }
    if (label) out.push(labelPlate(label, plan));
    return out.join("");
  }

  // Small label plate: the product's official logo printed on it when there is one,
  // otherwise three rule lines standing for printed text.
  function labelPlate(plan, bench = null) {
    if (logo) {
      // A logo needs a larger plate; keep it inside the bench's inner groove.
      const w = Math.max(plan.w, 34), d = Math.max(plan.d, 17), m = 4.5;
      let { x, y } = plan;
      if (bench) {
        x = Math.min(Math.max(x, bench.x + m), bench.x + bench.w - m - w);
        y = Math.min(Math.max(y, bench.y + m), bench.y + bench.d - m - d);
      }
      plan = { ...plan, x, y, w, d };
    }
    const out = [slab(plan, 0, 0.6, { tone: "lo", name: "stand.label" }, 3, 0)];
    out.push(L(k.planOutline(k.insetPlan(plan, 1.2), 0.6, P, 3), { tone: "faint" }));
    if (logo) return out.join("") + logoOn(plan, 0.6);
    const y0 = plan.y + plan.d * 0.3;
    const gap = plan.d * 0.2;
    [0.7, 0.5, 0.6].forEach((share, i) => {
      out.push(L(k.lineOnTop([plan.x + 3, y0 + gap * i], [plan.x + 3 + (plan.w - 6) * share, y0 + gap * i], 0.6, P), { tone: "lo", free: true }));
    });
    out.push(D([at([plan.x + plan.w - 2.4, plan.y + 2.4, 0.6]), at([plan.x + plan.w - 2.4, plan.y + plan.d - 2.4, 0.6])], { size: 0.4 }));
    return out.join("");
  }

  // Lay the logo flat on a plan's top face, reading left to right as seen from the camera:
  // image u runs along the plan axis that points most to the right on screen.
  function logoOn(plan, z) {
    const c = [plan.x + plan.w / 2, plan.y + plan.d / 2];
    const scr = (dx, dy) => { const p = at([c[0] + dx, c[1] + dy, z]), o = at([c[0], c[1], z]); return [p[0] - o[0], p[1] - o[1]]; };
    const axes = [[1, 0], [-1, 0], [0, 1], [0, -1]];
    const U = axes.reduce((m, a) => (scr(...a)[0] > scr(...m)[0] ? a : m));
    const V = [[U[1], -U[0]], [-U[1], U[0]]].find((v) => { const su = scr(...U), sv = scr(...v); return su[0] * sv[1] - su[1] * sv[0] > 0; });
    const along = (a) => (a[0] ? plan.w : plan.d);
    const room = [along(U) - 2.4, along(V) - 2.4];
    // An icon fills the plate's height; a wordmark fills its width.
    let lu = Math.min(room[0], room[1] * logo.aspect), lv = lu / logo.aspect;
    const o = [c[0] - (U[0] * lu + V[0] * lv) / 2, c[1] - (U[1] * lu + V[1] * lv) / 2];
    const p0 = at([o[0], o[1], z]), pu = at([o[0] + U[0] * lu, o[1] + U[1] * lu, z]), pv = at([o[0] + V[0] * lv, o[1] + V[1] * lv, z]);
    const m = [pu[0] - p0[0], pu[1] - p0[1], pv[0] - p0[0], pv[1] - p0[1], p0[0], p0[1]].map((n) => +n.toFixed(3));
    return `<image class="iso-logo" href="${logo.href}" width="1" height="1" preserveAspectRatio="none" transform="matrix(${m.join(" ")})"/>`;
  }

  // Post with collar, seam rings and a cap.
  function post(x, y, r, z0, z1, { collar = true, cap = true, tone = "mid" } = {}) {
    return owned("post", () => {
      const out = [];
      // The post ends exactly at z1 (cap included), so whatever stands on it sits on its top.
      if (collar) out.push(cyl(x, y, r + 1.6, z0, 2.4, { tone }, 24));
      const base = collar ? z0 + 2.4 : z0;
      const top = cap ? z1 - 1.4 : z1;
      out.push(cyl(x, y, r, base, top - base, { tone, crease: "none" }, 24));
      if (cap) out.push(cyl(x, y, r + 0.6, top, 1.4, { tone }, 24));
      return out.join("");
    });
  }

  // Knurled knob with a pointer line on top.
  function knob(x, y, r, z, h, { tone = "mid", turn = 0 } = {}) {
    const a = turn * Math.PI * 2;
    return (
      cyl(x, y, r, z, h, { tone, name: "knob" }, 28) +
      L(k.knurl(x, y, r, z, z + h, Math.round(r * 5), P), { tone: "lo" }) +
      L(k.lineOnTop([x, y], [x + Math.cos(a) * (r - 0.6), y + Math.sin(a) * (r - 0.6)], z + h, P), { tone: "hi", free: "end" })
    );
  }

  // Face-up dial with knurled bezel and ticks; the needle is drawn separately (it moves).
  function dial(x, y, R, z, h, { ticks = 40, every = 5 } = {}) {
    const top = z + h;
    const t = k.radialTicks(x, y, R - 2, ticks, every, top, [1, 2], P);
    return (
      cyl(x, y, R, z, h, { tone: "hi", crease: "lo", name: "dial" }, 48, 0.6) +
      L(k.knurl(x, y, R, top - 2.2, top, Math.round(R * 4), P, 0.3), { tone: "lo" }) +
      L(k.sideArc(x, y, R, top - 2.2, P, 32), { tone: "faint" }) +
      L(k.ring(x, y, R - 1.4, top, P, 48), { tone: "lo" }) +
      L(t.minor, { tone: "lo" }) +
      L(t.major, { tone: "mid" })
    );
  }

  // A moving group: every item and line inside it moves (or fades) as one part.
  function moving(name, inner, { clip = null } = {}) {
    parts.set(name, { clip });
    const wrap = (svg) => (svg ? `<g data-part="${name}"${clip ? ` clip-path="url(#${clip})"` : ""}>${svg}</g>` : "");
    let out = "", last = 0;
    for (const m of inner.matchAll(MARK)) {
      out += wrap(inner.slice(last, m.index)) + m[0];
      const entry = reg[+m[1]];
      if (entry.part) throw new Error(`${entry.name} is already in part ${entry.part}`);
      entry.part = name;
      last = m.index + m[0].length;
    }
    return out + wrap(inner.slice(last));
  }
  const move = (name, vec, track, extra = {}) => ({ type: "move", part: name, vec: k.axisVector(P, vec), world: vec, track, ...extra });
  const fade = (name, track, extra = {}) => ({ type: "fade", part: name, track, ...extra });
  // A line that turns about `c` in a plane: "z" = face-up dial, "x"/"y" = vertical plane across that axis.
  const needle = (name, spec) => ({ type: "needle", part: name, ...spec });
  const needleSvg = (name, { tone = "lit", width = 1.1 } = {}) => `<path data-part="${name}" class="iso-line" data-tone="${tone}" data-free="" d="" style="stroke-width:${width}"/>`;

  current = { P, reg, parts };
  return { P, k, G, A, at, L, D, slab, cyl, disc, turned, rod, depth, byDepth, screw, bench, labelPlate, post, knob, dial, owned, moving, move, fade, needle, needleSvg };
}

export function figure({ label, body }) {
  return { label, body: Array.isArray(body) ? body.join("") : body, studio: current };
}

// Keyframe sampling, the same as the runtime's (pose.js).
export function sample(track, u, linear) {
  if (track.length === 1) return track[0][1];
  u = ((u % 1) + 1) % 1;
  let i = track.length - 1;
  for (let j = 0; j < track.length; j++) if (track[j][0] <= u) i = j;
  const [t0, v0] = track[i];
  const [t1raw, v1] = track[(i + 1) % track.length];
  const t1 = i === track.length - 1 ? t1raw + 1 : t1raw;
  let s = t1 > t0 ? (u - t0) / (t1 - t0) : 0;
  if (!linear) s = s * s * (3 - 2 * s);
  return v0 + (v1 - v0) * s;
}

export const POSES = 48;

// Settle the painter's order over every pose, emit the SVG, and optionally audit.
export function finish(fig, { audit = false } = {}) {
  const { label, body, studio: st } = fig.svg;
  const { P, reg, parts } = st;
  const moves = new Map();
  for (const spec of fig.parts) {
    if (spec.type !== "move") continue;
    const peak = spec.track.reduce((m, [, v]) => (Math.abs(v) > Math.abs(m) ? v : m), 0);
    moves.set(spec.part, { spec, peak, world: spec.world.map((c) => c * peak) });
  }
  const R = A.recorder(P);
  // Markup before the first item (the halo) stays first; markup after an item is drawn with it.
  const pieces = body.split(MARK);
  const prefix = pieces[0];
  for (let i = 1; i < pieces.length; i += 2) {
    const entry = reg[+pieces[i]];
    const m = entry.part ? moves.get(entry.part) : null;
    const clip = entry.part && parts.get(entry.part)?.clip;
    const core = entry.part ? `<g data-part="${entry.part}"${clip ? ` clip-path="url(#${clip})"` : ""}>${entry.core}</g>` : entry.core;
    R.solid(entry.shape);
    R.put({ key: R.items.length * 0.001, name: entry.name, piece: entry.part ?? "", move: m ? m.world : [0, 0, 0], shapes: [entry.shape], svg: core + pieces[i + 1] });
  }
  const states = [];
  for (let n = 0; n <= POSES; n++) {
    const u = n / POSES;
    const shares = {};
    for (const [part, m] of moves) shares[part] = m.peak ? sample(m.spec.track, u + (m.spec.phase || 0), m.spec.linear) / m.peak : 0;
    states.push({ label: `u ${u.toFixed(3)}`, shares });
  }
  A.settle(R, P, { states });
  const items = R.items.slice().sort((a, b) => a.key - b.key);
  const svg = k.figureSvg({ width: W, height: H, label, body: prefix + items.map((it) => it.svg).join("") });
  let result = null;
  if (audit) {
    const { overlaps, solved } = R.settled;
    result = {
      depth: A.depthOrder(R.items, P, { overlaps, solved, rest: states }),
      supports: A.supports(R.solids, R.tubes, { ground: R.ground }),
      flight: states.flatMap((state) => A.solidClearances(R.solids, { state }).map((c) => ({ ...c, state: state.label }))),
      cover: A.coverage(R.items, P),
      wobble: A.wobble(R.solids),
    };
  }
  return { svg, result, R };
}
