// Global app state: the open project (mutated in place, then broadcast),
// routing, settings, autosave and undo/redo.

import { useState, useEffect, debounce } from './lib.js';
import { normalizeProject } from './model.js';
import * as api from './api.js';

const SETTINGS_KEY = 'dd:settings';
const listeners = new Set();

function loadSettings() {
  const defaults = { theme: 'system', apiKey: '', model: '', showSubtext: true, showPossible: true, showDismissed: false, readDirections: false, lastProjectId: '', drawerOpen: window.innerWidth >= 1240 };
  try {
    return { ...defaults, ...JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}') };
  } catch {
    return defaults;
  }
}

export function parseHash(hash = location.hash) {
  const parts = hash.replace(/^#\/?/, '').split('/').filter(Boolean).map(decodeURIComponent);
  const [name = 'story', id = '', tab = ''] = parts;
  return { name, id, tab };
}

export const state = {
  project: null,
  projects: [],
  version: 0,
  saving: 'idle',
  error: '',
  route: parseHash(),
  settings: loadSettings(),
  ai: null,
  toast: null,
  drawer: { tab: '', request: null },
  conflict: null, // { remote } when another device saved first
};

export function emit() {
  state.version++;
  for (const fn of listeners) fn();
}

export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function useStore() {
  const [, setTick] = useState(0);
  useEffect(() => subscribe(() => setTick((t) => t + 1)), []);
  return state;
}

// ---------------------------------------------------------------------------
// Settings & routing
// ---------------------------------------------------------------------------

export function setSetting(key, value) {
  state.settings = { ...state.settings, [key]: value };
  try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(state.settings)); } catch { /* private mode */ }
  if (key === 'theme') applyTheme();
  emit();
}

export function applyTheme() {
  const t = state.settings.theme;
  if (t === 'light' || t === 'dark') document.documentElement.dataset.theme = t;
  else delete document.documentElement.dataset.theme;
}

export function navigate(path) {
  const target = path.startsWith('#') ? path : `#/${path}`;
  if (location.hash !== target) location.hash = target;
}

window.addEventListener('hashchange', () => {
  state.route = parseHash();
  emit();
  document.querySelector('main')?.scrollTo?.(0, 0);
});

let toastTimer;
export function toast(message, kind = 'info') {
  state.toast = { message, kind, id: Date.now() };
  emit();
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { state.toast = null; emit(); }, 3200);
}

// ---------------------------------------------------------------------------
// Project lifecycle, autosave, undo
// ---------------------------------------------------------------------------

const undoStack = [];
const redoStack = [];
let lastEdit = 0;
let dirty = false; // local changes the server has not confirmed yet
let inflight = null; // the save request in progress
let again = false; // edits arrived while a save was in flight

const backupKey = (id) => `dd:backup:${id}`;

// A crash-safe copy of the open project in this browser. `dirty` marks
// changes the server has not confirmed; they are restored on the next open.
function writeBackup(isDirty, p = state.project) {
  if (!p) return;
  try { localStorage.setItem(backupKey(p.id), JSON.stringify({ dirty: isDirty, at: Date.now(), project: p })); } catch { /* quota or private mode */ }
}
const backupSoon = debounce(() => writeBackup(true), 250);

function readBackup(id) {
  try {
    const b = JSON.parse(localStorage.getItem(backupKey(id)) || 'null');
    return b && b.dirty && b.project ? normalizeProject(b.project) : null;
  } catch {
    return null;
  }
}

function clearUndo() {
  undoStack.length = 0;
  redoStack.length = 0;
  lastEdit = 0;
}

// One save at a time. The request carries the revision this browser started
// from; if another device saved in between, the server answers 409 and the
// writer chooses what to keep.
async function save({ keepalive = false } = {}) {
  const p = state.project;
  if (!p || !dirty || state.conflict) return;
  if (inflight) { again = true; return; }
  dirty = false;
  state.saving = 'saving';
  emit();
  inflight = (async () => {
    try {
      const saved = await api.saveProject(p, { keepalive });
      p.revision = saved.revision;
      if (state.project === p) {
        state.error = '';
        state.saving = dirty ? 'pending' : 'saved';
        if (!dirty) writeBackup(false);
      }
    } catch (err) {
      if (state.project !== p) {
        // The writer switched projects meanwhile: keep these edits for the
        // next time that project is opened.
        writeBackup(true, p);
      } else {
        dirty = true;
        if (err.status === 409 && err.body?.current) {
          state.conflict = { remote: normalizeProject(err.body.current) };
          state.saving = 'conflict';
        } else {
          state.saving = 'error';
          state.error = `Not saved to the server (${err.message}). Your changes are kept in this browser and will be retried.`;
        }
      }
    }
    emit();
  })();
  await inflight;
  inflight = null;
  if (again) {
    again = false;
    if (dirty) persist();
  }
}

const persist = debounce(() => save(), 700);

function flushNow(opts) {
  persist.cancel();
  return save(opts);
}

// Mutate the open project in place and schedule a save. Continuous edits
// (typing) share one undo step until the writer pauses; `checkpoint` makes a
// structural action (add, move, delete, apply) its own undo step.
export function mutate(fn, { checkpoint = false } = {}) {
  const p = state.project;
  if (!p) return;
  const now = Date.now();
  if (checkpoint || now - lastEdit > 1200) {
    undoStack.push(JSON.stringify(p));
    if (undoStack.length > 80) undoStack.shift();
    redoStack.length = 0;
  }
  lastEdit = checkpoint ? 0 : now;
  fn(p);
  dirty = true;
  if (!state.conflict) state.saving = 'pending';
  emit();
  backupSoon();
  persist();
}

// A structural edit: always its own undo step.
export const act = (fn) => mutate(fn, { checkpoint: true });

export const canUndo = () => undoStack.length > 0;
export const canRedo = () => redoStack.length > 0;

function restore(json) {
  const revision = state.project?.revision || 0;
  state.project = normalizeProject(JSON.parse(json));
  state.project.revision = revision;
  lastEdit = 0;
  dirty = true;
  emit();
  backupSoon();
  persist();
}

export function undo() {
  if (!undoStack.length) return;
  redoStack.push(JSON.stringify(state.project));
  restore(undoStack.pop());
}

export function redo() {
  if (!redoStack.length) return;
  undoStack.push(JSON.stringify(state.project));
  restore(redoStack.pop());
}

export async function refreshProjects() {
  state.projects = await api.listProjects();
  emit();
  return state.projects;
}

export async function openProject(id) {
  // Settle the outgoing project's backup now; a pending debounced write would
  // otherwise land on the incoming one.
  backupSoon.cancel();
  if (dirty) writeBackup(true);
  await flushNow();
  const server = normalizeProject(await api.getProject(id));
  const local = readBackup(id);
  clearUndo();
  state.conflict = null;
  if (local && local.revision === server.revision) {
    // Unsaved edits from this browser, made on top of the current version.
    state.project = local;
    dirty = true;
    state.saving = 'pending';
    toast('Restored unsaved changes from this browser');
    persist();
  } else if (local) {
    // Unsaved edits here, and the project moved on elsewhere.
    state.project = local;
    dirty = true;
    state.conflict = { remote: server };
    state.saving = 'conflict';
  } else {
    state.project = server;
    dirty = false;
    state.saving = 'saved';
  }
  setSetting('lastProjectId', id);
  emit();
}

// The writer's answer to a save conflict.
export async function resolveConflict(choice) {
  const c = state.conflict;
  if (!c) return;
  if (choice === 'theirs') {
    state.project = c.remote;
    state.conflict = null;
    dirty = false;
    clearUndo();
    state.saving = 'saved';
    writeBackup(false);
    emit();
    toast('Loaded the latest version');
  } else if (choice === 'mine') {
    state.project.revision = c.remote.revision;
    state.conflict = null;
    dirty = true;
    emit();
    await flushNow();
    toast('Your version was saved over the other one');
  } else if (choice === 'copy') {
    const mine = JSON.parse(JSON.stringify(state.project));
    try { localStorage.setItem(backupKey(c.remote.id), JSON.stringify({ dirty: false, at: Date.now(), project: c.remote })); } catch { /* ignore */ }
    state.conflict = null;
    dirty = false;
    await createAndOpen({ project: { ...mine, title: `${mine.title} (my copy)` } });
    toast('Your version was saved as a copy');
  }
}

// Picks up changes saved by other devices while this one is idle.
async function poll() {
  const p = state.project;
  if (!p || document.hidden || state.conflict || inflight) return;
  if (dirty) {
    if (state.saving === 'error') save();
    return;
  }
  try {
    const m = await api.projectMeta(p.id);
    if (m.revision <= p.revision) return;
    const fresh = normalizeProject(await api.getProject(p.id));
    if (dirty || inflight || state.project !== p) return;
    state.project = fresh;
    clearUndo();
    writeBackup(false);
    emit();
    toast('Updated with changes from another device');
  } catch (err) {
    if (err.status === 404 && state.project === p) {
      toast('This project was deleted on another device', 'error');
      const list = await refreshProjects();
      if (list.length) await openProject(list[0].id);
      else await createAndOpen({ sample: true });
    }
  }
}

export async function createAndOpen(body) {
  const p = await api.createProject(body);
  await refreshProjects();
  await openProject(p.id);
  navigate('story');
  return p;
}

export async function removeProject(id) {
  await api.deleteProject(id);
  const list = await refreshProjects();
  if (state.project?.id === id) {
    if (list.length) await openProject(list[0].id);
    else await createAndOpen({ sample: true });
  }
}

export async function boot() {
  applyTheme();
  try {
    state.ai = await api.aiStatus();
  } catch {
    state.ai = { serverKey: false, mock: false, models: [] };
  }
  const list = await refreshProjects();
  const want = state.settings.lastProjectId;
  const id = list.some((p) => p.id === want) ? want : list[0]?.id;
  if (id) await openProject(id);
  else await createAndOpen({ sample: true });
  setInterval(poll, 4000);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) poll(); });
}

export function aiAvailable() {
  return Boolean(state.ai?.mock || state.ai?.serverKey || state.settings.apiKey);
}

// Ask the assistant drawer to open a tab, optionally with a request payload
// (e.g. { mode: 'alternatives', lineId }).
export function openDrawer(tab, request = null) {
  state.drawer = { tab, request: request ? { ...request, at: Date.now() } : null };
  if (!state.settings.drawerOpen) setSetting('drawerOpen', true);
  else emit();
}

// Leaving or hiding the page: keep a local copy and send pending edits with
// a keepalive request, so the last keystrokes are not lost.
function flushOnHide() {
  if (!state.project) return;
  backupSoon.cancel();
  writeBackup(dirty);
  if (dirty) flushNow({ keepalive: true });
}
document.addEventListener('visibilitychange', () => { if (document.hidden) flushOnHide(); });
window.addEventListener('pagehide', flushOnHide);
