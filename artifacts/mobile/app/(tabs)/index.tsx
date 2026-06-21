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

// ─── Module button (small) ────────────────────────────────────────────────────
const BTN_SIZE  = 65;
const WRAP_SIZE = 79;

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
  const animatedBtnStyle = {
    shadowColor: glowColor,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: glowAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 8] }),
    shadowOpacity: glowAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 0.6] }),
    elevation: glowAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 8] }),
  };

  return (
    <TouchableOpacity onPress={locked ? onLockedPress : onPress} activeOpacity={0.75}
      style={[M.wrap, { width: WRAP_SIZE, height: WRAP_SIZE, overflow: "visible" }]}>
      <Animated.View style={[M.btn, animatedBtnStyle, {
        backgroundColor: colors.surface,
        borderColor: active && !locked ? glowColor + "80" : colors.border,
        opacity: locked ? 0.4 : 1,
      }]}>
        {children}
      </Animated.View>
      {locked && (
        <View style={M.lockOverlay}>
          <Feather name="lock" size={12} color="#AAAACC" />
        </View>
      )}
    </TouchableOpacity>
  );
}

const M = StyleSheet.create({
  wrap: { alignItems: "center", justifyContent: "center" },
  btn: { width: BTN_SIZE, height: BTN_SIZE, borderRadius: BTN_SIZE / 2, alignItems: "center", justifyContent: "center", borderWidth: 1.5 },
  lockOverlay: { position: "absolute", top: 4, right: 4, width: 20, height: 20, borderRadius: 10, backgroundColor: "#1E1E2E", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "#2E2E3E" },
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
    case "lead":     return <Feather name="user-plus" size={size} color={color} />;
    case "deal":     return <Feather name="briefcase" size={size} color={color} />;
    case "message":  return <MaterialCommunityIcons name="robot" size={size} color={color} />;
    case "task":     return <Feather name="calendar" size={size} color={color} />;
    case "scan":     return <Feather name="crosshair" size={size} color={color} />;
    case "campaign": return <Feather name="zap" size={size} color={color} />;
    case "module":   return <Feather name="settings" size={size} color={color} />;
    default:         return <Feather name="activity" size={size} color={color} />;
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

// ─── Module definitions (without jade — jade is the hero button) ──────────────
const MODULE_DEFS = [
  { name: "jade",       label: "JADE IA",  locked: false, plan: "", onMsg: "JADE ativa e respondendo leads automaticamente.", offMsg: "JADE pausada." },
  { name: "scanner",    label: "Radar",    locked: false, plan: "", onMsg: "JADE está buscando novos estabelecimentos próximos.", offMsg: "Scanner pausado." },
  { name: "leads",      label: "Leads",    locked: false, plan: "", onMsg: "Sincronização automática de leads ativada.", offMsg: "CRM em modo manual." },
  { name: "whatsapp",   label: "WhatsApp", locked: false, plan: "", onMsg: "WhatsApp configurado.", offMsg: "WhatsApp pausado." },
  { name: "marketing",  label: "Mkt",      locked: false, plan: "", onMsg: "Campanhas ativadas.", offMsg: "Marketing pausado." },
  { name: "gestao",     label: "Gestão",   locked: true,  plan: "Enterprise", onMsg: "", offMsg: "" },
  { name: "relatorios", label: "Relatórios", locked: true, plan: "Enterprise", onMsg: "", offMsg: "" },
];

// Module defs for the small button grid (excludes jade hero)
const GRID_MODULES = MODULE_DEFS.filter((d) => d.name !== "jade");

// ─── Voice Overlay ────────────────────────────────────────────────────────────
function VoiceOverlay({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const pulseAnim = useRef(new Animated.Value(0)).current;
  const [secs, setSecs] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const secsRef  = useRef(0);
  const router   = useRouter();

  useEffect(() => {
    if (visible) {
      secsRef.current = 0;
      setSecs(0);
      timerRef.current = setInterval(() => {
        secsRef.current += 1;
        setSecs(secsRef.current);
      }, 1000);
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1, duration: 700, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
          Animated.timing(pulseAnim, { toValue: 0, duration: 700, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
        ])
      ).start();
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      pulseAnim.setValue(0);
      setSecs(0);
      secsRef.current = 0;
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [visible]);

  const ringScale = pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.4] });
  const ringOpacity = pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [0.5, 0] });
  const mm = String(Math.floor(secs / 60)).padStart(2, "0");
  const ss = String(secs % 60).padStart(2, "0");

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={VO.overlay}>
        <View style={VO.content}>
          <Text style={VO.title}>Falando com a JADE...</Text>
          <Text style={VO.sub}>Solte para enviar · Deslize para cancelar</Text>

          <View style={VO.micWrap}>
            <Animated.View style={[VO.ring, { transform: [{ scale: ringScale }], opacity: ringOpacity }]} />
            <View style={VO.micCircle}>
              <Feather name="mic" size={42} color="#fff" />
            </View>
          </View>

          <Text style={VO.timer}>{mm}:{ss}</Text>

          <View style={VO.waveRow}>
            {[3, 7, 12, 8, 14, 6, 11, 5, 9, 4, 13, 7].map((h, i) => (
              <View key={i} style={[VO.wave, { height: h * 2.5 }]} />
            ))}
          </View>

          <TouchableOpacity style={VO.cancelBtn} onPress={onClose} activeOpacity={0.8}>
            <Feather name="x" size={20} color="#fff" />
            <Text style={VO.cancelText}>Cancelar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const VO = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.92)", alignItems: "center", justifyContent: "center" },
  content: { alignItems: "center", gap: 20, paddingHorizontal: 40 },
  title: { fontSize: 22, fontFamily: "SpaceGrotesk_700Bold", color: "#fff", textAlign: "center" },
  sub: { fontSize: 13, fontFamily: "SpaceGrotesk_400Regular", color: "#AAAACC", textAlign: "center" },
  micWrap: { position: "relative", width: 120, height: 120, alignItems: "center", justifyContent: "center" },
  ring: { position: "absolute", width: 120, height: 120, borderRadius: 60, borderWidth: 2, borderColor: PINK },
  micCircle: { width: 90, height: 90, borderRadius: 45, backgroundColor: PINK, alignItems: "center", justifyContent: "center",
    shadowColor: PINK, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.8, shadowRadius: 20, elevation: 12 },
  timer: { fontSize: 28, fontFamily: "SpaceGrotesk_700Bold", color: PINK },
  waveRow: { flexDirection: "row", alignItems: "center", gap: 4, height: 40 },
  wave: { width: 4, borderRadius: 2, backgroundColor: PINK + "99" },
  cancelBtn: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 28, backgroundColor: "#222233" },
  cancelText: { color: "#fff", fontSize: 15, fontFamily: "SpaceGrotesk_500Medium" },
});

// ─── JADE Hero Button ─────────────────────────────────────────────────────────
function JADEHeroButton({ onPress, onVoiceStart, onVoiceEnd, colors }: {
  onPress: () => void;
  onVoiceStart: () => void;
  onVoiceEnd: () => void;
  colors: ReturnType<typeof useColors>;
}) {
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1, duration: 2000, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
        Animated.timing(glowAnim, { toValue: 0, duration: 2000, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
      ])
    ).start();
  }, []);

  const borderColor = glowAnim.interpolate({ inputRange: [0, 1], outputRange: [PINK + "44", PINK + "AA"] });
  const shadowRadius = glowAnim.interpolate({ inputRange: [0, 1], outputRange: [8, 20] });

  const voiceHoldRef = useRef(false);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        voiceHoldRef.current = false;
      },
      onPanResponderRelease: (_, gs) => {
        const isLongPress = gs.numberActiveTouches === 0;
        if (voiceHoldRef.current) {
          onVoiceEnd();
          voiceHoldRef.current = false;
        }
      },
      onPanResponderTerminate: () => {
        if (voiceHoldRef.current) {
          onVoiceEnd();
          voiceHoldRef.current = false;
        }
      },
    })
  ).current;

  return (
    <TouchableOpacity
      onPress={onPress}
      onLongPress={() => { onVoiceStart(); voiceHoldRef.current = true; }}
      delayLongPress={500}
      activeOpacity={0.85}
      style={H.heroWrap}
    >
      <Animated.View style={[H.heroBtn, { borderColor, shadowColor: PINK, shadowOpacity: 0.5, shadowRadius, shadowOffset: { width: 0, height: 0 }, elevation: 10 }]}>
        {/* gradient layers */}
        <View style={[H.heroGrad1, { backgroundColor: PURPLE + "18" }]} />
        <View style={[H.heroGrad2, { backgroundColor: PINK + "10" }]} />

        {/* content */}
        <View style={H.heroContent}>
          <View style={H.heroLeft}>
            <View style={[H.heroIconWrap, { backgroundColor: PINK + "22" }]}>
              <MaterialCommunityIcons name="robot" size={28} color={PINK} />
            </View>
            <View>
              <Text style={H.heroLabel}>JADE</Text>
              <Text style={H.heroSub}>Toque para conversar</Text>
            </View>
          </View>
          <View style={H.heroRight}>
            <View style={[H.micHint, { backgroundColor: PINK + "15", borderColor: PINK + "40" }]}>
              <Feather name="mic" size={14} color={PINK} />
              <Text style={[H.micHintText, { color: PINK }]}>Segure</Text>
            </View>
          </View>
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
}

const H = StyleSheet.create({
  heroWrap: { marginHorizontal: 16, marginBottom: 4 },
  heroBtn: {
    borderRadius: 22, borderWidth: 1.5, overflow: "hidden",
    backgroundColor: "#12091E",
  },
  heroGrad1: { position: "absolute", top: 0, left: 0, right: "40%", bottom: 0 },
  heroGrad2: { position: "absolute", top: 0, left: "40%", right: 0, bottom: 0 },
  heroContent: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 18, gap: 12 },
  heroLeft: { flexDirection: "row", alignItems: "center", gap: 14 },
  heroIconWrap: { width: 54, height: 54, borderRadius: 17, alignItems: "center", justifyContent: "center" },
  heroLabel: { fontSize: 22, fontFamily: "SpaceGrotesk_700Bold", color: "#fff" },
  heroSub: { fontSize: 12, fontFamily: "SpaceGrotesk_400Regular", color: "#AAAACC", marginTop: 2 },
  heroRight: { alignItems: "flex-end", gap: 6 },
  micHint: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, borderWidth: 1 },
  micHintText: { fontSize: 12, fontFamily: "SpaceGrotesk_600SemiBold" },
});

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function RadarScreen() {
  const colors  = useColors();
  const insets  = useSafeAreaInsets();
  const router  = useRouter();
  const { leads, conversations, moduleStates, activityEvents, toggleModule, refreshDashboard, addLead } = useApp();
  const [refreshing, setRefreshing]         = useState(false);
  const [lockModal, setLockModal]           = useState(false);
  const [lockedModuleName, setLockedModuleName] = useState("");
  const [voiceOverlay, setVoiceOverlay]     = useState(false);

  // ── Scanner autonomous mode ────────────────────────────────────────────────
  const [scannerRunning, setScannerRunning] = useState(false);
  const scannerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const existingLeadIds    = useRef<string[]>([]);

  useEffect(() => {
    existingLeadIds.current = leads.map((l) => l.id);
  }, [leads]);

  const scannerActive = !(MODULE_DEFS.find((d) => d.name === "scanner")?.locked ?? false)
    && (moduleStates.scanner?.is_active ?? false);

  useEffect(() => {
    if (scannerActive) {
      setScannerRunning(true);
      const doProspectar = async () => {
        try {
          const res = await fetch(`${API_BASE}/api/jade/prospectar`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ existingIds: existingLeadIds.current }),
          });
          if (!res.ok) return;
          const data = (await res.json()) as { leads: any[]; count: number };
          if (data.leads?.length > 0) {
            for (const lead of data.leads) {
              addLead(lead);
              existingLeadIds.current = [...existingLeadIds.current, lead.id];
            }
          }
        } catch { /* ignore */ }
      };
      doProspectar();
      scannerIntervalRef.current = setInterval(doProspectar, 60000);
      return () => { if (scannerIntervalRef.current) clearInterval(scannerIntervalRef.current); setScannerRunning(false); };
    } else {
      if (scannerIntervalRef.current) clearInterval(scannerIntervalRef.current);
      setScannerRunning(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scannerActive]);

  const topPad    = Platform.OS === "web" ? 67  : insets.top;
  const bottomPad = Platform.OS === "web" ? 84  : insets.bottom + 60;
  const unread    = conversations.filter((c) => c.unread > 0).length;

  // ── Metrics ────────────────────────────────────────────────────────────────
  const totalLeads    = leads.length;
  const novoLeads     = leads.filter((l) => l.column === "novo").length;
  const fechadoLeads  = leads.filter((l) => l.column === "fechado");
  const txConversao   = totalLeads > 0 ? Math.round((fechadoLeads.length / totalLeads) * 100) : 0;
  const receitaMes    = fechadoLeads.reduce((sum, l) => sum + l.value, 0);
  const conversasAtivas = conversations.filter((c) => c.unread > 0).length;

  function formatCurrency(v: number) {
    if (v >= 1000) return `R$${(v / 1000).toFixed(1)}k`;
    return `R$${v.toLocaleString("pt-BR")}`;
  }

  const METRICS = [
    { label: "Leads Ativos",       value: String(novoLeads),          change: `${totalLeads} total`,             positive: true,               icon: "users",          iconColor: "#6C63FF" },
    { label: "Conv. não lidas",    value: String(conversasAtivas),    change: `${conversations.length} total`,   positive: conversasAtivas > 0, icon: "message-circle", iconColor: PINK },
    { label: "Tx. Conversão",      value: `${txConversao}%`,          change: `${fechadoLeads.length} fechados`, positive: txConversao > 20,    icon: "trending-up",    iconColor: "#00D68F" },
    { label: "Receita Fechada",    value: formatCurrency(receitaMes), change: `${fechadoLeads.length} contratos`, positive: true,              icon: "dollar-sign",    iconColor: "#FFB300" },
  ] as const;

  const activeModuleNames = Object.values(moduleStates)
    .filter((m) => m.is_active)
    .map((m) => MODULE_DEFS.find((d) => d.name === m.module_name)?.label ?? m.module_name);

  const handleToggle = async (name: string) => {
    const def = MODULE_DEFS.find((d) => d.name === name);
    if (!def || def.locked) return;
    await toggleModule(name);
  };

  const handleLockedPress = (name: string) => { setLockedModuleName(name); setLockModal(true); };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshDashboard();
    setRefreshing(false);
  }, [refreshDashboard]);

  const lockedDef = MODULE_DEFS.find((d) => d.name === lockedModuleName);

  // ── Navigate to JADE tab ───────────────────────────────────────────────────
  const goToJade = () => router.push("/(tabs)/jade" as any);

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

        {/* ── JADE Hero Button ── */}
        <View style={S.heroSection}>
          <JADEHeroButton
            colors={colors}
            onPress={goToJade}
            onVoiceStart={() => setVoiceOverlay(true)}
            onVoiceEnd={() => {
              setVoiceOverlay(false);
              goToJade();
            }}
          />
          <Text style={[S.heroHint, { color: colors.mutedForeground }]}>
            Segure para falar · Toque para conversar
          </Text>
        </View>

        {/* ── Module buttons (grid) ── */}
        <Text style={[S.gridTitle, { color: colors.mutedForeground }]}>MÓDULOS DE ATIVAÇÃO</Text>
        <ScrollView
          horizontal showsHorizontalScrollIndicator={false}
          contentContainerStyle={S.modulesRow} style={S.modulesScroll}
        >
          {GRID_MODULES.map((def) => {
            const mod = moduleStates[def.name];
            const active = def.locked ? false : (mod?.is_active ?? false);
            return (
              <View key={def.name} style={{ alignItems: "center", gap: 6 }}>
                <ModuleBtn
                  active={active} locked={def.locked}
                  color={def.locked ? PURPLE : undefined}
                  onPress={() => {
                    if (def.name === "scanner")   { handleToggle("scanner"); }
                    else if (def.name === "leads") { router.push("/leads" as any); }
                    else if (def.name === "whatsapp") { handleToggle("whatsapp"); }
                    else if (def.name === "marketing") { router.push("/marketing" as any); }
                    else { handleToggle(def.name); }
                  }}
                  onLockedPress={() => handleLockedPress(def.name)}
                  colors={colors}
                >
                  {def.name === "scanner"    && <CrosshairIcon size={27} color={def.locked ? "#5555AA" : PINK} />}
                  {def.name === "leads"      && <Feather name="users" size={25} color={def.locked ? "#5555AA" : PINK} />}
                  {def.name === "whatsapp"   && <Feather name="message-circle" size={25} color={def.locked ? "#5555AA" : PINK} />}
                  {def.name === "marketing"  && <Feather name="zap" size={25} color={def.locked ? "#5555AA" : PINK} />}
                  {def.name === "gestao"     && <Feather name="briefcase" size={25} color="#5555AA" />}
                  {def.name === "relatorios" && <Feather name="bar-chart-2" size={25} color="#5555AA" />}
                </ModuleBtn>
                <Text style={[S.moduleLabel, {
                  color: def.locked ? "#5555AA" : (active ? PINK : colors.mutedForeground),
                  marginTop: WRAP_SIZE / 2,
                }]}>
                  {def.label}
                </Text>
              </View>
            );
          })}

          {/* Rota shortcut */}
          <View style={{ alignItems: "center", gap: 6 }}>
            <TouchableOpacity style={[M.wrap, { width: WRAP_SIZE, height: WRAP_SIZE, overflow: "visible" }]}
              onPress={() => router.push("/criarrota" as any)} activeOpacity={0.75}>
              <View style={[M.btn, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Feather name="navigation" size={25} color={PINK} />
              </View>
            </TouchableOpacity>
            <Text style={[S.moduleLabel, { color: colors.mutedForeground, marginTop: WRAP_SIZE / 2 }]}>Rota</Text>
          </View>
        </ScrollView>

        <Text style={[S.activeLabel, { color: colors.mutedForeground }]}>
          {activeModuleNames.length > 0 ? (
            <><Text style={{ color: PINK }}>●{"  "}</Text>{activeModuleNames.join(" · ") + " ativos"}</>
          ) : (
            <Text>Nenhum módulo ativo</Text>
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
                <View style={[S.metricChange, { backgroundColor: m.positive ? "#00D68F22" : "#FF3B5C22" }]}>
                  <Feather name={m.positive ? "trending-up" : "trending-down"} size={10} color={m.positive ? colors.success : colors.destructive} />
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
              <Feather name="refresh-cw" size={15} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>
          <View style={[S.activityCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {activityEvents.slice(0, 8).map((item, i, arr) => {
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
              <View style={{ padding: 20, alignItems: "center" }}>
                <Feather name="activity" size={24} color={colors.mutedForeground} />
                <Text style={[{ color: colors.mutedForeground, fontSize: 13, marginTop: 8, fontFamily: "SpaceGrotesk_400Regular" }]}>
                  Nenhuma atividade ainda
                </Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      {/* ── Voice Overlay ── */}
      <VoiceOverlay visible={voiceOverlay} onClose={() => setVoiceOverlay(false)} />

      {/* ── Enterprise Lock Modal ── */}
      <Modal visible={lockModal} transparent animationType="fade" onRequestClose={() => setLockModal(false)}>
        <TouchableOpacity style={S.modalOverlay} activeOpacity={1} onPress={() => setLockModal(false)}>
          <View style={S.modalBox} onStartShouldSetResponder={() => true}>
            <View style={S.modalIconWrap}><Feather name="lock" size={30} color={PINK} /></View>
            <Text style={S.modalTitle}>Módulo Enterprise</Text>
            <Text style={S.modalBody}>
              O módulo <Text style={{ color: PINK, fontFamily: "SpaceGrotesk_600SemiBold" }}>{lockedDef?.label}</Text> é exclusivo do Plano Enterprise.{"\n\n"}Desbloqueie e gerencie seu time comercial completo.
            </Text>
            <TouchableOpacity style={S.modalPrimaryBtn} activeOpacity={0.85}
              onPress={() => { setLockModal(false); router.push("/plano" as any); }}>
              <Feather name="zap" size={16} color="#fff" />
              <Text style={S.modalPrimaryText}>Ver Planos</Text>
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
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingBottom: 12 },
  greeting: { fontSize: 14, fontFamily: "SpaceGrotesk_400Regular" },
  name:     { fontSize: 24, fontFamily: "SpaceGrotesk_700Bold", marginTop: 2 },
  headerRight: { flexDirection: "row", alignItems: "center", gap: 10 },
  headerBtn: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center", position: "relative" },
  notifDot: { position: "absolute", top: 6, right: 6, width: 16, height: 16, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  notifDotText: { color: "#fff", fontSize: 9, fontFamily: "SpaceGrotesk_700Bold" },
  avatarBtn: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  heroSection: { marginBottom: 16 },
  heroHint: { textAlign: "center", fontSize: 11, fontFamily: "SpaceGrotesk_400Regular", marginTop: 8 },
  gridTitle: { fontSize: 11, fontFamily: "SpaceGrotesk_600SemiBold", letterSpacing: 1, paddingHorizontal: 20, marginBottom: 6 },
  modulesScroll: { marginBottom: 4 },
  modulesRow: { paddingHorizontal: 16, paddingVertical: 8, gap: 14, flexDirection: "row", alignItems: "flex-start" },
  moduleLabel: { fontSize: 10, fontFamily: "SpaceGrotesk_500Medium", textAlign: "center" },
  activeLabel: { fontSize: 12, fontFamily: "SpaceGrotesk_400Regular", paddingHorizontal: 20, marginBottom: 16 },
  metricsGrid: { flexDirection: "row", flexWrap: "wrap", paddingHorizontal: 12, gap: 10, marginBottom: 16 },
  metricCard: { width: "47%", borderRadius: 14, borderWidth: 1, padding: 14, flexGrow: 1 },
  metricHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  metricIcon: { width: 34, height: 34, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  metricChange: { flexDirection: "row", alignItems: "center", gap: 3, paddingHorizontal: 7, paddingVertical: 3, borderRadius: 8 },
  metricChangeText: { fontSize: 10, fontFamily: "SpaceGrotesk_600SemiBold" },
  metricValue:  { fontSize: 22, fontFamily: "SpaceGrotesk_700Bold" },
  metricLabel:  { fontSize: 12, fontFamily: "SpaceGrotesk_400Regular", marginTop: 2 },
  section: { paddingHorizontal: 16, marginBottom: 16 },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  sectionTitle: { fontSize: 17, fontFamily: "SpaceGrotesk_700Bold" },
  sectionLink:  { fontSize: 14, fontFamily: "SpaceGrotesk_500Medium" },
  pipelineCard: { borderRadius: 14, borderWidth: 1, padding: 16, flexDirection: "row", gap: 8 },
  pipelineCol:     { flex: 1, alignItems: "center", gap: 4 },
  pipelineDot:     { width: 8, height: 8, borderRadius: 4 },
  pipelineCount:   { fontSize: 22, fontFamily: "SpaceGrotesk_700Bold" },
  pipelineLabel:   { fontSize: 11, fontFamily: "SpaceGrotesk_400Regular", textAlign: "center" },
  pipelineBar:     { width: "100%", height: 4, borderRadius: 2, marginTop: 4, flexDirection: "row" },
  pipelineBarFill: { height: 4, borderRadius: 2 },
  activityCard:     { borderRadius: 14, borderWidth: 1, overflow: "hidden" },
  activityItem:     { flexDirection: "row", gap: 12, padding: 14, alignItems: "flex-start" },
  activityIconWrap: { width: 32, height: 32, borderRadius: 10, alignItems: "center", justifyContent: "center", marginTop: 1 },
  activityText:     { fontSize: 13, fontFamily: "SpaceGrotesk_400Regular", lineHeight: 19, flex: 1 },
  activityTime:     { fontSize: 12, fontFamily: "SpaceGrotesk_400Regular", marginTop: 3 },
  activityDivider:  { height: StyleSheet.hairlineWidth, marginLeft: 58 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.75)", alignItems: "center", justifyContent: "center", padding: 24 },
  modalBox: { backgroundColor: "#111118", borderRadius: 24, padding: 28, alignItems: "center", width: "100%", borderWidth: 1, borderColor: "#1E1E2E", gap: 12 },
  modalIconWrap: { width: 64, height: 64, borderRadius: 32, backgroundColor: "#FF008018", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "#FF008044", marginBottom: 4 },
  modalTitle: { fontSize: 20, fontFamily: "SpaceGrotesk_700Bold", color: "#FFFFFF", textAlign: "center" },
  modalBody: { fontSize: 14, fontFamily: "SpaceGrotesk_400Regular", color: "#AAAACC", textAlign: "center", lineHeight: 22, marginBottom: 8 },
  modalPrimaryBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: PINK, borderRadius: 14, height: 50, width: "100%" },
  modalPrimaryText: { fontSize: 16, fontFamily: "SpaceGrotesk_700Bold", color: "#fff" },
  modalSecondaryBtn: { paddingVertical: 10 },
  modalSecondaryText: { fontSize: 14, fontFamily: "SpaceGrotesk_500Medium", color: "#7777AA" },
});
