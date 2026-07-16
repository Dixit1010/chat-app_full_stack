import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, X, Search, Phone, Video, Sparkles, CheckSquare } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";
import { useCallStore } from "../store/useCallStore";
import { useAiStore } from "../store/useAiStore";
import { useState } from "react";
import { createPortal } from "react-dom";
import TiltCard from "./TiltCard";
import GroupInfoModal from "./GroupInfoModal";
import UserProfileModal from "./UserProfileModal";
import { applyMotion, fadeUp, useMotionPreferences } from "../lib/motion";

const TypingDots = () => {
  const { shouldReduceMotion } = useMotionPreferences();
  return (
    <span className="inline-flex items-center gap-0.5">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="size-1 rounded-full bg-online"
          animate={shouldReduceMotion ? { y: 0 } : { y: [0, -3, 0] }}
          transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.15, ease: "easeInOut" }}
        />
      ))}
    </span>
  );
};

const ChatHeader = () => {
  const { selectedConversation, setSelectedConversation, isTyping, searchMessages, messages, isSelectMode, setIsSelectMode } = useChatStore();
  const { onlineUsers, authUser } = useAuthStore();
  const { initCall } = useCallStore();
  const { summarizeChat, summary, isSummarizing, clearSummary } = useAiStore();
  
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isGroupInfoOpen, setIsGroupInfoOpen] = useState(false);
  const [isUserProfileOpen, setIsUserProfileOpen] = useState(false);
  const { shouldReduceMotion } = useMotionPreferences();

  if (!selectedConversation) return null;

  let name = "Unknown";
  let avatar = "/avatar.png";
  let isOnline = false;
  let subtitle = "";

  if (selectedConversation.isGroup) {
    name = selectedConversation.groupName;
    avatar = selectedConversation.groupAvatar || "/avatar.png";
    subtitle = `${selectedConversation.participants.length} members`;
  } else {
    const otherUser = selectedConversation.participants.find(p => p._id !== authUser._id) || selectedConversation.participants[0];
    if (otherUser) {
      name = otherUser.fullName;
      avatar = otherUser.profilePic || "/avatar.png";
      isOnline = onlineUsers.includes(otherUser._id);
    }
    subtitle = isOnline ? "Online" : "Offline";
  }

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
    clearTimeout(window.searchTimeout);
    window.searchTimeout = setTimeout(() => {
      searchMessages(e.target.value);
    }, 300);
  };

  const toggleSearch = () => {
    if (isSearching) {
      searchMessages("");
      setSearchQuery("");
    }
    setIsSearching(!isSearching);
  };

  const handleSummarize = () => {
    const textHistory = messages.map(m => m.text).join('\n');
    summarizeChat(textHistory);
  };

  return (
    <div className="px-4 sm:px-5 py-3 border-b border-line bg-surface/70 backdrop-blur-xl shadow-elevation-1 flex items-center justify-between shrink-0">
      <div className="flex items-center gap-1 min-w-0">
        <button
          type="button"
          onClick={() => setSelectedConversation(null)}
          aria-label="Back to chats"
          className="lg:hidden -ml-1 size-8 rounded-full flex items-center justify-center text-ink-faint hover:text-ink hover:bg-surface-2 transition-colors shrink-0 focus:outline-none focus:ring-2 focus:ring-accent"
        >
          <ArrowLeft className="size-4" />
        </button>

        <button
          type="button"
          onClick={() => {
            if (selectedConversation.isGroup) setIsGroupInfoOpen(true);
            else setIsUserProfileOpen(true);
          }}
          aria-label="View profile"
          className="flex items-center gap-3 min-w-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-accent rounded-lg p-1 -ml-1"
        >
          <div className="relative shrink-0">
            <img
              src={avatar}
              alt={name}
              className="size-10 rounded-full object-cover"
            />
            {isOnline && !selectedConversation.isGroup && (
              <span className="absolute bottom-0 right-0 size-2.5 bg-online rounded-full ring-2 ring-surface" />
            )}
          </div>

          <div className="min-w-0 text-left">
            <h3 className="font-semibold text-sm text-ink truncate">{name}</h3>
            <div className="text-xs text-ink-faint h-4 flex items-center gap-1.5">
              {isTyping ? (
                <>
                  <TypingDots />
                  <span className="text-online">typing</span>
                </>
              ) : (
                <span className="truncate">{subtitle}</span>
              )}
            </div>
          </div>
        </button>
      </div>

      <div className="flex items-center gap-3">
        {/* Gap for future pinned messages bar to slot into */}
        <div className="w-2" aria-hidden="true" />
        
        {/* Cluster 1: Communication */}
        <div className="flex items-center gap-1">
          {!selectedConversation.isGroup && (
            <>
              <button
                type="button"
                onClick={() => initCall(selectedConversation.participants.find(p => p._id !== authUser._id)?._id, false)}
                aria-label="Voice call"
                className="size-9 rounded-full flex items-center justify-center text-ink-muted hover:text-ink hover:bg-surface-2 transition-colors shrink-0 focus:outline-none focus:ring-2 focus:ring-accent"
              >
                <Phone className="size-5" />
              </button>
              <button
                type="button"
                onClick={() => initCall(selectedConversation.participants.find(p => p._id !== authUser._id)?._id, true)}
                aria-label="Video call"
                className="size-9 rounded-full flex items-center justify-center text-ink-muted hover:text-ink hover:bg-surface-2 transition-colors shrink-0 focus:outline-none focus:ring-2 focus:ring-accent"
              >
                <Video className="size-5" />
              </button>
            </>
          )}

          <button
            type="button"
            onClick={handleSummarize}
            aria-label="Summarize Chat"
            className="size-9 rounded-full flex items-center justify-center text-ink-muted hover:text-ink hover:bg-surface-2 transition-colors shrink-0 focus:outline-none focus:ring-2 focus:ring-accent"
            title="Summarize Chat"
          >
            <Sparkles className="size-5" />
          </button>
        </div>

        {/* Divider */}
        <div className="w-[1px] h-5 bg-line" />

        {/* Cluster 2: Actions */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setIsSelectMode(!isSelectMode)}
            aria-label="Select messages"
            className={`size-9 rounded-full flex items-center justify-center transition-colors shrink-0 focus:outline-none focus:ring-2 focus:ring-accent ${isSelectMode ? "bg-accent-soft text-accent shadow-[inset_0_0_0_1px_rgba(var(--accent-rgb),0.15)]" : "text-ink-muted hover:text-ink hover:bg-surface-2"}`}
            title="Select messages"
          >
            <CheckSquare className="size-5" />
          </button>

          <div className="flex items-center relative h-9">
            <AnimatePresence>
              {isSearching && (
                <motion.input
                  {...applyMotion({ initial: { width: 0, opacity: 0 }, animate: { width: 180, opacity: 1 }, exit: { width: 0, opacity: 0 }, transition: { duration: 0.2, ease: "easeOut" } }, shouldReduceMotion)}
                  type="text"
                  placeholder="Search in chat..."
                  value={searchQuery}
                  onChange={handleSearch}
                  className="bg-surface-2 border border-line rounded-full pl-3 pr-8 py-1.5 text-sm outline-none text-ink placeholder:text-ink-faint absolute right-0 z-0 h-full"
                  autoFocus
                />
              )}
            </AnimatePresence>
            <button
              type="button"
              onClick={toggleSearch}
              aria-label="Search messages"
              className={`size-9 rounded-full flex items-center justify-center transition-colors shrink-0 z-10 focus:outline-none focus:ring-2 focus:ring-accent ${isSearching ? "text-ink" : "text-ink-muted hover:text-ink hover:bg-surface-2"}`}
            >
              <Search className="size-5" />
            </button>
          </div>

          <button
            type="button"
            onClick={() => setSelectedConversation(null)}
            aria-label="Close chat"
            className="size-9 rounded-full flex items-center justify-center text-ink-muted hover:text-ink hover:bg-surface-2 transition-colors shrink-0 ml-1 hover:text-red-500 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500"
            title="Close chat"
          >
            <X className="size-5" />
          </button>
        </div>
      </div>

      {(summary || isSummarizing) && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <TiltCard className="max-w-sm w-full">
            <div className="bg-surface rounded-xl shadow-elevation-3 border border-line-soft p-6">
              <h3 className="font-bold mb-4 flex items-center gap-2"><Sparkles className="size-5 text-accent"/> AI Summary</h3>
              {isSummarizing ? <p className="text-ink-muted animate-pulse">Summarizing...</p> : <p className="text-sm text-ink mb-6">{summary}</p>}
              <div className="flex justify-end">
                <button onClick={clearSummary} className="px-4 py-2 bg-surface-2 hover:bg-surface-3 rounded-lg text-sm transition-colors">Close</button>
              </div>
            </div>
          </TiltCard>
        </div>,
        document.body
      )}

      {createPortal(
        <AnimatePresence>
          {isGroupInfoOpen && selectedConversation.isGroup && (
            <motion.div
              {...applyMotion({ initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } }, shouldReduceMotion)}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
            >
              <GroupInfoModal conversation={selectedConversation} onClose={() => setIsGroupInfoOpen(false)} />
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}

      <UserProfileModal
        isOpen={isUserProfileOpen}
        onClose={() => setIsUserProfileOpen(false)}
        user={selectedConversation.participants.find(p => p._id !== authUser._id) || selectedConversation.participants[0]}
      />
    </div>
  );
};
export default ChatHeader;
