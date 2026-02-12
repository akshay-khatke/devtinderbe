import mongoose from "mongoose";
import validator from "validator";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
const userSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: true,
        // index:true
    },
    lastName: {
        type: String,
        required: true
    },

    emailId: {
        type: String,
        required: true,
        unique: true,
        // validate(value){
        //     if(!validator.isEmail(value)){
        //         throw new Error("Invalid email")
        //     }
        // }
    },
    password: {
        type: String,
        required: true,
        validate(value) {
            if (!validator.isStrongPassword(value)) {
                throw new Error("Invalid password")
            }
        }
    },
    age: {
        type: Number,
        required: true,
        validate(value) {
            if (value < 18) {
                throw new Error("Invalid age")
            }
        }
    },
    gender: {
        type: String,
        required: true,
        enum: ["male", "female", "other"]
    },
    role: {
        type: String,
        required: true,
        enum: ["user", "admin"]
    }
},
    {
        timestamps: true
    }
)

userSchema.methods.generateToken = function () {
    const user = this
    return jwt.sign({ _id: user._id }, "2594@KKi123", { expiresIn: "7d" })
}
userSchema.methods.verifyPassword = async function (passwordInputByUser) {
    const user = this
    const passwordHash = this.password
    return bcrypt.compare(passwordInputByUser, passwordHash)
}

userSchema.index({ firstName: 1, lastName: 1 })
userSchema.index({ gender: 1 })

export default mongoose.model("User", userSchema) //model creation and export