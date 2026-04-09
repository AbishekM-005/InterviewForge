import express from "express";
import { executeCode } from "../controllers/codeController.js";
import { codeExecutionRateLimit } from "../middleware/codeExecutionRateLimit.js";
import { protectRoute } from "../middleware/protectRoute.js";

const codeRoutes = express.Router();

codeRoutes.post("/execute", protectRoute, codeExecutionRateLimit, executeCode);

export default codeRoutes;
