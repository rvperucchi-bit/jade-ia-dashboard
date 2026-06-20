import { Router, Request, Response } from "express";
import {
  getAllModules,
  getModule,
  setModuleActive,
  addModuleLog,
  getModuleLogs,
  addActivityEvent,
  setModuleLastRun,
  getScannerHistory,
  addScannerHistory,
} from "../db/store.js";

const router = Router();

const MODULE_LABELS: Record<string, string> = {
  scanner: "Scanner Radar",
  jade: "JADE IA",
  leads: "CRM/Leads",
  whatsapp: "WhatsApp",
  marketing: "Marketing IA",
};

const MODULE_ICONS: Record<string, string> = {
  scanner: "crosshair",
  jade: "robot",
  leads: "users",
  whatsapp: "message-circle",
  marketing: "zap",
};

const MODULE_COLORS: Record<string, string> = {
  scanner: "#6C63FF",
  jade: "#FF0080",
  leads: "#00D68F",
  whatsapp: "#25D366",
  marketing: "#FFB300",
};

// GET /api/modules/status
router.get("/status", (_req: Request, res: Response) => {
  const modules = getAllModules();
  return res.json({ modules, timestamp: new Date().toISOString() });
});

// GET /api/modules/:name/status
router.get("/:name/status", (req: Request, res: Response) => {
  const mod = getModule(req.params.name ?? "");
  if (!mod) return res.status(404).json({ error: "Módulo não encontrado" });
  return res.json(mod);
});

// PUT /api/modules/:name/toggle
router.put("/:name/toggle", (req: Request, res: Response) => {
  const name = req.params.name ?? "";
  const existing = getModule(name);
  if (!existing) return res.status(404).json({ error: "Módulo não encontrado" });

  const newActive = !existing.is_active;
  const updated = setModuleActive(name, newActive);

  const label = MODULE_LABELS[name] ?? name;
  const action = newActive ? "activated" : "deactivated";
  const actionText = newActive ? "ativado" : "desativado";

  addModuleLog({
    module_name: name,
    action,
    message: `${label} ${actionText} manualmente`,
    metadata: { previous: existing.is_active, current: newActive },
  });

  addActivityEvent({
    type: "module",
    text: `${label} ${actionText}`,
    icon: MODULE_ICONS[name] ?? "settings",
    color: MODULE_COLORS[name] ?? "#FF0080",
    metadata: { module: name, active: newActive },
  });

  return res.json({ module: updated, action });
});

// POST /api/modules/:name/toggle (alias para PUT — compatível com React Native fetch)
router.post("/:name/toggle", (req: Request, res: Response) => {
  const name = req.params.name ?? "";
  const existing = getModule(name);
  if (!existing) return res.status(404).json({ error: "Módulo não encontrado" });

  const { active } = req.body as { active?: boolean };
  const newActive = active !== undefined ? active : !existing.is_active;
  const updated = setModuleActive(name, newActive);

  const label = MODULE_LABELS[name] ?? name;
  const action = newActive ? "activated" : "deactivated";
  const actionText = newActive ? "ativado" : "desativado";

  addModuleLog({
    module_name: name,
    action,
    message: `${label} ${actionText}`,
    metadata: { active: newActive },
  });

  addActivityEvent({
    type: "module",
    text: `${label} ${actionText}`,
    icon: MODULE_ICONS[name] ?? "settings",
    color: MODULE_COLORS[name] ?? "#FF0080",
    metadata: { module: name, active: newActive },
  });

  return res.json({ module: updated, action });
});

// POST /api/modules/:name/run — manual execution
router.post("/:name/run", async (req: Request, res: Response) => {
  const name = req.params.name ?? "";
  const mod = getModule(name);
  if (!mod) return res.status(404).json({ error: "Módulo não encontrado" });

  if (name === "whatsapp") {
    addModuleLog({
      module_name: "whatsapp",
      action: "run_blocked",
      message: "WhatsApp está em modo READY_BUT_PAUSED — envio bloqueado até ativação completa",
    });
    return res.json({ ok: false, reason: "READY_BUT_PAUSED", message: "WhatsApp configurado e pronto, mas envio pausado por segurança." });
  }

  if (name === "scanner") {
    setModuleLastRun("scanner");
    const tipo = (req.body as { tipo?: string }).tipo ?? "restaurante";
    const bairro = (req.body as { bairro?: string }).bairro;
    const cidade = (req.body as { cidade?: string }).cidade ?? "Criciúma";

    const apiKey = process.env.GOOGLE_MAPS_API_KEY ?? process.env.GOOGLE_MAPS_PLATFORM_KEY;
    let results: unknown[] = [];
    let count = 0;

    if (apiKey) {
      try {
        const query = `${tipo} em ${bairro ? bairro + ", " : ""}${cidade}, SC`;
        const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${apiKey}&language=pt-BR`;
        const response = await fetch(url);
        const data = await response.json() as { results?: unknown[] };
        results = (data.results ?? []).slice(0, 10).map((p: unknown) => {
          const place = p as Record<string, unknown>;
          return {
            place_id: place["place_id"],
            name: place["name"],
            address: place["formatted_address"],
            rating: place["rating"],
            user_ratings_total: place["user_ratings_total"],
          };
        });
        count = results.length;
      } catch (err) {
        addModuleLog({ module_name: "scanner", action: "run_error", message: `Erro na busca: ${String(err)}` });
      }
    } else {
      results = [];
    }

    const record = addScannerHistory({ tipo, bairro, cidade, results_count: count, results });
    addActivityEvent({
      type: "scan",
      text: `Scanner executado: ${count} ${tipo}s encontrados em ${bairro ?? cidade}`,
      icon: "crosshair",
      color: "#6C63FF",
      metadata: { tipo, bairro, cidade, count },
    });
    addModuleLog({ module_name: "scanner", action: "run_success", message: `${count} resultados encontrados para "${tipo}" em ${cidade}`, metadata: { count } });

    return res.json({ ok: true, scan: record, results_count: count });
  }

  setModuleLastRun(name);
  addModuleLog({ module_name: name, action: "run_manual", message: `Execução manual do módulo ${MODULE_LABELS[name] ?? name}` });
  return res.json({ ok: true, message: `Módulo ${MODULE_LABELS[name] ?? name} executado` });
});

// GET /api/modules/:name/logs
router.get("/:name/logs", (req: Request, res: Response) => {
  const name = req.params.name ?? "";
  const limit = parseInt((req.query["limit"] as string) ?? "50", 10);
  const logs = getModuleLogs(name, limit);
  return res.json({ logs, module: name });
});

// GET /api/modules/scanner/history
router.get("/scanner/history", (_req: Request, res: Response) => {
  return res.json({ history: getScannerHistory(20) });
});

export default router;
