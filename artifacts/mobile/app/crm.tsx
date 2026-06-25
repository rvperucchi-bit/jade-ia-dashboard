import AsyncStorage from "@react-native-async-storage/async-storage";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Easing,
  FlatList,
  Linking,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";

const PINK = "#FF0080";
const PURPLE = "#8400FF";

const SEGMENT_KEYWORDS: { label: string; keys: string[] }[] = [
  { label: "Serviços & Construção",    keys: ["constru", "reforma", "obra", "pedreiro", "engenharia", "arquitet"] },
  { label: "Clínicas & Saúde",         keys: ["clínica", "clinica", "saúde", "saude", "médic", "medic", "dentist", "hospital", "fisio", "odonto"] },
  { label: "Imobiliário",              keys: ["imóvel", "imovel", "imobiliar", "apartamento", "corretor", "loteamento", "incorpor"] },
  { label: "Advocacia",                keys: ["advogad", "advocacia", "jurídic", "juridic", "escritório jurídico"] },
  { label: "Varejo & E-commerce",      keys: ["varejo", "loja", "e-commerce", "ecommerce", "comércio", "comercio", "supermercado"] },
  { label: "Consultoria & B2B/SaaS",   keys: ["consultor", "saas", "software", "b2b", "tecnologia", "tech", "startup"] },
  { label: "Seguros",                  keys: ["seguro", "proteção", "protecao", "apólice", "apolice", "corretora de seguro"] },
  { label: "Educação",                 keys: ["escola", "curso", "educação", "educacao", "faculdade", "colégio", "colegio", "ensino"] },
  { label: "Financeiro & Crédito",     keys: ["crédito", "credito", "financeiro", "banco", "empréstimo", "emprestimo", "fintech"] },
  { label: "Alimentação & Food Service", keys: ["restaurante", "lanchonete", "alimentação", "alimentacao", "food", "padaria", "bar ", "café", "pizzar"] },
  { label: "Beleza",                   keys: ["salão", "salao", "beleza", "estética", "estetica", "cabeleir", "maquiagem", "spa", "barbearia"] },
  { label: "Oficinas & Manutenção",    keys: ["oficina", "mecânica", "mecanica", "autopeça", "autopeca", "elétrica automotiva"] },
  { label: "Marketing & Publicidade",  keys: ["marketing", "publicidade", "agência", "agencia", "propaganda", "mídia", "midia"] },
  { label: "Moda",                     keys: ["moda", "roupa", "vestuário", "vestuario", "confecção", "confeccao", "boutique"] },
];

function resolveSegLabel(seg: string): string {
  if (!seg || seg === "—") return "";
  const t = seg.trim().toLowerCase();
  for (const { label, keys } of SEGMENT_KEYWORDS) {
    if (keys.some((k) => t.includes(k))) return label;
  }
  // Fallback: se for curto, usa direto; senão pega primeira palavra
  if (t.length <= 22) return seg.trim();
  return seg.trim().split(/\s+/)[0] ?? seg.slice(0, 18);
}

export interface CrmLeadLocal {
  id: string;
  nome: string;
  empresa: string;
  telefone: string;
  endereco: string;
  segmento: string;
  status: string;
  pipeline: string;
  dataAbordagem: string;
  cidade: string;
}

type ContactStatus = "novo" | "em_contato" | "quente" | "negociacao" | "fechado" | "perdido";

interface Contact {
  id: string;
  name: string;
  company: string;
  segment: string;
  status: ContactStatus;
  lastContact: string;
  score: number;
  phone: string;
  cidade?: string;
  endereco?: string;
  notes?: string;
  dataAbordagem?: string;
}

const STATUS_CONFIG: Record<ContactStatus, { label: string; color: string }> = {
  novo:        { label: "Novo",        color: "#5577FF" },
  em_contato:  { label: "Em contato",  color: PURPLE },
  quente:      { label: "Quente",      color: "#FF8800" },
  negociacao:  { label: "Negociação",  color: PINK },
  fechado:     { label: "Fechado",     color: "#00D68F" },
  perdido:     { label: "Perdido",     color: "#AA4444" },
};

const FILTER_OPTIONS: { key: ContactStatus | "todos"; label: string }[] = [
  { key: "todos",       label: "Todos" },
  { key: "novo",        label: "Novos" },
  { key: "em_contato",  label: "Em contato" },
  { key: "quente",      label: "Quentes" },
  { key: "negociacao",  label: "Negociação" },
  { key: "fechado",     label: "Fechados" },
  { key: "perdido",     label: "Perdidos" },
];

function mapStatus(s: string): ContactStatus {
  switch (s) {
    case "Primeiro Contato": return "novo";
    case "Em andamento":     return "em_contato";
    case "Morno":            return "em_contato";
    case "Quente":           return "quente";
    case "Frio":             return "perdido";
    case "Fechado":
    case "Cliente":          return "fechado";
    case "Descartado":
    case "Inválido":
    case "Arquivado":        return "perdido";
    default:                 return "novo";
  }
}

function scoreFromStatus(s: string): number {
  switch (s) {
    case "Fechado":          return 95;
    case "Cliente":          return 92;
    case "Quente":           return 80;
    case "Em andamento":     return 62;
    case "Morno":            return 50;
    default:                 return 40;
  }
}

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    const now = new Date();
    const diff = Math.floor((now.getTime() - d.getTime()) / 1000);
    if (diff < 60)         return "agora";
    if (diff < 3600)       return `${Math.floor(diff / 60)} min atrás`;
    if (diff < 86400)      return `Hoje, ${d.getHours().toString().padStart(2,"0")}:${d.getMinutes().toString().padStart(2,"0")}`;
    if (diff < 172800)     return "Ontem";
    if (diff < 604800)     return `${Math.floor(diff / 86400)} dias atrás`;
    return d.toLocaleDateString("pt-BR");
  } catch { return "—"; }
}

function leadToContact(l: CrmLeadLocal): Contact {
  return {
    id: l.id,
    name: l.nome,
    company: l.empresa || l.nome,
    segment: l.segmento || "—",
    status: mapStatus(l.status),
    lastContact: formatDate(l.dataAbordagem),
    score: scoreFromStatus(l.status),
    phone: l.telefone,
    cidade: l.cidade,
    endereco: l.endereco,
    notes: l.pipeline,
    dataAbordagem: l.dataAbordagem,
  };
}

function ScoreBadge({ score }: { score: number }) {
  const color = score >= 80 ? "#00D68F" : score >= 60 ? "#FFB300" : "#AA4444";
  return (
    <View style={[SB.wrap, { backgroundColor: color + "22", borderColor: color + "44" }]}>
      <Text style={[SB.text, { color }]}>{score}</Text>
    </View>
  );
}
const SB = StyleSheet.create({
  wrap: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, borderWidth: 1 },
  text: { fontSize: 11, fontFamily: "SpaceGrotesk_700Bold" },
});

function ContactDetailModal({ contact, visible, onClose }: { contact: Contact | null; visible: boolean; onClose: () => void }) {
  const colors = useColors();
  const slideY = useRef(new Animated.Value(80)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(slideY,  { toValue: 0,  duration: 340, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1,  duration: 260, useNativeDriver: true }),
      ]).start();
    } else {
      slideY.setValue(80);
      opacity.setValue(0);
    }
  }, [visible]);

  if (!contact) return null;
  const cfg = STATUS_CONFIG[contact.status];
  const scoreColor = contact.score >= 80 ? "#22CC88" : contact.score >= 60 ? "#FF8800" : "#AA4444";

  const callPhone = () => {
    const p = contact.phone?.replace(/\D/g, "");
    if (p) Linking.openURL("tel:" + p);
  };

  const openWhatsApp = () => {
    const p = contact.phone?.replace(/\D/g, "");
    if (p) Linking.openURL("https://wa.me/55" + p);
    onClose();
  };

  const nextActions: Record<string, string[]> = {
    novo:        ["Fazer primeiro contato via WhatsApp", "Identificar necessidade principal", "Agendar apresentação"],
    em_contato:  ["Enviar material de apoio", "Confirmar interesse e urgência", "Registrar objeções levantadas"],
    quente:      ["Preparar proposta personalizada", "Confirmar decisor e prazo", "Marcar reunião de fechamento"],
    negociacao:  ["Negociar condições finais", "Solicitar aprovação formal", "Preparar contrato"],
    fechado:     ["Solicitar indicações de clientes", "Iniciar onboarding", "Coletar feedback pós-venda"],
    perdido:     ["Entender motivo de perda", "Registrar feedback no CRM", "Avaliar retomada em 90 dias"],
  };

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.72)", justifyContent: "flex-end" }}>
        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onClose} />
        <Animated.View style={[DM.sheet, { backgroundColor: colors.background, opacity, transform: [{ translateY: slideY }] }]}>
          <View style={[DM.handle, { backgroundColor: colors.border }]} />

          <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
            {/* Header */}
            <View style={DM.header}>
              <View style={[DM.avatar, { backgroundColor: PINK + "22" }]}>
                <Text style={DM.avatarText}>{contact.name[0]?.toUpperCase() ?? "?"}</Text>
              </View>
              <View style={{ flex: 1, gap: 3 }}>
                <Text style={[DM.name, { color: colors.text }]}>{contact.name}</Text>
                {contact.company !== contact.name && (
                  <Text style={[DM.company, { color: colors.mutedForeground }]}>{contact.company}</Text>
                )}
                <View style={{ flexDirection: "row", gap: 8, marginTop: 2 }}>
                  <View style={[DM.statusPill, { backgroundColor: cfg.color + "22" }]}>
                    <Text style={[DM.statusText, { color: cfg.color }]}>{cfg.label}</Text>
                  </View>
                  <View style={[DM.statusPill, { backgroundColor: scoreColor + "22" }]}>
                    <Text style={[DM.statusText, { color: scoreColor }]}>Score {contact.score}</Text>
                  </View>
                </View>
              </View>
              <TouchableOpacity onPress={onClose} hitSlop={{ top: 12, right: 12, bottom: 12, left: 12 }}>
                <Feather name="x" size={20} color={colors.mutedForeground} />
              </TouchableOpacity>
            </View>

            {/* Info pills */}
            <View style={DM.pills}>
              {contact.segment && contact.segment !== "—" && (
                <View style={[DM.pill, { backgroundColor: PURPLE + "18", borderColor: PURPLE + "33" }]}>
                  <Feather name="tag" size={11} color={PURPLE} />
                  <Text style={[DM.pillText, { color: PURPLE }]}>{contact.segment}</Text>
                </View>
              )}
              {contact.phone ? (
                <View style={[DM.pill, { backgroundColor: "rgba(255,255,255,0.06)", borderColor: colors.border }]}>
                  <Feather name="phone" size={11} color={colors.mutedForeground} />
                  <Text style={[DM.pillText, { color: colors.mutedForeground }]}>{contact.phone}</Text>
                </View>
              ) : null}
              {contact.cidade ? (
                <View style={[DM.pill, { backgroundColor: "rgba(255,255,255,0.06)", borderColor: colors.border }]}>
                  <Feather name="map-pin" size={11} color={colors.mutedForeground} />
                  <Text style={[DM.pillText, { color: colors.mutedForeground }]}>{contact.cidade}</Text>
                </View>
              ) : null}
            </View>

            {/* Stats */}
            <View style={DM.statsRow}>
              {[
                { label: "Último Contato", value: contact.lastContact },
                { label: "Score",          value: `${contact.score}` },
                { label: "Status",         value: cfg.label },
              ].map((s, i) => (
                <View key={i} style={[DM.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <Text style={[DM.statVal, { color: colors.text }]}>{s.value}</Text>
                  <Text style={[DM.statLbl, { color: colors.mutedForeground }]}>{s.label}</Text>
                </View>
              ))}
            </View>

            {/* Detalhes adicionais */}
            {(contact.endereco || contact.notes || contact.dataAbordagem) && (
              <View style={[DM.detailsCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                {contact.endereco ? (
                  <View style={DM.detailRow}>
                    <Feather name="home" size={13} color={colors.mutedForeground} />
                    <Text style={[DM.detailText, { color: colors.mutedForeground }]}>{contact.endereco}</Text>
                  </View>
                ) : null}
                {contact.notes ? (
                  <View style={DM.detailRow}>
                    <Feather name="file-text" size={13} color={colors.mutedForeground} />
                    <Text style={[DM.detailText, { color: colors.mutedForeground }]}>{contact.notes}</Text>
                  </View>
                ) : null}
                {contact.dataAbordagem ? (
                  <View style={DM.detailRow}>
                    <Feather name="calendar" size={13} color={colors.mutedForeground} />
                    <Text style={[DM.detailText, { color: colors.mutedForeground }]}>Cadastrado {formatDate(contact.dataAbordagem)}</Text>
                  </View>
                ) : null}
              </View>
            )}

            {/* Próximas ações */}
            <Text style={[DM.sectionTitle, { color: colors.mutedForeground }]}>PRÓXIMAS AÇÕES</Text>
            <View style={[DM.actionsCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              {(nextActions[contact.status] ?? nextActions.novo).map((action, i) => (
                <View key={i} style={[DM.actionRow, { borderTopColor: colors.border, borderTopWidth: i > 0 ? StyleSheet.hairlineWidth : 0 }]}>
                  <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: i === 0 ? PINK + "22" : "rgba(255,255,255,0.06)", alignItems: "center", justifyContent: "center" }}>
                    <View style={{ width: 7, height: 7, borderRadius: 3.5, backgroundColor: i === 0 ? PINK : "rgba(255,255,255,0.2)" }} />
                  </View>
                  <Text style={[DM.actionRowText, { color: i === 0 ? colors.text : colors.mutedForeground }]}>{action}</Text>
                </View>
              ))}
            </View>

            <View style={{ height: 16 }} />
          </ScrollView>

          {/* Actions */}
          <View style={[DM.actions, { borderTopColor: colors.border }]}>
            {contact.phone ? (
              <TouchableOpacity
                style={[DM.actionBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
                activeOpacity={0.8}
                onPress={callPhone}
              >
                <Feather name="phone" size={16} color={colors.text} />
                <Text style={[DM.actionText, { color: colors.text }]}>Ligar</Text>
              </TouchableOpacity>
            ) : null}
            <TouchableOpacity
              style={[DM.actionBtnPrimary, { backgroundColor: PINK }]}
              activeOpacity={0.85}
              onPress={openWhatsApp}
            >
              <Feather name="message-circle" size={16} color="#fff" />
              <Text style={DM.actionTextPrimary}>WhatsApp</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const DM = StyleSheet.create({
  sheet:           { borderTopLeftRadius: 26, borderTopRightRadius: 26, maxHeight: "88%", paddingTop: 12 },
  handle:          { width: 40, height: 4, borderRadius: 2, alignSelf: "center", marginBottom: 16 },
  header:          { flexDirection: "row", alignItems: "flex-start", gap: 12, paddingHorizontal: 20, paddingBottom: 16 },
  avatar:          { width: 48, height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center" },
  avatarText:      { fontSize: 18, fontFamily: "SpaceGrotesk_700Bold", color: PINK },
  name:            { fontSize: 17, fontFamily: "SpaceGrotesk_700Bold" },
  company:         { fontSize: 13, fontFamily: "SpaceGrotesk_400Regular" },
  statusPill:      { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  statusText:      { fontSize: 11, fontFamily: "SpaceGrotesk_600SemiBold" },
  pills:           { flexDirection: "row", flexWrap: "wrap", gap: 8, paddingHorizontal: 20, paddingBottom: 16 },
  pill:            { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, borderWidth: 1 },
  pillText:        { fontSize: 12, fontFamily: "SpaceGrotesk_500Medium" },
  statsRow:        { flexDirection: "row", gap: 8, paddingHorizontal: 20, marginBottom: 16 },
  statCard:        { flex: 1, borderRadius: 12, borderWidth: 1, paddingVertical: 10, alignItems: "center" },
  statVal:         { fontSize: 14, fontFamily: "SpaceGrotesk_700Bold" },
  statLbl:         { fontSize: 10, fontFamily: "SpaceGrotesk_400Regular", marginTop: 2 },
  detailsCard:     { marginHorizontal: 20, borderRadius: 12, borderWidth: 1, padding: 12, gap: 10, marginBottom: 16 },
  detailRow:       { flexDirection: "row", alignItems: "flex-start", gap: 8 },
  detailText:      { flex: 1, fontSize: 13, fontFamily: "SpaceGrotesk_400Regular" },
  sectionTitle:    { fontSize: 10, fontFamily: "SpaceGrotesk_700Bold", letterSpacing: 1.2, paddingHorizontal: 20, marginBottom: 10 },
  actionsCard:     { marginHorizontal: 20, borderRadius: 14, borderWidth: 1, overflow: "hidden", marginBottom: 4 },
  actionRow:       { flexDirection: "row", alignItems: "flex-start", gap: 10, padding: 12 },
  actionRowText:   { flex: 1, fontSize: 13, fontFamily: "SpaceGrotesk_400Regular" },
  actions:         { flexDirection: "row", gap: 10, padding: 16, paddingBottom: 28, borderTopWidth: StyleSheet.hairlineWidth },
  actionBtn:       { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7, height: 48, borderRadius: 12, borderWidth: 1, paddingHorizontal: 20 },
  actionText:      { fontSize: 14, fontFamily: "SpaceGrotesk_600SemiBold" },
  actionBtnPrimary:{ flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7, height: 48, borderRadius: 12 },
  actionTextPrimary: { fontSize: 14, fontFamily: "SpaceGrotesk_700Bold", color: "#fff" },
});

function ContactCard({ contact, onPress }: { contact: Contact; onPress: () => void }) {
  const colors = useColors();
  const cfg = STATUS_CONFIG[contact.status];
  return (
    <TouchableOpacity style={[CC.card, { backgroundColor: colors.surface, borderColor: colors.border }]} onPress={onPress} activeOpacity={0.75}>
      <View style={CC.row}>
        <View style={[CC.avatar, { backgroundColor: PINK + "22" }]}>
          <Text style={CC.avatarText}>{contact.name[0]?.toUpperCase() ?? "?"}</Text>
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={[CC.name, { color: colors.text }]} numberOfLines={1}>{contact.name}</Text>
          {contact.company !== contact.name && (
            <Text style={[CC.company, { color: colors.mutedForeground }]} numberOfLines={1}>{contact.company}</Text>
          )}
          <View style={CC.tagsRow}>
            {resolveSegLabel(contact.segment) !== "" && (
              <View style={[CC.segTag, { backgroundColor: PURPLE + "18" }]}>
                <Text style={[CC.segText, { color: PURPLE }]}>{resolveSegLabel(contact.segment)}</Text>
              </View>
            )}
            <View style={[CC.statusTag, { backgroundColor: cfg.color + "18" }]}>
              <Text style={[CC.statusText, { color: cfg.color }]}>{cfg.label}</Text>
            </View>
          </View>
        </View>
        <View style={{ alignItems: "flex-end", gap: 6 }}>
          <ScoreBadge score={contact.score} />
          <Text style={[CC.time, { color: colors.mutedForeground }]}>{contact.lastContact}</Text>
          <Feather name="chevron-right" size={14} color={colors.mutedForeground} />
        </View>
      </View>
    </TouchableOpacity>
  );
}
const CC = StyleSheet.create({
  card:       { marginHorizontal: 16, marginBottom: 8, borderRadius: 16, borderWidth: 1, padding: 14 },
  row:        { flexDirection: "row", alignItems: "center", gap: 12 },
  avatar:     { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  avatarText: { fontSize: 18, fontFamily: "SpaceGrotesk_700Bold", color: PINK },
  name:       { fontSize: 15, fontFamily: "SpaceGrotesk_600SemiBold" },
  company:    { fontSize: 12, fontFamily: "SpaceGrotesk_400Regular" },
  tagsRow:    { flexDirection: "row", gap: 6, marginTop: 2 },
  segTag:     { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  segText:    { fontSize: 10, fontFamily: "SpaceGrotesk_600SemiBold" },
  statusTag:  { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  statusText: { fontSize: 10, fontFamily: "SpaceGrotesk_600SemiBold" },
  time:       { fontSize: 10, fontFamily: "SpaceGrotesk_400Regular" },
});

export default function CRMScreen() {
  const colors  = useColors();
  const insets  = useSafeAreaInsets();
  const router  = useRouter();
  const [search, setSearch]   = useState("");
  const [filter, setFilter]   = useState<ContactStatus | "todos">("todos");
  const [showSearch, setShowSearch] = useState(false);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [detailVisible, setDetailVisible]     = useState(false);
  const [novoOpen, setNovoOpen] = useState(false);
  const [novoForm, setNovoForm] = useState({ nome: "", empresa: "", telefone: "", segmento: "" });

  const topPad    = Platform.OS === "web" ? 24 : insets.top + 4;
  const bottomPad = Platform.OS === "web" ? 84 : insets.bottom + 60;

  useEffect(() => {
    AsyncStorage.getItem("crm_leads").then((raw) => {
      if (!raw) return;
      try {
        const leads = JSON.parse(raw) as CrmLeadLocal[];
        setContacts(leads.map(leadToContact));
      } catch {}
    });
  }, []);

  const salvarNovoContato = async () => {
    if (!novoForm.nome.trim()) return;
    const lead: CrmLeadLocal = {
      id: Date.now().toString(),
      nome: novoForm.nome.trim(),
      empresa: novoForm.empresa.trim() || novoForm.nome.trim(),
      telefone: novoForm.telefone.trim(),
      endereco: "", segmento: novoForm.segmento.trim(),
      status: "Primeiro Contato", pipeline: "Novo",
      dataAbordagem: new Date().toISOString(), cidade: "",
    };
    try {
      const raw = await AsyncStorage.getItem("crm_leads");
      const existing: CrmLeadLocal[] = raw ? JSON.parse(raw) : [];
      await AsyncStorage.setItem("crm_leads", JSON.stringify([lead, ...existing].slice(0, 500)));
    } catch {}
    setContacts((p) => [leadToContact(lead), ...p]);
    setNovoForm({ nome: "", empresa: "", telefone: "", segmento: "" });
    setNovoOpen(false);
  };

  const filtered = contacts.filter((c) => {
    const matchFilter = filter === "todos" || c.status === filter;
    const matchSearch = !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.company.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  return (
    <View style={[S.root, { backgroundColor: colors.background }]}>
      <View style={[S.header, { paddingTop: topPad }]}>
        <TouchableOpacity onPress={() => router.back()} style={S.backBtn} activeOpacity={0.7}>
          <Feather name="chevron-left" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={[S.title, { color: colors.text }]}>CRM</Text>
        <View style={S.headerRight}>
          <TouchableOpacity onPress={() => setShowSearch(!showSearch)} style={S.iconBtn} activeOpacity={0.7}>
            <Feather name="search" size={20} color={showSearch ? PINK : colors.mutedForeground} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[S.addBtn, { backgroundColor: PINK }]}
            activeOpacity={0.85}
            onPress={() => setNovoOpen(true)}
          >
            <Feather name="plus" size={18} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {showSearch && (
        <View style={[S.searchWrap, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Feather name="search" size={16} color={colors.mutedForeground} />
          <TextInput
            style={[S.searchInput, { color: colors.text }]}
            placeholder="Buscar contato ou empresa..."
            placeholderTextColor={colors.mutedForeground}
            value={search}
            onChangeText={setSearch}
            autoFocus
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch("")}>
              <Feather name="x" size={16} color={colors.mutedForeground} />
            </TouchableOpacity>
          )}
        </View>
      )}

      <View style={{ paddingHorizontal: 16, marginBottom: 12, gap: 8 }}>
        <View style={{ flexDirection: "row", gap: 8 }}>
          {[
            { label: "Total",      value: contacts.length,                                           color: colors.text },
            { label: "Novos",      value: contacts.filter(c => c.status === "novo").length,          color: "#5577FF" },
            { label: "Em Contato", value: contacts.filter(c => c.status === "em_contato").length,   color: PURPLE },
          ].map((s) => (
            <View key={s.label} style={[S.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[S.statValue, { color: s.color }]}>{s.value}</Text>
              <Text style={[S.statLabel, { color: colors.mutedForeground }]}>{s.label}</Text>
            </View>
          ))}
        </View>
        <View style={{ flexDirection: "row", gap: 8 }}>
          {[
            { label: "Quentes",    value: contacts.filter(c => c.status === "quente").length,      color: "#FF8800" },
            { label: "Negociação", value: contacts.filter(c => c.status === "negociacao").length,  color: PINK },
            { label: "Fechados",   value: contacts.filter(c => c.status === "fechado").length,     color: "#22CC88" },
          ].map((s) => (
            <View key={s.label} style={[S.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[S.statValue, { color: s.color }]}>{s.value}</Text>
              <Text style={[S.statLabel, { color: colors.mutedForeground }]}>{s.label}</Text>
            </View>
          ))}
        </View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={S.filterScroll}>
        {FILTER_OPTIONS.map((f) => {
          const active = filter === f.key;
          return (
            <TouchableOpacity
              key={f.key}
              style={[S.filterTab, active && { backgroundColor: PINK + "22", borderColor: PINK + "55" }]}
              onPress={() => setFilter(f.key as ContactStatus | "todos")}
              activeOpacity={0.75}
            >
              <Text style={[S.filterText, { color: active ? PINK : colors.mutedForeground }]}>{f.label}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        initialNumToRender={12}
        maxToRenderPerBatch={8}
        windowSize={10}
        contentContainerStyle={{ paddingTop: 8, paddingBottom: bottomPad }}
        renderItem={({ item }) => (
          <ContactCard contact={item} onPress={() => { setSelectedContact(item); setDetailVisible(true); }} />
        )}
        ListEmptyComponent={
          <View style={S.empty}>
            <Feather name="users" size={40} color={colors.mutedForeground} />
            <Text style={[S.emptyText, { color: colors.mutedForeground }]}>
              {contacts.length === 0 ? "Nenhum lead no CRM ainda. Peça para a JADE buscar leads." : "Nenhum contato encontrado"}
            </Text>
          </View>
        }
      />
      <ContactDetailModal
        contact={selectedContact}
        visible={detailVisible}
        onClose={() => setDetailVisible(false)}
      />

      <Modal visible={novoOpen} transparent animationType="slide" onRequestClose={() => setNovoOpen(false)}>
        <TouchableOpacity style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.65)", justifyContent: "flex-end" }} activeOpacity={1} onPress={() => setNovoOpen(false)}>
          <TouchableOpacity activeOpacity={1} style={{ backgroundColor: colors.background, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, gap: 14 }}>
            <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border, alignSelf: "center", marginBottom: 6 }} />
            <Text style={{ fontSize: 18, fontFamily: "SpaceGrotesk_700Bold", color: colors.text }}>Novo Contato</Text>
            {[
              { key: "nome",      label: "Nome *",      placeholder: "João Silva",            keyboard: "default" as const },
              { key: "empresa",   label: "Empresa",     placeholder: "Empresa Ltda",          keyboard: "default" as const },
              { key: "telefone",  label: "Telefone",    placeholder: "(48) 99999-9999",       keyboard: "phone-pad" as const },
              { key: "segmento",  label: "Segmento",    placeholder: "Saúde, Varejo, SaaS…", keyboard: "default" as const },
            ].map((f) => (
              <View key={f.key} style={{ gap: 5 }}>
                <Text style={{ fontSize: 11, fontFamily: "SpaceGrotesk_600SemiBold", color: colors.mutedForeground, letterSpacing: 0.7 }}>{f.label.toUpperCase()}</Text>
                <View style={{ backgroundColor: colors.surface, borderRadius: 12, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 14, height: 46, justifyContent: "center" }}>
                  <TextInput
                    style={{ fontSize: 14, fontFamily: "SpaceGrotesk_400Regular", color: colors.text }}
                    placeholder={f.placeholder}
                    placeholderTextColor={colors.mutedForeground}
                    value={novoForm[f.key as keyof typeof novoForm]}
                    onChangeText={(v) => setNovoForm((p) => ({ ...p, [f.key]: v }))}
                    keyboardType={f.keyboard}
                    autoCapitalize={f.keyboard === "default" ? "words" : "none"}
                  />
                </View>
              </View>
            ))}
            <TouchableOpacity
              style={{ backgroundColor: PINK, height: 50, borderRadius: 14, alignItems: "center", justifyContent: "center", opacity: novoForm.nome.trim() ? 1 : 0.4 }}
              onPress={salvarNovoContato}
              disabled={!novoForm.nome.trim()}
              activeOpacity={0.85}
            >
              <Text style={{ fontSize: 15, fontFamily: "SpaceGrotesk_700Bold", color: "#fff" }}>Adicionar Contato</Text>
            </TouchableOpacity>
            <View style={{ height: 20 }} />
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const S = StyleSheet.create({
  root:        { flex: 1 },
  header:      { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingBottom: 12, gap: 12 },
  backBtn:     { padding: 4 },
  title:       { fontSize: 22, fontFamily: "SpaceGrotesk_700Bold", flex: 1 },
  headerRight: { flexDirection: "row", alignItems: "center", gap: 10 },
  iconBtn:     { padding: 6 },
  addBtn:      { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  searchWrap:  { flexDirection: "row", alignItems: "center", marginHorizontal: 16, marginBottom: 8, borderRadius: 12, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 10, gap: 8 },
  searchInput: { flex: 1, fontSize: 14, fontFamily: "SpaceGrotesk_400Regular" },
  statsRow:    { flexDirection: "row", gap: 10, paddingHorizontal: 16, marginBottom: 12 },
  statCard:    { flex: 1, borderRadius: 12, borderWidth: 1, paddingVertical: 10, alignItems: "center" },
  statValue:   { fontSize: 20, fontFamily: "SpaceGrotesk_700Bold" },
  statLabel:   { fontSize: 11, fontFamily: "SpaceGrotesk_400Regular" },
  filterScroll:{ paddingHorizontal: 16, paddingBottom: 12, gap: 8 },
  filterTab:   { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: "transparent" },
  filterText:  { fontSize: 13, fontFamily: "SpaceGrotesk_500Medium" },
  empty:       { alignItems: "center", gap: 12, paddingTop: 60 },
  emptyText:   { fontSize: 14, fontFamily: "SpaceGrotesk_400Regular", textAlign: "center", paddingHorizontal: 32 },
});
