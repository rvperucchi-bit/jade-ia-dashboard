import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";

const PINK   = "#FF0080";
const PURPLE = "#8400FF";

type Stage = "prospeccao" | "contato" | "qualificacao" | "proposta" | "negociacao" | "fechado";

interface Deal {
  id: string;
  name: string;
  company: string;
  value: number;
  stage: Stage;
  daysInStage: number;
  probability: number;
}

const STAGE_CONFIG: Record<Stage, { label: string; color: string; icon: string }> = {
  prospeccao:  { label: "Prospecção",  color: "#5577FF", icon: "search" },
  contato:     { label: "Contato",     color: PURPLE,    icon: "phone" },
  qualificacao:{ label: "Qualificação",color: "#FF8800", icon: "check-circle" },
  proposta:    { label: "Proposta",    color: PINK,      icon: "file-text" },
  negociacao:  { label: "Negociação",  color: "#FFCC00", icon: "repeat" },
  fechado:     { label: "Fechado",     color: "#22CC88", icon: "award" },
};

const STAGES: Stage[] = ["prospeccao", "contato", "qualificacao", "proposta", "negociacao", "fechado"];

const MOCK_DEALS: Deal[] = [
  { id: "1",  name: "Carlos Mendes",   company: "Pizzaria Milano",     value: 1200,  stage: "proposta",    daysInStage: 2,  probability: 70 },
  { id: "2",  name: "Fernanda Souza",  company: "Clínica OralVita",   value: 2400,  stage: "negociacao",  daysInStage: 5,  probability: 85 },
  { id: "3",  name: "Roberto Lima",    company: "Academia FitMax",    value: 980,   stage: "qualificacao",daysInStage: 3,  probability: 55 },
  { id: "4",  name: "Ana Paula Costa", company: "Salão BelaVida",     value: 600,   stage: "contato",     daysInStage: 1,  probability: 35 },
  { id: "5",  name: "Marcos Oliveira", company: "Auto Peças Central", value: 3600,  stage: "fechado",     daysInStage: 0,  probability: 100 },
  { id: "6",  name: "Juliana Martins", company: "StartUp Hub SC",     value: 1800,  stage: "proposta",    daysInStage: 7,  probability: 65 },
  { id: "7",  name: "Larissa Nunes",   company: "Adv. Nunes & Silva", value: 4800,  stage: "negociacao",  daysInStage: 4,  probability: 90 },
  { id: "8",  name: "Pedro Alves",     company: "Farmácia Saúde+",    value: 720,   stage: "prospeccao",  daysInStage: 1,  probability: 20 },
  { id: "9",  name: "Beatriz Lima",    company: "Estúdio Glow",       value: 850,   stage: "qualificacao",daysInStage: 2,  probability: 50 },
  { id: "10", name: "Rafael Santos",   company: "Construtora Nova",   value: 9600,  stage: "proposta",    daysInStage: 10, probability: 60 },
];

function formatValue(v: number) {
  return `R$ ${v.toLocaleString("pt-BR")}`;
}

function DealCard({ deal }: { deal: Deal }) {
  const colors = useColors();
  const cfg = STAGE_CONFIG[deal.stage];
  const urgent = deal.daysInStage >= 7 && deal.stage !== "fechado";
  return (
    <TouchableOpacity style={[DC.card, { backgroundColor: colors.surface, borderColor: urgent ? "#FF880055" : colors.border }]} activeOpacity={0.75}>
      {urgent && (
        <View style={DC.urgentBar} />
      )}
      <Text style={[DC.name, { color: colors.text }]} numberOfLines={1}>{deal.name}</Text>
      <Text style={[DC.company, { color: colors.mutedForeground }]} numberOfLines={1}>{deal.company}</Text>
      <View style={DC.footer}>
        <Text style={[DC.value, { color: PINK }]}>{formatValue(deal.value)}</Text>
        <View style={[DC.probBadge, { backgroundColor: cfg.color + "22" }]}>
          <Text style={[DC.probText, { color: cfg.color }]}>{deal.probability}%</Text>
        </View>
      </View>
      {urgent && (
        <View style={DC.urgentRow}>
          <Feather name="alert-circle" size={11} color="#FF8800" />
          <Text style={DC.urgentText}>{deal.daysInStage} dias nessa etapa</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}
const DC = StyleSheet.create({
  card:       { borderRadius: 12, borderWidth: 1, padding: 12, marginBottom: 8, overflow: "hidden" },
  urgentBar:  { position: "absolute", left: 0, top: 0, bottom: 0, width: 3, backgroundColor: "#FF8800" },
  name:       { fontSize: 13, fontFamily: "SpaceGrotesk_600SemiBold", paddingLeft: 4 },
  company:    { fontSize: 11, fontFamily: "SpaceGrotesk_400Regular", paddingLeft: 4, marginTop: 2 },
  footer:     { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 8, paddingLeft: 4 },
  value:      { fontSize: 13, fontFamily: "SpaceGrotesk_700Bold" },
  probBadge:  { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 8 },
  probText:   { fontSize: 11, fontFamily: "SpaceGrotesk_700Bold" },
  urgentRow:  { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 6, paddingLeft: 4 },
  urgentText: { fontSize: 10, fontFamily: "SpaceGrotesk_400Regular", color: "#FF8800" },
});

export default function PipelineScreen() {
  const colors  = useColors();
  const insets  = useSafeAreaInsets();
  const router  = useRouter();
  const [activeStage, setActiveStage] = useState<Stage | "todos">("todos");

  const topPad    = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 84 : insets.bottom + 60;

  const totalValue = MOCK_DEALS.filter(d => d.stage !== "fechado").reduce((s, d) => s + d.value, 0);
  const closedValue = MOCK_DEALS.filter(d => d.stage === "fechado").reduce((s, d) => s + d.value, 0);
  const weightedValue = MOCK_DEALS.filter(d => d.stage !== "fechado").reduce((s, d) => s + (d.value * d.probability / 100), 0);

  const stageDeals = (stage: Stage) => MOCK_DEALS.filter(d => d.stage === stage);
  const visibleDeals = activeStage === "todos"
    ? MOCK_DEALS
    : MOCK_DEALS.filter(d => d.stage === activeStage);

  return (
    <View style={[S.root, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[S.header, { paddingTop: topPad + 4 }]}>
        <TouchableOpacity onPress={() => router.back()} style={S.backBtn} activeOpacity={0.7}>
          <Feather name="arrow-left" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={[S.title, { color: colors.text }]}>Pipeline</Text>
        <TouchableOpacity style={[S.addBtn, { backgroundColor: PINK }]} activeOpacity={0.85}>
          <Feather name="plus" size={18} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* KPI strip */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={S.kpiScroll}>
        {[
          { label: "Em aberto",  value: formatValue(totalValue),    color: PINK },
          { label: "Ponderado",  value: formatValue(weightedValue), color: PURPLE },
          { label: "Fechado",    value: formatValue(closedValue),   color: "#22CC88" },
          { label: "Negócios",   value: String(MOCK_DEALS.length),  color: colors.text },
        ].map((k) => (
          <View key={k.label} style={[S.kpiCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[S.kpiValue, { color: k.color }]}>{k.value}</Text>
            <Text style={[S.kpiLabel, { color: colors.mutedForeground }]}>{k.label}</Text>
          </View>
        ))}
      </ScrollView>

      {/* Stage progress bar */}
      <View style={[S.progressWrap, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        {STAGES.map((stage) => {
          const count = stageDeals(stage).length;
          const pct = MOCK_DEALS.length > 0 ? (count / MOCK_DEALS.length) * 100 : 0;
          const cfg = STAGE_CONFIG[stage];
          return (
            <TouchableOpacity
              key={stage}
              style={[S.stageCol, { borderBottomColor: activeStage === stage ? cfg.color : "transparent" }]}
              onPress={() => setActiveStage(activeStage === stage ? "todos" : stage)}
              activeOpacity={0.75}
            >
              <Text style={[S.stageCount, { color: activeStage === stage ? cfg.color : colors.text }]}>{count}</Text>
              <Text style={[S.stageLabel, { color: activeStage === stage ? cfg.color : colors.mutedForeground }]} numberOfLines={1}>{cfg.label}</Text>
              <View style={[S.stageDot, { backgroundColor: cfg.color + (activeStage === stage ? "FF" : "44") }]} />
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Deal list */}
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: bottomPad }}>
        {activeStage === "todos" ? (
          STAGES.filter(s => stageDeals(s).length > 0).map((stage) => {
            const cfg = STAGE_CONFIG[stage];
            const deals = stageDeals(stage);
            return (
              <View key={stage} style={{ marginBottom: 16 }}>
                <View style={S.stageHeaderRow}>
                  <Feather name={cfg.icon as any} size={14} color={cfg.color} />
                  <Text style={[S.stageHeaderLabel, { color: cfg.color }]}>{cfg.label}</Text>
                  <Text style={[S.stageHeaderCount, { color: colors.mutedForeground }]}>{deals.length}</Text>
                </View>
                {deals.map(d => <DealCard key={d.id} deal={d} />)}
              </View>
            );
          })
        ) : (
          visibleDeals.map(d => <DealCard key={d.id} deal={d} />)
        )}
      </ScrollView>
    </View>
  );
}

const S = StyleSheet.create({
  root:            { flex: 1 },
  header:          { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingBottom: 12, gap: 12 },
  backBtn:         { padding: 4 },
  title:           { fontSize: 22, fontFamily: "SpaceGrotesk_700Bold", flex: 1 },
  addBtn:          { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  kpiScroll:       { paddingHorizontal: 16, paddingBottom: 12, gap: 10 },
  kpiCard:         { borderRadius: 14, borderWidth: 1, paddingVertical: 10, paddingHorizontal: 16, minWidth: 120, alignItems: "center" },
  kpiValue:        { fontSize: 17, fontFamily: "SpaceGrotesk_700Bold" },
  kpiLabel:        { fontSize: 11, fontFamily: "SpaceGrotesk_400Regular", marginTop: 2 },
  progressWrap:    { flexDirection: "row", marginHorizontal: 16, marginBottom: 12, borderRadius: 14, borderWidth: 1, overflow: "hidden" },
  stageCol:        { flex: 1, alignItems: "center", paddingVertical: 10, borderBottomWidth: 2, gap: 4 },
  stageCount:      { fontSize: 15, fontFamily: "SpaceGrotesk_700Bold" },
  stageLabel:      { fontSize: 8, fontFamily: "SpaceGrotesk_500Medium" },
  stageDot:        { width: 6, height: 6, borderRadius: 3 },
  stageHeaderRow:  { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 10 },
  stageHeaderLabel:{ fontSize: 13, fontFamily: "SpaceGrotesk_700Bold", flex: 1 },
  stageHeaderCount:{ fontSize: 12, fontFamily: "SpaceGrotesk_400Regular" },
});
