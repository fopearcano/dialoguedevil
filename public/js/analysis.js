// Dialogue analysis engine. Pure functions, no DOM: shared by the browser
// and the Node test suite. Heuristics implement the flaws and tendencies
// described in McKee's "Dialogue", Part Two (Ch. 6-9) and Ch. 10, 12, 13.

import { FLAWS, VOICE_DIMENSIONS } from './mckee.js';

// ---------------------------------------------------------------------------
// Tokenizing
// ---------------------------------------------------------------------------

const STOPWORDS = new Set(`a about above after again against all am an and any are aren't as at be because been before being below
between both but by can can't cannot could couldn't did didn't do does doesn't doing don't down during each few for from further
had hadn't has hasn't have haven't having he he'd he'll he's her here here's hers herself him himself his how how's i i'd i'll i'm
i've if in into is isn't it it's its itself let's me more most mustn't my myself no nor not of off on once only or other ought our
ours ourselves out over own same shan't she she'd she'll she's should shouldn't so some such than that that's the their theirs them
themselves then there there's these they they'd they'll they're they've this those through to too under until up very was wasn't we
we'd we'll we're we've were weren't what what's when when's where where's which while who who's whom why why's with won't would
wouldn't you you'd you'll you're you've your yours yourself yourselves yeah yes no oh okay ok just like well gonna wanna got get
know think go going come say said one now still even back really thing things want tell look`.split(/\s+/));

export function words(text) {
  return (String(text || '').toLowerCase().match(/[a-z0-9]+(?:['’][a-z]+)*/g) || []).map((w) => w.replace(/’/g, "'"));
}

export function contentWords(text) {
  return words(text).filter((w) => w.length > 2 && !STOPWORDS.has(w) && !/^\d+$/.test(w));
}

export function sentences(text) {
  const t = String(text || '')
    .replace(/\([^)]*\)/g, ' ')
    .replace(/\.{3}|…/g, ' … ')
    .trim();
  if (!t) return [];
  const parts = t.match(/[^.!?]+[.!?]*/g) || [];
  return parts.map((s) => s.replace(/…/g, '').trim()).filter((s) => words(s).length > 0);
}

export function syllables(word) {
  let w = String(word || '').toLowerCase().replace(/[^a-z]/g, '');
  if (!w) return 0;
  if (w.length <= 3) return 1;
  w = w.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '').replace(/^y/, '');
  const groups = w.match(/[aeiouy]{1,2}/g);
  return Math.max(1, groups ? groups.length : 1);
}

const LATINATE_SUFFIXES = ['tion', 'sion', 'ity', 'ment', 'ance', 'ence', 'ancy', 'ency', 'ive', 'ous', 'ize', 'ization', 'ical', 'ial', 'ual', 'ary', 'ory', 'ology', 'able', 'ible', 'ific', 'ism', 'ate', 'ute', 'ude', 'ient', 'ant', 'ent'];
const LATINATE_EXCEPTIONS = new Set(['different', 'important', 'moment', 'government', 'remember', 'together', 'something', 'anything', 'everything', 'nothing', 'another', 'chocolate', 'whatever', 'understand', 'beautiful', 'family', 'apartment', 'parent', 'parents', 'present', 'accident', 'restaurant', 'elephant', 'instant', 'distant', 'silent', 'percent', 'everyone', 'tomorrow', 'yesterday', 'nobody', 'somebody', 'anybody', 'already', 'brother', 'mother', 'father', 'sister', 'daughter']);

export function isLatinate(word) {
  const w = String(word || '').toLowerCase();
  if (w.length < 7 || LATINATE_EXCEPTIONS.has(w)) return false;
  if (syllables(w) < 3) return false;
  return LATINATE_SUFFIXES.some((s) => w.endsWith(s) || w.endsWith(s + 's') || w.endsWith(s + 'd'));
}

// ---------------------------------------------------------------------------
// Lexicons
// ---------------------------------------------------------------------------

export const CLICHES = [
  'backseat driver', 'back to basics', 'back to square one', 'back to the drawing board', 'bad hair day', 'bag of tricks',
  'ballpark figure', 'ball is in your court', "ball's in your court", 'bang your head against a brick wall', 'barking up the wrong tree',
  'battle royal', 'round up the usual suspects', 'the usual suspects', 'at the end of the day', 'avoid it like the plague',
  'better late than never', 'between a rock and a hard place', 'bite the bullet', 'break the ice', 'by the book', 'calm before the storm',
  'cat got your tongue', 'cold feet', 'crystal clear', 'cut to the chase', 'dead as a doornail', 'easier said than done',
  'every cloud has a silver lining', 'fit as a fiddle', 'for what it\'s worth', 'get your act together', 'go the extra mile',
  'heart of gold', 'hit the ground running', 'in the nick of time', 'it is what it is', "it's not rocket science", 'last but not least',
  'leave no stone unturned', 'let the cat out of the bag', 'light at the end of the tunnel', 'live and learn', 'low-hanging fruit',
  'needle in a haystack', 'only time will tell', 'outside the box', 'over my dead body', 'piece of cake', 'play it by ear',
  'plenty of fish in the sea', 'read between the lines', 'sleep like a baby', 'slept like a baby', 'take it one day at a time',
  'the elephant in the room', 'the tip of the iceberg', 'think outside the box', 'time heals all wounds', 'too good to be true',
  'under the weather', 'when pigs fly', 'without further ado', 'worth its weight in gold', 'you only live once', 'avoid at all costs',
  'it\'s now or never', 'better safe than sorry', 'what goes around comes around', 'all\'s fair in love and war', 'all that glitters',
  'tears streaming down', 'a chill ran down my spine', 'heart skipped a beat', 'my heart skipped', 'pushing the envelope',
  'the moment of truth', 'lock and load', 'let\'s do this', 'i have a bad feeling about this', 'we\'re not so different, you and i',
  'you just don\'t get it', 'this isn\'t over', 'it\'s quiet. too quiet', 'too quiet', 'i\'m getting too old for this',
  'you\'re going to want to see this', 'don\'t you die on me', 'stay with me', 'we\'ve got company', 'it\'s a trap',
  'cover me', 'i\'ve got your back', 'go big or go home', 'the best of both worlds', 'a blessing in disguise', 'a dime a dozen',
  'add insult to injury', 'beat around the bush', 'burn the midnight oil', 'call it a day', 'cry over spilled milk',
  'every dog has its day', 'get out of hand', 'hang in there', 'jump the gun', 'kill two birds with one stone', 'let sleeping dogs lie',
  'miss the boat', 'no pain, no gain', 'on cloud nine', 'once in a blue moon', 'pull yourself together', 'speak of the devil',
  'the last straw', 'throw in the towel', 'twist my arm', 'under the radar', 'water under the bridge', 'when all is said and done',
  'you can\'t judge a book by its cover', 'a perfect storm', 'game changer', 'think long and hard', 'the writing on the wall',
  'like a kid in a candy store', 'happily ever after', 'once upon a time',
];

export const NEUTRAL_PHRASES = [
  'oh my god', 'oh my gosh', 'oh god', 'what the hell', 'are you kidding me', 'are you serious', 'we need to talk', 'it\'s not what it looks like',
  'i can explain', 'you don\'t understand', 'talk to me', 'it\'s complicated', 'what are you doing here', 'what\'s going on',
  'i don\'t know what to say', 'you have no idea', 'get out of here', 'leave me alone', 'i can\'t do this anymore', 'what do you want from me',
  'how could you', 'let me explain', 'you\'re right', 'whatever', 'i\'m fine', 'it\'s fine', 'we\'ll figure it out', 'trust me',
  'listen to me', 'that\'s not the point', 'you know what', 'i get it', 'what is that supposed to mean', 'i\'m sorry',
];

const PROFANITY = /\b(fuck\w*|shit\w*|damn\w*|hell|bitch\w*|bastard\w*|ass|asshole\w*|crap|piss\w*|dick\w*|cunt\w*|goddamn\w*|bloody|bollocks|prick\w*)\b/gi;

const PARTICIPIAL_ADJECTIVES = new Set(['tired', 'scared', 'married', 'worried', 'interested', 'bored', 'excited', 'surprised', 'pleased', 'used', 'supposed', 'done', 'gone', 'ashamed', 'amazed', 'annoyed', 'confused', 'concerned', 'convinced', 'disappointed', 'embarrassed', 'engaged', 'exhausted', 'finished', 'frightened', 'involved', 'prepared', 'relaxed', 'satisfied', 'shocked', 'stressed', 'terrified', 'thrilled', 'upset', 'drunk', 'stoned', 'broken', 'hidden', 'related', 'fucked', 'screwed', 'naked', 'wicked', 'sacred', 'beloved', 'crooked', 'ragged', 'jagged', 'red', 'bed', 'dead', 'ahead', 'instead', 'need', 'seed', 'proud', 'open', 'even', 'seven', 'eleven', 'heaven', 'often', 'golden', 'wooden', 'sudden', 'hidden', 'listen', 'children', 'women', 'men', 'then', 'when', 'ten', 'when', 'kitten', 'garden', 'chicken', 'happen', 'oxygen']);

const PASSIVE_IRREGULAR = new Set(['made', 'built', 'caught', 'taught', 'told', 'sold', 'held', 'kept', 'left', 'lost', 'paid', 'sent', 'spent', 'found', 'given', 'known', 'seen', 'shown', 'taken', 'thrown', 'written', 'beaten', 'chosen', 'forgotten', 'forgiven', 'stolen', 'bought', 'brought', 'thought', 'fought', 'meant', 'hit', 'hurt', 'put', 'set', 'shot', 'bitten', 'driven', 'eaten', 'frozen', 'ridden', 'risen', 'spoken', 'sworn', 'torn', 'worn', 'woken']);

const BE_VERBS = new Set(['am', 'is', 'are', 'was', 'were', 'be', 'been', 'being', "i'm", "you're", "he's", "she's", "it's", "we're", "they're", "that's", "there's", "isn't", "aren't", "wasn't", "weren't"]);

const MODALS = {
  possibility: ['could', 'might', 'may', 'maybe', 'perhaps', "couldn't", "mightn't"],
  ability: ['can', "can't", 'cannot', 'able'],
  obligation: ['must', 'should', 'ought', "shouldn't", "mustn't", 'need', 'needs', 'gotta'],
  volition: ['will', "won't", 'shall', 'would', "wouldn't", "i'll", "you'll", "we'll", "he'll", "she'll", "they'll", 'gonna'],
};

const INTENSIFIERS = new Set(['very', 'so', 'totally', 'absolutely', 'completely', 'utterly', 'never', 'always', 'everything', 'nothing', 'everyone', 'nobody', 'forever', 'incredibly', 'insanely', 'literally', 'extremely', 'ever', 'worst', 'best', 'hate', 'kill', 'die', 'dead']);

const GENERIC_WORDS = new Set(['thing', 'things', 'stuff', 'very', 'really', 'basically', 'utilize', 'utilise', 'big', 'nice', 'good', 'bad', 'somehow', 'something', 'whatever', 'situation', 'issue', 'issues', 'aspect', 'factor']);

const SUBORDINATORS = new Set(['because', 'although', 'though', 'while', 'whereas', 'unless', 'since', 'whenever', 'wherever', 'which', 'whom', 'whose', 'if', 'until', 'after', 'before', 'that']);

const FIGURATIVE = /\b(like an? |as if|as though|as \w+ as )|\b(is|was|are|were) (a|an|the) (\w+ )?(shroud|cage|prison|war|grave|storm|wound|desert|machine|mirror|ghost|dream|monster|fire|drug|church|zoo|circus|jungle|knife|bullet|cancer|tomb|ocean|abyss|poison)\b/i;

// ---------------------------------------------------------------------------
// Detector patterns
// ---------------------------------------------------------------------------

const ON_THE_NOSE = [
  /\bI\s+(?:really\s+|truly\s+|just\s+|honestly\s+|still\s+)?(?:love|hate|resent|envy|despise|adore|need|fear)\s+(?:you|him|her|them)\b/i,
  /\bI(?:'m|’m| am)\s+(?:so\s+|really\s+|very\s+|just\s+|still\s+)?(?:angry|furious|sad|hurt|upset|jealous|lonely|afraid of you|scared|terrified|depressed|anxious|ashamed|guilty|disappointed|heartbroken|in love with you|mad at you)\b/i,
  /\bI\s+feel\s+(?:so\s+|really\s+|very\s+)?(?:angry|sad|hurt|betrayed|lonely|alone|abandoned|used|unloved|guilty|ashamed|jealous|invisible|worthless|trapped)\b/i,
  /\b(?:my (?:true |real )?feelings|how I (?:really )?feel|the truth is,? I|deep down,? I|to be honest with you|what I really want is|I need you to (?:understand|know) (?:that )?I|you make me feel|I've always (?:felt|wanted you|been in love))\b/i,
  /\bI(?:'m|’m| am) (?:only |just )?(?:doing|saying) this because I\b/i,
];

const EMPTY_TALK = /\b(as you know|as we both know|as you(?:'re| are) (?:well )?aware|as I(?:'ve| have)? (?:told|said to) you|how long have we (?:known|been)|ever since we (?:were|met)|we(?:'ve| have) been (?:friends|married|together|partners) (?:for|since)|you(?:'re| are) my (?:brother|sister|wife|husband|father|mother|son|daughter|best friend)|remember when we)\b/i;

const CLUTTER = [
  /^(?:hi|hello|hey|hiya|good (?:morning|afternoon|evening))\b[\s,!.]*(?:\w+[\s,!.]*)?(?:how are you|how(?:'s| is) it going|how ya doing|what's up)?[\s?!.]*$/i,
  /\bhow are you(?: doing)?\??$|\bI'?m (?:fine|good|okay|ok),? (?:thanks|thank you)\b|\b(?:nice|lovely|beautiful) (?:weather|day)\b|\bhow (?:was|is) your (?:day|weekend|trip)\b|\band (?:the|your) kids\?/i,
];

const OVERLY_PERCEPTIVE = /\b(I realize now|I(?:'ve| have) realized that I|I see now that I|my problem is (?:that )?I|the reason I(?:'m| am| do)|because (?:of )?my (?:father|mother|childhood|dad|mom|parents)|I(?:'ve| have) always been (?:afraid|scared|terrified) of|I project|my insecurit|my (?:abandonment|trust) issues|I guess I(?:'ve| have) always|I(?:'m| am) the kind of (?:person|man|woman) who)/i;

const TRAILING_FILLER = /(?:,\s*)?\b(you know|or something|or whatever|i guess|i think|i suppose|i mean|anyway|and stuff|and all that|if you know what i mean|kind of|sort of|at all|basically|or anything|and everything|right|okay|ok)\s*[.!?…]*$/i;
const TRAILING_PREP = /\b(to|of|for|with|at|in|on|about|from|by|into|onto|over|through)\s*[.!…]*$/i;

// ---------------------------------------------------------------------------
// Metrics
// ---------------------------------------------------------------------------

const clamp = (v, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, v));
const scale = (v, a, b) => clamp(((v - a) / (b - a)) * 100);
const round = (v, d = 1) => Math.round(v * 10 ** d) / 10 ** d;

export function countPassive(text) {
  const ws = words(text);
  let n = 0;
  for (let i = 0; i < ws.length - 1; i++) {
    if (!BE_VERBS.has(ws[i])) continue;
    let j = i + 1;
    if (ws[j] && /ly$/.test(ws[j]) && ws[j + 1]) j++;
    const w = ws[j];
    if (!w || PARTICIPIAL_ADJECTIVES.has(w)) continue;
    if ((/[a-z]{3,}ed$/.test(w) || PASSIVE_IRREGULAR.has(w)) && !/eed$/.test(w)) n++;
  }
  return n;
}

export function lineMetrics(text) {
  const ws = words(text);
  const sents = sentences(text);
  const syl = ws.map(syllables);
  const raw = String(text || '');
  const capsWords = (raw.match(/\b[A-Z]{3,}\b/g) || []).filter((w) => !/^(OK|TV|FBI|CIA|USA|NYPD|DNA|CEO|ICU|ER|AM|PM|I)$/.test(w)).length;
  const modal = {};
  for (const [k, list] of Object.entries(MODALS)) modal[k] = ws.filter((w) => list.includes(w)).length;
  return {
    words: ws.length,
    sentences: Math.max(1, sents.length),
    syllables: syl.reduce((a, b) => a + b, 0),
    longWords: syl.filter((s) => s >= 3).length,
    latinate: ws.filter(isLatinate).length,
    questions: sents.filter((s) => /\?\s*$/.test(s)).length,
    exclamations: (raw.match(/!/g) || []).length,
    caps: capsWords,
    beVerbs: ws.filter((w) => BE_VERBS.has(w)).length,
    passive: countPassive(text),
    modal,
    commas: (raw.match(/[,;:—–]/g) || []).length,
    subordinators: ws.filter((w) => SUBORDINATORS.has(w)).length,
    figurative: (raw.match(new RegExp(FIGURATIVE.source, 'gi')) || []).length,
    profanity: (raw.match(PROFANITY) || []).length,
    intensifiers: ws.filter((w) => INTENSIFIERS.has(w)).length,
    generic: ws.filter((w) => GENERIC_WORDS.has(w)).length,
    pauses: (raw.match(/\.\.\.|…|—\s*$|\((?:beat|pause|silence)\)/gi) || []).length,
    longestSentence: sents.reduce((m, s) => Math.max(m, words(s).length), 0),
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
// the character's intended voice sliders (VOICE_DIMENSIONS).
export function measureVoice(texts) {
  const list = texts.filter((t) => String(t || '').trim()).map(lineMetrics);
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
    rational: Math.round(0.5 * scale(wps, 3, 18) + 0.5 * scale(spw, 1.12, 1.6) - Math.min(25, (s.exclamations / s.sentences) * 40)),
    reflective: Math.round(0.6 * scale(s.beVerbs / s.words, 0.015, 0.09) + 0.4 * scale((s.passive + s.modal.possibility) / s.lines, 0, 0.8)),
    complexity: Math.round(0.6 * scale(wps, 4, 20) + 0.4 * scale((s.commas + s.subordinators) / s.sentences, 0, 2.2)),
    vocabulary: Math.round(0.55 * scale(rootTTR, 2.5, 8) + 0.45 * scale(avgLen, 3.6, 5.2)),
    latinate: Math.round(scale(s.latinate / s.words, 0, 0.09)),
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

function containsPhrase(lower, phrase) {
  const esc = phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/'/g, "['’]");
  return new RegExp(`(^|[^a-z])${esc}([^a-z]|$)`, 'i').test(lower);
}

export function isGerundPhrase(tactic) {
  return /\b[a-z]{2,}ing\b/i.test(String(tactic || ''));
}

const SPEECH_LIMIT = { screen: 50, tv: 60, stage: 90, prose: 80 };

// ctx: { character, medium, genreMode, beat, nextSpeakerDiffers }
export function analyzeLine(line, ctx = {}) {
  const text = String(line.text || '').trim();
  const out = [];
  if (!text) return out;
  const lower = text.toLowerCase();
  const m = lineMetrics(text);
  const voice = (ctx.character && ctx.character.voice) || {};
  const sliders = voice.sliders || {};
  const nonrealism = ctx.genreMode === 'nonrealism';

  // Content: on-the-nose (Ch. 8)
  if (ON_THE_NOSE.some((r) => r.test(text))) {
    out.push(finding('onTheNose', nonrealism ? 'info' : 'serious',
      nonrealism ? 'States feeling outright. Nonrealism tolerates on-the-nose lines, but check that the moment wants it.' : 'The line puts the unsaid into the said: the character announces what she feels.'));
  }
  if (line.subtext && contentWords(line.subtext).length >= 4) {
    const overlap = jaccard(contentWords(text), contentWords(line.subtext));
    if (overlap >= 0.5) out.push(finding('onTheNose', 'warning', 'Text and subtext say the same thing. The subtext has risen into the text.'));
  }

  // Credibility (Ch. 6)
  if (EMPTY_TALK.test(text)) out.push(finding('emptyTalk', 'warning', 'Telling a listener what both characters already know, for the audience\'s benefit.'));
  if (OVERLY_PERCEPTIVE.test(text)) out.push(finding('overlyPerceptive', 'warning', 'The character diagnoses herself with implausible insight.'));
  const emotive = m.exclamations >= 2 || m.caps >= 2 || (m.exclamations >= 1 && m.intensifiers >= 2);
  if (emotive) {
    const lowStakes = ctx.beat && Number(ctx.beat.intensity) > 0 && Number(ctx.beat.intensity) <= 4;
    const overstater = (sliders.overstatement ?? 50) >= 70;
    if (lowStakes && !overstater) out.push(finding('melodrama', 'serious', 'High emotion in a low-intensity beat: expression exceeds motivation.'));
    else if (!overstater) out.push(finding('overlyEmotive', 'info', 'Heated language. Is the motivation as big as the expression? Would this character state or understate it?'));
  }

  // Language (Ch. 7)
  const cliches = CLICHES.filter((c) => containsPhrase(lower, c));
  if (cliches.length) out.push(finding('cliche', 'warning', `Cliché: “${cliches.slice(0, 3).join('”, “')}”.`, { terms: cliches }));
  const neutral = NEUTRAL_PHRASES.filter((c) => containsPhrase(lower, c));
  if (neutral.length) out.push(finding('characterNeutral', 'warning', `Ready-made phrase: “${neutral.slice(0, 3).join('”, “')}”. How would only this character say it?`, { terms: neutral }));
  if (CLUTTER.some((r) => r.test(text))) out.push(finding('clutter', 'warning', 'Small talk. Unless it hides a subtext, cut it.'));
  const latinateHeavy = m.words >= 8 && (m.latinate / m.words >= 0.15 || m.syllables / m.words >= 1.75);
  if (latinateHeavy && (sliders.latinate ?? 40) < 65) out.push(finding('arid', 'info', `Dry and Latinate (${m.latinate} Latinate word${m.latinate === 1 ? '' : 's'}, ${round(m.syllables / m.words, 2)} syllables/word). Character-specific, or arid?`));
  if (m.passive > 0) out.push(finding('passive', 'info', `Passive construction (${m.passive}). Test the active case.`));
  const limit = SPEECH_LIMIT[ctx.medium] || 60;
  if (m.words > 300) out.push(finding('monologue', 'serious', `${m.words} words: over two minutes of talk without a reaction.`));
  else if (m.words > limit) out.push(finding('longSpeech', 'info', `${m.words} words. Long for ${ctx.medium || 'this medium'} (guide: ~${limit}). Break it into beats or compress it.`));
  if (m.generic >= 3) out.push(finding('blurred', 'info', 'Several generic words (thing, stuff, very, big…). Name specific nouns and verbs.'));

  // Design (Ch. 9): end on the core word
  if (m.words >= 6 && ctx.nextSpeakerDiffers !== false) {
    const last = sentences(text).slice(-1)[0] || '';
    const isQuestion = /\?\s*$/.test(last);
    if (TRAILING_FILLER.test(text)) out.push(finding('mistimedCue', 'info', 'The speech trails off on filler after its core word. End on the cue.'));
    else if (!isQuestion && TRAILING_PREP.test(text)) out.push(finding('mistimedCue', 'info', 'Ends on a preposition. Move the core word to the end of the speech.'));
  }

  // Character voice
  const never = (voice.neverSays || []).filter((w) => w && containsPhrase(lower, String(w).toLowerCase()));
  if (never.length) out.push(finding('characterNeutral', 'serious', `Out of character: ${ctx.character.name || 'this character'} would never say “${never.join('”, “')}”.`, { terms: never }));
  const own = [...(voice.signature || []), ...(voice.knowledge || []), ...(voice.culture || [])].filter((w) => w && String(w).length > 2 && containsPhrase(lower, String(w).toLowerCase()));
  if (own.length) out.push({ flaw: 'characterSpecific', severity: 'good', name: 'Character-specific', ch: 10, message: `Draws on this character's own vocabulary: “${own.slice(0, 3).join('”, “')}”.`, fix: '' });
  if (m.figurative > 0 && (sliders.figurative ?? 50) >= 35) out.push({ flaw: 'trope', severity: 'good', name: 'Figurative', ch: 5, message: 'Uses an image or comparison. The more sensory, the deeper.', fix: '' });

  // Action beneath the line (Ch. 2, 3, 12)
  if (!String(line.tactic || '').trim() && !String(line.subtext || '').trim()) {
    out.push(finding('noSubtext', 'info', 'No action named yet. What is the character doing with these words?'));
  } else if (line.tactic && !isGerundPhrase(line.tactic)) {
    out.push(finding('noSubtext', 'info', `Label the action as a gerund (“${line.tactic}” → “…ing”).`));
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

const firstWord = (g) => String(g || '').trim().toLowerCase().split(/\s+/)[0] || '';

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
  const chars = Object.fromEntries((project.characters || []).map((c) => [c.id, c]));
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
    });
    // Accidental echoes (Ch. 9)
    if (next && entry.line.text && next.line.text) {
      const names = new Set((project.characters || []).flatMap((c) => words(c.name)));
      const a = new Set(contentWords(entry.line.text).filter((w) => w.length > 3 && !names.has(w)));
      const shared = [...new Set(contentWords(next.line.text))].filter((w) => a.has(w) && w.length > 3 && !names.has(w));
      if (shared.length >= 2) {
        res.push(finding('echo', 'info', `Echoes the previous line: “${shared.slice(0, 4).join('”, “')}”. Deliberate, or accidental?`, { terms: shared }));
      }
    }
    lineFindings[entry.line.id] = res;
    for (const f of res) if (f.severity !== 'good') counts[f.flaw] = (counts[f.flaw] || 0) + 1;
    if (res.some((f) => f.severity === 'serious' || f.severity === 'warning')) flagged++;
  });

  const beats = scene.beats || [];
  // Repetitious beats (Ch. 9, 12)
  for (let i = 1; i < beats.length; i++) {
    const a = beats[i - 1];
    const b = beats[i];
    if (a.action && b.action && firstWord(a.action) === firstWord(b.action) && firstWord(a.reaction) === firstWord(b.reaction)) {
      sceneFindings.push(finding('repetitiousBeats', 'warning', `Beats ${i} and ${i + 1} repeat the same action/reaction (${a.action}/${a.reaction}). Change the tactic.`));
    }
  }
  const tacticRuns = {};
  flat.forEach(({ line }) => {
    const sp = line.speaker;
    const t = firstWord(line.tactic);
    if (!t) { tacticRuns[sp] = null; return; }
    const run = tacticRuns[sp];
    if (run && run.t === t) {
      run.n++;
      if (run.n === 3) sceneFindings.push(finding('repetitiousBeats', 'warning', `${chars[sp]?.name || 'A character'} uses “${line.tactic}” three times running. Repetition trivializes meaning.`));
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
        sceneFindings.push(finding('repetitiousBeats', 'warning', `No value at stake changes across ${i - 2 === 0 ? 'the opening and beats 1' : `beats ${i - 2}`}–${i}. Same charge, beat after beat, feels dead.`));
        reported = true;
      }
    }
    if (tp && Math.abs(tp.change) < 2 && !tp.reversed) {
      sceneFindings.push(finding('misshapenScene', 'serious', `The ${primary.value.positive || 'value'}/${primary.value.negative || ''} charge ends where it began (${tp.open} → ${tp.close}). If nothing changes, nothing happens.`));
    } else if (tp && beats.length >= 4 && tp.beatIndex === 0) {
      sceneFindings.push(finding('misshapenScene', 'warning', 'The turn comes in the first beat; everything after runs downhill. Turning point too soon?'));
    } else if (tp && tp.beatIndex >= 0) {
      sceneFindings.push({ flaw: 'turningPoint', severity: 'good', name: 'Turning point', ch: 12, message: `Turns in beat ${tp.beatIndex + 1}: ${tp.open} → ${tp.close}${tp.reversed ? ' (reversal)' : ''}.`, fix: '' });
    }
  } else if (!primary) {
    sceneFindings.push(finding('misshapenScene', 'info', 'No value at stake yet. Name the value whose charge this scene changes.'));
  }

  const intens = beats.map((b) => Number(b.intensity) || 0).filter((x) => x > 0);
  let drops = 0;
  for (let i = 1; i < intens.length; i++) if (intens[i] < intens[i - 1]) drops++;
  if (intens.length >= 4 && drops > intens.length / 3) {
    sceneFindings.push(finding('repetitiousBeats', 'warning', `Intensity drops in ${drops} of ${intens.length - 1} transitions. Progression means each beat tops the last (a planned retreat is fine).`));
  }

  // Duelogue vs trialogue (Ch. 8)
  const speakers = [...new Set(flat.map((e) => e.line.speaker).filter(Boolean))];
  if (speakers.length === 2 && !String(scene.thirdThing || '').trim() && (counts.onTheNose || 0) >= 2) {
    sceneFindings.push(finding('duelogue', 'serious', 'Two characters, face to face, saying exactly what they feel. Find a third thing to route the conflict through.'));
  }
  // Monologue (Ch. 8): long unreacted runs
  let run = 0;
  let runWords = 0;
  for (let i = 0; i < flat.length; i++) {
    if (i > 0 && flat[i].line.speaker === flat[i - 1].line.speaker) { run++; runWords += words(flat[i].line.text).length; } else { run = 1; runWords = words(flat[i].line.text).length; }
    if (runWords > 300 && run > 1) { sceneFindings.push(finding('monologue', 'warning', `${chars[flat[i].line.speaker]?.name || 'A speaker'} talks for ${runWords} words without a reaction. Interlace reactions.`)); break; }
  }
  // Splintered: profanity padding a nonevent (Ch. 9)
  const prof = flat.reduce((a, e) => a + lineMetrics(e.line.text).profanity, 0);
  if (prof >= 4 && tp && Math.abs(tp.change) < 2) sceneFindings.push(finding('splintered', 'warning', 'Profanity rising in a scene whose value doesn\'t change. Expletives don\'t raise the temperature of a nonevent.'));

  // Speaker voice measurement and distinctiveness (Ch. 10, 13)
  const speakerStats = {};
  for (const sp of speakers) {
    const texts = flat.filter((e) => e.line.speaker === sp).map((e) => e.line.text);
    speakerStats[sp] = measureVoice(texts);
  }
  const pairs = [];
  for (let i = 0; i < speakers.length; i++) {
    for (let j = i + 1; j < speakers.length; j++) {
      const A = speakerStats[speakers[i]];
      const B = speakerStats[speakers[j]];
      if (!A.scores || !B.scores || A.sample < 25 || B.sample < 25) continue;
      const dist = voiceDistance(A.scores, B.scores);
      const lexA = flat.filter((e) => e.line.speaker === speakers[i]).flatMap((e) => contentWords(e.line.text));
      const lexB = flat.filter((e) => e.line.speaker === speakers[j]).flatMap((e) => contentWords(e.line.text));
      const overlap = jaccard(lexA, lexB);
      pairs.push({ a: speakers[i], b: speakers[j], distance: round(dist), overlap: round(overlap, 2) });
      if (dist < 12 && overlap > 0.25) sceneFindings.push(finding('sameVoice', 'warning', `${chars[speakers[i]]?.name || 'A'} and ${chars[speakers[j]]?.name || 'B'} sound alike (voice distance ${round(dist)}). Give each a voice from their own knowledge, personality and culture.`));
    }
  }
  // Voice drift: measured vs intended sliders
  for (const sp of speakers) {
    const c = chars[sp];
    const st = speakerStats[sp];
    if (!c || !st.scores || st.sample < 40) continue;
    const sliders = (c.voice && c.voice.sliders) || {};
    const drift = VOICE_DIMENSIONS.filter((d) => sliders[d.id] != null && Math.abs(sliders[d.id] - st.scores[d.id]) >= 40);
    if (drift.length) sceneFindings.push({ flaw: 'voiceDrift', severity: 'info', name: 'Voice drift', ch: 10, message: `${c.name}'s lines drift from the intended voice on: ${drift.map((d) => `${d.label} (intended ${sliders[d.id]}, measured ${st.scores[d.id]})`).join('; ')}.`, fix: 'Either revise the lines or update the voice profile. The character may have grown.' });
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
