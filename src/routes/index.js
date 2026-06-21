import { Router } from "express";
import { systemRouter } from "./system.routes.js";
import { v1Router } from "./v1.routes.js";

export const router = Router();

router.use(systemRouter);
router.use("/v1", v1Router);
router.use("/api/v1", v1Router);
