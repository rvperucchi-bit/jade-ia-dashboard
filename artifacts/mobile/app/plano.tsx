import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";

const PINK    = "#FF0080";
const SUCCESS = "#00D68F";

const API_BASE =
  Platform.OS === "web"
    ? ""
    : `https://${process.env.EXPO_PUBLIC_DOMAIN ?? ""}`;

const USED  = 620;
const LIMIT = 1000;
const PCT   = USED / LIMIT;

interface Plan {
  id:         string;
  name:       string;
  price:      string;
  period:     string;
  tag?:       string;
  current?:   boolean;
  highlight?: boolean;
  features:   string[];
  credits:    string;
  users:      string;
  canUpgrade?: boolean;
}

const PLANS: Plan[] = [
  {
    id: "start",
    name: "Start",
    price: "R$97",
    period: "/mês",
    features: [
      "Qualificação de leads com IA",
      "Abordagem no WhatsApp",
      "CRM + pipeline básico",
      "Follow-up e reativação",
    ],
    credits: "500 mensagens/mês",
    users: "1 usuário",
    canUpgrade: true,
  },
  {
    id: "pro",
    name: "Pro",
    price: "R$247",
    period: "/mês",
    tag: "SEU PLANO",
    current: true,
    highlight: true,
    features: [
      "Tudo do Start +",
      "Scanner Radar com Google Maps",
      "Roteiro de vendas completo",
      "Laudo executivo de marketing",
      "Briefing pré-reunião",
      "Relatórios diário e semanal",
    ],
    credits: "2.000 mensagens/mês",
    users: "3 usuários",
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: "R$697",
    period: "/mês",
    features: [
      "Tudo do Pro +",
      "Gestão de time comercial",
      "KPIs e metas por executivo",
      "Análise de gaps + recuperação",
      "Relatório mensal de performance",
      "Roleplay de treino de vendas",
    ],
    credits: "5.000 mensagens/mês",
    users: "8 usuários",
    canUpgrade: true,
  },
];

function PlanCard({
  plan, loadingPlano, onUpgrade,
}: {
  plan: Plan; loadingPlano: string | null; onUpgrade: (plano: string) => void;
}) {
  const colors    = useColors();
  const isLoading = loadingPlano === plan.id;

  return (
    <View style={[
      S.planCard,
      { backgroundColor: colors.card, borderColor: colors.border },
      plan.highlight && { borderColor: PINK + "88", backgroundColor: PINK + "08" },
    ]}>
      {plan.tag && (
        <View style={[S.currentBadge, { backgroundColor: PINK }]}>
          <Text style={S.currentBadgeText}>{plan.tag}</Text>
        </View>
      )}

      <View style={S.planCardHeader}>
        <Text style={[S.planName, { color: plan.highlight ? colors.text : colors.mutedForeground }]}>
          {plan.name}
        </Text>
        <View style={S.planPriceRow}>
          <Text style={[S.planPrice, { color: colors.text }]}>{plan.price}</Text>
          <Text style={[S.planPeriod, { color: colors.mutedForeground }]}>{plan.period}</Text>
        </View>
      </View>

      <View style={[S.divider, { backgroundColor: plan.highlight ? PINK + "44" : colors.border }]} />

      <View style={S.featureList}>
        {plan.features.map((f, i) => (
          <View key={i} style={S.featureRow}>
            <Feather name="check" size={14} color={PINK} />
            <Text style={[S.featureText, { color: colors.mutedForeground }]}>{f}</Text>
          </View>
        ))}
      </View>

      <View style={S.planMeta}>
        <View style={[S.metaChip, { backgroundColor: colors.surface }]}>
          <Feather name="zap" size={12} color={colors.mutedForeground} />
          <Text style={[S.metaText, { color: colors.mutedForeground }]}>{plan.credits}</Text>
        </View>
        <View style={[S.metaChip, { backgroundColor: colors.surface }]}>
          <Feather name="users" size={12} color={colors.mutedForeground} />
          <Text style={[S.metaText, { color: colors.mutedForeground }]}>{plan.users}</Text>
        </View>
      </View>

      {plan.canUpgrade && (
        <TouchableOpacity
          style={[S.upgradeBtn, { borderColor: PINK }, isLoading && { opacity: 0.7 }]}
          activeOpacity={0.85}
          onPress={() => onUpgrade(plan.id)}
          disabled={!!loadingPlano}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color={PINK} />
          ) : (
            <>
              <Text style={[S.upgradeBtnText, { color: PINK }]}>
                {plan.id === "start" ? "Fazer downgrade" : "Fazer upgrade"}
              </Text>
              <Feather name="arrow-right" size={14} color={PINK} />
            </>
          )}
        </TouchableOpacity>
      )}
    </View>
  );
}

export default function PlanoScreen() {
  const router  = useRouter();
  const insets  = useSafeAreaInsets();
  const colors  = useColors();
  const [loadingPlano, setLoadingPlano] = useState<string | null>(null);

  const topPad = Platform.OS === "web" ? 24 : insets.top + 4;
  const botPad = Platform.OS === "web" ? 40 : insets.bottom + 32;

  const fazerUpgrade = async (plano: string) => {
    setLoadingPlano(plano);
    try {
      const res = await fetch(`${API_BASE}/api/stripe/create-checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plano, email: "contato@jadeia.com.br" }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as any).error ?? "Erro desconhecido");
      }

      const data = await res.json() as { url?: string };

      if (data.url) {
        if (Platform.OS === "web") {
          await Linking.openURL(data.url);
        } else {
          await WebBrowser.openBrowserAsync(data.url, {
            toolbarColor: colors.background,
            controlsColor: PINK,
            showTitle: false,
            enableBarCollapsing: true,
          });
        }
      } else {
        Alert.alert("Erro", "Link de checkout não retornado. Tente novamente.");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro ao iniciar o checkout.";
      Alert.alert("Erro", msg + "\n\nTente novamente ou entre em contato: comercial@jadeia.com.br");
    } finally {
      setLoadingPlano(null);
    }
  };

  return (
    <View style={[S.root, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[S.header, { paddingTop: topPad }]}>
        <TouchableOpacity onPress={() => router.back()} style={S.backBtn} activeOpacity={0.7}>
          <Feather name="chevron-left" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={[S.headerTitle, { color: colors.text }]}>Meu Plano</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        contentContainerStyle={[S.scroll, { paddingBottom: botPad }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Plano atual */}
        <View style={[S.activePlan, { backgroundColor: PINK + "18", borderColor: PINK + "55" }]}>
          <View style={S.activePlanLeft}>
            <Text style={[S.activePlanBadge, { color: PINK }]}>✦ PLANO PRO ATIVO</Text>
            <Text style={[S.activePlanPrice, { color: colors.text }]}>
              R$247<Text style={[S.activePlanSub, { color: colors.mutedForeground }]}>/mês</Text>
            </Text>
            <Text style={[S.activePlanRenewal, { color: colors.mutedForeground }]}>
              Próxima renovação: 20 de julho de 2026
            </Text>
          </View>
          <View style={[S.activeChip, { backgroundColor: SUCCESS + "22" }]}>
            <View style={[S.activeDot, { backgroundColor: SUCCESS }]} />
            <Text style={[S.activeText, { color: SUCCESS }]}>Ativo</Text>
          </View>
        </View>

        {/* Créditos */}
        <View style={S.section}>
          <Text style={[S.sectionTitle, { color: colors.mutedForeground }]}>CRÉDITOS DE IA</Text>
          <View style={[S.creditsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={S.creditsRow}>
              <Text style={[S.creditsLabel, { color: colors.text }]}>Usados este mês</Text>
              <Text style={[S.creditsValue, { color: PINK }]}>
                {USED.toLocaleString("pt-BR")} / {LIMIT.toLocaleString("pt-BR")}
              </Text>
            </View>
            <View style={[S.barTrack, { backgroundColor: colors.surface }]}>
              <View style={[S.barFill, { width: `${PCT * 100}%` as any, backgroundColor: PINK }]} />
            </View>
            <Text style={[S.creditsHint, { color: colors.mutedForeground }]}>
              {Math.round((1 - PCT) * LIMIT)} créditos restantes · renova em 30 dias
            </Text>
          </View>
        </View>

        {/* Planos */}
        <View style={S.section}>
          <Text style={[S.sectionTitle, { color: colors.mutedForeground }]}>PLANOS DISPONÍVEIS</Text>
          {PLANS.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              loadingPlano={loadingPlano}
              onUpgrade={fazerUpgrade}
            />
          ))}
        </View>

        {/* CTA */}
        <TouchableOpacity
          style={[S.upgradeHero, { backgroundColor: PINK, shadowColor: PINK }, !!loadingPlano && { opacity: 0.7 }]}
          activeOpacity={0.85}
          disabled={!!loadingPlano}
          onPress={() => fazerUpgrade("enterprise")}
        >
          {loadingPlano === "enterprise" ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Feather name="zap" size={16} color="#fff" />
              <Text style={S.upgradeHeroText}>Fazer upgrade agora</Text>
              <Feather name="arrow-right" size={16} color="#fff" />
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const S = StyleSheet.create({
  root:   { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingBottom: 16 },
  backBtn:     { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 17, fontFamily: "SpaceGrotesk_700Bold" },
  scroll:      { paddingHorizontal: 16, paddingTop: 20 },

  activePlan:      { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", borderWidth: 1, borderRadius: 18, padding: 20, marginBottom: 28 },
  activePlanLeft:  { gap: 4 },
  activePlanBadge: { fontSize: 11, fontFamily: "SpaceGrotesk_700Bold", letterSpacing: 1 },
  activePlanPrice: { fontSize: 34, fontFamily: "SpaceGrotesk_700Bold", marginTop: 4 },
  activePlanSub:   { fontSize: 15, fontFamily: "SpaceGrotesk_400Regular" },
  activePlanRenewal:{ fontSize: 13, fontFamily: "SpaceGrotesk_400Regular", marginTop: 4 },
  activeChip:      { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  activeDot:       { width: 7, height: 7, borderRadius: 4 },
  activeText:      { fontSize: 12, fontFamily: "SpaceGrotesk_600SemiBold" },

  section:      { marginBottom: 24 },
  sectionTitle: { fontSize: 11, fontFamily: "SpaceGrotesk_600SemiBold", letterSpacing: 0.8, marginBottom: 14 },

  creditsCard:  { borderRadius: 14, borderWidth: 1 },
  creditsRow:   { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 16, paddingBottom: 10 },
  creditsLabel: { fontSize: 14, fontFamily: "SpaceGrotesk_500Medium" },
  creditsValue: { fontSize: 14, fontFamily: "SpaceGrotesk_700Bold" },
  barTrack:     { height: 8, marginHorizontal: 16, borderRadius: 4 },
  barFill:      { height: 8, borderRadius: 4 },
  creditsHint:  { fontSize: 12, fontFamily: "SpaceGrotesk_400Regular", padding: 12, paddingTop: 8 },

  planCard:          { borderRadius: 16, borderWidth: 1, padding: 20, marginBottom: 12, position: "relative" },
  currentBadge:      { position: "absolute", top: -1, right: 20, paddingHorizontal: 12, paddingVertical: 5, borderBottomLeftRadius: 10, borderBottomRightRadius: 10 },
  currentBadgeText:  { fontSize: 10, fontFamily: "SpaceGrotesk_700Bold", color: "#fff", letterSpacing: 1 },
  planCardHeader:    { marginBottom: 16 },
  planName:          { fontSize: 20, fontFamily: "SpaceGrotesk_700Bold", marginBottom: 4 },
  planPriceRow:      { flexDirection: "row", alignItems: "flex-end", gap: 2 },
  planPrice:         { fontSize: 30, fontFamily: "SpaceGrotesk_700Bold" },
  planPeriod:        { fontSize: 14, fontFamily: "SpaceGrotesk_400Regular", marginBottom: 5 },
  divider:           { height: StyleSheet.hairlineWidth, marginBottom: 16 },
  featureList:       { gap: 10, marginBottom: 16 },
  featureRow:        { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  featureText:       { flex: 1, fontSize: 14, fontFamily: "SpaceGrotesk_400Regular", lineHeight: 20 },
  planMeta:          { flexDirection: "row", gap: 10, flexWrap: "wrap", marginBottom: 4 },
  metaChip:          { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  metaText:          { fontSize: 12, fontFamily: "SpaceGrotesk_500Medium" },
  upgradeBtn:        { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderWidth: 1.5, borderRadius: 12, height: 44, marginTop: 14 },
  upgradeBtnText:    { fontSize: 14, fontFamily: "SpaceGrotesk_700Bold" },

  upgradeHero: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    borderRadius: 14, height: 52, marginBottom: 28,
    shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 18, elevation: 10,
  },
  upgradeHeroText: { fontSize: 15, fontFamily: "SpaceGrotesk_700Bold", color: "#fff" },
});
