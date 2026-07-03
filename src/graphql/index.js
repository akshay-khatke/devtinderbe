import { ApolloServer } from "@apollo/server";
import User from "../model/user.js";
import ConnectionRequestModel from "../model/connectionRequest.js";
import bcrypt from "bcrypt";
import Chat from "../model/chat.js";
import ChatBotMessage from "../model/chatbotMessage.js";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { HumanMessage, AIMessage } from "@langchain/core/messages";
import { sendPushNotification } from "../utils/notification.js";

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

  type Message {
    _id: ID!
    senderId: User
    message: String
    createdAt: String
  }

  type Chat {
    _id: ID!
    participents: [User]
    messages: [Message]
  }

  type ChatbotMessage {
    id: ID!
    text: String
    isBot: Boolean
    timestamp: String
  }

  type AuthPayload {
    user: User
    token: String
  }

  type Query {
    getUsersFirstName: [User]
    getUsersFirstNameWithEmailId: [User]
    getAllConnectionRequests: [ConnectionRequest]
    getUserDetails(id: ID!): User
    me: User
    getReceivedRequests: [ConnectionRequest]
    getConnections: [User]
    getFeed(page: Int, limit: Int): [User]
    getChat(targetUserId: ID!): Chat
    getChatbotHistory: [ChatbotMessage]
  }

  type Mutation {
    signUp(firstName: String!, lastName: String, emailId: String!, password: String!): AuthPayload
    login(emailId: String!, password: String!): AuthPayload
    logout: String
    editProfile(firstName: String, lastName: String, photoUrl: String, about: String, skills: [String]): User
    sendConnectionRequest(toUserId: ID!, status: String!): ConnectionRequest
    reviewConnectionRequest(requestId: ID!, status: String!): ConnectionRequest
    sendMessage(targetUserId: ID!, textMessage: String!): Message
    askChatbot(message: String!): String
    saveFCMToken(token: String!): String
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
    me: async (_, __, context) => {
      if (!context.user) throw new Error("Unauthorized");
      return context.user;
    },
    getReceivedRequests: async (_, __, context) => {
      if (!context.user) throw new Error("Unauthorized");
      try {
        return await ConnectionRequestModel.find({
          toUserId: context.user._id,
          status: "interested"
        });
      } catch (err) {
        throw new Error("Failed to fetch received requests");
      }
    },
    getConnections: async (_, __, context) => {
      if (!context.user) throw new Error("Unauthorized");
      try {
        const requests = await ConnectionRequestModel.find({
          $or: [
            { toUserId: context.user._id, status: "accepted" },
            { fromUserId: context.user._id, status: "accepted" }
          ]
        }).populate("fromUserId").populate("toUserId");
        
        return requests.map((row) => {
          if (row.fromUserId._id.toString() === context.user._id.toString()) {
            return row.toUserId;
          } else {
            return row.fromUserId;
          }
        });
      } catch (err) {
        throw new Error("Failed to fetch connections");
      }
    },
    getFeed: async (_, { page = 1, limit = 10 }, context) => {
      if (!context.user) throw new Error("Unauthorized");
      try {
        const skip = (page - 1) * limit;
        const connectionRequests = await ConnectionRequestModel.find({
          $or: [
            { toUserId: context.user._id },
            { fromUserId: context.user._id }
          ]
        }).select("fromUserId toUserId");
        
        const blockUsers = new Set();
        connectionRequests.forEach((row) => {
          blockUsers.add(row.fromUserId.toString());
          blockUsers.add(row.toUserId.toString());
        });
        
        const users = await User.find({
          $and: [
            { _id: { $nin: Array.from(blockUsers) } },
            { _id: { $ne: context.user._id } }
          ]
        }).skip(skip).limit(limit);
        
        return users;
      } catch (err) {
        throw new Error("Failed to fetch feed");
      }
    },
    getChat: async (_, { targetUserId }, context) => {
      if (!context.user) throw new Error("Unauthorized");
      try {
        let chat = await Chat.findOne({
          participents: { $all: [context.user._id, targetUserId] }
        });
        if (!chat) {
          chat = new Chat({
            participents: [context.user._id, targetUserId],
            messages: []
          });
          await chat.save();
        }
        return chat;
      } catch (err) {
        throw new Error("Failed to get chat");
      }
    },
    getChatbotHistory: async (_, __, context) => {
      if (!context.user) throw new Error("Unauthorized");
      try {
        const messages = await ChatBotMessage.find({ userId: context.user._id }).sort({ createdAt: 1 });
        return messages.map(msg => ({
          id: msg._id,
          text: msg.content,
          isBot: msg.role === "assistant",
          timestamp: msg.createdAt
        }));
      } catch (err) {
        throw new Error("Failed to fetch chat history");
      }
    }
  },
  Mutation: {
    signUp: async (_, { firstName, lastName, emailId, password }, context) => {
      try {
        // Encrypt the password
        const passwordHash = await bcrypt.hash(password, 10);
        
        const user = new User({
          firstName,
          lastName,
          emailId,
          password: passwordHash,
        });
        
        const savedUser = await user.save();
        const token = await savedUser.generateToken();
        
        // Note: To set cookies, you need to pass `res` in the context from your main server file setup
        if (context.res) {
          context.res.cookie("token", token, {
            expires: new Date(Date.now() + 8 * 3600000),
            httpOnly: true,
            secure: true,
            sameSite: "none",
          });
        }
        
        return { user: savedUser, token };
      } catch (error) {
        throw new Error("Sign up failed: " + error.message);
      }
    },
    login: async (_, { emailId, password }, context) => {
      try {
        const user = await User.findOne({ emailId: emailId });
        if (!user) {
          throw new Error("User not found");
        }
        
        const isMatch = await user.verifyPassword(password);
        if (!isMatch) {
          throw new Error("Invalid password");
        }
        
        const token = await user.generateToken();
        
        if (context.res) {
          context.res.cookie("token", token, {
            expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
            httpOnly: true,
            secure: true,
            sameSite: "none",
          });
        }
        
        return { user, token };
      } catch (error) {
        throw new Error("Login failed: " + error.message);
      }
    },
    logout: async (_, __, context) => {
      if (context.res) {
        context.res.cookie("token", null, {
          expires: new Date(Date.now()),
          httpOnly: true,
          secure: true,
          sameSite: "none",
        });
      }
      return "Logged out successfully";
    },
    editProfile: async (_, args, context) => {
      if (!context.user) throw new Error("Unauthorized");
      try {
        Object.keys(args).forEach(key => {
          if (args[key] !== undefined) {
            context.user[key] = args[key];
          }
        });
        await context.user.save();
        return context.user;
      } catch (err) {
        throw new Error("Edit profile failed");
      }
    },
    sendConnectionRequest: async (_, { toUserId, status }, context) => {
      if (!context.user) throw new Error("Unauthorized");
      try {
        const allowedStatus = ["interested", "ignored"];
        if (!allowedStatus.includes(status)) throw new Error("Invalid status type");
        
        const toUser = await User.findById(toUserId);
        if (!toUser) throw new Error("User not found");
        
        const existingRequest = await ConnectionRequestModel.findOne({
          $or: [
            { fromUserId: context.user._id, toUserId },
            { fromUserId: toUserId, toUserId: context.user._id }
          ]
        });
        
        if (existingRequest) throw new Error("Request already sent");
        
        const connectionRequest = new ConnectionRequestModel({
          fromUserId: context.user._id,
          toUserId,
          status
        });
        
        const savedRequest = await connectionRequest.save();

        if (toUser.fcmToken) {
          sendPushNotification(
            toUser.fcmToken, 
            "New Connection Request", 
            `${context.user.firstName} is interested in your profile.`
          );
        }
        
        return savedRequest;
      } catch (error) {
        throw new Error(error.message);
      }
    },
    reviewConnectionRequest: async (_, { requestId, status }, context) => {
      if (!context.user) throw new Error("Unauthorized");
      try {
        const allowedStatus = ["accepted", "rejected"];
        if (!allowedStatus.includes(status)) throw new Error("Invalid status type");
        
        const connectionRequest = await ConnectionRequestModel.findOne({
          _id: requestId,
          toUserId: context.user._id,
          status: "interested"
        });
        
        if (!connectionRequest) throw new Error("Request not found");
        
        connectionRequest.status = status;
        return await connectionRequest.save();
      } catch (error) {
        throw new Error(error.message);
      }
    },
    sendMessage: async (_, { targetUserId, textMessage }, context) => {
      if (!context.user) throw new Error("Unauthorized");
      try {
        const existingRequest = await ConnectionRequestModel.findOne({
          $or: [
            { fromUserId: context.user._id, toUserId: targetUserId, status: "accepted" },
            { fromUserId: targetUserId, toUserId: context.user._id, status: "accepted" }
          ]
        });
        
        if (!existingRequest) throw new Error("You can only chat with connected users");
        
        let chat = await Chat.findOne({
          participents: { $all: [context.user._id, targetUserId] }
        });
        
        if (!chat) {
          chat = new Chat({
            participents: [context.user._id, targetUserId],
            messages: []
          });
        }
        
        chat.messages.push({
          senderId: context.user._id,
          message: textMessage.trim()
        });
        
        await chat.save();

        const toUser = await User.findById(targetUserId);
        if (toUser && toUser.fcmToken) {
          sendPushNotification(
            toUser.fcmToken, 
            `New message from ${context.user.firstName}`, 
            textMessage.trim()
          );
        }

        return chat.messages[chat.messages.length - 1];
      } catch (err) {
        throw new Error(err.message);
      }
    },
    askChatbot: async (_, { message }, context) => {
      if (!context.user) throw new Error("Unauthorized");
      if (!process.env.GOOGLE_API_KEY) throw new Error("Google API Key is not configured");
      try {
        const history = await ChatBotMessage.find({ userId: context.user._id }).sort({ createdAt: -1 }).limit(10);
        const formattedHistory = [...history].reverse().map(msg =>
          msg.role === "user" ? new HumanMessage(msg.content) : new AIMessage(msg.content)
        );
        
        const model = new ChatGoogleGenerativeAI({
          apiKey: process.env.GOOGLE_API_KEY,
          model: "gemini-1.5-flash",
          temperature: 0.7,
          systemInstruction: "You are a helpful assistant for DevTinder, a platform for developers to connect. You help users with technical questions and platform-related queries. Use the provided chat history to keep the conversation context-aware. Keep your answers concise and friendly.",
        });
        
        const result = await model.invoke([
          ...formattedHistory,
          new HumanMessage(message)
        ]);
        
        const response = result.content;
        
        await new ChatBotMessage({ userId: context.user._id, role: "user", content: message }).save();
        await new ChatBotMessage({ userId: context.user._id, role: "assistant", content: response }).save();
        
        return response;
      } catch (error) {
        throw new Error("Failed to get response from chatbot: " + error.message);
      }
    },
    saveFCMToken: async (_, { token }, context) => {
      if (!context.user) throw new Error("Unauthorized");
      try {
        context.user.fcmToken = token;
        await context.user.save();
        return "FCM Token saved successfully";
      } catch (error) {
        throw new Error("Failed to save FCM token: " + error.message);
      }
    }
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
  Chat: {
    participents: async (parent) => {
      return await User.find({ _id: { $in: parent.participents } });
    }
  },
  Message: {
    senderId: async (parent) => {
      return await User.findById(parent.senderId);
    }
  }
};

export const apolloServer = new ApolloServer({
  typeDefs,
  resolvers,
});
