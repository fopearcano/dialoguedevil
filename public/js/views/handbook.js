import { html, useState, cx } from '../lib.js';
import { navigate } from '../store.js';
import { Cite } from '../components/ui.js';
import { Spheres, ConflictRings, LineDesignGlyph } from '../components/viz.js';
import {
  BOOK, CHAPTERS, DEFINITION, THREE_TRACKS, DIALOGUE_MODES, MEDIA, THREE_FUNCTIONS, SPHERES, CONFLICT_LEVELS, CONFLICT_RULE, SIX_TASKS, LINE_DESIGNS, TECHNIQUES, DESIRE_COMPLEX, FIVE_STEPS, BEAT_DEFINITION, CONTEXT_CULTURE, CONFLICT_TYPES, FLAWS, WORD_CHOICE_OBSERVATIONS, PREFERENCES, CHARACTER_SPECIFIC, MODALITIES, KEY_QUESTIONS, MASTERING, AXIOMS, TACTICS, TURNING_POINT_TYPES, STORY_VALUES, MENTALITIES,
} from '../mckee.js';

const SECTIONS = [
  { id: 'definition', title: 'What dialogue is', ch: 1, data: [DEFINITION, THREE_TRACKS, DIALOGUE_MODES] },
  { id: 'functions', title: 'Three functions', ch: 2, data: [THREE_FUNCTIONS] },
  { id: 'spheres', title: 'Said · unsaid · unsayable', ch: 3, data: [SPHERES] },
  { id: 'conflict', title: 'The conflict complex', ch: 4, data: [CONFLICT_LEVELS, CONFLICT_RULE] },
  { id: 'media', title: 'Page, stage, screen', ch: [1, 4], data: [MEDIA] },
  { id: 'technique', title: 'Technique', ch: 5, data: [LINE_DESIGNS, TECHNIQUES] },
  { id: 'tasks', title: 'Six dialogue tasks', ch: 'tasks', data: [SIX_TASKS] },
  { id: 'flaws', title: 'Flaws & fixes', ch: [6, 7, 8, 9], data: [FLAWS, WORD_CHOICE_OBSERVATIONS, PREFERENCES] },
  { id: 'voice', title: 'Character-specific dialogue', ch: 10, data: [CHARACTER_SPECIFIC, MODALITIES] },
  { id: 'design', title: 'Story · scene · dialogue', ch: 12, data: [DESIRE_COMPLEX, FIVE_STEPS, BEAT_DEFINITION, CONTEXT_CULTURE, TURNING_POINT_TYPES, STORY_VALUES] },
  { id: 'conflicts', title: 'Six kinds of conflict', ch: [13, 14, 15, 16, 17, 18], data: [CONFLICT_TYPES, MENTALITIES] },
  { id: 'tactics', title: 'The vocabulary of action', ch: [2, 3, 12], data: [TACTICS] },
  { id: 'craft', title: 'Mastering the craft', ch: 19, data: [MASTERING, KEY_QUESTIONS, AXIOMS] },
];

export function HandbookView({ section }) {
  const [q, setQ] = useState('');
  const query = q.trim().toLowerCase();
  const visible = SECTIONS.filter((s) => !query || `${s.title} ${JSON.stringify(s.data)}`.toLowerCase().includes(query));
  const go = (id) => {
    navigate(`handbook/${id}`);
    setTimeout(() => document.getElementById(`hb-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 30);
  };
  return html`<div class="page handbook">
    <header class="hb-hero card">
      <div>
        <p class="eyebrow">The Handbook</p>
        <h1>Dialogue as verbal action</h1>
        <p class="lead">The craft this app is built on, condensed and paraphrased from ${BOOK.author}, <em>${BOOK.title}</em> (${BOOK.year}), with chapter references so you can return to the source. The book itself is in this repository under <code>docs/</code>.</p>
      </div>
      <input class="input search" type="search" placeholder="Search the handbook…" value=${q} onInput=${(e) => setQ(e.currentTarget.value)} aria-label="Search the handbook" />
    </header>
    <div class="hb-layout">
      <nav class="hb-toc" aria-label="Handbook sections">
        ${SECTIONS.map((s) => html`<button type="button" class=${cx('toc-item', section === s.id && 'active', !visible.includes(s) && 'dim')} onClick=${() => go(s.id)}>${s.title}</button>`)}
      </nav>
      <div class="hb-content">
        ${visible.map((s) => html`<section class="hb-section" id=${`hb-${s.id}`}>
          <h2>${s.title} <${Cite} ch=${s.ch} /></h2>
          ${RENDER[s.id](query)}
        </section>`)}
        ${!visible.length ? html`<p class="muted">Nothing matches “${q}”.</p>` : ''}
        <footer class="hb-foot small muted">
          Chapters: ${Object.entries(CHAPTERS).map(([k, v]) => html`<span class="chapter-ref">${/^\d+$/.test(k) ? `${k}. ` : ''}${v}</span>`)}
        </footer>
      </div>
    </div>
  </div>`;
}

const match = (query, ...xs) => !query || xs.join(' ').toLowerCase().includes(query);

const RENDER = {
  definition: () => html`
    <blockquote class="big-quote">“${DEFINITION.quote}”<footer>McKee, <${Cite} ch=${1} /></footer></blockquote>
    <p>${DEFINITION.gloss}</p>
    <div class="track-diagram">
      ${THREE_TRACKS.map((t, i) => html`<div class="track">
        <div class="track-icon" aria-hidden="true">${['⇄', '↺', '→'][i]}</div>
        <strong>${t.name}</strong><span class="small muted">${t.desc}</span>
      </div>`)}
    </div>
    <div class="grid-3">${DIALOGUE_MODES.map((m) => html`<div class="mini-card"><strong>${m.name}</strong> <${Cite} ch=${m.ch} /><p class="small">${m.desc}</p></div>`)}</div>`,

  functions: () => html`<div class="grid-3">
    ${THREE_FUNCTIONS.map((f, i) => html`<div class="mini-card function-card">
      <div class="big-num">${i + 1}</div>
      <strong>${f.name}</strong>
      <p class="small">${f.desc}</p>
      <ul class="small">${f.points.map((pt) => html`<li>${pt}</li>`)}</ul>
    </div>`)}
  </div>`,

  spheres: () => html`<div class="spheres-layout">
    <div class="spheres-figure"><${Spheres} active="" /></div>
    <div>
      ${SPHERES.map((s) => html`<div class="sphere-field"><strong>${s.name}</strong> <span class="muted small">${s.layer}</span><p class="small">${s.desc}</p></div>`)}
      <p class="small"><strong>Action vs. activity.</strong> Talk is an activity; beneath it the character takes an action. When a character speaks, she could be comforting, bribing, begging, defying… No line is finished until you can name that action. <${Cite} ch=${3} /></p>
      <p class="small"><strong>Text and subtext.</strong> Fine dialogue is a transparency: the words conceal the inner life from other characters while letting the audience see through them. <${Cite} ch=${3} /></p>
    </div>
  </div>`,

  conflict: () => html`<div class="spheres-layout">
    <${ConflictRings} levels=${{ physical: { level: 2 }, social: { level: 5 }, personal: { level: 8 }, inner: { level: 6 } }} />
    <div>
      ${CONFLICT_LEVELS.map((l) => html`<div class="sphere-field"><strong>${l.name}</strong> <span class="muted small">${l.talk}</span><p class="small">${l.desc}</p></div>`)}
      <p class="callout">${CONFLICT_RULE.text}</p>
      <p class="small"><strong>Dialogue problems are story problems.</strong> The worse the storytelling, the worse the dialogue. <${Cite} ch=${4} /></p>
    </div>
  </div>`,

  media: () => html`<div class="grid-4">
    ${MEDIA.map((m) => {
      const voice = { stage: 80, tv: 55, screen: 25, prose: 50 }[m.id];
      return html`<div class="mini-card">
        <strong>${m.name}</strong>
        <div class="balance" aria-label=${m.balance}><span>voice</span><span class="balance-track"><span class="balance-dot" style=${`left:${100 - voice}%`}></span></span><span>image</span></div>
        <span class="small muted">${m.balance}</span>
        <ul class="small">${m.notes.map((n) => html`<li>${n}</li>`)}</ul>
      </div>`;
    })}
  </div>
  <p class="small muted">Stage dialogue is the most embellished, screen dialogue the most concise, prose dialogue the most mutable. <${Cite} ch=${4} /></p>`,

  technique: (query) => html`
    <h3>Line design: where the core word falls <${Cite} ch=${[5, 9]} /></h3>
    <div class="grid-4">${LINE_DESIGNS.filter((d) => match(query, d.name, d.desc, d.example)).map((d) => html`<div class="mini-card">
      <strong>${d.name}</strong><${LineDesignGlyph} design=${d.id} /><p class="small">${d.desc}</p>${d.example ? html`<p class="small script">${d.example}</p>` : ''}
    </div>`)}</div>
    <p class="small">The last word of a speech should be its core word, the cue for the reaction. Speeches ending in cumulative sentences tend to miscue. <${Cite} ch=${9} /></p>
    <div class="grid-3">${TECHNIQUES.filter((t) => match(query, t.name, t.desc)).map((t) => html`<div class="mini-card"><strong>${t.name}</strong> <${Cite} ch=${t.ch} /><p class="small">${t.desc}</p></div>`)}</div>`,

  tasks: () => html`<ol class="task-list">${SIX_TASKS.map((t) => html`<li><strong>${t.name}.</strong> ${t.desc}</li>`)}</ol>
    <p class="small muted">The workshop scores every scene against these six. <${Cite} ch="tasks" /></p>`,

  flaws: (query) => {
    const groups = ['Credibility', 'Language', 'Content', 'Design'];
    return html`
      ${groups.map((g) => {
        const rows = Object.values(FLAWS).filter((f) => f.group === g && match(query, f.name, f.why, f.fix));
        return rows.length ? html`<h3>${g} flaws</h3><table class="flaw-table">
          <thead><tr><th>Flaw</th><th>Why it fails</th><th>Fix</th></tr></thead>
          <tbody>${rows.map((f) => html`<tr><td><strong>${f.name}</strong> <${Cite} ch=${f.ch} /></td><td class="small">${f.why}</td><td class="small">${f.fix}</td></tr>`)}</tbody>
        </table>` : '';
      })}
      <div class="two-col">
        <div class="mini-card"><strong>Word choice tendencies</strong> <${Cite} ch=${7} /><ul class="small">${WORD_CHOICE_OBSERVATIONS.map((o) => html`<li>${o}</li>`)}</ul>
          <p class="small">When conflict peaks, people get emotional, active, direct, monosyllabic, and say things they later regret.</p></div>
        <div class="mini-card"><strong>Against arid language</strong> <${Cite} ch=${7} /><ul class="small">${PREFERENCES.map((o) => html`<li>${o}</li>`)}</ul>
          <p class="small muted">Guidelines, not imperatives. A Boyd Crowder earns his polysyllables.</p></div>
      </div>`;
  },

  voice: () => html`
    <p class="callout">${CHARACTER_SPECIFIC.principle}</p>
    <div class="two-col">
      <div class="mini-card"><strong>Knowledge: nouns & verbs</strong><p class="small">${CHARACTER_SPECIFIC.knowledge}</p></div>
      <div class="mini-card"><strong>Personality: modifiers</strong>
        <ul class="small">${CHARACTER_SPECIFIC.personality.map((x) => html`<li><strong>${x.name}:</strong> ${x.ex}</li>`)}</ul></div>
    </div>
    <div class="grid-4">${MODALITIES.map((m) => html`<div class="mini-card"><strong>${m.name}</strong><span class="mono small">${m.words}</span><p class="small">${m.desc}</p></div>`)}</div>
    <p class="small">${CHARACTER_SPECIFIC.culture} <${Cite} ch=${[10, 11]} /></p>
    <p class="small">${CHARACTER_SPECIFIC.limitation}</p>
    <p class="small muted">Voice is not a choice; it's a result. Quirkiness is not originality. <${Cite} ch=${10} /></p>`,

  design: () => html`
    <h3>The complex of desire <${Cite} ch=${12} /></h3>
    <div class="grid-5">${DESIRE_COMPLEX.map((d, i) => html`<div class="mini-card"><div class="big-num">${i + 1}</div><strong>${d.name}</strong><p class="small">${d.desc}</p></div>`)}</div>
    <h3>Five steps of behavior <${Cite} ch=${12} /></h3>
    <ol class="flow">${FIVE_STEPS.map((s) => html`<li><strong>${s.name}</strong><span class="small">${s.q}</span></li>`)}</ol>
    <p class="small">It is impossible to know what a character will say until you answer: What does he want? What stops him? What will he choose to do? <${Cite} ch=${12} /></p>
    <div class="two-col">
      <div class="mini-card"><strong>The beat</strong> <${Cite} ch=${[9, 12]} /><p class="small">${BEAT_DEFINITION.text}</p>
        <p class="small script">BEAT 3 · ACTION: Teo claiming the inheritance / REACTION: Nadia exposing his ignorance</p></div>
      <div class="mini-card"><strong>Turning points</strong> <${Cite} ch=${12} />
        ${TURNING_POINT_TYPES.map((t) => html`<p class="small"><strong>${t.name}:</strong> ${t.desc}</p>`)}
        <p class="small">A scene's value can reverse, intensify or wane. If it doesn't change, the scene is a nonevent.</p></div>
    </div>
    <div class="two-col">
      <div class="mini-card"><strong>High-context cultures</strong><p class="small">${CONTEXT_CULTURE.high}</p></div>
      <div class="mini-card"><strong>Low-context cultures</strong><p class="small">${CONTEXT_CULTURE.low}</p></div>
    </div>
    <p class="small muted">Value pairs to start from: ${STORY_VALUES.map(([a, b]) => `${a}/${b}`).join(' · ')}</p>`,

  conflicts: () => html`<div class="grid-3">
    ${CONFLICT_TYPES.map((t) => html`<div class="mini-card">
      <strong>${t.name}</strong> <${Cite} ch=${t.ch} />
      <span class="small muted">${t.example}</span>
      <p class="small">${t.desc}</p>
      <ul class="small">${t.tips.map((x) => html`<li>${x}</li>`)}</ul>
    </div>`)}
  </div>
  <div class="two-col">${MENTALITIES.map((m) => html`<div class="mini-card"><strong>${m.name} mentality</strong> <${Cite} ch=${m.ch} /><p class="small">${m.desc}</p></div>`)}</div>`,

  tactics: (query) => html`
    <p class="small">Name the action beneath every line with an active gerund. It is the best way to stop yourself writing on-the-nose. <${Cite} ch=${12} /></p>
    <div class="tactic-groups">${Object.entries(TACTICS).map(([g, list]) => {
      const items = list.filter((t) => match(query, g, t));
      return items.length ? html`<div class="mini-card"><strong>${g}</strong><div class="chip-row">${items.map((t) => html`<span class="chip">${t}</span>`)}</div></div>` : '';
    })}</div>`,

  craft: (query) => html`
    <div class="grid-5">${MASTERING.map((m) => html`<div class="mini-card"><strong>${m.name}</strong><p class="small">${m.desc}</p></div>`)}</div>
    <h3>Key questions <${Cite} ch=${19} /></h3>
    <table class="flaw-table"><tbody>${KEY_QUESTIONS.filter((k) => match(query, k.name, k.q)).map((k) => html`<tr><td><strong>${k.name}</strong></td><td class="small">${k.q}</td></tr>`)}</tbody></table>
    <h3>Axioms</h3>
    <div class="axioms">${AXIOMS.map((a) => html`<blockquote class="axiom">“${a.text}” <${Cite} ch=${a.ch} /></blockquote>`)}</div>`,
};
