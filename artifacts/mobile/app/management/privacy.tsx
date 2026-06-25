import React from "react";
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";

export default function PrivacyScreen() {
  return (
    <SafeAreaView style={S.container}>
      <ScrollView style={S.scroll} showsVerticalScrollIndicator={false}>
        <View style={S.securityBox}>
          <Text style={S.securityTitle}>🔒 Criptografia Ponta a Ponta Ativa</Text>
          <Text style={S.securityText}>Todas as credenciais corporativas, tokens de comunicação e históricos de mensagens capturados pelo cérebro da JADE são blindados sob chaves de criptografia AES-256 em servidores isolados em nuvem.</Text>
        </View>

        <Text style={S.sectionLabel}>CONTRATOS E TERMOS</Text>
        <View style={S.privacyItem}>
          <Text style={S.itemMain}>Termos de Uso do Ecossistema</Text>
          <Text style={S.itemSub}>Revisado em Jun/2026</Text>
        </View>
        <View style={S.privacyItem}>
          <Text style={S.itemMain}>Políticas de Conformidade LGPD</Text>
          <Text style={S.itemSub}>Conformidade Avançada</Text>
        </View>
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const S = StyleSheet.create({
  container:    { flex: 1, backgroundColor: "#090A0F" },
  scroll:       { padding: 20 },
  securityBox:  { backgroundColor: "rgba(56,161,105,0.02)", borderWidth: 1, borderColor: "rgba(56,161,105,0.15)", borderRadius: 16, padding: 18, marginBottom: 24 },
  securityTitle:{ color: "#38A169", fontSize: 15, fontWeight: "700", marginBottom: 8 },
  securityText: { color: "#8F94A8", fontSize: 13, lineHeight: 20 },
  sectionLabel: { fontSize: 11, color: "#8F94A8", fontWeight: "700", letterSpacing: 0.8, marginBottom: 12 },
  privacyItem:  { backgroundColor: "#161822", borderRadius: 12, padding: 16, borderWidth: 1, borderColor: "#242736", marginBottom: 10, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  itemMain:     { color: "#FFFFFF", fontSize: 14, fontWeight: "500" },
  itemSub:      { color: "#4E5366", fontSize: 12 },
});
