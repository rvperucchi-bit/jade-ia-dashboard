import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  FlatList,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { loadSessions, type HistorySession, SESSION_HISTORY_KEY } from "@/utils/sessionHistory";

const PINK   = "#FF0080";
const PURPLE = "#8400FF";

const TOPIC_CONFIG: Record<HistorySession["topic"], { color: string; icon: string }> = {
  "prospecção": { color: PINK,     icon: "search" },
  "briefing":   { color: PURPLE,   icon: "clipboard" },
  "objeção":    { color: "#FF8800",icon: "shield" },
  "roteiro":    { color: "#22CC88",icon: "list" },
  "análise":    { color: "#5577FF",icon: "bar-chart-2" },
  "geral":      { color: "#AAAACC",icon: "message-circle" },
};


function SessionCard({ session, onPress }: { session: HistorySession; onPress: () => void }) {
  const colors = useColors();
  const cfg = TOPIC_CONFIG[session.topic];
  return (
    <TouchableOpacity
      style={[S.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <View style={[S.cardAccent, { backgroundColor: cfg.color }]} />
      <View style={[S.iconWrap, { backgroundColor: cfg.color + "20" }]}>
        <Feather name={cfg.icon as any} size={18} color={cfg.color} />
      </View>
      <View style={{ flex: 1, gap: 4 }}>
        <View style={S.cardHeader}>
          <Text style={[S.cardTitle, { color: colors.text }]} numberOfLines={1}>{session.title}</Text>
          <Text style={[S.cardDate, { color: colors.mutedForeground }]}>{session.date}</Text>
        </View>
        <Text style={[S.cardPreview, { color: colors.mutedForeground }]} numberOfLines={2}>{session.preview}</Text>
        <View style={S.cardFooter}>
          <View style={[S.topicChip, { backgroundColor: cfg.color + "18" }]}>
            <Text style={[S.topicText, { color: cfg.color }]}>{session.topic}</Text>
          </View>
          <Text style={[S.msgCount, { color: colors.mutedForeground }]}>{session.messageCount} mensagens</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function HistoricoScreen() {
  const colors  = useColors();
  const insets  = useSafeAreaInsets();
  const router  = useRouter();
  const [sessions, setSessions] = useState<HistorySession[]>([]);

  const topPad    = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 84 : insets.bottom + 60;

  useEffect(() => {
    loadSessions().then(setSessions).catch(() => setSessions([]));
  }, []);

  return (
    <View style={[S.root, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[S.header, { paddingTop: topPad + 4 }]}>
        <TouchableOpacity onPress={() => router.push("/(tabs)/jade" as any)} style={S.backBtn} activeOpacity={0.7}>
          <Feather name="arrow-left" size={22} color={colors.text} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={[S.title, { color: colors.text }]}>Histórico</Text>
          <Text style={[S.subtitle, { color: colors.mutedForeground }]}>Suas conversas com a JADE</Text>
        </View>
        <TouchableOpacity
          style={[S.newBtn, { backgroundColor: PINK }]}
          onPress={() => router.push("/(tabs)/jade" as any)}
          activeOpacity={0.85}
        >
          <Feather name="plus" size={16} color="#fff" />
          <Text style={S.newBtnText}>Nova</Text>
        </TouchableOpacity>
      </View>

      {/* List */}
      <FlatList
        data={sessions}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16, paddingBottom: bottomPad, gap: 10 }}
        renderItem={({ item }) => (
          <SessionCard
          session={item}
          onPress={() => router.push({ pathname: "/(tabs)/jade", params: { resumeSession: item.id } } as any)}
        />
        )}
        ListEmptyComponent={
          <View style={S.empty}>
            <View style={[S.emptyIcon, { backgroundColor: PINK + "18" }]}>
              <Feather name="clock" size={32} color={PINK} />
            </View>
            <Text style={[S.emptyTitle, { color: colors.text }]}>Nenhum histórico ainda</Text>
            <Text style={[S.emptyText, { color: colors.mutedForeground }]}>
              Suas conversas com a JADE serão salvas aqui automaticamente.
            </Text>
            <TouchableOpacity
              style={[S.startBtn, { backgroundColor: PINK }]}
              onPress={() => router.push("/(tabs)/jade" as any)}
              activeOpacity={0.85}
            >
              <Text style={S.startBtnText}>Iniciar conversa</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </View>
  );
}

const S = StyleSheet.create({
  root:       { flex: 1 },
  header:     { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingBottom: 12, gap: 12 },
  backBtn:    { padding: 4 },
  title:      { fontSize: 22, fontFamily: "SpaceGrotesk_700Bold" },
  subtitle:   { fontSize: 12, fontFamily: "SpaceGrotesk_400Regular", marginTop: 1 },
  newBtn:     { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12 },
  newBtnText: { fontSize: 13, fontFamily: "SpaceGrotesk_700Bold", color: "#fff" },
  // Card
  card:       { flexDirection: "row", alignItems: "flex-start", borderRadius: 16, borderWidth: 1, padding: 14, gap: 12, overflow: "hidden" },
  cardAccent: { position: "absolute", left: 0, top: 0, bottom: 0, width: 3 },
  iconWrap:   { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  cardHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  cardTitle:  { fontSize: 14, fontFamily: "SpaceGrotesk_600SemiBold", flex: 1, marginRight: 8 },
  cardDate:   { fontSize: 11, fontFamily: "SpaceGrotesk_400Regular", flexShrink: 0 },
  cardPreview:{ fontSize: 12, fontFamily: "SpaceGrotesk_400Regular", lineHeight: 18 },
  cardFooter: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  topicChip:  { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  topicText:  { fontSize: 10, fontFamily: "SpaceGrotesk_600SemiBold" },
  msgCount:   { fontSize: 11, fontFamily: "SpaceGrotesk_400Regular" },
  // Empty
  empty:      { alignItems: "center", gap: 12, paddingTop: 80, paddingHorizontal: 32 },
  emptyIcon:  { width: 72, height: 72, borderRadius: 36, alignItems: "center", justifyContent: "center" },
  emptyTitle: { fontSize: 18, fontFamily: "SpaceGrotesk_700Bold" },
  emptyText:  { fontSize: 14, fontFamily: "SpaceGrotesk_400Regular", textAlign: "center", lineHeight: 21 },
  startBtn:   { marginTop: 8, paddingHorizontal: 28, paddingVertical: 13, borderRadius: 14 },
  startBtnText:{ fontSize: 15, fontFamily: "SpaceGrotesk_700Bold", color: "#fff" },
});
