import { html, useState, useMemo, useRef, useEffect, cx, charColor } from '../lib.js';
import { state, mutate, act, setSetting, openDrawer, aiAvailable, toast } from '../store.js';
import {
  Card, TextArea, Cite, CharSelect, CharChip, Icon, GerundInput, FindingBadge, FindingList, Meter,
} from '../components/ui.js';
import { SceneArc, TaskBars } from '../components/viz.js';
import { analyzeLine } from '../analysis.js';
import { secondReadLine } from '../secondreader.js';
import { doubleCheckScene, mergeFindings } from '../doublecheck.js';
import { runAiReview } from '../review.js';
import { SIX_TASKS, FIVE_STEPS, CONFLICT_TYPES, BEAT_DEFINITION, FLAWS } from '../mckee.js';
import { newBeat, newLine, characterById, locateLine } from '../model.js';

export function WorkshopView({ scene: s }) {
  const p = state.project;
  const analysis = useMemo(() => doubleCheckScene(s, p), [state.version]);
  const [primaryId, setPrimaryId] = useState(s.values[0]?.id);
  const [focusFlaw, setFocusFlaw] = useState('');
  const reader = useTableRead(s);
  const view = {
    showSubtext: state.settings.showSubtext,
    showPossible: state.settings.showPossible,
    showDismissed: state.settings.showDismissed,
    focusFlaw,
    speakingId: reader.cur?.lineId,
    readFrom: reader.start,
  };
  const tpIndex = analysis.turningPoint && Math.abs(analysis.turningPoint.change) >= 2 ? analysis.turningPoint.beatIndex : null;
  const arcPrimary = primaryId && s.values.some((v) => v.id === primaryId) ? primaryId : s.values[0]?.id;
  return html`<div class="tab-body workshop">
    <div class="workshop-top card">
      <${SceneArc} arcs=${analysis.arcs} beats=${s.beats} characters=${p.characters} turningIndex=${tpIndex} primaryId=${arcPrimary} onPickPrimary=${setPrimaryId} />
    </div>
    <div class="workshop-grid">
      <div class="workshop-main">
        <div class="workshop-toolbar">
          <label class="toggle"><input type="checkbox" checked=${view.showSubtext} onChange=${(e) => setSetting('showSubtext', e.currentTarget.checked)} /> <${Icon} name="layers" /> Show subtext (iceberg view)</label>
          <button type="button" class="btn btn-quiet btn-small" onClick=${() => (reader.cur ? reader.stop() : reader.start())} disabled=${!analysis.totalLines}>
            <${Icon} name=${reader.cur ? 'stop' : 'play'} /> ${reader.cur ? 'Stop table read' : 'Table read'}
          </button>
          ${focusFlaw ? html`<button type="button" class="chip-btn" onClick=${() => setFocusFlaw('')}>Highlighting: ${FLAWS[focusFlaw]?.name || focusFlaw} ×</button>` : ''}
          <span class="grow"></span>
          <span class="muted small" title=${BEAT_DEFINITION.text}>A beat = action / reaction <${Cite} ch=${[9, 12]} /></span>
        </div>
        ${s.beats.length ? s.beats.map((b, i) => html`<${BeatCard} key=${b.id} s=${s} beat=${b} index=${i} analysis=${analysis} view=${view} turning=${tpIndex === i} />`)
          : html`<div class="empty card">
            <div class="empty-title">No beats yet.</div>
            <p class="muted">Before writing a line, ask: what does each character want out of this situation? What action would she take, right now, to get it? Only then: what exact words? <${Cite} ch=${2} /></p>
          </div>`}
        ${reader.cur ? html`<${ReadingBar} s=${s} reader=${reader} />` : ''}
        <${Composer} s=${s} />
      </div>
      <aside class="workshop-side">
        <${Diagnostics} s=${s} analysis=${analysis} focusFlaw=${focusFlaw} setFocusFlaw=${setFocusFlaw} reader=${reader} />
      </aside>
    </div>
  </div>`;
}

// ---------------------------------------------------------------------------
// Table read (Ch. 9: "act your dialogue aloud or hear it acted to you").
// Speech synthesis with a voice per character; without voices, a silent
// read paced at 2.5 words per second (Ch. 8). Press F to flag a line by ear.
// ---------------------------------------------------------------------------

function useTableRead(scene) {
  const [cur, setCur] = useState(null);
  const ctl = useRef({ cancelled: true, timer: null });
  const stop = () => {
    ctl.current.cancelled = true;
    clearTimeout(ctl.current.timer);
    try { window.speechSynthesis?.cancel(); } catch { /* unsupported */ }
    setCur(null);
  };
  useEffect(() => {
    try { window.speechSynthesis?.getVoices(); } catch { /* warm the voice list */ }
    return stop;
  }, []);
  useEffect(() => {
    if (!cur) return undefined;
    const onKey = (e) => {
      const tag = (e.target.tagName || '').toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select') return;
      if (e.key === 'f' || e.key === 'F') { e.preventDefault(); toggleFlag(scene.id, cur.lineId); }
      if (e.key === 'Escape') stop();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [cur?.lineId]);

  const start = (fromLineId) => {
    stop();
    const p = state.project;
    const queue = scene.beats.flatMap((b) => b.lines).filter((l) => String(l.text || '').trim());
    if (!queue.length) return;
    let i = Math.max(0, queue.findIndex((l) => l.id === fromLineId));
    const synth = window.speechSynthesis;
    let voices = [];
    try { voices = synth?.getVoices() || []; } catch { voices = []; }
    const silent = !synth || typeof window.SpeechSynthesisUtterance === 'undefined' || !voices.length;
    const english = voices.filter((v) => /^en/i.test(v.lang));
    const pool = english.length ? english : voices;
    const run = { cancelled: false, timer: null };
    ctl.current = run;
    const step = () => {
      if (run.cancelled) return;
      if (i >= queue.length) { run.cancelled = true; setCur(null); toast('Table read finished'); return; }
      const l = queue[i];
      const c = characterById(p, l.speaker);
      setCur({ index: i, total: queue.length, lineId: l.id, silent, name: l.kind === 'action' ? 'Action' : c?.name || '—', text: l.text });
      document.getElementById(`line-${l.id}`)?.scrollIntoView({ block: 'center', behavior: 'smooth' });
      const n = l.text.split(/\s+/).length;
      const next = () => { if (run.cancelled) return; i++; step(); };
      if (l.kind === 'action' && !state.settings.readDirections) { run.timer = setTimeout(next, 900 + n * 120); return; }
      if (silent) { run.timer = setTimeout(next, Math.max(900, (n / 2.5) * 1000)); return; }
      const u = new window.SpeechSynthesisUtterance(l.text);
      const slot = Math.max(0, c?.slot ?? 0);
      if (pool.length) u.voice = l.kind === 'action' ? pool[pool.length - 1] : pool[(slot * 3) % pool.length];
      u.rate = 0.85 + ((c?.voice?.sliders?.pace ?? 50) / 100) * 0.4;
      u.pitch = [1, 0.85, 1.15, 0.95, 1.1, 0.9, 1.05, 0.8][slot % 8];
      let done = false;
      const finish = () => { if (done) return; done = true; clearTimeout(run.timer); run.timer = setTimeout(next, 250); };
      u.onend = finish;
      u.onerror = finish;
      run.timer = setTimeout(finish, (n / 1.2 + 4) * 1000);
      synth.speak(u);
    };
    step();
  };
  return { cur, start, stop };
}

function toggleFlag(sceneId, lineId) {
  act((proj) => {
    const s = proj.scenes.find((x) => x.id === sceneId);
    const loc = s && locateLine(s, lineId);
    if (loc && loc.line.kind !== 'action') loc.line.marked = !loc.line.marked;
  });
}

function ReadingBar({ s, reader }) {
  const c = reader.cur;
  const line = locateLine(s, c.lineId)?.line;
  return html`<div class="reading-bar card" role="status">
    <span class="reading-pos">${c.index + 1}/${c.total}</span>
    <div class="grow reading-text"><strong>${c.name.toUpperCase()}</strong> <span class="script">${c.text}</span>
      ${c.silent ? html`<div class="small muted">No speech voices in this browser: reading silently at 2.5 words per second, the pace of talk <${Cite} ch=${8} />.</div>` : ''}</div>
    ${line && line.kind !== 'action' ? html`<button type="button" class=${cx('btn btn-small', line.marked && 'btn-quiet active')} onClick=${() => toggleFlag(s.id, c.lineId)} title="Flag this line by ear (F)"><${Icon} name="flag" /> ${line.marked ? 'Flagged' : 'Flag (F)'}</button>` : ''}
    <button type="button" class="btn btn-small btn-quiet" onClick=${reader.stop}><${Icon} name="stop" /> Stop</button>
  </div>`;
}

// ---------------------------------------------------------------------------

function BeatCard({ s, beat: b, index, analysis, view, turning }) {
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
      ${b.lines.map((l, li) => html`<${LineRow} key=${l.id} s=${s} beat=${b} line=${l} index=${li} findings=${analysis.lines[l.id] || []} view=${view} />`)}
      ${!b.lines.length ? html`<p class="muted small beat-empty">No lines yet. Use the composer below; lines are added to the last beat.</p>` : ''}
    </div>
  </section>`;
}

// ---------------------------------------------------------------------------

function LineRow({ s, beat: b, line: l, index, findings, view }) {
  const { showSubtext, focusFlaw } = view;
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
  const visible = findings.filter((f) => {
    if (f.flaw === 'noSubtext' && (l.subtext || l.tactic)) return false;
    if (f.dismissed && !view.showDismissed) return false;
    if (f.status === 'possible' && !view.showPossible) return false;
    return true;
  });
  const dismiss = (flaw) => act(() => { if (!l.dismissed.includes(flaw)) l.dismissed.push(flaw); });
  const restore = (flaw) => act(() => { l.dismissed = l.dismissed.filter((x) => x !== flaw); });
  const dim = focusFlaw && !findings.some((f) => f.flaw === focusFlaw && !f.dismissed);
  const speaking = view.speakingId === l.id;
  if (l.kind === 'action') {
    return html`<div class=${cx('line action-line', dim && 'dim', speaking && 'speaking')} id=${`line-${l.id}`}>
      <span class="action-tag">action</span>
      <${TextArea} value=${l.text} onInput=${set('text')} placeholder="Stage direction, paralanguage, silence…" class="action-text" rows=${1} />
      <div class="line-tools">
        <button type="button" class="icon-btn" aria-label="Move up" onClick=${() => move(-1)}><${Icon} name="up" /></button>
        <button type="button" class="icon-btn" aria-label="Move down" onClick=${() => move(1)}><${Icon} name="down" /></button>
        <button type="button" class="icon-btn" aria-label="Delete" onClick=${remove}><${Icon} name="trash" /></button>
      </div>
    </div>`;
  }
  return html`<div class=${cx('line', dim && 'dim', speaking && 'speaking', l.marked && 'marked')} style=${`--c:${charColor(c)}`} id=${`line-${l.id}`}>
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
          <button type="button" class=${cx('icon-btn', l.marked && 'active')} title="Flag for rewrite: your own ear is the last check (Ch. 9)" aria-label="Flag line" onClick=${() => toggleFlag(s.id, l.id)}><${Icon} name="flag" /></button>
          <button type="button" class="icon-btn" title="Table read from here" aria-label="Read aloud from here" onClick=${() => view.readFrom(l.id)}><${Icon} name="play" /></button>
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
      ${visible.length ? html`<div class="line-flags">${visible.map((f) => html`<${FindingBadge} f=${f} onDismiss=${dismiss} onRestore=${restore} onUnflag=${() => toggleFlag(s.id, l.id)} />`)}</div>` : ''}
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
  // Drafts get the same double-check as saved lines: rules + second reader.
  const draftFindings = useMemo(() => {
    if (!text.trim()) return [];
    const draft = { text, tactic, subtext };
    const ctx = { character: c, medium: s.medium || p.medium, genreMode: p.genreMode };
    return mergeFindings([
      ...analyzeLine(draft, ctx).map((f) => ({ f, source: 'rules' })),
      ...secondReadLine(draft, ctx).map((f) => ({ f, source: 'reader' })),
    ]).filter((f) => f.flaw !== 'noSubtext' && f.status !== 'good');
  }, [text, tactic, subtext, speaker]);

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

function Diagnostics({ s, analysis, focusFlaw, setFocusFlaw, reader }) {
  const p = state.project;
  const tally = {};
  for (const fs of Object.values(analysis.lines)) {
    for (const f of fs) {
      if (f.status === 'good' || f.dismissed || !FLAWS[f.flaw]) continue;
      if (f.status === 'possible' && !state.settings.showPossible) continue;
      const t = (tally[f.flaw] ||= { n: 0, possible: 0 });
      t.n++;
      if (f.status === 'possible') t.possible++;
    }
  }
  const counts = Object.entries(tally).sort((a, b) => b[1].n - a[1].n);
  const strengths = Object.values(analysis.lines).flat().filter((f) => f.severity === 'good').length;
  const dismissScene = (flaw) => act(() => { if (!s.dismissed.includes(flaw)) s.dismissed.push(flaw); });
  const restoreScene = (flaw) => act(() => { s.dismissed = s.dismissed.filter((x) => x !== flaw); });
  const jump = (flaw) => {
    setFocusFlaw(flaw === focusFlaw ? '' : flaw);
    const id = Object.entries(analysis.lines).find(([, fs]) => fs.some((f) => f.flaw === flaw && !f.dismissed))?.[0];
    if (id) document.getElementById(`line-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };
  const ct = CONFLICT_TYPES.find((t) => t.id === s.conflictType);
  return html`
    <${DoubleCheckCard} s=${s} analysis=${analysis} reader=${reader} />
    <${Card} title="Six dialogue tasks" ch="tasks" sub="Fine dialogue does all six at once.">
      <${TaskBars} tasks=${analysis.tasks} defs=${SIX_TASKS} />
      <p class="small muted">— means not measurable yet (e.g. no exposition planned, or fewer than ~25 words per speaker).</p>
    </${Card}>
    <${Card} title="Scene diagnosis" ch=${[9, 12]}>
      <${FindingList} findings=${analysis.scene.filter((f) => (state.settings.showDismissed || !f.dismissed) && (state.settings.showPossible || f.status !== 'possible'))} empty="No scene-level problems detected." onDismiss=${dismissScene} onRestore=${restoreScene} />
      ${s.turningPoint?.note ? html`<p class="small"><strong>Planned turn (${s.turningPoint.type}):</strong> ${s.turningPoint.note}</p>` : ''}
    </${Card}>
    <${Card} title="Line flags" ch=${[6, 7, 8, 9]} sub=${`${analysis.flaggedLines} of ${analysis.totalLines} lines carry a warning · ${strengths} strengths`}>
      ${counts.length ? html`<ul class="flag-counts">
        ${counts.map(([k, t]) => html`<li><button type="button" class=${cx('flag-count', focusFlaw === k && 'active')} onClick=${() => jump(k)}>
          <span>${FLAWS[k].name}</span><span class="muted small">${t.possible === t.n ? 'to verify' : t.possible ? `${t.possible} to verify` : FLAWS[k].group}</span><strong class="num">${t.n}</strong>
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

// ---------------------------------------------------------------------------
// The double-check card: coverage of each layer and what they found.
// ---------------------------------------------------------------------------

function ago(iso) {
  const m = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  return h < 24 ? `${h} h ago` : new Date(iso).toLocaleDateString();
}

function DoubleCheckCard({ s, analysis, reader }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const abort = useRef(null);
  useEffect(() => () => abort.current?.abort(), []);
  const st = analysis.stats;
  const ai = analysis.ai;
  const n = analysis.totalLines;
  const byEar = Object.values(analysis.lines).flat().filter((f) => f.status === 'writer').length;
  const run = async () => {
    setBusy(true);
    setError('');
    const ctrl = new AbortController();
    abort.current = ctrl;
    try {
      const r = await runAiReview(s.id, { signal: ctrl.signal });
      toast(`AI double-check: ${r.issues.length} issue${r.issues.length === 1 ? '' : 's'}, ${r.disputes.length} dispute${r.disputes.length === 1 ? '' : 's'}`);
    } catch (err) {
      if (err.name !== 'AbortError') setError(err.message);
    }
    setBusy(false);
  };
  const layer = (name, status, ok, extra = '') => html`<li class=${cx('layer', ok ? 'ok' : 'pending')}>
    <span class="layer-mark" aria-hidden="true">${ok ? '✓' : '·'}</span><span class="layer-name">${name}</span><span class="layer-status">${status}</span>${extra}</li>`;
  const chips = [
    ['confirmed', 'Confirmed', 'two or more checks agree'],
    ['flagged', 'Flagged', 'rules only'],
    ['possible', 'To verify', 'one sensitive check only'],
    ['writer', 'By ear', 'you flagged it'],
    ['disputed', 'Disputed', 'AI review disagrees'],
    ['dismissed', 'Dismissed', 'marked deliberate'],
  ];
  return html`<${Card} title="Double-check" ch=${[6, 7, 8, 9, 19]} sub="Independent checks catch what any one misses: precise rules, a sensitive second reader, an optional AI review, and your own ear.">
    <ul class="layers">
      ${layer('Rules', `${n}/${n} lines`, true)}
      ${layer('Second reader', `${n}/${n} lines`, true)}
      ${layer('AI review', ai ? `${ai.current.size}/${ai.total} current · ${ago(ai.at)}${ai.changed ? ` · ${ai.changed} changed since` : ''}` : aiAvailable() ? 'not run yet' : 'off (optional)', !!ai && ai.current.size === ai.total && ai.total > 0)}
      ${layer('Your ear', reader.cur ? 'reading now…' : `${byEar} line${byEar === 1 ? '' : 's'} flagged`, byEar > 0)}
    </ul>
    <div class="dc-chips">
      ${chips.map(([k, label, hint]) => html`<span class=${cx('dc-chip', `dc-${k}`, !st[k] && 'zero')} title=${hint}><strong>${st[k]}</strong> ${label}</span>`)}
    </div>
    ${ai?.summary ? html`<p class="small dc-summary"><strong>AI reviewer:</strong> ${ai.summary}</p>` : ''}
    ${error ? html`<p class="small error-text">${error}</p>` : ''}
    <div class="dc-actions">
      <button type="button" class="btn btn-small" disabled=${busy || !n || !aiAvailable()} title=${aiAvailable() ? 'Ask the AI to find misses and dispute false alarms' : 'Optional: add an API key in Settings'} onClick=${run}>
        <${Icon} name="check2" /> ${busy ? 'Reviewing…' : ai ? 'Re-run AI double-check' : 'Run AI double-check'}
      </button>
      ${busy ? html`<button type="button" class="btn btn-small btn-quiet" onClick=${() => abort.current?.abort()}>Cancel</button>` : ''}
      <button type="button" class="btn btn-small btn-quiet" disabled=${!n} onClick=${() => (reader.cur ? reader.stop() : reader.start())}><${Icon} name=${reader.cur ? 'stop' : 'play'} /> ${reader.cur ? 'Stop' : 'Table read'}</button>
    </div>
    <div class="dc-toggles small">
      <label class="toggle"><input type="checkbox" checked=${state.settings.showPossible} onChange=${(e) => setSetting('showPossible', e.currentTarget.checked)} /> Show “to verify”</label>
      <label class="toggle"><input type="checkbox" checked=${state.settings.showDismissed} onChange=${(e) => setSetting('showDismissed', e.currentTarget.checked)} /> Show dismissed</label>
      <label class="toggle"><input type="checkbox" checked=${state.settings.readDirections} onChange=${(e) => setSetting('readDirections', e.currentTarget.checked)} /> Read stage directions</label>
    </div>
  </${Card}>`;
}
