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
        default: 18,
        validate(value) {
            if (value < 18) {
                throw new Error("Invalid age")
            }
        }
    },

    gender: {
        type: String,
        enum: {
            values: ["male", "female", "other"],
            message: `{VALUE} is not a valid gender type`,
        }
    },
    role: {
        type: String,
        default: "user",
        enum: ["user", "admin"]
    },
    photoUrl: {
        default: "https://geographyandyou.com/images/user-profile.png",
        type: String,
        required: true
    },
    skills: {
        type: [String],
    },

    about: {
        type: String,
        default: "This is a default about of the user!",
    },
    membershipType: {
        type: String,
        default: "free",
        enum: ["free", "silver", "gold"]
    }
},
    {
        timestamps: true
    }
)

userSchema.methods.generateToken = function () {
    const user = this
    return jwt.sign({ _id: user._id }, process.env.JWT_SECRETE_KEY, { expiresIn: "7d" })
}
userSchema.methods.verifyPassword = async function (passwordInputByUser) {
    const user = this
    const passwordHash = this.password
    return bcrypt.compare(passwordInputByUser, passwordHash)
}

userSchema.index({ firstName: 1, lastName: 1 })
userSchema.index({ gender: 1 })

export default mongoose.model("User", userSchema) //model creation and export