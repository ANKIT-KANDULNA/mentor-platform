const { z } = require('zod');

const createConversationSchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
});

const sendMessageSchema = z.object({
  content: z
    .string()
    .min(1, 'Message cannot be empty')
    .max(5000, 'Message too long')
    .trim(),
});

const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

module.exports = {
  createConversationSchema,
  sendMessageSchema,
  paginationSchema,
};