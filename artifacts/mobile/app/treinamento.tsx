import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const C = {
  bg: "#0A0A0F",
  card: "#111118",
  border: "#1E1E2E",
  text: "#FFFFFF",
  muted: "#7777AA",
  sub: "#AAAACC",
  primary: "#FF0080",
  surface: "#16161F",
  success: "#00D68F",
  warning: "#FFB300",
};

const MODULES = [
  {
    icon: "star",
    color: C.primary,
    name: "Qualificação de Leads",
    desc: 'Diga: "Qualifica esse lead" ou "Qual a nota desse estabelecimento?" A JADE analisa o perfil, gera um score de 0–100 e sugere a melhor abordagem comercial.',
  },
  {
    icon: "message-circle",
    color: "#25D366",
    name: "Abordagem WhatsApp",
    desc: 'Diga: "Cria uma mensagem pro WhatsApp" ou "Monta um script de abordagem". A JADE gera textos personalizados para o perfil do lead.',
  },
  {
    icon: "bar-chart-2",
    color: C.warning,
    name: "CRM & Pipeline",
    desc: 'Diga: "Move esse lead para negociação" ou "Mostra meu pipeline". Gerencie o funil de vendas por comandos de voz ou texto.',
  },
  {
    icon: "file-text",
    color: "#7C3AED",
    name: "Laudo Executivo",
    desc: 'Diga: "Gera um laudo executivo" ou "Faz o diagnóstico de marketing". A JADE cria um relatório profissional para usar na prospecção.',
  },
  {
    icon: "zap",
    color: C.warning,
    name: "Marketing IA",
    desc: 'Diga: "Cria um post para Instagram" ou "Faz um story sobre minha oferta". Conteúdo pronto para redes sociais e WhatsApp.',
  },
  {
    icon: "trending-up",
    color: C.success,
    name: "Relatórios",
    desc: 'Diga: "Mostra meu relatório do dia" ou "Quantos leads fechei essa semana?". Acompanhe sua performance em tempo real.',
  },
];

const SHORTCUTS = [
  { chip: "⚡ Qualificar", desc: "Inicia a qualificação com IA do lead atual em aberto" },
  { chip: "📋 Laudo", desc: "Gera o laudo executivo de marketing do lead selecionado" },
  { chip: "💬 Script", desc: "Cria um script de abordagem personalizado para o lead" },
  { chip: "📊 Relatório", desc: "Abre o resumo de performance do dia/semana atual" },
  { chip: "🎯 Briefing", desc: "Gera o briefing pré-reunião com perguntas e argumentos" },
];

const TIPS = [
  {
    icon: "target",
    title: "Seja específico nos comandos",
    desc: 'Quanto mais contexto você der, melhor a resposta. Ex: "Qualifica esse restaurante de médio porte no centro de Criciúma" é melhor que só "Qualifica".',
  },
  {
    icon: "refresh-cw",
    title: "Use o botão de regenerar",
    desc: "Se a resposta da JADE não ficou do jeito que você queria, toque em 'Tentar novamente' para gerar uma nova versão com o mesmo comando.",
  },
  {
    icon: "copy",
    title: "Copie e personalize",
    desc: "Scripts e mensagens são sugestões. Sempre personalize antes de enviar ao lead — adicione o nome do responsável e detalhes específicos do negócio.",
  },
  {
    icon: "calendar",
    title: "Revise o relatório diário",
    desc: "Acesse o relatório diário toda manhã para planejar suas prioridades. A JADE sugere quais leads merece atenção com base no histórico.",
  },
];

export default function TreinamentoScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={[S.root, { paddingTop: insets.top }]}>
      <View style={S.header}>
        <TouchableOpacity onPress={() => router.back()} style={S.backBtn} activeOpacity={0.7}>
          <Feather name="arrow-left" size={22} color={C.text} />
        </TouchableOpacity>
        <Text style={S.headerTitle}>Treinamento da JADE</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={[S.scroll, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <View style={S.hero}>
          <View style={S.heroIcon}>
            <MaterialCommunityIcons name="robot" size={32} color={C.primary} />
          </View>
          <Text style={S.heroTitle}>Aprenda a usar a JADE</Text>
          <Text style={S.heroSub}>
            Descubra como ativar cada módulo e tirar o máximo da sua IA de vendas.
          </Text>
        </View>

        {/* Módulos */}
        <Text style={S.sectionLabel}>COMO ATIVAR OS MÓDULOS</Text>
        <View style={S.moduleGrid}>
          {MODULES.map((mod, i) => (
            <View key={i} style={S.moduleCard}>
              <View style={[S.moduleIconBox, { backgroundColor: mod.color + "1A" }]}>
                <Feather name={mod.icon as any} size={20} color={mod.color} />
              </View>
              <Text style={S.moduleName}>{mod.name}</Text>
              <Text style={S.moduleDesc}>{mod.desc}</Text>
            </View>
          ))}
        </View>

        {/* Comandos rápidos */}
        <Text style={[S.sectionLabel, { marginTop: 8 }]}>COMANDOS RÁPIDOS</Text>
        <View style={S.card}>
          <Text style={S.cardDesc}>
            Os chips de atalho aparecem na tela do chat JADE. Toque em qualquer um para executar a ação instantaneamente.
          </Text>
          {SHORTCUTS.map((s, i) => (
            <View key={i} style={[S.shortcutRow, i < SHORTCUTS.length - 1 && S.shortcutBorder]}>
              <View style={S.chipPreview}>
                <Text style={S.chipText}>{s.chip}</Text>
              </View>
              <Text style={S.shortcutDesc}>{s.desc}</Text>
            </View>
          ))}
        </View>

        {/* Dicas */}
        <Text style={[S.sectionLabel, { marginTop: 8 }]}>DICAS DE USO</Text>
        {TIPS.map((tip, i) => (
          <View key={i} style={S.tipCard}>
            <View style={S.tipIconBox}>
              <Feather name={tip.icon as any} size={18} color={C.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={S.tipTitle}>{tip.title}</Text>
              <Text style={S.tipDesc}>{tip.desc}</Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const S = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: C.border,
  },
  backBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 17, fontFamily: "SpaceGrotesk_700Bold", color: C.text },
  scroll: { paddingHorizontal: 20, paddingTop: 8 },

  hero: { alignItems: "center", paddingVertical: 28, gap: 10 },
  heroIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: C.primary + "18",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  heroTitle: { fontSize: 22, fontFamily: "SpaceGrotesk_700Bold", color: C.text, textAlign: "center" },
  heroSub: {
    fontSize: 14,
    fontFamily: "SpaceGrotesk_400Regular",
    color: C.sub,
    textAlign: "center",
    lineHeight: 22,
  },

  sectionLabel: {
    fontSize: 11,
    fontFamily: "SpaceGrotesk_600SemiBold",
    color: C.muted,
    letterSpacing: 1,
    marginBottom: 12,
  },

  moduleGrid: { gap: 10, marginBottom: 24 },
  moduleCard: {
    backgroundColor: C.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.border,
    padding: 16,
    gap: 8,
  },
  moduleIconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  moduleName: { fontSize: 15, fontFamily: "SpaceGrotesk_700Bold", color: C.text },
  moduleDesc: { fontSize: 13, fontFamily: "SpaceGrotesk_400Regular", color: C.sub, lineHeight: 20 },

  card: {
    backgroundColor: C.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.border,
    padding: 16,
    gap: 4,
    marginBottom: 24,
  },
  cardDesc: {
    fontSize: 13,
    fontFamily: "SpaceGrotesk_400Regular",
    color: C.muted,
    lineHeight: 20,
    marginBottom: 12,
  },
  shortcutRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 11,
  },
  shortcutBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: C.border,
  },
  chipPreview: {
    backgroundColor: C.surface,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: C.border,
    minWidth: 100,
    alignItems: "center",
  },
  chipText: { fontSize: 12, fontFamily: "SpaceGrotesk_600SemiBold", color: C.text },
  shortcutDesc: {
    flex: 1,
    fontSize: 13,
    fontFamily: "SpaceGrotesk_400Regular",
    color: C.sub,
    lineHeight: 18,
  },

  tipCard: {
    flexDirection: "row",
    gap: 14,
    backgroundColor: C.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.border,
    padding: 16,
    marginBottom: 10,
    alignItems: "flex-start",
  },
  tipIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: C.primary + "18",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
  },
  tipTitle: { fontSize: 14, fontFamily: "SpaceGrotesk_700Bold", color: C.text, marginBottom: 4 },
  tipDesc: { fontSize: 13, fontFamily: "SpaceGrotesk_400Regular", color: C.sub, lineHeight: 20 },
});
