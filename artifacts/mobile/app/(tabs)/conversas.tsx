import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Platform,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

import { useColors } from "@/hooks/useColors";
import { useApp, Conversation } from "@/context/AppContext";

function ConversationItem({
  item,
  onPress,
}: {
  item: Conversation;
  onPress: () => void;
}) {
  const colors = useColors();
  return (
    <TouchableOpacity
      style={[styles.item, { borderBottomColor: colors.border }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.avatarWrap}>
        <View style={[styles.avatar, { backgroundColor: item.avatarColor }]}>
          <Text style={styles.avatarText}>{item.initials}</Text>
        </View>
        {item.isOnline && <View style={[styles.onlineDot, { borderColor: colors.background }]} />}
      </View>
      <View style={styles.itemBody}>
        <View style={styles.itemRow}>
          <Text style={[styles.itemName, { color: colors.text }]} numberOfLines={1}>
            {item.contactName}
          </Text>
          <Text style={[styles.itemTime, { color: item.unread > 0 ? colors.primary : colors.mutedForeground }]}>
            {item.time}
          </Text>
        </View>
        <View style={styles.itemRow}>
          <Text
            style={[styles.itemMsg, { color: item.unread > 0 ? colors.text : colors.mutedForeground, fontFamily: item.unread > 0 ? "SpaceGrotesk_500Medium" : "SpaceGrotesk_400Regular" }]}
            numberOfLines={1}
          >
            {item.lastMessage}
          </Text>
          {item.unread > 0 && (
            <View style={[styles.badge, { backgroundColor: colors.primary }]}>
              <Text style={styles.badgeText}>{item.unread}</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function ConversasScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { conversations } = useApp();
  const [query, setQuery] = useState("");

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 84 : insets.bottom + 60;

  const filtered = conversations.filter((c) =>
    c.contactName.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 16 }]}>
        <View style={styles.headerRow}>
          <View>
            <Text style={[styles.headerTitle, { color: colors.text }]}>Conversas</Text>
            <Text style={[styles.headerSub, { color: colors.mutedForeground }]}>
              {conversations.filter((c) => c.unread > 0).length} não lidas
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.iconBtn, { backgroundColor: colors.surface }]}
            activeOpacity={0.8}
          >
            <Feather name="edit-2" size={18} color={colors.primary} />
          </TouchableOpacity>
        </View>
        <View style={[styles.search, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Feather name="search" size={16} color={colors.mutedForeground} />
          <TextInput
            style={[styles.searchInput, { color: colors.text, fontFamily: "SpaceGrotesk_400Regular" }]}
            placeholder="Buscar conversa..."
            placeholderTextColor={colors.mutedForeground}
            value={query}
            onChangeText={setQuery}
          />
        </View>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ConversationItem
            item={item}
            onPress={() => router.push(`/conversa/${item.id}` as any)}
          />
        )}
        contentContainerStyle={{ paddingBottom: bottomPad }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Feather name="message-circle" size={40} color={colors.mutedForeground} />
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              Nenhuma conversa encontrada
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingBottom: 8 },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  headerTitle: { fontSize: 26, fontFamily: "SpaceGrotesk_700Bold" },
  headerSub: { fontSize: 13, fontFamily: "SpaceGrotesk_400Regular", marginTop: 2 },
  iconBtn: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  search: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 8,
  },
  searchInput: { flex: 1, fontSize: 15 },
  item: { flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth },
  avatarWrap: { position: "relative", marginRight: 14 },
  avatar: { width: 48, height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center" },
  avatarText: { color: "#fff", fontSize: 16, fontFamily: "SpaceGrotesk_700Bold" },
  onlineDot: { position: "absolute", bottom: 1, right: 1, width: 13, height: 13, borderRadius: 7, backgroundColor: "#00D68F", borderWidth: 2 },
  itemBody: { flex: 1 },
  itemRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  itemName: { fontSize: 15, fontFamily: "SpaceGrotesk_600SemiBold", flex: 1, marginRight: 8 },
  itemTime: { fontSize: 12, fontFamily: "SpaceGrotesk_400Regular" },
  itemMsg: { flex: 1, fontSize: 13, marginTop: 3, marginRight: 8 },
  badge: { width: 20, height: 20, borderRadius: 10, alignItems: "center", justifyContent: "center", marginTop: 3 },
  badgeText: { color: "#fff", fontSize: 11, fontFamily: "SpaceGrotesk_700Bold" },
  empty: { alignItems: "center", justifyContent: "center", paddingTop: 80, gap: 12 },
  emptyText: { fontSize: 15, fontFamily: "SpaceGrotesk_400Regular" },
});
