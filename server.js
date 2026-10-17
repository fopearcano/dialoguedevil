// Dialogue Devil server: static front end, project storage and the optional
// Claude-powered collaborator. Listens on port 4134 by default.

import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createStorage } from './server/storage.js';
import { aiStatus, runChat, describeError } from './server/ai.js';
import { lanGuard, accessGate, lanAddresses, isLoopback } from './server/network.js';
import { newProject, uid } from './public/js/model.js';
import { sampleProject } from './public/js/sample.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT) || 4134;
// Open to the local network by default, so phones, tablets and other
// computers on the same Wi-Fi can use it. HOST=127.0.0.1 keeps it private.
const HOST = process.env.HOST || '0.0.0.0';
const storage = createStorage(process.env.DD_DATA_DIR || path.join(here, 'data', 'projects'));

export function createApp({ accessCode = process.env.DD_ACCESS_CODE || '', allowPublic = process.env.DD_ALLOW_PUBLIC === '1' } = {}) {
  const app = express();
  app.disable('x-powered-by');
  app.use(lanGuard({ allowPublic }));
  app.use(accessGate({ code: accessCode }));
  app.use(express.json({ limit: '8mb' }));

  app.get('/vendor/preact-htm.js', (_req, res) => {
    res.type('application/javascript').sendFile(path.join(here, 'node_modules', 'htm', 'preact', 'standalone.module.js'));
  });
  app.use(express.static(path.join(here, 'public'), { extensions: ['html'] }));

  const wrap = (fn) => (req, res) => Promise.resolve(fn(req, res)).catch((err) => {
    res.status(err.status || 500).json({ error: err.message || 'Server error', ...(err.current ? { current: err.current } : {}) });
  });

  app.get('/api/health', (_req, res) => res.json({ ok: true, port: PORT }));

  // How other devices can reach this server (shown in Settings).
  app.get('/api/network', (req, res) => {
    const port = req.socket.localPort || PORT;
    const open = HOST === '0.0.0.0' || HOST === '::';
    res.json({
      port,
      host: HOST,
      open,
      urls: open ? lanAddresses().map((ip) => `http://${ip}:${port}`) : [],
      accessCode: Boolean(accessCode),
      allowPublic,
      thisDevice: isLoopback(req.socket.remoteAddress),
    });
  });

  app.get('/api/projects', wrap(async (_req, res) => res.json(await storage.list())));

  app.post('/api/projects', wrap(async (req, res) => {
    let project;
    if (req.body?.sample) project = { ...sampleProject(), id: uid('proj'), title: 'What He Left (sample copy)' };
    else if (req.body?.project) project = { ...req.body.project, id: uid('proj') };
    else project = newProject(String(req.body?.title || 'Untitled story').slice(0, 200));
    res.status(201).json(await storage.save(project));
  }));

  app.get('/api/projects/:id', wrap(async (req, res) => {
    const p = await storage.get(req.params.id);
    if (!p) return res.status(404).json({ error: 'Project not found' });
    res.json(p);
  }));

  app.get('/api/projects/:id/meta', wrap(async (req, res) => {
    const m = await storage.meta(req.params.id);
    if (!m) return res.status(404).json({ error: 'Project not found' });
    res.json(m);
  }));

  // The body's `revision` is the version the client started from; a stale
  // one is refused with 409 (and the current project) unless ?force=1.
  app.put('/api/projects/:id', wrap(async (req, res) => {
    if (!req.body || req.body.id !== req.params.id) return res.status(400).json({ error: 'Project id mismatch' });
    const expected = req.body.revision == null ? null : Number(req.body.revision);
    res.json(await storage.save(req.body, { expectedRevision: expected, force: req.query.force === '1' }));
  }));

  app.delete('/api/projects/:id', wrap(async (req, res) => {
    await storage.remove(req.params.id);
    res.status(204).end();
  }));

  app.get('/api/ai/status', (_req, res) => res.json(aiStatus()));

  // Server-sent events over a POST response.
  app.post('/api/ai/chat', async (req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/event-stream; charset=utf-8', 'Cache-Control': 'no-cache, no-transform', Connection: 'keep-alive', 'X-Accel-Buffering': 'no' });
    const send = (event, data) => { if (!res.writableEnded) res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`); };
    const controller = new AbortController();
    res.on('close', () => controller.abort());
    const apiKey = String(req.get('x-anthropic-key') || '').trim() || undefined;
    try {
      await runChat({ body: req.body || {}, apiKey, send, signal: controller.signal });
      send('done', {});
    } catch (err) {
      if (!controller.signal.aborted) send('error', describeError(err));
    } finally {
      res.end();
    }
  });

  app.use('/api', (_req, res) => res.status(404).json({ error: 'Not found' }));
  return app;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await storage.ensure();
  createApp().listen(PORT, HOST, () => {
    const ai = aiStatus();
    const open = HOST === '0.0.0.0' || HOST === '::';
    console.log(`Dialogue Devil is running.`);
    console.log(`  This computer:  http://localhost:${PORT}`);
    if (open) for (const ip of lanAddresses()) console.log(`  Your network:   http://${ip}:${PORT}   (phones, tablets, other computers on this Wi-Fi/LAN)`);
    else console.log(`  Bound to ${HOST} only (set HOST=0.0.0.0 to open it to your network).`);
    if (open) console.log(process.env.DD_ALLOW_PUBLIC === '1' ? '  Public addresses: allowed (DD_ALLOW_PUBLIC=1).' : '  Only private-network addresses may connect.');
    if (open) console.log(process.env.DD_ACCESS_CODE ? '  Access code: required on other devices (DD_ACCESS_CODE).' : '  Access code: off. Set DD_ACCESS_CODE=… to require one on other devices.');
    console.log(ai.mock ? 'AI: mock mode (DD_AI_MOCK=1)' : ai.serverKey ? `AI: server key found, default model ${ai.defaultModel}` : 'AI: off until a key is added in Settings or ANTHROPIC_API_KEY is set');
    if (open && ai.serverKey && !process.env.DD_ACCESS_CODE) console.log('  Note: devices on your network can use the server\'s API key. Set DD_ACCESS_CODE to restrict access.');
  });
}
