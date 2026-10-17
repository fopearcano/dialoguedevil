// The double-check exists to limit misses. These tests measure misses on a
// labeled corpus (rules alone vs. the merged double-check), guard against
// false alarms on clean dialogue, and pin the merge semantics.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { analyzeLine } from '../public/js/analysis.js';
import { secondReadLine, fuzzyContains, stem } from '../public/js/secondreader.js';
import { doubleCheckScene, lineHash } from '../public/js/doublecheck.js';
import { sampleProject } from '../public/js/sample.js';
import { words } from '../public/js/analysis.js';
import { FLAWED_LINES, HELD_OUT_FLAWED, CLEAN_LINES, REPETITIOUS_EXCHANGE } from './fixtures/flawed-lines.js';

function recall(set) {
  let rules = 0;
  let merged = 0;
  for (const c of set) {
    const line = { text: c.text, tactic: 'testing' };
    const ctx = { beat: c.intensity ? { intensity: c.intensity } : undefined };
    const r = analyzeLine(line, ctx).map((f) => f.flaw);
    const s = secondReadLine(line, ctx).map((f) => f.flaw);
    if (c.expect.some((e) => r.includes(e))) rules++;
    if (c.expect.some((e) => r.includes(e) || s.includes(e))) merged++;
  }
  return { rules: rules / set.length, merged: merged / set.length };
}

test('double-check catches far more of the labeled flaws than rules alone', () => {
  const tuning = recall(FLAWED_LINES);
  const held = recall(HELD_OUT_FLAWED);
  assert.ok(tuning.merged >= 0.95, `tuning recall ${tuning.merged}`);
  assert.ok(held.merged >= 0.9, `held-out recall ${held.merged}`);
  assert.ok(held.merged - held.rules >= 0.3, `held-out gain ${held.rules} -> ${held.merged}`);
});

test('few false alarms on clean dialogue and on the sample scene', () => {
  const alarms = CLEAN_LINES.filter((t) => [...analyzeLine({ text: t, tactic: 'testing' }), ...secondReadLine({ text: t, tactic: 'testing' })].some((f) => f.severity !== 'good'));
  assert.ok(alarms.length <= 1, `false alarms: ${alarms.join(' | ')}`);
  const p = sampleProject();
  const { stats } = doubleCheckScene(p.scenes[0], p);
  assert.ok(stats.flagged + stats.possible + stats.confirmed <= 2, JSON.stringify(stats));
});

test('fuzzy phrase matching tolerates inflection, padding and punctuation, not loose pairs', () => {
  const t = (s) => words(s).map(stem);
  assert.ok(fuzzyContains(t("We're back at square one."), 'back to square one'));
  assert.ok(fuzzyContains(t('She bit the bullet.'), 'bite the bullet'));
  assert.ok(fuzzyContains(t('Are you freaking kidding me?'), 'are you kidding me'));
  assert.ok(fuzzyContains(t('Oh. My. God.'), 'oh my god'));
  assert.ok(!fuzzyContains(t("I couldn't get away, could I?"), 'i get it'));
  assert.ok(!fuzzyContains(t("You don't get to tell me what he wanted."), "you just don't get it"));
});

test('the same request in different words is caught (Ch. 9)', () => {
  const scene = { values: [], beats: [{ id: 'b', lines: REPETITIOUS_EXCHANGE.map(([speaker, text], i) => ({ id: `l${i}`, speaker, text })) }] };
  const dc = doubleCheckScene(scene, { characters: [] });
  const rep = dc.scene.find((f) => f.flaw === 'repetitiousBeats');
  assert.ok(rep, 'scene-level repetition found');
  assert.ok(rep.notes.some((n) => /talk to|listen|hear/.test(n.message)));
});

test('merge: agreement confirms, single sensitive check is possible, dismissals stop counting', () => {
  const scene = {
    values: [],
    beats: [{ id: 'b', lines: [
      { id: 'x', speaker: 'a', text: "I'm so angry at you right now.", tactic: 'accusing' },
      { id: 'y', speaker: 'b', text: 'All I want is for you to stay.', tactic: 'pleading' },
      { id: 'z', speaker: 'a', text: 'Hi, how are you?', tactic: 'stalling', dismissed: ['clutter'] },
    ] }],
  };
  const dc = doubleCheckScene(scene, { characters: [] });
  const onx = dc.lines.x.find((f) => f.flaw === 'onTheNose');
  assert.equal(onx.status, 'confirmed');
  assert.deepEqual(onx.sources.sort(), ['reader', 'rules']);
  assert.equal(dc.lines.y.find((f) => f.flaw === 'onTheNose').status, 'possible');
  assert.ok(dc.lines.z.find((f) => f.flaw === 'clutter').dismissed);
  assert.equal(dc.stats.dismissed >= 1, true);
});

test('merge: AI review adds misses, disputes rule findings, and goes stale when a line changes', () => {
  const lines = [
    { id: 'p', speaker: 'a', text: 'Pass the salt.', tactic: 'stalling' },
    { id: 'q', speaker: 'b', text: 'Hi, how are you?', tactic: 'deflecting' },
  ];
  const scene = { values: [], beats: [{ id: 'b', lines }] };
  scene.review = {
    at: new Date().toISOString(),
    hashes: { p: lineHash(lines[0]), q: lineHash(lines[1]) },
    issues: [{ lineId: 'p', flaw: 'characterNeutral', severity: 'info', evidence: 'Pass the salt.', note: 'Generic.', fix: '' }],
    disputes: [{ lineId: 'q', flaw: 'clutter', reason: 'Deliberate stalling; the small talk is the tactic.' }],
  };
  let dc = doubleCheckScene(scene, { characters: [] });
  assert.equal(dc.lines.p.find((f) => f.flaw === 'characterNeutral').status, 'possible');
  assert.match(dc.lines.q.find((f) => f.flaw === 'clutter').disputed, /Deliberate/);
  assert.equal(dc.ai.current.size, 2);
  lines[0].text = 'Pass the salt, please.';
  dc = doubleCheckScene(scene, { characters: [] });
  assert.equal(dc.ai.changed, 1);
  assert.ok(!dc.lines.p.some((f) => f.sources?.includes('ai')), 'stale AI findings are dropped');
});

test('writer flags from a table read become their own finding', () => {
  const scene = { values: [], beats: [{ id: 'b', lines: [{ id: 'w', speaker: 'a', text: 'Pass the salt.', tactic: 'stalling', marked: true }] }] };
  const dc = doubleCheckScene(scene, { characters: [] });
  const f = dc.lines.w.find((x) => x.flaw === 'tableRead');
  assert.equal(f.status, 'writer');
  assert.equal(dc.stats.writer, 1);
});
