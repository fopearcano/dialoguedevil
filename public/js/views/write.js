// The writing desk: the main panel for sketching dialogue, one voice or many.
// It reads like a script page and takes lines as fast as you type them.
// McKee's tools wait in the margin, under the line and in the lens instead of
// sitting on every line; the beat workshop keeps the full apparatus.

import { html, useState, useMemo, useRef, useEffect, cx, charColor } from '../lib.js';
import { state, mutate, act, setSetting, openDrawer, aiAvailable, toast, deskScene } from '../store.js';
import { Icon, Cite, TextArea, GerundInput, FindingBadge, SeverityIcon, CharSelect, Meter, rich } from '../components/ui.js';
import { SceneArc } from '../components/viz.js';
import { doubleCheckScene, mergeFindings } from '../doublecheck.js';
import { analyzeLine } from '../analysis.js';
import { secondReadLine } from '../secondreader.js';
import { THREE_TRACKS, FIVE_STEPS } from '../mckee.js';
import { newCharacter, newLine, characterById, sceneById, locateLine } from '../model.js';
import {
  parseEntry, parseScript, addEntries, ensureCast, findCharacter, nextSpeaker, cycleSpeaker, voiceAfter,
  insertLineAfter, removeLine, moveLine, splitBeatAt, mergeBeatUp, beatGist, speechLines,
} from '../sketch.js';
import { addScene } from '../actions.js';
import { FORMATS } from '../export.js';
import { useTableRead, ReadingBar, toggleFlag } from './workshop.js';
import { tr, trn } from '../i18n.js';

const kbd = (k) => html`<kbd>${k}</kbd>`;
const RANK = { info: 1, warning: 2, serious: 3, critical: 4 };
const snippet = (t, n = 48) => { const s = String(t || '').trim(); return s.length > n ? `${s.slice(0, n - 1)}…` : s; };

// Focus a line's text once the next render has placed it.
function focusLine(id, end = true) {
  requestAnimationFrame(() => {
    const el = document.querySelector(`#line-${id} .sk-text`);
    if (!el) return;
    el.focus();
    if (end) el.setSelectionRange(el.value.length, el.value.length);
  });
}

const focusComposer = () => requestAnimationFrame(() => document.querySelector('.desk-composer .entry-text')?.focus());

// A structural edit on this scene in the live project (undo may have
// replaced the objects a component holds).
const editScene = (id, fn) => act((proj) => fn(sceneById(proj, id), proj));

function magicIf(name, pt) {
  const against = pt?.antagonism;
  if (pt?.intention) {
    return against ? tr('If I were {name}, wanting “{intention}”, up against {against}, what would I do? What would I say?', { name, intention: pt.intention, against })
      : tr('If I were {name}, wanting “{intention}”, what would I do? What would I say?', { name, intention: pt.intention });
  }
  return against ? tr('If I were {name}, up against {against}, what would I do? What would I say?', { name, against })
    : tr('If I were {name}, what would I do? What would I say?', { name });
}

export function WriteView({ id }) {
  const p = state.project;
  const s = deskScene(p, id);
  useEffect(() => {
    if (s && state.settings.lastScene?.[p.id] !== s.id) setSetting('lastScene', { ...state.settings.lastScene, [p.id]: s.id });
  }, [s?.id]);
  if (!s) return html`<${EmptyDesk} missing=${!!id} />`;
  return html`<${Desk} key=${s.id} s=${s} />`;
}

function EmptyDesk({ missing }) {
  return html`<div class="page desk-empty-page">
    <div class="empty">
      <div class="empty-title">${missing ? tr('Not found in this project.') : tr('Nothing written yet.')}</div>
      <p class="muted">${tr('Sketch the talk first. The method waits in the margin until you want it.')}</p>
      <button type="button" class="btn btn-primary" onClick=${() => addScene(tr('Dialogue {n}', { n: (state.project?.scenes.length || 0) + 1 }))}><${Icon} name="pen" /> ${tr('Start a dialogue')}</button>
    </div>
  </div>`;
}

function Desk({ s }) {
  const p = state.project;
  const analysis = useMemo(() => doubleCheckScene(s, p), [state.version]);
  const reader = useTableRead(s);
  const [openNotes, setOpenNotes] = useState('');
  const set = state.settings;
  const cast = s.participants.map((x) => x.characterId).filter((id) => characterById(p, id));
  const view = {
    iceberg: set.showSubtext, quiet: set.quietChecks, showPossible: set.showPossible, showDismissed: set.showDismissed,
    openNotes, setOpenNotes, speakingId: reader.cur?.lineId, readFrom: reader.start, cast,
  };
  const turning = analysis.turningPoint && Math.abs(analysis.turningPoint.change) >= 2 ? analysis.turningPoint.beatIndex : null;
  const speech = speechLines(s);
  const words = speech.reduce((n, l) => n + (l.text.trim() ? l.text.trim().split(/\s+/).length : 0), 0);
  const multi = s.beats.length > 1;
  const openLine = (id) => {
    setOpenNotes(id);
    requestAnimationFrame(() => document.getElementById(`line-${id}`)?.scrollIntoView({ block: 'center', behavior: 'smooth' }));
  };
  // One flat, keyed list: a line keeps its component (and focus) when it
  // crosses a beat break.
  const rows = [];
  s.beats.forEach((b, i) => {
    if (multi) rows.push(html`<${BeatRule} key=${`beat-${b.id}`} s=${s} beat=${b} index=${i} turning=${turning === i} />`);
    for (const l of b.lines) rows.push(html`<${SketchLine} key=${l.id} s=${s} line=${l} findings=${analysis.lines[l.id] || []} view=${view} />`);
  });
  return html`<div class="desk" lang=${p.lang}>
    <${DeskHead} s=${s} />
    <div class=${cx('desk-grid', set.lensOpen && 'with-lens')}>
      <div class="desk-main">
        <div class="desk-toolbar">
          <label class="toggle small" title=${tr('Show the subtext and the action under each line')}><input type="checkbox" checked=${view.iceberg} onChange=${(e) => setSetting('showSubtext', e.currentTarget.checked)} /> <${Icon} name="layers" /> ${tr('Subtext')}</label>
          <label class="toggle small" title=${tr('Sketch first, judge later: hide the checks while drafting')}><input type="checkbox" checked=${!view.quiet} onChange=${(e) => setSetting('quietChecks', !e.currentTarget.checked)} /> ${tr('Checks in the margin')}</label>
          <button type="button" class="btn btn-quiet btn-small" disabled=${!speech.length} onClick=${() => (reader.cur ? reader.stop() : reader.start())}><${Icon} name=${reader.cur ? 'stop' : 'play'} /> ${reader.cur ? tr('Stop') : tr('Read aloud')}</button>
          <span class="grow"></span>
          <span class="muted small">${trn(speech.length, '{n} line', '{n} lines')} · ${trn(words, '{n} word', '{n} words')}${multi ? ` · ${trn(s.beats.length, '{n} beat', '{n} beats')}` : ''}</span>
        </div>
        <div class="sheet">${rows.length && s.beats.some((b) => b.lines.length) ? rows : html`<${SheetGuide} s=${s} cast=${cast} />`}</div>
        ${reader.cur ? html`<${ReadingBar} s=${s} reader=${reader} />` : ''}
        <${DeskComposer} s=${s} cast=${cast} quiet=${view.quiet} iceberg=${view.iceberg} />
      </div>
      ${set.lensOpen ? html`<aside class="lens" aria-label=${tr('McKee lens')}><${Lens} s=${s} analysis=${analysis} cast=${cast} turning=${turning} openLine=${openLine} /></aside>` : ''}
    </div>
  </div>`;
}

function DeskHead({ s }) {
  const tracks = [['others', tr('others')], ['self', tr('oneself')], ['audience', tr('the audience')]];
  return html`<header class="desk-head">
    <div class="desk-titles">
      <input class="title-input desk-title" value=${s.title} aria-label=${tr('Dialogue title')} onInput=${(e) => mutate(() => { s.title = e.currentTarget.value; })} />
      <div class="desk-track">
        <span class="small muted">${tr('Talking to:')}</span>
        <div class="segmented">${tracks.map(([id, label]) => html`<button type="button" class=${cx(s.track === id && 'active')} aria-pressed=${s.track === id}
          title=${THREE_TRACKS.find((t) => t.id === id)?.desc} onClick=${() => editScene(s.id, (sc) => { sc.track = id; })}>${label}</button>`)}</div>
        <${Cite} ch=${1} />
      </div>
    </div>
    <div class="desk-links">
      <button type="button" class="btn btn-quiet btn-small" onClick=${() => addScene(tr('Dialogue {n}', { n: state.project.scenes.length + 1 }))}><${Icon} name="plus" /> ${tr('New dialogue')}</button>
      <a class="btn btn-quiet btn-small" href=${`#/scene/${s.id}/design`}>${tr('Scene design')}</a>
      <a class="btn btn-quiet btn-small" href=${`#/scene/${s.id}/workshop`}>${tr('Beat workshop')}</a>
      <a class="btn btn-quiet btn-small" href=${`#/scene/${s.id}/script`}>${tr('Script')}</a>
      <button type="button" class=${cx('btn btn-quiet btn-small', state.settings.lensOpen && 'active')} aria-pressed=${state.settings.lensOpen} onClick=${() => setSetting('lensOpen', !state.settings.lensOpen)}><${Icon} name="eye" /> ${tr('McKee lens')}</button>
    </div>
  </header>`;
}

function SheetGuide({ s, cast }) {
  const track = THREE_TRACKS.find((t) => t.id === s.track);
  return html`<div class="sheet-guide">
    ${!cast.length ? html`<div class="guide-cast"><h3>${tr('Who is in this dialogue?')}</h3><${CastAdder} s=${s} cast=${cast} autoFocus onPick=${focusComposer} /></div>` : ''}
    <p class="guide-lead">${tr('Sketch the talk first. The method waits in the margin until you want it.')}</p>
    <ul class="guide-tips small">
      <li>${rich('{enter} adds the line and passes the turn to the next voice; {tab} changes who speaks.', { enter: kbd(tr('Enter')), tab: kbd('Tab') })}</li>
      <li>${rich('{cue} picks the speaker; a new name in capitals creates the character.', { cue: html`<code>${tr('NAME: line')}</code>` })}</li>
      <li>${rich('{paren} adds paralanguage, {action} an action, {beat} a beat break.', { paren: html`<code>${tr('(softly)')}</code>`, action: html`<code>${tr('[She leaves.]')}</code>`, beat: html`<code>---</code>` })}</li>
      <li>${tr('Paste a whole scene (NAME: line, or a screenplay) to bring it in.')}</li>
    </ul>
    ${track ? html`<p class="small muted"><strong>${track.name}.</strong> ${track.desc} <${Cite} ch=${1} /></p>` : ''}
    <p class="magic-if">${tr('Before writing a line, ask: what does each character want out of this situation? What action would she take, right now, to get it? Only then: what exact words?')} <${Cite} ch=${2} /></p>
  </div>`;
}

// ---------------------------------------------------------------------------
// Beat breaks: a thin rule that names the beat; open it to edit.
// ---------------------------------------------------------------------------

function BeatRule({ s, beat: b, index, turning }) {
  const p = state.project;
  const [open, setOpen] = useState(false);
  const g = beatGist(b);
  const name = (id) => characterById(p, id)?.name || '';
  const half = (who, what) => html`<span class="gist"><strong>${name(who) || '—'}</strong> ${what || html`<span class="muted">…</span>`}</span>`;
  const v = s.values[0];
  const charge = v ? (b.charges[v.id] ?? 0) : 0;
  return html`<div class=${cx('beat-rule', turning && 'turning', open && 'open')} id=${`beat-${b.id}`}>
    <div class="beat-rule-line">
      <button type="button" class="beat-rule-head" aria-expanded=${open} onClick=${() => setOpen(!open)} title=${tr('Name the beat: action / reaction')}>
        <span class="beat-rule-n">${tr('Beat {n}', { n: index + 1 })}</span>
        ${g.action || g.reaction ? html`${half(g.actor, g.action)}<span class="muted">/</span>${half(g.reactor, g.reaction)}` : html`<span class="muted">${tr('name its action and reaction')}</span>`}
        ${turning ? html`<span class="tp-badge">${tr('Turning point')}</span>` : ''}
      </button>
      ${index > 0 ? html`<button type="button" class="icon-btn" title=${tr('Remove this beat break (join the beat above)')} aria-label=${tr('Remove beat break')}
        onClick=${() => editScene(s.id, (sc) => mergeBeatUp(sc, index))}><${Icon} name="close" size=${14} /></button>` : ''}
    </div>
    ${open ? html`<div class="beat-rule-edit">
      <div class="ar-row"><span class="ar-label">${tr('ACTION')}</span><${CharSelect} project=${p} value=${b.actor} onChange=${(x) => mutate(() => { b.actor = x; })} />
        <${GerundInput} value=${b.action} placeholder=${g.action || tr('e.g. cornering her')} onInput=${(x) => mutate(() => { b.action = x; })} /></div>
      <div class="ar-row"><span class="ar-label">${tr('REACTION')}</span><${CharSelect} project=${p} value=${b.reactor} onChange=${(x) => mutate(() => { b.reactor = x; })} />
        <${GerundInput} value=${b.reaction} placeholder=${g.reaction || tr('e.g. buying time')} onInput=${(x) => mutate(() => { b.reaction = x; })} /></div>
      <div class="beat-values">
        ${v ? html`<label class="charge" title=${tr('{value} charge after this beat', { value: `${v.positive}/${v.negative}` })}>
          <span class="charge-name">${v.positive || '+'}/${v.negative || '−'}</span>
          <input type="range" min="-10" max="10" value=${charge} class=${charge > 0 ? 'pos' : charge < 0 ? 'neg' : ''} aria-label=${tr('{value} charge', { value: `${v.positive}/${v.negative}` })} onInput=${(e) => mutate(() => { b.charges[v.id] = Number(e.currentTarget.value); })} />
          <strong class="num">${charge > 0 ? '+' : ''}${charge}</strong>
        </label>` : ''}
        <label class="charge intensity" title=${tr('Each beat should top the last')}>
          <span class="charge-name">${tr('intensity')}</span>
          <input type="range" min="1" max="10" value=${b.intensity} aria-label=${tr('Intensity')} onInput=${(e) => mutate(() => { b.intensity = Number(e.currentTarget.value); })} />
          <strong class="num">${b.intensity}</strong>
        </label>
      </div>
    </div>` : ''}
  </div>`;
}

// ---------------------------------------------------------------------------
// A line on the page: who, the words, and (on demand) what lies beneath.
// ---------------------------------------------------------------------------

function SketchLine({ s, line: l, findings, view }) {
  const p = state.project;
  const c = characterById(p, l.speaker);
  const [under, setUnder] = useState(false);
  const [alts, setAlts] = useState(false);
  const [draft, setDraft] = useState('');
  const set = (k) => (v) => mutate(() => { l[k] = v; });
  const isAction = l.kind === 'action';
  // "No action named" would sit on every sketched line; the lens counts it.
  const notes = findings.filter((f) => f.status !== 'good' && f.flaw !== 'noSubtext'
    && (view.showDismissed || !f.dismissed) && (view.showPossible || f.status !== 'possible'));
  const live = notes.filter((f) => !f.dismissed);
  const worst = live.reduce((w, f) => ((RANK[f.severity] || 0) > (RANK[w] || 0) ? f.severity : w), 'info');
  const open = view.openNotes === l.id && notes.length > 0;
  const starts = locateLine(s, l.id)?.lineIndex === 0;
  const name = c?.name || tr('the character');
  const order = s.beats.flatMap((b) => b.lines);
  const prevId = order[order.findIndex((x) => x.id === l.id) - 1]?.id;

  const onKey = (e) => {
    if (e.isComposing) return;
    if (e.key === 'Enter' && !e.shiftKey && !e.altKey) {
      e.preventDefault();
      const nl = newLine({ speaker: voiceAfter(view.cast, s, l.id) || l.speaker || view.cast[0] || '' });
      editScene(s.id, (sc) => insertLineAfter(sc, l.id, nl));
      focusLine(nl.id);
    } else if (e.key === 'Backspace' && !l.text && !l.paren && e.currentTarget.selectionStart === 0) {
      e.preventDefault();
      editScene(s.id, (sc) => removeLine(sc, l.id));
      if (prevId) focusLine(prevId);
    } else if (e.altKey && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
      e.preventDefault();
      editScene(s.id, (sc) => moveLine(sc, l.id, e.key === 'ArrowUp' ? -1 : 1));
      focusLine(l.id, false);
    } else if (e.key === 'Escape') e.currentTarget.blur();
  };
  // "(softly) words" typed into a line moves the paralanguage to its place.
  const onBlur = () => {
    const m = !isAction && l.text.match(/^\(([^)\n]+)\)\s*([\s\S]+)$/);
    if (m) mutate(() => { l.paren = [l.paren, m[1].trim()].filter(Boolean).join(', '); l.text = m[2].trim(); });
  };
  const cast = view.cast;
  const others = p.characters.filter((x) => !cast.includes(x.id));
  const tool = (icon, label, onClick, extra = {}) => html`<button type="button" class=${cx('icon-btn', extra.active && 'active')} title=${label} aria-label=${label} disabled=${extra.disabled} onClick=${onClick}><${Icon} name=${icon} size=${15} />${extra.count ? html`<span class="mini-count">${extra.count}</span>` : ''}</button>`;
  const hasUnder = !!(l.subtext || l.tactic);
  return html`<div class=${cx('sk-line', isAction && 'sk-action', view.iceberg && 'iceberg', view.speakingId === l.id && 'speaking', l.marked && 'marked', open && 'notes-open')} id=${`line-${l.id}`} style=${`--c:${charColor(c)}`}>
    <div class="sk-who">
      ${isAction ? html`<span class="sk-who-action">${tr('action')}</span>` : html`<select class="sk-speaker" aria-label=${tr('Speaker')} onChange=${(e) => { const v = e.currentTarget.value; editScene(s.id, (sc) => { const x = locateLine(sc, l.id)?.line; if (x) x.speaker = v; ensureCast(sc, v); }); }}>
        ${!c ? html`<option value="" selected>—</option>` : ''}
        ${[...cast.map((id) => characterById(p, id)), ...others].map((x) => html`<option value=${x.id} selected=${x.id === l.speaker}>${x.name}</option>`)}
      </select>`}
    </div>
    <div class="sk-body">
      ${!isAction ? html`<input class=${cx('sk-paren', !l.paren && 'is-empty')} value=${l.paren} placeholder=${tr('(paralanguage)')} aria-label=${tr('Parenthetical')} onInput=${(e) => set('paren')(e.currentTarget.value)} />` : ''}
      <${TextArea} value=${l.text} onInput=${set('text')} onKeyDown=${onKey} onBlur=${onBlur} rows=${1}
        class=${cx('sk-text', isAction ? 'sk-action-text' : 'script')}
        placeholder=${isAction ? tr('An action, a gesture, a silence…') : tr('What does {name} say?', { name })}
        aria-label=${isAction ? tr('Action') : tr('Line by {name}', { name })} />
      ${!isAction && (view.iceberg || under) ? html`<div class=${cx('sk-under', (hasUnder || under) && 'filled')}>
        <${TextArea} value=${l.subtext} onInput=${set('subtext')} rows=${1} class="sk-subtext" placeholder=${tr('Subtext · the unsaid')} aria-label=${tr('Subtext')} />
        <${GerundInput} value=${l.tactic} onInput=${set('tactic')} placeholder=${tr('Action (gerund)')} aria-label=${tr('Action (gerund)')} />
      </div>` : ''}
      ${open ? html`<div class="line-flags">${notes.map((f) => html`<${FindingBadge} f=${f}
        onDismiss=${(flaw) => act(() => { if (!l.dismissed.includes(flaw)) l.dismissed.push(flaw); })}
        onRestore=${(flaw) => act(() => { l.dismissed = l.dismissed.filter((x) => x !== flaw); })}
        onUnflag=${() => toggleFlag(s.id, l.id)} />`)}</div>` : ''}
      ${alts ? html`<div class="alts">
        <div class="alts-head"><strong>${tr('Alternatives')}</strong> <span class="muted small">${tr('Write every choice down, then keep the best')} <${Cite} ch=${[7, 9]} /></span></div>
        ${l.alternatives.map((a, ai) => html`<div class="alt-row">
          <span class="script grow">${a}</span>
          <button type="button" class="link-btn small" onClick=${() => mutate(() => { const cur = l.text; l.text = a; l.alternatives[ai] = cur; })}>${tr('Swap in')}</button>
          <button type="button" class="icon-btn" aria-label=${tr('Delete alternative')} onClick=${() => mutate(() => { l.alternatives.splice(ai, 1); })}><${Icon} name="close" /></button>
        </div>`)}
        <div class="alt-row">
          <input class="input script grow" value=${draft} placeholder=${tr('Another way to say it…')} onInput=${(e) => setDraft(e.currentTarget.value)}
            onKeyDown=${(e) => { if (e.key === 'Enter' && draft.trim()) { mutate(() => { l.alternatives.push(draft.trim()); }); setDraft(''); } }} />
          <button type="button" class="btn btn-quiet" disabled=${!draft.trim()} onClick=${() => { mutate(() => { l.alternatives.push(draft.trim()); }); setDraft(''); }}>${tr('Add')}</button>
        </div>
      </div>` : ''}
    </div>
    <div class="sk-margin">
      ${!view.quiet && live.length ? html`<button type="button" class=${cx('sk-mark', `sev-${worst}`, live.every((f) => f.status === 'possible') && 'possible')} aria-expanded=${open}
        title=${live.map((f) => f.name).join(' · ')} aria-label=${trn(live.length, '{n} note on this line', '{n} notes on this line')}
        onClick=${() => view.setOpenNotes(open ? '' : l.id)}><${SeverityIcon} severity=${worst} /><span>${live.length}</span></button>` : ''}
      ${l.marked ? html`<span class="sk-flagged" title=${tr('Flagged by ear')}><${Icon} name="flag" size=${14} /></span>` : ''}
    </div>
    <div class="sk-tools" role="toolbar" aria-label=${tr('Line tools')}>
      ${isAction
        ? tool('chat', tr('Make it a spoken line'), () => editScene(s.id, (sc) => { const x = locateLine(sc, l.id)?.line; if (x) { x.kind = 'line'; x.speaker = voiceAfter(cast, sc, l.id) || cast[0] || ''; } }))
        : html`${tool('layers', tr('Subtext and action'), () => setUnder(!under), { active: under })}
          ${tool('swap', tr('Alternatives: never settle for the first choice (Ch. 7)'), () => setAlts(!alts), { active: alts, count: l.alternatives.length })}
          ${tool('spark', aiAvailable() ? tr('Line lab: five AI alternatives') : tr('Line lab (AI, optional): enable in Settings'), () => openDrawer('lab', { mode: 'alternatives', lineId: l.id, sceneId: s.id }))}
          ${tool('flag', tr('Flag for rewrite: your own ear is the last check (Ch. 9)'), () => toggleFlag(s.id, l.id), { active: l.marked })}
          ${tool('play', tr('Read aloud from here'), () => view.readFrom(l.id))}`}
      ${tool('beat', tr('Start a new beat here'), () => editScene(s.id, (sc) => splitBeatAt(sc, l.id)), { disabled: starts })}
      ${tool('up', tr('Move up (Alt+↑)'), () => editScene(s.id, (sc) => moveLine(sc, l.id, -1)))}
      ${tool('down', tr('Move down (Alt+↓)'), () => editScene(s.id, (sc) => moveLine(sc, l.id, 1)))}
      ${tool('trash', tr('Delete line'), () => editScene(s.id, (sc) => removeLine(sc, l.id)))}
    </div>
  </div>`;
}

// ---------------------------------------------------------------------------
// Cast: pick who is in the dialogue, or name someone new.
// ---------------------------------------------------------------------------

function CastAdder({ s, cast, onPick, onDone, autoFocus }) {
  const p = state.project;
  const [name, setName] = useState('');
  const ref = useRef(null);
  useEffect(() => { if (autoFocus) ref.current?.focus(); }, []);
  const others = p.characters.filter((c) => !cast.includes(c.id));
  const add = (id) => { editScene(s.id, (sc) => ensureCast(sc, id)); onPick?.(id); };
  const create = () => {
    const n = name.trim();
    if (!n) return;
    let id;
    editScene(s.id, (sc, proj) => {
      let c = findCharacter(proj.characters, n);
      if (!c) { c = newCharacter(proj, n); proj.characters.push(c); }
      id = c.id;
      ensureCast(sc, id);
    });
    setName('');
    onPick?.(id);
  };
  const remove = (id) => editScene(s.id, (sc) => { sc.participants = sc.participants.filter((x) => x.characterId !== id); });
  return html`<div class="cast-adder">
    ${others.length ? html`<div class="chip-row">${others.map((c) => html`<button type="button" class="char-chip" style=${`--c:${charColor(c)}`} onClick=${() => add(c.id)}><span class="char-dot"></span>+ ${c.name}</button>`)}</div>` : ''}
    <div class="cast-new">
      <input ref=${ref} class="input" value=${name} placeholder=${tr('New character: type a name, then Enter')} aria-label=${tr('New character name')}
        onInput=${(e) => setName(e.currentTarget.value)} onKeyDown=${(e) => { if (e.key === 'Enter') { e.preventDefault(); create(); } if (e.key === 'Escape') onDone?.(); }} />
      <button type="button" class="btn btn-quiet btn-small" disabled=${!name.trim()} onClick=${create}>${tr('Add')}</button>
    </div>
    ${cast.length ? html`<div class="small muted cast-current">${tr('In this dialogue:')} ${cast.map((id) => {
      const c = characterById(p, id);
      return html`<span class="cast-pill" style=${`--c:${charColor(c)}`}><span class="char-dot"></span>${c?.name}<button type="button" aria-label=${tr('Remove {item}', { item: c?.name })} onClick=${() => remove(id)}>×</button></span>`;
    })}</div>` : ''}
  </div>`;
}

// ---------------------------------------------------------------------------
// The composer: who speaks, the words, Enter. Everything else is optional.
// ---------------------------------------------------------------------------

function DeskComposer({ s, cast, quiet, iceberg }) {
  const p = state.project;
  const last = speechLines(s).slice(-1)[0];
  const [speaker, setSpeaker] = useState(() => (last?.speaker && cast.includes(last.speaker) ? nextSpeaker(cast, s, last.speaker) : cast[0] || ''));
  const [action, setAction] = useState(false);
  const [text, setText] = useState('');
  const [subtext, setSubtext] = useState('');
  const [tactic, setTactic] = useState('');
  const [adding, setAdding] = useState(false);
  const [prompt, setPrompt] = useState(0);
  const box = useRef(null);
  useEffect(() => { if (!cast.includes(speaker)) setSpeaker(cast[0] || ''); }, [cast.join()]);
  const focus = () => requestAnimationFrame(() => box.current?.querySelector('.entry-text')?.focus());
  const c = characterById(p, speaker);
  const parsed = useMemo(() => (action ? null : parseEntry(text, p.characters)), [text, action, p.characters.length]);
  const cued = parsed?.id ? characterById(p, parsed.id) : null; // "NAME:" in the text overrides the chip
  const voice = parsed?.newName ? { name: parsed.newName, isNew: true } : cued || c;
  const name = voice?.name || '';
  const pt = s.participants.find((x) => x.characterId === (cued || c)?.id);
  // Drafts get the same double-check as saved lines, unless drafting quietly.
  const draftFindings = useMemo(() => {
    if (quiet || !parsed || parsed.kind !== 'line' || !parsed.text) return [];
    const draft = { text: parsed.text, tactic, subtext };
    const ctx = { character: cued || c, medium: s.medium || p.medium, genreMode: p.genreMode, lang: p.lang };
    return mergeFindings([
      ...analyzeLine(draft, ctx).map((f) => ({ f, source: 'rules' })),
      ...secondReadLine(draft, ctx).map((f) => ({ f, source: 'reader' })),
    ]).filter((f) => f.flaw !== 'noSubtext' && f.status !== 'good');
  }, [text, tactic, subtext, speaker, quiet, action, p.lang, state.settings.lang]);

  const submit = (startBeat = false) => {
    let e = action
      ? (text.trim() ? { kind: 'action', text: text.trim().replace(/^\[([\s\S]*)\]$/, '$1').trim() } : null)
      : parseEntry(text, p.characters);
    if (!e) {
      if (startBeat) editScene(s.id, (sc, proj) => addEntries(proj, sc, [{ kind: 'beat' }]));
      return;
    }
    if (e.kind === 'line') {
      if (!e.id && !e.newName && !speaker) { setAdding(true); toast(tr('Who says it? Add a voice, or type NAME: line.')); return; }
      e = { ...e, subtext: subtext.trim(), tactic: tactic.trim() };
    }
    let r;
    editScene(s.id, (sc, proj) => { r = addEntries(proj, sc, [e], { speaker, newBeat: startBeat }); });
    setText(''); setSubtext(''); setTactic(''); setAction(false); setPrompt(0);
    if (r.created.length) toast(tr('New character: {name}', { name: r.created.map((x) => x.name).join(', ') }));
    const spoke = r.lines[0] && r.lines[0].kind !== 'action' ? r.lines[0].speaker : '';
    if (spoke) {
      const sc = sceneById(state.project, s.id);
      setSpeaker(nextSpeaker(sc.participants.map((x) => x.characterId), sc, spoke));
    }
    requestAnimationFrame(() => {
      const m = document.querySelector('main');
      if (m) m.scrollTop = m.scrollHeight;
      focus();
    });
  };
  const onKey = (e) => {
    if (e.isComposing) return;
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit(e.ctrlKey || e.metaKey); return; }
    if (e.key === 'Tab' && !e.altKey && !e.ctrlKey && !e.metaKey && cast.length) {
      e.preventDefault();
      setAction(false);
      setSpeaker(cycleSpeaker(cast, speaker, e.shiftKey ? -1 : 1));
      return;
    }
    if (e.altKey && /^Digit\d$/.test(e.code)) {
      e.preventDefault();
      const k = Number(e.code.slice(5));
      if (k === 0) setAction(true);
      else if (cast[k - 1]) { setAction(false); setSpeaker(cast[k - 1]); }
      return;
    }
    if (e.key === 'ArrowUp' && !text) {
      const all = document.querySelectorAll('.sheet .sk-text');
      if (all.length) { e.preventDefault(); all[all.length - 1].focus(); }
      return;
    }
    if (e.key === 'Escape') e.currentTarget.blur();
  };
  // A whole scene pasted at once comes in line by line.
  const onPaste = (e) => {
    const t = e.clipboardData?.getData('text/plain') || '';
    if (!t.includes('\n')) return;
    const r = parseScript(t, p.characters);
    if (!r || r.entries.filter((x) => x.kind === 'line').length < 2) return;
    e.preventDefault();
    let out;
    editScene(s.id, (sc, proj) => { out = addEntries(proj, sc, r.entries, { speaker }); });
    toast(out.created.length
      ? tr('Imported {n} lines; new characters: {names}', { n: out.lines.length, names: out.created.map((x) => x.name).join(', ') })
      : trn(out.lines.length, 'Imported {n} line', 'Imported {n} lines'));
  };
  const prompts = [{ tag: tr('Magic If'), text: magicIf(name || tr('this character'), pt), ch: 19 }, ...FIVE_STEPS.slice(0, 4).map((st) => ({ tag: st.name, text: st.q, ch: st.ch }))];
  const pr = prompts[prompt % prompts.length];
  return html`<div class=${cx('desk-composer', action && 'is-action')} style=${`--c:${action ? 'var(--ink-3)' : charColor(cued || c)}`} ref=${box}>
    <div class="cast-bar" role="group" aria-label=${tr('Who speaks')}>
      ${cast.map((id, i) => {
        const ch = characterById(p, id);
        const on = !action && id === speaker && !cued && !parsed?.newName;
        return html`<button type="button" class=${cx('char-chip', on && 'active')} style=${`--c:${charColor(ch)}`} title=${tr('Shortcut: Alt+{n}', { n: i + 1 })} aria-pressed=${on}
          onClick=${() => { setAction(false); setSpeaker(id); focus(); }}><span class="char-dot"></span>${ch.name}</button>`;
      })}
      <button type="button" class=${cx('chip-btn', action && 'active')} aria-pressed=${action} title=${tr('A stage direction, gesture or silence (Alt+0)')} onClick=${() => { setAction(!action); focus(); }}>${tr('Action')}</button>
      <button type="button" class=${cx('chip-btn', adding && 'active')} aria-expanded=${adding} onClick=${() => setAdding(!adding)}>+ ${tr('Voice')}</button>
      <span class="grow"></span>
      ${cast.length > 1 ? html`<span class="small muted cast-hint">${rich('{tab} next voice', { tab: kbd('Tab') })}</span>` : ''}
    </div>
    ${adding ? html`<${CastAdder} s=${s} cast=${cast} onPick=${(id) => { setSpeaker(id); setAction(false); setAdding(false); focus(); }} onDone=${() => setAdding(false)} />` : ''}
    <div class="entry">
      <span class="entry-who">${action ? tr('ACTION') : name ? name.toUpperCase() : '…'}${voice?.isNew ? html` <span class="new-tag">${tr('new')}</span>` : ''}</span>
      <${TextArea} value=${text} onInput=${setText} onKeyDown=${onKey} onPaste=${onPaste} rows=${1} class=${cx('entry-text', action ? 'sk-action-text' : 'script')}
        placeholder=${action ? tr('An action, a gesture, a silence… Enter adds it.') : name ? tr('What does {name} say? Enter adds the line.', { name }) : tr('Type NAME: line, or add a voice first.')}
        aria-label=${tr('New line')} />
    </div>
    ${iceberg && !action ? html`<div class="entry-under">
      <input class="input" value=${subtext} placeholder=${tr('Subtext: what she thinks and feels but won\'t say')} aria-label=${tr('Subtext')} onInput=${(e) => setSubtext(e.currentTarget.value)}
        onKeyDown=${(e) => { if (e.key === 'Enter') { e.preventDefault(); submit(e.ctrlKey || e.metaKey); } }} />
      <${GerundInput} value=${tactic} onInput=${setTactic} placeholder=${tr('Action (gerund): testing, cornering…')} aria-label=${tr('Action (gerund)')}
        onKeyDown=${(e) => { if (e.key === 'Enter') { e.preventDefault(); submit(e.ctrlKey || e.metaKey); } }} />
    </div>` : ''}
    ${draftFindings.length ? html`<div class="line-flags">${draftFindings.map((f) => html`<${FindingBadge} f=${f} />`)}</div>` : ''}
    <div class="entry-foot">
      ${action
        ? html`<p class="magic-if small">${tr('The case for silence: a look, a gesture or a pause can be the strongest reaction.')} <${Cite} ch=${5} /></p>`
        : html`<p class="magic-if small"><span class="magic-if-tag">${pr.tag}</span> ${pr.text} <${Cite} ch=${pr.ch} /> <button type="button" class="link-btn small" onClick=${() => setPrompt(prompt + 1)}>${tr('Another question')}</button></p>`}
      <span class="grow"></span>
      <button type="button" class="btn btn-quiet btn-small" title=${tr('Start a new beat (Ctrl+Enter)')} onClick=${() => submit(true)}>${tr('+ New beat')}</button>
      <button type="button" class="btn btn-primary btn-small" disabled=${!text.trim()} onClick=${() => submit(false)}>${action ? tr('Add action') : tr('Add line')}</button>
    </div>
  </div>`;
}

// ---------------------------------------------------------------------------
// The McKee lens: intentions, checks, the scene's shape and its voices.
// ---------------------------------------------------------------------------

function Lens({ s, analysis, cast, turning, openLine }) {
  const p = state.project;
  const order = new Map(s.beats.flatMap((b) => b.lines).map((l, i) => [l.id, i]));
  const items = [];
  for (const [id, fs] of Object.entries(analysis.lines)) {
    for (const f of fs) {
      if (f.status === 'good' || f.dismissed || f.flaw === 'noSubtext') continue;
      if (f.status === 'possible' && !state.settings.showPossible) continue;
      items.push({ id, f });
    }
  }
  items.sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));
  const sceneNotes = analysis.scene.filter((f) => f.status !== 'good' && !f.dismissed && (state.settings.showPossible || f.status !== 'possible'));
  const bare = speechLines(s).filter((l) => l.text.trim() && !l.tactic && !l.subtext).length;
  const st = analysis.stats;
  const chips = [['confirmed', tr('Confirmed')], ['flagged', tr('Flagged')], ['possible', tr('To verify')], ['writer', tr('By ear')]];
  const copy = async () => {
    try { await navigator.clipboard.writeText(FORMATS.fountain.fn(s, p)); toast(tr('Copied to clipboard')); } catch { toast(tr('Copy failed; select the text instead'), 'error'); }
  };
  return html`
    <section class="lens-card">
      <h4>${tr('Who wants what')} <${Cite} ch=${[12, 19]} /></h4>
      ${cast.length ? cast.map((id) => {
        const c = characterById(p, id);
        const pt = s.participants.find((x) => x.characterId === id);
        return html`<div class="want" style=${`--c:${charColor(c)}`}>
          <div class="want-name"><span class="char-dot"></span><a href=${`#/character/${id}`}>${c.name}</a></div>
          <input class="input want-input" value=${pt.intention} placeholder=${tr('wants, right now…')} aria-label=${tr('{name} wants', { name: c.name })} onInput=${(e) => mutate(() => { pt.intention = e.currentTarget.value; })} />
          <input class="input want-input sub" value=${pt.subIntention} placeholder=${tr('…but really wants')} aria-label=${tr('{name} really wants', { name: c.name })} onInput=${(e) => mutate(() => { pt.subIntention = e.currentTarget.value; })} />
        </div>`;
      }) : html`<p class="small muted">${tr('Add voices to the dialogue to set what each one wants.')}</p>`}
    </section>
    <section class="lens-card">
      <h4>${tr('Checks')} <${Cite} ch=${[6, 7, 8, 9]} /></h4>
      <div class="dc-chips">${chips.map(([k, label]) => html`<span class=${cx('dc-chip', `dc-${k}`, !st[k] && 'zero')}><strong>${st[k]}</strong> ${label}</span>`)}</div>
      ${items.length ? html`<ul class="lens-list">${items.slice(0, 8).map(({ id, f }) => {
        const l = locateLine(s, id)?.line;
        const who = l?.kind === 'action' ? tr('action') : characterById(p, l?.speaker)?.name;
        return html`<li><button type="button" class="lens-item" onClick=${() => openLine(id)}>
          <${SeverityIcon} severity=${f.severity} />
          <span><strong>${f.status === 'possible' ? `${tr('Possible:')} ` : ''}${f.name}</strong> <span class="muted">${who ? `${who}: ` : ''}“${snippet(l?.text)}”</span></span>
        </button></li>`;
      })}</ul>${items.length > 8 ? html`<p class="small muted">${tr('and {n} more', { n: items.length - 8 })}</p>` : ''}`
        : html`<p class="small muted">${analysis.totalLines ? html`${tr('No flags. Read it aloud anyway')} <${Cite} ch=${9} />.` : tr('Checks appear as you write.')}</p>`}
      ${sceneNotes.length ? html`<ul class="lens-list scene-notes">${sceneNotes.map((f) => html`<li class="small" title=${f.message}><${SeverityIcon} severity=${f.severity} /> <span><strong>${f.name}</strong> <span class="muted">${f.message}</span></span></li>`)}</ul>` : ''}
      ${bare ? html`<p class="small muted">${trn(bare, '{n} line has no action named under it yet.', '{n} lines have no action named under them yet.')} <${Cite} ch=${[2, 3]} /></p>` : ''}
      <a class="link-btn small" href=${`#/scene/${s.id}/workshop`}>${tr('Full double-check →')}</a>
    </section>
    <section class="lens-card">
      <h4>${tr('Shape')} <${Cite} ch=${12} /></h4>
      <${SceneArc} arcs=${analysis.arcs} beats=${s.beats} characters=${p.characters} turningIndex=${turning} compact />
      <p class="small muted">${s.beats.length < 2 ? tr('One beat so far. Start a new beat when the action changes (Ctrl+Enter), then open the beat to set its charge.')
        : turning != null ? tr('The value turns in beat {n}.', { n: turning + 1 }) : tr('No turn yet: if nothing changes, nothing happens.')}</p>
    </section>
    <section class="lens-card">
      <h4>${tr('Voices')} <${Cite} ch=${10} /></h4>
      ${analysis.pairs.length ? analysis.pairs.map((pr) => html`<div class="distance-row">
        <span class="small">${characterById(p, pr.a)?.name} ↔ ${characterById(p, pr.b)?.name}</span>
        <${Meter} value=${Math.min(100, Math.round((pr.distance / 40) * 100))} title=${tr('Voice distance {d}', { d: pr.distance })} />
        <span class="small muted">${pr.distance < 12 ? tr('alike') : tr('distinct')}</span>
      </div>`) : html`<p class="small muted">${cast.length > 1 ? tr('Write lines to measure each voice.') : tr('One voice: compare it with the profile in its character page.')}</p>`}
    </section>
    <section class="lens-card">
      <h4>${tr('Devil\'s Advocate')}</h4>
      <div class="lens-tools">
        <button type="button" class="btn btn-quiet btn-small" onClick=${() => openDrawer('rehearse')}><${Icon} name="chat" /> ${tr('Rehearse')}</button>
        <button type="button" class="btn btn-quiet btn-small" onClick=${() => openDrawer('beats')}><${Icon} name="spark" /> ${tr('Suggest beats')}</button>
        <button type="button" class="btn btn-quiet btn-small" onClick=${() => openDrawer('doctor')}><${Icon} name="check2" /> ${tr('Doctor')}</button>
        <button type="button" class="btn btn-quiet btn-small" disabled=${!speechLines(s).length} onClick=${copy}><${Icon} name="copy" /> ${tr('Copy as screenplay')}</button>
      </div>
      ${!aiAvailable() ? html`<p class="small muted">${tr('AI is optional: enable it in Settings')}</p>` : ''}
    </section>`;
}
