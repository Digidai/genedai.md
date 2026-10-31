#!/usr/bin/env node
// Set every "last modified" signal to one date (default: today, UTC):
// JSON-LD dateModified, the page frontmatter <time>, genedai.md frontmatter,
// and sitemap.xml <lastmod>. verify.mjs requires these to agree.
// The daily workflow runs this only when a refresh changed the content.
// Run scripts/build-zh.mjs afterwards so the Chinese page picks up the date.

import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const day = process.argv[2] ?? new Date().toISOString().slice(0, 10);
if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) throw new Error(`bad date: ${day}`);
const fmt = (d) =>
  new Date(`${d}T00:00:00Z`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
const PUB = resolve(import.meta.dirname, '..', 'public');

const edits = {
  'index.html': [
    [/("dateModified": ")\d{4}-\d{2}-\d{2}/, `$1${day}`],
    [/(<time datetime=")\d{4}-\d{2}-\d{2}(">)[^<]*/, `$1${day}$2${fmt(day)}`],
  ],
  'genedai.md': [[/^(updated: )\d{4}-\d{2}-\d{2}$/m, `$1${day}`]],
  'sitemap.xml': [[/(<lastmod>)\d{4}-\d{2}-\d{2}/g, `$1${day}`]],
};

for (const [file, rules] of Object.entries(edits)) {
  const path = resolve(PUB, file);
  let src = readFileSync(path, 'utf8');
  for (const [re, to] of rules) {
    if (!re.test(src)) throw new Error(`${file}: pattern not found: ${re}`);
    src = src.replace(re, to);
  }
  writeFileSync(path, src);
}
console.log(`modified dates set to ${day}`);
