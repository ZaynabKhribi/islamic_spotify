# Islamic Audio Hub

A microservices-based platform for Islamic audio content (Quran recitations, Nasheeds, and Podcasts) built with Node.js, gRPC, Kafka, GraphQL, and REST APIs.

## Architecture Overview

This project consists of 3 microservices communicating via gRPC, with Kafka for async messaging, and a unified API Gateway exposing both REST and GraphQL endpoints.
![architecture](architeture.png)

### Microservices

1. *Content Service* (Port 50051)
   - Manages audio content  (Quran, Nasheeds, Podcasts)
   - Database: SQLite3
   - Kafka Producer: Publishes to content.played topic

2. *User Service* (Port 50052)
   - Manages user accounts and favorites
   - Database: SQLite3
   - Kafka Consumer: Listens to content.played for listening history 

3. *Playlist Service* (Port 50053)
   - Manages user playlists
   - Database: RxDB (in-memory)
   - Kafka Producer: Publishes to playlist.updated topic

### API Gateway (Port 4000)

Single entry point providing:
- *REST API* at /api/*
- *GraphQL API* at /graphql

## Tech Stack

- *Runtime*: Node.js
- *API Gateway*: Express.js + Apollo Server
- *Inter-service Communication*: gRPC (@grpc/grpc-js)
- *Async Messaging*: Kafka (kafkajs)
- *SQL Database*: SQLite3
- *NoSQL Database*: RxDB
- *ID Generation*: UUID

## Prerequisites

1. *Node.js* (v17+)
2. *kafka* (running on localhost)

### Installating Kafka

*Sur Windows:*
cmd
# Download Kafka from https://kafka.apache.org/downloads
# Extract and navigate to the Kafka directory

# Start Zookeeper
bin\windows\zookeeper-server-start.bat config\zookeeper.properties

# Start Kafka (in a new terminal)
bin\windows\kafka-server-start.bat config\server.properties
## Installation

# Installation dependencies
npm install

## Running the Services

You need to run each service in a separate terminal:

# Terminal 1 - Content Service
npm run start:content

# Terminal 2 - User Service
npm run start:user

# Terminal 3 - Playlist Service
npm run start:playlist

# Terminal 4 - API Gateway
npm run start:gateway

## Documentation API

### REST Endpoints

#### Content Endpoints
- GET /api/contents - List all contents (optional query: ?type=quran|nasheed|podcast)
- GET /api/contents/:id - Get content by ID
- POST /api/contents - Add new content
- PUT /api/contents/:id - Update content
- DELETE /api/contents/:id - Delete content
- POST /api/contents/:id/play - Trigger play event (requires userId in body)

#### User Endpoints
- POST /api/users/register - Register new user
- GET /api/users/:id - Get user profile
- GET /api/users/:id/favorites - Get user favorites
- POST /api/users/:id/favorites - Add favorite (requires contentId in body)

#### Playlist Endpoints
- POST /api/playlists - Create playlist (requires userId and name)
- GET /api/playlists/:id - Get playlist by ID
- POST /api/playlists/:id/add - Add content to playlist (requires contentId)
- GET /api/users/:id/playlists - Get user playlists

### GraphQL API

Access GraphQL Playground at: http://localhost:4000/graphql

#### Queries

# Get single content
query {
  content(id: "content-id") {
    id
    title
    type
    author
    duration
    audioUrl
    createdAt
  }
}

# List contents (optional type filter)
query {
  contents(type: "quran") {
    id
    title
    author
  }
}

# Get user
query {
  user(id: "user-id") {
    id
    username
    email
    createdAt
  }
}

# Get playlist
query {
  playlist(id: "playlist-id") {
    id
    name
    contentIds
    createdAt
  }
}

# Get user playlists
query {
  userPlaylists(userId: "user-id") {
    id
    name
    contentIds
  }
}

# Get user favorites
query {
  userFavorites(userId: "user-id")
}

#### Mutations

# Add favorite
mutation {
  addFavorite(userId: "user-id", contentId: "content-id") {
    success
    message
  }
}

# Create playlist
mutation {
  createPlaylist(userId: "user-id", name: "My Quran Playlist") {
    id
    name
    contentIds
    createdAt
  }
}

# Add to playlist
mutation {
  addToPlaylist(playlistId: "playlist-id", contentId: "content-id") {
    id
    contentIds
  }
}

## Example Usage

### 1. Register a User

curl -X POST http://localhost:4000/api/users/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "salma",
    "email": "sama@example.com",
    "password": "password123"
  }'

### 2. Add Content

curl -X POST http://localhost:4000/api/contents \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Surah Al-Fatiha",
    "type": "quran",
    "author": "Sheikh Mishary Rashid",
    "duration": 180,
    "audioUrl": "https://example.com/fatiha.mp3"
  }'

### 3. Play Content (Triggers Kafka Event)

curl -X POST http://localhost:4000/api/contents/{content-id}/play \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user-id"
  }'

### 4. Create Playlist

curl -X POST http://localhost:4000/api/playlists \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user-id",
    "name": "Morning Quran"
  }'

## Kafka Topics

| Topic | Producer | Consumer | Purpose |
|-------|----------|----------|---------|
| content.played | Content Service | User Service | Track listening history |
| playlist.updated | Playlist Service | (log only) | Track playlist modifications |

## Project Structure

islamic-audio-hub/
├── proto/
│   ├── content.proto
│   ├── user.proto
│   └── playlist.proto
├── api-gateway/
│   ├── index.js
│   ├── rest/
│   │   └── routes.js
│   ├── graphql/
│   │   ├── schema.js
│   │   └── resolvers.js
│   └── grpc-clients/
│       ├── contentClient.js
│       ├── userClient.js
│       └── playlistClient.js
├── content-service/
│   ├── index.js
│   ├── server.js
│   ├── db.js
│   ├── handlers.js
│   └── kafka/
│       └── producer.js
├── user-service/
│   ├── index.js
│   ├── server.js
│   ├── db.js
│   ├── handlers.js
│   └── kafka/
│       └── consumer.js
├── playlist-service/
│   ├── index.js
│   ├── server.js
│   ├── db.js
│   ├── handlers.js
│   └── kafka/
│       └── producer.js
├── package.json
└── README.md
|__ frontend
    |__index.html

## Database Schemas

### Content Service (SQLite3)
CREATE TABLE contents (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  type TEXT NOT NULL,
  author TEXT NOT NULL,
  duration INTEGER NOT NULL,
  audioUrl TEXT NOT NULL,
  createdAt TEXT NOT NULL
);

### User Service (SQLite3)
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  passwordHash TEXT NOT NULL,
  createdAt TEXT NOT NULL
);

CREATE TABLE favorites (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  userId TEXT NOT NULL,
  contentId TEXT NOT NULL,
  createdAt TEXT NOT NULL,
  UNIQUE(userId, contentId)
);

CREATE TABLE listening_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  userId TEXT NOT NULL,
  contentId TEXT NOT NULL,
  playedAt TEXT NOT NULL
);

### Playlist Service (RxDB)
{
  id: string,
  userId: string,
  name: string,
  contentIds: string[],
  createdAt: string
}

## Error Handling

All services use proper gRPC status codes:
- INVALID_ARGUMENT (3) - Missing or invalid parameters
- NOT_FOUND (5) - Resource not found
- ALREADY_EXISTS (6) - Duplicate resource
- INTERNAL (13) - Internal server error

## Notes

- Databases are auto-created on first run
- Kafka must be running before starting services
- All passwords are hashed using SHA-256
- RxDB uses in-memory storage (data is lost on restart)
- Services can be started in any order
- Each service logs Kafka events to console

## Frontend

A web interface is included in the frontend/ directory!

### Quick Start
# Make sure backend is running first
npm run start:content
npm run start:user
npm run start:playlist
npm run start:gateway

# Then open the frontend
open frontend/index.html

### Features
-  Dark Islamic theme with green accents
-  Fully responsive design
-  Single HTML file - no build tools needed
-  Complete API integration
-  Beautiful player UI