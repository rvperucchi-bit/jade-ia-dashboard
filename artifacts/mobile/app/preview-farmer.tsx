import React, { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";

// ─── Mock data ────────────────────────────────────────────────────────────────
type Client = {
  id: string; name: string; company: string;
  health: string; lastContact: string; valueMRR: string; status: string;
};

type AiReport = { healthScore: string; churnPrevented: string; expansionOpportunity: string } | null;

const CLIENTS_DATA: Client[] = [
  { id: "1", name: "Marta Souza",      company: "Logix Transportes",  health: "Saudável",        lastContact: "Há 2 dias",  valueMRR: "R$ 2.500/mês", status: "Ativo"    },
  { id: "2", name: "Roberto Lima",     company: "Glow Estética",       health: "Risco de Churn",  lastContact: "Há 24 dias", valueMRR: "R$ 1.200/mês", status: "Atenção"  },
  { id: "3", name: "Julia Neves",      company: "Alpha Construtora",   health: "Saudável",        lastContact: "Há 5 dias",  valueMRR: "R$ 5.800/mês", status: "Ativo"    },
  { id: "4", name: "Guilherme Faria",  company: "Ponto do Café",       health: "Esfriando",       lastContact: "Há 15 dias", valueMRR: "R$ 900/mês",   status: "Atenção"  },
];

const TABS = ["Minha Carteira", "Monitoramento IA", "Alertas"] as const;
type Tab = (typeof TABS)[number];

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function PreviewFarmerScreen() {
  const router = useRouter();
  const [activeTab,    setActiveTab]    = useState<Tab>("Minha Carteira");
  const [isAnalyzing,  setIsAnalyzing]  = useState(false);
  const [aiReport,     setAiReport]     = useState<AiReport>(null);

  const handleAiAnalysis = () => {
    setIsAnalyzing(true);
    setTimeout(() => {
      setIsAnalyzing(false);
      setAiReport({
        healthScore:           "92%",
        churnPrevented:        "2 clientes salvos",
        expansionOpportunity:  "R$ 4.300 em Up-sell detectado",
      });
    }, 2500);
  };

  const displayedClients =
    activeTab === "Alertas"
      ? CLIENTS_DATA.filter((c) => c.status === "Atenção")
      : CLIENTS_DATA;

  const renderCard = ({ item }: { item: Client }) => {
    const isRisk = item.health === "Risco de Churn" || item.health === "Esfriando";
    return (
      <View style={S.card}>
        <View style={S.cardHeader}>
          <View style={{ flex: 1, marginRight: 10 }}>
            <Text style={S.clientName}>{item.name}</Text>
            <Text style={S.companyName}>{item.company}</Text>
          </View>
          <View style={[S.healthBadge, isRisk && S.healthBadgeRisk]}>
            <Text style={[S.healthBadgeText, isRisk && S.healthBadgeTextRisk]}>{item.health}</Text>
          </View>
        </View>
        <View style={S.cardFooter}>
          <View>
            <Text style={S.labelMini}>CONTRATO RECORRENTE</Text>
            <Text style={S.dealValue}>{item.valueMRR}</Text>
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={S.labelMini}>ÚLTIMO CONTATO</Text>
            <Text style={S.dateText}>{item.lastContact}</Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={S.container} edges={["top", "bottom"]}>
      {/* Back */}
      <TouchableOpacity style={S.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
        <Feather name="chevron-left" size={26} color="#fff" />
        <Text style={S.backLabel}>Voltar</Text>
      </TouchableOpacity>

      {/* Header */}
      <View style={S.header}>
        <Text style={S.greeting}>Retenção & Farmer</Text>
        <Text style={S.title}>Carteira Ativa</Text>
      </View>

      {/* Tabs */}
      <View style={S.tabsWrapper}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={S.tabsScroll}>
          {TABS.map((tab) => {
            const isActive = activeTab === tab;
            const alertCount = tab === "Alertas" ? CLIENTS_DATA.filter((c) => c.status === "Atenção").length : 0;
            return (
              <TouchableOpacity key={tab} activeOpacity={0.8} onPress={() => setActiveTab(tab)} style={S.tabButton}>
                <Text style={[S.tabText, isActive && S.activeTabText]}>
                  {tab}
                  {alertCount > 0 && <Text style={S.alertCount}> {alertCount}</Text>}
                </Text>
                {isActive && <View style={S.tabIndicator} />}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Minha Carteira + Alertas */}
      {(activeTab === "Minha Carteira" || activeTab === "Alertas") && (
        <FlatList
          data={displayedClients}
          keyExtractor={(item) => item.id}
          renderItem={renderCard}
          contentContainerStyle={S.listContent}
          ListEmptyComponent={
            <View style={S.emptyContainer}>
              <Text style={S.emptyText}>Nenhum alerta no momento</Text>
            </View>
          }
        />
      )}

      {/* Monitoramento IA */}
      {activeTab === "Monitoramento IA" && (
        <ScrollView style={S.aiContainer}>
          <View style={S.aiHeroCard}>
            <Text style={S.aiTitle}>Acompanhamento Pós-Venda Autônomo 🤖</Text>
            <Text style={S.aiDescription}>
              Nossa IA analisa o histórico de conversas, intervalo de mensagens e interações de suporte para prever insatisfações antes que o cliente cancele.
            </Text>
            <TouchableOpacity
              style={[S.primaryButton, isAnalyzing && S.disabledButton]}
              activeOpacity={0.8}
              onPress={handleAiAnalysis}
              disabled={isAnalyzing}
            >
              {isAnalyzing
                ? <ActivityIndicator color="#090A0F" />
                : <Text style={S.primaryButtonText}>Escanear Carteira com IA</Text>
              }
            </TouchableOpacity>
          </View>

          {aiReport && (
            <View style={S.reportWrapper}>
              <Text style={S.sectionTitle}>Análise Comercial Concluída</Text>
              <View style={S.metricsGrid}>
                <View style={[S.metricCard, { marginRight: 10 }]}>
                  <Text style={S.metricLabel}>HEALTH SCORE GERAL</Text>
                  <Text style={S.metricValue}>{aiReport.healthScore}</Text>
                </View>
                <View style={S.metricCard}>
                  <Text style={S.metricLabel}>EXPANSÃO DE CONTAS</Text>
                  <Text style={[S.metricValue, { color: "#38A169" }]}>Up-sell</Text>
                </View>
              </View>
              <View style={S.insightBox}>
                <Text style={S.insightTitle}>⚡ Insights de Farmer Prontos:</Text>
                <Text style={S.insightText}>• {aiReport.churnPrevented} agendando mensagem de relacionamento automática.</Text>
                <Text style={S.insightText}>• {aiReport.expansionOpportunity}.</Text>
              </View>
            </View>
          )}
        </ScrollView>
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
  alertCount: { color: "#E93E3E", fontSize: 13, fontWeight: "700" },
  tabIndicator: { position: "absolute", bottom: -13, left: 0, right: 0, height: 2, backgroundColor: "#00E5FF", borderRadius: 1 },

  listContent: { padding: 20 },
  card: { backgroundColor: "#161822", borderRadius: 16, padding: 18, marginBottom: 14, borderWidth: 1, borderColor: "#242736" },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 },
  clientName: { fontSize: 16, fontWeight: "600", color: "#FFFFFF", letterSpacing: -0.3 },
  companyName: { fontSize: 13, color: "#8F94A8", marginTop: 2 },
  healthBadge: { backgroundColor: "rgba(56,161,105,0.1)", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  healthBadgeText: { fontSize: 11, color: "#38A169", fontWeight: "600" },
  healthBadgeRisk: { backgroundColor: "rgba(229,62,62,0.1)" },
  healthBadgeTextRisk: { color: "#E93E3E" },
  cardFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderTopWidth: 1, borderColor: "#242736", paddingTop: 14 },
  labelMini: { fontSize: 9, color: "#4E5366", fontWeight: "700", letterSpacing: 0.5, marginBottom: 4 },
  dealValue: { fontSize: 15, fontWeight: "700", color: "#FFFFFF" },
  dateText: { fontSize: 14, color: "#8F94A8", fontWeight: "500" },

  emptyContainer: { alignItems: "center", justifyContent: "center", paddingVertical: 60 },
  emptyText: { color: "#4E5366", fontSize: 14 },

  aiContainer: { padding: 20 },
  aiHeroCard: { backgroundColor: "#161822", borderRadius: 20, padding: 22, borderWidth: 1, borderColor: "#242736", marginBottom: 20 },
  aiTitle: { fontSize: 18, fontWeight: "700", color: "#FFFFFF", marginBottom: 8, letterSpacing: -0.3 },
  aiDescription: { fontSize: 13, color: "#8F94A8", lineHeight: 20, marginBottom: 24 },
  primaryButton: { backgroundColor: "#FFFFFF", height: 54, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  disabledButton: { backgroundColor: "#161822", borderWidth: 1, borderColor: "#242736", opacity: 0.5 },
  primaryButtonText: { color: "#090A0F", fontWeight: "700", fontSize: 15 },

  reportWrapper: { marginTop: 10 },
  sectionTitle: { fontSize: 16, fontWeight: "600", color: "#FFFFFF", marginBottom: 14 },
  metricsGrid: { flexDirection: "row", justifyContent: "space-between", marginBottom: 16 },
  metricCard: { flex: 1, backgroundColor: "#161822", borderRadius: 12, padding: 14, borderWidth: 1, borderColor: "#242736" },
  metricLabel: { fontSize: 9, color: "#4E5366", fontWeight: "700", letterSpacing: 0.5 },
  metricValue: { fontSize: 20, fontWeight: "700", color: "#00E5FF", marginTop: 4 },
  insightBox: { backgroundColor: "rgba(0,229,255,0.03)", borderRadius: 14, padding: 18, borderWidth: 1, borderColor: "rgba(0,229,255,0.15)" },
  insightTitle: { fontSize: 14, fontWeight: "600", color: "#FFFFFF", marginBottom: 10 },
  insightText: { fontSize: 13, color: "#8F94A8", lineHeight: 18, marginBottom: 6 },
});
