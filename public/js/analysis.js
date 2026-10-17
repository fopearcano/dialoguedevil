// Dialogue analysis engine. Pure functions, no DOM: shared by the browser
// and the Node test suite. Heuristics implement the flaws and tendencies
// described in McKee's "Dialogue", Part Two (Ch. 6-9) and Ch. 10, 12, 13.
// The language-specific parts (tokens, lexicons, patterns) come from a
// language pack chosen by the dialogue language (lang/); messages are in
// the interface language (tr).

import { FLAWS, VOICE_DIMENSIONS, MEDIA } from './mckee.js';
import { packFor } from './lang/index.js';
import { tr } from './i18n.js';

// ---------------------------------------------------------------------------
// Tokenizing
// ---------------------------------------------------------------------------

export function words(text, lang) {
  return packFor(lang).words(text);
}

export function contentWords(text, lang) {
  const pack = packFor(lang);
  return pack.words(text).filter((w) => w.length > 2 && !pack.stopwords.has(w) && !/^\d+$/.test(w));
}

export function sentences(text) {
  const t = String(text || '')
    .replace(/\([^)]*\)/g, ' ')
    .replace(/\.{3}|…/g, ' … ')
    .trim();
  if (!t) return [];
  const parts = t.match(/[^.!?]+[.!?]*/g) || [];
  return parts.map((s) => s.replace(/…/g, '').trim()).filter((s) => /[\p{L}\p{N}]/u.test(s));
}

export const syllables = (word, lang) => packFor(lang).syllables(word);
export const isLatinate = (word, lang) => packFor(lang).isLatinate(word);
export const isGerundPhrase = (tactic, lang) => packFor(lang).isGerundPhrase(tactic);

// ---------------------------------------------------------------------------
// Metrics
// ---------------------------------------------------------------------------

const clamp = (v, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, v));
const scale = (v, a, b) => clamp(((v - a) / (b - a)) * 100);
const round = (v, d = 1) => Math.round(v * 10 ** d) / 10 ** d;

export const countPassive = (text, lang) => packFor(lang).countPassive(words(text, lang));

export function lineMetrics(text, lang) {
  const pack = packFor(lang);
  const ws = pack.words(text);
  const sents = sentences(text);
  const syl = ws.map(pack.syllables);
  const raw = String(text || '');
  const capsWords = (raw.match(/\b[A-Z]{3,}\b/g) || []).filter((w) => !pack.capsOk.test(w)).length;
  const modal = { possibility: 0, ability: 0, obligation: 0, volition: 0 };
  for (const w of ws) {
    const k = pack.modalOf(w);
    if (k) modal[k]++;
  }
  return {
    words: ws.length,
    sentences: Math.max(1, sents.length),
    syllables: syl.reduce((a, b) => a + b, 0),
    longWords: syl.filter((s) => s >= 3).length,
    latinate: ws.filter(pack.isLatinate).length,
    questions: sents.filter((s) => /\?\s*$/.test(s)).length,
    exclamations: (raw.match(/!/g) || []).length,
    caps: capsWords,
    beVerbs: ws.filter((w) => pack.BE_VERBS.has(w)).length,
    passive: pack.countPassive(ws),
    modal,
    commas: (raw.match(/[,;:—–]/g) || []).length,
    subordinators: ws.filter((w) => pack.SUBORDINATORS.has(w)).length,
    figurative: (raw.match(new RegExp(pack.FIGURATIVE.source, 'gi')) || []).length,
    profanity: (raw.match(pack.PROFANITY) || []).length,
    intensifiers: ws.filter((w) => pack.INTENSIFIERS.has(w)).length,
    generic: ws.filter((w) => pack.GENERIC_WORDS.has(w)).length,
    pauses: (raw.match(pack.pauses) || []).length,
    longestSentence: sents.reduce((m, s) => Math.max(m, pack.words(s).length), 0),
    types: new Set(ws).size,
    wordList: ws,
  };
}

function sumMetrics(list) {
  const acc = { lines: list.length, words: 0, sentences: 0, syllables: 0, longWords: 0, latinate: 0, questions: 0, exclamations: 0, caps: 0, beVerbs: 0, passive: 0, commas: 0, subordinators: 0, figurative: 0, profanity: 0, intensifiers: 0, generic: 0, pauses: 0, longestSentence: 0, modal: { possibility: 0, ability: 0, obligation: 0, volition: 0 }, allWords: [] };
  for (const m of list) {
    for (const k of ['words', 'sentences', 'syllables', 'longWords', 'latinate', 'questions', 'exclamations', 'caps', 'beVerbs', 'passive', 'commas', 'subordinators', 'figurative', 'profanity', 'intensifiers', 'generic', 'pauses']) acc[k] += m[k];
    for (const k of Object.keys(acc.modal)) acc.modal[k] += m.modal[k];
    acc.longestSentence = Math.max(acc.longestSentence, m.longestSentence);
    acc.allWords.push(...m.wordList);
  }
  return acc;
}

// Measured voice: maps a corpus of lines onto the same 0-100 dimensions as
// the character's intended voice sliders (VOICE_DIMENSIONS). Each language
// pack calibrates the scales (Italian words are longer than English ones).
export function measureVoice(texts, lang) {
  const norms = packFor(lang).norms;
  const list = texts.filter((t) => String(t || '').trim()).map((t) => lineMetrics(t, lang));
  const s = sumMetrics(list);
  if (!s.words) return { metrics: null, scores: null, sample: 0 };
  const wps = s.words / s.sentences;
  const spw = s.syllables / s.words;
  const wpl = s.words / Math.max(1, s.lines);
  const rootTTR = new Set(s.allWords).size / Math.sqrt(s.allWords.length);
  const avgLen = s.allWords.reduce((a, w) => a + w.length, 0) / s.allWords.length;
  const modalTotal = Object.values(s.modal).reduce((a, b) => a + b, 0);
  const dominantModality = modalTotal ? Object.entries(s.modal).sort((a, b) => b[1] - a[1])[0][0] : null;
  const metrics = {
    lines: s.lines,
    words: s.words,
    wordsPerLine: round(wpl),
    wordsPerSentence: round(wps),
    syllablesPerWord: round(spw, 2),
    longestSentence: s.longestSentence,
    latinateRatio: round(s.latinate / s.words, 3),
    questionRatio: round(s.questions / s.sentences, 2),
    exclamationRatio: round(s.exclamations / s.sentences, 2),
    passive: s.passive,
    beVerbRatio: round(s.beVerbs / s.words, 3),
    figurativePerLine: round(s.figurative / s.lines, 2),
    profanityPer100: round((s.profanity / s.words) * 100, 2),
    rootTTR: round(rootTTR, 2),
    avgWordLength: round(avgLen, 2),
    modal: s.modal,
    dominantModality,
    pauses: s.pauses,
  };
  const scores = {
    rational: Math.round(0.5 * scale(wps, 3, 18) + 0.5 * scale(spw, ...norms.spw) - Math.min(25, (s.exclamations / s.sentences) * 40)),
    reflective: Math.round(0.6 * scale(s.beVerbs / s.words, ...norms.beVerb) + 0.4 * scale((s.passive + s.modal.possibility) / s.lines, 0, 0.8)),
    complexity: Math.round(0.6 * scale(wps, 4, 20) + 0.4 * scale((s.commas + s.subordinators) / s.sentences, 0, 2.2)),
    vocabulary: Math.round(0.55 * scale(rootTTR, 2.5, 8) + 0.45 * scale(avgLen, ...norms.avgLen)),
    latinate: Math.round(scale(s.latinate / s.words, 0, norms.latinate)),
    figurative: Math.round(scale(s.figurative / s.lines, 0, 0.5)),
    questions: Math.round(scale(s.questions / s.sentences, 0, 0.6)),
    pace: Math.round(100 - scale(wpl, 4, 28)),
    overstatement: Math.round(scale((s.exclamations + s.caps + s.intensifiers * 0.5) / s.lines, 0, 1.5)),
    profanity: Math.round(scale((s.profanity / s.words) * 100, 0, 3)),
  };
  for (const k of Object.keys(scores)) scores[k] = clamp(scores[k]);
  return { metrics, scores, sample: s.words };
}

// Distance between two voice score vectors (0 = identical, 100 = opposite).
export function voiceDistance(a, b) {
  if (!a || !b) return null;
  const ids = VOICE_DIMENSIONS.map((d) => d.id).filter((id) => a[id] != null && b[id] != null);
  if (!ids.length) return null;
  return Math.sqrt(ids.reduce((acc, id) => acc + (a[id] - b[id]) ** 2, 0) / ids.length);
}

export function jaccard(a, b) {
  const A = new Set(a);
  const B = new Set(b);
  if (!A.size || !B.size) return 0;
  let inter = 0;
  for (const x of A) if (B.has(x)) inter++;
  return inter / (A.size + B.size - inter);
}

// ---------------------------------------------------------------------------
// Line analysis
// ---------------------------------------------------------------------------

function finding(flaw, severity, message, extra = {}) {
  const f = FLAWS[flaw];
  return { flaw, severity, name: f ? f.name : flaw, ch: f ? f.ch : null, message, fix: f ? f.fix : '', ...extra };
}

// “a”, “b”, “c” for quoting matched words in a message.
export const quoteList = (xs, n = 3) => `“${xs.slice(0, n).join('”, “')}”`;

function containsPhrase(lowerText, phrase, letters) {
  const esc = phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/'/g, "['’]");
  return new RegExp(`(^|[^${letters}])${esc}([^${letters}]|$)`, 'i').test(lowerText);
}

const SPEECH_LIMIT = { screen: 50, tv: 60, stage: 90, prose: 80 };

// ctx: { character, medium, genreMode, beat, nextSpeakerDiffers, lang }
export function analyzeLine(line, ctx = {}) {
  const pack = packFor(ctx.lang);
  const text = String(line.text || '').trim();
  const out = [];
  if (!text) return out;
  const lower = text.toLowerCase();
  const has = (phrase) => containsPhrase(lower, String(phrase).toLowerCase(), pack.letters);
  const m = lineMetrics(text, pack.id);
  const voice = (ctx.character && ctx.character.voice) || {};
  const sliders = voice.sliders || {};
  const nonrealism = ctx.genreMode === 'nonrealism';

  // Content: on-the-nose (Ch. 8)
  if (pack.ON_THE_NOSE.some((r) => r.test(text))) {
    out.push(finding('onTheNose', nonrealism ? 'info' : 'serious',
      nonrealism ? tr('States feeling outright. Nonrealism tolerates on-the-nose lines, but check that the moment wants it.') : tr('The line puts the unsaid into the said: the character announces what she feels.')));
  }
  if (line.subtext && contentWords(line.subtext, pack.id).length >= 4) {
    const overlap = jaccard(contentWords(text, pack.id), contentWords(line.subtext, pack.id));
    if (overlap >= 0.5) out.push(finding('onTheNose', 'warning', tr('Text and subtext say the same thing. The subtext has risen into the text.')));
  }

  // Credibility (Ch. 6)
  if (pack.EMPTY_TALK.test(text)) out.push(finding('emptyTalk', 'warning', tr('Telling a listener what both characters already know, for the audience\'s benefit.')));
  if (pack.OVERLY_PERCEPTIVE.test(text)) out.push(finding('overlyPerceptive', 'warning', tr('The character diagnoses herself with implausible insight.')));
  const emotive = m.exclamations >= 2 || m.caps >= 2 || (m.exclamations >= 1 && m.intensifiers >= 2);
  if (emotive) {
    const lowStakes = ctx.beat && Number(ctx.beat.intensity) > 0 && Number(ctx.beat.intensity) <= 4;
    const overstater = (sliders.overstatement ?? 50) >= 70;
    if (lowStakes && !overstater) out.push(finding('melodrama', 'serious', tr('High emotion in a low-intensity beat: expression exceeds motivation.')));
    else if (!overstater) out.push(finding('overlyEmotive', 'info', tr('Heated language. Is the motivation as big as the expression? Would this character state or understate it?')));
  }

  // Language (Ch. 7)
  const cliches = pack.CLICHES.filter(has);
  if (cliches.length) out.push(finding('cliche', 'warning', tr('Cliché: {terms}.', { terms: quoteList(cliches) }), { terms: cliches }));
  const neutral = pack.NEUTRAL_PHRASES.filter(has);
  if (neutral.length) out.push(finding('characterNeutral', 'warning', tr('Ready-made phrase: {terms}. How would only this character say it?', { terms: quoteList(neutral) }), { terms: neutral }));
  if (pack.CLUTTER.some((r) => r.test(text))) out.push(finding('clutter', 'warning', tr('Small talk. Unless it hides a subtext, cut it.')));
  // Polysyllabic only counts when the word itself is Latinate (abstract or
  // bureaucratic in Italian): names and numbers are long too.
  const spw = m.syllables / m.words;
  const latinateHeavy = m.words >= 8 && (m.latinate / m.words >= 0.15 || (spw >= pack.norms.aridSpw && m.latinate >= 1));
  if (latinateHeavy && (sliders.latinate ?? 40) < 65) {
    const vars = { n: m.latinate, spw: round(spw, 2) };
    out.push(finding('arid', 'info', pack.id === 'it'
      ? tr('Dry and abstract (abstract or bureaucratic words: {n}; {spw} syllables per word). Character-specific, or arid?', vars)
      : tr('Dry and Latinate (Latinate words: {n}; {spw} syllables per word). Character-specific, or arid?', vars)));
  }
  if (m.passive > 0) out.push(finding('passive', 'info', tr('Passive construction ({n}). Test the active case.', { n: m.passive })));
  const limit = SPEECH_LIMIT[ctx.medium] || 60;
  if (m.words > 300) out.push(finding('monologue', 'serious', tr('{n} words: over two minutes of talk without a reaction.', { n: m.words })));
  else if (m.words > limit) {
    const medium = MEDIA.find((x) => x.id === ctx.medium)?.name.toLowerCase() || tr('this medium');
    out.push(finding('longSpeech', 'info', tr('{n} words. Long for {medium} (guide: ~{limit}). Break it into beats or compress it.', { n: m.words, medium, limit })));
  }
  if (m.generic >= 3) out.push(finding('blurred', 'info', tr('Several generic words (thing, stuff, very, big…). Name specific nouns and verbs.')));

  // Design (Ch. 9): end on the core word
  if (m.words >= 6 && ctx.nextSpeakerDiffers !== false) {
    const last = sentences(text).slice(-1)[0] || '';
    const isQuestion = /\?\s*$/.test(last);
    if (pack.TRAILING_FILLER.test(text)) out.push(finding('mistimedCue', 'info', tr('The speech trails off on filler after its core word. End on the cue.')));
    else if (!isQuestion && pack.TRAILING_PREP?.test(text)) out.push(finding('mistimedCue', 'info', tr('Ends on a preposition. Move the core word to the end of the speech.')));
  }

  // Character voice
  const never = (voice.neverSays || []).filter((w) => w && has(w));
  if (never.length) out.push(finding('characterNeutral', 'serious', tr('Out of character: {name} would never say {terms}.', { name: ctx.character.name || tr('this character'), terms: quoteList(never, never.length) }), { terms: never }));
  const own = [...(voice.signature || []), ...(voice.knowledge || []), ...(voice.culture || [])].filter((w) => w && String(w).length > 2 && has(w));
  if (own.length) out.push({ flaw: 'characterSpecific', severity: 'good', name: tr('Character-specific'), ch: 10, message: tr('Draws on this character\'s own vocabulary: {terms}.', { terms: quoteList(own) }), fix: '' });
  if (m.figurative > 0 && (sliders.figurative ?? 50) >= 35) out.push({ flaw: 'trope', severity: 'good', name: tr('Figurative'), ch: 5, message: tr('Uses an image or comparison. The more sensory, the deeper.'), fix: '' });

  // Action beneath the line (Ch. 2, 3, 12)
  if (!String(line.tactic || '').trim() && !String(line.subtext || '').trim()) {
    out.push(finding('noSubtext', 'info', tr('No action named yet. What is the character doing with these words?')));
  } else if (line.tactic && !pack.isGerundPhrase(line.tactic)) {
    out.push(finding('noSubtext', 'info', tr('Label the action as a gerund (“{tactic}” → “{ending}”).', { tactic: line.tactic, ending: pack.gerundEnding })));
  }
  return out;
}

// ---------------------------------------------------------------------------
// Scene analysis
// ---------------------------------------------------------------------------

// Lines of kind 'action' are stage directions / description (paralanguage,
// physical action, silence); speechOnly skips them.
export function flattenLines(scene, { speechOnly = false } = {}) {
  const out = [];
  (scene.beats || []).forEach((beat, bi) => {
    (beat.lines || []).forEach((line, li) => {
      if (speechOnly && line.kind === 'action') return;
      out.push({ line, beat, beatIndex: bi, lineIndex: li });
    });
  });
  return out;
}

export function valueArc(scene) {
  const values = scene.values || [];
  return values.map((v) => {
    const points = [{ label: 'Open', charge: Number(v.opening ?? 0) }];
    (scene.beats || []).forEach((b, i) => {
      const c = b.charges && b.charges[v.id] != null ? Number(b.charges[v.id]) : null;
      points.push({ label: `B${i + 1}`, charge: c == null ? points[points.length - 1].charge : c, set: c != null });
    });
    return { value: v, points };
  });
}

// Index of the beat where the primary value makes its decisive turn.
export function findTurningPoint(scene) {
  const arcs = valueArc(scene);
  if (!arcs.length) return null;
  const pts = arcs[0].points;
  const open = pts[0].charge;
  const close = pts[pts.length - 1].charge;
  if (pts.length < 2) return null;
  const sign = (x) => (x > 0 ? 1 : x < 0 ? -1 : 0);
  let best = -1;
  let bestJump = 0;
  for (let i = 1; i < pts.length; i++) {
    const jump = Math.abs(pts[i].charge - pts[i - 1].charge);
    const crosses = sign(pts[i].charge) !== sign(pts[i - 1].charge) && sign(pts[i].charge) === sign(close);
    const score = jump + (crosses ? 3 : 0);
    if (score > bestJump) { bestJump = score; best = i - 1; }
  }
  return { beatIndex: best, open, close, change: close - open, reversed: sign(open) !== sign(close) && sign(close) !== 0 };
}

export function analyzeScene(scene, project = {}) {
  const lang = project.lang;
  const pack = packFor(lang);
  const chars = Object.fromEntries((project.characters || []).map((c) => [c.id, c]));
  const nameOf = (id, fallback) => chars[id]?.name || fallback;
  const flat = flattenLines(scene, { speechOnly: true });
  const medium = scene.medium || project.medium || 'screen';
  const lineFindings = {};
  const sceneFindings = [];
  let flagged = 0;
  const counts = {};

  flat.forEach((entry, i) => {
    const next = flat[i + 1];
    const res = analyzeLine(entry.line, {
      character: chars[entry.line.speaker],
      medium,
      genreMode: project.genreMode,
      beat: entry.beat,
      nextSpeakerDiffers: next ? next.line.speaker !== entry.line.speaker : true,
      lang,
    });
    // Accidental echoes (Ch. 9)
    if (next && entry.line.text && next.line.text) {
      const names = new Set((project.characters || []).flatMap((c) => words(c.name, lang)));
      const a = new Set(contentWords(entry.line.text, lang).filter((w) => w.length > 3 && !names.has(w)));
      const shared = [...new Set(contentWords(next.line.text, lang))].filter((w) => a.has(w) && w.length > 3 && !names.has(w));
      if (shared.length >= 2) {
        res.push(finding('echo', 'info', tr('Echoes the previous line: {terms}. Deliberate, or accidental?', { terms: quoteList(shared, 4) }), { terms: shared }));
      }
    }
    // Findings the writer dismissed as deliberate stay visible on request
    // but no longer count against the scene.
    const dismissed = entry.line.dismissed || [];
    for (const f of res) if (dismissed.includes(f.flaw)) f.dismissed = true;
    lineFindings[entry.line.id] = res;
    for (const f of res) if (f.severity !== 'good' && !f.dismissed) counts[f.flaw] = (counts[f.flaw] || 0) + 1;
    if (res.some((f) => !f.dismissed && (f.severity === 'serious' || f.severity === 'warning'))) flagged++;
  });

  const beats = scene.beats || [];
  // Repetitious beats (Ch. 9, 12)
  for (let i = 1; i < beats.length; i++) {
    const a = beats[i - 1];
    const b = beats[i];
    if (a.action && b.action && pack.tacticKey(a.action) === pack.tacticKey(b.action) && pack.tacticKey(a.reaction) === pack.tacticKey(b.reaction)) {
      sceneFindings.push(finding('repetitiousBeats', 'warning', tr('Beats {a} and {b} repeat the same action/reaction ({action}/{reaction}). Change the tactic.', { a: i, b: i + 1, action: a.action, reaction: a.reaction })));
    }
  }
  const tacticRuns = {};
  flat.forEach(({ line }) => {
    const sp = line.speaker;
    const t = pack.tacticKey(line.tactic);
    if (!t) { tacticRuns[sp] = null; return; }
    const run = tacticRuns[sp];
    if (run && run.t === t) {
      run.n++;
      if (run.n === 3) sceneFindings.push(finding('repetitiousBeats', 'warning', tr('{name} uses “{tactic}” three times running. Repetition trivializes meaning.', { name: nameOf(sp, tr('A character')), tactic: line.tactic })));
    } else tacticRuns[sp] = { t, n: 1 };
  });

  // Value progression and turning point (Ch. 9, 12)
  const arcs = valueArc(scene);
  const tp = findTurningPoint(scene);
  const primary = arcs[0];
  if (primary && beats.length) {
    // Values reverse, intensify or wane (Ch. 12); a beat that changes no
    // value at stake leaves the charge flat.
    const moved = (i) => arcs.some(({ points }) => points[i].charge !== points[i - 1].charge);
    let flatRun = 1;
    let reported = false;
    for (let i = 2; i < primary.points.length; i++) {
      flatRun = moved(i) ? 1 : flatRun + 1;
      if (flatRun >= 3 && !reported) {
        sceneFindings.push(finding('repetitiousBeats', 'warning', i - 2 === 0
          ? tr('No value at stake changes across the opening and beats 1–{b}. Same charge, beat after beat, feels dead.', { b: i })
          : tr('No value at stake changes across beats {a}–{b}. Same charge, beat after beat, feels dead.', { a: i - 2, b: i })));
        reported = true;
      }
    }
    if (tp && Math.abs(tp.change) < 2 && !tp.reversed) {
      sceneFindings.push(finding('misshapenScene', 'serious', tr('The {value} charge ends where it began ({open} → {close}). If nothing changes, nothing happens.', { value: `${primary.value.positive || tr('value')}/${primary.value.negative || ''}`, open: tp.open, close: tp.close })));
    } else if (tp && beats.length >= 4 && tp.beatIndex === 0) {
      sceneFindings.push(finding('misshapenScene', 'warning', tr('The turn comes in the first beat; everything after runs downhill. Turning point too soon?')));
    } else if (tp && tp.beatIndex >= 0) {
      const vars = { n: tp.beatIndex + 1, open: tp.open, close: tp.close };
      sceneFindings.push({ flaw: 'turningPoint', severity: 'good', name: tr('Turning point'), ch: 12, message: tp.reversed ? tr('Turns in beat {n}: {open} → {close} (reversal).', vars) : tr('Turns in beat {n}: {open} → {close}.', vars), fix: '' });
    }
  } else if (!primary) {
    sceneFindings.push(finding('misshapenScene', 'info', tr('No value at stake yet. Name the value whose charge this scene changes.')));
  }

  const intens = beats.map((b) => Number(b.intensity) || 0).filter((x) => x > 0);
  let drops = 0;
  for (let i = 1; i < intens.length; i++) if (intens[i] < intens[i - 1]) drops++;
  if (intens.length >= 4 && drops > intens.length / 3) {
    sceneFindings.push(finding('repetitiousBeats', 'warning', tr('Intensity drops in {drops} of {n} transitions. Progression means each beat tops the last (a planned retreat is fine).', { drops, n: intens.length - 1 })));
  }

  // Duelogue vs trialogue (Ch. 8)
  const speakers = [...new Set(flat.map((e) => e.line.speaker).filter(Boolean))];
  if (speakers.length === 2 && !String(scene.thirdThing || '').trim() && (counts.onTheNose || 0) >= 2) {
    sceneFindings.push(finding('duelogue', 'serious', tr('Two characters, face to face, saying exactly what they feel. Find a third thing to route the conflict through.')));
  }
  // Monologue (Ch. 8): long unreacted runs
  let run = 0;
  let runWords = 0;
  for (let i = 0; i < flat.length; i++) {
    const n = words(flat[i].line.text, lang).length;
    if (i > 0 && flat[i].line.speaker === flat[i - 1].line.speaker) { run++; runWords += n; } else { run = 1; runWords = n; }
    if (runWords > 300 && run > 1) { sceneFindings.push(finding('monologue', 'warning', tr('{name} talks for {n} words without a reaction. Interlace reactions.', { name: nameOf(flat[i].line.speaker, tr('A speaker')), n: runWords }))); break; }
  }
  // Splintered: profanity padding a nonevent (Ch. 9)
  const prof = flat.reduce((a, e) => a + lineMetrics(e.line.text, lang).profanity, 0);
  if (prof >= 4 && tp && Math.abs(tp.change) < 2) sceneFindings.push(finding('splintered', 'warning', tr('Profanity rising in a scene whose value doesn\'t change. Expletives don\'t raise the temperature of a nonevent.')));

  // Speaker voice measurement and distinctiveness (Ch. 10, 13)
  const speakerStats = {};
  for (const sp of speakers) {
    const texts = flat.filter((e) => e.line.speaker === sp).map((e) => e.line.text);
    speakerStats[sp] = measureVoice(texts, lang);
  }
  const pairs = [];
  for (let i = 0; i < speakers.length; i++) {
    for (let j = i + 1; j < speakers.length; j++) {
      const A = speakerStats[speakers[i]];
      const B = speakerStats[speakers[j]];
      if (!A.scores || !B.scores || A.sample < 25 || B.sample < 25) continue;
      const dist = voiceDistance(A.scores, B.scores);
      const lexA = flat.filter((e) => e.line.speaker === speakers[i]).flatMap((e) => contentWords(e.line.text, lang));
      const lexB = flat.filter((e) => e.line.speaker === speakers[j]).flatMap((e) => contentWords(e.line.text, lang));
      const overlap = jaccard(lexA, lexB);
      pairs.push({ a: speakers[i], b: speakers[j], distance: round(dist), overlap: round(overlap, 2) });
      if (dist < 12 && overlap > 0.25) sceneFindings.push(finding('sameVoice', 'warning', tr('{a} and {b} sound alike (voice distance {d}). Give each a voice from their own knowledge, personality and culture.', { a: nameOf(speakers[i], 'A'), b: nameOf(speakers[j], 'B'), d: round(dist) })));
    }
  }
  // Voice drift: measured vs intended sliders
  for (const sp of speakers) {
    const c = chars[sp];
    const st = speakerStats[sp];
    if (!c || !st.scores || st.sample < 40) continue;
    const sliders = (c.voice && c.voice.sliders) || {};
    const drift = VOICE_DIMENSIONS.filter((d) => sliders[d.id] != null && Math.abs(sliders[d.id] - st.scores[d.id]) >= 40);
    if (drift.length) {
      const list = drift.map((d) => tr('{label} (intended {i}, measured {m})', { label: d.label, i: sliders[d.id], m: st.scores[d.id] })).join('; ');
      sceneFindings.push({ flaw: 'voiceDrift', severity: 'info', name: tr('Voice drift'), ch: 10, message: tr('{name}\'s lines drift from the intended voice on: {list}.', { name: c.name, list }), fix: tr('Either revise the lines or update the voice profile. The character may have grown.') });
    }
  }

  // Six dialogue tasks scorecard (Part Two intro)
  const n = flat.length || 1;
  const withAction = flat.filter((e) => String(e.line.tactic || '').trim() || String(e.line.subtext || '').trim()).length;
  const credibilityHits = ['emptyTalk', 'overlyEmotive', 'overlyKnowing', 'overlyPerceptive', 'melodrama', 'onTheNose', 'cliche', 'characterNeutral', 'clutter', 'ostentatious'].reduce((a, k) => a + (counts[k] || 0), 0);
  const cueIssues = counts.mistimedCue || 0;
  const plannedFacts = (scene.exposition || []).filter((f) => String(f.text || '').trim());
  const delivered = plannedFacts.filter((f) => f.delivered).length;
  const meanDistance = pairs.length ? pairs.reduce((a, p) => a + p.distance, 0) / pairs.length : null;
  const progressScore = (() => {
    if (!beats.length) return 0;
    let s = 0;
    if (tp && Math.abs(tp.change) >= 2) s += 50;
    if (tp && tp.reversed) s += 15;
    if (intens.length >= 2) s += 35 * (1 - drops / Math.max(1, intens.length - 1));
    else s += 15;
    s -= sceneFindings.filter((f) => f.flaw === 'repetitiousBeats').length * 12;
    return clamp(Math.round(s));
  })();
  const tasks = {
    action: Math.round((withAction / n) * 100),
    progression: progressScore,
    exposition: plannedFacts.length ? Math.round((delivered / plannedFacts.length) * 100 - (counts.emptyTalk || 0) * 15) : null,
    style: meanDistance == null ? null : clamp(Math.round(scale(meanDistance, 5, 25) - (sceneFindings.some((f) => f.flaw === 'sameVoice') ? 20 : 0))),
    drive: clamp(Math.round((tp && Math.abs(tp.change) >= 2 ? 55 : 10) + 30 * (1 - cueIssues / n) + 15 * (1 - (counts.clutter || 0) / n))),
    credibility: clamp(Math.round(100 - (credibilityHits / n) * 60)),
  };
  for (const k of Object.keys(tasks)) if (tasks[k] != null) tasks[k] = clamp(tasks[k]);

  return {
    lines: lineFindings,
    scene: sceneFindings,
    counts,
    flaggedLines: flagged,
    totalLines: flat.length,
    tasks,
    speakers: speakerStats,
    pairs,
    turningPoint: tp,
    arcs,
  };
}

// Character depth: how much of the profile is filled in, per section.
export function profileCompleteness(character, sections) {
  const get = (obj, path) => path.split('.').reduce((o, k) => (o == null ? undefined : o[k]), obj);
  const result = {};
  let filled = 0;
  let total = 0;
  for (const s of sections) {
    const fields = s.fields || [];
    if (!fields.length) continue;
    let f = 0;
    for (const fd of fields) {
      if (fd.when && !fd.when(character)) continue;
      const v = get(character, fd.path);
      const ok = Array.isArray(v) ? v.length > 0 : v != null && String(v).trim() !== '';
      if (ok) f++;
    }
    const counted = fields.filter((fd) => !fd.when || fd.when(character)).length;
    result[s.id] = counted ? Math.round((f / counted) * 100) : 100;
    filled += f;
    total += counted;
  }
  const extra = (character.secrets || []).filter((x) => x.text).length ? 1 : 0;
  result.overall = Math.round(((filled + extra) / (total + 1)) * 100);
  return result;
}
