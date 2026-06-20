import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useRef, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
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

const CENARIOS = [
  { id: "frio",      label: "Cliente Frio",          desc: "Nunca ouviu falar da empresa",          icon: "wind",          color: "#6C63FF" },
  { id: "objecoes",  label: "Com Objeções",           desc: "Interessado mas resistente ao preço",   icon: "shield",        color: "#FFB300" },
  { id: "quase",     label: "Quase Fechando",         desc: "Travou na última etapa",                icon: "clock",         color: "#FF0080" },
  { id: "retencao",  label: "Retenção",               desc: "Cliente insatisfeito, pensa em sair",  icon: "alert-triangle",color: "#FF6B35" },
];

const DIFICULDADES = [
  { id: "iniciante",     label: "Iniciante",     color: "#00D68F" },
  { id: "intermediario", label: "Intermediário", color: "#FFB300" },
  { id: "avancado",      label: "Avançado",      color: "#FF0080" },
];

interface Msg { role: "user" | "jade"; text: string }

function buildSystemPrompt(cenarioId: string, dificuldadeId: string, empresa: string) {
  const c = CENARIOS.find((x) => x.id === cenarioId)!;
  const d = DIFICULDADES.find((x) => x.id === dificuldadeId)!;
  const nivelMap: Record<string, string> = {
    iniciante: "Seja um cliente com dúvidas simples, facilmente convencível, mas faça pelo menos 2 objeções básicas antes de aceitar.",
    intermediario: "Seja um cliente com objeções moderadas e realistas. Questione preço, prazo e resultados. Não ceda fácil.",
    avancado: "Seja um cliente difícil e cético. Faça objeções duras, interrupa, compare com concorrentes. Só ceda se o vendedor for muito convincente.",
  };
  return `Você é um cliente simulado em um treinamento de vendas. Sua empresa/contexto: ${empresa || "pequena empresa B2B"}.

Cenário: ${c.label} — ${c.desc}
Dificuldade: ${d.label}

${nivelMap[dificuldadeId]}

REGRAS DO ROLEPLAY:
- Fique SEMPRE no personagem de cliente. Nunca quebre o personagem durante o treino.
- Responda como um cliente real responderia no WhatsApp ou em reunião.
- Não facilite demais. O vendedor precisa trabalhar a venda.
- Use linguagem informal e natural.
- Máximo 3-4 linhas por resposta.

O usuário é o vendedor. Aguarde a abordagem inicial e reaja como o cliente descrito.`;
}

export default function RoleplayScreen() {
  const colors  = useColors();
  const insets  = useSafeAreaInsets();
  const router  = useRouter();
  const topPad  = Platform.OS === "web" ? 67 : insets.top;
  const scrollRef = useRef<ScrollView>(null);

  const [stage, setStage] = useState<"config" | "chat" | "feedback">("config");
  const [cenario, setCenario]         = useState("frio");
  const [dificuldade, setDificuldade] = useState("intermediario");
  const [messages, setMessages]       = useState<Msg[]>([]);
  const [input, setInput]             = useState("");
  const [loading, setLoading]         = useState(false);
  const [feedback, setFeedback]       = useState("");
  const [feedbackLoading, setFeedbackLoading] = useState(false);

  const iniciar = async () => {
    const empresaRes = await fetch(`${API_BASE}/api/empresa`).catch(() => null);
    const { config } = empresaRes ? await empresaRes.json() : { config: null };
    const empresa = config ? `${config.nome} — ${config.produto}` : "";

    setMessages([{
      role: "jade",
      text: `Olá! Sou seu cliente simulado. Cenário: ${CENARIOS.find((c) => c.id === cenario)?.label}. Pode começar a sua abordagem! 🎯`,
    }]);
    setStage("chat");
  };

  const send = async () => {
    if (!input.trim() || loading) return;
    const userMsg: Msg = { role: "user", text: input.trim() };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setInput("");
    setLoading(true);

    const empresaRes = await fetch(`${API_BASE}/api/empresa`).catch(() => null);
    const { config } = empresaRes ? await empresaRes.json() : { config: null };
    const empresa = config ? `${config.nome} — ${config.produto}` : "";
    const systemPrompt = buildSystemPrompt(cenario, dificuldade, empresa);

    const apiMessages = [
      { role: "user", content: `[SYSTEM: ${systemPrompt}]\n\n${updated[0]?.text ?? ""}` },
      ...updated.slice(1).map((m) => ({
        role: m.role === "user" ? "user" : "user",
        content: m.role === "jade" ? `[CLIENTE]: ${m.text}` : `[VENDEDOR]: ${m.text}`,
      })),
    ];

    try {
      const ctrl1 = new AbortController();
      const t1 = setTimeout(() => ctrl1.abort(), 30000);
      const res = await fetch(`${API_BASE}/api/jade/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: apiMessages }),
        signal: ctrl1.signal,
      });
      clearTimeout(t1);
      const data = await res.json();
      setMessages((prev) => [...prev, { role: "jade", text: data.message?.trim() || data.response?.trim() || "..." }]);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    } catch (err: unknown) {
      const isAbort = err instanceof Error && err.name === "AbortError";
      setMessages((prev) => [...prev, { role: "jade", text: isAbort ? "A JADE demorou demais. Tente novamente." : "Erro de conexão." }]);
    } finally {
      setLoading(false);
    }
  };

  const encerrar = async () => {
    setFeedbackLoading(true);
    setStage("feedback");
    const transcript = messages.map((m) => `${m.role === "user" ? "VENDEDOR" : "CLIENTE"}: ${m.text}`).join("\n");
    const prompt = `Você acabou de participar de um roleplay de vendas como cliente. Agora saia do personagem e dê um feedback construtivo ao vendedor.

Transcrição da conversa:
${transcript}

Analise a performance do vendedor e estruture o feedback assim:
**O que foi bem** (pontos positivos da abordagem)
**O que pode melhorar** (pontos de desenvolvimento)
**Nota geral: [0-10]** com justificativa de 1 linha
**Dica principal** (uma ação concreta para aplicar na próxima abordagem)

Seja honesto, específico e encorajador.`;

    try {
      const ctrl2 = new AbortController();
      const t2 = setTimeout(() => ctrl2.abort(), 30000);
      const res = await fetch(`${API_BASE}/api/jade/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [{ role: "user", content: prompt }] }),
        signal: ctrl2.signal,
      });
      clearTimeout(t2);
      const data = await res.json();
      setFeedback(data.message?.trim() || data.response?.trim() || "");
    } catch (err: unknown) {
      const isAbort = err instanceof Error && err.name === "AbortError";
      setFeedback(isAbort ? "A JADE demorou demais para gerar o feedback. Tente encerrar novamente." : "Erro ao gerar feedback.");
    } finally {
      setFeedbackLoading(false);
    }
  };

  const reiniciar = () => {
    setMessages([]);
    setFeedback("");
    setStage("config");
  };

  return (
    <View style={[S.root, { backgroundColor: colors.background }]}>
      <View style={[S.header, { paddingTop: topPad, borderBottomColor: colors.border }]}>
        <TouchableOpacity style={[S.backBtn, { backgroundColor: colors.surface }]} onPress={() => router.back()} activeOpacity={0.8}>
          <Feather name="arrow-left" size={20} color={colors.text} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={[S.headerTitle, { color: colors.text }]}>Roleplay de Vendas</Text>
          <Text style={[S.headerSub, { color: colors.mutedForeground }]}>Treine com a JADE como cliente</Text>
        </View>
        <View style={[S.entBadge, { backgroundColor: "#8400FF22", borderColor: "#8400FF44" }]}>
          <Feather name="lock" size={10} color="#8400FF" />
          <Text style={S.entBadgeText}>Enterprise</Text>
        </View>
      </View>

      {stage === "config" && (
        <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
          <View style={S.configSection}>
            <Text style={[S.sectionLabel, { color: colors.mutedForeground }]}>ESCOLHA O CENÁRIO</Text>
            {CENARIOS.map((c) => (
              <TouchableOpacity
                key={c.id}
                style={[S.scenarioCard, { backgroundColor: colors.card, borderColor: cenario === c.id ? c.color + "60" : colors.border,
                  borderWidth: cenario === c.id ? 1.5 : 1 }]}
                onPress={() => setCenario(c.id)}
                activeOpacity={0.85}
              >
                <View style={[S.scenarioIcon, { backgroundColor: c.color + "20" }]}>
                  <Feather name={c.icon as any} size={18} color={c.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[S.scenarioLabel, { color: colors.text }]}>{c.label}</Text>
                  <Text style={[S.scenarioDesc, { color: colors.mutedForeground }]}>{c.desc}</Text>
                </View>
                {cenario === c.id && <Feather name="check-circle" size={18} color={c.color} />}
              </TouchableOpacity>
            ))}
          </View>

          <View style={S.configSection}>
            <Text style={[S.sectionLabel, { color: colors.mutedForeground }]}>DIFICULDADE</Text>
            <View style={S.difRow}>
              {DIFICULDADES.map((d) => (
                <TouchableOpacity
                  key={d.id}
                  style={[S.difChip, { backgroundColor: dificuldade === d.id ? d.color + "20" : colors.surface,
                    borderColor: dificuldade === d.id ? d.color + "60" : colors.border }]}
                  onPress={() => setDificuldade(d.id)}
                  activeOpacity={0.8}
                >
                  <Text style={[S.difText, { color: dificuldade === d.id ? d.color : colors.mutedForeground }]}>{d.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={S.startSection}>
            <TouchableOpacity style={S.startBtn} onPress={iniciar} activeOpacity={0.85}>
              <Feather name="play" size={18} color="#fff" />
              <Text style={S.startBtnText}>Iniciar Treino</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}

      {stage === "chat" && (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"} keyboardVerticalOffset={topPad + 56}>
          <ScrollView
            ref={scrollRef}
            contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 20 }}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
          >
            {messages.map((m, i) => (
              <View key={i} style={[S.bubble, m.role === "user" ? S.bubbleUser : S.bubbleJade]}>
                {m.role === "jade" && (
                  <View style={[S.bubbleAvatar, { backgroundColor: "#6C63FF22" }]}>
                    <Feather name="user" size={14} color="#6C63FF" />
                  </View>
                )}
                <View style={[S.bubbleBody, {
                  backgroundColor: m.role === "user" ? "#FF0080" : colors.card,
                  borderColor: m.role === "user" ? "transparent" : colors.border,
                  borderWidth: 1,
                }]}>
                  <Text style={[S.bubbleText, { color: m.role === "user" ? "#fff" : colors.text }]}>{m.text}</Text>
                </View>
              </View>
            ))}
            {loading && (
              <View style={[S.bubble, S.bubbleJade]}>
                <View style={[S.bubbleAvatar, { backgroundColor: "#6C63FF22" }]}>
                  <Feather name="user" size={14} color="#6C63FF" />
                </View>
                <View style={[S.bubbleBody, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]}>
                  <ActivityIndicator size="small" color={colors.mutedForeground} />
                </View>
              </View>
            )}
          </ScrollView>

          <View style={[S.inputBar, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
            <TextInput
              style={[S.chatInput, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
              placeholder="Sua abordagem como vendedor..."
              placeholderTextColor={colors.mutedForeground}
              value={input}
              onChangeText={setInput}
              multiline
            />
            <TouchableOpacity style={S.sendBtn} onPress={send} disabled={!input.trim() || loading} activeOpacity={0.8}>
              <Feather name="send" size={18} color="#fff" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={[S.encerrarBtn, { backgroundColor: colors.surface, borderColor: colors.border }]} onPress={encerrar} activeOpacity={0.8}>
            <Feather name="flag" size={14} color={colors.mutedForeground} />
            <Text style={[S.encerrarText, { color: colors.mutedForeground }]}>Encerrar Treino e Ver Feedback</Text>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      )}

      {stage === "feedback" && (
        <ScrollView contentContainerStyle={{ padding: 20, gap: 16, paddingBottom: 120 }}>
          <View style={[S.feedbackHeader, { backgroundColor: "#00D68F15", borderColor: "#00D68F40" }]}>
            <Feather name="award" size={28} color="#00D68F" />
            <View>
              <Text style={[S.feedbackTitle, { color: colors.text }]}>Treino Encerrado!</Text>
              <Text style={[S.feedbackSub, { color: colors.mutedForeground }]}>Aqui está o seu feedback da JADE</Text>
            </View>
          </View>

          {feedbackLoading
            ? <ActivityIndicator size="large" color="#FF0080" style={{ marginTop: 40 }} />
            : (
              <View style={[S.feedbackBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={[S.feedbackText, { color: colors.text }]}>{feedback}</Text>
              </View>
            )
          }

          <TouchableOpacity style={S.startBtn} onPress={reiniciar} activeOpacity={0.85}>
            <Feather name="refresh-cw" size={16} color="#fff" />
            <Text style={S.startBtnText}>Novo Treino</Text>
          </TouchableOpacity>
        </ScrollView>
      )}
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
  entBadge: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, borderWidth: 1 },
  entBadgeText: { fontSize: 10, fontFamily: "SpaceGrotesk_700Bold", color: "#8400FF" },
  configSection: { padding: 20, gap: 12 },
  sectionLabel: { fontSize: 11, fontFamily: "SpaceGrotesk_700Bold", letterSpacing: 1 },
  scenarioCard: { flexDirection: "row", alignItems: "center", gap: 12, borderRadius: 14, padding: 14 },
  scenarioIcon: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  scenarioLabel: { fontSize: 15, fontFamily: "SpaceGrotesk_600SemiBold" },
  scenarioDesc: { fontSize: 12, fontFamily: "SpaceGrotesk_400Regular", marginTop: 2 },
  difRow: { flexDirection: "row", gap: 10 },
  difChip: { flex: 1, alignItems: "center", paddingVertical: 12, borderRadius: 12, borderWidth: 1.5 },
  difText: { fontSize: 13, fontFamily: "SpaceGrotesk_600SemiBold" },
  startSection: { paddingHorizontal: 20, paddingTop: 8 },
  startBtn: {
    backgroundColor: "#FF0080", flexDirection: "row", alignItems: "center",
    justifyContent: "center", gap: 10, height: 52, borderRadius: 14,
    shadowColor: "#FF0080", shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 10, elevation: 6,
  },
  startBtnText: { fontSize: 16, fontFamily: "SpaceGrotesk_700Bold", color: "#fff" },
  bubble: { flexDirection: "row", alignItems: "flex-end", gap: 8, maxWidth: "85%" },
  bubbleUser: { alignSelf: "flex-end", flexDirection: "row-reverse" },
  bubbleJade: { alignSelf: "flex-start" },
  bubbleAvatar: { width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  bubbleBody: { borderRadius: 16, padding: 12, maxWidth: "100%" },
  bubbleText: { fontSize: 14, fontFamily: "SpaceGrotesk_400Regular", lineHeight: 20 },
  inputBar: {
    flexDirection: "row", alignItems: "flex-end", gap: 10,
    paddingHorizontal: 16, paddingVertical: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  chatInput: {
    flex: 1, borderRadius: 20, borderWidth: 1, paddingHorizontal: 16,
    paddingVertical: 10, fontSize: 14, fontFamily: "SpaceGrotesk_400Regular",
    maxHeight: 100,
  },
  sendBtn: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: "#FF0080",
    alignItems: "center", justifyContent: "center",
  },
  encerrarBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, marginHorizontal: 16, marginBottom: 8, paddingVertical: 10,
    borderRadius: 10, borderWidth: 1,
  },
  encerrarText: { fontSize: 13, fontFamily: "SpaceGrotesk_500Medium" },
  feedbackHeader: { flexDirection: "row", alignItems: "center", gap: 14, padding: 16, borderRadius: 14, borderWidth: 1 },
  feedbackTitle: { fontSize: 18, fontFamily: "SpaceGrotesk_700Bold" },
  feedbackSub: { fontSize: 13, fontFamily: "SpaceGrotesk_400Regular", marginTop: 2 },
  feedbackBox: { borderRadius: 14, borderWidth: 1, padding: 16 },
  feedbackText: { fontSize: 14, fontFamily: "SpaceGrotesk_400Regular", lineHeight: 22 },
});
