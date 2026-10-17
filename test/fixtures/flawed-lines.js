// A labeled corpus of flawed lines (all original), each tagged with the flaw
// families that count as "caught". Used to measure misses: rules alone vs.
// the full double-check. `intensity` sets the beat's stakes where it matters.

export const FLAWED_LINES = [
  // On-the-nose (Ch. 8)
  { text: 'I feel like you never really saw me, Dad. Not once.', expect: ['onTheNose'] },
  { text: 'You make me so happy, you know that?', expect: ['onTheNose'] },
  { text: "Honestly, I'm devastated that you'd do this to us.", expect: ['onTheNose'] },
  { text: 'All I want is for you to stay.', expect: ['onTheNose'] },
  { text: 'I just need you to know that I forgive you.', expect: ['onTheNose'] },
  { text: "I'm terrified of losing you.", expect: ['onTheNose'] },
  { text: "You're only saying that because you feel guilty.", expect: ['onTheNose'] },
  { text: 'I love you, I love you.', expect: ['onTheNose'] },
  { text: 'I miss you so much it hurts.', expect: ['onTheNose', 'overlyEmotive'] },
  { text: "Deep down, I think I've always needed my father's approval.", expect: ['onTheNose', 'overlyPerceptive'] },

  // Empty talk / forced exposition (Ch. 2, 6)
  { text: "We've been partners on the force for fifteen years, Ray.", expect: ['emptyTalk'] },
  { text: "Since we were kids, you've always taken my side.", expect: ['emptyTalk'] },
  { text: 'Your brother, Michael, the surgeon, called again.', expect: ['emptyTalk'] },
  { text: "As I said before, the meeting's at noon.", expect: ['emptyTalk'] },
  { text: 'Remember when Mom took us to the lake every summer?', expect: ['emptyTalk'] },
  { text: 'As you know, the company was founded by our grandfather.', expect: ['emptyTalk'] },

  // Clichés (Ch. 7), including inflected and padded variants
  { text: "You're barking up the wrong tree here.", expect: ['cliche'] },
  { text: "Well, we're back at square one.", expect: ['cliche'] },
  { text: 'She bit the bullet and signed the papers.', expect: ['cliche'] },
  { text: "Let's try to think outside of the box for once.", expect: ['cliche'] },
  { text: 'At the end of the day, money talks.', expect: ['cliche'] },
  { text: "It's the calm before the storm, kid.", expect: ['cliche'] },

  // Character-neutral language (Ch. 7)
  { text: 'Oh. My. God.', expect: ['characterNeutral'] },
  { text: 'Are you freaking kidding me?', expect: ['characterNeutral'] },
  { text: 'We really need to talk.', expect: ['characterNeutral'] },
  { text: "It's not what it looks like, I swear.", expect: ['characterNeutral'] },

  // Clutter (Ch. 7)
  { text: "Hey you. How's your mom doing these days?", expect: ['clutter'] },
  { text: 'Good to see you. Nice place you got here.', expect: ['clutter'] },
  { text: 'Hi, how are you?', expect: ['clutter'] },

  // Blurred meaning / arid language (Ch. 7, 9)
  { text: "It's a big thing with a lot of stuff going on, basically.", expect: ['blurred'] },
  { text: 'The situation is kind of complicated, emotionally speaking, on some level.', expect: ['blurred', 'arid'] },
  { text: 'His fabrications are falsifications of factuality.', expect: ['arid'] },

  // Overly perceptive (Ch. 6)
  { text: "I guess I push people away because I'm scared they'll leave.", expect: ['overlyPerceptive'] },
  { text: "I've never been good at letting people in. That's just who I am.", expect: ['overlyPerceptive'] },
  { text: "My problem is that I've never trusted anyone.", expect: ['overlyPerceptive'] },

  // Melodrama / overly emotive in a low-stakes beat (Ch. 6)
  { text: "You've DESTROYED my LIFE!", intensity: 2, expect: ['melodrama', 'overlyEmotive'] },
  { text: 'I will never, ever forgive you for this, never!', intensity: 2, expect: ['melodrama', 'overlyEmotive'] },
  { text: 'This is the worst, most humiliating day of my entire life.', intensity: 1, expect: ['melodrama', 'overlyEmotive', 'onTheNose'] },

  // Passive voice and mistimed cues (Ch. 7, 9)
  { text: 'The decision was made by the board.', expect: ['passive'] },
  { text: "I'll pay you back next week, I think.", expect: ['mistimedCue'] },
  { text: "Give me the keys, if you don't mind.", expect: ['mistimedCue'] },
  { text: "We should leave before the storm, to be honest.", expect: ['mistimedCue'] },
];

// McKee's Ch. 9 pattern, rewritten: the same request and the same refusal,
// three times, in different words. No two adjacent lines share a word.
export const REPETITIOUS_EXCHANGE = [
  ['a', 'I have to talk to you.'],
  ['b', 'No. Leave me alone.'],
  ['a', "It's really important that you listen."],
  ['b', 'Just go away.'],
  ['a', "You've got to hear me out."],
  ['b', 'Get out of my room.'],
];

// Held-out lines, written after the second reader was built and not used to
// tune it. They measure misses honestly.
export const HELD_OUT_FLAWED = [
  { text: "I'm so lonely since you left that I can barely breathe.", expect: ['onTheNose'] },
  { text: 'What I really need is for you to believe in me.', expect: ['onTheNose'] },
  { text: "Truth is, I've been jealous of you our whole lives.", expect: ['onTheNose', 'emptyTalk'] },
  { text: 'You made me feel invisible, every single day.', expect: ['onTheNose'] },
  { text: "Look, I just want you to be happy, okay?", expect: ['onTheNose'] },
  { text: 'We have worked together at this firm for twelve years, Diane.', expect: ['emptyTalk'] },
  { text: 'Like I said, your father left us the house.', expect: ['emptyTalk'] },
  { text: "Your wife, Linda, called from the hospital where she works as a nurse.", expect: ['emptyTalk'] },
  { text: "You remember the summer Dad lost his job? We had nothing.", expect: ['emptyTalk'] },
  { text: "Every cloud has a silver lining, right?", expect: ['cliche'] },
  { text: "Don't cry over the spilt milk, sweetheart.", expect: ['cliche'] },
  { text: "He jumped the gun on the merger.", expect: ['cliche'] },
  { text: "That's the last straw, Frank.", expect: ['cliche'] },
  { text: "What the hell is going on here?", expect: ['characterNeutral'] },
  { text: "Listen, I can explain everything.", expect: ['characterNeutral'] },
  { text: "Hello there. Lovely weather we're having.", expect: ['clutter'] },
  { text: "How have you been? It's been ages.", expect: ['clutter'] },
  { text: "There are a lot of issues and factors in this whole situation.", expect: ['blurred'] },
  { text: "I have a hard time trusting people because of how I grew up.", expect: ['overlyPerceptive'] },
  { text: "I've always been afraid that I'm not enough.", expect: ['overlyPerceptive', 'onTheNose'] },
  { text: 'The car was driven into the lake by someone.', expect: ['passive'] },
  { text: "Pick me up at eight, if that's okay.", expect: ['mistimedCue'] },
  { text: "You RUINED everything! EVERYTHING!", intensity: 2, expect: ['melodrama', 'overlyEmotive'] },
  { text: 'The utilization of institutional resources necessitates authorization.', expect: ['arid'] },
];

// Clean, character-specific lines in the McKee mold: action under the words,
// nothing stated outright. Used to count false alarms.
export const CLEAN_LINES = [
  'Keys are on the hook. Same hook.',
  'You still drive like you stole it.',
  'Your coffee. Two sugars, like a child.',
  'Sit. The chair won\'t bite.',
  'Funny. Mom said the same thing, right before she left.',
  'Ninety dollars for a haircut and it still looks like that.',
  'He kept the receipts. Every single one.',
  'Pass the salt.',
  'Took the long way. The bridge is out.',
  'The dog likes you. He has terrible judgment.',
  'Read it again. Slower.',
  'I brought pie. Store-bought. Don\'t tell anyone.',
];
