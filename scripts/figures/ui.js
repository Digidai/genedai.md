const d = document;
const still = matchMedia('(prefers-reduced-motion: reduce)');
const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
const touch = matchMedia('(hover: none)');

// ── Card UI ───────────────────────────────────────────
const style = d.createElement('style');
style.textContent = CSS;
d.head.append(style);

const card = d.createElement('div');
card.className = 'ent-card iso';
card.id = 'ent-card';
card.setAttribute('role', 'dialog');
card.hidden = true;
card.dataset.state = 'closed';

// ── Card state ────────────────────────────────────────
// One card at a time, closed or open, mirrored on the element so CSS, tests and agents can read it:
//   #ent-card[data-state]  closed | open
//   #ent-card[data-for]    the open card's entity id
//   #ent-card[data-fig]    loading | ready | missing  (its figure)
// Hover delays each change: `pending` holds the one scheduled transition (open after 140 ms,
// close after 220 ms), and scheduling another replaces it.
let current = null;    // the [data-ent] element the open card belongs to
let pending = 0;       // timer of the scheduled open or close
let openedAt = 0;      // a tap within 400 ms of opening keeps the card open
let refocused = null;  // the name Escape returned focus to; that focus doesn't reopen its card
let fig = null, frame = 0;  // the open card's figure and its frame loop

// ── Figure playback ───────────────────────────────────
// The figure is a loop of poses u (0..1 per loop, kept unwrapped so it can ease across the seam),
// split into named steps. Its playback is mirrored on #ent-card[data-play]:
//   tour   it plays by itself, and the readout follows the steps
//   hand   the reader holds it: the pointer scrubs across it, a click, tap or arrow key steps;
//          it resumes the tour IDLE ms after the reader's last input once pointer and focus have left
//   still  reduced motion: no tour; every input jumps straight to its pose
// #ent-card .ent-stage is a slider: aria-valuenow is the step, aria-valuetext its name.
const IDLE = 3600, LEAVE = 1200;
let u = 0, target = 0, posed = NaN, last = 0, resumeAt = 0, stepIdx = -1, labels = [];
let drag = null, clickX = null, noClick = false;
const frac = (x) => ((x % 1) + 1) % 1;
const stage = () => card.querySelector('.ent-stage');
const schedule = (fn, ms) => { clearTimeout(pending); pending = setTimeout(fn, ms); };
const cancel = () => clearTimeout(pending);
// Names with role="button" report whether their card is open.
const expand = (el, on) => { if (el.getAttribute('role') === 'button') el.setAttribute('aria-expanded', String(on)); };

const darkNow = () => d.documentElement.dataset.theme
  ? d.documentElement.dataset.theme === 'dark'
  : matchMedia('(prefers-color-scheme: dark)').matches;
const esc = (t) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const FIGS = {};
const fetchFig = (id) => (FIGS[id] ||= fetch(`/figs/${id}.json`).then((r) => (r.ok ? r.json() : null)).catch(() => null));

// The Chinese page (lang="zh-CN") shows each card's `zh` text.
const ZH = document.documentElement.lang.startsWith('zh');
const KIND_ZH = { Company: '公司', Product: '产品', Education: '教育', Project: '项目' };

function render(id) {
  const e = ZH ? { ...ENTS[id], ...ENTS[id].zh, kind: KIND_ZH[ENTS[id].kind], fig: ENTS[id].fig.replace('Fig', '图') } : ENTS[id];
  labels = e.steps;
  const links = (e.links || []).map(([text, href]) => `<a href="${esc(href)}" target="_blank" rel="noopener">${esc(text)} <span aria-hidden="true">↗</span></a>`).join('');
  card.innerHTML =
    `<div class="ent-plate"><span class="ent-corner" data-c="fig">${esc(e.fig)}</span><span class="ent-corner" data-c="kind">${esc(e.kind)}</span><div class="ent-stage"></div><span class="ent-corner" data-c="hint">${esc(e.hint)}</span><span class="ent-corner" data-c="step" aria-hidden="true"></span></div>` +
    `<div class="ent-body"><p class="ent-title"><strong>${esc(e.name)}</strong>${e.meta ? ` <span>${esc(e.meta)}</span>` : ''}</p><p class="ent-desc">${esc(e.desc)}</p>${links ? `<p class="ent-links">${links}</p>` : ''}</div>`;
  card.setAttribute('aria-label', e.name);
  card.querySelector('.ent-stage').dataset.label = ZH
    ? `${e.name}示意图：${e.hint}。在图上移动、点击，或用方向键逐步查看。`
    : `${e.name} figure: ${e.hint}. Move across it, click it, or use the arrow keys to step through.`;
}

// The step whose phase began most recently at pose x.
function stepAt(x) {
  let best = 0, gap = 2;
  fig.steps.forEach(([from], i) => { const g = frac(x - from); if (g < gap) { gap = g; best = i; } });
  return best;
}

function show() {
  if (u !== posed) { pose(fig, card, u); posed = u; }
  const i = stepAt(u);
  if (i === stepIdx) return;
  stepIdx = i;
  card.querySelector('[data-c="step"]').textContent = `${i + 1}/${labels.length} · ${labels[i]}`;
  const st = stage();
  st.setAttribute('aria-valuenow', i + 1);
  st.setAttribute('aria-valuetext', labels[i]);
}

const play = (mode) => (card.dataset.play = mode);
// The reader takes over; the tour resumes `ms` after this input (never while it is Infinity).
function hold(ms) {
  if (card.dataset.play === 'tour') play('hand');
  resumeAt = performance.now() + ms;
  if (!frame && fig) { last = performance.now(); frame = requestAnimationFrame(loop); }
}
// Step from the step the reader sees, forward or back along the loop; Home and End take the short way.
function goStep(to, dir) {
  const n = fig.steps.length, i = to == null ? (stepAt(u) + dir + n) % n : to, at = fig.steps[i][1];
  target = dir > 0 ? u + (frac(at - u) || 1) : dir < 0 ? u - (frac(u - at) || 1) : u + frac(at - u + 0.5) - 0.5;
}
// The pointer's place across the figure picks the pose: the left edge starts the loop, the right edge ends it.
function scrubTo(clientX) {
  const r = stage().getBoundingClientRect();
  const x = Math.min(1, Math.max(0, (clientX - r.left) / r.width)) * 0.999;
  target = x + Math.round(u - x);
}

function place() {
  if (!current) return;
  const r = current.getBoundingClientRect();
  const w = card.offsetWidth, h = card.offsetHeight, gap = 8, vw = innerWidth, vh = innerHeight;
  const anchor = current.querySelector('.link-title') || current;
  const a = anchor.getBoundingClientRect();
  let left = Math.min(Math.max(8, a.left - 4), vw - w - 8);
  let top = r.bottom + gap;
  if (top + h > vh - 8 && r.top - gap - h > 8) top = r.top - gap - h;
  card.style.left = left + 'px';
  card.style.top = Math.max(8, top) + 'px';
}

function loop(now) {
  if (!current || !fig) { frame = 0; return; }
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  if (card.dataset.play === 'hand' && now >= resumeAt) play('tour');
  const mode = card.dataset.play;
  if (mode === 'tour') u = target = u + dt / fig.loop;
  else u = mode === 'still' || Math.abs(target - u) < 1e-4 ? target : u + (target - u) * (1 - Math.exp(-dt / 0.14));
  show();
  // Settled with no tour to resume: sleep until the next input.
  if (mode !== 'tour' && u === target && (mode === 'still' || resumeAt === Infinity)) { frame = 0; return; }
  frame = requestAnimationFrame(loop);
}

function open(el) {
  cancel();
  if (current === el) return;
  if (current) expand(current, false);
  current = el;
  openedAt = performance.now();
  const id = el.dataset.ent;
  render(id);
  card.dataset.theme = darkNow() ? 'dark' : 'light';
  Object.assign(card.dataset, { state: 'open', for: id, fig: 'loading' });
  el.after(card);
  card.hidden = false;
  expand(el, true);
  el.setAttribute('aria-controls', card.id);
  place();
  // On a phone the card may fit neither above nor below the name: scroll just enough to show all of it.
  // Not on mouse hover, where scrolling would pull the name out from under the pointer.
  const over = parseFloat(card.style.top) + card.offsetHeight - (innerHeight - 8);
  if (over > 0 && !finePointer.matches) scrollBy({ top: over, behavior: still.matches ? 'instant' : 'smooth' });
  fig = null;
  delete card.dataset.play;
  void card.offsetWidth; // commit the hidden state so the fade-in runs
  card.classList.add('on');
  fetchFig(id).then((f) => {
    if (current !== el) return;
    card.dataset.fig = f ? 'ready' : 'missing';
    if (!f) return;
    fig = f;
    const st = stage();
    st.innerHTML = f.svg;
    Object.assign(st, { tabIndex: 0 });
    st.setAttribute('role', 'slider');
    st.setAttribute('aria-label', st.dataset.label);
    st.setAttribute('aria-valuemin', 1);
    st.setAttribute('aria-valuemax', f.steps.length);
    u = target = still.matches ? f.still : 0;
    posed = NaN; stepIdx = -1; drag = null; clickX = null; resumeAt = 0;
    play(still.matches ? 'still' : 'tour');
    show();
    if (!still.matches && !frame) { last = performance.now(); frame = requestAnimationFrame(loop); }
  });
}

function close() {
  cancel();
  if (!current) return;
  expand(current, false);
  current = null;
  card.dataset.state = 'closed';
  delete card.dataset.for;
  delete card.dataset.fig;
  delete card.dataset.play;
  card.classList.remove('on');
  card.hidden = true;
  cancelAnimationFrame(frame);
  frame = 0;
}

// Hover opens after a short delay (none when moving from one card's name to another's).
const hoverOpen = (el) => { fetchFig(el.dataset.ent); schedule(() => el.matches(':hover') && open(el), current ? 0 : 140); };

d.addEventListener('pointerover', (e) => {
  if (e.pointerType !== 'mouse' || !finePointer.matches) return;
  const el = e.target.closest('[data-ent]');
  if (el) hoverOpen(el);
  else if (e.target.closest('.ent-card')) cancel();
});
d.addEventListener('pointerout', (e) => {
  if (e.pointerType !== 'mouse' || !current) return;
  const to = e.relatedTarget;
  if (to && (to.closest('.ent-card') || to.closest('[data-ent]') === current)) return;
  schedule(close, 220);
});
d.addEventListener('focusin', (e) => {
  const el = e.target.closest('[data-ent]');
  if (el && el === refocused) { refocused = null; return; }
  refocused = null;
  if (el && el.matches(':focus-visible')) open(el);
  else if (current && !e.target.closest('.ent-card') && e.target !== current) close();
});
d.addEventListener('click', (e) => {
  const el = e.target.closest('[data-ent]');
  if (el && el.getAttribute('role') === 'button') {
    e.preventDefault();
    // A tap toggles. A mouse click, or a click right after focus opened the card, keeps it open.
    current === el && e.pointerType !== 'mouse' && performance.now() - openedAt > 400 ? close() : open(el);
    return;
  }
  // On touch screens a linked name (a project) shows its card on the first tap; the next tap follows the link.
  if (el && touch.matches && current !== el) { e.preventDefault(); open(el); return; }
  if (current && !e.target.closest('.ent-card')) close();
});
d.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && current) {
    const el = current;
    close();
    if (d.activeElement !== el) { refocused = el; el.focus(); }
  }
  if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('[data-ent][role="button"]')) { e.preventDefault(); current === e.target ? close() : open(e.target); }
});

// Figure input. A mouse scrubs by hovering; a finger or pen scrubs by dragging sideways (the stage keeps
// vertical panning). A click or tap steps forward; the arrow keys, Space, Enter, Home and End step when it has focus.
card.addEventListener('pointerdown', (e) => {
  if (fig && e.pointerType !== 'mouse' && e.target.closest('.ent-stage')) drag = { x: e.clientX, id: e.pointerId, on: false };
});
card.addEventListener('pointermove', (e) => {
  if (!fig || !e.target.closest('.ent-stage')) return;
  if (e.pointerType === 'mouse') {
    // A small jitter after a click doesn't scrub away from the step it chose.
    if (clickX != null && Math.abs(e.clientX - clickX) < 8) return;
    clickX = null;
    scrubTo(e.clientX);
    hold(Infinity);
  } else if (drag && e.pointerId === drag.id) {
    if (!drag.on && Math.abs(e.clientX - drag.x) > 6) { drag.on = true; stage().setPointerCapture(e.pointerId); }
    if (drag.on) { scrubTo(e.clientX); hold(Infinity); }
  }
});
const endDrag = (e) => {
  if (!drag || e.pointerId !== drag.id) return;
  if (drag.on) { noClick = true; hold(IDLE); }
  drag = null;
};
card.addEventListener('pointerup', endDrag);
card.addEventListener('pointercancel', endDrag);
card.addEventListener('pointerout', (e) => {
  if (!fig || e.pointerType !== 'mouse' || !e.target.closest('.ent-stage') || e.relatedTarget?.closest?.('.ent-stage')) return;
  if (card.dataset.play === 'hand' && !stage().matches(':focus-visible')) hold(LEAVE);
});
card.addEventListener('click', (e) => {
  if (!fig || !e.target.closest('.ent-stage')) return;
  if (noClick) { noClick = false; return; }
  clickX = e.pointerType === 'mouse' ? e.clientX : null;
  goStep(null, 1);
  hold(e.pointerType === 'mouse' ? Infinity : IDLE);
});
card.addEventListener('keydown', (e) => {
  if (!fig || !e.target.matches('.ent-stage')) return;
  const keys = { ArrowRight: [null, 1], ArrowDown: [null, 1], ' ': [null, 1], Enter: [null, 1], ArrowLeft: [null, -1], ArrowUp: [null, -1], Home: [0, 0], End: [fig.steps.length - 1, 0] };
  if (!keys[e.key]) return;
  e.preventDefault();
  goStep(...keys[e.key]);
  hold(Infinity);
});
card.addEventListener('focusin', (e) => { if (fig && e.target.matches('.ent-stage:focus-visible')) hold(Infinity); });
card.addEventListener('focusout', (e) => {
  if (fig && e.target.matches('.ent-stage') && card.dataset.play === 'hand' && !e.target.matches(':hover')) hold(IDLE);
});
addEventListener('scroll', place, { passive: true });
addEventListener('resize', place);
still.addEventListener('change', () => { if (current) { close(); } });

function start(el, type) {
  if (type === 'click') { if (el.getAttribute('role') === 'button' || touch.matches) open(el); }
  else if (type === 'focusin') { if (el.matches(':focus-visible')) open(el); }
  else hoverOpen(el);
}
