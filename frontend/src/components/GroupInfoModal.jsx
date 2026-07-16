import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { Camera, Check, LogOut, Pencil, Plus, UserMinus, X, Image as ImageIcon } from "lucide-react";
import toast from "react-hot-toast";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";
import TiltCard from "./TiltCard";
import UserProfileModal from "./UserProfileModal";
import { applyMotion, fadeUp, useMotionPreferences } from "../lib/motion";

const GroupInfoModal = ({ conversation, onClose }) => {
  const { authUser } = useAuthStore();
  const { users, updateGroup, messages } = useChatStore();

  const [isEditingName, setIsEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(conversation.groupName || "");
  const [isUploadingIcon, setIsUploadingIcon] = useState(false);
  const [isAddingMembers, setIsAddingMembers] = useState(false);
  const [busyMemberId, setBusyMemberId] = useState(null);
  const [selectedMemberForProfile, setSelectedMemberForProfile] = useState(null);
  const iconInputRef = useRef(null);
  const { shouldReduceMotion } = useMotionPreferences();

  const isAdmin = conversation.admins?.includes(authUser._id);
  const memberIds = new Set(conversation.participants.map(p => p._id));
  const addableUsers = users.filter(u => !memberIds.has(u._id));

  const mediaMessages = messages.filter(m => m.image && (m.mediaType === "image" || m.mediaType === "video"));

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
        {...applyMotion(fadeUp, shouldReduceMotion)}
        className="bg-surface rounded-xl shadow-elevation-3 w-full overflow-hidden flex flex-col max-h-[85vh]"
      >
        <div className="p-4 border-b border-line flex items-center justify-between bg-surface-2/50">
          <h2 className="font-semibold text-ink">Group Info</h2>
          <button onClick={onClose} aria-label="Close group info" className="p-1.5 rounded-full text-ink-muted hover:text-ink hover:bg-surface-3 transition-colors focus:outline-none focus:ring-2 focus:ring-accent">
            <X className="size-4" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 scrollbar-thin">
          
          {/* Group Settings */}
          <div className="p-6">
            <div className="flex flex-col items-center gap-4">
              <div className="relative group">
                <img
                  src={conversation.groupAvatar || "/avatar.png"}
                  alt={conversation.groupName}
                  className="size-28 rounded-full object-cover border-4 border-surface-3 shadow-elevation-2"
                />
                {isAdmin && (
                  <label
                    htmlFor="group-icon-upload"
                    aria-label="Upload group icon"
                    className={`absolute bottom-0 right-0 bg-accent text-white p-2.5 rounded-full cursor-pointer shadow-elevation-2 transition-all focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-offset-surface focus-within:ring-accent ${
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
                <div className="flex items-center gap-2 w-full max-w-xs mt-2">
                  <input
                    type="text"
                    autoFocus
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleRename()}
                    className="flex-1 bg-surface-2 border border-line rounded-lg px-3 py-1.5 text-sm text-ink outline-none focus:border-accent focus:ring-1 focus:ring-accent"
                  />
                  <button onClick={handleRename} aria-label="Save group name" className="p-1.5 bg-accent text-white rounded-lg hover:bg-accent-hover transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-surface focus:ring-accent">
                    <Check className="size-4" />
                  </button>
                </div>
              ) : (
                <div className="text-center">
                  <button
                    onClick={() => isAdmin && setIsEditingName(true)}
                    aria-label={isAdmin ? "Edit group name" : "Group name"}
                    className={`flex items-center justify-center gap-1.5 text-xl font-bold text-ink focus:outline-none focus:ring-2 focus:ring-accent rounded-md px-2 ${isAdmin ? "hover:text-accent transition-colors" : "cursor-default"}`}
                    disabled={!isAdmin}
                  >
                    {conversation.groupName}
                    {isAdmin && <Pencil className="size-4 text-ink-faint hover:text-accent" />}
                  </button>
                  <p className="text-sm text-ink-muted mt-1">{conversation.participants.length} members</p>
                </div>
              )}
            </div>
          </div>

          <div className="h-2 bg-surface-2 border-y border-line-soft w-full" />

          {/* Members Section */}
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold tracking-wide text-ink uppercase">Members</h3>
              {isAdmin && (
                <button
                  onClick={() => setIsAddingMembers(!isAddingMembers)}
                  aria-label="Add Member"
                  className="flex items-center gap-1 text-xs text-accent hover:text-accent-hover font-medium bg-accent/10 px-2 py-1 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-accent"
                >
                  <Plus className="size-3.5" /> Add Member
                </button>
              )}
            </div>

            {isAddingMembers && (
              <div className="border border-line rounded-xl overflow-hidden max-h-40 overflow-y-auto bg-surface-2 shadow-inner">
                {addableUsers.length === 0 ? (
                  <div className="p-4 text-center">
                    <p className="text-sm text-ink-muted">Everyone's already in this group</p>
                  </div>
                ) : (
                  <div className="divide-y divide-line-soft">
                    {addableUsers.map(user => (
                      <div
                        key={user._id}
                        onClick={() => handleAddMember(user._id)}
                        className="flex items-center gap-3 p-3 hover:bg-surface cursor-pointer transition-colors"
                      >
                        <img src={user.profilePic || "/avatar.png"} alt={user.fullName} className="size-8 rounded-full object-cover bg-surface-3" />
                        <span className="text-sm font-medium text-ink truncate flex-1">{user.fullName}</span>
                        {busyMemberId === user._id && (
                          <span className="size-4 rounded-full border-2 border-accent border-t-transparent animate-spin" />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="border border-line rounded-xl overflow-hidden bg-surface-2 shadow-elevation-1 divide-y divide-line-soft">
              {conversation.participants.map(member => {
                const isSelf = member._id === authUser._id;
                const isMemberAdmin = conversation.admins?.includes(member._id);
                return (
                  <div key={member._id} className="flex items-center justify-between p-3 hover:bg-surface transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <img 
                        src={member.profilePic || "/avatar.png"} 
                        alt={member.fullName} 
                        className="size-10 rounded-full object-cover bg-surface-3 cursor-pointer hover:ring-2 hover:ring-accent hover:ring-offset-2 hover:ring-offset-surface transition-all" 
                        onClick={() => setSelectedMemberForProfile(member)}
                      />
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-ink truncate">{isSelf ? "You" : member.fullName}</div>
                        {isMemberAdmin && <div className="text-[11px] font-semibold text-accent mt-0.5">Admin</div>}
                      </div>
                    </div>
                    {isAdmin && !isSelf && (
                      <button
                        onClick={() => handleRemoveMember(member._id)}
                        disabled={busyMemberId === member._id}
                        aria-label={`Remove ${member.fullName} from group`}
                        className="p-2 rounded-lg text-ink-muted hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-red-500"
                        title="Remove from group"
                      >
                        <UserMinus className="size-4" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Shared Media Section */}
          {mediaMessages.length > 0 && (
            <>
              <div className="h-2 bg-surface-2 border-y border-line-soft w-full" />
              <div className="p-6 space-y-4">
                <h3 className="text-sm font-semibold tracking-wide text-ink uppercase flex items-center gap-2">
                  <ImageIcon className="size-4 text-ink-muted" /> Shared Media
                </h3>
                
                <div className="grid grid-cols-4 gap-2">
                  {mediaMessages.slice(0, 12).map((msg, idx) => (
                    <div key={msg._id || idx} className="aspect-square rounded-lg overflow-hidden bg-surface-3 border border-line-soft shadow-sm group relative">
                      {msg.mediaType === "video" ? (
                        <video src={msg.image} className="w-full h-full object-cover" />
                      ) : (
                        <img src={msg.image} alt="Shared media" className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                      )}
                    </div>
                  ))}
                </div>
                {mediaMessages.length > 12 && (
                  <p className="text-xs text-ink-muted text-center mt-2">Showing 12 most recent</p>
                )}
              </div>
            </>
          )}

        </div>

        <div className="p-4 border-t border-line bg-surface-2/50 mt-auto">
          <button
            onClick={handleLeaveGroup}
            aria-label="Leave Group"
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-red-500 hover:text-white border border-red-200 hover:border-red-500 bg-red-50 hover:bg-red-500 rounded-xl transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-surface focus:ring-red-500"
          >
            <LogOut className="size-4" /> Leave Group
          </button>
        </div>
      </motion.div>

      <UserProfileModal 
        isOpen={!!selectedMemberForProfile} 
        onClose={() => setSelectedMemberForProfile(null)} 
        user={selectedMemberForProfile} 
      />
    </TiltCard>
  );
};

export default GroupInfoModal;
