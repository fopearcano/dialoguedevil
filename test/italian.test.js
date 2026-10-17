// The Italian dialogue rules: the same checks as the English ones, tuned to
// Italian speech, measured on the labeled Italian corpus.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { analyzeLine, words, countPassive, isLatinate, measureVoice } from '../public/js/analysis.js';
import { secondReadLine, fuzzyContains, stem } from '../public/js/secondreader.js';
import { doubleCheckScene } from '../public/js/doublecheck.js';
import { toFountain, toProse, toAnnotated } from '../public/js/export.js';
import { sampleProject } from '../public/js/sample.js';
import { FLAWED_LINES, HELD_OUT_FLAWED, HELD_OUT_2, CLEAN_LINES, REPETITIOUS_EXCHANGE } from './fixtures/flawed-lines.it.js';

const it = { lang: 'it' };
const flaws = (text, ctx = {}, line = {}) => analyzeLine({ text, tactic: 'temporeggiando', ...line }, { ...it, ...ctx }).map((f) => f.flaw);

function recall(set) {
  let rules = 0;
  let merged = 0;
  for (const c of set) {
    const line = { text: c.text, tactic: 'mettendo alla prova' };
    const ctx = { ...it, beat: c.intensity ? { intensity: c.intensity } : undefined };
    const r = analyzeLine(line, ctx).map((f) => f.flaw);
    const s = secondReadLine(line, ctx).map((f) => f.flaw);
    if (c.expect.some((e) => r.includes(e))) rules++;
    if (c.expect.some((e) => r.includes(e) || s.includes(e))) merged++;
  }
  return { rules: rules / set.length, merged: merged / set.length };
}

test('Italian words: elisions split, accents kept', () => {
  assert.deepEqual(words("L'ho detto all'avvocato, dell'eredità.", 'it'), ["l'", 'ho', 'detto', "all'", 'avvocato', "dell'", 'eredità']);
});

test('Italian passive and bureaucratic vocabulary', () => {
  assert.equal(countPassive('La casa è stata venduta dal notaio.', 'it'), 1);
  assert.equal(countPassive('Il contratto viene firmato domani.', 'it'), 1);
  assert.equal(countPassive('Sono arrivata tardi.', 'it'), 0);
  assert.equal(countPassive('Sono stanca.', 'it'), 0);
  assert.ok(isLatinate('regolamentazione', 'it'));
  assert.ok(!isLatinate('orologio', 'it'));
  assert.ok(flaws('La problematica della riorganizzazione amministrativa necessita di una valutazione complessiva e preliminare.').includes('arid'));
  assert.ok(!flaws('Le chiavi sono sul gancio, il solito gancio vicino alla porta.').includes('arid'));
});

test('Italian stems strip clitics and verb endings', () => {
  assert.equal(stem('spiegarti', 'it'), 'spieg');
  assert.equal(stem('spiegando', 'it'), 'spieg');
  assert.equal(stem('spiegato', 'it'), 'spieg');
  const t = (s) => words(s, 'it').map((w) => stem(w, 'it'));
  assert.ok(fuzzyContains(t('Siamo tornati al punto di partenza.'), 'al punto di partenza', 'it'));
  assert.ok(!fuzzyContains(t('Parto domani, al punto più lontano.'), 'al punto di partenza', 'it'));
});

test('Italian tactics are gerunds', () => {
  assert.ok(!flaws('Passami il sale.').includes('noSubtext'));
  assert.ok(flaws('Passami il sale.', {}, { tactic: '' }).includes('noSubtext'));
  assert.ok(flaws('Passami il sale.', {}, { tactic: 'temporeggiare' }).includes('noSubtext'));
  assert.ok(!flaws('Passami il sale.', {}, { tactic: 'mettendola alla prova' }).includes('noSubtext'));
});

test('Italian rules: on-the-nose, empty talk, clichés, melodrama', () => {
  assert.ok(flaws('Ti amo, ti amo.').includes('onTheNose'));
  assert.ok(flaws('Come sai, siamo sposati da vent\'anni.').includes('emptyTalk'));
  assert.ok(flaws('Bene, siamo di nuovo al punto di partenza.').includes('cliche'));
  assert.ok(flaws('Hai ROVINATO TUTTO! Tutto!', { beat: { intensity: 2 } }).includes('melodrama'));
  assert.ok(!flaws('Crocifiggilo.').includes('onTheNose'));
});

test('the Italian double-check catches the labeled flaws', () => {
  const tuning = recall(FLAWED_LINES);
  assert.ok(tuning.merged >= 0.95, `tuning recall ${tuning.merged}`);
  // Already used to fix gaps after its one blind measurement (38% -> 75%).
  assert.ok(recall(HELD_OUT_FLAWED).merged >= 0.95);
  // Written after the tuning and never tuned on: the honest number.
  const held = recall(HELD_OUT_2);
  assert.ok(held.merged >= 0.75, `held-out recall ${held.merged}`);
  assert.ok(held.merged - held.rules >= 0.15, `held-out gain ${held.rules} -> ${held.merged}`);
});

test('few false alarms on clean Italian dialogue and on the Italian sample', () => {
  const alarms = CLEAN_LINES.filter((t) => [...analyzeLine({ text: t, tactic: 'mettendo alla prova' }, it), ...secondReadLine({ text: t, tactic: 'mettendo alla prova' }, it)].some((f) => f.severity !== 'good'));
  assert.ok(alarms.length <= 1, `false alarms: ${alarms.join(' | ')}`);
  const p = sampleProject('it');
  assert.equal(p.lang, 'it');
  const dc = doubleCheckScene(p.scenes[0], p);
  assert.ok(dc.stats.flagged + dc.stats.possible + dc.stats.confirmed <= 2, JSON.stringify(dc.stats));
  assert.equal(dc.turningPoint?.beatIndex, 7);
});

test('the same request in different Italian words is caught (Cap. 9)', () => {
  const scene = { values: [], beats: [{ id: 'b', lines: REPETITIOUS_EXCHANGE.map(([speaker, text], i) => ({ id: `l${i}`, speaker, text })) }] };
  const dc = doubleCheckScene(scene, { lang: 'it', characters: [] });
  assert.ok(dc.scene.some((f) => f.flaw === 'repetitiousBeats'));
});

test('voice measures use Italian norms', () => {
  const p = sampleProject('it');
  const texts = p.scenes[0].beats.flatMap((b) => b.lines).filter((l) => l.speaker === 'char_nadia').map((l) => l.text);
  const v = measureVoice(texts, 'it');
  assert.ok(v.scores.pace > 60, JSON.stringify(v.scores));
  assert.ok(v.scores.latinate < 30, JSON.stringify(v.scores));
});

test('Italian scenes export in Italian', () => {
  const p = sampleProject('it');
  const s = p.scenes[0];
  assert.match(toFountain(s, p), /\nTEO\n/);
  assert.match(toProse(s, p), /«[^»]+» (disse|chiese) (Nadia|Teo)/);
  const notes = toAnnotated(s, p);
  assert.match(notes, /## Beat 1/);
  assert.match(notes, /AZIONE: /);
  assert.match(notes, /Valori in gioco/);
});
