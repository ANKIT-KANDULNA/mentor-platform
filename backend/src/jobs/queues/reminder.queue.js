const { Queue } = require('bullmq');
const { bullConnection } = require('../../redis/client');

const reminderQueue = new Queue('reminderQueue', {
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
 * Schedules a session reminder.
 * @param {string} sessionId - ID of the session
 * @param {Date} scheduledAt - Time of the session
 * @param {number} delayMs - Delay in milliseconds before executing the reminder
 */
const queueReminder = async (sessionId, scheduledAt, delayMs) => {
  await reminderQueue.add(
    'session-reminder',
    { sessionId, scheduledAt },
    { delay: Math.max(delayMs, 0), jobId: `reminder:${sessionId}` }
  );
};

/**
 * Cancels a scheduled session reminder if the session is cancelled or rescheduled.
 * @param {string} sessionId - ID of the session
 */
const cancelReminder = async (sessionId) => {
  const job = await reminderQueue.getJob(`reminder:${sessionId}`);
  if (job) {
    await job.remove();
  }
};

module.exports = {
  reminderQueue,
  queueReminder,
  cancelReminder,
};
