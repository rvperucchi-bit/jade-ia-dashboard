import React, { useRef, useState } from "react";
import {
  Animated,
  Easing,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";

import { useColors } from "@/hooks/useColors";
import { useApp, Lead, LeadColumn } from "@/context/AppContext";

const COLUMNS: { key: LeadColumn; label: string; color: string }[] = [
  { key: "novo",       label: "Novo",        color: "#6C63FF" },
  { key: "qualificado",label: "Qualificado", color: "#FFB300" },
  { key: "proposta",   label: "Proposta",    color: "#FF0080" },
  { key: "fechado",    label: "Fechado",     color: "#00D68F" },
];

function formatValue(v: number) {
  return `R$ ${v.toLocaleString("pt-BR")}`;
}

// ─── Mock CRM history per lead ────────────────────────────────────────────────
type ContactEntry = {
  date: string;
  time: string;
  channel: "whatsapp" | "email" | "phone" | "jade";
  agent: string;
  note: string;
};

const CRM_HISTORY: Record<string, ContactEntry[]> = {
  default: [
    { date: "Hoje",       time: "09:14", channel: "jade",    agent: "JADE IA",       note: "Primeiro contato automático. Lead respondeu com interesse." },
    { date: "Ontem",      time: "16:40", channel: "whatsapp",agent: "Você",          note: "Enviou proposta comercial. Aguardando retorno." },
    { date: "15 Jun",     time: "11:05", channel: "phone",   agent: "Você",          note: "Ligação de 8 min. Apresentou o produto e tirou dúvidas." },
    { date: "12 Jun",     time: "08:30", channel: "email",   agent: "JADE IA",       note: "E-mail de boas-vindas enviado automaticamente." },
  ],
};

const JADE_SUMMARIES: string[] = [
  "Lead demonstrou alto interesse no produto. Mencionou orçamento disponível e urgência para Q3. Probabilidade de fechamento estimada em 78%. Recomendo follow-up com proposta personalizada.",
  "Lead em fase de avaliação com concorrentes. Destacou preço como fator decisivo. Probabilidade 55%. Sugiro oferta de demonstração gratuita para acelerar decisão.",
  "Contato muito engajado, respondeu rapidamente em todas interações. Solicitou referências de clientes. Probabilidade 82%. Envie cases do mesmo segmento.",
  "Lead frio, demorou a responder. Última interação há 4 dias. Probabilidade 30%. Recomendo reengajamento com conteúdo relevante ao setor.",
];

function channelIcon(ch: ContactEntry["channel"], color: string) {
  switch (ch) {
    case "whatsapp": return <Feather name="message-circle" size={14} color={color} />;
    case "email":    return <Feather name="mail" size={14} color={color} />;
    case "phone":    return <Feather name="phone" size={14} color={color} />;
    case "jade":     return <MaterialCommunityIcons name="robot" size={14} color={color} />;
  }
}
function channelColor(ch: ContactEntry["channel"]) {
  switch (ch) {
    case "whatsapp": return "#25D366";
    case "email":    return "#6C63FF";
    case "phone":    return "#FFB300";
    case "jade":     return "#FF0080";
  }
}
function channelLabel(ch: ContactEntry["channel"]) {
  switch (ch) {
    case "whatsapp": return "WhatsApp";
    case "email":    return "E-mail";
    case "phone":    return "Ligação";
    case "jade":     return "JADE IA";
  }
}

// ─── Lead card ────────────────────────────────────────────────────────────────
function LeadCard({ lead, onPress }: { lead: Lead; onPress: () => void }) {
  const colors = useColors();
  return (
    <TouchableOpacity
      style={[L.card, { backgroundColor: colors.card, borderColor: colors.border }]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={L.cardHeader}>
        <View style={[L.avatar, { backgroundColor: lead.avatarColor }]}>
          <Text style={L.avatarText}>{lead.initials}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[L.cardName, { color: colors.text }]} numberOfLines={1}>{lead.name}</Text>
          <Text style={[L.cardCompany, { color: colors.mutedForeground }]} numberOfLines={1}>{lead.company}</Text>
        </View>
      </View>
      <View style={L.cardFooter}>
        <Text style={[L.cardValue, { color: colors.primary }]}>{formatValue(lead.value)}</Text>
        <View style={[L.tag, { backgroundColor: lead.tagColor + "22" }]}>
          <Text style={[L.tagText, { color: lead.tagColor }]}>{lead.tag}</Text>
        </View>
      </View>
      <Text style={[L.cardTime, { color: colors.mutedForeground }]}>{lead.time}</Text>
    </TouchableOpacity>
  );
}

// ─── Move Modal ───────────────────────────────────────────────────────────────
function MoveModal({
  lead, visible, onClose, onMove,
}: { lead: Lead | null; visible: boolean; onClose: () => void; onMove: (col: LeadColumn) => void }) {
  const colors = useColors();
  if (!lead) return null;
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={L.overlay} activeOpacity={1} onPress={onClose}>
        <View style={[L.moveModal, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[L.moveTitle, { color: colors.text }]}>Mover Lead</Text>
          <Text style={[L.moveSub, { color: colors.mutedForeground }]}>{lead.name}</Text>
          <View style={[L.divider, { backgroundColor: colors.border }]} />
          {COLUMNS.map((col) => (
            <TouchableOpacity
              key={col.key}
              style={[L.moveOption, lead.column === col.key && { backgroundColor: col.color + "22" }]}
              onPress={() => onMove(col.key)}
            >
              <View style={[L.colDot, { backgroundColor: col.color }]} />
              <Text style={[L.moveOptionText, { color: lead.column === col.key ? col.color : colors.text }]}>
                {col.label}
              </Text>
              {lead.column === col.key && <Feather name="check" size={16} color={col.color} />}
            </TouchableOpacity>
          ))}
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

// ─── CRM Lead Detail Modal ────────────────────────────────────────────────────
function LeadDetailModal({
  lead, visible, onClose, onMoveRequest,
}: {
  lead: Lead | null;
  visible: boolean;
  onClose: () => void;
  onMoveRequest: () => void;
}) {
  const colors = useColors();
  const router = useRouter();
  const slideY = useRef(new Animated.Value(80)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(slideY,  { toValue: 0,  duration: 360, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1,  duration: 280, useNativeDriver: true }),
      ]).start();
    } else {
      slideY.setValue(80);
      opacity.setValue(0);
    }
  }, [visible]);

  if (!lead) return null;

  const history = CRM_HISTORY[lead.id] ?? CRM_HISTORY.default;
  const summaryIndex = parseInt(lead.id, 10) % JADE_SUMMARIES.length;
  const summary = JADE_SUMMARIES[Math.abs(summaryIndex)] ?? JADE_SUMMARIES[0];
  const stageCol = COLUMNS.find((c) => c.key === lead.column);
  const totalContacts = history.length;
  const daysSinceFirst = 8;

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <View style={L.detailBg}>
        {/* Tap outside to close */}
        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onClose} />

        <Animated.View
          style={[
            L.detailSheet,
            { backgroundColor: colors.background, opacity, transform: [{ translateY: slideY }] },
          ]}
        >
          {/* ── Handle bar ── */}
          <View style={[L.handle, { backgroundColor: colors.border }]} />

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>
            {/* ── Lead header ── */}
            <View style={L.detailHeader}>
              <View style={[L.detailAvatar, { backgroundColor: lead.avatarColor }]}>
                <Text style={L.detailAvatarText}>{lead.initials}</Text>
              </View>
              <View style={{ flex: 1, gap: 3 }}>
                <Text style={[L.detailName, { color: colors.text }]}>{lead.name}</Text>
                <Text style={[L.detailCompany, { color: colors.mutedForeground }]}>{lead.company}</Text>
                <View style={L.detailMeta}>
                  <View style={[L.stagePill, { backgroundColor: (stageCol?.color ?? "#888") + "22" }]}>
                    <View style={[L.stageDot, { backgroundColor: stageCol?.color }]} />
                    <Text style={[L.stagePillText, { color: stageCol?.color }]}>{stageCol?.label}</Text>
                  </View>
                  <Text style={[L.detailValue, { color: colors.primary }]}>{formatValue(lead.value)}</Text>
                </View>
              </View>
              <TouchableOpacity onPress={onClose} hitSlop={{ top: 12, right: 12, bottom: 12, left: 12 }}>
                <Feather name="x" size={22} color={colors.mutedForeground} />
              </TouchableOpacity>
            </View>

            {/* ── CRM stats row ── */}
            <View style={L.statsRow}>
              {[
                { label: "Contatos",  value: `${totalContacts}` },
                { label: "Dias CRM",  value: `${daysSinceFirst}` },
                { label: "Resp. IA",  value: "3" },
                { label: "Score",     value: "82%" },
              ].map((s, i) => (
                <View key={i} style={[L.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <Text style={[L.statValue, { color: colors.text }]}>{s.value}</Text>
                  <Text style={[L.statLabel, { color: colors.mutedForeground }]}>{s.label}</Text>
                </View>
              ))}
            </View>

            {/* ── JADE AI Summary ── */}
            <View style={[L.aiCard, { backgroundColor: colors.card, borderColor: colors.primary + "40" }]}>
              <View style={L.aiCardHeader}>
                <View style={[L.aiIconWrap, { backgroundColor: colors.primary + "20" }]}>
                  <MaterialCommunityIcons name="robot" size={16} color={colors.primary} />
                </View>
                <Text style={[L.aiTitle, { color: colors.primary }]}>Análise JADE IA</Text>
                <View style={[L.aiBadge, { backgroundColor: "#00D68F22" }]}>
                  <Text style={{ fontSize: 10, fontFamily: "SpaceGrotesk_600SemiBold", color: "#00D68F" }}>
                    Gemini 2.5
                  </Text>
                </View>
              </View>
              <Text style={[L.aiText, { color: colors.mutedForeground }]}>{summary}</Text>
            </View>

            {/* ── Contact history timeline ── */}
            <Text style={[L.sectionTitle, { color: colors.text }]}>Histórico de Contatos</Text>

            <View style={[L.timelineCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              {history.map((entry, i) => {
                const cc = channelColor(entry.channel);
                return (
                  <View key={i}>
                    <View style={L.timelineItem}>
                      {/* Left line + icon */}
                      <View style={L.timelineLeft}>
                        <View style={[L.timelineIconWrap, { backgroundColor: cc + "22" }]}>
                          {channelIcon(entry.channel, cc)}
                        </View>
                        {i < history.length - 1 && (
                          <View style={[L.timelineLine, { backgroundColor: colors.border }]} />
                        )}
                      </View>
                      {/* Right content */}
                      <View style={{ flex: 1, paddingBottom: 20 }}>
                        <View style={L.timelineTopRow}>
                          <Text style={[L.timelineChannel, { color: cc }]}>{channelLabel(entry.channel)}</Text>
                          <Text style={[L.timelineDate, { color: colors.mutedForeground }]}>
                            {entry.date} · {entry.time}
                          </Text>
                        </View>
                        <Text style={[L.timelineAgent, { color: colors.text }]}>{entry.agent}</Text>
                        <Text style={[L.timelineNote, { color: colors.mutedForeground }]}>{entry.note}</Text>
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          </ScrollView>

          {/* ── Action buttons ── */}
          <View style={[L.detailActions, { borderTopColor: colors.border }]}>
            <TouchableOpacity
              style={[L.actionBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={onMoveRequest}
              activeOpacity={0.8}
            >
              <Feather name="move" size={16} color={colors.text} />
              <Text style={[L.actionBtnText, { color: colors.text }]}>Mover</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[L.actionBtnPrimary, { backgroundColor: colors.primary }]}
              onPress={() => { onClose(); router.push("/conversas" as any); }}
              activeOpacity={0.85}
            >
              <MaterialCommunityIcons name="robot" size={16} color="#fff" />
              <Text style={L.actionBtnPrimaryText}>Conversar com JADE</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function LeadsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { leads, moveLead } = useApp();

  const [selectedLead, setSelectedLead]   = useState<Lead | null>(null);
  const [detailVisible, setDetailVisible] = useState(false);
  const [moveVisible,   setMoveVisible]   = useState(false);

  const topPad    = Platform.OS === "web" ? 67  : insets.top;
  const bottomPad = Platform.OS === "web" ? 84  : insets.bottom + 60;

  const openDetail = (lead: Lead) => {
    setSelectedLead(lead);
    setDetailVisible(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleMove = (col: LeadColumn) => {
    if (selectedLead) {
      moveLead(selectedLead.id, col);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    setMoveVisible(false);
  };

  return (
    <View style={[L.container, { backgroundColor: colors.background }]}>
      <View style={[L.header, { paddingTop: topPad + 16 }]}>
        <View>
          <Text style={[L.headerTitle, { color: colors.text }]}>Leads</Text>
          <Text style={[L.headerSub, { color: colors.mutedForeground }]}>
            {leads.length} leads no pipeline
          </Text>
        </View>
        <TouchableOpacity style={[L.addBtn, { backgroundColor: colors.primary }]} activeOpacity={0.8}>
          <Feather name="plus" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[L.kanban, { paddingBottom: bottomPad }]}
      >
        {COLUMNS.map((col) => {
          const colLeads = leads.filter((l) => l.column === col.key);
          return (
            <View key={col.key} style={[L.column, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={L.colHeader}>
                <View style={[L.colDot, { backgroundColor: col.color }]} />
                <Text style={[L.colTitle, { color: colors.text }]}>{col.label}</Text>
                <View style={[L.colBadge, { backgroundColor: col.color + "33" }]}>
                  <Text style={[L.colBadgeText, { color: col.color }]}>{colLeads.length}</Text>
                </View>
              </View>
              <ScrollView showsVerticalScrollIndicator={false} nestedScrollEnabled>
                {colLeads.map((lead) => (
                  <LeadCard key={lead.id} lead={lead} onPress={() => openDetail(lead)} />
                ))}
                {colLeads.length === 0 && (
                  <View style={L.emptyCol}>
                    <MaterialCommunityIcons name="inbox-outline" size={28} color={colors.mutedForeground} />
                    <Text style={[L.emptyColText, { color: colors.mutedForeground }]}>Vazio</Text>
                  </View>
                )}
              </ScrollView>
            </View>
          );
        })}
      </ScrollView>

      <LeadDetailModal
        lead={selectedLead}
        visible={detailVisible}
        onClose={() => setDetailVisible(false)}
        onMoveRequest={() => { setDetailVisible(false); setTimeout(() => setMoveVisible(true), 120); }}
      />

      <MoveModal
        lead={selectedLead}
        visible={moveVisible}
        onClose={() => setMoveVisible(false)}
        onMove={handleMove}
      />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const L = StyleSheet.create({
  container: { flex: 1 },

  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 20, paddingBottom: 16,
  },
  headerTitle: { fontSize: 26, fontFamily: "SpaceGrotesk_700Bold" },
  headerSub:   { fontSize: 13, fontFamily: "SpaceGrotesk_400Regular", marginTop: 2 },
  addBtn: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },

  kanban: { paddingHorizontal: 16, gap: 12, paddingTop: 4 },
  column: { width: 240, borderRadius: 16, borderWidth: 1, padding: 12, maxHeight: 520 },
  colHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 },
  colDot:    { width: 8, height: 8, borderRadius: 4 },
  colTitle:  { flex: 1, fontSize: 14, fontFamily: "SpaceGrotesk_600SemiBold" },
  colBadge:  { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  colBadgeText: { fontSize: 12, fontFamily: "SpaceGrotesk_600SemiBold" },

  card: { borderRadius: 12, borderWidth: 1, padding: 12, marginBottom: 8 },
  cardHeader: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 10 },
  avatar:     { width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center" },
  avatarText: { color: "#fff", fontSize: 13, fontFamily: "SpaceGrotesk_700Bold" },
  cardName:    { fontSize: 13, fontFamily: "SpaceGrotesk_600SemiBold" },
  cardCompany: { fontSize: 12, fontFamily: "SpaceGrotesk_400Regular", marginTop: 1 },
  cardFooter:  { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  cardValue:   { fontSize: 14, fontFamily: "SpaceGrotesk_700Bold" },
  tag:         { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  tagText:     { fontSize: 10, fontFamily: "SpaceGrotesk_600SemiBold" },
  cardTime:    { fontSize: 11, fontFamily: "SpaceGrotesk_400Regular", marginTop: 8 },
  emptyCol:    { alignItems: "center", paddingVertical: 30, gap: 8 },
  emptyColText:{ fontSize: 13, fontFamily: "SpaceGrotesk_400Regular" },

  // Move modal
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.75)", alignItems: "center", justifyContent: "center", padding: 24 },
  moveModal: { width: "100%", maxWidth: 360, borderRadius: 20, borderWidth: 1, padding: 20 },
  moveTitle: { fontSize: 17, fontFamily: "SpaceGrotesk_700Bold", marginBottom: 4 },
  moveSub:   { fontSize: 13, fontFamily: "SpaceGrotesk_400Regular" },
  divider:   { height: 1, marginVertical: 16 },
  moveOption: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12, paddingHorizontal: 12, borderRadius: 10, marginBottom: 4 },
  moveOptionText: { flex: 1, fontSize: 15, fontFamily: "SpaceGrotesk_500Medium" },

  // CRM detail modal
  detailBg: { flex: 1, backgroundColor: "rgba(0,0,0,0.72)", justifyContent: "flex-end" },
  detailSheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: "92%",
    paddingTop: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 20,
  },
  handle: { width: 40, height: 4, borderRadius: 2, alignSelf: "center", marginBottom: 16 },

  detailHeader: { flexDirection: "row", alignItems: "flex-start", gap: 14, paddingHorizontal: 20, paddingBottom: 18 },
  detailAvatar: { width: 52, height: 52, borderRadius: 26, alignItems: "center", justifyContent: "center" },
  detailAvatarText: { color: "#fff", fontSize: 18, fontFamily: "SpaceGrotesk_700Bold" },
  detailName:    { fontSize: 18, fontFamily: "SpaceGrotesk_700Bold" },
  detailCompany: { fontSize: 13, fontFamily: "SpaceGrotesk_400Regular" },
  detailMeta:    { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 4 },
  detailValue:   { fontSize: 15, fontFamily: "SpaceGrotesk_700Bold" },
  stagePill:  { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  stageDot:   { width: 6, height: 6, borderRadius: 3 },
  stagePillText: { fontSize: 11, fontFamily: "SpaceGrotesk_600SemiBold" },

  statsRow: { flexDirection: "row", gap: 8, paddingHorizontal: 20, marginBottom: 16 },
  statCard:  { flex: 1, borderRadius: 12, borderWidth: 1, paddingVertical: 10, alignItems: "center" },
  statValue: { fontSize: 18, fontFamily: "SpaceGrotesk_700Bold" },
  statLabel: { fontSize: 10, fontFamily: "SpaceGrotesk_400Regular", marginTop: 2 },

  aiCard: { marginHorizontal: 20, marginBottom: 20, borderRadius: 14, borderWidth: 1, padding: 14 },
  aiCardHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10 },
  aiIconWrap: { width: 28, height: 28, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  aiTitle:   { flex: 1, fontSize: 13, fontFamily: "SpaceGrotesk_700Bold" },
  aiBadge:   { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  aiText:    { fontSize: 13, fontFamily: "SpaceGrotesk_400Regular", lineHeight: 20 },

  sectionTitle: { fontSize: 15, fontFamily: "SpaceGrotesk_700Bold", paddingHorizontal: 20, marginBottom: 12 },

  timelineCard: { marginHorizontal: 20, borderRadius: 14, borderWidth: 1, paddingTop: 16, paddingRight: 14, overflow: "hidden" },
  timelineItem: { flexDirection: "row", gap: 12, paddingLeft: 14 },
  timelineLeft: { alignItems: "center", width: 32 },
  timelineIconWrap: { width: 32, height: 32, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  timelineLine: { width: 1, flex: 1, marginTop: 4 },
  timelineTopRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 2 },
  timelineChannel: { fontSize: 12, fontFamily: "SpaceGrotesk_700Bold" },
  timelineDate:    { fontSize: 11, fontFamily: "SpaceGrotesk_400Regular" },
  timelineAgent:   { fontSize: 13, fontFamily: "SpaceGrotesk_600SemiBold", marginBottom: 3 },
  timelineNote:    { fontSize: 12, fontFamily: "SpaceGrotesk_400Regular", lineHeight: 18 },

  detailActions: {
    flexDirection: "row", gap: 10, padding: 16, paddingBottom: 24,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  actionBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 7, height: 48, borderRadius: 12, borderWidth: 1, paddingHorizontal: 16,
  },
  actionBtnText:      { fontSize: 14, fontFamily: "SpaceGrotesk_600SemiBold" },
  actionBtnPrimary:   { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7, height: 48, borderRadius: 12 },
  actionBtnPrimaryText: { fontSize: 14, fontFamily: "SpaceGrotesk_700Bold", color: "#fff" },
});
