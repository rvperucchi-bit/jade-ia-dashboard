import React, { useRef, useState } from "react";
import {
  Alert,
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
import { stripMarkdown } from "@/utils/stripMarkdown";

const PINK   = "#FF0080";
const PURPLE = "#8400FF";
const BG     = "#0B0814";
const MUTED  = "rgba(255,255,255,0.4)";
const SURF   = "rgba(255,255,255,0.04)";
const BORD   = "rgba(255,255,255,0.08)";

type TabId      = "campanhas" | "criativos" | "agenda" | "relatorios";
type AutoLevel  = "assistido" | "semi" | "automatico";
type FiltCamp   = "todas" | "ativas" | "pausadas" | "revisao";
type FiltCriat  = "todos" | "video" | "imagem" | "carrossel";

interface Campaign {
  id: string; name: string;
  platform: "Meta Ads" | "Google Ads";
  tipo: string; status: "ativa" | "pausada" | "revisao";
  investido: number; limite: number;
  leads: number; cpl: number; roas: number;
}
interface Creative {
  id: string; name: string;
  type: "video" | "imagem" | "carrossel";
  performance: "top" | "medio" | "baixo";
  campaign: string; impressions: string;
}

const CAMPAIGNS: Campaign[] = [
  { id: "1", name: "Delivery Verão",  platform: "Meta Ads",   tipo: "Conversão",   status: "ativa",   investido: 320, limite: 500, leads: 18, cpl: 17.8, roas: 3.2 },
  { id: "2", name: "Brand Awareness", platform: "Google Ads", tipo: "Alcance",     status: "ativa",   investido: 195, limite: 300, leads: 9,  cpl: 21.7, roas: 2.1 },
  { id: "3", name: "Remarketing Q2",  platform: "Meta Ads",   tipo: "Remarketing", status: "pausada", investido: 95,  limite: 200, leads: 5,  cpl: 19.0, roas: 1.8 },
  { id: "4", name: "Promoção Junho",  platform: "Meta Ads",   tipo: "Conversão",   status: "revisao", investido: 0,   limite: 400, leads: 0,  cpl: 0,    roas: 0   },
];
const CREATIVES: Creative[] = [
  { id: "1", name: "Vídeo hambúrguer", type: "video",     performance: "top",   campaign: "Delivery Verão",  impressions: "12.4k" },
  { id: "2", name: "Card promoção",    type: "imagem",    performance: "top",   campaign: "Delivery Verão",  impressions: "9.8k"  },
  { id: "3", name: "Carrossel menu",   type: "carrossel", performance: "medio", campaign: "Brand Awareness", impressions: "7.2k"  },
  { id: "4", name: "Story oferta",     type: "imagem",    performance: "medio", campaign: "Delivery Verão",  impressions: "5.1k"  },
  { id: "5", name: "Reels bastidores", type: "video",     performance: "baixo", campaign: "Brand Awareness", impressions: "3.3k"  },
  { id: "6", name: "Card produto",     type: "imagem",    performance: "baixo", campaign: "Remarketing Q2",  impressions: "2.8k"  },
];
const DIAS     = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
const LEADS_DIA = [4, 7, 5, 9, 12, 6, 3];
const BEST_DAY  = 4;
const AUTO_FEED = [
  "Campanha 'Delivery Verão' aumentou em R$20/dia — CTR subiu 18%",
  "Novo criativo 'Card promoção' ativado automaticamente",
  "Orçamento redistribuído: Meta +15%, Google -15%",
  "5 leads convertidos via campanha de remarketing",
  "Alerta: CPL acima da meta em 'Brand Awareness'",
];

// ─── Helpers ────────────────────────────────────────────────────────────────────
function StatusDot({ status }: { status: Campaign["status"] }) {
  const cfg = {
    ativa:   { label: "Ativa",      color: PINK },
    pausada: { label: "Pausada",    color: "rgba(255,255,255,0.3)" },
    revisao: { label: "Em revisão", color: "rgba(255,255,255,0.2)" },
  };
  const c = cfg[status];
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
      <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: c.color }} />
      <Text style={{ fontSize: 12, color: c.color === PINK ? "rgba(255,255,255,0.8)" : MUTED, fontFamily: "SpaceGrotesk_500Medium" }}>{c.label}</Text>
    </View>
  );
}

function PerfLabel({ p }: { p: Creative["performance"] }) {
  const cfg = {
    top:   { label: "↑ Destaque", color: "rgba(255,255,255,0.8)" },
    medio: { label: "Médio",      color: MUTED },
    baixo: { label: "Abaixo",     color: "rgba(255,255,255,0.25)" },
  };
  const c = cfg[p];
  return <Text style={{ fontSize: 11, color: c.color, fontFamily: "SpaceGrotesk_500Medium", marginTop: 2 }}>{c.label}</Text>;
}

function typeIcon(type: Creative["type"]) {
  const icon = type === "video" ? "video" : type === "carrossel" ? "layers" : "image";
  return <Feather name={icon} size={15} color="rgba(255,255,255,0.55)" />;
}

// ─── CAMPANHAS ──────────────────────────────────────────────────────────────────
function CampanhasTab({ colors }: { colors: any }) {
  const [campaigns, setCampaigns]     = useState<Campaign[]>(CAMPAIGNS);
  const [filtro, setFiltro]           = useState<FiltCamp>("todas");
  const [novaCampModal, setNovaCampModal] = useState(false);
  const [selectedObj, setSelectedObj] = useState<string | null>(null);
  const [detailCamp,  setDetailCamp]  = useState<Campaign | null>(null);

  const toggleCampStatus = (id: string) => {
    setCampaigns((prev) => prev.map((c) => c.id === id ? { ...c, status: c.status === "ativa" ? "pausada" : "ativa" } : c));
    setDetailCamp((prev) => prev && prev.id === id ? { ...prev, status: prev.status === "ativa" ? "pausada" : "ativa" } : prev);
  };

  const filtered = campaigns.filter((c) => {
    if (filtro === "todas")   return true;
    if (filtro === "ativas")  return c.status === "ativa";
    if (filtro === "pausadas") return c.status === "pausada";
    return c.status === "revisao";
  });

  const OBJETIVOS = [
    { id: "conversao",   emoji: "💰", title: "Quero vender agora",        sub: "Campanha de conversão"   },
    { id: "alcance",     emoji: "📢", title: "Quero aparecer mais",        sub: "Campanha de alcance"     },
    { id: "remarketing", emoji: "🔄", title: "Quero recuperar quem sumiu", sub: "Campanha de remarketing" },
  ];

  return (
    <View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={T.filterRow}>
        {(["todas","ativas","pausadas","revisao"] as FiltCamp[]).map((f) => (
          <TouchableOpacity
            key={f}
            style={[T.filterPill, filtro === f && { backgroundColor: "rgba(255,0,128,0.12)", borderColor: PINK }]}
            onPress={() => setFiltro(f)}
            activeOpacity={0.8}
          >
            <Text style={[T.filterText, { color: filtro === f ? "#fff" : MUTED }]}>
              {f === "todas" ? "Todas" : f === "ativas" ? "Ativas" : f === "pausadas" ? "Pausadas" : "Em revisão"}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={{ gap: 10, paddingHorizontal: 16 }}>
        {filtered.map((camp) => (
          <TouchableOpacity key={camp.id}
            style={[T.campCard, { backgroundColor: SURF, borderColor: BORD }]}
            onPress={() => { Haptics.selectionAsync(); setDetailCamp(camp); }}
            activeOpacity={0.85}
          >
            <View style={T.campCardHead}>
              <View style={{ flex: 1 }}>
                <Text style={[T.campName, { color: "#fff" }]}>{camp.name}</Text>
                <Text style={{ fontSize: 12, color: MUTED, fontFamily: "SpaceGrotesk_400Regular", marginTop: 3 }}>
                  {camp.platform} · {camp.tipo}
                </Text>
              </View>
              <StatusDot status={camp.status} />
            </View>

            {camp.status !== "revisao" && (
              <>
                <View style={T.statsGrid}>
                  {[
                    { l: "Investido", v: `R$${camp.investido}` },
                    { l: "Leads",     v: String(camp.leads)    },
                    { l: "CPL",       v: `R$${camp.cpl.toFixed(0)}` },
                    { l: "ROAS",      v: `${camp.roas}x`       },
                  ].map((s, i) => (
                    <View key={i} style={T.statItem}>
                      <Text style={[T.statLabel, { color: MUTED }]}>{s.l}</Text>
                      <Text style={[T.statVal,   { color: "#fff" }]}>{s.v}</Text>
                    </View>
                  ))}
                </View>
                <View style={T.budgetRow}>
                  <View style={[T.budgetBar, { backgroundColor: "rgba(255,255,255,0.06)" }]}>
                    <View style={[T.budgetFill, { width: `${Math.round((camp.investido / camp.limite) * 100)}%` as any, backgroundColor: PINK }]} />
                  </View>
                  <Text style={[T.budgetLabel, { color: MUTED }]}>R${camp.investido} / R${camp.limite}</Text>
                </View>
              </>
            )}

            {camp.status === "revisao" && (
              <Text style={{ fontSize: 13, color: MUTED, fontFamily: "SpaceGrotesk_400Regular" }}>Em revisão pela equipe de anúncios</Text>
            )}
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        style={T.fab}
        onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); setNovaCampModal(true); }}
        activeOpacity={0.85}
      >
        <Feather name="plus" size={18} color="#fff" />
        <Text style={T.fabText}>Nova campanha</Text>
      </TouchableOpacity>

      {/* Objetivo modal */}
      <Modal visible={novaCampModal} transparent animationType="slide" onRequestClose={() => setNovaCampModal(false)}>
        <TouchableOpacity style={T.overlay} activeOpacity={1} onPress={() => setNovaCampModal(false)}>
          <View style={[T.sheet, { backgroundColor: "#0F0D1A" }]} onStartShouldSetResponder={() => true}>
            <View style={T.sheetHandle} />
            <Text style={[T.sheetTitle, { color: "#fff" }]}>Objetivo da campanha</Text>
            <Text style={{ fontSize: 14, color: MUTED, fontFamily: "SpaceGrotesk_400Regular" }}>A JADE vai criar e otimizar automaticamente</Text>
            <View style={{ gap: 10, marginTop: 8 }}>
              {OBJETIVOS.map((obj) => (
                <TouchableOpacity
                  key={obj.id}
                  style={[T.objCard, {
                    backgroundColor: selectedObj === obj.id ? "rgba(255,0,128,0.08)" : SURF,
                    borderColor: selectedObj === obj.id ? PINK : BORD,
                  }]}
                  onPress={() => { Haptics.selectionAsync(); setSelectedObj(obj.id); }}
                  activeOpacity={0.85}
                >
                  <Text style={{ fontSize: 22 }}>{obj.emoji}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 15, color: "#fff", fontFamily: "SpaceGrotesk_600SemiBold" }}>{obj.title}</Text>
                    <Text style={{ fontSize: 13, color: MUTED, fontFamily: "SpaceGrotesk_400Regular", marginTop: 2 }}>{obj.sub}</Text>
                  </View>
                  {selectedObj === obj.id && <Feather name="check" size={18} color={PINK} />}
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity
              style={[T.sheetBtn, { opacity: selectedObj ? 1 : 0.4 }]}
              onPress={() => { if (selectedObj) { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); setNovaCampModal(false); setSelectedObj(null); }}}
              activeOpacity={0.85} disabled={!selectedObj}
            >
              <Feather name="zap" size={16} color="#fff" />
              <Text style={T.sheetBtnText}>Criar com JADE</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Detalhe modal */}
      <Modal visible={!!detailCamp} transparent animationType="slide" onRequestClose={() => setDetailCamp(null)}>
        <TouchableOpacity style={T.overlay} activeOpacity={1} onPress={() => setDetailCamp(null)}>
          {detailCamp && (
            <View style={[T.sheet, { backgroundColor: "#0F0D1A" }]} onStartShouldSetResponder={() => true}>
              <View style={T.sheetHandle} />
              <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 10 }}>
                <View style={{ flex: 1 }}>
                  <Text style={[T.sheetTitle, { color: "#fff" }]}>{detailCamp.name}</Text>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginTop: 6 }}>
                    <Text style={{ fontSize: 12, color: MUTED, fontFamily: "SpaceGrotesk_400Regular" }}>{detailCamp.platform} · {detailCamp.tipo}</Text>
                    <StatusDot status={detailCamp.status} />
                  </View>
                </View>
              </View>
              {detailCamp.status !== "revisao" && (
                <View style={[T.statsGrid, { marginTop: 8 }]}>
                  {[{ l: "Investido", v: `R$${detailCamp.investido}` }, { l: "Leads", v: String(detailCamp.leads) }, { l: "CPL", v: `R$${detailCamp.cpl.toFixed(0)}` }, { l: "ROAS", v: `${detailCamp.roas}x` }].map((s, i) => (
                    <View key={i} style={[T.statItem, { backgroundColor: SURF, borderRadius: 10, padding: 10 }]}>
                      <Text style={[T.statLabel, { color: MUTED }]}>{s.l}</Text>
                      <Text style={[T.statVal, { color: "#fff", fontSize: 18 }]}>{s.v}</Text>
                    </View>
                  ))}
                </View>
              )}
              <View style={{ gap: 6 }}>
                <View style={[T.budgetBar, { backgroundColor: "rgba(255,255,255,0.06)", height: 6, borderRadius: 3 }]}>
                  <View style={[T.budgetFill, { width: detailCamp.limite > 0 ? `${Math.round((detailCamp.investido / detailCamp.limite) * 100)}%` as any : "0%", backgroundColor: PINK, borderRadius: 3 }]} />
                </View>
                <Text style={[T.budgetLabel, { color: MUTED }]}>Orçamento: R${detailCamp.investido} / R${detailCamp.limite}</Text>
              </View>
              <View style={{ flexDirection: "row", gap: 10 }}>
                <TouchableOpacity
                  style={[T.sheetBtn, { flex: 1, backgroundColor: detailCamp.status === "ativa" ? SURF : PINK, borderWidth: detailCamp.status === "ativa" ? 1 : 0, borderColor: BORD }]}
                  onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); toggleCampStatus(detailCamp.id); }}
                  activeOpacity={0.85}
                >
                  <Feather name={detailCamp.status === "ativa" ? "pause-circle" : "play-circle"} size={15} color={detailCamp.status === "ativa" ? MUTED : "#fff"} />
                  <Text style={[T.sheetBtnText, { color: detailCamp.status === "ativa" ? "#fff" : "#fff" }]}>{detailCamp.status === "ativa" ? "Pausar" : "Ativar"}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[T.sheetBtn, { flex: 1 }]} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setDetailCamp(null); }} activeOpacity={0.85}>
                  <Feather name="edit-2" size={15} color="#fff" />
                  <Text style={T.sheetBtnText}>Editar</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

// ─── CRIATIVOS ──────────────────────────────────────────────────────────────────
function CriativosTab({ colors }: { colors: any }) {
  const [filtro, setFiltro]           = useState<FiltCriat>("todos");
  const [novoCriatModal, setNovoCriatModal] = useState(false);
  const [criatType, setCriatType]     = useState<Creative["type"]>("imagem");
  const [criatName, setCriatName]     = useState("");
  const [criatGen, setCriatGen]       = useState(false);
  const [criativos, setCriativos]     = useState<Creative[]>(CREATIVES);
  const [detailCreative, setDetailCreative] = useState<Creative | null>(null);
  const [detailLoading, setDetailLoading]   = useState(false);
  const [detailContent, setDetailContent]   = useState("");

  const top      = criativos.filter((c) => c.performance === "top");
  const filtered = criativos.filter((c) => filtro === "todos" ? true : c.type === filtro);

  const handleCriarCriativo = () => {
    if (!criatName.trim()) return;
    setCriativos((prev) => [{ id: Date.now().toString(), name: criatName.trim(), type: criatType, performance: "medio", campaign: "Nova campanha", impressions: "0" }, ...prev]);
    setCriatName(""); setCriatGen(false); setNovoCriatModal(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  return (
    <View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={T.filterRow}>
        {(["todos","video","imagem","carrossel"] as FiltCriat[]).map((f) => (
          <TouchableOpacity
            key={f}
            style={[T.filterPill, filtro === f && { backgroundColor: "rgba(255,0,128,0.12)", borderColor: PINK }]}
            onPress={() => setFiltro(f)}
            activeOpacity={0.8}
          >
            <Text style={[T.filterText, { color: filtro === f ? "#fff" : MUTED }]}>
              {f === "todos" ? "Todos" : f === "video" ? "Vídeo" : f === "imagem" ? "Imagem" : "Carrossel"}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={{ paddingHorizontal: 16, gap: 16 }}>
        {filtro === "todos" && (
          <View>
            <Text style={[T.sectionLabel, { color: "#fff" }]}>Destaques</Text>
            <View style={T.topGrid}>
              {top.map((c) => (
                <View key={c.id} style={[T.topCard, { backgroundColor: SURF, borderColor: BORD }]}>
                  <View style={[T.topIcon, { backgroundColor: "rgba(255,255,255,0.04)" }]}>{typeIcon(c.type)}</View>
                  <Text style={[T.topName, { color: "#fff" }]} numberOfLines={1}>{c.name}</Text>
                  <Text style={[T.topImpr, { color: MUTED }]}>{c.impressions} impressões</Text>
                  <PerfLabel p={c.performance} />
                </View>
              ))}
            </View>
          </View>
        )}

        {/* JADE sugere — minimal */}
        <View style={[T.jadeSuggestion, { backgroundColor: "rgba(255,0,128,0.05)", borderLeftColor: PINK }]}>
          <Feather name="zap" size={13} color={PINK} style={{ marginTop: 2 }} />
          <View style={{ flex: 1 }}>
            <Text style={[T.jadeSuggText, { color: "rgba(255,255,255,0.7)" }]}>
              <Text style={{ color: "#fff", fontFamily: "SpaceGrotesk_700Bold" }}>JADE: </Text>
              pausar "Reels bastidores" e duplicar "Card promoção" com novo público
            </Text>
            <TouchableOpacity
              onPress={() => {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                Alert.alert("Sugestão aplicada", "JADE pausou 'Reels bastidores' e criou a variação 'Card promoção — Novo público'.", [{ text: "OK" }]);
              }}
              activeOpacity={0.8}
            >
              <Text style={{ color: PINK, fontSize: 12, fontFamily: "SpaceGrotesk_600SemiBold", marginTop: 8 }}>Aplicar sugestão →</Text>
            </TouchableOpacity>
          </View>
        </View>

        <Text style={[T.sectionLabel, { color: "#fff" }]}>Todos os criativos</Text>
        <View style={T.criatGrid}>
          <TouchableOpacity
            style={[T.novoCriatCard, { borderColor: BORD }]}
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); setNovoCriatModal(true); }}
            activeOpacity={0.8}
          >
            <Feather name="plus" size={22} color={MUTED} />
            <Text style={{ fontSize: 13, color: MUTED, fontFamily: "SpaceGrotesk_500Medium" }}>Novo criativo</Text>
          </TouchableOpacity>

          {filtered.map((c) => (
            <TouchableOpacity
              key={c.id}
              style={[T.criatCard, { backgroundColor: SURF, borderColor: BORD }]}
              onPress={() => { Haptics.selectionAsync(); setDetailCreative(c); setDetailContent(""); }}
              activeOpacity={0.85}
            >
              <View style={[T.criatIcon, { backgroundColor: "rgba(255,255,255,0.04)" }]}>{typeIcon(c.type)}</View>
              <Text style={[T.criatName, { color: "#fff" }]} numberOfLines={2}>{c.name}</Text>
              <Text style={[T.criatCamp, { color: MUTED }]} numberOfLines={1}>{c.campaign}</Text>
              <PerfLabel p={c.performance} />
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <Modal visible={!!detailCreative} transparent animationType="slide" onRequestClose={() => setDetailCreative(null)}>
        <TouchableOpacity style={T.overlay} activeOpacity={1} onPress={() => setDetailCreative(null)}>
          {detailCreative && (
            <View style={[T.sheet, { backgroundColor: "#0F0D1A" }]} onStartShouldSetResponder={() => true}>
              <View style={T.sheetHandle} />
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 4 }}>
                <View style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: "rgba(255,255,255,0.06)", alignItems: "center", justifyContent: "center" }}>
                  {typeIcon(detailCreative.type)}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[T.sheetTitle, { color: "#fff", fontSize: 16, marginBottom: 0 }]}>{detailCreative.name}</Text>
                  <Text style={{ fontSize: 12, color: MUTED, fontFamily: "SpaceGrotesk_400Regular" }}>{detailCreative.campaign}</Text>
                </View>
                <PerfLabel p={detailCreative.performance} />
              </View>
              <View style={{ flexDirection: "row", gap: 8, marginVertical: 8 }}>
                {[
                  { label: "Impressões", value: detailCreative.impressions },
                  { label: "Tipo", value: detailCreative.type === "video" ? "Vídeo" : detailCreative.type === "imagem" ? "Imagem" : "Carrossel" },
                  { label: "Desempenho", value: detailCreative.performance === "top" ? "🔥 Top" : detailCreative.performance === "medio" ? "Médio" : "Baixo" },
                ].map((s, i) => (
                  <View key={i} style={{ flex: 1, backgroundColor: SURF, borderRadius: 10, borderWidth: 1, borderColor: BORD, padding: 10, alignItems: "center" }}>
                    <Text style={{ fontSize: 13, fontFamily: "SpaceGrotesk_700Bold", color: "#fff" }}>{s.value}</Text>
                    <Text style={{ fontSize: 10, fontFamily: "SpaceGrotesk_400Regular", color: MUTED, marginTop: 2, textAlign: "center" }}>{s.label}</Text>
                  </View>
                ))}
              </View>
              {!!detailContent && (
                <View style={{ backgroundColor: "rgba(255,0,128,0.05)", borderRadius: 12, borderWidth: 1, borderColor: "rgba(255,0,128,0.2)", padding: 14, marginBottom: 8 }}>
                  <Text style={{ fontSize: 10, fontFamily: "SpaceGrotesk_700Bold", color: PINK, letterSpacing: 0.7, marginBottom: 6 }}>JADE GEROU</Text>
                  <Text style={{ fontSize: 13, fontFamily: "SpaceGrotesk_400Regular", color: "rgba(255,255,255,0.85)", lineHeight: 20 }}>{detailContent}</Text>
                </View>
              )}
              <TouchableOpacity
                style={[T.sheetBtn, { opacity: detailLoading ? 0.7 : 1 }]}
                disabled={detailLoading}
                onPress={async () => {
                  setDetailLoading(true);
                  setDetailContent("");
                  try {
                    const res = await fetch(`${Platform.OS === "web" ? "" : `https://${process.env.EXPO_PUBLIC_DOMAIN ?? ""}`}/api/marketing/generate`, {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        type_id: detailCreative.type,
                        type_title: detailCreative.name,
                        channel: detailCreative.campaign,
                        context_input: `Criativo "${detailCreative.name}" do tipo ${detailCreative.type} com ${detailCreative.impressions} impressões. Desempenho: ${detailCreative.performance}.`,
                        system_context: "Você é JADE, especialista em marketing digital. Gere uma sugestão de copy criativa e objetiva para melhorar o desempenho deste criativo. Máximo 3 parágrafos.",
                      }),
                    });
                    const data = await res.json();
                    setDetailContent(data.message ?? "Não foi possível gerar conteúdo.");
                  } catch {
                    setDetailContent("Erro ao conectar. Verifique sua conexão.");
                  } finally {
                    setDetailLoading(false);
                  }
                }}
                activeOpacity={0.85}
              >
                <Feather name="zap" size={15} color="#fff" />
                <Text style={T.sheetBtnText}>{detailLoading ? "Gerando com JADE…" : "Gerar copy com JADE"}</Text>
              </TouchableOpacity>
            </View>
          )}
        </TouchableOpacity>
      </Modal>

      <Modal visible={novoCriatModal} transparent animationType="slide" onRequestClose={() => setNovoCriatModal(false)}>
        <TouchableOpacity style={T.overlay} activeOpacity={1} onPress={() => setNovoCriatModal(false)}>
          <View style={[T.sheet, { backgroundColor: "#0F0D1A" }]} onStartShouldSetResponder={() => true}>
            <View style={T.sheetHandle} />
            <Text style={[T.sheetTitle, { color: "#fff" }]}>Novo criativo</Text>
            <Text style={{ fontSize: 14, color: MUTED, fontFamily: "SpaceGrotesk_400Regular" }}>Crie manualmente ou deixe a JADE gerar</Text>
            <View style={{ flexDirection: "row", gap: 8 }}>
              {(["video","imagem","carrossel"] as Creative["type"][]).map((tp) => (
                <TouchableOpacity
                  key={tp}
                  style={[T.levelPill, { flex: 1, backgroundColor: criatType === tp ? "rgba(255,0,128,0.08)" : SURF, borderColor: criatType === tp ? PINK : BORD }]}
                  onPress={() => { Haptics.selectionAsync(); setCriatType(tp); }}
                  activeOpacity={0.8}
                >
                  {typeIcon(tp)}
                  <Text style={{ fontSize: 12, color: criatType === tp ? "#fff" : MUTED, fontFamily: "SpaceGrotesk_500Medium", textAlign: "center", marginTop: 4 }}>
                    {tp === "video" ? "Vídeo" : tp === "imagem" ? "Imagem" : "Carrossel"}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <TextInput
              style={[T.levelPill, { color: "#fff", borderColor: BORD, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, fontFamily: "SpaceGrotesk_400Regular", height: 48 }]}
              placeholder="Nome do criativo"
              placeholderTextColor={MUTED}
              value={criatName}
              onChangeText={setCriatName}
              returnKeyType="done"
            />
            {!criatName.trim() && (
              <TouchableOpacity
                style={[T.sheetBtn, { backgroundColor: SURF, borderWidth: 1, borderColor: BORD, opacity: criatGen ? 0.7 : 1 }]}
                disabled={criatGen}
                onPress={() => {
                  setCriatGen(true);
                  setTimeout(() => {
                    const names: Record<Creative["type"], string[]> = {
                      video:     ["Vídeo especial de lançamento", "Reels produto em destaque", "Vídeo depoimento cliente"],
                      imagem:    ["Card oferta especial", "Post produto premium", "Banner promoção relâmpago"],
                      carrossel: ["Carrossel benefícios", "Carrossel antes e depois", "Carrossel produtos top"],
                    };
                    const opts = names[criatType];
                    setCriatName(opts[Math.floor(Math.random() * opts.length)]);
                    setCriatGen(false);
                  }, 1200);
                }}
                activeOpacity={0.85}
              >
                <Feather name="zap" size={15} color={PINK} />
                <Text style={[T.sheetBtnText, { color: PINK }]}>{criatGen ? "Gerando…" : "JADE sugerir nome"}</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[T.sheetBtn, { opacity: criatName.trim() ? 1 : 0.4 }]}
              onPress={handleCriarCriativo}
              disabled={!criatName.trim()}
              activeOpacity={0.85}
            >
              <Feather name="plus" size={15} color="#fff" />
              <Text style={T.sheetBtnText}>Criar criativo</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

// ─── RELATÓRIOS ─────────────────────────────────────────────────────────────────
function RelatoriosTab({ colors }: { colors: any }) {
  const maxLeads = Math.max(...LEADS_DIA);

  const METRICS = [
    { label: "Investido",   value: "R$610", change: "+12%", up: true  },
    { label: "Leads",       value: "29",    change: "+31%", up: true  },
    { label: "CPL",         value: "R$21",  change: "-8%",  up: false },
    { label: "ROAS",        value: "2.7x",  change: "+5%",  up: true  },
    { label: "CTR",         value: "3.4%",  change: "+0.8%",up: true  },
    { label: "Conversões",  value: "12",    change: "+25%", up: true  },
  ];

  const TOP_CRIAT = [
    { pos: 1, name: "Vídeo hambúrguer", result: "12 leads" },
    { pos: 2, name: "Card promoção",    result: "8 leads"  },
    { pos: 3, name: "Story oferta",     result: "5 leads"  },
  ];

  return (
    <View style={{ paddingHorizontal: 16, gap: 16 }}>
      {/* Resumo JADE */}
      <View style={[T.heroCard, { backgroundColor: "rgba(255,0,128,0.05)", borderColor: "rgba(255,0,128,0.15)" }]}>
        <Text style={{ fontSize: 10, color: PINK, fontFamily: "SpaceGrotesk_700Bold", letterSpacing: 1, marginBottom: 4 }}>RESUMO DA JADE</Text>
        <Text style={[T.heroText, { color: "rgba(255,255,255,0.85)" }]}>
          Você investiu{" "}
          <Text style={{ fontFamily: "SpaceGrotesk_700Bold", color: "#fff" }}>R$610</Text>
          {" "}e gerou{" "}
          <Text style={{ fontFamily: "SpaceGrotesk_700Bold", color: "#fff" }}>29 leads</Text>
          {" "}este mês. CPL caiu 8% e "Vídeo hambúrguer" está dominando o feed. Quinta-feira é seu melhor dia.
        </Text>
      </View>

      {/* Métricas */}
      <View style={T.metricsGrid}>
        {METRICS.map((m, i) => (
          <View key={i} style={[T.metCard, { backgroundColor: SURF, borderColor: BORD }]}>
            <Text style={[T.metValue, { color: "#fff" }]}>{m.value}</Text>
            <Text style={[T.metLabel, { color: MUTED }]}>{m.label}</Text>
            <Text style={{ fontSize: 11, color: m.up ? "rgba(255,255,255,0.6)" : "rgba(255,255,255,0.35)", fontFamily: "SpaceGrotesk_500Medium", marginTop: 3 }}>
              {m.up ? "↑" : "↓"} {m.change}
            </Text>
          </View>
        ))}
      </View>

      {/* Gráfico barras */}
      <View style={[T.chartCard, { backgroundColor: SURF, borderColor: BORD }]}>
        <Text style={[T.chartTitle, { color: "#fff" }]}>Leads por dia</Text>
        <View style={T.chartBars}>
          {LEADS_DIA.map((v, i) => (
            <View key={i} style={T.barCol}>
              <Text style={[T.barValue, { color: i === BEST_DAY ? "#fff" : MUTED }]}>{v}</Text>
              <View style={T.barTrack}>
                <View style={[T.barFill, {
                  height: `${Math.round((v / maxLeads) * 100)}%` as any,
                  backgroundColor: i === BEST_DAY ? PINK : "rgba(255,255,255,0.08)",
                }]} />
              </View>
              <Text style={[T.barDay, { color: i === BEST_DAY ? PINK : MUTED }]}>{DIAS[i]}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Top criativos */}
      <View style={[T.rankCard, { backgroundColor: SURF, borderColor: BORD }]}>
        <Text style={[T.rankTitle, { color: "#fff" }]}>Top criativos</Text>
        {TOP_CRIAT.map((item) => (
          <View key={item.pos} style={T.rankRow}>
            <Text style={{ fontSize: 13, color: MUTED, fontFamily: "SpaceGrotesk_700Bold", width: 24 }}>#{item.pos}</Text>
            <Text style={[T.rankName, { color: "#fff" }]} numberOfLines={1}>{item.name}</Text>
            <Text style={{ fontSize: 13, color: MUTED, fontFamily: "SpaceGrotesk_500Medium" }}>{item.result}</Text>
          </View>
        ))}
      </View>

      <TouchableOpacity style={T.exportBtn} onPress={() => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert("Relatório gerado", "Seu relatório de marketing foi preparado com sucesso.", [{ text: "OK" }]);
      }} activeOpacity={0.85}>
        <Feather name="file-text" size={16} color="#fff" />
        <Text style={T.exportBtnText}>Exportar PDF</Text>
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </View>
  );
}

// ─── MODO AUTOMÁTICO ────────────────────────────────────────────────────────────
function ModoAutomaticoView({ colors }: { colors: any }) {
  const [level,   setLevel]   = useState<AutoLevel>("semi");
  const [alertas, setAlertas] = useState(true);
  const [aprovar, setAprovar] = useState(false);

  const LEVELS: { id: AutoLevel; label: string; desc: string }[] = [
    { id: "assistido",  label: "Assistido",  desc: "JADE sugere, você aprova" },
    { id: "semi",       label: "Semi-auto",  desc: "Age em limites pré-definidos" },
    { id: "automatico", label: "Automático", desc: "JADE gerencia tudo" },
  ];

  return (
    <View style={{ paddingHorizontal: 16, gap: 14 }}>
      <View style={[T.autoSection, { backgroundColor: SURF, borderColor: BORD }]}>
        <Text style={[T.autoSectionTitle, { color: "#fff" }]}>Nível de automação</Text>
        <View style={T.levelRow}>
          {LEVELS.map((l) => (
            <TouchableOpacity
              key={l.id}
              style={[T.levelPill, {
                backgroundColor: level === l.id ? "rgba(255,0,128,0.08)" : "transparent",
                borderColor:     level === l.id ? PINK : BORD,
              }]}
              onPress={() => { Haptics.selectionAsync(); setLevel(l.id); }}
              activeOpacity={0.85}
            >
              <Text style={{ fontSize: 13, color: level === l.id ? "#fff" : MUTED, fontFamily: "SpaceGrotesk_700Bold", textAlign: "center" }}>{l.label}</Text>
              <Text style={{ fontSize: 11, color: MUTED, fontFamily: "SpaceGrotesk_400Regular", textAlign: "center", marginTop: 2 }}>{l.desc}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={[T.autoSection, { backgroundColor: SURF, borderColor: BORD }]}>
        <Text style={[T.autoSectionTitle, { color: "#fff" }]}>O que a JADE está fazendo</Text>
        <View style={{ gap: 10, marginTop: 4 }}>
          {AUTO_FEED.map((text, i) => (
            <View key={i} style={T.feedRow}>
              <View style={[T.feedDot, { backgroundColor: i === 0 ? PINK : "rgba(255,255,255,0.2)" }]} />
              <Text style={[T.feedText, { color: MUTED }]}>{text}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={[T.autoSection, { backgroundColor: SURF, borderColor: BORD }]}>
        <Text style={[T.autoSectionTitle, { color: "#fff" }]}>Limites da JADE</Text>
        <View style={[T.limitRow, { borderColor: BORD }]}>
          <Feather name="dollar-sign" size={15} color={MUTED} />
          <Text style={[T.limitLabel, { color: "#fff" }]}>Orçamento máximo / dia</Text>
          <Text style={[T.limitValue, { color: PINK }]}>R$50</Text>
        </View>
        <View style={T.toggleRow}>
          <View style={{ flex: 1 }}>
            <Text style={[T.toggleLabel, { color: "#fff" }]}>Alertas automáticos</Text>
            <Text style={[T.toggleSub, { color: MUTED }]}>Notificar quando CPL sair da meta</Text>
          </View>
          <Switch value={alertas} onValueChange={setAlertas} trackColor={{ true: PINK }} thumbColor="#fff" />
        </View>
        <View style={T.toggleRow}>
          <View style={{ flex: 1 }}>
            <Text style={[T.toggleLabel, { color: "#fff" }]}>Aprovar antes de escalar</Text>
            <Text style={[T.toggleSub, { color: MUTED }]}>Confirmação para aumentar orçamento</Text>
          </View>
          <Switch value={aprovar} onValueChange={setAprovar} trackColor={{ true: PINK }} thumbColor="#fff" />
        </View>
      </View>

      <View style={{ height: 40 }} />
    </View>
  );
}

// ─── AGENDA ─────────────────────────────────────────────────────────────────────
type Platform_ = "Instagram" | "Facebook" | "LinkedIn";
interface ScheduledPost { id: string; platform: Platform_; content: string; dateLabel: string; dateIso: string; generated: boolean; }

const PLAT_META: Record<Platform_, { icon: string; deeplink: string }> = {
  Instagram: { icon: "instagram", deeplink: "instagram://camera"      },
  Facebook:  { icon: "facebook",  deeplink: "fb://composer/"           },
  LinkedIn:  { icon: "linkedin",  deeplink: "linkedin://messaging/new" },
};
const SEED_POSTS: ScheduledPost[] = [
  { id: "p1", platform: "Instagram", content: "🚀 Promoção especial de julho! Aproveite 20% de desconto em todos os produtos até sexta-feira. Quantidade limitada! #delivery #promoção", dateLabel: "Sex 25/07 às 12:00", dateIso: "2025-07-25T12:00:00", generated: true },
  { id: "p2", platform: "Facebook",  content: "Você sabia que 87% dos clientes pesquisam online antes de comprar? Esteja presente onde seus clientes estão. Fale conosco e comece hoje!", dateLabel: "Sáb 26/07 às 10:00", dateIso: "2025-07-26T10:00:00", generated: false },
];
const API_BASE_MKT = Platform.OS === "web" ? "" : `https://${process.env.EXPO_PUBLIC_DOMAIN ?? ""}`;

function AgendaTab({ colors }: { colors: any }) {
  return <AgendaTabInner colors={colors} />;
}

function AgendaTabInner({ colors }: { colors: any }) {
  const [posts, setPosts]         = useState<ScheduledPost[]>(SEED_POSTS);
  const [platform, setPlatform]   = useState<Platform_>("Instagram");
  const [content, setContent]     = useState("");
  const [dateLabel, setDateLabel] = useState("");
  const [generating, setGenerating] = useState(false);
  const [saved, setSaved]         = useState(false);
  const PLATFORMS: Platform_[]    = ["Instagram", "Facebook", "LinkedIn"];

  const generateContent = async () => {
    setGenerating(true);
    try {
      const res  = await fetch(`${API_BASE_MKT}/api/jade/chat`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ messages: [{ role: "user", content: `Crie um post para ${platform} para um negócio brasileiro. Máximo 200 palavras. Só o texto do post.` }] }) });
      const data = (await res.json()) as { message?: string; response?: string };
      const text = stripMarkdown(data.message?.trim() || data.response?.trim() || "") || "";
      if (text) setContent(text);
    } catch { setContent("✨ Promoção especial! Aproveite nossa oferta exclusiva hoje. Quantidade limitada — entre em contato agora! 🔥 #promoção"); }
    finally { setGenerating(false); }
  };

  const savePost = () => {
    if (!content.trim() || !dateLabel.trim()) return;
    setPosts((prev) => [{ id: Date.now().toString(), platform, content: content.trim(), dateLabel: dateLabel.trim(), dateIso: new Date().toISOString(), generated: false }, ...prev]);
    setContent(""); setDateLabel(""); setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };
  const openApp = (p: Platform_) => {
    Linking.openURL(PLAT_META[p].deeplink).catch(() => Linking.openURL(p === "Instagram" ? "https://instagram.com" : p === "Facebook" ? "https://facebook.com" : "https://linkedin.com"));
  };

  return (
    <View style={{ paddingHorizontal: 16, gap: 16 }}>
      <View style={[AG.card, { backgroundColor: SURF, borderColor: BORD }]}>
        <Text style={[AG.cardTitle, { color: "#fff" }]}>Agendar novo post</Text>
        <View style={AG.platRow}>
          {PLATFORMS.map((p) => {
            const sel = platform === p;
            return (
              <TouchableOpacity key={p} style={[AG.platPill, { backgroundColor: sel ? "rgba(255,0,128,0.08)" : "transparent", borderColor: sel ? PINK : BORD }]} onPress={() => { Haptics.selectionAsync(); setPlatform(p); }} activeOpacity={0.8}>
                <Feather name={PLAT_META[p].icon as any} size={13} color={sel ? "#fff" : MUTED} />
                <Text style={[AG.platLabel, { color: sel ? "#fff" : MUTED }]}>{p}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
        <TextInput style={[AG.contentInput, { backgroundColor: "transparent", borderColor: BORD, color: "#fff" }]} placeholder="Conteúdo do post" placeholderTextColor={MUTED} multiline numberOfLines={5} value={content} onChangeText={setContent} maxLength={600} />
        <TouchableOpacity style={[AG.jadeGenBtn, { backgroundColor: SURF, borderWidth: 1, borderColor: BORD, opacity: generating ? 0.7 : 1 }]} onPress={generateContent} disabled={generating} activeOpacity={0.85}>
          <Feather name="zap" size={14} color={PINK} />
          <Text style={[AG.jadeGenText, { color: PINK }]}>{generating ? "Gerando…" : "JADE gerar conteúdo"}</Text>
        </TouchableOpacity>
        <TextInput style={[AG.dateInput, { backgroundColor: "transparent", borderColor: BORD, color: "#fff" }]} placeholder="Data e hora (ex: Sex 25/07 às 18:00)" placeholderTextColor={MUTED} value={dateLabel} onChangeText={setDateLabel} />
        <TouchableOpacity style={[AG.saveBtn, { backgroundColor: saved ? SURF : PINK, opacity: (!content.trim() || !dateLabel.trim()) ? 0.5 : 1, borderWidth: saved ? 1 : 0, borderColor: BORD }]} onPress={savePost} disabled={!content.trim() || !dateLabel.trim()} activeOpacity={0.85}>
          <Feather name={saved ? "check" : "calendar"} size={15} color="#fff" />
          <Text style={AG.saveBtnText}>{saved ? "Agendado!" : "Agendar post"}</Text>
        </TouchableOpacity>
      </View>

      <Text style={[AG.listTitle, { color: "#fff" }]}>Posts agendados ({posts.length})</Text>
      {posts.map((post) => (
        <View key={post.id} style={[AG.postCard, { backgroundColor: SURF, borderColor: BORD }]}>
          <View style={AG.postHeader}>
            <Text style={{ fontSize: 12, color: MUTED, fontFamily: "SpaceGrotesk_500Medium" }}>{post.platform}</Text>
            {post.generated && <Text style={{ fontSize: 11, color: PINK, fontFamily: "SpaceGrotesk_600SemiBold" }}>IA</Text>}
            <View style={{ flex: 1 }} />
            <Text style={{ fontSize: 11, color: MUTED, fontFamily: "SpaceGrotesk_400Regular" }}>{post.dateLabel}</Text>
          </View>
          <Text style={[AG.postContent, { color: "rgba(255,255,255,0.75)" }]} numberOfLines={3}>{post.content}</Text>
          <View style={AG.postActions}>
            <TouchableOpacity style={[AG.actionBtn, { backgroundColor: PINK }]} onPress={() => openApp(post.platform)} activeOpacity={0.85}>
              <Feather name="external-link" size={13} color="#fff" />
              <Text style={AG.actionBtnText}>Postar agora</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[AG.deleteBtn, { borderColor: BORD }]} onPress={() => { setPosts((prev) => prev.filter((p) => p.id !== post.id)); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }} activeOpacity={0.7}>
              <Feather name="trash-2" size={13} color={MUTED} />
            </TouchableOpacity>
          </View>
        </View>
      ))}
      {posts.length === 0 && (
        <View style={{ alignItems: "center", paddingVertical: 30, gap: 8 }}>
          <Feather name="calendar" size={24} color={MUTED} />
          <Text style={{ color: MUTED, fontSize: 14, fontFamily: "SpaceGrotesk_400Regular" }}>Nenhum post agendado</Text>
        </View>
      )}
      <View style={{ height: 40 }} />
    </View>
  );
}

const AG = StyleSheet.create({
  card:         { borderRadius: 16, borderWidth: 1, padding: 16, gap: 12 },
  cardTitle:    { fontSize: 16, fontFamily: "SpaceGrotesk_700Bold" },
  platRow:      { flexDirection: "row", gap: 8 },
  platPill:     { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, borderWidth: 1 },
  platLabel:    { fontSize: 13, fontFamily: "SpaceGrotesk_600SemiBold" },
  contentInput: { borderRadius: 12, borderWidth: 1, padding: 12, fontSize: 15, fontFamily: "SpaceGrotesk_400Regular", minHeight: 110, textAlignVertical: "top" },
  jadeGenBtn:   { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7, borderRadius: 12, height: 42 },
  jadeGenText:  { fontSize: 14, fontFamily: "SpaceGrotesk_600SemiBold" },
  dateInput:    { borderRadius: 12, borderWidth: 1, padding: 12, fontSize: 15, fontFamily: "SpaceGrotesk_400Regular", height: 44 },
  saveBtn:      { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 12, height: 46 },
  saveBtnText:  { color: "#fff", fontSize: 15, fontFamily: "SpaceGrotesk_700Bold" },
  listTitle:    { fontSize: 16, fontFamily: "SpaceGrotesk_700Bold" },
  postCard:     { borderRadius: 14, borderWidth: 1, padding: 14, gap: 10 },
  postHeader:   { flexDirection: "row", alignItems: "center", gap: 8 },
  postContent:  { fontSize: 14, fontFamily: "SpaceGrotesk_400Regular", lineHeight: 20 },
  postActions:  { flexDirection: "row", gap: 8 },
  actionBtn:    { flexDirection: "row", alignItems: "center", gap: 5, flex: 1, justifyContent: "center", borderRadius: 9, height: 36 },
  actionBtnText:{ color: "#fff", fontSize: 13, fontFamily: "SpaceGrotesk_600SemiBold" },
  deleteBtn:    { width: 36, height: 36, borderRadius: 9, borderWidth: 1, alignItems: "center", justifyContent: "center" },
});

// ─── SCREEN ─────────────────────────────────────────────────────────────────────
export default function MarketingScreen() {
  const colors  = useColors();
  const insets  = useSafeAreaInsets();
  const router  = useRouter();
  const topPad    = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 84 : insets.bottom + 60;
  const [activeTab, setActiveTab] = useState<TabId>("campanhas");
  const [modoAuto,  setModoAuto]  = useState(false);

  const TABS: { id: TabId; label: string }[] = [
    { id: "campanhas",  label: "Campanhas"  },
    { id: "criativos",  label: "Criativos"  },
    { id: "agenda",     label: "Agenda"     },
    { id: "relatorios", label: "Relatórios" },
  ];

  return (
    <View style={[R.container, { backgroundColor: BG }]}>
      <View style={[R.header, { paddingTop: topPad + 8 }]}>
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.8} style={R.backBtn}>
          <Feather name="arrow-left" size={20} color="#fff" />
        </TouchableOpacity>
        <Text style={R.title}>Marketing IA</Text>
        <View style={R.autoToggleRow}>
          <Text style={[R.autoLabel, { color: modoAuto ? PINK : MUTED }]}>Auto</Text>
          <Switch
            value={modoAuto}
            onValueChange={(v) => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); setModoAuto(v); }}
            trackColor={{ false: "rgba(255,255,255,0.08)", true: PINK }}
            thumbColor="#fff"
          />
        </View>
      </View>

      {!modoAuto && (
        <View style={[R.tabBar, { borderBottomColor: BORD }]}>
          {TABS.map((t) => (
            <TouchableOpacity
              key={t.id}
              style={[R.tab, activeTab === t.id && R.tabActive]}
              onPress={() => { Haptics.selectionAsync(); setActiveTab(t.id); }}
              activeOpacity={0.8}
            >
              <Text style={[R.tabText, { color: activeTab === t.id ? "#fff" : MUTED }]}>{t.label}</Text>
              {activeTab === t.id && <View style={R.tabIndicator} />}
            </TouchableOpacity>
          ))}
        </View>
      )}

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingTop: 16, paddingBottom: bottomPad }} keyboardShouldPersistTaps="handled">
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

// ─── STYLES ──────────────────────────────────────────────────────────────────────
const R = StyleSheet.create({
  container:    { flex: 1 },
  header:       { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingBottom: 14, gap: 12 },
  backBtn:      { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.08)", borderWidth: 1, borderColor: "rgba(255,255,255,0.12)" },
  title:        { flex: 1, fontSize: 20, fontFamily: "SpaceGrotesk_700Bold", color: "#fff" },
  autoToggleRow:{ flexDirection: "row", alignItems: "center", gap: 6 },
  autoLabel:    { fontSize: 13, fontFamily: "SpaceGrotesk_600SemiBold" },
  tabBar:       { flexDirection: "row", borderBottomWidth: StyleSheet.hairlineWidth },
  tab:          { flex: 1, alignItems: "center", paddingVertical: 14, position: "relative" },
  tabActive:    {},
  tabText:      { fontSize: 14, fontFamily: "SpaceGrotesk_600SemiBold" },
  tabIndicator: { position: "absolute", bottom: 0, left: "20%", right: "20%", height: 2, backgroundColor: PINK, borderRadius: 1 },
});

const T = StyleSheet.create({
  filterRow:  { paddingHorizontal: 16, gap: 8, marginBottom: 16, flexDirection: "row" },
  filterPill: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1, borderColor: BORD },
  filterText: { fontSize: 14, fontFamily: "SpaceGrotesk_500Medium" },

  campCard:     { borderRadius: 16, borderWidth: 1, padding: 16, gap: 12 },
  campCardHead: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  campName:     { fontSize: 16, fontFamily: "SpaceGrotesk_700Bold" },
  statsGrid:    { flexDirection: "row", gap: 8 },
  statItem:     { flex: 1, alignItems: "center", gap: 2 },
  statLabel:    { fontSize: 11, fontFamily: "SpaceGrotesk_400Regular" },
  statVal:      { fontSize: 15, fontFamily: "SpaceGrotesk_700Bold" },
  budgetRow:    { gap: 5 },
  budgetBar:    { height: 4, borderRadius: 2, overflow: "hidden" },
  budgetFill:   { height: "100%", borderRadius: 2 },
  budgetLabel:  { fontSize: 11, fontFamily: "SpaceGrotesk_400Regular", textAlign: "right" },

  fab:     { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: PINK, borderRadius: 24, paddingVertical: 13, paddingHorizontal: 22, alignSelf: "center", marginTop: 20, marginBottom: 12 },
  fabText: { color: "#fff", fontSize: 15, fontFamily: "SpaceGrotesk_700Bold" },

  overlay:      { flex: 1, backgroundColor: "rgba(0,0,0,0.75)", justifyContent: "flex-end" },
  sheet:        { borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, gap: 12, paddingBottom: 40 },
  sheetHandle:  { width: 36, height: 4, borderRadius: 2, backgroundColor: BORD, alignSelf: "center", marginBottom: 8 },
  sheetTitle:   { fontSize: 20, fontFamily: "SpaceGrotesk_700Bold" },
  objCard:      { flexDirection: "row", alignItems: "center", gap: 14, padding: 14, borderRadius: 14, borderWidth: 1 },
  sheetBtn:     { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: PINK, borderRadius: 14, height: 50, marginTop: 4 },
  sheetBtnText: { color: "#fff", fontSize: 15, fontFamily: "SpaceGrotesk_700Bold" },

  sectionLabel:   { fontSize: 15, fontFamily: "SpaceGrotesk_700Bold", marginBottom: 10 },
  topGrid:        { flexDirection: "row", gap: 10 },
  topCard:        { flex: 1, borderRadius: 14, borderWidth: 1, padding: 12, gap: 5, alignItems: "flex-start" },
  topIcon:        { width: 34, height: 34, borderRadius: 10, alignItems: "center", justifyContent: "center", marginBottom: 2 },
  topName:        { fontSize: 14, fontFamily: "SpaceGrotesk_600SemiBold" },
  topImpr:        { fontSize: 11, fontFamily: "SpaceGrotesk_400Regular" },

  jadeSuggestion: { flexDirection: "row", alignItems: "flex-start", gap: 10, padding: 14, borderRadius: 12, borderLeftWidth: 2, borderRightWidth: 0, borderTopWidth: 0, borderBottomWidth: 0 },
  jadeSuggText:   { fontSize: 14, fontFamily: "SpaceGrotesk_400Regular", lineHeight: 20 },

  criatGrid:      { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  novoCriatCard:  { width: "47%", aspectRatio: 0.9, borderRadius: 14, borderWidth: 1, alignItems: "center", justifyContent: "center", gap: 8 },
  criatCard:      { width: "47%", borderRadius: 14, borderWidth: 1, padding: 12, gap: 5 },
  criatIcon:      { width: 34, height: 34, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  criatName:      { fontSize: 14, fontFamily: "SpaceGrotesk_600SemiBold" },
  criatCamp:      { fontSize: 11, fontFamily: "SpaceGrotesk_400Regular" },

  heroCard:      { borderRadius: 16, padding: 18, gap: 8, borderWidth: 1 },
  heroText:      { fontSize: 15, fontFamily: "SpaceGrotesk_400Regular", lineHeight: 22 },

  metricsGrid:   { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  metCard:       { width: "30.5%", borderRadius: 12, borderWidth: 1, padding: 12, gap: 3, alignItems: "flex-start", flexGrow: 1 },
  metValue:      { fontSize: 18, fontFamily: "SpaceGrotesk_700Bold" },
  metLabel:      { fontSize: 11, fontFamily: "SpaceGrotesk_400Regular" },

  chartCard:   { borderRadius: 16, borderWidth: 1, padding: 16 },
  chartTitle:  { fontSize: 15, fontFamily: "SpaceGrotesk_600SemiBold", marginBottom: 12 },
  chartBars:   { flexDirection: "row", gap: 6, height: 110, alignItems: "flex-end" },
  barCol:      { flex: 1, alignItems: "center", gap: 4, height: "100%" },
  barValue:    { fontSize: 11, fontFamily: "SpaceGrotesk_600SemiBold" },
  barTrack:    { flex: 1, width: "100%", justifyContent: "flex-end" },
  barFill:     { width: "100%", borderRadius: 3, minHeight: 4 },
  barDay:      { fontSize: 10, fontFamily: "SpaceGrotesk_400Regular" },

  rankCard:    { borderRadius: 16, borderWidth: 1, padding: 16, gap: 12 },
  rankTitle:   { fontSize: 15, fontFamily: "SpaceGrotesk_600SemiBold", marginBottom: 2 },
  rankRow:     { flexDirection: "row", alignItems: "center", gap: 10 },
  rankName:    { flex: 1, fontSize: 14, fontFamily: "SpaceGrotesk_500Medium" },

  exportBtn:     { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: PINK, borderRadius: 14, height: 50 },
  exportBtnText: { color: "#fff", fontSize: 15, fontFamily: "SpaceGrotesk_700Bold" },

  autoSection:      { borderRadius: 16, borderWidth: 1, padding: 16, gap: 12 },
  autoSectionTitle: { fontSize: 15, fontFamily: "SpaceGrotesk_700Bold" },
  levelRow:         { flexDirection: "row", gap: 8 },
  levelPill:        { flex: 1, borderRadius: 12, padding: 12, alignItems: "center", gap: 3, borderWidth: 1 },
  feedRow:          { flexDirection: "row", gap: 10, alignItems: "flex-start" },
  feedDot:          { width: 6, height: 6, borderRadius: 3, marginTop: 6 },
  feedText:         { flex: 1, fontSize: 14, fontFamily: "SpaceGrotesk_400Regular", lineHeight: 19 },
  limitRow:         { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth },
  limitLabel:       { flex: 1, fontSize: 15, fontFamily: "SpaceGrotesk_400Regular" },
  limitValue:       { fontSize: 15, fontFamily: "SpaceGrotesk_700Bold" },
  toggleRow:        { flexDirection: "row", alignItems: "center", gap: 12 },
  toggleLabel:      { fontSize: 15, fontFamily: "SpaceGrotesk_500Medium" },
  toggleSub:        { fontSize: 12, fontFamily: "SpaceGrotesk_400Regular", marginTop: 1 },
});
