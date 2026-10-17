// Infographics: hand-built SVG charts and diagrams. Marks follow one spec:
// 2px lines, >=8px markers with a 2px surface ring, hairline solid grids,
// thin bars with 4px rounded data-ends, text in text tokens (never the
// series color), hover tooltips plus a table view for every data chart.

import { html, useState, useRef, useLayoutEffect, cx, charColor } from '../lib.js';
import { tr } from '../i18n.js';

function useWidth(ref, fallback = 640) {
  const [w, setW] = useState(fallback);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    setW(Math.max(240, Math.round(el.getBoundingClientRect().width)));
    const ro = new ResizeObserver(([entry]) => setW(Math.max(240, Math.round(entry.contentRect.width))));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return w;
}

const signColor = (v) => (v > 0 ? 'var(--pos)' : v < 0 ? 'var(--neg)' : 'var(--mid-strong)');
const fmt = (v) => (v > 0 ? `+${v}` : `${v}`);

function Tooltip({ tip }) {
  if (!tip) return null;
  return html`<div class="viz-tip" style=${`left:${tip.x}px; top:${tip.y}px`} role="status">
    ${tip.title ? html`<div class="viz-tip-title">${tip.title}</div>` : ''}
    ${(tip.rows || []).map((r) => html`<div class="viz-tip-row">
      ${r.color ? html`<span class="viz-key" style=${`--c:${r.color}`}></span>` : ''}
      <strong>${r.value}</strong><span>${r.label}</span>
    </div>`)}
  </div>`;
}

function DataToggle({ show, setShow }) {
  return html`<button type="button" class="link-btn small" onClick=${() => setShow(!show)} aria-pressed=${show}>${show ? tr('Chart') : tr('Table')}</button>`;
}

// ---------------------------------------------------------------------------
// Scene value arc + beat intensity (Ch. 9, 12)
// ---------------------------------------------------------------------------

export function SceneArc({ arcs, beats, characters = [], turningIndex, primaryId, onPickPrimary, compact }) {
  const ref = useRef(null);
  const width = useWidth(ref);
  const [tip, setTip] = useState(null);
  const [table, setTable] = useState(false);
  const idRef = useRef(`arc${Math.random().toString(36).slice(2, 7)}`);
  if (!arcs?.length) return html`<div class="viz scene-arc" ref=${ref}><div class="viz-empty">${tr('Add a value at stake to see the scene\'s arc.')}</div></div>`;
  const primary = arcs.find((a) => a.value.id === primaryId) || arcs[0];
  const others = arcs.filter((a) => a !== primary);
  const name = (id) => characters.find((c) => c.id === id)?.name || '—';
  const pts = primary.points;
  const n = pts.length;
  const poleLen = Math.max(String(primary.value.positive || '+').length, String(primary.value.negative || '−').length, compact ? 0 : 9);
  const L = Math.max(64, Math.round(poleLen * 6.6) + 40);
  const R = 18;
  const T = 22;
  const H = compact ? 120 : 170;
  const gap = 26;
  const BH = compact ? 0 : 54;
  const totalH = T + H + (BH ? gap + BH : 0) + 24;
  const plotW = width - L - R;
  const x = (i) => L + (n > 1 ? (i * plotW) / (n - 1) : plotW / 2);
  const y = (c) => T + ((10 - c) / 20) * H;
  const path = pts.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(p.charge).toFixed(1)}`).join('');
  const area = `${path}L${x(n - 1).toFixed(1)},${y(0)}L${x(0).toFixed(1)},${y(0)}Z`;
  const step = n > 1 ? plotW / (n - 1) : plotW;
  const barW = Math.max(6, Math.min(24, step * 0.45));
  const by = (v) => T + H + gap + BH - (v / 10) * BH;
  const tpX = turningIndex != null && turningIndex >= 0 ? x(turningIndex + 1) : null;
  const uid = idRef.current;

  const onMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const i = Math.max(0, Math.min(n - 1, Math.round(((px - L) / (plotW || 1)) * (n - 1))));
    const b = i > 0 ? beats[i - 1] : null;
    setTip({
      i,
      x: Math.min(width - 220, x(i) + 12),
      y: 8,
      title: i === 0 ? tr('Opening charge') : `${tr('Beat {n}', { n: i })}${b?.action ? `: ${name(b.actor)} ${b.action}` : ''}${b?.reaction ? ` / ${name(b.reactor)} ${b.reaction}` : ''}`,
      rows: [
        ...arcs.map((a) => ({ value: fmt(a.points[i].charge), label: `${a.value.positive || '+'} / ${a.value.negative || '−'}`, color: a === primary ? signColor(a.points[i].charge) : 'var(--muted)' })),
        ...(b ? [{ value: String(b.intensity ?? '—'), label: tr('intensity') }] : []),
      ],
    });
  };

  return html`<div class="viz scene-arc" ref=${ref}>
    <div class="viz-head">
      <div class="viz-title">
        ${arcs.length > 1
          ? arcs.map((a) => html`<button type="button" class=${cx('value-pill', a === primary && 'active')} onClick=${() => onPickPrimary && onPickPrimary(a.value.id)}>${a.value.positive || '+'} / ${a.value.negative || '−'}</button>`)
          : html`<span class="value-pill active">${primary.value.positive || '+'} / ${primary.value.negative || '−'}</span>`}
      </div>
      <${DataToggle} show=${table} setShow=${setTable} />
    </div>
    ${table ? html`<table class="data-table">
      <thead><tr><th>${tr('Point')}</th>${arcs.map((a) => html`<th>${a.value.positive}/${a.value.negative}</th>`)}<th>${tr('Intensity')}</th><th>${tr('Action / reaction')}</th></tr></thead>
      <tbody>${pts.map((p, i) => html`<tr class=${i - 1 === turningIndex ? 'tp-row' : ''}>
        <td>${i === 0 ? tr('Open') : tr('Beat {n}', { n: i })}</td>
        ${arcs.map((a) => html`<td class="num">${fmt(a.points[i].charge)}</td>`)}
        <td class="num">${i ? beats[i - 1]?.intensity ?? '' : ''}</td>
        <td>${i ? `${beats[i - 1]?.action || ''} / ${beats[i - 1]?.reaction || ''}` : ''}</td>
      </tr>`)}</tbody>
    </table>` : html`<svg width=${width} height=${totalH} role="img" aria-label=${tr('Value arc for {value}', { value: `${primary.value.positive}/${primary.value.negative}` })}
        onPointerMove=${onMove} onPointerLeave=${() => setTip(null)}>
      <defs>
        <clipPath id=${`${uid}-up`}><rect x="0" y="0" width=${width} height=${y(0)} /></clipPath>
        <clipPath id=${`${uid}-dn`}><rect x="0" y=${y(0)} width=${width} height=${H} /></clipPath>
      </defs>
      ${[10, 5, 0, -5, -10].map((g) => html`<line class=${g === 0 ? 'axis' : 'grid'} x1=${L} x2=${width - R} y1=${y(g)} y2=${y(g)} />`)}
      ${[10, 5, 0, -5, -10].map((g) => html`<text class="tick" x=${L - 8} y=${y(g) + 4} text-anchor="end">${fmt(g)}</text>`)}
      <text class="pole" x="4" y=${y(10) + 4}>${primary.value.positive || '+'}</text>
      <text class="pole" x="4" y=${y(-10) + 4}>${primary.value.negative || '−'}</text>
      <path d=${area} class="wash-pos" clip-path=${`url(#${uid}-up)`} />
      <path d=${area} class="wash-neg" clip-path=${`url(#${uid}-dn)`} />
      ${others.map((a) => html`<path class="line-secondary" d=${a.points.map((p, i) => `${i ? 'L' : 'M'}${x(i)},${y(p.charge)}`).join('')} />`)}
      ${tpX != null ? html`<line class="tp-line" x1=${tpX} x2=${tpX} y1=${T - 6} y2=${T + H} />
        <text class="tp-label" x=${Math.min(tpX + 5, width - 90)} y=${T - 9}>${tr('Turning point')}</text>` : ''}
      <path d=${path} class="line-primary" />
      ${others.map((a) => html`<text class="end-label" x=${x(n - 1) - 4} y=${y(a.points[n - 1].charge) - 7} text-anchor="end">${a.value.positive}</text>`)}
      ${pts.map((p, i) => html`<circle class="marker" cx=${x(i)} cy=${y(p.charge)} r=${tip?.i === i ? 6 : 4.5} style=${`fill:${signColor(p.charge)}`} />`)}
      ${!compact && pts.map((p, i) => html`<text class="x-label" x=${i === 0 ? x(0) + 6 : x(i)} y=${totalH - 6} text-anchor=${i === 0 ? 'end' : 'middle'}>${i === 0 ? tr('Open') : `${tr('B')}${i}`}</text>`)}
      ${BH ? html`
        <text class="tick" x=${L - 8} y=${T + H + gap + 10} text-anchor="end">10</text>
        <text class="pole" x="4" y=${T + H + gap + BH / 2 + 4}>${tr('intensity')}</text>
        <line class="axis" x1=${L} x2=${width - R} y1=${by(0)} y2=${by(0)} />
        ${beats.map((b, i) => {
          const v = Math.max(0, Math.min(10, Number(b.intensity) || 0));
          const bx = x(i + 1) - barW / 2;
          const top = by(v);
          const h = by(0) - top;
          const r = Math.min(4, h);
          return h > 0 ? html`<path class="bar" d=${`M${bx},${by(0)}V${top + r}Q${bx},${top} ${bx + r},${top}H${bx + barW - r}Q${bx + barW},${top} ${bx + barW},${top + r}V${by(0)}Z`} />` : '';
        })}` : ''}
      ${tip ? html`<line class="crosshair" x1=${x(tip.i)} x2=${x(tip.i)} y1=${T} y2=${T + H + (BH ? gap + BH : 0)} />` : ''}
    </svg>`}
    <${Tooltip} tip=${table ? null : tip} />
  </div>`;
}

// ---------------------------------------------------------------------------
// Voice radar (Ch. 7, 10, 13)
// ---------------------------------------------------------------------------

export function Radar({ dims, series, size = 300, mini }) {
  const [tip, setTip] = useState(null);
  const [table, setTable] = useState(false);
  const pad = mini ? 8 : 58;
  const W = size + pad * 2;
  const c = W / 2;
  const r = size / 2;
  const n = dims.length;
  const ang = (i) => -Math.PI / 2 + (i * 2 * Math.PI) / n;
  const pt = (i, v) => [c + Math.cos(ang(i)) * (r * v) / 100, c + Math.sin(ang(i)) * (r * v) / 100];
  const poly = (vals) => dims.map((d, i) => pt(i, vals?.[d.id] ?? 0).map((v) => v.toFixed(1)).join(',')).join(' ');
  const short = (d) => d.short || d.hi.split(/[\s,/]/)[0];
  const visible = series.filter((s) => s.values);
  return html`<div class=${cx('viz radar', mini && 'mini')}>
    ${mini ? '' : html`<div class="viz-head">
      ${visible.length > 1 ? html`<div class="legend">${visible.map((s) => html`<span class="legend-item"><span class="legend-line" style=${`--c:${s.color}`}></span>${s.label}</span>`)}</div>` : html`<span></span>`}
      <${DataToggle} show=${table} setShow=${setTable} />
    </div>`}
    ${table ? html`<table class="data-table">
      <thead><tr><th>${tr('Dimension')}</th>${visible.map((s) => html`<th>${s.label}</th>`)}</tr></thead>
      <tbody>${dims.map((d) => html`<tr><td>${d.label}</td>${visible.map((s) => html`<td class="num">${s.values?.[d.id] ?? '—'}</td>`)}</tr>`)}</tbody>
    </table>` : html`<svg viewBox=${`0 0 ${W} ${W}`} class="radar-svg" role="img" aria-label=${tr('Voice fingerprint radar')} onPointerLeave=${() => setTip(null)}>
      ${[25, 50, 75, 100].map((g) => html`<polygon class="grid" points=${dims.map((d, i) => pt(i, g).join(',')).join(' ')} />`)}
      ${dims.map((d, i) => {
        const [x2, y2] = pt(i, 100);
        const [lx, ly] = pt(i, 118);
        const anchor = Math.abs(Math.cos(ang(i))) < 0.2 ? 'middle' : Math.cos(ang(i)) > 0 ? 'start' : 'end';
        return html`<g>
          <line class=${tip?.i === i ? 'spoke active' : 'spoke'} x1=${c} y1=${c} x2=${x2} y2=${y2} />
          <text class="radar-label" x=${lx} y=${ly + 4} text-anchor=${anchor}>${short(d)}</text>
        </g>`;
      })}
      ${visible.map((s) => html`<polygon class="radar-area" points=${poly(s.values)} style=${`--c:${s.color}`} />`)}
      ${visible.map((s) => html`<polygon class="radar-line" points=${poly(s.values)} style=${`--c:${s.color}`} />`)}
      ${visible.map((s) => dims.map((d, i) => { const [px, py] = pt(i, s.values?.[d.id] ?? 0); return html`<circle class="marker" cx=${px} cy=${py} r="4" style=${`fill:${s.color}`} />`; }))}
      ${dims.map((d, i) => {
        const a0 = ang(i - 0.5);
        const a1 = ang(i + 0.5);
        const R2 = r * 1.25;
        return html`<path class="hit" d=${`M${c},${c}L${c + Math.cos(a0) * R2},${c + Math.sin(a0) * R2}A${R2},${R2} 0 0 1 ${c + Math.cos(a1) * R2},${c + Math.sin(a1) * R2}Z`}
          onPointerEnter=${(e) => {
            const box = e.currentTarget.ownerSVGElement.getBoundingClientRect();
            const [px, py] = pt(i, 100);
            const k = box.width / W;
            setTip({ i, x: Math.min(box.width - 200, Math.max(0, px * k - 60)), y: Math.max(0, py * k - 10), title: d.label, rows: visible.map((s) => ({ value: s.values?.[d.id] ?? '—', label: s.label, color: s.color })) });
          }} />`;
      })}
    </svg>`}
    <${Tooltip} tip=${table ? null : tip} />
  </div>`;
}

// ---------------------------------------------------------------------------
// Three spheres: said / unsaid / unsayable (Ch. 3)
// ---------------------------------------------------------------------------

export function Spheres({ active, onPick, size = 260, filled = {} }) {
  const c = size / 2;
  const rings = [
    { id: 'said', r: c - 4, label: tr('THE SAID'), sub: tr('text'), ly: 24 },
    { id: 'unsaid', r: (c - 4) * 0.66, label: tr('THE UNSAID'), sub: tr('conscious subtext'), ly: c - (c - 4) * 0.66 + 22 },
    { id: 'unsayable', r: (c - 4) * 0.32, label: tr('UNSAYABLE'), sub: tr('subconscious'), ly: c + 4 },
  ];
  return html`<svg class="spheres" viewBox=${`0 0 ${size} ${size}`} role="img" aria-label=${tr('Three spheres of character')}>
    ${rings.map((ring, i) => html`<circle class=${cx('sphere', `sphere-${i + 1}`, active === ring.id && 'active', filled[ring.id] && 'filled')} cx=${c} cy=${c} r=${ring.r}
      tabindex="0" role="button" aria-label=${ring.label} onClick=${() => onPick && onPick(ring.id)} onKeyDown=${(e) => e.key === 'Enter' && onPick && onPick(ring.id)} />`)}
    ${rings.map((ring, i) => html`<g class="sphere-text" pointer-events="none">
      <text x=${c} y=${ring.ly} text-anchor="middle" class=${cx('sphere-label', i === 2 && 'inverse')}>${ring.label}</text>
      <text x=${c} y=${ring.ly + 13} text-anchor="middle" class=${cx('sphere-sub', i === 2 && 'inverse')}>${ring.sub}</text>
    </g>`)}
  </svg>`;
}

// ---------------------------------------------------------------------------
// Forces of antagonism as concentric rings (Ch. 4, 12). Sequential ramp.
// ---------------------------------------------------------------------------

export function seqStep(level) {
  const v = Math.max(0, Math.min(10, Number(level) || 0));
  if (v === 0) return { fill: 'var(--surface-2)', ink: 'var(--ink-2)' };
  const steps = [150, 200, 250, 300, 350, 400, 450, 500, 600, 700];
  const s = steps[v - 1];
  return { fill: `var(--seq-${s})`, ink: s >= 400 ? '#fff' : 'var(--ink-on-light)' };
}

export function ConflictRings({ levels, active, onPick, size = 280 }) {
  const c = size / 2;
  const order = ['physical', 'social', 'personal', 'inner'];
  const names = { physical: tr('Physical'), social: tr('Social'), personal: tr('Personal'), inner: tr('Inner') };
  return html`<div class="conflict-rings">
    <svg viewBox=${`0 0 ${size} ${size}`} role="img" aria-label=${tr('Forces of antagonism by level')}>
      ${order.map((id, i) => {
        const r = (c - 2) * (1 - i * 0.24);
        const st = seqStep(levels[id]?.level);
        return html`<circle cx=${c} cy=${c} r=${r} class=${cx('ring', active === id && 'active')} style=${`fill:${st.fill}`}
          tabindex="0" role="button" aria-label=${tr('{name} conflict, level {n}', { name: names[id], n: levels[id]?.level ?? 0 })} onClick=${() => onPick && onPick(id)} />`;
      })}
      ${order.map((id, i) => {
        const r = (c - 2) * (1 - i * 0.24);
        const st = seqStep(levels[id]?.level);
        const yy = i === 3 ? c + 4 : c - r + 18;
        return html`<text x=${c} y=${yy} text-anchor="middle" class="ring-label" style=${`fill:${st.ink}`} pointer-events="none">${names[id]} · ${levels[id]?.level ?? 0}</text>`;
      })}
    </svg>
    <div class="seq-legend" aria-hidden="true"><span>0</span><span class="seq-ramp"></span><span>10</span></div>
  </div>`;
}

// ---------------------------------------------------------------------------
// Background desires: relationship web (Ch. 12). Diverging edge colors.
// ---------------------------------------------------------------------------

export function RelationshipWeb({ center, relationships, characters }) {
  const [tip, setTip] = useState(null);
  const W = 420;
  const H = 300;
  const cx0 = W / 2;
  const cy0 = H / 2;
  const n = relationships.length;
  const nodes = relationships.map((r, i) => {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / Math.max(1, n);
    const target = characters.find((c) => c.id === r.targetId);
    return { r, target, x: cx0 + Math.cos(a) * 150, y: cy0 + Math.sin(a) * 105, label: target?.name || r.label || '—' };
  });
  return html`<div class="viz rel-web">
    <svg viewBox=${`0 0 ${W} ${H}`} role="img" aria-label=${tr('Relationship web')} onPointerLeave=${() => setTip(null)}>
      ${nodes.map((nd) => {
        const ch = Number(nd.r.charge) || 0;
        return html`<line x1=${cx0} y1=${cy0} x2=${nd.x} y2=${nd.y} class="edge" style=${`stroke:${signColor(ch)}; stroke-width:${1.5 + (Math.abs(ch) / 10) * 4}`} />`;
      })}
      ${nodes.map((nd) => {
        const ch = Number(nd.r.charge) || 0;
        const mx = (cx0 + nd.x) / 2;
        const my = (cy0 + nd.y) / 2;
        return html`<g>
          <rect x=${mx - 15} y=${my - 10} width="30" height="18" rx="9" class="edge-badge" />
          <text x=${mx} y=${my + 3} text-anchor="middle" class="edge-label">${fmt(ch)}</text>
        </g>`;
      })}
      <circle cx=${cx0} cy=${cy0} r="30" class="node center" style=${`fill:${charColor(center)}`} />
      <text x=${cx0} y=${cy0 + 46} text-anchor="middle" class="node-label strong">${center.name}</text>
      ${nodes.map((nd) => html`<g class="node-g" tabindex="0"
          onPointerEnter=${(e) => {
            const box = e.currentTarget.ownerSVGElement.getBoundingClientRect();
            const k = box.width / W;
            setTip({ x: Math.min(box.width - 220, nd.x * k + 14), y: nd.y * k, title: nd.label, rows: [{ value: fmt(Number(nd.r.charge) || 0), label: tr('relationship charge') }, ...(nd.r.restraint ? [{ value: '', label: tr('Won\'t say: {text}', { text: nd.r.restraint }) }] : [])] });
          }}>
        <circle cx=${nd.x} cy=${nd.y} r="14" class="hit-ring" />
        <circle cx=${nd.x} cy=${nd.y} r="10" class="node" style=${`fill:${nd.target ? charColor(nd.target) : 'var(--muted)'}`} />
        <text x=${nd.x} y=${nd.y < cy0 - 5 ? nd.y - 18 : nd.y + 26} text-anchor="middle" class="node-label">${nd.label.length > 22 ? `${nd.label.slice(0, 21)}…` : nd.label}</text>
      </g>`)}
    </svg>
    <${Tooltip} tip=${tip} />
  </div>`;
}

// ---------------------------------------------------------------------------
// Small pieces
// ---------------------------------------------------------------------------

export function Sparkline({ points, width = 120, height = 34 }) {
  if (!points || points.length < 2) return html`<svg width=${width} height=${height} class="sparkline" aria-hidden="true"><line class="axis" x1="0" x2=${width} y1=${height / 2} y2=${height / 2} /></svg>`;
  const n = points.length;
  const x = (i) => 4 + (i * (width - 8)) / (n - 1);
  const y = (c) => 4 + ((10 - c) / 20) * (height - 8);
  const last = points[n - 1].charge;
  return html`<svg width=${width} height=${height} class="sparkline" role="img" aria-label=${tr('Value arc: opens {open}, closes {close}', { open: points[0].charge, close: last })}>
    <line class="axis" x1="0" x2=${width} y1=${y(0)} y2=${y(0)} />
    <polyline class="spark-line" points=${points.map((p, i) => `${x(i)},${y(p.charge)}`).join(' ')} />
    <circle class="marker" cx=${x(n - 1)} cy=${y(last)} r="3.5" style=${`fill:${signColor(last)}`} />
  </svg>`;
}

export function TaskBars({ tasks, defs }) {
  return html`<div class="task-bars">
    ${defs.map((d) => {
      const v = tasks?.[d.id];
      return html`<div class="task-row" title=${d.desc}>
        <span class="task-label">${d.name}</span>
        <span class="task-track">${v != null ? html`<span class="task-fill" style=${`width:${v}%`}></span>` : ''}</span>
        <span class="task-value">${v == null ? '—' : v}</span>
      </div>`;
    })}
  </div>`;
}

export function HeatMatrix({ rows, cols, get, rowLabel }) {
  return html`<table class="heat">
    <thead><tr><th></th>${cols.map((c) => html`<th>${c.name}</th>`)}</tr></thead>
    <tbody>${rows.map((r) => html`<tr>
      <th>${rowLabel(r)}</th>
      ${cols.map((c) => { const v = get(r, c); const st = seqStep(v); return html`<td style=${`background:${st.fill}; color:${st.ink}`} title=${`${c.name}: ${v}`}>${v}</td>`; })}
    </tr>`)}</tbody>
  </table>`;
}

export function Trialogue({ a, b, third }) {
  const has = Boolean(String(third || '').trim());
  return html`<svg class="trialogue" viewBox="0 0 260 150" role="img" aria-label=${has ? tr('Trialogue through {third}', { third }) : tr('Duelogue: no third thing')}>
    ${has ? html`
      <line class="tri-edge" x1="40" y1="118" x2="130" y2="34" />
      <line class="tri-edge" x1="220" y1="118" x2="130" y2="34" />
      <line class="tri-base" x1="40" y1="118" x2="220" y2="118" />
      <rect x="118" y="22" width="24" height="24" transform="rotate(45 130 34)" class="tri-third" />
      <text x="130" y="12" text-anchor="middle" class="tri-label strong">${String(third).length > 34 ? `${String(third).slice(0, 33)}…` : third}</text>
    ` : html`
      <line class="duel-edge" x1="40" y1="100" x2="220" y2="100" />
      <text x="130" y="88" text-anchor="middle" class="tri-label">${tr('duelogue: nothing between them')}</text>
    `}
    <circle cx="40" cy=${has ? 118 : 100} r="10" style=${`fill:${charColor(a)}`} class="node" />
    <circle cx="220" cy=${has ? 118 : 100} r="10" style=${`fill:${charColor(b)}`} class="node" />
    <text x="40" y=${has ? 142 : 124} text-anchor="middle" class="tri-label">${a?.name || 'A'}</text>
    <text x="220" y=${has ? 142 : 124} text-anchor="middle" class="tri-label">${b?.name || 'B'}</text>
  </svg>`;
}

// Where the core word sits in each line design (Ch. 5).
export function LineDesignGlyph({ design }) {
  const pos = { suspense: 9, cumulative: 0, balanced: 4 }[design];
  return html`<span class="design-glyph" aria-hidden="true">
    ${Array.from({ length: 10 }, (_, i) => html`<span class=${cx('dg-word', pos === i && 'core', design === 'mixed' && (i === 3 || i === 9) && 'core')}></span>`)}
  </span>`;
}

export function Gauge({ value, label, size = 76 }) {
  const v = Math.max(0, Math.min(100, Number(value) || 0));
  const r = size / 2 - 7;
  const circ = 2 * Math.PI * r;
  return html`<div class="gauge" role="img" aria-label=${`${label}: ${v}%`}>
    <svg width=${size} height=${size}>
      <circle cx=${size / 2} cy=${size / 2} r=${r} class="gauge-track" />
      <circle cx=${size / 2} cy=${size / 2} r=${r} class="gauge-fill" style=${`stroke-dasharray:${(v / 100) * circ} ${circ}`} transform=${`rotate(-90 ${size / 2} ${size / 2})`} />
      <text x=${size / 2} y=${size / 2 + 5} text-anchor="middle" class="gauge-value">${v}%</text>
    </svg>
    <div class="gauge-label">${label}</div>
  </div>`;
}
