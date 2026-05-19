// playlist-service/index.js
const db = require('./db');
const server = require('./server');
const { disconnectProducer } = require('./kafka/producer');

// Initialize and start service
const start = async () => {
  try {
    // Initialize database
    await db.initDB();
    
    // Start gRPC server
    server.startServer('50053');
    
    console.log('Playlist Service started successfully');
  } catch (error) {
    console.error('Failed to start Playlist Service:', error);
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\nShutting down Playlist Service...');
  await disconnectProducer();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\nShutting down Playlist Service...');
  await disconnectProducer();
  process.exit(0);
});

start();
