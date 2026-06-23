import AsyncStorage from "@react-native-async-storage/async-storage";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { BRAZIL_STATES } from "@/constants/brazil-locations";
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { JADE_SEGMENTS } from "@/constants/jade-segments";

const CACHE_KEY = "@jade_ia:empresa_v2";

const API_BASE =
  Platform.OS === "web"
    ? ""
    : `https://${process.env.EXPO_PUBLIC_DOMAIN ?? ""}`;

const C = {
  bg: "#0B0814",
  card: "#111118",
  border: "#1E1E2E",
  surface: "#16161F",
  text: "#FFFFFF",
  muted: "#7777AA",
  sub: "#AAAACC",
  primary: "#FF0080",
  purple: "#8400FF",
  success: "rgba(255,255,255,0.55)",
};

interface TomCard {
  id: string;
  label: string;
  emoji: string;
  desc: string;
  color: string;
}

const TOMS: TomCard[] = [
  { id: "formal",       label: "Formal",       emoji: "👔", desc: "Linguagem corporativa e técnica",      color: "#FF0080" },
  { id: "consultivo",   label: "Consultivo",   emoji: "🎯", desc: "Consultora estratégica e parceira",    color: "#FF0080" },
  { id: "descontraido", label: "Descontraído", emoji: "😊", desc: "Próximo, leve e autêntico",            color: "#8400FF" },
  { id: "agressivo",    label: "Vendas",       emoji: "🔥", desc: "Direto ao ponto, foco em fechamento", color: "#FF0080" },
  { id: "empatico",     label: "Empático",     emoji: "💜", desc: "Acolhedor, escuta ativa e humanizado", color: "#8400FF" },
];

interface Produto {
  id: string;
  nome: string;
  valor: string;
  temCampanha: boolean;
  descricaoCampanha: string;
}

interface EmpresaConfig {
  nome: string;
  cidade: string;
  estado: string;
  segmento: string;
  tom: string;
  modoOperacao: string;
  produtos: Produto[];
}

interface ModoCard {
  id: string;
  label: string;
  emoji: string;
  desc: string;
  color: string;
}

const MODOS: ModoCard[] = [
  { id: "fechamento",            label: "Direto ao Fechamento",        emoji: "🎯", desc: "Produto simples, decide na hora. JADE vai direto pra venda.",        color: "#FF0080" },
  { id: "consultivo_presencial", label: "Agendar + Fechar Presencial", emoji: "📅", desc: "Venda consultiva, ticket alto. JADE agenda reuniões.",              color: "#FF0080" },
  { id: "nutricao",              label: "Nutrição + Relacionamento",   emoji: "🌱", desc: "Ciclo longo. JADE nutre o lead até ele estar pronto.",              color: "#8400FF" },
];

function novoProduto(): Produto {
  return { id: Date.now().toString(), nome: "", valor: "", temCampanha: false, descricaoCampanha: "" };
}

const DEFAULT: EmpresaConfig = {
  nome: "",
  cidade: "",
  estado: "",
  segmento: "Alimentação",
  tom: "consultivo",
  modoOperacao: "fechamento",
  produtos: [novoProduto()],
};

export default function EmpresaScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [config, setConfig] = useState<EmpresaConfig>(DEFAULT);
  const [showSegPicker, setShowSegPicker] = useState(false);
  const [showEstadoPicker, setShowEstadoPicker] = useState(false);
  const [showCidadePicker, setShowCidadePicker] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const estadoData = BRAZIL_STATES.find((s) => s.sigla === config.estado || s.nome === config.estado);
  const cidadesDoEstado = estadoData?.cidades ?? [];

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  useEffect(() => {
    AsyncStorage.getItem(CACHE_KEY).then((raw) => {
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          setConfig({ ...DEFAULT, ...parsed, produtos: parsed.produtos?.length ? parsed.produtos : DEFAULT.produtos });
        } catch {}
      }
    });
  }, []);

  const updateField = (key: keyof Omit<EmpresaConfig, "produtos">) => (val: string) =>
    setConfig((prev) => ({ ...prev, [key]: val }));

  const updateProduto = (id: string, key: keyof Produto, val: string | boolean) =>
    setConfig((prev) => ({
      ...prev,
      produtos: prev.produtos.map((p) => (p.id === id ? { ...p, [key]: val } : p)),
    }));

  const addProduto = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setConfig((prev) => ({ ...prev, produtos: [...prev.produtos, novoProduto()] }));
  };

  const removeProduto = (id: string) => {
    if (config.produtos.length <= 1) {
      Alert.alert("Mínimo 1 produto", "Você precisa ter ao menos um produto cadastrado.");
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setConfig((prev) => ({ ...prev, produtos: prev.produtos.filter((p) => p.id !== id) }));
  };

  const handleSave = async () => {
    if (!config.nome.trim()) {
      Alert.alert("Campos obrigatórios", "Preencha o nome da empresa.");
      return;
    }
    if (config.produtos.some((p) => !p.nome.trim())) {
      Alert.alert("Produto incompleto", "Preencha o nome de todos os produtos.");
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSaving(true);

    const payload = {
      ...config,
      produto: config.produtos[0]?.nome ?? "",
      modoOperacao: config.modoOperacao,
      planos: config.produtos.map((p) =>
        `• ${p.nome}${p.valor ? ` — R$${p.valor}` : ""}${p.temCampanha && p.descricaoCampanha ? ` (Campanha: ${p.descricaoCampanha})` : ""}`
      ).join("\n"),
    };

    try {
      await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(config));
      const res = await fetch(`${API_BASE}/api/empresa`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
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
              onChangeText={updateField("nome")}
              returnKeyType="next"
            />
          </View>
        </View>

        {/* Estado */}
        <View style={S.fieldGroup}>
          <Text style={S.label}>Estado</Text>
          <TouchableOpacity
            style={[S.inputWrap, { borderColor: config.estado ? C.primary + "60" : C.border }]}
            onPress={() => { setShowEstadoPicker((v) => !v); setShowCidadePicker(false); }}
            activeOpacity={0.8}
          >
            <Feather name="map" size={16} color={C.muted} style={S.inputIcon} />
            <Text style={[S.input, { color: config.estado ? C.text : C.muted }]}>
              {config.estado
                ? `${BRAZIL_STATES.find((s) => s.sigla === config.estado)?.nome ?? config.estado} (${config.estado})`
                : "Selecione o estado"}
            </Text>
            <Feather name={showEstadoPicker ? "chevron-up" : "chevron-down"} size={16} color={C.muted} />
          </TouchableOpacity>
          {showEstadoPicker && (
            <ScrollView style={[S.picker, { maxHeight: 220 }]} nestedScrollEnabled>
              {BRAZIL_STATES.map((s) => (
                <TouchableOpacity
                  key={s.sigla}
                  style={[S.pickerItem, s.sigla === config.estado && S.pickerItemActive]}
                  onPress={() => {
                    updateField("estado")(s.sigla);
                    updateField("cidade")("");
                    setShowEstadoPicker(false);
                    Haptics.selectionAsync();
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={[S.pickerText, { color: s.sigla === config.estado ? C.primary : C.text }]}>
                    {s.nome} <Text style={{ color: C.muted }}>({s.sigla})</Text>
                  </Text>
                  {s.sigla === config.estado && <Feather name="check" size={14} color={C.primary} />}
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>

        {/* Cidade */}
        <View style={S.fieldGroup}>
          <Text style={S.label}>Cidade principal</Text>
          <TouchableOpacity
            style={[S.inputWrap, { borderColor: config.cidade ? C.primary + "60" : C.border, opacity: cidadesDoEstado.length === 0 ? 0.5 : 1 }]}
            onPress={() => { if (cidadesDoEstado.length > 0) { setShowCidadePicker((v) => !v); setShowEstadoPicker(false); } }}
            activeOpacity={0.8}
          >
            <Feather name="map-pin" size={16} color={C.muted} style={S.inputIcon} />
            <Text style={[S.input, { color: config.cidade ? C.text : C.muted }]}>
              {config.cidade || (cidadesDoEstado.length === 0 ? "Selecione o estado primeiro" : "Selecione a cidade")}
            </Text>
            <Feather name={showCidadePicker ? "chevron-up" : "chevron-down"} size={16} color={C.muted} />
          </TouchableOpacity>
          {showCidadePicker && cidadesDoEstado.length > 0 && (
            <ScrollView style={[S.picker, { maxHeight: 220 }]} nestedScrollEnabled>
              {cidadesDoEstado.map((c) => (
                <TouchableOpacity
                  key={c}
                  style={[S.pickerItem, c === config.cidade && S.pickerItemActive]}
                  onPress={() => { updateField("cidade")(c); setShowCidadePicker(false); Haptics.selectionAsync(); }}
                  activeOpacity={0.8}
                >
                  <Text style={[S.pickerText, { color: c === config.cidade ? C.primary : C.text }]}>{c}</Text>
                  {c === config.cidade && <Feather name="check" size={14} color={C.primary} />}
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>

        <View style={S.fieldGroup}>
          <Text style={S.label}>Segmento</Text>
          <TouchableOpacity
            style={[S.inputWrap, { borderColor: C.border }]}
            onPress={() => setShowSegPicker((v) => !v)}
            activeOpacity={0.8}
          >
            <Feather name="tag" size={16} color={C.muted} style={S.inputIcon} />
            <Text style={[S.input, { color: C.text }]}>
              {JADE_SEGMENTS.find((s) => s.label === config.segmento)?.emoji
                ? `${JADE_SEGMENTS.find((s) => s.label === config.segmento)!.emoji} ${config.segmento}`
                : config.segmento}
            </Text>
            <Feather name={showSegPicker ? "chevron-up" : "chevron-down"} size={16} color={C.muted} />
          </TouchableOpacity>
          {showSegPicker && (
            <View style={S.picker}>
              {JADE_SEGMENTS.map((seg) => (
                <TouchableOpacity
                  key={seg.id}
                  style={[S.pickerItem, seg.label === config.segmento && S.pickerItemActive]}
                  onPress={() => { updateField("segmento")(seg.label); setShowSegPicker(false); }}
                  activeOpacity={0.8}
                >
                  <Text style={[S.pickerText, { color: seg.label === config.segmento ? C.primary : C.text }]}>
                    {seg.emoji}  {seg.label}
                  </Text>
                  {seg.label === config.segmento && <Feather name="check" size={14} color={C.primary} />}
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
                onPress={() => { Haptics.selectionAsync(); updateField("tom")(tom.id); }}
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

        {/* ── Seção 3: Modo de Operação da JADE ── */}
        <Text style={[S.sectionLabel, { marginTop: 8 }]}>MODO DE OPERAÇÃO DA JADE</Text>
        <Text style={S.sectionSub}>Como a JADE deve conduzir as abordagens e fechar negócios</Text>

        <View style={S.tomsGrid}>
          {MODOS.map((modo) => {
            const selected = config.modoOperacao === modo.id;
            return (
              <TouchableOpacity
                key={modo.id}
                style={[S.tomCard, selected && { borderColor: modo.color, backgroundColor: modo.color + "10" }]}
                onPress={() => { Haptics.selectionAsync(); setConfig((prev) => ({ ...prev, modoOperacao: modo.id })); }}
                activeOpacity={0.8}
              >
                <Text style={S.tomEmoji}>{modo.emoji}</Text>
                <Text style={[S.tomLabel, selected && { color: modo.color }]}>{modo.label}</Text>
                <Text style={S.tomDesc}>{modo.desc}</Text>
                {selected && (
                  <View style={[S.tomCheck, { backgroundColor: modo.color }]}>
                    <Feather name="check" size={10} color="#fff" />
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ── Seção 4: Produtos ── */}
        <Text style={[S.sectionLabel, { marginTop: 8 }]}>PRODUTOS E SERVIÇOS</Text>
        <Text style={S.sectionSub}>A JADE usará esses dados nos argumentos de venda e nas propostas</Text>

        {config.produtos.map((produto, idx) => (
          <View key={produto.id} style={[S.produtoCard, { borderColor: produto.nome ? C.primary + "40" : C.border }]}>
            <View style={S.produtoHeader}>
              <View style={[S.produtoNum, { backgroundColor: C.primary + "20" }]}>
                <Text style={[S.produtoNumText, { color: C.primary }]}>{idx + 1}</Text>
              </View>
              <Text style={[S.produtoTitle, { color: C.text }]}>
                {produto.nome.trim() || `Produto ${idx + 1}`}
              </Text>
              <TouchableOpacity
                style={[S.removeBtn, { backgroundColor: "rgba(255,255,255,0.06)" }]}
                onPress={() => removeProduto(produto.id)}
                activeOpacity={0.7}
              >
                <Feather name="trash-2" size={16} color="rgba(255,255,255,0.5)" />
              </TouchableOpacity>
            </View>

            <View style={S.produtoFields}>
              <View style={S.fieldGroup}>
                <Text style={S.label}>Nome do produto *</Text>
                <View style={[S.inputWrap, { borderColor: produto.nome ? C.primary + "60" : C.border }]}>
                  <Feather name="package" size={16} color={C.muted} style={S.inputIcon} />
                  <TextInput
                    style={S.input}
                    placeholder="Ex: Plano Premium"
                    placeholderTextColor={C.muted}
                    value={produto.nome}
                    onChangeText={(v) => updateProduto(produto.id, "nome", v)}
                    returnKeyType="next"
                  />
                </View>
              </View>

              <View style={S.fieldGroup}>
                <Text style={S.label}>Valor (R$)</Text>
                <View style={[S.inputWrap, { borderColor: produto.valor ? C.primary + "60" : C.border }]}>
                  <Text style={[S.currencySymbol, { color: C.muted }]}>R$</Text>
                  <TextInput
                    style={S.input}
                    placeholder="Ex: 297,00 ou 11,99%"
                    placeholderTextColor={C.muted}
                    value={produto.valor}
                    onChangeText={(v) => updateProduto(produto.id, "valor", v)}
                    keyboardType="default"
                    returnKeyType="next"
                  />
                </View>
              </View>

              <View style={S.campanhaRow}>
                <View style={{ flex: 1 }}>
                  <Text style={[S.campanhaLabel, { color: C.text }]}>Tem campanha de desconto?</Text>
                  <Text style={[S.campanhaSub, { color: C.muted }]}>A JADE vai mencionar na abordagem</Text>
                </View>
                <Switch
                  value={produto.temCampanha}
                  onValueChange={(v) => updateProduto(produto.id, "temCampanha", v)}
                  trackColor={{ false: C.border, true: C.primary + "80" }}
                  thumbColor={produto.temCampanha ? C.primary : C.surface}
                />
              </View>

              {produto.temCampanha && (
                <View style={S.fieldGroup}>
                  <Text style={S.label}>Descrição da campanha</Text>
                  <View style={[S.inputWrap, { borderColor: C.primary + "60", height: "auto" as any, minHeight: 50, paddingVertical: 12 }]}>
                    <Feather name="tag" size={16} color={C.muted} style={[S.inputIcon, { alignSelf: "flex-start", marginTop: 2 }]} />
                    <TextInput
                      style={[S.input, { height: "auto" as any, minHeight: 30 }]}
                      placeholder="Ex: 30% off no primeiro mês, válido até dia 30"
                      placeholderTextColor={C.muted}
                      value={produto.descricaoCampanha}
                      onChangeText={(v) => updateProduto(produto.id, "descricaoCampanha", v)}
                      multiline
                      textAlignVertical="top"
                    />
                  </View>
                </View>
              )}
            </View>
          </View>
        ))}

        <TouchableOpacity style={[S.addProdutoBtn, { borderColor: C.primary + "40" }]} onPress={addProduto} activeOpacity={0.8}>
          <Feather name="plus-circle" size={18} color={C.primary} />
          <Text style={[S.addProdutoBtnText, { color: C.primary }]}>+ Adicionar Produto</Text>
        </TouchableOpacity>

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
            <><Feather name="check" size={18} color="#fff" /><Text style={S.saveBtnText}>JADE treinada com sucesso!</Text></>
          ) : (
            <><Feather name="cpu" size={18} color="#fff" /><Text style={S.saveBtnText}>Salvar e Treinar JADE</Text></>
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
  headerSub: { fontSize: 13, fontFamily: "SpaceGrotesk_400Regular", color: C.muted, marginTop: 2 },
  scroll: { padding: 20, gap: 14 },

  infoBanner: {
    flexDirection: "row", alignItems: "flex-start", gap: 12,
    backgroundColor: C.primary + "10", borderWidth: 1, borderColor: C.primary + "30",
    borderRadius: 14, padding: 14, marginBottom: 8,
  },
  infoBannerIcon: { width: 34, height: 34, borderRadius: 10, backgroundColor: C.primary + "18", alignItems: "center", justifyContent: "center" },
  infoBannerText: { flex: 1, fontSize: 15, fontFamily: "SpaceGrotesk_400Regular", color: C.sub, lineHeight: 20 },

  sectionLabel: { fontSize: 11, fontFamily: "SpaceGrotesk_700Bold", color: C.muted, letterSpacing: 1.2, marginBottom: 4 },
  sectionSub: { fontSize: 13, fontFamily: "SpaceGrotesk_400Regular", color: C.muted, marginBottom: 12, lineHeight: 18 },

  fieldGroup: { gap: 6, marginBottom: 4 },
  label: { fontSize: 13, fontFamily: "SpaceGrotesk_500Medium", color: C.muted, textTransform: "uppercase", letterSpacing: 0.5 },
  inputWrap: { flexDirection: "row", alignItems: "center", backgroundColor: C.card, borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, height: 50 },
  inputIcon: { marginRight: 10 },
  currencySymbol: { fontSize: 15, fontFamily: "SpaceGrotesk_500Medium", marginRight: 6 },
  input: { flex: 1, fontSize: 15, fontFamily: "SpaceGrotesk_400Regular", color: C.text },

  picker: { backgroundColor: C.card, borderRadius: 12, borderWidth: 1, borderColor: C.border, marginTop: 4, overflow: "hidden" },
  pickerItem: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 12 },
  pickerItemActive: { backgroundColor: C.primary + "10" },
  pickerText: { fontSize: 15, fontFamily: "SpaceGrotesk_500Medium" },

  tomsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 4 },
  tomCard: { width: "47%", flexGrow: 1, backgroundColor: C.card, borderRadius: 14, borderWidth: 1.5, borderColor: C.border, padding: 14, gap: 4, position: "relative" },
  tomEmoji: { fontSize: 24, marginBottom: 4 },
  tomLabel: { fontSize: 16, fontFamily: "SpaceGrotesk_700Bold", color: C.text },
  tomDesc: { fontSize: 11, fontFamily: "SpaceGrotesk_400Regular", color: C.muted, lineHeight: 16 },
  tomCheck: { position: "absolute", top: 10, right: 10, width: 18, height: 18, borderRadius: 9, alignItems: "center", justifyContent: "center" },

  produtoCard: { backgroundColor: C.card, borderRadius: 16, borderWidth: 1.5, padding: 16, gap: 12 },
  produtoHeader: { flexDirection: "row", alignItems: "center", gap: 10 },
  produtoNum: { width: 28, height: 28, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  produtoNumText: { fontSize: 15, fontFamily: "SpaceGrotesk_700Bold" },
  produtoTitle: { flex: 1, fontSize: 16, fontFamily: "SpaceGrotesk_600SemiBold" },
  removeBtn: { width: 34, height: 34, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  produtoFields: { gap: 10 },
  campanhaRow: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: C.surface, borderRadius: 12, padding: 14 },
  campanhaLabel: { fontSize: 16, fontFamily: "SpaceGrotesk_500Medium" },
  campanhaSub: { fontSize: 11, fontFamily: "SpaceGrotesk_400Regular", marginTop: 2 },

  addProdutoBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 14, borderWidth: 1.5, borderStyle: "dashed", paddingVertical: 14 },
  addProdutoBtnText: { fontSize: 15, fontFamily: "SpaceGrotesk_600SemiBold" },

  saveBtn: { backgroundColor: C.primary, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, height: 54, borderRadius: 14, marginTop: 8, shadowColor: C.primary, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 18, elevation: 10 },
  saveBtnText: { fontSize: 16, fontFamily: "SpaceGrotesk_700Bold", color: "#fff" },
  savedNote: { backgroundColor: "rgba(255,255,255,0.06)", borderRadius: 12, borderWidth: 1, borderColor: "rgba(255,255,255,0.06)", padding: 14 },
  savedNoteText: { fontSize: 15, fontFamily: "SpaceGrotesk_400Regular", color: "rgba(255,255,255,0.55)", textAlign: "center", lineHeight: 20 },
});
