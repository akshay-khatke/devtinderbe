import express from "express";
import { userAuth } from "../middleware/auth.js";
import { validateEditProfileData } from "../utils/validation.js";


const profileRouter = express.Router()

profileRouter.get("/getDetails", userAuth, (req, res) => {
    //  const user=new User()
    try {
        const user = req.user
        if (!user) {
            return res.status(400).send("user does not found 123")
        }
        res.send(user)
    } catch (err) {
        console.log(err)
        res.send("get profile failed")
    }
})
profileRouter.get("/view", userAuth, (req, res) => {
    //  const user=new User()
    console.log('check the user data 12344')
    try {
        const user = req.user
        if (!user) {
            return res.status(400).send("user does not found 123")
        }

        res.send(user)
    } catch (err) {
        console.log(err)
        res.send("get profile failed")
    }
})

profileRouter.patch("/edit", userAuth, async (req, res) => {
    console.log(req.body, 'check the body data 123')
    try {
        // if (!validateEditProfileData(req)) {
        //     throw new Error("invalid edit profile data")
        // }
        const user = req.user
        Object.keys(req.body).forEach(key => {
            user[key] = req.body[key]
        })
        await user.save()
        res.send({ message: "profile updated successfully", data: user })

    } catch (err) {
        console.log(err)
        res.send("edit profile failed")
    }
})





export default profileRouter