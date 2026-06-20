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

interface Vendedor {
  id: string;
  nome: string;
  avatarColor: string;
  meta: number;
  realizado: number;
  segmento: string;
  pipeline: string;
}

const VENDEDORES: Vendedor[] = [
  { id: "v1", nome: "Ana Paula",    avatarColor: "#6C63FF", meta: 30000, realizado: 36000, segmento: "PME",        pipeline: "8 oportunidades ativas, 3 em proposta" },
  { id: "v2", nome: "Carlos Rocha", avatarColor: "#FF0080", meta: 60000, realizado: 34800, segmento: "Enterprise", pipeline: "5 oportunidades, travado na qualificação" },
  { id: "v3", nome: "Mariana Lima", avatarColor: "#00D68F", meta: 25000, realizado: 21250, segmento: "Varejo",     pipeline: "12 leads novos, poucos avanços" },
  { id: "v4", nome: "Diego Nunes",  avatarColor: "#FFB300", meta: 45000, realizado: 20250, segmento: "SaaS",       pipeline: "4 oportunidades, perda de 2 deals esta semana" },
];

function pct(realizado: number, meta: number) { return meta ? Math.min(Math.round((realizado / meta) * 100), 999) : 0; }
function fmt(n: number) { return "R$ " + n.toLocaleString("pt-BR"); }
function initials(n: string) { return n.split(" ").map((x) => x[0]).slice(0, 2).join("").toUpperCase(); }

const SYSTEM_PROMPT = "Você é a JADE, mentora comercial empática e humana. NUNCA use linguagem de cobrança ou pressão. Sempre reconheça o esforço primeiro, identifique bloqueios com curiosidade genuína, sugira 3 ações concretas e práticas para esta semana, e termine com encorajamento genuíno. Tom: mentora que acredita no potencial de cada vendedor, nunca chefe cobrando. Máximo 4 parágrafos.";

export default function FeedbackJadeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const [feedbacks, setFeedbacks] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});

  const gerarFeedback = async (v: Vendedor) => {
    setLoading((prev) => ({ ...prev, [v.id]: true }));
    const p = pct(v.realizado, v.meta);
    const acima = p >= 100;

    try {
      const prompt = acima
        ? `Vendedor: ${v.nome}. Atingiu ${p}% da meta (${fmt(v.realizado)} de ${fmt(v.meta)}). Segmento: ${v.segmento}. Pipeline: ${v.pipeline}. Escreva uma mensagem de parabenização genuína e calorosa, celebre a conquista, reconheça o esforço específico que levou ao resultado, e incentive a manter o ritmo com uma dica para o próximo mês.`
        : `Vendedor: ${v.nome}. Está em ${p}% da meta (${fmt(v.realizado)} de ${fmt(v.meta)}). Segmento: ${v.segmento}. Pipeline atual: ${v.pipeline}. Escreva um feedback empático, sem cobrança. Reconheça o esforço, identifique onde pode estar o gargalo baseado no pipeline, sugira 3 ações concretas para esta semana, e termine com encorajamento genuíno.`;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);
      const res = await fetch(`${API_BASE}/api/jade/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            { role: "user", content: `[SYSTEM: ${SYSTEM_PROMPT}]\n\n${prompt}` },
          ],
        }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      const data = await res.json();
      setFeedbacks((prev) => ({ ...prev, [v.id]: data.message?.trim() || data.response?.trim() || "Não foi possível gerar o feedback." }));
    } catch (err: unknown) {
      const isAbort = err instanceof Error && err.name === "AbortError";
      Alert.alert(
        "Erro",
        isAbort
          ? "A JADE demorou demais para responder. Tente novamente em instantes."
          : "Não foi possível gerar o feedback. Verifique sua conexão.",
      );
    } finally {
      setLoading((prev) => ({ ...prev, [v.id]: false }));
    }
  };

  return (
    <View style={[S.root, { backgroundColor: colors.background }]}>
      <View style={[S.header, { paddingTop: topPad, borderBottomColor: colors.border }]}>
        <TouchableOpacity style={[S.backBtn, { backgroundColor: colors.surface }]} onPress={() => router.back()} activeOpacity={0.8}>
          <Feather name="arrow-left" size={20} color={colors.text} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={[S.title, { color: colors.text }]}>Feedback da JADE</Text>
          <Text style={[S.sub, { color: colors.mutedForeground }]}>Mentoria empática por vendedor</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        <View style={[S.jadeBanner, { backgroundColor: ENTERPRISE_PURPLE + "14", borderColor: ENTERPRISE_PURPLE + "30" }]}>
          <MaterialCommunityIcons name="robot" size={22} color={ENTERPRISE_PURPLE} />
          <Text style={[S.jadeBannerText, { color: colors.mutedForeground }]}>
            A JADE gera feedback humano, empático e sem cobrança para cada vendedor — focado em crescimento e motivação.
          </Text>
        </View>

        <Text style={[S.sectionLabel, { color: colors.mutedForeground }]}>SEU TIME</Text>

        {VENDEDORES.map((v) => {
          const p = pct(v.realizado, v.meta);
          const acima = p >= 100;
          const parcial = p >= 80;
          const baixo = p < 50;
          const cardColor = acima ? "#00D68F" : baixo ? ENTERPRISE_PURPLE : "#FFB300";
          const feedback = feedbacks[v.id];
          const isLoading = loading[v.id];

          return (
            <View key={v.id} style={[S.card, { backgroundColor: colors.card, borderColor: cardColor + "40" }]}>
              <View style={S.cardHeader}>
                <View style={[S.avatar, { backgroundColor: v.avatarColor }]}>
                  <Text style={S.avatarText}>{initials(v.nome)}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[S.nome, { color: colors.text }]}>{v.nome}</Text>
                  <Text style={[S.segmento, { color: colors.mutedForeground }]}>{v.segmento}</Text>
                </View>
                <View style={[S.pctBadge, { backgroundColor: cardColor + "22" }]}>
                  <Text style={[S.pctText, { color: cardColor }]}>{p}%</Text>
                </View>
              </View>

              <View style={S.metaRow}>
                <Text style={[S.metaText, { color: colors.mutedForeground }]}>
                  {fmt(v.realizado)} de {fmt(v.meta)}
                </Text>
                {acima && <Text style={S.acimaCelebra}>🎉 Meta batida!</Text>}
              </View>

              <View style={[S.statusBanner, { backgroundColor: cardColor + "14" }]}>
                <Text style={[S.statusText, { color: cardColor }]}>
                  {acima
                    ? `🎉 ${v.nome} bateu ${p}% da meta! A JADE quer parabenizar 💜`
                    : baixo
                    ? `${v.nome} está em ${p}% da meta. A JADE tem ideias pra ajudar 💜`
                    : `${v.nome} está em bom caminho (${p}%). A JADE tem dicas para acelerar.`}
                </Text>
              </View>

              {feedback ? (
                <View style={[S.feedbackBox, { backgroundColor: ENTERPRISE_PURPLE + "0C", borderColor: ENTERPRISE_PURPLE + "30" }]}>
                  <View style={S.feedbackHeaderRow}>
                    <MaterialCommunityIcons name="robot" size={16} color={ENTERPRISE_PURPLE} />
                    <Text style={[S.feedbackLabel, { color: ENTERPRISE_PURPLE }]}>Mensagem da JADE para {v.nome}</Text>
                  </View>
                  <Text style={[S.feedbackText, { color: colors.text }]}>{feedback}</Text>
                </View>
              ) : (
                <TouchableOpacity
                  style={[S.feedbackBtn, { borderColor: cardColor + "60", backgroundColor: cardColor + "14" }, isLoading && { opacity: 0.7 }]}
                  onPress={() => gerarFeedback(v)}
                  disabled={isLoading}
                  activeOpacity={0.85}
                >
                  {isLoading
                    ? <ActivityIndicator color={cardColor} size="small" />
                    : <><MaterialCommunityIcons name="robot" size={16} color={cardColor} /><Text style={[S.feedbackBtnText, { color: cardColor }]}>Ver feedback da JADE →</Text></>}
                </TouchableOpacity>
              )}
            </View>
          );
        })}
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
  jadeBanner: { flexDirection: "row", alignItems: "flex-start", gap: 12, margin: 16, padding: 14, borderRadius: 14, borderWidth: 1 },
  jadeBannerText: { flex: 1, fontSize: 13, fontFamily: "SpaceGrotesk_400Regular", lineHeight: 20 },
  sectionLabel: { fontSize: 11, fontFamily: "SpaceGrotesk_600SemiBold", letterSpacing: 1, marginHorizontal: 20, marginBottom: 12 },
  card: { marginHorizontal: 16, marginBottom: 12, padding: 16, borderRadius: 18, borderWidth: 1.5, gap: 12 },
  cardHeader: { flexDirection: "row", alignItems: "center", gap: 12 },
  avatar: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  avatarText: { color: "#fff", fontSize: 15, fontFamily: "SpaceGrotesk_700Bold" },
  nome: { fontSize: 16, fontFamily: "SpaceGrotesk_700Bold" },
  segmento: { fontSize: 12, fontFamily: "SpaceGrotesk_400Regular", marginTop: 2 },
  pctBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  pctText: { fontSize: 18, fontFamily: "SpaceGrotesk_700Bold" },
  metaRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  metaText: { fontSize: 13, fontFamily: "SpaceGrotesk_400Regular" },
  acimaCelebra: { fontSize: 13, fontFamily: "SpaceGrotesk_600SemiBold" },
  statusBanner: { borderRadius: 10, padding: 12 },
  statusText: { fontSize: 13, fontFamily: "SpaceGrotesk_500Medium", lineHeight: 19 },
  feedbackBox: { borderRadius: 12, borderWidth: 1, overflow: "hidden" },
  feedbackHeaderRow: { flexDirection: "row", alignItems: "center", gap: 8, padding: 12, paddingBottom: 8 },
  feedbackLabel: { fontSize: 12, fontFamily: "SpaceGrotesk_600SemiBold" },
  feedbackText: { fontSize: 14, fontFamily: "SpaceGrotesk_400Regular", lineHeight: 22, padding: 12, paddingTop: 4 },
  feedbackBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 12, borderRadius: 12, borderWidth: 1 },
  feedbackBtnText: { fontSize: 14, fontFamily: "SpaceGrotesk_600SemiBold" },
});
