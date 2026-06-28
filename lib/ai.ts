"use client";

// ---------------------------------------------------------------------------
// Optional AI layer.
//
// If the learner stores an Anthropic API key (Settings → AI), prompt cards can
// generate fresh example sentences / explanations on demand. With no key, the
// app falls back silently to the bundled dataset — nothing here is required for
// the app to function.
//
// NOTE: calling the API directly from the browser exposes the key to this
// device only (it is kept in localStorage, never sent anywhere but Anthropic).
// For a public deployment you would proxy this through a serverless route.
// ---------------------------------------------------------------------------

const KEY_STORAGE = "sprachkarten:aikey:v1";

export function getApiKey(): string | null {
  try {
    return window.localStorage.getItem(KEY_STORAGE);
  } catch {
    return null;
  }
}

export function setApiKey(key: string): void {
  try {
    if (key.trim()) window.localStorage.setItem(KEY_STORAGE, key.trim());
    else window.localStorage.removeItem(KEY_STORAGE);
  } catch {
    /* ignore */
  }
}

export function hasApiKey(): boolean {
  return Boolean(getApiKey());
}

/**
 * Ask Claude to produce a short, fresh example sentence (German + English) for
 * a word. Returns null on any failure so callers can fall back gracefully.
 */
export async function generateExample(
  german: string,
  english: string
): Promise<{ de: string; en: string } | null> {
  const key = getApiKey();
  if (!key) return null;
  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
        "anthropic-dangerous-direct-browser-access": "true",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 200,
        messages: [
          {
            role: "user",
            content:
              `Give one short, natural German example sentence using the word ` +
              `"${german}" (meaning "${english}"), then its English translation. ` +
              `Respond ONLY as JSON: {"de": "...", "en": "..."} with no extra text.`,
          },
        ],
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const text: string = (data.content ?? [])
      .filter((b: { type: string }) => b.type === "text")
      .map((b: { text: string }) => b.text)
      .join("")
      .replace(/```json|```/g, "")
      .trim();
    const parsed = JSON.parse(text);
    if (parsed && typeof parsed.de === "string" && typeof parsed.en === "string") {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}
