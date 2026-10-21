// AI services besides Anthropic: OpenAI, OpenRouter, and any local or
// self-hosted server that speaks the OpenAI Chat Completions format
// (Ollama, LM Studio, llama.cpp, vLLM…). They run the same tool loop as the
// Claude one: tool calls are validated and forwarded as proposals.
// Plain HTTP against the documented wire format, so every compatible
// server works the same way.

import { TOOLS, TOOL_ACK } from './prompts.js';
import { checkTool, TERMINAL_TOOLS } from './tools.js';
import { N_ } from '../public/js/i18n.js';

export const PROVIDERS = {
  anthropic: { id: 'anthropic', label: 'Anthropic (Claude)', kind: 'anthropic', envKey: ['ANTHROPIC_API_KEY', 'ANTHROPIC_AUTH_TOKEN'] },
  openai: {
    id: 'openai', label: 'OpenAI', kind: 'compat', baseUrl: 'https://api.openai.com/v1',
    envKey: ['OPENAI_API_KEY'], envModel: 'OPENAI_MODEL', envUrl: 'OPENAI_BASE_URL', keyRequired: true, tokenParam: 'max_completion_tokens',
  },
  openrouter: {
    id: 'openrouter', label: 'OpenRouter', kind: 'compat', baseUrl: 'https://openrouter.ai/api/v1',
    envKey: ['OPENROUTER_API_KEY'], envModel: 'OPENROUTER_MODEL', envUrl: 'OPENROUTER_BASE_URL', keyRequired: true, headers: { 'X-Title': 'Dialogue Devil' },
  },
  local: {
    id: 'local', label: 'Local / OpenAI-compatible', kind: 'compat', baseUrl: 'http://localhost:11434/v1',
    envKey: ['DD_LOCAL_AI_KEY'], envModel: 'DD_LOCAL_AI_MODEL', envUrl: 'DD_LOCAL_AI_URL', keyRequired: false, customUrl: true,
    // Small context windows are common on local models.
    contextChars: 24000,
  },
};

export const DEFAULT_PROVIDER = PROVIDERS[process.env.DD_AI_PROVIDER] ? process.env.DD_AI_PROVIDER : 'anthropic';
const MAX_ITERATIONS = 6;
const MAX_OUTPUT = 8000;

export const serverKey = (cfg) => cfg.envKey.map((k) => process.env[k]).find(Boolean) || '';
export const serverUrl = (cfg) => (cfg.envUrl && process.env[cfg.envUrl]) || cfg.baseUrl || '';
export const serverModel = (cfg) => (cfg.envModel && process.env[cfg.envModel]) || '';

// What the browser needs to show each service (never the keys themselves).
export function providersStatus() {
  return Object.fromEntries(Object.values(PROVIDERS).filter((c) => c.kind === 'compat').map((c) => [c.id, {
    label: c.label,
    serverKey: Boolean(serverKey(c)),
    keyRequired: c.keyRequired,
    defaultModel: serverModel(c),
    baseUrl: serverUrl(c),
    customUrl: Boolean(c.customUrl),
  }]));
}

// An error carrying a translatable message key and its values.
export class ProviderError extends Error {
  constructor(key, { status = 502, vars = {}, provider = '' } = {}) {
    super(key);
    Object.assign(this, { status, vars, provider, providerError: true });
  }
}

function normalizeUrl(raw) {
  let u;
  try { u = new URL(String(raw || '').trim()); } catch { return null; }
  if (u.protocol !== 'http:' && u.protocol !== 'https:') return null;
  u.hash = '';
  u.search = '';
  return u.toString().replace(/\/+$/, '');
}

// The server fetches the address it is given, so a custom address is taken
// only from a trusted caller: this computer, any device once an access code
// is set, or anyone with DD_ALLOW_REMOTE_AI_URL=1. Everyone else gets the
// server's configured address (DD_LOCAL_AI_URL or the Ollama default).
export function resolveBaseUrl(cfg, requested, { trusted }) {
  const fallback = serverUrl(cfg);
  if (!cfg.customUrl || !requested) return normalizeUrl(fallback);
  const url = normalizeUrl(requested);
  if (!url) throw new ProviderError(N_('That server address is not a valid http(s) URL.'), { status: 400 });
  if (url === normalizeUrl(fallback) || trusted || process.env.DD_ALLOW_REMOTE_AI_URL === '1') return url;
  throw new ProviderError(N_('A custom AI server address can be set from the computer running Dialogue Devil, or from other devices once an access code is set (DD_ACCESS_CODE).'), { status: 403 });
}

function headersFor(cfg, apiKey) {
  const key = apiKey || serverKey(cfg);
  if (cfg.keyRequired && !key) throw new ProviderError(N_('No API key for {service}. Add one in Settings, or set {env} for the server.'), { status: 401, vars: { service: cfg.label, env: cfg.envKey[0] }, provider: cfg.id });
  return { 'content-type': 'application/json', accept: 'text/event-stream, application/json', ...(key ? { authorization: `Bearer ${key}` } : {}), ...(cfg.headers || {}) };
}

async function request(cfg, url, init) {
  try {
    return await fetch(url, init);
  } catch (err) {
    if (init.signal?.aborted) throw err;
    throw new ProviderError(N_('Could not reach {url}. Is the server running, and is the address right?'), { status: 502, vars: { url }, provider: cfg.id });
  }
}

async function failure(cfg, res) {
  const raw = await res.text().catch(() => '');
  let reason = raw;
  try { const j = JSON.parse(raw); reason = j.error?.message || j.message || j.error || raw; } catch { /* plain text */ }
  reason = String(typeof reason === 'string' ? reason : JSON.stringify(reason)).slice(0, 400) || `HTTP ${res.status}`;
  const vars = { service: cfg.label, reason };
  if (res.status === 401 || res.status === 403) return new ProviderError(N_('{service} rejected the API key: {reason}'), { status: res.status, vars, provider: cfg.id });
  if (res.status === 404) return new ProviderError(N_('{service}: model or address not found ({reason}). Check the model name and the server address.'), { status: 404, vars, provider: cfg.id });
  if (res.status === 429) return new ProviderError(N_('{service} is rate limiting: {reason}'), { status: 429, vars, provider: cfg.id });
  if (/context|too long|maximum.*tokens|token limit/i.test(reason)) return new ProviderError(N_('The request is longer than this model\'s context window ({reason}). Use a model with a larger context, or raise the context length in the local server.'), { status: 400, vars, provider: cfg.id });
  return Object.assign(new ProviderError(N_('{service} error: {reason}'), { status: res.status, vars, provider: cfg.id }), { rawReason: reason });
}

// Models the service offers, for the picker in Settings.
export async function listModels({ provider, apiKey, baseUrl, trusted, signal }) {
  const cfg = PROVIDERS[provider];
  if (!cfg || cfg.kind !== 'compat') throw new ProviderError(N_('Unknown AI service.'), { status: 400 });
  const base = resolveBaseUrl(cfg, baseUrl, { trusted });
  const res = await request(cfg, `${base}/models`, { headers: headersFor(cfg, apiKey), signal });
  if (!res.ok) throw await failure(cfg, res);
  const body = await res.json().catch(() => ({}));
  let ids = (Array.isArray(body.data) ? body.data : Array.isArray(body.models) ? body.models : [])
    .map((m) => (typeof m === 'string' ? m : m.id || m.name || m.model))
    .filter((x) => typeof x === 'string' && x);
  // OpenAI lists every model it has; keep the ones that chat.
  if (provider === 'openai') ids = ids.filter((id) => !/embed|whisper|tts|dall-e|davinci|babbage|moderation|image|audio|realtime|transcribe|search/i.test(id));
  return { baseUrl: base, models: [...new Set(ids)].sort() };
}

const toOpenAiTools = () => TOOLS.map((t) => ({ type: 'function', function: { name: t.name, description: t.description, parameters: t.input_schema } }));

// Reads a streamed (or, from servers that ignore `stream`, a plain JSON)
// chat completion. Text deltas go to onText as they arrive.
async function readCompletion(cfg, res, onText) {
  const out = { text: '', calls: [], finish: null };
  const take = (choice) => {
    if (!choice) return;
    const d = choice.delta || choice.message || {};
    if (typeof d.content === 'string' && d.content) { out.text += d.content; onText(d.content); }
    for (const tc of d.tool_calls || []) {
      let i = Number.isInteger(tc.index) ? tc.index : out.calls.findIndex((c) => c.id && c.id === tc.id);
      if (i < 0) i = out.calls.length;
      const c = (out.calls[i] ||= { id: '', name: '', arguments: '' });
      if (tc.id) c.id = tc.id;
      if (tc.function?.name) c.name += tc.function.name;
      const args = tc.function?.arguments;
      if (args != null) c.arguments += typeof args === 'string' ? args : JSON.stringify(args);
    }
    if (choice.finish_reason) out.finish = choice.finish_reason;
  };
  const fail = (j) => { throw new ProviderError(N_('{service} error: {reason}'), { vars: { service: cfg.label, reason: String(j.error?.message || j.error).slice(0, 400) }, provider: cfg.id }); };
  if (!/event-stream/.test(res.headers.get('content-type') || '')) {
    const j = await res.json().catch(() => ({}));
    if (j.error) fail(j);
    take(j.choices?.[0]);
  } else {
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buf = '';
    const line = (l) => {
      if (!l.startsWith('data:')) return; // comments (": keep-alive"), event names
      const data = l.slice(5).trim();
      if (!data || data === '[DONE]') return;
      let j;
      try { j = JSON.parse(data); } catch { return; }
      if (j.error) fail(j);
      take(j.choices?.[0]);
    };
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      buf += decoder.decode(value, { stream: true });
      let idx;
      while ((idx = buf.indexOf('\n')) >= 0) {
        line(buf.slice(0, idx).replace(/\r$/, ''));
        buf = buf.slice(idx + 1);
      }
    }
    if (buf) line(buf);
  }
  out.calls = out.calls.filter((c) => c.name).map((c, i) => ({ ...c, id: c.id || `call_${i}` }));
  return out;
}

// Runs one writer turn on an OpenAI-compatible service. `system` is the
// system prompt as one string; `forceTool` names the tool a mode must answer
// with (a review report, an in-character speech).
export async function runCompatChat({ provider, apiKey, baseUrl, model, system, messages, forceTool, trusted, send, signal, L }) {
  const cfg = PROVIDERS[provider];
  const base = resolveBaseUrl(cfg, baseUrl, { trusted });
  const name = String(model || serverModel(cfg) || '').trim().slice(0, 200);
  if (!name) throw new ProviderError(N_('Pick a model for {service} in Settings.'), { status: 400, vars: { service: cfg.label }, provider });
  const headers = headersFor(cfg, apiKey);
  const history = [{ role: 'system', content: system }, ...messages];
  let tools = true;
  let force = forceTool || '';

  for (let iter = 0; iter < MAX_ITERATIONS; iter++) {
    const body = { model: name, messages: history, stream: true, [cfg.tokenParam || 'max_tokens']: MAX_OUTPUT };
    if (tools) {
      body.tools = toOpenAiTools();
      if (force && iter === 0) body.tool_choice = { type: 'function', function: { name: force } };
    }
    const res = await request(cfg, `${base}/chat/completions`, { method: 'POST', headers, body: JSON.stringify(body), signal });
    if (!res.ok) {
      const err = await failure(cfg, res);
      // Servers or models without (forced) tool calling: step down once each.
      if ((res.status === 400 || res.status === 422) && err.rawReason && /tool|function/i.test(err.rawReason)) {
        if (force) { force = ''; iter--; continue; }
        if (tools) {
          tools = false;
          iter--;
          send('notice', { message: L('This model does not take tools, so it can talk but cannot make proposals. Pick a model with tool (function) calling for the full features.') });
          continue;
        }
      }
      throw err;
    }
    const out = await readCompletion(cfg, res, (delta) => send('text', { delta }));
    if (out.finish === 'content_filter') {
      send('refusal', { message: L('The model declined this request.'), category: null });
      break;
    }
    if (!out.calls.length) {
      if (out.finish === 'length') send('notice', { message: L('The reply hit its length limit.') });
      break;
    }
    if (out.finish === 'length') {
      send('error', { message: L('A proposal was cut off at the length limit. Try asking for less at once.') });
      break;
    }
    history.push({ role: 'assistant', content: out.text || null, tool_calls: out.calls.map((c) => ({ id: c.id, type: 'function', function: { name: c.name, arguments: c.arguments || '{}' } })) });
    let terminal = true;
    for (const c of out.calls) {
      let input;
      try { input = JSON.parse(c.arguments || '{}'); } catch { input = undefined; }
      const r = input === undefined ? { ok: false, error: 'INVALID_JSON: the arguments are not valid JSON' } : checkTool(c.name, input);
      if (!r.ok) {
        history.push({ role: 'tool', tool_call_id: c.id, content: JSON.stringify({ INVALID_INPUT: r.error }) });
        terminal = false;
        continue;
      }
      if (!TERMINAL_TOOLS.has(c.name)) terminal = false;
      send('proposal', { tool: c.name, id: c.id, input: r.data });
      history.push({ role: 'tool', tool_call_id: c.id, content: TOOL_ACK[c.name] });
    }
    if (terminal) break;
  }
}
