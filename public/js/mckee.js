// The McKee knowledge base in the interface language. kb/en.js and kb/it.js
// hold the same entries with the same ids; these exports are live bindings,
// so after useKb('it') every module that imported them reads Italian. The
// server, which answers several languages at once, uses kbFor(lang).

import * as EN from './kb/en.js';
import * as IT from './kb/it.js';

const KBS = { en: EN, it: IT };

export const kbFor = (lang) => KBS[lang] || EN;

export let BOOK = EN.BOOK;
export let CHAPTERS = EN.CHAPTERS;
export let cite = EN.cite;
export let shortCite = EN.shortCite;
export let DEFINITION = EN.DEFINITION;
export let THREE_TRACKS = EN.THREE_TRACKS;
export let DIALOGUE_MODES = EN.DIALOGUE_MODES;
export let MEDIA = EN.MEDIA;
export let THREE_FUNCTIONS = EN.THREE_FUNCTIONS;
export let SPHERES = EN.SPHERES;
export let CONFLICT_LEVELS = EN.CONFLICT_LEVELS;
export let CONFLICT_RULE = EN.CONFLICT_RULE;
export let SIX_TASKS = EN.SIX_TASKS;
export let LINE_DESIGNS = EN.LINE_DESIGNS;
export let TECHNIQUES = EN.TECHNIQUES;
export let DESIRE_COMPLEX = EN.DESIRE_COMPLEX;
export let FIVE_STEPS = EN.FIVE_STEPS;
export let STORY_VALUES = EN.STORY_VALUES;
export let TURNING_POINT_TYPES = EN.TURNING_POINT_TYPES;
export let BEAT_DEFINITION = EN.BEAT_DEFINITION;
export let CONTEXT_CULTURE = EN.CONTEXT_CULTURE;
export let CONFLICT_TYPES = EN.CONFLICT_TYPES;
export let FLAWS = EN.FLAWS;
export let WORD_CHOICE_OBSERVATIONS = EN.WORD_CHOICE_OBSERVATIONS;
export let PREFERENCES = EN.PREFERENCES;
export let CHARACTER_SPECIFIC = EN.CHARACTER_SPECIFIC;
export let MODALITIES = EN.MODALITIES;
export let MENTALITIES = EN.MENTALITIES;
export let VOICE_DIMENSIONS = EN.VOICE_DIMENSIONS;
export let SUBTEXT_DIMENSION = EN.SUBTEXT_DIMENSION;
export let CHARACTER_SECTIONS = EN.CHARACTER_SECTIONS;
export let INTERVIEW = EN.INTERVIEW;
export let VOICE_EXERCISES = EN.VOICE_EXERCISES;
export let TACTICS = EN.TACTICS;
export let ALL_TACTICS = EN.ALL_TACTICS;
export let KEY_QUESTIONS = EN.KEY_QUESTIONS;
export let MASTERING = EN.MASTERING;
export let AXIOMS = EN.AXIOMS;

// Flaw ids are the same in every language.
export const REVIEWABLE_FLAWS = EN.REVIEWABLE_FLAWS;

// A medium id ('screen') as shown in the interface language.
export const mediumName = (id) => MEDIA.find((m) => m.id === id)?.name || id || '';

export function useKb(lang) {
  const k = kbFor(lang);
  ({
    BOOK, CHAPTERS, cite, shortCite, DEFINITION, THREE_TRACKS, DIALOGUE_MODES, MEDIA, THREE_FUNCTIONS, SPHERES,
    CONFLICT_LEVELS, CONFLICT_RULE, SIX_TASKS, LINE_DESIGNS, TECHNIQUES, DESIRE_COMPLEX, FIVE_STEPS, STORY_VALUES,
    TURNING_POINT_TYPES, BEAT_DEFINITION, CONTEXT_CULTURE, CONFLICT_TYPES, FLAWS, WORD_CHOICE_OBSERVATIONS,
    PREFERENCES, CHARACTER_SPECIFIC, MODALITIES, MENTALITIES, VOICE_DIMENSIONS, SUBTEXT_DIMENSION,
    CHARACTER_SECTIONS, INTERVIEW, VOICE_EXERCISES, TACTICS, ALL_TACTICS, KEY_QUESTIONS, MASTERING, AXIOMS,
  } = k);
}
