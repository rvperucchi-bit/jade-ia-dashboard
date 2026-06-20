import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";

const ENTERPRISE_PURPLE = "#8400FF";

const API_BASE =
  Platform.OS === "web"
    ? ""
    : `https://${process.env.EXPO_PUBLIC_DOMAIN ?? ""}`;

const VENDEDORES = [
  { nome: "Ana Paula",    meta: 30000, realizado: 36000, leads: 38, conversao: 24, avatarColor: "#6C63FF" },
  { nome: "Carlos Rocha", meta: 60000, realizado: 34800, leads: 22, conversao: 12, avatarColor: "#FF0080" },
  { nome: "Mariana Lima", meta: 25000, realizado: 21250, leads: 44, conversao: 18, avatarColor: "#00D68F" },
  { nome: "Diego Nunes",  meta: 45000, realizado: 20250, leads: 28, conversao: 10, avatarColor: "#FFB300" },
];

function pct(v: number, t: number) { return t ? Math.min(Math.round((v / t) * 100), 999) : 0; }
function fmt(n: number) { return "R$ " + n.toLocaleString("pt-BR"); }
function barColor(p: number) { return p >= 80 ? "#00D68F" : p >= 50 ? "#FFB300" : "#FF3B5C"; }
function initials(n: string) { return n.split(" ").map((x) => x[0]).slice(0, 2).join("").toUpperCase(); }

export default function RelatorioGestorScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const [relatorio, setRelatorio] = useState("");
  const [estrategia, setEstrategia] = useState("");
  const [loadingRel, setLoadingRel] = useState(false);
  const [loadingEst, setLoadingEst] = useState(false);

  const metaTotal = VENDEDORES.reduce((s, v) => s + v.meta, 0);
  const realTotal  = VENDEDORES.reduce((s, v) => s + v.realizado, 0);
  const forecastTotal = Math.round(realTotal * 1.18);
  const pTotal = pct(realTotal, metaTotal);
  const bc = barColor(pTotal);

  const sorted = [...VENDEDORES].sort((a, b) => pct(b.realizado, b.meta) - pct(a.realizado, a.meta));
  const topPerformer = sorted[0];
  const precisaAtencao = sorted[sorted.length - 1];

  const gerarRelatorio = async () => {
    setLoadingRel(true);
    setRelatorio("");
    try {
      const resumo = VENDEDORES.map(
        (v) => `${v.nome}: ${pct(v.realizado, v.meta)}% da meta (${fmt(v.realizado)}/${fmt(v.meta)}), ${v.leads} leads, ${v.conversao}% conversão`
      ).join("\n");

      const ctrl1 = new AbortController();
      const t1 = setTimeout(() => ctrl1.abort(), 30000);
      const res = await fetch(`${API_BASE}/api/jade/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{
            role: "user",
            content: `Gere um relatório mensal executivo para apresentar à diretoria. Dados do time:\n${resumo}\nMeta total: ${fmt(metaTotal)}, Realizado: ${fmt(realTotal)} (${pTotal}%), Forecast: ${fmt(forecastTotal)}.\n\nO relatório deve ter: 1) Resumo executivo, 2) Performance individual, 3) Análise de gaps e onde o time perdeu negócios, 4) Destaques e riscos, 5) Recomendações para o próximo mês. Tom formal e executivo.`,
          }],
        }),
        signal: ctrl1.signal,
      });
      clearTimeout(t1);
      const data = await res.json();
      setRelatorio(data.message?.trim() || data.response?.trim() || "Não foi possível gerar o relatório.");
    } catch (err: unknown) {
      const isAbort = err instanceof Error && err.name === "AbortError";
      Alert.alert("Erro", isAbort ? "A JADE demorou demais. Tente novamente." : "Não foi possível gerar o relatório. Verifique sua conexão.");
    } finally {
      setLoadingRel(false);
    }
  };

  const gerarEstrategia = async () => {
    setLoadingEst(true);
    setEstrategia("");
    try {
      const ctrl2 = new AbortController();
      const t2 = setTimeout(() => ctrl2.abort(), 30000);
      const res = await fetch(`${API_BASE}/api/jade/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{
            role: "user",
            content: `Com base no desempenho do time este mês (${pTotal}% da meta, ${fmt(realTotal)} de ${fmt(metaTotal)}), top performer: ${topPerformer.nome} (${pct(topPerformer.realizado, topPerformer.meta)}%), precisa de atenção: ${precisaAtencao.nome} (${pct(precisaAtencao.realizado, precisaAtencao.meta)}%). Gere uma estratégia detalhada para o próximo mês: metas individuais revisadas, foco de segmento, ações de capacitação, e como usar os pontos fortes do time para superar as fraquezas.`,
          }],
        }),
        signal: ctrl2.signal,
      });
      clearTimeout(t2);
      const data = await res.json();
      setEstrategia(data.message?.trim() || data.response?.trim() || "Não foi possível gerar a estratégia.");
    } catch (err: unknown) {
      const isAbort = err instanceof Error && err.name === "AbortError";
      Alert.alert("Erro", isAbort ? "A JADE demorou demais. Tente novamente." : "Não foi possível gerar a estratégia. Verifique sua conexão.");
    } finally {
      setLoadingEst(false);
    }
  };

  return (
    <View style={[S.root, { backgroundColor: colors.background }]}>
      <View style={[S.header, { paddingTop: topPad, borderBottomColor: colors.border }]}>
        <TouchableOpacity style={[S.backBtn, { backgroundColor: colors.surface }]} onPress={() => router.back()} activeOpacity={0.8}>
          <Feather name="arrow-left" size={20} color={colors.text} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={[S.title, { color: colors.text }]}>Relatório do Gestor</Text>
          <Text style={[S.sub, { color: colors.mutedForeground }]}>Consolidado para diretoria</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        <View style={[S.totalCard, { backgroundColor: colors.card, borderColor: ENTERPRISE_PURPLE + "30" }]}>
          <Text style={[S.totalLabel, { color: colors.mutedForeground }]}>RESULTADO DO MÊS · JUNHO 2026</Text>
          <View style={S.totalNumbers}>
            <View style={{ flex: 1 }}>
              <Text style={[S.totalValue, { color: colors.text }]}>{fmt(realTotal)}</Text>
              <Text style={[S.totalMeta, { color: colors.mutedForeground }]}>de {fmt(metaTotal)}</Text>
            </View>
            <View style={[S.pctCircle, { borderColor: bc }]}>
              <Text style={[S.pctCircleText, { color: bc }]}>{pTotal}%</Text>
            </View>
          </View>
          <View style={[S.barTrack, { backgroundColor: colors.surface }]}>
            <View style={[S.barFill, { width: `${Math.min(pTotal, 100)}%` as any, backgroundColor: bc }]} />
          </View>
          <View style={S.kpiRow}>
            <View style={S.kpi}>
              <Text style={[S.kpiLabel, { color: colors.mutedForeground }]}>Forecast</Text>
              <Text style={[S.kpiValue, { color: "#FFB300" }]}>{fmt(forecastTotal)}</Text>
            </View>
            <View style={S.kpi}>
              <Text style={[S.kpiLabel, { color: colors.mutedForeground }]}>Gap</Text>
              <Text style={[S.kpiValue, { color: "#FF3B5C" }]}>{fmt(metaTotal - realTotal)}</Text>
            </View>
            <View style={S.kpi}>
              <Text style={[S.kpiLabel, { color: colors.mutedForeground }]}>Time</Text>
              <Text style={[S.kpiValue, { color: colors.text }]}>{VENDEDORES.length} vend.</Text>
            </View>
          </View>
        </View>

        <View style={S.spotlightRow}>
          <View style={[S.spotCard, { backgroundColor: "#00D68F14", borderColor: "#00D68F40" }]}>
            <Text style={[S.spotLabel, { color: "#00D68F" }]}>🏆 Top Performer</Text>
            <Text style={[S.spotNome, { color: colors.text }]}>{topPerformer.nome}</Text>
            <Text style={[S.spotPct, { color: "#00D68F" }]}>{pct(topPerformer.realizado, topPerformer.meta)}%</Text>
          </View>
          <View style={[S.spotCard, { backgroundColor: "#FF3B5C14", borderColor: "#FF3B5C40" }]}>
            <Text style={[S.spotLabel, { color: "#FF3B5C" }]}>⚠️ Precisa de atenção</Text>
            <Text style={[S.spotNome, { color: colors.text }]}>{precisaAtencao.nome}</Text>
            <Text style={[S.spotPct, { color: "#FF3B5C" }]}>{pct(precisaAtencao.realizado, precisaAtencao.meta)}%</Text>
          </View>
        </View>

        <Text style={[S.sectionLabel, { color: colors.mutedForeground }]}>PERFORMANCE INDIVIDUAL</Text>

        <View style={[S.table, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[S.tableHeader, { borderBottomColor: colors.border }]}>
            <Text style={[S.thCell, { flex: 2, color: colors.mutedForeground }]}>Vendedor</Text>
            <Text style={[S.thCell, { color: colors.mutedForeground }]}>Meta</Text>
            <Text style={[S.thCell, { color: colors.mutedForeground }]}>Real.</Text>
            <Text style={[S.thCell, { color: colors.mutedForeground }]}>%</Text>
          </View>
          {sorted.map((v, i) => {
            const p = pct(v.realizado, v.meta);
            const bc2 = barColor(p);
            return (
              <View key={i} style={[S.tableRow, i < sorted.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border }]}>
                <View style={[S.tdCell, { flex: 2, flexDirection: "row", alignItems: "center", gap: 8 }]}>
                  <View style={[S.miniAvatar, { backgroundColor: v.avatarColor }]}>
                    <Text style={S.miniAvatarText}>{initials(v.nome)}</Text>
                  </View>
                  <Text style={[S.tdName, { color: colors.text }]}>{v.nome.split(" ")[0]}</Text>
                </View>
                <Text style={[S.tdCell, { color: colors.mutedForeground }]}>{Math.round(v.meta / 1000)}k</Text>
                <Text style={[S.tdCell, { color: colors.text }]}>{Math.round(v.realizado / 1000)}k</Text>
                <Text style={[S.tdCell, { color: bc2, fontFamily: "SpaceGrotesk_700Bold" }]}>{p}%</Text>
              </View>
            );
          })}
        </View>

        <View style={S.actions}>
          <TouchableOpacity
            style={[S.actionBtn, { backgroundColor: ENTERPRISE_PURPLE }, loadingRel && { opacity: 0.7 }]}
            onPress={gerarRelatorio}
            disabled={loadingRel}
            activeOpacity={0.85}
          >
            {loadingRel
              ? <ActivityIndicator color="#fff" />
              : <><Feather name="file-text" size={18} color="#fff" /><Text style={S.actionBtnText}>Gerar Relatório Mensal</Text></>}
          </TouchableOpacity>

          {!!relatorio && (
            <View style={[S.outputBox, { backgroundColor: colors.card, borderColor: ENTERPRISE_PURPLE + "40" }]}>
              <View style={[S.outputHeader, { backgroundColor: ENTERPRISE_PURPLE + "18" }]}>
                <MaterialCommunityIcons name="robot" size={16} color={ENTERPRISE_PURPLE} />
                <Text style={[S.outputLabel, { color: ENTERPRISE_PURPLE }]}>Relatório gerado pela JADE</Text>
              </View>
              <Text style={[S.outputText, { color: colors.text }]}>{relatorio}</Text>
            </View>
          )}

          <TouchableOpacity
            style={[S.actionBtn, { backgroundColor: "#FFB300" }, loadingEst && { opacity: 0.7 }]}
            onPress={gerarEstrategia}
            disabled={loadingEst}
            activeOpacity={0.85}
          >
            {loadingEst
              ? <ActivityIndicator color="#fff" />
              : <><Feather name="trending-up" size={18} color="#fff" /><Text style={S.actionBtnText}>Estratégia do Próximo Mês</Text></>}
          </TouchableOpacity>

          {!!estrategia && (
            <View style={[S.outputBox, { backgroundColor: colors.card, borderColor: "#FFB30040" }]}>
              <View style={[S.outputHeader, { backgroundColor: "#FFB30018" }]}>
                <MaterialCommunityIcons name="robot" size={16} color="#FFB300" />
                <Text style={[S.outputLabel, { color: "#FFB300" }]}>Estratégia do Próximo Mês</Text>
              </View>
              <Text style={[S.outputText, { color: colors.text }]}>{estrategia}</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const S = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 20, paddingBottom: 14, borderBottomWidth: StyleSheet.hairlineWidth },
  backBtn: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 18, fontFamily: "SpaceGrotesk_700Bold" },
  sub: { fontSize: 12, fontFamily: "SpaceGrotesk_400Regular", marginTop: 2 },
  totalCard: { margin: 16, padding: 18, borderRadius: 18, borderWidth: 1, gap: 12 },
  totalLabel: { fontSize: 10, fontFamily: "SpaceGrotesk_700Bold", letterSpacing: 1 },
  totalNumbers: { flexDirection: "row", alignItems: "center", gap: 16 },
  totalValue: { fontSize: 26, fontFamily: "SpaceGrotesk_700Bold" },
  totalMeta: { fontSize: 12, fontFamily: "SpaceGrotesk_400Regular", marginTop: 2 },
  pctCircle: { width: 64, height: 64, borderRadius: 32, borderWidth: 3, alignItems: "center", justifyContent: "center" },
  pctCircleText: { fontSize: 18, fontFamily: "SpaceGrotesk_700Bold" },
  barTrack: { height: 8, borderRadius: 4, overflow: "hidden" },
  barFill: { height: "100%", borderRadius: 4 },
  kpiRow: { flexDirection: "row", gap: 8 },
  kpi: { flex: 1, alignItems: "center", gap: 2 },
  kpiLabel: { fontSize: 11, fontFamily: "SpaceGrotesk_400Regular" },
  kpiValue: { fontSize: 14, fontFamily: "SpaceGrotesk_700Bold" },
  spotlightRow: { flexDirection: "row", marginHorizontal: 16, gap: 10, marginBottom: 8 },
  spotCard: { flex: 1, borderRadius: 14, borderWidth: 1, padding: 14, gap: 4 },
  spotLabel: { fontSize: 11, fontFamily: "SpaceGrotesk_600SemiBold" },
  spotNome: { fontSize: 14, fontFamily: "SpaceGrotesk_700Bold" },
  spotPct: { fontSize: 20, fontFamily: "SpaceGrotesk_700Bold" },
  sectionLabel: { fontSize: 11, fontFamily: "SpaceGrotesk_600SemiBold", letterSpacing: 1, marginHorizontal: 20, marginBottom: 12 },
  table: { marginHorizontal: 16, borderRadius: 14, borderWidth: 1, overflow: "hidden" },
  tableHeader: { flexDirection: "row", paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: 1 },
  thCell: { flex: 1, fontSize: 11, fontFamily: "SpaceGrotesk_700Bold", letterSpacing: 0.5 },
  tableRow: { flexDirection: "row", paddingHorizontal: 14, paddingVertical: 12, alignItems: "center" },
  tdCell: { flex: 1, fontSize: 13, fontFamily: "SpaceGrotesk_500Medium" },
  tdName: { fontSize: 13, fontFamily: "SpaceGrotesk_600SemiBold" },
  miniAvatar: { width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  miniAvatarText: { color: "#fff", fontSize: 10, fontFamily: "SpaceGrotesk_700Bold" },
  actions: { padding: 20, gap: 16 },
  actionBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, height: 52, borderRadius: 14, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 6 },
  actionBtnText: { color: "#fff", fontSize: 16, fontFamily: "SpaceGrotesk_700Bold" },
  outputBox: { borderRadius: 14, borderWidth: 1, overflow: "hidden" },
  outputHeader: { flexDirection: "row", alignItems: "center", gap: 8, padding: 12 },
  outputLabel: { fontSize: 12, fontFamily: "SpaceGrotesk_600SemiBold" },
  outputText: { fontSize: 14, fontFamily: "SpaceGrotesk_400Regular", lineHeight: 22, padding: 16 },
});
