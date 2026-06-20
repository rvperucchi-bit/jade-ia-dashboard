import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
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

const API_BASE =
  Platform.OS === "web"
    ? ""
    : `https://${process.env.EXPO_PUBLIC_DOMAIN ?? ""}`;

const ORIGENS = ["Indicação", "Scanner Radar", "WhatsApp", "Instagram", "LinkedIn", "Google", "Evento", "Outro"];

interface BriefingResult {
  resumo: string;
  dores: string;
  argumentos: string;
  perguntas: string;
  alertas: string;
}

function parseResult(text: string): BriefingResult {
  const get = (label: string) => {
    const regex = new RegExp(`\\*\\*${label}[:\\*]*\\*?\\s*([\\s\\S]*?)(?=\\n\\*\\*|$)`, "i");
    const m = text.match(regex);
    return m?.[1]?.trim() ?? "";
  };
  return {
    resumo:     get("Resumo do Perfil") || get("Perfil") || text.split("\n\n")[0] || "",
    dores:      get("Dores Prováveis") || get("Dores") || "",
    argumentos: get("Argumentos de Venda") || get("Argumentos") || "",
    perguntas:  get("Perguntas-Chave") || get("Perguntas") || "",
    alertas:    get("Alertas de Objeções") || get("Alerta") || "",
  };
}

function ResultCard({ icon, label, color, text }: { icon: string; label: string; color: string; text: string }) {
  const colors = useColors();
  if (!text) return null;
  return (
    <View style={[RC.card, { backgroundColor: colors.card, borderColor: colors.border, borderLeftColor: color, borderLeftWidth: 3 }]}>
      <View style={RC.header}>
        <View style={[RC.iconWrap, { backgroundColor: color + "20" }]}>
          <Feather name={icon as any} size={14} color={color} />
        </View>
        <Text style={[RC.label, { color }]}>{label}</Text>
      </View>
      <Text style={[RC.text, { color: colors.text }]}>{text}</Text>
    </View>
  );
}

const RC = StyleSheet.create({
  card: { borderRadius: 12, borderWidth: 1, padding: 14, gap: 10 },
  header: { flexDirection: "row", alignItems: "center", gap: 8 },
  iconWrap: { width: 28, height: 28, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  label: { fontSize: 11, fontFamily: "SpaceGrotesk_700Bold", letterSpacing: 1 },
  text: { fontSize: 13, fontFamily: "SpaceGrotesk_400Regular", lineHeight: 21 },
});

export default function BriefingScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const [lead, setLead]       = useState("");
  const [segmento, setSegmento] = useState("");
  const [origem, setOrigem]   = useState("Indicação");
  const [contexto, setContexto] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult]   = useState<BriefingResult | null>(null);

  const gerar = async () => {
    if (!lead.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      let empresaCtx = "";
      try {
        const empresaRes = await fetch(`${API_BASE}/api/empresa`);
        if (empresaRes.ok) {
          const { config } = await empresaRes.json();
          if (config?.nome) {
            empresaCtx = `Empresa que está vendendo: ${config.nome}. Produto: ${config.produto || "não informado"}. Segmento: ${config.segmento || "B2B"}.`;
          }
        }
      } catch {}

      const prompt = `Gere um briefing pré-reunião completo e estruturado. ${empresaCtx}

Dados do Lead:
- Nome/Empresa: ${lead}
- Segmento do lead: ${segmento || "Não informado"}
- Origem: ${origem}
- Contexto da reunião: ${contexto || "Primeira reunião comercial"}

Estruture a resposta com estas seções exatas (use ** para os títulos):
**Resumo do Perfil**: perfil resumido do lead em 2-3 linhas
**Dores Prováveis**: principais dores do segmento, em bullet points
**Argumentos de Venda**: 3 argumentos mais relevantes para esse lead
**Perguntas-Chave**: 5 perguntas para fazer na reunião
**Alertas de Objeções**: 2-3 objeções prováveis e como lidar`;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);
      const res = await fetch(`${API_BASE}/api/jade/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [{ role: "user", content: prompt }] }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      const data = await res.json();
      setResult(parseResult(data.message ?? data.response ?? ""));
    } catch (err: unknown) {
      const isAbort = err instanceof Error && err.name === "AbortError";
      Alert.alert(
        "Erro",
        isAbort
          ? "A JADE demorou demais para responder. Tente novamente em instantes."
          : "Não foi possível gerar o briefing. Verifique sua conexão.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[S.root, { backgroundColor: colors.background }]}>
      <View style={[S.header, { paddingTop: topPad, borderBottomColor: colors.border }]}>
        <TouchableOpacity style={[S.backBtn, { backgroundColor: colors.surface }]} onPress={() => router.back()} activeOpacity={0.8}>
          <Feather name="arrow-left" size={20} color={colors.text} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={[S.headerTitle, { color: colors.text }]}>Briefing Pré-Reunião</Text>
          <Text style={[S.headerSub, { color: colors.mutedForeground }]}>Chegue preparado para qualquer reunião</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 120 }}>
        <View style={S.form}>
          <View style={S.field}>
            <Text style={[S.label, { color: colors.text }]}>Nome do lead / empresa *</Text>
            <View style={[S.input, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Feather name="user" size={16} color={colors.mutedForeground} />
              <TextInput
                style={[S.inputText, { color: colors.text }]}
                placeholder="Ex: Pizzaria do João"
                placeholderTextColor={colors.mutedForeground}
                value={lead}
                onChangeText={setLead}
              />
            </View>
          </View>

          <View style={S.field}>
            <Text style={[S.label, { color: colors.text }]}>Segmento do lead</Text>
            <View style={[S.input, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Feather name="tag" size={16} color={colors.mutedForeground} />
              <TextInput
                style={[S.inputText, { color: colors.text }]}
                placeholder="Ex: Alimentação, Imóveis, SaaS..."
                placeholderTextColor={colors.mutedForeground}
                value={segmento}
                onChangeText={setSegmento}
              />
            </View>
          </View>

          <View style={S.field}>
            <Text style={[S.label, { color: colors.text }]}>Origem do lead</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={S.origemRow}>
              {ORIGENS.map((o) => (
                <TouchableOpacity
                  key={o}
                  style={[S.origemChip, { backgroundColor: origem === o ? "#FF0080" : colors.surface, borderColor: origem === o ? "#FF0080" : colors.border }]}
                  onPress={() => setOrigem(o)}
                  activeOpacity={0.8}
                >
                  <Text style={[S.origemText, { color: origem === o ? "#fff" : colors.mutedForeground }]}>{o}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <View style={S.field}>
            <Text style={[S.label, { color: colors.text }]}>Contexto da reunião</Text>
            <View style={[S.textarea, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <TextInput
                style={[S.textareaInput, { color: colors.text }]}
                placeholder="O que você sabe sobre esse lead? Qual é o objetivo da reunião?"
                placeholderTextColor={colors.mutedForeground}
                value={contexto}
                onChangeText={setContexto}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>
          </View>

          <TouchableOpacity
            style={[S.genBtn, (!lead.trim() || loading) && { opacity: 0.6 }]}
            onPress={gerar}
            activeOpacity={0.85}
            disabled={!lead.trim() || loading}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <><Feather name="cpu" size={18} color="#fff" /><Text style={S.genBtnText}>Gerar Briefing</Text></>}
          </TouchableOpacity>
        </View>

        {result && (
          <View style={S.results}>
            <Text style={[S.resultsTitle, { color: colors.text }]}>
              Briefing — <Text style={{ color: "#FF0080" }}>{lead}</Text>
            </Text>
            <ResultCard icon="user"       label="PERFIL DO LEAD"         color="#6C63FF" text={result.resumo} />
            <ResultCard icon="alert-circle" label="DORES PROVÁVEIS"      color="#FF0080" text={result.dores} />
            <ResultCard icon="trending-up"  label="ARGUMENTOS DE VENDA"  color="#00D68F" text={result.argumentos} />
            <ResultCard icon="help-circle"  label="PERGUNTAS-CHAVE"      color="#FFB300" text={result.perguntas} />
            <ResultCard icon="shield"        label="ALERTAS DE OBJEÇÕES" color="#FF6B35" text={result.alertas} />
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
  backBtn: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 18, fontFamily: "SpaceGrotesk_700Bold" },
  headerSub: { fontSize: 12, fontFamily: "SpaceGrotesk_400Regular", marginTop: 2 },
  form: { padding: 20, gap: 18 },
  field: { gap: 8 },
  label: { fontSize: 14, fontFamily: "SpaceGrotesk_600SemiBold" },
  input: { flexDirection: "row", alignItems: "center", borderRadius: 12, borderWidth: 1, height: 50, paddingHorizontal: 14, gap: 10 },
  inputText: { flex: 1, fontSize: 15, fontFamily: "SpaceGrotesk_400Regular" },
  origemRow: { paddingVertical: 4, gap: 8 },
  origemChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  origemText: { fontSize: 13, fontFamily: "SpaceGrotesk_500Medium" },
  textarea: { borderRadius: 12, borderWidth: 1, padding: 14, minHeight: 100 },
  textareaInput: { fontSize: 14, fontFamily: "SpaceGrotesk_400Regular", lineHeight: 22 },
  genBtn: {
    backgroundColor: "#FF0080", flexDirection: "row", alignItems: "center",
    justifyContent: "center", gap: 10, height: 52, borderRadius: 14,
    shadowColor: "#FF0080", shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 10, elevation: 6,
  },
  genBtnText: { fontSize: 16, fontFamily: "SpaceGrotesk_700Bold", color: "#fff" },
  results: { paddingHorizontal: 20, gap: 12, paddingBottom: 20 },
  resultsTitle: { fontSize: 17, fontFamily: "SpaceGrotesk_700Bold", marginBottom: 4 },
});
