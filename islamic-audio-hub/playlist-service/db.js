// playlist-service/db.js
const { createRxDatabase, addRxPlugin } = require('rxdb');
const { getRxStorageMemory } = require('rxdb/plugins/storage-memory');
const { RxDBUpdatePlugin } = require('rxdb/plugins/update');
const { v4: uuidv4 } = require('uuid');

addRxPlugin(RxDBUpdatePlugin);

let db = null;
let playlistsCollection = null;

// Playlist schema
const playlistSchema = {
  version: 0,
  primaryKey: 'id',
  type: 'object',
  properties: {
    id: {
      type: 'string',
      maxLength: 100
    },
    userId: {
      type: 'string'
    },
    name: {
      type: 'string'
    },
    contentIds: {
      type: 'array',
      items: {
        type: 'string'
      }
    },
    createdAt: {
      type: 'string'
    }
  },
  required: ['id', 'userId', 'name', 'contentIds', 'createdAt']
};

// Initialize RxDB
const initDB = async () => {
  try {
    db = await createRxDatabase({
      name: 'playlistdb',
      storage: getRxStorageMemory()
    });
    
    await db.addCollections({
      playlists: {
        schema: playlistSchema
      }
    });
    
    playlistsCollection = db.playlists;
    console.log('RxDB initialized (Playlist Service)');
  } catch (error) {
    console.error('Error initializing RxDB:', error);
    throw error;
  }
};

// Get playlist by ID
const getPlaylistById = async (id) => {
  const doc = await playlistsCollection.findOne(id).exec();
  return doc ? doc.toJSON() : null;
};

// Create new playlist
const createPlaylist = async (userId, name) => {
  const playlist = {
    id: uuidv4(),
    userId,
    name,
    contentIds: [],
    createdAt: new Date().toISOString()
  };
  
  await playlistsCollection.insert(playlist);
  return playlist;
};

// Add content to playlist
const addToPlaylist = async (playlistId, contentId) => {
  const doc = await playlistsCollection.findOne(playlistId).exec();
  
  if (!doc) {
    throw new Error('Playlist not found');
  }
  
  const playlist = doc.toJSON();
  
  if (playlist.contentIds.includes(contentId)) {
    throw new Error('Content already in playlist');
  }
  
  const updatedContentIds = [...playlist.contentIds, contentId];
  await doc.update({ $set: { contentIds: updatedContentIds } });
  
  return { ...playlist, contentIds: updatedContentIds };
};

// Remove content from playlist
const removeFromPlaylist = async (playlistId, contentId) => {
  const doc = await playlistsCollection.findOne(playlistId).exec();
  
  if (!doc) {
    throw new Error('Playlist not found');
  }
  
  const playlist = doc.toJSON();
  
  if (!playlist.contentIds.includes(contentId)) {
    throw new Error('Content not in playlist');
  }
  
  const updatedContentIds = playlist.contentIds.filter(id => id !== contentId);
  await doc.update({ $set: { contentIds: updatedContentIds } });
  
  return { ...playlist, contentIds: updatedContentIds };
};

// List playlists by user ID
const listPlaylistsByUser = async (userId) => {
  const docs = await playlistsCollection.find({ selector: { userId } }).exec();
  return docs.map(doc => doc.toJSON());
};

module.exports = {
  initDB,
  getPlaylistById,
  createPlaylist,
  addToPlaylist,
  removeFromPlaylist,
  listPlaylistsByUser
};
