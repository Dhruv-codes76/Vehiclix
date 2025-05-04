const Listing = require("../models/listing");
const Review = require("../models/review");


module.exports.homepage = async (req, res) => {
    try {
        const allListings = await Listing.find({});
        const reviews = await Review.find({}).populate("createdBy");
        res.render("homepage/home", { allListings, reviews });
    } catch (err) {
        console.error("Error loading homepage:", err);
        req.flash("error", "Failed to load homepage.");
        res.redirect("/");
    }
};