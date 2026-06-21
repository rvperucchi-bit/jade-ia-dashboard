import AsyncStorage from "@react-native-async-storage/async-storage";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useProfile } from "@/context/ProfileContext";

const PROFILE_KEY = "@jade_ia:profile";
const COLORS = {
  bg: "#0A0A0F",
  card: "#111118",
  border: "#1E1E2E",
  text: "#FFFFFF",
  muted: "#7777AA",
  primary: "#FF0080",
  surface: "#16161F",
};

interface Profile {
  nome: string;
  email: string;
  cargo: string;
  empresa: string;
}

const DEFAULT: Profile = {
  nome: "Rodrigo",
  email: "rodrigo@jadeia.com.br",
  cargo: "Fundador",
  empresa: "JÁ Delivery",
};

export default function PerfilScreen() {
  const router  = useRouter();
  const insets  = useSafeAreaInsets();
  const { photoUri, setPhotoUri, setDisplayName } = useProfile();
  const [profile, setProfile] = useState<Profile>(DEFAULT);
  const [saving,  setSaving]  = useState(false);
  const [saved,   setSaved]   = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(PROFILE_KEY).then((raw) => {
      if (raw) {
        try { setProfile(JSON.parse(raw)); } catch {}
      }
    });
  }, []);

  const pickPhoto = async () => {
    if (Platform.OS === "web") {
      Alert.alert("Upload de foto", "Disponível apenas no app mobile.");
      return;
    }
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permissão necessária", "Precisamos de acesso à sua galeria.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    });
    if (!result.canceled && result.assets[0]) {
      await setPhotoUri(result.assets[0].uri);
    }
  };

  const removePhoto = () => {
    Alert.alert("Remover foto", "Deseja remover sua foto de perfil?", [
      { text: "Cancelar", style: "cancel" },
      { text: "Remover", style: "destructive", onPress: () => setPhotoUri(null) },
    ]);
  };

  const update = (key: keyof Profile) => (val: string) =>
    setProfile((prev) => ({ ...prev, [key]: val }));

  const save = async () => {
    setSaving(true);
    await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
    await setDisplayName(profile.nome);
    await new Promise((r) => setTimeout(r, 500));
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const initials = profile.nome
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");

  const FIELDS: { label: string; key: keyof Profile; icon: string; keyboard?: any }[] = [
    { label: "Nome completo", key: "nome", icon: "user" },
    { label: "E-mail", key: "email", icon: "mail", keyboard: "email-address" },
    { label: "Cargo", key: "cargo", icon: "briefcase" },
    { label: "Empresa", key: "empresa", icon: "home" },
  ];

  return (
    <View style={[S.root, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={S.header}>
        <TouchableOpacity onPress={() => router.back()} style={S.backBtn} activeOpacity={0.7}>
          <Feather name="arrow-left" size={22} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={S.headerTitle}>Meu Perfil</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={[S.scroll, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Avatar */}
        <View style={S.avatarSection}>
          <View style={S.avatarWrap}>
            {photoUri ? (
              <Image source={{ uri: photoUri }} style={S.avatarImg} />
            ) : (
              <View style={S.avatar}>
                <Text style={S.avatarText}>{initials || "R"}</Text>
              </View>
            )}
            <TouchableOpacity style={S.avatarEdit} activeOpacity={0.8} onPress={pickPhoto}>
              <Feather name="camera" size={14} color="#fff" />
            </TouchableOpacity>
          </View>
          <Text style={S.avatarName}>{profile.nome}</Text>
          <Text style={S.avatarRole}>{profile.cargo} · {profile.empresa}</Text>
          {photoUri && (
            <TouchableOpacity onPress={removePhoto} style={{ marginTop: 8 }} activeOpacity={0.7}>
              <Text style={{ fontSize: 12, color: "rgba(255,60,100,0.7)", fontFamily: "SpaceGrotesk_400Regular" }}>
                Remover foto
              </Text>
            </TouchableOpacity>
          )}
          <View style={S.proBadge}>
            <Text style={S.proBadgeText}>✦ Plano Pro</Text>
          </View>
        </View>

        {/* Fields */}
        <View style={S.section}>
          <Text style={S.sectionTitle}>INFORMAÇÕES PESSOAIS</Text>
          <View style={S.card}>
            {FIELDS.map((f, i) => (
              <React.Fragment key={f.key}>
                <View style={S.fieldWrap}>
                  <Text style={S.fieldLabel}>{f.label}</Text>
                  <View style={S.inputRow}>
                    <Feather name={f.icon as any} size={16} color={COLORS.muted} style={S.inputIcon} />
                    <TextInput
                      style={S.input}
                      value={profile[f.key]}
                      onChangeText={update(f.key)}
                      keyboardType={f.keyboard || "default"}
                      autoCapitalize={f.keyboard === "email-address" ? "none" : "words"}
                      autoCorrect={false}
                      placeholderTextColor={COLORS.muted}
                    />
                  </View>
                </View>
                {i < FIELDS.length - 1 && <View style={S.divider} />}
              </React.Fragment>
            ))}
          </View>
        </View>

        {/* Save Button */}
        <TouchableOpacity
          style={[S.saveBtn, (saving || saved) && S.saveBtnSuccess]}
          onPress={save}
          activeOpacity={0.85}
          disabled={saving || saved}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : saved ? (
            <>
              <Feather name="check" size={18} color="#fff" />
              <Text style={S.saveBtnText}>Salvo!</Text>
            </>
          ) : (
            <Text style={S.saveBtnText}>Salvar alterações</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const S = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
  },
  backBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 17, fontFamily: "SpaceGrotesk_700Bold", color: COLORS.text },
  scroll: { paddingHorizontal: 20, paddingTop: 24 },

  avatarSection: { alignItems: "center", marginBottom: 32 },
  avatarWrap: { position: "relative", marginBottom: 14 },
  avatarImg:  { width: 90, height: 90, borderRadius: 45 },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: "#fff", fontSize: 32, fontFamily: "SpaceGrotesk_700Bold" },
  avatarEdit: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: COLORS.bg,
  },
  avatarName: { fontSize: 20, fontFamily: "SpaceGrotesk_700Bold", color: COLORS.text },
  avatarRole: { fontSize: 13, fontFamily: "SpaceGrotesk_400Regular", color: COLORS.muted, marginTop: 4 },
  proBadge: {
    marginTop: 10,
    backgroundColor: COLORS.primary + "22",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  proBadgeText: { fontSize: 12, fontFamily: "SpaceGrotesk_600SemiBold", color: COLORS.primary },

  section: { marginBottom: 24 },
  sectionTitle: {
    fontSize: 11,
    fontFamily: "SpaceGrotesk_600SemiBold",
    color: COLORS.muted,
    letterSpacing: 1,
    marginBottom: 10,
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: "hidden",
  },
  fieldWrap: { paddingHorizontal: 16, paddingVertical: 14 },
  fieldLabel: {
    fontSize: 11,
    fontFamily: "SpaceGrotesk_500Medium",
    color: COLORS.muted,
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  inputRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  inputIcon: {},
  input: { flex: 1, fontSize: 15, fontFamily: "SpaceGrotesk_400Regular", color: COLORS.text },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: COLORS.border, marginHorizontal: 16 },

  saveBtn: {
    backgroundColor: COLORS.primary,
    height: 54,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
    marginBottom: 12,
  },
  saveBtnSuccess: { backgroundColor: "#00D68F" },
  saveBtnText: { fontSize: 16, fontFamily: "SpaceGrotesk_700Bold", color: "#fff" },
});
