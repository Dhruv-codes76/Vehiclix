const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const listingSchema = new Schema({
    vname: { type: String, required: true },
    vtype: { type: String, required: true },
    vfuel: { type: String, required: true },
    vpower: { type: String, required: true },
    cost: { type: Number, required: true },
    location: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    vlimit: { type: Number, required: true },
    plimit: { type: Number, required: true },
    vinfo: { type: String, required: true },
    image: {
        url: String,
        filename: String,
    },
    geometry: {
        type: {
            type: String,
            enum: ["Point"],
            required: true,
        },
        coordinates: {
            type: [Number],
            required: true,
        },
    },
    owner: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    reviews: [
        {
            type: Schema.Types.ObjectId,
            ref: "Review",
        },
    ],
});

module.exports = mongoose.model("Listing", listingSchema);