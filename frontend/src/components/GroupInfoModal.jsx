import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { Camera, Check, LogOut, Pencil, Plus, UserMinus, X } from "lucide-react";
import toast from "react-hot-toast";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";
import TiltCard from "./TiltCard";

const GroupInfoModal = ({ conversation, onClose }) => {
  const { authUser } = useAuthStore();
  const { users, updateGroup } = useChatStore();

  const [isEditingName, setIsEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(conversation.groupName || "");
  const [isUploadingIcon, setIsUploadingIcon] = useState(false);
  const [isAddingMembers, setIsAddingMembers] = useState(false);
  const [busyMemberId, setBusyMemberId] = useState(null);
  const iconInputRef = useRef(null);

  const isAdmin = conversation.admins?.includes(authUser._id);
  const memberIds = new Set(conversation.participants.map(p => p._id));
  const addableUsers = users.filter(u => !memberIds.has(u._id));

  const handleRename = async () => {
    const trimmed = nameInput.trim();
    if (!trimmed || trimmed === conversation.groupName) {
      setIsEditingName(false);
      return;
    }
    try {
      await updateGroup(conversation._id, { action: "rename", groupName: trimmed });
      setIsEditingName(false);
    } catch {
      // toast handled in store
    }
  };

  const handleIconChange = (e) => {
    const file = e.target.files[0];
    if (!file || !file.type.startsWith("image/")) {
      if (file) toast.error("Please select an image file");
      return;
    }
    const reader = new FileReader();
    reader.onloadend = async () => {
      setIsUploadingIcon(true);
      try {
        await updateGroup(conversation._id, { action: "icon", groupAvatar: reader.result });
      } catch {
        // toast handled in store
      } finally {
        setIsUploadingIcon(false);
        if (iconInputRef.current) iconInputRef.current.value = "";
      }
    };
    reader.readAsDataURL(file);
  };

  const handleAddMember = async (userId) => {
    setBusyMemberId(userId);
    try {
      await updateGroup(conversation._id, { action: "add", participants: [userId] });
    } catch {
      // toast handled in store
    } finally {
      setBusyMemberId(null);
    }
  };

  const handleRemoveMember = async (userId) => {
    setBusyMemberId(userId);
    try {
      await updateGroup(conversation._id, { action: "remove", participants: [userId] });
    } catch {
      // toast handled in store
    } finally {
      setBusyMemberId(null);
    }
  };

  const handleLeaveGroup = async () => {
    try {
      await updateGroup(conversation._id, { action: "remove", participants: [authUser._id] });
      onClose();
    } catch {
      // toast handled in store
    }
  };

  return (
    <TiltCard className="w-full max-w-md">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-surface rounded-xl shadow-elevation-3 w-full overflow-hidden flex flex-col max-h-[80vh]"
      >
        <div className="p-4 border-b border-line flex items-center justify-between">
          <h2 className="font-semibold text-ink">Group Info</h2>
          <button onClick={onClose} className="text-ink-muted hover:text-ink">
            <X className="size-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {/* Icon + name */}
          <div className="flex flex-col items-center gap-3">
            <div className="relative group">
              <img
                src={conversation.groupAvatar || "/avatar.png"}
                alt={conversation.groupName}
                className="size-24 rounded-full object-cover border-4 border-surface-3 shadow-elevation-2"
              />
              {isAdmin && (
                <label
                  htmlFor="group-icon-upload"
                  className={`absolute bottom-0 right-0 bg-accent text-white p-2 rounded-full cursor-pointer shadow-elevation-2 transition-all ${
                    isUploadingIcon ? "animate-pulse pointer-events-none" : "hover:scale-105 hover:bg-accent-hover hover:shadow-glow-accent"
                  }`}
                >
                  <Camera className="size-4" />
                  <input
                    ref={iconInputRef}
                    id="group-icon-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleIconChange}
                    disabled={isUploadingIcon}
                  />
                </label>
              )}
            </div>

            {isEditingName ? (
              <div className="flex items-center gap-2 w-full max-w-xs">
                <input
                  type="text"
                  autoFocus
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleRename()}
                  className="flex-1 bg-surface-2 border border-line rounded-lg px-3 py-1.5 text-sm text-ink outline-none focus:border-accent"
                />
                <button onClick={handleRename} className="text-accent hover:text-accent-hover">
                  <Check className="size-5" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => isAdmin && setIsEditingName(true)}
                className={`flex items-center gap-1.5 text-lg font-semibold text-ink ${isAdmin ? "hover:text-accent" : "cursor-default"}`}
                disabled={!isAdmin}
              >
                {conversation.groupName}
                {isAdmin && <Pencil className="size-3.5 text-ink-faint" />}
              </button>
            )}
            <p className="text-xs text-ink-faint">{conversation.participants.length} members</p>
          </div>

          {/* Members */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-ink-muted">Members</label>
              {isAdmin && (
                <button
                  onClick={() => setIsAddingMembers(!isAddingMembers)}
                  className="flex items-center gap-1 text-xs text-accent hover:text-accent-hover font-medium"
                >
                  <Plus className="size-3.5" /> Add
                </button>
              )}
            </div>

            {isAddingMembers && (
              <div className="mb-3 border border-line rounded-lg overflow-hidden max-h-32 overflow-y-auto bg-surface-2">
                {addableUsers.length === 0 ? (
                  <p className="text-xs text-ink-faint p-3 text-center">Everyone's already in this group</p>
                ) : (
                  addableUsers.map(user => (
                    <div
                      key={user._id}
                      onClick={() => handleAddMember(user._id)}
                      className="flex items-center gap-3 p-2 hover:bg-surface cursor-pointer"
                    >
                      <img src={user.profilePic || "/avatar.png"} alt={user.fullName} className="size-7 rounded-full object-cover" />
                      <span className="text-sm text-ink truncate flex-1">{user.fullName}</span>
                      {busyMemberId === user._id && (
                        <span className="size-3.5 rounded-full border-2 border-accent border-t-transparent animate-spin" />
                      )}
                    </div>
                  ))
                )}
              </div>
            )}

            <div className="space-y-1 border border-line rounded-lg overflow-hidden bg-surface-2">
              {conversation.participants.map(member => {
                const isSelf = member._id === authUser._id;
                const isMemberAdmin = conversation.admins?.includes(member._id);
                return (
                  <div key={member._id} className="flex items-center gap-3 p-2">
                    <img src={member.profilePic || "/avatar.png"} alt={member.fullName} className="size-8 rounded-full object-cover" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-ink truncate">{isSelf ? "You" : member.fullName}</div>
                      {isMemberAdmin && <div className="text-[10px] text-accent">Admin</div>}
                    </div>
                    {isAdmin && !isSelf && (
                      <button
                        onClick={() => handleRemoveMember(member._id)}
                        disabled={busyMemberId === member._id}
                        className="p-1.5 rounded-full text-ink-faint hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
                        title="Remove from group"
                      >
                        <UserMinus className="size-3.5" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-line bg-surface-2">
          <button
            onClick={handleLeaveGroup}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-red-500 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut className="size-4" /> Leave Group
          </button>
        </div>
      </motion.div>
    </TiltCard>
  );
};

export default GroupInfoModal;
