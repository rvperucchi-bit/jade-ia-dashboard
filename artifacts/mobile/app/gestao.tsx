import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";

const ENTERPRISE_PURPLE = "#8400FF";

const API_BASE =
  Platform.OS === "web"
    ? ""
    : `https://${process.env.EXPO_PUBLIC_DOMAIN ?? ""}`;

interface HubCard {
  icon: string;
  iconLib: "feather" | "mci";
  title: string;
  sub: string;
  route?: string;
  color: string;
  accent: string;
  modalAction?: "notificar";
}

const TIPO_NOTIF = [
  { id: "informativo",  label: "📋 Informativo",  color: "#6C63FF" },
  { id: "urgente",      label: "🚨 Urgente",      color: "#FF3B5C" },
  { id: "motivacional", label: "🚀 Motivacional", color: "#00D68F" },
];

export default function GestaoScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const [notifModal, setNotifModal] = useState(false);
  const [notifMensagem, setNotifMensagem] = useState("");
  const [notifTipo, setNotifTipo] = useState<"informativo" | "urgente" | "motivacional">("informativo");
  const [enviando, setEnviando] = useState(false);

  const HUB_CARDS: HubCard[] = [
    { icon: "users",         iconLib: "feather", title: "Meu Time",        sub: "Vendedores e metas",         route: "/meutime",          color: "#6C63FF",        accent: "#6C63FF18" },
    { icon: "target",        iconLib: "feather", title: "Metas",           sub: "Pipeline consolidado",        route: "/metas",            color: "#FF0080",        accent: "#FF008018" },
    { icon: "briefcase",     iconLib: "feather", title: "Carteira",        sub: "Farmer, hunter, pós-venda",   route: "/carteira",         color: "#00D68F",        accent: "#00D68F18" },
    { icon: "message-circle",iconLib: "feather", title: "Feedback JADE",   sub: "Mentoria por vendedor",        route: "/feedbackjade",     color: ENTERPRISE_PURPLE,accent: "#8400FF18" },
    { icon: "bar-chart-2",   iconLib: "feather", title: "Relatório",       sub: "Consolidado p/ diretoria",     route: "/relatoriogestor",  color: "#FFB300",        accent: "#FFB30018" },
    { icon: "calendar",      iconLib: "feather", title: "Planejamento",    sub: "Agenda do time",               route: "/planejamento",     color: "#4ECDC4",        accent: "#4ECDC418" },
    { icon: "users",         iconLib: "feather", title: "Roleplay",        sub: "Treino de vendas com IA",      route: "/roleplay",         color: "#AB47BC",        accent: "#AB47BC18" },
    { icon: "bell",          iconLib: "feather", title: "Notificar Time",  sub: "Enviar broadcast ao time",     color: ENTERPRISE_PURPLE,   accent: "#8400FF18", modalAction: "notificar" },
    { icon: "heart",         iconLib: "feather", title: "Humor do Time",   sub: "Check-in diário dos executivos", route: "/feedbackexecutivo", color: "#FF6B35",        accent: "#FF6B3518" },
  ];

  const abrirNotifModal = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setNotifMensagem("");
    setNotifTipo("informativo");
    setNotifModal(true);
  };

  const enviarNotificacao = async () => {
    if (!notifMensagem.trim()) {
      Alert.alert("Mensagem obrigatória", "Digite a mensagem antes de enviar.");
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setEnviando(true);
    try {
      const res = await fetch(`${API_BASE}/api/notificacoes/time`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mensagem: notifMensagem.trim(), tipo: notifTipo, destinatarios: "todos" }),
      });
      if (!res.ok) throw new Error("API error");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setNotifModal(false);
      Alert.alert("✅ Notificação enviada!", "Todos os vendedores foram notificados.");
    } catch {
      Alert.alert("Erro", "Não foi possível enviar a notificação. Tente novamente.");
    } finally {
      setEnviando(false);
    }
  };

  const handleCardPress = (card: HubCard) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (card.modalAction === "notificar") {
      abrirNotifModal();
    } else if (card.route) {
      router.push(card.route as any);
    }
  };

  return (
    <View style={[S.root, { backgroundColor: colors.background }]}>
      <View style={[S.header, { paddingTop: topPad, borderBottomColor: colors.border }]}>
        <TouchableOpacity style={[S.backBtn, { backgroundColor: colors.surface }]} onPress={() => router.back()} activeOpacity={0.8}>
          <Feather name="arrow-left" size={20} color={colors.text} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={[S.headerTitle, { color: colors.text }]}>Gestão Comercial</Text>
          <Text style={[S.headerSub, { color: colors.mutedForeground }]}>Enterprise · Visão do gestor</Text>
        </View>
        <TouchableOpacity
          style={[S.notifBtn, { backgroundColor: ENTERPRISE_PURPLE + "20", borderColor: ENTERPRISE_PURPLE + "44" }]}
          onPress={abrirNotifModal}
          activeOpacity={0.85}
        >
          <Feather name="bell" size={14} color={ENTERPRISE_PURPLE} />
          <Text style={[S.notifBtnText, { color: ENTERPRISE_PURPLE }]}>Notificar</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        <View style={[S.heroBanner, { backgroundColor: ENTERPRISE_PURPLE + "14", borderColor: ENTERPRISE_PURPLE + "30" }]}>
          <View style={[S.heroIconWrap, { backgroundColor: ENTERPRISE_PURPLE + "22" }]}>
            <MaterialCommunityIcons name="crown" size={24} color={ENTERPRISE_PURPLE} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[S.heroTitle, { color: colors.text }]}>Gestão Comercial Completa</Text>
            <Text style={[S.heroSub, { color: colors.mutedForeground }]}>
              Time, carteira e métricas com IA integrada.
            </Text>
          </View>
        </View>

        <Text style={[S.sectionLabel, { color: colors.mutedForeground }]}>MÓDULOS</Text>

        <View style={S.grid}>
          {HUB_CARDS.map((card, i) => (
            <TouchableOpacity
              key={i}
              style={[S.card, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => handleCardPress(card)}
              activeOpacity={0.85}
            >
              <View style={[S.cardIcon, { backgroundColor: card.accent }]}>
                {card.iconLib === "mci"
                  ? <MaterialCommunityIcons name={card.icon as any} size={18} color={card.color} />
                  : <Feather name={card.icon as any} size={18} color={card.color} />
                }
              </View>
              <Text style={[S.cardTitle, { color: colors.text }]}>{card.title}</Text>
              <Text style={[S.cardSub, { color: colors.mutedForeground }]}>{card.sub}</Text>
              <View style={S.cardArrow}>
                <Feather name={card.modalAction === "notificar" ? "send" : "arrow-right"} size={12} color={card.color} />
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <View style={[S.tipBox, { backgroundColor: colors.card, borderColor: ENTERPRISE_PURPLE + "30" }]}>
          <MaterialCommunityIcons name="robot" size={16} color={ENTERPRISE_PURPLE} />
          <Text style={[S.tipText, { color: colors.mutedForeground }]}>
            A JADE analisa dados do time para gerar feedback empático, insights de pipeline e estratégias personalizadas.
          </Text>
        </View>
      </ScrollView>

      {/* ── Modal Notificar Time ── */}
      <Modal visible={notifModal} transparent animationType="slide" onRequestClose={() => setNotifModal(false)}>
        <View style={S.modalOverlay}>
          <View style={[S.modalBox, { backgroundColor: colors.card }]}>
            <View style={S.modalHeader}>
              <View style={{ flex: 1 }}>
                <Text style={[S.modalTitle, { color: colors.text }]}>📢 Notificar Time</Text>
                <Text style={[S.modalSub, { color: colors.mutedForeground }]}>Mensagem para todos os vendedores</Text>
              </View>
              <TouchableOpacity onPress={() => setNotifModal(false)} activeOpacity={0.7}>
                <Feather name="x" size={22} color={colors.mutedForeground} />
              </TouchableOpacity>
            </View>

            <Text style={[S.fieldLabel, { color: colors.mutedForeground }]}>TIPO</Text>
            <View style={S.tipoRow}>
              {TIPO_NOTIF.map((t) => {
                const sel = notifTipo === t.id;
                return (
                  <TouchableOpacity
                    key={t.id}
                    style={[S.tipoBadge, { borderColor: sel ? t.color : colors.border, backgroundColor: sel ? t.color + "18" : colors.surface }]}
                    onPress={() => setNotifTipo(t.id as any)}
                    activeOpacity={0.8}
                  >
                    <Text style={[S.tipoBadgeText, { color: sel ? t.color : colors.mutedForeground }]}>{t.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={[S.fieldLabel, { color: colors.mutedForeground }]}>MENSAGEM</Text>
            <View style={[S.textareaWrap, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <TextInput
                style={[S.textarea, { color: colors.text }]}
                placeholder="Ex: Reunião de alinhamento hoje às 17h. Confirmem presença! 💪"
                placeholderTextColor={colors.mutedForeground}
                value={notifMensagem}
                onChangeText={setNotifMensagem}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                autoFocus
              />
            </View>

            <TouchableOpacity
              style={[S.enviarBtn, { backgroundColor: ENTERPRISE_PURPLE }, enviando && { opacity: 0.7 }]}
              onPress={enviarNotificacao}
              disabled={enviando}
              activeOpacity={0.85}
            >
              {enviando
                ? <><ActivityIndicator color="#fff" size="small" /><Text style={S.enviarBtnText}>Enviando...</Text></>
                : <><Feather name="send" size={16} color="#fff" /><Text style={S.enviarBtnText}>Enviar para o Time</Text></>
              }
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const S = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 20, paddingBottom: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  backBtn: { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 17, fontFamily: "SpaceGrotesk_700Bold" },
  headerSub: { fontSize: 11, fontFamily: "SpaceGrotesk_400Regular", marginTop: 1 },
  notifBtn: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 10, paddingVertical: 7, borderRadius: 10, borderWidth: 1 },
  notifBtnText: { fontSize: 12, fontFamily: "SpaceGrotesk_600SemiBold" },
  heroBanner: { flexDirection: "row", alignItems: "center", gap: 12, margin: 14, padding: 14, borderRadius: 14, borderWidth: 1 },
  heroIconWrap: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  heroTitle: { fontSize: 14, fontFamily: "SpaceGrotesk_700Bold", marginBottom: 3 },
  heroSub: { fontSize: 12, fontFamily: "SpaceGrotesk_400Regular", lineHeight: 18 },
  sectionLabel: { fontSize: 11, fontFamily: "SpaceGrotesk_600SemiBold", letterSpacing: 1, marginHorizontal: 20, marginBottom: 10 },
  grid: { flexDirection: "row", flexWrap: "wrap", paddingHorizontal: 12, gap: 8 },
  card: { width: "47%", flexGrow: 1, borderRadius: 14, borderWidth: 1, padding: 12, gap: 3, position: "relative" },
  cardIcon: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center", marginBottom: 2 },
  cardTitle: { fontSize: 13, fontFamily: "SpaceGrotesk_700Bold" },
  cardSub: { fontSize: 11, fontFamily: "SpaceGrotesk_400Regular", lineHeight: 15 },
  cardArrow: { marginTop: 6, alignSelf: "flex-end" },
  tipBox: { flexDirection: "row", alignItems: "flex-start", gap: 10, margin: 14, padding: 12, borderRadius: 12, borderWidth: 1 },
  tipText: { flex: 1, fontSize: 12, fontFamily: "SpaceGrotesk_400Regular", lineHeight: 19 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.7)", justifyContent: "flex-end" },
  modalBox: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, gap: 14, paddingBottom: 44 },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  modalTitle: { fontSize: 20, fontFamily: "SpaceGrotesk_700Bold" },
  modalSub: { fontSize: 13, fontFamily: "SpaceGrotesk_400Regular", marginTop: 3 },
  fieldLabel: { fontSize: 11, fontFamily: "SpaceGrotesk_700Bold", letterSpacing: 0.8 },
  tipoRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  tipoBadge: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, borderWidth: 1.5 },
  tipoBadgeText: { fontSize: 13, fontFamily: "SpaceGrotesk_600SemiBold" },
  textareaWrap: { borderRadius: 12, borderWidth: 1, padding: 14, minHeight: 110 },
  textarea: { fontSize: 14, fontFamily: "SpaceGrotesk_400Regular", lineHeight: 22 },
  enviarBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, height: 52, borderRadius: 14 },
  enviarBtnText: { color: "#fff", fontSize: 15, fontFamily: "SpaceGrotesk_700Bold" },
});
