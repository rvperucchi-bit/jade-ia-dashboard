import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Easing,
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

const jadeLogo = require("../assets/images/jade-logo.png");

const { width: SW } = Dimensions.get("window");
const LOGO_W = Math.min(SW * 0.713, 299);
const LOGO_H = LOGO_W * (683 / 1024);

export default function LoginScreen() {
  const { login } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // ── Logo entrance animation ──────────────────────────────────────────────
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoScale   = useRef(new Animated.Value(0.78)).current;
  const logoY       = useRef(new Animated.Value(18)).current;
  const formOpacity = useRef(new Animated.Value(0)).current;
  const formY       = useRef(new Animated.Value(24)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 380,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(logoScale, {
        toValue: 1,
        duration: 420,
        easing: Easing.out(Easing.back(1.06)),
        useNativeDriver: true,
      }),
      Animated.timing(logoY, {
        toValue: 0,
        duration: 420,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(formOpacity, {
        toValue: 1,
        duration: 420,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(formY, {
        toValue: 0,
        duration: 420,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
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
      <ScrollView
        contentContainerStyle={S.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ── Logo com animação de entrada ── */}
        <Animated.View
          style={[
            S.logoSection,
            {
              opacity: logoOpacity,
              transform: [{ scale: logoScale }, { translateY: logoY }],
            },
          ]}
        >
          <Image
            source={jadeLogo}
            style={{ width: LOGO_W, height: LOGO_H }}
            resizeMode="contain"
          />
          <Text style={S.tagline}>SUA PARCEIRA DE NEGÓCIOS.</Text>
        </Animated.View>

        {/* ── Form ── */}
        <Animated.View
          style={[
            S.form,
            { opacity: formOpacity, transform: [{ translateY: formY }] },
          ]}
        >
          <Text style={S.formTitle}>Entrar</Text>

          <View style={S.fieldGroup}>
            <Text style={S.label}>E-mail</Text>
            <View style={S.inputRow}>
              <Feather name="mail" size={18} color="#555" />
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
              <Feather name="lock" size={18} color="#555" />
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
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={S.btnText}>Entrar</Text>}
          </TouchableOpacity>

          <TouchableOpacity style={S.forgotBtn} activeOpacity={0.7}>
            <Text style={S.forgotText}>Esqueci minha senha</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* ── Footer ── */}
        <Animated.View style={[S.footer, { opacity: formOpacity }]}>
          <Text style={S.footerText}>Não tem uma conta?</Text>
          <TouchableOpacity activeOpacity={0.7} onPress={() => router.push("/cadastro" as any)}>
            <Text style={S.footerLink}> Criar conta</Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const S = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#000000" },
  scroll: { flexGrow: 1, paddingHorizontal: 28, paddingBottom: 36 },

  logoSection: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 40,
    paddingBottom: 32,
  },

  tagline: {
    marginTop: 10,
    fontSize: 11,
    color: "#555",
    letterSpacing: 3,
    textAlign: "center",
    fontFamily: "SpaceGrotesk_400Regular",
  },

  form: { gap: 16 },
  formTitle: {
    fontSize: 28,
    fontFamily: "SpaceGrotesk_700Bold",
    color: "#fff",
    marginBottom: 2,
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
  input: {
    flex: 1,
    fontSize: 15,
    fontFamily: "SpaceGrotesk_400Regular",
    color: "#fff",
  },
  eyeBtn: { padding: 4 },

  error: {
    fontSize: 13,
    fontFamily: "SpaceGrotesk_400Regular",
    color: "#FF3B5C",
    textAlign: "center",
  },

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
  forgotText: {
    fontSize: 14,
    fontFamily: "SpaceGrotesk_400Regular",
    color: "#FF0080",
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
    color: "#FF0080",
  },
});
