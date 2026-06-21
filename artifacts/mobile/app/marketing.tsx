import React, { useRef, useState } from "react";
import {
  Animated,
  Easing,
  Linking,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";

const PINK   = "#FF0080";
const PURPLE = "#8400FF";
const GREEN  = "#00D68F";
const YELLOW = "#FFB300";
const BG     = "#0B0814";

type TabId = "campanhas" | "criativos" | "agenda" | "relatorios";
type AutoLevel = "assistido" | "semi" | "automatico";
type FiltCamp = "todas" | "ativas" | "pausadas" | "revisao";
type FiltCriat = "todos" | "video" | "imagem" | "carrossel";

// ─── Mock data ─────────────────────────────────────────────────────────────────
interface Campaign {
  id: string;
  name: string;
  platform: "Meta Ads" | "Google Ads";
  tipo: string;
  status: "ativa" | "pausada" | "revisao";
  investido: number;
  limite: number;
  leads: number;
  cpl: number;
  roas: number;
}

interface Creative {
  id: string;
  name: string;
  type: "video" | "imagem" | "carrossel";
  performance: "top" | "medio" | "baixo";
  campaign: string;
  impressions: string;
}

const CAMPAIGNS: Campaign[] = [
  { id: "1", name: "Delivery Verão", platform: "Meta Ads",   tipo: "Conversão",  status: "ativa",   investido: 320, limite: 500,  leads: 18, cpl: 17.8, roas: 3.2 },
  { id: "2", name: "Brand Awareness", platform: "Google Ads", tipo: "Alcance",    status: "ativa",   investido: 195, limite: 300,  leads: 9,  cpl: 21.7, roas: 2.1 },
  { id: "3", name: "Remarketing Q2",  platform: "Meta Ads",   tipo: "Remarketing",status: "pausada", investido: 95,  limite: 200,  leads: 5,  cpl: 19.0, roas: 1.8 },
  { id: "4", name: "Promoção Junho",  platform: "Meta Ads",   tipo: "Conversão",  status: "revisao", investido: 0,   limite: 400,  leads: 0,  cpl: 0,    roas: 0   },
];

const CREATIVES: Creative[] = [
  { id: "1", name: "Vídeo hambúrguer", type: "video",    performance: "top",   campaign: "Delivery Verão",  impressions: "12.4k" },
  { id: "2", name: "Card promoção",    type: "imagem",   performance: "top",   campaign: "Delivery Verão",  impressions: "9.8k"  },
  { id: "3", name: "Carrossel menu",   type: "carrossel",performance: "medio", campaign: "Brand Awareness", impressions: "7.2k"  },
  { id: "4", name: "Story oferta",     type: "imagem",   performance: "medio", campaign: "Delivery Verão",  impressions: "5.1k"  },
  { id: "5", name: "Reels bastidores", type: "video",    performance: "baixo", campaign: "Brand Awareness", impressions: "3.3k"  },
  { id: "6", name: "Card produto",     type: "imagem",   performance: "baixo", campaign: "Remarketing Q2",  impressions: "2.8k"  },
];

const DIAS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
const LEADS_DIA = [4, 7, 5, 9, 12, 6, 3];
const BEST_DAY = 4; // Sexta

const AUTO_FEED = [
  { dot: GREEN,  text: "Campanha 'Delivery Verão' aumentou em R$20/dia — CTR subiu 18%" },
  { dot: PINK,   text: "Novo criativo 'Card promoção' ativado automaticamente" },
  { dot: PURPLE, text: "Orçamento redistribuído: Meta +15%, Google -15%" },
  { dot: GREEN,  text: "5 leads convertidos via campanha de remarketing" },
  { dot: "#FFB300", text: "Alerta: CPL acima da meta em 'Brand Awareness'" },
];

// ─── Helpers ───────────────────────────────────────────────────────────────────
function StatusPill({ status }: { status: Campaign["status"] }) {
  const map = {
    ativa:   { label: "Ativa",      bg: GREEN  + "22", fg: GREEN  },
    pausada: { label: "Pausada",    bg: YELLOW + "22", fg: YELLOW },
    revisao: { label: "Em revisão", bg: PINK   + "22", fg: PINK   },
  };
  const c = map[status];
  return (
    <View style={[T.pill, { backgroundColor: c.bg }]}>
      <Text style={[T.pillText, { color: c.fg }]}>{c.label}</Text>
    </View>
  );
}

function PerfBadge({ p }: { p: Creative["performance"] }) {
  const map = {
    top:   { label: "Acima da média", bg: GREEN  + "22", fg: GREEN  },
    medio: { label: "Médio",          bg: YELLOW + "22", fg: YELLOW },
    baixo: { label: "Abaixo",         bg: "#FF3B5C22",   fg: "#FF3B5C" },
  };
  const c = map[p];
  return (
    <View style={[T.pill, { backgroundColor: c.bg }]}>
      <Text style={[T.pillText, { color: c.fg }]}>{c.label}</Text>
    </View>
  );
}

function typeIcon(type: Creative["type"]) {
  if (type === "video")    return <Feather name="video"  size={16} color={PINK} />;
  if (type === "carrossel") return <Feather name="layers" size={16} color={PURPLE} />;
  return <Feather name="image" size={16} color={YELLOW} />;
}

// ─── TABS ──────────────────────────────────────────────────────────────────────
function CampanhasTab({ colors }: { colors: any }) {
  const [filtro, setFiltro] = useState<FiltCamp>("todas");
  const [novaCampModal, setNovaCampModal] = useState(false);
  const [selectedObj, setSelectedObj] = useState<string | null>(null);

  const filtered = CAMPAIGNS.filter((c) => {
    if (filtro === "todas") return true;
    if (filtro === "ativas")  return c.status === "ativa";
    if (filtro === "pausadas") return c.status === "pausada";
    return c.status === "revisao";
  });

  const OBJETIVOS = [
    { id: "conversao",    emoji: "💰", title: "Quero vender agora",           sub: "Campanha de conversão",  color: GREEN  },
    { id: "alcance",      emoji: "📢", title: "Quero aparecer mais",          sub: "Campanha de alcance",    color: PURPLE },
    { id: "remarketing",  emoji: "🔄", title: "Quero recuperar quem sumiu",   sub: "Campanha de remarketing", color: YELLOW },
  ];

  return (
    <View>
      {/* Filtros */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={T.filterRow}>
        {(["todas","ativas","pausadas","revisao"] as FiltCamp[]).map((f) => (
          <TouchableOpacity
            key={f}
            style={[T.filterPill, filtro === f && { backgroundColor: PINK, borderColor: PINK }]}
            onPress={() => setFiltro(f)}
            activeOpacity={0.8}
          >
            <Text style={[T.filterText, { color: filtro === f ? "#fff" : colors.mutedForeground }]}>
              {f === "todas" ? "Todas" : f === "ativas" ? "Ativas" : f === "pausadas" ? "Pausadas" : "Em revisão"}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Campaign cards */}
      <View style={{ gap: 12, paddingHorizontal: 16 }}>
        {filtered.map((camp) => (
          <View key={camp.id} style={[T.campCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={T.campCardHead}>
              <View style={{ flex: 1 }}>
                <Text style={[T.campName, { color: colors.text }]}>{camp.name}</Text>
                <View style={{ flexDirection: "row", gap: 8, marginTop: 4, alignItems: "center" }}>
                  <View style={[T.platformBadge, { backgroundColor: camp.platform === "Meta Ads" ? "#1877F222" : "#4285F422" }]}>
                    <Text style={[T.platformText, { color: camp.platform === "Meta Ads" ? "#1877F2" : "#4285F4" }]}>
                      {camp.platform}
                    </Text>
                  </View>
                  <Text style={[T.tipoText, { color: colors.mutedForeground }]}>{camp.tipo}</Text>
                </View>
              </View>
              <StatusPill status={camp.status} />
            </View>

            {camp.status !== "revisao" && (
              <>
                <View style={T.statsGrid}>
                  <View style={T.statItem}>
                    <Text style={[T.statLabel, { color: colors.mutedForeground }]}>Investido</Text>
                    <Text style={[T.statVal, { color: colors.text }]}>R${camp.investido}</Text>
                  </View>
                  <View style={T.statItem}>
                    <Text style={[T.statLabel, { color: colors.mutedForeground }]}>Leads</Text>
                    <Text style={[T.statVal, { color: colors.text }]}>{camp.leads}</Text>
                  </View>
                  <View style={T.statItem}>
                    <Text style={[T.statLabel, { color: colors.mutedForeground }]}>CPL</Text>
                    <Text style={[T.statVal, { color: colors.text }]}>R${camp.cpl.toFixed(0)}</Text>
                  </View>
                  <View style={T.statItem}>
                    <Text style={[T.statLabel, { color: colors.mutedForeground }]}>ROAS</Text>
                    <Text style={[T.statVal, { color: colors.text }]}>{camp.roas}x</Text>
                  </View>
                </View>
                <View style={T.budgetRow}>
                  <View style={[T.budgetBar, { backgroundColor: colors.surface }]}>
                    <View style={[T.budgetFill, { width: `${Math.round((camp.investido / camp.limite) * 100)}%` as any, backgroundColor: PINK }]} />
                  </View>
                  <Text style={[T.budgetLabel, { color: colors.mutedForeground }]}>
                    R${camp.investido} / R${camp.limite}
                  </Text>
                </View>
              </>
            )}

            {camp.status === "revisao" && (
              <View style={[T.revisaoNote, { backgroundColor: PINK + "11" }]}>
                <Feather name="clock" size={13} color={PINK} />
                <Text style={[T.revisaoText, { color: PINK }]}>Em revisão pela equipe de anúncios</Text>
              </View>
            )}
          </View>
        ))}
      </View>

      {/* Nova campanha FAB */}
      <TouchableOpacity
        style={T.fab}
        onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); setNovaCampModal(true); }}
        activeOpacity={0.85}
      >
        <Feather name="plus" size={20} color="#fff" />
        <Text style={T.fabText}>Nova campanha</Text>
      </TouchableOpacity>

      {/* Objetivo modal */}
      <Modal visible={novaCampModal} transparent animationType="slide" onRequestClose={() => setNovaCampModal(false)}>
        <TouchableOpacity style={T.overlay} activeOpacity={1} onPress={() => setNovaCampModal(false)}>
          <View style={[T.sheet, { backgroundColor: colors.card }]} onStartShouldSetResponder={() => true}>
            <View style={T.sheetHandle} />
            <Text style={[T.sheetTitle, { color: colors.text }]}>Qual o objetivo da campanha?</Text>
            <Text style={[T.sheetSub, { color: colors.mutedForeground }]}>
              A JADE vai criar e otimizar a campanha automaticamente
            </Text>
            <View style={{ gap: 12, marginTop: 8 }}>
              {OBJETIVOS.map((obj) => (
                <TouchableOpacity
                  key={obj.id}
                  style={[T.objCard, {
                    backgroundColor: selectedObj === obj.id ? obj.color + "18" : colors.surface,
                    borderColor: selectedObj === obj.id ? obj.color : colors.border,
                    borderWidth: selectedObj === obj.id ? 1.5 : 1,
                  }]}
                  onPress={() => { Haptics.selectionAsync(); setSelectedObj(obj.id); }}
                  activeOpacity={0.85}
                >
                  <Text style={T.objEmoji}>{obj.emoji}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={[T.objTitle, { color: colors.text }]}>{obj.title}</Text>
                    <Text style={[T.objSub, { color: colors.mutedForeground }]}>{obj.sub}</Text>
                  </View>
                  {selectedObj === obj.id && <Feather name="check-circle" size={20} color={obj.color} />}
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity
              style={[T.sheetBtn, { opacity: selectedObj ? 1 : 0.5 }]}
              onPress={() => { if (selectedObj) { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); setNovaCampModal(false); setSelectedObj(null); }}}
              activeOpacity={0.85}
              disabled={!selectedObj}
            >
              <Feather name="zap" size={18} color="#fff" />
              <Text style={T.sheetBtnText}>Criar com JADE</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

function CriativosTab({ colors }: { colors: any }) {
  const [filtro, setFiltro] = useState<FiltCriat>("todos");

  const top = CREATIVES.filter((c) => c.performance === "top");
  const filtered = CREATIVES.filter((c) =>
    filtro === "todos" ? true : c.type === filtro
  );

  return (
    <View>
      {/* Filtros */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={T.filterRow}>
        {(["todos","video","imagem","carrossel"] as FiltCriat[]).map((f) => (
          <TouchableOpacity
            key={f}
            style={[T.filterPill, filtro === f && { backgroundColor: PINK, borderColor: PINK }]}
            onPress={() => setFiltro(f)}
            activeOpacity={0.8}
          >
            <Text style={[T.filterText, { color: filtro === f ? "#fff" : colors.mutedForeground }]}>
              {f === "todos" ? "Todos" : f === "video" ? "Vídeo" : f === "imagem" ? "Imagem" : "Carrossel"}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={{ paddingHorizontal: 16, gap: 16 }}>
        {/* Melhores performers */}
        {filtro === "todos" && (
          <View>
            <Text style={[T.sectionLabel, { color: colors.text }]}>⭐ Melhores performers</Text>
            <View style={T.topGrid}>
              {top.map((c) => (
                <View key={c.id} style={[T.topCard, { backgroundColor: colors.card, borderColor: GREEN + "44" }]}>
                  <View style={[T.topIcon, { backgroundColor: PINK + "22" }]}>{typeIcon(c.type)}</View>
                  <Text style={[T.topName, { color: colors.text }]} numberOfLines={1}>{c.name}</Text>
                  <Text style={[T.topImpr, { color: colors.mutedForeground }]}>{c.impressions} impressões</Text>
                  <PerfBadge p={c.performance} />
                </View>
              ))}
            </View>
          </View>
        )}

        {/* JADE sugere */}
        <View style={[T.jadeSuggestion, { backgroundColor: PURPLE + "18", borderColor: PURPLE + "44" }]}>
          <MaterialCommunityIcons name="robot" size={18} color={PURPLE} />
          <Text style={[T.jadeSuggText, { color: "#CCAAFF" }]}>
            <Text style={{ fontFamily: "SpaceGrotesk_700Bold" }}>JADE sugere:</Text> pausar "Reels bastidores" e duplicar "Card promoção" com novo público
          </Text>
        </View>

        {/* Grid geral */}
        <Text style={[T.sectionLabel, { color: colors.text }]}>Todos os criativos</Text>
        <View style={T.criatGrid}>
          {/* + Novo criativo card */}
          <TouchableOpacity
            style={[T.novoCriatCard, { borderColor: PINK + "60" }]}
            onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)}
            activeOpacity={0.8}
          >
            <Feather name="plus-circle" size={28} color={PINK} />
            <Text style={[T.novoCriatText, { color: PINK }]}>Novo criativo</Text>
          </TouchableOpacity>

          {filtered.map((c) => (
            <TouchableOpacity
              key={c.id}
              style={[T.criatCard, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => Haptics.selectionAsync()}
              activeOpacity={0.85}
            >
              <View style={[T.criatIcon, { backgroundColor: colors.surface }]}>{typeIcon(c.type)}</View>
              <Text style={[T.criatName, { color: colors.text }]} numberOfLines={2}>{c.name}</Text>
              <Text style={[T.criatCamp, { color: colors.mutedForeground }]} numberOfLines={1}>{c.campaign}</Text>
              <PerfBadge p={c.performance} />
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );
}

function RelatoriosTab({ colors }: { colors: any }) {
  const maxLeads = Math.max(...LEADS_DIA);

  const METRICS = [
    { label: "Total Investido", value: "R$610",   change: "+12%",  up: true  },
    { label: "Leads",           value: "29",       change: "+31%",  up: true  },
    { label: "CPL",             value: "R$21",     change: "-8%",   up: false },
    { label: "ROAS",            value: "2.7x",     change: "+5%",   up: true  },
    { label: "CTR",             value: "3.4%",     change: "+0.8%", up: true  },
    { label: "Conversões",      value: "12",       change: "+25%",  up: true  },
  ];

  const TOP_CRIAT = [
    { pos: 1, color: GREEN,  name: "Vídeo hambúrguer", result: "12 leads" },
    { pos: 2, color: PINK,   name: "Card promoção",    result: "8 leads"  },
    { pos: 3, color: PURPLE, name: "Story oferta",     result: "5 leads"  },
  ];

  return (
    <View style={{ paddingHorizontal: 16, gap: 16 }}>
      {/* Hero resumo */}
      <View style={[T.heroCard, { backgroundColor: "#3D0020" }]}>
        <View style={[T.heroBadge, { backgroundColor: PINK + "33" }]}>
          <MaterialCommunityIcons name="robot" size={14} color={PINK} />
          <Text style={[T.heroBadgeText, { color: PINK }]}>Resumo da JADE</Text>
        </View>
        <Text style={[T.heroText, { color: "#fff" }]}>
          Você investiu{" "}
          <Text style={{ fontFamily: "SpaceGrotesk_700Bold", color: PINK }}>R$610</Text>
          {" "}e gerou{" "}
          <Text style={{ fontFamily: "SpaceGrotesk_700Bold" }}>29 leads</Text>
          {" "}este mês. Seu CPL caiu 8% e o criativo "Vídeo hambúrguer" está dominando o feed. Quinta-feira é seu melhor dia — considere aumentar o orçamento nesse dia.
        </Text>
      </View>

      {/* Métricas 2x3 */}
      <View style={T.metricsGrid}>
        {METRICS.map((m, i) => (
          <View key={i} style={[T.metCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[T.metValue, { color: colors.text }]}>{m.value}</Text>
            <Text style={[T.metLabel, { color: colors.mutedForeground }]}>{m.label}</Text>
            <View style={[T.metChange, { backgroundColor: m.up ? GREEN + "22" : "#FF3B5C22" }]}>
              <Feather name={m.up ? "trending-up" : "trending-down"} size={10} color={m.up ? GREEN : "#FF3B5C"} />
              <Text style={[T.metChangeText, { color: m.up ? GREEN : "#FF3B5C" }]}>{m.change}</Text>
            </View>
          </View>
        ))}
      </View>

      {/* Gráfico de barras leads/dia */}
      <View style={[T.chartCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[T.chartTitle, { color: colors.text }]}>Leads por dia da semana</Text>
        <View style={T.chartBars}>
          {LEADS_DIA.map((v, i) => (
            <View key={i} style={T.barCol}>
              <Text style={[T.barValue, { color: i === BEST_DAY ? PINK : colors.mutedForeground }]}>{v}</Text>
              <View style={T.barTrack}>
                <View style={[T.barFill, {
                  height: `${Math.round((v / maxLeads) * 100)}%` as any,
                  backgroundColor: i === BEST_DAY ? PINK : colors.surface,
                  borderWidth: i === BEST_DAY ? 0 : 1,
                  borderColor: colors.border,
                }]} />
              </View>
              <Text style={[T.barDay, { color: i === BEST_DAY ? PINK : colors.mutedForeground }]}>{DIAS[i]}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Top criativos */}
      <View style={[T.rankCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[T.rankTitle, { color: colors.text }]}>🏆 Top criativos do mês</Text>
        {TOP_CRIAT.map((item) => (
          <View key={item.pos} style={T.rankRow}>
            <View style={[T.rankNum, { backgroundColor: item.color + "22" }]}>
              <Text style={[T.rankNumText, { color: item.color }]}>#{item.pos}</Text>
            </View>
            <View style={[T.rankDot, { backgroundColor: item.color }]} />
            <Text style={[T.rankName, { color: colors.text }]} numberOfLines={1}>{item.name}</Text>
            <Text style={[T.rankResult, { color: item.color }]}>{item.result}</Text>
          </View>
        ))}
      </View>

      {/* Export button */}
      <TouchableOpacity style={T.exportBtn} onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)} activeOpacity={0.85}>
        <Feather name="file-text" size={18} color="#fff" />
        <Text style={T.exportBtnText}>Exportar PDF</Text>
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </View>
  );
}

// ─── Modo Automático ───────────────────────────────────────────────────────────
function ModoAutomaticoView({ colors }: { colors: any }) {
  const [level, setLevel] = useState<AutoLevel>("semi");
  const [alertas, setAlertas]   = useState(true);
  const [aprovar, setAprovar]   = useState(false);

  const LEVELS: { id: AutoLevel; label: string; desc: string }[] = [
    { id: "assistido",   label: "Nível 1\nAssistido",   desc: "JADE sugere, você aprova" },
    { id: "semi",        label: "Nível 2\nSemi-auto",   desc: "JADE age em limites pré-definidos" },
    { id: "automatico",  label: "Nível 3\nAutomático",  desc: "JADE gerencia tudo autonomamente" },
  ];

  return (
    <View style={{ paddingHorizontal: 16, gap: 16 }}>
      {/* Nível de automação */}
      <View style={[T.autoSection, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[T.autoSectionTitle, { color: colors.text }]}>Nível de automação</Text>
        <View style={T.levelRow}>
          {LEVELS.map((l) => (
            <TouchableOpacity
              key={l.id}
              style={[T.levelPill, {
                backgroundColor: level === l.id ? PURPLE + "22" : colors.surface,
                borderColor: level === l.id ? PURPLE : colors.border,
                borderWidth: level === l.id ? 1.5 : 1,
              }]}
              onPress={() => { Haptics.selectionAsync(); setLevel(l.id); }}
              activeOpacity={0.85}
            >
              <Text style={[T.levelLabel, { color: level === l.id ? PURPLE : colors.text }]}>{l.label}</Text>
              <Text style={[T.levelDesc, { color: colors.mutedForeground }]}>{l.desc}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Feed de ações */}
      <View style={[T.autoSection, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[T.autoSectionTitle, { color: colors.text }]}>O que a JADE está fazendo</Text>
        <View style={{ gap: 10, marginTop: 4 }}>
          {AUTO_FEED.map((item, i) => (
            <View key={i} style={T.feedRow}>
              <View style={[T.feedDot, { backgroundColor: item.dot }]} />
              <Text style={[T.feedText, { color: colors.mutedForeground }]}>{item.text}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Limites */}
      <View style={[T.autoSection, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[T.autoSectionTitle, { color: colors.text }]}>Limites da JADE</Text>
        <View style={[T.limitRow, { borderColor: colors.border }]}>
          <Feather name="dollar-sign" size={16} color={colors.mutedForeground} />
          <Text style={[T.limitLabel, { color: colors.text }]}>Orçamento máximo / dia</Text>
          <Text style={[T.limitValue, { color: PINK }]}>R$50</Text>
        </View>
        <View style={T.toggleRow}>
          <View style={{ flex: 1 }}>
            <Text style={[T.toggleLabel, { color: colors.text }]}>Alertas automáticos</Text>
            <Text style={[T.toggleSub, { color: colors.mutedForeground }]}>Notificar quando CPL sair da meta</Text>
          </View>
          <Switch value={alertas} onValueChange={setAlertas} trackColor={{ true: PURPLE }} thumbColor="#fff" />
        </View>
        <View style={T.toggleRow}>
          <View style={{ flex: 1 }}>
            <Text style={[T.toggleLabel, { color: colors.text }]}>Aprovar antes de escalar</Text>
            <Text style={[T.toggleSub, { color: colors.mutedForeground }]}>Pedir confirmação para aumentar orçamento</Text>
          </View>
          <Switch value={aprovar} onValueChange={setAprovar} trackColor={{ true: PURPLE }} thumbColor="#fff" />
        </View>
      </View>

      <View style={{ height: 40 }} />
    </View>
  );
}

// ─── Agenda Tab ────────────────────────────────────────────────────────────────
type Platform_ = "Instagram" | "Facebook" | "LinkedIn";

interface ScheduledPost {
  id: string;
  platform: Platform_;
  content: string;
  dateLabel: string;
  dateIso: string;
  generated: boolean;
}

const PLAT_META: Record<Platform_, { color: string; icon: string; deeplink: string }> = {
  Instagram: { color: "#E1306C", icon: "instagram",  deeplink: "instagram://camera"       },
  Facebook:  { color: "#1877F2", icon: "facebook",   deeplink: "fb://composer/"            },
  LinkedIn:  { color: "#0A66C2", icon: "linkedin",   deeplink: "linkedin://messaging/new"  },
};

const SEED_POSTS: ScheduledPost[] = [
  {
    id: "p1", platform: "Instagram",
    content: "🚀 Promoção especial de julho! Aproveite 20% de desconto em todos os produtos até sexta-feira. Não perca essa chance — quantidade limitada! #delivery #promoção",
    dateLabel: "Sex 25/07 às 12:00", dateIso: "2025-07-25T12:00:00", generated: true,
  },
  {
    id: "p2", platform: "Facebook",
    content: "Você sabia que 87% dos clientes pesquisam online antes de comprar? Esteja presente onde seus clientes estão. Fale conosco e comece hoje!",
    dateLabel: "Sáb 26/07 às 10:00", dateIso: "2025-07-26T10:00:00", generated: false,
  },
];

const API_BASE_MKT = Platform.OS === "web" ? "" : `https://${process.env.EXPO_PUBLIC_DOMAIN ?? ""}`;

function AgendaTab({ colors }: { colors: any }) {
  const [posts,      setPosts]      = useState<ScheduledPost[]>(SEED_POSTS);
  const [platform,   setPlatform]   = useState<Platform_>("Instagram");
  const [content,    setContent]    = useState("");
  const [dateLabel,  setDateLabel]  = useState("");
  const [generating, setGenerating] = useState(false);
  const [saved,      setSaved]      = useState(false);

  const generateContent = async () => {
    setGenerating(true);
    try {
      const res = await fetch(`${API_BASE_MKT}/api/jade/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{
            role: "user",
            content: `Crie um post para ${platform} para um negócio brasileiro. Deve ser envolvente, com emojis relevantes, call-to-action e hashtags. Máximo 200 palavras. Retorne somente o texto do post, sem explicações.`,
          }],
        }),
      });
      const data = (await res.json()) as { message?: string; response?: string };
      const text = data.message?.trim() || data.response?.trim() || "";
      if (text) setContent(text);
    } catch {
      setContent("✨ Promoção especial! Aproveite nossa oferta exclusiva hoje. Quantidade limitada — entre em contato agora e garanta o seu! 🔥 #promoção #negócio");
    } finally { setGenerating(false); }
  };

  const savePost = () => {
    if (!content.trim() || !dateLabel.trim()) return;
    const newPost: ScheduledPost = {
      id: Date.now().toString(),
      platform,
      content: content.trim(),
      dateLabel: dateLabel.trim(),
      dateIso: new Date().toISOString(),
      generated: generating,
    };
    setPosts((prev) => [newPost, ...prev]);
    setContent(""); setDateLabel(""); setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const openApp = (p: Platform_) => {
    const deeplink = PLAT_META[p].deeplink;
    Linking.openURL(deeplink).catch(() => {
      const fallback = p === "Instagram" ? "https://instagram.com" : p === "Facebook" ? "https://facebook.com" : "https://linkedin.com";
      Linking.openURL(fallback);
    });
  };

  const PLATFORMS: Platform_[] = ["Instagram", "Facebook", "LinkedIn"];

  return (
    <View style={{ paddingHorizontal: 16, gap: 16 }}>
      {/* ─ Create new post ─ */}
      <View style={[AG.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[AG.cardTitle, { color: colors.text }]}>📅 Agendar novo post</Text>

        {/* Platform picker */}
        <View style={AG.platRow}>
          {PLATFORMS.map((p) => {
            const m = PLAT_META[p];
            const sel = platform === p;
            return (
              <TouchableOpacity
                key={p}
                style={[AG.platPill, { backgroundColor: sel ? m.color + "22" : colors.surface, borderColor: sel ? m.color : colors.border, borderWidth: sel ? 1.5 : 1 }]}
                onPress={() => { Haptics.selectionAsync(); setPlatform(p); }}
                activeOpacity={0.8}
              >
                <Feather name={m.icon as any} size={14} color={sel ? m.color : colors.mutedForeground} />
                <Text style={[AG.platLabel, { color: sel ? m.color : colors.mutedForeground }]}>{p}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Content area */}
        <TextInput
          style={[AG.contentInput, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
          placeholder="Conteúdo do post (ou clique em JADE para gerar)"
          placeholderTextColor={colors.mutedForeground}
          multiline
          numberOfLines={5}
          value={content}
          onChangeText={setContent}
          maxLength={600}
        />

        {/* JADE generate button */}
        <TouchableOpacity
          style={[AG.jadeGenBtn, { opacity: generating ? 0.7 : 1 }]}
          onPress={generateContent}
          disabled={generating}
          activeOpacity={0.85}
        >
          <MaterialCommunityIcons name="robot" size={16} color="#fff" />
          <Text style={AG.jadeGenText}>{generating ? "Gerando…" : "JADE gerar conteúdo"}</Text>
        </TouchableOpacity>

        {/* Date/time */}
        <TextInput
          style={[AG.dateInput, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
          placeholder="Data e hora (ex: Sex 25/07 às 18:00)"
          placeholderTextColor={colors.mutedForeground}
          value={dateLabel}
          onChangeText={setDateLabel}
        />

        {/* Info reminder */}
        <View style={[AG.infoRow, { backgroundColor: YELLOW + "18", borderColor: YELLOW + "44" }]}>
          <Feather name="info" size={13} color={YELLOW} />
          <Text style={[AG.infoText, { color: "#CCAA44" }]}>
            Você será notificado no horário para postar manualmente — ou toque em "Postar agora" para abrir o app.
          </Text>
        </View>

        {/* Save */}
        <TouchableOpacity
          style={[AG.saveBtn, { backgroundColor: saved ? "#00D68F" : PINK, opacity: (!content.trim() || !dateLabel.trim()) ? 0.5 : 1 }]}
          onPress={savePost}
          disabled={!content.trim() || !dateLabel.trim()}
          activeOpacity={0.85}
        >
          <Feather name={saved ? "check" : "calendar"} size={16} color="#fff" />
          <Text style={AG.saveBtnText}>{saved ? "Agendado!" : "Agendar post"}</Text>
        </TouchableOpacity>
      </View>

      {/* ─ Scheduled posts list ─ */}
      <Text style={[AG.listTitle, { color: colors.text }]}>📋 Posts agendados ({posts.length})</Text>
      {posts.map((post) => {
        const m = PLAT_META[post.platform];
        return (
          <View key={post.id} style={[AG.postCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={AG.postHeader}>
              <View style={[AG.platTag, { backgroundColor: m.color + "22" }]}>
                <Feather name={m.icon as any} size={12} color={m.color} />
                <Text style={[AG.platTagText, { color: m.color }]}>{post.platform}</Text>
              </View>
              {post.generated && (
                <View style={AG.aiTag}>
                  <MaterialCommunityIcons name="robot" size={11} color={PURPLE} />
                  <Text style={[AG.aiTagText, { color: PURPLE }]}>IA</Text>
                </View>
              )}
              <View style={{ flex: 1 }} />
              <View style={[AG.dateTag, { backgroundColor: colors.surface }]}>
                <Feather name="clock" size={11} color={colors.mutedForeground} />
                <Text style={[AG.dateTagText, { color: colors.mutedForeground }]}>{post.dateLabel}</Text>
              </View>
            </View>
            <Text style={[AG.postContent, { color: colors.text }]} numberOfLines={3}>{post.content}</Text>
            <View style={AG.postActions}>
              <TouchableOpacity
                style={[AG.actionBtn, { backgroundColor: m.color }]}
                onPress={() => openApp(post.platform)}
                activeOpacity={0.85}
              >
                <Feather name="external-link" size={13} color="#fff" />
                <Text style={AG.actionBtnText}>Postar agora</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[AG.deleteBtn, { borderColor: colors.border }]}
                onPress={() => { setPosts((prev) => prev.filter((p) => p.id !== post.id)); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                activeOpacity={0.7}
              >
                <Feather name="trash-2" size={13} color="#FF3B5C" />
              </TouchableOpacity>
            </View>
          </View>
        );
      })}

      {posts.length === 0 && (
        <View style={{ alignItems: "center", paddingVertical: 30, gap: 8 }}>
          <Feather name="calendar" size={26} color={colors.mutedForeground} />
          <Text style={{ color: colors.mutedForeground, fontSize: 13, fontFamily: "SpaceGrotesk_400Regular" }}>Nenhum post agendado</Text>
        </View>
      )}

      <View style={{ height: 40 }} />
    </View>
  );
}

const AG = StyleSheet.create({
  card:         { borderRadius: 16, borderWidth: 1, padding: 16, gap: 12 },
  cardTitle:    { fontSize: 15, fontFamily: "SpaceGrotesk_700Bold" },
  platRow:      { flexDirection: "row", gap: 8 },
  platPill:     { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 10, paddingVertical: 7, borderRadius: 10 },
  platLabel:    { fontSize: 12, fontFamily: "SpaceGrotesk_600SemiBold" },
  contentInput: { borderRadius: 12, borderWidth: 1, padding: 12, fontSize: 13, fontFamily: "SpaceGrotesk_400Regular", minHeight: 110, textAlignVertical: "top" },
  jadeGenBtn:   { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7, backgroundColor: PURPLE, borderRadius: 12, height: 42 },
  jadeGenText:  { color: "#fff", fontSize: 13, fontFamily: "SpaceGrotesk_700Bold" },
  dateInput:    { borderRadius: 12, borderWidth: 1, padding: 12, fontSize: 13, fontFamily: "SpaceGrotesk_400Regular", height: 44 },
  infoRow:      { flexDirection: "row", alignItems: "flex-start", gap: 8, padding: 10, borderRadius: 10, borderWidth: 1 },
  infoText:     { flex: 1, fontSize: 11, fontFamily: "SpaceGrotesk_400Regular", lineHeight: 16 },
  saveBtn:      { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 12, height: 46 },
  saveBtnText:  { color: "#fff", fontSize: 14, fontFamily: "SpaceGrotesk_700Bold" },
  listTitle:    { fontSize: 15, fontFamily: "SpaceGrotesk_700Bold" },
  postCard:     { borderRadius: 14, borderWidth: 1, padding: 14, gap: 10 },
  postHeader:   { flexDirection: "row", alignItems: "center", gap: 6, flexWrap: "wrap" },
  platTag:      { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 7, paddingVertical: 3, borderRadius: 7 },
  platTagText:  { fontSize: 11, fontFamily: "SpaceGrotesk_600SemiBold" },
  aiTag:        { flexDirection: "row", alignItems: "center", gap: 3, paddingHorizontal: 6, paddingVertical: 3, borderRadius: 7, backgroundColor: PURPLE + "22" },
  aiTagText:    { fontSize: 10, fontFamily: "SpaceGrotesk_700Bold" },
  dateTag:      { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 7, paddingVertical: 3, borderRadius: 7 },
  dateTagText:  { fontSize: 10, fontFamily: "SpaceGrotesk_400Regular" },
  postContent:  { fontSize: 13, fontFamily: "SpaceGrotesk_400Regular", lineHeight: 19 },
  postActions:  { flexDirection: "row", gap: 8 },
  actionBtn:    { flexDirection: "row", alignItems: "center", gap: 5, flex: 1, justifyContent: "center", borderRadius: 9, height: 36 },
  actionBtnText:{ color: "#fff", fontSize: 12, fontFamily: "SpaceGrotesk_600SemiBold" },
  deleteBtn:    { width: 36, height: 36, borderRadius: 9, borderWidth: 1, alignItems: "center", justifyContent: "center" },
});

// ─── Screen ────────────────────────────────────────────────────────────────────
export default function MarketingScreen() {
  const colors  = useColors();
  const insets  = useSafeAreaInsets();
  const router  = useRouter();

  const topPad    = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 84 : insets.bottom + 60;

  const [activeTab, setActiveTab] = useState<TabId>("campanhas");
  const [modoAuto, setModoAuto]   = useState(false);

  const TABS: { id: TabId; label: string }[] = [
    { id: "campanhas",  label: "Campanhas"  },
    { id: "criativos",  label: "Criativos"  },
    { id: "agenda",     label: "Agenda"     },
    { id: "relatorios", label: "Relatórios" },
  ];

  return (
    <View style={[R.container, { backgroundColor: BG }]}>
      {/* Header */}
      <View style={[R.header, { paddingTop: topPad + 8, borderBottomColor: "#1E1E2E" }]}>
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.8} style={R.backBtn}>
          <Feather name="arrow-left" size={20} color="#fff" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <View style={R.titleRow}>
            <Text style={R.title}>JADE Marketing</Text>
            <View style={R.badge}>
              <Feather name="zap" size={11} color={PINK} />
              <Text style={R.badgeText}>Marketing IA</Text>
            </View>
          </View>
        </View>
        <View style={R.autoToggleRow}>
          <Text style={[R.autoLabel, { color: modoAuto ? PURPLE : "#555577" }]}>Auto</Text>
          <Switch
            value={modoAuto}
            onValueChange={(v) => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); setModoAuto(v); }}
            trackColor={{ false: "#222233", true: PURPLE }}
            thumbColor={modoAuto ? "#fff" : "#888899"}
          />
        </View>
      </View>

      {/* Tabs — only in Manual mode */}
      {!modoAuto && (
        <View style={[R.tabBar, { borderBottomColor: "#1E1E2E" }]}>
          {TABS.map((t) => (
            <TouchableOpacity
              key={t.id}
              style={[R.tab, activeTab === t.id && R.tabActive]}
              onPress={() => { Haptics.selectionAsync(); setActiveTab(t.id); }}
              activeOpacity={0.8}
            >
              <Text style={[R.tabText, { color: activeTab === t.id ? PINK : "#555577" }]}>{t.label}</Text>
              {activeTab === t.id && <View style={R.tabIndicator} />}
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Content */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: 16, paddingBottom: bottomPad }}
        keyboardShouldPersistTaps="handled"
      >
        {modoAuto ? (
          <ModoAutomaticoView colors={colors} />
        ) : (
          <>
            {activeTab === "campanhas"  && <CampanhasTab  colors={colors} />}
            {activeTab === "criativos"  && <CriativosTab  colors={colors} />}
            {activeTab === "agenda"     && <AgendaTab     colors={colors} />}
            {activeTab === "relatorios" && <RelatoriosTab colors={colors} />}
          </>
        )}
      </ScrollView>
    </View>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────
const R = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingBottom: 14, gap: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  backBtn: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center", backgroundColor: "#1A1A2E" },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" },
  title: { fontSize: 18, fontFamily: "SpaceGrotesk_700Bold", color: "#fff" },
  badge: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: PINK + "22", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  badgeText: { fontSize: 11, fontFamily: "SpaceGrotesk_600SemiBold", color: PINK },
  autoToggleRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  autoLabel: { fontSize: 12, fontFamily: "SpaceGrotesk_600SemiBold" },
  tabBar: { flexDirection: "row", borderBottomWidth: StyleSheet.hairlineWidth },
  tab: { flex: 1, alignItems: "center", paddingVertical: 14, position: "relative" },
  tabActive: {},
  tabText: { fontSize: 13, fontFamily: "SpaceGrotesk_600SemiBold" },
  tabIndicator: { position: "absolute", bottom: 0, left: "15%", right: "15%", height: 2, backgroundColor: PINK, borderRadius: 1 },
});

const T = StyleSheet.create({
  filterRow: { paddingHorizontal: 16, gap: 8, marginBottom: 16, flexDirection: "row" },
  filterPill: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1, borderColor: "#2A2A3E" },
  filterText: { fontSize: 13, fontFamily: "SpaceGrotesk_500Medium" },

  pill: { alignSelf: "flex-start", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  pillText: { fontSize: 11, fontFamily: "SpaceGrotesk_700Bold" },

  campCard: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 12 },
  campCardHead: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  campName: { fontSize: 15, fontFamily: "SpaceGrotesk_700Bold" },
  platformBadge: { alignSelf: "flex-start", paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6 },
  platformText: { fontSize: 11, fontFamily: "SpaceGrotesk_600SemiBold" },
  tipoText: { fontSize: 12, fontFamily: "SpaceGrotesk_400Regular" },
  statsGrid: { flexDirection: "row", gap: 8 },
  statItem: { flex: 1, alignItems: "center", gap: 2 },
  statLabel: { fontSize: 10, fontFamily: "SpaceGrotesk_400Regular" },
  statVal: { fontSize: 15, fontFamily: "SpaceGrotesk_700Bold" },
  budgetRow: { gap: 6 },
  budgetBar: { height: 6, borderRadius: 3, overflow: "hidden" },
  budgetFill: { height: "100%", borderRadius: 3 },
  budgetLabel: { fontSize: 11, fontFamily: "SpaceGrotesk_400Regular", textAlign: "right" },
  revisaoNote: { flexDirection: "row", alignItems: "center", gap: 6, padding: 8, borderRadius: 8 },
  revisaoText: { fontSize: 12, fontFamily: "SpaceGrotesk_500Medium" },

  fab: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: PINK, borderRadius: 28,
    paddingVertical: 14, paddingHorizontal: 24,
    alignSelf: "center", marginTop: 20, marginBottom: 12,
    shadowColor: PINK, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 12, elevation: 8,
  },
  fabText: { color: "#fff", fontSize: 15, fontFamily: "SpaceGrotesk_700Bold" },

  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.75)", justifyContent: "flex-end" },
  sheet: { borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, gap: 12, paddingBottom: 40 },
  sheetHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: "#3A3A4E", alignSelf: "center", marginBottom: 8 },
  sheetTitle: { fontSize: 20, fontFamily: "SpaceGrotesk_700Bold" },
  sheetSub: { fontSize: 13, fontFamily: "SpaceGrotesk_400Regular" },
  objCard: { flexDirection: "row", alignItems: "center", gap: 14, padding: 16, borderRadius: 14 },
  objEmoji: { fontSize: 26 },
  objTitle: { fontSize: 15, fontFamily: "SpaceGrotesk_700Bold" },
  objSub: { fontSize: 12, fontFamily: "SpaceGrotesk_400Regular", marginTop: 2 },
  sheetBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    backgroundColor: PINK, borderRadius: 14, height: 52, marginTop: 8,
  },
  sheetBtnText: { color: "#fff", fontSize: 16, fontFamily: "SpaceGrotesk_700Bold" },

  sectionLabel: { fontSize: 15, fontFamily: "SpaceGrotesk_700Bold", marginBottom: 10 },
  topGrid: { flexDirection: "row", gap: 10 },
  topCard: { flex: 1, borderRadius: 14, borderWidth: 1, padding: 12, gap: 6, alignItems: "flex-start" },
  topIcon: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center", marginBottom: 2 },
  topName: { fontSize: 13, fontFamily: "SpaceGrotesk_600SemiBold" },
  topImpr: { fontSize: 11, fontFamily: "SpaceGrotesk_400Regular" },

  jadeSuggestion: { flexDirection: "row", alignItems: "flex-start", gap: 10, padding: 14, borderRadius: 14, borderWidth: 1 },
  jadeSuggText: { flex: 1, fontSize: 13, fontFamily: "SpaceGrotesk_400Regular", lineHeight: 19 },

  criatGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  novoCriatCard: {
    width: "47%", aspectRatio: 0.9, borderRadius: 14, borderWidth: 2, borderStyle: "dashed",
    alignItems: "center", justifyContent: "center", gap: 8,
  },
  novoCriatText: { fontSize: 13, fontFamily: "SpaceGrotesk_600SemiBold" },
  criatCard: { width: "47%", borderRadius: 14, borderWidth: 1, padding: 12, gap: 6 },
  criatIcon: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  criatName: { fontSize: 13, fontFamily: "SpaceGrotesk_600SemiBold" },
  criatCamp: { fontSize: 11, fontFamily: "SpaceGrotesk_400Regular" },

  heroCard: { borderRadius: 20, padding: 20, gap: 12 },
  heroBadge: { flexDirection: "row", alignItems: "center", gap: 6, alignSelf: "flex-start", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  heroBadgeText: { fontSize: 12, fontFamily: "SpaceGrotesk_600SemiBold" },
  heroText: { fontSize: 14, fontFamily: "SpaceGrotesk_400Regular", lineHeight: 21 },

  metricsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  metCard: { width: "30.5%", borderRadius: 12, borderWidth: 1, padding: 12, gap: 4, alignItems: "flex-start", flexGrow: 1 },
  metValue: { fontSize: 18, fontFamily: "SpaceGrotesk_700Bold" },
  metLabel: { fontSize: 10, fontFamily: "SpaceGrotesk_400Regular" },
  metChange: { flexDirection: "row", alignItems: "center", gap: 3, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, marginTop: 2 },
  metChangeText: { fontSize: 10, fontFamily: "SpaceGrotesk_600SemiBold" },

  chartCard: { borderRadius: 16, borderWidth: 1, padding: 16 },
  chartTitle: { fontSize: 14, fontFamily: "SpaceGrotesk_600SemiBold", marginBottom: 12 },
  chartBars: { flexDirection: "row", gap: 6, height: 120, alignItems: "flex-end" },
  barCol: { flex: 1, alignItems: "center", gap: 4, height: "100%" },
  barValue: { fontSize: 11, fontFamily: "SpaceGrotesk_600SemiBold" },
  barTrack: { flex: 1, width: "100%", justifyContent: "flex-end" },
  barFill: { width: "100%", borderRadius: 4, minHeight: 4 },
  barDay: { fontSize: 10, fontFamily: "SpaceGrotesk_400Regular" },

  rankCard: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 12 },
  rankTitle: { fontSize: 14, fontFamily: "SpaceGrotesk_600SemiBold" },
  rankRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  rankNum: { width: 28, height: 28, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  rankNumText: { fontSize: 12, fontFamily: "SpaceGrotesk_700Bold" },
  rankDot: { width: 8, height: 8, borderRadius: 4 },
  rankName: { flex: 1, fontSize: 13, fontFamily: "SpaceGrotesk_500Medium" },
  rankResult: { fontSize: 12, fontFamily: "SpaceGrotesk_700Bold" },

  exportBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    backgroundColor: PURPLE, borderRadius: 14, height: 52,
  },
  exportBtnText: { color: "#fff", fontSize: 15, fontFamily: "SpaceGrotesk_700Bold" },

  autoSection: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 12 },
  autoSectionTitle: { fontSize: 15, fontFamily: "SpaceGrotesk_700Bold" },
  levelRow: { flexDirection: "row", gap: 8 },
  levelPill: { flex: 1, borderRadius: 12, padding: 12, alignItems: "center", gap: 4 },
  levelLabel: { fontSize: 12, fontFamily: "SpaceGrotesk_700Bold", textAlign: "center" },
  levelDesc: { fontSize: 10, fontFamily: "SpaceGrotesk_400Regular", textAlign: "center" },
  feedRow: { flexDirection: "row", gap: 10, alignItems: "flex-start" },
  feedDot: { width: 8, height: 8, borderRadius: 4, marginTop: 5 },
  feedText: { flex: 1, fontSize: 13, fontFamily: "SpaceGrotesk_400Regular", lineHeight: 19 },
  limitRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth },
  limitLabel: { flex: 1, fontSize: 14, fontFamily: "SpaceGrotesk_400Regular" },
  limitValue: { fontSize: 14, fontFamily: "SpaceGrotesk_700Bold" },
  toggleRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  toggleLabel: { fontSize: 14, fontFamily: "SpaceGrotesk_500Medium" },
  toggleSub: { fontSize: 11, fontFamily: "SpaceGrotesk_400Regular", marginTop: 1 },
});
