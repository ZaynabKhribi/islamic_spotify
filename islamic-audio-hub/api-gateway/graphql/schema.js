// api-gateway/graphql/schema.js
const { gql } = require('apollo-server-express');

const typeDefs = gql`
  type Content {
    id: ID!
    title: String!
    type: String!
    author: String!
    duration: Int!
    audioUrl: String!
    createdAt: String!
  }

  type User {
    id: ID!
    username: String!
    email: String!
    createdAt: String!
  }

  type Playlist {
    id: ID!
    userId: ID!
    name: String!
    contentIds: [ID!]!
    createdAt: String!
  }

  type StatusResponse {
    success: Boolean!
    message: String!
  }

  type Query {
    content(id: ID!): Content
    contents(type: String): [Content!]!
    user(id: ID!): User
    playlist(id: ID!): Playlist
    userPlaylists(userId: ID!): [Playlist!]!
    userFavorites(userId: ID!): [ID!]!
  }

  type Mutation {
    addFavorite(userId: ID!, contentId: ID!): StatusResponse!
    createPlaylist(userId: ID!, name: String!): Playlist!
    addToPlaylist(playlistId: ID!, contentId: ID!): Playlist!
  }
`;

module.exports = typeDefs;
