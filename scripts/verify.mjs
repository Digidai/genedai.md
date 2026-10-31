#!/usr/bin/env node
// Pre-deploy gate. Runs in CI and locally with `node scripts/verify.mjs`.
// Pure Node stdlib — no npm install required.

import { readFileSync, statSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..');
const PUB = resolve(ROOT, 'public');
const errors = [];
const warns = [];
const fail = (m) => errors.push(m);
const warn = (m) => warns.push(m);

function exists(p) {
  try { return statSync(p).isFile() || statSync(p).isDirectory(); } catch { return false; }
}

function readPub(rel) {
  return readFileSync(resolve(PUB, rel), 'utf8');
}

// 1. public/ exists and contains the expected files
if (!exists(PUB)) fail('public/ directory missing');
const required = [
  'index.html', '404.html', '_headers', '_redirects',
  'robots.txt', 'sitemap.xml', 'llms.txt', 'site.webmanifest',
  'favicon.svg', 'favicon-32.png', 'apple-touch-icon.png',
  'icon-192.png', 'icon-512.png', 'og-image.png',
  'genedai.md', 'app.js', 'avatar.jpg', 'cards.js', 'gene-dai-cv.pdf',
];
for (const f of required) {
  if (!exists(resolve(PUB, f))) fail(`public/${f} missing`);
}

// 2. No sensitive files leaked into public/
const forbidden = ['wrangler.toml', '.mcp.json', '.gitignore', '.env', '.env.local'];
for (const f of forbidden) {
  if (exists(resolve(PUB, f))) fail(`public/${f} must not be published`);
}

// 3. JSON-LD blocks in index.html parse cleanly
const html = readPub('index.html');
const ldBlocks = [...html.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)];
if (ldBlocks.length === 0) fail('index.html has no JSON-LD');
for (const [i, m] of ldBlocks.entries()) {
  try { JSON.parse(m[1]); } catch (e) { fail(`JSON-LD block ${i + 1} invalid: ${e.message}`); }
}

// 4. site.webmanifest is valid JSON with PWA-install-required fields
try {
  const m = JSON.parse(readPub('site.webmanifest'));
  for (const k of ['name', 'short_name', 'icons', 'start_url', 'display']) {
    if (!m[k]) fail(`site.webmanifest missing required field: ${k}`);
  }
  const has192 = m.icons?.some(i => i.sizes?.includes('192'));
  const has512 = m.icons?.some(i => i.sizes?.includes('512'));
  if (!has192 || !has512) fail('site.webmanifest needs both 192 and 512 icons');
} catch (e) {
  fail(`site.webmanifest invalid JSON: ${e.message}`);
}

// 5. sitemap.xml is well-formed XML and contains canonical URL
const sitemap = readPub('sitemap.xml');
if (!/<\?xml\s+version="1\.0"/.test(sitemap)) fail('sitemap.xml missing XML declaration');
if (!/<urlset\s+xmlns=/.test(sitemap)) fail('sitemap.xml missing urlset namespace');
if (!/<loc>https:\/\/genedai\.md\/<\/loc>/.test(sitemap)) fail('sitemap.xml missing root <loc>');

// 6. _headers contains all security headers globally
const headers = readPub('_headers');
const requiredHeaders = [
  'Strict-Transport-Security',
  'X-Frame-Options',
  'X-Content-Type-Options',
  'Referrer-Policy',
  'Permissions-Policy',
  'Content-Security-Policy',
  'Cross-Origin-Opener-Policy',
];
for (const h of requiredHeaders) {
  if (!headers.includes(h)) fail(`_headers missing ${h}`);
}
if (!headers.includes('X-Robots-Tag: noindex')) warn('_headers does not noindex /404.html — verify intent');

// 7. _redirects: each non-empty non-comment line has 3 tokens (from to status)
const redirects = readPub('_redirects').split('\n');
for (const [i, line] of redirects.entries()) {
  const t = line.trim();
  if (!t || t.startsWith('#')) continue;
  const parts = t.split(/\s+/);
  if (parts.length < 2 || parts.length > 3) fail(`_redirects line ${i + 1}: bad token count: ${t}`);
  if (parts[2] && !/^\d{3}$/.test(parts[2])) fail(`_redirects line ${i + 1}: status not 3-digit: ${parts[2]}`);
}

// 8. wrangler.toml points at public/
const wrangler = readFileSync(resolve(ROOT, 'wrangler.toml'), 'utf8');
if (!/pages_build_output_dir\s*=\s*"\.?\/?public"?/.test(wrangler))
  fail('wrangler.toml: pages_build_output_dir must be "./public"');

// 9. llms.txt opens with H1 and a blockquote (llmstxt.org spec)
const llms = readPub('llms.txt').split('\n');
if (!/^#\s/.test(llms[0])) fail('llms.txt must start with "# " H1');
const blockquoteIdx = llms.findIndex(l => l.startsWith('>'));
if (blockquoteIdx < 0 || blockquoteIdx > 3) fail('llms.txt missing > blockquote near top');

// 10. robots.txt references the sitemap
const robots = readPub('robots.txt');
if (!robots.includes('Sitemap:')) fail('robots.txt missing Sitemap: directive');

// 11. One "updated" date everywhere: JSON-LD dateModified, page frontmatter, genedai.md, sitemap
const md = readPub('genedai.md');
const modified = html.match(/"dateModified": "(\d{4}-\d{2}-\d{2})/)?.[1];
const dates = {
  'index.html frontmatter': html.match(/<time datetime="(\d{4}-\d{2}-\d{2})"/)?.[1],
  'genedai.md frontmatter': md.match(/^---\n[\s\S]*?^updated: (\d{4}-\d{2}-\d{2})$[\s\S]*?^---$/m)?.[1],
  'sitemap.xml lastmod': sitemap.match(/<lastmod>(\d{4}-\d{2}-\d{2})/)?.[1],
};
for (const [where, d] of Object.entries(dates)) {
  if (d !== modified) fail(`${where} is ${d}, but JSON-LD dateModified is ${modified}`);
}

// 12. Same project list (by URL, same order) in index.html, llms.txt, and genedai.md
const projectUrls = (txt) => (txt.split(/^## Projects$/m)[1] ?? '').split(/^## /m)[0]
  .match(/\]\((https?:\/\/[^)]+)\)/g)?.map((m) => m.slice(2, -1)) ?? [];
const pageProjects = [...html.matchAll(/<a href="([^"]+)" class="md-link[ "]/g)].map((m) => m[1]);
for (const [name, txt] of [['llms.txt', readPub('llms.txt')], ['genedai.md', md]]) {
  if (projectUrls(txt).join() !== pageProjects.join())
    fail(`${name} projects differ from index.html: ${projectUrls(txt).join(', ')}`);
}

// 13. Every inline <script> (not JSON-LD) is allowed by a CSP hash
const csp = headers.match(/Content-Security-Policy: (.*)/)?.[1] ?? '';
for (const page of ['index.html', '404.html']) {
  for (const [, code] of readPub(page).matchAll(/<script>([\s\S]*?)<\/script>/g)) {
    const hash = createHash('sha256').update(code).digest('base64');
    if (!csp.includes(`'sha256-${hash}'`)) fail(`${page}: inline script not allowed by CSP (add 'sha256-${hash}')`);
  }
}

// 14. Latest-writing lists exist and match between index.html and genedai.md
const writingUrls = (txt, re) => [...(txt.match(/<!-- writing:start -->([\s\S]*?)<!-- writing:end -->/)?.[1] ?? '').matchAll(re)].map((m) => m[1]);
const pagePosts = writingUrls(html, /<a href="([^"]+)"/g);
const mdPosts = writingUrls(md, /\]\((https?:\/\/[^)]+)\)/g);
if (pagePosts.length === 0) fail('index.html: latest-writing list is empty');
if (pagePosts.join() !== mdPosts.join()) fail('latest-writing lists differ between index.html and genedai.md');
const llmsPosts = writingUrls(readPub('llms.txt'), /\]\((https?:\/\/[^)]+)\)/g);
if (pagePosts.join() !== llmsPosts.join()) fail('latest-writing lists differ between index.html and llms.txt');
const ldWriting = html.match(/<script type="application\/ld\+json" id="ld-writing">([\s\S]*?)<\/script>/)?.[1];
const ldPosts = (() => { try { return JSON.parse(ldWriting).itemListElement.map((e) => e.item.url); } catch { return []; } })();
if (ldPosts.join() !== pagePosts.join()) fail('ld-writing JSON-LD does not match the latest-writing list');

// 15. IndexNow key file: public/<32 hex>.txt whose content is exactly its name
const keyFiles = readdirSync(PUB).filter((f) => /^[0-9a-f]{32}\.txt$/.test(f));
if (keyFiles.length !== 1) fail(`expected one IndexNow key file in public/, found ${keyFiles.length}`);
else if (readPub(keyFiles[0]) !== keyFiles[0].slice(0, -4)) fail(`${keyFiles[0]} content must equal its key`);

// 16. robots.txt declares content signals
if (!/^Content-Signal: .*search=yes/m.test(robots)) fail('robots.txt missing Content-Signal');

// 17. Every hover-card name on the page has its card text and figure (scripts/figures/build.mjs)
const cardsJs = readPub('cards.js');
for (const id of new Set([...html.matchAll(/data-ent="([\w-]+)"/g)].map((m) => m[1]))) {
  if (!cardsJs.includes(`"${id}":{`)) fail(`cards.js has no card text for data-ent="${id}" (run node scripts/figures/build.mjs)`);
  if (!exists(resolve(PUB, 'figs', `${id}.json`))) fail(`public/figs/${id}.json missing (run node scripts/figures/build.mjs)`);
}

// 18. Script URLs carry the current content hash (scripts/stamp-assets.mjs)
const shortHash = (f) => createHash('sha256').update(readFileSync(resolve(PUB, f))).digest('hex').slice(0, 10);
if (!readPub('app.js').includes(`/cards.js?v=${shortHash('cards.js')}'`)) fail('app.js imports a stale cards.js stamp (run node scripts/stamp-assets.mjs)');
for (const page of ['index.html', '404.html']) {
  if (!readPub(page).includes(`/app.js?v=${shortHash('app.js')}"`)) fail(`${page} loads a stale app.js stamp (run node scripts/stamp-assets.mjs)`);
}

// Report
if (warns.length) {
  console.warn('Warnings:');
  for (const w of warns) console.warn(`  - ${w}`);
}
if (errors.length) {
  console.error(`\nverify failed (${errors.length} error${errors.length === 1 ? '' : 's'}):`);
  for (const e of errors) console.error(`  ✖ ${e}`);
  process.exit(1);
}
console.log(`verify ok (${ldBlocks.length} JSON-LD blocks, ${required.length} required files, all checks passed)`);
