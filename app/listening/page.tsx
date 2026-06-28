"use client";

// Listening: hear a German word/sentence (browser SpeechSynthesis), then
// reveal the text and meaning. Replay at normal or slow speed.

import { useMemo, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Volume2, Rabbit, Eye, ArrowRight } from "lucide-react";
import { useStore, useStudyTimer } from "@/lib/store";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { LevelBadge } from "@/components/ui/badge";
import { speakGerman, speechSupported } from "@/lib/speech";
import { shuffle } from "@/lib/utils";

export default function ListeningPage() {
  useStudyTimer();
  const { words, settings, grade, hydrated } = useStore();
  const session = useMemo(() => shuffle(words).slice(0, 15), [words]);
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [supported, setSupported] = useState(true);

  useEffect(() => setSupported(speechSupported()), []);

  const word = session[index];

  // Auto-play each new word once it appears.
  useEffect(() => {
    if (word && supported) speakGerman(word.german, settings.speechRate);
    setRevealed(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);

  if (!hydrated) return <div className="text-fg-muted">Loading…</div>;

  function advance(known: boolean) {
    grade(word.rank, known ? "medium" : "again");
    setIndex((i) => i + 1);
  }

  if (index >= session.length) {
    return (
      <Card className="mx-auto max-w-lg p-10 text-center">
        <h2 className="text-2xl font-bold text-fg">All done!</h2>
        <p className="mt-1 text-fg-muted">You listened to {session.length} words.</p>
        <Button className="mt-6" onClick={() => { setIndex(0); }}>
          Listen again
        </Button>
      </Card>
    );
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-fg">Listening</h1>
        <span className="text-sm text-fg-muted">{index + 1} / {session.length}</span>
      </div>
      <Progress value={(index / session.length) * 100} />

      {!supported && (
        <Card className="p-4 text-sm text-amber-600 dark:text-amber-400">
          Speech synthesis isn’t available in this browser. The text is shown below instead.
        </Card>
      )}

      <motion.div key={index} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="p-8 text-center">
          <LevelBadge level={word.difficulty} />
          <p className="mt-6 text-fg-muted">Listen and try to recall the word.</p>

          <div className="mt-6 flex justify-center gap-3">
            <Button size="lg" onClick={() => speakGerman(word.german, settings.speechRate)}>
              <Volume2 size={20} /> Play
            </Button>
            <Button size="lg" variant="secondary" onClick={() => speakGerman(word.german, 0.55)}>
              <Rabbit size={20} /> Slow
            </Button>
          </div>

          {!revealed ? (
            <Button variant="ghost" className="mt-6" onClick={() => setRevealed(true)}>
              <Eye size={18} /> Reveal
            </Button>
          ) : (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-6">
              <div className="text-4xl font-bold text-fg">{word.german}</div>
              <div className="mt-1 text-lg text-fg-muted">{word.english}</div>
              {word.exampleGerman && (
                <button
                  onClick={() => speakGerman(word.exampleGerman, settings.speechRate)}
                  className="mt-4 inline-flex items-center gap-2 text-sm text-fg-muted hover:text-brand-500"
                >
                  <Volume2 size={15} /> {word.exampleGerman}
                </button>
              )}
              <div className="mt-6 flex justify-center gap-3">
                <Button variant="outline" onClick={() => advance(false)}>Didn’t know</Button>
                <Button variant="success" onClick={() => advance(true)}>
                  Knew it <ArrowRight size={16} />
                </Button>
              </div>
            </motion.div>
          )}
        </Card>
      </motion.div>
    </div>
  );
}
