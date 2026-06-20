import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
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

const ENTERPRISE_PURPLE = "#8400FF";

const API_BASE =
  Platform.OS === "web"
    ? ""
    : `https://${process.env.EXPO_PUBLIC_DOMAIN ?? ""}`;

type ClienteStatus = "em_dia" | "atencao" | "em_risco" | "inativo";
type ClienteTipo = "farmer" | "hunter";

interface Cliente {
  id: string;
  empresa: string;
  contato: string;
  responsavel: string;
  diasSemContato: number;
  tipo: ClienteTipo;
  status: ClienteStatus;
  ultimaInteracao: string;
  observacao?: string;
}

const SEED: Cliente[] = [
  { id: "c1", empresa: "TechBrasil LTDA", contato: "Carlos Mendes", responsavel: "Ana Paula", diasSemContato: 5, tipo: "farmer", status: "em_dia", ultimaInteracao: "16/06/2026" },
  { id: "c2", empresa: "Inova Digital", contato: "Fernanda Souza", responsavel: "Carlos Rocha", diasSemContato: 18, tipo: "farmer", status: "atencao", ultimaInteracao: "02/06/2026" },
  { id: "c3", empresa: "LogiMax", contato: "Roberto Lima", responsavel: "Mariana Lima", diasSemContato: 35, tipo: "farmer", status: "em_risco", ultimaInteracao: "16/05/2026" },
  { id: "c4", empresa: "StartUp Hub", contato: "Juliana Ferreira", responsavel: "Diego Nunes", diasSemContato: 4, tipo: "hunter", status: "em_dia", ultimaInteracao: "17/06/2026" },
  { id: "c5", empresa: "FinTec Capital", contato: "Pedro Rocha", responsavel: "Ana Paula", diasSemContato: 22, tipo: "hunter", status: "atencao", ultimaInteracao: "29/05/2026" },
  { id: "c6", empresa: "Comercial Norte", contato: "Diego Alves", responsavel: "Carlos Rocha", diasSemContato: 65, tipo: "farmer", status: "inativo", ultimaInteracao: "17/04/2026" },
  { id: "c7", empresa: "EduTech Plus", contato: "Beatriz Santos", responsavel: "Mariana Lima", diasSemContato: 42, tipo: "farmer", status: "em_risco", ultimaInteracao: "09/05/2026" },
];

const STATUS_TABS: { key: ClienteStatus; label: string; color: string }[] = [
  { key: "em_dia",   label: "Em dia",   color: "#00D68F" },
  { key: "atencao",  label: "Atenção",  color: "#FFB300" },
  { key: "em_risco", label: "Em risco", color: "#FF3B5C" },
  { key: "inativo",  label: "Inativos", color: "#555577" },
];

function diasColor(d: number) {
  if (d < 15) return "#00D68F";
  if (d < 30) return "#FFB300";
  return "#FF3B5C";
}

export default function CarteiraScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const [tab, setTab] = useState<ClienteStatus>("em_dia");
  const [clientes, setClientes] = useState<Cliente[]>(SEED);
  const [visitaModal, setVisitaModal] = useState<Cliente | null>(null);
  const [visitaObs, setVisitaObs] = useState("");
  const [analise, setAnalise] = useState("");
  const [loadingAnalise, setLoadingAnalise] = useState(false);

  const filtered = clientes.filter((c) => c.status === tab);
  const emRisco = clientes.filter((c) => c.status === "em_risco").length;
  const semVisita30 = clientes.filter((c) => c.diasSemContato > 30).length;

  const registrarVisita = (cliente: Cliente) => {
    const updated = clientes.map((c) =>
      c.id === cliente.id
        ? { ...c, diasSemContato: 0, ultimaInteracao: new Date().toLocaleDateString("pt-BR"), status: "em_dia" as ClienteStatus, observacao: visitaObs }
        : c
    );
    setClientes(updated);
    setVisitaModal(null);
    setVisitaObs("");
    Alert.alert("✅ Visita registrada!", "Contador zerado. A JADE vai sugerir a próxima pauta em breve.");
  };

  const analisarCarteira = async () => {
    setLoadingAnalise(true);
    setAnalise("");
    try {
      const resumo = clientes.map(
        (c) => `${c.empresa} (${c.tipo}, ${c.diasSemContato} dias sem contato, status: ${c.status})`
      ).join("; ");
      const res = await fetch(`${API_BASE}/api/jade/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{
            role: "user",
            content: `Sou gestor comercial. Minha carteira: ${resumo}. Analise: 1) Clientes com maior potencial de upsell, 2) Clientes em risco de perda e ações imediatas, 3) Prioridade de contato desta semana, 4) Recomendações de relacionamento farmer/hunter. Seja prático e específico.`,
          }],
        }),
      });
      const data = await res.json();
      setAnalise(data.message?.trim() || "Não foi possível gerar a análise. Tente novamente.");
    } catch {
      setAnalise("Erro de conexão. Tente novamente.");
    } finally {
      setLoadingAnalise(false);
    }
  };

  return (
    <View style={[S.root, { backgroundColor: colors.background }]}>
      <View style={[S.header, { paddingTop: topPad, borderBottomColor: colors.border }]}>
        <TouchableOpacity style={[S.backBtn, { backgroundColor: colors.surface }]} onPress={() => router.back()} activeOpacity={0.8}>
          <Feather name="arrow-left" size={20} color={colors.text} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={[S.title, { color: colors.text }]}>Carteira de Clientes</Text>
          <Text style={[S.sub, { color: colors.mutedForeground }]}>{clientes.length} clientes · Farmer & Hunter</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        {(emRisco > 0 || semVisita30 > 0) && (
          <View style={S.alerts}>
            {semVisita30 > 0 && (
              <View style={[S.alertCard, { backgroundColor: "#FFB30018", borderColor: "#FFB30040" }]}>
                <Text style={[S.alertText, { color: "#FFB300" }]}>⚠️ {semVisita30} clientes sem visita há mais de 30 dias</Text>
              </View>
            )}
            {emRisco > 0 && (
              <View style={[S.alertCard, { backgroundColor: "#FF3B5C18", borderColor: "#FF3B5C40" }]}>
                <Text style={[S.alertText, { color: "#FF3B5C" }]}>🔴 {emRisco} clientes em risco de churn</Text>
              </View>
            )}
          </View>
        )}

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={S.tabs}>
          {STATUS_TABS.map((t) => {
            const count = clientes.filter((c) => c.status === t.key).length;
            const active = tab === t.key;
            return (
              <TouchableOpacity
                key={t.key}
                style={[S.tabBtn, active && { backgroundColor: t.color + "22", borderColor: t.color }]}
                onPress={() => setTab(t.key)}
                activeOpacity={0.8}
              >
                <Text style={[S.tabText, { color: active ? t.color : colors.mutedForeground }]}>{t.label}</Text>
                <View style={[S.tabCount, { backgroundColor: active ? t.color : colors.surface }]}>
                  <Text style={[S.tabCountText, { color: active ? "#fff" : colors.mutedForeground }]}>{count}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <View style={S.list}>
          {filtered.length === 0 && (
            <View style={[S.emptyBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Feather name="inbox" size={32} color={colors.mutedForeground} />
              <Text style={[S.emptyText, { color: colors.mutedForeground }]}>Nenhum cliente nesta categoria</Text>
            </View>
          )}
          {filtered.map((c) => {
            const dc = diasColor(c.diasSemContato);
            return (
              <View key={c.id} style={[S.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={S.cardTop}>
                  <View style={{ flex: 1 }}>
                    <View style={S.cardTitleRow}>
                      <Text style={{ fontSize: 16 }}>{c.tipo === "farmer" ? "🌾" : "🎯"}</Text>
                      <Text style={[S.cardEmpresa, { color: colors.text }]}>{c.empresa}</Text>
                    </View>
                    <Text style={[S.cardContato, { color: colors.mutedForeground }]}>{c.contato} · {c.responsavel}</Text>
                    <Text style={[S.cardData, { color: colors.mutedForeground }]}>Última interação: {c.ultimaInteracao}</Text>
                  </View>
                  <View style={[S.diasBadge, { backgroundColor: dc + "22" }]}>
                    <Text style={[S.diasText, { color: dc }]}>{c.diasSemContato}d</Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={[S.visitaBtn, { backgroundColor: ENTERPRISE_PURPLE + "18", borderColor: ENTERPRISE_PURPLE + "40" }]}
                  onPress={() => { setVisitaModal(c); setVisitaObs(""); }}
                  activeOpacity={0.8}
                >
                  <Feather name="heart" size={14} color={ENTERPRISE_PURPLE} />
                  <Text style={[S.visitaBtnText, { color: ENTERPRISE_PURPLE }]}>Registrar Visita de Encantamento</Text>
                </TouchableOpacity>
              </View>
            );
          })}
        </View>

        <View style={S.analiseSection}>
          <TouchableOpacity
            style={[S.analiseBtn, loadingAnalise && { opacity: 0.7 }]}
            onPress={analisarCarteira}
            disabled={loadingAnalise}
            activeOpacity={0.85}
          >
            {loadingAnalise
              ? <ActivityIndicator color="#fff" />
              : <><Feather name="cpu" size={18} color="#fff" /><Text style={S.analiseBtnText}>Análise da Carteira com JADE</Text></>}
          </TouchableOpacity>

          {!!analise && (
            <View style={[S.analiseBox, { backgroundColor: colors.card, borderColor: ENTERPRISE_PURPLE + "40" }]}>
              <View style={[S.analiseHeader, { backgroundColor: ENTERPRISE_PURPLE + "18" }]}>
                <Feather name="cpu" size={14} color={ENTERPRISE_PURPLE} />
                <Text style={[S.analiseLabel, { color: ENTERPRISE_PURPLE }]}>Diagnóstico da JADE</Text>
              </View>
              <Text style={[S.analiseText, { color: colors.text }]}>{analise}</Text>
            </View>
          )}
        </View>
      </ScrollView>

      <Modal visible={!!visitaModal} transparent animationType="slide" onRequestClose={() => setVisitaModal(null)}>
        <View style={S.modalOverlay}>
          <View style={[S.modalBox, { backgroundColor: colors.card }]}>
            <View style={S.modalHeader}>
              <Text style={[S.modalTitle, { color: colors.text }]}>Visita de Encantamento</Text>
              <TouchableOpacity onPress={() => setVisitaModal(null)} activeOpacity={0.7}>
                <Feather name="x" size={22} color={colors.mutedForeground} />
              </TouchableOpacity>
            </View>
            {visitaModal && (
              <Text style={[S.modalSub, { color: colors.mutedForeground }]}>{visitaModal.empresa} · {visitaModal.contato}</Text>
            )}
            <Text style={[S.fieldLabel, { color: colors.mutedForeground }]}>Observação (opcional)</Text>
            <View style={[S.textareaWrap, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <TextInput
                style={[S.textarea, { color: colors.text }]}
                placeholder="Como foi o contato? O que foi discutido?"
                placeholderTextColor={colors.mutedForeground}
                value={visitaObs}
                onChangeText={setVisitaObs}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>
            <TouchableOpacity
              style={[S.saveBtn, { backgroundColor: ENTERPRISE_PURPLE }]}
              onPress={() => visitaModal && registrarVisita(visitaModal)}
              activeOpacity={0.85}
            >
              <Feather name="check" size={16} color="#fff" />
              <Text style={S.saveBtnText}>Registrar Visita</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const S = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 20, paddingBottom: 14, borderBottomWidth: StyleSheet.hairlineWidth },
  backBtn: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 18, fontFamily: "SpaceGrotesk_700Bold" },
  sub: { fontSize: 12, fontFamily: "SpaceGrotesk_400Regular", marginTop: 2 },
  alerts: { padding: 16, paddingBottom: 0, gap: 8 },
  alertCard: { borderRadius: 12, borderWidth: 1, padding: 12 },
  alertText: { fontSize: 13, fontFamily: "SpaceGrotesk_600SemiBold" },
  tabs: { paddingHorizontal: 16, paddingVertical: 12, gap: 8 },
  tabBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: "transparent" },
  tabText: { fontSize: 13, fontFamily: "SpaceGrotesk_600SemiBold" },
  tabCount: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  tabCountText: { fontSize: 11, fontFamily: "SpaceGrotesk_700Bold" },
  list: { paddingHorizontal: 16, gap: 10 },
  emptyBox: { borderRadius: 16, borderWidth: 1, padding: 40, alignItems: "center", gap: 12 },
  emptyText: { fontSize: 14, fontFamily: "SpaceGrotesk_400Regular" },
  card: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 10 },
  cardTop: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  cardTitleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  cardEmpresa: { fontSize: 15, fontFamily: "SpaceGrotesk_700Bold" },
  cardContato: { fontSize: 12, fontFamily: "SpaceGrotesk_400Regular", marginTop: 3 },
  cardData: { fontSize: 12, fontFamily: "SpaceGrotesk_400Regular", marginTop: 1 },
  diasBadge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, alignItems: "center" },
  diasText: { fontSize: 14, fontFamily: "SpaceGrotesk_700Bold" },
  visitaBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 10, borderRadius: 12, borderWidth: 1 },
  visitaBtnText: { fontSize: 13, fontFamily: "SpaceGrotesk_600SemiBold" },
  analiseSection: { padding: 20, gap: 16 },
  analiseBtn: { backgroundColor: "#00D68F", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, height: 52, borderRadius: 14, shadowColor: "#00D68F", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 6 },
  analiseBtnText: { color: "#fff", fontSize: 16, fontFamily: "SpaceGrotesk_700Bold" },
  analiseBox: { borderRadius: 14, borderWidth: 1, overflow: "hidden" },
  analiseHeader: { flexDirection: "row", alignItems: "center", gap: 8, padding: 12 },
  analiseLabel: { fontSize: 12, fontFamily: "SpaceGrotesk_600SemiBold" },
  analiseText: { fontSize: 14, fontFamily: "SpaceGrotesk_400Regular", lineHeight: 22, padding: 16 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.7)", justifyContent: "flex-end" },
  modalBox: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, gap: 14, paddingBottom: 40 },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  modalTitle: { fontSize: 18, fontFamily: "SpaceGrotesk_700Bold" },
  modalSub: { fontSize: 13, fontFamily: "SpaceGrotesk_400Regular", marginTop: -4 },
  fieldLabel: { fontSize: 12, fontFamily: "SpaceGrotesk_500Medium", textTransform: "uppercase", letterSpacing: 0.5 },
  textareaWrap: { borderRadius: 12, borderWidth: 1, padding: 14, minHeight: 90 },
  textarea: { fontSize: 14, fontFamily: "SpaceGrotesk_400Regular", lineHeight: 22 },
  saveBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, height: 52, borderRadius: 14 },
  saveBtnText: { color: "#fff", fontSize: 15, fontFamily: "SpaceGrotesk_700Bold" },
});
