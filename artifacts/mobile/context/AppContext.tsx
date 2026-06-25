import { useSQLiteContext } from "expo-sqlite";
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { Platform } from "react-native";

const API_BASE =
  Platform.OS === "web"
    ? ""
    : `https://${process.env.EXPO_PUBLIC_DOMAIN ?? ""}`;

// ─── Types ────────────────────────────────────────────────────────────────────

export type LeadColumn = "novo" | "qualificado" | "proposta" | "fechado";

export interface Lead {
  id: string;
  name: string;
  company: string;
  value: number;
  phone: string;
  column: LeadColumn;
  tag: string;
  tagColor: string;
  time: string;
  initials: string;
  avatarColor: string;
}

export interface ConversationMessage {
  id: string;
  text: string;
  sender: "me" | "them";
  time: string;
  read: boolean;
}

export interface Conversation {
  id: string;
  contactName: string;
  lastMessage: string;
  time: string;
  unread: number;
  initials: string;
  avatarColor: string;
  isOnline: boolean;
  messages: ConversationMessage[];
}

export interface ModuleState {
  module_name: string;
  is_active: boolean;
  status: string;
  last_started_at: string | null;
  last_stopped_at: string | null;
  last_run_at: string | null;
  updated_at: string;
}

export interface ActivityEvent {
  id: string;
  type: "module" | "lead" | "message" | "deal" | "scan" | "campaign" | "error" | "task";
  text: string;
  icon: string;
  color: string;
  created_at: string;
}

export interface LeadActivity {
  id: string;
  channel: "jade" | "phone" | "whatsapp" | "email";
  agent: string;
  note: string;
  created_at: string;
}

export interface MarketingCampaign {
  id: string;
  type_id: string;
  type_title: string;
  channel: string;
  context_input: string;
  generated_content: string;
  status: string;
  created_at: string;
}

// ─── Context Type ─────────────────────────────────────────────────────────────

interface AppContextType {
  leads: Lead[];
  conversations: Conversation[];
  moduleStates: Record<string, ModuleState>;
  activityEvents: ActivityEvent[];
  campaigns: MarketingCampaign[];
  leadActivities: Record<string, LeadActivity[]>;
  loading: boolean;
  moveLead: (id: string, column: LeadColumn) => void;
  addLead: (lead: Lead) => void;
  toggleModule: (name: string) => Promise<void>;
  addActivityEvent: (event: Omit<ActivityEvent, "id" | "created_at">) => Promise<void>;
  addLeadActivity: (leadId: string, activity: Omit<LeadActivity, "id" | "created_at">) => void;
  addCampaign: (campaign: MarketingCampaign) => void;
  refreshDashboard: () => Promise<void>;
}

const AppContext = createContext<AppContextType | null>(null);

// ─── Default module states ─────────────────────────────────────────────────────

const DEFAULT_MODULES: Record<string, ModuleState> = {
  scanner: { module_name: "scanner", is_active: true, status: "running", last_started_at: null, last_stopped_at: null, last_run_at: null, updated_at: new Date().toISOString() },
  jade: { module_name: "jade", is_active: true, status: "running", last_started_at: null, last_stopped_at: null, last_run_at: null, updated_at: new Date().toISOString() },
  leads: { module_name: "leads", is_active: false, status: "idle", last_started_at: null, last_stopped_at: null, last_run_at: null, updated_at: new Date().toISOString() },
  whatsapp: { module_name: "whatsapp", is_active: false, status: "ready_paused", last_started_at: null, last_stopped_at: null, last_run_at: null, updated_at: new Date().toISOString() },
  marketing: { module_name: "marketing", is_active: false, status: "idle", last_started_at: null, last_stopped_at: null, last_run_at: null, updated_at: new Date().toISOString() },
};

// ─── API helpers ──────────────────────────────────────────────────────────────

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T | null> {
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers: { "Content-Type": "application/json", ...(options?.headers ?? {}) },
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

// ─── Seed data ────────────────────────────────────────────────────────────────

const SEED_LEADS: Lead[] = [
  { id: "1", name: "Carlos Mendes", company: "TechBrasil", value: 12500, phone: "+55 11 99999-1111", column: "novo", tag: "E-commerce", tagColor: "rgba(255,255,255,0.35)", time: "2h atrás", initials: "CM", avatarColor: "#8400FF" },
  { id: "2", name: "Ana Souza", company: "Inova LTDA", value: 8900, phone: "+55 21 99999-2222", column: "novo", tag: "SaaS", tagColor: "rgba(255,255,255,0.35)", time: "5h atrás", initials: "AS", avatarColor: "#FF0080" },
  { id: "3", name: "Pedro Rocha", company: "Digital Hub", value: 34000, phone: "+55 31 99999-3333", column: "qualificado", tag: "Enterprise", tagColor: "rgba(255,255,255,0.35)", time: "1d atrás", initials: "PR", avatarColor: "#5C0FAE" },
  { id: "4", name: "Mariana Lima", company: "StartUp XP", value: 6700, phone: "+55 41 99999-4444", column: "qualificado", tag: "PME", tagColor: "rgba(255,255,255,0.35)", time: "2d atrás", initials: "ML", avatarColor: "#A30055" },
  { id: "5", name: "Roberto Costa", company: "Fintec Brasil", value: 52000, phone: "+55 51 99999-5555", column: "proposta", tag: "Fintech", tagColor: "rgba(255,255,255,0.35)", time: "3d atrás", initials: "RC", avatarColor: "#8400FF" },
  { id: "6", name: "Juliana Ferreira", company: "AutoMais", value: 18900, phone: "+55 61 99999-6666", column: "proposta", tag: "Auto", tagColor: "rgba(255,255,255,0.35)", time: "4d atrás", initials: "JF", avatarColor: "#FF0080" },
  { id: "7", name: "Lucas Alves", company: "HealthPro", value: 27500, phone: "+55 71 99999-7777", column: "proposta", tag: "Health", tagColor: "rgba(255,255,255,0.35)", time: "5d atrás", initials: "LA", avatarColor: "#5C0FAE" },
  { id: "8", name: "Beatriz Santos", company: "EduTech", value: 9800, phone: "+55 81 99999-8888", column: "fechado", tag: "EdTech", tagColor: "rgba(255,255,255,0.35)", time: "1sem atrás", initials: "BS", avatarColor: "#A30055" },
  { id: "9", name: "Diego Nunes", company: "LogiMax", value: 41200, phone: "+55 91 99999-9999", column: "fechado", tag: "Logística", tagColor: "rgba(255,255,255,0.35)", time: "2sem atrás", initials: "DN", avatarColor: "#8400FF" },
];

const SEED_CONVERSATIONS: Conversation[] = [
  {
    id: "1", contactName: "Carlos Mendes", lastMessage: "Qual o valor mensal? Preciso apresentar para minha diretoria.", time: "10:24", unread: 3, initials: "CM", avatarColor: "#8400FF", isOnline: true,
    messages: [
      { id: "m1", text: "Olá! Vi sobre o plano Enterprise e tenho interesse em saber mais.", sender: "them", time: "10:20", read: true },
      { id: "m2", text: "Oi Carlos! Ótimo que entrou em contato. Posso te contar mais sobre nossas soluções?", sender: "me", time: "10:21", read: true },
      { id: "m3", text: "Sim, gostaria de saber sobre preços e integrações disponíveis.", sender: "them", time: "10:22", read: true },
      { id: "m4", text: "Claro! O plano Enterprise inclui integrações ilimitadas, suporte 24/7 e implementação dedicada.", sender: "me", time: "10:23", read: true },
      { id: "m5", text: "Qual o valor mensal? Preciso apresentar para minha diretoria.", sender: "them", time: "10:24", read: false },
    ],
  },
  {
    id: "2", contactName: "Ana Souza", lastMessage: "Perfeito! Vou encaminhar para o financeiro hoje.", time: "09:15", unread: 0, initials: "AS", avatarColor: "#FF0080", isOnline: true,
    messages: [
      { id: "m6", text: "Bom dia! Conseguiu analisar nossa proposta?", sender: "me", time: "09:10", read: true },
      { id: "m7", text: "Bom dia! Sim, achei muito interessante. Os números fazem sentido.", sender: "them", time: "09:12", read: true },
      { id: "m8", text: "Excelente! Posso agendar uma call para esta semana?", sender: "me", time: "09:13", read: true },
      { id: "m9", text: "Perfeito! Vou encaminhar para o financeiro hoje.", sender: "them", time: "09:15", read: true },
    ],
  },
  {
    id: "3", contactName: "Pedro Rocha", lastMessage: "Podemos marcar uma demo na próxima semana?", time: "Ontem", unread: 1, initials: "PR", avatarColor: "#5C0FAE", isOnline: false,
    messages: [
      { id: "m10", text: "Pedro, queria saber se teve chance de ver nosso material.", sender: "me", time: "Ontem 14:30", read: true },
      { id: "m11", text: "Sim, vi! A plataforma parece muito robusta.", sender: "them", time: "Ontem 15:00", read: true },
      { id: "m12", text: "Podemos marcar uma demo na próxima semana?", sender: "them", time: "Ontem 15:02", read: false },
    ],
  },
  {
    id: "4", contactName: "Mariana Lima", lastMessage: "Vou falar com meu sócio e te retorno.", time: "Seg", unread: 0, initials: "ML", avatarColor: "#FF0080", isOnline: false,
    messages: [
      { id: "m13", text: "Mariana, como posso te ajudar hoje?", sender: "me", time: "Seg 11:00", read: true },
      { id: "m14", text: "Vou falar com meu sócio e te retorno.", sender: "them", time: "Seg 11:30", read: true },
    ],
  },
  {
    id: "5", contactName: "Roberto Costa", lastMessage: "Contrato assinado! Obrigado pela atenção.", time: "Dom", unread: 0, initials: "RC", avatarColor: "#A30055", isOnline: false,
    messages: [
      { id: "m15", text: "Roberto, a proposta foi aprovada?", sender: "me", time: "Dom 09:00", read: true },
      { id: "m16", text: "Contrato assinado! Obrigado pela atenção.", sender: "them", time: "Dom 09:30", read: true },
    ],
  },
];

const SEED_ACTIVITY: ActivityEvent[] = [
  { id: "act1", type: "lead",    text: "Lead adicionado: Carlos Mendes (TechBrasil)",       icon: "user-plus", color: "#6C63FF", created_at: new Date().toISOString() },
  { id: "act2", type: "message", text: "JADE respondeu Ana Souza automaticamente",            icon: "robot",     color: "#FF0080", created_at: new Date().toISOString() },
  { id: "act3", type: "deal",    text: "Roberto Costa movido para Proposta",                 icon: "briefcase", color: "#00D68F", created_at: new Date().toISOString() },
  { id: "act4", type: "deal",    text: "Diego Nunes fechou contrato · R$ 41.200",            icon: "briefcase", color: "#00D68F", created_at: new Date().toISOString() },
  { id: "act5", type: "task",    text: "Follow-up agendado com Mariana Lima",                icon: "calendar",  color: "#FFB300", created_at: new Date().toISOString() },
  { id: "act6", type: "lead",    text: "⚡ Roberto Costa ficou quente — score 70",            icon: "trending-up", color: "#00D68F", created_at: new Date().toISOString() },
  { id: "act7", type: "lead",    text: "⚠️ Mariana Lima esfriou — sem contato há 2 dias",    icon: "trending-down", color: "#FF3B5C", created_at: new Date().toISOString() },
];

// ─── DB row types ─────────────────────────────────────────────────────────────

interface DBLead {
  id: string; name: string; company: string; value: number; phone: string;
  column_name: string; tag: string; tag_color: string; time_label: string;
  initials: string; avatar_color: string;
}

interface DBConversation {
  id: string; contact_name: string; last_message: string; time_label: string;
  unread: number; initials: string; avatar_color: string; is_online: number;
}

interface DBMessage {
  id: string; conversation_id: string; text: string; sender: string;
  time_label: string; read: number;
}

interface DBModuleState {
  module_name: string; is_active: number; status: string;
  last_started_at: string | null; last_stopped_at: string | null;
  last_run_at: string | null; updated_at: string;
}

interface DBActivityEvent {
  id: string; type: string; text: string; icon: string; color: string; created_at: number;
}

interface DBCampaign {
  id: string; type_id: string; type_title: string; channel: string;
  context_input: string; generated_content: string; status: string; created_at: number;
}

function dbLeadToLead(row: DBLead): Lead {
  return {
    id: row.id, name: row.name, company: row.company, value: row.value,
    phone: row.phone, column: row.column_name as LeadColumn,
    tag: row.tag, tagColor: row.tag_color, time: row.time_label,
    initials: row.initials, avatarColor: row.avatar_color,
  };
}

function dbModuleToModuleState(row: DBModuleState): ModuleState {
  return {
    module_name: row.module_name,
    is_active: row.is_active === 1,
    status: row.status,
    last_started_at: row.last_started_at,
    last_stopped_at: row.last_stopped_at,
    last_run_at: row.last_run_at,
    updated_at: row.updated_at,
  };
}

function uid(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

// ─── Native Provider ──────────────────────────────────────────────────────────

function NativeAppProvider({ children }: { children: React.ReactNode }) {
  const db = useSQLiteContext();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [moduleStates, setModuleStates] = useState<Record<string, ModuleState>>(DEFAULT_MODULES);
  const [activityEvents, setActivityEvents] = useState<ActivityEvent[]>(SEED_ACTIVITY);
  const [campaigns, setCampaigns] = useState<MarketingCampaign[]>([]);
  const [leadActivities, setLeadActivities] = useState<Record<string, LeadActivity[]>>({});
  const [loading, setLoading] = useState(true);
  const refreshRef = useRef(false);

  useEffect(() => {
    (async () => {
      try {
        const leadRows = await db.getAllAsync<DBLead>("SELECT * FROM leads ORDER BY created_at ASC");
        setLeads(leadRows.map(dbLeadToLead));

        const convRows = await db.getAllAsync<DBConversation>("SELECT * FROM conversations ORDER BY created_at ASC");
        const msgRows = await db.getAllAsync<DBMessage>("SELECT * FROM messages ORDER BY created_at ASC");
        setConversations(convRows.map((c) => ({
          id: c.id, contactName: c.contact_name, lastMessage: c.last_message,
          time: c.time_label, unread: c.unread, initials: c.initials,
          avatarColor: c.avatar_color, isOnline: c.is_online === 1,
          messages: msgRows.filter((m) => m.conversation_id === c.id).map((m) => ({
            id: m.id, text: m.text, sender: m.sender as "me" | "them",
            time: m.time_label, read: m.read === 1,
          })),
        })));

        const modRows = await db.getAllAsync<DBModuleState>("SELECT * FROM module_states");
        if (modRows.length > 0) {
          const mods: Record<string, ModuleState> = {};
          for (const r of modRows) mods[r.module_name] = dbModuleToModuleState(r);
          setModuleStates(mods);
        }

        const actRows = await db.getAllAsync<DBActivityEvent>("SELECT * FROM activity_events ORDER BY created_at DESC LIMIT 20");
        if (actRows.length > 0) {
          setActivityEvents(actRows.map((r) => ({
            id: r.id, type: r.type as ActivityEvent["type"], text: r.text,
            icon: r.icon, color: r.color, created_at: new Date(r.created_at * 1000).toISOString(),
          })));
        }

        const campRows = await db.getAllAsync<DBCampaign>("SELECT * FROM marketing_campaigns ORDER BY created_at DESC");
        setCampaigns(campRows.map((r) => ({
          id: r.id, type_id: r.type_id, type_title: r.type_title, channel: r.channel,
          context_input: r.context_input, generated_content: r.generated_content,
          status: r.status, created_at: new Date(r.created_at * 1000).toISOString(),
        })));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Sync module states from server
  const refreshDashboard = useCallback(async () => {
    if (refreshRef.current) return;
    refreshRef.current = true;
    try {
      const data = await apiFetch<{ modules: Record<string, ModuleState>; activity_events: ActivityEvent[] }>("/api/analytics/dashboard");
      if (data?.modules) {
        setModuleStates(data.modules);
        for (const [name, mod] of Object.entries(data.modules)) {
          await db.runAsync(
            `INSERT OR REPLACE INTO module_states (module_name, is_active, status, last_started_at, last_stopped_at, last_run_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [name, mod.is_active ? 1 : 0, mod.status, mod.last_started_at, mod.last_stopped_at, mod.last_run_at, mod.updated_at]
          );
        }
      }
      if (data?.activity_events && data.activity_events.length > 0) {
        setActivityEvents(data.activity_events);
      }
    } catch {
      // ignore
    } finally {
      refreshRef.current = false;
    }
  }, [db]);

  useEffect(() => {
    refreshDashboard();
  }, []);

  const addLeadActivityFn = useCallback((leadId: string, activity: Omit<LeadActivity, "id" | "created_at">) => {
    const newAct: LeadActivity = { id: uid(), ...activity, created_at: new Date().toISOString() };
    setLeadActivities((prev) => ({ ...prev, [leadId]: [newAct, ...(prev[leadId] ?? [])] }));
  }, []);

  const moveLead = async (id: string, column: LeadColumn) => {
    const lead = leads.find((l) => l.id === id);
    setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, column } : l)));
    await db.runAsync("UPDATE leads SET column_name = ?, updated_at = unixepoch() WHERE id = ?", [column, id]);
    if (lead) {
      const colLabel = { novo: "Novo", qualificado: "Qualificado", proposta: "Proposta", fechado: "Fechado" }[column] ?? column;
      addLeadActivityFn(id, { channel: "jade", agent: "CRM", note: `Movido para ${colLabel}.` });
      await addActivityEventFn({
        type: "deal",
        text: `${lead.name} movido para ${column.charAt(0).toUpperCase() + column.slice(1)}`,
        icon: "briefcase",
        color: "#00D68F",
      });
    }
  };

  const addLead = async (lead: Lead) => {
    const exists = leads.find((l) => l.id === lead.id);
    if (exists) return;
    setLeads((prev) => [lead, ...prev]);
    await db.runAsync(
      `INSERT OR IGNORE INTO leads (id, name, company, value, phone, column_name, tag, tag_color, time_label, initials, avatar_color)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [lead.id, lead.name, lead.company, lead.value, lead.phone, lead.column,
       lead.tag, lead.tagColor, lead.time, lead.initials, lead.avatarColor]
    );
    addLeadActivityFn(lead.id, { channel: "jade", agent: "JADE IA", note: "Lead adicionado via Scanner Radar. Primeiro contato automático." });
    await addActivityEventFn({
      type: "lead",
      text: `Novo lead adicionado: ${lead.name} (${lead.company})`,
      icon: "user-plus",
      color: "#6C63FF",
    });
  };

  const toggleModule = async (name: string) => {
    const current = moduleStates[name];
    const newActive = !current?.is_active;

    const optimistic: ModuleState = {
      ...(current ?? DEFAULT_MODULES[name] ?? { module_name: name, last_started_at: null, last_stopped_at: null, last_run_at: null }),
      is_active: newActive,
      status: newActive ? (name === "whatsapp" ? "ready_paused" : "running") : "paused",
      updated_at: new Date().toISOString(),
    };
    setModuleStates((prev) => ({ ...prev, [name]: optimistic }));

    await db.runAsync(
      `INSERT OR REPLACE INTO module_states (module_name, is_active, status, updated_at) VALUES (?, ?, ?, datetime('now'))`,
      [name, newActive ? 1 : 0, optimistic.status]
    );

    const data = await apiFetch<{ module: ModuleState }>(`/api/modules/${name}/toggle`, { method: "POST", body: JSON.stringify({ active: newActive }) });
    if (data?.module) {
      setModuleStates((prev) => ({ ...prev, [name]: data.module }));
    }
  };

  const addActivityEventFn = async (event: Omit<ActivityEvent, "id" | "created_at">) => {
    const newEvent: ActivityEvent = { id: uid(), ...event, created_at: new Date().toISOString() };
    setActivityEvents((prev) => [newEvent, ...prev.slice(0, 19)]);
    await db.runAsync(
      `INSERT INTO activity_events (id, type, text, icon, color) VALUES (?, ?, ?, ?, ?)`,
      [newEvent.id, newEvent.type, newEvent.text, newEvent.icon, newEvent.color]
    );
    await apiFetch("/api/activity", { method: "POST", body: JSON.stringify({ type: event.type, text: event.text, icon: event.icon, color: event.color }) });
  };

  const addCampaign = (campaign: MarketingCampaign) => {
    setCampaigns((prev) => [campaign, ...prev]);
    db.runAsync(
      `INSERT OR IGNORE INTO marketing_campaigns (id, type_id, type_title, channel, context_input, generated_content, status)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [campaign.id, campaign.type_id, campaign.type_title, campaign.channel,
       campaign.context_input, campaign.generated_content, campaign.status]
    );
  };

  const ctxValue = useMemo(() => ({
    leads, conversations, moduleStates, activityEvents, campaigns, leadActivities, loading,
    moveLead, addLead, toggleModule,
    addActivityEvent: addActivityEventFn,
    addLeadActivity: addLeadActivityFn,
    addCampaign, refreshDashboard,
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [leads, conversations, moduleStates, activityEvents, campaigns, leadActivities, loading]);

  return (
    <AppContext.Provider value={ctxValue}>
      {children}
    </AppContext.Provider>
  );
}

// ─── Web Provider ─────────────────────────────────────────────────────────────

function WebAppProvider({ children }: { children: React.ReactNode }) {
  const [leads, setLeads] = useState<Lead[]>(SEED_LEADS);
  const [conversations] = useState<Conversation[]>(SEED_CONVERSATIONS);
  const [moduleStates, setModuleStates] = useState<Record<string, ModuleState>>(DEFAULT_MODULES);
  const [activityEvents, setActivityEvents] = useState<ActivityEvent[]>(SEED_ACTIVITY);
  const [campaigns, setCampaigns] = useState<MarketingCampaign[]>([]);
  const [leadActivities, setLeadActivities] = useState<Record<string, LeadActivity[]>>({});

  useEffect(() => {
    (async () => {
      const data = await apiFetch<{ modules: Record<string, ModuleState>; activity_events: ActivityEvent[] }>("/api/analytics/dashboard");
      if (data?.modules) setModuleStates(data.modules);
      if (data?.activity_events && data.activity_events.length > 0) setActivityEvents(data.activity_events);
    })();
  }, []);

  const addLeadActivityFn = useCallback((leadId: string, activity: Omit<LeadActivity, "id" | "created_at">) => {
    const newAct: LeadActivity = { id: uid(), ...activity, created_at: new Date().toISOString() };
    setLeadActivities((prev) => ({ ...prev, [leadId]: [newAct, ...(prev[leadId] ?? [])] }));
  }, []);

  const moveLead = (id: string, column: LeadColumn) => {
    const lead = leads.find((l) => l.id === id);
    setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, column } : l)));
    if (lead) {
      const colLabel = { novo: "Novo", qualificado: "Qualificado", proposta: "Proposta", fechado: "Fechado" }[column] ?? column;
      addLeadActivityFn(id, { channel: "jade", agent: "CRM", note: `Movido para ${colLabel}.` });
      addActivityEventFn({ type: "deal", text: `${lead.name} movido para ${column}`, icon: "briefcase", color: "#00D68F" });
    }
  };

  const addLead = (lead: Lead) => {
    setLeads((prev) => {
      if (prev.find((l) => l.id === lead.id)) return prev;
      return [lead, ...prev];
    });
    addLeadActivityFn(lead.id, { channel: "jade", agent: "JADE IA", note: "Lead adicionado via Scanner Radar. Primeiro contato automático." });
    addActivityEventFn({ type: "lead", text: `Novo lead: ${lead.name} (${lead.company})`, icon: "user-plus", color: "#6C63FF" });
  };

  const toggleModule = async (name: string) => {
    const current = moduleStates[name];
    const newActive = !current?.is_active;
    setModuleStates((prev) => ({
      ...prev,
      [name]: { ...(current ?? DEFAULT_MODULES[name]!), is_active: newActive, status: newActive ? (name === "whatsapp" ? "ready_paused" : "running") : "paused", updated_at: new Date().toISOString() },
    }));
    await apiFetch<{ module: ModuleState }>(`/api/modules/${name}/toggle`, { method: "POST", body: JSON.stringify({ active: newActive }) });
  };

  const addActivityEventFn = async (event: Omit<ActivityEvent, "id" | "created_at">) => {
    const newEvent: ActivityEvent = { id: uid(), ...event, created_at: new Date().toISOString() };
    setActivityEvents((prev) => [newEvent, ...prev.slice(0, 19)]);
    await apiFetch("/api/activity", { method: "POST", body: JSON.stringify(event) });
  };

  const addCampaign = (campaign: MarketingCampaign) => {
    setCampaigns((prev) => [campaign, ...prev]);
  };

  const refreshDashboard = async () => {
    const data = await apiFetch<{ modules: Record<string, ModuleState>; activity_events: ActivityEvent[] }>("/api/analytics/dashboard");
    if (data?.modules) setModuleStates(data.modules);
    if (data?.activity_events && data.activity_events.length > 0) setActivityEvents(data.activity_events);
  };

  const ctxValue = useMemo(() => ({
    leads, conversations, moduleStates, activityEvents, campaigns, leadActivities, loading: false as const,
    moveLead, addLead, toggleModule,
    addActivityEvent: addActivityEventFn,
    addLeadActivity: addLeadActivityFn,
    addCampaign, refreshDashboard,
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [leads, conversations, moduleStates, activityEvents, campaigns, leadActivities]);

  return (
    <AppContext.Provider value={ctxValue}>
      {children}
    </AppContext.Provider>
  );
}

// ─── Root Provider ─────────────────────────────────────────────────────────────

export function AppProvider({ children }: { children: React.ReactNode }) {
  if (Platform.OS === "web") {
    return <WebAppProvider>{children}</WebAppProvider>;
  }
  return <NativeAppProvider>{children}</NativeAppProvider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
