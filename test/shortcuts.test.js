// The shortcuts list (shared by the overlay, the help guide and the README)
// and the typing helpers.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { SHORTCUTS, QUICK_SYNTAX, smartPunctuation, keyLabel, comboParts, isTyping } from '../public/js/shortcuts.js';
import { setLang } from '../public/js/i18n.js';

test('smart punctuation: -- becomes a dash, ... an ellipsis, beat breaks stay', () => {
  assert.equal(smartPunctuation('Wait--'), 'Wait—');
  assert.equal(smartPunctuation('You said-- no.'), 'You said— no.');
  assert.equal(smartPunctuation('I just... no.'), 'I just… no.');
  assert.equal(smartPunctuation('---'), '---');
  assert.equal(smartPunctuation('a---b'), 'a---b');
  assert.equal(smartPunctuation('well-known'), 'well-known');
  assert.equal(smartPunctuation(''), '');
});

test('keys are printed for the platform and the language', () => {
  assert.equal(keyLabel('Ctrl', true), '⌘');
  assert.equal(keyLabel('Ctrl', false), 'Ctrl');
  assert.equal(keyLabel('Alt', true), '⌥');
  setLang('it');
  assert.equal(keyLabel('Enter', false), 'Invio');
  assert.equal(keyLabel('Shift', false), 'Maiusc');
  setLang('en');
  assert.deepEqual(comboParts('Ctrl+Shift+Z'), [['Ctrl', 'Shift', 'Z']]);
  assert.deepEqual(comboParts('g w'), [['g'], ['w']]);
  assert.deepEqual(comboParts('Alt+1…9'), [['Alt', '1…9']]);
});

test('typing in a field is recognized', () => {
  assert.ok(isTyping({ tagName: 'TEXTAREA' }));
  assert.ok(isTyping({ tagName: 'INPUT' }));
  assert.ok(isTyping({ tagName: 'DIV', isContentEditable: true }));
  assert.ok(!isTyping({ tagName: 'BUTTON' }));
  assert.ok(!isTyping(null));
});

test('every global single key has a handler, and no key is listed twice in a group', () => {
  const app = fs.readFileSync(new URL('../public/js/app.js', import.meta.url), 'utf8');
  const anywhere = SHORTCUTS.find((g) => g.id === 'anywhere');
  for (const it of anywhere.items) {
    for (const combo of it.keys) {
      const [first, second] = comboParts(combo).map((step) => step.join('+'));
      if (first.includes('Ctrl')) continue;
      const key = first.length === 1 ? first : null;
      if (!key) continue;
      const handled = new RegExp(`(^|\\s)(${key.replace(/[[\]/?.]/g, '\\$&')}|'${key.replace(/[[\]/?.]/g, '\\$&')}'):`, 'm').test(app);
      assert.ok(handled, `no handler for "${key}" in app.js`);
      if (second) assert.ok(app.includes(`${second === ',' ? "','" : second}: '`), `no "g ${second}" route`);
    }
  }
  for (const g of SHORTCUTS) {
    const seen = g.items.flatMap((it) => it.keys);
    assert.equal(new Set(seen).size, seen.length, g.id);
  }
});

test('the README lists the writing shortcuts and the quick syntax', () => {
  for (const [file, word] of [['README.md', '<kbd>Alt</kbd>+<kbd>Enter</kbd>'], ['README.it.md', '<kbd>Alt</kbd>+<kbd>Invio</kbd>']]) {
    const md = fs.readFileSync(new URL(`../${file}`, import.meta.url), 'utf8');
    assert.ok(md.includes(word), `${file} mentions ${word}`);
    assert.ok(md.includes('Ctrl</kbd>+<kbd>/'), `${file} mentions Ctrl+/`);
  }
  assert.ok(QUICK_SYNTAX.some((x) => x.type === '--'));
});
