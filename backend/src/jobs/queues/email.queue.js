const { Queue } = require('bullmq');
const { bullConnection } = require('../../redis/client');

const emailQueue = new Queue('emailQueue', {
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

const queueWelcomeEmail = async (userId, email) => {
  await emailQueue.add('welcome', { userId, email }, { priority: 1 });
};

const queueVerificationEmail = async (email, token) => {
  await emailQueue.add('verification', { email, token }, { priority: 1 });
};

const queueSessionReminder = async (sessionId, participants, sessionTitle, scheduledAt) => {
  const delay = new Date(scheduledAt).getTime() - Date.now() - 10 * 60 * 1000;
  await emailQueue.add(
    'session-reminder',
    { sessionId, participants, sessionTitle },
    { delay: Math.max(delay, 0) }
  );
};

module.exports = { emailQueue, queueWelcomeEmail, queueVerificationEmail, queueSessionReminder };