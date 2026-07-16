import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";
import { useAuthStore } from "./useAuthStore";
import { useSoundStore } from "./useSoundStore";
import { generateConversationKey, encryptKeyForRecipient, decryptConversationKey, encryptMessageText, decryptMessageText } from "../lib/e2ee";

export const useChatStore = create((set, get) => ({
  messages: [],
  conversations: [],
  users: [],
  selectedConversation: null,
  activeSymmetricKey: null,
  isConversationsLoading: false,
  isUsersLoading: false,
  isMessagesLoading: false,
  isTyping: false,
  replyingTo: null,
  unreadCounts: {},
  hasMoreMessages: true,
  isSelectMode: false,
  blockedByThemConversations: [],
  setBlockedByThem: (conversationId) => set((state) => ({ blockedByThemConversations: [...state.blockedByThemConversations, conversationId] })),

  getUsers: async () => {
    set({ isUsersLoading: true });
    try {
      const res = await axiosInstance.get("/messages/users");
      set({ users: res.data });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to fetch users");
    } finally {
      set({ isUsersLoading: false });
    }
  },

  getConversations: async () => {
    set({ isConversationsLoading: true });
    try {
      const res = await axiosInstance.get("/conversations");
      set({ conversations: res.data });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to fetch conversations");
    } finally {
      set({ isConversationsLoading: false });
    }
  },

  decryptMessages: (messagesToDecrypt) => {
    const { activeSymmetricKey } = get();
    return messagesToDecrypt.map(msg => {
      if (msg.isEncrypted && msg.text) {
        if (!activeSymmetricKey) return { ...msg, text: "🔒 Encrypted message" };
        return { ...msg, text: decryptMessageText(msg.text, activeSymmetricKey) };
      }
      return msg;
    });
  },

  getMessages: async (conversationId) => {
    set({ isMessagesLoading: true });
    try {
      const res = await axiosInstance.get(`/messages/${conversationId}`);
      set({ messages: get().decryptMessages(res.data), hasMoreMessages: res.data.length === 30 });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to fetch messages");
    } finally {
      set({ isMessagesLoading: false });
    }
  },

  searchMessages: async (query) => {
    const { selectedConversation, getMessages, decryptMessages } = get();
    if (!selectedConversation) return;

    if (!query) {
      return getMessages(selectedConversation._id);
    }

    set({ isMessagesLoading: true });
    try {
      // Search has to happen client-side, after decryption — a MongoDB text
      // index can only match the stored ciphertext for E2EE conversations,
      // which never matches a real search term.
      const res = await axiosInstance.get(`/messages/${selectedConversation._id}?limit=200`);
      const decrypted = decryptMessages(res.data);
      const q = query.trim().toLowerCase();
      const filtered = decrypted.filter(m => m.text?.toLowerCase().includes(q));
      set({ messages: filtered });
    } catch (error) {
      toast.error(error.response?.data?.message || "Search failed");
    } finally {
      set({ isMessagesLoading: false });
    }
  },

  loadMoreMessages: async () => {
    const { selectedConversation, messages, hasMoreMessages } = get();
    if (!selectedConversation || !hasMoreMessages || messages.length === 0) return;

    const before = messages[0]._id;
    try {
      const res = await axiosInstance.get(`/messages/${selectedConversation._id}?before=${before}`);
      set({ 
        messages: [...get().decryptMessages(res.data), ...messages],
        hasMoreMessages: res.data.length === 30 
      });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load more messages");
    }
  },

  sendMessage: async (messageData) => {
    const { selectedConversation, messages, activeSymmetricKey, replyingTo, clearReplyingTo } = get();
    try {
      let currentSymKey = activeSymmetricKey;
      let newEncryptedKeys = undefined;

      const hasExistingKey = selectedConversation.encryptedKeys &&
        Object.keys(selectedConversation.encryptedKeys).length > 0;

      if (!currentSymKey && messageData.text && !hasExistingKey) {
        // Only mint a fresh conversation key when one has never existed for
        // this conversation. Regenerating just because *our* local key cache
        // is empty would overwrite every participant's encrypted entry and
        // permanently orphan any messages already encrypted under the old key.
        currentSymKey = generateConversationKey();
        newEncryptedKeys = {};

        selectedConversation.participants.forEach(p => {
          if (p.publicKey) {
             newEncryptedKeys[p._id] = encryptKeyForRecipient(currentSymKey, p.publicKey);
          }
        });
        set({ activeSymmetricKey: currentSymKey });
      }

      const payload = { ...messageData };
      if (currentSymKey && payload.text) {
        payload.text = encryptMessageText(payload.text, currentSymKey);
        payload.isEncrypted = true;
      } else if (!currentSymKey && hasExistingKey && payload.text) {
        // A key already exists for this conversation but we couldn't decrypt
        // our own copy of it (stale/rotated keypair). Send unencrypted rather
        // than silently destroying everyone else's message history.
        toast.error("Encryption key out of sync for this chat — message sent unencrypted", { icon: "⚠️" });
      }
      if (newEncryptedKeys) {
        payload.encryptedKeys = newEncryptedKeys;
      }
      if (replyingTo) {
        payload.replyTo = replyingTo._id;
        clearReplyingTo();
      }

      const res = await axiosInstance.post(`/messages/send/${selectedConversation._id}`, payload);
      const decryptedMsg = { ...res.data };
      if (decryptedMsg.isEncrypted && decryptedMsg.text) {
        decryptedMsg.text = messageData.text; // Use original plaintext locally
      }
      set({ messages: [...messages, decryptedMsg] });
    } catch (error) {
      if (error.response?.data?.code === "BLOCKED_ME") {
        get().setBlockedByThem(selectedConversation._id);
        toast.error("Message couldn't be sent");
      } else if (error.response?.data?.code === "BLOCKED_BY_ME") {
        toast.error("You blocked this user.");
      } else {
        toast.error(error.response?.data?.message || "Failed to send message");
      }
    }
  },

  reactToMessage: async (messageId, emoji) => {
    try {
      await axiosInstance.post(`/messages/${messageId}/react`, { emoji });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to add reaction");
    }
  },

  editMessage: async (messageId, text) => {
    try {
      await axiosInstance.patch(`/messages/${messageId}/edit`, { text });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to edit message");
    }
  },

  deleteMessage: async (messageId) => {
    try {
      await axiosInstance.delete(`/messages/${messageId}`);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete message");
    }
  },

  bulkDeleteMessages: async (messageIds) => {
    try {
      const res = await axiosInstance.post(`/messages/bulk-delete`, { messageIds });
      const { deleted, skipped } = res.data;
      if (deleted.length > 0) {
        toast.success(`${deleted.length} message${deleted.length > 1 ? 's' : ''} deleted` + (skipped.length > 0 ? ` (${skipped.length} skipped)` : ''));
      } else if (skipped.length > 0) {
        toast.error(`Failed to delete messages (not authorized)`);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to bulk delete messages");
    }
  },

  togglePinMessage: async (messageId) => {
    try {
      await axiosInstance.patch(`/messages/${messageId}/pin`);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to toggle pin");
    }
  },

  forwardMessage: async (messageData, targetConversationId) => {
    const { conversations } = get();
    const targetConversation = conversations.find(c => c._id === targetConversationId);
    if (!targetConversation) return;

    try {
      let currentSymKey = null;
      let newEncryptedKeys = undefined;
      const { authUser } = useAuthStore.getState();
      const myPrivateKey = localStorage.getItem(`chatty_priv_${authUser._id}`);

      const hasExistingKey = targetConversation.encryptedKeys && Object.keys(targetConversation.encryptedKeys).length > 0;

      if (hasExistingKey && targetConversation.encryptedKeys[authUser._id] && myPrivateKey) {
        currentSymKey = decryptConversationKey(targetConversation.encryptedKeys[authUser._id], myPrivateKey);
      }

      if (!currentSymKey && messageData.text && !hasExistingKey) {
        currentSymKey = generateConversationKey();
        newEncryptedKeys = {};
        targetConversation.participants.forEach(p => {
          if (p.publicKey) {
             newEncryptedKeys[p._id] = encryptKeyForRecipient(currentSymKey, p.publicKey);
          }
        });
      }

      const payload = { ...messageData, forwardedFrom: true };
      if (currentSymKey && payload.text) {
        payload.text = encryptMessageText(payload.text, currentSymKey);
        payload.isEncrypted = true;
      }
      if (newEncryptedKeys) {
        payload.encryptedKeys = newEncryptedKeys;
      }

      await axiosInstance.post(`/messages/send/${targetConversationId}`, payload);
      toast.success("Message forwarded");
    } catch (error) {
      toast.error("Failed to forward message");
    }
  },

  createGroup: async (groupData) => {
    try {
      const res = await axiosInstance.post("/conversations", groupData);
      set((state) => ({ conversations: [res.data, ...state.conversations] }));
      return res.data;
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to create group");
      throw error;
    }
  },

  startDirectMessage: async (userId) => {
    try {
      const res = await axiosInstance.post(`/conversations/dm/${userId}`);
      set((state) => ({
        conversations: state.conversations.some(c => c._id === res.data._id)
          ? state.conversations
          : [res.data, ...state.conversations],
      }));
      return res.data;
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to start conversation");
      throw error;
    }
  },

  updateGroup: async (conversationId, payload) => {
    try {
      const res = await axiosInstance.patch(`/conversations/${conversationId}`, payload);
      if (res.data.deleted) {
        set((state) => ({
          conversations: state.conversations.filter(c => c._id !== conversationId),
          selectedConversation: state.selectedConversation?._id === conversationId ? null : state.selectedConversation,
        }));
        return res.data;
      }
      set((state) => ({
        conversations: state.conversations.map(c => c._id === res.data._id ? res.data : c),
        selectedConversation: state.selectedConversation?._id === res.data._id ? res.data : state.selectedConversation,
      }));
      return res.data;
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update group");
      throw error;
    }
  },

  markAsSeen: async (conversationId) => {
    try {
      await axiosInstance.patch(`/messages/seen/${conversationId}`);
      set((state) => ({
        messages: state.messages.map(msg => 
          (msg.status !== 'seen') ? { ...msg, status: 'seen' } : msg
        )
      }));
    } catch (error) {
      console.error("Failed to mark messages as seen", error);
    }
  },

  clearUnreadCount: (conversationId) => {
    set((state) => ({
      unreadCounts: { ...state.unreadCounts, [conversationId]: 0 }
    }));
  },

  subscribeToMessages: () => {
    const socket = useAuthStore.getState().socket;
    if (!socket) return;

    socket.on("newMessage", (newMessage) => {
      const { selectedConversation, unreadCounts } = get();
      
      const { authUser } = useAuthStore.getState();
      if (newMessage.senderId !== authUser._id) {
        useSoundStore.getState().playMessageReceived();
      }

      const isMessageInSelectedConv = selectedConversation && newMessage.conversationId === selectedConversation._id;
      if (isMessageInSelectedConv) {
        let msgToAdd = { ...newMessage };
        if (msgToAdd.isEncrypted && msgToAdd.text) {
          msgToAdd.text = get().activeSymmetricKey
            ? decryptMessageText(msgToAdd.text, get().activeSymmetricKey)
            : "🔒 Encrypted message";
        }
        set({
          messages: [...get().messages, msgToAdd],
        });
        
        if (!document.hidden) {
          get().markAsSeen(newMessage.conversationId);
        }
      } else {
        set({
          unreadCounts: {
            ...unreadCounts,
            [newMessage.conversationId]: (unreadCounts[newMessage.conversationId] || 0) + 1
          }
        });
      }
    });

    socket.on("conversationKeysUpdated", ({ conversationId, encryptedKeys }) => {
      set((state) => ({
        conversations: state.conversations.map((c) =>
          c._id === conversationId ? { ...c, encryptedKeys } : c
        ),
      }));

      const { selectedConversation, activeSymmetricKey } = get();
      if (selectedConversation?._id !== conversationId || activeSymmetricKey) return;

      const { authUser } = useAuthStore.getState();
      const myKeyEntry = encryptedKeys[authUser._id];
      if (!myKeyEntry) return;

      const myPrivateKey = localStorage.getItem(`chatty_priv_${authUser._id}`);
      const symKey = decryptConversationKey(myKeyEntry, myPrivateKey);
      if (symKey) {
        set({
          activeSymmetricKey: symKey,
          selectedConversation: { ...selectedConversation, encryptedKeys },
        });
        get().getMessages(conversationId); // re-fetch so already-loaded messages decrypt too
      }
    });

    socket.on("messagesSeen", ({ conversationId }) => {
      const { selectedConversation } = get();
      if (selectedConversation && selectedConversation._id === conversationId) {
        set((state) => ({
          messages: state.messages.map(msg => 
            (msg.status !== 'seen') ? { ...msg, status: 'seen' } : msg
          )
        }));
      }
    });

    socket.on("typing", ({ conversationId }) => {
      const { selectedConversation } = get();
      if (selectedConversation && conversationId === selectedConversation._id) {
        set({ isTyping: true });
      }
    });

    socket.on("stopTyping", ({ conversationId }) => {
      const { selectedConversation } = get();
      if (selectedConversation && conversationId === selectedConversation._id) {
        set({ isTyping: false });
      }
    });

    socket.on("messageReaction", ({ messageId, reactions }) => {
      set((state) => ({
        messages: state.messages.map(msg => 
          msg._id === messageId ? { ...msg, reactions } : msg
        )
      }));
    });

    socket.on("messageEdited", ({ messageId, text, edited, editedAt }) => {
      set((state) => ({
        messages: state.messages.map(msg => 
          msg._id === messageId ? { ...msg, text, edited, editedAt } : msg
        )
      }));
    });

    socket.on("messageDeleted", ({ messageId, deletedAt }) => {
      set((state) => ({
        messages: state.messages.map(msg =>
          msg._id === messageId ? { ...msg, deletedAt } : msg
        )
      }));
    });

    socket.on("messagePinned", ({ messageId, pinned, pinnedAt }) => {
      set((state) => ({
        messages: state.messages.map(msg =>
          msg._id === messageId ? { ...msg, pinned, pinnedAt } : msg
        )
      }));
    });

    socket.on("groupUpdated", (updatedGroup) => {
      if (updatedGroup.deleted) {
        set((state) => ({
          conversations: state.conversations.filter(c => c._id !== updatedGroup._id),
          selectedConversation: state.selectedConversation?._id === updatedGroup._id ? null : state.selectedConversation,
        }));
        return;
      }
      set((state) => ({
        conversations: state.conversations.some(c => c._id === updatedGroup._id)
          ? state.conversations.map(c => c._id === updatedGroup._id ? updatedGroup : c)
          : [updatedGroup, ...state.conversations],
        selectedConversation: state.selectedConversation?._id === updatedGroup._id ? updatedGroup : state.selectedConversation,
      }));
    });
  },

  unsubscribeFromMessages: () => {
    const socket = useAuthStore.getState().socket;
    if (socket) {
      socket.off("newMessage");
      socket.off("conversationKeysUpdated");
      socket.off("messagesSeen");
      socket.off("typing");
      socket.off("stopTyping");
      socket.off("messageReaction");
      socket.off("messageEdited");
      socket.off("messageDeleted");
      socket.off("messagePinned");
      socket.off("groupUpdated");
    }
  },

  setReplyingTo: (message) => set({ replyingTo: message }),

  clearReplyingTo: () => set({ replyingTo: null }),

  setIsSelectMode: (isSelectMode) => set({ isSelectMode }),

  setSelectedConversation: (selectedConversation) => {
    set({ selectedConversation, isTyping: false, activeSymmetricKey: null, replyingTo: null });
    if (selectedConversation) {
      if (selectedConversation._id) {
        get().clearUnreadCount(selectedConversation._id);
        get().markAsSeen(selectedConversation._id);
      }
      
      const { authUser } = useAuthStore.getState();
      const myPrivateKey = localStorage.getItem(`chatty_priv_${authUser._id}`);
      
      if (selectedConversation.encryptedKeys && selectedConversation.encryptedKeys[authUser._id]) {
         const symKey = decryptConversationKey(selectedConversation.encryptedKeys[authUser._id], myPrivateKey);
         if (symKey) set({ activeSymmetricKey: symKey });
      }
    }
  },
}));

// (Appending a comment to trigger file write via run_command if needed)

