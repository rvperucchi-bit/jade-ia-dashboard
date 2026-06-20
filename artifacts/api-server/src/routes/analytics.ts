import { Router, Request, Response } from "express";
import { getAllModules, getActivityEvents } from "../db/store.js";

const router = Router();

// GET /api/analytics/dashboard
router.get("/dashboard", (_req: Request, res: Response) => {
  const modules = getAllModules();
  const activityEvents = getActivityEvents(10);

  const activeModules = Object.values(modules).filter((m) => m.is_active);

  return res.json({
    modules,
    active_modules_count: activeModules.length,
    activity_events: activityEvents,
    timestamp: new Date().toISOString(),
  });
});

export default router;
