import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useJADE } from "@/hooks/useJADE";

const API_BASE =
  Platform.OS === "web"
    ? ""
    : `https://${process.env.EXPO_PUBLIC_DOMAIN ?? ""}`;

const ETAPAS = [
  {
    id: "abertura",
    num: "01",
    title: "Abertura",
    icon: "sunrise",
    color: "#FF0080",
    desc: "Como se apresentar, quebrar o gelo e criar rapport inicial",
    steps: [
      "Chame pelo nome desde o primeiro contato — nunca 'Olá, tudo bem?'",
      "Mencione uma referência real do negócio: avaliações, tempo de casa, localização visível",
      "Gancho de curiosidade: levante uma dor ou oportunidade sem revelar o preço",
      "Termine com uma pergunta de resposta fácil (sim/não ou escolha simples)",
    ],
    example: "\"Fala, [NOME]! Vi que o [NEGÓCIO] tem ótimas avaliações no Google — vocês já recebem muita procura por delivery ou ainda é mais presencial?\"",
  },
  {
    id: "qualificacao",
    num: "02",
    title: "Qualificação SPIN",
    icon: "search",
    color: "#FF0080",
    desc: "Perguntas que revelam a dor real antes de qualquer proposta",
    steps: [
      "Situação: Como é o processo atual de vendas/captação de clientes?",
      "Problema: Qual é o maior desafio que vocês enfrentam hoje com [área relevante]?",
      "Implicação: O que acontece se isso não for resolvido nos próximos meses?",
      "Necessidade: Se você pudesse resolver só uma coisa agora, qual seria?",
      "Registre as respostas no CRM antes de avançar",
    ],
    example: "\"E hoje vocês perdem muitos clientes por falta de divulgação, ou o problema é mais na conversão?\"",
  },
  {
    id: "apresentacao",
    num: "03",
    title: "Apresentação",
    icon: "monitor",
    color: "#FF0080",
    desc: "Apresentar a solução conectada diretamente às dores identificadas",
    steps: [
      "Comece repetindo a dor que o prospect disse: 'Você mencionou que o maior desafio é...'",
      "Mostre como o produto/serviço resolve ESSA dor específica — não faça pitch genérico",
      "Use dados concretos quando disponível (números, resultados de clientes similares)",
      "Um diferencial por vez — não empilhe argumentos",
      "Pause e pergunte: 'Isso faz sentido para o que vocês precisam?'",
    ],
    example: "\"Baseado no que você me contou sobre [dor], o que fazemos é [solução específica]. Outros clientes do seu segmento conseguiram [resultado concreto].\"",
  },
  {
    id: "objecoes",
    num: "04",
    title: "Objeções",
    icon: "shield",
    color: "rgba(255,255,255,0.55)",
    desc: "Respostas prontas para as 5 objeções mais comuns",
    steps: [
      "\"Está caro\" → Valide: 'Faz sentido querer ter certeza do retorno.' Depois mostre o custo de não fazer.",
      "\"Preciso pensar\" → Descubra o que está impedindo: 'O que faria você ter mais certeza hoje?'",
      "\"Já tenho um fornecedor\" → 'Ótimo! O que você mais valoriza nele? Tem algo que falta?' (encontre a brecha)",
      "\"Não é o momento\" → 'Entendo. Quando seria o momento ideal? O que precisaria acontecer antes?'",
      "\"Manda mais informações\" → 'Claro! Mas para mandar o que é mais relevante pra você, me conta: qual é a prioridade hoje?'",
    ],
    example: "\"Faz todo sentido querer avaliar com calma. O que eu posso te contar é que [prova social ou dado concreto]. O que te faria ter mais segurança para avançar?\"",
  },
  {
    id: "fechamento",
    num: "05",
    title: "Fechamento",
    icon: "check-circle",
    color: "#FF0080",
    desc: "Técnicas de fechamento e definição de próximos passos",
    steps: [
      "Leia os sinais de compra: perguntas sobre prazo, implementação, garantia",
      "Fechamento por próximo passo: 'Quer que eu prepare a proposta para [data específica]?'",
      "Fechamento por resumo: recapitule os pontos acordados antes de pedir decisão",
      "Se não fechar: defina SEMPRE um próximo passo concreto com data",
      "Nunca saia de uma conversa sem um compromisso, mesmo que seja 'falo com você na quinta'",
    ],
    example: "\"Pelo que conversamos, parece que faz muito sentido para vocês. Quer que eu já prepare o contrato/proposta para você analisar? Consigo enviar ainda hoje.\"",
  },
];

export default function RoteiroScreen() {
  const colors  = useColors();
  const insets  = useSafeAreaInsets();
  const router  = useRouter();
  const topPad  = Platform.OS === "web" ? 24 : insets.top + 4;

  const [open, setOpen] = useState<string | null>(null);
  const { loading, error, result, success, generate } = useJADE();

  const toggle = (id: string) => setOpen((prev) => prev === id ? null : id);

  const gerar = async () => {
    let contexto = "Empresa não configurada. Use contexto genérico de vendas B2B.";
    try {
      const empresaRes = await fetch(`${API_BASE}/api/empresa`);
      if (empresaRes.ok) {
        const empresaData = await empresaRes.json();
        const cfg = empresaData.config;
        if (cfg?.nome) {
          contexto = `Empresa: ${cfg.nome}. Produto/serviço: ${cfg.produto || "não informado"}. Segmento: ${cfg.segmento || "B2B"}. Planos: ${cfg.planos || "ver catálogo"}.`;
        }
      }
    } catch {}
    await generate(`Você é a JADE, especialista em vendas. Gere um roteiro de vendas completo e personalizado.\n\nContexto: ${contexto}\n\nO roteiro deve cobrir as 5 etapas: Abertura, Qualificação (SPIN), Apresentação, Objeções e Fechamento. Para cada etapa forneça: script pronto para usar, adaptado ao produto/serviço e segmento. Use linguagem brasileira natural e direta.`);
  };

  return (
    <View style={[S.root, { backgroundColor: colors.background }]}>
      <View style={[S.header, { paddingTop: topPad, borderBottomColor: colors.border }]}>
        <TouchableOpacity style={S.backBtn} onPress={() => router.back()} activeOpacity={0.8}>
          <Feather name="chevron-left" size={22} color={colors.text} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={[S.headerTitle, { color: colors.text }]}>Roteiro de Vendas</Text>
          <Text style={[S.headerSub, { color: colors.mutedForeground }]}>Do contato ao fechamento</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        <View style={S.intro}>
          <View style={[S.introBadge, { backgroundColor: colors.primary + "18", borderColor: colors.primary + "40" }]}>
            <Feather name="zap" size={14} color={colors.primary} />
            <Text style={[S.introBadgeText, { color: colors.primary }]}>5 etapas do ciclo completo</Text>
          </View>
          <Text style={[S.introText, { color: colors.mutedForeground }]}>
            Toque em cada etapa para ver o script completo. Use o botão abaixo para gerar um roteiro personalizado com os dados da sua empresa.
          </Text>
        </View>

        <View style={S.etapas}>
          {ETAPAS.map((e) => {
            const isOpen = open === e.id;
            return (
              <TouchableOpacity
                key={e.id}
                style={[S.card, { backgroundColor: colors.card, borderColor: isOpen ? e.color + "60" : colors.border }]}
                onPress={() => toggle(e.id)}
                activeOpacity={0.85}
              >
                <View style={S.cardHeader}>
                  <View style={[S.numBadge, { backgroundColor: e.color + "20" }]}>
                    <Text style={[S.numText, { color: e.color }]}>{e.num}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[S.cardTitle, { color: colors.text }]}>{e.title}</Text>
                    <Text style={[S.cardDesc, { color: colors.mutedForeground }]}>{e.desc}</Text>
                  </View>
                  <Feather name={isOpen ? "chevron-up" : "chevron-down"} size={18} color={colors.mutedForeground} />
                </View>

                {isOpen && (
                  <View style={S.cardBody}>
                    <View style={[S.divider, { backgroundColor: e.color + "30" }]} />
                    <Text style={[S.stepsLabel, { color: e.color }]}>PASSOS</Text>
                    {e.steps.map((step, i) => (
                      <View key={i} style={S.stepRow}>
                        <View style={[S.stepDot, { backgroundColor: e.color }]} />
                        <Text style={[S.stepText, { color: colors.text }]}>{step}</Text>
                      </View>
                    ))}
                    <View style={[S.exampleBox, { backgroundColor: e.color + "10", borderColor: e.color + "30" }]}>
                      <Text style={[S.exampleLabel, { color: e.color }]}>EXEMPLO PRONTO</Text>
                      <Text style={[S.exampleText, { color: colors.text }]}>{e.example}</Text>
                    </View>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={S.genSection}>
          <TouchableOpacity
            style={[S.genBtn, loading && { opacity: 0.7 }, success && { backgroundColor: "rgba(255,255,255,0.55)" }]}
            onPress={gerar}
            activeOpacity={0.85}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : success
                ? <><Feather name="check" size={18} color="#fff" /><Text style={S.genBtnText}>Roteiro Gerado!</Text></>
                : <><Feather name="cpu" size={18} color="#fff" /><Text style={S.genBtnText}>Gerar Roteiro Personalizado</Text></>}
          </TouchableOpacity>

          {!!error && (
            <View style={S.errorBox}>
              <Feather name="alert-circle" size={14} color="#FF0080" />
              <Text style={S.errorText}>{error}</Text>
            </View>
          )}

          {!!result && (
            <View style={[S.resultBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={S.resultHeader}>
                <View style={S.resultBadge}>
                  <View style={[S.greenDot, { backgroundColor: colors.success }]} />
                  <Text style={[S.resultLabel, { color: colors.success }]}>Roteiro gerado pela JADE</Text>
                </View>
              </View>
              <Text style={[S.resultText, { color: colors.text }]}>{result}</Text>
            </View>
          )}
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
  backBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: "rgba(255,255,255,0.08)", borderWidth: 1, borderColor: "rgba(255,255,255,0.12)", alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 18, fontFamily: "SpaceGrotesk_700Bold" },
  headerSub: { fontSize: 13, fontFamily: "SpaceGrotesk_400Regular", marginTop: 2 },
  intro: { padding: 20, gap: 12 },
  introBadge: { flexDirection: "row", alignItems: "center", gap: 8, alignSelf: "flex-start", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1 },
  introBadgeText: { fontSize: 13, fontFamily: "SpaceGrotesk_600SemiBold" },
  introText: { fontSize: 16, fontFamily: "SpaceGrotesk_400Regular", lineHeight: 22 },
  etapas: { paddingHorizontal: 16, gap: 10 },
  card: { borderRadius: 16, borderWidth: 1, padding: 16 },
  cardHeader: { flexDirection: "row", alignItems: "center", gap: 14 },
  numBadge: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  numText: { fontSize: 16, fontFamily: "SpaceGrotesk_700Bold" },
  cardTitle: { fontSize: 16, fontFamily: "SpaceGrotesk_700Bold" },
  cardDesc: { fontSize: 13, fontFamily: "SpaceGrotesk_400Regular", marginTop: 2 },
  cardBody: { marginTop: 14, gap: 10 },
  divider: { height: 1 },
  stepsLabel: { fontSize: 10, fontFamily: "SpaceGrotesk_700Bold", letterSpacing: 1, marginTop: 4 },
  stepRow: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  stepDot: { width: 6, height: 6, borderRadius: 3, marginTop: 7, flexShrink: 0 },
  stepText: { flex: 1, fontSize: 15, fontFamily: "SpaceGrotesk_400Regular", lineHeight: 20 },
  exampleBox: { borderRadius: 10, borderWidth: 1, padding: 12, gap: 6, marginTop: 4 },
  exampleLabel: { fontSize: 10, fontFamily: "SpaceGrotesk_700Bold", letterSpacing: 1 },
  exampleText: { fontSize: 15, fontFamily: "SpaceGrotesk_400Regular", lineHeight: 20, fontStyle: "italic" },
  genSection: { padding: 20, gap: 16 },
  genBtn: {
    backgroundColor: "#FF0080", flexDirection: "row", alignItems: "center",
    justifyContent: "center", gap: 10, height: 52, borderRadius: 14,
    shadowColor: "#FF0080", shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 10, elevation: 6,
  },
  genBtnText: { fontSize: 16, fontFamily: "SpaceGrotesk_700Bold", color: "#fff" },
  resultBox: { borderRadius: 14, borderWidth: 1, padding: 16, gap: 14 },
  resultHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  resultBadge: { flexDirection: "row", alignItems: "center", gap: 6 },
  greenDot: { width: 7, height: 7, borderRadius: 4 },
  resultLabel: { fontSize: 13, fontFamily: "SpaceGrotesk_600SemiBold" },
  resultText: { fontSize: 16, fontFamily: "SpaceGrotesk_400Regular", lineHeight: 22 },
  errorBox: { flexDirection: "row", alignItems: "center", gap: 8, padding: 12, borderRadius: 10, backgroundColor: "#FF008018", borderWidth: 1, borderColor: "#FF008040" },
  errorText: { flex: 1, fontSize: 15, fontFamily: "SpaceGrotesk_400Regular", color: "#FF0080", lineHeight: 20 },
});
