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

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");

// Wordmark: original is landscape ~1024×434 px
const WORDMARK_W = SCREEN_W * 0.74;
const WORDMARK_H = WORDMARK_W * (434 / 1024);

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
      style={[styles.root, { paddingTop: insets.top, paddingBottom: insets.bottom }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ── Logo section ── */}
        <View style={styles.logoSection}>
          {/* Pink glow behind the logo */}
          <View style={styles.glowOuter} pointerEvents="none" />
          <View style={styles.glowInner} pointerEvents="none" />

          {/* JADE wordmark */}
          <Image
            source={jadeWordmark}
            style={{ width: WORDMARK_W, height: WORDMARK_H }}
            resizeMode="contain"
          />

          <Text style={styles.tagline}>SUA PARCEIRA DE TRABALHO.</Text>
        </View>

        {/* ── Form section ── */}
        <View style={styles.form}>
          <Text style={styles.formTitle}>Entrar</Text>

          {/* E-mail */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>E-mail</Text>
            <View style={styles.inputWrap}>
              <Feather name="mail" size={18} color="#555570" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="rodrigo@jadeia.com.br"
                placeholderTextColor="#3D3D56"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          </View>

          {/* Senha */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Senha</Text>
            <View style={styles.inputWrap}>
              <Feather name="lock" size={18} color="#555570" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                placeholderTextColor="#3D3D56"
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

          {/* Botão Entrar */}
          <TouchableOpacity
            style={[styles.loginBtn, loading && { opacity: 0.6 }]}
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

          {/* Esqueci senha */}
          <TouchableOpacity style={styles.forgotBtn} activeOpacity={0.7}>
            <Text style={styles.forgotText}>Esqueci minha senha</Text>
          </TouchableOpacity>
        </View>

        {/* ── Footer ── */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Não tem uma conta?</Text>
          <TouchableOpacity activeOpacity={0.7}>
            <Text style={styles.footerLink}> Criar conta</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#0A0A0F",
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 28,
    paddingBottom: 32,
  },

  // ── Logo ──
  logoSection: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: SCREEN_H * 0.08,
    paddingBottom: SCREEN_H * 0.04,
    position: "relative",
  },
  glowOuter: {
    position: "absolute",
    width: 340,
    height: 260,
    borderRadius: 170,
    backgroundColor: "#FF0080",
    opacity: 0.07,
    top: SCREEN_H * 0.04,
    alignSelf: "center",
  },
  glowInner: {
    position: "absolute",
    width: 220,
    height: 160,
    borderRadius: 110,
    backgroundColor: "#FF0080",
    opacity: 0.10,
    top: SCREEN_H * 0.065,
    alignSelf: "center",
  },
  tagline: {
    fontSize: 11,
    fontFamily: "SpaceGrotesk_400Regular",
    color: "#FFFFFF55",
    letterSpacing: 2.5,
    marginTop: 10,
    textTransform: "uppercase",
  },

  // ── Form ──
  form: {
    gap: 14,
  },
  formTitle: {
    fontSize: 28,
    fontFamily: "SpaceGrotesk_700Bold",
    color: "#FFFFFF",
    marginBottom: 2,
  },
  inputGroup: {
    gap: 6,
  },
  inputLabel: {
    fontSize: 13,
    fontFamily: "SpaceGrotesk_500Medium",
    color: "#9999BB",
  },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#12121E",
    borderWidth: 1,
    borderColor: "#222235",
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 54,
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
    height: 56,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 6,
    shadowColor: "#FF0080",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 18,
    elevation: 10,
  },
  loginBtnText: {
    fontSize: 16,
    fontFamily: "SpaceGrotesk_700Bold",
    color: "#FFFFFF",
  },
  forgotBtn: {
    alignItems: "center",
    paddingVertical: 6,
  },
  forgotText: {
    fontSize: 14,
    fontFamily: "SpaceGrotesk_400Regular",
    color: "#FF0080",
  },

  // ── Footer ──
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 24,
  },
  footerText: {
    fontSize: 14,
    fontFamily: "SpaceGrotesk_400Regular",
    color: "#9999BB",
  },
  footerLink: {
    fontSize: 14,
    fontFamily: "SpaceGrotesk_600SemiBold",
    color: "#FF0080",
  },
});
