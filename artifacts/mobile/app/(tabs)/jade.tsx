import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  PanResponder,
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
import { useFocusEffect, useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { useColors } from "@/hooks/useColors";
import { useApp } from "@/context/AppContext";
import { takePendingVoice } from "@/utils/voiceContext";

const MODO_LABEL: Record<string, string> = {
  fechamento:             "Fechamento",
  consultivo_presencial:  "Consultivo",
  nutricao:               "Nutrição",
};

interface AIMessage {
  id: string;
  text: string;
  sender: "user" | "jade";
  time: string;
  isAudio?: boolean;
  audioDuration?: number;
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

const WELCOME_MSGS = (): AIMessage[] => {
  const t = nowTime();
  return [
    { id: "welcome-2", text: "Como posso te ajudar hoje?", sender: "jade", time: t },
    { id: "welcome-1", text: "Bora para os negócios! 🚀", sender: "jade", time: t },
  ];
};

// ─── Audio wave icon ───────────────────────────────────────────────────────────
function AudioWave({ color }: { color: string }) {
  const bars = [3, 6, 9, 6, 3];
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 2, height: 14 }}>
      {bars.map((h, i) => (
        <View key={i} style={{ width: 3, height: h, borderRadius: 1.5, backgroundColor: color }} />
      ))}
    </View>
  );
}

// ─── Message bubbles ───────────────────────────────────────────────────────────
function MessageBubble({ msg, colors }: { msg: AIMessage; colors: ReturnType<typeof useColors> }) {
  const isJade = msg.sender === "jade";

  if (msg.isAudio && !isJade) {
    return (
      <View style={[styles.msgRow, styles.msgRight]}>
        <View style={[styles.bubble, styles.bubbleUser, { backgroundColor: "#FF0080" }]}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <AudioWave color="rgba(255,255,255,0.9)" />
            <Text style={{ color: "#fff", fontSize: 12, fontFamily: "SpaceGrotesk_400Regular" }}>
              {msg.audioDuration ?? 0}s
            </Text>
          </View>
          <Text style={[styles.bubbleTime, { color: "rgba(255,255,255,0.7)" }]}>{msg.time}</Text>
        </View>
      </View>
    );
  }

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

// ─── Recording bar ─────────────────────────────────────────────────────────────
function RecordingBar({
  secs, cancelling, pulseAnim, colors,
}: {
  secs: number; cancelling: boolean; pulseAnim: Animated.Value; colors: ReturnType<typeof useColors>;
}) {
  const scale = pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.35] });
  const opacity = pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [0.7, 1] });

  const mm = String(Math.floor(secs / 60)).padStart(2, "0");
  const ss = String(secs % 60).padStart(2, "0");

  return (
    <View style={[styles.recordBar, { backgroundColor: cancelling ? "#22001A" : "#1A0010", borderColor: cancelling ? "#FF003355" : "#FF008055" }]}>
      <Animated.View style={[styles.recDot, { backgroundColor: cancelling ? "#FF3333" : "#FF0080", transform: [{ scale }], opacity }]} />
      <Text style={[styles.recTimer, { color: cancelling ? "#FF3333" : "#FF0080" }]}>{mm}:{ss}</Text>
      <Text style={[styles.recHint, { color: cancelling ? "#FF3333" : colors.mutedForeground }]}>
        {cancelling ? "✕ Solte para cancelar" : "← Deslize para cancelar"}
      </Text>
      <AudioWave color={cancelling ? "#FF3333" : "#FF0080"} />
    </View>
  );
}

// ─── Screen ────────────────────────────────────────────────────────────────────
export default function JADEScreen() {
  const colors  = useColors();
  const insets  = useSafeAreaInsets();
  const router  = useRouter();
  const { addActivityEvent } = useApp();

  const topPad    = Platform.OS === "web" ? 67 : insets.top;
  const TAB_BAR_H = Platform.OS === "web" ? 84 : 60;
  const bottomPad = TAB_BAR_H + (Platform.OS === "web" ? 0 : insets.bottom);

  const [messages,      setMessages]      = useState<AIMessage[]>(WELCOME_MSGS());
  const [input,         setInput]         = useState("");
  const [loading,       setLoading]       = useState(false);
  const [showChips,     setShowChips]     = useState(true);
  const [sessionId,     setSessionId]     = useState<string | null>(null);
  const [handoffAlert,  setHandoffAlert]  = useState(false);
  const [modoOp,        setModoOp]        = useState<string | null>(null);

  // ── Audio recording state ──────────────────────────────────────────────────
  const [recording,   setRecording]   = useState(false);
  const [recordSecs,  setRecordSecs]  = useState(0);
  const [cancelling,  setCancelling]  = useState(false);
  const pulseAnim    = useRef(new Animated.Value(0)).current;
  const pulseLoop    = useRef<ReturnType<typeof Animated.loop> | null>(null);
  const recordTimer  = useRef<ReturnType<typeof setInterval> | null>(null);
  const cancelRef    = useRef(false);
  const secsRef      = useRef(0);

  const handoffTimer    = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sessionCreating = useRef(false);

  useEffect(() => {
    AsyncStorage.getItem("@jade_ia:empresa_v2").then((raw) => {
      if (!raw) return;
      try { const parsed = JSON.parse(raw); setModoOp(parsed.modoOperacao ?? null); } catch {}
    });
  }, []);

  // ── Pulse animation ────────────────────────────────────────────────────────
  const startPulse = () => {
    pulseLoop.current = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1, duration: 500, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
        Animated.timing(pulseAnim, { toValue: 0, duration: 500, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
      ])
    );
    pulseLoop.current.start();
  };

  const stopPulse = () => {
    pulseLoop.current?.stop();
    pulseAnim.setValue(0);
  };

  // ── PanResponder for mic button ────────────────────────────────────────────
  const micPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        cancelRef.current = false;
        secsRef.current = 0;
        setRecording(true);
        setRecordSecs(0);
        setCancelling(false);
        startPulse();
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        recordTimer.current = setInterval(() => {
          secsRef.current += 1;
          setRecordSecs(secsRef.current);
        }, 1000);
      },
      onPanResponderMove: (_, gs) => {
        const shouldCancel = gs.dx < -50;
        cancelRef.current = shouldCancel;
        setCancelling(shouldCancel);
      },
      onPanResponderRelease: () => {
        if (recordTimer.current) clearInterval(recordTimer.current);
        stopPulse();
        const wasCancelled = cancelRef.current;
        const duration = secsRef.current;
        setRecording(false);
        setCancelling(false);
        setRecordSecs(0);
        cancelRef.current = false;
        secsRef.current = 0;

        if (wasCancelled) {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          return;
        }

        if (duration >= 1) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          sendAudio(duration);
        }
      },
      onPanResponderTerminate: () => {
        if (recordTimer.current) clearInterval(recordTimer.current);
        stopPulse();
        setRecording(false);
        setCancelling(false);
        setRecordSecs(0);
        cancelRef.current = false;
        secsRef.current = 0;
      },
    })
  ).current;

  // ── Session ────────────────────────────────────────────────────────────────
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
        if (data.session?.id) { setSessionId(data.session.id); return data.session.id; }
      }
    } catch { /* ignore */ }
    finally { sessionCreating.current = false; }
    return null;
  };

  const buildHistory = (msgs: AIMessage[]) =>
    [...msgs].reverse().map((m) => ({
      role: m.sender === "jade" ? "model" : "user",
      content: m.isAudio ? `[Mensagem de voz de ${m.audioDuration}s enviada pelo usuário]` : m.text,
    }));

  // ── Send text ──────────────────────────────────────────────────────────────
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
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 90000);
      const response = await fetch(`${API_BASE}/api/jade/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: buildHistory(updatedMsgs), session_id: sid }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = (await response.json()) as { message?: string; response?: string; handoff?: boolean };
      const replyText = data.message?.trim() || data.response?.trim() || "Desculpe, não consegui processar. Tente novamente.";
      setMessages((prev) => [{ id: (Date.now() + 1).toString(), text: replyText, sender: "jade", time: nowTime() }, ...prev]);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      if (data.handoff) {
        if (handoffTimer.current) clearTimeout(handoffTimer.current);
        setHandoffAlert(true);
        handoffTimer.current = setTimeout(() => setHandoffAlert(false), 9000);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      }
      await addActivityEvent({ type: "message", text: `JADE respondeu: "${trimmed.slice(0, 30)}${trimmed.length > 30 ? "…" : ""}"`, icon: "robot", color: "#FF0080" });
    } catch (err: unknown) {
      const isAbort = err instanceof Error && err.name === "AbortError";
      setMessages((prev) => [{
        id: (Date.now() + 1).toString(),
        text: isAbort ? "Ops! A JADE demorou demais. Tente enviar novamente." : "Ops! Problema de conexão. Verifique sua internet.",
        sender: "jade", time: nowTime(),
      }, ...prev]);
    } finally { setLoading(false); }
  };

  // ── Send audio ─────────────────────────────────────────────────────────────
  const sendAudio = async (duration: number) => {
    if (loading) return;

    const sid = await ensureSession();
    const audioMsg: AIMessage = {
      id: Date.now().toString(),
      text: `[Áudio de ${duration}s]`,
      sender: "user",
      time: nowTime(),
      isAudio: true,
      audioDuration: duration,
    };
    const updatedMsgs = [audioMsg, ...messages];
    setMessages(updatedMsgs);
    setShowChips(false);
    setLoading(true);

    const prompt = `O usuário enviou uma mensagem de voz com duração de ${duration} segundo${duration !== 1 ? "s" : ""}. Responda como se você tivesse entendido a mensagem de voz — pergunte sobre o que posso ajudar hoje em relação às vendas ou ao negócio dele.`;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);
      const response = await fetch(`${API_BASE}/api/jade/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{ role: "user", content: prompt }],
          session_id: sid,
        }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = (await response.json()) as { message?: string; response?: string };
      const replyText = data.message?.trim() || data.response?.trim() || "Recebi seu áudio! Como posso ajudar?";
      setMessages((prev) => [{ id: (Date.now() + 1).toString(), text: replyText, sender: "jade", time: nowTime() }, ...prev]);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {
      setMessages((prev) => [{ id: (Date.now() + 1).toString(), text: "Recebi seu áudio! Como posso te ajudar hoje?", sender: "jade", time: nowTime() }, ...prev]);
    } finally { setLoading(false); }
  };

  // ── Auto-send voice from home screen button ────────────────────────────────
  const sendAudioRef = useRef(sendAudio);
  sendAudioRef.current = sendAudio;

  useFocusEffect(
    useCallback(() => {
      const pending = takePendingVoice();
      if (pending && pending.duration >= 1) {
        // Small delay so the screen finishes mounting/transition
        const t = setTimeout(() => sendAudioRef.current(pending.duration), 380);
        return () => clearTimeout(t);
      }
    }, [])
  );

  const resetConversation = () => {
    setMessages(WELCOME_MSGS().map((m) => ({ ...m, id: m.id + "-" + Date.now() })));
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
            {!!modoOp && (
              <View style={[styles.modeBadge, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Text style={[styles.modeText, { color: colors.mutedForeground }]}>
                  {MODO_LABEL[modoOp] ?? modoOp}
                </Text>
              </View>
            )}
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

      {/* 🔥 Handoff alert banner */}
      {handoffAlert && (
        <TouchableOpacity
          style={styles.handoffBanner}
          onPress={() => { setHandoffAlert(false); router.push("/leads" as any); }}
          activeOpacity={0.9}
        >
          <Text style={styles.handoffEmoji}>🔥</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.handoffTitle}>Lead Quente Detectado!</Text>
            <Text style={styles.handoffSub}>Sinal de compra — entre agora e feche o negócio</Text>
          </View>
          <Feather name="arrow-right" size={18} color="#fff" />
        </TouchableOpacity>
      )}

      {/* Shortcut chips */}
      {showChips && !recording && (
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

      {/* Recording bar */}
      {recording && (
        <RecordingBar secs={recordSecs} cancelling={cancelling} pulseAnim={pulseAnim} colors={colors} />
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
            editable={!loading && !recording}
          />
          {!showChips && !recording && (
            <TouchableOpacity onPress={() => setShowChips(true)} activeOpacity={0.8}>
              <Feather name="zap" size={16} color={colors.mutedForeground} />
            </TouchableOpacity>
          )}
        </View>

        {/* Mic button */}
        <View {...micPanResponder.panHandlers}>
          <Animated.View style={[
            styles.micBtn,
            recording && { backgroundColor: cancelling ? "#FF3333" : "#FF0080" },
            !recording && { backgroundColor: colors.surface },
          ]}>
            <Feather
              name={recording ? "mic" : "mic"}
              size={20}
              color={recording ? "#fff" : colors.mutedForeground}
            />
          </Animated.View>
        </View>

        {/* Send button */}
        <TouchableOpacity
          style={[styles.sendBtn, { backgroundColor: input.trim() && !loading ? colors.primary : colors.surface }]}
          onPress={() => send(input)} activeOpacity={0.8} disabled={!input.trim() || loading || recording}>
          {loading
            ? <ActivityIndicator size="small" color={colors.primary} />
            : <Feather name="send" size={18} color={input.trim() && !recording ? "#fff" : colors.mutedForeground} />
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
  modeBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, borderWidth: 1 },
  modeText: { fontSize: 10, fontFamily: "SpaceGrotesk_600SemiBold", letterSpacing: 0.3 },
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
  recordBar: {
    flexDirection: "row", alignItems: "center", gap: 10,
    paddingHorizontal: 16, paddingVertical: 10,
    borderTopWidth: 1,
  },
  recDot: { width: 10, height: 10, borderRadius: 5 },
  recTimer: { fontSize: 14, fontFamily: "SpaceGrotesk_700Bold", minWidth: 36 },
  recHint: { flex: 1, fontSize: 12, fontFamily: "SpaceGrotesk_400Regular" },
  inputBar: { flexDirection: "row", alignItems: "flex-end", paddingHorizontal: 12, paddingTop: 10, gap: 8, borderTopWidth: StyleSheet.hairlineWidth },
  inputWrap: { flex: 1, flexDirection: "row", alignItems: "flex-end", borderRadius: 20, borderWidth: 1, paddingHorizontal: 16, paddingVertical: 10, gap: 8 },
  input: { flex: 1, fontSize: 15, maxHeight: 100, lineHeight: 22 },
  micBtn: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "transparent" },
  sendBtn: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  handoffBanner: {
    flexDirection: "row", alignItems: "center", gap: 12,
    backgroundColor: "#FF0080", paddingHorizontal: 16, paddingVertical: 12,
  },
  handoffEmoji: { fontSize: 22 },
  handoffTitle: { color: "#fff", fontSize: 14, fontFamily: "SpaceGrotesk_700Bold" },
  handoffSub: { color: "rgba(255,255,255,0.85)", fontSize: 12, fontFamily: "SpaceGrotesk_400Regular", marginTop: 1 },
});
