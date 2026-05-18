// api-gateway/grpc-clients/playlistClient.js
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const path = require('path');

// Load proto file
const PROTO_PATH = path.join(__dirname, '../../proto/playlist.proto');
const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true
});

const playlistProto = grpc.loadPackageDefinition(packageDefinition).playlist;

// Create gRPC client
const client = new playlistProto.PlaylistService(
  'localhost:50053',
  grpc.credentials.createInsecure()
);

// Promisify gRPC calls
const getPlaylist = (id) => {
  return new Promise((resolve, reject) => {
    client.GetPlaylist({ id }, (err, response) => {
      if (err) reject(err);
      else resolve(response);
    });
  });
};

const createPlaylist = (userId, name) => {
  return new Promise((resolve, reject) => {
    client.CreatePlaylist({ userId, name }, (err, response) => {
      if (err) reject(err);
      else resolve(response);
    });
  });
};

const addToPlaylist = (playlistId, contentId) => {
  return new Promise((resolve, reject) => {
    client.AddToPlaylist({ playlistId, contentId }, (err, response) => {
      if (err) reject(err);
      else resolve(response);
    });
  });
};

const removeFromPlaylist = (playlistId, contentId) => {
  return new Promise((resolve, reject) => {
    client.RemoveFromPlaylist({ playlistId, contentId }, (err, response) => {
      if (err) reject(err);
      else resolve(response);
    });
  });
};

const listPlaylists = (userId) => {
  return new Promise((resolve, reject) => {
    client.ListPlaylists({ userId }, (err, response) => {
      if (err) reject(err);
      else resolve(response.playlists || []);
    });
  });
};

module.exports = {
  getPlaylist,
  createPlaylist,
  addToPlaylist,
  removeFromPlaylist,
  listPlaylists
};
