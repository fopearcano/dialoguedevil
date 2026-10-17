// Interface language. Strings are written in English in the source and
// wrapped in tr(); a translation maps the English text to its own (gettext
// style). A missing translation falls back to the English original, and
// test/i18n.test.js fails on any string the Italian dictionary lacks.
// Pure module: shared by the browser, the server and the tests.

import IT from './locales/it.js';

export const LANGS = [
  { id: 'en', name: 'English', locale: 'en-US', speech: /^en/i },
  { id: 'it', name: 'Italiano', locale: 'it-IT', speech: /^it/i },
];

const DICTS = { en: null, it: IT };
let current = 'en';

export const normLang = (l) => (Object.prototype.hasOwnProperty.call(DICTS, l) ? l : 'en');

export function setLang(l) {
  current = normLang(l);
}

export function getLang() {
  return current;
}

export const localeOf = (l = current) => LANGS.find((x) => x.id === normLang(l)).locale;

// First supported language in a list such as navigator.languages.
export function guessLang(list = []) {
  for (const raw of list) {
    const base = String(raw || '').toLowerCase().split(/[-_]/)[0];
    if (base && Object.prototype.hasOwnProperty.call(DICTS, base)) return base;
  }
  return 'en';
}

const fill = (s, vars) => (vars ? s.replace(/\{(\w+)\}/g, (m, k) => (vars[k] != null ? String(vars[k]) : m)) : s);

// Translate into a given language: trl('it', 'Saved').
export function trl(lang, key, vars) {
  const d = DICTS[normLang(lang)];
  return fill((d && d[key]) || key, vars);
}

// Translate into the interface language. Placeholders: tr('{n} lines', { n }).
export function tr(key, vars) {
  return trl(current, key, vars);
}

// Marks a string for translation without translating it here (it is
// translated where it is shown), so the completeness test still sees it.
export const N_ = (key) => key;

// Singular/plural pair; {n} is filled in.
export function trn(n, one, many, vars) {
  return tr(n === 1 ? one : many, { n, ...vars });
}

export const fmtDateTime = (d) => new Date(d).toLocaleString(localeOf());
export const fmtDate = (d) => new Date(d).toLocaleDateString(localeOf());
export const fmtTime = (d) => new Date(d).toLocaleTimeString(localeOf(), { hour: '2-digit', minute: '2-digit' });
