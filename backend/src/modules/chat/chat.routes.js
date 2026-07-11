const express = require('express');
const router = express.Router();
const chatController = require('./chat.controller');
const { protect } = require('../../middleware/auth.middleware');
const { validate } = require('../../middleware/validate.middleware');
const { createConversationSchema, sendMessageSchema } = require('../../validators/chat.validator');

router.use(protect);

router.get('/global', chatController.getGlobalMessages);
router.post('/conversations', validate(createConversationSchema), chatController.createConversation);
router.get('/conversations', chatController.getConversations);
router.get('/conversations/:conversationId/messages', chatController.getMessages);
router.post('/conversations/:conversationId/messages', validate(sendMessageSchema), chatController.sendMessage);
router.patch('/messages/:messageId/read', chatController.markRead);

module.exports = router;