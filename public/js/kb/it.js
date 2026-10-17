// Base di conoscenza di McKee, in italiano.
// Ogni principio è parafrasato da Robert McKee, "Dialogue: The Art of Verbal
// Action for Page, Stage, and Screen" (Twelve, 2016), con il rimando al
// capitolo. Le brevi citazioni sono tradotte liberamente dall'originale
// inglese. Stessa struttura e stessi id di kb/en.js.

import { citeFns } from './cite.js';

export const BOOK = {
  title: 'Dialogue: The Art of Verbal Action for Page, Stage, and Screen',
  author: 'Robert McKee',
  year: 2016,
  file: 'docs/Dialogue The Art of Verbal Action for Page, Stage, and Screen (Mckee, Robert).epub',
};

export const CHAPTERS = {
  pref: 'Prefazione: elogio del dialogo',
  1: 'La definizione completa di dialogo',
  2: 'Le tre funzioni del dialogo',
  3: 'Espressività I: il contenuto',
  4: 'Espressività II: la forma',
  5: 'Espressività III: la tecnica',
  tasks: 'Introduzione alla Parte II: i sei compiti del dialogo',
  6: 'Difetti di credibilità',
  7: 'Difetti di linguaggio',
  8: 'Difetti di contenuto',
  9: 'Difetti di struttura',
  10: 'Il dialogo specifico del personaggio',
  11: 'Quattro casi di studio',
  12: 'Storia, scena, dialogo',
  13: 'Il conflitto bilanciato',
  14: 'Il conflitto comico',
  15: 'Il conflitto asimmetrico',
  16: 'Il conflitto indiretto',
  17: 'Il conflitto riflessivo',
  18: 'Il conflitto minimo',
  19: 'Padroneggiare il mestiere',
};

export const { cite, shortCite } = citeFns(CHAPTERS, { ch: 'Cap.', tasks: 'Parte II', pref: 'Prefazione' });

// ---------------------------------------------------------------------------
// Definizioni di base
// ---------------------------------------------------------------------------

export const DEFINITION = {
  quote: 'Qualsiasi parola detta da qualsiasi personaggio a chiunque.',
  ch: 1,
  gloss:
    'Il dialogo è azione verbale. Dal greco dia- ("attraverso") e legein ("parlare"): un\'azione compiuta con le parole invece che con i fatti. Ogni battuta risponde a un bisogno, persegue uno scopo e compie un\'azione. Nessun personaggio parla mai, nemmeno a se stesso, senza motivo o per non fare nulla.',
};

export const THREE_TRACKS = [
  { id: 'others', name: 'Detto agli altri', ch: 1, desc: 'Duologo, trialogo, multilogo: lo scambio a due vie tra personaggi nelle scene.' },
  { id: 'self', name: 'Detto a se stessi', ch: 1, desc: 'Dialogo interiore. La mente si divide in due io in conflitto; a rigore ogni monologo è un dialogo.' },
  { id: 'audience', name: 'Detto al lettore / pubblico', ch: 1, desc: 'Soliloquio, a parte, voce fuori campo, sguardo in macchina, prosa in prima persona: il personaggio agisce sul pubblico.' },
];

export const DIALOGUE_MODES = [
  { id: 'dramatized', name: 'Drammatizzato', ch: 1, desc: 'Recitato dentro la scena: le battute rimbalzano tra personaggi in conflitto, ogni battuta un\'azione che provoca una reazione.' },
  { id: 'narratized', name: 'Narrativizzato', ch: 1, desc: 'Detto fuori dalla scena, al lettore, al pubblico o a se stessi. Resta un dialogo: chi narra vuole qualcosa da chi ascolta.' },
  { id: 'indirect', name: 'Indiretto', ch: [1, 4], desc: 'Una scena precedente descritta o parafrasata invece che recitata. Accelera il ritmo e protegge dalla banalità.' },
];

export const MEDIA = [
  { id: 'screen', name: 'Cinema', ch: [1, 4], balance: 'L\'immagine prima della voce', notes: ['Il pubblico guarda più di quanto ascolti.', 'Il dialogo per lo schermo deve sembrare spontaneo e restare recitabile: scrivi per l\'attore.', 'Il mezzo più conciso. La macchina da presa ingrandisce ogni battuta falsa.', 'Il silenzio invita la macchina da presa ad avvicinarsi.'] },
  { id: 'tv', name: 'Televisione', ch: [1, 4], balance: 'Voce e immagine in equilibrio', notes: ['Lo schermo piccolo spinge la macchina vicino ai volti, e allora è il volto a parlare.', 'I generi di famiglie, amici, amanti e luoghi di lavoro vivono di parole.', 'La parola costa meno da girare dell\'immagine.'] },
  { id: 'stage', name: 'Teatro', ch: [1, 4], balance: 'La voce prima dell\'immagine', notes: ['Il pubblico ascolta più di quanto guardi.', 'Il mezzo più ornato. Il patto del "come se" autorizza un linguaggio poetico e figurato.', 'Soliloquio e a parte narrativizzano il dialogo direttamente verso la sala.'] },
  { id: 'prose', name: 'Narrativa', ch: [1, 4, 5], balance: 'Un mezzo mentale', notes: ['Il mezzo più mutevole: scene drammatizzate, rivolgersi al lettore, dialogo indiretto e interiore, paralinguaggio.', 'I romanzieri tendono a mettere la lingua migliore nella narrazione e a tenere semplice il dialogo tra virgolette.', 'La narrazione in terza persona non è dialogo; solo i personaggi hanno una vera voce.'] },
];

// ---------------------------------------------------------------------------
// Le tre funzioni del dialogo (Cap. 2)
// ---------------------------------------------------------------------------

export const THREE_FUNCTIONS = [
  {
    id: 'exposition',
    name: 'Esposizione',
    ch: 2,
    desc: 'Trasmettere al lettore o al pubblico, che origlia, i fatti immaginari di ambientazione, passato e personaggi.',
    points: [
      'Ritmo e tempi: dai solo ciò di cui lo spettatore ha bisogno, quando ne ha bisogno e lo desidera. Elenca ogni fatto e ordinalo per importanza.',
      'Mostra, non dire: nelle scene drammatizzate il "dire" cancella il sottotesto e riduce il personaggio a portavoce dell\'autore.',
      'Spinta narrativa: le rivelazioni fanno sporgere il lettore in avanti, e i fatti passano inosservati.',
      'L\'esposizione come munizione: lascia che i personaggi usino ciò che sanno come arma nella lotta per ottenere ciò che vogliono.',
      'Rivelazioni: i fatti più importanti sono segreti. Un dilemma tra due mali li porta alla luce nei grandi punti di svolta.',
      'Nella narrazione il racconto diretto ha due virtù: velocità e contrappunto.',
    ],
  },
  {
    id: 'characterization',
    name: 'Caratterizzazione',
    ch: 2,
    desc: 'Una superficie distintiva per ogni ruolo, dietro la quale il vero carattere aspetta di rivelarsi nelle scelte sotto pressione.',
    points: [
      'Il vero carattere si rivela solo nelle scelte d\'azione rischiose compiute per ottenere ciò che si desidera (il principio della scelta).',
      'La caratterizzazione è la somma dei tratti di superficie. Incuriosisce, convince e rende unici.',
      'Il tratto più importante di tutti è il modo di parlare: parla come nessuno che abbiamo mai incontrato.',
    ],
  },
  {
    id: 'action',
    name: 'Azione',
    ch: 2,
    desc: 'Il dialogo fornisce ai personaggi i mezzi dell\'azione: mentale, fisica (gesti e compiti) e verbale.',
    points: [
      'Elizabeth Bowen: "Il dialogo è ciò che i personaggi si fanno l\'un l\'altro."',
      'Prima di scrivere una battuta chiediti: che cosa vuole il mio personaggio da questa situazione? Quale azione compirebbe in questo preciso momento? Con quali parole esatte?',
      'Dai un nome all\'azione del sottotesto con un gerundio attivo (-ando, -endo).',
    ],
  },
];

// ---------------------------------------------------------------------------
// Le tre sfere: il detto / il non detto / l'indicibile (Prefazione, Cap. 3)
// ---------------------------------------------------------------------------

export const SPHERES = [
  {
    id: 'said',
    name: 'Il detto',
    layer: 'Testo · caratterizzazione',
    ch: [3],
    desc: 'Le idee e le emozioni che il personaggio sceglie di esprimere agli altri, plasmate da lessico, dizione, sintassi, grammatica, tono, figure retoriche e accento.',
    prompt: 'Che cosa dice liberamente e apertamente questo personaggio di sé, degli altri e del mondo?',
  },
  {
    id: 'unsaid',
    name: 'Il non detto',
    layer: 'Sottotesto conscio',
    ch: [3],
    desc: 'Pensieri e sentimenti che il personaggio trattiene di proposito. Il lettore li intuisce attraverso le parole. Lo scrittore deve affilare il testo perché il non detto si percepisca.',
    prompt: 'Che cosa pensa e prova, sapendolo, ma tiene per sé?',
  },
  {
    id: 'unsayable',
    name: 'L\'indicibile',
    layer: 'Sottotesto inconscio',
    ch: [3],
    desc: 'Impulsi e bisogni inconsci che spingono alle scelte. Al di là delle parole, anche per il personaggio stesso; si esprimono solo nell\'azione sotto pressione.',
    prompt: 'Quale spinta muta e inconsapevole lo muove, qualcosa che non saprebbe dire a parole nemmeno a se stesso?',
  },
];

// ---------------------------------------------------------------------------
// Il complesso del conflitto (Cap. 4, Cap. 12)
// ---------------------------------------------------------------------------

export const CONFLICT_LEVELS = [
  { id: 'physical', name: 'Fisico', ch: [4, 12], desc: 'Il tempo, lo spazio e ogni oggetto del mondo naturale e artificiale: troppo poco tempo, troppa strada, la natura, il soprannaturale.', talk: 'pochissime parole' },
  { id: 'social', name: 'Sociale', ch: [4, 12], desc: 'Le istituzioni e chi le governa: stato, legge, religione, esercito, aziende, scuole, ospedali. Ogni istituzione è una piramide di potere.', talk: 'parole formali; discorsi quando il conflitto pubblico culmina' },
  { id: 'personal', name: 'Personale', ch: [4, 12], desc: 'I rapporti d\'intimità: amici, famiglia, amanti. L\'intimità nasce, cambia e finisce nelle parole.', talk: 'dialogo a più strati, a più significati' },
  { id: 'inner', name: 'Interiore', ch: [4, 12], desc: 'Forze contraddittorie nella mente, nel corpo e nelle emozioni di un personaggio: la memoria tradisce, il corpo cede, i sentimenti travolgono il buon senso.', talk: 'dialogo interiore, il più fitto sulla pagina' },
];

export const CONFLICT_RULE = {
  ch: 4,
  text: 'Più i conflitti di una storia sono fisici e sociali, meno dialogo; più sono personali e privati, più dialogo. Le storie complesse usano due, tre o tutti e quattro i livelli; una storia che lavora su un solo livello è complicata, non complessa.',
};

// ---------------------------------------------------------------------------
// I sei compiti del dialogo (introduzione alla Parte II)
// ---------------------------------------------------------------------------

export const SIX_TASKS = [
  { id: 'action', name: 'Azione interiore', ch: 'tasks', desc: 'Ogni espressione verbale compie un\'azione interiore.' },
  { id: 'progression', name: 'Progressione', ch: 'tasks', desc: 'Ogni beat di azione/reazione intensifica la scena, costruendo verso e attorno al suo punto di svolta.' },
  { id: 'exposition', name: 'Esposizione', ch: 'tasks', desc: 'Affermazioni e allusioni dentro le battute trasmettono l\'esposizione.' },
  { id: 'style', name: 'Stile verbale', ch: 'tasks', desc: 'Uno stile verbale unico caratterizza ogni ruolo.' },
  { id: 'drive', name: 'Spinta narrativa', ch: 'tasks', desc: 'Il flusso di beat in progressione porta il lettore o il pubblico su un\'onda di spinta narrativa.' },
  { id: 'credibility', name: 'Credibilità', ch: 'tasks', desc: 'Il linguaggio è autentico rispetto all\'ambiente e fedele al personaggio, e mantiene la fiducia nella realtà immaginaria.' },
];

// ---------------------------------------------------------------------------
// La tecnica (Cap. 5)
// ---------------------------------------------------------------------------

export const LINE_DESIGNS = [
  {
    id: 'suspense',
    name: 'Di suspense (periodica)',
    ch: [5, 9],
    desc: 'Trattiene la parola o la frase centrale fino alla fine. Il disegno più drammatico e più comico, e il migliore per dare l\'attacco all\'altro attore.',
    example: '"Se non volevi che lo facessi, perché mi hai dato quel ____?" (il senso aspetta l\'ultima parola)',
  },
  {
    id: 'cumulative',
    name: 'Cumulativa (sciolta)',
    ch: 5,
    desc: 'Prima l\'idea centrale, poi le frasi che la sviluppano. Colloquiale e spontanea, ma un discorso che finisce così tende a sbagliare l\'attacco.',
    example: '"L\'ho visto la sera che è partito, che sbatteva il bagagliaio, che bestemmiava contro la pioggia, con le chiavi tra i denti."',
  },
  {
    id: 'balanced',
    name: 'Bilanciata',
    ch: 5,
    desc: 'La parola centrale nel mezzo, con frasi subordinate ai lati. Scorrevole e naturale.',
    example: '"I debiti erano già abbastanza, ma è la bugia che non perdono, non dopo il funerale."',
  },
  {
    id: 'mixed',
    name: 'Mista',
    ch: 5,
    desc: 'Usare sempre un solo disegno lo trasforma in carta da parati. Alterna battute di suspense per la tensione a battute cumulative e bilanciate per la spontaneità.',
    example: '',
  },
];

export const TECHNIQUES = [
  { id: 'figurative', name: 'Linguaggio figurato', ch: 5, desc: 'Le figure risuonano nel non detto e nell\'indicibile. Più la figura è sensoriale, più l\'effetto è profondo e memorabile. La voce di una cantante è "acida", non "pessima".' },
  { id: 'paralanguage', name: 'Paralinguaggio', ch: 5, desc: 'Volto, gesto, postura, velocità, tono, volume, ritmo e prossemica. Sulla pagina si descrivono con linguaggio figurato; a teatro e sullo schermo si lascia spazio all\'attore.' },
  { id: 'economy', name: 'Economia', ch: 5, desc: 'Dire il massimo con il minor numero di parole. Non vuoto, ma economia. Togli le parole inutili.' },
  { id: 'pause', name: 'La pausa', ch: 5, desc: 'Una pausa prima di un punto di svolta comprime la tensione; dopo, lascia arrivare il senso. Abusata, perde effetto. La pausa va guadagnata.' },
  { id: 'silence', name: 'Elogio del silenzio', ch: 5, desc: 'Se la scena parla troppo, scrivi per l\'occhio: paralinguaggio e azione fisica. Il silenzio è l\'economia suprema del linguaggio.' },
];

// ---------------------------------------------------------------------------
// Componenti di storia e scena (Cap. 12)
// ---------------------------------------------------------------------------

export const DESIRE_COMPLEX = [
  { id: 'objectOfDesire', name: 'Oggetto del desiderio', ch: 12, desc: 'Ciò che il personaggio sente consapevolmente di dover avere per rimettere in equilibrio la vita dopo l\'incidente scatenante. Fisico, situazionale o ideale. Oggettivo.' },
  { id: 'superIntention', name: 'Super-obiettivo', ch: 12, desc: 'Il bisogno profondo e soggettivo che spinge la ricerca. L\'oggetto del desiderio riformulato come fame emotiva, per esempio "trovare la pace interiore attraverso un trionfo pubblico".' },
  { id: 'motivation', name: 'Motivazione', ch: [12, 6], desc: 'Perché ha bisogno di ciò di cui ha bisogno. Le radici spesso affondano nell\'infanzia e sono irrazionali. Non confonderla con una scusa.' },
  { id: 'sceneIntention', name: 'Obiettivo di scena', ch: 12, desc: 'Ciò che vuole adesso, in questa scena, come passo verso l\'oggetto del desiderio. Concediglielo e la scena finisce.' },
  { id: 'backgroundDesires', name: 'Desideri di sfondo', ch: 12, desc: 'Le relazioni che vuole mantenere stabili. Formano una rete di vincoli che limita ciò che dirà e non dirà. Un personaggio che non ha niente da perdere è capace di tutto.' },
];

export const FIVE_STEPS = [
  { id: 'desire', name: 'Desiderio', ch: 12, q: 'Che cosa vuole il personaggio adesso (obiettivo di scena), spinto da quale bisogno più profondo?' },
  { id: 'antagonism', name: 'Percezione dell\'antagonismo', ch: 12, q: 'Che cosa sente che lo blocca, a ragione o a torto?' },
  { id: 'choice', name: 'Scelta dell\'azione', ch: 12, q: 'Che cosa sceglie di fare per provocare una reazione che lo avvicini al suo obiettivo?' },
  { id: 'action', name: 'Azione', ch: 12, q: 'Dai un nome all\'azione con un gerundio. È verbale, fisica o entrambe?' },
  { id: 'expression', name: 'Espressione', ch: 12, q: 'Solo ora: le parole esatte (e i gesti) che compiono l\'azione.' },
];

export const STORY_VALUES = [
  ['vita', 'morte'], ['coraggio', 'viltà'], ['verità', 'menzogna'], ['senso', 'insensatezza'],
  ['maturità', 'immaturità'], ['speranza', 'disperazione'], ['giustizia', 'ingiustizia'], ['amore', 'odio'],
  ['lealtà', 'tradimento'], ['fiducia', 'sfiducia'], ['intimità', 'isolamento'], ['orgoglio', 'umiliazione'],
  ['potere', 'impotenza'], ['libertà', 'schiavitù'], ['sicurezza', 'pericolo'], ['consapevolezza', 'autoinganno'],
  ['appartenenza', 'estraneità'], ['passione', 'noia'], ['vittoria', 'sconfitta'], ['lucidità', 'follia'],
];

export const TURNING_POINT_TYPES = [
  { id: 'action', name: 'Azione', ch: 12, desc: 'Un gesto immediato e diretto fa girare il valore ("Me ne vado per sempre").' },
  { id: 'revelation', name: 'Rivelazione', ch: [12, 2], desc: 'Un segreto o un fatto ignoto viene alla luce ("Ti ho sposato per i soldi"). Le rivelazioni sul passato sono le svolte più potenti.' },
];

export const BEAT_DEFINITION = {
  ch: [9, 12],
  text: 'Un beat è un\'unità di azione/reazione. Un\'azione lo apre, la reazione corrispondente lo chiude. Dai un nome a entrambi i lati con un gerundio (insultando/scusandosi). Per quante volte si ripeta uno schema, resta un solo beat. I beat cambiano solo quando cambiano le tattiche, e ognuno deve superare il precedente.',
};

export const CONTEXT_CULTURE = {
  ch: 12,
  high: 'Ad alto contesto: relazionale, tradizionale, di gruppo; molte cose restano non dette. Il dialogo richiede estrema economia e parole precise. "Un\'offerta che non poteva rifiutare."',
  low: 'A basso contesto: varia, in rapido cambiamento; la gente si spiega a lungo. I personaggi diventano prolissi ed espliciti man mano che il sottotesto si assottiglia.',
};

// ---------------------------------------------------------------------------
// Tipi di conflitto (casi di studio, Cap. 13-18)
// ---------------------------------------------------------------------------

export const CONFLICT_TYPES = [
  {
    id: 'balanced', name: 'Conflitto bilanciato', ch: 13, example: 'I SOPRANO: Tony e la dottoressa Melfi',
    desc: 'Un duello combattuto tra pari. Ognuno spinge con un obiettivo di scena chiaro e tattiche che superano quelle dell\'altro.',
    tips: ['Contrapponi i contendenti per contenuto (domande contro affermazioni), lunghezza (chi perde il controllo accorcia parole e frasi) e ritmo (chi controlla il ritmo tende a vincere).', 'La ripetizione si può usare di proposito, a ondate, per far montare la rabbia.'],
  },
  {
    id: 'comic', name: 'Conflitto comico', ch: 14, example: 'FRASIER: Frasier e Niles',
    desc: 'Il conflitto bilanciato spinto a limiti folli. Il personaggio comico è rigido, posseduto da un unico "umore" e cieco a ogni scelta al di fuori di esso.',
    tips: ['La commedia chiede un\'esagerazione ad arte che ci permetta di giudicare il comportamento rispetto alla norma.', 'Una battuta è preparazione e risoluzione. La sua energia viene da emozioni difensive e aggressive e dal sesso.', 'Banalizza il sublime; esalta il banale.'],
  },
  {
    id: 'asymmetric', name: 'Conflitto asimmetrico', ch: 15, example: 'Un grappolo di sole (A Raisin in the Sun): Walter e Ruth',
    desc: 'L\'azione verbale aggressiva di un personaggio contro la resistenza silenziosa dell\'altro. Il lato più quieto può portare il peso morale della scena.',
    tips: ['Dai all\'aggressore le parole e a chi resiste i silenzi, i rifiuti e le piccole deviazioni ("Mangia le uova").'],
  },
  {
    id: 'indirect', name: 'Conflitto indiretto', ch: 16, example: 'Il grande Gatsby: Daisy e Tom',
    desc: 'I personaggi si manipolano con parole di antagonismo nascosto. L\'ostilità si nasconde nella cortesia, negli scherzi e nella recita pubblica.',
    tips: ['Lascia la reazione implicita, non descritta; il lettore la ricrea.', 'In narrativa bilancia il dialogo con la descrizione; anche il silenzio sulla pagina è una reazione.'],
  },
  {
    id: 'reflexive', name: 'Conflitto riflessivo', ch: 17, example: 'La signorina Else; Il museo dell\'innocenza',
    desc: 'L\'io contro l\'io. Dialogo interiore, narrativizzato, in cui il personaggio infligge il conflitto a se stesso e continua a rimestarne il veleno.',
    tips: ['Dividi il personaggio in più io che discutono.', 'Scrivi dentro il personaggio: diventa lui, e lascia che i suoi io si interrompano a vicenda.'],
  },
  {
    id: 'minimal', name: 'Conflitto minimo (implicito)', ch: 18, example: 'LOST IN TRANSLATION – L\'amore tradotto: Bob e Charlotte',
    desc: 'Il conflitto con il vuoto di ciò che la vita nega, giocato nell\'ombra del passato. Le parole più scarse esprimono il significato più grande.',
    tips: ['Meno è meglio: ogni parola che si può tagliare va tagliata.', 'Tieni il passato fuori scena e implicito; racconta le perdite con spirito ed economia.', 'Le micro-pause ("Be\'...", "Già...") aprono spazio al sottotesto.'],
  },
];

// ---------------------------------------------------------------------------
// Difetti e rimedi (Parte II, Cap. 6-9)
// ---------------------------------------------------------------------------

export const FLAWS = {
  emptyTalk: { name: 'Parole vuote', group: 'Credibility', ch: 6, why: 'I personaggi si dicono ciò che entrambi sanno già, così il pubblico non trova alcuna motivazione sotto la battuta.', fix: 'Trasforma il fatto in munizione: fa\' che un personaggio lo usi contro l\'altro per ottenere qualcosa.' },
  overlyEmotive: { name: 'Parole troppo emotive', group: 'Credibility', ch: 6, why: 'Un linguaggio molto più emotivo della reale posta in gioco fa sembrare il personaggio isterico o l\'autore disperato.', fix: 'Alza la motivazione all\'altezza dell\'espressione, oppure abbassa i toni. Poi chiediti: questo personaggio lo direbbe apertamente o lo smorzerebbe?' },
  overlyKnowing: { name: 'Parole troppo sapienti', group: 'Credibility', ch: 6, why: 'Il personaggio sa ciò che solo l\'autore potrebbe sapere.', fix: 'Sappi ciò che sanno i tuoi personaggi, e tieni le tue ricerche fuori dalle loro bocche.' },
  overlyPerceptive: { name: 'Parole troppo lucide', group: 'Credibility', ch: 6, why: 'Il personaggio si analizza più a fondo di Freud, Jung e Socrate messi insieme.', fix: 'Lascia l\'intuizione nel sottotesto. Fa\' che si giustifichi invece di spiegarsi.' },
  excuseAsMotivation: { name: 'Una scusa scambiata per motivazione', group: 'Credibility', ch: 6, why: 'Un trauma infantile incollato lì per spiegare un comportamento estremo è una scorciatoia psicologica, non una motivazione.', fix: 'Seppellisci la vera spinta (potere, amore, amor proprio...) nel sottotesto e dai al personaggio una giustificazione autoingannevole da dire.' },
  melodrama: { name: 'Melodramma', group: 'Credibility', ch: [6, 18], why: 'Il problema non è l\'eccesso di espressione ma il difetto di motivazione: il comportamento supera la posta in gioco.', fix: 'Porta la motivazione all\'altezza dell\'azione, poi decidi: sfuriata ("Spezzategli tutte le ossa...") o understatement ("Crocifiggetelo")?' },
  cliche: { name: 'Cliché', group: 'Language', ch: 7, why: 'Una frase che possiamo recitare prima che l\'attore la dica.', fix: 'Non accontentarti mai della prima scelta. Butta giù alternative, lasciati un po\' andare, tieni la migliore e taglia il resto.' },
  characterNeutral: { name: 'Linguaggio neutro', group: 'Language', ch: 7, why: 'Frasi generiche e già pronte ("Oh mio Dio!") tolgono al momento una scelta rivelatrice, propria del personaggio.', fix: 'Chiediti: se lo dicesse lei, e solo lei, come lo direbbe? Trova parole che non starebbero bene in nessun\'altra bocca.' },
  ostentatious: { name: 'Linguaggio ostentato', group: 'Language', ch: 7, why: 'La letterarietà compiaciuta richiama l\'attenzione sulla scrittura e spezza il patto di credibilità.', fix: 'Chiediti: se fossi il mio personaggio, in queste circostanze, che cosa direi? Nel dubbio, abbassa i toni.' },
  arid: { name: 'Linguaggio arido', group: 'Language', ch: 7, why: 'Parole secche, astratte e polisillabiche in frasi lunghe (nell\'originale: i latinismi inglesi). In italiano l\'equivalente sono le nominalizzazioni e il burocratese: "procedere all\'effettuazione" invece di "fare".', fix: 'Preferisci il concreto all\'astratto, il familiare all\'esotico, le parole brevi a quelle lunghe, le frasi dirette, la forma attiva, i discorsi brevi. A meno che non sia tipico del personaggio (un Boyd Crowder).' },
  passive: { name: 'Forma passiva', group: 'Language', ch: [7, 10], why: 'I verbi di stato frenano l\'avanzata in una tempesta di conflitto, come una nave che trascina l\'ancora.', fix: 'Prova la forma attiva: "Ci arriverà da solo", non "Non è molto sveglio".' },
  longSpeech: { name: 'Discorso lungo', group: 'Language', ch: 7, why: 'La quantità al posto della qualità; l\'interesse cala.', fix: 'Esprimi il massimo con le parole più poche e più vere. Dividilo in beat.' },
  clutter: { name: 'Chiacchiere', group: 'Language', ch: 7, why: 'I convenevoli ("Ciao, come va?") svuotano le scene e confondono il pubblico, che cerca un senso sotto ogni battuta.', fix: 'Se la battuta non lascia intuire pensieri e sentimenti non detti, arricchiscila o tagliala.' },
  onTheNose: { name: 'Didascalico (on-the-nose)', group: 'Content', ch: 8, why: 'Il personaggio dichiara apertamente i suoi pensieri più pieni e i sentimenti più profondi. Il sottotesto diventa testo e la scena diventa irrecitabile.', fix: 'Suggerisci invece di spiegare. Trova l\'azione sotto le parole e fa\' passare il conflitto attraverso una terza cosa.' },
  monologue: { name: 'La trappola del monologo', group: 'Content', ch: 8, why: 'Un lungo discorso ininterrotto e senza reazioni (circa 300 parole, o due minuti) trasforma il personaggio in un portavoce.', fix: 'Dividilo in beat di azione/reazione: intreccia le reazioni di chi ascolta e le reazioni interiori di chi parla.' },
  duelogue: { name: 'Duelogo', group: 'Content', ch: 8, why: 'Due personaggi parlano in modo diretto, esplicito ed emotivo del loro problema immediato, e non resta nulla di non detto.', fix: 'Fanne un trialogo: incanala lo scontro attraverso una terza cosa (un oggetto, una persona, un\'icona culturale, un\'idea).' },
  echo: { name: 'Eco involontaria', group: 'Design', ch: 9, why: 'Parole ripetute che l\'occhio salta ma l\'orecchio sente.', fix: 'Leggi la scena ad alta voce e registrala; taglia o riscrivi le eco.' },
  repetitiousBeats: { name: 'Beat ripetitivi', group: 'Design', ch: 9, why: 'La stessa azione/reazione, o la stessa carica di valore, beat dopo beat con parole diverse. La scena muore.', fix: 'Cambia tattica. Ogni beat deve superare il precedente. Scrivi tutte le scelte e prendi la migliore.' },
  blurred: { name: 'Significato sfocato', group: 'Design', ch: [9, 10], why: 'Nomi e verbi generici puntellati da aggettivi e avverbi ("utilizzare con forza un chiodo grande").', fix: 'Nomina oggetti e azioni specifici: "Pianta un chiodone".' },
  mistimedCue: { name: 'Attacco sbagliato', group: 'Design', ch: 9, why: 'La parola chiave arriva presto e seguono parole di coda, così l\'altro attore deve trattenere la reazione.', fix: 'Chiudi ogni battuta sulla parola chiave. Taglia le code e i riempitivi finali.' },
  misshapenScene: { name: 'Scena deforme', group: 'Design', ch: 9, why: 'Il punto di svolta arriva troppo presto, troppo tardi o mai.', fix: 'Costruisci beat dopo beat verso e attorno al punto di svolta, al momento perfetto.' },
  splintered: { name: 'Scena scollata', group: 'Design', ch: 9, why: 'Intenzioni interiori e comportamento esteriore si scollano: battute scialbe su desideri forti, battute esagitate su desideri deboli, non sequitur, o desideri che non si incrociano mai.', fix: 'Ricostruisci dall\'interno: prima desideri, conflitto e tattiche, le parole per ultime.' },
  paraphrasing: { name: 'La trappola della parafrasi', group: 'Design', ch: [9, 12], why: 'Riformulare all\'infinito battute difettose le rende sempre più didascaliche.', fix: 'I problemi di dialogo sono problemi di storia. Correggi l\'evento e il disegno dei personaggi, non le parole.' },
  noSubtext: { name: 'Battuta senza azione', group: 'Content', ch: [3, 2], why: 'Nessuna battuta è finita finché non hai risposto: nel sottotesto di questa attività verbale, quale azione compie davvero il personaggio?', fix: 'Dai un nome alla tattica con un gerundio e scrivi il sottotesto.' },
  sameVoice: { name: 'I personaggi parlano uguale', group: 'Language', ch: [10, 2], why: 'Quando scrivi di getto, tutti i personaggi suonano allo stesso modo.', fix: 'Ricava ogni voce dal suo sapere (nomi e verbi), dalla sua personalità (modificatori e modali) e dalla sua cultura.' },
  noReaction: { name: 'Reazione mancante', group: 'Design', ch: [9, 12], why: 'Un beat è un\'azione e una reazione; qui un lato agisce e nulla risponde.', fix: 'Scrivi la reazione: una battuta, uno sguardo, un silenzio, un gesto.' },
  tableRead: { name: 'Segnalata a orecchio', group: 'Writer', ch: [13, 15, 19], why: 'Hai segnalato questa battuta ascoltando la scena letta ad alta voce.', fix: 'Recitala. Riscrivila finché non suona come una frase spontanea, fedele al personaggio.' },
};

// Id dei difetti che il revisore AI può segnalare (escluse le segnalazioni dello scrittore).
export const REVIEWABLE_FLAWS = Object.keys(FLAWS).filter((k) => FLAWS[k].group !== 'Writer');

// ---------------------------------------------------------------------------
// Tendenze nella scelta delle parole (Cap. 7)
// ---------------------------------------------------------------------------

export const WORD_CHOICE_OBSERVATIONS = [
  'Più ci si emoziona, più le parole e le frasi si accorciano; più si ragiona, più si allungano.',
  'Più si è attivi e diretti, più si è brevi; più si è passivi e riflessivi, più ci si allunga.',
  'Più la persona è intelligente, più le frasi sono complesse.',
  'Più la persona ha letto, più ampio il vocabolario e più lunghe le parole.',
];

export const PREFERENCES = [
  'Preferisci il concreto all\'astratto',
  'Preferisci il familiare all\'esotico',
  'Preferisci le parole brevi a quelle lunghe',
  'Preferisci le frasi dirette ai giri di parole',
  'Preferisci la forma attiva a quella passiva',
  'Preferisci i discorsi brevi a quelli lunghi',
  'Preferisci il linguaggio espressivo all\'imitazione',
  'Elimina le chiacchiere',
];

// ---------------------------------------------------------------------------
// Il dialogo specifico del personaggio (Cap. 10)
// ---------------------------------------------------------------------------

export const CHARACTER_SPECIFIC = {
  ch: 10,
  principle: 'Nomi e verbi esprimono la vita intellettuale di un personaggio e l\'ampiezza del suo sapere. I modificatori (aggettivi, avverbi, forma, modalità) esprimono la sua vita emotiva e la sua personalità.',
  knowledge: 'Nomi e verbi generici suggeriscono ignoranza ("un chiodo grande", "si mosse lentamente"). Quelli specifici suggeriscono una mente superiore ("chiodone", "ciondolò").',
  personality: [
    { id: 'adjectives', name: 'Aggettivi', ex: 'fuochi d\'artificio "grandi" o "stupefacenti"' },
    { id: 'adverbs', name: 'Avverbi', ex: '"velocemente" o "ferocemente"' },
    { id: 'voice', name: 'Forma (attiva / passiva)', ex: '"La famiglia ha organizzato il matrimonio" o "Il matrimonio è stato organizzato dalla famiglia"' },
    { id: 'modals', name: 'Modali', ex: '"potremmo organizzarlo" (possibilità) o "va organizzato" (obbligo)' },
  ],
  culture: 'La cultura (popolare o colta) è la nostra fonte principale di conoscenza, insieme alle immagini della natura, delle città, dei luoghi di lavoro, dei riti, dei sogni e delle fantasie. È uno scrigno di immagini e di terze cose per un dialogo inconfondibile.',
  limitation: 'Il limite creativo: più la tecnica è difficile, più l\'impresa è brillante. L\'immagine prima della lingua. Tieni in mente il quadro vivido, poi cerca le parole.',
};

export const MODALITIES = [
  { id: 'possibility', name: 'Possibilità', words: 'potrei · potrebbe · forse · magari', desc: 'Vive tra opzioni e cautele.' },
  { id: 'ability', name: 'Capacità', words: 'posso · riesco · sono capace', desc: 'Misura la vita in base a ciò che sa fare.' },
  { id: 'obligation', name: 'Obbligo', words: 'devo · dovrei · bisogna · tocca', desc: 'Vive di regole, dovere e giudizio.' },
  { id: 'volition', name: 'Volontà', words: 'voglio · vorrei · farò', desc: 'Afferma intenzione e volontà.' },
];

export const MENTALITIES = [
  { id: 'dramatic', name: 'Drammatica', ch: 14, desc: 'Persegue il desiderio con una certa consapevolezza. Sa fare un passo indietro e pensare "così mi faccio ammazzare".' },
  { id: 'comic', name: 'Comica', ch: 14, desc: 'Rigidità mentale. Insegue un "umore" che lo assorbe tutto, come cieco a ogni altra scelta.' },
];

// ---------------------------------------------------------------------------
// Dimensioni della voce: i cursori che compongono l'impronta verbale. Ogni
// polo ha il suo capitolo; `metric` è la misura che l'analisi ricava dalle
// battute reali del personaggio.
// ---------------------------------------------------------------------------

export const VOICE_DIMENSIONS = [
  { id: 'rational', short: 'Razionale', label: 'Emotivo ↔ Razionale', lo: 'Emotivo', hi: 'Razionale', ch: 7, metric: 'rational', hint: 'L\'emozione accorcia parole e frasi; la ragione le allunga.' },
  { id: 'reflective', short: 'Riflessivo', label: 'Attivo ↔ Riflessivo', lo: 'Attivo / diretto', hi: 'Passivo / riflessivo', ch: 7, metric: 'reflective', hint: 'Le persone attive e dirette usano parole brevi e verbi d\'azione; quelle riflessive usano verbi di stato.' },
  { id: 'complexity', short: 'Complesso', label: 'Complessità delle frasi', lo: 'Semplici', hi: 'Complesse', ch: 7, metric: 'complexity', hint: 'Più la persona è intelligente, più le frasi sono complesse.' },
  { id: 'vocabulary', short: 'Lessico', label: 'Ampiezza del lessico', lo: 'Ristretto', hi: 'Ampio', ch: [7, 10], metric: 'vocabulary', hint: 'Chi ha letto molto ha un vocabolario più ampio e parole più lunghe.' },
  { id: 'latinate', short: 'Astratto', label: 'Concreto ↔ Astratto', lo: 'Breve, concreto', hi: 'Astratto, polisillabico', ch: 7, metric: 'latinate', hint: 'Nell\'originale: parole anglosassoni brevi contro latinismi. In italiano: "fare" contro "effettuare", "problema" contro "problematica". L\'astratto è la lingua del potere e della pretesa.' },
  { id: 'figurative', short: 'Figurato', label: 'Letterale ↔ Figurato', lo: 'Letterale', hi: 'Ricco di immagini', ch: [5, 10], metric: 'figurative', hint: 'Le figure sensoriali risuonano nel sottotesto. I personaggi estremi meritano un linguaggio ricco di immagini.' },
  { id: 'questions', short: 'Domande', label: 'Affermazioni ↔ Domande', lo: 'Afferma', hi: 'Domanda', ch: 13, metric: 'questions', hint: 'Metà delle battute di Tony Soprano sono domande; la dottoressa Melfi fa affermazioni.' },
  { id: 'pace', short: 'Incalzante', label: 'Disteso ↔ Incalzante', lo: 'Battute lunghe e lente', hi: 'Battute brevi e rapide', ch: 13, metric: 'pace', hint: 'Chi controlla il ritmo tende a vincere la scena.' },
  { id: 'overstatement', short: 'Enfatico', label: 'Smorza ↔ Enfatizza', lo: 'Smorza', hi: 'Enfatizza', ch: 6, metric: 'overstatement', hint: '"Crocifiggetelo" (potere) contro la sfuriata urlata (debolezza).' },
  { id: 'profanity', short: 'Volgare', label: 'Pulito ↔ Volgare', lo: 'Pulito', hi: 'Volgare', ch: 9, metric: 'profanity', hint: 'In certi mondi le parolacce calzano come un abito di seta, ma non salvano mai una scena tiepida. Un gangster silenzioso è un gangster letale.' },
];

export const SUBTEXT_DIMENSION = { id: 'context', label: 'Basso ↔ Alto contesto', lo: 'Spiega tutto', hi: 'Sottintende tutto', ch: 12 };

// ---------------------------------------------------------------------------
// Schema del profilo (guida i moduli, la completezza e il coach AI)
// ---------------------------------------------------------------------------

export const CHARACTER_SECTIONS = [
  {
    id: 'identity', name: 'Identità', ch: [2, 12],
    fields: [
      { path: 'name', label: 'Nome', type: 'text' },
      { path: 'role', label: 'Ruolo nella storia', type: 'text', placeholder: 'Protagonista, antagonista, confidente, spalla…' },
      { path: 'logline', label: 'Metafora in una riga', type: 'textarea', placeholder: 'I personaggi sono metafore della natura umana (Prefazione). Di che cosa è metafora questo?' },
    ],
  },
  {
    id: 'characterization', name: 'Caratterizzazione: la maschera', ch: 2,
    blurb: 'Chi sembra essere il personaggio: la somma dei tratti di superficie che incuriosiscono, convincono e rendono unici.',
    fields: [
      { path: 'characterization.summary', label: 'Apparenza (chi sembra essere)', type: 'textarea' },
      { path: 'characterization.biology', label: 'Biologia e fisicità', type: 'textarea', placeholder: 'Età, genere, corpo, salute, energia…' },
      { path: 'characterization.upbringing', label: 'Crescita e famiglia', type: 'textarea' },
      { path: 'characterization.education', label: 'Istruzione ed esperienza', type: 'textarea' },
      { path: 'characterization.mentality', label: 'Mentalità ed emotività', type: 'textarea' },
      { path: 'characterization.values', label: 'Atteggiamenti, valori e gusti', type: 'textarea' },
    ],
  },
  {
    id: 'trueCharacter', name: 'Il vero carattere: il nucleo', ch: [2, 3],
    blurb: 'Chi è davvero il personaggio, rivelato solo da scelte rischiose sotto pressione.',
    fields: [
      { path: 'trueCharacter.core', label: 'Identità profonda sotto pressione', type: 'textarea', placeholder: 'Messo con le spalle al muro, che cosa sceglie, e che cosa rivela quella scelta?' },
      { path: 'trueCharacter.contradiction', label: 'Contraddizione di fondo (maschera contro nucleo)', type: 'textarea', placeholder: 'es. una facciata prudente sopra un nucleo attratto dal rischio' },
      { path: 'trueCharacter.mentality', label: 'Mentalità', type: 'select', options: MENTALITIES.map((m) => [m.id, m.name]) },
      { path: 'trueCharacter.humor', label: '"Umore" comico (se comico)', type: 'text', placeholder: 'L\'unica ossessione che trascina tutte le sue forze in una direzione', when: (c) => c.trueCharacter?.mentality === 'comic' },
    ],
  },
  {
    id: 'spheres', name: 'Le tre sfere', ch: [3, 'pref'],
    blurb: 'Un io dentro un io dentro un io.',
    fields: [
      { path: 'spheres.said', label: 'Il detto', type: 'textarea', placeholder: SPHERES[0].prompt },
      { path: 'spheres.unsaid', label: 'Il non detto', type: 'textarea', placeholder: SPHERES[1].prompt },
      { path: 'spheres.unsayable', label: 'L\'indicibile', type: 'textarea', placeholder: SPHERES[2].prompt },
    ],
  },
  {
    id: 'desire', name: 'Il complesso del desiderio', ch: [12, 6],
    blurb: 'Il desiderio è una figura in cinque dimensioni.',
    fields: [
      { path: 'desire.incitingIncident', label: 'Incidente scatenante (per questo personaggio)', type: 'textarea' },
      { path: 'desire.objectOfDesire', label: 'Oggetto del desiderio (ciò che vuole consapevolmente)', type: 'textarea' },
      { path: 'desire.superIntention', label: 'Super-obiettivo (bisogno profondo)', type: 'textarea' },
      { path: 'desire.subconsciousDesire', label: 'Desiderio inconscio (se lo contraddice)', type: 'textarea' },
      { path: 'desire.motivation', label: 'Motivazione (perché)', type: 'textarea' },
      { path: 'desire.excuse', label: 'Scusa / autogiustificazione', type: 'textarea', placeholder: 'Ciò che racconta a sé e agli altri al posto della vera spinta (Cap. 6)' },
      { path: 'desire.spine', label: 'Spina dorsale dell\'azione', type: 'textarea' },
    ],
  },
  {
    id: 'antagonism', name: 'Forze antagoniste', ch: [12, 4],
    blurb: 'Opposizione da uno o da tutti e quattro i livelli di conflitto.',
    fields: CONFLICT_LEVELS.map((l) => ({ path: `antagonism.${l.id}.text`, label: `Conflitto ${l.name.toLowerCase()}`, type: 'textarea', placeholder: l.desc })),
  },
  {
    id: 'voice', name: 'Voce', ch: [10, 7, 5, 12, 13],
    blurb: 'Il sapere nei nomi e nei verbi; la personalità nei modificatori e nei modali; le immagini dalla cultura.',
    fields: [
      { path: 'voice.knowledge', label: 'Sapere: nomi e verbi specifici', type: 'list', placeholder: 'chiodone, ciondolare, milligrammo…' },
      { path: 'voice.modifiers', label: 'Personalità: aggettivi e avverbi preferiti', type: 'list' },
      { path: 'voice.signature', label: 'Parole ed espressioni tipiche', type: 'list' },
      { path: 'voice.neverSays', label: 'Parole che non userebbe mai', type: 'list' },
      { path: 'voice.culture', label: 'Scrigno culturale (immagini, icone, terze cose)', type: 'list' },
      { path: 'voice.modality', label: 'Modalità dominante', type: 'select', options: MODALITIES.map((m) => [m.id, `${m.name} (${m.words})`]) },
      { path: 'voice.lineDesign', label: 'Disegno naturale della battuta', type: 'select', options: LINE_DESIGNS.map((d) => [d.id, d.name]) },
      { path: 'voice.dialect', label: 'Accento, dialetto, registro', type: 'text' },
      { path: 'voice.tics', label: 'Abitudini verbali e paralinguaggio', type: 'textarea', placeholder: 'Riempitivi ("Be\'…"), interruzioni, gesti, prossemica…' },
    ],
  },
  {
    id: 'secrets', name: 'Segreti ed esposizione', ch: 2,
    blurb: 'Il passato non è una biografia ma l\'estratto di eventi passati, di solito segreti, che spingono avanti la storia.',
    fields: [],
  },
];

// ---------------------------------------------------------------------------
// L'intervistatore: un mazzo di domande dialogico e offline. Ogni domanda
// riempie un campo del profilo. Dall'esterno (la maschera) all'interno
// (l'indicibile), poi la voce.
// ---------------------------------------------------------------------------

export const INTERVIEW = [
  { id: 'q-role', path: 'role', ch: 12, ask: 'Cominciamo dalla superficie. Che ruolo ha {name} nella storia: protagonista, antagonista, confidente, spalla?' },
  { id: 'q-mask', path: 'characterization.summary', ch: 2, ask: 'Chi sembra essere {name}? Descrivi la maschera: che cosa noterebbe uno sconosciuto nei primi cinque minuti?' },
  { id: 'q-bio', path: 'characterization.biology', ch: 2, ask: 'Biologia e fisicità: età, corpo, salute, energia. Che cosa ha ricevuto {name} alla nascita che decide come attraversa una stanza?' },
  { id: 'q-up', path: 'characterization.upbringing', ch: [2, 10], ask: 'Dove e come è cresciuto {name}? Famiglia, classe sociale, luogo. Sono le fonti del vocabolario assorbito.' },
  { id: 'q-edu', path: 'characterization.education', ch: [7, 10], ask: 'Istruzione ed esperienza: che cosa ha letto, studiato, che lavori ha fatto {name}? (Chi ha letto molto ha un vocabolario più ampio e parole più lunghe, Cap. 7.)' },
  { id: 'q-values', path: 'characterization.values', ch: 2, ask: 'Che cosa apprezza, disprezza e desidera {name}? Gusti, atteggiamenti, idee politiche, piaceri proibiti.' },
  { id: 'q-inciting', path: 'desire.incitingIncident', ch: 12, ask: 'Quale evento sbilancia la vita di {name}?' },
  { id: 'q-object', path: 'desire.objectOfDesire', ch: 12, ask: 'Per ritrovare l\'equilibrio, che cosa sente {name}, consapevolmente, di dover avere? Dai un nome all\'oggetto del desiderio: fisico, situazionale o ideale.' },
  { id: 'q-super', path: 'desire.superIntention', ch: 12, ask: 'Riformula quel volere come un bisogno. Quale fame emotiva muove la ricerca? ("Trovare la pace interiore attraverso un trionfo pubblico.")' },
  { id: 'q-subcon', path: 'desire.subconsciousDesire', ch: [12, 19], ask: 'Guarda nel sottotesto. {name} vuole anche qualcosa che non può ammettere, qualcosa che va contro il desiderio conscio? È il peggior nemico di se stesso?' },
  { id: 'q-motive', path: 'desire.motivation', ch: 12, ask: 'Perché {name} ha bisogno di ciò di cui ha bisogno? Segui le radici fin dove vuoi; spesso sono irrazionali.' },
  { id: 'q-excuse', path: 'desire.excuse', ch: 6, ask: 'Ora la versione di copertura. Quale scusa o giustificazione dà {name} del proprio comportamento, al posto della vera motivazione? (Riccardo III dice di non poter "fare l\'amante", poi seduce Anna nella scena successiva.)' },
  { id: 'q-spine', path: 'desire.spine', ch: 12, ask: 'In una frase, qual è la spina dorsale dell\'azione di {name}, la ricerca implacabile che scorre sotto ogni scena?' },
  { id: 'q-phys', path: 'antagonism.physical.text', ch: 12, ask: 'Antagonismo fisico: che cosa, nel tempo, nello spazio, nella natura o nel corpo, si oppone a {name}?' },
  { id: 'q-soc', path: 'antagonism.social.text', ch: 12, ask: 'Antagonismo sociale: quali istituzioni o piramidi di potere ostacolano {name}?' },
  { id: 'q-pers', path: 'antagonism.personal.text', ch: 12, ask: 'Antagonismo personale: quale amico, amante o familiare si mette di traverso?' },
  { id: 'q-inner', path: 'antagonism.inner.text', ch: 12, ask: 'Antagonismo interiore: come tradiscono {name} la sua mente, il suo corpo o i suoi sentimenti?' },
  { id: 'q-said', path: 'spheres.said', ch: 3, ask: 'Il detto: che cosa racconta liberamente {name} di sé e del mondo?' },
  { id: 'q-unsaid', path: 'spheres.unsaid', ch: 3, ask: 'Il non detto: che cosa pensa e prova {name}, sapendolo, ma nasconde agli altri?' },
  { id: 'q-unsayable', path: 'spheres.unsayable', ch: 3, ask: 'L\'indicibile: quale spinta inconscia muove {name}, qualcosa che non saprebbe dire a parole nemmeno a se stesso?' },
  { id: 'q-core', path: 'trueCharacter.core', ch: [2, 3], ask: 'Metti {name} nell\'angolo peggiore della storia. Che cosa sceglie? Che cosa rivela quella scelta che la maschera nasconde?' },
  { id: 'q-contra', path: 'trueCharacter.contradiction', ch: 13, ask: 'Dai un nome alla contraddizione di fondo tra caratterizzazione e vero carattere (la dottoressa Melfi: facciata prudente, nucleo attratto dal rischio).' },
  { id: 'q-knowledge', path: 'voice.knowledge', ch: 10, ask: 'Che cosa sa {name} meglio di chiunque altro nella stanza? Elenca nomi e verbi specifici di quel sapere (non "un chiodo grande" ma "chiodone", "piantare").', list: true },
  { id: 'q-mods', path: 'voice.modifiers', ch: 10, ask: 'Quali aggettivi e avverbi usa {name}? Fuochi d\'artificio "grandi" o "stupefacenti"? Una moto che va "veloce" o "ferocemente"?', list: true },
  { id: 'q-modal', path: 'voice.modality', ch: 10, ask: 'In quale modalità vive {name}: possibilità (potrei, forse), capacità (posso), obbligo (devo, dovrei) o volontà (voglio)? Scegline una.', choice: MODALITIES.map((m) => m.id) },
  { id: 'q-culture', path: 'voice.culture', ch: 10, ask: 'Quale cultura ha riempito la testa di {name}: film, canzoni, sport, testi sacri, mestieri, paesaggi? Diventeranno immagini e terze cose.', list: true },
  { id: 'q-neutral', path: 'samples.ohmygod', ch: 7, ask: 'Prova di voce. Sotto shock, {name} invoca Dio. Come lo direbbe, e solo questo personaggio? (Non "Oh mio Dio!")' },
  { id: 'q-iloveyou', path: 'samples.iloveyou', ch: 8, ask: 'Prova di voce. {name} ama qualcuno. Senza le parole "ti amo", che cosa dice?' },
  { id: 'q-understate', path: 'samples.sentence', ch: 6, ask: 'Prova di voce. {name} ha in pugno un nemico e deve emettere la sentenza. Una sfuriata, o un sussurro come "Crocifiggetelo"? Scrivi la battuta.' },
  { id: 'q-secret', path: 'secrets.0.text', ch: 2, ask: 'Quale segreto nasconde {name}, agli altri o a se stesso?' },
  { id: 'q-dilemma', path: 'secrets.0.dilemma', ch: 2, ask: 'Quale dilemma tra due mali farebbe uscire quel segreto? ("Se lo dico perdo X; se non lo dico succede qualcosa di peggio.")' },
  { id: 'q-magic', path: 'samples.magicIf', ch: 19, ask: 'Il "se" magico. Non "che cosa farebbe {name}?" e nemmeno "che cosa farei io?", ma "Se io fossi {name} nel momento peggiore della storia, che cosa farei? Che cosa direi?" Scrivi la battuta.' },
];

// ---------------------------------------------------------------------------
// Esercizi di voce (il laboratorio "Dillo a modo suo")
// ---------------------------------------------------------------------------

export const VOICE_EXERCISES = [
  { id: 'ohmygod', title: 'Lo shock senza "Oh mio Dio"', ch: 7, prompt: 'Davanti ai suoi occhi succede qualcosa di terribile. Come invoca Dio (o il diavolo), con parole che non starebbero in nessun\'altra bocca?' },
  { id: 'iloveyou', title: 'L\'amore non detto', ch: 8, prompt: 'Dichiara amore senza dire "ti amo". Trova l\'azione sotto le parole: riaccendere? lasciare con delicatezza?' },
  { id: 'sentence', title: 'Dirlo o smorzarlo', ch: 6, prompt: 'Ha il potere assoluto su un nemico. Emette la sentenza. Una sfuriata, o "Crocifiggetelo"?' },
  { id: 'sour', title: 'La figura sensoriale', ch: 5, prompt: 'Descrivi la voce di un cattivo cantante con un\'immagine sensoriale ("acida", non "pessima").' },
  { id: 'saunter', title: 'Il verbo specifico', ch: 10, prompt: 'Qualcuno che disprezza ha appena attraversato la stanza. Descrivi come, con un solo verbo specifico.' },
  { id: 'ammo', title: 'L\'esposizione come munizione', ch: 2, prompt: 'Durante una lite, usa come arma un fatto condiviso del passato (da quanto vi conoscete, dove vi siete incontrati).' },
  { id: 'third', title: 'Attraverso una terza cosa', ch: 8, prompt: 'Attacca un rivale senza nominare il problema. Fallo passare attraverso un oggetto, una persona o un\'icona culturale.' },
  { id: 'refuse', title: 'Il rifiuto', ch: 15, prompt: 'Rifiuta una richiesta disperata senza dire "no".' },
  { id: 'magicIf', title: 'Il "se" magico', ch: 19, prompt: 'Se io fossi questo personaggio nel momento peggiore della storia, che cosa direi?' },
];

// ---------------------------------------------------------------------------
// Tattiche al gerundio: il vocabolario dell'azione verbale (Cap. 2, 3, 12-18)
// ---------------------------------------------------------------------------

export const TACTICS = {
  Avvicinare: ['invitando', 'affascinando', 'lusingando', 'complimentandosi', 'seducendo', 'consolando', 'confortando', 'rassicurando', 'solidarizzando', 'confidandosi', 'confessando', 'scusandosi', 'unendosi', 'festeggiando', 'appoggiando', 'incoraggiando', 'ringraziando'],
  Persuadere: ['supplicando', 'implorando', 'contrattando', 'corrompendo', 'tentando', 'vendendo', 'promettendo', 'ragionando', 'impietosendo', 'colpevolizzando', 'dimostrando il proprio valore', 'facendo una proposta', 'reclutando'],
  Attaccare: ['accusando', 'incolpando', 'mettendo all\'angolo', 'minacciando', 'interrogando', 'ridicolizzando', 'sminuendo', 'insultando', 'umiliando', 'deridendo', 'sfidando', 'provocando', 'denunciando', 'punendo', 'facendo la predica', 'correggendo', 'mettendo a nudo'],
  Difendersi: ['deviando', 'temporeggiando', 'prendendo tempo', 'evitando', 'negando', 'mentendo', 'nascondendo', 'cambiando argomento', 'buttandola sul ridere', 'giustificandosi', 'proclamandosi innocente', 'facendo il finto tonto', 'facendo muro', 'liquidando', 'snobbando'],
  Manovrare: ['mettendo alla prova', 'sondando', 'lanciando l\'esca', 'manipolando', 'pilotando', 'ordinando', 'negoziando', 'ingannando', 'fingendo interesse', 'facendo la vittima', 'mettendosi in mostra', 'atteggiandosi', 'tendendo una trappola', 'offrendo una via d\'uscita', 'avvertendo'],
  Cedere: ['arrendendosi', 'cedendo', 'concedendo', 'sottomettendosi', 'blandendo', 'indietreggiando', 'chiudendosi', 'ritirandosi in silenzio', 'rassegnandosi', 'perdonando'],
  Rivelare: ['rivelando', 'mettendo di fronte alla verità', 'smascherando', 'ammettendo', 'nominando il non detto', 'predicendo'],
};

export const ALL_TACTICS = Object.values(TACTICS).flat();

// ---------------------------------------------------------------------------
// Le domande chiave (Cap. 19): falle a ogni beat, tre volte per scena.
// ---------------------------------------------------------------------------

export const KEY_QUESTIONS = [
  { id: 'background', name: 'Desideri di sfondo', q: 'Quali relazioni circondano il personaggio? Come limitano le sue scelte d\'azione e il suo linguaggio? Che cosa non può fare o dire, almeno non ancora?' },
  { id: 'object', name: 'Oggetti del desiderio', q: 'Che cosa si racconta di volere per rimettere in equilibrio la vita? C\'è un desiderio inconscio? Si contraddicono?' },
  { id: 'super', name: 'Super-obiettivo', q: 'Quale bisogno lo spinge lungo la spina dorsale dell\'azione? È il peggior nemico di se stesso?' },
  { id: 'scene', name: 'Obiettivi di scena', q: 'Che cosa sembra volere adesso? Che cosa vuole davvero? È un passo verso il super-obiettivo?' },
  { id: 'motivation', name: 'Motivazione', q: 'Perché vuole ciò che vuole?' },
  { id: 'driver', name: 'Motore della scena', q: 'Chi guida questa scena e la fa accadere?' },
  { id: 'antagonism', name: 'Forze antagoniste', q: 'Da dove viene il conflitto: dall\'interno, dagli altri personaggi, dall\'ambiente?' },
  { id: 'values', name: 'Valori della scena', q: 'Quale valore è in gioco? Qual è la sua carica d\'apertura? E quella di chiusura?' },
  { id: 'subtext', name: 'Sottotesto', q: 'Sotto ciò che sembra fare, che cosa sta facendo davvero? Quali tattiche potrebbe usare?' },
  { id: 'beats', name: 'Beat', q: 'Quale azione compie nel sottotesto di ogni battuta? Quali reazioni può provocare? Questa battuta è un\'azione o una reazione?' },
  { id: 'progression', name: 'Progressione', q: 'I beat si superano l\'uno con l\'altro, in crescendo?' },
  { id: 'tactics', name: 'Tattiche', q: 'Con queste parole, dette così, quale tattica precisa sta usando? Quale effetto cerca di ottenere?' },
  { id: 'turning', name: 'Punto di svolta', q: 'Dove cambia il valore fino alla sua carica finale, esattamente in quale beat?' },
  { id: 'deep', name: 'Carattere profondo', q: 'Come rivelano la verità dei personaggi le scelte di questa scena?' },
  { id: 'sceneprog', name: 'Progressione della scena', q: 'Come fa avanzare la storia questa scena?' },
  { id: 'text', name: 'Testo', q: 'All\'esterno, che cosa direbbe per ottenere ciò che vuole?' },
  { id: 'exposition', name: 'Esposizione', q: 'Quali fatti porta questa battuta? Drammatizzati in modo invisibile o narrativizzati? Troppo presto, troppo tardi o al momento giusto?' },
  { id: 'characterization', name: 'Caratterizzazione', q: 'Gli stili verbali corrispondono alla personalità, al passato e ai tratti di ciascun personaggio?' },
];

export const MASTERING = [
  { id: 'listen', name: 'Ascolta', ch: 19, desc: 'Ascolta su due livelli, testo e sottotesto: ciò che le persone dicono contro ciò che fanno. Nota come le persone usano le parole per nascondere le loro azioni.' },
  { id: 'read', name: 'Leggi il buono, riscrivi il cattivo', ch: 19, desc: 'Leggi e guarda grandi dialoghi. Quando incontri un brutto dialogo, riscrivilo: è il modo più rapido per allenare il talento.' },
  { id: 'incharacter', name: 'Scrivi dentro il personaggio', ch: 19, desc: 'Sii il primo attore del tuo personaggio. Lavora dall\'interno verso l\'esterno, poi reimmagina dall\'esterno verso l\'interno. Recitalo, come faceva Dickens davanti allo specchio.' },
  { id: 'magicif', name: 'Il "se" magico', ch: 19, desc: 'Non "che cosa farebbe il mio personaggio?" e nemmeno "che cosa farei io?", ma "Se io fossi il mio personaggio in questa situazione, che cosa farei?"' },
  { id: 'questions', name: 'Fai domande', ch: 19, desc: 'La creatività non è imparare le risposte giuste ma porsi le domande più forti.' },
];

export const AXIOMS = [
  { text: 'I problemi di dialogo sono problemi di storia.', ch: [4, 9] },
  { text: 'Dialogo: qualsiasi parola detta da qualsiasi personaggio a chiunque.', ch: 1 },
  { text: 'Dire qualcosa è fare qualcosa.', ch: 1 },
  { text: 'Il desiderio è la fonte dell\'azione, e l\'azione è la fonte del dialogo.', ch: 12 },
  { text: 'Il dialogo concentra il significato; la conversazione lo diluisce.', ch: 6 },
  { text: 'Una scena non dovrebbe mai parlare, apertamente e del tutto, di ciò di cui sembra parlare.', ch: 8 },
  { text: 'Il silenzio è l\'economia suprema del linguaggio.', ch: 5 },
  { text: 'Non esistono pause gratuite: una pausa va guadagnata.', ch: 5 },
  { text: 'La voce non è una scelta; è un risultato.', ch: 10 },
  { text: 'Se nulla cambia, nulla accade.', ch: 9 },
  { text: 'Non copiare la vita, esprimila.', ch: 7 },
  { text: 'La creatività è fare scelte.', ch: 5 },
];
