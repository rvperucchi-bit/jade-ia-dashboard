import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import {
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width: SW } = Dimensions.get("window");
const COLORS = {
  bg: "#0A0A0F",
  card: "#111118",
  border: "#1E1E2E",
  text: "#FFFFFF",
  muted: "#7777AA",
  primary: "#FF0080",
  surface: "#16161F",
  success: "#00D68F",
};

const USED = 620;
const LIMIT = 1000;
const PCT = USED / LIMIT;

const FEATURES = [
  { label: "Leads / mês", jade: "Ilimitado", concorrente: "500" },
  { label: "IA generativa", jade: "Gemini 2.5 Flash", concorrente: "Básica" },
  { label: "Scanner Radar", jade: "✓", concorrente: "✗" },
  { label: "Marketing IA", jade: "✓", concorrente: "✗" },
  { label: "Conversas simultâneas", jade: "50", concorrente: "5" },
  { label: "Integração WhatsApp", jade: "Em breve", concorrente: "Não" },
  { label: "Suporte", jade: "Prioritário", concorrente: "E-mail" },
  { label: "Treinamento personalizado", jade: "✓", concorrente: "✗" },
];

export default function PlanoScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={[S.root, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={S.header}>
        <TouchableOpacity onPress={() => router.back()} style={S.backBtn} activeOpacity={0.7}>
          <Feather name="arrow-left" size={22} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={S.headerTitle}>Meu Plano</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={[S.scroll, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Plano atual */}
        <View style={S.planCard}>
          <View style={S.planHeader}>
            <View>
              <Text style={S.planBadge}>✦ PLANO PRO</Text>
              <Text style={S.planPrice}>R$247<Text style={S.planPriceSub}>/mês</Text></Text>
            </View>
            <View style={S.activeChip}>
              <View style={S.activeDot} />
              <Text style={S.activeText}>Ativo</Text>
            </View>
          </View>
          <Text style={S.planRenewal}>Próxima renovação: 20 de julho de 2026</Text>
        </View>

        {/* Créditos de IA */}
        <View style={S.section}>
          <Text style={S.sectionTitle}>CRÉDITOS DE IA</Text>
          <View style={S.card}>
            <View style={S.creditsRow}>
              <Text style={S.creditsLabel}>Usados este mês</Text>
              <Text style={S.creditsValue}>{USED.toLocaleString("pt-BR")} / {LIMIT.toLocaleString("pt-BR")}</Text>
            </View>
            <View style={S.barTrack}>
              <View style={[S.barFill, { width: `${PCT * 100}%` as any }]} />
            </View>
            <Text style={S.creditsHint}>{Math.round((1 - PCT) * LIMIT)} créditos restantes · renova em 30 dias</Text>
          </View>
        </View>

        {/* Comparativo */}
        <View style={S.section}>
          <Text style={S.sectionTitle}>JADE IA vs CONCORRENTES</Text>
          <View style={S.card}>
            {/* Cabeçalho da tabela */}
            <View style={[S.tableRow, S.tableHeader]}>
              <Text style={[S.tableCell, S.tableCellLeft, S.tableHeaderText]}>Recurso</Text>
              <Text style={[S.tableCell, S.tableCellCenter, S.tableHeaderAccent]}>JADE IA</Text>
              <Text style={[S.tableCell, S.tableCellCenter, S.tableHeaderText]}>Concorrente</Text>
            </View>
            {FEATURES.map((f, i) => (
              <React.Fragment key={i}>
                <View style={[S.tableRow, i % 2 === 0 && S.tableRowAlt]}>
                  <Text style={[S.tableCell, S.tableCellLeft, S.tableCellText]}>{f.label}</Text>
                  <Text style={[S.tableCell, S.tableCellCenter, S.tableCellJade]}>
                    {f.jade}
                  </Text>
                  <Text style={[S.tableCell, S.tableCellCenter, S.tableCellCompetitor]}>
                    {f.concorrente}
                  </Text>
                </View>
              </React.Fragment>
            ))}
          </View>
        </View>

        {/* Upgrade */}
        <View style={S.upgradeCard}>
          <Text style={S.upgradeTitle}>🚀 JADE Enterprise</Text>
          <Text style={S.upgradeSub}>Leads ilimitados, múltiplos usuários e automação completa de vendas.</Text>
          <TouchableOpacity style={S.upgradeBtn} activeOpacity={0.85}>
            <Text style={S.upgradeBtnText}>Falar com comercial</Text>
            <Feather name="arrow-right" size={16} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Cancelar plano */}
        <TouchableOpacity style={S.cancelBtn} activeOpacity={0.7}>
          <Text style={S.cancelText}>Cancelar assinatura</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const S = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
  },
  backBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 17, fontFamily: "SpaceGrotesk_700Bold", color: COLORS.text },
  scroll: { paddingHorizontal: 20, paddingTop: 24 },

  planCard: {
    backgroundColor: COLORS.primary + "18",
    borderWidth: 1,
    borderColor: COLORS.primary + "55",
    borderRadius: 18,
    padding: 20,
    marginBottom: 24,
  },
  planHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 },
  planBadge: { fontSize: 12, fontFamily: "SpaceGrotesk_700Bold", color: COLORS.primary, letterSpacing: 1 },
  planPrice: { fontSize: 36, fontFamily: "SpaceGrotesk_700Bold", color: COLORS.text, marginTop: 4 },
  planPriceSub: { fontSize: 16, fontFamily: "SpaceGrotesk_400Regular", color: COLORS.muted },
  activeChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: COLORS.success + "22",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  activeDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: COLORS.success },
  activeText: { fontSize: 12, fontFamily: "SpaceGrotesk_600SemiBold", color: COLORS.success },
  planRenewal: { fontSize: 13, fontFamily: "SpaceGrotesk_400Regular", color: COLORS.muted },

  section: { marginBottom: 24 },
  sectionTitle: {
    fontSize: 11,
    fontFamily: "SpaceGrotesk_600SemiBold",
    color: COLORS.muted,
    letterSpacing: 1,
    marginBottom: 10,
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: "hidden",
  },

  creditsRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 16, paddingBottom: 10 },
  creditsLabel: { fontSize: 14, fontFamily: "SpaceGrotesk_500Medium", color: COLORS.text },
  creditsValue: { fontSize: 14, fontFamily: "SpaceGrotesk_700Bold", color: COLORS.primary },
  barTrack: { height: 8, backgroundColor: COLORS.surface, marginHorizontal: 16, borderRadius: 4 },
  barFill: { height: 8, backgroundColor: COLORS.primary, borderRadius: 4 },
  creditsHint: { fontSize: 12, fontFamily: "SpaceGrotesk_400Regular", color: COLORS.muted, padding: 12, paddingTop: 8 },

  tableRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 14, paddingVertical: 12 },
  tableRowAlt: { backgroundColor: COLORS.surface + "55" },
  tableHeader: { backgroundColor: COLORS.surface, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: COLORS.border },
  tableHeaderText: { fontSize: 11, fontFamily: "SpaceGrotesk_600SemiBold", color: COLORS.muted, textTransform: "uppercase", letterSpacing: 0.5 },
  tableHeaderAccent: { fontSize: 11, fontFamily: "SpaceGrotesk_700Bold", color: COLORS.primary, textTransform: "uppercase", letterSpacing: 0.5 },
  tableCell: { flex: 1 },
  tableCellLeft: { flex: 1.5 },
  tableCellCenter: { textAlign: "center" },
  tableCellText: { fontSize: 13, fontFamily: "SpaceGrotesk_400Regular", color: COLORS.text },
  tableCellJade: { fontSize: 13, fontFamily: "SpaceGrotesk_600SemiBold", color: COLORS.primary },
  tableCellCompetitor: { fontSize: 13, fontFamily: "SpaceGrotesk_400Regular", color: COLORS.muted },

  upgradeCard: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 18,
    padding: 20,
    marginBottom: 20,
    gap: 10,
  },
  upgradeTitle: { fontSize: 18, fontFamily: "SpaceGrotesk_700Bold", color: COLORS.text },
  upgradeSub: { fontSize: 14, fontFamily: "SpaceGrotesk_400Regular", color: COLORS.muted, lineHeight: 20 },
  upgradeBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    alignSelf: "flex-start",
    marginTop: 4,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  upgradeBtnText: { fontSize: 14, fontFamily: "SpaceGrotesk_700Bold", color: "#fff" },

  cancelBtn: { alignItems: "center", paddingVertical: 12 },
  cancelText: { fontSize: 14, fontFamily: "SpaceGrotesk_400Regular", color: COLORS.muted },
});
