import { ApolloServer } from "@apollo/server";
import User from "../model/user.js";
import ConnectionRequestModel from "../model/connectionRequest.js";

const typeDefs = `#graphql
  type User {
    id: ID!
    firstName: String!
    lastName: String
    emailId: String
    age: Int
    gender: String
    photoUrl: String
    about: String
    skills: [String]
    sentRequests: [ConnectionRequest]
    receivedRequests: [ConnectionRequest]
  }

  type ConnectionRequest {
    id: ID!
    fromUserId: ID!
    toUserId: ID!
    status: String!
    sender: User
    receiver: User
  }

  type Query {
    getUsersFirstName: [User]
    getUsersFirstNameWithEmailId: [User]
    getAllConnectionRequests: [ConnectionRequest]
    getUserDetails(id: ID!): User
  }

`;

const resolvers = {
  Query: {
    getUsersFirstName: async () => {
      try {
        const users = await User.find({}).select("firstName lastName ");
        return users;
      } catch (error) {
        throw new Error("Failed to fetch users");
      }
    },
    getUsersFirstNameWithEmailId: async () => {
      try {
        const users = await User.find({}).select("firstName lastName emailId");
        console.log(users, 'users check email')
        return users;
      } catch (error) {
        throw new Error("Failed to fetch users");
      }
    },
    getAllConnectionRequests: async () => {
      try {
        const requests = await ConnectionRequestModel.find({});
        return requests;
      } catch (error) {
        throw new Error("Failed to fetch connection requests");
      }
    },
    getUserDetails: async (_, { id }) => {
      try {
        const user = await User.findById(id);
        if (!user) {
          throw new Error("User not found");
        }
        return user;
      } catch (error) {
        throw new Error("Failed to fetch user details: " + error.message);
      }
    },
  },
  User: {
    sentRequests: async (parent) => {
      try {
        return await ConnectionRequestModel.find({ fromUserId: parent._id });
      } catch (error) {
        throw new Error("Failed to fetch sent requests");
      }
    },
    receivedRequests: async (parent) => {
      try {
        return await ConnectionRequestModel.find({ toUserId: parent._id });
      } catch (error) {
        throw new Error("Failed to fetch received requests");
      }
    },
  },
  ConnectionRequest: {
    sender: async (parent) => {
      try {
        return await User.findById(parent.fromUserId);
      } catch (error) {
        throw new Error("Failed to fetch request sender");
      }
    },
    receiver: async (parent) => {
      try {
        return await User.findById(parent.toUserId);
      } catch (error) {
        throw new Error("Failed to fetch request receiver");
      }
    },
  },
};

export const apolloServer = new ApolloServer({
  typeDefs,
  resolvers,
});
