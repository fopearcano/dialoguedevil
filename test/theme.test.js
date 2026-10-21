// Every theme defines every design token, so none falls back to the light
// theme's values (a light surface or ink under the terminal theme).

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const css = fs.readFileSync(new URL('../public/css/app.css', import.meta.url), 'utf8');
const block = (selector) => {
  const at = css.indexOf(`${selector} {`);
  assert.ok(at >= 0, `${selector} block`);
  return css.slice(at, css.indexOf('}', at));
};
const tokens = (text) => new Set([...text.matchAll(/(--[\w-]+)\s*:/g)].map((m) => m[1]));

test('the terminal and dark themes define every token of the base theme', () => {
  const base = tokens(block(':root'));
  assert.ok(base.size > 50, `${base.size} tokens`);
  const terminal = tokens(block(':root[data-theme="terminal"]'));
  assert.deepEqual([...base].filter((t) => !terminal.has(t)), [], 'terminal');
  const dark = tokens(block(':root[data-theme="dark"]'));
  // Dark keeps the light theme's type, radius, sequential ramp and status
  // colors on purpose; everything else must be its own.
  const shared = [...base].filter((t) => !/^--(radius|font-|ink-on-light|seq-|good|warning|serious|critical|mid-strong)/.test(t));
  assert.deepEqual(shared.filter((t) => !dark.has(t)), [], 'dark');
});

test('the theme setting accepts the terminal theme', async () => {
  const src = fs.readFileSync(new URL('../public/js/store.js', import.meta.url), 'utf8');
  assert.match(src, /t === 'terminal'/);
  const settings = fs.readFileSync(new URL('../public/js/views/settings.js', import.meta.url), 'utf8');
  assert.match(settings, /\['terminal', tr\('Terminal'\)\]/);
});
