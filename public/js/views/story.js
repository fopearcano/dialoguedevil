import { html, useState, useMemo, cx, charColor } from '../lib.js';
import { state, mutate, navigate } from '../store.js';
import { Card, Field, TextInput, TextArea, Select, Cite, CharDot, Meter, Icon, rich } from '../components/ui.js';
import { Radar, Sparkline, HeatMatrix } from '../components/viz.js';
import { profileCompleteness, voiceDistance, valueArc } from '../analysis.js';
import { doubleCheckScene } from '../doublecheck.js';
import {
  MEDIA, STORY_VALUES, VOICE_DIMENSIONS, CHARACTER_SECTIONS, CONFLICT_LEVELS, CONFLICT_RULE, CONFLICT_TYPES, AXIOMS,
} from '../mckee.js';
import { addCharacter, addScene } from '../actions.js';
import { tr } from '../i18n.js';

const set = (key) => (v) => mutate((p) => { p[key] = v; });
// "Balanced conflict" → "Balanced", "Conflitto bilanciato" → "Bilanciato".
const shortType = (name) => {
  const s = name.replace(/\s*conflict\b/i, '').replace(/^il\s+/i, '').replace(/^conflitto\s+/i, '').trim();
  return s.charAt(0).toUpperCase() + s.slice(1);
};

export function StoryView() {
  const p = state.project;
  const analyses = useMemo(() => Object.fromEntries(p.scenes.map((s) => [s.id, doubleCheckScene(s, p)])), [state.version]);
  const totals = p.scenes.reduce((a, s) => ({ beats: a.beats + s.beats.length, lines: a.lines + s.beats.reduce((n, b) => n + b.lines.filter((l) => l.kind !== 'action').length, 0) }), { beats: 0, lines: 0 });
  const depthAvg = p.characters.length ? Math.round(p.characters.reduce((a, c) => a + profileCompleteness(c, CHARACTER_SECTIONS).overall, 0) / p.characters.length) : 0;
  const axiom = AXIOMS[new Date().getDate() % AXIOMS.length];

  return html`<div class="page story">
    <section class="hero card">
      <div class="hero-main">
        <input class="title-input" value=${p.title} aria-label=${tr('Story title')} onInput=${(e) => set('title')(e.currentTarget.value)} />
        <${TextArea} value=${p.logline} onInput=${set('logline')} placeholder=${tr('Logline: who wants what, against what, at what risk?')} class="logline" />
        <div class="hero-grid">
          <${Field} label=${tr('Medium')} ch=${[1, 4]}>
            <${Select} value=${p.medium} onChange=${set('medium')} options=${MEDIA.map((m) => [m.id, `${m.name} · ${m.balance}`])} />
          </${Field}>
          <${Field} label=${tr('Genre')} ch=${8}>
            <${TextInput} value=${p.genre} onInput=${set('genre')} placeholder=${tr('Family drama, crimedy, fantasy…')} />
          </${Field}>
          <${Field} label=${tr('Vision')} ch=${8} hint=${p.genreMode === 'nonrealism' ? tr('Nonrealism tolerates on-the-nose dialogue; subtext tends to atrophy.') : tr('Realism demands a subtext under virtually every line.')}>
            <div class="segmented">
              ${[['realism', tr('Realism')], ['nonrealism', tr('Nonrealism')]].map(([id, label]) => html`<button type="button" class=${cx(p.genreMode === id && 'active')} onClick=${() => set('genreMode')(id)}>${label}</button>`)}
            </div>
          </${Field}>
          <${Field} label=${tr('Core value (+ / −)')} ch=${12} hint=${tr('Change the core value and you change the genre.')}>
            <div class="value-pair">
              <${TextInput} value=${p.coreValue.positive} list="dd-values-pos" placeholder=${tr('positive')} onInput=${(v) => mutate((x) => { x.coreValue.positive = v; })} />
              <span>/</span>
              <${TextInput} value=${p.coreValue.negative} list="dd-values-neg" placeholder=${tr('negative')} onInput=${(v) => mutate((x) => { x.coreValue.negative = v; })} />
            </div>
          </${Field}>
          <${Field} label=${tr('Inciting incident')} ch=${12} wide>
            <${TextArea} value=${p.incitingIncident} onInput=${set('incitingIncident')} placeholder=${tr('The event that throws the protagonist\'s life out of balance.')} />
          </${Field}>
          <${Field} label=${tr('Major dramatic question')} ch=${5} wide>
            <${TextInput} value=${p.mdq} onInput=${set('mdq')} placeholder=${tr('How will this turn out?')} />
          </${Field}>
        </div>
        <datalist id="dd-values-pos">${STORY_VALUES.map(([a]) => html`<option value=${a} />`)}</datalist>
        <datalist id="dd-values-neg">${STORY_VALUES.map(([, b]) => html`<option value=${b} />`)}</datalist>
      </div>
      <aside class="hero-side">
        <div class="stat-grid">
          <div class="stat"><span class="stat-label">${tr('Characters')}</span><span class="stat-value">${p.characters.length}</span></div>
          <div class="stat"><span class="stat-label">${tr('Scenes')}</span><span class="stat-value">${p.scenes.length}</span></div>
          <div class="stat"><span class="stat-label">${tr('Beats')}</span><span class="stat-value">${totals.beats}</span></div>
          <div class="stat"><span class="stat-label">${tr('Lines')}</span><span class="stat-value">${totals.lines}</span></div>
        </div>
        <${Meter} label=${tr('Average character depth')} value=${depthAvg} />
        <blockquote class="axiom">“${axiom.text}”<footer>McKee, <${Cite} ch=${axiom.ch} /></footer></blockquote>
      </aside>
    </section>

    <div class="section-head">
      <h2>${tr('Cast')}</h2>
      <span class="muted small">${tr('Each character a walking dictionary of their own words')} <${Cite} ch=${10} /></span>
      <button type="button" class="btn btn-quiet" onClick=${() => addCharacter()}><${Icon} name="plus" /> ${tr('Character')}</button>
    </div>
    <div class="cast-grid">
      ${p.characters.map((c) => {
        const depth = profileCompleteness(c, CHARACTER_SECTIONS);
        return html`<a class="cast-card card" href=${`#/character/${c.id}`} style=${`--c:${charColor(c)}`}>
          <div class="cast-top">
            <div>
              <div class="cast-name"><${CharDot} character=${c} size=${12} /> ${c.name}</div>
              <div class="muted small">${c.role || tr('Role not set')}</div>
            </div>
            <div class="cast-radar"><${Radar} dims=${VOICE_DIMENSIONS} series=${[{ id: 'i', label: tr('Intended voice'), color: charColor(c), values: c.voice.sliders }]} size=${110} mini /></div>
          </div>
          <p class="cast-logline">${c.logline || html`<span class="muted">${tr('No metaphor yet.')}</span>`}</p>
          <dl class="cast-facts">
            <dt>${tr('Wants')}</dt><dd>${c.desire.objectOfDesire || '—'}</dd>
            <dt>${tr('Needs')}</dt><dd>${c.desire.superIntention || '—'}</dd>
          </dl>
          <${Meter} label=${tr('Depth')} value=${depth.overall} />
        </a>`;
      })}
      ${!p.characters.length ? html`<div class="card empty">${rich('No characters yet. Characters are metaphors for human nature {cite}; start with one.', { cite: html`<${Cite} ch="pref" />` })}</div>` : ''}
    </div>

    <div class="two-col">
      <${VoiceLineup} />
      <${Card} title=${tr('Conflict complex')} ch=${[4, 12]} sub=${CONFLICT_RULE.text}>
        ${p.characters.length ? html`<${HeatMatrix} rows=${p.characters} cols=${CONFLICT_LEVELS} rowLabel=${(c) => html`<span class="row-name"><${CharDot} character=${c} /> ${c.name}</span>`} get=${(c, l) => c.antagonism[l.id]?.level ?? 0} />
          <${ComplexityVerdict} />` : html`<p class="muted">${tr('Add characters to map their forces of antagonism.')}</p>`}
      </${Card}>
    </div>

    <div class="section-head">
      <h2>${tr('Scenes')}</h2>
      <span class="muted small">${tr('Every scene turns a value')} <${Cite} ch=${12} /></span>
      <button type="button" class="btn btn-quiet" onClick=${() => addScene()}><${Icon} name="plus" /> ${tr('Scene')}</button>
    </div>
    <div class="card scene-table-card">
      ${p.scenes.length ? html`<table class="scene-table">
        <thead><tr><th>${tr('Scene')}</th><th>${tr('Conflict')}</th><th>${tr('Cast')}</th><th>${tr('Value arc')}</th><th class="num">${tr('Beats')}</th><th class="num">${tr('Lines')}</th><th>${tr('Turn')}</th><th>${tr('Six tasks')}</th><th class="num">${tr('Flags')}</th></tr></thead>
        <tbody>${p.scenes.map((s) => {
          const a = analyses[s.id];
          const arc = valueArc(s)[0];
          const ct = CONFLICT_TYPES.find((t) => t.id === s.conflictType);
          const taskVals = Object.values(a.tasks).filter((v) => v != null);
          const health = taskVals.length && a.totalLines ? Math.round(taskVals.reduce((x, y) => x + y, 0) / taskVals.length) : null;
          return html`<tr onClick=${() => navigate(`write/${s.id}`)} class="clickable">
            <td><a href=${`#/write/${s.id}`} class="strong">${s.title}</a><div class="muted small">${s.heading}</div></td>
            <td class="small">${ct ? shortType(ct.name) : '—'}</td>
            <td>${s.participants.map((pt) => { const c = p.characters.find((x) => x.id === pt.characterId); return c ? html`<${CharDot} character=${c} />` : ''; })}</td>
            <td>${arc ? html`<${Sparkline} points=${arc.points} />` : html`<span class="muted small">${tr('no value')}</span>`}</td>
            <td class="num">${s.beats.length}</td>
            <td class="num">${a.totalLines}</td>
            <td class="small">${a.turningPoint && Math.abs(a.turningPoint.change) >= 2 ? `${tr('B')}${a.turningPoint.beatIndex + 1} · ${a.turningPoint.open > 0 ? '+' : ''}${a.turningPoint.open}→${a.turningPoint.close > 0 ? '+' : ''}${a.turningPoint.close}` : html`<span class="muted">${tr('none yet')}</span>`}</td>
            <td><${Meter} value=${health} /></td>
            <td class="num" title=${tr('Lines with confirmed or flagged problems; “?” lines are only to verify')}>${a.stats.linesWithIssues}${a.stats.linesToVerify ? html` <span class="muted small">+${a.stats.linesToVerify}?</span>` : ''}</td>
          </tr>`;
        })}</tbody>
      </table>` : html`<div class="empty">${tr('No scenes yet.')} <button type="button" class="link-btn" onClick=${() => addScene()}>${tr('Design the first scene.')}</button></div>`}
    </div>
  </div>`;
}

function ComplexityVerdict() {
  const p = state.project;
  const used = CONFLICT_LEVELS.filter((l) => p.characters.some((c) => (c.antagonism[l.id]?.level ?? 0) >= 3));
  const verdict = used.length >= 2 ? tr('Complex: {n} of 4 levels in play.', { n: used.length }) : used.length === 1 ? tr('Complicated, not complex: one level carries the story.') : tr('No forces of antagonism rated yet.');
  const talky = used.filter((l) => l.id === 'personal' || l.id === 'inner').length;
  return html`<p class="small verdict"><strong>${verdict}</strong> ${used.length ? (talky ? tr('Personal and inner conflict live in talk: expect a dialogue-rich story.') : tr('Physical and social conflict use less dialogue.')) : ''}</p>`;
}

function VoiceLineup() {
  const p = state.project;
  const [picked, setPicked] = useState(() => p.characters.slice(0, 2).map((c) => c.id));
  const chosen = p.characters.filter((c) => picked.includes(c.id)).slice(0, 3);
  const toggle = (id) => setPicked((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id].slice(-3)));
  const pairs = [];
  for (let i = 0; i < chosen.length; i++) for (let j = i + 1; j < chosen.length; j++) pairs.push([chosen[i], chosen[j], voiceDistance(chosen[i].voice.sliders, chosen[j].voice.sliders)]);
  return html`<${Card} title=${tr('Voice line-up')} ch=${[10, 2]} sub=${tr('Intended voice fingerprints, overlaid. Pick up to three.')}>
    <div class="chip-row">${p.characters.map((c) => html`<button type="button" class=${cx('char-chip', picked.includes(c.id) && 'active')} style=${`--c:${charColor(c)}`} aria-pressed=${picked.includes(c.id)} onClick=${() => toggle(c.id)}><span class="char-dot"></span>${c.name}</button>`)}</div>
    ${chosen.length ? html`<${Radar} dims=${VOICE_DIMENSIONS} series=${chosen.map((c) => ({ id: c.id, label: c.name, color: charColor(c), values: c.voice.sliders }))} size=${240} />` : html`<p class="muted">${tr('Select characters to compare.')}</p>`}
    ${pairs.map(([a, b, d]) => html`<div class="distance-row">
      <span>${a.name} ↔ ${b.name}</span>
      <${Meter} value=${Math.min(100, Math.round((d / 40) * 100))} title=${tr('Voice distance {d}', { d: Math.round(d) })} />
      <span class=${cx('small', d < 12 ? 'warn-text' : 'muted')}>${d < 12 ? tr('Too alike') : d < 20 ? tr('Distinct') : tr('Strongly contrasted')}</span>
    </div>`)}
  </${Card}>`;
}
