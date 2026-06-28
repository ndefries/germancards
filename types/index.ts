// ---------------------------------------------------------------------------
// Core domain types for Sprachkarten.
// These describe the vocabulary dataset and all locally-stored learner state.
// ---------------------------------------------------------------------------

/** CEFR difficulty levels used across the app. */
export type Difficulty = "A1" | "A2" | "B1" | "B2";

/** Grammatical category of a word. */
export type PartOfSpeech =
  | "noun"
  | "verb"
  | "adjective"
  | "adverb"
  | "pronoun"
  | "preposition"
  | "conjunction"
  | "number"
  | "phrase";

/**
 * A single vocabulary entry. Matches the JSON import schema exactly so a
 * user-supplied "2000 most common words" file can be dropped in unchanged.
 */
export interface Word {
  rank: number;
  german: string;
  english: string;
  partOfSpeech: PartOfSpeech;
  difficulty: Difficulty;
  pronunciation: string;
  exampleGerman: string;
  exampleEnglish: string;
  memoryTip: string;
  /** Optional grammar/usage note shown on the answer side. */
  grammarNote?: string;
  usageNote?: string;
  tags: string[];
}

/** Leitner box index. 0 = brand new / lapsed, 5 = mastered. */
export type LeitnerBox = 0 | 1 | 2 | 3 | 4 | 5;

/** The four grading buttons available when reviewing a card. */
export type Grade = "again" | "hard" | "medium" | "easy";

/** Per-word spaced-repetition + learning state, persisted to localStorage. */
export interface CardState {
  rank: number;
  box: LeitnerBox;
  /** Epoch ms of the next time this card is due for review. */
  dueAt: number;
  /** Total times reviewed. */
  reviews: number;
  /** Correct (medium/easy) reviews, used for accuracy. */
  correct: number;
  lastGrade?: Grade;
  lastReviewedAt?: number;
  favourite: boolean;
  /** True once the card has reached the final Leitner box. */
  mastered: boolean;
}

/** A single day's activity, keyed by ISO date (YYYY-MM-DD). */
export interface DayStat {
  date: string;
  xp: number;
  reviewed: number;
  correct: number;
  studySeconds: number;
}

/** User-configurable settings. */
export interface Settings {
  darkMode: boolean;
  dailyGoal: number; // cards per day
  speechRate: number; // 0.5 – 1.5
  quizDifficulty: "all" | Difficulty;
  notifications: boolean;
  reducedMotion: boolean;
  sessionSize: number; // cards per flashcard/listening/writing session
}

/** The full persisted progress blob (everything under one localStorage key). */
export interface ProgressData {
  xp: number;
  currentStreak: number;
  longestStreak: number;
  lastStudyDate: string | null;
  cards: Record<number, CardState>;
  days: Record<string, DayStat>;
  recent: number[]; // ranks, most-recent first
  settings: Settings;
}
