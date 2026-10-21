import { html, useEffect, useState } from '../lib.js';
import { state, openProject, createAndOpen, refreshProjects, navigate } from '../store.js';
import { Modal, Icon } from '../components/ui.js';
import { tr, trn, fmtDateTime } from '../i18n.js';
import { mediumName } from '../mckee.js';

export function ProjectsModal({ open, onClose }) {
  const [title, setTitle] = useState('');
  useEffect(() => { if (open) refreshProjects(); }, [open]);
  const pick = async (id) => { await openProject(id); navigate('write'); onClose(); };
  return html`<${Modal} open=${open} title=${tr('Projects')} onClose=${onClose}>
    <ul class="project-list">
      ${state.projects.map((p) => html`<li>
        <button type="button" class=${p.id === state.project?.id ? 'project-row active' : 'project-row'} onClick=${() => pick(p.id)}>
          <strong>${p.title}</strong>
          <span class="small muted">${trn(p.characters, '{n} character', '{n} characters')} · ${trn(p.scenes, '{n} scene', '{n} scenes')} · ${mediumName(p.medium).toUpperCase()} · ${(p.lang || 'en').toUpperCase()} · ${p.updatedAt ? fmtDateTime(p.updatedAt) : ''}</span>
          ${p.logline ? html`<span class="small">${p.logline}</span>` : ''}
        </button>
      </li>`)}
    </ul>
    <form class="new-project" onSubmit=${async (e) => { e.preventDefault(); await createAndOpen({ title: title.trim() || tr('Untitled story') }); setTitle(''); onClose(); }}>
      <input class="input" value=${title} placeholder=${tr('New project title')} onInput=${(e) => setTitle(e.currentTarget.value)} />
      <button type="submit" class="btn btn-primary"><${Icon} name="plus" /> ${tr('Create')}</button>
      <button type="button" class="btn btn-quiet" onClick=${async () => { await createAndOpen({ sample: true }); onClose(); }}>${tr('Copy the sample')}</button>
    </form>
  </${Modal}>`;
}
