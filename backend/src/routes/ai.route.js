import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { aiRateLimiter, getSmartReply, getSummary, getTranslation } from "../controllers/ai.controller.js";

const router = express.Router();

router.use(protectRoute);
router.use(aiRateLimiter);

router.post("/smart-reply", getSmartReply);
router.post("/summarize", getSummary);
router.post("/translate", getTranslation);

export default router;
