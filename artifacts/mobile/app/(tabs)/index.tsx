import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Easing,
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
import { useApp } from "@/context/AppContext";

// ─── Crosshair icon ──────────────────────────────────────────────────────────
function CrosshairIcon({ size, color }: { size: number; color: string }) {
  const stroke = 2;
  const lineLen = size * 0.24;
  const r = (size - stroke) / 2;
  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
      <View style={{ position: "absolute", width: size - stroke, height: size - stroke, borderRadius: r, borderWidth: stroke, borderColor: color }} />
      <View style={{ position: "absolute", width: 4, height: 4, borderRadius: 2, backgroundColor: color }} />
      <View style={{ position: "absolute", top: stroke / 2, left: (size - stroke) / 2, width: stroke, height: lineLen, backgroundColor: color, borderRadius: 1 }} />
      <View style={{ position: "absolute", bottom: stroke / 2, left: (size - stroke) / 2, width: stroke, height: lineLen, backgroundColor: color, borderRadius: 1 }} />
      <View style={{ position: "absolute", left: stroke / 2, top: (size - stroke) / 2, height: stroke, width: lineLen, backgroundColor: color, borderRadius: 1 }} />
      <View style={{ position: "absolute", right: stroke / 2, top: (size - stroke) / 2, height: stroke, width: lineLen, backgroundColor: color, borderRadius: 1 }} />
    </View>
  );
}

// ─── Pulsing module button ───────────────────────────────────────────────────
// Active = dark button (same as inactive) + subtle pink energy halo pulsing behind
const BTN_SIZE  = 65;   // +8% from 60
const WRAP_SIZE = 79;   // room for glow ring
const GLOW_SIZE = 81;

function ModuleBtn({
  active,
  onPress,
  children,
  colors,
}: {
  active: boolean;
  onPress: () => void;
  children: React.ReactNode;
  colors: ReturnType<typeof useColors>;
}) {
  const glowOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (active) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowOpacity, { toValue: 0.28, duration: 1200, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
          Animated.timing(glowOpacity, { toValue: 0.0,  duration: 1200, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        ])
      ).start();
    } else {
      glowOpacity.stopAnimation();
      glowOpacity.setValue(0);
    }
  }, [active]);

  // Subtle icon breath — very slow opacity pulse on the icon itself
  const iconBreath = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (active) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(iconBreath, { toValue: 0.55, duration: 1800, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
          Animated.timing(iconBreath, { toValue: 1.0,  duration: 1800, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        ])
      ).start();
    } else {
      iconBreath.stopAnimation();
      iconBreath.setValue(1);
    }
  }, [active]);

  return (
    // overflow:visible so the glow ring isn't clipped by the touchable bounds
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.75}
      style={[M.wrap, { width: WRAP_SIZE, height: WRAP_SIZE, overflow: "visible" }]}
    >
      {/* Glow: transparent ring with pink shadow — purely circular, no square fill */}
      <Animated.View
        style={[
          M.glowRing,
          { opacity: glowOpacity },
        ]}
      />
      {/* Button — identical style active or not */}
      <View
        style={[
          M.btn,
          {
            backgroundColor: colors.surface,
            borderColor: active ? colors.primary + "80" : colors.border,
          },
        ]}
      >
        {/* Icon breathes gently when module is active */}
        <Animated.View style={{ opacity: iconBreath }}>
          {children}
        </Animated.View>
      </View>
    </TouchableOpacity>
  );
}

const M = StyleSheet.create({
  wrap: { alignItems: "center", justifyContent: "center" },
  btn: {
    width: BTN_SIZE,
    height: BTN_SIZE,
    borderRadius: BTN_SIZE / 2,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    position: "absolute",
  },
  glowRing: {
    position: "absolute",
    width: BTN_SIZE,
    height: BTN_SIZE,
    borderRadius: BTN_SIZE / 2,
    backgroundColor: "transparent",
    borderWidth: 2,
    borderColor: "#FF0080",
    shadowColor: "#FF0080",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 16,
    elevation: 10,
  },
});

// ─── Metrics & Activity data ─────────────────────────────────────────────────
const METRICS = [
  { label: "Leads Hoje",     value: "24",     change: "+12%",  positive: true,  icon: "users",        iconColor: "#6C63FF" },
  { label: "Conversas Ativas", value: "8",    change: "+3",    positive: true,  icon: "message-circle", iconColor: "#FF0080" },
  { label: "Tx. Conversão",  value: "34%",    change: "+2,1%", positive: true,  icon: "trending-up",  iconColor: "#00D68F" },
  { label: "Receita do Mês", value: "R$12,4k",change: "-4%",   positive: false, icon: "dollar-sign",  iconColor: "#FFB300" },
] as const;

const ACTIVITY = [
  { id: "1", type: "lead"    as const, text: "Novo lead capturado: Carlos Mendes (TechBrasil)",     time: "2 min atrás",  avatarColor: "#FF6B35" },
  { id: "2", type: "message" as const, text: "JADE respondeu Ana Souza automaticamente",            time: "15 min atrás", avatarColor: "#00D68F" },
  { id: "3", type: "deal"    as const, text: "Roberto Costa movido para Proposta",                  time: "1h atrás",     avatarColor: "#FFB300" },
  { id: "4", type: "deal"    as const, text: "Diego Nunes fechou contrato · R$41.200",              time: "3h atrás",     avatarColor: "#FF6B35" },
  { id: "5", type: "task"    as const, text: "Follow-up agendado com Mariana Lima",                 time: "5h atrás",     avatarColor: "#FF0080" },
];

function activityColor(type: typeof ACTIVITY[0]["type"], colors: ReturnType<typeof useColors>) {
  switch (type) {
    case "lead":    return "#6C63FF";
    case "deal":    return colors.success;
    case "message": return colors.primary;
    case "task":    return "#FFB300";
  }
}
function activityIcon(type: typeof ACTIVITY[0]["type"], color: string) {
  switch (type) {
    case "lead":    return <Feather name="user-plus" size={14} color={color} />;
    case "deal":    return <Feather name="briefcase" size={14} color={color} />;
    case "message": return <MaterialCommunityIcons name="robot" size={14} color={color} />;
    case "task":    return <Feather name="calendar" size={14} color={color} />;
  }
}

// ─── Screen ──────────────────────────────────────────────────────────────────
export default function RadarScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { leads, conversations } = useApp();

  const topPad    = Platform.OS === "web" ? 67  : insets.top;
  const bottomPad = Platform.OS === "web" ? 84  : insets.bottom + 60;
  const unread    = conversations.filter((c) => c.unread > 0).length;

  // Module toggle states
  const [scannerActive, setScannerActive] = useState(true);
  const [jadeActive,    setJadeActive]    = useState(true);
  const [leadsActive,   setLeadsActive]   = useState(false);
  const [whatsActive,   setWhatsActive]   = useState(false);
  const [mktActive,     setMktActive]     = useState(false);

  const activeModules = [
    scannerActive && "Scanner",
    jadeActive    && "JADE",
    leadsActive   && "CRM",
    whatsActive   && "WhatsApp",
    mktActive     && "Marketing",
  ].filter(Boolean) as string[];

  function toggleModule(
    name: string,
    state: boolean,
    set: (v: boolean) => void,
    onMsg: string,
    offMsg: string,
  ) {
    const next = !state;
    set(next);
    Alert.alert(
      next ? `${name} ativado` : `${name} pausado`,
      next ? onMsg : offMsg,
      [{ text: "OK" }],
    );
  }

  return (
    <ScrollView
      style={[S.root, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingBottom: bottomPad }}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Header ── */}
      <View style={[S.header, { paddingTop: topPad - 6 }]}>
        <View>
          <Text style={[S.greeting, { color: colors.mutedForeground }]}>Bom dia,</Text>
          <Text style={[S.name, { color: colors.text }]}>Rodrigo 👋</Text>
        </View>
        <View style={S.headerRight}>
          {unread > 0 && (
            <TouchableOpacity
              style={[S.headerBtn, { backgroundColor: colors.surface }]}
              onPress={() => router.push("/notificacoes" as any)}
              activeOpacity={0.8}
            >
              <Feather name="bell" size={20} color={colors.text} />
              <View style={[S.notifDot, { backgroundColor: colors.primary }]}>
                <Text style={S.notifDotText}>{unread}</Text>
              </View>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[S.avatarBtn, { backgroundColor: colors.primary }]}
            onPress={() => router.push("/perfil" as any)}
            activeOpacity={0.85}
          >
            <Text style={S.avatarText}>R</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Module quick-access row ── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={S.modulesRow}
        style={S.modulesScroll}
      >
        {/* Scanner Radar */}
        <ModuleBtn
          active={scannerActive}
          onPress={() => toggleModule(
            "Scanner Radar", scannerActive, setScannerActive,
            "JADE está buscando novos estabelecimentos próximos automaticamente.",
            "Scanner pausado. Nenhuma prospecção automática em andamento.",
          )}
          colors={colors}
        >
          <CrosshairIcon size={27} color={colors.primary} />
        </ModuleBtn>

        {/* JADE IA */}
        <ModuleBtn
          active={jadeActive}
          onPress={() => toggleModule(
            "JADE IA", jadeActive, setJadeActive,
            "JADE está ativa e respondendo leads automaticamente.",
            "JADE pausada. Respostas automáticas desativadas.",
          )}
          colors={colors}
        >
          <MaterialCommunityIcons name="robot" size={27} color={colors.primary} />
        </ModuleBtn>

        {/* Leads / CRM */}
        <ModuleBtn
          active={leadsActive}
          onPress={() => toggleModule(
            "CRM", leadsActive, setLeadsActive,
            "Sincronização automática de leads ativada.",
            "CRM em modo manual.",
          )}
          colors={colors}
        >
          <Feather name="users" size={25} color={colors.primary} />
        </ModuleBtn>

        {/* WhatsApp */}
        <ModuleBtn
          active={whatsActive}
          onPress={() => toggleModule(
            "WhatsApp", whatsActive, setWhatsActive,
            "JADE vai abordar leads via WhatsApp automaticamente.",
            "Abordagem WhatsApp pausada.",
          )}
          colors={colors}
        >
          <Feather name="message-circle" size={25} color={colors.primary} />
        </ModuleBtn>

        {/* Marketing */}
        <ModuleBtn
          active={mktActive}
          onPress={() => toggleModule(
            "Marketing", mktActive, setMktActive,
            "Campanhas de marketing automático ativadas.",
            "Marketing automático pausado.",
          )}
          colors={colors}
        >
          <Feather name="zap" size={25} color={colors.primary} />
        </ModuleBtn>
      </ScrollView>

      {/* Active modules label — dynamic */}
      <Text style={[S.activeLabel, { color: colors.mutedForeground }]}>
        {activeModules.length > 0 ? (
          <>
            <Text style={{ color: colors.primary }}>●{"  "}</Text>
            {activeModules.join(" · ") + " ativos agora"}
          </>
        ) : (
          <Text style={{ color: colors.mutedForeground }}>Nenhum módulo ativo</Text>
        )}
      </Text>

      {/* ── Metric Cards ── */}
      <View style={S.metricsGrid}>
        {METRICS.map((m, i) => (
          <View key={i} style={[S.metricCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={S.metricHeader}>
              <View style={[S.metricIcon, { backgroundColor: m.iconColor + "22" }]}>
                <Feather name={m.icon as any} size={16} color={m.iconColor} />
              </View>
              <View style={[S.metricChange, {
                backgroundColor: m.positive ? "#00D68F22" : "#FF3B5C22",
              }]}>
                <Feather
                  name={m.positive ? "trending-up" : "trending-down"}
                  size={10}
                  color={m.positive ? colors.success : colors.destructive}
                />
                <Text style={[S.metricChangeText, {
                  color: m.positive ? colors.success : colors.destructive,
                }]}>
                  {m.change}
                </Text>
              </View>
            </View>
            <Text style={[S.metricValue, { color: colors.text }]}>{m.value}</Text>
            <Text style={[S.metricLabel, { color: colors.mutedForeground }]}>{m.label}</Text>
          </View>
        ))}
      </View>

      {/* ── Pipeline Summary ── */}
      <View style={S.section}>
        <View style={S.sectionHeader}>
          <Text style={[S.sectionTitle, { color: colors.text }]}>Pipeline</Text>
          <TouchableOpacity onPress={() => router.push("/leads" as any)}>
            <Text style={[S.sectionLink, { color: colors.primary }]}>Ver tudo</Text>
          </TouchableOpacity>
        </View>
        <View style={[S.pipelineCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {[
            { label: "Novo",        count: leads.filter((l) => l.column === "novo").length,        color: "#6C63FF" },
            { label: "Qualificado", count: leads.filter((l) => l.column === "qualificado").length, color: "#FFB300" },
            { label: "Proposta",    count: leads.filter((l) => l.column === "proposta").length,    color: "#FF0080" },
            { label: "Fechado",     count: leads.filter((l) => l.column === "fechado").length,     color: "#00D68F" },
          ].map((col, i) => (
            <View key={i} style={S.pipelineCol}>
              <View style={[S.pipelineDot, { backgroundColor: col.color }]} />
              <Text style={[S.pipelineCount, { color: colors.text }]}>{col.count}</Text>
              <Text style={[S.pipelineLabel, { color: colors.mutedForeground }]}>{col.label}</Text>
              <View style={[S.pipelineBar, { backgroundColor: col.color + "33" }]}>
                <View style={[S.pipelineBarFill, {
                  backgroundColor: col.color,
                  flex: col.count / (leads.length || 1),
                }]} />
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* ── Activity Feed ── */}
      <View style={S.section}>
        <View style={S.sectionHeader}>
          <Text style={[S.sectionTitle, { color: colors.text }]}>Atividade Recente</Text>
        </View>
        <View style={[S.activityCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {ACTIVITY.map((item, i) => {
            const color = activityColor(item.type, colors);
            return (
              <React.Fragment key={item.id}>
                <View style={S.activityItem}>
                  <View style={[S.activityIconWrap, { backgroundColor: color + "22" }]}>
                    {activityIcon(item.type, color)}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[S.activityText, { color: colors.text }]} numberOfLines={2}>
                      {item.text}
                    </Text>
                    <Text style={[S.activityTime, { color: colors.mutedForeground }]}>
                      {item.time}
                    </Text>
                  </View>
                </View>
                {i < ACTIVITY.length - 1 && (
                  <View style={[S.activityDivider, { backgroundColor: colors.border }]} />
                )}
              </React.Fragment>
            );
          })}
        </View>
      </View>
    </ScrollView>
  );
}

const S = StyleSheet.create({
  root: { flex: 1 },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  greeting: { fontSize: 14, fontFamily: "SpaceGrotesk_400Regular" },
  name:     { fontSize: 24, fontFamily: "SpaceGrotesk_700Bold", marginTop: 2 },
  headerRight: { flexDirection: "row", alignItems: "center", gap: 10 },
  headerBtn: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: "center", justifyContent: "center",
    position: "relative",
  },
  notifDot: {
    position: "absolute", top: 6, right: 6,
    width: 16, height: 16, borderRadius: 8,
    alignItems: "center", justifyContent: "center",
  },
  notifDotText: { color: "#fff", fontSize: 9, fontFamily: "SpaceGrotesk_700Bold" },
  avatarBtn: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  avatarText: { color: "#fff", fontSize: 15, fontFamily: "SpaceGrotesk_700Bold" },

  // Module buttons
  modulesScroll: { marginBottom: 4 },
  modulesRow: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 14,
    flexDirection: "row",
    alignItems: "center",
  },
  activeLabel: {
    fontSize: 12,
    fontFamily: "SpaceGrotesk_400Regular",
    paddingHorizontal: 20,
    marginBottom: 16,
  },

  // Metrics
  metricsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 12,
    gap: 10,
    marginBottom: 16,
  },
  metricCard: {
    width: "47%",
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    flexGrow: 1,
  },
  metricHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  metricIcon: { width: 34, height: 34, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  metricChange: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
  },
  metricChangeText: { fontSize: 11, fontFamily: "SpaceGrotesk_600SemiBold" },
  metricValue:      { fontSize: 24, fontFamily: "SpaceGrotesk_700Bold" },
  metricLabel:      { fontSize: 12, fontFamily: "SpaceGrotesk_400Regular", marginTop: 2 },

  // Pipeline
  section: { paddingHorizontal: 16, marginBottom: 16 },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  sectionTitle: { fontSize: 17, fontFamily: "SpaceGrotesk_700Bold" },
  sectionLink:  { fontSize: 14, fontFamily: "SpaceGrotesk_500Medium" },
  pipelineCard: {
    borderRadius: 14, borderWidth: 1, padding: 16,
    flexDirection: "row", gap: 8,
  },
  pipelineCol:     { flex: 1, alignItems: "center", gap: 4 },
  pipelineDot:     { width: 8, height: 8, borderRadius: 4 },
  pipelineCount:   { fontSize: 22, fontFamily: "SpaceGrotesk_700Bold" },
  pipelineLabel:   { fontSize: 11, fontFamily: "SpaceGrotesk_400Regular", textAlign: "center" },
  pipelineBar:     { width: "100%", height: 4, borderRadius: 2, marginTop: 4, flexDirection: "row" },
  pipelineBarFill: { height: 4, borderRadius: 2 },

  // Activity
  activityCard:     { borderRadius: 14, borderWidth: 1, overflow: "hidden" },
  activityItem:     { flexDirection: "row", gap: 12, padding: 14, alignItems: "flex-start" },
  activityIconWrap: {
    width: 32, height: 32, borderRadius: 10,
    alignItems: "center", justifyContent: "center",
    marginTop: 1,
  },
  activityText:     { fontSize: 13, fontFamily: "SpaceGrotesk_400Regular", lineHeight: 19, flex: 1 },
  activityTime:     { fontSize: 12, fontFamily: "SpaceGrotesk_400Regular", marginTop: 3 },
  activityDivider:  { height: StyleSheet.hairlineWidth, marginLeft: 58 },
});
