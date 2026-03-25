import express from "express";
import { userAuth } from "../middleware/auth.js";
import ConnectionRequestModel from "../model/connectionRequest.js";
import user from "../model/user.js";


const requestRouter = express.Router()

requestRouter.post("/send/:status/:toUserId", userAuth, async (req, res) => {
    try {
        const fromUserId = req.user._id
        const toUserId = req.params.toUserId
        const status = req.params.status
        //chekced the status type is valid or not
        const allRequest = ["interested", "ignored"]
        if (!allRequest.includes(status)) {
            return res.status(400).send("invalid status type")
        }

        //user available in db
        const toUser = await user.findById(toUserId)
        if (!toUser) {
            return res.status(400).send({ "message": "User not found" })
        }
        //check the request already sent or not
        // { fromUserId, toUserId },short technique clear code
        // $or: [
        // { fromUserId:fromUserId, toUserId:toUserId },
        // { fromUserId: toUserId, toUserId: fromUserId }
        // ]
        const existingRequest = await ConnectionRequestModel.findOne({
            $or: [
                // Case 1: Current user sent request to target user
                { fromUserId, toUserId },

                // Case 2: Target user sent request to current user
                { fromUserId: toUserId, toUserId: fromUserId }
            ]
        });


        if (existingRequest) {
            return res.status(400).send({ "message": "request already sent" })
        }
        const coonectionRequest = new ConnectionRequestModel({
            fromUserId,
            toUserId,
            status
        })
        const data = await coonectionRequest.save();
        res.json({
            message: req.user.firstName + " is " + status + " in " + toUser.firstName,
            data
        })

    } catch (error) {
        console.log(error, "check the error 123")
        res.status(400).send("ERROR : ", error)
    }

})
requestRouter.post("/review/:status/:requestId", userAuth, async (req, res) => {
    const loggedUser = req.user

    const { requestId, status } = req.params
    // validate the status 
    const allowedStatus = ["accepted", "rejected"]
    if (!allowedStatus.includes(status)) {
        return res.status(400).send({ "message": "invalid status type" })
    }
    console.log(requestId, loggedUser._id, "check the user")
    // request id should be in db 
    // to user id is logged in user id because the request is sent to the 
    // logged in user and touserid is the user who sent the request should be  accept this no othe can access that why added touserid as logged in user id
    const connectionRequest = await ConnectionRequestModel.findOne({
        _id: requestId,
        toUserId: loggedUser._id,
        status: "interested"
    })

    if (!connectionRequest) {
        return res.status(404).json({ "message": "request not found" })
    }
    connectionRequest.status = status
    await connectionRequest.save()
    res.json({ "message": "Request updated successfully", data: connectionRequest })
    // a send request to b
    // b should be the logged in user =toUserId
    //status should be interested 
    // request id should be in db 
    //
    // reciver should be the to user user id


})

requestRouter.post("/reject/rejected/:toUserId", userAuth, (req, res) => {
    res.send("register")
})



export default requestRouter