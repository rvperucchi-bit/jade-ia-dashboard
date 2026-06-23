import fs from "fs";
import path from "path";
import crypto from "crypto";

const DATA_DIR = process.env.DATA_DIR ?? path.join(process.cwd(), "data");
const STATE_FILE = path.join(DATA_DIR, "jade-state.json");

export type ModuleStatus = "idle" | "running" | "paused" | "error" | "ready_paused";

export interface ModuleState {
  module_name: string;
  is_active: boolean;
  last_started_at: string | null;
  last_stopped_at: string | null;
  last_run_at: string | null;
  status: ModuleStatus;
  updated_at: string;
}

export interface ModuleLog {
  id: string;
  module_name: string;
  action: string;
  message: string;
  metadata?: Record<string, unknown>;
  created_at: string;
}

export interface ActivityEvent {
  id: string;
  type: "module" | "lead" | "message" | "deal" | "scan" | "campaign" | "error" | "task";
  text: string;
  icon: string;
  color: string;
  metadata?: Record<string, unknown>;
  created_at: string;
}

export interface MarketingCampaign {
  id: string;
  type_id: string;
  type_title: string;
  channel: string;
  context_input: string;
  generated_content: string;
  status: "draft" | "active" | "archived";
  created_at: string;
}

export interface JadeSession {
  id: string;
  title: string;
  messages: Array<{ role: "user" | "model"; content: string; time: string }>;
  created_at: string;
  updated_at: string;
}

export interface ScannerHistory {
  id: string;
  tipo: string;
  bairro?: string;
  cidade?: string;
  results_count: number;
  results: unknown[];
  created_at: string;
}

export interface CompanyConfig {
  nome: string;
  produto: string;
  segmento: string;
  tom: string;
  planos: string;
  cidade?: string;
  estado?: string;
  modoOperacao?: string;
  updated_at: string;
}

interface StoreData {
  modules: Record<string, ModuleState>;
  module_logs: ModuleLog[];
  activity_events: ActivityEvent[];
  marketing_campaigns: MarketingCampaign[];
  jade_sessions: JadeSession[];
  scanner_history: ScannerHistory[];
  company_config?: CompanyConfig;
}

const DEFAULT_MODULES: Record<string, ModuleState> = {
  scanner: {
    module_name: "scanner", is_active: true, status: "idle",
    last_started_at: new Date().toISOString(), last_stopped_at: null, last_run_at: null,
    updated_at: new Date().toISOString(),
  },
  jade: {
    module_name: "jade", is_active: true, status: "running",
    last_started_at: new Date().toISOString(), last_stopped_at: null, last_run_at: null,
    updated_at: new Date().toISOString(),
  },
  leads: {
    module_name: "leads", is_active: false, status: "idle",
    last_started_at: null, last_stopped_at: null, last_run_at: null,
    updated_at: new Date().toISOString(),
  },
  whatsapp: {
    module_name: "whatsapp", is_active: false, status: "ready_paused",
    last_started_at: null, last_stopped_at: null, last_run_at: null,
    updated_at: new Date().toISOString(),
  },
  marketing: {
    module_name: "marketing", is_active: false, status: "idle",
    last_started_at: null, last_stopped_at: null, last_run_at: null,
    updated_at: new Date().toISOString(),
  },
};

function load(): StoreData {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    if (!fs.existsSync(STATE_FILE)) return { modules: DEFAULT_MODULES, module_logs: [], activity_events: [], marketing_campaigns: [], jade_sessions: [], scanner_history: [] };
    const raw = fs.readFileSync(STATE_FILE, "utf-8");
    const parsed = JSON.parse(raw) as StoreData;
    for (const key of Object.keys(DEFAULT_MODULES)) {
      if (!parsed.modules[key]) parsed.modules[key] = DEFAULT_MODULES[key]!;
    }
    return parsed;
  } catch {
    return { modules: DEFAULT_MODULES, module_logs: [], activity_events: [], marketing_campaigns: [], jade_sessions: [], scanner_history: [] };
  }
}

function save(data: StoreData): void {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(STATE_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error("State save error:", err);
  }
}

export function uid(): string {
  return crypto.randomBytes(8).toString("hex");
}

export function now(): string {
  return new Date().toISOString();
}

// ─── Modules ─────────────────────────────────────────────────────────────────

export function getAllModules(): Record<string, ModuleState> {
  return load().modules;
}

export function getModule(name: string): ModuleState | null {
  return load().modules[name] ?? null;
}

export function setModuleActive(name: string, active: boolean): ModuleState | null {
  const data = load();
  const mod = data.modules[name];
  if (!mod) return null;
  const ts = now();
  mod.is_active = active;
  mod.updated_at = ts;
  if (active) {
    mod.last_started_at = ts;
    mod.status = name === "whatsapp" ? "ready_paused" : "running";
  } else {
    mod.last_stopped_at = ts;
    mod.status = "paused";
  }
  save(data);
  return mod;
}

export function setModuleLastRun(name: string): void {
  const data = load();
  const mod = data.modules[name];
  if (!mod) return;
  mod.last_run_at = now();
  mod.updated_at = now();
  save(data);
}

// ─── Logs ─────────────────────────────────────────────────────────────────────

export function addModuleLog(log: Omit<ModuleLog, "id" | "created_at">): ModuleLog {
  const data = load();
  const entry: ModuleLog = { id: uid(), ...log, created_at: now() };
  data.module_logs.unshift(entry);
  if (data.module_logs.length > 500) data.module_logs = data.module_logs.slice(0, 500);
  save(data);
  return entry;
}

export function getModuleLogs(name: string, limit = 50): ModuleLog[] {
  const data = load();
  return data.module_logs.filter((l) => l.module_name === name).slice(0, limit);
}

// ─── Activity Events ──────────────────────────────────────────────────────────

export function addActivityEvent(event: Omit<ActivityEvent, "id" | "created_at">): ActivityEvent {
  const data = load();
  const entry: ActivityEvent = { id: uid(), ...event, created_at: now() };
  data.activity_events.unshift(entry);
  if (data.activity_events.length > 200) data.activity_events = data.activity_events.slice(0, 200);
  save(data);
  return entry;
}

export function getActivityEvents(limit = 20): ActivityEvent[] {
  const data = load();
  return data.activity_events.slice(0, limit);
}

// ─── Marketing Campaigns ──────────────────────────────────────────────────────

export function addCampaign(c: Omit<MarketingCampaign, "id" | "created_at">): MarketingCampaign {
  const data = load();
  const entry: MarketingCampaign = { id: uid(), ...c, created_at: now() };
  data.marketing_campaigns.unshift(entry);
  save(data);
  return entry;
}

export function getAllCampaigns(): MarketingCampaign[] {
  return load().marketing_campaigns;
}

export function getCampaign(id: string): MarketingCampaign | null {
  return load().marketing_campaigns.find((c) => c.id === id) ?? null;
}

// ─── JADE Sessions ────────────────────────────────────────────────────────────

export function createJadeSession(title = "Nova conversa"): JadeSession {
  const data = load();
  const session: JadeSession = { id: uid(), title, messages: [], created_at: now(), updated_at: now() };
  data.jade_sessions.unshift(session);
  if (data.jade_sessions.length > 100) data.jade_sessions = data.jade_sessions.slice(0, 100);
  save(data);
  return session;
}

export function getJadeSessions(): JadeSession[] {
  return load().jade_sessions;
}

export function getJadeSession(id: string): JadeSession | null {
  return load().jade_sessions.find((s) => s.id === id) ?? null;
}

export function appendJadeMessage(sessionId: string, role: "user" | "model", content: string): JadeSession | null {
  const data = load();
  const session = data.jade_sessions.find((s) => s.id === sessionId);
  if (!session) return null;
  session.messages.push({ role, content, time: now() });
  session.updated_at = now();
  if (session.title === "Nova conversa" && role === "user" && content.length > 5) {
    session.title = content.slice(0, 40) + (content.length > 40 ? "…" : "");
  }
  save(data);
  return session;
}

export function deleteJadeSession(id: string): boolean {
  const data = load();
  const before = data.jade_sessions.length;
  data.jade_sessions = data.jade_sessions.filter((s) => s.id !== id);
  save(data);
  return data.jade_sessions.length < before;
}

// ─── Company Config ───────────────────────────────────────────────────────────

export function getCompanyConfig(): CompanyConfig | null {
  return load().company_config ?? null;
}

export function setCompanyConfig(config: Omit<CompanyConfig, "updated_at">): CompanyConfig {
  const data = load();
  const entry: CompanyConfig = { ...config, updated_at: now() };
  data.company_config = entry;
  save(data);
  return entry;
}

// ─── Scanner History ──────────────────────────────────────────────────────────

export function addScannerHistory(entry: Omit<ScannerHistory, "id" | "created_at">): ScannerHistory {
  const data = load();
  const record: ScannerHistory = { id: uid(), ...entry, created_at: now() };
  data.scanner_history.unshift(record);
  if (data.scanner_history.length > 100) data.scanner_history = data.scanner_history.slice(0, 100);
  save(data);
  return record;
}

export function getScannerHistory(limit = 20): ScannerHistory[] {
  return load().scanner_history.slice(0, limit);
}

// ─── CRM Leads ────────────────────────────────────────────────────────────────

export type CrmStatus =
  | 'Primeiro Contato' | 'Em andamento' | 'Morno' | 'Quente'
  | 'Frio' | 'Fechado' | 'Descartado' | 'Inválido' | 'Arquivado';

export type CrmPipeline = 'Novo' | 'Em negociação' | 'Ganho' | 'Perdido' | 'Arquivado';

export interface CrmLead {
  id: string;
  name: string;
  phone: string;
  address: string;
  segment: string;
  city: string;
  status: CrmStatus;
  pipeline: CrmPipeline;
  followUpDate: string | null;
  attempts: number;
  notes: string;
  created_at: string;
  updated_at: string;
}

const CRM_FILE = path.join(DATA_DIR, 'leads-crm.json');

function loadCrm(): CrmLead[] {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    if (!fs.existsSync(CRM_FILE)) return [];
    return JSON.parse(fs.readFileSync(CRM_FILE, 'utf-8')) as CrmLead[];
  } catch { return []; }
}

function saveCrmStore(leads: CrmLead[]): void {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(CRM_FILE, JSON.stringify(leads, null, 2), 'utf-8');
}

export function saveCrmLead(data: Omit<CrmLead, 'id' | 'created_at' | 'updated_at'>): CrmLead {
  const leads = loadCrm();
  const entry: CrmLead = { id: uid(), ...data, created_at: now(), updated_at: now() };
  leads.unshift(entry);
  if (leads.length > 500) leads.splice(500);
  saveCrmStore(leads);
  return entry;
}

export function getCrmLeads(): CrmLead[] {
  return loadCrm();
}

export function updateCrmLead(
  id: string,
  updates: Partial<Pick<CrmLead, 'status' | 'pipeline' | 'followUpDate' | 'attempts' | 'notes'>>,
): CrmLead | null {
  const leads = loadCrm();
  const idx = leads.findIndex((l) => l.id === id);
  if (idx < 0) return null;
  leads[idx] = { ...leads[idx]!, ...updates, updated_at: now() };
  saveCrmStore(leads);
  return leads[idx]!;
}
