import React, { useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
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
import { useRouter } from "expo-router";

// ─── Types ────────────────────────────────────────────────────────────────────
type Route = "Chat" | "Pipeline" | "Route" | "Prospecting" | "Meeting" | "Farmer" | "Reports" | "Marketing";
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
          {/* Avatar placeholder */}
          <View style={S.drawerAvatar}>
            <Text style={{ fontSize: 18 }}>👤</Text>
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
  const insets = useSafeAreaInsets();
  const [input,    setInput]    = useState("");
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const scrollRef = useRef<ScrollView>(null);

  const send = () => {
    const t = input.trim(); if (!t) return;
    setMessages((p) => [...p, { id: Date.now().toString(), text: t, sender: "user" }]);
    setInput("");
    setTimeout(() => {
      setMessages((p) => [...p, { id: (Date.now()+1).toString(), text: "Analisando seus dados comerciais… Em breve trarei insights sobre seu pipeline e oportunidades de up-sell.", sender: "ai" }]);
      scrollRef.current?.scrollToEnd({ animated: true });
    }, 900);
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 80);
  };

  return (
    <View style={{ flex: 1 }}>
      <TopBar title="Sleek IA" onMenu={onMenu} />
      <ScrollView ref={scrollRef} style={{ flex: 1 }} contentContainerStyle={[S.chatArea, messages.length === 0 && S.chatAreaCenter]} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {messages.length === 0 ? (
          <View style={S.welcomeWrap}>
            <Text style={S.aiEmoji}>🤖</Text>
            <Text style={S.welcomeText}>Como posso alavancar suas vendas hoje?</Text>
          </View>
        ) : messages.map((m) => (
          <View key={m.id} style={[S.bubble, m.sender === "user" ? S.bubbleUser : S.bubbleAi]}>
            <Text style={[S.bubbleText, m.sender === "user" ? S.bubbleTextUser : S.bubbleTextAi]}>{m.text}</Text>
          </View>
        ))}
      </ScrollView>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <View style={[S.inputContainer, { paddingBottom: insets.bottom + 12 }]}>
          <View style={S.inputRow}>
            <TouchableOpacity style={S.innerBarBtn}><Text style={S.barIcon}>＋</Text></TouchableOpacity>
            <TextInput style={S.textInput} placeholder="Perguntar ao Sleek IA..." placeholderTextColor="#626880" value={input} onChangeText={setInput} multiline />
            <TouchableOpacity style={S.sendBtn} onPress={send} activeOpacity={0.8}>
              <Text style={S.sendIcon}>{input.trim().length > 0 ? "▲" : "🎙️"}</Text>
            </TouchableOpacity>
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

// ─── Root ─────────────────────────────────────────────────────────────────────
export default function PreviewUnifiedScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [route,   setRoute]   = useState<Route>("Chat");
  const [sidebar, setSidebar] = useState(false);
  const openMenu = () => setSidebar(true);

  return (
    <View style={S.root}>
      <StatusBar barStyle="light-content" backgroundColor="#090A0F" />
      <TouchableOpacity style={[S.backAbsolute, { top: insets.top + 8 }]} onPress={() => router.back()} activeOpacity={0.7}>
        <Text style={{ color: "#8F94A8", fontSize: 12 }}>✕ Voltar</Text>
      </TouchableOpacity>

      {route === "Chat"        && <ChatView        onMenu={openMenu} />}
      {route === "Pipeline"    && <PipelineView    onMenu={openMenu} />}
      {route === "Route"       && <RouteView       onMenu={openMenu} />}
      {route === "Prospecting" && <ProspectingView onMenu={openMenu} />}
      {route === "Meeting"     && <MeetingView     onMenu={openMenu} />}
      {route === "Farmer"      && <FarmerView      onMenu={openMenu} />}
      {route === "Reports"     && <ReportsView     onMenu={openMenu} />}
      {route === "Marketing"   && <MarketingView   onMenu={openMenu} />}

      <Sidebar visible={sidebar} onClose={() => setSidebar(false)} currentRoute={route} onNavigate={setRoute} />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const S = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#090A0F" },

  backAbsolute: { position: "absolute", right: 16, zIndex: 30, backgroundColor: "rgba(255,255,255,0.04)", borderRadius: 10, borderWidth: 1, borderColor: "rgba(255,255,255,0.06)", paddingHorizontal: 12, paddingVertical: 6 },

  topBar: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, paddingBottom: 14 },
  iconBtn: { width: 42, height: 42, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.03)", borderWidth: 1, borderColor: "rgba(255,255,255,0.05)", alignItems: "center", justifyContent: "center" },
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
  inputRow: { flexDirection: "row", backgroundColor: "#161822", borderRadius: 28, alignItems: "center", paddingHorizontal: 8, paddingVertical: 6, borderWidth: 1, borderColor: "#242736" },
  innerBarBtn: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  barIcon: { color: "#8F94A8", fontSize: 20 },
  textInput: { flex: 1, color: "#FFFFFF", fontSize: 15, paddingHorizontal: 10, maxHeight: 100, paddingTop: Platform.OS === "ios" ? 8 : 4 },
  sendBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: "#FFFFFF", alignItems: "center", justifyContent: "center" },
  sendIcon: { color: "#090A0F", fontSize: 14, fontWeight: "700" },

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

  // Marketing screen
  mktLaunchBtn: { backgroundColor: "#161822", height: 50, borderRadius: 12, borderWidth: 1, borderColor: "#242736", justifyContent: "center", paddingHorizontal: 16 },
  mktLaunchText: { color: "#00E5FF", fontSize: 14, fontWeight: "600" },
  mktModalHeader: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, height: 60, borderBottomWidth: 1, borderColor: "#161822" },
  strategyBox: { backgroundColor: "rgba(0,229,255,0.02)", borderWidth: 1, borderColor: "rgba(0,229,255,0.15)", borderRadius: 16, padding: 18, marginTop: 28 },
  mktOutputText: { fontSize: 13, color: "#8F94A8", lineHeight: 19, marginBottom: 12 },
});
