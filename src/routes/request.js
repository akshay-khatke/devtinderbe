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

        const allRequest = ["interested", "ignored"]
        console.log(allRequest, "check the all request 1")
        if (!allRequest.includes(status)) {
            return res.status(400).send("invalid status type")
        }

        //user available in db
        const toUser = await user.findById(toUserId)
        if (!toUser) {
            return res.status(400).send({ "message": "User not found" })
        }
        const existingRequest = await ConnectionRequestModel.findOne({
            $or: [
                { fromUserId, toUserId },
                { fromUserId: toUserId, toUserId: fromUserId }
            ]
        })


        if (existingRequest) {
            return res.status(400).send({ "message": "request already sent" })
        }
        console.log(allRequest, "check the all request 2")
        const coonectionRequest = new ConnectionRequestModel({
            fromUserId,
            toUserId,
            status
        })
        console.log(coonectionRequest, "check the all request 3")
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
    // const fromUserId = loggedUser._id
    // const requestId = req.params.requestId
    // const status = req.params.status
    const { requestId, status } = req.params
    // validate the status 
    const allowedStatus = ["accepted", "rejected"]
    if (!allowedStatus.includes(status)) {
        return res.status(400).send({ "message": "invalid status type" })
    }
    console.log(requestId, loggedUser._id, "check the user")
    // request id should be in db 
    const connectionRequest = await ConnectionRequestModel.findOne({
        _id: requestId,
        toUserId: loggedUser._id,
        status: "interested"
    })
    console.log(connectionRequest, "check the user connection")

    if (!connectionRequest) {
        return res.status(404).json({ "message": "request not found" })
    }
    console.log(connectionRequest, status, "check the user connection")
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