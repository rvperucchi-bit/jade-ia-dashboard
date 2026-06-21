import React, { useRef, useState } from "react";
import {
  Alert,
  Modal,
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
import * as Haptics from "expo-haptics";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/context/AuthContext";
import { usePlan, type Plan } from "@/context/PlanContext";
import { useCredits } from "@/context/CreditsContext";
import { useRadarSearches } from "@/hooks/useRadarSearches";

const PURPLE = "#8400FF";
const GOLD   = "#FFB800";
const PINK   = "#FF0080";
const INDIGO = "#6C63FF";
const GRID_SIZE = 48;

const DEV_PLAN_KEY = "@jade_dev_plan";

// ─── Plan Gate Modal ──────────────────────────────────────────────────────────
function PlanGateModal({ visible, plan, featureName, onClose, onUpgrade }: {
  visible: boolean; plan: "pro" | "enterprise"; featureName: string;
  onClose: () => void; onUpgrade: () => void;
}) {
  const color = plan === "enterprise" ? GOLD : PURPLE;
  const label = plan === "enterprise" ? "Enterprise" : "Pro";
  const price = plan === "enterprise" ? "R$697/mês" : "R$247/mês";
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={G.overlay} activeOpacity={1} onPress={onClose}>
        <View style={G.box} onStartShouldSetResponder={() => true}>
          <View style={[G.iconWrap, { backgroundColor: color + "22", borderColor: color + "44" }]}>
            <Feather name="lock" size={28} color={color} />
          </View>
          <Text style={G.title}>Plano {label} necessário</Text>
          <Text style={G.sub}>
            <Text style={{ color, fontFamily: "SpaceGrotesk_600SemiBold" }}>{featureName}</Text>
            {" "}está disponível no plano {label}.{"\n"}Faça upgrade e desbloqueie todos os recursos avançados.
          </Text>
          <TouchableOpacity style={[G.btn, { backgroundColor: color }]} onPress={onUpgrade} activeOpacity={0.85}>
            <Feather name="zap" size={15} color="#fff" />
            <Text style={G.btnText}>Ver plano {label} — {price}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={G.cancel} onPress={onClose} activeOpacity={0.7}>
            <Text style={G.cancelText}>Agora não</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const G = StyleSheet.create({
  overlay:  { flex: 1, backgroundColor: "rgba(0,0,0,0.82)", alignItems: "center", justifyContent: "center", padding: 24 },
  box:      { backgroundColor: "#111118", borderRadius: 22, padding: 26, alignItems: "center", width: "100%", borderWidth: 1, borderColor: "#1E1E2E", gap: 12 },
  iconWrap: { width: 60, height: 60, borderRadius: 30, alignItems: "center", justifyContent: "center", borderWidth: 1, marginBottom: 2 },
  title:    { fontSize: 18, fontFamily: "SpaceGrotesk_700Bold", color: "#fff", textAlign: "center" },
  sub:      { fontSize: 13, fontFamily: "SpaceGrotesk_400Regular", color: "#AAAACC", textAlign: "center", lineHeight: 21 },
  btn:      { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 13, height: 48, width: "100%" },
  btnText:  { fontSize: 15, fontFamily: "SpaceGrotesk_700Bold", color: "#fff" },
  cancel:   { paddingVertical: 8 },
  cancelText: { fontSize: 13, fontFamily: "SpaceGrotesk_500Medium", color: "#7777AA" },
});

// ─── Grid Item ────────────────────────────────────────────────────────────────
function GridItem({ label, iconNode, locked, onPress }: {
  label: string;
  iconNode: React.ReactNode;
  locked?: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={GR.col} onPress={onPress} activeOpacity={0.65}>
      <View style={{ position: "relative" }}>
        <View style={[GR.circle, { opacity: locked ? 0.3 : 1 }]}>
          {iconNode}
        </View>
        {locked && (
          <View style={GR.lockBadge}>
            <Feather name="lock" size={8} color="#fff" />
          </View>
        )}
      </View>
      <Text style={[GR.label, { opacity: locked ? 0.3 : 0.5 }]} numberOfLines={1}>{label}</Text>
    </TouchableOpacity>
  );
}

const GR = StyleSheet.create({
  col:      { width: "25%", alignItems: "center", paddingVertical: 12, paddingHorizontal: 4 },
  circle:   { width: GRID_SIZE, height: GRID_SIZE, borderRadius: GRID_SIZE / 2, backgroundColor: "rgba(255,255,255,0.07)", alignItems: "center", justifyContent: "center" },
  lockBadge:{ position: "absolute", top: -3, right: -3, width: 16, height: 16, borderRadius: 8, backgroundColor: "#222235", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "#333355" },
  label:    { fontSize: 10, fontFamily: "SpaceGrotesk_400Regular", color: "rgba(255,255,255,1)", marginTop: 6, textAlign: "center", maxWidth: 64 },
});

// ─── MenuItem ─────────────────────────────────────────────────────────────────
function MenuItem({
  icon, label, sub, badge, badgeColor, danger,
  onPress, colors, divider,
}: {
  icon: string; label: string; sub?: string; badge?: string; badgeColor?: string;
  danger?: boolean; onPress?: () => void; colors: ReturnType<typeof useColors>; divider?: boolean;
}) {
  const iconColor = danger ? colors.destructive : colors.primary;
  const textColor = danger ? colors.destructive : colors.text;
  return (
    <>
      <TouchableOpacity
        style={M.item}
        onPress={onPress}
        activeOpacity={0.7}
        disabled={!onPress}
      >
        <View style={[M.iconWrap, { backgroundColor: danger ? colors.destructive + "22" : colors.surface }]}>
          <Feather name={icon as any} size={20} color={iconColor} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[M.label, { color: textColor }]}>{label}</Text>
          {sub && <Text style={[M.sub, { color: colors.mutedForeground }]}>{sub}</Text>}
        </View>
        {badge && (
          <View style={[M.badge, { backgroundColor: (badgeColor ?? colors.primary) + "22" }]}>
            <Text style={[M.badgeText, { color: badgeColor ?? colors.primary }]}>{badge}</Text>
          </View>
        )}
        {!danger && (
          <Feather name="chevron-right" size={15} color={colors.mutedForeground} />
        )}
      </TouchableOpacity>
      {divider && <View style={[M.divider, { backgroundColor: colors.border }]} />}
    </>
  );
}

const M = StyleSheet.create({
  item:     { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 14, paddingVertical: 13 },
  iconWrap: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  label:    { fontSize: 15, fontFamily: "SpaceGrotesk_500Medium" },
  sub:      { fontSize: 12, fontFamily: "SpaceGrotesk_400Regular", marginTop: 1 },
  badge:    { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  badgeText:{ fontSize: 11, fontFamily: "SpaceGrotesk_700Bold" },
  divider:  { height: StyleSheet.hairlineWidth, marginLeft: 62 },
});

// ─── Dev Tools Modal ──────────────────────────────────────────────────────────
function DevToolsModal({ visible, currentPlan, isRealPlan, onClose, onChangePlan, onExitDev }: {
  visible: boolean; currentPlan: Plan; isRealPlan: boolean;
  onClose: () => void; onChangePlan: (p: Plan) => void; onExitDev: () => void;
}) {
  const PLANS: { id: Plan; label: string; color: string; price: string }[] = [
    { id: "start",      label: "Start",      color: INDIGO,  price: "R$97/mês"  },
    { id: "pro",        label: "Pro",        color: PURPLE,  price: "R$247/mês" },
    { id: "enterprise", label: "Enterprise", color: GOLD,    price: "R$697/mês" },
  ];
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={DV.overlay} activeOpacity={1} onPress={onClose}>
        <View style={DV.sheet} onStartShouldSetResponder={() => true}>
          <View style={DV.handle} />
          <View style={DV.titleRow}>
            <Feather name="terminal" size={18} color={PINK} />
            <Text style={DV.title}>Dev Tools</Text>
            <View style={DV.devBadge}><Text style={DV.devBadgeText}>MODO TESTE</Text></View>
          </View>
          <Text style={DV.sub}>Simule qualquer plano instantaneamente. Nenhum pagamento é cobrado.</Text>
          <View style={{ gap: 10 }}>
            {PLANS.map((p) => {
              const sel = currentPlan === p.id;
              return (
                <TouchableOpacity
                  key={p.id}
                  style={[DV.planBtn, { borderColor: sel ? p.color : "#2A2A3E", backgroundColor: sel ? p.color + "18" : "#0F0F1A", borderWidth: sel ? 2 : 1 }]}
                  onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onChangePlan(p.id); }}
                  activeOpacity={0.85}
                >
                  <View style={[DV.planDot, { backgroundColor: p.color }]} />
                  <Text style={[DV.planLabel, { color: sel ? p.color : "#fff" }]}>{p.label}</Text>
                  <Text style={[DV.planPrice, { color: sel ? p.color : "#7777AA" }]}>{p.price}</Text>
                  {sel && <Feather name="check-circle" size={16} color={p.color} />}
                </TouchableOpacity>
              );
            })}
          </View>
          {!isRealPlan && (
            <TouchableOpacity style={DV.exitBtn} onPress={onExitDev} activeOpacity={0.85}>
              <Feather name="x-circle" size={15} color="#FF3B5C" />
              <Text style={DV.exitText}>Voltar ao plano real</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={DV.closeBtn} onPress={onClose} activeOpacity={0.85}>
            <Text style={DV.closeBtnText}>Fechar</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const DV = StyleSheet.create({
  overlay:  { flex: 1, backgroundColor: "rgba(0,0,0,0.80)", justifyContent: "flex-end" },
  sheet:    { backgroundColor: "#0F0F1A", borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, gap: 14, paddingBottom: 40, borderTopWidth: 1, borderColor: "#1E1E2E" },
  handle:   { width: 40, height: 4, borderRadius: 2, backgroundColor: "#3A3A4E", alignSelf: "center" },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  title:    { fontSize: 18, fontFamily: "SpaceGrotesk_700Bold", color: "#fff", flex: 1 },
  devBadge: { backgroundColor: PINK + "22", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  devBadgeText: { fontSize: 10, fontFamily: "SpaceGrotesk_700Bold", color: PINK, letterSpacing: 0.5 },
  sub:      { fontSize: 13, fontFamily: "SpaceGrotesk_400Regular", color: "#7777AA", lineHeight: 19 },
  planBtn:  { flexDirection: "row", alignItems: "center", gap: 10, borderRadius: 14, padding: 14 },
  planDot:  { width: 8, height: 8, borderRadius: 4 },
  planLabel:{ fontSize: 15, fontFamily: "SpaceGrotesk_700Bold", flex: 1 },
  planPrice:{ fontSize: 12, fontFamily: "SpaceGrotesk_400Regular" },
  exitBtn:  { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: "#FF3B5C18", borderRadius: 13, height: 44 },
  exitText: { color: "#FF3B5C", fontSize: 14, fontFamily: "SpaceGrotesk_600SemiBold" },
  closeBtn: { backgroundColor: "#1A1A2E", borderRadius: 13, height: 46, alignItems: "center", justifyContent: "center" },
  closeBtnText: { color: "#AAAACC", fontSize: 14, fontFamily: "SpaceGrotesk_600SemiBold" },
});

// ─── Screen ───────────────────────────────────────────────────────────────────
const REAL_PLAN: Plan = "start";

export default function MaisScreen() {
  const colors  = useColors();
  const insets  = useSafeAreaInsets();
  const router  = useRouter();
  const { logout } = useAuth();
  const { userPlan, setUserPlan, isDevMode, setDevMode, canAccess, hasDemoAvailable, isDemoActiveFor, useDemo } = usePlan();

  const [gateVisible, setGateVisible] = useState(false);
  const [gateFeature, setGateFeature] = useState("");
  const [gatePlan,    setGatePlan]    = useState<"pro" | "enterprise">("pro");
  const [devModal,    setDevModal]    = useState(false);
  const [demoModal,     setDemoModal]     = useState(false);
  const [demoPending,   setDemoPending]   = useState<{ path: string; label: string } | null>(null);
  const [creditsModal,  setCreditsModal]  = useState(false);
  const [upgradeModal,  setUpgradeModal]  = useState(false);
  const [selectedPkg,   setSelectedPkg]   = useState<100 | 500 | 2000 | null>(null);
  const credits = useCredits();
  const radar   = useRadarSearches();

  const tapCount = useRef(0);
  const tapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const onVersionTap = () => {
    tapCount.current += 1;
    if (tapTimer.current) clearTimeout(tapTimer.current);
    if (tapCount.current >= 7) {
      tapCount.current = 0;
      setDevMode(true);
      setDevModal(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      return;
    }
    tapTimer.current = setTimeout(() => { tapCount.current = 0; }, 2500);
  };

  const handleChangePlan = async (p: Plan) => {
    setUserPlan(p);
    try { await AsyncStorage.setItem(DEV_PLAN_KEY, p); } catch { /* ignore */ }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleExitDev = async () => {
    setDevMode(false);
    setUserPlan(REAL_PLAN);
    try { await AsyncStorage.removeItem(DEV_PLAN_KEY); } catch { /* ignore */ }
    setDevModal(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  };

  const tap = () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

  // Navigate to PRO feature (handles demo logic)
  const navPro = (path: string, label: string) => {
    tap();
    if (canAccess("pro") || isDemoActiveFor(label)) { router.push(path as any); return; }
    if (hasDemoAvailable) {
      setDemoPending({ path, label });
      setDemoModal(true);
      return;
    }
    setGatePlan("pro");
    setGateFeature(label);
    setGateVisible(true);
  };

  // Navigate to Enterprise feature
  const navEnterprise = (path: string, label: string) => {
    tap();
    if (canAccess("enterprise")) { router.push(path as any); return; }
    setGatePlan("enterprise");
    setGateFeature(label);
    setGateVisible(true);
  };

  const handleLogout = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert("Sair da conta", "Tem certeza?", [
      { text: "Cancelar", style: "cancel" },
      { text: "Sair", style: "destructive", onPress: async () => { await logout(); router.replace("/login"); } },
    ]);
  };

  const topPad    = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 84 : insets.bottom + 60;
  const planLabel = userPlan === "enterprise" ? "Enterprise" : userPlan === "pro" ? "Pro" : "Start";
  const planColor = userPlan === "enterprise" ? GOLD : userPlan === "pro" ? PURPLE : INDIGO;

  const ic = (color: string) => color; // shorthand
  const pinkIc  = PINK;
  const grayIc  = "rgba(255,255,255,0.25)";

  // ─── Grid items definition ─────────────────────────────────────────────────
  const GRID_ITEMS: {
    label: string;
    iconNode: React.ReactNode;
    locked: boolean;
    onPress: () => void;
  }[] = [
    {
      label: "JADE Chat",
      iconNode: <MaterialCommunityIcons name="robot" size={22} color={pinkIc} />,
      locked: false,
      onPress: () => { tap(); router.push("/(tabs)/jade" as any); },
    },
    {
      label: "Roteiro",
      iconNode: <Feather name="list" size={20} color={pinkIc} />,
      locked: false,
      onPress: () => { tap(); router.push("/roteiro" as any); },
    },
    {
      label: "Briefing",
      iconNode: <Feather name="clipboard" size={20} color={pinkIc} />,
      locked: false,
      onPress: () => { tap(); router.push("/briefing" as any); },
    },
    {
      label: "Objeções",
      iconNode: <Feather name="shield" size={20} color={canAccess("pro") ? pinkIc : grayIc} />,
      locked: !canAccess("pro"),
      onPress: () => navPro("/objecoes", "Objeções"),
    },
    {
      label: "Laudo",
      iconNode: <Feather name="award" size={20} color={pinkIc} />,
      locked: false,
      onPress: () => { tap(); router.push("/laudo" as any); },
    },
    {
      label: "Criar Rota",
      iconNode: <Feather name="map-pin" size={20} color={canAccess("pro") ? pinkIc : grayIc} />,
      locked: !canAccess("pro"),
      onPress: () => navPro("/criarrota", "Criar Rota"),
    },
    {
      label: "Planejamento",
      iconNode: <Feather name="calendar" size={20} color={canAccess("pro") ? pinkIc : grayIc} />,
      locked: !canAccess("pro"),
      onPress: () => navPro("/planejamento", "Planejamento"),
    },
    {
      label: "Roleplay",
      iconNode: <Feather name="users" size={20} color={canAccess("pro") ? pinkIc : grayIc} />,
      locked: !canAccess("pro"),
      onPress: () => navPro("/roleplay", "Roleplay"),
    },
    {
      label: "Marketing IA",
      iconNode: <Feather name="radio" size={20} color={canAccess("pro") ? pinkIc : grayIc} />,
      locked: !canAccess("pro"),
      onPress: () => navPro("/marketing", "Marketing IA"),
    },
    {
      label: "Relatórios",
      iconNode: <Feather name="bar-chart-2" size={20} color={pinkIc} />,
      locked: false,
      onPress: () => { tap(); router.push("/relatorios" as any); },
    },
    {
      label: "Análise IA",
      iconNode: <Feather name="cpu" size={20} color={canAccess("pro") ? pinkIc : grayIc} />,
      locked: !canAccess("pro"),
      onPress: () => navPro("/analise", "Análise IA"),
    },
    {
      label: "Meu Time",
      iconNode: <Feather name="user-plus" size={20} color={canAccess("enterprise") ? pinkIc : grayIc} />,
      locked: !canAccess("enterprise"),
      onPress: () => navEnterprise("/gestao", "Meu Time"),
    },
    {
      label: "Metas",
      iconNode: <Feather name="target" size={20} color={canAccess("enterprise") ? pinkIc : grayIc} />,
      locked: !canAccess("enterprise"),
      onPress: () => navEnterprise("/gestao", "Metas"),
    },
    {
      label: "Carteira",
      iconNode: <Feather name="briefcase" size={20} color={canAccess("enterprise") ? pinkIc : grayIc} />,
      locked: !canAccess("enterprise"),
      onPress: () => navEnterprise("/gestao", "Carteira"),
    },
    {
      label: "Painel Exec.",
      iconNode: <Feather name="grid" size={20} color={canAccess("enterprise") ? pinkIc : grayIc} />,
      locked: !canAccess("enterprise"),
      onPress: () => navEnterprise("/painelexecutivo", "Painel Executivo"),
    },
    {
      label: "Biblioteca",
      iconNode: <Feather name="book-open" size={20} color={pinkIc} />,
      locked: false,
      onPress: () => { tap(); router.push("/biblioteca" as any); },
    },
    {
      label: "Loja JADE",
      iconNode: <Feather name="shopping-cart" size={20} color={pinkIc} />,
      locked: false,
      onPress: () => { tap(); router.push("/loja" as any); },
    },
  ];

  return (
    <ScrollView
      style={[S.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingBottom: bottomPad }}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Header ── */}
      <View style={[S.header, { paddingTop: topPad + 4 }]}>
        <Text style={[S.title, { color: colors.text }]}>Mais</Text>
        {isDevMode && (
          <TouchableOpacity style={[S.devBadge, { backgroundColor: PINK + "22" }]} onPress={() => setDevModal(true)}>
            <Feather name="terminal" size={11} color={PINK} />
            <Text style={[S.devBadgeText, { color: PINK }]}>DEV • {planLabel}</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* ── Profile Card ── */}
      <View style={[S.profileCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[S.profileAvatar, { backgroundColor: planColor }]}>
          <Text style={S.profileInitials}>R</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[S.profileName, { color: colors.text }]}>Rodrigo</Text>
          <Text style={[S.profileRole, { color: colors.mutedForeground }]}>Fundador · JÁ Delivery</Text>
          <View style={[S.proBadge, { backgroundColor: planColor + "22" }]}>
            <Text style={[S.proBadgeText, { color: planColor }]}>✦ Plano {planLabel}</Text>
          </View>
        </View>
        <TouchableOpacity style={[S.editBtn, { backgroundColor: colors.surface }]}
          onPress={() => router.push("/perfil" as any)} activeOpacity={0.8}>
          <Feather name="edit-2" size={16} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* ── Plan Info Row ── */}
      <View style={S.statsRow}>
        <View style={[S.statBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[S.planDot, { backgroundColor: planColor }]} />
          <Text style={[S.statValue, { color: planColor }]}>{planLabel}</Text>
          <Text style={[S.statLabel, { color: colors.mutedForeground }]}>Plano atual</Text>
        </View>
        <TouchableOpacity
          style={[S.statBox, {
            backgroundColor: colors.card,
            borderColor: credits.warnLevel !== "ok"
              ? (credits.warnLevel === "empty" ? "#FF3B5C55" : "#FFB30055")
              : colors.border,
          }]}
          onPress={() => { tap(); router.push("/loja?tab=0" as any); }}
          activeOpacity={0.8}
        >
          <Text style={[S.statValue, {
            color: credits.warnLevel === "empty" ? "#FF3B5C"
                 : credits.warnLevel === "warn"  ? "#FFB300"
                 : colors.text,
          }]}>
            {credits.remaining}
          </Text>
          <Text style={[S.statLabel, { color: colors.mutedForeground }]}>Mensagens</Text>
          <View style={{ width: "100%", height: 3, backgroundColor: colors.border, borderRadius: 2, marginTop: 5, overflow: "hidden" }}>
            <View style={{
              position: "absolute", top: 0, left: 0, bottom: 0,
              width: `${credits.total > 0 ? Math.round((credits.remaining / credits.total) * 100) : 0}%` as any,
              backgroundColor: credits.warnLevel === "empty" ? "#FF3B5C" : credits.warnLevel === "warn" ? "#FFB300" : "#00D68F",
              borderRadius: 2,
            }} />
          </View>
          <Text style={[S.statBuyLink, { color: PINK }]}>Comprar mais</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[S.statBox, { backgroundColor: "#130026", borderColor: PINK + "66", borderWidth: 1.5 }]}
          onPress={() => { tap(); setUpgradeModal(true); }}
          activeOpacity={0.8}
        >
          <Feather name="arrow-up-circle" size={19} color={PINK} />
          <Text style={[S.statValue, { color: PINK, fontSize: 15, marginTop: 2 }]}>Upgrade</Text>
          <Text style={[S.statLabel, { color: PINK, opacity: 0.75 }]}>Ver planos</Text>
        </TouchableOpacity>
      </View>

      {/* ── Radar Stats Card ── */}
      {(() => {
        const radarWarn = radar.remaining === 0 ? "empty" : radar.remaining < radar.total * 0.2 ? "warn" : "ok";
        const radarColor = radarWarn === "empty" ? "#FF3B5C" : radarWarn === "warn" ? "#FFB300" : "#00D68F";
        const radarBorder = radarWarn !== "ok" ? (radarWarn === "empty" ? "#FF3B5C55" : "#FFB30055") : colors.border;
        return (
          <TouchableOpacity
            style={[S.radarStatCard, { backgroundColor: colors.card, borderColor: radarBorder }]}
            onPress={() => { tap(); router.push("/loja?tab=1" as any); }}
            activeOpacity={0.8}
          >
            <View style={S.radarStatLeft}>
              <View style={[S.radarStatIconWrap, { backgroundColor: "#FF008018" }]}>
                <Feather name="radio" size={16} color={PINK} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[S.radarStatLabel, { color: colors.mutedForeground }]}>Buscas Radar este mês</Text>
                <View style={[S.radarBarTrack, { backgroundColor: colors.border }]}>
                  <View style={[S.radarBarFill, {
                    width: `${radar.total > 0 ? Math.round((radar.remaining / radar.total) * 100) : 0}%` as any,
                    backgroundColor: radarColor,
                  }]} />
                </View>
              </View>
            </View>
            <View style={{ alignItems: "flex-end", gap: 2 }}>
              <Text style={[S.radarStatValue, { color: radarColor }]}>{radar.remaining}</Text>
              <Text style={[S.radarStatSub, { color: colors.mutedForeground }]}>de {radar.total}</Text>
              <Text style={[S.statBuyLink, { color: PINK }]}>Comprar mais</Text>
            </View>
          </TouchableOpacity>
        );
      })()}

      {/* ── Demo gratuita banner (Start sem demo usada) ── */}
      {hasDemoAvailable && (
        <View style={[S.demoBanner, { borderColor: PINK + "55" }]}>
          <View style={S.demoBannerInner}>
            <Text style={S.demoEmoji}>🎁</Text>
            <View style={{ flex: 1 }}>
              <Text style={S.demoTitle}>Você tem 1 demonstração gratuita</Text>
              <Text style={[S.demoSub, { color: colors.mutedForeground }]}>Experimente qualquer função Pro por 24 horas, sem custo</Text>
            </View>
          </View>
        </View>
      )}

      {/* ── Icon Grid (CapCut style — sem container card) ── */}
      <View style={S.gridWrap}>
        {GRID_ITEMS.map((item) => (
          <GridItem
            key={item.label}
            label={item.label}
            iconNode={item.iconNode}
            locked={item.locked}
            onPress={item.onPress}
          />
        ))}
      </View>

      {/* ── Seção CONTA (lista, igual antes) ── */}
      <View style={S.section}>
        <Text style={[S.sectionTitle, { color: colors.mutedForeground }]}>⚙️ CONTA</Text>
        <View style={[S.sectionBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <MenuItem colors={colors} icon="briefcase" label="Minha Empresa" sub="Configurar empresa e treinar JADE" divider onPress={() => { tap(); router.push("/empresa" as any); }} />
          <MenuItem colors={colors} icon="user" label="Meu Perfil" divider onPress={() => { tap(); router.push("/perfil" as any); }} />
          <MenuItem colors={colors} icon="star" label="Meu Plano" sub={`${planLabel} · ${userPlan === "enterprise" ? "R$697" : userPlan === "pro" ? "R$247" : "R$97"}/mês`} badge={planLabel} badgeColor={planColor} divider onPress={() => { tap(); router.push("/plano" as any); }} />
          <MenuItem colors={colors} icon="bell" label="Notificações" divider onPress={() => { tap(); router.push("/notificacoes" as any); }} />
          <MenuItem colors={colors} icon="shield" label="Privacidade e Dados" divider onPress={() => { tap(); router.push("/privacidade" as any); }} />
          <MenuItem colors={colors} icon="help-circle" label="Central de Ajuda" onPress={() => { tap(); router.push("/ajuda" as any); }} />
        </View>
      </View>

      {/* ── Logout ── */}
      <View style={[S.sectionBox, { backgroundColor: colors.card, borderColor: colors.border, marginHorizontal: 16, marginBottom: 20 }]}>
        <TouchableOpacity style={M.item} onPress={handleLogout} activeOpacity={0.7}>
          <View style={[M.iconWrap, { backgroundColor: colors.destructive + "22" }]}>
            <Feather name="log-out" size={20} color={colors.destructive} />
          </View>
          <Text style={[M.label, { color: colors.destructive, flex: 1 }]}>Sair da Conta</Text>
        </TouchableOpacity>
      </View>

      {/* ── Version / Dev trigger (7 taps) ── */}
      <TouchableOpacity onPress={onVersionTap} activeOpacity={0.8} style={{ alignItems: "center", paddingVertical: 14 }}>
        <Text style={[S.version, { color: colors.mutedForeground }]}>
          {isDevMode ? "⚙ DEV MODE  ·  " : ""}JADE IA v1.0.0
        </Text>
        {isDevMode ? (
          <TouchableOpacity onPress={() => setDevModal(true)} style={{ marginTop: 4 }}>
            <Text style={{ color: PINK, fontSize: 11, fontFamily: "SpaceGrotesk_600SemiBold" }}>Abrir Dev Tools</Text>
          </TouchableOpacity>
        ) : (
          <Text style={[S.versionHint, { color: colors.mutedForeground }]}>toque 7× para dev tools</Text>
        )}
      </TouchableOpacity>

      {/* ── Modals ── */}
      <PlanGateModal
        visible={gateVisible} plan={gatePlan} featureName={gateFeature}
        onClose={() => setGateVisible(false)}
        onUpgrade={() => { setGateVisible(false); router.push("/plano" as any); }}
      />
      <DevToolsModal
        visible={devModal} currentPlan={userPlan} isRealPlan={!isDevMode}
        onClose={() => setDevModal(false)}
        onChangePlan={handleChangePlan}
        onExitDev={handleExitDev}
      />

      {/* ── Upgrade Modal ── */}
      <Modal visible={upgradeModal} transparent animationType="slide" onRequestClose={() => setUpgradeModal(false)}>
        <TouchableOpacity style={G.overlay} activeOpacity={1} onPress={() => setUpgradeModal(false)}>
          <View style={[G.box, { alignItems: "stretch", gap: 0 }]} onStartShouldSetResponder={() => true}>
            <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: "#3A3A4E", alignSelf: "center", marginBottom: 18 }} />
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 6 }}>
              <Feather name="zap" size={20} color={PINK} />
              <Text style={[G.title, { fontSize: 18, textAlign: "left", flex: 1 }]}>Escolha seu plano</Text>
            </View>
            <Text style={{ color: "#7777AA", fontSize: 13, fontFamily: "SpaceGrotesk_400Regular", lineHeight: 19, marginBottom: 18 }}>
              Desbloqueie recursos avançados e potencialize suas vendas.
            </Text>
            {/* Pro Card */}
            <TouchableOpacity
              style={{ backgroundColor: "#1a003a", borderRadius: 16, padding: 16, borderWidth: 1.5, borderColor: PURPLE + "99", marginBottom: 12, gap: 6 }}
              onPress={() => { setUpgradeModal(false); router.push("/plano" as any); }}
              activeOpacity={0.85}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 }}>
                <View style={{ backgroundColor: PURPLE + "33", borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 }}>
                  <Text style={{ color: PURPLE, fontSize: 12, fontFamily: "SpaceGrotesk_700Bold" }}>✦ PRO</Text>
                </View>
                <Text style={{ color: PURPLE, fontSize: 20, fontFamily: "SpaceGrotesk_700Bold", marginLeft: "auto" }}>R$247<Text style={{ fontSize: 12, fontFamily: "SpaceGrotesk_400Regular" }}>/mês</Text></Text>
              </View>
              {["Objeções IA", "Criar Rota", "Planejamento", "Roleplay de Vendas", "Marketing IA"].map((f) => (
                <View key={f} style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <Feather name="check-circle" size={14} color={PURPLE} />
                  <Text style={{ color: "#CCAAFF", fontSize: 13, fontFamily: "SpaceGrotesk_400Regular" }}>{f}</Text>
                </View>
              ))}
              <View style={{ backgroundColor: PURPLE, borderRadius: 10, height: 40, alignItems: "center", justifyContent: "center", marginTop: 8 }}>
                <Text style={{ color: "#fff", fontSize: 14, fontFamily: "SpaceGrotesk_700Bold" }}>Assinar Pro</Text>
              </View>
            </TouchableOpacity>
            {/* Enterprise Card */}
            <TouchableOpacity
              style={{ backgroundColor: "#1a1000", borderRadius: 16, padding: 16, borderWidth: 1.5, borderColor: GOLD + "99", marginBottom: 16, gap: 6 }}
              onPress={() => { setUpgradeModal(false); router.push("/plano" as any); }}
              activeOpacity={0.85}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 }}>
                <View style={{ backgroundColor: GOLD + "33", borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 }}>
                  <Text style={{ color: GOLD, fontSize: 12, fontFamily: "SpaceGrotesk_700Bold" }}>⭐ ENTERPRISE</Text>
                </View>
                <Text style={{ color: GOLD, fontSize: 20, fontFamily: "SpaceGrotesk_700Bold", marginLeft: "auto" }}>R$697<Text style={{ fontSize: 12, fontFamily: "SpaceGrotesk_400Regular" }}>/mês</Text></Text>
              </View>
              {["Tudo do Pro", "Meu Time", "Metas avançadas", "Carteira de Clientes", "Painel Executivo"].map((f) => (
                <View key={f} style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <Feather name="check-circle" size={14} color={GOLD} />
                  <Text style={{ color: "#FFDDAA", fontSize: 13, fontFamily: "SpaceGrotesk_400Regular" }}>{f}</Text>
                </View>
              ))}
              <View style={{ backgroundColor: GOLD, borderRadius: 10, height: 40, alignItems: "center", justifyContent: "center", marginTop: 8 }}>
                <Text style={{ color: "#000", fontSize: 14, fontFamily: "SpaceGrotesk_700Bold" }}>Assinar Enterprise</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity style={DV.closeBtn} onPress={() => setUpgradeModal(false)} activeOpacity={0.85}>
              <Text style={DV.closeBtnText}>Agora não</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Credits modal */}
      <Modal visible={creditsModal} transparent animationType="slide" onRequestClose={() => setCreditsModal(false)}>
        <TouchableOpacity style={G.overlay} activeOpacity={1} onPress={() => setCreditsModal(false)}>
          <View style={[G.box, { alignItems: "stretch" }]} onStartShouldSetResponder={() => true}>
            <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: "#3A3A4E", alignSelf: "center", marginBottom: 14 }} />
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 14 }}>
              <Feather name="message-circle" size={20} color={PINK} />
              <Text style={[G.title, { flex: 1, textAlign: "left", fontSize: 16 }]}>Créditos WhatsApp</Text>
            </View>
            {/* Usage bar */}
            <View style={{ backgroundColor: "#070710", borderRadius: 12, padding: 14, gap: 8, borderWidth: 1, borderColor: "#1E1E2E", marginBottom: 14 }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                <Text style={{ color: "#AAAACC", fontSize: 12, fontFamily: "SpaceGrotesk_400Regular" }}>Usados este mês</Text>
                <Text style={{ color: "#fff", fontSize: 12, fontFamily: "SpaceGrotesk_700Bold" }}>{credits.used} / {credits.total}</Text>
              </View>
              <View style={{ height: 8, backgroundColor: "#1E1E2E", borderRadius: 4, overflow: "hidden" }}>
                <View style={{
                  position: "absolute", top: 0, left: 0, bottom: 0,
                  width: `${credits.total > 0 ? Math.round((credits.remaining / credits.total) * 100) : 0}%` as any,
                  backgroundColor: credits.warnLevel === "empty" ? "#FF3B5C" : credits.warnLevel === "warn" ? "#FFB300" : "#00D68F",
                  borderRadius: 4,
                }} />
              </View>
              <Text style={{ fontSize: 12, fontFamily: "SpaceGrotesk_600SemiBold", color: credits.warnLevel === "ok" ? "#00D68F" : credits.warnLevel === "warn" ? "#FFB300" : "#FF3B5C" }}>
                {credits.remaining} mensagens restantes
              </Text>
            </View>
            {/* Store */}
            <Text style={{ fontSize: 14, fontFamily: "SpaceGrotesk_700Bold", color: "#fff", marginBottom: 10 }}>Recarregar mensagens</Text>
            {([
              { amount: 100  as const, price: "R$19,90",  label: "100 mensagens",   sub: "Pacote Básico"  },
              { amount: 500  as const, price: "R$69,90",  label: "500 mensagens",   sub: "Pacote Pro"     },
              { amount: 2000 as const, price: "R$199,90", label: "2.000 mensagens", sub: "Pacote Max"     },
            ]).map((pkg) => {
              const sel = selectedPkg === pkg.amount;
              return (
                <TouchableOpacity
                  key={pkg.amount}
                  style={{
                    flexDirection: "row", alignItems: "center", borderRadius: 12, padding: 14, gap: 10,
                    borderWidth: sel ? 2 : 1,
                    borderColor: sel ? PINK : "#1E1E2E",
                    backgroundColor: sel ? "rgba(255,0,128,0.10)" : "#070710",
                    marginBottom: 8,
                  }}
                  onPress={() => setSelectedPkg(sel ? null : pkg.amount)}
                  activeOpacity={0.8}
                >
                  <View style={{
                    width: 20, height: 20, borderRadius: 10,
                    borderWidth: sel ? 0 : 1.5, borderColor: "#555",
                    backgroundColor: sel ? PINK : "transparent",
                    alignItems: "center", justifyContent: "center",
                  }}>
                    {sel && <Feather name="check" size={12} color="#fff" />}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: sel ? "#fff" : "#AAAACC", fontSize: 14, fontFamily: "SpaceGrotesk_700Bold" }}>{pkg.label}</Text>
                    <Text style={{ color: "#7777AA", fontSize: 11, fontFamily: "SpaceGrotesk_400Regular", marginTop: 2 }}>{pkg.sub}</Text>
                  </View>
                  <Text style={{ color: sel ? PINK : "#AAAACC", fontSize: 14, fontFamily: "SpaceGrotesk_700Bold" }}>{pkg.price}</Text>
                </TouchableOpacity>
              );
            })}
            <TouchableOpacity
              style={[DV.closeBtn, { marginTop: 4, backgroundColor: selectedPkg ? PINK : "#1A1A2E", borderRadius: 13, height: 48 }]}
              disabled={!selectedPkg}
              onPress={async () => {
                if (!selectedPkg) return;
                await credits.addExtra(selectedPkg);
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                setSelectedPkg(null);
                setCreditsModal(false);
                Alert.alert("✅ Créditos adicionados!", `+${selectedPkg} mensagens adicionadas à sua conta.`);
              }}
              activeOpacity={0.85}
            >
              <Text style={[DV.closeBtnText, { color: selectedPkg ? "#fff" : "#555" }]}>
                {selectedPkg ? `Comprar agora` : "Selecione um pacote"}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={[DV.closeBtn, { marginTop: 8 }]} onPress={() => { setCreditsModal(false); setSelectedPkg(null); }} activeOpacity={0.85}>
              <Text style={DV.closeBtnText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Demo offer modal */}
      <Modal visible={demoModal} transparent animationType="fade" onRequestClose={() => setDemoModal(false)}>
        <TouchableOpacity style={G.overlay} activeOpacity={1} onPress={() => setDemoModal(false)}>
          <View style={G.box} onStartShouldSetResponder={() => true}>
            <Text style={{ fontSize: 40 }}>🎁</Text>
            <Text style={G.title}>Usar sua demo gratuita?</Text>
            <Text style={G.sub}>
              Você terá acesso a{" "}
              <Text style={{ color: PINK, fontFamily: "SpaceGrotesk_600SemiBold" }}>{demoPending?.label}</Text>
              {" "}por 24 horas, gratuitamente.{"\n"}Após isso, voltará ao plano Start.
            </Text>
            <TouchableOpacity
              style={[G.btn, { backgroundColor: PINK }]}
              onPress={async () => {
                if (!demoPending) return;
                await useDemo(demoPending.label);
                setDemoModal(false);
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                router.push(demoPending.path as any);
                setDemoPending(null);
              }}
              activeOpacity={0.85}
            >
              <Feather name="zap" size={15} color="#fff" />
              <Text style={G.btnText}>Experimentar agora</Text>
            </TouchableOpacity>
            <TouchableOpacity style={G.cancel} onPress={() => { setDemoModal(false); setDemoPending(null); }} activeOpacity={0.7}>
              <Text style={G.cancelText}>Guardar para depois</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </ScrollView>
  );
}

const S = StyleSheet.create({
  container:    { flex: 1 },
  header:       { paddingHorizontal: 20, paddingBottom: 12, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  title:        { fontSize: 26, fontFamily: "SpaceGrotesk_700Bold" },
  devBadge:     { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 9, paddingVertical: 4, borderRadius: 10 },
  devBadgeText: { fontSize: 11, fontFamily: "SpaceGrotesk_700Bold", letterSpacing: 0.4 },

  profileCard:  { flexDirection: "row", alignItems: "center", marginHorizontal: 16, marginBottom: 12, padding: 16, borderRadius: 16, borderWidth: 1, gap: 14 },
  profileAvatar:{ width: 56, height: 56, borderRadius: 28, alignItems: "center", justifyContent: "center" },
  profileInitials: { color: "#fff", fontSize: 22, fontFamily: "SpaceGrotesk_700Bold" },
  profileName:  { fontSize: 17, fontFamily: "SpaceGrotesk_700Bold" },
  profileRole:  { fontSize: 12, fontFamily: "SpaceGrotesk_400Regular", marginTop: 2 },
  proBadge:     { alignSelf: "flex-start", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, marginTop: 6 },
  proBadgeText: { fontSize: 11, fontFamily: "SpaceGrotesk_600SemiBold" },
  editBtn:      { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },

  statsRow:     { flexDirection: "row", marginHorizontal: 16, marginBottom: 16, gap: 10 },
  statBox:      { flex: 1, alignItems: "center", paddingVertical: 14, borderRadius: 12, borderWidth: 1 },
  statValue:    { fontSize: 18, fontFamily: "SpaceGrotesk_700Bold" },
  statLabel:    { fontSize: 11, fontFamily: "SpaceGrotesk_400Regular", marginTop: 2, opacity: 0.7 },

  demoBanner:   { marginHorizontal: 16, marginBottom: 14, borderRadius: 14, borderWidth: 1.5, overflow: "hidden" },
  demoBannerInner: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14, backgroundColor: "#FF008012" },
  demoEmoji:    { fontSize: 28 },
  demoTitle:    { fontSize: 14, fontFamily: "SpaceGrotesk_700Bold", color: "#fff" },
  demoSub:      { fontSize: 12, fontFamily: "SpaceGrotesk_400Regular", marginTop: 3, lineHeight: 17 },

  gridWrap:     { flexDirection: "row", flexWrap: "wrap", paddingHorizontal: 8, marginBottom: 20 },

  planDot:      { width: 8, height: 8, borderRadius: 4, marginBottom: 2 },
  statBuyLink:  { fontSize: 10, fontFamily: "SpaceGrotesk_600SemiBold", marginTop: 4 },

  radarStatCard:    { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginHorizontal: 16, marginBottom: 14, padding: 14, borderRadius: 12, borderWidth: 1, gap: 12 },
  radarStatLeft:    { flex: 1, flexDirection: "row", alignItems: "center", gap: 10 },
  radarStatIconWrap:{ width: 32, height: 32, borderRadius: 9, alignItems: "center", justifyContent: "center" },
  radarStatLabel:   { fontSize: 11, fontFamily: "SpaceGrotesk_400Regular", marginBottom: 6 },
  radarBarTrack:    { height: 5, borderRadius: 3, overflow: "hidden", position: "relative" },
  radarBarFill:     { position: "absolute", top: 0, left: 0, bottom: 0, borderRadius: 3 },
  radarStatValue:   { fontSize: 20, fontFamily: "SpaceGrotesk_700Bold" },
  radarStatSub:     { fontSize: 11, fontFamily: "SpaceGrotesk_400Regular" },

  section:      { marginBottom: 16 },
  sectionTitle: { fontSize: 10, fontFamily: "SpaceGrotesk_600SemiBold", letterSpacing: 1, marginHorizontal: 20, marginBottom: 8 },
  sectionBox:   { marginHorizontal: 16, borderRadius: 14, borderWidth: 1, overflow: "hidden" },

  version:      { textAlign: "center", fontSize: 11, fontFamily: "SpaceGrotesk_400Regular" },
  versionHint:  { textAlign: "center", fontSize: 9, fontFamily: "SpaceGrotesk_400Regular", marginTop: 2, opacity: 0.3 },
});
