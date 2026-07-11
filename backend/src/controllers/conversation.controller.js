import Conversation from "../models/conversation.model.js";

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
    const { groupName, participants, action } = req.body;
    const userId = req.user._id;

    const group = await Conversation.findById(id);

    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    if (!group.isGroup) {
      return res.status(400).json({ message: "Not a group conversation" });
    }

    if (!group.admins.includes(userId)) {
      return res.status(403).json({ message: "Only admins can modify the group" });
    }

    if (action === "rename" && groupName) {
      group.groupName = groupName;
    } else if (action === "add" && participants) {
      const newParticipants = participants.filter(p => !group.participants.includes(p));
      group.participants.push(...newParticipants);
    } else if (action === "remove" && participants) {
      group.participants = group.participants.filter(p => !participants.includes(p.toString()));
    }

    await group.save();
    const updatedGroup = await Conversation.findById(id).populate("participants", "-password");

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

