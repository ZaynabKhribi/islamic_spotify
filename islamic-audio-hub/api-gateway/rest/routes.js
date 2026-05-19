// api-gateway/rest/routes.js
const express = require('express');
const contentClient = require('../grpc-clients/contentClient');
const userClient = require('../grpc-clients/userClient');
const playlistClient = require('../grpc-clients/playlistClient');
const { publishContentPlayed } = require('../../content-service/kafka/producer');
const { publishPlaylistUpdated } = require('../../playlist-service/kafka/producer');

const router = express.Router();

// ========== CONTENT ROUTES ==========

// GET /api/contents - List all contents
router.get('/contents', async (req, res) => {
  try {
    const { type } = req.query;
    const contents = await contentClient.listContents(type);
    res.json({ success: true, data: contents });
  } catch (error) {
    console.error('Error listing contents:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/contents/:id - Get one content
router.get('/contents/:id', async (req, res) => {
  try {
    const content = await contentClient.getContent(req.params.id);
    res.json({ success: true, data: content });
  } catch (error) {
    console.error('Error getting content:', error);
    const status = error.code === 5 ? 404 : 500;
    res.status(status).json({ success: false, error: error.message });
  }
});

// POST /api/contents - Add content
router.post('/contents', async (req, res) => {
  try {
    const { title, type, author, duration, audioUrl } = req.body;
    const content = await contentClient.addContent({ title, type, author, duration, audioUrl });
    res.status(201).json({ success: true, data: content });
  } catch (error) {
    console.error('Error adding content:', error);
    res.status(400).json({ success: false, error: error.message });
  }
});

// PUT /api/contents/:id - Update content
router.put('/contents/:id', async (req, res) => {
  try {
    const { title, type, author, duration, audioUrl } = req.body;
    const content = await contentClient.updateContent({ 
      id: req.params.id, 
      title, 
      type, 
      author, 
      duration, 
      audioUrl 
    });
    res.json({ success: true, data: content });
  } catch (error) {
    console.error('Error updating content:', error);
    const status = error.code === 5 ? 404 : 500;
    res.status(status).json({ success: false, error: error.message });
  }
});

// DELETE /api/contents/:id - Delete content
router.delete('/contents/:id', async (req, res) => {
  try {
    const result = await contentClient.deleteContent(req.params.id);
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Error deleting content:', error);
    const status = error.code === 5 ? 404 : 500;
    res.status(status).json({ success: false, error: error.message });
  }
});

// POST /api/contents/:id/play - Trigger play event
router.post('/contents/:id/play', async (req, res) => {
  try {
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ success: false, error: 'userId is required' });
    }
    
    // Verify content exists
    await contentClient.getContent(req.params.id);
    
    // Publish to Kafka
    await publishContentPlayed(userId, req.params.id);
    
    res.json({ success: true, message: 'Play event triggered' });
  } catch (error) {
    console.error('Error triggering play event:', error);
    const status = error.code === 5 ? 404 : 500;
    res.status(status).json({ success: false, error: error.message });
  }
});

// ========== USER ROUTES ==========

// POST /api/users/register - Register user
router.post('/users/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const user = await userClient.createUser(username, email, password);
    res.status(201).json({ success: true, data: user });
  } catch (error) {
    console.error('Error registering user:', error);
    const status = error.code === 6 ? 409 : 400;
    res.status(status).json({ success: false, error: error.message });
  }
});

// GET /api/users/:id - Get user profile
router.get('/users/:id', async (req, res) => {
  try {
    const user = await userClient.getUser(req.params.id);
    res.json({ success: true, data: user });
  } catch (error) {
    console.error('Error getting user:', error);
    const status = error.code === 5 ? 404 : 500;
    res.status(status).json({ success: false, error: error.message });
  }
});

// GET /api/users/:id/favorites - Get favorites
router.get('/users/:id/favorites', async (req, res) => {
  try {
    const contentIds = await userClient.getFavorites(req.params.id);
    res.json({ success: true, data: contentIds });
  } catch (error) {
    console.error('Error getting favorites:', error);
    const status = error.code === 5 ? 404 : 500;
    res.status(status).json({ success: false, error: error.message });
  }
});

// POST /api/users/:id/favorites - Add favorite
router.post('/users/:id/favorites', async (req, res) => {
  try {
    const { contentId } = req.body;
    
    if (!contentId) {
      return res.status(400).json({ success: false, error: 'contentId is required' });
    }
    
    const result = await userClient.addFavorite(req.params.id, contentId);
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Error adding favorite:', error);
    const status = error.code === 6 ? 409 : error.code === 5 ? 404 : 500;
    res.status(status).json({ success: false, error: error.message });
  }
});

// ========== PLAYLIST ROUTES ==========

// POST /api/playlists - Create playlist
router.post('/playlists', async (req, res) => {
  try {
    const { userId, name } = req.body;
    const playlist = await playlistClient.createPlaylist(userId, name);
    
    // Publish to Kafka
    await publishPlaylistUpdated(playlist.id, userId, 'created');
    
    res.status(201).json({ success: true, data: playlist });
  } catch (error) {
    console.error('Error creating playlist:', error);
    res.status(400).json({ success: false, error: error.message });
  }
});

// GET /api/playlists/:id - Get playlist
router.get('/playlists/:id', async (req, res) => {
  try {
    const playlist = await playlistClient.getPlaylist(req.params.id);
    res.json({ success: true, data: playlist });
  } catch (error) {
    console.error('Error getting playlist:', error);
    const status = error.code === 5 ? 404 : 500;
    res.status(status).json({ success: false, error: error.message });
  }
});

// POST /api/playlists/:id/add - Add content to playlist
router.post('/playlists/:id/add', async (req, res) => {
  try {
    const { contentId } = req.body;
    
    if (!contentId) {
      return res.status(400).json({ success: false, error: 'contentId is required' });
    }
    
    const playlist = await playlistClient.addToPlaylist(req.params.id, contentId);
    
    // Publish to Kafka
    await publishPlaylistUpdated(playlist.id, playlist.userId, 'content_added');
    
    res.json({ success: true, data: playlist });
  } catch (error) {
    console.error('Error adding to playlist:', error);
    const status = error.code === 6 ? 409 : error.code === 5 ? 404 : 500;
    res.status(status).json({ success: false, error: error.message });
  }
});

// GET /api/users/:id/playlists - Get user playlists
router.get('/users/:id/playlists', async (req, res) => {
  try {
    const playlists = await playlistClient.listPlaylists(req.params.id);
    res.json({ success: true, data: playlists });
  } catch (error) {
    console.error('Error listing playlists:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
