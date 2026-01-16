import express from "express";
import { getStreamToken } from "../controllers/chatController.js";
import { protectRoute } from "../middleware/protectRoute.js";

const chatRoutes = express.Router();

chatRoutes.get("/token", protectRoute, getStreamToken);

export default chatRoutes;
