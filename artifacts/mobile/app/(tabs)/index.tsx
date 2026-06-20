import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Easing,
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

// ─── Module button ────────────────────────────────────────────────────────────
const BTN_SIZE  = 65;
const WRAP_SIZE = 79;

function ModuleBtn({
  active, onPress, children, colors,
}: {
  active: boolean;
  onPress: () => void;
  children: React.ReactNode;
  colors: ReturnType<typeof useColors>;
}) {
  const glowOpacity = useRef(new Animated.Value(0)).current;
  const iconBreath  = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (active) {
      Animated.loop(Animated.sequence([
        Animated.timing(glowOpacity, { toValue: 0.28, duration: 1200, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(glowOpacity, { toValue: 0.0,  duration: 1200, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])).start();
      Animated.loop(Animated.sequence([
        Animated.timing(iconBreath, { toValue: 0.55, duration: 1800, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(iconBreath, { toValue: 1.0,  duration: 1800, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])).start();
    } else {
      glowOpacity.stopAnimation(); glowOpacity.setValue(0);
      iconBreath.stopAnimation();  iconBreath.setValue(1);
    }
  }, [active]);

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.75}
      style={[M.wrap, { width: WRAP_SIZE, height: WRAP_SIZE, overflow: "visible" }]}>
      <Animated.View style={[M.glowRing, { opacity: glowOpacity }]} />
      <View style={[M.btn, {
        backgroundColor: colors.surface,
        borderColor: active ? colors.primary + "80" : colors.border,
      }]}>
        <Animated.View style={{ opacity: iconBreath }}>{children}</Animated.View>
      </View>
    </TouchableOpacity>
  );
}

const M = StyleSheet.create({
  wrap: { alignItems: "center", justifyContent: "center" },
  btn: {
    width: BTN_SIZE, height: BTN_SIZE, borderRadius: BTN_SIZE / 2,
    alignItems: "center", justifyContent: "center", borderWidth: 1.5, position: "absolute",
  },
  glowRing: {
    position: "absolute", width: BTN_SIZE, height: BTN_SIZE, borderRadius: BTN_SIZE / 2,
    backgroundColor: "transparent", borderWidth: 2, borderColor: "#FF0080",
    shadowColor: "#FF0080", shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1, shadowRadius: 16, elevation: 10,
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

// ─── Module definitions ───────────────────────────────────────────────────────
const MODULE_DEFS = [
  { name: "scanner",   label: "Scanner Radar", onMsg: "JADE está buscando novos estabelecimentos próximos.",       offMsg: "Scanner pausado. Prospecção automática desativada." },
  { name: "jade",      label: "JADE IA",        onMsg: "JADE ativa e respondendo leads automaticamente.",           offMsg: "JADE pausada. Respostas automáticas desativadas." },
  { name: "leads",     label: "CRM",            onMsg: "Sincronização automática de leads ativada.",                offMsg: "CRM em modo manual." },
  { name: "whatsapp",  label: "WhatsApp",       onMsg: "WhatsApp configurado — envio ativado quando pronto.",       offMsg: "WhatsApp pausado." },
  { name: "marketing", label: "Marketing",      onMsg: "Campanhas de marketing automático ativadas.",               offMsg: "Marketing automático pausado." },
];

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function RadarScreen() {
  const colors  = useColors();
  const insets  = useSafeAreaInsets();
  const router  = useRouter();
  const { leads, conversations, moduleStates, activityEvents, toggleModule, refreshDashboard } = useApp();
  const [refreshing, setRefreshing] = useState(false);

  const topPad    = Platform.OS === "web" ? 67  : insets.top;
  const bottomPad = Platform.OS === "web" ? 84  : insets.bottom + 60;
  const unread    = conversations.filter((c) => c.unread > 0).length;

  // ── Real metrics ──────────────────────────────────────────────────────────
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
    { label: "Leads Ativos",   value: String(novoLeads),              change: `${totalLeads} total`,  positive: true,  icon: "users",          iconColor: "#6C63FF" },
    { label: "Conv. c/ não lidas", value: String(conversasAtivas),   change: `${conversations.length} total`, positive: conversasAtivas > 0, icon: "message-circle", iconColor: "#FF0080" },
    { label: "Tx. Conversão",  value: `${txConversao}%`,             change: `${fechadoLeads.length} fechados`, positive: txConversao > 20, icon: "trending-up",    iconColor: "#00D68F" },
    { label: "Receita Fechada", value: formatCurrency(receitaMes),   change: `${fechadoLeads.length} contratos`, positive: true, icon: "dollar-sign",    iconColor: "#FFB300" },
  ] as const;

  // ── Active modules list ────────────────────────────────────────────────────
  const activeModuleNames = Object.values(moduleStates)
    .filter((m) => m.is_active)
    .map((m) => {
      const def = MODULE_DEFS.find((d) => d.name === m.module_name);
      return def?.label ?? m.module_name;
    });

  // ── Toggle handler ────────────────────────────────────────────────────────
  const handleToggle = async (name: string) => {
    const def = MODULE_DEFS.find((d) => d.name === name);
    if (!def) return;
    const current = moduleStates[name];
    const newActive = !current?.is_active;

    await toggleModule(name);

    Alert.alert(
      newActive ? `${def.label} ativado` : `${def.label} pausado`,
      newActive ? def.onMsg : def.offMsg,
      [{ text: "OK" }],
    );
  };

  // ── Pull to refresh ────────────────────────────────────────────────────────
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshDashboard();
    setRefreshing(false);
  }, [refreshDashboard]);

  return (
    <ScrollView
      style={[S.root, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingBottom: bottomPad }}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
      }
    >
      {/* ── Header ── */}
      <View style={[S.header, { paddingTop: topPad - 6 }]}>
        <View>
          <Text style={[S.greeting, { color: colors.mutedForeground }]}>Bom dia,</Text>
          <Text style={[S.name, { color: colors.text }]}>Rodrigo 👋</Text>
        </View>
        <View style={S.headerRight}>
          {unread > 0 && (
            <TouchableOpacity style={[S.headerBtn, { backgroundColor: colors.surface }]}
              onPress={() => router.push("/notificacoes" as any)} activeOpacity={0.8}>
              <Feather name="bell" size={20} color={colors.text} />
              <View style={[S.notifDot, { backgroundColor: colors.primary }]}>
                <Text style={S.notifDotText}>{unread}</Text>
              </View>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={[S.avatarBtn, { backgroundColor: colors.primary }]}
            onPress={() => router.push("/perfil" as any)} activeOpacity={0.85}>
            <Text style={S.avatarText}>R</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Module buttons ── */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}
        contentContainerStyle={S.modulesRow} style={S.modulesScroll}>
        {MODULE_DEFS.map((def) => {
          const mod = moduleStates[def.name];
          const active = mod?.is_active ?? false;
          return (
            <View key={def.name} style={{ alignItems: "center", gap: 6 }}>
              <ModuleBtn active={active} onPress={() => handleToggle(def.name)} colors={colors}>
                {def.name === "scanner"   && <CrosshairIcon size={27} color={colors.primary} />}
                {def.name === "jade"      && <MaterialCommunityIcons name="robot" size={27} color={colors.primary} />}
                {def.name === "leads"     && <Feather name="users" size={25} color={colors.primary} />}
                {def.name === "whatsapp"  && <Feather name="message-circle" size={25} color={colors.primary} />}
                {def.name === "marketing" && <Feather name="zap" size={25} color={colors.primary} />}
              </ModuleBtn>
              <Text style={[S.moduleLabel, { color: active ? colors.primary : colors.mutedForeground, marginTop: WRAP_SIZE / 2 }]}>
                {def.name === "scanner" ? "Scanner" : def.name === "jade" ? "JADE" : def.name === "leads" ? "CRM" : def.name === "whatsapp" ? "WhatsApp" : "Mkt"}
              </Text>
            </View>
          );
        })}
      </ScrollView>

      <Text style={[S.activeLabel, { color: colors.mutedForeground }]}>
        {activeModuleNames.length > 0 ? (
          <>
            <Text style={{ color: colors.primary }}>●{"  "}</Text>
            {activeModuleNames.join(" · ") + " ativos"}
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
              <View style={[S.metricChange, { backgroundColor: m.positive ? "#00D68F22" : "#FF3B5C22" }]}>
                <Feather name={m.positive ? "trending-up" : "trending-down"} size={10}
                  color={m.positive ? colors.success : colors.destructive} />
                <Text style={[S.metricChangeText, { color: m.positive ? colors.success : colors.destructive }]}>
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
                    <Text style={[S.activityText, { color: colors.text }]} numberOfLines={2}>
                      {item.text}
                    </Text>
                    <Text style={[S.activityTime, { color: colors.mutedForeground }]}>
                      {timeAgo(item.created_at)}
                    </Text>
                  </View>
                </View>
                {i < arr.length - 1 && (
                  <View style={[S.activityDivider, { backgroundColor: colors.border }]} />
                )}
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
  );
}

const S = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 20, paddingBottom: 16,
  },
  greeting: { fontSize: 14, fontFamily: "SpaceGrotesk_400Regular" },
  name:     { fontSize: 24, fontFamily: "SpaceGrotesk_700Bold", marginTop: 2 },
  headerRight: { flexDirection: "row", alignItems: "center", gap: 10 },
  headerBtn: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center", position: "relative" },
  notifDot: { position: "absolute", top: 6, right: 6, width: 16, height: 16, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  notifDotText: { color: "#fff", fontSize: 9, fontFamily: "SpaceGrotesk_700Bold" },
  avatarBtn: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  avatarText: { color: "#fff", fontSize: 15, fontFamily: "SpaceGrotesk_700Bold" },
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
});
