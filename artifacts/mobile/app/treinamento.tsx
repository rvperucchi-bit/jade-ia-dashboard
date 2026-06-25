import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";

const PINK = "#FF0080";

const MODULES = [
  { icon: "star",        color: PINK, name: "Qualificação de Leads",   desc: 'Diga: "Qualifica esse lead" ou "Qual a nota desse estabelecimento?" A JADE analisa o perfil, gera um score de 0–100 e sugere a melhor abordagem comercial.' },
  { icon: "message-circle", color: PINK, name: "Abordagem WhatsApp",   desc: 'Diga: "Cria uma mensagem pro WhatsApp" ou "Monta um script de abordagem". A JADE gera textos personalizados para o perfil do lead.' },
  { icon: "bar-chart-2", color: PINK, name: "CRM & Pipeline",          desc: 'Diga: "Move esse lead para negociação" ou "Mostra meu pipeline". Gerencie o funil de vendas por comandos de voz ou texto.' },
  { icon: "file-text",   color: PINK, name: "Laudo Executivo",         desc: 'Diga: "Gera um laudo executivo" ou "Faz o diagnóstico de marketing". A JADE cria um relatório profissional para usar na prospecção.' },
  { icon: "zap",         color: PINK, name: "Marketing IA",            desc: 'Diga: "Cria um post para Instagram" ou "Faz um story sobre minha oferta". Conteúdo pronto para redes sociais e WhatsApp.' },
  { icon: "trending-up", color: PINK, name: "Relatórios",              desc: 'Diga: "Mostra meu relatório do dia" ou "Quantos leads fechei essa semana?". Acompanhe sua performance em tempo real.' },
];

const SHORTCUTS = [
  { chip: "⚡ Qualificar", desc: "Inicia a qualificação com IA do lead atual em aberto" },
  { chip: "📋 Laudo",      desc: "Gera o laudo executivo de marketing do lead selecionado" },
  { chip: "💬 Script",     desc: "Cria um script de abordagem personalizado para o lead" },
  { chip: "📊 Relatório",  desc: "Abre o resumo de performance do dia/semana atual" },
  { chip: "🎯 Briefing",   desc: "Gera o briefing pré-reunião com perguntas e argumentos" },
];

const TIPS = [
  { icon: "target",     title: "Seja específico nos comandos",    desc: 'Quanto mais contexto você der, melhor a resposta. Ex: "Qualifica esse restaurante de médio porte no centro de Criciúma" é melhor que só "Qualifica".' },
  { icon: "refresh-cw", title: "Use o botão de regenerar",        desc: "Se a resposta da JADE não ficou do jeito que você queria, toque em 'Tentar novamente' para gerar uma nova versão com o mesmo comando." },
  { icon: "copy",       title: "Copie e personalize",             desc: "Scripts e mensagens são sugestões. Sempre personalize antes de enviar ao lead — adicione o nome do responsável e detalhes específicos do negócio." },
  { icon: "calendar",   title: "Revise o relatório diário",       desc: "Acesse o relatório diário toda manhã para planejar suas prioridades. A JADE sugere quais leads merece atenção com base no histórico." },
];

export default function TreinamentoScreen() {
  const router  = useRouter();
  const insets  = useSafeAreaInsets();
  const colors  = useColors();

  const topPad = Platform.OS === "web" ? 24 : insets.top + 4;
  const botPad = Platform.OS === "web" ? 40 : insets.bottom + 32;

  return (
    <View style={[S.root, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[S.header, { paddingTop: topPad }]}>
        <TouchableOpacity onPress={() => router.back()} style={S.backBtn} activeOpacity={0.7}>
          <Feather name="chevron-left" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={[S.headerTitle, { color: colors.text }]}>Treinamento da JADE</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        contentContainerStyle={[S.scroll, { paddingBottom: botPad }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <View style={S.hero}>
          <View style={[S.heroIcon, { backgroundColor: PINK + "18" }]}>
            <MaterialCommunityIcons name="robot" size={32} color={PINK} />
          </View>
          <Text style={[S.heroTitle, { color: colors.text }]}>Aprenda a usar a JADE</Text>
          <Text style={[S.heroSub, { color: colors.mutedForeground }]}>
            Descubra como ativar cada módulo e tirar o máximo da sua IA de vendas.
          </Text>
        </View>

        {/* Módulos */}
        <Text style={[S.sectionLabel, { color: colors.mutedForeground }]}>COMO ATIVAR OS MÓDULOS</Text>
        <View style={S.moduleGrid}>
          {MODULES.map((mod, i) => (
            <View key={i} style={[S.moduleCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={[S.moduleIconBox, { backgroundColor: mod.color + "1A" }]}>
                <Feather name={mod.icon as any} size={20} color={mod.color} />
              </View>
              <Text style={[S.moduleName, { color: colors.text }]}>{mod.name}</Text>
              <Text style={[S.moduleDesc, { color: colors.mutedForeground }]}>{mod.desc}</Text>
            </View>
          ))}
        </View>

        {/* Comandos rápidos */}
        <Text style={[S.sectionLabel, { color: colors.mutedForeground, marginTop: 8 }]}>COMANDOS RÁPIDOS</Text>
        <View style={[S.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[S.cardDesc, { color: colors.mutedForeground }]}>
            Os chips de atalho aparecem na tela do chat JADE. Toque em qualquer um para executar a ação instantaneamente.
          </Text>
          {SHORTCUTS.map((s, i) => (
            <View key={i} style={[S.shortcutRow, i < SHORTCUTS.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border }]}>
              <View style={[S.chipPreview, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Text style={[S.chipText, { color: colors.text }]}>{s.chip}</Text>
              </View>
              <Text style={[S.shortcutDesc, { color: colors.mutedForeground }]}>{s.desc}</Text>
            </View>
          ))}
        </View>

        {/* Dicas */}
        <Text style={[S.sectionLabel, { color: colors.mutedForeground, marginTop: 8 }]}>DICAS DE USO</Text>
        {TIPS.map((tip, i) => (
          <View key={i} style={[S.tipCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[S.tipIconBox, { backgroundColor: PINK + "18" }]}>
              <Feather name={tip.icon as any} size={18} color={PINK} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[S.tipTitle, { color: colors.text }]}>{tip.title}</Text>
              <Text style={[S.tipDesc, { color: colors.mutedForeground }]}>{tip.desc}</Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const S = StyleSheet.create({
  root:   { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingBottom: 16 },
  backBtn:     { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 17, fontFamily: "SpaceGrotesk_700Bold" },
  scroll: { paddingHorizontal: 16, paddingTop: 8 },

  hero:      { alignItems: "center", paddingVertical: 28, gap: 10 },
  heroIcon:  { width: 72, height: 72, borderRadius: 36, alignItems: "center", justifyContent: "center", marginBottom: 4 },
  heroTitle: { fontSize: 20, fontFamily: "SpaceGrotesk_700Bold", textAlign: "center" },
  heroSub:   { fontSize: 13, fontFamily: "SpaceGrotesk_400Regular", textAlign: "center", lineHeight: 20 },

  sectionLabel: { fontSize: 11, fontFamily: "SpaceGrotesk_600SemiBold", letterSpacing: 0.8, marginBottom: 12 },

  moduleGrid: { gap: 10, marginBottom: 24 },
  moduleCard: { borderRadius: 14, borderWidth: 1, padding: 16, gap: 8 },
  moduleIconBox: { width: 40, height: 40, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  moduleName: { fontSize: 14, fontFamily: "SpaceGrotesk_700Bold" },
  moduleDesc: { fontSize: 13, fontFamily: "SpaceGrotesk_400Regular", lineHeight: 18 },

  card:        { borderRadius: 14, borderWidth: 1, padding: 16, gap: 4, marginBottom: 24 },
  cardDesc:    { fontSize: 13, fontFamily: "SpaceGrotesk_400Regular", lineHeight: 18, marginBottom: 12 },
  shortcutRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 11 },
  chipPreview: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, minWidth: 100, alignItems: "center" },
  chipText:    { fontSize: 12, fontFamily: "SpaceGrotesk_600SemiBold" },
  shortcutDesc:{ flex: 1, fontSize: 13, fontFamily: "SpaceGrotesk_400Regular", lineHeight: 18 },

  tipCard:    { flexDirection: "row", gap: 14, borderRadius: 14, borderWidth: 1, padding: 16, marginBottom: 10, alignItems: "flex-start" },
  tipIconBox: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center", marginTop: 1 },
  tipTitle:   { fontSize: 14, fontFamily: "SpaceGrotesk_700Bold", marginBottom: 4 },
  tipDesc:    { fontSize: 13, fontFamily: "SpaceGrotesk_400Regular", lineHeight: 18 },
});
