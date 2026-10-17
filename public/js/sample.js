// An original sample project ("What He Left") that demonstrates the method:
// character profiles built from the complex of desire and the three spheres,
// and a scene designed beat by beat, with a third thing (the watch),
// exposition used as ammunition and a backstory revelation as turning point.

import { normalizeProject } from './model.js';
import { sampleProjectIt } from './sample.it.js';

// The sample in the given language; same ids in every language.
export function sampleProject(lang = 'en') {
  if (lang === 'it') return normalizeProject(sampleProjectIt());
  const N = 'char_nadia';
  const T = 'char_teo';
  const VT = 'val_truth';
  const VB = 'val_belong';

  const line = (id, speaker, text, tactic, subtext, paren = '', extra = {}) => ({ id, speaker, text, tactic, subtext, paren, ...extra });
  const act = (id, text) => ({ id, kind: 'action', text });

  return normalizeProject({
    id: 'proj_sample',
    lang: 'en',
    title: 'What He Left',
    logline: 'Two estranged siblings divide their late father\'s things in one night, and his broken wristwatch becomes the battlefield for which of them he loved.',
    medium: 'screen',
    genre: 'Family drama',
    genreMode: 'realism',
    coreValue: { positive: 'belonging', negative: 'estrangement' },
    incitingIncident: 'Their father, a watch repairman, dies. The will splits the shop fifty-fifty and doesn\'t mention his watch.',
    mdq: 'Will Nadia and Teo find their way back to each other, or will their father\'s death finish what his favoritism started?',
    characters: [
      {
        id: N,
        name: 'Nadia',
        slot: 0,
        role: 'Protagonist',
        logline: 'A caretaker who mistakes control for love.',
        characterization: {
          summary: 'Brisk, competent, dry hospice nurse. Scrubs under a winter coat, lists in every pocket, never sits down.',
          biology: '41. Strong hands, a bad back from lifting patients, four hours of sleep a night.',
          upbringing: 'Eldest child, raised in the flat above her father\'s watch-repair shop. Mother left when she was twelve; she raised Teo.',
          education: 'Nursing diploma at night school. Grew up at the workbench: she can strip a movement blind. Reads clinical journals and crime novels.',
          mentality: 'Feels everything, shows nothing. Anger comes out as efficiency.',
          values: 'Duty. Showing up. Being useful. Scorns people who "visit". Craves being chosen.',
        },
        trueCharacter: {
          core: 'Under pressure she chooses control over truth: she will lie to keep the family\'s story, and her place in it, in order.',
          contradiction: 'Selfless caretaker on the surface; underneath, a woman who needs to be needed and resents it.',
          mentality: 'dramatic',
        },
        spheres: {
          said: 'Practical facts: schedules, dosages, what needs doing and who didn\'t do it.',
          unsaid: 'She is furious that Teo got to leave and still got Dad\'s pride.',
          unsayable: 'She kept Dad to herself at the end, afraid he would light up for Teo the way he never did for her.',
        },
        desire: {
          incitingIncident: 'Dad dies; the will splits the shop and is silent about the watch.',
          objectOfDesire: 'Dad\'s 1962 wristwatch, the one he wore every day.',
          superIntention: 'To be acknowledged as the one who loved him enough.',
          subconsciousDesire: 'To punish Teo for leaving, and to be forgiven for not calling him.',
          motivation: 'Since twelve she has earned love by being useful. Without Dad to care for, she doesn\'t know who she is.',
          excuse: '"Somebody had to be responsible."',
          spine: 'To keep control of Dad\'s legacy and of her version of the family story.',
        },
        antagonism: {
          physical: { text: 'The flat must be cleared by Friday; she hasn\'t slept.', level: 4 },
          social: { text: 'The estate lawyer; the hospice rules she bent.', level: 3 },
          personal: { text: 'Teo, who wants the watch; Dad, who loved Teo\'s promise more than her service.', level: 8 },
          inner: { text: 'Guilt over the last night. Her need to be the good one.', level: 9 },
        },
        relationships: [
          { id: 'rel_n1', targetId: T, label: 'Teo, the brother she raised', charge: -4, restraint: 'Won\'t say she missed him. Won\'t say she didn\'t call.' },
          { id: 'rel_n2', targetId: '', label: 'Dad (dead)', charge: 6, restraint: 'Won\'t admit he favored Teo.' },
        ],
        voice: {
          sliders: { rational: 25, reflective: 10, complexity: 15, vocabulary: 55, latinate: 15, figurative: 25, questions: 15, pace: 85, overstatement: 5, profanity: 10 },
          context: 80,
          knowledge: ['balance staff', 'mainspring', 'caseback', 'loupe', 'escapement', 'morphine', 'lucid', 'chart', 'night shift'],
          modifiers: ['clean', 'stable', 'exactly', 'fine'],
          signature: ['noted', 'for the record'],
          neverSays: ['awesome', 'closure', 'journey', 'honestly'],
          culture: ['the shop', 'Columbo reruns', 'saints\' days', 'the hospice break room'],
          modality: 'obligation',
          lineDesign: 'suspense',
          dialect: 'Clipped, working-class. Drops subjects: "Found it in the drawer."',
          tics: 'Answers questions with tasks. Folds and wraps while she talks. Never sits.',
        },
        secrets: [
          { id: 'sec_n1', text: 'Dad asked for Teo on his last night. She didn\'t call him.', dilemma: 'If she tells, Teo learns she stole his goodbye. If she doesn\'t, she lives as the jailer of that lie, and lets Teo believe Dad never asked.' },
        ],
        facts: [
          { id: 'f_n1', text: 'She raised Teo after their mother left (she was 12, he was 6).', importance: 4 },
          { id: 'f_n2', text: 'She worked nights at the hospice so she could care for Dad by day.', importance: 5 },
          { id: 'f_n3', text: 'Dad taught both of them watch repair; she was better at it.', importance: 3 },
        ],
        samples: {
          ohmygod: 'Jesus, Mary and the night nurse.',
          iloveyou: 'I left the hall light on. Like always.',
          sentence: 'Put him on the schedule.',
          magicIf: 'Sell it. Geneva.',
        },
      },
      {
        id: T,
        name: 'Teo',
        slot: 1,
        role: 'Antagonist (sibling rival)',
        logline: 'A salesman who has sold himself the story that leaving was the brave choice.',
        characterization: {
          summary: 'Charming, sleek, forever on his phone, jokes to fill every silence. A tailored coat bought with borrowed money.',
          biology: '35. Runner\'s build, insomniac; his hands tremble when he hasn\'t had a drink.',
          upbringing: 'The youngest, adored by Dad as "the clever one". Raised by Nadia after Mom left.',
          education: 'Two years of business school; dropped out to found a company. Podcasts, business books, keynote videos.',
          mentality: 'Optimist on the surface, panic underneath. Avoids conflict with charm.',
          values: 'Winning, being liked, momentum. Scorns "small lives". Craves Dad\'s approval, still.',
        },
        trueCharacter: {
          core: 'Under pressure he chooses himself and calls it honesty.',
          contradiction: 'The confident self-made man over a core that is broke and terrified of being ordinary.',
          mentality: 'dramatic',
        },
        spheres: {
          said: 'Big plans, market language, jokes, compliments.',
          unsaid: 'His company folded in June. He is two months behind on rent and needs to sell the watch.',
          unsayable: 'He left because he couldn\'t watch Dad lean on Nadia. He believes he was never needed.',
        },
        desire: {
          incitingIncident: 'Dad dies, and the watch isn\'t mentioned in the will.',
          objectOfDesire: 'The watch, to sell to a collector and cover his debts.',
          superIntention: 'To prove that leaving was right: that he is the success Dad bragged about.',
          subconsciousDesire: 'To be told he was missed.',
          motivation: 'Dad\'s love always felt conditional on promise; failure would mean he was never worth it.',
          excuse: '"Dad would want it to go to someone who\'ll use it."',
          spine: 'To leave with the watch, and with his story intact.',
        },
        antagonism: {
          physical: { text: 'A 6 a.m. flight. Shaking hands.', level: 3 },
          social: { text: 'Creditors, ex-investors, a landlord.', level: 7 },
          personal: { text: 'Nadia, who controls everything in the flat.', level: 8 },
          inner: { text: 'Shame over his failure, disguised as optimism.', level: 7 },
        },
        relationships: [
          { id: 'rel_t1', targetId: N, label: 'Nadia, the sister who raised him', charge: -3, restraint: 'Can\'t admit failure in front of her.' },
        ],
        voice: {
          sliders: { rational: 40, reflective: 30, complexity: 35, vocabulary: 65, latinate: 35, figurative: 15, questions: 55, pace: 55, overstatement: 25, profanity: 5 },
          context: 30,
          knowledge: ['valuation', 'collector', 'runway', 'pivot', 'round', 'leverage', 'salaries'],
          modifiers: ['incredible', 'basically', 'honestly', 'totally'],
          signature: ['honestly', 'here\'s the thing'],
          neverSays: ['sorry', 'I was wrong'],
          culture: ['startup podcasts', 'The Godfather', 'the shop radio', 'Geneva auction houses'],
          modality: 'possibility',
          lineDesign: 'cumulative',
          dialect: 'Polished corporate-casual. The neighborhood comes back into his vowels when he\'s cornered.',
          tics: 'Fills silence with questions. Touches his phone like a rosary.',
        },
        secrets: [
          { id: 'sec_t1', text: 'His company folded in June. He is broke and needs to sell the watch.', dilemma: 'If he admits it, Nadia wins: he is the failure she predicted. If he hides it, he leaves without the watch and goes under.' },
        ],
        facts: [
          { id: 'f_t1', text: 'He left for the city at 22 and visited twice in five years.', importance: 4 },
          { id: 'f_t2', text: 'A collector in Geneva has offered 11,000 for the watch.', importance: 3 },
        ],
        samples: {
          ohmygod: 'Okay. Okay. Wow. Okay.',
          iloveyou: 'You still cut the crusts off. Unbelievable.',
          sentence: 'Honestly? Let the market decide what he\'s worth.',
        },
      },
    ],
    scenes: [
      {
        id: 'scene_watch',
        title: 'The Watch',
        heading: 'INT. FLAT ABOVE THE WATCH SHOP - NIGHT',
        description: 'Boxes, newspaper, a workbench under a gooseneck lamp. Nadia wraps teacups. Teo comes in with a carry-on and two coffees.',
        track: 'others',
        mode: 'dramatized',
        conflictType: 'balanced',
        participants: [
          { characterId: T, intention: 'To leave with the watch', subIntention: 'To hear that Dad asked for him', tactic: 'charming her into a deal', antagonism: 'Nadia guards every object in the flat' },
          { characterId: N, intention: 'To make Teo leave without the watch', subIntention: 'To make him feel what it cost her to stay', tactic: 'controlling the room', antagonism: 'Teo\'s claim on Dad\'s pride, and her own secret' },
        ],
        driver: T,
        values: [
          { id: VT, positive: 'truth', negative: 'lie', opening: -5 },
          { id: VB, positive: 'belonging', negative: 'estrangement', opening: -4 },
        ],
        thirdThing: 'Dad\'s 1962 wristwatch, stopped at ten past four.',
        exposition: [
          { id: 'e1', text: 'Nadia cared for Dad alone for two years.', delivered: true },
          { id: 'e2', text: 'Teo\'s company has failed and he needs money.', delivered: true },
          { id: 'e3', text: 'Dad taught both of them watch repair.', delivered: true },
          { id: 'e4', text: 'Dad asked for Teo on his last night.', delivered: true },
          { id: 'e5', text: 'Their mother left when they were children.', delivered: false },
        ],
        turningPoint: { type: 'revelation', note: 'Nadia reveals Dad asked for Teo, and she didn\'t call. Truth turns positive while belonging hits bottom: an ironic climax.' },
        beats: [
          {
            id: 'b1', actor: T, action: 'bearing gifts', reactor: N, reaction: 'refusing the peace offering', intensity: 2,
            charges: { [VT]: -5, [VB]: -4 },
            lines: [
              act('a1', 'Teo sets a coffee on the workbench, beside the gooseneck lamp. Nadia keeps wrapping.'),
              line('l1', T, 'Oat milk, two sugars. Still how you take it, or did you finally evolve?', 'charming', 'I remember you. Let\'s be friends tonight.', 'holding out the cup'),
              line('l2', N, 'Black. Since the second year of night shifts.', 'correcting him', 'You don\'t know me anymore, because you weren\'t here.'),
            ],
          },
          {
            id: 'b2', actor: T, action: 'steering toward the watch', reactor: N, reaction: 'shaming him', intensity: 3,
            charges: { [VT]: -5, [VB]: -5 },
            lines: [
              line('l3', T, 'The lawyer says the shop\'s fifty-fifty, which is basically incredible of him, honestly. The only loose end is the watch.', 'steering', 'The watch is the only thing worth money, and I need money.', 'scanning the bench'),
              line('l4', N, 'He wore it to every chemo appointment. Loose end.', 'shaming', 'You talk about him like inventory.'),
            ],
          },
          {
            id: 'b3', actor: T, action: 'claiming the inheritance', reactor: N, reaction: 'exposing his ignorance', intensity: 4,
            charges: { [VT]: -5, [VB]: -6 },
            lines: [
              line('l5', T, 'I know what it meant. I\'ll get it running again. Dad always said I had the hands.', 'claiming the inheritance', 'I was the gifted one. The favorite.'),
              act('a2', 'Nadia pops the caseback with her thumbnail and holds out the loupe.'),
              line('l6', N, 'Then tell me what\'s wrong with it.', 'testing him', 'You\'ve forgotten everything he taught you. I haven\'t.'),
              line('l7', T, 'Mainspring?', 'bluffing', 'I have no idea.', 'peering, too fast'),
              line('l8', N, 'Balance staff. Broken since March.', 'exposing his ignorance', 'I was here. I know every part of him.', '', { exposition: true }),
            ],
          },
          {
            id: 'b4', actor: T, action: 'justifying his absence', reactor: N, reaction: 'ridiculing him', intensity: 5,
            charges: { [VT]: -6, [VB]: -7 },
            lines: [
              line('l9', T, 'I couldn\'t get away, could I? We were closing a round, forty people\'s salaries riding on me—', 'justifying', 'Please don\'t make me admit I chose myself.'),
              line('l10', N, 'Forty people. I had one. He called you "the one in the city," like a diagnosis.', 'ridiculing', 'He talked about you all the time, and every time it cut me.'),
            ],
          },
          {
            id: 'b5', actor: T, action: 'bargaining', reactor: N, reaction: 'unmasking him', intensity: 6,
            charges: { [VT]: -3, [VB]: -7 },
            lines: [
              line('l11', T, 'Okay. Here\'s the thing, strategically. You take the shop outright, all of it, I take the watch, and nobody ever has to do one of these nights again.', 'bargaining', 'I\'m desperate. I would trade anything.'),
              line('l12', N, 'The shop\'s worth forty of that watch.', 'calculating', 'Nobody makes a deal that bad unless they\'re drowning.', 'not looking up'),
              act('a3', 'She sets the loupe down.'),
              line('l13', N, 'Who\'s buying it?', 'unmasking him', 'You\'re selling it. You\'re broke.'),
            ],
          },
          {
            id: 'b6', actor: T, action: 'admitting half the truth', reactor: N, reaction: 'withholding comfort', intensity: 6,
            charges: { [VT]: -2, [VB]: -6 },
            lines: [
              line('l14', T, 'A collector in Geneva. Eleven thousand. The company\'s gone, Nadia. Since June.', 'admitting', 'I\'m a failure. Don\'t say you told me so.', '', { exposition: true }),
              act('a4', 'A long silence. Nadia wraps another cup.'),
              line('l15', N, 'June.', 'withholding comfort', 'You were drowning, and you still didn\'t come home.'),
            ],
          },
          {
            id: 'b7', actor: T, action: 'invoking Dad', reactor: N, reaction: 'guarding the gate', intensity: 8,
            charges: { [VT]: -4, [VB]: -8 },
            lines: [
              line('l16', T, 'He\'d want me to land on my feet. You know he would. He\'d want me to have it.', 'invoking Dad', 'Tell me he wanted me.'),
              line('l17', N, 'You don\'t get to tell me what he wanted.', 'guarding the gate', 'Because I know exactly what he wanted, and I took it from you.'),
              line('l18', T, 'Why? Because you were here? Because you emptied his bedpans, you get to keep his—', 'cornering her', 'You think suffering bought you his love. It didn\'t buy you mine.'),
            ],
          },
          {
            id: 'b8', actor: N, action: 'confessing', reactor: T, reaction: 'demanding the rest', intensity: 10,
            charges: { [VT]: 7, [VB]: -9 },
            lines: [
              line('l19', N, 'He asked for you.', 'confessing', 'I stole your goodbye.'),
              act('a5', 'Teo stops.'),
              line('l20', N, 'The last night. Four in the morning. He said your name twice. Lucid. I had your number in my hand.', 'confessing', 'Punish me. I\'ve been punishing myself.', '', { exposition: true }),
              line('l21', T, 'And?', 'demanding the rest', 'Say it.'),
              line('l22', N, 'And I sat with him until ten past four.', 'admitting', 'I wanted his last minutes for myself.'),
            ],
          },
          {
            id: 'b9', actor: N, action: 'paying penance', reactor: T, reaction: 'staying', intensity: 7,
            charges: { [VT]: 7, [VB]: -5 },
            lines: [
              act('a6', 'She snaps the caseback shut and sets the watch in his palm.'),
              line('l23', N, 'Sell it. Geneva.', 'paying penance', 'Take it. I owe you more than a watch.'),
              line('l24', T, 'Fix it first.', 'staying', 'I\'m not leaving yet. Teach me again.', 'setting it back on the bench, face down'),
            ],
          },
        ],
      },
      {
        id: 'scene_morning',
        title: 'Morning at the Shop',
        heading: 'INT. WATCH SHOP - EARLY MORNING',
        description: 'Teo missed his flight. Nadia finds him at the bench.',
        conflictType: 'minimal',
        participants: [
          { characterId: N, intention: 'To teach him the balance staff', subIntention: 'To be needed by him again' },
          { characterId: T, intention: 'To fix the watch himself', subIntention: 'To be forgiven without asking' },
        ],
        values: [{ id: 'val_m1', positive: 'belonging', negative: 'estrangement', opening: -5 }],
        thirdThing: 'The broken balance staff',
        beats: [],
      },
    ],
  });
}
