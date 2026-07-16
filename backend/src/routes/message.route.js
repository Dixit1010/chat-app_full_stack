import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { getMessages, getUsersForSidebar, sendMessage, markMessagesSeen, reactToMessage, editMessage, deleteMessage, bulkDeleteMessages, findUserByUsername, togglePinMessage } from "../controllers/message.controller.js";

const router = express.Router();

router.get("/users", protectRoute, getUsersForSidebar);
router.get("/find/:username", protectRoute, findUserByUsername);
router.get("/:id", protectRoute, getMessages);

router.post("/send/:id", protectRoute, sendMessage);
router.post("/bulk-delete", protectRoute, bulkDeleteMessages);
router.post("/:id/react", protectRoute, reactToMessage);
router.patch("/:id/edit", protectRoute, editMessage);
router.patch("/:id/pin", protectRoute, togglePinMessage);
router.delete("/:id", protectRoute, deleteMessage);
router.patch("/seen/:senderId", protectRoute, markMessagesSeen);

export default router;
