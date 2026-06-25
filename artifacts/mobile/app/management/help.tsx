import React from "react";
import { Alert, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

const FAQ = [
  { q: "Como o robô evita bloqueios no WhatsApp?", a: "A JADE utiliza rotinas nativas de tempo de espera dinâmico (Delay) e variação gramatical nos textos para simular interações 100% humanas." },
  { q: "O Radar do Maps consome créditos do Google?", a: "Não. Toda a varredura é efetuada através dos servidores dedicados da Sleek IA, protegendo sua operação de custos adicionais de APIs." },
  { q: "Posso conectar múltiplos números de WhatsApp?", a: "Sim. No plano Pro e Enterprise você pode adicionar agentes extras de atendimento diretamente pela Loja Sleek." },
];

export default function HelpScreen() {
  return (
    <SafeAreaView style={S.container}>
      <ScrollView style={S.scroll} showsVerticalScrollIndicator={false}>
        <Text style={S.sectionLabel}>DÚVIDAS FREQUENTES</Text>
        {FAQ.map((faq, i) => (
          <View key={i} style={S.faqCard}>
            <Text style={S.faqQ}>{faq.q}</Text>
            <Text style={S.faqA}>{faq.a}</Text>
          </View>
        ))}
        <Text style={[S.sectionLabel, { marginTop: 24 }]}>SUPORTE PRIORITÁRIO</Text>
        <TouchableOpacity style={S.supportBtn}
          onPress={() => Alert.alert("Chamado Aberto ✉️", "Nossa equipe técnica entrará em contato via WhatsApp em até 15 minutos.")}
          activeOpacity={0.8}>
          <Text style={S.supportBtnText}>Falar com Engenheiro de Suporte</Text>
        </TouchableOpacity>
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const S = StyleSheet.create({
  container:    { flex: 1, backgroundColor: "#090A0F" },
  scroll:       { padding: 20 },
  sectionLabel: { fontSize: 11, color: "#8F94A8", fontWeight: "700", letterSpacing: 0.8, marginBottom: 12 },
  faqCard:      { backgroundColor: "#161822", borderRadius: 14, padding: 16, borderWidth: 1, borderColor: "#242736", marginBottom: 12 },
  faqQ:         { color: "#FFFFFF", fontSize: 14, fontWeight: "600", marginBottom: 6 },
  faqA:         { color: "#8F94A8", fontSize: 13, lineHeight: 18 },
  supportBtn:   { backgroundColor: "#161822", height: 54, borderRadius: 12, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "#00E5FF", marginTop: 6 },
  supportBtnText:{ color: "#00E5FF", fontWeight: "600", fontSize: 15 },
});
