import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  analyzeLine, analyzeScene, measureVoice, syllables, isLatinate, countPassive,
  sentences, findTurningPoint, voiceDistance, profileCompleteness,
} from '../public/js/analysis.js';
import { CHARACTER_SECTIONS } from '../public/js/mckee.js';
import { toFountain, toAnnotated, toProse } from '../public/js/export.js';
import { sampleProject } from '../public/js/sample.js';

const flaws = (text, ctx = {}, line = {}) => analyzeLine({ text, ...line }, ctx).map((f) => f.flaw);

test('syllable and Latinate heuristics', () => {
  assert.equal(syllables('cat'), 1);
  assert.equal(syllables('falsification'), 5);
  assert.ok(isLatinate('falsifications'));
  assert.ok(isLatinate('factuality'));
  assert.ok(!isLatinate('liar'));
  assert.ok(!isLatinate('remember'));
});

test('sentences ignore parentheticals and keep questions', () => {
  const s = sentences('Expensive? (beat) Two hundred thousand. Who\'s that?');
  assert.equal(s.length, 3);
  assert.ok(s[0].endsWith('?'));
});

test('passive detection skips participial adjectives', () => {
  assert.equal(countPassive('The wedding was planned by the family.'), 1);
  assert.equal(countPassive('I am tired.'), 0);
  assert.equal(countPassive('The family planned the wedding.'), 0);
});

test('on-the-nose lines are flagged (Ch. 8)', () => {
  assert.ok(flaws('I love you, I love you.').includes('onTheNose'));
  assert.ok(flaws("I'm so angry at you right now.").includes('onTheNose'));
  assert.ok(!flaws('Crucify him.').includes('onTheNose'));
});

test('subtext that repeats the text is on-the-nose', () => {
  const f = flaws('I hate that you left me alone with Dad.', {}, { subtext: 'She hates that he left her alone with Dad.', tactic: 'accusing' });
  assert.ok(f.includes('onTheNose'));
});

test('empty talk / forced exposition (Ch. 2, 6)', () => {
  assert.ok(flaws('As you know, we have been married for twenty years.').includes('emptyTalk'));
  assert.ok(flaws('Oh my goodness, darling, how long have we known each other now?').includes('emptyTalk'));
});

test('clutter, clichés and character-neutral phrases (Ch. 7)', () => {
  assert.ok(flaws('Hi, how are you?').includes('clutter'));
  assert.ok(flaws("Well, back to the drawing board, I suppose.").includes('cliche'));
  assert.ok(flaws('Oh my God, what happened?').includes('characterNeutral'));
});

test('arid Latinate speech flagged unless character-specific', () => {
  const line = 'His fabrications are falsifications of factuality and institutional manipulation.';
  assert.ok(flaws(line).includes('arid'));
  const boyd = { name: 'Boyd', voice: { sliders: { latinate: 90 } } };
  assert.ok(!flaws(line, { character: boyd }).includes('arid'));
});

test('mistimed cues: trailing filler', () => {
  assert.ok(flaws("We should sell the place before winter, you know.").includes('mistimedCue'));
  assert.ok(!flaws('Before winter, we sell the place.').includes('mistimedCue'));
});

test('melodrama when emotion exceeds beat intensity (Ch. 6)', () => {
  const f = analyzeLine({ text: 'You RUINED EVERYTHING! Everything!' }, { beat: { intensity: 2 } });
  assert.ok(f.some((x) => x.flaw === 'melodrama'));
});

test('never-says words are out of character', () => {
  const c = { name: 'Nadia', voice: { neverSays: ['awesome'] } };
  assert.ok(analyzeLine({ text: 'That is awesome.' }, { character: c }).some((f) => f.flaw === 'characterNeutral' && f.severity === 'serious'));
});

test('lines without action are nudged; non-gerund tactics corrected', () => {
  assert.ok(flaws('Pass the salt.').includes('noSubtext'));
  assert.ok(!flaws('Pass the salt.', {}, { tactic: 'stalling' }).includes('noSubtext'));
  assert.ok(flaws('Pass the salt.', {}, { tactic: 'stall' }).includes('noSubtext'));
});

test('measureVoice separates emotional staccato from rational long-windedness (Ch. 7, 13)', () => {
  const tony = measureVoice(['Tickets.', 'Bermuda. Go, go.', 'Then what is it, okay? What is it?', 'Why not me?']);
  const melfi = measureVoice([
    'I think the reason you have come back three times today has less to do with dinner than with what we have been discussing in our sessions.',
    'Your proposition, generous as you believe it to be, treats our professional relationship as a transaction you can purchase.',
  ]);
  assert.ok(tony.scores.pace > melfi.scores.pace);
  assert.ok(tony.scores.questions > melfi.scores.questions);
  assert.ok(melfi.scores.rational > tony.scores.rational);
  assert.ok(melfi.scores.complexity > tony.scores.complexity);
  assert.ok(voiceDistance(tony.scores, melfi.scores) > 20);
});

test('scene with no value change is a nonevent (Ch. 9)', () => {
  const scene = {
    values: [{ id: 'v', positive: 'love', negative: 'hate', opening: -3 }],
    beats: [
      { id: 'b1', action: 'begging', reaction: 'rejecting', charges: { v: -3 }, lines: [{ id: 'l1', speaker: 'a', text: 'I have to talk to you.' }] },
      { id: 'b2', action: 'begging', reaction: 'rejecting', charges: { v: -3 }, lines: [{ id: 'l2', speaker: 'b', text: 'Leave me alone.' }] },
    ],
  };
  const r = analyzeScene(scene, { characters: [] });
  assert.ok(r.scene.some((f) => f.flaw === 'misshapenScene'));
  assert.ok(r.scene.some((f) => f.flaw === 'repetitiousBeats'));
});

test('turning point is located at the decisive beat', () => {
  const scene = {
    values: [{ id: 'v', positive: 'trust', negative: 'distrust', opening: 2 }],
    beats: [1, 2, -7, -8].map((c, i) => ({ id: `b${i}`, charges: { v: c }, lines: [] })),
  };
  const tp = findTurningPoint(scene);
  assert.equal(tp.beatIndex, 2);
  assert.ok(tp.reversed);
});

test('sample project analyses cleanly and exports', () => {
  const p = sampleProject();
  assert.ok(p.characters.length >= 2);
  const scene = p.scenes[0];
  const r = analyzeScene(scene, p);
  assert.ok(r.totalLines > 10);
  assert.ok(r.turningPoint && r.turningPoint.reversed, 'sample scene should reverse its value');
  assert.ok(r.tasks.action >= 90, 'every sample line names its action');
  assert.ok(!r.scene.some((f) => f.flaw === 'duelogue'));
  const pairs = r.pairs[0];
  assert.ok(pairs && pairs.distance > 12, 'the two sample voices should be distinct');
  const fountain = toFountain(scene, p);
  assert.match(fountain, /NADIA/);
  assert.match(toAnnotated(scene, p), /## Beat 1/);
  assert.match(toProse(scene, p), /Nadia (said|asked)/);
  for (const c of p.characters) assert.ok(profileCompleteness(c, CHARACTER_SECTIONS).overall >= 60);
});
