// rubric.ts — brief → weighted rubric (PRD F1). Poster approval/freeze happens upstream (Phase 04);
// here we just generate + validate structure. Weights must sum to exactly 100.

import { z } from "zod";
import { callJson } from "./client";
import { RUBRIC_SYSTEM, rubricUser } from "./prompts/rubric-v1";

export const rubricItemSchema = z.object({
  item_id: z.string().min(1),
  criterion: z.string().min(1),
  weight: z.number().int().min(1).max(100),
});
export type RubricItem = z.infer<typeof rubricItemSchema>;

const rubricReplySchema = z.object({ items: z.array(rubricItemSchema).min(3).max(7) });

export interface GeneratedRubric {
  items: RubricItem[];
  usage: { input_tokens: number; output_tokens: number };
}

/** Generate a rubric from a brief. Throws if the model returns malformed items or weights ≠ 100. */
export async function generateRubric(brief: string): Promise<GeneratedRubric> {
  const { data, usage } = await callJson(RUBRIC_SYSTEM, rubricUser(brief));
  const parsed = rubricReplySchema.safeParse(data);
  if (!parsed.success) {
    throw new Error(`rubric off-schema: ${parsed.error.issues.map((i) => i.message).join("; ")}`);
  }
  const sum = parsed.data.items.reduce((a, i) => a + i.weight, 0);
  if (sum !== 100) throw new Error(`rubric weights sum to ${sum}, must be 100`);
  return { items: parsed.data.items, usage };
}
