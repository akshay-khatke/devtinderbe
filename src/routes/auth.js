import express from "express";
import User from "../model/user.js";
import bcrypt from "bcrypt";
import { validateSignUpData } from "../utils/validation.js";

const authRouter = express.Router()

authRouter.post("/signUp", async (req, res) => {
    console.log(req, 'chedck body')
    // validateSignUpData(req)
    const userObj = {
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        emailId: req.body.emailId,
        password: req.body.password,
        age: req.body.age,
        gender: req.body.gender,
        role: req.body.role
    }
    const user = new User(userObj)
    try {

        const saltRound = await bcrypt.genSalt(10)//more number more password safe
        user.password = await bcrypt.hash(user.password, saltRound)
        await user.save()
        res.send("user added successfully")
    } catch (err) {

        res.status(400).send(`Error: ${err.message}`)
    }
})
authRouter.post("/login", async (req, res) => {
    const { emailId, password } = req.body
    try {
        const user = await User.findOne({ emailId: emailId })
        console.log(user, 'check the user data')
        if (!user) {
            return res.status(400).send("user not found")
        }


        const isMatch = await user.verifyPassword(password)
        if (!isMatch) {
            return res.status(400).send("invalid password")
        }
        const token = user.generateToken()
        res.cookie("token", token, { expires: new Date(Date.now() + 24 * 60 * 60 * 1000) })
        res.send(user)



    } catch (err) {
        console.log(err)
        res.status(400).send("login failed")
    }


})

authRouter.post("/logout", (req, res) => {
    try {
        res.clearCookie("token")
        res.cookie("token", null, { expires: new Date(Date.now()) }).send("logout successfully")
    } catch (err) {
        console.log(err)
        res.status(400).send("logout failed")
    }
})



export default authRouter
