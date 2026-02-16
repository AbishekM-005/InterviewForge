import express from "express";
import { executeCode } from "../controllers/codeController.js";
import { codeExecutionRateLimit } from "../middleware/codeExecutionRateLimit.js";

const codeRoutes = express.Router();

codeRoutes.post("/execute", codeExecutionRateLimit, executeCode);

export default codeRoutes;
