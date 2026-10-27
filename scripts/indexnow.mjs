#!/usr/bin/env node
// Tell IndexNow search engines (Bing, Yandex, Seznam, Naver, ...) that the site changed.
// Bing's index also feeds ChatGPT search and Copilot. The key is public by design:
// it is served from public/<key>.txt so engines can confirm we own the host.
// Waits until the live site serves the expected content (the deploy finished) before pinging.
// Usage: node scripts/indexnow.mjs   (run by CI after a deploy-triggering change)

import { readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const HOST = 'genedai.md';
const PUB = resolve(import.meta.dirname, '..', 'public');
const keyFile = readdirSync(PUB).find((f) => /^[0-9a-f]{32}\.txt$/.test(f));
if (!keyFile) throw new Error('IndexNow key file public/<32 hex>.txt missing');
const key = keyFile.slice(0, -4);
const urls = ['/', '/genedai.md', '/llms.txt'].map((p) => `https://${HOST}${p}`);

// Wait for Cloudflare Pages to publish this commit's llms.txt (up to ~5 minutes).
const expected = readFileSync(resolve(PUB, 'llms.txt'), 'utf8');
for (let i = 0; ; i++) {
  const live = await fetch(`https://${HOST}/llms.txt?indexnow=${Date.now()}`).then((r) => r.text()).catch(() => '');
  if (live === expected) break;
  if (i >= 30) { console.log('live site never matched this commit; pinging anyway'); break; }
  await new Promise((r) => setTimeout(r, 10000));
}

const res = await fetch('https://api.indexnow.org/indexnow', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json; charset=utf-8' },
  body: JSON.stringify({ host: HOST, key, keyLocation: `https://${HOST}/${keyFile}`, urlList: urls }),
});
console.log(`IndexNow ${res.status} for ${urls.join(', ')}`);
// 200 = accepted, 202 = accepted pending key validation. Anything else is a real problem.
if (![200, 202].includes(res.status)) {
  console.log(await res.text());
  process.exit(1);
}
