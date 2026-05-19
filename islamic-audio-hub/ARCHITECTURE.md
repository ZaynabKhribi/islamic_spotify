# Islamic Audio Hub - Architecture Documentation

## System Overview

Islamic Audio Hub is a microservices-based platform designed to manage and stream Islamic audio content including Quran recitations, Nasheeds, and Podcasts. The system follows a distributed architecture with clear separation of concerns.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                         Clients                              │
│                    (Web, Mobile, etc.)                       │
└────────────────┬────────────────────────────────────────────┘
                 │
                 │ HTTP/HTTPS
                 │
┌────────────────▼────────────────────────────────────────────┐
│                      API Gateway                             │
│                      (Port 4000)                             │
│  ┌──────────────────┐        ┌──────────────────┐          │
│  │   REST API       │        │   GraphQL API    │          │
│  │   /api/*         │        │   /graphql       │          │
│  └──────────────────┘        └──────────────────┘          │
└────────┬──────────────┬──────────────┬─────────────────────┘
         │              │              │
         │ gRPC         │ gRPC         │ gRPC
         │              │              │
┌────────▼─────┐ ┌──────▼──────┐ ┌────▼──────────┐
│   Content    │ │    User     │ │   Playlist    │
│   Service    │ │   Service   │ │   Service     │
│  (Port 50051)│ │ (Port 50052)│ │ (Port 50053)  │
│              │ │             │ │               │
│   SQLite3    │ │   SQLite3   │ │     RxDB      │
└──────┬───────┘ └──────┬──────┘ └───────┬───────┘
       │                │                 │
       │ Kafka          │ Kafka           │ Kafka
       │ Producer       │ Consumer        │ Producer
       │                │                 │
       └────────────────┼─────────────────┘
                        │
                ┌───────▼────────┐
                │     Kafka      │
                │  (Port 9092)   │
                │                │
                │  Topics:       │
                │  - content.    │
                │    played      │
                │  - playlist.   │
                │    updated     │
                └────────────────┘
```

## Components

### 1. API Gateway

**Technology**: Express.js + Apollo Server  
**Port**: 4000  
**Responsibilities**:
- Single entry point for all client requests
- REST API endpoint management
- GraphQL query and mutation handling
- Request routing to appropriate microservices
- Response aggregation and formatting

**Communication**:
- Receives HTTP/HTTPS from clients
- Communicates with microservices via gRPC
- No direct database access

### 2. Content Service

**Technology**: Node.js + gRPC + SQLite3  
**Port**: 50051  
**Responsibilities**:
- CRUD operations for audio content
- Content type management (Quran, Nasheed, Podcast)
- Audio metadata storage
- Play event publishing

**Database Schema**:
```sql
contents (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  type TEXT NOT NULL,
  author TEXT NOT NULL,
  duration INTEGER NOT NULL,
  audioUrl TEXT NOT NULL,
  createdAt TEXT NOT NULL
)
```

**Kafka Integration**:
- **Producer**: Publishes to `content.played` topic when content is played
- **Message Format**: `{ userId, contentId, timestamp }`

### 3. User Service

**Technology**: Node.js + gRPC + SQLite3  
**Port**: 50052  
**Responsibilities**:
- User account management
- Authentication (password hashing)
- Favorites management
- Listening history tracking

**Database Schema**:
```sql
users (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  passwordHash TEXT NOT NULL,
  createdAt TEXT NOT NULL
)

favorites (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  userId TEXT NOT NULL,
  contentId TEXT NOT NULL,
  createdAt TEXT NOT NULL,
  UNIQUE(userId, contentId)
)

listening_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  userId TEXT NOT NULL,
  contentId TEXT NOT NULL,
  playedAt TEXT NOT NULL
)
```

**Kafka Integration**:
- **Consumer**: Listens to `content.played` topic
- **Action**: Records listening history in database

### 4. Playlist Service

**Technology**: Node.js + gRPC + RxDB  
**Port**: 50053  
**Responsibilities**:
- Playlist creation and management
- Content-to-playlist associations
- User playlist queries

**Database Schema** (RxDB):
```javascript
{
  id: string,
  userId: string,
  name: string,
  contentIds: string[],
  createdAt: string
}
```

**Kafka Integration**:
- **Producer**: Publishes to `playlist.updated` topic
- **Events**: `created`, `content_added`, `content_removed`

## Communication Patterns

### Synchronous Communication (gRPC)

Used for request-response operations requiring immediate feedback:
- API Gateway → Microservices
- Client-initiated operations (CRUD)

**Benefits**:
- Type-safe with Protocol Buffers
- Efficient binary serialization
- Built-in error handling
- Strong contracts via .proto files

### Asynchronous Communication (Kafka)

Used for event-driven operations and loose coupling:
- Content play events
- Playlist updates
- Listening history tracking

**Benefits**:
- Decoupled services
- Event sourcing capability
- Scalable message processing
- Fault tolerance

## Data Flow Examples

### Example 1: User Plays Content

```
1. Client → API Gateway: POST /api/contents/{id}/play
2. API Gateway → Content Service: GetContent(id) [gRPC]
3. Content Service → API Gateway: Content details
4. Content Service → Kafka: Publish content.played event
5. Kafka → User Service: Deliver event
6. User Service → Database: Insert listening_history record
7. API Gateway → Client: Success response
```

### Example 2: Create Playlist with Content

```
1. Client → API Gateway: POST /api/playlists
2. API Gateway → Playlist Service: CreatePlaylist(userId, name) [gRPC]
3. Playlist Service → RxDB: Insert playlist
4. Playlist Service → Kafka: Publish playlist.updated (created)
5. Playlist Service → API Gateway: Playlist object
6. API Gateway → Client: Success response with playlist
```

### Example 3: GraphQL Query

```
1. Client → API Gateway: GraphQL query { contents(type: "quran") }
2. API Gateway → Content Service: ListContents(type="quran") [gRPC]
3. Content Service → SQLite: SELECT * FROM contents WHERE type='quran'
4. Content Service → API Gateway: Content array
5. API Gateway → Client: GraphQL response
```

## Scalability Considerations

### Horizontal Scaling
- Each microservice can be scaled independently
- API Gateway can be load-balanced
- Kafka provides natural partitioning

### Database Scaling
- SQLite suitable for development/small deployments
- Can be replaced with PostgreSQL/MySQL for production
- RxDB can sync with CouchDB for distributed scenarios

### Caching Strategy (Future)
- Redis for frequently accessed content
- API Gateway response caching
- CDN for audio file delivery

## Security Considerations

### Current Implementation
- Password hashing (SHA-256)
- Input validation at service level
- gRPC error codes for proper error handling

### Production Recommendations
- JWT authentication at API Gateway
- TLS for gRPC communication
- Rate limiting
- API key management
- OAuth2 for third-party integrations

## Monitoring & Observability

### Logging
- Console logging in all services
- Kafka event logging
- gRPC call logging

### Recommended Additions
- Centralized logging (ELK stack)
- Distributed tracing (Jaeger)
- Metrics collection (Prometheus)
- Health check endpoints

## Deployment Strategy

### Development
- Run all services locally
- Single Kafka instance
- SQLite databases

### Production
- Containerize with Docker
- Kubernetes orchestration
- Managed Kafka (Confluent Cloud, AWS MSK)
- Cloud databases (RDS, Cloud SQL)
- API Gateway behind load balancer

## Technology Choices Rationale

| Technology | Reason |
|------------|--------|
| **gRPC** | Efficient inter-service communication, type safety |
| **Kafka** | Event streaming, decoupling, scalability |
| **SQLite3** | Simple setup, sufficient for assignment, easy to migrate |
| **RxDB** | Reactive database, good for real-time playlist updates |
| **Express.js** | Mature, widely-used REST framework |
| **Apollo Server** | Industry-standard GraphQL implementation |

## Future Enhancements

1. **Authentication & Authorization**
   - JWT tokens
   - Role-based access control

2. **Search Service**
   - Elasticsearch integration
   - Full-text search across content

3. **Recommendation Engine**
   - ML-based content recommendations
   - Collaborative filtering

4. **Analytics Service**
   - User behavior tracking
   - Popular content metrics

5. **Notification Service**
   - New content alerts
   - Playlist sharing notifications

6. **Media Streaming**
   - Adaptive bitrate streaming
   - CDN integration

## Testing Strategy

### Unit Tests
- Service handlers
- Database operations
- Kafka producers/consumers

### Integration Tests
- gRPC client-server communication
- End-to-end API flows
- Kafka message delivery

### Load Tests
- Concurrent user simulation
- Kafka throughput testing
- Database performance

## Conclusion

This architecture provides a solid foundation for a scalable, maintainable Islamic audio platform. The microservices approach allows independent development and deployment, while Kafka ensures loose coupling and event-driven capabilities.
