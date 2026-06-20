import AsyncStorage from "@react-native-async-storage/async-storage";
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

const CACHE_KEY = "@jade_ia:empresa";

const API_BASE =
  Platform.OS === "web"
    ? ""
    : `https://${process.env.EXPO_PUBLIC_DOMAIN ?? ""}`;

const C = {
  bg: "#0A0A0F",
  card: "#111118",
  border: "#1E1E2E",
  surface: "#16161F",
  text: "#FFFFFF",
  muted: "#7777AA",
  sub: "#AAAACC",
  primary: "#FF0080",
  purple: "#8400FF",
  success: "#00D68F",
};

const SEGMENTOS = [
  "Varejo", "Imóveis", "SaaS", "Saúde", "Educação",
  "Financeiro", "Alimentação", "Indústria", "Serviços", "Outro",
];

interface TomCard {
  id: string;
  label: string;
  emoji: string;
  desc: string;
  color: string;
}

const TOMS: TomCard[] = [
  { id: "formal",      label: "Formal",       emoji: "👔", desc: "Linguagem corporativa e técnica",         color: "#4ECDC4" },
  { id: "consultivo",  label: "Consultivo",   emoji: "🎯", desc: "Consultora estratégica e parceira",       color: "#6C63FF" },
  { id: "descontraido",label: "Descontraído", emoji: "😊", desc: "Próximo, leve e autêntico",               color: "#00D68F" },
  { id: "agressivo",   label: "Vendas",       emoji: "🔥", desc: "Direto ao ponto, foco em fechamento",    color: "#FF0080" },
  { id: "empatico",    label: "Empático",     emoji: "💜", desc: "Acolhedor, escuta ativa e humanizado",   color: "#8400FF" },
];

interface EmpresaConfig {
  nome: string;
  produto: string;
  segmento: string;
  tom: string;
  planos: string;
}

const DEFAULT: EmpresaConfig = {
  nome: "",
  produto: "",
  segmento: "Alimentação",
  tom: "consultivo",
  planos: "",
};

export default function EmpresaScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [config, setConfig] = useState<EmpresaConfig>(DEFAULT);
  const [showSegPicker, setShowSegPicker] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  useEffect(() => {
    AsyncStorage.getItem(CACHE_KEY).then((raw) => {
      if (raw) {
        try { setConfig({ ...DEFAULT, ...JSON.parse(raw) }); } catch {}
      }
    });
  }, []);

  const update = (key: keyof EmpresaConfig) => (val: string) =>
    setConfig((prev) => ({ ...prev, [key]: val }));

  const handleSave = async () => {
    if (!config.nome.trim() || !config.produto.trim()) {
      Alert.alert("Campos obrigatórios", "Preencha o nome da empresa e o produto/serviço principal.");
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSaving(true);

    try {
      await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(config));

      const res = await fetch(`${API_BASE}/api/empresa`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });

      if (!res.ok) throw new Error("API error");

      setSaved(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(config));
      setSaved(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setTimeout(() => setSaved(false), 3000);
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={[S.root, { backgroundColor: C.bg }]}>
      {/* Header */}
      <View style={[S.header, { paddingTop: topPad }]}>
        <TouchableOpacity style={S.backBtn} onPress={() => router.back()} activeOpacity={0.8}>
          <Feather name="arrow-left" size={22} color={C.text} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={S.headerTitle}>Minha Empresa</Text>
          <Text style={S.headerSub}>Configura e treina a JADE para o seu negócio</Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[S.scroll, { paddingBottom: insets.bottom + 100 }]}
      >
        {/* Info banner */}
        <View style={S.infoBanner}>
          <View style={S.infoBannerIcon}>
            <Feather name="cpu" size={18} color={C.primary} />
          </View>
          <Text style={S.infoBannerText}>
            Essas informações personalizam a JADE para o seu negócio. Quanto mais completo, mais precisa ela fica.
          </Text>
        </View>

        {/* ── Seção 1: Empresa ── */}
        <Text style={S.sectionLabel}>SOBRE A EMPRESA</Text>

        <View style={S.fieldGroup}>
          <Text style={S.label}>Nome da empresa *</Text>
          <View style={[S.inputWrap, { borderColor: config.nome ? C.primary + "60" : C.border }]}>
            <Feather name="briefcase" size={16} color={C.muted} style={S.inputIcon} />
            <TextInput
              style={S.input}
              placeholder="Ex: JÁ Delivery"
              placeholderTextColor={C.muted}
              value={config.nome}
              onChangeText={update("nome")}
              returnKeyType="next"
            />
          </View>
        </View>

        <View style={S.fieldGroup}>
          <Text style={S.label}>Produto / Serviço principal *</Text>
          <View style={[S.inputWrap, { borderColor: config.produto ? C.primary + "60" : C.border }]}>
            <Feather name="package" size={16} color={C.muted} style={S.inputIcon} />
            <TextInput
              style={S.input}
              placeholder="Ex: Plataforma de delivery local"
              placeholderTextColor={C.muted}
              value={config.produto}
              onChangeText={update("produto")}
              returnKeyType="next"
            />
          </View>
        </View>

        {/* Segmento picker */}
        <View style={S.fieldGroup}>
          <Text style={S.label}>Segmento</Text>
          <TouchableOpacity
            style={[S.inputWrap, { borderColor: C.border }]}
            onPress={() => setShowSegPicker((v) => !v)}
            activeOpacity={0.8}
          >
            <Feather name="tag" size={16} color={C.muted} style={S.inputIcon} />
            <Text style={[S.input, { color: C.text }]}>{config.segmento}</Text>
            <Feather name={showSegPicker ? "chevron-up" : "chevron-down"} size={16} color={C.muted} />
          </TouchableOpacity>
          {showSegPicker && (
            <View style={S.picker}>
              {SEGMENTOS.map((seg) => (
                <TouchableOpacity
                  key={seg}
                  style={[S.pickerItem, seg === config.segmento && S.pickerItemActive]}
                  onPress={() => { update("segmento")(seg); setShowSegPicker(false); }}
                  activeOpacity={0.8}
                >
                  <Text style={[S.pickerText, { color: seg === config.segmento ? C.primary : C.text }]}>
                    {seg}
                  </Text>
                  {seg === config.segmento && <Feather name="check" size={14} color={C.primary} />}
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* ── Seção 2: Tom da JADE ── */}
        <Text style={[S.sectionLabel, { marginTop: 8 }]}>TOM DA JADE</Text>
        <Text style={S.sectionSub}>Como a JADE deve se comunicar com seus leads</Text>

        <View style={S.tomsGrid}>
          {TOMS.map((tom) => {
            const selected = config.tom === tom.id;
            return (
              <TouchableOpacity
                key={tom.id}
                style={[S.tomCard, selected && { borderColor: tom.color, backgroundColor: tom.color + "10" }]}
                onPress={() => { Haptics.selectionAsync(); update("tom")(tom.id); }}
                activeOpacity={0.8}
              >
                <Text style={S.tomEmoji}>{tom.emoji}</Text>
                <Text style={[S.tomLabel, selected && { color: tom.color }]}>{tom.label}</Text>
                <Text style={S.tomDesc}>{tom.desc}</Text>
                {selected && (
                  <View style={[S.tomCheck, { backgroundColor: tom.color }]}>
                    <Feather name="check" size={10} color="#fff" />
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ── Seção 3: Planos/Produtos ── */}
        <Text style={[S.sectionLabel, { marginTop: 8 }]}>PLANOS E PRODUTOS</Text>
        <Text style={S.sectionSub}>Liste os planos, preços e diferenciais — a JADE usará nos argumentos de venda</Text>

        <View style={[S.textareaWrap, { borderColor: config.planos ? C.primary + "60" : C.border }]}>
          <TextInput
            style={S.textarea}
            placeholder={`Ex:\n• Starter: R$19,90/mês — entrega básica\n• Full: 11,99% — frota própria\n• Diferencial: pagamento em 1 dia útil`}
            placeholderTextColor={C.muted}
            value={config.planos}
            onChangeText={update("planos")}
            multiline
            numberOfLines={5}
            textAlignVertical="top"
          />
        </View>

        {/* ── Save button ── */}
        <TouchableOpacity
          style={[S.saveBtn, saving && { opacity: 0.7 }, saved && { backgroundColor: C.success }]}
          onPress={handleSave}
          disabled={saving}
          activeOpacity={0.85}
        >
          {saving ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : saved ? (
            <>
              <Feather name="check" size={18} color="#fff" />
              <Text style={S.saveBtnText}>JADE treinada com sucesso!</Text>
            </>
          ) : (
            <>
              <Feather name="cpu" size={18} color="#fff" />
              <Text style={S.saveBtnText}>Salvar e Treinar JADE</Text>
            </>
          )}
        </TouchableOpacity>

        {saved && (
          <View style={S.savedNote}>
            <Text style={S.savedNoteText}>
              A JADE agora conhece sua empresa e usará essas informações em todas as interações.
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const S = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: "row", alignItems: "flex-start", gap: 14,
    paddingHorizontal: 20, paddingBottom: 16,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.border,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: C.surface, alignItems: "center", justifyContent: "center",
    marginTop: 4,
  },
  headerTitle: { fontSize: 18, fontFamily: "SpaceGrotesk_700Bold", color: C.text },
  headerSub: { fontSize: 12, fontFamily: "SpaceGrotesk_400Regular", color: C.muted, marginTop: 2 },
  scroll: { padding: 20, gap: 14 },

  infoBanner: {
    flexDirection: "row", alignItems: "flex-start", gap: 12,
    backgroundColor: C.primary + "10", borderWidth: 1, borderColor: C.primary + "30",
    borderRadius: 14, padding: 14, marginBottom: 8,
  },
  infoBannerIcon: {
    width: 34, height: 34, borderRadius: 10,
    backgroundColor: C.primary + "18", alignItems: "center", justifyContent: "center",
  },
  infoBannerText: {
    flex: 1, fontSize: 13, fontFamily: "SpaceGrotesk_400Regular",
    color: C.sub, lineHeight: 20,
  },

  sectionLabel: {
    fontSize: 11, fontFamily: "SpaceGrotesk_700Bold", color: C.muted,
    letterSpacing: 1.2, marginBottom: 4,
  },
  sectionSub: {
    fontSize: 12, fontFamily: "SpaceGrotesk_400Regular", color: C.muted,
    marginBottom: 12, lineHeight: 18,
  },

  fieldGroup: { gap: 6, marginBottom: 4 },
  label: { fontSize: 12, fontFamily: "SpaceGrotesk_500Medium", color: C.muted, textTransform: "uppercase", letterSpacing: 0.5 },
  inputWrap: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: C.card, borderRadius: 12, borderWidth: 1,
    paddingHorizontal: 14, height: 50,
  },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, fontSize: 15, fontFamily: "SpaceGrotesk_400Regular", color: C.text },

  picker: {
    backgroundColor: C.card, borderRadius: 12, borderWidth: 1,
    borderColor: C.border, marginTop: 4, overflow: "hidden",
  },
  pickerItem: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingVertical: 12,
  },
  pickerItemActive: { backgroundColor: C.primary + "10" },
  pickerText: { fontSize: 15, fontFamily: "SpaceGrotesk_500Medium" },

  tomsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 4 },
  tomCard: {
    width: "47%", flexGrow: 1,
    backgroundColor: C.card, borderRadius: 14, borderWidth: 1.5,
    borderColor: C.border, padding: 14, gap: 4, position: "relative",
  },
  tomEmoji: { fontSize: 24, marginBottom: 4 },
  tomLabel: { fontSize: 14, fontFamily: "SpaceGrotesk_700Bold", color: C.text },
  tomDesc: { fontSize: 11, fontFamily: "SpaceGrotesk_400Regular", color: C.muted, lineHeight: 16 },
  tomCheck: {
    position: "absolute", top: 10, right: 10,
    width: 18, height: 18, borderRadius: 9,
    alignItems: "center", justifyContent: "center",
  },

  textareaWrap: {
    backgroundColor: C.card, borderRadius: 14, borderWidth: 1,
    padding: 14, minHeight: 120, marginBottom: 4,
  },
  textarea: {
    fontSize: 14, fontFamily: "SpaceGrotesk_400Regular",
    color: C.text, lineHeight: 22,
  },

  saveBtn: {
    backgroundColor: C.primary, flexDirection: "row",
    alignItems: "center", justifyContent: "center",
    gap: 10, height: 54, borderRadius: 14, marginTop: 8,
    shadowColor: C.primary, shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4, shadowRadius: 18, elevation: 10,
  },
  saveBtnText: { fontSize: 16, fontFamily: "SpaceGrotesk_700Bold", color: "#fff" },

  savedNote: {
    backgroundColor: "#00D68F18", borderRadius: 12,
    borderWidth: 1, borderColor: "#00D68F33", padding: 14,
  },
  savedNoteText: {
    fontSize: 13, fontFamily: "SpaceGrotesk_400Regular",
    color: "#00D68F", textAlign: "center", lineHeight: 20,
  },
});
