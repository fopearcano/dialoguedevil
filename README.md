# Dialogue Devil

An interactive, visual workbench for building fictional characters and developing their dialogue, grounded in Robert McKee's *Dialogue: The Art of Verbal Action for Page, Stage, and Screen* (2016). The book is in [`docs/`](docs/).

McKee's starting point is that dialogue is verbal action. Every line is a tactic a character uses to get what she wants, and the words sit on top of a subtext of desire, antagonism and choice. Dialogue Devil makes that method something you can work through hands-on. You build characters from the inside out and design scenes beat by beat. Each line is written over its subtext, and the scene is checked against the book's flaws and fixes while you write. An optional Claude-powered "Devil's Advocate" can interview you, improvise in character, and propose revisions.

![Dialogue workshop](docs/screenshots/workshop.png)

## Quick start

Requires Node.js 20 or newer.

```bash
npm install
npm start
```

Open **http://localhost:4134**. The first run creates an original sample project, *What He Left*, so every view has something to show.

| Variable | Default | Purpose |
|---|---|---|
| `PORT` | `4134` | HTTP port |
| `HOST` | `127.0.0.1` | Bind address. Set `0.0.0.0` to reach it from other machines or a container. |
| `DD_DATA_DIR` | `./data/projects` | Where projects are saved (one JSON file each) |
| `ANTHROPIC_API_KEY` | (unset) | Enables the AI collaborator for everyone using this server |
| `DD_MODEL` | `claude-opus-5-5` | Default Claude model |
| `DD_AI_MOCK` | (unset) | `1` = canned AI responses for offline UI development and demos |

## What's inside

Every principle in the app is paraphrased from the book and tagged with the chapter it comes from (the red `Ch. n` badges; hover for the chapter title).

### Story dashboard
Medium (stage/screen/TV/prose) and vision (realism or nonrealism, which changes how strictly on-the-nose dialogue is judged, Ch. 8). Also the core value, inciting incident and major dramatic question. Infographics:
- **Cast cards** with mini voice fingerprints and profile depth.
- **Voice line-up**: overlays up to three characters' voices and measures how far apart they are (Ch. 10).
- **Conflict complex heat map**: characters × physical/social/personal/inner antagonism, with a "complex vs. complicated" verdict (Ch. 4, 12).
- **Scene table** with value-arc sparklines, turning points and six-task health.

### Character Studio (all the character elements in the book)
| Tab | Elements | Source |
|---|---|---|
| Mask & core | Interactive **three spheres** (said / unsaid / unsayable). Characterization (biology, upbringing, education, mentality, values) vs. true character, the core contradiction, dramatic vs. comic mentality and the comic "humor" | Preface, Ch. 2, 3, 14 |
| Desire & conflict | **Complex of desire** map: inciting incident → object of desire → spine of action, super-intention vs. subconscious desire, motivation vs. excuse. **Forces of antagonism** as four concentric rings | Ch. 6, 12, 4 |
| Voice | **Voice fingerprint radar**, intended (sliders) vs. measured from the character's actual lines across all scenes. Ten voice dimensions plus context level; lexicon (knowledge nouns/verbs, modifiers, signature words, never-says, cultural treasure chest); modality; natural line design; dialect and paralanguage | Ch. 5, 7, 10, 12, 13 |
| Secrets & ammunition | Secrets with their lesser-of-two-evils dilemma and the scene where they're revealed. Exposition facts ranked by importance that can be sent into a scene as ammunition | Ch. 2 |
| Background desires | **Web of restraint**: relationships with a diverging charge, and what the character can't say yet | Ch. 12 |
| Voice lab | "Say it their way" exercises (shock without "Oh my God", love unsaid, state vs. understate, sensory trope, the specific verb, the third thing, the Magic If…), each analysed live. A "test any line" box | Ch. 2, 5–8, 10, 15, 19 |

![Complex of desire](docs/screenshots/character-desire.png)

### Scene design
Track (to others / to self / to audience) and mode (dramatized/narratized). One of six **conflict types** from the case studies (balanced, comic, asymmetric, indirect, reflexive, minimal), each with its own craft tips. **Who wants what**: conscious and subconscious scene intentions, opening tactics, sense of antagonism, and the scene driver. **Values at stake** with opening charges. **Third thing** diagram (trialogue vs. duelogue). Exposition to smuggle, the turning-point plan, and the Ch. 19 **key questions** checklist.

### Dialogue workshop (the dialogic core)
- **Value arc**: charge per beat for each value at stake, with the turning point found automatically and beat intensity bars beneath. Hover for the crosshair readout, or switch to a table view.
- **Beats** named as action/reaction gerunds (e.g. *Teo bearing gifts / Nadia refusing the peace offering*), each with its own charges and intensity.
- **Lines in iceberg view**: the said above the waterline, the unsaid and the action (gerund) below it. Paralanguage, stage directions and silence are first-class.
- **Composer built on the five steps of behavior**: desire → sense of antagonism → choice of action → action → expression, with a live **Magic If** prompt. Line tactics fill in the beat's action/reaction automatically.
- **Alternatives scratchpad** on every line, after Ch. 7's "never settle for the first choice": swap versions in and out.
- **Live analysis** of every line and of the whole scene:
  - On-the-nose, empty talk and forced exposition.
  - Over-emotive and overly perceptive talk, and melodrama (emotion out of proportion to the beat's stakes).
  - Clichés and character-neutral phrases; clutter; arid Latinate language; passive voice; long speeches and the monologue fallacy.
  - Blurred meaning, mistimed cues, accidental echoes, and words the character "never says".
  - At scene level: repetitious beats, nonevents and mistimed turning points, duelogues, characters who sound alike, and voice drift from the profile.
- **Six dialogue tasks scorecard**, plus a Sopranos-style **content · length · pace** table per speaker (Ch. 13).
- **Script** export: Fountain screenplay, stage play, prose draft, or an annotated beat breakdown with subtext.

### Handbook
A searchable, infographic condensation of the book's framework. It covers:
- the definition, three tracks and three functions;
- the spheres, the conflict complex, and how dialogue works across media;
- line design and technique, and the six tasks;
- every flaw with its fix;
- character-specific dialogue, and story/scene design (complex of desire, five steps, beats, turning points);
- the six conflict types, a tactics vocabulary, and the key questions and axioms.

![Handbook](docs/screenshots/handbook.png)

### The Devil's Advocate (right-hand panel)
- **Interview** (no AI needed): a dialogic interviewer that asks McKee's questions from the mask inward to the unsayable, then the voice. Each answer goes straight into the profile.
- **AI modes** (optional): each needs an API key.
  - **Coach**: interviews you about a character and proposes profile updates as cards you apply or dismiss.
  - **Rehearse**: the AI improvises *in character*, using the voice profile and scene intention, while you play the other role. Every reply carries its hidden subtext and action, and you can add any exchange to the scene.
  - **Doctor**: diagnoses the scene from the analyzer's findings, root causes first, and proposes rewrites.
  - **Beats**: proposes the next beats, each topping the last.
  - **Line lab**: five alternatives for a line, each a different tactic.

The AI never edits your work directly. It calls proposal tools, and you choose what to apply. Every AI-applied change can be undone.

![Voice fingerprint, dark theme](docs/screenshots/character-voice.png)

## AI setup (optional)

Either start the server with `ANTHROPIC_API_KEY` set, or paste a key into **Settings**. A key entered in Settings stays in that browser's local storage and is sent to your own Dialogue Devil server with each AI request, which uses it for that request only and never writes it to disk.

Under the hood, `server/ai.js` uses the official `@anthropic-ai/sdk`:
- A streaming tool-use loop over the Messages API, with text streamed to the browser over server-sent events.
- Proposal tools validated with zod before they reach the UI.
- Eager input streaming on tools.
- A prompt-cached system block generated from the same knowledge base the UI uses (`public/js/mckee.js`).
- Server-side refusal fallback (`fallbacks: "default"`) on models that support it.

The default model is Claude Opus 5.5; Settings offers Sonnet 5.5, Haiku 5.5 and Fable 5.1.

## Project layout

```
server.js               Express app: static UI, project REST API, AI SSE endpoint (port 4134)
server/ai.js            Claude agent loop, tool validation, error mapping, mock mode
server/prompts.js       System prompt (built from the knowledge base) and tool definitions
server/storage.js       JSON file storage, one file per project
public/index.html       Single-page app shell (Preact + htm, no build step)
public/css/app.css      Design tokens (light/dark), layout, components
public/js/mckee.js      The knowledge base: principles, schema, interview, tactics, flaws, all with chapter refs
public/js/analysis.js   Dialogue analysis engine (pure functions, shared with tests)
public/js/model.js      Data model and factories
public/js/sample.js     Original sample project ("What He Left")
public/js/export.js     Fountain / stage / prose / annotated exporters
public/js/components/   Shared UI and SVG infographics (value arc, radar, spheres, rings, web…)
public/js/views/        Story, character, scene design, workshop, handbook, settings, assistant drawer
test/                   node:test suites (analysis engine, REST API, AI loop against a fake Anthropic endpoint)
```

## Tests

```bash
npm test
```

The suites cover the analysis heuristics (one test per major flaw family), voice measurement, turning-point detection, the exporters, the sample project, the REST API, and the full AI tool-use loop. The loop runs offline against a local fake of the Messages API streaming endpoint.

## About the source

Principles are paraphrased and cited by chapter; quotations from the book are kept to a few short lines. The sample scene and characters are original, written to demonstrate the method: a third thing (the watch), exposition used as ammunition, and a backstory revelation as the turning point.
