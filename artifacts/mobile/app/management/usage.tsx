import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert,
} from "react-native";

const PLAN_LIMITS = {
  start: {
    name: "JADE Start 🟢",
    chat:   { max: 500,  label: "mensagens" },
    radar:  { max: 50,   label: "buscas"    },
    audio:  { max: 30,   label: "minutos"   },
    images: { max: 10,   label: "gerações"  },
    docs:   { max: 20,   label: "arquivos"  },
    vision: { max: 20,   label: "imagens"   },
  },
  pro: {
    name: "JADE Pro 🟣",
    chat:   { max: 2000, label: "mensagens" },
    radar:  { max: 200,  label: "buscas"    },
    audio:  { max: 120,  label: "minutos"   },
    images: { max: 50,   label: "gerações"  },
    docs:   { max: 100,  label: "arquivos"  },
    vision: { max: 100,  label: "imagens"   },
  },
  enterprise: {
    name: "Enterprise 🔴",
    chat:   { max: 5000, label: "mensagens" },
    radar:  { max: 500,  label: "buscas"    },
    audio:  { max: 500,  label: "minutos"   },
    images: { max: 200,  label: "gerações"  },
    docs:   { max: 500,  label: "arquivos"  },
    vision: { max: 500,  label: "imagens"   },
  },
} as const;

type PlanKey = keyof typeof PLAN_LIMITS;

const CURRENT_USAGE = {
  chat: 342, radar: 21, audio: 12, images: 7, docs: 14, vision: 5,
};

function ResourceRow({
  title, current, max, unit,
}: { title: string; current: number; max: number; unit: string }) {
  const pct = `${Math.min((current / max) * 100, 100)}%` as `${number}%`;
  const overThreshold = current / max > 0.8;
  return (
    <View style={S.resourceBlock}>
      <View style={S.resourceHeader}>
        <Text style={S.resourceTitle}>{title}</Text>
        <Text style={S.resourceCounter}>
          {current}{" "}
          <Text style={S.maxText}>/ {max} {unit}</Text>
        </Text>
      </View>
      <View style={S.progressTrack}>
        <View style={[S.progressBar, { width: pct, backgroundColor: overThreshold ? "#E93E3E" : "#00E5FF" }]} />
      </View>
    </View>
  );
}

export default function UsageScreen() {
  const [userPlan, setUserPlan] = useState<PlanKey>("start");
  const plan = PLAN_LIMITS[userPlan];

  const handleBuyCredits = () =>
    Alert.alert(
      "Créditos Avulsos ⚡",
      "Deseja recarregar seu saldo de mensagens ou buscas via Pix instantâneo?",
      [{ text: "Cancelar", style: "cancel" }, { text: "Ver Opções", onPress: () => {} }]
    );

  return (
    <SafeAreaView style={S.container}>
      <ScrollView style={S.scroll} showsVerticalScrollIndicator={false}>
        <Text style={S.pageTitle}>Consumo do Plano</Text>

        <View style={S.planCard}>
          <Text style={S.planLabel}>PLANO CONTRATADO</Text>
          <Text style={S.planName}>{plan.name}</Text>
          <Text style={S.planReset}>
            Os limites renovam automaticamente no início do próximo ciclo de faturamento.
          </Text>
          <View style={S.planToggle}>
            {(["start", "pro", "enterprise"] as PlanKey[]).map((k) => (
              <TouchableOpacity
                key={k}
                onPress={() => setUserPlan(k)}
                style={[S.planChip, userPlan === k && S.planChipActive]}
                activeOpacity={0.7}
              >
                <Text style={[S.planChipText, userPlan === k && S.planChipTextActive]}>
                  {k === "start" ? "Start" : k === "pro" ? "Pro" : "Enterprise"}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <Text style={S.sectionLabel}>MÉTRICAS DE USO DOS RECURSOS</Text>

        <View style={S.usageWrapper}>
          <ResourceRow title="💬 Chat IA"               current={CURRENT_USAGE.chat}   max={plan.chat.max}   unit={plan.chat.label}   />
          <ResourceRow title="🔍 Radar de Prospecção"   current={CURRENT_USAGE.radar}  max={plan.radar.max}  unit={plan.radar.label}  />
          <ResourceRow title="🎙️ Transcrição de Áudio" current={CURRENT_USAGE.audio}  max={plan.audio.max}  unit={plan.audio.label}  />
          <ResourceRow title="🎨 Imagens IA"            current={CURRENT_USAGE.images} max={plan.images.max} unit={plan.images.label} />
          <ResourceRow title="📄 Análise de Documentos" current={CURRENT_USAGE.docs}   max={plan.docs.max}   unit={plan.docs.label}   />
          <ResourceRow title="👁️ Vision (Análise Visual)" current={CURRENT_USAGE.vision} max={plan.vision.max} unit={plan.vision.label} />
        </View>

        <TouchableOpacity style={S.buyBtn} onPress={handleBuyCredits} activeOpacity={0.8}>
          <Text style={S.buyBtnText}>Comprar mais créditos ⚡</Text>
        </TouchableOpacity>
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const S = StyleSheet.create({
  container:           { flex: 1, backgroundColor: "#090A0F" },
  scroll:              { padding: 20 },
  pageTitle:           { fontSize: 22, fontWeight: "700", color: "#FFFFFF", marginBottom: 20 },
  planCard:            { backgroundColor: "#161822", borderRadius: 16, padding: 18, borderWidth: 1, borderColor: "#242736", marginBottom: 24 },
  planLabel:           { fontSize: 9, color: "#4E5366", fontWeight: "700", letterSpacing: 0.5 },
  planName:            { fontSize: 18, fontWeight: "700", color: "#FFFFFF", marginTop: 4, marginBottom: 8 },
  planReset:           { fontSize: 12, color: "#8F94A8", lineHeight: 16, marginBottom: 14 },
  planToggle:          { flexDirection: "row", gap: 8 },
  planChip:            { flex: 1, height: 32, borderRadius: 8, borderWidth: 1, borderColor: "#242736", alignItems: "center", justifyContent: "center" },
  planChipActive:      { borderColor: "#00E5FF", backgroundColor: "rgba(0,229,255,0.08)" },
  planChipText:        { color: "#4E5366", fontSize: 12, fontWeight: "600" },
  planChipTextActive:  { color: "#00E5FF" },
  sectionLabel:        { fontSize: 11, color: "#8F94A8", fontWeight: "700", letterSpacing: 0.8, marginBottom: 14 },
  usageWrapper:        { backgroundColor: "#161822", borderRadius: 16, paddingHorizontal: 18, paddingVertical: 8, borderWidth: 1, borderColor: "#242736" },
  resourceBlock:       { paddingVertical: 14, borderBottomWidth: 1, borderColor: "#090A0F" },
  resourceHeader:      { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  resourceTitle:       { color: "#FFFFFF", fontSize: 14, fontWeight: "500" },
  resourceCounter:     { color: "#FFFFFF", fontSize: 13, fontWeight: "600" },
  maxText:             { color: "#4E5366", fontSize: 12, fontWeight: "400" },
  progressTrack:       { height: 6, backgroundColor: "#090A0F", borderRadius: 3, overflow: "hidden" },
  progressBar:         { height: "100%", borderRadius: 3 },
  buyBtn:              { backgroundColor: "#FFFFFF", height: 54, borderRadius: 12, alignItems: "center", justifyContent: "center", marginTop: 24 },
  buyBtnText:          { color: "#090A0F", fontWeight: "700", fontSize: 15 },
});
