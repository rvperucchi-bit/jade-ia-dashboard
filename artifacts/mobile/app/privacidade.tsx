import { Feather } from "@expo/vector-icons";
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
};

interface Section {
  title: string;
  body: string;
}

const SECTIONS: Section[] = [
  {
    title: "1. Coleta de Dados",
    body: "A JADE IA coleta informações necessárias para o funcionamento da plataforma, incluindo:\n\n• Nome completo e e-mail fornecidos no cadastro\n• Número de telefone para comunicações\n• Dados de uso e interações com a plataforma\n• Informações de leads inseridas pelo usuário\n• Logs de acesso e dados de dispositivo\n\nAs informações são coletadas diretamente do usuário no momento do cadastro ou durante o uso da plataforma.",
  },
  {
    title: "2. Uso das Informações",
    body: "As informações coletadas são utilizadas exclusivamente para:\n\n• Fornecer e aprimorar os serviços da JADE IA\n• Personalizar a experiência do usuário\n• Processar qualificações e análises de leads\n• Gerar relatórios e laudos solicitados\n• Enviar comunicações relevantes sobre o serviço\n• Garantir a segurança da conta e da plataforma\n\nNunca utilizamos seus dados para fins publicitários de terceiros.",
  },
  {
    title: "3. Compartilhamento de Dados",
    body: "A JADE IA não vende, aluga ou compartilha seus dados pessoais com terceiros, exceto:\n\n• Quando exigido por lei ou ordem judicial\n• Com provedores de serviço essenciais (ex: infraestrutura de nuvem) sob acordos de confidencialidade\n• Com sua autorização explícita\n\nOs dados de leads e clientes inseridos na plataforma pertencem integralmente ao usuário e não são acessados pela equipe JADE salvo solicitação expressa de suporte.",
  },
  {
    title: "4. Segurança dos Dados",
    body: "Adotamos medidas técnicas e organizacionais para proteger seus dados:\n\n• Criptografia em trânsito (TLS/HTTPS)\n• Armazenamento seguro com acesso restrito\n• Monitoramento contínuo de acessos\n• Backups regulares e recuperação de dados\n• Autenticação segura de usuários\n\nEm caso de incidente de segurança que afete seus dados, você será notificado conforme exigido pela LGPD.",
  },
  {
    title: "5. Seus Direitos (LGPD)",
    body: "Em conformidade com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018), você tem direito a:\n\n• Confirmação da existência de tratamento de dados\n• Acesso aos seus dados pessoais\n• Correção de dados incompletos ou incorretos\n• Anonimização, bloqueio ou eliminação de dados desnecessários\n• Portabilidade dos dados a outro fornecedor\n• Eliminação dos dados pessoais tratados com consentimento\n• Revogação do consentimento a qualquer momento\n\nPara exercer seus direitos, entre em contato: privacidade@jadeia.com.br",
  },
  {
    title: "6. Retenção de Dados",
    body: "Seus dados são mantidos enquanto sua conta estiver ativa. Após o cancelamento:\n\n• Dados da conta são anonimizados em até 90 dias\n• Dados financeiros são mantidos pelo prazo legal de 5 anos\n• Logs de acesso são deletados em 180 dias\n\nVocê pode solicitar a exclusão imediata dos seus dados a qualquer momento pelo suporte.",
  },
  {
    title: "7. Contato",
    body: "Para dúvidas, solicitações ou exercício dos seus direitos relacionados à privacidade de dados:\n\n• E-mail: privacidade@jadeia.com.br\n• WhatsApp: (48) 99999-0000\n• Endereço: Criciúma, Santa Catarina, Brasil\n\nEncarregado de Proteção de Dados (DPO): Equipe Jurídica JADE IA\n\nEsta política pode ser atualizada periodicamente. Em caso de alterações significativas, você será notificado por e-mail.",
  },
];

export default function PrivacidadeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={[S.root, { paddingTop: insets.top }]}>
      <View style={S.header}>
        <TouchableOpacity onPress={() => router.back()} style={S.backBtn} activeOpacity={0.7}>
          <Feather name="arrow-left" size={22} color={C.text} />
        </TouchableOpacity>
        <Text style={S.headerTitle}>Política de Privacidade</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={[S.scroll, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={S.hero}>
          <View style={S.heroIcon}>
            <Feather name="shield" size={28} color={C.primary} />
          </View>
          <Text style={S.heroTitle}>Seus dados, protegidos.</Text>
          <Text style={S.heroSub}>
            A JADE IA leva a privacidade a sério. Veja como tratamos suas informações em conformidade com a LGPD.
          </Text>
          <Text style={S.heroDate}>Última atualização: 20 de junho de 2026</Text>
        </View>

        {SECTIONS.map((sec, i) => (
          <View key={i} style={S.section}>
            <Text style={S.sectionTitle}>{sec.title}</Text>
            <Text style={S.sectionBody}>{sec.body}</Text>
          </View>
        ))}

        <View style={S.footer}>
          <Text style={S.footerText}>
            Ao utilizar a JADE IA, você concorda com esta Política de Privacidade.
          </Text>
        </View>
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

  hero: {
    alignItems: "center",
    paddingVertical: 32,
    gap: 10,
  },
  heroIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: C.primary + "18",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  heroTitle: {
    fontSize: 22,
    fontFamily: "SpaceGrotesk_700Bold",
    color: C.text,
    textAlign: "center",
  },
  heroSub: {
    fontSize: 14,
    fontFamily: "SpaceGrotesk_400Regular",
    color: C.sub,
    textAlign: "center",
    lineHeight: 22,
  },
  heroDate: {
    fontSize: 12,
    fontFamily: "SpaceGrotesk_400Regular",
    color: C.muted,
    marginTop: 4,
  },

  section: {
    backgroundColor: C.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.border,
    padding: 20,
    marginBottom: 12,
    gap: 10,
  },
  sectionTitle: {
    fontSize: 15,
    fontFamily: "SpaceGrotesk_700Bold",
    color: C.primary,
  },
  sectionBody: {
    fontSize: 14,
    fontFamily: "SpaceGrotesk_400Regular",
    color: C.sub,
    lineHeight: 22,
  },

  footer: {
    marginTop: 8,
    padding: 20,
    alignItems: "center",
  },
  footerText: {
    fontSize: 13,
    fontFamily: "SpaceGrotesk_400Regular",
    color: C.muted,
    textAlign: "center",
    lineHeight: 20,
  },
});
