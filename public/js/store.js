// Global app state: the open project (mutated in place, then broadcast),
// routing, settings, autosave and undo/redo.

import { useState, useEffect, debounce } from './lib.js';
import { normalizeProject } from './model.js';
import * as api from './api.js';

const SETTINGS_KEY = 'dd:settings';
const listeners = new Set();

function loadSettings() {
  const defaults = { theme: 'system', apiKey: '', model: '', showSubtext: true, lastProjectId: '', drawerOpen: window.innerWidth >= 1240 };
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

const persist = debounce(async () => {
  const p = state.project;
  if (!p) return;
  try { localStorage.setItem(`dd:backup:${p.id}`, JSON.stringify(p)); } catch { /* quota */ }
  state.saving = 'saving';
  emit();
  try {
    await api.saveProject(p);
    state.saving = 'saved';
  } catch (err) {
    state.saving = 'error';
    state.error = `Not saved to server: ${err.message}. A local backup is kept in this browser.`;
  }
  emit();
}, 700);

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
  state.saving = 'pending';
  emit();
  persist();
}

// A structural edit: always its own undo step.
export const act = (fn) => mutate(fn, { checkpoint: true });

export const canUndo = () => undoStack.length > 0;
export const canRedo = () => redoStack.length > 0;

function restore(json) {
  state.project = normalizeProject(JSON.parse(json));
  lastEdit = 0;
  emit();
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
  persist.flush();
  const p = await api.getProject(id);
  state.project = normalizeProject(p);
  lastEdit = 0;
  undoStack.length = 0;
  redoStack.length = 0;
  state.saving = 'saved';
  setSetting('lastProjectId', id);
  emit();
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

window.addEventListener('beforeunload', () => persist.flush());
