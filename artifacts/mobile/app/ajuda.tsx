import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Linking,
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

const FAQS = [
  {
    q: "Como funciona o sistema de créditos?",
    a: "Cada ação realizada pela IA consome créditos. Uma qualificação de lead consome 5 créditos, um laudo executivo consome 20 créditos, e um script completo de vendas consome 10 créditos. Seu plano Pro inclui 1.000 créditos/mês, que renovam automaticamente no ciclo de cobrança. Créditos não utilizados não acumulam para o próximo mês.",
  },
  {
    q: "Como qualificar um lead?",
    a: "Na aba Leads, toque em qualquer lead para abrir o perfil. Em seguida, toque em 'Qualificar com IA'. A JADE irá analisar o perfil do estabelecimento, gerar um score de 0 a 100 e sugerir a melhor abordagem. Você também pode qualificar leads diretamente pelo Scanner Radar após encontrar novos estabelecimentos.",
  },
  {
    q: "Como usar o Scanner Radar?",
    a: "O Scanner Radar encontra estabelecimentos próximos usando o Google Maps. Acesse a aba Radar ou vá em Mais → Scanner Radar. Toque no botão de mira central para iniciar a busca. Você pode filtrar por tipo de negócio (restaurantes, salões, academias, etc.) e raio de distância. Os resultados aparecem no mapa e na lista abaixo.",
  },
  {
    q: "Como gerar um laudo executivo?",
    a: "O laudo executivo é um relatório completo de marketing e vendas para um lead específico. Acesse o perfil do lead → toque em 'Laudo Executivo'. A JADE irá analisar o negócio, identificar oportunidades de melhoria e gerar um documento profissional que pode ser enviado ao prospect como parte da sua abordagem comercial.",
  },
  {
    q: "Como usar o Módulo de Marketing?",
    a: "Acesse Mais → Marketing IA. Escolha o tipo de conteúdo: Post para Instagram, Story, Mensagem de WhatsApp ou E-mail de prospecção. Informe o nicho e as características do lead. A JADE gera o conteúdo pronto para uso. Você pode editar, copiar ou compartilhar diretamente do app.",
  },
  {
    q: "Como funciona o briefing pré-reunião?",
    a: "Antes de uma reunião com um prospect, acesse o perfil do lead e toque em 'Briefing Pré-Reunião'. A JADE irá resumir as informações mais importantes do negócio, sugerir perguntas estratégicas, antecipar objeções prováveis e preparar os melhores argumentos de venda para aquele perfil específico.",
  },
  {
    q: "Como entrar em contato com o suporte?",
    a: "Você pode falar com nossa equipe diretamente pelo WhatsApp (botão abaixo), pelo e-mail suporte@jadeia.com.br, ou abrindo um ticket em jadeia.com.br/suporte. O suporte Pro tem tempo de resposta de até 4 horas em dias úteis.",
  },
];

function AccordionItem({
  item, isOpen, onToggle, colors,
}: {
  item: typeof FAQS[0]; isOpen: boolean; onToggle: () => void; colors: any;
}) {
  return (
    <View style={[A.item, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <TouchableOpacity style={A.question} onPress={onToggle} activeOpacity={0.7}>
        <Text style={[A.questionText, { color: colors.text }]}>{item.q}</Text>
        <Feather
          name={isOpen ? "chevron-up" : "chevron-down"}
          size={18}
          color={isOpen ? PINK : colors.mutedForeground}
        />
      </TouchableOpacity>
      {isOpen && (
        <View style={[A.answer, { borderTopColor: colors.border }]}>
          <Text style={[A.answerText, { color: colors.mutedForeground }]}>{item.a}</Text>
        </View>
      )}
    </View>
  );
}

const A = StyleSheet.create({
  item:         { borderRadius: 14, borderWidth: 1, marginBottom: 10, overflow: "hidden" },
  question:     { flexDirection: "row", alignItems: "center", paddingHorizontal: 18, paddingVertical: 16, gap: 12 },
  questionText: { flex: 1, fontSize: 14, fontFamily: "SpaceGrotesk_600SemiBold", lineHeight: 20 },
  answer:       { paddingHorizontal: 18, paddingBottom: 18, borderTopWidth: StyleSheet.hairlineWidth, paddingTop: 14 },
  answerText:   { fontSize: 13, fontFamily: "SpaceGrotesk_400Regular", lineHeight: 20 },
});

export default function AjudaScreen() {
  const router  = useRouter();
  const insets  = useSafeAreaInsets();
  const colors  = useColors();
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const topPad = Platform.OS === "web" ? 24 : insets.top + 4;
  const botPad = Platform.OS === "web" ? 40 : insets.bottom + 32;

  const handleWhatsApp = () => {
    const msg = encodeURIComponent("Olá! Preciso de ajuda com a JADE IA. Minha conta: ");
    Linking.openURL(`https://wa.me/5548999990000?text=${msg}`);
  };

  return (
    <View style={[S.root, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[S.header, { paddingTop: topPad }]}>
        <TouchableOpacity onPress={() => router.back()} style={S.backBtn} activeOpacity={0.7}>
          <Feather name="chevron-left" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={[S.headerTitle, { color: colors.text }]}>Central de Ajuda</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        contentContainerStyle={[S.scroll, { paddingBottom: botPad }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <View style={S.hero}>
          <View style={[S.heroIcon, { backgroundColor: PINK + "18" }]}>
            <Feather name="help-circle" size={28} color={PINK} />
          </View>
          <Text style={[S.heroTitle, { color: colors.text }]}>Como podemos ajudar?</Text>
          <Text style={[S.heroSub, { color: colors.mutedForeground }]}>
            Respostas para as dúvidas mais frequentes sobre a JADE IA.
          </Text>
        </View>

        <Text style={[S.sectionLabel, { color: colors.mutedForeground }]}>PERGUNTAS FREQUENTES</Text>

        {FAQS.map((faq, i) => (
          <AccordionItem
            key={i}
            item={faq}
            colors={colors}
            isOpen={openIndex === i}
            onToggle={() => setOpenIndex(openIndex === i ? null : i)}
          />
        ))}

        {/* Support card */}
        <View style={[S.supportCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={S.supportRow}>
            <View style={[S.supportIcon, { backgroundColor: PINK + "18" }]}>
              <Feather name="message-circle" size={22} color={PINK} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[S.supportTitle, { color: colors.text }]}>Ainda com dúvidas?</Text>
              <Text style={[S.supportSub, { color: colors.mutedForeground }]}>
                Nossa equipe responde em até 4h em dias úteis.
              </Text>
            </View>
          </View>
          <TouchableOpacity style={S.whatsappBtn} onPress={handleWhatsApp} activeOpacity={0.85}>
            <Feather name="message-square" size={18} color="#fff" />
            <Text style={S.whatsappBtnText}>Falar com suporte via WhatsApp</Text>
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
  scroll: { paddingHorizontal: 16, paddingTop: 8 },

  hero:      { alignItems: "center", paddingVertical: 28, gap: 8 },
  heroIcon:  { width: 64, height: 64, borderRadius: 32, alignItems: "center", justifyContent: "center", marginBottom: 4 },
  heroTitle: { fontSize: 20, fontFamily: "SpaceGrotesk_700Bold", textAlign: "center" },
  heroSub:   { fontSize: 13, fontFamily: "SpaceGrotesk_400Regular", textAlign: "center", lineHeight: 20 },

  sectionLabel: { fontSize: 11, fontFamily: "SpaceGrotesk_600SemiBold", letterSpacing: 0.8, marginBottom: 12 },

  supportCard:  { borderRadius: 14, borderWidth: 1, padding: 20, marginTop: 8, gap: 16 },
  supportRow:   { flexDirection: "row", alignItems: "center", gap: 14 },
  supportIcon:  { width: 48, height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center" },
  supportTitle: { fontSize: 15, fontFamily: "SpaceGrotesk_700Bold" },
  supportSub:   { fontSize: 13, fontFamily: "SpaceGrotesk_400Regular", marginTop: 2 },
  whatsappBtn:  {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10,
    backgroundColor: PINK, height: 50, borderRadius: 12,
  },
  whatsappBtnText: { fontSize: 14, fontFamily: "SpaceGrotesk_700Bold", color: "#fff" },
});
