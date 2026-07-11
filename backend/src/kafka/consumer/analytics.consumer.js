const kafka = require('../client');
const TOPICS = require('../topics');

/**
 * Starts a Kafka consumer that listens for analytics events and logs them.
 */
const runAnalyticsConsumer = async () => {
  try {
    const consumer = kafka.consumer({ groupId: 'analytics-group' });
    await consumer.connect();
    console.log('✅ Kafka Analytics Consumer connected');
    
    await consumer.subscribe({ topic: TOPICS.ANALYTICS_EVENTS, fromBeginning: false });

    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        try {
          const payload = JSON.parse(message.value.toString());
          console.log(`📊 [Analytics Consumer] Received event ${payload.eventType}:`, payload.data);
        } catch (parseErr) {
          console.error('Error parsing Kafka analytics message:', parseErr.message);
        }
      },
    });
  } catch (err) {
    console.error('Failed to run Kafka Analytics Consumer:', err.message);
  }
};

module.exports = { runAnalyticsConsumer };
