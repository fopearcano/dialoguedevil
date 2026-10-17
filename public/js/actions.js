// Project-level actions shared by several views.

import { act as mutate, navigate } from './store.js';
import { newCharacter, newScene } from './model.js';

export function addCharacter(name) {
  let id;
  mutate((p) => {
    const c = newCharacter(p, name || `Character ${p.characters.length + 1}`);
    id = c.id;
    p.characters.push(c);
  });
  navigate(`character/${id}`);
  return id;
}

export function addScene(title) {
  let id;
  mutate((p) => {
    const s = newScene(p, title || `Scene ${p.scenes.length + 1}`);
    id = s.id;
    p.scenes.push(s);
  });
  navigate(`scene/${id}/design`);
  return id;
}

export function deleteCharacter(id) {
  mutate((p) => {
    p.characters = p.characters.filter((c) => c.id !== id);
    for (const s of p.scenes) {
      s.participants = s.participants.filter((x) => x.characterId !== id);
      for (const b of s.beats) {
        if (b.actor === id) b.actor = '';
        if (b.reactor === id) b.reactor = '';
        for (const l of b.lines) if (l.speaker === id) l.speaker = '';
      }
    }
    for (const c of p.characters) for (const r of c.relationships) if (r.targetId === id) r.targetId = '';
  });
  navigate('story');
}

export function deleteScene(id) {
  mutate((p) => { p.scenes = p.scenes.filter((s) => s.id !== id); });
  navigate('story');
}
