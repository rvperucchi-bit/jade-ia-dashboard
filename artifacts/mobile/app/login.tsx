import { Feather, FontAwesome } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Easing,
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
  const slideY  = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 420, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(slideY,  { toValue: 0, duration: 420, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
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
        <Animated.View style={[S.card, { opacity, transform: [{ translateY: slideY }] }]}>

          {/* ── Título ── */}
          <Text style={S.title}>Login</Text>

          {/* ── E-mail ── */}
          <View style={S.fieldGroup}>
            <Text style={S.label}>E-mail</Text>
            <View style={S.inputRow}>
              <Feather name="mail" size={16} color="#555" />
              <TextInput
                style={S.input}
                value={email}
                onChangeText={setEmail}
                placeholder="seu@email.com"
                placeholderTextColor="#444"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          </View>

          {/* ── Senha ── */}
          <View style={S.fieldGroup}>
            <Text style={S.label}>Senha</Text>
            <View style={S.inputRow}>
              <Feather name="lock" size={16} color="#555" />
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
                <Feather name={showPw ? "eye-off" : "eye"} size={16} color="#555" />
              </TouchableOpacity>
            </View>
          </View>

          {!!error && <Text style={S.error}>{error}</Text>}

          {/* ── Botão principal ── */}
          <TouchableOpacity
            style={[S.btn, loading && { opacity: 0.65 }]}
            onPress={handleLogin}
            activeOpacity={0.85}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={S.btnText}>Login</Text>}
          </TouchableOpacity>

          {/* ── Esqueci senha ── */}
          <TouchableOpacity
            style={S.forgotBtn}
            activeOpacity={0.7}
            onPress={() =>
              Alert.alert(
                "Recuperar senha",
                email.trim()
                  ? `Um link de redefinição será enviado para ${email.trim()}.`
                  : "Informe seu e-mail no campo acima e tente novamente.",
                [{ text: "OK" }]
              )
            }
          >
            <Text style={S.forgotText}>Esqueci minha senha</Text>
          </TouchableOpacity>

          {/* ── Separador ── */}
          <View style={S.separator}>
            <View style={S.sepLine} />
            <Text style={S.sepText}>ou</Text>
            <View style={S.sepLine} />
          </View>

          {/* ── Social: lado a lado ── */}
          <View style={S.socialRow}>
            <TouchableOpacity
              style={S.socialBtn}
              activeOpacity={0.75}
              onPress={() => Alert.alert("Google", "Login com Google estará disponível em breve.", [{ text: "OK" }])}
            >
              <FontAwesome name="google" size={20} color="#EA4335" />
              <Text style={S.socialText}>Google</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={S.socialBtn}
              activeOpacity={0.75}
              onPress={() => Alert.alert("Apple", "Login com Apple estará disponível em breve.", [{ text: "OK" }])}
            >
              <FontAwesome name="apple" size={22} color="#fff" />
              <Text style={S.socialText}>Apple</Text>
            </TouchableOpacity>
          </View>

          {/* ── Criar conta ── */}
          <View style={S.footer}>
            <Text style={S.footerText}>Não tem uma conta?</Text>
            <TouchableOpacity activeOpacity={0.7} onPress={() => router.push("/cadastro" as any)}>
              <Text style={S.footerLink}> Criar conta</Text>
            </TouchableOpacity>
          </View>

        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const S = StyleSheet.create({
  root:   { flex: 1, backgroundColor: "#000" },
  scroll: { flexGrow: 1, justifyContent: "center", paddingHorizontal: 24, paddingVertical: 48 },

  card: { gap: 16 },

  title: {
    fontSize: 39,
    fontFamily: "SpaceGrotesk_700Bold",
    color: "#fff",
    textAlign: "center",
    marginBottom: 8,
  },

  fieldGroup: { gap: 6 },
  label: { fontSize: 13, fontFamily: "SpaceGrotesk_500Medium", color: "#fff" },
  inputRow: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: "#1A1A1A", borderRadius: 12,
    height: 52, paddingHorizontal: 14, gap: 10,
    borderWidth: StyleSheet.hairlineWidth, borderColor: "#2A2A2A",
  },
  input:  { flex: 1, fontSize: 15, fontFamily: "SpaceGrotesk_400Regular", color: "#fff" },
  eyeBtn: { padding: 4 },

  error: { fontSize: 13, fontFamily: "SpaceGrotesk_400Regular", color: "rgba(255,255,255,0.5)", textAlign: "center", marginTop: -4 },

  btn: {
    backgroundColor: PINK,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: PINK,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  btnText: { fontSize: 16, fontFamily: "SpaceGrotesk_700Bold", color: "#fff" },

  forgotBtn:  { alignSelf: "center", paddingVertical: 2 },
  forgotText: { fontSize: 13, fontFamily: "SpaceGrotesk_400Regular", color: "#555" },

  separator: { flexDirection: "row", alignItems: "center", gap: 10, marginVertical: 2 },
  sepLine:   { flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: "#2A2A2A" },
  sepText:   { fontSize: 12, fontFamily: "SpaceGrotesk_400Regular", color: "#444" },

  socialRow: { flexDirection: "row", gap: 10 },
  socialBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, backgroundColor: "transparent", borderRadius: 12,
    height: 46, borderWidth: 1, borderColor: "#2A2A2A",
  },
  socialText: { fontSize: 14, fontFamily: "SpaceGrotesk_500Medium", color: "#ccc" },

  footer:     { flexDirection: "row", justifyContent: "center", alignItems: "center", marginTop: 4 },
  footerText: { fontSize: 13, fontFamily: "SpaceGrotesk_400Regular", color: "#555" },
  footerLink: { fontSize: 13, fontFamily: "SpaceGrotesk_600SemiBold", color: PINK },
});
