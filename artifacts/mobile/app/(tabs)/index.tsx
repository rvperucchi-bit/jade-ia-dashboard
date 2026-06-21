import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Modal,
  Platform,
  PanResponder,
  RefreshControl,
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
import { useApp, type ActivityEvent } from "@/context/AppContext";
import { setPendingVoice } from "@/utils/voiceContext";

const API_BASE =
  Platform.OS === "web"
    ? ""
    : `https://${process.env.EXPO_PUBLIC_DOMAIN ?? ""}`;

const PINK   = "#FF0080";
const PURPLE = "#8400FF";
const GOLD   = "#FFB800";

// ─── CrosshairIcon ────────────────────────────────────────────────────────────
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

// ─── SmallModule — non-JADE module button ─────────────────────────────────────
const MOD_BTN  = 54;
const MOD_WRAP = 64;

function SmallModule({
  children, active, locked, plan, label, color, colors, onPress, onLockedPress,
}: {
  children: React.ReactNode;
  active?: boolean; locked?: boolean; plan?: string;
  label: string; color?: string;
  colors: ReturnType<typeof useColors>;
  onPress: () => void;
  onLockedPress?: () => void;
}) {
  const glowAnim = useRef(new Animated.Value(0)).current;
  const loopRef  = useRef<ReturnType<typeof Animated.loop> | null>(null);

  useEffect(() => {
    if (active && !locked) {
      loopRef.current = Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, { toValue: 1, duration: 1400, useNativeDriver: false }),
          Animated.timing(glowAnim, { toValue: 0, duration: 1400, useNativeDriver: false }),
        ])
      );
      loopRef.current.start();
    } else {
      loopRef.current?.stop();
      glowAnim.setValue(0);
    }
    return () => { loopRef.current?.stop(); };
  }, [active, locked]);

  const glowColor = color ?? PINK;

  return (
    <TouchableOpacity
      style={S.moduleCol}
      onPress={locked ? onLockedPress : onPress}
      activeOpacity={0.75}
    >
      <View style={{ position: "relative", width: MOD_WRAP, height: MOD_WRAP, alignItems: "center", justifyContent: "center" }}>
        <Animated.View style={[S.modBtn, {
          backgroundColor: colors.surface,
          borderColor: active && !locked ? glowColor + "80" : colors.border,
          opacity: locked ? 0.4 : 1,
          shadowColor: glowColor,
          shadowOffset: { width: 0, height: 0 },
          shadowRadius: glowAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 8] }),
          shadowOpacity: glowAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 0.6] }),
          elevation: glowAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 6] }),
        }]}>
          {children}
        </Animated.View>
        {locked && (
          <View style={S.lockDot}>
            <Feather name="lock" size={8} color="#AAAACC" />
          </View>
        )}
        {locked && plan && (
          <View style={[S.planBadge, { backgroundColor: plan === "Enterprise" ? GOLD + "DD" : PURPLE + "DD" }]}>
            <Text style={S.planBadgeText}>{plan === "Enterprise" ? "ENT" : "PRO"}</Text>
          </View>
        )}
      </View>
      <Text style={[S.modLabel, { color: locked ? "#5555AA" : (active ? PINK : colors.mutedForeground) }]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

// ─── JADE Module Button — center of the strip ─────────────────────────────────
const JADE_BTN = 72;

function JADEModule({ onTap, onHoldEnd }: {
  onTap: () => void;
  onHoldEnd: (duration: number) => void;
}) {
  const ring1      = useRef(new Animated.Value(0)).current;
  const ring2      = useRef(new Animated.Value(0)).current;
  const ring3      = useRef(new Animated.Value(0)).current;
  const btnScale   = useRef(new Animated.Value(1)).current;
  const borderGlow = useRef(new Animated.Value(0)).current;
  const glowLoop   = useRef(new Animated.Value(0)).current;

  const isHoldingRef  = useRef(false);
  const holdTimerRef  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const holdStartRef  = useRef(0);
  const holdStuff     = useRef<{ timers: ReturnType<typeof setTimeout>[]; loops: ReturnType<typeof Animated.loop>[] }>({ timers: [], loops: [] });
  const callbacksRef  = useRef({ onTap, onHoldEnd });
  callbacksRef.current = { onTap, onHoldEnd };

  // Idle glow pulse
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(glowLoop, { toValue: 1, duration: 1800, useNativeDriver: false }),
        Animated.timing(glowLoop, { toValue: 0, duration: 1800, useNativeDriver: false }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  const stopEnergize = () => {
    isHoldingRef.current = false;
    holdStuff.current.timers.forEach(clearTimeout);
    holdStuff.current.loops.forEach((l) => l.stop());
    holdStuff.current = { timers: [], loops: [] };
    ring1.setValue(0); ring2.setValue(0); ring3.setValue(0);
    Animated.timing(btnScale,   { toValue: 1, duration: 140, useNativeDriver: false }).start();
    Animated.timing(borderGlow, { toValue: 0, duration: 140, useNativeDriver: false }).start();
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        isHoldingRef.current = false;
        holdStartRef.current = 0;
        holdTimerRef.current = setTimeout(() => {
          isHoldingRef.current = true;
          holdStartRef.current = Date.now();
          const launchRing = (anim: Animated.Value, delay: number) => {
            const t = setTimeout(() => {
              if (!isHoldingRef.current) return;
              anim.setValue(0);
              const loop = Animated.loop(
                Animated.timing(anim, { toValue: 1, duration: 1200, easing: Easing.out(Easing.ease), useNativeDriver: false })
              );
              loop.start();
              holdStuff.current.loops.push(loop);
            }, delay);
            holdStuff.current.timers.push(t);
          };
          launchRing(ring1, 0);
          launchRing(ring2, 350);
          launchRing(ring3, 700);
          const pulse = Animated.loop(
            Animated.sequence([
              Animated.timing(btnScale, { toValue: 1.1, duration: 380, useNativeDriver: false }),
              Animated.timing(btnScale, { toValue: 1.0, duration: 380, useNativeDriver: false }),
            ])
          );
          pulse.start();
          holdStuff.current.loops.push(pulse);
          Animated.timing(borderGlow, { toValue: 1, duration: 240, useNativeDriver: false }).start();
        }, 400);
      },
      onPanResponderRelease: () => {
        if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
        const wasHolding = isHoldingRef.current;
        const duration   = wasHolding && holdStartRef.current > 0
          ? Math.max(1, Math.floor((Date.now() - holdStartRef.current) / 1000))
          : 0;
        stopEnergize();
        if (wasHolding) callbacksRef.current.onHoldEnd(duration);
        else callbacksRef.current.onTap();
      },
      onPanResponderTerminate: () => {
        if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
        stopEnergize();
      },
    })
  ).current;

  const makeRing = (anim: Animated.Value) => ({
    transform: [{ scale: anim.interpolate({ inputRange: [0, 1], outputRange: [1, 2.8] }) }],
    opacity:   anim.interpolate({ inputRange: [0, 0.4, 1], outputRange: [0.6, 0.2, 0] }),
  });

  const idleGlow = glowLoop.interpolate({ inputRange: [0, 1], outputRange: [4, 14] });
  const idleOpacity = glowLoop.interpolate({ inputRange: [0, 1], outputRange: [0.3, 0.7] });
  const btnBorder = borderGlow.interpolate({ inputRange: [0, 1], outputRange: [PINK + "60", PINK + "FF"] });

  return (
    <View style={S.jadeModuleCol}>
      {/* Container sized just to the button; rings overflow absolutely */}
      <View style={{ width: JADE_BTN, height: JADE_BTN, alignItems: "center", justifyContent: "center" }}>
        {/* Idle glow ring */}
        <Animated.View style={{
          position: "absolute",
          width: JADE_BTN, height: JADE_BTN, borderRadius: JADE_BTN / 2,
          borderWidth: 1.5, borderColor: PINK,
          shadowColor: PINK,
          shadowOffset: { width: 0, height: 0 },
          shadowRadius: idleGlow,
          shadowOpacity: idleOpacity,
          transform: [{ scale: 1 }],
        }} pointerEvents="none" />
        {/* Voice rings */}
        <Animated.View style={[JB.ring, { position: "absolute" }, makeRing(ring1)]} pointerEvents="none" />
        <Animated.View style={[JB.ring, { position: "absolute" }, makeRing(ring2)]} pointerEvents="none" />
        <Animated.View style={[JB.ring, { position: "absolute" }, makeRing(ring3)]} pointerEvents="none" />
        {/* Button */}
        <View {...panResponder.panHandlers}>
          <Animated.View style={[JB.btn, {
            transform: [{ scale: btnScale }],
            borderColor: btnBorder,
            shadowColor: PINK,
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.55,
            shadowRadius: 16,
            elevation: 12,
          }]}>
            <MaterialCommunityIcons name="robot" size={30} color={PINK} />
          </Animated.View>
        </View>
      </View>
      <Text style={[S.jadeModLabel, { color: PINK }]}>JADE</Text>
      <Text style={S.jadeSubLabel}>✦ IA</Text>
    </View>
  );
}

const JB = StyleSheet.create({
  ring: {
    width: JADE_BTN, height: JADE_BTN, borderRadius: JADE_BTN / 2,
    borderWidth: 1.5, borderColor: PINK,
  },
  btn: {
    width: JADE_BTN, height: JADE_BTN, borderRadius: JADE_BTN / 2,
    backgroundColor: "#12061e",
    borderWidth: 1.5,
    alignItems: "center", justifyContent: "center",
  },
});

// ─── Upgrade / Plan Gate Modal ────────────────────────────────────────────────
function PlanGateModal({
  visible, plan, featureName, onClose, onUpgrade,
}: {
  visible: boolean; plan: "PRO" | "Enterprise"; featureName: string;
  onClose: () => void; onUpgrade: () => void;
}) {
  const color = plan === "Enterprise" ? GOLD : PURPLE;
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={PM.overlay} activeOpacity={1} onPress={onClose}>
        <View style={PM.box} onStartShouldSetResponder={() => true}>
          <View style={[PM.iconWrap, { backgroundColor: color + "22", borderColor: color + "44" }]}>
            <Feather name="lock" size={28} color={color} />
          </View>
          <Text style={PM.title}>Função exclusiva do plano {plan}</Text>
          <Text style={PM.sub}>
            <Text style={{ color }}>{featureName}</Text>
            {" "}está disponível apenas para assinantes {plan}.{"\n"}Desbloqueie e venda mais.
          </Text>
          <TouchableOpacity style={[PM.primaryBtn, { backgroundColor: color }]} onPress={onUpgrade} activeOpacity={0.85}>
            <Feather name="zap" size={15} color="#fff" />
            <Text style={PM.primaryText}>Atualizar agora</Text>
          </TouchableOpacity>
          <TouchableOpacity style={PM.secondaryBtn} onPress={onClose} activeOpacity={0.7}>
            <Text style={PM.secondaryText}>Agora não</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const PM = StyleSheet.create({
  overlay:     { flex: 1, backgroundColor: "rgba(0,0,0,0.78)", alignItems: "center", justifyContent: "center", padding: 24 },
  box:         { backgroundColor: "#111118", borderRadius: 22, padding: 26, alignItems: "center", width: "100%", borderWidth: 1, borderColor: "#1E1E2E", gap: 10 },
  iconWrap:    { width: 60, height: 60, borderRadius: 30, alignItems: "center", justifyContent: "center", borderWidth: 1, marginBottom: 2 },
  title:       { fontSize: 18, fontFamily: "SpaceGrotesk_700Bold", color: "#FFFFFF", textAlign: "center" },
  sub:         { fontSize: 13, fontFamily: "SpaceGrotesk_400Regular", color: "#AAAACC", textAlign: "center", lineHeight: 21, marginBottom: 6 },
  primaryBtn:  { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 13, height: 48, width: "100%" },
  primaryText: { fontSize: 15, fontFamily: "SpaceGrotesk_700Bold", color: "#fff" },
  secondaryBtn:  { paddingVertical: 8 },
  secondaryText: { fontSize: 13, fontFamily: "SpaceGrotesk_500Medium", color: "#7777AA" },
});

// ─── Activity helpers ─────────────────────────────────────────────────────────
function activityColor(type: ActivityEvent["type"], colors: ReturnType<typeof useColors>) {
  switch (type) {
    case "lead":     return "#6C63FF";
    case "deal":     return colors.success;
    case "message":  return colors.primary;
    case "task":     return "#FFB300";
    case "scan":     return "#6C63FF";
    case "campaign": return "#FFB300";
    case "module":   return colors.primary;
    default:         return colors.mutedForeground;
  }
}

function ActivityIcon({ type, color }: { type: ActivityEvent["type"]; color: string }) {
  const size = 14;
  switch (type) {
    case "lead":     return <Feather name="user-plus"        size={size} color={color} />;
    case "deal":     return <Feather name="briefcase"        size={size} color={color} />;
    case "message":  return <MaterialCommunityIcons name="robot" size={size} color={color} />;
    case "task":     return <Feather name="calendar"         size={size} color={color} />;
    case "scan":     return <Feather name="crosshair"        size={size} color={color} />;
    case "campaign": return <Feather name="zap"              size={size} color={color} />;
    case "module":   return <Feather name="settings"         size={size} color={color} />;
    default:         return <Feather name="activity"         size={size} color={color} />;
  }
}

function timeAgo(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "agora";
  if (mins < 60) return `${mins} min atrás`;
  const h = Math.floor(mins / 60);
  if (h < 24) return `${h}h atrás`;
  return `${Math.floor(h / 24)}d atrás`;
}

// ─── Module definitions ───────────────────────────────────────────────────────
// Only 4 modules in the strip (JADE is the 5th, center)
const LEFT_MODS  = [
  { name: "scanner",   label: "Radar",   locked: false, plan: "" },
  { name: "leads",     label: "Leads",   locked: false, plan: "" },
];
const RIGHT_MODS = [
  { name: "whatsapp",  label: "WhatsApp", locked: false, plan: "" },
  { name: "marketing", label: "Mkt",      locked: false, plan: "" },
];

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function HomeScreen() {
  const colors  = useColors();
  const insets  = useSafeAreaInsets();
  const router  = useRouter();
  const { leads, conversations, moduleStates, activityEvents, toggleModule, refreshDashboard, addLead } = useApp();

  const [refreshing,   setRefreshing]   = useState(false);
  const [gateVisible,  setGateVisible]  = useState(false);
  const [gatePlan,     setGatePlan]     = useState<"PRO" | "Enterprise">("PRO");
  const [gateFeature,  setGateFeature]  = useState("");

  const openGate = (plan: "PRO" | "Enterprise", feature: string) => {
    setGatePlan(plan); setGateFeature(feature); setGateVisible(true);
  };

  // Scanner autonomous mode
  const existingLeadIds = useRef<string[]>([]);
  useEffect(() => { existingLeadIds.current = leads.map((l) => l.id); }, [leads]);
  const scannerActive = moduleStates.scanner?.is_active ?? false;
  useEffect(() => {
    if (!scannerActive) return;
    const doProspectar = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/jade/prospectar`, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ existingIds: existingLeadIds.current }),
        });
        if (!res.ok) return;
        const data = (await res.json()) as { leads: any[] };
        for (const lead of (data.leads ?? [])) { addLead(lead); existingLeadIds.current = [...existingLeadIds.current, lead.id]; }
      } catch { /* ignore */ }
    };
    doProspectar();
    const interval = setInterval(doProspectar, 60000);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scannerActive]);

  const topPad    = Platform.OS === "web" ? 67  : insets.top;
  const bottomPad = Platform.OS === "web" ? 84  : insets.bottom + 60;
  const unread    = conversations.filter((c) => c.unread > 0).length;

  // Metrics
  const novoLeads    = leads.filter((l) => l.column === "novo").length;
  const fechadoLeads = leads.filter((l) => l.column === "fechado");
  const txConversao  = leads.length > 0 ? Math.round((fechadoLeads.length / leads.length) * 100) : 0;
  const receitaMes   = fechadoLeads.reduce((s, l) => s + l.value, 0);
  const convAtivas   = conversations.filter((c) => c.unread > 0).length;
  const fmt = (v: number) => v >= 1000 ? `R$${(v / 1000).toFixed(1)}k` : `R$${v.toLocaleString("pt-BR")}`;

  const METRICS = [
    { label: "Leads Ativos",    value: String(novoLeads),       change: `${leads.length} total`,          positive: true,               icon: "users",          iconColor: "#6C63FF" },
    { label: "Conv. não lidas", value: String(convAtivas),      change: `${conversations.length} total`,  positive: convAtivas > 0,     icon: "message-circle", iconColor: PINK },
    { label: "Tx. Conversão",   value: `${txConversao}%`,       change: `${fechadoLeads.length} fechados`,positive: txConversao > 20,   icon: "trending-up",    iconColor: "#00D68F" },
    { label: "Receita Fechada", value: fmt(receitaMes),         change: `${fechadoLeads.length} contratos`,positive: true,              icon: "dollar-sign",    iconColor: "#FFB300" },
  ] as const;

  const handleModPress = (name: string) => {
    if (name === "scanner")   toggleModule("scanner");
    else if (name === "leads") router.push("/leads" as any);
    else if (name === "whatsapp") toggleModule("whatsapp");
    else if (name === "marketing") router.push("/marketing" as any);
  };

  const onRefresh = useCallback(async () => { setRefreshing(true); await refreshDashboard(); setRefreshing(false); }, [refreshDashboard]);
  const goToJade  = () => router.push("/(tabs)/jade" as any);

  const renderMod = (def: typeof LEFT_MODS[0]) => {
    const active = moduleStates[def.name]?.is_active ?? false;
    return (
      <SmallModule
        key={def.name}
        active={active} locked={def.locked} plan={def.plan}
        label={def.label} colors={colors}
        onPress={() => handleModPress(def.name)}
        onLockedPress={() => openGate(def.plan as any, def.label)}
      >
        {def.name === "scanner"   && <CrosshairIcon size={22} color={PINK} />}
        {def.name === "leads"     && <Feather name="users"          size={20} color={PINK} />}
        {def.name === "whatsapp"  && <Feather name="message-circle" size={20} color={PINK} />}
        {def.name === "marketing" && <Feather name="zap"            size={20} color={PINK} />}
      </SmallModule>
    );
  };

  return (
    <>
      <ScrollView
        style={[S.root, { backgroundColor: colors.background }]}
        contentContainerStyle={{ paddingBottom: bottomPad }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={PINK} />}
      >
        {/* ── Header ── */}
        <View style={[S.header, { paddingTop: topPad }]}>
          <View>
            <Text style={[S.greeting, { color: colors.mutedForeground }]}>Bom dia,</Text>
            <Text style={[S.name, { color: colors.text }]}>Rodrigo 👋</Text>
          </View>
          <View style={S.headerRight}>
            {unread > 0 && (
              <TouchableOpacity style={[S.headerBtn, { backgroundColor: colors.surface }]}
                onPress={() => router.push("/notificacoes" as any)} activeOpacity={0.8}>
                <Feather name="bell" size={20} color={colors.text} />
                <View style={[S.notifDot, { backgroundColor: PINK }]}>
                  <Text style={S.notifDotText}>{unread}</Text>
                </View>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[S.avatarBtn, { backgroundColor: colors.surface, borderWidth: 1.5, borderColor: PINK + "60" }]}
              onPress={() => router.push("/scanner" as any)} activeOpacity={0.85}>
              <Feather name="target" size={20} color={PINK} />
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Module strip with JADE center ── */}
        <Text style={[S.sectionSmall, { color: colors.mutedForeground }]}>MÓDULOS</Text>
        <View style={S.moduleStrip}>
          {LEFT_MODS.map(renderMod)}

          {/* ── JADE ── center piece */}
          <JADEModule
            onTap={goToJade}
            onHoldEnd={(dur) => { setPendingVoice(dur); goToJade(); }}
          />

          {RIGHT_MODS.map(renderMod)}
        </View>

        {/* ── Metric Cards ── */}
        <View style={S.metricsGrid}>
          {METRICS.map((m, i) => (
            <View key={i} style={[S.metricCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={S.metricHeader}>
                <View style={[S.metricIcon, { backgroundColor: m.iconColor + "22" }]}>
                  <Feather name={m.icon as any} size={15} color={m.iconColor} />
                </View>
                <View style={[S.metricChange, { backgroundColor: m.positive ? "#00D68F22" : "#FF3B5C22" }]}>
                  <Feather name={m.positive ? "trending-up" : "trending-down"} size={9} color={m.positive ? colors.success : colors.destructive} />
                  <Text style={[S.metricChangeText, { color: m.positive ? colors.success : colors.destructive }]}>{m.change}</Text>
                </View>
              </View>
              <Text style={[S.metricValue, { color: colors.text }]}>{m.value}</Text>
              <Text style={[S.metricLabel, { color: colors.mutedForeground }]}>{m.label}</Text>
            </View>
          ))}
        </View>

        {/* ── Pipeline ── */}
        <View style={S.section}>
          <View style={S.sectionHeader}>
            <Text style={[S.sectionTitle, { color: colors.text }]}>Pipeline</Text>
            <TouchableOpacity onPress={() => router.push("/leads" as any)}>
              <Text style={[S.sectionLink, { color: PINK }]}>Ver tudo</Text>
            </TouchableOpacity>
          </View>
          <View style={[S.pipelineCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {[
              { label: "Novo",        count: leads.filter((l) => l.column === "novo").length,        color: "#6C63FF" },
              { label: "Qualificado", count: leads.filter((l) => l.column === "qualificado").length, color: "#FFB300" },
              { label: "Proposta",    count: leads.filter((l) => l.column === "proposta").length,    color: PINK },
              { label: "Fechado",     count: leads.filter((l) => l.column === "fechado").length,     color: "#00D68F" },
            ].map((col, i) => (
              <View key={i} style={S.pipelineCol}>
                <View style={[S.pipelineDot, { backgroundColor: col.color }]} />
                <Text style={[S.pipelineCount, { color: colors.text }]}>{col.count}</Text>
                <Text style={[S.pipelineLabel, { color: colors.mutedForeground }]}>{col.label}</Text>
                <View style={[S.pipelineBar, { backgroundColor: col.color + "33" }]}>
                  <View style={[S.pipelineBarFill, { backgroundColor: col.color, flex: col.count / (leads.length || 1) }]} />
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* ── Activity Feed ── */}
        <View style={S.section}>
          <View style={S.sectionHeader}>
            <Text style={[S.sectionTitle, { color: colors.text }]}>Atividade Recente</Text>
            <TouchableOpacity onPress={onRefresh} activeOpacity={0.7}>
              <Feather name="refresh-cw" size={14} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>
          <View style={[S.activityCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {activityEvents.slice(0, 6).map((item, i, arr) => {
              const color = activityColor(item.type, colors);
              return (
                <React.Fragment key={item.id}>
                  <View style={S.activityItem}>
                    <View style={[S.activityIconWrap, { backgroundColor: color + "22" }]}>
                      <ActivityIcon type={item.type} color={color} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[S.activityText, { color: colors.text }]} numberOfLines={2}>{item.text}</Text>
                      <Text style={[S.activityTime, { color: colors.mutedForeground }]}>{timeAgo(item.created_at)}</Text>
                    </View>
                  </View>
                  {i < arr.length - 1 && <View style={[S.activityDivider, { backgroundColor: colors.border }]} />}
                </React.Fragment>
              );
            })}
            {activityEvents.length === 0 && (
              <View style={{ padding: 20, alignItems: "center", gap: 8 }}>
                <Feather name="activity" size={22} color={colors.mutedForeground} />
                <Text style={{ color: colors.mutedForeground, fontSize: 13, fontFamily: "SpaceGrotesk_400Regular" }}>Nenhuma atividade ainda</Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Plan Gate Modal */}
      <PlanGateModal
        visible={gateVisible} plan={gatePlan} featureName={gateFeature}
        onClose={() => setGateVisible(false)}
        onUpgrade={() => { setGateVisible(false); router.push("/plano" as any); }}
      />
    </>
  );
}

const S = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingBottom: 12 },
  greeting:   { fontSize: 13, fontFamily: "SpaceGrotesk_400Regular" },
  name:       { fontSize: 22, fontFamily: "SpaceGrotesk_700Bold", marginTop: 1 },
  headerRight:{ flexDirection: "row", alignItems: "center", gap: 8 },
  headerBtn:  { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center", position: "relative" },
  notifDot:   { position: "absolute", top: 5, right: 5, width: 15, height: 15, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  notifDotText: { color: "#fff", fontSize: 9, fontFamily: "SpaceGrotesk_700Bold" },
  avatarBtn:  { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center" },

  sectionSmall: { fontSize: 10, fontFamily: "SpaceGrotesk_600SemiBold", letterSpacing: 1, paddingHorizontal: 20, marginBottom: 8 },

  moduleStrip: {
    flexDirection: "row", justifyContent: "space-evenly", alignItems: "flex-end",
    paddingHorizontal: 8, marginBottom: 20,
  },
  moduleCol: { alignItems: "center", gap: 5 },
  modBtn:    { width: MOD_BTN, height: MOD_BTN, borderRadius: MOD_BTN / 2, alignItems: "center", justifyContent: "center", borderWidth: 1.5 },
  modLabel:  { fontSize: 10, fontFamily: "SpaceGrotesk_500Medium" },
  lockDot:   { position: "absolute", top: 2, right: 2, width: 16, height: 16, borderRadius: 8, backgroundColor: "#1E1E2E", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "#2E2E3E" },
  planBadge: { position: "absolute", top: -2, left: 2, paddingHorizontal: 3, paddingVertical: 1, borderRadius: 4 },
  planBadgeText: { fontSize: 7, fontFamily: "SpaceGrotesk_700Bold", color: "#fff", letterSpacing: 0.4 },

  jadeModuleCol: { alignItems: "center", gap: 5 },
  jadeModLabel:  { fontSize: 12, fontFamily: "SpaceGrotesk_700Bold" },
  jadeSubLabel:  { fontSize: 9, fontFamily: "SpaceGrotesk_500Medium", color: PINK, opacity: 0.7, marginTop: -2 },

  metricsGrid: { flexDirection: "row", flexWrap: "wrap", paddingHorizontal: 12, gap: 8, marginBottom: 14 },
  metricCard:  { width: "47%", borderRadius: 12, borderWidth: 1, padding: 12, flexGrow: 1 },
  metricHeader:{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  metricIcon:  { width: 30, height: 30, borderRadius: 9, alignItems: "center", justifyContent: "center" },
  metricChange:{ flexDirection: "row", alignItems: "center", gap: 3, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  metricChangeText: { fontSize: 9, fontFamily: "SpaceGrotesk_600SemiBold" },
  metricValue: { fontSize: 20, fontFamily: "SpaceGrotesk_700Bold" },
  metricLabel: { fontSize: 11, fontFamily: "SpaceGrotesk_400Regular", marginTop: 2 },

  section:       { paddingHorizontal: 14, marginBottom: 14 },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  sectionTitle:  { fontSize: 15, fontFamily: "SpaceGrotesk_700Bold" },
  sectionLink:   { fontSize: 13, fontFamily: "SpaceGrotesk_500Medium" },

  pipelineCard:    { borderRadius: 12, borderWidth: 1, padding: 14, flexDirection: "row", gap: 8 },
  pipelineCol:     { flex: 1, alignItems: "center", gap: 3 },
  pipelineDot:     { width: 7, height: 7, borderRadius: 4 },
  pipelineCount:   { fontSize: 20, fontFamily: "SpaceGrotesk_700Bold" },
  pipelineLabel:   { fontSize: 10, fontFamily: "SpaceGrotesk_400Regular", textAlign: "center" },
  pipelineBar:     { width: "100%", height: 3, borderRadius: 2, marginTop: 3, flexDirection: "row" },
  pipelineBarFill: { height: 3, borderRadius: 2 },

  activityCard:    { borderRadius: 12, borderWidth: 1, overflow: "hidden" },
  activityItem:    { flexDirection: "row", gap: 10, padding: 12, alignItems: "flex-start" },
  activityIconWrap:{ width: 30, height: 30, borderRadius: 9, alignItems: "center", justifyContent: "center", marginTop: 1 },
  activityText:    { fontSize: 12, fontFamily: "SpaceGrotesk_400Regular", lineHeight: 18 },
  activityTime:    { fontSize: 11, fontFamily: "SpaceGrotesk_400Regular", marginTop: 2 },
  activityDivider: { height: StyleSheet.hairlineWidth, marginLeft: 52 },
});
