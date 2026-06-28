"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";

/**
 * Lightweight confetti burst (no dependencies). Render with a `fire` key that
 * changes to trigger a new burst, e.g. on a milestone or correct streak.
 */
export function Confetti({ fire }: { fire: number }) {
  const [active, setActive] = useState(false);

  useEffect(() => {
    if (fire <= 0) return;
    setActive(true);
    const t = setTimeout(() => setActive(false), 1400);
    return () => clearTimeout(t);
  }, [fire]);

  const pieces = useMemo(
    () =>
      Array.from({ length: 70 }).map((_, i) => ({
        id: i,
        x: (Math.random() - 0.5) * 600,
        y: -(Math.random() * 400 + 200),
        rotate: Math.random() * 720,
        delay: Math.random() * 0.15,
        color: ["#6366f1", "#22c55e", "#f59e0b", "#ec4899", "#06b6d4"][i % 5],
        size: Math.random() * 8 + 6,
      })),
    [fire]
  );

  return (
    <AnimatePresence>
      {active && (
        <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center overflow-hidden">
          {pieces.map((p) => (
            <motion.span
              key={p.id}
              initial={{ opacity: 1, x: 0, y: 0, rotate: 0 }}
              animate={{ opacity: 0, x: p.x, y: p.y, rotate: p.rotate }}
              transition={{ duration: 1.2, delay: p.delay, ease: "easeOut" }}
              style={{
                position: "absolute",
                width: p.size,
                height: p.size,
                borderRadius: 2,
                backgroundColor: p.color,
              }}
            />
          ))}
        </div>
      )}
    </AnimatePresence>
  );
}
