import jwt from "jsonwebtoken";
import User from "../model/user.js";

export const userAuth = async (req, res, next) => {
    try {
        let token = req.cookies.token;
        
        if (!token && req.headers.authorization) {
            if (req.headers.authorization.startsWith("Bearer ")) {
                token = req.headers.authorization.split(" ")[1];
            } else {
                token = req.headers.authorization;
            }
        }

        if (!token) {
            return res.status(401).send("invalid token")
        }
        const isTokenValid = await jwt.verify(token, process.env.JWT_SECRETE_KEY)
        const user = await User.findById(isTokenValid._id)
        if (!user) {
            return res.status(400).send("user does not found")
        }
        req.user = user
        next()
    }
    catch (err) {
        console.log(err, "check the error")
        res.status(401).send("invalid token")
    }

}
