const { Kafka } = require('kafkajs');
const env = require('../config/env');

const kafka = new Kafka({
  clientId: env.KAFKA_CLIENT_ID,
  brokers: env.KAFKA_BROKERS.split(','),
});

module.exports = kafka;