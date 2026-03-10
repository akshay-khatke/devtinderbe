import express from "express";
import User from "../model/user.js";
import { userAuth } from "../middleware/auth.js";
import ConnectionRequestModel from "../model/connectionRequest.js";
// const USER_SAFE_DATA = "firstName lastName photoUrl age gender about skills";

const USER_SAFE_DATA = "firstName lastName photoUrl age gender about skills";
const userRouter = express.Router()
//pending connection request
userRouter.get("/requestReceived", userAuth, async (req, res) => {
    try {
        const loggedUser = req.user

        const connectionRequest = await ConnectionRequestModel.find({
            toUserId: loggedUser._id,
            status: "interested"
        }).populate("fromUserId", USER_SAFE_DATA)
        // populate("fromUserId", "firstName lastName emailId")
        // populate("fromUserId") //all object
        //if passed fromUserId all data object send from DB
        res.json({ message: "Data fethced succesfullly", data: connectionRequest })
    } catch (err) {
        console.log(err)
        res.status(400).send("ERROR : " + err.message)
    }
})





userRouter.get("/connections", userAuth, async (req, res) => {

    try {
        const loggedUser = req.user

        // akshay =>elon=>accepted
        // elon=>mark=>accepted
        //data show for the one of the condition satify
        const connectionRequest = await ConnectionRequestModel.find({
            $or: [
                { toUserId: loggedUser._id, status: "accepted" },
                { fromUserId: loggedUser._id, status: "accepted" }
            ]
        }).populate("fromUserId", USER_SAFE_DATA).populate("toUserId", USER_SAFE_DATA)

        // console.log(connectionRequest, "check the connection request asdhh")

        //to check the connection send from to user or from user
        const data = connectionRequest.map((row) => {
            if (row.fromUserId._id.toString() === loggedUser._id.toString()) {
                return row.toUserId
            }
            else {
                return row.fromUserId
            }
        })



        res.json({ data: data })

    } catch (err) {
        console.log(err, "check the error connection userr")
        res.status(400).send("ERROR : " + err.message)
    }

})


// a send rerquest to b ,then a could not see again the card
//a ingored the c request then a could not see again the card
//a connection send with it should not show in the feed
//a should not se card himself

//user should  see all the user cards exepts
//- hisown card
//- his connection
//-his igbnored card
//-already sent connection request
//example a b c d e are the users
//rahul is new user -he should se all profile
//r->a r->b    r ignored a r-accpet->b

// he will see all other request except a and b

userRouter.get("/feed", userAuth, async (req, res) => {
    try {
        const loggedUser = req.user
        const page = parseInt(req.query.page) || 1//in strings
        let limit = parseInt(req.query.limit) || 10
        limit = limit > 50 ? 50 : limit
        const skip = (page - 1) * limit
        //all connection rquest both send and recoived requests
        const connectionRequest = await ConnectionRequestModel.find({
            $or: [
                { toUserId: loggedUser._id },
                { fromUserId: loggedUser._id }
            ]
        }).select("fromUserId toUserId")
        // this peoples i have to hide from the my feed 
        const blockUsers = new Set()
        connectionRequest.forEach((row) => {
            blockUsers.add(row.fromUserId.toString())
            blockUsers.add(row.toUserId.toString())
        })

        //find all users except block users and logged user
        const users = await User.find({
            $and: [{
                _id: {
                    $nin: Array.from(blockUsers)
                }
            },
            {
                _id: {
                    $ne: loggedUser._id

                }
            }]
        }).select("firstName lastName emailId photoUrl age gender about skills").skip(skip).limit(limit)

        // if thousenads of user are there so evry time i doent want to send the all user i want 10 users at time so need pagination 
        console.log(users, "check the users uasja")
        console.log(blockUsers, users, "check the block users")
        res.json({ data: users })
        console.log(connectionRequest, "check the connection request")

    } catch (err) {
        console.log(err)
        res.status(400).send("ERROR : " + err.message)
    }
})

//feed?page=1&limit=10->1-10
//feed?page=2&limit=10->11-20
//feed?page=2&limit=10->21-30
//mongo db pagination
// skip(10)->how many documents you want to skip 
// .limit(10) ->how many documents you want
// skip(0)-limit(10)->1-10
// skip(10)-limit(10)->11-20
// skip(20)-limit(10)->21-30

export default userRouter