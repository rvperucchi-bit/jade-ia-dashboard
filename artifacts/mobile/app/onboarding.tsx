import React, { useMemo, useRef, useState } from "react";
import {
  Animated,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
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
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";

import { useOnboarding } from "@/context/OnboardingContext";
import { JADE_SEGMENTS } from "@/constants/jade-segments";
import { BRAZIL_STATES } from "@/constants/brazil-locations";

const PINK   = "#FF0080";
const BG     = "#0A0A0F";
const CARD   = "#111118";
const BORDER = "#252535";

// ─── Flat city list ────────────────────────────────────────────────────────────
const ALL_CITIES: { label: string; city: string; state: string }[] = BRAZIL_STATES.flatMap((s) =>
  s.cidades.map((c) => ({ label: `${c} — ${s.sigla}`, city: c, state: s.sigla }))
);

// ─── Floating Label Input ─────────────────────────────────────────────────────
function FloatingInput({
  label, value, onChangeText, keyboardType, autoCapitalize, optional,
}: {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  keyboardType?: "default" | "url" | "email-address";
  autoCapitalize?: "none" | "words" | "sentences";
  optional?: boolean;
}) {
  const [focused, setFocused] = useState(false);
  const anim = useRef(new Animated.Value(value ? 1 : 0)).current;
  const go   = (to: number) => Animated.timing(anim, { toValue: to, duration: 150, useNativeDriver: false }).start();

  return (
    <View style={F.wrap}>
      <Animated.Text style={[F.label, {
        top:      anim.interpolate({ inputRange: [0, 1], outputRange: [15, -9] }),
        fontSize: anim.interpolate({ inputRange: [0, 1], outputRange: [15, 11] }),
        color:    focused ? PINK : "rgba(255,255,255,0.45)",
      }]}>
        {label}{optional ? <Text style={{ color: "rgba(255,255,255,0.28)", fontSize: 11 }}> (opcional)</Text> : null}
      </Animated.Text>
      <TextInput
        style={[F.input, focused && { borderColor: PINK + "55" }]}
        value={value}
        onChangeText={onChangeText}
        onFocus={() => { setFocused(true); go(1); }}
        onBlur={() => { setFocused(false); if (!value) go(0); }}
        keyboardType={keyboardType ?? "default"}
        autoCapitalize={autoCapitalize ?? "words"}
        placeholderTextColor="transparent"
      />
    </View>
  );
}

const F = StyleSheet.create({
  wrap:  { position: "relative", marginTop: 4 },
  label: {
    position: "absolute", left: 14, zIndex: 2,
    fontFamily: "SpaceGrotesk_500Medium",
    backgroundColor: BG, paddingHorizontal: 3,
  },
  input: {
    backgroundColor: CARD, borderRadius: 12, borderWidth: 1, borderColor: BORDER,
    height: 52, paddingHorizontal: 14, paddingTop: 8,
    fontSize: 15, fontFamily: "SpaceGrotesk_400Regular", color: "#fff",
  },
});

// ─── Selector Field ────────────────────────────────────────────────────────────
function SelectorField({
  label, value, onPress, placeholder,
}: {
  label: string;
  value: string;
  onPress: () => void;
  placeholder?: string;
}) {
  const hasVal = !!value;
  return (
    <TouchableOpacity
      style={[F.input, { height: 52, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingTop: 0, marginTop: 4, borderColor: hasVal ? PINK + "55" : BORDER }]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <View style={{ position: "absolute", top: -9, left: 11, backgroundColor: BG, paddingHorizontal: 3, zIndex: 2 }}>
        <Text style={{ fontSize: 11, fontFamily: "SpaceGrotesk_500Medium", color: hasVal ? PINK : "rgba(255,255,255,0.45)" }}>{label}</Text>
      </View>
      <Text style={{ fontSize: 15, fontFamily: "SpaceGrotesk_400Regular", color: hasVal ? "#fff" : "rgba(255,255,255,0.28)", flex: 1 }}>
        {value || placeholder || "Selecionar…"}
      </Text>
      <Feather name="chevron-down" size={16} color="rgba(255,255,255,0.3)" />
    </TouchableOpacity>
  );
}

// ─── Search Modal ─────────────────────────────────────────────────────────────
function SearchModal<T>({
  visible, title, items, getLabel, getKey, onSelect, onClose, renderLeft,
}: {
  visible: boolean;
  title: string;
  items: T[];
  getLabel: (item: T) => string;
  getKey: (item: T) => string;
  onSelect: (item: T) => void;
  onClose: () => void;
  renderLeft?: (item: T) => React.ReactNode;
}) {
  const [q, setQ] = useState("");
  const filtered = useMemo(() => {
    const lq = q.toLowerCase();
    return lq ? items.filter((i) => getLabel(i).toLowerCase().includes(lq)) : items;
  }, [q, items]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.78)" }}>
        <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onClose} activeOpacity={1} />
        <View style={{ backgroundColor: "#111118", borderTopLeftRadius: 22, borderTopRightRadius: 22, maxHeight: "80%", overflow: "hidden" }}>
          {/* Header */}
          <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.06)" }}>
            <Text style={{ color: "#fff", fontSize: 15, fontFamily: "SpaceGrotesk_700Bold", flex: 1 }}>{title}</Text>
            <TouchableOpacity onPress={onClose} style={{ padding: 6 }}>
              <Feather name="x" size={18} color="rgba(255,255,255,0.45)" />
            </TouchableOpacity>
          </View>
          {/* Search */}
          <View style={{ paddingHorizontal: 16, paddingVertical: 10 }}>
            <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: "rgba(255,255,255,0.06)", borderRadius: 10, paddingHorizontal: 12, gap: 8 }}>
              <Feather name="search" size={14} color="rgba(255,255,255,0.35)" />
              <TextInput
                style={{ flex: 1, height: 38, color: "#fff", fontSize: 14, fontFamily: "SpaceGrotesk_400Regular" }}
                placeholder="Pesquisar…"
                placeholderTextColor="rgba(255,255,255,0.25)"
                value={q}
                onChangeText={setQ}
                autoFocus
                autoCapitalize="none"
              />
              {q ? <TouchableOpacity onPress={() => setQ("")}><Feather name="x-circle" size={14} color="rgba(255,255,255,0.3)" /></TouchableOpacity> : null}
            </View>
          </View>
          {/* List */}
          <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 36 }}>
            {filtered.length === 0 && (
              <Text style={{ color: "rgba(255,255,255,0.3)", textAlign: "center", marginTop: 32, fontFamily: "SpaceGrotesk_400Regular", fontSize: 14 }}>Nenhum resultado</Text>
            )}
            {filtered.map((item) => (
              <TouchableOpacity
                key={getKey(item)}
                style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.04)", gap: 12 }}
                onPress={() => { Haptics.selectionAsync(); onSelect(item); setQ(""); onClose(); }}
                activeOpacity={0.75}
              >
                {renderLeft ? renderLeft(item) : null}
                <Text style={{ color: "#fff", fontSize: 14, fontFamily: "SpaceGrotesk_400Regular", flex: 1 }}>{getLabel(item)}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { completeOnboarding } = useOnboarding();

  const [companyName, setCompanyName] = useState("");
  const [userName,    setUserName]    = useState("");
  const [city,        setCity]        = useState("");
  const [segment,     setSegment]     = useState("");
  const [siteOrInsta, setSiteOrInsta] = useState("");

  const [showCity, setShowCity]       = useState(false);
  const [showSeg,  setShowSeg]        = useState(false);
  const [saving,   setSaving]         = useState(false);

  const canSave = companyName.trim() && userName.trim() && city && segment;

  const handleSave = async () => {
    if (!canSave || saving) return;
    Keyboard.dismiss();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setSaving(true);
    await completeOnboarding({
      companyName: companyName.trim(),
      userName:    userName.trim(),
      city,
      siteOrInsta: siteOrInsta.trim(),
      segment,
      firstModule: "",
    });
    router.replace("/(tabs)");
  };

  const topPad = Platform.OS === "web" ? 24 : insets.top + 16;
  const botPad = Platform.OS === "web" ? 32 : insets.bottom + 24;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: BG }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingTop: topPad, paddingBottom: botPad, paddingHorizontal: 24 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Headline */}
        <Text style={S.title}>Configure sua JADE</Text>
        <Text style={S.sub}>Preencha as informações do seu negócio para personalizar a experiência.</Text>

        {/* Fields */}
        <View style={{ gap: 14, marginTop: 28 }}>
          <FloatingInput
            label="Nome da empresa"
            value={companyName}
            onChangeText={setCompanyName}
          />
          <FloatingInput
            label="Seu nome"
            value={userName}
            onChangeText={setUserName}
          />
          <SelectorField
            label="Cidade"
            value={city}
            placeholder="Selecione sua cidade"
            onPress={() => { Keyboard.dismiss(); setShowCity(true); }}
          />
          <SelectorField
            label="Segmento"
            value={segment ? (() => { const s = JADE_SEGMENTS.find((x) => x.label === segment); return s ? `${s.emoji}  ${s.label}` : segment; })() : ""}
            placeholder="Selecione seu segmento"
            onPress={() => { Keyboard.dismiss(); setShowSeg(true); }}
          />
          <FloatingInput
            label="Site ou Instagram"
            value={siteOrInsta}
            onChangeText={setSiteOrInsta}
            keyboardType="url"
            autoCapitalize="none"
            optional
          />
        </View>

        {/* CTA */}
        <TouchableOpacity
          style={[S.btn, { opacity: canSave && !saving ? 1 : 0.38, marginTop: 36 }]}
          onPress={handleSave}
          activeOpacity={0.85}
          disabled={!canSave || saving}
        >
          <Text style={S.btnText}>{saving ? "Entrando…" : "Entrar na JADE"}</Text>
          <Feather name="zap" size={18} color="#fff" />
        </TouchableOpacity>

        {/* Required hint */}
        <Text style={{ color: "rgba(255,255,255,0.22)", fontSize: 11, fontFamily: "SpaceGrotesk_400Regular", textAlign: "center", marginTop: 14 }}>
          Empresa, nome, cidade e segmento são obrigatórios
        </Text>
      </ScrollView>

      {/* ── City Modal ── */}
      <SearchModal
        visible={showCity}
        title="Selecionar Cidade"
        items={ALL_CITIES}
        getLabel={(c) => c.label}
        getKey={(c) => c.label}
        onSelect={(c) => setCity(c.label)}
        onClose={() => setShowCity(false)}
      />

      {/* ── Segment Modal ── */}
      <SearchModal
        visible={showSeg}
        title="Selecionar Segmento"
        items={JADE_SEGMENTS}
        getLabel={(s) => s.label}
        getKey={(s) => s.id}
        onSelect={(s) => setSegment(s.label)}
        onClose={() => setShowSeg(false)}
        renderLeft={(s) => <Text style={{ fontSize: 22 }}>{s.emoji}</Text>}
      />
    </KeyboardAvoidingView>
  );
}

const S = StyleSheet.create({
  title: {
    fontSize: 26,
    fontFamily: "SpaceGrotesk_700Bold",
    color: "#fff",
    marginBottom: 8,
    lineHeight: 32,
  },
  sub: {
    fontSize: 14,
    fontFamily: "SpaceGrotesk_400Regular",
    color: "rgba(255,255,255,0.45)",
    lineHeight: 21,
  },
  btn: {
    backgroundColor: PINK,
    borderRadius: 14,
    height: 60,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    shadowColor: PINK,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 10,
    elevation: 7,
  },
  btnText: {
    fontSize: 16,
    fontFamily: "SpaceGrotesk_700Bold",
    color: "#fff",
  },
});
