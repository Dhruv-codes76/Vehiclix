const mongoose = require("mongoose");
const passportLocalMongoose = require("passport-local-mongoose");

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
    },
    firstName: {
        type: String,
        required: true,
    },
    lastName: {
        type: String,
        required: true,
    },
    phoneNumber: {
        type: String,
        required: true,
    },
    role: {
        type: String,
        enum: ["user", "admin", "superadmin"], // Allowed roles
        default: "user", // Default role
    },
});

userSchema.plugin(passportLocalMongoose); // Adds username and password fields

module.exports = mongoose.model("User", userSchema);