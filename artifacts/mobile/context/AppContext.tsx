import React, { createContext, useContext, useState } from "react";

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

interface AppContextType {
  leads: Lead[];
  conversations: Conversation[];
  moveLead: (id: string, column: LeadColumn) => void;
}

const INITIAL_LEADS: Lead[] = [
  { id: "1", name: "Carlos Mendes", company: "TechBrasil", value: 12500, phone: "+55 11 99999-1111", column: "novo", tag: "E-commerce", tagColor: "#6C63FF", time: "2h atrás", initials: "CM", avatarColor: "#FF6B35" },
  { id: "2", name: "Ana Souza", company: "Inova LTDA", value: 8900, phone: "+55 21 99999-2222", column: "novo", tag: "SaaS", tagColor: "#FF0080", time: "5h atrás", initials: "AS", avatarColor: "#00D68F" },
  { id: "3", name: "Pedro Rocha", company: "Digital Hub", value: 34000, phone: "+55 31 99999-3333", column: "qualificado", tag: "Enterprise", tagColor: "#FFB300", time: "1d atrás", initials: "PR", avatarColor: "#6C63FF" },
  { id: "4", name: "Mariana Lima", company: "StartUp XP", value: 6700, phone: "+55 41 99999-4444", column: "qualificado", tag: "PME", tagColor: "#00D68F", time: "2d atrás", initials: "ML", avatarColor: "#FF0080" },
  { id: "5", name: "Roberto Costa", company: "Fintec Brasil", value: 52000, phone: "+55 51 99999-5555", column: "proposta", tag: "Fintech", tagColor: "#4ECDC4", time: "3d atrás", initials: "RC", avatarColor: "#FFB300" },
  { id: "6", name: "Juliana Ferreira", company: "AutoMais", value: 18900, phone: "+55 61 99999-6666", column: "proposta", tag: "Auto", tagColor: "#FF6B35", time: "4d atrás", initials: "JF", avatarColor: "#4ECDC4" },
  { id: "7", name: "Lucas Alves", company: "HealthPro", value: 27500, phone: "+55 71 99999-7777", column: "proposta", tag: "Health", tagColor: "#00D68F", time: "5d atrás", initials: "LA", avatarColor: "#00BCD4" },
  { id: "8", name: "Beatriz Santos", company: "EduTech", value: 9800, phone: "+55 81 99999-8888", column: "fechado", tag: "EdTech", tagColor: "#AB47BC", time: "1sem atrás", initials: "BS", avatarColor: "#AB47BC" },
  { id: "9", name: "Diego Nunes", company: "LogiMax", value: 41200, phone: "+55 91 99999-9999", column: "fechado", tag: "Logística", tagColor: "#FF6B35", time: "2sem atrás", initials: "DN", avatarColor: "#FF6B35" },
];

const INITIAL_CONVERSATIONS: Conversation[] = [
  {
    id: "1",
    contactName: "Carlos Mendes",
    lastMessage: "Olá! Vi sobre o plano Enterprise e tenho interesse...",
    time: "10:24",
    unread: 3,
    initials: "CM",
    avatarColor: "#FF6B35",
    isOnline: true,
    messages: [
      { id: "1", text: "Olá! Vi sobre o plano Enterprise e tenho interesse em saber mais.", sender: "them", time: "10:20", read: true },
      { id: "2", text: "Oi Carlos! Ótimo que entrou em contato. Posso te contar mais sobre nossas soluções?", sender: "me", time: "10:21", read: true },
      { id: "3", text: "Sim, gostaria de saber sobre preços e integrações disponíveis.", sender: "them", time: "10:22", read: true },
      { id: "4", text: "Claro! O plano Enterprise inclui integrações ilimitadas, suporte 24/7 e implementação dedicada.", sender: "me", time: "10:23", read: true },
      { id: "5", text: "Qual o valor mensal? Preciso apresentar para minha diretoria.", sender: "them", time: "10:24", read: false },
    ],
  },
  {
    id: "2",
    contactName: "Ana Souza",
    lastMessage: "Perfeito! Vou encaminhar para o financeiro hoje.",
    time: "09:15",
    unread: 0,
    initials: "AS",
    avatarColor: "#00D68F",
    isOnline: true,
    messages: [
      { id: "1", text: "Bom dia! Conseguiu analisar nossa proposta?", sender: "me", time: "09:10", read: true },
      { id: "2", text: "Bom dia! Sim, achei muito interessante. Os números fazem sentido.", sender: "them", time: "09:12", read: true },
      { id: "3", text: "Excelente! Posso agendar uma call para esta semana?", sender: "me", time: "09:13", read: true },
      { id: "4", text: "Perfeito! Vou encaminhar para o financeiro hoje.", sender: "them", time: "09:15", read: true },
    ],
  },
  {
    id: "3",
    contactName: "Pedro Rocha",
    lastMessage: "Podemos marcar uma demo na próxima semana?",
    time: "Ontem",
    unread: 1,
    initials: "PR",
    avatarColor: "#6C63FF",
    isOnline: false,
    messages: [
      { id: "1", text: "Pedro, queria saber se teve chance de ver nosso material.", sender: "me", time: "Ontem 14:30", read: true },
      { id: "2", text: "Sim, vi! A plataforma parece muito robusta.", sender: "them", time: "Ontem 15:00", read: true },
      { id: "3", text: "Podemos marcar uma demo na próxima semana?", sender: "them", time: "Ontem 15:02", read: false },
    ],
  },
  {
    id: "4",
    contactName: "Mariana Lima",
    lastMessage: "Vou falar com meu sócio e te retorno.",
    time: "Seg",
    unread: 0,
    initials: "ML",
    avatarColor: "#FF0080",
    isOnline: false,
    messages: [
      { id: "1", text: "Mariana, como posso te ajudar hoje?", sender: "me", time: "Seg 11:00", read: true },
      { id: "2", text: "Vou falar com meu sócio e te retorno.", sender: "them", time: "Seg 11:30", read: true },
    ],
  },
  {
    id: "5",
    contactName: "Roberto Costa",
    lastMessage: "Contrato assinado! Obrigado pela atenção.",
    time: "Dom",
    unread: 0,
    initials: "RC",
    avatarColor: "#FFB300",
    isOnline: false,
    messages: [
      { id: "1", text: "Roberto, a proposta foi aprovada?", sender: "me", time: "Dom 09:00", read: true },
      { id: "2", text: "Contrato assinado! Obrigado pela atenção.", sender: "them", time: "Dom 09:30", read: true },
    ],
  },
];

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [leads, setLeads] = useState<Lead[]>(INITIAL_LEADS);
  const [conversations] = useState<Conversation[]>(INITIAL_CONVERSATIONS);

  const moveLead = (id: string, column: LeadColumn) => {
    setLeads((prev) =>
      prev.map((l) => (l.id === id ? { ...l, column } : l))
    );
  };

  return (
    <AppContext.Provider value={{ leads, conversations, moveLead }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
