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
  bg: "#0B0814",
  card: "#111118",
  border: "#1E1E2E",
  text: "#FFFFFF",
  muted: "#7777AA",
  sub: "#AAAACC",
  primary: "#FF0080",
};

const SECTIONS = [
  {
    title: "1. Aceitação dos Termos",
    body: "Ao criar uma conta e utilizar a plataforma JADE IA, você concorda com estes Termos de Uso em sua totalidade. Se não concordar com algum item, não utilize o serviço.\n\nEstes termos se aplicam a todos os usuários, incluindo visitantes, clientes pagantes e parceiros comerciais. A JADE IA reserva-se o direito de alterar estes termos a qualquer momento, com aviso prévio de 15 dias por e-mail.",
  },
  {
    title: "2. Uso da Plataforma",
    body: "A JADE IA é uma plataforma de inteligência artificial para auxiliar profissionais de vendas. Você concorda em:\n\n• Utilizar a plataforma apenas para fins legais e legítimos\n• Não inserir informações falsas ou enganosas\n• Não tentar acessar sistemas ou dados de outros usuários\n• Não realizar engenharia reversa ou copiar o sistema\n• Não utilizar a IA para fins discriminatórios ou ilegais\n• Manter suas credenciais de acesso em sigilo\n\nO uso indevido pode resultar na suspensão imediata da conta sem reembolso.",
  },
  {
    title: "3. Responsabilidades do Usuário",
    body: "Você é responsável por:\n\n• Todas as informações inseridas na plataforma\n• O uso adequado das sugestões e scripts gerados pela IA\n• A veracidade dos dados de leads e clientes cadastrados\n• O cumprimento das leis locais ao contatar leads (LGPD, Código de Defesa do Consumidor)\n• A confidencialidade da sua senha e acesso\n\nA JADE IA fornece sugestões baseadas em IA que devem ser avaliadas criticamente pelo usuário antes de serem utilizadas.",
  },
  {
    title: "4. Limitações de Responsabilidade",
    body: "A JADE IA não se responsabiliza por:\n\n• Resultados de vendas ou metas comerciais não atingidas\n• Perdas causadas pelo uso inadequado das ferramentas\n• Interrupções temporárias do serviço por manutenção\n• Conteúdo gerado pela IA que não reflita a realidade\n• Decisões comerciais tomadas com base nas sugestões da IA\n\nO serviço é fornecido 'como está', com uptime estimado de 99,5%. A responsabilidade máxima da JADE IA é limitada ao valor pago no último mês de assinatura.",
  },
  {
    title: "5. Créditos e Pagamento",
    body: "Os planos de assinatura incluem um número de créditos mensais para uso da IA:\n\n• Créditos não utilizados não são acumulados para o mês seguinte\n• O pagamento é processado automaticamente no vencimento\n• Alterações de plano entram em vigor no próximo ciclo\n• Cobranças são em Reais (BRL) e incluem impostos aplicáveis\n\nPara contestar uma cobrança, entre em contato em até 30 dias após a data da cobrança.",
  },
  {
    title: "6. Cancelamento",
    body: "Você pode cancelar sua assinatura a qualquer momento:\n\n• O acesso continua até o fim do período pago\n• Não há reembolso proporcional por período não utilizado\n• Dados são mantidos por 90 dias após o cancelamento\n• Você pode reativar a conta dentro deste período\n\nA JADE IA pode suspender ou encerrar sua conta em caso de violação destes termos, com ou sem aviso prévio dependendo da gravidade da infração.",
  },
  {
    title: "7. Propriedade Intelectual",
    body: "Todos os direitos de propriedade intelectual da plataforma JADE IA pertencem à empresa:\n\n• Marca, logo, design e interface\n• Algoritmos e modelos de IA proprietários\n• Metodologias de qualificação de leads\n• Scripts e templates de vendas criados pela plataforma\n\nOs dados inseridos pelo usuário permanecem de sua propriedade. A JADE IA utiliza esses dados anonimamente para melhorar o serviço.",
  },
  {
    title: "8. Disposições Gerais",
    body: "• Estes termos são regidos pelas leis brasileiras\n• Foro eleito: Comarca de Criciúma, Santa Catarina\n• Caso alguma cláusula seja inválida, as demais permanecem vigentes\n• A omissão no exercício de direitos não constitui renúncia\n• Comunicações oficiais serão feitas pelo e-mail cadastrado\n\nPara suporte jurídico ou dúvidas sobre estes termos:\ntermos@jadeia.com.br | (48) 99999-0000",
  },
];

export default function TermosScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={[S.root, { paddingTop: insets.top }]}>
      <View style={S.header}>
        <TouchableOpacity onPress={() => router.back()} style={S.backBtn} activeOpacity={0.7}>
          <Feather name="arrow-left" size={22} color={C.text} />
        </TouchableOpacity>
        <Text style={S.headerTitle}>Termos de Uso</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={[S.scroll, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={S.hero}>
          <View style={S.heroIcon}>
            <Feather name="file-text" size={28} color={C.primary} />
          </View>
          <Text style={S.heroTitle}>Termos de Uso</Text>
          <Text style={S.heroSub}>
            Leia com atenção antes de utilizar a plataforma JADE IA.
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
            Ao utilizar a JADE IA, você declara ter lido, compreendido e concordado com estes Termos de Uso.
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
