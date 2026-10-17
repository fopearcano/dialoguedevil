import { html, useState, useEffect, useRef, cx, charColor, miniMarkdown } from '../lib.js';
import { state, mutate, act, navigate, aiAvailable, setSetting } from '../store.js';
import { Tabs, Cite, CharSelect, TextArea, Icon, Meter, CharDot } from '../components/ui.js';
import { INTERVIEW, CHARACTER_SECTIONS, VOICE_DIMENSIONS, VOICE_EXERCISES, MODALITIES, cite } from '../mckee.js';
import { getPath, setPath, uid, characterById, sceneById, newBeat, newLine, locateLine } from '../model.js';
import { analyzeScene } from '../analysis.js';
import { streamChat } from '../api.js';

const TAB_DEFS = {
  interview: { label: 'Interview', ai: false },
  coach: { label: 'Coach', ai: true },
  rehearse: { label: 'Rehearse', ai: true },
  doctor: { label: 'Doctor', ai: true },
  beats: { label: 'Beats', ai: true },
  lab: { label: 'Line lab', ai: true },
};

function tabsForRoute(route) {
  if (route.name === 'scene') return ['rehearse', 'doctor', 'beats', 'lab', 'interview'];
  return ['interview', 'coach', 'rehearse'];
}

export function AssistantDrawer() {
  const route = state.route;
  const tabs = tabsForRoute(route);
  const [tab, setTab] = useState(tabs[0]);
  const req = state.drawer;
  useEffect(() => { if (req.tab && TAB_DEFS[req.tab]) setTab(req.tab); }, [req.tab, req.request?.at]);
  useEffect(() => { if (!tabs.includes(tab)) setTab(tabs[0]); }, [route.name]);
  const active = tabs.includes(tab) ? tab : tabs[0];
  return html`<aside class="drawer" aria-label="Devil's Advocate">
    <header class="drawer-head">
      <div class="drawer-title"><${Icon} name="flame" /> Devil's Advocate</div>
      <button type="button" class="icon-btn" aria-label="Close panel" onClick=${() => setSetting('drawerOpen', false)}><${Icon} name="close" /></button>
    </header>
    <${Tabs} small tabs=${tabs.map((t) => ({ id: t, label: TAB_DEFS[t].label }))} active=${active} onChange=${setTab} />
    <div class="drawer-body">
      ${active === 'interview' ? html`<${Interview} />` : html`<${AiPanel} key=${active} mode=${active} />`}
    </div>
  </aside>`;
}

// ---------------------------------------------------------------------------
// Offline interviewer (no AI needed): McKee's questions fill the profile.
// ---------------------------------------------------------------------------

function useTargetCharacter() {
  const p = state.project;
  const r = state.route;
  const [picked, setPicked] = useState('');
  let id = picked;
  if (!id && r.name === 'character') id = r.id;
  if (!id && r.name === 'scene') id = sceneById(p, r.id)?.participants[0]?.characterId;
  if (!id) id = p.characters[0]?.id;
  useEffect(() => { if (r.name === 'character') setPicked(''); }, [r.id]);
  return [characterById(p, id), setPicked];
}

const isEmpty = (v) => (Array.isArray(v) ? v.length === 0 : v == null || String(v).trim() === '');

function Interview() {
  const p = state.project;
  const [c, setC] = useTargetCharacter();
  const [revisit, setRevisit] = useState(false);
  const [answer, setAnswer] = useState('');
  const [skipped, setSkipped] = useState([]);
  const [log, setLog] = useState([]);
  const scroller = useRef(null);
  useEffect(() => { setSkipped([]); setLog([]); }, [c?.id]);
  useEffect(() => { scroller.current?.scrollTo(0, scroller.current.scrollHeight); }, [log.length, c?.id]);
  if (!c) return html`<div class="drawer-empty">Add a character to start the interview.</div>`;
  const queue = INTERVIEW.filter((q) => (revisit || isEmpty(getPath(c, q.path))) && !skipped.includes(q.id));
  const q = queue[0];
  const answered = INTERVIEW.filter((x) => !isEmpty(getPath(c, x.path))).length;
  const ask = (text) => text.replace(/\{name\}/g, c.name);
  const save = () => {
    if (!q || !answer.trim()) return;
    const raw = answer.trim();
    mutate(() => {
      let value = raw;
      if (q.list) value = [...new Set([...(getPath(c, q.path) || []), ...raw.split(',').map((s) => s.trim()).filter(Boolean)])];
      if (q.choice) value = q.choice.find((ch) => raw.toLowerCase().includes(ch)) || '';
      setPath(c, q.path, value);
      for (const arr of [c.secrets, c.facts]) arr.forEach((x) => { if (!x.id) x.id = uid('item'); });
    });
    setLog([...log, { q: ask(q.ask), a: raw, ch: q.ch }]);
    setAnswer('');
    if (revisit) setSkipped([...skipped, q.id]);
  };
  return html`<div class="interview">
    <div class="drawer-ctx">
      <span class="small muted">Interviewing</span>
      <${CharSelect} project=${p} value=${c.id} onChange=${setC} />
      <label class="toggle small"><input type="checkbox" checked=${revisit} onChange=${(e) => { setRevisit(e.currentTarget.checked); setSkipped([]); }} /> revisit answered</label>
    </div>
    <${Meter} label="Interview progress" value=${(answered / INTERVIEW.length) * 100} />
    <div class="chat-log" ref=${scroller}>
      <div class="bubble bot"><p>No AI needed here. I'll ask McKee's questions from the mask inward to the unsayable, then the voice. Each answer goes straight into ${c.name}'s profile. Skip anything; come back any time.</p></div>
      ${log.map((m) => html`<div class="bubble bot"><p>${m.q}</p><${Cite} ch=${m.ch} /></div><div class="bubble user"><p>${m.a}</p></div>`)}
      ${q ? html`<div class="bubble bot current"><p>${ask(q.ask)}</p><span class="small muted">${cite(q.ch)}</span>
        ${q.list ? html`<p class="small muted">Separate items with commas.</p>` : ''}
        ${q.choice ? html`<div class="chip-row">${MODALITIES.map((m) => html`<button type="button" class="chip-btn" onClick=${() => setAnswer(m.id)}>${m.name}</button>`)}</div>` : ''}
        ${revisit && !isEmpty(getPath(c, q.path)) ? html`<p class="small"><span class="muted">Current:</span> ${String(getPath(c, q.path))}</p>` : ''}
      </div>` : html`<div class="bubble bot"><p>That's every question for ${c.name}. ${answered < INTERVIEW.length ? 'Some were skipped; tick “revisit answered” or clear the skip list to return to them.' : 'The profile is deep. Now put them under pressure in a scene.'}</p>
        ${skipped.length ? html`<button type="button" class="link-btn" onClick=${() => setSkipped([])}>Return to skipped questions</button>` : ''}</div>`}
    </div>
    ${q ? html`<div class="chat-input">
      <${TextArea} value=${answer} onInput=${setAnswer} placeholder="Answer as the author, or in character…" rows=${2}
        onKeyDown=${(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); save(); } }} />
      <div class="chat-input-actions">
        <button type="button" class="btn btn-quiet" onClick=${() => { setSkipped([...skipped, q.id]); setAnswer(''); }}>Skip</button>
        <button type="button" class="btn btn-primary" disabled=${!answer.trim()} onClick=${save}>Answer</button>
      </div>
    </div>` : ''}
  </div>`;
}

// ---------------------------------------------------------------------------
// AI panel (optional): coach, rehearse, doctor, beats, line lab.
// ---------------------------------------------------------------------------

function briefChar(c) {
  return c ? { id: c.id, name: c.name, role: c.role, logline: c.logline } : null;
}

function fullChar(c) {
  if (!c) return null;
  const { notes, ...rest } = c;
  return rest;
}

function sceneForAI(s, p) {
  if (!s) return null;
  const name = (id) => characterById(p, id)?.name || '';
  return {
    id: s.id, title: s.title, heading: s.heading, description: s.description, medium: s.medium || p.medium,
    track: s.track, mode: s.mode, conflictType: s.conflictType, thirdThing: s.thirdThing,
    participants: s.participants.map((x) => ({ ...x, name: name(x.characterId) })),
    driver: name(s.driver), values: s.values, exposition: s.exposition, turningPoint: s.turningPoint,
    beats: s.beats.map((b, i) => ({
      beat: i + 1, actor_id: b.actor, actor: name(b.actor), action: b.action, reactor_id: b.reactor, reactor: name(b.reactor), reaction: b.reaction,
      charges: b.charges, intensity: b.intensity,
      lines: b.lines.map((l) => ({ id: l.id, kind: l.kind, speaker_id: l.speaker, speaker: name(l.speaker), text: l.text, paren: l.paren, subtext: l.subtext, tactic: l.tactic })),
    })),
  };
}

function projectMeta(p) {
  return { title: p.title, logline: p.logline, medium: p.medium, genre: p.genre, vision: p.genreMode, coreValue: p.coreValue, incitingIncident: p.incitingIncident, mdq: p.mdq };
}

function chatKey(mode, ctx) {
  if (mode === 'coach') return `coach:${ctx.character?.id || ''}`;
  if (mode === 'rehearse') return `rehearse:${ctx.scene?.id || 'free'}:${ctx.character?.id || ''}`;
  return `${mode}:${ctx.scene?.id || ''}`;
}

function toApiMessages(msgs, p) {
  return msgs.filter((m) => !m.error).map((m) => {
    if (m.role === 'user') return { role: 'user', content: m.text };
    const parts = [];
    if (m.text) parts.push(m.text);
    for (const pr of m.proposals || []) {
      if (pr.tool === 'speak_in_character') {
        const sp = pr.input;
        parts.push(`${sp.paralanguage ? `(${sp.paralanguage}) ` : ''}${sp.text}\n[subtext: ${sp.subtext}; action: ${sp.tactic}]`);
      } else parts.push(`[Earlier proposal via ${pr.tool}: ${JSON.stringify(pr.input).slice(0, 1500)}]`);
    }
    return { role: 'assistant', content: parts.join('\n\n') || '(no reply)' };
  }).filter((m) => m.content);
}

function AiPanel({ mode }) {
  const p = state.project;
  const r = state.route;
  const scene = r.name === 'scene' ? sceneById(p, r.id) : null;
  const [c, setC] = useTargetCharacter();
  const [partnerId, setPartnerId] = useState('');
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [live, setLive] = useState(null);
  const abortRef = useRef(null);
  const scroller = useRef(null);
  const req = state.drawer.request;
  const partner = characterById(p, partnerId)
    || characterById(p, scene?.participants.find((x) => x.characterId && x.characterId !== c?.id)?.characterId)
    || p.characters.find((x) => x.id !== c?.id);
  const ctxBase = { character: c, scene };
  const key = chatKey(mode, ctxBase);
  const messages = p.chats[key] || [];
  const targetLine = mode === 'lab' && req?.lineId && scene ? locateLine(scene, req.lineId) : null;

  useEffect(() => { scroller.current?.scrollTo(0, scroller.current.scrollHeight); }, [messages.length, live?.text?.length, live?.proposals?.length]);
  useEffect(() => () => abortRef.current?.abort(), []);
  // A line-lab request from the workshop runs immediately.
  useEffect(() => {
    if (mode === 'lab' && req?.mode === 'alternatives' && req.lineId && aiAvailable() && !busy) {
      const loc = scene && locateLine(scene, req.lineId);
      if (loc) send(`Give me five alternatives for line ${req.lineId}: “${loc.line.text}”`, { targetLineId: req.lineId });
    }
  }, [req?.at]);

  if (!aiAvailable()) {
    return html`<div class="ai-off">
      <p><strong>AI is optional.</strong> Everything else in Dialogue Devil works without it, including the McKee interviewer in the Interview tab.</p>
      <p>To enable the ${TAB_DEFS[mode].label.toLowerCase()} mode, add an Anthropic API key in Settings (kept in this browser), or start the server with <code>ANTHROPIC_API_KEY</code> set.</p>
      <button type="button" class="btn btn-primary" onClick=${() => navigate('settings')}>Open Settings</button>
    </div>`;
  }

  const setMessages = (fn) => mutate((proj) => {
    const cur = proj.chats[key] || [];
    proj.chats[key] = fn(cur).slice(-60);
  });

  function buildContext(extraMeta = {}) {
    const meta = { mode, characterId: c?.id, characterName: c?.name, partnerName: partner?.name, sceneId: scene?.id, ...extraMeta };
    const data = { project: projectMeta(p) };
    if (mode === 'coach') {
      data.character = fullChar(c);
      data.otherCharacters = p.characters.filter((x) => x.id !== c?.id).map(briefChar);
      data.scenesWithCharacter = p.scenes.filter((s) => s.participants.some((x) => x.characterId === c?.id)).map((s) => ({ title: s.title, intention: s.participants.find((x) => x.characterId === c?.id)?.intention }));
      data.emptyFields = CHARACTER_SECTIONS.flatMap((s) => s.fields).filter((f) => isEmpty(getPath(c, f.path))).map((f) => f.path);
    } else if (mode === 'rehearse') {
      data.character = fullChar(c);
      data.partner = partner ? { ...briefChar(partner), voice: { dialect: partner.voice.dialect } } : null;
      data.scene = scene ? { ...sceneForAI(scene, p), beats: sceneForAI(scene, p).beats.slice(-6) } : null;
      data.myIntention = scene?.participants.find((x) => x.characterId === c?.id) || null;
    } else {
      data.scene = sceneForAI(scene, p);
      data.characters = (scene?.participants || []).map((x) => fullChar(characterById(p, x.characterId))).filter(Boolean);
      if (mode === 'doctor' && scene) {
        const a = analyzeScene(scene, p);
        data.analyzer = {
          sceneFindings: a.scene.map((f) => `${f.severity}: ${f.name}: ${f.message}`),
          lineFindings: Object.fromEntries(Object.entries(a.lines).map(([id, fs]) => [id, fs.filter((f) => f.severity !== 'good' && f.flaw !== 'noSubtext').map((f) => f.name)]).filter(([, v]) => v.length)),
          sixTasks: a.tasks, turningPoint: a.turningPoint,
        };
      }
    }
    return { meta, data };
  }

  async function send(text, extraMeta = {}) {
    const msg = String(text || '').trim();
    if (!msg || busy) return;
    if ((mode === 'doctor' || mode === 'beats' || mode === 'lab') && !scene) return;
    const userMsg = { id: uid('m'), role: 'user', text: msg };
    const history = [...messages, userMsg];
    setMessages((cur) => [...cur, userMsg]);
    setInput('');
    setBusy(true);
    const acc = { id: uid('m'), role: 'assistant', text: '', proposals: [], notices: [] };
    setLive({ ...acc });
    const controller = new AbortController();
    abortRef.current = controller;
    try {
      await streamChat({
        apiKey: state.settings.apiKey || undefined,
        signal: controller.signal,
        body: { mode: mode === 'lab' ? 'alternatives' : mode, model: state.settings.model || undefined, messages: toApiMessages(history, p), context: buildContext(extraMeta) },
        onEvent: (type, data) => {
          if (type === 'text') acc.text += data.delta;
          else if (type === 'proposal') acc.proposals.push({ ...data, status: {}, speaker: c?.id, partner: partner?.id });
          else if (type === 'notice') acc.notices.push(data.message);
          else if (type === 'refusal') acc.error = data.message;
          else if (type === 'error') acc.error = data.message;
          setLive({ ...acc, proposals: [...acc.proposals] });
        },
      });
    } catch (err) {
      if (err.name !== 'AbortError') acc.error = `Connection problem: ${err.message}`;
    }
    setBusy(false);
    setLive(null);
    abortRef.current = null;
    if (acc.text || acc.proposals.length || acc.error) setMessages((cur) => [...cur, acc]);
  }

  const starters = {
    coach: [`What's missing from ${c?.name || 'this character'}?`, 'Push me past my first choices for the voice.', 'Find the core contradiction.'],
    rehearse: ['(The scene begins. You speak first.)'],
    doctor: ['Diagnose this scene. Root causes first.', 'Where is it on the nose?', 'Is the turning point timed right?'],
    beats: ['Suggest the next beats.', 'Redesign the middle beats so each tops the last.'],
    lab: [],
  }[mode];

  return html`<div class=${cx('ai-panel', `mode-${mode}`)}>
    <div class="drawer-ctx">
      ${mode === 'coach' ? html`<span class="small muted">Coaching</span><${CharSelect} project=${p} value=${c?.id} onChange=${setC} />` : ''}
      ${mode === 'rehearse' ? html`<span class="small muted">AI plays</span><${CharSelect} project=${p} value=${c?.id} onChange=${setC} />
        <span class="small muted">you play</span><${CharSelect} project=${p} value=${partner?.id} onChange=${setPartnerId} />` : ''}
      ${['doctor', 'beats', 'lab'].includes(mode) ? (scene ? html`<span class="small muted">Scene:</span> <strong class="small">${scene.title}</strong>` : html`<span class="small muted">Open a scene to use this mode.</span>`) : ''}
      ${messages.length ? html`<button type="button" class="link-btn small" onClick=${() => { if (confirm('Clear this conversation?')) setMessages(() => []); }}>Clear</button>` : ''}
    </div>
    ${mode === 'rehearse' ? html`<p class="small muted ctx-note">Improvise in character. ${c?.name || 'The AI'} answers with a line, and you can reveal its subtext and action. Add any exchange you like to ${scene ? `“${scene.title}”` : 'a scene (open one first)'}. <${Cite} ch=${19} /></p>` : ''}
    ${mode === 'lab' ? html`<p class="small muted ctx-note">${targetLine ? html`Target: <span class="script">“${targetLine.line.text}”</span>` : 'Click the ✦ button on any line in the workshop to get five alternatives. Never settle for the first choice.'} <${Cite} ch=${7} /></p>` : ''}
    <div class="chat-log" ref=${scroller}>
      ${!messages.length && !live ? html`<div class="bubble bot"><p>${{
        coach: `I'll interview you about ${c?.name || 'your character'} and propose profile updates you can apply with one click. Where shall we start?`,
        rehearse: `I'll stay in character as ${c?.name || 'the character'}${partner ? `; you speak as ${partner.name}` : ''}. Say your first line, or let me open.`,
        doctor: 'I diagnose the scene with the flaws-and-fixes framework, root causes first, and propose rewrites you can apply.',
        beats: 'I propose the next beats (action/reaction pairs with lines), each topping the last.',
        lab: 'Pick a line in the workshop and I will give you five alternatives, each a different tactic.',
      }[mode]}</p></div>` : ''}
      ${messages.map((m) => html`<${Message} m=${m} mode=${mode} scene=${scene} msgKey=${key} />`)}
      ${live ? html`<${Message} m=${live} mode=${mode} scene=${scene} streaming />` : ''}
    </div>
    ${starters?.length && !busy ? html`<div class="chip-row starters">${starters.map((st) => html`<button type="button" class="chip-btn" onClick=${() => send(st)}>${st}</button>`)}</div>` : ''}
    <div class="chat-input">
      <${TextArea} value=${input} onInput=${setInput} rows=${2}
        placeholder=${mode === 'rehearse' ? `${partner?.name || 'You'}: say your line…` : 'Write to the Devil\'s Advocate…'}
        onKeyDown=${(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(input); } }} />
      <div class="chat-input-actions">
        ${busy ? html`<button type="button" class="btn btn-quiet" onClick=${() => abortRef.current?.abort()}>Stop</button>` : ''}
        <button type="button" class="btn btn-primary" disabled=${busy || !input.trim()} onClick=${() => send(input)}>${busy ? 'Thinking…' : 'Send'}</button>
      </div>
    </div>
  </div>`;
}

// ---------------------------------------------------------------------------

function Message({ m, mode, scene, streaming, msgKey }) {
  const p = state.project;
  if (m.role === 'user') {
    return html`<div class=${cx('bubble user', mode === 'rehearse' && 'in-character')}><p>${m.text}</p></div>`;
  }
  return html`<div class="bubble-group">
    ${m.text ? html`<div class="bubble bot"><div class="md" dangerouslySetInnerHTML=${{ __html: miniMarkdown(m.text) }}></div></div>` : ''}
    ${streaming && !m.text && !m.proposals?.length ? html`<div class="bubble bot typing"><span></span><span></span><span></span></div>` : ''}
    ${(m.proposals || []).map((pr, i) => html`<${Proposal} pr=${pr} scene=${scene} msg=${m} index=${i} msgKey=${msgKey} streaming=${streaming} />`)}
    ${(m.notices || []).map((n) => html`<div class="small muted">${n}</div>`)}
    ${m.error ? html`<div class="bubble error"><p>${m.error}</p>${/key|Settings/i.test(m.error) ? html`<button type="button" class="link-btn" onClick=${() => navigate('settings')}>Open Settings</button>` : ''}</div>` : ''}
  </div>`;
}

// Persist a proposal's status (applied / dismissed) inside its chat message.
function markStatus(msgKey, msgId, index, field, value) {
  mutate((proj) => {
    const msg = (proj.chats[msgKey] || []).find((x) => x.id === msgId);
    if (msg?.proposals?.[index]) msg.proposals[index].status = { ...(msg.proposals[index].status || {}), [field]: value };
  });
}

function Proposal({ pr, scene, msg, index, msgKey, streaming }) {
  if (pr.tool === 'speak_in_character') return html`<${Speech} pr=${pr} scene=${scene} msg=${msg} index=${index} msgKey=${msgKey} />`;
  if (pr.tool === 'propose_character_updates') return html`<${CharacterUpdates} pr=${pr} msg=${msg} index=${index} msgKey=${msgKey} disabled=${streaming} />`;
  if (pr.tool === 'propose_beats') return html`<${BeatsProposal} pr=${pr} scene=${scene} msg=${msg} index=${index} msgKey=${msgKey} disabled=${streaming} />`;
  if (pr.tool === 'propose_lines') return html`<${LinesProposal} pr=${pr} scene=${scene} msg=${msg} index=${index} msgKey=${msgKey} disabled=${streaming} />`;
  return null;
}

function Speech({ pr, scene, msg, index, msgKey }) {
  const p = state.project;
  const [open, setOpen] = useState(false);
  const c = characterById(p, pr.speaker);
  const sp = pr.input;
  const added = pr.status?.added;
  const addToScene = () => {
    if (!scene) return;
    const chat = p.chats[msgKey] || [];
    const pos = chat.findIndex((x) => x.id === msg.id);
    const prevUser = pos > 0 && chat[pos - 1].role === 'user' && !/^\(.*\)$/.test(chat[pos - 1].text.trim()) ? chat[pos - 1].text : '';
    act(() => {
      if (!scene.beats.length) scene.beats.push(newBeat(scene, { actor: pr.partner || '', reactor: pr.speaker }));
      const b = scene.beats[scene.beats.length - 1];
      if (prevUser) b.lines.push(newLine({ speaker: pr.partner || '', text: prevUser }));
      b.lines.push(newLine({ speaker: pr.speaker, text: sp.text, paren: sp.paralanguage || '', subtext: sp.subtext, tactic: sp.tactic }));
    });
    markStatus(msgKey, msg.id, index, 'added', true);
  };
  return html`<div class="speech" style=${`--c:${charColor(c)}`}>
    <div class="speech-name"><${CharDot} character=${c} /> ${c?.name || 'Character'}</div>
    ${sp.paralanguage ? html`<div class="speech-paren">(${sp.paralanguage})</div>` : ''}
    <div class="speech-text script">${sp.text}</div>
    ${open ? html`<div class="speech-under"><div><span class="under-label">Subtext</span> ${sp.subtext}</div><div><span class="under-label">Action</span> ${sp.tactic}</div></div>` : ''}
    <div class="speech-actions">
      <button type="button" class="link-btn small" onClick=${() => setOpen(!open)}>${open ? 'Hide' : 'Reveal'} subtext</button>
      ${scene && msgKey ? html`<button type="button" class="link-btn small" disabled=${added} onClick=${addToScene}>${added ? 'Added to scene ✓' : 'Add exchange to scene'}</button>` : ''}
    </div>
  </div>`;
}

const FIELD_INDEX = (() => {
  const idx = {};
  for (const s of CHARACTER_SECTIONS) for (const f of s.fields) idx[f.path] = f;
  for (const d of VOICE_DIMENSIONS) idx[`voice.sliders.${d.id}`] = { label: `Voice: ${d.label}`, type: 'slider' };
  idx['voice.context'] = { label: 'Voice: low ↔ high context', type: 'slider' };
  for (const e of VOICE_EXERCISES) idx[`samples.${e.id}`] = { label: `Voice lab: ${e.title}`, type: 'textarea' };
  idx['secrets.add'] = { label: 'New secret', type: 'add' };
  idx['facts.add'] = { label: 'New exposition fact', type: 'add' };
  return idx;
})();

function applyUpdate(c, u) {
  const f = FIELD_INDEX[u.path];
  if (!f) return false;
  if (u.path === 'secrets.add') { c.secrets.push({ id: uid('sec'), text: u.value, dilemma: u.rationale || '' }); return true; }
  if (u.path === 'facts.add') { c.facts.push({ id: uid('fact'), text: u.value, importance: 3 }); return true; }
  if (f.type === 'slider') { const n = Math.round(Number(u.value)); if (Number.isNaN(n)) return false; setPath(c, u.path, Math.max(0, Math.min(100, n))); return true; }
  if (f.type === 'list') { const items = String(u.value).split(',').map((s) => s.trim()).filter(Boolean); setPath(c, u.path, [...new Set([...(getPath(c, u.path) || []), ...items])]); return true; }
  if (f.type === 'select') { const ok = f.options.some(([v]) => v === u.value); if (!ok) return false; setPath(c, u.path, u.value); return true; }
  setPath(c, u.path, String(u.value));
  return true;
}

function CharacterUpdates({ pr, msg, index, msgKey, disabled }) {
  const p = state.project;
  const c = characterById(p, pr.input.character_id) || p.characters[0];
  const status = pr.status || {};
  const apply = (i) => {
    let ok = false;
    act(() => { ok = applyUpdate(c, pr.input.updates[i]); });
    if (msgKey) markStatus(msgKey, msg.id, index, i, ok ? 'applied' : 'invalid');
  };
  return html`<div class="proposal">
    <div class="proposal-head"><${Icon} name="spark" /> Profile proposals for <strong>${c?.name}</strong></div>
    ${pr.input.updates.map((u, i) => {
      const f = FIELD_INDEX[u.path];
      const cur = f && f.type !== 'add' ? getPath(c, u.path) : null;
      const st = status[i];
      return html`<div class=${cx('proposal-item', st)}>
        <div class="small"><strong>${f?.label || u.path}</strong>${!f ? html` <span class="muted">(unknown field)</span>` : ''}</div>
        ${!st && !isEmpty(cur) && String(cur) !== String(u.value) ? html`<div class="small muted strike" title="Current value">${Array.isArray(cur) ? cur.join(', ') : String(cur)}</div>` : ''}
        <div class="proposal-value">${u.value}</div>
        ${u.rationale ? html`<div class="small muted">${u.rationale}</div>` : ''}
        <div class="proposal-actions">
          ${st === 'applied' ? html`<span class="small ok-text">Applied ✓</span>` : st === 'dismissed' ? html`<span class="small muted">Dismissed</span>` : st === 'invalid' ? html`<span class="small muted">Couldn't apply this value</span>` : html`
            <button type="button" class="btn btn-small" disabled=${disabled || !f || !msgKey} onClick=${() => apply(i)}>Apply</button>
            <button type="button" class="btn btn-small btn-quiet" disabled=${disabled || !msgKey} onClick=${() => markStatus(msgKey, msg.id, index, i, 'dismissed')}>Dismiss</button>`}
        </div>
      </div>`;
    })}
  </div>`;
}

function BeatsProposal({ pr, scene, msg, index, msgKey, disabled }) {
  const p = state.project;
  const name = (id) => characterById(p, id)?.name || (id === 'action' ? 'action' : '—');
  const done = pr.status?.applied;
  const apply = () => {
    if (!scene) return;
    act(() => {
      const primary = scene.values[0]?.id;
      for (const pb of pr.input.beats) {
        const b = newBeat(scene, {
          actor: characterById(p, pb.actor_id) ? pb.actor_id : '', action: pb.action,
          reactor: characterById(p, pb.reactor_id) ? pb.reactor_id : '', reaction: pb.reaction,
          intensity: pb.intensity ? Math.round(pb.intensity) : undefined,
        });
        if (primary && pb.charge != null) b.charges[primary] = Math.round(pb.charge);
        b.lines = pb.lines.map((l) => (l.speaker_id === 'action' || !characterById(p, l.speaker_id)
          ? newLine({ kind: 'action', text: l.text })
          : newLine({ speaker: l.speaker_id, text: l.text, paren: l.paren || '', subtext: l.subtext || '', tactic: l.tactic || '' })));
        scene.beats.push(b);
      }
    });
    markStatus(msgKey, msg.id, index, 'applied', true);
  };
  return html`<div class="proposal">
    <div class="proposal-head"><${Icon} name="spark" /> ${pr.input.beats.length} proposed beat${pr.input.beats.length === 1 ? '' : 's'}</div>
    ${pr.input.rationale ? html`<p class="small muted">${pr.input.rationale}</p>` : ''}
    ${pr.input.beats.map((b) => html`<div class="proposal-beat">
      <div class="small"><strong>${name(b.actor_id)}</strong> ${b.action} / <strong>${name(b.reactor_id)}</strong> ${b.reaction}${b.charge != null ? html` · charge ${b.charge > 0 ? '+' : ''}${b.charge}` : ''}</div>
      ${b.lines.map((l) => html`<div class="proposal-line"><span class="small strong">${name(l.speaker_id).toUpperCase()}</span>${l.paren ? html` <em class="small">(${l.paren})</em>` : ''} <span class="script">${l.text}</span>
        ${l.subtext || l.tactic ? html`<div class="small muted">${[l.tactic, l.subtext].filter(Boolean).join(' · ')}</div>` : ''}</div>`)}
    </div>`)}
    <div class="proposal-actions">
      ${done ? html`<span class="small ok-text">Appended to scene ✓</span>` : html`<button type="button" class="btn btn-small" disabled=${disabled || !scene || !msgKey} onClick=${apply}>Append to scene</button>`}
    </div>
  </div>`;
}

function LinesProposal({ pr, scene, msg, index, msgKey, disabled }) {
  const p = state.project;
  const target = scene && pr.input.target_line_id ? locateLine(scene, pr.input.target_line_id) : null;
  const status = pr.status || {};
  const use = (i, how) => {
    const o = pr.input.options[i];
    act(() => {
      if (target && how === 'replace') {
        const l = target.line;
        if (l.text && !l.alternatives.includes(l.text)) l.alternatives.push(l.text);
        Object.assign(l, { text: o.text, paren: o.paren || l.paren, subtext: o.subtext || l.subtext, tactic: o.tactic || l.tactic });
      } else if (target && how === 'alt') {
        if (!target.line.alternatives.includes(o.text)) target.line.alternatives.push(o.text);
      } else if (scene) {
        if (!scene.beats.length) scene.beats.push(newBeat(scene));
        scene.beats[scene.beats.length - 1].lines.push(newLine({ speaker: characterById(p, o.speaker_id) ? o.speaker_id : '', text: o.text, paren: o.paren || '', subtext: o.subtext, tactic: o.tactic }));
      }
    });
    markStatus(msgKey, msg.id, index, i, how);
  };
  return html`<div class="proposal">
    <div class="proposal-head"><${Icon} name="swap" /> ${pr.input.options.length} option${pr.input.options.length === 1 ? '' : 's'}${target ? ' for the line' : ''}</div>
    ${target ? html`<div class="small muted">Current: <span class="script">“${target.line.text}”</span></div>` : ''}
    ${pr.input.options.map((o, i) => {
      const c = characterById(p, o.speaker_id);
      const st = status[i];
      return html`<div class=${cx('proposal-item', st && 'applied')} style=${`--c:${charColor(c)}`}>
        <div class="proposal-line"><span class="small strong">${(c?.name || '').toUpperCase()}</span>${o.paren ? html` <em class="small">(${o.paren})</em>` : ''}
          <div class="script">${o.text}</div></div>
        <div class="small muted">${o.tactic} · ${o.subtext}</div>
        ${o.note ? html`<div class="small">${o.note}</div>` : ''}
        <div class="proposal-actions">
          ${st ? html`<span class="small ok-text">${st === 'replace' ? 'Used ✓' : st === 'alt' ? 'Kept as alternative ✓' : 'Added ✓'}</span>` : target ? html`
            <button type="button" class="btn btn-small" disabled=${disabled || !msgKey} onClick=${() => use(i, 'replace')}>Use</button>
            <button type="button" class="btn btn-small btn-quiet" disabled=${disabled || !msgKey} onClick=${() => use(i, 'alt')}>Keep as alternative</button>` : html`
            <button type="button" class="btn btn-small" disabled=${disabled || !scene || !msgKey} onClick=${() => use(i, 'add')}>Add to scene</button>`}
        </div>
      </div>`;
    })}
  </div>`;
}
