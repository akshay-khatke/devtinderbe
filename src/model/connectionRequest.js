
import mongoose from "mongoose";

const connectionRequestSchema = new mongoose.Schema({
    fromUserId: {
        type: mongoose.Schema.Types.ObjectId,//referencing in collection
        ref: "User",//manage the referance user collection
        required: true
    },
    toUserId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    status: {
        type: String,
        enum: {
            values: ["ignored", "interested", "accepted", "rejected"],//restrict the user to some value
            message: `{VALUE} status value is not valid`
        },
        // default: "pending",
        required: true
    },

}, {
    timestamps: true
})
//before save check this function
//this will write on api also
connectionRequestSchema.pre("save", async function () {
    const connectionRequest = this
    if (connectionRequest.fromUserId.equals(connectionRequest.toUserId)) {
        throw new Error("You can not send request to yourself")
    }
})

// connectionRequestSchema.index({ fromUserId: 1, toUserId: 1 })
const ConnectionRequestModel = mongoose.model("ConnectionRequest", connectionRequestSchema)

export default ConnectionRequestModel