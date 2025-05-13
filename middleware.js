const Listing = require("./models/listing.js");
const Review = require("./models/review.js");
const Booking = require("./models/booking");
const ExpressError = require("./utils/ExpressError.js");
const { listingSchema, reviewSchema } = require("./schema.js");
const mongoose = require("mongoose");

module.exports.isLoggedIn = (req, res, next) => {
    if (!req.isAuthenticated()) {
        req.flash("error", "You must be signed in to access this page.");
        return res.redirect("/login");
    }
    next();
};

module.exports.saveRedirectUrl = (req, res, next) => {
    if (req.session.redirectUrl) {
        res.locals.redirectUrl = req.session.redirectUrl;
    }
    next();
};

module.exports.isAuthorised = async (req, res, next) => {
    let { id } = req.params;
    let listing = await Listing.findById(id);
    if (!listing.owner.equals(res.locals.currUser._id)) {
        req.flash("error", "You are not authorized to do that");
        return res.redirect(`/listings/${id}`);
    }
    next();
};

module.exports.validateListing = (req, res, next) => {
    const { error } = listingSchema.validate(req.body);
    if (error) {
        const msg = error.details.map(el => el.message).join(", ");
        req.flash("error", msg);
        return res.redirect("/listings/new");
    }
    next();
};

module.exports.validateReview = (req, res, next) => {
    const { error } = reviewSchema.validate(req.body, { abortEarly: false });
    if (error) {
        const errMsg = error.details.map(el => el.message).join(", ");
        throw new ExpressError(400, errMsg);
    } else {
        next();
    }
};

module.exports.isreviewAuthor = async (req, res, next) => {
    let { id, reviewId } = req.params;
    let review = await Review.findById(reviewId);
    if (!review.createdBy.equals(res.locals.currUser._id)) {
        req.flash("error", "You are not authorized to do that");
        return res.redirect(`/listings/${id}`);
    }
    next();
};

module.exports.isAdminOrSuperadmin = (req, res, next) => {
    if (!req.user || (req.user.role !== "admin" && req.user.role !== "superadmin")) {
        req.flash("error", "You do not have permission to perform this action.");
        return res.redirect("/");
    }
    next();
};


module.exports.isCurrentlyBooked = async (req, res, next) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        req.flash("error", "Invalid vehicle ID.");
        return res.redirect("/listings");
    }

    try {
        const now = new Date();
        const bookings = await Booking.find({ vehicle: id });

        const isCurrentlyBooked = bookings.some(booking => booking.toDate >= now);

        req.isCurrentlyBooked = isCurrentlyBooked;
        req.bookings = bookings;
        next();
    } catch (err) {
        console.error("Error checking booking status:", err);
        req.flash("error", "Failed to check booking status.");
        res.redirect("/listings");
    }
};
