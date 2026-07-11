import User from "../models/user.model.js";
import Message from "../models/message.model.js";
import Conversation from "../models/conversation.model.js";
import cloudinary from "../lib/cloudinary.js";
import { getReceiverSocketId, io } from "../lib/socket.js";
import webpush from "web-push";

const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || "BLBzVonKFt1dNGZHZT9i205W1UE066sJGm2LuONQUxLOHsZTbFC7LxAnyGjH_FW8-zrqFHu5r-ldjHJAqs5K8m8";
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || "M4THnqpzw-EoAbMteJRKPoVyQgweewD2FI56JNMQH4E";
webpush.setVapidDetails("mailto:test@example.com", VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
import { sendMessageSchema } from "../lib/validation.js";

export const getUsersForSidebar = async (req, res, next) => {
  try {
    const loggedInUserId = req.user._id;
    const filteredUsers = await User.find({ _id: { $ne: loggedInUserId } }).select("-password");
    res.status(200).json(filteredUsers);
  } catch (error) {
    next(error);
  }
};

export const getMessages = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { before, limit = 30 } = req.query;
    const myId = req.user._id;

    let conversation = await Conversation.findById(id).catch(() => null);
    let conversationId;

    if (conversation) {
      conversationId = conversation._id;
    } else {
      conversation = await Conversation.findOne({
        isGroup: false,
        participants: { $all: [myId, id], $size: 2 }
      });
      if (!conversation) {
        conversation = await Conversation.create({
          participants: [myId, id],
          isGroup: false
        });
      }
      conversationId = conversation._id;
    }

    const query = { conversationId };

    if (before) {
      query._id = { $lt: before };
    }

    const messages = await Message.find(query)
      .sort({ createdAt: -1 })
      .limit(Number(limit));

    res.status(200).json(messages.reverse());
  } catch (error) {
    next(error);
  }
};

export const sendMessage = async (req, res, next) => {
  try {
    const validatedData = sendMessageSchema.parse(req.body);
    const { text, image, mediaType, isEncrypted, encryptedKeys } = validatedData;
    const { id } = req.params;
    const senderId = req.user._id;

    let imageUrl;
    if (image) {
      const uploadResponse = await cloudinary.uploader.upload(image, { resource_type: "auto" });
      imageUrl = uploadResponse.secure_url;
    }

    let conversation = await Conversation.findById(id).catch(() => null);
    if (!conversation) {
      conversation = await Conversation.findOne({
        isGroup: false,
        participants: { $all: [senderId, id], $size: 2 }
      });
      if (!conversation) {
        conversation = await Conversation.create({
          participants: [senderId, id],
          isGroup: false,
        });
      }
    }

    // Always merge in any newly-supplied encrypted keys, regardless of
    // whether the conversation was just created or already existed —
    // otherwise the symmetric key the sender generated is never persisted
    // and no other participant/session can ever decrypt the conversation.
    if (encryptedKeys && Object.keys(encryptedKeys).length > 0) {
      for (const [uId, k] of Object.entries(encryptedKeys)) {
        conversation.encryptedKeys.set(uId, k);
      }
      await conversation.save();

      // Let every participant's client (including the sender's other tabs)
      // know the key material changed, so they don't need a full reload of
      // /conversations to be able to decrypt this conversation.
      const updatedKeys = Object.fromEntries(conversation.encryptedKeys);
      conversation.participants.forEach((p) => {
        const pId = p._id || p;
        const socketId = getReceiverSocketId(pId);
        if (socketId) {
          io.to(socketId).emit("conversationKeysUpdated", {
            conversationId: conversation._id,
            encryptedKeys: updatedKeys,
          });
        }
      });
    }

    let messageStatus = "sent";
    if (!conversation.isGroup) {
      const otherUserId = conversation.participants.find(p => p.toString() !== senderId.toString());
      if (otherUserId && getReceiverSocketId(otherUserId)) {
        messageStatus = "delivered";
      }
    }

    const newMessage = new Message({
      senderId,
      conversationId: conversation._id,
      text,
      image: imageUrl,
      mediaType,
      status: messageStatus,
      isEncrypted,
    });

    await newMessage.save();

    if (conversation) {
      conversation.participants.forEach(p => {
        const pId = p._id || p;
        if (pId.toString() !== senderId.toString()) {
          const socketId = getReceiverSocketId(pId);
          if (socketId) {
            io.to(socketId).emit("newMessage", newMessage);
          } else {
            User.findById(pId).then(offlineUser => {
              if (offlineUser && offlineUser.pushSubscription) {
                const payload = JSON.stringify({ title: "New Message", body: text || "Media message" });
                webpush.sendNotification(offlineUser.pushSubscription, payload).catch(err => console.log("Push error:", err.message));
              }
            });
          }
        }
      });
    }

    res.status(201).json(newMessage);
  } catch (error) {
    if (error.name === "ZodError") {
      return res.status(400).json({ message: error.issues[0].message });
    }
    next(error);
  }
};

export const markMessagesSeen = async (req, res, next) => {
  try {
    const { senderId } = req.params;
    const myId = req.user._id;

    let conversation = await Conversation.findById(senderId).catch(() => null);
    if (!conversation) {
      conversation = await Conversation.findOne({
        isGroup: false,
        participants: { $all: [myId, senderId], $size: 2 }
      });
    }

    if (conversation) {
      await Message.updateMany(
        { conversationId: conversation._id, senderId: { $ne: myId }, status: { $ne: "seen" } },
        { $set: { status: "seen" } }
      );

      conversation.participants.forEach(p => {
        if (p.toString() !== myId.toString()) {
          const socketId = getReceiverSocketId(p);
          if (socketId) {
            io.to(socketId).emit("messagesSeen", { conversationId: conversation._id, userId: myId });
          }
        }
      });
    }

    res.status(200).json({ message: "Messages marked as seen" });
  } catch (error) {
    next(error);
  }
};

export const reactToMessage = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { emoji } = req.body;
    const userId = req.user._id;

    const message = await Message.findById(id);
    if (!message) return res.status(404).json({ message: "Message not found" });

    const existingReactionIndex = message.reactions.findIndex(r => r.userId.toString() === userId.toString() && r.emoji === emoji);

    if (existingReactionIndex !== -1) {
      message.reactions.splice(existingReactionIndex, 1);
    } else {
      const userReactionIndex = message.reactions.findIndex(r => r.userId.toString() === userId.toString());
      if (userReactionIndex !== -1) {
        message.reactions[userReactionIndex].emoji = emoji;
      } else {
        message.reactions.push({ userId, emoji });
      }
    }

    await message.save();

    const conversation = await Conversation.findById(message.conversationId);
    if (conversation) {
      conversation.participants.forEach(p => {
        const socketId = getReceiverSocketId(p);
        if (socketId) {
          io.to(socketId).emit("messageReaction", { messageId: message._id, reactions: message.reactions });
        }
      });
    }

    res.status(200).json(message);
  } catch (error) {
    next(error);
  }
};

export const editMessage = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { text } = req.body;
    const userId = req.user._id;

    const message = await Message.findById(id);
    if (!message) return res.status(404).json({ message: "Message not found" });

    if (message.senderId.toString() !== userId.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }
    if (message.deletedAt) {
      return res.status(400).json({ message: "Cannot edit deleted message" });
    }

    message.text = text;
    message.edited = true;
    message.editedAt = new Date();
    await message.save();

    const conversation = await Conversation.findById(message.conversationId);
    if (conversation) {
      conversation.participants.forEach(p => {
        const socketId = getReceiverSocketId(p);
        if (socketId) {
          io.to(socketId).emit("messageEdited", { messageId: message._id, text: message.text, edited: true, editedAt: message.editedAt });
        }
      });
    }

    res.status(200).json(message);
  } catch (error) {
    next(error);
  }
};

export const deleteMessage = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const message = await Message.findById(id);
    if (!message) return res.status(404).json({ message: "Message not found" });

    if (message.senderId.toString() !== userId.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    message.deletedAt = new Date();
    await message.save();

    const conversation = await Conversation.findById(message.conversationId);
    if (conversation) {
      conversation.participants.forEach(p => {
        const socketId = getReceiverSocketId(p);
        if (socketId) {
          io.to(socketId).emit("messageDeleted", { messageId: message._id, deletedAt: message.deletedAt });
        }
      });
    }

    res.status(200).json(message);
  } catch (error) {
    next(error);
  }
};

export const searchMessages = async (req, res, next) => {
  try {
    const { conversationId } = req.params;
    const { q } = req.query;

    if (!q) return res.status(400).json({ message: "Search query required" });

    const messages = await Message.find({
      conversationId,
      $text: { $search: q },
    }).sort({ createdAt: -1 }).limit(50);

    res.status(200).json(messages);
  } catch (error) {
    next(error);
  }
};

