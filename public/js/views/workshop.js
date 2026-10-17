import { html, useState, useMemo, useRef, useEffect, cx, charColor } from '../lib.js';
import { state, mutate, act, setSetting, openDrawer, aiAvailable } from '../store.js';
import {
  Card, TextArea, Cite, CharSelect, CharChip, Icon, GerundInput, FindingBadge, FindingList, Meter,
} from '../components/ui.js';
import { SceneArc, TaskBars } from '../components/viz.js';
import { analyzeScene, analyzeLine } from '../analysis.js';
import { SIX_TASKS, FIVE_STEPS, CONFLICT_TYPES, BEAT_DEFINITION, FLAWS } from '../mckee.js';
import { newBeat, newLine, characterById } from '../model.js';

export function WorkshopView({ scene: s }) {
  const p = state.project;
  const analysis = useMemo(() => analyzeScene(s, p), [state.version]);
  const [primaryId, setPrimaryId] = useState(s.values[0]?.id);
  const [focusFlaw, setFocusFlaw] = useState('');
  const showSubtext = state.settings.showSubtext;
  const tpIndex = analysis.turningPoint && Math.abs(analysis.turningPoint.change) >= 2 ? analysis.turningPoint.beatIndex : null;
  const arcPrimary = primaryId && s.values.some((v) => v.id === primaryId) ? primaryId : s.values[0]?.id;
  return html`<div class="tab-body workshop">
    <div class="workshop-top card">
      <${SceneArc} arcs=${analysis.arcs} beats=${s.beats} characters=${p.characters} turningIndex=${tpIndex} primaryId=${arcPrimary} onPickPrimary=${setPrimaryId} />
    </div>
    <div class="workshop-grid">
      <div class="workshop-main">
        <div class="workshop-toolbar">
          <label class="toggle"><input type="checkbox" checked=${showSubtext} onChange=${(e) => setSetting('showSubtext', e.currentTarget.checked)} /> <${Icon} name="layers" /> Show subtext (iceberg view)</label>
          ${focusFlaw ? html`<button type="button" class="chip-btn" onClick=${() => setFocusFlaw('')}>Highlighting: ${FLAWS[focusFlaw]?.name || focusFlaw} ×</button>` : ''}
          <span class="grow"></span>
          <span class="muted small" title=${BEAT_DEFINITION.text}>A beat = action / reaction <${Cite} ch=${[9, 12]} /></span>
        </div>
        ${s.beats.length ? s.beats.map((b, i) => html`<${BeatCard} key=${b.id} s=${s} beat=${b} index=${i} analysis=${analysis} showSubtext=${showSubtext} turning=${tpIndex === i} focusFlaw=${focusFlaw} />`)
          : html`<div class="empty card">
            <div class="empty-title">No beats yet.</div>
            <p class="muted">Before writing a line, ask: what does each character want out of this situation? What action would she take, right now, to get it? Only then: what exact words? <${Cite} ch=${2} /></p>
          </div>`}
        <${Composer} s=${s} />
      </div>
      <aside class="workshop-side">
        <${Diagnostics} s=${s} analysis=${analysis} focusFlaw=${focusFlaw} setFocusFlaw=${setFocusFlaw} />
      </aside>
    </div>
  </div>`;
}

// ---------------------------------------------------------------------------

function BeatCard({ s, beat: b, index, analysis, showSubtext, turning, focusFlaw }) {
  const p = state.project;
  const move = (dir) => act(() => {
    const j = index + dir;
    if (j < 0 || j >= s.beats.length) return;
    [s.beats[index], s.beats[j]] = [s.beats[j], s.beats[index]];
  });
  const remove = () => {
    if (b.lines.length && !confirm(`Delete beat ${index + 1} and its ${b.lines.length} line(s)?`)) return;
    act(() => { s.beats.splice(index, 1); });
  };
  const insertAfter = () => act(() => { s.beats.splice(index + 1, 0, newBeat({ ...s, beats: s.beats.slice(0, index + 1) })); });
  return html`<section class=${cx('beat card', turning && 'turning')} id=${`beat-${b.id}`}>
    <header class="beat-head">
      <div class="beat-num">
        <span>BEAT ${index + 1}</span>
        ${turning ? html`<span class="tp-badge" title="The value changes decisively in this beat">Turning point</span>` : ''}
      </div>
      <div class="beat-ar">
        <div class="ar-row">
          <span class="ar-label">ACTION</span>
          <${CharSelect} project=${p} value=${b.actor} onChange=${(v) => mutate(() => { b.actor = v; })} />
          <${GerundInput} value=${b.action} onInput=${(v) => mutate(() => { b.action = v; })} placeholder="e.g. cornering her" />
        </div>
        <div class="ar-row">
          <span class="ar-label">REACTION</span>
          <${CharSelect} project=${p} value=${b.reactor} onChange=${(v) => mutate(() => { b.reactor = v; })} />
          <${GerundInput} value=${b.reaction} onInput=${(v) => mutate(() => { b.reaction = v; })} placeholder="e.g. buying time" />
        </div>
      </div>
      <div class="beat-tools">
        <button type="button" class="icon-btn" aria-label="Move beat up" disabled=${index === 0} onClick=${() => move(-1)}><${Icon} name="up" /></button>
        <button type="button" class="icon-btn" aria-label="Move beat down" disabled=${index === s.beats.length - 1} onClick=${() => move(1)}><${Icon} name="down" /></button>
        <button type="button" class="icon-btn" aria-label="Insert beat after" title="Insert a beat after this one" onClick=${insertAfter}><${Icon} name="plus" /></button>
        <button type="button" class="icon-btn" aria-label="Delete beat" onClick=${remove}><${Icon} name="trash" /></button>
      </div>
    </header>
    <div class="beat-values">
      ${s.values.map((v) => {
        const val = b.charges[v.id] ?? 0;
        return html`<label class="charge" title=${`${v.positive}/${v.negative} charge after this beat`}>
          <span class="charge-name">${v.positive || '+'}/${v.negative || '−'}</span>
          <input type="range" min="-10" max="10" value=${val} class=${val > 0 ? 'pos' : val < 0 ? 'neg' : ''} onInput=${(e) => mutate(() => { b.charges[v.id] = Number(e.currentTarget.value); })} aria-label=${`${v.positive}/${v.negative} charge`} />
          <strong class="num">${val > 0 ? '+' : ''}${val}</strong>
        </label>`;
      })}
      <label class="charge intensity" title="Each beat should top the last">
        <span class="charge-name">intensity</span>
        <input type="range" min="1" max="10" value=${b.intensity} onInput=${(e) => mutate(() => { b.intensity = Number(e.currentTarget.value); })} aria-label="Intensity" />
        <strong class="num">${b.intensity}</strong>
      </label>
    </div>
    <div class="lines">
      ${b.lines.map((l, li) => html`<${LineRow} key=${l.id} s=${s} beat=${b} line=${l} index=${li} findings=${analysis.lines[l.id] || []} showSubtext=${showSubtext} focusFlaw=${focusFlaw} />`)}
      ${!b.lines.length ? html`<p class="muted small beat-empty">No lines yet. Use the composer below; lines are added to the last beat.</p>` : ''}
    </div>
  </section>`;
}

// ---------------------------------------------------------------------------

function LineRow({ s, beat: b, line: l, index, findings, showSubtext, focusFlaw }) {
  const p = state.project;
  const [alts, setAlts] = useState(false);
  const [draft, setDraft] = useState('');
  const c = characterById(p, l.speaker);
  const set = (key) => (v) => mutate(() => { l[key] = v; });
  const move = (dir) => act(() => {
    const j = index + dir;
    if (j < 0 || j >= b.lines.length) return;
    [b.lines[index], b.lines[j]] = [b.lines[j], b.lines[index]];
  });
  const remove = () => act(() => { b.lines.splice(index, 1); });
  const visible = findings.filter((f) => f.flaw !== 'noSubtext' || (!l.subtext && !l.tactic));
  const dim = focusFlaw && !findings.some((f) => f.flaw === focusFlaw);
  if (l.kind === 'action') {
    return html`<div class=${cx('line action-line', dim && 'dim')}>
      <span class="action-tag">action</span>
      <${TextArea} value=${l.text} onInput=${set('text')} placeholder="Stage direction, paralanguage, silence…" class="action-text" rows=${1} />
      <div class="line-tools">
        <button type="button" class="icon-btn" aria-label="Move up" onClick=${() => move(-1)}><${Icon} name="up" /></button>
        <button type="button" class="icon-btn" aria-label="Move down" onClick=${() => move(1)}><${Icon} name="down" /></button>
        <button type="button" class="icon-btn" aria-label="Delete" onClick=${remove}><${Icon} name="trash" /></button>
      </div>
    </div>`;
  }
  return html`<div class=${cx('line', dim && 'dim')} style=${`--c:${charColor(c)}`} id=${`line-${l.id}`}>
    <div class="line-gutter"></div>
    <div class="line-main">
      <div class="line-head">
        <${CharSelect} project=${p} value=${l.speaker} onChange=${set('speaker')} />
        <input class="paren-input" value=${l.paren} placeholder="(paralanguage)" aria-label="Parenthetical" onInput=${(e) => set('paren')(e.currentTarget.value)} />
        ${l.exposition ? html`<span class="exp-tag" title="Carries exposition">exposition</span>` : ''}
        <div class="line-tools">
          <button type="button" class=${cx('icon-btn', alts && 'active')} title="Alternatives: never settle for the first choice (Ch. 7)" aria-label="Alternatives" onClick=${() => setAlts(!alts)}><${Icon} name="swap" />${l.alternatives.length ? html`<span class="mini-count">${l.alternatives.length}</span>` : ''}</button>
          <button type="button" class="icon-btn" title=${aiAvailable() ? 'Line lab: five AI alternatives' : 'Line lab (AI, optional): enable in Settings'} aria-label="AI line lab" onClick=${() => openDrawer('lab', { mode: 'alternatives', lineId: l.id, sceneId: s.id })}><${Icon} name="spark" /></button>
          <button type="button" class=${cx('icon-btn', l.exposition && 'active')} title="Mark: this line carries exposition" aria-label="Toggle exposition" onClick=${() => set('exposition')(!l.exposition)}>i</button>
          <button type="button" class="icon-btn" aria-label="Move up" onClick=${() => move(-1)}><${Icon} name="up" /></button>
          <button type="button" class="icon-btn" aria-label="Move down" onClick=${() => move(1)}><${Icon} name="down" /></button>
          <button type="button" class="icon-btn" aria-label="Delete line" onClick=${remove}><${Icon} name="trash" /></button>
        </div>
      </div>
      <${TextArea} value=${l.text} onInput=${set('text')} placeholder="What she says…" class="script line-text" rows=${1} />
      ${showSubtext ? html`<div class="undertow">
        <div class="waterline" aria-hidden="true"></div>
        <div class="undertow-grid">
          <label><span class="under-label">Subtext · the unsaid</span>
            <${TextArea} value=${l.subtext} onInput=${set('subtext')} placeholder="What she thinks and feels but doesn't say" rows=${1} />
          </label>
          <label><span class="under-label">Action (gerund)</span>
            <${GerundInput} value=${l.tactic} onInput=${set('tactic')} />
          </label>
        </div>
      </div>` : ''}
      ${visible.length ? html`<div class="line-flags">${visible.map((f) => html`<${FindingBadge} f=${f} />`)}</div>` : ''}
      ${alts ? html`<div class="alts">
        <div class="alts-head"><strong>Alternatives</strong> <span class="muted small">Write every choice down, then keep the best <${Cite} ch=${[7, 9]} /></span></div>
        ${l.alternatives.map((a, ai) => html`<div class="alt-row">
          <span class="script grow">${a}</span>
          <button type="button" class="link-btn small" onClick=${() => mutate(() => { const cur = l.text; l.text = a; l.alternatives[ai] = cur; })}>Swap in</button>
          <button type="button" class="icon-btn" aria-label="Delete alternative" onClick=${() => mutate(() => { l.alternatives.splice(ai, 1); })}><${Icon} name="close" /></button>
        </div>`)}
        <div class="alt-row">
          <input class="input script grow" value=${draft} placeholder="Another way to say it…" onInput=${(e) => setDraft(e.currentTarget.value)}
            onKeyDown=${(e) => { if (e.key === 'Enter' && draft.trim()) { mutate(() => { l.alternatives.push(draft.trim()); }); setDraft(''); } }} />
          <button type="button" class="btn btn-quiet" disabled=${!draft.trim()} onClick=${() => { mutate(() => { l.alternatives.push(draft.trim()); }); setDraft(''); }}>Add</button>
        </div>
      </div>` : ''}
    </div>
  </div>`;
}

// ---------------------------------------------------------------------------
// Composer: the five steps of behavior, ending in expression (Ch. 12, 19).
// ---------------------------------------------------------------------------

function Composer({ s }) {
  const p = state.project;
  const parts = s.participants.filter((x) => x.characterId);
  const lastLine = s.beats.flatMap((b) => b.lines).filter((l) => l.kind !== 'action').slice(-1)[0];
  const nextDefault = parts.find((x) => x.characterId !== lastLine?.speaker)?.characterId || parts[0]?.characterId || p.characters[0]?.id || '';
  const [speaker, setSpeaker] = useState(nextDefault);
  const [antag, setAntag] = useState('');
  const [tactic, setTactic] = useState('');
  const [subtext, setSubtext] = useState('');
  const [paren, setParen] = useState('');
  const [text, setText] = useState('');
  const [steps, setSteps] = useState(true);
  const textRef = useRef(null);
  useEffect(() => { if (!speaker && nextDefault) setSpeaker(nextDefault); }, [nextDefault]);
  const c = characterById(p, speaker);
  const pt = s.participants.find((x) => x.characterId === speaker);
  const other = characterById(p, parts.find((x) => x.characterId !== speaker)?.characterId);
  const draftFindings = text.trim() ? analyzeLine({ text, tactic, subtext }, { character: c, medium: s.medium || p.medium, genreMode: p.genreMode }).filter((f) => f.flaw !== 'noSubtext') : [];

  const ensureBeat = (proj) => {
    if (!s.beats.length) s.beats.push(newBeat(s, { actor: speaker, reactor: other?.id || '' }));
    return s.beats[s.beats.length - 1];
  };
  const add = () => {
    if (!text.trim()) return;
    act((proj) => {
      const b = ensureBeat(proj);
      b.lines.push(newLine({ speaker, text: text.trim(), tactic: tactic.trim(), subtext: subtext.trim(), paren: paren.trim() }));
      if (tactic.trim()) {
        if (b.actor === speaker && !b.action) b.action = tactic.trim();
        else if (b.reactor === speaker && !b.reaction) b.reaction = tactic.trim();
      }
    });
    setText(''); setTactic(''); setSubtext(''); setParen(''); setAntag('');
    const nxt = parts.find((x) => x.characterId !== speaker)?.characterId;
    if (nxt) setSpeaker(nxt);
    requestAnimationFrame(() => {
      textRef.current?.closest('.composer')?.scrollIntoView({ block: 'end', behavior: 'smooth' });
      textRef.current?.querySelector('textarea')?.focus();
    });
  };
  const addAction = (t) => act((proj) => { ensureBeat(proj).lines.push(newLine({ kind: 'action', text: t })); });
  const addBeat = () => act(() => { s.beats.push(newBeat(s, { actor: speaker, reactor: other?.id || '' })); });

  if (!p.characters.length) return html`<div class="composer card"><p class="muted">Add characters to the project, then add them to this scene in Scene design.</p></div>`;
  const magicIf = `If I were ${c?.name || 'this character'}${pt?.intention ? `, wanting ${pt.intention.replace(/^to /i, 'to ')}` : ''}${antag ? `, up against ${antag}` : pt?.antagonism ? `, up against ${pt.antagonism}` : ''}, what would I do? What would I say?`;
  return html`<div class="composer card" style=${`--c:${charColor(c)}`}>
    <div class="composer-head">
      <strong>Compose</strong>
      <div class="chip-row">
        ${(parts.length ? parts.map((x) => characterById(p, x.characterId)) : p.characters).filter(Boolean).map((ch) => html`<${CharChip} character=${ch} active=${ch.id === speaker} onClick=${() => setSpeaker(ch.id)} />`)}
      </div>
      <span class="grow"></span>
      <label class="toggle small"><input type="checkbox" checked=${steps} onChange=${(e) => setSteps(e.currentTarget.checked)} /> Five steps <${Cite} ch=${12} /></label>
    </div>
    <p class="magic-if"><span class="magic-if-tag">Magic If</span> ${magicIf} <${Cite} ch=${19} /></p>
    ${steps ? html`<ol class="five-steps">
      <li><span class="step-n">1</span><div><span class="step-name">${FIVE_STEPS[0].name}</span><span class="step-val">${pt?.intention || html`<span class="muted">Set ${c?.name || 'the speaker'}'s scene intention in Scene design.</span>`}${pt?.subIntention ? html` <span class="muted">· really: ${pt.subIntention}</span>` : ''}</span></div></li>
      <li><span class="step-n">2</span><div><span class="step-name">${FIVE_STEPS[1].name}</span><input class="input" value=${antag} placeholder=${pt?.antagonism || 'What does she sense is blocking her, right now?'} onInput=${(e) => setAntag(e.currentTarget.value)} /></div></li>
      <li><span class="step-n">3–4</span><div><span class="step-name">Choice of action</span><${GerundInput} value=${tactic} onInput=${setTactic} placeholder="Name the action: testing, cornering, bribing…" /></div></li>
      <li><span class="step-n">·</span><div><span class="step-name">Subtext</span><input class="input" value=${subtext} placeholder="What she thinks and feels but won't say" onInput=${(e) => setSubtext(e.currentTarget.value)} /></div></li>
    </ol>` : ''}
    <div class="expression" ref=${textRef}>
      <span class="step-n">5</span>
      <div class="grow">
        <span class="step-name">${FIVE_STEPS[4].name}</span>
        <input class="paren-input" value=${paren} placeholder="(paralanguage: a look, a gesture, a pause)" onInput=${(e) => setParen(e.currentTarget.value)} />
        <${TextArea} value=${text} onInput=${setText} placeholder=${`${c?.name || 'Character'}: the exact words. Enter to add, Shift+Enter for a new line.`} class="script" rows=${2}
          onKeyDown=${(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); add(); } }} />
        ${draftFindings.length ? html`<div class="line-flags">${draftFindings.map((f) => html`<${FindingBadge} f=${f} />`)}</div>` : ''}
      </div>
    </div>
    <div class="composer-actions">
      <button type="button" class="btn btn-primary" disabled=${!text.trim()} onClick=${add}>Add line</button>
      <button type="button" class="btn btn-quiet" onClick=${() => addAction(paren.trim() || 'A pause.')} title="The case for silence (Ch. 5)">+ Silence / action</button>
      <button type="button" class="btn btn-quiet" onClick=${addBeat} title="Start the next unit of action/reaction">+ New beat</button>
      <span class="grow"></span>
      <button type="button" class="btn btn-quiet" onClick=${() => openDrawer('rehearse')} title=${aiAvailable() ? 'Improvise the scene with the AI playing a character' : 'AI is optional: enable it in Settings'}><${Icon} name="chat" /> Rehearse</button>
      <button type="button" class="btn btn-quiet" onClick=${() => openDrawer('beats')}><${Icon} name="spark" /> Suggest beats</button>
    </div>
  </div>`;
}

// ---------------------------------------------------------------------------

function Diagnostics({ s, analysis, focusFlaw, setFocusFlaw }) {
  const p = state.project;
  const counts = Object.entries(analysis.counts).filter(([k]) => FLAWS[k]).sort((a, b) => b[1] - a[1]);
  const strengths = Object.values(analysis.lines).flat().filter((f) => f.severity === 'good').length;
  const jump = (flaw) => {
    setFocusFlaw(flaw === focusFlaw ? '' : flaw);
    const id = Object.entries(analysis.lines).find(([, fs]) => fs.some((f) => f.flaw === flaw))?.[0];
    if (id) document.getElementById(`line-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };
  const ct = CONFLICT_TYPES.find((t) => t.id === s.conflictType);
  return html`
    <${Card} title="Six dialogue tasks" ch="tasks" sub="Fine dialogue does all six at once.">
      <${TaskBars} tasks=${analysis.tasks} defs=${SIX_TASKS} />
      <p class="small muted">— means not measurable yet (e.g. no exposition planned, or fewer than ~25 words per speaker).</p>
    </${Card}>
    <${Card} title="Scene diagnosis" ch=${[9, 12]}>
      <${FindingList} findings=${analysis.scene} empty="No scene-level problems detected." />
      ${s.turningPoint?.note ? html`<p class="small"><strong>Planned turn (${s.turningPoint.type}):</strong> ${s.turningPoint.note}</p>` : ''}
    </${Card}>
    <${Card} title="Line flags" ch=${[6, 7, 8, 9]} sub=${`${analysis.flaggedLines} of ${analysis.totalLines} lines carry a warning · ${strengths} strengths`}>
      ${counts.length ? html`<ul class="flag-counts">
        ${counts.map(([k, n]) => html`<li><button type="button" class=${cx('flag-count', focusFlaw === k && 'active')} onClick=${() => jump(k)}>
          <span>${FLAWS[k].name}</span><span class="muted small">${FLAWS[k].group}</span><strong class="num">${n}</strong>
        </button></li>`)}
      </ul>` : html`<p class="muted small">No flags. Read it aloud anyway <${Cite} ch=${9} />.</p>`}
    </${Card}>
    <${Card} title="Content · length · pace" ch=${13} sub="Contrasting speakers, as in the Sopranos analysis.">
      ${Object.keys(analysis.speakers).length ? html`<table class="data-table compact">
        <thead><tr><th></th><th class="num">Q%</th><th class="num">W/line</th><th class="num">Longest</th><th class="num">Syl/w</th></tr></thead>
        <tbody>${Object.entries(analysis.speakers).map(([id, v]) => {
          const c = characterById(p, id);
          if (!v.metrics) return '';
          return html`<tr><th><span class="row-name"><span class="char-dot" style=${`--c:${charColor(c)}`}></span>${c?.name || '—'}</span></th>
            <td class="num">${Math.round(v.metrics.questionRatio * 100)}</td><td class="num">${v.metrics.wordsPerLine}</td><td class="num">${v.metrics.longestSentence}</td><td class="num">${v.metrics.syllablesPerWord}</td></tr>`;
        })}</tbody>
      </table>
      ${analysis.pairs.map((pr) => html`<div class="distance-row">
        <span class="small">${characterById(p, pr.a)?.name} ↔ ${characterById(p, pr.b)?.name}</span>
        <${Meter} value=${Math.min(100, Math.round((pr.distance / 40) * 100))} title=${`Voice distance ${pr.distance}`} />
        <span class="small muted">${pr.distance < 12 ? 'alike' : 'distinct'}</span>
      </div>`)}` : html`<p class="muted small">Write lines to measure each voice.</p>`}
    </${Card}>
    ${ct ? html`<${Card} title=${ct.name} ch=${ct.ch} sub=${ct.example}>
      <ul class="tips small">${ct.tips.map((t) => html`<li>${t}</li>`)}</ul>
    </${Card}>` : ''}
  `;
}
