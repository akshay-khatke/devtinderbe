import { Server } from "socket.io";
import crypto from "crypto";
import Chat from "../model/chat.js";
import ConnectionRequestModel from "../model/connectionRequest.js";

const getSecreteRoomId = (userId, targetUserId) => {
    return crypto.createHash("sha256").update([userId, targetUserId].sort().join("_")).digest("hex");
};

export const socketConnection = (serverConnection) => {
    const io = new Server(serverConnection, {
        cors: {
            origin: (origin, callback) => {
                if (!origin || origin.includes("vercel.app") || origin.includes("localhost")) {
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
            const roomId = getSecreteRoomId(userId, targetUserId);
            socket.join(roomId);
            console.log(`${firstName} joined room ${roomId}`);
        });

        // Send a message via socket
        socket.on("sendMessage", async ({ firstName, userId, targetUserId, textMessage }) => {
            try {
                const roomId = getSecreteRoomId(userId, targetUserId);

                // Check if both users are connected (accepted request)
                const existingRequest = await ConnectionRequestModel.findOne({
                    $or: [
                        { fromUserId: userId, toUserId: targetUserId, status: "accepted" },
                        { fromUserId: targetUserId, toUserId: userId, status: "accepted" }
                    ]
                });

                if (!existingRequest) {
                    socket.emit("error", { message: "You are not connected with this user" });
                    return;
                }

                // Find or create chat
                let chat = await Chat.findOne({
                    participents: { $all: [userId, targetUserId] }
                });

                if (!chat) {
                    chat = new Chat({
                        participents: [userId, targetUserId],
                        messages: []
                    });
                }

                // Push message once
                chat.messages.push({
                    senderId: userId,
                    message: textMessage
                });

                await chat.save();

                // Emit to everyone in the room
                io.to(roomId).emit("messageReceived", {
                    firstName,
                    textMessage,
                    senderId: userId,
                    timestamp: new Date()
                });

            } catch (err) {
                console.error("sendMessage error:", err.message);
                socket.emit("error", { message: "Failed to send message" });
            }
        });

        socket.on("disconnect", () => {
            console.log("User disconnected:", socket.id);
        });
    });
};