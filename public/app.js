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
  // The Chinese page (/zh/) has lang="zh-CN"; t() picks its wording.
  const zh = d.documentElement.lang.startsWith('zh');
  const t = (en, cn) => (zh ? cn : en);
  // Each feature's state is mirrored on <html> so CSS, tests and agents can read it:
  // data-theme (when chosen), data-view (page | loading | source), data-cards (idle | loading | ready | failed).
  const root = d.documentElement;

  // ── Chinese-version hint ───────────────────────────
  // Readers whose browser prefers Chinese get a small note pointing to /zh/.
  // No redirect; closing it is remembered.
  try {
    if (!zh && localStorage.getItem('zh-hint') !== 'off' &&
        (navigator.languages || [navigator.language]).some((l) => /^zh/i.test(l))) {
      const bar = d.createElement('aside');
      bar.className = 'zh-hint';
      bar.lang = 'zh-CN';
      bar.setAttribute('aria-label', '中文版提示');
      bar.innerHTML = '<a href="/zh/" hreflang="zh-CN">本页有中文版 →</a><button type="button" aria-label="关闭">×</button>';
      const off = () => { try { localStorage.setItem('zh-hint', 'off'); } catch {} bar.remove(); };
      bar.querySelector('a').addEventListener('click', off);
      bar.querySelector('button').addEventListener('click', off);
      d.body.append(bar);
    }
  } catch {}

  // ── Theme ──────────────────────────────────────────
  // The inline <head> script applies a saved choice before first paint.
  // States: system (no data-theme, follows the OS), light, dark. A toggle picks the opposite of
  // what is showing and remembers it. The theme button reports dark mode as pressed.
  const systemDark = matchMedia('(prefers-color-scheme: dark)');
  const darkNow = () => root.dataset.theme ? root.dataset.theme === 'dark' : systemDark.matches;
  const themeButtons = d.querySelectorAll('[data-action="theme"]');
  const syncTheme = () => themeButtons.forEach((b) => b.setAttribute('aria-pressed', String(darkNow())));
  function toggleTheme() {
    const next = darkNow() ? 'light' : 'dark';
    root.dataset.theme = next;
    try { localStorage.setItem('theme', next); } catch {}
    syncTheme();
  }
  themeButtons.forEach((b) => b.addEventListener('click', toggleTheme));
  systemDark.addEventListener('change', syncTheme);
  syncTheme();

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

  // View: page ⇄ source. The first switch to source fetches /genedai.md (loading); a request made
  // meanwhile is kept in `want` and applied when the fetch ends, so the source is built once.
  let view = 'page', want = false, sourceEl = null;
  async function setSource(on) {
    want = on;
    if (!article || view === 'loading') return;
    if (on && !sourceEl) {
      view = root.dataset.view = 'loading';
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
    view = root.dataset.view = want ? 'source' : 'page';
    if (sourceEl) sourceEl.hidden = !want;
    article.hidden = want;
    const url = new URL(location.href);
    want ? url.searchParams.set('view', 'source') : url.searchParams.delete('view');
    history.replaceState(null, '', url);
  }
  const sourceOn = () => view === 'source';
  if (article) root.dataset.view = view;

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
      label: t(`Go to ${text(s.querySelector('h2'))}`, `前往「${text(s.querySelector('h2'))}」`), hint: `#${s.id}`, run: () => goTo(s.id),
    })),
    ...[...d.querySelectorAll('.md-link')].map((a) => ({
      label: t(`Open ${text(a.querySelector('.link-title'))}`, `打开 ${text(a.querySelector('.link-title'))}`),
      hint: new URL(a.href).hostname,
      keywords: text(a.querySelector('.link-desc')),
      run: () => open(a.href),
    })),
    ...[...d.querySelectorAll('#journey [data-ent]')].map((el) => ({
      label: t(`Show ${text(el)}`, `查看 ${text(el)}`), hint: t('journey', '经历'),
      keywords: text(el.closest('li')),
      run: () => { el.scrollIntoView({ block: 'center' }); el.focus({ preventScroll: true }); el.click(); },
    })),
    ...[...d.querySelectorAll('.connect-links a')].map((a) => ({
      label: t(`Open ${text(a)}`, `打开 ${text(a)}`), hint: new URL(a.href).hostname, run: () => open(a.href),
    })),
    { label: t('Download CV (PDF)', '下载简历（PDF）'), hint: t('/gene-dai-cv.pdf', '/gene-dai-cv-zh.pdf'), keywords: 'resume cv pdf download 简历', run: () => { location.href = t('/gene-dai-cv.pdf', '/gene-dai-cv-zh.pdf'); } },
    { label: t('Copy email address', '复制邮箱地址'), hint: 'hi@genedai.me', keywords: 'contact mail 邮件', stay: true,
      run: () => navigator.clipboard?.writeText('hi@genedai.me').then(() => flash(t('Copied hi@genedai.me', '已复制 hi@genedai.me'))) },
    { label: t('Send an email', '发送邮件'), hint: 'mailto', keywords: 'contact 联系', run: () => { location.href = 'mailto:hi@genedai.me'; } },
    { label: t('中文版', 'English version'), hint: t('/zh/', '/'), keywords: 'language chinese english zh en 语言', run: () => { location.href = t('/zh/', '/'); } },
    { label: t('Go to homepage', '回到首页'), hint: t('/', '/zh/'), keywords: 'home cd 首页', run: () => { location.href = t('/', '/zh/'); } },
    { label: t('Toggle dark mode', '切换深色模式'), hint: 'theme', keywords: 'light dark color 主题', run: toggleTheme },
    ...(article && !zh ? [{ label: 'Toggle Markdown source view', hint: '?view=source', keywords: 'raw md code', run: () => setSource(!sourceOn()) }] : []),
    { label: t('Open raw genedai.md', '打开 genedai.md（英文 Markdown）'), hint: '/genedai.md', keywords: 'markdown download', run: () => open('/genedai.md') },
    { label: t('Open llms.txt', '打开 llms.txt'), hint: '/llms.txt', keywords: 'ai agents llm', run: () => open('/llms.txt') },
    ...(article ? [] : [{ label: 'Go to Projects', hint: '/#projects', run: () => { location.href = '/#projects'; } }]),
    ...(article ? [{ label: t('Print as one-page CV', '打印一页简历'), hint: '⌘P', keywords: 'resume pdf 简历 打印', run: () => { if (sourceOn()) setSource(false); setTimeout(() => window.print(), 50); } }] : []),
  ];

  const dialog = d.createElement('dialog');
  dialog.className = 'palette';
  dialog.setAttribute('aria-label', t('Command menu', '命令菜单'));
  dialog.innerHTML = `
    <input type="text" placeholder="${t('Type a command or search…', '输入命令或搜索…')}" aria-label="${t('Search commands', '搜索命令')}"
      role="combobox" aria-expanded="true" aria-controls="palette-list" autocomplete="off" spellcheck="false">
    <ul id="palette-list" role="listbox"></ul>
    <div class="foot" aria-live="polite">${matchMedia('(hover: none)').matches ? t('Tap a command to run it', '点一下即可执行') : t('↑↓ navigate · ↵ run · esc close', '↑↓ 选择 · ↵ 执行 · esc 关闭')}</div>`;
  d.body.append(dialog);
  const input = dialog.querySelector('input');
  const list = dialog.querySelector('ul');
  const foot = dialog.querySelector('.foot');
  const footDefault = foot.textContent;

  // The footer shows its hints, or a short message; a new message restarts the timer.
  let flashTimer = 0;
  function flash(msg) {
    clearTimeout(flashTimer);
    foot.textContent = msg;
    flashTimer = setTimeout(() => { foot.textContent = footDefault; }, 1600);
  }

  // A command matches when the query characters appear in order in its name (loose
  // fuzzy match), or the whole query appears in its hint or keywords.
  const squash = (s) => s.toLowerCase().replace(/\s+/g, '');
  const matches = (q, c) => {
    let i = 0;
    for (const ch of squash(c.label)) if (ch === q[i]) i++;
    return i === q.length || squash(`${c.hint} ${c.keywords ?? ''}`).includes(q);
  };

  let shown = [];
  let active = 0;
  function render() {
    const q = input.value.trim().toLowerCase().replace(/\s+/g, '');
    shown = commands.filter((c) => !q || matches(q, c));
    // Commands whose name contains the query come first.
    const inName = (c) => c.label.toLowerCase().replace(/\s+/g, '').includes(q);
    if (q) shown.sort((a, b) => inName(b) - inName(a));
    active = Math.min(active, Math.max(shown.length - 1, 0));
    list.innerHTML = shown.length
      ? shown.map((c, i) => `<li id="cmd-${i}" role="option" aria-selected="${i === active}"><span>${esc(c.label)}</span><span class="hint">${esc(c.hint)}</span></li>`).join('')
      : `<li class="empty" role="option" aria-disabled="true">${t('No matching command', '没有匹配的命令')}</li>`;
    input.setAttribute('aria-activedescendant', shown.length ? `cmd-${active}` : '');
    list.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: 'nearest' });
  }

  function run(i) {
    const cmd = shown[i];
    if (!cmd) return;
    if (!cmd.stay) dialog.close();
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

  // ── Hover cards ────────────────────────────────────
  // Names marked data-ent open a card with an animated isometric figure. The card
  // code (cards.js) loads when the page is idle; each figure (/figs/<id>.json) loads when first needed.
  // Card code: idle → loading → ready, or failed. While idle or loading, this hands each event to
  // start() once the code arrives; when ready, cards.js listens itself. If it fails (offline, blocked),
  // names stay plain text and links, so a tap on a project still opens it.
  let cardsLoad = null;
  const setCards = (s) => { root.dataset.cards = s; };
  setCards('idle');
  const loadCards = () => (cardsLoad ||= (setCards('loading'), import('/cards.js?v=9113cf88a8').then(
    (m) => { setCards('ready'); return m; },
    (err) => { setCards('failed'); console.warn('Hover cards unavailable:', err); return null; })));
  const wake = (e) => {
    const el = e.target.closest?.('[data-ent]');
    if (!el || (e.type === 'pointerover' && e.pointerType !== 'mouse')) return;
    if (root.dataset.cards === 'ready' || root.dataset.cards === 'failed') return;
    // On touch screens the first tap on a linked name opens its card instead of leaving the page.
    if (e.type === 'click' && !el.matches('[role="button"]') && matchMedia('(hover: none)').matches) e.preventDefault();
    loadCards().then((m) => m?.start(el, e.type));
  };
  ['pointerover', 'focusin', 'click'].forEach((t) => d.addEventListener(t, wake, { passive: t !== 'click' }));
  // Load the card code once the page is idle, so the first card opens without waiting for it.
  (window.requestIdleCallback || setTimeout)(loadCards);

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
