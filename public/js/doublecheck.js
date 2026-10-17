// The double-check: merges independent checks so a problem missed by one is
// caught by another, and agreement raises confidence.
//
//   rules          precise patterns (analysis.js)
//   second reader  recall-oriented pass (secondreader.js)
//   AI review      optional model reading; reports misses and disputes
//   writer         lines flagged by ear during a table read
//
// Each merged finding carries its sources and a status:
//   confirmed  two or more independent checks agree
//   flagged    the rules alone
//   possible   one sensitive check alone: verify before acting
//   writer     the writer flagged it by ear
// plus `disputed` (the AI reviewed the line and disagrees) and `dismissed`
// (the writer marked it deliberate).

import { analyzeScene, flattenLines } from './analysis.js';
import { secondReadScene } from './secondreader.js';
import { FLAWS } from './mckee.js';

const RANK = { info: 1, warning: 2, serious: 3, critical: 4 };
const STATUS_ORDER = { writer: 0, confirmed: 1, flagged: 2, possible: 3 };
export const SOURCE_LABEL = { rules: 'Rules', reader: 'Second reader', ai: 'AI review', writer: 'Your ear' };

// Fingerprint of everything a reviewer read on a line; a review goes stale
// for a line as soon as the line changes.
export function lineHash(l) {
  const s = `${l.speaker}|${l.text}|${l.subtext}|${l.tactic}|${l.paren}`;
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  return (h >>> 0).toString(36);
}

export function aiReviewState(scene) {
  const r = scene.review;
  if (!r || !r.at) return null;
  const speech = flattenLines(scene, { speechOnly: true }).map((e) => e.line).filter((l) => String(l.text || '').trim());
  const current = new Set(speech.filter((l) => r.hashes?.[l.id] === lineHash(l)).map((l) => l.id));
  return {
    at: r.at,
    model: r.model || '',
    summary: r.summary || '',
    current,
    total: speech.length,
    changed: speech.filter((l) => r.hashes?.[l.id] && r.hashes[l.id] !== lineHash(l)).length,
    unseen: speech.filter((l) => !r.hashes?.[l.id]).length,
  };
}

function aiFinding(issue) {
  const f = FLAWS[issue.flaw];
  return {
    flaw: issue.flaw,
    severity: RANK[issue.severity] ? issue.severity : 'warning',
    name: f ? f.name : issue.flaw,
    ch: f ? f.ch : null,
    message: issue.note || '',
    fix: issue.fix || (f ? f.fix : ''),
    evidence: issue.evidence || '',
  };
}

export function mergeFindings(entries, { dismissedList = [], disputes = [] } = {}) {
  const goods = [];
  const groups = new Map();
  for (const { f, source } of entries) {
    if (f.severity === 'good') { goods.push({ ...f, status: 'good', sources: [source] }); continue; }
    const g = groups.get(f.flaw) || { flaw: f.flaw, name: f.name, ch: f.ch, fix: f.fix, severity: f.severity, message: f.message, sources: [], notes: [] };
    if (!g.sources.includes(source)) g.sources.push(source);
    g.notes.push({ source, message: f.message, evidence: f.evidence || '' });
    if ((RANK[f.severity] || 0) > (RANK[g.severity] || 0)) g.severity = f.severity;
    if (source === 'rules' && f.message) g.message = f.message;
    groups.set(f.flaw, g);
  }
  const merged = [...groups.values()].map((g) => {
    const status = g.sources.includes('writer') ? 'writer' : g.sources.length >= 2 ? 'confirmed' : g.sources[0] === 'rules' ? 'flagged' : 'possible';
    const dispute = g.sources.includes('ai') ? null : disputes.find((d) => d.flaw === g.flaw);
    return { ...g, status, disputed: dispute ? dispute.reason || 'The AI reviewer disagrees.' : '', dismissed: dismissedList.includes(g.flaw) };
  });
  merged.sort((a, b) => (a.dismissed - b.dismissed) || (STATUS_ORDER[a.status] - STATUS_ORDER[b.status]) || ((RANK[b.severity] || 0) - (RANK[a.severity] || 0)));
  return [...merged, ...goods];
}

export function doubleCheckScene(scene, project = {}) {
  const base = analyzeScene(scene, project);
  const reader = secondReadScene(scene, project);
  const ai = aiReviewState(scene);
  const review = scene.review || {};
  const stats = { confirmed: 0, flagged: 0, possible: 0, writer: 0, disputed: 0, dismissed: 0, linesWithIssues: 0, linesToVerify: 0 };
  const lines = {};
  for (const { line } of flattenLines(scene, { speechOnly: true })) {
    const entries = [];
    for (const f of base.lines[line.id] || []) entries.push({ f, source: 'rules' });
    for (const f of reader.lines[line.id] || []) entries.push({ f, source: 'reader' });
    const reviewed = ai && ai.current.has(line.id);
    if (reviewed) for (const iss of (review.issues || []).filter((i) => i.lineId === line.id)) entries.push({ f: aiFinding(iss), source: 'ai' });
    if (line.marked) entries.push({ f: { flaw: 'tableRead', severity: 'warning', name: FLAWS.tableRead.name, ch: FLAWS.tableRead.ch, message: FLAWS.tableRead.why, fix: FLAWS.tableRead.fix }, source: 'writer' });
    const merged = mergeFindings(entries, {
      dismissedList: line.dismissed || [],
      disputes: reviewed ? (review.disputes || []).filter((d) => d.lineId === line.id) : [],
    });
    lines[line.id] = merged;
    let issue = false;
    let verify = false;
    for (const f of merged) {
      if (f.status === 'good') continue;
      if (f.dismissed) { stats.dismissed++; continue; }
      stats[f.status]++;
      if (f.disputed) stats.disputed++;
      if (f.status === 'possible') verify = true;
      else if (f.severity !== 'info') issue = true;
    }
    if (issue) stats.linesWithIssues++;
    if (verify) stats.linesToVerify++;
  }
  const sceneEntries = [
    ...base.scene.map((f) => ({ f, source: 'rules' })),
    ...reader.scene.map((f) => ({ f, source: 'reader' })),
    ...(ai ? (review.issues || []).filter((i) => !i.lineId).map((i) => ({ f: aiFinding(i), source: 'ai' })) : []),
  ];
  const sceneMerged = mergeFindings(sceneEntries, { dismissedList: scene.dismissed || [], disputes: ai ? (review.disputes || []).filter((d) => !d.lineId) : [] });
  for (const f of sceneMerged) {
    if (f.status === 'good') continue;
    if (f.dismissed) stats.dismissed++;
    else { stats[f.status]++; if (f.disputed) stats.disputed++; }
  }
  return { ...base, lines, scene: sceneMerged, stats, ai, reader };
}
