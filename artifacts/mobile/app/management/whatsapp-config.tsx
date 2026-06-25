import React, { useState } from "react";
import { Alert, SafeAreaView, ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from "react-native";

export default function WhatsAppConfigScreen() {
  const [autoReply,     setAutoReply]     = useState(true);
  const [aiNegotiation, setAiNegotiation] = useState(true);
  const [delayTime,     setDelayTime]     = useState("25");
  const [welcomeMsg,    setWelcomeMsg]    = useState("Olá! Sou a JADE, assistente virtual da empresa. Identifiquei seu interesse e já estou separando as melhores opções para você. Em que posso ajudar de imediato?");

  return (
    <SafeAreaView style={S.container}>
      <ScrollView style={S.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={S.banner}>
          <Text style={S.bannerText}>⚙️ Calibre o comportamento dos gatilhos de mensagens e respostas da JADE no WhatsApp.</Text>
        </View>

        <View style={S.card}>
          <View style={{ flex: 1, marginRight: 12 }}>
            <Text style={S.cardTitle}>Respostas Automáticas</Text>
            <Text style={S.cardSub}>Permitir que a JADE inicie conversas com leads interceptados no Maps</Text>
          </View>
          <Switch value={autoReply} onValueChange={setAutoReply} trackColor={{ false: "#242736", true: "#00E5FF" }} thumbColor="#FFFFFF" />
        </View>

        <View style={S.card}>
          <View style={{ flex: 1, marginRight: 12 }}>
            <Text style={S.cardTitle}>Negociação Avançada com IA</Text>
            <Text style={S.cardSub}>Dar autonomia para a JADE apresentar preços e tentar fechar reuniões</Text>
          </View>
          <Switch value={aiNegotiation} onValueChange={setAiNegotiation} trackColor={{ false: "#242736", true: "#00E5FF" }} thumbColor="#FFFFFF" />
        </View>

        <Text style={S.label}>TEMPO DE ESPERA ANTES DE ENVIAR (SEGUNDOS)</Text>
        <TextInput style={S.input} value={delayTime} onChangeText={setDelayTime} keyboardType="numeric" placeholder="Ex: 30" placeholderTextColor="#4E5366" />
        <Text style={S.helper}>Simula comportamento humano para evitar bloqueios na API do WhatsApp.</Text>

        <Text style={S.label}>MENSAGEM DE SAUDAÇÃO INICIAL</Text>
        <TextInput style={[S.input, { height: 100, paddingTop: 12, textAlignVertical: "top" }]} value={welcomeMsg} onChangeText={setWelcomeMsg} multiline placeholderTextColor="#4E5366" />

        <TouchableOpacity style={S.saveBtn} onPress={() => Alert.alert("Sucesso 🚀", "Configurações integradas ao cérebro da JADE!")} activeOpacity={0.8}>
          <Text style={S.saveBtnText}>Salvar e Sincronizar Instância 🚀</Text>
        </TouchableOpacity>
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const S = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#090A0F" },
  scroll:    { padding: 20 },
  banner:    { backgroundColor: "rgba(0,229,255,0.03)", borderWidth: 1, borderColor: "rgba(0,229,255,0.15)", borderRadius: 12, padding: 14, marginBottom: 20 },
  bannerText:{ color: "#00E5FF", fontSize: 13, lineHeight: 18 },
  card:      { flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: "#161822", padding: 16, borderRadius: 14, borderWidth: 1, borderColor: "#242736", marginBottom: 14 },
  cardTitle: { color: "#FFFFFF", fontSize: 15, fontWeight: "600", marginBottom: 2 },
  cardSub:   { color: "#8F94A8", fontSize: 12, lineHeight: 16 },
  label:     { fontSize: 11, color: "#8F94A8", fontWeight: "700", letterSpacing: 0.8, marginBottom: 8, marginTop: 16 },
  input:     { backgroundColor: "#161822", height: 54, borderRadius: 12, paddingHorizontal: 16, color: "#FFFFFF", fontSize: 15, borderWidth: 1, borderColor: "#242736", marginBottom: 6 },
  helper:    { color: "#4E5366", fontSize: 11, marginBottom: 14 },
  saveBtn:   { backgroundColor: "#FFFFFF", height: 54, borderRadius: 12, alignItems: "center", justifyContent: "center", marginTop: 20 },
  saveBtnText:{ color: "#090A0F", fontWeight: "700", fontSize: 15 },
});
