import React, { useCallback, useEffect, useRef, useState } from "react";
import {
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
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";

import { useColors } from "@/hooks/useColors";
import { useApp } from "@/context/AppContext";
import { usePlan } from "@/context/PlanContext";
import { useAuth } from "@/context/AuthContext";

const API_BASE = Platform.OS === "web" ? "" : `https://${process.env.EXPO_PUBLIC_DOMAIN ?? ""}`;
const PINK   = "#FF0080";
const PURPLE = "#8400FF";
const META_GOAL = 51000;
const DRAWER_W = 270;

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
const MOD_SIZE = 53;

function ModuleButton({ icon, label, active, locked, onPress, onLongPress }: {
  icon: React.ReactNode; label: string; active?: boolean; locked?: boolean;
  onPress: () => void; onLongPress?: () => void;
}) {
  const colors = useColors();
  const glow  = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (active) {
      const glowLoop = Animated.loop(Animated.sequence([
        Animated.timing(glow,  { toValue: 1, duration: 1400, useNativeDriver: false }),
        Animated.timing(glow,  { toValue: 0, duration: 1400, useNativeDriver: false }),
      ]));
      const scaleLoop = Animated.loop(Animated.sequence([
        Animated.timing(scale, { toValue: 1.04, duration: 1000, useNativeDriver: false }),
        Animated.timing(scale, { toValue: 1.0,  duration: 1000, useNativeDriver: false }),
      ]));
      glowLoop.start();
      scaleLoop.start();
      return () => { glowLoop.stop(); scaleLoop.stop(); };
    } else {
      glow.setValue(0);
      scale.setValue(1);
    }
  }, [active]);

  return (
    <TouchableOpacity style={S.modCol} onPress={onPress} onLongPress={onLongPress} delayLongPress={500} activeOpacity={0.75}>
      <Animated.View style={[S.modBtn, {
        backgroundColor: locked ? "rgba(0,0,0,0.3)" : active ? "rgba(255,0,128,0.15)" : "#1a0d2e",
        borderColor: active ? "#FF0080" : locked ? colors.border + "50" : "rgba(255,0,128,0.25)",
        borderWidth: active ? 1.5 : 1,
        shadowColor: PINK,
        shadowOffset: { width: 0, height: 0 },
        shadowRadius: active ? glow.interpolate({ inputRange: [0,1], outputRange: [6, 10] }) : 0,
        shadowOpacity: active ? glow.interpolate({ inputRange: [0,1], outputRange: [0.4, 0.6] }) : 0,
        elevation: active ? glow.interpolate({ inputRange: [0,1], outputRange: [3, 8] }) : 0,
        transform: [{ scale }],
        opacity: locked ? 0.5 : 1,
      }]}>
        {icon}
        {locked && (
          <View style={S.lockBadge}>
            <Feather name="lock" size={7} color="#fff" />
          </View>
        )}
      </Animated.View>
      <Text style={[S.modLabel, { color: active ? PINK : locked ? colors.mutedForeground + "80" : "rgba(255,255,255,0.45)" }]}>{label}</Text>
    </TouchableOpacity>
  );
}

// ─── MetaBar ──────────────────────────────────────────────────────────────────
function MetaBar({ realizado, meta, onConfigure }: { realizado: number; meta: number; onConfigure: () => void }) {
  const colors = useColors();
  const pct    = meta > 0 ? Math.min(1, realizado / meta) : 0;
  const pctN   = Math.round(pct * 100);
  const fmtK   = (v: number) => v >= 1000 ? `R$${(v/1000).toFixed(0)}k` : `R$${v}`;
  const barColor = pct >= 0.8 ? "#00D68F" : pct >= 0.5 ? "#FFB300" : PINK;

  if (meta === 0) {
    return (
      <TouchableOpacity style={S.metaBar} onPress={onConfigure} activeOpacity={0.8}>
        <Feather name="target" size={13} color={colors.mutedForeground} />
        <Text style={[S.metaConfig, { color: colors.mutedForeground }]}>Configure sua meta mensal</Text>
        <Feather name="chevron-right" size={13} color={colors.mutedForeground} />
      </TouchableOpacity>
    );
  }

  return (
    <View style={S.metaBar}>
      <View style={S.metaRow}>
        <Text style={[S.metaLabel, { color: "rgba(255,255,255,0.45)" }]}>Meta do mês</Text>
        <Text style={[S.metaValue, { color: "#fff" }]}>{fmtK(realizado)} / {fmtK(meta)}</Text>
      </View>
      <View style={S.metaTrack}>
        <View style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${pctN * 0.6}%` as any, backgroundColor: PINK, borderRadius: 5 }} />
        <View style={{ position: "absolute", left: `${pctN * 0.6}%` as any, top: 0, bottom: 0, width: `${pctN * 0.4}%` as any, backgroundColor: PURPLE, borderRadius: 5 }} />
      </View>
      <Text style={[S.metaPct, { color: barColor }]}>{pctN}% atingido</Text>
    </View>
  );
}

// ─── JADE Activity Feed ───────────────────────────────────────────────────────
const JADE_MSGS_RADAR   = ["JADE monitorando estabelecimentos próximos...", "JADE identificou 3 novos leads no radar...", "JADE analisando perfil: Carlos Silva...", "JADE prospectando na região selecionada..."];
const JADE_MSGS_WA      = ["JADE preparando resposta personalizada...", "JADE qualificando lead no WhatsApp...", "JADE enviando follow-up automático...", "JADE moveu João Silva para Proposta..."];
const JADE_MSGS_GENERIC = ["JADE atualizando pipeline de vendas...", "JADE analisando dados do CRM...", "JADE gerando insights de conversão...", "JADE monitorando oportunidades..."];

function JADEActivityFeed({ anyModuleActive, scannerActive, whatsappActive }: {
  anyModuleActive: boolean; scannerActive: boolean; whatsappActive: boolean;
}) {
  const colors = useColors();
  const [msgIdx, setMsgIdx] = useState(0);
  const [displayText, setDisplayText] = useState("");
  const typeRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rotateRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dotAnim = useRef(new Animated.Value(0)).current;

  const getMsgs = () => scannerActive ? JADE_MSGS_RADAR : whatsappActive ? JADE_MSGS_WA : JADE_MSGS_GENERIC;

  const typeMessage = useCallback((msg: string) => {
    let i = 0;
    setDisplayText("");
    const tick = () => {
      i++;
      setDisplayText(msg.slice(0, i));
      if (i < msg.length) { typeRef.current = setTimeout(tick, 28); }
    };
    tick();
  }, []);

  useEffect(() => {
    if (!anyModuleActive) { setDisplayText(""); return; }
    const msgs = getMsgs();
    typeMessage(msgs[msgIdx % msgs.length]);
    rotateRef.current = setInterval(() => {
      setMsgIdx((prev) => {
        const next = (prev + 1) % msgs.length;
        typeMessage(msgs[next]);
        return next;
      });
    }, 3800);
    return () => {
      if (typeRef.current) clearTimeout(typeRef.current);
      if (rotateRef.current) clearInterval(rotateRef.current);
    };
  }, [anyModuleActive, scannerActive, whatsappActive]);

  useEffect(() => {
    if (!anyModuleActive) return;
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(dotAnim, { toValue: 1, duration: 800, useNativeDriver: false }),
      Animated.timing(dotAnim, { toValue: 0, duration: 800, useNativeDriver: false }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [anyModuleActive]);

  if (!anyModuleActive) {
    return (
      <View style={[S.jadeFeed, { opacity: 0.38 }]}>
        <MaterialCommunityIcons name="robot" size={14} color={colors.mutedForeground} />
        <Text style={[S.jadeStandby, { color: colors.mutedForeground }]}>JADE em standby</Text>
      </View>
    );
  }

  return (
    <View style={S.jadeFeed}>
      <Animated.View style={[S.jadeDot, {
        backgroundColor: PINK,
        opacity: dotAnim.interpolate({ inputRange: [0,1], outputRange: [0.5, 1] }),
        transform: [{ scale: dotAnim.interpolate({ inputRange: [0,1], outputRange: [0.8, 1.2] }) }],
      }]} />
      <Text style={[S.jadeMsg, { color: colors.text }]} numberOfLines={1}>{displayText}<Text style={{ color: PINK }}>|</Text></Text>
    </View>
  );
}

// ─── DrawerMenu ───────────────────────────────────────────────────────────────
const DRAWER_ITEMS: { iconName: React.ComponentProps<typeof Feather>["name"]; label: string; route: string }[] = [
  { iconName: "target",       label: "Radar",       route: "/scanner"            },
  { iconName: "users",        label: "Leads",        route: "/leads"              },
  { iconName: "message-circle", label: "Conversas", route: "/(tabs)/conversas"   },
  { iconName: "zap",          label: "Mkt IA",       route: "/marketing"          },
  { iconName: "map",          label: "Rota",         route: "/criarrota"          },
  { iconName: "bar-chart-2",  label: "Relatórios",   route: "/relatorios"         },
  { iconName: "settings",     label: "Ajustes",      route: "/empresa"            },
  { iconName: "link-2",       label: "Integrações",  route: "/mais"               },
  { iconName: "credit-card",  label: "Planos",       route: "/plano"              },
  { iconName: "help-circle",  label: "Ajuda",        route: "/ajuda"              },
];

function DrawerMenu({
  visible, onClose, empresaNome,
}: {
  visible: boolean;
  onClose: () => void;
  empresaNome: string;
}) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const { logout } = useAuth();
  const slideAnim = useRef(new Animated.Value(-DRAWER_W)).current;
  const overlayAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(slideAnim, { toValue: 0, duration: 220, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.timing(overlayAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, { toValue: -DRAWER_W, duration: 200, easing: Easing.in(Easing.cubic), useNativeDriver: true }),
        Animated.timing(overlayAnim, { toValue: 0, duration: 180, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  if (!visible && (slideAnim as any).__getValue() === -DRAWER_W) return null;

  const navigate = (route: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onClose();
    setTimeout(() => router.push(route as any), 180);
  };

  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents={visible ? "auto" : "none"}>
      {/* Overlay */}
      <Animated.View
        style={[S.drawerOverlay, { opacity: overlayAnim }]}
        pointerEvents={visible ? "auto" : "none"}
      >
        <TouchableOpacity style={StyleSheet.absoluteFillObject} activeOpacity={1} onPress={onClose} />
      </Animated.View>

      {/* Drawer panel */}
      <Animated.View
        style={[S.drawer, {
          paddingTop: insets.top + 16,
          paddingBottom: insets.bottom + 20,
          transform: [{ translateX: slideAnim }],
        }]}
      >
        {/* Profile */}
        <View style={S.drawerProfile}>
          <View style={S.drawerAvatar}>
            <Text style={S.drawerAvatarLetter}>R</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={S.drawerName}>Rodrigo</Text>
            {empresaNome ? <Text style={S.drawerCompany}>{empresaNome}</Text> : null}
          </View>
          <TouchableOpacity onPress={onClose} style={S.drawerClose} activeOpacity={0.7}>
            <Feather name="x" size={18} color="rgba(255,255,255,0.50)" />
          </TouchableOpacity>
        </View>

        <View style={[S.drawerDivider, { backgroundColor: "#FFFFFF0D" }]} />

        {/* Navigation items */}
        <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
          {DRAWER_ITEMS.map((item) => (
            <TouchableOpacity
              key={item.label}
              style={S.drawerItem}
              onPress={() => navigate(item.route)}
              activeOpacity={0.7}
            >
              <View style={S.drawerItemIcon}>
                <Feather name={item.iconName} size={18} color="rgba(255,255,255,0.55)" />
              </View>
              <Text style={S.drawerItemLabel}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={[S.drawerDivider, { backgroundColor: "#FFFFFF0D", marginBottom: 12 }]} />

        {/* Sair */}
        <TouchableOpacity
          style={S.drawerSair}
          onPress={async () => { onClose(); setTimeout(() => logout(), 200); }}
          activeOpacity={0.85}
        >
          <Feather name="log-out" size={15} color={PINK} />
          <Text style={S.drawerSairText}>Sair</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function HomeScreen() {
  const colors  = useColors();
  const insets  = useSafeAreaInsets();
  const router  = useRouter();
  const { leads, conversations, moduleStates, toggleModule, refreshDashboard, addLead } = useApp();
  const { canAccess } = usePlan();

  const [refreshing, setRefreshing] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [empresaNome, setEmpresaNome] = useState<string>("");

  useEffect(() => {
    AsyncStorage.getItem("@jade_ia:empresa_v2").then((raw) => {
      if (!raw) return;
      try { const d = JSON.parse(raw); if (d.nomeEmpresa) setEmpresaNome(d.nomeEmpresa); } catch {}
    });
  }, []);

  const existingLeadIds = useRef<string[]>([]);
  useEffect(() => { existingLeadIds.current = leads.map((l) => l.id); }, [leads]);
  const scannerActive   = moduleStates.scanner?.is_active ?? false;
  const whatsappActive  = moduleStates.whatsapp?.is_active ?? false;
  const anyModuleActive = Object.values(moduleStates).some((m) => m?.is_active);

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

  const TAB_H     = Platform.OS === "web" ? 84 : 60;
  const topPad    = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = insets.bottom + TAB_H + 64 + 16; // tab + chat bar + gap
  const unread    = conversations.filter((c) => c.unread > 0).length;

  const fechadoLeads = leads.filter((l) => l.column === "fechado");
  const receitaMes   = fechadoLeads.reduce((s, l) => s + l.value, 0);

  const MODULES = [
    { name: "scanner",   label: "Radar",    locked: false, icon: (c: string) => <CrosshairIcon size={20} color={c} /> },
    { name: "leads",     label: "Leads",    locked: false, icon: (c: string) => <Feather name="users" size={19} color={c} /> },
    { name: "whatsapp",  label: "WhatsApp", locked: false, icon: (c: string) => <Feather name="message-circle" size={19} color={c} /> },
    { name: "marketing", label: "Mkt IA",   locked: false, icon: (c: string) => <Feather name="zap" size={19} color={c} /> },
    { name: "rota",      label: "Rota",     locked: !canAccess("pro"), icon: (c: string) => <Feather name="map" size={19} color={c} /> },
    { name: "briefing",  label: "Briefing", locked: false, icon: (c: string) => <Feather name="clipboard" size={19} color={c} /> },
  ] as const;

  const handleModPress = (name: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    toggleModule(name);
  };

  const handleModLongPress = (name: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (name === "scanner")    router.push("/scanner" as any);
    else if (name === "leads") router.push("/leads" as any);
    else if (name === "whatsapp") router.push("/(tabs)/conversas" as any);
    else if (name === "marketing") {
      if (!canAccess("pro")) { router.push("/mais" as any); return; }
      router.push("/marketing" as any);
    }
    else if (name === "rota") {
      if (!canAccess("pro")) { router.push("/mais" as any); return; }
      router.push("/criarrota" as any);
    }
    else if (name === "briefing") router.push("/briefing" as any);
  };

  const onRefresh = useCallback(async () => { setRefreshing(true); await refreshDashboard(); setRefreshing(false); }, [refreshDashboard]);

  const openJadeChat = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push("/(tabs)/jade" as any);
  };

  return (
    <View style={[S.root, { backgroundColor: colors.background }]}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: bottomPad }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={PINK} />}
      >
        {/* ── Header ── */}
        <View style={[S.header, { paddingTop: topPad }]}>
          <TouchableOpacity
            style={S.hamburger}
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setDrawerOpen(true); }}
            activeOpacity={0.7}
          >
            <Feather name="menu" size={22} color={colors.text} />
          </TouchableOpacity>

          <View style={S.greetingBlock}>
            <Text style={[S.greeting, { color: colors.mutedForeground }]}>Bom dia,{" "}
              <Text style={[S.name, { color: colors.text }]}>Rodrigo 👋</Text>
            </Text>
          </View>

          <View style={S.headerRight}>
            <TouchableOpacity
              style={[S.headerBtn, { backgroundColor: colors.surface, position: "relative" }]}
              onPress={() => router.push("/notificacoes" as any)}
              activeOpacity={0.8}
            >
              <Feather name="bell" size={20} color={colors.text} />
              {unread > 0 && (
                <View style={[S.notifDot, { backgroundColor: PINK }]}>
                  <Text style={S.notifDotText}>{unread}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Module strip ── */}
        <Text style={[S.sectionCap, { color: colors.mutedForeground }]}>MÓDULOS</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={S.moduleStrip}
          decelerationRate="fast"
        >
          {MODULES.map((m) => {
            const active = (moduleStates as any)[m.name]?.is_active ?? false;
            return (
              <ModuleButton
                key={m.name}
                icon={m.icon(m.locked ? colors.mutedForeground : active ? PINK : "rgba(255,0,128,0.5)")}
                label={m.label}
                active={active}
                locked={m.locked}
                onPress={() => handleModPress(m.name)}
                onLongPress={() => handleModLongPress(m.name)}
              />
            );
          })}
        </ScrollView>

        {/* ── Meta individual bar ── */}
        <View style={{ paddingHorizontal: 14, marginBottom: 10 }}>
          <MetaBar
            realizado={receitaMes > 0 ? receitaMes : 38500}
            meta={META_GOAL}
            onConfigure={() => router.push("/empresa" as any)}
          />
        </View>

        {/* ── JADE Activity Feed ── */}
        <View style={{ paddingHorizontal: 14, marginBottom: 14 }}>
          <JADEActivityFeed
            anyModuleActive={anyModuleActive}
            scannerActive={scannerActive}
            whatsappActive={whatsappActive}
          />
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
      </ScrollView>

      {/* ── Fale com a JADE bar (fixed above tab bar) ── */}
      <View style={[S.chatBarWrap, { bottom: insets.bottom + TAB_H + 10 }]}>
        <TouchableOpacity style={[S.chatBar, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={openJadeChat} activeOpacity={0.85}>
          <Feather name="message-circle" size={18} color="rgba(255,255,255,0.35)" />
          <Text style={[S.chatPlaceholder, { color: "rgba(255,255,255,0.35)" }]}>Fale com a JADE...</Text>
          <TouchableOpacity
            style={S.micBtn}
            onPress={openJadeChat}
            onLongPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); openJadeChat(); }}
            delayLongPress={400}
            activeOpacity={0.7}
          >
            <Feather name="mic" size={20} color="rgba(255,255,255,0.60)" />
          </TouchableOpacity>
        </TouchableOpacity>
      </View>

      {/* ── Drawer ── */}
      <DrawerMenu visible={drawerOpen} onClose={() => setDrawerOpen(false)} empresaNome={empresaNome} />
    </View>
  );
}

const S = StyleSheet.create({
  root: { flex: 1 },

  // ── Header ──
  header:       { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingBottom: 6 },
  hamburger:    { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  greetingBlock:{ flex: 1, alignItems: "center" },
  greeting:     { fontSize: 14, fontFamily: "SpaceGrotesk_400Regular" },
  name:         { fontSize: 16, fontFamily: "SpaceGrotesk_700Bold" },
  headerRight:  { flexDirection: "row", gap: 8 },
  headerBtn:    { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  notifDot:     { position: "absolute", top: 4, right: 4, width: 14, height: 14, borderRadius: 7, alignItems: "center", justifyContent: "center" },
  notifDotText: { color: "#fff", fontSize: 8, fontFamily: "SpaceGrotesk_700Bold" },

  sectionCap: { fontSize: 10, fontFamily: "SpaceGrotesk_600SemiBold", letterSpacing: 1.2, paddingHorizontal: 20, marginBottom: 10, marginTop: 14, opacity: 0.6 },

  moduleStrip: { flexDirection: "row", paddingHorizontal: 12, paddingBottom: 16, paddingTop: 8, gap: 8 },
  modCol:      { alignItems: "center", gap: 5, width: MOD_SIZE + 14, overflow: "visible" },
  modBtn:      { width: MOD_SIZE, height: MOD_SIZE, borderRadius: MOD_SIZE/2, alignItems: "center", justifyContent: "center", borderWidth: 1, position: "relative", overflow: "visible" },
  modLabel:    { fontSize: 9, fontFamily: "SpaceGrotesk_500Medium", textAlign: "center" },
  lockBadge:   { position: "absolute", top: -2, right: -2, width: 14, height: 14, borderRadius: 7, backgroundColor: PURPLE, alignItems: "center", justifyContent: "center" },

  // ── Meta bar ──
  metaBar:    { gap: 8, paddingVertical: 4, flexDirection: "column" },
  metaRow:    { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  metaLabel:  { fontSize: 12, fontFamily: "SpaceGrotesk_400Regular" },
  metaValue:  { fontSize: 16, fontFamily: "SpaceGrotesk_600SemiBold" },
  metaTrack:  { height: 10, backgroundColor: "rgba(255,255,255,0.08)", borderRadius: 5, overflow: "hidden", position: "relative" },
  metaPct:    { fontSize: 11, fontFamily: "SpaceGrotesk_600SemiBold" },
  metaConfig: { fontSize: 12, fontFamily: "SpaceGrotesk_500Medium", flex: 1, paddingHorizontal: 8 },

  // ── JADE feed ──
  jadeFeed:   { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 2, paddingHorizontal: 2 },
  jadeDot:    { width: 8, height: 8, borderRadius: 4 },
  jadeMsg:    { fontSize: 11, fontFamily: "SpaceGrotesk_400Regular", flex: 1 },
  jadeStandby:{ fontSize: 11, fontFamily: "SpaceGrotesk_400Regular", flex: 1 },

  // ── Pipeline ──
  section:    { paddingHorizontal: 14, marginBottom: 14 },
  sectionRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  sectionTitle:{ fontSize: 14, fontFamily: "SpaceGrotesk_700Bold" },
  pipeCard:   { borderRadius: 12, borderWidth: 1, padding: 14, flexDirection: "row", gap: 6 },
  pipeCol:    { flex: 1, alignItems: "center", gap: 3 },
  pipeDot:    { width: 6, height: 6, borderRadius: 3 },
  pipeCount:  { fontSize: 20, fontFamily: "SpaceGrotesk_700Bold" },
  pipeLabel:  { fontSize: 9, fontFamily: "SpaceGrotesk_400Regular", textAlign: "center", opacity: 0.7 },
  pipeTrack:  { width: "100%", height: 3, borderRadius: 2, marginTop: 2, flexDirection: "row" },
  pipeFill:   { height: 3, borderRadius: 2 },

  // ── Chat bar ──
  chatBarWrap:{ position: "absolute", left: 14, right: 14 },
  chatBar:    { flexDirection: "row", alignItems: "center", borderRadius: 14, borderWidth: 1, paddingLeft: 14, paddingRight: 6, height: 50, gap: 10 },
  chatPlaceholder: { flex: 1, fontSize: 14, fontFamily: "SpaceGrotesk_400Regular" },
  micBtn:     { width: 38, height: 38, borderRadius: 19, backgroundColor: "rgba(255,255,255,0.06)", alignItems: "center", justifyContent: "center" },

  // ── Drawer ──
  drawerOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.60)" },
  drawer:        { position: "absolute", left: 0, top: 0, bottom: 0, width: DRAWER_W, backgroundColor: "#0E0A1A", paddingHorizontal: 20 },
  drawerProfile: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 16 },
  drawerAvatar:  { width: 42, height: 42, borderRadius: 21, backgroundColor: "#3A1060", alignItems: "center", justifyContent: "center" },
  drawerAvatarLetter: { fontSize: 18, fontFamily: "SpaceGrotesk_700Bold", color: "#fff" },
  drawerName:    { fontSize: 16, fontFamily: "SpaceGrotesk_700Bold", color: "#fff" },
  drawerCompany: { fontSize: 12, fontFamily: "SpaceGrotesk_400Regular", color: "rgba(255,255,255,0.45)", marginTop: 1 },
  drawerClose:   { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.06)" },
  drawerDivider: { height: 1, marginHorizontal: -20, marginBottom: 10 },
  drawerItem:    { flexDirection: "row", alignItems: "center", gap: 14, paddingVertical: 13 },
  drawerItemIcon:{ width: 32, height: 32, borderRadius: 9, backgroundColor: "rgba(255,255,255,0.06)", alignItems: "center", justifyContent: "center" },
  drawerItemLabel: { fontSize: 15, fontFamily: "SpaceGrotesk_500Medium", color: "rgba(255,255,255,0.80)" },
  drawerSair:    { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 13, paddingHorizontal: 14, backgroundColor: "rgba(255,0,128,0.10)", borderRadius: 12, borderWidth: 1, borderColor: "rgba(255,0,128,0.20)" },
  drawerSairText:{ fontSize: 15, fontFamily: "SpaceGrotesk_600SemiBold", color: PINK },
});
