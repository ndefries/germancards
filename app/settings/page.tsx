"use client";

// Settings: display preferences, study preferences, data management
// (export / import progress, import a custom dataset, reset) and the optional
// AI key. Everything writes straight to the local store.

import { useRef, useState, useEffect } from "react";
import {
  Moon, Bell, Gauge, Target, Sparkles, Download, Upload,
  Trash2, Database, RotateCcw, Check, AlertTriangle, Eye, Layers,
} from "lucide-react";

const SESSION_SIZES = [10, 20, 30, 50];
import { useStore } from "@/lib/store";
import { validateWordList } from "@/lib/data";
import { getApiKey, setApiKey } from "@/lib/ai";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import type { Difficulty } from "@/types";

const QUIZ_LEVELS: ("all" | Difficulty)[] = ["all", "A1", "A2", "B1", "B2"];

export default function SettingsPage() {
  const {
    hydrated, settings, updateSettings, resetProgress,
    exportProgress, importProgress, setWords, resetWords,
    isCustomDataset, words,
  } = useStore();

  const progressInput = useRef<HTMLInputElement>(null);
  const datasetInput = useRef<HTMLInputElement>(null);
  const [apiKey, setApiKeyState] = useState("");
  const [keySaved, setKeySaved] = useState(false);
  const [notice, setNotice] = useState<{ kind: "ok" | "err"; msg: string } | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);

  useEffect(() => {
    setApiKeyState(getApiKey() ?? "");
  }, []);

  if (!hydrated) return <div className="text-fg-muted">Loading…</div>;

  function flash(kind: "ok" | "err", msg: string) {
    setNotice({ kind, msg });
    setTimeout(() => setNotice(null), 4000);
  }

  function downloadProgress() {
    const blob = new Blob([exportProgress()], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sprachkarten-progress-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function onImportProgress(file: File) {
    try {
      importProgress(await file.text());
      flash("ok", "Progress imported.");
    } catch {
      flash("err", "That file couldn’t be read as progress JSON.");
    }
  }

  async function onImportDataset(file: File) {
    try {
      const parsed = JSON.parse(await file.text());
      const validated = validateWordList(parsed);
      setWords(validated);
      flash("ok", `Imported ${validated.length} words.`);
    } catch (e) {
      flash("err", e instanceof Error ? e.message : "Invalid dataset file.");
    }
  }

  function saveKey() {
    setApiKey(apiKey);
    setKeySaved(true);
    setTimeout(() => setKeySaved(false), 2000);
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-fg">Settings</h1>
        <p className="mt-1 text-fg-muted">Tune the app and manage your data.</p>
      </div>

      {notice && (
        <div
          className={`flex items-center gap-2 rounded-2xl p-4 text-sm font-medium ${
            notice.kind === "ok"
              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
              : "bg-rose-500/10 text-rose-600 dark:text-rose-400"
          }`}
        >
          {notice.kind === "ok" ? <Check size={16} /> : <AlertTriangle size={16} />}
          {notice.msg}
        </div>
      )}

      {/* Display */}
      <Card className="divide-y divide-line">
        <SectionTitle>Display</SectionTitle>
        <Row icon={<Moon size={18} />} title="Dark mode" desc="Use the dark colour theme.">
          <Switch checked={settings.darkMode} onChange={(v) => updateSettings({ darkMode: v })} label="Dark mode" />
        </Row>
        <Row icon={<Eye size={18} />} title="Reduced motion" desc="Minimise animations and transitions.">
          <Switch checked={settings.reducedMotion} onChange={(v) => updateSettings({ reducedMotion: v })} label="Reduced motion" />
        </Row>
      </Card>

      {/* Study */}
      <Card className="divide-y divide-line">
        <SectionTitle>Study</SectionTitle>
        <Row icon={<Target size={18} />} title="Daily goal" desc="Cards to review each day.">
          <div className="flex items-center gap-3">
            <input
              type="range" min={5} max={100} step={5}
              value={settings.dailyGoal}
              onChange={(e) => updateSettings({ dailyGoal: Number(e.target.value) })}
              className="w-32 accent-brand-600"
              aria-label="Daily goal"
            />
            <span className="w-10 text-right font-semibold text-fg">{settings.dailyGoal}</span>
          </div>
        </Row>
        <Row icon={<Gauge size={18} />} title="Speech speed" desc="Playback rate for pronunciation.">
          <div className="flex items-center gap-3">
            <input
              type="range" min={0.5} max={1.2} step={0.1}
              value={settings.speechRate}
              onChange={(e) => updateSettings({ speechRate: Number(e.target.value) })}
              className="w-32 accent-brand-600"
              aria-label="Speech speed"
            />
            <span className="w-10 text-right font-semibold text-fg">{settings.speechRate.toFixed(1)}×</span>
          </div>
        </Row>
        <Row icon={<Sparkles size={18} />} title="Quiz difficulty" desc="Restrict quizzes to a level.">
          <div className="flex flex-wrap gap-1.5">
            {QUIZ_LEVELS.map((lvl) => (
              <button
                key={lvl}
                onClick={() => updateSettings({ quizDifficulty: lvl })}
                className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                  settings.quizDifficulty === lvl
                    ? "bg-brand-600 text-white"
                    : "bg-surface-2 text-fg-muted hover:bg-surface-3"
                }`}
              >
                {lvl === "all" ? "All" : lvl}
              </button>
            ))}
          </div>
        </Row>
        <Row icon={<Layers size={18} />} title="Session size" desc="Cards per flashcard, listening and writing session.">
          <div className="flex flex-wrap gap-1.5">
            {SESSION_SIZES.map((n) => (
              <button
                key={n}
                onClick={() => updateSettings({ sessionSize: n })}
                className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                  (settings.sessionSize ?? 20) === n
                    ? "bg-brand-600 text-white"
                    : "bg-surface-2 text-fg-muted hover:bg-surface-3"
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </Row>
        <Row icon={<Bell size={18} />} title="Reminders" desc="Show a daily study reminder badge.">
          <Switch checked={settings.notifications} onChange={(v) => updateSettings({ notifications: v })} label="Reminders" />
        </Row>
      </Card>

      {/* Data */}
      <Card className="divide-y divide-line">
        <SectionTitle>Data</SectionTitle>
        <Row icon={<Download size={18} />} title="Export progress" desc="Download a backup JSON file.">
          <Button variant="secondary" size="sm" onClick={downloadProgress}>Export</Button>
        </Row>
        <Row icon={<Upload size={18} />} title="Import progress" desc="Restore from a backup file.">
          <Button variant="secondary" size="sm" onClick={() => progressInput.current?.click()}>Import</Button>
          <input
            ref={progressInput} type="file" accept="application/json" className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) onImportProgress(f); e.target.value = ""; }}
          />
        </Row>
        <Row
          icon={<Database size={18} />}
          title="Vocabulary dataset"
          desc={isCustomDataset ? `Custom set loaded (${words.length} words).` : `Built-in set (${words.length} words). Import a full 2,000-word JSON.`}
        >
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={() => datasetInput.current?.click()}>Import</Button>
            {isCustomDataset && (
              <Button variant="ghost" size="sm" onClick={() => { resetWords(); flash("ok", "Reverted to built-in dataset."); }}>
                Reset
              </Button>
            )}
          </div>
          <input
            ref={datasetInput} type="file" accept="application/json" className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) onImportDataset(f); e.target.value = ""; }}
          />
        </Row>
        <Row icon={<Trash2 size={18} />} title="Reset progress" desc="Clear all study data (keeps settings).">
          {confirmReset ? (
            <div className="flex gap-2">
              <Button variant="danger" size="sm" onClick={() => { resetProgress(); setConfirmReset(false); flash("ok", "Progress reset."); }}>
                Confirm
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setConfirmReset(false)}>Cancel</Button>
            </div>
          ) : (
            <Button variant="outline" size="sm" onClick={() => setConfirmReset(true)}>
              <RotateCcw size={15} /> Reset
            </Button>
          )}
        </Row>
      </Card>

      {/* AI (optional) */}
      <Card className="divide-y divide-line">
        <SectionTitle>AI features (optional)</SectionTitle>
        <div className="p-5">
          <p className="text-sm text-fg-muted">
            Add an Anthropic API key to generate fresh example sentences on cards.
            Leave blank to use the built-in examples. The key is stored only in
            this browser.
          </p>
          <div className="mt-4 flex gap-2">
            <Input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKeyState(e.target.value)}
              placeholder="sk-ant-…"
              aria-label="Anthropic API key"
            />
            <Button onClick={saveKey} className="shrink-0">
              {keySaved ? <Check size={16} /> : "Save"}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <div className="px-6 pt-5 pb-3 text-xs font-semibold uppercase tracking-wide text-fg-subtle">{children}</div>;
}

function Row({
  icon, title, desc, children,
}: {
  icon: React.ReactNode; title: string; desc?: string; children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 p-5">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 text-fg-muted">{icon}</span>
        <div>
          <div className="font-medium text-fg">{title}</div>
          {desc && <div className="text-sm text-fg-muted">{desc}</div>}
        </div>
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}
