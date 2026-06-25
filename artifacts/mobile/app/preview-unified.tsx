import React, { useRef, useState, useEffect } from "react";
import * as ImagePicker from "expo-image-picker";
import { Audio } from "expo-av";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  PanResponder,
  Switch,
  Easing,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  Share,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const { width: SCREEN_W } = Dimensions.get("window");
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Linking from "expo-linking";

// ─── Types ────────────────────────────────────────────────────────────────────
type Route = "Chat" | "Pipeline" | "Route" | "Prospecting" | "Meeting" | "Farmer" | "Reports" | "Marketing" | "Management" | "Kpis" | "CorporatePortfolio" | "Broadcast" | "Feedbacks" | "TeamPulse" | "PulseCheck" | "AccountSettings" | "Subscription";
type PipelineLead  = { id: string; name: string; company: string; value: string; stage: string; daysIdle: number; phone: string };
type AiLead        = { id: string; name: string; segment: string; address: string };
type HistoryItem   = { id: string; query: string; location: string; date: string; leadsCount: number };
type Client        = { id: string; name: string; company: string; health: string; lastContact: string; valueMRR: string; status: string };
type ChatMsg       = { id: string; text: string; sender: "user" | "ai" };
type RouteStop     = { id: string; type: string; title: string; time: string; address: string; status: string; travelTime: string };
type MeetingItem   = { id: string; time: string; title: string; company: string; type: string; prep: string; status: string };

// ─── Data ─────────────────────────────────────────────────────────────────────
const PIPELINE_LEADS: PipelineLead[] = [
  { id: "1", name: "Alex Silva",     company: "TechNova Solutions", value: "R$ 15.400",  stage: "Prospecção", daysIdle: 2, phone: "5511999999999" },
  { id: "2", name: "Beatriz Costa",  company: "Acme Corp",          value: "R$ 42.000",  stage: "Prospecção", daysIdle: 5, phone: "5511988888888" },
  { id: "3", name: "Carlos Eduardo", company: "Vortex Media",       value: "R$ 8.900",   stage: "Contato",    daysIdle: 1, phone: "5511977777777" },
  { id: "4", name: "Diana Prince",   company: "Wayne Enterprises",  value: "R$ 120.000", stage: "Proposta",   daysIdle: 3, phone: "5511966666666" },
  { id: "5", name: "Felipe Ramos",   company: "Stark Labs",         value: "R$ 65.500",  stage: "Fechados",   daysIdle: 0, phone: "5511955555555" },
];
const PIPELINE_STAGES = ["Prospecção", "Contato", "Proposta", "Fechados"];

const AI_LEADS: AiLead[] = [
  { id: "1", name: "Oficina Mecânica Silva", segment: "Mecânica",    address: "Centro, Criciúma"   },
  { id: "2", name: "Padaria Pão Quente",     segment: "Panificadora",address: "Próspera, Criciúma" },
];
const HISTORY_ITEMS: HistoryItem[] = [
  { id: "h1", query: "Restaurantes",     location: "Centro, Criciúma",     date: "Hoje, 14:30",  leadsCount: 42 },
  { id: "h2", query: "Salões de Beleza", location: "Pio Correa, Criciúma", date: "Ontem, 09:15", leadsCount: 18 },
];
const PROSPECT_TABS = ["Busca Manual", "Agente IA", "Histórico"] as const;

const CLIENTS: Client[] = [
  { id: "1", name: "Marta Souza",     company: "Logix Transportes", health: "Saudável",       lastContact: "Há 2 dias",  valueMRR: "R$ 2.500/mês", status: "Ativo"   },
  { id: "2", name: "Roberto Lima",    company: "Glow Estética",      health: "Risco de Churn", lastContact: "Há 24 dias", valueMRR: "R$ 1.200/mês", status: "Atenção" },
  { id: "3", name: "Julia Neves",     company: "Alpha Construtora",  health: "Saudável",       lastContact: "Há 5 dias",  valueMRR: "R$ 5.800/mês", status: "Ativo"   },
  { id: "4", name: "Guilherme Faria", company: "Ponto do Café",      health: "Esfriando",      lastContact: "Há 15 dias", valueMRR: "R$ 900/mês",   status: "Atenção" },
];
const FARMER_TABS = ["Minha Carteira", "Monitoramento IA", "Alertas"] as const;

const DAILY_ROUTE: RouteStop[] = [
  { id: "1", type: "Reunião",    title: "Diretriz Comercial",    time: "09:00", address: "Av. Paulista, 1000",                    status: "Confirmado", travelTime: "15 min" },
  { id: "2", type: "Visita",     title: "Lotus Cosméticos",      time: "11:30", address: "Rua Augusta, 500",                      status: "Sugerido",   travelTime: "10 min" },
  { id: "3", type: "Almoço",     title: "Restaurante Spot",      time: "13:00", address: "Alameda Ministro Rocha Azevedo",         status: "Sugerido",   travelTime: "5 min"  },
  { id: "4", type: "Prospecção", title: "Shopping Cidade SP",    time: "15:00", address: "Av. Paulista, 1230",                    status: "Opcional",   travelTime: "8 min"  },
];

const MEETINGS: MeetingItem[] = [
  { id: "1", time: "09:00", title: "Diretriz Comercial Q3",   company: "Interno",          type: "Reunião",    prep: "Revisar metas do trimestre e pipeline atual.",                 status: "Confirmado" },
  { id: "2", time: "11:30", title: "Demo — CRM Enterprise",   company: "Lotus Cosméticos", type: "Demo",       prep: "Destacar integração WhatsApp e automação de follow-up.",       status: "Confirmado" },
  { id: "3", time: "14:00", title: "Proposta — Plano Anual",  company: "Wayne Enterprises",type: "Proposta",   prep: "Levar deck de ROI. Cliente comparou com concorrente X.",       status: "Pendente"   },
  { id: "4", time: "16:30", title: "Check-in Pós-implantação",company: "Stark Labs",       type: "Pós-venda",  prep: "Perguntar sobre adoção. Oportunidade de up-sell módulo IA.",   status: "Sugerido"   },
];

type ScheduledMeeting = { id: string; client: string; company: string; time: string; aiSummary: string; painPoints: string; prepTip: string };
const SCHEDULED_MEETINGS: ScheduledMeeting[] = [
  { id: "1", client: "Roberto Shinyashiki", company: "Diretriz Comercial", time: "Hoje, 14:00",  aiSummary: "O cliente demonstrou forte interesse em automação de funil. Ele reclamou que a equipe atual perde muitas mensagens no WhatsApp. Tem orçamento aprovado.", painPoints: "Perda de leads, falta de processos", prepTip: "Foque na nossa feature de Agente Autônomo que roda 24/7." },
  { id: "2", client: "Ananda Silveira",     company: "Lotus Cosméticos",   time: "Amanhã, 10:30",aiSummary: "Abordagem fria feita pela IA no Maps. Ela aceitou a reunião apenas para entender o custo-benefício. Receptiva, mas focada em preço.", painPoints: "Precisa reduzir custo operacional", prepTip: "Demonstre o ROI rápido e o plano de entrada do nosso software." },
];
const MEETING_DAYS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"] as const;

// ─── Sidebar (accordion estilo JADE / ChatGPT) ───────────────────────────────
const COMERCIAL_ITEMS: { label: string; route: Route }[] = [
  { label: "💼 Pipeline de Vendas",     route: "Pipeline"    },
  { label: "🗺️ Rota Otimizada do Dia",  route: "Route"       },
  { label: "🤖 Prospecção Maps IA",     route: "Prospecting" },
  { label: "🗓️ Agenda & Briefings",     route: "Meeting"     },
  { label: "📈 Farmer & Retenção",      route: "Farmer"      },
  { label: "📉 KPIs & Relatórios",      route: "Reports"     },
  { label: "🚀 Tráfego & Marketing IA", route: "Marketing"   },
];

function Sidebar({ visible, onClose, currentRoute, onNavigate }: {
  visible: boolean; onClose: () => void;
  currentRoute: Route; onNavigate: (r: Route) => void;
}) {
  const slideX = useRef(new Animated.Value(-SCREEN_W)).current;
  const insets = useSafeAreaInsets();
  const [conversasOpen, setConversasOpen] = useState(true);
  const [comercialOpen, setComercialOpen] = useState(false);
  const [gestaoOpen,    setGestaoOpen]    = useState(false);
  const [contaOpen,     setContaOpen]     = useState(false);

  React.useEffect(() => {
    Animated.timing(slideX, {
      toValue: visible ? 0 : -SCREEN_W,
      duration: visible ? 320 : 270,
      easing: visible ? Easing.out(Easing.cubic) : Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [visible]);

  const go = (r: Route) => { onClose(); onNavigate(r); };

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      {/* Tap-outside to close */}
      <TouchableOpacity style={S.sidebarOverlay} activeOpacity={1} onPress={onClose} />

      <Animated.View style={[S.sidebar, { paddingTop: insets.top + 20, width: SCREEN_W, transform: [{ translateX: slideX }] }]}>
        {/* Header */}
        <View style={S.drawerHeader}>
          <Text style={S.drawerBrand}>JADE</Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
            <View style={S.drawerAvatar}>
              <Text style={{ fontSize: 18 }}>👤</Text>
            </View>
            <TouchableOpacity onPress={onClose} activeOpacity={0.7} style={S.drawerCloseBtn}>
              <Text style={S.drawerCloseBtnText}>✕</Text>
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
          {/* ── Conversas ── */}
          <TouchableOpacity style={S.drawerSection} onPress={() => setConversasOpen((v) => !v)} activeOpacity={0.7}>
            <Text style={S.drawerSectionTitle}>✉️ Conversas</Text>
            <Text style={S.drawerArrow}>{conversasOpen ? "▼" : "►"}</Text>
          </TouchableOpacity>

          {conversasOpen && (
            <View style={S.drawerSubMenu}>
              <TouchableOpacity style={S.drawerSubItem} onPress={() => go("Chat")} activeOpacity={0.7}>
                <Text style={[S.drawerSubText, currentRoute === "Chat" && S.drawerSubTextActive]}>✨ Novo Chat</Text>
              </TouchableOpacity>
              <TouchableOpacity style={S.drawerSubItem} onPress={() => go("Chat")} activeOpacity={0.7}>
                <Text style={S.drawerSubText}>🕒 Histórico de Chats</Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={S.drawerDivider} />

          {/* ── Comercial ── */}
          <TouchableOpacity style={S.drawerSection} onPress={() => setComercialOpen((v) => !v)} activeOpacity={0.7}>
            <Text style={S.drawerSectionTitle}>📊 Comercial</Text>
            <Text style={S.drawerArrow}>{comercialOpen ? "▼" : "►"}</Text>
          </TouchableOpacity>

          {comercialOpen && (
            <View style={S.drawerSubMenu}>
              {COMERCIAL_ITEMS.map((item) => (
                <TouchableOpacity key={item.route} style={S.drawerSubItem} onPress={() => go(item.route)} activeOpacity={0.7}>
                  <Text style={[S.drawerSubText, currentRoute === item.route && S.drawerSubTextActive]}>{item.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <View style={S.drawerDivider} />

          {/* ── Gestão ── */}
          <TouchableOpacity style={S.drawerSection} onPress={() => setGestaoOpen((v) => !v)} activeOpacity={0.7}>
            <Text style={S.drawerSectionTitle}>🛠️ Gestão</Text>
            <Text style={S.drawerArrow}>{gestaoOpen ? "▼" : "►"}</Text>
          </TouchableOpacity>

          {gestaoOpen && (
            <View style={S.drawerSubMenu}>
              <TouchableOpacity style={S.drawerSubItem} onPress={() => go("Management")} activeOpacity={0.7}>
                <Text style={[S.drawerSubText, currentRoute === "Management" && S.drawerSubTextActive]}>👥 Controle de Time & Metas</Text>
              </TouchableOpacity>
              <TouchableOpacity style={S.drawerSubItem} onPress={() => go("Kpis")} activeOpacity={0.7}>
                <Text style={[S.drawerSubText, currentRoute === "Kpis" && S.drawerSubTextActive]}>📊 Metas & KPIs Detalhados</Text>
              </TouchableOpacity>
              <TouchableOpacity style={S.drawerSubItem} onPress={() => go("CorporatePortfolio")} activeOpacity={0.7}>
                <Text style={[S.drawerSubText, currentRoute === "CorporatePortfolio" && S.drawerSubTextActive]}>🏢 Carteira Corporativa</Text>
              </TouchableOpacity>
              <TouchableOpacity style={S.drawerSubItem} onPress={() => go("Broadcast")} activeOpacity={0.7}>
                <Text style={[S.drawerSubText, currentRoute === "Broadcast" && S.drawerSubTextActive]}>📣 Mural da Equipe</Text>
              </TouchableOpacity>
              <TouchableOpacity style={S.drawerSubItem} onPress={() => go("Feedbacks")} activeOpacity={0.7}>
                <Text style={[S.drawerSubText, currentRoute === "Feedbacks" && S.drawerSubTextActive]}>🗣️ Feedbacks 1-on-1</Text>
              </TouchableOpacity>
              <TouchableOpacity style={S.drawerSubItem} onPress={() => go("TeamPulse")} activeOpacity={0.7}>
                <Text style={[S.drawerSubText, currentRoute === "TeamPulse" && S.drawerSubTextActive]}>🧠 Clima Comercial</Text>
              </TouchableOpacity>
              <TouchableOpacity style={S.drawerSubItem} onPress={() => go("PulseCheck")} activeOpacity={0.7}>
                <Text style={[S.drawerSubText, currentRoute === "PulseCheck" && S.drawerSubTextActive]}>💬 Check de Sentimento</Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={S.drawerDivider} />

          {/* ── Conta ── */}
          <TouchableOpacity style={S.drawerSection} onPress={() => setContaOpen((v) => !v)} activeOpacity={0.7}>
            <Text style={S.drawerSectionTitle}>⚙️ Conta</Text>
            <Text style={S.drawerArrow}>{contaOpen ? "▼" : "►"}</Text>
          </TouchableOpacity>

          {contaOpen && (
            <View style={S.drawerSubMenu}>
              <TouchableOpacity style={S.drawerSubItem} onPress={() => go("AccountSettings")} activeOpacity={0.7}>
                <Text style={[S.drawerSubText, currentRoute === "AccountSettings" && S.drawerSubTextActive]}>🧠 Meu Perfil & Cérebro IA</Text>
              </TouchableOpacity>
              <TouchableOpacity style={S.drawerSubItem} onPress={() => go("Subscription")} activeOpacity={0.7}>
                <Text style={[S.drawerSubText, currentRoute === "Subscription" && S.drawerSubTextActive]}>💳 Planos de Assinatura</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </Animated.View>
    </Modal>
  );
}

// ─── Shared top bar ───────────────────────────────────────────────────────────
function TopBar({ title, subtitle, onMenu }: { title: string; subtitle?: string; onMenu: () => void }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[S.topBar, { paddingTop: insets.top + 10 }]}>
      <TouchableOpacity style={S.iconBtn} onPress={onMenu} activeOpacity={0.6}>
        <Text style={S.topIconText}>☰</Text>
      </TouchableOpacity>
      <View style={{ alignItems: "center" }}>
        {subtitle && <Text style={S.topSubtitle}>{subtitle}</Text>}
        <Text style={S.topTitle}>{title}</Text>
      </View>
      <TouchableOpacity style={S.iconBtn} activeOpacity={0.6}>
        <Text style={S.topIconText}>⚙️</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── Screen: Chat ─────────────────────────────────────────────────────────────
function ChatView({ onMenu }: { onMenu: () => void }) {
  const insets   = useSafeAreaInsets();
  const [input,      setInput]      = useState("");
  const [messages,   setMessages]   = useState<ChatMsg[]>([]);
  const [isThinking, setIsThinking] = useState(false);
  const [recording,  setRecording]  = useState<Audio.Recording | null>(null);
  const scrollRef = useRef<ScrollView>(null);

  // ── Request audio permission on mount ──────────────────────────────────────
  useEffect(() => {
    Audio.requestPermissionsAsync();
  }, []);

  // ── Scroll to bottom whenever messages change ───────────────────────────────
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 80);
    }
  }, [messages]);

  // ──────────────────────────────────────────────────────────────────────────
  // fetchJadeAIResponse — stub preparado para receber chave de API
  // Substitua o conteúdo desta função com sua chamada real (OpenAI / Anthropic)
  // ──────────────────────────────────────────────────────────────────────────
  const fetchJadeAIResponse = async (_userMessage: string): Promise<string> => {
    // TODO: substituir pela chamada real à API
    // Exemplo: const res = await openai.chat.completions.create({ ... })
    await new Promise((r) => setTimeout(r, 1200));
    return "Analisando seus dados comerciais… Em breve trarei insights sobre seu pipeline e oportunidades de up-sell.";
  };

  // ── Enviar mensagem de texto ────────────────────────────────────────────────
  const send = async () => {
    const t = input.trim();
    if (!t || isThinking) return;
    const userMsg: ChatMsg = { id: Date.now().toString(), text: t, sender: "user" };
    setMessages((p) => [...p, userMsg]);
    setInput("");
    setIsThinking(true);
    const reply = await fetchJadeAIResponse(t);
    setMessages((p) => [...p, { id: (Date.now() + 1).toString(), text: reply, sender: "ai" }]);
    setIsThinking(false);
  };

  // ── Abrir galeria com expo-image-picker ────────────────────────────────────
  const pickImage = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) { Alert.alert("Permissão necessária", "Permita acesso à galeria para enviar imagens."); return; }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.8 });
    if (!result.canceled && result.assets[0]) {
      const uri = result.assets[0].uri;
      setMessages((p) => [...p, { id: Date.now().toString(), text: `📎 Imagem enviada: ${uri.split("/").pop()}`, sender: "user" }]);
    }
  };

  // ── Gravar / parar áudio com expo-av ──────────────────────────────────────
  const toggleRecording = async () => {
    if (recording) {
      await recording.stopAndUnloadAsync();
      setRecording(null);
      setMessages((p) => [...p, { id: Date.now().toString(), text: "🎙️ Mensagem de voz enviada", sender: "user" }]);
    } else {
      try {
        await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
        const { recording: rec } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
        setRecording(rec);
      } catch {
        Alert.alert("Erro", "Não foi possível iniciar a gravação.");
      }
    }
  };

  const hasText = input.trim().length > 0;

  return (
    <View style={{ flex: 1 }}>
      <TopBar title="JADE" onMenu={onMenu} />

      <ScrollView
        ref={scrollRef}
        style={{ flex: 1 }}
        contentContainerStyle={[S.chatArea, messages.length === 0 && S.chatAreaCenter]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {messages.length === 0 ? (
          <View style={S.welcomeWrap}>
            <Text style={S.welcomeText}>Como posso alavancar{"\n"}suas vendas hoje?</Text>
          </View>
        ) : (
          messages.map((m) => (
            <View key={m.id} style={[S.bubble, m.sender === "user" ? S.bubbleUser : S.bubbleAi]}>
              <Text style={[S.bubbleText, m.sender === "user" ? S.bubbleTextUser : S.bubbleTextAi]}>{m.text}</Text>
            </View>
          ))
        )}

        {/* Indicador "JADE está pensando..." */}
        {isThinking && (
          <View style={[S.bubble, S.bubbleAi, { flexDirection: "row", alignItems: "center", gap: 8 }]}>
            <ActivityIndicator size="small" color="#00E5FF" />
            <Text style={[S.bubbleTextAi, { color: "#8F94A8" }]}>JADE está pensando…</Text>
          </View>
        )}
      </ScrollView>

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <View style={[S.inputContainer, { paddingBottom: insets.bottom + 12 }]}>
          <View style={S.inputRowInside}>
            {!recording ? (
              <>
                <TouchableOpacity style={S.innerBarButton} onPress={pickImage} activeOpacity={0.6}>
                  <Text style={S.barIcon}>＋</Text>
                </TouchableOpacity>
                <TextInput
                  style={S.textInputStyle}
                  placeholder="Perguntar à JADE..."
                  placeholderTextColor="#626880"
                  value={input}
                  onChangeText={setInput}
                  multiline
                />
                <TouchableOpacity
                  style={S.sendButtonCircle}
                  onPress={hasText ? send : toggleRecording}
                  activeOpacity={0.8}
                >
                  <Text style={S.sendIcon}>{hasText ? "▲" : "🎙️"}</Text>
                </TouchableOpacity>
              </>
            ) : (
              <View style={S.recordingWaveContainer}>
                <Text style={S.recordingLabel}>Gravando áudio...</Text>
                <View style={S.waveRow}>
                  <View style={[S.waveLine, { height: 12 }]} />
                  <View style={[S.waveLine, { height: 24 }]} />
                  <View style={[S.waveLine, { height: 18 }]} />
                  <View style={[S.waveLine, { height: 28 }]} />
                  <View style={[S.waveLine, { height: 14 }]} />
                </View>
                <TouchableOpacity
                  style={[S.sendButtonCircle, { backgroundColor: "#38A169" }]}
                  onPress={toggleRecording}
                  activeOpacity={0.8}
                >
                  <Text style={[S.sendIcon, { color: "#FFFFFF" }]}>✓</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

// ─── Screen: Pipeline ─────────────────────────────────────────────────────────
function PipelineView({ onMenu }: { onMenu: () => void }) {
  const [stage,        setStage]        = useState("Prospecção");
  const [selectedLead, setSelectedLead] = useState<PipelineLead | null>(null);
  const filtered = PIPELINE_LEADS.filter((l) => l.stage === stage);
  const total    = filtered.reduce((a, l) => a + parseFloat(l.value.replace("R$ ","").replace(".","").replace(",",".")), 0)
                           .toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  return (
    <View style={{ flex: 1 }}>
      <TopBar title={total} subtitle={stage.toUpperCase()} onMenu={onMenu} />
      <View style={S.tabsWrapper}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={S.tabsScroll}>
          {PIPELINE_STAGES.map((s) => {
            const active = stage === s;
            return (
              <TouchableOpacity key={s} style={S.tabBtn} onPress={() => setStage(s)} activeOpacity={0.8}>
                <Text style={[S.tabText, active && S.tabTextActive]}>{s} ({PIPELINE_LEADS.filter(l=>l.stage===s).length})</Text>
                {active && <View style={S.tabLine} />}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
      <FlatList
        data={filtered}
        keyExtractor={(i) => i.id}
        contentContainerStyle={S.list}
        renderItem={({ item }) => (
          <TouchableOpacity style={S.card} activeOpacity={0.7} onPress={() => setSelectedLead(item)}>
            <View style={S.cardHead}>
              <Text style={S.cardName}>{item.name}</Text>
              <View style={S.badge}><Text style={S.badgeText}>{item.daysIdle}d ativo</Text></View>
            </View>
            <Text style={S.cardSub}>{item.company}</Text>
            <View style={S.cardFoot}>
              <Text style={S.cardValue}>{item.value}</Text>
              <View style={[S.dot, { backgroundColor: stage === "Fechados" ? "#38A169" : "#00E5FF" }]} />
            </View>
          </TouchableOpacity>
        )}
      />
      <Modal visible={selectedLead !== null} animationType="slide" transparent onRequestClose={() => setSelectedLead(null)}>
        <TouchableOpacity style={S.overlay} activeOpacity={1} onPress={() => setSelectedLead(null)}>
          <View style={S.sheet}>
            <View style={S.handle} />
            {selectedLead && (
              <>
                <Text style={S.sheetCompany}>{selectedLead.company}</Text>
                <Text style={S.sheetName}>{selectedLead.name}</Text>
                <Text style={S.sheetValue}>{selectedLead.value}</Text>
                <View style={S.actionRow}>
                  <TouchableOpacity style={S.actionBtn} onPress={() => Linking.openURL(`whatsapp://send?phone=${selectedLead.phone}`)}><Text style={S.actionBtnText}>WhatsApp</Text></TouchableOpacity>
                  <TouchableOpacity style={[S.actionBtn, S.actionBtnSec]} onPress={() => Linking.openURL(`tel:${selectedLead.phone}`)}><Text style={S.actionBtnSecText}>Ligar</Text></TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

// ─── Screen: Route ────────────────────────────────────────────────────────────
function RouteView({ onMenu }: { onMenu: () => void }) {
  const insets = useSafeAreaInsets();
  const [confirmed, setConfirmed] = useState(false);

  return (
    <View style={{ flex: 1 }}>
      <TopBar title="Rota Otimizada 📍" subtitle="PLANEJAMENTO DIÁRIO" onMenu={onMenu} />

      {/* Map placeholder */}
      <View style={S.mapPreview}>
        <Text style={S.mapText}>Visualização do Trajeto no Mapa</Text>
        <Text style={S.mapSubText}>4 paradas • 32 min total de deslocamento</Text>
      </View>

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        <Text style={[S.sectionLabel, { paddingHorizontal: 20, marginBottom: 16 }]}>CRONOGRAMA DO DIA</Text>
        {DAILY_ROUTE.map((item, index) => {
          const isLast = index === DAILY_ROUTE.length - 1;
          return (
            <View key={item.id} style={S.timelineRow}>
              {/* Timeline sidebar */}
              <View style={S.timelineSide}>
                <Text style={S.timelineTime}>{item.time}</Text>
                <View style={[S.timelineDot, item.status === "Confirmado" ? S.dotConfirmed : S.dotSuggested]} />
                {!isLast && <View style={S.timelineLine} />}
              </View>
              {/* Event card */}
              <View style={S.eventCard}>
                <View style={S.eventHead}>
                  <Text style={S.eventType}>{item.type}</Text>
                  <Text style={S.travelTime}>🚗 {item.travelTime}</Text>
                </View>
                <Text style={S.eventTitle}>{item.title}</Text>
                <Text style={S.eventAddress}>{item.address}</Text>
                {item.status === "Sugerido" && !confirmed && (
                  <View style={S.suggestionBadge}>
                    <Text style={S.suggestionText}>✨ Sugestão da IA</Text>
                  </View>
                )}
              </View>
            </View>
          );
        })}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* FAB */}
      <View style={[S.fabContainer, { bottom: insets.bottom + 20 }]}>
        {!confirmed ? (
          <TouchableOpacity style={S.confirmBtn} onPress={() => setConfirmed(true)} activeOpacity={0.8}>
            <Text style={S.confirmBtnText}>Confirmar Rota do Dia 🚀</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={[S.confirmBtn, S.startBtn]} activeOpacity={0.8}>
            <Text style={[S.confirmBtnText, { color: "#090A0F" }]}>Iniciar Navegação Waze/Maps</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

// ─── Screen: Prospecting ─────────────────────────────────────────────────────
function ProspectingView({ onMenu }: { onMenu: () => void }) {
  const [tab,      setTab]      = useState<(typeof PROSPECT_TABS)[number]>("Busca Manual");
  const [segment,  setSegment]  = useState("");
  const [city,     setCity]     = useState("");
  const [scanning, setScanning] = useState(false);

  const scan = () => {
    if (!segment || !city) return;
    setScanning(true);
    setTimeout(() => { setScanning(false); setTab("Agente IA"); }, 2000);
  };

  return (
    <View style={{ flex: 1 }}>
      <TopBar title="Maps Scraper" subtitle="AUTOMAÇÃO" onMenu={onMenu} />
      <View style={S.tabsWrapper}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={S.tabsScroll}>
          {PROSPECT_TABS.map((t) => {
            const active = tab === t;
            return (
              <TouchableOpacity key={t} style={S.tabBtn} onPress={() => setTab(t)} activeOpacity={0.8}>
                <Text style={[S.tabText, active && S.tabTextActive]}>{t}</Text>
                {active && <View style={S.tabLine} />}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
      {tab === "Busca Manual" && (
        <ScrollView style={S.form} keyboardShouldPersistTaps="handled">
          <Text style={S.label}>SEGMENTO</Text>
          <TextInput style={S.input} placeholder="Ex: Clínicas, Auto peças" placeholderTextColor="#4E5366" value={segment} onChangeText={setSegment} />
          <Text style={S.label}>CIDADE</Text>
          <TextInput style={S.input} placeholder="Ex: São Paulo, Criciúma" placeholderTextColor="#4E5366" value={city} onChangeText={setCity} />
          <TouchableOpacity style={[S.primaryBtn, (!segment||!city) && S.primaryBtnDisabled]} onPress={scan} activeOpacity={0.8} disabled={scanning||!segment||!city}>
            {scanning ? <ActivityIndicator color="#090A0F" /> : <Text style={S.primaryBtnText}>Ligar Agente Google Maps 🤖</Text>}
          </TouchableOpacity>
          <Text style={S.helperText}>O robô vai simular cliques no mapa para extrair telefones válidos.</Text>
        </ScrollView>
      )}
      {tab === "Agente IA" && (
        <FlatList data={AI_LEADS} keyExtractor={(i) => i.id} contentContainerStyle={S.list} renderItem={({ item }) => (
          <View style={S.card}>
            <View style={S.cardHead}><Text style={S.cardName}>{item.name}</Text><View style={S.aiBadge}><Text style={S.aiBadgeText}>🤖 Maps IA</Text></View></View>
            <Text style={S.cardSub}>{item.segment} • {item.address}</Text>
          </View>
        )} ListEmptyComponent={<View style={S.empty}><Text style={S.emptyText}>Ative o robô na busca manual primeiro</Text></View>} />
      )}
      {tab === "Histórico" && (
        <FlatList data={HISTORY_ITEMS} keyExtractor={(i) => i.id} contentContainerStyle={S.list} renderItem={({ item }) => (
          <View style={S.card}>
            <View style={S.cardHead}><Text style={S.cardName}>{item.query}</Text><Text style={S.cardDate}>{item.date}</Text></View>
            <Text style={S.cardSub}>{item.location}</Text>
            <Text style={S.histCount}>📈 {item.leadsCount} leads gerados</Text>
          </View>
        )} />
      )}
    </View>
  );
}

// ─── Screen: Meeting ─────────────────────────────────────────────────────────
const MEETING_VIEW_TABS = ["Próximas Reuniões", "Configurar Robô"] as const;

function MeetingView({ onMenu }: { onMenu: () => void }) {
  const [tab,          setTab]          = useState<(typeof MEETING_VIEW_TABS)[number]>("Próximas Reuniões");
  const [selected,     setSelected]     = useState<ScheduledMeeting | null>(null);
  const [aiActive,     setAiActive]     = useState(true);
  const [activeDays,   setActiveDays]   = useState(["Seg","Ter","Qua","Qui","Sex"]);

  const toggleDay = (d: string) =>
    setActiveDays((prev) => prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]);

  return (
    <View style={{ flex: 1 }}>
      <TopBar title="Reuniões da IA" subtitle="INTELIGÊNCIA DE VENDAS" onMenu={onMenu} />

      {/* Tabs */}
      <View style={S.tabsWrapper}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={S.tabsScroll}>
          {MEETING_VIEW_TABS.map((t) => {
            const active = tab === t;
            return (
              <TouchableOpacity key={t} style={S.tabBtn} onPress={() => setTab(t)} activeOpacity={0.8}>
                <Text style={[S.tabText, active && S.tabTextActive]}>{t}</Text>
                {active && <View style={S.tabLine} />}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Aba 1: Próximas Reuniões */}
      {tab === "Próximas Reuniões" && (
        <FlatList
          data={SCHEDULED_MEETINGS}
          keyExtractor={(i) => i.id}
          contentContainerStyle={S.list}
          renderItem={({ item }) => (
            <TouchableOpacity style={S.card} onPress={() => setSelected(item)} activeOpacity={0.7}>
              <View style={S.cardHead}>
                <View style={{ flex: 1 }}>
                  <Text style={S.cardName}>{item.client}</Text>
                  <Text style={S.cardSub2}>{item.company}</Text>
                </View>
                <View style={S.badge}><Text style={S.badgeText}>{item.time}</Text></View>
              </View>
              <View style={S.meetBriefPreview}>
                <Text style={S.meetBriefLabel}>🤖 RESUMO DA IA:</Text>
                <Text style={[S.cardSub, { marginBottom: 4 }]} numberOfLines={2}>{item.aiSummary}</Text>
              </View>
              <Text style={{ fontSize: 12, color: "#00E5FF", fontWeight: "500" }}>Toque para ver o Briefing de Preparação →</Text>
            </TouchableOpacity>
          )}
        />
      )}

      {/* Aba 2: Configurar Robô */}
      {tab === "Configurar Robô" && (
        <ScrollView style={S.form} showsVerticalScrollIndicator={false}>
          {/* AI toggle */}
          <View style={S.configRow}>
            <View style={{ flex: 1, marginRight: 16 }}>
              <Text style={S.cardName}>Agendamento Autônomo</Text>
              <Text style={[S.cardSub, { marginBottom: 0 }]}>Permitir que a IA marque reuniões direto no WhatsApp</Text>
            </View>
            <Switch
              value={aiActive}
              onValueChange={setAiActive}
              trackColor={{ false: "#161822", true: "#00E5FF" }}
              thumbColor={aiActive ? "#FFFFFF" : "#8F94A8"}
            />
          </View>

          {/* Days */}
          <Text style={[S.sectionLabel, { marginBottom: 14 }]}>DIAS DISPONÍVEIS DA IA</Text>
          <View style={S.daysGrid}>
            {MEETING_DAYS.map((d) => {
              const chosen = activeDays.includes(d);
              return (
                <TouchableOpacity
                  key={d}
                  style={[S.dayChip, chosen && S.dayChipActive]}
                  onPress={() => toggleDay(d)}
                  activeOpacity={0.7}
                >
                  <Text style={[S.dayChipText, chosen && S.dayChipTextActive]}>{d}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Time window */}
          <Text style={[S.sectionLabel, { marginBottom: 14 }]}>JANELA HORÁRIA DISPONÍVEL</Text>
          <TouchableOpacity style={S.timeWindowBtn} activeOpacity={0.7}>
            <Text style={{ color: "#FFFFFF", fontSize: 16, fontWeight: "600" }}>09:00 às 18:00</Text>
            <Text style={{ color: "#00E5FF", fontSize: 13, fontWeight: "500" }}>Editar Janela 🗓️</Text>
          </TouchableOpacity>

          <Text style={S.helperText}>
            A IA analisará os intervalos ocupados na sua agenda nativa e oferecerá apenas os espaços livres dentro destas configurações.
          </Text>
          <View style={{ height: 40 }} />
        </ScrollView>
      )}

      {/* Briefing full bottom sheet */}
      <Modal visible={selected !== null} animationType="slide" transparent onRequestClose={() => setSelected(null)}>
        <TouchableOpacity style={S.overlay} activeOpacity={1} onPress={() => setSelected(null)}>
          <View style={[S.sheet, { paddingBottom: 32 }]} onStartShouldSetResponder={() => true}>
            <View style={S.handle} />
            {selected && (
              <>
                <Text style={S.sheetCompany}>{selected.company}</Text>
                <Text style={S.sheetName}>{selected.client}</Text>
                <Text style={[S.cardSub, { marginBottom: 16 }]}>🕒 {selected.time}</Text>

                <View style={S.briefingBox}>
                  <Text style={S.briefingLabel}>🤖 HISTÓRICO DA CONVERSA NO WHATSAPP</Text>
                  <Text style={S.briefingText}>{selected.aiSummary}</Text>
                </View>

                <View style={[S.briefingBox, { borderColor: "rgba(233,62,62,0.3)", backgroundColor: "rgba(233,62,62,0.04)", marginTop: 10 }]}>
                  <Text style={[S.briefingLabel, { color: "#E93E3E" }]}>🔥 DORES CRÍTICAS IDENTIFICADAS</Text>
                  <Text style={S.briefingText}>{selected.painPoints}</Text>
                </View>

                <View style={[S.briefingBox, { borderColor: "rgba(56,161,105,0.3)", backgroundColor: "rgba(56,161,105,0.04)", marginTop: 10 }]}>
                  <Text style={[S.briefingLabel, { color: "#38A169" }]}>🎯 DIRECIONAMENTO PARA FECHAMENTO</Text>
                  <Text style={S.briefingText}>{selected.prepTip}</Text>
                </View>

                <TouchableOpacity style={[S.primaryBtn, { marginTop: 20 }]} onPress={() => setSelected(null)} activeOpacity={0.8}>
                  <Text style={S.primaryBtnText}>Fechar Preparação</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

// ─── Screen: Farmer ──────────────────────────────────────────────────────────
function FarmerView({ onMenu }: { onMenu: () => void }) {
  const [tab,       setTab]       = useState<(typeof FARMER_TABS)[number]>("Minha Carteira");
  const [analyzing, setAnalyzing] = useState(false);
  const [report,    setReport]    = useState<{ healthScore: string; churnPrevented: string; expansionOpportunity: string } | null>(null);
  const displayed = tab === "Alertas" ? CLIENTS.filter((c) => c.status === "Atenção") : CLIENTS;

  return (
    <View style={{ flex: 1 }}>
      <TopBar title="Carteira Ativa" subtitle="RETENÇÃO & FARMER" onMenu={onMenu} />
      <View style={S.tabsWrapper}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={S.tabsScroll}>
          {FARMER_TABS.map((t) => {
            const active = tab === t;
            return (
              <TouchableOpacity key={t} style={S.tabBtn} onPress={() => setTab(t)} activeOpacity={0.8}>
                <Text style={[S.tabText, active && S.tabTextActive]}>{t}</Text>
                {active && <View style={S.tabLine} />}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
      {(tab === "Minha Carteira" || tab === "Alertas") && (
        <FlatList data={displayed} keyExtractor={(i) => i.id} contentContainerStyle={S.list}
          ListEmptyComponent={<View style={S.empty}><Text style={S.emptyText}>Nenhum alerta no momento</Text></View>}
          renderItem={({ item }) => {
            const risk = item.health === "Risco de Churn" || item.health === "Esfriando";
            return (
              <View style={S.card}>
                <View style={S.cardHead}>
                  <View style={{ flex: 1 }}><Text style={S.cardName}>{item.name}</Text><Text style={S.cardSub2}>{item.company}</Text></View>
                  <View style={[S.healthBadge, risk && S.healthBadgeRisk]}>
                    <Text style={[S.healthText, risk && S.healthTextRisk]}>{item.health}</Text>
                  </View>
                </View>
                <View style={[S.cardFoot, { borderTopWidth: 1, borderColor: "#242736", paddingTop: 14 }]}>
                  <View><Text style={S.label2}>CONTRATO RECORRENTE</Text><Text style={S.cardValue}>{item.valueMRR}</Text></View>
                  <View style={{ alignItems: "flex-end" }}><Text style={S.label2}>ÚLTIMO CONTATO</Text><Text style={S.cardSub}>{item.lastContact}</Text></View>
                </View>
              </View>
            );
          }}
        />
      )}
      {tab === "Monitoramento IA" && (
        <ScrollView style={S.form}>
          <View style={S.aiHeroCard}>
            <Text style={S.aiHeroTitle}>Acompanhamento Pós-Venda Autônomo 🤖</Text>
            <Text style={S.aiHeroDesc}>Nossa IA analisa histórico de conversas e prevê insatisfações antes do cancelamento.</Text>
            <TouchableOpacity style={[S.primaryBtn, analyzing && S.primaryBtnDisabled]} onPress={() => { setAnalyzing(true); setTimeout(() => { setAnalyzing(false); setReport({ healthScore: "92%", churnPrevented: "2 clientes salvos", expansionOpportunity: "R$ 4.300 em Up-sell detectado" }); }, 2500); }} disabled={analyzing} activeOpacity={0.8}>
              {analyzing ? <ActivityIndicator color="#090A0F" /> : <Text style={S.primaryBtnText}>Escanear Carteira com IA</Text>}
            </TouchableOpacity>
          </View>
          {report && (
            <View>
              <Text style={[S.cardName, { marginBottom: 14 }]}>Análise Comercial Concluída</Text>
              <View style={{ flexDirection: "row", gap: 10, marginBottom: 16 }}>
                <View style={[S.card, { flex: 1 }]}><Text style={S.label2}>HEALTH SCORE</Text><Text style={[S.cardValue, { color: "#00E5FF", fontSize: 20 }]}>{report.healthScore}</Text></View>
                <View style={[S.card, { flex: 1 }]}><Text style={S.label2}>EXPANSÃO</Text><Text style={[S.cardValue, { color: "#38A169", fontSize: 20 }]}>Up-sell</Text></View>
              </View>
              <View style={S.insightBox}>
                <Text style={S.insightTitle}>⚡ Insights Prontos:</Text>
                <Text style={S.insightText}>• {report.churnPrevented} — mensagem de relacionamento agendada.</Text>
                <Text style={S.insightText}>• {report.expansionOpportunity}.</Text>
              </View>
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}

// ─── Screen: Reports ─────────────────────────────────────────────────────────
type AiReport = { status: string; diagnostic: string; actionPlan: string };
const REPORT_TABS = ["Produção Diária", "Visão Semanal"] as const;
const DAILY_METRICS  = [
  { name: "Visitas Comerciais",      progress: "3 / 5",           pct: "60%",  color: "#E93E3E" },
  { name: "Contatos via WhatsApp IA",progress: "42 / 40",         pct: "100%", color: "#38A169" },
];
const WEEKLY_METRICS = [
  { name: "Novas Propostas Enviadas",progress: "8 / 12",          pct: "66%",  color: "#00E5FF" },
  { name: "Volume Financeiro Fechado",progress: "R$ 65.500 / R$ 100k", pct: "65%", color: "#00E5FF" },
];

function ReportsView({ onMenu }: { onMenu: () => void }) {
  const [tab,       setTab]       = useState<(typeof REPORT_TABS)[number]>("Produção Diária");
  const [loading,   setLoading]   = useState(false);
  const [aiReport,  setAiReport]  = useState<AiReport>({
    status:      "Abaixo da Meta (Gap Detectado)",
    diagnostic:  "Você realizou 3 visitas das 5 planejadas hoje. O maior gargalo está no tempo médio de deslocamento na rota da tarde.",
    actionPlan:  "A IA otimizou sua agenda de amanhã para reduzir em 22% o trânsito. Foque nas duas propostas pendentes no Pipeline para bater o KPI da semana.",
  });

  const generateReport = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setAiReport({
        status:      "Análise Atualizada em Tempo Real",
        diagnostic:  "Novos dados processados: 1 lead avançou para a etapa de Proposta nas últimas duas horas. Ritmo de fechamento subiu para estável.",
        actionPlan:  'Dispare o acompanhamento automático no WhatsApp para o cliente "Diana Prince" agora mesmo para garantir a meta.',
      });
    }, 2000);
  };

  const isGap = aiReport.status.includes("Gap");
  const metrics = tab === "Produção Diária" ? DAILY_METRICS : WEEKLY_METRICS;

  return (
    <View style={{ flex: 1 }}>
      <TopBar title="Relatórios IA" subtitle="PERFORMANCE & KPIs" onMenu={onMenu} />
      <View style={S.tabsWrapper}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={S.tabsScroll}>
          {REPORT_TABS.map((t) => {
            const active = tab === t;
            return (
              <TouchableOpacity key={t} style={S.tabBtn} onPress={() => setTab(t)} activeOpacity={0.8}>
                <Text style={[S.tabText, active && S.tabTextActive]}>{t}</Text>
                {active && <View style={S.tabLine} />}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView style={S.form} showsVerticalScrollIndicator={false}>
        {/* Live trigger */}
        <TouchableOpacity
          style={[S.primaryBtn, loading && S.primaryBtnDisabled]}
          activeOpacity={0.8}
          onPress={generateReport}
          disabled={loading}
        >
          {loading ? <ActivityIndicator color="#090A0F" /> : <Text style={S.primaryBtnText}>⚡ Gerar Laudo IA na Hora</Text>}
        </TouchableOpacity>
        <Text style={[S.helperText, { marginTop: -8, marginBottom: 20 }]}>Robô configurado para relatório automático às 18:00</Text>

        {/* AI Diagnostic box */}
        <View style={S.reportBox}>
          <View style={S.reportBoxHead}>
            <Text style={S.reportBoxTitle}>🤖 Diagnóstico Consultivo IA</Text>
            <View style={[S.reportStatusChip, isGap ? S.chipRed : S.chipGreen]}>
              <Text style={[S.reportStatusText, { color: isGap ? "#E93E3E" : "#38A169" }]}>{aiReport.status}</Text>
            </View>
          </View>
          <Text style={S.reportLabel}>O QUE ESTÁ ACONTECENDO:</Text>
          <Text style={S.reportMuted}>{aiReport.diagnostic}</Text>
          <View style={{ height: 1, backgroundColor: "#242736", marginVertical: 14 }} />
          <Text style={S.reportLabel}>PLANO DE AÇÃO CORRETIVO:</Text>
          <Text style={S.reportWhite}>💡 {aiReport.actionPlan}</Text>
        </View>

        {/* KPI metrics */}
        <Text style={[S.sectionLabel, { marginBottom: 14 }]}>ACOMPANHAMENTO DE METAS</Text>
        <View style={S.metricsBox}>
          {metrics.map((m, i) => (
            <View key={i} style={[S.metricRow, i < metrics.length - 1 && { marginBottom: 18 }]}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 6 }}>
                <Text style={{ fontSize: 14, color: "#FFFFFF", fontWeight: "500" }}>{m.name}</Text>
                <Text style={{ fontSize: 13, color: "#8F94A8", fontWeight: "600" }}>{m.progress}</Text>
              </View>
              <View style={S.progressTrack}>
                <View style={[S.progressBar, { width: m.pct as any, backgroundColor: m.color }]} />
              </View>
            </View>
          ))}
        </View>
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

// ─── Screen: Marketing ───────────────────────────────────────────────────────
type AiStrategy = { meta: string; google: string; bestTimes: string; expectedLeads: string };
const MARKETING_TABS = ["Campanhas Ativas", "Criativos Redes"] as const;
const CREATIVE_HEADLINE = '"Cansado de perder leads na sua empresa?"';
const CREATIVE_BODY = "Legenda sugerida: Deixar dinheiro na mesa dói. Enquanto você atende um cliente, nossa IA qualifica e agenda os próximos direto no seu WhatsApp comercial. Toque no link e mude o ritmo do seu negócio.";

function MarketingView({ onMenu }: { onMenu: () => void }) {
  const insets = useSafeAreaInsets();
  const [tab,         setTab]         = useState<(typeof MARKETING_TABS)[number]>("Campanhas Ativas");
  const [budgetOpen,  setBudgetOpen]  = useState(false);
  const [calculating, setCalculating] = useState(false);
  const [investment,  setInvestment]  = useState("");
  const [days,        setDays]        = useState("");
  const [strategy,    setStrategy]    = useState<AiStrategy | null>(null);

  const generate = () => {
    if (!investment || !days) return;
    setCalculating(true);
    setTimeout(() => {
      setCalculating(false);
      const v = parseFloat(investment);
      setStrategy({
        meta:          `R$ ${(v * 0.6).toFixed(0)} no Meta Ads (Instagram/FB Reels)`,
        google:        `R$ ${(v * 0.4).toFixed(0)} no Google Ads (Busca Local)`,
        bestTimes:     "Terças e Quintas, das 11:30 às 13:30 e 18:00 às 20:30",
        expectedLeads: `${Math.floor(v / 8)} a ${Math.floor(v / 5)} leads qualificados`,
      });
    }, 2000);
  };

  const shareCreative = async () => {
    try {
      await Share.share({ message: `${CREATIVE_HEADLINE}\n\n${CREATIVE_BODY}` });
    } catch {
      Alert.alert("Erro", "Não foi possível compartilhar o criativo.");
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <TopBar title="Marketing IA" subtitle="GROWTH & TRÁFEGO" onMenu={onMenu} />

      {/* Budget launcher */}
      <View style={{ paddingHorizontal: 20, marginBottom: 14 }}>
        <TouchableOpacity style={S.mktLaunchBtn} onPress={() => setBudgetOpen(true)} activeOpacity={0.8}>
          <Text style={S.mktLaunchText}>💰 Planejar Verba de Tráfego Pago →</Text>
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={S.tabsWrapper}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={S.tabsScroll}>
          {MARKETING_TABS.map((t) => {
            const active = tab === t;
            return (
              <TouchableOpacity key={t} style={S.tabBtn} onPress={() => setTab(t)} activeOpacity={0.8}>
                <Text style={[S.tabText, active && S.tabTextActive]}>{t}</Text>
                {active && <View style={S.tabLine} />}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Campanhas */}
      {tab === "Campanhas Ativas" && (
        <ScrollView style={S.form} showsVerticalScrollIndicator={false}>
          <Text style={[S.sectionLabel, { marginBottom: 16 }]}>MÉTRICAS DE TRÁFEGO ATUAIS</Text>
          <View style={S.card}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <View>
                <Text style={S.label2}>CUSTO POR LEAD (CPL)</Text>
                <Text style={{ fontSize: 24, fontWeight: "700", color: "#FFFFFF", marginTop: 4 }}>R$ 6,42</Text>
              </View>
              <View style={{ backgroundColor: "rgba(56,161,105,0.1)", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 }}>
                <Text style={{ color: "#38A169", fontSize: 11, fontWeight: "600" }}>↓ 14% mais barato</Text>
              </View>
            </View>
            <Text style={S.cardSub}>O robô reduziu o custo otimizando o raio geográfico do Google Maps.</Text>
          </View>
          <View style={S.card}>
            <Text style={S.label2}>ROAS GLOBAL (RETORNO)</Text>
            <Text style={{ fontSize: 24, fontWeight: "700", color: "#38A169", marginTop: 4, marginBottom: 8 }}>4.2x</Text>
            <Text style={S.cardSub}>Para cada R$ 1,00 investido este mês, retornaram R$ 4,20 no Pipeline.</Text>
          </View>
          <View style={{ height: 40 }} />
        </ScrollView>
      )}

      {/* Criativos */}
      {tab === "Criativos Redes" && (
        <ScrollView style={S.form} showsVerticalScrollIndicator={false}>
          <Text style={[S.sectionLabel, { marginBottom: 16 }]}>CRIATIVOS RECENTES DA IA</Text>
          <View style={S.card}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 14 }}>
              <Text style={{ fontSize: 11, color: "#00E5FF", fontWeight: "700", letterSpacing: 0.5 }}>📸 INSTAGRAM REELS / ADS</Text>
              <TouchableOpacity onPress={shareCreative} activeOpacity={0.6}>
                <Text style={{ color: "#8F94A8", fontSize: 12, fontWeight: "500" }}>Compartilhar 🚀</Text>
              </TouchableOpacity>
            </View>
            <Text style={{ fontSize: 16, fontWeight: "700", color: "#FFFFFF", marginBottom: 8 }}>{CREATIVE_HEADLINE}</Text>
            <Text style={[S.cardSub, { lineHeight: 20, marginBottom: 16 }]}>{CREATIVE_BODY}</Text>
            <View style={{ backgroundColor: "#090A0F", height: 48, borderRadius: 10, justifyContent: "center", paddingHorizontal: 14, borderWidth: 1, borderColor: "#242736" }}>
              <Text style={{ color: "#4E5366", fontSize: 12, fontWeight: "500" }}>🎬 Prompt de vídeo gerado para o CapCut/Canva</Text>
            </View>
          </View>
          <View style={{ height: 40 }} />
        </ScrollView>
      )}

      {/* Budget modal — full screen */}
      <Modal visible={budgetOpen} animationType="slide" onRequestClose={() => setBudgetOpen(false)}>
        <View style={[S.root, { paddingTop: insets.top }]}>
          <View style={S.mktModalHeader}>
            <TouchableOpacity onPress={() => setBudgetOpen(false)} style={{ paddingRight: 16 }} activeOpacity={0.7}>
              <Text style={{ color: "#8F94A8", fontSize: 15, fontWeight: "600" }}>← Voltar</Text>
            </TouchableOpacity>
            <Text style={{ color: "#FFFFFF", fontSize: 16, fontWeight: "700" }}>Distribuição Inteligente</Text>
          </View>

          <ScrollView style={S.form} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <Text style={{ fontSize: 22, fontWeight: "700", color: "#FFFFFF", marginBottom: 24, letterSpacing: -0.5 }}>Calculadora de Mídia IA</Text>

            <Text style={S.label}>QUANTO DESEJA INVESTIR? (R$ TOTAL)</Text>
            <TextInput style={S.input} placeholder="Ex: 1500" placeholderTextColor="#4E5366" keyboardType="numeric" value={investment} onChangeText={setInvestment} />

            <Text style={S.label}>NÚMERO DE DIAS DA CAMPANHA</Text>
            <TextInput style={S.input} placeholder="Ex: 10" placeholderTextColor="#4E5366" keyboardType="numeric" value={days} onChangeText={setDays} />

            <TouchableOpacity style={[S.primaryBtn, (!investment || !days) && S.primaryBtnDisabled]} activeOpacity={0.8} onPress={generate} disabled={calculating || !investment || !days}>
              {calculating ? <ActivityIndicator color="#090A0F" /> : <Text style={S.primaryBtnText}>Otimizar Canais e Horários ✨</Text>}
            </TouchableOpacity>

            {strategy && (
              <View style={S.strategyBox}>
                <Text style={{ fontSize: 15, fontWeight: "700", color: "#FFFFFF", marginBottom: 16 }}>🎯 Planejamento Recomendado</Text>
                <Text style={S.label2}>ONDE POSTAR & QUANTO INVESTIR:</Text>
                <Text style={S.mktOutputText}>• {strategy.meta}</Text>
                <Text style={S.mktOutputText}>• {strategy.google}</Text>
                <View style={{ height: 1, backgroundColor: "#242736", marginVertical: 12 }} />
                <Text style={S.label2}>DIAS E HORÁRIOS CRÍTICOS (MAIOR CONVERSÃO):</Text>
                <Text style={S.mktOutputText}>🕒 {strategy.bestTimes}</Text>
                <View style={{ height: 1, backgroundColor: "#242736", marginVertical: 12 }} />
                <Text style={S.label2}>PREVISÃO DISPARADA PELO HISTÓRICO:</Text>
                <Text style={[S.mktOutputText, { color: "#00E5FF", fontWeight: "700" }]}>📈 {strategy.expectedLeads}</Text>
              </View>
            )}
            <View style={{ height: 60 }} />
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

// ─── Data: Management ────────────────────────────────────────────────────────
type Executive = { id: string; name: string; role: string; sold: number; target: number };

const INITIAL_TEAM: Executive[] = [
  { id: "1", name: "Lucas Santana",  role: "Enterprise Sales", sold: 45000, target: 60000 },
  { id: "2", name: "Mariana Rios",   role: "Inside Sales",     sold: 62000, target: 50000 },
  { id: "3", name: "Thiago Martins", role: "SDR / Hunter",     sold: 18000, target: 40000 },
];

// ─── Screen: Management ───────────────────────────────────────────────────────
function ManagementView({ onMenu }: { onMenu: () => void }) {
  const insets = useSafeAreaInsets();
  const [team,       setTeam]       = useState<Executive[]>(INITIAL_TEAM);
  const [modalOpen,  setModalOpen]  = useState(false);
  const [newName,    setNewName]    = useState("");
  const [newRole,    setNewRole]    = useState("");
  const [newTarget,  setNewTarget]  = useState("");

  const totalSold   = team.reduce((a, m) => a + m.sold,   0);
  const totalTarget = team.reduce((a, m) => a + m.target, 0);

  const handleCreate = () => {
    if (!newName || !newRole || !newTarget) return;
    setTeam((prev) => [
      ...prev,
      { id: String(Date.now()), name: newName, role: newRole, sold: 0, target: parseFloat(newTarget) || 0 },
    ]);
    setNewName(""); setNewRole(""); setNewTarget(""); setModalOpen(false);
  };

  const brl = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  return (
    <View style={{ flex: 1 }}>
      {/* Top bar manual — sem TopBar genérico para ter botão "+ Novo" */}
      <View style={[S.topBar, { paddingTop: (Platform.OS === "web" ? 24 : insets.top + 4) + 6 }]}>
        <TouchableOpacity style={S.iconBtn} onPress={onMenu} activeOpacity={0.7}>
          <Text style={S.topIconText}>☰</Text>
        </TouchableOpacity>
        <View style={{ flex: 1, marginHorizontal: 12 }}>
          <Text style={S.topSubtitle}>PAINEL DO DIRETOR</Text>
          <Text style={S.topTitle}>Gestão de Time</Text>
        </View>
        <TouchableOpacity style={S.mgmtAddBtn} onPress={() => setModalOpen(true)} activeOpacity={0.8}>
          <Text style={S.mgmtAddBtnText}>＋ Novo</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={S.form} showsVerticalScrollIndicator={false}>
        {/* Metrics grid */}
        <Text style={S.sectionLabel}>MÉTRICAS CONSOLIDADAS DO TIME</Text>
        <View style={S.mgmtGrid}>
          <View style={S.mgmtGridRow}>
            <View style={S.mgmtGridCard}>
              <Text style={S.mgmtGridLabel}>COLABORADORES</Text>
              <Text style={S.mgmtGridValue}>{team.length}</Text>
            </View>
            <View style={S.mgmtGridCard}>
              <Text style={S.mgmtGridLabel}>LEADS ATIVOS</Text>
              <Text style={S.mgmtGridValue}>248</Text>
            </View>
          </View>
          <View style={S.mgmtGridRow}>
            <View style={S.mgmtGridCard}>
              <Text style={S.mgmtGridLabel}>META DO MÊS (TOTAL)</Text>
              <Text style={[S.mgmtGridValue, { fontSize: 18, color: "#FFFFFF" }]}>{brl(totalTarget)}</Text>
            </View>
            <View style={S.mgmtGridCard}>
              <Text style={S.mgmtGridLabel}>TOTAL VENDIDO</Text>
              <Text style={[S.mgmtGridValue, { fontSize: 18, color: "#38A169" }]}>{brl(totalSold)}</Text>
            </View>
          </View>
        </View>

        {/* Individual cards */}
        <Text style={S.sectionLabel}>PERFIL E PERFORMANCE INDIVIDUAL</Text>
        {team.map((member) => {
          const pct       = Math.min((member.sold / member.target) * 100, 100);
          const onTarget  = member.sold >= member.target;
          return (
            <View key={member.id} style={[S.card, { marginBottom: 14 }]}>
              <View style={S.mgmtExecRow}>
                <View style={S.mgmtAvatar}>
                  <Text style={{ fontSize: 20 }}>👤</Text>
                </View>
                <View style={{ flex: 1, marginLeft: 14 }}>
                  <Text style={S.cardName}>{member.name}</Text>
                  <Text style={S.cardSub2}>{member.role}</Text>
                </View>
                <View style={{ alignItems: "flex-end" }}>
                  <Text style={S.mgmtGridLabel}>VENDIDO</Text>
                  <Text style={[S.cardName, { color: onTarget ? "#38A169" : "#FFFFFF", marginTop: 2 }]}>{brl(member.sold)}</Text>
                </View>
              </View>
              <View style={{ marginTop: 16 }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 6 }}>
                  <Text style={[S.cardSub, { marginBottom: 0 }]}>Meta: {brl(member.target)}</Text>
                  <Text style={{ fontSize: 12, color: "#FFFFFF", fontWeight: "600" }}>{pct.toFixed(0)}%</Text>
                </View>
                <View style={S.progressTrack}>
                  <View style={[S.progressBar, { width: `${pct}%` as any, backgroundColor: onTarget ? "#38A169" : "#00E5FF" }]} />
                </View>
              </View>
            </View>
          );
        })}
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Modal: novo executivo */}
      <Modal visible={modalOpen} animationType="slide" onRequestClose={() => setModalOpen(false)}>
        <View style={[S.root, { paddingTop: insets.top }]}>
          <View style={S.mktModalHeader}>
            <TouchableOpacity onPress={() => setModalOpen(false)} style={{ paddingRight: 16 }} activeOpacity={0.7}>
              <Text style={{ color: "#8F94A8", fontSize: 15, fontWeight: "600" }}>← Cancelar</Text>
            </TouchableOpacity>
            <Text style={{ color: "#FFFFFF", fontSize: 16, fontWeight: "700" }}>Novo Integrante</Text>
          </View>
          <ScrollView style={S.form} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <Text style={{ fontSize: 22, fontWeight: "700", color: "#FFFFFF", marginBottom: 24, letterSpacing: -0.5 }}>Cadastrar Executivo</Text>

            <Text style={S.label}>NOME COMPLETO</Text>
            <TextInput style={S.input} placeholder="Ex: João da Silva" placeholderTextColor="#4E5366" value={newName} onChangeText={setNewName} />

            <Text style={S.label}>CARGO / POSIÇÃO</Text>
            <TextInput style={S.input} placeholder="Ex: Inside Sales, SDR, Closer" placeholderTextColor="#4E5366" value={newRole} onChangeText={setNewRole} />

            <Text style={S.label}>META INDIVIDUAL MENSAL (R$)</Text>
            <TextInput style={S.input} placeholder="Ex: 50000" placeholderTextColor="#4E5366" keyboardType="numeric" value={newTarget} onChangeText={setNewTarget} />

            <TouchableOpacity
              style={[S.primaryBtn, (!newName || !newRole || !newTarget) && S.primaryBtnDisabled]}
              activeOpacity={0.8}
              onPress={handleCreate}
              disabled={!newName || !newRole || !newTarget}
            >
              <Text style={S.primaryBtnText}>Confirmar Contratação 🚀</Text>
            </TouchableOpacity>
            <View style={{ height: 40 }} />
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

// ─── Data: KPIs ──────────────────────────────────────────────────────────────
type ExecPerf = { id: string; name: string; conversion: string; meetings: string; avgClose: string; gap: string; plan: string };
const TEAM_PERFORMANCE: ExecPerf[] = [
  { id: "1", name: "Lucas Santana",  conversion: "18%", meetings: "14 / 20", avgClose: "12 dias", gap: "Gargalo na transição de Proposta para Fechados.", plan: "Aplicar gatilho de escassez e follow-up em até 24h após envio do orçamento." },
  { id: "2", name: "Mariana Rios",   conversion: "26%", meetings: "22 / 22", avgClose: "8 dias",  gap: "Nenhum gap ativo. Performance acima da média.",  plan: "Iniciar estratégia de Up-sell com os clientes ativos de maior faturamento." },
  { id: "3", name: "Thiago Martins", conversion: "11%", meetings: "8 / 15",  avgClose: "19 dias", gap: "Baixa conversão no primeiro contato via WhatsApp.", plan: "Revisar os scripts iniciais gerados pela JADE na aba de prospecção." },
];
const CHART_HISTORY = [
  { month: "Junho", pct: "85%", w: "85%", color: "#00E5FF" },
  { month: "Maio",  pct: "92%", w: "92%", color: "#38A169" },
  { month: "Abril", pct: "64%", w: "64%", color: "#E93E3E" },
];

// ─── Screen: KPIs ─────────────────────────────────────────────────────────────
function KpisView({ onMenu }: { onMenu: () => void }) {
  const [selectedExec, setSelectedExec] = useState<ExecPerf | null>(null);
  const [loadingAi,    setLoadingAi]    = useState(false);

  const handleSelect = (exec: ExecPerf) => {
    setSelectedExec(null);
    setLoadingAi(true);
    setTimeout(() => { setSelectedExec(exec); setLoadingAi(false); }, 1400);
  };

  return (
    <View style={{ flex: 1 }}>
      <TopBar title="Metas & KPIs" subtitle="PAINEL DO DIRETOR" onMenu={onMenu} />
      <ScrollView style={S.form} showsVerticalScrollIndicator={false}>
        {/* Histórico global */}
        <Text style={S.sectionLabel}>HISTÓRICO DE PRODUÇÃO GLOBAL</Text>
        <View style={S.card}>
          {CHART_HISTORY.map((row) => (
            <View key={row.month} style={S.kpiChartRow}>
              <Text style={S.kpiChartMonth}>{row.month}</Text>
              <View style={{ flex: 1, height: 8, backgroundColor: "#090A0F", borderRadius: 4, overflow: "hidden", marginRight: 10 }}>
                <View style={{ width: row.w as any, height: "100%", backgroundColor: row.color, borderRadius: 4 }} />
              </View>
              <Text style={S.kpiChartValue}>{row.pct}</Text>
            </View>
          ))}
        </View>

        {/* Drill-down executivos */}
        <Text style={S.sectionLabel}>SELECIONE UM EXECUTIVO PARA AUDITORIA</Text>
        <View style={[S.card, { paddingHorizontal: 0, paddingVertical: 0, overflow: "hidden" }]}>
          {TEAM_PERFORMANCE.map((exec, idx) => (
            <TouchableOpacity
              key={exec.id}
              style={[S.kpiExecItem, idx < TEAM_PERFORMANCE.length - 1 && { borderBottomWidth: 1, borderColor: "#242736" }]}
              onPress={() => handleSelect(exec)}
              activeOpacity={0.7}
            >
              <Text style={S.cardName}>{exec.name}</Text>
              <Text style={{ color: "#4E5366", fontSize: 16 }}>➔</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Laudo IA */}
        {(loadingAi || selectedExec) && (
          <View style={S.kpiAiBox}>
            <Text style={S.kpiAiTitle}>🤖 Laudo de Performance JADE</Text>
            {loadingAi ? (
              <ActivityIndicator color="#00E5FF" style={{ marginTop: 16 }} />
            ) : selectedExec ? (
              <>
                <View style={S.kpiMiniRow}>
                  {[
                    { label: "CONVERSÃO",   value: selectedExec.conversion },
                    { label: "REUNIÕES",    value: selectedExec.meetings   },
                    { label: "CICLO MÉDIO", value: selectedExec.avgClose   },
                  ].map((m) => (
                    <View key={m.label} style={S.kpiMiniCard}>
                      <Text style={S.mgmtGridLabel}>{m.label}</Text>
                      <Text style={[S.cardName, { marginTop: 4 }]}>{m.value}</Text>
                    </View>
                  ))}
                </View>
                <Text style={S.mgmtGridLabel}>DIAGNÓSTICO DO GAP:</Text>
                <Text style={[S.cardSub, { marginTop: 4, marginBottom: 12 }]}>{selectedExec.gap}</Text>
                <Text style={S.mgmtGridLabel}>PLANO DE AÇÃO SUGERIDO:</Text>
                <Text style={[S.cardName, { fontSize: 13, marginTop: 4, lineHeight: 20 }]}>💡 {selectedExec.plan}</Text>
              </>
            ) : null}
          </View>
        )}
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

// ─── Data: Corporate Portfolio ────────────────────────────────────────────────
type CorpAccount = { id: string; account: string; owner: string; mrr: string; health: string };
const CORPORATE_ACCOUNTS: CorpAccount[] = [
  { id: "1", account: "Alpha Construtora",   owner: "Mariana Rios",   mrr: "R$ 5.800", health: "Saudável"        },
  { id: "2", account: "Diretriz Comercial",  owner: "Lucas Santana",  mrr: "R$ 4.500", health: "Saudável"        },
  { id: "3", account: "Glow Estética",       owner: "Thiago Martins", mrr: "R$ 1.200", health: "Risco de Churn"  },
  { id: "4", account: "Ponto do Café",       owner: "Thiago Martins", mrr: "R$ 900",   health: "Esfriando"       },
];

// ─── Screen: Corporate Portfolio ─────────────────────────────────────────────
function CorporatePortfolioView({ onMenu }: { onMenu: () => void }) {
  return (
    <View style={{ flex: 1 }}>
      <TopBar title="Carteira Corporativa" subtitle="VISÃO MACRO" onMenu={onMenu} />
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Macro grid */}
        <View style={S.corpMacroRow}>
          {[
            { label: "CHURN RATE", value: "1.8%", color: "#38A169" },
            { label: "MRR TOTAL",  value: "R$ 12.4k", color: "#00E5FF" },
            { label: "EM RISCO",   value: "2",   color: "#E93E3E" },
          ].map((m) => (
            <View key={m.label} style={S.corpMacroCard}>
              <Text style={S.mgmtGridLabel}>{m.label}</Text>
              <Text style={[S.mgmtGridValue, { color: m.color, fontSize: 20 }]}>{m.value}</Text>
            </View>
          ))}
        </View>

        <Text style={[S.sectionLabel, { paddingHorizontal: 20 }]}>AUDITORIA GLOBAL DE CONTAS</Text>

        <FlatList
          data={CORPORATE_ACCOUNTS}
          keyExtractor={(i) => i.id}
          scrollEnabled={false}
          contentContainerStyle={{ paddingHorizontal: 20 }}
          renderItem={({ item }) => {
            const danger = item.health !== "Saudável";
            const healthColor = item.health === "Saudável" ? "#38A169" : item.health === "Esfriando" ? "#00E5FF" : "#E93E3E";
            return (
              <View style={[S.card, { marginBottom: 12 }]}>
                <View style={S.cardHead}>
                  <View style={{ flex: 1 }}>
                    <Text style={S.cardName}>{item.account}</Text>
                    <Text style={S.cardSub2}>Responsável: {item.owner}</Text>
                  </View>
                  <Text style={[S.cardName, { color: "#FFFFFF" }]}>{item.mrr}</Text>
                </View>
                <View style={[S.badge, { alignSelf: "flex-start", marginTop: 12, backgroundColor: healthColor + "15", borderColor: healthColor + "40" }]}>
                  <Text style={[S.badgeText, { color: healthColor }]}>{item.health}</Text>
                </View>
              </View>
            );
          }}
        />
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

// ─── Screen: Broadcast ───────────────────────────────────────────────────────
function BroadcastView({ onMenu }: { onMenu: () => void }) {
  const [title,     setTitle]     = useState("");
  const [message,   setMessage]   = useState("");
  const [polishing, setPolishing] = useState(false);

  const handleAiPolish = () => {
    if (!message) return;
    setPolishing(true);
    setTimeout(() => {
      setPolishing(false);
      setTitle("🚨 META DO DIA: Foco Estratégico Ativado");
      setMessage("Atenção equipe! Nossa IA detectou um pico de leads altamente qualificados no funil de Proposta nas últimas horas. Cancelem gargalos operacionais e priorizem o fechamento agora. Vamos garantir a entrega do mês!");
    }, 1500);
  };

  const handleSend = () => {
    if (!title || !message) return;
    Alert.alert("Enviado! 🚀", "Push Notification disparada para todos os executivos ativos!");
    setTitle(""); setMessage("");
  };

  return (
    <View style={{ flex: 1 }}>
      <TopBar title="Mural da Equipe" subtitle="CENTRAL DE AVISOS" onMenu={onMenu} />
      <ScrollView style={S.form} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <Text style={[S.cardSub, { marginBottom: 24, marginTop: -4 }]}>Envie avisos em massa com push direto na tela do time</Text>

        <Text style={S.label}>TÍTULO DO ALERTA</Text>
        <TextInput
          style={S.input}
          placeholder="Ex: Urgente: Reunião Geral"
          placeholderTextColor="#4E5366"
          value={title}
          onChangeText={setTitle}
        />

        <Text style={S.label}>CORPO DA MENSAGEM</Text>
        <TextInput
          style={[S.input, { height: 120, paddingTop: 14, textAlignVertical: "top" }]}
          placeholder="Digite o aviso para o time de vendas..."
          placeholderTextColor="#4E5366"
          multiline
          value={message}
          onChangeText={setMessage}
        />

        {/* Botão JADE polish */}
        <TouchableOpacity
          style={[S.broadcastAiBtn, !message && { opacity: 0.4 }]}
          onPress={handleAiPolish}
          disabled={polishing || !message}
          activeOpacity={0.7}
        >
          {polishing
            ? <ActivityIndicator color="#00E5FF" />
            : <Text style={S.broadcastAiBtnText}>✨ Otimizar Texto com Gatilhos JADE</Text>
          }
        </TouchableOpacity>

        {/* Disparo */}
        <TouchableOpacity
          style={[S.primaryBtn, (!title || !message) && S.primaryBtnDisabled, { marginTop: 8 }]}
          onPress={handleSend}
          disabled={!title || !message}
          activeOpacity={0.8}
        >
          <Text style={S.primaryBtnText}>Disparar Push Notification 🚀</Text>
        </TouchableOpacity>
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

// ─── Data: Feedbacks ─────────────────────────────────────────────────────────
type TeamMember = { id: string; name: string; lastFeedback: string; score: string };
const FEEDBACK_TEAM: TeamMember[] = [
  { id: "1", name: "Lucas Santana",  lastFeedback: "12/05/2026 - Evolução em Propostas",  score: "8.5" },
  { id: "2", name: "Mariana Rios",   lastFeedback: "02/06/2026 - Meta Superada",           score: "9.8" },
  { id: "3", name: "Thiago Martins", lastFeedback: "24/05/2026 - Alinhamento de Scripts",  score: "7.0" },
];

// ─── Screen: Feedbacks 1-on-1 ────────────────────────────────────────────────
function FeedbacksView({ onMenu }: { onMenu: () => void }) {
  const [selectedId,       setSelectedId]       = useState<string | null>(null);
  const [loadingAi,        setLoadingAi]        = useState(false);
  const [aiFeedbackText,   setAiFeedbackText]   = useState("");

  const generate = (member: TeamMember) => {
    setSelectedId(member.id);
    setLoadingAi(true);
    setAiFeedbackText("");
    setTimeout(() => {
      setLoadingAi(false);
      setAiFeedbackText(
        `Feedback Estruturado para ${member.name}:\n\n` +
        `• Ponto Forte: Excelente comprometimento com a rotina e dedicação na execução dos processos.\n` +
        `• Ponto de Melhoria: Identificamos um leve gargalo na transição de leads da etapa de proposta para o fechamento.\n\n` +
        `💡 Sugestão de Abordagem:\n"Tenho visto seu esforço nas propostas, e seus números estão ótimos. Vamos sentar juntos nesta semana para analisar duas contas específicas e destravar o fechamento? Quero te ajudar a bater o topo da meta!"`
      );
    }, 1500);
  };

  return (
    <View style={{ flex: 1 }}>
      <TopBar title="Feedbacks 1-on-1" subtitle="PAINEL DO DIRETOR" onMenu={onMenu} />
      <ScrollView style={S.form} showsVerticalScrollIndicator={false}>
        <Text style={S.sectionLabel}>SELECIONE UM EXECUTIVO PARA ANÁLISE</Text>

        <View style={[S.card, { paddingHorizontal: 0, paddingVertical: 0, overflow: "hidden", marginBottom: 24 }]}>
          {FEEDBACK_TEAM.map((m, idx) => (
            <TouchableOpacity
              key={m.id}
              style={[
                S.kpiExecItem,
                idx < FEEDBACK_TEAM.length - 1 && { borderBottomWidth: 1, borderColor: "#242736" },
                selectedId === m.id && { opacity: 0.7 },
              ]}
              onPress={() => generate(m)}
              activeOpacity={0.7}
            >
              <View>
                <Text style={S.cardName}>{m.name}</Text>
                <Text style={[S.cardSub, { marginBottom: 0, marginTop: 4 }]}>Último: {m.lastFeedback}</Text>
              </View>
              <View style={S.fbScoreBadge}>
                <Text style={S.fbScoreText}>{m.score}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {selectedId && (
          <View style={S.kpiAiBox}>
            <Text style={S.kpiAiTitle}>🤖 Roteiro de Alinhamento 1-on-1 (JADE)</Text>
            {loadingAi ? (
              <ActivityIndicator color="#00E5FF" style={{ marginTop: 20 }} />
            ) : aiFeedbackText ? (
              <>
                <Text style={[S.cardSub, { marginBottom: 20, lineHeight: 22 }]}>{aiFeedbackText}</Text>
                <TouchableOpacity
                  style={S.primaryBtn}
                  onPress={() => Alert.alert("Copiado!", "Roteiro copiado para área de transferência.")}
                  activeOpacity={0.8}
                >
                  <Text style={S.primaryBtnText}>Copiar Roteiro para Reunião 📋</Text>
                </TouchableOpacity>
              </>
            ) : null}
          </View>
        )}
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

// ─── Screen: Team Pulse ───────────────────────────────────────────────────────
function TeamPulseView({ onMenu }: { onMenu: () => void }) {
  const [autoActive, setAutoActive] = useState(false);

  const PULSE_CARDS = [
    { emoji: "🟢", count: "4 Executivos", label: "Super Bem",        border: "#38A169" },
    { emoji: "🟡", count: "2 Executivos", label: "Com Dificuldade",  border: "#00E5FF" },
    { emoji: "🔴", count: "0 Executivos", label: "Sobrecarga",       border: "#E93E3E" },
  ];

  return (
    <View style={{ flex: 1 }}>
      <TopBar title="Clima Comercial" subtitle="SAÚDE DA EQUIPE" onMenu={onMenu} />
      <ScrollView style={S.form} showsVerticalScrollIndicator={false}>
        <Text style={[S.cardSub, { marginBottom: 24, marginTop: -4 }]}>Acompanhe o sentimento interno e evite sobrecarga da equipe</Text>

        <Text style={S.sectionLabel}>TERMÔMETRO CONSOLIDADO (HOJE)</Text>
        <View style={S.pulseGrid}>
          {PULSE_CARDS.map((c) => (
            <View key={c.label} style={[S.pulseCard, { borderColor: c.border }]}>
              <Text style={{ fontSize: 22, marginBottom: 6 }}>{c.emoji}</Text>
              <Text style={S.pulseCount}>{c.count}</Text>
              <Text style={S.pulseLabel}>{c.label}</Text>
            </View>
          ))}
        </View>

        <Text style={S.sectionLabel}>AUTOMAÇÃO DE CLIMA ORGANIZACIONAL</Text>
        <View style={S.configRow}>
          <View style={{ flex: 1, marginRight: 16 }}>
            <Text style={S.cardName}>Rotina de Disparo Autônomo</Text>
            <Text style={[S.cardSub, { marginBottom: 0, marginTop: 4 }]}>Deixe a JADE pesquisar o sentimento do time toda sexta-feira às 17h</Text>
          </View>
          <Switch
            value={autoActive}
            onValueChange={setAutoActive}
            trackColor={{ false: "#161822", true: "#00E5FF" }}
            thumbColor={autoActive ? "#FFFFFF" : "#8F94A8"}
          />
        </View>

        <TouchableOpacity
          style={[S.primaryBtn, { marginTop: 8 }]}
          onPress={() => Alert.alert("Push Disparado", "O questionário de clima comercial foi enviado para o smartphone de toda a equipe de vendas.")}
          activeOpacity={0.8}
        >
          <Text style={S.primaryBtnText}>Disparar Push de Sentimento Agora 🧠</Text>
        </TouchableOpacity>
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

// ─── Data: Pulse Check ────────────────────────────────────────────────────────
const SENTIMENT_OPTIONS = [
  { id: "well",    text: "Estou super bem e performando",              marker: "🟢" },
  { id: "stuck",   text: "Estou com dificuldades operacionais",        marker: "🟡" },
  { id: "burnout", text: "Me sinto sobrecarregado / Preciso de suporte", marker: "🔴" },
  { id: "skip",    text: "Prefiro não responder hoje / Pular",          marker: "⚪" },
] as const;

// ─── Screen: Pulse Check ─────────────────────────────────────────────────────
function PulseCheckView({ onMenu }: { onMenu: () => void }) {
  const insets = useSafeAreaInsets();
  const [selected, setSelected] = useState<string | null>(null);

  const submit = () => {
    if (!selected) return;
    Alert.alert("Obrigado!", "Seu sentimento foi enviado de forma anônima e segura ao painel do gestor.");
    setSelected(null);
  };

  return (
    <View style={{ flex: 1 }}>
      {/* minimal top bar just for menu access */}
      <View style={[S.topBar, { paddingTop: Platform.OS === "web" ? 24 : insets.top + 4 }]}>
        <TouchableOpacity style={S.iconBtn} onPress={onMenu} activeOpacity={0.6}>
          <Text style={S.topIconText}>☰</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }} />
      </View>

      <ScrollView contentContainerStyle={S.pulseCheckWrapper} showsVerticalScrollIndicator={false}>
        <Text style={S.pulseCheckBrand}>✨ JADE INSIGHTS</Text>
        <Text style={S.pulseCheckTitle}>Como você se sente com a rotina comercial hoje?</Text>
        <Text style={[S.cardSub, { textAlign: "center", marginBottom: 32, paddingHorizontal: 12 }]}>
          Sua resposta ajuda a gestão a calibrar o volume de leads e metas da semana para evitar sobrecarga.
        </Text>

        {SENTIMENT_OPTIONS.map((opt) => {
          const active = selected === opt.id;
          return (
            <TouchableOpacity
              key={opt.id}
              style={[S.pulseOption, active && S.pulseOptionActive]}
              onPress={() => setSelected(opt.id)}
              activeOpacity={0.7}
            >
              <Text style={{ fontSize: 18, marginRight: 14 }}>{opt.marker}</Text>
              <Text style={[S.pulseOptionText, active && S.pulseOptionTextActive]}>{opt.text}</Text>
            </TouchableOpacity>
          );
        })}

        <TouchableOpacity
          style={[S.primaryBtn, !selected && S.primaryBtnDisabled, { marginTop: 20 }]}
          onPress={submit}
          disabled={!selected}
          activeOpacity={0.8}
        >
          <Text style={S.primaryBtnText}>Enviar Resposta Oficial 🚀</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

// ─── Data: Account Settings ──────────────────────────────────────────────────
type Product = { id: number; name: string; value: string };
const ACCT_TABS = ["Meu Perfil", "Cérebro da IA (Empresa)"];

// ─── Screen: Account Settings ────────────────────────────────────────────────
function AccountSettingsView({ onMenu }: { onMenu: () => void }) {
  const [activeTab,       setActiveTab]       = useState(ACCT_TABS[0]);
  const [isSaving,        setIsSaving]        = useState(false);
  const [userName,        setUserName]        = useState("Alexandre Silveira");
  const [userEmail,       setUserEmail]       = useState("alexandre@sleekia.com.br");
  const [companyName,     setCompanyName]     = useState("Sleek Automações");
  const [segment,         setSegment]         = useState("Tecnologia B2B");
  const [activeCampaign,  setActiveCampaign]  = useState("Desconto de 15% para fechamentos até sexta-feira.");
  const [city,            setCity]            = useState("Criciúma");
  const [neighborhood,    setNeighborhood]    = useState("Centro");
  const [uf,              setUf]              = useState("SC");
  const [products,        setProducts]        = useState<Product[]>([
    { id: 1, name: "Licença Software CRM", value: "299" },
    { id: 2, name: "Setup + Treinamento",  value: "1500" },
  ]);
  const [newProdName,  setNewProdName]  = useState("");
  const [newProdValue, setNewProdValue] = useState("");

  const addProduct = () => {
    if (!newProdName || !newProdValue) return;
    setProducts((p) => [...p, { id: p.length + 1, name: newProdName, value: newProdValue }]);
    setNewProdName(""); setNewProdValue("");
  };

  const save = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      Alert.alert("Cérebro Atualizado 🧠", "A JADE assimilou as novas informações e já mudou o comportamento de abordagem no WhatsApp.");
    }, 1500);
  };

  return (
    <View style={{ flex: 1 }}>
      <TopBar title="Configurações" onMenu={onMenu} />

      {/* Abas */}
      <View style={S.tabsWrapper}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={S.tabsScroll}>
          {ACCT_TABS.map((tab) => {
            const active = activeTab === tab;
            return (
              <TouchableOpacity key={tab} style={S.tabBtn} onPress={() => setActiveTab(tab)} activeOpacity={0.8}>
                <Text style={[S.tabText, active && S.tabTextActive]}>{tab}</Text>
                {active && <View style={S.tabLine} />}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView style={S.form} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {activeTab === "Meu Perfil" && (
          <View>
            <Text style={S.label}>NOME DO EXECUTIVO</Text>
            <TextInput style={S.input} value={userName} onChangeText={setUserName} placeholderTextColor="#4E5366" />
            <Text style={S.label}>E-MAIL DE ACESSO</Text>
            <TextInput style={S.input} value={userEmail} onChangeText={setUserEmail} keyboardType="email-address" placeholderTextColor="#4E5366" />
            <TouchableOpacity style={S.acctSecBtn} onPress={save} activeOpacity={0.8}>
              <Text style={S.acctSecBtnText}>Salvar Perfil</Text>
            </TouchableOpacity>
          </View>
        )}

        {activeTab === "Cérebro da IA (Empresa)" && (
          <View>
            <View style={[S.insightBox, { marginBottom: 20 }]}>
              <Text style={[S.insightText, { color: "#00E5FF", marginBottom: 0 }]}>🧠 Estes dados moldam o conhecimento da JADE durante as conversas automatizadas com os clientes.</Text>
            </View>

            <Text style={S.label}>NOME DA EMPRESA</Text>
            <TextInput style={S.input} value={companyName} onChangeText={setCompanyName} placeholderTextColor="#4E5366" />

            <Text style={S.label}>SEGMENTO DE ATUAÇÃO</Text>
            <TextInput style={S.input} value={segment} onChangeText={setSegment} placeholderTextColor="#4E5366" />

            <Text style={S.label}>PRODUTOS E VALORES DO PORTFÓLIO</Text>
            <View style={S.acctProductList}>
              {products.map((p) => (
                <View key={p.id} style={S.acctProductRow}>
                  <Text style={S.cardName}>• {p.name}</Text>
                  <Text style={S.cardSub2}>R$ {p.value}</Text>
                </View>
              ))}
            </View>
            <View style={S.acctAddRow}>
              <TextInput
                style={[S.input, { flex: 2, marginBottom: 0, marginRight: 8 }]}
                placeholder="Nome do Produto" placeholderTextColor="#4E5366"
                value={newProdName} onChangeText={setNewProdName}
              />
              <TextInput
                style={[S.input, { flex: 1, marginBottom: 0, marginRight: 8 }]}
                placeholder="R$ Valor" placeholderTextColor="#4E5366"
                keyboardType="numeric" value={newProdValue} onChangeText={setNewProdValue}
              />
              <TouchableOpacity style={S.acctMiniBtn} onPress={addProduct} activeOpacity={0.7}>
                <Text style={S.acctMiniBtnText}>＋</Text>
              </TouchableOpacity>
            </View>

            <Text style={S.label}>CAMPANHA / GATILHO ATIVO ATUAL</Text>
            <TextInput
              style={[S.input, { height: 70, paddingTop: 12, textAlignVertical: "top" }]}
              value={activeCampaign} onChangeText={setActiveCampaign} multiline
              placeholderTextColor="#4E5366"
            />

            <Text style={S.label}>LOCALIZAÇÃO DA SEDE</Text>
            <View style={{ flexDirection: "row" }}>
              <TextInput style={[S.input, { flex: 2, marginRight: 8 }]} value={city}         onChangeText={setCity}         placeholder="Cidade" placeholderTextColor="#4E5366" />
              <TextInput style={[S.input, { flex: 2, marginRight: 8 }]} value={neighborhood} onChangeText={setNeighborhood} placeholder="Bairro" placeholderTextColor="#4E5366" />
              <TextInput style={[S.input, { flex: 1 }]}                 value={uf}           onChangeText={setUf}           placeholder="UF"     placeholderTextColor="#4E5366" maxLength={2} />
            </View>

            <TouchableOpacity style={[S.primaryBtn, { marginTop: 8 }]} onPress={save} disabled={isSaving} activeOpacity={0.8}>
              {isSaving ? <ActivityIndicator color="#090A0F" /> : <Text style={S.primaryBtnText}>Sincronizar Cérebro da IA 🚀</Text>}
            </TouchableOpacity>
          </View>
        )}
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

// ─── Data: Subscription ───────────────────────────────────────────────────────
type Tier = { id: string; name: string; price: string; features: string[] };
const TIERS: Tier[] = [
  { id: "start",      name: "Sleek Start", price: "R$ 199/mês",  features: ["Até 100 leads ativos/mês", "Disparos automáticos básicos", "Suporte via e-mail", "1 Robô ativo no Maps"] },
  { id: "pro",        name: "Sleek Pro",   price: "R$ 499/mês",  features: ["Leads ativos ILIMITADOS", "Cérebro avançado da JADE", "Integração WhatsApp nativa", "Laudos de performance em tempo real", "Suporte prioritário 24/7"] },
  { id: "enterprise", name: "Enterprise",  price: "Sob Consulta", features: ["Múltiplos agentes autônomos", "Customização avançada de LLM", "Painel de auditoria multi-vendedores", "API dedicada de disparo de Push", "Gerente de conta exclusivo"] },
];

// ─── Screen: Subscription ────────────────────────────────────────────────────
function SubscriptionView({ onMenu }: { onMenu: () => void }) {
  const [currentPlan, setCurrentPlan] = useState("start");

  const handleUpgrade = (tier: Tier) => {
    if (tier.id === currentPlan) {
      Alert.alert("Plano Ativo", "Sua empresa já está utilizando este plano atualmente.");
      return;
    }
    Alert.alert(
      "Confirmar Upgrade 💳",
      `Deseja migrar a assinatura para o plano ${tier.name}?`,
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Confirmar", onPress: () => {
          setCurrentPlan(tier.id);
          Alert.alert("Sucesso 🎉", `Upgrade realizado! O ecossistema ${tier.name} já está liberado.`);
        }},
      ]
    );
  };

  return (
    <View style={{ flex: 1 }}>
      <TopBar title="Planos & Upgrade" subtitle="ASSINATURA" onMenu={onMenu} />
      <ScrollView style={S.form} showsVerticalScrollIndicator={false}>
        <Text style={[S.cardSub, { marginBottom: 20, marginTop: -4 }]}>Evolua a infraestrutura tecnológica do seu time conforme sua operação cresce</Text>

        <Text style={S.sectionLabel}>ESCOLHA SEU PLANO DE CRESCIMENTO</Text>

        {TIERS.map((tier) => {
          const active = currentPlan === tier.id;
          return (
            <View key={tier.id} style={[S.tierCard, active && S.tierCardActive]}>
              <View style={S.tierCardHeader}>
                <View>
                  <Text style={S.tierName}>{tier.name}</Text>
                  {active && <Text style={S.tierActiveLbl}>✨ PLANO ATUAL</Text>}
                </View>
                <Text style={S.tierPrice}>{tier.price}</Text>
              </View>

              <View style={{ marginVertical: 16 }}>
                {tier.features.map((f, i) => (
                  <Text key={i} style={S.tierFeatureText}>✓  {f}</Text>
                ))}
              </View>

              <TouchableOpacity
                style={[S.tierActionBtn, active ? S.tierBtnActive : S.tierBtnInactive]}
                onPress={() => handleUpgrade(tier)}
                activeOpacity={0.8}
              >
                <Text style={[S.tierBtnText, active && { color: "#00E5FF" }]}>
                  {active ? "Plano Ativo na Conta" : "Fazer Upgrade para este Plano"}
                </Text>
              </TouchableOpacity>
            </View>
          );
        })}
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────
export default function PreviewUnifiedScreen() {
  const [route,   setRoute]   = useState<Route>("Chat");
  const [sidebar, setSidebar] = useState(false);
  const openMenu = () => setSidebar(true);

  // Swipe-to-open sidebar: detecta arrasto da borda esquerda (x < 40) para a direita (dx > 60)
  const swipePan = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (evt, gs) =>
        !sidebar && evt.nativeEvent.pageX < 40 && gs.dx > 10 && Math.abs(gs.dy) < Math.abs(gs.dx),
      onPanResponderRelease: (_evt, gs) => {
        if (gs.dx > 60) setSidebar(true);
      },
    })
  ).current;

  return (
    <View style={S.root} {...swipePan.panHandlers}>
      <StatusBar barStyle="light-content" backgroundColor="#090A0F" />

      {route === "Chat"              && <ChatView              onMenu={openMenu} />}
      {route === "Pipeline"          && <PipelineView          onMenu={openMenu} />}
      {route === "Route"             && <RouteView             onMenu={openMenu} />}
      {route === "Prospecting"       && <ProspectingView       onMenu={openMenu} />}
      {route === "Meeting"           && <MeetingView           onMenu={openMenu} />}
      {route === "Farmer"            && <FarmerView            onMenu={openMenu} />}
      {route === "Reports"           && <ReportsView           onMenu={openMenu} />}
      {route === "Marketing"         && <MarketingView         onMenu={openMenu} />}
      {route === "Management"        && <ManagementView        onMenu={openMenu} />}
      {route === "Kpis"              && <KpisView              onMenu={openMenu} />}
      {route === "CorporatePortfolio"&& <CorporatePortfolioView onMenu={openMenu} />}
      {route === "Broadcast"         && <BroadcastView         onMenu={openMenu} />}
      {route === "Feedbacks"         && <FeedbacksView         onMenu={openMenu} />}
      {route === "TeamPulse"         && <TeamPulseView         onMenu={openMenu} />}
      {route === "PulseCheck"        && <PulseCheckView        onMenu={openMenu} />}
      {route === "AccountSettings"   && <AccountSettingsView   onMenu={openMenu} />}
      {route === "Subscription"      && <SubscriptionView      onMenu={openMenu} />}

      <Sidebar visible={sidebar} onClose={() => setSidebar(false)} currentRoute={route} onNavigate={setRoute} />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const S = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#090A0F" },

  backAbsolute: { position: "absolute", right: 16, zIndex: 30, backgroundColor: "rgba(255,255,255,0.04)", borderRadius: 10, borderWidth: 1, borderColor: "rgba(255,255,255,0.06)", paddingHorizontal: 12, paddingVertical: 6 },

  topBar: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, paddingBottom: 14 },
  iconBtn: { width: 42, height: 42, borderRadius: 12, backgroundColor: "transparent", borderWidth: 0, alignItems: "center", justifyContent: "center" },
  topIconText: { color: "#FFFFFF", fontSize: 18 },
  topSubtitle: { fontSize: 11, color: "#8F94A8", fontWeight: "600", letterSpacing: 0.5, textTransform: "uppercase" },
  topTitle: { fontSize: 22, fontWeight: "700", color: "#FFFFFF", letterSpacing: -0.5 },

  tabsWrapper: { borderBottomWidth: 1, borderColor: "#161822" },
  tabsScroll: { paddingHorizontal: 20, paddingBottom: 12 },
  tabBtn: { marginRight: 24, paddingBottom: 6, position: "relative" },
  tabText: { fontSize: 15, fontWeight: "500", color: "#4E5366" },
  tabTextActive: { color: "#FFFFFF", fontWeight: "700" },
  tabLine: { position: "absolute", bottom: -13, left: 0, right: 0, height: 2, backgroundColor: "#00E5FF", borderRadius: 1 },

  list: { padding: 20 },
  card: { backgroundColor: "#161822", borderRadius: 16, padding: 18, marginBottom: 14, borderWidth: 1, borderColor: "#242736" },
  cardHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 },
  cardName: { fontSize: 16, fontWeight: "600", color: "#FFFFFF", flex: 1, marginRight: 8 },
  cardSub:  { fontSize: 13, color: "#8F94A8", marginBottom: 14 },
  cardSub2: { fontSize: 13, color: "#8F94A8", marginTop: 2 },
  cardFoot: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  cardValue: { fontSize: 18, fontWeight: "700", color: "#FFFFFF" },
  cardDate:  { fontSize: 12, color: "#4E5366" },
  badge: { backgroundColor: "rgba(255,255,255,0.04)", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  badgeText: { fontSize: 11, color: "#8F94A8" },
  dot: { width: 8, height: 8, borderRadius: 4 },
  aiBadge: { backgroundColor: "rgba(0,229,255,0.1)", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  aiBadgeText: { fontSize: 11, color: "#00E5FF", fontWeight: "600" },
  histCount: { fontSize: 13, color: "#00E5FF", fontWeight: "600", borderTopWidth: 1, borderColor: "#242736", paddingTop: 12, marginTop: 4 },
  healthBadge: { backgroundColor: "rgba(56,161,105,0.1)", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  healthBadgeRisk: { backgroundColor: "rgba(229,62,62,0.1)" },
  healthText: { fontSize: 11, color: "#38A169", fontWeight: "600" },
  healthTextRisk: { color: "#E93E3E" },

  form: { padding: 20 },
  label: { fontSize: 11, color: "#8F94A8", fontWeight: "600", letterSpacing: 0.8, marginBottom: 8 },
  label2: { fontSize: 9, color: "#4E5366", fontWeight: "700", letterSpacing: 0.5, marginBottom: 4 },
  sectionLabel: { fontSize: 12, color: "#8F94A8", fontWeight: "700", letterSpacing: 0.8 },
  input: { backgroundColor: "#161822", height: 54, borderRadius: 12, paddingHorizontal: 16, color: "#FFFFFF", fontSize: 15, borderWidth: 1, borderColor: "#242736", marginBottom: 20 },
  primaryBtn: { backgroundColor: "#FFFFFF", height: 56, borderRadius: 14, alignItems: "center", justifyContent: "center", marginBottom: 16 },
  primaryBtnDisabled: { backgroundColor: "#161822", borderWidth: 1, borderColor: "#242736", opacity: 0.5 },
  primaryBtnText: { color: "#090A0F", fontWeight: "700", fontSize: 15 },
  helperText: { color: "#4E5366", fontSize: 12, textAlign: "center", lineHeight: 18 },
  empty: { alignItems: "center", justifyContent: "center", paddingVertical: 60 },
  emptyText: { color: "#4E5366", fontSize: 14 },

  aiHeroCard: { backgroundColor: "#161822", borderRadius: 20, padding: 22, borderWidth: 1, borderColor: "#242736", marginBottom: 20 },
  aiHeroTitle: { fontSize: 18, fontWeight: "700", color: "#FFFFFF", marginBottom: 8 },
  aiHeroDesc: { fontSize: 13, color: "#8F94A8", lineHeight: 20, marginBottom: 24 },
  insightBox: { backgroundColor: "rgba(0,229,255,0.03)", borderRadius: 14, padding: 18, borderWidth: 1, borderColor: "rgba(0,229,255,0.15)" },
  insightTitle: { fontSize: 14, fontWeight: "600", color: "#FFFFFF", marginBottom: 10 },
  insightText: { fontSize: 13, color: "#8F94A8", lineHeight: 18, marginBottom: 6 },

  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "flex-end" },
  sheet: { backgroundColor: "#11131A", borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 24, paddingTop: 12, paddingBottom: 40, borderTopWidth: 1, borderColor: "#242736" },
  handle: { width: 36, height: 4, backgroundColor: "#242736", borderRadius: 2, alignSelf: "center", marginBottom: 24 },
  sheetCompany: { fontSize: 13, color: "#00E5FF", fontWeight: "600", textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 },
  sheetName: { fontSize: 24, fontWeight: "700", color: "#FFFFFF" },
  sheetValue: { fontSize: 32, fontWeight: "800", color: "#FFFFFF", marginTop: 12, marginBottom: 30 },
  actionRow: { flexDirection: "row", gap: 12, marginTop: 20 },
  actionBtn: { flex: 1, backgroundColor: "#FFFFFF", height: 52, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  actionBtnText: { color: "#090A0F", fontWeight: "600", fontSize: 15 },
  actionBtnSec: { backgroundColor: "transparent", borderWidth: 1, borderColor: "#242736" },
  actionBtnSecText: { color: "#FFFFFF", fontWeight: "600", fontSize: 15 },

  chatArea: { padding: 20, paddingBottom: 10 },
  chatAreaCenter: { flex: 1, justifyContent: "center", alignItems: "center" },
  welcomeWrap: { alignItems: "center" },
  aiEmoji: { fontSize: 48, marginBottom: 20 },
  welcomeText: { color: "#FFFFFF", fontSize: 18, fontWeight: "500", textAlign: "center", lineHeight: 26 },
  bubble: { maxWidth: "82%", borderRadius: 18, paddingHorizontal: 16, paddingVertical: 10, marginBottom: 10 },
  bubbleUser: { alignSelf: "flex-end", backgroundColor: "#FFFFFF" },
  bubbleAi:   { alignSelf: "flex-start", backgroundColor: "#161822", borderWidth: 1, borderColor: "#242736" },
  bubbleText: { fontSize: 15, lineHeight: 22 },
  bubbleTextUser: { color: "#090A0F", fontWeight: "500" },
  bubbleTextAi:   { color: "#FFFFFF" },
  inputContainer: { paddingHorizontal: 16, paddingTop: 8, backgroundColor: "#090A0F" },
  inputRowInside: { flexDirection: "row", backgroundColor: "#161822", borderRadius: 28, alignItems: "center", paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderColor: "#242736", minHeight: 52 },
  innerBarButton:         { width: 36, height: 36, borderRadius: 18, backgroundColor: "transparent", alignItems: "center", justifyContent: "center" },
  barIcon:                { color: "#FFFFFF", fontSize: 20, fontWeight: "300" },
  textInputStyle:         { flex: 1, color: "#FFFFFF", fontSize: 15, paddingHorizontal: 10, maxHeight: 100 },
  sendButtonCircle:       { width: 36, height: 36, borderRadius: 18, backgroundColor: "#FFFFFF", alignItems: "center", justifyContent: "center" },
  sendIcon:               { color: "#090A0F", fontSize: 14, fontWeight: "700" },
  recordingWaveContainer: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 4 },
  recordingLabel:         { color: "#8F94A8", fontSize: 14, fontWeight: "500" },
  waveRow:                { flexDirection: "row", alignItems: "center", justifyContent: "center", height: 30 },
  waveLine:               { width: 3, backgroundColor: "#FFFFFF", marginHorizontal: 2, borderRadius: 1.5 },

  // Route screen
  mapPreview: { height: 160, marginHorizontal: 20, borderRadius: 16, backgroundColor: "#161822", marginBottom: 20, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "#242736" },
  mapText: { color: "#4E5366", fontWeight: "600", fontSize: 14 },
  mapSubText: { color: "#00E5FF", fontSize: 12, marginTop: 4, fontWeight: "500" },
  timelineRow: { flexDirection: "row", paddingHorizontal: 20, marginBottom: 4 },
  timelineSide: { width: 50, alignItems: "center", marginRight: 12 },
  timelineTime: { fontSize: 12, color: "#FFFFFF", fontWeight: "600", marginBottom: 4 },
  timelineDot: { width: 12, height: 12, borderRadius: 6, borderWidth: 2, borderColor: "#090A0F", zIndex: 2 },
  dotConfirmed: { backgroundColor: "#38A169" },
  dotSuggested: { backgroundColor: "#00E5FF" },
  timelineLine: { width: 2, backgroundColor: "#242736", flex: 1, marginTop: -2, marginBottom: -4 },
  eventCard: { flex: 1, backgroundColor: "#161822", borderRadius: 14, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: "#242736" },
  eventHead: { flexDirection: "row", justifyContent: "space-between", marginBottom: 6 },
  eventType: { fontSize: 11, color: "#8F94A8", fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.5 },
  travelTime: { fontSize: 11, color: "#4E5366", fontWeight: "500" },
  eventTitle: { fontSize: 16, color: "#FFFFFF", fontWeight: "600", marginBottom: 2 },
  eventAddress: { fontSize: 13, color: "#8F94A8" },
  suggestionBadge: { marginTop: 10, alignSelf: "flex-start", backgroundColor: "rgba(0,229,255,0.1)", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  suggestionText: { color: "#00E5FF", fontSize: 11, fontWeight: "600" },
  fabContainer: { position: "absolute", left: 20, right: 20, zIndex: 10 },
  confirmBtn: { backgroundColor: "#161822", height: 56, borderRadius: 16, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "#00E5FF", shadowColor: "#00E5FF", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 6 },
  confirmBtnText: { color: "#FFFFFF", fontSize: 16, fontWeight: "700" },
  startBtn: { backgroundColor: "#FFFFFF", borderColor: "#FFFFFF" },

  // Meeting screen
  dateStrip: { flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 20, paddingBottom: 16 },
  dateChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, backgroundColor: "#161822", borderWidth: 1, borderColor: "#242736" },
  dateChipActive: { backgroundColor: "#00E5FF22", borderColor: "#00E5FF" },
  dateChipText: { fontSize: 12, color: "#4E5366", fontWeight: "600" },
  dateChipTextActive: { color: "#00E5FF" },
  meetCard: { flexDirection: "row", backgroundColor: "#161822", borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: "#242736" },
  meetTimeCol: { width: 44, alignItems: "center", marginRight: 14, gap: 6 },
  meetTime: { fontSize: 13, color: "#FFFFFF", fontWeight: "700" },
  meetDot: { width: 8, height: 8, borderRadius: 4 },
  statusChip: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, borderWidth: 1 },
  statusChipText: { fontSize: 10, fontWeight: "700" },
  briefingBox: { backgroundColor: "rgba(0,229,255,0.04)", borderRadius: 12, padding: 16, borderWidth: 1, borderColor: "rgba(0,229,255,0.15)", marginTop: 16, marginBottom: 4 },
  briefingLabel: { fontSize: 10, color: "#00E5FF", fontWeight: "700", letterSpacing: 1, marginBottom: 8 },
  briefingText: { fontSize: 14, color: "#E2E8F0", lineHeight: 22 },

  // Sidebar — accordion estilo JADE / ChatGPT
  sidebarOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.45)", zIndex: 10 },
  sidebar: { position: "absolute", top: 0, left: 0, bottom: 0, backgroundColor: "#090A0F", paddingHorizontal: 20, zIndex: 20 },
  drawerHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingBottom: 24, borderBottomWidth: 1, borderColor: "#161822", marginBottom: 20 },
  drawerBrand: { color: "#FFFFFF", fontSize: 24, fontWeight: "800", letterSpacing: 1 },
  drawerAvatar: { width: 44, height: 44, borderRadius: 22, borderWidth: 1.5, borderColor: "#242736", backgroundColor: "#161822", alignItems: "center", justifyContent: "center" },
  drawerSection: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 14, borderRadius: 10 },
  drawerSectionTitle: { color: "#FFFFFF", fontSize: 16, fontWeight: "600", letterSpacing: -0.2 },
  drawerArrow: { color: "#4E5366", fontSize: 12 },
  drawerSubMenu: { paddingLeft: 16, marginTop: 4, marginBottom: 10, borderLeftWidth: 1, borderColor: "#161822" },
  drawerSubItem: { paddingVertical: 11, borderRadius: 8 },
  drawerSubText: { color: "#8F94A8", fontSize: 14, fontWeight: "500" },
  drawerSubTextActive: { color: "#FFFFFF", fontWeight: "700" },
  drawerDivider: { height: 1, backgroundColor: "#161822", marginVertical: 10 },
  drawerCloseBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: "rgba(255,255,255,0.04)", borderWidth: 1, borderColor: "rgba(255,255,255,0.06)", alignItems: "center", justifyContent: "center" },
  drawerCloseBtnText: { color: "#8F94A8", fontSize: 14, fontWeight: "600" },

  // Reports screen
  reportBox: { backgroundColor: "#161822", borderRadius: 16, padding: 18, borderWidth: 1, borderColor: "#242736", marginBottom: 28 },
  reportBoxHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16, gap: 8 },
  reportBoxTitle: { fontSize: 14, fontWeight: "700", color: "#FFFFFF", flex: 1 },
  reportStatusChip: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  chipRed: { backgroundColor: "rgba(229,62,62,0.1)" },
  chipGreen: { backgroundColor: "rgba(56,161,105,0.1)" },
  reportStatusText: { fontSize: 10, fontWeight: "700", textTransform: "uppercase" },
  reportLabel: { fontSize: 9, color: "#4E5366", fontWeight: "700", letterSpacing: 0.5, marginBottom: 6 },
  reportMuted: { fontSize: 13, color: "#8F94A8", lineHeight: 19, marginBottom: 14 },
  reportWhite: { fontSize: 13, color: "#FFFFFF", lineHeight: 19, fontWeight: "500" },
  metricsBox: { backgroundColor: "#161822", borderRadius: 16, padding: 18, borderWidth: 1, borderColor: "#242736", marginBottom: 20 },
  metricRow: { },
  progressTrack: { height: 6, backgroundColor: "#090A0F", borderRadius: 3, overflow: "hidden" },
  progressBar: { height: "100%", borderRadius: 3 },

  // Chat — recording indicator
  recordingBar: { flexDirection: "row", alignItems: "center", backgroundColor: "rgba(233,62,62,0.12)", borderTopWidth: 1, borderColor: "rgba(233,62,62,0.3)", paddingHorizontal: 20, paddingVertical: 10, gap: 10 },
  recordingDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: "#E93E3E" },
  recordingText: { color: "#E93E3E", fontSize: 13, fontWeight: "600" },

  // Meeting screen — robot config
  meetBriefPreview: { backgroundColor: "rgba(255,255,255,0.02)", borderRadius: 10, padding: 12, marginTop: 12, marginBottom: 10, borderWidth: 1, borderColor: "#242736" },
  meetBriefLabel: { fontSize: 9, color: "#00E5FF", fontWeight: "700", letterSpacing: 0.5, marginBottom: 6 },
  configRow: { flexDirection: "row", alignItems: "center", backgroundColor: "#161822", borderRadius: 14, padding: 18, borderWidth: 1, borderColor: "#242736", marginBottom: 24 },
  daysGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 24 },
  dayChip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10, backgroundColor: "#161822", borderWidth: 1, borderColor: "#242736" },
  dayChipActive: { backgroundColor: "rgba(0,229,255,0.12)", borderColor: "#00E5FF" },
  dayChipText: { fontSize: 13, color: "#4E5366", fontWeight: "600" },
  dayChipTextActive: { color: "#00E5FF" },
  timeWindowBtn: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: "#161822", borderRadius: 14, padding: 18, borderWidth: 1, borderColor: "#242736", marginBottom: 20 },

  // KPIs screen
  kpiChartRow:   { flexDirection: "row", alignItems: "center", marginBottom: 14 },
  kpiChartMonth: { width: 52, color: "#8F94A8", fontSize: 13, fontWeight: "500" },
  kpiChartValue: { color: "#FFFFFF", fontSize: 13, fontWeight: "600", width: 38, textAlign: "right" },
  kpiExecItem:   { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 16, paddingHorizontal: 20 },
  kpiAiBox:      { backgroundColor: "rgba(0,229,255,0.02)", borderWidth: 1, borderColor: "rgba(0,229,255,0.15)", borderRadius: 16, padding: 18, marginBottom: 8 },
  kpiAiTitle:    { fontSize: 14, fontWeight: "700", color: "#FFFFFF", marginBottom: 16 },
  kpiMiniRow:    { flexDirection: "row", justifyContent: "space-between", backgroundColor: "#161822", padding: 12, borderRadius: 10, marginBottom: 16 },
  kpiMiniCard:   { alignItems: "center", flex: 1 },

  // Corporate Portfolio screen
  corpMacroRow:  { flexDirection: "row", paddingHorizontal: 20, justifyContent: "space-between", marginBottom: 20, gap: 8 },
  corpMacroCard: { flex: 1, backgroundColor: "#161822", borderRadius: 12, padding: 12, borderWidth: 1, borderColor: "#242736" },

  // Account Settings screen
  acctSecBtn:        { backgroundColor: "#161822", height: 54, borderRadius: 12, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "#242736", marginTop: 12 },
  acctSecBtnText:    { color: "#FFFFFF", fontWeight: "700", fontSize: 15 },
  acctProductList:   { backgroundColor: "#161822", borderRadius: 12, padding: 14, borderWidth: 1, borderColor: "#242736", marginBottom: 12 },
  acctProductRow:    { flexDirection: "row", justifyContent: "space-between", paddingVertical: 6 },
  acctAddRow:        { flexDirection: "row", alignItems: "center", marginBottom: 20 },
  acctMiniBtn:       { backgroundColor: "#161822", width: 54, height: 54, borderRadius: 12, borderWidth: 1, borderColor: "#00E5FF", justifyContent: "center", alignItems: "center" },
  acctMiniBtnText:   { color: "#00E5FF", fontSize: 20, fontWeight: "600" },

  // Subscription screen
  tierCard:        { backgroundColor: "#161822", borderRadius: 16, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: "#242736" },
  tierCardActive:  { borderColor: "#00E5FF", backgroundColor: "rgba(0,229,255,0.01)" },
  tierCardHeader:  { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", borderBottomWidth: 1, borderColor: "#242736", paddingBottom: 14 },
  tierName:        { color: "#FFFFFF", fontSize: 18, fontWeight: "700" },
  tierActiveLbl:   { color: "#00E5FF", fontSize: 11, fontWeight: "700", marginTop: 4, letterSpacing: 0.5 },
  tierPrice:       { color: "#FFFFFF", fontSize: 16, fontWeight: "700" },
  tierFeatureText: { color: "#8F94A8", fontSize: 13, paddingVertical: 4, lineHeight: 18 },
  tierActionBtn:   { height: 48, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  tierBtnActive:   { backgroundColor: "transparent", borderWidth: 1, borderColor: "rgba(0,229,255,0.2)" },
  tierBtnInactive: { backgroundColor: "#FFFFFF" },
  tierBtnText:     { color: "#090A0F", fontWeight: "700", fontSize: 14 },

  // Feedbacks screen
  fbScoreBadge: { backgroundColor: "rgba(0,229,255,0.10)", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  fbScoreText:  { color: "#00E5FF", fontWeight: "700", fontSize: 13 },

  // Team Pulse screen
  pulseGrid:  { flexDirection: "row", justifyContent: "space-between", marginBottom: 24, gap: 8 },
  pulseCard:  { flex: 1, backgroundColor: "#161822", borderRadius: 14, padding: 12, alignItems: "center", borderWidth: 1 },
  pulseCount: { color: "#FFFFFF", fontSize: 14, fontWeight: "700" },
  pulseLabel: { color: "#8F94A8", fontSize: 11, marginTop: 2, textAlign: "center" },

  // Pulse Check screen
  pulseCheckWrapper:    { flexGrow: 1, paddingHorizontal: 24, paddingBottom: 40, justifyContent: "center" },
  pulseCheckBrand:      { color: "#00E5FF", fontSize: 11, fontWeight: "700", letterSpacing: 1, marginBottom: 8, textAlign: "center" },
  pulseCheckTitle:      { color: "#FFFFFF", fontSize: 22, fontWeight: "700", textAlign: "center", lineHeight: 30, letterSpacing: -0.3, marginBottom: 10 },
  pulseOption:          { flexDirection: "row", alignItems: "center", backgroundColor: "#161822", height: 56, borderRadius: 12, paddingHorizontal: 16, borderWidth: 1, borderColor: "#242736", marginBottom: 12 },
  pulseOptionActive:    { borderColor: "#00E5FF", backgroundColor: "rgba(0,229,255,0.02)" },
  pulseOptionText:      { color: "#8F94A8", fontSize: 14, fontWeight: "500", flex: 1 },
  pulseOptionTextActive:{ color: "#FFFFFF", fontWeight: "600" },

  // Broadcast screen
  broadcastAiBtn:     { height: 48, borderRadius: 12, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "#00E5FF", marginBottom: 16 },
  broadcastAiBtnText: { color: "#00E5FF", fontSize: 14, fontWeight: "600" },

  // Management screen
  mgmtAddBtn: { backgroundColor: "#161822", borderWidth: 1, borderColor: "#242736", paddingHorizontal: 16, height: 40, borderRadius: 10, justifyContent: "center", alignItems: "center" },
  mgmtAddBtnText: { color: "#FFFFFF", fontSize: 14, fontWeight: "600" },
  mgmtGrid: { marginBottom: 16 },
  mgmtGridRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 12 },
  mgmtGridCard: { flex: 1, backgroundColor: "#161822", borderRadius: 14, padding: 16, borderWidth: 1, borderColor: "#242736", marginRight: 10 },
  mgmtGridLabel: { fontSize: 9, color: "#4E5366", fontWeight: "700", letterSpacing: 0.5 },
  mgmtGridValue: { fontSize: 24, fontWeight: "700", color: "#00E5FF", marginTop: 4 },
  mgmtExecRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  mgmtAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: "#090A0F", borderWidth: 1, borderColor: "#242736", alignItems: "center", justifyContent: "center" },

  // Marketing screen
  mktLaunchBtn: { backgroundColor: "#161822", height: 50, borderRadius: 12, borderWidth: 1, borderColor: "#242736", justifyContent: "center", paddingHorizontal: 16 },
  mktLaunchText: { color: "#00E5FF", fontSize: 14, fontWeight: "600" },
  mktModalHeader: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, height: 60, borderBottomWidth: 1, borderColor: "#161822" },
  strategyBox: { backgroundColor: "rgba(0,229,255,0.02)", borderWidth: 1, borderColor: "rgba(0,229,255,0.15)", borderRadius: 16, padding: 18, marginTop: 28 },
  mktOutputText: { fontSize: 13, color: "#8F94A8", lineHeight: 19, marginBottom: 12 },
});
