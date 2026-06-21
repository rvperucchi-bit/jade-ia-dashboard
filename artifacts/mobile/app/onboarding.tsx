import React, { useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Easing,
  Image,
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
import { useApp } from "@/context/AppContext";
import { JADE_SEGMENTS } from "@/constants/jade-segments";

const PINK   = "#FF0080";
const PURPLE = "#8400FF";
const BG     = "#0B0814";
const CARD   = "#100C1C";
const BORDER = "#1E1830";
const { width: SW } = Dimensions.get("window");

// ─── First module options ──────────────────────────────────────────────────────
const MODULE_OPTIONS: {
  id: string;
  iconName: React.ComponentProps<typeof Feather>["name"];
  title: string;
  sub: string;
  module: string;
}[] = [
  {
    id: "scanner",
    iconName: "target",
    title: "Quero prospectar leads",
    sub: "Ativa o Radar de Oportunidades",
    module: "scanner",
  },
  {
    id: "leads",
    iconName: "users",
    title: "Quero organizar meus clientes",
    sub: "Ativa o CRM de Leads",
    module: "leads",
  },
  {
    id: "marketing",
    iconName: "trending-up",
    title: "Quero acompanhar minhas vendas",
    sub: "Ativa o Pipeline de Vendas",
    module: "marketing",
  },
];

// ─── Floating Label Input ─────────────────────────────────────────────────────
function FloatingLabelInput({
  label, value, onChangeText, keyboardType, autoCapitalize,
}: {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  keyboardType?: "default" | "url" | "email-address";
  autoCapitalize?: "none" | "words" | "sentences";
}) {
  const [focused, setFocused] = useState(false);
  const floatAnim = React.useRef(new Animated.Value(value ? 1 : 0)).current;

  const animate = (to: number) =>
    Animated.timing(floatAnim, { toValue: to, duration: 150, useNativeDriver: false }).start();

  return (
    <View style={FL.wrap}>
      <Animated.Text
        style={[
          FL.label,
          {
            top:       floatAnim.interpolate({ inputRange: [0, 1], outputRange: [15, -9] }),
            fontSize:  floatAnim.interpolate({ inputRange: [0, 1], outputRange: [15, 11] }),
            color:     focused ? PINK : "rgba(255,255,255,0.50)",
          },
        ]}
      >
        {label}
      </Animated.Text>
      <TextInput
        style={[FL.input, focused && { borderColor: PINK + "66" }]}
        value={value}
        onChangeText={onChangeText}
        onFocus={() => { setFocused(true); animate(1); }}
        onBlur={() => { setFocused(false); if (!value) animate(0); }}
        keyboardType={keyboardType ?? "default"}
        autoCapitalize={autoCapitalize ?? "words"}
        placeholderTextColor="transparent"
      />
    </View>
  );
}

const FL = StyleSheet.create({
  wrap:  { position: "relative", marginTop: 8 },
  label: {
    position: "absolute", left: 14, zIndex: 1,
    fontFamily: "SpaceGrotesk_500Medium",
    backgroundColor: BG, paddingHorizontal: 3,
  },
  input: {
    backgroundColor: CARD, borderRadius: 12, borderWidth: 1, borderColor: BORDER,
    height: 52, paddingHorizontal: 14, paddingTop: 10,
    fontSize: 15, fontFamily: "SpaceGrotesk_400Regular", color: "#fff",
  },
});

// ─── Step indicator ────────────────────────────────────────────────────────────
function Steps({ current, total }: { current: number; total: number }) {
  return (
    <View style={S.stepsRow}>
      {Array.from({ length: total }).map((_, i) => (
        <View
          key={i}
          style={[
            S.stepDot,
            i === current
              ? { backgroundColor: PINK, width: 20, borderRadius: 3 }
              : i < current
              ? { backgroundColor: PINK + "66" }
              : { backgroundColor: BORDER },
          ]}
        />
      ))}
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function OnboardingScreen() {
  const insets   = useSafeAreaInsets();
  const router   = useRouter();
  const { completeOnboarding } = useOnboarding();
  const { toggleModule } = useApp();

  const [step, setStep] = useState(0);

  // Step 2 fields
  const [companyName, setCompanyName] = useState("");
  const [userName,    setUserName]    = useState("Rodrigo");
  const [city,        setCity]        = useState("");
  const [siteOrInsta, setSiteOrInsta] = useState("");

  // Step 3 selection
  const [selectedSegment, setSelectedSegment] = useState("");

  // Step 4 selection
  const [selectedModule, setSelectedModule] = useState("");

  // Animation
  const fadeAnim  = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  // Logo glow for step 1
  const glow1 = useRef(new Animated.Value(0)).current;
  React.useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(glow1, { toValue: 1, duration: 2400, useNativeDriver: false }),
      Animated.timing(glow1, { toValue: 0, duration: 2400, useNativeDriver: false }),
    ]));
    loop.start();
    return () => loop.stop();
  }, []);

  const goNext = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 0, duration: 180, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: -30, duration: 180, easing: Easing.in(Easing.cubic), useNativeDriver: true }),
    ]).start(() => {
      setStep((s) => s + 1);
      slideAnim.setValue(30);
      Animated.parallel([
        Animated.timing(fadeAnim,  { toValue: 1, duration: 220, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 220, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      ]).start();
    });
  };

  const handleFinish = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const mod = MODULE_OPTIONS.find((m) => m.id === selectedModule);
    await completeOnboarding({
      companyName, userName, city, siteOrInsta,
      segment: selectedSegment,
      firstModule: mod?.module ?? "",
    });
    if (mod?.module) {
      try { await toggleModule(mod.module); } catch { /* ignore */ }
    }
    router.replace("/(tabs)");
  };

  const topPad = Platform.OS === "web" ? 24 : insets.top + 12;
  const botPad = Platform.OS === "web" ? 40 : insets.bottom + 32;

  return (
    <View style={[S.container, { paddingTop: topPad, paddingBottom: botPad }]}>
      {/* Steps indicator */}
      {step > 0 && <Steps current={step} total={4} />}

      <Animated.View
        style={[S.content, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}
      >
        {/* ─── Step 0: Welcome ─── */}
        {step === 0 && (
          <View style={S.stepWrap}>
            {/* Animated logo glow */}
            <Animated.View style={[S.logoGlowWrap, {
              shadowRadius: glow1.interpolate({ inputRange: [0, 1], outputRange: [12, 28] }),
              shadowOpacity: glow1.interpolate({ inputRange: [0, 1], outputRange: [0.10, 0.30] }),
            }]}>
              <Image
                source={require("../assets/images/jade-logo.png")}
                style={{ width: 160, height: 160 * (683 / 1024) }}
                resizeMode="contain"
              />
            </Animated.View>
            <Text style={S.welcomeTitle}>Bem-vindo à JADE IA</Text>
            <Text style={S.welcomeSub}>Sua parceira de negócios inteligente</Text>
            <Text style={S.welcomeTagline}>Vamos configurar tudo em 2 minutos.</Text>
            <TouchableOpacity style={S.mainBtn} onPress={goNext} activeOpacity={0.85}>
              <Text style={S.mainBtnText}>Começar</Text>
              <Feather name="arrow-right" size={17} color="#fff" />
            </TouchableOpacity>
          </View>
        )}

        {/* ─── Step 1: Company data ─── */}
        {step === 1 && (
          <ScrollView style={{ flex: 1 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <Text style={S.stepTitle}>Conta pra mim sobre{"\n"}seu negócio</Text>
            <Text style={S.stepSub}>Essas informações personalizam a JADE para você.</Text>
            <View style={{ gap: 6, marginTop: 24 }}>
              <FloatingLabelInput label="Nome da empresa *" value={companyName} onChangeText={setCompanyName} />
              <FloatingLabelInput label="Seu nome *" value={userName} onChangeText={setUserName} />
              <FloatingLabelInput label="Cidade / Estado" value={city} onChangeText={setCity} />
              <FloatingLabelInput label="Site ou Instagram (opcional)" value={siteOrInsta} onChangeText={setSiteOrInsta} keyboardType="url" autoCapitalize="none" />
            </View>
            <TouchableOpacity
              style={[S.mainBtn, { marginTop: 28, opacity: companyName.trim() ? 1 : 0.4 }]}
              onPress={companyName.trim() ? goNext : undefined}
              activeOpacity={0.85}
            >
              <Text style={S.mainBtnText}>Continuar</Text>
              <Feather name="arrow-right" size={17} color="#fff" />
            </TouchableOpacity>
          </ScrollView>
        )}

        {/* ─── Step 2: Segment ─── */}
        {step === 2 && (
          <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
            <Text style={S.stepTitle}>Qual é o seu mercado?</Text>
            <Text style={S.stepSub}>A JADE vai se especializar no seu segmento</Text>
            <View style={S.segGrid}>
              {JADE_SEGMENTS.map((seg) => {
                const sel = selectedSegment === seg.id;
                return (
                  <TouchableOpacity
                    key={seg.id}
                    style={[S.segCard, sel && S.segCardActive]}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setSelectedSegment(sel ? "" : seg.id);
                    }}
                    activeOpacity={0.75}
                  >
                    {sel && (
                      <View style={S.segCheck}>
                        <Feather name="check" size={10} color="#fff" />
                      </View>
                    )}
                    <Text style={S.segEmoji}>{seg.emoji}</Text>
                    <Text style={[S.segLabel, sel && { color: "#fff" }]} numberOfLines={2}>
                      {seg.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <TouchableOpacity
              style={[S.mainBtn, { marginTop: 24, marginBottom: 12, opacity: selectedSegment ? 1 : 0.4 }]}
              onPress={selectedSegment ? goNext : undefined}
              activeOpacity={0.85}
            >
              <Text style={S.mainBtnText}>A JADE já entende do seu mercado</Text>
              <Feather name="arrow-right" size={17} color="#fff" />
            </TouchableOpacity>
          </ScrollView>
        )}

        {/* ─── Step 3: First module ─── */}
        {step === 3 && (
          <View style={{ flex: 1 }}>
            <Text style={S.stepTitle}>Ative seu primeiro módulo</Text>
            <Text style={S.stepSub}>Por onde você quer começar?</Text>
            <View style={{ gap: 12, marginTop: 24, flex: 1 }}>
              {MODULE_OPTIONS.map((m) => {
                const sel = selectedModule === m.id;
                return (
                  <TouchableOpacity
                    key={m.id}
                    style={[S.modCard, sel && S.modCardActive]}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setSelectedModule(sel ? "" : m.id);
                    }}
                    activeOpacity={0.75}
                  >
                    <View style={[S.modIconWrap, sel && { backgroundColor: PINK + "22" }]}>
                      <Feather name={m.iconName} size={22} color={sel ? PINK : "rgba(255,255,255,0.50)"} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[S.modTitle, sel && { color: "#fff" }]}>{m.title}</Text>
                      <Text style={S.modSub}>{m.sub}</Text>
                    </View>
                    {sel && (
                      <View style={S.modCheck}>
                        <Feather name="check" size={14} color="#fff" />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
            <TouchableOpacity
              style={[S.mainBtn, { marginTop: 24, opacity: selectedModule ? 1 : 0.4 }]}
              onPress={selectedModule ? handleFinish : undefined}
              activeOpacity={0.85}
            >
              <Text style={S.mainBtnText}>Entrar no app</Text>
              <Feather name="zap" size={17} color="#fff" />
            </TouchableOpacity>
          </View>
        )}
      </Animated.View>
    </View>
  );
}

const S = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG,
    paddingHorizontal: 24,
  },
  stepsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginBottom: 28,
    marginTop: 8,
  },
  stepDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  content: {
    flex: 1,
  },

  // ── Step 0: Welcome ──
  stepWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  logoGlowWrap: {
    shadowColor: PINK,
    shadowOffset: { width: 0, height: 0 },
    alignItems: "center",
    marginBottom: 32,
  },
  welcomeTitle: {
    fontSize: 28,
    fontFamily: "SpaceGrotesk_700Bold",
    color: "#fff",
    textAlign: "center",
    marginBottom: 10,
  },
  welcomeSub: {
    fontSize: 15,
    fontFamily: "SpaceGrotesk_400Regular",
    color: "rgba(255,255,255,0.6)",
    textAlign: "center",
    marginBottom: 10,
  },
  welcomeTagline: {
    fontSize: 13,
    fontFamily: "SpaceGrotesk_400Regular",
    color: "rgba(255,255,255,0.35)",
    textAlign: "center",
    marginBottom: 40,
  },

  // ── Steps 1–3 ──
  stepTitle: {
    fontSize: 24,
    fontFamily: "SpaceGrotesk_700Bold",
    color: "#fff",
    lineHeight: 32,
    marginBottom: 8,
  },
  stepSub: {
    fontSize: 14,
    fontFamily: "SpaceGrotesk_400Regular",
    color: "rgba(255,255,255,0.50)",
    lineHeight: 21,
  },

  // ── Fields ──
  fieldLabel: {
    fontSize: 12,
    fontFamily: "SpaceGrotesk_600SemiBold",
    color: "rgba(255,255,255,0.55)",
    marginBottom: 6,
    letterSpacing: 0.4,
  },
  field: {
    backgroundColor: CARD,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BORDER,
    height: 48,
    paddingHorizontal: 14,
    fontSize: 15,
    fontFamily: "SpaceGrotesk_400Regular",
    color: "#fff",
  },

  // ── Segment grid ──
  segGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 20,
  },
  segCard: {
    width: (SW - 48 - 10) / 2,
    backgroundColor: CARD,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.09)",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 10,
    gap: 8,
    position: "relative",
  },
  segCardActive: {
    backgroundColor: "rgba(255,0,128,0.13)",
    borderColor: PINK,
    borderWidth: 1.5,
  },
  segEmoji: { fontSize: 24 },
  segLabel: {
    fontSize: 12,
    fontFamily: "SpaceGrotesk_500Medium",
    color: "rgba(255,255,255,0.78)",
    textAlign: "center",
    lineHeight: 16,
  },
  segCheck: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: PINK,
    alignItems: "center",
    justifyContent: "center",
  },

  // ── Module cards ──
  modCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: CARD,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.09)",
    padding: 18,
  },
  modCardActive: {
    backgroundColor: "rgba(255,0,128,0.10)",
    borderColor: PINK,
    borderWidth: 1.5,
  },
  modIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 13,
    backgroundColor: "rgba(255,255,255,0.06)",
    alignItems: "center",
    justifyContent: "center",
  },
  modTitle: {
    fontSize: 15,
    fontFamily: "SpaceGrotesk_700Bold",
    color: "rgba(255,255,255,0.90)",
    marginBottom: 4,
  },
  modSub: {
    fontSize: 12,
    fontFamily: "SpaceGrotesk_400Regular",
    color: "rgba(255,255,255,0.55)",
  },
  modCheck: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: PINK,
    alignItems: "center",
    justifyContent: "center",
  },

  // ── Main button ──
  mainBtn: {
    backgroundColor: PINK,
    borderRadius: 14,
    height: 60,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    shadowColor: PINK,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.22,
    shadowRadius: 8,
    elevation: 6,
  },
  mainBtnText: {
    fontSize: 16,
    fontFamily: "SpaceGrotesk_700Bold",
    color: "#fff",
  },
});
