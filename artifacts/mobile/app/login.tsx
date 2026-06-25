import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";

export default function LoginScreen() {
  const router = useRouter();
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [loading,  setLoading]  = useState(false);

  const handleLogin = () => {
    if (!email.trim() || !password) {
      Alert.alert("Atenção", "Preencha e-mail e senha para continuar.");
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      router.replace("/preview-unified");
    }, 1100);
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
    <SafeAreaView style={S.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={S.wrapper}
      >
        {/* ── Título ── */}
        <View style={S.headerBlock}>
          <Text style={S.logoText}>Login</Text>
        </View>

        {/* ── Formulário ── */}
        <View style={S.form}>
          <Text style={S.label}>E-MAIL DE ACESSO</Text>
          <TextInput
            style={S.input}
            placeholder="seu@email.com"
            placeholderTextColor="#4E5366"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />

          <Text style={S.label}>SENHA CORPORATIVA</Text>
          <TextInput
            style={S.input}
            placeholder="••••••••"
            placeholderTextColor="#4E5366"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          <TouchableOpacity style={S.forgotBtn} onPress={handleForgot} activeOpacity={0.6}>
            <Text style={S.forgotText}>Esqueceu sua senha?</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[S.loginBtn, (!email || !password) && S.loginBtnDisabled]}
            onPress={handleLogin}
            activeOpacity={0.8}
            disabled={loading || !email || !password}
          >
            {loading
              ? <ActivityIndicator color="#090A0F" />
              : <Text style={S.loginBtnText}>Entrar no Sistema 🚀</Text>}
          </TouchableOpacity>
        </View>

        {/* ── Divisor ── */}
        <View style={S.dividerRow}>
          <View style={S.line} />
          <Text style={S.dividerText}>OU ENTRAR COM</Text>
          <View style={S.line} />
        </View>

        {/* ── Social ── */}
        <View style={S.socialRow}>
          <TouchableOpacity style={S.socialCard} activeOpacity={0.7}
            onPress={() => Alert.alert("Google", "Login com Google em breve.")}>
            <Text style={S.socialBtnText}>🌐 Google</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[S.socialCard, { marginRight: 0 }]} activeOpacity={0.7}
            onPress={() => Alert.alert("Apple", "Login com Apple em breve.")}>
            <Text style={S.socialBtnText}>🍏 Apple ID</Text>
          </TouchableOpacity>
        </View>

        {/* ── Criar conta ── */}
        <TouchableOpacity style={S.createAccountBtn} activeOpacity={0.7}>
          <Text style={S.createAccountText}>
            Não tem uma conta?{" "}
            <Text style={{ color: "#00E5FF" }}>Criar conta</Text>
          </Text>
        </TouchableOpacity>

      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const S = StyleSheet.create({
  container:          { flex: 1, backgroundColor: "#090A0F", justifyContent: "center" },
  wrapper:            { paddingHorizontal: 28 },

  headerBlock:        { alignItems: "flex-start", marginBottom: 32 },
  logoText:           { fontSize: 32, fontWeight: "700", color: "#FFFFFF", letterSpacing: -0.5 },

  form:               { marginTop: 4 },
  label:              { fontSize: 11, color: "#8F94A8", fontWeight: "700", letterSpacing: 0.8, marginBottom: 8, marginTop: 16 },
  input:              { backgroundColor: "#161822", height: 54, borderRadius: 12, paddingHorizontal: 16, color: "#FFFFFF", fontSize: 15, borderWidth: 1, borderColor: "#242736" },
  forgotBtn:          { alignSelf: "flex-end", paddingVertical: 6, marginTop: 8 },
  forgotText:         { color: "#8F94A8", fontSize: 13, fontWeight: "500" },
  loginBtn:           { backgroundColor: "#FFFFFF", height: 54, borderRadius: 12, alignItems: "center", justifyContent: "center", marginTop: 24 },
  loginBtnDisabled:   { opacity: 0.35 },
  loginBtnText:       { color: "#090A0F", fontWeight: "700", fontSize: 15 },

  dividerRow:         { flexDirection: "row", alignItems: "center", marginVertical: 32 },
  line:               { flex: 1, height: 1, backgroundColor: "#161822" },
  dividerText:        { color: "#4E5366", fontSize: 11, fontWeight: "700", paddingHorizontal: 12, letterSpacing: 0.5 },

  socialRow:          { flexDirection: "row", justifyContent: "space-between", gap: 10 },
  socialCard:         { flex: 1, backgroundColor: "#161822", height: 52, borderRadius: 12, borderWidth: 1, borderColor: "#242736", alignItems: "center", justifyContent: "center" },
  socialBtnText:      { color: "#FFFFFF", fontSize: 14, fontWeight: "600" },

  createAccountBtn:   { marginTop: 32, alignItems: "center" },
  createAccountText:  { color: "#8F94A8", fontSize: 14, fontWeight: "500" },
});
