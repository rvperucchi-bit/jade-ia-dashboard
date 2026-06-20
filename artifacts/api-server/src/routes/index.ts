import { Router, type IRouter } from "express";
import healthRouter from "./health";
import jadeRouter from "./jade";
import placesRouter from "./places";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/jade", jadeRouter);
router.use("/places", placesRouter);

export default router;
