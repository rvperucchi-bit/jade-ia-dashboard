import React, { useEffect, useState } from "react";
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
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

import { useColors } from "@/hooks/useColors";
import { useApp, Conversation } from "@/context/AppContext";

const PINK = "#FF0080";
const API_BASE =
  Platform.OS === "web"
    ? ""
    : `https://${process.env.EXPO_PUBLIC_DOMAIN ?? ""}`;

const JADE_STATUS_KEY = "jade_ativa";
const MSG_LIMIT_KEY   = "@jade_ia:wa_msg_settings";
const DEFAULT_LIMIT   = 10;

type FilterType = "todas" | "em_andamento" | "sem_resposta" | "qualificados" | "arquivadas";

const FILTERS: { key: FilterType; label: string }[] = [
  { key: "todas",        label: "Todas" },
  { key: "em_andamento", label: "Em andamento" },
  { key: "sem_resposta", label: "Sem resposta" },
  { key: "qualificados", label: "Qualificados" },
  { key: "arquivadas",   label: "Arquivadas" },
];

type TagInfo = { label: string; color: string; bg: string };

function deriveTag(c: Conversation): TagInfo {
  if (c.isOnline)                    return { label: "Em andamento", color: PINK,                      bg: PINK + "18" };
  if (c.unread > 5)                  return { label: "Qualificado",  color: "rgba(180,180,210,0.85)",  bg: "rgba(180,180,210,0.08)" };
  if (c.unread > 2)                  return { label: "Follow-up",    color: "rgba(180,180,210,0.65)",  bg: "rgba(180,180,210,0.07)" };
  if (!c.isOnline && c.unread === 0) return { label: "Aguardando",   color: "rgba(180,180,210,0.5)",   bg: "rgba(180,180,210,0.05)" };
  return                                    { label: "Novo lead",    color: "rgba(180,180,210,0.6)",   bg: "rgba(180,180,210,0.06)" };
}

function applyFilter(conversations: Conversation[], filter: FilterType): Conversation[] {
  switch (filter) {
    case "em_andamento": return conversations.filter(c => c.isOnline);
    case "sem_resposta": return conversations.filter(c => !c.isOnline && c.unread === 0);
    case "qualificados": return conversations.filter(c => c.unread > 5);
    case "arquivadas":   return conversations.filter(c => !c.isOnline && c.unread === 0 && c.messages.length > 5);
    default:             return conversations;
  }
}

// ─── ConversationItem ─────────────────────────────────────────────────────────
function ConversationItem({
  item, onPress, limitReached,
}: { item: Conversation; onPress: () => void; limitReached?: boolean }) {
  const colors = useColors();
  const tag    = deriveTag(item);

  return (
    <TouchableOpacity
      style={[S.item, { borderBottomColor: colors.border }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Avatar */}
      <View style={S.avatarWrap}>
        <View style={[S.avatar, { backgroundColor: item.avatarColor }]}>
          <Text style={S.avatarText}>{item.initials}</Text>
        </View>
        {item.isOnline && (
          <View style={[S.onlineDot, { borderColor: colors.background }]} />
        )}
      </View>

      {/* Content */}
      <View style={S.itemBody}>
        {/* Row 1: Name + Time */}
        <View style={S.itemRow}>
          <Text style={[S.itemName, { color: colors.text }]} numberOfLines={1}>
            {item.contactName}
          </Text>
          <Text style={[S.itemTime, { color: colors.mutedForeground }]}>
            {item.time}
          </Text>
        </View>

        {/* Row 2: Last message */}
        <Text
          style={[S.itemMsg, {
            color: item.unread > 0 ? "rgba(255,255,255,0.75)" : colors.mutedForeground,
            fontFamily: item.unread > 0 ? "SpaceGrotesk_500Medium" : "SpaceGrotesk_400Regular",
          }]}
          numberOfLines={1}
        >
          {item.lastMessage}
        </Text>

        {/* Row 3: Tag + Badge */}
        <View style={S.bottomRow}>
          <View style={[S.tagChip, { backgroundColor: tag.bg }]}>
            <Text style={[S.tagText, { color: tag.color }]}>{tag.label}</Text>
          </View>

          <View style={{ flexDirection: "row", gap: 6, alignItems: "center" }}>
            {limitReached && (
              <View style={S.limitBadge}>
                <Text style={S.limitBadgeText}>Pausado</Text>
              </View>
            )}
            {item.unread > 0 && !limitReached && (
              <View style={S.badge}>
                <Text style={S.badgeText}>{item.unread}</Text>
              </View>
            )}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ─── LimitCounter ─────────────────────────────────────────────────────────────
function LimitCounter({ value, onChange, min, max }: { value: number; onChange: (v: number) => void; min: number; max: number }) {
  const colors = useColors();
  return (
    <View style={lc.row}>
      <TouchableOpacity style={[lc.btn, { backgroundColor: colors.surface, borderColor: colors.border }]} onPress={() => onChange(Math.max(min, value - 5))} activeOpacity={0.7}>
        <Feather name="minus" size={16} color={colors.text} />
      </TouchableOpacity>
      <View style={[lc.display, { backgroundColor: colors.surface, borderColor: PINK + "40" }]}>
        <Text style={[lc.val, { color: PINK }]}>{value}</Text>
        <Text style={[lc.unit, { color: colors.mutedForeground }]}>msgs</Text>
      </View>
      <TouchableOpacity style={[lc.btn, { backgroundColor: colors.surface, borderColor: colors.border }]} onPress={() => onChange(Math.min(max, value + 5))} activeOpacity={0.7}>
        <Feather name="plus" size={16} color={colors.text} />
      </TouchableOpacity>
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function ConversasScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { conversations } = useApp();

  const [query,         setQuery]        = useState("");
  const [showSearch,    setShowSearch]   = useState(false);
  const [activeFilter,  setActiveFilter] = useState<FilterType>("todas");
  const [jadeAtiva,     setJadeAtiva]    = useState(false);
  const [toggling,      setToggling]     = useState(false);
  const [settingsModal, setSettingsModal] = useState(false);
  const [msgLimit,      setMsgLimit]     = useState(DEFAULT_LIMIT);
  const [warnOnLimit,   setWarnOnLimit]  = useState(true);
  const [autoStop,      setAutoStop]     = useState(false);
  const [draftLimit,    setDraftLimit]   = useState(DEFAULT_LIMIT);
  const [draftWarn,     setDraftWarn]    = useState(true);
  const [draftAuto,     setDraftAuto]    = useState(false);
  const [limitReachedIds, setLimitReachedIds] = useState<Set<string>>(new Set());
  const [extraBudget,     setExtraBudget]     = useState<Record<string, number>>({});

  const topPad    = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 84 : insets.bottom + 60;

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

  useEffect(() => {
    const reached = new Set<string>();
    conversations.forEach((c) => {
      const budget = msgLimit + (extraBudget[c.id] ?? 0);
      if (c.unread >= budget) reached.add(c.id);
    });
    setLimitReachedIds(reached);
  }, [conversations, msgLimit, extraBudget]);

  const handleToggle = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const novoEstado = !jadeAtiva;
    setToggling(true);
    try {
      const res = await fetch(`${API_BASE}/api/jade/status`, {
        method: "POST", headers: { "Content-Type": "application/json" },
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
    setDraftLimit(msgLimit); setDraftWarn(warnOnLimit); setDraftAuto(autoStop);
    setSettingsModal(true);
  };

  const saveSettings = async () => {
    setMsgLimit(draftLimit); setWarnOnLimit(draftWarn); setAutoStop(draftAuto);
    try { await AsyncStorage.setItem(MSG_LIMIT_KEY, JSON.stringify({ msgLimit: draftLimit, warnOnLimit: draftWarn, autoStop: draftAuto })); } catch {}
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setSettingsModal(false);
  };

  const authorizeMore = (id: string) => {
    setExtraBudget((prev) => ({ ...prev, [id]: (prev[id] ?? 0) + 10 }));
    setLimitReachedIds((prev) => { const s = new Set(prev); s.delete(id); return s; });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const filtered = applyFilter(conversations, activeFilter)
    .filter(c => !query || c.contactName.toLowerCase().includes(query.toLowerCase()));

  const waitingCount = conversations.filter(c => !c.isOnline && c.unread === 0).length;

  return (
    <View style={[S.root, { backgroundColor: colors.background }]}>

      {/* ── Header ── */}
      <View style={[S.header, { paddingTop: topPad + 6 }]}>
        <TouchableOpacity style={S.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <Feather name="arrow-left" size={22} color={colors.text} />
        </TouchableOpacity>

        <View style={{ flex: 1 }}>
          <Text style={[S.title, { color: colors.text }]}>Conversas</Text>
          <Text style={[S.subtitle, { color: colors.mutedForeground }]}>
            {waitingCount > 0 ? `${waitingCount} aguardando retorno` : "Central comercial"}
          </Text>
        </View>

        {/* Search */}
        <TouchableOpacity
          style={[S.iconBtn, { backgroundColor: colors.surface }]}
          onPress={() => setShowSearch(v => !v)}
          activeOpacity={0.8}
        >
          <Feather name="search" size={17} color={showSearch ? PINK : colors.mutedForeground} />
        </TouchableOpacity>

        {/* Settings */}
        <TouchableOpacity
          style={[S.iconBtn, { backgroundColor: colors.surface }]}
          onPress={openSettings}
          activeOpacity={0.8}
        >
          <Feather name="sliders" size={17} color={colors.mutedForeground} />
        </TouchableOpacity>

        {/* JADE status dot — grouped with icons */}
        <TouchableOpacity
          style={S.statusPill}
          onPress={handleToggle}
          activeOpacity={0.8}
          disabled={toggling}
        >
          {toggling
            ? <ActivityIndicator size="small" color={PINK} style={{ width: 8, height: 8 }} />
            : <View style={[S.jadeDot, { backgroundColor: jadeAtiva ? "#22CC88" : "#444455" }]} />
          }
        </TouchableOpacity>
      </View>

      {/* ── Search bar ── */}
      {showSearch && (
        <View style={[S.searchBar, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Feather name="search" size={15} color={colors.mutedForeground} />
          <TextInput
            style={[S.searchInput, { color: colors.text }]}
            placeholder="Buscar conversa..."
            placeholderTextColor={colors.mutedForeground}
            value={query}
            onChangeText={setQuery}
            autoFocus
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery("")}>
              <Feather name="x" size={15} color={colors.mutedForeground} />
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* ── Filter tabs ── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={S.filterScroll}
      >
        {FILTERS.map(f => {
          const active = activeFilter === f.key;
          return (
            <TouchableOpacity
              key={f.key}
              style={S.filterTab}
              onPress={() => { setActiveFilter(f.key); Haptics.selectionAsync(); }}
              activeOpacity={0.75}
            >
              <Text style={[S.filterText, { color: active ? PINK : colors.mutedForeground }]}>
                {f.label}
              </Text>
              {active && <View style={S.filterUnderline} />}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* ── Conversation list ── */}
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
              {reached && (
                <View style={[S.authBanner, { borderColor: "rgba(255,255,255,0.05)" }]}>
                  <Feather name="pause-circle" size={13} color="rgba(255,255,255,0.35)" />
                  <Text style={S.authBannerText}>JADE pausada — {msgLimit} msgs atingidas</Text>
                  <TouchableOpacity style={S.authBtn} onPress={() => authorizeMore(item.id)} activeOpacity={0.8}>
                    <Text style={S.authBtnText}>+10 msgs</Text>
                  </TouchableOpacity>
                </View>
              )}
            </>
          );
        }}
        contentContainerStyle={{ paddingBottom: bottomPad }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={S.empty}>
            <Feather name="message-circle" size={36} color={colors.mutedForeground} />
            <Text style={[S.emptyTitle, { color: colors.text }]}>Nenhuma conversa</Text>
            <Text style={[S.emptyText, { color: colors.mutedForeground }]}>
              {activeFilter !== "todas"
                ? "Nenhum resultado para esse filtro."
                : "As conversas comerciais da JADE aparecerão aqui."}
            </Text>
          </View>
        }
      />

      {/* ── Settings Modal ── */}
      <Modal visible={settingsModal} transparent animationType="slide" onRequestClose={() => setSettingsModal(false)}>
        <Pressable style={modal.overlay} onPress={() => setSettingsModal(false)}>
          <Pressable style={[modal.box, { backgroundColor: colors.card }]} onPress={() => {}}>
            <View style={[modal.handle, { backgroundColor: colors.border }]} />
            <Text style={[modal.title, { color: colors.text }]}>Limite de mensagens por lead</Text>
            <Text style={[modal.sub, { color: colors.mutedForeground }]}>JADE pausa automaticamente ao atingir o limite</Text>
            <View style={[modal.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={modal.sectionHeader}>
                <Feather name="message-circle" size={15} color={PINK} />
                <Text style={[modal.sectionTitle, { color: colors.text }]}>Máximo por lead</Text>
              </View>
              <LimitCounter value={draftLimit} onChange={setDraftLimit} min={5} max={50} />
              <Text style={[modal.hint, { color: colors.mutedForeground }]}>Entre 5 e 50 mensagens · atual: {draftLimit} msgs</Text>
            </View>
            <View style={[modal.toggle, { borderColor: colors.border }]}>
              <View style={{ flex: 1 }}>
                <Text style={[modal.toggleTitle, { color: colors.text }]}>Avisar ao atingir o limite</Text>
                <Text style={[modal.toggleSub, { color: colors.mutedForeground }]}>Notificação ao atingir o máximo</Text>
              </View>
              <Switch value={draftWarn} onValueChange={setDraftWarn} trackColor={{ false: colors.border, true: PINK + "60" }} thumbColor={draftWarn ? PINK : colors.mutedForeground} />
            </View>
            <View style={[modal.toggle, { borderColor: colors.border }]}>
              <View style={{ flex: 1 }}>
                <Text style={[modal.toggleTitle, { color: colors.text }]}>Pausar automaticamente</Text>
                <Text style={[modal.toggleSub, { color: colors.mutedForeground }]}>JADE aguarda autorização para continuar</Text>
              </View>
              <Switch value={draftAuto} onValueChange={setDraftAuto} trackColor={{ false: colors.border, true: PINK + "60" }} thumbColor={draftAuto ? PINK : colors.mutedForeground} />
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
const S = StyleSheet.create({
  root:           { flex: 1 },

  // Header
  header:         { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingBottom: 10, gap: 8 },
  backBtn:        { padding: 4 },
  title:          { fontSize: 20, fontFamily: "SpaceGrotesk_700Bold" },
  subtitle:       { fontSize: 11, fontFamily: "SpaceGrotesk_400Regular", marginTop: 1 },
  iconBtn:        { width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center" },
  statusPill:     { width: 28, height: 28, alignItems: "center", justifyContent: "center" },
  jadeDot:        { width: 8, height: 8, borderRadius: 4 },

  // Search
  searchBar:      { flexDirection: "row", alignItems: "center", gap: 10, marginHorizontal: 16, marginBottom: 6, borderRadius: 12, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 9 },
  searchInput:    { flex: 1, fontSize: 14, fontFamily: "SpaceGrotesk_400Regular" },

  // Filter tabs — underline style
  filterScroll:   { paddingHorizontal: 16, paddingBottom: 4, gap: 0 },
  filterTab:      { paddingHorizontal: 12, paddingVertical: 9, alignItems: "center" },
  filterText:     { fontSize: 13, fontFamily: "SpaceGrotesk_500Medium" },
  filterUnderline:{ height: 2, backgroundColor: PINK, borderRadius: 1, width: "80%", marginTop: 5 },

  // Conversation item — no left status bar
  item:           { flexDirection: "row", alignItems: "center", paddingLeft: 16, paddingRight: 16, paddingVertical: 13, borderBottomWidth: StyleSheet.hairlineWidth },
  avatarWrap:     { position: "relative", marginRight: 13 },
  avatar:         { width: 46, height: 46, borderRadius: 23, alignItems: "center", justifyContent: "center" },
  avatarText:     { color: "#fff", fontSize: 15, fontFamily: "SpaceGrotesk_700Bold" },
  onlineDot:      { position: "absolute", bottom: 1, right: 1, width: 10, height: 10, borderRadius: 5, backgroundColor: "#22CC88", borderWidth: 2 },

  itemBody:       { flex: 1, gap: 3 },
  itemRow:        { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  itemName:       { fontSize: 14, fontFamily: "SpaceGrotesk_600SemiBold", flex: 1, marginRight: 8 },
  itemTime:       { fontSize: 11, fontFamily: "SpaceGrotesk_400Regular" },
  itemMsg:        { fontSize: 12, marginRight: 8, lineHeight: 17 },

  bottomRow:      { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 2 },
  tagChip:        { paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6 },
  tagText:        { fontSize: 10, fontFamily: "SpaceGrotesk_500Medium" },

  badge:          { minWidth: 18, height: 18, borderRadius: 9, backgroundColor: PINK, alignItems: "center", justifyContent: "center", paddingHorizontal: 4 },
  badgeText:      { color: "#fff", fontSize: 10, fontFamily: "SpaceGrotesk_700Bold" },
  limitBadge:     { backgroundColor: "rgba(255,255,255,0.05)", borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  limitBadgeText: { color: "rgba(255,255,255,0.35)", fontSize: 10, fontFamily: "SpaceGrotesk_500Medium" },

  // Auth banner
  authBanner:     { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 16, paddingVertical: 9, borderBottomWidth: StyleSheet.hairlineWidth },
  authBannerText: { flex: 1, color: "rgba(255,255,255,0.38)", fontSize: 12, fontFamily: "SpaceGrotesk_400Regular" },
  authBtn:        { backgroundColor: "#FF008018", borderColor: "#FF008040", borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 },
  authBtnText:    { color: PINK, fontSize: 12, fontFamily: "SpaceGrotesk_600SemiBold" },

  // Empty state
  empty:          { alignItems: "center", justifyContent: "center", paddingTop: 80, gap: 10 },
  emptyTitle:     { fontSize: 15, fontFamily: "SpaceGrotesk_600SemiBold" },
  emptyText:      { fontSize: 13, fontFamily: "SpaceGrotesk_400Regular", textAlign: "center", paddingHorizontal: 32, lineHeight: 19 },
});

const modal = StyleSheet.create({
  overlay:      { flex: 1, backgroundColor: "rgba(0,0,0,0.65)", justifyContent: "flex-end" },
  box:          { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40, gap: 16 },
  handle:       { width: 36, height: 4, borderRadius: 2, alignSelf: "center", marginBottom: 8 },
  title:        { fontSize: 18, fontFamily: "SpaceGrotesk_700Bold" },
  sub:          { fontSize: 13, fontFamily: "SpaceGrotesk_400Regular", lineHeight: 19, marginTop: -8 },
  section:      { borderRadius: 14, borderWidth: 1, padding: 16, gap: 12 },
  sectionHeader:{ flexDirection: "row", alignItems: "center", gap: 8 },
  sectionTitle: { fontSize: 14, fontFamily: "SpaceGrotesk_600SemiBold" },
  hint:         { fontSize: 11, fontFamily: "SpaceGrotesk_400Regular", textAlign: "center" },
  toggle:       { flexDirection: "row", alignItems: "center", gap: 12, borderTopWidth: StyleSheet.hairlineWidth, paddingTop: 14 },
  toggleTitle:  { fontSize: 14, fontFamily: "SpaceGrotesk_600SemiBold" },
  toggleSub:    { fontSize: 12, fontFamily: "SpaceGrotesk_400Regular", marginTop: 2, lineHeight: 16 },
  saveBtn:      { backgroundColor: PINK, borderRadius: 14, paddingVertical: 15, alignItems: "center", marginTop: 4 },
  saveBtnText:  { color: "#fff", fontSize: 16, fontFamily: "SpaceGrotesk_700Bold" },
});

const lc = StyleSheet.create({
  row:     { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 16 },
  btn:     { width: 40, height: 40, borderRadius: 12, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  display: { flexDirection: "row", alignItems: "baseline", gap: 4, borderRadius: 12, borderWidth: 1.5, paddingHorizontal: 20, paddingVertical: 10 },
  val:     { fontSize: 28, fontFamily: "SpaceGrotesk_700Bold" },
  unit:    { fontSize: 12, fontFamily: "SpaceGrotesk_500Medium" },
});
