import React, { useState } from "react";
import {
  FlatList,
  Modal,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Linking from "expo-linking";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";

// ─── Mock data ────────────────────────────────────────────────────────────────
type Lead = {
  id: string;
  name: string;
  company: string;
  value: string;
  stage: string;
  daysIdle: number;
  phone: string;
};

const INITIAL_LEADS: Lead[] = [
  { id: "1", name: "Alex Silva",     company: "TechNova Solutions",  value: "R$ 15.400", stage: "Prospecção", daysIdle: 2, phone: "5511999999999" },
  { id: "2", name: "Beatriz Costa",  company: "Acme Corp",           value: "R$ 42.000", stage: "Prospecção", daysIdle: 5, phone: "5511988888888" },
  { id: "3", name: "Carlos Eduardo", company: "Vortex Media",        value: "R$ 8.900",  stage: "Contato",    daysIdle: 1, phone: "5511977777777" },
  { id: "4", name: "Diana Prince",   company: "Wayne Enterprises",   value: "R$ 120.000",stage: "Proposta",   daysIdle: 3, phone: "5511966666666" },
  { id: "5", name: "Felipe Ramos",   company: "Stark Labs",          value: "R$ 65.500", stage: "Fechados",   daysIdle: 0, phone: "5511955555555" },
];

const PIPELINE_STAGES = ["Prospecção", "Contato", "Proposta", "Fechados"];

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function PreviewPipelineScreen() {
  const router = useRouter();
  const [currentStage, setCurrentStage] = useState("Prospecção");
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  const filteredLeads = INITIAL_LEADS.filter((l) => l.stage === currentStage);

  const totalValue = filteredLeads
    .reduce((acc, lead) => {
      const n = parseFloat(lead.value.replace("R$ ", "").replace(".", "").replace(",", "."));
      return acc + n;
    }, 0)
    .toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  const handleWhatsApp = (phone: string) => Linking.openURL(`whatsapp://send?phone=${phone}`);
  const handleCall    = (phone: string) => Linking.openURL(`tel:${phone}`);

  const renderCard = ({ item }: { item: Lead }) => (
    <TouchableOpacity
      activeOpacity={0.7}
      style={S.card}
      onPress={() => setSelectedLead(item)}
    >
      <View style={S.cardHeader}>
        <Text style={S.clientName}>{item.name}</Text>
        <View style={S.badge}>
          <Text style={S.badgeText}>{item.daysIdle}d ativo</Text>
        </View>
      </View>
      <Text style={S.companyName}>{item.company}</Text>
      <View style={S.cardFooter}>
        <Text style={S.dealValue}>{item.value}</Text>
        <View style={[S.priorityDot, { backgroundColor: currentStage === "Fechados" ? "#38A169" : "#00E5FF" }]} />
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={S.container} edges={["top", "bottom"]}>
      <StatusBar barStyle="light-content" backgroundColor="#090A0F" />

      {/* Back button */}
      <TouchableOpacity style={S.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
        <Feather name="chevron-left" size={22} color="#fff" />
      </TouchableOpacity>

      {/* Header */}
      <View style={S.header}>
        <View>
          <Text style={S.greeting}>Pipeline Geral</Text>
          <Text style={S.stageTotal}>{totalValue}</Text>
        </View>
        <View style={S.avatar}>
          <Text style={S.avatarText}>CR</Text>
        </View>
      </View>

      {/* Stage tabs */}
      <View style={S.tabsWrapper}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={S.tabsScroll}>
          {PIPELINE_STAGES.map((stage) => {
            const isActive = currentStage === stage;
            const count = INITIAL_LEADS.filter((l) => l.stage === stage).length;
            return (
              <TouchableOpacity
                key={stage}
                activeOpacity={0.8}
                onPress={() => setCurrentStage(stage)}
                style={[S.tabButton, isActive && S.activeTabButton]}
              >
                <Text style={[S.tabText, isActive && S.activeTabText]}>
                  {stage} <Text style={S.tabCount}>({count})</Text>
                </Text>
                {isActive && <View style={S.tabIndicator} />}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Lead list */}
      <FlatList
        data={filteredLeads}
        keyExtractor={(item) => item.id}
        renderItem={renderCard}
        contentContainerStyle={S.listContent}
        ListEmptyComponent={
          <View style={S.emptyContainer}>
            <Text style={S.emptyText}>Nenhum lead nesta etapa</Text>
          </View>
        }
      />

      {/* Bottom sheet modal */}
      <Modal
        visible={selectedLead !== null}
        animationType="slide"
        transparent
        onRequestClose={() => setSelectedLead(null)}
      >
        <TouchableOpacity style={S.modalOverlay} activeOpacity={1} onPress={() => setSelectedLead(null)}>
          <View style={S.bottomSheet} onStartShouldSetResponder={() => true}>
            <View style={S.dragIndicator} />
            {selectedLead && (
              <>
                <Text style={S.modalCompanyName}>{selectedLead.company}</Text>
                <Text style={S.modalClientName}>{selectedLead.name}</Text>
                <Text style={S.modalValue}>{selectedLead.value}</Text>
                <View style={S.modalStageBadge}>
                  <Text style={S.modalStageText}>Etapa atual: {selectedLead.stage}</Text>
                </View>
                <View style={S.actionRow}>
                  <TouchableOpacity style={S.actionButton} onPress={() => handleWhatsApp(selectedLead.phone)}>
                    <Text style={S.actionButtonText}>WhatsApp</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[S.actionButton, S.actionButtonSecondary]} onPress={() => handleCall(selectedLead.phone)}>
                    <Text style={S.actionButtonTextSecondary}>Ligar</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

// ─── Styles (mantidos fiéis ao original) ─────────────────────────────────────
const S = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#090A0F" },

  backBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: "rgba(255,255,255,0.08)", borderWidth: 1, borderColor: "rgba(255,255,255,0.12)", alignItems: "center", justifyContent: "center", marginHorizontal: 16, marginTop: 8, marginBottom: 4 },
  backLabel: { color: "#8F94A8", fontSize: 15, marginLeft: 2 },

  header: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingHorizontal: 20, paddingTop: 12, paddingBottom: 15,
  },
  greeting: { fontSize: 14, color: "#8F94A8", fontWeight: "500", letterSpacing: 0.5, textTransform: "uppercase" },
  stageTotal: { fontSize: 28, fontWeight: "700", color: "#FFFFFF", letterSpacing: -0.5, marginTop: 4 },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#161822", borderWidth: 1, borderColor: "#242736", alignItems: "center", justifyContent: "center" },
  avatarText: { color: "#00E5FF", fontWeight: "600", fontSize: 14 },

  tabsWrapper: { borderBottomWidth: 1, borderColor: "#161822" },
  tabsScroll: { paddingHorizontal: 20, paddingBottom: 12 },
  tabButton: { marginRight: 24, paddingBottom: 6, position: "relative" },
  activeTabButton: {},
  tabText: { fontSize: 15, fontWeight: "500", color: "#4E5366" },
  activeTabText: { color: "#FFFFFF", fontWeight: "700" },
  tabCount: { fontSize: 12, fontWeight: "400", opacity: 0.6 },
  tabIndicator: { position: "absolute", bottom: -13, left: 0, right: 0, height: 2, backgroundColor: "#00E5FF", borderRadius: 1 },

  listContent: { padding: 20 },
  card: { backgroundColor: "#161822", borderRadius: 16, padding: 18, marginBottom: 14, borderWidth: 1, borderColor: "#242736" },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 },
  clientName: { fontSize: 16, fontWeight: "600", color: "#FFFFFF", letterSpacing: -0.3 },
  companyName: { fontSize: 13, color: "#8F94A8", marginBottom: 16 },
  badge: { backgroundColor: "rgba(255,255,255,0.04)", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  badgeText: { fontSize: 11, color: "#8F94A8", fontWeight: "500" },
  cardFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  dealValue: { fontSize: 18, fontWeight: "700", color: "#FFFFFF", letterSpacing: -0.5 },
  priorityDot: { width: 8, height: 8, borderRadius: 4 },

  emptyContainer: { alignItems: "center", justifyContent: "center", paddingVertical: 60 },
  emptyText: { color: "#4E5366", fontSize: 14 },

  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "flex-end" },
  bottomSheet: { backgroundColor: "#11131A", borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 24, paddingTop: 12, paddingBottom: 40, borderTopWidth: 1, borderColor: "#242736" },
  dragIndicator: { width: 36, height: 4, backgroundColor: "#242736", borderRadius: 2, alignSelf: "center", marginBottom: 24 },

  modalCompanyName: { fontSize: 13, color: "#00E5FF", fontWeight: "600", textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 },
  modalClientName: { fontSize: 24, fontWeight: "700", color: "#FFFFFF", letterSpacing: -0.5 },
  modalValue: { fontSize: 32, fontWeight: "800", color: "#FFFFFF", marginTop: 12, letterSpacing: -1 },
  modalStageBadge: { alignSelf: "flex-start", backgroundColor: "rgba(255,255,255,0.05)", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, marginTop: 14, marginBottom: 32 },
  modalStageText: { color: "#8F94A8", fontSize: 13, fontWeight: "500" },

  actionRow: { flexDirection: "row", justifyContent: "space-between" },
  actionButton: { flex: 1, backgroundColor: "#FFFFFF", height: 52, borderRadius: 14, alignItems: "center", justifyContent: "center", marginRight: 12 },
  actionButtonText: { color: "#090A0F", fontWeight: "600", fontSize: 15 },
  actionButtonSecondary: { backgroundColor: "transparent", borderWidth: 1, borderColor: "#242736", marginRight: 0 },
  actionButtonTextSecondary: { color: "#FFFFFF", fontWeight: "600", fontSize: 15 },
});
