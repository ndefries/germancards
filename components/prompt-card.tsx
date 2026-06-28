"use client";

// ---------------------------------------------------------------------------
// PromptCard — the core study card.
//
// Front: large German word, pronunciation, level + part-of-speech badges,
//        a rotating creative "AI prompt", audio and favourite controls.
// Back (revealed on "Show Answer"): English meaning, example sentence with
//        translation, grammar note, memory tip and usage note.
// Grading buttons (Again / Hard / Medium / Easy) feed the Leitner scheduler.
//
// Keyboard shortcuts (when the card is focused):
//   Space          → flip (show answer)
//   1 / 2 / 3 / 4 → Again / Hard / Medium / Easy (after answer is shown)
// ---------------------------------------------------------------------------

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Volume2, Star, Shuffle, Eye, Sparkles, Loader2 } from "lucide-react";
import type { Grade, Word } from "@/types";
import { Badge, LevelBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/store";
import { promptFor, randomPromptTemplate } from "@/lib/prompts";
import { speakGerman } from "@/lib/speech";
import { generateExample, hasApiKey } from "@/lib/ai";
import { cn } from "@/lib/utils";

const GRADE_BUTTONS: { grade: Grade; label: string; variant: "danger" | "outline" | "secondary" | "success" }[] = [
  { grade: "again", label: "Again", variant: "danger" },
  { grade: "hard", label: "Hard", variant: "outline" },
  { grade: "medium", label: "Medium", variant: "secondary" },
  { grade: "easy", label: "Easy", variant: "success" },
];

export function PromptCard({
  word,
  onGraded,
  showGrading = true,
}: {
  word: Word;
  onGraded?: (grade: Grade) => void;
  showGrading?: boolean;
}) {
  const { settings, cardState, toggleFavourite, grade, markStudied } = useStore();
  const [revealed, setRevealed] = useState(false);
  const [template, setTemplate] = useState(randomPromptTemplate());
  const [aiExample, setAiExample] = useState<{ de: string; en: string } | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiEnabled, setAiEnabled] = useState(false);

  const state = cardState(word.rank);

  // Reset the card face + pick a fresh prompt whenever the word changes.
  useEffect(() => {
    setRevealed(false);
    setTemplate(randomPromptTemplate());
    setAiExample(null);
    setAiEnabled(hasApiKey());
    markStudied(word.rank);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [word.rank]);

  // Keyboard shortcuts: Space = flip, 1–4 = grade (only after answer shown).
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      // Don't fire when the user is typing in an input or textarea.
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      )
        return;

      if (e.code === "Space" && !revealed) {
        e.preventDefault();
        setRevealed(true);
        return;
      }

      if (revealed && showGrading) {
        if (e.key === "1") handleGrade("again");
        else if (e.key === "2") handleGrade("hard");
        else if (e.key === "3") handleGrade("medium");
        else if (e.key === "4") handleGrade("easy");
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [revealed, showGrading]);

  async function handleGenerate() {
    setAiLoading(true);
    const result = await generateExample(word.german, word.english);
    setAiExample(result); // null on failure → UI shows a gentle message
    setAiLoading(false);
  }

  function handleGrade(g: Grade) {
    grade(word.rank, g);
    onGraded?.(g);
  }

  const speak = (text: string, slow = false) =>
    speakGerman(text, slow ? 0.6 : settings.speechRate);

  return (
    <motion.div
      key={word.rank}
      initial={{ opacity: 0, y: 24, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -24, scale: 0.98 }}
      transition={{ type: "spring", stiffness: 260, damping: 26 }}
      className="relative w-full"
    >
      <div className="relative overflow-hidden rounded-[2rem] border border-line bg-gradient-to-br from-surface-1 to-surface-2 p-7 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.15)] sm:p-10">
        {/* Ambient gradient blob */}
        <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-brand-500/10 blur-3xl" />

        {/* Top row: badges + controls */}
        <div className="relative flex items-start justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <LevelBadge level={word.difficulty} />
            <Badge>{word.partOfSpeech}</Badge>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => speak(word.german)}
              aria-label="Play pronunciation"
              className="flex h-10 w-10 items-center justify-center rounded-xl text-fg-muted transition-colors hover:bg-surface-3 hover:text-brand-500"
            >
              <Volume2 size={20} />
            </button>
            <button
              type="button"
              onClick={() => toggleFavourite(word.rank)}
              aria-label={state.favourite ? "Remove from favourites" : "Add to favourites"}
              aria-pressed={state.favourite}
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-xl transition-colors hover:bg-surface-3",
                state.favourite ? "text-amber-500" : "text-fg-muted hover:text-amber-500"
              )}
            >
              <Star size={20} fill={state.favourite ? "currentColor" : "none"} />
            </button>
          </div>
        </div>

        {/* Headword */}
        <div className="relative mt-6 text-center">
          <h2 className="text-balance text-5xl font-bold tracking-tight text-fg sm:text-6xl">
            {word.german}
          </h2>
          {word.pronunciation && (
            <p className="mt-3 text-lg text-fg-subtle">{word.pronunciation}</p>
          )}
        </div>

        {/* Rotating AI prompt */}
        <div className="relative mt-6 flex items-center justify-center gap-2 rounded-2xl bg-surface-3/60 px-4 py-3 text-center text-sm text-fg-muted">
          <span className="font-medium text-brand-500">Prompt:</span>
          <span>{promptFor(word, template)}</span>
          <button
            type="button"
            onClick={() => setTemplate(randomPromptTemplate())}
            aria-label="New prompt"
            className="ml-1 text-fg-subtle transition-colors hover:text-brand-500"
          >
            <Shuffle size={15} />
          </button>
        </div>

        {/* Reveal */}
        <AnimatePresence mode="wait">
          {!revealed ? (
            <motion.div
              key="hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="relative mt-7"
            >
              <Button size="lg" className="w-full" onClick={() => setRevealed(true)}>
                <Eye size={18} /> Show answer
              </Button>
              <p className="mt-2 text-center text-xs text-fg-subtle">
                or press <kbd className="rounded border border-line bg-surface-3 px-1.5 py-0.5 font-mono text-xs">Space</kbd>
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="revealed"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="relative mt-7 space-y-4 overflow-hidden text-left"
            >
              <Detail label="English">
                <span className="text-xl font-semibold text-fg">{word.english}</span>
              </Detail>

              {word.exampleGerman && (
                <Detail label="Example">
                  <button
                    type="button"
                    onClick={() => speak(word.exampleGerman)}
                    className="group inline-flex items-start gap-2 text-left"
                  >
                    <Volume2 size={16} className="mt-1 shrink-0 text-fg-subtle group-hover:text-brand-500" />
                    <span>
                      <span className="font-medium text-fg">{word.exampleGerman}</span>
                      <span className="block text-sm text-fg-muted">{word.exampleEnglish}</span>
                    </span>
                  </button>
                </Detail>
              )}

              {word.grammarNote && (
                <Detail label="Grammar">
                  <span className="text-fg-muted">{word.grammarNote}</span>
                </Detail>
              )}

              <Detail label="Memory tip" accent>
                <span className="text-fg-muted">{word.memoryTip}</span>
              </Detail>

              {word.usageNote && (
                <Detail label="Usage">
                  <span className="text-fg-muted">{word.usageNote}</span>
                </Detail>
              )}

              {/* Optional AI-generated example (only when a key is configured) */}
              {aiEnabled && (
                <div className="rounded-2xl border border-brand-500/30 bg-brand-500/5 p-4">
                  <div className="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-brand-500">
                    <Sparkles size={13} /> AI example
                  </div>
                  {aiExample ? (
                    <div>
                      <span className="font-medium text-fg">{aiExample.de}</span>
                      <span className="block text-sm text-fg-muted">{aiExample.en}</span>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={handleGenerate}
                      disabled={aiLoading}
                      className="inline-flex items-center gap-2 text-sm font-medium text-brand-600 hover:underline disabled:opacity-60 dark:text-brand-400"
                    >
                      {aiLoading ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                      {aiLoading ? "Generating…" : "Generate a fresh example"}
                    </button>
                  )}
                </div>
              )}

              {/* Grading */}
              {showGrading && (
                <>
                  <div className="grid grid-cols-2 gap-2 pt-2 sm:grid-cols-4">
                    {GRADE_BUTTONS.map(({ grade: g, label, variant }, i) => (
                      <Button
                        key={g}
                        variant={variant}
                        size="sm"
                        onClick={() => handleGrade(g)}
                      >
                        <span className="mr-1 hidden rounded border border-current/30 px-1 py-0.5 font-mono text-[10px] opacity-60 sm:inline">
                          {i + 1}
                        </span>
                        {label}
                      </Button>
                    ))}
                  </div>
                  <p className="text-center text-xs text-fg-subtle">
                    Press <kbd className="rounded border border-line bg-surface-3 px-1.5 py-0.5 font-mono text-xs">1</kbd>–<kbd className="rounded border border-line bg-surface-3 px-1.5 py-0.5 font-mono text-xs">4</kbd> to grade
                  </p>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

/** A single labelled line on the answer side. */
function Detail({
  label,
  children,
  accent,
}: {
  label: string;
  children: React.ReactNode;
  accent?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-line bg-surface-1/60 p-4">
      <div
        className={cn(
          "mb-1 text-xs font-semibold uppercase tracking-wide",
          accent ? "text-amber-500" : "text-fg-subtle"
        )}
      >
        {label}
      </div>
      {children}
    </div>
  );
}
