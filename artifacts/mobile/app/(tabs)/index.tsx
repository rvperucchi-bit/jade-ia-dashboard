import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  Platform,
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

const API_BASE = Platform.OS === "web" ? "" : `https://${process.env.EXPO_PUBLIC_DOMAIN ?? ""}`;
const PINK   = "#FF0080";
const PURPLE = "#8400FF";

// ─── CrosshairIcon ────────────────────────────────────────────────────────────
function CrosshairIcon({ size, color }: { size: number; color: string }) {
  const s = 2; const ll = size * 0.22; const r = (size - s) / 2;
  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
      <View style={{ position: "absolute", width: size-s, height: size-s, borderRadius: r, borderWidth: s, borderColor: color }} />
      <View style={{ position: "absolute", width: 4, height: 4, borderRadius: 2, backgroundColor: color }} />
      <View style={{ position: "absolute", top: s/2, left: (size-s)/2, width: s, height: ll, backgroundColor: color }} />
      <View style={{ position: "absolute", bottom: s/2, left: (size-s)/2, width: s, height: ll, backgroundColor: color }} />
      <View style={{ position: "absolute", left: s/2, top: (size-s)/2, height: s, width: ll, backgroundColor: color }} />
      <View style={{ position: "absolute", right: s/2, top: (size-s)/2, height: s, width: ll, backgroundColor: color }} />
    </View>
  );
}

// ─── ModuleButton ─────────────────────────────────────────────────────────────
const MOD_SIZE = 56;

function ModuleButton({ icon, label, active, onPress }: {
  icon: React.ReactNode; label: string; active?: boolean; onPress: () => void;
}) {
  const colors = useColors();
  const glow = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (active) {
      const loop = Animated.loop(Animated.sequence([
        Animated.timing(glow, { toValue: 1, duration: 1400, useNativeDriver: false }),
        Animated.timing(glow, { toValue: 0, duration: 1400, useNativeDriver: false }),
      ]));
      loop.start();
      return () => loop.stop();
    } else {
      glow.setValue(0);
    }
  }, [active]);

  return (
    <TouchableOpacity style={S.modCol} onPress={onPress} activeOpacity={0.75}>
      <Animated.View style={[S.modBtn, {
        backgroundColor: colors.surface,
        borderColor: active ? PINK + "99" : colors.border,
        shadowColor: PINK,
        shadowRadius: glow.interpolate({ inputRange: [0,1], outputRange: [0, 8] }),
        shadowOpacity: glow.interpolate({ inputRange: [0,1], outputRange: [0, 0.5] }),
        elevation: glow.interpolate({ inputRange: [0,1], outputRange: [0, 5] }),
      }]}>
        {icon}
      </Animated.View>
      <Text style={[S.modLabel, { color: active ? PINK : colors.mutedForeground }]}>{label}</Text>
    </TouchableOpacity>
  );
}

// ─── Activity helpers ─────────────────────────────────────────────────────────
function activityColor(type: ActivityEvent["type"], colors: ReturnType<typeof useColors>) {
  const map: Record<string, string> = {
    lead: "#6C63FF", deal: colors.success, message: colors.primary,
    task: "#FFB300", scan: "#6C63FF", campaign: "#FFB300", module: colors.primary,
  };
  return map[type] ?? colors.mutedForeground;
}

function ActivityIcon({ type, color }: { type: ActivityEvent["type"]; color: string }) {
  const sz = 14;
  if (type === "lead")     return <Feather name="user-plus"     size={sz} color={color} />;
  if (type === "deal")     return <Feather name="briefcase"     size={sz} color={color} />;
  if (type === "message")  return <MaterialCommunityIcons name="robot" size={sz} color={color} />;
  if (type === "task")     return <Feather name="calendar"      size={sz} color={color} />;
  if (type === "campaign") return <Feather name="zap"           size={sz} color={color} />;
  return <Feather name="activity" size={sz} color={color} />;
}

function timeAgo(iso: string) {
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 1) return "agora";
  if (m < 60) return `${m}min atrás`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h atrás`;
  return `${Math.floor(h/24)}d atrás`;
}

// ─── Screen ───────────────────────────────────────────────────────────────────
const MODULES = [
  { name: "scanner",   label: "Radar",    icon: (c: string) => <CrosshairIcon size={22} color={c} /> },
  { name: "leads",     label: "Leads",    icon: (c: string) => <Feather name="users" size={20} color={c} /> },
  { name: "whatsapp",  label: "WhatsApp", icon: (c: string) => <Feather name="message-circle" size={20} color={c} /> },
  { name: "marketing", label: "Mkt IA",   icon: (c: string) => <Feather name="zap" size={20} color={c} /> },
] as const;

export default function HomeScreen() {
  const colors  = useColors();
  const insets  = useSafeAreaInsets();
  const router  = useRouter();
  const { leads, conversations, moduleStates, activityEvents, toggleModule, refreshDashboard, addLead } = useApp();

  const [refreshing, setRefreshing] = useState(false);

  // Scanner autonomous mode
  const existingLeadIds = useRef<string[]>([]);
  useEffect(() => { existingLeadIds.current = leads.map((l) => l.id); }, [leads]);
  const scannerActive = moduleStates.scanner?.is_active ?? false;
  useEffect(() => {
    if (!scannerActive) return;
    const run = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/jade/prospectar`, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ existingIds: existingLeadIds.current }),
        });
        if (!res.ok) return;
        const data = (await res.json()) as { leads: any[] };
        for (const lead of (data.leads ?? [])) { addLead(lead); existingLeadIds.current.push(lead.id); }
      } catch { /* ignore */ }
    };
    run();
    const t = setInterval(run, 60000);
    return () => clearInterval(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scannerActive]);

  const topPad    = Platform.OS === "web" ? 67  : insets.top;
  const bottomPad = Platform.OS === "web" ? 84  : insets.bottom + 60;
  const unread    = conversations.filter((c) => c.unread > 0).length;

  const novoLeads    = leads.filter((l) => l.column === "novo").length;
  const fechadoLeads = leads.filter((l) => l.column === "fechado");
  const txConversao  = leads.length > 0 ? Math.round((fechadoLeads.length / leads.length) * 100) : 0;
  const receitaMes   = fechadoLeads.reduce((s, l) => s + l.value, 0);
  const convAtivas   = conversations.filter((c) => c.unread > 0).length;
  const fmt = (v: number) => v >= 1000 ? `R$${(v/1000).toFixed(1)}k` : `R$${v}`;

  const METRICS = [
    { label: "Leads Ativos",    value: String(novoLeads),    change: `${leads.length} total`,           up: true,  icon: "users" as const,          ic: "#6C63FF" },
    { label: "Não lidas",       value: String(convAtivas),   change: `${conversations.length} convs`,   up: convAtivas > 0, icon: "message-circle" as const, ic: PINK    },
    { label: "Tx. Conversão",   value: `${txConversao}%`,    change: `${fechadoLeads.length} fechados`, up: txConversao > 20, icon: "trending-up" as const,  ic: "#00D68F" },
    { label: "Receita",         value: fmt(receitaMes),      change: `${fechadoLeads.length} contratos`,up: true,  icon: "dollar-sign" as const,    ic: "#FFB300" },
  ] as const;

  const handleModPress = (name: string) => {
    if (name === "scanner")   toggleModule("scanner");
    else if (name === "leads") router.push("/leads" as any);
    else if (name === "whatsapp") toggleModule("whatsapp");
    else if (name === "marketing") router.push("/marketing" as any);
  };

  const onRefresh = useCallback(async () => { setRefreshing(true); await refreshDashboard(); setRefreshing(false); }, [refreshDashboard]);

  return (
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
            style={[S.avatarBtn, { backgroundColor: colors.surface, borderWidth: 1.5, borderColor: PINK + "50" }]}
            onPress={() => router.push("/scanner" as any)} activeOpacity={0.85}>
            <Feather name="target" size={20} color={PINK} />
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Module strip — 4 modules ── */}
      <Text style={[S.sectionCap, { color: colors.mutedForeground }]}>MÓDULOS</Text>
      <View style={S.moduleStrip}>
        {MODULES.map((m) => {
          const active = moduleStates[m.name]?.is_active ?? false;
          return (
            <ModuleButton
              key={m.name}
              icon={m.icon(PINK)}
              label={m.label}
              active={active}
              onPress={() => handleModPress(m.name)}
            />
          );
        })}
      </View>

      {/* ── Metric Cards ── */}
      <View style={S.metricsGrid}>
        {METRICS.map((m, i) => (
          <View key={i} style={[S.metCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={S.metHead}>
              <View style={[S.metIcon, { backgroundColor: m.ic + "22" }]}>
                <Feather name={m.icon} size={14} color={m.ic} />
              </View>
              <View style={[S.metChip, { backgroundColor: m.up ? "#00D68F1A" : "#FF3B5C1A" }]}>
                <Feather name={m.up ? "trending-up" : "trending-down"} size={9} color={m.up ? colors.success : colors.destructive} />
                <Text style={[S.metChipText, { color: m.up ? colors.success : colors.destructive }]} numberOfLines={1}>{m.change}</Text>
              </View>
            </View>
            <Text style={[S.metValue, { color: colors.text }]}>{m.value}</Text>
            <Text style={[S.metLabel, { color: colors.mutedForeground }]}>{m.label}</Text>
          </View>
        ))}
      </View>

      {/* ── Pipeline ── */}
      <View style={S.section}>
        <View style={S.sectionRow}>
          <Text style={[S.sectionTitle, { color: colors.text }]}>Pipeline</Text>
          <TouchableOpacity onPress={() => router.push("/leads" as any)}>
            <Text style={{ color: PINK, fontSize: 12, fontFamily: "SpaceGrotesk_500Medium" }}>Ver tudo</Text>
          </TouchableOpacity>
        </View>
        <View style={[S.pipeCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {[
            { label: "Novo",        count: leads.filter((l) => l.column === "novo").length,        color: "#6C63FF" },
            { label: "Qualificado", count: leads.filter((l) => l.column === "qualificado").length, color: "#FFB300" },
            { label: "Proposta",    count: leads.filter((l) => l.column === "proposta").length,    color: PINK      },
            { label: "Fechado",     count: leads.filter((l) => l.column === "fechado").length,     color: "#00D68F" },
          ].map((col, i) => (
            <View key={i} style={S.pipeCol}>
              <View style={[S.pipeDot, { backgroundColor: col.color }]} />
              <Text style={[S.pipeCount, { color: colors.text }]}>{col.count}</Text>
              <Text style={[S.pipeLabel, { color: colors.mutedForeground }]}>{col.label}</Text>
              <View style={[S.pipeTrack, { backgroundColor: col.color + "33" }]}>
                <View style={[S.pipeFill, { backgroundColor: col.color, flex: col.count / Math.max(leads.length, 1) }]} />
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* ── Activity Feed ── */}
      <View style={S.section}>
        <View style={S.sectionRow}>
          <Text style={[S.sectionTitle, { color: colors.text }]}>Atividade recente</Text>
          <TouchableOpacity onPress={onRefresh} activeOpacity={0.7}>
            <Feather name="refresh-cw" size={13} color={colors.mutedForeground} />
          </TouchableOpacity>
        </View>
        <View style={[S.actCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {activityEvents.slice(0, 6).map((item, i, arr) => {
            const c = activityColor(item.type, colors);
            return (
              <React.Fragment key={item.id}>
                <View style={S.actRow}>
                  <View style={[S.actIcon, { backgroundColor: c + "22" }]}>
                    <ActivityIcon type={item.type} color={c} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[S.actText, { color: colors.text }]} numberOfLines={2}>{item.text}</Text>
                    <Text style={[S.actTime, { color: colors.mutedForeground }]}>{timeAgo(item.created_at)}</Text>
                  </View>
                </View>
                {i < arr.length - 1 && <View style={[S.actDivider, { backgroundColor: colors.border }]} />}
              </React.Fragment>
            );
          })}
          {activityEvents.length === 0 && (
            <View style={{ padding: 22, alignItems: "center", gap: 8 }}>
              <Feather name="activity" size={20} color={colors.mutedForeground} />
              <Text style={{ color: colors.mutedForeground, fontSize: 12, fontFamily: "SpaceGrotesk_400Regular", opacity: 0.6 }}>Nenhuma atividade</Text>
            </View>
          )}
        </View>
      </View>
    </ScrollView>
  );
}

const S = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingBottom: 10 },
  greeting: { fontSize: 12, fontFamily: "SpaceGrotesk_400Regular" },
  name: { fontSize: 22, fontFamily: "SpaceGrotesk_700Bold", marginTop: 1 },
  headerRight: { flexDirection: "row", gap: 8 },
  headerBtn: { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center", position: "relative" },
  notifDot: { position: "absolute", top: 5, right: 5, width: 15, height: 15, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  notifDotText: { color: "#fff", fontSize: 9, fontFamily: "SpaceGrotesk_700Bold" },
  avatarBtn: { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center" },

  sectionCap: { fontSize: 10, fontFamily: "SpaceGrotesk_600SemiBold", letterSpacing: 1.2, paddingHorizontal: 20, marginBottom: 8, marginTop: 4, opacity: 0.6 },

  moduleStrip: { flexDirection: "row", justifyContent: "space-around", paddingHorizontal: 12, marginBottom: 18 },
  modCol:      { alignItems: "center", gap: 5 },
  modBtn:      { width: MOD_SIZE, height: MOD_SIZE, borderRadius: MOD_SIZE/2, alignItems: "center", justifyContent: "center", borderWidth: 1.5 },
  modLabel:    { fontSize: 10, fontFamily: "SpaceGrotesk_500Medium" },

  metricsGrid: { flexDirection: "row", flexWrap: "wrap", paddingHorizontal: 12, gap: 8, marginBottom: 14 },
  metCard: { width: "47%", borderRadius: 12, borderWidth: 1, padding: 12, flexGrow: 1 },
  metHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  metIcon: { width: 28, height: 28, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  metChip: { flexDirection: "row", alignItems: "center", gap: 3, paddingHorizontal: 5, paddingVertical: 2, borderRadius: 6, maxWidth: "60%" },
  metChipText: { fontSize: 9, fontFamily: "SpaceGrotesk_500Medium" },
  metValue: { fontSize: 20, fontFamily: "SpaceGrotesk_700Bold" },
  metLabel: { fontSize: 10, fontFamily: "SpaceGrotesk_400Regular", marginTop: 2, opacity: 0.7 },

  section: { paddingHorizontal: 14, marginBottom: 14 },
  sectionRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  sectionTitle: { fontSize: 14, fontFamily: "SpaceGrotesk_700Bold" },

  pipeCard: { borderRadius: 12, borderWidth: 1, padding: 14, flexDirection: "row", gap: 6 },
  pipeCol: { flex: 1, alignItems: "center", gap: 3 },
  pipeDot: { width: 6, height: 6, borderRadius: 3 },
  pipeCount: { fontSize: 20, fontFamily: "SpaceGrotesk_700Bold" },
  pipeLabel: { fontSize: 9, fontFamily: "SpaceGrotesk_400Regular", textAlign: "center", opacity: 0.7 },
  pipeTrack: { width: "100%", height: 3, borderRadius: 2, marginTop: 2, flexDirection: "row" },
  pipeFill: { height: 3, borderRadius: 2 },

  actCard: { borderRadius: 12, borderWidth: 1, overflow: "hidden" },
  actRow: { flexDirection: "row", gap: 10, padding: 11, alignItems: "flex-start" },
  actIcon: { width: 28, height: 28, borderRadius: 8, alignItems: "center", justifyContent: "center", marginTop: 1 },
  actText: { fontSize: 12, fontFamily: "SpaceGrotesk_400Regular", lineHeight: 17 },
  actTime: { fontSize: 10, fontFamily: "SpaceGrotesk_400Regular", marginTop: 2, opacity: 0.6 },
  actDivider: { height: StyleSheet.hairlineWidth, marginLeft: 49 },
});
