#!/usr/bin/env node
// Refresh the "updated YYYY-MM-DD" badges in public/index.html from each
// project's GitHub repo (last push date). Run daily by .github/workflows/daily-refresh.yml.
// Pure Node stdlib. Uses GITHUB_TOKEN when present to avoid the anonymous rate limit.

import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const file = resolve(import.meta.dirname, '..', 'public', 'index.html');
const html = readFileSync(file, 'utf8');
const pattern = /<span class="activity" data-repo="([\w.-]+\/[\w.-]+)">updated (\d{4}-\d{2}-\d{2})<\/span>/g;

const headers = { 'User-Agent': 'genedai.md-activity', Accept: 'application/vnd.github+json' };
if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;

const dates = {};
for (const [, repo] of html.matchAll(pattern)) {
  const res = await fetch(`https://api.github.com/repos/${repo}`, { headers });
  if (!res.ok) throw new Error(`${repo}: GitHub API ${res.status}`);
  dates[repo] = (await res.json()).pushed_at.slice(0, 10);
}

const out = html.replace(pattern, (m, repo, old) => {
  if (dates[repo] !== old) console.log(`${repo}: ${old} -> ${dates[repo]}`);
  return `<span class="activity" data-repo="${repo}">updated ${dates[repo]}</span>`;
});
if (out !== html) writeFileSync(file, out);
console.log(`checked ${Object.keys(dates).length} repos${out === html ? ', no changes' : ''}`);
