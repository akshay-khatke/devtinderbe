import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { userAuth } from "../middleware/auth.js";
import { validateEditProfileData } from "../utils/validation.js";


// Ensure uploads directory exists
const uploadDir = "uploads/";
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer Storage Configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        cb(null, file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname));
    }
});

// File filter (Only allow images)
const fileFilter = (req, file, cb) => {
    const allowedMimeTypes = ["image/jpeg", "image/png", "image/jpg", "image/webp"];
    if (allowedMimeTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error("Only image files (.jpeg, .jpg, .png, .webp) are allowed!"), false);
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB Limit
});

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





profileRouter.patch("/addPhoto", userAuth, (req, res) => {
    upload.single("photo")(req, res, async (err) => {
        if (err) {
            return res.status(400).json({ message: err.message });
        }
        try {
            if (!req.file) {
                return res.status(400).json({ message: "Please upload a photo file" });
            }

            const user = req.user;
            const fileUrl = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;

            user.photoUrl = fileUrl;
            await user.save();

            res.send({
                message: "profile photo updated successfully",
                photoUrl: fileUrl,
                data: user
            });
        } catch (dbErr) {
            console.log(dbErr);
            res.status(500).json({ message: "edit profile photo failed" });
        }
    });
});


export default profileRouter