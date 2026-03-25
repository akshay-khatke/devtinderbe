import express from "express";
import User from "../model/user.js";
import bcrypt from "bcrypt";
import { validateSignUpData } from "../utils/validation.js";
import { userAuth } from "../middleware/auth.js";

const authRouter = express.Router()

authRouter.post("/signUp", async (req, res) => {
    console.log(req, 'chedck body')

    try {
        validateSignUpData(req)

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
            httpOnly: true,
            secure: true,
            sameSite: "none",
        });

        res.json({ message: "User Added successfully!", data: savedUser });






        // res.send("user added successfully")
    } catch (err) {
        res.status(400).send(`Error: ${err.message}`)
    }
})


authRouter.patch("/changePassword", userAuth, async (req, res) => {
    try {
        const user = req.user
        const { oldPassword, newPassword } = req.body
        const isMatch = await user.verifyPassword(oldPassword)
        if (!isMatch) {
            return res.status(400).send("Invalid password")
        }
        const passwordHash = await bcrypt.hash(newPassword, 10);
        user.password = passwordHash
        console.log(user, 'Check the user data')
        await user.save()
        res.send({ message: "Password changed successfully", data: user })

    } catch (err) {
        console.log(err)
        res.send("Change password failed")
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
        res.cookie("token", token, {
            expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
            httpOnly: true,
            secure: true,
            sameSite: "none",
        });
        res.send(user)



    } catch (err) {
        console.log(err)
        res.status(400).send("login failed")
    }


})

authRouter.post("/logout", (req, res) => {
    try {
        res.cookie("token", null, {
            expires: new Date(Date.now()),
            httpOnly: true,
            secure: true,
            sameSite: "none",
        }).send("logout successfully")
    } catch (err) {
        console.log(err)
        res.status(400).send("logout failed")
    }
})



export default authRouter
