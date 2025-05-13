const Review = require("../models/review");
const Listing = require("../models/listing");

module.exports.createReview = async (req, res) => {
    const { id } = req.params; // Extract the listing ID from the route
    const listing = await Listing.findById(id);

    if (!listing) {
        req.flash("error", "Listing not found.");
        return res.redirect("/listings");
    }

    const review = new Review({
        rating: req.body.review.rating,
        comment: req.body.review.comment,
        createdBy: req.user._id, // Assuming `req.user` contains the logged-in user
        listing: id, // Associate the review with the listing
    });

    await review.save();
    listing.reviews.push(review); // Add the review to the listing's reviews array
    await listing.save();

    req.flash("success", "Review added successfully!");
    res.redirect(`/listings/${listing._id}`);
};

module.exports.deleteReview = async(req,res)=>{
    let { id,reviewId}=req.params;
    await Listing.findByIdAndUpdate(id,{$pull:{reviews: reviewId}});
    await Review.findByIdAndDelete(reviewId);
    req.flash("success", "Review Deleted")
    res.redirect(`/listings/${id}`)
  }
