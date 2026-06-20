import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Platform,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
} from "react-native";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";

import { useColors } from "@/hooks/useColors";
import { useApp } from "@/context/AppContext";

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

const API_BASE =
  Platform.OS === "web"
    ? ""
    : `https://${process.env.EXPO_PUBLIC_DOMAIN ?? ""}`;

function nowTime() {
  return new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

const WELCOME: AIMessage = {
  id: "welcome",
  text: "Olá! Sou a JADE, sua agente de vendas com IA. Posso ajudar a qualificar leads, criar propostas, analisar seu pipeline e muito mais. O que você precisa hoje?",
  sender: "jade",
  time: nowTime(),
};

function MessageBubble({ msg, colors }: { msg: AIMessage; colors: ReturnType<typeof useColors> }) {
  const isJade = msg.sender === "jade";
  return (
    <View style={[styles.msgRow, isJade ? styles.msgLeft : styles.msgRight]}>
      {isJade && (
        <View style={[styles.jadeAvatar, { backgroundColor: colors.primary + "22" }]}>
          <MaterialCommunityIcons name="robot" size={16} color={colors.primary} />
        </View>
      )}
      <View style={[styles.bubble, isJade
        ? [styles.bubbleJade, { backgroundColor: colors.surface, borderColor: colors.border }]
        : [styles.bubbleUser, { backgroundColor: colors.primary }]]}>
        <Text style={[styles.bubbleText, { color: isJade ? colors.text : "#fff" }]}>{msg.text}</Text>
        <Text style={[styles.bubbleTime, { color: isJade ? colors.mutedForeground : "rgba(255,255,255,0.7)" }]}>{msg.time}</Text>
      </View>
    </View>
  );
}

function TypingBubble({ colors }: { colors: ReturnType<typeof useColors> }) {
  return (
    <View style={[styles.msgRow, styles.msgLeft]}>
      <View style={[styles.jadeAvatar, { backgroundColor: colors.primary + "22" }]}>
        <MaterialCommunityIcons name="robot" size={16} color={colors.primary} />
      </View>
      <View style={[styles.bubble, styles.bubbleJade, { backgroundColor: colors.surface, borderColor: colors.border, minWidth: 60, alignItems: "center" }]}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    </View>
  );
}

export default function JADEScreen() {
  const colors  = useColors();
  const insets  = useSafeAreaInsets();
  const router  = useRouter();
  const { addActivityEvent } = useApp();

  const topPad    = Platform.OS === "web" ? 67 : insets.top;
  const TAB_BAR_H = Platform.OS === "web" ? 84 : 60;
  const bottomPad = TAB_BAR_H + (Platform.OS === "web" ? 0 : insets.bottom);

  const [messages,   setMessages]   = useState<AIMessage[]>([WELCOME]);
  const [input,      setInput]      = useState("");
  const [loading,    setLoading]    = useState(false);
  const [showChips,  setShowChips]  = useState(true);
  const [sessionId,  setSessionId]  = useState<string | null>(null);
  const sessionCreating = useRef(false);

  // Create a session on first real message
  const ensureSession = async (): Promise<string | null> => {
    if (sessionId) return sessionId;
    if (sessionCreating.current) return null;
    sessionCreating.current = true;
    try {
      const res = await fetch(`${API_BASE}/api/jade/sessions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "Nova conversa" }),
      });
      if (res.ok) {
        const data = (await res.json()) as { session?: { id: string } };
        if (data.session?.id) {
          setSessionId(data.session.id);
          return data.session.id;
        }
      }
    } catch { /* ignore */ }
    finally { sessionCreating.current = false; }
    return null;
  };

  const buildHistory = (msgs: AIMessage[]) =>
    [...msgs].reverse().map((m) => ({
      role: m.sender === "jade" ? "model" : "user",
      content: m.text,
    }));

  const send = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const sid = await ensureSession();
    const userMsg: AIMessage = { id: Date.now().toString(), text: trimmed, sender: "user", time: nowTime() };
    const updatedMsgs = [userMsg, ...messages];
    setMessages(updatedMsgs);
    setInput("");
    setShowChips(false);
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE}/api/jade/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: buildHistory(updatedMsgs),
          session_id: sid,
        }),
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const data = (await response.json()) as { message?: string; error?: string };
      const replyText = data.message?.trim() || "Desculpe, não consegui processar sua mensagem. Tente novamente.";

      setMessages((prev) => [{ id: (Date.now() + 1).toString(), text: replyText, sender: "jade", time: nowTime() }, ...prev]);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      await addActivityEvent({
        type: "message",
        text: `JADE respondeu: "${trimmed.slice(0, 30)}${trimmed.length > 30 ? "…" : ""}"`,
        icon: "robot",
        color: "#FF0080",
      });
    } catch {
      setMessages((prev) => [{
        id: (Date.now() + 1).toString(),
        text: "Ops! Tive um problema de conexão. Verifique sua internet e tente novamente.",
        sender: "jade",
        time: nowTime(),
      }, ...prev]);
    } finally {
      setLoading(false);
    }
  };

  const resetConversation = () => {
    setMessages([{ ...WELCOME, id: "welcome-" + Date.now(), time: nowTime() }]);
    setShowChips(true);
    setSessionId(null);
    sessionCreating.current = false;
  };

  const renderData: AIMessage[] = loading
    ? [{ id: "__typing__", text: "", sender: "jade", time: "" }, ...messages]
    : messages;

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
            <Text style={[styles.statusText, { color: colors.success }]}>
              Gemini 2.5 Flash · Online{sessionId ? " · Sessão salva" : ""}
            </Text>
          </View>
        </View>
        <TouchableOpacity style={[styles.iconBtn, { backgroundColor: colors.surface }]}
          onPress={() => router.push("/marketing" as any)} activeOpacity={0.8}>
          <Feather name="zap" size={16} color={colors.primary} />
        </TouchableOpacity>
        <TouchableOpacity style={[styles.iconBtn, { backgroundColor: colors.surface }]}
          onPress={resetConversation} activeOpacity={0.8}>
          <Feather name="rotate-ccw" size={16} color={colors.mutedForeground} />
        </TouchableOpacity>
      </View>

      {/* Messages */}
      <FlatList
        data={renderData}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          if (item.id === "__typing__") return <TypingBubble colors={colors} />;
          return <MessageBubble msg={item} colors={colors} />;
        }}
        inverted
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 12 }}
        keyboardDismissMode="interactive"
        keyboardShouldPersistTaps="handled"
        ListFooterComponent={<View style={{ height: 8 }} />}
      />

      {/* Shortcut chips */}
      {showChips && (
        <View style={styles.chipsContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chips} keyboardShouldPersistTaps="always">
            {CHIPS.map((chip) => (
              <TouchableOpacity key={chip}
                style={[styles.chip, { backgroundColor: colors.surface, borderColor: colors.border }]}
                onPress={() => send(chip)} activeOpacity={0.7}>
                <Text style={[styles.chipText, { color: colors.primary }]}>{chip}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Input bar */}
      <View style={[styles.inputBar, { borderTopColor: colors.border, backgroundColor: colors.background, paddingBottom: bottomPad + 8 }]}>
        <View style={[styles.inputWrap, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <TextInput
            style={[styles.input, { color: colors.text, fontFamily: "SpaceGrotesk_400Regular" }]}
            placeholder="Pergunte algo para a JADE..."
            placeholderTextColor={colors.mutedForeground}
            value={input} onChangeText={setInput}
            multiline maxLength={500}
            onSubmitEditing={() => send(input)}
            returnKeyType="send"
            editable={!loading}
          />
          {!showChips && (
            <TouchableOpacity onPress={() => setShowChips(true)} activeOpacity={0.8}>
              <Feather name="zap" size={16} color={colors.mutedForeground} />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity
          style={[styles.sendBtn, { backgroundColor: input.trim() && !loading ? colors.primary : colors.surface }]}
          onPress={() => send(input)} activeOpacity={0.8} disabled={!input.trim() || loading}>
          {loading
            ? <ActivityIndicator size="small" color={colors.primary} />
            : <Feather name="send" size={18} color={input.trim() ? "#fff" : colors.mutedForeground} />
          }
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingBottom: 14, gap: 10, borderBottomWidth: StyleSheet.hairlineWidth },
  jadeIcon: { width: 42, height: 42, borderRadius: 21, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 17, fontFamily: "SpaceGrotesk_700Bold" },
  statusRow: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 2 },
  greenDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: "#00D68F" },
  statusText: { fontSize: 11, fontFamily: "SpaceGrotesk_400Regular" },
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
  inputBar: { flexDirection: "row", alignItems: "flex-end", paddingHorizontal: 16, paddingTop: 10, gap: 10, borderTopWidth: StyleSheet.hairlineWidth },
  inputWrap: { flex: 1, flexDirection: "row", alignItems: "flex-end", borderRadius: 20, borderWidth: 1, paddingHorizontal: 16, paddingVertical: 10, gap: 8 },
  input: { flex: 1, fontSize: 15, maxHeight: 100, lineHeight: 22 },
  sendBtn: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
});
