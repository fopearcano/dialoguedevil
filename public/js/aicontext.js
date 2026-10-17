// Builders for the project context sent to the AI collaborator.

import { characterById } from './model.js';
import { SOURCE_LABEL } from './doublecheck.js';

export function briefChar(c) {
  return c ? { id: c.id, name: c.name, role: c.role, logline: c.logline } : null;
}

export function fullChar(c) {
  if (!c) return null;
  const { notes, ...rest } = c;
  return rest;
}

export function sceneForAI(s, p) {
  if (!s) return null;
  const name = (id) => characterById(p, id)?.name || '';
  return {
    id: s.id, title: s.title, heading: s.heading, description: s.description, medium: s.medium || p.medium,
    track: s.track, mode: s.mode, conflictType: s.conflictType, thirdThing: s.thirdThing,
    participants: s.participants.map((x) => ({ ...x, name: name(x.characterId) })),
    driver: name(s.driver), values: s.values, exposition: s.exposition, turningPoint: s.turningPoint,
    beats: s.beats.map((b, i) => ({
      beat: i + 1, actor_id: b.actor, actor: name(b.actor), action: b.action, reactor_id: b.reactor, reactor: name(b.reactor), reaction: b.reaction,
      charges: b.charges, intensity: b.intensity,
      lines: b.lines.map((l) => ({ id: l.id, kind: l.kind, speaker_id: l.speaker, speaker: name(l.speaker), text: l.text, paren: l.paren, subtext: l.subtext, tactic: l.tactic })),
    })),
  };
}

export function projectMeta(p) {
  return { title: p.title, logline: p.logline, medium: p.medium, genre: p.genre, vision: p.genreMode, coreValue: p.coreValue, incitingIncident: p.incitingIncident, mdq: p.mdq };
}

// The double-check's current findings, compact, for the AI to confirm,
// extend or dispute.
export function analyzerSummary(dc, scene) {
  const label = (f) => `${f.flaw} [${f.sources.map((x) => SOURCE_LABEL[x]).join(' + ')}]`;
  const lineFindings = {};
  const dismissed = {};
  for (const [id, fs] of Object.entries(dc.lines)) {
    const active = fs.filter((f) => f.status !== 'good' && !f.dismissed && f.flaw !== 'noSubtext');
    if (active.length) lineFindings[id] = active.map(label);
    const dis = fs.filter((f) => f.dismissed).map((f) => f.flaw);
    if (dis.length) dismissed[id] = dis;
  }
  return {
    lineFindings,
    sceneFindings: dc.scene.filter((f) => f.status !== 'good' && !f.dismissed).map((f) => `${label(f)}: ${f.message}`),
    dismissed,
    sceneDismissed: scene.dismissed || [],
    sixTasks: dc.tasks,
    turningPoint: dc.turningPoint,
  };
}
