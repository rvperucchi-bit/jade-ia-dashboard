import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
} from "react-native";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

import { useColors } from "@/hooks/useColors";
import { useApp } from "@/context/AppContext";

interface MetricCard {
  label: string;
  value: string;
  change: string;
  positive: boolean;
  icon: string;
  iconColor: string;
}

const METRICS: MetricCard[] = [
  { label: "Leads Hoje", value: "24", change: "+12%", positive: true, icon: "users", iconColor: "#6C63FF" },
  { label: "Conversas Ativas", value: "8", change: "+3", positive: true, icon: "message-circle", iconColor: "#FF0080" },
  { label: "Tx. Conversão", value: "34%", change: "+2,1%", positive: true, icon: "trending-up", iconColor: "#00D68F" },
  { label: "Receita do Mês", value: "R$12,4k", change: "-4%", positive: false, icon: "dollar-sign", iconColor: "#FFB300" },
];

interface ActivityItem {
  id: string;
  type: "lead" | "deal" | "message" | "task";
  text: string;
  time: string;
  initials: string;
  avatarColor: string;
}

const ACTIVITY: ActivityItem[] = [
  { id: "1", type: "lead", text: "Novo lead capturado: Carlos Mendes (TechBrasil)", time: "2 min atrás", initials: "CM", avatarColor: "#FF6B35" },
  { id: "2", type: "message", text: "JADE respondeu Ana Souza automaticamente", time: "15 min atrás", initials: "AS", avatarColor: "#00D68F" },
  { id: "3", type: "deal", text: "Roberto Costa movido para Proposta", time: "1h atrás", initials: "RC", avatarColor: "#FFB300" },
  { id: "4", type: "deal", text: "Diego Nunes fechou contrato · R$41.200", time: "3h atrás", initials: "DN", avatarColor: "#FF6B35" },
  { id: "5", type: "task", text: "Follow-up agendado com Mariana Lima", time: "5h atrás", initials: "ML", avatarColor: "#FF0080" },
];

function activityIcon(type: ActivityItem["type"], color: string) {
  switch (type) {
    case "lead": return <Feather name="user-plus" size={14} color={color} />;
    case "deal": return <Feather name="briefcase" size={14} color={color} />;
    case "message": return <MaterialCommunityIcons name="robot" size={14} color={color} />;
    case "task": return <Feather name="calendar" size={14} color={color} />;
  }
}

function activityColor(type: ActivityItem["type"], colors: ReturnType<typeof useColors>) {
  switch (type) {
    case "lead": return "#6C63FF";
    case "deal": return colors.success;
    case "message": return colors.primary;
    case "task": return "#FFB300";
  }
}

// ─── Crosshair / Scanner icon ───────────────────────────────────────────────
function CrosshairIcon({ size, color }: { size: number; color: string }) {
  const stroke = 2;
  const gap = size * 0.22;
  const lineLen = size * 0.22;
  const r = (size - stroke) / 2;

  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
      {/* Outer circle */}
      <View style={{
        position: "absolute",
        width: size - stroke,
        height: size - stroke,
        borderRadius: r,
        borderWidth: stroke,
        borderColor: color,
      }} />
      {/* Inner dot */}
      <View style={{
        position: "absolute",
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: color,
      }} />
      {/* Top line */}
      <View style={{
        position: "absolute",
        top: stroke / 2,
        left: (size - stroke) / 2,
        width: stroke,
        height: lineLen,
        backgroundColor: color,
        borderRadius: 1,
      }} />
      {/* Bottom line */}
      <View style={{
        position: "absolute",
        bottom: stroke / 2,
        left: (size - stroke) / 2,
        width: stroke,
        height: lineLen,
        backgroundColor: color,
        borderRadius: 1,
      }} />
      {/* Left line */}
      <View style={{
        position: "absolute",
        left: stroke / 2,
        top: (size - stroke) / 2,
        height: stroke,
        width: lineLen,
        backgroundColor: color,
        borderRadius: 1,
      }} />
      {/* Right line */}
      <View style={{
        position: "absolute",
        right: stroke / 2,
        top: (size - stroke) / 2,
        height: stroke,
        width: lineLen,
        backgroundColor: color,
        borderRadius: 1,
      }} />
    </View>
  );
}

export default function RadarScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { leads, conversations } = useApp();

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 84 : insets.bottom + 60;
  const unread = conversations.filter((c) => c.unread > 0).length;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingBottom: bottomPad }}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 12 }]}>
        <View>
          <Text style={[styles.greeting, { color: colors.mutedForeground }]}>Bom dia,</Text>
          <Text style={[styles.name, { color: colors.text }]}>Rodrigo 👋</Text>
        </View>
        <View style={styles.headerActions}>
          {/* Scanner / Crosshair button */}
          <TouchableOpacity
            style={[styles.scannerBtn, { backgroundColor: colors.primary + "18", borderColor: colors.primary + "55" }]}
            onPress={() => router.push("/scanner" as any)}
            activeOpacity={0.8}
          >
            <CrosshairIcon size={22} color={colors.primary} />
          </TouchableOpacity>
          {unread > 0 && (
            <TouchableOpacity
              style={[styles.notifBtn, { backgroundColor: colors.surface }]}
              onPress={() => router.push("/conversas" as any)}
              activeOpacity={0.8}
            >
              <Feather name="bell" size={20} color={colors.text} />
              <View style={[styles.notifDot, { backgroundColor: colors.primary }]}>
                <Text style={styles.notifDotText}>{unread}</Text>
              </View>
            </TouchableOpacity>
          )}
          <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
            <Text style={styles.avatarText}>R</Text>
          </View>
        </View>
      </View>

      {/* Scanner banner */}
      <TouchableOpacity
        style={[styles.scannerBanner, { backgroundColor: colors.primary + "12", borderColor: colors.primary + "40" }]}
        activeOpacity={0.85}
        onPress={() => router.push("/scanner" as any)}
      >
        <View style={[styles.scannerBannerIcon, { backgroundColor: colors.primary + "28" }]}>
          <CrosshairIcon size={26} color={colors.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.scannerBannerTitle, { color: colors.text }]}>Scanner Radar</Text>
          <Text style={[styles.scannerBannerSub, { color: colors.mutedForeground }]}>
            Encontrar novos estabelecimentos próximos
          </Text>
        </View>
        <Feather name="chevron-right" size={18} color={colors.primary} />
      </TouchableOpacity>

      {/* JADE Banner */}
      <TouchableOpacity
        style={[styles.jadeBanner, { backgroundColor: colors.card, borderColor: colors.border }]}
        activeOpacity={0.85}
        onPress={() => router.push("/jade" as any)}
      >
        <View style={[styles.jadeBannerIcon, { backgroundColor: colors.primary + "22" }]}>
          <MaterialCommunityIcons name="robot" size={22} color={colors.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.jadeBannerTitle, { color: colors.text }]}>JADE está ativa</Text>
          <Text style={[styles.jadeBannerSub, { color: colors.mutedForeground }]}>
            3 leads qualificados hoje · 2 follow-ups pendentes
          </Text>
        </View>
        <Feather name="chevron-right" size={18} color={colors.primary} />
      </TouchableOpacity>

      {/* Metric Cards */}
      <View style={styles.metricsGrid}>
        {METRICS.map((m, i) => (
          <View key={i} style={[styles.metricCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.metricHeader}>
              <View style={[styles.metricIcon, { backgroundColor: m.iconColor + "22" }]}>
                <Feather name={m.icon as any} size={16} color={m.iconColor} />
              </View>
              <View style={[styles.metricChange, { backgroundColor: m.positive ? "#00D68F22" : "#FF3B5C22" }]}>
                <Feather name={m.positive ? "trending-up" : "trending-down"} size={10} color={m.positive ? colors.success : colors.destructive} />
                <Text style={[styles.metricChangeText, { color: m.positive ? colors.success : colors.destructive }]}>
                  {m.change}
                </Text>
              </View>
            </View>
            <Text style={[styles.metricValue, { color: colors.text }]}>{m.value}</Text>
            <Text style={[styles.metricLabel, { color: colors.mutedForeground }]}>{m.label}</Text>
          </View>
        ))}
      </View>

      {/* Pipeline Summary */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Pipeline</Text>
          <TouchableOpacity onPress={() => router.push("/leads" as any)}>
            <Text style={[styles.sectionLink, { color: colors.primary }]}>Ver tudo</Text>
          </TouchableOpacity>
        </View>
        <View style={[styles.pipelineCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {[
            { label: "Novo", count: leads.filter((l) => l.column === "novo").length, color: "#6C63FF" },
            { label: "Qualificado", count: leads.filter((l) => l.column === "qualificado").length, color: "#FFB300" },
            { label: "Proposta", count: leads.filter((l) => l.column === "proposta").length, color: "#FF0080" },
            { label: "Fechado", count: leads.filter((l) => l.column === "fechado").length, color: "#00D68F" },
          ].map((col, i) => (
            <View key={i} style={styles.pipelineCol}>
              <View style={[styles.pipelineDot, { backgroundColor: col.color }]} />
              <Text style={[styles.pipelineCount, { color: colors.text }]}>{col.count}</Text>
              <Text style={[styles.pipelineLabel, { color: colors.mutedForeground }]}>{col.label}</Text>
              <View style={[styles.pipelineBar, { backgroundColor: col.color + "33" }]}>
                <View style={[styles.pipelineBarFill, { backgroundColor: col.color, flex: col.count / (leads.length || 1) }]} />
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* Activity Feed */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Atividade Recente</Text>
        </View>
        <View style={[styles.activityCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {ACTIVITY.map((item, i) => {
            const color = activityColor(item.type, colors);
            return (
              <React.Fragment key={item.id}>
                <View style={styles.activityItem}>
                  <View style={[styles.activityIconWrap, { backgroundColor: color + "22" }]}>
                    {activityIcon(item.type, color)}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.activityText, { color: colors.text }]} numberOfLines={2}>{item.text}</Text>
                    <Text style={[styles.activityTime, { color: colors.mutedForeground }]}>{item.time}</Text>
                  </View>
                </View>
                {i < ACTIVITY.length - 1 && <View style={[styles.activityDivider, { backgroundColor: colors.border }]} />}
              </React.Fragment>
            );
          })}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  greeting: { fontSize: 14, fontFamily: "SpaceGrotesk_400Regular" },
  name: { fontSize: 22, fontFamily: "SpaceGrotesk_700Bold", marginTop: 2 },
  headerActions: { flexDirection: "row", alignItems: "center", gap: 10 },
  scannerBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  notifBtn: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center", position: "relative" },
  notifDot: { position: "absolute", top: 6, right: 6, width: 16, height: 16, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  notifDotText: { color: "#fff", fontSize: 9, fontFamily: "SpaceGrotesk_700Bold" },
  avatar: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  avatarText: { color: "#fff", fontSize: 15, fontFamily: "SpaceGrotesk_700Bold" },

  scannerBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginHorizontal: 16,
    marginBottom: 10,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  scannerBannerIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  scannerBannerTitle: { fontSize: 14, fontFamily: "SpaceGrotesk_700Bold" },
  scannerBannerSub: { fontSize: 12, fontFamily: "SpaceGrotesk_400Regular", marginTop: 2 },

  jadeBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  jadeBannerIcon: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  jadeBannerTitle: { fontSize: 14, fontFamily: "SpaceGrotesk_600SemiBold" },
  jadeBannerSub: { fontSize: 12, fontFamily: "SpaceGrotesk_400Regular", marginTop: 2 },

  metricsGrid: { flexDirection: "row", flexWrap: "wrap", paddingHorizontal: 12, gap: 10, marginBottom: 16 },
  metricCard: { width: "47%", borderRadius: 14, borderWidth: 1, padding: 14, flexGrow: 1 },
  metricHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  metricIcon: { width: 34, height: 34, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  metricChange: { flexDirection: "row", alignItems: "center", gap: 3, paddingHorizontal: 7, paddingVertical: 3, borderRadius: 8 },
  metricChangeText: { fontSize: 11, fontFamily: "SpaceGrotesk_600SemiBold" },
  metricValue: { fontSize: 24, fontFamily: "SpaceGrotesk_700Bold" },
  metricLabel: { fontSize: 12, fontFamily: "SpaceGrotesk_400Regular", marginTop: 2 },

  section: { paddingHorizontal: 16, marginBottom: 16 },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  sectionTitle: { fontSize: 17, fontFamily: "SpaceGrotesk_700Bold" },
  sectionLink: { fontSize: 14, fontFamily: "SpaceGrotesk_500Medium" },
  pipelineCard: { borderRadius: 14, borderWidth: 1, padding: 16, flexDirection: "row", gap: 8 },
  pipelineCol: { flex: 1, alignItems: "center", gap: 4 },
  pipelineDot: { width: 8, height: 8, borderRadius: 4 },
  pipelineCount: { fontSize: 22, fontFamily: "SpaceGrotesk_700Bold" },
  pipelineLabel: { fontSize: 11, fontFamily: "SpaceGrotesk_400Regular", textAlign: "center" },
  pipelineBar: { width: "100%", height: 4, borderRadius: 2, marginTop: 4, flexDirection: "row" },
  pipelineBarFill: { height: 4, borderRadius: 2 },
  activityCard: { borderRadius: 14, borderWidth: 1, overflow: "hidden" },
  activityItem: { flexDirection: "row", gap: 12, padding: 14, alignItems: "flex-start" },
  activityIconWrap: { width: 32, height: 32, borderRadius: 10, alignItems: "center", justifyContent: "center", marginTop: 1 },
  activityText: { fontSize: 13, fontFamily: "SpaceGrotesk_400Regular", lineHeight: 19, flex: 1 },
  activityTime: { fontSize: 12, fontFamily: "SpaceGrotesk_400Regular", marginTop: 3 },
  activityDivider: { height: StyleSheet.hairlineWidth, marginLeft: 58 },
});
