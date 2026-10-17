// Server tests: project REST API and the AI agent loop, run fully offline
// against a fake Anthropic endpoint that streams real Messages API SSE.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

const requests = [];
const reviewRequests = [];
let fake;
let app;
let base;
let dataDir;

function sse(res, events) {
  res.writeHead(200, { 'content-type': 'text/event-stream' });
  for (const e of events) res.write(`event: ${e.type}\ndata: ${JSON.stringify(e)}\n\n`);
  res.end();
}

const start = (id) => ({ type: 'message_start', message: { id, type: 'message', role: 'assistant', model: 'claude-opus-5-5', content: [], stop_reason: null, stop_sequence: null, usage: { input_tokens: 10, output_tokens: 1 } } });

before(async () => {
  fake = http.createServer((req, res) => {
    let body = '';
    req.on('data', (c) => { body += c; });
    req.on('end', () => {
      const parsed = JSON.parse(body || '{}');
      if (String(parsed.messages?.[0]?.content).startsWith('Double-check')) {
        reviewRequests.push(parsed);
        return sse(res, [
          start('msg_r'),
          { type: 'content_block_start', index: 0, content_block: { type: 'tool_use', id: 'toolu_r', name: 'report_issues', input: {} } },
          { type: 'content_block_delta', index: 0, delta: { type: 'input_json_delta', partial_json: '{"summary":"One miss, one false alarm.","issues":[{"line_id":"line_1","flaw":"onTheNose","severity":"serious","evidence":"I am angry","note":"Names the feeling.","fix":"Act it out."}],"disputes":[{"line_id":"line_2","flaw":"cliche","reason":"Ironic on purpose."}]}' } },
          { type: 'content_block_stop', index: 0 },
          { type: 'message_delta', delta: { stop_reason: 'tool_use', stop_sequence: null }, usage: { output_tokens: 40 } },
          { type: 'message_stop' },
        ]);
      }
      requests.push({ url: req.url, headers: req.headers, body: parsed });
      if (requests.length === 1) {
        sse(res, [
          start('msg_1'),
          { type: 'content_block_start', index: 0, content_block: { type: 'text', text: '' } },
          { type: 'content_block_delta', index: 0, delta: { type: 'text_delta', text: 'What does she want? ' } },
          { type: 'content_block_stop', index: 0 },
          { type: 'content_block_start', index: 1, content_block: { type: 'tool_use', id: 'toolu_1', name: 'propose_character_updates', input: {} } },
          { type: 'content_block_delta', index: 1, delta: { type: 'input_json_delta', partial_json: '{"character_id":"char_nadia","updates":[{"path":"desire.motivation","value":"To be needed","rationale":"Ch. 12"}]}' } },
          { type: 'content_block_stop', index: 1 },
          { type: 'message_delta', delta: { stop_reason: 'tool_use', stop_sequence: null }, usage: { output_tokens: 30 } },
          { type: 'message_stop' },
        ]);
      } else {
        sse(res, [
          start('msg_2'),
          { type: 'content_block_start', index: 0, content_block: { type: 'text', text: '' } },
          { type: 'content_block_delta', index: 0, delta: { type: 'text_delta', text: 'Proposed.' } },
          { type: 'content_block_stop', index: 0 },
          { type: 'message_delta', delta: { stop_reason: 'end_turn', stop_sequence: null }, usage: { output_tokens: 3 } },
          { type: 'message_stop' },
        ]);
      }
    });
  });
  await new Promise((r) => fake.listen(0, '127.0.0.1', r));
  dataDir = await fs.mkdtemp(path.join(os.tmpdir(), 'dd-test-'));
  process.env.ANTHROPIC_BASE_URL = `http://127.0.0.1:${fake.address().port}`;
  process.env.ANTHROPIC_API_KEY = 'test-key';
  process.env.DD_DATA_DIR = dataDir;
  delete process.env.DD_AI_MOCK;
  const { createApp } = await import('../server.js');
  app = createApp().listen(0, '127.0.0.1');
  await new Promise((r) => app.once('listening', r));
  base = `http://127.0.0.1:${app.address().port}`;
});

after(async () => {
  app?.close();
  fake?.close();
  await fs.rm(dataDir, { recursive: true, force: true });
});

test('project CRUD round-trip and id validation', async () => {
  const created = await (await fetch(`${base}/api/projects`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ sample: true }) })).json();
  assert.ok(created.id && created.characters.length === 2);
  created.title = 'Renamed';
  const saved = await (await fetch(`${base}/api/projects/${created.id}`, { method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify(created) })).json();
  assert.equal(saved.title, 'Renamed');
  const list = await (await fetch(`${base}/api/projects`)).json();
  assert.ok(list.some((p) => p.id === created.id && p.title === 'Renamed'));
  assert.equal((await fetch(`${base}/api/projects/..%2F..%2Fetc`)).status, 400);
  assert.equal((await fetch(`${base}/api/projects/${created.id}`, { method: 'DELETE' })).status, 204);
  assert.equal((await fetch(`${base}/api/projects/${created.id}`)).status, 404);
});

test('AI agent loop: streams text, validates a tool proposal, returns tool_result, finishes', async () => {
  const res = await fetch(`${base}/api/ai/chat`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ mode: 'coach', messages: [{ role: 'user', content: 'Help me with Nadia.' }], context: { meta: { characterName: 'Nadia' }, data: { character: { id: 'char_nadia' } } } }),
  });
  const text = await res.text();
  const events = text.split('\n\n').filter(Boolean).map((chunk) => {
    const type = chunk.match(/^event: (.*)$/m)[1];
    return { type, data: JSON.parse(chunk.match(/^data: (.*)$/m)[1]) };
  });
  const types = events.map((e) => e.type);
  assert.ok(types.includes('text'));
  const proposal = events.find((e) => e.type === 'proposal');
  assert.equal(proposal.data.tool, 'propose_character_updates');
  assert.equal(proposal.data.input.updates[0].value, 'To be needed');
  assert.equal(types[types.length - 1], 'done', `events: ${types.join(',')}`);

  assert.equal(requests.length, 2);
  const [first, second] = requests;
  assert.match(first.url, /\/v1\/messages/);
  assert.equal(first.body.model, 'claude-opus-5-5');
  assert.equal(first.body.stream, true);
  assert.equal(first.body.fallbacks, 'default');
  assert.match(String(first.headers['anthropic-beta']), /server-side-fallback-2026-07-01/);
  assert.equal(first.body.output_config.effort, 'medium');
  assert.ok(first.body.tools.every((t) => t.eager_input_streaming === true));
  assert.equal(first.body.system[0].cache_control.type, 'ephemeral');
  assert.match(first.body.system[0].text, /McKee/);
  assert.match(first.body.system[2].text, /char_nadia/);
  const toolResult = second.body.messages.at(-1).content[0];
  assert.equal(toolResult.type, 'tool_result');
  assert.equal(toolResult.tool_use_id, 'toolu_1');
});

test('AI endpoint rejects a conversation that does not end with the writer', async () => {
  const res = await fetch(`${base}/api/ai/chat`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ mode: 'coach', messages: [{ role: 'assistant', content: 'hi' }] }),
  });
  assert.match(await res.text(), /event: error/);
});

const put = (p, query = '') => fetch(`${base}/api/projects/${p.id}${query}`, { method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify(p) });

test('saves carry revisions; a stale save is refused with the current version', async () => {
  const created = await (await fetch(`${base}/api/projects`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ title: 'Sync' }) })).json();
  assert.equal(created.revision, 1);
  assert.deepEqual(await (await fetch(`${base}/api/projects/${created.id}/meta`)).json(), { id: created.id, revision: 1, updatedAt: created.updatedAt });

  // Device A saves on top of revision 1.
  const a = await (await put({ ...created, logline: 'from A' })).json();
  assert.equal(a.revision, 2);

  // Device B still holds revision 1: refused, and told what is there now.
  const stale = await put({ ...created, logline: 'from B' });
  assert.equal(stale.status, 409);
  const body = await stale.json();
  assert.equal(body.current.logline, 'from A');
  assert.equal(body.current.revision, 2);
  assert.equal((await (await fetch(`${base}/api/projects/${created.id}`)).json()).logline, 'from A');

  // B chooses to keep its version.
  const forced = await (await put({ ...created, logline: 'from B' }, '?force=1')).json();
  assert.equal(forced.revision, 3);
  assert.equal(forced.logline, 'from B');

  // Concurrent saves from the same revision: exactly one wins.
  const results = await Promise.all([put({ ...forced, logline: 'x' }), put({ ...forced, logline: 'y' })]);
  assert.deepEqual(results.map((r) => r.status).sort(), [200, 409]);
  assert.equal((await (await fetch(`${base}/api/projects/${created.id}/meta`)).json()).revision, 4);
  assert.equal((await fetch(`${base}/api/projects/nope_404/meta`)).status, 404);
});

test('network endpoint reports how other devices reach the server', async () => {
  const net = await (await fetch(`${base}/api/network`)).json();
  assert.equal(net.port, app.address().port);
  assert.equal(net.accessCode, false);
  assert.equal(net.thisDevice, true);
  assert.ok(Array.isArray(net.urls));
});

test('AI review: report_issues ends the turn after one request and is validated', async () => {
  const res = await fetch(`${base}/api/ai/chat`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ mode: 'review', messages: [{ role: 'user', content: 'Double-check this scene.' }], context: { meta: { sceneId: 'scene_1' }, data: { scene: { id: 'scene_1' } } } }),
  });
  const text = await res.text();
  assert.equal(reviewRequests.length, 1, 'terminal tool: no second request');
  assert.equal(reviewRequests[0].output_config.effort, 'high');
  assert.ok(reviewRequests[0].tools.some((t) => t.name === 'report_issues'));
  const proposal = text.split('\n\n').find((c) => c.startsWith('event: proposal'));
  const data = JSON.parse(proposal.match(/^data: (.*)$/m)[1]);
  assert.equal(data.tool, 'report_issues');
  assert.equal(data.input.issues[0].flaw, 'onTheNose');
  assert.equal(data.input.disputes[0].reason, 'Ironic on purpose.');
  assert.match(text, /event: done/);
});

test('Italian: sample, errors and the AI framework follow the language', async () => {
  const json = { 'content-type': 'application/json' };
  const it = { ...json, 'x-dd-lang': 'it' };
  const sample = await (await fetch(`${base}/api/projects`, { method: 'POST', headers: json, body: JSON.stringify({ sample: true, lang: 'it' }) })).json();
  assert.equal(sample.lang, 'it');
  assert.equal(sample.title, "Quello che ha lasciato (copia dell'esempio)");
  const blank = await (await fetch(`${base}/api/projects`, { method: 'POST', headers: it, body: '{}' })).json();
  assert.equal(blank.lang, 'it');
  assert.equal(blank.title, 'Storia senza titolo');
  assert.equal((await (await fetch(`${base}/api/projects/nope_404`, { headers: it })).json()).error, 'Progetto non trovato');
  assert.equal((await (await fetch(`${base}/api/projects/nope_404`)).json()).error, 'Project not found');

  const bad = await fetch(`${base}/api/ai/chat`, { method: 'POST', headers: json, body: JSON.stringify({ lang: 'it', mode: 'coach', messages: [{ role: 'assistant', content: 'ciao' }] }) });
  assert.match(await bad.text(), /La conversazione deve finire con un messaggio di chi scrive/);

  const before = requests.length;
  const res = await fetch(`${base}/api/ai/chat`, {
    method: 'POST',
    headers: it,
    body: JSON.stringify({ mode: 'coach', dialogueLang: 'it', messages: [{ role: 'user', content: 'Aiutami con Nadia.' }], context: { meta: { characterName: 'Nadia' }, data: { character: { id: 'char_nadia' } } } }),
  });
  assert.match(await res.text(), /event: done/);
  const { system } = requests[before].body;
  assert.equal(system[0].cache_control.type, 'ephemeral');
  assert.match(system[0].text, /McKee/);
  assert.match(system[0].text, /Cap\. \d/);
  assert.match(system[1].text, /# Language/);
  assert.match(system[1].text, /in Italian/);
  assert.match(system[1].text, /-ando\/-endo/);
  assert.match(system[2].text, /char_nadia/);
});
