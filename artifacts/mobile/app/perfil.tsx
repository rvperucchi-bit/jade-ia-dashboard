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
import { useColors } from "@/hooks/useColors";

const PROFILE_KEY = "@jade_ia:profile";
const PINK = "#FF0080";

interface Profile {
  nome:    string;
  email:   string;
  cargo:   string;
  empresa: string;
}

const DEFAULT: Profile = {
  nome:    "Rodrigo",
  email:   "rodrigo@jadeia.com.br",
  cargo:   "Fundador",
  empresa: "JÁ Delivery",
};

export default function PerfilScreen() {
  const router  = useRouter();
  const insets  = useSafeAreaInsets();
  const colors  = useColors();
  const { photoUri, setPhotoUri, setDisplayName } = useProfile();
  const [profile, setProfile] = useState<Profile>(DEFAULT);
  const [saving,  setSaving]  = useState(false);
  const [saved,   setSaved]   = useState(false);

  const topPad = Platform.OS === "web" ? 24 : insets.top + 4;
  const botPad = Platform.OS === "web" ? 40 : insets.bottom + 32;

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
    { label: "Nome completo", key: "nome",    icon: "user" },
    { label: "E-mail",        key: "email",   icon: "mail",     keyboard: "email-address" },
    { label: "Cargo",         key: "cargo",   icon: "briefcase" },
    { label: "Empresa",       key: "empresa", icon: "home" },
  ];

  return (
    <View style={[S.root, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[S.header, { paddingTop: topPad }]}>
        <TouchableOpacity onPress={() => router.back()} style={S.backBtn} activeOpacity={0.7}>
          <Feather name="chevron-left" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={[S.headerTitle, { color: colors.text }]}>Meu Perfil</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        contentContainerStyle={[S.scroll, { paddingBottom: botPad }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Avatar */}
        <View style={S.avatarSection}>
          <View style={S.avatarWrap}>
            {photoUri ? (
              <Image source={{ uri: photoUri }} style={S.avatarImg} />
            ) : (
              <View style={[S.avatar, { backgroundColor: PINK }]}>
                <Text style={S.avatarText}>{initials || "R"}</Text>
              </View>
            )}
            <TouchableOpacity
              style={[S.avatarEdit, { backgroundColor: PINK, borderColor: colors.background }]}
              activeOpacity={0.8}
              onPress={pickPhoto}
            >
              <Feather name="camera" size={14} color="#fff" />
            </TouchableOpacity>
          </View>
          <Text style={[S.avatarName, { color: colors.text }]}>{profile.nome}</Text>
          <Text style={[S.avatarRole, { color: colors.mutedForeground }]}>
            {profile.cargo} · {profile.empresa}
          </Text>
          {photoUri && (
            <TouchableOpacity onPress={removePhoto} style={{ marginTop: 8 }} activeOpacity={0.7}>
              <Text style={{ fontSize: 13, color: "rgba(255,60,100,0.7)", fontFamily: "SpaceGrotesk_400Regular" }}>
                Remover foto
              </Text>
            </TouchableOpacity>
          )}
          <View style={[S.proBadge, { backgroundColor: PINK + "22" }]}>
            <Text style={[S.proBadgeText, { color: PINK }]}>✦ Plano Pro</Text>
          </View>
        </View>

        {/* Fields */}
        <View style={{ marginBottom: 24, paddingHorizontal: 16 }}>
          <Text style={[S.sectionTitle, { color: colors.mutedForeground }]}>INFORMAÇÕES PESSOAIS</Text>
          <View style={[S.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {FIELDS.map((f, i) => (
              <React.Fragment key={f.key}>
                <View style={S.fieldWrap}>
                  <Text style={[S.fieldLabel, { color: colors.mutedForeground }]}>{f.label}</Text>
                  <View style={S.inputRow}>
                    <Feather name={f.icon as any} size={16} color={colors.mutedForeground} style={S.inputIcon} />
                    <TextInput
                      style={[S.input, { color: colors.text }]}
                      value={profile[f.key]}
                      onChangeText={update(f.key)}
                      keyboardType={f.keyboard || "default"}
                      autoCapitalize={f.keyboard === "email-address" ? "none" : "words"}
                      autoCorrect={false}
                      placeholderTextColor={colors.mutedForeground}
                    />
                  </View>
                </View>
                {i < FIELDS.length - 1 && (
                  <View style={[S.divider, { backgroundColor: colors.border }]} />
                )}
              </React.Fragment>
            ))}
          </View>
        </View>

        {/* Save Button */}
        <View style={{ paddingHorizontal: 16 }}>
          <TouchableOpacity
            style={[
              S.saveBtn,
              { backgroundColor: saved ? "#00D68F" : PINK, shadowColor: PINK },
            ]}
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
        </View>
      </ScrollView>
    </View>
  );
}

const S = StyleSheet.create({
  root:   { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingBottom: 16 },
  backBtn:    { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  headerTitle:{ fontSize: 17, fontFamily: "SpaceGrotesk_700Bold" },
  scroll: { paddingTop: 24 },

  avatarSection: { alignItems: "center", marginBottom: 32, paddingHorizontal: 16 },
  avatarWrap:    { position: "relative", marginBottom: 14 },
  avatarImg:     { width: 90, height: 90, borderRadius: 45 },
  avatar:        { width: 90, height: 90, borderRadius: 45, alignItems: "center", justifyContent: "center" },
  avatarText:    { color: "#fff", fontSize: 32, fontFamily: "SpaceGrotesk_700Bold" },
  avatarEdit:    {
    position: "absolute", bottom: 0, right: 0,
    width: 28, height: 28, borderRadius: 14,
    alignItems: "center", justifyContent: "center",
    borderWidth: 2,
  },
  avatarName:  { fontSize: 20, fontFamily: "SpaceGrotesk_700Bold" },
  avatarRole:  { fontSize: 13, fontFamily: "SpaceGrotesk_400Regular", marginTop: 4 },
  proBadge:    { marginTop: 10, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20 },
  proBadgeText:{ fontSize: 12, fontFamily: "SpaceGrotesk_600SemiBold" },

  sectionTitle: { fontSize: 11, fontFamily: "SpaceGrotesk_600SemiBold", letterSpacing: 0.8, marginBottom: 10 },
  card:         { borderRadius: 14, borderWidth: 1, overflow: "hidden" },
  fieldWrap:    { paddingHorizontal: 16, paddingVertical: 14 },
  fieldLabel:   { fontSize: 11, fontFamily: "SpaceGrotesk_500Medium", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 },
  inputRow:     { flexDirection: "row", alignItems: "center", gap: 10 },
  inputIcon:    {},
  input:        { flex: 1, fontSize: 14, fontFamily: "SpaceGrotesk_400Regular" },
  divider:      { height: StyleSheet.hairlineWidth, marginHorizontal: 16 },

  saveBtn: {
    height: 54, borderRadius: 14,
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 16, elevation: 8,
    marginBottom: 12,
  },
  saveBtnText: { fontSize: 15, fontFamily: "SpaceGrotesk_700Bold", color: "#fff" },
});
