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
import AsyncStorage from "@react-native-async-storage/async-storage";

import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/context/AuthContext";
import { usePlan, type Plan } from "@/context/PlanContext";

const PURPLE = "#8400FF";
const GOLD   = "#FFB800";
const PINK   = "#FF0080";
const INDIGO = "#6C63FF";

const DEV_PLAN_KEY = "@jade_dev_plan";

// ─── Plan Gate Modal ──────────────────────────────────────────────────────────
function PlanGateModal({ visible, plan, featureName, onClose, onUpgrade }: {
  visible: boolean; plan: "pro"; featureName: string;
  onClose: () => void; onUpgrade: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={G.overlay} activeOpacity={1} onPress={onClose}>
        <View style={G.box} onStartShouldSetResponder={() => true}>
          <View style={[G.iconWrap, { backgroundColor: PURPLE + "22", borderColor: PURPLE + "44" }]}>
            <Feather name="lock" size={28} color={PURPLE} />
          </View>
          <Text style={G.title}>Plano Pro necessário</Text>
          <Text style={G.sub}>
            <Text style={{ color: PURPLE, fontFamily: "SpaceGrotesk_600SemiBold" }}>{featureName}</Text>
            {" "}está disponível no plano Pro.{"\n"}Faça upgrade e desbloqueie todos os recursos avançados.
          </Text>
          <TouchableOpacity style={[G.btn, { backgroundColor: PURPLE }]} onPress={onUpgrade} activeOpacity={0.85}>
            <Feather name="zap" size={15} color="#fff" />
            <Text style={G.btnText}>Ver plano Pro — R$247/mês</Text>
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

// ─── MenuItem ──────────────────────────────────────────────────────────────────
function MenuItem({
  icon, label, sub, badge, badgeColor, danger, locked,
  onPress, colors, divider,
}: {
  icon: string; label: string; sub?: string; badge?: string; badgeColor?: string;
  danger?: boolean; locked?: boolean;
  onPress?: () => void; colors: ReturnType<typeof useColors>; divider?: boolean;
}) {
  const iconColor = danger ? colors.destructive : locked ? "#444466" : colors.primary;
  const textColor = danger ? colors.destructive : locked ? "#444466" : colors.text;
  return (
    <>
      <TouchableOpacity
        style={[M.item, { opacity: locked ? 0.45 : 1 }]}
        onPress={onPress}
        activeOpacity={0.7}
        disabled={!onPress}
      >
        <View style={[M.iconWrap, { backgroundColor: danger ? colors.destructive + "22" : locked ? "#1A1A2E" : colors.surface }]}>
          <Feather name={icon as any} size={20} color={iconColor} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[M.label, { color: textColor }]}>{label}</Text>
          {sub && <Text style={[M.sub, { color: locked ? "#333355" : colors.mutedForeground }]}>{sub}</Text>}
        </View>
        {locked && <Feather name="lock" size={13} color="#444466" style={{ marginRight: 2 }} />}
        {badge && !locked && (
          <View style={[M.badge, { backgroundColor: (badgeColor ?? colors.primary) + "22" }]}>
            <Text style={[M.badgeText, { color: badgeColor ?? colors.primary }]}>{badge}</Text>
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
const REAL_PLAN: Plan = "start"; // change this to the real paid plan for production

export default function MaisScreen() {
  const colors  = useColors();
  const insets  = useSafeAreaInsets();
  const router  = useRouter();
  const { logout } = useAuth();
  const { userPlan, setUserPlan, isDevMode, setDevMode, canAccess } = usePlan();

  const [gateVisible, setGateVisible] = React.useState(false);
  const [gateFeature, setGateFeature] = React.useState("");
  const [devModal,    setDevModal]    = React.useState(false);

  // ── Dev mode: 7 quick taps ────────────────────────────────────────────────
  const tapCount    = useRef(0);
  const tapTimer    = useRef<ReturnType<typeof setTimeout> | null>(null);

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

    // reset tap count after 3 seconds of inactivity
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

  const tap   = () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  const navPro = (path: string, label: string) => {
    tap();
    if (!canAccess("pro")) { setGateFeature(label); setGateVisible(true); return; }
    router.push(path as any);
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

      {/* ── Gestão Enterprise (Enterprise only — prominent card) ── */}
      {canAccess("enterprise") && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>👑 GESTÃO ENTERPRISE</Text>
          <TouchableOpacity
            style={[styles.enterpriseCard, { borderColor: GOLD + "55" }]}
            onPress={() => { tap(); router.push("/gestao" as any); }}
            activeOpacity={0.85}
          >
            <View style={styles.enterpriseInner}>
              <View style={[styles.enterpriseIcon, { backgroundColor: GOLD + "22" }]}>
                <MaterialCommunityIcons name="crown" size={26} color={GOLD} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.enterpriseLabel}>Central de Gestão</Text>
                <Text style={styles.enterpriseSub}>Time, Metas, Carteira, Planejamento, Painel Executivo</Text>
              </View>
              <Feather name="arrow-right" size={18} color={GOLD} />
            </View>
          </TouchableOpacity>
        </View>
      )}

      {/* ── Ferramentas ── */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>⚡ FERRAMENTAS</Text>
        <View style={[styles.sectionBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <MenuItem colors={colors} icon="file-text" label="Roteiro de Vendas" sub="Script do contato ao fechamento" divider onPress={() => { tap(); router.push("/roteiro" as any); }} />
          <MenuItem colors={colors} icon="clipboard" label="Briefing Pré-Reunião" sub="Chegue preparado para qualquer reunião" divider onPress={() => { tap(); router.push("/briefing" as any); }} />
          <MenuItem colors={colors} icon="award" label="Laudo Executivo" sub="Diagnóstico de marketing do cliente" divider onPress={() => { tap(); router.push("/laudo" as any); }} />
          <MenuItem colors={colors} icon="shield" label="Ajuda com Objeções" sub="Estratégias prontas" badge="PRO" badgeColor={PURPLE} locked={!canAccess("pro")} divider onPress={() => navPro("/objecoes", "Ajuda com Objeções")} />
          <MenuItem colors={colors} icon="navigation" label="Criar Rota" sub="Planejamento inteligente de visitas" badge="PRO" badgeColor={PURPLE} locked={!canAccess("pro")} onPress={() => navPro("/criarrota", "Criar Rota")} />
        </View>
      </View>

      {/* ── Marketing ── */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>📣 MARKETING</Text>
        <View style={[styles.sectionBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <MenuItem colors={colors} icon="zap" label="JADE Marketing IA" sub={canAccess("pro") ? "Campanhas, criativos e relatórios" : "Disponível no plano Pro"} badge={!canAccess("pro") ? "PRO" : undefined} badgeColor={PURPLE} locked={!canAccess("pro")} divider onPress={() => navPro("/marketing", "JADE Marketing IA")} />
          <MenuItem colors={colors} icon="bar-chart-2" label="Análise Estratégica" sub="IA analisa dados e sugere ações" badge="PRO" badgeColor={PURPLE} locked={!canAccess("pro")} onPress={() => navPro("/analise", "Análise Estratégica")} />
        </View>
      </View>

      {/* ── Performance ── */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>📊 PERFORMANCE</Text>
        <View style={[styles.sectionBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <MenuItem colors={colors} icon="trending-up" label="Relatórios" sub="Métricas diárias e semanais" divider onPress={() => { tap(); router.push("/relatorios" as any); }} />
          <MenuItem colors={colors} icon="bar-chart-2" label="Relatório Gestor" sub="Exportar para diretoria" badge="PRO" badgeColor={PURPLE} locked={!canAccess("pro")} onPress={() => navPro("/relatoriogestor", "Relatório Gestor")} />
        </View>
      </View>

      {/* ── Treinamento ── */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>🎓 TREINAMENTO</Text>
        <View style={[styles.sectionBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <MenuItem colors={colors} icon="book-open" label="Biblioteca de Técnicas" sub="SPIN, AIDA, Gatilhos e mais" divider onPress={() => { tap(); router.push("/biblioteca" as any); }} />
          <MenuItem colors={colors} icon="users" label="Roleplay de Vendas" sub="Treine com a JADE como cliente" badge="PRO" badgeColor={PURPLE} locked={!canAccess("pro")} onPress={() => navPro("/roleplay", "Roleplay de Vendas")} />
        </View>
      </View>

      {/* ── Conta ── */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>⚙️ CONTA</Text>
        <View style={[styles.sectionBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <MenuItem colors={colors} icon="briefcase" label="Minha Empresa" sub="Configurar empresa e treinar JADE" divider onPress={() => { tap(); router.push("/empresa" as any); }} />
          <MenuItem colors={colors} icon="user" label="Meu Perfil" divider onPress={() => { tap(); router.push("/perfil" as any); }} />
          <MenuItem colors={colors} icon="star" label="Meu Plano" sub={`${planLabel} · ${userPlan === "enterprise" ? "R$697" : userPlan === "pro" ? "R$247" : "R$97"}/mês`} badge={planLabel} badgeColor={planColor} divider onPress={() => { tap(); router.push("/plano" as any); }} />
          <MenuItem colors={colors} icon="bell" label="Notificações" divider onPress={() => { tap(); router.push("/notificacoes" as any); }} />
          <MenuItem colors={colors} icon="shield" label="Privacidade e Dados" divider onPress={() => { tap(); router.push("/privacidade" as any); }} />
          <MenuItem colors={colors} icon="help-circle" label="Central de Ajuda" onPress={() => { tap(); router.push("/ajuda" as any); }} />
        </View>
      </View>

      {/* ── Logout ── */}
      <View style={[styles.sectionBox, { backgroundColor: colors.card, borderColor: colors.border, marginHorizontal: 16, marginBottom: 20 }]}>
        <MenuItem colors={colors} icon="log-out" label="Sair da Conta" danger onPress={handleLogout} />
      </View>

      {/* ── Version / Dev trigger (7 taps) ── */}
      <TouchableOpacity onPress={onVersionTap} activeOpacity={0.8} style={{ alignItems: "center", paddingVertical: 14 }}>
        <Text style={[styles.version, { color: colors.mutedForeground }]}>
          {isDevMode ? "⚙ DEV MODE  ·  " : ""}JADE IA v1.0.0
        </Text>
        {isDevMode ? (
          <TouchableOpacity onPress={() => setDevModal(true)} style={{ marginTop: 4 }}>
            <Text style={{ color: PINK, fontSize: 11, fontFamily: "SpaceGrotesk_600SemiBold" }}>Abrir Dev Tools</Text>
          </TouchableOpacity>
        ) : (
          <Text style={[styles.versionHint, { color: colors.mutedForeground }]}>toque 7× para dev tools</Text>
        )}
      </TouchableOpacity>

      {/* ── Modals ── */}
      <PlanGateModal
        visible={gateVisible} plan="pro" featureName={gateFeature}
        onClose={() => setGateVisible(false)}
        onUpgrade={() => { setGateVisible(false); router.push("/plano" as any); }}
      />
      <DevToolsModal
        visible={devModal} currentPlan={userPlan} isRealPlan={!isDevMode}
        onClose={() => setDevModal(false)}
        onChangePlan={handleChangePlan}
        onExitDev={handleExitDev}
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
  sectionBox:   { marginHorizontal: 16, borderRadius: 14, borderWidth: 1, overflow: "hidden" },
  enterpriseCard: { marginHorizontal: 16, borderRadius: 16, borderWidth: 1.5, overflow: "hidden" },
  enterpriseInner: { flexDirection: "row", alignItems: "center", gap: 14, padding: 16, backgroundColor: GOLD + "0C" },
  enterpriseIcon: { width: 50, height: 50, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  enterpriseLabel: { fontSize: 16, fontFamily: "SpaceGrotesk_700Bold", color: "#fff" },
  enterpriseSub: { fontSize: 11, fontFamily: "SpaceGrotesk_400Regular", marginTop: 3, color: "#AAAACC" },
  version:      { textAlign: "center", fontSize: 11, fontFamily: "SpaceGrotesk_400Regular" },
  versionHint:  { textAlign: "center", fontSize: 9, fontFamily: "SpaceGrotesk_400Regular", marginTop: 2, opacity: 0.3 },
});
