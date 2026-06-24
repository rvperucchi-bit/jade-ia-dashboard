#!/usr/bin/env python3
"""Gera o PDF da Auditoria de Arquitetura de IA do app JADE IA."""
import math
from fpdf import FPDF

# ─── Paleta ───────────────────────────────────────────────────────────────
PINK   = (255, 0, 128)
DARK   = (20, 20, 30)
GRAY   = (110, 110, 130)
LIGHT  = (244, 244, 248)
WHITE  = (255, 255, 255)
BORDER = (225, 225, 233)
PURPLE = (108, 99, 255)
GREEN  = (0, 175, 120)

LEVEL = {
    "alto":  ("ALTO",  (220, 38, 60),  WHITE),
    "medio": ("MEDIO", (240, 140, 20), WHITE),
    "baixo": ("BAIXO", (0, 175, 120),  WHITE),
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
        self.cell(0, 5, "JADE IA  -  Auditoria de Arquitetura de IA", align="L")
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
pdf.rect(0, 0, PAGE_W, 95, "F")
# anel rosa quebrado (decorativo)
pdf.set_draw_color(*PINK)
pdf.set_line_width(2.2)
cx, cy, r = 175, 30, 14
prev = None
for deg in range(0, 300, 6):
    a = math.radians(deg)
    x, y = cx + r * math.cos(a), cy + r * math.sin(a)
    if prev:
        pdf.line(prev[0], prev[1], x, y)
    prev = (x, y)

pdf.set_y(36)
pdf.set_x(M)
pdf.set_font("Helvetica", "B", 11)
pdf.set_text_color(*PINK)
pdf.cell(0, 6, t("JADE IA"), ln=1)
pdf.set_x(M)
pdf.set_font("Helvetica", "B", 24)
pdf.set_text_color(*WHITE)
pdf.cell(0, 12, t("Auditoria de Arquitetura de IA"), ln=1)
pdf.set_x(M)
pdf.set_font("Helvetica", "", 12)
pdf.set_text_color(220, 220, 230)
pdf.cell(0, 7, t("Mapeamento completo de uso de Gemini/OpenAI e proposta de abstracao"), ln=1)

pdf.ln(22)
pdf.set_text_color(*GRAY)
pdf.set_font("Helvetica", "", 10)
pdf.cell(0, 6, t("Data: 24 de junho de 2026"), ln=1)
pdf.cell(0, 6, t("Modo: somente leitura - sem alteracao de codigo"), ln=1)
pdf.cell(0, 6, t("Escopo: API Server + 9 telas mobile + proposta JADE AI Engine"), ln=1)
pdf.ln(8)


# ─── Helpers de layout ──────────────────────────────────────────────────────
def section_title(num, title):
    if pdf.get_y() > 248:
        pdf.add_page()
    pdf.ln(3)
    pdf.set_fill_color(*PINK)
    pdf.rect(M, pdf.get_y() + 1, 1.8, 7, "F")
    pdf.set_x(M + 4)
    pdf.set_font("Helvetica", "B", 13)
    pdf.set_text_color(*DARK)
    pdf.cell(0, 9, t(f"{num}.  {title}"), ln=1)
    pdf.ln(1)


def subtitle(text):
    if pdf.get_y() > 258:
        pdf.add_page()
    pdf.ln(1)
    pdf.set_font("Helvetica", "B", 10.5)
    pdf.set_text_color(*PINK)
    pdf.cell(0, 6, t(text), ln=1)
    pdf.ln(0.5)


def body(text, bold=False):
    if pdf.get_y() > 262:
        pdf.add_page()
    pdf.set_font("Helvetica", "B" if bold else "", 9.5)
    pdf.set_text_color(*DARK)
    pdf.set_x(M)
    pdf.multi_cell(CONTENT_W, 5, t(text))
    pdf.ln(0.5)


def bullet(text, color=DARK):
    if pdf.get_y() > 264:
        pdf.add_page()
    pdf.set_font("Helvetica", "", 9.5)
    pdf.set_text_color(*PINK)
    pdf.set_x(M + 1)
    pdf.cell(4, 5, t("-"))
    pdf.set_text_color(*color)
    pdf.set_x(M + 5)
    pdf.multi_cell(CONTENT_W - 5, 5, t(text))


def kv(key, val):
    if pdf.get_y() > 264:
        pdf.add_page()
    pdf.set_font("Helvetica", "B", 9)
    pdf.set_text_color(*DARK)
    pdf.set_x(M + 1)
    pdf.cell(60, 5.5, t(key))
    pdf.set_font("Helvetica", "", 9)
    pdf.set_text_color(*GRAY)
    pdf.multi_cell(CONTENT_W - 60, 5.5, t(val))


def table(headers, rows, widths):
    if pdf.get_y() > 250:
        pdf.add_page()
    # header
    pdf.set_font("Helvetica", "B", 8)
    pdf.set_fill_color(*DARK)
    pdf.set_text_color(*WHITE)
    pdf.set_x(M)
    for h, w in zip(headers, widths):
        pdf.cell(w, 7, t(h), border=0, align="L", fill=True)
    pdf.ln(7)
    # rows
    pdf.set_font("Helvetica", "", 8)
    fill = False
    for row in rows:
        # measure height
        line_counts = []
        for cell, w in zip(row, widths):
            n = pdf.multi_cell(w, 4.5, t(str(cell)), split_only=True)
            line_counts.append(len(n))
        h = max(line_counts) * 4.5 + 1
        if pdf.get_y() + h > 278:
            pdf.add_page()
            pdf.set_font("Helvetica", "B", 8)
            pdf.set_fill_color(*DARK)
            pdf.set_text_color(*WHITE)
            pdf.set_x(M)
            for hh, w in zip(headers, widths):
                pdf.cell(w, 7, t(hh), border=0, align="L", fill=True)
            pdf.ln(7)
            pdf.set_font("Helvetica", "", 8)
        y0 = pdf.get_y()
        x0 = M
        pdf.set_fill_color(*(LIGHT if fill else WHITE))
        pdf.set_text_color(*DARK)
        for cell, w in zip(row, widths):
            x = pdf.get_x()
            y = pdf.get_y()
            pdf.multi_cell(w, 4.5, t(str(cell)), border=0, fill=True, max_line_height=4.5)
            pdf.set_xy(x + w, y)
        pdf.set_xy(x0, y0 + h)
        fill = not fill
    pdf.ln(2)


def risk_row(code, level, text):
    if pdf.get_y() > 262:
        pdf.add_page()
    lab, bg, fg = LEVEL[level]
    pdf.set_x(M)
    pdf.set_font("Helvetica", "B", 8)
    pdf.set_fill_color(*bg)
    pdf.set_text_color(*fg)
    pdf.cell(14, 5.5, t(code), align="C", fill=True)
    pdf.cell(2, 5.5, "")
    pdf.set_fill_color(*bg)
    pdf.cell(16, 5.5, t(lab), align="C", fill=True)
    pdf.ln(6)
    pdf.set_x(M)
    pdf.set_font("Helvetica", "", 9)
    pdf.set_text_color(*DARK)
    pdf.multi_cell(CONTENT_W, 5, t(text))
    pdf.ln(1.5)


# ─── 1. RESUMO EXECUTIVO ────────────────────────────────────────────────────
section_title(1, "Resumo Executivo")
body("O projeto JADE IA usa Gemini 2.5 Flash como unico provedor de linguagem. "
     "Toda a inteligencia reside no servidor (Express API); o app mobile nunca chama "
     "um SDK de IA diretamente - apenas faz fetch para endpoints REST proprios.")
body("Nao existe uma camada de abstracao de IA: os dois arquivos que chamam o Gemini "
     "instanciam o cliente diretamente dentro de cada handler de rota. Os prompts estao "
     "distribuidos em tres localizacoes - dentro de jade.ts, dentro de marketing.ts e "
     "embutidos em 9 telas do mobile como strings inline dentro de chamadas HTTP.")
body("Descoberta relevante: o endpoint /api/jade/transcribe (transcricao de voz) JA usa "
     "a OpenAI (OPENAI_API_KEY) via fetch direto para Whisper-1, sem o SDK openai instalado. "
     "O projeto ja depende de dois provedores simultaneamente, mas de forma nao declarada.")

# ─── 2. INVENTARIO ──────────────────────────────────────────────────────────
section_title(2, "Inventario de Provedores e SDKs")
kv("SDK de IA instalado", "@google/generative-ai v0.24.1")
kv("Modelo de linguagem", "gemini-2.5-flash (hardcoded em 5 lugares)")
kv("SDK OpenAI instalado", "Nao - chamada via fetch nativo")
kv("GEMINI_API_KEY", "Configurada (em uso)")
kv("OPENAI_API_KEY", "Configurada (em uso - Whisper)")
kv("Modelo de voz", "whisper-1 via OpenAI REST direto")
kv("SDK Anthropic", "Nao instalado, nao referenciado")
kv("IA no mobile (SDK nativo)", "Nenhum - mobile e 100% thin client")

# ─── 3. ARQUIVOS COM CHAMADAS DE IA ─────────────────────────────────────────
section_title(3, "Arquivos que Chamam Modelos de IA")
subtitle("3.1  No servidor (chamadas reais)")
table(
    ["Arquivo", "Linhas", "Provedores", "Instancias"],
    [
        ["routes/jade.ts", "1.167", "Gemini + OpenAI", "4x getGenerativeModel"],
        ["routes/marketing.ts", "71", "Gemini", "1 por request"],
    ],
    [70, 18, 50, 47],
)
body("Os outros 17 arquivos de rota nao fazem nenhuma chamada de IA. feedback.ts tem um "
     "endpoint /gerar que constroi e retorna um prompt como string JSON para o cliente "
     "usar - ele nunca chama o modelo diretamente.")

subtitle("3.2  No mobile (prompts inline em chamadas HTTP)")
table(
    ["Arquivo mobile", "Funcao", "Caracteristica do prompt"],
    [
        ["(tabs)/jade.tsx", "Chat principal, CRM, abordagem", "messages[] com historico - uso correto"],
        ["marketing.tsx", "Gerar post social", "Chama /jade/chat (roteamento errado)"],
        ["metas.tsx", "Estrategia de metas", "Prompt com dados do time em runtime"],
        ["planejamento.tsx", "Sugestao diaria", "Template com itens do planejamento"],
        ["relatorios.tsx", "Analise diaria/semanal", "Metricas hardcoded ficticias!"],
        ["roleplay.tsx", "Simulacao + feedback", "Injeta [SYSTEM: ...] no content"],
        ["relatoriogestor.tsx", "Relatorio + estrategia", "2 chamadas encadeadas"],
        ["feedbackjade.tsx", "Feedback de vendedor", "Injeta [SYSTEM: ...] no content"],
        ["carteira.tsx", "Analise da carteira", "Prompt com resumo de clientes"],
    ],
    [42, 50, 88],
)
body("Hook auxiliar hooks/useJADE.ts: wrapper que centraliza o fetch para /api/jade/chat "
     "com retry automatico (1 tentativa apos 1,5s). E uma boa base, mas usado so em alguns "
     "casos - as telas acima fazem seus proprios fetch diretos.")

# ─── 4. ONDE OS PROMPTS SAO MONTADOS ────────────────────────────────────────
section_title(4, "Onde os Prompts sao Montados")
body("Os prompts estao distribuidos em 3 localizacoes distintas, sem centralizacao:", bold=True)
bullet("jade.ts - JADE_SYSTEM_PROMPT: constante de ~360 linhas com 11 blocos tematicos "
       "(papel, tom, detector de compra, objecoes, BANT+SPIN, exemplos, identidade).")
bullet("jade.ts - SEGMENT_SPECIALIST: 14 blocos por segmento de mercado, concatenados "
       "dinamicamente ao system prompt em runtime com base no segmento da empresa.")
bullet("jade.ts - prompts de operacoes especificas (generateContent, sem historico): "
       "buildAnalysisOnlyPrompt (analise de lead), /prospectar (3 leads JSON), /approach "
       "(mensagem WhatsApp).")
bullet("marketing.ts - prompt concatenado: o system_context e construido no cliente mobile "
       "e enviado no corpo; o servidor apenas concatena e chama o modelo.")
bullet("9 telas mobile - strings de prompt embutidas no corpo do fetch, construidas em "
       "runtime com dados locais. Algumas usam o hack [SYSTEM: ...] no campo content.")

# ─── 5. CONFIGURACOES POR OPERACAO ──────────────────────────────────────────
section_title(5, "Configuracoes de Modelo por Operacao")
table(
    ["Operacao", "Endpoint", "Tipo", "Temp", "Tokens"],
    [
        ["Chat principal", "/jade/chat", "Chat + historico", "0.7", "4000"],
        ["Analise de lead", "interno /chat", "generateContent", "0.5", "500"],
        ["Abordagem WhatsApp", "/jade/approach", "generateContent", "0.85", "200"],
        ["Prospeccao (leads)", "/jade/prospectar", "generateContent", "default", "default"],
        ["Marketing", "/marketing/generate", "generateContent", "default", "default"],
        ["Transcricao", "/jade/transcribe", "Whisper REST", "n/a", "n/a"],
    ],
    [42, 42, 42, 18, 36],
)

# ─── 6. FUNCIONALIDADES DEPENDENTES DE IA ───────────────────────────────────
section_title(6, "Funcionalidades Dependentes de IA")
body("Total: 14 funcionalidades - 13 usando Gemini, 1 usando OpenAI (Whisper).", bold=True)
table(
    ["Funcionalidade", "Endpoint / Origem", "Modelo"],
    [
        ["Chat com JADE", "/api/jade/chat", "Gemini 2.5 Flash"],
        ["Prospeccao de leads", "/api/jade/prospectar", "Gemini 2.5 Flash"],
        ["Analise de lead real", "interno em /chat", "Gemini 2.5 Flash"],
        ["Abordagem WhatsApp", "/api/jade/approach", "Gemini 2.5 Flash"],
        ["Transcricao de voz", "/api/jade/transcribe", "OpenAI Whisper-1"],
        ["Campanha de marketing", "/api/marketing/generate", "Gemini 2.5 Flash"],
        ["Post social (mobile)", "marketing.tsx", "Gemini (mal roteado)"],
        ["Estrategia de metas", "metas.tsx", "Gemini 2.5 Flash"],
        ["Planejamento diario", "planejamento.tsx", "Gemini 2.5 Flash"],
        ["Relatorio diario/semanal", "relatorios.tsx", "Gemini 2.5 Flash"],
        ["Roleplay de vendas", "roleplay.tsx", "Gemini 2.5 Flash"],
        ["Relatorio executivo", "relatoriogestor.tsx", "Gemini 2.5 Flash"],
        ["Feedback de vendedor", "feedbackjade.tsx", "Gemini 2.5 Flash"],
        ["Analise da carteira", "carteira.tsx", "Gemini 2.5 Flash"],
    ],
    [60, 60, 60],
)

# ─── 7. STATUS DA OPENAI_API_KEY ────────────────────────────────────────────
section_title(7, "Status da OPENAI_API_KEY")
body("A chave esta disponivel no ambiente e JA esta em uso ativo - mas de forma limitada "
     "e nao declarada.", bold=True)
subtitle("Uso atual")
body("Somente /api/jade/transcribe (Whisper-1), implementado com fetch nativo para "
     "api.openai.com/v1/audio/transcriptions, sem o SDK openai.")
subtitle("Funcionalidades prontamente migraveis para OpenAI")
bullet("/jade/chat (trocar gemini-2.5-flash por gpt-4o-mini ~ 15 linhas)")
bullet("/jade/prospectar, /jade/approach, /marketing/generate")
bullet("Analise de lead (interna ao /chat)")
body("Principal barreira: diferenca de formato de API. Gemini usa role 'model' para "
     "respostas do assistente e systemInstruction separado; OpenAI usa role 'assistant' "
     "e messages com role 'system' no inicio do array.")

# ─── 8. PROPOSTA JADE AI ENGINE ─────────────────────────────────────────────
section_title(8, "Proposta - JADE AI Engine")
body("Criar uma camada de servico src/lib/ai-engine.ts que abstrai todo contato com "
     "provedores de IA atras de uma interface unificada. As rotas Express passam a ser "
     "orquestradores finos que constroem contexto e delegam ao engine.")
subtitle("Interface proposta")
pdf.set_font("Courier", "", 8.5)
pdf.set_text_color(*PURPLE)
for line in [
    "interface AIEngine {",
    "  chat(req: ChatRequest): Promise<ChatResponse>",
    "  generate(req: GenerateRequest): Promise<string>",
    "  transcribe(req: TranscribeRequest): Promise<string>",
    "  analyzeLeads(req: LeadAnalysisRequest): Promise<Analysis[]>",
    "}",
]:
    pdf.set_x(M + 2)
    pdf.cell(0, 5, t(line), ln=1)
pdf.ln(1)
subtitle("Responsabilidades centralizadas")
bullet("Selecao de modelo por operacao (chat vs. geracao vs. STT)")
bullet("Configuracao de temperatura/tokens por operacao")
bullet("Retry com backoff e timeout / circuit breaker")
bullet("Normalizacao de historico (model <-> assistant)")
bullet("Log estruturado de tokens consumidos")
subtitle("Repositorio de prompts (src/lib/prompts/)")
bullet("jade-system.ts -> JADE_SYSTEM_PROMPT")
bullet("segments.ts -> SEGMENT_SPECIALIST (14 blocos)")
bullet("operations.ts -> prospectar, approach, lead analysis")
bullet("marketing.ts -> prompt de campanha")
subtitle("Controle por variavel de ambiente")
pdf.set_font("Courier", "", 8.5)
pdf.set_text_color(*GRAY)
for line in [
    "AI_PROVIDER=gemini|openai",
    "AI_CHAT_MODEL=gpt-4o-mini",
    "AI_GENERATE_MODEL=gpt-4o-mini",
    "AI_STT_MODEL=whisper-1",
]:
    pdf.set_x(M + 2)
    pdf.cell(0, 5, t(line), ln=1)
pdf.ln(1)

# ─── 9. COMPLEXIDADE DE MIGRACAO ────────────────────────────────────────────
section_title(9, "Complexidade de Migracao: MEDIA")
subtitle("Por que nao e BAIXA")
bullet("9 telas mobile com prompts inline - cada uma precisa ser refatorada para mover o "
       "prompt para o servidor.")
bullet("JADE_SYSTEM_PROMPT de 360 linhas augmentado dinamicamente com segmento e empresa - "
       "logica acoplada ao handler do /chat.")
bullet("Formato de historico diferente: role 'model' (Gemini) vs. 'assistant' (OpenAI); o "
       "store atualmente persiste role 'model'.")
bullet("Hack [SYSTEM: ...] em 3 arquivos precisa ser movido para systemInstruction no "
       "servidor.")
subtitle("Por que nao e ALTA")
bullet("Nenhum embedding, vector store, fine-tuning ou RAG")
bullet("Nenhum streaming SSE implementado (tudo e blocking await)")
bullet("O mobile ja e thin client - zero mudanca de SDK no app")
bullet("Ambas as chaves ja estao configuradas no ambiente")
bullet("A superficie da API REST permanece igual para o mobile")

# ─── 10. PRINCIPAIS RISCOS ──────────────────────────────────────────────────
section_title(10, "Principais Riscos")
risk_row("R1", "alto", "Regressao de comportamento do chat: mudar a entrega do JADE_SYSTEM_PROMPT "
         "pode alterar sutilmente o comportamento do modelo. Comparar outputs antes/depois.")
risk_row("R2", "alto", "Normalizacao de historico Gemini -> OpenAI: role 'model' persistido no "
         "store viraria 'assistant'. Historicos salvos precisam de migracao ou normalizacao.")
risk_row("R3", "medio", "Whisper e exclusivo da OpenAI: nao ha equivalente Gemini para STT de "
         "audio nativo. Migrar 100% para Gemini exigiria audio inline (API mais complexa).")
risk_row("R4", "medio", "Prompts com metricas ficticias: relatorios.tsx envia metricas hardcoded "
         "ao modelo como se fossem reais. Deve ser corrigido antes da migracao.")
risk_row("R5", "medio", "Perda de estado em memoria: sessionPendingLeads (Map em jade.ts) e "
         "perdido no restart. Ao refatorar, mover para o store persistido.")
risk_row("R6", "baixo", "marketing.tsx roteia errado: chama /jade/chat em vez de /marketing/generate, "
         "ignorando o sistema de campanhas.")
risk_row("R7", "baixo", "Ausencia de retry no servidor: so o mobile faz retry; falhas transientes "
         "retornam 500 imediatamente.")
risk_row("R8", "baixo", "Nome do modelo hardcoded em 5 lugares; atualizar o modelo exige 5 edicoes "
         "manuais.")

# ─── 11. ARQUIVOS A ALTERAR ─────────────────────────────────────────────────
section_title(11, "Arquivos a Alterar numa Migracao Futura")
subtitle("Servidor (caminho critico)")
table(
    ["Arquivo", "Acao", "Motivo"],
    [
        ["routes/jade.ts", "Refatorar", "Remover 4 instancias diretas; delegar ao engine"],
        ["routes/marketing.ts", "Refatorar", "Remover instancia direta; delegar ao engine"],
        ["lib/ai-engine.ts", "Criar", "Servico unificado com adapters por provedor"],
        ["lib/prompts/jade-system.ts", "Criar", "Extrair JADE_SYSTEM_PROMPT"],
        ["lib/prompts/segments.ts", "Criar", "Extrair SEGMENT_SPECIALIST (14 blocos)"],
        ["lib/prompts/operations.ts", "Criar", "Extrair prospectar, approach, analysis"],
        ["db/store.ts", "Ajustar", "Normalizar role 'model' -> 'assistant'"],
        ["package.json", "Add dep", "openai SDK para formalizar Whisper"],
    ],
    [50, 22, 88],
)
subtitle("Mobile (centralizar prompts no servidor)")
table(
    ["Arquivo", "Acao", "Endpoint novo sugerido"],
    [
        ["marketing.tsx", "Redirecionar", "/api/marketing/generate"],
        ["metas.tsx", "Mover prompt", "/api/metas/estrategia"],
        ["planejamento.tsx", "Mover prompt", "/api/planejamento/sugestao"],
        ["relatorios.tsx", "Mover prompt + dados", "/api/relatorios/analise"],
        ["roleplay.tsx", "Mover system prompt", "/api/roleplay/chat + /feedback"],
        ["relatoriogestor.tsx", "Mover prompts", "/api/dashboard/relatorio + /estrategia"],
        ["feedbackjade.tsx", "Mover system prompt", "/api/feedback/vendedor"],
        ["carteira.tsx", "Mover prompt", "/api/carteira/analise"],
    ],
    [42, 42, 76],
)

# ─── 12. CONCLUSAO ──────────────────────────────────────────────────────────
section_title(12, "Conclusao")
body("O projeto JADE IA tem uma arquitetura de IA funcional mas monolitica - toda a "
     "inteligencia esta concentrada em jade.ts sem separacao de responsabilidades. Funciona "
     "bem no estado atual, mas e dificil de manter, testar e migrar de provedor.")
body("Os tres achados mais criticos:", bold=True)
bullet("Prompts distribuidos em 12 locais (1 servidor + 11 mobile) tornam auditoria e "
       "atualizacao de comportamento arriscados.")
bullet("OpenAI ja esta em uso (Whisper) sem estar declarada como dependencia oficial - o "
       "sistema ja depende de dois provedores.")
bullet("Metricas ficticias hardcoded em relatorios.tsx sao enviadas ao modelo como se fossem "
       "dados reais - precisa ser corrigido independentemente de qualquer migracao.")
pdf.ln(2)
body("A proposta JADE AI Engine e viavel com complexidade MEDIA: estimativa de 4-6 dias para "
     "a camada de servico no servidor e 3-5 dias para migrar os prompts das telas mobile - "
     "totalizando ~2 semanas de sprint tecnico sem regressao de produto.")

# ─── SALVAR ─────────────────────────────────────────────────────────────────
OUT = "exports/auditoria-ia-jade-2026-06-24.pdf"
pdf.output(OUT)
print(f"PDF gerado: {OUT}")
