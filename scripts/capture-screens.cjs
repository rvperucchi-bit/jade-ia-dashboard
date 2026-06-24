const { chromium } = require("playwright-core");
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

function resolveChromium() {
  if (process.env.CHROMIUM_BIN) return process.env.CHROMIUM_BIN;
  try {
    return execSync("command -v chromium", { encoding: "utf8" }).trim();
  } catch {
    return undefined;
  }
}
const CHROMIUM_BIN = resolveChromium();

process.env.PLAYWRIGHT_BROWSERS_PATH =
  process.env.PLAYWRIGHT_BROWSERS_PATH ||
  path.join(__dirname, "..", ".cache", "ms-playwright");

const DOMAIN = process.env.REPLIT_EXPO_DEV_DOMAIN;
if (!DOMAIN) {
  console.error("ERRO: REPLIT_EXPO_DEV_DOMAIN não definido. Abortando para evitar capturas de https://undefined.");
  process.exit(1);
}
const BASE = `https://${DOMAIN}`;
const OUT = path.join(__dirname, "..", "exports", "screenshots");

fs.mkdirSync(OUT, { recursive: true });

// [urlPath, fileName, label]
const ROUTES = [
  ["/splash", "01-splash", "Splash"],
  ["/login", "02-login", "Login"],
  ["/cadastro", "03-cadastro", "Cadastro"],
  ["/onboarding", "04-onboarding", "Onboarding"],
  ["/sucesso", "05-sucesso", "Sucesso"],
  ["/(tabs)", "06-home-dashboard", "Home (redireciona p/ JADE)", "/(tabs)/jade"],
  ["/leads", "07-leads", "Leads"],
  ["/conversas", "08-conversas", "Conversas"],
  ["/conversa/1", "09-conversa-detalhe", "Conversa (detalhe)"],
  ["/jade", "10-jade-chat", "JADE (chat)"],
  ["/mais", "11-mais", "Mais (redireciona p/ JADE)", "/(tabs)/jade"],
  ["/crm", "12-crm", "CRM"],
  ["/pipeline", "13-pipeline", "Pipeline / Funil"],
  ["/carteira", "14-carteira", "Carteira"],
  ["/scanner", "15-scanner", "Scanner"],
  ["/criarrota", "16-criar-rota", "Criar rota"],
  ["/roteiro", "17-roteiro", "Roteiro"],
  ["/briefing", "18-briefing", "Briefing"],
  ["/objecoes", "19-objecoes", "Objeções"],
  ["/roleplay", "20-roleplay", "Roleplay"],
  ["/treinamento", "21-treinamento", "Treinamento"],
  ["/biblioteca", "22-biblioteca", "Biblioteca"],
  ["/marketing", "23-marketing", "Marketing"],
  ["/metas", "24-metas", "Metas"],
  ["/meutime", "25-meu-time", "Meu time"],
  ["/gestao", "26-gestao", "Gestão"],
  ["/planejamento", "27-planejamento", "Planejamento"],
  ["/relatorios", "28-relatorios", "Relatórios"],
  ["/relatoriogestor", "29-relatorio-gestor", "Relatório do gestor"],
  ["/analise", "30-analise", "Análise"],
  ["/laudo", "31-laudo", "Laudo"],
  ["/painelexecutivo", "32-painel-executivo", "Painel executivo"],
  ["/feedbackexecutivo", "33-feedback-executivo", "Feedback executivo"],
  ["/feedbackjade", "34-feedback-jade", "Feedback JADE"],
  ["/notificacoes", "35-notificacoes", "Notificações"],
  ["/historico", "36-historico", "Histórico"],
  ["/empresa", "37-empresa", "Empresa"],
  ["/loja", "38-loja", "Loja"],
  ["/plano", "39-plano", "Plano"],
  ["/uso", "40-uso", "Uso"],
  ["/perfil", "41-perfil", "Perfil"],
  ["/ajuda", "42-ajuda", "Ajuda"],
  ["/whatsapp-config", "43-whatsapp-config", "WhatsApp config"],
  ["/privacidade", "44-privacidade", "Privacidade"],
  ["/termos", "45-termos", "Termos"],
];

const ONBOARDING = JSON.stringify({
  done: true,
  companyName: "JADE IA",
  userName: "Rodrigo",
  city: "São Paulo",
  segment: "Vendas",
  siteOrInsta: "",
  firstModule: "jade",
});

(async () => {
  console.log("Using chromium:", CHROMIUM_BIN || "(playwright default)");
  const browser = await chromium.launch({
    headless: true,
    executablePath: CHROMIUM_BIN,
    args: ["--no-sandbox", "--disable-dev-shm-usage"],
  });
  const context = await browser.newContext({
    viewport: { width: 430, height: 932 },
    deviceScaleFactor: 2,
    isMobile: true,
  });

  // Pre-seed localStorage so onboarding + auth gates pass before React mounts
  await context.addInitScript(
    ([onb, token]) => {
      try {
        window.localStorage.setItem("@jade_ia:onboarding_v1", onb);
        window.localStorage.setItem("@jade_ia:auth_token", token);
      } catch (e) {}
    },
    [ONBOARDING, "offline-screenshot"]
  );

  const page = await context.newPage();
  const results = [];

  for (const [route, file, label, redirectsTo] of ROUTES) {
    if (redirectsTo) {
      console.log(`REDIRECT ${file}  -> ${redirectsTo} (sem captura: não é tela distinta)`);
      results.push({ file: null, label, route, redirect: true, redirectsTo });
      continue;
    }
    const dest0 = path.join(OUT, file + ".png");
    if (fs.existsSync(dest0)) {
      console.log(`SKIP ${file}  (already exists)`);
      results.push({ file, label, route, ok: true, skipped: true });
      continue;
    }
    const url = BASE + route;
    try {
      await page.goto(url, { waitUntil: "domcontentloaded", timeout: 45000 });
      // wait for network to settle (best effort)
      await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});
      // wait for fonts + render
      await page.evaluate(() => (document.fonts ? document.fonts.ready : null)).catch(() => {});
      await page.waitForTimeout(2200);
      const dest = path.join(OUT, file + ".png");
      await page.screenshot({ path: dest, fullPage: false });
      console.log(`OK   ${file}  (${label})`);
      results.push({ file, label, route, ok: true });
    } catch (err) {
      console.log(`FAIL ${file}  (${label}) -> ${err.message.split("\n")[0]}`);
      results.push({ file, label, route, ok: false, error: err.message.split("\n")[0] });
    }
  }

  await browser.close();
  fs.writeFileSync(path.join(OUT, "_index.json"), JSON.stringify(results, null, 2));
  const okCount = results.filter((r) => r.ok).length;
  const redirectCount = results.filter((r) => r.redirect).length;
  console.log(`\nDone: ${okCount} screenshots + ${redirectCount} redirects (de ${results.length} rotas) -> ${OUT}`);
})();
