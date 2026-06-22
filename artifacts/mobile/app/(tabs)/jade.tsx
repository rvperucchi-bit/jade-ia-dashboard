import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Easing,
  FlatList,
  Image,
  KeyboardAvoidingView,
  PanResponder,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect, useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { useColors } from "@/hooks/useColors";
import { useApp } from "@/context/AppContext";
import { useCredits } from "@/context/CreditsContext";
import { takePendingVoice } from "@/utils/voiceContext";
import { stripMarkdown } from "@/utils/stripMarkdown";

const jadeLogo = require("../../assets/images/jade-logo.png");

const PINK       = "#FF0080";
const DRAWER_W   = 270;

const DRAWER_ITEMS = [
  { icon: "plus-square" as const, label: "Nova conversa" },
  { icon: "clock"       as const, label: "Histórico" },
  { icon: "star"        as const, label: "Favoritos" },
  { icon: "folder"      as const, label: "Arquivos" },
  { icon: "settings"   as const, label: "Configurações" },
  { icon: "user"        as const, label: "Perfil" },
  { icon: "zap"         as const, label: "Plano atual" },
] as const;

const CONTEXT_ITEMS = [
  { icon: "edit-2"      as const, label: "Renomear conversa" },
  { icon: "trash-2"     as const, label: "Limpar conversa",  danger: true },
  { icon: "download"    as const, label: "Exportar conversa" },
  { icon: "share-2"     as const, label: "Compartilhar" },
  { icon: "sliders"     as const, label: "Configurações do chat" },
] as const;

const SUGGESTIONS = [
  "Gerar relatório",
  "Encontrar oportunidades",
  "Criar campanha",
  "Analisar negócio",
];

const API_BASE = Platform.OS === "web" ? "" : `https://${process.env.EXPO_PUBLIC_DOMAIN ?? ""}`;

function nowTime() {
  return new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

// ─── Types ────────────────────────────────────────────────────────────────────
interface AttachedFile {
  uri: string;
  name: string;
  type: "image" | "doc";
}

interface AIMessage {
  id: string;
  text: string;
  sender: "user" | "jade";
  time: string;
  isAudio?: boolean;
  audioDuration?: number;
  files?: AttachedFile[];
}

// ─── Audio wave ───────────────────────────────────────────────────────────────
function AudioWave({ color }: { color: string }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 2, height: 14 }}>
      {[3, 6, 9, 6, 3].map((h, i) => (
        <View key={i} style={{ width: 3, height: h, borderRadius: 1.5, backgroundColor: color }} />
      ))}
    </View>
  );
}

// ─── JADE avatar ─────────────────────────────────────────────────────────────
function JadeAvatar({ size = 26 }: { size?: number }) {
  return (
    <Image
      source={jadeLogo}
      style={{ width: size, height: size, borderRadius: size / 2 }}
      resizeMode="contain"
    />
  );
}

// ─── Message bubble ───────────────────────────────────────────────────────────
function MessageBubble({ msg, colors }: { msg: AIMessage; colors: ReturnType<typeof useColors> }) {
  const isJade = msg.sender === "jade";

  if (msg.isAudio && !isJade) {
    return (
      <View style={[C.msgRow, C.msgRight]}>
        <View style={[C.bubble, C.bubbleUser, { backgroundColor: PINK }]}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <AudioWave color="rgba(255,255,255,0.9)" />
            <Text style={{ color: "#fff", fontSize: 12, fontFamily: "SpaceGrotesk_400Regular" }}>
              {msg.audioDuration ?? 0}s
            </Text>
          </View>
          <Text style={[C.bubbleTime, { color: "rgba(255,255,255,0.6)" }]}>{msg.time}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[C.msgRow, isJade ? C.msgLeft : C.msgRight]}>
      {isJade && <JadeAvatar size={26} />}
      <View style={[
        C.bubble,
        isJade
          ? [C.bubbleJade, { backgroundColor: colors.surface, borderColor: colors.border }]
          : [C.bubbleUser, { backgroundColor: PINK }],
      ]}>
        {msg.files && msg.files.length > 0 && (
          <View style={{ gap: 5, marginBottom: 6 }}>
            {msg.files.map((f, i) => (
              <View key={i} style={[C.filePill, { backgroundColor: isJade ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.15)" }]}>
                <Feather name={f.type === "image" ? "image" : "file"} size={12} color={isJade ? colors.mutedForeground : "rgba(255,255,255,0.8)"} />
                <Text style={{ fontSize: 11, color: isJade ? colors.mutedForeground : "rgba(255,255,255,0.9)", fontFamily: "SpaceGrotesk_400Regular", flex: 1 }} numberOfLines={1}>
                  {f.name}
                </Text>
              </View>
            ))}
          </View>
        )}
        {!!msg.text && (
          <Text style={[C.bubbleText, { color: isJade ? colors.text : "#fff" }]}>{msg.text}</Text>
        )}
        <Text style={[C.bubbleTime, { color: isJade ? colors.mutedForeground : "rgba(255,255,255,0.6)" }]}>{msg.time}</Text>
      </View>
    </View>
  );
}

// ─── Typing indicator ────────────────────────────────────────────────────────
function TypingBubble({ colors }: { colors: ReturnType<typeof useColors> }) {
  const fade = useRef(new Animated.Value(0.35)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(fade, { toValue: 1, duration: 850, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(fade, { toValue: 0.35, duration: 850, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  return (
    <View style={[C.msgRow, C.msgLeft]}>
      <Animated.Image source={jadeLogo} style={{ width: 26, height: 26, borderRadius: 13, opacity: fade }} resizeMode="contain" />
      <View style={[C.bubble, C.bubbleJade, { backgroundColor: colors.surface, borderColor: colors.border, paddingVertical: 14, paddingHorizontal: 16 }]}>
        <View style={{ flexDirection: "row", gap: 5, alignItems: "center" }}>
          {[0, 1, 2].map((i) => (
            <View key={i} style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: colors.mutedForeground, opacity: 0.55 }} />
          ))}
        </View>
      </View>
    </View>
  );
}

// ─── Recording bar ────────────────────────────────────────────────────────────
function RecordingBar({ secs, cancelling, pulseAnim }: { secs: number; cancelling: boolean; pulseAnim: Animated.Value }) {
  const scale   = pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.35] });
  const opacity = pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [0.7, 1] });
  const mm = String(Math.floor(secs / 60)).padStart(2, "0");
  const ss = String(secs % 60).padStart(2, "0");

  return (
    <View style={[C.recordBar, { backgroundColor: cancelling ? "#22001A" : "#1A0010", borderColor: cancelling ? "#FF003355" : "#FF008055" }]}>
      <Animated.View style={[C.recDot, { backgroundColor: cancelling ? "#FF3333" : PINK, transform: [{ scale }], opacity }]} />
      <Text style={[C.recTimer, { color: cancelling ? "#FF3333" : PINK }]}>{mm}:{ss}</Text>
      <Text style={[C.recHint, { color: cancelling ? "#FF3333" : "#7777AA" }]}>
        {cancelling ? "✕ Solte para cancelar" : "← Deslize para cancelar"}
      </Text>
      <AudioWave color={cancelling ? "#FF3333" : PINK} />
    </View>
  );
}

// ─── Empty state (centrado verticalmente) ─────────────────────────────────────
function EmptyState({ onSend, colors }: { onSend: (t: string) => void; colors: ReturnType<typeof useColors> }) {
  const fadeIn = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeIn, { toValue: 1, duration: 500, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
  }, []);

  return (
    <Animated.View style={{ flex: 1, justifyContent: "center", paddingHorizontal: 24, opacity: fadeIn }}>
      <Text style={{ color: colors.mutedForeground, fontSize: 15, fontFamily: "SpaceGrotesk_400Regular", marginBottom: 6 }}>
        Olá, Rodrigo.
      </Text>
      <Text style={{ color: colors.text, fontSize: 26, fontFamily: "SpaceGrotesk_700Bold", marginBottom: 28, lineHeight: 32 }}>
        Como posso ajudar hoje?
      </Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        {SUGGESTIONS.map((s) => (
          <TouchableOpacity
            key={s}
            style={[C.suggChip, { backgroundColor: colors.surface + "55", borderColor: colors.border + "88" }]}
            onPress={() => onSend(s)}
            activeOpacity={0.7}
          >
            <Text style={{ color: colors.mutedForeground, fontSize: 12, fontFamily: "SpaceGrotesk_400Regular" }}>{s}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </Animated.View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function JADEScreen() {
  const colors  = useColors();
  const insets  = useSafeAreaInsets();
  const router  = useRouter();
  const { addActivityEvent } = useApp();
  const { remaining, warnLevel, useCredit } = useCredits();

  const topPad    = Platform.OS === "web" ? 24 : insets.top;
  const bottomPad = Platform.OS === "web" ? 20 : insets.bottom;

  const [messages,     setMessages]     = useState<AIMessage[]>([]);
  const [input,        setInput]        = useState("");
  const [loading,      setLoading]      = useState(false);
  const [sessionId,    setSessionId]    = useState<string | null>(null);
  const [handoffAlert, setHandoffAlert] = useState(false);
  const [modoOp,       setModoOp]       = useState<string | null>(null);
  const [segmento,     setSegmento]     = useState<string | null>(null);
  const [attachments,  setAttachments]  = useState<AttachedFile[]>([]);

  // ── Drawer + menu state ────────────────────────────────────────────────────
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [menuOpen,   setMenuOpen]   = useState(false);
  const drawerAnim  = useRef(new Animated.Value(-DRAWER_W)).current;
  const drawerBg    = useRef(new Animated.Value(0)).current;

  // ── Audio state ────────────────────────────────────────────────────────────
  const [recording,  setRecording]  = useState(false);
  const [recordSecs, setRecordSecs] = useState(0);
  const [cancelling, setCancelling] = useState(false);
  const pulseAnim   = useRef(new Animated.Value(0)).current;
  const pulseLoop   = useRef<ReturnType<typeof Animated.loop> | null>(null);
  const recordTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const cancelRef   = useRef(false);
  const secsRef     = useRef(0);

  const handoffTimer    = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sessionCreating = useRef(false);

  useEffect(() => {
    AsyncStorage.getItem("@jade_ia:empresa_v2").then((raw) => {
      if (!raw) return;
      try {
        const d = JSON.parse(raw);
        setModoOp(d.modoOperacao ?? null);
        setSegmento(d.segmento ?? null);
      } catch {}
    });
  }, []);

  // ── Drawer ─────────────────────────────────────────────────────────────────
  const openDrawer = () => {
    setDrawerOpen(true);
    Animated.parallel([
      Animated.timing(drawerAnim, { toValue: 0, duration: 280, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(drawerBg,   { toValue: 1, duration: 280, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();
  };

  const closeDrawer = () => {
    Animated.parallel([
      Animated.timing(drawerAnim, { toValue: -DRAWER_W, duration: 240, easing: Easing.in(Easing.cubic), useNativeDriver: true }),
      Animated.timing(drawerBg,   { toValue: 0,         duration: 240, easing: Easing.in(Easing.cubic), useNativeDriver: true }),
    ]).start(() => setDrawerOpen(false));
  };

  // ── Pulse ─────────────────────────────────────────────────────────────────
  const startPulse = () => {
    pulseLoop.current = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1, duration: 500, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
        Animated.timing(pulseAnim, { toValue: 0, duration: 500, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
      ])
    );
    pulseLoop.current.start();
  };
  const stopPulse = () => { pulseLoop.current?.stop(); pulseAnim.setValue(0); };

  // ── Mic PanResponder ───────────────────────────────────────────────────────
  const micPan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        cancelRef.current = false; secsRef.current = 0;
        setRecording(true); setRecordSecs(0); setCancelling(false);
        startPulse();
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        recordTimer.current = setInterval(() => { secsRef.current += 1; setRecordSecs(secsRef.current); }, 1000);
      },
      onPanResponderMove: (_, gs) => {
        const c = gs.dx < -50;
        cancelRef.current = c;
        setCancelling(c);
      },
      onPanResponderRelease: () => {
        if (recordTimer.current) clearInterval(recordTimer.current);
        stopPulse();
        const wasCancelled = cancelRef.current;
        const duration = secsRef.current;
        setRecording(false); setCancelling(false); setRecordSecs(0);
        cancelRef.current = false; secsRef.current = 0;
        if (wasCancelled) { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); return; }
        if (duration >= 1) { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); sendAudio(duration); }
      },
      onPanResponderTerminate: () => {
        if (recordTimer.current) clearInterval(recordTimer.current);
        stopPulse();
        setRecording(false); setCancelling(false); setRecordSecs(0);
        cancelRef.current = false; secsRef.current = 0;
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
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "Nova conversa" }),
      });
      if (res.ok) {
        const data = (await res.json()) as { session?: { id: string } };
        if (data.session?.id) { setSessionId(data.session.id); return data.session.id; }
      }
    } catch {}
    finally { sessionCreating.current = false; }
    return null;
  };

  const buildHistory = (msgs: AIMessage[]) =>
    [...msgs].reverse().map((m) => ({
      role: m.sender === "jade" ? "model" : "user",
      content: m.isAudio ? `[Mensagem de voz de ${m.audioDuration}s]` : m.text,
    }));

  // ── Send ──────────────────────────────────────────────────────────────────
  const send = async (text: string, files?: AttachedFile[]) => {
    const trimmed = text.trim();
    if ((!trimmed && !files?.length) || loading) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const sid = await ensureSession();
    const userMsg: AIMessage = {
      id: Date.now().toString(),
      text: trimmed || (files?.length ? `[${files.length} arquivo(s) anexado(s)]` : ""),
      sender: "user",
      time: nowTime(),
      files,
    };
    const updatedMsgs = [userMsg, ...messages];
    setMessages(updatedMsgs);
    setInput(""); setAttachments([]);
    setLoading(true);

    try {
      const controller = new AbortController();
      const tid = setTimeout(() => controller.abort(), 90000);
      const response = await fetch(`${API_BASE}/api/jade/chat`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: buildHistory(updatedMsgs), session_id: sid }),
        signal: controller.signal,
      });
      clearTimeout(tid);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = (await response.json()) as { message?: string; response?: string; handoff?: boolean };
      const raw = data.message?.trim() || data.response?.trim() || "Desculpe, não consegui processar. Tente novamente.";
      useCredit();
      setMessages((prev) => [{ id: (Date.now() + 1).toString(), text: stripMarkdown(raw), sender: "jade", time: nowTime() }, ...prev]);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      if (data.handoff) {
        if (handoffTimer.current) clearTimeout(handoffTimer.current);
        setHandoffAlert(true);
        handoffTimer.current = setTimeout(() => setHandoffAlert(false), 9000);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      }
      await addActivityEvent({ type: "message", text: `JADE respondeu: "${trimmed.slice(0, 30)}${trimmed.length > 30 ? "…" : ""}"`, icon: "robot", color: PINK });
    } catch (err: unknown) {
      const isAbort = err instanceof Error && err.name === "AbortError";
      setMessages((prev) => [{
        id: (Date.now() + 1).toString(),
        text: isAbort ? "Ops! A JADE demorou demais. Tente novamente." : "Ops! Problema de conexão. Verifique sua internet.",
        sender: "jade", time: nowTime(),
      }, ...prev]);
    } finally { setLoading(false); }
  };

  // ── Send audio ─────────────────────────────────────────────────────────────
  const sendAudio = async (duration: number) => {
    if (loading) return;
    const sid = await ensureSession();
    const audioMsg: AIMessage = { id: Date.now().toString(), text: `[Áudio de ${duration}s]`, sender: "user", time: nowTime(), isAudio: true, audioDuration: duration };
    const updatedMsgs = [audioMsg, ...messages];
    setMessages(updatedMsgs);
    setLoading(true);
    const prompt = `O usuário enviou uma mensagem de voz de ${duration}s. Responda ajudando com vendas ou negócio.`;
    try {
      const controller = new AbortController();
      const tid = setTimeout(() => controller.abort(), 30000);
      const response = await fetch(`${API_BASE}/api/jade/chat`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [{ role: "user", content: prompt }], session_id: sid }),
        signal: controller.signal,
      });
      clearTimeout(tid);
      if (!response.ok) throw new Error();
      const data = (await response.json()) as { message?: string; response?: string };
      const raw = data.message?.trim() || data.response?.trim() || "Recebi seu áudio!";
      useCredit();
      setMessages((prev) => [{ id: (Date.now() + 1).toString(), text: stripMarkdown(raw), sender: "jade", time: nowTime() }, ...prev]);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {
      setMessages((prev) => [{ id: (Date.now() + 1).toString(), text: "Recebi seu áudio! Como posso ajudar?", sender: "jade", time: nowTime() }, ...prev]);
    } finally { setLoading(false); }
  };

  const sendAudioRef = useRef(sendAudio);
  sendAudioRef.current = sendAudio;

  useFocusEffect(
    useCallback(() => {
      const pending = takePendingVoice();
      if (pending && pending.duration >= 1) {
        const t = setTimeout(() => sendAudioRef.current(pending.duration), 380);
        return () => clearTimeout(t);
      }
    }, [])
  );

  // ── File attachment ────────────────────────────────────────────────────────
  const pickAttachment = async () => {
    if (Platform.OS === "web") {
      Alert.alert("Anexar", "Upload de arquivos disponível apenas no app mobile.");
      return;
    }
    Alert.alert("Anexar arquivo", "Escolha o tipo:", [
      {
        text: "Imagem da galeria",
        onPress: async () => {
          const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
          if (status !== "granted") { Alert.alert("Permissão necessária", "Precisamos de acesso à sua galeria."); return; }
          const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ["images"], allowsMultipleSelection: true, quality: 0.85,
          });
          if (!result.canceled) {
            const newFiles: AttachedFile[] = result.assets.map((a) => ({
              uri: a.uri, name: a.fileName ?? `imagem_${Date.now()}.jpg`, type: "image" as const,
            }));
            setAttachments((prev) => [...prev, ...newFiles].slice(0, 5));
          }
        },
      },
      { text: "Cancelar", style: "cancel" },
    ]);
  };

  const removeAttachment = (idx: number) => setAttachments((prev) => prev.filter((_, i) => i !== idx));

  const resetConversation = () => {
    setMessages([]); setSessionId(null); setAttachments([]);
    sessionCreating.current = false;
  };

  const handleSend = () => send(input, attachments.length > 0 ? attachments : undefined);

  const renderData: AIMessage[] = loading
    ? [{ id: "__typing__", text: "", sender: "jade", time: "" }, ...messages]
    : messages;

  const hasConversation = messages.length > 0 || loading;
  const canSend = (input.trim().length > 0 || attachments.length > 0) && !loading && !recording;

  // ── Context menu action ────────────────────────────────────────────────────
  const handleContextItem = (label: string) => {
    setMenuOpen(false);
    if (label === "Limpar conversa") resetConversation();
  };

  return (
    <View style={[C.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={0}
      >
        {/* ── Header ── */}
        <View style={[C.header, { paddingTop: topPad + 4 }]}>
          <TouchableOpacity style={C.headerBtn} onPress={openDrawer} activeOpacity={0.6}>
            <Feather name="menu" size={20} color={colors.mutedForeground} />
          </TouchableOpacity>
          <View style={{ flex: 1 }} />
          <TouchableOpacity style={C.headerBtn} onPress={() => setMenuOpen((v) => !v)} activeOpacity={0.6}>
            <Feather name="more-vertical" size={20} color={colors.mutedForeground} />
          </TouchableOpacity>
        </View>

        {/* ── Chat / Empty state ── */}
        {!hasConversation ? (
          <EmptyState onSend={(t) => send(t)} colors={colors} />
        ) : (
          <FlatList
            data={renderData}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => {
              if (item.id === "__typing__") return <TypingBubble colors={colors} />;
              return <MessageBubble msg={item} colors={colors} />;
            }}
            inverted
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 14, paddingTop: 10, paddingBottom: 10 }}
            keyboardDismissMode="interactive"
            keyboardShouldPersistTaps="handled"
          />
        )}

        {/* ── Credits banner ── */}
        {warnLevel !== "ok" && (
          <TouchableOpacity
            style={[C.creditBanner, { backgroundColor: warnLevel === "empty" ? "#FF3B5C" : "#FFB300" }]}
            onPress={() => router.push("/loja" as any)}
            activeOpacity={0.9}
          >
            <Feather name={warnLevel === "empty" ? "x-circle" : "alert-triangle"} size={14} color="#fff" />
            <Text style={C.creditBannerText}>
              {warnLevel === "empty" ? "Créditos esgotados — toque para recarregar" : `Créditos acabando! ${remaining} restantes`}
            </Text>
          </TouchableOpacity>
        )}

        {/* ── Handoff banner ── */}
        {handoffAlert && (
          <TouchableOpacity
            style={C.handoffBanner}
            onPress={() => { setHandoffAlert(false); router.push("/leads" as any); }}
            activeOpacity={0.9}
          >
            <Text style={{ fontSize: 20 }}>🔥</Text>
            <View style={{ flex: 1 }}>
              <Text style={C.handoffTitle}>Lead Quente Detectado!</Text>
              <Text style={C.handoffSub}>Sinal de compra — entre agora e feche</Text>
            </View>
            <Feather name="arrow-right" size={18} color="#fff" />
          </TouchableOpacity>
        )}

        {/* ── Attachments preview ── */}
        {attachments.length > 0 && (
          <View style={[C.attachStrip, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 12, gap: 8, paddingVertical: 6 }}>
              {attachments.map((f, i) => (
                <View key={i} style={[C.attachChip, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <Feather name={f.type === "image" ? "image" : "file"} size={13} color={PINK} />
                  <Text style={{ fontSize: 11, color: colors.text, fontFamily: "SpaceGrotesk_400Regular", maxWidth: 90 }} numberOfLines={1}>
                    {f.name}
                  </Text>
                  <TouchableOpacity onPress={() => removeAttachment(i)} activeOpacity={0.7}>
                    <Feather name="x" size={13} color={colors.mutedForeground} />
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {/* ── Recording bar ── */}
        {recording && (
          <RecordingBar secs={recordSecs} cancelling={cancelling} pulseAnim={pulseAnim} />
        )}

        {/* ── Input bar ── */}
        <View style={[C.inputBar, { borderTopColor: colors.border, backgroundColor: colors.background, paddingBottom: bottomPad + 8 }]}>
          <View style={[C.inputPill, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <TouchableOpacity onPress={pickAttachment} activeOpacity={0.6} style={C.pillBtn}>
              <Feather name="plus" size={17} color={colors.mutedForeground + "BB"} />
            </TouchableOpacity>
            <TextInput
              style={[C.input, { color: colors.text, fontFamily: "SpaceGrotesk_400Regular" }]}
              placeholder="Mensagem..."
              placeholderTextColor={colors.mutedForeground + "66"}
              value={input}
              onChangeText={setInput}
              multiline
              maxLength={500}
              onSubmitEditing={handleSend}
              returnKeyType="send"
              editable={!loading && !recording}
            />
            <View {...micPan.panHandlers}>
              <Animated.View style={[C.pillBtn, recording && { backgroundColor: cancelling ? "#FF3333" : PINK, borderRadius: 18 }]}>
                <Feather name="mic" size={16} color={recording ? "#fff" : colors.mutedForeground + "BB"} />
              </Animated.View>
            </View>
            <TouchableOpacity
              style={[C.sendCircle, { backgroundColor: canSend ? PINK : colors.surface }]}
              onPress={handleSend}
              activeOpacity={0.8}
              disabled={!canSend || warnLevel === "empty"}
            >
              <Feather name="send" size={14} color={canSend ? "#fff" : colors.mutedForeground + "40"} />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>

      {/* ── Drawer overlay ── */}
      {drawerOpen && (
        <Animated.View
          style={[StyleSheet.absoluteFill, { zIndex: 300 }]}
          pointerEvents="box-none"
        >
          {/* Backdrop */}
          <Animated.View
            style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(0,0,0,0.6)", opacity: drawerBg }]}
            pointerEvents="auto"
          >
            <TouchableOpacity style={{ flex: 1 }} onPress={closeDrawer} activeOpacity={1} />
          </Animated.View>

          {/* Panel */}
          <Animated.View
            style={[C.drawer, { backgroundColor: colors.card, borderRightColor: colors.border, transform: [{ translateX: drawerAnim }], paddingTop: insets.top + 20 }]}
            pointerEvents="auto"
          >
            {/* Drawer logo */}
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 20, marginBottom: 28 }}>
              <Image source={jadeLogo} style={{ width: 28, height: 28, borderRadius: 14 }} resizeMode="contain" />
              <Text style={{ fontSize: 16, fontFamily: "SpaceGrotesk_700Bold", color: colors.text }}>JADE</Text>
            </View>

            {DRAWER_ITEMS.map((item) => (
              <TouchableOpacity
                key={item.label}
                style={C.drawerItem}
                onPress={() => {
                  closeDrawer();
                  if (item.label === "Nova conversa") resetConversation();
                }}
                activeOpacity={0.7}
              >
                <Feather name={item.icon} size={17} color={item.label === "Plano atual" ? PINK : colors.mutedForeground} />
                <Text style={[C.drawerLabel, { color: item.label === "Plano atual" ? PINK : colors.text }]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}
          </Animated.View>
        </Animated.View>
      )}

      {/* ── Context menu ── */}
      {menuOpen && (
        <>
          <TouchableOpacity
            style={[StyleSheet.absoluteFill, { zIndex: 200 }]}
            onPress={() => setMenuOpen(false)}
            activeOpacity={1}
          />
          <View style={[C.contextMenu, { backgroundColor: colors.card, borderColor: colors.border, top: topPad + 48, zIndex: 201 }]}>
            {CONTEXT_ITEMS.map((item, idx) => (
              <TouchableOpacity
                key={item.label}
                style={[C.contextItem, idx < CONTEXT_ITEMS.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border }]}
                onPress={() => handleContextItem(item.label)}
                activeOpacity={0.7}
              >
                <Feather name={item.icon} size={15} color={"danger" in item && item.danger ? "#FF3B5C" : colors.mutedForeground} />
                <Text style={[C.contextLabel, { color: "danger" in item && item.danger ? "#FF3B5C" : colors.text }]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </>
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const C = StyleSheet.create({
  container: { flex: 1 },

  header:    { flexDirection: "row", alignItems: "center", paddingHorizontal: 8, paddingBottom: 6 },
  headerBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },

  msgRow:    { flexDirection: "row", marginBottom: 10, alignItems: "flex-end", gap: 8 },
  msgLeft:   { justifyContent: "flex-start" },
  msgRight:  { justifyContent: "flex-end" },
  bubble:    { maxWidth: "78%", borderRadius: 16, padding: 12 },
  bubbleJade:{ borderTopLeftRadius: 4, borderWidth: 1 },
  bubbleUser:{ borderTopRightRadius: 4 },
  bubbleText:{ fontSize: 14, fontFamily: "SpaceGrotesk_400Regular", lineHeight: 20 },
  bubbleTime:{ fontSize: 11, fontFamily: "SpaceGrotesk_400Regular", marginTop: 4, textAlign: "right" },
  filePill:  { flexDirection: "row", alignItems: "center", gap: 5, padding: 5, borderRadius: 7 },

  suggChip:  { paddingHorizontal: 13, paddingVertical: 7, borderRadius: 18, borderWidth: 1 },

  recordBar: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 16, paddingVertical: 10, borderTopWidth: 1 },
  recDot:    { width: 10, height: 10, borderRadius: 5 },
  recTimer:  { fontSize: 14, fontFamily: "SpaceGrotesk_700Bold", minWidth: 36 },
  recHint:   { flex: 1, fontSize: 12, fontFamily: "SpaceGrotesk_400Regular" },

  attachStrip: { borderTopWidth: StyleSheet.hairlineWidth },
  attachChip:  { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, borderWidth: 1 },

  inputBar:   { paddingHorizontal: 12, paddingTop: 8, borderTopWidth: StyleSheet.hairlineWidth },
  inputPill:  { flexDirection: "row", alignItems: "center", borderRadius: 24, borderWidth: 1, paddingHorizontal: 6, paddingVertical: 6, gap: 2 },
  input:      { flex: 1, fontSize: 15, maxHeight: 100, lineHeight: 22, paddingHorizontal: 6 },
  pillBtn:    { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  sendCircle: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" },

  creditBanner:     { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 16, paddingVertical: 10 },
  creditBannerText: { color: "#fff", fontSize: 12, fontFamily: "SpaceGrotesk_600SemiBold", flex: 1 },
  handoffBanner:    { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: PINK, paddingHorizontal: 16, paddingVertical: 12 },
  handoffTitle:     { color: "#fff", fontSize: 13, fontFamily: "SpaceGrotesk_700Bold" },
  handoffSub:       { color: "rgba(255,255,255,0.85)", fontSize: 11, fontFamily: "SpaceGrotesk_400Regular", marginTop: 1 },

  drawer: {
    position: "absolute", left: 0, top: 0, bottom: 0,
    width: DRAWER_W, borderRightWidth: StyleSheet.hairlineWidth,
    paddingBottom: 30,
  },
  drawerItem:  { flexDirection: "row", alignItems: "center", gap: 14, paddingHorizontal: 20, paddingVertical: 13 },
  drawerLabel: { fontSize: 14, fontFamily: "SpaceGrotesk_500Medium" },

  contextMenu: {
    position: "absolute", right: 12,
    borderRadius: 12, borderWidth: 1,
    minWidth: 200, overflow: "hidden",
    shadowColor: "#000", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 20, elevation: 20,
  },
  contextItem:  { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 13 },
  contextLabel: { fontSize: 13, fontFamily: "SpaceGrotesk_400Regular" },
});
