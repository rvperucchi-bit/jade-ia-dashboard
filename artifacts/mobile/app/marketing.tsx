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

const API_BASE =
  Platform.OS === "web"
    ? ""
    : `https://${process.env.EXPO_PUBLIC_DOMAIN ?? ""}`;

interface ContentType {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  placeholder: string;
  systemContext: string;
}

const CONTENT_TYPES: ContentType[] = [
  {
    id: "instagram_post",
    title: "Post Instagram",
    description: "Legenda com CTA e hashtags",
    icon: "instagram",
    color: "#E1306C",
    placeholder: "Descreva o assunto do post: promoção, produto, evento...",
    systemContext: "Crie uma legenda profissional para Instagram sobre o JÁ Delivery em Criciúma. Use emojis estrategicamente, inclua CTA claro e hashtags relevantes (no máximo 15). Tom: próximo e autêntico. Máximo 150 palavras.",
  },
  {
    id: "story",
    title: "Story",
    description: "Texto direto para Stories",
    icon: "image",
    color: "#FF6B35",
    placeholder: "Tema do story: urgência, bastidores, oferta relâmpago...",
    systemContext: "Crie um roteiro de texto para Story do Instagram sobre o JÁ Delivery. Máximo 3 frames. Cada frame: texto curto, impactante. Use linguagem jovem e direta. Inclua sugestão de sticker ou enquete.",
  },
  {
    id: "whatsapp",
    title: "WhatsApp Broadcast",
    description: "Mensagem para lista de transmissão",
    icon: "message-circle",
    color: "#25D366",
    placeholder: "Contexto da mensagem: oferta, novidade, lembrete...",
    systemContext: "Crie uma mensagem de WhatsApp para broadcast do JÁ Delivery. Máximo 4 linhas. Use o nome do destinatário como [NOME]. Tom: informal, direto. Termine com pergunta ou CTA de resposta fácil. NUNCA mencione concorrentes pelo nome.",
  },
  {
    id: "tiktok",
    title: "Roteiro TikTok",
    description: "Script para vídeo de até 60s",
    icon: "video",
    color: "#FF0050",
    placeholder: "Tema do vídeo: tutorial, bastidores, depoimento...",
    systemContext: "Crie um roteiro de TikTok sobre o JÁ Delivery. Duração: 30-60 segundos. Estrutura: gancho (0-3s), desenvolvimento, CTA final. Inclua: falas do criador, sugestões de texto na tela, música sugerida. Tom: autêntico, trends.",
  },
  {
    id: "google_review",
    title: "Responder Avaliação Google",
    description: "Resposta profissional a review",
    icon: "star",
    color: "#FFB300",
    placeholder: "Cole aqui a avaliação do cliente que deseja responder...",
    systemContext: "Você é o gerente de relacionamento do JÁ Delivery em Criciúma. Escreva uma resposta profissional, calorosa e autêntica para a seguinte avaliação do Google. Se positiva: agradeça e reforce o diferencial. Se negativa: acolha, peça desculpas sem admitir culpa, ofereça solução. Máximo 3 linhas.",
  },
];

function ContentCard({
  ct,
  onSelect,
  colors,
}: {
  ct: ContentType;
  onSelect: () => void;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
      onPress={onSelect}
      activeOpacity={0.8}
    >
      <View style={[styles.cardIcon, { backgroundColor: ct.color + "22" }]}>
        <Feather name={ct.icon as any} size={22} color={ct.color} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.cardTitle, { color: colors.text }]}>{ct.title}</Text>
        <Text style={[styles.cardDesc, { color: colors.mutedForeground }]}>{ct.description}</Text>
      </View>
      <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
    </TouchableOpacity>
  );
}

export default function MarketingScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [selected, setSelected] = useState<ContentType | null>(null);
  const [context, setContext] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");
  const [copied, setCopied] = useState(false);

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const generate = async () => {
    if (!selected || !context.trim()) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLoading(true);
    setResult("");

    try {
      const prompt = `${selected.systemContext}\n\nContexto fornecido pelo usuário: ${context.trim()}`;
      const res = await fetch(`${API_BASE}/api/jade/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{ role: "user", content: prompt }],
        }),
      });

      const data = (await res.json()) as { message?: string; error?: string };
      setResult(data.message?.trim() ?? "Erro ao gerar conteúdo. Tente novamente.");
    } catch {
      setResult("Erro de conexão. Verifique sua internet e tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const copy = async () => {
    await Clipboard.setStringAsync(result);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const reset = () => {
    setSelected(null);
    setContext("");
    setResult("");
    setCopied(false);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 8, borderBottomColor: colors.border }]}>
        <TouchableOpacity
          style={[styles.backBtn, { backgroundColor: colors.surface }]}
          onPress={selected ? reset : () => router.back()}
          activeOpacity={0.8}
        >
          <Feather name="arrow-left" size={20} color={colors.text} />
        </TouchableOpacity>
        <View>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            {selected ? selected.title : "Marketing IA"}
          </Text>
          <Text style={[styles.headerSub, { color: colors.mutedForeground }]}>
            {selected ? "JADE gera o conteúdo" : "Conteúdo gerado por JADE"}
          </Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {!selected ? (
          /* Options List */
          <View style={styles.list}>
            <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
              ESCOLHA O FORMATO
            </Text>
            {CONTENT_TYPES.map((ct) => (
              <ContentCard
                key={ct.id}
                ct={ct}
                colors={colors}
                onSelect={() => {
                  setSelected(ct);
                  setContext("");
                  setResult("");
                }}
              />
            ))}
          </View>
        ) : (
          /* Generation Form */
          <View style={styles.formSection}>
            <View style={[styles.selectedBadge, { backgroundColor: selected.color + "18", borderColor: selected.color + "44" }]}>
              <Feather name={selected.icon as any} size={14} color={selected.color} />
              <Text style={[styles.selectedBadgeText, { color: selected.color }]}>
                {selected.title}
              </Text>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={[styles.label, { color: colors.mutedForeground }]}>Contexto</Text>
              <View style={[styles.textareaWrap, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <TextInput
                  style={[styles.textarea, { color: colors.text }]}
                  placeholder={selected.placeholder}
                  placeholderTextColor={colors.mutedForeground}
                  value={context}
                  onChangeText={setContext}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </View>
            </View>

            <TouchableOpacity
              style={[styles.generateBtn, (!context.trim() || loading) && { opacity: 0.6 }]}
              onPress={generate}
              activeOpacity={0.85}
              disabled={!context.trim() || loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Feather name="zap" size={16} color="#fff" />
                  <Text style={styles.generateBtnText}>Gerar com JADE</Text>
                </>
              )}
            </TouchableOpacity>

            {loading && (
              <View style={[styles.loadingBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <ActivityIndicator color="#FF0080" />
                <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>
                  JADE está criando o conteúdo...
                </Text>
              </View>
            )}

            {!!result && !loading && (
              <View style={[styles.resultBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={styles.resultHeader}>
                  <View style={styles.resultBadge}>
                    <View style={[styles.greenDot, { backgroundColor: colors.success }]} />
                    <Text style={[styles.resultLabel, { color: colors.success }]}>
                      Gerado por JADE
                    </Text>
                  </View>
                  <TouchableOpacity onPress={copy} activeOpacity={0.8} style={styles.copyBtn}>
                    <Feather
                      name={copied ? "check" : "copy"}
                      size={16}
                      color={copied ? colors.success : colors.mutedForeground}
                    />
                    <Text style={[styles.copyText, { color: copied ? colors.success : colors.mutedForeground }]}>
                      {copied ? "Copiado!" : "Copiar"}
                    </Text>
                  </TouchableOpacity>
                </View>
                <Text style={[styles.resultText, { color: colors.text }]}>{result}</Text>
                <TouchableOpacity
                  style={[styles.regenBtn, { borderColor: colors.border }]}
                  onPress={generate}
                  activeOpacity={0.8}
                >
                  <Feather name="refresh-cw" size={14} color={colors.primary} />
                  <Text style={[styles.regenText, { color: colors.primary }]}>Gerar novamente</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row", alignItems: "center", gap: 14,
    paddingHorizontal: 20, paddingBottom: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 18, fontFamily: "SpaceGrotesk_700Bold" },
  headerSub: { fontSize: 12, fontFamily: "SpaceGrotesk_400Regular", marginTop: 2 },
  list: { padding: 20, gap: 10 },
  sectionLabel: { fontSize: 11, fontFamily: "SpaceGrotesk_600SemiBold", letterSpacing: 1, marginBottom: 4 },
  card: {
    flexDirection: "row", alignItems: "center", gap: 14,
    padding: 16, borderRadius: 14, borderWidth: 1,
  },
  cardIcon: { width: 46, height: 46, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  cardTitle: { fontSize: 15, fontFamily: "SpaceGrotesk_600SemiBold" },
  cardDesc: { fontSize: 12, fontFamily: "SpaceGrotesk_400Regular", marginTop: 2 },
  formSection: { padding: 20, gap: 20 },
  selectedBadge: {
    flexDirection: "row", alignItems: "center", gap: 8,
    alignSelf: "flex-start", paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 20, borderWidth: 1,
  },
  selectedBadgeText: { fontSize: 13, fontFamily: "SpaceGrotesk_600SemiBold" },
  fieldGroup: { gap: 8 },
  label: { fontSize: 12, fontFamily: "SpaceGrotesk_500Medium", textTransform: "uppercase", letterSpacing: 0.5 },
  textareaWrap: { borderRadius: 12, borderWidth: 1, padding: 14, minHeight: 100 },
  textarea: { fontSize: 15, fontFamily: "SpaceGrotesk_400Regular", lineHeight: 22 },
  generateBtn: {
    backgroundColor: "#FF0080", flexDirection: "row",
    alignItems: "center", justifyContent: "center",
    gap: 10, height: 52, borderRadius: 14,
    shadowColor: "#FF0080", shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 10, elevation: 6,
  },
  generateBtnText: { fontSize: 16, fontFamily: "SpaceGrotesk_700Bold", color: "#fff" },
  loadingBox: {
    flexDirection: "row", alignItems: "center", gap: 12,
    padding: 16, borderRadius: 12, borderWidth: 1,
  },
  loadingText: { fontSize: 14, fontFamily: "SpaceGrotesk_400Regular" },
  resultBox: { borderRadius: 14, borderWidth: 1, padding: 16, gap: 14 },
  resultHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  resultBadge: { flexDirection: "row", alignItems: "center", gap: 6 },
  greenDot: { width: 7, height: 7, borderRadius: 4 },
  resultLabel: { fontSize: 12, fontFamily: "SpaceGrotesk_600SemiBold" },
  copyBtn: { flexDirection: "row", alignItems: "center", gap: 6, padding: 6 },
  copyText: { fontSize: 13, fontFamily: "SpaceGrotesk_500Medium" },
  resultText: { fontSize: 14, fontFamily: "SpaceGrotesk_400Regular", lineHeight: 22 },
  regenBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, paddingVertical: 10, borderRadius: 10, borderWidth: 1,
  },
  regenText: { fontSize: 13, fontFamily: "SpaceGrotesk_600SemiBold" },
});
