import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Svg, { Path, Text as SvgText } from "react-native-svg";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth } from "@/context/AuthContext";

const { width: SW } = Dimensions.get("window");

// ─── JADE SVG Logo ───────────────────────────────────────────────────────────
// ViewBox 0 0 260 82 — letters positioned by measured Space Grotesk Bold widths
// J≈40  A≈58  D≈56  E≈48  gaps=4px each → total≈210, padded to 260 for breathing room
const VB_W = 260;
const VB_H = 82;
const LOGO_W = Math.min(SW * 0.84, 340);
const LOGO_H = LOGO_W * (VB_H / VB_W);
const FS = 78; // font-size in viewBox units
const BASE = 74; // baseline y

// The brand "A": filled pink triangle with concave curved base (smile arc at bottom).
// Cap-height aligns with J/D/E (baseline=74, capHeight≈56 → top≈18).
// Width ≈58 viewBox units, centered between x=44 and x=102.
const A_PATH = `
  M 73 14
  L 44 74
  Q 58 60 73 66
  Q 88 60 102 74
  Z
`;

function JadeLogoSVG() {
  return (
    <Svg width={LOGO_W} height={LOGO_H} viewBox={`0 0 ${VB_W} ${VB_H}`}>
      {/* J — white outline, no fill */}
      <SvgText
        x={2}
        y={BASE}
        fontSize={FS}
        fontFamily="SpaceGrotesk_700Bold"
        fontWeight="bold"
        fill="none"
        stroke="white"
        strokeWidth={1.6}
        strokeLinejoin="round"
      >
        J
      </SvgText>

      {/* A — solid pink fill with custom arc path */}
      <Path d={A_PATH} fill="#FF0A7A" />

      {/* D — white outline, no fill */}
      <SvgText
        x={106}
        y={BASE}
        fontSize={FS}
        fontFamily="SpaceGrotesk_700Bold"
        fontWeight="bold"
        fill="none"
        stroke="white"
        strokeWidth={1.6}
        strokeLinejoin="round"
      >
        D
      </SvgText>

      {/* E — white outline, no fill */}
      <SvgText
        x={166}
        y={BASE}
        fontSize={FS}
        fontFamily="SpaceGrotesk_700Bold"
        fontWeight="bold"
        fill="none"
        stroke="white"
        strokeWidth={1.6}
        strokeLinejoin="round"
      >
        E
      </SvgText>
    </Svg>
  );
}

// ─── Component ───────────────────────────────────────────────────────────────
export default function LoginScreen() {
  const { login } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async () => {
    if (!email.trim() || !password) { setError("Preencha e-mail e senha."); return; }
    setError("");
    setLoading(true);
    const ok = await login(email.trim(), password);
    setLoading(false);
    if (ok) router.replace("/(tabs)");
    else setError("E-mail ou senha incorretos.");
  };

  return (
    <KeyboardAvoidingView
      style={[S.root, { paddingTop: insets.top, paddingBottom: insets.bottom }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={S.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ── Logo section ── */}
        <View style={S.logoSection}>
          {/* Atmospheric glow — very faint, small, centered. NOT a visible shape */}
          <View style={S.glowOuter} pointerEvents="none" />
          <View style={S.glowMid} pointerEvents="none" />
          <View style={S.glowCore} pointerEvents="none" />

          <JadeLogoSVG />

          <Text style={S.tagline}>SUA PARCEIRA DE TRABALHO.</Text>
        </View>

        {/* ── Form ── */}
        <View style={S.form}>
          <Text style={S.formTitle}>Entrar</Text>

          <View style={S.fieldGroup}>
            <Text style={S.label}>E-mail</Text>
            <View style={S.inputRow}>
              <Feather name="mail" size={18} color="#555" style={S.icon} />
              <TextInput
                style={S.input}
                value={email}
                onChangeText={setEmail}
                placeholder="rodrigo@jadeia.com.br"
                placeholderTextColor="#444"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          </View>

          <View style={S.fieldGroup}>
            <Text style={S.label}>Senha</Text>
            <View style={S.inputRow}>
              <Feather name="lock" size={18} color="#555" style={S.icon} />
              <TextInput
                style={S.input}
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                placeholderTextColor="#444"
                secureTextEntry={!showPw}
                autoCapitalize="none"
              />
              <TouchableOpacity onPress={() => setShowPw((v) => !v)} activeOpacity={0.7} style={S.eyeBtn}>
                <Feather name={showPw ? "eye-off" : "eye"} size={18} color="#555" />
              </TouchableOpacity>
            </View>
          </View>

          {!!error && <Text style={S.error}>{error}</Text>}

          <TouchableOpacity
            style={[S.btn, loading && { opacity: 0.65 }]}
            onPress={handleLogin}
            activeOpacity={0.85}
            disabled={loading}
          >
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={S.btnText}>Entrar</Text>}
          </TouchableOpacity>

          <TouchableOpacity style={S.forgotBtn} activeOpacity={0.7}>
            <Text style={S.forgotText}>Esqueci minha senha</Text>
          </TouchableOpacity>
        </View>

        {/* ── Footer ── */}
        <View style={S.footer}>
          <Text style={S.footerText}>Não tem uma conta?</Text>
          <TouchableOpacity activeOpacity={0.7} onPress={() => router.push("/cadastro" as any)}>
            <Text style={S.footerLink}> Criar conta</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const S = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#000000" },
  scroll: { flexGrow: 1, paddingHorizontal: 28, paddingBottom: 36 },

  logoSection: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 40,
    paddingBottom: 36,
    position: "relative",
    overflow: "visible",
  },

  // Atmospheric glow — single very large ellipse at barely-perceptible opacity.
  // Too large to read as a "shape" — just imparts a faint warm tint behind the logo.
  glowOuter: {
    position: "absolute",
    width: 500,
    height: 320,
    borderRadius: 250,
    backgroundColor: "#FF0A7A",
    opacity: 0.05,
    alignSelf: "center",
  },
  // unused but kept for JSX structure — opacity:0 = invisible
  glowMid: {
    position: "absolute",
    width: 0,
    height: 0,
    opacity: 0,
  },
  glowCore: {
    position: "absolute",
    width: 0,
    height: 0,
    opacity: 0,
  },

  tagline: {
    marginTop: 14,
    fontSize: 11,
    color: "#666",
    letterSpacing: 2.4,
    fontFamily: "SpaceGrotesk_400Regular",
  },

  form: { gap: 16 },
  formTitle: { fontSize: 28, fontFamily: "SpaceGrotesk_700Bold", color: "#fff", marginBottom: 2 },

  fieldGroup: { gap: 6 },
  label: { fontSize: 14, fontFamily: "SpaceGrotesk_500Medium", color: "#fff" },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1A1A1A",
    borderRadius: 12,
    height: 52,
    paddingHorizontal: 14,
    gap: 10,
  },
  icon: {},
  input: { flex: 1, fontSize: 15, fontFamily: "SpaceGrotesk_400Regular", color: "#fff" },
  eyeBtn: { padding: 4 },

  error: { fontSize: 13, fontFamily: "SpaceGrotesk_400Regular", color: "#FF3B5C", textAlign: "center" },

  btn: {
    backgroundColor: "#FF0A7A",
    height: 52,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
    shadowColor: "#FF0A7A",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 20,
    elevation: 10,
  },
  btnText: { fontSize: 16, fontFamily: "SpaceGrotesk_700Bold", color: "#fff" },

  forgotBtn: { alignItems: "center", paddingVertical: 6 },
  forgotText: { fontSize: 14, fontFamily: "SpaceGrotesk_400Regular", color: "#FF0A7A" },

  footer: { flexDirection: "row", justifyContent: "center", alignItems: "center", marginTop: 28 },
  footerText: { fontSize: 14, fontFamily: "SpaceGrotesk_400Regular", color: "#888" },
  footerLink: { fontSize: 14, fontFamily: "SpaceGrotesk_600SemiBold", color: "#FF0A7A" },
});
