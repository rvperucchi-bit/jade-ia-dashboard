import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";

const OUTPUT = path.resolve("auditoria-jade-ia.pdf");
const doc = new PDFDocument({ margin: 50, size: "A4" });
doc.pipe(fs.createWriteStream(OUTPUT));

// Colors
const PINK = "#FF0080";
const DARK = "#0A0A0F";
const GRAY = "#8A8A9A";
const BLACK = "#111118";

function header(text, size = 16) {
  doc.moveDown(0.5)
    .fontSize(size)
    .fillColor(PINK)
    .font("Helvetica-Bold")
    .text(text)
    .moveDown(0.3);
}

function subheader(text) {
  doc.fontSize(11)
    .fillColor(BLACK)
    .font("Helvetica-Bold")
    .text(text)
    .moveDown(0.2);
}

function body(text) {
  doc.fontSize(10)
    .fillColor("#333333")
    .font("Helvetica")
    .text(text, { lineGap: 3 })
    .moveDown(0.3);
}

function bullet(text) {
  doc.fontSize(10)
    .fillColor("#333333")
    .font("Helvetica")
    .text(`  •  ${text}`, { lineGap: 3 });
}

function divider() {
  doc.moveDown(0.5)
    .moveTo(50, doc.y)
    .lineTo(545, doc.y)
    .strokeColor("#DDDDDD")
    .lineWidth(0.5)
    .stroke()
    .moveDown(0.5);
}

function badge(text, x, y, color = PINK) {
  const w = text.length * 6.5 + 14;
  doc.roundedRect(x, y, w, 16, 4).fill(color + "22");
  doc.fontSize(8).fillColor(color).font("Helvetica-Bold").text(text, x + 7, y + 4, { lineBreak: false });
}

// ─── CAPA ───────────────────────────────────────────────────────────────────
doc.rect(0, 0, doc.page.width, 220).fill("#0A0A0F");

doc.fontSize(36)
  .fillColor(PINK)
  .font("Helvetica-Bold")
  .text("JADE IA", 50, 60, { lineBreak: false });

doc.fontSize(13)
  .fillColor("#FFFFFF")
  .font("Helvetica")
  .text("Relatório de Auditoria Técnica", 50, 108);

doc.fontSize(10)
  .fillColor(GRAY)
  .text("Plataforma de Agente de Vendas com Inteligência Artificial", 50, 130);

doc.fontSize(9)
  .fillColor(GRAY)
  .text(`Gerado em: ${new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}`, 50, 155);

doc.fontSize(9)
  .fillColor(GRAY)
  .text("Versão: 1.0.0  |  Ambiente: Desenvolvimento  |  Plataforma: Expo + Node.js", 50, 170);

doc.moveDown(8);

// ─── 1. RESUMO EXECUTIVO ────────────────────────────────────────────────────
header("1. Resumo Executivo", 15);
body(
  "O JADE IA é uma plataforma mobile-first de agente de inteligência artificial voltada para " +
  "profissionais de vendas no Brasil. O aplicativo foi construído como um app nativo utilizando " +
  "Expo (React Native) com um servidor de API Express no backend, integrado à API do Google Gemini " +
  "para respostas conversacionais em tempo real."
);
body(
  "A plataforma oferece um fluxo completo de gestão comercial: dashboard de métricas, " +
  "kanban de leads, chat estilo WhatsApp com clientes e uma agente de IA (JADE) com " +
  "personalidade brasileira de vendas treinada via system prompt."
);

divider();

// ─── 2. STACK TÉCNICA ───────────────────────────────────────────────────────
header("2. Stack Técnica");

subheader("Frontend (Mobile)");
bullet("Expo SDK 54 + React Native 0.81.5");
bullet("Expo Router 6 — navegação baseada em arquivos (file-based routing)");
bullet("TypeScript 5.9 com React Compiler ativado");
bullet("Fonte: Space Grotesk (Google Fonts via @expo-google-fonts/space-grotesk)");
bullet("Tema: Dark #0A0A0F com accent pink #FF0080");
bullet("Ícones: @expo/vector-icons (Feather + MaterialCommunityIcons)");
bullet("Gestos: react-native-gesture-handler + react-native-safe-area-context");
bullet("Teclado: react-native-keyboard-controller");
doc.moveDown(0.3);

subheader("Backend (API Server)");
bullet("Node.js 24 + Express 5");
bullet("TypeScript com build via esbuild (bundle CJS)");
bullet("Google Generative AI SDK v0.24.x (@google/generative-ai)");
bullet("Modelo: Gemini 2.5 Flash (gemini-2.5-flash)");
bullet("Logging: Pino + pino-http");
bullet("CORS habilitado para todas as origens");
doc.moveDown(0.3);

subheader("Infraestrutura");
bullet("pnpm workspaces — monorepo com packages @workspace/*");
bullet("Proxy reverso compartilhado Replit (roteamento por path)");
bullet("API disponível em /api — App mobile em / via Expo DevServer");
bullet("Variável de ambiente: GEMINI_API_KEY (secret configurado)");

divider();

// ─── 3. ESTRUTURA DO PROJETO ─────────────────────────────────────────────────
header("3. Estrutura do Projeto");

const estrutura = [
  ["artifacts/mobile/", "App Expo (React Native)"],
  ["  app/_layout.tsx", "Root layout — carregamento de fontes + providers"],
  ["  app/(tabs)/_layout.tsx", "Navegação inferior com 5 abas"],
  ["  app/(tabs)/index.tsx", "Aba Radar — Dashboard principal"],
  ["  app/(tabs)/leads.tsx", "Aba Leads — Kanban board"],
  ["  app/(tabs)/conversas.tsx", "Aba Conversas — Lista estilo WhatsApp"],
  ["  app/(tabs)/jade.tsx", "Aba JADE — Chat com IA (Gemini)"],
  ["  app/(tabs)/mais.tsx", "Aba Mais — Perfil e configurações"],
  ["  app/conversa/[id].tsx", "Tela de conversa individual"],
  ["  context/AppContext.tsx", "Estado global (leads + conversas)"],
  ["  constants/colors.ts", "Paleta de cores dark theme"],
  ["artifacts/api-server/", "Servidor Express"],
  ["  src/routes/jade.ts", "Endpoint POST /api/jade/chat (Gemini)"],
  ["  src/routes/health.ts", "Endpoint GET /api/healthz"],
  ["  src/app.ts", "Configuração Express + middlewares"],
];

for (const [arquivo, descricao] of estrutura) {
  const isDir = arquivo.endsWith("/");
  doc.fontSize(9)
    .font(isDir ? "Helvetica-Bold" : "Courier")
    .fillColor(isDir ? BLACK : "#555555")
    .text(arquivo, 55, doc.y, { continued: true, lineBreak: false })
    .font("Helvetica")
    .fillColor(GRAY)
    .text(`   ${descricao}`, { lineBreak: true, lineGap: 2 });
}

divider();

// ─── 4. FUNCIONALIDADES IMPLEMENTADAS ─────────────────────────────────────────
header("4. Funcionalidades Implementadas");

subheader("4.1 Dashboard — Aba Radar");
bullet("4 cards de métricas: Leads Hoje, Conversas Ativas, Taxa de Conversão, Receita do Mês");
bullet("Banner de status da JADE com atalho para o chat IA");
bullet("Resumo visual do pipeline com barras por coluna");
bullet("Feed de atividade recente (últimas 5 ações)");
bullet("Notificação de conversas não lidas no ícone do sino");
doc.moveDown(0.3);

subheader("4.2 Pipeline de Leads — Aba Leads");
bullet("Kanban board com scroll horizontal — 4 colunas: Novo, Qualificado, Proposta, Fechado");
bullet("9 leads mockados com nome, empresa, valor, tag colorida e tempo");
bullet("Modal de movimentação: toque no card para mover entre colunas");
bullet("Estado global via Context API — atualização em tempo real no dashboard");
bullet("Botão de adicionar lead (UI preparada)");
doc.moveDown(0.3);

subheader("4.3 Conversas WhatsApp — Aba Conversas");
bullet("Lista de 5 conversas com avatar, nome, última mensagem, horário e badge de não lidas");
bullet("Indicador de status online em tempo real");
bullet("Barra de busca para filtrar conversas por nome");
bullet("Tela individual de conversa com scroll de mensagens (FlatList invertida)");
bullet("Input de resposta com anexo, envio e indicador de leitura (check)");
bullet("Navegação via Expo Router com parâmetro dinâmico [id]");
doc.moveDown(0.3);

subheader("4.4 Chat com IA — Aba JADE");
bullet("Integração real com Google Gemini 2.5 Flash via API REST");
bullet("System prompt personalizado: JADE é uma vendedora autônoma brasileira");
bullet("Histórico de conversa mantido durante a sessão (contexto acumulativo)");
bullet("5 chips de atalho: Qualificar lead, Criar proposta, Fazer follow-up, Ver análise, Responder cliente");
bullet("Indicador de digitação animado enquanto a IA processa");
bullet("Botão de reiniciar conversa (ícone de reset no header)");
doc.moveDown(0.3);

subheader("4.5 Mais — Perfil e Configurações");
bullet("Card de perfil com nome, cargo e badge do plano Pro");
bullet("3 métricas pessoais: Total de Leads, Fechados e Receita");
bullet("Menu completo: Perfil, Plano, Notificações, Treinamento da JADE, Integrações, Privacidade");
bullet("Seção de Suporte com Central de Ajuda e contato direto");
bullet("Ação de sair da conta com destaque em vermelho");

divider();

// ─── 5. ENDPOINT DA API ──────────────────────────────────────────────────────
header("5. Endpoint da API");

subheader("POST /api/jade/chat");
body("Recebe o histórico de mensagens e retorna a resposta da JADE via Gemini.");
doc.moveDown(0.2);

doc.fontSize(9).font("Courier").fillColor("#333333");
doc.text("Requisição (Body JSON):", { lineGap: 2 });
doc.text('{', { lineGap: 1 });
doc.text('  "messages": [', { lineGap: 1 });
doc.text('    { "role": "user", "content": "Qualificar lead" },', { lineGap: 1 });
doc.text('    { "role": "model", "content": "..." }', { lineGap: 1 });
doc.text('  ]', { lineGap: 1 });
doc.text('}', { lineGap: 1 });
doc.moveDown(0.4);
doc.text("Resposta (JSON):", { lineGap: 2 });
doc.text('{ "message": "Resposta da JADE em português..." }', { lineGap: 1 });
doc.moveDown(0.4);
doc.font("Helvetica").fillColor(GRAY).fontSize(9)
  .text("Modelo: gemini-2.5-flash  |  Método: generateContent (síncrono)  |  Auth: GEMINI_API_KEY");

divider();

// ─── 6. DESIGN SYSTEM ────────────────────────────────────────────────────────
header("6. Design System");

const cores = [
  ["Background", "#0A0A0F", "Fundo principal do app"],
  ["Card", "#111118", "Superfície de cards e containers"],
  ["Surface", "#1A1A26", "Inputs, badges, elementos secundários"],
  ["Border", "#252535", "Divisores e bordas"],
  ["Primary/Accent", "#FF0080", "Cor de destaque (pink magenta)"],
  ["Success", "#00D68F", "Indicadores positivos"],
  ["Warning", "#FFB300", "Alertas e tags de atenção"],
  ["Destructive", "#FF3B5C", "Ações perigosas"],
  ["Muted", "#8A8A9A", "Textos secundários"],
  ["Text", "#FFFFFF", "Texto principal"],
];

for (const [nome, hex, desc] of cores) {
  const y = doc.y;
  doc.rect(55, y, 14, 14).fill(hex).stroke();
  doc.fontSize(9).font("Helvetica-Bold").fillColor(BLACK)
    .text(nome, 76, y + 2, { continued: true, lineBreak: false });
  doc.font("Courier").fillColor(GRAY)
    .text(`  ${hex}`, { continued: true, lineBreak: false });
  doc.font("Helvetica").fillColor("#555555")
    .text(`  — ${desc}`, { lineBreak: true, lineGap: 3 });
}

doc.moveDown(0.3);
body("Fonte principal: Space Grotesk (pesos 300, 400, 500, 600, 700) — Google Fonts");
body("Bordas arredondadas padrão: 12–16px. Tab bar height: 60px (native) / 84px (web).");

divider();

// ─── 7. SEGURANÇA E BOAS PRÁTICAS ────────────────────────────────────────────
header("7. Segurança e Boas Práticas");

bullet("GEMINI_API_KEY armazenada como secret no Replit — nunca exposta no código");
bullet("Validação de entrada no endpoint da API (array messages obrigatório)");
bullet("CORS configurado no servidor Express");
bullet("Nenhuma chave ou dado sensível commitado no repositório");
bullet("Logs estruturados com Pino (req/res logging sem expor dados sensíveis)");
bullet("AbortController implementado no cliente mobile para cancelar requisições");
bullet("Tratamento de erros em todas as chamadas de API no frontend");

divider();

// ─── 8. LIMITAÇÕES E PRÓXIMOS PASSOS ─────────────────────────────────────────
header("8. Limitações Atuais e Próximos Passos");

subheader("Limitações Atuais");
bullet("Dados de leads e conversas são mockados (sem banco de dados persistente)");
bullet("Histórico do chat JADE não persiste após fechar o app");
bullet("Sem autenticação de usuários implementada");
bullet("Sem integração real com WhatsApp Business API");
bullet("A API Gemini 1.5-flash não está disponível na chave fornecida — usando 2.5-flash");
doc.moveDown(0.3);

subheader("Próximos Passos Recomendados");
bullet("Integrar banco de dados PostgreSQL (já disponível via Drizzle ORM no projeto)");
bullet("Adicionar autenticação com Replit Auth ou Clerk");
bullet("Conectar WhatsApp Business API para conversas reais");
bullet("Implementar streaming de respostas da JADE (SSE) para melhor UX");
bullet("Adicionar push notifications para novos leads e mensagens");
bullet("Criar tela de relatórios com gráficos de desempenho");
bullet("Deploy do app mobile via EAS Build (Expo Application Services)");

divider();

// ─── 9. RESUMO DE ARQUIVOS ────────────────────────────────────────────────────
header("9. Resumo Quantitativo");

const metricas = [
  ["Telas implementadas", "7"],
  ["Componentes React Native", "~35"],
  ["Endpoints de API", "2 (healthz + jade/chat)"],
  ["Leads mockados", "9"],
  ["Conversas mockadas", "5"],
  ["Pacotes instalados (mobile)", "@expo-google-fonts/space-grotesk, expo-print, expo-sharing, expo-file-system"],
  ["Pacotes instalados (api)", "@google/generative-ai"],
  ["Modelo de IA", "Google Gemini 2.5 Flash"],
  ["Versão do Expo SDK", "54"],
  ["Versão do React Native", "0.81.5"],
];

for (const [label, valor] of metricas) {
  doc.fontSize(9)
    .font("Helvetica-Bold")
    .fillColor(BLACK)
    .text(`${label}:`, 55, doc.y, { continued: true, lineBreak: false })
    .font("Helvetica")
    .fillColor("#555555")
    .text(`  ${valor}`, { lineBreak: true, lineGap: 4 });
}

// ─── RODAPÉ ──────────────────────────────────────────────────────────────────
doc.moveDown(2);
doc.fontSize(8)
  .fillColor(GRAY)
  .font("Helvetica")
  .text("JADE IA — Relatório de Auditoria Técnica  |  Gerado automaticamente via Replit Agent", {
    align: "center",
  });

doc.end();

doc.on("finish", () => {
  console.log(`PDF gerado: ${OUTPUT}`);
});
