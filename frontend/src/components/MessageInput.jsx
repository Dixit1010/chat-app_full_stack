import { useRef, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import { useSoundStore } from "../store/useSoundStore";
import { Image, Send, X, Mic, Square, ShieldAlert, Smile, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import { useAiStore } from "../store/useAiStore";
import { useMotionPreferences, applyMotion, fadeUp } from "../lib/motion";

const EMOJI_CATEGORIES = {
  Smileys: ["😀", "😂", "🥰", "😎", "🤔", "😅", "😊", "🥳", "😭", "🙄"],
  Gestures: ["👍", "👎", "👋", "🙌", "👏", "🤝", "✌️", "🤞", "🤌", "💪"],
  Objects: ["🎉", "🔥", "❤️", "✨", "💯", "🎈", "💡", "⭐", "🎵", "📷"]
};

const MessageInput = () => {
  const [text, setText] = useState("");
  const [imagePreview, setImagePreview] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  
  const { sendMessage, messages, selectedConversation, replyingTo, clearReplyingTo, blockedByThemConversations, isSending } = useChatStore();
  const { smartReplies, fetchSmartReplies } = useAiStore();
  const { socket, authUser, unblockUser } = useAuthStore();
  const { shouldReduceMotion } = useMotionPreferences();
  
  const otherUser = selectedConversation && !selectedConversation.isGroup 
    ? selectedConversation.participants.find(p => (p._id || p) !== authUser._id)
    : null;
    
  const otherUserId = otherUser?._id || otherUser;
  
  const isBlockedByMe = otherUserId && authUser?.blockedUsers?.includes(otherUserId);
  const isBlockedByThem = selectedConversation && blockedByThemConversations.includes(selectedConversation._id);
  
  const fileInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordingIntervalRef = useRef(null);
  const emojiRef = useRef(null);

  useEffect(() => {
    if (messages.length > 0) {
      const recent = messages.slice(-5).map(m => m.text).join("\n");
      const t = setTimeout(() => fetchSmartReplies(recent), 1000);
      return () => clearTimeout(t);
    }
  }, [messages, fetchSmartReplies]);

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      if (recordingIntervalRef.current) clearInterval(recordingIntervalRef.current);
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && replyingTo) {
        clearReplyingTo();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [replyingTo, clearReplyingTo]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (emojiRef.current && !emojiRef.current.contains(e.target)) {
        setShowEmojiPicker(false);
      }
    };
    if (showEmojiPicker) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showEmojiPicker]);

  const emitTypingState = (isTypingEvent) => {
    if (!socket || !selectedConversation) return;
    const participants = selectedConversation.participants.map(p => p._id || p);
    
    socket.emit(isTypingEvent ? "typing" : "stopTyping", { 
      conversationId: selectedConversation._id,
      participants
    });
  };

  const handleInputChange = (e) => {
    setText(e.target.value);

    emitTypingState(true);

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    typingTimeoutRef.current = setTimeout(() => {
      emitTypingState(false);
    }, 1000);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) {
      toast.error("Please select an image or video file");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview({ url: reader.result, type: file.type.startsWith("video/") ? "video" : "image" });
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSendMessage = async (e) => {
    if (e) e.preventDefault();
    if ((!text.trim() && !imagePreview) || isSending) return;

    try {
      await sendMessage({
        text: text.trim(),
        image: imagePreview?.url,
        mediaType: imagePreview?.type
      });
      
      useSoundStore.getState().playMessageSent();

      setText("");
      setImagePreview(null);
      if (fileInputRef.current) fileInputRef.current.value = "";

      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      emitTypingState(false);
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onloadend = () => {
          sendMessage({ image: reader.result, mediaType: 'audio' }).then(() => {
            useSoundStore.getState().playMessageSent();
          });
        };
        reader.readAsDataURL(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch {
      toast.error("Microphone access denied");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      clearInterval(recordingIntervalRef.current);
      setRecordingTime(0);
    }
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
      clearInterval(recordingIntervalRef.current);
      setRecordingTime(0);
      audioChunksRef.current = [];
    }
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="p-3 sm:p-4 border-t border-line bg-surface/95 backdrop-blur-sm shadow-[0_-1px_12px_-4px_rgba(0,0,0,0.06)] shrink-0">
      {smartReplies.length > 0 && !imagePreview && (
        <div className="flex gap-2 overflow-x-auto pb-3 scrollbar-thin">
          {smartReplies.map((reply, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setText(reply)}
              className="px-3 py-1.5 bg-surface-2 hover:bg-surface-3 text-ink rounded-full text-xs whitespace-nowrap border border-line transition-colors"
            >
              ✨ {reply}
            </button>
          ))}
        </div>
      )}

      {imagePreview && (
        <div className="mb-2.5 flex items-center gap-2">
          <div className="relative">
            {imagePreview.type === "image" ? (
              <img
                src={imagePreview.url}
                alt="Preview"
                className="w-16 h-16 object-cover rounded-xl border border-line"
              />
            ) : (
              <video 
                src={imagePreview.url}
                className="w-16 h-16 object-cover rounded-xl border border-line"
              />
            )}
            <button
              type="button"
              onClick={removeImage}
              aria-label="Remove image"
              className="absolute -top-1.5 -right-1.5 size-5 rounded-full bg-surface-3 border border-line flex items-center justify-center text-ink-muted hover:text-ink"
            >
              <X className="size-3" />
            </button>
          </div>
        </div>
      )}

      {replyingTo && (
        <div className="flex items-center justify-between bg-surface-2 border border-line rounded-xl px-3 py-2 mb-2 text-sm shadow-elevation-1">
          <div className="flex flex-col min-w-0">
            <span className="font-semibold text-accent text-[11px] mb-0.5">
              Replying to {replyingTo.senderId === authUser._id ? "You" : (selectedConversation?.participants?.find(p => (p._id || p) === replyingTo.senderId)?.fullName || "Unknown")}
            </span>
            <span className="text-ink-muted text-xs truncate">
              {replyingTo.deletedAt ? "This message was deleted" :
               replyingTo.text ? replyingTo.text :
               replyingTo.mediaType === "image" ? "📷 Photo" :
               replyingTo.mediaType === "video" ? "🎥 Video" :
               replyingTo.mediaType === "audio" ? "🎤 Voice message" : "Message"}
            </span>
          </div>
          <button
            type="button"
            onClick={clearReplyingTo}
            className="p-1.5 rounded-full text-ink-muted hover:text-ink hover:bg-surface-3 transition-colors ml-2 shrink-0"
          >
            <X className="size-3.5" />
          </button>
        </div>
      )}

      {isBlockedByMe ? (
        <div className="flex flex-col items-center justify-center p-4 bg-surface-2 border border-line rounded-2xl text-center space-y-3 shadow-elevation-1">
          <p className="text-sm text-ink-muted">You blocked this person — unblock them to send messages</p>
          <button
            onClick={() => unblockUser(otherUserId)}
            className="flex items-center gap-2 px-4 py-1.5 bg-surface-3 hover:bg-surface-4 text-ink text-sm font-medium rounded-full transition-colors border border-line"
          >
            <ShieldAlert className="w-4 h-4" />
            Unblock
          </button>
        </div>
      ) : (
      <form onSubmit={handleSendMessage} className="flex items-center gap-2">
        <div className="flex-1 flex items-center gap-1.5 bg-surface-2 border border-line rounded-2xl pl-4 pr-1.5 py-1.5 focus-within:border-accent/40 focus-within:ring-2 focus-within:ring-accent/20 transition-all shadow-elevation-1 focus-within:shadow-elevation-2 relative">
          
          <AnimatePresence>
            {showEmojiPicker && (
              <motion.div
                {...applyMotion(fadeUp, shouldReduceMotion)}
                ref={emojiRef}
                className="absolute bottom-[calc(100%+8px)] left-0 bg-surface rounded-xl shadow-elevation-3 border border-line p-3 w-64 z-50 origin-bottom-left"
              >
                <div className="h-48 overflow-y-auto scrollbar-thin pr-1">
                  {Object.entries(EMOJI_CATEGORIES).map(([cat, emojis]) => (
                    <div key={cat} className="mb-3 last:mb-0">
                      <div className="text-[11px] font-semibold text-ink-faint uppercase tracking-wider mb-2">{cat}</div>
                      <div className="grid grid-cols-5 gap-1">
                        {emojis.map(e => (
                          <button
                            key={e}
                            type="button"
                            onClick={() => {
                              setText(prev => prev + e);
                            }}
                            className="text-xl hover:bg-surface-2 rounded-lg py-1 transition-colors flex items-center justify-center"
                          >
                            {e}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {isRecording ? (
            <div className="flex-1 flex items-center justify-between py-0.5">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={cancelRecording}
                  aria-label="Cancel recording"
                  className="size-8 rounded-full flex items-center justify-center text-ink-muted hover:text-red-500 hover:bg-red-50 transition-colors"
                >
                  <Trash2 size={16} />
                </button>
                <motion.div
                  animate={{ opacity: [1, 0.2, 1] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                  className="size-2.5 bg-red-500 rounded-full"
                />
                <span className="text-sm font-medium text-ink tabular-nums">{formatTime(recordingTime)}</span>
              </div>
              
              <button
                type="button"
                onClick={stopRecording}
                aria-label="Stop recording"
                className="size-8 rounded-full flex items-center justify-center shrink-0 bg-red-500 text-white shadow-md hover:bg-red-600 transition-colors mr-1"
              >
                <Square size={14} fill="currentColor" />
              </button>
            </div>
          ) : (
            <input
              type="text"
              className="flex-1 bg-transparent text-sm text-ink placeholder:text-ink-faint outline-none py-1"
              placeholder="Message..."
              value={text}
              onChange={handleInputChange}
            />
          )}
          
          {!isRecording && (
            <>
              <button
                type="button"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                aria-label="Toggle emoji picker"
                className={`size-8 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                  showEmojiPicker ? "text-accent bg-accent/10" : "text-ink-muted hover:text-ink hover:bg-surface-3"
                }`}
              >
                <Smile size={19} />
              </button>

              <input
                type="file"
                accept="image/*,video/*"
                className="hidden"
                ref={fileInputRef}
                onChange={handleImageChange}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                aria-label="Attach image"
                className={`size-8 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                  imagePreview ? "text-accent" : "text-ink-muted hover:text-ink hover:bg-surface-3"
                }`}
              >
                <Image size={19} />
              </button>
            </>
          )}
        </div>

        {text.trim() || imagePreview ? (
          <motion.button
            type="button"
            onClick={handleSendMessage}
            disabled={isSending}
            whileTap={{ scale: 0.9 }}
            className="size-10 rounded-full flex items-center justify-center shrink-0 bg-accent text-white shadow-glow-accent hover:bg-accent-hover transition-colors disabled:opacity-50"
            aria-label="Send message"
          >
            <Send size={17} />
          </motion.button>
        ) : (
          <motion.button
            type="button"
            onClick={isRecording ? stopRecording : startRecording}
            whileTap={shouldReduceMotion ? {} : { scale: 0.9 }}
            className={`size-10 rounded-full flex items-center justify-center shrink-0 transition-colors border focus:outline-none focus:ring-2 focus:ring-accent ${
              isRecording 
                ? "bg-surface-3 border-line-soft text-ink-muted opacity-50 cursor-not-allowed" 
                : "bg-surface-2 border-line text-ink-muted hover:text-ink hover:bg-surface-3"
            }`}
            disabled={isRecording}
            aria-label="Record voice message"
          >
            <Mic size={17} />
          </motion.button>
        )}
      </form>
      )}
    </div>
  );
};
export default MessageInput;
