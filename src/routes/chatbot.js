import express from "express";
import { userAuth } from "../middleware/auth.js";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import ChatBotMessage from "../model/chatbotMessage.js";
import { HumanMessage, AIMessage } from "@langchain/core/messages";

const chatbotRouter = express.Router();

chatbotRouter.post("/ask", userAuth, async (req, res) => {
  try {
    const { message } = req.body;
    const userId = req.user._id;

    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    if (!process.env.GOOGLE_API_KEY) {
      return res.status(500).json({ error: "Google API Key is not configured" });
    }

    // Fetch previous history
    const history = await ChatBotMessage.find({ userId }).sort({ createdAt: -1 }).limit(10);
    const formattedHistory = [...history].reverse().map(msg =>
      msg.role === "user" ? new HumanMessage(msg.content) : new AIMessage(msg.content)
    );

    // Using gemini-pro which is very stable across all API versions
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

    // Save user message to DB
    await new ChatBotMessage({
      userId,
      role: "user",
      content: message
    }).save();

    // Save bot response to DB
    await new ChatBotMessage({
      userId,
      role: "assistant",
      content: response
    }).save();

    res.json({ reply: response });
  } catch (error) {
    console.error("Chatbot Error Details:", error);
    res.status(500).json({ error: "Failed to get response from chatbot: " + error.message });
  }
});

chatbotRouter.get("/history", userAuth, async (req, res) => {
  try {
    const userId = req.user._id;
    const messages = await ChatBotMessage.find({ userId }).sort({ createdAt: 1 });
    const formattedMessages = messages.map(msg => ({
      id: msg._id,
      text: msg.content,
      isBot: msg.role === "assistant",
      timestamp: msg.createdAt
    }));
    res.json({ history: formattedMessages });
  } catch (error) {
    console.error("Fetch History Error:", error);
    res.status(500).json({ error: "Failed to fetch chat history" });
  }
});

export default chatbotRouter;