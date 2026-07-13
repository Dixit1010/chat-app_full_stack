import Conversation from "../models/conversation.model.js";
import cloudinary from "../lib/cloudinary.js";
import { getReceiverSocketId, io } from "../lib/socket.js";

const broadcastGroupUpdate = (recipientIds, payload) => {
  recipientIds.forEach((pId) => {
    const socketId = getReceiverSocketId(pId.toString());
    if (socketId) io.to(socketId).emit("groupUpdated", payload);
  });
};

export const getConversations = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const conversations = await Conversation.find({ participants: userId })
      .populate("participants", "-password")
      .sort({ updatedAt: -1 });

    res.status(200).json(conversations);
  } catch (error) {
    next(error);
  }
};

export const startDirectMessage = async (req, res, next) => {
  try {
    const myId = req.user._id;
    const { userId } = req.params;

    if (userId === myId.toString()) {
      return res.status(400).json({ message: "Cannot start a conversation with yourself" });
    }

    let conversation = await Conversation.findOne({
      isGroup: false,
      participants: { $all: [myId, userId], $size: 2 },
    }).populate("participants", "-password");

    if (!conversation) {
      const created = await Conversation.create({
        participants: [myId, userId],
        isGroup: false,
      });
      conversation = await Conversation.findById(created._id).populate("participants", "-password");
    }

    res.status(200).json(conversation);
  } catch (error) {
    next(error);
  }
};

export const createGroup = async (req, res, next) => {
  try {
    const { groupName, participants } = req.body;
    const userId = req.user._id;

    if (!groupName || !participants || participants.length === 0) {
      return res.status(400).json({ message: "Group name and participants are required" });
    }

    const allParticipants = [...new Set([...participants, userId.toString()])];

    if (allParticipants.length < 2) {
      return res.status(400).json({ message: "A group needs at least 2 participants" });
    }

    const newGroup = await Conversation.create({
      isGroup: true,
      groupName,
      participants: allParticipants,
      admins: [userId],
    });

    const populatedGroup = await Conversation.findById(newGroup._id).populate("participants", "-password");

    res.status(201).json(populatedGroup);
  } catch (error) {
    next(error);
  }
};

export const updateGroup = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { groupName, participants, groupAvatar, action } = req.body;
    const userId = req.user._id;

    const group = await Conversation.findById(id);

    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    if (!group.isGroup) {
      return res.status(400).json({ message: "Not a group conversation" });
    }

    // Leaving the group yourself is always allowed; every other action
    // (rename, icon, adding/removing other members) is admin-only.
    const isSelfLeave = action === "remove" && participants?.length === 1 && participants[0] === userId.toString();
    if (!isSelfLeave && !group.admins.some(a => a.toString() === userId.toString())) {
      return res.status(403).json({ message: "Only admins can modify the group" });
    }

    // Keep the pre-change roster so a removed/leaving member still gets
    // notified in real time, even though they're no longer a participant
    // by the time we broadcast.
    const previousParticipantIds = group.participants.map(p => p.toString());

    if (action === "rename" && groupName) {
      group.groupName = groupName;
    } else if (action === "icon" && groupAvatar) {
      const uploadResponse = await cloudinary.uploader.upload(groupAvatar, { resource_type: "auto" });
      group.groupAvatar = uploadResponse.secure_url;
    } else if (action === "add" && participants) {
      const newParticipants = participants.filter(p => !group.participants.some(existing => existing.toString() === p));
      group.participants.push(...newParticipants);
    } else if (action === "remove" && participants) {
      group.participants = group.participants.filter(p => !participants.includes(p.toString()));
      group.admins = group.admins.filter(a => !participants.includes(a.toString()));
    }

    if (group.participants.length === 0) {
      await Conversation.findByIdAndDelete(id);
      broadcastGroupUpdate(previousParticipantIds, { deleted: true, _id: id });
      return res.status(200).json({ deleted: true, _id: id });
    }

    // If every remaining admin just left/got removed, promote whoever's left.
    if (group.admins.length === 0) {
      group.admins = [group.participants[0]];
    }

    await group.save();
    const updatedGroup = await Conversation.findById(id).populate("participants", "-password");

    const recipientIds = [...new Set([...previousParticipantIds, ...updatedGroup.participants.map(p => p._id.toString())])];
    broadcastGroupUpdate(recipientIds, updatedGroup);
    res.status(200).json(updatedGroup);
  } catch (error) {
    next(error);
  }
};

export const updateConversationKeys = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { encryptedKeys } = req.body;
    const conversation = await Conversation.findById(id);
    if (!conversation) return res.status(404).json({ message: "Conversation not found" });

    for (const [userId, keyStr] of Object.entries(encryptedKeys)) {
      conversation.encryptedKeys.set(userId, keyStr);
    }
    await conversation.save();

    res.status(200).json(conversation);
  } catch (error) {
    next(error);
  }
};

