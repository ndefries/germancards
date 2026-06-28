// ---------------------------------------------------------------------------
// Thin wrapper around the browser SpeechSynthesis API for Listening mode.
// All functions are safe to call during SSR (they no-op without `window`).
// ---------------------------------------------------------------------------

/** Is speech synthesis available in this browser? */
export function speechSupported(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

/** Try to find a German voice; fall back to the default voice. */
function germanVoice(): SpeechSynthesisVoice | undefined {
  const voices = window.speechSynthesis.getVoices();
  return (
    voices.find((v) => v.lang.toLowerCase().startsWith("de")) ?? voices[0]
  );
}

/**
 * Speak some German text. `rate` is the speed multiplier (1 = normal,
 * 0.6 ≈ slow). Cancels any in-progress utterance first.
 */
export function speakGerman(text: string, rate = 1): void {
  if (!speechSupported()) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "de-DE";
  utterance.rate = rate;
  const voice = germanVoice();
  if (voice) utterance.voice = voice;
  window.speechSynthesis.speak(utterance);
}

/** Stop any current speech. */
export function stopSpeaking(): void {
  if (speechSupported()) window.speechSynthesis.cancel();
}
