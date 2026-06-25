import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
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
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function LoginScreen() {
  const router  = useRouter();
  const insets  = useSafeAreaInsets();

  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [showPw,   setShowPw]   = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");

  const opacity = useRef(new Animated.Value(0)).current;
  const slideY  = useRef(new Animated.Value(24)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 480, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(slideY,  { toValue: 0, duration: 480, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();
  }, []);

  const handleLogin = () => {
    if (!email.trim() || !password) {
      setError("Preencha e-mail e senha.");
      return;
    }
    setError("");
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      router.replace("/preview-unified");
    }, 1200);
  };

  const handleForgot = () =>
    Alert.alert(
      "Recuperar Senha",
      email.trim()
        ? `Um link de redefinição será enviado para ${email.trim()}.`
        : "Informe seu e-mail acima e tente novamente.",
      [{ text: "OK" }]
    );

  return (
    <KeyboardAvoidingView
      style={[S.root, { paddingTop: insets.top, paddingBottom: insets.bottom }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <Animated.View style={[S.inner, { opacity, transform: [{ translateY: slideY }] }]}>

        {/* ── Logo ── */}
        <View style={S.headerBlock}>
          <View style={S.logoRing}>
            <Text style={S.logoEmoji}>⚡</Text>
          </View>
          <Text style={S.logoText}>JADE</Text>
          <Text style={S.subTitle}>Ecossistema Comercial Autônomo</Text>
        </View>

        {/* ── E-mail ── */}
        <Text style={S.label}>E-MAIL DE ACESSO</Text>
        <View style={S.inputRow}>
          <Text style={S.inputIcon}>✉️</Text>
          <TextInput
            style={S.input}
            placeholder="seu@empresa.com"
            placeholderTextColor="#4E5366"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        {/* ── Senha ── */}
        <Text style={S.label}>SENHA CORPORATIVA</Text>
        <View style={S.inputRow}>
          <Text style={S.inputIcon}>🔒</Text>
          <TextInput
            style={S.input}
            placeholder="••••••••"
            placeholderTextColor="#4E5366"
            secureTextEntry={!showPw}
            value={password}
            onChangeText={setPassword}
            autoCapitalize="none"
          />
          <TouchableOpacity onPress={() => setShowPw((v) => !v)} activeOpacity={0.7} style={S.eyeBtn}>
            <Text style={{ fontSize: 16 }}>{showPw ? "🙈" : "👁️"}</Text>
          </TouchableOpacity>
        </View>

        {!!error && <Text style={S.error}>{error}</Text>}

        {/* ── CTA Principal ── */}
        <TouchableOpacity
          style={[S.loginBtn, (!email || !password) && S.loginBtnDisabled]}
          onPress={handleLogin}
          activeOpacity={0.85}
          disabled={loading || !email || !password}
        >
          {loading
            ? <ActivityIndicator color="#090A0F" />
            : <Text style={S.loginBtnText}>Entrar no Sistema 🚀</Text>}
        </TouchableOpacity>

        <TouchableOpacity style={S.forgotBtn} onPress={handleForgot} activeOpacity={0.7}>
          <Text style={S.forgotText}>Esqueci minha senha</Text>
        </TouchableOpacity>

        {/* ── Rodapé ── */}
        <Text style={S.footerText}>Powered by Sleek Automações</Text>

      </Animated.View>
    </KeyboardAvoidingView>
  );
}

const S = StyleSheet.create({
  root:            { flex: 1, backgroundColor: "#090A0F", justifyContent: "center" },
  inner:           { paddingHorizontal: 28 },

  headerBlock:     { alignItems: "center", marginBottom: 40 },
  logoRing:        { width: 76, height: 76, borderRadius: 38, borderWidth: 1.5, borderColor: "#00E5FF", backgroundColor: "rgba(0,229,255,0.06)", alignItems: "center", justifyContent: "center", marginBottom: 18 },
  logoEmoji:       { fontSize: 30 },
  logoText:        { fontSize: 36, fontWeight: "900", color: "#FFFFFF", letterSpacing: 3 },
  subTitle:        { fontSize: 13, color: "#8F94A8", marginTop: 6, fontWeight: "500", textAlign: "center" },

  label:           { fontSize: 11, color: "#8F94A8", fontWeight: "700", letterSpacing: 0.8, marginBottom: 8, marginTop: 18 },
  inputRow:        { flexDirection: "row", alignItems: "center", backgroundColor: "#161822", height: 54, borderRadius: 12, paddingHorizontal: 14, borderWidth: 1, borderColor: "#242736", gap: 10 },
  inputIcon:       { fontSize: 15 },
  input:           { flex: 1, color: "#FFFFFF", fontSize: 15 },
  eyeBtn:          { padding: 4 },

  error:           { color: "#E93E3E", fontSize: 12, marginTop: 6, fontWeight: "600" },

  loginBtn:        { backgroundColor: "#FFFFFF", height: 54, borderRadius: 12, alignItems: "center", justifyContent: "center", marginTop: 28 },
  loginBtnDisabled:{ opacity: 0.35 },
  loginBtnText:    { color: "#090A0F", fontWeight: "700", fontSize: 15 },

  forgotBtn:       { alignItems: "center", marginTop: 16, paddingVertical: 4 },
  forgotText:      { color: "#4E5366", fontSize: 13, fontWeight: "500" },

  footerText:      { textAlign: "center", color: "#242736", fontSize: 11, fontWeight: "500", marginTop: 40 },
});
