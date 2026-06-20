import { Feather } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
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
import { useApp, type MarketingCampaign } from "@/context/AppContext";

const API_BASE =
  Platform.OS === "web"
    ? ""
    : `https://${process.env.EXPO_PUBLIC_DOMAIN ?? ""}`;

// ─── Content type definitions ─────────────────────────────────────────────────
interface ContentType {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  placeholder: string;
  systemContext: string;
  channel: string;
}

const GERAR_TYPES: ContentType[] = [
  {
    id: "instagram_post", title: "Post Instagram", description: "Legenda com CTA e hashtags",
    icon: "instagram", color: "#E1306C", channel: "Instagram",
    placeholder: "Descreva o assunto do post: promoção, produto, evento...",
    systemContext: "Crie uma legenda profissional para Instagram. Use emojis estrategicamente, inclua CTA claro e hashtags relevantes (máx 15). Tom: próximo e autêntico. Máximo 150 palavras.",
  },
  {
    id: "story", title: "Story", description: "Texto direto para Stories",
    icon: "image", color: "#FF6B35", channel: "Instagram Stories",
    placeholder: "Tema do story: urgência, bastidores, oferta relâmpago...",
    systemContext: "Crie um roteiro de texto para Story do Instagram. Máximo 3 frames. Cada frame: texto curto, impactante. Use linguagem jovem e direta. Inclua sugestão de sticker ou enquete.",
  },
  {
    id: "whatsapp", title: "WhatsApp Broadcast", description: "Mensagem para lista de transmissão",
    icon: "message-circle", color: "#25D366", channel: "WhatsApp",
    placeholder: "Contexto da mensagem: oferta, novidade, lembrete...",
    systemContext: "Crie uma mensagem de WhatsApp para broadcast. Máximo 4 linhas. Use [NOME] para personalização. Tom: informal, direto. Termine com pergunta ou CTA de resposta fácil.",
  },
  {
    id: "tiktok", title: "Roteiro TikTok", description: "Script para vídeo de até 60s",
    icon: "video", color: "#FF0050", channel: "TikTok",
    placeholder: "Tema do vídeo: tutorial, bastidores, depoimento...",
    systemContext: "Crie um roteiro de TikTok. Duração: 30-60 segundos. Estrutura: gancho (0-3s), desenvolvimento, CTA final. Inclua: falas, texto na tela, música sugerida. Tom: autêntico, trends.",
  },
  {
    id: "google_review", title: "Responder Avaliação", description: "Resposta profissional a review Google",
    icon: "star", color: "#FFB300", channel: "Google Reviews",
    placeholder: "Cole aqui a avaliação do cliente que deseja responder...",
    systemContext: "Você é gerente de relacionamento. Escreva uma resposta profissional e calorosa para a avaliação. Se positiva: agradeça e reforce o diferencial. Se negativa: acolha, peça desculpas sem admitir culpa, ofereça solução. Máximo 3 linhas.",
  },
];

const POSTS_TYPES: ContentType[] = [
  {
    id: "linkedin_post", title: "Post LinkedIn", description: "Conteúdo profissional com storytelling",
    icon: "linkedin", color: "#0077B5", channel: "LinkedIn",
    placeholder: "Tema: conquista, aprendizado, insight de negócio...",
    systemContext: "Crie um post de LinkedIn impactante. Estrutura: gancho forte na 1ª linha (sem 'Hoje aprendi'), desenvolvimento com storytelling pessoal ou profissional, CTA genuíno. Tom: autêntico, inspirador, sem corporativês. Máximo 250 palavras. Use quebras de linha para legibilidade.",
  },
  {
    id: "instagram_carousel", title: "Carrossel Instagram", description: "Roteiro de slides educativos",
    icon: "layers", color: "#833AB4", channel: "Instagram Carrossel",
    placeholder: "Tema do carrossel: dica, lista, tutorial, processo...",
    systemContext: "Crie um roteiro de carrossel do Instagram. Slide 1: título forte que para o scroll. Slides 2-7: conteúdo em tópicos curtos (máx 30 palavras por slide). Último slide: CTA claro. Inclua sugestão de visual para cada slide.",
  },
  {
    id: "x_post", title: "Post X (Twitter)", description: "Thread ou post único impactante",
    icon: "twitter", color: "#1DA1F2", channel: "X / Twitter",
    placeholder: "Assunto: opinião, insight, notícia do seu mercado...",
    systemContext: "Crie um post para X (Twitter). Opção 1: post único de até 280 caracteres com gancho forte. Opção 2: thread de 3-5 tweets numerados. Tom: direto, opinativo, sem rodeios. Use dados ou exemplos concretos quando possível.",
  },
  {
    id: "whatsapp_status", title: "Status WhatsApp", description: "Conteúdo visual para Status",
    icon: "circle", color: "#25D366", channel: "WhatsApp Status",
    placeholder: "Tema do status: promoção relâmpago, novidade, bastidor...",
    systemContext: "Crie um roteiro de Status do WhatsApp. Máximo 5 slides. Cada slide: texto muito curto (máx 15 palavras), emoji relevante, cor de fundo sugerida. Tom: urgente, informal, visual. Foque em engajamento e resposta imediata.",
  },
];

const TRAFEGO_TYPES: ContentType[] = [
  {
    id: "google_ads_title", title: "Títulos Google Ads", description: "Headlines para campanhas de busca",
    icon: "search", color: "#4285F4", channel: "Google Ads",
    placeholder: "Produto/serviço, palavra-chave principal, diferencial...",
    systemContext: "Crie 5 títulos para Google Ads (máx 30 caracteres cada). Regras: inclua a palavra-chave principal, destaque o benefício ou diferencial, use números quando possível, crie urgência sutil. Forneça também 3 descrições (máx 90 caracteres cada) com CTA claro.",
  },
  {
    id: "meta_ads_copy", title: "Copy Meta Ads", description: "Texto para Facebook e Instagram Ads",
    icon: "facebook", color: "#1877F2", channel: "Meta Ads",
    placeholder: "Produto, público-alvo, oferta, objetivo da campanha...",
    systemContext: "Crie uma copy completa para Meta Ads. Estrutura: AIDA (Atenção, Interesse, Desejo, Ação). Headline: máx 40 caracteres. Corpo do anúncio: máx 125 caracteres (preview). Texto completo: até 300 palavras. Inclua também 3 variações de headline para teste A/B.",
  },
  {
    id: "cta_variations", title: "Variações de CTA", description: "Botões e chamadas para ação",
    icon: "mouse-pointer", color: "#FF0080", channel: "Múltiplos canais",
    placeholder: "Objetivo: compra, cadastro, ligação, mensagem, download...",
    systemContext: "Crie 10 variações de CTA (Call to Action) para diferentes contextos. Categorize por: urgência (3 variações), benefício (3 variações), facilidade (2 variações), exclusividade (2 variações). Cada CTA: máx 5 palavras. Indique o melhor contexto de uso para cada um.",
  },
  {
    id: "email_marketing", title: "E-mail Marketing", description: "Campanha completa de e-mail",
    icon: "mail", color: "#FFB300", channel: "E-mail",
    placeholder: "Objetivo do e-mail: venda, nurturing, reativação, novidade...",
    systemContext: "Crie um e-mail de marketing completo. Assunto: 3 opções (máx 60 caracteres cada, inclua emoji em pelo menos um). Pré-header: 1 opção (máx 90 caracteres). Corpo: abertura personalizada, proposta de valor, prova social (placeholder), CTA claro. Tom: conversacional, focado no benefício do leitor.",
  },
];

// ─── Biblioteca de técnicas ───────────────────────────────────────────────────
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
      "S — Situação: Como está o processo de delivery hoje?",
      "P — Problema: Quais são as maiores dificuldades?",
      "I — Implicação: O que isso custa ao negócio?",
      "N — Necessidade: O que seria ideal para resolver?",
    ],
    example: "\"Você usa algum app de delivery hoje? ... E como está a taxa deles? ... Isso impacta sua margem?\"",
  },
  {
    id: "aida", icon: "trending-up", color: "#6C63FF", name: "AIDA", tag: "Abordagem",
    summary: "Estrutura clássica para capturar atenção e conduzir ao fechamento em qualquer canal.",
    steps: [
      "A — Atenção: Gancho que para o lojista",
      "I — Interesse: Dado ou benefício relevante",
      "D — Desejo: Conecte ao sonho/dor do lojista",
      "A — Ação: CTA claro e de baixo esforço",
    ],
    example: "\"Vi que tem 4,8 no Google (Atenção). Restaurantes como o seu faturam 30% a mais com entrega própria (Interesse)...\"",
  },
  {
    id: "gatilhos", icon: "zap", color: "#FFB300", name: "Gatilhos Mentais", tag: "Persuasão",
    summary: "Use com critério. Gatilhos funcionam quando apoiados em fatos reais — nunca como manipulação.",
    steps: [
      "Escassez: \"Só temos 3 vagas abertas em Criciúma\"",
      "Prova social: \"37 restaurantes já usam\" (dado real)",
      "Autoridade: Estatísticas do mercado de delivery",
      "Reciprocidade: Ofereça valor antes de pedir",
    ],
    example: "\"Estamos aceitando apenas mais 5 parceiros no bairro — para manter exclusividade de entrega rápida.\"",
  },
  {
    id: "rapport", icon: "heart", color: "#00D68F", name: "Rapport", tag: "Conexão",
    summary: "Construa confiança genuína antes de vender. Pessoas compram de quem gostam e confiam.",
    steps: [
      "Espelhe o vocabulário e ritmo do lojista",
      "Mencione algo específico do negócio dele",
      "Encontre um ponto em comum (localidade, história)",
      "Ouça mais do que fala nos primeiros minutos",
    ],
    example: "\"Vi nas avaliações que vocês têm o melhor açaí do bairro — o pessoal adora! Há quanto tempo estão aqui?\"",
  },
  {
    id: "objecoes", icon: "shield", color: "#4ECDC4", name: "Tratamento de Objeções", tag: "Fechamento",
    summary: "Acolha antes de responder. Nunca contradiga diretamente — redirecione com perguntas.",
    steps: [
      "\"Já tenho\" → Pergunte sobre a experiência atual",
      "\"Muito caro\" → Mostre o custo do problema atual",
      "\"Vou pensar\" → Identifique a objeção real",
      "\"Não é pra mim\" → Valide e use prova social do segmento",
    ],
    example: "\"Faz todo sentido querer pensar — é uma decisão importante. O que ainda ficou sem resposta para você?\"",
  },
  {
    id: "fechamento", icon: "check-circle", color: "#FF6B35", name: "Técnicas de Fechamento", tag: "Fechamento",
    summary: "Leia os sinais de compra. Quando o interesse é genuíno, avance — não espere o lojista pedir.",
    steps: [
      "Pergunta alternativa: \"Prefere começar semana que vem ou já na segunda?\"",
      "Fechamento por assunção: \"Vou te mandar o contrato hoje\"",
      "Urgência real: Prazo de campanha, vagas limitadas",
      "Resumo de benefícios: Recapitule antes de pedir o sim",
    ],
    example: "\"Você já mencionou que a taxa alta incomoda. Quer que eu te mande os detalhes para decidir ainda hoje?\"",
  },
  {
    id: "followup", icon: "refresh-cw", color: "#AB47BC", name: "Follow-up Estratégico", tag: "Reativação",
    summary: "A maioria das vendas acontece no 5º contato. Não desista no primeiro silêncio.",
    steps: [
      "Dia 0: Primeira abordagem — gancho de curiosidade",
      "Dia 2: Follow-up com dado ou prova social nova",
      "Dia 5: Última tentativa — tom leve, deixa a porta aberta",
      "Dia 15: Reativação com novidade ou oferta especial",
    ],
    example: "\"Fala, [NOME]! Só passando pra deixar um dado que achei relevante para restaurantes do bairro...\"",
  },
  {
    id: "social_proof", icon: "users", color: "#00BCD4", name: "Prova Social", tag: "Credibilidade",
    summary: "Mostre que outros já decidiram e tiveram resultados. Reduza o risco percebido.",
    steps: [
      "Use números específicos (\"37 parceiros em Criciúma\")",
      "Cite segmentos similares ao do lead",
      "Compartilhe histórias de sucesso (com permissão)",
      "Avaliações Google/Reclame Aqui são prova poderosa",
    ],
    example: "\"Temos 8 pizzarias parceiras só no Centro — posso te conectar com um deles para contar a experiência.\"",
  },
];

type MainTab = "gerar" | "posts" | "trafego" | "biblioteca" | "historico";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

// ─── Shared: Content Generator ────────────────────────────────────────────────
function ContentGenerator({
  types, colors, campaigns, addCampaign, addActivityEvent,
}: {
  types: ContentType[];
  colors: any;
  campaigns: MarketingCampaign[];
  addCampaign: (c: MarketingCampaign) => void;
  addActivityEvent: (e: any) => Promise<void>;
}) {
  const [selected, setSelected] = useState<ContentType | null>(null);
  const [context, setContext]   = useState("");
  const [loading, setLoading]   = useState(false);
  const [result, setResult]     = useState("");
  const [copied, setCopied]     = useState(false);

  const generate = async () => {
    if (!selected || !context.trim()) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLoading(true);
    setResult("");

    try {
      const res = await fetch(`${API_BASE}/api/marketing/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type_id: selected.id,
          type_title: selected.title,
          channel: selected.channel,
          context_input: context.trim(),
          system_context: selected.systemContext,
        }),
      });

      const data = await res.json() as { message?: string; campaign?: MarketingCampaign; error?: string };

      if (data.campaign) {
        addCampaign(data.campaign);
        setResult(data.message?.trim() ?? data.campaign.generated_content);
        await addActivityEvent({ type: "campaign", text: `Campanha criada: ${selected.title}`, icon: "zap", color: "#FFB300" });
      } else {
        setResult(data.message?.trim() ?? "Erro ao gerar. Tente novamente.");
      }
    } catch {
      setResult("Erro de conexão. Verifique sua internet.");
    } finally {
      setLoading(false);
    }
  };

  const copy = async (text: string) => {
    await Clipboard.setStringAsync(text);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const reset = () => { setSelected(null); setContext(""); setResult(""); setCopied(false); };

  if (selected) {
    return (
      <View style={gen.formSection}>
        <TouchableOpacity style={gen.backLink} onPress={reset} activeOpacity={0.7}>
          <Feather name="arrow-left" size={14} color={colors.primary} />
          <Text style={[gen.backLinkText, { color: colors.primary }]}>Escolher outro formato</Text>
        </TouchableOpacity>

        <View style={[gen.selectedBadge, { backgroundColor: selected.color + "18", borderColor: selected.color + "44" }]}>
          <Feather name={selected.icon as any} size={14} color={selected.color} />
          <Text style={[gen.selectedBadgeText, { color: selected.color }]}>{selected.title}</Text>
        </View>

        <View style={[gen.textareaWrap, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <TextInput
            style={[gen.textarea, { color: colors.text }]}
            placeholder={selected.placeholder}
            placeholderTextColor={colors.mutedForeground}
            value={context} onChangeText={setContext}
            multiline numberOfLines={4} textAlignVertical="top"
          />
        </View>

        <TouchableOpacity
          style={[gen.generateBtn, (!context.trim() || loading) && { opacity: 0.6 }]}
          onPress={generate} activeOpacity={0.85} disabled={!context.trim() || loading}
        >
          {loading
            ? <ActivityIndicator color="#fff" size="small" />
            : <><Feather name="zap" size={16} color="#fff" /><Text style={gen.generateBtnText}>Gerar com JADE</Text></>
          }
        </TouchableOpacity>

        {loading && (
          <View style={[gen.loadingBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <ActivityIndicator color="#FF0080" />
            <Text style={[gen.loadingText, { color: colors.mutedForeground }]}>JADE está criando o conteúdo...</Text>
          </View>
        )}

        {!!result && !loading && (
          <View style={[gen.resultBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={gen.resultHeader}>
              <View style={gen.resultBadge}>
                <View style={[gen.greenDot, { backgroundColor: colors.success }]} />
                <Text style={[gen.resultLabel, { color: colors.success }]}>Gerado por JADE</Text>
              </View>
              <TouchableOpacity onPress={() => copy(result)} activeOpacity={0.8} style={gen.copyBtn}>
                <Feather name={copied ? "check" : "copy"} size={16} color={copied ? colors.success : colors.mutedForeground} />
                <Text style={[gen.copyText, { color: copied ? colors.success : colors.mutedForeground }]}>
                  {copied ? "Copiado!" : "Copiar"}
                </Text>
              </TouchableOpacity>
            </View>
            <Text style={[gen.resultText, { color: colors.text }]}>{result}</Text>
            <TouchableOpacity style={[gen.regenBtn, { borderColor: colors.border }]} onPress={generate} activeOpacity={0.8}>
              <Feather name="refresh-cw" size={14} color={colors.primary} />
              <Text style={[gen.regenText, { color: colors.primary }]}>Gerar novamente</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  }

  return (
    <View style={gen.list}>
      {types.map((ct) => (
        <TouchableOpacity
          key={ct.id}
          style={[gen.card, { backgroundColor: colors.card, borderColor: colors.border }]}
          onPress={() => { setSelected(ct); setContext(""); setResult(""); }}
          activeOpacity={0.8}
        >
          <View style={[gen.cardIcon, { backgroundColor: ct.color + "22" }]}>
            <Feather name={ct.icon as any} size={22} color={ct.color} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[gen.cardTitle, { color: colors.text }]}>{ct.title}</Text>
            <Text style={[gen.cardDesc, { color: colors.mutedForeground }]}>{ct.description}</Text>
          </View>
          <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
        </TouchableOpacity>
      ))}
    </View>
  );
}

// ─── Biblioteca card ──────────────────────────────────────────────────────────
function TechCard({ t, colors }: { t: Technique; colors: any }) {
  const [open, setOpen] = useState(false);
  return (
    <TouchableOpacity
      style={[lib.card, { backgroundColor: colors.card, borderColor: open ? t.color + "66" : colors.border }]}
      onPress={() => { Haptics.selectionAsync(); setOpen((v) => !v); }}
      activeOpacity={0.85}
    >
      <View style={lib.cardHeader}>
        <View style={[lib.cardIcon, { backgroundColor: t.color + "22" }]}>
          <Feather name={t.icon as any} size={20} color={t.color} />
        </View>
        <View style={{ flex: 1 }}>
          <View style={lib.nameRow}>
            <Text style={[lib.cardName, { color: colors.text }]}>{t.name}</Text>
            <View style={[lib.tagBadge, { backgroundColor: t.color + "22" }]}>
              <Text style={[lib.tagText, { color: t.color }]}>{t.tag}</Text>
            </View>
          </View>
          <Text style={[lib.cardSummary, { color: colors.mutedForeground }]} numberOfLines={open ? undefined : 2}>
            {t.summary}
          </Text>
        </View>
        <Feather name={open ? "chevron-up" : "chevron-down"} size={16} color={colors.mutedForeground} />
      </View>
      {open && (
        <View style={lib.detail}>
          <View style={[lib.divider, { backgroundColor: colors.border }]} />
          <Text style={[lib.stepsTitle, { color: colors.mutedForeground }]}>PASSOS</Text>
          {t.steps.map((step, i) => (
            <View key={i} style={lib.step}>
              <View style={[lib.stepDot, { backgroundColor: t.color }]} />
              <Text style={[lib.stepText, { color: colors.text }]}>{step}</Text>
            </View>
          ))}
          <View style={[lib.exampleBox, { backgroundColor: t.color + "10", borderColor: t.color + "30" }]}>
            <Text style={[lib.exampleLabel, { color: t.color }]}>EXEMPLO NA PRÁTICA</Text>
            <Text style={[lib.exampleText, { color: colors.text }]}>{t.example}</Text>
          </View>
        </View>
      )}
    </TouchableOpacity>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────
export default function MarketingScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { campaigns, addCampaign, addActivityEvent } = useApp();
  const [tab, setTab] = useState<MainTab>("gerar");
  const [activeCampaign, setActiveCampaign] = useState<MarketingCampaign | null>(null);
  const [copied, setCopied] = useState(false);

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const TABS: { id: MainTab; label: string; icon: string }[] = [
    { id: "gerar",     label: "Gerar",     icon: "zap" },
    { id: "posts",     label: "Posts",     icon: "grid" },
    { id: "trafego",   label: "Tráfego",   icon: "trending-up" },
    { id: "biblioteca",label: "Biblioteca",icon: "book-open" },
    { id: "historico", label: "Histórico", icon: "clock" },
  ];

  const copy = async (text: string) => {
    await Clipboard.setStringAsync(text);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <View style={[sty.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[sty.header, { paddingTop: topPad, borderBottomColor: colors.border }]}>
        <TouchableOpacity
          style={[sty.backBtn, { backgroundColor: colors.surface }]}
          onPress={() => router.back()}
          activeOpacity={0.8}
        >
          <Feather name="arrow-left" size={20} color={colors.text} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={[sty.headerTitle, { color: colors.text }]}>Marketing IA</Text>
          <Text style={[sty.headerSub, { color: colors.mutedForeground }]}>Conteúdo gerado pela JADE</Text>
        </View>
      </View>

      {/* Tabs */}
      {!activeCampaign && (
        <ScrollView
          horizontal showsHorizontalScrollIndicator={false}
          style={[sty.tabsScroll, { borderBottomColor: colors.border }]}
          contentContainerStyle={sty.tabsRow}
        >
          {TABS.map((t) => (
            <TouchableOpacity
              key={t.id}
              style={[sty.tab, tab === t.id && sty.tabActive]}
              onPress={() => setTab(t.id)}
              activeOpacity={0.8}
            >
              <Feather name={t.icon as any} size={14} color={tab === t.id ? "#FF0080" : colors.mutedForeground} />
              <Text style={[sty.tabText, { color: tab === t.id ? "#FF0080" : colors.mutedForeground,
                fontFamily: tab === t.id ? "SpaceGrotesk_600SemiBold" : "SpaceGrotesk_400Regular" }]}>
                {t.label}{t.id === "historico" && campaigns.length > 0 ? ` (${campaigns.length})` : ""}
              </Text>
              {tab === t.id && <View style={[sty.tabUnderline, { backgroundColor: "#FF0080" }]} />}
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 120 }}>
        {/* ─── Gerar ─── */}
        {tab === "gerar" && !activeCampaign && (
          <ContentGenerator
            types={GERAR_TYPES} colors={colors}
            campaigns={campaigns} addCampaign={addCampaign} addActivityEvent={addActivityEvent}
          />
        )}

        {/* ─── Posts ─── */}
        {tab === "posts" && !activeCampaign && (
          <ContentGenerator
            types={POSTS_TYPES} colors={colors}
            campaigns={campaigns} addCampaign={addCampaign} addActivityEvent={addActivityEvent}
          />
        )}

        {/* ─── Tráfego Pago ─── */}
        {tab === "trafego" && !activeCampaign && (
          <>
            <View style={[sty.trafegoHeader, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
              <Feather name="trending-up" size={20} color="#FF0080" />
              <View>
                <Text style={[sty.trafegoTitle, { color: colors.text }]}>Tráfego Pago</Text>
                <Text style={[sty.trafegoSub, { color: colors.mutedForeground }]}>Copies e estratégias para anúncios</Text>
              </View>
            </View>
            <ContentGenerator
              types={TRAFEGO_TYPES} colors={colors}
              campaigns={campaigns} addCampaign={addCampaign} addActivityEvent={addActivityEvent}
            />
          </>
        )}

        {/* ─── Biblioteca ─── */}
        {tab === "biblioteca" && !activeCampaign && (
          <View style={sty.libContainer}>
            <View style={[sty.libHeader, { backgroundColor: colors.card + "CC", borderColor: colors.border }]}>
              <Feather name="book-open" size={18} color="#FF0080" />
              <View>
                <Text style={[sty.libTitle, { color: colors.text }]}>Biblioteca de Técnicas</Text>
                <Text style={[sty.libSub, { color: colors.mutedForeground }]}>Clique em uma técnica para expandir</Text>
              </View>
            </View>
            {TECNICAS.map((t) => (
              <TechCard key={t.id} t={t} colors={colors} />
            ))}
          </View>
        )}

        {/* ─── Histórico ─── */}
        {tab === "historico" && !activeCampaign && (
          <View style={gen.list}>
            {campaigns.length === 0 ? (
              <View style={gen.emptyState}>
                <Feather name="inbox" size={40} color={colors.mutedForeground} />
                <Text style={[gen.emptyText, { color: colors.mutedForeground }]}>
                  Nenhuma campanha gerada ainda.{"\n"}Use as abas Gerar, Posts ou Tráfego para criar conteúdo.
                </Text>
              </View>
            ) : (
              campaigns.map((camp) => {
                const allTypes = [...GERAR_TYPES, ...POSTS_TYPES, ...TRAFEGO_TYPES];
                const ct = allTypes.find((c) => c.id === camp.type_id);
                return (
                  <TouchableOpacity
                    key={camp.id}
                    style={[gen.campCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                    onPress={() => setActiveCampaign(camp)}
                    activeOpacity={0.8}
                  >
                    <View style={[gen.campIcon, { backgroundColor: (ct?.color ?? "#FF0080") + "22" }]}>
                      <Feather name={(ct?.icon ?? "zap") as any} size={18} color={ct?.color ?? "#FF0080"} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[gen.campTitle, { color: colors.text }]}>{camp.type_title}</Text>
                      <Text style={[gen.campChannel, { color: colors.primary }]}>{camp.channel}</Text>
                      <Text style={[gen.campPreview, { color: colors.mutedForeground }]} numberOfLines={1}>
                        {camp.generated_content}
                      </Text>
                      <Text style={[gen.campDate, { color: colors.mutedForeground }]}>
                        {formatDate(camp.created_at)}
                      </Text>
                    </View>
                    <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
                  </TouchableOpacity>
                );
              })
            )}
          </View>
        )}

        {/* ─── Campaign Detail ─── */}
        {activeCampaign && (
          <View style={gen.formSection}>
            <TouchableOpacity onPress={() => setActiveCampaign(null)} style={gen.backLink} activeOpacity={0.7}>
              <Feather name="arrow-left" size={14} color={colors.primary} />
              <Text style={[gen.backLinkText, { color: colors.primary }]}>Voltar ao histórico</Text>
            </TouchableOpacity>
            <View style={[gen.campDetailHeader, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[gen.campTitle, { color: colors.text, fontSize: 16 }]}>{activeCampaign.type_title}</Text>
              <Text style={[gen.campChannel, { color: colors.primary }]}>{activeCampaign.channel}</Text>
              <Text style={[gen.campDate, { color: colors.mutedForeground }]}>{formatDate(activeCampaign.created_at)}</Text>
            </View>
            <View style={[gen.resultBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={gen.resultHeader}>
                <View style={gen.resultBadge}>
                  <View style={[gen.greenDot, { backgroundColor: colors.success }]} />
                  <Text style={[gen.resultLabel, { color: colors.success }]}>Conteúdo salvo</Text>
                </View>
                <TouchableOpacity onPress={() => copy(activeCampaign.generated_content)} activeOpacity={0.8} style={gen.copyBtn}>
                  <Feather name={copied ? "check" : "copy"} size={16} color={copied ? colors.success : colors.mutedForeground} />
                  <Text style={[gen.copyText, { color: copied ? colors.success : colors.mutedForeground }]}>
                    {copied ? "Copiado!" : "Copiar"}
                  </Text>
                </TouchableOpacity>
              </View>
              <Text style={[gen.resultText, { color: colors.text }]}>{activeCampaign.generated_content}</Text>
            </View>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

// ─── StyleSheets ──────────────────────────────────────────────────────────────
const sty = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row", alignItems: "center", gap: 14,
    paddingHorizontal: 20, paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 18, fontFamily: "SpaceGrotesk_700Bold" },
  headerSub: { fontSize: 12, fontFamily: "SpaceGrotesk_400Regular", marginTop: 2 },
  tabsScroll: { borderBottomWidth: StyleSheet.hairlineWidth },
  tabsRow: { paddingHorizontal: 8, flexDirection: "row" },
  tab: { flexDirection: "row", alignItems: "center", paddingHorizontal: 14, paddingVertical: 12, gap: 6, position: "relative" },
  tabActive: {},
  tabText: { fontSize: 13 },
  tabUnderline: { position: "absolute", bottom: 0, left: 8, right: 8, height: 2, borderRadius: 1 },
  trafegoHeader: {
    flexDirection: "row", alignItems: "center", gap: 12,
    padding: 16, margin: 20, borderRadius: 14, borderWidth: 1, borderColor: "#FF008030",
  },
  trafegoTitle: { fontSize: 16, fontFamily: "SpaceGrotesk_700Bold" },
  trafegoSub: { fontSize: 12, fontFamily: "SpaceGrotesk_400Regular" },
  libContainer: { padding: 16, gap: 10 },
  libHeader: {
    flexDirection: "row", alignItems: "center", gap: 12,
    padding: 14, borderRadius: 14, borderWidth: 1, marginBottom: 4,
  },
  libTitle: { fontSize: 15, fontFamily: "SpaceGrotesk_700Bold" },
  libSub: { fontSize: 12, fontFamily: "SpaceGrotesk_400Regular" },
});

const gen = StyleSheet.create({
  formSection: { padding: 20, gap: 16 },
  backLink: { flexDirection: "row", alignItems: "center", gap: 6 },
  backLinkText: { fontSize: 14, fontFamily: "SpaceGrotesk_500Medium" },
  list: { padding: 16, gap: 10 },
  card: { flexDirection: "row", alignItems: "center", gap: 14, padding: 16, borderRadius: 14, borderWidth: 1 },
  cardIcon: { width: 46, height: 46, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  cardTitle: { fontSize: 15, fontFamily: "SpaceGrotesk_600SemiBold" },
  cardDesc: { fontSize: 12, fontFamily: "SpaceGrotesk_400Regular", marginTop: 2 },
  selectedBadge: { flexDirection: "row", alignItems: "center", gap: 8, alignSelf: "flex-start", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1 },
  selectedBadgeText: { fontSize: 13, fontFamily: "SpaceGrotesk_600SemiBold" },
  textareaWrap: { borderRadius: 12, borderWidth: 1, padding: 14, minHeight: 100 },
  textarea: { fontSize: 15, fontFamily: "SpaceGrotesk_400Regular", lineHeight: 22 },
  generateBtn: { backgroundColor: "#FF0080", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, height: 52, borderRadius: 14, shadowColor: "#FF0080", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 6 },
  generateBtnText: { fontSize: 16, fontFamily: "SpaceGrotesk_700Bold", color: "#fff" },
  loadingBox: { flexDirection: "row", alignItems: "center", gap: 12, padding: 16, borderRadius: 12, borderWidth: 1 },
  loadingText: { fontSize: 14, fontFamily: "SpaceGrotesk_400Regular" },
  resultBox: { borderRadius: 14, borderWidth: 1, padding: 16, gap: 14 },
  resultHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  resultBadge: { flexDirection: "row", alignItems: "center", gap: 6 },
  greenDot: { width: 7, height: 7, borderRadius: 4 },
  resultLabel: { fontSize: 12, fontFamily: "SpaceGrotesk_600SemiBold" },
  copyBtn: { flexDirection: "row", alignItems: "center", gap: 6, padding: 6 },
  copyText: { fontSize: 13, fontFamily: "SpaceGrotesk_500Medium" },
  resultText: { fontSize: 14, fontFamily: "SpaceGrotesk_400Regular", lineHeight: 22 },
  regenBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 10, borderRadius: 10, borderWidth: 1 },
  regenText: { fontSize: 13, fontFamily: "SpaceGrotesk_600SemiBold" },
  emptyState: { padding: 40, alignItems: "center", gap: 12 },
  emptyText: { fontSize: 14, fontFamily: "SpaceGrotesk_400Regular", textAlign: "center", lineHeight: 22 },
  campCard: { flexDirection: "row", alignItems: "center", gap: 14, padding: 16, borderRadius: 14, borderWidth: 1 },
  campIcon: { width: 40, height: 40, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  campTitle: { fontSize: 14, fontFamily: "SpaceGrotesk_600SemiBold" },
  campChannel: { fontSize: 12, fontFamily: "SpaceGrotesk_500Medium", marginTop: 2 },
  campPreview: { fontSize: 12, fontFamily: "SpaceGrotesk_400Regular", marginTop: 3 },
  campDate: { fontSize: 11, fontFamily: "SpaceGrotesk_400Regular", marginTop: 3 },
  campDetailHeader: { padding: 16, borderRadius: 14, borderWidth: 1, gap: 4 },
});

const lib = StyleSheet.create({
  card: { borderRadius: 14, borderWidth: 1, padding: 14, gap: 0 },
  cardHeader: { flexDirection: "row", gap: 12, alignItems: "flex-start" },
  cardIcon: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center", marginTop: 2 },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 4 },
  cardName: { fontSize: 15, fontFamily: "SpaceGrotesk_700Bold" },
  tagBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  tagText: { fontSize: 10, fontFamily: "SpaceGrotesk_700Bold" },
  cardSummary: { fontSize: 13, fontFamily: "SpaceGrotesk_400Regular", lineHeight: 19, flex: 1 },
  detail: { marginTop: 14, gap: 10 },
  divider: { height: StyleSheet.hairlineWidth, marginBottom: 4 },
  stepsTitle: { fontSize: 10, fontFamily: "SpaceGrotesk_700Bold", letterSpacing: 1 },
  step: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  stepDot: { width: 6, height: 6, borderRadius: 3, marginTop: 7 },
  stepText: { flex: 1, fontSize: 13, fontFamily: "SpaceGrotesk_400Regular", lineHeight: 20 },
  exampleBox: { borderRadius: 10, borderWidth: 1, padding: 12, gap: 6, marginTop: 4 },
  exampleLabel: { fontSize: 10, fontFamily: "SpaceGrotesk_700Bold", letterSpacing: 1 },
  exampleText: { fontSize: 13, fontFamily: "SpaceGrotesk_400Regular", lineHeight: 20, fontStyle: "italic" },
});
