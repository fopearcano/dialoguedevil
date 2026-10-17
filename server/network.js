// LAN access: addresses to print at startup, a guard that admits only
// private-network clients, and an optional access code for other devices.

import os from 'node:os';
import crypto from 'node:crypto';
import { trl } from '../public/js/i18n.js';
import { reqLang } from './lang.js';

// Loopback, RFC 1918, link-local, CGNAT (100.64/10, used by Tailscale and
// carrier NAT) and IPv6 unique-local / link-local.
export function isPrivateAddress(addr) {
  let a = String(addr || '').toLowerCase().trim();
  if (a.startsWith('::ffff:')) a = a.slice(7);
  if (a === '::1' || a === 'localhost') return true;
  const m = a.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (m) {
    const [o1, o2] = [Number(m[1]), Number(m[2])];
    return o1 === 10 || o1 === 127 || (o1 === 172 && o2 >= 16 && o2 <= 31) || (o1 === 192 && o2 === 168)
      || (o1 === 169 && o2 === 254) || (o1 === 100 && o2 >= 64 && o2 <= 127);
  }
  return /^f[cd][0-9a-f]{2}:/.test(a) || /^fe[89ab][0-9a-f]:/.test(a);
}

const ipv4 = (addr) => {
  const m = String(addr || '').toLowerCase().replace(/^::ffff:/, '').match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  return m ? ((Number(m[1]) << 24) | (Number(m[2]) << 16) | (Number(m[3]) << 8) | Number(m[4])) >>> 0 : null;
};

// Devices on the same subnet as one of this computer's network interfaces
// are on its LAN even when the LAN doesn't use private addresses (some
// campus and ISP networks don't). Subnets wider than /16 are not trusted.
export function onLocalSubnet(addr, interfaces = os.networkInterfaces()) {
  const ip = ipv4(addr);
  if (ip == null) return false;
  for (const list of Object.values(interfaces)) {
    for (const ni of list || []) {
      if (ni.internal || ni.family !== 'IPv4') continue;
      const base = ipv4(ni.address);
      const mask = ipv4(ni.netmask);
      const prefix = mask == null ? 0 : mask.toString(2).replace(/0/g, '').length;
      if (base != null && prefix >= 16 && ((ip & mask) >>> 0) === ((base & mask) >>> 0)) return true;
    }
  }
  return false;
}

export function isLoopback(addr) {
  let a = String(addr || '').toLowerCase();
  if (a.startsWith('::ffff:')) a = a.slice(7);
  return a === '::1' || a.startsWith('127.');
}

export function lanAddresses() {
  const out = [];
  for (const list of Object.values(os.networkInterfaces())) {
    for (const ni of list || []) {
      if (ni.internal || ni.family !== 'IPv4') continue;
      out.push(ni.address);
    }
  }
  return out;
}

// Requests are judged by the socket's peer address; X-Forwarded-For is not
// trusted, so the guard cannot be talked around by a header.
export function lanGuard({ allowPublic = false, interfaces } = {}) {
  let cached = null;
  let cachedAt = 0;
  const current = () => {
    if (interfaces) return interfaces;
    if (!cached || Date.now() - cachedAt > 10000) { cached = os.networkInterfaces(); cachedAt = Date.now(); }
    return cached;
  };
  return (req, res, next) => {
    const peer = req.socket.remoteAddress;
    if (allowPublic || isPrivateAddress(peer) || onLocalSubnet(peer, current())) return next();
    res.status(403).type('text/plain').send(trl(reqLang(req), 'Dialogue Devil only accepts connections from your local network. Start it with DD_ALLOW_PUBLIC=1 to change that.'));
  };
}

const sha = (s) => crypto.createHash('sha256').update(String(s)).digest();
const sameCode = (a, b) => crypto.timingSafeEqual(sha(a), sha(b));

function cookieValue(req, name) {
  const raw = req.headers.cookie || '';
  for (const part of raw.split(';')) {
    const [k, ...v] = part.trim().split('=');
    if (k === name) return decodeURIComponent(v.join('='));
  }
  return '';
}

const PAGE = (wrong, lang) => `<!doctype html><html lang="${lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Dialogue Devil</title><style>body{font:16px system-ui,sans-serif;background:#f9f9f7;color:#0b0b0b;display:grid;place-items:center;min-height:100vh;margin:0}
form{background:#fcfcfb;border:1px solid rgba(0,0,0,.1);border-radius:12px;padding:24px;display:grid;gap:10px;width:min(340px,90vw)}
input,button{font:inherit;padding:8px 10px;border-radius:8px;border:1px solid rgba(0,0,0,.2)}button{background:#0b0b0b;color:#fff;font-weight:600}
@media(prefers-color-scheme:dark){body{background:#0d0d0d;color:#f0efec}form{background:#1a1a19;border-color:rgba(255,255,255,.1)}input{background:#222;color:#f0efec}button{background:#f0efec;color:#0d0d0d}}</style></head>
<body><form method="get" action="/"><strong>Dialogue Devil</strong><span>${trl(lang, 'Enter the access code shown where the server was started.')}</span>
${wrong ? `<span style="color:#d03b3b">${trl(lang, 'That code is not right.')}</span>` : ''}<input name="access" type="password" autocomplete="current-password" autofocus required aria-label="${trl(lang, 'Access code')}"><button>${trl(lang, 'Open')}</button></form></body></html>`;

// With an access code set, devices other than this machine must present it
// once (?access=…); a cookie remembers it. Requests from this machine pass.
export function accessGate({ code = '' } = {}) {
  return (req, res, next) => {
    if (!code || isLoopback(req.socket.remoteAddress)) return next();
    const given = typeof req.query?.access === 'string' ? req.query.access : '';
    if (given) {
      if (sameCode(given, code)) {
        res.setHeader('Set-Cookie', `dd_access=${encodeURIComponent(given)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=2592000`);
        return res.redirect(302, '/');
      }
      return res.status(401).type('html').send(PAGE(true, reqLang(req)));
    }
    const presented = cookieValue(req, 'dd_access') || req.get('x-dd-access') || '';
    if (presented && sameCode(presented, code)) return next();
    if (req.path.startsWith('/api/')) return res.status(401).json({ error: trl(reqLang(req), 'Access code required') });
    return res.status(401).type('html').send(PAGE(false, reqLang(req)));
  };
}
