// The second reader: an independent, recall-oriented pass over the same
// lines. Where the rules (analysis.js) look for exact patterns, this reader
// stems words, matches stock phrases fuzzily, uses emotion / exposition /
// abstraction lexicons and synonym clusters. Its findings are "possible"
// until another layer (rules, AI review or the writer) agrees. Lexicons and
// patterns come from the dialogue language's pack (lang/).

import { words, contentWords, sentences, flattenLines, quoteList } from './analysis.js';
import { packFor } from './lang/index.js';
import { FLAWS } from './mckee.js';
import { tr } from './i18n.js';

// ---------------------------------------------------------------------------
// Light stemming and fuzzy phrase matching
// ---------------------------------------------------------------------------

export const stem = (word, lang) => packFor(lang).stem(word);

const stems = (text, lang) => {
  const pack = packFor(lang);
  return pack.words(text).map(pack.stem);
};

// "make" ~ "mak" (making), "bark" = "bark": equal, or one a one-letter
// extension of the other.
function tokEq(a, b) {
  if (a === b) return true;
  if (a.length < 3 || b.length < 3) return false;
  return Math.abs(a.length - b.length) === 1 && (a.startsWith(b) || b.startsWith(a));
}

// In-order match of a phrase inside a line, allowing inserted words (gaps)
// and dropping filler words from the phrase ("back to square one" matches
// "back at square one"; "are you kidding me" matches "are you freaking
// kidding me").
export function fuzzyContains(lineToks, phrase, lang) {
  const OPTIONAL = packFor(lang).OPTIONAL;
  const ptoks = stems(phrase, lang);
  const core = ptoks.filter((t) => !OPTIONAL.has(t));
  if (core.length < 2) return false;
  // Short phrases must stay contiguous; longer ones tolerate padding.
  const maxGap = core.length >= 3 ? 2 : 0;
  for (let start = 0; start < lineToks.length; start++) {
    if (!tokEq(lineToks[start], ptoks[0]) && !(OPTIONAL.has(ptoks[0]) && ptoks.length > 1 && tokEq(lineToks[start], ptoks[1]))) continue;
    let i = start;
    let gaps = 0;
    let coreHits = 0;
    let ok = true;
    for (const p of ptoks) {
      // Filler words in the line ("really", "proprio") are skipped for free.
      let found = -1;
      let cost = 0;
      for (let g = 0; i + g < lineToks.length; g++) {
        if (tokEq(lineToks[i + g], p)) { found = g; break; }
        if (!OPTIONAL.has(lineToks[i + g])) cost++;
        if (gaps + cost > maxGap) break;
      }
      if (found < 0) {
        if (OPTIONAL.has(p)) continue;
        ok = false;
        break;
      }
      gaps += cost;
      i += found + 1;
      if (!OPTIONAL.has(p)) coreHits++;
    }
    if (ok && coreHits === core.length) return true;
  }
  return false;
}

// The action each synonym cluster stands for, in messages.
const CLUSTER_LABEL = {
  heard: () => tr('asking to be heard'),
  dismissing: () => tr('dismissing'),
  apologizing: () => tr('apologizing'),
  pleading: () => tr('pleading'),
  money: () => tr('asking about money'),
  truth: () => tr('demanding the truth'),
};

function clusterHits(text, lang) {
  const pack = packFor(lang);
  const toks = stems(text, lang);
  const padded = ` ${toks.join(' ')} `;
  const hits = [];
  for (const [name, list] of Object.entries(pack.CLUSTERS)) {
    const term = list.find((ph) => (pack.words(ph).length === 1
      ? toks.some((t) => tokEq(t, pack.stem(ph)))
      : fuzzyContains(toks, ph, lang) || padded.includes(` ${stems(ph, lang).join(' ')} `)));
    if (term) hits.push({ name, term });
  }
  return hits;
}

// ---------------------------------------------------------------------------
// Line pass
// ---------------------------------------------------------------------------

function finding(flaw, severity, message) {
  const f = FLAWS[flaw];
  return { flaw, severity, name: f ? f.name : flaw, ch: f ? f.ch : null, message, fix: f ? f.fix : '', source: 'reader' };
}

// ctx: { character, beat, speakerMedian, lang }
export function secondReadLine(line, ctx = {}) {
  const text = String(line.text || '').trim();
  if (!text || line.kind === 'action') return [];
  const lang = ctx.lang;
  const pack = packFor(lang);
  const out = [];
  const toks = stems(text, lang);
  const lower = text.toLowerCase();
  const sliders = ctx.character?.voice?.sliders || {};
  const add = (flaw, severity, msg) => { if (!out.some((f) => f.flaw === flaw)) out.push(finding(flaw, severity, msg)); };

  // On-the-nose: first person + a named emotion in the same sentence.
  for (const s of sentences(text)) {
    const ws = pack.words(s);
    const st = ws.map(pack.stem);
    const emotion = st.find((t) => pack.EMOTIONS.has(t));
    if (emotion && ws.some((w) => pack.FIRST_PERSON.has(w)) && st.some((t) => pack.FEELING_VERBS.has(t) || pack.EMOTIONS.has(t))) {
      add('onTheNose', 'warning', tr('Names a feeling outright (“{word}”). Would she say it, or show it?', { word: ws[st.indexOf(emotion)] }));
      break;
    }
  }
  for (const [flaw, list] of Object.entries(pack.PATTERNS)) {
    for (const p of list) {
      if (p.re.test(text) && (!p.need || p.need.test(text))) { add(flaw, flaw === 'onTheNose' ? 'warning' : 'info', tr(p.msg)); break; }
    }
  }

  // Stock phrases, matched fuzzily (inflections, padding, punctuation).
  const cliche = pack.CLICHES.find((c) => fuzzyContains(toks, c, lang));
  if (cliche) add('cliche', 'warning', tr('Close to the cliché “{phrase}”.', { phrase: cliche }));
  const plain = lower.replace(/’/g, "'").replace(new RegExp(`[^${pack.letters}' ]+`, 'g'), ' ').replace(/\s+/g, ' ');
  const neutral = pack.NEUTRAL_PHRASES.find((c) => fuzzyContains(toks, c, lang) || (pack.words(c).length >= 3 && plain.includes(c)));
  if (neutral) add('characterNeutral', 'warning', tr('A variant of the ready-made “{phrase}”. How would only this character say it?', { phrase: neutral }));

  // Abstraction and Latinate density, at lower thresholds than the rules.
  const cws = contentWords(text, lang);
  const abstract = cws.filter((w) => pack.ABSTRACT.has(pack.stem(w)));
  if (cws.length >= 3 && abstract.length >= 2 && abstract.length / cws.length >= 0.25) add('blurred', 'info', tr('Abstract, generic words ({list}). Name the concrete thing.', { list: abstract.slice(0, 3).join(', ') }));
  const all = pack.words(text);
  const latin = all.filter(pack.isLatinate);
  if ((sliders.latinate ?? 40) < 65 && all.length >= 4 && latin.length >= 2 && latin.length / all.length >= 0.25) {
    add('arid', 'info', pack.id === 'it'
      ? tr('Cluster of abstract or bureaucratic words ({list}).', { list: latin.slice(0, 3).join(', ') })
      : tr('Latinate cluster ({list}).', { list: latin.slice(0, 3).join(', ') }));
  }

  // Emotional overstatement against the beat's stakes.
  const sup = toks.filter((t) => pack.SUPERLATIVE.has(t) || pack.EMOTIONS.has(t)).length;
  const intensity = Number(ctx.beat?.intensity) || 0;
  if (sup >= 3 && intensity > 0 && intensity <= 3 && (sliders.overstatement ?? 50) < 70) add('melodrama', 'warning', tr('Superlatives and emotion words in a low-stakes beat.'));

  // Subtext leaking into text (stem-level, more sensitive than the rules).
  if (line.subtext) {
    const sub = new Set(contentWords(line.subtext, lang).map(pack.stem));
    const txt = new Set(cws.map(pack.stem));
    if (sub.size >= 3) {
      let shared = 0;
      for (const t of sub) if ([...txt].some((x) => tokEq(x, t))) shared++;
      if (shared / sub.size >= 0.5) add('onTheNose', 'warning', tr('Most of the subtext is already in the words.'));
    }
  }

  // Long for this speaker.
  const n = all.length;
  if (ctx.speakerMedian && n > Math.max(30, ctx.speakerMedian * 2.5)) add('longSpeech', 'info', tr('Much longer than this character usually speaks ({n} words vs. a typical {m}).', { n, m: Math.round(ctx.speakerMedian) }));
  return out;
}

// ---------------------------------------------------------------------------
// Scene pass
// ---------------------------------------------------------------------------

const median = (xs) => {
  if (!xs.length) return 0;
  const s = [...xs].sort((a, b) => a - b);
  return s[Math.floor(s.length / 2)];
};

export function secondReadScene(scene, project = {}) {
  const lang = project.lang;
  const pack = packFor(lang);
  const chars = Object.fromEntries((project.characters || []).map((c) => [c.id, c]));
  const flat = flattenLines(scene, { speechOnly: true });
  const lengths = {};
  for (const { line } of flat) (lengths[line.speaker] ||= []).push(words(line.text, lang).length);
  const lines = {};
  const sceneFindings = [];
  for (const { line, beat } of flat) {
    lines[line.id] = secondReadLine(line, { character: chars[line.speaker], beat, speakerMedian: median(lengths[line.speaker] || []), lang });
  }

  // Same request in different words: three consecutive lines from one
  // speaker in the same synonym cluster, without three distinct tactics.
  const bySpeaker = {};
  for (const { line } of flat) (bySpeaker[line.speaker] ||= []).push(line);
  for (const [sp, ls] of Object.entries(bySpeaker)) {
    for (let i = 2; i < ls.length; i++) {
      const trio = [ls[i - 2], ls[i - 1], ls[i]];
      const hitSets = trio.map((l) => clusterHits(l.text, lang));
      const common = hitSets[0].filter((h) => hitSets[1].some((x) => x.name === h.name) && hitSets[2].some((x) => x.name === h.name));
      const tactics = new Set(trio.map((l) => pack.tacticKey(l.tactic)).filter(Boolean));
      if (common.length && tactics.size < 3) {
        const terms = quoteList(hitSets.map((hs) => hs.find((h) => h.name === common[0].name)?.term).filter(Boolean));
        const who = chars[sp]?.name || tr('A character');
        const action = CLUSTER_LABEL[common[0].name]?.() || common[0].name;
        sceneFindings.push(finding('repetitiousBeats', 'warning', tr('{name} repeats the same action ({action}: {terms}) three times in different words.', { name: who, action, terms })));
        (lines[ls[i].id] ||= []).push(finding('repetitiousBeats', 'warning', tr('Third time {name} is {action} ({terms}). Change the tactic.', { name: who, action, terms })));
        break;
      }
    }
  }

  // A beat needs both sides: action and reaction (Ch. 9, 12).
  (scene.beats || []).forEach((b, i) => {
    const speech = (b.lines || []).filter((l) => l.kind !== 'action' && String(l.text || '').trim());
    const hasAction = (b.lines || []).some((l) => l.kind === 'action');
    const speakers = new Set(speech.map((l) => l.speaker));
    if (speech.length >= 2 && speakers.size === 1 && !hasAction && !String(b.reaction || '').trim()) {
      sceneFindings.push(finding('noReaction', 'info', tr('Beat {n}: only one character acts, and nothing reacts.', { n: i + 1 })));
    }
  });
  return { lines, scene: sceneFindings };
}
