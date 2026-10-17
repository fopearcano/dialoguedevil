// The second reader: an independent, recall-oriented pass over the same
// lines. Where the rules (analysis.js) look for exact patterns, this reader
// stems words, matches stock phrases fuzzily, uses emotion / exposition /
// abstraction lexicons and synonym clusters. Its findings are "possible"
// until another layer (rules, AI review or the writer) agrees.

import { words, contentWords, sentences, lineMetrics, isLatinate, CLICHES, NEUTRAL_PHRASES, flattenLines } from './analysis.js';
import { FLAWS } from './mckee.js';

// ---------------------------------------------------------------------------
// Light stemming and fuzzy phrase matching
// ---------------------------------------------------------------------------

const IRREGULAR = {
  bit: 'bite', bitten: 'bite', broke: 'break', broken: 'break', threw: 'throw', thrown: 'throw', took: 'take', taken: 'take',
  ran: 'run', kept: 'keep', left: 'leave', made: 'make', spilt: 'spill', slept: 'sleep', cried: 'cry', flew: 'fly', went: 'go',
  gone: 'go', got: 'get', gotten: 'get', came: 'come', saw: 'see', seen: 'see', told: 'tell', said: 'say', felt: 'feel',
  thought: 'think', bought: 'buy', caught: 'catch', fought: 'fight', held: 'hold', lost: 'lose', met: 'meet', paid: 'pay',
  sent: 'send', spent: 'spend', stood: 'stand', wore: 'wear', worn: 'wear', won: 'win', hung: 'hang', drove: 'drive',
  driven: 'drive', ate: 'eat', eaten: 'eat', fell: 'fall', fallen: 'fall', gave: 'give', given: 'give', knew: 'know',
  known: 'know', spoke: 'speak', spoken: 'speak', stole: 'steal', stolen: 'steal', wrote: 'write', written: 'write',
  better: 'good', best: 'good', worse: 'bad', worst: 'bad',
};

export function stem(word) {
  const w = String(word || '').toLowerCase().replace(/’/g, "'").replace(/'s$/, '');
  if (IRREGULAR[w]) return IRREGULAR[w];
  if (w.length <= 3 || /'/.test(w)) return w;
  let s = w;
  if (s.endsWith('ies') && s.length > 4) return `${s.slice(0, -3)}y`;
  if (s.endsWith('ing') && s.length > 5) {
    s = s.slice(0, -3);
    if (/([^aeiouls])\1$/.test(s)) s = s.slice(0, -1);
    return IRREGULAR[s] || s;
  }
  if (s.endsWith('ed') && s.length > 4) {
    s = s.slice(0, -2);
    if (/([^aeiouls])\1$/.test(s)) s = s.slice(0, -1);
    return IRREGULAR[s] || s;
  }
  if (/(ss|sh|ch|x|z)es$/.test(s)) return s.slice(0, -2);
  if (s.endsWith('s') && !s.endsWith('ss') && s.length > 3) return s.slice(0, -1);
  if (s.endsWith('ly') && s.length > 5) return s.slice(0, -2);
  return s;
}

const stems = (text) => words(text).map(stem);

// "make" ~ "mak" (making), "bark" = "bark": equal, or one a one-letter
// extension of the other.
function tokEq(a, b) {
  if (a === b) return true;
  if (a.length < 3 || b.length < 3) return false;
  return Math.abs(a.length - b.length) === 1 && (a.startsWith(b) || b.startsWith(a));
}

const OPTIONAL = new Set(['the', 'a', 'an', 'to', 'of', 'at', 'in', 'on', 'my', 'your', 'his', 'her', 'their', 'our', 'for', 'with', 'up', 'just', 'really', 'so']);

// In-order match of a phrase inside a line, allowing inserted words (gaps)
// and dropping filler words from the phrase ("back to square one" matches
// "back at square one"; "are you kidding me" matches "are you freaking
// kidding me").
export function fuzzyContains(lineToks, phrase) {
  const ptoks = stems(phrase);
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
      let found = -1;
      for (let g = 0; i + g < lineToks.length && gaps + g <= maxGap; g++) {
        if (tokEq(lineToks[i + g], p)) { found = g; break; }
      }
      if (found < 0) {
        if (OPTIONAL.has(p)) continue;
        ok = false;
        break;
      }
      gaps += found;
      i += found + 1;
      if (!OPTIONAL.has(p)) coreHits++;
    }
    if (ok && coreHits === core.length) return true;
  }
  return false;
}

// ---------------------------------------------------------------------------
// Lexicons
// ---------------------------------------------------------------------------

const EMOTIONS = new Set(`angry furious livid enraged mad resentful bitter sad unhappy miserable heartbroken devastated crushed depressed lonely
isolated empty numb hurt wounded betrayed abandoned rejected unloved unwanted invisible worthless useless ashamed guilty embarrassed
humiliated jealous envious terrified scared afraid frightened anxious nervous worried panicked overwhelmed happy glad thrilled overjoyed
ecstatic delighted grateful thankful relieved proud hopeful excited loved cherished adored trapped helpless hopeless desperate confused
frustrated disappointed annoyed irritated disgusted horrified shocked hate love miss`.split(/\s+/).map(stem));

const FEELING_VERBS = new Set(['feel', 'be', 'am', "i'm", 'make', 'get', 'become', 'so', 'been', 'was', 'were', 'is']);
const FIRST_PERSON = new Set(['i', "i'm", "i've", "i'd", "i'll", 'me', 'my', 'myself']);

const SUPERLATIVE = new Set(['worst', 'most', 'entire', 'whole', 'ever', 'never', 'forever', 'everything', 'nothing', 'destroy', 'ruin', 'hate', 'kill', 'die', 'unbearable', 'absolutely', 'totally', 'completely', 'bad'].map(stem));

const ABSTRACT = new Set(`situation issue thing stuff aspect factor relationship feeling emotion emotional complicated process journey closure
dynamic level nature kind sort everything something anything nothing whatever regard basically somehow certain`.split(/\s+/).map(stem));

const PATTERNS = {
  onTheNose: [
    { re: /\bI\s+feel\s+(like|that)\s+you\b/i, msg: '“I feel like you…” announces a feeling and a judgment at once.' },
    { re: /\byou\s+(make|made|are making)\s+me\s+(so\s+|feel\s+)?\w+/i, msg: '“You make me…” names the effect outright.' },
    { re: /\b(all I (ever )?(want|need)|what I (really )?(want|need) is|I (just |really )?(want|need) you to (know|understand|see|hear|stay|believe|be))\b/i, msg: 'States the desire itself instead of acting on it.' },
    { re: /\bI (still |really |just |truly )?(love|hate|miss|forgive|resent|need|adore) (you|him|her|them)\b/i, msg: 'Declares the feeling to its object.' },
    { re: /\byou(?:'re| are) (only|just) (doing|saying) (this|that|it) (because|to)\b/i, msg: 'Names the other character\'s motive out loud.' },
  ],
  emptyTalk: [
    { re: /\b(since we were|when we were (kids|children|young|little|in school|at school)|back when we|remember when|as I said|like I said|as I told you|as I mentioned|as you know|as we both know|you remember)\b/i, msg: 'Reminds the listener of something she already knows.' },
    { re: /\b(for|over|in)\s+(\w+\s+)?(years|decades)\b/i, need: /\b(we|we've|we're|our|us|you and I|you and me)\b/i, msg: 'Shared history recited between people who lived it.' },
    { re: /\b[Yy]our (brother|sister|wife|husband|mother|father|mom|dad|son|daughter|boss|partner|uncle|aunt|cousin),\s+[A-Z][a-z]+/, msg: 'Tells the listener who her own relative is.' },
  ],
  clutter: [
    { re: /\b(good to see you|nice to see you|long time no see|how(?:'s| is) (your|the) (mom|mother|dad|father|family|kids|wife|husband|work|job)|how have you been|nice place|what brings you|(?:lovely|beautiful|nice) (day|weather)|it(?:'s| has) been (a while|ages|forever))\b/i, msg: 'Social small talk; is there an action underneath it?' },
  ],
  overlyPerceptive: [
    { re: /\b(I (always |just |tend to )?(push|pushed|keep) (people|everyone) (away|at a distance)|because I(?:'m| am) (scared|afraid|terrified)|I have (trouble|a hard time) (trusting|letting|opening|being)|I(?:'ve| have) never been (good at|able to)|that's just who I am|I guess I(?:'m| am) (just )?the (kind|type) of|my (whole )?life I(?:'ve| have) (always|never)|I(?:'ve| have) always (needed|wanted|been afraid)|my problem is)\b/i, msg: 'Self-diagnosis with more insight than people have about themselves.' },
  ],
  mistimedCue: [
    { re: /,\s*(if you don't mind|if that's (ok|okay|alright|all right|fine)|for what it's worth|to be honest|honestly|you see|in a way|so to speak|or so|or anything like that|as it were|I suppose|I guess|I think|I mean|you know what I mean|right|though)\s*[.!?…]*$/i, msg: 'A qualifier trails after the core word and delays the cue.' },
  ],
};

// Synonym clusters for "the same request in different words" (Ch. 9).
const CLUSTERS = {
  'asking to be heard': ['talk to', 'listen', 'hear me', 'hear what', 'hear me out', 'explain', 'let me finish', 'let me say', 'you have to understand'],
  'dismissing': ['leave me', 'alone', 'go away', 'get out', 'let me be', 'enough', 'shut up', 'back off', 'drop it', 'not now'],
  'apologizing': ['sorry', 'apologize', 'forgive me', 'my fault', 'mistake'],
  'pleading': ['please', 'i beg', 'i need you', 'help me', 'you have to', "you've got to"],
  'money': ['money', 'cash', 'pay', 'afford', 'owe', 'debt', 'loan'],
  'truth': ['truth', 'lie to me', 'lying', 'be honest', 'the real reason'],
};

function clusterHits(text) {
  const toks = stems(text);
  const hits = [];
  for (const [name, list] of Object.entries(CLUSTERS)) {
    const padded = ` ${toks.join(' ')} `;
    const term = list.find((ph) => (words(ph).length === 1
      ? toks.some((t) => tokEq(t, stem(ph)))
      : fuzzyContains(toks, ph) || padded.includes(` ${stems(ph).join(' ')} `)));
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

export function secondReadLine(line, ctx = {}) {
  const text = String(line.text || '').trim();
  if (!text || line.kind === 'action') return [];
  const out = [];
  const toks = stems(text);
  const lower = text.toLowerCase();
  const sliders = ctx.character?.voice?.sliders || {};
  const add = (flaw, severity, msg) => { if (!out.some((f) => f.flaw === flaw)) out.push(finding(flaw, severity, msg)); };

  // On-the-nose: first person + a named emotion in the same sentence.
  for (const s of sentences(text)) {
    const ws = words(s);
    const st = ws.map(stem);
    const emotion = st.find((t) => EMOTIONS.has(t));
    if (emotion && ws.some((w) => FIRST_PERSON.has(w)) && st.some((t) => FEELING_VERBS.has(t) || EMOTIONS.has(t))) {
      add('onTheNose', 'warning', `Names a feeling outright (“${ws[st.indexOf(emotion)]}”). Would she say it, or show it?`);
      break;
    }
  }
  for (const [flaw, list] of Object.entries(PATTERNS)) {
    for (const p of list) {
      if (p.re.test(text) && (!p.need || p.need.test(text))) { add(flaw, flaw === 'onTheNose' ? 'warning' : 'info', p.msg); break; }
    }
  }

  // Stock phrases, matched fuzzily (inflections, padding, punctuation).
  const cliche = CLICHES.find((c) => fuzzyContains(toks, c));
  if (cliche) add('cliche', 'warning', `Close to the cliché “${cliche}”.`);
  const neutral = NEUTRAL_PHRASES.find((c) => fuzzyContains(toks, c) || (words(c).length >= 3 && lower.replace(/[^a-z' ]+/g, ' ').replace(/\s+/g, ' ').includes(c)));
  if (neutral) add('characterNeutral', 'warning', `A variant of the ready-made “${neutral}”. How would only this character say it?`);

  // Abstraction and Latinate density, at lower thresholds than the rules.
  const cws = contentWords(text);
  const abstract = cws.filter((w) => ABSTRACT.has(stem(w)));
  if (cws.length >= 3 && abstract.length >= 2 && abstract.length / cws.length >= 0.25) add('blurred', 'info', `Abstract, generic words (${abstract.slice(0, 3).join(', ')}). Name the concrete thing.`);
  const latin = words(text).filter(isLatinate);
  if ((sliders.latinate ?? 40) < 65 && words(text).length >= 4 && latin.length >= 2 && latin.length / words(text).length >= 0.25) add('arid', 'info', `Latinate cluster (${latin.slice(0, 3).join(', ')}).`);

  // Emotional overstatement against the beat's stakes.
  const sup = toks.filter((t) => SUPERLATIVE.has(t) || EMOTIONS.has(t)).length;
  const intensity = Number(ctx.beat?.intensity) || 0;
  if (sup >= 3 && intensity > 0 && intensity <= 3 && (sliders.overstatement ?? 50) < 70) add('melodrama', 'warning', 'Superlatives and emotion words in a low-stakes beat.');

  // Subtext leaking into text (stem-level, more sensitive than the rules).
  if (line.subtext) {
    const sub = new Set(contentWords(line.subtext).map(stem));
    const txt = new Set(cws.map(stem));
    if (sub.size >= 3) {
      let shared = 0;
      for (const t of sub) if ([...txt].some((x) => tokEq(x, t))) shared++;
      if (shared / sub.size >= 0.5) add('onTheNose', 'warning', 'Most of the subtext is already in the words.');
    }
  }

  // Long for this speaker.
  if (ctx.speakerMedian && words(text).length > Math.max(30, ctx.speakerMedian * 2.5)) add('longSpeech', 'info', `Much longer than this character usually speaks (${words(text).length} words vs. a typical ${Math.round(ctx.speakerMedian)}).`);
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
  const chars = Object.fromEntries((project.characters || []).map((c) => [c.id, c]));
  const flat = flattenLines(scene, { speechOnly: true });
  const lengths = {};
  for (const { line } of flat) (lengths[line.speaker] ||= []).push(words(line.text).length);
  const lines = {};
  const sceneFindings = [];
  for (const { line, beat } of flat) {
    lines[line.id] = secondReadLine(line, { character: chars[line.speaker], beat, speakerMedian: median(lengths[line.speaker] || []) });
  }

  // Same request in different words: three consecutive lines from one
  // speaker in the same synonym cluster, without three distinct tactics.
  const bySpeaker = {};
  for (const { line } of flat) (bySpeaker[line.speaker] ||= []).push(line);
  for (const [sp, ls] of Object.entries(bySpeaker)) {
    for (let i = 2; i < ls.length; i++) {
      const trio = [ls[i - 2], ls[i - 1], ls[i]];
      const hitSets = trio.map((l) => clusterHits(l.text));
      const common = hitSets[0].filter((h) => hitSets[1].some((x) => x.name === h.name) && hitSets[2].some((x) => x.name === h.name));
      const tactics = new Set(trio.map((l) => String(l.tactic || '').trim().toLowerCase().split(/\s+/)[0]).filter(Boolean));
      if (common.length && tactics.size < 3) {
        const terms = hitSets.map((hs) => hs.find((h) => h.name === common[0].name)?.term).filter(Boolean);
        const who = chars[sp]?.name || 'A character';
        sceneFindings.push(finding('repetitiousBeats', 'warning', `${who} repeats the same action (${common[0].name}: “${terms.join('”, “')}”) three times in different words.`));
        (lines[ls[i].id] ||= []).push(finding('repetitiousBeats', 'warning', `Third time ${who} is ${common[0].name} (“${terms.join('”, “')}”). Change the tactic.`));
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
      sceneFindings.push(finding('noReaction', 'info', `Beat ${i + 1}: only one character acts, and nothing reacts.`));
    }
  });
  return { lines, scene: sceneFindings };
}
