// OpenAI, OpenRouter and local / OpenAI-compatible services, run offline
// against a fake Chat Completions server that streams real SSE chunks.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

const calls = [];
let fake;
let fakeUrl;
let app;
let base;
let dataDir;

const chunk = (delta, finish = null) => `data: ${JSON.stringify({ id: 'c1', object: 'chat.completion.chunk', choices: [{ index: 0, delta, finish_reason: finish }] })}\n\n`;

before(async () => {
  fake = http.createServer((req, res) => {
    let raw = '';
    req.on('data', (c) => { raw += c; });
    req.on('end', () => {
      const body = raw ? JSON.parse(raw) : {};
      calls.push({ method: req.method, url: req.url, auth: req.headers.authorization || '', body });
      if (req.url.endsWith('/models')) {
        if (req.url.startsWith('/openai') && req.headers.authorization !== 'Bearer sk-test') {
          res.writeHead(401, { 'content-type': 'application/json' });
          return res.end(JSON.stringify({ error: { message: 'Incorrect API key provided' } }));
        }
        res.writeHead(200, { 'content-type': 'application/json' });
        return res.end(JSON.stringify({ object: 'list', data: [{ id: 'tiny-chat' }, { id: 'text-embedding-small' }, { id: 'a-model' }] }));
      }
      const model = body.model;
      if (model === 'tool-less' && body.tools) {
        res.writeHead(400, { 'content-type': 'application/json' });
        return res.end(JSON.stringify({ error: { message: 'registry/tool-less does not support tools' } }));
      }
      if (model === 'plain-json') {
        res.writeHead(200, { 'content-type': 'application/json' });
        return res.end(JSON.stringify({ choices: [{ index: 0, message: { role: 'assistant', content: 'Whole answer at once.' }, finish_reason: 'stop' }] }));
      }
      res.writeHead(200, { 'content-type': 'text/event-stream' });
      res.write(': keep-alive\n\n');
      const answered = body.messages.some((m) => m.role === 'tool');
      if (body.tool_choice?.function?.name === 'report_issues') {
        res.write(chunk({ role: 'assistant', tool_calls: [{ index: 0, id: 'call_r', type: 'function', function: { name: 'report_issues', arguments: '' } }] }));
        res.write(chunk({ tool_calls: [{ index: 0, function: { arguments: '{"summary":"Clean.","issues":[],"disputes":[]}' } }] }));
        res.write(chunk({}, 'tool_calls'));
      } else if (model === 'tiny-chat' && !answered) {
        res.write(chunk({ role: 'assistant', content: 'Thinking. ' }));
        res.write(chunk({ tool_calls: [{ index: 0, id: 'call_1', type: 'function', function: { name: 'propose_character_updates', arguments: '{"character_id":"char_nadia",' } }] }));
        res.write(chunk({ tool_calls: [{ index: 0, function: { arguments: '"updates":[{"path":"desire.motivation","value":"To be needed","rationale":"Ch. 12"}]}' } }] }));
        res.write(chunk({}, 'tool_calls'));
      } else {
        res.write(chunk({ role: 'assistant', content: answered ? 'Proposed.' : 'Just talking.' }));
        res.write(chunk({}, 'stop'));
      }
      res.write('data: [DONE]\n\n');
      res.end();
    });
  });
  await new Promise((r) => fake.listen(0, '127.0.0.1', r));
  fakeUrl = `http://127.0.0.1:${fake.address().port}`;
  dataDir = await fs.mkdtemp(path.join(os.tmpdir(), 'dd-prov-'));
  process.env.DD_DATA_DIR = dataDir;
  process.env.OPENAI_BASE_URL = `${fakeUrl}/openai`;
  delete process.env.DD_AI_MOCK;
  delete process.env.OPENAI_API_KEY;
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

async function chat(body, headers = {}) {
  const res = await fetch(`${base}/api/ai/chat`, { method: 'POST', headers: { 'content-type': 'application/json', ...headers }, body: JSON.stringify(body) });
  const text = await res.text();
  return text.split('\n\n').filter(Boolean).map((c) => ({ type: c.match(/^event: (.*)$/m)[1], data: JSON.parse(c.match(/^data: (.*)$/m)[1]) }));
}

const ask = (extra) => ({ mode: 'coach', messages: [{ role: 'user', content: 'Help me with Nadia.' }], context: { meta: { characterName: 'Nadia' }, data: { character: { id: 'char_nadia' } } }, ...extra });

test('a local model streams text and makes a validated proposal through the tool loop', async () => {
  calls.length = 0;
  const events = await chat(ask({ provider: 'local', baseUrl: `${fakeUrl}/v1/`, model: 'tiny-chat' }));
  const types = events.map((e) => e.type);
  assert.equal(events.filter((e) => e.type === 'text').map((e) => e.data.delta).join(''), 'Thinking. Proposed.');
  const proposal = events.find((e) => e.type === 'proposal');
  assert.equal(proposal.data.tool, 'propose_character_updates');
  assert.equal(proposal.data.input.updates[0].value, 'To be needed');
  assert.equal(types.at(-1), 'done', types.join(','));
  const [first, second] = calls.filter((c) => c.url === '/v1/chat/completions');
  assert.equal(first.body.messages[0].role, 'system');
  assert.match(first.body.messages[0].content, /McKee/);
  assert.equal(first.body.stream, true);
  assert.equal(first.body.max_tokens, 8000);
  assert.ok(first.body.tools.some((t) => t.type === 'function' && t.function.name === 'propose_beats'));
  assert.equal(first.auth, '', 'no key sent to a local server without one');
  const assistant = second.body.messages.find((m) => m.role === 'assistant');
  assert.equal(assistant.tool_calls[0].id, 'call_1');
  const result = second.body.messages.find((m) => m.role === 'tool');
  assert.equal(result.tool_call_id, 'call_1');
});

test('review mode forces the report tool and ends after one request', async () => {
  calls.length = 0;
  const events = await chat({ ...ask({ provider: 'local', baseUrl: `${fakeUrl}/v1`, model: 'tiny-chat' }), mode: 'review', messages: [{ role: 'user', content: 'Double-check this scene.' }] });
  assert.equal(calls.length, 1);
  assert.deepEqual(calls[0].body.tool_choice, { type: 'function', function: { name: 'report_issues' } });
  assert.equal(events.find((e) => e.type === 'proposal').data.input.summary, 'Clean.');
});

test('a model without tools still talks, with a notice', async () => {
  calls.length = 0;
  const events = await chat(ask({ provider: 'local', baseUrl: `${fakeUrl}/v1`, model: 'tool-less' }));
  assert.ok(events.some((e) => e.type === 'notice' && /tool/i.test(e.data.message)));
  assert.equal(events.find((e) => e.type === 'text').data.delta, 'Just talking.');
  assert.equal(calls.length, 2);
  assert.equal(calls[1].body.tools, undefined);
});

test('a server that answers with plain JSON instead of a stream still works', async () => {
  const events = await chat(ask({ provider: 'local', baseUrl: `${fakeUrl}/v1`, model: 'plain-json' }));
  assert.equal(events.find((e) => e.type === 'text').data.delta, 'Whole answer at once.');
});

test('OpenAI: the key goes as a bearer token, chat-only models are listed, max_completion_tokens is used', async () => {
  calls.length = 0;
  const noKey = await fetch(`${base}/api/ai/models`, { method: 'POST', headers: { 'content-type': 'application/json', 'x-dd-lang': 'it' }, body: JSON.stringify({ provider: 'openai' }) });
  assert.equal(noKey.status, 401);
  assert.match((await noKey.json()).error, /Nessuna chiave API per OpenAI/);
  const wrong = await fetch(`${base}/api/ai/models`, { method: 'POST', headers: { 'content-type': 'application/json', 'x-ai-key': 'sk-wrong' }, body: JSON.stringify({ provider: 'openai' }) });
  assert.equal(wrong.status, 401);
  assert.match((await wrong.json()).error, /rejected the API key/);
  const ok = await (await fetch(`${base}/api/ai/models`, { method: 'POST', headers: { 'content-type': 'application/json', 'x-ai-key': 'sk-test' }, body: JSON.stringify({ provider: 'openai' }) })).json();
  assert.deepEqual(ok.models, ['a-model', 'tiny-chat']);
  const events = await chat(ask({ provider: 'openai', model: 'a-model' }), { 'x-ai-key': 'sk-test' });
  assert.equal(events.at(-1).type, 'done');
  const sent = calls.find((c) => c.url === '/openai/chat/completions');
  assert.equal(sent.auth, 'Bearer sk-test');
  assert.equal(sent.body.max_completion_tokens, 8000);
  assert.equal(sent.body.max_tokens, undefined);
});

test('errors are explained: unreachable server, missing model', async () => {
  const down = await chat(ask({ provider: 'local', baseUrl: 'http://127.0.0.1:9/v1', model: 'x' }), { 'x-dd-lang': 'en' });
  assert.match(down.find((e) => e.type === 'error').data.message, /Could not reach http:\/\/127\.0\.0\.1:9\/v1/);
  const noModel = await chat(ask({ provider: 'local', baseUrl: `${fakeUrl}/v1` }));
  assert.match(noModel.find((e) => e.type === 'error').data.message, /Pick a model/);
});

test('custom addresses only from trusted callers; status lists the services', async () => {
  const { resolveBaseUrl, PROVIDERS } = await import('../server/providers.js');
  const local = PROVIDERS.local;
  assert.equal(resolveBaseUrl(local, 'http://10.0.0.5:1234/v1/', { trusted: true }), 'http://10.0.0.5:1234/v1');
  assert.throws(() => resolveBaseUrl(local, 'http://10.0.0.5:1234/v1', { trusted: false }), (e) => e.status === 403);
  assert.equal(resolveBaseUrl(local, 'http://localhost:11434/v1', { trusted: false }), 'http://localhost:11434/v1', 'the server default is always allowed');
  assert.throws(() => resolveBaseUrl(local, 'file:///etc/passwd', { trusted: true }), (e) => e.status === 400);
  assert.equal(resolveBaseUrl(PROVIDERS.openai, 'http://elsewhere/v1', { trusted: true }), `${fakeUrl}/openai`, 'cloud services ignore a client address');
  const status = await (await fetch(`${base}/api/ai/status`)).json();
  assert.deepEqual(Object.keys(status.providers).sort(), ['local', 'openai', 'openrouter']);
  assert.equal(status.providers.openrouter.keyRequired, true);
  assert.equal(status.providers.local.keyRequired, false);
  assert.ok(!JSON.stringify(status).includes('sk-'), 'no keys in the status');
});
