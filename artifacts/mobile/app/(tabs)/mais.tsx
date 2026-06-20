import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Alert,
} from "react-native";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";

import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/context/AuthContext";

interface MenuItem {
  icon: string;
  iconLib: "feather" | "mci";
  label: string;
  sub?: string;
  badge?: string;
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

  const topPad = Platform.OS === "web" ? 67 : insets.top;
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

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const MENU_SECTIONS: { title: string; items: MenuItem[] }[] = [
    {
      title: "Conta",
      items: [
        { icon: "user", iconLib: "feather", label: "Meu Perfil", sub: "Rodrigo" },
        { icon: "star", iconLib: "feather", label: "Meu Plano", sub: "Pro · R$199/mês", badge: "PRO" },
      ],
    },
    {
      title: "Ferramentas",
      items: [
        {
          icon: "search", iconLib: "feather", label: "Scanner Radar",
          sub: "Buscar novos estabelecimentos",
          onPress: () => router.push("/scanner" as any),
        },
        {
          icon: "zap", iconLib: "feather", label: "Marketing IA",
          sub: "Posts, Stories, WhatsApp...",
          onPress: () => router.push("/marketing" as any),
        },
      ],
    },
    {
      title: "Configurações",
      items: [
        { icon: "bell", iconLib: "feather", label: "Notificações", sub: "Ativas" },
        { icon: "robot", iconLib: "mci", label: "Treinamento da JADE", sub: "3 scripts ativos" },
        { icon: "link", iconLib: "feather", label: "Integrações", sub: "WhatsApp, Instagram" },
        { icon: "shield", iconLib: "feather", label: "Privacidade e Dados" },
      ],
    },
    {
      title: "Suporte",
      items: [
        { icon: "help-circle", iconLib: "feather", label: "Central de Ajuda" },
        { icon: "message-square", iconLib: "feather", label: "Falar com Suporte" },
        { icon: "star", iconLib: "feather", label: "Avaliar o App" },
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
      <View style={[styles.header, { paddingTop: topPad + 16 }]}>
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
          onPress={handlePress}
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
                  onPress={item.onPress ?? handlePress}
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
                    <View style={[styles.menuBadge, { backgroundColor: colors.primary }]}>
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
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingBottom: 16 },
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
  sectionBox: { marginHorizontal: 16, borderRadius: 14, borderWidth: 1, overflow: "hidden" },
  menuItem: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 14, paddingVertical: 13 },
  menuIcon: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  menuLabel: { fontSize: 15, fontFamily: "SpaceGrotesk_500Medium" },
  menuSub: { fontSize: 12, fontFamily: "SpaceGrotesk_400Regular", marginTop: 1 },
  menuBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  menuBadgeText: { color: "#fff", fontSize: 11, fontFamily: "SpaceGrotesk_700Bold" },
  divider: { height: StyleSheet.hairlineWidth, marginLeft: 62 },
  version: { textAlign: "center", fontSize: 12, fontFamily: "SpaceGrotesk_400Regular", marginVertical: 20 },
});
