// English language pack for the dialogue analysis: tokenizing, syllables,
// stemming, stock phrases and the patterns behind each flaw. lang/it.js
// provides the same interface for Italian. Messages are English keys that
// the engines translate into the interface language.

const lower = (s) => String(s || '').toLowerCase();

// ---------------------------------------------------------------------------
// Tokens, syllables, Latinate words
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

function words(text) {
  return (lower(text).match(/[a-z0-9]+(?:['’][a-z]+)*/g) || []).map((w) => w.replace(/’/g, "'"));
}

function syllables(word) {
  let w = lower(word).replace(/[^a-z]/g, '');
  if (!w) return 0;
  if (w.length <= 3) return 1;
  w = w.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '').replace(/^y/, '');
  const groups = w.match(/[aeiouy]{1,2}/g);
  return Math.max(1, groups ? groups.length : 1);
}

const LATINATE_SUFFIXES = ['tion', 'sion', 'ity', 'ment', 'ance', 'ence', 'ancy', 'ency', 'ive', 'ous', 'ize', 'ization', 'ical', 'ial', 'ual', 'ary', 'ory', 'ology', 'able', 'ible', 'ific', 'ism', 'ate', 'ute', 'ude', 'ient', 'ant', 'ent'];
const LATINATE_EXCEPTIONS = new Set(['different', 'important', 'moment', 'government', 'remember', 'together', 'something', 'anything', 'everything', 'nothing', 'another', 'chocolate', 'whatever', 'understand', 'beautiful', 'family', 'apartment', 'parent', 'parents', 'present', 'accident', 'restaurant', 'elephant', 'instant', 'distant', 'silent', 'percent', 'everyone', 'tomorrow', 'yesterday', 'nobody', 'somebody', 'anybody', 'already', 'brother', 'mother', 'father', 'sister', 'daughter']);

function isLatinate(word) {
  const w = lower(word);
  if (w.length < 7 || LATINATE_EXCEPTIONS.has(w)) return false;
  if (syllables(w) < 3) return false;
  return LATINATE_SUFFIXES.some((s) => w.endsWith(s) || w.endsWith(s + 's') || w.endsWith(s + 'd'));
}

// ---------------------------------------------------------------------------
// Lexicons
// ---------------------------------------------------------------------------

const CLICHES = [
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

const NEUTRAL_PHRASES = [
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

// Passive constructions in a token list: a form of "be" + past participle.
function countPassive(ws) {
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

const MODALS = {
  possibility: ['could', 'might', 'may', 'maybe', 'perhaps', "couldn't", "mightn't"],
  ability: ['can', "can't", 'cannot', 'able'],
  obligation: ['must', 'should', 'ought', "shouldn't", "mustn't", 'need', 'needs', 'gotta'],
  volition: ['will', "won't", 'shall', 'would', "wouldn't", "i'll", "you'll", "we'll", "he'll", "she'll", "they'll", 'gonna'],
};
const MODAL_OF = new Map(Object.entries(MODALS).flatMap(([k, list]) => list.map((w) => [w, k])));

const INTENSIFIERS = new Set(['very', 'so', 'totally', 'absolutely', 'completely', 'utterly', 'never', 'always', 'everything', 'nothing', 'everyone', 'nobody', 'forever', 'incredibly', 'insanely', 'literally', 'extremely', 'ever', 'worst', 'best', 'hate', 'kill', 'die', 'dead']);

const GENERIC_WORDS = new Set(['thing', 'things', 'stuff', 'very', 'really', 'basically', 'utilize', 'utilise', 'big', 'nice', 'good', 'bad', 'somehow', 'something', 'whatever', 'situation', 'issue', 'issues', 'aspect', 'factor']);

const SUBORDINATORS = new Set(['because', 'although', 'though', 'while', 'whereas', 'unless', 'since', 'whenever', 'wherever', 'which', 'whom', 'whose', 'if', 'until', 'after', 'before', 'that']);

const FIGURATIVE = /\b(like an? |as if|as though|as \w+ as )|\b(is|was|are|were) (a|an|the) (\w+ )?(shroud|cage|prison|war|grave|storm|wound|desert|machine|mirror|ghost|dream|monster|fire|drug|church|zoo|circus|jungle|knife|bullet|cancer|tomb|ocean|abyss|poison)\b/i;

// ---------------------------------------------------------------------------
// Rule patterns
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
// Second reader: stemming and its lexicons
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

function stem(word) {
  const w = lower(word).replace(/’/g, "'").replace(/'s$/, '');
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

const stemSet = (list) => new Set(list.split(/\s+/).filter(Boolean).map(stem));

const EMOTIONS = stemSet(`angry furious livid enraged mad resentful bitter sad unhappy miserable heartbroken devastated crushed depressed lonely
isolated empty numb hurt wounded betrayed abandoned rejected unloved unwanted invisible worthless useless ashamed guilty embarrassed
humiliated jealous envious terrified scared afraid frightened anxious nervous worried panicked overwhelmed happy glad thrilled overjoyed
ecstatic delighted grateful thankful relieved proud hopeful excited loved cherished adored trapped helpless hopeless desperate confused
frustrated disappointed annoyed irritated disgusted horrified shocked hate love miss`);

const SUPERLATIVE = stemSet('worst most entire whole ever never forever everything nothing destroy ruin hate kill die unbearable absolutely totally completely bad');

const ABSTRACT = stemSet(`situation issue thing stuff aspect factor relationship feeling emotion emotional complicated process journey closure
dynamic level nature kind sort everything something anything nothing whatever regard basically somehow certain`);

// Message keys are shared with lang/it.js so both packs translate alike.
const PATTERNS = {
  onTheNose: [
    { re: /\bI\s+feel\s+(like|that)\s+you\b/i, msg: 'Announces a feeling and a judgment of the other person at once.' },
    { re: /\byou\s+(make|made|are making)\s+me\s+(so\s+|feel\s+)?\w+/i, msg: 'Names the effect the other person has on her, outright.' },
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

// Synonym clusters for "the same request in different words" (Ch. 9). The
// cluster ids name the action in messages.
const CLUSTERS = {
  heard: ['talk to', 'listen', 'hear me', 'hear what', 'hear me out', 'explain', 'let me finish', 'let me say', 'you have to understand'],
  dismissing: ['leave me', 'alone', 'go away', 'get out', 'let me be', 'enough', 'shut up', 'back off', 'drop it', 'not now'],
  apologizing: ['sorry', 'apologize', 'forgive me', 'my fault', 'mistake'],
  pleading: ['please', 'i beg', 'i need you', 'help me', 'you have to', "you've got to"],
  money: ['money', 'cash', 'pay', 'afford', 'owe', 'debt', 'loan'],
  truth: ['truth', 'lie to me', 'lying', 'be honest', 'the real reason'],
};

export default {
  id: 'en',
  speech: /^en/i,
  letters: 'a-z',
  words,
  stopwords: STOPWORDS,
  syllables,
  isLatinate,
  // Calibration of the voice scores and thresholds for this language.
  norms: { spw: [1.12, 1.6], aridSpw: 1.75, avgLen: [3.6, 5.2], latinate: 0.09, beVerb: [0.015, 0.09] },
  CLICHES,
  NEUTRAL_PHRASES,
  PROFANITY,
  BE_VERBS,
  countPassive,
  modalOf: (w) => MODAL_OF.get(w) || null,
  INTENSIFIERS,
  GENERIC_WORDS,
  SUBORDINATORS,
  FIGURATIVE,
  capsOk: /^(OK|TV|FBI|CIA|USA|NYPD|DNA|CEO|ICU|ER|AM|PM|I)$/,
  pauses: /\.\.\.|…|—\s*$|\((?:beat|pause|silence)\)/gi,
  ON_THE_NOSE,
  EMPTY_TALK,
  CLUTTER,
  OVERLY_PERCEPTIVE,
  TRAILING_FILLER,
  TRAILING_PREP,
  isGerundPhrase: (t) => /\b[a-z]{2,}ing\b/i.test(String(t || '')),
  gerundEnding: '…ing',
  // The word that identifies a tactic when comparing runs of tactics.
  tacticKey: (t) => lower(t).trim().split(/\s+/)[0] || '',
  // Second reader
  stem,
  OPTIONAL: new Set(['the', 'a', 'an', 'to', 'of', 'at', 'in', 'on', 'my', 'your', 'his', 'her', 'their', 'our', 'for', 'with', 'up', 'just', 'really', 'so']),
  EMOTIONS,
  FEELING_VERBS: new Set(['feel', 'be', 'am', "i'm", 'make', 'get', 'become', 'so', 'been', 'was', 'were', 'is']),
  FIRST_PERSON: new Set(['i', "i'm", "i've", "i'd", "i'll", 'me', 'my', 'myself']),
  SUPERLATIVE,
  ABSTRACT,
  PATTERNS,
  CLUSTERS,
};
