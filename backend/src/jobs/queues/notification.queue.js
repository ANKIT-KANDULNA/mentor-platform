const { Queue } = require('bullmq');
const { bullConnection } = require('../../redis/client');

const notificationQueue = new Queue('notificationQueue', {
  connection: bullConnection,
  defaultJobOptions: {
    removeOnComplete: 100,
    removeOnFail: 500,
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
  },
});

/**
 * Enqueues a notification job to be processed in the background.
 * @param {string} userId - Recipient User ID
 * @param {string} type - NotificationType (e.g. MESSAGE, SESSION_BOOKED)
 * @param {string} title - Title of the notification
 * @param {string} body - Body content of the notification
 * @param {object} data - Optional payload details
 */
const queueNotification = async (userId, type, title, body, data = {}) => {
  await notificationQueue.add('send-notification', {
    userId,
    type,
    title,
    body,
    data,
  });
};

module.exports = {
  notificationQueue,
  queueNotification,
};
