import { Router, type IRouter } from "express";
import healthRouter from "./health";
import jadeRouter from "./jade";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/jade", jadeRouter);

export default router;
