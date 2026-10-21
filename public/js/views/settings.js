import { html, useState, useEffect, cx, download, slug } from '../lib.js';
import { state, setSetting, mutate, act, createAndOpen, removeProject, toast, aiAvailable } from '../store.js';
import { Card, Field, Select, Icon, rich } from '../components/ui.js';
import { normalizeProject } from '../model.js';
import { networkInfo } from '../api.js';
import { tr, LANGS } from '../i18n.js';

const code = (s) => html`<code>${s}</code>`;
const kbd = (s) => html`<kbd>${s}</kbd>`;

// Addresses other devices on the same network can open, and how they are
// guarded. The server reports them; this browser cannot see them itself.
function DevicesCard() {
  const [net, setNet] = useState(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => { networkInfo().then(setNet, () => setFailed(true)); }, []);
  // navigator.clipboard exists only in secure contexts (localhost counts, a
  // LAN address over http does not), so fall back to a selection copy.
  const copy = async (url) => {
    try {
      if (navigator.clipboard) await navigator.clipboard.writeText(url);
      else {
        const ta = Object.assign(document.createElement('textarea'), { value: url });
        document.body.append(ta);
        ta.select();
        const done = document.execCommand('copy');
        ta.remove();
        if (!done) throw new Error('copy refused');
      }
      toast(tr('Address copied'));
    } catch {
      toast(url);
    }
  };
  return html`<${Card} title=${tr('Other devices')} sub=${tr('Open Dialogue Devil on a phone, tablet or another computer on the same Wi-Fi or LAN. Every device works on the same projects; changes appear on the others within a few seconds.')}>
    ${failed ? html`<p class="small error-text">${tr('Could not read the server\'s network settings.')}</p>` : !net ? html`<p class="small muted">${tr('Checking…')}</p>` : !net.open
      ? html`<p class="small">${rich('The server is bound to {host}, so only this computer can reach it. Restart it with {cmd} to open it to your network.', { host: code(net.host), cmd: code('HOST=0.0.0.0 npm start') })}</p>`
      : html`
        ${net.urls.length ? html`<div class="net-urls">${net.urls.map((u) => html`<div class="net-url"><code>${u}</code><button type="button" class="btn btn-quiet" onClick=${() => copy(u)}>${tr('Copy')}</button></div>`)}</div>`
          : html`<p class="small">${tr('Open to the network, but the server found no network address. Is this computer connected to Wi-Fi or a cable?')}</p>`}
        <ul class="small">
          <li>${net.allowPublic ? rich('{strong} (DD_ALLOW_PUBLIC=1): anyone who can reach this port can connect.', { strong: html`<strong>${tr('Public addresses allowed')}</strong>` }) : tr('Only devices on your local network can connect: private addresses (home/office LAN, VPNs like Tailscale) and this computer\'s own subnet.')}</li>
          <li>${net.accessCode ? tr('Other devices must enter the access code once (DD_ACCESS_CODE); this computer never needs it.') : rich(state.ai?.serverKey ? 'No access code: anyone on your network can open it and use the server\'s API key. Start the server with {cmd} to require one.' : 'No access code: anyone on your network can open it. Start the server with {cmd} to require one.', { cmd: code('DD_ACCESS_CODE=…') })}</li>
          <li>${tr('If another device cannot connect, allow port {port} for Node.js in this computer\'s firewall.', { port: net.port })}</li>
          <li>${rich('Your API key in this browser stays here; enter it on each device that should use AI (or set {env} on the server).', { env: code('ANTHROPIC_API_KEY') })}</li>
        </ul>`}
  </${Card}>`;
}

function LanguageCard() {
  const s = state.settings;
  const p = state.project;
  return html`<${Card} title=${tr('Language')} sub=${tr('The interface and the dialogue can each be in English or Italian.')}>
    <${Field} label=${tr('Interface language')} hint=${tr('Menus, the handbook, the analyzer\'s messages and the AI\'s replies. Saved in this browser.')}>
      <div class="segmented">${LANGS.map((l) => html`<button type="button" lang=${l.id} class=${cx(s.lang === l.id && 'active')} onClick=${() => setSetting('lang', l.id)}>${l.name}</button>`)}</div>
    </${Field}>
    <${Field} label=${tr('Dialogue language of this project')} hint=${tr('The analyzer reads this project\'s lines with the rules for this language (clichés, on-the-nose patterns, gerunds…), the table read uses its voices and the AI writes lines in it. Saved with the project.')}>
      <div class="segmented">${LANGS.map((l) => html`<button type="button" lang=${l.id} class=${cx(p.lang === l.id && 'active')} onClick=${() => act((x) => { x.lang = l.id; })}>${l.name}</button>`)}</div>
    </${Field}>
  </${Card}>`;
}

export function SettingsView() {
  const s = state.settings;
  const ai = state.ai || {};
  const p = state.project;
  const [showKey, setShowKey] = useState(false);
  const importFile = async (file) => {
    try {
      const data = JSON.parse(await file.text());
      await createAndOpen({ project: normalizeProject(data) });
      toast(tr('Imported “{title}”', { title: data.title || tr('project') }));
    } catch (err) {
      toast(tr('Import failed: {reason}', { reason: err.message }), 'error');
    }
  };
  return html`<div class="page settings">
    <h1>${tr('Settings')}</h1>
    <div class="two-col">
      <${LanguageCard} />
      <${Card} title=${tr('Appearance')}>
        <${Field} label=${tr('Theme')}>
          <div class="segmented">${[['system', tr('System')], ['light', tr('Light')], ['dark', tr('Dark')], ['terminal', tr('Terminal')]].map(([id, label]) => html`<button type="button" class=${cx(s.theme === id && 'active')} onClick=${() => setSetting('theme', id)}>${label}</button>`)}</div>
          ${s.theme === 'terminal' ? html`<span class="field-hint">${tr('A minimal theme: one monospace typeface, green on black, square corners, no shadows.')}</span>` : ''}
        </${Field}>
        <label class="toggle"><input type="checkbox" checked=${s.showSubtext} onChange=${(e) => setSetting('showSubtext', e.currentTarget.checked)} /> ${tr('Show subtext rows in the workshop')}</label>
      </${Card}>
    </div>

    <${Card} title=${tr('AI collaborator (optional)')} sub=${tr('Powers the coach, in-character rehearsal, scene doctor, beat partner, line lab and AI double-check. Everything else works offline.')}>
      <p class="small">${tr('Status:')} <span class=${cx('ai-pill', aiAvailable() ? 'on' : 'off')}>${ai.mock ? tr('mock mode') : ai.serverKey ? tr('server key configured') : s.apiKey ? tr('using your key') : tr('off')}</span></p>
      <div class="two-col tight">
        <${Field} label=${tr('Anthropic API key')} hint=${tr('Stored only in this browser\'s local storage and sent to your own Dialogue Devil server with each AI request. The server never writes it to disk. Leave empty if the server has ANTHROPIC_API_KEY set.')}>
          <div class="key-row">
            <input class="input" type=${showKey ? 'text' : 'password'} value=${s.apiKey} placeholder=${ai.serverKey ? tr('Server key in use') : 'sk-ant-…'} autocomplete="off" onInput=${(e) => setSetting('apiKey', e.currentTarget.value.trim())} />
            <button type="button" class="btn btn-quiet" onClick=${() => setShowKey(!showKey)}>${showKey ? tr('Hide') : tr('Show')}</button>
          </div>
        </${Field}>
        <${Field} label=${tr('Model')}>
          <${Select} value=${s.model} onChange=${(v) => setSetting('model', v)} options=${(ai.models || []).map((m) => [m.id, m.id === ai.defaultModel ? tr('{model} (default)', { model: m.label }) : m.label])} placeholder=${tr('Server default ({model})', { model: ai.defaultModel || 'claude-opus-5-5' })} />
        </${Field}>
      </div>
    </${Card}>

    <${DevicesCard} />

    <${Card} title=${tr('This project')}>
      <div class="settings-actions">
        <button type="button" class="btn" onClick=${() => download(`${slug(p.title)}.dialoguedevil.json`, JSON.stringify(p, null, 2), 'application/json')}><${Icon} name="download" /> ${tr('Export JSON')}</button>
        <label class="btn btn-quiet file-btn">${tr('Import JSON')}<input type="file" accept="application/json,.json" onChange=${(e) => e.currentTarget.files[0] && importFile(e.currentTarget.files[0])} /></label>
        <button type="button" class="btn btn-quiet" onClick=${() => createAndOpen({ title: tr('Untitled story') })}><${Icon} name="plus" /> ${tr('New project')}</button>
        <button type="button" class="btn btn-quiet" onClick=${() => createAndOpen({ sample: true })}>${tr('New copy of the sample')}</button>
        <button type="button" class="btn btn-quiet" onClick=${() => { if (confirm(tr('Clear all AI conversations in this project?'))) mutate((x) => { x.chats = {}; }); }}>${tr('Clear AI conversations')}</button>
        <button type="button" class="btn btn-quiet danger" onClick=${() => { if (confirm(tr('Delete “{title}” permanently?', { title: p.title }))) removeProject(p.id); }}><${Icon} name="trash" /> ${tr('Delete project')}</button>
      </div>
      <p class="small muted">${rich('Projects are saved automatically to {dir} on the server, with a backup copy in this browser. If two devices edit the same project at once, nothing is overwritten: you choose which version to keep.', { dir: code('data/projects/') })}</p>
    </${Card}>

    <${Card} title=${tr('Keyboard')}>
      <ul class="small">
        <li>${rich('{enter} in the composer adds the line; {shift}+{enter} starts a new line within it.', { enter: kbd(tr('Enter')), shift: kbd(tr('Shift')) })}</li>
        <li>${rich('{ctrl}+{z} / {shift}+{ctrl}+{z} undo and redo project changes (outside text fields).', { ctrl: kbd('Ctrl/⌘'), z: kbd('Z'), shift: kbd(tr('Shift')) })}</li>
        <li>${rich('During a table read, {f} flags the line being read; {esc} stops.', { f: kbd('F'), esc: kbd('Esc') })}</li>
      </ul>
    </${Card}>
  </div>`;
}
