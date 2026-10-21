// The proposal tools' input schemas, shared by every provider's loop: a
// tool call is "executed" by validating its input and forwarding it.

import { z } from 'zod';
import { REVIEWABLE_FLAWS } from '../public/js/mckee.js';

const opt = z.string().optional().nullable();
export const SCHEMAS = {
  propose_character_updates: z.object({
    character_id: z.string(),
    updates: z.array(z.object({ path: z.string().min(1), value: z.union([z.string(), z.number()]).transform(String), rationale: z.string().default('') })).min(1),
  }),
  propose_beats: z.object({
    scene_id: z.string(),
    rationale: opt,
    beats: z.array(z.object({
      actor_id: z.string(), action: z.string(), reactor_id: z.string(), reaction: z.string(),
      charge: z.number().min(-10).max(10).optional().nullable(),
      intensity: z.number().min(0).max(10).optional().nullable(),
      lines: z.array(z.object({ speaker_id: z.string(), text: z.string(), paren: opt, subtext: opt, tactic: opt })),
    })).min(1),
  }),
  propose_lines: z.object({
    scene_id: z.string(),
    target_line_id: opt,
    options: z.array(z.object({ speaker_id: z.string(), text: z.string(), paren: opt, subtext: z.string(), tactic: z.string(), note: opt })).min(1),
  }),
  speak_in_character: z.object({ text: z.string().min(1), paralanguage: opt, subtext: z.string(), tactic: z.string() }),
  report_issues: z.object({
    summary: z.string().default(''),
    issues: z.array(z.object({
      line_id: z.string().default(''), flaw: z.enum(REVIEWABLE_FLAWS), severity: z.enum(['info', 'warning', 'serious']).default('warning'),
      evidence: z.string().default(''), note: z.string(), fix: z.string().default(''),
    })).default([]),
    disputes: z.array(z.object({ line_id: z.string().default(''), flaw: z.enum(REVIEWABLE_FLAWS), reason: z.string() })).default([]),
  }),
};

// Tools whose call is the whole answer: no follow-up turn is needed.
export const TERMINAL_TOOLS = new Set(['speak_in_character', 'report_issues']);

// { ok, data } for a valid call, { ok: false, error } otherwise.
export function checkTool(name, input) {
  const schema = SCHEMAS[name];
  if (!schema) return { ok: false, error: `Unknown tool ${name}` };
  const parsed = schema.safeParse(input);
  return parsed.success ? { ok: true, data: parsed.data } : { ok: false, error: String(parsed.error?.message || parsed.error).slice(0, 2000) };
}
