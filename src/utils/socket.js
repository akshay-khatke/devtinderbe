import { Server } from "socket.io";
import crypto from "crypto";
import Chat from "../model/chat.js";
import ConnectionRequestModel from "../model/connectionRequest.js";

const getSecreteRoomId = (userId, targetUserId) => {
    return crypto.createHash("sha256").update([userId, targetUserId].sort().join("_")).digest("hex");
}

export const socketConnection = (serverConnection) => {
    const io = new Server(serverConnection, {
        cors: {
            origin: "http://localhost:5173",
        }
    });

    io.on("connection", (socket) => {
        console.log("User connected:", socket.id);

        socket.on("joinChat", ({ firstName, userId, targetUserId }) => {
            const roomId = getSecreteRoomId(userId, targetUserId);
            socket.join(roomId);
            console.log(`${firstName} joined room ${roomId}`);
        });

        socket.on("sendMessage", async ({ firstName, userId, targetUserId, textMessage }) => {
            const chat = await Chat.findOne({ participents: { $all: [userId, targetUserId] } })
            //save message in db

            // first check the existing message or not 
            // if yes push if no create new chat
            try {
                const roomId = getSecreteRoomId(userId, targetUserId);

                console.log("Room:", roomId);
                console.log("Message:", firstName, textMessage);

                const existingRequest = await ConnectionRequestModel.findOne({
                    $or: [
                        { userId, targetUserId },
                        { fromUserId: targetUserId, toUserId: fromUserId }
                    ]
                })


                if (!existingRequest) {
                    return res.status(400).send({ "message": "please send request to user" })
                }

                let chat = await Chat.findOne({ participents: { $all: [userId, targetUserId] } })
                if (!chat) {

                    chat = new Chat({
                        participents: [userId, targetUserId],
                        messages: [{
                            senderId: userId,
                            message: textMessage
                        }
                        ]
                    })

                }

                chat.messages.push({
                    senderId: userId,
                    message: textMessage
                })
                await chat.save()

                io.to(roomId).emit("messageReceived", {
                    firstName,
                    textMessage
                });
            } catch (err) {
                console.log(err.message)
            }


        });

        socket.on("disconnect", () => {
            console.log("User disconnected:", socket.id);
        });
    });
};