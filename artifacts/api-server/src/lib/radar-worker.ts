/**
 * JADE Radar Worker — prospectora autônoma
 *
 * Executa buscas de leads no Google Places em background,
 * periodicamente, usando a configuração de segmento/cidade da empresa.
 * Os resultados ficam em data/jade-radar-activity.json e são
 * expostos via GET /api/places/radar-activity e /radar-status.
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { getCompanyConfig } from "../db/store.js";
import { logger } from "./logger.js";

// ─── Paths ───────────────────────────────────────────────────────────────────
const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR  = resolve(__dirname, "../../data");
const ACTIVITY_FILE = resolve(DATA_DIR, "jade-radar-activity.json");
const MAX_ENTRIES   = 50;
const INTERVAL_MS   = 30 * 60 * 1000; // 30 min

// ─── Types ────────────────────────────────────────────────────────────────────
export interface JadeRadarLead {
  name: string;
  address: string;
  phone: string;
  rating: number | null;
  totalRatings: number;
  status: string;
  placeId: string;
}

export interface JadeRadarEntry {
  id: string;
  segmento: string;
  cidade: string;
  estado: string;
  count: number;
  leads: JadeRadarLead[];
  ts: number;
  error?: string;
}

// ─── In-memory status ─────────────────────────────────────────────────────────
let isActive  = false;
let lastRunTs: number | null = null;
let nextRunTs: number | null = null;
let intervalHandle: ReturnType<typeof setInterval> | null = null;

export function getRadarStatus(): { isActive: boolean; lastRun: number | null; nextRun: number | null } {
  return { isActive, lastRun: lastRunTs, nextRun: nextRunTs };
}

// ─── Persistence ─────────────────────────────────────────────────────────────
function loadEntries(): JadeRadarEntry[] {
  try {
    if (!existsSync(ACTIVITY_FILE)) return [];
    return JSON.parse(readFileSync(ACTIVITY_FILE, "utf8")) as JadeRadarEntry[];
  } catch { return []; }
}

function saveEntries(entries: JadeRadarEntry[]): void {
  mkdirSync(DATA_DIR, { recursive: true });
  writeFileSync(ACTIVITY_FILE, JSON.stringify(entries, null, 2), "utf8");
}

export function getEntries(): JadeRadarEntry[] {
  return loadEntries();
}

// ─── Google Places keyword map ────────────────────────────────────────────────
const SEGMENT_KEYWORDS: Record<string, string> = {
  "Restaurantes & Food":          "restaurante lanchonete pizzaria",
  "Clínicas & Saúde":             "clínica médica consultório",
  "Beleza & Estética":            "salão de beleza estética",
  "Academias & Fitness":          "academia fitness",
  "Varejo & Comércio":            "loja varejo comércio",
  "Serviços Automotivos":         "oficina mecânica auto serviço",
  "Educação & Cursos":            "escola cursinho faculdade",
  "Imobiliárias":                 "imobiliária corretor",
  "Pet Shops":                    "pet shop veterinária",
  "Construção & Reforma":         "construtora reforma construção",
  "Tecnologia & Software":        "empresa tecnologia software ti",
  "Advocacia & Contabilidade":    "escritório advocacia contabilidade",
  "Turismo & Hotelaria":          "hotel pousada turismo",
  "Outros":                       "empresa negócio comércio",
};

// ─── Core search logic ────────────────────────────────────────────────────────
async function runSearch(): Promise<void> {
  const config = getCompanyConfig();
  if (!config?.segmento || !config?.cidade) {
    logger.info("radar-worker: empresa sem segmento/cidade configurada — pulando");
    return;
  }

  const apiKey = process.env.GOOGLE_MAPS_PLATFORM_KEY ?? process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    logger.warn("radar-worker: GOOGLE_MAPS_API_KEY não configurada");
    return;
  }

  const { segmento, cidade, estado } = config;
  const keyword = SEGMENT_KEYWORDS[segmento] ?? "empresa";
  const locationParts = [cidade, estado, "Brasil"].filter(Boolean).join(", ");
  const textQuery = `${keyword} em ${locationParts}`;

  isActive = true;
  lastRunTs = Date.now();
  logger.info({ segmento, cidade, estado }, "radar-worker: iniciando busca autônoma");

  try {
    const textUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(textQuery)}&language=pt-BR&key=${apiKey}`;
    const textResp = await fetch(textUrl);
    const textData = (await textResp.json()) as { status: string; results: any[]; error_message?: string };

    if (textData.status !== "OK" && textData.status !== "ZERO_RESULTS") {
      throw new Error(textData.error_message ?? textData.status);
    }

    const rawPlaces = (textData.results ?? []).slice(0, 12);

    // Enrich with phone numbers
    const leads = await Promise.all(
      rawPlaces.map(async (p: any): Promise<JadeRadarLead> => {
        let phone = "";
        try {
          const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${p.place_id}&fields=formatted_phone_number&language=pt-BR&key=${apiKey}`;
          const dRes = await fetch(detailsUrl);
          const dData = (await dRes.json()) as { result?: { formatted_phone_number?: string } };
          phone = dData.result?.formatted_phone_number ?? "";
        } catch { /* ignore */ }
        return {
          placeId:      p.place_id,
          name:         p.name ?? "",
          address:      p.formatted_address ?? "",
          phone,
          rating:       p.rating ?? null,
          totalRatings: p.user_ratings_total ?? 0,
          status:       p.business_status ?? "OPERATIONAL",
        };
      }),
    );

    const entry: JadeRadarEntry = {
      id:       `jade-${Date.now()}`,
      segmento, cidade, estado: estado ?? "",
      count:    leads.length,
      leads,
      ts:       Date.now(),
    };

    const existing = loadEntries();
    saveEntries([entry, ...existing].slice(0, MAX_ENTRIES));
    logger.info({ count: leads.length, segmento, cidade }, "radar-worker: busca concluída");
  } catch (err) {
    logger.error({ err }, "radar-worker: erro na busca autônoma");
    const entry: JadeRadarEntry = {
      id: `jade-${Date.now()}`,
      segmento, cidade, estado: estado ?? "",
      count: 0, leads: [],
      ts: Date.now(),
      error: String(err),
    };
    const existing = loadEntries();
    saveEntries([entry, ...existing].slice(0, MAX_ENTRIES));
  } finally {
    isActive = false;
    nextRunTs = Date.now() + INTERVAL_MS;
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────
export function startRadarWorker(): void {
  if (intervalHandle) return;

  logger.info({ intervalMs: INTERVAL_MS }, "radar-worker: iniciado");

  // Run immediately on start (after 5s to let server settle)
  setTimeout(() => { runSearch().catch((e) => logger.error({ e }, "radar-worker: erro inicial")); }, 5_000);

  nextRunTs = Date.now() + INTERVAL_MS;
  intervalHandle = setInterval(() => {
    runSearch().catch((e) => logger.error({ e }, "radar-worker: erro periódico"));
    nextRunTs = Date.now() + INTERVAL_MS;
  }, INTERVAL_MS);
}

export function stopRadarWorker(): void {
  if (intervalHandle) { clearInterval(intervalHandle); intervalHandle = null; }
  logger.info("radar-worker: parado");
}
