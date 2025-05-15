const express = require("express");
const router = express.Router();
const { isAdminOrSuperadmin } = require("../middleware.js");
const User = require("../models/user");
const Listing = require("../models/listing");
const Booking = require("../models/booking");
const Review = require("../models/review");

module.exports.dashboard =  async (req, res) => {
    try {
        const activeTab = req.query.tab || "users";
        const sortField = req.query.sort || "fromDate"; // Default to fromDate
        const users = await User.find({});
        const listings = await Listing.find({}).populate("owner");
        const bookings = await Booking.find({})
            .populate("vehicle")
            .populate("bookedBy")
            .sort({ [sortField]: -1 }); // Sort by the specified field
        const reviews = await Review.find({}).populate("createdBy").populate("listing");

        res.render("admin/dashboard", { users, listings, bookings, reviews, activeTab });
    } catch (err) {
        console.error("Error loading dashboard:", err.message);
        req.flash("error", "Error loading dashboard.");
        res.redirect("/");
    }
}

module.exports.promoteUser = async (req, res) => {
    try {
        console.log("Promote Route Accessed");
        console.log("User ID:", req.params.id);

        const user = await User.findById(req.params.id);
        console.log("User Found:", user);

        if (!user) {
            req.flash("error", "User not found.");
            return res.redirect("/admin/dashboard?tab=users");
        }

        user.role = "admin";
        await user.save();

        console.log("User Promoted to Admin:", user);
        req.flash("success", "User promoted to admin.");
        res.redirect("/admin/dashboard?tab=users");
    } catch (err) {
        console.error("Error Promoting User:", err);
        req.flash("error", "Something went wrong.");
        res.redirect("/admin/dashboard?tab=users");
    }
}

module.exports.demoteUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            req.flash("error", "User not found.");
        } else if (user.role !== "admin") {
            req.flash("error", "User is not an admin.");
        } else {
            user.role = "user";
            await user.save();
            req.flash("success", `${user.email} demoted to user.`);
            console.log("Demotion successful:", user.email);
        }
    } catch (err) {
        console.error("Demote Error:", err.message, err);
        req.flash("error", "Failed to demote user.");
    }

    res.redirect("/admin/dashboard?tab=users");
}

module.exports.deleteUser = async (req, res) => {
    try {
        const userId = req.params.id;
        const user = await User.findById(userId);

        if (!user) {
            req.flash("error", "User not found.");
            return res.redirect("/admin/dashboard?tab=users");
        }

        // 1. Find listings owned by the user
        const listings = await Listing.find({ owner: userId });
        const listingIds = listings.map(listing => listing._id);

        // 2. Delete reviews on those listings
        await Review.deleteMany({ listing: { $in: listingIds } });

        // 3. Delete listings
        await Listing.deleteMany({ owner: userId });

        // 4. Delete the user
        await User.findByIdAndDelete(userId);

        req.flash("success", `${user.email} deleted with their listings and reviews.`);
        console.log(`🗑 Deleted user: ${user.email} | Listings: ${listingIds.length}`);
    } catch (err) {
        console.error("Delete User Error:", err.message, err);
        req.flash("error", "Failed to delete user and related data.");
    }

    res.redirect("/admin/dashboard?tab=users");
}

module.exports.deleteListing = async (req, res) => {
    try {
        const listingId = req.params.id;
        await Listing.findByIdAndDelete(listingId);
        await Review.deleteMany({ listing: listingId });

        req.flash("success", "Listing and its reviews deleted.");
        console.log("🗑 Listing deleted:", listingId);
    } catch (err) {
        console.error("Delete Listing Error:", err.message, err);
        req.flash("error", "Failed to delete listing.");
    }

    res.redirect("/admin/dashboard?tab=listings");
}

module.exports.deleteReview = async (req, res) => {
    try {
        await Review.findByIdAndDelete(req.params.id);
        req.flash("success", "Review deleted successfully.");
        console.log("Review deleted:", req.params.id);
    } catch (err) {
        console.error("Delete Review Error:", err.message, err);
        req.flash("error", "Failed to delete review.");
    }

    res.redirect("/admin/dashboard?tab=reviews");
}

module.exports.cancelBooking=async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id);
        const now = new Date();

        if (!booking) {
            req.flash("error", "Booking not found.");
        } else if (
            booking.isCurrentlyBooked &&
            booking.fromDate <= now &&
            booking.toDate >= now
        ) {
            booking.isCurrentlyBooked = false;
            await booking.save();
            req.flash("success", "Booking cancelled successfully.");
        } else {
            req.flash("error", "Only currently active bookings can be cancelled.");
        }

        res.redirect("/admin/dashboard?tab=bookings");
    } catch (err) {
        console.error("Cancel Booking Error:", err);
        req.flash("error", "Something went wrong.");
        res.redirect("/admin/dashboard?tab=bookings");
    }
}
