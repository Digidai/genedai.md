const d = document;
const still = matchMedia('(prefers-reduced-motion: reduce)');

// ── Card UI ───────────────────────────────────────────
const style = d.createElement('style');
style.textContent = CSS;
d.head.append(style);

const card = d.createElement('div');
card.className = 'ent-card iso';
card.id = 'ent-card';
card.setAttribute('role', 'dialog');
card.hidden = true;
let openedAt = 0, quiet = null, current = null, openTimer = 0, closeTimer = 0, frame = 0, t0 = 0;

const darkNow = () => d.documentElement.dataset.theme
  ? d.documentElement.dataset.theme === 'dark'
  : matchMedia('(prefers-color-scheme: dark)').matches;
const esc = (t) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const FIGS = {};
const fetchFig = (id) => (FIGS[id] ||= fetch(`/figs/${id}.json`).then((r) => (r.ok ? r.json() : null)).catch(() => null));

function render(id) {
  const e = ENTS[id];
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

let fig = null;
function loop(now) {
  if (!current || !fig) { frame = 0; return; }
  pose(fig, card, ((now - t0) / 1000) / fig.loop);
  frame = requestAnimationFrame(loop);
}

function open(el) {
  clearTimeout(closeTimer);
  if (current === el) return;
  if (current) current.removeAttribute('aria-expanded');
  current = el;
  openedAt = performance.now();
  const id = el.dataset.ent;
  render(id);
  card.dataset.theme = darkNow() ? 'dark' : 'light';
  el.after(card);
  card.hidden = false;
  if (el.getAttribute('role') === 'button') el.setAttribute('aria-expanded', 'true');
  el.setAttribute('aria-controls', card.id);
  place();
  fig = null;
  void card.offsetWidth; // commit the hidden state so the fade-in runs
  card.classList.add('on');
  fetchFig(id).then((f) => {
    if (!f || current !== el) return;
    fig = f;
    card.querySelector('.ent-stage').innerHTML = f.svg;
    t0 = performance.now();
    if (still.matches) pose(f, card, f.still);
    else if (!frame) frame = requestAnimationFrame(loop);
  });
}

function close() {
  clearTimeout(openTimer);
  if (!current) return;
  if (current.getAttribute('role') === 'button') current.setAttribute('aria-expanded', 'false');
  current = null;
  card.classList.remove('on');
  card.hidden = true;
  cancelAnimationFrame(frame);
  frame = 0;
}

const later = (fn, ms) => { clearTimeout(closeTimer); closeTimer = setTimeout(fn, ms); };
const finePointer = matchMedia('(hover: hover) and (pointer: fine)');

d.addEventListener('pointerover', (e) => {
  if (e.pointerType !== 'mouse' || !finePointer.matches) return;
  const el = e.target.closest('[data-ent]');
  if (el) { clearTimeout(closeTimer); clearTimeout(openTimer); fetchFig(el.dataset.ent); openTimer = setTimeout(() => el.matches(':hover') && open(el), current ? 0 : 140); }
  else if (e.target.closest('.ent-card')) clearTimeout(closeTimer);
});
d.addEventListener('pointerout', (e) => {
  if (e.pointerType !== 'mouse' || !current) return;
  const to = e.relatedTarget;
  if (to && (to.closest('.ent-card') || to.closest('[data-ent]') === current)) return;
  clearTimeout(openTimer);
  later(close, 220);
});
d.addEventListener('focusin', (e) => {
  const el = e.target.closest('[data-ent]');
  if (el && el === quiet) { quiet = null; return; }
  quiet = null;
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
  if (current && !e.target.closest('.ent-card')) close();
});
d.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && current) { const el = current; close(); quiet = el; el.focus(); }
  if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('[data-ent][role="button"]')) { e.preventDefault(); current === e.target ? close() : open(e.target); }
});
addEventListener('scroll', place, { passive: true });
addEventListener('resize', place);
still.addEventListener('change', () => { if (current) { close(); } });

function start(el, type) {
  if (type === 'click') { if (el.getAttribute('role') === 'button') open(el); }
  else if (type === 'focusin') { if (el.matches(':focus-visible')) open(el); }
  else { fetchFig(el.dataset.ent); openTimer = setTimeout(() => el.matches(':hover') && open(el), 140); }
}
