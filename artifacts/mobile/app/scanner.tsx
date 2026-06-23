import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as Location from "expo-location";
import * as WebBrowser from "expo-web-browser";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Easing,
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

const TIPOS = ["Restaurante", "Lanchonete", "Açaí", "Pizzaria", "Padaria", "Mercado", "Farmácia", "Academia", "Salão", "Outros"];

// ─── Radar constants ──────────────────────────────────────────────────────────
const RAIO_OPTIONS = [
  { label: "1 km",  value: 1000  },
  { label: "5 km",  value: 5000  },
  { label: "10 km", value: 10000 },
  { label: "25 km", value: 25000 },
  { label: "50 km", value: 50000 },
];

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

const API_BASE =
  Platform.OS === "web"
    ? ""
    : `https://${process.env.EXPO_PUBLIC_DOMAIN ?? ""}`;

interface PlaceResult {
  placeId: string;
  name: string;
  address: string;
  rating: number | null;
  totalRatings: number;
  status: string;
  lat?: number;
  lng?: number;
}

function StarRating({ rating, color }: { rating: number; color: string }) {
  return (
    <View style={styles.stars}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Feather key={i} name="star" size={12} color={i <= Math.round(rating) ? "rgba(255,255,255,0.45)" : color + "44"} />
      ))}
      <Text style={[styles.ratingText, { color }]}>{rating.toFixed(1)}</Text>
    </View>
  );
}

function openMaps(place: PlaceResult) {
  const query = encodeURIComponent(place.name + " " + place.address);
  const url = Platform.OS === "ios"
    ? `maps:?q=${query}`
    : `geo:0,0?q=${query}`;
  Linking.canOpenURL(url).then((ok) => {
    if (ok) Linking.openURL(url);
    else Linking.openURL(`https://maps.google.com/?q=${query}`);
  });
}

export default function ScannerScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { addLead, leads, moduleStates, toggleModule } = useApp();
  const scannerActive = moduleStates.scanner?.is_active ?? false;
  const { remaining, canSearch, decrement, addExtra } = useRadarSearches();

  const pulseAnim = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (scannerActive) {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 0.55, duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1,    duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        ])
      );
      loop.start();
      return () => loop.stop();
    } else {
      pulseAnim.setValue(1);
    }
  }, [scannerActive]);

  // ── Existing scanner state ─────────────────────────────────────────────────
  const [bairro, setBairro]           = useState("");
  const [cidade, setCidade]           = useState("Criciúma");
  const [tipoIdx, setTipoIdx]         = useState(0);
  const [showTipoPicker, setShowTipoPicker] = useState(false);
  const [loading, setLoading]         = useState(false);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [results, setResults]         = useState<PlaceResult[]>([]);
  const [searched, setSearched]       = useState(false);
  const [error, setError]             = useState("");
  const [addedIds, setAddedIds]       = useState<Set<string>>(new Set());
  const [userCoords, setUserCoords]   = useState<{ lat: number; lng: number } | null>(null);
  const [locationLabel, setLocationLabel] = useState("");

  // ── Radar (Buscar Leads) state ─────────────────────────────────────────────
  const [radarSegmento,    setRadarSegmento]    = useState("Outros");
  const [radarEstado,      setRadarEstado]      = useState("");
  const [radarCidade,      setRadarCidade]      = useState("");
  const [radarRaioIdx,     setRadarRaioIdx]     = useState(1); // 5 km default
  const [radarLoading,     setRadarLoading]     = useState(false);
  const [radarResults,     setRadarResults]     = useState<RadarLead[]>([]);
  const [radarSearched,    setRadarSearched]    = useState(false);
  const [radarError,       setRadarError]       = useState("");
  const [radarAddedIds,    setRadarAddedIds]    = useState<Set<string>>(new Set());
  const [showLimiteModal,  setShowLimiteModal]  = useState(false);
  const [showLojaModal,    setShowLojaModal]    = useState(false);
  const [selectedPacote,   setSelectedPacote]   = useState<string | null>(null);
  const [buyingPacote,     setBuyingPacote]     = useState(false);
  const [showRadarEstadoPicker, setShowRadarEstadoPicker] = useState(false);
  const [showRadarCidadePicker, setShowRadarCidadePicker] = useState(false);
  const [radarUserCoords,  setRadarUserCoords]  = useState<{ lat: number; lng: number } | null>(null);
  const [radarLocationLabel, setRadarLocationLabel] = useState("");
  const [loadingRadarLocation, setLoadingRadarLocation] = useState(false);

  const radarEstadoData = BRAZIL_STATES.find((s) => s.sigla === radarEstado);
  const cidadesDoRadarEstado = radarEstadoData?.cidades ?? [];

  const { coords: ctxCoords, city: ctxCity, state: ctxState } = useLocation();
  useEffect(() => {
    if (ctxState && !radarEstado) {
      setRadarEstado(ctxState);
      const sd = BRAZIL_STATES.find(s => s.sigla === ctxState);
      if (sd?.cidades?.[0]) setRadarCidade(sd.cidades[0]);
    }
  }, [ctxState]);
  useEffect(() => {
    if (ctxCoords && !radarUserCoords) {
      setRadarUserCoords({ lat: ctxCoords.lat, lng: ctxCoords.lng });
      setRadarLocationLabel(ctxCity ? `📍 ${ctxCity}` : "📍 Localização detectada");
    }
  }, [ctxCoords]);

  // Pre-fill from empresa config
  useEffect(() => {
    AsyncStorage.getItem("@jade_ia:empresa_v2").then((raw) => {
      if (!raw) return;
      try {
        const parsed = JSON.parse(raw);
        if (parsed.segmento) setRadarSegmento(parsed.segmento);
        if (parsed.estado)   setRadarEstado(parsed.estado);
        if (parsed.cidade)   setRadarCidade(parsed.cidade);
      } catch { /* ignore */ }
    });
  }, []);

  const getRadarLocation = async () => {
    if (Platform.OS === "web") {
      setRadarError("Geolocalização não disponível na versão web.");
      return;
    }
    setLoadingRadarLocation(true);
    setRadarError("");
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setRadarError("Permissão de localização negada. Ative nas configurações do celular.");
        return;
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const { latitude, longitude } = loc.coords;
      setRadarUserCoords({ lat: latitude, lng: longitude });

      const geocoded = await Location.reverseGeocodeAsync({ latitude, longitude });
      if (geocoded.length > 0) {
        const g = geocoded[0];
        const cidadeFound = g?.city ?? g?.subregion ?? "";
        const estadoFound = g?.region ?? "";
        setRadarLocationLabel(`📍 ${cidadeFound}${estadoFound ? `, ${estadoFound}` : ""}`);
        if (cidadeFound) setRadarCidade(cidadeFound);
      } else {
        setRadarLocationLabel(`📍 ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      setRadarError("Não foi possível obter sua localização. Verifique se o GPS está ativo.");
    } finally {
      setLoadingRadarLocation(false);
    }
  };

  const radarSearch = async () => {
    if (!canSearch) { setShowLimiteModal(true); return; }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setRadarError("");
    setRadarLoading(true);
    setRadarSearched(true);
    setRadarResults([]);
    decrement();

    try {
      const body: Record<string, unknown> = {
        segmento: radarSegmento,
        cidade:   radarCidade,
        estado:   radarEstado,
        raio:     RAIO_OPTIONS[radarRaioIdx]!.value,
      };
      if (radarUserCoords) {
        body.lat = radarUserCoords.lat;
        body.lng = radarUserCoords.lng;
      }
      const res = await fetch(`${API_BASE}/api/places/radar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = (await res.json()) as { results?: RadarLead[]; error?: string };
      if (!res.ok) { setRadarError(data.error ?? "Erro ao buscar leads."); return; }
      const fetched = data.results ?? [];
      setRadarResults(fetched);
      if (fetched.length === 0) setRadarError("Nenhum resultado. Tente outro segmento ou raio maior.");
      else Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      setRadarError("Erro de conexão. Verifique sua internet.");
    } finally {
      setRadarLoading(false);
    }
  };

  const handleRadarAdd = (place: RadarLead) => {
    // Duplicate check by phone
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

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const getLocation = async () => {
    if (Platform.OS === "web") {
      setError("Geolocalização não disponível na versão web.");
      return;
    }
    setLoadingLocation(true);
    setError("");
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setError("Permissão de localização negada. Ative nas configurações do celular.");
        return;
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const { latitude, longitude } = loc.coords;
      setUserCoords({ lat: latitude, lng: longitude });

      // Reverse geocode to get neighborhood
      const geocoded = await Location.reverseGeocodeAsync({ latitude, longitude });
      if (geocoded.length > 0) {
        const g = geocoded[0];
        const bairroFound = g?.district ?? g?.subregion ?? "";
        const cidadeFound = g?.city ?? "Criciúma";
        setBairro(bairroFound);
        setCidade(cidadeFound);
        setLocationLabel(`📍 ${bairroFound ? bairroFound + ", " : ""}${cidadeFound}`);
      } else {
        setLocationLabel(`📍 ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) {
      setError("Não foi possível obter sua localização. Verifique se o GPS está ativo.");
    } finally {
      setLoadingLocation(false);
    }
  };

  const search = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setError("");
    setLoading(true);
    setSearched(true);
    setResults([]);

    try {
      const body: Record<string, unknown> = {
        bairro,
        cidade,
        tipo: TIPOS[tipoIdx],
      };
      if (userCoords) {
        body.lat = userCoords.lat;
        body.lng = userCoords.lng;
      }

      const res = await fetch(`${API_BASE}/api/places/search`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = (await res.json()) as { results?: PlaceResult[]; error?: string };

      if (!res.ok) {
        setError(data.error ?? "Erro ao buscar estabelecimentos.");
        return;
      }

      setResults(data.results ?? []);
      if ((data.results ?? []).length === 0) {
        setError("Nenhum estabelecimento encontrado. Tente ajustar os filtros.");
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch {
      setError("Erro de conexão. Verifique sua internet.");
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = (place: PlaceResult) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const nameWords = place.name.trim().split(/\s+/);
    const initials = nameWords.length >= 2
      ? (nameWords[0][0] + nameWords[1][0]).toUpperCase()
      : place.name.slice(0, 2).toUpperCase();

    const COLORS_ARR = ["#FF0080", "#8400FF", "#FF0080", "#8400FF", "#FF0080", "#8400FF"];
    const color = COLORS_ARR[Math.abs(place.placeId.charCodeAt(0)) % COLORS_ARR.length];

    const lead: Lead = {
      id: place.placeId,
      name: place.name,
      company: TIPOS[tipoIdx],
      value: 0,
      phone: "",
      column: "novo",
      tag: TIPOS[tipoIdx],
      tagColor: "#FF0080",
      time: "agora",
      initials,
      avatarColor: color,
    };

    addLead(lead);
    setAddedIds((prev) => new Set([...prev, place.placeId]));
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad, borderBottomColor: colors.border }]}>

        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
          activeOpacity={0.8}
        >
          <Feather name="arrow-left" size={20} color={colors.text} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Scanner Radar</Text>
          <Text style={[styles.headerSub, { color: colors.mutedForeground }]}>
            {searched && results.length > 0
              ? `${results.length} estabelecimento${results.length !== 1 ? "s" : ""} encontrado${results.length !== 1 ? "s" : ""}`
              : "Buscar estabelecimentos"}
          </Text>
        </View>
      </View>

      {/* ── Scanner status banner ── */}
      {scannerActive ? (
        <Animated.View style={[styles.scannerBanner, styles.scannerBannerActive, { opacity: pulseAnim }]}>
          <View style={styles.scannerDot} />
          <Text style={styles.scannerBannerText}>
            JADE prospectando ativamente
            {searched && results.length > 0 ? ` — ${results.length} encontrado${results.length !== 1 ? "s" : ""} agora` : " — busque abaixo"}
          </Text>
        </Animated.View>
      ) : (
        <View style={[styles.scannerBanner, styles.scannerBannerPaused]}>
          <Feather name="pause-circle" size={14} color="rgba(255,255,255,0.45)" />
          <Text style={styles.scannerBannerPausedText}>Scanner pausado — ative no Radar para prospecção automática</Text>
          <TouchableOpacity
            onPress={() => { toggleModule("scanner"); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); }}
            activeOpacity={0.8}
            style={styles.ativarBtn}
          >
            <Text style={styles.ativarBtnText}>Ativar</Text>
          </TouchableOpacity>
        </View>
      )}

      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

        {/* ══════════════════════════════════════════════════════════════════════
            SEÇÃO BUSCAR LEADS — Google Places Nearby Search
        ══════════════════════════════════════════════════════════════════════ */}
        <View style={styles.radarSection}>
          <View style={styles.radarSectionHeader}>
            <View style={[styles.radarIconWrap, { backgroundColor: "#FF008018" }]}>
              <Feather name="search" size={16} color="#FF0080" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.radarSectionTitle, { color: colors.text }]}>Buscar Leads</Text>
              <Text style={[styles.radarSectionSub, { color: colors.mutedForeground }]}>
                Google Places · Nearby Search real
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => setShowLojaModal(true)}
              style={[styles.compraBuscasBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
              activeOpacity={0.8}
            >
              <Feather name="shopping-cart" size={13} color="#FF0080" />
              <Text style={[styles.compraBuscasBtnText, { color: "#FF0080" }]}>Comprar buscas</Text>
            </TouchableOpacity>
          </View>

          {/* Segmento */}
          <View style={styles.radarField}>
            <Text style={[styles.radarLabel, { color: colors.mutedForeground }]}>Segmento</Text>
            <View style={[styles.radarInput, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Feather name="tag" size={14} color={colors.mutedForeground} style={{ marginRight: 8 }} />
              <TextInput
                style={[styles.radarInputText, { color: colors.text }]}
                value={radarSegmento}
                onChangeText={setRadarSegmento}
                placeholder="Ex: Clínicas & Saúde"
                placeholderTextColor={colors.mutedForeground}
              />
            </View>
          </View>

          {/* GPS para radar */}
          <View style={styles.radarField}>
            <TouchableOpacity
              style={[styles.radarInput, {
                backgroundColor: radarUserCoords ? "#FF008018" : colors.surface,
                borderColor: radarUserCoords ? "#FF008044" : colors.border,
                justifyContent: "center",
              }]}
              onPress={getRadarLocation}
              activeOpacity={0.8}
              disabled={loadingRadarLocation}
            >
              {loadingRadarLocation
                ? <ActivityIndicator size="small" color="#FF0080" />
                : <Feather name="navigation" size={15} color={radarUserCoords ? "#FF0080" : colors.mutedForeground} />
              }
              <Text style={[styles.radarInputText, { color: radarUserCoords ? "#FF0080" : colors.mutedForeground, marginLeft: 8 }]}>
                {loadingRadarLocation ? "Obtendo localização..." : radarLocationLabel || "Usar minha localização atual"}
              </Text>
              {radarUserCoords && <Feather name="check-circle" size={15} color="#FF0080" style={{ marginLeft: "auto" }} />}
            </TouchableOpacity>
          </View>

          <View style={[styles.radarField]}>
            <View style={styles.orRow2}>
              <View style={[styles.orLine2, { backgroundColor: colors.border }]} />
              <Text style={[styles.orText2, { color: colors.mutedForeground }]}>ou selecione a localização</Text>
              <View style={[styles.orLine2, { backgroundColor: colors.border }]} />
            </View>
          </View>

          {/* Estado */}
          <View style={styles.radarField}>
            <Text style={[styles.radarLabel, { color: colors.mutedForeground }]}>Estado</Text>
            <TouchableOpacity
              style={[styles.radarInput, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => { setShowRadarEstadoPicker((v) => !v); setShowRadarCidadePicker(false); }}
              activeOpacity={0.8}
            >
              <Feather name="map" size={14} color={colors.mutedForeground} style={{ marginRight: 8 }} />
              <Text style={[styles.radarInputText, { color: radarEstado ? colors.text : colors.mutedForeground, flex: 1 }]}>
                {radarEstadoData ? `${radarEstadoData.nome} (${radarEstado})` : "Selecione o estado"}
              </Text>
              <Feather name={showRadarEstadoPicker ? "chevron-up" : "chevron-down"} size={14} color={colors.mutedForeground} />
            </TouchableOpacity>
            {showRadarEstadoPicker && (
              <ScrollView style={[styles.radarPicker, { backgroundColor: colors.card, borderColor: colors.border }]} nestedScrollEnabled>
                {BRAZIL_STATES.map((s) => (
                  <TouchableOpacity
                    key={s.sigla}
                    style={[styles.radarPickerItem, s.sigla === radarEstado && { backgroundColor: "#FF008018" }]}
                    onPress={() => {
                      setRadarEstado(s.sigla);
                      setRadarCidade(s.cidades[0] ?? "");
                      setRadarUserCoords(null);
                      setRadarLocationLabel("");
                      setShowRadarEstadoPicker(false);
                      Haptics.selectionAsync();
                    }}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.radarPickerText, { color: s.sigla === radarEstado ? "#FF0080" : colors.text }]}>
                      {s.nome} <Text style={{ color: colors.mutedForeground }}>({s.sigla})</Text>
                    </Text>
                    {s.sigla === radarEstado && <Feather name="check" size={13} color="#FF0080" />}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>

          {/* Cidade */}
          <View style={styles.radarField}>
            <Text style={[styles.radarLabel, { color: colors.mutedForeground }]}>Cidade</Text>
            <TouchableOpacity
              style={[styles.radarInput, { backgroundColor: colors.card, borderColor: colors.border, opacity: cidadesDoRadarEstado.length === 0 ? 0.5 : 1 }]}
              onPress={() => { if (cidadesDoRadarEstado.length > 0) { setShowRadarCidadePicker((v) => !v); setShowRadarEstadoPicker(false); } }}
              activeOpacity={0.8}
            >
              <Feather name="map-pin" size={14} color={colors.mutedForeground} style={{ marginRight: 8 }} />
              <Text style={[styles.radarInputText, { color: radarCidade ? colors.text : colors.mutedForeground, flex: 1 }]}>
                {radarCidade || "Selecione a cidade"}
              </Text>
              <Feather name={showRadarCidadePicker ? "chevron-up" : "chevron-down"} size={14} color={colors.mutedForeground} />
            </TouchableOpacity>
            {showRadarCidadePicker && cidadesDoRadarEstado.length > 0 && (
              <ScrollView style={[styles.radarPicker, { backgroundColor: colors.card, borderColor: colors.border }]} nestedScrollEnabled>
                {cidadesDoRadarEstado.map((c) => (
                  <TouchableOpacity
                    key={c}
                    style={[styles.radarPickerItem, c === radarCidade && { backgroundColor: "#FF008018" }]}
                    onPress={() => { setRadarCidade(c); setRadarUserCoords(null); setRadarLocationLabel(""); setShowRadarCidadePicker(false); Haptics.selectionAsync(); }}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.radarPickerText, { color: c === radarCidade ? "#FF0080" : colors.text }]}>{c}</Text>
                    {c === radarCidade && <Feather name="check" size={13} color="#FF0080" />}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>

          {/* Raio */}
          <View style={styles.radarField}>
            <Text style={[styles.radarLabel, { color: colors.mutedForeground }]}>Raio de busca</Text>
            <View style={styles.raioRow}>
              {RAIO_OPTIONS.map((opt, i) => (
                <TouchableOpacity
                  key={opt.value}
                  style={[
                    styles.raioBtn,
                    { borderColor: i === radarRaioIdx ? "#FF0080" : colors.border, backgroundColor: i === radarRaioIdx ? "#FF008018" : colors.card },
                  ]}
                  onPress={() => setRadarRaioIdx(i)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.raioBtnText, { color: i === radarRaioIdx ? "#FF0080" : colors.mutedForeground }]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Botão buscar */}
          <TouchableOpacity
            style={[styles.radarSearchBtn, { opacity: radarLoading ? 0.7 : 1 }]}
            onPress={radarSearch}
            activeOpacity={0.85}
            disabled={radarLoading}
          >
            {radarLoading
              ? <ActivityIndicator color="#fff" size="small" />
              : <><Feather name="search" size={16} color="#fff" /><Text style={styles.radarSearchBtnText}>Buscar Leads</Text></>
            }
          </TouchableOpacity>

          {/* Contador de buscas */}
          <TouchableOpacity
            style={styles.buscasCounterRow}
            onPress={() => setShowLojaModal(true)}
            activeOpacity={0.7}
          >
            <Feather
              name="zap"
              size={13}
              color={remaining <= 1 ? "rgba(255,255,255,0.5)" : remaining <= 5 ? "rgba(255,255,255,0.45)" : "rgba(255,255,255,0.55)"}
            />
            <Text style={[styles.buscasCounterText, {
              color: remaining <= 1 ? "rgba(255,255,255,0.5)" : remaining <= 5 ? "rgba(255,255,255,0.45)" : colors.mutedForeground,
            }]}>
              {remaining} busca{remaining !== 1 ? "s" : ""} restante{remaining !== 1 ? "s" : ""} este mês
              {remaining <= 2 ? " — Comprar mais →" : ""}
            </Text>
          </TouchableOpacity>

          {/* Radar error */}
          {!!radarError && (
            <View style={[styles.errorBox, { backgroundColor: "rgba(255,255,255,0.06)", borderColor: "rgba(255,255,255,0.06)" }]}>
              <Feather name="alert-circle" size={14} color="rgba(255,255,255,0.5)" />
              <Text style={styles.errorText}>{radarError}</Text>
            </View>
          )}

          {/* Radar Results */}
          {radarSearched && !radarLoading && radarResults.length > 0 && (
            <View style={styles.radarResultsWrap}>
              <Text style={[styles.radarResultsTitle, { color: colors.mutedForeground }]}>
                {radarResults.length} LEAD{radarResults.length !== 1 ? "S" : ""} ENCONTRADO{radarResults.length !== 1 ? "S" : ""}
              </Text>
              {radarResults.map((place) => {
                const added = radarAddedIds.has(place.placeId);
                return (
                  <View
                    key={place.placeId}
                    style={[styles.radarCard, {
                      backgroundColor: colors.card,
                      borderColor: added ? "rgba(255,255,255,0.06)" : colors.border,
                    }]}
                  >
                    <View style={styles.radarCardRow}>
                      <View style={[styles.radarCardIcon, { backgroundColor: "#FF008018" }]}>
                        <Feather name="briefcase" size={14} color="#FF0080" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.radarCardName, { color: colors.text }]} numberOfLines={1}>
                          {place.name}
                        </Text>
                        <Text style={[styles.radarCardAddr, { color: colors.mutedForeground }]} numberOfLines={1}>
                          {place.address}
                        </Text>
                      </View>
                      <View style={[
                        styles.radarStatusBadge,
                        { backgroundColor: place.hasPhone ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.35)18", borderColor: place.hasPhone ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.35)44" },
                      ]}>
                        <Text style={[styles.radarStatusText, { color: place.hasPhone ? "rgba(255,255,255,0.55)" : "rgba(255,255,255,0.35)" }]}>
                          {place.hasPhone ? "Ativo" : "Sem tel."}
                        </Text>
                      </View>
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
                          ? { backgroundColor: "rgba(255,255,255,0.06)", borderColor: "rgba(255,255,255,0.06)", borderWidth: 1 }
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
        </View>

        {/* Divider */}
        <View style={[styles.sectionDivider, { borderColor: colors.border }]}>
          <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
          <Text style={[styles.dividerText, { color: colors.mutedForeground }]}>BUSCA POR ENDEREÇO</Text>
          <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
        </View>

        {/* ── Location button ── */}
        <View style={styles.form}>
          <TouchableOpacity
            style={[styles.locationBtn, { backgroundColor: userCoords ? colors.success + "18" : colors.surface, borderColor: userCoords ? colors.success + "44" : colors.border }]}
            onPress={getLocation}
            activeOpacity={0.8}
            disabled={loadingLocation}
          >
            {loadingLocation
              ? <ActivityIndicator size="small" color={colors.primary} />
              : <Feather name="navigation" size={16} color={userCoords ? colors.success : colors.primary} />
            }
            <Text style={[styles.locationBtnText, { color: userCoords ? colors.success : colors.primary }]}>
              {loadingLocation ? "Obtendo localização..." : locationLabel || "Usar minha localização atual"}
            </Text>
            {userCoords && <Feather name="check-circle" size={16} color={colors.success} />}
          </TouchableOpacity>

          <View style={styles.orRow}>
            <View style={[styles.orLine, { backgroundColor: colors.border }]} />
            <Text style={[styles.orText, { color: colors.mutedForeground }]}>ou buscar por endereço</Text>
            <View style={[styles.orLine, { backgroundColor: colors.border }]} />
          </View>

          {/* Bairro */}
          <View style={styles.fieldGroup}>
            <Text style={[styles.label, { color: colors.mutedForeground }]}>Bairro</Text>
            <View style={[styles.inputWrap, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Feather name="map-pin" size={16} color={colors.mutedForeground} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="Ex: Centro, Boa Vista..."
                placeholderTextColor={colors.mutedForeground}
                value={bairro}
                onChangeText={(v) => { setBairro(v); setUserCoords(null); setLocationLabel(""); }}
              />
            </View>
          </View>

          {/* Cidade */}
          <View style={styles.fieldGroup}>
            <Text style={[styles.label, { color: colors.mutedForeground }]}>Cidade</Text>
            <View style={[styles.inputWrap, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Feather name="globe" size={16} color={colors.mutedForeground} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="Criciúma"
                placeholderTextColor={colors.mutedForeground}
                value={cidade}
                onChangeText={setCidade}
              />
            </View>
          </View>

          {/* Tipo */}
          <View style={styles.fieldGroup}>
            <Text style={[styles.label, { color: colors.mutedForeground }]}>Tipo de negócio</Text>
            <TouchableOpacity
              style={[styles.inputWrap, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => setShowTipoPicker((v) => !v)}
              activeOpacity={0.8}
            >
              <Feather name="briefcase" size={16} color={colors.mutedForeground} style={styles.inputIcon} />
              <Text style={[styles.input, { color: colors.text }]}>{TIPOS[tipoIdx]}</Text>
              <Feather name={showTipoPicker ? "chevron-up" : "chevron-down"} size={16} color={colors.mutedForeground} />
            </TouchableOpacity>
            {showTipoPicker && (
              <View style={[styles.picker, { backgroundColor: colors.card, borderColor: colors.border }]}>
                {TIPOS.map((t, i) => (
                  <TouchableOpacity
                    key={t}
                    style={[styles.pickerItem, i === tipoIdx && { backgroundColor: colors.primary + "18" }]}
                    onPress={() => { setTipoIdx(i); setShowTipoPicker(false); }}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.pickerItemText, { color: i === tipoIdx ? colors.primary : colors.text }]}>
                      {t}
                    </Text>
                    {i === tipoIdx && <Feather name="check" size={14} color={colors.primary} />}
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          <TouchableOpacity
            style={[styles.searchBtn, (loading || (!bairro && !userCoords && !cidade)) && { opacity: 0.7 }]}
            onPress={search}
            activeOpacity={0.85}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator color="#fff" size="small" />
              : <><Feather name="crosshair" size={18} color="#fff" /><Text style={styles.searchBtnText}>Buscar Estabelecimentos</Text></>
            }
          </TouchableOpacity>
        </View>

        {/* Error */}
        {!!error && (
          <View style={[styles.errorBox, { backgroundColor: "rgba(255,255,255,0.06)", borderColor: "rgba(255,255,255,0.06)" }]}>
            <Feather name="alert-circle" size={16} color="rgba(255,255,255,0.5)" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Results */}
        {searched && !loading && results.length > 0 && (
          <View style={styles.resultsSection}>
            <View style={styles.resultsHeader}>
              <Text style={[styles.resultsTitle, { color: colors.mutedForeground }]}>
                {results.length} RESULTADO{results.length !== 1 ? "S" : ""}
              </Text>
              <View style={[styles.resultsBadge, { backgroundColor: colors.success + "18", borderColor: colors.success + "30" }]}>
                <View style={[styles.resultsDot, { backgroundColor: colors.success }]} />
                <Text style={[styles.resultsBadgeText, { color: colors.success }]}>{TIPOS[tipoIdx]}</Text>
              </View>
            </View>

            {results.map((place) => {
              const added = addedIds.has(place.placeId);
              return (
                <View
                  key={place.placeId}
                  style={[styles.placeCard, { backgroundColor: colors.card, borderColor: added ? colors.success + "44" : colors.border }]}
                >
                  <View style={styles.placeHeader}>
                    <View style={[styles.placeIcon, { backgroundColor: colors.primary + "22" }]}>
                      <Feather name="map-pin" size={16} color={colors.primary} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.placeName, { color: colors.text }]} numberOfLines={1}>
                        {place.name}
                      </Text>
                      <Text style={[styles.placeAddress, { color: colors.mutedForeground }]} numberOfLines={2}>
                        {place.address}
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={styles.mapsBtn}
                      onPress={() => openMaps(place)}
                      activeOpacity={0.8}
                    >
                      <Feather name="external-link" size={14} color={colors.mutedForeground} />
                    </TouchableOpacity>
                  </View>

                  {(place.rating !== null || place.totalRatings > 0) && (
                    <View style={styles.placeMeta}>
                      {place.rating !== null && (
                        <StarRating rating={place.rating} color={colors.mutedForeground} />
                      )}
                      {place.totalRatings > 0 && (
                        <Text style={[styles.totalRatings, { color: colors.mutedForeground }]}>
                          ({place.totalRatings.toLocaleString("pt-BR")} avaliações)
                        </Text>
                      )}
                    </View>
                  )}

                  <TouchableOpacity
                    style={[
                      styles.addBtn,
                      added
                        ? { backgroundColor: colors.success + "18", borderColor: colors.success + "44", borderWidth: 1 }
                        : { backgroundColor: colors.primary },
                    ]}
                    onPress={() => !added && handleAdd(place)}
                    activeOpacity={0.85}
                    disabled={added}
                  >
                    <Feather name={added ? "check" : "user-plus"} size={14} color={added ? colors.success : "#fff"} />
                    <Text style={[styles.addBtnText, { color: added ? colors.success : "#fff" }]}>
                      {added ? "Adicionado ao pipeline" : "Adicionar ao pipeline"}
                    </Text>
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
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
  // ─── Radar (Buscar Leads) styles ───────────────────────────────────────────
  radarSection: { padding: 16, gap: 12 },
  radarSectionHeader: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 4 },
  radarIconWrap: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  radarSectionTitle: { fontSize: 16, fontFamily: "SpaceGrotesk_700Bold" },
  radarSectionSub: { fontSize: 11, fontFamily: "SpaceGrotesk_400Regular", marginTop: 1 },
  compraBuscasBtn: { flexDirection: "row", alignItems: "center", gap: 5, borderRadius: 10, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 6 },
  compraBuscasBtnText: { fontSize: 11, fontFamily: "SpaceGrotesk_600SemiBold" },
  radarField: { gap: 5 },
  radarLabel: { fontSize: 11, fontFamily: "SpaceGrotesk_500Medium", textTransform: "uppercase", letterSpacing: 0.5 },
  radarInput: { flexDirection: "row", alignItems: "center", borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, height: 46 },
  radarInputText: { flex: 1, fontSize: 15, fontFamily: "SpaceGrotesk_400Regular" },
  radarPicker: { borderRadius: 12, borderWidth: 1, marginTop: 4, maxHeight: 220, overflow: "hidden" },
  radarPickerItem: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 14, paddingVertical: 11 },
  radarPickerText: { fontSize: 14, fontFamily: "SpaceGrotesk_500Medium" },
  orRow2: { flexDirection: "row", alignItems: "center", gap: 8, marginVertical: 4 },
  orLine2: { flex: 1, height: StyleSheet.hairlineWidth },
  orText2: { fontSize: 11, fontFamily: "SpaceGrotesk_400Regular" },
  raioRow: { flexDirection: "row", gap: 6 },
  raioBtn: { flex: 1, alignItems: "center", justifyContent: "center", height: 36, borderRadius: 9, borderWidth: 1 },
  raioBtnText: { fontSize: 11, fontFamily: "SpaceGrotesk_600SemiBold" },
  radarSearchBtn: {
    backgroundColor: "#FF0080", flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, height: 50, borderRadius: 13,
    shadowColor: "#FF0080", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 6,
  },
  radarSearchBtnText: { fontSize: 15, fontFamily: "SpaceGrotesk_700Bold", color: "#fff" },
  buscasCounterRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5, paddingVertical: 4 },
  buscasCounterText: { fontSize: 13, fontFamily: "SpaceGrotesk_500Medium" },
  radarResultsWrap: { gap: 10, marginTop: 4 },
  radarResultsTitle: { fontSize: 11, fontFamily: "SpaceGrotesk_600SemiBold", letterSpacing: 1, marginBottom: 2 },
  radarCard: { borderRadius: 14, borderWidth: 1, padding: 14, gap: 8 },
  radarCardRow: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  radarCardIcon: { width: 34, height: 34, borderRadius: 9, alignItems: "center", justifyContent: "center" },
  radarCardName: { fontSize: 16, fontFamily: "SpaceGrotesk_600SemiBold" },
  radarCardAddr: { fontSize: 11, fontFamily: "SpaceGrotesk_400Regular", marginTop: 1 },
  radarStatusBadge: { borderRadius: 7, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 3, alignSelf: "flex-start" },
  radarStatusText: { fontSize: 10, fontFamily: "SpaceGrotesk_600SemiBold" },
  radarCardMeta: { flexDirection: "row", alignItems: "center", gap: 6 },
  radarCardMetaText: { fontSize: 13, fontFamily: "SpaceGrotesk_400Regular" },
  radarAddBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7, paddingVertical: 9, borderRadius: 10 },
  radarAddBtnText: { fontSize: 15, fontFamily: "SpaceGrotesk_600SemiBold" },
  sectionDivider: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, gap: 10, marginVertical: 4 },
  dividerLine: { flex: 1, height: StyleSheet.hairlineWidth },
  dividerText: { fontSize: 10, fontFamily: "SpaceGrotesk_600SemiBold", letterSpacing: 1 },
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

  // ─── Existing styles ───────────────────────────────────────────────────────
  container: { flex: 1 },
  header: {
    flexDirection: "row", alignItems: "center", gap: 14,
    paddingHorizontal: 20, paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 18, fontFamily: "SpaceGrotesk_700Bold" },
  headerSub: { fontSize: 13, fontFamily: "SpaceGrotesk_400Regular", marginTop: 2 },
  form: { padding: 20, gap: 14 },
  locationBtn: {
    flexDirection: "row", alignItems: "center", gap: 10,
    borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, height: 50,
  },
  locationBtnText: { flex: 1, fontSize: 16, fontFamily: "SpaceGrotesk_500Medium" },
  orRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  orLine: { flex: 1, height: StyleSheet.hairlineWidth },
  orText: { fontSize: 11, fontFamily: "SpaceGrotesk_400Regular" },
  fieldGroup: { gap: 6 },
  label: { fontSize: 13, fontFamily: "SpaceGrotesk_500Medium", textTransform: "uppercase", letterSpacing: 0.5 },
  inputWrap: { flexDirection: "row", alignItems: "center", borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, height: 50 },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, fontSize: 15, fontFamily: "SpaceGrotesk_400Regular" },
  picker: { borderRadius: 12, borderWidth: 1, marginTop: 4, overflow: "hidden" },
  pickerItem: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 13 },
  pickerItemText: { fontSize: 15, fontFamily: "SpaceGrotesk_500Medium" },
  searchBtn: {
    backgroundColor: "#FF0080", flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 10, height: 52, borderRadius: 14,
    shadowColor: "#FF0080", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 6,
  },
  searchBtnText: { fontSize: 16, fontFamily: "SpaceGrotesk_700Bold", color: "#fff" },
  scannerBanner: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 16, paddingVertical: 10, marginHorizontal: 0 },
  scannerBannerActive: { backgroundColor: "rgba(255,255,255,0.06)", borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "rgba(255,255,255,0.06)" },
  scannerBannerPaused: { backgroundColor: "rgba(255,255,255,0.06)", borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "rgba(255,255,255,0.06)" },
  scannerDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "rgba(255,255,255,0.55)" },
  scannerBannerText:       { flex: 1, fontSize: 13, fontFamily: "SpaceGrotesk_500Medium", color: "rgba(255,255,255,0.55)" },
  scannerBannerPausedText: { flex: 1, fontSize: 13, fontFamily: "SpaceGrotesk_400Regular", color: "rgba(255,255,255,0.45)" },
  ativarBtn: { backgroundColor: "rgba(255,255,255,0.06)", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: "rgba(255,255,255,0.06)" },
  ativarBtnText: { fontSize: 11, fontFamily: "SpaceGrotesk_700Bold", color: "rgba(255,255,255,0.45)" },
  errorBox: { flexDirection: "row", alignItems: "center", gap: 10, marginHorizontal: 20, padding: 14, borderRadius: 12, borderWidth: 1 },
  errorText: { flex: 1, fontSize: 15, fontFamily: "SpaceGrotesk_400Regular", color: "rgba(255,255,255,0.5)" },
  resultsSection: { paddingHorizontal: 16, gap: 12 },
  resultsHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 4 },
  resultsTitle: { fontSize: 11, fontFamily: "SpaceGrotesk_600SemiBold", letterSpacing: 1 },
  resultsBadge: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, borderWidth: 1 },
  resultsDot: { width: 6, height: 6, borderRadius: 3 },
  resultsBadgeText: { fontSize: 11, fontFamily: "SpaceGrotesk_600SemiBold" },
  placeCard: { borderRadius: 14, borderWidth: 1, padding: 14, gap: 10 },
  placeHeader: { flexDirection: "row", gap: 12, alignItems: "flex-start" },
  placeIcon: { width: 38, height: 38, borderRadius: 10, alignItems: "center", justifyContent: "center", marginTop: 2 },
  placeName: { fontSize: 15, fontFamily: "SpaceGrotesk_600SemiBold" },
  placeAddress: { fontSize: 13, fontFamily: "SpaceGrotesk_400Regular", marginTop: 2, lineHeight: 17 },
  mapsBtn: { width: 32, height: 32, alignItems: "center", justifyContent: "center" },
  placeMeta: { flexDirection: "row", alignItems: "center", gap: 6 },
  stars: { flexDirection: "row", alignItems: "center", gap: 2 },
  ratingText: { fontSize: 13, fontFamily: "SpaceGrotesk_600SemiBold", marginLeft: 4 },
  totalRatings: { fontSize: 11, fontFamily: "SpaceGrotesk_400Regular" },
  addBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 10, borderRadius: 10 },
  addBtnText: { fontSize: 15, fontFamily: "SpaceGrotesk_600SemiBold" },
});
