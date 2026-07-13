import { useChatStore } from "../store/useChatStore";
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

import ChatHeader from "./ChatHeader";
import MessageInput from "./MessageInput";
import MessageSkeleton from "./skeletons/MessageSkeleton";
import { useAuthStore } from "../store/useAuthStore";
import { formatMessageTime } from "../lib/utils";
import { Check, CheckCheck, Edit2, Trash2, Languages } from "lucide-react";
import { useAiStore } from "../store/useAiStore";
import toast from "react-hot-toast";

const GROUP_GAP_MS = 5 * 60 * 1000;
const EMOJIS = ["👍", "❤️", "😂", "😮", "😢"];

const StatusTicks = ({ status }) => {
  if (status === "seen") return <CheckCheck className="size-3 text-accent" />;
  if (status === "delivered") return <CheckCheck className="size-3 text-ink-faint" />;
  return <Check className="size-3 text-ink-faint" />;
};

const ChatContainer = () => {
  const {
    messages,
    getMessages,
    loadMoreMessages,
    isMessagesLoading,
    selectedConversation,
    reactToMessage,
    editMessage,
    deleteMessage
  } = useChatStore();
  
  const { translateMessage } = useAiStore();
  const { authUser } = useAuthStore();
  const messageEndRef = useRef(null);
  const scrollContainerRef = useRef(null);
  const [prevScrollHeight, setPrevScrollHeight] = useState(null);
  const [hoveredMessage, setHoveredMessage] = useState(null);
  
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editText, setEditText] = useState("");

  useEffect(() => {
    if (selectedConversation) {
      getMessages(selectedConversation._id);
    }
  }, [selectedConversation?._id, getMessages]);

  const handleScroll = (e) => {
    const { scrollTop, scrollHeight } = e.target;
    if (scrollTop === 0 && !isMessagesLoading) {
      setPrevScrollHeight(scrollHeight);
      loadMoreMessages();
    }
  };

  useEffect(() => {
    if (prevScrollHeight && scrollContainerRef.current) {
      const currentScrollHeight = scrollContainerRef.current.scrollHeight;
      scrollContainerRef.current.scrollTop = currentScrollHeight - prevScrollHeight;
      setPrevScrollHeight(null);
    } else if (scrollContainerRef.current && messages) {
      scrollContainerRef.current.scrollTo({ top: scrollContainerRef.current.scrollHeight, behavior: "smooth" });
    }
  }, [messages, prevScrollHeight]);

  if (isMessagesLoading && messages.length === 0) {
    return (
      <div className="flex-1 flex flex-col min-w-0 min-h-0 bg-surface">
        <ChatHeader />
        <MessageSkeleton />
        <MessageInput />
      </div>
    );
  }

  const getSenderAvatar = (senderId) => {
    const p = selectedConversation?.participants?.find(p => (p._id || p) === senderId);
    return p?.profilePic || "/avatar.png";
  };

  const getSenderName = (senderId) => {
    const p = selectedConversation?.participants?.find(p => (p._id || p) === senderId);
    return p?.fullName || "Unknown";
  };
  
  const handleSaveEdit = (msgId) => {
    if (editText.trim()) {
      editMessage(msgId, editText.trim());
    }
    setEditingMessageId(null);
  };

  const handleTranslate = async (msgId, text) => {
    setHoveredMessage(null);
    const translated = await translateMessage(text, "Spanish");
    if (translated && translated !== text) {
      toast.success(translated, { duration: 5000, icon: "🌍" });
    }
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 min-h-0 bg-surface">
      <ChatHeader />

      <div
        className="flex-1 min-h-0 overflow-y-auto px-4 sm:px-6 py-4 space-y-1 scrollbar-thin chat-wallpaper"
        ref={scrollContainerRef}
        onScroll={handleScroll}
      >
        {isMessagesLoading && messages.length > 0 && (
          <div className="text-center text-xs text-ink-faint py-2">Loading earlier messages...</div>
        )}

        {messages.map((message, idx) => {
          const isOwn = message.senderId === authUser._id;
          const next = messages[idx + 1];
          const isLastInGroup =
            !next ||
            next.senderId !== message.senderId ||
            new Date(next.createdAt) - new Date(message.createdAt) > GROUP_GAP_MS;
          
          const isFirstInGroup = idx === 0 || messages[idx - 1].senderId !== message.senderId || new Date(message.createdAt) - new Date(messages[idx - 1].createdAt) > GROUP_GAP_MS;

          // Group reactions
          const groupedReactions = message.reactions?.reduce((acc, r) => {
            acc[r.emoji] = (acc[r.emoji] || 0) + 1;
            return acc;
          }, {});

          const isLockedPlaceholder = message.text === "🔒 Encrypted message" && !message.deletedAt;

          return (
            <motion.div
              key={message._id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              ref={idx === messages.length - 1 ? messageEndRef : null}
              className={`flex items-end gap-2 ${isOwn ? "justify-end" : "justify-start"} ${
                isLastInGroup ? "mb-2" : "mb-0.5"
              }`}
              onMouseEnter={() => setHoveredMessage(message._id)}
              onMouseLeave={() => setHoveredMessage(null)}
            >
              {!isOwn && (
                <img
                  src={getSenderAvatar(message.senderId)}
                  alt=""
                  title={getSenderName(message.senderId)}
                  className={`size-7 rounded-full object-cover shrink-0 ${
                    isLastInGroup ? "opacity-100" : "opacity-0"
                  }`}
                />
              )}

              <div className={`flex flex-col max-w-[75%] sm:max-w-[60%] ${isOwn ? "items-end" : "items-start"}`}>
                {!isOwn && isFirstInGroup && selectedConversation?.isGroup && (
                  <span className="text-[10px] text-ink-faint ml-1 mb-0.5">{getSenderName(message.senderId)}</span>
                )}
                
                <div className="relative group">
                  <div
                    className={`px-3.5 py-2 text-sm leading-relaxed break-words relative shadow-elevation-1 ${
                      isOwn
                        ? "bg-gradient-to-br from-accent to-accent-hover text-white rounded-2xl rounded-br-md"
                        : "bg-surface-2 text-ink rounded-2xl rounded-bl-md border border-line-soft"
                    } ${message.deletedAt ? "italic text-ink-faint bg-surface-3 !text-ink-faint shadow-none" : ""} ${isLockedPlaceholder ? "italic text-ink-faint bg-surface-3 !text-ink-faint border-dashed border-line shadow-none" : ""}`}
                  >
                    {message.deletedAt ? (
                      "This message was deleted"
                    ) : editingMessageId === message._id ? (
                      <div className="flex flex-col gap-2 min-w-[200px]">
                        <input 
                          type="text" 
                          autoFocus
                          value={editText} 
                          onChange={e => setEditText(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && handleSaveEdit(message._id)}
                          className="bg-transparent border-b border-white/40 outline-none text-sm placeholder:text-white/60"
                        />
                        <div className="flex gap-2 justify-end mt-1">
                          <button onClick={() => setEditingMessageId(null)} className="text-[10px] bg-black/20 px-2 py-1 rounded">Cancel</button>
                          <button onClick={() => handleSaveEdit(message._id)} className="text-[10px] bg-white text-accent font-semibold px-2 py-1 rounded">Save</button>
                        </div>
                      </div>
                    ) : (
                      <>
                        {message.image && (
                          <>
                            {message.mediaType === "video" ? (
                              <video src={message.image} controls className="max-w-[220px] rounded-lg mb-1.5" />
                            ) : message.mediaType === "audio" ? (
                              <audio src={message.image} controls className="w-[220px] mb-1.5" />
                            ) : (
                              <img src={message.image} alt="Attachment" className="max-w-[220px] rounded-lg mb-1.5" />
                            )}
                          </>
                        )}
                        {message.text && <p className="whitespace-pre-wrap">{message.text}</p>}
                      </>
                    )}
                    
                    {/* Reactions display */}
                    {!message.deletedAt && message.reactions && message.reactions.length > 0 && (
                      <div className={`absolute -bottom-3 flex gap-1 ${isOwn ? "right-1" : "left-1"}`}>
                        {Object.entries(groupedReactions).map(([emoji, count]) => (
                          <motion.button
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            key={emoji}
                            onClick={() => reactToMessage(message._id, emoji)}
                            className={`flex items-center gap-1 bg-surface border border-line rounded-full px-1.5 py-0.5 text-[11px] shadow-elevation-1 hover:scale-110 transition-transform ${isOwn ? 'text-ink' : ''}`}
                          >
                            <span>{emoji}</span>
                            {count > 1 && <span className="text-ink-muted">{count}</span>}
                          </motion.button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Hover Menu */}
                  <AnimatePresence>
                    {hoveredMessage === message._id && !message.deletedAt && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.8, y: 10 }}
                        transition={{ duration: 0.15 }}
                        className={`absolute -top-10 flex gap-1 bg-surface border border-line rounded-full p-1 shadow-elevation-2 z-10 ${
                          isOwn ? "right-0" : "left-0"
                        }`}
                      >
                        {EMOJIS.map(emoji => (
                          <button
                            key={emoji}
                            onClick={() => {
                              reactToMessage(message._id, emoji);
                              setHoveredMessage(null);
                            }}
                            className="hover:scale-125 transition-transform hover:bg-surface-2 p-1 rounded-full text-base"
                          >
                            {emoji}
                          </button>
                        ))}
                        {message.text && (
                          <>
                            <div className="w-[1px] bg-line my-1 mx-0.5" />
                            <button
                              onClick={() => handleTranslate(message._id, message.text)}
                              className="hover:bg-surface-2 p-1.5 rounded-full text-ink-muted hover:text-ink transition-colors"
                              title="Translate to Spanish"
                            >
                              <Languages className="size-3.5" />
                            </button>
                          </>
                        )}
                        {isOwn && (
                          <>
                            <div className="w-[1px] bg-line my-1 mx-0.5" />
                            <button
                              onClick={() => {
                                setEditingMessageId(message._id);
                                setEditText(message.text || "");
                                setHoveredMessage(null);
                              }}
                              className="hover:bg-surface-2 p-1.5 rounded-full text-ink-muted hover:text-ink transition-colors"
                              title="Edit"
                            >
                              <Edit2 className="size-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                deleteMessage(message._id);
                                setHoveredMessage(null);
                              }}
                              className="hover:bg-red-50 p-1.5 rounded-full text-red-400 hover:text-red-500 transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="size-3.5" />
                            </button>
                          </>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {isLastInGroup && (
                  <div className={`flex items-center gap-1 mt-1 px-1 text-[11px] text-ink-faint ${message.reactions?.length > 0 && !message.deletedAt ? 'mt-3' : 'mt-1'}`}>
                    <span>{formatMessageTime(message.createdAt)}</span>
                    {message.edited && !message.deletedAt && <span>(edited)</span>}
                    {isOwn && <StatusTicks status={message.status} />}
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      <MessageInput />
    </div>
  );
};
export default ChatContainer;
