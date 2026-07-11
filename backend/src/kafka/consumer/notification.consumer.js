const kafka = require('../client');
const TOPICS = require('../topics');
const { queueNotification } = require('../../jobs/queues/notification.queue');

/**
 * Starts a Kafka consumer that listens for notification events and routes them to the BullMQ background queue.
 */
const runNotificationConsumer = async () => {
  try {
    const consumer = kafka.consumer({ groupId: 'notification-group' });
    await consumer.connect();
    console.log('✅ Kafka Notification Consumer connected');
    
    await consumer.subscribe({ topic: TOPICS.NOTIFICATION_EVENTS, fromBeginning: false });

    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        try {
          const payload = JSON.parse(message.value.toString());
          const { userId, type, title, body, data } = payload.data;
          
          await queueNotification(userId, type, title, body, data);
          console.log(`🔔 [Notification Consumer] Enqueued notification for user ${userId}`);
        } catch (parseErr) {
          console.error('Error parsing Kafka notification message:', parseErr.message);
        }
      },
    });
  } catch (err) {
    console.error('Failed to run Kafka Notification Consumer:', err.message);
  }
};

module.exports = { runNotificationConsumer };
