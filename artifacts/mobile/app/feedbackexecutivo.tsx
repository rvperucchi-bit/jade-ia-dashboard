import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
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

const API_BASE =
  Platform.OS === "web"
    ? ""
    : `https://${process.env.EXPO_PUBLIC_DOMAIN ?? ""}`;

const ENTERPRISE_PURPLE = "#8400FF";

type Humor = "otimo" | "ok" | "dificil" | "ideia";

interface FeedbackItem {
  id: string;
  userId: string;
  userName: string;
  humor: Humor;
  texto?: string;
  data: string;
  createdAt: string;
}

interface AggData {
  today: FeedbackItem[];
  all: FeedbackItem[];
  humors: { otimo: number; ok: number; dificil: number; ideia: number };
  alertas: { userName: string; dias: number }[];
  responderam: number;
  totalTime: number;
}

const HUMOR_OPTIONS: { key: Humor; emoji: string; label: string; color: string; bg: string }[] = [
  { key: "otimo",   emoji: "😄", label: "Mandei bem!",           color: "#00D68F", bg: "#00D68F18" },
  { key: "ok",      emoji: "😐", label: "Ok, travei em algumas", color: "#FFB300", bg: "#FFB30018" },
  { key: "dificil", emoji: "😔", label: "Difícil, precisei de apoio", color: "#FF0080", bg: "rgba(255,0,128,0.08)" },
  { key: "ideia",   emoji: "💡", label: "Tenho uma ideia!",      color: ENTERPRISE_PURPLE, bg: "#8400FF18" },
];

export default function FeedbackExecutivoScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const [tab, setTab] = useState<"checkin" | "painel">("checkin");

  // Check-in state
  const [selectedHumor, setSelectedHumor] = useState<Humor | null>(null);
  const [texto, setTexto] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);

  // Painel state
  const [aggData, setAggData] = useState<AggData | null>(null);
  const [loadingPainel, setLoadingPainel] = useState(false);

  useEffect(() => {
    if (tab === "painel") loadPainel();
  }, [tab]);

  const loadPainel = async () => {
    setLoadingPainel(true);
    try {
      const res = await fetch(`${API_BASE}/api/feedback/executivo`);
      if (res.ok) setAggData(await res.json());
    } catch {}
    finally { setLoadingPainel(false); }
  };

  const handleEnviar = async () => {
    if (!selectedHumor) {
      Alert.alert("Selecione", "Escolha como foi seu dia antes de enviar.");
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setEnviando(true);
    try {
      await fetch(`${API_BASE}/api/feedback/executivo`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ humor: selectedHumor, texto: texto.trim() || undefined, userName: "Você" }),
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setEnviado(true);
    } catch {
      Alert.alert("Erro", "Não foi possível enviar. Tente novamente.");
    } finally {
      setEnviando(false);
    }
  };

  const humorDef = (h: Humor) => HUMOR_OPTIONS.find((o) => o.key === h)!;

  return (
    <View style={[S.root, { backgroundColor: colors.background }]}>
      <View style={[S.header, { paddingTop: topPad, borderBottomColor: colors.border }]}>
        <TouchableOpacity style={[S.backBtn, { backgroundColor: colors.surface }]} onPress={() => router.back()} activeOpacity={0.8}>
          <Feather name="arrow-left" size={20} color={colors.text} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={[S.title, { color: colors.text }]}>Humor do Time</Text>
          <Text style={[S.sub, { color: colors.mutedForeground }]}>Check-in diário dos executivos</Text>
        </View>
        <View style={[S.badge, { backgroundColor: ENTERPRISE_PURPLE + "22" }]}>
          <Text style={[S.badgeText, { color: ENTERPRISE_PURPLE }]}>Enterprise</Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={[S.tabRow, { borderBottomColor: colors.border }]}>
        {(["checkin", "painel"] as const).map((t) => (
          <TouchableOpacity
            key={t}
            style={[S.tabBtn, tab === t && [S.tabBtnActive, { borderBottomColor: ENTERPRISE_PURPLE }]]}
            onPress={() => setTab(t)}
            activeOpacity={0.8}
          >
            <Text style={[S.tabText, { color: tab === t ? ENTERPRISE_PURPLE : colors.mutedForeground }]}>
              {t === "checkin" ? "Meu Check-in" : "Painel do Gestor"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20, paddingBottom: 120, gap: 16 }}>

        {/* ── CHECK-IN TAB ── */}
        {tab === "checkin" && (
          <>
            {enviado ? (
              <View style={[S.successCard, { backgroundColor: "#00D68F18", borderColor: "#00D68F44" }]}>
                <Text style={S.successEmoji}>✅</Text>
                <Text style={[S.successTitle, { color: "#00D68F" }]}>Feedback enviado!</Text>
                <Text style={[S.successSub, { color: colors.mutedForeground }]}>
                  Obrigado por compartilhar. O gestor vai ver seu check-in de hoje.
                </Text>
                <TouchableOpacity
                  style={[S.novaBtn, { backgroundColor: colors.surface }]}
                  onPress={() => { setEnviado(false); setSelectedHumor(null); setTexto(""); }}
                  activeOpacity={0.8}
                >
                  <Text style={[S.novaBtnText, { color: colors.mutedForeground }]}>Atualizar check-in</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                <View style={[S.checkinCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <Text style={[S.checkinEmoji]}>👋</Text>
                  <Text style={[S.checkinTitle, { color: colors.text }]}>Como foi seu dia hoje?</Text>
                  <Text style={[S.checkinSub, { color: colors.mutedForeground }]}>
                    Seu check-in é anônimo para o time. O gestor vê apenas o agregado.
                  </Text>
                </View>

                <Text style={[S.sectionLabel, { color: colors.mutedForeground }]}>SELECIONE SEU HUMOR</Text>

                <View style={S.humorGrid}>
                  {HUMOR_OPTIONS.map((opt) => {
                    const sel = selectedHumor === opt.key;
                    return (
                      <TouchableOpacity
                        key={opt.key}
                        style={[S.humorBtn, { backgroundColor: sel ? opt.bg : colors.card, borderColor: sel ? opt.color : colors.border }]}
                        onPress={() => { Haptics.selectionAsync(); setSelectedHumor(opt.key); }}
                        activeOpacity={0.8}
                      >
                        <Text style={S.humorEmoji}>{opt.emoji}</Text>
                        <Text style={[S.humorLabel, { color: sel ? opt.color : colors.text }]}>{opt.label}</Text>
                        {sel && <View style={[S.humorCheck, { backgroundColor: opt.color }]}><Feather name="check" size={10} color="#fff" /></View>}
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <Text style={[S.sectionLabel, { color: colors.mutedForeground }]}>QUER CONTAR MAIS? (OPCIONAL)</Text>
                <View style={[S.textareaWrap, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <TextInput
                    style={[S.textarea, { color: colors.text }]}
                    placeholder="Ex: Tive dificuldade com objeções de preço hoje..."
                    placeholderTextColor={colors.mutedForeground}
                    value={texto}
                    onChangeText={setTexto}
                    multiline
                    numberOfLines={3}
                    textAlignVertical="top"
                  />
                </View>

                <View style={S.actionRow}>
                  <TouchableOpacity
                    style={[S.skipBtn, { backgroundColor: colors.surface }]}
                    onPress={() => router.back()}
                    activeOpacity={0.8}
                  >
                    <Text style={[S.skipText, { color: colors.mutedForeground }]}>Agora não</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[S.sendBtn, { backgroundColor: ENTERPRISE_PURPLE }, (enviando || !selectedHumor) && { opacity: 0.6 }]}
                    onPress={handleEnviar}
                    disabled={enviando || !selectedHumor}
                    activeOpacity={0.85}
                  >
                    {enviando
                      ? <ActivityIndicator color="#fff" size="small" />
                      : <><Feather name="send" size={16} color="#fff" /><Text style={S.sendText}>Enviar</Text></>
                    }
                  </TouchableOpacity>
                </View>
              </>
            )}
          </>
        )}

        {/* ── PAINEL TAB ── */}
        {tab === "painel" && (
          <>
            {loadingPainel ? (
              <ActivityIndicator color={ENTERPRISE_PURPLE} style={{ marginTop: 40 }} />
            ) : aggData ? (
              <>
                {/* Alertas */}
                {aggData.alertas.length > 0 && (
                  <View style={[S.alertaCard, { backgroundColor: "rgba(255,0,128,0.06)", borderColor: "rgba(255,0,128,0.27)" }]}>
                    <Feather name="alert-triangle" size={18} color="#FF0080" />
                    <View style={{ flex: 1 }}>
                      <Text style={[S.alertaTitle, { color: "#FF0080" }]}>Atenção</Text>
                      {aggData.alertas.map((a, i) => (
                        <Text key={i} style={[S.alertaText, { color: colors.mutedForeground }]}>
                          {a.userName} marcou 😔 por {a.dias} dias consecutivos
                        </Text>
                      ))}
                    </View>
                  </View>
                )}

                {/* Resumo */}
                <View style={S.resumoRow}>
                  <View style={[S.resumoCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <Text style={[S.resumoNum, { color: colors.text }]}>{aggData.responderam}</Text>
                    <Text style={[S.resumoLabel, { color: colors.mutedForeground }]}>responderam hoje</Text>
                  </View>
                  <View style={[S.resumoCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <Text style={[S.resumoNum, { color: colors.text }]}>{aggData.totalTime}</Text>
                    <Text style={[S.resumoLabel, { color: colors.mutedForeground }]}>no time</Text>
                  </View>
                  <View style={[S.resumoCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <Text style={[S.resumoNum, { color: "#00D68F" }]}>{aggData.humors.otimo}</Text>
                    <Text style={[S.resumoLabel, { color: colors.mutedForeground }]}>😄 ótimo</Text>
                  </View>
                </View>

                {/* Distribuição */}
                <Text style={[S.sectionLabel, { color: colors.mutedForeground }]}>DISTRIBUIÇÃO DE HUMOR (GERAL)</Text>
                <View style={[S.distribCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  {HUMOR_OPTIONS.map((opt) => {
                    const count = aggData.humors[opt.key] ?? 0;
                    const total = Object.values(aggData.humors).reduce((a, b) => a + b, 0) || 1;
                    const pct = Math.round((count / total) * 100);
                    return (
                      <View key={opt.key} style={S.distribRow}>
                        <Text style={S.distribEmoji}>{opt.emoji}</Text>
                        <Text style={[S.distribLabel, { color: colors.mutedForeground }]}>{opt.label}</Text>
                        <View style={[S.distribTrack, { backgroundColor: colors.surface }]}>
                          <View style={[S.distribFill, { width: `${pct}%` as any, backgroundColor: opt.color }]} />
                        </View>
                        <Text style={[S.distribCount, { color: opt.color }]}>{count}</Text>
                      </View>
                    );
                  })}
                </View>

                {/* Today's feedbacks */}
                <Text style={[S.sectionLabel, { color: colors.mutedForeground }]}>HOJE</Text>
                {aggData.today.length === 0 ? (
                  <View style={[S.emptyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <Text style={[S.emptyText, { color: colors.mutedForeground }]}>Nenhum check-in hoje ainda.</Text>
                  </View>
                ) : aggData.today.map((fb) => {
                  const def = humorDef(fb.humor);
                  return (
                    <View key={fb.id} style={[S.fbCard, { backgroundColor: colors.card, borderColor: colors.border, borderLeftColor: def.color, borderLeftWidth: 3 }]}>
                      <View style={S.fbHeader}>
                        <Text style={S.fbEmoji}>{def.emoji}</Text>
                        <View style={{ flex: 1 }}>
                          <Text style={[S.fbName, { color: colors.text }]}>{fb.userName}</Text>
                          <Text style={[S.fbDef, { color: def.color }]}>{def.label}</Text>
                        </View>
                        <Text style={[S.fbTime, { color: colors.mutedForeground }]}>
                          {new Date(fb.createdAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </>
            ) : null}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const S = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 20, paddingBottom: 14, borderBottomWidth: StyleSheet.hairlineWidth },
  backBtn: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 18, fontFamily: "SpaceGrotesk_700Bold" },
  sub: { fontSize: 13, fontFamily: "SpaceGrotesk_400Regular", marginTop: 2 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  badgeText: { fontSize: 11, fontFamily: "SpaceGrotesk_700Bold" },
  tabRow: { flexDirection: "row", borderBottomWidth: StyleSheet.hairlineWidth },
  tabBtn: { flex: 1, alignItems: "center", paddingVertical: 14, borderBottomWidth: 2, borderBottomColor: "transparent" },
  tabBtnActive: {},
  tabText: { fontSize: 16, fontFamily: "SpaceGrotesk_600SemiBold" },
  sectionLabel: { fontSize: 11, fontFamily: "SpaceGrotesk_700Bold", letterSpacing: 1 },
  checkinCard: { borderRadius: 16, borderWidth: 1, padding: 20, alignItems: "center", gap: 8 },
  checkinEmoji: { fontSize: 36 },
  checkinTitle: { fontSize: 20, fontFamily: "SpaceGrotesk_700Bold", textAlign: "center" },
  checkinSub: { fontSize: 15, fontFamily: "SpaceGrotesk_400Regular", textAlign: "center", lineHeight: 20 },
  humorGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  humorBtn: { width: "47%", flexGrow: 1, borderRadius: 14, borderWidth: 1.5, padding: 14, alignItems: "center", gap: 6, position: "relative" },
  humorEmoji: { fontSize: 32 },
  humorLabel: { fontSize: 13, fontFamily: "SpaceGrotesk_600SemiBold", textAlign: "center", lineHeight: 18 },
  humorCheck: { position: "absolute", top: 10, right: 10, width: 18, height: 18, borderRadius: 9, alignItems: "center", justifyContent: "center" },
  textareaWrap: { borderRadius: 12, borderWidth: 1, padding: 14, minHeight: 90 },
  textarea: { fontSize: 16, fontFamily: "SpaceGrotesk_400Regular", lineHeight: 22 },
  actionRow: { flexDirection: "row", gap: 12 },
  skipBtn: { flex: 1, height: 52, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  skipText: { fontSize: 15, fontFamily: "SpaceGrotesk_500Medium" },
  sendBtn: { flex: 2, height: 52, borderRadius: 14, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  sendText: { color: "#fff", fontSize: 15, fontFamily: "SpaceGrotesk_700Bold" },
  successCard: { borderRadius: 16, borderWidth: 1, padding: 24, alignItems: "center", gap: 12 },
  successEmoji: { fontSize: 48 },
  successTitle: { fontSize: 20, fontFamily: "SpaceGrotesk_700Bold" },
  successSub: { fontSize: 16, fontFamily: "SpaceGrotesk_400Regular", textAlign: "center", lineHeight: 21 },
  novaBtn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12, marginTop: 4 },
  novaBtnText: { fontSize: 16, fontFamily: "SpaceGrotesk_500Medium" },
  alertaCard: { flexDirection: "row", alignItems: "flex-start", gap: 12, borderRadius: 14, borderWidth: 1, padding: 14 },
  alertaTitle: { fontSize: 16, fontFamily: "SpaceGrotesk_700Bold", marginBottom: 4 },
  alertaText: { fontSize: 15, fontFamily: "SpaceGrotesk_400Regular", lineHeight: 20 },
  resumoRow: { flexDirection: "row", gap: 10 },
  resumoCard: { flex: 1, borderRadius: 12, borderWidth: 1, padding: 14, alignItems: "center" },
  resumoNum: { fontSize: 26, fontFamily: "SpaceGrotesk_700Bold" },
  resumoLabel: { fontSize: 11, fontFamily: "SpaceGrotesk_400Regular", textAlign: "center", marginTop: 2 },
  distribCard: { borderRadius: 14, borderWidth: 1, padding: 16, gap: 14 },
  distribRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  distribEmoji: { fontSize: 18, width: 28 },
  distribLabel: { fontSize: 11, fontFamily: "SpaceGrotesk_400Regular", width: 110 },
  distribTrack: { flex: 1, height: 6, borderRadius: 4, overflow: "hidden" },
  distribFill: { height: "100%", borderRadius: 4 },
  distribCount: { fontSize: 16, fontFamily: "SpaceGrotesk_700Bold", width: 24, textAlign: "right" },
  emptyCard: { borderRadius: 14, borderWidth: 1, padding: 20, alignItems: "center" },
  emptyText: { fontSize: 16, fontFamily: "SpaceGrotesk_400Regular" },
  fbCard: { borderRadius: 14, borderWidth: 1, padding: 14 },
  fbHeader: { flexDirection: "row", alignItems: "center", gap: 12 },
  fbEmoji: { fontSize: 24 },
  fbName: { fontSize: 15, fontFamily: "SpaceGrotesk_700Bold" },
  fbDef: { fontSize: 13, fontFamily: "SpaceGrotesk_400Regular", marginTop: 2 },
  fbTime: { fontSize: 13, fontFamily: "SpaceGrotesk_400Regular" },
});
