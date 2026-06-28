"use client";

// ---------------------------------------------------------------------------
// Global learner store.
//
// One React context holds everything that persists: the active word list
// (built-in or user-imported), per-card SRS state, progress, streaks and
// settings. Everything is mirrored to localStorage so the app needs no backend.
// ---------------------------------------------------------------------------

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type {
  CardState,
  Grade,
  ProgressData,
  Settings,
  Word,
} from "@/types";
import { BUILT_IN_WORDS } from "@/lib/data";
import { gradeCard, isDue, newCardState, xpForGrade } from "@/lib/srs";
import { dayDiff, todayISO } from "@/lib/utils";

const PROGRESS_KEY = "sprachkarten:progress:v1";
const WORDS_KEY = "sprachkarten:words:v1";

const DEFAULT_SETTINGS: Settings = {
  darkMode: false,
  dailyGoal: 20,
  speechRate: 1,
  quizDifficulty: "all",
  notifications: false,
  reducedMotion: false,
  sessionSize: 20,
};

function defaultProgress(): ProgressData {
  return {
    xp: 0,
    currentStreak: 0,
    longestStreak: 0,
    lastStudyDate: null,
    cards: {},
    days: {},
    recent: [],
    settings: { ...DEFAULT_SETTINGS },
  };
}

/** Derived, read-only stats computed from progress + the active word list. */
export interface DerivedStats {
  total: number;
  learned: number; // any card reviewed at least once
  mastered: number;
  remaining: number;
  completion: number; // 0..100 mastered/total
  accuracy: number; // 0..100 across all reviews
  reviewedToday: number;
  dueCount: number;
  studySecondsTotal: number;
}

interface StoreValue {
  hydrated: boolean;
  words: Word[];
  isCustomDataset: boolean;
  progress: ProgressData;
  settings: Settings;
  stats: DerivedStats;
  cardState: (rank: number) => CardState;
  dueWords: (pool?: Word[]) => Word[];
  grade: (rank: number, grade: Grade) => void;
  toggleFavourite: (rank: number) => void;
  markStudied: (rank: number) => void;
  addStudyTime: (seconds: number) => void;
  updateSettings: (patch: Partial<Settings>) => void;
  resetProgress: () => void;
  exportProgress: () => string;
  importProgress: (json: string) => void;
  setWords: (words: Word[]) => void;
  resetWords: () => void;
}

const StoreContext = createContext<StoreValue | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [progress, setProgress] = useState<ProgressData>(defaultProgress);
  const [words, setWordsState] = useState<Word[]>(BUILT_IN_WORDS);
  const [isCustomDataset, setIsCustomDataset] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  // ---- Hydrate from localStorage once on mount -----------------------------
  useEffect(() => {
    try {
      const p = window.localStorage.getItem(PROGRESS_KEY);
      if (p) {
        const parsed = JSON.parse(p) as ProgressData;
        // Merge settings so newly-added settings keys get defaults.
        parsed.settings = { ...DEFAULT_SETTINGS, ...parsed.settings };
        setProgress(parsed);
      }
    } catch {
      /* keep defaults */
    }
    try {
      const w = window.localStorage.getItem(WORDS_KEY);
      if (w) {
        const parsed = JSON.parse(w) as Word[];
        if (Array.isArray(parsed) && parsed.length) {
          setWordsState(parsed);
          setIsCustomDataset(true);
        }
      }
    } catch {
      /* keep built-in */
    }
    setHydrated(true);
  }, []);

  // ---- Persist progress whenever it changes (after hydration) --------------
  const persist = useCallback(
    (next: ProgressData) => {
      setProgress(next);
      try {
        window.localStorage.setItem(PROGRESS_KEY, JSON.stringify(next));
      } catch {
        /* storage unavailable */
      }
    },
    []
  );

  // ---- Apply dark mode + reduced motion to the document --------------------
  useEffect(() => {
    if (!hydrated) return;
    const root = document.documentElement;
    root.classList.toggle("dark", progress.settings.darkMode);
    root.classList.toggle("reduce-motion", progress.settings.reducedMotion);
  }, [hydrated, progress.settings.darkMode, progress.settings.reducedMotion]);

  // ---- Helpers -------------------------------------------------------------
  const cardState = useCallback(
    (rank: number): CardState => progress.cards[rank] ?? newCardState(rank),
    [progress.cards]
  );

  /** Roll the streak forward based on the gap since the last study day. */
  function applyStreak(p: ProgressData): ProgressData {
    const today = todayISO();
    if (p.lastStudyDate === today) return p; // already counted today
    let current = p.currentStreak;
    if (p.lastStudyDate === null) {
      current = 1;
    } else {
      const gap = dayDiff(p.lastStudyDate, today);
      current = gap === 1 ? p.currentStreak + 1 : 1; // consecutive vs reset
    }
    return {
      ...p,
      currentStreak: current,
      longestStreak: Math.max(p.longestStreak, current),
      lastStudyDate: today,
    };
  }

  function touchToday(p: ProgressData): ProgressData {
    const today = todayISO();
    const day = p.days[today] ?? {
      date: today,
      xp: 0,
      reviewed: 0,
      correct: 0,
      studySeconds: 0,
    };
    return { ...p, days: { ...p.days, [today]: day } };
  }

  // ---- Public actions ------------------------------------------------------
  const grade = useCallback(
    (rank: number, g: Grade) => {
      setProgress((prev) => {
        let next = applyStreak(prev);
        next = touchToday(next);
        const today = todayISO();

        const current = next.cards[rank] ?? newCardState(rank);
        const updated = gradeCard(current, g);
        const gainedXp = xpForGrade(g);
        const isCorrect = g === "medium" || g === "easy";

        const day = next.days[today];
        const newDay = {
          ...day,
          xp: day.xp + gainedXp,
          reviewed: day.reviewed + 1,
          correct: day.correct + (isCorrect ? 1 : 0),
        };

        const recent = [rank, ...next.recent.filter((r) => r !== rank)].slice(0, 50);

        const result: ProgressData = {
          ...next,
          xp: next.xp + gainedXp,
          cards: { ...next.cards, [rank]: updated },
          days: { ...next.days, [today]: newDay },
          recent,
        };
        try {
          window.localStorage.setItem(PROGRESS_KEY, JSON.stringify(result));
        } catch {
          /* ignore */
        }
        return result;
      });
    },
    []
  );

  const toggleFavourite = useCallback((rank: number) => {
    setProgress((prev) => {
      const current = prev.cards[rank] ?? newCardState(rank);
      const updated = { ...current, favourite: !current.favourite };
      const result = { ...prev, cards: { ...prev.cards, [rank]: updated } };
      try {
        window.localStorage.setItem(PROGRESS_KEY, JSON.stringify(result));
      } catch {
        /* ignore */
      }
      return result;
    });
  }, []);

  const markStudied = useCallback((rank: number) => {
    setProgress((prev) => {
      const recent = [rank, ...prev.recent.filter((r) => r !== rank)].slice(0, 50);
      const result = { ...prev, recent };
      try {
        window.localStorage.setItem(PROGRESS_KEY, JSON.stringify(result));
      } catch {
        /* ignore */
      }
      return result;
    });
  }, []);

  const addStudyTime = useCallback((seconds: number) => {
    if (seconds <= 0) return;
    setProgress((prev) => {
      let next = touchToday(prev);
      const today = todayISO();
      const day = next.days[today];
      next = {
        ...next,
        days: {
          ...next.days,
          [today]: { ...day, studySeconds: day.studySeconds + seconds },
        },
      };
      try {
        window.localStorage.setItem(PROGRESS_KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  const updateSettings = useCallback(
    (patch: Partial<Settings>) => {
      setProgress((prev) => {
        const result = { ...prev, settings: { ...prev.settings, ...patch } };
        try {
          window.localStorage.setItem(PROGRESS_KEY, JSON.stringify(result));
        } catch {
          /* ignore */
        }
        return result;
      });
    },
    []
  );

  const resetProgress = useCallback(() => {
    const fresh = defaultProgress();
    // Preserve the user's display preferences across a progress reset.
    fresh.settings = { ...progress.settings };
    persist(fresh);
  }, [persist, progress.settings]);

  const exportProgress = useCallback(
    () => JSON.stringify(progress, null, 2),
    [progress]
  );

  const importProgress = useCallback(
    (json: string) => {
      const parsed = JSON.parse(json) as ProgressData;
      parsed.settings = { ...DEFAULT_SETTINGS, ...parsed.settings };
      persist(parsed);
    },
    [persist]
  );

  const setWords = useCallback((next: Word[]) => {
    setWordsState(next);
    setIsCustomDataset(true);
    try {
      window.localStorage.setItem(WORDS_KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
  }, []);

  const resetWords = useCallback(() => {
    setWordsState(BUILT_IN_WORDS);
    setIsCustomDataset(false);
    try {
      window.localStorage.removeItem(WORDS_KEY);
    } catch {
      /* ignore */
    }
  }, []);

  const dueWords = useCallback(
    (pool: Word[] = words) => {
      const now = Date.now();
      return pool.filter((w) => {
        const s = progress.cards[w.rank];
        return !s || isDue(s, now);
      });
    },
    [words, progress.cards]
  );

  // ---- Derived stats -------------------------------------------------------
  const stats = useMemo<DerivedStats>(() => {
    const total = words.length;
    const cardStates = Object.values(progress.cards);
    const learned = cardStates.filter((c) => c.reviews > 0).length;
    const mastered = cardStates.filter((c) => c.mastered).length;
    const totalReviews = cardStates.reduce((a, c) => a + c.reviews, 0);
    const totalCorrect = cardStates.reduce((a, c) => a + c.correct, 0);
    const today = todayISO();
    const reviewedToday = progress.days[today]?.reviewed ?? 0;
    const studySecondsTotal = Object.values(progress.days).reduce(
      (a, d) => a + d.studySeconds,
      0
    );
    const now = Date.now();
    const dueCount = words.filter((w) => {
      const s = progress.cards[w.rank];
      return !s || isDue(s, now);
    }).length;
    return {
      total,
      learned,
      mastered,
      remaining: Math.max(0, total - mastered),
      completion: total ? Math.round((mastered / total) * 100) : 0,
      accuracy: totalReviews ? Math.round((totalCorrect / totalReviews) * 100) : 0,
      reviewedToday,
      dueCount,
      studySecondsTotal,
    };
  }, [words, progress.cards, progress.days]);

  const value: StoreValue = {
    hydrated,
    words,
    isCustomDataset,
    progress,
    settings: progress.settings,
    stats,
    cardState,
    dueWords,
    grade,
    toggleFavourite,
    markStudied,
    addStudyTime,
    updateSettings,
    resetProgress,
    exportProgress,
    importProgress,
    setWords,
    resetWords,
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

/** Access the global store. Throws if used outside the provider. */
export function useStore(): StoreValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within <StoreProvider>.");
  return ctx;
}

/**
 * Track elapsed time on a page and credit it as study time on unmount.
 * Used by practice modes to populate the "study time" stat.
 */
export function useStudyTimer() {
  const { addStudyTime } = useStore();
  const start = useRef<number>(Date.now());
  useEffect(() => {
    start.current = Date.now();
    return () => {
      const seconds = Math.round((Date.now() - start.current) / 1000);
      // Ignore absurd values (e.g. tab left open for hours).
      if (seconds > 0 && seconds < 3600) addStudyTime(seconds);
    };
  }, [addStudyTime]);
}
