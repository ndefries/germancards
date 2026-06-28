"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * useLocalStorage — a typed, SSR-safe wrapper around localStorage.
 *
 * Returns the current value, a setter, and a `hydrated` flag that becomes true
 * only after the value has been read from storage on the client. Components can
 * use `hydrated` to avoid rendering server/client mismatches.
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((prev: T) => T)) => void, boolean] {
  const [value, setValue] = useState<T>(initialValue);
  const [hydrated, setHydrated] = useState(false);

  // Read once on mount (client only).
  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(key);
      if (stored !== null) setValue(JSON.parse(stored) as T);
    } catch {
      // Ignore corrupt/unavailable storage and keep the initial value.
    }
    setHydrated(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const set = useCallback(
    (next: T | ((prev: T) => T)) => {
      setValue((prev) => {
        const resolved =
          typeof next === "function" ? (next as (p: T) => T)(prev) : next;
        try {
          window.localStorage.setItem(key, JSON.stringify(resolved));
        } catch {
          // Storage full / unavailable — value still lives in React state.
        }
        return resolved;
      });
    },
    [key]
  );

  return [value, set, hydrated];
}
