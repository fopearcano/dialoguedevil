// Corpus etichettato di battute italiane con difetti (tutte originali),
// come test/fixtures/flawed-lines.js: misura quanto sfugge alle sole regole
// e al doppio controllo completo. `intensity` fissa la posta del beat.

export const FLAWED_LINES = [
  // Didascalico (Cap. 8)
  { text: 'Sento che tu non mi hai mai visto davvero, papà. Mai.', expect: ['onTheNose'] },
  { text: 'Mi fai sentire così felice, lo sai?', expect: ['onTheNose'] },
  { text: 'Sinceramente, sono distrutta per quello che ci hai fatto.', expect: ['onTheNose'] },
  { text: 'Tutto quello che voglio è che tu resti.', expect: ['onTheNose'] },
  { text: 'Ho solo bisogno che tu sappia che ti perdono.', expect: ['onTheNose'] },
  { text: 'Ho il terrore di perderti.', expect: ['onTheNose'] },
  { text: 'Lo dici solo perché ti senti in colpa.', expect: ['onTheNose'] },
  { text: 'Ti amo, ti amo.', expect: ['onTheNose'] },
  { text: 'Mi manchi così tanto che fa male.', expect: ['onTheNose', 'overlyEmotive'] },
  { text: "In fondo, credo di aver sempre avuto bisogno dell'approvazione di mio padre.", expect: ['onTheNose', 'overlyPerceptive'] },

  // Parole vuote / esposizione forzata (Cap. 2, 6)
  { text: 'Siamo colleghi in polizia da quindici anni, Raffaele.', expect: ['emptyTalk'] },
  { text: 'Da quando eravamo bambini, hai sempre preso le mie parti.', expect: ['emptyTalk'] },
  { text: 'Tuo fratello, Michele, il chirurgo, ha chiamato di nuovo.', expect: ['emptyTalk'] },
  { text: 'Come ti ho già detto, la riunione è a mezzogiorno.', expect: ['emptyTalk'] },
  { text: 'Ti ricordi quando la mamma ci portava al lago ogni estate?', expect: ['emptyTalk'] },
  { text: "Come sai, l'azienda l'ha fondata nostro nonno.", expect: ['emptyTalk'] },

  // Cliché (Cap. 7), anche flessi o con parole in mezzo
  { text: 'Bene, siamo di nuovo al punto di partenza.', expect: ['cliche'] },
  { text: 'Ha preso il toro per le corna e ha firmato.', expect: ['cliche'] },
  { text: 'Proviamo a pensare fuori dagli schemi, per una volta.', expect: ['cliche'] },
  { text: 'Alla fine della fiera, sono i soldi che parlano.', expect: ['cliche'] },
  { text: 'È la quiete prima della tempesta, ragazzo.', expect: ['cliche'] },
  { text: 'Ormai abbiamo toccato il fondo.', expect: ['cliche'] },

  // Linguaggio neutro (Cap. 7)
  { text: 'Oh. Mio. Dio.', expect: ['characterNeutral'] },
  { text: 'Ma stai scherzando?', expect: ['characterNeutral'] },
  { text: 'Dobbiamo proprio parlare.', expect: ['characterNeutral'] },
  { text: 'Non è come sembra, lo giuro.', expect: ['characterNeutral'] },

  // Chiacchiere (Cap. 7)
  { text: 'Ehi, tu. Come sta tua madre di questi tempi?', expect: ['clutter'] },
  { text: 'Che piacere vederti. Bel posto, qui.', expect: ['clutter'] },
  { text: 'Ciao, come stai?', expect: ['clutter'] },

  // Significato sfocato / linguaggio arido (Cap. 7, 9)
  { text: 'È una cosa grossa con un sacco di roba in mezzo, praticamente.', expect: ['blurred'] },
  { text: 'La situazione è complicata, emotivamente parlando, a un certo livello.', expect: ['blurred', 'arid'] },
  { text: 'Le sue mistificazioni costituiscono falsificazioni della fattualità.', expect: ['arid'] },
  { text: "Si è proceduto all'effettuazione delle verifiche relativamente alla problematica.", expect: ['arid'] },

  // Troppo lucido (Cap. 6)
  { text: 'Credo di allontanare le persone perché ho paura che se ne vadano.', expect: ['overlyPerceptive'] },
  { text: 'Non sono mai stata brava a lasciar entrare le persone. Sono fatta così.', expect: ['overlyPerceptive'] },
  { text: 'Il mio problema è che non mi sono mai fidato di nessuno.', expect: ['overlyPerceptive'] },

  // Melodramma / troppo emotivo in un beat a bassa posta (Cap. 6)
  { text: 'Mi hai ROVINATO la VITA!', intensity: 2, expect: ['melodrama', 'overlyEmotive'] },
  { text: 'Non ti perdonerò mai, mai, per questo, mai!', intensity: 2, expect: ['melodrama', 'overlyEmotive'] },
  { text: 'È il giorno peggiore e più umiliante di tutta la mia vita.', intensity: 1, expect: ['melodrama', 'overlyEmotive', 'onTheNose'] },

  // Forma passiva e attacchi sbagliati (Cap. 7, 9)
  { text: 'La decisione è stata presa dal consiglio.', expect: ['passive'] },
  { text: 'Ti ridò i soldi la settimana prossima, credo.', expect: ['mistimedCue'] },
  { text: 'Dammi le chiavi, se non ti dispiace.', expect: ['mistimedCue'] },
  { text: 'Dovremmo partire prima del temporale, a dire il vero.', expect: ['mistimedCue'] },
];

// Lo schema del Cap. 9, riscritto: la stessa richiesta e lo stesso rifiuto,
// tre volte, con parole diverse.
export const REPETITIOUS_EXCHANGE = [
  ['a', 'Devo parlarti.'],
  ['b', 'No. Lasciami stare.'],
  ['a', 'È davvero importante che tu mi ascolti.'],
  ['b', 'Vattene e basta.'],
  ['a', 'Devi starmi a sentire.'],
  ['b', 'Esci dalla mia stanza.'],
];

// Prima serie di verifica, scritta prima di tarare il pacchetto italiano.
// Misurata una volta (regole 38%, doppio controllo 75%), poi usata per
// correggere lacune generali: da allora non è più una verifica indipendente.
export const HELD_OUT_FLAWED = [
  { text: 'Mi sento così sola da quando te ne sei andato che non riesco a respirare.', expect: ['onTheNose'] },
  { text: 'Quello di cui ho davvero bisogno è che tu creda in me.', expect: ['onTheNose'] },
  { text: 'La verità è che sono sempre stata gelosa di te, da tutta la vita.', expect: ['onTheNose', 'emptyTalk'] },
  { text: 'Mi hai fatto sentire invisibile, ogni singolo giorno.', expect: ['onTheNose'] },
  { text: 'Senti, voglio solo che tu sia felice, va bene?', expect: ['onTheNose'] },
  { text: 'Lavoriamo insieme in questo studio da dodici anni, Diana.', expect: ['emptyTalk'] },
  { text: 'Come ti dicevo, tuo padre ci ha lasciato la casa.', expect: ['emptyTalk'] },
  { text: "Tua moglie, Linda, ha chiamato dall'ospedale dove fa l'infermiera.", expect: ['emptyTalk'] },
  { text: "Te lo ricordi l'estate che papà perse il lavoro? Non avevamo niente.", expect: ['emptyTalk'] },
  { text: 'Non tutto il male vien per nuocere, no?', expect: ['cliche'] },
  { text: 'Non piangere sul latte versato, tesoro.', expect: ['cliche'] },
  { text: 'Ha bruciato le tappe con la fusione.', expect: ['cliche'] },
  { text: 'Questa è la goccia che fa traboccare il vaso, Franco.', expect: ['cliche'] },
  { text: 'Ma che diavolo succede qui?', expect: ['characterNeutral'] },
  { text: 'Ascolta, posso spiegarti tutto.', expect: ['characterNeutral'] },
  { text: 'Salve a tutti. Che bella giornata, eh?', expect: ['clutter'] },
  { text: 'Come te la passi? È da secoli che non ci vediamo.', expect: ['clutter'] },
  { text: 'Ci sono un sacco di questioni e di fattori in tutta questa situazione.', expect: ['blurred'] },
  { text: 'Faccio fatica a fidarmi delle persone per come sono cresciuta.', expect: ['overlyPerceptive'] },
  { text: 'Ho sempre avuto paura di non essere abbastanza.', expect: ['overlyPerceptive', 'onTheNose'] },
  { text: 'La macchina è stata spinta nel lago da qualcuno.', expect: ['passive'] },
  { text: 'Passami a prendere alle otto, se ti va bene.', expect: ['mistimedCue'] },
  { text: 'Hai ROVINATO tutto! TUTTO!', intensity: 2, expect: ['melodrama', 'overlyEmotive'] },
  { text: "L'utilizzo delle risorse istituzionali necessita di un'autorizzazione preventiva.", expect: ['arid'] },
];

// Seconda serie di verifica, scritta dopo quelle correzioni e mai usata
// per tarare nulla.
export const HELD_OUT_2 = [
  { text: 'Mi sento tradita da tutti voi, capisci?', expect: ['onTheNose'] },
  { text: 'Non ti ho mai perdonato, e lo sai benissimo perché.', expect: ['onTheNose'] },
  { text: 'Sono innamorato di te da quando ti ho vista.', expect: ['onTheNose'] },
  { text: 'Voglio che tu capisca quanto mi hai ferito.', expect: ['onTheNose'] },
  { text: "Ho l'impressione che tu non mi ascolti mai.", expect: ['onTheNose'] },
  { text: 'Come ben sai, il notaio arriva alle nove.', expect: ['emptyTalk'] },
  { text: "Siamo sposati da vent'anni, Marta, vent'anni.", expect: ['emptyTalk'] },
  { text: "Tua sorella, Giulia, quella che fa l'avvocato, ti cerca.", expect: ['emptyTalk'] },
  { text: 'Ce la faremo, insieme, come sempre.', expect: ['cliche'] },
  { text: 'Ormai è acqua passata.', expect: ['cliche'] },
  { text: 'Mi è caduto il mondo addosso.', expect: ['cliche'] },
  { text: 'Ma che succede qui?', expect: ['characterNeutral'] },
  { text: 'Lasciami in pace, per favore.', expect: ['characterNeutral'] },
  { text: 'Buongiorno! Come andiamo oggi?', expect: ['clutter'] },
  { text: 'Questa faccenda è una questione delicata, in un certo senso.', expect: ['blurred', 'mistimedCue'] },
  { text: 'Ho sempre allontanato tutti perché avevo paura di soffrire.', expect: ['overlyPerceptive'] },
  { text: 'La lettera fu scritta da mia madre.', expect: ['passive'] },
  { text: 'Vieni domani alle dieci, se non ti dispiace.', expect: ['mistimedCue'] },
  { text: 'Non ce la faccio PIÙ! Basta!', intensity: 2, expect: ['melodrama', 'overlyEmotive'] },
  { text: 'Si rende necessaria una ridefinizione delle priorità organizzative.', expect: ['arid'] },
];

// Battute pulite, specifiche del personaggio: azione sotto le parole, niente
// dichiarato apertamente. Servono a contare i falsi allarmi.
export const CLEAN_LINES = [
  'Le chiavi sono sul gancio. Il solito gancio.',
  "Guidi ancora come se l'avessi rubata.",
  'Il tuo caffè. Due zollette, come un bambino.',
  'Siediti. La sedia non morde.',
  'Buffo. La mamma diceva lo stesso, poco prima di andarsene.',
  'Novanta euro per un taglio e guarda lì.',
  'Teneva gli scontrini. Uno per uno.',
  'Passami il sale.',
  'Ho fatto il giro lungo. Il ponte è chiuso.',
  'Il cane ti adora. Ha pessimi gusti.',
  'Rileggilo. Più piano.',
  'Ho portato la torta. Comprata. Non dirlo a nessuno.',
];
