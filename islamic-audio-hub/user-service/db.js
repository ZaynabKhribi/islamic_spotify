// user-service/db.js
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const crypto = require('crypto');

// Create database connection
const db = new sqlite3.Database(path.join(__dirname, 'user.db'), (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to SQLite database (User Service)');
  }
});

// Initialize database schema
const initDB = () => {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Users table
      db.run(`
        CREATE TABLE IF NOT EXISTS users (
          id TEXT PRIMARY KEY,
          username TEXT UNIQUE NOT NULL,
          email TEXT UNIQUE NOT NULL,
          passwordHash TEXT NOT NULL,
          createdAt TEXT NOT NULL
        )
      `, (err) => {
        if (err) {
          console.error('Error creating users table:', err.message);
          reject(err);
          return;
        }
      });
      
      // Favorites table
      db.run(`
        CREATE TABLE IF NOT EXISTS favorites (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          userId TEXT NOT NULL,
          contentId TEXT NOT NULL,
          createdAt TEXT NOT NULL,
          UNIQUE(userId, contentId),
          FOREIGN KEY(userId) REFERENCES users(id)
        )
      `, (err) => {
        if (err) {
          console.error('Error creating favorites table:', err.message);
          reject(err);
          return;
        }
      });
      
      // Listening history table
      db.run(`
        CREATE TABLE IF NOT EXISTS listening_history (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          userId TEXT NOT NULL,
          contentId TEXT NOT NULL,
          playedAt TEXT NOT NULL,
          FOREIGN KEY(userId) REFERENCES users(id)
        )
      `, (err) => {
        if (err) {
          console.error('Error creating listening_history table:', err.message);
          reject(err);
        } else {
          console.log('User Service tables ready');
          resolve();
        }
      });
    });
  });
};

// Hash password
const hashPassword = (password) => {
  return crypto.createHash('sha256').update(password).digest('hex');
};

// Get user by ID
const getUserById = (id) => {
  return new Promise((resolve, reject) => {
    db.get('SELECT id, username, email, createdAt FROM users WHERE id = ?', [id], (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

// Create new user
const createUser = (user) => {
  return new Promise((resolve, reject) => {
    const { id, username, email, passwordHash, createdAt } = user;
    db.run(
      'INSERT INTO users (id, username, email, passwordHash, createdAt) VALUES (?, ?, ?, ?, ?)',
      [id, username, email, passwordHash, createdAt],
      function(err) {
        if (err) {
          if (err.message.includes('UNIQUE constraint failed')) {
            reject(new Error('Username or email already exists'));
          } else {
            reject(err);
          }
        } else {
          resolve({ id, username, email, createdAt });
        }
      }
    );
  });
};

// Get user favorites
const getFavorites = (userId) => {
  return new Promise((resolve, reject) => {
    db.all(
      'SELECT contentId FROM favorites WHERE userId = ? ORDER BY createdAt DESC',
      [userId],
      (err, rows) => {
        if (err) reject(err);
        else resolve(rows.map(row => row.contentId));
      }
    );
  });
};

// Add favorite
const addFavorite = (userId, contentId) => {
  return new Promise((resolve, reject) => {
    db.run(
      'INSERT INTO favorites (userId, contentId, createdAt) VALUES (?, ?, ?)',
      [userId, contentId, new Date().toISOString()],
      function(err) {
        if (err) {
          if (err.message.includes('UNIQUE constraint failed')) {
            reject(new Error('Content already in favorites'));
          } else {
            reject(err);
          }
        } else {
          resolve(true);
        }
      }
    );
  });
};

// Remove favorite
const removeFavorite = (userId, contentId) => {
  return new Promise((resolve, reject) => {
    db.run(
      'DELETE FROM favorites WHERE userId = ? AND contentId = ?',
      [userId, contentId],
      function(err) {
        if (err) reject(err);
        else if (this.changes === 0) reject(new Error('Favorite not found'));
        else resolve(true);
      }
    );
  });
};

// Add listening history entry
const addListeningHistory = (userId, contentId) => {
  return new Promise((resolve, reject) => {
    db.run(
      'INSERT INTO listening_history (userId, contentId, playedAt) VALUES (?, ?, ?)',
      [userId, contentId, new Date().toISOString()],
      function(err) {
        if (err) reject(err);
        else resolve(true);
      }
    );
  });
};

module.exports = {
  db,
  initDB,
  hashPassword,
  getUserById,
  createUser,
  getFavorites,
  addFavorite,
  removeFavorite,
  addListeningHistory
};
