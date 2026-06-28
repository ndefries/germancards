# Sprachkarten — Learn German with Prompt Cards

A premium, offline-friendly web app for learning the most common German words
through interactive **Prompt Cards**, spaced repetition, quizzes, listening and
writing practice. Built with Next.js 15, TypeScript and Tailwind CSS. No backend
— all progress is stored locally in the browser.

---

## Features

- **Prompt Cards** — large German headword, IPA pronunciation, CEFR level and
  part-of-speech badges, a rotating creative prompt, audio playback and a
  favourite toggle. Reveal the English meaning, example sentence, grammar note,
  memory tip and usage note.
- **Spaced repetition** — a Leitner scheduler (boxes 0–5) decides what's due.
  Grade each card *Again / Hard / Medium / Easy*; intervals grow as you improve.
  The session is built after localStorage hydrates, so your SRS history is
  always honoured.
- **Keyboard shortcuts** — press `Space` to flip a card, then `1`–`4` to grade
  (*Again / Hard / Medium / Easy*) without touching the mouse. Shortcuts are
  displayed on the card as a reminder.
- **Five study modes**
  - *Flashcards* — a due-first review session with progress and confetti.
  - *Quiz* — multiple choice, typing, sentence completion and a matching
    mini-game, with an optional timed mode.
  - *Listening* — hear words via the browser's speech synthesis (normal / slow),
    then reveal and self-grade.
  - *Writing* — translate English → German with character-level feedback.
  - *Learn* — browse by level, part of speech, favourites or recently learned.
- **Daily challenge** — a word of the day seeded by the calendar date so it
  stays consistent all day without a backend.
- **Progress & statistics** — XP, current/longest streak, words learned and
  mastered, accuracy, study time, plus charts for daily XP, accuracy over time,
  mastery by level, hardest words and favourite categories.
- **Search** across German, English, level, part of speech and tags.
- **Polish** — glassmorphism surfaces, gradient accents, large type, Framer
  Motion animations, full dark mode, keyboard-friendly controls, ARIA labels and
  a reduced-motion setting.
- **Your data, your control** — export/import progress as JSON, reset progress,
  import your own vocabulary dataset, and configure session size (10 / 20 / 30 / 50
  cards per session) in Settings.
- **Optional AI** — add an Anthropic API key in Settings to generate fresh
  example sentences on cards. Without a key, the app uses the bundled examples.

---

## Getting started

```bash
# 1. Install dependencies
npm install
# If you hit peer-dependency errors on your platform, use:
# npm install --legacy-peer-deps

# 2. Run the dev server
npm run dev
# open http://localhost:3000

# 3. Production build
npm run build && npm start
```

Requires Node.js 18.18+ (Node 20 LTS recommended).

---

## Deploying to Vercel

1. Push this folder to a Git repository (GitHub/GitLab/Bitbucket).
2. Import the repo at [vercel.com/new](https://vercel.com/new).
3. Accept the defaults — Vercel auto-detects Next.js. No environment variables
   are required.
4. Deploy. That's it; the app is fully static + client-side.

You can also deploy any other Next.js-compatible host, or run `npm run build`
and serve with `npm start`.

---

## Project structure

```
app/                 Routes (Home, Learn, Flashcards, Quiz, Listening,
                     Writing, Statistics, Settings) + layout & globals.css
components/          UI building blocks
  ui/                Self-owned shadcn-style primitives (button, card, badge,
                     input, switch, progress)
  prompt-card.tsx    The core study card
  nav.tsx            Top navigation + mobile drawer
  confetti.tsx       Dependency-free celebration burst
  stat-card.tsx      Metric tile
data/
  words.json         The bundled vocabulary dataset
hooks/
  use-local-storage.ts
lib/
  store.tsx          Global state (progress, settings, dataset) + localStorage
  srs.ts             Leitner spaced-repetition engine + XP
  data.ts            Dataset loading, filtering, search, import validation
  prompts.ts         Rotating prompt templates
  speech.ts          SpeechSynthesis wrapper
  ai.ts              Optional Anthropic integration (graceful fallback)
  utils.ts           Shared helpers (cn, dates, shuffle, answer matching)
types/
  index.ts           Domain types (Word, CardState, Settings, ProgressData…)
```

> **A note on shadcn/ui:** shadcn components are meant to be copied into your
> project and owned directly rather than installed as a dependency. To keep the
> install reliable and free of the interactive CLI/Radix setup, the primitives
> in `components/ui` are hand-written in that same spirit — restyle them freely.

---

## Using your own 2,000-word dataset

The bundled `data/words.json` ships with ~200 carefully hand-checked starter
words covering A1 through B2 (accurate genders, IPA, examples and mnemonics)
so the app is correct out of the box. To load an even larger set:

1. Prepare a JSON **array** where each entry matches this schema:

   ```json
   {
     "rank": 1,
     "german": "sein",
     "english": "to be",
     "partOfSpeech": "verb",
     "difficulty": "A1",
     "pronunciation": "/zaɪn/",
     "exampleGerman": "Ich bin müde.",
     "exampleEnglish": "I am tired.",
     "memoryTip": "Sounds like 'sign' — you sign in to say you ARE here.",
     "grammarNote": "Irregular: ich bin, du bist, er ist.",
     "usageNote": "The most common verb.",
     "tags": ["essential", "irregular"]
   }
   ```

   `partOfSpeech` is one of `noun · verb · adjective · adverb · pronoun ·
   preposition · conjunction · number · phrase`. `difficulty` is one of
   `A1 · A2 · B1 · B2`. `rank`, `pronunciation`, examples, `memoryTip` and the
   two notes are optional and will be back-filled if missing.

2. Either replace `data/words.json` directly (rebuild), **or** — without
   touching the code — go to **Settings → Vocabulary dataset → Import** and
   select your file. The imported set is stored locally and overrides the
   bundled one until you choose *Reset*.

---

## Optional AI features

Add an Anthropic API key under **Settings → AI features**. When set, a
"Generate a fresh example" button appears on cards and calls the Anthropic
Messages API directly from the browser. The key is stored only in your
browser's `localStorage` and is sent only to Anthropic.

> For a public deployment, proxy the request through a serverless route
> (e.g. a Next.js Route Handler) instead of calling the API from the client,
> so your key is never exposed. The call lives in `lib/ai.ts`.

---

## Privacy

Everything — progress, settings, favourites and any imported dataset or API key
— stays in your browser via `localStorage`. There is no server, no account and
no tracking. Clearing your browser data (or using **Settings → Reset**) wipes
it. Use **Export** to keep a backup.

---

## Tech

Next.js 15 (App Router) · React 18 · TypeScript · Tailwind CSS · Framer Motion ·
Recharts · lucide-react. Designed to deploy on Vercel with zero configuration.
