import mongoose from "mongoose";

const chatbotMessageSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    role: { type: String, enum: ["user", "assistant"], required: true },
    content: { type: String, required: true },
}, { timestamps: true });

export default mongoose.model("ChatBotMessage", chatbotMessageSchema);
