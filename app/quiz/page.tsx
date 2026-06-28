"use client";

// Quiz: several question formats backed by the same dataset and SRS grading.
//   • Multiple choice (German → English)
//   • Typing (English → German, accepts ae/oe/ue/ss spellings)
//   • Sentence completion (fill the blank in an example sentence)
//   • Matching (pair four German words with their meanings)
// A "Timed" toggle adds a per-question countdown.

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, X, Timer, RotateCcw } from "lucide-react";
import { useStore, useStudyTimer } from "@/lib/store";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Confetti } from "@/components/confetti";
import { answersMatch, cn, sample, shuffle } from "@/lib/utils";
import type { Word } from "@/types";

type Mode = "multiple" | "typing" | "completion" | "matching";
const MODES: { id: Mode; label: string }[] = [
  { id: "multiple", label: "Multiple choice" },
  { id: "typing", label: "Typing" },
  { id: "completion", label: "Sentence completion" },
  { id: "matching", label: "Matching" },
];
const QUESTION_COUNT = 10;
const TIME_PER_Q = 12; // seconds when timed mode is on

export default function QuizPage() {
  useStudyTimer();
  const { words, grade, settings, hydrated } = useStore();

  const [mode, setMode] = useState<Mode>("multiple");
  const [timed, setTimed] = useState(false);
  const [started, setStarted] = useState(false);

  // Pool respects the quiz-difficulty setting.
  const pool = useMemo(() => {
    if (settings.quizDifficulty === "all") return words;
    const filtered = words.filter((w) => w.difficulty === settings.quizDifficulty);
    return filtered.length >= 4 ? filtered : words;
  }, [words, settings.quizDifficulty]);

  if (!hydrated) return <div className="text-fg-muted">Loading…</div>;

  if (!started) {
    return (
      <div className="mx-auto max-w-lg space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-fg">Quiz</h1>
          <p className="mt-1 text-fg-muted">Pick a format and test yourself.</p>
        </div>
        <Card className="space-y-5 p-6">
          <div>
            <div className="mb-2 text-sm font-semibold text-fg">Format</div>
            <div className="grid grid-cols-2 gap-2">
              {MODES.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setMode(m.id)}
                  className={cn(
                    "rounded-2xl border p-4 text-left text-sm font-medium transition-colors",
                    mode === m.id
                      ? "border-brand-500 bg-brand-500/10 text-brand-600 dark:text-brand-400"
                      : "border-line text-fg-muted hover:bg-surface-2"
                  )}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>
          <label className="flex items-center justify-between rounded-2xl bg-surface-2 p-4">
            <span className="flex items-center gap-2 text-sm font-medium text-fg">
              <Timer size={16} /> Timed mode ({TIME_PER_Q}s per question)
            </span>
            <input
              type="checkbox"
              checked={timed}
              onChange={(e) => setTimed(e.target.checked)}
              className="h-5 w-5 accent-brand-600"
            />
          </label>
          <Button size="lg" className="w-full" onClick={() => setStarted(true)}>
            Start quiz
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <QuizRunner
      mode={mode}
      timed={timed}
      pool={pool}
      onGrade={grade}
      onExit={() => setStarted(false)}
    />
  );
}

// ---------------------------------------------------------------------------

function QuizRunner({
  mode,
  timed,
  pool,
  onGrade,
  onExit,
}: {
  mode: Mode;
  timed: boolean;
  pool: Word[];
  onGrade: (rank: number, g: "again" | "easy") => void;
  onExit: () => void;
}) {
  const questions = useMemo(() => shuffle(pool).slice(0, QUESTION_COUNT), [pool]);
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [fire, setFire] = useState(0);
  const finished = index >= questions.length;

  const next = useCallback(
    (correct: boolean, rank: number) => {
      onGrade(rank, correct ? "easy" : "again");
      if (correct) setScore((s) => s + 1);
      const n = index + 1;
      if (n >= questions.length && correct) setFire((f) => f + 1);
      setIndex(n);
    },
    [index, questions.length, onGrade]
  );

  if (finished) {
    const pct = Math.round((score / questions.length) * 100);
    if (pct >= 80 && fire === 0) setFire(1);
    return (
      <div className="mx-auto max-w-lg">
        <Confetti fire={fire} />
        <Card className="p-10 text-center">
          <div className="text-5xl font-bold text-fg">{pct}%</div>
          <p className="mt-2 text-fg-muted">
            {score} of {questions.length} correct
          </p>
          <div className="mt-8 flex justify-center gap-3">
            <Button onClick={onExit}>
              <RotateCcw size={18} /> New quiz
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <Confetti fire={fire} />
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-fg capitalize">{mode.replace("_", " ")}</h1>
        <span className="text-sm text-fg-muted">
          {index + 1} / {questions.length}
        </span>
      </div>
      <Progress value={(index / questions.length) * 100} />

      <Question
        key={index}
        word={questions[index]}
        pool={pool}
        mode={mode}
        timed={timed}
        onAnswer={(correct) => next(correct, questions[index].rank)}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------

function Question({
  word,
  pool,
  mode,
  timed,
  onAnswer,
}: {
  word: Word;
  pool: Word[];
  mode: Mode;
  timed: boolean;
  onAnswer: (correct: boolean) => void;
}) {
  const [answered, setAnswered] = useState<null | boolean>(null);
  const [picked, setPicked] = useState<string | null>(null);
  const [typed, setTyped] = useState("");
  const [timeLeft, setTimeLeft] = useState(TIME_PER_Q);

  // Countdown for timed mode.
  useEffect(() => {
    if (!timed || answered !== null) return;
    if (timeLeft <= 0) {
      setAnswered(false);
      setTimeout(() => onAnswer(false), 900);
      return;
    }
    const t = setTimeout(() => setTimeLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [timed, timeLeft, answered, onAnswer]);

  function settle(correct: boolean) {
    setAnswered(correct);
    setTimeout(() => onAnswer(correct), 900);
  }

  // ---- Multiple choice -----------------------------------------------------
  const choices = useMemo(() => {
    if (mode !== "multiple" && mode !== "completion") return [];
    const distractors = shuffle(pool.filter((w) => w.rank !== word.rank))
      .slice(0, 3)
      .map((w) => (mode === "completion" ? w.german : w.english));
    const correct = mode === "completion" ? word.german : word.english;
    return shuffle([correct, ...distractors]);
  }, [word, pool, mode]);

  if (mode === "matching") {
    return <Matching word={word} pool={pool} onAnswer={onAnswer} />;
  }

  const prompt =
    mode === "multiple"
      ? word.german
      : mode === "completion"
      ? (word.exampleGerman || word.german).replace(word.german, "_____")
      : word.english;

  const correctValue = mode === "completion" ? word.german : word.english;

  return (
    <Card className="p-7">
      {timed && answered === null && (
        <div className="mb-4">
          <Progress value={(timeLeft / TIME_PER_Q) * 100} barClassName="bg-amber-500" />
        </div>
      )}

      <p className="text-sm text-fg-subtle">
        {mode === "typing"
          ? "Type the German word for:"
          : mode === "completion"
          ? "Complete the sentence:"
          : "What does this mean?"}
      </p>
      <div className="mt-2 text-3xl font-bold text-fg">{prompt}</div>
      {mode === "completion" && (
        <div className="mt-1 text-sm text-fg-muted">{word.exampleEnglish}</div>
      )}

      {/* Typing input */}
      {mode === "typing" ? (
        <div className="mt-6 space-y-3">
          <Input
            autoFocus
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && answered === null && typed.trim()) {
                settle(answersMatch(typed, word.german));
              }
            }}
            placeholder="Type in German…"
            disabled={answered !== null}
            className={cn(
              answered === true && "border-emerald-500",
              answered === false && "border-rose-500"
            )}
          />
          {answered === null ? (
            <Button
              className="w-full"
              disabled={!typed.trim()}
              onClick={() => settle(answersMatch(typed, word.german))}
            >
              Check
            </Button>
          ) : (
            <Feedback correct={answered} answer={correctValue} />
          )}
        </div>
      ) : (
        // Multiple choice / completion options
        <div className="mt-6 grid gap-2">
          {choices.map((choice) => {
            const isCorrect = choice === correctValue;
            const show = answered !== null;
            return (
              <button
                key={choice}
                disabled={show}
                onClick={() => {
                  setPicked(choice);
                  settle(isCorrect);
                }}
                className={cn(
                  "flex items-center justify-between rounded-2xl border p-4 text-left font-medium transition-colors",
                  !show && "border-line hover:bg-surface-2",
                  show && isCorrect && "border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
                  show && !isCorrect && picked === choice && "border-rose-500 bg-rose-500/10 text-rose-600 dark:text-rose-400",
                  show && !isCorrect && picked !== choice && "border-line opacity-60"
                )}
              >
                {choice}
                {show && isCorrect && <Check size={18} />}
                {show && !isCorrect && picked === choice && <X size={18} />}
              </button>
            );
          })}
        </div>
      )}
    </Card>
  );
}

function Feedback({ correct, answer }: { correct: boolean; answer: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "flex items-center gap-2 rounded-2xl p-4 text-sm font-medium",
        correct
          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
          : "bg-rose-500/10 text-rose-600 dark:text-rose-400"
      )}
    >
      {correct ? <Check size={18} /> : <X size={18} />}
      {correct ? "Correct!" : `Answer: ${answer}`}
    </motion.div>
  );
}

// ---- Matching mini-game -----------------------------------------------------

function Matching({
  word,
  pool,
  onAnswer,
}: {
  word: Word;
  pool: Word[];
  onAnswer: (correct: boolean) => void;
}) {
  // Build a set of 4 pairs including the current word.
  const pairs = useMemo(() => {
    const others = shuffle(pool.filter((w) => w.rank !== word.rank)).slice(0, 3);
    return shuffle([word, ...others]);
  }, [word, pool]);

  const [germanOrder] = useState(() => shuffle(pairs));
  const [englishOrder] = useState(() => shuffle(pairs));
  const [selectedG, setSelectedG] = useState<number | null>(null);
  const [matched, setMatched] = useState<Set<number>>(new Set());
  const [wrong, setWrong] = useState<number | null>(null);

  useEffect(() => {
    if (matched.size === pairs.length) {
      const t = setTimeout(() => onAnswer(true), 600);
      return () => clearTimeout(t);
    }
  }, [matched, pairs.length, onAnswer]);

  function pickEnglish(rank: number) {
    if (selectedG === null) return;
    if (selectedG === rank) {
      setMatched((m) => new Set(m).add(rank));
      setSelectedG(null);
    } else {
      setWrong(rank);
      setTimeout(() => setWrong(null), 500);
    }
  }

  return (
    <Card className="p-6">
      <p className="mb-4 text-sm text-fg-subtle">Tap a German word, then its meaning.</p>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          {germanOrder.map((w) => (
            <button
              key={w.rank}
              disabled={matched.has(w.rank)}
              onClick={() => setSelectedG(w.rank)}
              className={cn(
                "w-full rounded-2xl border p-3 text-sm font-medium transition-colors",
                matched.has(w.rank) && "border-emerald-500 bg-emerald-500/10 opacity-60",
                selectedG === w.rank && "border-brand-500 bg-brand-500/10",
                !matched.has(w.rank) && selectedG !== w.rank && "border-line hover:bg-surface-2"
              )}
            >
              {w.german}
            </button>
          ))}
        </div>
        <div className="space-y-2">
          {englishOrder.map((w) => (
            <button
              key={w.rank}
              disabled={matched.has(w.rank)}
              onClick={() => pickEnglish(w.rank)}
              className={cn(
                "w-full rounded-2xl border p-3 text-sm font-medium transition-colors",
                matched.has(w.rank) && "border-emerald-500 bg-emerald-500/10 opacity-60",
                wrong === w.rank && "border-rose-500 bg-rose-500/10",
                !matched.has(w.rank) && wrong !== w.rank && "border-line hover:bg-surface-2"
              )}
            >
              {w.english}
            </button>
          ))}
        </div>
      </div>
    </Card>
  );
}
