import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Linking,
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

const TIPOS = ["Restaurante", "Lanchonete", "Açaí", "Pizzaria", "Padaria", "Mercado", "Farmácia", "Academia", "Salão", "Outros"];

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
        <Feather key={i} name="star" size={12} color={i <= Math.round(rating) ? "#FFB300" : color + "44"} />
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
  const { addLead } = useApp();

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

    const COLORS_ARR = ["#FF6B35", "#00D68F", "#6C63FF", "#FFB300", "#FF0080", "#4ECDC4"];
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
          style={[styles.backBtn, { backgroundColor: colors.surface }]}
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

      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
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
          <View style={[styles.errorBox, { backgroundColor: "#FF3B5C18", borderColor: "#FF3B5C33" }]}>
            <Feather name="alert-circle" size={16} color="#FF3B5C" />
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row", alignItems: "center", gap: 14,
    paddingHorizontal: 20, paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 18, fontFamily: "SpaceGrotesk_700Bold" },
  headerSub: { fontSize: 12, fontFamily: "SpaceGrotesk_400Regular", marginTop: 2 },
  form: { padding: 20, gap: 14 },
  locationBtn: {
    flexDirection: "row", alignItems: "center", gap: 10,
    borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, height: 50,
  },
  locationBtnText: { flex: 1, fontSize: 14, fontFamily: "SpaceGrotesk_500Medium" },
  orRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  orLine: { flex: 1, height: StyleSheet.hairlineWidth },
  orText: { fontSize: 11, fontFamily: "SpaceGrotesk_400Regular" },
  fieldGroup: { gap: 6 },
  label: { fontSize: 12, fontFamily: "SpaceGrotesk_500Medium", textTransform: "uppercase", letterSpacing: 0.5 },
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
  errorBox: { flexDirection: "row", alignItems: "center", gap: 10, marginHorizontal: 20, padding: 14, borderRadius: 12, borderWidth: 1 },
  errorText: { flex: 1, fontSize: 13, fontFamily: "SpaceGrotesk_400Regular", color: "#FF3B5C" },
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
  placeAddress: { fontSize: 12, fontFamily: "SpaceGrotesk_400Regular", marginTop: 2, lineHeight: 17 },
  mapsBtn: { width: 32, height: 32, alignItems: "center", justifyContent: "center" },
  placeMeta: { flexDirection: "row", alignItems: "center", gap: 6 },
  stars: { flexDirection: "row", alignItems: "center", gap: 2 },
  ratingText: { fontSize: 12, fontFamily: "SpaceGrotesk_600SemiBold", marginLeft: 4 },
  totalRatings: { fontSize: 11, fontFamily: "SpaceGrotesk_400Regular" },
  addBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 10, borderRadius: 10 },
  addBtnText: { fontSize: 13, fontFamily: "SpaceGrotesk_600SemiBold" },
});
