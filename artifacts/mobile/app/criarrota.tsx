import { Feather } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";

const API_BASE =
  Platform.OS === "web"
    ? ""
    : `https://${process.env.EXPO_PUBLIC_DOMAIN ?? ""}`;

interface Parada {
  id: string;
  cliente: string;
  endereco: string;
  agendado: boolean;
}

function novaPar(): Parada {
  return { id: Date.now().toString(), cliente: "", endereco: "", agendado: false };
}

export default function CriarRotaScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const [paradas, setParadas] = useState<Parada[]>([novaPar()]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");
  const [copied, setCopied] = useState(false);

  const update = (id: string, key: keyof Parada, val: string | boolean) =>
    setParadas((prev) => prev.map((p) => (p.id === id ? { ...p, [key]: val } : p)));

  const addParada = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setParadas((prev) => [...prev, novaPar()]);
  };

  const removeParada = (id: string) => {
    if (paradas.length <= 1) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setParadas((prev) => prev.filter((p) => p.id !== id));
  };

  const criarRota = async () => {
    const validas = paradas.filter((p) => p.cliente.trim());
    if (validas.length < 2) {
      Alert.alert("Mínimo 2 paradas", "Adicione pelo menos 2 clientes para criar uma rota.");
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLoading(true);
    setResult("");

    const listaStr = validas.map((p, i) =>
      `${i + 1}. ${p.cliente}${p.endereco ? ` — ${p.endereco}` : ""} (${p.agendado ? "✅ Agendado" : "🔥 Lead quente não agendado"})`
    ).join("\n");

    const prompt = `Você é especialista em rotas comerciais. Otimize a seguinte rota de visitas:\n\n${listaStr}\n\nCrie:\n\n## ORDEM OTIMIZADA DE VISITAS\nListe as visitas na ordem mais eficiente por proximidade geográfica/lógica. Numeradas.\n\n## HORÁRIOS SUGERIDOS\nPara cada visita: horário de chegada sugerido, duração estimada (30-60min), tempo de deslocamento até a próxima.\n\n## OPORTUNIDADES NO CAMINHO\nPara cada lead quente não agendado: "Você vai estar perto de [Lead] por volta das [hora]. Vale uma visita surpresa — [razão específica para tentar]."\n\n## RESUMO DO DIA\n- Total de visitas: X\n- Distância estimada: X km\n- Horário previsto de término: HH:mm\n- Lead com maior potencial do dia: [nome]\n\n## LINK GOOGLE MAPS\nGere um deep link do Google Maps no formato: https://www.google.com/maps/dir/[enderecos separados por /]\nSubstitua espaços por + nos endereços.\n\nSeja prático, específico e considere horário comercial (8h–18h).`;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);
      const res = await fetch(`${API_BASE}/api/jade/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [{ role: "user", content: prompt }] }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setResult(data.message?.trim() || data.response?.trim() || "");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err: unknown) {
      const isAbort = err instanceof Error && err.name === "AbortError";
      Alert.alert(
        "Erro",
        isAbort
          ? "A JADE demorou demais para responder. Tente novamente em instantes."
          : "Não foi possível criar a rota. Verifique sua conexão.",
      );
    } finally {
      setLoading(false);
    }
  };

  const copy = async () => {
    await Clipboard.setStringAsync(result);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const openMaps = () => {
    const enderecos = paradas.filter((p) => p.endereco.trim()).map((p) => p.endereco.replace(/\s+/g, "+"));
    if (enderecos.length < 2) {
      Alert.alert("Endereços necessários", "Preencha os endereços das paradas para abrir no Maps.");
      return;
    }
    const url = `https://www.google.com/maps/dir/${enderecos.join("/")}`;
    Linking.openURL(url);
  };

  return (
    <View style={[S.root, { backgroundColor: colors.background }]}>
      <View style={[S.header, { paddingTop: topPad, borderBottomColor: colors.border }]}>
        <TouchableOpacity style={[S.backBtn, { backgroundColor: colors.surface }]} onPress={() => router.back()} activeOpacity={0.8}>
          <Feather name="arrow-left" size={20} color={colors.text} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={[S.headerTitle, { color: colors.text }]}>Criar Rota</Text>
          <Text style={[S.headerSub, { color: colors.mutedForeground }]}>Planejamento inteligente de visitas</Text>
        </View>
        <View style={[S.proBadge, { backgroundColor: "#FF008022", borderColor: "#FF008044" }]}>
          <Text style={S.proBadgeText}>PRO</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={[S.scroll, { paddingBottom: insets.bottom + 100 }]}>
        <View style={[S.infoBanner, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Feather name="map-pin" size={18} color="#FF0080" />
          <Text style={[S.infoText, { color: colors.mutedForeground }]}>
            Adicione seus compromissos do dia. A JADE otimiza a ordem, sugere horários e identifica leads quentes no caminho.
          </Text>
        </View>

        <Text style={[S.sectionLabel, { color: colors.mutedForeground }]}>PARADAS DO DIA</Text>

        {paradas.map((p, idx) => (
          <View key={p.id} style={[S.paradaCard, { backgroundColor: colors.card, borderColor: p.cliente ? "#FF008040" : colors.border }]}>
            <View style={S.paradaHeader}>
              <View style={[S.paradaNum, { backgroundColor: "#FF008020" }]}>
                <Text style={[S.paradaNumText, { color: "#FF0080" }]}>{idx + 1}</Text>
              </View>
              <Text style={[S.paradaTitle, { color: colors.text }]}>{p.cliente.trim() || `Parada ${idx + 1}`}</Text>
              <TouchableOpacity onPress={() => removeParada(p.id)} style={[S.removeBtn, { backgroundColor: "#FF3B5C18" }]} activeOpacity={0.7}>
                <Feather name="trash-2" size={15} color="#FF3B5C" />
              </TouchableOpacity>
            </View>

            <View style={[S.inputWrap, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Feather name="user" size={15} color={colors.mutedForeground} style={{ marginRight: 8 }} />
              <TextInput
                style={[S.input, { color: colors.text }]}
                placeholder="Nome do cliente / lead"
                placeholderTextColor={colors.mutedForeground}
                value={p.cliente}
                onChangeText={(v) => update(p.id, "cliente", v)}
              />
            </View>

            <View style={[S.inputWrap, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Feather name="map-pin" size={15} color={colors.mutedForeground} style={{ marginRight: 8 }} />
              <TextInput
                style={[S.input, { color: colors.text }]}
                placeholder="Endereço ou bairro"
                placeholderTextColor={colors.mutedForeground}
                value={p.endereco}
                onChangeText={(v) => update(p.id, "endereco", v)}
              />
            </View>

            <View style={[S.switchRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={{ flex: 1 }}>
                <Text style={[S.switchLabel, { color: colors.text }]}>
                  {p.agendado ? "✅ Agendado" : "🔥 Lead quente (não agendado)"}
                </Text>
                <Text style={[S.switchSub, { color: colors.mutedForeground }]}>
                  {p.agendado ? "Visita confirmada" : "A JADE vai sugerir abordagem no caminho"}
                </Text>
              </View>
              <Switch
                value={p.agendado}
                onValueChange={(v) => update(p.id, "agendado", v)}
                trackColor={{ false: colors.border, true: "#FF008080" }}
                thumbColor={p.agendado ? "#FF0080" : colors.surface}
              />
            </View>
          </View>
        ))}

        <TouchableOpacity style={[S.addBtn, { borderColor: "#FF008040" }]} onPress={addParada} activeOpacity={0.8}>
          <Feather name="plus-circle" size={17} color="#FF0080" />
          <Text style={[S.addBtnText, { color: "#FF0080" }]}>+ Adicionar Parada</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[S.criarBtn, (loading || paradas.filter(p => p.cliente.trim()).length < 2) && { opacity: 0.6 }]}
          onPress={criarRota}
          disabled={loading || paradas.filter(p => p.cliente.trim()).length < 2}
          activeOpacity={0.85}
        >
          {loading
            ? <><ActivityIndicator color="#fff" size="small" /><Text style={S.criarBtnText}>JADE planejando rota...</Text></>
            : <><Feather name="navigation" size={18} color="#fff" /><Text style={S.criarBtnText}>Criar Rota Inteligente</Text></>
          }
        </TouchableOpacity>

        {!!result && !loading && (
          <View style={[S.resultBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={S.resultHeader}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                <View style={[S.dot, { backgroundColor: "#00D68F" }]} />
                <Text style={[S.resultLabel, { color: "#00D68F" }]}>Rota criada pela JADE</Text>
              </View>
              <TouchableOpacity onPress={copy} activeOpacity={0.8} style={S.copyBtn}>
                <Feather name={copied ? "check" : "copy"} size={15} color={copied ? "#00D68F" : colors.mutedForeground} />
                <Text style={[S.copyText, { color: copied ? "#00D68F" : colors.mutedForeground }]}>{copied ? "Copiado!" : "Copiar"}</Text>
              </TouchableOpacity>
            </View>
            <Text style={[S.resultText, { color: colors.text }]}>{result}</Text>
            <TouchableOpacity style={[S.mapsBtn, { backgroundColor: "#4285F420", borderColor: "#4285F440" }]} onPress={openMaps} activeOpacity={0.85}>
              <Feather name="map" size={16} color="#4285F4" />
              <Text style={[S.mapsBtnText, { color: "#4285F4" }]}>Abrir no Google Maps</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const S = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 20, paddingBottom: 14, borderBottomWidth: StyleSheet.hairlineWidth },
  backBtn: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 18, fontFamily: "SpaceGrotesk_700Bold" },
  headerSub: { fontSize: 12, fontFamily: "SpaceGrotesk_400Regular", marginTop: 2 },
  proBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 1 },
  proBadgeText: { fontSize: 11, fontFamily: "SpaceGrotesk_700Bold", color: "#FF0080" },
  scroll: { padding: 16, gap: 14 },
  infoBanner: { flexDirection: "row", gap: 12, alignItems: "flex-start", borderRadius: 14, borderWidth: 1, padding: 14 },
  infoText: { flex: 1, fontSize: 13, fontFamily: "SpaceGrotesk_400Regular", lineHeight: 20 },
  sectionLabel: { fontSize: 11, fontFamily: "SpaceGrotesk_700Bold", letterSpacing: 1 },
  paradaCard: { borderRadius: 16, borderWidth: 1.5, padding: 14, gap: 10 },
  paradaHeader: { flexDirection: "row", alignItems: "center", gap: 10 },
  paradaNum: { width: 26, height: 26, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  paradaNumText: { fontSize: 12, fontFamily: "SpaceGrotesk_700Bold" },
  paradaTitle: { flex: 1, fontSize: 14, fontFamily: "SpaceGrotesk_600SemiBold" },
  removeBtn: { width: 32, height: 32, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  inputWrap: { flexDirection: "row", alignItems: "center", borderRadius: 10, borderWidth: 1, paddingHorizontal: 12, height: 44 },
  input: { flex: 1, fontSize: 14, fontFamily: "SpaceGrotesk_400Regular" },
  switchRow: { flexDirection: "row", alignItems: "center", gap: 10, borderRadius: 10, borderWidth: 1, padding: 12 },
  switchLabel: { fontSize: 13, fontFamily: "SpaceGrotesk_600SemiBold" },
  switchSub: { fontSize: 11, fontFamily: "SpaceGrotesk_400Regular", marginTop: 2 },
  addBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 14, borderWidth: 1.5, borderStyle: "dashed", paddingVertical: 14 },
  addBtnText: { fontSize: 15, fontFamily: "SpaceGrotesk_600SemiBold" },
  criarBtn: { backgroundColor: "#FF0080", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, height: 54, borderRadius: 14, shadowColor: "#FF0080", shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.35, shadowRadius: 14, elevation: 8 },
  criarBtnText: { fontSize: 16, fontFamily: "SpaceGrotesk_700Bold", color: "#fff" },
  resultBox: { borderRadius: 14, borderWidth: 1, padding: 16, gap: 14 },
  resultHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  dot: { width: 7, height: 7, borderRadius: 4 },
  resultLabel: { fontSize: 12, fontFamily: "SpaceGrotesk_600SemiBold" },
  copyBtn: { flexDirection: "row", alignItems: "center", gap: 6, padding: 4 },
  copyText: { fontSize: 12, fontFamily: "SpaceGrotesk_500Medium" },
  resultText: { fontSize: 14, fontFamily: "SpaceGrotesk_400Regular", lineHeight: 22 },
  mapsBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 12, borderWidth: 1, paddingVertical: 12 },
  mapsBtnText: { fontSize: 14, fontFamily: "SpaceGrotesk_600SemiBold" },
});
