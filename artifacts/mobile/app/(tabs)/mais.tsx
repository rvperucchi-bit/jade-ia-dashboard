import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Alert,
  Modal,
} from "react-native";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";

import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/context/AuthContext";

const ENTERPRISE_PURPLE = "#8400FF";

interface MenuItem {
  icon: string;
  iconLib: "feather" | "mci";
  label: string;
  sub?: string;
  badge?: string;
  badgeColor?: string;
  danger?: boolean;
  onPress?: () => void;
}

function Icon({ name, lib, color }: { name: string; lib: "feather" | "mci"; color: string }) {
  if (lib === "mci") return <MaterialCommunityIcons name={name as any} size={20} color={color} />;
  return <Feather name={name as any} size={20} color={color} />;
}

export default function MaisScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { logout } = useAuth();
  const [upgradeModal, setUpgradeModal] = React.useState(false);

  const topPad    = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 84 : insets.bottom + 60;

  const handleLogout = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      "Sair da conta",
      "Tem certeza que deseja sair?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Sair",
          style: "destructive",
          onPress: async () => {
            await logout();
            router.replace("/login");
          },
        },
      ]
    );
  };

  const tap = () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

  const USER_PLAN = "pro" as "free" | "pro" | "enterprise";
  const isEnterprise = USER_PLAN === "enterprise";

  const navPro = (path: string) => {
    tap();
    if (USER_PLAN === "free") { router.push("/plano" as any); return; }
    router.push(path as any);
  };

  const navEnterprise = (path: string) => {
    tap();
    if (!isEnterprise) { router.push("/plano" as any); return; }
    router.push(path as any);
  };

  const handleGestaoPress = () => {
    tap();
    if (!isEnterprise) { router.push("/plano" as any); return; }
    router.push("/gestao" as any);
  };

  const MENU_SECTIONS: { title: string; items: MenuItem[] }[] = [
    {
      title: "⚡ Ferramentas Rápidas",
      items: [
        { icon: "file-text", iconLib: "feather", label: "Roteiro de Vendas", sub: "Script do contato ao fechamento", onPress: () => { tap(); router.push("/roteiro" as any); } },
        { icon: "clipboard", iconLib: "feather", label: "Briefing Pré-Reunião", sub: "Chegue preparado para qualquer reunião", onPress: () => { tap(); router.push("/briefing" as any); } },
        { icon: "shield", iconLib: "feather", label: "Ajuda com Objeções", sub: "Estratégias prontas para qualquer objeção", badge: "PRO", onPress: () => navPro("/objecoes") },
        { icon: "search", iconLib: "feather", label: "Scanner Radar", sub: "Buscar novos estabelecimentos", onPress: () => { tap(); router.push("/scanner" as any); } },
      ],
    },
    {
      title: "📋 Planejamento",
      items: [
        { icon: "award", iconLib: "feather", label: "Laudo Executivo", sub: "Diagnóstico de marketing do cliente", onPress: () => { tap(); router.push("/laudo" as any); } },
        { icon: "navigation", iconLib: "feather", label: "Criar Rota", sub: "Planejamento inteligente de visitas", badge: "PRO", onPress: () => navPro("/criarrota") },
        { icon: "calendar", iconLib: "feather", label: "Planejamento do Dia", sub: "Organize e confirme sua agenda diária", badge: "PRO", onPress: () => navPro("/planejamento") },
      ],
    },
    {
      title: "📣 Marketing",
      items: [
        { icon: "zap", iconLib: "feather", label: "Marketing IA", sub: "Posts, Stories, Tráfego pago...", onPress: () => { tap(); router.push("/marketing" as any); } },
        { icon: "book-open", iconLib: "feather", label: "Biblioteca de Conteúdo", sub: "Templates e técnicas de copywriting", onPress: () => { tap(); router.push("/biblioteca" as any); } },
      ],
    },
    {
      title: "📊 Performance",
      items: [
        { icon: "bar-chart-2", iconLib: "feather", label: "Relatórios", sub: "Métricas diárias e semanais", badge: "PRO", onPress: () => navPro("/relatorios") },
        { icon: "award", iconLib: "feather", label: "Feedback JADE", sub: "Avalie sua performance de vendas", badge: "PRO", onPress: () => navPro("/feedbackexecutivo") },
      ],
    },
    {
      title: "🎓 Treinamento",
      items: [
        { icon: "users", iconLib: "feather", label: "Roleplay de Vendas", sub: "Treine com a JADE como cliente", badge: "Enterprise", badgeColor: ENTERPRISE_PURPLE, onPress: () => navEnterprise("/roleplay") },
        { icon: "book-open", iconLib: "feather", label: "Biblioteca de Técnicas", sub: "SPIN, AIDA, Gatilhos e mais", onPress: () => { tap(); router.push("/biblioteca" as any); } },
      ],
    },
    {
      title: "⚙️ Conta",
      items: [
        { icon: "briefcase", iconLib: "feather", label: "Minha Empresa", sub: "Configurar empresa e treinar JADE", onPress: () => { tap(); router.push("/empresa" as any); } },
        { icon: "user", iconLib: "feather", label: "Meu Perfil", sub: "Rodrigo", onPress: () => { tap(); router.push("/perfil" as any); } },
        { icon: "star", iconLib: "feather", label: "Meu Plano", sub: "Pro · R$247/mês", badge: "PRO", onPress: () => { tap(); router.push("/plano" as any); } },
        { icon: "bell", iconLib: "feather", label: "Notificações", sub: "3 não lidas", onPress: () => { tap(); router.push("/notificacoes" as any); } },
        { icon: "shield", iconLib: "feather", label: "Privacidade e Dados", onPress: () => { tap(); router.push("/privacidade" as any); } },
        { icon: "help-circle", iconLib: "feather", label: "Central de Ajuda", onPress: () => { tap(); router.push("/ajuda" as any); } },
      ],
    },
    {
      title: "",
      items: [
        { icon: "log-out", iconLib: "feather", label: "Sair da Conta", danger: true, onPress: handleLogout },
      ],
    },
  ];

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingBottom: bottomPad }}
      showsVerticalScrollIndicator={false}
    >
      <View style={[styles.header, { paddingTop: topPad + 4 }]}>
        <Text style={[styles.title, { color: colors.text }]}>Mais</Text>
      </View>

      <View style={[styles.profileCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.profileAvatar, { backgroundColor: colors.primary }]}>
          <Text style={styles.profileInitials}>R</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.profileName, { color: colors.text }]}>Rodrigo</Text>
          <Text style={[styles.profileRole, { color: colors.mutedForeground }]}>Fundador · JÁ Delivery</Text>
          <View style={[styles.proBadge, { backgroundColor: colors.primary + "22" }]}>
            <Text style={[styles.proBadgeText, { color: colors.primary }]}>✦ Plano Pro</Text>
          </View>
        </View>
        <TouchableOpacity
          style={[styles.editBtn, { backgroundColor: colors.surface }]}
          onPress={() => router.push("/perfil" as any)}
          activeOpacity={0.8}
        >
          <Feather name="edit-2" size={16} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.statsRow}>
        {[
          { label: "Leads", value: "124" },
          { label: "Fechados", value: "38" },
          { label: "Receita", value: "R$92k" },
        ].map((s, i) => (
          <View key={i} style={[styles.statBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.statValue, { color: colors.text }]}>{s.value}</Text>
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{s.label}</Text>
          </View>
        ))}
      </View>

      {/* ── GESTÃO ENTERPRISE card ── */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>GESTÃO ENTERPRISE</Text>
        <TouchableOpacity
          style={[styles.enterpriseCard, { borderColor: ENTERPRISE_PURPLE + "50" }]}
          onPress={handleGestaoPress}
          activeOpacity={0.85}
        >
          <View style={styles.enterpriseGradient}>
            <View style={[styles.enterpriseIcon, { backgroundColor: ENTERPRISE_PURPLE + "30" }]}>
              <MaterialCommunityIcons name="crown" size={26} color={ENTERPRISE_PURPLE} />
            </View>
            <View style={{ flex: 1 }}>
              <View style={styles.enterpriseTitleRow}>
                <Text style={styles.enterpriseLabel}>Gestão Comercial</Text>
                <View style={styles.enterpriseBadge}>
                  <Text style={styles.enterpriseBadgeText}>Enterprise</Text>
                </View>
              </View>
              <Text style={styles.enterpriseSub}>
                Time, metas, carteira, feedback e relatórios
              </Text>
            </View>
            <Feather name={isEnterprise ? "arrow-right" : "lock"} size={18} color={ENTERPRISE_PURPLE} />
          </View>
        </TouchableOpacity>
      </View>

      {MENU_SECTIONS.map((section, si) => (
        <View key={si} style={styles.section}>
          {section.title ? (
            <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>
              {section.title.toUpperCase()}
            </Text>
          ) : null}
          <View style={[styles.sectionBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {section.items.map((item, ii) => (
              <React.Fragment key={ii}>
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => { tap(); item.onPress?.(); }}
                  activeOpacity={0.7}
                >
                  <View style={[styles.menuIcon, { backgroundColor: item.danger ? colors.destructive + "22" : colors.surface }]}>
                    <Icon name={item.icon} lib={item.iconLib} color={item.danger ? colors.destructive : colors.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.menuLabel, { color: item.danger ? colors.destructive : colors.text }]}>
                      {item.label}
                    </Text>
                    {item.sub && (
                      <Text style={[styles.menuSub, { color: colors.mutedForeground }]}>{item.sub}</Text>
                    )}
                  </View>
                  {item.badge && (
                    <View style={[styles.menuBadge, { backgroundColor: item.badgeColor ?? colors.primary }]}>
                      <Text style={styles.menuBadgeText}>{item.badge}</Text>
                    </View>
                  )}
                  {!item.danger && (
                    <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
                  )}
                </TouchableOpacity>
                {ii < section.items.length - 1 && (
                  <View style={[styles.divider, { backgroundColor: colors.border }]} />
                )}
              </React.Fragment>
            ))}
          </View>
        </View>
      ))}

      <Text style={[styles.version, { color: colors.mutedForeground }]}>JADE IA v1.0.0</Text>

      {/* ── Upgrade modal ── */}
      <Modal visible={upgradeModal} transparent animationType="fade" onRequestClose={() => setUpgradeModal(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setUpgradeModal(false)}>
          <View style={[styles.modalBox, { backgroundColor: colors.card }]}>
            <View style={[styles.modalIcon, { backgroundColor: ENTERPRISE_PURPLE + "22" }]}>
              <MaterialCommunityIcons name="crown" size={36} color={ENTERPRISE_PURPLE} />
            </View>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Gestão Enterprise</Text>
            <Text style={[styles.modalSub, { color: colors.mutedForeground }]}>
              Gerencie seu time de vendas completo com IA — metas, carteira de clientes, feedback empático e relatórios para diretoria.
            </Text>
            <View style={[styles.modalFeatures, { borderColor: ENTERPRISE_PURPLE + "30" }]}>
              {[
                "👥 Cadastro e ranking do time",
                "🎯 Metas e pipeline consolidado",
                "🌾 Carteira farmer/hunter",
                "💜 Feedback empático da JADE",
                "📋 Relatórios para diretoria",
              ].map((f, i) => (
                <Text key={i} style={[styles.modalFeature, { color: colors.mutedForeground }]}>{f}</Text>
              ))}
            </View>
            <TouchableOpacity
              style={[styles.upgradeBtn, { backgroundColor: ENTERPRISE_PURPLE }]}
              onPress={() => { setUpgradeModal(false); router.push("/plano" as any); }}
              activeOpacity={0.85}
            >
              <Text style={styles.upgradeBtnText}>Fazer Upgrade para Enterprise</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setUpgradeModal(false)} activeOpacity={0.7}>
              <Text style={[styles.cancelText, { color: colors.mutedForeground }]}>Agora não</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingBottom: 12 },
  title: { fontSize: 26, fontFamily: "SpaceGrotesk_700Bold" },
  profileCard: {
    flexDirection: "row", alignItems: "center",
    marginHorizontal: 16, marginBottom: 12, padding: 16,
    borderRadius: 16, borderWidth: 1, gap: 14,
  },
  profileAvatar: { width: 56, height: 56, borderRadius: 28, alignItems: "center", justifyContent: "center" },
  profileInitials: { color: "#fff", fontSize: 22, fontFamily: "SpaceGrotesk_700Bold" },
  profileName: { fontSize: 17, fontFamily: "SpaceGrotesk_700Bold" },
  profileRole: { fontSize: 13, fontFamily: "SpaceGrotesk_400Regular", marginTop: 2 },
  proBadge: { alignSelf: "flex-start", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, marginTop: 6 },
  proBadgeText: { fontSize: 11, fontFamily: "SpaceGrotesk_600SemiBold" },
  editBtn: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  statsRow: { flexDirection: "row", marginHorizontal: 16, marginBottom: 20, gap: 10 },
  statBox: { flex: 1, alignItems: "center", paddingVertical: 14, borderRadius: 12, borderWidth: 1 },
  statValue: { fontSize: 18, fontFamily: "SpaceGrotesk_700Bold" },
  statLabel: { fontSize: 12, fontFamily: "SpaceGrotesk_400Regular", marginTop: 2 },
  section: { marginBottom: 16 },
  sectionTitle: { fontSize: 11, fontFamily: "SpaceGrotesk_600SemiBold", letterSpacing: 1, marginHorizontal: 20, marginBottom: 8 },
  enterpriseCard: {
    marginHorizontal: 16, borderRadius: 16, borderWidth: 1.5, overflow: "hidden",
  },
  enterpriseGradient: {
    flexDirection: "row", alignItems: "center", gap: 14,
    padding: 16, backgroundColor: ENTERPRISE_PURPLE + "14",
  },
  enterpriseIcon: { width: 50, height: 50, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  enterpriseTitleRow: { flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" },
  enterpriseLabel: { fontSize: 16, fontFamily: "SpaceGrotesk_700Bold", color: "#FFFFFF" },
  enterpriseBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, backgroundColor: ENTERPRISE_PURPLE + "30" },
  enterpriseBadgeText: { fontSize: 11, fontFamily: "SpaceGrotesk_700Bold", color: ENTERPRISE_PURPLE },
  enterpriseSub: { fontSize: 12, fontFamily: "SpaceGrotesk_400Regular", marginTop: 3, color: "#AAAACC" },
  sectionBox: { marginHorizontal: 16, borderRadius: 14, borderWidth: 1, overflow: "hidden" },
  menuItem: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 14, paddingVertical: 13 },
  menuIcon: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  menuLabel: { fontSize: 15, fontFamily: "SpaceGrotesk_500Medium" },
  menuSub: { fontSize: 12, fontFamily: "SpaceGrotesk_400Regular", marginTop: 1 },
  menuBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  menuBadgeText: { color: "#fff", fontSize: 11, fontFamily: "SpaceGrotesk_700Bold" },
  divider: { height: StyleSheet.hairlineWidth, marginLeft: 62 },
  version: { textAlign: "center", fontSize: 12, fontFamily: "SpaceGrotesk_400Regular", marginVertical: 20 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.75)", justifyContent: "flex-end" },
  modalBox: { borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 28, gap: 16, paddingBottom: 44, alignItems: "center" },
  modalIcon: { width: 72, height: 72, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  modalTitle: { fontSize: 22, fontFamily: "SpaceGrotesk_700Bold", textAlign: "center" },
  modalSub: { fontSize: 14, fontFamily: "SpaceGrotesk_400Regular", textAlign: "center", lineHeight: 21 },
  modalFeatures: { alignSelf: "stretch", borderRadius: 14, borderWidth: 1, padding: 16, gap: 8 },
  modalFeature: { fontSize: 13, fontFamily: "SpaceGrotesk_400Regular", lineHeight: 20 },
  upgradeBtn: { alignSelf: "stretch", height: 52, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  upgradeBtnText: { color: "#fff", fontSize: 16, fontFamily: "SpaceGrotesk_700Bold" },
  cancelText: { fontSize: 14, fontFamily: "SpaceGrotesk_400Regular", marginTop: 4 },
});
