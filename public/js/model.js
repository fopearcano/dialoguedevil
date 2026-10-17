// Data model: factories, defaults and path helpers for projects, characters,
// scenes, beats and lines.

import { VOICE_DIMENSIONS } from './mckee.js';
import { normLang, tr } from './i18n.js';

export const uid = (p = 'id') => `${p}_${Math.random().toString(36).slice(2, 8)}${Date.now().toString(36).slice(-4)}`;

// Categorical color slots (validated palette, see css). Color follows the
// character: once assigned, a slot never moves to another character.
export const SLOT_COUNT = 8;

export function defaultSliders() {
  return Object.fromEntries(VOICE_DIMENSIONS.map((d) => [d.id, 50]));
}

export function newCharacter(project, name = tr('New character')) {
  const used = new Set((project?.characters || []).map((c) => c.slot));
  let slot = -1;
  for (let i = 0; i < SLOT_COUNT; i++) if (!used.has(i)) { slot = i; break; }
  return normalizeCharacter({ id: uid('char'), name, slot });
}

export function normalizeCharacter(c) {
  const lvl = (x) => ({ text: '', level: 0, ...(x || {}) });
  return {
    id: c.id || uid('char'),
    name: c.name || tr('Unnamed'),
    slot: c.slot ?? -1,
    role: c.role || '',
    logline: c.logline || '',
    characterization: { summary: '', biology: '', upbringing: '', education: '', mentality: '', values: '', ...(c.characterization || {}) },
    trueCharacter: { core: '', contradiction: '', mentality: 'dramatic', humor: '', ...(c.trueCharacter || {}) },
    spheres: { said: '', unsaid: '', unsayable: '', ...(c.spheres || {}) },
    desire: { incitingIncident: '', objectOfDesire: '', superIntention: '', subconsciousDesire: '', motivation: '', excuse: '', spine: '', ...(c.desire || {}) },
    antagonism: {
      physical: lvl(c.antagonism?.physical), social: lvl(c.antagonism?.social),
      personal: lvl(c.antagonism?.personal), inner: lvl(c.antagonism?.inner),
    },
    relationships: (c.relationships || []).map((r) => ({ id: r.id || uid('rel'), targetId: '', label: '', charge: 0, restraint: '', ...r })),
    voice: {
      sliders: { ...defaultSliders(), ...(c.voice?.sliders || {}) },
      context: c.voice?.context ?? 50,
      knowledge: [], modifiers: [], signature: [], neverSays: [], culture: [],
      modality: '', lineDesign: 'mixed', dialect: '', tics: '',
      ...(c.voice || {}),
    },
    secrets: (c.secrets || []).map((s) => ({ id: s.id || uid('sec'), text: '', dilemma: '', ...s })),
    facts: (c.facts || []).map((f) => ({ id: f.id || uid('fact'), text: '', importance: 3, ...f })),
    samples: { ...(c.samples || {}) },
    notes: c.notes || '',
  };
}

export function newScene(project, title = tr('New scene')) {
  const chars = project?.characters || [];
  const scene = normalizeScene({
    id: uid('scene'),
    title,
    participants: chars.slice(0, 2).map((c) => ({ characterId: c.id })),
    values: [{ id: uid('val'), positive: project?.coreValue?.positive || tr('trust'), negative: project?.coreValue?.negative || tr('distrust'), opening: 0 }],
  });
  return scene;
}

export function normalizeScene(s) {
  return {
    id: s.id || uid('scene'),
    title: s.title || tr('Untitled scene'),
    heading: s.heading || '',
    description: s.description || '',
    medium: s.medium || '',
    track: s.track || 'others',
    mode: s.mode || 'dramatized',
    conflictType: s.conflictType || 'balanced',
    participants: (s.participants || []).map((p) => ({ characterId: '', intention: '', subIntention: '', tactic: '', antagonism: '', ...p })),
    driver: s.driver || '',
    values: (s.values || []).map((v) => ({ id: v.id || uid('val'), positive: '', negative: '', opening: 0, ...v })),
    thirdThing: s.thirdThing || '',
    exposition: (s.exposition || []).map((f) => ({ id: f.id || uid('exp'), text: '', delivered: false, ...f })),
    turningPoint: { type: 'action', note: '', ...(s.turningPoint || {}) },
    beats: (s.beats || []).map(normalizeBeat),
    notes: s.notes || '',
    dismissed: Array.isArray(s.dismissed) ? s.dismissed : [],
    review: s.review && s.review.at ? { hashes: {}, issues: [], disputes: [], summary: '', model: '', ...s.review } : null,
  };
}

export function newBeat(scene, overrides = {}) {
  const last = scene.beats?.[scene.beats.length - 1];
  const parts = scene.participants || [];
  const charges = {};
  for (const v of scene.values || []) charges[v.id] = last?.charges?.[v.id] ?? v.opening ?? 0;
  return normalizeBeat({
    id: uid('beat'),
    actor: last ? last.reactor || parts[0]?.characterId : parts[0]?.characterId,
    reactor: last ? last.actor || parts[1]?.characterId : parts[1]?.characterId,
    intensity: Math.min(10, (Number(last?.intensity) || 0) + 1),
    charges,
    ...overrides,
  });
}

export function normalizeBeat(b) {
  return {
    id: b.id || uid('beat'),
    actor: b.actor || '',
    action: b.action || '',
    reactor: b.reactor || '',
    reaction: b.reaction || '',
    intensity: b.intensity ?? 1,
    charges: { ...(b.charges || {}) },
    note: b.note || '',
    lines: (b.lines || []).map(normalizeLine),
  };
}

export function newLine(overrides = {}) {
  return normalizeLine({ id: uid('line'), ...overrides });
}

export function normalizeLine(l) {
  return {
    id: l.id || uid('line'),
    kind: l.kind || 'line',
    speaker: l.speaker || '',
    text: l.text || '',
    paren: l.paren || '',
    subtext: l.subtext || '',
    tactic: l.tactic || '',
    design: l.design || '',
    exposition: !!l.exposition,
    alternatives: Array.isArray(l.alternatives) ? l.alternatives : [],
    dismissed: Array.isArray(l.dismissed) ? l.dismissed : [],
    marked: !!l.marked,
  };
}

// lang: the language the dialogue is written in; analysis follows it.
export function newProject(title = tr('Untitled story'), lang = 'en') {
  return normalizeProject({ id: uid('proj'), title, lang });
}

export function normalizeProject(p) {
  return {
    id: p.id || uid('proj'),
    lang: normLang(p.lang),
    title: p.title || tr('Untitled story'),
    logline: p.logline || '',
    medium: p.medium || 'screen',
    genre: p.genre || '',
    genreMode: p.genreMode || 'realism',
    coreValue: { positive: '', negative: '', ...(p.coreValue || {}) },
    incitingIncident: p.incitingIncident || '',
    mdq: p.mdq || '',
    characters: (p.characters || []).map(normalizeCharacter),
    scenes: (p.scenes || []).map(normalizeScene),
    chats: p.chats || {},
    revision: Number(p.revision) || 0,
    createdAt: p.createdAt || new Date().toISOString(),
    updatedAt: p.updatedAt || new Date().toISOString(),
  };
}

// ---------------------------------------------------------------------------
// Path helpers ("voice.sliders.pace", "secrets.0.text")
// ---------------------------------------------------------------------------

export function getPath(obj, path) {
  return String(path).split('.').reduce((o, k) => (o == null ? undefined : o[k]), obj);
}

export function setPath(obj, path, value) {
  const keys = String(path).split('.');
  let o = obj;
  for (let i = 0; i < keys.length - 1; i++) {
    const k = keys[i];
    if (o[k] == null || typeof o[k] !== 'object') o[k] = /^\d+$/.test(keys[i + 1]) ? [] : {};
    o = o[k];
  }
  const last = keys[keys.length - 1];
  o[last] = value;
  if (Array.isArray(o) && /^\d+$/.test(last) && value && typeof value === 'object' && !value.id) value.id = uid('item');
  return obj;
}

export function characterById(project, id) {
  return (project.characters || []).find((c) => c.id === id);
}

export function sceneById(project, id) {
  return (project.scenes || []).find((s) => s.id === id);
}

// Find a line anywhere in a scene: returns { beat, line, beatIndex, lineIndex }.
export function locateLine(scene, lineId) {
  for (let bi = 0; bi < (scene.beats || []).length; bi++) {
    const beat = scene.beats[bi];
    const li = (beat.lines || []).findIndex((l) => l.id === lineId);
    if (li >= 0) return { beat, line: beat.lines[li], beatIndex: bi, lineIndex: li };
  }
  return null;
}
