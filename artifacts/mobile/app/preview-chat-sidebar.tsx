import React, { useRef, useState } from "react";
import {
  Animated,
  Easing,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

// ─── Sidebar items ────────────────────────────────────────────────────────────
const MENU_ITEMS = [
  { label: "💬 Chat Principal",          route: "Chat" },
  { label: "📊 Pipeline Comercial",      route: "Pipeline" },
  { label: "🔍 Prospecção Maps IA",      route: "Prospecting" },
  { label: "🌱 Carteira & Farmer",       route: "Farmer" },
  { label: "👥 Meus Clientes",           route: "Clients" },
  { label: "📈 Relatórios Globais",      route: "Reports" },
  { label: "💳 Assinatura & Faturamento",route: "Billing" },
];

const SIDEBAR_W = 280;

// ─── Sidebar panel ────────────────────────────────────────────────────────────
function Sidebar({
  visible, onClose, onNavigate,
}: { visible: boolean; onClose: () => void; onNavigate: (route: string) => void }) {
  const slideX = useRef(new Animated.Value(-SIDEBAR_W)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const insets = useSafeAreaInsets();

  React.useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(slideX,        { toValue: 0,   duration: 300, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.timing(overlayOpacity,{ toValue: 1,   duration: 280, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideX,        { toValue: -SIDEBAR_W, duration: 260, easing: Easing.in(Easing.cubic), useNativeDriver: true }),
        Animated.timing(overlayOpacity,{ toValue: 0,           duration: 240, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      {/* Dim overlay */}
      <Animated.View style={[S.sidebarOverlay, { opacity: overlayOpacity }]}>
        <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={onClose} />
      </Animated.View>

      {/* Sidebar panel */}
      <Animated.View style={[S.sidebar, { paddingTop: insets.top + 16, transform: [{ translateX: slideX }] }]}>
        {/* Brand */}
        <View style={S.drawerHeader}>
          <Text style={S.drawerBrand}>JADE</Text>
          <Text style={S.drawerUser}>Agente Autônomo Ativo</Text>
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          {MENU_ITEMS.map((item, i) => (
            <TouchableOpacity
              key={i}
              style={S.drawerItem}
              activeOpacity={0.7}
              onPress={() => { onClose(); onNavigate(item.route); }}
            >
              <Text style={S.drawerItemText}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </Animated.View>
    </Modal>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────
type Message = { id: string; text: string; sender: "user" | "ai" };

export default function PreviewChatSidebarScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [sidebarOpen,  setSidebarOpen]  = useState(false);
  const [inputText,    setInputText]    = useState("");
  const [messages,     setMessages]     = useState<Message[]>([]);
  const [activeRoute,  setActiveRoute]  = useState("Chat");
  const scrollRef = useRef<ScrollView>(null);

  const handleSend = () => {
    const trimmed = inputText.trim();
    if (!trimmed) return;
    const userMsg: Message = { id: Date.now().toString(), text: trimmed, sender: "user" };
    setMessages((prev) => [...prev, userMsg]);
    setInputText("");
    setTimeout(() => {
      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        text: "Analisando seus dados comerciais… Em breve trarei insights sobre seu pipeline e oportunidades de up-sell.",
        sender: "ai",
      };
      setMessages((prev) => [...prev, aiMsg]);
      scrollRef.current?.scrollToEnd({ animated: true });
    }, 900);
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  };

  const isEmpty = messages.length === 0;

  return (
    <View style={S.root}>
      <StatusBar barStyle="light-content" backgroundColor="#090A0F" />

      {/* Back button (floating, top-left absolute — only visible when sidebar closed) */}
      <TouchableOpacity
        style={[S.backAbsolute, { top: insets.top + 8 }]}
        onPress={() => router.back()}
        activeOpacity={0.7}
      >
        <Text style={{ color: "#8F94A8", fontSize: 13 }}>✕ Voltar</Text>
      </TouchableOpacity>

      {/* Top bar */}
      <View style={[S.topBar, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity style={S.iconBtn} onPress={() => setSidebarOpen(true)} activeOpacity={0.6}>
          <Text style={S.topIconText}>☰</Text>
        </TouchableOpacity>

        <View style={{ alignItems: "center" }}>
          <Text style={S.topTitle}>JADE IA</Text>
          {activeRoute !== "Chat" && (
            <Text style={{ color: "#00E5FF", fontSize: 10, marginTop: 1 }}>{activeRoute}</Text>
          )}
        </View>

        <TouchableOpacity style={S.iconBtn} activeOpacity={0.6}>
          <Text style={S.topIconText}>⚙️</Text>
        </TouchableOpacity>
      </View>

      {/* Chat area */}
      <ScrollView
        ref={scrollRef}
        style={{ flex: 1 }}
        contentContainerStyle={[S.chatArea, isEmpty && S.chatAreaCentered]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {isEmpty ? (
          <View style={S.welcomeContainer}>
            <Text style={S.aiLogoGlow}>🤖</Text>
            <Text style={S.welcomeText}>Como posso alavancar suas vendas hoje?</Text>
          </View>
        ) : (
          messages.map((msg) => (
            <View
              key={msg.id}
              style={[S.bubble, msg.sender === "user" ? S.bubbleUser : S.bubbleAi]}
            >
              <Text style={[S.bubbleText, msg.sender === "user" ? S.bubbleTextUser : S.bubbleTextAi]}>
                {msg.text}
              </Text>
            </View>
          ))
        )}
      </ScrollView>

      {/* Input bar */}
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
      >
        <View style={[S.inputContainer, { paddingBottom: insets.bottom + 12 }]}>
          <View style={S.inputRow}>
            <TouchableOpacity style={S.innerBarBtn} activeOpacity={0.6}>
              <Text style={S.barIcon}>＋</Text>
            </TouchableOpacity>

            <TextInput
              style={S.textInput}
              placeholder="Perguntar à JADE IA..."
              placeholderTextColor="#626880"
              value={inputText}
              onChangeText={setInputText}
              multiline
              onSubmitEditing={handleSend}
            />

            <TouchableOpacity style={S.sendBtn} activeOpacity={0.8} onPress={handleSend}>
              <Text style={S.sendIcon}>{inputText.trim().length > 0 ? "▲" : "🎙️"}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>

      {/* Sidebar */}
      <Sidebar
        visible={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onNavigate={(route) => setActiveRoute(route)}
      />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const S = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#090A0F" },

  backAbsolute: {
    position: "absolute", right: 16, zIndex: 10,
    backgroundColor: "rgba(255,255,255,0.04)", borderRadius: 10,
    borderWidth: 1, borderColor: "rgba(255,255,255,0.06)",
    paddingHorizontal: 12, paddingVertical: 6,
  },

  topBar: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingHorizontal: 16, paddingBottom: 12,
  },
  iconBtn: {
    width: 42, height: 42, borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.03)",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.05)",
    alignItems: "center", justifyContent: "center",
  },
  topIconText: { color: "#FFFFFF", fontSize: 18 },
  topTitle: { color: "#8F94A8", fontSize: 14, fontWeight: "600", letterSpacing: 1, textTransform: "uppercase" },

  chatArea: { padding: 20, paddingBottom: 10 },
  chatAreaCentered: { flex: 1, justifyContent: "center", alignItems: "center" },
  welcomeContainer: { alignItems: "center" },
  aiLogoGlow: { fontSize: 48, marginBottom: 20 },
  welcomeText: { color: "#FFFFFF", fontSize: 18, fontWeight: "500", textAlign: "center", lineHeight: 26, letterSpacing: -0.3 },

  bubble: { maxWidth: "82%", borderRadius: 18, paddingHorizontal: 16, paddingVertical: 10, marginBottom: 10 },
  bubbleUser: { alignSelf: "flex-end", backgroundColor: "#FFFFFF" },
  bubbleAi:   { alignSelf: "flex-start", backgroundColor: "#161822", borderWidth: 1, borderColor: "#242736" },
  bubbleText: { fontSize: 15, lineHeight: 22 },
  bubbleTextUser: { color: "#090A0F", fontWeight: "500" },
  bubbleTextAi:   { color: "#FFFFFF" },

  inputContainer: { paddingHorizontal: 16, paddingTop: 8, backgroundColor: "#090A0F" },
  inputRow: {
    flexDirection: "row", backgroundColor: "#161822",
    borderRadius: 28, alignItems: "center",
    paddingHorizontal: 8, paddingVertical: 6,
    borderWidth: 1, borderColor: "#242736",
  },
  innerBarBtn: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  barIcon: { color: "#8F94A8", fontSize: 20 },
  textInput: { flex: 1, color: "#FFFFFF", fontSize: 15, paddingHorizontal: 10, maxHeight: 100, paddingTop: Platform.OS === "ios" ? 8 : 4 },
  sendBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: "#FFFFFF", alignItems: "center", justifyContent: "center" },
  sendIcon: { color: "#090A0F", fontSize: 14, fontWeight: "700" },

  // Sidebar
  sidebarOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.6)", zIndex: 10 },
  sidebar: {
    position: "absolute", top: 0, left: 0, bottom: 0,
    width: SIDEBAR_W, backgroundColor: "#11131A",
    borderRightWidth: 1, borderColor: "#242736",
    paddingHorizontal: 16, zIndex: 20,
  },
  drawerHeader: { paddingBottom: 20, borderBottomWidth: 1, borderColor: "#242736", marginBottom: 16 },
  drawerBrand: { color: "#FFFFFF", fontSize: 20, fontWeight: "700", letterSpacing: -0.5 },
  drawerUser: { color: "#00E5FF", fontSize: 12, fontWeight: "500", marginTop: 4 },
  drawerItem: {
    height: 52, borderRadius: 12, justifyContent: "center",
    paddingHorizontal: 16, marginBottom: 8,
    backgroundColor: "rgba(255,255,255,0.02)",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.03)",
  },
  drawerItemText: { color: "#E2E8F0", fontSize: 15, fontWeight: "500" },
});
