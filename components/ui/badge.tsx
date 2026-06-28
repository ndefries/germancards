import { type HTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import type { Difficulty } from "@/types";

const LEVEL_STYLES: Record<Difficulty, string> = {
  A1: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 ring-emerald-500/30",
  A2: "bg-sky-500/15 text-sky-600 dark:text-sky-400 ring-sky-500/30",
  B1: "bg-amber-500/15 text-amber-600 dark:text-amber-400 ring-amber-500/30",
  B2: "bg-rose-500/15 text-rose-600 dark:text-rose-400 ring-rose-500/30",
};

/** Coloured CEFR level chip. */
export function LevelBadge({ level, className }: { level: Difficulty; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset",
        LEVEL_STYLES[level],
        className
      )}
    >
      {level}
    </span>
  );
}

/** Neutral pill (part of speech, tags, etc.). */
export function Badge({ className, ...props }: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full bg-surface-2 px-2.5 py-0.5 text-xs font-medium text-fg-muted ring-1 ring-inset ring-line",
        className
      )}
      {...props}
    />
  );
}
