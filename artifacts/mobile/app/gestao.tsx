import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import {
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

interface HubCard {
  icon: string;
  iconLib: "feather" | "mci";
  title: string;
  sub: string;
  route: string;
  color: string;
  accent: string;
}

const HUB_CARDS: HubCard[] = [
  {
    icon: "users",
    iconLib: "feather",
    title: "Meu Time",
    sub: "Vendedores e metas individuais",
    route: "/meutime",
    color: "#6C63FF",
    accent: "#6C63FF18",
  },
  {
    icon: "target",
    iconLib: "feather",
    title: "Metas e Pipeline",
    sub: "Consolidado e forecast do time",
    route: "/metas",
    color: "#FF0080",
    accent: "#FF008018",
  },
  {
    icon: "briefcase",
    iconLib: "feather",
    title: "Carteira de Clientes",
    sub: "Farmer, hunter e pós-venda",
    route: "/carteira",
    color: "#00D68F",
    accent: "#00D68F18",
  },
  {
    icon: "message-circle",
    iconLib: "feather",
    title: "Feedback da JADE",
    sub: "Mentoria empática por vendedor",
    route: "/feedbackjade",
    color: ENTERPRISE_PURPLE,
    accent: "#8400FF18",
  },
  {
    icon: "bar-chart-2",
    iconLib: "feather",
    title: "Relatório do Gestor",
    sub: "Consolidado para diretoria",
    route: "/relatoriogestor",
    color: "#FFB300",
    accent: "#FFB30018",
  },
  {
    icon: "trending-up",
    iconLib: "feather",
    title: "Análise Estratégica",
    sub: "Insights da JADE para o time",
    route: "/feedbackjade",
    color: "#4ECDC4",
    accent: "#4ECDC418",
  },
];

export default function GestaoScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  return (
    <View style={[S.root, { backgroundColor: colors.background }]}>
      <View style={[S.header, { paddingTop: topPad, borderBottomColor: colors.border }]}>
        <TouchableOpacity
          style={[S.backBtn, { backgroundColor: colors.surface }]}
          onPress={() => router.back()}
          activeOpacity={0.8}
        >
          <Feather name="arrow-left" size={20} color={colors.text} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={[S.headerTitle, { color: colors.text }]}>Gestão Comercial</Text>
          <Text style={[S.headerSub, { color: colors.mutedForeground }]}>Enterprise · Visão do gestor</Text>
        </View>
        <View style={[S.enterpriseBadge, { backgroundColor: ENTERPRISE_PURPLE + "22" }]}>
          <Text style={[S.enterpriseBadgeText, { color: ENTERPRISE_PURPLE }]}>Enterprise</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        <View style={[S.heroBanner, { backgroundColor: ENTERPRISE_PURPLE + "14", borderColor: ENTERPRISE_PURPLE + "30" }]}>
          <View style={[S.heroIconWrap, { backgroundColor: ENTERPRISE_PURPLE + "22" }]}>
            <MaterialCommunityIcons name="crown" size={28} color={ENTERPRISE_PURPLE} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[S.heroTitle, { color: colors.text }]}>Gestão Comercial Completa</Text>
            <Text style={[S.heroSub, { color: colors.mutedForeground }]}>
              Gerencie seu time, carteira de clientes e métricas com IA integrada.
            </Text>
          </View>
        </View>

        <Text style={[S.sectionLabel, { color: colors.mutedForeground }]}>MÓDULOS</Text>

        <View style={S.grid}>
          {HUB_CARDS.map((card, i) => (
            <TouchableOpacity
              key={i}
              style={[S.card, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => router.push(card.route as any)}
              activeOpacity={0.85}
            >
              <View style={[S.cardIcon, { backgroundColor: card.accent }]}>
                <Feather name={card.icon as any} size={24} color={card.color} />
              </View>
              <Text style={[S.cardTitle, { color: colors.text }]}>{card.title}</Text>
              <Text style={[S.cardSub, { color: colors.mutedForeground }]}>{card.sub}</Text>
              <View style={S.cardArrow}>
                <Feather name="arrow-right" size={14} color={card.color} />
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <View style={[S.tipBox, { backgroundColor: colors.card, borderColor: ENTERPRISE_PURPLE + "30" }]}>
          <MaterialCommunityIcons name="robot" size={18} color={ENTERPRISE_PURPLE} />
          <Text style={[S.tipText, { color: colors.mutedForeground }]}>
            A JADE usa os dados do seu time para gerar feedback empático, analisar pipeline e sugerir estratégias personalizadas para cada vendedor.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const S = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: "row", alignItems: "center", gap: 12,
    paddingHorizontal: 20, paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 18, fontFamily: "SpaceGrotesk_700Bold" },
  headerSub: { fontSize: 12, fontFamily: "SpaceGrotesk_400Regular", marginTop: 2 },
  enterpriseBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  enterpriseBadgeText: { fontSize: 11, fontFamily: "SpaceGrotesk_700Bold" },
  heroBanner: {
    flexDirection: "row", alignItems: "center", gap: 14,
    margin: 16, padding: 16, borderRadius: 16, borderWidth: 1,
  },
  heroIconWrap: { width: 52, height: 52, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  heroTitle: { fontSize: 16, fontFamily: "SpaceGrotesk_700Bold", marginBottom: 4 },
  heroSub: { fontSize: 13, fontFamily: "SpaceGrotesk_400Regular", lineHeight: 19 },
  sectionLabel: {
    fontSize: 11, fontFamily: "SpaceGrotesk_600SemiBold",
    letterSpacing: 1, marginHorizontal: 20, marginBottom: 12,
  },
  grid: { flexDirection: "row", flexWrap: "wrap", paddingHorizontal: 12, gap: 10 },
  card: {
    width: "47%", flexGrow: 1,
    borderRadius: 16, borderWidth: 1,
    padding: 16, gap: 6, position: "relative",
  },
  cardIcon: { width: 48, height: 48, borderRadius: 14, alignItems: "center", justifyContent: "center", marginBottom: 4 },
  cardTitle: { fontSize: 15, fontFamily: "SpaceGrotesk_700Bold" },
  cardSub: { fontSize: 12, fontFamily: "SpaceGrotesk_400Regular", lineHeight: 17 },
  cardArrow: { marginTop: 8, alignSelf: "flex-end" },
  tipBox: {
    flexDirection: "row", alignItems: "flex-start", gap: 12,
    margin: 16, padding: 14, borderRadius: 14, borderWidth: 1,
  },
  tipText: { flex: 1, fontSize: 13, fontFamily: "SpaceGrotesk_400Regular", lineHeight: 20 },
});
