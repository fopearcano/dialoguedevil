// Italian language pack for the dialogue analysis: the same interface as
// lang/en.js, built for Italian: elisions (l'amore), accented letters,
// pro-drop first person (sono arrabbiata), gerunds in -ando/-endo, passive
// with venire/andare/essere stato, and bureaucratic Italian as the local
// form of McKee's "arid" Latinate diction.

const LETTERS = 'a-zà-öø-ÿ';
const lower = (s) => String(s || '').toLowerCase().replace(/’/g, "'");

// JavaScript's \b only knows ASCII letters, so "\bè" or "perché\b" never
// match. Patterns are written with \b and compiled with a letter-aware
// boundary instead.
const WORD = 'A-Za-zÀ-ÖØ-öø-ÿ0-9';
const B = `(?:(?<![${WORD}])(?=[${WORD}])|(?<=[${WORD}])(?![${WORD}]))`;
const re = (src, flags = 'i') => new RegExp(src.replace(/\\b/g, B), flags);

// ---------------------------------------------------------------------------
// Tokens, syllables, abstract ("arid") words
// ---------------------------------------------------------------------------

const STOPWORDS = new Set(`il lo la i gli le un uno una l' un' di a da in con su per tra fra del dello della dei degli delle dell' al allo
alla ai agli alle all' dal dallo dalla dai dagli dalle dall' nel nello nella nei negli nelle nell' sul sullo sulla sui sugli sulle sull' col
coi e ed o od ma però anche se perché che chi cui non né più meno molto poco tanto tutto tutti tutta tutte questo questa questi queste
quest' quello quella quelli quelle quel quell' io tu lui lei noi voi loro mi ti si ci vi ne me te sé mio mia miei mie tuo tua tuoi tue suo
sua suoi sue nostro nostra nostri nostre vostro vostra c' m' t' s' d' n' v' sono sei è siamo siete ero eri era eravamo erano sarò sarà sarei
sarebbe stato stata stati state essere avere ho hai ha abbiamo avete hanno avevo aveva avevano avrò avrà fare faccio fai fa facciamo
fanno fatto dire dico dici dice detto andare vado vai va andiamo vanno sì no oh ok okay beh boh mah eh già ecco qui qua lì là ora
adesso poi quando come dove cosa cose quanto quanta così solo proprio ancora sempre mai niente nulla qualcosa uno due po allora
insomma tipo cioè vabbè senti guarda sai so sa voglio vuoi vuole volevo dai ah sto stai sta stiamo stanno stare com' dov' cos' quindi
pure invece altro altra altri altre ogni ciò dopo prima bene male via ce se' sennò mica`.split(/\s+/));

// "l'amore" → "l'", "amore"; "po'" → "po"; "c'è" → "c'", "è".
function words(text) {
  return lower(text).match(new RegExp(`[${LETTERS}0-9]+(?:'(?=[${LETTERS}]))?`, 'g')) || [];
}

const VOWEL = /[aeiouàèéìíîòóùú]/;
const STRONG = /[aeoàèéòó]/g;

// Vowel groups; two strong vowels side by side are a hiatus ("te-a-tro").
function syllables(word) {
  const w = lower(word).replace(new RegExp(`[^${LETTERS}]`, 'g'), '');
  if (!w || !VOWEL.test(w)) return w ? 1 : 0;
  let n = 0;
  for (const g of w.match(/[aeiouàèéìíîòóùú]+/g) || []) n += Math.max(1, (g.match(STRONG) || []).length);
  return Math.max(1, n);
}

const ARID_SUFFIXES = ['zione', 'zioni', 'sione', 'sioni', 'mento', 'menti', 'ità', 'ismo', 'ismi', 'enza', 'enze', 'anza', 'anze', 'abile', 'abili', 'ibile', 'ibili', 'ativo', 'ativa', 'ativi', 'ative', 'itivo', 'itiva', 'izzare', 'izzato', 'izzata', 'istico', 'istica', 'istici', 'istiche', 'icità'];
const ARID_EXCEPTIONS = new Set(['momento', 'momenti', 'appartamento', 'appuntamento', 'complimento', 'complimenti', 'documento', 'documenti', 'pavimento', 'strumento', 'argomento', 'movimento', 'colazione', 'televisione', 'attenzione', 'occasione', 'incredibile', 'impossibile', 'possibile', 'terribile', 'orribile', 'stazione', 'canzone', 'canzoni', 'lezione', 'ragione', 'stagione', 'prigione', 'emozione', 'emozioni', 'pensione', 'divertimento', 'esperienza', 'speranza', 'distanza', 'stanza', 'partenza', 'pazienza', 'presenza', 'differenza', 'università', 'velocità', 'felicità', 'responsabile']);
// Burocratese: always arid, whatever the length.
const BUREAUCRATIC = new Set(`effettuare effettuato effettuata effettuati effettuate effettuazione procedere provvedere provvederò provvederemo usufruire
espletare ottemperare inerente inerenti suddetto suddetta suddetti predetto predetta pertanto qualora nonché altresì codesto codesta
summenzionato sopraccitato relativamente conseguentemente sostanzialmente fondamentalmente effettivamente indubbiamente problematica
problematiche tematica tematiche implementare implementato ottimizzare ottimizzato finalizzato finalizzata interfacciarsi criticità
tempistica tempistiche normativa normative eventualmente ottimale prioritario prioritaria strategico strategica strategicamente
valutazione valutazioni procedura procedure conformemente contestualmente`.split(/\s+/));

function isLatinate(word) {
  const w = lower(word);
  if (BUREAUCRATIC.has(w)) return true;
  if (w.length < 9 || ARID_EXCEPTIONS.has(w)) return false;
  if (syllables(w) < 4) return false;
  return ARID_SUFFIXES.some((s) => w.endsWith(s));
}

// ---------------------------------------------------------------------------
// Lexicons
// ---------------------------------------------------------------------------

const CLICHES = [
  'punto e a capo', 'siamo al punto di partenza', 'tornare al punto di partenza', 'di nuovo al punto di partenza', 'alla fine della fiera',
  'in fin dei conti', 'alla fin fine', 'meglio tardi che mai', "tra l'incudine e il martello", 'rompere il ghiaccio', 'la quiete prima della tempesta',
  'la calma prima della tempesta', 'chiaro come il sole', 'veniamo al dunque', 'andiamo dritti al punto', 'più facile a dirsi che a farsi',
  'non tutto il male vien per nuocere', 'sano come un pesce', "un cuore d'oro", 'appena in tempo', 'per il rotto della cuffia', "è quel che è",
  'ultimo ma non meno importante', 'dulcis in fundo', 'non lasciare nulla di intentato', 'vuotare il sacco', 'la luce in fondo al tunnel',
  "sbagliando s'impara", 'un ago in un pagliaio', 'solo il tempo lo dirà', 'il tempo lo dirà', 'fuori dagli schemi', 'pensare fuori dagli schemi',
  'sul mio cadavere', 'un gioco da ragazzi', 'il mare è pieno di pesci', 'leggere tra le righe', 'dormire come un ghiro', 'ho dormito come un sasso',
  'un passo alla volta', 'un giorno alla volta', "l'elefante nella stanza", "la punta dell'iceberg", 'il tempo guarisce ogni ferita',
  'il tempo guarisce tutte le ferite', 'troppo bello per essere vero', 'quando gli asini voleranno', 'senza ulteriori indugi',
  'vale tanto oro quanto pesa', 'si vive una volta sola', 'ora o mai più', 'meglio prevenire che curare', "chi la fa l'aspetti",
  'in amore e in guerra tutto è lecito', "non è tutto oro quel che luccica", 'un brivido lungo la schiena', 'il cuore in gola',
  'il cuore mi è saltato in gola', 'il momento della verità', 'ho un brutto presentimento', 'non siamo poi così diversi',
  'non finisce qui', 'troppo tranquillo', 'sto diventando troppo vecchio per queste cose', 'non morire, resta con me', 'resta con me',
  'abbiamo compagnia', 'è una trappola', 'coprimi', 'ti copro le spalle', 'il meglio dei due mondi', 'una benedizione sotto mentite spoglie',
  'oltre al danno la beffa', "menare il can per l'aia", 'fare le ore piccole', 'piangere sul latte versato', 'sfuggire di mano', 'tieni duro',
  'prendere due piccioni con una fava', 'non svegliare il can che dorme', 'perdere il treno', 'chi non risica non rosica', 'al settimo cielo',
  'una volta ogni morte di papa', 'datti una regolata', 'parli del diavolo', 'lupus in fabula', 'la goccia che fa traboccare il vaso',
  "l'ultima goccia", 'gettare la spugna', 'acqua passata', 'a conti fatti', "l'abito non fa il monaco", 'la tempesta perfetta',
  'scritto nel destino', 'come un bambino in un negozio di caramelle', 'e vissero felici e contenti', "c'era una volta",
  'il gioco non vale la candela', 'toccare il fondo', 'abbiamo toccato il fondo', 'mettere le mani avanti', 'fare buon viso a cattivo gioco',
  'non tirare troppo la corda', 'non c\'è due senza tre', 'chi dorme non piglia pesci', 'a mali estremi, estremi rimedi', 'il silenzio è d\'oro',
  'come se niente fosse', 'a tutti i costi', 'senza se e senza ma', 'in un batter d\'occhio', 'sul filo del rasoio', 'con le spalle al muro',
  'ognuno per la sua strada', 'cambiare le carte in tavola', 'mettere le carte in tavola', 'avere le mani legate', 'non è la fine del mondo',
  'tutto andrà bene', 'andrà tutto bene', 'ce la faremo', 'insieme ce la faremo', 'il toro per le corna',
  'bruciare le tappe', 'tirare le somme', 'fare il punto della situazione', 'dietro le quinte', 'a portata di mano', 'nero su bianco',
  'a occhi chiusi', 'col senno di poi', 'chi va piano va sano e va lontano', 'cadere dalle nuvole', 'fare orecchie da mercante',
  'piove sul bagnato', 'tutto fumo e niente arrosto', 'un diavolo per capello', 'sputare il rospo', 'farsi in quattro', 'essere al verde',
  "costare un occhio della testa", 'non avere peli sulla lingua', 'acqua in bocca', 'prendere lucciole per lanterne', 'rimanere di sasso',
  'restare di stucco', 'tagliare la corda', 'vedere i sorci verdi', 'con i piedi per terra', 'a braccia aperte', 'il cuore a pezzi',
  'il cuore spezzato', 'il primo giorno del resto della mia vita', 'ogni cosa a suo tempo', 'il tempo è denaro', 'chi trova un amico trova un tesoro',
  'la vita è una sola', 'ne è valsa la pena', 'il bello deve ancora venire', "come due gocce d'acqua", 'tra il dire e il fare',
  "c'è di mezzo il mare", 'piovere a catinelle', 'fare di tutta l\'erba un fascio', 'mettere il carro davanti ai buoi', 'avere la testa fra le nuvole',
];

const NEUTRAL_PHRASES = [
  'oh mio dio', 'dio mio', 'oddio', 'ma che diavolo', 'che diavolo', 'che cavolo', 'stai scherzando', 'mi prendi in giro', 'sei serio',
  'dobbiamo parlare', 'non è come sembra', 'posso spiegare', 'tu non capisci', 'non capisci', 'parlami', 'è complicato', 'che ci fai qui',
  'cosa ci fai qui', 'che succede', 'cosa sta succedendo', 'non so cosa dire', 'non ne hai idea', 'vattene', 'lasciami in pace',
  'lasciami stare', 'non ce la faccio più', 'cosa vuoi da me', 'che vuoi da me', 'come hai potuto', 'lascia che ti spieghi', 'hai ragione',
  'come vuoi', 'sto bene', 'va tutto bene', 'ce la caveremo', 'troveremo una soluzione', 'fidati di me', 'fidati', 'ascoltami',
  'non è questo il punto', 'sai una cosa', 'ho capito', 'cosa vorresti dire', 'che vuol dire', 'mi dispiace',
];

const PROFANITY = re(String.raw`\b(cazz[a-zà-ù]*|merd[a-zà-ù]*|stronz[a-zà-ù]*|vaffanculo|fanculo|puttan[a-zà-ù]*|troi[ae]|coglion[a-zà-ù]*|minchi[a-zà-ù]*|bastard[a-zà-ù]*|incazz[a-zà-ù]*|fottut[a-zà-ù]*|fottiti|dannat[oaie]|porca (?:miseria|puttana|vacca|troia))\b`, 'gi');

// --- Passive -----------------------------------------------------------------

const ESSERE = new Set(['è', 'sono', 'sei', 'siamo', 'siete', 'era', 'ero', 'eri', 'eravamo', 'eravate', 'erano', 'sarà', 'saranno', 'sarò', 'sarai', 'saremo', 'sarete', 'sarebbe', 'sarebbero', 'sarei', 'saresti', 'sia', 'siano', 'fosse', 'fossero', 'essere']);
const FU = new Set(['fu', 'furono', 'fui', 'fosti']);
const VENIRE = new Set(['viene', 'vengono', 'veniva', 'venivano', 'venne', 'vennero', 'verrà', 'verranno', 'verrebbe', 'verrebbero', 'venga', 'vengano', 'venisse', 'venissero', 'vengo', 'vieni']);
const ANDARE = new Set(['va', 'vanno', 'andava', 'andavano', 'andrà', 'andranno', 'andrebbe', 'andrebbero', 'vada', 'vadano']);
const IRREGULAR_PARTICIPLES = new Set(`fatto fatta fatti fatte detto detta detti dette scritto scritta scritti scritte preso presa presi prese messo messa messi
messe visto vista visti viste chiuso chiusa chiusi chiuse aperto aperta aperti aperte rotto rotta rotti rotte perso persa persi perse
letto letta letti lette vinto vinta vinti vinte speso spesa spesi spese ucciso uccisa uccisi uccise chiesto chiesta chiesti chieste
deciso decisa decisi decise diviso divisa divisi divise offeso offesa sospeso sospesa acceso accesa spento spenta spenti spente
venduto venduta tradotto tradotta prodotto prodotta distrutto distrutta distrutti distrutte costretto costretta scelto scelta
scelti scelte tolto tolta tolti tolte raccolto raccolta sepolto sepolta dipinto dipinta respinto respinta promesso promessa
permesso permessa concesso concessa espresso espressa compreso compresa ripreso ripresa sorpreso sorpresa difeso difesa
nascosto nascosta nascosti nascoste risolto risolta spinto spinta spinti spinte morso morsa reso resa resi rese appeso appesa escluso esclusa
incluso inclusa risposto proposto proposta imposto imposta esposto esposta condotto condotta ridotto ridotta sconfitto sconfitta trafitto
fritto assunto assunta sciolto sciolta svolto svolta coinvolto coinvolta rimosso rimossa mosso mossa commosso scosso scossa discusso
discussa espulso espulsa offerto offerta coperto coperta scoperto scoperta raggiunto raggiunta aggiunto aggiunta stretto stretta
distratto distratta attratto attratta sottratto sottratta protetto protetta corretto corretta diretto diretta eletto eletta
interrotto interrotta corrotto corrotta deriso derisa diviso visti accolto accolta travolto travolta sorretto sorretta`.split(/\s+/));
// Intransitive or adjectival participles: "è andato", "è morto" are not passive.
const NOT_PASSIVE = new Set(`andato andata andati andate arrivato arrivata arrivati arrivate partito partita partiti partite uscito uscita usciti uscite
entrato entrata entrati entrate tornato tornata tornati tornate rimasto rimasta rimasti rimaste stato stata stati state nato nata nati nate
morto morta morti morte successo successa diventato diventata diventati diventate caduto caduta caduti cadute venuto venuta venuti venute
cresciuto cresciuta piaciuto piaciuta sembrato sembrata mancato mancata passato passata finito finita finiti finite sparito sparita
scappato scappata salito salita sceso scesa corso corsa vissuto vissuta stanco stanca sposato sposata sposati fidanzato fidanzata
preoccupato preoccupata arrabbiato arrabbiata innamorato innamorata convinto convinta sicuro sicura contento contenta`.split(/\s+/));

const isParticiple = (w) => !!w && !NOT_PASSIVE.has(w) && (IRREGULAR_PARTICIPLES.has(w) || new RegExp(`^[${LETTERS}]{2,}(?:at|ut|it)[oaie]$`).test(w));
const AGENT = new Set(['da', 'dal', 'dallo', 'dalla', 'dai', 'dagli', 'dalle', "dall'"]);

// "viene fatto", "va pagato", "è stato ucciso", "fu scritto",
// "è amato da tutti".
function countPassive(ws) {
  let n = 0;
  for (let i = 0; i < ws.length - 1; i++) {
    const w = ws[i];
    let j = i + 1;
    if (/mente$/.test(ws[j] || '') && ws[j + 1]) j++;
    const next = ws[j];
    if (VENIRE.has(w) || ANDARE.has(w) || FU.has(w)) {
      if (isParticiple(next)) { n++; i = j; }
    } else if (ESSERE.has(w)) {
      if (/^stat[oaie]$/.test(next) && isParticiple(ws[j + 1])) { n++; i = j + 1; } else if (isParticiple(next) && ws.slice(j + 1, j + 4).some((x) => AGENT.has(x))) { n++; i = j; }
    }
  }
  return n;
}

const BE_VERBS = new Set([...ESSERE, ...FU, 'stato', 'stata', 'stati', 'state']);

const MODALS = {
  possibility: ['potrei', 'potresti', 'potrebbe', 'potremmo', 'potreste', 'potrebbero', 'forse', 'magari', 'chissà', 'probabilmente', 'eventualmente'],
  ability: ['posso', 'puoi', 'può', 'possiamo', 'potete', 'possono', 'potevo', 'poteva', 'riesco', 'riesci', 'riesce', 'riusciamo', 'riuscite', 'riescono', 'capace', 'capaci', 'grado'],
  obligation: ['devo', 'devi', 'deve', 'dobbiamo', 'dovete', 'devono', 'dovrei', 'dovresti', 'dovrebbe', 'dovremmo', 'dovreste', 'dovrebbero', 'dovevo', 'doveva', 'bisogna', 'tocca', 'occorre', 'bisogno', 'costretto', 'costretta'],
  volition: ['voglio', 'vuoi', 'vuole', 'vogliamo', 'volete', 'vogliono', 'vorrei', 'vorresti', 'vorrebbe', 'vorremmo', 'vorreste', 'vorrebbero'],
};
const MODAL_OF = new Map(Object.entries(MODALS).flatMap(([k, list]) => list.map((w) => [w, k])));
// The simple future carries volition the way English "will" does.
const FUTURE = new RegExp(`^[${LETTERS}]{2,}(?:rò|rai|rà|remo|rete|ranno)$`);
const NOT_FUTURE = new Set(['però', 'perciò', 'estremo', 'estrema', 'supremo', 'suprema', 'parete', 'segrete', 'carote', 'ferrai', 'arai']);

const INTENSIFIERS = new Set(['molto', 'così', 'tanto', 'tantissimo', 'tantissima', 'totalmente', 'assolutamente', 'completamente', 'mai', 'sempre', 'tutto', 'tutti', 'niente', 'nulla', 'nessuno', 'incredibilmente', 'letteralmente', 'estremamente', 'troppo', 'peggiore', 'peggio', 'migliore', 'odio', 'uccidere', 'ammazzare', 'morire', 'morto', 'morta', 'mille']);

const GENERIC_WORDS = new Set(['cosa', 'cose', 'roba', 'molto', 'praticamente', 'fondamentalmente', 'utilizzare', 'grande', 'bello', 'bella', 'buono', 'buona', 'cattivo', 'qualcosa', 'situazione', 'questione', 'aspetto', 'fattore', 'faccenda', 'tipo', 'discorso']);

const SUBORDINATORS = new Set(['perché', 'poiché', 'siccome', 'sebbene', 'benché', 'mentre', 'se', 'finché', 'affinché', 'nonostante', 'quando', 'qualora', 'che', 'cui', 'quale', 'quali', 'dove', 'dopo', 'prima']);

const FIGURATIVE = re(String.raw`\b(?:come (?:un|una|uno|un'|il|la|lo|i|le|gli)\b|come se\b|più [a-zà-ù]+ di (?:un|una)\b)|\b(?:è|era|sono|erano) (?:un|una|il|la|lo) (?:[a-zà-ù]+ )?(?:sudario|gabbia|prigione|guerra|tomba|tempesta|ferita|deserto|macchina|specchio|fantasma|sogno|mostro|fuoco|droga|chiesa|zoo|circo|giungla|coltello|proiettile|cancro|oceano|abisso|veleno|inferno|labirinto)\b`);

// ---------------------------------------------------------------------------
// Rule patterns
// ---------------------------------------------------------------------------

const ADJ = (stem) => `${stem}[oaie]`;
const ON_THE_NOSE = [
  re(String.raw`\b(?:ti|vi|lo|la|li|le) (?:amo|odio|detesto|adoro|invidio|disprezzo)\b`),
  re(String.raw`\b(?:ho bisogno di te|ti voglio bene|mi manchi)\b`),
  re(String.raw`\b(?:io )?sono (?:così |tanto |molto |davvero |proprio |ancora |solo )?(?:${['arrabbiat', 'furios', 'furibond', 'ferit', 'gelos', 'spaventat', 'terrorizzat', 'depress', 'ansios', 'delus', 'umiliat', 'offes', 'distrutt', 'incazzat'].map(ADJ).join('|')}|trist[ei]|innamorat[oa] di te|in collera)\b`),
  re(String.raw`\bmi sento (?:così |tanto |molto |davvero |proprio )?(?:${['sol', 'ferit', 'tradit', 'abbandonat', 'usat', 'intrappolat', 'gelos', 'umiliat', 'arrabbiat', 'vuot', 'rifiutat'].map(ADJ).join('|')}|trist[ei]|in colpa|inutil[ei]|invisibil[ei]|non amat[oa])\b`),
  re(String.raw`\b(?:i miei veri sentimenti|quello che provo davvero|ciò che provo davvero|come mi sento davvero|la verità è che io|in fondo io|a dire il vero io|per essere sincer[oa] con te|quello che voglio davvero è|ho bisogno che tu (?:capisca|sappia) che|mi fai sentire|ho sempre (?:provato|desiderato te|amato te|voluto te))\b`),
  re(String.raw`\blo (?:sto facendo|faccio|sto dicendo|dico) solo perché\b`),
];

const EMPTY_TALK = re(String.raw`\b(?:come (?:ben )?sai|come sappiamo (?:bene )?(?:entrambi|tutti e due)|come (?:ti )?ho (?:già )?detto|da quanto tempo ci conosciamo|da quando (?:eravamo|ci siamo conosciuti)|siamo (?:amici|sposati|insieme|soci) da|(?:tu )?sei (?:mio|mia) (?:fratello|sorella|moglie|marito|padre|madre|figlio|figlia|migliore amic[oa])|ti ricordi quando)\b`);

const CLUTTER = [
  re(String.raw`^(?:ciao|salve|buongiorno|buonasera|ehi|ehilà)\b[\s,!.]*(?:[a-zà-ù]+[\s,!.]*)?(?:come stai|come va|tutto bene|come andiamo)?[\s?!.]*$`),
  re(String.raw`\bcome stai\??$|\b(?:sto )?bene,? grazie\b|\bche (?:bella|brutta|splendida) giornata\b|\bcom'è andata (?:la giornata|la settimana|il viaggio|il fine settimana)\b|\be i (?:bambini|ragazzi)\?`),
];

const OVERLY_PERCEPTIVE = re(String.raw`\b(?:ora (?:lo )?capisco che io|mi sono res[oa] conto che io|il mio problema è (?:che )?io|il motivo per cui io|per colpa di mi[oa] (?:padre|madre|infanzia)|a causa della mia infanzia|per via di mi[oa] (?:padre|madre)|ho sempre avuto paura di|(?:io )?proietto\b|le mie insicurezze|i miei problemi di (?:abbandono|fiducia)|credo di essere sempre stat[oa]|sono il tipo di (?:persona|uomo|donna) che)`);

const TRAILING_FILLER = re(String.raw`(?:(?:,\s*)?\b(?:sai|capisci|eh|o qualcosa del genere|o quello che è|o roba del genere|o cose così|cioè|comunque|e cose così|e tutto il resto|se capisci cosa intendo|in un certo senso|praticamente|insomma)|,\s*(?:credo|penso|immagino|tipo|giusto|no|vero|ok|okay))\s*[.!?…]*$`);

// ---------------------------------------------------------------------------
// Second reader: stemming and its lexicons
// ---------------------------------------------------------------------------

const IRREG = {
  è: 'esser', sono: 'esser', sei: 'esser', siamo: 'esser', siete: 'esser', era: 'esser', ero: 'esser', eri: 'esser', erano: 'esser', fu: 'esser', essere: 'esser',
  ho: 'aver', hai: 'aver', ha: 'aver', abbiamo: 'aver', avete: 'aver', hanno: 'aver', avere: 'aver',
  faccio: 'fa', fai: 'fa', fa: 'fa', fare: 'fa', fatto: 'fa', fatta: 'fa', facciamo: 'fa', fanno: 'fa',
  dico: 'di', dici: 'di', dice: 'di', dire: 'di', detto: 'di', detta: 'di',
  vado: 'and', vai: 'and', va: 'and', andare: 'and', andiamo: 'and', vanno: 'and',
  voglio: 'vol', vuoi: 'vol', vuole: 'vol', volere: 'vol', vorrei: 'vol',
  posso: 'pot', puoi: 'pot', può: 'pot', potere: 'pot',
  devo: 'dov', devi: 'dov', deve: 'dov', dovere: 'dov',
  sto: 'sta', stai: 'sta', sta: 'sta', stare: 'sta',
  peggio: 'peggi', peggiore: 'peggi', meglio: 'megli', migliore: 'megli',
};
const SUFFIXES = ['issimamente', 'issimo', 'issima', 'issimi', 'issime', 'amento', 'amenti', 'imento', 'imenti', 'azione', 'azioni', 'izione', 'izioni', 'mente',
  'andosi', 'endosi', 'andolo', 'endolo', 'ando', 'endo', 'arsi', 'ersi', 'irsi', 'are', 'ere', 'ire', 'ato', 'ata', 'ati', 'ate', 'uto', 'uta', 'uti', 'ute',
  'ito', 'ita', 'iti', 'ite', 'iamo', 'avamo', 'evamo', 'ivamo', 'avano', 'evano', 'ivano', 'ava', 'avi', 'avo', 'eva', 'evi', 'evo', 'iva', 'ivi', 'ivo', 'ano', 'ono',
  'ò', 'à', 'è', 'ì', 'ù', 'a', 'e', 'i', 'o'];

const CLITIC = '(?:mi|ti|ci|vi|si|lo|la|li|le|gli|ne|melo|mela|telo|tela|glielo|gliela|glieli|gliele|celo|cela|sene)';
const INF_CLITIC = new RegExp(`^(.{2,}[aei]r)${CLITIC}$`);
const GER_CLITIC = new RegExp(`^(.{2,}(?:and|end)o)${CLITIC}$`);

function stem(word) {
  let w = lower(word);
  if (IRREG[w]) return IRREG[w];
  // "spiegarti" → "spiegare", "dicendomi" → "dicendo"
  w = w.replace(INF_CLITIC, '$1e').replace(GER_CLITIC, '$1');
  if (w.length <= 3 || w.endsWith("'")) return w;
  for (const suf of SUFFIXES) if (w.endsWith(suf) && w.length - suf.length >= 3) return w.slice(0, -suf.length);
  return w;
}

const stemSet = (list) => new Set(list.split(/\s+/).filter(Boolean).map(stem));

const EMOTIONS = stemSet(`arrabbiato furioso furibondo incazzato rabbia triste tristezza infelice disperato distrutto depresso devastato
isolato vuoto ferito tradito abbandonato rifiutato respinto indesiderato invisibile inutile vergogna vergognarsi colpevole colpa
imbarazzato umiliato geloso invidioso terrorizzato spaventato impaurito paura ansioso ansia nervoso preoccupato sopraffatto felice
contento entusiasta grato riconoscente sollevato orgoglioso speranzoso eccitato amato adorato intrappolato impotente confuso frustrato
deluso infastidito irritato disgustato inorridito scioccato odio amore manchi mancare terrore umiliante straziato`);

const SUPERLATIVE = stemSet('peggiore peggio intero intera mai sempre tutto niente nulla distruggere rovinare odio uccidere ammazzare morire insopportabile assolutamente totalmente completamente orribile terribile');

const ABSTRACT = stemSet(`situazione questione roba aspetto fattore rapporto relazione sentimento emozione emotivo complicato processo percorso chiusura
dinamica livello natura genere qualcosa qualsiasi praticamente fondamentalmente certo discorso faccenda problematica tematica`);

const PATTERNS = {
  onTheNose: [
    { re: re(String.raw`\b(?:sento|ho la sensazione|ho l'impressione) che tu\b`), msg: 'Announces a feeling and a judgment of the other person at once.' },
    { re: re(String.raw`\bmi (?:fai|hai fatto|stai facendo) (?:sentire|stare|soffrire|impazzire|arrabbiare|paura|schifo|pena)\b|\bmi rendi (?:così |tanto )?[a-zà-ù]+`), msg: 'Names the effect the other person has on her, outright.' },
    { re: re(String.raw`\b(?:tutto (?:ciò|quello) (?:che (?:voglio|desidero|chiedo)|di cui ho bisogno)|(?:quello|ciò) (?:che (?:voglio|desidero)|di cui ho (?:davvero |veramente )?bisogno) (?:davvero |veramente )?è|(?:voglio|ho bisogno|vorrei) (?:solo |soltanto |davvero |semplicemente )?che tu (?:sappia|capisca|veda|senta|resti|rimanga|creda|sia|stia))\b`), msg: 'States the desire itself instead of acting on it.' },
    { re: re(String.raw`\b(?:ti|vi|lo|la|li|le) (?:amo|odio|adoro|detesto|perdono|disprezzo)\b|\b(?:mi manchi|ti voglio bene|ho bisogno di te)\b`), msg: 'Declares the feeling to its object.' },
    { re: re(String.raw`\b(?:lo |la )?(?:stai|state) (?:facendo|dicendo) (?:solo |soltanto )?per(?:ché)?\b|\blo (?:fai|dici) (?:solo |soltanto )?per(?:ché)?\b`), msg: 'Names the other character\'s motive out loud.' },
  ],
  emptyTalk: [
    { re: re(String.raw`\b(?:da quando eravamo|quando eravamo (?:bambini|piccoli|ragazzi|giovani|a scuola)|ai tempi in cui|ti ricordi quando|come ti ho (?:già )?detto|come ho detto|come ti dicevo|come sai|come sappiamo (?:bene )?(?:entrambi|tutti e due)|te lo ricordi)\b`), msg: 'Reminds the listener of something she already knows.' },
    { re: re(String.raw`\b(?:da|per)\s+(?:[a-zà-ù]+\s+)?(?:anni|decenni)\b`), need: re(String.raw`\b(?:noi|ci|siamo|abbiamo|nostr[oaie]|io e te|tu e io|[a-zà-ù]{2,}iamo)\b`), msg: 'Shared history recited between people who lived it.' },
    { re: re(String.raw`\b[Tt]u[oa] (?:fratello|sorella|moglie|marito|madre|padre|mamma|papà|figlio|figlia|capo|socio|socia|zio|zia|cugino|cugina),\s+[A-Z][a-zà-ù]+`, ''), msg: 'Tells the listener who her own relative is.' },
  ],
  clutter: [
    { re: re(String.raw`\b(?:che bello vederti|che piacere vederti|quanto tempo(?:!|,| che non)|come sta (?:tua|tuo) (?:madre|padre|mamma|papà|moglie|marito|famiglia)|come stanno i (?:bambini|ragazzi)|come va (?:il lavoro|a casa)|come te la passi|bel posto|cosa ti porta qui|che (?:bella|splendida|brutta) giornata|(?:è|era) da (?:tanto|un po'|secoli) che non)`), msg: 'Social small talk; is there an action underneath it?' },
  ],
  overlyPerceptive: [
    { re: re(String.raw`\b(?:(?:io )?(?:allontano|ho sempre allontanato|tengo) (?:le persone|tutti|la gente) (?:a distanza|lontano)|perché (?:io )?ho paura|faccio fatica a (?:fidarmi|lasciarmi andare|aprirmi)|non sono mai stat[oa] (?:capace|bravo|brava|in grado)|sono fatt[oa] così|sono (?:il|la) (?:tipo|tipa) che|per tutta la (?:mia )?vita (?:ho|sono)|(?:ho|aver|avere) sempre (?:avuto bisogno|voluto|avuto paura)|il mio problema è)\b`), msg: 'Self-diagnosis with more insight than people have about themselves.' },
  ],
  mistimedCue: [
    { re: re(String.raw`,\s*(?:se non ti dispiace|se (?:ti )?va bene|per quel che vale|a dire il vero|sinceramente|onestamente|vedi|in un certo senso|per così dire|o giù di lì|o qualcosa del genere|immagino|credo|penso|cioè|capisci cosa intendo|però|comunque)\s*[.!?…]*$`), msg: 'A qualifier trails after the core word and delays the cue.' },
  ],
};

const CLUSTERS = {
  heard: ['parlami', 'ascolta', 'ascoltami', 'sentimi', 'fammi finire', 'lasciami finire', 'lasciami parlare', 'fammi spiegare', 'spiegare', 'devi capire'],
  dismissing: ['vattene', 'vai via', 'lasciami stare', 'lasciami in pace', 'da solo', 'da sola', 'basta', 'stai zitto', 'stai zitta', 'lascia perdere', 'non ora', 'non adesso', 'esci'],
  apologizing: ['scusa', 'scusami', 'mi dispiace', 'perdonami', 'colpa mia', 'errore', 'sbaglio'],
  pleading: ['ti prego', 'per favore', 'per piacere', 'ti supplico', 'ho bisogno di te', 'aiutami', 'devi aiutarmi'],
  money: ['soldi', 'denaro', 'contanti', 'pagare', 'permettermi', 'debito', 'debiti', 'prestito'],
  truth: ['verità', 'mentirmi', 'mentire', 'bugia', 'bugie', 'sii sincero', 'sii sincera', 'il vero motivo'],
};

// Light verbs that need the next word to identify a tactic
// ("facendo la vittima" vs "facendo il finto tonto").
const LIGHT = new Set(['facendo', 'mettendo', 'prendendo', 'dando', 'offrendo', 'cambiando', 'dimostrando', 'fingendo', 'tendendo', 'lanciando', 'nominando', 'ritirandosi', 'mettendosi', 'proclamandosi']);
const ARTICLES = new Set(['il', 'lo', 'la', 'i', 'gli', 'le', "l'", 'un', 'una', 'uno', "un'", 'a', 'al', 'alla', "all'", 'di', 'del', 'della', 'in']);

export default {
  id: 'it',
  speech: /^it/i,
  letters: LETTERS,
  words,
  stopwords: STOPWORDS,
  syllables,
  isLatinate,
  // Italian words are longer than English ones: shifted calibration.
  norms: { spw: [1.6, 2.3], aridSpw: 2.5, avgLen: [3.8, 5.6], latinate: 0.08, beVerb: [0.015, 0.09] },
  CLICHES,
  NEUTRAL_PHRASES,
  PROFANITY,
  BE_VERBS,
  countPassive,
  modalOf: (w) => MODAL_OF.get(w) || (FUTURE.test(w) && !NOT_FUTURE.has(w) ? 'volition' : null),
  INTENSIFIERS,
  GENERIC_WORDS,
  SUBORDINATORS,
  FIGURATIVE,
  capsOk: /^(OK|TV|RAI|INPS|ASL|USA|UE|ONU|DNA|CEO|PM|IVA|SMS|I)$/,
  pauses: re(String.raw`\.\.\.|…|—\s*$|\((?:pausa|silenzio|beat)\)`, 'gi'),
  ON_THE_NOSE,
  EMPTY_TALK,
  CLUTTER,
  OVERLY_PERCEPTIVE,
  TRAILING_FILLER,
  // Italian does not strand prepositions at the end of a sentence.
  TRAILING_PREP: null,
  isGerundPhrase: (t) => re(String.raw`\b[a-zà-ù]{2,}(?:ando|endo)(?:si|lo|la|li|le|gli|ne|mi|ti|ci|vi|glielo|gliela|glieli|gliele|selo|sela)?\b`).test(String(t || '')),
  gerundEnding: '…ando / …endo',
  tacticKey: (t) => {
    const ws = words(t);
    if (!ws.length) return '';
    if (!LIGHT.has(ws[0])) return ws[0];
    const next = ws.slice(1).find((w) => !ARTICLES.has(w));
    return next ? `${ws[0]} ${next}` : ws[0];
  },
  // Second reader
  stem,
  OPTIONAL: stemSet(`il lo la i gli le l' un uno una un' di a da in con su per del dello della dei degli delle dell' al allo alla ai agli alle all'
dal dalla dai nel nella nei nell' sul sulla sui mio mia miei mie tuo tua tuoi tue suo sua proprio solo davvero così poi già ancora`),
  EMOTIONS,
  FEELING_VERBS: stemSet('sento sentire sentirsi esser sono è sta sto stare fa fai fare rendi rendere diventare divento così tanto'),
  FIRST_PERSON: new Set(['io', 'me', 'mi', 'mio', 'mia', 'miei', 'mie', 'sono', 'sto', 'ho', "m'"]),
  SUPERLATIVE,
  ABSTRACT,
  PATTERNS,
  CLUSTERS,
};
