// ---------------------------------------------------------------------------
// Dataset loading, filtering and search.
//
// The built-in starter dataset lives in /data/words.json. Users can import a
// full "2000 most common words" JSON via Settings; that import is stored in
// localStorage and transparently overrides the bundled set (see store.tsx).
// ---------------------------------------------------------------------------

import rawWords from "@/data/words.json";
import type { Difficulty, PartOfSpeech, Word } from "@/types";

/** The bundled starter dataset, typed. */
export const BUILT_IN_WORDS = rawWords as Word[];

/** Category keys used by the Learn page. */
export type Category =
  | Difficulty
  | "nouns"
  | "verbs"
  | "adjectives"
  | "adverbs"
  | "pronouns"
  | "favourites"
  | "recent";

const POS_BY_CATEGORY: Partial<Record<Category, PartOfSpeech>> = {
  nouns: "noun",
  verbs: "verb",
  adjectives: "adjective",
  adverbs: "adverb",
  pronouns: "pronoun",
};

/**
 * Filter words by category. `favourites` and `recent` need learner state, so
 * they are passed in as rank lists (the store supplies them).
 */
export function wordsForCategory(
  words: Word[],
  category: Category,
  opts: { favouriteRanks?: number[]; recentRanks?: number[] } = {}
): Word[] {
  if (category === "A1" || category === "A2" || category === "B1" || category === "B2") {
    return words.filter((w) => w.difficulty === category);
  }
  if (category === "favourites") {
    const set = new Set(opts.favouriteRanks ?? []);
    return words.filter((w) => set.has(w.rank));
  }
  if (category === "recent") {
    const order = opts.recentRanks ?? [];
    const byRank = new Map(words.map((w) => [w.rank, w]));
    return order.map((r) => byRank.get(r)).filter((w): w is Word => Boolean(w));
  }
  const pos = POS_BY_CATEGORY[category];
  return pos ? words.filter((w) => w.partOfSpeech === pos) : words;
}

/**
 * Full-text search across German, English, difficulty, part of speech and tags.
 */
export function searchWords(words: Word[], query: string): Word[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return words.filter((w) => {
    return (
      w.german.toLowerCase().includes(q) ||
      w.english.toLowerCase().includes(q) ||
      w.difficulty.toLowerCase() === q ||
      w.partOfSpeech.toLowerCase().includes(q) ||
      w.tags.some((t) => t.toLowerCase().includes(q))
    );
  });
}

/** Validate an imported dataset; throws with a friendly message if malformed. */
export function validateWordList(data: unknown): Word[] {
  if (!Array.isArray(data)) {
    throw new Error("File must contain a JSON array of word objects.");
  }
  const required = ["german", "english", "partOfSpeech", "difficulty"];
  data.forEach((item, i) => {
    if (typeof item !== "object" || item === null) {
      throw new Error(`Entry ${i + 1} is not an object.`);
    }
    for (const key of required) {
      if (!(key in (item as Record<string, unknown>))) {
        throw new Error(`Entry ${i + 1} is missing "${key}".`);
      }
    }
  });
  // Backfill rank if absent so the rest of the app has stable keys.
  return (data as Word[]).map((w, i) => ({
    ...w,
    rank: typeof w.rank === "number" ? w.rank : i + 1,
    pronunciation: w.pronunciation ?? "",
    exampleGerman: w.exampleGerman ?? "",
    exampleEnglish: w.exampleEnglish ?? "",
    memoryTip: w.memoryTip ?? "",
    tags: Array.isArray(w.tags) ? w.tags : [],
  }));
}

export const CATEGORY_LABELS: Record<Category, string> = {
  A1: "A1 · Beginner",
  A2: "A2 · Elementary",
  B1: "B1 · Intermediate",
  B2: "B2 · Upper Int.",
  nouns: "Nouns",
  verbs: "Verbs",
  adjectives: "Adjectives",
  adverbs: "Adverbs",
  pronouns: "Pronouns",
  favourites: "Favourites",
  recent: "Recently Learned",
};
