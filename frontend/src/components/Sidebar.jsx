import { useEffect, useMemo, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import SidebarSkeleton from "./skeletons/SidebarSkeleton";
import { Search, Users, Plus, X, Check, MessageCircle } from "lucide-react";
import toast from "react-hot-toast";
import TiltCard from "./TiltCard";

const listVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.03 } },
};

const itemVariants = {
  hidden: { opacity: 0, x: -8 },
  show: { opacity: 1, x: 0 },
};

const Sidebar = () => {
  const { 
    getConversations, 
    conversations, 
    selectedConversation, 
    setSelectedConversation, 
    isConversationsLoading, 
    unreadCounts,
    users,
    getUsers,
    createGroup,
    startDirectMessage
  } = useChatStore();

  const { onlineUsers, authUser } = useAuthStore();
  const [showOnlineOnly, setShowOnlineOnly] = useState(false);
  const [query, setQuery] = useState("");
  const [isNewChatModalOpen, setIsNewChatModalOpen] = useState(false);
  const [chatMode, setChatMode] = useState("dm"); // "dm" | "group"

  // New Group state
  const [groupName, setGroupName] = useState("");
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [startingDmId, setStartingDmId] = useState(null);

  useEffect(() => {
    getConversations();
    getUsers(); // for the new group modal and finding users not yet in a conversation
  }, [getConversations, getUsers]);

  // Helper to get display info for a conversation
  const getConvDetails = useCallback((conv) => {
    if (conv.isGroup) {
      return {
        id: conv._id,
        name: conv.groupName || "Unnamed Group",
        avatar: conv.groupAvatar || "/avatar.png",
        isOnline: false, // groups don't have a single online status
      };
    } else {
      const otherUser = conv.participants.find(p => p._id !== authUser._id) || conv.participants[0];
      return {
        id: conv._id,
        name: otherUser ? otherUser.fullName : "Unknown User",
        avatar: otherUser?.profilePic || "/avatar.png",
        isOnline: otherUser ? onlineUsers.includes(otherUser._id) : false,
      };
    }
  }, [authUser, onlineUsers]);

  const filteredConversations = useMemo(() => {
    let list = conversations.map(c => ({ ...c, details: getConvDetails(c) }));
    if (showOnlineOnly) {
      list = list.filter((c) => c.details.isOnline);
    }
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter((c) => c.details.name.toLowerCase().includes(q));
    }
    return list;
  }, [conversations, showOnlineOnly, onlineUsers, query, authUser, getConvDetails]);

  const closeNewChatModal = () => {
    setIsNewChatModalOpen(false);
    setChatMode("dm");
    setGroupName("");
    setSelectedUsers([]);
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim()) return toast.error("Group name is required");
    if (selectedUsers.length < 1) return toast.error("Select at least 1 other member");

    try {
      const newGroup = await createGroup({
        groupName,
        participants: selectedUsers.map(u => u._id)
      });
      closeNewChatModal();
      setSelectedConversation(newGroup);
    } catch {
      // toast is handled in store
    }
  };

  const handleStartDM = async (user) => {
    if (startingDmId) return;
    setStartingDmId(user._id);
    try {
      const conversation = await startDirectMessage(user._id);
      closeNewChatModal();
      setSelectedConversation(conversation);
    } catch {
      // toast is handled in store
    } finally {
      setStartingDmId(null);
    }
  };

  const toggleUserSelection = (user) => {
    if (selectedUsers.find(u => u._id === user._id)) {
      setSelectedUsers(selectedUsers.filter(u => u._id !== user._id));
    } else {
      setSelectedUsers([...selectedUsers, user]);
    }
  };

  if (isConversationsLoading) return <SidebarSkeleton />;

  return (
    <aside className="h-full min-h-0 w-[76px] lg:w-[300px] border-r border-line bg-surface flex flex-col shrink-0 transition-[width] duration-200 relative shadow-elevation-1">
      <div className="border-b border-line px-4 py-4 space-y-3">
        <div className="flex items-center justify-between text-ink">
          <div className="flex items-center gap-2">
            <Users className="size-[18px]" />
            <span className="font-semibold text-sm hidden lg:block">Chats</span>
          </div>
          <button
            onClick={() => setIsNewChatModalOpen(true)}
            className="hidden lg:flex items-center justify-center p-1.5 hover:bg-surface-2 rounded-md transition-colors"
            title="New Chat"
          >
            <Plus className="size-4" />
          </button>
        </div>

        <div className="hidden lg:block relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-ink-faint pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search chats..."
            className="w-full bg-surface-2 border border-line rounded-lg pl-8 pr-3 py-1.5 text-sm text-ink placeholder:text-ink-faint outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all"
          />
        </div>

        <label className="hidden lg:flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={showOnlineOnly}
            onChange={(e) => setShowOnlineOnly(e.target.checked)}
            className="peer sr-only"
          />
          <span
            className="relative h-4 w-7 rounded-full bg-surface-3 peer-checked:bg-accent transition-colors
            after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:size-3 after:rounded-full
            after:bg-white after:shadow after:transition-transform peer-checked:after:translate-x-3"
          />
          <span className="text-xs text-ink-muted">Online only</span>
        </label>
      </div>

      <motion.div
        variants={listVariants}
        initial="hidden"
        animate="show"
        className="flex-1 min-h-0 overflow-y-auto py-2 scrollbar-thin"
      >
        {filteredConversations.map((conv) => {
          const isSelected = selectedConversation?._id === conv._id;
          const unread = unreadCounts[conv._id];

          return (
            <motion.button
              key={conv._id}
              variants={itemVariants}
              whileHover={{ x: 2 }}
              onClick={() => setSelectedConversation(conv)}
              className={`relative w-full flex items-center gap-3 px-4 py-2.5 transition-colors
                ${isSelected ? "bg-accent-soft shadow-[inset_0_0_0_1px_rgba(var(--accent-rgb),0.15)]" : "hover:bg-surface-2"}`}
            >
              {isSelected && (
                <motion.span
                  layoutId="sidebar-active-indicator"
                  className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-full bg-accent"
                  transition={{ type: "spring", stiffness: 500, damping: 35 }}
                />
              )}

              <div className="relative mx-auto lg:mx-0 shrink-0">
                <img
                  src={conv.details.avatar}
                  alt={conv.details.name}
                  className={`size-11 object-cover rounded-full ${isSelected ? "ring-2 ring-accent/50" : ""}`}
                />
                {conv.details.isOnline && (
                  <span className="absolute bottom-0 right-0 size-2.5 bg-online rounded-full ring-2 ring-surface" />
                )}
              </div>

              <div className="hidden lg:block text-left min-w-0 flex-1">
                <div className="font-medium text-sm text-ink truncate">{conv.details.name}</div>
                <div className="text-xs text-ink-faint truncate">
                  {conv.isGroup ? `${conv.participants.length} members` : (conv.details.isOnline ? "Online" : "Offline")}
                </div>
              </div>

              {unread > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 500, damping: 20 }}
                  className="hidden lg:flex ml-auto bg-accent text-white text-[11px] font-semibold rounded-full h-5 min-w-[20px] items-center justify-center px-1.5"
                >
                  {unread > 99 ? "99+" : unread}
                </motion.span>
              )}
            </motion.button>
          );
        })}

        {filteredConversations.length === 0 && (
          <div className="text-center text-ink-faint text-sm py-8 px-4">
            {query ? "No chats match your search" : "No conversations yet"}
          </div>
        )}
      </motion.div>

      {/* New Group Modal */}
      <AnimatePresence>
        {isNewChatModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
          >
            <TiltCard className="w-full max-w-md">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-surface rounded-xl shadow-elevation-3 w-full overflow-hidden flex flex-col max-h-[80vh]"
            >
              <div className="p-4 border-b border-line flex items-center justify-between">
                <h2 className="font-semibold text-ink">New Chat</h2>
                <button onClick={closeNewChatModal} className="text-ink-muted hover:text-ink">
                  <X className="size-5" />
                </button>
              </div>

              <div className="px-4 pt-4">
                <div className="flex bg-surface-2 border border-line rounded-lg p-1 gap-1">
                  <button
                    onClick={() => setChatMode("dm")}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-sm font-medium transition-colors ${
                      chatMode === "dm" ? "bg-surface shadow-elevation-1 text-ink" : "text-ink-muted hover:text-ink"
                    }`}
                  >
                    <MessageCircle className="size-3.5" /> Direct Message
                  </button>
                  <button
                    onClick={() => setChatMode("group")}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-sm font-medium transition-colors ${
                      chatMode === "group" ? "bg-surface shadow-elevation-1 text-ink" : "text-ink-muted hover:text-ink"
                    }`}
                  >
                    <Users className="size-3.5" /> Group
                  </button>
                </div>
              </div>

              <div className="p-4 space-y-4 overflow-y-auto flex-1">
                {chatMode === "group" && (
                  <div>
                    <label className="text-sm font-medium text-ink-muted mb-1 block">Group Name</label>
                    <input
                      type="text"
                      value={groupName}
                      onChange={(e) => setGroupName(e.target.value)}
                      placeholder="Enter group name..."
                      className="w-full bg-surface-2 border border-line rounded-lg px-3 py-2 text-sm text-ink outline-none focus:border-accent"
                    />
                  </div>
                )}

                <div>
                  <label className="text-sm font-medium text-ink-muted mb-2 block">
                    {chatMode === "dm" ? "Select a person" : "Select Members"}
                  </label>
                  <div className="space-y-1 border border-line rounded-lg overflow-hidden h-48 overflow-y-auto bg-surface-2">
                    {users.map(user => {
                      if (chatMode === "dm") {
                        return (
                          <div
                            key={user._id}
                            onClick={() => handleStartDM(user)}
                            className="flex items-center gap-3 p-2 hover:bg-surface cursor-pointer"
                          >
                            <img src={user.profilePic || "/avatar.png"} alt={user.fullName} className="size-8 rounded-full object-cover" />
                            <span className="text-sm text-ink truncate flex-1">{user.fullName}</span>
                            {startingDmId === user._id && (
                              <span className="size-3.5 rounded-full border-2 border-accent border-t-transparent animate-spin" />
                            )}
                          </div>
                        );
                      }
                      const isSelected = selectedUsers.some(u => u._id === user._id);
                      return (
                        <div
                          key={user._id}
                          onClick={() => toggleUserSelection(user)}
                          className="flex items-center gap-3 p-2 hover:bg-surface cursor-pointer"
                        >
                          <div className={`size-4 rounded border flex items-center justify-center ${isSelected ? 'bg-accent border-accent text-white' : 'border-line'}`}>
                            {isSelected && <Check className="size-3" />}
                          </div>
                          <img src={user.profilePic || "/avatar.png"} alt={user.fullName} className="size-8 rounded-full object-cover" />
                          <span className="text-sm text-ink truncate">{user.fullName}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="p-4 border-t border-line bg-surface-2 flex justify-end gap-2">
                <button
                  onClick={closeNewChatModal}
                  className="px-4 py-2 text-sm font-medium text-ink hover:bg-surface rounded-lg transition-colors"
                >
                  Cancel
                </button>
                {chatMode === "group" && (
                  <button
                    onClick={handleCreateGroup}
                    className="px-4 py-2 text-sm font-medium bg-accent hover:bg-accent-hover text-white rounded-lg transition-colors disabled:opacity-50"
                    disabled={!groupName.trim() || selectedUsers.length === 0}
                  >
                    Create Group
                  </button>
                )}
              </div>
            </motion.div>
            </TiltCard>
          </motion.div>
        )}
      </AnimatePresence>

    </aside>
  );
};
export default Sidebar;
