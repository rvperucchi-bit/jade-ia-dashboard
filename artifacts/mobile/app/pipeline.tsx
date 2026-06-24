import AsyncStorage from "@react-native-async-storage/async-storage";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import type { CrmLeadLocal } from "./crm";

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

function mapStatusToStage(status: string): Stage {
  switch (status) {
    case "Primeiro Contato": return "prospeccao";
    case "Em andamento":     return "contato";
    case "Morno":            return "qualificacao";
    case "Quente":           return "proposta";
    case "Frio":             return "contato";
    case "Fechado":
    case "Cliente":          return "fechado";
    case "Descartado":
    case "Inválido":
    case "Arquivado":        return "negociacao";
    default:                 return "prospeccao";
  }
}

function probFromStage(stage: Stage): number {
  switch (stage) {
    case "prospeccao":  return 15;
    case "contato":     return 30;
    case "qualificacao":return 50;
    case "proposta":    return 65;
    case "negociacao":  return 80;
    case "fechado":     return 100;
  }
}

function leadToDeal(l: CrmLeadLocal): Deal {
  const stage = mapStatusToStage(l.status);
  const ms = l.dataAbordagem ? (Date.now() - new Date(l.dataAbordagem).getTime()) / 86400000 : 0;
  return {
    id: l.id,
    name: l.nome,
    company: l.empresa || l.nome,
    value: 0,
    stage,
    daysInStage: Math.floor(ms),
    probability: probFromStage(stage),
  };
}

function formatValue(v: number) {
  return v > 0 ? `R$ ${v.toLocaleString("pt-BR")}` : "—";
}

function DealDetailModal({ deal, visible, onClose }: { deal: Deal | null; visible: boolean; onClose: () => void }) {
  const colors = useColors();
  if (!deal) return null;
  const cfg = STAGE_CONFIG[deal.stage];
  const urgent = deal.daysInStage >= 7 && deal.stage !== "fechado";
  const nextActions: Record<Stage, string[]> = {
    prospeccao:  ["Fazer primeiro contato via WhatsApp", "Qualificar necessidade e budget", "Agendar apresentação"],
    contato:     ["Enviar material de apoio", "Confirmar interesse e urgência", "Marcar próxima conversa"],
    qualificacao:["Identificar decisor final", "Entender objeções principais", "Preparar proposta personalizada"],
    proposta:    ["Confirmar recebimento da proposta", "Negociar condições se necessário", "Definir prazo para decisão"],
    negociacao:  ["Fechar condições finais", "Solicitar aprovação formal", "Preparar contrato"],
    fechado:     ["Solicitar indicações", "Iniciar onboarding", "Coletar feedback pós-venda"],
  };
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.65)", justifyContent: "flex-end" }} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity activeOpacity={1} style={{ backgroundColor: colors.background, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingTop: 12 }}>
          <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border, alignSelf: "center", marginBottom: 20 }} />
          <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
            <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 12, paddingHorizontal: 20, marginBottom: 16 }}>
              <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: cfg.color + "22", alignItems: "center", justifyContent: "center" }}>
                <Feather name={cfg.icon as any} size={20} color={cfg.color} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 17, fontFamily: "SpaceGrotesk_700Bold", color: colors.text }}>{deal.name}</Text>
                {deal.company !== deal.name && (
                  <Text style={{ fontSize: 13, fontFamily: "SpaceGrotesk_400Regular", color: colors.mutedForeground }}>{deal.company}</Text>
                )}
              </View>
              <TouchableOpacity onPress={onClose}>
                <Feather name="x" size={22} color={colors.mutedForeground} />
              </TouchableOpacity>
            </View>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, paddingHorizontal: 20, marginBottom: 16 }}>
              <View style={{ paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20, backgroundColor: cfg.color + "22" }}>
                <Text style={{ color: cfg.color, fontSize: 12, fontFamily: "SpaceGrotesk_600SemiBold" }}>{cfg.label}</Text>
              </View>
              <View style={{ paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.06)" }}>
                <Text style={{ color: colors.mutedForeground, fontSize: 12, fontFamily: "SpaceGrotesk_500Medium" }}>{deal.probability}% probabilidade</Text>
              </View>
              {urgent && (
                <View style={{ paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20, backgroundColor: "#FF880018" }}>
                  <Text style={{ color: "#FF8800", fontSize: 12, fontFamily: "SpaceGrotesk_600SemiBold" }}>⚠ {deal.daysInStage}d parado</Text>
                </View>
              )}
            </View>
            <View style={{ flexDirection: "row", gap: 10, paddingHorizontal: 16, marginBottom: 20 }}>
              {[
                { label: "Valor",          value: formatValue(deal.value) },
                { label: "Dias nessa etapa", value: String(deal.daysInStage) },
                { label: "Probabilidade",  value: `${deal.probability}%` },
              ].map((s, i) => (
                <View key={i} style={{ flex: 1, backgroundColor: colors.surface, borderRadius: 12, borderWidth: 1, borderColor: colors.border, padding: 10, alignItems: "center" }}>
                  <Text style={{ fontSize: 15, fontFamily: "SpaceGrotesk_700Bold", color: colors.text }}>{s.value}</Text>
                  <Text style={{ fontSize: 10, fontFamily: "SpaceGrotesk_400Regular", color: colors.mutedForeground, marginTop: 2, textAlign: "center" }}>{s.label}</Text>
                </View>
              ))}
            </View>
            <Text style={{ fontSize: 10, fontFamily: "SpaceGrotesk_700Bold", color: colors.mutedForeground, letterSpacing: 0.8, marginBottom: 10, paddingHorizontal: 20 }}>PRÓXIMAS AÇÕES</Text>
            <View style={{ backgroundColor: colors.surface, borderRadius: 14, borderWidth: 1, borderColor: colors.border, overflow: "hidden", marginHorizontal: 16 }}>
              {nextActions[deal.stage].map((action, i) => (
                <View key={i} style={{ flexDirection: "row", alignItems: "flex-start", gap: 10, padding: 12, borderTopWidth: i > 0 ? StyleSheet.hairlineWidth : 0, borderTopColor: colors.border }}>
                  <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: i === 0 ? PINK + "22" : "rgba(255,255,255,0.06)", alignItems: "center", justifyContent: "center", marginTop: 1 }}>
                    <View style={{ width: 7, height: 7, borderRadius: 3.5, backgroundColor: i === 0 ? PINK : "rgba(255,255,255,0.2)" }} />
                  </View>
                  <Text style={{ flex: 1, fontSize: 13, fontFamily: "SpaceGrotesk_400Regular", color: i === 0 ? colors.text : colors.mutedForeground }}>{action}</Text>
                </View>
              ))}
            </View>
            <View style={{ height: 36 }} />
          </ScrollView>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

function DealCard({ deal, onPress }: { deal: Deal; onPress: () => void }) {
  const colors = useColors();
  const cfg = STAGE_CONFIG[deal.stage];
  const urgent = deal.daysInStage >= 7 && deal.stage !== "fechado";
  return (
    <TouchableOpacity style={[DC.card, { backgroundColor: colors.surface, borderColor: urgent ? "#FF880055" : colors.border }]} activeOpacity={0.75} onPress={onPress}>
      {urgent && <View style={DC.urgentBar} />}
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
  const [activeStage,    setActiveStage]    = useState<Stage | "todos">("todos");
  const [deals,          setDeals]          = useState<Deal[]>([]);
  const [selectedDeal,   setSelectedDeal]   = useState<Deal | null>(null);
  const [dealModalVisible, setDealModalVisible] = useState(false);

  const topPad    = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 84 : insets.bottom + 60;

  useEffect(() => {
    AsyncStorage.getItem("crm_leads").then((raw) => {
      if (!raw) return;
      try {
        const leads = JSON.parse(raw) as CrmLeadLocal[];
        setDeals(leads.map(leadToDeal));
      } catch {}
    });
  }, []);

  const totalValue    = deals.filter(d => d.stage !== "fechado").reduce((s, d) => s + d.value, 0);
  const closedValue   = deals.filter(d => d.stage === "fechado").reduce((s, d) => s + d.value, 0);
  const weightedValue = deals.filter(d => d.stage !== "fechado").reduce((s, d) => s + (d.value * d.probability / 100), 0);

  const stageDeals   = (stage: Stage) => deals.filter(d => d.stage === stage);
  const visibleDeals = activeStage === "todos" ? deals : deals.filter(d => d.stage === activeStage);

  return (
    <View style={[S.root, { backgroundColor: colors.background }]}>
      <View style={[S.header, { paddingTop: topPad + 4 }]}>
        <TouchableOpacity onPress={() => router.back()} style={S.backBtn} activeOpacity={0.7}>
          <Feather name="arrow-left" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={[S.title, { color: colors.text }]}>Pipeline</Text>
        <TouchableOpacity
          style={[S.addBtn, { backgroundColor: PINK }]}
          activeOpacity={0.85}
          onPress={() => Alert.alert("Novo Negócio", "Adicione leads via CRM para que apareçam automaticamente no Pipeline.", [{ text: "OK" }])}
        >
          <Feather name="plus" size={18} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={S.kpiScroll}>
        {[
          { label: "Em aberto",  value: formatValue(totalValue),       color: PINK },
          { label: "Ponderado",  value: formatValue(weightedValue),    color: PURPLE },
          { label: "Fechado",    value: formatValue(closedValue),      color: "#22CC88" },
          { label: "Negócios",   value: String(deals.length),          color: colors.text },
        ].map((k) => (
          <View key={k.label} style={[S.kpiCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[S.kpiValue, { color: k.color }]}>{k.value}</Text>
            <Text style={[S.kpiLabel, { color: colors.mutedForeground }]}>{k.label}</Text>
          </View>
        ))}
      </ScrollView>

      <View style={[S.progressWrap, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        {STAGES.map((stage) => {
          const count = stageDeals(stage).length;
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

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: bottomPad }}>
        {deals.length === 0 ? (
          <View style={S.empty}>
            <Feather name="bar-chart-2" size={40} color={colors.mutedForeground} />
            <Text style={[S.emptyText, { color: colors.mutedForeground }]}>
              Nenhum negócio no pipeline. Registre leads no CRM para visualizá-los aqui.
            </Text>
          </View>
        ) : activeStage === "todos" ? (
          STAGES.filter(s => stageDeals(s).length > 0).map((stage) => {
            const cfg = STAGE_CONFIG[stage];
            const sd  = stageDeals(stage);
            return (
              <View key={stage} style={{ marginBottom: 16 }}>
                <View style={S.stageHeaderRow}>
                  <Feather name={cfg.icon as any} size={14} color={cfg.color} />
                  <Text style={[S.stageHeaderLabel, { color: cfg.color }]}>{cfg.label}</Text>
                  <Text style={[S.stageHeaderCount, { color: colors.mutedForeground }]}>{sd.length}</Text>
                </View>
                {sd.map(d => <DealCard key={d.id} deal={d} onPress={() => { setSelectedDeal(d); setDealModalVisible(true); }} />)}
              </View>
            );
          })
        ) : (
          visibleDeals.map(d => <DealCard key={d.id} deal={d} onPress={() => { setSelectedDeal(d); setDealModalVisible(true); }} />)
        )}
      </ScrollView>

      <DealDetailModal
        deal={selectedDeal}
        visible={dealModalVisible}
        onClose={() => setDealModalVisible(false)}
      />
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
  empty:           { alignItems: "center", gap: 12, paddingTop: 60 },
  emptyText:       { fontSize: 14, fontFamily: "SpaceGrotesk_400Regular", textAlign: "center", paddingHorizontal: 16 },
});
