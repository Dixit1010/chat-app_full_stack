import { useRef, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import { Image, Send, X, Mic, Square } from "lucide-react";
import toast from "react-hot-toast";
import { useAiStore } from "../store/useAiStore";

const MessageInput = () => {
  const [text, setText] = useState("");
  const [imagePreview, setImagePreview] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  
  const { sendMessage, messages, selectedConversation } = useChatStore();
  const { smartReplies, fetchSmartReplies } = useAiStore();
  const { socket } = useAuthStore();
  
  const fileInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

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
    };
  }, []);

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
    if (!text.trim() && !imagePreview) return;

    try {
      await sendMessage({
        text: text.trim(),
        image: imagePreview?.url,
        mediaType: imagePreview?.type
      });

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
          sendMessage({ image: reader.result, mediaType: 'audio' });
        };
        reader.readAsDataURL(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch {
      toast.error("Microphone access denied");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
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
              className="absolute -top-1.5 -right-1.5 size-5 rounded-full bg-surface-3 border border-line flex items-center justify-center text-ink-muted hover:text-ink"
            >
              <X className="size-3" />
            </button>
          </div>
        </div>
      )}

      <form onSubmit={handleSendMessage} className="flex items-center gap-2">
        <div className="flex-1 flex items-center gap-1.5 bg-surface-2 border border-line rounded-2xl pl-4 pr-1.5 py-1.5 focus-within:border-accent/40 focus-within:ring-2 focus-within:ring-accent/20 transition-all shadow-elevation-1 focus-within:shadow-elevation-2">
          <input
            type="text"
            className="flex-1 bg-transparent text-sm text-ink placeholder:text-ink-faint outline-none py-1"
            placeholder={isRecording ? "Recording audio..." : "Message..."}
            value={text}
            onChange={handleInputChange}
            disabled={isRecording}
          />
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
            disabled={isRecording}
            className={`size-8 rounded-full flex items-center justify-center shrink-0 transition-colors ${
              imagePreview ? "text-accent" : "text-ink-faint hover:text-ink hover:bg-surface-3"
            }`}
          >
            <Image size={18} />
          </button>
        </div>

        {isRecording ? (
          <motion.button
            type="button"
            onClick={stopRecording}
            whileTap={{ scale: 0.9 }}
            className="size-10 rounded-full flex items-center justify-center shrink-0 bg-red-500 text-white shadow-md animate-pulse"
          >
            <Square size={16} fill="currentColor" />
          </motion.button>
        ) : text.trim() || imagePreview ? (
          <motion.button
            type="submit"
            whileTap={{ scale: 0.9 }}
            className="size-10 rounded-full flex items-center justify-center shrink-0 bg-accent text-white shadow-glow-accent hover:bg-accent-hover transition-colors"
          >
            <Send size={17} />
          </motion.button>
        ) : (
          <motion.button
            type="button"
            onClick={startRecording}
            whileTap={{ scale: 0.9 }}
            className="size-10 rounded-full flex items-center justify-center shrink-0 bg-surface-2 border border-line text-ink-muted hover:text-ink hover:bg-surface-3 transition-colors"
          >
            <Mic size={17} />
          </motion.button>
        )}
      </form>
    </div>
  );
};
export default MessageInput;
