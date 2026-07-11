import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { saveCallLog } from "../controllers/call.controller.js";

const router = express.Router();

router.post("/log", protectRoute, saveCallLog);

export default router;
