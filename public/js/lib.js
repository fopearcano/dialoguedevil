// Preact + htm (served from node_modules by the server; no build step).
export {
  h, html, render, Component, createContext, useState, useReducer, useEffect, useLayoutEffect,
  useRef, useMemo, useCallback, useContext,
} from '/vendor/preact-htm.js';

export const cx = (...xs) => xs.filter(Boolean).join(' ');

export function debounce(fn, ms) {
  let t;
  const d = (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
  d.flush = (...args) => { clearTimeout(t); fn(...args); };
  d.cancel = () => clearTimeout(t);
  return d;
}

export function download(filename, text, type = 'text/plain') {
  const blob = new Blob([text], { type: `${type};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// File-name slug; accented letters lose their accents instead of vanishing.
export const slug = (s) => String(s || 'untitled').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'untitled';

export const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

export function charColor(character) {
  const slot = character?.slot;
  return slot != null && slot >= 0 && slot < 8 ? `var(--series-${slot + 1})` : 'var(--muted)';
}

// Minimal, safe markdown for assistant replies: escapes HTML first, then
// applies bold, italics, inline code, lists and paragraphs.
export function miniMarkdown(src) {
  const esc = String(src || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const inline = (s) => s
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[^*])\*([^*\n]+)\*/g, '$1<em>$2</em>');
  const blocks = esc.split(/\n{2,}/);
  return blocks.map((b) => {
    const lines = b.split('\n');
    if (lines.every((l) => /^\s*([-*]|\d+\.)\s+/.test(l))) {
      const ordered = /^\s*\d+\./.test(lines[0]);
      const items = lines.map((l) => `<li>${inline(l.replace(/^\s*([-*]|\d+\.)\s+/, ''))}</li>`).join('');
      return ordered ? `<ol>${items}</ol>` : `<ul>${items}</ul>`;
    }
    if (/^#{1,4}\s/.test(b)) return `<h4>${inline(b.replace(/^#{1,4}\s/, ''))}</h4>`;
    if (/^&gt;\s?/.test(b)) return `<blockquote>${inline(b.replace(/^&gt;\s?/gm, ''))}</blockquote>`;
    return `<p>${inline(lines.join('<br>'))}</p>`;
  }).join('');
}
