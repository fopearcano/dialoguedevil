import { html, useState, cx, download, slug } from '../lib.js';
import { state, setSetting, mutate, createAndOpen, removeProject, toast, aiAvailable } from '../store.js';
import { Card, Field, Select, Icon } from '../components/ui.js';
import { normalizeProject } from '../model.js';

export function SettingsView() {
  const s = state.settings;
  const ai = state.ai || {};
  const p = state.project;
  const [showKey, setShowKey] = useState(false);
  const importFile = async (file) => {
    try {
      const data = JSON.parse(await file.text());
      await createAndOpen({ project: normalizeProject(data) });
      toast(`Imported “${data.title || 'project'}”`);
    } catch (err) {
      toast(`Import failed: ${err.message}`, 'error');
    }
  };
  return html`<div class="page settings">
    <h1>Settings</h1>
    <div class="two-col">
      <${Card} title="Appearance">
        <${Field} label="Theme">
          <div class="segmented">${[['system', 'System'], ['light', 'Light'], ['dark', 'Dark']].map(([id, label]) => html`<button type="button" class=${cx(s.theme === id && 'active')} onClick=${() => setSetting('theme', id)}>${label}</button>`)}</div>
        </${Field}>
        <label class="toggle"><input type="checkbox" checked=${s.showSubtext} onChange=${(e) => setSetting('showSubtext', e.currentTarget.checked)} /> Show subtext rows in the workshop</label>
      </${Card}>

      <${Card} title="AI collaborator (optional)" sub="Powers the coach, in-character rehearsal, scene doctor, beat partner and line lab. Everything else works offline.">
        <p class="small">Status: <span class=${cx('ai-pill', aiAvailable() ? 'on' : 'off')}>${ai.mock ? 'mock mode' : ai.serverKey ? 'server key configured' : s.apiKey ? 'using your key' : 'off'}</span></p>
        <${Field} label="Anthropic API key" hint="Stored only in this browser's local storage and sent to your own Dialogue Devil server with each AI request. The server never writes it to disk. Leave empty if the server has ANTHROPIC_API_KEY set.">
          <div class="key-row">
            <input class="input" type=${showKey ? 'text' : 'password'} value=${s.apiKey} placeholder=${ai.serverKey ? 'Server key in use' : 'sk-ant-…'} autocomplete="off" onInput=${(e) => setSetting('apiKey', e.currentTarget.value.trim())} />
            <button type="button" class="btn btn-quiet" onClick=${() => setShowKey(!showKey)}>${showKey ? 'Hide' : 'Show'}</button>
          </div>
        </${Field}>
        <${Field} label="Model">
          <${Select} value=${s.model} onChange=${(v) => setSetting('model', v)} options=${(ai.models || []).map((m) => [m.id, m.label])} placeholder=${`Server default (${ai.defaultModel || 'claude-opus-5-5'})`} />
        </${Field}>
      </${Card}>
    </div>

    <${Card} title="This project">
      <div class="settings-actions">
        <button type="button" class="btn" onClick=${() => download(`${slug(p.title)}.dialoguedevil.json`, JSON.stringify(p, null, 2), 'application/json')}><${Icon} name="download" /> Export JSON</button>
        <label class="btn btn-quiet file-btn">Import JSON<input type="file" accept="application/json,.json" onChange=${(e) => e.currentTarget.files[0] && importFile(e.currentTarget.files[0])} /></label>
        <button type="button" class="btn btn-quiet" onClick=${() => createAndOpen({ title: 'Untitled story' })}><${Icon} name="plus" /> New project</button>
        <button type="button" class="btn btn-quiet" onClick=${() => createAndOpen({ sample: true })}>New copy of the sample</button>
        <button type="button" class="btn btn-quiet" onClick=${() => { if (confirm('Clear all AI conversations in this project?')) mutate((x) => { x.chats = {}; }); }}>Clear AI conversations</button>
        <button type="button" class="btn btn-quiet danger" onClick=${() => { if (confirm(`Delete “${p.title}” permanently?`)) removeProject(p.id); }}><${Icon} name="trash" /> Delete project</button>
      </div>
      <p class="small muted">Projects are saved automatically to <code>data/projects/</code> on the server, with a backup copy in this browser.</p>
    </${Card}>

    <${Card} title="Keyboard">
      <ul class="small">
        <li><kbd>Enter</kbd> in the composer adds the line; <kbd>Shift</kbd>+<kbd>Enter</kbd> starts a new line within it.</li>
        <li><kbd>Ctrl/⌘</kbd>+<kbd>Z</kbd> / <kbd>Shift</kbd>+<kbd>Ctrl/⌘</kbd>+<kbd>Z</kbd> undo and redo project changes (outside text fields).</li>
      </ul>
    </${Card}>
  </div>`;
}
