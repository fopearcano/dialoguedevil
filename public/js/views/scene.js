import { html, useState, useMemo, cx, charColor, download, slug } from '../lib.js';
import { state, mutate, act, navigate, toast } from '../store.js';
import { Card, Field, TextInput, TextArea, Select, Slider, Tabs, CharSelect, Icon, GerundInput } from '../components/ui.js';
import { Trialogue } from '../components/viz.js';
import {
  CONFLICT_TYPES, THREE_TRACKS, DIALOGUE_MODES, MEDIA, STORY_VALUES, TURNING_POINT_TYPES, KEY_QUESTIONS,
} from '../mckee.js';
import { uid, characterById } from '../model.js';
import { FORMATS } from '../export.js';
import { deleteScene } from '../actions.js';
import { WorkshopView } from './workshop.js';

const TABS = [
  { id: 'design', label: 'Scene design' },
  { id: 'workshop', label: 'Dialogue workshop' },
  { id: 'script', label: 'Script' },
];

export function SceneView({ scene: s, tab }) {
  const active = TABS.some((t) => t.id === tab) ? tab : s.beats.length ? 'workshop' : 'design';
  const set = (key) => (v) => mutate(() => { s[key] = v; });
  return html`<div class="page scene">
    <header class="scene-head">
      <div class="grow">
        <input class="title-input" value=${s.title} aria-label="Scene title" onInput=${(e) => set('title')(e.currentTarget.value)} />
        <input class="heading-input" value=${s.heading} placeholder="INT. LOCATION - TIME" aria-label="Scene heading" onInput=${(e) => set('heading')(e.currentTarget.value)} />
      </div>
      <button type="button" class="btn btn-quiet danger" onClick=${() => { if (confirm(`Delete scene “${s.title}”?`)) deleteScene(s.id); }}><${Icon} name="trash" /> Delete</button>
    </header>
    <${Tabs} tabs=${TABS.map((t) => (t.id === 'workshop' ? { ...t, badge: s.beats.length || null } : t))} active=${active} onChange=${(t) => navigate(`scene/${s.id}/${t}`)} />
    ${active === 'design' ? html`<${DesignTab} s=${s} set=${set} />` : ''}
    ${active === 'workshop' ? html`<${WorkshopView} scene=${s} />` : ''}
    ${active === 'script' ? html`<${ScriptTab} s=${s} />` : ''}
  </div>`;
}

function DesignTab({ s, set }) {
  const p = state.project;
  const [checked, setChecked] = useState({});
  const a = characterById(p, s.participants[0]?.characterId);
  const b = characterById(p, s.participants[1]?.characterId);
  return html`<div class="tab-body design">
    <div class="two-col">
      <${Card} title="Setting & mode" ch=${1}>
        <${Field} label="Description"><${TextArea} value=${s.description} onInput=${set('description')} placeholder="Where are we, what do we see, what is already happening?" /></${Field}>
        <div class="two-col tight">
          <${Field} label="Medium" ch=${[1, 4]}><${Select} value=${s.medium} onChange=${set('medium')} options=${MEDIA.map((m) => [m.id, m.name])} placeholder=${`Project default (${p.medium})`} /></${Field}>
          <${Field} label="Mode" ch=${1}><${Select} value=${s.mode} onChange=${set('mode')} options=${DIALOGUE_MODES.map((m) => [m.id, m.name])} /></${Field}>
        </div>
        <${Field} label="Track: who is talking to whom?" ch=${1}>
          <div class="segmented">${THREE_TRACKS.map((t) => html`<button type="button" class=${cx(s.track === t.id && 'active')} title=${t.desc} onClick=${() => set('track')(t.id)}>${t.name}</button>`)}</div>
          <span class="field-hint">${THREE_TRACKS.find((t) => t.id === s.track)?.desc}</span>
        </${Field}>
      </${Card}>
      <${Card} title="Third thing" ch=${[8, 11]} sub="We rarely talk face to face about what we need. Funnel the struggle through a third thing and the duelogue becomes a trialogue.">
        <${Trialogue} a=${a} b=${b} third=${s.thirdThing} />
        <${TextInput} value=${s.thirdThing} onInput=${set('thirdThing')} placeholder="An object, a person, a cultural icon, an idea…" />
      </${Card}>
    </div>

    <${Card} title="Conflict type" ch=${[12, 13, 14, 15, 16, 17, 18]} sub="The quality of conflict determines the quality of action, and the quality of action determines the quality of talk.">
      <div class="option-cards six">
        ${CONFLICT_TYPES.map((t) => html`<button type="button" class=${cx('option-card', s.conflictType === t.id && 'active')} onClick=${() => set('conflictType')(t.id)}>
          <strong>${t.name}</strong><span class="small muted">${t.example}</span><span class="small">${t.desc}</span>
        </button>`)}
      </div>
      ${(() => { const t = CONFLICT_TYPES.find((x) => x.id === s.conflictType); return t ? html`<ul class="tips">${t.tips.map((tip) => html`<li>${tip}</li>`)}</ul>` : ''; })()}
    </${Card}>

    <${Card} title="Who wants what" ch=${[12, 19]} sub="Grant a character her scene intention and the scene ends. Who drives this scene and makes it happen?"
      actions=${html`<button type="button" class="btn btn-quiet" onClick=${() => act(() => s.participants.push({ characterId: '', intention: '', subIntention: '', tactic: '', antagonism: '' }))}><${Icon} name="plus" /> Participant</button>`}>
      <div class="collision">
        ${s.participants.map((pt, i) => {
          const c = characterById(p, pt.characterId);
          return html`<div class=${cx('participant', i % 2 ? 'right' : 'left', s.driver === pt.characterId && pt.characterId && 'driver')} style=${`--c:${charColor(c)}`}>
            <div class="participant-head">
              <${CharSelect} project=${p} value=${pt.characterId} onChange=${(v) => mutate(() => { pt.characterId = v; })} />
              <label class="driver-toggle small"><input type="radio" name=${`driver-${s.id}`} checked=${s.driver === pt.characterId && !!pt.characterId} onChange=${() => set('driver')(pt.characterId)} /> drives the scene</label>
              <button type="button" class="icon-btn" aria-label="Remove participant" onClick=${() => act(() => { s.participants.splice(i, 1); })}><${Icon} name="trash" /></button>
            </div>
            <${Field} label="Scene intention (conscious)"><${TextInput} value=${pt.intention} onInput=${(v) => mutate(() => { pt.intention = v; })} placeholder="What she wants right now" /></${Field}>
            <${Field} label="Subconscious intention"><${TextInput} value=${pt.subIntention} onInput=${(v) => mutate(() => { pt.subIntention = v; })} placeholder="What she really wants" /></${Field}>
            <${Field} label="Opening tactic"><${GerundInput} value=${pt.tactic} onInput=${(v) => mutate(() => { pt.tactic = v; })} /></${Field}>
            <${Field} label="Sense of antagonism"><${TextInput} value=${pt.antagonism} onInput=${(v) => mutate(() => { pt.antagonism = v; })} placeholder="What does she sense is in her way?" /></${Field}>
            ${c?.desire?.superIntention ? html`<p class="small muted">Super-intention: ${c.desire.superIntention}</p>` : ''}
          </div>`;
        })}
        ${s.participants.length >= 2 ? html`<div class="collision-spark" aria-hidden="true">⟷</div>` : ''}
      </div>
    </${Card}>

    <div class="two-col">
      <${Card} title="Values at stake" ch=${12} sub="Opening charge now; the beats will carry it to its closing charge. If nothing changes, nothing happens."
        actions=${html`<button type="button" class="btn btn-quiet" onClick=${() => act(() => s.values.push({ id: uid('val'), positive: '', negative: '', opening: 0 }))}><${Icon} name="plus" /> Value</button>`}>
        ${s.values.map((v, i) => html`<div class="value-row">
          <div class="value-pair">
            <${TextInput} value=${v.positive} list="dd-values-pos" placeholder="positive" onInput=${(x) => mutate(() => { v.positive = x; })} />
            <span>/</span>
            <${TextInput} value=${v.negative} list="dd-values-neg" placeholder="negative" onInput=${(x) => mutate(() => { v.negative = x; })} />
            <button type="button" class="icon-btn" aria-label="Remove value" onClick=${() => act(() => { s.values.splice(i, 1); })}><${Icon} name="trash" /></button>
          </div>
          <${Slider} value=${v.opening} min=${-10} max=${10} diverging label=${i === 0 ? 'Opening charge (primary value)' : 'Opening charge'} lo=${v.negative || '−'} hi=${v.positive || '+'} onInput=${(x) => mutate(() => { v.opening = x; })} />
        </div>`)}
        <datalist id="dd-values-pos">${STORY_VALUES.map(([x]) => html`<option value=${x} />`)}</datalist>
        <datalist id="dd-values-neg">${STORY_VALUES.map(([, y]) => html`<option value=${y} />`)}</datalist>
      </${Card}>
      <${Card} title="Turning point plan" ch=${[12, 9]}>
        <div class="option-cards">
          ${TURNING_POINT_TYPES.map((t) => html`<button type="button" class=${cx('option-card', s.turningPoint.type === t.id && 'active')} onClick=${() => act(() => { s.turningPoint.type = t.id; })}>
            <strong>${t.name}</strong><span class="small muted">${t.desc}</span>
          </button>`)}
        </div>
        <${Field} label="What turns, and how?"><${TextArea} value=${s.turningPoint.note} onInput=${(x) => mutate(() => { s.turningPoint.note = x; })} placeholder="Time it: too soon and the scene runs downhill; too late and they saw it coming." /></${Field}>
      </${Card}>
    </div>

    <div class="two-col">
      <${Card} title="Exposition to smuggle" ch=${2} sub="What the audience must learn here. Tick a fact once a line delivers it invisibly, as ammunition or through narrative drive."
        actions=${html`<button type="button" class="btn btn-quiet" onClick=${() => act(() => s.exposition.push({ id: uid('exp'), text: '', delivered: false }))}><${Icon} name="plus" /> Fact</button>`}>
        ${s.exposition.map((f, i) => html`<div class="exp-row">
          <input type="checkbox" checked=${f.delivered} aria-label="Delivered" onChange=${(e) => mutate(() => { f.delivered = e.currentTarget.checked; })} />
          <${TextInput} value=${f.text} onInput=${(x) => mutate(() => { f.text = x; })} placeholder="A fact the audience needs" class="grow" />
          <button type="button" class="icon-btn" aria-label="Remove fact" onClick=${() => act(() => { s.exposition.splice(i, 1); })}><${Icon} name="trash" /></button>
        </div>`)}
        ${!s.exposition.length ? html`<p class="muted small">None planned. Characters' facts can be sent here from their profiles.</p>` : ''}
      </${Card}>
      <${Card} title="Key questions" ch=${19} sub="Ask them before, during and after writing the scene. The best questions create the best answers.">
        <ul class="checklist">
          ${KEY_QUESTIONS.map((q) => html`<li><label><input type="checkbox" checked=${!!checked[q.id]} onChange=${() => setChecked({ ...checked, [q.id]: !checked[q.id] })} />
            <span><strong>${q.name}.</strong> ${q.q}</span></label></li>`)}
        </ul>
      </${Card}>
    </div>
    <div class="center"><button type="button" class="btn btn-primary" onClick=${() => navigate(`scene/${s.id}/workshop`)}>Go to the dialogue workshop →</button></div>
  </div>`;
}

function ScriptTab({ s }) {
  const p = state.project;
  const [fmt, setFmt] = useState('fountain');
  const text = useMemo(() => FORMATS[fmt].fn(s, p), [state.version, fmt]);
  return html`<div class="tab-body">
    <div class="script-toolbar">
      <div class="segmented">${Object.entries(FORMATS).map(([id, f]) => html`<button type="button" class=${cx(fmt === id && 'active')} onClick=${() => setFmt(id)}>${f.name}</button>`)}</div>
      <div class="grow"></div>
      <button type="button" class="btn btn-quiet" onClick=${async () => { try { await navigator.clipboard.writeText(text); toast('Copied to clipboard'); } catch { toast('Copy failed; select the text instead', 'error'); } }}><${Icon} name="copy" /> Copy</button>
      <button type="button" class="btn" onClick=${() => download(`${slug(p.title)}-${slug(s.title)}.${FORMATS[fmt].ext}`, text)}><${Icon} name="download" /> Download</button>
    </div>
    <pre class=${cx('script-page', `fmt-${fmt}`)}>${text}</pre>
  </div>`;
}
