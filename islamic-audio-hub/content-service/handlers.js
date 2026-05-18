// content-service/handlers.js
const grpc = require('@grpc/grpc-js');
const { v4: uuidv4 } = require('uuid');
const db = require('./db');

// GetContent handler
const getContent = async (call, callback) => {
  try {
    const { id } = call.request;
    
    if (!id) {
      return callback({
        code: grpc.status.INVALID_ARGUMENT,
        message: 'Content ID is required'
      });
    }
    
    const content = await db.getContentById(id);
    
    if (!content) {
      return callback({
        code: grpc.status.NOT_FOUND,
        message: 'Content not found'
      });
    }
    
    callback(null, content);
  } catch (error) {
    console.error('Error in getContent:', error);
    callback({
      code: grpc.status.INTERNAL,
      message: error.message
    });
  }
};

// ListContents handler
const listContents = async (call, callback) => {
  try {
    const { type } = call.request;
    const contents = await db.listContents(type || null);
    
    callback(null, { contents });
  } catch (error) {
    console.error('Error in listContents:', error);
    callback({
      code: grpc.status.INTERNAL,
      message: error.message
    });
  }
};

// AddContent handler
const addContent = async (call, callback) => {
  try {
    const { title, type, author, duration, audioUrl } = call.request;
    
    // Validate required fields
    if (!title || !type || !author || !duration || !audioUrl) {
      return callback({
        code: grpc.status.INVALID_ARGUMENT,
        message: 'All fields are required'
      });
    }
    
    // Validate type
    const validTypes = ['quran', 'nasheed', 'podcast'];
    if (!validTypes.includes(type)) {
      return callback({
        code: grpc.status.INVALID_ARGUMENT,
        message: 'Type must be quran, nasheed, or podcast'
      });
    }
    
    const content = {
      id: uuidv4(),
      title,
      type,
      author,
      duration,
      audioUrl,
      createdAt: new Date().toISOString()
    };
    
    const result = await db.addContent(content);
    callback(null, result);
  } catch (error) {
    console.error('Error in addContent:', error);
    callback({
      code: grpc.status.INTERNAL,
      message: error.message
    });
  }
};

// UpdateContent handler
const updateContent = async (call, callback) => {
  try {
    const { id, title, type, author, duration, audioUrl } = call.request;
    
    if (!id) {
      return callback({
        code: grpc.status.INVALID_ARGUMENT,
        message: 'Content ID is required'
      });
    }
    
    // Check if content exists
    const existing = await db.getContentById(id);
    if (!existing) {
      return callback({
        code: grpc.status.NOT_FOUND,
        message: 'Content not found'
      });
    }
    
    const content = {
      id,
      title: title || existing.title,
      type: type || existing.type,
      author: author || existing.author,
      duration: duration || existing.duration,
      audioUrl: audioUrl || existing.audioUrl,
      createdAt: existing.createdAt
    };
    
    const result = await db.updateContent(content);
    callback(null, result);
  } catch (error) {
    console.error('Error in updateContent:', error);
    callback({
      code: grpc.status.INTERNAL,
      message: error.message
    });
  }
};

// DeleteContent handler
const deleteContent = async (call, callback) => {
  try {
    const { id } = call.request;
    
    if (!id) {
      return callback({
        code: grpc.status.INVALID_ARGUMENT,
        message: 'Content ID is required'
      });
    }
    
    await db.deleteContent(id);
    callback(null, { success: true, message: 'Content deleted successfully' });
  } catch (error) {
    console.error('Error in deleteContent:', error);
    
    if (error.message === 'Content not found') {
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
  getContent,
  listContents,
  addContent,
  updateContent,
  deleteContent
};
