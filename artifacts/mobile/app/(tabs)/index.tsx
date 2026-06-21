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

// ─── Crosshair icon ───────────────────────────────────────────────────────────
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

// ─── Module button ─────────────────────────────────────────────────────────────
const BTN_SIZE  = 60;
const WRAP_SIZE = 70;

function ModuleBtn({
  active, locked, onPress, onLockedPress, children, color, colors,
}: {
  active: boolean; locked?: boolean; onPress: () => void; onLockedPress?: () => void;
  children: React.ReactNode; color?: string; colors: ReturnType<typeof useColors>;
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
    <TouchableOpacity onPress={locked ? onLockedPress : onPress} activeOpacity={0.75}
      style={{ alignItems: "center", justifyContent: "center", width: WRAP_SIZE, height: WRAP_SIZE }}>
      <Animated.View style={[M.btn, {
        backgroundColor: colors.surface,
        borderColor: active && !locked ? glowColor + "80" : colors.border,
        opacity: locked ? 0.4 : 1,
        shadowColor: glowColor,
        shadowOffset: { width: 0, height: 0 },
        shadowRadius: glowAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 8] }),
        shadowOpacity: glowAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 0.6] }),
        elevation: glowAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 8] }),
      }]}>
        {children}
      </Animated.View>
      {locked && (
        <View style={M.lockOverlay}>
          <Feather name="lock" size={9} color="#AAAACC" />
        </View>
      )}
    </TouchableOpacity>
  );
}

const M = StyleSheet.create({
  btn: { width: BTN_SIZE, height: BTN_SIZE, borderRadius: BTN_SIZE / 2, alignItems: "center", justifyContent: "center", borderWidth: 1.5 },
  lockOverlay: { position: "absolute", top: 3, right: 3, width: 17, height: 17, borderRadius: 9, backgroundColor: "#1E1E2E", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "#2E2E3E" },
});

// ─── JADE Compact Button with energizing rings ────────────────────────────────
const JADE_BTN = 80;

function JADECompactButton({ onTap, onHoldEnd }: {
  onTap: () => void;
  onHoldEnd: (duration: number) => void;
}) {
  const ring1      = useRef(new Animated.Value(0)).current;
  const ring2      = useRef(new Animated.Value(0)).current;
  const ring3      = useRef(new Animated.Value(0)).current;
  const btnScale   = useRef(new Animated.Value(1)).current;
  const borderGlow = useRef(new Animated.Value(0)).current;

  const isHoldingRef   = useRef(false);
  const holdTimerRef   = useRef<ReturnType<typeof setTimeout> | null>(null);
  const holdStartRef   = useRef(0);
  const holdStuff      = useRef<{
    timers: ReturnType<typeof setTimeout>[];
    loops:  ReturnType<typeof Animated.loop>[];
  }>({ timers: [], loops: [] });

  // Always-fresh callback refs so PanResponder doesn't go stale
  const callbacksRef = useRef({ onTap, onHoldEnd });
  callbacksRef.current = { onTap, onHoldEnd };

  const stopEnergize = () => {
    isHoldingRef.current = false;
    holdStuff.current.timers.forEach(clearTimeout);
    holdStuff.current.loops.forEach((l) => l.stop());
    holdStuff.current = { timers: [], loops: [] };
    ring1.setValue(0);
    ring2.setValue(0);
    ring3.setValue(0);
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
          launchRing(ring2, 370);
          launchRing(ring3, 740);

          const pulse = Animated.loop(
            Animated.sequence([
              Animated.timing(btnScale, { toValue: 1.1,  duration: 400, useNativeDriver: false }),
              Animated.timing(btnScale, { toValue: 1.0,  duration: 400, useNativeDriver: false }),
            ])
          );
          pulse.start();
          holdStuff.current.loops.push(pulse);
          Animated.timing(borderGlow, { toValue: 1, duration: 260, useNativeDriver: false }).start();
        }, 420);
      },
      onPanResponderRelease: () => {
        if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
        const wasHolding = isHoldingRef.current;
        const duration   = wasHolding && holdStartRef.current > 0
          ? Math.max(1, Math.floor((Date.now() - holdStartRef.current) / 1000))
          : 0;
        stopEnergize();
        if (wasHolding) {
          callbacksRef.current.onHoldEnd(duration);
        } else {
          callbacksRef.current.onTap();
        }
      },
      onPanResponderTerminate: () => {
        if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
        stopEnergize();
      },
    })
  ).current;

  const makeRingStyle = (anim: Animated.Value) => ({
    transform: [{ scale: anim.interpolate({ inputRange: [0, 1], outputRange: [1, 3.0] }) }],
    opacity:   anim.interpolate({ inputRange: [0, 0.4, 1], outputRange: [0.55, 0.22, 0] }),
  });

  const btnBorderColor = borderGlow.interpolate({
    inputRange: [0, 1], outputRange: [PINK + "50", PINK + "EE"],
  });

  return (
    // Container is exactly button-sized; rings overflow visually (overflow:"visible" is default on RN)
    <View style={{ alignItems: "center", justifyContent: "center", width: JADE_BTN, height: JADE_BTN }}>
      {/* Rings — absolute, don't affect layout */}
      <Animated.View style={[JB.ring, { position: "absolute" }, makeRingStyle(ring1)]} pointerEvents="none" />
      <Animated.View style={[JB.ring, { position: "absolute" }, makeRingStyle(ring2)]} pointerEvents="none" />
      <Animated.View style={[JB.ring, { position: "absolute" }, makeRingStyle(ring3)]} pointerEvents="none" />

      {/* Button */}
      <View {...panResponder.panHandlers}>
        <Animated.View style={[JB.btn, {
          transform: [{ scale: btnScale }],
          borderColor: btnBorderColor,
          shadowColor: PINK,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.5,
          shadowRadius: 14,
          elevation: 10,
        }]}>
          <MaterialCommunityIcons name="robot" size={34} color={PINK} />
        </Animated.View>
      </View>
    </View>
  );
}

const JB = StyleSheet.create({
  ring: {
    position: "absolute",
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
    case "lead":     return <Feather name="user-plus"     size={size} color={color} />;
    case "deal":     return <Feather name="briefcase"     size={size} color={color} />;
    case "message":  return <MaterialCommunityIcons name="robot" size={size} color={color} />;
    case "task":     return <Feather name="calendar"      size={size} color={color} />;
    case "scan":     return <Feather name="crosshair"     size={size} color={color} />;
    case "campaign": return <Feather name="zap"           size={size} color={color} />;
    case "module":   return <Feather name="settings"      size={size} color={color} />;
    default:         return <Feather name="activity"      size={size} color={color} />;
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
const MODULE_DEFS = [
  { name: "scanner",    label: "Radar",      locked: false, plan: "" },
  { name: "leads",      label: "Leads",      locked: false, plan: "" },
  { name: "whatsapp",   label: "WhatsApp",   locked: false, plan: "" },
  { name: "marketing",  label: "Mkt",        locked: false, plan: "" },
  { name: "gestao",     label: "Gestão",     locked: true,  plan: "Enterprise" },
  { name: "relatorios", label: "Relatórios", locked: true,  plan: "Enterprise" },
];

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function HomeScreen() {
  const colors  = useColors();
  const insets  = useSafeAreaInsets();
  const router  = useRouter();
  const { leads, conversations, moduleStates, activityEvents, toggleModule, refreshDashboard, addLead } = useApp();
  const [refreshing, setRefreshing]             = useState(false);
  const [lockModal, setLockModal]               = useState(false);
  const [lockedModuleName, setLockedModuleName] = useState("");

  // ── Scanner autonomous mode ────────────────────────────────────────────────
  const existingLeadIds = useRef<string[]>([]);
  useEffect(() => { existingLeadIds.current = leads.map((l) => l.id); }, [leads]);

  const scannerActive = !(MODULE_DEFS.find((d) => d.name === "scanner")?.locked ?? false)
    && (moduleStates.scanner?.is_active ?? false);

  useEffect(() => {
    if (!scannerActive) return;
    const doProspectar = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/jade/prospectar`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ existingIds: existingLeadIds.current }),
        });
        if (!res.ok) return;
        const data = (await res.json()) as { leads: any[] };
        for (const lead of (data.leads ?? [])) {
          addLead(lead);
          existingLeadIds.current = [...existingLeadIds.current, lead.id];
        }
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

  // ── Metrics ────────────────────────────────────────────────────────────────
  const novoLeads       = leads.filter((l) => l.column === "novo").length;
  const fechadoLeads    = leads.filter((l) => l.column === "fechado");
  const txConversao     = leads.length > 0 ? Math.round((fechadoLeads.length / leads.length) * 100) : 0;
  const receitaMes      = fechadoLeads.reduce((s, l) => s + l.value, 0);
  const conversasAtivas = conversations.filter((c) => c.unread > 0).length;

  const fmt = (v: number) => v >= 1000 ? `R$${(v / 1000).toFixed(1)}k` : `R$${v.toLocaleString("pt-BR")}`;

  const METRICS = [
    { label: "Leads Ativos",    value: String(novoLeads),          change: `${leads.length} total`,             positive: true,               icon: "users",          iconColor: "#6C63FF" },
    { label: "Conv. não lidas", value: String(conversasAtivas),    change: `${conversations.length} total`,     positive: conversasAtivas > 0, icon: "message-circle", iconColor: PINK },
    { label: "Tx. Conversão",   value: `${txConversao}%`,          change: `${fechadoLeads.length} fechados`,   positive: txConversao > 20,    icon: "trending-up",    iconColor: "#00D68F" },
    { label: "Receita Fechada", value: fmt(receitaMes),            change: `${fechadoLeads.length} contratos`,  positive: true,               icon: "dollar-sign",    iconColor: "#FFB300" },
  ] as const;

  const activeModuleNames = Object.values(moduleStates)
    .filter((m) => m.is_active)
    .map((m) => MODULE_DEFS.find((d) => d.name === m.module_name)?.label ?? m.module_name);

  const handleToggle    = async (name: string) => {
    const def = MODULE_DEFS.find((d) => d.name === name);
    if (!def || def.locked) return;
    await toggleModule(name);
  };
  const handleLockedPress = (name: string) => { setLockedModuleName(name); setLockModal(true); };
  const onRefresh = useCallback(async () => { setRefreshing(true); await refreshDashboard(); setRefreshing(false); }, [refreshDashboard]);
  const lockedDef = MODULE_DEFS.find((d) => d.name === lockedModuleName);
  const goToJade  = () => router.push("/(tabs)/jade" as any);

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

        {/* ── Módulos de Ativação ── */}
        <Text style={[S.sectionSmall, { color: colors.mutedForeground }]}>MÓDULOS DE ATIVAÇÃO</Text>
        <ScrollView
          horizontal showsHorizontalScrollIndicator={false}
          contentContainerStyle={S.modulesRow}
        >
          {MODULE_DEFS.map((def) => {
            const mod    = moduleStates[def.name];
            const active = def.locked ? false : (mod?.is_active ?? false);
            return (
              <View key={def.name} style={S.moduleItem}>
                <ModuleBtn
                  active={active} locked={def.locked}
                  color={def.locked ? PURPLE : undefined}
                  onPress={() => {
                    if (def.name === "scanner")    handleToggle("scanner");
                    else if (def.name === "leads") router.push("/leads" as any);
                    else if (def.name === "whatsapp") handleToggle("whatsapp");
                    else if (def.name === "marketing") router.push("/marketing" as any);
                    else handleToggle(def.name);
                  }}
                  onLockedPress={() => handleLockedPress(def.name)}
                  colors={colors}
                >
                  {def.name === "scanner"    && <CrosshairIcon size={24} color={def.locked ? "#5555AA" : PINK} />}
                  {def.name === "leads"      && <Feather name="users"       size={22} color={def.locked ? "#5555AA" : PINK} />}
                  {def.name === "whatsapp"   && <Feather name="message-circle" size={22} color={def.locked ? "#5555AA" : PINK} />}
                  {def.name === "marketing"  && <Feather name="zap"         size={22} color={def.locked ? "#5555AA" : PINK} />}
                  {def.name === "gestao"     && <Feather name="briefcase"   size={22} color="#5555AA" />}
                  {def.name === "relatorios" && <Feather name="bar-chart-2" size={22} color="#5555AA" />}
                </ModuleBtn>
                {/* PRO/Enterprise badge */}
                {def.locked && (
                  <View style={S.planBadge}>
                    <Text style={S.planBadgeText}>{def.plan === "Enterprise" ? "ENT" : "PRO"}</Text>
                  </View>
                )}
                <Text style={[S.moduleLabel, { color: def.locked ? "#5555AA" : (active ? PINK : colors.mutedForeground) }]}>
                  {def.label}
                </Text>
              </View>
            );
          })}

          {/* Rota shortcut */}
          <View style={S.moduleItem}>
            <TouchableOpacity style={{ alignItems: "center", justifyContent: "center", width: WRAP_SIZE, height: WRAP_SIZE }}
              onPress={() => router.push("/criarrota" as any)} activeOpacity={0.75}>
              <View style={[M.btn, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Feather name="navigation" size={22} color={PINK} />
              </View>
            </TouchableOpacity>
            <Text style={[S.moduleLabel, { color: colors.mutedForeground }]}>Rota</Text>
          </View>
        </ScrollView>

        {/* Active modules line */}
        {activeModuleNames.length > 0 && (
          <Text style={[S.activeLabel, { color: colors.mutedForeground }]}>
            <Text style={{ color: PINK }}>●{"  "}</Text>
            {activeModuleNames.join(" · ") + " ativos"}
          </Text>
        )}

        {/* ── JADE Compact Button ── */}
        <View style={S.jadeSection}>
          <JADECompactButton
            onTap={goToJade}
            onHoldEnd={(duration) => {
              setPendingVoice(duration);
              goToJade();
            }}
          />
          <Text style={[S.jadeHint, { color: colors.mutedForeground }]}>
            Segure para falar · Toque para conversar
          </Text>
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

        {/* ── Pipeline Summary ── */}
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
                <Text style={{ color: colors.mutedForeground, fontSize: 13, fontFamily: "SpaceGrotesk_400Regular" }}>
                  Nenhuma atividade ainda
                </Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      {/* ── Enterprise Lock Modal ── */}
      <Modal visible={lockModal} transparent animationType="fade" onRequestClose={() => setLockModal(false)}>
        <TouchableOpacity style={S.modalOverlay} activeOpacity={1} onPress={() => setLockModal(false)}>
          <View style={S.modalBox} onStartShouldSetResponder={() => true}>
            <View style={S.modalIconWrap}>
              <Feather name="lock" size={28} color={PINK} />
            </View>
            <Text style={S.modalTitle}>Módulo {lockedDef?.plan ?? "Enterprise"}</Text>
            <Text style={S.modalBody}>
              <Text style={{ color: PINK, fontFamily: "SpaceGrotesk_600SemiBold" }}>{lockedDef?.label}</Text>
              {" "}é exclusivo do Plano {lockedDef?.plan ?? "Enterprise"}.{"\n\n"}Desbloqueie para acessar todas as funcionalidades avançadas de gestão comercial.
            </Text>
            <TouchableOpacity style={S.modalPrimaryBtn} activeOpacity={0.85}
              onPress={() => { setLockModal(false); router.push("/plano" as any); }}>
              <Feather name="zap" size={15} color="#fff" />
              <Text style={S.modalPrimaryText}>Ver Planos e Assinar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={S.modalSecondaryBtn} onPress={() => setLockModal(false)} activeOpacity={0.7}>
              <Text style={S.modalSecondaryText}>Agora não</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

const S = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 20, paddingBottom: 12,
  },
  greeting: { fontSize: 13, fontFamily: "SpaceGrotesk_400Regular" },
  name:     { fontSize: 22, fontFamily: "SpaceGrotesk_700Bold", marginTop: 1 },
  headerRight: { flexDirection: "row", alignItems: "center", gap: 8 },
  headerBtn:   { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center", position: "relative" },
  notifDot:    { position: "absolute", top: 5, right: 5, width: 15, height: 15, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  notifDotText:{ color: "#fff", fontSize: 9, fontFamily: "SpaceGrotesk_700Bold" },
  avatarBtn:   { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center" },

  sectionSmall: { fontSize: 10, fontFamily: "SpaceGrotesk_600SemiBold", letterSpacing: 1, paddingHorizontal: 20, marginBottom: 8 },
  modulesRow:   { paddingHorizontal: 16, paddingVertical: 4, gap: 12, flexDirection: "row", alignItems: "flex-start" },
  moduleItem:   { alignItems: "center", gap: 4 },
  moduleLabel:  { fontSize: 10, fontFamily: "SpaceGrotesk_500Medium", textAlign: "center" },
  planBadge:    { position: "absolute", top: 0, right: 0, backgroundColor: PURPLE + "CC", borderRadius: 4, paddingHorizontal: 3, paddingVertical: 1 },
  planBadgeText:{ fontSize: 7, fontFamily: "SpaceGrotesk_700Bold", color: "#fff", letterSpacing: 0.5 },
  activeLabel:  { fontSize: 11, fontFamily: "SpaceGrotesk_400Regular", paddingHorizontal: 20, marginTop: 6, marginBottom: 0 },

  jadeSection: { alignItems: "center", marginTop: 22, marginBottom: 20, gap: 8 },
  jadeHint:    { fontSize: 11, fontFamily: "SpaceGrotesk_400Regular", opacity: 0.5 },

  metricsGrid:  { flexDirection: "row", flexWrap: "wrap", paddingHorizontal: 12, gap: 8, marginBottom: 14 },
  metricCard:   { width: "47%", borderRadius: 12, borderWidth: 1, padding: 12, flexGrow: 1 },
  metricHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  metricIcon:   { width: 30, height: 30, borderRadius: 9, alignItems: "center", justifyContent: "center" },
  metricChange: { flexDirection: "row", alignItems: "center", gap: 3, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  metricChangeText: { fontSize: 9, fontFamily: "SpaceGrotesk_600SemiBold" },
  metricValue:  { fontSize: 20, fontFamily: "SpaceGrotesk_700Bold" },
  metricLabel:  { fontSize: 11, fontFamily: "SpaceGrotesk_400Regular", marginTop: 2 },

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

  activityCard:     { borderRadius: 12, borderWidth: 1, overflow: "hidden" },
  activityItem:     { flexDirection: "row", gap: 10, padding: 12, alignItems: "flex-start" },
  activityIconWrap: { width: 30, height: 30, borderRadius: 9, alignItems: "center", justifyContent: "center", marginTop: 1 },
  activityText:     { fontSize: 12, fontFamily: "SpaceGrotesk_400Regular", lineHeight: 18 },
  activityTime:     { fontSize: 11, fontFamily: "SpaceGrotesk_400Regular", marginTop: 2 },
  activityDivider:  { height: StyleSheet.hairlineWidth, marginLeft: 52 },

  modalOverlay:    { flex: 1, backgroundColor: "rgba(0,0,0,0.75)", alignItems: "center", justifyContent: "center", padding: 24 },
  modalBox:        { backgroundColor: "#111118", borderRadius: 22, padding: 26, alignItems: "center", width: "100%", borderWidth: 1, borderColor: "#1E1E2E", gap: 10 },
  modalIconWrap:   { width: 58, height: 58, borderRadius: 29, backgroundColor: "#FF008018", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "#FF008044", marginBottom: 2 },
  modalTitle:      { fontSize: 18, fontFamily: "SpaceGrotesk_700Bold", color: "#FFFFFF", textAlign: "center" },
  modalBody:       { fontSize: 13, fontFamily: "SpaceGrotesk_400Regular", color: "#AAAACC", textAlign: "center", lineHeight: 21, marginBottom: 6 },
  modalPrimaryBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: PINK, borderRadius: 13, height: 48, width: "100%" },
  modalPrimaryText:{ fontSize: 15, fontFamily: "SpaceGrotesk_700Bold", color: "#fff" },
  modalSecondaryBtn:  { paddingVertical: 8 },
  modalSecondaryText: { fontSize: 13, fontFamily: "SpaceGrotesk_500Medium", color: "#7777AA" },
});
