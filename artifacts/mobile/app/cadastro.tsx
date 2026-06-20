import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Svg, { Path } from "react-native-svg";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// ─── Official JADE Logo SVG (same as login) ──────────────────────────────────
const JadeLogo = () => (
  <Svg width="280" height="100" viewBox="0 0 280 100">
    {/* J - outline, rounded, no fill */}
    <Path
      d="M 28 15 L 28 72 Q 28 88 14 88 Q 4 88 2 80"
      fill="none"
      stroke="white"
      strokeWidth="7"
      strokeLinecap="round"
      strokeLinejoin="round"
    />

    {/* A - solid pink, with concave arc at base */}
    <Path
      d="M 70 15 L 95 85 L 85 85 Q 80 72 70 68 Q 60 72 55 85 L 45 85 Z"
      fill="#FF0080"
      stroke="none"
    />
    {/* Arc cut at bottom of A - the signature wave */}
    <Path
      d="M 48 85 Q 58 74 70 78 Q 82 74 92 85"
      fill="#FF0080"
      stroke="none"
    />
    {/* Inner triangle cutout of A */}
    <Path
      d="M 58 60 L 82 60 L 70 30 Z"
      fill="#0A0A0F"
      stroke="none"
    />

    {/* D - outline, rounded, no fill */}
    <Path
      d="M 112 15 L 112 85 M 112 15 Q 155 15 155 50 Q 155 85 112 85"
      fill="none"
      stroke="white"
      strokeWidth="7"
      strokeLinecap="round"
      strokeLinejoin="round"
    />

    {/* E - outline, rounded, no fill */}
    <Path
      d="M 170 15 L 170 85 M 170 15 L 210 15 M 170 50 L 202 50 M 170 85 L 210 85"
      fill="none"
      stroke="white"
      strokeWidth="7"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

function maskPhone(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 11) return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
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

  const values = [nome, email, phone, senha, confirmar];
  const setters = [setNome, setEmail, (v: string) => setPhone(maskPhone(v)), setSenha, setConfirmar];

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
        {/* Header com logo */}
        <View style={S.logoWrap}>
          <View style={S.glow} pointerEvents="none" />
          <JadeLogo />
        </View>

        {/* Formulário */}
        <View style={S.form}>
          <Text style={S.formTitle}>Criar conta</Text>
          <Text style={S.formSub}>Junte-se à JADE e aumente suas vendas</Text>

          {FIELDS.map((field, i) => {
            const isSecure = field.secure;
            const isConfirm = i === 4;
            const isPw = i === 3;
            const showToggle = isSecure;
            const secureEntry = isSecure ? (isPw ? !showPw : !showConfirm) : false;
            const toggle = isPw ? () => setShowPw((v) => !v) : () => setShowConfirm((v) => !v);
            const errKey = errorKeys[i];
            const hasErr = !!errors[errKey];

            return (
              <View key={i} style={S.fieldGroup}>
                <Text style={S.label}>{field.label}</Text>
                <View style={[S.inputRow, hasErr && S.inputErr]}>
                  <Feather name={field.icon as any} size={18} color="#555" style={S.inputIcon} />
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
                  {showToggle && (
                    <TouchableOpacity onPress={toggle} activeOpacity={0.7} style={S.eyeBtn}>
                      <Feather name={(!isConfirm ? showPw : showConfirm) ? "eye-off" : "eye"} size={18} color="#555" />
                    </TouchableOpacity>
                  )}
                </View>
                {hasErr && <Text style={S.fieldErr}>{errors[errKey]}</Text>}
              </View>
            );
          })}

          <TouchableOpacity
            style={[S.btn, loading && { opacity: 0.65 }]}
            onPress={handleCadastro}
            activeOpacity={0.85}
            disabled={loading}
          >
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={S.btnText}>Criar conta</Text>}
          </TouchableOpacity>
        </View>

        {/* Rodapé */}
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
  scroll: { flexGrow: 1, paddingHorizontal: 28, paddingBottom: 40 },

  logoWrap: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 24,
    paddingBottom: 24,
    position: "relative",
  },
  glow: {
    position: "absolute",
    width: 200,
    height: 120,
    borderRadius: 100,
    backgroundColor: "#3D0020",
    opacity: 0.12,
    alignSelf: "center",
  },

  form: { gap: 14 },
  formTitle: { fontSize: 28, fontFamily: "SpaceGrotesk_700Bold", color: "#fff" },
  formSub: { fontSize: 14, fontFamily: "SpaceGrotesk_400Regular", color: "#666", marginTop: -6, marginBottom: 4 },

  fieldGroup: { gap: 5 },
  label: { fontSize: 14, fontFamily: "SpaceGrotesk_500Medium", color: "#fff" },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1A1A1A",
    borderRadius: 12,
    height: 52,
    paddingHorizontal: 14,
    gap: 10,
    borderWidth: 1,
    borderColor: "transparent",
  },
  inputErr: { borderColor: "#FF3B5C" },
  inputIcon: {},
  input: { flex: 1, fontSize: 15, fontFamily: "SpaceGrotesk_400Regular", color: "#fff" },
  eyeBtn: { padding: 4 },
  fieldErr: { fontSize: 12, fontFamily: "SpaceGrotesk_400Regular", color: "#FF3B5C" },

  btn: {
    backgroundColor: "#FF0080",
    height: 52,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 6,
    shadowColor: "#FF0080",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 20,
    elevation: 10,
  },
  btnText: { fontSize: 16, fontFamily: "SpaceGrotesk_700Bold", color: "#fff" },

  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 28,
  },
  footerText: { fontSize: 14, fontFamily: "SpaceGrotesk_400Regular", color: "#888" },
  footerLink: { fontSize: 14, fontFamily: "SpaceGrotesk_600SemiBold", color: "#FF0080" },
});
