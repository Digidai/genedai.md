#!/usr/bin/env node
// Builds public/zh/index.html, the Chinese homepage, from public/index.html.
// The English page is the single source: this file only swaps text. Every English
// string below must still exist in index.html, so an edit there that the table
// doesn't cover fails loudly here (and in verify.mjs) instead of drifting.
// Run after editing index.html, stamp-assets.mjs, or the daily refresh scripts.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

const PUB = resolve(import.meta.dirname, '..', 'public');

const ent = (id, en, zh) => [`data-ent="${id}" tabindex="0" role="button" aria-haspopup="dialog">${en}</span>`, `data-ent="${id}" tabindex="0" role="button" aria-haspopup="dialog">${zh}</span>`];

// [English, Chinese]. Each English string is replaced everywhere it occurs.
const TEXT = [
  // ── <head>
  ['<html lang="en">', '<html lang="zh-CN">'],
  ['<title>Gene Dai — Product Builder | Co-Founder &amp; CPO @ Metix AI</title>', '<title>戴金乘 Gene Dai — Metix AI 联合创始人兼首席产品官</title>'],
  ['<meta name="description" content="Gene Dai is Co-Founder &amp; CPO of Metix AI, an AI-native hiring platform. Previously led products at BOSS Zhipin, Liepin, and Zuoyebang." />', '<meta name="description" content="戴金乘（Gene Dai），AI 原生招聘平台 Metix AI 联合创始人兼首席产品官（CPO），曾在 BOSS直聘、猎聘、作业帮负责产品。" />'],
  ['<meta name="author" content="Gene Dai" />', '<meta name="author" content="戴金乘 Gene Dai" />'],
  ['<link rel="canonical" href="https://genedai.md/" />', '<link rel="canonical" href="https://genedai.md/zh/" />'],
  ['<meta property="og:title" content="Gene Dai — Product Builder" />', '<meta property="og:title" content="戴金乘 Gene Dai — 招聘产品人" />'],
  ['<meta property="og:description" content="Co-Founder &amp; CPO of Metix AI, an AI-native hiring platform. Previously led products at BOSS Zhipin, Liepin, and Zuoyebang." />', '<meta property="og:description" content="AI 原生招聘平台 Metix AI 联合创始人兼首席产品官，曾在 BOSS直聘、猎聘、作业帮负责产品。" />'],
  ['<meta property="og:url" content="https://genedai.md/" />', '<meta property="og:url" content="https://genedai.md/zh/" />'],
  ['<meta property="og:locale" content="en_US" />', '<meta property="og:locale" content="zh_CN" />\n  <meta property="og:locale:alternate" content="en_US" />'],
  ['https://genedai.md/og-image.png?v=2', 'https://genedai.md/og-image-zh.png?v=1'],
  ['<meta property="og:image:alt" content="Gene Dai — Co-Founder &amp; CPO, Metix AI. Previously BOSS Zhipin, Liepin, Zuoyebang." />', '<meta property="og:image:alt" content="戴金乘 Gene Dai，Metix AI 联合创始人兼首席产品官，曾任职 BOSS直聘、猎聘、作业帮。" />'],
  ['<meta name="twitter:image:alt" content="Gene Dai — Product Builder" />', '<meta name="twitter:image:alt" content="戴金乘 Gene Dai — 招聘产品人" />'],
  ['<meta name="twitter:title" content="Gene Dai — Product Builder" />', '<meta name="twitter:title" content="戴金乘 Gene Dai — 招聘产品人" />'],
  ['<meta name="twitter:description" content="Co-Founder &amp; CPO of Metix AI, an AI-native hiring platform." />', '<meta name="twitter:description" content="AI 原生招聘平台 Metix AI 联合创始人兼首席产品官。" />'],
  ['    "url": "https://genedai.md/",\n    "name": "Gene Dai — Product Builder",\n    "description": "Personal homepage of Gene Dai, Co-Founder & CPO of Metix AI.",', '    "url": "https://genedai.md/zh/",\n    "name": "戴金乘 Gene Dai — 招聘产品人",\n    "description": "戴金乘（Gene Dai）的个人主页，Metix AI 联合创始人兼首席产品官。",'],
  ['"inLanguage": "en-US"', '"inLanguage": "zh-CN"'],
  ['"description": "Gene Dai is a product builder and Co-Founder & CPO of Metix AI, an AI-native hiring platform that reached #1 on Product Hunt. He previously led products at BOSS Zhipin, Liepin, Zuoyebang, and Zhidemai Tech across recruiting, education, and e-commerce."', '"description": "戴金乘（Gene Dai），产品人，AI 原生招聘平台 Metix AI 联合创始人兼首席产品官，Metix AI 曾获 Product Hunt 当日第一。此前在 BOSS直聘、猎聘、作业帮和值得买科技负责产品，覆盖招聘、教育和电商。"'],

  // ── Header
  ['<a class="skip-link" href="#main">Skip to content</a>', '<a class="skip-link" href="#main">跳到正文</a>'],
  ['<nav aria-label="Main navigation">', '<nav aria-label="主导航">'],
  ['<a class="nav-path" href="/">Gene Dai</a>', '<a class="nav-path" href="/zh/">戴金乘</a>'],
  ['<a href="#about">About</a>', '<a href="#about">简介</a>'],
  ['<a href="#journey">Journey</a>', '<a href="#journey">经历</a>'],
  ['<a href="#projects">Projects</a>', '<a href="#projects">项目</a>'],
  ['<a href="#writing">Writing</a>', '<a href="#writing">文章</a>'],
  ['<a href="#connect">Connect</a>', '<a href="#connect">联系</a>'],
  ['<a class="nav-btn nav-lang" href="/zh/" hreflang="zh-CN" lang="zh-CN" title="中文版">中文</a>', '<a class="nav-btn nav-lang" href="/" hreflang="en" lang="en" title="English version">EN</a>'],
  ['title="Search and commands (⌘K / Ctrl K)"><span class="hide-mobile">Search</span><span class="show-mobile">menu</span>', 'title="搜索和命令（⌘K / Ctrl K）"><span class="hide-mobile">搜索</span><span class="show-mobile">菜单</span>'],
  ['aria-label="Toggle dark mode"', 'aria-label="切换深色模式"'],

  // ── Hero
  ['<section class="hero" aria-label="Introduction">', '<section class="hero" aria-label="介绍">'],
  ['<span class="hm-label">Now</span> Building HR tools and AI agents for hiring, at Metix AI and in the open<br>California · Updated ', '<span class="hm-label">现在</span> 在 Metix AI 做招聘工具和 AI 智能体，也做开源<br>美国加州 · 更新于 '],
  ['alt="Gene Dai" />', 'alt="戴金乘 Gene Dai" />'],
  ['<h1 class="md-h1">Gene Dai</h1>', '<h1 class="md-h1">戴金乘 <span class="h1-en">Gene Dai</span></h1>'],
  ['linkedin.com/in/genedai · California</p>', 'linkedin.com/in/genedai · 美国加州</p>'],
  ['<p class="lead">I build hiring products. I led products for candidates, employers, and headhunters at ', '<p class="lead">我做招聘产品。曾在 '],
  ['</span> and <span class="ent" data-ent="liepin"', '</span> 和 <span class="ent" data-ent="liepin"'],
  [', and now co-found <a href="https://metix.ai" target="_blank" rel="noopener" data-ent="metix">Metix AI</a>, an <em>AI-native hiring platform</em>.</p>', ' 负责求职者、企业和猎头三端产品，现在联合创办 AI 原生招聘平台 <a href="https://metix.ai" target="_blank" rel="noopener" data-ent="metix">Metix AI</a>。</p>'],
  ['<span class="badge">User Growth</span>', '<span class="badge">用户增长</span>'],
  ['<span class="badge">Platform Products</span>', '<span class="badge">平台产品</span>'],
  ['<span class="badge">AI Hiring</span>', '<span class="badge">AI 招聘</span>'],

  // ── About
  ['<h2 class="md-h2">About</h2>', '<h2 class="md-h2">简介</h2>'],
  ['<p>Gene Dai is a product builder and Co-Founder &amp; CPO of Metix AI, an AI hiring platform that reached <a href="https://www.producthunt.com/products/openjobs-ai" target="_blank" rel="noopener">#1 on Product Hunt</a>. He previously held senior product leadership roles at BOSS Zhipin (BZ/2076.HK), China\'s leading mobile recruiting platform, Liepin (6100.HK), Zuoyebang, and Zhidemai Tech (300785.SZ), spanning recruiting, education, and e-commerce. He writes on AI and HRTech across Medium, Substack, and his personal blog, and maintains 160+ open-source repositories on GitHub.</p>', '<p>戴金乘（Gene Dai），产品人，AI 招聘平台 Metix AI 联合创始人兼首席产品官，Metix AI 曾获 <a href="https://www.producthunt.com/products/openjobs-ai" target="_blank" rel="noopener">Product Hunt 当日第一</a>。此前在 BOSS直聘（BZ/2076.HK，中国领先的移动招聘平台）、猎聘（6100.HK）、作业帮和值得买科技（300785.SZ）担任产品负责人，覆盖招聘、教育和电商。他在 Medium、Substack 和个人博客上写 AI 与 HRTech，并在 GitHub 维护 160 多个开源项目。</p>'],
  ['<figcaption>How I think about products</figcaption>', '<figcaption>我怎么看产品</figcaption>'],
  ['<blockquote><p>Conversation is an interaction model with stronger feedback than anything before it. So when the work is getting a task done efficiently, two things become critical: the purpose, and the experience of the flow toward the goal.</p></blockquote>', '<blockquote><p>对话是前所未有的强反馈的交互模式，而在完成任务、追求效率的过程中，目的和目标流程体验就变得极其重要。</p></blockquote>'],
  ['<li><span class="title">AI Hiring</span> <span class="desc">— Building Metix: define a role and meet interview-ready candidates within 24 hours.</span></li>', '<li><span class="title">AI 招聘</span> <span class="desc">— 打造 Metix：定义岗位，24 小时内见到可以面试的候选人。</span></li>'],
  ['<li><span class="title">Growth &amp; Platforms</span> <span class="desc">— User growth, community, and platform products for consumer apps in recruiting, education, and e-commerce.</span></li>', '<li><span class="title">增长与平台</span> <span class="desc">— 招聘、教育和电商类消费级应用的用户增长、社区和平台产品。</span></li>'],
  ['<li><span class="title">Domain Expertise</span> <span class="desc">— Built products for all three sides of hiring (candidates, employers, and headhunters) at Kanzhun, BOSS Zhipin, and Liepin.</span></li>', '<li><span class="title">行业积累</span> <span class="desc">— 在看准、BOSS直聘和猎聘做过招聘三端（求职者、企业、猎头）的产品。</span></li>'],
  ['<li><span class="title">Builder &amp; Writer</span> <span class="desc">— Writing on AI, HRTech, and the people shaping the industry.</span></li>', '<li><span class="title">构建与写作</span> <span class="desc">— 写 AI、HRTech，以及塑造这个行业的人。</span></li>'],

  // ── Journey
  ['<h2 class="md-h2">Journey</h2>', '<h2 class="md-h2">经历</h2>'],
  ['<p>From Beijing to California.</p>', '<p>从北京到加州。</p>'],
  ['<span class="hint-hover">Hover a company to see what it does.</span><span class="hint-tap">Tap a company to see what it does.</span>', '<span class="hint-hover">鼠标悬停在公司名上，可以看到它做什么。</span><span class="hint-tap">点一下公司名，可以看到它做什么。</span>'],
  ['<span class="title">Co-Founder &amp; CPO</span><span class="current-tag">current</span>', '<span class="title">联合创始人 / 首席产品官（CPO）</span><span class="current-tag">在职</span>'],
  ['Metix AI</span> — AI hiring platform</span>', 'Metix AI</span> — AI 招聘平台</span>'],
  ['<span class="meta">2025 – Present</span>', '<span class="meta">2025 – 至今</span>'],
  ['<span class="title">Head of Product Management</span>', '<span class="title">平台产品负责人</span>'],
  ent('zuoyebang', 'Zuoyebang', '作业帮'),
  [' — China\'s largest K12 online education platform</span>', ' — 中国最大的 K12 在线教育平台</span>'],
  ['<span class="title">Head of Product</span><br>', '<span class="title">用户产品部负责人</span><br>'],
  ent('liepin', 'Liepin', '猎聘'),
  [' (6100.HK) — Executive recruitment platform</span>', '（6100.HK）— 中高端人才招聘平台</span>'],
  ['<span class="title">Product Director</span>', '<span class="title">产品总监</span>'],
  ent('zhidemai', 'Zhidemai Tech', '值得买科技'),
  [' (300785.SZ) — Consumer content &amp; commerce platform</span>', '（300785.SZ）— 消费内容与电商平台</span>'],
  ['<span class="title">Head of Product <span class="also">(also led <span class="ent" data-ent="kanzhun" tabindex="0" role="button" aria-haspopup="dialog">Kanzhun.com</span>)</span></span>', '<span class="title"><span class="ent" data-ent="kanzhun" tabindex="0" role="button" aria-haspopup="dialog">看准</span>产品负责人 <span class="also">· 社交业务产品负责人</span></span>'],
  ent('bosszhipin', 'BOSS Zhipin', 'BOSS直聘'),
  [' (BZ/2076.HK) — <span class="print-short" data-short="Mobile recruiting platform">China\'s leading mobile recruiting platform</span></span>', '（BZ/2076.HK）— <span class="print-short" data-short="移动招聘平台">中国领先的移动招聘平台</span></span>'],
  ['<span class="title">Senior Product Manager</span>', '<span class="title">高级产品经理 / 产品负责人</span>'],
  ent('dora', 'Dora Tech', '多拉打印'),
  [' — Self-service shared printing (Sequoia Capital China backed)</span>', ' — 自助共享打印（红杉中国投资）</span>'],
  ['<span class="title">Co-founder &amp; Chief Product Officer</span>', '<span class="title">公司合伙人 / 产品负责人</span>'],
  ['Feel</span> — Health &amp; fitness app (ZhenFund backed)</span>', 'Feel</span> — 健身运动 App（真格基金投资）</span>'],
  ent('beihang', 'Beihang University', '北京航空航天大学'),
  ['<span class="desc">Computer Software Engineering</span>', '<span class="desc">移动云计算 · 硕士</span>'],
  ['<span class="meta">2013 · Education</span>', '<span class="meta">2013 · 教育</span>'],

  // ── Projects
  ['<h2 class="md-h2">Projects</h2>', '<h2 class="md-h2">项目</h2>'],
  ['<p>Products, tools, and resources — mostly at the intersection of AI and hiring.</p>', '<p>产品、工具和资料，大多和 AI 与招聘有关。</p>'],
  ['<span class="hint-hover">Hover a project for a quick look; click to visit.</span><span class="hint-tap">Tap a project for a quick look; tap again to visit.</span>', '<span class="hint-hover">鼠标悬停可以快速预览，点击访问。</span><span class="hint-tap">点一下快速预览，再点一下访问。</span>'],
  ['AI hiring platform. Define the role and meet interview-ready candidates: Metix AI reports 95% of roles get a first interview scheduled within 24 hours. <span class="activity">in production · since 2025</span>', 'AI 招聘平台。定义岗位，就能见到可以面试的候选人：据 Metix AI 统计，95% 的岗位在 24 小时内约上第一场面试。<span class="activity">已上线 · 2025 年起</span>'],
  ['<span class="link-tag">AI Hiring</span>', '<span class="link-tag">AI 招聘</span>'],
  ['A shared workspace where product teams hand tasks to AI agents, review the results, and approve decisions. Private beta. ', '产品团队的协作空间：把任务交给 AI 智能体，审阅结果，审批决策。内测中。'],
  ['<span class="link-tag">AI Agents</span>', '<span class="link-tag">AI 智能体</span>'],
  ['Startup research on products, funding, and investors. 400+ company profiles across AI agents, developer tools, healthcare, and more. <span class="activity">live · weekly digest</span>', '创业公司研究：产品、融资和投资人。收录 400 多家公司，覆盖 AI 智能体、开发者工具、医疗健康等领域。<span class="activity">运营中 · 每周简报</span>'],
  ['<span class="link-tag">Research</span>', '<span class="link-tag">研究</span>'],
  ['249 HR AI products across five technology eras, from 1990s applicant-tracking systems to today’s AI agents, with analysis pages and evaluation checklists. ', '收录 249 款 HR AI 产品，横跨五个技术时代，从 1990 年代的招聘管理系统到今天的 AI 智能体，附分析页面和评估清单。'],
  ['<span class="link-tag">Directory</span>', '<span class="link-tag">目录</span>'],
  ['Turns any web page into clean text that AI tools can read. Free, with an API for developers. ', '把任何网页转成 AI 工具能读的干净文本。免费，并为开发者提供 API。'],
  ['<span class="link-tag">Dev Tool</span>', '<span class="link-tag">开发工具</span>'],
  ['Free AI resume builder with 28 templates and instant PDF export. ', '免费的 AI 简历生成器，28 套模板，一键导出 PDF。'],
  ['<span class="link-tag">Resume</span>', '<span class="link-tag">简历</span>'],
  ['A map of recruiting and AI hiring tools: 320 categories, 2,100+ resources. ', '招聘和 AI 招聘工具地图：320 个分类，2,100 多项资源。'],

  // ── Writing
  ['<h2 class="md-h2">Writing</h2>', '<h2 class="md-h2">文章</h2>'],
  ['<p>Deep dives into AI leaders, HRTech platforms, and the forces reshaping how companies find talent.</p>', '<p>深度写作：AI 领袖、HRTech 平台，以及正在改变企业招人方式的力量。</p>'],
  ['<h3 class="md-h3 posts-head">Start here</h3>', '<h3 class="md-h3 posts-head">从这里开始</h3>'],
  ['aria-label="Start here"', 'aria-label="从这里开始"'],
  ['<span class="meta">Research</span>', '<span class="meta">研究</span>'],
  ['>AI hiring procurement evidence</a> <span class="pick-desc">— vendor claims, audit scope, and the questions buyers should still ask</span>', '>AI 招聘采购证据</a> <span class="pick-desc">— 供应商的说法、审计范围，以及买方还应该追问的问题</span>'],
  ['>AI and employment evidence</a> <span class="pick-desc">— what the studies on AI and jobs actually measure</span>', '>AI 与就业证据</a> <span class="pick-desc">— 关于 AI 和工作的研究，到底测量了什么</span>'],
  ['<span class="meta">Q&amp;A</span>', '<span class="meta">问答</span>'],
  ['>Answers about AI hiring and work</a> <span class="pick-desc">— short answers with primary sources and dates</span>', '>AI 招聘与工作问答</a> <span class="pick-desc">— 简短回答，附原始出处和日期</span>'],
  ['>All writing on genedai.me →</a>', '>在 genedai.me 查看全部文章 →</a>'],

  // ── Connect
  ['<h2 class="md-h2">Connect</h2>', '<h2 class="md-h2">联系</h2>'],
  ['<li><span class="title">Need a CV?</span> <span class="desc">— <a href="/gene-dai-cv.pdf" download="Gene-Dai-CV.pdf">Download a one-page CV (PDF)</a>.</span></li>', '<li><span class="title">需要简历？</span> <span class="desc">— <a href="/gene-dai-cv-zh.pdf" download="Gene-Dai-CV-zh.pdf">下载一页中文简历（PDF）</a>，也有<a href="/gene-dai-cv.pdf" download="Gene-Dai-CV.pdf" hreflang="en">英文版</a>。</span></li>'],
  ['<li><span class="title">Hiring?</span> <span class="desc">— Try <a href="https://metix.ai" target="_blank" rel="noopener">Metix AI</a>: define the role and meet interview-ready candidates.</span></li>', '<li><span class="title">在招人？</span> <span class="desc">— 试试 <a href="https://metix.ai" target="_blank" rel="noopener">Metix AI</a>：定义岗位，见到可以面试的候选人。</span></li>'],
  ['<li><span class="title">Building or backing HR tech?</span> <span class="desc">— Email <a href="mailto:hi@genedai.me">hi@genedai.me</a>. Founders, operators, and investors in AI hiring are welcome.</span></li>', '<li><span class="title">在做或在投 HR 科技？</span> <span class="desc">— 发邮件到 <a href="mailto:hi@genedai.me">hi@genedai.me</a>。欢迎 AI 招聘领域的创业者、从业者和投资人。</span></li>'],
  ['<li><span class="title">Researching AI and work?</span> <span class="desc">— Start with the <a href="https://genedai.me/research/" target="_blank" rel="noopener">research pages</a> on genedai.me.</span></li>', '<li><span class="title">在研究 AI 与工作？</span> <span class="desc">— 可以从 genedai.me 的<a href="https://genedai.me/research/" target="_blank" rel="noopener">研究页面</a>开始。</span></li>'],
  ['rel="me noopener">Blog</a>', 'rel="me noopener">博客</a>'],
  // Chinese visitors get their own channels first.
  ['<div class="connect-links">\n        <a href="https://x.com/genedai"', '<div class="connect-links">\n        <a href="https://www.zhihu.com/people/digidai" target="_blank" rel="me noopener">知乎</a>\n        <span class="sep" aria-hidden="true">·</span>\n        <a href="https://web.okjike.com/u/633AAA79-CA7E-42E6-ACEA-6833F255F6E6" target="_blank" rel="me noopener">即刻</a>\n        <span class="sep" aria-hidden="true">·</span>\n        <a href="https://www.xiaohongshu.com/user/profile/53db4339b4c4d61da5f00b34" target="_blank" rel="me noopener">小红书</a>\n        <span class="sep" aria-hidden="true">·</span>\n        <a href="https://x.com/genedai"'],

  // ── Footer
  ['<p>genedai.md &middot; California &middot; &copy; Gene Dai</p>', '<p>genedai.md &middot; 美国加州 &middot; &copy; 戴金乘</p>'],
];

// Chinese typography: CJK fallbacks after the Latin faces, and no faux italics.
const ZH_CSS = `
    /* ── Chinese page (generated by scripts/build-zh.mjs) ── */
    :root {
      --font-sans: 'Inter', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', 'Noto Sans SC', system-ui, sans-serif;
      --font-serif: 'Source Serif 4', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', 'Noto Sans SC', Georgia, sans-serif;
      --font-mono: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, 'PingFang SC', 'Microsoft YaHei', monospace;
    }
    body { line-break: strict; }
    .viewpoint p, .lead em { font-style: normal; }
    .h1-en { color: var(--text-tertiary); font-weight: 300; }
    .hero-meta .hm-label { margin-right: 8px; }
  </style>`;

// Dates: the hero spells them out; list dates (monospace) and project activity stay compact.
const HERO_DATE = /(<time datetime="(\d{4})-(\d{2})-(\d{2})">)[^<]*(<\/time>)/g;
const LIST_DATE = /(<time class="meta" datetime="(\d{4})-(\d{2})-(\d{2})">)[^<]*(<\/time>)/g;
const ACTIVE = /active · (<time datetime="(\d{4})-(\d{2})-\d{2}">)[^<]*(<\/time>)/g;

// The latest-articles list is English-only, so the Chinese page leaves it (and its JSON-LD) out
// and keeps the "Start here" picks plus the link to genedai.me.
const LATEST = /\n      <h3 class="md-h3 posts-head">Latest<\/h3>\n      <ul class="md-list posts" aria-label="Latest articles">[\s\S]*?<\/ul>/;
const LD_WRITING = /\n  <!-- Schema.org JSON-LD: latest writing[^>]*-->\n  <script type="application\/ld\+json" id="ld-writing">[\s\S]*?<\/script>\n/;
// Chinese needs no space between Chinese characters, even across inline tags.
const CJK = '\\u3000-\\u303f\\u3400-\\u9fff\\uff00-\\uffef';
const CJK_SPACE = new RegExp(`(?<=[${CJK}])((?:<\\/(?:span|a)>)*) ((?:<(?:span|a)\\b[^>]*>)*)(?=[${CJK}])`, 'g');

export function buildZh(src) {
  let out = src;
  for (const [re, what] of [[LATEST, 'latest-articles list'], [LD_WRITING, 'ld-writing JSON-LD']]) {
    if (!re.test(out)) throw new Error(`build-zh: ${what} not found in index.html`);
    out = out.replace(re, '');
  }
  for (const [en, zh] of TEXT) {
    if (!out.includes(en)) throw new Error(`build-zh: English text not found in index.html (update scripts/build-zh.mjs):\n  ${en.slice(0, 160)}`);
    out = out.split(en).join(zh);
  }
  out = out.replace(ACTIVE, (_, open, y, m, close) => `活跃 · ${open}${y}.${m}${close}`);
  out = out.replace(LIST_DATE, (_, open, y, m, d, close) => `${open}${y}.${m}.${d}${close}`);
  out = out.replace(CJK_SPACE, '$1$2');
  out = out.replace(HERO_DATE, (all, open, y, m, d, close) => all.includes('.') ? all : `${open}${y} 年 ${+m} 月 ${+d} 日${close}`);
  if (!out.includes('  </style>')) throw new Error('build-zh: </style> not found');
  out = out.replace('\n  </style>', ZH_CSS);
  return out;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const out = buildZh(readFileSync(resolve(PUB, 'index.html'), 'utf8'));
  mkdirSync(resolve(PUB, 'zh'), { recursive: true });
  writeFileSync(resolve(PUB, 'zh', 'index.html'), out);
  console.log(`wrote public/zh/index.html (${(Buffer.byteLength(out) / 1024).toFixed(1)} KB)`);
}
