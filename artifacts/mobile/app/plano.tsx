import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const C = {
  bg: "#0A0A0F",
  card: "#111118",
  border: "#1E1E2E",
  text: "#FFFFFF",
  muted: "#7777AA",
  sub: "#AAAACC",
  primary: "#FF0080",
  surface: "#16161F",
  success: "#00D68F",
  warning: "#FFB300",
};

const USED = 620;
const LIMIT = 1000;
const PCT = USED / LIMIT;

interface Plan {
  id: string;
  name: string;
  price: string;
  period: string;
  tag?: string;
  current?: boolean;
  highlight?: boolean;
  features: string[];
  credits: string;
  users: string;
  showUpgrade?: boolean;
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
    credits: "300 créditos/mês",
    users: "1 usuário",
    showUpgrade: true,
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
    credits: "1.000 créditos/mês",
    users: "5 usuários",
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
    credits: "Créditos ilimitados",
    users: "15 usuários",
  },
];

function PlanCard({ plan }: { plan: Plan }) {
  return (
    <View
      style={[
        S.planCard,
        plan.highlight && S.planCardHighlight,
      ]}
    >
      {plan.tag && (
        <View style={S.currentBadge}>
          <Text style={S.currentBadgeText}>{plan.tag}</Text>
        </View>
      )}

      <View style={S.planCardHeader}>
        <Text style={[S.planName, plan.highlight && S.planNameHighlight]}>
          {plan.name}
        </Text>
        <View style={S.planPriceRow}>
          <Text style={S.planPrice}>{plan.price}</Text>
          <Text style={S.planPeriod}>{plan.period}</Text>
        </View>
      </View>

      <View style={[S.divider, plan.highlight && S.dividerHighlight]} />

      <View style={S.featureList}>
        {plan.features.map((f, i) => (
          <View key={i} style={S.featureRow}>
            <Feather
              name="check"
              size={14}
              color={plan.highlight ? C.primary : C.success}
            />
            <Text style={S.featureText}>{f}</Text>
          </View>
        ))}
      </View>

      <View style={S.planMeta}>
        <View style={S.metaChip}>
          <Feather name="zap" size={12} color={C.muted} />
          <Text style={S.metaText}>{plan.credits}</Text>
        </View>
        <View style={S.metaChip}>
          <Feather name="users" size={12} color={C.muted} />
          <Text style={S.metaText}>{plan.users}</Text>
        </View>
      </View>

      {plan.showUpgrade && (
        <TouchableOpacity style={S.upgradeBtn} activeOpacity={0.85}>
          <Text style={S.upgradeBtnText}>Fazer upgrade</Text>
          <Feather name="arrow-right" size={14} color={C.primary} />
        </TouchableOpacity>
      )}
    </View>
  );
}

export default function PlanoScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={[S.root, { paddingTop: insets.top }]}>
      <View style={S.header}>
        <TouchableOpacity onPress={() => router.back()} style={S.backBtn} activeOpacity={0.7}>
          <Feather name="arrow-left" size={22} color={C.text} />
        </TouchableOpacity>
        <Text style={S.headerTitle}>Meu Plano</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={[S.scroll, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Plano atual em destaque */}
        <View style={S.activePlan}>
          <View style={S.activePlanLeft}>
            <Text style={S.activePlanBadge}>✦ PLANO PRO ATIVO</Text>
            <Text style={S.activePlanPrice}>R$247<Text style={S.activePlanSub}>/mês</Text></Text>
            <Text style={S.activePlanRenewal}>Próxima renovação: 20 de julho de 2026</Text>
          </View>
          <View style={S.activeChip}>
            <View style={S.activeDot} />
            <Text style={S.activeText}>Ativo</Text>
          </View>
        </View>

        {/* Créditos */}
        <View style={S.section}>
          <Text style={S.sectionTitle}>CRÉDITOS DE IA</Text>
          <View style={S.creditsCard}>
            <View style={S.creditsRow}>
              <Text style={S.creditsLabel}>Usados este mês</Text>
              <Text style={S.creditsValue}>
                {USED.toLocaleString("pt-BR")} / {LIMIT.toLocaleString("pt-BR")}
              </Text>
            </View>
            <View style={S.barTrack}>
              <View style={[S.barFill, { width: `${PCT * 100}%` as any }]} />
            </View>
            <Text style={S.creditsHint}>
              {Math.round((1 - PCT) * LIMIT)} créditos restantes · renova em 30 dias
            </Text>
          </View>
        </View>

        {/* Planos */}
        <View style={S.section}>
          <Text style={S.sectionTitle}>PLANOS DISPONÍVEIS</Text>
          {PLANS.map((plan) => (
            <PlanCard key={plan.id} plan={plan} />
          ))}
        </View>

        <TouchableOpacity
          style={S.upgradeHero}
          activeOpacity={0.85}
          onPress={() => {}}
        >
          <Feather name="zap" size={16} color="#fff" />
          <Text style={S.upgradeHeroText}>Fazer upgrade agora</Text>
          <Feather name="arrow-right" size={16} color="#fff" />
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const S = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: C.border,
  },
  backBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 17, fontFamily: "SpaceGrotesk_700Bold", color: C.text },
  scroll: { paddingHorizontal: 20, paddingTop: 24 },

  activePlan: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    backgroundColor: C.primary + "18",
    borderWidth: 1,
    borderColor: C.primary + "55",
    borderRadius: 18,
    padding: 20,
    marginBottom: 28,
  },
  activePlanLeft: { gap: 4 },
  activePlanBadge: {
    fontSize: 11,
    fontFamily: "SpaceGrotesk_700Bold",
    color: C.primary,
    letterSpacing: 1,
  },
  activePlanPrice: {
    fontSize: 36,
    fontFamily: "SpaceGrotesk_700Bold",
    color: C.text,
    marginTop: 4,
  },
  activePlanSub: {
    fontSize: 16,
    fontFamily: "SpaceGrotesk_400Regular",
    color: C.muted,
  },
  activePlanRenewal: {
    fontSize: 13,
    fontFamily: "SpaceGrotesk_400Regular",
    color: C.muted,
    marginTop: 4,
  },
  activeChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: C.success + "22",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  activeDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: C.success },
  activeText: { fontSize: 12, fontFamily: "SpaceGrotesk_600SemiBold", color: C.success },

  section: { marginBottom: 24 },
  sectionTitle: {
    fontSize: 11,
    fontFamily: "SpaceGrotesk_600SemiBold",
    color: C.muted,
    letterSpacing: 1,
    marginBottom: 14,
  },

  creditsCard: {
    backgroundColor: C.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.border,
  },
  creditsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    paddingBottom: 10,
  },
  creditsLabel: { fontSize: 14, fontFamily: "SpaceGrotesk_500Medium", color: C.text },
  creditsValue: { fontSize: 14, fontFamily: "SpaceGrotesk_700Bold", color: C.primary },
  barTrack: { height: 8, backgroundColor: C.surface, marginHorizontal: 16, borderRadius: 4 },
  barFill: { height: 8, backgroundColor: C.primary, borderRadius: 4 },
  creditsHint: {
    fontSize: 12,
    fontFamily: "SpaceGrotesk_400Regular",
    color: C.muted,
    padding: 12,
    paddingTop: 8,
  },

  // ── Plan cards ──
  planCard: {
    backgroundColor: C.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: C.border,
    padding: 20,
    marginBottom: 14,
    gap: 0,
    position: "relative",
  },
  planCardHighlight: {
    borderColor: C.primary + "88",
    backgroundColor: C.primary + "08",
  },
  currentBadge: {
    position: "absolute",
    top: -1,
    right: 20,
    backgroundColor: C.primary,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
  },
  currentBadgeText: {
    fontSize: 10,
    fontFamily: "SpaceGrotesk_700Bold",
    color: "#fff",
    letterSpacing: 1,
  },
  planCardHeader: { marginBottom: 16 },
  planName: {
    fontSize: 22,
    fontFamily: "SpaceGrotesk_700Bold",
    color: C.sub,
    marginBottom: 4,
  },
  planNameHighlight: { color: C.text },
  planPriceRow: { flexDirection: "row", alignItems: "flex-end", gap: 2 },
  planPrice: { fontSize: 32, fontFamily: "SpaceGrotesk_700Bold", color: C.text },
  planPeriod: {
    fontSize: 15,
    fontFamily: "SpaceGrotesk_400Regular",
    color: C.muted,
    marginBottom: 5,
  },

  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: C.border,
    marginBottom: 16,
  },
  dividerHighlight: { backgroundColor: C.primary + "44" },

  featureList: { gap: 10, marginBottom: 16 },
  featureRow: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  featureText: {
    flex: 1,
    fontSize: 14,
    fontFamily: "SpaceGrotesk_400Regular",
    color: C.sub,
    lineHeight: 20,
  },

  planMeta: {
    flexDirection: "row",
    gap: 10,
    flexWrap: "wrap",
    marginBottom: 4,
  },
  metaChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: C.surface,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  metaText: {
    fontSize: 12,
    fontFamily: "SpaceGrotesk_500Medium",
    color: C.muted,
  },

  upgradeBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1.5,
    borderColor: C.primary,
    borderRadius: 12,
    height: 44,
    marginTop: 14,
  },
  upgradeBtnText: {
    fontSize: 14,
    fontFamily: "SpaceGrotesk_700Bold",
    color: C.primary,
  },

  upgradeHero: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: C.primary,
    borderRadius: 14,
    height: 52,
    marginBottom: 28,
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 18,
    elevation: 10,
  },
  upgradeHeroText: {
    fontSize: 16,
    fontFamily: "SpaceGrotesk_700Bold",
    color: "#fff",
  },
});
