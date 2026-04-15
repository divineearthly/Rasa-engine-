import { Router, type IRouter } from "express";
import healthRouter from "./health";
import rasaRouter from "./rasa";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/rasa", rasaRouter);

export default router;
