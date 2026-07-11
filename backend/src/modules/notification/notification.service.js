const notificationRepo = require('./notification.repository');
const AppError = require('../../utils/AppError');

const getUserNotifications = async (userId, page, limit) => {
  return notificationRepo.getUserNotifications(userId, page, limit);
};

const markNotificationRead = async (notificationId, userId) => {
  const notification = await notificationRepo.getNotificationById(notificationId);
  if (!notification) {
    throw new AppError('Notification not found', 404);
  }
  if (notification.userId !== userId) {
    throw new AppError('Access denied', 403);
  }
  return notificationRepo.updateNotificationRead(notificationId, true);
};

const markAllNotificationsRead = async (userId) => {
  return notificationRepo.markAllRead(userId);
};

const createNotification = async ({ userId, type, title, body, data }) => {
  return notificationRepo.createNotification({ userId, type, title, body, data });
};

module.exports = {
  getUserNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  createNotification,
};
