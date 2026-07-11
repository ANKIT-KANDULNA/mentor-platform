import { create } from 'zustand';
import * as chatApi from '../api/chat.api';

export const useChatStore = create((set, get) => ({
  conversations: [],
  activeConversation: null,
  messages: [],
  loading: false,
  typingUsers: {}, // { conversationId: [userIds] }

  getConversations: async () => {
    set({ loading: true });
    try {
      const data = await chatApi.getConversations();
      set({ conversations: data.data || [], loading: false });
    } catch (err) {
      console.error('Failed to get conversations:', err.message);
      set({ loading: false });
    }
  },

  getMessages: async (conversationId) => {
    set({ loading: true });
    try {
      const data = await chatApi.getMessages(conversationId);
      set({ messages: data.data || [], loading: false });
    } catch (err) {
      console.error('Failed to get messages:', err.message);
      set({ loading: false });
    }
  },

  setActiveConversation: (conversation) => {
    set({ activeConversation: conversation });
    if (conversation) {
      get().getMessages(conversation.id);
    } else {
      set({ messages: [] });
    }
  },

  sendMessage: async (conversationId, content) => {
    try {
      const data = await chatApi.sendMessage(conversationId, content);
      const newMessage = data.data;
      
      // Update messages list locally if it belongs to active conversation
      const currentMessages = get().messages;
      set({ messages: [...currentMessages, newMessage] });
      
      // Update conversations list with last message
      const currentConvs = get().conversations;
      const updatedConvs = currentConvs.map(c => 
        c.id === conversationId 
          ? { ...c, lastMessage: content, lastMsgAt: new Date().toISOString() }
          : c
      );
      set({ conversations: updatedConvs });

      return newMessage;
    } catch (err) {
      console.error('Failed to send message:', err.message);
      throw err;
    }
  },

  addMessage: (message) => {
    const active = get().activeConversation;
    if (active && message.conversationId === active.id) {
      const currentMessages = get().messages;
      // Prevent duplicates
      if (!currentMessages.some(m => m.id === message.id)) {
        set({ messages: [...currentMessages, message] });
      }
    }

    // Also update last message in conversations list
    const currentConvs = get().conversations;
    const updatedConvs = currentConvs.map(c => 
      c.id === message.conversationId 
        ? { ...c, lastMessage: message.content, lastMsgAt: message.createdAt }
        : c
    );
    set({ conversations: updatedConvs });
  },

  setUserTyping: (conversationId, userId, isTyping) => {
    const currentTyping = { ...get().typingUsers };
    if (!currentTyping[conversationId]) {
      currentTyping[conversationId] = [];
    }

    if (isTyping) {
      if (!currentTyping[conversationId].includes(userId)) {
        currentTyping[conversationId] = [...currentTyping[conversationId], userId];
      }
    } else {
      currentTyping[conversationId] = currentTyping[conversationId].filter(id => id !== userId);
    }

    set({ typingUsers: currentTyping });
  },
}));
