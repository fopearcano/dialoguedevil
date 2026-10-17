// AI collaborator: a streaming tool-use loop over the Claude Messages API.
// Tools only create proposals that the writer applies in the UI, so the loop
// "executes" a tool by validating its input and forwarding it to the browser.

import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';
import { TOOLS, TOOL_ACK, MODES, buildSystem } from './prompts.js';
import { REVIEWABLE_FLAWS } from '../public/js/mckee.js';

export const MODELS = [
  { id: 'claude-opus-5-5', label: 'Claude Opus 5.5 (default)' },
  { id: 'claude-sonnet-5-5', label: 'Claude Sonnet 5.5' },
  { id: 'claude-haiku-5-5', label: 'Claude Haiku 5.5' },
  { id: 'claude-fable-5-1', label: 'Claude Fable 5.1' },
];
export const DEFAULT_MODEL = process.env.DD_MODEL || 'claude-opus-5-5';
// Models that accept the server-side refusal fallback ("default" form).
const FALLBACK_MODELS = new Set(['claude-opus-5-5', 'claude-sonnet-5-5', 'claude-fable-5-1']);
const MAX_ITERATIONS = 6;

const opt = z.string().optional().nullable();
const SCHEMAS = {
  propose_character_updates: z.object({
    character_id: z.string(),
    updates: z.array(z.object({ path: z.string().min(1), value: z.union([z.string(), z.number()]).transform(String), rationale: z.string().default('') })).min(1),
  }),
  propose_beats: z.object({
    scene_id: z.string(),
    rationale: opt,
    beats: z.array(z.object({
      actor_id: z.string(), action: z.string(), reactor_id: z.string(), reaction: z.string(),
      charge: z.number().min(-10).max(10).optional().nullable(),
      intensity: z.number().min(0).max(10).optional().nullable(),
      lines: z.array(z.object({ speaker_id: z.string(), text: z.string(), paren: opt, subtext: opt, tactic: opt })),
    })).min(1),
  }),
  propose_lines: z.object({
    scene_id: z.string(),
    target_line_id: opt,
    options: z.array(z.object({ speaker_id: z.string(), text: z.string(), paren: opt, subtext: z.string(), tactic: z.string(), note: opt })).min(1),
  }),
  speak_in_character: z.object({ text: z.string().min(1), paralanguage: opt, subtext: z.string(), tactic: z.string() }),
  report_issues: z.object({
    summary: z.string().default(''),
    issues: z.array(z.object({
      line_id: z.string().default(''), flaw: z.enum(REVIEWABLE_FLAWS), severity: z.enum(['info', 'warning', 'serious']).default('warning'),
      evidence: z.string().default(''), note: z.string(), fix: z.string().default(''),
    })).default([]),
    disputes: z.array(z.object({ line_id: z.string().default(''), flaw: z.enum(REVIEWABLE_FLAWS), reason: z.string() })).default([]),
  }),
};

// Tools whose call is the whole answer: no follow-up turn is needed.
const TERMINAL_TOOLS = new Set(['speak_in_character', 'report_issues']);

export function aiStatus() {
  return {
    serverKey: Boolean(process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN),
    mock: process.env.DD_AI_MOCK === '1',
    defaultModel: DEFAULT_MODEL,
    models: MODELS,
    modes: Object.fromEntries(Object.entries(MODES).map(([k, v]) => [k, v.label])),
  };
}

function sanitizeMessages(raw) {
  const msgs = (Array.isArray(raw) ? raw : [])
    .filter((m) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string' && m.content.trim())
    .map((m) => ({ role: m.role, content: m.content.slice(0, 20000) }))
    .slice(-40);
  while (msgs.length && msgs[0].role !== 'user') msgs.shift();
  if (!msgs.length || msgs[msgs.length - 1].role !== 'user') throw new Error('The conversation must end with a message from the writer.');
  return msgs;
}

// Runs the conversation and reports progress through send(event, data).
export async function runChat({ body, apiKey, send, signal }) {
  const mode = MODES[body.mode] ? body.mode : 'coach';
  const model = MODELS.some((m) => m.id === body.model) ? body.model : DEFAULT_MODEL;
  const messages = sanitizeMessages(body.messages);
  const context = { meta: body.context?.meta || {}, data: body.context?.data || {} };

  if (process.env.DD_AI_MOCK === '1') return mockChat({ mode, context, send, signal });

  const client = apiKey ? new Anthropic({ apiKey }) : new Anthropic();
  const system = buildSystem(mode, context);
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
      send('notice', { message: 'Retrying a malformed tool call…' });
      continue;
    }

    if (message.stop_reason === 'refusal') {
      send('refusal', { message: 'The model declined this request.', category: message.stop_details?.category || null });
      break;
    }
    if (message.stop_reason === 'pause_turn') {
      history.push({ role: 'assistant', content: message.content });
      continue;
    }
    const toolUses = message.content.filter((b) => b.type === 'tool_use');
    if (!toolUses.length) {
      if (message.stop_reason === 'max_tokens') send('notice', { message: 'The reply hit its length limit.' });
      break;
    }
    if (message.stop_reason === 'max_tokens') {
      send('error', { message: 'A proposal was cut off at the length limit. Try asking for less at once.' });
      break;
    }

    history.push({ role: 'assistant', content: message.content });
    const results = [];
    let terminal = true;
    for (const tu of toolUses) {
      const schema = SCHEMAS[tu.name];
      const parsed = schema ? schema.safeParse(tu.input) : { success: false, error: new Error(`Unknown tool ${tu.name}`) };
      if (!parsed.success) {
        results.push({ type: 'tool_result', tool_use_id: tu.id, is_error: true, content: JSON.stringify({ INVALID_INPUT: String(parsed.error?.message || parsed.error).slice(0, 2000) }) });
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

export function describeError(err) {
  if (err instanceof Anthropic.AuthenticationError) return { status: 401, message: 'The API key was rejected. Check it in Settings, or set ANTHROPIC_API_KEY for the server.' };
  if (err instanceof Anthropic.PermissionDeniedError) return { status: 403, message: 'This API key does not have access to the selected model.' };
  if (err instanceof Anthropic.NotFoundError) return { status: 404, message: 'Model not found. Pick another model in Settings.' };
  if (err instanceof Anthropic.RateLimitError) return { status: 429, message: 'Rate limited. Wait a moment and try again.' };
  if (err instanceof Anthropic.BadRequestError) return { status: 400, message: `Request rejected: ${err.message}` };
  if (err instanceof Anthropic.APIConnectionError) return { status: 502, message: 'Could not reach the Claude API. Check the network.' };
  if (err instanceof Anthropic.APIError) return { status: err.status || 500, message: `Claude API error: ${err.message}` };
  if (/credentials|apiKey|authToken|API key/i.test(String(err?.message))) return { status: 401, message: 'No API key configured. Add one in Settings, or start the server with ANTHROPIC_API_KEY set.' };
  return { status: 500, message: String(err?.message || err) };
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

async function mockChat({ mode, context, send, signal }) {
  const meta = context.meta || {};
  const scene = context.data?.scene;
  const chars = context.data?.characters || [];
  if (mode === 'rehearse') {
    send('proposal', { tool: 'speak_in_character', id: 'mock_speech', input: { text: 'Balance staff. Broken since March.', paralanguage: 'not looking up from the loupe', subtext: 'I was here. You weren\'t.', tactic: 'exposing his ignorance' } });
    return;
  }
  if (mode === 'review') {
    const firstLine = (scene?.beats || []).flatMap((b) => b.lines || []).find((l) => l.kind !== 'action' && l.text);
    const flagged = Object.entries(context.data?.analyzer?.lineFindings || {})[0];
    await streamText('(Mock mode.) Reading every line against the analyzer…', send, signal);
    send('proposal', { tool: 'report_issues', id: 'mock_review', input: {
      summary: '(Mock) The scene turns; one line leans on a stock phrase.',
      issues: firstLine ? [{ line_id: firstLine.id, flaw: 'cliche', severity: 'info', evidence: firstLine.text.slice(0, 30), note: '(Mock) A familiar turn of phrase.', fix: 'Find the version only this character would say.' }] : [],
      disputes: flagged ? [{ line_id: flagged[0], flaw: String(flagged[1][0]).split(' ')[0], reason: '(Mock) Deliberate in context.' }] : [],
    } });
    return;
  }
  if (mode === 'coach') {
    await streamText(`(Mock mode.) Let's go beneath ${meta.characterName || 'the mask'}. Ch. 12 separates the object of desire from the super-intention: what they want versus the hunger that drives it. If they got what they wanted tomorrow, would the hunger stop?`, send, signal);
    send('proposal', { tool: 'propose_character_updates', id: 'mock_upd', input: { character_id: meta.characterId || chars[0]?.id || '', updates: [
      { path: 'desire.superIntention', value: 'To be chosen, just once, over someone more promising.', rationale: 'Restates the want as a need (Ch. 12).' },
      { path: 'voice.sliders.pace', value: '80', rationale: 'Short, staccato lines suit someone who controls rooms (Ch. 13).' },
    ] } });
    return;
  }
  if (mode === 'alternatives') {
    const speaker = chars[0]?.id || '';
    send('proposal', { tool: 'propose_lines', id: 'mock_alt', input: { scene_id: scene?.id || '', target_line_id: meta.targetLineId || null, options: [
      { speaker_id: speaker, text: 'You still take two sugars?', subtext: 'I remember you.', tactic: 'testing', note: 'A question instead of a claim.' },
      { speaker_id: speaker, text: 'Black. Like the shop\'s books.', subtext: 'We\'re broke too.', tactic: 'deflecting', note: 'A joke that hides a fact.' },
    ] } });
    await streamText('Two options in mock mode. A live model would give five.', send, signal);
    return;
  }
  if (mode === 'beats') {
    const p = scene?.participants || [];
    send('proposal', { tool: 'propose_beats', id: 'mock_beats', input: { scene_id: scene?.id || '', rationale: 'Mock beat.', beats: [
      { actor_id: p[0]?.characterId || '', action: 'testing her', reactor_id: p[1]?.characterId || '', reaction: 'refusing the bait', charge: -3, intensity: 5, lines: [
        { speaker_id: p[0]?.characterId || '', text: 'You kept his glasses.', subtext: 'You kept everything.', tactic: 'testing her' },
        { speaker_id: p[1]?.characterId || '', text: 'Prescription. Somebody might need them.', subtext: 'I can\'t throw him away.', tactic: 'refusing the bait' },
      ] },
    ] } });
    return;
  }
  await streamText('(Mock mode.) Root cause first: dialogue problems are story problems (Ch. 9). Check that each beat changes its tactic and that the value turns.', send, signal);
}
