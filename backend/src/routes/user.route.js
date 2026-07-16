import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { blockUser, unblockUser, togglePinConversation } from "../controllers/user.controller.js";

const router = express.Router();

router.post("/:id/block", protectRoute, blockUser);
router.post("/:id/unblock", protectRoute, unblockUser);
router.post("/conversations/:id/pin", protectRoute, togglePinConversation);

export default router;
