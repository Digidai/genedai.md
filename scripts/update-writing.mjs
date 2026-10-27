#!/usr/bin/env node
// Refresh the "latest writing" lists in public/index.html, genedai.md, and llms.txt
// from the blog's Atom feed. Run daily by .github/workflows/daily-refresh.yml.
// Pure Node stdlib.

import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const FEED = 'https://genedai.me/atom.xml';
const COUNT = 5;
const PUB = resolve(import.meta.dirname, '..', 'public');

const res = await fetch(FEED, { headers: { 'User-Agent': 'genedai.md-writing' } });
if (!res.ok) throw new Error(`${FEED}: ${res.status}`);
const xml = await res.text();

const unxml = (s) => s
  .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
  .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"')
  .replace(/&apos;/g, "'").replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(n))
  .replace(/&amp;/g, '&');
const html = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const posts = [...xml.matchAll(/<entry>([\s\S]*?)<\/entry>/g)].slice(0, COUNT).map(([, e]) => ({
  title: unxml(e.match(/<title[^>]*>([\s\S]*?)<\/title>/)[1]).trim(),
  // The feed links to the GitHub Pages host; the blog's own domain serves the same paths.
  url: e.match(/<link[^>]*href="([^"]+)"/)[1].replace(/^https:\/\/digidai\.github\.io\//, 'https://genedai.me/'),
  date: e.match(/<published>(\d{4}-\d{2}-\d{2})/)[1],
}));
if (posts.length === 0) throw new Error('feed has no entries');

const block = (file, render) => {
  const path = resolve(PUB, file);
  const src = readFileSync(path, 'utf8');
  const re = /(<!-- writing:start -->)[\s\S]*?(\n[ \t]*<!-- writing:end -->)/;
  if (!re.test(src)) throw new Error(`${file}: writing markers missing`);
  const out = src.replace(re, (_, a, b) => `${a}\n${render()}${b}`);
  if (out !== src) { writeFileSync(path, out); console.log(`${file}: updated`); }
};

// Same five posts as schema.org BlogPosting entries, so search and AI engines can cite them.
const ld = {
  '@context': 'https://schema.org',
  '@type': 'ItemList',
  name: 'Latest writing by Gene Dai',
  url: 'https://genedai.me',
  itemListElement: posts.map((p, i) => ({
    '@type': 'ListItem',
    position: i + 1,
    item: {
      '@type': 'BlogPosting',
      headline: p.title,
      url: p.url,
      datePublished: p.date,
      author: { '@type': 'Person', name: 'Gene Dai', url: 'https://genedai.md/' },
    },
  })),
};
{
  const path = resolve(PUB, 'index.html');
  const src = readFileSync(path, 'utf8');
  const re = /(<script type="application\/ld\+json" id="ld-writing">)[\s\S]*?(<\/script>)/;
  if (!re.test(src)) throw new Error('index.html: ld-writing block missing');
  const json = JSON.stringify(ld, null, 2).replace(/</g, '\\u003c').replace(/\n/g, '\n  ');
  const out = src.replace(re, (_, a, b) => `${a}\n  ${json}\n  ${b}`);
  if (out !== src) { writeFileSync(path, out); console.log('index.html: JSON-LD updated'); }
}

block('index.html', () => posts.map((p) =>
  `        <li><time class="meta" datetime="${p.date}">${p.date}</time> <a href="${html(p.url)}" target="_blank" rel="noopener">${html(p.title)}</a></li>`
).join('\n'));
block('llms.txt', () => posts.map((p) =>
  `- [${p.title.replace(/([[\]])/g, '\\$1')}](${p.url}): ${p.date}`
).join('\n'));
block('genedai.md', () => posts.map((p) =>
  `- ${p.date} [${p.title.replace(/([[\]])/g, '\\$1')}](${p.url})`
).join('\n'));
console.log(`latest: ${posts.map((p) => p.date).join(', ')}`);
