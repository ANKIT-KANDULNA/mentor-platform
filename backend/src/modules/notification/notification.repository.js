const prisma = require('../../db/prisma');

const getUserNotifications = async (userId, page = 1, limit = 20) => {
  const skip = (page - 1) * limit;
  const where = { userId };

  const [notifications, total] = await Promise.all([
    prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.notification.count({ where }),
  ]);

  return { notifications, total };
};

const getNotificationById = async (id) => {
  return prisma.notification.findUnique({
    where: { id },
  });
};

const updateNotificationRead = async (id, isRead) => {
  return prisma.notification.update({
    where: { id },
    data: {
      isRead,
      readAt: isRead ? new Date() : null,
    },
  });
};

const markAllRead = async (userId) => {
  return prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: {
      isRead: true,
      readAt: new Date(),
    },
  });
};

const createNotification = async (data) => {
  return prisma.notification.create({
    data: {
      userId: data.userId,
      type: data.type,
      title: data.title,
      body: data.body,
      data: data.data || undefined,
    },
  });
};

module.exports = {
  getUserNotifications,
  getNotificationById,
  updateNotificationRead,
  markAllRead,
  createNotification,
};
