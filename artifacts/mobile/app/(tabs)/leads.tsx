import React, { memo, useCallback, useMemo, useRef, useState } from "react";
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
import { useApp, type Lead, type LeadColumn, type LeadActivity } from "@/context/AppContext";
import { getLeadScoreInfo, calcLeadScore } from "@/utils/leadScore";

// ─── CRM columns ──────────────────────────────────────────────────────────────
const COLUMNS: { key: LeadColumn; label: string }[] = [
  { key: "novo",        label: "Novo" },
  { key: "qualificado", label: "Qualificado" },
  { key: "proposta",    label: "Proposta" },
  { key: "fechado",     label: "Fechado" },
];

function colLabel(key: LeadColumn) {
  return COLUMNS.find((c) => c.key === key)?.label ?? key;
}

function formatValue(v: number) {
  if (!v) return null;
  return `R$ ${v.toLocaleString("pt-BR")}`;
}

function cleanTag(tag: string): string {
  if (!tag) return "";
  const t = tag.trim();
  if (t.length <= 22) return t;
  const words = t.split(/\s+/);
  let r = "";
  for (const w of words) {
    const next = r ? r + " " + w : w;
    if (next.length <= 20) r = next; else break;
  }
  return r || t.slice(0, 20);
}

// ─── Contact history types ────────────────────────────────────────────────────
type ContactEntry = {
  date: string;
  time: string;
  channel: "whatsapp" | "email" | "phone" | "jade";
  agent: string;
  note: string;
};

const CRM_HISTORY: Record<string, ContactEntry[]> = {
  default: [
    { date: "Hoje",   time: "09:14", channel: "jade",    agent: "JADE IA", note: "Primeiro contato automático. Lead respondeu com interesse." },
    { date: "Ontem",  time: "16:40", channel: "whatsapp",agent: "Você",    note: "Enviou proposta comercial. Aguardando retorno." },
    { date: "15 Jun", time: "11:05", channel: "phone",   agent: "Você",    note: "Ligação de 8 min. Apresentou o produto e tirou dúvidas." },
    { date: "12 Jun", time: "08:30", channel: "email",   agent: "JADE IA", note: "E-mail de boas-vindas enviado automaticamente." },
  ],
};

const JADE_SUMMARIES: string[] = [
  "Lead demonstrou alto interesse. Orçamento disponível e urgência para Q3. Probabilidade estimada em 78%. Recomendo follow-up com proposta personalizada.",
  "Lead avaliando concorrentes. Preço é fator decisivo. Probabilidade 55%. Sugiro demonstração gratuita para acelerar decisão.",
  "Contato engajado, responde rapidamente. Solicitou referências de clientes. Probabilidade 82%. Envie cases do mesmo segmento.",
  "Lead frio, última interação há 4 dias. Probabilidade 30%. Recomendo reengajamento com conteúdo relevante ao setor.",
];

function channelIcon(ch: ContactEntry["channel"], muted: string) {
  switch (ch) {
    case "whatsapp": return <Feather name="message-circle" size={13} color={muted} />;
    case "email":    return <Feather name="mail"           size={13} color={muted} />;
    case "phone":    return <Feather name="phone"          size={13} color={muted} />;
    case "jade":     return <MaterialCommunityIcons name="robot" size={13} color={muted} />;
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

// ─── Minimal lead card ────────────────────────────────────────────────────────
const LeadCard = memo(function LeadCard({
  lead, onPress, showColumn,
}: { lead: Lead; onPress: () => void; showColumn?: boolean }) {
  const colors = useColors();
  return (
    <TouchableOpacity
      style={[L.card, { backgroundColor: colors.card, borderColor: colors.border }]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <View style={L.cardRow}>
        <View style={[L.avatar, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[L.avatarText, { color: colors.mutedForeground }]}>{lead.initials}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[L.cardName, { color: colors.text }]} numberOfLines={1}>{lead.name}</Text>
          {lead.company && lead.company !== lead.name && (
            <Text style={[L.cardCompany, { color: colors.mutedForeground }]} numberOfLines={1}>{lead.company}</Text>
          )}
        </View>
        <View style={{ alignItems: "flex-end", gap: 6 }}>
          <Text style={[L.cardTime, { color: colors.mutedForeground }]}>{lead.time}</Text>
          {showColumn && (
            <Text style={[L.cardStage, { color: colors.mutedForeground }]}>{colLabel(lead.column)}</Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
});

// ─── Lead detail bottom sheet ─────────────────────────────────────────────────
function LeadDetailSheet({
  lead, visible, onClose, onMoveRequest, onViewCRM, onViewPipeline,
}: {
  lead: Lead | null;
  visible: boolean;
  onClose: () => void;
  onMoveRequest: () => void;
  onViewCRM: () => void;
  onViewPipeline: () => void;
}) {
  const colors = useColors();
  const router = useRouter();
  const slideY = useRef(new Animated.Value(100)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(slideY,  { toValue: 0, duration: 380, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 280, useNativeDriver: true }),
      ]).start();
    } else {
      slideY.setValue(100);
      opacity.setValue(0);
    }
  }, [visible]);

  const { leadActivities } = useApp();
  if (!lead) return null;

  const realActivities = leadActivities[lead.id];
  const history: ContactEntry[] = realActivities && realActivities.length > 0
    ? realActivities.map((a: LeadActivity) => {
        const d = new Date(a.created_at);
        const today = new Date();
        const yesterday = new Date(); yesterday.setDate(today.getDate() - 1);
        return {
          date: d.toDateString() === today.toDateString() ? "Hoje"
              : d.toDateString() === yesterday.toDateString() ? "Ontem"
              : d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }),
          time:    d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
          channel: a.channel as ContactEntry["channel"],
          agent:   a.agent,
          note:    a.note,
        };
      }).reverse()
    : (CRM_HISTORY[lead.id] ?? CRM_HISTORY.default);

  const score = getLeadScoreInfo(lead).score;
  const summaryIndex = Math.abs(parseInt(lead.id.replace(/\D/g, "0"), 10)) % JADE_SUMMARIES.length;
  const summary = JADE_SUMMARIES[summaryIndex] ?? JADE_SUMMARIES[0]!;

  const nextActions: string[] = lead.column === "novo"
    ? ["Enviar mensagem de apresentação via WhatsApp", "Qualificar necessidade e orçamento", "Agendar call de 15 min"]
    : lead.column === "qualificado"
    ? ["Enviar proposta com cases do segmento", "Follow-up em 2 dias se sem resposta", "Identificar decisor final"]
    : lead.column === "proposta"
    ? ["Confirmar recebimento da proposta", "Negociar condições se necessário", "Definir prazo para decisão"]
    : ["Coletar feedback pós-fechamento", "Solicitar indicações de novos contatos", "Iniciar onboarding"];

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <View style={L.sheetBg}>
        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onClose} />

        <Animated.View style={[L.sheet, { backgroundColor: colors.background, opacity, transform: [{ translateY: slideY }] }]}>
          {/* Handle */}
          <View style={[L.handle, { backgroundColor: colors.border }]} />

          {/* Header */}
          <View style={[L.sheetHeader, { borderBottomColor: colors.border }]}>
            <View style={[L.sheetAvatar, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[L.sheetAvatarText, { color: colors.mutedForeground }]}>{lead.initials}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[L.sheetName, { color: colors.text }]}>{lead.name}</Text>
              {lead.company && lead.company !== lead.name && (
                <Text style={[L.sheetCompany, { color: colors.mutedForeground }]}>{lead.company}</Text>
              )}
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 6 }}>
                <View style={[L.stagePill, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <Text style={[L.stagePillText, { color: colors.mutedForeground }]}>{colLabel(lead.column)}</Text>
                </View>
                {lead.value > 0 && (
                  <Text style={[L.sheetValue, { color: colors.text }]}>{formatValue(lead.value)}</Text>
                )}
              </View>
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 14, right: 14, bottom: 14, left: 14 }}>
              <Feather name="x" size={20} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
            {/* CRM / Pipeline view buttons */}
            <View style={[L.viewBtnRow, { paddingHorizontal: 20, paddingTop: 16 }]}>
              <TouchableOpacity
                style={[L.viewBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={onViewCRM}
                activeOpacity={0.8}
              >
                <Feather name="columns" size={14} color={colors.mutedForeground} />
                <Text style={[L.viewBtnText, { color: colors.text }]}>Ver no CRM</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[L.viewBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={onViewPipeline}
                activeOpacity={0.8}
              >
                <Feather name="bar-chart-2" size={14} color={colors.mutedForeground} />
                <Text style={[L.viewBtnText, { color: colors.text }]}>Ver no Pipeline</Text>
              </TouchableOpacity>
            </View>

            {/* Info pills */}
            {(lead.phone || cleanTag(lead.tag)) ? (
              <View style={[L.pillRow, { paddingHorizontal: 20, paddingTop: 12 }]}>
                {lead.phone ? (
                  <View style={[L.pill, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <Feather name="phone" size={12} color={colors.mutedForeground} />
                    <Text style={[L.pillText, { color: colors.mutedForeground }]}>{lead.phone}</Text>
                  </View>
                ) : null}
                {cleanTag(lead.tag) ? (
                  <View style={[L.pill, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <Feather name="tag" size={12} color={colors.mutedForeground} />
                    <Text style={[L.pillText, { color: colors.mutedForeground }]}>{cleanTag(lead.tag)}</Text>
                  </View>
                ) : null}
              </View>
            ) : null}

            {/* Stats row */}
            <View style={[L.statsRow, { paddingHorizontal: 20, paddingTop: 16 }]}>
              {[
                { label: "Contatos", value: `${history.length}` },
                { label: "Score",    value: `${score}` },
                { label: "Resp. IA", value: "3" },
                { label: "Dias CRM", value: "8" },
              ].map((s, i) => (
                <View key={i} style={[L.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <Text style={[L.statValue, { color: colors.text }]}>{s.value}</Text>
                  <Text style={[L.statLabel, { color: colors.mutedForeground }]}>{s.label}</Text>
                </View>
              ))}
            </View>

            {/* JADE Analysis */}
            <View style={L.sectionBlock}>
              <Text style={[L.sectionTitle, { color: colors.mutedForeground }]}>ANÁLISE JADE</Text>
              <View style={[L.aiCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={L.aiCardHeader}>
                  <View style={[L.aiIconWrap, { backgroundColor: colors.surface }]}>
                    <MaterialCommunityIcons name="robot" size={15} color={colors.mutedForeground} />
                  </View>
                  <Text style={[L.aiTitle, { color: colors.text }]}>Análise JADE IA</Text>
                </View>
                <Text style={[L.aiText, { color: colors.mutedForeground }]}>{summary}</Text>
              </View>
            </View>

            {/* Next actions */}
            <View style={L.sectionBlock}>
              <Text style={[L.sectionTitle, { color: colors.mutedForeground }]}>PRÓXIMAS AÇÕES</Text>
              <View style={[L.actionsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                {nextActions.map((action, i) => (
                  <View
                    key={i}
                    style={[L.actionItem, i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border }]}
                  >
                    <View style={[L.actionDot, { backgroundColor: i === 0 ? colors.text : colors.border }]} />
                    <Text style={[L.actionText, { color: i === 0 ? colors.text : colors.mutedForeground }]}>{action}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Contact history */}
            <View style={L.sectionBlock}>
              <Text style={[L.sectionTitle, { color: colors.mutedForeground }]}>HISTÓRICO DE CONTATOS</Text>
              <View style={[L.timelineCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                {history.map((entry, i) => (
                  <View key={i}>
                    <View style={L.timelineItem}>
                      <View style={L.timelineLeft}>
                        <View style={[L.timelineIconWrap, { backgroundColor: colors.surface }]}>
                          {channelIcon(entry.channel, colors.mutedForeground)}
                        </View>
                        {i < history.length - 1 && (
                          <View style={[L.timelineLine, { backgroundColor: colors.border }]} />
                        )}
                      </View>
                      <View style={{ flex: 1, paddingBottom: 18 }}>
                        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                          <Text style={[L.timelineChannel, { color: colors.text }]}>{channelLabel(entry.channel)}</Text>
                          <Text style={[L.timelineDate, { color: colors.mutedForeground }]}>{entry.date} · {entry.time}</Text>
                        </View>
                        <Text style={[L.timelineAgent, { color: colors.mutedForeground }]}>{entry.agent}</Text>
                        <Text style={[L.timelineNote, { color: colors.mutedForeground }]}>{entry.note}</Text>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          </ScrollView>

          {/* Footer actions */}
          <View style={[L.sheetFooter, { borderTopColor: colors.border }]}>
            <TouchableOpacity
              style={[L.footerBtnSecondary, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={onMoveRequest}
              activeOpacity={0.8}
            >
              <Feather name="move" size={15} color={colors.text} />
              <Text style={[L.footerBtnText, { color: colors.text }]}>Mover</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[L.footerBtnPrimary, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={() => { onClose(); router.push("/conversas" as any); }}
              activeOpacity={0.85}
            >
              <MaterialCommunityIcons name="robot" size={15} color={colors.text} />
              <Text style={[L.footerBtnText, { color: colors.text }]}>Conversar com JADE</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

// ─── Move modal (monochrome) ───────────────────────────────────────────────────
function MoveModal({
  lead, visible, onClose, onMove,
}: { lead: Lead | null; visible: boolean; onClose: () => void; onMove: (col: LeadColumn) => void }) {
  const colors = useColors();
  if (!lead) return null;
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={L.overlay} activeOpacity={1} onPress={onClose}>
        <View style={[L.moveModal, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[L.moveTitle, { color: colors.text }]}>Mover lead</Text>
          <Text style={[L.moveSub, { color: colors.mutedForeground }]}>{lead.name}</Text>
          <View style={[L.moveDivider, { backgroundColor: colors.border }]} />
          {COLUMNS.map((col) => (
            <TouchableOpacity
              key={col.key}
              style={[L.moveOption, lead.column === col.key && { backgroundColor: colors.surface }]}
              onPress={() => onMove(col.key)}
              activeOpacity={0.8}
            >
              <Text style={[L.moveOptionText, { color: lead.column === col.key ? colors.text : colors.mutedForeground }]}>
                {col.label}
              </Text>
              {lead.column === col.key && <Feather name="check" size={16} color={colors.text} />}
            </TouchableOpacity>
          ))}
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────
type ViewMode   = "crm" | "pipeline";
type HotFilter  = "all" | "hot";

export default function LeadsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { leads, moveLead } = useApp();

  const [viewMode,      setViewMode]      = useState<ViewMode>("crm");
  const [hotFilter,     setHotFilter]     = useState<HotFilter>("all");
  const [selectedLead,  setSelectedLead]  = useState<Lead | null>(null);
  const [detailVisible, setDetailVisible] = useState(false);
  const [moveVisible,   setMoveVisible]   = useState(false);

  const topPad    = Platform.OS === "web" ? 24 : insets.top + 4;
  const bottomPad = Platform.OS === "web" ? 84 : insets.bottom + 60;

  const openDetail = useCallback((lead: Lead) => {
    setSelectedLead(lead);
    setDetailVisible(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  const handleMove = useCallback((col: LeadColumn) => {
    if (selectedLead) {
      moveLead(selectedLead.id, col);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    setMoveVisible(false);
  }, [selectedLead, moveLead]);

  const filteredLeads = useMemo(() => {
    const sorted = [...leads].sort((a, b) => calcLeadScore(b) - calcLeadScore(a));
    return hotFilter === "hot" ? sorted.filter((l) => calcLeadScore(l) >= 70) : sorted;
  }, [leads, hotFilter]);

  const columnData = useMemo(() =>
    COLUMNS.map((col) => ({
      col,
      colLeads: filteredLeads.filter((l) => l.column === col.key),
    })),
    [filteredLeads],
  );

  const pipelineLeads = useMemo(() =>
    [...filteredLeads].sort((a, b) => b.value - a.value),
    [filteredLeads],
  );

  return (
    <View style={[L.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[L.header, { paddingTop: topPad, borderBottomColor: colors.border }]}>
        <TouchableOpacity style={L.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <Feather name="chevron-left" size={26} color={colors.text} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={[L.headerTitle, { color: colors.text }]}>Leads</Text>
          <Text style={[L.headerSub, { color: colors.mutedForeground }]}>{leads.length} leads</Text>
        </View>
      </View>

      {/* View toggle: CRM / Pipeline */}
      <View style={[L.viewToggleRow, { borderBottomColor: colors.border }]}>
        {(["crm", "pipeline"] as ViewMode[]).map((mode) => {
          const active = viewMode === mode;
          const label = mode === "crm" ? "CRM" : "Pipeline";
          const icon  = mode === "crm" ? "columns" : "bar-chart-2";
          return (
            <TouchableOpacity
              key={mode}
              style={L.viewToggleBtn}
              onPress={() => { setViewMode(mode); Haptics.selectionAsync(); }}
              activeOpacity={0.8}
            >
              <View style={L.viewToggleInner}>
                <Feather name={icon} size={14} color={active ? colors.text : colors.mutedForeground} />
                <Text style={[L.viewToggleText, { color: active ? colors.text : colors.mutedForeground }]}>{label}</Text>
              </View>
              {active && <View style={[L.viewUnderline, { backgroundColor: colors.text }]} />}
            </TouchableOpacity>
          );
        })}

        {/* Hot filter — right aligned */}
        <TouchableOpacity
          style={[L.hotBtn, {
            backgroundColor: hotFilter === "hot" ? colors.surface : "transparent",
            borderColor: hotFilter === "hot" ? colors.border : "transparent",
          }]}
          onPress={() => { setHotFilter((v) => v === "hot" ? "all" : "hot"); Haptics.selectionAsync(); }}
          activeOpacity={0.8}
        >
          <Text style={[L.hotBtnText, { color: hotFilter === "hot" ? colors.text : colors.mutedForeground }]}>
            🔥 Quentes
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {viewMode === "crm" ? (
        /* ── CRM Kanban ── */
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[L.kanbanContent, { paddingBottom: bottomPad }]}
        >
          {columnData.map(({ col, colLeads }) => (
            <View key={col.key} style={[L.column, { backgroundColor: colors.card, borderColor: colors.border }]}>
              {/* Column header */}
              <View style={[L.colHeader, { borderBottomColor: colors.border }]}>
                <Text style={[L.colTitle, { color: colors.text }]}>{col.label}</Text>
                <View style={[L.colBadge, { backgroundColor: colors.surface }]}>
                  <Text style={[L.colBadgeText, { color: colors.mutedForeground }]}>{colLeads.length}</Text>
                </View>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
                <View style={{ gap: 8, padding: 10 }}>
                  {colLeads.map((lead) => (
                    <LeadCard key={lead.id} lead={lead} onPress={() => openDetail(lead)} />
                  ))}
                  {colLeads.length === 0 && (
                    <View style={L.emptyCol}>
                      <Feather name="inbox" size={20} color={colors.mutedForeground} />
                      <Text style={[L.emptyColText, { color: colors.mutedForeground }]}>Vazio</Text>
                    </View>
                  )}
                </View>
              </ScrollView>
            </View>
          ))}
        </ScrollView>
      ) : (
        /* ── Pipeline list ── */
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[L.pipelineContent, { paddingBottom: bottomPad }]}
        >
          {pipelineLeads.length === 0 && (
            <View style={L.pipelineEmpty}>
              <Feather name="inbox" size={28} color={colors.mutedForeground} />
              <Text style={[L.emptyColText, { color: colors.mutedForeground }]}>Nenhum lead</Text>
            </View>
          )}
          {pipelineLeads.map((lead, idx) => {
            const score = getLeadScoreInfo(lead).score;
            return (
              <TouchableOpacity
                key={lead.id}
                style={[L.pipelineCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={() => openDetail(lead)}
                activeOpacity={0.75}
              >
                {/* Rank + avatar */}
                <View style={L.pipelineLeft}>
                  <Text style={[L.pipelineRank, { color: colors.mutedForeground }]}>#{idx + 1}</Text>
                  <View style={[L.avatar, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <Text style={[L.avatarText, { color: colors.mutedForeground }]}>{lead.initials}</Text>
                  </View>
                </View>

                {/* Info */}
                <View style={{ flex: 1 }}>
                  <Text style={[L.cardName, { color: colors.text }]} numberOfLines={1}>{lead.name}</Text>
                  {lead.company && lead.company !== lead.name && (
                    <Text style={[L.cardCompany, { color: colors.mutedForeground }]} numberOfLines={1}>{lead.company}</Text>
                  )}
                  <Text style={[L.cardStage, { color: colors.mutedForeground, marginTop: 4 }]}>{colLabel(lead.column)}</Text>
                </View>

                {/* Value + score */}
                <View style={{ alignItems: "flex-end", gap: 4 }}>
                  {lead.value > 0 && (
                    <Text style={[L.pipelineValue, { color: colors.text }]}>{formatValue(lead.value)}</Text>
                  )}
                  <View style={[L.scoreBadge, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <Text style={[L.scoreNum, { color: score >= 70 ? colors.text : colors.mutedForeground }]}>{score}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

      {/* Modals */}
      <LeadDetailSheet
        lead={selectedLead}
        visible={detailVisible}
        onClose={() => setDetailVisible(false)}
        onMoveRequest={() => { setDetailVisible(false); setMoveVisible(true); }}
        onViewCRM={() => { setDetailVisible(false); setViewMode("crm"); }}
        onViewPipeline={() => { setDetailVisible(false); setViewMode("pipeline"); }}
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

  // Header
  header: {
    flexDirection: "row", alignItems: "center", gap: 8,
    paddingHorizontal: 16, paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center", marginLeft: -8 },
  headerTitle: { fontSize: 24, fontFamily: "SpaceGrotesk_700Bold" },
  headerSub: { fontSize: 13, fontFamily: "SpaceGrotesk_400Regular", marginTop: 1 },

  // View toggle row
  viewToggleRow: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 16, borderBottomWidth: StyleSheet.hairlineWidth,
  },
  viewToggleBtn: { paddingVertical: 13, paddingRight: 24, alignItems: "center", position: "relative" },
  viewToggleInner: { flexDirection: "row", alignItems: "center", gap: 7 },
  viewToggleText: { fontSize: 14, fontFamily: "SpaceGrotesk_600SemiBold" },
  viewUnderline: { position: "absolute", bottom: -StyleSheet.hairlineWidth, height: 2, width: "80%", borderRadius: 2, alignSelf: "center" },
  hotBtn: {
    marginLeft: "auto", borderRadius: 10, borderWidth: 1,
    paddingHorizontal: 12, paddingVertical: 6,
  },
  hotBtnText: { fontSize: 13, fontFamily: "SpaceGrotesk_500Medium" },

  // Kanban
  kanbanContent: { paddingHorizontal: 12, paddingTop: 14, gap: 10, flexDirection: "row", alignItems: "flex-start" },
  column: { width: 230, borderRadius: 16, borderWidth: 1, overflow: "hidden", minHeight: 200 },
  colHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  colTitle: { fontSize: 15, fontFamily: "SpaceGrotesk_700Bold" },
  colBadge: { minWidth: 22, height: 22, borderRadius: 11, alignItems: "center", justifyContent: "center", paddingHorizontal: 6 },
  colBadgeText: { fontSize: 11, fontFamily: "SpaceGrotesk_700Bold" },
  emptyCol: { alignItems: "center", paddingVertical: 30, gap: 8 },
  emptyColText: { fontSize: 13, fontFamily: "SpaceGrotesk_400Regular" },

  // Pipeline
  pipelineContent: { padding: 16, gap: 10 },
  pipelineEmpty: { alignItems: "center", paddingTop: 60, gap: 10 },
  pipelineCard: { flexDirection: "row", alignItems: "center", gap: 12, borderRadius: 14, borderWidth: 1, padding: 14 },
  pipelineLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  pipelineRank: { fontSize: 12, fontFamily: "SpaceGrotesk_500Medium", width: 22, textAlign: "right" },
  pipelineValue: { fontSize: 14, fontFamily: "SpaceGrotesk_700Bold" },

  // Card (shared by both views)
  card: { borderRadius: 12, borderWidth: 1, padding: 12 },
  cardRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  avatar: { width: 38, height: 38, borderRadius: 12, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  avatarText: { fontSize: 13, fontFamily: "SpaceGrotesk_700Bold" },
  cardName: { fontSize: 14, fontFamily: "SpaceGrotesk_600SemiBold" },
  cardCompany: { fontSize: 12, fontFamily: "SpaceGrotesk_400Regular", marginTop: 1 },
  cardTime: { fontSize: 11, fontFamily: "SpaceGrotesk_400Regular" },
  cardStage: { fontSize: 11, fontFamily: "SpaceGrotesk_500Medium" },
  scoreBadge: { borderRadius: 7, borderWidth: 1, paddingHorizontal: 7, paddingVertical: 3, alignItems: "center", justifyContent: "center" },
  scoreNum: { fontSize: 11, fontFamily: "SpaceGrotesk_700Bold" },

  // Bottom sheet
  sheetBg: { flex: 1, backgroundColor: "rgba(0,0,0,0.7)", justifyContent: "flex-end" },
  sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: "92%", minHeight: "60%" },
  handle: { width: 36, height: 4, borderRadius: 2, alignSelf: "center", marginTop: 12, marginBottom: 4 },
  sheetHeader: {
    flexDirection: "row", alignItems: "flex-start", gap: 14,
    padding: 20, paddingTop: 8, borderBottomWidth: StyleSheet.hairlineWidth,
  },
  sheetAvatar: { width: 48, height: 48, borderRadius: 14, borderWidth: 1, alignItems: "center", justifyContent: "center", marginTop: 4 },
  sheetAvatarText: { fontSize: 16, fontFamily: "SpaceGrotesk_700Bold" },
  sheetName: { fontSize: 20, fontFamily: "SpaceGrotesk_700Bold" },
  sheetCompany: { fontSize: 14, fontFamily: "SpaceGrotesk_400Regular", marginTop: 1 },
  sheetValue: { fontSize: 15, fontFamily: "SpaceGrotesk_700Bold" },
  stagePill: { flexDirection: "row", alignItems: "center", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1 },
  stagePillText: { fontSize: 12, fontFamily: "SpaceGrotesk_500Medium" },

  // View buttons (CRM / Pipeline)
  viewBtnRow: { flexDirection: "row", gap: 10 },
  viewBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, height: 44, borderRadius: 12, borderWidth: 1 },
  viewBtnText: { fontSize: 14, fontFamily: "SpaceGrotesk_600SemiBold" },

  // Pills
  pillRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  pill: { flexDirection: "row", alignItems: "center", gap: 5, borderRadius: 8, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 6 },
  pillText: { fontSize: 12, fontFamily: "SpaceGrotesk_400Regular" },

  // Stats
  statsRow: { flexDirection: "row", gap: 8 },
  statCard: { flex: 1, borderRadius: 12, borderWidth: 1, padding: 12, alignItems: "center", gap: 3 },
  statValue: { fontSize: 18, fontFamily: "SpaceGrotesk_700Bold" },
  statLabel: { fontSize: 10, fontFamily: "SpaceGrotesk_500Medium", textAlign: "center" },

  // Section blocks
  sectionBlock: { paddingHorizontal: 20, paddingTop: 20 },
  sectionTitle: { fontSize: 10, fontFamily: "SpaceGrotesk_700Bold", letterSpacing: 1.2, marginBottom: 10 },

  // AI card
  aiCard: { borderRadius: 14, borderWidth: 1, padding: 16, gap: 10 },
  aiCardHeader: { flexDirection: "row", alignItems: "center", gap: 10 },
  aiIconWrap: { width: 30, height: 30, borderRadius: 9, alignItems: "center", justifyContent: "center" },
  aiTitle: { fontSize: 14, fontFamily: "SpaceGrotesk_600SemiBold" },
  aiText: { fontSize: 13, fontFamily: "SpaceGrotesk_400Regular", lineHeight: 20 },

  // Next actions
  actionsCard: { borderRadius: 14, borderWidth: 1, overflow: "hidden" },
  actionItem: { flexDirection: "row", alignItems: "flex-start", gap: 10, padding: 13 },
  actionDot: { width: 6, height: 6, borderRadius: 3, marginTop: 5 },
  actionText: { flex: 1, fontSize: 13, fontFamily: "SpaceGrotesk_400Regular", lineHeight: 19 },

  // Timeline
  timelineCard: { borderRadius: 14, borderWidth: 1, padding: 16, gap: 0 },
  timelineItem: { flexDirection: "row", gap: 12 },
  timelineLeft: { width: 28, alignItems: "center" },
  timelineIconWrap: { width: 28, height: 28, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  timelineLine: { width: 1, flex: 1, marginTop: 4 },
  timelineChannel: { fontSize: 13, fontFamily: "SpaceGrotesk_600SemiBold" },
  timelineDate: { fontSize: 11, fontFamily: "SpaceGrotesk_400Regular" },
  timelineAgent: { fontSize: 12, fontFamily: "SpaceGrotesk_400Regular", marginTop: 2 },
  timelineNote: { fontSize: 12, fontFamily: "SpaceGrotesk_400Regular", lineHeight: 17, marginTop: 3 },

  // Sheet footer
  sheetFooter: {
    flexDirection: "row", gap: 10, padding: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  footerBtnSecondary: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, height: 48, borderRadius: 13, borderWidth: 1 },
  footerBtnPrimary: { flex: 2, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, height: 48, borderRadius: 13, borderWidth: 1 },
  footerBtnText: { fontSize: 14, fontFamily: "SpaceGrotesk_600SemiBold" },

  // Move modal
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "center", alignItems: "center", padding: 24 },
  moveModal: { width: "100%", borderRadius: 18, borderWidth: 1, padding: 20, gap: 0 },
  moveTitle: { fontSize: 18, fontFamily: "SpaceGrotesk_700Bold", marginBottom: 4 },
  moveSub: { fontSize: 14, fontFamily: "SpaceGrotesk_400Regular" },
  moveDivider: { height: StyleSheet.hairlineWidth, marginVertical: 14 },
  moveOption: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 13, paddingHorizontal: 6, borderRadius: 10 },
  moveOptionText: { fontSize: 15, fontFamily: "SpaceGrotesk_500Medium" },
});
