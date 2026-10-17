// Script exporters: turn a scene's beats and lines into readable formats.
// Pure functions, shared by the browser and tests.

const upper = (s) => String(s || '').toUpperCase();

function speakerName(project, id) {
  const c = (project.characters || []).find((x) => x.id === id);
  return c ? c.name : 'UNKNOWN';
}

function allLines(scene) {
  return (scene.beats || []).flatMap((b) => b.lines || []);
}

export function toFountain(scene, project) {
  const out = [];
  if (project.title) out.push(`Title: ${project.title}`, '');
  out.push(upper(scene.heading || scene.title || 'INT. UNTITLED - DAY'), '');
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
  const out = [upper(scene.title || 'Scene'), ''];
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
  const out = [];
  if (scene.description) out.push(scene.description, '');
  for (const line of allLines(scene)) {
    const text = String(line.text || '').trim();
    if (!text) continue;
    if (line.kind === 'action') { out.push(text, ''); continue; }
    const name = speakerName(project, line.speaker);
    const ends = text.slice(-1);
    const verb = ends === '?' ? 'asked' : 'said';
    const body = /[.]$/.test(text) ? `${text.slice(0, -1)},` : text;
    const tag = line.paren ? `${name} ${verb}, ${String(line.paren).replace(/^\(|\)$/g, '')}.` : `${name} ${verb}.`;
    out.push(`“${body}” ${tag}`, '');
  }
  return out.join('\n').trim() + '\n';
}

// The annotated breakdown mirrors McKee's scene analyses: beats named with
// action/reaction gerunds, each line with its subtext and tactic.
export function toAnnotated(scene, project) {
  const out = [`# ${scene.title || 'Scene'}`, ''];
  if (scene.heading) out.push(`*${scene.heading}*`, '');
  const vals = (scene.values || []).map((v) => `${v.positive}/${v.negative} (opens ${v.opening ?? 0})`).join(' · ');
  if (vals) out.push(`**Values at stake:** ${vals}`, '');
  if (scene.thirdThing) out.push(`**Third thing:** ${scene.thirdThing}`, '');
  for (const p of scene.participants || []) {
    out.push(`- **${speakerName(project, p.characterId)}**: wants *${p.intention || '?'}*${p.subIntention ? `; really wants *${p.subIntention}*` : ''}`);
  }
  out.push('');
  (scene.beats || []).forEach((b, i) => {
    const act = b.action ? `${speakerName(project, b.actor)} ${b.action}` : '';
    const rea = b.reaction ? `${speakerName(project, b.reactor)} ${b.reaction}` : '';
    out.push(`## Beat ${i + 1}`);
    if (act || rea) out.push(`ACTION: ${act || '?'}  `, `REACTION: ${rea || '?'}`);
    const charges = (scene.values || []).map((v) => (b.charges && b.charges[v.id] != null ? `${v.positive}/${v.negative}: ${b.charges[v.id]}` : null)).filter(Boolean);
    if (charges.length) out.push(`*Charge after beat: ${charges.join(', ')}*`);
    out.push('');
    for (const line of b.lines || []) {
      if (!String(line.text || '').trim()) continue;
      if (line.kind === 'action') { out.push(`*${line.text}*`, ''); continue; }
      const paren = line.paren ? ` *(${String(line.paren).replace(/^\(|\)$/g, '')})*` : '';
      out.push(`**${upper(speakerName(project, line.speaker))}**${paren}: ${line.text}`);
      const notes = [line.tactic && `action: ${line.tactic}`, line.subtext && `subtext: ${line.subtext}`].filter(Boolean);
      if (notes.length) out.push(`> ${notes.join(' · ')}`);
      out.push('');
    }
  });
  return out.join('\n').trim() + '\n';
}

export const FORMATS = {
  fountain: { name: 'Screenplay (Fountain)', ext: 'fountain', fn: toFountain },
  stage: { name: 'Stage play', ext: 'txt', fn: toStage },
  prose: { name: 'Prose draft', ext: 'txt', fn: toProse },
  annotated: { name: 'Annotated breakdown (beats + subtext)', ext: 'md', fn: toAnnotated },
};
