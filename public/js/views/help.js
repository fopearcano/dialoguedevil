// The help guide (#/help) and the keyboard shortcuts overlay (?). Both
// read the shortcuts and the quick syntax from shortcuts.js.

import { html, cx } from '../lib.js';
import { navigate, toggleHelp } from '../store.js';
import { Modal, Cite, Icon, rich } from '../components/ui.js';
import { SHORTCUTS, QUICK_SYNTAX, keyLabel, comboParts } from '../shortcuts.js';
import { DEFINITION, FIVE_STEPS, BEAT_DEFINITION, SPHERES, SIX_TASKS, FLAWS } from '../mckee.js';
import { tr } from '../i18n.js';

// A key combination as keycaps: "Ctrl+Enter", or "g w" (one, then the other).
export function Keys({ combo }) {
  return html`<span class="keys">${comboParts(combo).map((step, i) => html`${i ? html`<span class="keys-then">${tr('then')}</span>` : ''}${step.map((k, j) => html`${j ? html`<span class="keys-plus">+</span>` : ''}<kbd>${keyLabel(k)}</kbd>`)}`)}</span>`;
}

const k = (combo) => html`<${Keys} combo=${combo} />`;

function ShortcutGroup({ group }) {
  return html`<section class="sc-group">
    <h3>${tr(group.title)}</h3>
    <dl class="sc-list">${group.items.map((it) => html`<div class="sc-row">
      <dt>${it.keys.map((combo, i) => html`${i ? html`<span class="keys-or">/</span>` : ''}${k(combo)}`)}</dt>
      <dd>${tr(it.label)}</dd>
    </div>`)}</dl>
  </section>`;
}

function SyntaxTable() {
  return html`<table class="data-table syntax-table">
    <thead><tr><th>${tr('Type')}</th><th>${tr('You get')}</th></tr></thead>
    <tbody>${QUICK_SYNTAX.map((x) => html`<tr><td><code>${tr(x.type)}</code></td><td>${tr(x.result)}</td></tr>`)}</tbody>
  </table>`;
}

export function ShortcutsModal({ open, onClose }) {
  return html`<${Modal} open=${open} wide title=${tr('Keyboard shortcuts')} onClose=${onClose}>
    <div class="sc-columns">${SHORTCUTS.map((g) => html`<${ShortcutGroup} group=${g} />`)}</div>
    <h3 class="sc-syntax-title">${tr('Typing in the writing box')}</h3>
    <${SyntaxTable} />
    <p class="small muted sc-foot">${rich('Press {key} again or {esc} to close.', { key: html`<kbd>?</kbd>`, esc: html`<kbd>Esc</kbd>` })}
      <button type="button" class="link-btn" onClick=${() => { onClose(); navigate('help'); }}>${tr('Open the help guide →')}</button></p>
  </${Modal}>`;
}

// ---------------------------------------------------------------------------

const sections = () => [
  { id: 'start', title: tr('Start writing in a minute') },
  { id: 'syntax', title: tr('Typing in the writing box') },
  { id: 'keys', title: tr('Keyboard shortcuts') },
  { id: 'map', title: tr('Where everything is') },
  { id: 'method', title: tr('The method at a glance') },
  { id: 'faq', title: tr('Questions') },
];

function Start() {
  const steps = [
    [tr('Pick who is talking'), tr('A new dialogue starts empty. Choose characters from the project, or type a new name and it becomes a character. “Talking to” says whether the voices speak to each other, to themselves or to the audience.')],
    [tr('Sketch the lines'), rich('Type the words and press {enter}: the turn passes to the next voice by itself, and {altenter} lets the same voice go on. {cue} picks the speaker as you type.', { enter: k('Enter'), altenter: k('Alt+Enter'), cue: html`<code>${tr('NAME: line')}</code>` })],
    [tr('Name what lies beneath'), rich('With Subtext on ({s}), each line has room under it for what the character thinks but doesn\'t say, and for the action as a gerund (testing, cornering…). {tab} from the words goes there.', { s: k('s'), tab: k('Tab') })],
    [tr('Break it into beats'), rich('When the action changes, start a new beat ({ctrlenter}). Open a beat to set the value\'s charge; the lens shows the arc and the turning point.', { ctrlenter: k('Ctrl+Enter') })],
    [tr('Check it, then hear it'), rich('Markers in the margin hold the double-check\'s notes, and the lens lists them. Read the scene aloud ({r}) and flag by ear any line that sounds wrong ({f}).', { r: k('r'), f: k('F') })],
    [tr('Go deeper, then export'), tr('The character pages, Scene design and the Beat workshop hold the full method. Script exports a screenplay, a stage play, a prose draft or an annotated breakdown.')],
  ];
  return html`<ol class="help-steps">${steps.map(([title, text], i) => html`<li><span class="help-step-n">${i + 1}</span><div><strong>${title}</strong><p>${text}</p></div></li>`)}</ol>
    <p><a class="btn btn-primary" href="#/write"><${Icon} name="pen" /> ${tr('Start writing')}</a></p>`;
}

function Places() {
  const places = [
    ['#/write', 'pen', tr('Write'), tr('The writing desk: sketch and edit dialogue, with checks in the margin and the McKee lens.')],
    ['#/story', 'story', tr('Story'), tr('Logline, medium and core value; the cast and how their voices compare; the conflicts; the table of scenes.')],
    ['', 'person', tr('Characters'), tr('Each character from the mask to the unsayable: desire, antagonism, voice, secrets, relationships and a voice lab.')],
    ['', 'scene', tr('Scene design'), tr('Who wants what, the values at stake, the conflict type, the third thing and the turning-point plan.')],
    ['', 'layers', tr('Beat workshop'), tr('The same scene with every tool laid out: charges and intensity for each beat, the full double-check, the six tasks.')],
    ['', 'download', tr('Script'), tr('Exports: screenplay (Fountain), stage play, prose draft, annotated breakdown.')],
    ['#/handbook', 'book', tr('Handbook'), tr('McKee\'s framework, condensed and searchable, with chapter references.')],
    ['', 'flame', tr('Devil\'s Advocate'), tr('The right-hand panel: an interview that needs no AI, and optional AI modes (coach, rehearse, doctor, beats, line lab).')],
    ['#/settings', 'gear', tr('Settings'), tr('Interface and dialogue language, theme, writing options, AI key, other devices.')],
  ];
  return html`<ul class="help-map">${places.map(([href, icon, name, text]) => html`<li>
    <${Icon} name=${icon} />
    <div>${href ? html`<a href=${href} class="strong">${name}</a>` : html`<strong>${name}</strong>`}<p class="small muted">${text}</p></div>
  </li>`)}</ul>`;
}

function Method() {
  const flaws = ['onTheNose', 'emptyTalk', 'cliche', 'characterNeutral', 'repetitiousBeats'].map((id) => FLAWS[id]).filter(Boolean);
  return html`<div class="help-method">
    <div class="mini-card">
      <strong>${tr('Dialogue is verbal action')} <${Cite} ch=${DEFINITION.ch} /></strong>
      <p class="small">${DEFINITION.gloss}</p>
    </div>
    <div class="mini-card">
      <strong>${tr('Before every line: the five steps')} <${Cite} ch=${12} /></strong>
      <ol class="small">${FIVE_STEPS.map((st) => html`<li><strong>${st.name}.</strong> ${st.q}</li>`)}</ol>
    </div>
    <div class="mini-card">
      <strong>${tr('Beats')} <${Cite} ch=${BEAT_DEFINITION.ch} /></strong>
      <p class="small">${BEAT_DEFINITION.text}</p>
    </div>
    <div class="mini-card">
      <strong>${tr('Three layers in every line')} <${Cite} ch=${3} /></strong>
      <ul class="small">${SPHERES.map((sp) => html`<li><strong>${sp.name}</strong> · ${sp.layer}</li>`)}</ul>
    </div>
    <div class="mini-card">
      <strong>${tr('Fine dialogue does six things at once')} <${Cite} ch="tasks" /></strong>
      <ul class="small">${SIX_TASKS.map((t) => html`<li><strong>${t.name}.</strong> ${t.desc}</li>`)}</ul>
    </div>
    <div class="mini-card">
      <strong>${tr('The flaws the checks look for first')} <${Cite} ch=${[6, 7, 8, 9]} /></strong>
      <ul class="small">${flaws.map((f) => html`<li><strong>${f.name}.</strong> ${f.why}</li>`)}</ul>
    </div>
  </div>
  <p><a class="link-btn" href="#/handbook">${tr('The whole framework is in the Handbook →')}</a></p>`;
}

function Faq() {
  const qa = [
    [tr('Is my work saved?'), tr('Yes, automatically, on the computer running Dialogue Devil (one file per project in data/projects). This browser also keeps a copy until the server confirms each save.')],
    [tr('Can I undo?'), rich('{undo} and {redo}, outside text boxes, undo and redo any change, including the ones the AI made.', { undo: k('Ctrl+Z'), redo: k('Ctrl+Shift+Z') })],
    [tr('Do I need the AI?'), tr('No. Writing, the checks, the interview, the handbook and the exports all work offline. To turn on the AI modes, add a key for Anthropic, OpenAI or OpenRouter in Settings, or connect a model running on your own computer (Ollama, LM Studio…).')],
    [tr('Can I write in Italian?'), tr('Yes. Settings → Language sets the interface and, separately, the language of each project\'s dialogue, which decides the analysis rules.')],
    [tr('Can I use it on a phone or tablet?'), tr('Yes, from any device on the same network: Settings → Other devices shows the address to open.')],
    [tr('A check is wrong. What do I do?'), tr('Open the note in the margin and choose “Dismiss as deliberate”: it is remembered for that line. Notes marked “to verify” come from one sensitive check only.')],
  ];
  return html`<dl class="help-faq">${qa.map(([q, a]) => html`<div><dt>${q}</dt><dd>${a}</dd></div>`)}</dl>`;
}

const BODY = { start: Start, syntax: SyntaxTable, map: Places, method: Method, faq: Faq };

export function HelpView({ section }) {
  const all = sections();
  const go = (id) => {
    navigate(`help/${id}`);
    setTimeout(() => document.getElementById(`help-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 30);
  };
  return html`<div class="page help">
    <header class="hb-hero card">
      <div>
        <p class="eyebrow">${tr('Help')}</p>
        <h1>${tr('How to work in Dialogue Devil')}</h1>
        <p class="lead">${rich('Sketch first, then deepen. Everything below is also one key away: press {key} anywhere for the shortcuts.', { key: html`<kbd>?</kbd>` })}</p>
      </div>
      <button type="button" class="btn" onClick=${() => toggleHelp(true)}><${Icon} name="help" /> ${tr('Keyboard shortcuts')}</button>
    </header>
    <div class="hb-layout">
      <nav class="hb-toc" aria-label=${tr('Help sections')}>
        ${all.map((s) => html`<button type="button" class=${cx('toc-item', section === s.id && 'active')} onClick=${() => go(s.id)}>${s.title}</button>`)}
      </nav>
      <div class="hb-content">
        ${all.map((s) => html`<section class="hb-section" id=${`help-${s.id}`}>
          <h2>${s.title}</h2>
          ${s.id === 'keys' ? html`<div class="sc-columns">${SHORTCUTS.map((g) => html`<${ShortcutGroup} group=${g} />`)}</div>`
            : s.id === 'syntax' ? html`<p class="muted">${tr('In the writing box at the foot of the page. A pasted scene (NAME: line, or a screenplay) comes in line by line.')}</p><${SyntaxTable} />`
              : html`<${BODY[s.id]} />`}
        </section>`)}
      </div>
    </div>
  </div>`;
}
