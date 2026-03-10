
import express from "express";
import Chat from "../model/chat.js";
import { userAuth } from "../middleware/auth.js";

const chatRouter = express.Router();

chatRouter.get("/getChat/:targetUserId", userAuth, async (req, res) => {

    const { targetUserId } = req.params
    const userId = req.user._id
    console.log("log 1  ")
    try {
        let chat = await Chat.findOne({
            participents: {
                $all: [userId, targetUserId]
            }
        }).populate({
            path: "messages.senderId",
            select: "firstName lastName"
        })
        console.log("log 2  ", chat)
        if (!chat) {
            console.log("log 3  ")
            chat = new Chat({
                participents: [userId, targetUserId],
                messages: []
            })
            console.log("log 4  ")
            await chat.save()
        }
        console.log("log 5  ")

        res.json(chat)
    } catch (err) {
        console.log(err)
        res.status(400).send("get chat failed")
    }

})


export default chatRouter

