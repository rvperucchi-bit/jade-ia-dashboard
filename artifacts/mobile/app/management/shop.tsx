import React from "react";
import { Alert, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

const ITEMS = [
  { id: "1", title: "Pacote 1.000 Mensagens IA",        price: "R$ 89,00",     desc: "Injete mais saldo para conversas autônomas da JADE no WhatsApp." },
  { id: "2", title: "Módulo Radar Premium +200 Buscas", price: "R$ 149,00",    desc: "Varredura avançada e extração de contatos corporativos no Google Maps." },
  { id: "3", title: "Agente Extra de Atendimento",      price: "R$ 79,00/mês", desc: "Adicione mais um número de WhatsApp conectado simultaneamente ao CRM." },
];

export default function ShopScreen() {
  return (
    <SafeAreaView style={S.container}>
      <ScrollView style={S.scroll} showsVerticalScrollIndicator={false}>
        <Text style={S.subtitle}>Adicione recursos avulsos ou expanda os limites da sua operação instantaneamente.</Text>
        {ITEMS.map((item) => (
          <View key={item.id} style={S.shopCard}>
            <View style={S.cardTop}>
              <Text style={S.itemTitle}>{item.title}</Text>
              <Text style={S.itemPrice}>{item.price}</Text>
            </View>
            <Text style={S.itemDesc}>{item.desc}</Text>
            <TouchableOpacity style={S.buyBtn}
              onPress={() => Alert.alert("Pix Gerado ⚡", "Copia e cola o código Pix enviado para o seu e-mail corporativo para liberar o recurso.")}
              activeOpacity={0.8}>
              <Text style={S.buyBtnText}>Comprar via Pix Rápido</Text>
            </TouchableOpacity>
          </View>
        ))}
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const S = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#090A0F" },
  scroll:    { padding: 20 },
  subtitle:  { fontSize: 13, color: "#8F94A8", lineHeight: 18, marginBottom: 20 },
  shopCard:  { backgroundColor: "#161822", borderRadius: 16, padding: 18, borderWidth: 1, borderColor: "#242736", marginBottom: 16 },
  cardTop:   { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", borderBottomWidth: 1, borderColor: "#242736", paddingBottom: 12, marginBottom: 12 },
  itemTitle: { color: "#FFFFFF", fontSize: 15, fontWeight: "700", maxWidth: "65%" },
  itemPrice: { color: "#00E5FF", fontSize: 15, fontWeight: "700" },
  itemDesc:  { color: "#8F94A8", fontSize: 13, lineHeight: 18, marginBottom: 16 },
  buyBtn:    { backgroundColor: "#FFFFFF", height: 44, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  buyBtnText:{ color: "#090A0F", fontWeight: "700", fontSize: 14 },
});
