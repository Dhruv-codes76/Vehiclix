const Listing = require("./models/listing.js");
const Review = require("./models/review.js");
const Booking = require("./models/booking");
const ExpressError=require("./utils/ExpressError.js");
const {listingSchema} = require("./schema.js");
const { reviewSchema } =require("./schema.js")
const mongoose = require("mongoose");


module.exports.isLoggedIn = (req,res,next) => {
    if(!req.isAuthenticated()){ 
        //redirectUrl
    req.session.redirectUrl = req.originalUrl;
    req.flash("error","You must be logged in to create a new listing")
    return res.redirect("/login"); 
}
next()
}

module.exports.saveRedirectUrl = (req,res,next) => {
   if(req.session.redirectUrl){
       res.locals.redirectUrl = req.session.redirectUrl;
   }
    next();
} 


module.exports.isAuthorised = async (req,res,next) => {
    let { id } = req.params;
    let listing =await Listing.findById(id);
    if(!listing.owner.equals(res.locals.currUser._id)){
      req.flash("error","You are not authorized to do that")
      res.redirect(`/listings/${id}`);
    }
    next();
}

module.exports.validateListing = (req,res,next)=>{
    let {error} = listingSchema.validate(req.body);
    if(error){
      let errMsg=error.details.map((el)=> el.message).join(",");
      throw new ExpressError(400,errMsg)
    }else{
      next();
    }
  }

  module.exports.validateReview = (req,res,next)=>{
    let {error} = reviewSchema.validate(req.body);
    if(error){
      let errMsg=error.details.map((el)=> el.message).join(",");
      throw new ExpressError(400,errMsg)
    }else{
        
      next();
    }
  }

  module.exports.isreviewAuthor = async (req,res,next) => {
    let { id,reviewId } = req.params;
    let review =await Review.findById(reviewId);
    if(!review.createdBy.equals(res.locals.currUser._id)){
      req.flash("error","You are not authorized to do that")
      res.redirect(`/listings/${id}`);
    }
    next();
  }

module.exports.isAdminOrSuperadmin = (req, res, next) => {
    if (!req.isAuthenticated() || (req.user.role !== "admin" && req.user.role !== "superadmin")) {
        req.flash("error", "You do not have permission to access this page.");
        return res.redirect("/");
    }
    next();
};

module.exports.isCurrentlyBooked = async (req, res, next) => {
    const { id } = req.params;

    // Validate that the id is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
        req.flash("error", "Invalid vehicle ID.");
        return res.redirect("/listings");
    }

    try {
        // Fetch bookings for the current listing
        const bookings = await Booking.find({ vehicle: id });

        // Check if the vehicle is currently booked
        const now = new Date();
        const isCurrentlyBooked = bookings.some(booking => {
            return now >= booking.fromDate && now <= booking.toDate;
        });

        // Attach the result to the request object
        req.isCurrentlyBooked = isCurrentlyBooked;
        req.bookings = bookings; // Attach bookings for further use in the controller
        next();
    } catch (err) {
        console.error("Error checking booking status:", err);
        req.flash("error", "Failed to check booking status.");
        res.redirect("/listings");
    }
};