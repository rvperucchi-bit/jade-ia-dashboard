import { useState } from "react";
import { Platform } from "react-native";
import * as Haptics from "expo-haptics";
import { stripMarkdown } from "@/utils/stripMarkdown";

const API_BASE =
  Platform.OS === "web"
    ? ""
    : `https://${process.env.EXPO_PUBLIC_DOMAIN ?? ""}`;

async function callJADE(prompt: string): Promise<string> {
  const controller = new AbortController();
  const tid = setTimeout(() => controller.abort(), 90000);
  try {
    const res = await fetch(`${API_BASE}/api/jade/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: [{ role: "user", content: prompt }] }),
      signal: controller.signal,
    });
    clearTimeout(tid);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const text = ((data.message ?? data.response) as string | undefined)?.trim() ?? "";
    if (!text) throw new Error("Empty response");
    return text;
  } finally {
    clearTimeout(tid);
  }
}

export interface UseJADEReturn {
  loading: boolean;
  error: string | null;
  result: string | null;
  success: boolean;
  generate: (prompt: string) => Promise<string | null>;
  clear: () => void;
}

export function useJADE(): UseJADEReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);
  const [result, setResult]   = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const generate = async (prompt: string): Promise<string | null> => {
    setLoading(true);
    setError(null);
    setResult(null);
    setSuccess(false);

    try {
      let text: string;
      try {
        text = await callJADE(prompt);
      } catch (firstErr) {
        const isAbort = firstErr instanceof Error && firstErr.name === "AbortError";
        if (isAbort) throw firstErr;
        await new Promise<void>((r) => setTimeout(r, 1500));
        text = await callJADE(prompt);
      }
      const clean = stripMarkdown(text);
      setResult(clean);
      setSuccess(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setTimeout(() => setSuccess(false), 2000);
      return clean;
    } catch (err: unknown) {
      const isAbort = err instanceof Error && err.name === "AbortError";
      const msg = isAbort
        ? "A JADE está pensando, tente novamente."
        : "Sem conexão com a JADE. Verifique sua internet.";
      setError(msg);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const clear = () => {
    setResult(null);
    setError(null);
    setSuccess(false);
  };

  return { loading, error, result, success, generate, clear };
}
