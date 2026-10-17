// Il progetto d'esempio in italiano ("Quello che ha lasciato"): la stessa
// storia originale di sample.js, con gli stessi id, scritta in italiano.

export function sampleProjectIt() {
  const N = 'char_nadia';
  const T = 'char_teo';
  const VT = 'val_truth';
  const VB = 'val_belong';

  const line = (id, speaker, text, tactic, subtext, paren = '', extra = {}) => ({ id, speaker, text, tactic, subtext, paren, ...extra });
  const act = (id, text) => ({ id, kind: 'action', text });

  return {
    id: 'proj_sample',
    lang: 'it',
    title: 'Quello che ha lasciato',
    logline: 'Due fratelli che non si parlano da anni dividono in una notte le cose del padre appena morto, e il suo orologio rotto diventa il campo di battaglia su chi dei due lui amasse.',
    medium: 'screen',
    genre: 'Dramma familiare',
    genreMode: 'realism',
    coreValue: { positive: 'appartenenza', negative: 'estraneità' },
    incitingIncident: 'Il padre, un orologiaio, muore. Il testamento divide la bottega a metà e non nomina il suo orologio.',
    mdq: 'Nadia e Teo ritroveranno la strada l\'uno verso l\'altra, o la morte del padre finirà ciò che i suoi favoritismi avevano cominciato?',
    characters: [
      {
        id: N,
        name: 'Nadia',
        slot: 0,
        role: 'Protagonista',
        logline: 'Una che accudisce tutti e scambia il controllo per amore.',
        characterization: {
          summary: 'Sbrigativa, competente, asciutta: infermiera in un hospice. La divisa sotto il cappotto invernale, liste in ogni tasca, non si siede mai.',
          biology: '41 anni. Mani forti, la schiena rovinata dal sollevare pazienti, quattro ore di sonno a notte.',
          upbringing: 'Figlia maggiore, cresciuta nell\'appartamento sopra la bottega di orologiaio del padre. La madre se n\'è andata quando lei aveva dodici anni; Teo l\'ha cresciuto lei.',
          education: 'Diploma da infermiera alle serali. Cresciuta al banco da lavoro: smonta un movimento anche al buio. Legge riviste mediche e gialli.',
          mentality: 'Sente tutto, non mostra niente. La rabbia le esce come efficienza.',
          values: 'Il dovere. Esserci. Rendersi utile. Disprezza chi "passa a trovare". Desidera essere scelta.',
        },
        trueCharacter: {
          core: 'Sotto pressione sceglie il controllo invece della verità: mentirebbe pur di tenere in ordine la storia della famiglia, e il suo posto in quella storia.',
          contradiction: 'In superficie, l\'infermiera che si annulla per gli altri; sotto, una donna che ha bisogno di essere necessaria e lo detesta.',
          mentality: 'dramatic',
        },
        spheres: {
          said: 'Fatti pratici: orari, dosaggi, cosa c\'è da fare e chi non l\'ha fatto.',
          unsaid: 'È furiosa perché Teo ha potuto andarsene e si è tenuto comunque l\'orgoglio di papà.',
          unsayable: 'Alla fine ha tenuto papà tutto per sé, per paura che si illuminasse per Teo come non aveva mai fatto per lei.',
        },
        desire: {
          incitingIncident: 'Papà muore; il testamento divide la bottega e tace sull\'orologio.',
          objectOfDesire: 'L\'orologio da polso di papà, del 1962, quello che portava ogni giorno.',
          superIntention: 'Essere riconosciuta come quella che lo ha amato abbastanza.',
          subconsciousDesire: 'Punire Teo per essersene andato, ed essere perdonata per non averlo chiamato.',
          motivation: 'Da quando aveva dodici anni si guadagna l\'amore rendendosi utile. Senza papà da accudire, non sa chi è.',
          excuse: '"Qualcuno doveva prendersi la responsabilità."',
          spine: 'Tenere il controllo dell\'eredità di papà e della sua versione della storia di famiglia.',
        },
        antagonism: {
          physical: { text: 'L\'appartamento va svuotato entro venerdì; lei non dorme.', level: 4 },
          social: { text: 'L\'avvocato dell\'eredità; le regole dell\'hospice che ha piegato.', level: 3 },
          personal: { text: 'Teo, che vuole l\'orologio; papà, che amava le promesse di Teo più del suo servizio.', level: 8 },
          inner: { text: 'Il senso di colpa per l\'ultima notte. Il bisogno di essere quella brava.', level: 9 },
        },
        relationships: [
          { id: 'rel_n1', targetId: T, label: 'Teo, il fratello che ha cresciuto', charge: -4, restraint: 'Non dirà che le è mancato. Non dirà che non l\'ha chiamato.' },
          { id: 'rel_n2', targetId: '', label: 'Papà (morto)', charge: 6, restraint: 'Non ammetterà che preferiva Teo.' },
        ],
        voice: {
          sliders: { rational: 25, reflective: 10, complexity: 15, vocabulary: 55, latinate: 15, figurative: 25, questions: 15, pace: 85, overstatement: 5, profanity: 10 },
          context: 80,
          knowledge: ['asse del bilanciere', 'molla di carica', 'fondello', 'lente', 'scappamento', 'morfina', 'lucido', 'cartella clinica', 'turno di notte'],
          modifiers: ['pulito', 'stabile', 'esatto', 'a posto'],
          signature: ['annotato', 'per la cronaca'],
          neverSays: ['fantastico', 'elaborare il lutto', 'percorso', 'sinceramente'],
          culture: ['la bottega', 'le repliche del Tenente Colombo', 'i santi del calendario', 'la sala pausa dell\'hospice'],
          modality: 'obligation',
          lineDesign: 'suspense',
          dialect: 'Asciutta, popolare. Lascia cadere il soggetto: "Trovato nel cassetto."',
          tics: 'Risponde alle domande con dei compiti. Piega e incarta mentre parla. Non si siede mai.',
        },
        secrets: [
          { id: 'sec_n1', text: 'L\'ultima notte papà ha chiesto di Teo. Lei non l\'ha chiamato.', dilemma: 'Se lo dice, Teo scopre che gli ha rubato l\'addio. Se tace, resta la carceriera di quella bugia e lascia credere a Teo che papà non l\'abbia mai cercato.' },
        ],
        facts: [
          { id: 'f_n1', text: 'Ha cresciuto Teo dopo che la madre se n\'è andata (lei aveva 12 anni, lui 6).', importance: 4 },
          { id: 'f_n2', text: 'Faceva le notti all\'hospice per poter accudire papà di giorno.', importance: 5 },
          { id: 'f_n3', text: 'Papà ha insegnato a tutti e due a riparare orologi; lei era più brava.', importance: 3 },
        ],
        samples: {
          ohmygod: 'Gesù, Maria e l\'infermiera di notte.',
          iloveyou: 'Ho lasciato accesa la luce del corridoio. Come sempre.',
          sentence: 'Mettilo in turno.',
          magicIf: 'Vendilo. Ginevra.',
        },
      },
      {
        id: T,
        name: 'Teo',
        slot: 1,
        role: 'Antagonista (il fratello rivale)',
        logline: 'Un venditore che si è venduto la storia che andarsene sia stata la scelta coraggiosa.',
        characterization: {
          summary: 'Affascinante, curato, sempre al telefono, una battuta per riempire ogni silenzio. Un cappotto su misura comprato con soldi presi in prestito.',
          biology: '35 anni. Fisico da corridore, insonne; le mani gli tremano quando non beve.',
          upbringing: 'Il più piccolo, adorato da papà come "quello sveglio". Cresciuto da Nadia dopo che la mamma se n\'è andata.',
          education: 'Due anni di economia; mollata per fondare un\'azienda. Podcast, libri di business, video di conferenze.',
          mentality: 'Ottimista in superficie, panico sotto. Evita il conflitto con il fascino.',
          values: 'Vincere, piacere, lo slancio. Disprezza le "vite piccole". Desidera ancora l\'approvazione di papà.',
        },
        trueCharacter: {
          core: 'Sotto pressione sceglie se stesso e lo chiama sincerità.',
          contradiction: 'L\'uomo sicuro che si è fatto da sé, sopra un nucleo senza un soldo e terrorizzato di essere ordinario.',
          mentality: 'dramatic',
        },
        spheres: {
          said: 'Grandi progetti, gergo da mercato, battute, complimenti.',
          unsaid: 'La sua azienda ha chiuso a giugno. È indietro di due mesi con l\'affitto e deve vendere l\'orologio.',
          unsayable: 'Se n\'è andato perché non sopportava di vedere papà appoggiarsi a Nadia. Crede di non essere mai stato necessario.',
        },
        desire: {
          incitingIncident: 'Papà muore, e il testamento non nomina l\'orologio.',
          objectOfDesire: 'L\'orologio, da vendere a un collezionista per coprire i debiti.',
          superIntention: 'Dimostrare che andarsene era giusto: che è lui il successo di cui papà si vantava.',
          subconsciousDesire: 'Sentirsi dire che è mancato.',
          motivation: 'L\'amore di papà gli è sempre sembrato legato alle promesse; fallire vorrebbe dire non esserne mai stato degno.',
          excuse: '"Papà vorrebbe che andasse a qualcuno che lo usa."',
          spine: 'Andarsene con l\'orologio, e con la sua storia intatta.',
        },
        antagonism: {
          physical: { text: 'Un volo alle sei del mattino. Le mani che tremano.', level: 3 },
          social: { text: 'Creditori, ex investitori, un padrone di casa.', level: 7 },
          personal: { text: 'Nadia, che controlla ogni cosa nell\'appartamento.', level: 8 },
          inner: { text: 'La vergogna del fallimento, travestita da ottimismo.', level: 7 },
        },
        relationships: [
          { id: 'rel_t1', targetId: N, label: 'Nadia, la sorella che l\'ha cresciuto', charge: -3, restraint: 'Non può ammettere il fallimento davanti a lei.' },
        ],
        voice: {
          sliders: { rational: 40, reflective: 30, complexity: 35, vocabulary: 65, latinate: 35, figurative: 15, questions: 55, pace: 55, overstatement: 25, profanity: 5 },
          context: 30,
          knowledge: ['valutazione', 'collezionista', 'liquidità', 'pivot', 'round', 'leva', 'stipendi'],
          modifiers: ['incredibile', 'praticamente', 'sinceramente', 'totalmente'],
          signature: ['sinceramente', 'il punto è questo'],
          neverSays: ['scusa', 'ho sbagliato'],
          culture: ['i podcast sulle startup', 'Il Padrino', 'la radio della bottega', 'le case d\'aste di Ginevra'],
          modality: 'possibility',
          lineDesign: 'cumulative',
          dialect: 'Disinvolto, aziendale. Il quartiere gli torna nelle vocali quando è messo all\'angolo.',
          tics: 'Riempie i silenzi di domande. Tocca il telefono come un rosario.',
        },
        secrets: [
          { id: 'sec_t1', text: 'La sua azienda ha chiuso a giugno. Non ha più un soldo e deve vendere l\'orologio.', dilemma: 'Se lo ammette, vince Nadia: è lui il fallito che lei aveva previsto. Se lo nasconde, se ne va senza l\'orologio e affonda.' },
        ],
        facts: [
          { id: 'f_t1', text: 'È partito per la città a 22 anni ed è tornato due volte in cinque anni.', importance: 4 },
          { id: 'f_t2', text: 'Un collezionista di Ginevra ha offerto 11.000 euro per l\'orologio.', importance: 3 },
        ],
        samples: {
          ohmygod: 'Okay. Okay. Wow. Okay.',
          iloveyou: 'Togli ancora la crosta al pane. Incredibile.',
          sentence: 'Sinceramente? Lasciamo decidere al mercato quanto vale.',
        },
      },
    ],
    scenes: [
      {
        id: 'scene_watch',
        title: 'L\'orologio',
        heading: 'INT. APPARTAMENTO SOPRA LA BOTTEGA DELL\'OROLOGIAIO - NOTTE',
        description: 'Scatoloni, giornali, un banco da lavoro sotto una lampada a collo d\'oca. Nadia incarta tazzine. Teo entra con un trolley e due caffè.',
        track: 'others',
        mode: 'dramatized',
        conflictType: 'balanced',
        participants: [
          { characterId: T, intention: 'Andarsene con l\'orologio', subIntention: 'Sentirsi dire che papà lo ha cercato', tactic: 'conquistandola con un accordo', antagonism: 'Nadia sorveglia ogni oggetto dell\'appartamento' },
          { characterId: N, intention: 'Far andare via Teo senza l\'orologio', subIntention: 'Fargli sentire quanto le è costato restare', tactic: 'controllando la stanza', antagonism: 'La pretesa di Teo sull\'orgoglio di papà, e il proprio segreto' },
        ],
        driver: T,
        values: [
          { id: VT, positive: 'verità', negative: 'menzogna', opening: -5 },
          { id: VB, positive: 'appartenenza', negative: 'estraneità', opening: -4 },
        ],
        thirdThing: 'L\'orologio da polso di papà, del 1962, fermo alle quattro e dieci.',
        exposition: [
          { id: 'e1', text: 'Nadia ha accudito papà da sola per due anni.', delivered: true },
          { id: 'e2', text: 'L\'azienda di Teo è fallita e a lui servono soldi.', delivered: true },
          { id: 'e3', text: 'Papà ha insegnato a tutti e due a riparare orologi.', delivered: true },
          { id: 'e4', text: 'L\'ultima notte papà ha chiesto di Teo.', delivered: true },
          { id: 'e5', text: 'La madre se n\'è andata quando erano bambini.', delivered: false },
        ],
        turningPoint: { type: 'revelation', note: 'Nadia rivela che papà ha chiesto di Teo, e lei non l\'ha chiamato. La verità diventa positiva mentre l\'appartenenza precipita: un climax ironico.' },
        beats: [
          {
            id: 'b1', actor: T, action: 'portando doni', reactor: N, reaction: 'rifiutando l\'offerta di pace', intensity: 2,
            charges: { [VT]: -5, [VB]: -4 },
            lines: [
              act('a1', 'Teo posa un caffè sul banco, accanto alla lampada a collo d\'oca. Nadia continua a incartare.'),
              line('l1', T, 'Latte d\'avena, due zuccheri. Lo prendi ancora così, o ti sei finalmente evoluta?', 'affascinando', 'Mi ricordo di te. Stanotte facciamo pace.', 'porgendole il bicchiere'),
              line('l2', N, 'Nero. Dal secondo anno di turni di notte.', 'correggendolo', 'Non mi conosci più, perché non c\'eri.'),
            ],
          },
          {
            id: 'b2', actor: T, action: 'pilotando il discorso verso l\'orologio', reactor: N, reaction: 'facendolo vergognare', intensity: 3,
            charges: { [VT]: -5, [VB]: -5 },
            lines: [
              line('l3', T, 'L\'avvocato dice che la bottega è metà e metà, il che è praticamente incredibile da parte sua, sinceramente. L\'unica cosa in sospeso è l\'orologio.', 'pilotando', 'L\'orologio è l\'unica cosa che vale soldi, e a me servono soldi.', 'scrutando il banco'),
              line('l4', N, 'Se lo metteva a ogni seduta di chemio. In sospeso.', 'facendolo vergognare', 'Parli di lui come di un inventario.'),
            ],
          },
          {
            id: 'b3', actor: T, action: 'rivendicando l\'eredità', reactor: N, reaction: 'smascherando la sua ignoranza', intensity: 4,
            charges: { [VT]: -5, [VB]: -6 },
            lines: [
              line('l5', T, 'Lo so cosa significava. Lo rimetto in moto io. Papà diceva sempre che avevo le mani giuste.', 'rivendicando l\'eredità', 'Ero io quello dotato. Il preferito.'),
              act('a2', 'Nadia fa saltare il fondello con l\'unghia del pollice e gli porge la lente.'),
              line('l6', N, 'Allora dimmi cos\'ha che non va.', 'mettendolo alla prova', 'Hai dimenticato tutto quello che ti ha insegnato. Io no.'),
              line('l7', T, 'La molla di carica?', 'bluffando', 'Non ne ho idea.', 'scrutando, troppo in fretta'),
              line('l8', N, 'L\'asse del bilanciere. Rotto da marzo.', 'smascherando la sua ignoranza', 'Io c\'ero. Conosco ogni pezzo di lui.', '', { exposition: true }),
            ],
          },
          {
            id: 'b4', actor: T, action: 'giustificando la sua assenza', reactor: N, reaction: 'ridicolizzandolo', intensity: 5,
            charges: { [VT]: -6, [VB]: -7 },
            lines: [
              line('l9', T, 'Non potevo venire via, no? Stavamo chiudendo un round, quaranta stipendi che dipendevano da me—', 'giustificandosi', 'Ti prego, non farmi ammettere che ho scelto me stesso.'),
              line('l10', N, 'Quaranta persone. Io ne avevo una. Ti chiamava "quello in città", come una diagnosi.', 'ridicolizzandolo', 'Parlava sempre di te, e ogni volta mi tagliava.'),
            ],
          },
          {
            id: 'b5', actor: T, action: 'contrattando', reactor: N, reaction: 'smascherandolo', intensity: 6,
            charges: { [VT]: -3, [VB]: -7 },
            lines: [
              line('l11', T, 'Okay. Il punto è questo, strategicamente. Tu ti prendi la bottega, tutta intera, io prendo l\'orologio, e nessuno deve mai più passare una notte così.', 'contrattando', 'Sono disperato. Scambierei qualsiasi cosa.'),
              line('l12', N, 'Con la bottega ci compri quaranta orologi così.', 'calcolando', 'Nessuno fa un affare così cattivo se non sta affogando.', 'senza alzare gli occhi'),
              act('a3', 'Posa la lente.'),
              line('l13', N, 'Chi lo compra?', 'smascherandolo', 'Lo stai vendendo. Non hai più un soldo.'),
            ],
          },
          {
            id: 'b6', actor: T, action: 'ammettendo mezza verità', reactor: N, reaction: 'negandogli conforto', intensity: 6,
            charges: { [VT]: -2, [VB]: -6 },
            lines: [
              line('l14', T, 'Un collezionista di Ginevra. Undicimila. L\'azienda non c\'è più, Nadia. Da giugno.', 'ammettendo', 'Sono un fallito. Non dire che me l\'avevi detto.', '', { exposition: true }),
              act('a4', 'Un lungo silenzio. Nadia incarta un\'altra tazzina.'),
              line('l15', N, 'Giugno.', 'negandogli conforto', 'Stavi affogando, e nemmeno così sei tornato a casa.'),
            ],
          },
          {
            id: 'b7', actor: T, action: 'invocando papà', reactor: N, reaction: 'sbarrando la porta', intensity: 8,
            charges: { [VT]: -4, [VB]: -8 },
            lines: [
              line('l16', T, 'Lui vorrebbe vedermi in piedi. Lo sai anche tu. Vorrebbe che lo avessi io.', 'invocando papà', 'Dimmi che mi voleva.'),
              line('l17', N, 'Non sei tu a dirmi cosa voleva lui.', 'sbarrando la porta', 'Perché io so esattamente cosa voleva, e te l\'ho tolto.'),
              line('l18', T, 'Perché? Perché eri qui? Perché gli svuotavi la padella, adesso ti tieni il suo—', 'mettendola all\'angolo', 'Credi che la sofferenza ti abbia comprato il suo amore. Il mio non te l\'ha comprato.'),
            ],
          },
          {
            id: 'b8', actor: N, action: 'confessando', reactor: T, reaction: 'pretendendo il resto', intensity: 10,
            charges: { [VT]: 7, [VB]: -9 },
            lines: [
              line('l19', N, 'Ha chiesto di te.', 'confessando', 'Ti ho rubato l\'addio.'),
              act('a5', 'Teo si ferma.'),
              line('l20', N, 'L\'ultima notte. Le quattro del mattino. Ha detto il tuo nome due volte. Lucido. Avevo il tuo numero in mano.', 'confessando', 'Puniscimi. Mi sto già punendo da sola.', '', { exposition: true }),
              line('l21', T, 'E?', 'pretendendo il resto', 'Dillo.'),
              line('l22', N, 'E sono rimasta con lui fino alle quattro e dieci.', 'ammettendo', 'Volevo i suoi ultimi minuti per me.'),
            ],
          },
          {
            id: 'b9', actor: N, action: 'facendo penitenza', reactor: T, reaction: 'restando', intensity: 7,
            charges: { [VT]: 7, [VB]: -5 },
            lines: [
              act('a6', 'Chiude di scatto il fondello e gli posa l\'orologio sul palmo.'),
              line('l23', N, 'Vendilo. Ginevra.', 'facendo penitenza', 'Prendilo. Ti devo più di un orologio.'),
              line('l24', T, 'Prima aggiustalo.', 'restando', 'Non me ne vado ancora. Insegnami di nuovo.', 'rimettendolo sul banco, a faccia in giù'),
            ],
          },
        ],
      },
      {
        id: 'scene_morning',
        title: 'Mattina in bottega',
        heading: 'INT. BOTTEGA DELL\'OROLOGIAIO - PRIMO MATTINO',
        description: 'Teo ha perso il volo. Nadia lo trova al banco.',
        conflictType: 'minimal',
        participants: [
          { characterId: N, intention: 'Insegnargli l\'asse del bilanciere', subIntention: 'Tornare a essergli necessaria' },
          { characterId: T, intention: 'Aggiustare l\'orologio da solo', subIntention: 'Essere perdonato senza chiederlo' },
        ],
        values: [{ id: 'val_m1', positive: 'appartenenza', negative: 'estraneità', opening: -5 }],
        thirdThing: 'L\'asse del bilanciere rotto',
        beats: [],
      },
    ],
  };
}
