// content-service/server.js
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const path = require('path');
const handlers = require('./handlers');

// Load proto file
const PROTO_PATH = path.join(__dirname, '../proto/content.proto');
const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true
});

const contentProto = grpc.loadPackageDefinition(packageDefinition).content;

// Create gRPC server
const createServer = () => {
  const server = new grpc.Server();
  
  server.addService(contentProto.ContentService.service, {
    GetContent: handlers.getContent,
    ListContents: handlers.listContents,
    AddContent: handlers.addContent,
    UpdateContent: handlers.updateContent,
    DeleteContent: handlers.deleteContent
  });
  
  return server;
};

// Start gRPC server
const startServer = (port = '50051') => {
  const server = createServer();
  
  server.bindAsync(
    `0.0.0.0:${port}`,
    grpc.ServerCredentials.createInsecure(),
    (err, boundPort) => {
      if (err) {
        console.error('Failed to bind server:', err);
        return;
      }
      console.log(`Content Service gRPC server running on port ${boundPort}`);
    }
  );
};

module.exports = { startServer };
