// api-gateway/index.js
const express = require('express');
const { ApolloServer } = require('apollo-server-express');
const typeDefs = require('./graphql/schema');
const resolvers = require('./graphql/resolvers');
const restRoutes = require('./rest/routes');

const app = express();
const PORT = 4000;

// CORS Middleware - Allow requests from any origin
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  
  next();
});

// Middleware
app.use(express.json());

// REST API routes
app.use('/api', restRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'API Gateway is running' });
});

// Initialize Apollo Server for GraphQL
const startServer = async () => {
  const apolloServer = new ApolloServer({
    typeDefs,
    resolvers,
    formatError: (error) => {
      console.error('GraphQL Error:', error);
      return error;
    }
  });

  await apolloServer.start();
  apolloServer.applyMiddleware({ app, path: '/graphql' });

  app.listen(PORT, () => {
    console.log(`API Gateway running on http://localhost:${PORT}`);
    console.log(`REST API available at http://localhost:${PORT}/api`);
    console.log(`GraphQL API available at http://localhost:${PORT}${apolloServer.graphqlPath}`);
  });
};

startServer().catch((error) => {
  console.error('Failed to start API Gateway:', error);
  process.exit(1);
});
