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

const CHIPS = [
  { id: "caro",       label: "Está caro",            emoji: "💸" },
  { id: "pensar",     label: "Preciso pensar",        emoji: "🤔" },
  { id: "socio",      label: "Falar com sócio",       emoji: "👥" },
  { id: "fornecedor", label: "Já tenho fornecedor",   emoji: "🔒" },
  { id: "prioridade", label: "Não é prioridade agora",emoji: "⏰" },
  { id: "orcamento",  label: "Sem orçamento",         emoji: "❌" },
];

export default function ObjectionScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const { loading, error, result, success, generate } = useJADE();

  const [reuniao, setReuniao] = useState("");
  const [objecoesTexto, setObjecoesTexto] = useState("");
  const [chipsSelected, setChipsSelected] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);

  const toggleChip = (id: string) => {
    Haptics.selectionAsync();
    setChipsSelected((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  };

  const gerar = async () => {
    const objecoesChips = chipsSelected.map((id) => CHIPS.find((c) => c.id === id)?.label ?? "").filter(Boolean);
    const todasObjecoes = [...objecoesChips, objecoesTexto.trim()].filter(Boolean).join("; ");
    if (!todasObjecoes) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await generate(`Você é a JADE, especialista em vendas consultivas e psicologia de objeções. Analise a situação abaixo e gere uma estratégia de contorno.\n\nContexto da reunião: ${reuniao.trim() || "Reunião comercial — detalhes não informados"}\n\nObjeções levantadas: ${todasObjecoes}\n\nEstruture a resposta assim:\n\n## ANÁLISE DA OBJEÇÃO\nPor que o cliente disse isso? Qual a objeção real por trás? (psicologia, não medo superficial)\n\n## 3 SCRIPTS DE RESPOSTA\nDo mais suave ao mais direto. Para cada um: nome do estilo, script completo pronto para usar.\n\n**Script 1 — Empático:**\n[texto]\n\n**Script 2 — Consultivo:**\n[texto]\n\n**Script 3 — Direto ao Ponto:**\n[texto]\n\n## PERGUNTA-CHAVE\nUma única pergunta para fazer na próxima interação para reabrir o diálogo.\n\n## PRÓXIMO PASSO RECOMENDADO\nAção concreta: follow-up, nova proposta, reunião de demonstração, etc. Com prazo sugerido.\n\nTom: parceiro estratégico, nunca robótico. Linguagem natural e direta em português do Brasil.`);
  };

  const copy = async () => {
    if (!result) return;
    await Clipboard.setStringAsync(result);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const canGerar = chipsSelected.length > 0 || objecoesTexto.trim().length > 0;

  return (
    <View style={[S.root, { backgroundColor: colors.background }]}>
      <View style={[S.header, { paddingTop: topPad, borderBottomColor: colors.border }]}>
        <TouchableOpacity style={[S.backBtn, { backgroundColor: colors.surface }]} onPress={() => router.back()} activeOpacity={0.8}>
          <Feather name="arrow-left" size={20} color={colors.text} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={[S.headerTitle, { color: colors.text }]}>Ajuda com Objeções</Text>
          <Text style={[S.headerSub, { color: colors.mutedForeground }]}>Estratégias prontas para qualquer objeção</Text>
        </View>
        <View style={[S.proBadge, { backgroundColor: "#FF008022", borderColor: "#FF008044" }]}>
          <Text style={S.proBadgeText}>PRO</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={[S.scroll, { paddingBottom: insets.bottom + 100 }]}>
        <View style={S.field}>
          <Text style={[S.label, { color: colors.mutedForeground }]}>COMO FOI A REUNIÃO?</Text>
          <View style={[S.textareaWrap, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <TextInput
              style={[S.textarea, { color: colors.text }]}
              placeholder="Ex: Apresentei o plano Pro para o gerente da farmácia. Ele ficou interessado no começo, mas no final travou..."
              placeholderTextColor={colors.mutedForeground}
              value={reuniao}
              onChangeText={setReuniao}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>
        </View>

        <View style={S.field}>
          <Text style={[S.label, { color: colors.mutedForeground }]}>OBJEÇÕES MAIS COMUNS</Text>
          <Text style={[S.labelSub, { color: colors.mutedForeground }]}>Selecione as que surgiram</Text>
          <View style={S.chips}>
            {CHIPS.map((chip) => {
              const sel = chipsSelected.includes(chip.id);
              return (
                <TouchableOpacity
                  key={chip.id}
                  style={[S.chip, { backgroundColor: sel ? "#FF008018" : colors.card, borderColor: sel ? "#FF0080" : colors.border, borderWidth: sel ? 1.5 : 1 }]}
                  onPress={() => toggleChip(chip.id)}
                  activeOpacity={0.8}
                >
                  <Text style={S.chipEmoji}>{chip.emoji}</Text>
                  <Text style={[S.chipLabel, { color: sel ? "#FF0080" : colors.text }]}>{chip.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={S.field}>
          <Text style={[S.label, { color: colors.mutedForeground }]}>OUTRAS OBJEÇÕES (opcional)</Text>
          <View style={[S.textareaWrap, { backgroundColor: colors.card, borderColor: colors.border, minHeight: 70 }]}>
            <TextInput
              style={[S.textarea, { color: colors.text }]}
              placeholder="Descreva outras objeções específicas que surgiram..."
              placeholderTextColor={colors.mutedForeground}
              value={objecoesTexto}
              onChangeText={setObjecoesTexto}
              multiline
              textAlignVertical="top"
            />
          </View>
        </View>

        <TouchableOpacity
          style={[S.gerarBtn, (!canGerar || loading) && { opacity: 0.6 }, success && { backgroundColor: "#00D68F" }]}
          onPress={gerar}
          disabled={!canGerar || loading}
          activeOpacity={0.85}
        >
          {loading
            ? <><ActivityIndicator color="#fff" size="small" /><Text style={S.gerarBtnText}>JADE analisando...</Text></>
            : success
              ? <><Feather name="check" size={18} color="#fff" /><Text style={S.gerarBtnText}>Estratégia Gerada!</Text></>
              : <><Feather name="shield" size={18} color="#fff" /><Text style={S.gerarBtnText}>Gerar Estratégia de Contorno</Text></>
          }
        </TouchableOpacity>
        {!!error && (
          <View style={S.errorBox}>
            <Feather name="alert-circle" size={14} color="#FF6B6B" />
            <Text style={S.errorText}>{error}</Text>
          </View>
        )}

        {!!result && !loading && (
          <View style={[S.resultBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={S.resultHeader}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                <View style={[S.dot, { backgroundColor: "#00D68F" }]} />
                <Text style={[S.resultLabel, { color: "#00D68F" }]}>Estratégia gerada pela JADE</Text>
              </View>
              <TouchableOpacity onPress={copy} activeOpacity={0.8} style={S.copyBtn}>
                <Feather name={copied ? "check" : "copy"} size={15} color={copied ? "#00D68F" : colors.mutedForeground} />
                <Text style={[S.copyText, { color: copied ? "#00D68F" : colors.mutedForeground }]}>{copied ? "Copiado!" : "Copiar"}</Text>
              </TouchableOpacity>
            </View>
            <Text style={[S.resultText, { color: colors.text }]}>{result}</Text>
            <TouchableOpacity style={[S.regenBtn, { borderColor: colors.border }]} onPress={gerar} activeOpacity={0.8}>
              <Feather name="refresh-cw" size={14} color="#FF0080" />
              <Text style={[S.regenText, { color: "#FF0080" }]}>Gerar nova estratégia</Text>
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
  backBtn: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 18, fontFamily: "SpaceGrotesk_700Bold" },
  headerSub: { fontSize: 13, fontFamily: "SpaceGrotesk_400Regular", marginTop: 2 },
  proBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 1 },
  proBadgeText: { fontSize: 11, fontFamily: "SpaceGrotesk_700Bold", color: "#FF0080" },
  scroll: { padding: 16, gap: 16 },
  field: { gap: 8 },
  label: { fontSize: 11, fontFamily: "SpaceGrotesk_700Bold", letterSpacing: 1 },
  labelSub: { fontSize: 13, fontFamily: "SpaceGrotesk_400Regular", marginTop: -4 },
  textareaWrap: { borderRadius: 12, borderWidth: 1, padding: 14, minHeight: 100 },
  textarea: { fontSize: 16, fontFamily: "SpaceGrotesk_400Regular", lineHeight: 22 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 9, borderRadius: 12 },
  chipEmoji: { fontSize: 16 },
  chipLabel: { fontSize: 15, fontFamily: "SpaceGrotesk_500Medium" },
  gerarBtn: { backgroundColor: "#FF0080", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, height: 54, borderRadius: 14, shadowColor: "#FF0080", shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.35, shadowRadius: 14, elevation: 8 },
  gerarBtnText: { fontSize: 16, fontFamily: "SpaceGrotesk_700Bold", color: "#fff" },
  resultBox: { borderRadius: 14, borderWidth: 1, padding: 16, gap: 14 },
  resultHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  dot: { width: 7, height: 7, borderRadius: 4 },
  resultLabel: { fontSize: 13, fontFamily: "SpaceGrotesk_600SemiBold" },
  copyBtn: { flexDirection: "row", alignItems: "center", gap: 6, padding: 4 },
  copyText: { fontSize: 13, fontFamily: "SpaceGrotesk_500Medium" },
  resultText: { fontSize: 16, fontFamily: "SpaceGrotesk_400Regular", lineHeight: 22 },
  regenBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 10, borderRadius: 10, borderWidth: 1 },
  regenText: { fontSize: 15, fontFamily: "SpaceGrotesk_600SemiBold" },
  errorBox: { flexDirection: "row", alignItems: "center", gap: 8, padding: 12, borderRadius: 10, backgroundColor: "#FF6B6B18", borderWidth: 1, borderColor: "#FF6B6B40" },
  errorText: { flex: 1, fontSize: 15, fontFamily: "SpaceGrotesk_400Regular", color: "#FF6B6B", lineHeight: 20 },
});
