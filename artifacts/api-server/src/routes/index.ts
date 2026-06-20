import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import jadeRouter from "./jade.js";
import placesRouter from "./places.js";
import authRouter from "./auth.js";
import modulesRouter from "./modules.js";
import analyticsRouter from "./analytics.js";
import marketingRouter from "./marketing.js";
import activityRouter from "./activity.js";
import empresaRouter from "./empresa.js";
import relatoriosRouter from "./relatorios.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/auth", authRouter);
router.use("/jade", jadeRouter);
router.use("/places", placesRouter);
router.use("/modules", modulesRouter);
router.use("/analytics", analyticsRouter);
router.use("/marketing", marketingRouter);
router.use("/activity", activityRouter);
router.use("/empresa", empresaRouter);
router.use("/relatorios", relatoriosRouter);

export default router;
