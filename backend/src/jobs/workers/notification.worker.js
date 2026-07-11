const { Worker } = require('bullmq');
const { bullConnection } = require('../../redis/client');
const prisma = require('../../db/prisma');
const SOCKET_EVENTS = require('../../constants/events');

// Get Socket.IO instance dynamically to avoid circular dependencies
let getIO;
try {
  getIO = require('../../socket').getIO;
} catch (e) {
  console.warn('Socket server not loaded in this process');
}

const notificationWorker = new Worker(
  'notificationQueue',
  async (job) => {
    const { name, data } = job;
    console.log(`Processing notification job: ${name}`, { jobId: job.id });

    if (name === 'send-notification') {
      const { userId, type, title, body, data: payload } = data;

      // 1. Persist notification to database
      const notification = await prisma.notification.create({
        data: {
          userId,
          type,
          title,
          body,
          data: payload || {},
        },
      });

      // 2. Deliver real-time update if user is connected
      if (getIO) {
        try {
          const io = getIO();
          io.to(`user:${userId}`).emit(SOCKET_EVENTS.NOTIFICATION, notification);
        } catch (err) {
          console.warn(`Socket not active or failed to emit notification for user ${userId}:`, err.message);
        }
      }
    }
  },
  {
    connection: bullConnection,
    concurrency: 5,
  }
);

notificationWorker.on('completed', (job) => {
  console.log(`Notification job completed: ${job.id}`);
});

notificationWorker.on('failed', (job, err) => {
  console.error(`Notification job failed: ${job?.id}`, { error: err.message });
});

module.exports = notificationWorker;
