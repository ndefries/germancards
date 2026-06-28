import type { Metadata, Viewport } from "next";
import "./globals.css";
import { StoreProvider } from "@/lib/store";
import { Nav } from "@/components/nav";

export const metadata: Metadata = {
  title: "Sprachkarten — Learn German with Prompt Cards",
  description:
    "A premium, offline-friendly app for learning the most common German words with AI-style prompt cards, spaced repetition, quizzes and listening practice.",
};

export const viewport: Viewport = {
  themeColor: "#6366f1",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      {/*
        suppressHydrationWarning: the store toggles the `dark` class on <html>
        after hydration, which is an intentional client-only mutation.
      */}
      <body className="app-aurora min-h-screen">
        <StoreProvider>
          <Nav />
          <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
          <footer className="mx-auto max-w-6xl px-4 pb-10 pt-4 text-center text-xs text-fg-subtle">
            Sprachkarten · Built with Next.js · Your progress is saved locally in
            this browser.
          </footer>
        </StoreProvider>
      </body>
    </html>
  );
}
