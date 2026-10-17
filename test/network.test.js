// LAN guard and access code, tested with minimal request/response doubles.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isPrivateAddress, isLoopback, lanGuard, accessGate } from '../server/network.js';

function fakeReq({ ip = '192.168.1.20', path = '/', query = {}, cookie = '', headers = {} } = {}) {
  const h = { cookie, ...headers };
  return { socket: { remoteAddress: ip }, path, query, headers: h, get: (k) => h[k.toLowerCase()] };
}

function fakeRes() {
  const r = { statusCode: 200, headers: {}, body: undefined, redirected: '' };
  r.status = (c) => { r.statusCode = c; return r; };
  r.type = () => r;
  r.send = (b) => { r.body = b; return r; };
  r.json = (b) => { r.body = b; return r; };
  r.setHeader = (k, v) => { r.headers[k.toLowerCase()] = v; };
  r.redirect = (c, url) => { r.statusCode = c; r.redirected = url; return r; };
  return r;
}

function run(mw, req) {
  const res = fakeRes();
  let passed = false;
  mw(req, res, () => { passed = true; });
  return { res, passed };
}

test('private and public addresses', () => {
  for (const a of ['127.0.0.1', '::1', '::ffff:192.168.0.5', '10.1.2.3', '172.16.0.1', '172.31.255.255', '192.168.1.1', '169.254.3.4', '100.100.1.1', 'fd12:3456::1', 'fe80::1']) {
    assert.equal(isPrivateAddress(a), true, a);
  }
  for (const a of ['8.8.8.8', '172.15.0.1', '172.32.0.1', '100.128.0.1', '::ffff:1.1.1.1', '2001:4860::8888', '', undefined]) {
    assert.equal(isPrivateAddress(a), false, String(a));
  }
  assert.equal(isLoopback('::ffff:127.0.0.1'), true);
  assert.equal(isLoopback('192.168.1.1'), false);
});

test('LAN guard admits private peers, refuses public ones, ignores X-Forwarded-For', () => {
  const guard = lanGuard();
  assert.equal(run(guard, fakeReq({ ip: '192.168.1.9' })).passed, true);
  const out = run(guard, fakeReq({ ip: '203.0.113.7', headers: { 'x-forwarded-for': '192.168.1.9' } }));
  assert.equal(out.passed, false);
  assert.equal(out.res.statusCode, 403);
  assert.equal(run(lanGuard({ allowPublic: true }), fakeReq({ ip: '203.0.113.7' })).passed, true);
});

test('access code: off by default; this machine is exempt', () => {
  assert.equal(run(accessGate(), fakeReq()).passed, true);
  assert.equal(run(accessGate({ code: 'devil' }), fakeReq({ ip: '127.0.0.1' })).passed, true);
});

test('access code: other devices need it once, then a cookie remembers it', () => {
  const gate = accessGate({ code: 'devil' });
  const page = run(gate, fakeReq({ path: '/' }));
  assert.equal(page.passed, false);
  assert.equal(page.res.statusCode, 401);
  assert.match(page.res.body, /access code/i);

  const api = run(gate, fakeReq({ path: '/api/projects' }));
  assert.equal(api.res.statusCode, 401);
  assert.deepEqual(api.res.body, { error: 'Access code required' });

  const wrong = run(gate, fakeReq({ query: { access: 'angel' } }));
  assert.equal(wrong.passed, false);
  assert.match(wrong.res.body, /not right/);

  const right = run(gate, fakeReq({ query: { access: 'devil' } }));
  assert.equal(right.res.statusCode, 302);
  assert.match(right.res.headers['set-cookie'], /^dd_access=devil;.*HttpOnly/);

  assert.equal(run(gate, fakeReq({ path: '/api/projects', cookie: 'theme=x; dd_access=devil' })).passed, true);
  assert.equal(run(gate, fakeReq({ path: '/api/projects', cookie: 'dd_access=angel' })).passed, false);
});
