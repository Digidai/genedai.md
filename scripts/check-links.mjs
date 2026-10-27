#!/usr/bin/env node
// Check every external link the site publishes (index.html, genedai.md, llms.txt).
// Fails on HTTP errors, timeouts, and redirects to a different site.
// Run weekly by .github/workflows/link-check.yml. Pure Node stdlib.

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const PUB = resolve(import.meta.dirname, '..', 'public');
// These hosts reject unauthenticated or scripted requests (403/999), so a
// failed check says nothing about the link. They are listed, not checked.
const SKIP = new Set(['x.com', 'linkedin.com', 'www.linkedin.com', 'genedai.medium.com']);

const sources = ['index.html', 'genedai.md', 'llms.txt'].map((f) => readFileSync(resolve(PUB, f), 'utf8'));
const urls = [...new Set(sources.flatMap((s) =>
  [...s.matchAll(/https?:\/\/[^\s"'<>)\]]+/g)].map((m) => m[0].replace(/[.,;:]+$/, ''))
))].filter((u) => {
  const host = new URL(u).hostname;
  // Same-site links, schema.org vocabulary, and asset hosts are not outbound pages.
  return !['genedai.md', 'schema.org', 'static.cloudflareinsights.com', 'cloudflareinsights.com'].includes(host);
});

const site = (h) => h.replace(/^www\./, '');
// Network errors (DNS, reset, timeout) get one retry after a short pause; HTTP errors do not.
async function check(url, retried = false) {
  const host = new URL(url).hostname;
  if (SKIP.has(host)) return { url, status: 'skip' };
  const opts = { redirect: 'follow', signal: AbortSignal.timeout(20000), headers: { 'User-Agent': 'Mozilla/5.0 (genedai.md link check)' } };
  try {
    let res = await fetch(url, { ...opts, method: 'HEAD' });
    if (res.status === 405 || res.status === 403 || res.status === 404) res = await fetch(url, { ...opts, method: 'GET' });
    const final = new URL(res.url);
    if (!res.ok) return { url, status: res.status, error: true };
    if (site(final.hostname) !== site(host)) return { url, status: res.status, error: true, note: `redirects off-site to ${res.url}` };
    return { url, status: res.status };
  } catch (e) {
    if (!retried) { await new Promise((r) => setTimeout(r, 3000)); return check(url, true); }
    return { url, status: 'ERR', error: true, note: e.name === 'TimeoutError' ? 'timeout' : (e.cause?.code ?? e.message) };
  }
}

const results = [];
for (let i = 0; i < urls.length; i += 6) results.push(...await Promise.all(urls.slice(i, i + 6).map(check)));

for (const r of results) console.log(`${r.error ? '✖' : r.status === 'skip' ? '·' : '✓'} ${r.status} ${r.url}${r.note ? ` (${r.note})` : ''}`);
const bad = results.filter((r) => r.error);
console.log(`\n${results.length} links, ${bad.length} broken, ${results.filter((r) => r.status === 'skip').length} skipped`);
if (bad.length) process.exit(1);
