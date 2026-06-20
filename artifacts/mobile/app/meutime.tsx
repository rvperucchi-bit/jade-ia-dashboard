import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";

const ENTERPRISE_PURPLE = "#8400FF";

const API_BASE =
  Platform.OS === "web"
    ? ""
    : `https://${process.env.EXPO_PUBLIC_DOMAIN ?? ""}`;

interface Vendedor {
  id: string;
  nome: string;
  email: string;
  segmento: string;
  metaMensal: number;
  metaLeads: number;
  realizado: number;
  avatarColor: string;
  ultimaAtividade: string;
}

const AVATAR_COLORS = ["#FF0080", "#6C63FF", "#00D68F", "#FFB300", "#4ECDC4", "#FF6B35", "#AB47BC"];

function pct(realizado: number, meta: number): number {
  if (!meta) return 0;
  return Math.min(Math.round((realizado / meta) * 100), 999);
}

function initials(nome: string): string {
  return nome.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
}

function medalha(rank: number): string {
  if (rank === 0) return "🥇";
  if (rank === 1) return "🥈";
  if (rank === 2) return "🥉";
  return "";
}

const SEED: Vendedor[] = [
  { id: "v1", nome: "Ana Paula", email: "ana@empresa.com", segmento: "PME", metaMensal: 30000, metaLeads: 40, realizado: 36000, avatarColor: "#6C63FF", ultimaAtividade: "Hoje, 14h" },
  { id: "v2", nome: "Carlos Rocha", email: "carlos@empresa.com", segmento: "Enterprise", metaMensal: 60000, metaLeads: 25, realizado: 34800, avatarColor: "#FF0080", ultimaAtividade: "Hoje, 10h" },
  { id: "v3", nome: "Mariana Lima", email: "mariana@empresa.com", segmento: "Varejo", metaMensal: 25000, metaLeads: 50, realizado: 21250, avatarColor: "#00D68F", ultimaAtividade: "Ontem, 16h" },
  { id: "v4", nome: "Diego Nunes", email: "diego@empresa.com", segmento: "SaaS", metaMensal: 45000, metaLeads: 30, realizado: 20250, avatarColor: "#FFB300", ultimaAtividade: "Ontem, 9h" },
];

export default function MeuTimeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const [vendedores, setVendedores] = useState<Vendedor[]>(SEED);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({ nome: "", email: "", segmento: "", metaMensal: "", metaLeads: "" });
  const updateForm = (k: keyof typeof form) => (v: string) => setForm((prev) => ({ ...prev, [k]: v }));

  useEffect(() => {
    fetch(`${API_BASE}/api/time`)
      .then((r) => r.ok ? r.json() : null)
      .then((data) => { if (data?.vendedores?.length) setVendedores(data.vendedores); })
      .catch(() => {});
  }, []);

  const ranked = [...vendedores].sort((a, b) => pct(b.realizado, b.metaMensal) - pct(a.realizado, a.metaMensal));

  const handleAdd = async () => {
    if (!form.nome.trim() || !form.metaMensal.trim()) {
      Alert.alert("Obrigatório", "Preencha nome e meta mensal.");
      return;
    }
    setSaving(true);
    const novo: Vendedor = {
      id: "v" + Date.now(),
      nome: form.nome.trim(),
      email: form.email.trim(),
      segmento: form.segmento.trim() || "Geral",
      metaMensal: parseFloat(form.metaMensal) || 0,
      metaLeads: parseInt(form.metaLeads) || 0,
      realizado: 0,
      avatarColor: AVATAR_COLORS[vendedores.length % AVATAR_COLORS.length],
      ultimaAtividade: "Agora",
    };
    const novos = [...vendedores, novo];
    setVendedores(novos);
    try {
      await fetch(`${API_BASE}/api/time`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vendedor: novo }),
      });
    } catch {}
    setForm({ nome: "", email: "", segmento: "", metaMensal: "", metaLeads: "" });
    setShowModal(false);
    setSaving(false);
  };

  const barColor = (p: number) => p >= 80 ? "#00D68F" : p >= 50 ? "#FFB300" : "#FF3B5C";

  return (
    <View style={[S.root, { backgroundColor: colors.background }]}>
      <View style={[S.header, { paddingTop: topPad, borderBottomColor: colors.border }]}>
        <TouchableOpacity style={[S.backBtn, { backgroundColor: colors.surface }]} onPress={() => router.back()} activeOpacity={0.8}>
          <Feather name="arrow-left" size={20} color={colors.text} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={[S.title, { color: colors.text }]}>Meu Time</Text>
          <Text style={[S.sub, { color: colors.mutedForeground }]}>{vendedores.length} vendedores</Text>
        </View>
        <TouchableOpacity style={[S.addBtn, { backgroundColor: ENTERPRISE_PURPLE }]} onPress={() => setShowModal(true)} activeOpacity={0.85}>
          <Feather name="user-plus" size={16} color="#fff" />
          <Text style={S.addBtnText}>Adicionar</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        <Text style={[S.sectionLabel, { color: colors.mutedForeground }]}>RANKING DO TIME</Text>

        {ranked.map((v, idx) => {
          const p = pct(v.realizado, v.metaMensal);
          const bc = barColor(p);
          return (
            <View key={v.id} style={[S.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={S.cardTop}>
                <View style={[S.avatar, { backgroundColor: v.avatarColor }]}>
                  <Text style={S.avatarText}>{initials(v.nome)}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <View style={S.nameRow}>
                    {medalha(idx) ? <Text style={S.medal}>{medalha(idx)}</Text> : null}
                    <Text style={[S.nome, { color: colors.text }]}>{v.nome}</Text>
                    <View style={[S.segBadge, { backgroundColor: colors.surface }]}>
                      <Text style={[S.segText, { color: colors.mutedForeground }]}>{v.segmento}</Text>
                    </View>
                  </View>
                  <Text style={[S.atv, { color: colors.mutedForeground }]}>Última atividade: {v.ultimaAtividade}</Text>
                </View>
                <Text style={[S.pctText, { color: bc }]}>{p}%</Text>
              </View>

              <View style={S.metaRow}>
                <Text style={[S.metaLabel, { color: colors.mutedForeground }]}>
                  R$ {v.realizado.toLocaleString("pt-BR")} / R$ {v.metaMensal.toLocaleString("pt-BR")}
                </Text>
                <Text style={[S.leadsLabel, { color: colors.mutedForeground }]}>
                  {v.metaLeads} leads/mês
                </Text>
              </View>

              <View style={[S.barTrack, { backgroundColor: colors.surface }]}>
                <View style={[S.barFill, { width: `${Math.min(p, 100)}%` as any, backgroundColor: bc }]} />
              </View>
            </View>
          );
        })}
      </ScrollView>

      <Modal visible={showModal} transparent animationType="slide" onRequestClose={() => setShowModal(false)}>
        <View style={S.modalOverlay}>
          <View style={[S.modalBox, { backgroundColor: colors.card }]}>
            <View style={S.modalHeader}>
              <Text style={[S.modalTitle, { color: colors.text }]}>Novo Vendedor</Text>
              <TouchableOpacity onPress={() => setShowModal(false)} activeOpacity={0.7}>
                <Feather name="x" size={22} color={colors.mutedForeground} />
              </TouchableOpacity>
            </View>

            {([
              { key: "nome", label: "Nome completo *", placeholder: "João da Silva", icon: "user" },
              { key: "email", label: "E-mail", placeholder: "joao@empresa.com", icon: "mail" },
              { key: "segmento", label: "Segmento que atende", placeholder: "PME, Enterprise, Varejo...", icon: "tag" },
              { key: "metaMensal", label: "Meta mensal (R$) *", placeholder: "30000", icon: "target" },
              { key: "metaLeads", label: "Meta de leads/mês", placeholder: "40", icon: "users" },
            ] as const).map((f) => (
              <View key={f.key} style={S.fieldGroup}>
                <Text style={[S.fieldLabel, { color: colors.mutedForeground }]}>{f.label}</Text>
                <View style={[S.inputRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <Feather name={f.icon as any} size={16} color={colors.mutedForeground} />
                  <TextInput
                    style={[S.input, { color: colors.text }]}
                    placeholder={f.placeholder}
                    placeholderTextColor={colors.mutedForeground}
                    value={form[f.key]}
                    onChangeText={updateForm(f.key)}
                    keyboardType={["metaMensal", "metaLeads"].includes(f.key) ? "numeric" : "default"}
                    autoCapitalize="none"
                  />
                </View>
              </View>
            ))}

            <TouchableOpacity
              style={[S.saveBtn, { backgroundColor: ENTERPRISE_PURPLE }, saving && { opacity: 0.7 }]}
              onPress={handleAdd}
              disabled={saving}
              activeOpacity={0.85}
            >
              {saving ? <ActivityIndicator color="#fff" size="small" /> : (
                <><Feather name="user-plus" size={16} color="#fff" /><Text style={S.saveBtnText}>Adicionar ao Time</Text></>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const S = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: "row", alignItems: "center", gap: 12,
    paddingHorizontal: 20, paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 18, fontFamily: "SpaceGrotesk_700Bold" },
  sub: { fontSize: 12, fontFamily: "SpaceGrotesk_400Regular", marginTop: 2 },
  addBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 12 },
  addBtnText: { color: "#fff", fontSize: 13, fontFamily: "SpaceGrotesk_600SemiBold" },
  sectionLabel: { fontSize: 11, fontFamily: "SpaceGrotesk_600SemiBold", letterSpacing: 1, marginHorizontal: 20, marginTop: 20, marginBottom: 12 },
  card: { marginHorizontal: 16, marginBottom: 10, padding: 16, borderRadius: 16, borderWidth: 1, gap: 10 },
  cardTop: { flexDirection: "row", alignItems: "center", gap: 12 },
  avatar: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  avatarText: { color: "#fff", fontSize: 15, fontFamily: "SpaceGrotesk_700Bold" },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 6, flexWrap: "wrap" },
  medal: { fontSize: 16 },
  nome: { fontSize: 15, fontFamily: "SpaceGrotesk_700Bold" },
  segBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  segText: { fontSize: 11, fontFamily: "SpaceGrotesk_500Medium" },
  atv: { fontSize: 12, fontFamily: "SpaceGrotesk_400Regular", marginTop: 2 },
  pctText: { fontSize: 18, fontFamily: "SpaceGrotesk_700Bold" },
  metaRow: { flexDirection: "row", justifyContent: "space-between" },
  metaLabel: { fontSize: 12, fontFamily: "SpaceGrotesk_400Regular" },
  leadsLabel: { fontSize: 12, fontFamily: "SpaceGrotesk_400Regular" },
  barTrack: { height: 6, borderRadius: 4, overflow: "hidden" },
  barFill: { height: "100%", borderRadius: 4 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.7)", justifyContent: "flex-end" },
  modalBox: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, gap: 14, paddingBottom: 40 },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 },
  modalTitle: { fontSize: 18, fontFamily: "SpaceGrotesk_700Bold" },
  fieldGroup: { gap: 6 },
  fieldLabel: { fontSize: 12, fontFamily: "SpaceGrotesk_500Medium", textTransform: "uppercase", letterSpacing: 0.5 },
  inputRow: { flexDirection: "row", alignItems: "center", gap: 10, borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, height: 48 },
  input: { flex: 1, fontSize: 15, fontFamily: "SpaceGrotesk_400Regular" },
  saveBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, height: 52, borderRadius: 14, marginTop: 4 },
  saveBtnText: { color: "#fff", fontSize: 15, fontFamily: "SpaceGrotesk_700Bold" },
});
