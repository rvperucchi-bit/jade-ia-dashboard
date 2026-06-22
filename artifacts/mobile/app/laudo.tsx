import { Feather } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useJADE } from "@/hooks/useJADE";
import { useApp } from "@/context/AppContext";


const TIPOS = [
  { id: "completo",  label: "Diagnóstico Completo",       icon: "layers",        color: "#FF0080" },
  { id: "digital",   label: "Análise de Presença Digital", icon: "globe",         color: "#FF0080" },
  { id: "potencial", label: "Potencial de Vendas",         icon: "trending-up",   color: "#8400FF" },
];

export default function LaudoScreen() {
  const colors  = useColors();
  const insets  = useSafeAreaInsets();
  const router  = useRouter();
  const topPad  = Platform.OS === "web" ? 67 : insets.top;

  const { leads, addLeadActivity } = useApp();
  const { loading, error, result, success, generate } = useJADE();

  const [negocio, setNegocio] = useState("");
  const [tipo, setTipo]       = useState("completo");
  const [copied, setCopied]   = useState(false);

  const gerar = async () => {
    if (!negocio.trim()) return;
    const tipoObj = TIPOS.find((t) => t.id === tipo)!;
    const text = await generate(`Gere um laudo executivo de marketing profissional e detalhado.\n\nNegócio analisado: ${negocio}\nTipo de análise: ${tipoObj.label}\n\nO laudo deve conter as seguintes seções claramente separadas:\n\n**DIAGNÓSTICO ATUAL**\n[Análise da situação atual do negócio, presença de mercado e posicionamento]\n\n**PONTOS FORTES**\n[Liste os principais diferenciais e forças identificados]\n\n**PONTOS DE MELHORIA**\n[Liste as principais fraquezas ou gaps]\n\n**OPORTUNIDADES IDENTIFICADAS**\n[Oportunidades de mercado e crescimento para o segmento]\n\n**RECOMENDAÇÕES ESTRATÉGICAS**\n[3 a 5 recomendações práticas e prioritárias]\n\n**SCORE DE POTENCIAL: [0-100]**\n[Justificativa do score em 1-2 linhas]\n\nUse linguagem executiva, direta e baseada no segmento/negócio descrito. Seja específico e acionável.`);
    if (text) {
      const firstWord = negocio.trim().split(/\s+/)[0].toLowerCase();
      const matched = leads.find((l) =>
        l.name.toLowerCase().includes(firstWord) || l.company.toLowerCase().includes(firstWord)
      );
      if (matched) {
        addLeadActivity(matched.id, { channel: "jade", agent: "JADE IA", note: `Laudo executivo gerado — ${tipoObj.label}.` });
      }
    }
  };

  const copyAll = async () => {
    if (!result) return;
    await Clipboard.setStringAsync(result);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <View style={[S.root, { backgroundColor: colors.background }]}>
      <View style={[S.header, { paddingTop: topPad, borderBottomColor: colors.border }]}>
        <TouchableOpacity style={S.backBtn} onPress={() => router.back()} activeOpacity={0.8}>
          <Feather name="arrow-left" size={20} color={colors.text} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={[S.headerTitle, { color: colors.text }]}>Laudo Executivo</Text>
          <Text style={[S.headerSub, { color: colors.mutedForeground }]}>Marketing e potencial de negócio</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 120 }}>
        <View style={S.form}>
          <View style={S.field}>
            <Text style={[S.label, { color: colors.text }]}>Descreva o negócio do cliente *</Text>
            <View style={[S.textarea, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <TextInput
                style={[S.textareaInput, { color: colors.text }]}
                placeholder="Ex: Pizzaria familiar no bairro centro, fundada há 8 anos, com delivery próprio e 4,2 estrelas no Google. Atende ~80 pedidos/semana..."
                placeholderTextColor={colors.mutedForeground}
                value={negocio}
                onChangeText={setNegocio}
                multiline
                numberOfLines={5}
                textAlignVertical="top"
              />
            </View>
          </View>

          <View style={S.field}>
            <Text style={[S.label, { color: colors.text }]}>Tipo de análise</Text>
            <View style={S.tipos}>
              {TIPOS.map((t) => (
                <TouchableOpacity
                  key={t.id}
                  style={[S.tipoCard, {
                    backgroundColor: tipo === t.id ? t.color + "18" : colors.surface,
                    borderColor: tipo === t.id ? t.color + "60" : colors.border,
                  }]}
                  onPress={() => setTipo(t.id)}
                  activeOpacity={0.8}
                >
                  <View style={[S.tipoIcon, { backgroundColor: t.color + "20" }]}>
                    <Feather name={t.icon as any} size={18} color={t.color} />
                  </View>
                  <Text style={[S.tipoLabel, { color: tipo === t.id ? t.color : colors.text }]}>{t.label}</Text>
                  {tipo === t.id && <Feather name="check-circle" size={16} color={t.color} />}
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <TouchableOpacity
            style={[S.genBtn, (!negocio.trim() || loading) && { opacity: 0.6 }, success && { backgroundColor: "rgba(255,255,255,0.55)" }]}
            onPress={gerar}
            activeOpacity={0.85}
            disabled={!negocio.trim() || loading}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : success
                ? <><Feather name="check" size={18} color="#fff" /><Text style={S.genBtnText}>Laudo Gerado!</Text></>
                : <><Feather name="cpu" size={18} color="#fff" /><Text style={S.genBtnText}>Gerar Laudo</Text></>}
          </TouchableOpacity>
          {!!error && (
            <View style={S.errorBox}>
              <Feather name="alert-circle" size={14} color="#FF0080" />
              <Text style={S.errorText}>{error}</Text>
            </View>
          )}
        </View>

        {!!result && (
          <View style={S.resultSection}>
            <View style={[S.resultBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={S.resultHeader}>
                <View style={S.resultBadge}>
                  <View style={[S.greenDot, { backgroundColor: colors.success }]} />
                  <Text style={[S.resultLabel, { color: colors.success }]}>Laudo gerado pela JADE</Text>
                </View>
                <TouchableOpacity onPress={copyAll} activeOpacity={0.8} style={S.copyBtn}>
                  <Feather name={copied ? "check" : "copy"} size={16} color={copied ? colors.success : colors.mutedForeground} />
                  <Text style={[S.copyText, { color: copied ? colors.success : colors.mutedForeground }]}>
                    {copied ? "Copiado!" : "Copiar laudo"}
                  </Text>
                </TouchableOpacity>
              </View>
              <Text style={[S.resultText, { color: colors.text }]}>{result}</Text>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const S = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: "row", alignItems: "center", gap: 14,
    paddingHorizontal: 20, paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 18, fontFamily: "SpaceGrotesk_700Bold" },
  headerSub: { fontSize: 13, fontFamily: "SpaceGrotesk_400Regular", marginTop: 2 },
  form: { padding: 20, gap: 18 },
  field: { gap: 8 },
  label: { fontSize: 16, fontFamily: "SpaceGrotesk_600SemiBold" },
  textarea: { borderRadius: 12, borderWidth: 1, padding: 14, minHeight: 120 },
  textareaInput: { fontSize: 16, fontFamily: "SpaceGrotesk_400Regular", lineHeight: 22 },
  tipos: { gap: 10 },
  tipoCard: {
    flexDirection: "row", alignItems: "center", gap: 12,
    borderRadius: 12, borderWidth: 1.5, padding: 14,
  },
  tipoIcon: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  tipoLabel: { flex: 1, fontSize: 16, fontFamily: "SpaceGrotesk_600SemiBold" },
  genBtn: {
    backgroundColor: "#FF0080", flexDirection: "row", alignItems: "center",
    justifyContent: "center", gap: 10, height: 52, borderRadius: 14,
    shadowColor: "#FF0080", shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 10, elevation: 6,
  },
  genBtnText: { fontSize: 16, fontFamily: "SpaceGrotesk_700Bold", color: "#fff" },
  resultSection: { paddingHorizontal: 20, paddingBottom: 20 },
  resultBox: { borderRadius: 14, borderWidth: 1, padding: 16, gap: 14 },
  resultHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  resultBadge: { flexDirection: "row", alignItems: "center", gap: 6 },
  greenDot: { width: 7, height: 7, borderRadius: 4 },
  resultLabel: { fontSize: 13, fontFamily: "SpaceGrotesk_600SemiBold" },
  copyBtn: { flexDirection: "row", alignItems: "center", gap: 6, padding: 6 },
  copyText: { fontSize: 15, fontFamily: "SpaceGrotesk_500Medium" },
  resultText: { fontSize: 16, fontFamily: "SpaceGrotesk_400Regular", lineHeight: 22 },
  errorBox: { flexDirection: "row", alignItems: "center", gap: 8, padding: 12, borderRadius: 10, backgroundColor: "#FF008018", borderWidth: 1, borderColor: "#FF008040" },
  errorText: { flex: 1, fontSize: 15, fontFamily: "SpaceGrotesk_400Regular", color: "#FF0080", lineHeight: 20 },
});
