import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import SidebarSkeleton from "./skeletons/SidebarSkeleton";
import { Search, Users, Plus, X, Check, MessageCircle, UserPlus, AtSign, Loader2, Pin, BellOff, Trash2, LogOut } from "lucide-react";
import toast from "react-hot-toast";
import TiltCard from "./TiltCard";
import UserProfileModal from "./UserProfileModal";
import { axiosInstance } from "../lib/axios";
import { applyMotion, fadeUp, staggerContainer, staggerItem, useMotionPreferences } from "../lib/motion";

const itemVariants = {
  hidden: { opacity: 0, x: -8 },
  show: { opacity: 1, x: 0 },
};

const ConversationRow = ({ conv, isSelected, unread, onSelect, onContextMenu, onTouchStart, onTouchEnd, onTouchMove, shouldReduceMotion }) => {
  return (
    <motion.button
      {...applyMotion(staggerItem, shouldReduceMotion)}
      whileHover={shouldReduceMotion ? {} : { x: 2 }}
      onClick={onSelect}
      onContextMenu={(e) => onContextMenu(e, conv)}
      onTouchStart={(e) => onTouchStart(e, conv)}
      onTouchEnd={onTouchEnd}
      onTouchMove={onTouchMove}
      className={`relative w-full flex items-center gap-3 px-4 py-2.5 transition-colors focus:outline-none focus:bg-surface-2 focus:ring-2 focus:ring-accent focus:ring-inset
        ${isSelected ? "bg-accent-soft shadow-[inset_0_0_0_1px_rgba(var(--accent-rgb),0.15)]" : "hover:bg-surface-2"}`}
    >
      {isSelected && (
        <motion.span
          layoutId="sidebar-active-indicator"
          className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-full bg-accent"
          transition={{ type: "spring", stiffness: 500, damping: 35 }}
        />
      )}

      <div className="relative shrink-0">
        <img
          src={conv.details.avatar}
          alt={conv.details.name}
          className={`size-11 object-cover rounded-full ${isSelected ? "ring-2 ring-accent/50" : ""}`}
        />
        {conv.details.isOnline && (
          <span className="absolute bottom-0 right-0 size-2.5 bg-online rounded-full ring-2 ring-surface" />
        )}
        {conv.isGroup && (
          <div className="absolute -bottom-1 -right-1 bg-surface border border-line rounded-full p-0.5 z-10">
            <Users className="size-2.5 text-ink-muted" />
          </div>
        )}
      </div>

      <div className="text-left min-w-0 flex-1">
        <div className="font-medium text-sm text-ink truncate">{conv.details.name}</div>
        <div className="text-xs text-ink-faint truncate">
          {conv.isGroup ? `${conv.participants.length} members` : (conv.details.isOnline ? "Online" : "Offline")}
        </div>
      </div>

      {unread > 0 && (
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={shouldReduceMotion ? { duration: 0.001 } : { type: "spring", stiffness: 500, damping: 20 }}
          className="flex ml-auto bg-accent text-white text-[11px] font-semibold rounded-full h-5 min-w-[20px] items-center justify-center px-1.5 shrink-0"
        >
          {unread > 99 ? "99+" : unread}
        </motion.span>
      )}
    </motion.button>
  );
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

  const { onlineUsers, authUser, togglePinConversation } = useAuthStore();
  const [showOnlineOnly, setShowOnlineOnly] = useState(false);
  const [query, setQuery] = useState("");
  const [isNewChatModalOpen, setIsNewChatModalOpen] = useState(false);
  const [chatMode, setChatMode] = useState("dm"); // "dm" | "group"
  const { shouldReduceMotion } = useMotionPreferences();

  // Context Menu
  const [contextMenu, setContextMenu] = useState(null);
  const longPressTimerRef = useRef(null);

  useEffect(() => {
    const handleClick = () => setContextMenu(null);
    window.addEventListener("click", handleClick);
    return () => window.removeEventListener("click", handleClick);
  }, []);

  const handleContextMenu = (e, conv) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, conv });
  };

  const handleTouchStart = (e, conv) => {
    const touch = e.touches[0];
    longPressTimerRef.current = setTimeout(() => {
      setContextMenu({ x: touch.clientX, y: touch.clientY, conv });
    }, 500);
  };
  const handleTouchEnd = () => clearTimeout(longPressTimerRef.current);

  // New Group state
  const [groupName, setGroupName] = useState("");
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [startingDmId, setStartingDmId] = useState(null);

  // Find User state
  const [isFindUserModalOpen, setIsFindUserModalOpen] = useState(false);
  const [findUsername, setFindUsername] = useState("");
  const [foundUser, setFoundUser] = useState(null);
  const [findUserError, setFindUserError] = useState("");
  const [isFinding, setIsFinding] = useState(false);
  const [findUserDebounce, setFindUserDebounce] = useState(null);
  const [selectedUserForProfile, setSelectedUserForProfile] = useState(null);

  const handleFindUserChange = (e) => {
    const val = e.target.value.toLowerCase().replace(/\s/g, "");
    setFindUsername(val);
    setFoundUser(null);
    setFindUserError("");
    
    if (findUserDebounce) clearTimeout(findUserDebounce);
    
    if (!val) return;
    
    setIsFinding(true);
    setFindUserDebounce(setTimeout(async () => {
      try {
        const res = await axiosInstance.get(`/messages/find/${val}`);
        if (res.data._id === authUser._id) {
          setFindUserError("That's you!");
        } else {
          setFoundUser(res.data);
        }
      } catch (err) {
        setFindUserError("No user found");
      } finally {
        setIsFinding(false);
      }
    }, 300));
  };

  const handleMessageFoundUser = async () => {
    if (!foundUser) return;
    setIsFindUserModalOpen(false);
    await handleStartDM(foundUser);
    setFindUsername("");
    setFoundUser(null);
  };

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

  const pinnedConversations = useMemo(() => {
    return filteredConversations.filter(c => authUser?.pinnedConversations?.includes(c._id));
  }, [filteredConversations, authUser?.pinnedConversations]);
  
  const unpinnedConversations = useMemo(() => {
    return filteredConversations.filter(c => !authUser?.pinnedConversations?.includes(c._id));
  }, [filteredConversations, authUser?.pinnedConversations]);

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
    <aside className="h-full min-h-0 w-full lg:w-[300px] border-r border-line bg-surface flex flex-col shrink-0 relative shadow-elevation-1">
      <div className="border-b border-line px-5 py-5 space-y-4">
        <div className="flex items-center justify-between text-ink">
          <h1 className="text-2xl font-bold tracking-tight">Chats</h1>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsFindUserModalOpen(true)}
              aria-label="Find People"
              className="flex items-center justify-center p-1.5 hover:bg-surface-2 rounded-md transition-colors text-ink-muted hover:text-ink focus:outline-none focus:ring-2 focus:ring-accent"
              title="Find People"
            >
              <UserPlus className="size-4.5" />
            </button>
            <button
              onClick={() => setIsNewChatModalOpen(true)}
              aria-label="New Chat"
              className="flex items-center justify-center p-1.5 hover:bg-surface-2 rounded-md transition-colors text-ink-muted hover:text-ink focus:outline-none focus:ring-2 focus:ring-accent"
              title="New Chat"
            >
              <Plus className="size-4.5" />
            </button>
          </div>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-ink-muted pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search chats..."
            className="w-full bg-surface-2 border border-line rounded-lg pl-9 pr-3 py-1.5 text-sm text-ink placeholder:text-ink-faint outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all"
          />
        </div>

        <div className="flex items-center justify-end">
          <label className="flex items-center gap-2 cursor-pointer select-none group">
            <span className="text-[10px] font-bold text-ink-muted group-hover:text-ink transition-colors uppercase tracking-wider">Online only</span>
            <input
              type="checkbox"
              checked={showOnlineOnly}
              onChange={(e) => setShowOnlineOnly(e.target.checked)}
              className="peer sr-only"
            />
            <span
              className="relative h-3.5 w-6 rounded-full bg-surface-3 peer-checked:bg-accent transition-colors
              after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:size-2.5 after:rounded-full
              after:bg-white after:shadow after:transition-transform peer-checked:after:translate-x-2.5"
            />
          </label>
        </div>
      </div>

      <motion.div
        {...applyMotion(staggerContainer, shouldReduceMotion)}
        className="flex-1 min-h-0 overflow-y-auto py-2 scrollbar-thin"
      >
        {pinnedConversations.length > 0 && (
          <div className="mb-4">
            <div className="px-5 py-1.5 flex items-center gap-2 text-ink-muted">
              <Pin className="size-3" />
              <span className="text-[11px] font-bold uppercase tracking-wider">Pinned</span>
            </div>
            {pinnedConversations.map((conv) => (
              <ConversationRow
                key={conv._id}
                conv={conv}
                isSelected={selectedConversation?._id === conv._id}
                unread={unreadCounts[conv._id]}
                shouldReduceMotion={shouldReduceMotion}
                onSelect={() => setSelectedConversation(conv)}
                onContextMenu={handleContextMenu}
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
                onTouchMove={handleTouchEnd}
              />
            ))}
          </div>
        )}

        <div>
          {pinnedConversations.length > 0 && unpinnedConversations.length > 0 && (
            <div className="px-5 py-1.5 flex items-center gap-2 text-ink-muted">
              <MessageCircle className="size-3" />
              <span className="text-[11px] font-bold uppercase tracking-wider">All Chats</span>
            </div>
          )}
          {unpinnedConversations.map((conv) => (
            <ConversationRow
              key={conv._id}
              conv={conv}
              isSelected={selectedConversation?._id === conv._id}
              unread={unreadCounts[conv._id]}
              shouldReduceMotion={shouldReduceMotion}
              onSelect={() => setSelectedConversation(conv)}
              onContextMenu={handleContextMenu}
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
              onTouchMove={handleTouchEnd}
            />
          ))}
        </div>

        {filteredConversations.length === 0 && (
          <div className="text-center text-ink-faint text-sm py-8 px-4">
            {query ? "No chats match your search" : "No conversations yet"}
          </div>
        )}
      </motion.div>

      <AnimatePresence>
        {contextMenu && (
          <motion.div
            {...applyMotion(fadeUp, shouldReduceMotion)}
            style={{ top: contextMenu.y, left: contextMenu.x }}
            className="fixed z-50 mt-2 w-48 bg-surface rounded-xl shadow-elevation-3 border border-line py-1 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => {
                togglePinConversation(contextMenu.conv._id);
                setContextMenu(null);
              }}
              className="w-full flex items-center gap-3 px-4 py-2 text-sm text-ink hover:bg-surface-2 transition-colors"
            >
              <Pin className="size-4" />
              {authUser?.pinnedConversations?.includes(contextMenu.conv._id) ? "Unpin Chat" : "Pin Chat"}
            </button>
            <button
              onClick={() => {
                toast("Mute feature coming soon!");
                setContextMenu(null);
              }}
              className="w-full flex items-center gap-3 px-4 py-2 text-sm text-ink hover:bg-surface-2 transition-colors"
            >
              <BellOff className="size-4" /> Mute
            </button>
            
            <div className="h-px bg-line my-1" />
            
            {contextMenu.conv.isGroup ? (
              <button
                onClick={async () => {
                  try {
                    await useChatStore.getState().updateGroup(contextMenu.conv._id, { action: "remove", participants: [authUser._id] });
                  } catch (e) {}
                  setContextMenu(null);
                }}
                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-500 hover:bg-red-50 transition-colors"
              >
                <LogOut className="size-4" /> Leave Group
              </button>
            ) : (
              <button
                onClick={() => {
                  toast("Direct message deletion coming soon!");
                  setContextMenu(null);
                }}
                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-500 hover:bg-red-50 transition-colors"
              >
                <Trash2 className="size-4" /> Delete Chat
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isNewChatModalOpen && (
          <motion.div
            {...applyMotion({ initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } }, shouldReduceMotion)}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
          >
            <TiltCard className="w-full max-w-md">
            <motion.div
              {...applyMotion(fadeUp, shouldReduceMotion)}
              className="bg-surface rounded-xl shadow-elevation-3 w-full overflow-hidden flex flex-col max-h-[80vh]"
            >
              <div className="p-4 border-b border-line flex items-center justify-between">
                <h2 className="font-semibold text-ink">New Chat</h2>
                <button onClick={closeNewChatModal} aria-label="Close" className="text-ink-muted hover:text-ink focus:outline-none focus:ring-2 focus:ring-accent rounded-full p-1">
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

      {/* Find User Modal */}
      <AnimatePresence>
        {isFindUserModalOpen && (
          <motion.div
            {...applyMotion({ initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } }, shouldReduceMotion)}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
          >
            <TiltCard className="w-full max-w-sm">
              <motion.div
                {...applyMotion(fadeUp, shouldReduceMotion)}
                className="bg-surface rounded-xl shadow-elevation-3 w-full overflow-hidden flex flex-col"
              >
                <div className="p-4 border-b border-line flex items-center justify-between">
                  <h2 className="font-semibold text-ink">Find People</h2>
                  <button 
                    onClick={() => {
                      setIsFindUserModalOpen(false);
                      setFindUsername("");
                      setFoundUser(null);
                      setFindUserError("");
                    }} 
                    aria-label="Close"
                    className="text-ink-muted hover:text-ink focus:outline-none focus:ring-2 focus:ring-accent rounded-full p-1"
                  >
                    <X className="size-5" />
                  </button>
                </div>

                <div className="p-4 space-y-4">
                  <div className="relative">
                    <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-ink-muted pointer-events-none" />
                    <input
                      type="text"
                      autoFocus
                      placeholder="exact_username"
                      value={findUsername}
                      onChange={handleFindUserChange}
                      className="w-full bg-surface-2 border border-line rounded-lg pl-9 pr-4 py-2 text-sm text-ink outline-none focus:border-accent shadow-elevation-1"
                    />
                    {isFinding && (
                      <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-accent animate-spin" />
                    )}
                  </div>

                  {findUserError && (
                    <div className="text-center text-sm text-ink-muted py-4">
                      {findUserError}
                    </div>
                  )}

                  {foundUser && (
                    <div className="flex items-center justify-between p-3 bg-surface-2 rounded-xl border border-line">
                      <div 
                        className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer group"
                        onClick={() => setSelectedUserForProfile(foundUser)}
                      >
                        <img 
                          src={foundUser.profilePic || "/avatar.png"} 
                          alt={foundUser.fullName} 
                          className="size-10 rounded-full object-cover group-hover:ring-2 group-hover:ring-accent transition-all" 
                        />
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-semibold text-ink truncate">{foundUser.fullName}</div>
                          <div className="text-xs text-accent truncate">@{foundUser.username}</div>
                        </div>
                      </div>
                      <button
                        onClick={handleMessageFoundUser}
                        className="ml-3 px-3 py-1.5 bg-accent hover:bg-accent-hover text-white text-xs font-medium rounded-lg transition-colors shadow-glow-accent shrink-0"
                      >
                        Message
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            </TiltCard>
          </motion.div>
        )}
      </AnimatePresence>

      <UserProfileModal 
        isOpen={!!selectedUserForProfile} 
        onClose={() => setSelectedUserForProfile(null)} 
        user={selectedUserForProfile} 
      />
    </aside>
  );
};
export default Sidebar;
