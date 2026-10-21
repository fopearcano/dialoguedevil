// Shared form and display components.

import { html, useState, useRef, useLayoutEffect, useEffect, cx, charColor } from '../lib.js';
import { cite, shortCite, ALL_TACTICS } from '../mckee.js';
import { sourceLabel } from '../doublecheck.js';
import { tr } from '../i18n.js';

// A translated sentence with elements in it: rich('Press {key} to stop.',
// { key: html`<kbd>Esc</kbd>` }) returns text and nodes for htm.
export function rich(key, vars = {}) {
  return tr(key).split(/(\{\w+\})/).filter(Boolean).map((part) => {
    const m = part.match(/^\{(\w+)\}$/);
    return m && m[1] in vars ? vars[m[1]] : part;
  });
}

export function Cite({ ch }) {
  if (ch == null) return null;
  return html`<span class="cite" title=${`McKee, Dialogue — ${cite(ch)}`}>${shortCite(ch)}</span>`;
}

export function Field({ label, ch, hint, children, wide }) {
  return html`<label class=${cx('field', wide && 'wide')}>
    <span class="field-label">${label}${ch != null ? html` <${Cite} ch=${ch} />` : ''}</span>
    ${children}
    ${hint ? html`<span class="field-hint">${hint}</span>` : ''}
  </label>`;
}

export function TextInput({ value, onInput, placeholder, class: klass, list, ...rest }) {
  return html`<input class=${cx('input', klass)} type="text" value=${value ?? ''} placeholder=${placeholder || ''} list=${list}
    onInput=${(e) => onInput(e.currentTarget.value)} ...${rest} />`;
}

export function TextArea({ value, onInput, placeholder, rows = 2, class: klass, onKeyDown, autoFocus, ...rest }) {
  const ref = useRef(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight + 2}px`;
  }, [value]);
  useEffect(() => { if (autoFocus) ref.current?.focus(); }, []);
  return html`<textarea ref=${ref} class=${cx('input textarea', klass)} rows=${rows} value=${value ?? ''} placeholder=${placeholder || ''}
    onInput=${(e) => onInput(e.currentTarget.value)} onKeyDown=${onKeyDown} ...${rest}></textarea>`;
}

export function GerundInput({ value, onInput, placeholder, class: klass, ...rest }) {
  return html`<input class=${cx('input gerund', klass)} type="text" list="dd-tactics" value=${value ?? ''} placeholder=${placeholder ?? tr('action as a gerund…')}
    onInput=${(e) => onInput(e.currentTarget.value)} ...${rest} />`;
}

// Datalist of tactic gerunds, rendered once at the app root.
export function TacticsDatalist() {
  return html`<datalist id="dd-tactics">${ALL_TACTICS.map((t) => html`<option value=${t} />`)}</datalist>`;
}

export function Select({ value, onChange, options, placeholder, class: klass, ariaLabel }) {
  return html`<select class=${cx('input select', klass)} value=${value ?? ''} aria-label=${ariaLabel} onChange=${(e) => onChange(e.currentTarget.value)}>
    ${placeholder != null ? html`<option value="">${placeholder}</option>` : ''}
    ${options.map(([v, l]) => html`<option value=${v} selected=${String(v) === String(value)}>${l}</option>`)}
  </select>`;
}

export function ListInput({ value = [], onChange, placeholder = tr('Type and press Enter') }) {
  const [draft, setDraft] = useState('');
  const add = (raw) => {
    const items = String(raw).split(',').map((s) => s.trim()).filter(Boolean);
    if (!items.length) return;
    onChange([...value, ...items.filter((i) => !value.includes(i))]);
    setDraft('');
  };
  return html`<div class="chips-input">
    ${value.map((v, i) => html`<span class="chip">${v}<button type="button" aria-label=${tr('Remove {item}', { item: v })} onClick=${() => onChange(value.filter((_, j) => j !== i))}>×</button></span>`)}
    <input class="chips-entry" value=${draft} placeholder=${value.length ? '' : placeholder}
      onInput=${(e) => { const v = e.currentTarget.value; if (v.includes(',')) add(v); else setDraft(v); }}
      onKeyDown=${(e) => {
        if (e.key === 'Enter') { e.preventDefault(); add(draft); }
        if (e.key === 'Backspace' && !draft && value.length) onChange(value.slice(0, -1));
      }}
      onBlur=${() => draft && add(draft)} />
  </div>`;
}

export function Slider({ value, onInput, min = 0, max = 100, step = 1, lo, hi, label, diverging, ariaLabel }) {
  const v = Number(value ?? 0);
  const pct = ((v - min) / (max - min)) * 100;
  const zero = ((0 - min) / (max - min)) * 100;
  const style = diverging
    ? `--fill-color:${v > 0 ? 'var(--pos)' : v < 0 ? 'var(--neg)' : 'var(--mid-strong)'}; --lo:${Math.min(pct, zero)}%; --hi:${Math.max(pct, zero)}%`
    : `--pct:${pct}%`;
  return html`<div class=${cx('slider', diverging && 'diverging')}>
    ${label ? html`<div class="slider-label"><span>${label}</span><strong>${diverging && v > 0 ? '+' : ''}${v}</strong></div>` : ''}
    <input type="range" min=${min} max=${max} step=${step} value=${v} style=${style} aria-label=${ariaLabel || label}
      onInput=${(e) => onInput(Number(e.currentTarget.value))} />
    ${lo || hi ? html`<div class="slider-poles"><span>${lo}</span><span>${hi}</span></div>` : ''}
  </div>`;
}

export function Tabs({ tabs, active, onChange, small }) {
  return html`<div class=${cx('tabs', small && 'small')} role="tablist">
    ${tabs.map((t) => html`<button type="button" role="tab" aria-selected=${t.id === active} class=${cx('tab', t.id === active && 'active')} onClick=${() => onChange(t.id)}>
      ${t.label}${t.badge != null ? html`<span class="tab-badge">${t.badge}</span>` : ''}
    </button>`)}
  </div>`;
}

const SEVERITY = {
  good: { icon: 'M4 8.5l2.5 2.5L12 5.5' },
  info: { icon: 'M8 7v4M8 4.6v.1' },
  warning: { icon: 'M8 4.5v4M8 11v.1' },
  serious: { icon: 'M8 4.5v4M8 11v.1' },
  critical: { icon: 'M5 5l6 6M11 5l-6 6' },
};

export function SeverityIcon({ severity }) {
  const s = SEVERITY[severity] || SEVERITY.info;
  return html`<svg class=${`sev-icon sev-${severity}`} viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
    ${severity === 'serious' || severity === 'warning'
      ? html`<path class="sev-shape" d="M8 1.5L15 14H1z" />`
      : html`<circle class="sev-shape" cx="8" cy="8" r="7" />`}
    <path class="sev-mark" d=${s.icon} />
  </svg>`;
}

const STATUS_TAG = { confirmed: (f) => tr('{n} checks', { n: f.sources.length }), possible: () => tr('verify'), writer: () => tr('by ear') };
const possiblePrefix = (f) => (f.status === 'possible' ? `${tr('Possible:')} ` : '');

// A finding badge: icon + label (never color alone). Merged findings from the
// double-check also show their status and sources; click to expand.
export function FindingBadge({ f, onDismiss, onRestore, onUnflag }) {
  const [open, setOpen] = useState(false);
  const tag = STATUS_TAG[f.status]?.(f);
  const notes = f.notes || [{ message: f.message }];
  return html`<span class=${cx('finding', `sev-${f.severity}`, f.status && `st-${f.status}`, open && 'open', f.dismissed && 'is-dismissed', f.disputed && 'is-disputed')}>
    <button type="button" class="finding-head" onClick=${() => setOpen(!open)} aria-expanded=${open} title=${f.message}>
      <${SeverityIcon} severity=${f.severity} />
      <span>${possiblePrefix(f)}${f.name}</span>
      ${tag ? html`<span class="fs-tag">${tag}</span>` : ''}
      ${f.disputed ? html`<span class="fs-tag">${tr('disputed')}</span>` : ''}
      ${f.dismissed ? html`<span class="fs-tag">${tr('dismissed')}</span>` : ''}
    </button>
    ${open ? html`<span class="finding-body">
      ${f.sources ? html`<span class="finding-sources">${tr('Found by {sources}', { sources: f.sources.map(sourceLabel).join(' · ') })}${f.status === 'possible' ? tr(': one check only, so verify it') : f.status === 'confirmed' ? tr(': independent checks agree') : ''}</span>` : ''}
      ${notes.map((n) => html`<span>${n.source && notes.length > 1 ? html`<strong>${sourceLabel(n.source)}:</strong> ` : ''}${n.message}${n.evidence ? html` <em>“${n.evidence}”</em>` : ''}</span>`)}
      ${f.disputed ? html`<span class="finding-dispute"><strong>${tr('AI review disagrees:')}</strong> ${f.disputed}</span>` : ''}
      ${f.fix ? html`<span class="finding-fix"><strong>${tr('Fix:')}</strong> ${f.fix}</span>` : ''}
      ${f.ch ? html`<${Cite} ch=${f.ch} />` : ''}
      ${f.status && f.status !== 'good' ? html`<span class="finding-actions">
        ${f.status === 'writer' && onUnflag ? html`<button type="button" class="link-btn small" onClick=${onUnflag}>${tr('Unflag')}</button>` : ''}
        ${f.status !== 'writer' && !f.dismissed && onDismiss ? html`<button type="button" class="link-btn small" onClick=${() => onDismiss(f.flaw)}>${tr('Dismiss as deliberate')}</button>` : ''}
        ${f.dismissed && onRestore ? html`<button type="button" class="link-btn small" onClick=${() => onRestore(f.flaw)}>${tr('Restore')}</button>` : ''}
      </span>` : ''}
    </span>` : ''}
  </span>`;
}

export function FindingList({ findings, empty, onDismiss, onRestore }) {
  if (!findings?.length) return html`<p class="muted small">${empty ?? tr('Nothing to flag.')}</p>`;
  return html`<ul class="finding-list">
    ${findings.map((f) => {
      const tag = STATUS_TAG[f.status]?.(f);
      return html`<li class=${cx(`sev-${f.severity}`, f.dismissed && 'is-dismissed')}>
        <${SeverityIcon} severity=${f.severity} />
        <div>
          <div class="finding-title">${possiblePrefix(f)}${f.name} ${f.ch ? html`<${Cite} ch=${f.ch} />` : ''}
            ${tag ? html`<span class="fs-tag">${tag}</span>` : ''}${f.disputed ? html`<span class="fs-tag">${tr('disputed')}</span>` : ''}${f.dismissed ? html`<span class="fs-tag">${tr('dismissed')}</span>` : ''}</div>
          ${(f.notes || [{ message: f.message }]).map((n) => html`<div class="small">${n.source && (f.notes || []).length > 1 ? html`<strong>${sourceLabel(n.source)}:</strong> ` : ''}${n.message}</div>`)}
          ${f.disputed ? html`<div class="small"><strong>${tr('AI review disagrees:')}</strong> ${f.disputed}</div>` : ''}
          ${f.fix ? html`<div class="small muted"><strong>${tr('Fix:')}</strong> ${f.fix}</div>` : ''}
          ${f.status && f.status !== 'good' && (onDismiss || onRestore) ? html`<div>${f.dismissed
            ? html`<button type="button" class="link-btn small" onClick=${() => onRestore?.(f.flaw)}>${tr('Restore')}</button>`
            : html`<button type="button" class="link-btn small" onClick=${() => onDismiss?.(f.flaw)}>${tr('Dismiss as deliberate')}</button>`}</div>` : ''}
        </div>
      </li>`;
    })}
  </ul>`;
}

export function CharDot({ character, size = 10 }) {
  return html`<span class="char-dot" style=${`--c:${charColor(character)}; width:${size}px; height:${size}px`} aria-hidden="true"></span>`;
}

export function CharChip({ character, onClick, active }) {
  if (!character) return html`<span class="char-chip muted">—</span>`;
  return html`<button type="button" class=${cx('char-chip', active && 'active')} style=${`--c:${charColor(character)}`} onClick=${onClick}>
    <span class="char-dot"></span>${character.name}
  </button>`;
}

export function CharSelect({ project, value, onChange, placeholder = '—', allowAction }) {
  const opts = (project.characters || []).map((c) => [c.id, c.name]);
  if (allowAction) opts.push(['__action', tr('(stage direction)')]);
  const c = (project.characters || []).find((x) => x.id === value);
  return html`<span class="char-select" style=${`--c:${charColor(c)}`}>
    <span class="char-dot"></span>
    <${Select} value=${value} onChange=${onChange} options=${opts} placeholder=${placeholder} ariaLabel=${tr('Character')} />
  </span>`;
}

export function Meter({ value, label, max = 100, suffix = '%', title }) {
  const v = value == null ? null : Math.round(value);
  return html`<div class="meter" title=${title}>
    ${label ? html`<div class="meter-label"><span>${label}</span><strong>${v == null ? '—' : `${v}${suffix}`}</strong></div>` : ''}
    <div class="meter-track"><div class="meter-fill" style=${`width:${v == null ? 0 : (v / max) * 100}%`}></div></div>
  </div>`;
}

export function Empty({ title, children, action }) {
  return html`<div class="empty">
    <div class="empty-title">${title}</div>
    ${children ? html`<div class="muted">${children}</div>` : ''}
    ${action || ''}
  </div>`;
}

export function Modal({ open, title, onClose, children, wide }) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);
  if (!open) return null;
  return html`<div class="modal-backdrop" onClick=${(e) => e.target === e.currentTarget && onClose()}>
    <div class=${cx('modal', wide && 'wide')} role="dialog" aria-modal="true" aria-label=${title}>
      <header class="modal-head"><h2>${title}</h2><button type="button" class="icon-btn" aria-label=${tr('Close')} onClick=${onClose}>×</button></header>
      <div class="modal-body">${children}</div>
    </div>
  </div>`;
}

export function Card({ title, ch, children, class: klass, actions, sub }) {
  return html`<section class=${cx('card', klass)}>
    ${title ? html`<header class="card-head">
      <div><h3>${title} ${ch != null ? html`<${Cite} ch=${ch} />` : ''}</h3>${sub ? html`<p class="card-sub">${sub}</p>` : ''}</div>
      ${actions ? html`<div class="card-actions">${actions}</div>` : ''}
    </header>` : ''}
    ${children}
  </section>`;
}

export function Icon({ name, size = 16 }) {
  const paths = {
    story: 'M3 3h10v10H3zM6 6h4M6 9h4',
    person: 'M8 8a3 3 0 100-6 3 3 0 000 6zM2.5 14c.8-2.6 3-4 5.5-4s4.7 1.4 5.5 4',
    scene: 'M2 4h12v8H2zM2 7h12M6 4v8',
    book: 'M3 2.5h6.5a2 2 0 012 2V14H5a2 2 0 01-2-2zM11.5 4.5H13V14',
    gear: 'M8 5.5a2.5 2.5 0 100 5 2.5 2.5 0 000-5zM8 1v2M8 13v2M1 8h2M13 8h2M3 3l1.4 1.4M11.6 11.6L13 13M3 13l1.4-1.4M11.6 4.4L13 3',
    plus: 'M8 3v10M3 8h10',
    spark: 'M8 1.5l1.6 4.2 4.4.3-3.4 2.8 1.1 4.2L8 10.7 4.3 13l1.1-4.2L2 6l4.4-.3z',
    chat: 'M2.5 3.5h11v7h-6l-3 2.5v-2.5h-2z',
    undo: 'M6 4L3 7l3 3M3 7h6.5a3.5 3.5 0 010 7H7',
    redo: 'M10 4l3 3-3 3M13 7H6.5a3.5 3.5 0 000 7H9',
    trash: 'M3.5 4.5h9M6.5 4.5V3h3v1.5M5 4.5l.6 9h4.8l.6-9',
    up: 'M8 12V4M4.5 7.5L8 4l3.5 3.5',
    down: 'M8 4v8M4.5 8.5L8 12l3.5-3.5',
    eye: 'M1.5 8s2.4-4.5 6.5-4.5S14.5 8 14.5 8 12.1 12.5 8 12.5 1.5 8 1.5 8zM8 9.8a1.8 1.8 0 100-3.6 1.8 1.8 0 000 3.6z',
    download: 'M8 2.5v8M4.5 7L8 10.5 11.5 7M3 13.5h10',
    copy: 'M5.5 5.5h7v8h-7zM3.5 10.5v-8h7',
    menu: 'M2.5 4h11M2.5 8h11M2.5 12h11',
    close: 'M4 4l8 8M12 4l-8 8',
    mic: 'M8 1.5a2 2 0 012 2v4a2 2 0 01-4 0v-4a2 2 0 012-2zM4 7.5a4 4 0 008 0M8 11.5V14',
    layers: 'M8 2L1.5 5.5 8 9l6.5-3.5zM1.5 8.5L8 12l6.5-3.5M1.5 11.5L8 15l6.5-3.5',
    swap: 'M3 5.5h9l-2.5-2.5M13 10.5H4l2.5 2.5',
    flame: 'M8 14.5c-2.8 0-4.5-1.9-4.5-4.3C3.5 6.8 7 5.5 7 1.5c2.6 1.5 5.5 4.6 5.5 8.6 0 2.5-1.8 4.4-4.5 4.4z',
    flag: 'M3.5 14.5V2M3.5 2.5h8l-1.8 3 1.8 3h-8',
    play: 'M5 3l8 5-8 5z',
    stop: 'M4 4h8v8H4z',
    check2: 'M1.5 8.5l2.5 2.5L9 5.5M7 10.5l.5.5L13 5.5',
    pen: 'M3 13l.8-3.2L11 2.6 13.4 5 6.2 12.2zM9.6 4l2.4 2.4',
    beat: 'M1.5 8h3M6.5 8h3M11.5 8h3M8 2.5v2.5M8 11v2.5',
  };
  return html`<svg class="icon" viewBox="0 0 16 16" width=${size} height=${size} aria-hidden="true"><path d=${paths[name] || ''} /></svg>`;
}
