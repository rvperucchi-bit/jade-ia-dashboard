import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  FlatList,
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

const MOCK_CONTACTS: Contact[] = [
  { id: "1", name: "Carlos Mendes",    company: "Pizzaria Milano",     segment: "Alimentação",  status: "quente",      lastContact: "Hoje, 09:14",   score: 82, phone: "(11) 99999-0001" },
  { id: "2", name: "Fernanda Souza",   company: "Clínica OralVita",   segment: "Saúde",        status: "negociacao",  lastContact: "Hoje, 10:32",   score: 91, phone: "(11) 99999-0002" },
  { id: "3", name: "Roberto Lima",     company: "Academia FitMax",    segment: "Fitness",      status: "em_contato",  lastContact: "Ontem, 15:47",  score: 67, phone: "(11) 99999-0003" },
  { id: "4", name: "Ana Paula Costa",  company: "Salão BelaVida",     segment: "Beleza",       status: "novo",        lastContact: "2 dias atrás",  score: 54, phone: "(11) 99999-0004" },
  { id: "5", name: "Marcos Oliveira",  company: "Auto Peças Central", segment: "Automotivo",   status: "fechado",     lastContact: "3 dias atrás",  score: 95, phone: "(11) 99999-0005" },
  { id: "6", name: "Juliana Martins",  company: "StartUp Hub SC",     segment: "Tecnologia",   status: "em_contato",  lastContact: "4 dias atrás",  score: 73, phone: "(11) 99999-0006" },
  { id: "7", name: "Paulo Ferreira",   company: "Bar do Zé",          segment: "Alimentação",  status: "perdido",     lastContact: "1 semana",      score: 38, phone: "(11) 99999-0007" },
  { id: "8", name: "Larissa Nunes",    company: "Adv. Nunes & Silva", segment: "Jurídico",     status: "quente",      lastContact: "Hoje, 14:20",   score: 87, phone: "(11) 99999-0008" },
];

const FILTER_OPTIONS: { key: ContactStatus | "todos"; label: string }[] = [
  { key: "todos",       label: "Todos" },
  { key: "novo",        label: "Novos" },
  { key: "em_contato",  label: "Em contato" },
  { key: "quente",      label: "Quentes" },
  { key: "negociacao",  label: "Negociação" },
  { key: "fechado",     label: "Fechados" },
];

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

function ContactCard({ contact, onPress }: { contact: Contact; onPress: () => void }) {
  const colors = useColors();
  const cfg = STATUS_CONFIG[contact.status];
  return (
    <TouchableOpacity style={[CC.card, { backgroundColor: colors.surface, borderColor: colors.border }]} onPress={onPress} activeOpacity={0.75}>
      <View style={CC.row}>
        <View style={[CC.avatar, { backgroundColor: PINK + "22" }]}>
          <Text style={CC.avatarText}>{contact.name[0]}</Text>
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={[CC.name, { color: colors.text }]} numberOfLines={1}>{contact.name}</Text>
          <Text style={[CC.company, { color: colors.mutedForeground }]} numberOfLines={1}>{contact.company}</Text>
          <View style={CC.tagsRow}>
            <View style={[CC.segTag, { backgroundColor: PURPLE + "18" }]}>
              <Text style={[CC.segText, { color: PURPLE }]}>{contact.segment}</Text>
            </View>
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

  const topPad    = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 84 : insets.bottom + 60;

  const filtered = MOCK_CONTACTS.filter((c) => {
    const matchFilter = filter === "todos" || c.status === filter;
    const matchSearch = !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.company.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  return (
    <View style={[S.root, { backgroundColor: colors.background }]}>
      {/* Header */}
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

      {/* Search bar */}
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

      {/* Stats row */}
      <View style={S.statsRow}>
        {[
          { label: "Total", value: MOCK_CONTACTS.length, color: colors.text },
          { label: "Quentes", value: MOCK_CONTACTS.filter(c => c.status === "quente").length, color: "#FF8800" },
          { label: "Fechados", value: MOCK_CONTACTS.filter(c => c.status === "fechado").length, color: "#22CC88" },
        ].map((s) => (
          <View key={s.label} style={[S.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[S.statValue, { color: s.color }]}>{s.value}</Text>
            <Text style={[S.statLabel, { color: colors.mutedForeground }]}>{s.label}</Text>
          </View>
        ))}
      </View>

      {/* Filter tabs */}
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

      {/* Contact list */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingTop: 8, paddingBottom: bottomPad }}
        renderItem={({ item }) => (
          <ContactCard contact={item} onPress={() => {}} />
        )}
        ListEmptyComponent={
          <View style={S.empty}>
            <Feather name="users" size={40} color={colors.mutedForeground} />
            <Text style={[S.emptyText, { color: colors.mutedForeground }]}>Nenhum contato encontrado</Text>
          </View>
        }
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
  emptyText:   { fontSize: 14, fontFamily: "SpaceGrotesk_400Regular" },
});
