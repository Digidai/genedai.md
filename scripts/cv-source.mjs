#!/usr/bin/env node
// Fingerprint of the page text the CV PDFs are printed from (scripts/build-cv.sh).
// Leaves out what the daily refresh changes and print hides: dates, the writing list, asset stamps.
// build-cv.sh writes scripts/cv-source.txt; verify.mjs fails if a page no longer matches it.
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';

const PUB = resolve(import.meta.dirname, '..', 'public');
export const PAGES = { 'gene-dai-cv.pdf': 'index.html', 'gene-dai-cv-zh.pdf': 'zh/index.html' };

export function cvSource(html) {
  const body = html.slice(html.indexOf('<body'));
  const text = body
    .replace(/<!-- writing:start -->[\s\S]*?<!-- writing:end -->/, '')
    .replace(/<time\b[^>]*>[\s\S]*?<\/time>/g, '')
    .replace(/\?v=[0-9a-f]+/g, '');
  return createHash('sha256').update(text).digest('hex').slice(0, 16);
}

export const fingerprints = () => Object.entries(PAGES)
  .map(([pdf, page]) => `${pdf} ${cvSource(readFileSync(resolve(PUB, page), 'utf8'))}`).join('\n') + '\n';

if (import.meta.url === `file://${process.argv[1]}`) {
  writeFileSync(resolve(import.meta.dirname, 'cv-source.txt'), fingerprints());
  console.log('wrote scripts/cv-source.txt');
}
