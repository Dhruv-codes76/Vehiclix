const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const bookingSchema = new Schema({
    vehicle: {
        type: Schema.Types.ObjectId,
        ref: "Listing", // Reference the Listing model
        required: true,
    },
    bookedBy: {
        type: Schema.Types.ObjectId,
        ref: "User", // Reference the User model
        required: true,
    },
    fromDate: {
        type: Date,
        required: true,
    },
    toDate: {
        type: Date,
        required: true,
    },
});

module.exports = mongoose.model("Booking", bookingSchema);
