// Which language the server answers in: the app sends x-dd-lang with each
// request; plain browser requests (the access-code page) use
// Accept-Language; the console uses DD_LANG or the system locale.

import { normLang, guessLang } from '../public/js/i18n.js';

export const SERVER_LANG = process.env.DD_LANG
  ? normLang(process.env.DD_LANG)
  : guessLang([process.env.LC_ALL, process.env.LC_MESSAGES, process.env.LANG].filter(Boolean));

export function reqLang(req) {
  const h = req.headers || {};
  if (h['x-dd-lang']) return normLang(String(h['x-dd-lang']));
  if (h['accept-language']) {
    const first = guessLang(String(h['accept-language']).split(',').map((s) => s.split(';')[0].trim()));
    if (first !== 'en' || /^en/i.test(h['accept-language'])) return first;
  }
  return SERVER_LANG;
}
