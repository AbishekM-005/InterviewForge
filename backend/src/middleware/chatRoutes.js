import express from "express";
import { getStreamToken } from "../controllers/chatController.js";
import { protectRoute } from "./protectRoute.js";

const chatRoutes = express.Router();

chatRoutes.get("/token", protectRoute, getStreamToken);

export default chatRoutes;
