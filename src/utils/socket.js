import { Server } from "socket.io";
import crypto from "crypto";
import mongoose from "mongoose";
import Chat from "../model/chat.js";
import ConnectionRequestModel from "../model/connectionRequest.js";

const getSecreteRoomId = (userId, targetUserId) => {
    return crypto.createHash("sha256").update([userId, targetUserId].sort().join("_")).digest("hex");
};

export const socketConnection = (serverConnection) => {
    const io = new Server(serverConnection, {
        cors: {
            origin: (origin, callback) => {
                const allowedOrigins = [
                    "http://localhost:5174",
                    "http://127.0.0.1:5174",
                    "http://localhost:5173",
                    "http://localhost:3000",
                    "http://localhost:10000",
                    "http://127.0.0.1:5173",
                ];
                if (!origin || allowedOrigins.includes(origin) || origin.includes("vercel.app")) {
                    callback(null, true);
                } else {
                    callback(new Error("Not allowed by CORS"));
                }
            },
            credentials: true,
        }
    });

    io.on("connection", (socket) => {
        console.log("User connected:", socket.id);

        // Join a private room between two users
        socket.on("joinChat", ({ firstName, userId, targetUserId }) => {
            if (!userId || !targetUserId) {
                console.error("joinChat missing userId or targetUserId:", { userId, targetUserId });
                return;
            }
            const uidStr = String(userId);
            const tuidStr = String(targetUserId);
            const roomId = getSecreteRoomId(uidStr, tuidStr);
            socket.join(roomId);
            console.log(`[Socket] ${firstName} (ID: ${uidStr}) joined room: ${roomId} with target: ${tuidStr}`);
        });

        // Send a message via socket
        socket.on("sendMessage", async ({ firstName, userId, targetUserId, textMessage }) => {
            console.log(`[Socket] sendMessage received from ${firstName} (ID: ${userId}) to ${targetUserId}: "${textMessage}"`);
            try {
                if (!userId || !targetUserId) {
                    console.error("[Socket] sendMessage error: missing userId or targetUserId");
                    socket.emit("error", { message: "Invalid sender or receiver ID" });
                    return;
                }

                const uidStr = String(userId);
                const tuidStr = String(targetUserId);
                const roomId = getSecreteRoomId(uidStr, tuidStr);

                // Explicitly cast to mongoose.Types.ObjectId to ensure MongoDB queries match perfectly
                const fromUserObjectId = new mongoose.Types.ObjectId(uidStr);
                const toUserObjectId = new mongoose.Types.ObjectId(tuidStr);

                console.log(`[Socket] Checking connection request between ${uidStr} and ${tuidStr}`);
                // Check if both users are connected (accepted request)
                const existingRequest = await ConnectionRequestModel.findOne({
                    $or: [
                        { fromUserId: fromUserObjectId, toUserId: toUserObjectId, status: "accepted" },
                        { fromUserId: toUserObjectId, toUserId: fromUserObjectId, status: "accepted" }
                    ]
                });

                if (!existingRequest) {
                    console.warn(`[Socket] Connection NOT accepted or doesn't exist between ${uidStr} and ${tuidStr}`);
                    socket.emit("error", { message: "You are not connected with this user" });
                    return;
                }

                console.log(`[Socket] Connection verified. Finding or creating chat...`);
                // Find or create chat
                let chat = await Chat.findOne({
                    participents: { $all: [fromUserObjectId, toUserObjectId] }
                });

                if (!chat) {
                    console.log(`[Socket] Creating new chat document for participants.`);
                    chat = new Chat({
                        participents: [fromUserObjectId, toUserObjectId],
                        messages: []
                    });
                }

                // Push message once
                chat.messages.push({
                    senderId: fromUserObjectId,
                    message: textMessage
                });

                await chat.save();
                console.log(`[Socket] Message saved to database. Emitting messageReceived to room: ${roomId}`);

                // Emit to everyone in the room
                io.to(roomId).emit("messageReceived", {
                    firstName,
                    textMessage,
                    senderId: uidStr,
                    timestamp: new Date()
                });

            } catch (err) {
                console.error("[Socket] sendMessage exception:", err.message);
                socket.emit("error", { message: "Failed to send message" });
            }
        });

        socket.on("disconnect", () => {
            console.log("User disconnected:", socket.id);
        });
    });
};