import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Platform,
  ActivityIndicator,
  Modal,
  Switch,
  ScrollView,
  Pressable,
} from "react-native";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

import { useColors } from "@/hooks/useColors";
import { useApp, Conversation } from "@/context/AppContext";

const API_BASE =
  Platform.OS === "web"
    ? ""
    : `https://${process.env.EXPO_PUBLIC_DOMAIN ?? ""}`;

const JADE_STATUS_KEY  = "jade_ativa";
const MSG_LIMIT_KEY    = "@jade_ia:wa_msg_settings";

const DEFAULT_LIMIT    = 10;

const FAKE_LOGS = [
  "JADE respondeu a Carlos Mendes às 09:14",
  "JADE enviou follow-up para Fernanda Souza às 10:32",
  "JADE qualificou lead StartUp Hub às 11:05",
  "JADE respondeu a Roberto Lima às 13:47",
];

// ─── ConversationItem ─────────────────────────────────────────────────────────
function ConversationItem({
  item,
  onPress,
  limitReached,
}: {
  item: Conversation;
  onPress: () => void;
  limitReached?: boolean;
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
            style={[styles.itemMsg, {
              color: item.unread > 0 ? colors.text : colors.mutedForeground,
              fontFamily: item.unread > 0 ? "SpaceGrotesk_500Medium" : "SpaceGrotesk_400Regular",
            }]}
            numberOfLines={1}
          >
            {item.lastMessage}
          </Text>
          <View style={{ flexDirection: "row", gap: 6, alignItems: "center" }}>
            {limitReached && (
              <View style={styles.limitBadge}>
                <Text style={styles.limitBadgeText}>Limite atingido</Text>
              </View>
            )}
            {item.unread > 0 && !limitReached && (
              <View style={[styles.badge, { backgroundColor: colors.primary }]}>
                <Text style={styles.badgeText}>{item.unread}</Text>
              </View>
            )}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ─── JadeBanner ───────────────────────────────────────────────────────────────
function JadeBanner({ ativa, onToggle, loading }: { ativa: boolean; onToggle: () => void; loading: boolean }) {
  const colors = useColors();
  return (
    <View style={[
      banner.card,
      { backgroundColor: ativa ? "#00D68F0D" : colors.card, borderColor: ativa ? "#00D68F33" : colors.border },
    ]}>
      <View style={[banner.iconWrap, { backgroundColor: ativa ? "#00D68F20" : "#FF008018" }]}>
        <MaterialCommunityIcons name="robot" size={22} color={ativa ? "#00D68F" : "#FF0080"} />
      </View>
      <View style={banner.body}>
        <Text style={[banner.title, { color: colors.text }]}>
          {ativa ? "JADE está atendendo" : "Ative a JADE no WhatsApp"}
        </Text>
        <Text style={[banner.sub, { color: colors.mutedForeground }]}>
          {ativa
            ? "Sua IA está respondendo clientes automaticamente"
            : "Atenda seus clientes enquanto você está em reunião"}
        </Text>
      </View>
      <TouchableOpacity
        style={[banner.btn, { backgroundColor: ativa ? "#00D68F" : "#FF0080", shadowColor: ativa ? "#00D68F" : "#FF0080" }]}
        onPress={onToggle}
        activeOpacity={0.85}
        disabled={loading}
      >
        {loading
          ? <ActivityIndicator color="#fff" size="small" style={{ paddingHorizontal: 6 }} />
          : <Text style={banner.btnText}>{ativa ? "Ativa ✓" : "Ativar"}</Text>
        }
      </TouchableOpacity>
    </View>
  );
}

// ─── AutonomoPanel ────────────────────────────────────────────────────────────
function AutonomoPanel({ ativa, logs, router }: { ativa: boolean; logs: string[]; router: ReturnType<typeof useRouter> }) {
  const colors = useColors();
  if (!ativa) return null;
  return (
    <View style={[auton.card, { backgroundColor: colors.card, borderColor: "#00D68F30" }]}>
      <View style={auton.statusRow}>
        <View style={auton.dot} />
        <Text style={[auton.statusText, { color: "#00D68F" }]}>🟢 JADE ativa — respondendo automaticamente</Text>
      </View>
      {logs.length > 0 && (
        <View style={auton.logsSection}>
          <Text style={[auton.logsLabel, { color: colors.mutedForeground }]}>ATIVIDADE RECENTE</Text>
          {logs.map((log, i) => (
            <View key={i} style={[auton.logRow, { borderBottomColor: colors.border }]}>
              <Feather name="zap" size={11} color="#00D68F" />
              <Text style={[auton.logText, { color: colors.mutedForeground }]}>{log}</Text>
            </View>
          ))}
        </View>
      )}
      <TouchableOpacity
        style={[auton.whatsappBtn, { backgroundColor: "#25D36615", borderColor: "#25D36640" }]}
        onPress={() => router.push("/whatsapp-config" as any)}
        activeOpacity={0.8}
      >
        <MaterialCommunityIcons name="whatsapp" size={16} color="#25D366" />
        <Text style={[auton.whatsappText, { color: "#25D366" }]}>Configurar integração WhatsApp</Text>
        <View style={[auton.configBadge, { backgroundColor: "#FFB30020", borderColor: "#FFB30040" }]}>
          <Text style={auton.configBadgeText}>Necessário para funcionar</Text>
        </View>
      </TouchableOpacity>
    </View>
  );
}

// ─── LimitCounter ─────────────────────────────────────────────────────────────
function LimitCounter({ value, onChange, min, max }: { value: number; onChange: (v: number) => void; min: number; max: number }) {
  const colors = useColors();
  return (
    <View style={lc.row}>
      <TouchableOpacity
        style={[lc.btn, { backgroundColor: colors.surface, borderColor: colors.border }]}
        onPress={() => onChange(Math.max(min, value - 5))}
        activeOpacity={0.7}
      >
        <Feather name="minus" size={16} color={colors.text} />
      </TouchableOpacity>
      <View style={[lc.display, { backgroundColor: colors.surface, borderColor: "#FF008040" }]}>
        <Text style={[lc.val, { color: "#FF0080" }]}>{value}</Text>
        <Text style={[lc.unit, { color: colors.mutedForeground }]}>msgs</Text>
      </View>
      <TouchableOpacity
        style={[lc.btn, { backgroundColor: colors.surface, borderColor: colors.border }]}
        onPress={() => onChange(Math.min(max, value + 5))}
        activeOpacity={0.7}
      >
        <Feather name="plus" size={16} color={colors.text} />
      </TouchableOpacity>
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function ConversasScreen() {
  const colors      = useColors();
  const insets      = useSafeAreaInsets();
  const router      = useRouter();
  const { conversations } = useApp();

  const [query,        setQuery]       = useState("");
  const [jadeAtiva,    setJadeAtiva]   = useState(false);
  const [toggling,     setToggling]    = useState(false);
  const [activityLogs, setActivityLogs] = useState<string[]>([]);

  // Settings state
  const [settingsModal, setSettingsModal] = useState(false);
  const [msgLimit,      setMsgLimit]     = useState(DEFAULT_LIMIT);
  const [warnOnLimit,   setWarnOnLimit]  = useState(true);
  const [autoStop,      setAutoStop]     = useState(false);
  // Draft values while modal is open
  const [draftLimit,    setDraftLimit]   = useState(DEFAULT_LIMIT);
  const [draftWarn,     setDraftWarn]    = useState(true);
  const [draftAuto,     setDraftAuto]    = useState(false);

  // Conversations that have hit the limit
  const [limitReachedIds, setLimitReachedIds] = useState<Set<string>>(new Set());
  // Extra budget granted per conversation
  const [extraBudget, setExtraBudget] = useState<Record<string, number>>({});

  const topPad    = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 84 : insets.bottom + 60;

  const filtered = conversations.filter((c) =>
    c.contactName.toLowerCase().includes(query.toLowerCase())
  );

  // Load settings from AsyncStorage
  useEffect(() => {
    AsyncStorage.getItem(MSG_LIMIT_KEY).then((raw) => {
      if (!raw) return;
      try {
        const s = JSON.parse(raw);
        if (s.msgLimit)    setMsgLimit(s.msgLimit);
        if (typeof s.warnOnLimit === "boolean") setWarnOnLimit(s.warnOnLimit);
        if (typeof s.autoStop    === "boolean") setAutoStop(s.autoStop);
      } catch {}
    });
  }, []);

  // Load JADE status
  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/jade/status`);
        if (res.ok) {
          const data = await res.json();
          setJadeAtiva(!!data.ativo);
          await AsyncStorage.setItem(JADE_STATUS_KEY, data.ativo ? "1" : "0");
          return;
        }
      } catch {}
      try {
        const cached = await AsyncStorage.getItem(JADE_STATUS_KEY);
        setJadeAtiva(cached === "1");
      } catch {}
    };
    load();
  }, []);

  // Simulate limit detection: conversations with unread ≥ msgLimit are "over limit"
  useEffect(() => {
    const reached = new Set<string>();
    conversations.forEach((c) => {
      const budget = msgLimit + (extraBudget[c.id] ?? 0);
      if (c.unread >= budget) reached.add(c.id);
    });
    setLimitReachedIds(reached);
  }, [conversations, msgLimit, extraBudget]);

  useEffect(() => {
    if (!jadeAtiva) { setActivityLogs([]); return; }
    const timer = setTimeout(() => setActivityLogs(FAKE_LOGS.slice(0, 3)), 800);
    return () => clearTimeout(timer);
  }, [jadeAtiva]);

  const handleToggle = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const novoEstado = !jadeAtiva;
    setToggling(true);
    try {
      const res = await fetch(`${API_BASE}/api/jade/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ativo: novoEstado }),
      });
      if (!res.ok) throw new Error("API error");
    } catch {}
    try { await AsyncStorage.setItem(JADE_STATUS_KEY, novoEstado ? "1" : "0"); } catch {}
    setJadeAtiva(novoEstado);
    setToggling(false);
    if (novoEstado) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const openSettings = () => {
    setDraftLimit(msgLimit);
    setDraftWarn(warnOnLimit);
    setDraftAuto(autoStop);
    setSettingsModal(true);
  };

  const saveSettings = async () => {
    setMsgLimit(draftLimit);
    setWarnOnLimit(draftWarn);
    setAutoStop(draftAuto);
    try {
      await AsyncStorage.setItem(MSG_LIMIT_KEY, JSON.stringify({
        msgLimit: draftLimit, warnOnLimit: draftWarn, autoStop: draftAuto,
      }));
    } catch {}
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setSettingsModal(false);
  };

  const authorizeMore = (id: string) => {
    setExtraBudget((prev) => ({ ...prev, [id]: (prev[id] ?? 0) + 10 }));
    setLimitReachedIds((prev) => { const s = new Set(prev); s.delete(id); return s; });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* ── Header ── */}
      <View style={[styles.header, { paddingTop: topPad + 16 }]}>
        <View style={styles.headerRow}>
          <View>
            <Text style={[styles.headerTitle, { color: colors.text }]}>Conversas</Text>
            <Text style={[styles.headerSub, { color: colors.mutedForeground }]}>
              {conversations.filter((c) => c.unread > 0).length} não lidas
              {jadeAtiva && <Text style={{ color: "#00D68F" }}> · JADE ON</Text>}
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.iconBtn, { backgroundColor: colors.surface }]}
            onPress={openSettings}
            activeOpacity={0.8}
          >
            <Feather name="sliders" size={18} color={colors.primary} />
          </TouchableOpacity>
        </View>

        <JadeBanner ativa={jadeAtiva} onToggle={handleToggle} loading={toggling} />
        <AutonomoPanel ativa={jadeAtiva} logs={activityLogs} router={router} />

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

      {/* ── Conversation List ── */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const reached = limitReachedIds.has(item.id);
          return (
            <>
              <ConversationItem
                item={item}
                onPress={() => router.push(`/conversa/${item.id}` as any)}
                limitReached={reached}
              />
              {/* Inline authorize banner below the conversation item */}
              {reached && (
                <View style={[styles.authBanner, { backgroundColor: "#FFB30012", borderColor: "#FFB30030" }]}>
                  <Feather name="alert-triangle" size={13} color="#FFB300" />
                  <Text style={styles.authBannerText}>
                    JADE pausada — limite de {msgLimit} msgs atingido
                  </Text>
                  <TouchableOpacity
                    style={styles.authBtn}
                    onPress={() => authorizeMore(item.id)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.authBtnText}>+10 msgs</Text>
                  </TouchableOpacity>
                </View>
              )}
            </>
          );
        }}
        contentContainerStyle={{ paddingBottom: bottomPad }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Feather name="message-circle" size={40} color={colors.mutedForeground} />
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>Nenhuma conversa encontrada</Text>
          </View>
        }
      />

      {/* ── Settings Modal ── */}
      <Modal visible={settingsModal} transparent animationType="slide" onRequestClose={() => setSettingsModal(false)}>
        <Pressable style={modal.overlay} onPress={() => setSettingsModal(false)}>
          <Pressable style={[modal.box, { backgroundColor: colors.card }]} onPress={() => {}}>
            {/* Handle */}
            <View style={[modal.handle, { backgroundColor: colors.border }]} />

            <Text style={[modal.title, { color: colors.text }]}>Limite de mensagens por lead</Text>
            <Text style={[modal.sub, { color: colors.mutedForeground }]}>
              JADE pausa automaticamente ao atingir o limite configurado
            </Text>

            {/* Limit counter */}
            <View style={[modal.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={modal.sectionHeader}>
                <Feather name="message-circle" size={15} color="#FF0080" />
                <Text style={[modal.sectionTitle, { color: colors.text }]}>Máximo por lead</Text>
              </View>
              <LimitCounter value={draftLimit} onChange={setDraftLimit} min={5} max={50} />
              <Text style={[modal.hint, { color: colors.mutedForeground }]}>
                Entre 5 e 50 mensagens · atual: {draftLimit} msgs
              </Text>
            </View>

            {/* Warn toggle */}
            <View style={[modal.toggle, { borderColor: colors.border }]}>
              <View style={{ flex: 1 }}>
                <Text style={[modal.toggleTitle, { color: colors.text }]}>Avisar ao atingir o limite</Text>
                <Text style={[modal.toggleSub, { color: colors.mutedForeground }]}>
                  Receba uma notificação quando JADE atingir o máximo
                </Text>
              </View>
              <Switch
                value={draftWarn}
                onValueChange={setDraftWarn}
                trackColor={{ false: colors.border, true: "#FF008060" }}
                thumbColor={draftWarn ? "#FF0080" : colors.mutedForeground}
              />
            </View>

            {/* Auto-stop toggle */}
            <View style={[modal.toggle, { borderColor: colors.border }]}>
              <View style={{ flex: 1 }}>
                <Text style={[modal.toggleTitle, { color: colors.text }]}>Pausar automaticamente</Text>
                <Text style={[modal.toggleSub, { color: colors.mutedForeground }]}>
                  JADE para de responder e aguarda sua autorização
                </Text>
              </View>
              <Switch
                value={draftAuto}
                onValueChange={setDraftAuto}
                trackColor={{ false: colors.border, true: "#FF008060" }}
                thumbColor={draftAuto ? "#FF0080" : colors.mutedForeground}
              />
            </View>

            <TouchableOpacity style={modal.saveBtn} onPress={saveSettings} activeOpacity={0.85}>
              <Text style={modal.saveBtnText}>Confirmar</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingBottom: 8 },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 14 },
  headerTitle: { fontSize: 26, fontFamily: "SpaceGrotesk_700Bold" },
  headerSub: { fontSize: 13, fontFamily: "SpaceGrotesk_400Regular", marginTop: 2 },
  iconBtn: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  search: { flexDirection: "row", alignItems: "center", gap: 10, borderRadius: 14, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 10, marginBottom: 8, marginTop: 12 },
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
  limitBadge: { backgroundColor: "#FFB30020", borderColor: "#FFB30060", borderWidth: 1, borderRadius: 8, paddingHorizontal: 7, paddingVertical: 2, marginTop: 3 },
  limitBadgeText: { color: "#FFB300", fontSize: 10, fontFamily: "SpaceGrotesk_600SemiBold" },
  authBanner: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 20, paddingVertical: 9, borderTopWidth: StyleSheet.hairlineWidth, borderBottomWidth: StyleSheet.hairlineWidth },
  authBannerText: { flex: 1, color: "#FFB300", fontSize: 12, fontFamily: "SpaceGrotesk_500Medium" },
  authBtn: { backgroundColor: "#FF008020", borderColor: "#FF008050", borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 },
  authBtnText: { color: "#FF0080", fontSize: 12, fontFamily: "SpaceGrotesk_700Bold" },
  empty: { alignItems: "center", justifyContent: "center", paddingTop: 80, gap: 12 },
  emptyText: { fontSize: 15, fontFamily: "SpaceGrotesk_400Regular" },
});

const banner = StyleSheet.create({
  card: { flexDirection: "row", alignItems: "center", gap: 12, borderRadius: 16, borderWidth: 1.5, padding: 14 },
  iconWrap: { width: 42, height: 42, borderRadius: 12, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  body: { flex: 1 },
  title: { fontSize: 14, fontFamily: "SpaceGrotesk_600SemiBold" },
  sub: { fontSize: 11, fontFamily: "SpaceGrotesk_400Regular", marginTop: 2, lineHeight: 16 },
  btn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  btnText: { fontSize: 13, fontFamily: "SpaceGrotesk_700Bold", color: "#fff" },
});

const auton = StyleSheet.create({
  card: { borderRadius: 12, borderWidth: 1, padding: 14, marginTop: 8, gap: 12 },
  statusRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#00D68F" },
  statusText: { fontSize: 13, fontFamily: "SpaceGrotesk_600SemiBold" },
  logsSection: { gap: 4 },
  logsLabel: { fontSize: 10, fontFamily: "SpaceGrotesk_700Bold", letterSpacing: 0.8, marginBottom: 4 },
  logRow: { flexDirection: "row", alignItems: "center", gap: 6, paddingVertical: 5, borderBottomWidth: StyleSheet.hairlineWidth },
  logText: { fontSize: 12, fontFamily: "SpaceGrotesk_400Regular", flex: 1 },
  whatsappBtn: { flexDirection: "row", alignItems: "center", gap: 8, borderRadius: 10, borderWidth: 1, padding: 10, flexWrap: "wrap" },
  whatsappText: { fontSize: 13, fontFamily: "SpaceGrotesk_600SemiBold", flex: 1 },
  configBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, borderWidth: 1 },
  configBadgeText: { fontSize: 10, fontFamily: "SpaceGrotesk_700Bold", color: "#FFB300" },
});

const modal = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.65)", justifyContent: "flex-end" },
  box: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40, gap: 16 },
  handle: { width: 36, height: 4, borderRadius: 2, alignSelf: "center", marginBottom: 8 },
  title: { fontSize: 20, fontFamily: "SpaceGrotesk_700Bold" },
  sub: { fontSize: 13, fontFamily: "SpaceGrotesk_400Regular", lineHeight: 19, marginTop: -8 },
  section: { borderRadius: 14, borderWidth: 1, padding: 16, gap: 12 },
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  sectionTitle: { fontSize: 14, fontFamily: "SpaceGrotesk_600SemiBold" },
  hint: { fontSize: 11, fontFamily: "SpaceGrotesk_400Regular", textAlign: "center" },
  toggle: { flexDirection: "row", alignItems: "center", gap: 12, borderTopWidth: StyleSheet.hairlineWidth, paddingTop: 14 },
  toggleTitle: { fontSize: 14, fontFamily: "SpaceGrotesk_600SemiBold" },
  toggleSub: { fontSize: 12, fontFamily: "SpaceGrotesk_400Regular", marginTop: 2, lineHeight: 16 },
  saveBtn: { backgroundColor: "#FF0080", borderRadius: 14, paddingVertical: 15, alignItems: "center", marginTop: 4, shadowColor: "#FF0080", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 12, elevation: 6 },
  saveBtnText: { color: "#fff", fontSize: 16, fontFamily: "SpaceGrotesk_700Bold" },
});

const lc = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 16 },
  btn: { width: 40, height: 40, borderRadius: 12, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  display: { flexDirection: "row", alignItems: "baseline", gap: 4, borderRadius: 12, borderWidth: 1.5, paddingHorizontal: 20, paddingVertical: 10 },
  val: { fontSize: 28, fontFamily: "SpaceGrotesk_700Bold" },
  unit: { fontSize: 12, fontFamily: "SpaceGrotesk_500Medium" },
});
