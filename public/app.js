// genedai.md — progressive enhancements: source view, command menu, console note.
// The page works fully without this file.
(() => {
  const d = document;
  d.documentElement.classList.add('js');

  console.log(
    '%c# genedai.md\n%cYou opened DevTools, so you probably build things.\nHiring engineers? Metix AI brings interview-ready candidates: https://metix.ai\nSay hi: hi@genedai.me · This page as Markdown: /genedai.md',
    'font: 600 16px ui-monospace, monospace; color: #f54e00',
    'font: 12px ui-monospace, monospace; color: #26251e; line-height: 1.6'
  );

  const article = d.querySelector('article.doc');
  const sourceButtons = d.querySelectorAll('[data-action="source"]');

  // ── Theme ──────────────────────────────────────────
  // The inline <head> script applies a saved choice before first paint.
  const darkNow = () => d.documentElement.dataset.theme
    ? d.documentElement.dataset.theme === 'dark'
    : matchMedia('(prefers-color-scheme: dark)').matches;
  function toggleTheme() {
    const next = darkNow() ? 'light' : 'dark';
    d.documentElement.dataset.theme = next;
    try { localStorage.setItem('theme', next); } catch {}
  }
  d.querySelectorAll('[data-action="theme"]').forEach((b) => b.addEventListener('click', toggleTheme));

  // ── Source view ────────────────────────────────────
  const esc = (t) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  function highlight(md) {
    let inFront = false;
    return md.replace(/\n$/, '').split('\n').map((raw, i) => {
      let line = esc(raw);
      if (raw === '---' && (i === 0 || inFront)) {
        inFront = i === 0;
        line = `<span class="p">${line}</span>`;
      } else if (inFront) {
        line = line.replace(/^([\w-]+):/, '<span class="k">$1</span>:');
      } else if (/^#{1,6} /.test(raw)) {
        line = `<span class="h">${line}</span>`;
      } else if (/^&gt; /.test(line)) {
        line = `<span class="q">${line}</span>`;
      } else {
        line = line
          .replace(/^(\s*)([-*]) /, '$1<span class="p">$2</span> ')
          .replace(/\[([^\]]+)\]\(((?:https?:\/\/|mailto:|\/)[^)\s]+)\)/g,
            '<span class="p">[</span><a href="$2">$1</a><span class="p">]($2)</span>')
          .replace(/\*\*([^*]+)\*\*/g, '<span class="p">**</span><strong>$1</strong><span class="p">**</span>');
      }
      return `<span class="ln">${line || ' '}</span>`;
    }).join('');
  }

  let sourceEl = null;
  async function setSource(on) {
    if (on && !sourceEl) {
      try {
        const res = await fetch('/genedai.md');
        if (!res.ok) throw new Error(res.status);
        sourceEl = d.createElement('section');
        sourceEl.className = 'source-view';
        sourceEl.setAttribute('aria-label', 'Markdown source of this page');
        sourceEl.innerHTML = `<pre>${highlight(await res.text())}</pre>`;
        article.after(sourceEl);
      } catch {
        location.href = '/genedai.md';
        return;
      }
    }
    if (sourceEl) sourceEl.hidden = !on;
    article.hidden = on;
    sourceButtons.forEach((b) => {
      b.setAttribute('aria-pressed', String(on));
      b.textContent = on ? 'preview' : 'source';
    });
    const url = new URL(location.href);
    on ? url.searchParams.set('view', 'source') : url.searchParams.delete('view');
    history.replaceState(null, '', url);
  }
  const sourceOn = () => !!article?.hidden;

  sourceButtons.forEach((b) => b.addEventListener('click', () => setSource(!sourceOn())));
  if (article && new URLSearchParams(location.search).get('view') === 'source') setSource(true);

  // In-page anchors always lead back to the rendered page.
  d.querySelectorAll('a[href^="#"]').forEach((a) => a.addEventListener('click', () => {
    if (sourceOn()) setSource(false);
  }));

  // ── Command menu ───────────────────────────────────
  const open = (url) => window.open(url, '_blank', 'noopener');
  const goTo = (id) => {
    if (sourceOn()) setSource(false);
    const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
    d.getElementById(id)?.scrollIntoView({ behavior: still ? 'auto' : 'smooth' });
    history.replaceState(null, '', `#${id}`);
  };
  const text = (el) => el?.textContent.trim().replace(/\s+/g, ' ') ?? '';

  const commands = [
    ...[...d.querySelectorAll('section[id]')].map((s) => ({
      label: `Go to ${text(s.querySelector('h2'))}`, hint: `#${s.id}`, run: () => goTo(s.id),
    })),
    ...[...d.querySelectorAll('.md-link')].map((a) => ({
      label: `Open ${text(a.querySelector('.link-title'))}`,
      hint: new URL(a.href).hostname,
      keywords: text(a.querySelector('.link-desc')),
      run: () => open(a.href),
    })),
    ...[...d.querySelectorAll('.connect-links a')].map((a) => ({
      label: `Open ${text(a)}`, hint: new URL(a.href).hostname, run: () => open(a.href),
    })),
    { label: 'Copy email address', hint: 'hi@genedai.me', keywords: 'contact mail',
      run: () => navigator.clipboard?.writeText('hi@genedai.me').then(() => flash('Copied hi@genedai.me')) },
    { label: 'Send an email', hint: 'mailto', keywords: 'contact', run: () => { location.href = 'mailto:hi@genedai.me'; } },
    { label: 'Go to homepage', hint: '/', keywords: 'home cd', run: () => { location.href = '/'; } },
    { label: 'Toggle dark mode', hint: 'theme', keywords: 'light dark color', run: toggleTheme },
    ...(article ? [{ label: 'Toggle Markdown source view', hint: '?view=source', keywords: 'raw md code', run: () => setSource(!sourceOn()) }] : []),
    { label: 'Open raw genedai.md', hint: '/genedai.md', keywords: 'markdown download', run: () => open('/genedai.md') },
    { label: 'Open llms.txt', hint: '/llms.txt', keywords: 'ai agents llm', run: () => open('/llms.txt') },
    ...(article ? [] : [{ label: 'Go to Projects', hint: '/#projects', run: () => { location.href = '/#projects'; } }]),
    ...(article ? [{ label: 'Print as one-page CV', hint: '⌘P', keywords: 'resume pdf', run: () => { if (sourceOn()) setSource(false); setTimeout(() => window.print(), 50); } }] : []),
  ];

  const dialog = d.createElement('dialog');
  dialog.className = 'palette';
  dialog.setAttribute('aria-label', 'Command menu');
  dialog.innerHTML = `
    <input type="text" placeholder="Type a command or search…" aria-label="Search commands"
      role="combobox" aria-expanded="true" aria-controls="palette-list" autocomplete="off" spellcheck="false">
    <ul id="palette-list" role="listbox"></ul>
    <div class="foot" aria-live="polite">↑↓ navigate · ↵ run · esc close</div>`;
  d.body.append(dialog);
  const input = dialog.querySelector('input');
  const list = dialog.querySelector('ul');
  const foot = dialog.querySelector('.foot');
  const footDefault = foot.textContent;

  function flash(msg) {
    foot.textContent = msg;
    setTimeout(() => { foot.textContent = footDefault; }, 1600);
  }

  // Every query character must appear in order (loose fuzzy match).
  const matches = (q, s) => {
    let i = 0;
    for (const c of s.toLowerCase()) if (c === q[i]) i++;
    return i === q.length;
  };

  let shown = [];
  let active = 0;
  function render() {
    const q = input.value.trim().toLowerCase().replace(/\s+/g, '');
    shown = commands.filter((c) => !q || matches(q, `${c.label} ${c.hint} ${c.keywords ?? ''}`));
    // Commands whose name contains the query come first.
    const inName = (c) => c.label.toLowerCase().replace(/\s+/g, '').includes(q);
    if (q) shown.sort((a, b) => inName(b) - inName(a));
    active = Math.min(active, Math.max(shown.length - 1, 0));
    list.innerHTML = shown.length
      ? shown.map((c, i) => `<li id="cmd-${i}" role="option" aria-selected="${i === active}"><span>${esc(c.label)}</span><span class="hint">${esc(c.hint)}</span></li>`).join('')
      : '<li class="empty" role="option" aria-disabled="true">No matching command</li>';
    input.setAttribute('aria-activedescendant', shown.length ? `cmd-${active}` : '');
    list.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: 'nearest' });
  }

  function run(i) {
    const cmd = shown[i];
    if (!cmd) return;
    if (!cmd.label.startsWith('Copy')) dialog.close();
    cmd.run();
  }

  function openPalette() {
    if (dialog.open) return dialog.close();
    input.value = '';
    active = 0;
    render();
    dialog.showModal();
    input.focus();
  }

  input.addEventListener('input', () => { active = 0; render(); });
  input.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      if (!shown.length) return;
      active = (active + (e.key === 'ArrowDown' ? 1 : -1) + shown.length) % shown.length;
      render();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      run(active);
    }
  });
  list.addEventListener('click', (e) => {
    const li = e.target.closest('li[id]');
    if (li) run(Number(li.id.slice(4)));
  });
  dialog.addEventListener('click', (e) => { if (e.target === dialog) dialog.close(); });

  d.querySelectorAll('[data-action="palette"]').forEach((b) => b.addEventListener('click', openPalette));
  d.addEventListener('keydown', (e) => {
    const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(d.activeElement?.tagName) || d.activeElement?.isContentEditable;
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      openPalette();
    } else if (e.key === '/' && !typing && !dialog.open) {
      e.preventDefault();
      openPalette();
    }
  });
})();
