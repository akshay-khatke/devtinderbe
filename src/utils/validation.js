import validator from "validator";

export const validateSignUpData = (req, res, next) => {

    const { firstName, lastName, emailId, password, age, gender, role } = req.body
    if (!firstName || !lastName) {
        throw new Error("Please enter name")
    } if (validator.isEmail(emailId)) {
        throw new Error("Please enter valid email")
    }
    if (validator.isStrongPassword(password)) {
        throw new Error("Please enter strong password")
    }
    if (age < 18) {
        throw new Error("Please enter valid age")
    }

}

export const validateEditProfileData = (req, res, next) => {
    const allowedFields = ["firstName", "lastName", "role"]
    const updateFields = Object.keys(req.body).every(key => allowedFields.includes(key))
    return updateFields
}



