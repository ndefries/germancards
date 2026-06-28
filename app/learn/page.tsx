"use client";

// Learn: browse the vocabulary by category (CEFR level, part of speech,
// favourites, recent), search, and open any word as a full Prompt Card.

import { Suspense, useMemo, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { X, Search } from "lucide-react";
import { useStore } from "@/lib/store";
import {
  CATEGORY_LABELS,
  searchWords,
  wordsForCategory,
  type Category,
} from "@/lib/data";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge, LevelBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PromptCard } from "@/components/prompt-card";
import { cn } from "@/lib/utils";
import type { Word } from "@/types";

const CATEGORIES: Category[] = [
  "A1", "A2", "B1", "B2",
  "nouns", "verbs", "adjectives", "adverbs", "pronouns",
  "favourites", "recent",
];

function LearnInner() {
  const params = useSearchParams();
  const { words, progress, cardState } = useStore();
  const [category, setCategory] = useState<Category>("A1");
  const [query, setQuery] = useState("");
  const [focus, setFocus] = useState<Word | null>(null);

  const favouriteRanks = useMemo(
    () => Object.values(progress.cards).filter((c) => c.favourite).map((c) => c.rank),
    [progress.cards]
  );

  // Open a specific word if the URL has ?focus=<rank> (used by home search).
  useEffect(() => {
    const f = params.get("focus");
    if (f) {
      const w = words.find((x) => x.rank === Number(f));
      if (w) setFocus(w);
    }
  }, [params, words]);

  const list = useMemo(() => {
    if (query.trim()) return searchWords(words, query);
    return wordsForCategory(words, category, {
      favouriteRanks,
      recentRanks: progress.recent,
    });
  }, [query, words, category, favouriteRanks, progress.recent]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-fg">Learn</h1>
        <p className="mt-1 text-fg-muted">Browse {words.length} words by category, or search.</p>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-fg-subtle" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search German, English, part of speech, tags…"
          className="pl-11"
          aria-label="Search words"
        />
      </div>

      {/* Category chips */}
      {!query && (
        <div className="flex flex-wrap gap-2" role="tablist" aria-label="Categories">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              role="tab"
              aria-selected={category === c}
              onClick={() => setCategory(c)}
              className={cn(
                "rounded-full px-4 py-2 text-sm font-medium transition-colors",
                category === c
                  ? "bg-brand-600 text-white shadow-lg shadow-brand-600/25"
                  : "bg-surface-2 text-fg-muted hover:bg-surface-3 hover:text-fg"
              )}
            >
              {CATEGORY_LABELS[c]}
            </button>
          ))}
        </div>
      )}

      {/* Word grid */}
      {list.length === 0 ? (
        <Card className="p-10 text-center text-fg-muted">
          {query
            ? "No matches. Try another search."
            : category === "favourites"
            ? "No favourites yet — tap the star on any card to save it."
            : "Nothing here yet."}
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((w, i) => {
            const s = cardState(w.rank);
            return (
              <motion.button
                key={w.rank}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.02, 0.3) }}
                onClick={() => setFocus(w)}
                className="group text-left"
              >
                <Card className="h-full p-5 transition-transform group-hover:-translate-y-1">
                  <div className="flex items-start justify-between">
                    <LevelBadge level={w.difficulty} />
                    {s.mastered && <Badge className="text-emerald-600">mastered</Badge>}
                  </div>
                  <div className="mt-3 text-2xl font-bold text-fg">{w.german}</div>
                  <div className="text-fg-muted">{w.english}</div>
                  <div className="mt-2 text-xs text-fg-subtle">{w.partOfSpeech}</div>
                </Card>
              </motion.button>
            );
          })}
        </div>
      )}

      {/* Focused card overlay */}
      <AnimatePresence>
        {focus && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 backdrop-blur-sm sm:items-center"
            onClick={() => setFocus(null)}
          >
            <div className="w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
              <div className="mb-3 flex justify-end">
                <Button variant="secondary" size="icon" onClick={() => setFocus(null)} aria-label="Close">
                  <X size={18} />
                </Button>
              </div>
              <PromptCard word={focus} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function LearnPage() {
  // useSearchParams requires a Suspense boundary in the app router.
  return (
    <Suspense fallback={<div className="text-fg-muted">Loading…</div>}>
      <LearnInner />
    </Suspense>
  );
}
