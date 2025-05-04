const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const listingSchema = new Schema({
    vname: String,
    vtype: String,
    vfuel: String,
    vpower: String,
    cost: Number,
    location: String,
    city: String,
    state: String,
    vlimit: Number,
    plimit: Number, 
    vinfo: String,
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
    },
    reviews: [
        {
            type: Schema.Types.ObjectId,
            ref: "Review",
        },
    ],
});

module.exports = mongoose.model("Listing", listingSchema);