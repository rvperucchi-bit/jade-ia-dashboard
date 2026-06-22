import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
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

const WHATSAPP_GREEN = "rgba(255,255,255,0.6)";

const STEPS = [
  {
    num: "1",
    titulo: "Acesse o WhatsApp Business API",
    desc: "Crie uma conta no Meta Business Suite e solicite acesso ao WhatsApp Business API no portal developers.facebook.com",
    icon: "globe",
  },
  {
    num: "2",
    titulo: "Configure o número de telefone",
    desc: "Adicione e verifique o número de telefone comercial que a JADE vai usar para responder seus clientes.",
    icon: "phone",
  },
  {
    num: "3",
    titulo: "Gere o token de acesso",
    desc: "No painel de desenvolvedor, gere um token de acesso permanente para integrar com a plataforma JADE IA.",
    icon: "key",
  },
  {
    num: "4",
    titulo: "Configure o Webhook",
    desc: "Aponte o webhook do WhatsApp para a URL da JADE IA. Nossa equipe enviará a URL assim que você contratar o plano Enterprise.",
    icon: "link",
  },
  {
    num: "5",
    titulo: "Ative e teste",
    desc: "Após configurado, envie uma mensagem de teste para seu número e veja a JADE respondendo automaticamente.",
    icon: "check-circle",
  },
];

export default function WhatsAppConfigScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  return (
    <View style={[S.root, { backgroundColor: colors.background }]}>
      <View style={[S.header, { paddingTop: topPad, borderBottomColor: colors.border }]}>
        <TouchableOpacity style={[S.backBtn, { backgroundColor: colors.surface }]} onPress={() => router.back()} activeOpacity={0.8}>
          <Feather name="arrow-left" size={20} color={colors.text} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={[S.headerTitle, { color: colors.text }]}>Integração WhatsApp</Text>
          <Text style={[S.headerSub, { color: colors.mutedForeground }]}>Configurar JADE autônoma</Text>
        </View>
        <View style={[S.waBadge, { backgroundColor: WHATSAPP_GREEN + "20", borderColor: WHATSAPP_GREEN + "40" }]}>
          <MaterialCommunityIcons name="whatsapp" size={14} color={WHATSAPP_GREEN} />
          <Text style={[S.waBadgeText, { color: WHATSAPP_GREEN }]}>Business API</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[S.scroll, { paddingBottom: insets.bottom + 100 }]}>
        {/* Hero */}
        <View style={[S.hero, { backgroundColor: WHATSAPP_GREEN + "10", borderColor: WHATSAPP_GREEN + "30" }]}>
          <View style={[S.heroIcon, { backgroundColor: WHATSAPP_GREEN + "20" }]}>
            <MaterialCommunityIcons name="robot" size={30} color={WHATSAPP_GREEN} />
          </View>
          <Text style={[S.heroTitle, { color: colors.text }]}>JADE Autônoma no WhatsApp</Text>
          <Text style={[S.heroDesc, { color: colors.mutedForeground }]}>
            Quando ativada, a JADE responde seus clientes automaticamente pelo WhatsApp enquanto você está em reunião ou fora do horário de atendimento.{"\n\n"}
            A integração real requer o WhatsApp Business API (Meta) — siga os passos abaixo ou entre em contato com nossa equipe para suporte.
          </Text>
        </View>

        <Text style={[S.sectionLabel, { color: colors.mutedForeground }]}>COMO CONFIGURAR</Text>

        {STEPS.map((step, i) => (
          <View key={i} style={[S.stepCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[S.stepNum, { backgroundColor: WHATSAPP_GREEN + "18" }]}>
              <Text style={[S.stepNumText, { color: WHATSAPP_GREEN }]}>{step.num}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <Feather name={step.icon as any} size={15} color={WHATSAPP_GREEN} />
                <Text style={[S.stepTitulo, { color: colors.text }]}>{step.titulo}</Text>
              </View>
              <Text style={[S.stepDesc, { color: colors.mutedForeground }]}>{step.desc}</Text>
            </View>
          </View>
        ))}

        <View style={[S.infoBox, { backgroundColor: "rgba(255,255,255,0.06)", borderColor: "rgba(255,255,255,0.06)" }]}>
          <Feather name="info" size={16} color="rgba(255,255,255,0.45)" />
          <Text style={[S.infoText, { color: colors.mutedForeground }]}>
            O toggle "Ativar JADE" na tela de Conversas já está ativo no sistema. Para que a JADE responda de verdade, a integração com o WhatsApp Business API é necessária. Entre em contato com nossa equipe para configurar.
          </Text>
        </View>

        <TouchableOpacity
          style={[S.ctaBtn, { backgroundColor: WHATSAPP_GREEN }]}
          onPress={() => Linking.openURL("https://developers.facebook.com/docs/whatsapp")}
          activeOpacity={0.85}
        >
          <MaterialCommunityIcons name="whatsapp" size={18} color="#fff" />
          <Text style={S.ctaBtnText}>Acessar Meta Developers</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[S.suporteBtn, { borderColor: colors.border }]}
          onPress={() => Linking.openURL("mailto:comercial@jadeia.com.br?subject=Integração WhatsApp Business API")}
          activeOpacity={0.8}
        >
          <Feather name="mail" size={16} color="#FF0080" />
          <Text style={[S.suporteBtnText, { color: "#FF0080" }]}>Falar com suporte JADE IA</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const S = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 20, paddingBottom: 14, borderBottomWidth: StyleSheet.hairlineWidth },
  backBtn: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 18, fontFamily: "SpaceGrotesk_700Bold" },
  headerSub: { fontSize: 12, fontFamily: "SpaceGrotesk_400Regular", marginTop: 2 },
  waBadge: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10, borderWidth: 1 },
  waBadgeText: { fontSize: 11, fontFamily: "SpaceGrotesk_600SemiBold" },
  scroll: { padding: 16, gap: 12 },
  hero: { borderRadius: 16, borderWidth: 1, padding: 20, alignItems: "center", gap: 12 },
  heroIcon: { width: 60, height: 60, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  heroTitle: { fontSize: 18, fontFamily: "SpaceGrotesk_700Bold", textAlign: "center" },
  heroDesc: { fontSize: 13, fontFamily: "SpaceGrotesk_400Regular", lineHeight: 21, textAlign: "center" },
  sectionLabel: { fontSize: 11, fontFamily: "SpaceGrotesk_700Bold", letterSpacing: 1, marginTop: 4 },
  stepCard: { flexDirection: "row", gap: 14, borderRadius: 14, borderWidth: 1, padding: 14, alignItems: "flex-start" },
  stepNum: { width: 30, height: 30, borderRadius: 10, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  stepNumText: { fontSize: 14, fontFamily: "SpaceGrotesk_700Bold" },
  stepTitulo: { fontSize: 14, fontFamily: "SpaceGrotesk_700Bold", flex: 1 },
  stepDesc: { fontSize: 12, fontFamily: "SpaceGrotesk_400Regular", lineHeight: 19, marginTop: 4 },
  infoBox: { flexDirection: "row", gap: 10, borderRadius: 12, borderWidth: 1, padding: 14, alignItems: "flex-start" },
  infoText: { flex: 1, fontSize: 12, fontFamily: "SpaceGrotesk_400Regular", lineHeight: 19 },
  ctaBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, height: 52, borderRadius: 14, marginTop: 4 },
  ctaBtnText: { color: "#fff", fontSize: 15, fontFamily: "SpaceGrotesk_700Bold" },
  suporteBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, height: 48, borderRadius: 14, borderWidth: 1 },
  suporteBtnText: { fontSize: 14, fontFamily: "SpaceGrotesk_600SemiBold" },
});
