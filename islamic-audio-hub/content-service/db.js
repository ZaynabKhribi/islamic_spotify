// content-service/db.js
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Create database connection
const db = new sqlite3.Database(path.join(__dirname, 'content.db'), (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to SQLite database (Content Service)');
  }
});

// Initialize database schema
const initDB = () => {
  return new Promise((resolve, reject) => {
    db.run(`
      CREATE TABLE IF NOT EXISTS contents (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        type TEXT NOT NULL,
        author TEXT NOT NULL,
        duration INTEGER NOT NULL,
        audioUrl TEXT NOT NULL,
        createdAt TEXT NOT NULL
      )
    `, (err) => {
      if (err) {
        console.error('Error creating table:', err.message);
        reject(err);
      } else {
        console.log('Contents table ready');
        resolve();
      }
    });
  });
};

// Get content by ID
const getContentById = (id) => {
  return new Promise((resolve, reject) => {
    db.get('SELECT * FROM contents WHERE id = ?', [id], (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

// List all contents with optional type filter
const listContents = (type) => {
  return new Promise((resolve, reject) => {
    let query = 'SELECT * FROM contents';
    let params = [];
    
    if (type) {
      query += ' WHERE type = ?';
      params.push(type);
    }
    
    db.all(query, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows || []);
    });
  });
};

// Add new content
const addContent = (content) => {
  return new Promise((resolve, reject) => {
    const { id, title, type, author, duration, audioUrl, createdAt } = content;
    db.run(
      'INSERT INTO contents (id, title, type, author, duration, audioUrl, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [id, title, type, author, duration, audioUrl, createdAt],
      function(err) {
        if (err) reject(err);
        else resolve(content);
      }
    );
  });
};

// Update content
const updateContent = (content) => {
  return new Promise((resolve, reject) => {
    const { id, title, type, author, duration, audioUrl } = content;
    db.run(
      'UPDATE contents SET title = ?, type = ?, author = ?, duration = ?, audioUrl = ? WHERE id = ?',
      [title, type, author, duration, audioUrl, id],
      function(err) {
        if (err) reject(err);
        else if (this.changes === 0) reject(new Error('Content not found'));
        else resolve(content);
      }
    );
  });
};

// Delete content
const deleteContent = (id) => {
  return new Promise((resolve, reject) => {
    db.run('DELETE FROM contents WHERE id = ?', [id], function(err) {
      if (err) reject(err);
      else if (this.changes === 0) reject(new Error('Content not found'));
      else resolve(true);
    });
  });
};

module.exports = {
  db,
  initDB,
  getContentById,
  listContents,
  addContent,
  updateContent,
  deleteContent
};
