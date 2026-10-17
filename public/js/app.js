import { html, render, useEffect, useState, cx } from './lib.js';
import {
  state, useStore, boot, navigate, undo, redo, canUndo, canRedo, setSetting, aiAvailable, resolveConflict,
} from './store.js';
import { Icon, TacticsDatalist, CharDot } from './components/ui.js';
import { Sparkline } from './components/viz.js';
import { valueArc, profileCompleteness } from './analysis.js';
import { CHARACTER_SECTIONS } from './mckee.js';
import { characterById, sceneById } from './model.js';
import { addCharacter, addScene } from './actions.js';
import { StoryView } from './views/story.js';
import { CharacterView } from './views/character.js';
import { SceneView } from './views/scene.js';
import { HandbookView } from './views/handbook.js';
import { SettingsView } from './views/settings.js';
import { AssistantDrawer } from './views/assistant.js';
import { ProjectsModal } from './views/projects.js';

export function Logo({ size = 28 }) {
  return html`<svg class="logo" width=${size} height=${size} viewBox="0 0 32 32" aria-hidden="true">
    <path class="logo-horn" d="M8 9 L5 2 L12 7 Z M24 9 L27 2 L20 7 Z" />
    <path class="logo-bubble" d="M6 8h20a3 3 0 0 1 3 3v10a3 3 0 0 1-3 3H15l-6 5v-5H6a3 3 0 0 1-3-3V11a3 3 0 0 1 3-3z" />
    <path class="logo-lines" d="M9 14h14M9 18h9" />
  </svg>`;
}

function SaveStatus() {
  const map = { idle: '', pending: 'Unsaved…', saving: 'Saving…', saved: 'Saved', error: 'Not saved', conflict: 'Conflict' };
  return html`<span class=${cx('save-status', state.saving)} title=${state.error || ''}>${map[state.saving] || ''}</span>`;
}

function Sidebar({ open, onClose, onProjects }) {
  const p = state.project;
  const r = state.route;
  const go = (path) => { navigate(path); onClose(); };
  return html`<nav class=${cx('sidebar', open && 'open')} aria-label="Main">
    <div class="brand">
      <${Logo} />
      <div>
        <div class="brand-name">Dialogue Devil</div>
        <div class="brand-sub">after McKee's <em>Dialogue</em></div>
      </div>
    </div>
    <button type="button" class="project-switch" onClick=${onProjects} title="Switch or create project">
      <span class="project-title">${p?.title || '…'}</span>
      <span class="muted small">${(p?.medium || '').toUpperCase()} · switch ▾</span>
    </button>

    <div class="nav-group">
      <a href="#/story" class=${cx('nav-item', r.name === 'story' && 'active')} onClick=${() => onClose()}><${Icon} name="story" />Story</a>
      <a href="#/handbook" class=${cx('nav-item', r.name === 'handbook' && 'active')} onClick=${() => onClose()}><${Icon} name="book" />Handbook</a>
    </div>

    <div class="nav-head"><span>Cast</span><button type="button" class="icon-btn" aria-label="Add character" title="Add character" onClick=${() => { addCharacter(); onClose(); }}><${Icon} name="plus" /></button></div>
    <div class="nav-group">
      ${(p?.characters || []).map((c) => {
        const depth = profileCompleteness(c, CHARACTER_SECTIONS).overall;
        return html`<a href=${`#/character/${c.id}`} class=${cx('nav-item', r.name === 'character' && r.id === c.id && 'active')} onClick=${() => onClose()}>
          <${CharDot} character=${c} />
          <span class="nav-label">${c.name}</span>
          <span class="nav-meta" title="Profile depth">${depth}%</span>
        </a>`;
      })}
      ${!p?.characters?.length ? html`<button type="button" class="nav-empty" onClick=${() => go('story')}>No characters yet</button>` : ''}
    </div>

    <div class="nav-head"><span>Scenes</span><button type="button" class="icon-btn" aria-label="Add scene" title="Add scene" onClick=${() => { addScene(); onClose(); }}><${Icon} name="plus" /></button></div>
    <div class="nav-group">
      ${(p?.scenes || []).map((s) => {
        const arc = valueArc(s)[0];
        return html`<a href=${`#/scene/${s.id}/${s.beats.length ? 'workshop' : 'design'}`} class=${cx('nav-item scene-item', r.name === 'scene' && r.id === s.id && 'active')} onClick=${() => onClose()}>
          <${Icon} name="scene" />
          <span class="nav-label">${s.title}</span>
          ${arc ? html`<${Sparkline} points=${arc.points} width=${46} height=${18} />` : ''}
        </a>`;
      })}
    </div>

    <div class="sidebar-foot">
      <a href="#/settings" class=${cx('nav-item', r.name === 'settings' && 'active')} onClick=${() => onClose()}><${Icon} name="gear" />Settings</a>
      <div class="ai-pill-row">
        <span class=${cx('ai-pill', aiAvailable() ? 'on' : 'off')}>${aiAvailable() ? (state.ai?.mock ? 'AI · mock' : 'AI · on') : 'AI · off'}</span>
        <${SaveStatus} />
      </div>
    </div>
  </nav>`;
}

function Topbar({ onMenu }) {
  const p = state.project;
  const r = state.route;
  let crumb = 'Story';
  if (r.name === 'character') crumb = (p && characterById(p, r.id)?.name) || 'Character';
  if (r.name === 'scene') crumb = (p && sceneById(p, r.id)?.title) || 'Scene';
  if (r.name === 'handbook') crumb = 'Handbook';
  if (r.name === 'settings') crumb = 'Settings';
  return html`<header class="topbar">
    <button type="button" class="icon-btn menu-btn" aria-label="Open menu" onClick=${onMenu}><${Icon} name="menu" /></button>
    <div class="crumb"><span class="muted">${p?.title || ''}</span><span class="crumb-sep">/</span><strong>${crumb}</strong></div>
    <div class="topbar-actions">
      <button type="button" class="icon-btn" title="Undo (Ctrl+Z outside text fields)" aria-label="Undo" disabled=${!canUndo()} onClick=${undo}><${Icon} name="undo" /></button>
      <button type="button" class="icon-btn" title="Redo" aria-label="Redo" disabled=${!canRedo()} onClick=${redo}><${Icon} name="redo" /></button>
      <button type="button" class=${cx('btn', state.settings.drawerOpen ? 'btn-quiet active' : 'btn-quiet')} onClick=${() => setSetting('drawerOpen', !state.settings.drawerOpen)} aria-pressed=${state.settings.drawerOpen}>
        <${Icon} name="flame" /> Devil's Advocate
      </button>
    </div>
  </header>`;
}

function Main() {
  const r = state.route;
  const p = state.project;
  if (!p) return html`<div class="loading">Loading…</div>`;
  if (r.name === 'character') {
    const c = characterById(p, r.id);
    return c ? html`<${CharacterView} key=${c.id} character=${c} tab=${r.tab} />` : html`<${NotFound} />`;
  }
  if (r.name === 'scene') {
    const s = sceneById(p, r.id);
    return s ? html`<${SceneView} key=${s.id} scene=${s} tab=${r.tab} />` : html`<${NotFound} />`;
  }
  if (r.name === 'handbook') return html`<${HandbookView} section=${r.id} />`;
  if (r.name === 'settings') return html`<${SettingsView} />`;
  return html`<${StoryView} />`;
}

function NotFound() {
  return html`<div class="page"><div class="empty"><div class="empty-title">Not found in this project.</div><a href="#/story">Back to the story</a></div></div>`;
}

// Another device saved this project after this one loaded it. Nothing is
// overwritten until the writer chooses.
function ConflictBanner() {
  const c = state.conflict;
  const [busy, setBusy] = useState(false);
  if (!c) return null;
  const when = c.remote.updatedAt ? new Date(c.remote.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
  const choose = async (choice) => {
    if (choice === 'mine' && !confirm('Replace the other device\'s version with the one on this screen?')) return;
    setBusy(true);
    try { await resolveConflict(choice); } finally { setBusy(false); }
  };
  return html`<div class="banner conflict" role="alert">
    <div><strong>This project was changed on another device${when ? ` at ${when}` : ''}.</strong> Your edits here are kept in this browser and have not been saved over it.</div>
    <div class="banner-actions">
      <button type="button" class="btn" disabled=${busy} onClick=${() => choose('theirs')}>Load the latest</button>
      <button type="button" class="btn btn-quiet" disabled=${busy} onClick=${() => choose('copy')}>Save mine as a copy</button>
      <button type="button" class="btn btn-quiet danger" disabled=${busy} onClick=${() => choose('mine')}>Keep mine</button>
    </div>
  </div>`;
}

function Toast() {
  if (!state.toast) return null;
  return html`<div class=${cx('toast', state.toast.kind)} role="status">${state.toast.message}</div>`;
}

function App() {
  useStore();
  const [menu, setMenu] = useState(false);
  const [projects, setProjects] = useState(false);
  useEffect(() => {
    const onKey = (e) => {
      const tag = (e.target.tagName || '').toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select' || e.target.isContentEditable) return;
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) redo(); else undo();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
  const drawer = state.settings.drawerOpen;
  // The scrim is always rendered and toggled with `hidden`: inserting it on
  // open would let Preact reuse the .main-col element mid-click, and the same
  // tap that opened the menu would close it.
  return html`<div class=${cx('shell', drawer && 'with-drawer')}>
    <${TacticsDatalist} />
    <${Sidebar} open=${menu} onClose=${() => setMenu(false)} onProjects=${() => { setMenu(false); setProjects(true); }} />
    <div class="scrim" hidden=${!menu} onClick=${() => setMenu(false)}></div>
    <div class="main-col">
      <${Topbar} onMenu=${() => setMenu(true)} />
      <main id="main"><${ConflictBanner} />${state.error && state.saving === 'error' ? html`<div class="banner error">${state.error}</div>` : ''}<${Main} /></main>
    </div>
    ${drawer && state.project ? html`<div class="drawer-scrim" onClick=${() => setSetting('drawerOpen', false)}></div><${AssistantDrawer} />` : ''}
    <${ProjectsModal} open=${projects} onClose=${() => setProjects(false)} />
    <${Toast} />
  </div>`;
}

render(html`<${App} />`, document.getElementById('app'));
boot().catch((err) => {
  document.getElementById('app').insertAdjacentHTML('beforeend', `<div class="banner error">Could not start: ${String(err.message).replace(/</g, '&lt;')}</div>`);
});
