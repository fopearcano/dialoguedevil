// Script exporters: turn a scene's beats and lines into readable formats.
// Pure functions, shared by the browser and tests. The script is written in
// the project's dialogue language (project.lang), whatever the interface.

import { trl } from './i18n.js';

const upper = (s) => String(s || '').toUpperCase();

function speakerName(project, id) {
  const c = (project.characters || []).find((x) => x.id === id);
  return c ? c.name : trl(project.lang, 'UNKNOWN');
}

function allLines(scene) {
  return (scene.beats || []).flatMap((b) => b.lines || []);
}

export function toFountain(scene, project) {
  const out = [];
  if (project.title) out.push(`Title: ${project.title}`, '');
  out.push(upper(scene.heading || scene.title || trl(project.lang, 'INT. UNTITLED - DAY')), '');
  if (scene.description) out.push(scene.description, '');
  for (const line of allLines(scene)) {
    if (!String(line.text || '').trim()) continue;
    if (line.kind === 'action') { out.push(line.text, ''); continue; }
    out.push(upper(speakerName(project, line.speaker)));
    if (line.paren) out.push(`(${String(line.paren).replace(/^\(|\)$/g, '')})`);
    out.push(line.text, '');
  }
  return out.join('\n').trim() + '\n';
}

export function toStage(scene, project) {
  const out = [upper(scene.title || trl(project.lang, 'Scene')), ''];
  if (scene.heading || scene.description) out.push(`(${[scene.heading, scene.description].filter(Boolean).join('. ')})`, '');
  for (const line of allLines(scene)) {
    if (!String(line.text || '').trim()) continue;
    if (line.kind === 'action') { out.push(`(${line.text})`, ''); continue; }
    const paren = line.paren ? ` (${String(line.paren).replace(/^\(|\)$/g, '')})` : '';
    out.push(`${upper(speakerName(project, line.speaker))}.${paren} ${line.text}`, '');
  }
  return out.join('\n').trim() + '\n';
}

export function toProse(scene, project) {
  const it = project.lang === 'it';
  const [open, close] = it ? ['«', '»'] : ['“', '”'];
  const out = [];
  if (scene.description) out.push(scene.description, '');
  for (const line of allLines(scene)) {
    const text = String(line.text || '').trim();
    if (!text) continue;
    if (line.kind === 'action') { out.push(text, ''); continue; }
    const name = speakerName(project, line.speaker);
    const verb = text.slice(-1) === '?' ? trl(project.lang, 'asked') : trl(project.lang, 'said');
    // English closes the quote with a comma; Italian drops the full stop.
    const body = /[.]$/.test(text) ? `${text.slice(0, -1)}${it ? '' : ','}` : text;
    const paren = line.paren ? String(line.paren).replace(/^\(|\)$/g, '') : '';
    const tag = it ? `${verb} ${name}${paren ? `, ${paren}` : ''}.` : `${name} ${verb}${paren ? `, ${paren}` : ''}.`;
    out.push(`${open}${body}${close} ${tag}`, '');
  }
  return out.join('\n').trim() + '\n';
}

// The annotated breakdown mirrors McKee's scene analyses: beats named with
// action/reaction gerunds, each line with its subtext and tactic.
export function toAnnotated(scene, project) {
  const L = project.lang;
  const out = [`# ${scene.title || trl(L, 'Scene')}`, ''];
  if (scene.heading) out.push(`*${scene.heading}*`, '');
  const vals = (scene.values || []).map((v) => trl(L, '{value} (opens {n})', { value: `${v.positive}/${v.negative}`, n: v.opening ?? 0 })).join(' · ');
  if (vals) out.push(`**${trl(L, 'Values at stake:')}** ${vals}`, '');
  if (scene.thirdThing) out.push(`**${trl(L, 'Third thing:')}** ${scene.thirdThing}`, '');
  for (const p of scene.participants || []) {
    out.push(`- **${speakerName(project, p.characterId)}**: ${trl(L, 'wants')} *${p.intention || '?'}*${p.subIntention ? `; ${trl(L, 'really wants')} *${p.subIntention}*` : ''}`);
  }
  out.push('');
  (scene.beats || []).forEach((b, i) => {
    const act = b.action ? `${speakerName(project, b.actor)} ${b.action}` : '';
    const rea = b.reaction ? `${speakerName(project, b.reactor)} ${b.reaction}` : '';
    out.push(`## ${trl(L, 'Beat {n}', { n: i + 1 })}`);
    if (act || rea) out.push(`${trl(L, 'ACTION')}: ${act || '?'}  `, `${trl(L, 'REACTION')}: ${rea || '?'}`);
    const charges = (scene.values || []).map((v) => (b.charges && b.charges[v.id] != null ? `${v.positive}/${v.negative}: ${b.charges[v.id]}` : null)).filter(Boolean);
    if (charges.length) out.push(`*${trl(L, 'Charge after beat: {list}', { list: charges.join(', ') })}*`);
    out.push('');
    for (const line of b.lines || []) {
      if (!String(line.text || '').trim()) continue;
      if (line.kind === 'action') { out.push(`*${line.text}*`, ''); continue; }
      const paren = line.paren ? ` *(${String(line.paren).replace(/^\(|\)$/g, '')})*` : '';
      out.push(`**${upper(speakerName(project, line.speaker))}**${paren}: ${line.text}`);
      const notes = [line.tactic && `${trl(L, 'action:')} ${line.tactic}`, line.subtext && `${trl(L, 'subtext:')} ${line.subtext}`].filter(Boolean);
      if (notes.length) out.push(`> ${notes.join(' · ')}`);
      out.push('');
    }
  });
  return out.join('\n').trim() + '\n';
}

// Format names are English keys; the view translates them.
export const FORMATS = {
  fountain: { name: 'Screenplay (Fountain)', ext: 'fountain', fn: toFountain },
  stage: { name: 'Stage play', ext: 'txt', fn: toStage },
  prose: { name: 'Prose draft', ext: 'txt', fn: toProse },
  annotated: { name: 'Annotated breakdown (beats + subtext)', ext: 'md', fn: toAnnotated },
};
