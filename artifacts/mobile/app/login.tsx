import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth } from "@/context/AuthContext";

const jadeWordmark = require("../assets/images/jade-wordmark-orig.png");
const { width: SW, height: SH } = Dimensions.get("window");
const WM_W = SW * 0.78;
const WM_H = WM_W * (434 / 1024);

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
        {/* ── Logo ── */}
        <View style={[S.logoWrap, { minHeight: SH * 0.38 }]}>
          <View style={S.glowA} pointerEvents="none" />
          <View style={S.glowB} pointerEvents="none" />
          <Image source={jadeWordmark} style={{ width: WM_W, height: WM_H }} resizeMode="contain" />
          <Text style={S.tagline}>SUA PARCEIRA DE TRABALHO.</Text>
        </View>

        {/* ── Formulário ── */}
        <View style={S.form}>
          <Text style={S.formTitle}>Entrar</Text>

          <View style={S.fieldGroup}>
            <Text style={S.label}>E-mail</Text>
            <View style={S.inputRow}>
              <Feather name="mail" size={18} color="#555" style={S.inputIcon} />
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
              <Feather name="lock" size={18} color="#555" style={S.inputIcon} />
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

          {!!error && <Text style={S.errorText}>{error}</Text>}

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

        {/* ── Rodapé ── */}
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

const S = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#000000" },
  scroll: { flexGrow: 1, paddingHorizontal: 28, paddingBottom: 36 },

  logoWrap: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 24,
    paddingBottom: 28,
    position: "relative",
  },
  glowA: {
    position: "absolute",
    width: 380,
    height: 300,
    borderRadius: 190,
    backgroundColor: "#FF0A7A",
    opacity: 0.09,
    top: 0,
    alignSelf: "center",
  },
  glowB: {
    position: "absolute",
    width: 240,
    height: 180,
    borderRadius: 120,
    backgroundColor: "#FF0A7A",
    opacity: 0.13,
    top: 30,
    alignSelf: "center",
  },
  tagline: {
    marginTop: 12,
    fontSize: 11,
    color: "#888",
    letterSpacing: 2.2,
    fontFamily: "SpaceGrotesk_400Regular",
  },

  form: { gap: 16 },
  formTitle: {
    fontSize: 28,
    fontFamily: "SpaceGrotesk_700Bold",
    color: "#fff",
    marginBottom: 4,
  },
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
  inputIcon: {},
  input: {
    flex: 1,
    fontSize: 15,
    fontFamily: "SpaceGrotesk_400Regular",
    color: "#fff",
  },
  eyeBtn: { padding: 4 },
  errorText: {
    fontSize: 13,
    fontFamily: "SpaceGrotesk_400Regular",
    color: "#FF3B5C",
    textAlign: "center",
  },
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
  forgotText: {
    fontSize: 14,
    fontFamily: "SpaceGrotesk_400Regular",
    color: "#FF0A7A",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 28,
  },
  footerText: {
    fontSize: 14,
    fontFamily: "SpaceGrotesk_400Regular",
    color: "#888",
  },
  footerLink: {
    fontSize: 14,
    fontFamily: "SpaceGrotesk_600SemiBold",
    color: "#FF0A7A",
  },
});
