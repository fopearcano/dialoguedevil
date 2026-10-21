import { html, render, useEffect, useState, cx } from './lib.js';
import { tr, fmtTime } from './i18n.js';
import {
  state, useStore, boot, navigate, undo, redo, canUndo, canRedo, setSetting, aiAvailable, resolveConflict, deskScene, activeScene, toggleHelp,
} from './store.js';
import { isTyping } from './shortcuts.js';
import { Icon, TacticsDatalist, CharDot } from './components/ui.js';
import { Sparkline } from './components/viz.js';
import { valueArc, profileCompleteness } from './analysis.js';
import { CHARACTER_SECTIONS, mediumName } from './mckee.js';
import { characterById, sceneById } from './model.js';
import { addCharacter, addScene } from './actions.js';
import { StoryView } from './views/story.js';
import { WriteView } from './views/write.js';
import { CharacterView } from './views/character.js';
import { SceneView } from './views/scene.js';
import { HandbookView } from './views/handbook.js';
import { SettingsView } from './views/settings.js';
import { AssistantDrawer } from './views/assistant.js';
import { ProjectsModal } from './views/projects.js';
import { HelpView, ShortcutsModal } from './views/help.js';

export function Logo({ size = 28 }) {
  return html`<svg class="logo" width=${size} height=${size} viewBox="0 0 32 32" aria-hidden="true">
    <path class="logo-horn" d="M8 9 L5 2 L12 7 Z M24 9 L27 2 L20 7 Z" />
    <path class="logo-bubble" d="M6 8h20a3 3 0 0 1 3 3v10a3 3 0 0 1-3 3H15l-6 5v-5H6a3 3 0 0 1-3-3V11a3 3 0 0 1 3-3z" />
    <path class="logo-lines" d="M9 14h14M9 18h9" />
  </svg>`;
}

function SaveStatus() {
  const map = { idle: '', pending: tr('Unsaved…'), saving: tr('Saving…'), saved: tr('Saved'), error: tr('Not saved'), conflict: tr('Conflict') };
  return html`<span class=${cx('save-status', state.saving)} title=${state.error || ''}>${map[state.saving] || ''}</span>`;
}

function Sidebar({ open, onClose, onProjects }) {
  const p = state.project;
  const r = state.route;
  const desk = r.name === 'write' ? deskScene(p, r.id) : null;
  const go = (path) => { navigate(path); onClose(); };
  return html`<nav class=${cx('sidebar', open && 'open')} aria-label=${tr('Main')}>
    <div class="brand">
      <${Logo} />
      <div>
        <div class="brand-name">Dialogue Devil</div>
        <div class="brand-sub">${tr('after McKee\'s')} <em>Dialogue</em></div>
      </div>
    </div>
    <button type="button" class="project-switch" onClick=${onProjects} title=${tr('Switch or create project')}>
      <span class="project-title">${p?.title || '…'}</span>
      <span class="muted small">${mediumName(p?.medium).toUpperCase()} · ${(p?.lang || '').toUpperCase()} · ${tr('switch')} ▾</span>
    </button>

    <div class="nav-group">
      <a href="#/write" class=${cx('nav-item', r.name === 'write' && 'active')} onClick=${() => onClose()}><${Icon} name="pen" />${tr('Write')}</a>
      <a href="#/story" class=${cx('nav-item', r.name === 'story' && 'active')} onClick=${() => onClose()}><${Icon} name="story" />${tr('Story')}</a>
      <a href="#/handbook" class=${cx('nav-item', r.name === 'handbook' && 'active')} onClick=${() => onClose()}><${Icon} name="book" />${tr('Handbook')}</a>
    </div>

    <div class="nav-head"><span>${tr('Cast')}</span><button type="button" class="icon-btn" aria-label=${tr('Add character')} title=${tr('Add character')} onClick=${() => { addCharacter(); onClose(); }}><${Icon} name="plus" /></button></div>
    <div class="nav-group">
      ${(p?.characters || []).map((c) => {
        const depth = profileCompleteness(c, CHARACTER_SECTIONS).overall;
        return html`<a href=${`#/character/${c.id}`} class=${cx('nav-item', r.name === 'character' && r.id === c.id && 'active')} onClick=${() => onClose()}>
          <${CharDot} character=${c} />
          <span class="nav-label">${c.name}</span>
          <span class="nav-meta" title=${tr('Profile depth')}>${depth}%</span>
        </a>`;
      })}
      ${!p?.characters?.length ? html`<button type="button" class="nav-empty" onClick=${() => go('story')}>${tr('No characters yet')}</button>` : ''}
    </div>

    <div class="nav-head"><span>${tr('Scenes')}</span><button type="button" class="icon-btn" aria-label=${tr('Add scene')} title=${tr('Add scene')} onClick=${() => { addScene(); onClose(); }}><${Icon} name="plus" /></button></div>
    <div class="nav-group">
      ${(p?.scenes || []).map((s) => {
        const arc = valueArc(s)[0];
        const on = (r.name === 'scene' && r.id === s.id) || (r.name === 'write' && desk?.id === s.id);
        return html`<a href=${`#/write/${s.id}`} class=${cx('nav-item scene-item', on && 'active')} onClick=${() => onClose()}>
          <${Icon} name="scene" />
          <span class="nav-label">${s.title}</span>
          ${arc ? html`<${Sparkline} points=${arc.points} width=${46} height=${18} />` : ''}
        </a>`;
      })}
    </div>

    <div class="sidebar-foot">
      <a href="#/settings" class=${cx('nav-item', r.name === 'settings' && 'active')} onClick=${() => onClose()}><${Icon} name="gear" />${tr('Settings')}</a>
      <a href="#/help" class=${cx('nav-item', r.name === 'help' && 'active')} onClick=${() => onClose()}><${Icon} name="help" />${tr('Help')}<span class="nav-meta"><kbd>?</kbd></span></a>
      <div class="ai-pill-row">
        <span class=${cx('ai-pill', aiAvailable() ? 'on' : 'off')}>${aiAvailable() ? (state.ai?.mock ? tr('AI · mock') : tr('AI · on')) : tr('AI · off')}</span>
        <${SaveStatus} />
      </div>
    </div>
  </nav>`;
}

function Topbar({ onMenu }) {
  const p = state.project;
  const r = state.route;
  let crumb = tr('Story');
  if (r.name === 'character') crumb = (p && characterById(p, r.id)?.name) || tr('Character');
  if (r.name === 'scene') crumb = (p && sceneById(p, r.id)?.title) || tr('Scene');
  if (r.name === 'write') crumb = (p && deskScene(p, r.id)?.title) || tr('Write');
  if (r.name === 'handbook') crumb = tr('Handbook');
  if (r.name === 'settings') crumb = tr('Settings');
  if (r.name === 'help') crumb = tr('Help');
  return html`<header class="topbar">
    <button type="button" class="icon-btn menu-btn" aria-label=${tr('Open menu')} onClick=${onMenu}><${Icon} name="menu" /></button>
    <div class="crumb"><span class="muted">${p?.title || ''}</span><span class="crumb-sep">/</span><strong>${crumb}</strong></div>
    <div class="topbar-actions">
      ${state.settings.focusMode ? html`<button type="button" class="btn btn-quiet btn-small" onClick=${() => setSetting('focusMode', false)} title=${tr('Leave focus mode (z)')}>${tr('Leave focus mode')}</button>` : ''}
      <button type="button" class="icon-btn" title=${tr('Keyboard shortcuts (?)')} aria-label=${tr('Keyboard shortcuts')} onClick=${() => toggleHelp(true)}><${Icon} name="help" /></button>
      <button type="button" class="icon-btn" title=${tr('Undo (Ctrl+Z outside text fields)')} aria-label=${tr('Undo')} disabled=${!canUndo()} onClick=${undo}><${Icon} name="undo" /></button>
      <button type="button" class="icon-btn" title=${tr('Redo')} aria-label=${tr('Redo')} disabled=${!canRedo()} onClick=${redo}><${Icon} name="redo" /></button>
      <button type="button" class=${cx('btn', state.settings.drawerOpen ? 'btn-quiet active' : 'btn-quiet')} onClick=${() => setSetting('drawerOpen', !state.settings.drawerOpen)} aria-pressed=${state.settings.drawerOpen} title=${tr('Devil\'s Advocate')}>
        <${Icon} name="flame" /> <span class="btn-label">${tr('Devil\'s Advocate')}</span>
      </button>
    </div>
  </header>`;
}

function Main() {
  const r = state.route;
  const p = state.project;
  if (!p) return html`<div class="loading">${tr('Loading…')}</div>`;
  if (r.name === 'character') {
    const c = characterById(p, r.id);
    return c ? html`<${CharacterView} key=${c.id} character=${c} tab=${r.tab} />` : html`<${NotFound} />`;
  }
  if (r.name === 'scene') {
    const s = sceneById(p, r.id);
    return s ? html`<${SceneView} key=${s.id} scene=${s} tab=${r.tab} />` : html`<${NotFound} />`;
  }
  if (r.name === 'write') return html`<${WriteView} id=${r.id} />`;
  if (r.name === 'handbook') return html`<${HandbookView} section=${r.id} />`;
  if (r.name === 'help') return html`<${HelpView} section=${r.id} />`;
  if (r.name === 'settings') return html`<${SettingsView} />`;
  return html`<${StoryView} />`;
}

function NotFound() {
  return html`<div class="page"><div class="empty"><div class="empty-title">${tr('Not found in this project.')}</div><a href="#/write">${tr('Back to writing')}</a></div></div>`;
}

// Another device saved this project after this one loaded it. Nothing is
// overwritten until the writer chooses.
function ConflictBanner() {
  const c = state.conflict;
  const [busy, setBusy] = useState(false);
  if (!c) return null;
  const when = c.remote.updatedAt ? fmtTime(c.remote.updatedAt) : '';
  const choose = async (choice) => {
    if (choice === 'mine' && !confirm(tr('Replace the other device\'s version with the one on this screen?'))) return;
    setBusy(true);
    try { await resolveConflict(choice); } finally { setBusy(false); }
  };
  return html`<div class="banner conflict" role="alert">
    <div><strong>${when ? tr('This project was changed on another device at {time}.', { time: when }) : tr('This project was changed on another device.')}</strong> ${tr('Your edits here are kept in this browser and have not been saved over it.')}</div>
    <div class="banner-actions">
      <button type="button" class="btn" disabled=${busy} onClick=${() => choose('theirs')}>${tr('Load the latest')}</button>
      <button type="button" class="btn btn-quiet" disabled=${busy} onClick=${() => choose('copy')}>${tr('Save mine as a copy')}</button>
      <button type="button" class="btn btn-quiet danger" disabled=${busy} onClick=${() => choose('mine')}>${tr('Keep mine')}</button>
    </div>
  </div>`;
}

function Toast() {
  if (!state.toast) return null;
  return html`<div class=${cx('toast', state.toast.kind)} role="status">${state.toast.message}</div>`;
}

// Focus the writing box, opening the desk first if needed.
function focusWritingBox() {
  const tryFocus = (n) => {
    const el = document.querySelector('.desk-composer .entry-text');
    if (el) el.focus();
    else if (n > 0) setTimeout(() => tryFocus(n - 1), 40);
  };
  if (state.route.name !== 'write') navigate(`write/${activeScene()?.id || ''}`);
  tryFocus(10);
}

// The previous or next scene, in the same view.
function stepScene(dir) {
  const p = state.project;
  if (!p?.scenes.length) return;
  const cur = activeScene() || deskScene(p);
  const i = p.scenes.findIndex((s) => s.id === cur?.id);
  const next = p.scenes[(i + dir + p.scenes.length) % p.scenes.length];
  const r = state.route;
  navigate(r.name === 'scene' ? `scene/${next.id}/${r.tab || ''}` : `write/${next.id}`);
}

// App-wide keys (listed in shortcuts.js). Single letters only act outside
// text boxes; Ctrl+/ opens the shortcuts from anywhere.
function useShortcuts() {
  useEffect(() => {
    let prefix = '';
    let timer = 0;
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && !e.altKey && e.key === '/') { e.preventDefault(); toggleHelp(); return; }
      if (isTyping(e.target) || e.defaultPrevented) return;
      if (e.ctrlKey || e.metaKey) {
        if (e.key.toLowerCase() === 'z') { e.preventDefault(); if (e.shiftKey) redo(); else undo(); }
        return;
      }
      if (e.altKey) return;
      // Inside the projects dialog or the shortcuts overlay, only Esc (handled there).
      if (document.querySelector('.modal-backdrop') && e.key !== '?') return;
      const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      if (prefix === 'g') {
        prefix = '';
        clearTimeout(timer);
        const to = { w: 'write', s: 'story', h: 'handbook', ',': 'settings' }[k];
        if (to) { e.preventDefault(); navigate(to); }
        return;
      }
      const toggle = (key) => setSetting(key, !state.settings[key]);
      const run = {
        '?': () => toggleHelp(),
        '/': focusWritingBox,
        n: () => addScene(tr('Dialogue {n}', { n: (state.project?.scenes.length || 0) + 1 })),
        '[': () => stepScene(-1),
        ']': () => stepScene(1),
        g: () => { prefix = 'g'; timer = setTimeout(() => { prefix = ''; }, 1200); },
        s: () => toggle('showSubtext'),
        q: () => toggle('quietChecks'),
        l: () => toggle('lensOpen'),
        z: () => toggle('focusMode'),
        a: () => toggle('drawerOpen'),
        r: () => window.dispatchEvent(new CustomEvent('dd:read-aloud')),
      }[k];
      if (!run || !state.project) return;
      e.preventDefault();
      run();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
}

function App() {
  useStore();
  const [menu, setMenu] = useState(false);
  const [projects, setProjects] = useState(false);
  useShortcuts();
  const drawer = state.settings.drawerOpen;
  // The scrim is always rendered and toggled with `hidden`: inserting it on
  // open would let Preact reuse the .main-col element mid-click, and the same
  // tap that opened the menu would close it.
  return html`<div class=${cx('shell', drawer && 'with-drawer', state.settings.focusMode && 'focus-mode')}>
    <${TacticsDatalist} />
    <${Sidebar} open=${menu} onClose=${() => setMenu(false)} onProjects=${() => { setMenu(false); setProjects(true); }} />
    <div class="scrim" hidden=${!menu} onClick=${() => setMenu(false)}></div>
    <div class="main-col">
      <${Topbar} onMenu=${() => setMenu(true)} />
      <main id="main"><${ConflictBanner} />${state.error && state.saving === 'error' ? html`<div class="banner error">${state.error}</div>` : ''}<${Main} /></main>
    </div>
    ${drawer && state.project ? html`<div class="drawer-scrim" onClick=${() => setSetting('drawerOpen', false)}></div><${AssistantDrawer} />` : ''}
    <${ProjectsModal} open=${projects} onClose=${() => setProjects(false)} />
    <${ShortcutsModal} open=${state.help} onClose=${() => toggleHelp(false)} />
    <${Toast} />
  </div>`;
}

render(html`<${App} />`, document.getElementById('app'));
boot().catch((err) => {
  document.getElementById('app').insertAdjacentHTML('beforeend', `<div class="banner error">${tr('Could not start: {reason}', { reason: String(err.message).replace(/</g, '&lt;') })}</div>`);
});
