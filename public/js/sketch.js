// Sketching helpers for the writing desk: the quick-entry syntax, pasting a
// whole scene at once, and moving lines and beat breaks. Pure functions over
// the project data (they mutate the scene they are given), shared with tests.
//
// Quick entry, one line at a time:
//   NAME: text       picks the speaker; an unknown NAME in capitals is a new character
//   (softly) text    paralanguage
//   [She leaves.]    an action: stage direction, gesture, silence
//   ---              a beat break

import { newBeat, newCharacter, newLine, locateLine } from './model.js';

// All-caps words that open a sentence, not a speech.
const STOP = new Set(['OK', 'NO', 'SI', 'SÌ', 'TV', 'PS', 'PPS', 'NB', 'FYI', 'ASAP', 'NOTA', 'NOTE', 'PS.']);
// Screenplay extensions that are not paralanguage: (V.O.), (O.S.), (CONT'D), (F.C.)…
const EXTENSION = /^(?:v\.?\s?o\.?|o\.?\s?s\.?|o\.?\s?c\.?|cont'?d\.?|cont\.?|f\.?\s?c\.?|off|fuori campo|voce fuori campo)$/i;
const NAME_LIKE = /^\p{L}[\p{L}\p{M}\p{N}'’.\- ]{0,39}$/u;
const COLON = /^\s*([^:\n()[\]]{1,40}?)\s*(?:\(([^)\n]{0,40})\))?\s*:\s*(.*)$/;
const SCREEN_CUE = /^([\p{Lu}][\p{Lu}\p{M}\p{N}'’.\- ]{0,38}?)\s*(?:\([^)]{1,24}\))?\s*\^?$/u;
const HEADING = /^(?:INT|EXT|EST|I\/E|INT\.?\/EXT)[. ]/i;
const TITLE_KEY = /^(?:title|credit|authors?|source|draft date|date|contact|notes|copyright|titolo|autore|autori)\s*:/i;

const fold = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();
const wordCount = (s) => String(s).trim().split(/\s+/).length;
const isCaps = (s) => /\p{L}{2}/u.test(s) && s === s.toUpperCase() && s !== s.toLowerCase();

// "NICCOLÒ" → "Niccolò", "D'ARCO" → "D'Arco", "MARY-ANN" → "Mary-Ann".
export function titleCase(name) {
  return String(name).toLowerCase().replace(/(^|[\s'’\-.])(\p{L})/gu, (m, sep, ch) => sep + ch.toUpperCase());
}

// A character by name: exact (ignoring case and accents), or by first name
// when only one character has it.
export function findCharacter(characters, name) {
  const n = fold(name);
  if (!n) return null;
  const exact = characters.find((c) => fold(c.name) === n);
  if (exact) return exact;
  const first = characters.filter((c) => fold(c.name).split(' ')[0] === n);
  return first.length === 1 ? first[0] : null;
}

// A speaker cue: { id } for a known character, { newName } for a new one, or
// null. `loose` (pasted scripts) also accepts capitalized names, not only
// names in capitals.
function resolveCue(raw, characters, loose) {
  const name = String(raw).trim();
  if (!NAME_LIKE.test(name) || wordCount(name) > 4) return null;
  const known = findCharacter(characters, name);
  if (known) return { id: known.id };
  if (STOP.has(name.toUpperCase())) return null;
  if (isCaps(name)) return { newName: titleCase(name) };
  if (loose && /^\p{Lu}/u.test(name)) return { newName: name };
  return null;
}

// "(softly) text" → paren "softly", text "text".
function splitParen(e) {
  const m = e.text.match(/^\(([^)\n]*)\)\s*([\s\S]*)$/);
  if (m) {
    e.paren = [e.paren, m[1].trim()].filter(Boolean).join(', ');
    e.text = m[2].trim();
  }
  return e;
}

// A speech with no words but a parenthetical is an action: silence is a choice.
function settle(e) {
  if (e.kind !== 'line' || e.text) return e;
  return e.paren ? { kind: 'action', text: e.paren } : null;
}

// One entry typed in the composer. Returns null for blank input.
export function parseEntry(raw, characters = []) {
  const s = String(raw || '').trim();
  if (!s) return null;
  if (/^(?:-{3,}|\/beat)$/i.test(s)) return { kind: 'beat' };
  const act = s.match(/^\[([\s\S]*)\]$/);
  if (act) return act[1].trim() ? { kind: 'action', text: act[1].trim() } : null;
  const e = { kind: 'line', text: s, paren: '' };
  const cue = s.match(COLON);
  const who = cue && cue[3].trim() && resolveCue(cue[1], characters, false);
  if (who) {
    Object.assign(e, who);
    e.text = cue[3].trim();
    if (cue[2] && !EXTENSION.test(cue[2].trim())) e.paren = cue[2].trim();
  }
  return settle(splitParen(e));
}

function isScreenCue(row) {
  const r = String(row || '').trim();
  if (!r || r !== r.toUpperCase() || HEADING.test(r) || /:$/.test(r)) return false;
  const m = r.match(SCREEN_CUE);
  return !!m && wordCount(m[1]) <= 4 && /\p{L}{2}/u.test(m[1]) && !STOP.has(m[1].trim());
}

// A whole scene pasted at once: "NAME: line" transcripts, or screenplay
// blocks (a cue in capitals, an optional parenthetical, the speech; other
// paragraphs are action). Returns { entries, newNames }, or null when the
// text doesn't look like a script.
export function parseScript(text, characters = []) {
  const rows = String(text || '').replace(/\r\n?/g, '\n').split('\n');
  const colon = rows.filter((r) => { const m = r.match(COLON); return m && m[3].trim() && !TITLE_KEY.test(r.trim()) && resolveCue(m[1], characters, true); }).length;
  const cues = rows.filter((r, i) => isScreenCue(r) && String(rows[i + 1] || '').trim()).length;
  let entries;
  if (colon >= 2 && colon >= cues) entries = colonScript(rows, characters);
  else if (cues >= 2) entries = screenplay(rows, characters);
  else return null;
  entries = entries.map(settle).filter(Boolean);
  const seen = new Set();
  const newNames = [];
  for (const e of entries) if (e.newName && !seen.has(fold(e.newName))) { seen.add(fold(e.newName)); newNames.push(e.newName); }
  return { entries, newNames };
}

function colonScript(rows, characters) {
  const out = [];
  let last = null; // a speech that continues on the next row
  for (const raw of rows) {
    const r = raw.trim();
    if (!r) { last = null; continue; }
    if (/^-{3,}$/.test(r)) { out.push({ kind: 'beat' }); last = null; continue; }
    if (TITLE_KEY.test(r) && !out.length) continue;
    const m = r.match(COLON);
    const who = m && resolveCue(m[1], characters, true);
    if (who) {
      const e = splitParen({ kind: 'line', ...who, paren: m[2] && !EXTENSION.test(m[2].trim()) ? m[2].trim() : '', text: m[3].trim() });
      out.push(e);
      last = e;
      continue;
    }
    const act = r.match(/^\[([\s\S]*)\]$/);
    if (act) { out.push({ kind: 'action', text: act[1].trim() }); last = null; continue; }
    if (last && !last.text && /^\(.*\)$/.test(r)) { last.paren = [last.paren, r.slice(1, -1).trim()].filter(Boolean).join(', '); continue; }
    if (last) { last.text = last.text ? `${last.text} ${r}` : r; continue; }
    out.push({ kind: 'action', text: r.replace(/^\((.*)\)$/, '$1') });
  }
  return out;
}

function screenplay(rows, characters) {
  const out = [];
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i].trim();
    if (!r) continue;
    if (/^(?:-{3,}|={3,})$/.test(r)) { out.push({ kind: 'beat' }); continue; }
    if (TITLE_KEY.test(r) && !out.length) { while (i + 1 < rows.length && rows[i + 1].trim()) i++; continue; }
    if (isScreenCue(r) && String(rows[i + 1] || '').trim()) {
      const name = r.match(SCREEN_CUE)[1];
      const e = { kind: 'line', ...(resolveCue(name, characters, true) || { newName: titleCase(name) }), paren: '', text: '' };
      const speech = [];
      while (i + 1 < rows.length && rows[i + 1].trim()) {
        const t = rows[++i].trim();
        if (/^\(.*\)$/.test(t) && !speech.length) e.paren = [e.paren, t.slice(1, -1).trim()].filter(Boolean).join(', ');
        else speech.push(t);
      }
      e.text = speech.join(' ');
      out.push(e);
      continue;
    }
    if (HEADING.test(r) || (r === r.toUpperCase() && /:$/.test(r))) continue; // scene headings, transitions
    const para = [r];
    while (i + 1 < rows.length && rows[i + 1].trim() && !isScreenCue(rows[i + 1])) para.push(rows[++i].trim());
    out.push({ kind: 'action', text: para.join(' ') });
  }
  return out;
}

// ---------------------------------------------------------------------------
// Building the scene
// ---------------------------------------------------------------------------

export const speechLines = (scene) => (scene.beats || []).flatMap((b) => b.lines).filter((l) => l.kind !== 'action');

export function ensureCast(scene, characterId) {
  if (characterId && !scene.participants.some((x) => x.characterId === characterId)) {
    scene.participants.push({ characterId, intention: '', subIntention: '', tactic: '', antagonism: '' });
  }
}

// The first speaker in a beat acts, the first other one reacts; their tactics
// name the beat unless the writer already did.
export function fillBeat(beat, speaker, tactic = '') {
  if (!speaker) return;
  if (!beat.actor) beat.actor = speaker;
  else if (!beat.reactor && speaker !== beat.actor) beat.reactor = speaker;
  if (!tactic) return;
  if (beat.actor === speaker && !beat.action) beat.action = tactic;
  else if (beat.reactor === speaker && !beat.reaction) beat.reaction = tactic;
}

function openBeat(scene, at = scene.beats.length) {
  const b = newBeat({ ...scene, beats: scene.beats.slice(0, at) }, { actor: '', reactor: '' });
  scene.beats.splice(at, 0, b);
  return b;
}

// Adds parsed entries at the end of a scene. Unknown speakers become new
// characters; every speaker joins the scene's cast. `speaker` voices entries
// that name nobody. Returns { lines, created }.
export function addEntries(project, scene, entries, { speaker = '', newBeat: startBeat = false } = {}) {
  const created = [];
  const lines = [];
  const idFor = (e) => {
    if (e.id) return e.id;
    if (e.newName) {
      let c = findCharacter(project.characters, e.newName);
      if (!c) {
        c = newCharacter(project, e.newName);
        project.characters.push(c);
        created.push(c);
      }
      return c.id;
    }
    return speaker;
  };
  let beat = scene.beats[scene.beats.length - 1];
  if (!beat || (startBeat && beat.lines.length)) beat = openBeat(scene);
  for (const e of entries) {
    if (e.kind === 'beat') {
      if (beat.lines.length) beat = openBeat(scene);
      continue;
    }
    if (e.kind === 'action') {
      const l = newLine({ kind: 'action', text: e.text });
      beat.lines.push(l);
      lines.push(l);
      continue;
    }
    const who = idFor(e);
    ensureCast(scene, who);
    const l = newLine({ speaker: who, text: e.text, paren: e.paren || '', subtext: e.subtext || '', tactic: e.tactic || '' });
    beat.lines.push(l);
    fillBeat(beat, who, l.tactic);
    lines.push(l);
  }
  return { lines, created };
}

// Who most likely speaks next: in a duologue the other one; with more voices,
// whoever spoke before the current speaker (talk ping-pongs), else the next
// in the cast.
export function nextSpeaker(cast, scene, current) {
  if (!cast.length) return '';
  if (cast.length === 1) return cast[0];
  const spoken = speechLines(scene).map((l) => l.speaker).filter((id) => cast.includes(id));
  for (let k = spoken.length - 1; k >= 0; k--) if (spoken[k] !== current) return spoken[k];
  return cast[(cast.indexOf(current) + 1) % cast.length];
}

// The voice for a line inserted after `lineId`: whoever spoke before that
// line's speaker, else the next in the cast.
export function voiceAfter(cast, scene, lineId) {
  const all = (scene.beats || []).flatMap((b) => b.lines);
  const at = all.findIndex((l) => l.id === lineId);
  const speech = all.slice(0, at + 1).filter((l) => l.kind !== 'action' && l.speaker);
  const cur = speech[speech.length - 1]?.speaker || '';
  if (!cur) return cast[0] || '';
  if (cast.length < 2) return cur;
  for (let k = speech.length - 2; k >= 0; k--) if (speech[k].speaker !== cur && cast.includes(speech[k].speaker)) return speech[k].speaker;
  return cycleSpeaker(cast, cur, 1);
}

export function cycleSpeaker(cast, current, dir = 1) {
  if (!cast.length) return '';
  const i = cast.indexOf(current);
  return cast[(i + dir + cast.length) % cast.length] || cast[0];
}

export function insertLineAfter(scene, afterId, line) {
  const loc = locateLine(scene, afterId);
  if (!loc) return false;
  loc.beat.lines.splice(loc.lineIndex + 1, 0, line);
  return true;
}

export function removeLine(scene, id) {
  const loc = locateLine(scene, id);
  if (loc) loc.beat.lines.splice(loc.lineIndex, 1);
  return loc;
}

// One step up or down; at a beat's edge the line crosses into the next beat.
export function moveLine(scene, id, dir) {
  const loc = locateLine(scene, id);
  if (!loc) return false;
  const { beat, line, lineIndex: i, beatIndex: bi } = loc;
  const j = i + dir;
  if (j >= 0 && j < beat.lines.length) {
    [beat.lines[i], beat.lines[j]] = [beat.lines[j], beat.lines[i]];
    return true;
  }
  const other = scene.beats[bi + dir];
  if (!other) return false;
  beat.lines.splice(i, 1);
  if (dir < 0) other.lines.push(line);
  else other.lines.unshift(line);
  return true;
}

// A beat break before this line: it and the lines after it open a new beat.
export function splitBeatAt(scene, id) {
  const loc = locateLine(scene, id);
  if (!loc || loc.lineIndex === 0) return null;
  const moved = loc.beat.lines.splice(loc.lineIndex);
  const b = openBeat(scene, loc.beatIndex + 1);
  b.lines = moved;
  for (const l of moved) if (l.kind !== 'action') fillBeat(b, l.speaker, l.tactic);
  return b;
}

// Removes the break before beat `index`: its lines join the previous beat.
export function mergeBeatUp(scene, index) {
  if (index <= 0 || index >= scene.beats.length) return false;
  const [b] = scene.beats.splice(index, 1);
  scene.beats[index - 1].lines.push(...b.lines);
  return true;
}

// What a beat does, as named by the writer or by its lines' tactics.
export function beatGist(beat) {
  const speech = beat.lines.filter((l) => l.kind !== 'action');
  const tacticOf = (id) => speech.find((l) => l.speaker === id && l.tactic)?.tactic || '';
  return {
    actor: beat.actor,
    action: beat.action || tacticOf(beat.actor),
    reactor: beat.reactor,
    reaction: beat.reaction || tacticOf(beat.reactor),
  };
}
