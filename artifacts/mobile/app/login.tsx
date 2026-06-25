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
import Svg, { Path } from "react-native-svg";
import { Ionicons } from "@expo/vector-icons";

function GoogleLogo({ size = 20 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48">
      <Path
        fill="#FFC107"
        d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"
      />
      <Path
        fill="#FF3D00"
        d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"
      />
      <Path
        fill="#4CAF50"
        d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"
      />
      <Path
        fill="#1976D2"
        d="M43.611 20.083H42V20H24v8h11.303a11.966 11.966 0 01-4.087 5.571l6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"
      />
    </Svg>
  );
}

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

  const handleGoogle = () =>
    Alert.alert("Google", "Autenticação com Google em breve.");

  const handleApple = () =>
    Alert.alert("Apple", "Autenticação com Apple em breve.");

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
              : <Text style={S.loginBtnText}>Entrar no Sistema</Text>}
          </TouchableOpacity>
        </View>

        {/* ── Divisor ── */}
        <View style={S.dividerRow}>
          <View style={S.line} />
          <Text style={S.dividerText}>OU CONTINUE COM</Text>
          <View style={S.line} />
        </View>

        {/* ── Botão Google ── */}
        <TouchableOpacity style={S.googleBtn} onPress={handleGoogle} activeOpacity={0.85}>
          <View style={S.socialIconBox}>
            <GoogleLogo size={20} />
          </View>
          <Text style={S.googleBtnText}>Continuar com o Google</Text>
          <View style={S.socialIconSpacer} />
        </TouchableOpacity>

        {/* ── Botão Apple ── */}
        <TouchableOpacity style={S.appleBtn} onPress={handleApple} activeOpacity={0.85}>
          <View style={S.socialIconBox}>
            <Ionicons name="logo-apple" size={20} color="#FFFFFF" />
          </View>
          <Text style={S.appleBtnText}>Continuar com a Apple</Text>
          <View style={S.socialIconSpacer} />
        </TouchableOpacity>

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

  dividerRow:         { flexDirection: "row", alignItems: "center", marginVertical: 28 },
  line:               { flex: 1, height: 1, backgroundColor: "#1E1E2A" },
  dividerText:        { color: "#4E5366", fontSize: 10, fontWeight: "700", paddingHorizontal: 12, letterSpacing: 0.6 },

  googleBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    height: 52,
    borderRadius: 12,
    marginBottom: 12,
    paddingHorizontal: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 3,
    elevation: 2,
  },
  googleBtnText: {
    flex: 1,
    textAlign: "center",
    color: "#1F1F1F",
    fontSize: 15,
    fontWeight: "600",
    letterSpacing: 0.1,
  },

  appleBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#000000",
    height: 52,
    borderRadius: 12,
    marginBottom: 0,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: "#2C2C2E",
  },
  appleBtnText: {
    flex: 1,
    textAlign: "center",
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
    letterSpacing: 0.1,
  },

  socialIconBox:      { width: 24, alignItems: "center" },
  socialIconSpacer:   { width: 24 },

  createAccountBtn:   { marginTop: 32, alignItems: "center" },
  createAccountText:  { color: "#8F94A8", fontSize: 14, fontWeight: "500" },
});
