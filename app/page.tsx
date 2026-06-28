"use client";

// Home / landing page: hero, daily-goal ring, streak, XP, completion, search,
// recently-studied words and a daily challenge — all from the brief.

import Link from "next/link";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Flame,
  Sparkles,
  Trophy,
  Target,
  Search,
  ArrowRight,
  Layers,
  Zap,
} from "lucide-react";
import { useStore } from "@/lib/store";
import { searchWords } from "@/lib/data";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { LevelBadge } from "@/components/ui/badge";
import { StatCard } from "@/components/stat-card";
import { seededSample, todaySeed } from "@/lib/utils";

export default function HomePage() {
  const { hydrated, words, stats, progress, settings } = useStore();
  const [query, setQuery] = useState("");

  const results = useMemo(
    () => (query ? searchWords(words, query).slice(0, 6) : []),
    [query, words]
  );

  const recent = useMemo(() => {
    const byRank = new Map(words.map((w) => [w.rank, w]));
    return progress.recent
      .map((r) => byRank.get(r))
      .filter(Boolean)
      .slice(0, 5);
  }, [progress.recent, words]);

  // Daily challenge word: seeded by today's date so it stays the same all day.
  const daily = useMemo(() => seededSample(words, todaySeed()), [words]);

  const goalProgress = settings.dailyGoal
    ? Math.min(100, (stats.reviewedToday / settings.dailyGoal) * 100)
    : 0;

  return (
    <div className="space-y-10">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-[2.5rem] border border-line bg-gradient-to-br from-surface-1 to-surface-2 p-8 sm:p-12">
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-brand-500/15 blur-3xl" />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative max-w-2xl"
        >
          <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-500/10 px-3 py-1 text-sm font-medium text-brand-600 dark:text-brand-400">
            <Sparkles size={14} /> Lerne Deutsch
          </span>
          <h1 className="mt-4 text-balance text-4xl font-bold tracking-tight text-fg sm:text-5xl">
            Master German, one prompt card at a time.
          </h1>
          <p className="mt-4 text-pretty text-lg text-fg-muted">
            Spaced-repetition flashcards, quizzes, listening and writing practice
            for the most common German words — all in your browser.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link href="/flashcards">
              <Button size="lg">
                Continue learning <ArrowRight size={18} />
              </Button>
            </Link>
            <Link href="/learn">
              <Button size="lg" variant="secondary">
                <Layers size={18} /> Browse words
              </Button>
            </Link>
          </div>

          {/* Search */}
          <div className="relative mt-8 max-w-md">
            <Search
              size={18}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-fg-subtle"
            />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search German, English, tags…"
              className="pl-11"
              aria-label="Search words"
            />
            {results.length > 0 && (
              <Card className="absolute z-20 mt-2 w-full overflow-hidden p-1">
                {results.map((w) => (
                  <Link
                    key={w!.rank}
                    href={`/learn?focus=${w!.rank}`}
                    className="flex items-center justify-between rounded-2xl px-3 py-2 hover:bg-surface-2"
                  >
                    <span>
                      <span className="font-medium text-fg">{w!.german}</span>
                      <span className="ml-2 text-sm text-fg-muted">{w!.english}</span>
                    </span>
                    <LevelBadge level={w!.difficulty} />
                  </Link>
                ))}
              </Card>
            )}
          </div>
        </motion.div>
      </section>

      {/* Daily goal + key stats */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-5 sm:col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-fg-muted">Daily goal</span>
            <Target size={18} className="text-brand-500" />
          </div>
          <div className="mt-2 text-3xl font-bold text-fg">
            {hydrated ? stats.reviewedToday : 0}
            <span className="text-lg font-medium text-fg-subtle"> / {settings.dailyGoal}</span>
          </div>
          <Progress value={hydrated ? goalProgress : 0} className="mt-3" />
        </Card>

        <StatCard
          icon={<Flame size={18} />}
          accent="text-orange-500"
          label="Study streak"
          value={hydrated ? `${progress.currentStreak} 🔥` : "0"}
          sublabel={`Longest: ${hydrated ? progress.longestStreak : 0} days`}
        />
        <StatCard
          icon={<Zap size={18} />}
          accent="text-amber-500"
          label="Total XP"
          value={hydrated ? progress.xp.toLocaleString() : 0}
          sublabel={`Accuracy ${hydrated ? stats.accuracy : 0}%`}
        />
        <StatCard
          icon={<Trophy size={18} />}
          accent="text-emerald-500"
          label="Completion"
          value={`${hydrated ? stats.completion : 0}%`}
          sublabel={`${hydrated ? stats.mastered : 0} of ${stats.total} mastered`}
        />
      </section>

      {/* Daily challenge + recently studied */}
      <section className="grid gap-4 lg:grid-cols-2">
        <Card className="p-6">
          <div className="flex items-center gap-2 text-sm font-semibold text-fg">
            <Sparkles size={16} className="text-brand-500" /> Daily challenge
          </div>
          {daily && (
            <div className="mt-4 flex items-end justify-between">
              <div>
                <div className="text-3xl font-bold text-fg">{daily.german}</div>
                <div className="mt-1 text-fg-muted">Can you recall the meaning?</div>
              </div>
              <LevelBadge level={daily.difficulty} />
            </div>
          )}
          <Link href="/flashcards" className="mt-5 inline-block">
            <Button variant="secondary" size="sm">
              Start challenge <ArrowRight size={16} />
            </Button>
          </Link>
        </Card>

        <Card className="p-6">
          <div className="text-sm font-semibold text-fg">Recently studied</div>
          {hydrated && recent.length > 0 ? (
            <ul className="mt-4 space-y-2">
              {recent.map((w) => (
                <li
                  key={w!.rank}
                  className="flex items-center justify-between rounded-2xl bg-surface-2 px-4 py-2.5"
                >
                  <span>
                    <span className="font-medium text-fg">{w!.german}</span>
                    <span className="ml-2 text-sm text-fg-muted">{w!.english}</span>
                  </span>
                  <LevelBadge level={w!.difficulty} />
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-sm text-fg-muted">
              Nothing yet — study a few cards and they’ll show up here.
            </p>
          )}
        </Card>
      </section>
    </div>
  );
}
