"use client";

// Top navigation bar + mobile drawer. Highlights the active route and exposes
// a quick dark-mode toggle. All eight sections from the brief are linked here.

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Home,
  BookOpen,
  Layers,
  HelpCircle,
  Headphones,
  PenLine,
  BarChart3,
  Settings as SettingsIcon,
  Moon,
  Sun,
  Menu,
  X,
} from "lucide-react";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/", label: "Home", icon: Home },
  { href: "/learn", label: "Learn", icon: BookOpen },
  { href: "/flashcards", label: "Flashcards", icon: Layers },
  { href: "/quiz", label: "Quiz", icon: HelpCircle },
  { href: "/listening", label: "Listening", icon: Headphones },
  { href: "/writing", label: "Writing", icon: PenLine },
  { href: "/statistics", label: "Statistics", icon: BarChart3 },
  { href: "/settings", label: "Settings", icon: SettingsIcon },
];

export function Nav() {
  const pathname = usePathname();
  const { settings, updateSettings, hydrated } = useStore();
  const [open, setOpen] = useState(false);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-bg/70 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2 font-bold text-fg">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-white">
            S
          </span>
          <span className="hidden sm:inline">Sprachkarten</span>
        </Link>

        {/* Desktop links */}
        <nav className="hidden items-center gap-1 lg:flex" aria-label="Primary">
          {LINKS.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "relative flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
                isActive(href) ? "text-brand-600 dark:text-brand-400" : "text-fg-muted hover:text-fg"
              )}
            >
              <Icon size={16} />
              {label}
              {isActive(href) && (
                <motion.span
                  layoutId="nav-active"
                  className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-brand-500"
                />
              )}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {/* Dark mode toggle */}
          <button
            type="button"
            onClick={() => updateSettings({ darkMode: !settings.darkMode })}
            className="flex h-10 w-10 items-center justify-center rounded-xl text-fg-muted transition-colors hover:bg-surface-2 hover:text-fg"
            aria-label={settings.darkMode ? "Switch to light mode" : "Switch to dark mode"}
          >
            {hydrated && settings.darkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          {/* Mobile menu button */}
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            className="flex h-10 w-10 items-center justify-center rounded-xl text-fg-muted hover:bg-surface-2 lg:hidden"
            aria-label="Toggle menu"
            aria-expanded={open}
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      <AnimatePresence>
        {open && (
          <motion.nav
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-line lg:hidden"
            aria-label="Mobile"
          >
            <div className="grid grid-cols-2 gap-1 p-3">
              {LINKS.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "flex items-center gap-2 rounded-xl px-3 py-3 text-sm font-medium",
                    isActive(href)
                      ? "bg-brand-500/10 text-brand-600 dark:text-brand-400"
                      : "text-fg-muted hover:bg-surface-2"
                  )}
                >
                  <Icon size={18} />
                  {label}
                </Link>
              ))}
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}
