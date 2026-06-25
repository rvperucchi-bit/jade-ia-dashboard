import React, { useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Easing,
  FlatList,
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
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Linking from "expo-linking";
import { useRouter } from "expo-router";

// ─── Types ────────────────────────────────────────────────────────────────────
type Route = "Chat" | "Pipeline" | "Route" | "Prospecting" | "Meeting" | "Farmer";
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

const SIDEBAR_W = 280;

// ─── Sidebar ──────────────────────────────────────────────────────────────────
const MENU_ITEMS: { label: string; icon: string; route: Route }[] = [
  { label: "Chat IA",          icon: "💬", route: "Chat"        },
  { label: "Pipeline",         icon: "📊", route: "Pipeline"    },
  { label: "Rota do Dia",      icon: "📍", route: "Route"       },
  { label: "Prospecção",       icon: "🔍", route: "Prospecting" },
  { label: "Agenda & Briefing",icon: "📅", route: "Meeting"     },
  { label: "Farmer & Carteira",icon: "🌱", route: "Farmer"      },
];

function Sidebar({ visible, onClose, currentRoute, onNavigate }: {
  visible: boolean; onClose: () => void;
  currentRoute: Route; onNavigate: (r: Route) => void;
}) {
  const slideX = useRef(new Animated.Value(-SIDEBAR_W)).current;
  const dim    = useRef(new Animated.Value(0)).current;
  const insets = useSafeAreaInsets();

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(slideX, { toValue: visible ? 0 : -SIDEBAR_W, duration: visible ? 300 : 260, easing: visible ? Easing.out(Easing.cubic) : Easing.in(Easing.cubic), useNativeDriver: true }),
      Animated.timing(dim,    { toValue: visible ? 1 : 0,           duration: visible ? 280 : 240, useNativeDriver: true }),
    ]).start();
  }, [visible]);

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <Animated.View style={[S.sidebarOverlay, { opacity: dim }]}>
        <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={onClose} />
      </Animated.View>
      <Animated.View style={[S.sidebar, { paddingTop: insets.top + 20, transform: [{ translateX: slideX }] }]}>
        <View style={S.drawerHeader}>
          <Text style={S.drawerBrand}>Sleek CRM</Text>
          <Text style={S.drawerUser}>Vendas Autônomas</Text>
        </View>
        <ScrollView showsVerticalScrollIndicator={false}>
          {MENU_ITEMS.map((item) => {
            const active = currentRoute === item.route;
            return (
              <TouchableOpacity
                key={item.route}
                style={[S.drawerItem, active && S.drawerItemActive]}
                activeOpacity={0.7}
                onPress={() => { onClose(); onNavigate(item.route); }}
              >
                <Text style={S.drawerItemIcon}>{item.icon}</Text>
                <Text style={[S.drawerItemText, active && S.drawerItemTextActive]}>{item.label}</Text>
              </TouchableOpacity>
            );
          })}
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
function MeetingView({ onMenu }: { onMenu: () => void }) {
  const [selected, setSelected] = useState<MeetingItem | null>(null);

  const statusColor = (s: string) =>
    s === "Confirmado" ? "#38A169" : s === "Pendente" ? "#00E5FF" : "#4E5366";

  return (
    <View style={{ flex: 1 }}>
      <TopBar title="Agenda & Briefing" subtitle="HOJE" onMenu={onMenu} />

      {/* Date strip */}
      <View style={S.dateStrip}>
        {["Seg 21","Ter 22","Qua 23","Qui 24","Sex 25"].map((d) => {
          const active = d === "Sex 25";
          return (
            <TouchableOpacity key={d} style={[S.dateChip, active && S.dateChipActive]} activeOpacity={0.7}>
              <Text style={[S.dateChipText, active && S.dateChipTextActive]}>{d}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <FlatList
        data={MEETINGS}
        keyExtractor={(i) => i.id}
        contentContainerStyle={S.list}
        renderItem={({ item }) => (
          <TouchableOpacity style={S.meetCard} onPress={() => setSelected(item)} activeOpacity={0.7}>
            <View style={S.meetTimeCol}>
              <Text style={S.meetTime}>{item.time}</Text>
              <View style={[S.meetDot, { backgroundColor: statusColor(item.status) }]} />
            </View>
            <View style={{ flex: 1 }}>
              <View style={S.cardHead}>
                <Text style={[S.cardName, { flex: 1 }]} numberOfLines={1}>{item.title}</Text>
                <View style={[S.statusChip, { borderColor: statusColor(item.status) + "44", backgroundColor: statusColor(item.status) + "11" }]}>
                  <Text style={[S.statusChipText, { color: statusColor(item.status) }]}>{item.status}</Text>
                </View>
              </View>
              <Text style={S.cardSub}>{item.company} · {item.type}</Text>
            </View>
          </TouchableOpacity>
        )}
      />

      {/* Briefing bottom sheet */}
      <Modal visible={selected !== null} animationType="slide" transparent onRequestClose={() => setSelected(null)}>
        <TouchableOpacity style={S.overlay} activeOpacity={1} onPress={() => setSelected(null)}>
          <View style={S.sheet}>
            <View style={S.handle} />
            {selected && (
              <>
                <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 4 }}>
                  <Text style={[S.sheetCompany, { flex: 1 }]}>{selected.company} · {selected.time}</Text>
                </View>
                <Text style={S.sheetName}>{selected.title}</Text>
                <View style={S.briefingBox}>
                  <Text style={S.briefingLabel}>📋 BRIEFING DA IA</Text>
                  <Text style={S.briefingText}>{selected.prep}</Text>
                </View>
                <View style={S.actionRow}>
                  <TouchableOpacity style={S.actionBtn}><Text style={S.actionBtnText}>Iniciar Reunião</Text></TouchableOpacity>
                  <TouchableOpacity style={[S.actionBtn, S.actionBtnSec]}><Text style={S.actionBtnSecText}>Reagendar</Text></TouchableOpacity>
                </View>
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

  // Sidebar
  sidebarOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.6)", zIndex: 10 },
  sidebar: { position: "absolute", top: 0, left: 0, bottom: 0, width: SIDEBAR_W, backgroundColor: "#11131A", borderRightWidth: 1, borderColor: "#242736", paddingHorizontal: 12, zIndex: 20 },
  drawerHeader: { paddingVertical: 28, paddingHorizontal: 10, borderBottomWidth: 1, borderColor: "#242736", marginBottom: 10 },
  drawerBrand: { color: "#FFFFFF", fontSize: 22, fontWeight: "800", letterSpacing: -0.5 },
  drawerUser: { color: "#00E5FF", fontSize: 12, fontWeight: "600", marginTop: 4, letterSpacing: 0.5 },
  drawerItem: { flexDirection: "row", alignItems: "center", height: 50, borderRadius: 12, paddingHorizontal: 14, marginBottom: 6 },
  drawerItemActive: { backgroundColor: "rgba(255,255,255,0.06)" },
  drawerItemIcon: { fontSize: 16, marginRight: 12 },
  drawerItemText: { color: "#8F94A8", fontSize: 15, fontWeight: "500" },
  drawerItemTextActive: { color: "#FFFFFF", fontWeight: "700" },
});
