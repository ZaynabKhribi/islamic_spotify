// content-service/index.js
const db = require('./db');
const server = require('./server');
const { disconnectProducer } = require('./kafka/producer');

// Initialize and start service
const start = async () => {
  try {
    // Initialize database
    await db.initDB();
    
    // Start gRPC server
    server.startServer('50051');
    
    console.log('Content Service started successfully');
  } catch (error) {
    console.error('Failed to start Content Service:', error);
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\nShutting down Content Service...');
  await disconnectProducer();
  db.db.close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\nShutting down Content Service...');
  await disconnectProducer();
  db.db.close();
  process.exit(0);
});

start();
