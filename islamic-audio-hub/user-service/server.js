// user-service/server.js
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const path = require('path');
const handlers = require('./handlers');

// Load proto file
const PROTO_PATH = path.join(__dirname, '../proto/user.proto');
const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true
});

const userProto = grpc.loadPackageDefinition(packageDefinition).user;

// Create gRPC server
const createServer = () => {
  const server = new grpc.Server();
  
  server.addService(userProto.UserService.service, {
    GetUser: handlers.getUser,
    CreateUser: handlers.createUser,
    GetFavorites: handlers.getFavorites,
    AddFavorite: handlers.addFavorite,
    RemoveFavorite: handlers.removeFavorite
  });
  
  return server;
};

// Start gRPC server
const startServer = (port = '50052') => {
  const server = createServer();
  
  server.bindAsync(
    `0.0.0.0:${port}`,
    grpc.ServerCredentials.createInsecure(),
    (err, boundPort) => {
      if (err) {
        console.error('Failed to bind server:', err);
        return;
      }
      console.log(`User Service gRPC server running on port ${boundPort}`);
    }
  );
};

module.exports = { startServer };
