// api-gateway/graphql/resolvers.js
const contentClient = require('../grpc-clients/contentClient');
const userClient = require('../grpc-clients/userClient');
const playlistClient = require('../grpc-clients/playlistClient');
const { publishPlaylistUpdated } = require('../../playlist-service/kafka/producer');

const resolvers = {
  Query: {
    // Get single content by ID
    content: async (_, { id }) => {
      try {
        return await contentClient.getContent(id);
      } catch (error) {
        throw new Error(`Failed to get content: ${error.message}`);
      }
    },

    // List contents with optional type filter
    contents: async (_, { type }) => {
      try {
        return await contentClient.listContents(type);
      } catch (error) {
        throw new Error(`Failed to list contents: ${error.message}`);
      }
    },

    // Get user by ID
    user: async (_, { id }) => {
      try {
        return await userClient.getUser(id);
      } catch (error) {
        throw new Error(`Failed to get user: ${error.message}`);
      }
    },

    // Get playlist by ID
    playlist: async (_, { id }) => {
      try {
        return await playlistClient.getPlaylist(id);
      } catch (error) {
        throw new Error(`Failed to get playlist: ${error.message}`);
      }
    },

    // Get user playlists
    userPlaylists: async (_, { userId }) => {
      try {
        return await playlistClient.listPlaylists(userId);
      } catch (error) {
        throw new Error(`Failed to list playlists: ${error.message}`);
      }
    },

    // Get user favorites
    userFavorites: async (_, { userId }) => {
      try {
        return await userClient.getFavorites(userId);
      } catch (error) {
        throw new Error(`Failed to get favorites: ${error.message}`);
      }
    }
  },

  Mutation: {
    // Add content to user favorites
    addFavorite: async (_, { userId, contentId }) => {
      try {
        return await userClient.addFavorite(userId, contentId);
      } catch (error) {
        throw new Error(`Failed to add favorite: ${error.message}`);
      }
    },

    // Create new playlist
    createPlaylist: async (_, { userId, name }) => {
      try {
        const playlist = await playlistClient.createPlaylist(userId, name);
        
        // Publish to Kafka
        await publishPlaylistUpdated(playlist.id, userId, 'created');
        
        return playlist;
      } catch (error) {
        throw new Error(`Failed to create playlist: ${error.message}`);
      }
    },

    // Add content to playlist
    addToPlaylist: async (_, { playlistId, contentId }) => {
      try {
        const playlist = await playlistClient.addToPlaylist(playlistId, contentId);
        
        // Publish to Kafka
        await publishPlaylistUpdated(playlist.id, playlist.userId, 'content_added');
        
        return playlist;
      } catch (error) {
        throw new Error(`Failed to add to playlist: ${error.message}`);
      }
    }
  }
};

module.exports = resolvers;
