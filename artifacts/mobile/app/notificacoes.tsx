import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNotifications, type AppNotification } from "@/context/NotificationsContext";
import { useColors } from "@/hooks/useColors";

const PINK    = "#FF0080";
const SUCCESS = "#00D68F";
const WARNING = "#FFB300";

const ICON_MAP: Record<AppNotification["type"], { name: string; color: string; bg: string }> = {
  jade:      { name: "cpu",         color: PINK,    bg: PINK    + "18" },
  lead:      { name: "user-plus",   color: SUCCESS, bg: SUCCESS + "18" },
  plano:     { name: "star",        color: WARNING, bg: WARNING + "18" },
  relatorio: { name: "bar-chart-2", color: "#8400FF", bg: "rgba(132,0,255,0.08)" },
};

export default function NotificacoesScreen() {
  const router  = useRouter();
  const insets  = useSafeAreaInsets();
  const colors  = useColors();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();

  const topPad = Platform.OS === "web" ? 24 : insets.top + 4;
  const botPad = Platform.OS === "web" ? 40 : insets.bottom + 32;

  return (
    <View style={[S.root, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[S.header, { paddingTop: topPad }]}>
        <TouchableOpacity onPress={() => router.back()} style={S.backBtn} activeOpacity={0.7}>
          <Feather name="chevron-left" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={[S.headerTitle, { color: colors.text }]}>Notificações</Text>
        {unreadCount > 0 ? (
          <View style={S.headerBadge}>
            <Text style={S.headerBadgeText}>{unreadCount}</Text>
          </View>
        ) : (
          <View style={{ width: 36 }} />
        )}
      </View>

      <ScrollView
        contentContainerStyle={[S.scroll, { paddingBottom: botPad }]}
        showsVerticalScrollIndicator={false}
      >
        {unreadCount > 0 && (
          <View style={[S.unreadBanner, { backgroundColor: PINK + "12", borderColor: PINK + "30" }]}>
            <Feather name="bell" size={14} color={PINK} />
            <Text style={[S.unreadText, { color: PINK }]}>
              {unreadCount} {unreadCount === 1 ? "notificação não lida" : "notificações não lidas"}
            </Text>
          </View>
        )}

        {notifications.length === 0 && (
          <View style={S.empty}>
            <View style={[S.emptyIcon, { backgroundColor: PINK + "18" }]}>
              <Feather name="bell-off" size={32} color={PINK} />
            </View>
            <Text style={[S.emptyTitle, { color: colors.text }]}>Nenhuma notificação ainda</Text>
            <Text style={[S.emptyText, { color: colors.mutedForeground }]}>
              Notificações de leads abordados, CRM e follow-ups aparecerão aqui.
            </Text>
          </View>
        )}

        {notifications.length > 0 && (
          <View style={[S.list, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {notifications.map((notif, idx) => {
              const ic = ICON_MAP[notif.type] ?? ICON_MAP.jade;
              return (
                <TouchableOpacity
                  key={notif.id}
                  style={[
                    S.item,
                    { borderBottomColor: colors.border },
                    notif.unread && { backgroundColor: colors.surface },
                    idx === notifications.length - 1 && { borderBottomWidth: 0 },
                  ]}
                  activeOpacity={0.75}
                  onPress={() => markAsRead(notif.id)}
                >
                  <View style={[S.iconBox, { backgroundColor: ic.bg }]}>
                    <Feather name={ic.name as any} size={20} color={ic.color} />
                  </View>
                  <View style={S.itemContent}>
                    <View style={S.itemTop}>
                      <Text style={[S.itemTitle, { color: colors.text }]} numberOfLines={1}>
                        {notif.title}
                      </Text>
                      {notif.unread && <View style={[S.dot, { backgroundColor: PINK }]} />}
                    </View>
                    <Text style={[S.itemBody, { color: colors.mutedForeground }]} numberOfLines={2}>
                      {notif.body}
                    </Text>
                    <Text style={[S.itemTime, { color: colors.mutedForeground }]}>{notif.time}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {notifications.length > 0 && (
          <TouchableOpacity style={S.clearBtn} activeOpacity={0.7} onPress={markAllAsRead}>
            <Text style={[S.clearText, { color: colors.mutedForeground }]}>Marcar todas como lidas</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}

const S = StyleSheet.create({
  root:   { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingBottom: 16 },
  backBtn:{ width: 44, height: 44, borderRadius: 22, backgroundColor: "rgba(255,255,255,0.08)", borderWidth: 1, borderColor: "rgba(255,255,255,0.12)", alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 17, fontFamily: "SpaceGrotesk_700Bold" },
  headerBadge: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: PINK, alignItems: "center", justifyContent: "center",
  },
  headerBadgeText: { fontSize: 13, fontFamily: "SpaceGrotesk_700Bold", color: "#fff" },

  scroll: { paddingHorizontal: 16, paddingTop: 16 },

  unreadBanner: {
    flexDirection: "row", alignItems: "center", gap: 8,
    borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10,
    marginBottom: 16, borderWidth: 1,
  },
  unreadText: { fontSize: 13, fontFamily: "SpaceGrotesk_600SemiBold" },

  list:    { borderRadius: 14, borderWidth: 1, overflow: "hidden", marginBottom: 12 },
  item:    { flexDirection: "row", gap: 14, padding: 16, borderBottomWidth: StyleSheet.hairlineWidth },
  iconBox: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  itemContent: { flex: 1, gap: 3 },
  itemTop:     { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  itemTitle:   { flex: 1, fontSize: 14, fontFamily: "SpaceGrotesk_600SemiBold" },
  dot:         { width: 8, height: 8, borderRadius: 4 },
  itemBody:    { fontSize: 13, fontFamily: "SpaceGrotesk_400Regular", lineHeight: 18 },
  itemTime:    { fontSize: 11, fontFamily: "SpaceGrotesk_400Regular", marginTop: 2 },

  clearBtn:  { alignItems: "center", paddingVertical: 20 },
  clearText: { fontSize: 14, fontFamily: "SpaceGrotesk_500Medium" },

  empty:      { alignItems: "center", gap: 12, paddingTop: 80, paddingHorizontal: 32 },
  emptyIcon:  { width: 72, height: 72, borderRadius: 36, alignItems: "center", justifyContent: "center" },
  emptyTitle: { fontSize: 17, fontFamily: "SpaceGrotesk_700Bold" },
  emptyText:  { fontSize: 13, fontFamily: "SpaceGrotesk_400Regular", textAlign: "center", lineHeight: 20 },
});
