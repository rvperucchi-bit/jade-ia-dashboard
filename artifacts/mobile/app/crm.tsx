import AsyncStorage from "@react-native-async-storage/async-storage";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  FlatList,
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

const PINK = "#FF0080";
const PURPLE = "#8400FF";

function cleanSeg(seg: string): string {
  if (!seg || seg === "—") return seg;
  const t = seg.trim();
  if (t.length <= 22) return t;
  const words = t.split(/\s+/);
  let r = "";
  for (const w of words) {
    const next = r ? r + " " + w : w;
    if (next.length <= 20) r = next; else break;
  }
  return r || t.slice(0, 20);
}

export interface CrmLeadLocal {
  id: string;
  nome: string;
  empresa: string;
  telefone: string;
  endereco: string;
  segmento: string;
  status: string;
  pipeline: string;
  dataAbordagem: string;
  cidade: string;
}

type ContactStatus = "novo" | "em_contato" | "quente" | "negociacao" | "fechado" | "perdido";

interface Contact {
  id: string;
  name: string;
  company: string;
  segment: string;
  status: ContactStatus;
  lastContact: string;
  score: number;
  phone: string;
}

const STATUS_CONFIG: Record<ContactStatus, { label: string; color: string }> = {
  novo:        { label: "Novo",        color: "#5577FF" },
  em_contato:  { label: "Em contato",  color: PURPLE },
  quente:      { label: "Quente",      color: "#FF8800" },
  negociacao:  { label: "Negociação",  color: PINK },
  fechado:     { label: "Fechado",     color: "#22CC88" },
  perdido:     { label: "Perdido",     color: "#AA4444" },
};

const FILTER_OPTIONS: { key: ContactStatus | "todos"; label: string }[] = [
  { key: "todos",       label: "Todos" },
  { key: "novo",        label: "Novos" },
  { key: "em_contato",  label: "Em contato" },
  { key: "quente",      label: "Quentes" },
  { key: "negociacao",  label: "Negociação" },
  { key: "fechado",     label: "Fechados" },
];

function mapStatus(s: string): ContactStatus {
  switch (s) {
    case "Primeiro Contato": return "novo";
    case "Em andamento":     return "em_contato";
    case "Morno":            return "em_contato";
    case "Quente":           return "quente";
    case "Frio":             return "perdido";
    case "Fechado":
    case "Cliente":          return "fechado";
    case "Descartado":
    case "Inválido":
    case "Arquivado":        return "perdido";
    default:                 return "novo";
  }
}

function scoreFromStatus(s: string): number {
  switch (s) {
    case "Fechado":          return 95;
    case "Cliente":          return 92;
    case "Quente":           return 80;
    case "Em andamento":     return 62;
    case "Morno":            return 50;
    default:                 return 40;
  }
}

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    const now = new Date();
    const diff = Math.floor((now.getTime() - d.getTime()) / 1000);
    if (diff < 60)         return "agora";
    if (diff < 3600)       return `${Math.floor(diff / 60)} min atrás`;
    if (diff < 86400)      return `Hoje, ${d.getHours().toString().padStart(2,"0")}:${d.getMinutes().toString().padStart(2,"0")}`;
    if (diff < 172800)     return "Ontem";
    if (diff < 604800)     return `${Math.floor(diff / 86400)} dias atrás`;
    return d.toLocaleDateString("pt-BR");
  } catch { return "—"; }
}

function leadToContact(l: CrmLeadLocal): Contact {
  return {
    id: l.id,
    name: l.nome,
    company: l.empresa || l.nome,
    segment: l.segmento || "—",
    status: mapStatus(l.status),
    lastContact: formatDate(l.dataAbordagem),
    score: scoreFromStatus(l.status),
    phone: l.telefone,
  };
}

function ScoreBadge({ score }: { score: number }) {
  const color = score >= 80 ? "#22CC88" : score >= 60 ? "#FF8800" : "#AA4444";
  return (
    <View style={[SB.wrap, { backgroundColor: color + "22", borderColor: color + "44" }]}>
      <Text style={[SB.text, { color }]}>{score}</Text>
    </View>
  );
}
const SB = StyleSheet.create({
  wrap: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, borderWidth: 1 },
  text: { fontSize: 11, fontFamily: "SpaceGrotesk_700Bold" },
});

function ContactDetailModal({ contact, visible, onClose }: { contact: Contact | null; visible: boolean; onClose: () => void }) {
  const colors = useColors();
  const slideY = useRef(new Animated.Value(80)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(slideY,  { toValue: 0,  duration: 340, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1,  duration: 260, useNativeDriver: true }),
      ]).start();
    } else {
      slideY.setValue(80);
      opacity.setValue(0);
    }
  }, [visible]);

  if (!contact) return null;
  const cfg = STATUS_CONFIG[contact.status];
  const scoreColor = contact.score >= 80 ? "#22CC88" : contact.score >= 60 ? "#FF8800" : "#AA4444";

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.72)", justifyContent: "flex-end" }}>
        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onClose} />
        <Animated.View style={[DM.sheet, { backgroundColor: colors.background, opacity, transform: [{ translateY: slideY }] }]}>
          <View style={[DM.handle, { backgroundColor: colors.border }]} />

          {/* Header */}
          <View style={DM.header}>
            <View style={[DM.avatar, { backgroundColor: PINK + "22" }]}>
              <Text style={DM.avatarText}>{contact.name[0]?.toUpperCase() ?? "?"}</Text>
            </View>
            <View style={{ flex: 1, gap: 3 }}>
              <Text style={[DM.name, { color: colors.text }]}>{contact.name}</Text>
              {contact.company !== contact.name && (
                <Text style={[DM.company, { color: colors.mutedForeground }]}>{contact.company}</Text>
              )}
              <View style={{ flexDirection: "row", gap: 8, marginTop: 2 }}>
                <View style={[DM.statusPill, { backgroundColor: cfg.color + "22" }]}>
                  <Text style={[DM.statusText, { color: cfg.color }]}>{cfg.label}</Text>
                </View>
                <View style={[DM.statusPill, { backgroundColor: scoreColor + "22" }]}>
                  <Text style={[DM.statusText, { color: scoreColor }]}>Score {contact.score}</Text>
                </View>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 12, right: 12, bottom: 12, left: 12 }}>
              <Feather name="x" size={20} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>

          {/* Info pills */}
          <View style={DM.pills}>
            {contact.segment && contact.segment !== "—" && (
              <View style={[DM.pill, { backgroundColor: PURPLE + "18", borderColor: PURPLE + "33" }]}>
                <Feather name="tag" size={11} color={PURPLE} />
                <Text style={[DM.pillText, { color: PURPLE }]}>{contact.segment}</Text>
              </View>
            )}
            {contact.phone ? (
              <View style={[DM.pill, { backgroundColor: "rgba(255,255,255,0.06)", borderColor: colors.border }]}>
                <Feather name="phone" size={11} color={colors.mutedForeground} />
                <Text style={[DM.pillText, { color: colors.mutedForeground }]}>{contact.phone}</Text>
              </View>
            ) : null}
          </View>

          {/* Stats */}
          <View style={DM.statsRow}>
            {[
              { label: "Último Contato", value: contact.lastContact },
              { label: "Score",          value: `${contact.score}` },
              { label: "Status",         value: cfg.label },
            ].map((s, i) => (
              <View key={i} style={[DM.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Text style={[DM.statVal, { color: colors.text }]}>{s.value}</Text>
                <Text style={[DM.statLbl, { color: colors.mutedForeground }]}>{s.label}</Text>
              </View>
            ))}
          </View>

          {/* Actions */}
          <View style={[DM.actions, { borderTopColor: colors.border }]}>
            {contact.phone ? (
              <TouchableOpacity style={[DM.actionBtn, { backgroundColor: colors.surface, borderColor: colors.border }]} activeOpacity={0.8}>
                <Feather name="phone" size={16} color={colors.text} />
                <Text style={[DM.actionText, { color: colors.text }]}>Ligar</Text>
              </TouchableOpacity>
            ) : null}
            <TouchableOpacity style={[DM.actionBtnPrimary, { backgroundColor: PINK }]} activeOpacity={0.85} onPress={onClose}>
              <Feather name="message-circle" size={16} color="#fff" />
              <Text style={DM.actionTextPrimary}>WhatsApp</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const DM = StyleSheet.create({
  sheet:           { borderTopLeftRadius: 26, borderTopRightRadius: 26, maxHeight: "80%", paddingTop: 12 },
  handle:          { width: 40, height: 4, borderRadius: 2, alignSelf: "center", marginBottom: 16 },
  header:          { flexDirection: "row", alignItems: "flex-start", gap: 12, paddingHorizontal: 20, paddingBottom: 16 },
  avatar:          { width: 48, height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center" },
  avatarText:      { fontSize: 18, fontFamily: "SpaceGrotesk_700Bold", color: PINK },
  name:            { fontSize: 17, fontFamily: "SpaceGrotesk_700Bold" },
  company:         { fontSize: 13, fontFamily: "SpaceGrotesk_400Regular" },
  statusPill:      { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  statusText:      { fontSize: 11, fontFamily: "SpaceGrotesk_600SemiBold" },
  pills:           { flexDirection: "row", flexWrap: "wrap", gap: 8, paddingHorizontal: 20, paddingBottom: 16 },
  pill:            { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, borderWidth: 1 },
  pillText:        { fontSize: 12, fontFamily: "SpaceGrotesk_500Medium" },
  statsRow:        { flexDirection: "row", gap: 8, paddingHorizontal: 20, marginBottom: 16 },
  statCard:        { flex: 1, borderRadius: 12, borderWidth: 1, paddingVertical: 10, alignItems: "center" },
  statVal:         { fontSize: 14, fontFamily: "SpaceGrotesk_700Bold" },
  statLbl:         { fontSize: 10, fontFamily: "SpaceGrotesk_400Regular", marginTop: 2 },
  actions:         { flexDirection: "row", gap: 10, padding: 16, paddingBottom: 28, borderTopWidth: StyleSheet.hairlineWidth },
  actionBtn:       { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7, height: 48, borderRadius: 12, borderWidth: 1, paddingHorizontal: 20 },
  actionText:      { fontSize: 14, fontFamily: "SpaceGrotesk_600SemiBold" },
  actionBtnPrimary:{ flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7, height: 48, borderRadius: 12 },
  actionTextPrimary: { fontSize: 14, fontFamily: "SpaceGrotesk_700Bold", color: "#fff" },
});

function ContactCard({ contact, onPress }: { contact: Contact; onPress: () => void }) {
  const colors = useColors();
  const cfg = STATUS_CONFIG[contact.status];
  return (
    <TouchableOpacity style={[CC.card, { backgroundColor: colors.surface, borderColor: colors.border }]} onPress={onPress} activeOpacity={0.75}>
      <View style={CC.row}>
        <View style={[CC.avatar, { backgroundColor: PINK + "22" }]}>
          <Text style={CC.avatarText}>{contact.name[0]?.toUpperCase() ?? "?"}</Text>
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={[CC.name, { color: colors.text }]} numberOfLines={1}>{contact.name}</Text>
          {contact.company !== contact.name && (
            <Text style={[CC.company, { color: colors.mutedForeground }]} numberOfLines={1}>{contact.company}</Text>
          )}
          <View style={CC.tagsRow}>
            {cleanSeg(contact.segment) && cleanSeg(contact.segment) !== "—" && (
              <View style={[CC.segTag, { backgroundColor: PURPLE + "18" }]}>
                <Text style={[CC.segText, { color: PURPLE }]}>{cleanSeg(contact.segment)}</Text>
              </View>
            )}
            <View style={[CC.statusTag, { backgroundColor: cfg.color + "18" }]}>
              <Text style={[CC.statusText, { color: cfg.color }]}>{cfg.label}</Text>
            </View>
          </View>
        </View>
        <View style={{ alignItems: "flex-end", gap: 6 }}>
          <ScoreBadge score={contact.score} />
          <Text style={[CC.time, { color: colors.mutedForeground }]}>{contact.lastContact}</Text>
          <Feather name="chevron-right" size={14} color={colors.mutedForeground} />
        </View>
      </View>
    </TouchableOpacity>
  );
}
const CC = StyleSheet.create({
  card:       { marginHorizontal: 16, marginBottom: 8, borderRadius: 16, borderWidth: 1, padding: 14 },
  row:        { flexDirection: "row", alignItems: "center", gap: 12 },
  avatar:     { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  avatarText: { fontSize: 18, fontFamily: "SpaceGrotesk_700Bold", color: PINK },
  name:       { fontSize: 15, fontFamily: "SpaceGrotesk_600SemiBold" },
  company:    { fontSize: 12, fontFamily: "SpaceGrotesk_400Regular" },
  tagsRow:    { flexDirection: "row", gap: 6, marginTop: 2 },
  segTag:     { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  segText:    { fontSize: 10, fontFamily: "SpaceGrotesk_600SemiBold" },
  statusTag:  { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  statusText: { fontSize: 10, fontFamily: "SpaceGrotesk_600SemiBold" },
  time:       { fontSize: 10, fontFamily: "SpaceGrotesk_400Regular" },
});

export default function CRMScreen() {
  const colors  = useColors();
  const insets  = useSafeAreaInsets();
  const router  = useRouter();
  const [search, setSearch]   = useState("");
  const [filter, setFilter]   = useState<ContactStatus | "todos">("todos");
  const [showSearch, setShowSearch] = useState(false);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [detailVisible, setDetailVisible]     = useState(false);

  const topPad    = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 84 : insets.bottom + 60;

  useEffect(() => {
    AsyncStorage.getItem("crm_leads").then((raw) => {
      if (!raw) return;
      try {
        const leads = JSON.parse(raw) as CrmLeadLocal[];
        setContacts(leads.map(leadToContact));
      } catch {}
    });
  }, []);

  const filtered = contacts.filter((c) => {
    const matchFilter = filter === "todos" || c.status === filter;
    const matchSearch = !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.company.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  return (
    <View style={[S.root, { backgroundColor: colors.background }]}>
      <View style={[S.header, { paddingTop: topPad + 4 }]}>
        <TouchableOpacity onPress={() => router.back()} style={S.backBtn} activeOpacity={0.7}>
          <Feather name="arrow-left" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={[S.title, { color: colors.text }]}>CRM</Text>
        <View style={S.headerRight}>
          <TouchableOpacity onPress={() => setShowSearch(!showSearch)} style={S.iconBtn} activeOpacity={0.7}>
            <Feather name="search" size={20} color={showSearch ? PINK : colors.mutedForeground} />
          </TouchableOpacity>
          <TouchableOpacity style={[S.addBtn, { backgroundColor: PINK }]} activeOpacity={0.85}>
            <Feather name="plus" size={18} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {showSearch && (
        <View style={[S.searchWrap, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Feather name="search" size={16} color={colors.mutedForeground} />
          <TextInput
            style={[S.searchInput, { color: colors.text }]}
            placeholder="Buscar contato ou empresa..."
            placeholderTextColor={colors.mutedForeground}
            value={search}
            onChangeText={setSearch}
            autoFocus
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch("")}>
              <Feather name="x" size={16} color={colors.mutedForeground} />
            </TouchableOpacity>
          )}
        </View>
      )}

      <View style={{ paddingHorizontal: 16, marginBottom: 12, gap: 8 }}>
        <View style={{ flexDirection: "row", gap: 8 }}>
          {[
            { label: "Total",      value: contacts.length,                                           color: colors.text },
            { label: "Novos",      value: contacts.filter(c => c.status === "novo").length,          color: "#5577FF" },
            { label: "Em Contato", value: contacts.filter(c => c.status === "em_contato").length,   color: PURPLE },
          ].map((s) => (
            <View key={s.label} style={[S.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[S.statValue, { color: s.color }]}>{s.value}</Text>
              <Text style={[S.statLabel, { color: colors.mutedForeground }]}>{s.label}</Text>
            </View>
          ))}
        </View>
        <View style={{ flexDirection: "row", gap: 8 }}>
          {[
            { label: "Quentes",    value: contacts.filter(c => c.status === "quente").length,      color: "#FF8800" },
            { label: "Negociação", value: contacts.filter(c => c.status === "negociacao").length,  color: PINK },
            { label: "Fechados",   value: contacts.filter(c => c.status === "fechado").length,     color: "#22CC88" },
          ].map((s) => (
            <View key={s.label} style={[S.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[S.statValue, { color: s.color }]}>{s.value}</Text>
              <Text style={[S.statLabel, { color: colors.mutedForeground }]}>{s.label}</Text>
            </View>
          ))}
        </View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={S.filterScroll}>
        {FILTER_OPTIONS.map((f) => {
          const active = filter === f.key;
          return (
            <TouchableOpacity
              key={f.key}
              style={[S.filterTab, active && { backgroundColor: PINK + "22", borderColor: PINK + "55" }]}
              onPress={() => setFilter(f.key as ContactStatus | "todos")}
              activeOpacity={0.75}
            >
              <Text style={[S.filterText, { color: active ? PINK : colors.mutedForeground }]}>{f.label}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingTop: 8, paddingBottom: bottomPad }}
        renderItem={({ item }) => (
          <ContactCard contact={item} onPress={() => { setSelectedContact(item); setDetailVisible(true); }} />
        )}
        ListEmptyComponent={
          <View style={S.empty}>
            <Feather name="users" size={40} color={colors.mutedForeground} />
            <Text style={[S.emptyText, { color: colors.mutedForeground }]}>
              {contacts.length === 0 ? "Nenhum lead no CRM ainda. Peça para a JADE buscar leads." : "Nenhum contato encontrado"}
            </Text>
          </View>
        }
      />
      <ContactDetailModal
        contact={selectedContact}
        visible={detailVisible}
        onClose={() => setDetailVisible(false)}
      />
    </View>
  );
}

const S = StyleSheet.create({
  root:        { flex: 1 },
  header:      { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingBottom: 12, gap: 12 },
  backBtn:     { padding: 4 },
  title:       { fontSize: 22, fontFamily: "SpaceGrotesk_700Bold", flex: 1 },
  headerRight: { flexDirection: "row", alignItems: "center", gap: 10 },
  iconBtn:     { padding: 6 },
  addBtn:      { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  searchWrap:  { flexDirection: "row", alignItems: "center", marginHorizontal: 16, marginBottom: 8, borderRadius: 12, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 10, gap: 8 },
  searchInput: { flex: 1, fontSize: 14, fontFamily: "SpaceGrotesk_400Regular" },
  statsRow:    { flexDirection: "row", gap: 10, paddingHorizontal: 16, marginBottom: 12 },
  statCard:    { flex: 1, borderRadius: 12, borderWidth: 1, paddingVertical: 10, alignItems: "center" },
  statValue:   { fontSize: 20, fontFamily: "SpaceGrotesk_700Bold" },
  statLabel:   { fontSize: 11, fontFamily: "SpaceGrotesk_400Regular" },
  filterScroll:{ paddingHorizontal: 16, paddingBottom: 12, gap: 8 },
  filterTab:   { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: "transparent" },
  filterText:  { fontSize: 13, fontFamily: "SpaceGrotesk_500Medium" },
  empty:       { alignItems: "center", gap: 12, paddingTop: 60 },
  emptyText:   { fontSize: 14, fontFamily: "SpaceGrotesk_400Regular", textAlign: "center", paddingHorizontal: 32 },
});
