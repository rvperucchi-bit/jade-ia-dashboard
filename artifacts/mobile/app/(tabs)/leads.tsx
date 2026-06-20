import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Platform,
} from "react-native";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";

import { useColors } from "@/hooks/useColors";
import { useApp, Lead, LeadColumn } from "@/context/AppContext";

const COLUMNS: { key: LeadColumn; label: string; color: string }[] = [
  { key: "novo", label: "Novo", color: "#6C63FF" },
  { key: "qualificado", label: "Qualificado", color: "#FFB300" },
  { key: "proposta", label: "Proposta", color: "#FF0080" },
  { key: "fechado", label: "Fechado", color: "#00D68F" },
];

function formatValue(v: number) {
  return `R$ ${v.toLocaleString("pt-BR")}`;
}

function LeadCard({
  lead,
  onPress,
}: {
  lead: Lead;
  onPress: () => void;
}) {
  const colors = useColors();
  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.cardHeader}>
        <View style={[styles.avatar, { backgroundColor: lead.avatarColor }]}>
          <Text style={styles.avatarText}>{lead.initials}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.cardName, { color: colors.text }]} numberOfLines={1}>
            {lead.name}
          </Text>
          <Text style={[styles.cardCompany, { color: colors.mutedForeground }]} numberOfLines={1}>
            {lead.company}
          </Text>
        </View>
      </View>
      <View style={styles.cardFooter}>
        <Text style={[styles.cardValue, { color: colors.primary }]}>
          {formatValue(lead.value)}
        </Text>
        <View style={[styles.tag, { backgroundColor: lead.tagColor + "22" }]}>
          <Text style={[styles.tagText, { color: lead.tagColor }]}>{lead.tag}</Text>
        </View>
      </View>
      <Text style={[styles.cardTime, { color: colors.mutedForeground }]}>{lead.time}</Text>
    </TouchableOpacity>
  );
}

function MoveModal({
  lead,
  visible,
  onClose,
  onMove,
}: {
  lead: Lead | null;
  visible: boolean;
  onClose: () => void;
  onMove: (col: LeadColumn) => void;
}) {
  const colors = useColors();
  if (!lead) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
        <View style={[styles.modal, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.modalTitle, { color: colors.text }]}>Mover Lead</Text>
          <Text style={[styles.modalSub, { color: colors.mutedForeground }]}>{lead.name}</Text>
          <View style={styles.modalDivider} />
          {COLUMNS.map((col) => (
            <TouchableOpacity
              key={col.key}
              style={[
                styles.modalOption,
                lead.column === col.key && { backgroundColor: col.color + "22" },
              ]}
              onPress={() => onMove(col.key)}
            >
              <View style={[styles.colDot, { backgroundColor: col.color }]} />
              <Text
                style={[
                  styles.modalOptionText,
                  { color: lead.column === col.key ? col.color : colors.text },
                ]}
              >
                {col.label}
              </Text>
              {lead.column === col.key && (
                <Feather name="check" size={16} color={col.color} />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

export default function LeadsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { leads, moveLead } = useApp();
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 84 : insets.bottom + 60;

  const openModal = (lead: Lead) => {
    setSelectedLead(lead);
    setModalVisible(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleMove = (col: LeadColumn) => {
    if (selectedLead) {
      moveLead(selectedLead.id, col);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    setModalVisible(false);
    setSelectedLead(null);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 16 }]}>
        <View>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Leads</Text>
          <Text style={[styles.headerSub, { color: colors.mutedForeground }]}>
            {leads.length} leads no pipeline
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.addBtn, { backgroundColor: colors.primary }]}
          activeOpacity={0.8}
        >
          <Feather name="plus" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[styles.kanban, { paddingBottom: bottomPad }]}
      >
        {COLUMNS.map((col) => {
          const colLeads = leads.filter((l) => l.column === col.key);
          return (
            <View key={col.key} style={[styles.column, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.colHeader}>
                <View style={[styles.colDot, { backgroundColor: col.color }]} />
                <Text style={[styles.colTitle, { color: colors.text }]}>{col.label}</Text>
                <View style={[styles.colBadge, { backgroundColor: col.color + "33" }]}>
                  <Text style={[styles.colBadgeText, { color: col.color }]}>{colLeads.length}</Text>
                </View>
              </View>
              <ScrollView showsVerticalScrollIndicator={false} nestedScrollEnabled>
                {colLeads.map((lead) => (
                  <LeadCard key={lead.id} lead={lead} onPress={() => openModal(lead)} />
                ))}
                {colLeads.length === 0 && (
                  <View style={styles.emptyCol}>
                    <MaterialCommunityIcons name="inbox-outline" size={28} color={colors.mutedForeground} />
                    <Text style={[styles.emptyColText, { color: colors.mutedForeground }]}>Vazio</Text>
                  </View>
                )}
              </ScrollView>
            </View>
          );
        })}
      </ScrollView>

      <MoveModal
        lead={selectedLead}
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onMove={handleMove}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  headerTitle: { fontSize: 26, fontFamily: "SpaceGrotesk_700Bold" },
  headerSub: { fontSize: 13, fontFamily: "SpaceGrotesk_400Regular", marginTop: 2 },
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  kanban: { paddingHorizontal: 16, gap: 12, paddingTop: 4 },
  column: {
    width: 240,
    borderRadius: 16,
    borderWidth: 1,
    padding: 12,
    maxHeight: 520,
  },
  colHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 },
  colDot: { width: 8, height: 8, borderRadius: 4 },
  colTitle: { flex: 1, fontSize: 14, fontFamily: "SpaceGrotesk_600SemiBold" },
  colBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  colBadgeText: { fontSize: 12, fontFamily: "SpaceGrotesk_600SemiBold" },
  card: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    marginBottom: 8,
  },
  cardHeader: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 10 },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: "#fff", fontSize: 13, fontFamily: "SpaceGrotesk_700Bold" },
  cardName: { fontSize: 13, fontFamily: "SpaceGrotesk_600SemiBold" },
  cardCompany: { fontSize: 12, fontFamily: "SpaceGrotesk_400Regular", marginTop: 1 },
  cardFooter: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  cardValue: { fontSize: 14, fontFamily: "SpaceGrotesk_700Bold" },
  tag: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  tagText: { fontSize: 10, fontFamily: "SpaceGrotesk_600SemiBold" },
  cardTime: { fontSize: 11, fontFamily: "SpaceGrotesk_400Regular", marginTop: 8 },
  emptyCol: { alignItems: "center", paddingVertical: 30, gap: 8 },
  emptyColText: { fontSize: 13, fontFamily: "SpaceGrotesk_400Regular" },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  modal: {
    width: "100%",
    maxWidth: 360,
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
  },
  modalTitle: { fontSize: 17, fontFamily: "SpaceGrotesk_700Bold", marginBottom: 4 },
  modalSub: { fontSize: 13, fontFamily: "SpaceGrotesk_400Regular" },
  modalDivider: { height: 1, backgroundColor: "#252535", marginVertical: 16 },
  modalOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginBottom: 4,
  },
  modalOptionText: { flex: 1, fontSize: 15, fontFamily: "SpaceGrotesk_500Medium" },
});
