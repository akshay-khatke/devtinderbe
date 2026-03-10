import mongoose from "mongoose";


const messageSchema = new mongoose.Schema({
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    message: { type: String, required: true },
}, { timestamps: true })

const chatSchema = new mongoose.Schema({

    participents: [{ type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }],
    messages: [messageSchema],


})

export default mongoose.model("Chat", chatSchema)