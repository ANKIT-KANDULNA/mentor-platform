const chatService = require('./chat.service');
const asyncHandler = require('../../utils/asyncHandler');
const { sendSuccess } = require('../../utils/response');

const createConversation = asyncHandler(async (req, res) => {
  const conversation = await chatService.createOrGetConversation(
    req.user.id,
    req.body.userId
  );
  sendSuccess(res, conversation, 201);
});

const getConversations = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const result = await chatService.getConversations(req.user.id, +page, +limit);
  sendSuccess(res, result.conversations, 200, 'Success', {
    page: +page, limit: +limit, total: result.total,
  });
});

const getMessages = asyncHandler(async (req, res) => {
  const { conversationId } = req.params;
  const { page = 1, limit = 30 } = req.query;
  const result = await chatService.getMessages(conversationId, req.user.id, +page, +limit);
  sendSuccess(res, result.messages, 200, 'Success', {
    page: +page, limit: +limit, total: result.total,
  });
});

const sendMessage = asyncHandler(async (req, res) => {
  const { conversationId } = req.params;
  const message = await chatService.sendMessage(
    conversationId,
    req.user.id,
    req.body.content
  );
  sendSuccess(res, message, 201);
});

const markRead = asyncHandler(async (req, res) => {
  const { messageId } = req.params;
  await chatService.markRead(messageId, req.user.id);
  sendSuccess(res, null, 200, 'Marked as read');
});

const getGlobalMessages = asyncHandler(async (req, res) => {
  const { limit = 50 } = req.query;
  const prisma = require('../../db/prisma');
  const messages = await prisma.globalMessage.findMany({
    orderBy: { createdAt: 'desc' },
    take: +limit,
    include: { sender: { select: { id: true, fullName: true, role: true } } },
  });
  sendSuccess(res, messages.reverse(), 200, 'Success');
});

module.exports = { createConversation, getConversations, getMessages, sendMessage, markRead, getGlobalMessages };