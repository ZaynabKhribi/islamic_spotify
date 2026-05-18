// content-service/kafka/producer.js
const { Kafka } = require('kafkajs');

// Initialize Kafka client
const kafka = new Kafka({
  clientId: 'content-service',
  brokers: ['localhost:9092']
});

const producer = kafka.producer();

let isConnected = false;

// Connect to Kafka
const connectProducer = async () => {
  if (!isConnected) {
    await producer.connect();
    isConnected = true;
    console.log('Kafka producer connected (Content Service)');
  }
};

// Publish content played event
const publishContentPlayed = async (userId, contentId) => {
  try {
    await connectProducer();
    
    const message = {
      userId,
      contentId,
      timestamp: new Date().toISOString()
    };
    
    await producer.send({
      topic: 'content.played',
      messages: [
        {
          key: contentId,
          value: JSON.stringify(message)
        }
      ]
    });
    
    console.log(`[Kafka] Published to content.played: userId=${userId}, contentId=${contentId}`);
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
  publishContentPlayed,
  disconnectProducer
};
