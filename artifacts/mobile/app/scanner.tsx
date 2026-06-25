import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as WebBrowser from "expo-web-browser";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Linking,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";
import { useApp } from "@/context/AppContext";
import type { Lead } from "@/context/AppContext";
import { useRadarSearches } from "@/hooks/useRadarSearches";
import { BRAZIL_STATES } from "@/constants/brazil-locations";
import { useLocation } from "@/context/LocationContext";

// ─── Radar constants ──────────────────────────────────────────────────────────
const RAIO_OPTIONS = [
  { label: "1 km",  value: 1000  },
  { label: "5 km",  value: 5000  },
  { label: "10 km", value: 10000 },
  { label: "25 km", value: 25000 },
  { label: "50 km", value: 50000 },
];

const SEGMENTOS = [
  "Restaurantes & Food",
  "Clínicas & Saúde",
  "Beleza & Estética",
  "Academias & Fitness",
  "Varejo & Comércio",
  "Serviços Automotivos",
  "Educação & Cursos",
  "Imobiliárias",
  "Pet Shops",
  "Construção & Reforma",
  "Tecnologia & Software",
  "Advocacia & Contabilidade",
  "Turismo & Hotelaria",
  "Outros",
];

// Lista achatada de cidades (cidade + UF) para o seletor único
const ALL_CIDADES = BRAZIL_STATES.flatMap((s) =>
  s.cidades.map((c) => ({ cidade: c, uf: s.sigla })),
).sort((a, b) => a.cidade.localeCompare(b.cidade, "pt-BR"));

const HISTORY_KEY = "@jade_ia:radar_history";

const PACOTES_BUSCAS = [
  { id: "50",   label: "+50 buscas",     preco: "R$29,90",  desc: "Ideal para testes" },
  { id: "200",  label: "+200 buscas",    preco: "R$79,90",  desc: "Mais popular" },
  { id: "1000", label: "+1.000 buscas",  preco: "R$179,90", desc: "Melhor custo-benefício" },
];

interface RadarLead {
  placeId: string;
  name: string;
  address: string;
  rating: number | null;
  totalRatings: number;
  status: string;
  phone: string;
  hasPhone: boolean;
}

interface RadarHistoryItem {
  id: string;
  segmento: string;
  cidade: string;
  estado: string;
  bairro: string;
  count: number;
  ts: number;
}

const API_BASE =
  Platform.OS === "web"
    ? ""
    : `https://${process.env.EXPO_PUBLIC_DOMAIN ?? ""}`;

function openMaps(place: { name: string; address: string }) {
  const query = encodeURIComponent(place.name + " " + place.address);
  const url = Platform.OS === "ios"
    ? `maps:?q=${query}`
    : `geo:0,0?q=${query}`;
  Linking.canOpenURL(url).then((ok) => {
    if (ok) Linking.openURL(url);
    else Linking.openURL(`https://maps.google.com/?q=${query}`);
  });
}

function formatTimeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const min = Math.floor(diff / 60000);
  if (min < 1) return "agora";
  if (min < 60) return `${min}min atrás`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}h atrás`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d atrás`;
  const mo = Math.floor(d / 30);
  return `${mo}mês atrás`;
}

export default function ScannerScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { addLead, leads } = useApp();
  const { remaining, canSearch, decrement, addExtra } = useRadarSearches();

  // ── UI state ───────────────────────────────────────────────────────────────
  const [tab, setTab]               = useState<"buscar" | "historico">("buscar");
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // ── Radar (Buscar Leads) state ─────────────────────────────────────────────
  const [radarSegmento,    setRadarSegmento]    = useState("");
  const [radarEstado,      setRadarEstado]      = useState("");
  const [radarCidade,      setRadarCidade]      = useState("");
  const [radarBairro,      setRadarBairro]      = useState("");
  const [radarRaioIdx]                          = useState(1); // 5 km default (interno)
  const [radarLoading,     setRadarLoading]     = useState(false);
  const [radarResults,     setRadarResults]     = useState<RadarLead[]>([]);
  const [radarSearched,    setRadarSearched]    = useState(false);
  const [radarError,       setRadarError]       = useState("");
  const [radarAddedIds,    setRadarAddedIds]    = useState<Set<string>>(new Set());
  const [showLimiteModal,  setShowLimiteModal]  = useState(false);
  const [showLojaModal,    setShowLojaModal]    = useState(false);
  const [selectedPacote,   setSelectedPacote]   = useState<string | null>(null);
  const [buyingPacote,     setBuyingPacote]     = useState(false);
  const [showSegmentoPicker, setShowSegmentoPicker] = useState(false);
  const [showCidadePicker, setShowCidadePicker] = useState(false);
  const [cidadeFilter,     setCidadeFilter]     = useState("");

  // ── Histórico ──────────────────────────────────────────────────────────────
  const [history, setHistory] = useState<RadarHistoryItem[]>([]);
  useEffect(() => {
    AsyncStorage.getItem(HISTORY_KEY).then((raw) => {
      if (!raw) return;
      try { setHistory(JSON.parse(raw) as RadarHistoryItem[]); } catch { /* ignore */ }
    });
  }, []);

  const persistHistory = (items: RadarHistoryItem[]) => {
    setHistory(items);
    AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(items)).catch(() => {});
  };

  const { city: ctxCity, state: ctxState } = useLocation();
  useEffect(() => {
    if (ctxState && !radarEstado) {
      setRadarEstado(ctxState);
      if (ctxCity) setRadarCidade(ctxCity);
    }
  }, [ctxState, ctxCity]);

  // Pre-fill from empresa config
  useEffect(() => {
    AsyncStorage.getItem("minha_empresa").then((raw) => {
      if (!raw) return;
      try {
        const parsed = JSON.parse(raw);
        if (parsed.segmento) setRadarSegmento(parsed.segmento);
        if (parsed.estado)   setRadarEstado(parsed.estado);
        if (parsed.cidade)   setRadarCidade(parsed.cidade);
      } catch { /* ignore */ }
    });
  }, []);

  const runRadarSearch = async (override?: { segmento: string; cidade: string; estado: string; bairro: string }) => {
    const segmento = override?.segmento ?? radarSegmento;
    const cidade   = override?.cidade   ?? radarCidade;
    const estado   = override?.estado   ?? radarEstado;
    const bairro   = override?.bairro   ?? radarBairro;

    if (!canSearch) { setShowLimiteModal(true); return; }
    if (!segmento || !cidade) { setRadarError("Selecione o segmento e a cidade para buscar."); return; }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setRadarError("");
    setRadarLoading(true);
    setRadarSearched(true);
    setRadarResults([]);
    decrement();

    try {
      const body: Record<string, unknown> = {
        segmento,
        cidade,
        estado,
        bairro,
        raio: RAIO_OPTIONS[radarRaioIdx]!.value,
      };
      const res = await fetch(`${API_BASE}/api/places/radar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = (await res.json()) as { results?: RadarLead[]; error?: string };
      if (!res.ok) { setRadarError(data.error ?? "Erro ao buscar leads."); return; }
      const fetched = data.results ?? [];
      setRadarResults(fetched);
      if (fetched.length === 0) {
        setRadarError("Nenhum resultado. Tente outro segmento ou cidade.");
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        const entry: RadarHistoryItem = {
          id: Date.now().toString(),
          segmento, cidade, estado, bairro,
          count: fetched.length,
          ts: Date.now(),
        };
        persistHistory([entry, ...history].slice(0, 30));
      }
    } catch {
      setRadarError("Erro de conexão. Verifique sua internet.");
    } finally {
      setRadarLoading(false);
    }
  };

  const radarSearch = () => runRadarSearch();

  const applyHistory = (item: RadarHistoryItem) => {
    setRadarSegmento(item.segmento);
    setRadarCidade(item.cidade);
    setRadarEstado(item.estado);
    setRadarBairro(item.bairro ?? "");
    setSearchQuery("");
    setShowSearch(false);
    setTab("buscar");
    runRadarSearch({ segmento: item.segmento, cidade: item.cidade, estado: item.estado, bairro: item.bairro ?? "" });
  };

  const removeHistoryItem = (id: string) => {
    Haptics.selectionAsync();
    persistHistory(history.filter((h) => h.id !== id));
  };

  const clearHistory = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    persistHistory([]);
  };

  const handleRadarAdd = (place: RadarLead) => {
    const existingPhones = leads.map((l: Lead) => l.phone).filter(Boolean);
    if (place.hasPhone && existingPhones.includes(place.phone)) {
      setRadarAddedIds((prev) => new Set([...prev, place.placeId]));
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const words = place.name.trim().split(/\s+/);
    const initials = words.length >= 2
      ? (words[0]![0]! + words[1]![0]!).toUpperCase()
      : place.name.slice(0, 2).toUpperCase();
    const COLORS_ARR = ["#FF0080", "#8400FF", "#FF0080", "#8400FF", "#FF0080", "#8400FF"];
    const color = COLORS_ARR[Math.abs(place.placeId.charCodeAt(0)) % COLORS_ARR.length]!;
    const lead: Lead = {
      id:          `radar_${place.placeId}`,
      name:        place.name,
      company:     radarSegmento,
      value:       0,
      phone:       place.phone,
      column:      "novo",
      tag:         "Radar Google",
      tagColor:    "#FF0080",
      time:        "agora",
      initials,
      avatarColor: color,
    };
    addLead(lead);
    setRadarAddedIds((prev) => new Set([...prev, place.placeId]));
  };

  const handleBuyPacote = async () => {
    if (!selectedPacote) return;
    setBuyingPacote(true);
    try {
      const res = await fetch(`${API_BASE}/api/stripe/create-checkout-searches`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pacote: selectedPacote }),
      });
      const data = (await res.json()) as { url?: string; buscas?: number; error?: string };
      if (data.url) {
        setShowLojaModal(false);
        setShowLimiteModal(false);
        await WebBrowser.openBrowserAsync(data.url);
        if (data.buscas) addExtra(data.buscas);
      }
    } catch { /* ignore */ }
    finally { setBuyingPacote(false); }
  };

  const topPad = Platform.OS === "web" ? 24 : insets.top + 4;

  const cidadeDisplay = radarCidade
    ? `${radarCidade}${radarEstado ? ` - ${radarEstado}` : ""}`
    : "";

  const filteredCidades = useMemo(() => {
    const q = cidadeFilter.trim().toLowerCase();
    const list = q
      ? ALL_CIDADES.filter((c) => c.cidade.toLowerCase().includes(q) || c.uf.toLowerCase().includes(q))
      : ALL_CIDADES;
    return list.slice(0, 80);
  }, [cidadeFilter]);

  const filteredHistory = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return history;
    return history.filter(
      (h) =>
        h.segmento.toLowerCase().includes(q) ||
        h.cidade.toLowerCase().includes(q) ||
        (h.bairro ?? "").toLowerCase().includes(q),
    );
  }, [history, searchQuery]);

  const visibleResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return radarResults;
    return radarResults.filter(
      (r) => r.name.toLowerCase().includes(q) || r.address.toLowerCase().includes(q),
    );
  }, [radarResults, searchQuery]);

  const canSubmit = !!radarSegmento && !!radarCidade && !radarLoading;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad, borderBottomColor: colors.border }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <Feather name="chevron-left" size={26} color={colors.text} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Buscar leads</Text>
          <Text style={[styles.headerSub, { color: colors.mutedForeground }]}>
            Encontre empresas e estabelecimentos
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.lupaBtn, { backgroundColor: showSearch ? "#FF008018" : colors.card, borderColor: showSearch ? "#FF008055" : colors.border }]}
          onPress={() => { setShowSearch((v) => !v); if (showSearch) setSearchQuery(""); Haptics.selectionAsync(); }}
          activeOpacity={0.8}
        >
          <Feather name="search" size={18} color={showSearch ? "#FF0080" : colors.mutedForeground} />
        </TouchableOpacity>
      </View>

      {/* Barra de busca (toggle pela lupa) */}
      {showSearch && (
        <View style={[styles.searchBarWrap, { borderBottomColor: colors.border }]}>
          <View style={[styles.searchBarInput, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Feather name="search" size={16} color={colors.mutedForeground} />
            <TextInput
              style={[styles.searchBarText, { color: colors.text }]}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Buscar no radar..."
              placeholderTextColor={colors.mutedForeground}
              autoFocus
            />
            {!!searchQuery && (
              <TouchableOpacity onPress={() => setSearchQuery("")} hitSlop={8}>
                <Feather name="x" size={16} color={colors.mutedForeground} />
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}

      {/* Abas */}
      <View style={[styles.tabsRow, { borderBottomColor: colors.border }]}>
        <TouchableOpacity style={styles.tabBtn} onPress={() => { setTab("buscar"); Haptics.selectionAsync(); }} activeOpacity={0.8}>
          <View style={styles.tabInner}>
            <Feather name="search" size={15} color={tab === "buscar" ? colors.text : colors.mutedForeground} />
            <Text style={[styles.tabText, { color: tab === "buscar" ? colors.text : colors.mutedForeground }]}>Buscar</Text>
          </View>
          {tab === "buscar" && <View style={styles.tabUnderline} />}
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabBtn} onPress={() => { setTab("historico"); Haptics.selectionAsync(); }} activeOpacity={0.8}>
          <View style={styles.tabInner}>
            <Feather name="clock" size={15} color={tab === "historico" ? colors.text : colors.mutedForeground} />
            <Text style={[styles.tabText, { color: tab === "historico" ? colors.text : colors.mutedForeground }]}>Histórico</Text>
            {history.length > 0 && (
              <View style={[styles.tabBadge, { backgroundColor: tab === "historico" ? "#FF0080" : colors.surface }]}>
                <Text style={[styles.tabBadgeText, { color: tab === "historico" ? "#fff" : colors.mutedForeground }]}>{history.length}</Text>
              </View>
            )}
          </View>
          {tab === "historico" && <View style={styles.tabUnderline} />}
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.scrollContent}
      >
        {tab === "buscar" ? (
          <>
            {/* Card de formulário */}
            <View style={[styles.formCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.formCardTitle, { color: colors.text }]}>O que você quer procurar hoje?</Text>
              <Text style={[styles.formCardSub, { color: colors.mutedForeground }]}>
                Preencha os campos abaixo para encontrar empresas.
              </Text>

              {/* Segmento */}
              <View style={styles.field}>
                <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Segmento</Text>
                <TouchableOpacity
                  style={[styles.fieldInput, { backgroundColor: colors.surface, borderColor: showSegmentoPicker ? "#FF008055" : colors.border }]}
                  onPress={() => { setShowSegmentoPicker((v) => !v); setShowCidadePicker(false); Haptics.selectionAsync(); }}
                  activeOpacity={0.8}
                >
                  <Feather name="grid" size={16} color={colors.mutedForeground} style={{ marginRight: 10 }} />
                  <Text style={[styles.fieldInputText, { color: radarSegmento ? colors.text : colors.mutedForeground }]} numberOfLines={1}>
                    {radarSegmento || "Selecione um segmento"}
                  </Text>
                  <Feather name={showSegmentoPicker ? "chevron-up" : "chevron-down"} size={18} color={colors.mutedForeground} />
                </TouchableOpacity>
                {showSegmentoPicker && (
                  <ScrollView style={[styles.dropdown, { backgroundColor: colors.surface, borderColor: colors.border }]} nestedScrollEnabled>
                    {SEGMENTOS.map((s) => (
                      <TouchableOpacity
                        key={s}
                        style={[styles.dropdownItem, s === radarSegmento && { backgroundColor: "#FF008018" }]}
                        onPress={() => { setRadarSegmento(s); setShowSegmentoPicker(false); Haptics.selectionAsync(); }}
                        activeOpacity={0.8}
                      >
                        <Text style={[styles.dropdownItemText, { color: s === radarSegmento ? "#FF0080" : colors.text }]}>{s}</Text>
                        {s === radarSegmento && <Feather name="check" size={15} color="#FF0080" />}
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                )}
              </View>

              {/* Cidade */}
              <View style={styles.field}>
                <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Cidade</Text>
                <TouchableOpacity
                  style={[styles.fieldInput, { backgroundColor: colors.surface, borderColor: showCidadePicker ? "#FF008055" : colors.border }]}
                  onPress={() => { setShowCidadePicker((v) => !v); setShowSegmentoPicker(false); setCidadeFilter(""); Haptics.selectionAsync(); }}
                  activeOpacity={0.8}
                >
                  <Feather name="map-pin" size={16} color={colors.mutedForeground} style={{ marginRight: 10 }} />
                  <Text style={[styles.fieldInputText, { color: radarCidade ? colors.text : colors.mutedForeground }]} numberOfLines={1}>
                    {cidadeDisplay || "Selecione a cidade"}
                  </Text>
                  <Feather name={showCidadePicker ? "chevron-up" : "chevron-down"} size={18} color={colors.mutedForeground} />
                </TouchableOpacity>
                {showCidadePicker && (
                  <View style={[styles.dropdown, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <View style={[styles.dropdownSearch, { borderBottomColor: colors.border }]}>
                      <Feather name="search" size={14} color={colors.mutedForeground} />
                      <TextInput
                        style={[styles.dropdownSearchText, { color: colors.text }]}
                        value={cidadeFilter}
                        onChangeText={setCidadeFilter}
                        placeholder="Filtrar cidade ou UF..."
                        placeholderTextColor={colors.mutedForeground}
                      />
                    </View>
                    <ScrollView style={{ maxHeight: 220 }} nestedScrollEnabled keyboardShouldPersistTaps="handled">
                      {filteredCidades.map((c) => {
                        const selected = c.cidade === radarCidade && c.uf === radarEstado;
                        return (
                          <TouchableOpacity
                            key={`${c.cidade}-${c.uf}`}
                            style={[styles.dropdownItem, selected && { backgroundColor: "#FF008018" }]}
                            onPress={() => {
                              setRadarCidade(c.cidade);
                              setRadarEstado(c.uf);
                              setShowCidadePicker(false);
                              Haptics.selectionAsync();
                            }}
                            activeOpacity={0.8}
                          >
                            <Text style={[styles.dropdownItemText, { color: selected ? "#FF0080" : colors.text }]}>
                              {c.cidade} <Text style={{ color: colors.mutedForeground }}>· {c.uf}</Text>
                            </Text>
                            {selected && <Feather name="check" size={15} color="#FF0080" />}
                          </TouchableOpacity>
                        );
                      })}
                      {filteredCidades.length === 0 && (
                        <Text style={[styles.dropdownEmpty, { color: colors.mutedForeground }]}>Nenhuma cidade encontrada</Text>
                      )}
                    </ScrollView>
                  </View>
                )}
              </View>

              {/* Bairro (opcional) */}
              <View style={styles.field}>
                <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Bairro (opcional)</Text>
                <View style={[styles.fieldInput, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <Feather name="home" size={16} color={colors.mutedForeground} style={{ marginRight: 10 }} />
                  <TextInput
                    style={[styles.fieldInputText, { color: colors.text }]}
                    value={radarBairro}
                    onChangeText={setRadarBairro}
                    placeholder="Ex: Centro, Boa Vista..."
                    placeholderTextColor={colors.mutedForeground}
                  />
                  {!!radarBairro && (
                    <TouchableOpacity onPress={() => setRadarBairro("")} hitSlop={8}>
                      <Feather name="x" size={16} color={colors.mutedForeground} />
                    </TouchableOpacity>
                  )}
                </View>
              </View>

              {/* Botão Buscar empresas */}
              <TouchableOpacity
                style={[styles.searchCta, { opacity: canSubmit ? 1 : 0.55 }]}
                onPress={radarSearch}
                activeOpacity={0.85}
                disabled={!canSubmit}
              >
                {radarLoading
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <><Feather name="search" size={17} color="#fff" /><Text style={styles.searchCtaText}>Buscar empresas</Text></>
                }
              </TouchableOpacity>
            </View>

            {/* Erro */}
            {!!radarError && (
              <View style={[styles.errorBox, { backgroundColor: "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.07)" }]}>
                <Feather name="alert-circle" size={15} color="rgba(255,255,255,0.55)" />
                <Text style={styles.errorText}>{radarError}</Text>
              </View>
            )}

            {/* Resultados */}
            {radarSearched && !radarLoading && visibleResults.length > 0 && (
              <View style={styles.radarResultsWrap}>
                <Text style={[styles.radarResultsTitle, { color: colors.mutedForeground }]}>
                  {visibleResults.length} LEAD{visibleResults.length !== 1 ? "S" : ""} ENCONTRADO{visibleResults.length !== 1 ? "S" : ""}
                </Text>
                {visibleResults.map((place) => {
                  const added = radarAddedIds.has(place.placeId);
                  return (
                    <View
                      key={place.placeId}
                      style={[styles.radarCard, { backgroundColor: colors.card, borderColor: added ? "rgba(255,255,255,0.07)" : colors.border }]}
                    >
                      <View style={styles.radarCardRow}>
                        <View style={[styles.radarCardIcon, { backgroundColor: "#FF008018" }]}>
                          <Feather name="briefcase" size={14} color="#FF0080" />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.radarCardName, { color: colors.text }]} numberOfLines={1}>{place.name}</Text>
                          <Text style={[styles.radarCardAddr, { color: colors.mutedForeground }]} numberOfLines={1}>{place.address}</Text>
                        </View>
                        <TouchableOpacity style={styles.mapsBtn} onPress={() => openMaps(place)} activeOpacity={0.8}>
                          <Feather name="external-link" size={14} color={colors.mutedForeground} />
                        </TouchableOpacity>
                      </View>

                      {place.hasPhone && (
                        <View style={styles.radarCardMeta}>
                          <Feather name="phone" size={12} color={colors.mutedForeground} />
                          <Text style={[styles.radarCardMetaText, { color: colors.mutedForeground }]}>{place.phone}</Text>
                        </View>
                      )}

                      {place.rating !== null && (
                        <View style={styles.radarCardMeta}>
                          <Text style={{ fontSize: 13 }}>⭐</Text>
                          <Text style={[styles.radarCardMetaText, { color: colors.mutedForeground }]}>
                            {place.rating.toFixed(1)} ({place.totalRatings.toLocaleString("pt-BR")} avaliações)
                          </Text>
                        </View>
                      )}

                      <TouchableOpacity
                        style={[
                          styles.radarAddBtn,
                          added
                            ? { backgroundColor: "rgba(255,255,255,0.06)", borderColor: "rgba(255,255,255,0.07)", borderWidth: 1 }
                            : { backgroundColor: "#FF0080" },
                        ]}
                        onPress={() => !added && handleRadarAdd(place)}
                        activeOpacity={0.85}
                        disabled={added}
                      >
                        <Feather name={added ? "check" : "user-plus"} size={13} color={added ? "rgba(255,255,255,0.55)" : "#fff"} />
                        <Text style={[styles.radarAddBtnText, { color: added ? "rgba(255,255,255,0.55)" : "#fff" }]}>
                          {added ? "Adicionado ao CRM" : "Adicionar ao CRM"}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  );
                })}
              </View>
            )}

            {/* Buscas restantes */}
            <TouchableOpacity
              style={[styles.quotaCard, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => setShowLojaModal(true)}
              activeOpacity={0.85}
            >
              <Feather name="zap" size={15} color="#FFB300" />
              <Text style={[styles.quotaText, { color: colors.text }]}>
                {remaining} busca{remaining !== 1 ? "s" : ""} restante{remaining !== 1 ? "s" : ""} este mês
              </Text>
              <View style={styles.quotaLink}>
                <Text style={styles.quotaLinkText}>Ver planos</Text>
                <Feather name="chevron-right" size={16} color="#FF0080" />
              </View>
            </TouchableOpacity>
          </>
        ) : (
          /* ── Histórico ── */
          <>
            {filteredHistory.length === 0 ? (
              <View style={styles.emptyWrap}>
                <View style={[styles.emptyIcon, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <Feather name="clock" size={26} color={colors.mutedForeground} />
                </View>
                <Text style={[styles.emptyTitle, { color: colors.text }]}>
                  {history.length === 0 ? "Nenhuma busca ainda" : "Nada encontrado"}
                </Text>
                <Text style={[styles.emptySub, { color: colors.mutedForeground }]}>
                  {history.length === 0
                    ? "Suas buscas no radar aparecerão aqui para você repetir com um toque."
                    : "Tente outro termo na busca."}
                </Text>
                {history.length === 0 && (
                  <TouchableOpacity style={styles.emptyBtn} onPress={() => setTab("buscar")} activeOpacity={0.85}>
                    <Feather name="search" size={15} color="#fff" />
                    <Text style={styles.emptyBtnText}>Fazer primeira busca</Text>
                  </TouchableOpacity>
                )}
              </View>
            ) : (
              <>
                <View style={styles.historyHeader}>
                  <Text style={[styles.historyHeaderText, { color: colors.mutedForeground }]}>
                    {filteredHistory.length} BUSCA{filteredHistory.length !== 1 ? "S" : ""}
                  </Text>
                  <TouchableOpacity onPress={clearHistory} activeOpacity={0.7} style={styles.clearBtn}>
                    <Feather name="trash-2" size={13} color={colors.mutedForeground} />
                    <Text style={[styles.clearBtnText, { color: colors.mutedForeground }]}>Limpar</Text>
                  </TouchableOpacity>
                </View>

                {filteredHistory.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={[styles.historyCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                    onPress={() => applyHistory(item)}
                    activeOpacity={0.85}
                  >
                    <View style={[styles.historyIcon, { backgroundColor: "#FF008018" }]}>
                      <Feather name="search" size={15} color="#FF0080" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.historyTitle, { color: colors.text }]} numberOfLines={1}>
                        {item.segmento || "Busca"}
                      </Text>
                      <Text style={[styles.historyMeta, { color: colors.mutedForeground }]} numberOfLines={1}>
                        {item.cidade}{item.estado ? ` - ${item.estado}` : ""}{item.bairro ? ` · ${item.bairro}` : ""} · {item.count} lead{item.count !== 1 ? "s" : ""} · {formatTimeAgo(item.ts)}
                      </Text>
                    </View>
                    <TouchableOpacity onPress={() => removeHistoryItem(item.id)} hitSlop={8} style={styles.historyDelete}>
                      <Feather name="x" size={16} color={colors.mutedForeground} />
                    </TouchableOpacity>
                  </TouchableOpacity>
                ))}
              </>
            )}
          </>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* ── Modal: Limite de buscas atingido ── */}
      <Modal transparent animationType="fade" visible={showLimiteModal} onRequestClose={() => setShowLimiteModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.modalIconWrap, { backgroundColor: "rgba(255,255,255,0.06)" }]}>
              <Feather name="zap-off" size={28} color="rgba(255,255,255,0.5)" />
            </View>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Buscas do mês esgotadas</Text>
            <Text style={[styles.modalSub, { color: colors.mutedForeground }]}>
              Você usou todas as buscas disponíveis no seu plano este mês. Compre um pacote extra ou aguarde a renovação.
            </Text>
            <TouchableOpacity
              style={styles.modalPrimaryBtn}
              onPress={() => { setShowLimiteModal(false); router.push("/loja?tab=1" as any); }}
              activeOpacity={0.85}
            >
              <Feather name="shopping-cart" size={16} color="#fff" />
              <Text style={styles.modalPrimaryBtnText}>Ver loja — comprar buscas</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowLimiteModal(false)} style={styles.modalCancelBtn} activeOpacity={0.7}>
              <Text style={[styles.modalCancelBtnText, { color: colors.mutedForeground }]}>Fechar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── Modal: Loja de buscas extras ── */}
      <Modal transparent animationType="slide" visible={showLojaModal} onRequestClose={() => setShowLojaModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.lojaHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Comprar mais buscas</Text>
              <TouchableOpacity onPress={() => setShowLojaModal(false)} activeOpacity={0.7}>
                <Feather name="x" size={20} color={colors.mutedForeground} />
              </TouchableOpacity>
            </View>
            <Text style={[styles.modalSub, { color: colors.mutedForeground }]}>
              Buscas extras nunca expiram. Acumulam com o limite do seu plano.
            </Text>

            {PACOTES_BUSCAS.map((p) => (
              <TouchableOpacity
                key={p.id}
                style={[
                  styles.pacoteCard,
                  {
                    borderColor: selectedPacote === p.id ? "#FF0080" : colors.border,
                    backgroundColor: selectedPacote === p.id ? "#FF008010" : colors.surface,
                  },
                ]}
                onPress={() => setSelectedPacote(p.id)}
                activeOpacity={0.85}
              >
                <View style={{ flex: 1 }}>
                  <Text style={[styles.pacoteLabel, { color: colors.text }]}>{p.label}</Text>
                  <Text style={[styles.pacoteDesc, { color: colors.mutedForeground }]}>{p.desc}</Text>
                </View>
                <Text style={[styles.pacotePreco, { color: "#FF0080" }]}>{p.preco}</Text>
                {selectedPacote === p.id && (
                  <View style={styles.pacoteCheck}>
                    <Feather name="check-circle" size={18} color="#FF0080" />
                  </View>
                )}
              </TouchableOpacity>
            ))}

            <TouchableOpacity
              style={[styles.modalPrimaryBtn, { opacity: selectedPacote && !buyingPacote ? 1 : 0.5 }]}
              onPress={handleBuyPacote}
              activeOpacity={0.85}
              disabled={!selectedPacote || buyingPacote}
            >
              {buyingPacote
                ? <ActivityIndicator color="#fff" size="small" />
                : <><Feather name="credit-card" size={16} color="#fff" /><Text style={styles.modalPrimaryBtnText}>Comprar agora</Text></>
              }
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  // ─── Header ────────────────────────────────────────────────────────────────
  header: {
    flexDirection: "row", alignItems: "center", gap: 12,
    paddingHorizontal: 16, paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center", marginLeft: -8 },
  headerTitle: { fontSize: 22, fontFamily: "SpaceGrotesk_700Bold" },
  headerSub: { fontSize: 13, fontFamily: "SpaceGrotesk_400Regular", marginTop: 1 },
  lupaBtn: { width: 42, height: 42, borderRadius: 12, borderWidth: 1, alignItems: "center", justifyContent: "center" },

  // ─── Barra de busca ──────────────────────────────────────────────────────────
  searchBarWrap: { paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth },
  searchBarInput: { flexDirection: "row", alignItems: "center", gap: 9, borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, height: 44 },
  searchBarText: { flex: 1, fontSize: 15, fontFamily: "SpaceGrotesk_400Regular" },

  // ─── Abas ────────────────────────────────────────────────────────────────────
  tabsRow: { flexDirection: "row", borderBottomWidth: StyleSheet.hairlineWidth },
  tabBtn: { flex: 1, alignItems: "center", paddingTop: 14, paddingBottom: 12 },
  tabInner: { flexDirection: "row", alignItems: "center", gap: 7 },
  tabText: { fontSize: 14, fontFamily: "SpaceGrotesk_600SemiBold" },
  tabBadge: { minWidth: 18, height: 18, borderRadius: 9, paddingHorizontal: 5, alignItems: "center", justifyContent: "center" },
  tabBadgeText: { fontSize: 10, fontFamily: "SpaceGrotesk_700Bold" },
  tabUnderline: { position: "absolute", bottom: -StyleSheet.hairlineWidth, height: 2, width: "55%", borderRadius: 2, backgroundColor: "#FF0080" },

  // ─── Conteúdo ─────────────────────────────────────────────────────────────────
  scrollContent: { padding: 16, gap: 14 },

  // ─── Card de formulário ──────────────────────────────────────────────────────
  formCard: { borderRadius: 18, borderWidth: 1, padding: 18, gap: 14 },
  formCardTitle: { fontSize: 18, fontFamily: "SpaceGrotesk_700Bold" },
  formCardSub: { fontSize: 13, fontFamily: "SpaceGrotesk_400Regular", marginTop: -8 },
  field: { gap: 7 },
  fieldLabel: { fontSize: 13, fontFamily: "SpaceGrotesk_500Medium" },
  fieldInput: { flexDirection: "row", alignItems: "center", borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, height: 50 },
  fieldInputText: { flex: 1, fontSize: 15, fontFamily: "SpaceGrotesk_400Regular" },
  dropdown: { borderRadius: 12, borderWidth: 1, marginTop: 6, overflow: "hidden" },
  dropdownItem: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 14, paddingVertical: 12 },
  dropdownItemText: { fontSize: 14, fontFamily: "SpaceGrotesk_500Medium" },
  dropdownSearch: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 14, height: 44, borderBottomWidth: StyleSheet.hairlineWidth },
  dropdownSearchText: { flex: 1, fontSize: 14, fontFamily: "SpaceGrotesk_400Regular" },
  dropdownEmpty: { fontSize: 13, fontFamily: "SpaceGrotesk_400Regular", textAlign: "center", paddingVertical: 16 },

  searchCta: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 9,
    height: 52, borderRadius: 14, marginTop: 4,
    backgroundColor: "rgba(255,0,128,0.16)", borderWidth: 1, borderColor: "rgba(255,0,128,0.45)",
  },
  searchCtaText: { fontSize: 16, fontFamily: "SpaceGrotesk_700Bold", color: "#fff" },

  // ─── Buscas restantes ────────────────────────────────────────────────────────
  quotaCard: { flexDirection: "row", alignItems: "center", gap: 9, borderRadius: 14, borderWidth: 1, paddingHorizontal: 16, height: 54 },
  quotaText: { flex: 1, fontSize: 14, fontFamily: "SpaceGrotesk_500Medium" },
  quotaLink: { flexDirection: "row", alignItems: "center", gap: 2 },
  quotaLinkText: { fontSize: 14, fontFamily: "SpaceGrotesk_600SemiBold", color: "#FF0080" },

  // ─── Resultados ───────────────────────────────────────────────────────────────
  radarResultsWrap: { gap: 10 },
  radarResultsTitle: { fontSize: 11, fontFamily: "SpaceGrotesk_600SemiBold", letterSpacing: 1 },
  radarCard: { borderRadius: 14, borderWidth: 1, padding: 14, gap: 8 },
  radarCardRow: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  radarCardIcon: { width: 34, height: 34, borderRadius: 9, alignItems: "center", justifyContent: "center" },
  radarCardName: { fontSize: 16, fontFamily: "SpaceGrotesk_600SemiBold" },
  radarCardAddr: { fontSize: 11, fontFamily: "SpaceGrotesk_400Regular", marginTop: 1 },
  radarCardMeta: { flexDirection: "row", alignItems: "center", gap: 6 },
  radarCardMetaText: { fontSize: 13, fontFamily: "SpaceGrotesk_400Regular" },
  radarAddBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7, paddingVertical: 9, borderRadius: 10 },
  radarAddBtnText: { fontSize: 15, fontFamily: "SpaceGrotesk_600SemiBold" },
  mapsBtn: { width: 32, height: 32, alignItems: "center", justifyContent: "center" },

  errorBox: { flexDirection: "row", alignItems: "center", gap: 10, padding: 14, borderRadius: 12, borderWidth: 1 },
  errorText: { flex: 1, fontSize: 14, fontFamily: "SpaceGrotesk_400Regular", color: "rgba(255,255,255,0.55)" },

  // ─── Histórico ────────────────────────────────────────────────────────────────
  historyHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  historyHeaderText: { fontSize: 11, fontFamily: "SpaceGrotesk_600SemiBold", letterSpacing: 1 },
  clearBtn: { flexDirection: "row", alignItems: "center", gap: 5 },
  clearBtnText: { fontSize: 13, fontFamily: "SpaceGrotesk_500Medium" },
  historyCard: { flexDirection: "row", alignItems: "center", gap: 12, borderRadius: 14, borderWidth: 1, padding: 14 },
  historyIcon: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  historyTitle: { fontSize: 15, fontFamily: "SpaceGrotesk_600SemiBold" },
  historyMeta: { fontSize: 12, fontFamily: "SpaceGrotesk_400Regular", marginTop: 2 },
  historyDelete: { width: 28, height: 28, alignItems: "center", justifyContent: "center" },

  emptyWrap: { alignItems: "center", paddingTop: 60, paddingHorizontal: 24, gap: 10 },
  emptyIcon: { width: 64, height: 64, borderRadius: 20, borderWidth: 1, alignItems: "center", justifyContent: "center", marginBottom: 4 },
  emptyTitle: { fontSize: 17, fontFamily: "SpaceGrotesk_700Bold" },
  emptySub: { fontSize: 14, fontFamily: "SpaceGrotesk_400Regular", textAlign: "center", lineHeight: 20 },
  emptyBtn: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#FF0080", paddingHorizontal: 18, height: 46, borderRadius: 13, marginTop: 10 },
  emptyBtnText: { fontSize: 15, fontFamily: "SpaceGrotesk_700Bold", color: "#fff" },

  // ─── Modal styles ──────────────────────────────────────────────────────────
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.75)", justifyContent: "flex-end", alignItems: "center" },
  modalBox: { width: "100%", borderTopLeftRadius: 24, borderTopRightRadius: 24, borderWidth: StyleSheet.hairlineWidth, padding: 24, gap: 14 },
  modalIconWrap: { alignSelf: "center", width: 60, height: 60, borderRadius: 30, alignItems: "center", justifyContent: "center" },
  modalTitle: { fontSize: 20, fontFamily: "SpaceGrotesk_700Bold", textAlign: "center" },
  modalSub: { fontSize: 16, fontFamily: "SpaceGrotesk_400Regular", textAlign: "center", lineHeight: 20 },
  modalPrimaryBtn: {
    backgroundColor: "#FF0080", flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, height: 52, borderRadius: 14, marginTop: 4,
  },
  modalPrimaryBtnText: { fontSize: 16, fontFamily: "SpaceGrotesk_700Bold", color: "#fff" },
  modalCancelBtn: { alignItems: "center", paddingVertical: 8 },
  modalCancelBtnText: { fontSize: 16, fontFamily: "SpaceGrotesk_500Medium" },
  lojaHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  pacoteCard: { flexDirection: "row", alignItems: "center", borderRadius: 12, borderWidth: 1, padding: 14, gap: 10 },
  pacoteLabel: { fontSize: 15, fontFamily: "SpaceGrotesk_600SemiBold" },
  pacoteDesc: { fontSize: 13, fontFamily: "SpaceGrotesk_400Regular", marginTop: 2 },
  pacotePreco: { fontSize: 16, fontFamily: "SpaceGrotesk_700Bold" },
  pacoteCheck: { position: "absolute", top: 10, right: 10 },
});
