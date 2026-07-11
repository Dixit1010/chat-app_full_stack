import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import {
  createGroup,
  getConversations,
  updateGroup,
  updateConversationKeys,
} from "../controllers/conversation.controller.js";

const router = express.Router();

router.use(protectRoute);

router.get("/", getConversations);
router.post("/", createGroup);
router.patch("/:id", updateGroup);
router.patch("/:id/keys", updateConversationKeys);

export default router;
