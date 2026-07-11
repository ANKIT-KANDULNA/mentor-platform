const prisma = require('../../db/prisma');
const AppError = require('../../utils/AppError');

const findOrCreateConversation = async (userId1, userId2) => {
  // Sort user IDs to enforce userAId < userBId logic (database unique constraint @@unique([userAId, userBId]))
  const [userAId, userBId] = userId1 < userId2 ? [userId1, userId2] : [userId2, userId1];

  // Check if conversation exists
  let conversation = await prisma.conversation.findUnique({
    where: {
      userAId_userBId: { userAId, userBId },
    },
    include: {
      userA: { select: { id: true, fullName: true, role: true } },
      userB: { select: { id: true, fullName: true, role: true } },
    },
  });

  if (!conversation) {
    // Verify the other user exists first
    const otherUser = await prisma.user.findUnique({
      where: { id: userId2 },
    });
    if (!otherUser) {
      throw new AppError('The user you are trying to message does not exist', 404);
    }

    // Create a new conversation
    conversation = await prisma.conversation.create({
      data: {
        userAId,
        userBId,
      },
      include: {
        userA: { select: { id: true, fullName: true, role: true } },
        userB: { select: { id: true, fullName: true, role: true } },
      },
    });
  }

  return conversation;
};

const getUserConversations = async (userId, page = 1, limit = 20) => {
  const skip = (page - 1) * limit;
  
  const where = {
    OR: [
      { userAId: userId },
      { userBId: userId },
    ],
  };

  const [conversations, total] = await Promise.all([
    prisma.conversation.findMany({
      where,
      include: {
        userA: { select: { id: true, fullName: true, role: true } },
        userB: { select: { id: true, fullName: true, role: true } },
      },
      orderBy: {
        updatedAt: 'desc',
      },
      skip,
      take: limit,
    }),
    prisma.conversation.count({ where }),
  ]);

  return { conversations, total };
};

const findConversationById = async (conversationId) => {
  return prisma.conversation.findUnique({
    where: { id: conversationId },
  });
};

const getMessages = async (conversationId, page = 1, limit = 30) => {
  const skip = (page - 1) * limit;

  const where = { conversationId };

  const [messages, total] = await Promise.all([
    prisma.message.findMany({
      where,
      include: {
        sender: { select: { id: true, fullName: true } },
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip,
      take: limit,
    }),
    prisma.message.count({ where }),
  ]);

  // Reverse messages so they are in chronological order (oldest to newest) for front-end consumption
  return { messages: messages.reverse(), total };
};

const createMessage = async ({ conversationId, senderId, content }) => {
  return prisma.$transaction(async (tx) => {
    // Create the message
    const message = await tx.message.create({
      data: {
        conversationId,
        senderId,
        content,
      },
      include: {
        sender: { select: { id: true, fullName: true } },
      },
    });

    // Update conversation last message details
    await tx.conversation.update({
      where: { id: conversationId },
      data: {
        lastMessage: content.substring(0, 100),
        lastMsgAt: new Date(),
      },
    });

    return message;
  });
};

const markMessageRead = async (messageId, userId) => {
  // Ensure the user marking it read is part of the conversation but did NOT send the message
  return prisma.message.updateMany({
    where: {
      id: messageId,
      senderId: { not: userId },
      conversation: {
        OR: [
          { userAId: userId },
          { userBId: userId },
        ],
      },
    },
    data: {
      isRead: true,
      readAt: new Date(),
    },
  });
};

module.exports = {
  findOrCreateConversation,
  getUserConversations,
  findConversationById,
  getMessages,
  createMessage,
  markMessageRead,
};
