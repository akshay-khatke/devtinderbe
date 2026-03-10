import jwt from "jsonwebtoken";
import User from "../model/user.js";

export const userAuth = async (req, res, next) => {
    try {
        const token = req.cookies.token
        // console.log(req.cookies, 'check the token in middleware')
        if (!token) {
            return res.status(401).send("invalid token")
        }
        const isTokenValid = jwt.verify(token, "2594@KKi123")
        // console.log(isTokenValid._id, 'check the token VERIFY')
        const user = await User.findById(isTokenValid._id)
        if (!user) {
            return res.status(400).send("user does not found")
        }
        req.user = user
        next()
    }
    catch (err) {
        console.log(err, "check the error")
        res.status(400).send("ERROR :", err,)
    }

}
