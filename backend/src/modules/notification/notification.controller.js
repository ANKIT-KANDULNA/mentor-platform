const notificationService = require('./notification.service');
const asyncHandler = require('../../utils/asyncHandler');
const { sendSuccess } = require('../../utils/response');

const getNotifications = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const result = await notificationService.getUserNotifications(req.user.id, +page, +limit);
  sendSuccess(res, result.notifications, 200, 'Notifications retrieved successfully', {
    page: +page,
    limit: +limit,
    total: result.total,
  });
});

const markRead = asyncHandler(async (req, res) => {
  const notification = await notificationService.markNotificationRead(req.params.notificationId, req.user.id);
  sendSuccess(res, notification, 200, 'Notification marked as read');
});

const markAllRead = asyncHandler(async (req, res) => {
  await notificationService.markAllNotificationsRead(req.user.id);
  sendSuccess(res, null, 200, 'All notifications marked as read');
});

module.exports = {
  getNotifications,
  markRead,
  markAllRead,
};
