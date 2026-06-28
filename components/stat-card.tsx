"use client";

import { motion } from "framer-motion";
import { type ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

/** Compact metric tile used on the home page and statistics dashboard. */
export function StatCard({
  icon,
  label,
  value,
  sublabel,
  accent = "text-brand-500",
  className,
}: {
  icon: ReactNode;
  label: string;
  value: ReactNode;
  sublabel?: string;
  accent?: string;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card className={cn("p-5", className)}>
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-fg-muted">{label}</span>
          <span className={accent}>{icon}</span>
        </div>
        <div className="mt-2 text-3xl font-bold tracking-tight text-fg">{value}</div>
        {sublabel && <div className="mt-1 text-xs text-fg-subtle">{sublabel}</div>}
      </Card>
    </motion.div>
  );
}
