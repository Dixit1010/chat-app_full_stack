import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Search, Check, Send } from "lucide-react";
import TiltCard from "./TiltCard";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import { applyMotion, fadeUp, useMotionPreferences } from "../lib/motion";

const ForwardModal = ({ isOpen, onClose, messageData }) => {
  const { conversations, forwardMessage, getUsers } = useChatStore();
  const { authUser } = useAuthStore();
  const [query, setQuery] = useState("");
  const [selectedConvs, setSelectedConvs] = useState([]);
  const [isSending, setIsSending] = useState(false);
  const { shouldReduceMotion } = useMotionPreferences();

  useEffect(() => {
    if (isOpen) {
      getUsers();
    }
  }, [isOpen, getUsers]);

  const getConvDetails = (conv) => {
    if (conv.isGroup) {
      return {
        id: conv._id,
        name: conv.groupName || "Unnamed Group",
        avatar: conv.groupAvatar || "/avatar.png",
      };
    } else {
      const otherUser = conv.participants.find(p => p._id !== authUser._id) || conv.participants[0];
      return {
        id: conv._id,
        name: otherUser ? otherUser.fullName : "Unknown User",
        avatar: otherUser?.profilePic || "/avatar.png",
      };
    }
  };

  const filtered = useMemo(() => {
    let list = conversations.map(c => ({ ...c, details: getConvDetails(c) }));
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter((c) => c.details.name.toLowerCase().includes(q));
    }
    return list;
  }, [conversations, query, authUser]);

  const toggleSelection = (id) => {
    if (selectedConvs.includes(id)) {
      setSelectedConvs(selectedConvs.filter(i => i !== id));
    } else {
      setSelectedConvs([...selectedConvs, id]);
    }
  };

  const handleForward = async () => {
    if (selectedConvs.length === 0 || !messageData) return;
    setIsSending(true);
    try {
      const msgs = Array.isArray(messageData) ? messageData : [messageData];
      
      for (const convId of selectedConvs) {
        for (const msg of msgs) {
          const payload = {
            text: msg.text,
            image: msg.image,
            mediaType: msg.mediaType
          };
          await forwardMessage(payload, convId);
        }
      }
      onClose();
      setSelectedConvs([]);
      setQuery("");
    } finally {
      setIsSending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        {...applyMotion({ initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } }, shouldReduceMotion)}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      >
        <TiltCard className="w-full max-w-sm">
          <motion.div
            {...applyMotion(fadeUp, shouldReduceMotion)}
            className="bg-surface rounded-xl shadow-elevation-3 w-full overflow-hidden flex flex-col max-h-[80vh]"
          >
            <div className="p-4 border-b border-line flex items-center justify-between">
              <h2 className="font-semibold text-ink">Forward to...</h2>
              <button onClick={onClose} aria-label="Close" className="text-ink-muted hover:text-ink transition-colors focus:outline-none focus:ring-2 focus:ring-accent rounded-full p-1">
                <X className="size-5" />
              </button>
            </div>

            <div className="p-4 border-b border-line bg-surface-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-ink-faint pointer-events-none" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search chats..."
                  className="w-full bg-surface border border-line rounded-lg pl-8 pr-3 py-2 text-sm text-ink placeholder:text-ink-faint outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all shadow-elevation-1"
                />
              </div>
            </div>

            <div className="overflow-y-auto flex-1 p-2 scrollbar-thin max-h-64">
              {filtered.map(conv => {
                const isSelected = selectedConvs.includes(conv._id);
                return (
                  <div
                    key={conv._id}
                    onClick={() => toggleSelection(conv._id)}
                    className="flex items-center gap-3 p-2 hover:bg-surface-2 rounded-lg cursor-pointer transition-colors"
                  >
                    <div className={`size-4 shrink-0 rounded border flex items-center justify-center transition-colors ${isSelected ? 'bg-accent border-accent text-white' : 'border-line'}`}>
                      {isSelected && <Check className="size-3" />}
                    </div>
                    <img src={conv.details.avatar} alt={conv.details.name} className="size-9 rounded-full object-cover shrink-0" />
                    <span className="text-sm font-medium text-ink truncate">{conv.details.name}</span>
                  </div>
                );
              })}
              {filtered.length === 0 && (
                <div className="text-center text-ink-faint text-sm py-6">
                  No chats found
                </div>
              )}
            </div>

            <div className="p-4 border-t border-line bg-surface-2 flex items-center justify-between">
              <span className="text-xs font-medium text-ink-muted">
                {selectedConvs.length} selected
              </span>
              <button
                onClick={handleForward}
                disabled={selectedConvs.length === 0 || isSending}
                aria-label="Send forwarded messages"
                className="flex items-center gap-1.5 px-4 py-2 bg-accent hover:bg-accent-hover disabled:opacity-50 text-white text-sm font-medium rounded-lg shadow-glow-accent transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-surface focus:ring-accent"
              >
                {isSending ? "Sending..." : (
                  <>
                    <Send className="size-4" /> Send
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </TiltCard>
      </motion.div>
    </AnimatePresence>
  );
};

export default ForwardModal;
