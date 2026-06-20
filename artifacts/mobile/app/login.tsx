import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
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

export default function LoginScreen() {
  const { login } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      setError("Preencha e-mail e senha.");
      return;
    }
    setError("");
    setLoading(true);
    const ok = await login(email.trim(), password);
    setLoading(false);
    if (ok) {
      router.replace("/(tabs)");
    } else {
      setError("E-mail ou senha incorretos.");
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.inner}>
        <View style={styles.logoSection}>
          <View style={styles.logoRow}>
            <Text style={styles.logoJ}>J</Text>
            <Text style={styles.logoA}>A</Text>
            <Text style={styles.logoDE}>DE</Text>
          </View>
          <View style={styles.badgeRow}>
            <Text style={styles.badgeText}>IA</Text>
          </View>
          <Text style={styles.tagline}>Sua parceira de trabalho.</Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.formTitle}>Entrar</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>E-mail</Text>
            <View style={styles.inputWrap}>
              <Feather name="mail" size={18} color="#555570" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="rodrigo@jadeia.com.br"
                placeholderTextColor="#444460"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Senha</Text>
            <View style={styles.inputWrap}>
              <Feather name="lock" size={18} color="#555570" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                placeholderTextColor="#444460"
                secureTextEntry={!showPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity
                onPress={() => setShowPassword((v) => !v)}
                style={styles.eyeBtn}
                activeOpacity={0.7}
              >
                <Feather
                  name={showPassword ? "eye-off" : "eye"}
                  size={18}
                  color="#555570"
                />
              </TouchableOpacity>
            </View>
          </View>

          {!!error && <Text style={styles.errorText}>{error}</Text>}

          <TouchableOpacity
            style={[styles.loginBtn, loading && styles.loginBtnDisabled]}
            onPress={handleLogin}
            activeOpacity={0.85}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.loginBtnText}>Entrar</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.forgotBtn} activeOpacity={0.7}>
            <Text style={styles.forgotText}>Esqueci minha senha</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Não tem uma conta?</Text>
          <TouchableOpacity activeOpacity={0.7}>
            <Text style={styles.footerLink}> Criar conta</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0A0A0F",
  },
  inner: {
    flex: 1,
    paddingHorizontal: 28,
    justifyContent: "space-between",
    paddingTop: 40,
    paddingBottom: 32,
  },
  logoSection: {
    alignItems: "center",
    gap: 10,
    marginTop: 20,
  },
  logoRow: {
    flexDirection: "row",
    alignItems: "flex-end",
  },
  logoJ: {
    fontSize: 56,
    fontFamily: "SpaceGrotesk_700Bold",
    color: "#FFFFFF",
    lineHeight: 62,
  },
  logoA: {
    fontSize: 56,
    fontFamily: "SpaceGrotesk_700Bold",
    color: "#FF0080",
    lineHeight: 62,
  },
  logoDE: {
    fontSize: 56,
    fontFamily: "SpaceGrotesk_700Bold",
    color: "#FFFFFF",
    lineHeight: 62,
  },
  badgeRow: {
    backgroundColor: "#FF008022",
    borderWidth: 1,
    borderColor: "#FF008055",
    paddingHorizontal: 12,
    paddingVertical: 3,
    borderRadius: 16,
  },
  badgeText: {
    fontSize: 13,
    fontFamily: "SpaceGrotesk_600SemiBold",
    color: "#FF0080",
    letterSpacing: 3,
  },
  tagline: {
    fontSize: 14,
    fontFamily: "SpaceGrotesk_400Regular",
    color: "#FFFFFF55",
    marginTop: 4,
  },
  form: {
    gap: 16,
    marginTop: 20,
  },
  formTitle: {
    fontSize: 26,
    fontFamily: "SpaceGrotesk_700Bold",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  inputGroup: {
    gap: 6,
  },
  inputLabel: {
    fontSize: 13,
    fontFamily: "SpaceGrotesk_500Medium",
    color: "#AAAACC",
  },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#13131F",
    borderWidth: 1,
    borderColor: "#252535",
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 52,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    fontFamily: "SpaceGrotesk_400Regular",
    color: "#FFFFFF",
  },
  eyeBtn: {
    padding: 4,
  },
  errorText: {
    fontSize: 13,
    fontFamily: "SpaceGrotesk_400Regular",
    color: "#FF3B5C",
    textAlign: "center",
  },
  loginBtn: {
    backgroundColor: "#FF0080",
    height: 54,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
    shadowColor: "#FF0080",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  loginBtnDisabled: {
    opacity: 0.6,
  },
  loginBtnText: {
    fontSize: 16,
    fontFamily: "SpaceGrotesk_700Bold",
    color: "#FFFFFF",
  },
  forgotBtn: {
    alignItems: "center",
    paddingVertical: 4,
  },
  forgotText: {
    fontSize: 14,
    fontFamily: "SpaceGrotesk_400Regular",
    color: "#FF0080",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  footerText: {
    fontSize: 14,
    fontFamily: "SpaceGrotesk_400Regular",
    color: "#AAAACC",
  },
  footerLink: {
    fontSize: 14,
    fontFamily: "SpaceGrotesk_600SemiBold",
    color: "#FF0080",
  },
});
