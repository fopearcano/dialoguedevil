// Keyboard shortcuts and typing helpers. One list feeds the shortcuts
// overlay (?), the help guide and the README, so they can't drift apart.
// Single-letter keys work outside text boxes; inside them only chords the
// browsers leave free (Alt+Enter, Ctrl+Enter, Alt+digits, arrows).
// Pure module: shared by the browser and the tests.

import { N_, tr } from './i18n.js';

// A combo is "Ctrl+Enter" (keys held together) or "g w" (one after the
// other); `keys` lists alternatives.
export const SHORTCUTS = [
  {
    id: 'anywhere',
    title: N_('Anywhere (outside a text box)'),
    items: [
      { keys: ['?', 'Ctrl+/'], label: N_('Show the keyboard shortcuts (Ctrl+/ works inside text boxes too)') },
      { keys: ['/'], label: N_('Jump to the writing box') },
      { keys: ['n'], label: N_('New dialogue') },
      { keys: ['[', ']'], label: N_('Previous / next dialogue') },
      { keys: ['g w'], label: N_('Go to Write') },
      { keys: ['g s'], label: N_('Go to the story') },
      { keys: ['g h'], label: N_('Go to the handbook') },
      { keys: ['g ,'], label: N_('Go to settings') },
      { keys: ['s'], label: N_('Show or hide the subtext under the lines') },
      { keys: ['q'], label: N_('Show or hide the checks in the margin') },
      { keys: ['l'], label: N_('Show or hide the McKee lens') },
      { keys: ['z'], label: N_('Focus mode: only the page and the writing box') },
      { keys: ['a'], label: N_('Open or close the Devil\'s Advocate') },
      { keys: ['r'], label: N_('Read the scene aloud, or stop') },
      { keys: ['Ctrl+Z', 'Ctrl+Shift+Z'], label: N_('Undo / redo') },
    ],
  },
  {
    id: 'composer',
    title: N_('In the writing box'),
    items: [
      { keys: ['Enter'], label: N_('Add the line; the turn passes to the next voice') },
      { keys: ['Alt+Enter'], label: N_('Add the line; the same voice goes on') },
      { keys: ['Ctrl+Enter'], label: N_('Add the line as the start of a new beat') },
      { keys: ['Shift+Enter'], label: N_('New line inside the speech') },
      { keys: ['Tab', 'Shift+Tab'], label: N_('Empty box: next / previous voice. With words typed: go under the line (subtext, then action)') },
      { keys: ['Alt+1…9'], label: N_('Pick a voice') },
      { keys: ['Alt+0'], label: N_('Write an action: stage direction, gesture, silence') },
      { keys: ['↑'], label: N_('From the start of the box: edit the last line') },
      { keys: ['Esc'], label: N_('Leave the box (then Tab moves on)') },
    ],
  },
  {
    id: 'line',
    title: N_('On a line of the script'),
    items: [
      { keys: ['Enter'], label: N_('New line after it, for the next voice') },
      { keys: ['Alt+Enter'], label: N_('New line after it, for the same voice') },
      { keys: ['Ctrl+Enter'], label: N_('Start a new beat at this line') },
      { keys: ['↑', '↓'], label: N_('At the start / end of the line: go to the line above / below') },
      { keys: ['Alt+↑', 'Alt+↓'], label: N_('Move the line up / down, across beat breaks too') },
      { keys: ['Alt+1…9'], label: N_('Give the line to another voice') },
      { keys: ['Alt+0'], label: N_('Turn it into an action, or back into speech') },
      { keys: ['Tab'], label: N_('Go under the line: subtext, then action') },
      { keys: ['Backspace'], label: N_('On an empty line: delete it') },
      { keys: ['Esc'], label: N_('Leave the line') },
    ],
  },
  {
    id: 'read',
    title: N_('During a table read'),
    items: [
      { keys: ['F'], label: N_('Flag the line being read, by ear') },
      { keys: ['Esc'], label: N_('Stop reading') },
    ],
  },
];

// What you can type in the writing box, and what it becomes.
export const QUICK_SYNTAX = [
  { type: N_('NAME: line'), result: N_('the line, spoken by NAME; a new name in capitals creates the character') },
  { type: N_('(softly) line'), result: N_('paralanguage, in its own place') },
  { type: N_('[She leaves.]'), result: N_('an action: stage direction, gesture, silence') },
  { type: '---', result: N_('a beat break') },
  { type: '--', result: N_('an em dash (—): a line cut off or interrupted') },
  { type: '...', result: N_('an ellipsis (…): a line trailing away') },
];

export const isMac = () => typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent || '');

// A key as printed on the keyboard, in the interface language.
export function keyLabel(k, mac = isMac()) {
  const names = {
    Ctrl: mac ? '⌘' : 'Ctrl',
    Alt: mac ? '⌥' : 'Alt',
    Shift: tr('Shift'),
    Enter: tr('Enter'),
    Backspace: '⌫',
  };
  return names[k] ?? k;
}

// "Ctrl+Shift+Z" → [["Ctrl","Shift","Z"]]; "g w" → [["g"],["w"]].
export const comboParts = (combo) => combo.split(' ').map((step) => (step === '+' ? ['+'] : step.split('+')));

// "--" becomes an em dash and "..." an ellipsis; a lone "---" (a beat
// break) and longer runs of hyphens are left alone.
export function smartPunctuation(text) {
  const s = String(text ?? '');
  if (/^\s*-{3,}\s*$/.test(s)) return s;
  return s.replace(/(^|[^-])--(?!-)/g, '$1—').replace(/\.{3}/g, '…');
}

// Typing into a field, where single-letter shortcuts must not fire.
export function isTyping(el) {
  if (!el) return false;
  const tag = (el.tagName || '').toLowerCase();
  return tag === 'input' || tag === 'textarea' || tag === 'select' || el.isContentEditable === true;
}
