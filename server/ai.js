// AI collaborator: a streaming tool-use loop over the Claude Messages API.
// Tools only create proposals that the writer applies in the UI, so the loop
// "executes" a tool by validating its input and forwarding it to the browser.

import Anthropic from '@anthropic-ai/sdk';
import { TOOLS, TOOL_ACK, MODES, buildSystem } from './prompts.js';
import { checkTool, TERMINAL_TOOLS } from './tools.js';
import { PROVIDERS, DEFAULT_PROVIDER, providersStatus, runCompatChat } from './providers.js';
import { trl, normLang, N_ } from '../public/js/i18n.js';

export const MODELS = [
  { id: 'claude-opus-5-5', label: 'Claude Opus 5.5' },
  { id: 'claude-sonnet-5-5', label: 'Claude Sonnet 5.5' },
  { id: 'claude-haiku-5-5', label: 'Claude Haiku 5.5' },
  { id: 'claude-fable-5-1', label: 'Claude Fable 5.1' },
];
export const DEFAULT_MODEL = process.env.DD_MODEL || 'claude-opus-5-5';
// Models that accept the server-side refusal fallback ("default" form).
const FALLBACK_MODELS = new Set(['claude-opus-5-5', 'claude-sonnet-5-5', 'claude-fable-5-1']);
const MAX_ITERATIONS = 6;

// serverKey/defaultModel/models describe Anthropic; `providers` the others.
export function aiStatus() {
  return {
    serverKey: Boolean(process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN),
    mock: process.env.DD_AI_MOCK === '1',
    defaultModel: DEFAULT_MODEL,
    models: MODELS,
    defaultProvider: DEFAULT_PROVIDER,
    providers: providersStatus(),
    modes: Object.fromEntries(Object.entries(MODES).map(([k, v]) => [k, v.label])),
  };
}

// Checks the key against the Anthropic API (Settings → Test connection) and
// returns the models this app offers, with those the key can reach.
export async function listAnthropicModels(apiKey) {
  if (process.env.DD_AI_MOCK === '1') return { models: MODELS.map((m) => m.id) };
  const client = apiKey ? new Anthropic({ apiKey }) : new Anthropic();
  const available = [];
  for await (const m of client.models.list({ limit: 100 })) {
    available.push(m.id);
    if (available.length >= 100) break;
  }
  return { models: MODELS.map((m) => m.id), available };
}

// The tool each mode must answer with, for services where it can be forced.
const FORCED_TOOL = { review: 'report_issues', rehearse: 'speak_in_character' };

function sanitizeMessages(raw) {
  const msgs = (Array.isArray(raw) ? raw : [])
    .filter((m) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string' && m.content.trim())
    .map((m) => ({ role: m.role, content: m.content.slice(0, 20000) }))
    .slice(-40);
  while (msgs.length && msgs[0].role !== 'user') msgs.shift();
  if (!msgs.length || msgs[msgs.length - 1].role !== 'user') throw new Error(N_('The conversation must end with a message from the writer.'));
  return msgs;
}

// Runs the conversation and reports progress through send(event, data).
// body.lang: the interface language (replies); body.dialogueLang: the
// language the project's dialogue is written in.
// body.provider picks the service (default: DD_AI_PROVIDER or Anthropic);
// `trusted` says whether this caller may point the server at a custom
// address (see providers.js).
export async function runChat({ body, apiKey, send, signal, trusted = false }) {
  const lang = normLang(body.lang);
  const dialogueLang = normLang(body.dialogueLang || lang);
  const L = (key, vars) => trl(lang, key, vars);
  const mode = MODES[body.mode] ? body.mode : 'coach';
  const provider = PROVIDERS[body.provider] ? body.provider : DEFAULT_PROVIDER;
  const messages = sanitizeMessages(body.messages);
  const context = { meta: body.context?.meta || {}, data: body.context?.data || {} };

  if (process.env.DD_AI_MOCK === '1') return mockChat({ mode, context, send, signal, lang, dialogueLang });

  if (PROVIDERS[provider].kind === 'compat') {
    const system = buildSystem(mode, context, { lang, dialogueLang, contextChars: PROVIDERS[provider].contextChars }).map((b) => b.text).join('\n\n');
    return runCompatChat({ provider, apiKey, baseUrl: body.baseUrl, model: body.model, system, messages, forceTool: FORCED_TOOL[mode], trusted, send, signal, L });
  }

  const model = MODELS.some((m) => m.id === body.model) ? body.model : DEFAULT_MODEL;
  const client = apiKey ? new Anthropic({ apiKey }) : new Anthropic();
  const system = buildSystem(mode, context, { lang, dialogueLang });
  const tools = TOOLS.map((t) => ({ ...t, eager_input_streaming: true }));
  const history = [...messages];
  let jsonRetries = 0;

  for (let iter = 0; iter < MAX_ITERATIONS; iter++) {
    const params = {
      model,
      max_tokens: 16000,
      system,
      tools,
      messages: history,
      output_config: { effort: MODES[mode].effort },
    };
    if (FALLBACK_MODELS.has(model)) {
      params.betas = ['server-side-fallback-2026-07-01'];
      params.fallbacks = 'default';
    }
    let message;
    try {
      const stream = client.beta.messages.stream(params, { signal });
      stream.on('text', (delta) => send('text', { delta }));
      message = await stream.finalMessage();
      jsonRetries = 0;
    } catch (err) {
      // With eager input streaming, unparseable tool JSON rejects here as a
      // plain AnthropicError; retry that case only. Everything else (API
      // errors, missing credentials, aborts) propagates to the caller.
      const badToolJson = err instanceof Anthropic.AnthropicError && !(err instanceof Anthropic.APIError) && /tool parameter JSON/i.test(err.message);
      if (!badToolJson || signal?.aborted || jsonRetries++ >= 2) throw err;
      send('notice', { message: L('Retrying a malformed tool call…') });
      continue;
    }

    if (message.stop_reason === 'refusal') {
      send('refusal', { message: L('The model declined this request.'), category: message.stop_details?.category || null });
      break;
    }
    if (message.stop_reason === 'pause_turn') {
      history.push({ role: 'assistant', content: message.content });
      continue;
    }
    const toolUses = message.content.filter((b) => b.type === 'tool_use');
    if (!toolUses.length) {
      if (message.stop_reason === 'max_tokens') send('notice', { message: L('The reply hit its length limit.') });
      break;
    }
    if (message.stop_reason === 'max_tokens') {
      send('error', { message: L('A proposal was cut off at the length limit. Try asking for less at once.') });
      break;
    }

    history.push({ role: 'assistant', content: message.content });
    const results = [];
    let terminal = true;
    for (const tu of toolUses) {
      const parsed = checkTool(tu.name, tu.input);
      if (!parsed.ok) {
        results.push({ type: 'tool_result', tool_use_id: tu.id, is_error: true, content: JSON.stringify({ INVALID_INPUT: parsed.error }) });
        terminal = false;
        continue;
      }
      if (!TERMINAL_TOOLS.has(tu.name)) terminal = false;
      send('proposal', { tool: tu.name, id: tu.id, input: parsed.data });
      results.push({ type: 'tool_result', tool_use_id: tu.id, content: TOOL_ACK[tu.name] });
    }
    // A speech (rehearsal) or a review report is the whole turn.
    if (terminal) break;
    history.push({ role: 'user', content: results });
  }
}

export function describeError(err, lang = 'en') {
  const L = (key, vars) => trl(lang, key, vars);
  if (err?.providerError) return { status: err.status, message: L(err.message, err.vars) };
  if (err instanceof Anthropic.AuthenticationError) return { status: 401, message: L('The API key was rejected. Check it in Settings, or set ANTHROPIC_API_KEY for the server.') };
  if (err instanceof Anthropic.PermissionDeniedError) return { status: 403, message: L('This API key does not have access to the selected model.') };
  if (err instanceof Anthropic.NotFoundError) return { status: 404, message: L('Model not found. Pick another model in Settings.') };
  if (err instanceof Anthropic.RateLimitError) return { status: 429, message: L('Rate limited. Wait a moment and try again.') };
  if (err instanceof Anthropic.BadRequestError) return { status: 400, message: L('Request rejected: {reason}', { reason: err.message }) };
  if (err instanceof Anthropic.APIConnectionError) return { status: 502, message: L('Could not reach the Claude API. Check the network.') };
  if (err instanceof Anthropic.APIError) return { status: err.status || 500, message: L('Claude API error: {reason}', { reason: err.message }) };
  if (/credentials|apiKey|authToken|API key/i.test(String(err?.message))) return { status: 401, message: L('No API key configured. Add one in Settings, or start the server with ANTHROPIC_API_KEY set.') };
  return { status: 500, message: L(String(err?.message || err)) };
}

// ---------------------------------------------------------------------------
// Mock mode (DD_AI_MOCK=1): deterministic responses for offline UI work and
// automated tests. Never used unless explicitly enabled.
// ---------------------------------------------------------------------------

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function streamText(text, send, signal) {
  for (const chunk of text.match(/.{1,24}/gs) || []) {
    if (signal?.aborted) return;
    send('text', { delta: chunk });
    await sleep(8);
  }
}

// Canned replies per dialogue language (and interface language for text).
const MOCK = {
  en: {
    speech: { text: 'Balance staff. Broken since March.', paralanguage: 'not looking up from the loupe', subtext: 'I was here. You weren\'t.', tactic: 'exposing his ignorance' },
    reviewIntro: '(Mock mode.) Reading every line against the analyzer…',
    reviewSummary: '(Mock) The scene turns; one line leans on a stock phrase.',
    reviewNote: '(Mock) A familiar turn of phrase.',
    reviewFix: 'Find the version only this character would say.',
    reviewDispute: '(Mock) Deliberate in context.',
    coach: (name) => `(Mock mode.) Let's go beneath ${name || 'the mask'}. Ch. 12 separates the object of desire from the super-intention: what they want versus the hunger that drives it. If they got what they wanted tomorrow, would the hunger stop?`,
    coachUpdates: [
      { path: 'desire.superIntention', value: 'To be chosen, just once, over someone more promising.', rationale: 'Restates the want as a need (Ch. 12).' },
      { path: 'voice.sliders.pace', value: '80', rationale: 'Short, staccato lines suit someone who controls rooms (Ch. 13).' },
    ],
    alts: [
      { text: 'You still take two sugars?', subtext: 'I remember you.', tactic: 'testing', note: 'A question instead of a claim.' },
      { text: 'Black. Like the shop\'s books.', subtext: 'We\'re broke too.', tactic: 'deflecting', note: 'A joke that hides a fact.' },
    ],
    altsOutro: 'Two options in mock mode. A live model would give five.',
    beat: { action: 'testing her', reaction: 'refusing the bait', rationale: 'Mock beat.', lines: [
      ['You kept his glasses.', 'You kept everything.'],
      ['Prescription. Somebody might need them.', 'I can\'t throw him away.'],
    ] },
    doctor: '(Mock mode.) Root cause first: dialogue problems are story problems (Ch. 9). Check that each beat changes its tactic and that the value turns.',
  },
  it: {
    speech: { text: 'L\'asse del bilanciere. Rotto da marzo.', paralanguage: 'senza alzare gli occhi dalla lente', subtext: 'Io c\'ero. Tu no.', tactic: 'smascherando la sua ignoranza' },
    reviewIntro: '(Modalità simulata.) Leggo ogni battuta accanto all\'analizzatore…',
    reviewSummary: '(Simulazione) La scena gira; una battuta si appoggia a una frase fatta.',
    reviewNote: '(Simulazione) Un modo di dire già sentito.',
    reviewFix: 'Trova la versione che direbbe solo questo personaggio.',
    reviewDispute: '(Simulazione) Voluto, nel contesto.',
    coach: (name) => `(Modalità simulata.) Andiamo sotto la maschera di ${name || 'questo personaggio'}. Il Cap. 12 distingue l'oggetto del desiderio dal super-obiettivo: ciò che vuole e la fame che lo spinge. Se domani ottenesse ciò che vuole, la fame finirebbe?`,
    coachUpdates: [
      { path: 'desire.superIntention', value: 'Essere scelta, almeno una volta, al posto di qualcuno più promettente.', rationale: 'Riformula il volere come bisogno (Cap. 12).' },
      { path: 'voice.sliders.pace', value: '80', rationale: 'Battute brevi e incalzanti per chi comanda nelle stanze (Cap. 13).' },
    ],
    alts: [
      { text: 'Ancora due zuccheri?', subtext: 'Mi ricordo di te.', tactic: 'mettendolo alla prova', note: 'Una domanda invece di un\'affermazione.' },
      { text: 'Nero. Come i conti della bottega.', subtext: 'Anche noi siamo senza soldi.', tactic: 'deviando', note: 'Una battuta che nasconde un fatto.' },
    ],
    altsOutro: 'Due opzioni in modalità simulata. Un modello vero ne darebbe cinque.',
    beat: { action: 'mettendola alla prova', reaction: 'rifiutando l\'esca', rationale: 'Beat simulato.', lines: [
      ['Hai tenuto i suoi occhiali.', 'Hai tenuto tutto.'],
      ['Da vista. A qualcuno potrebbero servire.', 'Non riesco a buttarlo via.'],
    ] },
    doctor: '(Modalità simulata.) Prima la causa profonda: i problemi di dialogo sono problemi di storia (Cap. 9). Controlla che ogni beat cambi tattica e che il valore giri.',
  },
};

async function mockChat({ mode, context, send, signal, lang = 'en', dialogueLang = lang }) {
  const T = MOCK[lang] || MOCK.en; // replies in the interface language
  const D = MOCK[dialogueLang] || MOCK.en; // dialogue in the project's language
  const meta = context.meta || {};
  const scene = context.data?.scene;
  const chars = context.data?.characters || [];
  if (mode === 'rehearse') {
    send('proposal', { tool: 'speak_in_character', id: 'mock_speech', input: D.speech });
    return;
  }
  if (mode === 'review') {
    const firstLine = (scene?.beats || []).flatMap((b) => b.lines || []).find((l) => l.kind !== 'action' && l.text);
    const flagged = Object.entries(context.data?.analyzer?.lineFindings || {})[0];
    await streamText(T.reviewIntro, send, signal);
    send('proposal', { tool: 'report_issues', id: 'mock_review', input: {
      summary: T.reviewSummary,
      issues: firstLine ? [{ line_id: firstLine.id, flaw: 'cliche', severity: 'info', evidence: firstLine.text.slice(0, 30), note: T.reviewNote, fix: T.reviewFix }] : [],
      disputes: flagged ? [{ line_id: flagged[0], flaw: String(flagged[1][0]).split(' ')[0], reason: T.reviewDispute }] : [],
    } });
    return;
  }
  if (mode === 'coach') {
    await streamText(T.coach(meta.characterName), send, signal);
    send('proposal', { tool: 'propose_character_updates', id: 'mock_upd', input: { character_id: meta.characterId || chars[0]?.id || '', updates: T.coachUpdates } });
    return;
  }
  if (mode === 'alternatives') {
    const speaker = chars[0]?.id || '';
    send('proposal', { tool: 'propose_lines', id: 'mock_alt', input: { scene_id: scene?.id || '', target_line_id: meta.targetLineId || null, options: D.alts.map((o) => ({ speaker_id: speaker, ...o })) } });
    await streamText(T.altsOutro, send, signal);
    return;
  }
  if (mode === 'beats') {
    const p = scene?.participants || [];
    const [a, b] = [p[0]?.characterId || '', p[1]?.characterId || ''];
    send('proposal', { tool: 'propose_beats', id: 'mock_beats', input: { scene_id: scene?.id || '', rationale: T.beat.rationale, beats: [
      { actor_id: a, action: D.beat.action, reactor_id: b, reaction: D.beat.reaction, charge: -3, intensity: 5, lines: [
        { speaker_id: a, text: D.beat.lines[0][0], subtext: D.beat.lines[0][1], tactic: D.beat.action },
        { speaker_id: b, text: D.beat.lines[1][0], subtext: D.beat.lines[1][1], tactic: D.beat.reaction },
      ] },
    ] } });
    return;
  }
  await streamText(T.doctor, send, signal);
}
