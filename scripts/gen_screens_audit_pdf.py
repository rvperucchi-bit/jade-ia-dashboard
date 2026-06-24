#!/usr/bin/env python3
"""Gera o PDF da Auditoria Completa de Telas do app JADE IA."""
from fpdf import FPDF
import math

PINK   = (255, 0, 128)
DARK   = (20, 20, 30)
GRAY   = (110, 110, 130)
BORDER = (225, 225, 233)
WHITE  = (255, 255, 255)

STATUS = {
    "ok":   ("OK",       (0, 175, 120),  WHITE),
    "part": ("PARCIAL",  (240, 140, 20), WHITE),
    "crit": ("QUEBRADO", (220, 38, 60),  WHITE),
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
        self.cell(0, 5, "JADE IA  -  Auditoria Completa de Telas", align="L")
        self.cell(0, 5, "24/06/2026", align="R")
        self.ln(8)
        self.set_draw_color(*BORDER)
        self.set_line_width(0.2)
        self.line(M, self.get_y(), PAGE_W - M, self.get_y())
        self.ln(3)

    def footer(self):
        self.set_y(-12)
        self.set_font("Helvetica", "", 8)
        self.set_text_color(*GRAY)
        self.cell(0, 5, f"Pagina {self.page_no()}", align="C")


def t(s: str) -> str:
    return s.encode("latin-1", "replace").decode("latin-1")


pdf = PDF(orientation="P", unit="mm", format="A4")
pdf.set_auto_page_break(auto=True, margin=18)
pdf.set_margins(M, M, M)
pdf.add_page()

# ─── CAPA ──────────────────────────────────────────────────────────────────
pdf.set_fill_color(*DARK)
pdf.rect(0, 0, PAGE_W, 92, "F")
pdf.set_draw_color(*PINK)
pdf.set_line_width(2.2)
cx, cy, r = 175, 28, 14
prev = None
for deg in range(0, 300, 6):
    a = math.radians(deg)
    x, y = cx + r * math.cos(a), cy + r * math.sin(a)
    if prev:
        pdf.line(prev[0], prev[1], x, y)
    prev = (x, y)

pdf.set_y(32)
pdf.set_x(M)
pdf.set_font("Helvetica", "B", 11)
pdf.set_text_color(*PINK)
pdf.cell(0, 6, t("JADE IA"), new_x="LMARGIN", new_y="NEXT")
pdf.set_x(M)
pdf.set_font("Helvetica", "B", 24)
pdf.set_text_color(*WHITE)
pdf.cell(0, 12, t("Auditoria Completa de Telas"), new_x="LMARGIN", new_y="NEXT")
pdf.set_x(M)
pdf.set_font("Helvetica", "", 11.5)
pdf.set_text_color(220, 220, 230)
pdf.cell(0, 7, t("49 telas: render, botoes, onPress, TypeScript e rotas"), new_x="LMARGIN", new_y="NEXT")

pdf.ln(22)
pdf.set_text_color(*GRAY)
pdf.set_font("Helvetica", "", 10)
pdf.cell(0, 6, t("Data: 24 de junho de 2026"), new_x="LMARGIN", new_y="NEXT")
pdf.cell(0, 6, t("Verificacoes por tela: (1) renderiza (2) botoes com onPress"), new_x="LMARGIN", new_y="NEXT")
pdf.cell(0, 6, t("(3) onPress vazio/TODO (4) erro TS/import (5) rota inexistente"), new_x="LMARGIN", new_y="NEXT")
pdf.ln(4)

# legenda
pdf.set_x(M)
for code in ("ok", "part", "crit"):
    label, bg, _ = STATUS[code]
    pdf.set_fill_color(*bg)
    y0 = pdf.get_y()
    pdf.set_font("Helvetica", "B", 7)
    w = pdf.get_string_width(label) + 5
    pdf.set_xy(pdf.get_x(), y0)
    pdf.cell(w, 5, "", fill=True)
    pdf.set_xy(pdf.get_x() - w, y0)
    pdf.set_text_color(*WHITE)
    pdf.cell(w, 5, t(label), align="C")
    pdf.set_x(pdf.get_x() + 6)
pdf.ln(10)


def section_title(title):
    if pdf.get_y() > 250:
        pdf.add_page()
    pdf.ln(2)
    pdf.set_fill_color(*PINK)
    pdf.rect(M, pdf.get_y() + 1, 1.8, 7, "F")
    pdf.set_x(M + 4)
    pdf.set_font("Helvetica", "B", 12.5)
    pdf.set_text_color(*DARK)
    pdf.cell(0, 9, t(title), new_x="LMARGIN", new_y="NEXT")
    pdf.ln(1)


def screen(name, code, notes=None):
    """Cabecalho da tela com badge + notas opcionais."""
    notes = notes or []
    needed = 7 + len(notes) * 5
    if pdf.get_y() + needed > 275:
        pdf.add_page()
    y0 = pdf.get_y()
    label, bg, fg = STATUS[code]
    # badge
    pdf.set_font("Helvetica", "B", 7.5)
    bw = pdf.get_string_width(label) + 6
    pdf.set_fill_color(*bg)
    pdf.set_xy(M, y0 + 0.3)
    pdf.cell(bw, 5.5, "", fill=True)
    pdf.set_xy(M, y0 + 0.3)
    pdf.set_text_color(*fg)
    pdf.cell(bw, 5.5, t(label), align="C")
    # nome
    pdf.set_xy(M + bw + 3, y0)
    pdf.set_font("Helvetica", "B", 10)
    pdf.set_text_color(*DARK)
    pdf.cell(0, 6, t(name), new_x="LMARGIN", new_y="NEXT")
    # notas
    for n in notes:
        if pdf.get_y() > 275:
            pdf.add_page()
        pdf.set_x(M + 4)
        pdf.set_font("Helvetica", "", 8.8)
        pdf.set_text_color(70, 70, 85)
        pdf.multi_cell(CONTENT_W - 4, 4.6, t("- " + n))
    pdf.ln(1.5)


# ─── RESUMO ─────────────────────────────────────────────────────────────────
section_title("Resumo Consolidado")
pdf.set_x(M)
pdf.set_font("Helvetica", "B", 11)
pdf.set_text_color(*DARK)
pdf.cell(0, 7, t("33 telas OK    -    11 Parciais    -    5 Quebradas"), new_x="LMARGIN", new_y="NEXT")
pdf.ln(1)
pdf.set_x(M)
pdf.set_font("Helvetica", "", 9)
pdf.set_text_color(70, 70, 85)
pdf.multi_cell(CONTENT_W, 5, t(
    "Imports: zero imports quebrados nas 49 telas.   "
    "TypeScript: tsc --noEmit passa limpo.   "
    "Rotas: nenhuma navegacao aponta para rota inexistente."))
pdf.ln(2)

for code, txt in [
    ("crit", "login.tsx - 3 botoes sem onPress (Esqueci Senha, Google, Apple)"),
    ("crit", "relatorios.tsx - 100% dados falsos hardcoded, nunca chama API"),
    ("crit", "relatoriogestor.tsx - VENDEDORES=[], nada renderiza"),
    ("crit", "feedbackjade.tsx - VENDEDORES=[], tela inutil"),
    ("crit", "painelexecutivo.tsx - abas Ranking/Feed/CRM vazias permanentes"),
    ("part", "cadastro.tsx - signup simulado (setTimeout), sem API"),
    ("part", "conversas.tsx - onPress={() => {}} sem comentario (linha 394)"),
    ("part", "crm.tsx - 'Adicionar lead' so dispara Alert"),
    ("part", "pipeline.tsx - 'Adicionar' so dispara Alert"),
    ("part", "metas.tsx - dados hardcoded, GET /api/metas nunca chamado"),
    ("part", "planejamento.tsx + criarrota.tsx - USER_ID='u1' hardcoded"),
    ("part", "meutime.tsx - mock data, API de equipe nunca chamada"),
    ("part", "marketing.tsx - botao haptic-only, API de geracao nao usada"),
    ("part", "jade.tsx - catch{} vazio, erros suprimidos"),
    ("part", "splash.tsx - sempre vai p/ login mesmo autenticado"),
]:
    if pdf.get_y() > 272:
        pdf.add_page()
    y0 = pdf.get_y()
    label, bg, fg = STATUS[code]
    pdf.set_font("Helvetica", "B", 7)
    bw = pdf.get_string_width(label) + 5
    pdf.set_fill_color(*bg)
    pdf.set_xy(M, y0 + 0.3)
    pdf.cell(bw, 4.6, "", fill=True)
    pdf.set_xy(M, y0 + 0.3)
    pdf.set_text_color(*fg)
    pdf.cell(bw, 4.6, t(label), align="C")
    pdf.set_xy(M + bw + 3, y0)
    pdf.set_font("Helvetica", "", 8.6)
    pdf.set_text_color(*DARK)
    pdf.multi_cell(CONTENT_W - bw - 3, 4.8, t(txt))
    pdf.ln(0.4)

pdf.add_page()

# ─── GRUPO 1 ────────────────────────────────────────────────────────────────
section_title("Grupo 1 - Navegacao / Layout")
screen("index.tsx", "ok", ["Redireciona para /login."])
screen("_layout.tsx", "ok", ["Renderiza. Sem auth guard global (ver observacao de seguranca)."])
screen("(tabs)/_layout.tsx", "ok")
screen("(tabs)/index.tsx", "ok", ["Redirect para /(tabs)/jade."])
screen("(tabs)/mais.tsx", "ok", ["Redirect para /(tabs)/jade."])
screen("+not-found.tsx", "ok")

# ─── GRUPO 2 ────────────────────────────────────────────────────────────────
section_title("Grupo 2 - Autenticacao")
screen("splash.tsx", "part", [
    "Renderiza e navega para /login.",
    "Sempre vai para /login mesmo com usuario ja autenticado - sem checar token.",
])
screen("login.tsx", "crit", [
    "Renderiza, mas 3 botoes sem onPress nenhum:",
    "Linha 122: 'Esqueci minha senha' - sem handler.",
    "Linha 135: 'Entrar com Google' - sem handler.",
    "Linha 140: 'Entrar com Apple' - sem handler.",
    "Rotas /cadastro e /(tabs) existem. Sem erro de TS.",
])
screen("cadastro.tsx", "part", [
    "Renderiza, todos os botoes com onPress, rotas validas.",
    "Cadastro simulado (setTimeout + Alert) - nao chama API real.",
])
screen("onboarding.tsx", "ok", ["Renderiza, botoes com onPress, navega para /(tabs)."])
screen("sucesso.tsx", "ok", ["Auto-redireciona para /(tabs) apos animacao."])

# ─── GRUPO 3 ────────────────────────────────────────────────────────────────
section_title("Grupo 3 - Chat Principal")
screen("(tabs)/jade.tsx", "part", [
    "Renderiza (2004 linhas). Todos os 28 destinos do menu existem.",
    "saveCrmLeadToStorage: catch {} vazio - falha silenciosa.",
    "saveToCrm().catch(() => {}) - erros suprimidos silenciosamente.",
])
screen("(tabs)/conversas.tsx", "part", [
    "Renderiza. Botoes funcionais com onPress.",
    "Linha 394: onPress={() => {}} (provavel stop-propagation) sem comentario.",
])
screen("conversa/[id].tsx", "ok", ["Renderiza, voltar com router.back()."])
screen("historico.tsx", "ok", ["Renderiza, navega para /(tabs)/jade."])

# ─── GRUPO 4 ────────────────────────────────────────────────────────────────
section_title("Grupo 4 - Comercial")
screen("(tabs)/leads.tsx", "part", ["CRM_HISTORY e JADE_SUMMARIES hardcoded - dados ficticios."])
screen("crm.tsx", "part", ["Linha 473: 'Adicionar lead' so dispara Alert, sem form/navegacao."])
screen("pipeline.tsx", "part", ["Linha 243: 'Adicionar' so dispara Alert, sem acao real."])
screen("carteira.tsx", "ok", ["Botoes com logica real, integracao de visita + analise."])
screen("metas.tsx", "part", ["VENDEDORES hardcoded; GET /api/metas nunca chamado."])
screen("relatorios.tsx", "crit", [
    "Todos os dados hardcoded - sempre exibe dados falsos sem sinalizacao.",
    "GET /api/relatorios/diario e /semanal existem mas nunca sao chamados.",
])
screen("relatoriogestor.tsx", "crit", [
    "VENDEDORES=[] vazio - Top Performer e Precisa de Atencao nunca renderizam.",
])
screen("briefing.tsx", "ok", ["Renderiza, chama GET /api/empresa."])
screen("planejamento.tsx", "part", ["USER_ID='u1' hardcoded - nao usa usuario autenticado."])

# ─── GRUPO 5 ────────────────────────────────────────────────────────────────
section_title("Grupo 5 - Gestao")
screen("gestao.tsx", "ok", ["Todas as rotas dos cards existem."])
screen("painelexecutivo.tsx", "crit", [
    "KPI_DATA 100% hardcoded.",
    "Abas Ranking, Feed e CRM sao empty states permanentes - sem utilidade.",
])
screen("meutime.tsx", "part", [
    "Array MOCK ficticio; GET/POST /api/time nunca chamado.",
    "Modal 'Novo Colaborador' perde dados ao fechar.",
])
screen("feedbackexecutivo.tsx", "ok", ["GET/POST /api/feedback/executivo integrado."])
screen("feedbackjade.tsx", "crit", [
    "VENDEDORES=[] vazio - nenhum card renderiza, tela e inutil.",
])
screen("analise.tsx", "ok", ["Renderiza, chama /api/jade/chat."])
screen("notificacoes.tsx", "ok", ["Renderiza via useNotifications."])

# ─── GRUPO 6 ────────────────────────────────────────────────────────────────
section_title("Grupo 6 - Operacional")
screen("scanner.tsx", "ok", ["Integracao places/radar + search, navega para /loja?tab=1."])
screen("criarrota.tsx", "part", ["USER_ID='u1' hardcoded (mesmo problema de planejamento)."])
screen("laudo.tsx", "ok", ["Renderiza, chama /api/jade/chat."])

# ─── GRUPO 7 ────────────────────────────────────────────────────────────────
section_title("Grupo 7 - IA / Conteudo")
screen("marketing.tsx", "part", [
    "Linha 386: botao de card criativo so dispara haptic, sem acao real.",
    "POST /api/marketing/generate existe mas nunca e usado.",
])
screen("roleplay.tsx", "ok", ["Chama GET /api/empresa + /api/jade/chat."])
screen("biblioteca.tsx", "ok", ["Conteudo estatico (intencional)."])
screen("roteiro.tsx", "ok", ["Chama /api/empresa + /api/jade/chat."])
screen("objecoes.tsx", "ok")
screen("treinamento.tsx", "ok", ["Conteudo estatico; unico botao e router.back()."])

# ─── GRUPO 8 ────────────────────────────────────────────────────────────────
section_title("Grupo 8 - Perfil e Configuracoes")
screen("perfil.tsx", "ok")
screen("empresa.tsx", "ok", ["Renderiza, chama POST /api/empresa."])
screen("plano.tsx", "ok", ["Renderiza, chama POST /api/stripe/create-checkout."])
screen("loja.tsx", "ok", ["Checkout via Stripe, navega para /plano."])
screen("whatsapp-config.tsx", "ok", ["Botoes abrem links externos via Linking.openURL."])
screen("uso.tsx", "ok", ["Navega para /plano, /loja?tab=0 e /loja?tab=1."])
screen("ajuda.tsx", "ok")
screen("termos.tsx", "ok")
screen("privacidade.tsx", "ok")

# ─── OBSERVACAO FINAL ───────────────────────────────────────────────────────
section_title("Observacao de Seguranca")
pdf.set_x(M)
pdf.set_font("Helvetica", "", 9)
pdf.set_text_color(70, 70, 85)
pdf.multi_cell(CONTENT_W, 5, t(
    "Embora nao quebre nenhuma tela individualmente, o app nao possui um auth guard "
    "global em app/_layout.tsx. Um usuario que conheca a rota /(tabs)/jade pode acessar "
    "o app via deep link sem login. Recomendado adicionar verificacao de sessao no layout raiz."))

pdf.ln(5)
pdf.set_draw_color(*BORDER)
pdf.line(M, pdf.get_y(), PAGE_W - M, pdf.get_y())
pdf.ln(3)
pdf.set_x(M)
pdf.set_font("Helvetica", "I", 8.5)
pdf.set_text_color(*GRAY)
pdf.multi_cell(CONTENT_W, 4.5, t(
    "Relatorio gerado a partir da inspecao do codigo-fonte das 49 telas. "
    "Nenhum arquivo foi alterado durante a auditoria."))

OUT = "JADE_IA_Auditoria_Telas.pdf"
pdf.output(OUT)
print(f"PDF gerado: {OUT}")
