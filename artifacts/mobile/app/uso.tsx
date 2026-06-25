import React from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

import { useColors } from "@/hooks/useColors";
import { usePlan } from "@/context/PlanContext";
import { useCredits } from "@/context/CreditsContext";
import { useRadarSearches } from "@/hooks/useRadarSearches";

const PINK   = "#FF0080";
const PURPLE = "#8400FF";

function UsageBar({ pct, color }: { pct: number; color: string }) {
  return (
    <View style={U.barTrack}>
      <View style={[U.barFill, { width: `${Math.min(pct, 100)}%` as any, backgroundColor: color }]} />
    </View>
  );
}

export default function UsoScreen() {
  const colors  = useColors();
  const insets  = useSafeAreaInsets();
  const router  = useRouter();
  const { userPlan } = usePlan();
  const credits = useCredits();
  const radar   = useRadarSearches();

  const planLabel = userPlan === "enterprise" ? "Enterprise" : userPlan === "pro" ? "Pro" : "Start";
  const planColor = userPlan === "enterprise" ? "#8400FF" : userPlan === "pro" ? PURPLE : PINK;

  const MONTHS = ["janeiro","fevereiro","março","abril","maio","junho","julho","agosto","setembro","outubro","novembro","dezembro"];
  const nxt = new Date(); nxt.setMonth(nxt.getMonth() + 1);
  const renewalStr = `12 de ${MONTHS[nxt.getMonth()]}`;

  const msgPct    = credits.total > 0 ? Math.round((credits.remaining / credits.total) * 100) : 0;
  const radarPct  = radar.total > 0 ? Math.round((radar.remaining / radar.total) * 100) : 0;
  const msgBar    = credits.warnLevel === "empty" ? "#CC2244" : credits.warnLevel === "warn" ? "#FF8800" : "#FF0080";
  const radarWarn = radar.remaining === 0 ? "empty" : radar.remaining < radar.total * 0.2 ? "warn" : "ok";
  const radarBar  = radarWarn === "empty" ? "#CC2244" : radarWarn === "warn" ? "#FF8800" : "#8400FF";

  const topPad = Platform.OS === "web" ? 24 : insets.top + 4;
  const botPad = Platform.OS === "web" ? 40 : insets.bottom + 32;

  return (
    <ScrollView
      style={[U.root, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingBottom: botPad }}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={[U.header, { paddingTop: topPad }]}>
        <TouchableOpacity onPress={() => router.back()} style={U.backBtn} activeOpacity={0.7}>
          <Feather name="chevron-left" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={[U.headerTitle, { color: colors.text }]}>Uso</Text>
        <View style={{ width: 36 }} />
      </View>

      <View style={{ paddingHorizontal: 16, gap: 12 }}>
        {/* Plan badge */}
        <View style={[U.planCard, { backgroundColor: planColor + "14", borderColor: planColor + "40" }]}>
          <MaterialCommunityIcons name="crown" size={16} color={planColor} />
          <View style={{ flex: 1 }}>
            <Text style={[U.planLabel, { color: planColor }]}>Plano {planLabel}</Text>
            <Text style={[U.planSub, { color: colors.mutedForeground }]}>Próxima renovação: {renewalStr}</Text>
          </View>
          <TouchableOpacity
            style={[U.manageBtn, { borderColor: planColor + "44" }]}
            onPress={() => router.push("/plano" as any)}
            activeOpacity={0.8}
          >
            <Text style={[U.manageBtnText, { color: planColor }]}>Gerenciar</Text>
          </TouchableOpacity>
        </View>

        {/* Messages */}
        <View style={[U.metricCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={U.metricHead}>
            <View style={[U.metricIcon, { backgroundColor: PINK + "1A" }]}>
              <Feather name="message-circle" size={16} color={PINK} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[U.metricTitle, { color: colors.text }]}>Mensagens disponíveis</Text>
              <Text style={[U.metricSub, { color: colors.mutedForeground }]}>Conversa com a JADE</Text>
            </View>
            <Text style={[U.metricValue, { color: colors.text }]}>
              {credits.remaining.toLocaleString("pt-BR")}
            </Text>
          </View>
          <UsageBar pct={msgPct} color={msgBar} />
          <View style={U.metricFooter}>
            <Text style={[U.metricCaption, { color: colors.mutedForeground }]}>
              {msgPct}% disponível · {credits.total.toLocaleString("pt-BR")} total
            </Text>
            <TouchableOpacity onPress={() => router.push("/loja?tab=0" as any)} activeOpacity={0.8}>
              <Text style={{ color: PINK, fontSize: 12, fontFamily: "SpaceGrotesk_600SemiBold" }}>+ Adicionar</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Radar searches */}
        <View style={[U.metricCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={U.metricHead}>
            <View style={[U.metricIcon, { backgroundColor: PURPLE + "1A" }]}>
              <Feather name="radio" size={16} color={PURPLE} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[U.metricTitle, { color: colors.text }]}>Buscas Radar disponíveis</Text>
              <Text style={[U.metricSub, { color: colors.mutedForeground }]}>Prospecção de leads</Text>
            </View>
            <Text style={[U.metricValue, { color: colors.text }]}>
              {radar.remaining.toLocaleString("pt-BR")}
            </Text>
          </View>
          <UsageBar pct={radarPct} color={radarBar} />
          <View style={U.metricFooter}>
            <Text style={[U.metricCaption, { color: colors.mutedForeground }]}>
              {radarPct}% disponível · {radar.total.toLocaleString("pt-BR")} total
            </Text>
            <TouchableOpacity onPress={() => router.push("/loja?tab=1" as any)} activeOpacity={0.8}>
              <Text style={{ color: PURPLE, fontSize: 12, fontFamily: "SpaceGrotesk_600SemiBold" }}>+ Adicionar</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Renewal info */}
        <View style={[U.infoCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={U.infoRow}>
            <Feather name="calendar" size={14} color={colors.mutedForeground} />
            <Text style={[U.infoLabel, { color: colors.mutedForeground }]}>Ciclo de renovação</Text>
            <Text style={[U.infoValue, { color: colors.text }]}>Mensal</Text>
          </View>
          <View style={[U.infoDivider, { backgroundColor: colors.border }]} />
          <View style={U.infoRow}>
            <Feather name="refresh-cw" size={14} color={colors.mutedForeground} />
            <Text style={[U.infoLabel, { color: colors.mutedForeground }]}>Próxima renovação</Text>
            <Text style={[U.infoValue, { color: colors.text }]}>{renewalStr}</Text>
          </View>
          <View style={[U.infoDivider, { backgroundColor: colors.border }]} />
          <View style={U.infoRow}>
            <Feather name="shield" size={14} color={colors.mutedForeground} />
            <Text style={[U.infoLabel, { color: colors.mutedForeground }]}>Plano atual</Text>
            <Text style={[U.infoValue, { color: planColor }]}>Plano {planLabel}</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const U = StyleSheet.create({
  root:     { flex: 1 },
  header:   { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingBottom: 16 },
  backBtn:  { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 17, fontFamily: "SpaceGrotesk_700Bold" },

  planCard:    { flexDirection: "row", alignItems: "center", gap: 10, borderRadius: 14, borderWidth: 1, padding: 14 },
  planLabel:   { fontSize: 14, fontFamily: "SpaceGrotesk_700Bold" },
  planSub:     { fontSize: 11, fontFamily: "SpaceGrotesk_400Regular", marginTop: 2 },
  manageBtn:   { borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 },
  manageBtnText: { fontSize: 12, fontFamily: "SpaceGrotesk_600SemiBold" },

  metricCard:  { borderRadius: 14, borderWidth: 1, padding: 14, gap: 10 },
  metricHead:  { flexDirection: "row", alignItems: "center", gap: 10 },
  metricIcon:  { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  metricTitle: { fontSize: 13, fontFamily: "SpaceGrotesk_600SemiBold" },
  metricSub:   { fontSize: 11, fontFamily: "SpaceGrotesk_400Regular", marginTop: 1 },
  metricValue: { fontSize: 20, fontFamily: "SpaceGrotesk_700Bold" },
  barTrack:    { height: 4, backgroundColor: "rgba(255,255,255,0.08)", borderRadius: 2, overflow: "hidden" },
  barFill:     { height: 4, borderRadius: 2 },
  metricFooter:{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  metricCaption:{ fontSize: 11, fontFamily: "SpaceGrotesk_400Regular" },

  infoCard:    { borderRadius: 14, borderWidth: 1, overflow: "hidden" },
  infoRow:     { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 14, paddingVertical: 13 },
  infoLabel:   { flex: 1, fontSize: 13, fontFamily: "SpaceGrotesk_400Regular" },
  infoValue:   { fontSize: 13, fontFamily: "SpaceGrotesk_600SemiBold" },
  infoDivider: { height: StyleSheet.hairlineWidth, marginLeft: 38 },
});
