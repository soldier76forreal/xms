// Arabic has SIX plural categories (zero, one, two, few, many, other). i18next
// asks Intl.PluralRules which one a count falls in, and when that key is
// missing it falls back to ENGLISH — so with only `_one`/`_other` an Arabic UI
// shows English for 0, 2 and 3-99. This adds the four missing categories to
// every group that has the pair, carrying the `_other` text. Idempotent: run it
// after adding Arabic plural keys. (Where a count only fills a number into a
// fixed sentence, prefer ONE bare key instead — no plural needed at all.)
//
//   node scripts/completeArabicPlurals.cjs
const fs = require('fs');
const path = require('path');

const FILE = path.join(__dirname, '..', 'src', 'i18n', 'locales', 'ar.json');
const data = JSON.parse(fs.readFileSync(FILE, 'utf8'));

let added = 0;
const walk = (node) => {
  for (const key of Object.keys(node).filter((k) => k.endsWith('_other'))) {
    const base = key.slice(0, -'_other'.length);
    if (node[`${base}_one`] === undefined) continue;
    for (const category of ['zero', 'two', 'few', 'many']) {
      if (node[`${base}_${category}`] === undefined) { node[`${base}_${category}`] = node[key]; added += 1; }
    }
  }
  Object.values(node).forEach((v) => { if (v && typeof v === 'object') walk(v); });
};
walk(data);

if (added) fs.writeFileSync(FILE, `${JSON.stringify(data, null, 2)}\n`);
console.log(added ? `ar.json: added ${added} plural categor${added === 1 ? 'y' : 'ies'}` : 'ar.json: every plural group is already complete');
