// ---------------------------------------------------------------------------
// Leitner-style spaced repetition.
//
// Cards live in boxes 0..5. A correct-ish grade promotes the card to a higher
// box (longer interval); a wrong grade ("again") demotes it back to box 1.
// The interval (in days) before the card is due again grows with the box.
// ---------------------------------------------------------------------------

import type { CardState, Grade, LeitnerBox } from "@/types";

/** Days until next review for each Leitner box. Box 0 is "new" (due now). */
export const BOX_INTERVALS: Record<LeitnerBox, number> = {
  0: 0,
  1: 1,
  2: 2,
  3: 4,
  4: 8,
  5: 16,
};

/** The box a card reaches to count as "mastered". */
export const MASTERED_BOX: LeitnerBox = 5;

/** Create a fresh card state for a given word rank. */
export function newCardState(rank: number): CardState {
  return {
    rank,
    box: 0,
    dueAt: Date.now(),
    reviews: 0,
    correct: 0,
    favourite: false,
    mastered: false,
  };
}

function nextBox(box: LeitnerBox, grade: Grade): LeitnerBox {
  switch (grade) {
    case "again":
      return 1; // lapse: back to the start of the schedule
    case "hard":
      // stay in place (but never below box 1 once reviewed)
      return Math.max(1, box) as LeitnerBox;
    case "medium":
      return Math.min(MASTERED_BOX, box + 1) as LeitnerBox;
    case "easy":
      // jump two boxes for a confident answer
      return Math.min(MASTERED_BOX, box + 2) as LeitnerBox;
  }
}

/**
 * Apply a grade to a card and return the updated state (pure — does not mutate).
 */
export function gradeCard(state: CardState, grade: Grade): CardState {
  const box = nextBox(state.box, grade);
  const intervalDays = BOX_INTERVALS[box];
  const dueAt = Date.now() + intervalDays * 86_400_000;
  const isCorrect = grade === "medium" || grade === "easy";
  return {
    ...state,
    box,
    dueAt,
    reviews: state.reviews + 1,
    correct: state.correct + (isCorrect ? 1 : 0),
    lastGrade: grade,
    lastReviewedAt: Date.now(),
    mastered: box >= MASTERED_BOX,
  };
}

/** XP awarded for a single review, weighted by how well it was known. */
export function xpForGrade(grade: Grade): number {
  switch (grade) {
    case "again":
      return 2;
    case "hard":
      return 5;
    case "medium":
      return 8;
    case "easy":
      return 10;
  }
}

/** Is this card due for review right now? */
export function isDue(state: CardState, now: number = Date.now()): boolean {
  return state.dueAt <= now;
}
