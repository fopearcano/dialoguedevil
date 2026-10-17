// File-based project storage: one JSON file per project in data/projects.

import fs from 'node:fs/promises';
import path from 'node:path';
import { normalizeProject } from '../public/js/model.js';
import { sampleProject } from '../public/js/sample.js';
import { N_ } from '../public/js/i18n.js';

const ID_RE = /^[A-Za-z0-9_-]{1,64}$/;

// lang: the language of the sample created on first run.
export function createStorage(dir, { lang = 'en' } = {}) {
  const file = (id) => {
    if (!ID_RE.test(String(id))) throw Object.assign(new Error(N_('Invalid project id')), { status: 400 });
    return path.join(dir, `${id}.json`);
  };

  async function ensure() {
    await fs.mkdir(dir, { recursive: true });
    const entries = await fs.readdir(dir);
    if (!entries.some((f) => f.endsWith('.json'))) await save(sampleProject(lang));
  }

  async function list() {
    const entries = await fs.readdir(dir).catch(() => []);
    const out = [];
    for (const f of entries.filter((x) => x.endsWith('.json'))) {
      try {
        const p = JSON.parse(await fs.readFile(path.join(dir, f), 'utf8'));
        out.push({ id: p.id, lang: p.lang || 'en', title: p.title, logline: p.logline, medium: p.medium, updatedAt: p.updatedAt, characters: (p.characters || []).length, scenes: (p.scenes || []).length });
      } catch { /* skip unreadable files */ }
    }
    return out.sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)));
  }

  async function get(id) {
    try {
      return normalizeProject(JSON.parse(await fs.readFile(file(id), 'utf8')));
    } catch (err) {
      if (err.code === 'ENOENT') return null;
      throw err;
    }
  }

  // Saves are serialized per project so a read-check-write can't interleave
  // with another device's save.
  const locks = new Map();
  function withLock(id, fn) {
    const prev = locks.get(id) || Promise.resolve();
    const run = prev.then(fn);
    // The queue's tail never rejects; the caller handles `run`'s outcome.
    const tail = run.catch(() => {}).finally(() => { if (locks.get(id) === tail) locks.delete(id); });
    locks.set(id, tail);
    return run;
  }

  // Every save bumps `revision`. When `expectedRevision` is given and the
  // stored project has moved on (another device saved), the save is refused
  // with 409 and the current version, unless `force` is set.
  async function save(project, { expectedRevision = null, force = false } = {}) {
    const p = normalizeProject(project);
    const target = file(p.id);
    return withLock(p.id, async () => {
      const current = await get(p.id);
      const currentRev = current?.revision || 0;
      if (current && expectedRevision != null && !force && currentRev !== Number(expectedRevision)) {
        throw Object.assign(new Error(N_('This project was changed on another device.')), { status: 409, current });
      }
      p.revision = currentRev + 1;
      p.updatedAt = new Date().toISOString();
      await fs.mkdir(dir, { recursive: true });
      const tmp = `${target}.${process.pid}.${Date.now()}.tmp`;
      await fs.writeFile(tmp, JSON.stringify(p, null, 2));
      await fs.rename(tmp, target);
      return p;
    });
  }

  async function meta(id) {
    const p = await get(id);
    return p ? { id: p.id, revision: p.revision || 0, updatedAt: p.updatedAt } : null;
  }

  async function remove(id) {
    await fs.rm(file(id), { force: true });
  }

  return { ensure, list, get, save, meta, remove, validId: (id) => ID_RE.test(String(id)) };
}
