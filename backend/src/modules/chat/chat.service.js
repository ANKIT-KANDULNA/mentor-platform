const chatRepo = require('./chat.repository');
const AppError = require('../../utils/AppError');

const createOrGetConversation = async (currentUserId, otherUserId) => {
  if (currentUserId === otherUserId) {
    throw new AppError('Cannot create conversation with yourself', 400);
  }
  return chatRepo.findOrCreateConversation(currentUserId, otherUserId);
};

const getConversations = async (userId, page, limit) => {
  return chatRepo.getUserConversations(userId, page, limit);
};

const getMessages = async (conversationId, userId, page, limit) => {
  const conversation = await chatRepo.findConversationById(conversationId);
  if (!conversation) {
    throw new AppError('Conversation not found', 404);
  }

  // Check ownership
  if (conversation.userAId !== userId && conversation.userBId !== userId) {
    throw new AppError('Access denied', 403);
  }

  return chatRepo.getMessages(conversationId, page, limit);
};

const sendMessage = async (conversationId, senderId, content) => {
  const conversation = await chatRepo.findConversationById(conversationId);
  if (!conversation) {
    throw new AppError('Conversation not found', 404);
  }

  if (conversation.userAId !== senderId && conversation.userBId !== senderId) {
    throw new AppError('Access denied', 403);
  }

  return chatRepo.createMessage({ conversationId, senderId, content });
};

const markRead = async (messageId, userId) => {
  return chatRepo.markMessageRead(messageId, userId);
};

module.exports = {
  createOrGetConversation,
  getConversations,
  getMessages,
  sendMessage,
  markRead,
};