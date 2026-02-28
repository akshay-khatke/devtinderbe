import validator from "validator";

export const validateSignUpData = (req) => {
    const { firstName, lastName, emailId, password } = req.body;
    if (!firstName || !lastName) {
        throw new Error("Name is not valid!");
    } else if (!validator.isEmail(emailId)) {
        throw new Error("Email is not valid!");
    } else if (!validator.isStrongPassword(password)) {
        throw new Error("Please enter a strong Password!");
    }
};


export const validateEditProfileData = (req, res, next) => {
    const allowedFields = ["firstName", "lastName", "role", "photoUrl", "skills", "about"]
    const updateFields = Object.keys(req.body).every(key => allowedFields.includes(key))
    return updateFields
}



