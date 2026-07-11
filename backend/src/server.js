const http = require('http');
const app = require('./app');
const env = require('./config/env');
const { connectRedis } = require('./redis/client');
const { initializeSocket } = require('./socket');
const { initProducer } = require('./kafka/producer');
const prisma = require('./db/prisma');

// Import workers to start them
require('./jobs/workers/email.worker');
require('./jobs/workers/notification.worker');

const startServer = async () => {
  try {
    // Connect Redis
    await connectRedis();

    // Connect Kafka (optional - catch error if not running)
    try {
      await initProducer();
    } catch (err) {
      console.warn('⚠️  Kafka not available, skipping...', err.message);
    }

    // Test DB connection
    await prisma.$connect();
    console.log('✅ PostgreSQL connected');

    // Create HTTP server
    const httpServer = http.createServer(app);

    // Initialize Socket.IO
    await initializeSocket(httpServer);
    console.log('✅ Socket.IO initialized');

    // Start server
    httpServer.listen(env.PORT, () => {
      console.log(`🚀 Server running on http://localhost:${env.PORT}`);
      console.log(`📌 Environment: ${env.NODE_ENV}`);
    });

  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

startServer();