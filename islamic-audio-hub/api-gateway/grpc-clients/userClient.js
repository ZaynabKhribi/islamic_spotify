// api-gateway/grpc-clients/userClient.js
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const path = require('path');

// Load proto file
const PROTO_PATH = path.join(__dirname, '../../proto/user.proto');
const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true
});

const userProto = grpc.loadPackageDefinition(packageDefinition).user;

// Create gRPC client
const client = new userProto.UserService(
  'localhost:50052',
  grpc.credentials.createInsecure()
);

// Promisify gRPC calls
const getUser = (id) => {
  return new Promise((resolve, reject) => {
    client.GetUser({ id }, (err, response) => {
      if (err) reject(err);
      else resolve(response);
    });
  });
};

const createUser = (username, email, password) => {
  return new Promise((resolve, reject) => {
    client.CreateUser({ username, email, password }, (err, response) => {
      if (err) reject(err);
      else resolve(response);
    });
  });
};

const getFavorites = (id) => {
  return new Promise((resolve, reject) => {
    client.GetFavorites({ id }, (err, response) => {
      if (err) reject(err);
      else resolve(response.contentIds || []);
    });
  });
};

const addFavorite = (userId, contentId) => {
  return new Promise((resolve, reject) => {
    client.AddFavorite({ userId, contentId }, (err, response) => {
      if (err) reject(err);
      else resolve(response);
    });
  });
};

const removeFavorite = (userId, contentId) => {
  return new Promise((resolve, reject) => {
    client.RemoveFavorite({ userId, contentId }, (err, response) => {
      if (err) reject(err);
      else resolve(response);
    });
  });
};

module.exports = {
  getUser,
  createUser,
  getFavorites,
  addFavorite,
  removeFavorite
};
