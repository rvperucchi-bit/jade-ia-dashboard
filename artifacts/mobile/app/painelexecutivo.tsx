import React, { useState } from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";

import { useColors } from "@/hooks/useColors";

const PURPLE = "#8400FF";

const PINK   = "#FF0080";
const GREEN  = "#22CC88";

type Period = "hoje" | "semana" | "mes";

// Sem dados mockados — ranking e feed virão de API real

const KPI_DATA: Record<Period, {
  metaTotal: number; realizado: number; diasRestantes: number;
  vendasHoje: number; metaDiaria: number;
  leadsProspectados: number; metaLeads: number;
  taxaConversao: number; metaTaxa: number;
  ticketMedio: number; metaTicket: number;
  reunioes: number; propostas: number;
}> = {
  hoje: {
    metaTotal: 3400, realizado: 2800, diasRestantes: 0,
    vendasHoje: 2800, metaDiaria: 3400,
    leadsProspectados: 14, metaLeads: 10,
    taxaConversao: 28, metaTaxa: 25,
    ticketMedio: 8500, metaTicket: 7000,
    reunioes: 4, propostas: 3,
  },
  semana: {
    metaTotal: 17000, realizado: 13200, diasRestantes: 2,
    vendasHoje: 13200, metaDiaria: 17000,
    leadsProspectados: 68, metaLeads: 50,
    taxaConversao: 26, metaTaxa: 25,
    ticketMedio: 8100, metaTicket: 7000,
    reunioes: 19, propostas: 14,
  },
  mes: {
    metaTotal: 51000, realizado: 38500, diasRestantes: 8,
    vendasHoje: 38500, metaDiaria: 51000,
    leadsProspectados: 247, metaLeads: 200,
    taxaConversao: 24, metaTaxa: 25,
    ticketMedio: 8200, metaTicket: 7000,
    reunioes: 62, propostas: 44,
  },
};

// ─── Progress Ring ───────────────────────────────────────────────────────────
function ProgressBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = Math.min(1, value / Math.max(max, 1));
  const statusColor = pct >= 0.8 ? GREEN : pct >= 0.5 ? PINK : "#555577";
  return (
    <View style={{ gap: 6 }}>
      <View style={[PB.track]}>
        <View style={[PB.fill, { width: `${Math.round(pct * 100)}%` as any, backgroundColor: color }]} />
      </View>
      <View style={PB.row}>
        <Text style={[PB.realizado, { color: statusColor }]}>{Math.round(pct * 100)}%</Text>
        <Text style={PB.meta}>R${(max / 1000).toFixed(0)}k meta</Text>
      </View>
    </View>
  );
}

const PB = StyleSheet.create({
  track:    { height: 10, backgroundColor: "#1E1E2E", borderRadius: 6, overflow: "hidden" },
  fill:     { height: 10, borderRadius: 6 },
  row:      { flexDirection: "row", justifyContent: "space-between" },
  realizado:{ fontSize: 16, fontFamily: "SpaceGrotesk_700Bold" },
  meta:     { fontSize: 13, fontFamily: "SpaceGrotesk_400Regular", color: "#7777AA" },
});

// ─── KPI Card ─────────────────────────────────────────────────────────────────
function KpiCard({ label, value, meta, up, color }: { label: string; value: string; meta: string; up: boolean; color: string }) {
  const colors = useColors();
  return (
    <View style={[K.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={[K.dot, { backgroundColor: color }]} />
      <Text style={[K.val, { color: colors.text }]}>{value}</Text>
      <Text style={[K.lbl, { color: colors.mutedForeground }]}>{label}</Text>
      <View style={[K.chip, { backgroundColor: up ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.06)" }]}>
        <Feather name={up ? "trending-up" : "trending-down"} size={9} color={up ? GREEN : "rgba(255,255,255,0.5)"} />
        <Text style={[K.chipText, { color: up ? GREEN : "rgba(255,255,255,0.5)" }]}>{meta}</Text>
      </View>
    </View>
  );
}

const K = StyleSheet.create({
  card: { flex: 1, borderRadius: 12, borderWidth: 1, padding: 12, gap: 3, minWidth: "45%" },
  dot:  { width: 6, height: 6, borderRadius: 3 },
  val:  { fontSize: 20, fontFamily: "SpaceGrotesk_700Bold" },
  lbl:  { fontSize: 10, fontFamily: "SpaceGrotesk_400Regular", opacity: 0.7 },
  chip: { flexDirection: "row", alignItems: "center", gap: 3, alignSelf: "flex-start", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, marginTop: 2 },
  chipText: { fontSize: 9, fontFamily: "SpaceGrotesk_500Medium" },
});

// ─── Team Row ─────────────────────────────────────────────────────────────────
function TeamRow({ member, rank }: { member: { name: string; vendas: number; meta: number; deals: number }; rank: number }) {
  const colors = useColors();
  const pct    = Math.min(1, member.vendas / member.meta);
  const pctN   = Math.round(pct * 100);
  const isLeader = rank === 1;
  const isDanger = pct < 0.5;
  const barColor = isLeader ? PINK : isDanger ? "#555577" : PURPLE;

  return (
    <View style={[TR.row, { borderBottomColor: colors.border }]}>
      <View style={[TR.rankBadge, { backgroundColor: isLeader ? PINK + "22" : isDanger ? "rgba(255,255,255,0.06)" : "#1A1A2E" }]}>
        <Text style={[TR.rankText, { color: isLeader ? PINK : isDanger ? "rgba(255,255,255,0.5)" : colors.mutedForeground }]}>
          {isLeader ? "🥇" : `#${rank}`}
        </Text>
      </View>
      <View style={{ flex: 1, gap: 4 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <Text style={[TR.name, { color: colors.text }]}>{member.name}</Text>
          <Text style={[TR.vendas, { color: isLeader ? PINK : colors.text }]}>
            R${(member.vendas / 1000).toFixed(0)}k
          </Text>
        </View>
        <View style={TR.barTrack}>
          <View style={[TR.barFill, { width: `${pctN}%` as any, backgroundColor: barColor }]} />
        </View>
        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          <Text style={[TR.sub, { color: colors.mutedForeground }]}>{member.deals} contratos</Text>
          <View style={[TR.pctBadge, { backgroundColor: barColor + "22" }]}>
            <Text style={[TR.pctText, { color: barColor }]}>{pctN}% da meta</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const TR = StyleSheet.create({
  row:      { flexDirection: "row", gap: 12, alignItems: "flex-start", paddingVertical: 12, paddingHorizontal: 14, borderBottomWidth: StyleSheet.hairlineWidth },
  rankBadge:{ width: 38, height: 38, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  rankText: { fontSize: 16, fontFamily: "SpaceGrotesk_700Bold" },
  name:     { fontSize: 15, fontFamily: "SpaceGrotesk_600SemiBold" },
  vendas:   { fontSize: 15, fontFamily: "SpaceGrotesk_700Bold" },
  barTrack: { height: 5, backgroundColor: "#1E1E2E", borderRadius: 3, overflow: "hidden" },
  barFill:  { height: 5, borderRadius: 3 },
  sub:      { fontSize: 10, fontFamily: "SpaceGrotesk_400Regular", opacity: 0.7 },
  pctBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  pctText:  { fontSize: 10, fontFamily: "SpaceGrotesk_700Bold" },
});

// ─── Screen ───────────────────────────────────────────────────────────────────
type ActiveTab = "pipeline" | "crm";

export default function PainelExecutivoScreen() {
  const colors     = useColors();
  const insets     = useSafeAreaInsets();
  const router     = useRouter();
  const [period,    setPeriod]    = useState<Period>("mes");
  const [activeTab, setActiveTab] = useState<ActiveTab>("pipeline");

  const kpi      = KPI_DATA[period];
  const pct      = Math.min(1, kpi.realizado / kpi.metaTotal);
  const pctN     = Math.round(pct * 100);
  const barColor = pct >= 0.8 ? GREEN : pct >= 0.5 ? PINK : "#555577";
  const statusMsg = pct >= 0.8 ? "🟢 No caminho certo" : pct >= 0.5 ? "🟡 Atenção necessária" : "🔴 Requer ação imediata";

  const topPad    = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 84 : insets.bottom + 60;

  const fmt  = (v: number) => v >= 1000 ? `R$${(v / 1000).toFixed(0)}k` : `R$${v}`;

  return (
    <ScrollView
      style={[S.root, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingBottom: bottomPad }}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={[S.header, { paddingTop: topPad }]}>
        <TouchableOpacity onPress={() => router.back()} style={S.backBtn} activeOpacity={0.7}>
          <Feather name="arrow-left" size={20} color={colors.text} />
        </TouchableOpacity>
        <Text style={[S.title, { color: colors.text }]}>Pipeline da Equipe</Text>
        <View style={[S.goldBadge, { backgroundColor: PINK + "22" }]}>
          <Text style={[S.goldBadgeText, { color: PINK }]}>Enterprise</Text>
        </View>
      </View>

      {/* Tab switcher */}
      <View style={S.tabRow}>
        {([
          { key: "pipeline", label: "Pipeline" },
          { key: "crm",      label: "CRM da Equipe" },
        ] as { key: ActiveTab; label: string }[]).map((t) => (
          <TouchableOpacity
            key={t.key}
            style={[S.tabBtn, { borderBottomColor: activeTab === t.key ? PINK : "transparent" }]}
            onPress={() => { Haptics.selectionAsync(); setActiveTab(t.key); }}
            activeOpacity={0.8}
          >
            <Text style={[S.tabText, { color: activeTab === t.key ? PINK : colors.mutedForeground }]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {activeTab === "pipeline" ? (
        <>
          {/* Period selector */}
          <View style={S.periodRow}>
            {(["hoje", "semana", "mes"] as Period[]).map((p) => (
              <TouchableOpacity
                key={p}
                style={[S.periodBtn, { backgroundColor: period === p ? PURPLE : colors.surface, borderColor: period === p ? PURPLE : colors.border }]}
                onPress={() => { Haptics.selectionAsync(); setPeriod(p); }}
                activeOpacity={0.8}
              >
                <Text style={[S.periodText, { color: period === p ? "#fff" : colors.mutedForeground }]}>
                  {p === "hoje" ? "Hoje" : p === "semana" ? "Semana" : "Mês"}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Meta principal */}
          <View style={[S.metaCard, { backgroundColor: colors.card, borderColor: PURPLE + "40" }]}>
            <View style={S.metaHeader}>
              <View>
                <Text style={[S.metaLabel, { color: colors.mutedForeground }]}>Meta {period === "hoje" ? "do Dia" : period === "semana" ? "da Semana" : "do Mês"}</Text>
                <Text style={[S.metaVal, { color: colors.text }]}>{fmt(kpi.realizado)}</Text>
                <Text style={[S.metaDe, { color: colors.mutedForeground }]}>de {fmt(kpi.metaTotal)}</Text>
              </View>
              <View style={[S.pctCircle, { borderColor: barColor }]}>
                <Text style={[S.pctNum, { color: barColor }]}>{pctN}%</Text>
              </View>
            </View>
            <ProgressBar value={kpi.realizado} max={kpi.metaTotal} color={barColor} />
            <View style={S.metaFooter}>
              <Text style={[S.statusMsg, { color: colors.mutedForeground }]}>{statusMsg}</Text>
              {period === "mes" && kpi.diasRestantes > 0 && (
                <View style={[S.diasBadge, { backgroundColor: barColor + "22" }]}>
                  <Feather name="clock" size={11} color={barColor} />
                  <Text style={[S.diasText, { color: barColor }]}>{kpi.diasRestantes} dias restantes</Text>
                </View>
              )}
            </View>
          </View>

          {/* KPI Grid */}
          <Text style={[S.sectionCap, { color: colors.mutedForeground }]}>INDICADORES</Text>
          <View style={S.kpiGrid}>
            <KpiCard label="Vendas"       value={fmt(kpi.vendasHoje)}          meta={`meta ${fmt(kpi.metaDiaria)}`}     up={kpi.vendasHoje >= kpi.metaDiaria * 0.7}       color={GREEN}   />
            <KpiCard label="Leads Prosp." value={String(kpi.leadsProspectados)} meta={`meta ${kpi.metaLeads}`}           up={kpi.leadsProspectados >= kpi.metaLeads}       color={PURPLE}  />
            <KpiCard label="Tx. Conversão"value={`${kpi.taxaConversao}%`}       meta={`meta ${kpi.metaTaxa}%`}           up={kpi.taxaConversao >= kpi.metaTaxa}            color={PINK}    />
            <KpiCard label="Ticket Médio" value={fmt(kpi.ticketMedio)}          meta={`meta ${fmt(kpi.metaTicket)}`}     up={kpi.ticketMedio >= kpi.metaTicket}            color={PINK}    />
            <KpiCard label="Reuniões"     value={String(kpi.reunioes)}          meta="realizadas"                        up                                                color="#FF0080" />
            <KpiCard label="Propostas"    value={String(kpi.propostas)}         meta="enviadas"                          up                                                color="#8400FF" />
          </View>

          {/* Ranking do Time — empty state */}
          <Text style={[S.sectionCap, { color: colors.mutedForeground }]}>RANKING DO TIME</Text>
          <View style={[S.card, { backgroundColor: colors.card, borderColor: colors.border, alignItems: "center", padding: 32, gap: 12 }]}>
            <Feather name="users" size={32} color={colors.mutedForeground} />
            <Text style={{ fontSize: 14, fontFamily: "SpaceGrotesk_400Regular", color: colors.mutedForeground, textAlign: "center" }}>
              Nenhum membro do time adicionado ainda.{"\n"}Configure sua equipe para ver o ranking.
            </Text>
          </View>

          {/* Feed de Atividades — empty state */}
          <Text style={[S.sectionCap, { color: colors.mutedForeground }]}>ATIVIDADE RECENTE</Text>
          <View style={[S.card, { backgroundColor: colors.card, borderColor: colors.border, alignItems: "center", padding: 28, gap: 12 }]}>
            <Feather name="activity" size={28} color={colors.mutedForeground} />
            <Text style={{ fontSize: 14, fontFamily: "SpaceGrotesk_400Regular", color: colors.mutedForeground, textAlign: "center" }}>
              Nenhuma atividade recente do time.
            </Text>
          </View>
        </>
      ) : (
        /* CRM da Equipe — empty state */
        <View style={{ alignItems: "center", paddingTop: 60, paddingHorizontal: 32, gap: 16 }}>
          <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: PINK + "18", alignItems: "center", justifyContent: "center" }}>
            <Feather name="users" size={28} color={PINK} />
          </View>
          <Text style={{ fontSize: 18, fontFamily: "SpaceGrotesk_700Bold", color: colors.text, textAlign: "center" }}>CRM da Equipe</Text>
          <Text style={{ fontSize: 14, fontFamily: "SpaceGrotesk_400Regular", color: colors.mutedForeground, textAlign: "center", lineHeight: 22 }}>
            O CRM compartilhado da equipe ficará disponível quando os membros do time forem configurados. Use o CRM individual no menu Comercial.
          </Text>
          <TouchableOpacity
            style={{ backgroundColor: PINK, borderRadius: 12, paddingHorizontal: 24, paddingVertical: 12, marginTop: 8 }}
            onPress={() => router.push("/crm" as any)}
            activeOpacity={0.85}
          >
            <Text style={{ color: "#fff", fontSize: 14, fontFamily: "SpaceGrotesk_700Bold" }}>Abrir meu CRM</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

const S = StyleSheet.create({
  root:     { flex: 1 },
  header:   { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingBottom: 12 },
  backBtn:  { width: 44, height: 44, borderRadius: 22, backgroundColor: "rgba(255,255,255,0.08)", borderWidth: 1, borderColor: "rgba(255,255,255,0.12)", alignItems: "center", justifyContent: "center" },
  title:    { fontSize: 20, fontFamily: "SpaceGrotesk_700Bold", flex: 1 },
  goldBadge:{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  goldBadgeText: { fontSize: 11, fontFamily: "SpaceGrotesk_700Bold" },
  tabRow:   { flexDirection: "row", paddingHorizontal: 16, marginBottom: 16, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "#1E1E2E" },
  tabBtn:   { flex: 1, alignItems: "center", paddingVertical: 12, borderBottomWidth: 2 },
  tabText:  { fontSize: 14, fontFamily: "SpaceGrotesk_600SemiBold" },
  periodRow:{ flexDirection: "row", gap: 8, paddingHorizontal: 16, marginBottom: 16 },
  periodBtn:{ flex: 1, height: 36, borderRadius: 10, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  periodText: { fontSize: 15, fontFamily: "SpaceGrotesk_600SemiBold" },
  metaCard: { marginHorizontal: 16, borderRadius: 16, borderWidth: 1.5, padding: 18, marginBottom: 16, gap: 12 },
  metaHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  metaLabel:{ fontSize: 11, fontFamily: "SpaceGrotesk_500Medium", opacity: 0.7 },
  metaVal:  { fontSize: 32, fontFamily: "SpaceGrotesk_700Bold" },
  metaDe:   { fontSize: 15, fontFamily: "SpaceGrotesk_400Regular" },
  pctCircle:{ width: 70, height: 70, borderRadius: 35, borderWidth: 3, alignItems: "center", justifyContent: "center" },
  pctNum:   { fontSize: 20, fontFamily: "SpaceGrotesk_700Bold" },
  metaFooter:{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  statusMsg:{ fontSize: 13, fontFamily: "SpaceGrotesk_500Medium" },
  diasBadge:{ flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  diasText: { fontSize: 11, fontFamily: "SpaceGrotesk_600SemiBold" },
  sectionCap:{ fontSize: 10, fontFamily: "SpaceGrotesk_600SemiBold", letterSpacing: 1.2, paddingHorizontal: 20, marginBottom: 8, marginTop: 4, opacity: 0.6 },
  kpiGrid:  { flexDirection: "row", flexWrap: "wrap", paddingHorizontal: 12, gap: 8, marginBottom: 14 },
  card:     { marginHorizontal: 16, borderRadius: 14, borderWidth: 1, overflow: "hidden", marginBottom: 14 },
  feedRow:  { flexDirection: "row", gap: 10, padding: 12, alignItems: "flex-start" },
  feedIcon: { width: 28, height: 28, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  feedText: { fontSize: 13, fontFamily: "SpaceGrotesk_400Regular", lineHeight: 18 },
  feedTime: { fontSize: 10, fontFamily: "SpaceGrotesk_400Regular", marginTop: 2, opacity: 0.6 },
  div:      { height: StyleSheet.hairlineWidth, marginLeft: 50 },
});
