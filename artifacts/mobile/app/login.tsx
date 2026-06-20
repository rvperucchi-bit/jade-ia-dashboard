import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Svg, { Path } from "react-native-svg";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth } from "@/context/AuthContext";

// ─── Official JADE Logo SVG ───────────────────────────────────────────────────
const JadeLogo = () => (
  <Svg width="280" height="100" viewBox="0 0 280 100">
    {/* J - outline, rounded, no fill */}
    <Path
      d="M 28 15 L 28 72 Q 28 88 14 88 Q 4 88 2 80"
      fill="none"
      stroke="white"
      strokeWidth="7"
      strokeLinecap="round"
      strokeLinejoin="round"
    />

    {/* A - solid pink, with concave arc at base */}
    <Path
      d="M 70 15 L 95 85 L 85 85 Q 80 72 70 68 Q 60 72 55 85 L 45 85 Z"
      fill="#FF0080"
      stroke="none"
    />
    {/* Arc cut at bottom of A - the signature wave */}
    <Path
      d="M 48 85 Q 58 74 70 78 Q 82 74 92 85"
      fill="#FF0080"
      stroke="none"
    />
    {/* Inner triangle cutout of A */}
    <Path
      d="M 58 60 L 82 60 L 70 30 Z"
      fill="#0A0A0F"
      stroke="none"
    />

    {/* D - outline, rounded, no fill */}
    <Path
      d="M 112 15 L 112 85 M 112 15 Q 155 15 155 50 Q 155 85 112 85"
      fill="none"
      stroke="white"
      strokeWidth="7"
      strokeLinecap="round"
      strokeLinejoin="round"
    />

    {/* E - outline, rounded, no fill */}
    <Path
      d="M 170 15 L 170 85 M 170 15 L 210 15 M 170 50 L 202 50 M 170 85 L 210 85"
      fill="none"
      stroke="white"
      strokeWidth="7"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

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
          {/* Faint atmospheric glow — small, centered, barely visible */}
          <View style={S.glow} pointerEvents="none" />
          <JadeLogo />
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
    paddingTop: 44,
    paddingBottom: 40,
    position: "relative",
  },

  // Small, barely-visible atmospheric bloom centered behind logo only
  glow: {
    position: "absolute",
    width: 200,
    height: 120,
    borderRadius: 100,
    backgroundColor: "#3D0020",
    opacity: 0.12,
    alignSelf: "center",
  },

  tagline: {
    marginTop: 14,
    fontSize: 11,
    color: "#555",
    letterSpacing: 2.6,
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
    backgroundColor: "#FF0080",
    height: 52,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
    shadowColor: "#FF0080",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 20,
    elevation: 10,
  },
  btnText: { fontSize: 16, fontFamily: "SpaceGrotesk_700Bold", color: "#fff" },

  forgotBtn: { alignItems: "center", paddingVertical: 6 },
  forgotText: { fontSize: 14, fontFamily: "SpaceGrotesk_400Regular", color: "#FF0080" },

  footer: { flexDirection: "row", justifyContent: "center", alignItems: "center", marginTop: 28 },
  footerText: { fontSize: 14, fontFamily: "SpaceGrotesk_400Regular", color: "#888" },
  footerLink: { fontSize: 14, fontFamily: "SpaceGrotesk_600SemiBold", color: "#FF0080" },
});
