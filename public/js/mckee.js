// McKee knowledge base.
// Every principle here is paraphrased from Robert McKee, "Dialogue: The Art of
// Verbal Action for Page, Stage, and Screen" (Twelve, 2016), with chapter
// references so the writer can go back to the source. Direct quotations are
// kept short and marked as such.

export const BOOK = {
  title: 'Dialogue: The Art of Verbal Action for Page, Stage, and Screen',
  author: 'Robert McKee',
  year: 2016,
  file: 'docs/Dialogue The Art of Verbal Action for Page, Stage, and Screen (Mckee, Robert).epub',
};

export const CHAPTERS = {
  pref: 'Preface: In Praise of Dialogue',
  1: 'The Full Definition of Dialogue',
  2: 'The Three Functions of Dialogue',
  3: 'Expressivity I: Content',
  4: 'Expressivity II: Form',
  5: 'Expressivity III: Technique',
  tasks: 'Part Two Introduction: Six Dialogue Tasks',
  6: 'Credibility Flaws',
  7: 'Language Flaws',
  8: 'Content Flaws',
  9: 'Design Flaws',
  10: 'Character-Specific Dialogue',
  11: 'Four Case Studies',
  12: 'Story/Scene/Dialogue',
  13: 'Balanced Conflict',
  14: 'Comic Conflict',
  15: 'Asymmetric Conflict',
  16: 'Indirect Conflict',
  17: 'Reflexive Conflict',
  18: 'Minimal Conflict',
  19: 'Mastering the Craft',
};

export function cite(ch) {
  if (ch == null) return '';
  const list = Array.isArray(ch) ? ch : [ch];
  return list
    .map((c) => (typeof c === 'number' ? `Ch. ${c} · ${CHAPTERS[c]}` : CHAPTERS[c] || String(c)))
    .join('; ');
}

// "Ch. 12–18" for consecutive chapters, "Ch. 3, 5" otherwise.
export function shortCite(ch) {
  if (ch == null) return '';
  const list = Array.isArray(ch) ? ch : [ch];
  const nums = list.filter((c) => typeof c === 'number').sort((a, b) => a - b);
  const named = list.filter((c) => typeof c !== 'number').map((c) => (c === 'tasks' ? 'Part 2' : c === 'pref' ? 'Preface' : String(c)));
  const runs = [];
  for (const n of nums) {
    const last = runs[runs.length - 1];
    if (last && n === last[1] + 1) last[1] = n;
    else runs.push([n, n]);
  }
  const parts = runs.map(([a, b]) => (a === b ? `${a}` : b === a + 1 ? `${a}, ${b}` : `${a}–${b}`));
  return [parts.length ? `Ch. ${parts.join(', ')}` : '', ...named].filter(Boolean).join('; ');
}

// ---------------------------------------------------------------------------
// Core definitions
// ---------------------------------------------------------------------------

export const DEFINITION = {
  quote: 'Any words said by any character to anyone.',
  ch: 1,
  gloss:
    'Dialogue is verbal action. From the Greek dia- ("through") and legein ("speech"): an action taken through words instead of deeds. Every line responds to a need, engages a purpose and performs an action. No character ever talks, even to himself, for no reason, to do nothing.',
};

export const THREE_TRACKS = [
  { id: 'others', name: 'Said to others', ch: 1, desc: 'Duologue, trialogue, multilogue: two-way talk between characters in scenes.' },
  { id: 'self', name: 'Said to oneself', ch: 1, desc: 'Inner dialogue. The mind splits into two conflicted selves; strictly, every monologue is a dialogue.' },
  { id: 'audience', name: 'Said to reader / audience', ch: 1, desc: 'Soliloquy, aside, voice-over, direct-to-camera, first-person prose: the character acts on the story-goer.' },
];

export const DIALOGUE_MODES = [
  { id: 'dramatized', name: 'Dramatized', ch: 1, desc: 'Acted out within a scene: lines go back and forth between characters in conflict, each line an action causing a reaction.' },
  { id: 'narratized', name: 'Narratized', ch: 1, desc: 'Spoken outside the scene, to the reader, audience or self. Still a dialogue: the narrator wants something from the listener.' },
  { id: 'indirect', name: 'Indirect', ch: [1, 4], desc: 'A prior scene described or paraphrased instead of played. Speeds pace and protects against banality.' },
];

export const MEDIA = [
  { id: 'screen', name: 'Film', ch: [1, 4], balance: 'Image over voice', notes: ['The audience watches more than it listens.', 'Screen dialogue must feel spontaneous and remain actable: write for the actor.', 'The most concise medium. Every phony line is magnified by the camera.', 'Silence invites the camera in.'] },
  { id: 'tv', name: 'Television', ch: [1, 4], balance: 'Voice and image balanced', notes: ['Small screens push the camera close, and when it does, the face talks.', 'Genres of family, friends, lovers and workplaces live through talk.', 'Talk is cheaper to shoot than image.'] },
  { id: 'stage', name: 'Stage', ch: [1, 4], balance: 'Voice over image', notes: ['The audience listens more than it watches.', 'The most embellished medium. The "as if" contract licenses poetic, figurative language.', 'Soliloquy and aside narratize dialogue directly to the house.'] },
  { id: 'prose', name: 'Prose', ch: [1, 4, 5], balance: 'Mental medium', notes: ['The most mutable medium: dramatized scenes, direct address, indirect and inner dialogue, paralanguage.', 'Novelists tend to put their finest language in narration and keep quoted dialogue plain.', 'Third-person narration is not dialogue; only characters have true voices.'] },
];

// ---------------------------------------------------------------------------
// Three functions of dialogue (Ch. 2)
// ---------------------------------------------------------------------------

export const THREE_FUNCTIONS = [
  {
    id: 'exposition',
    name: 'Exposition',
    ch: 2,
    desc: 'Passing the fictional facts of setting, history and character to the eavesdropping reader/audience.',
    points: [
      'Pacing and timing: give only what the story-goer needs when she needs and wants it. List every fact and rank it by importance.',
      'Show, don\'t tell: in dramatized scenes, telling erases subtext and flattens the character into the author\'s mouthpiece.',
      'Narrative drive: revelations make the reader reach ahead, so the facts slip by unnoticed.',
      'Exposition as ammunition: let characters use what they know as weapons in their struggle to get what they want.',
      'Revelations: the most important facts are secrets. A lesser-of-two-evils dilemma pries them loose at major turning points.',
      'Direct telling has two virtues in narration: speed and counterpoint.',
    ],
  },
  {
    id: 'characterization',
    name: 'Characterization',
    ch: 2,
    desc: 'A distinctive surface for each role, behind which true character waits to be revealed by choice under pressure.',
    points: [
      'True character is revealed only by risk-filled choices of action in pursuit of desire (the Principle of Choice).',
      'Characterization is the sum of surface traits. It intrigues, convinces and individualizes.',
      'The most important trait of all is talk: she speaks like no one we have met before.',
    ],
  },
  {
    id: 'action',
    name: 'Action',
    ch: 2,
    desc: 'Dialogue equips characters with the means of action: mental, physical (gestures and tasks) and verbal.',
    points: [
      'Elizabeth Bowen: "Dialogue is what characters do to each other."',
      'Before writing a line ask: What does my character want out of this situation? What action would he take at this precise moment? What exact words would carry it out?',
      'Name the subtextual action with an active gerund, the "-ing" form.',
    ],
  },
];

// ---------------------------------------------------------------------------
// Three spheres: said / unsaid / unsayable (Preface, Ch. 3)
// ---------------------------------------------------------------------------

export const SPHERES = [
  {
    id: 'said',
    name: 'The Said',
    layer: 'Text · characterization',
    ch: [3],
    desc: 'Ideas and emotions the character chooses to express to others, styled by vocabulary, diction, syntax, grammar, tone, tropes and accent.',
    prompt: 'What does this character freely and openly say about herself, others and the world?',
  },
  {
    id: 'unsaid',
    name: 'The Unsaid',
    layer: 'Conscious subtext',
    ch: [3],
    desc: 'Thoughts and feelings the self deliberately withholds. Readers intuit them through the words. The writer must hone the text so the unsaid can be sensed.',
    prompt: 'What does she think and feel, knowingly, but keep to herself?',
  },
  {
    id: 'unsayable',
    name: 'The Unsayable',
    layer: 'Subconscious subtext',
    ch: [3],
    desc: 'Subconscious drives and needs that incite choices. Beyond words, even to herself; expressed only in action under pressure.',
    prompt: 'What mute, unaware drive moves her, something she could not put into words even to herself?',
  },
];

// ---------------------------------------------------------------------------
// Conflict complex (Ch. 4, Ch. 12)
// ---------------------------------------------------------------------------

export const CONFLICT_LEVELS = [
  { id: 'physical', name: 'Physical', ch: [4, 12], desc: 'Time, space and every object in the natural and man-made world: not enough time, too far to go, nature, the supernatural.', talk: 'least talk' },
  { id: 'social', name: 'Social', ch: [4, 12], desc: 'Institutions and the people who run them: government, law, religion, military, corporations, schools, hospitals. Every institution is a pyramid of power.', talk: 'formal talk; speeches when public conflict peaks' },
  { id: 'personal', name: 'Personal', ch: [4, 12], desc: 'Relationships of intimacy: friends, family and lovers. Intimacy begins, changes and ends in talk.', talk: 'multilayered, multi-meaning dialogue' },
  { id: 'inner', name: 'Inner', ch: [4, 12], desc: 'Contradictory forces within a character\'s mind, body and emotions: memory betrays, the body fails, feelings overwhelm sense.', talk: 'inner dialogue, the most talk on the page' },
];

export const CONFLICT_RULE = {
  ch: 4,
  text: 'The more physical and social a story\'s conflicts, the less the dialogue; the more personal and private, the more the dialogue. Complex stories use two, three or all four levels; a story working only one level is complicated, not complex.',
};

// ---------------------------------------------------------------------------
// Six dialogue tasks (Part Two intro)
// ---------------------------------------------------------------------------

export const SIX_TASKS = [
  { id: 'action', name: 'Inner action', ch: 'tasks', desc: 'Each verbal expression takes an inner action.' },
  { id: 'progression', name: 'Progression', ch: 'tasks', desc: 'Each beat of action/reaction intensifies the scene, building to and around its turning point.' },
  { id: 'exposition', name: 'Exposition', ch: 'tasks', desc: 'Statements and allusions within the lines convey exposition.' },
  { id: 'style', name: 'Verbal style', ch: 'tasks', desc: 'A unique verbal style characterizes each role.' },
  { id: 'drive', name: 'Narrative drive', ch: 'tasks', desc: 'The flow of progressive beats carries the reader/audience on a wave of narrative drive.' },
  { id: 'credibility', name: 'Credibility', ch: 'tasks', desc: 'The language is authentic to its setting and true to character, maintaining belief in the fictional reality.' },
];

// ---------------------------------------------------------------------------
// Technique (Ch. 5)
// ---------------------------------------------------------------------------

export const LINE_DESIGNS = [
  {
    id: 'suspense',
    name: 'Suspense (periodic)',
    ch: [5, 9],
    desc: 'Withholds the core word or phrase until the end. The most dramatic and most comic design, and the best for cueing the other actor.',
    example: '"If you didn\'t want me to do it, why did you give me that ____?" (the meaning waits for the last word)',
  },
  {
    id: 'cumulative',
    name: 'Cumulative (loose)',
    ch: 5,
    desc: 'Core idea first, then phrases that develop it. Conversational and spontaneous, but a speech that ends on one tends to miscue.',
    example: '"I saw him the night he left, slamming the trunk, cursing the rain, keys in his teeth."',
  },
  {
    id: 'balanced',
    name: 'Balanced',
    ch: 5,
    desc: 'Core word in the middle, with subordinate phrases on either side. Free-running and natural.',
    example: '"Her debts were bad enough, but the lying is what I can\'t forgive, not after the funeral."',
  },
  {
    id: 'mixed',
    name: 'Mixed',
    ch: 5,
    desc: 'Constant use of any single design becomes wallpaper. Mix suspense lines for tension with cumulative and balanced lines for spontaneity.',
    example: '',
  },
];

export const TECHNIQUES = [
  { id: 'figurative', name: 'Figurative language', ch: 5, desc: 'Tropes resonate into the unsaid and unsayable. The more sensory the trope, the deeper and more memorable its effect. A singer\'s voice is "sour", not "lousy".' },
  { id: 'paralanguage', name: 'Paralanguage', ch: 5, desc: 'Face, gesture, posture, rate, pitch, volume, rhythm and proxemics. On the page, described with figurative language; on stage and screen, left room for the actor.' },
  { id: 'economy', name: 'Economy', ch: 5, desc: 'Say the maximum in the fewest possible words. Not vacuity, but economy. Omit needless words.' },
  { id: 'pause', name: 'The pause', ch: 5, desc: 'A pause before a turning point compresses tension; after it, lets meaning land. Overused, it loses its effect. A pause must be earned.' },
  { id: 'silence', name: 'The case for silence', ch: 5, desc: 'If the scene overtalks, write for the eye: paralanguage and physical action. Silence is the ultimate economy of language.' },
];

// ---------------------------------------------------------------------------
// Story / scene components (Ch. 12)
// ---------------------------------------------------------------------------

export const DESIRE_COMPLEX = [
  { id: 'objectOfDesire', name: 'Object of desire', ch: 12, desc: 'What the character consciously feels he must have to put life back in balance after the inciting incident. Physical, situational or ideational. Objective.' },
  { id: 'superIntention', name: 'Super-intention', ch: 12, desc: 'The deep, subjective need driving the pursuit. The object of desire restated as emotional hunger, e.g. "to gain inner peace through a public triumph".' },
  { id: 'motivation', name: 'Motivation', ch: [12, 6], desc: 'Why he needs what he needs. Roots often reach into childhood and are irrational. Do not confuse it with an excuse.' },
  { id: 'sceneIntention', name: 'Scene intention', ch: 12, desc: 'What he wants right now, in this scene, as a step toward the object of desire. Grant it and the scene ends.' },
  { id: 'backgroundDesires', name: 'Background desires', ch: 12, desc: 'Relationships he wants to keep stable. They form a web of restraint that limits what he will and will not say. A character with nothing to lose is capable of anything.' },
];

export const FIVE_STEPS = [
  { id: 'desire', name: 'Desire', ch: 12, q: 'What does the character want right now (scene intention), pulled by what deeper need?' },
  { id: 'antagonism', name: 'Sense of antagonism', ch: 12, q: 'What does she sense is blocking her, accurately or mistakenly?' },
  { id: 'choice', name: 'Choice of action', ch: 12, q: 'What does she choose to do to cause a reaction that moves her toward her intention?' },
  { id: 'action', name: 'Action', ch: 12, q: 'Name the action as a gerund. Is it verbal, physical, or both?' },
  { id: 'expression', name: 'Expression', ch: 12, q: 'Only now: the exact words (and gestures) that carry the action out.' },
];

export const STORY_VALUES = [
  ['life', 'death'], ['courage', 'cowardice'], ['truth', 'lie'], ['meaning', 'meaninglessness'],
  ['maturity', 'immaturity'], ['hope', 'despair'], ['justice', 'injustice'], ['love', 'hate'],
  ['loyalty', 'betrayal'], ['trust', 'distrust'], ['intimacy', 'isolation'], ['pride', 'humiliation'],
  ['power', 'powerlessness'], ['freedom', 'bondage'], ['safety', 'peril'], ['self-awareness', 'self-deception'],
  ['belonging', 'estrangement'], ['passion', 'boredom'], ['winning', 'losing'], ['sanity', 'madness'],
];

export const TURNING_POINT_TYPES = [
  { id: 'action', name: 'Action', ch: 12, desc: 'An immediate, direct deed turns the value ("I\'m leaving for good").' },
  { id: 'revelation', name: 'Revelation', ch: [12, 2], desc: 'A secret or unknown fact comes to light ("I married you for your money"). Backstory revelations are the most powerful turns.' },
];

export const BEAT_DEFINITION = {
  ch: [9, 12],
  text: 'A beat is a unit of action/reaction. An action starts it, a corresponding reaction ends it. Name both sides with gerunds (insulting/apologizing). However many times a pattern repeats, it is one beat. Beats change only when tactics change, and each should top the one before.',
};

export const CONTEXT_CULTURE = {
  ch: 12,
  high: 'High-context: relational, traditional, in-group; many things go unsaid. Dialogue calls for extreme economy and precise word choice. "An offer he couldn\'t refuse."',
  low: 'Low-context: diverse, fast-changing; people explain at length. Characters grow verbose and explicit as subtext shallows out.',
};

// ---------------------------------------------------------------------------
// Conflict types (case studies, Ch. 13-18)
// ---------------------------------------------------------------------------

export const CONFLICT_TYPES = [
  {
    id: 'balanced', name: 'Balanced conflict', ch: 13, example: 'THE SOPRANOS: Tony and Dr. Melfi',
    desc: 'A hard-fought duel of equals. Each side drives with a clear scene intention and tactics that top each other.',
    tips: ['Contrast the combatants in content (questions vs. statements), length (the one losing control shortens words and sentences) and pace (whoever controls the pace tends to win).', 'Repetition can be used deliberately, like waves, to swell rising anger.'],
  },
  {
    id: 'comic', name: 'Comic conflict', ch: 14, example: 'FRASIER: Frasier and Niles',
    desc: 'Balanced conflict pushed to lunatic limits. The comic character is mentally rigid, possessed by a single "humor" and myopic to every choice beyond it.',
    tips: ['Comedy calls for artful exaggeration that lets us judge behavior against the norm.', 'A joke is setup and payoff. Its energy comes from defensive and aggressive emotions and sex.', 'Trivialize the exalted; exalt the trivial.'],
  },
  {
    id: 'asymmetric', name: 'Asymmetric conflict', ch: 15, example: 'A Raisin in the Sun: Walter and Ruth',
    desc: 'One character\'s aggressive verbal action against another\'s quiet resistance. The quieter side can carry the scene\'s moral weight.',
    tips: ['Give the aggressor the words and the resister the silences, refusals and small deflections ("Eat your eggs").'],
  },
  {
    id: 'indirect', name: 'Indirect conflict', ch: 16, example: 'The Great Gatsby: Daisy and Tom',
    desc: 'Characters manipulate each other with words of covert antagonism. Hostility hides inside politeness, jokes and public performance.',
    tips: ['Let the reaction be implied, not described; the reader re-creates it.', 'In prose, balance dialogue against description; silence on the page is also a reaction.'],
  },
  {
    id: 'reflexive', name: 'Reflexive conflict', ch: 17, example: 'Fräulein Else; The Museum of Innocence',
    desc: 'Self against self. Narratized, inner dialogue in which the character inflicts the conflict on himself and keeps stirring its poison.',
    tips: ['Split the character into selves that argue.', 'Write in-character: become her, and let the selves interrupt one another.'],
  },
  {
    id: 'minimal', name: 'Minimal (implied) conflict', ch: 18, example: 'LOST IN TRANSLATION: Bob and Charlotte',
    desc: 'Conflict with the emptiness of what life denies, played in the shadows of the past. The fewest words express maximal meaning.',
    tips: ['Less is more: any word that can be cut should be cut.', 'Keep backstory offscreen and implicit; narrate losses with wit and economy.', 'Mini-pauses ("Well...", "Yeah...") open space for subtext.'],
  },
];

// ---------------------------------------------------------------------------
// Flaws & fixes (Part Two, Ch. 6-9)
// ---------------------------------------------------------------------------

export const FLAWS = {
  emptyTalk: { name: 'Empty talk', group: 'Credibility', ch: 6, why: 'Characters tell each other what they both already know, so the audience finds no motivation beneath the line.', fix: 'Turn the fact into ammunition: have one character use it against the other to get something.' },
  overlyEmotive: { name: 'Overly emotive talk', group: 'Credibility', ch: 6, why: 'Language far more emotional than the actual stakes makes the character seem hysterical or the author desperate.', fix: 'Raise the motivation to match the expression, or tone it down. Then ask: would this character state it or understate it?' },
  overlyKnowing: { name: 'Overly knowing talk', group: 'Credibility', ch: 6, why: 'The character knows what only the author could know.', fix: 'Know what your characters know, and keep your research out of their mouths.' },
  overlyPerceptive: { name: 'Overly perceptive talk', group: 'Credibility', ch: 6, why: 'The character diagnoses herself more profoundly than Freud, Jung and Socrates combined.', fix: 'Leave the insight in the subtext. Let her excuse herself instead of explaining herself.' },
  excuseAsMotivation: { name: 'Excuse mistaken for motivation', group: 'Credibility', ch: 6, why: 'A childhood trauma pasted in to explain extreme behavior is psychological shorthand, not a motivation.', fix: 'Bury the true drive (power, love, self-love...) in the subtext and give the character a self-deceiving justification to speak.' },
  melodrama: { name: 'Melodrama', group: 'Credibility', ch: [6, 18], why: 'The problem is not over-expression but under-motivation: behavior exceeds what is at stake.', fix: 'Lift motivation to match action, then decide: rant ("Smash every bone...") or understate ("Crucify him")?' },
  cliche: { name: 'Cliché', group: 'Language', ch: 7, why: 'A phrase we can recite before the actor says it.', fix: 'Never settle for the first choice. Pour out alternatives, go a little crazy, keep the best and cut the rest.' },
  characterNeutral: { name: 'Character-neutral language', group: 'Language', ch: 7, why: 'Generic, ready-made phrases ("Oh my God!") rob the moment of a revealing, character-specific choice.', fix: 'Ask: if she, and she alone, said this, how would she say it? Find words that would not fit in anyone else\'s mouth.' },
  ostentatious: { name: 'Ostentatious language', group: 'Language', ch: 7, why: 'Self-conscious literariness calls attention to the writing and breaks the bond of belief.', fix: 'Ask: if I were my character, in these circumstances, what would I say? When in doubt, tone it down.' },
  arid: { name: 'Arid language', group: 'Language', ch: 7, why: 'Dry, Latinate, polysyllabic words in long sentences.', fix: 'Prefer concrete to abstract, familiar to exotic, short words to long, direct phrases, active voice, short speeches. Unless it is character-specific (a Boyd Crowder).' },
  passive: { name: 'Passive voice', group: 'Language', ch: [7, 10], why: 'State-of-being verbs slow headway in a storm of conflict like a ship dragging anchor.', fix: 'Test the active case: "He\'ll figure it out", not "He isn\'t very smart".' },
  longSpeech: { name: 'Long speech', group: 'Language', ch: 7, why: 'Quantity substituted for quality; interest wanes.', fix: 'Express the maximum in the fewest, truest words. Break it into beats.' },
  clutter: { name: 'Clutter', group: 'Language', ch: 7, why: 'Small talk ("Hi, how ya doing?") hollows out scenes and misleads the audience, who look for meaning under every line.', fix: 'If the line suggests no unsaid thoughts and feelings, either enrich it or cut it.' },
  onTheNose: { name: 'On-the-nose', group: 'Content', ch: 8, why: 'The character states her fullest thoughts and deepest feelings outright. Subtext becomes text and the scene becomes unactable.', fix: 'Imply rather than explain. Find the action under the words and route the conflict through a third thing.' },
  monologue: { name: 'Monologue fallacy', group: 'Content', ch: 8, why: 'A long uninterrupted, unreactive speech (about 300 words, or two minutes) turns the character into a mouthpiece.', fix: 'Break it into beats of action/reaction: interlace the listener\'s reactions and the speaker\'s own inner reactions.' },
  duelogue: { name: 'Duelogue', group: 'Content', ch: 8, why: 'Two characters talk directly, explicitly and emotionally about their immediate problem, so nothing is left unsaid.', fix: 'Make it a trialogue: funnel the struggle through a third thing (an object, a person, a cultural icon, an idea).' },
  echo: { name: 'Accidental echo', group: 'Design', ch: 9, why: 'Repeated words that the eye skims over but the ear catches.', fix: 'Read the scene aloud and record it; cut or rewrite the echoes.' },
  repetitiousBeats: { name: 'Repetitious beats', group: 'Design', ch: 9, why: 'The same action/reaction, or the same value charge, beat after beat in different words. The scene goes dead.', fix: 'Change the tactic. Each beat must top the last. Write every choice down and pick the best.' },
  blurred: { name: 'Blurred meaning', group: 'Design', ch: [9, 10], why: 'Generic nouns and verbs propped up by adjectives and adverbs ("forcefully utilize a big nail").', fix: 'Name specific objects and actions: "Hammer a spike."' },
  mistimedCue: { name: 'Mistimed cue', group: 'Design', ch: 9, why: 'The core word lands early and trailing words follow, so the other actor must swallow a reaction.', fix: 'End each speech on its core word. Cut trailing prepositional phrases and fillers.' },
  misshapenScene: { name: 'Misshapen scene', group: 'Design', ch: 9, why: 'The turning point comes too soon, too late or not at all.', fix: 'Build beat by beat to and around the turning point, timed for its perfect moment.' },
  splintered: { name: 'Splintered scene', group: 'Design', ch: 9, why: 'Inner intentions and outer behavior disconnect: bland lines over strong desires, overwrought lines over weak desires, non sequiturs, or desires that never cross.', fix: 'Rebuild from the inside out: desires, conflict and tactics first, words last.' },
  paraphrasing: { name: 'Paraphrasing trap', group: 'Design', ch: [9, 12], why: 'Rephrasing faulty lines over and over makes them more on-the-nose.', fix: 'Dialogue problems are story problems. Fix the event and character design, not the words.' },
  noSubtext: { name: 'Line without action', group: 'Content', ch: [3, 2], why: 'No line is finished until you have answered: in the subtext of this verbal activity, what action is the character in fact taking?', fix: 'Name the tactic as a gerund and write the subtext.' },
  sameVoice: { name: 'Characters sound alike', group: 'Language', ch: [10, 2], why: 'When you write off the top of your head, every character sounds the same.', fix: 'Draw each voice from its own knowledge (nouns and verbs), personality (modifiers and modals) and culture.' },
};

// ---------------------------------------------------------------------------
// Word choice tendencies (Ch. 7)
// ---------------------------------------------------------------------------

export const WORD_CHOICE_OBSERVATIONS = [
  'The more emotional people become, the shorter their words and sentences; the more rational, the longer.',
  'The more active and direct, the shorter; the more passive and reflective, the longer.',
  'The more intelligent the person, the more complex the sentences.',
  'The more well read, the larger the vocabulary and the longer the words.',
];

export const PREFERENCES = [
  'Prefer the concrete to the abstract',
  'Prefer the familiar to the exotic',
  'Prefer short words to long words',
  'Prefer direct phrases to circumlocution',
  'Prefer an active to a passive voice',
  'Prefer short speeches to long',
  'Prefer expressive language to mimicry',
  'Eliminate clutter',
];

// ---------------------------------------------------------------------------
// Character-specific dialogue (Ch. 10)
// ---------------------------------------------------------------------------

export const CHARACTER_SPECIFIC = {
  ch: 10,
  principle: 'Nouns and verbs express a character\'s intellectual life and range of knowledge. Modifiers (adjectives, adverbs, voice, modalities) express his emotional life and personality.',
  knowledge: 'Generic nouns and verbs suggest ignorance ("a big nail", "moved slowly"). Specific ones suggest a superior mentality ("spike", "sauntered").',
  personality: [
    { id: 'adjectives', name: 'Adjectives', ex: '"big" vs. "stupendous" fireworks' },
    { id: 'adverbs', name: 'Adverbs', ex: '"quickly" vs. "ferociously"' },
    { id: 'voice', name: 'Voice (active / passive)', ex: '"The family planned the wedding" vs. "The wedding was planned by the family"' },
    { id: 'modals', name: 'Modals', ex: '"could plan" (possibility) vs. "must be planned" (obligation)' },
  ],
  culture: 'Culture (popular or esoteric) is our dominant source of knowledge, plus images from nature, cityscapes, workplaces, ritual, dreams and fantasies. It is a treasure chest of images and third things for distinctive dialogue.',
  limitation: 'Creative limitation: the tougher the technique, the more brilliant the feat. Image over language. Hold the vivid picture in mind, then search for the words.',
};

export const MODALITIES = [
  { id: 'possibility', name: 'Possibility', words: 'could · might · may', desc: 'Lives among options and hedges.' },
  { id: 'ability', name: 'Ability', words: 'can · able to', desc: 'Measures life by capacity.' },
  { id: 'obligation', name: 'Obligation', words: 'must · should · ought · have to', desc: 'Lives by rules, duty and judgment.' },
  { id: 'volition', name: 'Volition', words: 'will · would · shall · going to', desc: 'Asserts intention and will.' },
];

export const MENTALITIES = [
  { id: 'dramatic', name: 'Dramatic', ch: 14, desc: 'Pursues desire with some awareness. Can step back and think "this could get me killed".' },
  { id: 'comic', name: 'Comic', ch: 14, desc: 'Mental rigidity. Pursues an all-absorbing "humor" as if blind to every choice beyond it.' },
];

// ---------------------------------------------------------------------------
// Voice dimensions: sliders that make up a character's verbal fingerprint.
// Each pole is grounded in a chapter. `metric` names the analysis metric that
// measures the same dimension from the character's actual lines.
// ---------------------------------------------------------------------------

export const VOICE_DIMENSIONS = [
  { id: 'rational', short: 'Rational', label: 'Emotional ↔ Rational', lo: 'Emotional', hi: 'Rational', ch: 7, metric: 'rational', hint: 'Emotion shortens words and sentences; reason lengthens them.' },
  { id: 'reflective', short: 'Reflective', label: 'Active ↔ Reflective', lo: 'Active / direct', hi: 'Passive / reflective', ch: 7, metric: 'reflective', hint: 'Active, direct people use short words and action verbs; reflective people use state-of-being verbs.' },
  { id: 'complexity', short: 'Complex', label: 'Sentence complexity', lo: 'Simple', hi: 'Complex', ch: 7, metric: 'complexity', hint: 'The more intelligent the person, the more complex the sentences.' },
  { id: 'vocabulary', short: 'Vocabulary', label: 'Vocabulary range', lo: 'Small', hi: 'Large', ch: [7, 10], metric: 'vocabulary', hint: 'The well read have larger vocabularies and longer words.' },
  { id: 'latinate', short: 'Latinate', label: 'Anglo-Saxon ↔ Latinate', lo: 'Short, punchy', hi: 'Latinate, polysyllabic', ch: 7, metric: 'latinate', hint: 'Fire, hand, ham vs. flame, palm, pork. Latinate is the language of power and pretension.' },
  { id: 'figurative', short: 'Figurative', label: 'Plain ↔ Figurative', lo: 'Literal', hi: 'Image-rich', ch: [5, 10], metric: 'figurative', hint: 'Sensory tropes resonate into the subtext. Extreme characters deserve image-rich language.' },
  { id: 'questions', short: 'Questions', label: 'Statements ↔ Questions', lo: 'Declares', hi: 'Asks', ch: 13, metric: 'questions', hint: 'Half of Tony Soprano\'s lines are questions; Dr. Melfi makes statements.' },
  { id: 'pace', short: 'Staccato', label: 'Languid ↔ Staccato', lo: 'Long, slow lines', hi: 'Short, rapid lines', ch: 13, metric: 'pace', hint: 'Whoever controls the pace tends to win the scene.' },
  { id: 'overstatement', short: 'Overstates', label: 'Understates ↔ Overstates', lo: 'Understates', hi: 'Overstates', ch: 6, metric: 'overstatement', hint: '"Crucify him" (power) vs. the screaming rant (weakness).' },
  { id: 'profanity', short: 'Profane', label: 'Clean ↔ Profane', lo: 'Clean', hi: 'Profane', ch: 9, metric: 'profanity', hint: 'Profanity fits some worlds like a silk suit, but it never rescues a tepid scene. A silent gangster is a lethal gangster.' },
];

export const SUBTEXT_DIMENSION = { id: 'context', label: 'Low ↔ High context', lo: 'Explains everything', hi: 'Implies everything', ch: 12 };

// ---------------------------------------------------------------------------
// Character profile schema (drives forms, completeness and the AI coach)
// ---------------------------------------------------------------------------

export const CHARACTER_SECTIONS = [
  {
    id: 'identity', name: 'Identity', ch: [2, 12],
    fields: [
      { path: 'name', label: 'Name', type: 'text' },
      { path: 'role', label: 'Story role', type: 'text', placeholder: 'Protagonist, antagonist, confidant, foil…' },
      { path: 'logline', label: 'One-line metaphor', type: 'textarea', placeholder: 'Characters are metaphors for human nature (Preface). What is this one a metaphor for?' },
    ],
  },
  {
    id: 'characterization', name: 'Characterization: the mask', ch: 2,
    blurb: 'Who the character seems to be: the sum of surface traits that intrigue, convince and individualize.',
    fields: [
      { path: 'characterization.summary', label: 'Appearance (who she seems to be)', type: 'textarea' },
      { path: 'characterization.biology', label: 'Biology & physicality', type: 'textarea', placeholder: 'Age, gender, body, health, energy…' },
      { path: 'characterization.upbringing', label: 'Upbringing & family', type: 'textarea' },
      { path: 'characterization.education', label: 'Education & experience', type: 'textarea' },
      { path: 'characterization.mentality', label: 'Mentality & emotionality', type: 'textarea' },
      { path: 'characterization.values', label: 'Attitudes, values & tastes', type: 'textarea' },
    ],
  },
  {
    id: 'trueCharacter', name: 'True character: the core', ch: [2, 3],
    blurb: 'Who the character actually is, revealed only by risk-filled choices under pressure.',
    fields: [
      { path: 'trueCharacter.core', label: 'Core identity under pressure', type: 'textarea', placeholder: 'Backed into a corner, what does she choose, and what does that reveal?' },
      { path: 'trueCharacter.contradiction', label: 'Core contradiction (mask vs. core)', type: 'textarea', placeholder: 'e.g. a risk-averse persona over a risk-enticed core' },
      { path: 'trueCharacter.mentality', label: 'Mentality', type: 'select', options: MENTALITIES.map((m) => [m.id, m.name]) },
      { path: 'trueCharacter.humor', label: 'Comic "humor" (if comic)', type: 'text', placeholder: 'The single obsession that draws all his powers one way', when: (c) => c.trueCharacter?.mentality === 'comic' },
    ],
  },
  {
    id: 'spheres', name: 'The three spheres', ch: [3, 'pref'],
    blurb: 'A self within a self within a self.',
    fields: [
      { path: 'spheres.said', label: 'The said', type: 'textarea', placeholder: SPHERES[0].prompt },
      { path: 'spheres.unsaid', label: 'The unsaid', type: 'textarea', placeholder: SPHERES[1].prompt },
      { path: 'spheres.unsayable', label: 'The unsayable', type: 'textarea', placeholder: SPHERES[2].prompt },
    ],
  },
  {
    id: 'desire', name: 'Complex of desire', ch: [12, 6],
    blurb: 'Desire is a figure in five dimensions.',
    fields: [
      { path: 'desire.incitingIncident', label: 'Inciting incident (for this character)', type: 'textarea' },
      { path: 'desire.objectOfDesire', label: 'Object of desire (conscious want)', type: 'textarea' },
      { path: 'desire.superIntention', label: 'Super-intention (deep need)', type: 'textarea' },
      { path: 'desire.subconsciousDesire', label: 'Subconscious desire (if it contradicts)', type: 'textarea' },
      { path: 'desire.motivation', label: 'Motivation (why)', type: 'textarea' },
      { path: 'desire.excuse', label: 'Excuse / self-justification', type: 'textarea', placeholder: 'What he tells himself and others instead of the real drive (Ch. 6)' },
      { path: 'desire.spine', label: 'Spine of action', type: 'textarea' },
    ],
  },
  {
    id: 'antagonism', name: 'Forces of antagonism', ch: [12, 4],
    blurb: 'Opposition from any or all of the four levels of conflict.',
    fields: CONFLICT_LEVELS.map((l) => ({ path: `antagonism.${l.id}.text`, label: `${l.name} conflict`, type: 'textarea', placeholder: l.desc })),
  },
  {
    id: 'voice', name: 'Voice', ch: [10, 7, 5, 12, 13],
    blurb: 'Knowledge in nouns and verbs; personality in modifiers and modals; images from culture.',
    fields: [
      { path: 'voice.knowledge', label: 'Knowledge: specific nouns & verbs', type: 'list', placeholder: 'spike, saunter, milligram…' },
      { path: 'voice.modifiers', label: 'Personality: favorite adjectives & adverbs', type: 'list' },
      { path: 'voice.signature', label: 'Signature words & phrases', type: 'list' },
      { path: 'voice.neverSays', label: 'Words she would never use', type: 'list' },
      { path: 'voice.culture', label: 'Cultural treasure chest (images, icons, third things)', type: 'list' },
      { path: 'voice.modality', label: 'Dominant modality', type: 'select', options: MODALITIES.map((m) => [m.id, `${m.name} (${m.words})`]) },
      { path: 'voice.lineDesign', label: 'Natural line design', type: 'select', options: LINE_DESIGNS.map((d) => [d.id, d.name]) },
      { path: 'voice.dialect', label: 'Accent, dialect, register', type: 'text' },
      { path: 'voice.tics', label: 'Verbal habits & paralanguage', type: 'textarea', placeholder: 'Glides ("Well…"), interruptions, gestures, proxemics…' },
    ],
  },
  {
    id: 'secrets', name: 'Secrets & exposition', ch: 2,
    blurb: 'Backstory is not a biography but the excerpt of past, usually secret, events that propel the story.',
    fields: [],
  },
];

// ---------------------------------------------------------------------------
// The interviewer: a dialogic, offline question deck. Each question fills a
// profile field. Ordered from the outside (mask) in (unsayable), then voice.
// ---------------------------------------------------------------------------

export const INTERVIEW = [
  { id: 'q-role', path: 'role', ch: 12, ask: 'Let\'s start at the surface. What role does {name} play in the story: protagonist, antagonist, confidant, foil?' },
  { id: 'q-mask', path: 'characterization.summary', ch: 2, ask: 'Who does {name} seem to be? Describe the mask: what would a stranger notice in the first five minutes?' },
  { id: 'q-bio', path: 'characterization.biology', ch: 2, ask: 'Biology and physicality: age, body, health, energy. What is {name} given at birth that shapes how they move through a room?' },
  { id: 'q-up', path: 'characterization.upbringing', ch: [2, 10], ask: 'Where and how did {name} grow up? Family, class, place. These shape the vocabulary they absorbed.' },
  { id: 'q-edu', path: 'characterization.education', ch: [7, 10], ask: 'Education and experience: what has {name} read, studied, worked at? (The well read have larger vocabularies and longer words, Ch. 7.)' },
  { id: 'q-values', path: 'characterization.values', ch: 2, ask: 'What does {name} value, scorn and crave? Tastes, attitudes, politics, guilty pleasures.' },
  { id: 'q-inciting', path: 'desire.incitingIncident', ch: 12, ask: 'What event throws {name}\'s life out of balance?' },
  { id: 'q-object', path: 'desire.objectOfDesire', ch: 12, ask: 'To restore balance, what does {name} consciously feel they must have? Name the object of desire: physical, situational or ideational.' },
  { id: 'q-super', path: 'desire.superIntention', ch: 12, ask: 'Restate that want as a need. What emotional hunger drives the pursuit? ("To gain inner peace through a public triumph.")' },
  { id: 'q-subcon', path: 'desire.subconsciousDesire', ch: [12, 19], ask: 'Look into the subtext. Does {name} also want something they cannot admit, something that works against the conscious desire? Is {name} their own worst enemy?' },
  { id: 'q-motive', path: 'desire.motivation', ch: 12, ask: 'Why does {name} need what they need? Follow the roots back as far as you like; they are often irrational.' },
  { id: 'q-excuse', path: 'desire.excuse', ch: 6, ask: 'Now the cover story. What excuse or justification does {name} give for their behavior, instead of the real motivation? (Richard III claims he "cannot prove a lover", then seduces Anne in the next scene.)' },
  { id: 'q-spine', path: 'desire.spine', ch: 12, ask: 'In a sentence, what is {name}\'s spine of action, the relentless pursuit that runs under every scene?' },
  { id: 'q-phys', path: 'antagonism.physical.text', ch: 12, ask: 'Physical antagonism: what in time, space, nature or the body stands against {name}?' },
  { id: 'q-soc', path: 'antagonism.social.text', ch: 12, ask: 'Social antagonism: which institutions or power pyramids block {name}?' },
  { id: 'q-pers', path: 'antagonism.personal.text', ch: 12, ask: 'Personal antagonism: which friend, lover or family member stands in the way?' },
  { id: 'q-inner', path: 'antagonism.inner.text', ch: 12, ask: 'Inner antagonism: how do {name}\'s own mind, body or feelings betray them?' },
  { id: 'q-said', path: 'spheres.said', ch: 3, ask: 'The said: what does {name} freely tell people about themselves and the world?' },
  { id: 'q-unsaid', path: 'spheres.unsaid', ch: 3, ask: 'The unsaid: what does {name} think and feel, knowingly, but keep from others?' },
  { id: 'q-unsayable', path: 'spheres.unsayable', ch: 3, ask: 'The unsayable: what subconscious drive moves {name}, something they could not put into words even to themselves?' },
  { id: 'q-core', path: 'trueCharacter.core', ch: [2, 3], ask: 'Back {name} into the worst corner of the story. What do they choose? What does that choice reveal that the mask hides?' },
  { id: 'q-contra', path: 'trueCharacter.contradiction', ch: 13, ask: 'Name the core contradiction between characterization and true character (Dr. Melfi: risk-averse persona, risk-enticed core).' },
  { id: 'q-knowledge', path: 'voice.knowledge', ch: 10, ask: 'What does {name} know better than anyone in the room? List specific nouns and verbs from that knowledge (not "a big nail" but "spike", "sinker").', list: true },
  { id: 'q-mods', path: 'voice.modifiers', ch: 10, ask: 'Which adjectives and adverbs does {name} reach for? Fireworks that are "big" or "stupendous"? A bike going "quickly" or "ferociously"?', list: true },
  { id: 'q-modal', path: 'voice.modality', ch: 10, ask: 'Which modality does {name} live in: possibility (could, might), ability (can), obligation (must, should) or volition (will)? Type one.', choice: MODALITIES.map((m) => m.id) },
  { id: 'q-culture', path: 'voice.culture', ch: 10, ask: 'What culture filled {name}\'s head: films, songs, sports, scripture, trades, landscapes? These become images and third things.', list: true },
  { id: 'q-neutral', path: 'samples.ohmygod', ch: 7, ask: 'Voice test. Shocked, {name} calls on God. How would they, and only they, say it? (Not "Oh my God!")' },
  { id: 'q-iloveyou', path: 'samples.iloveyou', ch: 8, ask: 'Voice test. {name} loves someone. Without the words "I love you", what do they say?' },
  { id: 'q-understate', path: 'samples.sentence', ch: 6, ask: 'Voice test. {name} holds power over an enemy and must pass sentence. A rant, or a whisper like "Crucify him"? Write the line.' },
  { id: 'q-secret', path: 'secrets.0.text', ch: 2, ask: 'What secret does {name} hide, from others or from themselves?' },
  { id: 'q-dilemma', path: 'secrets.0.dilemma', ch: 2, ask: 'What lesser-of-two-evils dilemma would pry that secret loose? ("If I tell, I lose X; if I don\'t, something worse happens.")' },
  { id: 'q-magic', path: 'samples.magicIf', ch: 19, ask: 'The Magic If. Not "what would {name} do?" and not "what would I do?", but "If I were {name} in the story\'s worst moment, what would I do? What would I say?" Write the line.' },
];

// ---------------------------------------------------------------------------
// Voice exercises (the "Say it their way" lab)
// ---------------------------------------------------------------------------

export const VOICE_EXERCISES = [
  { id: 'ohmygod', title: 'Shock without "Oh my God"', ch: 7, prompt: 'Something terrible happens in front of them. How do they call on God (or the devil), in words that fit no one else\'s mouth?' },
  { id: 'iloveyou', title: 'Love, unsaid', ch: 8, prompt: 'Declare love without saying "I love you". Find the action under it: rekindling? letting down gently?' },
  { id: 'sentence', title: 'State or understate', ch: 6, prompt: 'They have total power over an enemy. Pass sentence. A rant, or "Crucify him"?' },
  { id: 'sour', title: 'Sensory trope', ch: 5, prompt: 'Describe a bad singer\'s voice with a sensory image ("sour", not "lousy").' },
  { id: 'saunter', title: 'The specific verb', ch: 10, prompt: 'Someone they despise just crossed the room. Describe how, with one specific verb.' },
  { id: 'ammo', title: 'Exposition as ammunition', ch: 2, prompt: 'In a fight, use a shared fact from the past (how long you\'ve known each other, where you met) as a weapon.' },
  { id: 'third', title: 'Through a third thing', ch: 8, prompt: 'Attack a rival without naming the problem. Route it through an object, a person or a cultural icon.' },
  { id: 'refuse', title: 'The refusal', ch: 15, prompt: 'Refuse a desperate request without saying "no".' },
  { id: 'magicIf', title: 'The Magic If', ch: 19, prompt: 'If I were this character in the story\'s worst moment, what would I say?' },
];

// ---------------------------------------------------------------------------
// Tactic gerunds: the vocabulary of verbal action (Ch. 2, 3, 12-18)
// ---------------------------------------------------------------------------

export const TACTICS = {
  Connecting: ['inviting', 'charming', 'flattering', 'complimenting', 'seducing', 'consoling', 'comforting', 'reassuring', 'sympathizing', 'confiding', 'confessing', 'apologizing', 'joining in', 'celebrating', 'endorsing', 'encouraging', 'thanking'],
  Persuading: ['pleading', 'begging', 'bargaining', 'bribing', 'tempting', 'selling', 'promising', 'reasoning', 'playing for pity', 'guilt-tripping', 'proving worth', 'propositioning', 'recruiting'],
  Attacking: ['accusing', 'blaming', 'cornering', 'threatening', 'interrogating', 'ridiculing', 'belittling', 'insulting', 'humiliating', 'mocking', 'daring', 'provoking', 'denouncing', 'punishing', 'lecturing', 'correcting', 'exposing'],
  Defending: ['deflecting', 'stalling', 'buying time', 'avoiding', 'denying', 'lying', 'concealing', 'changing the subject', 'joking it off', 'justifying', 'claiming innocence', 'playing dumb', 'stonewalling', 'dismissing', 'snubbing'],
  Maneuvering: ['testing', 'probing', 'baiting', 'manipulating', 'steering', 'ordering', 'negotiating', 'deceiving', 'feigning interest', 'playing the victim', 'showing off', 'posturing', 'setting a trap', 'giving a way out', 'warning'],
  Yielding: ['surrendering', 'giving in', 'conceding', 'submitting', 'placating', 'retreating', 'withdrawing', 'retreating in silence', 'resigning', 'forgiving'],
  Revealing: ['revealing', 'confronting with the truth', 'unmasking', 'admitting', 'naming the unspoken', 'predicting'],
};

export const ALL_TACTICS = Object.values(TACTICS).flat();

// ---------------------------------------------------------------------------
// Key questions (Ch. 19): ask them on every beat, three times per scene.
// ---------------------------------------------------------------------------

export const KEY_QUESTIONS = [
  { id: 'background', name: 'Background desires', q: 'What relationships surround the character? How do they limit his choices of action and his language? What can he not do or say, at least not yet?' },
  { id: 'object', name: 'Objects of desire', q: 'What does he tell himself he wants to restore life\'s balance? Is there a subconscious desire? Do they contradict?' },
  { id: 'super', name: 'Super-intention', q: 'What need drives him down his spine of action? Is he his own worst enemy?' },
  { id: 'scene', name: 'Scene intentions', q: 'What does he seem to want right now? What does he really want? Is it a step toward the super-intention?' },
  { id: 'motivation', name: 'Motivation', q: 'Why does he want what he wants?' },
  { id: 'driver', name: 'Scene driver', q: 'Who drives this scene and makes it happen?' },
  { id: 'antagonism', name: 'Forces of antagonism', q: 'Where does conflict come from: within, other characters, the setting?' },
  { id: 'values', name: 'Scene values', q: 'What value is at stake? What is its opening charge? Its closing charge?' },
  { id: 'subtext', name: 'Subtext', q: 'Beneath what he seems to be doing, what is he actually doing? What tactics might he use?' },
  { id: 'beats', name: 'Beats', q: 'What action does he take in the subtext of each line? What reactions might it cause? Is this line an action or a reaction?' },
  { id: 'progression', name: 'Progression', q: 'Do the beats progressively top each other?' },
  { id: 'tactics', name: 'Tactics', q: 'With these words, said this way, what specific tactic is he taking? What effect is he trying to cause?' },
  { id: 'turning', name: 'Turning point', q: 'Where does the value change to its final charge, in precisely which beat?' },
  { id: 'deep', name: 'Deep character', q: 'How do the choices in this scene reveal the truth about the characters?' },
  { id: 'sceneprog', name: 'Scene progression', q: 'How does this scene progress the story?' },
  { id: 'text', name: 'Text', q: 'Outwardly, what would he say to get what he wants?' },
  { id: 'exposition', name: 'Exposition', q: 'What facts does this line carry? Dramatized invisibly or narratized? Too soon, too late, or just right?' },
  { id: 'characterization', name: 'Characterization', q: 'Do the verbal styles match each character\'s personality, background and traits?' },
];

export const MASTERING = [
  { id: 'listen', name: 'Listen', ch: 19, desc: 'Listen on two levels, text and subtext: what people say versus what they do. Notice how people use words to conceal their actions.' },
  { id: 'read', name: 'Read the good, rewrite the bad', ch: 19, desc: 'Read and watch great dialogue. When you meet bad dialogue, rewrite it; it is the fastest way to train talent.' },
  { id: 'incharacter', name: 'Write in-character', ch: 19, desc: 'Be the character\'s first actor. Work from the inside out, then reimagine from the outside in. Act it out, as Dickens did at his mirror.' },
  { id: 'magicif', name: 'The Magic If', ch: 19, desc: 'Not "what would my character do?" and not "what would I do?", but "If I were my character in this situation, what would I do?"' },
  { id: 'questions', name: 'Ask questions', ch: 19, desc: 'Creativity isn\'t learning the right answers but asking the strongest questions.' },
];

export const AXIOMS = [
  { text: 'Dialogue problems are story problems.', ch: [4, 9] },
  { text: 'Dialogue: any words said by any character to anyone.', ch: 1 },
  { text: 'To say something is to do something.', ch: 1 },
  { text: 'Desire is the source of action, and action is the source of dialogue.', ch: 12 },
  { text: 'Dialogue concentrates meaning; conversation dilutes it.', ch: 6 },
  { text: 'A scene should never be outwardly and entirely about what it seems to be about.', ch: 8 },
  { text: 'Silence is the ultimate economy of language.', ch: 5 },
  { text: 'There are no free rests: a pause must be earned.', ch: 5 },
  { text: 'Voice is not a choice; it\'s a result.', ch: 10 },
  { text: 'If nothing changes, nothing happens.', ch: 9 },
  { text: 'Don\'t copy life, express it.', ch: 7 },
  { text: 'Creativity is choice-making.', ch: 5 },
];
