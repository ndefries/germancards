"use client";

// Statistics dashboard: charts driven entirely by locally-stored progress.
//   • Daily XP / reviews (last 14 days)
//   • Accuracy over time
//   • Mastery by CEFR level
//   • Words remaining
//   • Most difficult words
//   • Favourite categories (by part of speech among favourites)

import { useMemo } from "react";
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Line, LineChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { Flame, Target, Clock, Trophy } from "lucide-react";
import { useStore } from "@/lib/store";
import { Card } from "@/components/ui/card";
import { StatCard } from "@/components/stat-card";
import { LevelBadge } from "@/components/ui/badge";
import { formatDuration, todayISO } from "@/lib/utils";
import type { Difficulty } from "@/types";

const BRAND = "#6366f1";
const LEVELS: Difficulty[] = ["A1", "A2", "B1", "B2"];
const LEVEL_COLORS: Record<Difficulty, string> = {
  A1: "#10b981", A2: "#0ea5e9", B1: "#f59e0b", B2: "#f43f5e",
};

export default function StatisticsPage() {
  const { hydrated, words, progress, stats } = useStore();

  // Last 14 days of activity (filling gaps with zeroes).
  const daily = useMemo(() => {
    const out: { day: string; xp: number; reviews: number; accuracy: number }[] = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const iso = todayISO(d);
      const stat = progress.days[iso];
      out.push({
        day: iso.slice(5), // MM-DD
        xp: stat?.xp ?? 0,
        reviews: stat?.reviewed ?? 0,
        accuracy: stat && stat.reviewed ? Math.round((stat.correct / stat.reviewed) * 100) : 0,
      });
    }
    return out;
  }, [progress.days]);

  // Mastery grouped by level.
  const masteryByLevel = useMemo(() => {
    return LEVELS.map((lvl) => {
      const inLevel = words.filter((w) => w.difficulty === lvl);
      const mastered = inLevel.filter((w) => progress.cards[w.rank]?.mastered).length;
      return { level: lvl, mastered, total: inLevel.length };
    }).filter((d) => d.total > 0);
  }, [words, progress.cards]);

  // Hardest words: most "again" grades relative to reviews.
  const hardest = useMemo(() => {
    const byRank = new Map(words.map((w) => [w.rank, w]));
    return Object.values(progress.cards)
      .filter((c) => c.reviews >= 2)
      .map((c) => ({
        word: byRank.get(c.rank),
        miss: c.reviews - c.correct,
        reviews: c.reviews,
      }))
      .filter((d) => d.word && d.miss > 0)
      .sort((a, b) => b.miss - a.miss)
      .slice(0, 5);
  }, [words, progress.cards]);

  // Favourite categories by part of speech among favourited cards.
  const favCats = useMemo(() => {
    const byRank = new Map(words.map((w) => [w.rank, w]));
    const counts: Record<string, number> = {};
    Object.values(progress.cards)
      .filter((c) => c.favourite)
      .forEach((c) => {
        const w = byRank.get(c.rank);
        if (w) counts[w.partOfSpeech] = (counts[w.partOfSpeech] ?? 0) + 1;
      });
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [words, progress.cards]);

  if (!hydrated) return <div className="text-fg-muted">Loading statistics…</div>;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-fg">Statistics</h1>
        <p className="mt-1 text-fg-muted">Your progress, computed from this browser.</p>
      </div>

      {/* Headline metrics */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={<Flame size={18} />} accent="text-orange-500" label="Current streak"
          value={`${progress.currentStreak}`} sublabel={`Longest ${progress.longestStreak} days`} />
        <StatCard icon={<Target size={18} />} accent="text-brand-500" label="Words learned"
          value={stats.learned} sublabel={`${stats.mastered} mastered`} />
        <StatCard icon={<Trophy size={18} />} accent="text-emerald-500" label="Accuracy"
          value={`${stats.accuracy}%`} sublabel="all reviews" />
        <StatCard icon={<Clock size={18} />} accent="text-sky-500" label="Study time"
          value={formatDuration(stats.studySecondsTotal)} sublabel="total" />
      </div>

      {/* Daily XP */}
      <Card className="p-6">
        <h2 className="mb-4 text-sm font-semibold text-fg">Daily XP (14 days)</h2>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={daily}>
            <defs>
              <linearGradient id="xpFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={BRAND} stopOpacity={0.5} />
                <stop offset="100%" stopColor={BRAND} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--line))" />
            <XAxis dataKey="day" stroke="rgb(var(--fg-subtle))" fontSize={11} tickMargin={8} />
            <YAxis stroke="rgb(var(--fg-subtle))" fontSize={11} width={28} />
            <Tooltip
              contentStyle={{
                background: "rgb(var(--surface-1))",
                border: "1px solid rgb(var(--line))",
                borderRadius: 16,
                color: "rgb(var(--fg))",
              }}
            />
            <Area type="monotone" dataKey="xp" stroke={BRAND} strokeWidth={2} fill="url(#xpFill)" />
          </AreaChart>
        </ResponsiveContainer>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Accuracy over time */}
        <Card className="p-6">
          <h2 className="mb-4 text-sm font-semibold text-fg">Accuracy over time</h2>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={daily}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--line))" />
              <XAxis dataKey="day" stroke="rgb(var(--fg-subtle))" fontSize={11} tickMargin={8} />
              <YAxis domain={[0, 100]} stroke="rgb(var(--fg-subtle))" fontSize={11} width={32} />
              <Tooltip
                contentStyle={{
                  background: "rgb(var(--surface-1))",
                  border: "1px solid rgb(var(--line))",
                  borderRadius: 16, color: "rgb(var(--fg))",
                }}
              />
              <Line type="monotone" dataKey="accuracy" stroke="#10b981" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* Mastery by level */}
        <Card className="p-6">
          <h2 className="mb-4 text-sm font-semibold text-fg">Mastery by level</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={masteryByLevel}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--line))" />
              <XAxis dataKey="level" stroke="rgb(var(--fg-subtle))" fontSize={11} tickMargin={8} />
              <YAxis stroke="rgb(var(--fg-subtle))" fontSize={11} width={28} />
              <Tooltip
                cursor={{ fill: "rgb(var(--surface-2))" }}
                contentStyle={{
                  background: "rgb(var(--surface-1))",
                  border: "1px solid rgb(var(--line))",
                  borderRadius: 16, color: "rgb(var(--fg))",
                }}
              />
              <Bar dataKey="mastered" radius={[8, 8, 0, 0]}>
                {masteryByLevel.map((d) => (
                  <Cell key={d.level} fill={LEVEL_COLORS[d.level as Difficulty]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Words remaining */}
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-fg">Words remaining to master</h2>
          <span className="text-sm text-fg-muted">{stats.remaining} of {stats.total}</span>
        </div>
        <div className="mt-3 h-3 w-full overflow-hidden rounded-full bg-surface-3">
          <div
            className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all"
            style={{ width: `${stats.completion}%` }}
          />
        </div>
        <p className="mt-2 text-xs text-fg-subtle">{stats.completion}% mastered</p>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Hardest words */}
        <Card className="p-6">
          <h2 className="mb-4 text-sm font-semibold text-fg">Most difficult words</h2>
          {hardest.length ? (
            <ul className="space-y-2">
              {hardest.map((d) => (
                <li key={d.word!.rank} className="flex items-center justify-between rounded-2xl bg-surface-2 px-4 py-2.5">
                  <span>
                    <span className="font-medium text-fg">{d.word!.german}</span>
                    <span className="ml-2 text-sm text-fg-muted">{d.word!.english}</span>
                  </span>
                  <span className="text-xs text-rose-500">{d.miss} miss{d.miss > 1 ? "es" : ""}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-fg-muted">No tricky words yet — keep reviewing.</p>
          )}
        </Card>

        {/* Favourite categories */}
        <Card className="p-6">
          <h2 className="mb-4 text-sm font-semibold text-fg">Favourite categories</h2>
          {favCats.length ? (
            <ul className="space-y-3">
              {favCats.map((c) => (
                <li key={c.name}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span className="capitalize text-fg">{c.name}</span>
                    <span className="text-fg-muted">{c.value}</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-surface-3">
                    <div
                      className="h-full rounded-full bg-brand-500"
                      style={{ width: `${(c.value / favCats[0].value) * 100}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-fg-muted">Star some words to see your favourite categories.</p>
          )}
        </Card>
      </div>
    </div>
  );
}
