import { motion, AnimatePresence } from "framer-motion";
import { X, Search, Phone, Video, Sparkles } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";
import { useCallStore } from "../store/useCallStore";
import { useAiStore } from "../store/useAiStore";
import { useState } from "react";
import TiltCard from "./TiltCard";

const TypingDots = () => (
  <span className="inline-flex items-center gap-0.5">
    {[0, 1, 2].map((i) => (
      <motion.span
        key={i}
        className="size-1 rounded-full bg-online"
        animate={{ y: [0, -3, 0] }}
        transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.15, ease: "easeInOut" }}
      />
    ))}
  </span>
);

const ChatHeader = () => {
  const { selectedConversation, setSelectedConversation, isTyping, searchMessages, messages } = useChatStore();
  const { onlineUsers, authUser } = useAuthStore();
  const { initCall } = useCallStore();
  const { summarizeChat, summary, isSummarizing, clearSummary } = useAiStore();
  
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

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
      <div className="flex items-center gap-3 min-w-0">
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

        <div className="min-w-0">
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
      </div>

      <div className="flex items-center gap-2">
        <AnimatePresence>
          {isSearching && (
            <motion.input
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 160, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              type="text"
              placeholder="Search in chat..."
              value={searchQuery}
              onChange={handleSearch}
              className="bg-surface-2 border border-line rounded-full px-3 py-1.5 text-sm outline-none text-ink placeholder:text-ink-faint"
              autoFocus
            />
          )}
        </AnimatePresence>
        
        <button
          type="button"
          onClick={toggleSearch}
          className={`size-8 rounded-full flex items-center justify-center transition-colors shrink-0 ${isSearching ? "bg-accent/10 text-accent" : "text-ink-faint hover:text-ink hover:bg-surface-2"}`}
        >
          <Search className="size-4" />
        </button>

        {!selectedConversation.isGroup && isOnline && (
          <>
            <button
              type="button"
              onClick={() => initCall(selectedConversation.participants.find(p => p._id !== authUser._id)?._id, false)}
              className="size-8 rounded-full flex items-center justify-center text-ink-faint hover:text-ink hover:bg-surface-2 transition-colors shrink-0"
            >
              <Phone className="size-4" />
            </button>
            <button
              type="button"
              onClick={() => initCall(selectedConversation.participants.find(p => p._id !== authUser._id)?._id, true)}
              className="size-8 rounded-full flex items-center justify-center text-ink-faint hover:text-ink hover:bg-surface-2 transition-colors shrink-0"
            >
              <Video className="size-4" />
            </button>
          </>
        )}

        <button
          type="button"
          onClick={handleSummarize}
          className="size-8 rounded-full flex items-center justify-center text-ink-faint hover:text-ink hover:bg-surface-2 transition-colors shrink-0"
          title="Summarize Chat"
        >
          <Sparkles className="size-4" />
        </button>

        <button
          type="button"
          onClick={() => setSelectedConversation(null)}
          className="size-8 rounded-full flex items-center justify-center text-ink-faint hover:text-ink hover:bg-surface-2 transition-colors shrink-0"
        >
          <X className="size-4" />
        </button>
      </div>

      {(summary || isSummarizing) && (
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
        </div>
      )}
    </div>
  );
};
export default ChatHeader;
