"use client";

// Flashcards: a spaced-repetition review session. Pulls due cards first, lets
// the learner grade each one (Again/Hard/Medium/Easy), animates between cards
// and fires confetti when the session is complete.
//
// Session is built after hydration so the SRS due-card data from localStorage
// is available when prioritising the queue.

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { RotateCcw, Trophy, ArrowRight } from "lucide-react";
import { useStore, useStudyTimer } from "@/lib/store";
import { PromptCard } from "@/components/prompt-card";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Confetti } from "@/components/confetti";
import { shuffle } from "@/lib/utils";
import type { Grade, Word } from "@/types";

export default function FlashcardsPage() {
  useStudyTimer(); // credit time spent here toward the study-time stat
  const { words, dueWords, hydrated, settings } = useStore();

  // Session is null until hydration so the SRS card states are loaded first.
  const [session, setSession] = useState<Word[] | null>(null);

  useEffect(() => {
    if (!hydrated) return;
    const due = dueWords();
    const pool = due.length >= 5 ? due : words;
    const size = settings.sessionSize ?? 20;
    setSession(shuffle(pool).slice(0, size));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated]);

  const [index, setIndex] = useState(0);
  const [fire, setFire] = useState(0);
  const [counts, setCounts] = useState<Record<Grade, number>>({
    again: 0, hard: 0, medium: 0, easy: 0,
  });

  const finished = session !== null && index >= session.length;
  const progressPct = useMemo(
    () => (session?.length ? (index / session.length) * 100 : 0),
    [index, session]
  );

  function handleGraded(g: Grade) {
    setCounts((c) => ({ ...c, [g]: c[g] + 1 }));
    const next = index + 1;
    if (session && next >= session.length) setFire((f) => f + 1);
    setTimeout(() => setIndex(next), 180);
  }

  function restart() {
    window.location.reload();
  }

  if (!hydrated || session === null) {
    return <div className="text-fg-muted">Loading session…</div>;
  }

  if (session.length === 0) {
    return (
      <Card className="p-10 text-center">
        <p className="text-fg-muted">No cards available. Import a dataset in Settings.</p>
      </Card>
    );
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <Confetti fire={fire} />

      {/* Progress header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-fg">Flashcards</h1>
        <span className="text-sm text-fg-muted">
          {Math.min(index + 1, session.length)} / {session.length}
        </span>
      </div>
      <Progress value={finished ? 100 : progressPct} />

      {finished ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <Card className="p-10 text-center">
            <Trophy size={48} className="mx-auto text-amber-500" />
            <h2 className="mt-4 text-2xl font-bold text-fg">Session complete!</h2>
            <p className="mt-1 text-fg-muted">
              You reviewed {session.length} cards. Nicely done.
            </p>
            <div className="mx-auto mt-6 grid max-w-xs grid-cols-4 gap-2 text-center text-sm">
              <Tally label="Again" value={counts.again} className="text-rose-500" />
              <Tally label="Hard" value={counts.hard} className="text-fg-muted" />
              <Tally label="Medium" value={counts.medium} className="text-brand-500" />
              <Tally label="Easy" value={counts.easy} className="text-emerald-500" />
            </div>
            <div className="mt-8 flex justify-center gap-3">
              <Button onClick={restart}>
                <RotateCcw size={18} /> New session
              </Button>
              <Link href="/statistics">
                <Button variant="secondary">
                  View stats <ArrowRight size={16} />
                </Button>
              </Link>
            </div>
          </Card>
        </motion.div>
      ) : (
        <AnimatePresence mode="wait">
          <PromptCard key={session[index].rank} word={session[index]} onGraded={handleGraded} />
        </AnimatePresence>
      )}
    </div>
  );
}

function Tally({ label, value, className }: { label: string; value: number; className?: string }) {
  return (
    <div className="rounded-2xl bg-surface-2 p-3">
      <div className={`text-2xl font-bold ${className ?? ""}`}>{value}</div>
      <div className="text-xs text-fg-subtle">{label}</div>
    </div>
  );
}
