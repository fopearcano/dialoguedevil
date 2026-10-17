// Collects every translatable string in the front end and server: literal
// arguments of tr / trn / rich / trl / N_ (and the server's local alias L), plus the second reader's pattern
// messages (msg: '…'), which are translated with tr(p.msg).

import fs from 'node:fs';
import path from 'node:path';

const STR = String.raw`'((?:\\.|[^'\\])*)'|"((?:\\.|[^"\\])*)"|\`((?:\\.|[^\`\\$])*)\``;
const CALL = new RegExp(String.raw`\b(?:tr|rich|N_|L)\(\s*(?:${STR})`, 'g');
const TRL = new RegExp(String.raw`\btrl\(\s*(?:[^,()]|\([^()]*\))+,\s*(?:${STR})`, 'g');
const TRN = new RegExp(String.raw`\btrn\(\s*[^,]+,\s*(?:${STR})\s*,\s*(?:${STR})`, 'g');
const MSG = new RegExp(String.raw`\bmsg:\s*(?:${STR})`, 'g');

const unescape = (s) => s.replace(/\\(['"`\\])/g, '$1');

function files(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((d) => {
    const p = path.join(dir, d.name);
    if (d.isDirectory()) return d.name === 'kb' || d.name === 'locales' ? [] : files(p);
    return p.endsWith('.js') ? [p] : [];
  });
}

export function collectKeys(root) {
  const keys = new Map();
  const add = (k, file) => { if (k != null && k !== '') keys.set(unescape(k), file); };
  const list = [...files(path.join(root, 'public/js')), ...files(path.join(root, 'server')), path.join(root, 'server.js')];
  for (const file of list) {
    const src = fs.readFileSync(file, 'utf8');
    for (const m of src.matchAll(CALL)) add(m[1] ?? m[2] ?? m[3], file);
    for (const m of src.matchAll(TRL)) add(m[1] ?? m[2] ?? m[3], file);
    for (const m of src.matchAll(TRN)) { add(m[1] ?? m[2] ?? m[3], file); add(m[4] ?? m[5] ?? m[6], file); }
    if (file.includes(`${path.sep}lang${path.sep}`)) for (const m of src.matchAll(MSG)) add(m[1] ?? m[2] ?? m[3], file);
  }
  return keys;
}
