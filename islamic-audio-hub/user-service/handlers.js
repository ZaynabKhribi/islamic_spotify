// user-service/handlers.js
const grpc = require('@grpc/grpc-js');
const { v4: uuidv4 } = require('uuid');
const db = require('./db');

// GetUser handler
const getUser = async (call, callback) => {
  try {
    const { id } = call.request;
    
    if (!id) {
      return callback({
        code: grpc.status.INVALID_ARGUMENT,
        message: 'User ID is required'
      });
    }
    
    const user = await db.getUserById(id);
    
    if (!user) {
      return callback({
        code: grpc.status.NOT_FOUND,
        message: 'User not found'
      });
    }
    
    callback(null, user);
  } catch (error) {
    console.error('Error in getUser:', error);
    callback({
      code: grpc.status.INTERNAL,
      message: error.message
    });
  }
};

// CreateUser handler
const createUser = async (call, callback) => {
  try {
    const { username, email, password } = call.request;
    
    // Validate required fields
    if (!username || !email || !password) {
      return callback({
        code: grpc.status.INVALID_ARGUMENT,
        message: 'Username, email, and password are required'
      });
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return callback({
        code: grpc.status.INVALID_ARGUMENT,
        message: 'Invalid email format'
      });
    }
    
    const user = {
      id: uuidv4(),
      username,
      email,
      passwordHash: db.hashPassword(password),
      createdAt: new Date().toISOString()
    };
    
    const result = await db.createUser(user);
    callback(null, result);
  } catch (error) {
    console.error('Error in createUser:', error);
    
    if (error.message === 'Username or email already exists') {
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

// GetFavorites handler
const getFavorites = async (call, callback) => {
  try {
    const { id } = call.request;
    
    if (!id) {
      return callback({
        code: grpc.status.INVALID_ARGUMENT,
        message: 'User ID is required'
      });
    }
    
    // Check if user exists
    const user = await db.getUserById(id);
    if (!user) {
      return callback({
        code: grpc.status.NOT_FOUND,
        message: 'User not found'
      });
    }
    
    const contentIds = await db.getFavorites(id);
    callback(null, { contentIds });
  } catch (error) {
    console.error('Error in getFavorites:', error);
    callback({
      code: grpc.status.INTERNAL,
      message: error.message
    });
  }
};

// AddFavorite handler
const addFavorite = async (call, callback) => {
  try {
    const { userId, contentId } = call.request;
    
    if (!userId || !contentId) {
      return callback({
        code: grpc.status.INVALID_ARGUMENT,
        message: 'User ID and Content ID are required'
      });
    }
    
    // Check if user exists
    const user = await db.getUserById(userId);
    if (!user) {
      return callback({
        code: grpc.status.NOT_FOUND,
        message: 'User not found'
      });
    }
    
    await db.addFavorite(userId, contentId);
    callback(null, { success: true, message: 'Favorite added successfully' });
  } catch (error) {
    console.error('Error in addFavorite:', error);
    
    if (error.message === 'Content already in favorites') {
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

// RemoveFavorite handler
const removeFavorite = async (call, callback) => {
  try {
    const { userId, contentId } = call.request;
    
    if (!userId || !contentId) {
      return callback({
        code: grpc.status.INVALID_ARGUMENT,
        message: 'User ID and Content ID are required'
      });
    }
    
    await db.removeFavorite(userId, contentId);
    callback(null, { success: true, message: 'Favorite removed successfully' });
  } catch (error) {
    console.error('Error in removeFavorite:', error);
    
    if (error.message === 'Favorite not found') {
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

module.exports = {
  getUser,
  createUser,
  getFavorites,
  addFavorite,
  removeFavorite
};
