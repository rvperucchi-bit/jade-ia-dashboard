import React, { useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Platform,
  ActivityIndicator,
} from "react-native";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";

import { useColors } from "@/hooks/useColors";

interface AIMessage {
  id: string;
  text: string;
  sender: "user" | "jade";
  time: string;
}

const CHIPS = [
  "Qualificar lead",
  "Criar proposta",
  "Fazer follow-up",
  "Ver análise",
  "Responder cliente",
];

const JADE_RESPONSES: Record<string, string> = {
  "Qualificar lead":
    "Para qualificar este lead, preciso saber: qual o porte da empresa, qual o orçamento disponível e qual a urgência da necessidade? Quer que eu monte um roteiro de qualificação completo?",
  "Criar proposta":
    "Vou gerar uma proposta comercial personalizada. Qual o nome da empresa, o valor estimado e quais soluções deseja incluir?",
  "Fazer follow-up":
    "Aqui está uma mensagem de follow-up para você enviar:\n\n\"Olá! Queria saber se tive chance de analisar nossa proposta. Estou à disposição para esclarecer qualquer dúvida. 😊\"",
  "Ver análise":
    "📊 Análise do seu pipeline:\n• 9 leads ativos\n• Taxa de conversão: 34%\n• Ticket médio: R$ 23.400\n• Melhor canal: WhatsApp (62%)\n\nRecomendo focar nos leads em 'Proposta' — 3 estão prontos para fechar.",
  "Responder cliente":
    "Pode me passar a última mensagem do cliente? Vou criar uma resposta profissional e personalizada para você.",
};

const DEFAULT_RESPONSES = [
  "Claro! Posso te ajudar com isso. Me diga mais detalhes para eu preparar a melhor estratégia.",
  "Ótima pergunta! Com base nos seus dados, recomendo focar nos leads qualificados primeiro. Quer que eu monte um plano de ação?",
  "Entendido! Vou analisar e preparar uma resposta personalizada para você.",
  "Perfeito! Posso automatizar esse processo para você. Quer ativar o acompanhamento automático?",
];

function getBotResponse(input: string): string {
  const chip = CHIPS.find((c) => input.toLowerCase().includes(c.toLowerCase()));
  if (chip && JADE_RESPONSES[chip]) return JADE_RESPONSES[chip];
  return DEFAULT_RESPONSES[Math.floor(Math.random() * DEFAULT_RESPONSES.length)];
}

function MessageBubble({ msg, colors }: { msg: AIMessage; colors: ReturnType<typeof useColors> }) {
  const isJade = msg.sender === "jade";
  return (
    <View style={[styles.msgRow, isJade ? styles.msgLeft : styles.msgRight]}>
      {isJade && (
        <View style={[styles.jadeAvatar, { backgroundColor: colors.primary + "22" }]}>
          <MaterialCommunityIcons name="robot" size={16} color={colors.primary} />
        </View>
      )}
      <View
        style={[
          styles.bubble,
          isJade
            ? [styles.bubbleJade, { backgroundColor: colors.surface, borderColor: colors.border }]
            : [styles.bubbleUser, { backgroundColor: colors.primary }],
        ]}
      >
        <Text style={[styles.bubbleText, { color: isJade ? colors.text : "#fff" }]}>
          {msg.text}
        </Text>
        <Text style={[styles.bubbleTime, { color: isJade ? colors.mutedForeground : "rgba(255,255,255,0.7)" }]}>
          {msg.time}
        </Text>
      </View>
    </View>
  );
}

export default function JADEScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const flatRef = useRef<FlatList>(null);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const [messages, setMessages] = useState<AIMessage[]>([
    {
      id: "1",
      text: "Olá! Sou a JADE, sua agente de vendas com IA. Posso ajudar a qualificar leads, criar propostas, analisar seu pipeline e muito mais. O que você precisa hoje?",
      sender: "jade",
      time: now(),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showChips, setShowChips] = useState(true);

  function now() {
    return new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  }

  const send = async (text: string) => {
    if (!text.trim() || loading) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const userMsg: AIMessage = { id: Date.now().toString(), text: text.trim(), sender: "user", time: now() };
    setMessages((prev) => [userMsg, ...prev]);
    setInput("");
    setShowChips(false);
    setLoading(true);

    await new Promise((r) => setTimeout(r, 1200 + Math.random() * 800));
    const reply = getBotResponse(text);
    const jadeMsg: AIMessage = { id: (Date.now() + 1).toString(), text: reply, sender: "jade", time: now() };
    setMessages((prev) => [jadeMsg, ...prev]);
    setLoading(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior="padding"
      keyboardVerticalOffset={0}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 12, borderBottomColor: colors.border }]}>
        <View style={[styles.jadeIcon, { backgroundColor: colors.primary + "22" }]}>
          <MaterialCommunityIcons name="robot" size={22} color={colors.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>JADE IA</Text>
          <View style={styles.statusRow}>
            <View style={styles.greenDot} />
            <Text style={[styles.statusText, { color: colors.success }]}>Online agora</Text>
          </View>
        </View>
        <TouchableOpacity style={[styles.iconBtn, { backgroundColor: colors.surface }]}>
          <Feather name="more-vertical" size={18} color={colors.mutedForeground} />
        </TouchableOpacity>
      </View>

      {/* Messages (inverted) */}
      <FlatList
        ref={flatRef}
        data={loading ? [{ id: "__typing__", text: "", sender: "jade" as const, time: "" }, ...messages] : messages}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          if (item.id === "__typing__") {
            return (
              <View style={[styles.msgRow, styles.msgLeft]}>
                <View style={[styles.jadeAvatar, { backgroundColor: colors.primary + "22" }]}>
                  <MaterialCommunityIcons name="robot" size={16} color={colors.primary} />
                </View>
                <View style={[styles.bubble, styles.bubbleJade, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <ActivityIndicator size="small" color={colors.primary} />
                </View>
              </View>
            );
          }
          return <MessageBubble msg={item} colors={colors} />;
        }}
        inverted
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 12 }}
        keyboardDismissMode="interactive"
        keyboardShouldPersistTaps="handled"
        ListFooterComponent={<View style={{ height: 8 }} />}
      />

      {/* Chips */}
      {showChips && (
        <View style={[styles.chipsContainer]}>
          <FlatList
            horizontal
            data={CHIPS}
            keyExtractor={(c) => c}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chips}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.chip, { backgroundColor: colors.surface, borderColor: colors.border }]}
                onPress={() => send(item)}
                activeOpacity={0.8}
              >
                <Text style={[styles.chipText, { color: colors.primary }]}>{item}</Text>
              </TouchableOpacity>
            )}
          />
        </View>
      )}

      {/* Input */}
      <View style={[styles.inputBar, { borderTopColor: colors.border, backgroundColor: colors.background, paddingBottom: bottomPad + 8 }]}>
        <View style={[styles.inputWrap, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <TextInput
            style={[styles.input, { color: colors.text, fontFamily: "SpaceGrotesk_400Regular" }]}
            placeholder="Pergunte algo para a JADE..."
            placeholderTextColor={colors.mutedForeground}
            value={input}
            onChangeText={setInput}
            multiline
            maxLength={500}
            onSubmitEditing={() => send(input)}
            returnKeyType="send"
          />
          {!showChips && (
            <TouchableOpacity
              style={[styles.chipToggle]}
              onPress={() => setShowChips(true)}
              activeOpacity={0.8}
            >
              <Feather name="zap" size={16} color={colors.mutedForeground} />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity
          style={[styles.sendBtn, { backgroundColor: input.trim() ? colors.primary : colors.surface }]}
          onPress={() => send(input)}
          activeOpacity={0.8}
          disabled={!input.trim() || loading}
        >
          <Feather name="send" size={18} color={input.trim() ? "#fff" : colors.mutedForeground} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 14,
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  jadeIcon: { width: 42, height: 42, borderRadius: 21, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 17, fontFamily: "SpaceGrotesk_700Bold" },
  statusRow: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 2 },
  greenDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: "#00D68F" },
  statusText: { fontSize: 12, fontFamily: "SpaceGrotesk_400Regular" },
  iconBtn: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  msgRow: { flexDirection: "row", marginBottom: 10, alignItems: "flex-end", gap: 8 },
  msgLeft: { justifyContent: "flex-start" },
  msgRight: { justifyContent: "flex-end" },
  jadeAvatar: { width: 30, height: 30, borderRadius: 15, alignItems: "center", justifyContent: "center" },
  bubble: { maxWidth: "78%", borderRadius: 16, padding: 12 },
  bubbleJade: { borderTopLeftRadius: 4, borderWidth: 1 },
  bubbleUser: { borderTopRightRadius: 4 },
  bubbleText: { fontSize: 14, fontFamily: "SpaceGrotesk_400Regular", lineHeight: 20 },
  bubbleTime: { fontSize: 11, fontFamily: "SpaceGrotesk_400Regular", marginTop: 4, textAlign: "right" },
  chipsContainer: { paddingVertical: 8 },
  chips: { paddingHorizontal: 16, gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  chipText: { fontSize: 13, fontFamily: "SpaceGrotesk_500Medium" },
  inputBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 16,
    paddingTop: 10,
    gap: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  inputWrap: {
    flex: 1,
    flexDirection: "row",
    alignItems: "flex-end",
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  input: { flex: 1, fontSize: 15, maxHeight: 100, lineHeight: 22 },
  chipToggle: { paddingBottom: 2 },
  sendBtn: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
});
