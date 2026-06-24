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
import { useNotifications, type AppNotification } from "@/context/NotificationsContext";

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

const ICON_MAP: Record<AppNotification["type"], { name: string; color: string; bg: string }> = {
  jade:      { name: "cpu",        color: C.primary,  bg: C.primary + "18" },
  lead:      { name: "user-plus",  color: C.success,  bg: C.success + "18" },
  plano:     { name: "star",       color: C.warning,  bg: C.warning + "18" },
  relatorio: { name: "bar-chart-2",color: "#8400FF",  bg: "rgba(132,0,255,0.08)" },
};

export default function NotificacoesScreen() {
  const router  = useRouter();
  const insets  = useSafeAreaInsets();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();

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

        {notifications.length === 0 && (
          <View style={S.empty}>
            <View style={[S.emptyIcon, { backgroundColor: C.primary + "18" }]}>
              <Feather name="bell-off" size={32} color={C.primary} />
            </View>
            <Text style={S.emptyTitle}>Nenhuma notificação ainda</Text>
            <Text style={S.emptyText}>
              Notificações de leads abordados, CRM e follow-ups aparecerão aqui.
            </Text>
          </View>
        )}

        {notifications.length > 0 && (
          <View style={S.list}>
            {notifications.map((notif) => {
              const ic = ICON_MAP[notif.type] ?? ICON_MAP.jade;
              return (
                <TouchableOpacity
                  key={notif.id}
                  style={[S.item, notif.unread && S.itemUnread]}
                  activeOpacity={0.75}
                  onPress={() => markAsRead(notif.id)}
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
        )}

        {notifications.length > 0 && (
          <TouchableOpacity style={S.clearBtn} activeOpacity={0.7} onPress={markAllAsRead}>
            <Text style={S.clearText}>Marcar todas como lidas</Text>
          </TouchableOpacity>
        )}
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
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: C.primary, alignItems: "center", justifyContent: "center",
  },
  headerBadgeText: { fontSize: 15, fontFamily: "SpaceGrotesk_700Bold", color: "#fff" },
  scroll: { paddingHorizontal: 16, paddingTop: 16 },
  unreadBanner: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: C.primary + "12", borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 10, marginBottom: 16,
    borderWidth: 1, borderColor: C.primary + "30",
  },
  unreadText: { fontSize: 15, fontFamily: "SpaceGrotesk_600SemiBold", color: C.primary },
  list: {
    backgroundColor: C.card, borderRadius: 16,
    borderWidth: 1, borderColor: C.border, overflow: "hidden",
  },
  item: {
    flexDirection: "row", gap: 14, padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.border,
  },
  itemUnread: { backgroundColor: C.surface },
  iconBox: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  itemContent: { flex: 1, gap: 3 },
  itemTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  itemTitle: { flex: 1, fontSize: 16, fontFamily: "SpaceGrotesk_600SemiBold", color: C.text },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: C.primary },
  itemBody: { fontSize: 15, fontFamily: "SpaceGrotesk_400Regular", color: C.sub, lineHeight: 18 },
  itemTime: { fontSize: 13, fontFamily: "SpaceGrotesk_400Regular", color: C.muted, marginTop: 2 },
  clearBtn: { alignItems: "center", paddingVertical: 20 },
  clearText: { fontSize: 16, fontFamily: "SpaceGrotesk_500Medium", color: C.muted },
  empty: { alignItems: "center", gap: 12, paddingTop: 80, paddingHorizontal: 32 },
  emptyIcon: { width: 72, height: 72, borderRadius: 36, alignItems: "center", justifyContent: "center" },
  emptyTitle: { fontSize: 18, fontFamily: "SpaceGrotesk_700Bold", color: C.text },
  emptyText: { fontSize: 14, fontFamily: "SpaceGrotesk_400Regular", color: C.sub, textAlign: "center", lineHeight: 21 },
});
