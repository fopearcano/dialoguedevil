import { html, useEffect, useState } from '../lib.js';
import { state, openProject, createAndOpen, refreshProjects, navigate } from '../store.js';
import { Modal, Icon } from '../components/ui.js';

export function ProjectsModal({ open, onClose }) {
  const [title, setTitle] = useState('');
  useEffect(() => { if (open) refreshProjects(); }, [open]);
  const pick = async (id) => { await openProject(id); navigate('story'); onClose(); };
  return html`<${Modal} open=${open} title="Projects" onClose=${onClose}>
    <ul class="project-list">
      ${state.projects.map((p) => html`<li>
        <button type="button" class=${p.id === state.project?.id ? 'project-row active' : 'project-row'} onClick=${() => pick(p.id)}>
          <strong>${p.title}</strong>
          <span class="small muted">${p.characters} characters · ${p.scenes} scenes · ${(p.medium || '').toUpperCase()} · ${p.updatedAt ? new Date(p.updatedAt).toLocaleString() : ''}</span>
          ${p.logline ? html`<span class="small">${p.logline}</span>` : ''}
        </button>
      </li>`)}
    </ul>
    <form class="new-project" onSubmit=${async (e) => { e.preventDefault(); await createAndOpen({ title: title.trim() || 'Untitled story' }); setTitle(''); onClose(); }}>
      <input class="input" value=${title} placeholder="New project title" onInput=${(e) => setTitle(e.currentTarget.value)} />
      <button type="submit" class="btn btn-primary"><${Icon} name="plus" /> Create</button>
      <button type="button" class="btn btn-quiet" onClick=${async () => { await createAndOpen({ sample: true }); onClose(); }}>Copy the sample</button>
    </form>
  </${Modal}>`;
}
