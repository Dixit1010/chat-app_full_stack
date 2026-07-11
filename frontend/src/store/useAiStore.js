import { create } from "zustand";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";

export const useAiStore = create((set) => ({
  smartReplies: [],
  isFetchingReplies: false,
  isSummarizing: false,
  summary: null,
  isTranslating: false,

  fetchSmartReplies: async (messagesContext) => {
    if (!messagesContext.trim()) return;
    set({ isFetchingReplies: true });
    try {
      const res = await axiosInstance.post("/ai/smart-reply", { messagesContext });
      set({ smartReplies: res.data });
    } catch (error) {
      set({ smartReplies: [] });
    } finally {
      set({ isFetchingReplies: false });
    }
  },

  summarizeChat: async (chatHistory) => {
    if (!chatHistory.trim()) {
      toast.error("Not enough messages to summarize");
      return;
    }
    set({ isSummarizing: true, summary: null });
    try {
      const res = await axiosInstance.post("/ai/summarize", { chatHistory });
      set({ summary: res.data.summary });
    } catch (error) {
      toast.error("Summarization failed");
    } finally {
      set({ isSummarizing: false });
    }
  },

  translateMessage: async (text, targetLanguage = "English") => {
    set({ isTranslating: true });
    try {
      const res = await axiosInstance.post("/ai/translate", { text, targetLanguage });
      return res.data.translation;
    } catch (error) {
      toast.error("Translation failed");
      return text;
    } finally {
      set({ isTranslating: false });
    }
  },
  
  clearSummary: () => set({ summary: null }),
  clearSmartReplies: () => set({ smartReplies: [] }),
}));
