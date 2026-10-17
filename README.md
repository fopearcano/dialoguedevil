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

The server also listens on your local network. At startup it prints the address to open on a phone, tablet or another computer on the same Wi-Fi:

```
Dialogue Devil is running.
  This computer:  http://localhost:4134
  Your network:   http://192.168.1.23:4134   (phones, tablets, other computers on this Wi-Fi/LAN)
  Only private-network addresses may connect.
  Access code: off. Set DD_ACCESS_CODE=… to require one on other devices.
```

| Variable | Default | Purpose |
|---|---|---|
| `PORT` | `4134` | HTTP port |
| `HOST` | `0.0.0.0` | Bind address. `0.0.0.0` opens it to your network; `127.0.0.1` keeps it to this computer. |
| `DD_ACCESS_CODE` | (unset) | Code other devices must enter once (remembered for 30 days). This computer never needs it. |
| `DD_ALLOW_PUBLIC` | (unset) | `1` lets non-private (internet) addresses connect. Off by default; see below before turning it on. |
| `DD_DATA_DIR` | `./data/projects` | Where projects are saved (one JSON file each) |
| `ANTHROPIC_API_KEY` | (unset) | Enables the AI collaborator for everyone using this server |
| `DD_MODEL` | `claude-opus-5-5` | Default Claude model |
| `DD_AI_MOCK` | (unset) | `1` = canned AI responses for offline UI development and demos |

## Using it on other devices

1. Start the server on one computer (`npm start`, or `DD_ACCESS_CODE=pick-a-code npm start`).
2. On the other device, open the **Your network** address. **Settings → Other devices** shows the same addresses with copy buttons.
3. If it doesn't load, allow Node.js / port 4134 through that computer's firewall. Both devices must be on the same network. Guest Wi-Fi with client isolation blocks this.

Every device works on the same projects:
- **Live updates.** An idle device picks up changes saved elsewhere within about four seconds.
- **No silent overwrites.** Each save carries the version it was based on. If another device saved first, the server refuses the stale save (HTTP 409) and the app asks what to keep: *Load the latest*, *Save mine as a copy*, or *Keep mine* (after a confirmation).
- **Nothing lost on close or disconnect.** Edits are copied to the browser as you type and flushed when the tab is hidden or closed. If the server can't be reached, they're kept locally and restored the next time you open the project.

Security defaults:
- Only private-network addresses can connect: home and office LANs, 10.x, 172.16–31.x, 192.168.x, and VPN ranges such as Tailscale's 100.64/10. The check uses the connection's real address; `X-Forwarded-For` is ignored.
- Without `DD_ACCESS_CODE`, anyone on your network can open your projects, and can use the server's `ANTHROPIC_API_KEY` if one is set. On shared networks, set an access code. The server prints a reminder when a key is set without one.
- An API key typed into Settings stays in that one browser. Each device that should use AI needs its own key, or set `ANTHROPIC_API_KEY` on the server.
- `DD_ALLOW_PUBLIC=1` exposes the app to anyone who can reach the port. Traffic is plain HTTP. If you need access from outside your network, use a VPN such as Tailscale instead, or put the app behind an HTTPS reverse proxy *and* set an access code.

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
- **Double-check** (below): independent checks that catch what a single pass misses.
- **Table read**: the browser reads the scene aloud line by line, and you press <kbd>F</kbd> to flag a line that sounds wrong. The case studies advise reading scenes aloud, or better, acting them out (Ch. 13, 15). Where speech synthesis isn't available, it paces silently at reading speed.
- **Six dialogue tasks scorecard**, plus a Sopranos-style **content · length · pace** table per speaker (Ch. 13).
- **Script** export: Fountain screenplay, stage play, prose draft, or an annotated beat breakdown with subtext.

### Double-check: limiting missed problems
A single set of rules is precise but misses a lot. On the bundled test lines, the rules alone catch 40% of the planted flaws. So every line goes through independent checks, and the results are merged:

| Layer | What it does | Needs |
|---|---|---|
| **Rules** | Precise patterns: on-the-nose statements, clichés, clutter, Latinate diction, long speeches… | nothing |
| **Second reader** | A recall-oriented pass. It uses stemming, fuzzy phrase matching that tolerates filler words, and lexicons for emotion, exposition and abstraction. At scene level it also looks for repeated tactics and missing reactions. | nothing |
| **AI review** | Claude reads the scene with the profiles and the analyzer's findings. It reports what the other checks missed and disputes their false alarms. | API key |
| **Your ear** | Lines you flag during a table read | nothing |

Each finding shows its sources and a status:
- **Confirmed**: two or more checks agree.
- **Flagged**: the rules alone.
- **Verify**: one sensitive check alone, so look before acting.
- **By ear**: you flagged it.

The AI can mark a finding *disputed* with its reason. You can **dismiss** a finding as deliberate; it's remembered per line and can be shown again. AI results are fingerprinted per line: edit a line and its AI findings are marked stale until the next review. The double-check card shows each layer's coverage, and the story table counts lines still to verify.

Measured on `test/fixtures/flawed-lines.js` (lines written for this purpose, so treat the numbers as optimistic):

| Set | Rules alone | Rules + second reader |
|---|---|---|
| Tuning set, 42 flawed lines | 40% | 100% |
| Held-out set, 24 flawed lines written after tuning | 38% | 100% |
| Clean lines falsely flagged | 0 / 12 | 0 / 12 |

The reliable signal is the gap, not the 100%: real scenes will have misses that no heuristic sees. That's why the AI review and the table read exist. "Verify" findings are not errors; they're cues to look again.

![Double-check: a finding confirmed by two checks and disputed by the AI reviewer, and two "verify" findings from the second reader](docs/screenshots/double-check.png)

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
  - **Review**: the AI layer of the double-check (run it from the workshop's double-check card).

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
server/storage.js       JSON file storage, one file per project, with revisions and per-project save locks
server/network.js       LAN guard (private addresses only), optional access code, network addresses
public/index.html       Single-page app shell (Preact + htm, no build step)
public/css/app.css      Design tokens (light/dark), layout, components
public/js/mckee.js      The knowledge base: principles, schema, interview, tactics, flaws, all with chapter refs
public/js/analysis.js   Dialogue analysis engine: the rules layer (pure functions, shared with tests)
public/js/secondreader.js  Second reader: the recall-oriented layer
public/js/doublecheck.js   Merges rules, second reader, AI review and the writer's flags into statuses
public/js/review.js     Runs the AI review and stores it with per-line fingerprints
public/js/store.js      State, autosave with revisions, conflict handling, local backups, live updates
public/js/model.js      Data model and factories
public/js/sample.js     Original sample project ("What He Left")
public/js/export.js     Fountain / stage / prose / annotated exporters
public/js/components/   Shared UI and SVG infographics (value arc, radar, spheres, rings, web…)
public/js/views/        Story, character, scene design, workshop, handbook, settings, assistant drawer
test/                   node:test suites (analysis, double-check, REST API and conflicts, LAN guard, AI loops against a fake Anthropic endpoint)
```

## Tests

```bash
npm test
```

The suites cover:
- the analysis heuristics (one test per major flaw family), voice measurement, turning-point detection, the exporters and the sample project;
- the double-check: recall on the tuning and held-out sets, no false alarms on clean lines, statuses, disputes, dismissals and stale AI findings;
- the REST API, including revision conflicts and concurrent saves;
- the LAN guard and access code;
- the AI tool-use loop, including the review report. The loop runs offline against a local fake of the Messages API streaming endpoint.

## About the source

Principles are paraphrased and cited by chapter; quotations from the book are kept to a few short lines. The sample scene and characters are original, written to demonstrate the method: a third thing (the watch), exposition used as ammunition, and a backstory revelation as the turning point.
