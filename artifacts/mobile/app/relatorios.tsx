import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { stripMarkdown } from "@/utils/stripMarkdown";

const API_BASE =
  Platform.OS === "web"
    ? ""
    : `https://${process.env.EXPO_PUBLIC_DOMAIN ?? ""}`;

type Tab = "diario" | "semanal";

interface DailyMetric { label: string; value: number; icon: string; color: string; unit?: string }
interface HourBar      { hour: string; value: number }

const DAILY_METRICS: DailyMetric[] = [
  { label: "Leads abordados",    value: 8,  icon: "users",         color: "#6C63FF" },
  { label: "Conversas iniciadas",value: 5,  icon: "message-circle",color: "#FF0080" },
  { label: "Propostas enviadas", value: 2,  icon: "send",          color: "#FFB300" },
  { label: "Fechamentos",        value: 1,  icon: "check-circle",  color: "#00D68F" },
];

const HOUR_BARS: HourBar[] = [
  { hour: "8h",  value: 2 }, { hour: "9h",  value: 5 },
  { hour: "10h", value: 8 }, { hour: "11h", value: 6 },
  { hour: "12h", value: 3 }, { hour: "14h", value: 7 },
  { hour: "15h", value: 9 }, { hour: "16h", value: 4 },
  { hour: "17h", value: 6 }, { hour: "18h", value: 2 },
];
const MAX_BAR = Math.max(...HOUR_BARS.map((b) => b.value));

const WEEKLY_METRICS = [
  { label: "Leads totais",        value: 42,  prev: 38,  icon: "users",         color: "#6C63FF" },
  { label: "Conversas",          value: 31,  prev: 28,  icon: "message-circle",color: "#FF0080" },
  { label: "Propostas",          value: 14,  prev: 11,  icon: "send",          color: "#FFB300" },
  { label: "Fechamentos",        value: 6,   prev: 4,   icon: "check-circle",  color: "#00D68F" },
  { label: "Receita estimada",   value: 18600, prev: 12400, icon: "dollar-sign", color: "#4ECDC4", unit: "R$" },
];

const TOP_LEADS = [
  { name: "Pizzaria Nova Roma",   score: 88, status: "Quente",       color: "#FF0080" },
  { name: "Açaí do Bessa",       score: 76, status: "Em contato",   color: "#FFB300" },
  { name: "Hamburgueria 4Rios",  score: 71, status: "Respondeu",    color: "#6C63FF" },
];

function pct(v: number, prev: number) {
  if (prev === 0) return "+100%";
  const diff = ((v - prev) / prev) * 100;
  return (diff >= 0 ? "+" : "") + diff.toFixed(0) + "%";
}

export default function RelatoriosScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const [tab, setTab]         = useState<Tab>("diario");
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState("");

  const gerar = async () => {
    setLoading(true);
    setAnalysis("");
    const isDiario = tab === "diario";
    const prompt = isDiario
      ? `Com base nas métricas do dia (8 leads abordados, 5 conversas, 2 propostas, 1 fechamento), gere uma análise executiva completa do dia comercial. Inclua: resumo do dia, o que foi bem, o que melhorar amanhã, principais ações para o dia seguinte e motivação final. Seja direto, prático e estruturado.`
      : `Com base nas métricas semanais (42 leads, 31 conversas, 14 propostas, 6 fechamentos, crescimento de ~10% vs semana anterior), gere um relatório semanal executivo completo. Inclua: desempenho geral, destaques positivos, pontos de melhoria, análise de tendência e meta da próxima semana. Seja direto, acionável e bem estruturado.`;
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);
      const res = await fetch(`${API_BASE}/api/jade/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [{ role: "user", content: prompt }] }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      const data = await res.json();
      setAnalysis(stripMarkdown(data.message?.trim() || data.response?.trim()) || "");
    } catch (err: unknown) {
      const isAbort = err instanceof Error && err.name === "AbortError";
      setAnalysis(isAbort ? "A JADE demorou demais. Tente novamente em instantes." : "Erro ao gerar análise. Verifique sua conexão.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[S.root, { backgroundColor: colors.background }]}>
      <View style={[S.header, { paddingTop: topPad, borderBottomColor: colors.border }]}>
        <TouchableOpacity style={[S.backBtn, { backgroundColor: colors.surface }]} onPress={() => router.back()} activeOpacity={0.8}>
          <Feather name="arrow-left" size={20} color={colors.text} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={[S.headerTitle, { color: colors.text }]}>Relatórios</Text>
          <Text style={[S.headerSub, { color: colors.mutedForeground }]}>Performance comercial</Text>
        </View>
        <View style={[S.proBadge, { backgroundColor: "#FF008022", borderColor: "#FF008044" }]}>
          <Text style={S.proBadgeText}>PRO</Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={[S.tabBar, { borderBottomColor: colors.border }]}>
        {(["diario", "semanal"] as Tab[]).map((t) => (
          <TouchableOpacity
            key={t}
            style={[S.tabItem, tab === t && { borderBottomColor: "#FF0080", borderBottomWidth: 2 }]}
            onPress={() => { setTab(t); setAnalysis(""); }}
            activeOpacity={0.8}
          >
            <Text style={[S.tabText, { color: tab === t ? "#FF0080" : colors.mutedForeground,
              fontFamily: tab === t ? "SpaceGrotesk_700Bold" : "SpaceGrotesk_400Regular" }]}>
              {t === "diario" ? "Diário" : "Semanal"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        {tab === "diario" ? (
          <>
            <View style={S.section}>
              <Text style={[S.sectionLabel, { color: colors.mutedForeground }]}>HOJE — {new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" }).toUpperCase()}</Text>
              <View style={S.metricsGrid}>
                {DAILY_METRICS.map((m) => (
                  <View key={m.label} style={[S.metricCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <View style={[S.metricIcon, { backgroundColor: m.color + "22" }]}>
                      <Feather name={m.icon as any} size={18} color={m.color} />
                    </View>
                    <Text style={[S.metricValue, { color: colors.text }]}>{m.value}</Text>
                    <Text style={[S.metricLabel, { color: colors.mutedForeground }]}>{m.label}</Text>
                  </View>
                ))}
              </View>
            </View>

            <View style={S.section}>
              <Text style={[S.sectionLabel, { color: colors.mutedForeground }]}>ATIVIDADE POR HORA</Text>
              <View style={[S.chartCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={S.bars}>
                  {HOUR_BARS.map((b) => (
                    <View key={b.hour} style={S.barWrap}>
                      <View style={S.barTrack}>
                        <View style={[S.barFill, { height: `${(b.value / MAX_BAR) * 100}%` as any, backgroundColor: "#FF0080" + (b.value === MAX_BAR ? "FF" : "88") }]} />
                      </View>
                      <Text style={[S.barLabel, { color: colors.mutedForeground }]}>{b.hour}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>

            <View style={S.section}>
              <TouchableOpacity style={[S.genBtn, loading && { opacity: 0.7 }]} onPress={gerar} disabled={loading} activeOpacity={0.85}>
                {loading ? <ActivityIndicator color="#fff" /> : <><Feather name="cpu" size={16} color="#fff" /><Text style={S.genBtnText}>Gerar Análise do Dia</Text></>}
              </TouchableOpacity>
              {!!analysis && (
                <View style={[S.analysisBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <Text style={[S.analysisLabel, { color: "#FF0080" }]}>ANÁLISE DA JADE</Text>
                  <Text style={[S.analysisText, { color: colors.text }]}>{analysis}</Text>
                </View>
              )}
            </View>
          </>
        ) : (
          <>
            <View style={S.section}>
              <Text style={[S.sectionLabel, { color: colors.mutedForeground }]}>ESTA SEMANA</Text>
              <View style={S.weekMetrics}>
                {WEEKLY_METRICS.map((m) => {
                  const p = pct(m.value, m.prev);
                  const positive = m.value >= m.prev;
                  const display = m.unit ? `${m.unit}${m.value.toLocaleString("pt-BR")}` : String(m.value);
                  return (
                    <View key={m.label} style={[S.weekCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                      <View style={[S.metricIcon, { backgroundColor: m.color + "22" }]}>
                        <Feather name={m.icon as any} size={16} color={m.color} />
                      </View>
                      <Text style={[S.weekValue, { color: colors.text }]}>{display}</Text>
                      <Text style={[S.weekLabel, { color: colors.mutedForeground }]}>{m.label}</Text>
                      <View style={[S.pctBadge, { backgroundColor: positive ? "#00D68F22" : "#FF3B5C22" }]}>
                        <Feather name={positive ? "trending-up" : "trending-down"} size={10} color={positive ? "#00D68F" : "#FF3B5C"} />
                        <Text style={[S.pctText, { color: positive ? "#00D68F" : "#FF3B5C" }]}>{p}</Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>

            <View style={S.section}>
              <Text style={[S.sectionLabel, { color: colors.mutedForeground }]}>TOP 3 LEADS DA SEMANA</Text>
              <View style={[S.leadsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                {TOP_LEADS.map((l, i) => (
                  <React.Fragment key={l.name}>
                    <View style={S.leadRow}>
                      <View style={[S.leadNum, { backgroundColor: l.color + "22" }]}>
                        <Text style={[S.leadNumText, { color: l.color }]}>#{i + 1}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[S.leadName, { color: colors.text }]}>{l.name}</Text>
                        <Text style={[S.leadStatus, { color: l.color }]}>{l.status}</Text>
                      </View>
                      <View style={[S.scoreBadge, { backgroundColor: l.color + "22" }]}>
                        <Text style={[S.scoreText, { color: l.color }]}>{l.score}</Text>
                      </View>
                    </View>
                    {i < TOP_LEADS.length - 1 && <View style={[S.divider, { backgroundColor: colors.border }]} />}
                  </React.Fragment>
                ))}
              </View>
            </View>

            <View style={S.section}>
              <TouchableOpacity style={[S.genBtn, loading && { opacity: 0.7 }]} onPress={gerar} disabled={loading} activeOpacity={0.85}>
                {loading ? <ActivityIndicator color="#fff" /> : <><Feather name="cpu" size={16} color="#fff" /><Text style={S.genBtnText}>Gerar Relatório Semanal</Text></>}
              </TouchableOpacity>
              {!!analysis && (
                <View style={[S.analysisBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <Text style={[S.analysisLabel, { color: "#FF0080" }]}>ANÁLISE DA JADE</Text>
                  <Text style={[S.analysisText, { color: colors.text }]}>{analysis}</Text>
                </View>
              )}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const S = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: "row", alignItems: "center", gap: 14,
    paddingHorizontal: 20, paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 18, fontFamily: "SpaceGrotesk_700Bold" },
  headerSub: { fontSize: 12, fontFamily: "SpaceGrotesk_400Regular", marginTop: 2 },
  proBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 1 },
  proBadgeText: { fontSize: 11, fontFamily: "SpaceGrotesk_700Bold", color: "#FF0080" },
  tabBar: { flexDirection: "row", borderBottomWidth: StyleSheet.hairlineWidth },
  tabItem: { flex: 1, alignItems: "center", paddingVertical: 14 },
  tabText: { fontSize: 14 },
  section: { padding: 20, gap: 14 },
  sectionLabel: { fontSize: 11, fontFamily: "SpaceGrotesk_700Bold", letterSpacing: 1 },
  metricsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  metricCard: { width: "47%", borderRadius: 14, borderWidth: 1, padding: 14, gap: 8, alignItems: "flex-start" },
  metricIcon: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  metricValue: { fontSize: 28, fontFamily: "SpaceGrotesk_700Bold" },
  metricLabel: { fontSize: 12, fontFamily: "SpaceGrotesk_400Regular" },
  chartCard: { borderRadius: 14, borderWidth: 1, padding: 16 },
  bars: { flexDirection: "row", alignItems: "flex-end", height: 80, gap: 6 },
  barWrap: { flex: 1, alignItems: "center", gap: 4 },
  barTrack: { flex: 1, width: "100%", justifyContent: "flex-end", borderRadius: 4, backgroundColor: "#FFFFFF10" },
  barFill: { width: "100%", borderRadius: 4 },
  barLabel: { fontSize: 9, fontFamily: "SpaceGrotesk_400Regular" },
  genBtn: {
    backgroundColor: "#FF0080", flexDirection: "row", alignItems: "center",
    justifyContent: "center", gap: 8, height: 48, borderRadius: 12,
    shadowColor: "#FF0080", shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 5,
  },
  genBtnText: { fontSize: 15, fontFamily: "SpaceGrotesk_700Bold", color: "#fff" },
  analysisBox: { borderRadius: 12, borderWidth: 1, padding: 16, gap: 8 },
  analysisLabel: { fontSize: 10, fontFamily: "SpaceGrotesk_700Bold", letterSpacing: 1 },
  analysisText: { fontSize: 13, fontFamily: "SpaceGrotesk_400Regular", lineHeight: 21 },
  weekMetrics: { gap: 10 },
  weekCard: {
    flexDirection: "row", alignItems: "center", gap: 12,
    borderRadius: 12, borderWidth: 1, padding: 14,
  },
  weekValue: { fontSize: 20, fontFamily: "SpaceGrotesk_700Bold", minWidth: 60 },
  weekLabel: { flex: 1, fontSize: 13, fontFamily: "SpaceGrotesk_400Regular" },
  pctBadge: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  pctText: { fontSize: 11, fontFamily: "SpaceGrotesk_700Bold" },
  leadsCard: { borderRadius: 14, borderWidth: 1, overflow: "hidden" },
  leadRow: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14 },
  leadNum: { width: 32, height: 32, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  leadNumText: { fontSize: 11, fontFamily: "SpaceGrotesk_700Bold" },
  leadName: { fontSize: 14, fontFamily: "SpaceGrotesk_600SemiBold" },
  leadStatus: { fontSize: 12, fontFamily: "SpaceGrotesk_500Medium", marginTop: 2 },
  scoreBadge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  scoreText: { fontSize: 16, fontFamily: "SpaceGrotesk_700Bold" },
  divider: { height: StyleSheet.hairlineWidth, marginHorizontal: 14 },
});
