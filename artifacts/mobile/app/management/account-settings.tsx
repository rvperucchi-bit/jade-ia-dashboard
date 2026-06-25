import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

type Product = { id: number; name: string; value: string };
const TABS = ["Meu Perfil", "Cérebro da IA (Empresa)"];

export default function AccountSettingsScreen() {
  const insets    = useSafeAreaInsets();
  const router    = useRouter();

  const [tab,            setTab]            = useState(TABS[0]);
  const [isSaving,       setIsSaving]       = useState(false);
  const [userName,       setUserName]       = useState("Alexandre Silveira");
  const [userEmail,      setUserEmail]      = useState("alexandre@sleekia.com.br");
  const [companyName,    setCompanyName]    = useState("Sleek Automações");
  const [segment,        setSegment]        = useState("Tecnologia B2B");
  const [campaign,       setCampaign]       = useState("Desconto de 15% para fechamentos até sexta-feira.");
  const [city,           setCity]           = useState("Criciúma");
  const [neighborhood,   setNeighborhood]   = useState("Centro");
  const [uf,             setUf]             = useState("SC");
  const [products,       setProducts]       = useState<Product[]>([
    { id: 1, name: "Licença Software CRM", value: "299" },
    { id: 2, name: "Setup + Treinamento",  value: "1500" },
  ]);
  const [newProdName,  setNewProdName]  = useState("");
  const [newProdValue, setNewProdValue] = useState("");

  const addProduct = () => {
    if (!newProdName || !newProdValue) return;
    setProducts((p) => [...p, { id: p.length + 1, name: newProdName, value: newProdValue }]);
    setNewProdName(""); setNewProdValue("");
  };

  const save = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      Alert.alert("Cérebro Atualizado 🧠", "A JADE assimilou as novas informações e já mudou o comportamento de abordagem no WhatsApp.");
    }, 1500);
  };

  return (
    <View style={S.container}>
      {/* Top bar */}
      <View style={[S.topBar, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity style={S.iconBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <Text style={S.iconBtnText}>←</Text>
        </TouchableOpacity>
        <Text style={S.topTitle}>Configurações</Text>
        <View style={S.iconBtn} />
      </View>

      {/* Abas */}
      <View style={S.tabsWrapper}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={S.tabsScroll}>
          {TABS.map((t) => {
            const active = tab === t;
            return (
              <TouchableOpacity key={t} style={S.tabBtn} onPress={() => setTab(t)} activeOpacity={0.8}>
                <Text style={[S.tabText, active && S.tabTextActive]}>{t}</Text>
                {active && <View style={S.tabLine} />}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView style={S.form} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {tab === "Meu Perfil" && (
          <View>
            <Text style={S.label}>NOME DO EXECUTIVO</Text>
            <TextInput style={S.input} value={userName} onChangeText={setUserName} placeholderTextColor="#4E5366" />
            <Text style={S.label}>E-MAIL DE ACESSO</Text>
            <TextInput style={S.input} value={userEmail} onChangeText={setUserEmail} keyboardType="email-address" placeholderTextColor="#4E5366" />
            <TouchableOpacity style={S.secBtn} onPress={save} activeOpacity={0.8}>
              <Text style={S.secBtnText}>Salvar Perfil</Text>
            </TouchableOpacity>
          </View>
        )}

        {tab === "Cérebro da IA (Empresa)" && (
          <View>
            <View style={S.brainNotice}>
              <Text style={S.brainNoticeText}>🧠 Estes dados moldam o conhecimento da JADE durante as conversas automatizadas com os clientes.</Text>
            </View>

            <Text style={S.label}>NOME DA EMPRESA</Text>
            <TextInput style={S.input} value={companyName} onChangeText={setCompanyName} placeholderTextColor="#4E5366" />

            <Text style={S.label}>SEGMENTO DE ATUAÇÃO</Text>
            <TextInput style={S.input} value={segment} onChangeText={setSegment} placeholderTextColor="#4E5366" />

            <Text style={S.label}>PRODUTOS E VALORES DO PORTFÓLIO</Text>
            <View style={S.productList}>
              {products.map((p) => (
                <View key={p.id} style={S.productRow}>
                  <Text style={S.productName}>• {p.name}</Text>
                  <Text style={S.productValue}>R$ {p.value}</Text>
                </View>
              ))}
            </View>
            <View style={S.addRow}>
              <TextInput style={[S.input, { flex: 2, marginBottom: 0, marginRight: 8 }]} placeholder="Nome do Produto" placeholderTextColor="#4E5366" value={newProdName} onChangeText={setNewProdName} />
              <TextInput style={[S.input, { flex: 1, marginBottom: 0, marginRight: 8 }]} placeholder="R$ Valor" placeholderTextColor="#4E5366" keyboardType="numeric" value={newProdValue} onChangeText={setNewProdValue} />
              <TouchableOpacity style={S.miniBtn} onPress={addProduct} activeOpacity={0.7}>
                <Text style={S.miniBtnText}>＋</Text>
              </TouchableOpacity>
            </View>

            <Text style={S.label}>CAMPANHA / GATILHO ATIVO ATUAL</Text>
            <TextInput style={[S.input, { height: 70, paddingTop: 12, textAlignVertical: "top" }]} value={campaign} onChangeText={setCampaign} multiline placeholderTextColor="#4E5366" />

            <Text style={S.label}>LOCALIZAÇÃO DA SEDE</Text>
            <View style={{ flexDirection: "row" }}>
              <TextInput style={[S.input, { flex: 2, marginRight: 8 }]} value={city}         onChangeText={setCity}         placeholder="Cidade" placeholderTextColor="#4E5366" />
              <TextInput style={[S.input, { flex: 2, marginRight: 8 }]} value={neighborhood} onChangeText={setNeighborhood} placeholder="Bairro" placeholderTextColor="#4E5366" />
              <TextInput style={[S.input, { flex: 1 }]}                 value={uf}           onChangeText={setUf}           placeholder="UF"     placeholderTextColor="#4E5366" maxLength={2} />
            </View>

            <TouchableOpacity style={S.primaryBtn} onPress={save} disabled={isSaving} activeOpacity={0.8}>
              {isSaving ? <ActivityIndicator color="#090A0F" /> : <Text style={S.primaryBtnText}>Sincronizar Cérebro da IA 🚀</Text>}
            </TouchableOpacity>
          </View>
        )}
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const S = StyleSheet.create({
  container:       { flex: 1, backgroundColor: "#090A0F" },
  topBar:          { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, paddingBottom: 14 },
  iconBtn:         { width: 42, height: 42, borderRadius: 12, backgroundColor: "transparent", alignItems: "center", justifyContent: "center" },
  iconBtnText:     { color: "#FFFFFF", fontSize: 22 },
  topTitle:        { fontSize: 20, fontWeight: "700", color: "#FFFFFF", letterSpacing: -0.4 },
  tabsWrapper:     { borderBottomWidth: 1, borderColor: "#161822" },
  tabsScroll:      { paddingHorizontal: 20, paddingBottom: 12 },
  tabBtn:          { marginRight: 24, paddingBottom: 6, position: "relative" },
  tabText:         { fontSize: 15, fontWeight: "500", color: "#4E5366" },
  tabTextActive:   { color: "#FFFFFF", fontWeight: "700" },
  tabLine:         { position: "absolute", bottom: -13, left: 0, right: 0, height: 2, backgroundColor: "#00E5FF", borderRadius: 1 },
  form:            { padding: 20 },
  label:           { fontSize: 11, color: "#8F94A8", fontWeight: "700", letterSpacing: 0.8, marginBottom: 8, marginTop: 14 },
  input:           { backgroundColor: "#161822", height: 54, borderRadius: 12, paddingHorizontal: 16, color: "#FFFFFF", fontSize: 15, borderWidth: 1, borderColor: "#242736", marginBottom: 12 },
  brainNotice:     { backgroundColor: "rgba(0,229,255,0.03)", borderWidth: 1, borderColor: "rgba(0,229,255,0.15)", borderRadius: 12, padding: 14, marginBottom: 16 },
  brainNoticeText: { color: "#00E5FF", fontSize: 13, lineHeight: 18 },
  productList:     { backgroundColor: "#161822", borderRadius: 12, padding: 14, borderWidth: 1, borderColor: "#242736", marginBottom: 12 },
  productRow:      { flexDirection: "row", justifyContent: "space-between", paddingVertical: 6 },
  productName:     { color: "#FFFFFF", fontSize: 14, flex: 1 },
  productValue:    { color: "#8F94A8", fontSize: 14, fontWeight: "600" },
  addRow:          { flexDirection: "row", alignItems: "center", marginBottom: 20 },
  miniBtn:         { backgroundColor: "#161822", width: 54, height: 54, borderRadius: 12, borderWidth: 1, borderColor: "#00E5FF", justifyContent: "center", alignItems: "center" },
  miniBtnText:     { color: "#00E5FF", fontSize: 20, fontWeight: "600" },
  secBtn:          { backgroundColor: "#161822", height: 54, borderRadius: 12, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "#242736", marginTop: 12 },
  secBtnText:      { color: "#FFFFFF", fontWeight: "700", fontSize: 15 },
  primaryBtn:      { backgroundColor: "#FFFFFF", height: 54, borderRadius: 12, alignItems: "center", justifyContent: "center", marginTop: 24, marginBottom: 16 },
  primaryBtnText:  { color: "#090A0F", fontWeight: "700", fontSize: 15 },
});
