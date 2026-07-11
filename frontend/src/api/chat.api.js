import api from './axios';

export const getConversations = async () => {
  const response = await api.get('/chats/conversations');
  return response.data;
};

export const getMessages = async (conversationId) => {
  const response = await api.get(`/chats/conversations/${conversationId}/messages`);
  return response.data;
};

export const sendMessage = async (conversationId, content) => {
  const response = await api.post(`/chats/conversations/${conversationId}/messages`, { content });
  return response.data;
};

export const createConversation = async (otherUserId) => {
  const response = await api.post('/chats/conversations', { otherUserId });
  return response.data;
};

export const getGlobalMessages = async () => {
  const response = await api.get('/chats/global');
  return response.data;
};
