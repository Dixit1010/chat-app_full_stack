import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import {
  createGroup,
  getConversations,
  startDirectMessage,
  updateGroup,
  updateConversationKeys,
} from "../controllers/conversation.controller.js";

const router = express.Router();

router.use(protectRoute);

router.get("/", getConversations);
router.post("/", createGroup);
router.post("/dm/:userId", startDirectMessage);
router.patch("/:id", updateGroup);
router.patch("/:id/keys", updateConversationKeys);

export default router;
