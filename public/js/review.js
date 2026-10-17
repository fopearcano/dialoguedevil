// The AI layer of the double-check: one review pass over a scene that
// reports what the other checks missed and disputes their false alarms.
// Results are stored on the scene with a fingerprint of every line read, so
// they go stale line by line as the writer revises.

import { streamChat } from './api.js';
import { state, act } from './store.js';
import { doubleCheckScene, lineHash } from './doublecheck.js';
import { flattenLines } from './analysis.js';
import { sceneForAI, projectMeta, fullChar, analyzerSummary } from './aicontext.js';
import { characterById, sceneById } from './model.js';

export async function runAiReview(sceneId, { onText, signal } = {}) {
  const p = state.project;
  const scene = sceneById(p, sceneId);
  if (!scene) throw new Error('Scene not found.');
  const speech = flattenLines(scene, { speechOnly: true }).map((e) => e.line).filter((l) => String(l.text || '').trim());
  if (!speech.length) throw new Error('Write some lines first.');
  // Fingerprints taken before the request: lines edited while the review
  // runs will read as changed, and their AI findings as stale.
  const hashes = Object.fromEntries(speech.map((l) => [l.id, lineHash(l)]));
  const context = {
    meta: { sceneId },
    data: {
      project: projectMeta(p),
      scene: sceneForAI(scene, p),
      characters: scene.participants.map((x) => fullChar(characterById(p, x.characterId))).filter(Boolean),
      analyzer: analyzerSummary(doubleCheckScene(scene, p), scene),
    },
  };
  let report = null;
  let error = '';
  await streamChat({
    apiKey: state.settings.apiKey || undefined,
    signal,
    body: {
      mode: 'review',
      model: state.settings.model || undefined,
      messages: [{ role: 'user', content: 'Double-check this scene: report what the analyzer missed and dispute its false alarms.' }],
      context,
    },
    onEvent: (type, data) => {
      if (type === 'text') onText?.(data.delta);
      else if (type === 'proposal' && data.tool === 'report_issues') report = data.input;
      else if (type === 'error' || type === 'refusal') error = data.message;
    },
  });
  if (!report) throw new Error(error || 'The reviewer returned no report.');
  const known = new Set(Object.keys(hashes));
  const keep = (x) => !x.line_id || known.has(x.line_id);
  act((proj) => {
    const s = sceneById(proj, sceneId);
    if (!s) return;
    s.review = {
      at: new Date().toISOString(),
      model: state.settings.model || state.ai?.defaultModel || '',
      hashes,
      summary: report.summary || '',
      issues: (report.issues || []).filter(keep).map((i) => ({ lineId: i.line_id || '', flaw: i.flaw, severity: i.severity, evidence: i.evidence || '', note: i.note, fix: i.fix || '' })),
      disputes: (report.disputes || []).filter(keep).map((d) => ({ lineId: d.line_id || '', flaw: d.flaw, reason: d.reason || '' })),
    };
  });
  return report;
}
