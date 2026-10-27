// Hover cards: runtime appended to the generated public/cards.js.
// ENTS (id -> card text) is defined above it; figures ({ svg, P, loop, still, parts }) load from /figs/<id>.json.
const R = Math.PI / 180;

function iso([x, y, z], P) {
  const a = P.azimuth * R, e = P.elevation * R, k = P.scale * Math.sqrt(1.6);
  return [P.origin[0] + (x * Math.sin(a) - y * Math.cos(a)) * k, P.origin[1] + ((x * Math.cos(a) + y * Math.sin(a)) * Math.sin(e) - z * Math.cos(e)) * k];
}
const depthOf = ([x, y, z], P) => {
  const a = P.azimuth * R, e = P.elevation * R;
  return (x * Math.cos(a) + y * Math.sin(a)) * Math.cos(e) + z * Math.sin(e);
};
const f1 = (n) => Math.round(n * 10) / 10;
const path = (pts, close) => 'M' + pts.map((p) => f1(p[0]) + ' ' + f1(p[1])).join('L') + (close ? 'Z' : '');

// Keyframes [[t 0..1, value], ...] eased with smoothstep, looping.
function sample(track, u, linear) {
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

const dirOf = (plane, a) => plane === 'z' ? [Math.sin(a), -Math.cos(a), 0] : plane === 'x' ? [0, Math.cos(a), Math.sin(a)] : [Math.cos(a), 0, Math.sin(a)];
const add = (c, v, s) => [c[0] + v[0] * s, c[1] + v[1] * s, c[2] + v[2] * s];

function pose(fig, root, u) {
  for (const spec of fig.parts) {
    const el = root.querySelector(`[data-part="${spec.part}"]`);
    if (!el) continue;
    const v = sample(spec.track, u + (spec.phase || 0), spec.linear);
    if (spec.type === 'move') el.setAttribute('transform', `translate(${f1(spec.vec[0] * v)} ${f1(spec.vec[1] * v)})`);
    else if (spec.type === 'fade') el.style.opacity = v.toFixed(3);
    else if (spec.type === 'needle') {
      let dpath = '';
      for (let b = 0; b < (spec.count || 1); b++) {
        const a = (v + b / (spec.count || 1)) * Math.PI * 2, dir = dirOf(spec.plane, a);
        dpath += path([iso(add(spec.c, dir, -spec.r0), fig.P), iso(add(spec.c, dir, spec.r1), fig.P)]);
      }
      el.setAttribute('d', dpath);
    } else if (spec.type === 'blades') {
      // Flat cards or blades turning about an axis through c; repainted back to front each frame.
      const ax = spec.axis === 'x' ? [1, 0, 0] : [0, 1, 0];
      const items = [];
      for (let b = 0; b < spec.count; b++) {
        const a = (v + b / spec.count) * Math.PI * 2;
        const dir = spec.axis === 'x' ? [0, Math.cos(a), Math.sin(a)] : [Math.cos(a), 0, Math.sin(a)];
        const p = (s, r) => add(add(spec.c, ax, s), dir, r);
        const quad = [p(-spec.half, spec.r0), p(spec.half, spec.r0), p(spec.half, spec.r1), p(-spec.half, spec.r1)];
        items.push({ z: depthOf(p(0, (spec.r0 + spec.r1) / 2), fig.P), d: path(quad.map((q) => iso(q, fig.P)), true), lit: b === 0 });
      }
      items.sort((m, n) => m.z - n.z);
      const kids = el.children;
      items.forEach((it, i) => {
        kids[i].setAttribute('d', it.d);
        it.lit ? kids[i].setAttribute('data-lit', '') : kids[i].removeAttribute('data-lit');
      });
    }
  }
}

