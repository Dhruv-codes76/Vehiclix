const Listing = require("../models/listing");
const Review = require("../models/review");


module.exports.homepage=async (req, res) => {
    const allListings = await Listing.find({});
    const reviews = await Review.find({}).populate("createdBy");
    res.render("listings/home", { allListings, reviews });
  };