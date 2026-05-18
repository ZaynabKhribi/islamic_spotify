// user-service/kafka/consumer.js
const { Kafka } = require('kafkajs');
const db = require('../db');

// Initialize Kafka client
const kafka = new Kafka({
  clientId: 'user-service',
  brokers: ['localhost:9092']
});

const consumer = kafka.consumer({ groupId: 'user-service-group' });

// Start consuming messages
const startConsumer = async () => {
  try {
    await consumer.connect();
    console.log('Kafka consumer connected (User Service)');
    
    await consumer.subscribe({ topic: 'content.played', fromBeginning: false });
    
    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        try {
          const data = JSON.parse(message.value.toString());
          const { userId, contentId, timestamp } = data;
          
          console.log(`[Kafka] Received content.played: userId=${userId}, contentId=${contentId}`);
          
          // Log to listening history
          await db.addListeningHistory(userId, contentId);
          console.log(`[DB] Added to listening history: userId=${userId}, contentId=${contentId}`);
        } catch (error) {
          console.error('Error processing Kafka message:', error.message);
        }
      }
    });
  } catch (error) {
    console.error('Error starting Kafka consumer:', error.message);
  }
};

// Graceful shutdown
const stopConsumer = async () => {
  await consumer.disconnect();
  console.log('Kafka consumer disconnected');
};

module.exports = {
  startConsumer,
  stopConsumer
};
