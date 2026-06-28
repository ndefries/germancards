// ---------------------------------------------------------------------------
// "AI Prompt Generator" — the rotating creative prompts shown on each card.
// These work offline (no API key required). If a key is configured, the same
// prompts can be sent to an LLM (see lib/ai.ts) for a generated response.
// ---------------------------------------------------------------------------

import type { Word } from "@/types";
import { sample } from "@/lib/utils";

/** Prompt templates. `{word}` is replaced with the German headword. */
const PROMPT_TEMPLATES: string[] = [
  "Use “{word}” in a sentence.",
  "Tell a funny story using “{word}”.",
  "Imagine ordering food using “{word}”.",
  "Describe your house using “{word}”.",
  "Translate a sentence containing “{word}”.",
  "Explain “{word}” to a child.",
  "Use “{word}” in the past tense.",
  "Create a short conversation using “{word}”.",
  "Write a question that uses “{word}”.",
  "Use “{word}” to describe your morning routine.",
];

/** Build a concrete prompt string for a given word. */
export function promptFor(word: Word, template?: string): string {
  const t = template ?? sample(PROMPT_TEMPLATES);
  return t.replace(/\{word\}/g, word.german);
}

/** Pick a random template (so a card can rotate prompts on demand). */
export function randomPromptTemplate(): string {
  return sample(PROMPT_TEMPLATES);
}

export { PROMPT_TEMPLATES };
