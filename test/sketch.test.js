// The writing desk's helpers: quick-entry syntax, pasted scripts, and line
// and beat moves.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  parseEntry, parseScript, titleCase, findCharacter, addEntries, nextSpeaker, cycleSpeaker,
  moveLine, splitBeatAt, mergeBeatUp, insertLineAfter, removeLine, beatGist, speechLines, voiceAfter,
} from '../public/js/sketch.js';
import { newProject, newScene, newCharacter, newLine } from '../public/js/model.js';
import { sampleProject } from '../public/js/sample.js';
import { toFountain } from '../public/js/export.js';

function cast(...names) {
  const p = newProject('t');
  for (const n of names) p.characters.push(newCharacter(p, n));
  const s = newScene(p, 'x');
  s.participants = [];
  p.scenes.push(s);
  return { p, s, id: (n) => p.characters.find((c) => c.name === n).id };
}

test('quick entry: speaker cues, paralanguage, actions, beat breaks', () => {
  const { p, id } = cast('Nadia', 'Teo Ferri');
  assert.deepEqual(parseEntry('Nadia: Black.', p.characters), { kind: 'line', id: id('Nadia'), text: 'Black.', paren: '' });
  assert.equal(parseEntry('teo: Fine.', p.characters).id, id('Teo Ferri'), 'first name, any case');
  assert.deepEqual(parseEntry('NADIA (quietly): Go.', p.characters), { kind: 'line', id: id('Nadia'), text: 'Go.', paren: 'quietly' });
  assert.deepEqual(parseEntry('(beat) Still here?', p.characters), { kind: 'line', text: 'Still here?', paren: 'beat' });
  assert.deepEqual(parseEntry('MARCO: Ciao.', p.characters), { kind: 'line', newName: 'Marco', text: 'Ciao.', paren: '' });
  assert.deepEqual(parseEntry('NICCOLÒ: Sì.', p.characters).newName, 'Niccolò');
  assert.deepEqual(parseEntry('[She keeps wrapping.]'), { kind: 'action', text: 'She keeps wrapping.' });
  assert.deepEqual(parseEntry('(a long pause)'), { kind: 'action', text: 'a long pause' });
  assert.deepEqual(parseEntry('---'), { kind: 'beat' });
  assert.equal(parseEntry('   '), null);
});

test('quick entry: ordinary sentences with a colon stay speech', () => {
  const { p } = cast('Nadia');
  for (const t of ['Note: the lawyer called.', 'Nota: domani alle dieci.', 'OK: fine.', 'It is 10:30 already.', 'See http://example.com']) {
    const e = parseEntry(t, p.characters);
    assert.equal(e.text, t, t);
    assert.ok(!e.id && !e.newName, t);
  }
});

test('names: title case and lookup ignore accents and case', () => {
  assert.equal(titleCase("D'ARCO"), "D'Arco");
  assert.equal(titleCase('MARY-ANN SMITH'), 'Mary-Ann Smith');
  const { p, id } = cast('Niccolò', 'Anna Rossi', 'Anna Bianchi');
  assert.equal(findCharacter(p.characters, 'niccolo')?.id, id('Niccolò'));
  assert.equal(findCharacter(p.characters, 'Anna'), null, 'ambiguous first name');
  assert.equal(findCharacter(p.characters, 'anna rossi')?.id, id('Anna Rossi'));
});

test('pasting a transcript imports every line and creates new characters once', () => {
  const { p, s, id } = cast('Nadia');
  const text = [
    'Nadia: You kept the key.',
    'Teo (smiling): Dad gave it to me.',
    'It was his idea.',
    '',
    '[She takes it back.]',
    '---',
    'NADIA: Then he can ask for it.',
    'Teo: (beat) He can\'t.',
  ].join('\n');
  const r = parseScript(text, p.characters);
  assert.deepEqual(r.newNames, ['Teo']);
  assert.deepEqual(r.entries.map((e) => e.kind), ['line', 'line', 'action', 'beat', 'line', 'line']);
  assert.equal(r.entries[1].text, 'Dad gave it to me. It was his idea.', 'continuation rows join the speech');
  assert.equal(r.entries[1].paren, 'smiling');
  assert.equal(r.entries[5].paren, 'beat');
  const { lines, created } = addEntries(p, s, r.entries);
  assert.equal(created.length, 1);
  assert.equal(p.characters.length, 2);
  assert.equal(lines.length, 5);
  assert.equal(s.beats.length, 2);
  assert.deepEqual(s.participants.map((x) => x.characterId), [id('Nadia'), id('Teo')]);
  assert.equal(s.beats[0].actor, id('Nadia'));
  assert.equal(s.beats[0].reactor, id('Teo'));
});

test('pasting a screenplay round-trips the Fountain export', () => {
  for (const lang of ['en', 'it']) {
    const p = sampleProject(lang);
    const scene = p.scenes[0];
    const r = parseScript(toFountain(scene, p), p.characters);
    assert.ok(r, lang);
    assert.deepEqual(r.newNames, [], lang);
    const want = speechLines(scene).map((l) => [l.speaker, l.text]);
    const got = r.entries.filter((e) => e.kind === 'line').map((e) => [e.id, e.text]);
    assert.deepEqual(got, want, lang);
  }
});

test('plain prose is not mistaken for a script', () => {
  assert.equal(parseScript('She left early.\nThe rain had stopped.\nNobody called.'), null);
  assert.equal(parseScript('Note: buy milk.\nCall Anna.'), null);
});

test('the next voice ping-pongs; Tab cycles the cast', () => {
  const { p, s, id } = cast('A', 'B', 'C');
  const ids = [id('A'), id('B'), id('C')];
  assert.equal(nextSpeaker(ids, s, ids[0]), ids[1], 'nobody spoke yet: next in the cast');
  addEntries(p, s, [{ kind: 'line', id: ids[2], text: 'x' }, { kind: 'line', id: ids[0], text: 'y' }]);
  assert.equal(nextSpeaker(ids, s, ids[0]), ids[2], 'back to whoever spoke before');
  assert.equal(nextSpeaker([ids[0]], s, ids[0]), ids[0], 'a monologue keeps its voice');
  assert.equal(cycleSpeaker(ids, ids[2], 1), ids[0]);
  const [x, y] = s.beats[0].lines;
  assert.equal(voiceAfter(ids, s, y.id), ids[2], 'a line inserted after A answers C, who spoke before');
  assert.equal(voiceAfter(ids, s, x.id), ids[0], 'after the first line: the next in the cast');
  assert.equal(cycleSpeaker(ids, ids[0], -1), ids[2]);
});

test('lines move across beat breaks; breaks split and merge', () => {
  const { p, s, id } = cast('A', 'B');
  addEntries(p, s, ['1', '2', '3'].map((t, i) => ({ kind: 'line', id: i % 2 ? id('B') : id('A'), text: t, tactic: i === 0 ? 'testing' : '' })));
  const [l1, l2, l3] = s.beats[0].lines;
  const b2 = splitBeatAt(s, l2.id);
  assert.equal(s.beats.length, 2);
  assert.deepEqual(b2.lines.map((l) => l.text), ['2', '3']);
  assert.equal(b2.actor, id('B'));
  assert.equal(splitBeatAt(s, l2.id), null, 'already opens a beat');
  assert.ok(moveLine(s, l2.id, -1), 'crosses into the previous beat');
  assert.deepEqual(s.beats.map((b) => b.lines.map((l) => l.text)), [['1', '2'], ['3']]);
  assert.ok(moveLine(s, l1.id, 1));
  assert.deepEqual(s.beats[0].lines.map((l) => l.text), ['2', '1']);
  assert.ok(!moveLine(s, l3.id, 1), 'nothing below the last line');
  insertLineAfter(s, l1.id, newLine({ speaker: id('A'), text: '1b' }));
  assert.deepEqual(s.beats[0].lines.map((l) => l.text), ['2', '1', '1b']);
  removeLine(s, l3.id);
  assert.ok(mergeBeatUp(s, 1));
  assert.equal(s.beats.length, 1);
  assert.deepEqual(beatGist(s.beats[0]), { actor: id('A'), action: 'testing', reactor: id('B'), reaction: '' });
});

test('a new beat from the composer starts only when the last one has lines', () => {
  const { p, s, id } = cast('A');
  addEntries(p, s, [{ kind: 'line', id: id('A'), text: 'one' }]);
  addEntries(p, s, [{ kind: 'line', id: id('A'), text: 'two' }], { newBeat: true });
  addEntries(p, s, [{ kind: 'beat' }, { kind: 'beat' }]);
  assert.deepEqual(s.beats.map((b) => b.lines.length), [1, 1, 0]);
  addEntries(p, s, [{ kind: 'line', text: 'three' }], { speaker: id('A') });
  assert.deepEqual(s.beats.map((b) => b.lines.length), [1, 1, 1]);
});
