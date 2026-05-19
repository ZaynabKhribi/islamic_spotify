// api-gateway/grpc-clients/contentClient.js
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const path = require('path');

// Load proto file
const PROTO_PATH = path.join(__dirname, '../../proto/content.proto');
const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true
});

const contentProto = grpc.loadPackageDefinition(packageDefinition).content;

// Create gRPC client
const client = new contentProto.ContentService(
  'localhost:50051',
  grpc.credentials.createInsecure()
);

// Promisify gRPC calls
const getContent = (id) => {
  return new Promise((resolve, reject) => {
    client.GetContent({ id }, (err, response) => {
      if (err) reject(err);
      else resolve(response);
    });
  });
};

const listContents = (type) => {
  return new Promise((resolve, reject) => {
    client.ListContents({ type }, (err, response) => {
      if (err) reject(err);
      else resolve(response.contents || []);
    });
  });
};

const addContent = (data) => {
  return new Promise((resolve, reject) => {
    client.AddContent(data, (err, response) => {
      if (err) reject(err);
      else resolve(response);
    });
  });
};

const updateContent = (data) => {
  return new Promise((resolve, reject) => {
    client.UpdateContent(data, (err, response) => {
      if (err) reject(err);
      else resolve(response);
    });
  });
};

const deleteContent = (id) => {
  return new Promise((resolve, reject) => {
    client.DeleteContent({ id }, (err, response) => {
      if (err) reject(err);
      else resolve(response);
    });
  });
};

module.exports = {
  getContent,
  listContents,
  addContent,
  updateContent,
  deleteContent
};
