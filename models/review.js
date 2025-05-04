const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const reviewSchema = new Schema({
    rating: {
        type: Number,
        required: true,
    },
    comment: {
        type: String,
    },
    createdBy: {
        type: Schema.Types.ObjectId,
        ref: "User", // Reference the User model
        required: true,
    },
    listing: {
        type: Schema.Types.ObjectId,
        ref: "Listing", // Reference the Listing model
        required: true,
    },
});

module.exports = mongoose.model("Review", reviewSchema);