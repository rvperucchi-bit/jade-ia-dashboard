import type { Lead } from "@/context/AppContext";

export type ScoreTier = "frio" | "morno" | "quente" | "vip";

export interface ScoreInfo {
  score: number;
  tier: ScoreTier;
  label: string;
  color: string;
  emoji: string;
}

/**
 * Parse days-without-contact from the lead.time string.
 * Examples: "2h atrás" → 0, "1d atrás" → 1, "3 dias" → 3, "1sem" → 7, "2sem" → 14
 */
function parseDaysFromTime(time: string): number {
  const t = time.toLowerCase();
  if (t.includes("min") || t.includes("seg") || t.includes("agora")) return 0;
  if (t.includes("h") && !t.includes("dia") && !t.includes("sem")) return 0;
  const semMatch = t.match(/(\d+)\s*sem/);
  if (semMatch) return parseInt(semMatch[1], 10) * 7;
  const diaMatch = t.match(/(\d+)\s*d/);
  if (diaMatch) return parseInt(diaMatch[1], 10);
  return 0;
}

export function calcLeadScore(lead: Lead, activitiesCount = 0): number {
  let score = 0;

  // Pipeline stage base
  const stageBase: Record<string, number> = {
    novo:        20,
    qualificado: 45,
    proposta:    70,
    fechado:     100,
  };
  score += stageBase[lead.column] ?? 20;

  // Days without contact penalty (−5/day, max −40)
  const days = parseDaysFromTime(lead.time);
  score -= Math.min(40, days * 5);

  // High value bonus
  if (lead.value >= 10000) score += 15;

  // Activities bonus (+2 each, max +20)
  score += Math.min(20, activitiesCount * 2);

  return Math.max(0, Math.min(100, Math.round(score)));
}

export function getScoreInfo(score: number): ScoreInfo {
  if (score >= 90) return { score, tier: "vip",    label: "VIP",    color: "#FF0080",              emoji: "🔥" };
  if (score >= 70) return { score, tier: "quente", label: "Quente", color: "#FF0080",              emoji: "🔥" };
  if (score >= 40) return { score, tier: "morno",  label: "Morno",  color: "rgba(255,255,255,0.5)", emoji: "·" };
  return                  { score, tier: "frio",   label: "Frio",   color: "rgba(255,255,255,0.3)", emoji: "·" };
}

export function getLeadScoreInfo(lead: Lead, activitiesCount = 0): ScoreInfo {
  return getScoreInfo(calcLeadScore(lead, activitiesCount));
}
