// user-service/index.js
const db = require('./db');
const server = require('./server');
const { startConsumer, stopConsumer } = require('./kafka/consumer');

// Initialize and start service
const start = async () => {
  try {
    // Initialize database
    await db.initDB();
    
    // Start gRPC server
    server.startServer('50052');
    
    // Start Kafka consumer
    await startConsumer();
    
    console.log('User Service started successfully');
  } catch (error) {
    console.error('Failed to start User Service:', error);
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\nShutting down User Service...');
  await stopConsumer();
  db.db.close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\nShutting down User Service...');
  await stopConsumer();
  db.db.close();
  process.exit(0);
});

start();
