import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
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

const jadeLogo = require("../assets/images/jade-logo.png");

const { width: SW } = Dimensions.get("window");
const LOGO_W = Math.min(SW * 0.70, 294);
const LOGO_H = LOGO_W * (683 / 1024);

// ─── Helpers ─────────────────────────────────────────────────────────────────
function maskPhone(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 11)
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  return raw;
}

interface Field {
  label: string;
  placeholder: string;
  icon: string;
  secure?: boolean;
  keyboard?: "email-address" | "phone-pad" | "default";
}

const FIELDS: Field[] = [
  { label: "Nome completo", placeholder: "Rodrigo Silva", icon: "user" },
  { label: "E-mail", placeholder: "rodrigo@jadeia.com.br", icon: "mail", keyboard: "email-address" },
  { label: "Telefone", placeholder: "(48) 99999-9999", icon: "phone", keyboard: "phone-pad" },
  { label: "Senha", placeholder: "••••••••", icon: "lock", secure: true },
  { label: "Confirmar senha", placeholder: "••••••••", icon: "lock", secure: true },
];

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function CadastroScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [termsAccepted, setTermsAccepted] = useState(false);

  const values = [nome, email, phone, senha, confirmar];
  const setters = [
    setNome,
    setEmail,
    (v: string) => setPhone(maskPhone(v)),
    setSenha,
    setConfirmar,
  ];

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!nome.trim()) e.nome = "Nome obrigatório";
    if (!email.includes("@")) e.email = "E-mail inválido";
    if (phone.replace(/\D/g, "").length < 10) e.phone = "Telefone inválido";
    if (senha.length < 6) e.senha = "Mínimo 6 caracteres";
    if (senha !== confirmar) e.confirmar = "Senhas não conferem";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleCadastro = async () => {
    if (!termsAccepted) return;
    if (!validate()) return;
    setLoading(true);
    await new Promise((r) => setTimeout(r, 900));
    setLoading(false);
    Alert.alert(
      "Conta criada! ✓",
      "Sua conta foi criada com sucesso. Faça login para continuar.",
      [{ text: "Fazer login", onPress: () => router.replace("/login") }]
    );
  };

  const errorKeys = ["nome", "email", "phone", "senha", "confirmar"];

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
        <View style={S.logoSection}>
          <Image
            source={jadeLogo}
            style={{ width: LOGO_W, height: LOGO_H }}
            resizeMode="contain"
          />
          <Text style={S.tagline}>SUA PARCEIRA DE NEGÓCIOS.</Text>
        </View>

        {/* ── Formulário ── */}
        <View style={S.form}>
          <Text style={S.formTitle}>Criar conta</Text>
          <Text style={S.formSub}>Junte-se à JADE e aumente suas vendas</Text>

          {FIELDS.map((field, i) => {
            const isSecure = field.secure;
            const isConfirm = i === 4;
            const isPw = i === 3;
            const secureEntry = isSecure ? (isPw ? !showPw : !showConfirm) : false;
            const toggle = isPw
              ? () => setShowPw((v) => !v)
              : () => setShowConfirm((v) => !v);
            const errKey = errorKeys[i];
            const hasErr = !!errors[errKey];

            return (
              <View key={i} style={S.fieldGroup}>
                <Text style={S.label}>{field.label}</Text>
                <View style={[S.inputRow, hasErr && S.inputErr]}>
                  <Feather name={field.icon as any} size={18} color="#555" />
                  <TextInput
                    style={S.input}
                    value={values[i]}
                    onChangeText={setters[i]}
                    placeholder={field.placeholder}
                    placeholderTextColor="#444"
                    secureTextEntry={secureEntry}
                    keyboardType={field.keyboard || "default"}
                    autoCapitalize={field.keyboard === "email-address" ? "none" : "words"}
                    autoCorrect={false}
                  />
                  {isSecure && (
                    <TouchableOpacity onPress={toggle} activeOpacity={0.7} style={S.eyeBtn}>
                      <Feather
                        name={(!isConfirm ? showPw : showConfirm) ? "eye-off" : "eye"}
                        size={18}
                        color="#555"
                      />
                    </TouchableOpacity>
                  )}
                </View>
                {hasErr && <Text style={S.fieldErr}>{errors[errKey]}</Text>}
              </View>
            );
          })}

          {/* ── Checkbox de termos ── */}
          <TouchableOpacity
            style={S.termsRow}
            onPress={() => setTermsAccepted((v) => !v)}
            activeOpacity={0.75}
          >
            <View style={[S.checkbox, termsAccepted && S.checkboxChecked]}>
              {termsAccepted && <Feather name="check" size={12} color="#fff" />}
            </View>
            <Text style={S.termsText}>
              {"Li e aceito os "}
              <Text
                style={S.termsLink}
                onPress={() => router.push("/termos" as any)}
              >
                Termos de Uso
              </Text>
              {" e a "}
              <Text
                style={S.termsLink}
                onPress={() => router.push("/privacidade" as any)}
              >
                Política de Privacidade
              </Text>
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[S.btn, (!termsAccepted || loading) && S.btnDisabled]}
            onPress={handleCadastro}
            activeOpacity={termsAccepted ? 0.85 : 1}
            disabled={!termsAccepted || loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={S.btnText}>Criar conta</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* ── Rodapé ── */}
        <View style={S.footer}>
          <Text style={S.footerText}>Já tem uma conta?</Text>
          <TouchableOpacity activeOpacity={0.7} onPress={() => router.replace("/login")}>
            <Text style={S.footerLink}> Entrar</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const S = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#000000" },
  scroll: { flexGrow: 1, paddingHorizontal: 28, paddingBottom: 32 },

  logoSection: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 24,
    paddingBottom: 20,
  },
  tagline: {
    marginTop: 8,
    fontSize: 11,
    color: "#555",
    letterSpacing: 3,
    textAlign: "center",
    fontFamily: "SpaceGrotesk_400Regular",
  },

  form: { gap: 12 },
  formTitle: { fontSize: 26, fontFamily: "SpaceGrotesk_700Bold", color: "#fff" },
  formSub: { fontSize: 13, fontFamily: "SpaceGrotesk_400Regular", color: "#555", marginTop: -4, marginBottom: 2 },

  fieldGroup: { gap: 5 },
  label: { fontSize: 14, fontFamily: "SpaceGrotesk_500Medium", color: "#fff" },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1A1A1A",
    borderRadius: 12,
    height: 50,
    paddingHorizontal: 14,
    gap: 10,
    borderWidth: 1,
    borderColor: "transparent",
  },
  inputErr: { borderColor: "#FF3B5C" },
  input: { flex: 1, fontSize: 15, fontFamily: "SpaceGrotesk_400Regular", color: "#fff" },
  eyeBtn: { padding: 4 },
  fieldErr: { fontSize: 12, fontFamily: "SpaceGrotesk_400Regular", color: "#FF3B5C" },

  // ── Terms checkbox ──
  termsRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    marginTop: 4,
    marginBottom: 4,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "#444",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
    flexShrink: 0,
  },
  checkboxChecked: {
    backgroundColor: "#FF0080",
    borderColor: "#FF0080",
  },
  termsText: {
    flex: 1,
    fontSize: 13,
    fontFamily: "SpaceGrotesk_400Regular",
    color: "#888",
    lineHeight: 20,
  },
  termsLink: {
    color: "#FF0080",
    fontFamily: "SpaceGrotesk_600SemiBold",
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
  btnDisabled: {
    backgroundColor: "#333",
    shadowOpacity: 0,
    elevation: 0,
  },
  btnText: { fontSize: 16, fontFamily: "SpaceGrotesk_700Bold", color: "#fff" },

  footer: { flexDirection: "row", justifyContent: "center", alignItems: "center", marginTop: 20 },
  footerText: { fontSize: 14, fontFamily: "SpaceGrotesk_400Regular", color: "#888" },
  footerLink: { fontSize: 14, fontFamily: "SpaceGrotesk_600SemiBold", color: "#FF0080" },
});
