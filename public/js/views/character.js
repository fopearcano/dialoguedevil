import { html, useState, useMemo, cx, charColor } from '../lib.js';
import { state, mutate, act, navigate, openDrawer, aiAvailable } from '../store.js';
import {
  Card, Field, TextInput, TextArea, Select, ListInput, Slider, Tabs, Cite, Meter, Icon, FindingList, rich,
} from '../components/ui.js';
import { Radar, Spheres, ConflictRings, RelationshipWeb, LineDesignGlyph, Gauge } from '../components/viz.js';
import {
  CHARACTER_SECTIONS, SPHERES, VOICE_DIMENSIONS, MODALITIES, LINE_DESIGNS, MENTALITIES, CONFLICT_LEVELS, VOICE_EXERCISES, CHARACTER_SPECIFIC, DESIRE_COMPLEX, CONTEXT_CULTURE,
} from '../mckee.js';
import { profileCompleteness, measureVoice, analyzeLine, lineMetrics } from '../analysis.js';
import { getPath, setPath, uid } from '../model.js';
import { deleteCharacter } from '../actions.js';
import { tr, trn } from '../i18n.js';

const tabs = () => [
  { id: 'core', label: tr('Mask & core') },
  { id: 'desire', label: tr('Desire & conflict') },
  { id: 'voice', label: tr('Voice') },
  { id: 'secrets', label: tr('Secrets & ammunition') },
  { id: 'relationships', label: tr('Background desires') },
  { id: 'lab', label: tr('Voice lab') },
];

export function CharacterView({ character: c, tab }) {
  const list = tabs();
  const active = list.some((t) => t.id === tab) ? tab : 'core';
  const depth = profileCompleteness(c, CHARACTER_SECTIONS);
  const bind = (path) => (v) => mutate(() => setPath(c, path, v));
  return html`<div class="page character" style=${`--c:${charColor(c)}`}>
    <header class="char-head card">
      <div class="char-head-main">
        <div class="char-title-row">
          <span class="char-swatch"></span>
          <input class="title-input" value=${c.name} aria-label=${tr('Character name')} onInput=${(e) => bind('name')(e.currentTarget.value)} />
        </div>
        <div class="char-head-fields">
          <${TextInput} value=${c.role} onInput=${bind('role')} placeholder=${tr('Story role')} />
          <${TextInput} value=${c.logline} onInput=${bind('logline')} placeholder=${tr('One-line metaphor: what is this character a metaphor for?')} class="grow" />
        </div>
        <div class="char-head-actions">
          <button type="button" class="btn" onClick=${() => openDrawer('interview')}><${Icon} name="mic" /> ${tr('Interview')}</button>
          <button type="button" class="btn btn-quiet" onClick=${() => openDrawer('coach')} title=${aiAvailable() ? '' : tr('AI is optional; enable it in Settings')}><${Icon} name="spark" /> ${tr('AI coach')}</button>
          <button type="button" class="btn btn-quiet danger" onClick=${() => { if (confirm(tr('Delete {name}? Their lines stay in scenes without a speaker.', { name: c.name }))) deleteCharacter(c.id); }}><${Icon} name="trash" /> ${tr('Delete')}</button>
        </div>
      </div>
      <div class="char-head-gauges">
        <${Gauge} value=${depth.overall} label=${tr('Profile depth')} />
        <div class="section-meters">
          ${CHARACTER_SECTIONS.filter((s) => s.fields.length && s.id !== 'identity').map((s) => html`<${Meter} label=${s.name.split(':')[0]} value=${depth[s.id]} />`)}
        </div>
      </div>
    </header>
    <${Tabs} tabs=${list} active=${active} onChange=${(t) => navigate(`character/${c.id}/${t}`)} />
    ${active === 'core' ? html`<${CoreTab} c=${c} bind=${bind} />` : ''}
    ${active === 'desire' ? html`<${DesireTab} c=${c} bind=${bind} />` : ''}
    ${active === 'voice' ? html`<${VoiceTab} c=${c} bind=${bind} />` : ''}
    ${active === 'secrets' ? html`<${SecretsTab} c=${c} />` : ''}
    ${active === 'relationships' ? html`<${RelationshipsTab} c=${c} />` : ''}
    ${active === 'lab' ? html`<${LabTab} c=${c} bind=${bind} />` : ''}
  </div>`;
}

function SectionFields({ c, sectionId, bind, only }) {
  const s = CHARACTER_SECTIONS.find((x) => x.id === sectionId);
  return s.fields.filter((f) => !only || only.includes(f.path)).map((f) => html`<${Field} label=${f.label}>
    ${f.type === 'select' ? html`<${Select} value=${getPath(c, f.path)} onChange=${bind(f.path)} options=${f.options} placeholder="—" />`
      : f.type === 'list' ? html`<${ListInput} value=${getPath(c, f.path) || []} onChange=${bind(f.path)} placeholder=${f.placeholder} />`
      : f.type === 'text' ? html`<${TextInput} value=${getPath(c, f.path)} onInput=${bind(f.path)} placeholder=${f.placeholder} />`
      : html`<${TextArea} value=${getPath(c, f.path)} onInput=${bind(f.path)} placeholder=${f.placeholder} />`}
  </${Field}>`);
}

// ---------------------------------------------------------------------------

function CoreTab({ c, bind }) {
  const [sphere, setSphere] = useState('unsaid');
  const filled = Object.fromEntries(SPHERES.map((s) => [s.id, Boolean(c.spheres[s.id])]));
  return html`<div class="tab-body">
    <${Card} title=${tr('The three spheres')} ch=${[3, 'pref']} sub=${tr('A self within a self within a self. Dialogue resonates through all three, so the reader becomes a mind reader.')}>
      <div class="spheres-layout">
        <div class="spheres-figure">
          <${Spheres} active=${sphere} onPick=${setSphere} filled=${filled} />
          <p class="muted small center">${tr('Click a sphere to focus it.')}</p>
        </div>
        <div class="spheres-fields">
          ${SPHERES.map((s) => html`<div class=${cx('sphere-field', sphere === s.id && 'active', `sf-${s.id}`)} onFocusIn=${() => setSphere(s.id)}>
            <div class="sphere-field-head"><strong>${s.name}</strong><span class="muted small">${s.layer}</span></div>
            <p class="small muted">${s.desc}</p>
            <${TextArea} value=${c.spheres[s.id]} onInput=${bind(`spheres.${s.id}`)} placeholder=${s.prompt} />
          </div>`)}
        </div>
      </div>
    </${Card}>

    <div class="mask-core">
      <${Card} title=${tr('Characterization: the mask')} ch=${2} sub=${tr('Who she seems to be. Intrigue, convince, individualize.')} class="mask-card">
        <${SectionFields} c=${c} sectionId="characterization" bind=${bind} />
      </${Card}>
      <div class="mask-core-divider" aria-hidden="true"><span>${tr('vs.')}</span></div>
      <${Card} title=${tr('True character: the core')} ch=${[2, 3]} sub=${tr('Who she is, revealed only by risk-filled choices under pressure.')} class="core-card">
        <${SectionFields} c=${c} sectionId="trueCharacter" bind=${bind} only=${['trueCharacter.core', 'trueCharacter.contradiction']} />
        <${Field} label=${tr('Mentality')} ch=${14}>
          <div class="segmented">
            ${MENTALITIES.map((m) => html`<button type="button" class=${cx(c.trueCharacter.mentality === m.id && 'active')} title=${m.desc} onClick=${() => bind('trueCharacter.mentality')(m.id)}>${m.name}</button>`)}
          </div>
          <span class="field-hint">${MENTALITIES.find((m) => m.id === c.trueCharacter.mentality)?.desc}</span>
        </${Field}>
        ${c.trueCharacter.mentality === 'comic' ? html`<${Field} label=${tr('The comic “humor”')} ch=${14} hint=${tr('Ben Jonson: one peculiar quality that draws all his powers to run one way.')}>
          <${TextInput} value=${c.trueCharacter.humor} onInput=${bind('trueCharacter.humor')} placeholder=${tr('e.g. sibling rivalry, vanity, thrift')} />
        </${Field}>` : ''}
      </${Card}>
    </div>
  </div>`;
}

// ---------------------------------------------------------------------------

function DesireNode({ id, label, ch, c, bind, path, placeholder, cls }) {
  const def = DESIRE_COMPLEX.find((d) => d.id === id);
  return html`<div class=${cx('desire-node', cls)}>
    <div class="desire-node-head"><strong>${label}</strong> ${ch ? html`<${Cite} ch=${ch} />` : ''}</div>
    <${TextArea} value=${getPath(c, path)} onInput=${bind(path)} placeholder=${placeholder || def?.desc || ''} />
  </div>`;
}

function DesireTab({ c, bind }) {
  const [level, setLevel] = useState('personal');
  return html`<div class="tab-body">
    <${Card} title=${tr('Complex of desire')} ch=${12} sub=${tr('Desire is a figure in five dimensions. Read left to right: life out of balance, the want, the need beneath it, and the roots beneath that.')}>
      <div class="desire-map">
        <${DesireNode} id="incitingIncident" label=${tr('Inciting incident')} ch=${12} c=${c} bind=${bind} path="desire.incitingIncident" placeholder=${tr('What throws life out of balance?')} cls="dn-inciting" />
        <div class="desire-arrow" aria-hidden="true">→</div>
        <${DesireNode} id="objectOfDesire" label=${tr('Object of desire')} c=${c} bind=${bind} path="desire.objectOfDesire" cls="dn-object" />
        <div class="desire-arrow" aria-hidden="true">→</div>
        <${DesireNode} id="spine" label=${tr('Spine of action')} ch=${12} c=${c} bind=${bind} path="desire.spine" placeholder=${tr('The relentless pursuit under every scene.')} cls="dn-spine" />
        <div class="desire-under dn-super"><${DesireNode} id="superIntention" label=${tr('Super-intention')} c=${c} bind=${bind} path="desire.superIntention" /></div>
        <div class="desire-tension" aria-hidden="true"><span>⇄ ${tr('contradicts?')}</span></div>
        <div class="desire-under dn-subcon"><${DesireNode} id="subconsciousDesire" label=${tr('Subconscious desire')} ch=${19} c=${c} bind=${bind} path="desire.subconsciousDesire" placeholder=${tr('Does he also want something he can\'t admit? Is he his own worst enemy?')} /></div>
        <div class="desire-roots dn-motive"><${DesireNode} id="motivation" label=${tr('Motivation: why')} c=${c} bind=${bind} path="desire.motivation" /></div>
        <div class="desire-roots dn-excuse"><${DesireNode} id="excuse" label=${tr('Excuse: the cover story')} ch=${6} c=${c} bind=${bind} path="desire.excuse" placeholder=${tr('Richard III claims he cannot prove a lover, then seduces Anne. What does this character tell himself instead of the truth?')} /></div>
      </div>
      <p class="small muted">${rich('Desire is the source of action, and action is the source of dialogue {c12}. The object is objective; the super-intention is subjective. Don\'t confuse motivation with an excuse {c6}.', { c12: html`<${Cite} ch=${12} />`, c6: html`<${Cite} ch=${6} />` })}</p>
    </${Card}>

    <${Card} title=${tr('Forces of antagonism')} ch=${[12, 4]} sub=${tr('Opposition from any or all four levels. The more personal and private the conflict, the more the dialogue.')}>
      <div class="antagonism-layout">
        <${ConflictRings} levels=${c.antagonism} active=${level} onPick=${setLevel} />
        <div class="antagonism-fields">
          ${CONFLICT_LEVELS.map((l) => html`<div class=${cx('antag-row', level === l.id && 'active')} onFocusIn=${() => setLevel(l.id)}>
            <div class="antag-head"><strong>${l.name}</strong><span class="muted small">${l.talk}</span></div>
            <${Slider} value=${c.antagonism[l.id].level} min=${0} max=${10} onInput=${bind(`antagonism.${l.id}.level`)} ariaLabel=${tr('{level} intensity', { level: l.name })} />
            <${TextArea} value=${c.antagonism[l.id].text} onInput=${bind(`antagonism.${l.id}.text`)} placeholder=${l.desc} />
          </div>`)}
        </div>
      </div>
    </${Card}>
  </div>`;
}

// ---------------------------------------------------------------------------

function characterLines(characterId) {
  return state.project.scenes.flatMap((s) => s.beats.flatMap((b) => b.lines.filter((l) => l.speaker === characterId && l.kind !== 'action' && l.text.trim())));
}

function VoiceTab({ c, bind }) {
  const lang = state.project.lang;
  const lines = useMemo(() => characterLines(c.id), [state.version]);
  const measured = useMemo(() => measureVoice(lines.map((l) => l.text), lang), [state.version]);
  const series = [{ id: 'intended', label: tr('Intended voice'), color: 'var(--ink-3)', values: c.voice.sliders }];
  if (measured.scores) series.push({ id: 'measured', label: trn(measured.metrics.lines, 'Measured from {n} line', 'Measured from {n} lines'), color: charColor(c), values: measured.scores });
  const m = measured.metrics;
  const modality = MODALITIES.find((x) => x.id === m?.dominantModality)?.name;
  return html`<div class="tab-body">
    <div class="voice-layout">
      <${Card} title=${tr('Voice fingerprint')} ch=${[10, 7, 13]} sub=${measured.scores ? tr('Intended (sliders) vs. measured (from this character\'s lines across all scenes).') : tr('Intended voice. Write lines for this character and the measured voice will appear beside it.')} class="voice-radar-card">
        <${Radar} dims=${VOICE_DIMENSIONS} series=${series} size=${270} />
        ${m ? html`<table class="data-table compact">
          <caption>${tr('Content, length and pace')} <${Cite} ch=${13} /></caption>
          <tbody>
            <tr><th>${tr('Lines / words')}</th><td class="num">${m.lines} / ${m.words}</td></tr>
            <tr><th>${tr('Words per line')}</th><td class="num">${m.wordsPerLine}</td></tr>
            <tr><th>${tr('Words per sentence (longest)')}</th><td class="num">${m.wordsPerSentence} (${m.longestSentence})</td></tr>
            <tr><th>${tr('Syllables per word')}</th><td class="num">${m.syllablesPerWord}</td></tr>
            <tr><th>${tr('Questions')}</th><td class="num">${Math.round(m.questionRatio * 100)}%</td></tr>
            <tr><th>${lang === 'it' ? tr('Abstract or bureaucratic words') : tr('Latinate words')}</th><td class="num">${Math.round(m.latinateRatio * 100)}%</td></tr>
            <tr><th>${tr('Dominant modality')}</th><td>${modality || '—'}</td></tr>
          </tbody>
        </table>` : ''}
      </${Card}>
      <${Card} title=${tr('Tune the voice')} ch=${[7, 10]} sub=${tr('Each dimension is grounded in the book. Hover a slider for the principle.')}>
        <div class="slider-grid">
          ${VOICE_DIMENSIONS.map((d) => html`<div class="voice-slider" title=${d.hint}>
            <div class="voice-slider-head"><span>${d.label}</span><${Cite} ch=${d.ch} /><strong class="num">${c.voice.sliders[d.id]}</strong></div>
            <${Slider} value=${c.voice.sliders[d.id]} onInput=${bind(`voice.sliders.${d.id}`)} lo=${d.lo} hi=${d.hi} ariaLabel=${d.label} />
          </div>`)}
          <div class="voice-slider" title=${`${CONTEXT_CULTURE.high} ${CONTEXT_CULTURE.low}`}>
            <div class="voice-slider-head"><span>${tr('Low ↔ High context')}</span><${Cite} ch=${12} /><strong class="num">${c.voice.context}</strong></div>
            <${Slider} value=${c.voice.context} onInput=${bind('voice.context')} lo=${tr('Explains it all')} hi=${tr('Implies it all')} ariaLabel=${tr('Context')} />
          </div>
        </div>
      </${Card}>
    </div>

    <${Card} title=${tr('Lexicon')} ch=${10} sub=${CHARACTER_SPECIFIC.principle}>
      <div class="lexicon-grid">
        <${Field} label=${tr('Knowledge: specific nouns & verbs')} hint=${CHARACTER_SPECIFIC.knowledge}><${ListInput} value=${c.voice.knowledge} onChange=${bind('voice.knowledge')} placeholder=${tr('spike, saunter, milligram…')} /></${Field}>
        <${Field} label=${tr('Personality: adjectives & adverbs')} hint=${tr('“big” or “stupendous”? “quickly” or “ferociously”?')}><${ListInput} value=${c.voice.modifiers} onChange=${bind('voice.modifiers')} /></${Field}>
        <${Field} label=${tr('Signature words & phrases')}><${ListInput} value=${c.voice.signature} onChange=${bind('voice.signature')} /></${Field}>
        <${Field} label=${tr('Never says')} hint=${tr('The analyzer flags these as out of character.')}><${ListInput} value=${c.voice.neverSays} onChange=${bind('voice.neverSays')} /></${Field}>
        <${Field} label=${tr('Cultural treasure chest')} ch=${10} hint=${tr('Images, icons and third things drawn from what this character knows.')}><${ListInput} value=${c.voice.culture} onChange=${bind('voice.culture')} /></${Field}>
      </div>
    </${Card}>

    <div class="two-col">
      <${Card} title=${tr('Modality')} ch=${10} sub=${tr('Modals reveal a sense of self, place in society, view of time, and what is possible, permitted, necessary.')}>
        <div class="option-cards">
          ${MODALITIES.map((md) => html`<button type="button" class=${cx('option-card', c.voice.modality === md.id && 'active')} onClick=${() => bind('voice.modality')(c.voice.modality === md.id ? '' : md.id)}>
            <strong>${md.name}</strong><span class="mono small">${md.words}</span><span class="small muted">${md.desc}</span>
          </button>`)}
        </div>
      </${Card}>
      <${Card} title=${tr('Natural line design')} ch=${5} sub=${tr('Where the core word falls. Mixed designs keep talk spontaneous.')}>
        <div class="option-cards">
          ${LINE_DESIGNS.map((d) => html`<button type="button" class=${cx('option-card', c.voice.lineDesign === d.id && 'active')} onClick=${() => bind('voice.lineDesign')(d.id)}>
            <strong>${d.name}</strong><${LineDesignGlyph} design=${d.id} /><span class="small muted">${d.desc}</span>
          </button>`)}
        </div>
      </${Card}>
    </div>

    <${Card} title=${tr('Accent, habits, paralanguage')} ch=${[5, 10]}>
      <div class="two-col tight">
        <${Field} label=${tr('Accent, dialect, register')}><${TextInput} value=${c.voice.dialect} onInput=${bind('voice.dialect')} /></${Field}>
        <${Field} label=${tr('Verbal habits & paralanguage')} hint=${tr('Glides (“Well…”), interruptions, gestures, proxemics. Silence counts too.')}><${TextArea} value=${c.voice.tics} onInput=${bind('voice.tics')} /></${Field}>
      </div>
    </${Card}>
  </div>`;
}

// ---------------------------------------------------------------------------

function SecretsTab({ c }) {
  const p = state.project;
  const scenes = p.scenes.map((s) => [s.id, s.title]);
  const facts = [...c.facts].sort((a, b) => b.importance - a.importance);
  const sendFact = (fact, sceneId) => {
    if (!sceneId) return;
    mutate((proj) => {
      const s = proj.scenes.find((x) => x.id === sceneId);
      if (s && !s.exposition.some((e) => e.text === fact.text)) s.exposition.push({ id: uid('exp'), text: fact.text, delivered: false });
    });
  };
  return html`<div class="tab-body">
    <${Card} title=${tr('Secrets')} ch=${2} sub=${tr('The most important exposition is usually a secret. A lesser-of-two-evils dilemma pries it loose, and its revelation turns a scene.')}
      actions=${html`<button type="button" class="btn btn-quiet" onClick=${() => act(() => c.secrets.push({ id: uid('sec'), text: '', dilemma: '', revealIn: '' }))}><${Icon} name="plus" /> ${tr('Secret')}</button>`}>
      ${c.secrets.length ? c.secrets.map((s, i) => html`<div class="secret">
        <div class="secret-main">
          <${Field} label=${tr('Secret {n}', { n: i + 1 })}><${TextArea} value=${s.text} onInput=${(v) => mutate(() => { s.text = v; })} placeholder=${tr('What does she hide, from others or from herself?')} /></${Field}>
          <div class="dilemma">
            <div class="dilemma-pan"><span class="dilemma-label">${tr('If revealed…')}</span><span class="dilemma-label">${tr('If concealed…')}</span></div>
            <${TextArea} value=${s.dilemma} onInput=${(v) => mutate(() => { s.dilemma = v; })} placeholder=${tr('If I tell, I lose ___. If I don\'t, something worse happens: ___.')} />
          </div>
          <div class="secret-meta">
            <${Field} label=${tr('Revealed in scene')}><${Select} value=${s.revealIn} onChange=${(v) => mutate(() => { s.revealIn = v; })} options=${scenes} placeholder=${tr('(not yet placed)')} /></${Field}>
            <button type="button" class="icon-btn" aria-label=${tr('Delete secret')} onClick=${() => act(() => { c.secrets.splice(i, 1); })}><${Icon} name="trash" /></button>
          </div>
        </div>
      </div>`) : html`<p class="muted">${tr('No secrets yet. What does this character hide?')}</p>`}
    </${Card}>

    <${Card} title=${tr('Exposition as ammunition')} ch=${2} sub=${tr('List every fact this character knows, rank it by importance, then let them use it as a weapon at the right moment.')}
      actions=${html`<button type="button" class="btn btn-quiet" onClick=${() => act(() => c.facts.push({ id: uid('fact'), text: '', importance: 3 }))}><${Icon} name="plus" /> ${tr('Fact')}</button>`}>
      ${facts.length ? html`<div class="facts">
        ${facts.map((f) => html`<div class="fact-row">
          <div class="fact-importance" title=${tr('Importance (1-5)')}>
            ${[1, 2, 3, 4, 5].map((n) => html`<button type="button" class=${cx('pip', n <= f.importance && 'on')} aria-label=${tr('Importance {n}', { n })} onClick=${() => act(() => { f.importance = n; })}></button>`)}
          </div>
          <${TextInput} value=${f.text} onInput=${(v) => mutate(() => { f.text = v; })} placeholder=${tr('A fact of setting, history or character')} class="grow" />
          <${Select} value="" onChange=${(v) => sendFact(f, v)} options=${scenes} placeholder=${tr('Smuggle into scene…')} ariaLabel=${tr('Add to scene exposition')} />
          <button type="button" class="icon-btn" aria-label=${tr('Delete fact')} onClick=${() => act(() => { c.facts = c.facts.filter((x) => x.id !== f.id); })}><${Icon} name="trash" /></button>
        </div>`)}
      </div>` : html`<p class="muted">${tr('No facts yet.')}</p>`}
    </${Card}>
  </div>`;
}

// ---------------------------------------------------------------------------

function RelationshipsTab({ c }) {
  const p = state.project;
  const others = p.characters.filter((x) => x.id !== c.id);
  return html`<div class="tab-body">
    <${Card} title=${tr('Web of restraint')} ch=${12} sub=${tr('Background desires: the relationships a character wants kept stable. They limit what she will say. A character with nothing to lose is capable of anything.')}>
      <div class="rel-layout">
        <${RelationshipWeb} center=${c} relationships=${c.relationships} characters=${p.characters} />
        <div class="rel-list">
          ${c.relationships.map((r, i) => html`<div class="rel-row">
            <div class="rel-row-head">
              <${Select} value=${r.targetId} onChange=${(v) => mutate(() => { r.targetId = v; })} options=${others.map((o) => [o.id, o.name])} placeholder=${tr('(someone else)')} ariaLabel=${tr('Relationship with')} />
              ${!r.targetId ? html`<${TextInput} value=${r.label} onInput=${(v) => mutate(() => { r.label = v; })} placeholder=${tr('Who or what? (boss, church, Dad…)')} class="grow" />` : html`<${TextInput} value=${r.label} onInput=${(v) => mutate(() => { r.label = v; })} placeholder=${tr('Nature of the bond')} class="grow" />`}
              <button type="button" class="icon-btn" aria-label=${tr('Remove relationship')} onClick=${() => act(() => { c.relationships.splice(i, 1); })}><${Icon} name="trash" /></button>
            </div>
            <${Slider} value=${r.charge} min=${-10} max=${10} onInput=${(v) => mutate(() => { r.charge = v; })} diverging lo=${tr('negative')} hi=${tr('positive')} label=${tr('Charge')} />
            <${TextArea} value=${r.restraint} onInput=${(v) => mutate(() => { r.restraint = v; })} placeholder=${tr('What can\'t she say or do to this person, at least not yet?')} />
          </div>`)}
          <button type="button" class="btn btn-quiet" onClick=${() => act(() => c.relationships.push({ id: uid('rel'), targetId: '', label: '', charge: 0, restraint: '' }))}><${Icon} name="plus" /> ${tr('Relationship')}</button>
        </div>
      </div>
    </${Card}>
  </div>`;
}

// ---------------------------------------------------------------------------

function LabTab({ c, bind }) {
  const [test, setTest] = useState('');
  const p = state.project;
  const ctx = { character: c, medium: p.medium, genreMode: p.genreMode, lang: p.lang };
  const testFindings = test.trim() ? analyzeLine({ text: test }, ctx).filter((f) => f.flaw !== 'noSubtext') : [];
  const tm = test.trim() ? lineMetrics(test, p.lang) : null;
  return html`<div class="tab-body">
    <p class="lead">${tr('Say it their way. Each exercise isolates one principle; write the line as only {name} would say it.', { name: c.name })} <span class="muted">${tr('Ask the Magic If: “If I were {name} in this situation, what would I say?”', { name: c.name })}</span> <${Cite} ch=${19} /></p>
    <div class="lab-grid">
      ${VOICE_EXERCISES.map((ex) => {
        const val = c.samples[ex.id] || '';
        const fs = val.trim() ? analyzeLine({ text: val }, ctx).filter((f) => f.flaw !== 'noSubtext') : [];
        return html`<div class="lab-card card">
          <div class="lab-head"><strong>${ex.title}</strong> <${Cite} ch=${ex.ch} /></div>
          <p class="small muted">${ex.prompt}</p>
          <${TextArea} value=${val} onInput=${bind(`samples.${ex.id}`)} placeholder=${`${c.name}: …`} class="script" />
          ${fs.length ? html`<div class="lab-findings">${fs.map((f) => html`<span class=${`mini-finding sev-${f.severity}`} title=${f.message}>${f.name}</span>`)}</div>` : ''}
        </div>`;
      })}
    </div>
    <${Card} title=${tr('Test any line')} ch=${[6, 7, 8, 9]} sub=${tr('Paste a line to see what the analyzer hears, measured against this character\'s profile.')}>
      <${TextArea} value=${test} onInput=${setTest} placeholder=${tr('Type a line of dialogue…')} class="script" />
      ${tm ? html`<div class="metric-chips">
        <span>${trn(tm.words, '{n} word', '{n} words')}</span><span>${trn(tm.sentences, '{n} sentence', '{n} sentences')}</span>
        <span>${tr('{n} syllables/word', { n: tm.words ? (tm.syllables / tm.words).toFixed(2) : 0 })}</span>
        <span>${p.lang === 'it' ? tr('{n} abstract', { n: tm.latinate }) : tr('{n} Latinate', { n: tm.latinate })}</span><span>${trn(tm.questions, '{n} question', '{n} questions')}</span>
      </div>` : ''}
      ${test.trim() ? html`<${FindingList} findings=${testFindings} empty=${tr('Nothing flagged. Now ask: what action does the line take?')} />` : ''}
    </${Card}>
  </div>`;
}
