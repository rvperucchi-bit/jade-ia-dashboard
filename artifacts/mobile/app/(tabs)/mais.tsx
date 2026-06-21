import React, { useRef } from "react";
import {
  Alert,
  Animated,
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

import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/context/AuthContext";
import { usePlan, type Plan } from "@/context/PlanContext";

const PURPLE = "#8400FF";
const GOLD   = "#FFB800";
const PINK   = "#FF0080";

// ─── Icon helper ──────────────────────────────────────────────────────────────
function Icon({ name, lib, color }: { name: string; lib: "feather" | "mci"; color: string }) {
  if (lib === "mci") return <MaterialCommunityIcons name={name as any} size={20} color={color} />;
  return <Feather name={name as any} size={20} color={color} />;
}

// ─── Plan Gate Modal ──────────────────────────────────────────────────────────
function PlanGateModal({ visible, plan, featureName, onClose, onUpgrade }: {
  visible: boolean; plan: "pro" | "enterprise"; featureName: string;
  onClose: () => void; onUpgrade: () => void;
}) {
  const c = plan === "enterprise" ? GOLD : PURPLE;
  const label = plan === "enterprise" ? "Enterprise" : "Pro";
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={G.overlay} activeOpacity={1} onPress={onClose}>
        <View style={G.box} onStartShouldSetResponder={() => true}>
          <View style={[G.iconWrap, { backgroundColor: c + "22", borderColor: c + "44" }]}>
            <Feather name="lock" size={28} color={c} />
          </View>
          <Text style={G.title}>Plano {label} necessário</Text>
          <Text style={G.sub}>
            <Text style={{ color: c, fontFamily: "SpaceGrotesk_600SemiBold" }}>{featureName}</Text>
            {" "}está disponível no plano {label}.
          </Text>
          <TouchableOpacity style={[G.btn, { backgroundColor: c }]} onPress={onUpgrade} activeOpacity={0.85}>
            <Feather name="zap" size={15} color="#fff" />
            <Text style={G.btnText}>Atualizar agora</Text>
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
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.80)", alignItems: "center", justifyContent: "center", padding: 24 },
  box:     { backgroundColor: "#111118", borderRadius: 22, padding: 26, alignItems: "center", width: "100%", borderWidth: 1, borderColor: "#1E1E2E", gap: 10 },
  iconWrap:{ width: 60, height: 60, borderRadius: 30, alignItems: "center", justifyContent: "center", borderWidth: 1, marginBottom: 2 },
  title:   { fontSize: 18, fontFamily: "SpaceGrotesk_700Bold", color: "#fff", textAlign: "center" },
  sub:     { fontSize: 13, fontFamily: "SpaceGrotesk_400Regular", color: "#AAAACC", textAlign: "center", lineHeight: 21 },
  btn:     { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 13, height: 48, width: "100%" },
  btnText: { fontSize: 15, fontFamily: "SpaceGrotesk_700Bold", color: "#fff" },
  cancel:  { paddingVertical: 8 },
  cancelText: { fontSize: 13, fontFamily: "SpaceGrotesk_500Medium", color: "#7777AA" },
});

// ─── Locked menu item wrapper ─────────────────────────────────────────────────
function MenuItem({
  icon, iconLib, label, sub, badge, badgeColor, danger,
  locked, lockedPlan, onPress, onLockedPress, colors,
  divider,
}: {
  icon: string; iconLib: "feather" | "mci";
  label: string; sub?: string; badge?: string; badgeColor?: string;
  danger?: boolean; locked?: boolean; lockedPlan?: string;
  onPress?: () => void; onLockedPress?: () => void;
  colors: ReturnType<typeof useColors>;
  divider?: boolean;
}) {
  const iconColor = danger ? colors.destructive : locked ? "#555577" : colors.primary;
  const textColor = danger ? colors.destructive : locked ? "#444466" : colors.text;
  const subColor  = locked ? "#333355" : colors.mutedForeground;

  return (
    <>
      <TouchableOpacity
        style={[M.item, { opacity: locked ? 0.45 : 1 }]}
        onPress={locked ? onLockedPress : onPress}
        activeOpacity={0.7}
      >
        <View style={[M.iconWrap, { backgroundColor: danger ? colors.destructive + "22" : locked ? "#1A1A2E" : colors.surface }]}>
          <Icon name={icon} lib={iconLib} color={iconColor} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[M.label, { color: textColor }]}>{label}</Text>
          {sub && <Text style={[M.sub, { color: subColor }]}>{sub}</Text>}
        </View>
        {locked && (
          <Feather name="lock" size={13} color="#444466" style={{ marginRight: 2 }} />
        )}
        {badge && !locked && (
          <View style={[M.badge, { backgroundColor: badgeColor ?? colors.primary }]}>
            <Text style={M.badgeText}>{badge}</Text>
          </View>
        )}
        {!danger && !locked && (
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
  badgeText:{ color: "#fff", fontSize: 11, fontFamily: "SpaceGrotesk_700Bold" },
  divider:  { height: StyleSheet.hairlineWidth, marginLeft: 62 },
});

// ─── Dev Tools Modal ──────────────────────────────────────────────────────────
function DevToolsModal({ visible, currentPlan, onClose, onChangePlan }: {
  visible: boolean; currentPlan: Plan;
  onClose: () => void; onChangePlan: (p: Plan) => void;
}) {
  const PLANS: { id: Plan; label: string; color: string; price: string }[] = [
    { id: "start",      label: "Start",      color: "#6C63FF", price: "R$97/mês"  },
    { id: "pro",        label: "Pro",        color: PURPLE,    price: "R$247/mês" },
    { id: "enterprise", label: "Enterprise", color: GOLD,      price: "R$697/mês" },
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
          <Text style={DV.sub}>Selecione o plano para simular a experiência do usuário. Nenhum pagamento é cobrado.</Text>
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
          <TouchableOpacity style={DV.closeBtn} onPress={onClose} activeOpacity={0.85}>
            <Text style={DV.closeBtnText}>Fechar</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const DV = StyleSheet.create({
  overlay:    { flex: 1, backgroundColor: "rgba(0,0,0,0.80)", justifyContent: "flex-end" },
  sheet:      { backgroundColor: "#0F0F1A", borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, gap: 14, paddingBottom: 40, borderTopWidth: 1, borderColor: "#1E1E2E" },
  handle:     { width: 40, height: 4, borderRadius: 2, backgroundColor: "#3A3A4E", alignSelf: "center" },
  titleRow:   { flexDirection: "row", alignItems: "center", gap: 8 },
  title:      { fontSize: 18, fontFamily: "SpaceGrotesk_700Bold", color: "#fff", flex: 1 },
  devBadge:   { backgroundColor: PINK + "22", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  devBadgeText: { fontSize: 10, fontFamily: "SpaceGrotesk_700Bold", color: PINK, letterSpacing: 0.5 },
  sub:        { fontSize: 13, fontFamily: "SpaceGrotesk_400Regular", color: "#7777AA", lineHeight: 19 },
  planBtn:    { flexDirection: "row", alignItems: "center", gap: 10, borderRadius: 14, padding: 14 },
  planDot:    { width: 8, height: 8, borderRadius: 4 },
  planLabel:  { fontSize: 15, fontFamily: "SpaceGrotesk_700Bold", flex: 1 },
  planPrice:  { fontSize: 12, fontFamily: "SpaceGrotesk_400Regular" },
  closeBtn:   { backgroundColor: "#1A1A2E", borderRadius: 13, height: 46, alignItems: "center", justifyContent: "center", marginTop: 4 },
  closeBtnText: { color: "#AAAACC", fontSize: 14, fontFamily: "SpaceGrotesk_600SemiBold" },
});

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function MaisScreen() {
  const colors  = useColors();
  const insets  = useSafeAreaInsets();
  const router  = useRouter();
  const { logout } = useAuth();
  const { userPlan, setUserPlan, isDevMode, setDevMode, canAccess } = usePlan();

  const [upgradeModal, setUpgradeModal] = React.useState(false);
  const [gateVisible,  setGateVisible]  = React.useState(false);
  const [gatePlan,     setGatePlan]     = React.useState<"pro" | "enterprise">("pro");
  const [gateFeature,  setGateFeature]  = React.useState("");
  const [devModal,     setDevModal]     = React.useState(false);

  // Long press on version (5 seconds) → unlock dev tools
  const holdTimer  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const holdCount  = useRef(new Animated.Value(1)).current;
  const isHolding  = useRef(false);

  const onVersionPressIn = () => {
    isHolding.current = true;
    Animated.timing(holdCount, { toValue: 0, duration: 5000, useNativeDriver: false }).start();
    holdTimer.current = setTimeout(() => {
      if (isHolding.current) {
        setDevMode(true);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setDevModal(true);
      }
    }, 5000);
  };

  const onVersionPressOut = () => {
    isHolding.current = false;
    if (holdTimer.current) clearTimeout(holdTimer.current);
    Animated.timing(holdCount, { toValue: 1, duration: 200, useNativeDriver: false }).start();
  };

  const tap = () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

  const openGate = (plan: "pro" | "enterprise", feature: string) => {
    tap(); setGatePlan(plan); setGateFeature(feature); setGateVisible(true);
  };

  const navPro = (path: string, label: string) => {
    tap();
    if (!canAccess("pro")) { openGate("pro", label); return; }
    router.push(path as any);
  };

  const navEnterprise = (path: string, label: string) => {
    tap();
    if (!canAccess("enterprise")) { openGate("enterprise", label); return; }
    router.push(path as any);
  };

  const handleGestaoPress = () => {
    if (!canAccess("enterprise")) { openGate("enterprise", "Gestão Comercial"); return; }
    tap(); router.push("/gestao" as any);
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

  // Plan display
  const planLabel = userPlan === "enterprise" ? "Enterprise" : userPlan === "pro" ? "Pro" : "Start";
  const planColor = userPlan === "enterprise" ? GOLD : userPlan === "pro" ? PURPLE : "#6C63FF";

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingBottom: bottomPad }}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Header ── */}
      <View style={[styles.header, { paddingTop: topPad + 4 }]}>
        <Text style={[styles.title, { color: colors.text }]}>Mais</Text>
        {isDevMode && (
          <TouchableOpacity style={[styles.devBadge, { backgroundColor: PINK + "22" }]} onPress={() => setDevModal(true)}>
            <Feather name="terminal" size={11} color={PINK} />
            <Text style={[styles.devBadgeText, { color: PINK }]}>DEV • {planLabel}</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* ── Profile Card ── */}
      <View style={[styles.profileCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.profileAvatar, { backgroundColor: planColor }]}>
          <Text style={styles.profileInitials}>R</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.profileName, { color: colors.text }]}>Rodrigo</Text>
          <Text style={[styles.profileRole, { color: colors.mutedForeground }]}>Fundador · JÁ Delivery</Text>
          <View style={[styles.proBadge, { backgroundColor: planColor + "22" }]}>
            <Text style={[styles.proBadgeText, { color: planColor }]}>✦ Plano {planLabel}</Text>
          </View>
        </View>
        <TouchableOpacity style={[styles.editBtn, { backgroundColor: colors.surface }]}
          onPress={() => router.push("/perfil" as any)} activeOpacity={0.8}>
          <Feather name="edit-2" size={16} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* ── Stats ── */}
      <View style={styles.statsRow}>
        {[{ label: "Leads", value: "124" }, { label: "Fechados", value: "38" }, { label: "Receita", value: "R$92k" }].map((s, i) => (
          <View key={i} style={[styles.statBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.statValue, { color: colors.text }]}>{s.value}</Text>
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{s.label}</Text>
          </View>
        ))}
      </View>

      {/* ── Gestão Enterprise card ── */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>GESTÃO ENTERPRISE</Text>
        <TouchableOpacity
          style={[styles.enterpriseCard, { borderColor: PURPLE + "50", opacity: canAccess("enterprise") ? 1 : 0.5 }]}
          onPress={handleGestaoPress}
          activeOpacity={0.85}
        >
          <View style={styles.enterpriseGradient}>
            <View style={[styles.enterpriseIcon, { backgroundColor: PURPLE + "30" }]}>
              <MaterialCommunityIcons name="crown" size={26} color={PURPLE} />
            </View>
            <View style={{ flex: 1 }}>
              <View style={styles.enterpriseTitleRow}>
                <Text style={styles.enterpriseLabel}>Gestão Comercial</Text>
                <View style={styles.enterpriseBadge}>
                  <Text style={styles.enterpriseBadgeText}>Enterprise</Text>
                </View>
              </View>
              <Text style={styles.enterpriseSub}>Time, metas, carteira, feedback e relatórios</Text>
            </View>
            <Feather name={canAccess("enterprise") ? "arrow-right" : "lock"} size={18} color={PURPLE} />
          </View>
        </TouchableOpacity>
      </View>

      {/* ── Ferramentas Rápidas ── */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>⚡ FERRAMENTAS RÁPIDAS</Text>
        <View style={[styles.sectionBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <MenuItem colors={colors} icon="file-text" iconLib="feather" label="Roteiro de Vendas" sub="Script do contato ao fechamento" divider onPress={() => { tap(); router.push("/roteiro" as any); }} />
          <MenuItem colors={colors} icon="clipboard" iconLib="feather" label="Briefing Pré-Reunião" sub="Chegue preparado para qualquer reunião" divider onPress={() => { tap(); router.push("/briefing" as any); }} />
          <MenuItem colors={colors} icon="shield" iconLib="feather" label="Ajuda com Objeções" sub="Estratégias prontas para qualquer objeção" badge="PRO" badgeColor={PURPLE} locked={!canAccess("pro")} lockedPlan="pro" divider onPress={() => navPro("/objecoes", "Ajuda com Objeções")} onLockedPress={() => openGate("pro", "Ajuda com Objeções")} />
          <MenuItem colors={colors} icon="search" iconLib="feather" label="Scanner Radar" sub="Buscar novos estabelecimentos" onPress={() => { tap(); router.push("/scanner" as any); }} />
        </View>
      </View>

      {/* ── Planejamento ── */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>📋 PLANEJAMENTO</Text>
        <View style={[styles.sectionBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <MenuItem colors={colors} icon="award" iconLib="feather" label="Laudo Executivo" sub="Diagnóstico de marketing do cliente" divider onPress={() => { tap(); router.push("/laudo" as any); }} />
          <MenuItem colors={colors} icon="navigation" iconLib="feather" label="Criar Rota" sub="Planejamento inteligente de visitas" badge="PRO" badgeColor={PURPLE} locked={!canAccess("pro")} divider onPress={() => navPro("/criarrota", "Criar Rota")} onLockedPress={() => openGate("pro", "Criar Rota")} />
          <MenuItem colors={colors} icon="calendar" iconLib="feather" label="Planejamento do Dia" sub="Organize e confirme sua agenda diária" badge="Enterprise" badgeColor={GOLD} locked={!canAccess("enterprise")} onPress={() => navEnterprise("/planejamento", "Planejamento do Dia")} onLockedPress={() => openGate("enterprise", "Planejamento do Dia")} />
        </View>
      </View>

      {/* ── Marketing ── */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>📣 MARKETING</Text>
        <View style={[styles.sectionBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <MenuItem colors={colors} icon="zap" iconLib="feather" label="JADE Marketing IA" sub="Campanhas, criativos e relatórios" divider onPress={() => { tap(); router.push("/marketing" as any); }} />
          <MenuItem colors={colors} icon="bar-chart-2" iconLib="feather" label="Relatórios" sub="Métricas diárias e semanais" badge="PRO" badgeColor={PURPLE} locked={!canAccess("pro")} divider onPress={() => navPro("/relatorios", "Relatórios")} onLockedPress={() => openGate("pro", "Relatórios")} />
          <MenuItem colors={colors} icon="award" iconLib="feather" label="Análise Estratégica" sub="IA analisa seus dados e sugere ações" badge="PRO" badgeColor={PURPLE} locked={!canAccess("pro")} onPress={() => navPro("/analise", "Análise Estratégica")} onLockedPress={() => openGate("pro", "Análise Estratégica")} />
        </View>
      </View>

      {/* ── Performance ── */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>📊 PERFORMANCE</Text>
        <View style={[styles.sectionBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <MenuItem colors={colors} icon="bar-chart-2" iconLib="feather" label="Relatório Gestor" sub="Exportar para diretoria" badge="PRO" badgeColor={PURPLE} locked={!canAccess("pro")} divider onPress={() => navPro("/relatoriogestor", "Relatório Gestor")} onLockedPress={() => openGate("pro", "Relatório Gestor")} />
          <MenuItem colors={colors} icon="users" iconLib="feather" label="Meu Time" sub="Gerenciar e ranquear vendedores" badge="Enterprise" badgeColor={GOLD} locked={!canAccess("enterprise")} divider onPress={() => navEnterprise("/meutime", "Meu Time")} onLockedPress={() => openGate("enterprise", "Meu Time")} />
          <MenuItem colors={colors} icon="target" iconLib="feather" label="Metas" sub="Definir e acompanhar metas do time" badge="Enterprise" badgeColor={GOLD} locked={!canAccess("enterprise")} onPress={() => navEnterprise("/metas", "Metas")} onLockedPress={() => openGate("enterprise", "Metas")} />
        </View>
      </View>

      {/* ── Treinamento ── */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>🎓 TREINAMENTO</Text>
        <View style={[styles.sectionBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <MenuItem colors={colors} icon="users" iconLib="feather" label="Roleplay de Vendas" sub="Treine com a JADE como cliente" badge="Enterprise" badgeColor={GOLD} locked={!canAccess("enterprise")} divider onPress={() => navEnterprise("/roleplay", "Roleplay de Vendas")} onLockedPress={() => openGate("enterprise", "Roleplay de Vendas")} />
          <MenuItem colors={colors} icon="book-open" iconLib="feather" label="Biblioteca de Técnicas" sub="SPIN, AIDA, Gatilhos e mais" onPress={() => { tap(); router.push("/biblioteca" as any); }} />
        </View>
      </View>

      {/* ── Conta ── */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>⚙️ CONTA</Text>
        <View style={[styles.sectionBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <MenuItem colors={colors} icon="briefcase" iconLib="feather" label="Minha Empresa" sub="Configurar empresa e treinar JADE" divider onPress={() => { tap(); router.push("/empresa" as any); }} />
          <MenuItem colors={colors} icon="user" iconLib="feather" label="Meu Perfil" sub="Rodrigo" divider onPress={() => { tap(); router.push("/perfil" as any); }} />
          <MenuItem colors={colors} icon="star" iconLib="feather" label="Meu Plano" sub={`${planLabel} · ${userPlan === "enterprise" ? "R$697" : userPlan === "pro" ? "R$247" : "R$97"}/mês`} badge={planLabel} badgeColor={planColor} divider onPress={() => { tap(); router.push("/plano" as any); }} />
          <MenuItem colors={colors} icon="bell" iconLib="feather" label="Notificações" divider onPress={() => { tap(); router.push("/notificacoes" as any); }} />
          <MenuItem colors={colors} icon="shield" iconLib="feather" label="Privacidade e Dados" divider onPress={() => { tap(); router.push("/privacidade" as any); }} />
          <MenuItem colors={colors} icon="help-circle" iconLib="feather" label="Central de Ajuda" onPress={() => { tap(); router.push("/ajuda" as any); }} />
        </View>
      </View>

      {/* ── Logout ── */}
      <View style={[styles.sectionBox, { backgroundColor: colors.card, borderColor: colors.border, marginHorizontal: 16, marginBottom: 16 }]}>
        <MenuItem colors={colors} icon="log-out" iconLib="feather" label="Sair da Conta" danger onPress={handleLogout} />
      </View>

      {/* ── Version / Dev Mode trigger ── */}
      <TouchableOpacity
        onPressIn={onVersionPressIn}
        onPressOut={onVersionPressOut}
        activeOpacity={1}
        style={{ alignItems: "center", paddingVertical: 12, marginBottom: 8 }}
      >
        <Animated.View style={[styles.versionBar, { backgroundColor: PINK, opacity: holdCount.interpolate({ inputRange: [0, 1], outputRange: [0.8, 0] }), transform: [{ scaleX: holdCount.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }) }] }]} />
        <Text style={[styles.version, { color: colors.mutedForeground }]}>
          {isDevMode ? "⚙ DEV MODE · " : ""}JADE IA v1.0.0
        </Text>
        {!isDevMode && (
          <Text style={[styles.versionHint, { color: colors.mutedForeground }]}>mantém pressionado para dev</Text>
        )}
        {isDevMode && (
          <TouchableOpacity onPress={() => setDevModal(true)} style={{ marginTop: 4 }}>
            <Text style={{ color: PINK, fontSize: 11, fontFamily: "SpaceGrotesk_600SemiBold" }}>Abrir Dev Tools</Text>
          </TouchableOpacity>
        )}
      </TouchableOpacity>

      {/* ── Plan Gate Modal ── */}
      <PlanGateModal
        visible={gateVisible} plan={gatePlan} featureName={gateFeature}
        onClose={() => setGateVisible(false)}
        onUpgrade={() => { setGateVisible(false); router.push("/plano" as any); }}
      />

      {/* ── Enterprise (legacy) upgrade modal ── */}
      <Modal visible={upgradeModal} transparent animationType="fade" onRequestClose={() => setUpgradeModal(false)}>
        <TouchableOpacity style={G.overlay} activeOpacity={1} onPress={() => setUpgradeModal(false)}>
          <View style={G.box} onStartShouldSetResponder={() => true}>
            <View style={[G.iconWrap, { backgroundColor: PURPLE + "22", borderColor: PURPLE + "44" }]}>
              <MaterialCommunityIcons name="crown" size={36} color={PURPLE} />
            </View>
            <Text style={G.title}>Gestão Enterprise</Text>
            <Text style={G.sub}>Gerencie seu time de vendas completo com IA.</Text>
            <TouchableOpacity style={[G.btn, { backgroundColor: PURPLE }]}
              onPress={() => { setUpgradeModal(false); router.push("/plano" as any); }} activeOpacity={0.85}>
              <Text style={G.btnText}>Fazer Upgrade para Enterprise</Text>
            </TouchableOpacity>
            <TouchableOpacity style={G.cancel} onPress={() => setUpgradeModal(false)}>
              <Text style={G.cancelText}>Agora não</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ── Dev Tools Modal ── */}
      <DevToolsModal
        visible={devModal}
        currentPlan={userPlan}
        onClose={() => setDevModal(false)}
        onChangePlan={(p) => { setUserPlan(p); Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); }}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
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
  statsRow:     { flexDirection: "row", marginHorizontal: 16, marginBottom: 20, gap: 10 },
  statBox:      { flex: 1, alignItems: "center", paddingVertical: 14, borderRadius: 12, borderWidth: 1 },
  statValue:    { fontSize: 18, fontFamily: "SpaceGrotesk_700Bold" },
  statLabel:    { fontSize: 11, fontFamily: "SpaceGrotesk_400Regular", marginTop: 2, opacity: 0.7 },
  section:      { marginBottom: 16 },
  sectionTitle: { fontSize: 10, fontFamily: "SpaceGrotesk_600SemiBold", letterSpacing: 1, marginHorizontal: 20, marginBottom: 8 },
  enterpriseCard: { marginHorizontal: 16, borderRadius: 16, borderWidth: 1.5, overflow: "hidden" },
  enterpriseGradient: { flexDirection: "row", alignItems: "center", gap: 14, padding: 16, backgroundColor: PURPLE + "14" },
  enterpriseIcon: { width: 50, height: 50, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  enterpriseTitleRow: { flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" },
  enterpriseLabel: { fontSize: 16, fontFamily: "SpaceGrotesk_700Bold", color: "#fff" },
  enterpriseBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, backgroundColor: PURPLE + "30" },
  enterpriseBadgeText: { fontSize: 11, fontFamily: "SpaceGrotesk_700Bold", color: PURPLE },
  enterpriseSub: { fontSize: 12, fontFamily: "SpaceGrotesk_400Regular", marginTop: 3, color: "#AAAACC" },
  sectionBox:   { marginHorizontal: 16, borderRadius: 14, borderWidth: 1, overflow: "hidden" },
  version:      { textAlign: "center", fontSize: 11, fontFamily: "SpaceGrotesk_400Regular", marginTop: 4 },
  versionHint:  { textAlign: "center", fontSize: 9, fontFamily: "SpaceGrotesk_400Regular", marginTop: 2, opacity: 0.35 },
  versionBar:   { height: 2, width: 80, borderRadius: 1, marginBottom: 6 },
});
