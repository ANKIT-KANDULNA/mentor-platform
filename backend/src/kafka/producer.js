const kafka = require('./client');
const { v4: uuidv4 } = require('uuid');

const producer = kafka.producer();

const initProducer = async () => {
  await producer.connect();
  console.log('✅ Kafka producer connected');
};

const produceEvent = async (topic, eventType, data) => {
  try {
    const event = {
      eventId: uuidv4(),
      eventType,
      timestamp: new Date().toISOString(),
      source: 'mentor-platform-api',
      data,
    };

    await producer.send({
      topic,
      messages: [
        {
          key: event.eventId,
          value: JSON.stringify(event),
        },
      ],
    });
  } catch (error) {
    console.error(`Kafka produce error [${topic}]:`, error);
  }
};

module.exports = { initProducer, produceEvent };