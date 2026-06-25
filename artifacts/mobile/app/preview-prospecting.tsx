import React, { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";

// ─── Mock data ────────────────────────────────────────────────────────────────
type AiLead = { id: string; name: string; segment: string; address: string; status: string };
type HistoryItem = { id: string; query: string; location: string; date: string; leadsCount: number };

const AI_FOUND_LEADS: AiLead[] = [
  { id: "1", name: "Oficina Mecânica Silva", segment: "Mecânica",    address: "Centro, Criciúma",    status: "Extraído" },
  { id: "2", name: "Padaria Pão Quente",     segment: "Panificadora",address: "Próspera, Criciúma",  status: "Extraído" },
  { id: "3", name: "Clínica Sorriso Clean",  segment: "Odontologia", address: "Michel, Criciúma",    status: "Extraído" },
];

const SEARCH_HISTORY: HistoryItem[] = [
  { id: "h1", query: "Restaurantes",     location: "Centro, Criciúma",     date: "Hoje, 14:30",   leadsCount: 42 },
  { id: "h2", query: "Salões de Beleza", location: "Pio Correa, Criciúma", date: "Ontem, 09:15",  leadsCount: 18 },
  { id: "h3", query: "Academias",        location: "Grande Próspera",       date: "22 Jun, 11:00", leadsCount: 29 },
];

const TABS = ["Busca Manual", "Agente IA", "Histórico"] as const;
type Tab = (typeof TABS)[number];

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function PreviewProspectingScreen() {
  const router = useRouter();
  const [activeTab,    setActiveTab]    = useState<Tab>("Busca Manual");
  const [segment,      setSegment]      = useState("");
  const [city,         setCity]         = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [isScanning,   setIsScanning]   = useState(false);

  const handleStartScan = () => {
    if (!segment || !city) return;
    setIsScanning(true);
    setTimeout(() => { setIsScanning(false); setActiveTab("Agente IA"); }, 3000);
  };

  const renderAiCard = ({ item }: { item: AiLead }) => (
    <View style={S.card}>
      <View style={S.cardHeader}>
        <Text style={S.clientName}>{item.name}</Text>
        <View style={S.aiBadge}>
          <Text style={S.aiBadgeText}>🤖 Maps IA</Text>
        </View>
      </View>
      <Text style={S.cardSub}>{item.segment} • {item.address}</Text>
      <View style={S.cardFooter}>
        <Text style={S.statusText}>Pronto para exportar</Text>
        <TouchableOpacity style={S.miniButton} activeOpacity={0.8}>
          <Text style={S.miniButtonText}>+ Enviar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderHistoryCard = ({ item }: { item: HistoryItem }) => (
    <View style={S.card}>
      <View style={S.cardHeader}>
        <Text style={S.clientName}>{item.query}</Text>
        <Text style={S.dateText}>{item.date}</Text>
      </View>
      <Text style={S.cardSub}>{item.location}</Text>
      <View style={S.historyFooter}>
        <Text style={S.historyCount}>📈 {item.leadsCount} leads gerados</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={S.container} edges={["top", "bottom"]}>
      {/* Back */}
      <TouchableOpacity style={S.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
        <Feather name="chevron-left" size={26} color="#fff" />
        <Text style={S.backLabel}>Voltar</Text>
      </TouchableOpacity>

      {/* Header */}
      <View style={S.header}>
        <Text style={S.greeting}>Prospecção Automatizada</Text>
        <Text style={S.title}>Captura Instantânea</Text>
      </View>

      {/* Tabs */}
      <View style={S.tabsWrapper}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={S.tabsScroll}>
          {TABS.map((tab) => {
            const isActive = activeTab === tab;
            return (
              <TouchableOpacity
                key={tab}
                activeOpacity={0.8}
                onPress={() => setActiveTab(tab)}
                style={S.tabButton}
              >
                <Text style={[S.tabText, isActive && S.activeTabText]}>{tab}</Text>
                {isActive && <View style={S.tabIndicator} />}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Tab: Busca Manual */}
      {activeTab === "Busca Manual" && (
        <ScrollView style={S.formContainer} keyboardShouldPersistTaps="handled">
          <Text style={S.sectionTitle}>Segmentação do Alvo</Text>

          <Text style={S.label}>O QUE VOCÊ BUSCA? (SEGMENTO)</Text>
          <TextInput
            style={S.input}
            placeholder="Ex: Clínicas, Auto peças"
            placeholderTextColor="#4E5366"
            value={segment}
            onChangeText={setSegment}
          />

          <Text style={S.label}>CIDADE</Text>
          <TextInput
            style={S.input}
            placeholder="Ex: São Paulo, Criciúma"
            placeholderTextColor="#4E5366"
            value={city}
            onChangeText={setCity}
          />

          <Text style={S.label}>BAIRRO (OPCIONAL)</Text>
          <TextInput
            style={S.input}
            placeholder="Ex: Centro, Pinheirinho"
            placeholderTextColor="#4E5366"
            value={neighborhood}
            onChangeText={setNeighborhood}
          />

          <TouchableOpacity
            style={[S.primaryButton, (!segment || !city) && S.disabledButton]}
            activeOpacity={0.8}
            onPress={handleStartScan}
            disabled={isScanning || !segment || !city}
          >
            {isScanning
              ? <ActivityIndicator color="#090A0F" />
              : <Text style={S.primaryButtonText}>Ligar Agente Google Maps 🤖</Text>
            }
          </TouchableOpacity>

          <Text style={S.helperText}>
            O robô vai simular cliques reais no mapa para extrair telefones válidos.
          </Text>
        </ScrollView>
      )}

      {/* Tab: Agente IA */}
      {activeTab === "Agente IA" && (
        <FlatList
          data={AI_FOUND_LEADS}
          keyExtractor={(item) => item.id}
          renderItem={renderAiCard}
          contentContainerStyle={S.listContent}
          ListEmptyComponent={
            <View style={S.emptyContainer}>
              <Text style={S.emptyText}>Ative o robô na busca manual primeiro</Text>
            </View>
          }
        />
      )}

      {/* Tab: Histórico */}
      {activeTab === "Histórico" && (
        <FlatList
          data={SEARCH_HISTORY}
          keyExtractor={(item) => item.id}
          renderItem={renderHistoryCard}
          contentContainerStyle={S.listContent}
        />
      )}
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const S = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#090A0F" },

  backBtn: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingTop: 8, paddingBottom: 4 },
  backLabel: { color: "#8F94A8", fontSize: 15, marginLeft: 2 },

  header: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 15 },
  greeting: { fontSize: 14, color: "#8F94A8", fontWeight: "500", letterSpacing: 0.5, textTransform: "uppercase" },
  title: { fontSize: 28, fontWeight: "700", color: "#FFFFFF", letterSpacing: -0.5, marginTop: 4 },

  tabsWrapper: { borderBottomWidth: 1, borderColor: "#161822" },
  tabsScroll: { paddingHorizontal: 20, paddingBottom: 12 },
  tabButton: { marginRight: 28, paddingBottom: 6, position: "relative" },
  tabText: { fontSize: 15, fontWeight: "500", color: "#4E5366" },
  activeTabText: { color: "#FFFFFF", fontWeight: "700" },
  tabIndicator: { position: "absolute", bottom: -13, left: 0, right: 0, height: 2, backgroundColor: "#00E5FF", borderRadius: 1 },

  formContainer: { padding: 20 },
  sectionTitle: { fontSize: 18, fontWeight: "600", color: "#FFFFFF", marginBottom: 20 },
  label: { fontSize: 11, color: "#8F94A8", fontWeight: "600", letterSpacing: 0.8, marginBottom: 8 },
  input: { backgroundColor: "#161822", height: 54, borderRadius: 12, paddingHorizontal: 16, color: "#FFFFFF", fontSize: 15, borderWidth: 1, borderColor: "#242736", marginBottom: 20 },
  primaryButton: { backgroundColor: "#FFFFFF", height: 56, borderRadius: 14, alignItems: "center", justifyContent: "center", marginTop: 10 },
  disabledButton: { backgroundColor: "#161822", borderWidth: 1, borderColor: "#242736", opacity: 0.5 },
  primaryButtonText: { color: "#090A0F", fontWeight: "700", fontSize: 16 },
  helperText: { color: "#4E5366", fontSize: 12, textAlign: "center", marginTop: 16, lineHeight: 18 },

  listContent: { padding: 20 },
  card: { backgroundColor: "#161822", borderRadius: 16, padding: 18, marginBottom: 14, borderWidth: 1, borderColor: "#242736" },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 },
  clientName: { fontSize: 16, fontWeight: "600", color: "#FFFFFF", flex: 1, marginRight: 8 },
  cardSub: { fontSize: 13, color: "#8F94A8", marginBottom: 16 },
  aiBadge: { backgroundColor: "rgba(0,229,255,0.1)", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  aiBadgeText: { fontSize: 11, color: "#00E5FF", fontWeight: "600" },
  dateText: { fontSize: 12, color: "#4E5366" },
  cardFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderTopWidth: 1, borderColor: "#242736", paddingTop: 12 },
  statusText: { fontSize: 12, color: "#8F94A8" },
  miniButton: { backgroundColor: "rgba(255,255,255,0.05)", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: "#242736" },
  miniButtonText: { color: "#FFFFFF", fontSize: 12, fontWeight: "600" },
  historyFooter: { borderTopWidth: 1, borderColor: "#242736", paddingTop: 12 },
  historyCount: { fontSize: 13, color: "#00E5FF", fontWeight: "600" },
  emptyContainer: { alignItems: "center", justifyContent: "center", paddingVertical: 80 },
  emptyText: { color: "#4E5366", fontSize: 14 },
});
