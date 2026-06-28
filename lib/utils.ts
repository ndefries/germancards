// Small shared helpers used throughout the UI.

/**
 * Conditional className joiner (a tiny `clsx` replacement so we add no deps).
 * Accepts strings, falsy values, and { className: boolean } maps.
 */
export function cn(
  ...inputs: Array<string | false | null | undefined | Record<string, boolean>>
): string {
  const out: string[] = [];
  for (const input of inputs) {
    if (!input) continue;
    if (typeof input === "string") {
      out.push(input);
    } else {
      for (const [key, active] of Object.entries(input)) {
        if (active) out.push(key);
      }
    }
  }
  return out.join(" ");
}

/** Today's date as an ISO `YYYY-MM-DD` string in the user's local timezone. */
export function todayISO(d: Date = new Date()): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** Difference in whole calendar days between two ISO date strings (b - a). */
export function dayDiff(aISO: string, bISO: string): number {
  const a = new Date(aISO + "T00:00:00");
  const b = new Date(bISO + "T00:00:00");
  return Math.round((b.getTime() - a.getTime()) / 86_400_000);
}

/** Fisher–Yates shuffle returning a new array. */
export function shuffle<T>(arr: readonly T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/** Pick a random element. */
export function sample<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Mulberry32 — a fast, seedable PRNG. Returns a value in [0, 1).
 * Used so the "word of the day" is stable for the whole calendar day.
 */
function mulberry32(seed: number): number {
  let t = (seed + 0x6d2b79f5) | 0;
  t = Math.imul(t ^ (t >>> 15), 1 | t);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

/** Pick an element deterministically from a seed value (same seed → same pick). */
export function seededSample<T>(arr: readonly T[], seed: number): T {
  return arr[Math.floor(mulberry32(seed) * arr.length)];
}

/** Today's date as a stable integer seed (YYYYMMDD). */
export function todaySeed(): number {
  return parseInt(todayISO().replace(/-/g, ""), 10);
}

/** Clamp a number to a range. */
export function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

/** Format a number of seconds as "1h 23m" / "12m" / "45s". */
export function formatDuration(totalSeconds: number): string {
  const s = Math.round(totalSeconds);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  return `${h}h ${m % 60}m`;
}

/**
 * Normalise a typed German answer for comparison: trims, lowercases and
 * collapses whitespace. We keep umlauts intact (ö ≠ o) but tolerate the
 * common "oe/ae/ue/ss" transliterations as equivalents.
 */
export function normaliseAnswer(input: string): string {
  return input.trim().toLowerCase().replace(/\s+/g, " ");
}

/** True if a typed answer matches the target, allowing ae/oe/ue/ss spellings. */
export function answersMatch(input: string, target: string): boolean {
  const a = normaliseAnswer(input);
  const b = normaliseAnswer(target);
  if (a === b) return true;
  const expand = (s: string) =>
    s
      .replace(/ä/g, "ae")
      .replace(/ö/g, "oe")
      .replace(/ü/g, "ue")
      .replace(/ß/g, "ss");
  return expand(a) === expand(b);
}
