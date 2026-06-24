import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Dimensions,
  Easing,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Linking,
  Modal,
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
import { useProfile } from "@/context/ProfileContext";
import { usePlan } from "@/context/PlanContext";
import { takePendingVoice } from "@/utils/voiceContext";
import { stripMarkdown } from "@/utils/stripMarkdown";

const PINK      = "#FF0080";
const BG        = "#0B0814";
const { width: SCREEN_W } = Dimensions.get("window");
const DRAWER_W  = SCREEN_W;
const RDRAWER_W = 76;

// ─── Menu data ────────────────────────────────────────────────────────────────
type MenuItem = { label: string; route?: string; requiresPlan?: "pro" | "enterprise"; action?: "nova-conversa" };
type AccordionSection = { key: string; title: string; icon: string; items: MenuItem[] };

const ACCORDION_SECTIONS: AccordionSection[] = [
  {
    key: "conversas",
    title: "Conversas",
    icon: "message-circle",
    items: [
      { label: "Nova conversa", action: "nova-conversa" },
      { label: "Histórico",     route: "/historico" },
    ],
  },
  {
    key: "comercial",
    title: "Comercial",
    icon: "trending-up",
    items: [
      { label: "Dashboard",     route: "/painelexecutivo" },
      { label: "Conversas",     route: "/(tabs)/conversas" },
      { label: "CRM",           route: "/crm" },
      { label: "Pipeline",      route: "/pipeline" },
      { label: "Oportunidades", route: "/(tabs)/leads" },
      { label: "Briefings",     route: "/briefing" },
      { label: "Relatórios",    route: "/relatorios" },
    ],
  },
  {
    key: "marketing",
    title: "Marketing",
    icon: "volume-2",
    items: [
      { label: "Briefings",    route: "/briefing" },
      { label: "Campanhas",    route: "/marketing",    requiresPlan: "pro" },
      { label: "Planejamento", route: "/planejamento", requiresPlan: "pro" },
      { label: "Simulação",    route: "/roleplay",     requiresPlan: "pro" },
    ],
  },
  {
    key: "gestao",
    title: "Gestão",
    icon: "bar-chart-2",
    items: [
      { label: "Central Comercial",   route: "/painelexecutivo",  requiresPlan: "enterprise" },
      { label: "Meu Time",            route: "/meutime",          requiresPlan: "enterprise" },
      { label: "Metas & KPIs",        route: "/metas",            requiresPlan: "enterprise" },
      { label: "Ranking",             route: "/relatoriogestor",  requiresPlan: "enterprise" },
      { label: "Carteira",            route: "/carteira",         requiresPlan: "enterprise" },
      { label: "Gestão Inteligente",  route: "/gestao",           requiresPlan: "enterprise" },
      { label: "Feedback JADE",       route: "/feedbackjade",     requiresPlan: "enterprise" },
      { label: "Análise Estratégica", route: "/analise",          requiresPlan: "enterprise" },
      { label: "Relatório do Gestor", route: "/relatoriogestor",  requiresPlan: "enterprise" },
      { label: "Notificações",        route: "/notificacoes" },
    ],
  },
  {
    key: "operacao",
    title: "Operação",
    icon: "map",
    items: [
      { label: "Scanner", route: "/scanner" },
      { label: "Rotas",   route: "/criarrota", requiresPlan: "pro" },
      { label: "Laudo",   route: "/laudo" },
    ],
  },
  {
    key: "configuracoes",
    title: "Configurações",
    icon: "settings",
    items: [
      { label: "Minha Empresa", route: "/empresa" },
      { label: "Perfil",        route: "/perfil" },
      { label: "Plano",         route: "/plano" },
      { label: "Uso",           route: "/uso" },
      { label: "Integrações",   route: "/whatsapp-config" },
    ],
  },
];

const CONTEXT_ITEMS = [
  { icon: "edit-2"   as const, label: "Renomear conversa" },
  { icon: "trash-2"  as const, label: "Limpar conversa",  danger: true },
  { icon: "download" as const, label: "Exportar conversa" },
  { icon: "share-2"  as const, label: "Compartilhar" },
  { icon: "sliders"  as const, label: "Configurações do chat" },
] as const;

// ─── Accordion component (left drawer) ───────────────────────────────────────
const ITEM_H = 46;

function AccordionItem({
  section,
  isOpen,
  onToggle,
  onItemPress,
}: {
  section: AccordionSection;
  isOpen: boolean;
  onToggle: () => void;
  onItemPress: (item: MenuItem) => void;
}) {
  const rotAnim   = useRef(new Animated.Value(0)).current;
  const hAnim     = useRef(new Animated.Value(0)).current;
  const CONTENT_H = section.items.length * ITEM_H;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(rotAnim, { toValue: isOpen ? 1 : 0, duration: 200, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(hAnim,   { toValue: isOpen ? CONTENT_H : 0, duration: 220, easing: Easing.out(Easing.cubic), useNativeDriver: false }),
    ]).start();
  }, [isOpen]);

  const rotate = rotAnim.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "90deg"] });

  return (
    <View style={C.accordionWrap}>
      <TouchableOpacity style={C.accordionHeader} onPress={onToggle} activeOpacity={0.7}>
        <Feather name={section.icon as any} size={14} color={isOpen ? PINK : "rgba(255,255,255,0.28)"} />
        <Text style={[C.accordionTitle, isOpen && C.accordionTitleOpen]}>{section.title}</Text>
        <Animated.View style={{ transform: [{ rotate }] }}>
          <Feather name="chevron-right" size={13} color="rgba(255,255,255,0.22)" />
        </Animated.View>
      </TouchableOpacity>
      <Animated.View style={{ height: hAnim, overflow: "hidden" }}>
        {section.items.map((item) => (
          <TouchableOpacity
            key={item.label}
            style={C.accordionItemRow}
            onPress={() => onItemPress(item)}
            activeOpacity={0.6}
          >
            {item.requiresPlan && (
              <Feather name="lock" size={10} color="rgba(255,255,255,0.18)" style={{ marginRight: 4 }} />
            )}
            <Text style={[
              C.accordionItemText,
              item.action === "nova-conversa" && C.accordionItemNew,
            ]} numberOfLines={1}>
              {item.label}
            </Text>
          </TouchableOpacity>
        ))}
      </Animated.View>
      <View style={C.accordionSep} />
    </View>
  );
}

// ─── AI Modules (right drawer) ────────────────────────────────────────────────
const MODULES = [
  { key: "radar",     icon: "crosshair"      as const, label: "Radar" },
  { key: "vendas",    icon: "bar-chart-2"    as const, label: "Vendas" },
  { key: "whatsapp",  icon: "message-circle" as const, label: "WhatsApp" },
  { key: "marketing", icon: "volume-2"       as const, label: "Marketing" },
  { key: "analise",   icon: "pie-chart"      as const, label: "Análise" },
  { key: "briefing",  icon: "clipboard"      as const, label: "Briefing" },
  { key: "rotas",     icon: "map-pin"        as const, label: "Rotas" },
];

const API_BASE = Platform.OS === "web" ? "" : `https://${process.env.EXPO_PUBLIC_DOMAIN ?? ""}`;

function nowTime() {
  return new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

// ─── Types ────────────────────────────────────────────────────────────────────
interface AttachedFile { uri: string; name: string; type: "image" | "doc" }
interface LeadCardData {
  name: string; address: string; phone: string;
  rating: number | null; totalRatings: number; cidade: string;
  segment?: string;
  analysis: { dor: string; angulo: string; pergunta: string };
}
interface AIMessage {
  id: string; text: string; sender: "user" | "jade"; time: string;
  isAudio?: boolean; audioDuration?: number; files?: AttachedFile[];
  leadData?: LeadCardData;
  leadsList?: LeadCardData[];
  crmSaved?: boolean;
}

interface CrmLeadLocal {
  id: string; nome: string; empresa: string; telefone: string;
  endereco: string; segmento: string; status: string;
  pipeline: string; dataAbordagem: string; cidade: string;
}

async function saveCrmLeadToStorage(ld: LeadCardData): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem("crm_leads");
    const existing: CrmLeadLocal[] = raw ? (JSON.parse(raw) as CrmLeadLocal[]) : [];
    const lead: CrmLeadLocal = {
      id: Date.now().toString(),
      nome:          ld.name,
      empresa:       ld.name,
      telefone:      ld.phone ?? "",
      endereco:      ld.address ?? "",
      segmento:      ld.segment ?? "",
      status:        "Primeiro Contato",
      pipeline:      "Novo",
      dataAbordagem: new Date().toISOString(),
      cidade:        ld.cidade ?? "",
    };
    await AsyncStorage.setItem("crm_leads", JSON.stringify([lead, ...existing].slice(0, 500)));
  } catch {}
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

function WaveformBars({ active }: { active: boolean }) {
  const anims = useRef([...Array(7)].map(() => new Animated.Value(0.3))).current;
  useEffect(() => {
    if (!active) { anims.forEach((a) => a.setValue(0.3)); return; }
    const loops = anims.map((a, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 55),
          Animated.timing(a, { toValue: 1,    duration: 220 + i * 35, useNativeDriver: true }),
          Animated.timing(a, { toValue: 0.12, duration: 220 + i * 35, useNativeDriver: true }),
        ])
      )
    );
    loops.forEach((l) => l.start());
    return () => { loops.forEach((l) => l.stop()); anims.forEach((a) => a.setValue(0.3)); };
  }, [active]);
  const HEIGHTS = [8, 14, 20, 26, 20, 14, 8];
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 3, height: 30 }}>
      {anims.map((anim, i) => (
        <Animated.View key={i} style={{ width: 3.5, height: HEIGHTS[i], borderRadius: 2, backgroundColor: PINK, transform: [{ scaleY: anim }] }} />
      ))}
    </View>
  );
}

// ─── Message bubble ───────────────────────────────────────────────────────────
function MessageBubble({
  msg, colors, onSendMsg, onNotify, onAddJadeMessage,
}: {
  msg: AIMessage;
  colors: ReturnType<typeof useColors>;
  onSendMsg?: (text: string) => void;
  onNotify?: (text: string) => void;
  onAddJadeMessage?: (text: string) => void;
}) {
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

  if (isJade && msg.leadData) {
    return <LeadCard msg={msg} colors={colors} onNotify={onNotify} onAddJadeMessage={onAddJadeMessage} />;
  }

  if (isJade && msg.leadsList && msg.leadsList.length > 0) {
    return <LeadListCard msg={msg} colors={colors} onNotify={onNotify} onAddJadeMessage={onAddJadeMessage} />;
  }

  if (isJade) {
    const lower = msg.text.toLowerCase();
    const quickReplies: Array<{ label: string; value: string }> = [];
    if (/quer mais.{0,6}5\b|mais 5 op/.test(lower)) {
      quickReplies.push(
        { label: "✅ Sim, mais 5", value: "sim, quero mais 5" },
        { label: "❌ Encerrar busca", value: "encerrar busca, obrigado" }
      );
    } else if (/quantos dias/.test(lower)) {
      quickReplies.push(
        { label: "1 dia", value: "1 dia" },
        { label: "3 dias", value: "3 dias" },
        { label: "7 dias", value: "7 dias" },
        { label: "15 dias", value: "15 dias" }
      );
    } else if (/abordo o pr.ximo|pr.ximo lead|pr.xima empresa|abordo o próximo/i.test(lower)) {
      quickReplies.push(
        { label: "✅ Sim, próximo lead", value: "próximo" },
        { label: "❌ Encerrar prospecção", value: "encerrar busca, obrigado" }
      );
    }
    return (
      <>
        <View style={C.msgJade}>
          {msg.files && msg.files.length > 0 && (
            <View style={{ gap: 5, marginBottom: 8 }}>
              {msg.files.map((f, i) => (
                <View key={i} style={[C.filePill, { backgroundColor: "rgba(255,255,255,0.06)" }]}>
                  <Feather name={f.type === "image" ? "image" : "file"} size={12} color={colors.mutedForeground} />
                  <Text style={{ fontSize: 11, color: colors.mutedForeground, fontFamily: "SpaceGrotesk_400Regular", flex: 1 }} numberOfLines={1}>{f.name}</Text>
                </View>
              ))}
            </View>
          )}
          {!!msg.text && <Text style={[C.jadeText, { color: colors.text }]}>{msg.text}</Text>}
          <Text style={[C.jadeTime, { color: colors.mutedForeground }]}>{msg.time}</Text>
        </View>
        {quickReplies.length > 0 && (
          quickReplies.length <= 3 ? (
            <View style={{ marginTop: 8, marginBottom: 2, gap: 6, paddingHorizontal: 16 }}>
              {quickReplies.map((r) => (
                <TouchableOpacity
                  key={r.value}
                  onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onSendMsg?.(r.value); }}
                  activeOpacity={0.8}
                  style={{ backgroundColor: "rgba(132,0,255,0.10)", borderRadius: 10, paddingVertical: 11, paddingHorizontal: 16, borderWidth: 1, borderColor: "rgba(132,0,255,0.28)" }}
                >
                  <Text style={{ color: "#B44FFF", fontSize: 13, fontFamily: "SpaceGrotesk_500Medium" }}>{r.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={{ marginTop: 6, marginBottom: 4 }}
              contentContainerStyle={{ gap: 6, paddingHorizontal: 16 }}
            >
              {quickReplies.map((r) => (
                <TouchableOpacity
                  key={r.value}
                  onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onSendMsg?.(r.value); }}
                  activeOpacity={0.8}
                  style={{ backgroundColor: "rgba(132,0,255,0.12)", borderRadius: 16, paddingVertical: 7, paddingHorizontal: 14, borderWidth: 1, borderColor: "rgba(132,0,255,0.35)" }}
                >
                  <Text style={{ color: "#B44FFF", fontSize: 12, fontFamily: "SpaceGrotesk_500Medium" }}>{r.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )
        )}
      </>
    );
  }

  return (
    <View style={[C.msgRow, C.msgRight]}>
      <View style={[C.bubble, C.bubbleUser, { backgroundColor: PINK }]}>
        {msg.files && msg.files.length > 0 && (
          <View style={{ gap: 5, marginBottom: 6 }}>
            {msg.files.map((f, i) => (
              <View key={i} style={[C.filePill, { backgroundColor: "rgba(0,0,0,0.15)" }]}>
                <Feather name={f.type === "image" ? "image" : "file"} size={12} color="rgba(255,255,255,0.8)" />
                <Text style={{ fontSize: 11, color: "rgba(255,255,255,0.9)", fontFamily: "SpaceGrotesk_400Regular", flex: 1 }} numberOfLines={1}>{f.name}</Text>
              </View>
            ))}
          </View>
        )}
        {!!msg.text && <Text style={[C.bubbleText, { color: "#fff" }]}>{msg.text}</Text>}
        <Text style={[C.bubbleTime, { color: "rgba(255,255,255,0.6)" }]}>{msg.time}</Text>
      </View>
    </View>
  );
}

// ─── Prospecting keyword detector ─────────────────────────────────────────────
function isProspectingMsg(text: string): boolean {
  const lower = text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  return /preciso\s+de\s+(leads?|clientes?|mais\s+clientes?|novos?\s+clientes?)|quero\s+(leads?|clientes?|prospectar)|busca\s+leads?|busca\s+empresas?|busca\s+no\s+radar|encontra\s+clientes?|acha\s+clientes?|quem\s+posso\s+abordar|novos?\s+leads?|mais\s+leads?|busca\s+mais|me\s+d[aá]\s+opções?|prospec[çc][aã]o|prospectar|radar/.test(lower)
    || (/\b(busca|encontra|acha|traz|procura|lista|mostra|manda)\b/.test(lower)
        && /\b(cliente|empresa|estabelecimento|negocio|clinica|restaurante|loja|dentista|contato|prospect|barbearia|salao|oficina|escola|academia|comercio|farmacia|hotel)\b/.test(lower));
}

// ─── Typing indicator (3 dots, no background) ─────────────────────────────────
function TypingBubble({ colors }: { colors: ReturnType<typeof useColors> }) {
  const d1 = useRef(new Animated.Value(0)).current;
  const d2 = useRef(new Animated.Value(0)).current;
  const d3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const pulse = (val: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(val, { toValue: 1, duration: 280, useNativeDriver: true }),
          Animated.timing(val, { toValue: 0, duration: 280, useNativeDriver: true }),
          Animated.delay(560),
        ])
      );
    const a1 = pulse(d1, 0);
    const a2 = pulse(d2, 180);
    const a3 = pulse(d3, 360);
    a1.start(); a2.start(); a3.start();
    return () => { a1.stop(); a2.stop(); a3.stop(); };
  }, []);

  const dotAnim = (val: Animated.Value) => ({
    opacity: val.interpolate({ inputRange: [0, 1], outputRange: [0.25, 1] }),
    transform: [{ translateY: val.interpolate({ inputRange: [0, 1], outputRange: [0, -4] }) }],
  });

  return (
    <View style={[C.msgJade, { paddingVertical: 14 }]}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
        {[d1, d2, d3].map((d, i) => (
          <Animated.View
            key={i}
            style={[{ width: 7, height: 7, borderRadius: 3.5, backgroundColor: colors.mutedForeground }, dotAnim(d)]}
          />
        ))}
      </View>
    </View>
  );
}

// ─── Lead card (expandable + WhatsApp + CRM) ──────────────────────────────────
function LeadCard({
  msg, colors, onNotify, onAddJadeMessage,
}: {
  msg: AIMessage;
  colors: ReturnType<typeof useColors>;
  onNotify?: (text: string) => void;
  onAddJadeMessage?: (text: string) => void;
}) {
  const [expanded,    setExpanded]   = useState(false);
  const [loadingWA,   setLoadingWA]  = useState(false);
  const [crmDone,     setCrmDone]    = useState(msg.crmSaved ?? false);
  const [crmLoading,  setCrmLoading] = useState(false);
  const [actionDone,  setActionDone] = useState(msg.crmSaved ?? false);
  const ld = msg.leadData!;

  // Reflect external crmSaved changes (auto-save from send())
  useEffect(() => { if (msg.crmSaved && !crmDone) setCrmDone(true); }, [msg.crmSaved]);

  const saveToCrm = async () => {
    if (crmDone || crmLoading) return;
    setCrmLoading(true);
    try {
      await fetch(`${API_BASE}/api/jade/crm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: ld.name, phone: ld.phone, address: ld.address,
          segment: ld.segment ?? "", city: ld.cidade,
        }),
      });
      await saveCrmLeadToStorage(ld);
      setCrmDone(true);
      onNotify?.(`✅ ${ld.name} registrado. Status: Primeiro Contato. Pipeline: Novo.`);
    } catch {
      onNotify?.("❌ Erro ao salvar no CRM. Tente novamente.");
    } finally {
      setCrmLoading(false);
    }
  };

  const handleJadeApproach = async () => {
    if (loadingWA || actionDone) return;
    setLoadingWA(true);
    try {
      const resp = await fetch(`${API_BASE}/api/jade/approach`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: ld.name, phone: ld.phone, address: ld.address,
          segment: ld.segment ?? "", city: ld.cidade, analysis: ld.analysis,
        }),
      });
      const data = (await resp.json()) as { whatsappUrl?: string | null; messageText?: string };
      if (data.whatsappUrl) await Linking.openURL(data.whatsappUrl);
      await saveToCrm().catch(() => {});
      setActionDone(true);
      const confirmText = data.whatsappUrl
        ? `✅ WhatsApp aberto com mensagem pronta. Lead registrado no CRM.\n\nAbordo o próximo?`
        : `✅ Lead registrado no CRM. (Sem telefone — copie a mensagem abaixo)\n\n"${data.messageText ?? ""}"\n\nAbordo o próximo?`;
      onAddJadeMessage?.(confirmText);
      onNotify?.(`📱 Abordagem enviada para ${ld.name}`);
    } catch {
      onNotify?.("❌ Erro ao gerar abordagem. Verifique a conexão.");
    } finally {
      setLoadingWA(false);
    }
  };

  const handleSelfApproach = async () => {
    if (loadingWA || actionDone) return;
    setLoadingWA(true);
    try {
      const resp = await fetch(`${API_BASE}/api/jade/approach`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: ld.name, phone: ld.phone, address: ld.address,
          segment: ld.segment ?? "", city: ld.cidade, analysis: ld.analysis,
        }),
      });
      const data = (await resp.json()) as { whatsappUrl?: string | null; messageText?: string };
      await saveToCrm().catch(() => {});
      setActionDone(true);
      const copyText = data.messageText ?? "Mensagem não disponível.";
      onAddJadeMessage?.(`📋 Mensagem pronta para copiar:\n\n"${copyText}"\n\nLead registrado no CRM. Abordo o próximo?`);
      onNotify?.(`💡 Mensagem gerada para ${ld.name}`);
    } catch {
      onNotify?.("❌ Erro ao gerar mensagem. Verifique a conexão.");
    } finally {
      setLoadingWA(false);
    }
  };

  return (
    <TouchableOpacity style={C.msgJade} onPress={() => setExpanded((v) => !v)} activeOpacity={0.85}>
      {!!msg.text && (
        <Text style={[C.jadeText, { color: colors.text }]}>{msg.text}</Text>
      )}
      {expanded && (
        <View style={{ marginTop: 14, borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.08)", paddingTop: 14, gap: 12 }}>
          <Text style={{ color: PINK, fontSize: 10, fontFamily: "SpaceGrotesk_700Bold", letterSpacing: 1.2 }}>
            ANÁLISE JADE
          </Text>
          <View style={{ gap: 3 }}>
            <Text style={{ color: "rgba(255,255,255,0.4)", fontSize: 10, fontFamily: "SpaceGrotesk_500Medium", letterSpacing: 0.6 }}>🎯 DOR PROVÁVEL</Text>
            <Text style={{ color: colors.text, fontSize: 13, fontFamily: "SpaceGrotesk_400Regular" }}>{ld.analysis.dor}</Text>
          </View>
          <View style={{ gap: 3 }}>
            <Text style={{ color: "rgba(255,255,255,0.4)", fontSize: 10, fontFamily: "SpaceGrotesk_500Medium", letterSpacing: 0.6 }}>💡 MELHOR ÂNGULO</Text>
            <Text style={{ color: colors.text, fontSize: 13, fontFamily: "SpaceGrotesk_400Regular" }}>{ld.analysis.angulo}</Text>
          </View>
          <View style={{ gap: 3 }}>
            <Text style={{ color: "rgba(255,255,255,0.4)", fontSize: 10, fontFamily: "SpaceGrotesk_500Medium", letterSpacing: 0.6 }}>💬 PERGUNTA DE ABERTURA</Text>
            <Text style={{ color: colors.text, fontSize: 13, fontFamily: "SpaceGrotesk_400Regular", fontStyle: "italic" }}>"{ld.analysis.pergunta}"</Text>
          </View>
          {ld.rating ? (
            <View style={{ gap: 3 }}>
              <Text style={{ color: "rgba(255,255,255,0.4)", fontSize: 10, fontFamily: "SpaceGrotesk_500Medium", letterSpacing: 0.6 }}>⭐ AVALIAÇÃO</Text>
              <Text style={{ color: colors.text, fontSize: 13, fontFamily: "SpaceGrotesk_400Regular" }}>{ld.rating} estrelas · {ld.totalRatings} avaliações</Text>
            </View>
          ) : null}
        </View>
      )}
      <Text style={[C.jadeTime, { color: colors.mutedForeground }]}>
        {msg.time}{"  "}
        <Text style={{ color: PINK, fontSize: 10 }}>{expanded ? "↑ fechar" : "↓ ver análise"}</Text>
      </Text>

      {/* ── Action card ── */}
      {!actionDone ? (
        <View style={{ marginTop: 12, borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.07)", paddingTop: 12 }}>
          <Text style={{ color: "rgba(255,255,255,0.32)", fontSize: 9, fontFamily: "SpaceGrotesk_600SemiBold", letterSpacing: 1.1, marginBottom: 8 }}>
            COMO QUER ABORDAR ESSE LEAD?
          </Text>
          <View style={{ gap: 7 }}>
            <TouchableOpacity
              onPress={(e) => { e.stopPropagation?.(); handleJadeApproach(); }}
              activeOpacity={0.8}
              disabled={loadingWA}
              style={{ backgroundColor: "#0A3D33", borderRadius: 10, paddingVertical: 11, paddingHorizontal: 14, alignItems: "center", borderWidth: 1, borderColor: "#128C7E", opacity: loadingWA ? 0.6 : 1 }}
            >
              <Text style={{ color: "#25D366", fontSize: 12, fontFamily: "SpaceGrotesk_600SemiBold" }}>
                {loadingWA ? "gerando…" : "🤖 JADE faz a abordagem"}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={(e) => { e.stopPropagation?.(); handleSelfApproach(); }}
              activeOpacity={0.8}
              disabled={loadingWA}
              style={{ backgroundColor: "rgba(132,0,255,0.10)", borderRadius: 10, paddingVertical: 11, paddingHorizontal: 14, alignItems: "center", borderWidth: 1, borderColor: "rgba(132,0,255,0.30)" }}
            >
              <Text style={{ color: "#B44FFF", fontSize: 12, fontFamily: "SpaceGrotesk_600SemiBold" }}>
                👤 Eu mesmo faço
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={{ marginTop: 10, flexDirection: "row", alignItems: "center", gap: 6 }}>
          <Text style={{ color: "#00AA44", fontSize: 11, fontFamily: "SpaceGrotesk_500Medium" }}>✅ Lead registrado no CRM</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

// ─── Lead list card (numbered names → tap to expand full card) ────────────────
function LeadListCard({
  msg, colors, onNotify, onAddJadeMessage,
}: {
  msg: AIMessage;
  colors: ReturnType<typeof useColors>;
  onNotify?: (text: string) => void;
  onAddJadeMessage?: (text: string) => void;
}) {
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const leads = msg.leadsList!;

  if (selectedIdx !== null) {
    const selected = leads[selectedIdx]!;
    const syntheticMsg: AIMessage = {
      id: `${msg.id}_${selectedIdx}`,
      text: "",
      sender: "jade",
      time: msg.time,
      leadData: selected,
      crmSaved: false,
    };
    return (
      <View>
        <TouchableOpacity
          onPress={() => setSelectedIdx(null)}
          activeOpacity={0.7}
          style={{ flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 16, paddingVertical: 8 }}
        >
          <Feather name="arrow-left" size={13} color={PINK} />
          <Text style={{ color: PINK, fontSize: 12, fontFamily: "SpaceGrotesk_500Medium" }}>voltar à lista</Text>
        </TouchableOpacity>
        <LeadCard msg={syntheticMsg} colors={colors} onNotify={onNotify} onAddJadeMessage={onAddJadeMessage} />
      </View>
    );
  }

  return (
    <View style={C.msgJade}>
      {!!msg.text && (
        <Text style={[C.jadeText, { color: colors.text, marginBottom: 10 }]}>{msg.text}</Text>
      )}
      <View style={{ gap: 6 }}>
        {leads.map((lead, i) => (
          <TouchableOpacity
            key={i}
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setSelectedIdx(i); }}
            activeOpacity={0.75}
            style={{
              flexDirection: "row", alignItems: "center", justifyContent: "space-between",
              backgroundColor: "rgba(255,0,128,0.06)", borderRadius: 10,
              paddingVertical: 11, paddingHorizontal: 14,
              borderWidth: 1, borderColor: "rgba(255,0,128,0.14)",
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10, flex: 1 }}>
              <Text style={{ color: "rgba(255,255,255,0.28)", fontSize: 11, fontFamily: "SpaceGrotesk_600SemiBold", width: 18 }}>
                {i + 1}.
              </Text>
              <Text style={{ color: colors.text, fontSize: 13, fontFamily: "SpaceGrotesk_500Medium", flex: 1 }} numberOfLines={1}>
                {lead.name}
              </Text>
            </View>
            <Feather name="chevron-right" size={14} color={PINK} />
          </TouchableOpacity>
        ))}
      </View>
      <Text style={[C.jadeTime, { color: colors.mutedForeground, marginTop: 8 }]}>{msg.time}</Text>
    </View>
  );
}

// ─── Leads bottom sheet ───────────────────────────────────────────────────────
function LeadsBottomSheet({
  leadsSheet, onClose, colors, onNotify, onAddJadeMessage,
}: {
  leadsSheet: { leads: LeadCardData[]; cidade: string } | null;
  onClose: () => void;
  colors: ReturnType<typeof useColors>;
  onNotify: (text: string) => void;
  onAddJadeMessage: (text: string) => void;
}) {
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);

  useEffect(() => {
    if (leadsSheet) setSelectedIdx(null);
  }, [leadsSheet]);

  if (!leadsSheet) return null;
  const { leads, cidade } = leadsSheet;

  const selected = selectedIdx !== null ? leads[selectedIdx] : null;
  const syntheticMsg: AIMessage | null = selected
    ? { id: `sheet_${selectedIdx}`, text: "", sender: "jade", time: nowTime(), leadData: selected, crmSaved: false }
    : null;
  const hasNext = selectedIdx !== null && selectedIdx < leads.length - 1;

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.72)" }}>
        <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onClose} activeOpacity={1} />

        <View style={{ backgroundColor: "#111118", borderTopLeftRadius: 22, borderTopRightRadius: 22, maxHeight: "88%", overflow: "hidden" }}>
          {/* ── Sheet header ── */}
          <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 18, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.06)" }}>
            {selectedIdx !== null ? (
              <TouchableOpacity onPress={() => setSelectedIdx(null)} activeOpacity={0.7} style={{ flexDirection: "row", alignItems: "center", gap: 5, marginRight: 10 }}>
                <Feather name="arrow-left" size={14} color={PINK} />
                <Text style={{ color: PINK, fontSize: 12, fontFamily: "SpaceGrotesk_500Medium" }}>lista</Text>
              </TouchableOpacity>
            ) : null}
            <View style={{ flex: 1 }}>
              <Text style={{ color: "#fff", fontSize: 14, fontFamily: "SpaceGrotesk_700Bold" }} numberOfLines={1}>
                {selectedIdx !== null && selected ? selected.name : `Leads em ${cidade}`}
              </Text>
              {selectedIdx === null && (
                <Text style={{ color: "rgba(255,255,255,0.35)", fontSize: 11, fontFamily: "SpaceGrotesk_400Regular", marginTop: 2 }}>
                  {leads.length} resultado{leads.length !== 1 ? "s" : ""} · toque para detalhes
                </Text>
              )}
              {selectedIdx !== null && (
                <Text style={{ color: "rgba(255,255,255,0.35)", fontSize: 11, fontFamily: "SpaceGrotesk_400Regular", marginTop: 2 }}>
                  {selectedIdx + 1} de {leads.length}
                </Text>
              )}
            </View>
            <TouchableOpacity onPress={onClose} activeOpacity={0.7} style={{ padding: 6 }}>
              <Feather name="x" size={18} color="rgba(255,255,255,0.45)" />
            </TouchableOpacity>
          </View>

          {/* ── Content ── */}
          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            {selectedIdx === null ? (
              <View style={{ paddingVertical: 12, paddingHorizontal: 16, gap: 8 }}>
                {leads.map((lead, i) => (
                  <TouchableOpacity
                    key={i}
                    onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setSelectedIdx(i); }}
                    activeOpacity={0.75}
                    style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: "rgba(255,0,128,0.06)", borderRadius: 12, paddingVertical: 13, paddingHorizontal: 14, borderWidth: 1, borderColor: "rgba(255,0,128,0.14)" }}
                  >
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 10, flex: 1 }}>
                      <Text style={{ color: "rgba(255,255,255,0.25)", fontSize: 11, fontFamily: "SpaceGrotesk_600SemiBold", width: 22 }}>{i + 1}.</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={{ color: "#fff", fontSize: 13, fontFamily: "SpaceGrotesk_600SemiBold" }} numberOfLines={1}>{lead.name}</Text>
                        {lead.segment ? (
                          <Text style={{ color: "rgba(255,255,255,0.35)", fontSize: 11, fontFamily: "SpaceGrotesk_400Regular", marginTop: 2 }} numberOfLines={1}>{lead.segment}</Text>
                        ) : null}
                      </View>
                    </View>
                    <Feather name="chevron-right" size={14} color={PINK} />
                  </TouchableOpacity>
                ))}
                <View style={{ height: 8 }} />
              </View>
            ) : syntheticMsg ? (
              <View>
                <LeadCard msg={syntheticMsg} colors={colors} onNotify={onNotify} onAddJadeMessage={onAddJadeMessage} />
                {hasNext && (
                  <TouchableOpacity
                    onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setSelectedIdx((selectedIdx ?? 0) + 1); }}
                    activeOpacity={0.8}
                    style={{ marginHorizontal: 16, marginTop: 4, marginBottom: 16, backgroundColor: "rgba(132,0,255,0.08)", borderRadius: 10, paddingVertical: 13, alignItems: "center", borderWidth: 1, borderColor: "rgba(132,0,255,0.22)" }}
                  >
                    <Text style={{ color: "#B44FFF", fontSize: 13, fontFamily: "SpaceGrotesk_600SemiBold" }}>➡️  Próximo lead</Text>
                  </TouchableOpacity>
                )}
                <View style={{ height: 16 }} />
              </View>
            ) : null}
          </ScrollView>
        </View>
      </View>
    </Modal>
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
      <Animated.View style={[C.recDot, { backgroundColor: cancelling ? "#FF0080" : PINK, transform: [{ scale }], opacity }]} />
      <Text style={[C.recTimer, { color: cancelling ? "#FF0080" : PINK }]}>{mm}:{ss}</Text>
      <Text style={[C.recHint, { color: cancelling ? "#FF0080" : "#7777AA" }]}>
        {cancelling ? "✕ Solte para cancelar" : "← Deslize para cancelar"}
      </Text>
      <AudioWave color={cancelling ? "#FF0080" : PINK} />
    </View>
  );
}

// ─── In-app notification banner ───────────────────────────────────────────────
function InAppNotification({ text, topOffset }: { text: string; topOffset: number }) {
  const fade = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    fade.setValue(0);
    Animated.sequence([
      Animated.timing(fade, { toValue: 1, duration: 240, useNativeDriver: true }),
      Animated.delay(3600),
      Animated.timing(fade, { toValue: 0, duration: 380, useNativeDriver: true }),
    ]).start();
  }, [text]);
  return (
    <Animated.View style={{
      opacity: fade,
      position: "absolute", top: topOffset, left: 16, right: 16, zIndex: 200,
      backgroundColor: "#120920", borderRadius: 12, padding: 14,
      borderWidth: 1, borderColor: "rgba(255,0,128,0.38)",
      flexDirection: "row", alignItems: "center", gap: 10,
      shadowColor: "#FF0080", shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.22, shadowRadius: 10, elevation: 8,
    }}>
      <Text style={{ fontSize: 15 }}>✅</Text>
      <Text style={{ color: "#fff", fontSize: 12, fontFamily: "SpaceGrotesk_500Medium", flex: 1, lineHeight: 18 }}>{text}</Text>
    </Animated.View>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────
function EmptyState({ displayName, colors }: { displayName: string; colors: ReturnType<typeof useColors> }) {
  const fadeIn = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(fadeIn, { toValue: 1, duration: 600, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
  }, []);
  return (
    <Animated.View style={{ flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 32, opacity: fadeIn }}>
      <Text style={{ color: "#fff", fontSize: 34, fontFamily: "SpaceGrotesk_700Bold", textAlign: "center", letterSpacing: -0.5 }}>
        {"Olá, "}{displayName.split(" ")[0]}.
      </Text>
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
  const { displayName, photoUri } = useProfile();
  const { canAccess } = usePlan();

  const topPad    = Platform.OS === "web" ? 24 : insets.top;
  const bottomPad = Platform.OS === "web" ? 20 : insets.bottom;

  const [messages,     setMessages]     = useState<AIMessage[]>([]);
  const [input,        setInput]        = useState("");
  const [loading,      setLoading]      = useState(false);
  const [sessionId,    setSessionId]    = useState<string | null>(null);
  const [handoffAlert, setHandoffAlert] = useState(false);
  const [attachments,   setAttachments]  = useState<AttachedFile[]>([]);
  const [notification,  setNotification] = useState<string | null>(null);
  const [companyConfig, setCompanyConfig] = useState<Record<string, unknown> | null>(null);
  const [historyChecked, setHistoryChecked] = useState(false);
  const [leadsSheet, setLeadsSheet] = useState<{ leads: LeadCardData[]; cidade: string } | null>(null);
  const notifTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const showNotification = useCallback((text: string) => {
    setNotification(null);
    requestAnimationFrame(() => {
      setNotification(text);
      if (notifTimer.current) clearTimeout(notifTimer.current);
      notifTimer.current = setTimeout(() => setNotification(null), 5500);
    });
  }, []);

  // ── Modules (right drawer toggles) ───────────────────────────────────────
  const [modules, setModules] = useState<Record<string, boolean>>({
    radar: false, vendas: false, whatsapp: false, marketing: false,
    analise: false, briefing: false, rotas: false,
  });
  const toggleModule = (key: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setModules((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // ── Left drawer + menu state ──────────────────────────────────────────────
  const [drawerOpen,     setDrawerOpen]     = useState(false);
  const drawerOpenRef = useRef(false);
  const [menuOpen,       setMenuOpen]       = useState(false);
  const [openAccordion,  setOpenAccordion]  = useState<string | null>(null);
  const drawerAnim  = useRef(new Animated.Value(-DRAWER_W)).current;
  const drawerBg    = useRef(new Animated.Value(0)).current;

  // ── Right drawer state ────────────────────────────────────────────────────
  const [rDrawerOpen, setRDrawerOpen] = useState(false);
  const rDrawerOpenRef = useRef(false);
  const rDrawerAnim = useRef(new Animated.Value(RDRAWER_W)).current;

  // ── Audio state ───────────────────────────────────────────────────────────
  const [recording,  setRecording]  = useState(false);
  const [recordSecs, setRecordSecs] = useState(0);
  const [cancelling, setCancelling] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const pulseAnim    = useRef(new Animated.Value(0)).current;
  const pulseLoop    = useRef<ReturnType<typeof Animated.loop> | null>(null);
  const recordTimer  = useRef<ReturnType<typeof setInterval> | null>(null);
  const cancelRef    = useRef(false);
  const secsRef      = useRef(0);
  const transcriptRef = useRef('');
  const speechRef    = useRef<any>(null);

  const handoffTimer    = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sessionCreating = useRef(false);

  // ── Initial greeting (once when displayName first loads) ──────────────────
  const greetingInjected = useRef(false);

  // Load empresa config → sent with every chat request
  useEffect(() => {
    AsyncStorage.getItem("minha_empresa").then((raw) => {
      if (raw) { try { setCompanyConfig(JSON.parse(raw)); } catch {} }
    });
  }, []);

  // Load chat history — must complete before greeting so greeting is skipped if history exists
  useEffect(() => {
    AsyncStorage.getItem("chat_historico").then((raw) => {
      if (raw) {
        try {
          const parsed = JSON.parse(raw) as AIMessage[];
          if (parsed.length > 0) {
            greetingInjected.current = true;
            setMessages(parsed);
          }
        } catch {}
      }
      setHistoryChecked(true);
    });
  }, []);

  // Persist chat history whenever messages change (keep last 100)
  useEffect(() => {
    if (messages.length === 0) return;
    AsyncStorage.setItem("chat_historico", JSON.stringify(messages.slice(0, 100))).catch(() => {});
  }, [messages]);

  // Inject greeting only after history check completes and no history was found
  useEffect(() => {
    if (!historyChecked || greetingInjected.current || !displayName) return;
    greetingInjected.current = true;
    const firstName = displayName.split(" ")[0] ?? "";
    setMessages([{
      id: "initial-greeting",
      text: firstName ? `${firstName}, pronta. Por onde começamos?` : "Pronta. Por onde começamos?",
      sender: "jade",
      time: nowTime(),
    }]);
  }, [historyChecked, displayName]);

  // ── Left drawer open / close ──────────────────────────────────────────────
  const openDrawer = () => {
    drawerOpenRef.current = true;
    setDrawerOpen(true);
    Animated.parallel([
      Animated.timing(drawerAnim, { toValue: 0,         duration: 290, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(drawerBg,   { toValue: 1,         duration: 290, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();
  };

  const closeDrawer = () => {
    Animated.parallel([
      Animated.timing(drawerAnim, { toValue: -DRAWER_W, duration: 240, easing: Easing.in(Easing.cubic), useNativeDriver: true }),
      Animated.timing(drawerBg,   { toValue: 0,         duration: 240, easing: Easing.in(Easing.cubic), useNativeDriver: true }),
    ]).start(() => { setDrawerOpen(false); drawerOpenRef.current = false; });
  };

  // ── Right drawer open / close ─────────────────────────────────────────────
  const openRDrawer = () => {
    rDrawerOpenRef.current = true;
    setRDrawerOpen(true);
    Animated.timing(rDrawerAnim, { toValue: 0, duration: 260, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
  };

  const closeRDrawer = () => {
    Animated.timing(rDrawerAnim, { toValue: RDRAWER_W, duration: 220, easing: Easing.in(Easing.cubic), useNativeDriver: true })
      .start(() => { setRDrawerOpen(false); rDrawerOpenRef.current = false; });
  };

  // ── Swipe left-edge → open left drawer ───────────────────────────────────
  const swipePan = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gs) =>
        !drawerOpenRef.current && !rDrawerOpenRef.current && gs.x0 < 32 && gs.dx > 14 && Math.abs(gs.dy) < Math.abs(gs.dx),
      onPanResponderRelease: (_, gs) => {
        if (!drawerOpenRef.current && gs.dx > 40) openDrawer();
      },
    })
  ).current;

  // ── Swipe left inside left drawer → close ────────────────────────────────
  const drawerPan = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gs) =>
        drawerOpenRef.current && gs.dx < -14 && Math.abs(gs.dy) < Math.abs(gs.dx),
      onPanResponderRelease: (_, gs) => {
        if (drawerOpenRef.current && gs.dx < -40) closeDrawer();
      },
    })
  ).current;

  // ── Right-edge swipe zone → open right drawer ────────────────────────────
  const rightEdgePan = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gs) =>
        !rDrawerOpenRef.current && !drawerOpenRef.current && gs.x0 > SCREEN_W - 28 && gs.dx < -12 && Math.abs(gs.dy) < Math.abs(gs.dx),
      onPanResponderRelease: (_, gs) => {
        if (!rDrawerOpenRef.current && gs.dx < -35) openRDrawer();
      },
    })
  ).current;

  // ── Swipe right inside right drawer → close ───────────────────────────────
  const rDrawerPan = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gs) =>
        rDrawerOpenRef.current && gs.dx > 12 && Math.abs(gs.dy) < Math.abs(gs.dx),
      onPanResponderRelease: (_, gs) => {
        if (rDrawerOpenRef.current && gs.dx > 35) closeRDrawer();
      },
    })
  ).current;

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

  // ── Mic recording (tap-based) ─────────────────────────────────────────────
  const startRecording = () => {
    if (loading || recording) return;
    secsRef.current = 0; transcriptRef.current = '';
    setRecording(true); setRecordSecs(0); setVoiceTranscript('');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    recordTimer.current = setInterval(() => { secsRef.current += 1; setRecordSecs(secsRef.current); }, 1000);
    // Web Speech API
    if (Platform.OS === 'web') {
      const SR = (typeof window !== 'undefined') ? ((window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition) : null;
      if (SR) {
        try {
          const recognition = new SR();
          recognition.lang = 'pt-BR'; recognition.continuous = true; recognition.interimResults = true;
          recognition.onresult = (e: any) => {
            const t = Array.from(e.results as any[]).map((r: any) => r[0].transcript).join('');
            transcriptRef.current = t; setVoiceTranscript(t);
          };
          recognition.start(); speechRef.current = recognition;
        } catch {}
      }
    }
  };

  const stopAndSend = () => {
    if (recordTimer.current) clearInterval(recordTimer.current);
    if (speechRef.current) { try { speechRef.current.stop(); } catch {} speechRef.current = null; }
    const duration = secsRef.current; const t = transcriptRef.current.trim();
    secsRef.current = 0; transcriptRef.current = '';
    setRecording(false); setRecordSecs(0); setVoiceTranscript('');
    if (t) { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); send(t); }
    else if (duration >= 1) { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); sendAudio(duration); }
  };

  const cancelRecording = () => {
    if (recordTimer.current) clearInterval(recordTimer.current);
    if (speechRef.current) { try { speechRef.current.stop(); } catch {} speechRef.current = null; }
    secsRef.current = 0; transcriptRef.current = '';
    setRecording(false); setRecordSecs(0); setVoiceTranscript('');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

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
      sender: "user", time: nowTime(), files,
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
        body: JSON.stringify({
          messages: buildHistory(updatedMsgs),
          session_id: sid,
          radar_on: modules.radar,
          user_name: displayName ?? "",
          company_config: companyConfig ?? undefined,
        }),
        signal: controller.signal,
      });
      clearTimeout(tid);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = (await response.json()) as {
        message?: string; response?: string; handoff?: boolean;
        leadData?: LeadCardData; leadsList?: LeadCardData[];
      };
      const raw = data.message?.trim() || data.response?.trim() || "Desculpe, não consegui processar. Tente novamente.";
      useCredit();
      const jadeId = (Date.now() + 1).toString();
      setMessages((prev) => [{
        id: jadeId,
        text: stripMarkdown(raw),
        sender: "jade",
        time: nowTime(),
        leadData: data.leadData,
        leadsList: data.leadsList,
        crmSaved: false,
      }, ...prev]);

      // Open bottom sheet for lead list
      if (data.leadsList && data.leadsList.length > 0) {
        setLeadsSheet({ leads: data.leadsList, cidade: data.leadsList[0]?.cidade ?? "" });
      }

      // Auto-save lead to CRM in background
      if (data.leadData) {
        const autoLead = data.leadData;
        fetch(`${API_BASE}/api/jade/crm`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: autoLead.name,
            phone: autoLead.phone,
            address: autoLead.address,
            segment: autoLead.segment ?? "",
            city: autoLead.cidade,
          }),
        })
          .then(() => saveCrmLeadToStorage(autoLead))
          .then(() => {
            setMessages((prev) => prev.map((m) => m.id === jadeId ? { ...m, crmSaved: true } : m));
            showNotification(`✅ ${autoLead.name} registrado. Status: Primeiro Contato. Pipeline: Novo.`);
          })
          .catch(() => {/* best-effort */});
      }

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
    } finally {
      setLoading(false);
    }
  };

  // ── Send audio ─────────────────────────────────────────────────────────────
  const sendAudio = async (duration: number) => {
    if (loading) return;
    const sid = await ensureSession();
    const audioMsg: AIMessage = { id: Date.now().toString(), text: `[Áudio de ${duration}s]`, sender: "user", time: nowTime(), isAudio: true, audioDuration: duration };
    const prevMessages = [...messages];
    const updatedMsgs = [audioMsg, ...prevMessages];
    setMessages(updatedMsgs);
    setLoading(true);
    const audioPrompt = `[voz ${duration}s] O usuário enviou um áudio. Considere que ele falou algo sobre vendas ou negócio e responda diretamente ao conteúdo, sem mencionar que era um áudio.`;
    const historyMsgs = buildHistory(prevMessages);
    const messagesForApi = [...historyMsgs, { role: "user", content: audioPrompt }];
    try {
      const controller = new AbortController();
      const tid = setTimeout(() => controller.abort(), 30000);
      const response = await fetch(`${API_BASE}/api/jade/chat`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: messagesForApi, session_id: sid, company_config: companyConfig ?? undefined }),
        signal: controller.signal,
      });
      clearTimeout(tid);
      if (!response.ok) throw new Error();
      const data = (await response.json()) as { message?: string; response?: string };
      const raw = data.message?.trim() || data.response?.trim() || "Me conta mais.";
      useCredit();
      setMessages((prev) => [{ id: (Date.now() + 1).toString(), text: stripMarkdown(raw), sender: "jade", time: nowTime() }, ...prev]);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {
      setMessages((prev) => [{ id: (Date.now() + 1).toString(), text: "Pode repetir? Não consegui processar.", sender: "jade", time: nowTime() }, ...prev]);
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
    if (Platform.OS === "web") { Alert.alert("Anexar", "Upload disponível apenas no app mobile."); return; }
    Alert.alert("Anexar arquivo", "Escolha o tipo:", [
      {
        text: "Imagem da galeria",
        onPress: async () => {
          const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
          if (status !== "granted") { Alert.alert("Permissão necessária", "Precisamos de acesso à sua galeria."); return; }
          const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], allowsMultipleSelection: true, quality: 0.85 });
          if (!result.canceled) {
            const newFiles: AttachedFile[] = result.assets.map((a) => ({ uri: a.uri, name: a.fileName ?? `imagem_${Date.now()}.jpg`, type: "image" as const }));
            setAttachments((prev) => [...prev, ...newFiles].slice(0, 5));
          }
        },
      },
      { text: "Cancelar", style: "cancel" },
    ]);
  };

  const removeAttachment = (idx: number) => setAttachments((prev) => prev.filter((_, i) => i !== idx));

  const resetConversation = () => {
    const firstName = (displayName ?? "").split(" ")[0] ?? "";
    const welcomeText = firstName ? `${firstName}, pronta. Por onde começamos?` : "Pronta. Por onde começamos?";
    setMessages([{ id: `greeting-${Date.now()}`, text: welcomeText, sender: "jade", time: nowTime() }]);
    setSessionId(null); setAttachments([]);
    sessionCreating.current = false;
  };

  const handleSend = () => send(input, attachments.length > 0 ? attachments : undefined);

  const renderData: AIMessage[] = loading
    ? [{ id: "__typing__", text: "", sender: "jade", time: "" }, ...messages]
    : messages;

  const hasConversation = messages.length > 0 || loading;
  const canSend = (input.trim().length > 0 || attachments.length > 0) && !loading && !recording;

  const handleContextItem = (label: string) => {
    setMenuOpen(false);
    if (label === "Limpar conversa") resetConversation();
  };

  const initials = displayName.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();

  // Navigate from drawer item
  const handleMenuNav = (item: MenuItem) => {
    if (item.action === "nova-conversa") {
      closeDrawer();
      resetConversation();
      return;
    }
    if (!item.route) return;
    closeDrawer();
    if (item.requiresPlan && !canAccess(item.requiresPlan)) {
      router.push("/plano" as any);
      return;
    }
    if (item.route === "/(tabs)/jade") return;
    router.push(item.route as any);
  };

  const toggleAccordion = (key: string) =>
    setOpenAccordion((prev) => (prev === key ? null : key));

  return (
    <View style={[C.container, { backgroundColor: colors.background }]} {...swipePan.panHandlers}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={0}
      >
        {/* ── Header ── */}
        <View style={[C.header, { paddingTop: topPad + 4 }]}>
          <TouchableOpacity style={C.headerRing} onPress={openDrawer} activeOpacity={0.6}>
            <Feather name="menu" size={17} color={colors.mutedForeground} />
          </TouchableOpacity>
          <View style={{ flex: 1 }} />
          <TouchableOpacity style={C.headerRing} onPress={openRDrawer} activeOpacity={0.6}>
            <Feather name="grid" size={16} color={colors.mutedForeground} />
          </TouchableOpacity>
          <TouchableOpacity style={[C.headerRing, { marginLeft: 4 }]} onPress={() => setMenuOpen((v) => !v)} activeOpacity={0.6}>
            <Feather name="more-vertical" size={17} color={colors.mutedForeground} />
          </TouchableOpacity>
        </View>

        {/* ── In-app notification ── */}
        {notification && <InAppNotification text={notification} topOffset={topPad + 64} />}

        {/* ── Chat / Empty state ── */}
        {!hasConversation ? (
          <EmptyState displayName={displayName} colors={colors} />
        ) : (
          <FlatList
            data={renderData}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => {
              if (item.id === "__typing__") return <TypingBubble colors={colors} />;
              return (
                <MessageBubble
                  msg={item}
                  colors={colors}
                  onSendMsg={(text) => send(text)}
                  onNotify={showNotification}
                  onAddJadeMessage={(text) => {
                    setMessages((prev) => [{
                      id: (Date.now() + 1).toString(),
                      text,
                      sender: "jade",
                      time: nowTime(),
                    }, ...prev]);
                  }}
                />
              );
            }}
            inverted
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 16 }}
            keyboardDismissMode="interactive"
            keyboardShouldPersistTaps="handled"
          />
        )}

        {/* ── Credits banner ── */}
        {warnLevel !== "ok" && (
          <TouchableOpacity
            style={[C.creditBanner, { backgroundColor: warnLevel === "empty" ? "rgba(255,255,255,0.5)" : "rgba(255,255,255,0.45)" }]}
            onPress={() => router.push("/loja" as any)} activeOpacity={0.9}
          >
            <Feather name={warnLevel === "empty" ? "x-circle" : "alert-triangle"} size={14} color="#fff" />
            <Text style={C.creditBannerText}>
              {warnLevel === "empty" ? "Créditos esgotados — toque para recarregar" : `Créditos acabando! ${remaining} restantes`}
            </Text>
          </TouchableOpacity>
        )}

        {/* ── Handoff banner ── */}
        {handoffAlert && (
          <TouchableOpacity style={C.handoffBanner} onPress={() => { setHandoffAlert(false); router.push("/leads" as any); }} activeOpacity={0.9}>
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
                  <Text style={{ fontSize: 11, color: colors.text, fontFamily: "SpaceGrotesk_400Regular", maxWidth: 90 }} numberOfLines={1}>{f.name}</Text>
                  <TouchableOpacity onPress={() => removeAttachment(i)} activeOpacity={0.7}>
                    <Feather name="x" size={13} color={colors.mutedForeground} />
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {/* ── Input bar ── */}
        <View style={[C.inputBar, { backgroundColor: colors.background, paddingBottom: bottomPad + 10 }]}>
          <View style={[C.inputCard, { backgroundColor: colors.surface, borderColor: recording ? PINK + "55" : colors.border }]}>
            {recording ? (
              /* ── Waveform recording row (replaces TextInput + actions) ── */
              <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 6, paddingVertical: 10, gap: 4 }}>
                {/* Cancel */}
                <TouchableOpacity onPress={cancelRecording} activeOpacity={0.7}
                  style={{ width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.06)" }}>
                  <Feather name="x" size={18} color="rgba(255,255,255,0.5)" />
                </TouchableOpacity>
                {/* Waveform + timer + live transcript */}
                <View style={{ flex: 1, flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 8 }}>
                  <WaveformBars active={recording} />
                  <Text style={{ color: PINK, fontSize: 12, fontFamily: "SpaceGrotesk_600SemiBold", minWidth: 36 }}>
                    {String(Math.floor(recordSecs / 60)).padStart(2, "0")}:{String(recordSecs % 60).padStart(2, "0")}
                  </Text>
                  {voiceTranscript ? (
                    <Text style={{ color: "rgba(255,255,255,0.45)", fontSize: 11, fontFamily: "SpaceGrotesk_400Regular", flex: 1 }} numberOfLines={2}>{voiceTranscript}</Text>
                  ) : (
                    <Text style={{ color: "rgba(255,255,255,0.2)", fontSize: 11, fontFamily: "SpaceGrotesk_400Regular" }}>gravando…</Text>
                  )}
                </View>
                {/* Send */}
                <TouchableOpacity onPress={stopAndSend} activeOpacity={0.7}
                  style={{ width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center", backgroundColor: "#00C853" }}>
                  <Feather name="check" size={18} color="#fff" />
                </TouchableOpacity>
              </View>
            ) : (
              <>
                {/* Text row */}
                <TextInput
                  style={[C.input, { color: colors.text, fontFamily: "SpaceGrotesk_400Regular" }]}
                  placeholder="Pergunte algo…"
                  placeholderTextColor={colors.mutedForeground + "66"}
                  value={input} onChangeText={setInput}
                  multiline maxLength={500}
                  autoFocus
                  onSubmitEditing={handleSend} returnKeyType="send"
                  editable={!loading}
                />
                {/* Action row */}
                <View style={C.inputActions}>
                  <TouchableOpacity onPress={pickAttachment} activeOpacity={0.6} style={C.actionBtn}>
                    <Feather name="plus" size={18} color={colors.mutedForeground} />
                  </TouchableOpacity>
                  <View style={{ flex: 1 }} />
                  <TouchableOpacity onPress={startRecording} activeOpacity={0.7} style={C.actionBtn} disabled={loading}>
                    <Feather name="mic" size={17} color={colors.mutedForeground} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[C.actionBtnSend, { backgroundColor: canSend ? PINK : "rgba(255,255,255,0.05)" }]}
                    onPress={handleSend} activeOpacity={0.8}
                    disabled={!canSend || warnLevel === "empty"}
                  >
                    <Feather name="send" size={16} color={canSend ? "#fff" : colors.mutedForeground + "40"} />
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>

      {/* ── Leads bottom sheet ── */}
      <LeadsBottomSheet
        leadsSheet={leadsSheet}
        onClose={() => setLeadsSheet(null)}
        colors={colors}
        onNotify={showNotification}
        onAddJadeMessage={(text) => setMessages((prev) => [{ id: Date.now().toString(), text, sender: "jade", time: nowTime() }, ...prev])}
      />

      {/* ── Drawer overlay ── */}
      {drawerOpen && (
        <Animated.View style={[StyleSheet.absoluteFill, { zIndex: 300 }]} pointerEvents="box-none">
          {/* Tap outside = close (below the panel — unreachable since full screen, but kept for safety) */}
          <TouchableOpacity style={StyleSheet.absoluteFill} onPress={closeDrawer} activeOpacity={1} />

          {/* Panel */}
          <Animated.View
            style={[C.drawer, { transform: [{ translateX: drawerAnim }], paddingTop: insets.top }]}
            pointerEvents="auto"
            {...drawerPan.panHandlers}
          >
            {/* ── Header ── */}
            <View style={C.drawerHeader}>
              <Text style={C.drawerTitle}>JADE</Text>
              <View style={{ flex: 1 }} />
              <View style={C.entBadge}>
                <Text style={C.entBadgeText}>Enterprise</Text>
              </View>
              <TouchableOpacity
                style={C.profileThumb}
                onPress={() => { closeDrawer(); router.push("/perfil" as any); }}
                activeOpacity={0.75}
              >
                {photoUri ? (
                  <Image source={{ uri: photoUri }} style={C.profileImg} />
                ) : (
                  <Text style={C.profileInitials}>{initials}</Text>
                )}
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
              {/* ── Accordion sections ── */}
              <View style={{ marginTop: 8 }}>
                {ACCORDION_SECTIONS.map((section) => (
                  <AccordionItem
                    key={section.key}
                    section={section}
                    isOpen={openAccordion === section.key}
                    onToggle={() => toggleAccordion(section.key)}
                    onItemPress={handleMenuNav}
                  />
                ))}
              </View>
            </ScrollView>

            {/* ── Footer ── */}
            <View style={[C.drawerFooter, { paddingBottom: insets.bottom + 16 }]}>
              <View style={C.footerSep} />
              <View style={C.footerRow}>
                <TouchableOpacity
                  style={C.footerIconBtn}
                  onPress={() => { closeDrawer(); router.push("/perfil" as any); }}
                  activeOpacity={0.65}
                >
                  <Feather name="settings" size={16} color="rgba(255,255,255,0.45)" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={C.footerIconBtn}
                  onPress={() => { closeDrawer(); router.push("/login" as any); }}
                  activeOpacity={0.65}
                >
                  <Feather name="log-out" size={16} color="rgba(255,255,255,0.28)" />
                </TouchableOpacity>
              </View>
            </View>
          </Animated.View>
        </Animated.View>
      )}

      {/* ── Right edge swipe zone ── */}
      <View
        style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: 22, zIndex: 50 }}
        {...rightEdgePan.panHandlers}
      />

      {/* ── Right drawer (AI Modules) — floating compact panel ── */}
      {rDrawerOpen && (
        <Animated.View style={[StyleSheet.absoluteFill, { zIndex: 400 }]} pointerEvents="box-none">
          {/* Dismiss tap outside */}
          <TouchableOpacity style={StyleSheet.absoluteFill} onPress={closeRDrawer} activeOpacity={1} />
          {/* Floating panel — wraps content, not full height */}
          <Animated.View
            style={[C.rDrawer, { top: topPad + 52, transform: [{ translateX: rDrawerAnim }] }]}
            pointerEvents="auto"
            {...rDrawerPan.panHandlers}
          >
            {/* Title */}
            <Text style={C.rDrawerTitle}>MÓDULOS IA</Text>
            {/* Module buttons */}
            {MODULES.map((mod) => {
              const active = modules[mod.key] ?? false;
              return (
                <TouchableOpacity
                  key={mod.key}
                  style={[C.modBtn, active && C.modBtnActive]}
                  onPress={() => toggleModule(mod.key)}
                  activeOpacity={0.75}
                >
                  <Feather
                    name={mod.icon}
                    size={20}
                    color={active ? "#fff" : "rgba(255,255,255,0.28)"}
                  />
                </TouchableOpacity>
              );
            })}
          </Animated.View>
        </Animated.View>
      )}

      {/* ── Context menu ── */}
      {menuOpen && (
        <>
          <TouchableOpacity style={[StyleSheet.absoluteFill, { zIndex: 200 }]} onPress={() => setMenuOpen(false)} activeOpacity={1} />
          <View style={[C.contextMenu, { backgroundColor: "#111", borderColor: "#222", top: topPad + 48, zIndex: 201 }]}>
            {CONTEXT_ITEMS.map((item, idx) => (
              <TouchableOpacity
                key={item.label}
                style={[C.contextItem, idx < CONTEXT_ITEMS.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "#222" }]}
                onPress={() => handleContextItem(item.label)} activeOpacity={0.7}
              >
                <Feather name={item.icon} size={15} color={"danger" in item && item.danger ? "rgba(255,255,255,0.5)" : "#666"} />
                <Text style={[C.contextLabel, { color: "danger" in item && item.danger ? "rgba(255,255,255,0.5)" : "#ddd" }]}>
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

  header:     { flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingBottom: 6 },
  headerRing: {
    width: 44, height: 44, borderRadius: 22,
    borderWidth: 1, borderColor: "rgba(255,255,255,0.09)",
    backgroundColor: "rgba(255,255,255,0.04)",
    alignItems: "center", justifyContent: "center",
  },

  msgJade:   { paddingHorizontal: 20, paddingVertical: 4, marginBottom: 20 },
  jadeText:  { fontSize: 17, fontFamily: "SpaceGrotesk_400Regular", lineHeight: 26 },
  jadeTime:  { fontSize: 12, fontFamily: "SpaceGrotesk_400Regular", marginTop: 6, opacity: 0.4 },

  msgRow:    { flexDirection: "row", marginBottom: 20, alignItems: "flex-end" },
  msgRight:  { justifyContent: "flex-end" },
  bubble:    { maxWidth: "80%", borderRadius: 18, padding: 14 },
  bubbleUser:{ borderBottomRightRadius: 4 },
  bubbleText:{ fontSize: 17, fontFamily: "SpaceGrotesk_400Regular", lineHeight: 25 },
  bubbleTime:{ fontSize: 12, fontFamily: "SpaceGrotesk_400Regular", marginTop: 4, textAlign: "right" },
  filePill:  { flexDirection: "row", alignItems: "center", gap: 5, padding: 5, borderRadius: 7 },

  recordBar: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 16, paddingVertical: 10, borderTopWidth: 1 },
  recDot:    { width: 10, height: 10, borderRadius: 5 },
  recTimer:  { fontSize: 14, fontFamily: "SpaceGrotesk_700Bold", minWidth: 36 },
  recHint:   { flex: 1, fontSize: 12, fontFamily: "SpaceGrotesk_400Regular" },

  attachStrip: { borderTopWidth: StyleSheet.hairlineWidth },
  attachChip:  { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, borderWidth: 1 },

  inputBar:     { paddingHorizontal: 14, paddingTop: 8 },
  inputCard:    {
    borderRadius: 20, borderWidth: 1,
    paddingHorizontal: 16, paddingTop: 14, paddingBottom: 10,
  },
  input:        { fontSize: 16, maxHeight: 120, lineHeight: 24, marginBottom: 10, minHeight: 26 },
  inputActions: { flexDirection: "row", alignItems: "center", gap: 8 },
  actionBtn:    {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.07)",
    alignItems: "center", justifyContent: "center",
  },
  actionBtnSend: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: "center", justifyContent: "center",
  },
  pillBtn:    { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  sendCircle: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },

  creditBanner:     { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 16, paddingVertical: 10 },
  creditBannerText: { color: "#fff", fontSize: 12, fontFamily: "SpaceGrotesk_600SemiBold", flex: 1 },
  handoffBanner:    { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: PINK, paddingHorizontal: 16, paddingVertical: 12 },
  handoffTitle:     { color: "#fff", fontSize: 13, fontFamily: "SpaceGrotesk_700Bold" },
  handoffSub:       { color: "rgba(255,255,255,0.85)", fontSize: 11, fontFamily: "SpaceGrotesk_400Regular", marginTop: 1 },

  // ── Drawer ──
  drawer: {
    position: "absolute", left: 0, top: 0, bottom: 0,
    width: DRAWER_W, backgroundColor: BG,
    flexDirection: "column",
  },
  drawerHeader: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 24, paddingTop: 20, paddingBottom: 20,
  },
  drawerTitle: {
    fontSize: 24, fontFamily: "SpaceGrotesk_700Bold", color: "#fff", letterSpacing: -0.5,
  },
  entBadge: {
    borderWidth: 1, borderColor: "rgba(255,255,255,0.06)",
    borderRadius: 4, paddingHorizontal: 5, paddingVertical: 1,
    marginRight: 10, backgroundColor: "rgba(255,255,255,0.01)",
  },
  entBadgeText: {
    fontSize: 7, fontFamily: "SpaceGrotesk_400Regular",
    color: "rgba(255,255,255,0.18)", letterSpacing: 0.4,
  },
  profileThumb: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: "#181818",
    alignItems: "center", justifyContent: "center", overflow: "hidden",
  },
  profileImg:      { width: 42, height: 42, borderRadius: 21 },
  profileInitials: { fontSize: 15, fontFamily: "SpaceGrotesk_600SemiBold", color: "rgba(255,255,255,0.45)" },

  newConvoBtn: {
    flexDirection: "row", alignItems: "center", gap: 10,
    marginHorizontal: 20, paddingHorizontal: 16, paddingVertical: 11,
    borderRadius: 9, borderWidth: 1, borderColor: "rgba(255,255,255,0.07)",
    backgroundColor: "rgba(255,255,255,0.03)",
  },
  newConvoText: { fontSize: 15, fontFamily: "SpaceGrotesk_500Medium", color: "rgba(255,255,255,0.55)" },

  section:      { paddingHorizontal: 24, marginTop: 20 },
  sectionLabel: {
    fontSize: 11, fontFamily: "SpaceGrotesk_600SemiBold", color: "#2E2E2E",
    letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 8,
  },
  sep: { height: StyleSheet.hairlineWidth, backgroundColor: "#161616", marginTop: 20, marginHorizontal: 24 },

  // ── Accordion ──
  accordionWrap:      { },
  accordionHeader:    {
    flexDirection: "row", alignItems: "center", gap: 10,
    paddingHorizontal: 24, paddingVertical: 14,
  },
  accordionTitle:     {
    flex: 1, fontSize: 13, fontFamily: "SpaceGrotesk_600SemiBold",
    color: "rgba(255,255,255,0.28)", letterSpacing: 0.4, textTransform: "uppercase",
  },
  accordionTitleOpen: { color: "rgba(255,255,255,0.75)" },
  accordionSep:       { height: StyleSheet.hairlineWidth, backgroundColor: "#0F0F1A", marginHorizontal: 24 },
  accordionItemRow:   {
    height: ITEM_H, flexDirection: "row", alignItems: "center",
    paddingHorizontal: 40,
  },
  accordionItemText:  { flex: 1, fontSize: 15, fontFamily: "SpaceGrotesk_400Regular", color: "rgba(255,255,255,0.42)" },
  accordionItemNew:   { color: PINK, fontFamily: "SpaceGrotesk_500Medium" },

  activeDot: { fontSize: 8, color: PINK, marginRight: 2 },

  // ── Footer ──
  drawerFooter: { paddingHorizontal: 20 },
  footerSep:    { height: StyleSheet.hairlineWidth, backgroundColor: "#161616", marginBottom: 12 },
  footerRow: {
    flexDirection: "row", alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 4,
  },
  footerIconBtn: {
    width: 38, height: 38, borderRadius: 19,
    borderWidth: 1, borderColor: "rgba(255,255,255,0.07)",
    backgroundColor: "rgba(255,255,255,0.03)",
    alignItems: "center", justifyContent: "center",
  },

  // ── Context menu ──
  contextMenu: {
    position: "absolute", right: 12, borderRadius: 12, borderWidth: 1,
    minWidth: 210, overflow: "hidden",
    shadowColor: "#000", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.5, shadowRadius: 20, elevation: 20,
  },
  contextItem:  { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 13 },
  contextLabel: { fontSize: 13, fontFamily: "SpaceGrotesk_400Regular" },

  // ── Right drawer (AI Modules) — compact floating panel ──
  rDrawer: {
    position: "absolute",
    right: 0,
    // top is set inline (topPad + 52)
    width: RDRAWER_W,
    backgroundColor: "rgba(14,12,22,0.95)",
    borderTopLeftRadius: 14,
    borderBottomLeftRadius: 14,
    paddingTop: 10,
    paddingBottom: 12,
    paddingHorizontal: 8,
    alignItems: "center",
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: -6, height: 4 },
    shadowOpacity: 0.55,
    shadowRadius: 18,
    elevation: 24,
  },
  rDrawerTitle: {
    fontSize: 8,
    fontFamily: "SpaceGrotesk_600SemiBold",
    color: "rgba(255,255,255,0.35)",
    letterSpacing: 1.0,
    textAlign: "center",
    marginBottom: 4,
  },
  modBtn: {
    width: 50,
    height: 50,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  modBtnActive: {
    backgroundColor: "rgba(255,255,255,0.13)",
    shadowColor: "#fff",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
  },
});
