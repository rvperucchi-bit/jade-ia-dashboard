import AsyncStorage from "@react-native-async-storage/async-storage";

export const SESSION_HISTORY_KEY = "@jade_ia:session_history";
const SESSION_MSGS_PREFIX = "@jade_ia:session_msgs:";
const MAX_SESSIONS = 50;

export interface HistorySession {
  id: string;
  title: string;
  preview: string;
  date: string;
  messageCount: number;
  topic: "prospecção" | "briefing" | "objeção" | "roteiro" | "análise" | "geral";
}

export interface SavedMessage {
  id: string;
  text: string;
  sender: "jade" | "user";
  time: string;
  isAudio?: boolean;
  audioDuration?: number;
}

function detectTopic(messages: SavedMessage[]): HistorySession["topic"] {
  const text = messages
    .filter((m) => m.sender === "user")
    .slice(0, 8)
    .map((m) => m.text.toLowerCase())
    .join(" ");
  if (/prospe[cç]|lead|radar|scanner|encontr|empresas?|estabele/.test(text)) return "prospecção";
  if (/briefing|perfil da empresa|segment|apresent/.test(text)) return "briefing";
  if (/obje[çc]|caro|pre[çc]o|concorrent|não quero|muito caro/.test(text)) return "objeção";
  if (/roteiro|script|abordagem|mensagem para/.test(text)) return "roteiro";
  if (/anális|relat|meta|kpi|convers[aã]o|taxa/.test(text)) return "análise";
  return "geral";
}

function formatDate(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const day = 86400000;
  const hh = date.getHours().toString().padStart(2, "0");
  const mm = date.getMinutes().toString().padStart(2, "0");
  if (diff < day && now.getDate() === date.getDate()) return `Hoje, ${hh}:${mm}`;
  if (diff < 2 * day) return `Ontem, ${hh}:${mm}`;
  const months = ["jan","fev","mar","abr","mai","jun","jul","ago","set","out","nov","dez"];
  return `${date.getDate()} ${months[date.getMonth()]}, ${hh}:${mm}`;
}

function buildTitle(messages: SavedMessage[]): string {
  const firstUser = [...messages].reverse().find((m) => m.sender === "user");
  if (!firstUser) return "Nova conversa";
  const cleaned = firstUser.text.replace(/\[.*?\]/g, "").trim();
  const words = cleaned.split(/\s+/).slice(0, 7).join(" ");
  return words.length > 2 ? words : "Nova conversa";
}

export async function saveSession(
  sessionId: string,
  messages: SavedMessage[],
  createdAt?: Date
): Promise<void> {
  const userMessages = messages.filter((m) => m.sender === "user");
  if (userMessages.length === 0) return;

  try {
    const rawList = await AsyncStorage.getItem(SESSION_HISTORY_KEY);
    const list: HistorySession[] = rawList ? (JSON.parse(rawList) as HistorySession[]) : [];

    const title = buildTitle(messages);
    const previewMsg = messages[0];
    const preview = previewMsg ? previewMsg.text.replace(/\[.*?\]/g, "").trim().slice(0, 100) : "";
    const topic = detectTopic(messages);
    const date = formatDate(createdAt ?? new Date());

    const session: HistorySession = {
      id: sessionId,
      title,
      preview,
      date,
      messageCount: messages.length,
      topic,
    };

    const existingIdx = list.findIndex((s) => s.id === sessionId);
    if (existingIdx >= 0) {
      list[existingIdx] = session;
    } else {
      list.unshift(session);
    }

    const trimmed = list.slice(0, MAX_SESSIONS);

    await Promise.all([
      AsyncStorage.setItem(SESSION_HISTORY_KEY, JSON.stringify(trimmed)),
      AsyncStorage.setItem(SESSION_MSGS_PREFIX + sessionId, JSON.stringify(messages)),
    ]);
  } catch {
    // best-effort
  }
}

export async function loadSessions(): Promise<HistorySession[]> {
  try {
    const raw = await AsyncStorage.getItem(SESSION_HISTORY_KEY);
    return raw ? (JSON.parse(raw) as HistorySession[]) : [];
  } catch {
    return [];
  }
}

export async function loadSessionMessages(sessionId: string): Promise<SavedMessage[]> {
  try {
    const raw = await AsyncStorage.getItem(SESSION_MSGS_PREFIX + sessionId);
    return raw ? (JSON.parse(raw) as SavedMessage[]) : [];
  } catch {
    return [];
  }
}
