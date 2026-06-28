"use client";

// Writing: show the English meaning, the learner types the German word, and
// gets instant character-level feedback highlighting where they diverged.

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Check, ArrowRight, Volume2 } from "lucide-react";
import { useStore, useStudyTimer } from "@/lib/store";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { speakGerman } from "@/lib/speech";
import { answersMatch, cn, shuffle } from "@/lib/utils";

export default function WritingPage() {
  useStudyTimer();
  const { words, settings, grade, hydrated } = useStore();
  const session = useMemo(() => shuffle(words).slice(0, 15), [words]);
  const [index, setIndex] = useState(0);
  const [value, setValue] = useState("");
  const [checked, setChecked] = useState(false);

  if (!hydrated) return <div className="text-fg-muted">Loading…</div>;
  const word = session[index];

  if (index >= session.length) {
    return (
      <Card className="mx-auto max-w-lg p-10 text-center">
        <Check size={44} className="mx-auto text-emerald-500" />
        <h2 className="mt-3 text-2xl font-bold text-fg">Writing complete!</h2>
        <Button className="mt-6" onClick={() => setIndex(0)}>Practice again</Button>
      </Card>
    );
  }

  const correct = checked && answersMatch(value, word.german);

  function check() {
    setChecked(true);
    grade(word.rank, answersMatch(value, word.german) ? "easy" : "again");
  }
  function next() {
    setValue("");
    setChecked(false);
    setIndex((i) => i + 1);
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-fg">Writing</h1>
        <span className="text-sm text-fg-muted">{index + 1} / {session.length}</span>
      </div>
      <Progress value={(index / session.length) * 100} />

      <motion.div key={index} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="p-8">
          <p className="text-sm text-fg-subtle">Write this word in German:</p>
          <div className="mt-2 text-3xl font-bold text-fg">{word.english}</div>
          <div className="mt-1 text-sm text-fg-muted">{word.partOfSpeech}</div>

          <div className="mt-6 space-y-3">
            <Input
              autoFocus
              value={value}
              disabled={checked}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !checked && value.trim()) check();
              }}
              placeholder="Type in German…"
              className={cn(
                checked && correct && "border-emerald-500",
                checked && !correct && "border-rose-500"
              )}
            />

            {checked && (
              <div className="space-y-3">
                {/* Character-level diff */}
                <div className="rounded-2xl bg-surface-2 p-4">
                  <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-fg-subtle">
                    {correct ? "Correct" : "Correct spelling"}
                  </div>
                  <Diff target={word.german} attempt={value} />
                  <button
                    onClick={() => speakGerman(word.german, settings.speechRate)}
                    className="mt-2 inline-flex items-center gap-1.5 text-sm text-fg-muted hover:text-brand-500"
                  >
                    <Volume2 size={14} /> Hear it
                  </button>
                </div>
              </div>
            )}

            {!checked ? (
              <Button className="w-full" disabled={!value.trim()} onClick={check}>
                Check
              </Button>
            ) : (
              <Button className="w-full" onClick={next}>
                Next <ArrowRight size={16} />
              </Button>
            )}
          </div>
        </Card>
      </motion.div>
    </div>
  );
}

/** Render the target word, colouring each character green/red vs the attempt. */
function Diff({ target, attempt }: { target: string; attempt: string }) {
  const a = attempt.trim().toLowerCase();
  return (
    <div className="text-xl font-semibold tracking-wide">
      {target.split("").map((ch, i) => {
        const ok = a[i]?.toLowerCase() === ch.toLowerCase();
        return (
          <span key={i} className={ok ? "text-emerald-500" : "text-rose-500"}>
            {ch}
          </span>
        );
      })}
    </div>
  );
}
