import { useChatStore } from "../store/useChatStore";
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

import ChatHeader from "./ChatHeader";
import MessageInput from "./MessageInput";
import MessageSkeleton from "./skeletons/MessageSkeleton";
import { useAuthStore } from "../store/useAuthStore";
import { formatMessageTime, formatDateDivider } from "../lib/utils";
import { Check, CheckCheck, Edit2, Trash2, Languages, Reply, Forward, Pin } from "lucide-react";
import { useAiStore } from "../store/useAiStore";
import toast from "react-hot-toast";
import ForwardModal from "./ForwardModal";
import { applyMotion, fadeUp, springPop, useMotionPreferences } from "../lib/motion";

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
    deleteMessage,
    bulkDeleteMessages,
    setReplyingTo,
    togglePinMessage,
    isSelectMode,
    setIsSelectMode
  } = useChatStore();
  
  const { translateMessage } = useAiStore();
  const { authUser } = useAuthStore();
  const messageEndRef = useRef(null);
  const scrollContainerRef = useRef(null);
  const isAtBottomRef = useRef(true);
  const [prevScrollHeight, setPrevScrollHeight] = useState(null);
  const [hoveredMessage, setHoveredMessage] = useState(null);
  
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editText, setEditText] = useState("");
  const [forwardMessageData, setForwardMessageData] = useState(null);
  
  const [selectedMessageIds, setSelectedMessageIds] = useState(new Set());
  const { shouldReduceMotion } = useMotionPreferences();

  useEffect(() => {
    if (!isSelectMode) {
      setSelectedMessageIds(new Set());
    }
  }, [isSelectMode]);

  const toggleSelection = (msgId) => {
    setSelectedMessageIds(prev => {
      const next = new Set(prev);
      if (next.has(msgId)) next.delete(msgId);
      else next.add(msgId);
      return next;
    });
  };

  const handleBulkDelete = () => {
    if (selectedMessageIds.size === 0) return;
    if (window.confirm(`Are you sure you want to delete ${selectedMessageIds.size} message(s)?`)) {
      bulkDeleteMessages(Array.from(selectedMessageIds));
      setIsSelectMode(false);
    }
  };

  useEffect(() => {
    if (selectedConversation) {
      getMessages(selectedConversation._id);
      // Reset scroll tracking on new conversation
      isAtBottomRef.current = true;
    }
  }, [selectedConversation?._id, getMessages]);

  const handleScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target;
    
    // We consider the user to be "at the bottom" if they are within 100px of the bottom
    isAtBottomRef.current = Math.abs(scrollHeight - clientHeight - scrollTop) < 100;

    if (scrollTop === 0 && !isMessagesLoading) {
      setPrevScrollHeight(scrollHeight);
      loadMoreMessages();
    }
  };

  useEffect(() => {
    if (prevScrollHeight && scrollContainerRef.current) {
      // We loaded older messages, maintain scroll position relative to the old height
      const currentScrollHeight = scrollContainerRef.current.scrollHeight;
      scrollContainerRef.current.scrollTop = currentScrollHeight - prevScrollHeight;
      setPrevScrollHeight(null);
    } else if (scrollContainerRef.current) {
      // Check if we should scroll to bottom
      // We scroll if the user was already at the bottom, OR if the last message is from the user
      const lastMessage = messages[messages.length - 1];
      const isFromMe = lastMessage && lastMessage.senderId === authUser._id;
      
      if (isAtBottomRef.current || isFromMe) {
        scrollContainerRef.current.scrollTo({ top: scrollContainerRef.current.scrollHeight, behavior: "smooth" });
      }
    }
  }, [messages, prevScrollHeight, authUser._id]);

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
    <div className="flex-1 flex flex-col min-w-0 min-h-0 bg-surface relative">
      <ChatHeader />

      {/* Pinned Messages Bar */}
      {messages.some(m => m.pinned) && (
        <div className="bg-surface-2 border-b border-line px-4 py-2 flex flex-col gap-1 z-10 shadow-elevation-1">
          <div className="text-xs font-medium text-ink flex items-center gap-1.5">
            <Pin className="size-3.5 fill-current text-accent" />
            {messages.filter(m => m.pinned).length} pinned message{messages.filter(m => m.pinned).length !== 1 ? 's' : ''}
          </div>
          <div className="max-h-32 overflow-y-auto space-y-1 mt-1 scrollbar-thin">
             {messages.filter(m => m.pinned).sort((a, b) => new Date(b.pinnedAt) - new Date(a.pinnedAt)).map(m => (
                <div key={`pin-${m._id}`} className="text-[11px] hover:bg-surface p-1.5 rounded-md flex items-center justify-between cursor-pointer"
                  onClick={() => {
                     const el = document.getElementById(`msg-${m._id}`);
                     if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                     else toast('Scroll up to find this message', { icon: '📌' });
                  }}
                >
                  <div className="flex flex-col min-w-0">
                    <span className="font-semibold text-accent">{m.senderId === authUser._id ? "You" : getSenderName(m.senderId)}</span>
                    <span className="truncate text-ink-muted max-w-[250px]">
                      {m.deletedAt ? "Deleted" : m.text ? m.text : m.mediaType === 'image' ? "📷 Photo" : m.mediaType === 'video' ? "🎥 Video" : "🎤 Audio"}
                    </span>
                  </div>
                  <span className="text-[9px] text-ink-faint shrink-0">{formatMessageTime(m.createdAt)}</span>
                </div>
             ))}
          </div>
        </div>
      )}

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
          const isFirstOfDay = idx === 0 || new Date(message.createdAt).toDateString() !== new Date(messages[idx - 1].createdAt).toDateString();
          
          const isLastInGroup =
            !next ||
            next.senderId !== message.senderId ||
            new Date(next.createdAt) - new Date(message.createdAt) > GROUP_GAP_MS ||
            new Date(next.createdAt).toDateString() !== new Date(message.createdAt).toDateString();
          
          const isFirstInGroup = idx === 0 || messages[idx - 1].senderId !== message.senderId || new Date(message.createdAt) - new Date(messages[idx - 1].createdAt) > GROUP_GAP_MS || isFirstOfDay;

          // Group reactions
          const groupedReactions = message.reactions?.reduce((acc, r) => {
            acc[r.emoji] = (acc[r.emoji] || 0) + 1;
            return acc;
          }, {});

          const isLockedPlaceholder = message.text === "🔒 Encrypted message" && !message.deletedAt;

          return (
            <div key={message._id}>
              {isFirstOfDay && (
                <div className="flex justify-center my-4">
                  <span className="bg-surface-2 text-ink-faint text-xs px-3 py-1 rounded-full shadow-elevation-1">
                    {formatDateDivider(message.createdAt)}
                  </span>
                </div>
              )}
              <motion.div
                id={`msg-${message._id}`}
                {...applyMotion(fadeUp, shouldReduceMotion)}
                ref={idx === messages.length - 1 ? messageEndRef : null}
                className={`flex items-end gap-2 ${isOwn ? "justify-end" : "justify-start"} ${
                  isLastInGroup ? "mb-2" : "mb-0.5"
                }`}
                onMouseEnter={() => !isSelectMode && setHoveredMessage(message._id)}
                onMouseLeave={() => setHoveredMessage(null)}
              >
              {isSelectMode && (
                <div onClick={() => toggleSelection(message._id)} className={`size-5 rounded flex items-center justify-center shrink-0 cursor-pointer border transition-colors mb-2 ${selectedMessageIds.has(message._id) ? "bg-accent border-accent text-white" : "border-line"}`}>
                  {selectedMessageIds.has(message._id) && <Check className="size-3.5" />}
                </div>
              )}
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
                
                <div
                  className="relative group"
                  onClick={(e) => {
                    if (isSelectMode) {
                      e.stopPropagation();
                      toggleSelection(message._id);
                    } else if (!message.deletedAt) {
                      // onMouseEnter/Leave alone reveals this menu on desktop,
                      // but touch devices have no hover — tap opens it there.
                      // (Always set, never toggle: a real click is preceded by
                      // a synthesized hover on desktop, so toggling off the
                      // menu hover just opened.) Tapping the message-list
                      // background (handled below) closes it again.
                      setHoveredMessage(message._id);
                    }
                  }}
                >
                  <div
                    className={`relative shadow-elevation-1 break-words leading-snug
                      ${message.mediaType === 'audio' && !message.deletedAt ? 'rounded-full py-1.5 px-2' : 'rounded-2xl px-3.5 py-2'}
                      ${isOwn && !message.deletedAt && !isLockedPlaceholder
                        ? `bg-gradient-to-br from-accent to-accent-hover text-white ${message.mediaType === 'audio' ? '' : 'rounded-br-md'}`
                        : !message.deletedAt && !isLockedPlaceholder
                          ? `bg-surface-2 text-ink border border-line-soft ${message.mediaType === 'audio' ? '' : 'rounded-bl-md'}`
                          : ''
                      } 
                      ${message.deletedAt ? "italic text-ink-faint bg-surface-3 !text-ink-faint shadow-none px-3.5 py-2 rounded-2xl" : ""} 
                      ${isLockedPlaceholder ? "italic text-ink-faint bg-surface-3 !text-ink-faint border-dashed border-line shadow-none px-3.5 py-2 rounded-2xl" : ""}`}
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
                        {message.forwardedFrom && (
                          <div className={`text-[10px] text-ink-faint italic mb-1.5 flex items-center gap-1 ${isOwn ? "justify-end" : "justify-start"}`}>
                            <Forward className="size-3" /> Forwarded
                          </div>
                        )}
                        {message.replyTo && !message.forwardedFrom && (() => {
                          const replyMsg = messages.find(m => m._id === message.replyTo);
                          return (
                            <div className={`mb-1.5 pl-2.5 pr-2 py-1.5 text-xs border-l-[3px] ${isOwn ? 'border-accent bg-black/10 text-white/70' : 'border-accent bg-surface-3 text-ink-faint'} rounded-r-md`}>
                              {replyMsg ? (
                                <>
                                  <div className={`font-semibold mb-0.5 ${isOwn ? 'text-white/90' : 'text-ink'}`}>
                                    {replyMsg.senderId === authUser._id ? "You" : getSenderName(replyMsg.senderId)}
                                  </div>
                                  <div className="truncate opacity-80 max-w-[200px]">
                                    {replyMsg.deletedAt ? "This message was deleted" :
                                     replyMsg.text ? replyMsg.text :
                                     replyMsg.mediaType === "image" ? "📷 Photo" :
                                     replyMsg.mediaType === "video" ? "🎥 Video" :
                                     replyMsg.mediaType === "audio" ? "🎤 Voice message" : "Original message"}
                                  </div>
                                </>
                              ) : (
                                <div className="italic opacity-70">Original message</div>
                              )}
                            </div>
                          );
                        })()}
                        {message.image && (
                          <div className={`overflow-hidden ${message.text ? "mb-1.5" : ""} ${message.mediaType === 'audio' ? '' : '-mx-3.5 -mt-2 rounded-[inherit]'}`}>
                            {message.mediaType === "video" ? (
                              <video src={message.image} controls className="block w-full max-w-[260px] object-cover" />
                            ) : message.mediaType === "audio" ? (
                              <audio src={message.image} controls className="block h-[34px] w-[200px]" />
                            ) : (
                              <img src={message.image} alt="Attachment" className="block w-full max-w-[260px] object-cover" />
                            )}
                          </div>
                        )}
                        {message.text && (
                          <p className={`whitespace-pre-wrap text-[14px] ${message.image && message.mediaType !== 'audio' ? 'px-0.5 pb-0.5 text-[13px] opacity-90' : ''}`}>
                            {message.text}
                          </p>
                        )}
                      </>
                    )}
                    
                    {/* Reactions display */}
                    {!message.deletedAt && message.reactions && message.reactions.length > 0 && (
                      <div className={`absolute -bottom-3 flex gap-1 ${isOwn ? "right-1" : "left-1"}`}>
                        {Object.entries(groupedReactions).map(([emoji, count]) => (
                          <motion.button
                            {...applyMotion({ initial: { scale: 0 }, animate: { scale: 1 }, exit: { scale: 0 }, transition: shouldReduceMotion ? { duration: 0.001 } : { type: "spring", stiffness: 400, damping: 25 } }, shouldReduceMotion)}
                            key={emoji}
                            onClick={() => reactToMessage(message._id, emoji)}
                            className={`flex items-center gap-1 bg-surface border border-line rounded-full px-1.5 py-0.5 text-[11px] shadow-elevation-1 hover:scale-110 transition-transform focus:outline-none focus:ring-1 focus:ring-accent ${isOwn ? 'text-ink' : ''}`}
                            aria-label={`React with ${emoji}`}
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
                    {!isSelectMode && hoveredMessage === message._id && !message.deletedAt && (
                      <motion.div
                        {...applyMotion(springPop, shouldReduceMotion)}
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
                        <div className="w-[1px] bg-line my-1 mx-0.5" />
                        <button
                          onClick={() => {
                            setReplyingTo(message);
                            setHoveredMessage(null);
                          }}
                          className="hover:bg-surface-2 p-1.5 rounded-full text-ink-muted hover:text-ink transition-colors focus:outline-none focus:ring-2 focus:ring-accent"
                          title="Reply"
                          aria-label="Reply to message"
                        >
                          <Reply className="size-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            setForwardMessageData(message);
                            setHoveredMessage(null);
                          }}
                          className="hover:bg-surface-2 p-1.5 rounded-full text-ink-muted hover:text-ink transition-colors focus:outline-none focus:ring-2 focus:ring-accent"
                          title="Forward"
                          aria-label="Forward message"
                        >
                          <Forward className="size-3.5" />
                        </button>
                        <div className="w-[1px] bg-line my-1 mx-0.5" />
                        <button
                          onClick={() => {
                            togglePinMessage(message._id);
                            setHoveredMessage(null);
                          }}
                          className="hover:bg-surface-2 p-1.5 rounded-full text-ink-muted hover:text-ink transition-colors focus:outline-none focus:ring-2 focus:ring-accent"
                          title={message.pinned ? "Unpin" : "Pin"}
                          aria-label={message.pinned ? "Unpin message" : "Pin message"}
                        >
                          <Pin className={`size-3.5 ${message.pinned ? "fill-current text-accent" : ""}`} />
                        </button>
                        {message.text && (
                          <>
                            <div className="w-[1px] bg-line my-1 mx-0.5" />
                            <button
                              onClick={() => handleTranslate(message._id, message.text)}
                              className="hover:bg-surface-2 p-1.5 rounded-full text-ink-muted hover:text-ink transition-colors focus:outline-none focus:ring-2 focus:ring-accent"
                              title="Translate to Spanish"
                              aria-label="Translate message"
                            >
                              <Languages className="size-3.5" />
                            </button>
                          </>
                        )}
                        {isOwn && (
                          <>
                            <div className="w-[1px] bg-line my-1 mx-0.5" />
                            {message.text && (
                              <button
                                onClick={() => {
                                  setEditingMessageId(message._id);
                                  setEditText(message.text || "");
                                  setHoveredMessage(null);
                                }}
                                className="hover:bg-surface-2 p-1.5 rounded-full text-ink-muted hover:text-ink transition-colors focus:outline-none focus:ring-2 focus:ring-accent"
                                title="Edit"
                                aria-label="Edit message"
                              >
                                <Edit2 className="size-3.5" />
                              </button>
                            )}
                            <button
                              onClick={() => {
                                deleteMessage(message._id);
                                setHoveredMessage(null);
                              }}
                              className="hover:bg-red-50 p-1.5 rounded-full text-red-400 hover:text-red-500 transition-colors focus:outline-none focus:ring-2 focus:ring-red-400"
                              title="Delete"
                              aria-label="Delete message"
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
                    {message.pinned && <Pin className="size-2.5 fill-current text-accent" />}
                    {isOwn && <StatusTicks status={message.status} />}
                  </div>
                )}
              </div>
            </motion.div>
            </div>
          );
        })}
      </div>

      <MessageInput />
      
      <AnimatePresence>
        {isSelectMode && selectedMessageIds.size > 0 && (
          <motion.div
            {...applyMotion(fadeUp, shouldReduceMotion)}
            className="absolute bottom-20 left-1/2 -translate-x-1/2 bg-surface border border-line shadow-elevation-3 rounded-full px-4 py-2 flex items-center gap-4 z-20"
          >
            <span className="text-sm font-medium text-ink">
              {selectedMessageIds.size} selected
            </span>
            <div className="w-[1px] h-4 bg-line" />
            <button
              onClick={() => {
                const msgsToForward = Array.from(selectedMessageIds).map(id => messages.find(m => m._id === id)).filter(Boolean);
                setForwardMessageData(msgsToForward);
                setIsSelectMode(false);
              }}
              className="text-ink-muted hover:text-ink transition-colors flex items-center gap-1.5 text-sm font-medium"
            >
              <Forward className="size-4" /> Forward
            </button>
            <button
              onClick={handleBulkDelete}
              className="text-red-400 hover:text-red-500 transition-colors flex items-center gap-1.5 text-sm font-medium"
            >
              <Trash2 className="size-4" /> Delete
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <ForwardModal 
        isOpen={!!forwardMessageData} 
        onClose={() => setForwardMessageData(null)} 
        messageData={forwardMessageData} 
      />
    </div>
  );
};
export default ChatContainer;
