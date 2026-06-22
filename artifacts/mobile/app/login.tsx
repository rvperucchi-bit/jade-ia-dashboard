import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Easing,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth } from "@/context/AuthContext";

const PINK = "#FF0080";

export default function LoginScreen() {
  const { login } = useAuth();
  const router   = useRouter();
  const insets   = useSafeAreaInsets();

  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [showPw,   setShowPw]   = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");

  const opacity = useRef(new Animated.Value(0)).current;
  const slideY  = useRef(new Animated.Value(28)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 440, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(slideY,  { toValue: 0, duration: 440, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();
  }, []);

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
      <Animated.View style={[S.inner, { opacity, transform: [{ translateY: slideY }] }]}>

        {/* ── Título ── */}
        <Text style={S.title}>Entrar</Text>
        <Text style={S.subtitle}>Bem-vindo de volta à JADE.</Text>

        {/* ── Campos ── */}
        <View style={S.fieldGroup}>
          <Text style={S.label}>E-mail</Text>
          <View style={S.inputRow}>
            <Feather name="mail" size={16} color="#555" />
            <TextInput
              style={S.input}
              value={email}
              onChangeText={setEmail}
              placeholder="seu@email.com"
              placeholderTextColor="#3A3A3A"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>
        </View>

        <View style={S.fieldGroup}>
          <Text style={S.label}>Senha</Text>
          <View style={S.inputRow}>
            <Feather name="lock" size={16} color="#555" />
            <TextInput
              style={S.input}
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              placeholderTextColor="#3A3A3A"
              secureTextEntry={!showPw}
              autoCapitalize="none"
            />
            <TouchableOpacity onPress={() => setShowPw((v) => !v)} activeOpacity={0.7} style={S.eyeBtn}>
              <Feather name={showPw ? "eye-off" : "eye"} size={16} color="#555" />
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
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={S.btnText}>Entrar</Text>}
        </TouchableOpacity>

        <TouchableOpacity style={S.forgotBtn} activeOpacity={0.7}>
          <Text style={S.forgotText}>Esqueci minha senha</Text>
        </TouchableOpacity>

        {/* ── Separador ── */}
        <View style={S.separator}>
          <View style={S.sepLine} />
          <Text style={S.sepText}>ou</Text>
          <View style={S.sepLine} />
        </View>

        {/* ── Social ── */}
        <TouchableOpacity style={S.socialBtn} activeOpacity={0.8}>
          <Text style={S.socialIcon}>G</Text>
          <Text style={S.socialText}>Continuar com Google</Text>
        </TouchableOpacity>

        <TouchableOpacity style={S.socialBtn} activeOpacity={0.8}>
          <Feather name="smartphone" size={16} color="#ccc" />
          <Text style={S.socialText}>Continuar com Apple</Text>
        </TouchableOpacity>

        {/* ── Footer ── */}
        <View style={S.footer}>
          <Text style={S.footerText}>Não tem uma conta?</Text>
          <TouchableOpacity activeOpacity={0.7} onPress={() => router.push("/cadastro" as any)}>
            <Text style={S.footerLink}> Criar conta</Text>
          </TouchableOpacity>
        </View>

      </Animated.View>
    </KeyboardAvoidingView>
  );
}

const S = StyleSheet.create({
  root:  { flex: 1, backgroundColor: "#000" },
  inner: { flex: 1, justifyContent: "center", paddingHorizontal: 28, paddingTop: 100, paddingBottom: 40, gap: 14 },

  title:    { fontSize: 30, fontFamily: "SpaceGrotesk_700Bold", color: "#fff", marginBottom: 2 },
  subtitle: { fontSize: 14, fontFamily: "SpaceGrotesk_400Regular", color: "#555", marginBottom: 8 },

  fieldGroup: { gap: 6 },
  label:      { fontSize: 13, fontFamily: "SpaceGrotesk_500Medium", color: "#888" },
  inputRow: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: "#111", borderRadius: 12,
    height: 50, paddingHorizontal: 14, gap: 10,
    borderWidth: 1, borderColor: "#222",
  },
  input:  { flex: 1, fontSize: 15, fontFamily: "SpaceGrotesk_400Regular", color: "#fff" },
  eyeBtn: { padding: 4 },

  error: { fontSize: 13, fontFamily: "SpaceGrotesk_400Regular", color: "#FF3B5C", textAlign: "center" },

  btn: {
    backgroundColor: PINK, height: 50, borderRadius: 12,
    alignItems: "center", justifyContent: "center", marginTop: 2,
    shadowColor: PINK, shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4, shadowRadius: 18, elevation: 10,
  },
  btnText: { fontSize: 16, fontFamily: "SpaceGrotesk_700Bold", color: "#fff" },

  forgotBtn:  { alignItems: "center", paddingVertical: 4 },
  forgotText: { fontSize: 13, fontFamily: "SpaceGrotesk_400Regular", color: PINK },

  separator: { flexDirection: "row", alignItems: "center", gap: 12, marginVertical: 4 },
  sepLine:   { flex: 1, height: 1, backgroundColor: "#222" },
  sepText:   { fontSize: 12, fontFamily: "SpaceGrotesk_400Regular", color: "#444" },

  socialBtn: {
    flexDirection: "row", alignItems: "center", gap: 10,
    backgroundColor: "#111", borderRadius: 12, height: 48,
    paddingHorizontal: 16, borderWidth: 1, borderColor: "#222",
  },
  socialIcon: { fontSize: 15, fontFamily: "SpaceGrotesk_700Bold", color: "#ccc", width: 16, textAlign: "center" },
  socialText: { fontSize: 14, fontFamily: "SpaceGrotesk_500Medium", color: "#ccc" },

  footer:     { flexDirection: "row", justifyContent: "center", alignItems: "center", marginTop: 8 },
  footerText: { fontSize: 13, fontFamily: "SpaceGrotesk_400Regular", color: "#555" },
  footerLink: { fontSize: 13, fontFamily: "SpaceGrotesk_600SemiBold", color: PINK },
});
