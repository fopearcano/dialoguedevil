import { html, useState, useMemo, cx, charColor } from '../lib.js';
import { state, mutate, navigate } from '../store.js';
import { Card, Field, TextInput, TextArea, Select, Cite, CharDot, Meter, Icon } from '../components/ui.js';
import { Radar, Sparkline, HeatMatrix } from '../components/viz.js';
import { profileCompleteness, voiceDistance, valueArc } from '../analysis.js';
import { doubleCheckScene } from '../doublecheck.js';
import {
  MEDIA, STORY_VALUES, VOICE_DIMENSIONS, CHARACTER_SECTIONS, CONFLICT_LEVELS, CONFLICT_RULE, CONFLICT_TYPES, AXIOMS,
} from '../mckee.js';
import { addCharacter, addScene } from '../actions.js';

const set = (key) => (v) => mutate((p) => { p[key] = v; });

export function StoryView() {
  const p = state.project;
  const analyses = useMemo(() => Object.fromEntries(p.scenes.map((s) => [s.id, doubleCheckScene(s, p)])), [state.version]);
  const totals = p.scenes.reduce((a, s) => ({ beats: a.beats + s.beats.length, lines: a.lines + s.beats.reduce((n, b) => n + b.lines.filter((l) => l.kind !== 'action').length, 0) }), { beats: 0, lines: 0 });
  const depthAvg = p.characters.length ? Math.round(p.characters.reduce((a, c) => a + profileCompleteness(c, CHARACTER_SECTIONS).overall, 0) / p.characters.length) : 0;
  const axiom = AXIOMS[new Date().getDate() % AXIOMS.length];

  return html`<div class="page story">
    <section class="hero card">
      <div class="hero-main">
        <input class="title-input" value=${p.title} aria-label="Story title" onInput=${(e) => set('title')(e.currentTarget.value)} />
        <${TextArea} value=${p.logline} onInput=${set('logline')} placeholder="Logline: who wants what, against what, at what risk?" class="logline" />
        <div class="hero-grid">
          <${Field} label="Medium" ch=${[1, 4]}>
            <${Select} value=${p.medium} onChange=${set('medium')} options=${MEDIA.map((m) => [m.id, `${m.name} · ${m.balance}`])} />
          </${Field}>
          <${Field} label="Genre" ch=${8}>
            <${TextInput} value=${p.genre} onInput=${set('genre')} placeholder="Family drama, crimedy, fantasy…" />
          </${Field}>
          <${Field} label="Vision" ch=${8} hint=${p.genreMode === 'nonrealism' ? 'Nonrealism tolerates on-the-nose dialogue; subtext tends to atrophy.' : 'Realism demands a subtext under virtually every line.'}>
            <div class="segmented">
              ${[['realism', 'Realism'], ['nonrealism', 'Nonrealism']].map(([id, label]) => html`<button type="button" class=${cx(p.genreMode === id && 'active')} onClick=${() => set('genreMode')(id)}>${label}</button>`)}
            </div>
          </${Field}>
          <${Field} label="Core value (+ / −)" ch=${12} hint="Change the core value and you change the genre.">
            <div class="value-pair">
              <${TextInput} value=${p.coreValue.positive} list="dd-values-pos" placeholder="positive" onInput=${(v) => mutate((x) => { x.coreValue.positive = v; })} />
              <span>/</span>
              <${TextInput} value=${p.coreValue.negative} list="dd-values-neg" placeholder="negative" onInput=${(v) => mutate((x) => { x.coreValue.negative = v; })} />
            </div>
          </${Field}>
          <${Field} label="Inciting incident" ch=${12} wide>
            <${TextArea} value=${p.incitingIncident} onInput=${set('incitingIncident')} placeholder="The event that throws the protagonist's life out of balance." />
          </${Field}>
          <${Field} label="Major dramatic question" ch=${5} wide>
            <${TextInput} value=${p.mdq} onInput=${set('mdq')} placeholder="How will this turn out?" />
          </${Field}>
        </div>
        <datalist id="dd-values-pos">${STORY_VALUES.map(([a]) => html`<option value=${a} />`)}</datalist>
        <datalist id="dd-values-neg">${STORY_VALUES.map(([, b]) => html`<option value=${b} />`)}</datalist>
      </div>
      <aside class="hero-side">
        <div class="stat-grid">
          <div class="stat"><span class="stat-label">Characters</span><span class="stat-value">${p.characters.length}</span></div>
          <div class="stat"><span class="stat-label">Scenes</span><span class="stat-value">${p.scenes.length}</span></div>
          <div class="stat"><span class="stat-label">Beats</span><span class="stat-value">${totals.beats}</span></div>
          <div class="stat"><span class="stat-label">Lines</span><span class="stat-value">${totals.lines}</span></div>
        </div>
        <${Meter} label="Average character depth" value=${depthAvg} />
        <blockquote class="axiom">“${axiom.text}”<footer>McKee, <${Cite} ch=${axiom.ch} /></footer></blockquote>
      </aside>
    </section>

    <div class="section-head">
      <h2>Cast</h2>
      <span class="muted small">Each character a walking dictionary of their own words <${Cite} ch=${10} /></span>
      <button type="button" class="btn btn-quiet" onClick=${() => addCharacter()}><${Icon} name="plus" /> Character</button>
    </div>
    <div class="cast-grid">
      ${p.characters.map((c) => {
        const depth = profileCompleteness(c, CHARACTER_SECTIONS);
        return html`<a class="cast-card card" href=${`#/character/${c.id}`} style=${`--c:${charColor(c)}`}>
          <div class="cast-top">
            <div>
              <div class="cast-name"><${CharDot} character=${c} size=${12} /> ${c.name}</div>
              <div class="muted small">${c.role || 'Role not set'}</div>
            </div>
            <div class="cast-radar"><${Radar} dims=${VOICE_DIMENSIONS} series=${[{ id: 'i', label: 'Intended voice', color: charColor(c), values: c.voice.sliders }]} size=${110} mini /></div>
          </div>
          <p class="cast-logline">${c.logline || html`<span class="muted">No metaphor yet.</span>`}</p>
          <dl class="cast-facts">
            <dt>Wants</dt><dd>${c.desire.objectOfDesire || '—'}</dd>
            <dt>Needs</dt><dd>${c.desire.superIntention || '—'}</dd>
          </dl>
          <${Meter} label="Depth" value=${depth.overall} />
        </a>`;
      })}
      ${!p.characters.length ? html`<div class="card empty">No characters yet. Characters are metaphors for human nature <${Cite} ch="pref" />; start with one.</div>` : ''}
    </div>

    <div class="two-col">
      <${VoiceLineup} />
      <${Card} title="Conflict complex" ch=${[4, 12]} sub=${CONFLICT_RULE.text}>
        ${p.characters.length ? html`<${HeatMatrix} rows=${p.characters} cols=${CONFLICT_LEVELS} rowLabel=${(c) => html`<span class="row-name"><${CharDot} character=${c} /> ${c.name}</span>`} get=${(c, l) => c.antagonism[l.id]?.level ?? 0} />
          <${ComplexityVerdict} />` : html`<p class="muted">Add characters to map their forces of antagonism.</p>`}
      </${Card}>
    </div>

    <div class="section-head">
      <h2>Scenes</h2>
      <span class="muted small">Every scene turns a value <${Cite} ch=${12} /></span>
      <button type="button" class="btn btn-quiet" onClick=${() => addScene()}><${Icon} name="plus" /> Scene</button>
    </div>
    <div class="card scene-table-card">
      ${p.scenes.length ? html`<table class="scene-table">
        <thead><tr><th>Scene</th><th>Conflict</th><th>Cast</th><th>Value arc</th><th class="num">Beats</th><th class="num">Lines</th><th>Turn</th><th>Six tasks</th><th class="num">Flags</th></tr></thead>
        <tbody>${p.scenes.map((s) => {
          const a = analyses[s.id];
          const arc = valueArc(s)[0];
          const ct = CONFLICT_TYPES.find((t) => t.id === s.conflictType);
          const taskVals = Object.values(a.tasks).filter((v) => v != null);
          const health = taskVals.length && a.totalLines ? Math.round(taskVals.reduce((x, y) => x + y, 0) / taskVals.length) : null;
          return html`<tr onClick=${() => navigate(`scene/${s.id}/${s.beats.length ? 'workshop' : 'design'}`)} class="clickable">
            <td><a href=${`#/scene/${s.id}/${s.beats.length ? 'workshop' : 'design'}`} class="strong">${s.title}</a><div class="muted small">${s.heading}</div></td>
            <td class="small">${ct ? ct.name.replace(' conflict', '') : '—'}</td>
            <td>${s.participants.map((pt) => { const c = p.characters.find((x) => x.id === pt.characterId); return c ? html`<${CharDot} character=${c} />` : ''; })}</td>
            <td>${arc ? html`<${Sparkline} points=${arc.points} />` : html`<span class="muted small">no value</span>`}</td>
            <td class="num">${s.beats.length}</td>
            <td class="num">${a.totalLines}</td>
            <td class="small">${a.turningPoint && Math.abs(a.turningPoint.change) >= 2 ? `B${a.turningPoint.beatIndex + 1} · ${a.turningPoint.open > 0 ? '+' : ''}${a.turningPoint.open}→${a.turningPoint.close > 0 ? '+' : ''}${a.turningPoint.close}` : html`<span class="muted">none yet</span>`}</td>
            <td><${Meter} value=${health} /></td>
            <td class="num" title="Lines with confirmed or flagged problems; “?” lines are only to verify">${a.stats.linesWithIssues}${a.stats.linesToVerify ? html` <span class="muted small">+${a.stats.linesToVerify}?</span>` : ''}</td>
          </tr>`;
        })}</tbody>
      </table>` : html`<div class="empty">No scenes yet. <button type="button" class="link-btn" onClick=${() => addScene()}>Design the first scene.</button></div>`}
    </div>
  </div>`;
}

function ComplexityVerdict() {
  const p = state.project;
  const used = CONFLICT_LEVELS.filter((l) => p.characters.some((c) => (c.antagonism[l.id]?.level ?? 0) >= 3));
  const verdict = used.length >= 2 ? `Complex: ${used.length} of 4 levels in play.` : used.length === 1 ? 'Complicated, not complex: one level carries the story.' : 'No forces of antagonism rated yet.';
  const talky = used.filter((l) => l.id === 'personal' || l.id === 'inner').length;
  return html`<p class="small verdict"><strong>${verdict}</strong> ${used.length ? (talky ? 'Personal and inner conflict live in talk: expect a dialogue-rich story.' : 'Physical and social conflict use less dialogue.') : ''}</p>`;
}

function VoiceLineup() {
  const p = state.project;
  const [picked, setPicked] = useState(() => p.characters.slice(0, 2).map((c) => c.id));
  const chosen = p.characters.filter((c) => picked.includes(c.id)).slice(0, 3);
  const toggle = (id) => setPicked((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id].slice(-3)));
  const pairs = [];
  for (let i = 0; i < chosen.length; i++) for (let j = i + 1; j < chosen.length; j++) pairs.push([chosen[i], chosen[j], voiceDistance(chosen[i].voice.sliders, chosen[j].voice.sliders)]);
  return html`<${Card} title="Voice line-up" ch=${[10, 2]} sub="Intended voice fingerprints, overlaid. Pick up to three.">
    <div class="chip-row">${p.characters.map((c) => html`<button type="button" class=${cx('char-chip', picked.includes(c.id) && 'active')} style=${`--c:${charColor(c)}`} aria-pressed=${picked.includes(c.id)} onClick=${() => toggle(c.id)}><span class="char-dot"></span>${c.name}</button>`)}</div>
    ${chosen.length ? html`<${Radar} dims=${VOICE_DIMENSIONS} series=${chosen.map((c) => ({ id: c.id, label: c.name, color: charColor(c), values: c.voice.sliders }))} size=${240} />` : html`<p class="muted">Select characters to compare.</p>`}
    ${pairs.map(([a, b, d]) => html`<div class="distance-row">
      <span>${a.name} ↔ ${b.name}</span>
      <${Meter} value=${Math.min(100, Math.round((d / 40) * 100))} title=${`Voice distance ${Math.round(d)}`} />
      <span class=${cx('small', d < 12 ? 'warn-text' : 'muted')}>${d < 12 ? 'Too alike' : d < 20 ? 'Distinct' : 'Strongly contrasted'}</span>
    </div>`)}
  </${Card}>`;
}
