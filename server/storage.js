// File-based project storage: one JSON file per project in data/projects.

import fs from 'node:fs/promises';
import path from 'node:path';
import { normalizeProject } from '../public/js/model.js';
import { sampleProject } from '../public/js/sample.js';

const ID_RE = /^[A-Za-z0-9_-]{1,64}$/;

export function createStorage(dir) {
  const file = (id) => {
    if (!ID_RE.test(String(id))) throw Object.assign(new Error('Invalid project id'), { status: 400 });
    return path.join(dir, `${id}.json`);
  };

  async function ensure() {
    await fs.mkdir(dir, { recursive: true });
    const entries = await fs.readdir(dir);
    if (!entries.some((f) => f.endsWith('.json'))) await save(sampleProject());
  }

  async function list() {
    const entries = await fs.readdir(dir).catch(() => []);
    const out = [];
    for (const f of entries.filter((x) => x.endsWith('.json'))) {
      try {
        const p = JSON.parse(await fs.readFile(path.join(dir, f), 'utf8'));
        out.push({ id: p.id, title: p.title, logline: p.logline, medium: p.medium, updatedAt: p.updatedAt, characters: (p.characters || []).length, scenes: (p.scenes || []).length });
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

  async function save(project) {
    const p = normalizeProject(project);
    p.updatedAt = new Date().toISOString();
    const target = file(p.id);
    await fs.mkdir(dir, { recursive: true });
    const tmp = `${target}.${process.pid}.tmp`;
    await fs.writeFile(tmp, JSON.stringify(p, null, 2));
    await fs.rename(tmp, target);
    return p;
  }

  async function remove(id) {
    await fs.rm(file(id), { force: true });
  }

  return { ensure, list, get, save, remove, validId: (id) => ID_RE.test(String(id)) };
}
