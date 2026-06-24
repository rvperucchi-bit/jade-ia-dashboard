#!/usr/bin/env python3
"""Gera o PDF da Auditoria do app JADE IA."""
from fpdf import FPDF

# ─── Paleta ───────────────────────────────────────────────────────────────
PINK   = (255, 0, 128)
DARK   = (20, 20, 30)
GRAY   = (110, 110, 130)
LIGHT  = (244, 244, 248)
WHITE  = (255, 255, 255)
BORDER = (225, 225, 233)

# Status badges: code -> (label, bg color, text color)
STATUS = {
    "crit": ("CRITICO",   (220, 38, 60),   WHITE),
    "part": ("PARCIAL",   (240, 140, 20),  WHITE),
    "inc":  ("INCOMPLETO",(225, 185, 30),  DARK),
    "ok":   ("OK",        (0, 175, 120),   WHITE),
    "dead": ("MORTO",     (120, 120, 135), WHITE),
    "info": ("INFO",      (90, 120, 220),  WHITE),
}

PAGE_W = 210
M = 15
CONTENT_W = PAGE_W - 2 * M


class PDF(FPDF):
    def header(self):
        if self.page_no() == 1:
            return
        self.set_y(8)
        self.set_font("Helvetica", "", 8)
        self.set_text_color(*GRAY)
        self.cell(0, 5, "JADE IA  -  Relatorio de Auditoria", align="L")
        self.cell(0, 5, "24/06/2026", align="R")
        self.ln(8)
        self.set_draw_color(*BORDER)
        self.set_line_width(0.2)
        self.line(M, self.get_y(), PAGE_W - M, self.get_y())
        self.ln(4)

    def footer(self):
        self.set_y(-12)
        self.set_font("Helvetica", "", 8)
        self.set_text_color(*GRAY)
        self.cell(0, 5, f"Pagina {self.page_no()}", align="C")


def t(s: str) -> str:
    """Sanitiza para Latin-1 (core fonts)."""
    return s.encode("latin-1", "replace").decode("latin-1")


pdf = PDF(orientation="P", unit="mm", format="A4")
pdf.set_auto_page_break(auto=True, margin=18)
pdf.set_margins(M, M, M)
pdf.add_page()

# ─── CAPA ──────────────────────────────────────────────────────────────────
pdf.set_fill_color(*DARK)
pdf.rect(0, 0, PAGE_W, 90, "F")
# anel rosa quebrado (decorativo) - arcos
pdf.set_draw_color(*PINK)
pdf.set_line_width(2.2)
import math
cx, cy, r = 175, 28, 14
prev = None
for deg in range(0, 300, 6):  # arco quebrado (300 graus)
    a = math.radians(deg)
    x, y = cx + r * math.cos(a), cy + r * math.sin(a)
    if prev:
        pdf.line(prev[0], prev[1], x, y)
    prev = (x, y)

pdf.set_y(34)
pdf.set_x(M)
pdf.set_font("Helvetica", "B", 11)
pdf.set_text_color(*PINK)
pdf.cell(0, 6, t("JADE IA"), ln=1)
pdf.set_x(M)
pdf.set_font("Helvetica", "B", 26)
pdf.set_text_color(*WHITE)
pdf.cell(0, 13, t("Relatorio de Auditoria"), ln=1)
pdf.set_x(M)
pdf.set_font("Helvetica", "", 12)
pdf.set_text_color(220, 220, 230)
pdf.cell(0, 7, t("Inspecao completa de telas, navegacao, rotas e integracoes"), ln=1)

pdf.ln(20)
pdf.set_text_color(*GRAY)
pdf.set_font("Helvetica", "", 10)
pdf.cell(0, 6, t("Data: 24 de junho de 2026"), ln=1)
pdf.cell(0, 6, t("Escopo: 49 telas + API Server + Navegacao + Integracoes"), ln=1)
pdf.ln(6)


# ─── Helpers de layout ──────────────────────────────────────────────────────
def section_title(num, title):
    if pdf.get_y() > 250:
        pdf.add_page()
    pdf.ln(3)
    pdf.set_fill_color(*PINK)
    pdf.rect(M, pdf.get_y() + 1, 1.8, 7, "F")
    pdf.set_x(M + 4)
    pdf.set_font("Helvetica", "B", 13)
    pdf.set_text_color(*DARK)
    pdf.cell(0, 9, t(f"{num}.  {title}"), ln=1)
    pdf.ln(1)


def screen_name(name, desc=""):
    if pdf.get_y() > 262:
        pdf.add_page()
    pdf.ln(1.5)
    pdf.set_font("Helvetica", "B", 10.5)
    pdf.set_text_color(*PINK)
    pdf.cell(0, 6, t(name), ln=1)
    if desc:
        pdf.set_font("Helvetica", "I", 8.5)
        pdf.set_text_color(*GRAY)
        pdf.cell(0, 4.5, t(desc), ln=1)


def badge(code, x, y):
    label, bg, fg = STATUS[code]
    pdf.set_font("Helvetica", "B", 7)
    w = pdf.get_string_width(label) + 5
    pdf.set_fill_color(*bg)
    pdf.set_xy(x, y)
    pdf.cell(w, 5, "", fill=True, border=0)  # bg rect
    pdf.set_xy(x, y)
    pdf.set_text_color(*fg)
    pdf.cell(w, 5, t(label), align="C")
    return w


def row(code, text):
    """Linha: badge colorido + texto que quebra."""
    if pdf.get_y() > 268:
        pdf.add_page()
    y0 = pdf.get_y()
    badge_w = 24
    # desenha badge
    bw = badge(code, M, y0 + 0.3)
    # texto
    pdf.set_xy(M + badge_w, y0)
    pdf.set_font("Helvetica", "", 9)
    pdf.set_text_color(*DARK)
    pdf.multi_cell(CONTENT_W - badge_w, 5, t(text), align="L")
    y1 = pdf.get_y()
    if y1 - y0 < 6:
        pdf.set_y(y0 + 6)
    pdf.ln(0.5)


def kv_table(rows, col1_w=70):
    """Tabela simples de 2 colunas."""
    for k, v in rows:
        if pdf.get_y() > 270:
            pdf.add_page()
        y0 = pdf.get_y()
        pdf.set_font("Helvetica", "B", 9)
        pdf.set_text_color(*DARK)
        pdf.multi_cell(col1_w, 5, t(k), align="L")
        yk = pdf.get_y()
        pdf.set_xy(M + col1_w, y0)
        pdf.set_font("Helvetica", "", 9)
        pdf.set_text_color(60, 60, 75)
        pdf.multi_cell(CONTENT_W - col1_w, 5, t(v), align="L")
        yv = pdf.get_y()
        pdf.set_y(max(yk, yv) + 1)


def summary_box(items):
    """Caixa de resumo executivo com contagens."""
    pdf.ln(2)
    for label, count, code in items:
        if pdf.get_y() > 270:
            pdf.add_page()
        _, bg, _ = STATUS[code]
        y0 = pdf.get_y()
        pdf.set_fill_color(*bg)
        pdf.rect(M, y0 + 1, 4, 4, "F")
        pdf.set_xy(M + 7, y0)
        pdf.set_font("Helvetica", "B", 11)
        pdf.set_text_color(*DARK)
        pdf.cell(12, 6, str(count))
        pdf.set_font("Helvetica", "", 9.5)
        pdf.set_text_color(60, 60, 75)
        pdf.cell(0, 6, t(label), ln=1)
    pdf.ln(2)


# ─── RESUMO EXECUTIVO ───────────────────────────────────────────────────────
section_title("", "Resumo Executivo")
pdf.set_x(M)
pdf.set_font("Helvetica", "", 9.5)
pdf.set_text_color(60, 60, 75)
pdf.multi_cell(CONTENT_W, 5, t(
    "Auditoria de 49 telas do aplicativo JADE IA, cobrindo navegacao, botoes de "
    "voltar, links internos, menus, rotas, formularios, filtros e integracoes com a "
    "API. Abaixo, o panorama geral por severidade."))
summary_box([
    ("Telas quebradas / completamente inutilizaveis", 4, "crit"),
    ("Telas parciais / sempre exibem dado falso", 9, "part"),
    ("Telas funcionais mas incompletas / sem persistencia", 8, "inc"),
    ("Telas funcionando corretamente", 28, "ok"),
    ("Endpoints da API definidos mas nunca chamados", 22, "dead"),
])

# ─── 1. AUTENTICACAO ────────────────────────────────────────────────────────
section_title("1", "Fluxo de Autenticacao")

screen_name("splash.tsx")
row("ok",   "Animacao e timer de 1.8s redirecionando para /login.")
row("inc",  "Sempre vai para /login mesmo com usuario ja logado. Deveria verificar o token e ir direto para /(tabs)/jade.")

screen_name("login.tsx")
row("ok",   "Login com e-mail + senha (POST /api/auth/login), navegacao para /(tabs).")
row("crit", "'Esqueci minha senha' - botao visivel, completamente sem acao (no-op).")
row("crit", "'Entrar com Google' e 'Entrar com Apple' - botoes visuais, sem nenhuma logica.")

screen_name("cadastro.tsx")
row("ok",   "Validacao de formulario completa (campos, mascara de telefone, match de senha, termos).")
row("crit", "Cadastro 100% simulado - usa setTimeout + Alert, nao chama API. Nenhum usuario e realmente criado.")
row("ok",   "Links /termos e /privacidade existem e funcionam.")

screen_name("onboarding.tsx")
row("ok",   "Salva em AsyncStorage, redireciona para /(tabs).")
row("inc",  "firstModule hardcoded como string vazia no handleSave.")

screen_name("app/_layout.tsx (raiz)")
row("crit", "Sem guard de autenticacao global. Usuario que souber a rota /(tabs)/jade pode acessar via deep link sem login.")

# ─── 2. CHAT PRINCIPAL ──────────────────────────────────────────────────────
section_title("2", "Tela Principal - JADE Chat")

screen_name("(tabs)/jade.tsx", "2004 linhas - area central do app")
row("ok",   "Chat com IA (POST /api/jade/chat) completo, com timeout e AbortController.")
row("ok",   "Transcricao de voz nativa (expo-av -> base64 -> /api/jade/transcribe -> Whisper).")
row("ok",   "Sidebar esquerdo (drawer) com accordion: 6 grupos de menu, todas as rotas existem.")
row("ok",   "Drawer direito de modulos IA (7 modulos toggle).")
row("ok",   "Quick replies (Radar, Agendamento, Prospeccao) e salvamento de sessao no historico.")
row("ok",   "Abordagem WhatsApp (/api/jade/approach) e auto-save de lead no CRM (/api/jade/crm).")
row("inc",  "saveCrmLeadToStorage: bloco catch vazio - falha silenciosa se AsyncStorage falhar.")
row("inc",  "handleJadeApproach: .catch(() => {}) - persistencia local ignorada silenciosamente.")
row("inc",  "Modulos do drawer direito alternam estado mas nao mudam visivelmente o comportamento do chat.")

screen_name("(tabs)/conversas.tsx")
row("ok",   "Lista de conversas via AsyncStorage, toggle JADE (GET/POST /api/jade/status).")
row("ok",   "Limite de mensagens por lead (msgLimit) e navegacao para /conversa/:id.")

screen_name("conversa/[id].tsx")
row("ok",   "Le mensagens do AppContext via parametro id.")
row("inc",  "Dados vem do contexto de memoria - sem fetch de API, nao sincroniza com backend.")

# ─── 3. COMERCIAIS ──────────────────────────────────────────────────────────
section_title("3", "Telas Comerciais")

screen_name("(tabs)/leads.tsx")
row("ok",   "Kanban visual, filtro Hot/All, estados vazios por coluna.")
row("part", "CRM_HISTORY e JADE_SUMMARIES sao arrays hardcoded - dados ficticios sempre exibidos.")

screen_name("crm.tsx")
row("ok",   "Leitura/escrita via AsyncStorage (crm_leads), busca e filtro por status, estado vazio.")
row("inc",  "Sem sincronizacao com backend - dados existem apenas no dispositivo.")

screen_name("pipeline.tsx")
row("ok",   "Filtro por estagio, lista de deals via AsyncStorage.")
row("inc",  "Mesma limitacao do CRM - apenas local.")

screen_name("carteira.tsx")
row("ok",   "Filtros completos, estado vazio, POST /api/carteira/:id/visita e analise via IA.")
row("inc",  "SEED inicial e array vazio - tela comeca sempre sem dados.")

screen_name("metas.tsx")
row("part", "VENDEDORES hardcoded com 4 pessoas ficticias (Ana, Carlos, Mariana, Diego).")
row("ok",   "Geracao de estrategia via /api/jade/chat.")
row("inc",  "GET /api/metas existe no servidor mas nunca e chamado.")

screen_name("relatorios.tsx")
row("crit", "100% mock - todas as metricas hardcoded. Sempre exibe dados falsos, sem estado vazio, sem API.")
row("dead", "GET /api/relatorios/diario e /semanal existem no servidor - nunca chamados.")

screen_name("relatoriogestor.tsx")
row("part", "VENDEDORES e array vazio - 'Top Performer' e 'Precisa de Atencao' nunca renderizam.")
row("ok",   "Relatorio mensal e estrategia via /api/jade/chat.")

screen_name("briefing.tsx")
row("ok",   "GET /api/empresa + useJADE para geracao de briefing, com botao de voltar.")

screen_name("planejamento.tsx")
row("ok",   "GET/POST /api/planejamento/:userId/hoje integrado.")
row("part", "USER_ID hardcoded como 'u1' (TODO explicito) - nao usa o usuario logado.")

# ─── 4. GESTAO ──────────────────────────────────────────────────────────────
section_title("4", "Telas de Gestao")

screen_name("gestao.tsx")
row("ok",   "Hub de cards com navegacao para submodulos (todos existem) e notificacao para time.")

screen_name("painelexecutivo.tsx")
row("part", "KPI_DATA 100% hardcoded. Comentario no codigo: 'ranking e feed virao de API real'.")
row("crit", "Abas Ranking, Feed e CRM sao empty states sem dados - tela sem utilidade real.")

screen_name("meutime.tsx")
row("part", "Array MOCK com membros ficticios - nunca persiste.")
row("inc",  "Modal 'Novo Colaborador' salva apenas em estado local (perde ao fechar).")
row("dead", "GET/POST /api/time existe no servidor mas nunca e chamado.")

screen_name("feedbackexecutivo.tsx")
row("ok",   "GET/POST /api/feedback/executivo integrado, formulario completo.")

screen_name("feedbackjade.tsx")
row("crit", "VENDEDORES e array completamente vazio - a tela nao renderiza nenhum card, esta inutil.")

screen_name("analise.tsx")
row("ok",   "Analise via useJADE (POST /api/jade/chat).")

screen_name("notificacoes.tsx")
row("ok",   "Le de useNotifications context (AsyncStorage).")
row("inc",  "GET /api/notificacoes existe mas nao e usado - dados apenas locais.")

# ─── 5. OPERACIONAIS ────────────────────────────────────────────────────────
section_title("5", "Telas Operacionais")

screen_name("scanner.tsx", "Uma das telas mais completas do app")
row("ok",   "POST /api/places/radar e /api/places/search integrados.")
row("ok",   "Checkout via /api/stripe/create-checkout-searches, auto-localizacao, limites por plano.")

screen_name("criarrota.tsx")
row("ok",   "GET /api/planejamento/u1/hoje + useJADE.")
row("part", "Mesma limitacao do USER_ID hardcoded 'u1'.")

screen_name("laudo.tsx")
row("ok",   "useJADE para geracao de laudo, formulario completo.")

# ─── 6. IA / CONTEUDO ───────────────────────────────────────────────────────
section_title("6", "Telas de IA / Conteudo")

screen_name("marketing.tsx")
row("crit", "100% client-side. 'Criar com JADE' dispara apenas haptic + Alert, sem chamar API.")
row("dead", "POST /api/marketing/generate e GET /api/marketing/campaigns existem - nunca usados.")

screen_name("roleplay.tsx")
row("ok",   "GET /api/empresa + POST /api/jade/chat, cenarios de simulacao.")
row("inc",  "Gated como Enterprise mas sem verificacao de plano no codigo da tela.")

screen_name("biblioteca.tsx / treinamento.tsx")
row("ok",   "Conteudo educacional completo (estatico, intencional).")

screen_name("roteiro.tsx / objecoes.tsx")
row("ok",   "Integrado com /api/empresa + /api/jade/chat.")

screen_name("historico.tsx")
row("ok",   "Carrega sessoes do AsyncStorage, navega para /(tabs)/jade com session ID.")

# ─── 7. PERFIL / CONFIG ─────────────────────────────────────────────────────
section_title("7", "Perfil e Configuracoes")

screen_name("perfil.tsx")
row("ok",   "Salva em AsyncStorage + useProfile context.")
row("inc",  "Sem sincronizacao com backend.")

screen_name("empresa.tsx")
row("ok",   "POST /api/empresa + AsyncStorage, formulario muito completo.")

screen_name("plano.tsx")
row("ok",   "POST /api/stripe/create-checkout integrado.")
row("inc",  "USED e LIMIT parecem hardcoded - verificar se refletem uso real.")

screen_name("loja.tsx")
row("ok",   "Checkout de mensagens e buscas via Stripe.")

screen_name("whatsapp-config.tsx")
row("info", "Tela puramente instrucional, sem integracao real. Toggle visual mas sem efeito.")

screen_name("uso.tsx")
row("ok",   "Le dos contextos (Credits/Plan), navega para /plano e /loja.")

screen_name("ajuda.tsx / termos.tsx / privacidade.tsx")
row("ok",   "Conteudo estatico, botao de voltar presente.")

# ─── 8. API SERVER ──────────────────────────────────────────────────────────
section_title("8", "Analise da API Server")

pdf.set_x(M)
pdf.set_font("Helvetica", "B", 9.5)
pdf.set_text_color(*DARK)
pdf.cell(0, 6, t("Endpoints mortos (definidos no servidor, nunca chamados pelo app):"), ln=1)
kv_table([
    ("GET/POST /api/activity", "Log de atividade nunca registrado."),
    ("GET /api/analytics/dashboard", "Dashboard nunca carrega dados reais."),
    ("POST /api/auth/logout", "Logout nao invalida token no servidor."),
    ("GET /api/dashboard/gestor", "Painel do gestor sem dados reais."),
    ("POST /api/feedback/gerar", "Geracao de feedback via IA sem uso."),
    ("/api/marketing/generate, /campaigns", "Marketing IA nunca gera via servidor."),
    ("GET /api/metas, PUT /api/metas/:id", "CRUD de metas nao conectado ao app."),
    ("GET /api/modules/* (6 rotas)", "Toda a API de modulos sem uso."),
    ("/api/relatorios/diario, /semanal", "Relatorios sempre mostram mock."),
    ("GET/POST /api/time", "CRUD de equipe nunca chamado."),
    ("PATCH /api/jade/crm/:id", "Edicao de lead CRM via API sem uso."),
    ("POST /api/jade/prospectar", "Fluxo de prospeccao autonoma sem uso."),
    ("GET /api/stripe/subscription/:email", "Verificacao de assinatura ativa sem uso."),
], col1_w=72)

pdf.ln(2)
pdf.set_x(M)
pdf.set_font("Helvetica", "B", 9.5)
pdf.set_text_color(*DARK)
pdf.cell(0, 6, t("Seguranca:"), ln=1)
row("ok",   "Rate limiting configurado (30 req/min IA, 120 req/min geral).")
row("crit", "verifyToken definido mas NAO aplicado em nenhuma rota - API completamente aberta.")
row("ok",   "Variaveis de ambiente (OPENAI/GEMINI/GOOGLE_MAPS) referenciadas via process.env.")

# ─── 9. NAVEGACAO ───────────────────────────────────────────────────────────
section_title("9", "Problemas de Navegacao Globais")
kv_table([
    ("Sem guard global de auth", "app/_layout.tsx"),
    ("splash nao verifica token existente", "splash.tsx"),
    ("USER_ID = 'u1' hardcoded", "planejamento.tsx, criarrota.tsx"),
    ("Rota /mais ainda no _layout das tabs", "(tabs)/_layout.tsx (agora so redirect)"),
], col1_w=72)

# ─── 10. PRIORIDADES ────────────────────────────────────────────────────────
section_title("10", "Prioridades de Correcao")

pdf.set_x(M)
pdf.set_font("Helvetica", "B", 10)
pdf.set_text_color(*STATUS["crit"][1])
pdf.cell(0, 6, t("P0 - Critico (quebra experiencia ou seguranca)"), ln=1)
for i, x in enumerate([
    "cadastro.tsx - cadastro mock, usuario acha que criou conta mas nao criou.",
    "feedbackjade.tsx - tela completamente vazia (VENDEDORES = []).",
    "_layout.tsx - sem guard de autenticacao global.",
    "verifyToken - middleware de auth nao aplicado nas rotas da API.",
    "relatorios.tsx - dados 100% falsos sem sinalizacao ao usuario.",
], 1):
    pdf.set_x(M)
    pdf.set_font("Helvetica", "", 9)
    pdf.set_text_color(*DARK)
    pdf.multi_cell(CONTENT_W, 5, t(f"{i}.  {x}"))

pdf.ln(1.5)
pdf.set_x(M)
pdf.set_font("Helvetica", "B", 10)
pdf.set_text_color(*STATUS["part"][1])
pdf.cell(0, 6, t("P1 - Importante (funcionalidade prometida mas ausente)"), ln=1)
for i, x in enumerate([
    "login.tsx - 'Esqueci minha senha' sem acao.",
    "painelexecutivo.tsx - ranking/feed/CRM sem dados reais.",
    "metas.tsx + meutime.tsx - dados ficticios hardcoded.",
    "marketing.tsx - 'Criar com JADE' sem funcao real.",
    "planejamento.tsx - USER_ID hardcoded 'u1'.",
    "splash.tsx - deveria redirecionar direto se ja logado.",
    "POST /api/auth/logout - nunca chamado, token nao invalidado no servidor.",
], 6):
    pdf.set_x(M)
    pdf.set_font("Helvetica", "", 9)
    pdf.set_text_color(*DARK)
    pdf.multi_cell(CONTENT_W, 5, t(f"{i}.  {x}"))

pdf.ln(1.5)
pdf.set_x(M)
pdf.set_font("Helvetica", "B", 10)
pdf.set_text_color(*STATUS["inc"][1])
pdf.cell(0, 6, t("P2 - Melhoria (qualidade e consistencia)"), ln=1)
for i, x in enumerate([
    "Conectar GET /api/metas e GET/POST /api/time ao app (substituir mocks).",
    "Conectar GET /api/relatorios/diario e /semanal ao relatorios.tsx.",
    "Sincronizar CRM/Pipeline com backend (hoje so AsyncStorage local).",
    "Modulos do drawer direito (jade.tsx) sem feedback visual de estado ativo.",
    "saveCrmLeadToStorage com catch vazio - adicionar log ou notificacao de erro.",
    "login.tsx - remover ou conectar botoes Google/Apple.",
], 13):
    pdf.set_x(M)
    pdf.set_font("Helvetica", "", 9)
    pdf.set_text_color(*DARK)
    pdf.multi_cell(CONTENT_W, 5, t(f"{i}.  {x}"))

# ─── Rodape final ───────────────────────────────────────────────────────────
pdf.ln(6)
pdf.set_draw_color(*BORDER)
pdf.line(M, pdf.get_y(), PAGE_W - M, pdf.get_y())
pdf.ln(3)
pdf.set_x(M)
pdf.set_font("Helvetica", "I", 8.5)
pdf.set_text_color(*GRAY)
pdf.multi_cell(CONTENT_W, 4.5, t(
    "Relatorio gerado automaticamente a partir da inspecao do codigo-fonte. "
    "Nenhum arquivo foi alterado durante a auditoria."))

OUT = "JADE_IA_Auditoria.pdf"
pdf.output(OUT)
print(f"PDF gerado: {OUT}")
