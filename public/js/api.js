// REST + server-sent-events client for the Dialogue Devil server.

async function json(res) {
  if (res.status === 204) return null;
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw Object.assign(new Error(body.error || `HTTP ${res.status}`), { status: res.status, body });
  return body;
}

export const listProjects = () => fetch('/api/projects').then(json);
export const getProject = (id) => fetch(`/api/projects/${encodeURIComponent(id)}`).then(json);
export const createProject = (body) => fetch('/api/projects', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) }).then(json);
export function saveProject(p, { keepalive = false } = {}) {
  const body = JSON.stringify(p);
  // Browsers cap keepalive bodies at 64 KB.
  return fetch(`/api/projects/${encodeURIComponent(p.id)}`, { method: 'PUT', headers: { 'content-type': 'application/json' }, body, keepalive: keepalive && body.length < 60000 }).then(json);
}
export const projectMeta = (id) => fetch(`/api/projects/${encodeURIComponent(id)}/meta`, { cache: 'no-store' }).then(json);
export const networkInfo = () => fetch('/api/network').then(json);
export const deleteProject = (id) => fetch(`/api/projects/${encodeURIComponent(id)}`, { method: 'DELETE' }).then(json);
export const aiStatus = () => fetch('/api/ai/status').then(json);

// Streams a chat turn. onEvent(type, data) receives: text, proposal, notice,
// refusal, error, done.
export async function streamChat({ body, apiKey, onEvent, signal }) {
  const headers = { 'content-type': 'application/json' };
  if (apiKey) headers['x-anthropic-key'] = apiKey;
  const res = await fetch('/api/ai/chat', { method: 'POST', headers, body: JSON.stringify(body), signal });
  if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`);
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buf = '';
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    let idx;
    while ((idx = buf.indexOf('\n\n')) >= 0) {
      const chunk = buf.slice(0, idx);
      buf = buf.slice(idx + 2);
      let type = 'message';
      let data = '';
      for (const line of chunk.split('\n')) {
        if (line.startsWith('event:')) type = line.slice(6).trim();
        else if (line.startsWith('data:')) data += line.slice(5).trim();
      }
      if (!data) continue;
      try { onEvent(type, JSON.parse(data)); } catch { /* ignore malformed event */ }
    }
  }
}
