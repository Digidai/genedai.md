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
let fig = null, frame = 0, t0 = 0; // the open card's figure and its animation
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
  const links = (e.links || []).map(([text, href]) => `<a href="${esc(href)}" target="_blank" rel="noopener">${esc(text)} <span aria-hidden="true">↗</span></a>`).join('');
  card.innerHTML =
    `<div class="ent-plate"><span class="ent-corner" data-c="fig">${esc(e.fig)}</span><span class="ent-corner" data-c="kind">${esc(e.kind)}</span><div class="ent-stage"></div><span class="ent-corner" data-c="hint">${esc(e.hint)}</span></div>` +
    `<div class="ent-body"><p class="ent-title"><strong>${esc(e.name)}</strong>${e.meta ? ` <span>${esc(e.meta)}</span>` : ''}</p><p class="ent-desc">${esc(e.desc)}</p>${links ? `<p class="ent-links">${links}</p>` : ''}</div>`;
  card.setAttribute('aria-label', e.name);
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
  pose(fig, card, ((now - t0) / 1000) / fig.loop);
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
  void card.offsetWidth; // commit the hidden state so the fade-in runs
  card.classList.add('on');
  fetchFig(id).then((f) => {
    if (current !== el) return;
    card.dataset.fig = f ? 'ready' : 'missing';
    if (!f) return;
    fig = f;
    card.querySelector('.ent-stage').innerHTML = f.svg;
    t0 = performance.now();
    if (still.matches) pose(f, card, f.still);
    else if (!frame) frame = requestAnimationFrame(loop);
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
addEventListener('scroll', place, { passive: true });
addEventListener('resize', place);
still.addEventListener('change', () => { if (current) { close(); } });

function start(el, type) {
  if (type === 'click') { if (el.getAttribute('role') === 'button' || touch.matches) open(el); }
  else if (type === 'focusin') { if (el.matches(':focus-visible')) open(el); }
  else hoverOpen(el);
}
