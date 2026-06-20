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

interface VendedorMeta {
  id: string;
  nome: string;
  avatarColor: string;
  meta: number;
  realizado: number;
  forecast: number;
}

const VENDEDORES: VendedorMeta[] = [
  { id: "v1", nome: "Ana Paula",    avatarColor: "#6C63FF", meta: 30000, realizado: 36000, forecast: 38000 },
  { id: "v2", nome: "Carlos Rocha", avatarColor: "#FF0080", meta: 60000, realizado: 34800, forecast: 42000 },
  { id: "v3", nome: "Mariana Lima", avatarColor: "#00D68F", meta: 25000, realizado: 21250, forecast: 24000 },
  { id: "v4", nome: "Diego Nunes",  avatarColor: "#FFB300", meta: 45000, realizado: 20250, forecast: 27000 },
];

type Periodo = "mes" | "anterior" | "trimestre";

function pct(v: number, t: number) { return t ? Math.min(Math.round((v / t) * 100), 999) : 0; }
function barColor(p: number) { return p >= 80 ? "#00D68F" : p >= 50 ? "#FFB300" : "#FF3B5C"; }
function fmt(n: number) { return "R$ " + n.toLocaleString("pt-BR"); }
function initials(n: string) { return n.split(" ").map((x) => x[0]).slice(0, 2).join("").toUpperCase(); }

export default function MetasScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const [periodo, setPeriodo] = useState<Periodo>("mes");
  const [estrategia, setEstrategia] = useState("");
  const [loadingEst, setLoadingEst] = useState(false);

  const metaTotal   = VENDEDORES.reduce((s, v) => s + v.meta, 0);
  const realizadoTotal = VENDEDORES.reduce((s, v) => s + v.realizado, 0);
  const forecastTotal  = VENDEDORES.reduce((s, v) => s + v.forecast, 0);
  const pTotal = pct(realizadoTotal, metaTotal);
  const bc = barColor(pTotal);

  const PERIODOS: { key: Periodo; label: string }[] = [
    { key: "mes",      label: "Este mês" },
    { key: "anterior", label: "Mês anterior" },
    { key: "trimestre",label: "Trimestre" },
  ];

  const gerarEstrategia = async () => {
    setLoadingEst(true);
    setEstrategia("");
    try {
      const resumo = VENDEDORES.map(
        (v) => `${v.nome}: ${pct(v.realizado, v.meta)}% da meta (R$${v.realizado.toLocaleString()} de R$${v.meta.toLocaleString()})`
      ).join("; ");
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);
      const res = await fetch(`${API_BASE}/api/jade/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{
            role: "user",
            content: `Sou gestor comercial. Meu time está assim: ${resumo}. Meta total: ${fmt(metaTotal)}, realizado: ${fmt(realizadoTotal)} (${pTotal}%). Faltam ${fmt(metaTotal - realizadoTotal)} para bater a meta. Gere uma estratégia prática e objetiva para fechar o mês, focando nos vendedores com maior gap e nas ações que gerarão mais resultado rápido.`,
          }],
        }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      const data = await res.json();
      setEstrategia(data.message?.trim() || data.response?.trim() || "Não foi possível gerar a estratégia. Tente novamente.");
    } catch (err: unknown) {
      const isAbort = err instanceof Error && err.name === "AbortError";
      Alert.alert(
        "Erro",
        isAbort
          ? "A JADE demorou demais para responder. Tente novamente em instantes."
          : "Não foi possível gerar a estratégia. Verifique sua conexão.",
      );
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
          <Text style={[S.title, { color: colors.text }]}>Metas e Pipeline</Text>
          <Text style={[S.sub, { color: colors.mutedForeground }]}>Consolidado do time</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        <View style={S.filters}>
          {PERIODOS.map((p) => (
            <TouchableOpacity
              key={p.key}
              style={[S.filterBtn, periodo === p.key && { backgroundColor: ENTERPRISE_PURPLE }, periodo !== p.key && { backgroundColor: colors.surface }]}
              onPress={() => setPeriodo(p.key)}
              activeOpacity={0.8}
            >
              <Text style={[S.filterText, { color: periodo === p.key ? "#fff" : colors.mutedForeground }]}>{p.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={[S.totalCard, { backgroundColor: colors.card, borderColor: ENTERPRISE_PURPLE + "30" }]}>
          <Text style={[S.totalLabel, { color: colors.mutedForeground }]}>META TOTAL DO TIME</Text>
          <Text style={[S.totalValue, { color: colors.text }]}>{fmt(metaTotal)}</Text>
          <View style={S.totalRow}>
            <View style={{ flex: 1 }}>
              <Text style={[S.totalSub, { color: colors.mutedForeground }]}>Realizado</Text>
              <Text style={[S.totalReal, { color: bc }]}>{fmt(realizadoTotal)}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[S.totalSub, { color: colors.mutedForeground }]}>Forecast</Text>
              <Text style={[S.totalForecast, { color: "#FFB300" }]}>{fmt(forecastTotal)}</Text>
            </View>
            <View style={[S.pctBadge, { backgroundColor: bc + "22" }]}>
              <Text style={[S.pctText, { color: bc }]}>{pTotal}%</Text>
            </View>
          </View>
          <View style={[S.barTrack, { backgroundColor: colors.surface }]}>
            <View style={[S.barFill, { width: `${Math.min(pTotal, 100)}%` as any, backgroundColor: bc }]} />
          </View>
          {forecastTotal > realizadoTotal && (
            <View style={[S.barForecastTrack, { backgroundColor: "transparent" }]}>
              <View style={[S.barForecastFill, { width: `${Math.min(pct(forecastTotal, metaTotal), 100)}%` as any }]} />
            </View>
          )}
        </View>

        <Text style={[S.sectionLabel, { color: colors.mutedForeground }]}>POR VENDEDOR</Text>

        {[...VENDEDORES].sort((a, b) => pct(b.realizado, b.meta) - pct(a.realizado, a.meta)).map((v) => {
          const p = pct(v.realizado, v.meta);
          const bc2 = barColor(p);
          const pf = pct(v.forecast, v.meta);
          return (
            <View key={v.id} style={[S.vCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={S.vTop}>
                <View style={[S.avatar, { backgroundColor: v.avatarColor }]}>
                  <Text style={S.avatarText}>{initials(v.nome)}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[S.vNome, { color: colors.text }]}>{v.nome}</Text>
                  <Text style={[S.vMeta, { color: colors.mutedForeground }]}>Meta: {fmt(v.meta)}</Text>
                </View>
                <View style={{ alignItems: "flex-end", gap: 2 }}>
                  <Text style={[S.vPct, { color: bc2 }]}>{p}%</Text>
                  <Text style={[S.vForecast, { color: "#FFB300" }]}>forecast {pf}%</Text>
                </View>
              </View>
              <View style={S.vBars}>
                <View style={[S.barTrack, { backgroundColor: colors.surface }]}>
                  <View style={[S.barFill, { width: `${Math.min(p, 100)}%` as any, backgroundColor: bc2 }]} />
                </View>
                <View style={S.vAmounts}>
                  <Text style={[S.vReal, { color: colors.mutedForeground }]}>Realizado: {fmt(v.realizado)}</Text>
                  <Text style={[S.vFor, { color: "#FFB30099" }]}>Forecast: {fmt(v.forecast)}</Text>
                </View>
              </View>
            </View>
          );
        })}

        <View style={S.estrategiaSection}>
          <TouchableOpacity
            style={[S.estrategiaBtn, loadingEst && { opacity: 0.7 }]}
            onPress={gerarEstrategia}
            disabled={loadingEst}
            activeOpacity={0.85}
          >
            {loadingEst
              ? <ActivityIndicator color="#fff" />
              : <><MaterialCommunityIcons name="robot" size={18} color="#fff" /><Text style={S.estrategiaBtnText}>Gerar Estratégia com JADE</Text></>}
          </TouchableOpacity>

          {!!estrategia && (
            <View style={[S.estrategiaBox, { backgroundColor: colors.card, borderColor: ENTERPRISE_PURPLE + "40" }]}>
              <View style={[S.estrategiaHeader, { backgroundColor: ENTERPRISE_PURPLE + "18" }]}>
                <MaterialCommunityIcons name="robot" size={16} color={ENTERPRISE_PURPLE} />
                <Text style={[S.estrategiaLabel, { color: ENTERPRISE_PURPLE }]}>Estratégia da JADE para fechar o mês</Text>
              </View>
              <Text style={[S.estrategiaText, { color: colors.text }]}>{estrategia}</Text>
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
  filters: { flexDirection: "row", gap: 8, padding: 16, paddingBottom: 8 },
  filterBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
  filterText: { fontSize: 13, fontFamily: "SpaceGrotesk_600SemiBold" },
  totalCard: { margin: 16, padding: 18, borderRadius: 18, borderWidth: 1, gap: 12 },
  totalLabel: { fontSize: 10, fontFamily: "SpaceGrotesk_700Bold", letterSpacing: 1 },
  totalValue: { fontSize: 28, fontFamily: "SpaceGrotesk_700Bold" },
  totalRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  totalSub: { fontSize: 11, fontFamily: "SpaceGrotesk_400Regular" },
  totalReal: { fontSize: 16, fontFamily: "SpaceGrotesk_700Bold" },
  totalForecast: { fontSize: 16, fontFamily: "SpaceGrotesk_700Bold" },
  pctBadge: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12 },
  pctText: { fontSize: 20, fontFamily: "SpaceGrotesk_700Bold" },
  barTrack: { height: 8, borderRadius: 4, overflow: "hidden" },
  barFill: { height: "100%", borderRadius: 4 },
  barForecastTrack: { height: 3, borderRadius: 2 },
  barForecastFill: { height: "100%", borderRadius: 2, backgroundColor: "#FFB30055" },
  sectionLabel: { fontSize: 11, fontFamily: "SpaceGrotesk_600SemiBold", letterSpacing: 1, marginHorizontal: 20, marginBottom: 12 },
  vCard: { marginHorizontal: 16, marginBottom: 10, padding: 16, borderRadius: 16, borderWidth: 1, gap: 10 },
  vTop: { flexDirection: "row", alignItems: "center", gap: 12 },
  avatar: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  avatarText: { color: "#fff", fontSize: 13, fontFamily: "SpaceGrotesk_700Bold" },
  vNome: { fontSize: 15, fontFamily: "SpaceGrotesk_700Bold" },
  vMeta: { fontSize: 12, fontFamily: "SpaceGrotesk_400Regular", marginTop: 2 },
  vPct: { fontSize: 16, fontFamily: "SpaceGrotesk_700Bold" },
  vForecast: { fontSize: 11, fontFamily: "SpaceGrotesk_400Regular" },
  vBars: { gap: 6 },
  vAmounts: { flexDirection: "row", justifyContent: "space-between" },
  vReal: { fontSize: 11, fontFamily: "SpaceGrotesk_400Regular" },
  vFor: { fontSize: 11, fontFamily: "SpaceGrotesk_400Regular" },
  estrategiaSection: { padding: 20, gap: 16 },
  estrategiaBtn: { backgroundColor: ENTERPRISE_PURPLE, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, height: 52, borderRadius: 14, shadowColor: ENTERPRISE_PURPLE, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 6 },
  estrategiaBtnText: { color: "#fff", fontSize: 16, fontFamily: "SpaceGrotesk_700Bold" },
  estrategiaBox: { borderRadius: 14, borderWidth: 1, overflow: "hidden" },
  estrategiaHeader: { flexDirection: "row", alignItems: "center", gap: 8, padding: 12 },
  estrategiaLabel: { fontSize: 12, fontFamily: "SpaceGrotesk_600SemiBold" },
  estrategiaText: { fontSize: 14, fontFamily: "SpaceGrotesk_400Regular", lineHeight: 22, padding: 16 },
});
