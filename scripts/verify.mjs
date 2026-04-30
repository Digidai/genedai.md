#!/usr/bin/env node
// Pre-deploy gate. Runs in CI and locally with `node scripts/verify.mjs`.
// Pure Node stdlib — no npm install required.

import { readFileSync, statSync, readdirSync } from 'node:fs';
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
const ldBlocks = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
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
