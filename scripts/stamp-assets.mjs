// Stamps content hashes into script URLs so each deploy reaches browsers at once
// (the zone's 4-hour browser cache TTL would otherwise serve the old app.js / cards.js).
// cards.js is stamped into app.js first, then app.js into the HTML pages.
// Run after editing public/app.js or rebuilding cards.js; verify.mjs checks the stamps are current.
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const PUB = resolve(dirname(fileURLToPath(import.meta.url)), '../public');
const hash = (file) => createHash('sha256').update(readFileSync(resolve(PUB, file))).digest('hex').slice(0, 10);
const rewrite = (file, re, to) => {
  const path = resolve(PUB, file), before = readFileSync(path, 'utf8'), after = before.replace(re, to);
  if (!re.test(before)) throw new Error(`${file}: no ${re} to stamp`);
  if (after !== before) writeFileSync(path, after);
};

rewrite('app.js', /\/cards\.js(\?v=\w+)?'/, `/cards.js?v=${hash('cards.js')}'`);
const app = hash('app.js');
for (const page of ['index.html', '404.html']) rewrite(page, /\/app\.js(\?v=\w+)?"/, `/app.js?v=${app}"`);
console.log(`stamped cards.js and app.js?v=${app}`);
