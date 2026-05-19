// playlist-service/kafka/producer.js
const { Kafka } = require('kafkajs');

// Initialize Kafka client
const kafka = new Kafka({
  clientId: 'playlist-service',
  brokers: ['localhost:9092']
});

const producer = kafka.producer();

let isConnected = false;

// Connect to Kafka
const connectProducer = async () => {
  if (!isConnected) {
    await producer.connect();
    isConnected = true;
    console.log('Kafka producer connected (Playlist Service)');
  }
};

// Publish playlist updated event
const publishPlaylistUpdated = async (playlistId, userId, action) => {
  try {
    await connectProducer();
    
    const message = {
      playlistId,
      userId,
      action, // 'created', 'content_added', 'content_removed'
      timestamp: new Date().toISOString()
    };
    
    await producer.send({
      topic: 'playlist.updated',
      messages: [
        {
          key: playlistId,
          value: JSON.stringify(message)
        }
      ]
    });
    
    console.log(`[Kafka] Published to playlist.updated: playlistId=${playlistId}, action=${action}`);
  } catch (error) {
    console.error('Error publishing to Kafka:', error.message);
  }
};

// Graceful shutdown
const disconnectProducer = async () => {
  if (isConnected) {
    await producer.disconnect();
    isConnected = false;
    console.log('Kafka producer disconnected');
  }
};

module.exports = {
  publishPlaylistUpdated,
  disconnectProducer
};
