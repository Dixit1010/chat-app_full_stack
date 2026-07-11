import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { getMessages, getUsersForSidebar, sendMessage, markMessagesSeen, reactToMessage, editMessage, deleteMessage, searchMessages } from "../controllers/message.controller.js";

const router = express.Router();

router.get("/users", protectRoute, getUsersForSidebar);
router.get("/search/:conversationId", protectRoute, searchMessages);
router.get("/:id", protectRoute, getMessages);

router.post("/send/:id", protectRoute, sendMessage);
router.post("/:id/react", protectRoute, reactToMessage);
router.patch("/:id/edit", protectRoute, editMessage);
router.delete("/:id", protectRoute, deleteMessage);
router.patch("/seen/:senderId", protectRoute, markMessagesSeen);

export default router;
