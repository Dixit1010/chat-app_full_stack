import User from "../models/user.model.js";

export const blockUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    if (id === userId.toString()) {
      return res.status(400).json({ message: "You cannot block yourself" });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { $addToSet: { blockedUsers: id } },
      { new: true }
    ).select("-password");

    res.status(200).json(user);
  } catch (error) {
    next(error);
  }
};

export const unblockUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const user = await User.findByIdAndUpdate(
      userId,
      { $pull: { blockedUsers: id } },
      { new: true }
    ).select("-password");

    res.status(200).json(user);
  } catch (error) {
    next(error);
  }
};

export const togglePinConversation = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const isPinned = user.pinnedConversations.includes(id);

    if (isPinned) {
      user.pinnedConversations = user.pinnedConversations.filter(
        (convId) => convId.toString() !== id.toString()
      );
    } else {
      user.pinnedConversations.push(id);
    }

    await user.save();
    res.status(200).json(user);
  } catch (error) {
    next(error);
  }
};
