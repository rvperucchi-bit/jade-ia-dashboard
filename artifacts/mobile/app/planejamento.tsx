import { Feather } from "@expo/vector-icons";
import * as Calendar from "expo-calendar";
import * as Haptics from "expo-haptics";
import * as Notifications from "expo-notifications";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
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

const API_BASE =
  Platform.OS === "web"
    ? ""
    : `https://${process.env.EXPO_PUBLIC_DOMAIN ?? ""}`;

const USER_ID = "u1"; // In a real app this would come from AuthContext

const TIPO_CONFIG = {
  compromisso: { icon: "calendar",  color: "#6C63FF", label: "Compromisso" },
  lead_quente: { icon: "zap",       color: "#FF0080", label: "Lead quente" },
  followup:    { icon: "clock",     color: "#FFB300", label: "Follow-up"   },
  meta:        { icon: "target",    color: "#00D68F", label: "Meta do dia" },
} as const;

type TipoItem = keyof typeof TIPO_CONFIG;

interface PlanoItem {
  tipo: TipoItem;
  titulo: string;
  horario?: string;
  descricao?: string;
}

interface PlanoDia {
  userId: string;
  data: string;
  confirmado: boolean;
  itens: PlanoItem[];
  cronograma?: { horario: string; titulo: string; tipo: string }[];
  criadoEm: string;
  confirmadoEm?: string;
}

function hoje(): string {
  return new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" });
}

function ItemCard({ item }: { item: PlanoItem }) {
  const colors = useColors();
  const cfg = TIPO_CONFIG[item.tipo] ?? TIPO_CONFIG.compromisso;
  return (
    <View style={[S.itemCard, { backgroundColor: colors.card, borderColor: cfg.color + "30" }]}>
      <View style={[S.itemIcon, { backgroundColor: cfg.color + "18" }]}>
        <Feather name={cfg.icon as any} size={16} color={cfg.color} />
      </View>
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <Text style={[S.itemTitulo, { color: colors.text }]}>{item.titulo}</Text>
          {!!item.horario && (
            <Text style={[S.itemHorario, { color: cfg.color }]}>{item.horario}</Text>
          )}
        </View>
        {!!item.descricao && (
          <Text style={[S.itemDesc, { color: colors.mutedForeground }]}>{item.descricao}</Text>
        )}
        <View style={[S.tipoBadge, { backgroundColor: cfg.color + "18" }]}>
          <Text style={[S.tipoText, { color: cfg.color }]}>{cfg.label}</Text>
        </View>
      </View>
    </View>
  );
}

export default function PlanejamentoScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const [plano, setPlano] = useState<PlanoDia | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirmando, setConfirmando] = useState(false);
  const [editando, setEditando] = useState(false);
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [editTexto, setEditTexto] = useState("");
  const [gerandoJade, setGerandoJade] = useState(false);
  const [sugestao, setSugestao] = useState("");

  useEffect(() => {
    carregarPlano();
    agendarNotificacaoMatinal();
  }, []);

  const agendarNotificacaoMatinal = async () => {
    if (Platform.OS === "web") return;
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== "granted") return;
      await Notifications.cancelScheduledNotificationAsync("jade-morning").catch(() => {});
      await Notifications.scheduleNotificationAsync({
        identifier: "jade-morning",
        content: {
          title: "Bom dia, Rodrigo! ☀️",
          body: "Seu planejamento do dia está pronto. Confirma?",
        },
        trigger: { hour: 8, minute: 0, repeats: true } as any,
      });
    } catch { /* not available in all environments */ }
  };

  const adicionarNaAgenda = async () => {
    if (Platform.OS === "web") {
      Alert.alert("Agenda não disponível", "A integração com Google Agenda funciona apenas no app mobile.");
      return;
    }
    try {
      const { status } = await Calendar.requestCalendarPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permissão negada", "Ative o acesso à agenda nas configurações do celular.");
        return;
      }
      const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
      const editableCal = calendars.find((c) => c.allowsModifications);
      if (!editableCal || !plano) return;

      const compromissos = plano.itens.filter((it) => it.tipo === "compromisso");
      if (compromissos.length === 0) {
        Alert.alert("Sem compromissos", "Não há compromissos com horário para adicionar na agenda.");
        return;
      }
      for (const item of compromissos) {
        const today = new Date();
        const [hh = "9", mm = "0"] = (item.horario ?? "09:00").split(":");
        const start = new Date(today.getFullYear(), today.getMonth(), today.getDate(), parseInt(hh), parseInt(mm));
        const end   = new Date(start.getTime() + 60 * 60 * 1000);
        await Calendar.createEventAsync(editableCal.id, {
          title:     `JADE IA: ${item.titulo}`,
          startDate: start,
          endDate:   end,
          notes:     item.descricao ?? "",
        });
      }
      Alert.alert(
        "✅ Adicionado na agenda",
        `${compromissos.length} compromisso${compromissos.length !== 1 ? "s" : ""} sincronizado${compromissos.length !== 1 ? "s" : ""}.`
      );
    } catch {
      Alert.alert("Erro", "Não foi possível acessar a agenda. Verifique as permissões do app.");
    }
  };

  const carregarPlano = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/planejamento/${USER_ID}/hoje`);
      if (res.ok) {
        const data = await res.json();
        setPlano(data.plano);
      }
    } catch {
      setPlano({
        userId: USER_ID,
        data: new Date().toISOString().split("T")[0]!,
        confirmado: false,
        itens: [
          { tipo: "compromisso", titulo: "Reunião com TechBrasil LTDA", horario: "09:00", descricao: "Apresentação da proposta — Carlos Mendes" },
          { tipo: "lead_quente", titulo: "Follow-up Inova Digital", horario: "11:00", descricao: "18 dias sem contato — risco de perder" },
          { tipo: "meta", titulo: "Meta do dia: R$ 5.200", descricao: "Para atingir 100% da meta mensal" },
        ],
        criadoEm: new Date().toISOString(),
      });
    } finally {
      setLoading(false);
    }
  };

  const confirmarDia = async () => {
    if (!plano) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setConfirmando(true);
    try {
      const res = await fetch(`${API_BASE}/api/planejamento/${USER_ID}/hoje`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmado: true, itens: plano.itens }),
      });
      if (res.ok) {
        const data = await res.json();
        setPlano(data.plano);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert(
          "✅ Dia confirmado!",
          "Bora vender! Quer adicionar os compromissos de hoje na sua agenda?",
          [
            { text: "Não, obrigado", style: "cancel" },
            { text: "📅 Sim, adicionar", onPress: adicionarNaAgenda },
          ]
        );
      }
    } catch {
      setPlano((p) => p ? { ...p, confirmado: true, confirmadoEm: new Date().toISOString() } : p);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(
        "✅ Dia confirmado!",
        "Bora vender! Quer adicionar os compromissos de hoje na sua agenda?",
        [
          { text: "Não, obrigado", style: "cancel" },
          { text: "📅 Sim, adicionar", onPress: adicionarNaAgenda },
        ]
      );
    } finally {
      setConfirmando(false);
    }
  };

  const salvarEdicao = () => {
    if (editIndex === null || !plano || !editTexto.trim()) return;
    const itens = plano.itens.map((it, i) => i === editIndex ? { ...it, titulo: editTexto.trim() } : it);
    setPlano({ ...plano, itens });
    setEditando(false);
    setEditIndex(null);
    setEditTexto("");
  };

  const gerarSugestaoJade = async () => {
    if (!plano) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setGerandoJade(true);
    setSugestao("");
    const itensStr = plano.itens.map((it, i) => `${i + 1}. [${it.tipo}] ${it.titulo}${it.horario ? ` às ${it.horario}` : ""}${it.descricao ? ` — ${it.descricao}` : ""}`).join("\n");
    const prompt = `Responda de forma direta e objetiva em no máximo 300 palavras.\n\nVocê é a JADE, minha parceira de vendas. Analise meu planejamento de hoje e dê dicas estratégicas:\n\n${itensStr}\n\nGere:\n1. Uma frase de motivação personalizada para meu dia\n2. O compromisso mais importante do dia e por quê\n3. Uma dica rápida para maximizar cada compromisso\n4. Alertas: o que posso estar esquecendo ou subestimando\n\nSeja concisa, direta e motivadora. Máximo 200 palavras.`;
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);
      const res = await fetch(`${API_BASE}/api/jade/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [{ role: "user", content: prompt }] }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      if (!res.ok) throw new Error("API error");
      const data = await res.json();
      setSugestao(data.message?.trim() || data.response?.trim() || "");
    } catch (err: unknown) {
      const isAbort = err instanceof Error && err.name === "AbortError";
      Alert.alert(
        "Erro",
        isAbort
          ? "A JADE demorou demais para responder. Tente novamente em instantes."
          : "Não foi possível consultar a JADE. Verifique sua conexão.",
      );
    } finally {
      setGerandoJade(false);
    }
  };

  if (loading) {
    return (
      <View style={[S.root, S.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator color="#FF0080" size="large" />
        <Text style={[S.loadingText, { color: colors.mutedForeground }]}>Carregando planejamento...</Text>
      </View>
    );
  }

  return (
    <View style={[S.root, { backgroundColor: colors.background }]}>
      <View style={[S.header, { paddingTop: topPad, borderBottomColor: colors.border }]}>
        <TouchableOpacity style={[S.backBtn, { backgroundColor: colors.surface }]} onPress={() => router.back()} activeOpacity={0.8}>
          <Feather name="arrow-left" size={20} color={colors.text} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={[S.headerTitle, { color: colors.text }]}>Planejamento do Dia</Text>
          <Text style={[S.headerSub, { color: colors.mutedForeground }]}>{hoje()}</Text>
        </View>
        {plano?.confirmado && (
          <View style={[S.confirmBadge, { backgroundColor: "#00D68F20", borderColor: "#00D68F40" }]}>
            <Feather name="check-circle" size={13} color="#00D68F" />
            <Text style={[S.confirmBadgeText, { color: "#00D68F" }]}>Confirmado</Text>
          </View>
        )}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[S.scroll, { paddingBottom: insets.bottom + 100 }]}>
        {/* Agenda do dia */}
        <Text style={[S.sectionLabel, { color: colors.mutedForeground }]}>AGENDA DE HOJE</Text>
        {(plano?.itens ?? []).map((item, i) => (
          <TouchableOpacity
            key={i}
            onLongPress={() => { setEditando(true); setEditIndex(i); setEditTexto(item.titulo); }}
            activeOpacity={0.9}
          >
            <ItemCard item={item} />
          </TouchableOpacity>
        ))}
        <Text style={[S.hintText, { color: colors.mutedForeground }]}>Segure um item para editar</Text>

        {/* Edit mode */}
        {editando && editIndex !== null && (
          <View style={[S.editBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[S.editLabel, { color: colors.mutedForeground }]}>EDITAR ITEM</Text>
            <View style={[S.editInput, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <TextInput
                style={[S.editTextInput, { color: colors.text }]}
                value={editTexto}
                onChangeText={setEditTexto}
                autoFocus
              />
            </View>
            <View style={{ flexDirection: "row", gap: 10 }}>
              <TouchableOpacity style={[S.editCancelBtn, { borderColor: colors.border }]} onPress={() => { setEditando(false); setEditIndex(null); }} activeOpacity={0.8}>
                <Text style={[S.editCancelText, { color: colors.mutedForeground }]}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[S.editSaveBtn, { backgroundColor: "#FF0080" }]} onPress={salvarEdicao} activeOpacity={0.85}>
                <Text style={S.editSaveText}>Salvar</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* JADE coaching */}
        <TouchableOpacity
          style={[S.jadeBtn, { backgroundColor: "#FF008018", borderColor: "#FF008040" }, gerandoJade && { opacity: 0.7 }]}
          onPress={gerarSugestaoJade}
          disabled={gerandoJade}
          activeOpacity={0.85}
        >
          {gerandoJade
            ? <><ActivityIndicator color="#FF0080" size="small" /><Text style={[S.jadeBtnText, { color: "#FF0080" }]}>JADE analisando seu dia...</Text></>
            : <><Feather name="cpu" size={17} color="#FF0080" /><Text style={[S.jadeBtnText, { color: "#FF0080" }]}>Análise estratégica do meu dia</Text></>
          }
        </TouchableOpacity>

        {!!sugestao && !gerandoJade && (
          <View style={[S.sugestaoBox, { backgroundColor: colors.card, borderColor: "#FF008030" }]}>
            <View style={[S.sugestaoHeader, { backgroundColor: "#FF008012" }]}>
              <Feather name="cpu" size={13} color="#FF0080" />
              <Text style={[S.sugestaoLabel, { color: "#FF0080" }]}>Análise da JADE</Text>
            </View>
            <Text style={[S.sugestaoText, { color: colors.text }]}>{sugestao}</Text>
          </View>
        )}

        {/* Confirm/Adjust buttons */}
        {!plano?.confirmado ? (
          <View style={{ gap: 10 }}>
            <TouchableOpacity
              style={[S.confirmBtn, confirmando && { opacity: 0.7 }]}
              onPress={confirmarDia}
              disabled={confirmando}
              activeOpacity={0.85}
            >
              {confirmando
                ? <><ActivityIndicator color="#fff" size="small" /><Text style={S.confirmBtnText}>Confirmando...</Text></>
                : <><Feather name="check" size={18} color="#fff" /><Text style={S.confirmBtnText}>Confirmar meu dia</Text></>
              }
            </TouchableOpacity>
            <TouchableOpacity
              style={[S.ajustarBtn, { borderColor: colors.border }]}
              onPress={() => setEditando(true)}
              activeOpacity={0.8}
            >
              <Feather name="edit-2" size={16} color={colors.text} />
              <Text style={[S.ajustarBtnText, { color: colors.text }]}>Ajustar planejamento</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={[S.confirmedBox, { backgroundColor: "#00D68F10", borderColor: "#00D68F30" }]}>
            <Feather name="check-circle" size={22} color="#00D68F" />
            <View style={{ flex: 1 }}>
              <Text style={[S.confirmedTitle, { color: "#00D68F" }]}>Dia confirmado! Bora vender 🚀</Text>
              <Text style={[S.confirmedSub, { color: colors.mutedForeground }]}>
                Confirmado {plano.confirmadoEm ? new Date(plano.confirmadoEm).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) : ""}
              </Text>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const S = StyleSheet.create({
  root: { flex: 1 },
  center: { justifyContent: "center", alignItems: "center", gap: 12 },
  loadingText: { fontSize: 14, fontFamily: "SpaceGrotesk_400Regular", marginTop: 8 },
  header: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 20, paddingBottom: 14, borderBottomWidth: StyleSheet.hairlineWidth },
  backBtn: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 18, fontFamily: "SpaceGrotesk_700Bold" },
  headerSub: { fontSize: 12, fontFamily: "SpaceGrotesk_400Regular", marginTop: 2 },
  confirmBadge: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10, borderWidth: 1 },
  confirmBadgeText: { fontSize: 12, fontFamily: "SpaceGrotesk_600SemiBold" },
  scroll: { padding: 16, gap: 10 },
  sectionLabel: { fontSize: 11, fontFamily: "SpaceGrotesk_700Bold", letterSpacing: 1, marginBottom: 4 },
  itemCard: { flexDirection: "row", gap: 12, borderRadius: 14, borderWidth: 1, padding: 14, alignItems: "flex-start" },
  itemIcon: { width: 34, height: 34, borderRadius: 10, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  itemTitulo: { fontSize: 14, fontFamily: "SpaceGrotesk_600SemiBold", flex: 1 },
  itemHorario: { fontSize: 13, fontFamily: "SpaceGrotesk_700Bold" },
  itemDesc: { fontSize: 12, fontFamily: "SpaceGrotesk_400Regular", lineHeight: 18, marginTop: 4 },
  tipoBadge: { alignSelf: "flex-start", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, marginTop: 6 },
  tipoText: { fontSize: 10, fontFamily: "SpaceGrotesk_700Bold" },
  hintText: { fontSize: 11, fontFamily: "SpaceGrotesk_400Regular", textAlign: "center", marginTop: -2 },
  editBox: { borderRadius: 14, borderWidth: 1, padding: 14, gap: 10 },
  editLabel: { fontSize: 10, fontFamily: "SpaceGrotesk_700Bold", letterSpacing: 0.8 },
  editInput: { borderRadius: 10, borderWidth: 1, paddingHorizontal: 12, height: 44 },
  editTextInput: { flex: 1, fontSize: 14, fontFamily: "SpaceGrotesk_400Regular" },
  editCancelBtn: { flex: 1, height: 42, borderRadius: 10, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  editCancelText: { fontSize: 14, fontFamily: "SpaceGrotesk_500Medium" },
  editSaveBtn: { flex: 1, height: 42, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  editSaveText: { color: "#fff", fontSize: 14, fontFamily: "SpaceGrotesk_700Bold" },
  jadeBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, height: 48, borderRadius: 12, borderWidth: 1, marginTop: 6 },
  jadeBtnText: { fontSize: 14, fontFamily: "SpaceGrotesk_600SemiBold" },
  sugestaoBox: { borderRadius: 14, borderWidth: 1, overflow: "hidden" },
  sugestaoHeader: { flexDirection: "row", alignItems: "center", gap: 8, padding: 12 },
  sugestaoLabel: { fontSize: 12, fontFamily: "SpaceGrotesk_600SemiBold" },
  sugestaoText: { fontSize: 14, fontFamily: "SpaceGrotesk_400Regular", lineHeight: 22, padding: 16, paddingTop: 4 },
  confirmBtn: { backgroundColor: "#00D68F", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, height: 54, borderRadius: 14, shadowColor: "#00D68F", shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 6 },
  confirmBtnText: { color: "#fff", fontSize: 16, fontFamily: "SpaceGrotesk_700Bold" },
  ajustarBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, height: 48, borderRadius: 14, borderWidth: 1 },
  ajustarBtnText: { fontSize: 15, fontFamily: "SpaceGrotesk_600SemiBold" },
  confirmedBox: { flexDirection: "row", alignItems: "center", gap: 12, borderRadius: 14, borderWidth: 1, padding: 16 },
  confirmedTitle: { fontSize: 15, fontFamily: "SpaceGrotesk_700Bold" },
  confirmedSub: { fontSize: 12, fontFamily: "SpaceGrotesk_400Regular", marginTop: 3 },
});
