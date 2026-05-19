// playlist-service/handlers.js
const grpc = require('@grpc/grpc-js');
const db = require('./db');

// GetPlaylist handler
const getPlaylist = async (call, callback) => {
  try {
    const { id } = call.request;
    
    if (!id) {
      return callback({
        code: grpc.status.INVALID_ARGUMENT,
        message: 'Playlist ID is required'
      });
    }
    
    const playlist = await db.getPlaylistById(id);
    
    if (!playlist) {
      return callback({
        code: grpc.status.NOT_FOUND,
        message: 'Playlist not found'
      });
    }
    
    callback(null, playlist);
  } catch (error) {
    console.error('Error in getPlaylist:', error);
    callback({
      code: grpc.status.INTERNAL,
      message: error.message
    });
  }
};

// CreatePlaylist handler
const createPlaylist = async (call, callback) => {
  try {
    const { userId, name } = call.request;
    
    if (!userId || !name) {
      return callback({
        code: grpc.status.INVALID_ARGUMENT,
        message: 'User ID and name are required'
      });
    }
    
    const playlist = await db.createPlaylist(userId, name);
    callback(null, playlist);
  } catch (error) {
    console.error('Error in createPlaylist:', error);
    callback({
      code: grpc.status.INTERNAL,
      message: error.message
    });
  }
};

// AddToPlaylist handler
const addToPlaylist = async (call, callback) => {
  try {
    const { playlistId, contentId } = call.request;
    
    if (!playlistId || !contentId) {
      return callback({
        code: grpc.status.INVALID_ARGUMENT,
        message: 'Playlist ID and Content ID are required'
      });
    }
    
    const playlist = await db.addToPlaylist(playlistId, contentId);
    callback(null, playlist);
  } catch (error) {
    console.error('Error in addToPlaylist:', error);
    
    if (error.message === 'Playlist not found') {
      return callback({
        code: grpc.status.NOT_FOUND,
        message: error.message
      });
    }
    
    if (error.message === 'Content already in playlist') {
      return callback({
        code: grpc.status.ALREADY_EXISTS,
        message: error.message
      });
    }
    
    callback({
      code: grpc.status.INTERNAL,
      message: error.message
    });
  }
};

// RemoveFromPlaylist handler
const removeFromPlaylist = async (call, callback) => {
  try {
    const { playlistId, contentId } = call.request;
    
    if (!playlistId || !contentId) {
      return callback({
        code: grpc.status.INVALID_ARGUMENT,
        message: 'Playlist ID and Content ID are required'
      });
    }
    
    const playlist = await db.removeFromPlaylist(playlistId, contentId);
    callback(null, playlist);
  } catch (error) {
    console.error('Error in removeFromPlaylist:', error);
    
    if (error.message === 'Playlist not found') {
      return callback({
        code: grpc.status.NOT_FOUND,
        message: error.message
      });
    }
    
    if (error.message === 'Content not in playlist') {
      return callback({
        code: grpc.status.NOT_FOUND,
        message: error.message
      });
    }
    
    callback({
      code: grpc.status.INTERNAL,
      message: error.message
    });
  }
};

// ListPlaylists handler
const listPlaylists = async (call, callback) => {
  try {
    const { userId } = call.request;
    
    if (!userId) {
      return callback({
        code: grpc.status.INVALID_ARGUMENT,
        message: 'User ID is required'
      });
    }
    
    const playlists = await db.listPlaylistsByUser(userId);
    callback(null, { playlists });
  } catch (error) {
    console.error('Error in listPlaylists:', error);
    callback({
      code: grpc.status.INTERNAL,
      message: error.message
    });
  }
};

module.exports = {
  getPlaylist,
  createPlaylist,
  addToPlaylist,
  removeFromPlaylist,
  listPlaylists
};
