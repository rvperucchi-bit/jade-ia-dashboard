import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
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

interface Technique {
  id: string;
  icon: string;
  color: string;
  name: string;
  tag: string;
  summary: string;
  steps: string[];
  example: string;
}

const TECNICAS: Technique[] = [
  {
    id: "spin", icon: "target", color: "#FF0080", name: "SPIN Selling", tag: "Qualificação",
    summary: "Faça perguntas estratégicas antes de apresentar sua solução. Descubra a dor antes de oferecer o remédio.",
    steps: [
      "S — Situação: Como está o processo de vendas hoje?",
      "P — Problema: Quais são as maiores dificuldades?",
      "I — Implicação: O que isso custa ao negócio?",
      "N — Necessidade: O que seria ideal para resolver?",
    ],
    example: "\"Você usa algum sistema hoje? ... E como está a taxa deles? ... Isso impacta sua margem?\"",
  },
  {
    id: "aida", icon: "trending-up", color: "#FF0080", name: "AIDA", tag: "Abordagem",
    summary: "Estrutura clássica para capturar atenção e conduzir ao fechamento em qualquer canal.",
    steps: [
      "A — Atenção: Gancho que para o prospect",
      "I — Interesse: Dado ou benefício relevante",
      "D — Desejo: Conecte ao sonho/dor do cliente",
      "A — Ação: CTA claro e de baixo esforço",
    ],
    example: "\"Vi que tem 4,8 no Google (Atenção). Empresas como a sua crescem 30% com nossa solução (Interesse)...\"",
  },
  {
    id: "gatilhos", icon: "zap", color: "#FF0080", name: "Gatilhos Mentais", tag: "Persuasão",
    summary: "Use com critério. Gatilhos funcionam quando apoiados em fatos reais — nunca como manipulação.",
    steps: [
      "Escassez: \"Só temos 3 vagas abertas este mês\"",
      "Prova social: \"37 empresas já usam\" (dado real)",
      "Autoridade: Estatísticas do mercado",
      "Reciprocidade: Ofereça valor antes de pedir",
    ],
    example: "\"Estamos aceitando apenas mais 5 parceiros — para manter a qualidade do suporte.\"",
  },
  {
    id: "rapport", icon: "heart", color: "#FF0080", name: "Rapport", tag: "Conexão",
    summary: "Construa confiança genuína antes de vender. Pessoas compram de quem gostam e confiam.",
    steps: [
      "Espelhe o vocabulário e ritmo do cliente",
      "Mencione algo específico do negócio dele",
      "Encontre um ponto em comum (localidade, história)",
      "Ouça mais do que fala nos primeiros minutos",
    ],
    example: "\"Vi nas avaliações que vocês têm o melhor atendimento do bairro! Há quanto tempo estão aqui?\"",
  },
  {
    id: "objecoes", icon: "shield", color: "#FF0080", name: "Tratamento de Objeções", tag: "Fechamento",
    summary: "Acolha antes de responder. Nunca contradiga diretamente — redirecione com perguntas.",
    steps: [
      "\"Já tenho\" → Pergunte sobre a experiência atual",
      "\"Muito caro\" → Mostre o custo do problema atual",
      "\"Vou pensar\" → Identifique a objeção real",
      "\"Não é pra mim\" → Valide e use prova social do segmento",
    ],
    example: "\"Faz todo sentido querer pensar — é uma decisão importante. O que ainda ficou sem resposta?\"",
  },
  {
    id: "fechamento", icon: "check-circle", color: "#FF0080", name: "Técnicas de Fechamento", tag: "Fechamento",
    summary: "Leia os sinais de compra. Quando o interesse é genuíno, avance — não espere o cliente pedir.",
    steps: [
      "Pergunta alternativa: \"Prefere começar semana que vem ou já na segunda?\"",
      "Fechamento por assunção: \"Vou te mandar o contrato hoje\"",
      "Urgência real: Prazo de campanha, vagas limitadas",
      "Resumo de benefícios: Recapitule antes de pedir o sim",
    ],
    example: "\"Você mencionou que o custo atual incomoda. Quer que eu mande os detalhes para decidir ainda hoje?\"",
  },
  {
    id: "followup", icon: "refresh-cw", color: "#FF0080", name: "Follow-up Estratégico", tag: "Reativação",
    summary: "A maioria das vendas acontece no 5º contato. Não desista no primeiro silêncio.",
    steps: [
      "Dia 0: Primeira abordagem — gancho de curiosidade",
      "Dia 2: Follow-up com dado ou prova social nova",
      "Dia 5: Última tentativa — tom leve, deixa a porta aberta",
      "Dia 15: Reativação com novidade ou oferta especial",
    ],
    example: "\"Fala, [NOME]! Só passando com um dado relevante para empresas do seu segmento...\"",
  },
  {
    id: "social_proof", icon: "users", color: "#FF0080", name: "Prova Social", tag: "Credibilidade",
    summary: "Mostre que outros já decidiram e tiveram resultados. Reduza o risco percebido.",
    steps: [
      "Use números específicos (\"37 parceiros este trimestre\")",
      "Cite segmentos similares ao do lead",
      "Compartilhe histórias de sucesso (com permissão)",
      "Avaliações Google são prova social poderosa",
    ],
    example: "\"Temos 8 clientes no mesmo segmento — posso te conectar com um deles para contar a experiência.\"",
  },
];

export default function BibliotecaScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const [open, setOpen] = useState<string | null>(null);

  const toggle = (id: string) => setOpen((prev) => (prev === id ? null : id));

  return (
    <View style={[S.root, { backgroundColor: colors.background }]}>
      <View style={[S.header, { paddingTop: topPad, borderBottomColor: colors.border }]}>
        <TouchableOpacity
          style={[S.backBtn, { backgroundColor: colors.surface }]}
          onPress={() => router.back()}
          activeOpacity={0.8}
        >
          <Feather name="arrow-left" size={20} color={colors.text} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={[S.headerTitle, { color: colors.text }]}>Biblioteca de Técnicas</Text>
          <Text style={[S.headerSub, { color: colors.mutedForeground }]}>SPIN, AIDA, Gatilhos e mais</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        <View style={S.intro}>
          <View style={[S.badge, { backgroundColor: "rgba(255,0,128,0.07)", borderColor: "rgba(255,0,128,0.25)" }]}>
            <Feather name="book-open" size={14} color="#FF0080" />
            <Text style={[S.badgeText, { color: "#FF0080" }]}>8 técnicas de vendas</Text>
          </View>
          <Text style={[S.introText, { color: colors.mutedForeground }]}>
            Técnicas testadas e validadas. Toque em cada uma para ver os passos e exemplos prontos para usar.
          </Text>
        </View>

        <View style={S.list}>
          {TECNICAS.map((t) => {
            const isOpen = open === t.id;
            return (
              <TouchableOpacity
                key={t.id}
                style={[S.card, { backgroundColor: colors.card, borderColor: isOpen ? t.color + "60" : colors.border }]}
                onPress={() => toggle(t.id)}
                activeOpacity={0.85}
              >
                <View style={S.cardTop}>
                  <View style={[S.iconBox, { backgroundColor: t.color + "20" }]}>
                    <Feather name={t.icon as any} size={18} color={t.color} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={S.nameRow}>
                      <Text style={[S.cardName, { color: colors.text }]}>{t.name}</Text>
                      <View style={[S.tag, { backgroundColor: t.color + "20" }]}>
                        <Text style={[S.tagText, { color: t.color }]}>{t.tag}</Text>
                      </View>
                    </View>
                    <Text style={[S.cardSummary, { color: colors.mutedForeground }]} numberOfLines={isOpen ? undefined : 2}>
                      {t.summary}
                    </Text>
                  </View>
                  <Feather name={isOpen ? "chevron-up" : "chevron-down"} size={16} color={colors.mutedForeground} />
                </View>

                {isOpen && (
                  <View style={S.cardBody}>
                    <View style={[S.divider, { backgroundColor: t.color + "30" }]} />
                    <Text style={[S.stepsLabel, { color: t.color }]}>PASSOS</Text>
                    {t.steps.map((step, i) => (
                      <View key={i} style={S.stepRow}>
                        <View style={[S.stepDot, { backgroundColor: t.color }]} />
                        <Text style={[S.stepText, { color: colors.text }]}>{step}</Text>
                      </View>
                    ))}
                    <View style={[S.exampleBox, { backgroundColor: t.color + "10", borderColor: t.color + "30" }]}>
                      <Text style={[S.exampleLabel, { color: t.color }]}>EXEMPLO PRONTO</Text>
                      <Text style={[S.exampleText, { color: colors.text }]}>{t.example}</Text>
                    </View>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

const S = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: "row", alignItems: "center", gap: 14,
    paddingHorizontal: 20, paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 18, fontFamily: "SpaceGrotesk_700Bold" },
  headerSub: { fontSize: 13, fontFamily: "SpaceGrotesk_400Regular", marginTop: 2 },
  intro: { padding: 20, gap: 10 },
  badge: { flexDirection: "row", alignItems: "center", gap: 8, alignSelf: "flex-start", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1 },
  badgeText: { fontSize: 13, fontFamily: "SpaceGrotesk_600SemiBold" },
  introText: { fontSize: 16, fontFamily: "SpaceGrotesk_400Regular", lineHeight: 22 },
  list: { paddingHorizontal: 16, gap: 10, paddingBottom: 8 },
  card: { borderRadius: 16, borderWidth: 1, padding: 16 },
  cardTop: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  iconBox: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 4 },
  cardName: { fontSize: 15, fontFamily: "SpaceGrotesk_700Bold" },
  tag: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  tagText: { fontSize: 11, fontFamily: "SpaceGrotesk_600SemiBold" },
  cardSummary: { fontSize: 15, fontFamily: "SpaceGrotesk_400Regular", lineHeight: 19 },
  cardBody: { marginTop: 14, gap: 10 },
  divider: { height: 1 },
  stepsLabel: { fontSize: 10, fontFamily: "SpaceGrotesk_700Bold", letterSpacing: 1, marginTop: 4 },
  stepRow: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  stepDot: { width: 6, height: 6, borderRadius: 3, marginTop: 7, flexShrink: 0 },
  stepText: { flex: 1, fontSize: 15, fontFamily: "SpaceGrotesk_400Regular", lineHeight: 20 },
  exampleBox: { borderRadius: 10, borderWidth: 1, padding: 12, gap: 6, marginTop: 4 },
  exampleLabel: { fontSize: 10, fontFamily: "SpaceGrotesk_700Bold", letterSpacing: 1 },
  exampleText: { fontSize: 15, fontFamily: "SpaceGrotesk_400Regular", lineHeight: 20, fontStyle: "italic" },
});
