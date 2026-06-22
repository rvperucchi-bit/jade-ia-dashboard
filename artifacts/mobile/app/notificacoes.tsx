import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const C = {
  bg: "#0B0814",
  card: "#111118",
  border: "#1E1E2E",
  text: "#FFFFFF",
  muted: "#7777AA",
  sub: "#AAAACC",
  primary: "#FF0080",
  surface: "#16161F",
  success: "#FF0080",
  warning: "rgba(255,255,255,0.45)",
};

interface Notif {
  id: string;
  type: "lead" | "jade" | "plano" | "relatorio";
  title: string;
  body: string;
  time: string;
  unread: boolean;
}

const NOTIFICATIONS: Notif[] = [
  {
    id: "1",
    type: "jade",
    title: "JADE identificou uma oportunidade",
    body: 'O lead "Restaurante Sabor & Arte" tem score 87 — alta probabilidade de fechamento. Acesse agora para ver a abordagem recomendada.',
    time: "Agora",
    unread: true,
  },
  {
    id: "2",
    type: "lead",
    title: "3 novos leads adicionados",
    body: "O Scanner Radar encontrou 3 novos estabelecimentos na região central de Criciúma: 2 restaurantes e 1 academia.",
    time: "Há 2 horas",
    unread: true,
  },
  {
    id: "3",
    type: "relatorio",
    title: "Relatório semanal disponível",
    body: "Seu relatório de performance da semana está pronto. Você prospectou 18 leads e fechou 4 contratos — taxa de conversão de 22%.",
    time: "Ontem, 08:00",
    unread: true,
  },
  {
    id: "4",
    type: "jade",
    title: "Follow-up recomendado",
    body: 'A JADE recomenda retomar contato com "Clínica Estética Bella" — sem resposta há 5 dias. Script de reativação disponível.',
    time: "Ontem, 14:30",
    unread: false,
  },
  {
    id: "5",
    type: "plano",
    title: "Créditos chegando ao limite",
    body: "Você usou 820 de 1.000 créditos do mês. Renova em 10 dias. Considere fazer upgrade para o plano Commander.",
    time: "2 dias atrás",
    unread: false,
  },
  {
    id: "6",
    type: "lead",
    title: "Lead qualificado automaticamente",
    body: '"Padaria Pão Nosso" foi qualificada com score 71 pela JADE. Perfil pronto para abordagem.',
    time: "3 dias atrás",
    unread: false,
  },
];

const ICON_MAP = {
  jade: { name: "cpu", color: C.primary, bg: C.primary + "18" },
  lead: { name: "user-plus", color: C.success, bg: C.success + "18" },
  plano: { name: "star", color: C.warning, bg: C.warning + "18" },
  relatorio: { name: "bar-chart-2", color: "#8400FF", bg: "rgba(132,0,255,0.08)" },
};

export default function NotificacoesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const unreadCount = NOTIFICATIONS.filter((n) => n.unread).length;

  return (
    <View style={[S.root, { paddingTop: insets.top }]}>
      <View style={S.header}>
        <TouchableOpacity onPress={() => router.back()} style={S.backBtn} activeOpacity={0.7}>
          <Feather name="arrow-left" size={22} color={C.text} />
        </TouchableOpacity>
        <Text style={S.headerTitle}>Notificações</Text>
        {unreadCount > 0 ? (
          <View style={S.headerBadge}>
            <Text style={S.headerBadgeText}>{unreadCount}</Text>
          </View>
        ) : (
          <View style={{ width: 40 }} />
        )}
      </View>

      <ScrollView
        contentContainerStyle={[S.scroll, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        {unreadCount > 0 && (
          <View style={S.unreadBanner}>
            <Feather name="bell" size={14} color={C.primary} />
            <Text style={S.unreadText}>{unreadCount} notificações não lidas</Text>
          </View>
        )}

        <View style={S.list}>
          {NOTIFICATIONS.map((notif, i) => {
            const ic = ICON_MAP[notif.type];
            return (
              <TouchableOpacity
                key={notif.id}
                style={[S.item, notif.unread && S.itemUnread]}
                activeOpacity={0.75}
              >
                <View style={[S.iconBox, { backgroundColor: ic.bg }]}>
                  <Feather name={ic.name as any} size={20} color={ic.color} />
                </View>
                <View style={S.itemContent}>
                  <View style={S.itemTop}>
                    <Text style={S.itemTitle} numberOfLines={1}>{notif.title}</Text>
                    {notif.unread && <View style={S.dot} />}
                  </View>
                  <Text style={S.itemBody} numberOfLines={2}>{notif.body}</Text>
                  <Text style={S.itemTime}>{notif.time}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        <TouchableOpacity style={S.clearBtn} activeOpacity={0.7}>
          <Text style={S.clearText}>Marcar todas como lidas</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const S = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: C.border,
  },
  backBtn: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 17, fontFamily: "SpaceGrotesk_700Bold", color: C.text },
  headerBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: C.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  headerBadgeText: { fontSize: 15, fontFamily: "SpaceGrotesk_700Bold", color: "#fff" },
  scroll: { paddingHorizontal: 16, paddingTop: 16 },

  unreadBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: C.primary + "12",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: C.primary + "30",
  },
  unreadText: {
    fontSize: 15,
    fontFamily: "SpaceGrotesk_600SemiBold",
    color: C.primary,
  },

  list: {
    backgroundColor: C.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.border,
    overflow: "hidden",
  },
  item: {
    flexDirection: "row",
    gap: 14,
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: C.border,
  },
  itemUnread: { backgroundColor: C.surface },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  itemContent: { flex: 1, gap: 3 },
  itemTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  itemTitle: {
    flex: 1,
    fontSize: 16,
    fontFamily: "SpaceGrotesk_600SemiBold",
    color: C.text,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: C.primary,
  },
  itemBody: {
    fontSize: 15,
    fontFamily: "SpaceGrotesk_400Regular",
    color: C.sub,
    lineHeight: 18,
  },
  itemTime: {
    fontSize: 13,
    fontFamily: "SpaceGrotesk_400Regular",
    color: C.muted,
    marginTop: 2,
  },

  clearBtn: { alignItems: "center", paddingVertical: 20 },
  clearText: {
    fontSize: 16,
    fontFamily: "SpaceGrotesk_500Medium",
    color: C.muted,
  },
});
