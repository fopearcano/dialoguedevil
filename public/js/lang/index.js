// Language packs for the dialogue analysis, by dialogue language. A
// project's lines are analyzed in the project's language, whatever the
// interface language is.

import EN from './en.js';
import IT from './it.js';

const PACKS = { en: EN, it: IT };

export const packFor = (lang) => PACKS[lang] || EN;
