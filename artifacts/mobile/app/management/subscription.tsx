import React, { useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

type Tier = { id: string; name: string; price: string; features: string[] };

const TIERS: Tier[] = [
  {
    id: "start",
    name: "JADE Start",
    price: "R$ 199/mês",
    features: [
      "Até 100 leads ativos/mês",
      "Disparos automáticos básicos",
      "Suporte via e-mail",
      "1 Robô ativo no Maps",
    ],
  },
  {
    id: "pro",
    name: "JADE Pro",
    price: "R$ 499/mês",
    features: [
      "Leads ativos ILIMITADOS",
      "Cérebro avançado da JADE",
      "Integração WhatsApp nativa",
      "Laudos de performance em tempo real",
      "Suporte prioritário 24/7",
    ],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: "Sob Consulta",
    features: [
      "Múltiplos agentes autônomos",
      "Customização avançada de LLM",
      "Painel de auditoria multi-vendedores",
      "API dedicada de disparo de Push",
      "Gerente de conta exclusivo",
    ],
  },
];

export default function SubscriptionScreen() {
  const insets       = useSafeAreaInsets();
  const router       = useRouter();
  const [currentPlan, setCurrentPlan] = useState("start");

  const handleUpgrade = (tier: Tier) => {
    if (tier.id === currentPlan) {
      Alert.alert("Plano Ativo", "Sua empresa já está utilizando este plano atualmente.");
      return;
    }
    Alert.alert(
      "Confirmar Upgrade 💳",
      `Deseja migrar a assinatura para o plano ${tier.name}?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Confirmar",
          onPress: () => {
            setCurrentPlan(tier.id);
            Alert.alert("Sucesso 🎉", `Upgrade realizado! O ecossistema ${tier.name} já está liberado.`);
          },
        },
      ]
    );
  };

  return (
    <View style={S.container}>
      {/* Top bar */}
      <View style={[S.topBar, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity style={S.iconBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <Text style={S.iconBtnText}>←</Text>
        </TouchableOpacity>
        <View style={{ alignItems: "center" }}>
          <Text style={S.topSubtitle}>ASSINATURA</Text>
          <Text style={S.topTitle}>Planos & Upgrade</Text>
        </View>
        <View style={S.iconBtn} />
      </View>

      <ScrollView style={S.form} showsVerticalScrollIndicator={false}>
        <Text style={S.subtitle}>Evolua a infraestrutura tecnológica do seu time conforme sua operação cresce</Text>
        <Text style={S.sectionLabel}>ESCOLHA SEU PLANO DE CRESCIMENTO</Text>

        {TIERS.map((tier) => {
          const active = currentPlan === tier.id;
          return (
            <View key={tier.id} style={[S.tierCard, active && S.tierCardActive]}>
              <View style={S.cardHeader}>
                <View>
                  <Text style={S.tierName}>{tier.name}</Text>
                  {active && <Text style={S.activeLbl}>✨ PLANO ATUAL</Text>}
                </View>
                <Text style={S.tierPrice}>{tier.price}</Text>
              </View>

              <View style={{ marginVertical: 16 }}>
                {tier.features.map((f, i) => (
                  <Text key={i} style={S.featureText}>✓  {f}</Text>
                ))}
              </View>

              <TouchableOpacity
                style={[S.actionBtn, active ? S.btnActive : S.btnInactive]}
                onPress={() => handleUpgrade(tier)}
                activeOpacity={0.8}
              >
                <Text style={[S.btnText, active && { color: "#00E5FF" }]}>
                  {active ? "Plano Ativo na Conta" : "Fazer Upgrade para este Plano"}
                </Text>
              </TouchableOpacity>
            </View>
          );
        })}
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const S = StyleSheet.create({
  container:      { flex: 1, backgroundColor: "#090A0F" },
  topBar:         { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, paddingBottom: 14 },
  iconBtn:        { width: 44, height: 44, borderRadius: 22, backgroundColor: "rgba(255,255,255,0.08)", borderWidth: 1, borderColor: "rgba(255,255,255,0.12)", alignItems: "center", justifyContent: "center" },
  iconBtnText:    { color: "#FFFFFF", fontSize: 22 },
  topSubtitle:    { fontSize: 11, color: "#8F94A8", fontWeight: "600", letterSpacing: 0.5, textTransform: "uppercase" },
  topTitle:       { fontSize: 20, fontWeight: "700", color: "#FFFFFF", letterSpacing: -0.4 },
  form:           { padding: 20 },
  subtitle:       { fontSize: 13, color: "#8F94A8", marginBottom: 20, lineHeight: 18 },
  sectionLabel:   { fontSize: 11, color: "#8F94A8", fontWeight: "700", letterSpacing: 0.8, marginBottom: 16 },
  tierCard:       { backgroundColor: "#161822", borderRadius: 16, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: "#242736" },
  tierCardActive: { borderColor: "#00E5FF", backgroundColor: "rgba(0,229,255,0.01)" },
  cardHeader:     { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", borderBottomWidth: 1, borderColor: "#242736", paddingBottom: 14 },
  tierName:       { color: "#FFFFFF", fontSize: 18, fontWeight: "700" },
  activeLbl:      { color: "#00E5FF", fontSize: 11, fontWeight: "700", marginTop: 4, letterSpacing: 0.5 },
  tierPrice:      { color: "#FFFFFF", fontSize: 16, fontWeight: "700" },
  featureText:    { color: "#8F94A8", fontSize: 13, paddingVertical: 4, lineHeight: 18 },
  actionBtn:      { height: 48, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  btnActive:      { backgroundColor: "transparent", borderWidth: 1, borderColor: "rgba(0,229,255,0.2)" },
  btnInactive:    { backgroundColor: "#FFFFFF" },
  btnText:        { color: "#090A0F", fontWeight: "700", fontSize: 14 },
});
