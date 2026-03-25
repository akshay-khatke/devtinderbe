import express from "express";
import Chat from "../model/chat.js";
import { userAuth } from "../middleware/auth.js";
import ConnectionRequestModel from "../model/connectionRequest.js";

const chatRouter = express.Router();

/**
 * GET /chat/getChat/:targetUserId
 * Fetch chat history between logged-in user and target user.
 * Creates an empty chat if none exists.
 */
chatRouter.get("/getChat/:targetUserId", userAuth, async (req, res) => {
    const { targetUserId } = req.params;
    const userId = req.user._id;
    //  participents: { $all: [userId, targetUserId] } chat already there are not it will check
    try {
        let chat = await Chat.findOne({
            participents: { $all: [userId, targetUserId] }
        }).populate({
            path: "messages.senderId",
            select: "firstName lastName photoUrl"
        });
        //if chat already not there it will create new chat

        if (!chat) {
            chat = new Chat({
                participents: [userId, targetUserId],
                messages: []
            });
            await chat.save();
        }

        res.json({ success: true, data: chat });
    } catch (err) {
        console.error("getChat error:", err);
        res.status(400).json({ success: false, message: "Failed to get chat" });
    }
});

/**
 * POST /chat/sendMessage/:targetUserId
 * Send a message to a target user via REST API.
 * Both users must have an accepted connection request.
 */


chatRouter.post("/sendMessage/:targetUserId", userAuth, async (req, res) => {
    const { targetUserId } = req.params;
    const userId = req.user._id;
    const { textMessage } = req.body;

    if (!textMessage || textMessage.trim() === "") {
        return res.status(400).json({ success: false, message: "Message cannot be empty" });
    }
    //this will check the already connection is there or not
    // $or: [
    // { fromUserId: userId, toUserId: targetUserId, status: "accepted" },
    // { fromUserId: targetUserId, toUserId: userId, status: "accepted" }
    // ]


    try {
        // Verify both users are connected
        const existingRequest = await ConnectionRequestModel.findOne({
            $or: [
                { fromUserId: userId, toUserId: targetUserId, status: "accepted" },
                { fromUserId: targetUserId, toUserId: userId, status: "accepted" }
            ]
        });

        if (!existingRequest) {
            return res.status(403).json({
                success: false,
                message: "You can only chat with connected users"
            });
        }

        // Find or create the chat document
        let chat = await Chat.findOne({
            participents: { $all: [userId, targetUserId] }
        });

        if (!chat) {
            chat = new Chat({
                participents: [userId, targetUserId],
                messages: []
            });
        }

        chat.messages.push({
            senderId: userId,
            message: textMessage.trim()
        });

        await chat.save();

        // Populate sender info before returning
        const savedChat = await Chat.findById(chat._id).populate({
            path: "messages.senderId",
            select: "firstName lastName photoUrl"
        });

        const newMessage = savedChat.messages[savedChat.messages.length - 1];

        res.status(201).json({ success: true, data: newMessage });
    } catch (err) {
        console.error("sendMessage error:", err);
        res.status(400).json({ success: false, message: "Failed to send message" });
    }
});

export default chatRouter;
