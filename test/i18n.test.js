// The Italian version must be complete: every string the code shows has a
// translation, the two knowledge bases hold the same entries, and the two
// analysis packs offer the same interface.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import IT from '../public/js/locales/it.js';
import * as KB_EN from '../public/js/kb/en.js';
import * as KB_IT from '../public/js/kb/it.js';
import { packFor } from '../public/js/lang/index.js';
import { tr, trl, trn, setLang, guessLang } from '../public/js/i18n.js';
import { collectKeys } from './helpers/i18n-keys.js';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const placeholders = (s) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort().join(',');

test('every string shown by the app has an Italian translation', () => {
  const keys = collectKeys(root);
  assert.ok(keys.size > 700, `found ${keys.size} strings`);
  const missing = [...keys].filter(([k]) => !(k in IT)).map(([k, f]) => `${k}  (${path.relative(root, f)})`);
  assert.deepEqual(missing, []);
});

test('translations keep their placeholders and are actually translated', () => {
  const broken = Object.entries(IT).filter(([k, v]) => placeholders(k) !== placeholders(v)).map(([k]) => k);
  assert.deepEqual(broken, []);
  // Identical in both languages on purpose.
  const same = new Set(['Cliché: {terms}.', 'Beat {n}', 'B', 'Coach', 'BEAT {n}']);
  const untranslated = Object.entries(IT).filter(([k, v]) => k === v && !same.has(k)).map(([k]) => k);
  assert.deepEqual(untranslated, []);
});

test('tr follows the interface language, trl and trn take it explicitly', () => {
  setLang('it');
  assert.equal(tr('Saved'), 'Salvato');
  assert.equal(trn(2, '{n} scene', '{n} scenes'), '2 scene');
  assert.equal(tr('A key nobody translated'), 'A key nobody translated');
  setLang('en');
  assert.equal(tr('Saved'), 'Saved');
  assert.equal(trl('it', 'Beat {n}', { n: 3 }), 'Beat 3');
  assert.equal(guessLang(['it-IT', 'en']), 'it');
  assert.equal(guessLang(['fr-FR']), 'en');
  assert.equal(guessLang(['it_IT.UTF-8']), 'it');
});

// Same exports, ids, lengths and keys; only the prose differs.
function sameShape(a, b, where, out) {
  if (typeof a !== typeof b) return out.push(`${where}: ${typeof a} vs ${typeof b}`);
  if (Array.isArray(a)) {
    if (!Array.isArray(b) || a.length !== b.length) return out.push(`${where}: length ${a.length} vs ${b?.length}`);
    a.forEach((x, i) => sameShape(x, b[i], `${where}[${i}]`, out));
    return;
  }
  if (a && typeof a === 'object') {
    const ka = Object.keys(a).sort().join();
    const kb = Object.keys(b).sort().join();
    if (ka !== kb) return out.push(`${where}: keys ${ka} vs ${kb}`);
    for (const k of Object.keys(a)) {
      if (['id', 'path', 'ch', 'metric', 'group', 'type', 'list', 'choice'].includes(k)) {
        if (JSON.stringify(a[k]) !== JSON.stringify(b[k])) out.push(`${where}.${k}: ${JSON.stringify(a[k])} vs ${JSON.stringify(b[k])}`);
      } else sameShape(a[k], b[k], `${where}.${k}`, out);
    }
  }
}

test('the Italian knowledge base mirrors the English one entry for entry', () => {
  assert.deepEqual(Object.keys(KB_IT).sort(), Object.keys(KB_EN).sort());
  const out = [];
  for (const k of Object.keys(KB_EN)) {
    if (typeof KB_EN[k] === 'function' || k === 'TACTICS') continue; // tactic groups have their own names
    sameShape(KB_EN[k], KB_IT[k], k, out);
  }
  assert.deepEqual(out, []);
  assert.equal(KB_IT.ALL_TACTICS.length, KB_EN.ALL_TACTICS.length);
  assert.equal(new Set(KB_IT.ALL_TACTICS).size, KB_IT.ALL_TACTICS.length, 'no duplicate Italian tactics');
  const it = packFor('it');
  assert.deepEqual(KB_IT.ALL_TACTICS.filter((t) => !it.isGerundPhrase(t)), [], 'every Italian tactic is a gerund');
  assert.equal(KB_IT.shortCite([12, 13, 14]), 'Cap. 12–14');
});

test('both language packs offer the same interface', () => {
  const en = packFor('en');
  const it = packFor('it');
  assert.deepEqual(Object.keys(it).sort(), Object.keys(en).sort());
  assert.deepEqual(Object.keys(it.PATTERNS).sort(), Object.keys(en.PATTERNS).sort());
  assert.deepEqual(Object.keys(it.CLUSTERS).sort(), Object.keys(en.CLUSTERS).sort());
  assert.equal(packFor('xx'), en);
});
