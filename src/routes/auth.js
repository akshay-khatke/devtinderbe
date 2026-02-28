import express from "express";
import User from "../model/user.js";
import bcrypt from "bcrypt";
import { validateSignUpData } from "../utils/validation.js";

const authRouter = express.Router()

authRouter.post("/signUp", async (req, res) => {
    console.log(req, 'chedck body')

    try {
        validateSignUpData(req)

        // const userObj = {
        //     firstName: req.body.firstName,
        //     lastName: req.body.lastName,
        //     emailId: req.body.emailId,
        //     password: req.body.password,
        //     age: req.body.age,
        //     gender: req.body.gender,
        //     role: req.body.role,
        //     skills: req.body.skills,
        //     photoUrl: req.body.photoUrl,
        //     about: req.body.about
        // }

        // const user = new User(userObj)

        // const token = user.generateToken()

        // res.cookie("token", token, { expires: new Date(Date.now() + 24 * 60 * 60 * 1000) })
        // res.json({ message: "user added successfully", data: user })

        // await user.save()










        const { firstName, lastName, emailId, password } = req.body;

        // Encrypt the password
        const passwordHash = await bcrypt.hash(password, 10);
        console.log(passwordHash);

        //   Creating a new instance of the User model
        const user = new User({
            firstName,
            lastName,
            emailId,
            password: passwordHash,
        });

        const savedUser = await user.save();
        const token = await savedUser.generateToken();

        res.cookie("token", token, {
            expires: new Date(Date.now() + 8 * 3600000),
        });

        res.json({ message: "User Added successfully!", data: savedUser });






        // res.send("user added successfully")
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
