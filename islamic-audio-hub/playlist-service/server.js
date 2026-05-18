// playlist-service/server.js
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const path = require('path');
const handlers = require('./handlers');

// Load proto file
const PROTO_PATH = path.join(__dirname, '../proto/playlist.proto');
const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true
});

const playlistProto = grpc.loadPackageDefinition(packageDefinition).playlist;

// Create gRPC server
const createServer = () => {
  const server = new grpc.Server();
  
  server.addService(playlistProto.PlaylistService.service, {
    GetPlaylist: handlers.getPlaylist,
    CreatePlaylist: handlers.createPlaylist,
    AddToPlaylist: handlers.addToPlaylist,
    RemoveFromPlaylist: handlers.removeFromPlaylist,
    ListPlaylists: handlers.listPlaylists
  });
  
  return server;
};

// Start gRPC server
const startServer = (port = '50053') => {
  const server = createServer();
  
  server.bindAsync(
    `0.0.0.0:${port}`,
    grpc.ServerCredentials.createInsecure(),
    (err, boundPort) => {
      if (err) {
        console.error('Failed to bind server:', err);
        return;
      }
      console.log(`Playlist Service gRPC server running on port ${boundPort}`);
    }
  );
};

module.exports = { startServer };
