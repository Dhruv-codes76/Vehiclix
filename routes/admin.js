const express = require("express");
const router = express.Router();
const { isAdminOrSuperadmin } = require("../middleware");
const User = require("../models/user");
const Listing = require("../models/listing");
const Booking = require("../models/booking");
const Review = require("../models/review");

// Admin Dashboard with reviews included
router.get("/dashboard", isAdminOrSuperadmin, async (req, res) => {
    try {
        const activeTab = req.query.tab || "users";
        const users = await User.find({});
        const listings = await Listing.find({}).populate("owner");
        const bookings = await Booking.find({}).populate("vehicle").populate("bookedBy");
        const reviews = await Review.find({})
            .populate("createdBy")
            .populate("listing"); // Populate the listing field

        // Debugging: Log reviews to check if listing is populated
        console.log("Reviews:", reviews);

        res.render("admin/dashboard", { users, listings, bookings, reviews, activeTab });
    } catch (err) {
        console.error("Error loading dashboard:", err);
        req.flash("error", "Error loading dashboard.");
        res.redirect("/listings");
    }
});

// Promote User
router.put("/users/:id/promote", isAdminOrSuperadmin, async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            req.flash("error", "User not found.");
            return res.redirect("/admin/dashboard?tab=users");
        }
        user.role = "admin";
        await user.save();
        req.flash("success", "User promoted to admin.");
        res.redirect("/admin/dashboard?tab=users");
    } catch (err) {
        req.flash("error", "Something went wrong.");
        res.redirect("/admin/dashboard?tab=users");
    }
});

// Demote User
router.put("/users/:id/demote", isAdminOrSuperadmin, async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            req.flash("error", "User not found.");
            return res.redirect("/admin/dashboard?tab=users");
        }
        user.role = "user";
        await user.save();
        req.flash("success", "Admin demoted to user.");
        res.redirect("/admin/dashboard?tab=users");
    } catch (err) {
        req.flash("error", "Something went wrong.");
        res.redirect("/admin/dashboard?tab=users");
    }
});

// Delete User
router.delete("/users/:id", isAdminOrSuperadmin, async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            req.flash("error", "User not found.");
            return res.redirect("/admin/dashboard?tab=users");
        }

        await Listing.deleteMany({ owner: user._id });
        await User.findByIdAndDelete(req.params.id);

        req.flash("success", "User and their listings deleted successfully.");
        res.redirect("/admin/dashboard?tab=users");
    } catch (err) {
        console.error(err);
        req.flash("error", "Something went wrong.");
        res.redirect("/admin/dashboard?tab=users");
    }
});

// Delete Listing
router.delete('/listings/:id', isAdminOrSuperadmin, async (req, res) => {
    try {
        const listingId = req.params.id;
        await Listing.findByIdAndDelete(listingId);
        await Review.deleteMany({ listing: listingId });

        req.flash('success', 'Listing deleted successfully');
        res.redirect('/admin/dashboard?tab=listings');
    } catch (err) {
        console.error(err);
        req.flash('error', 'Something went wrong');
        res.redirect('/admin/dashboard?tab=listings');
    }
});

// Delete Review
router.delete('/reviews/:id', isAdminOrSuperadmin, async (req, res) => {
    try {
        await Review.findByIdAndDelete(req.params.id);
        req.flash("success", "Review deleted successfully.");
        res.redirect("/admin/dashboard?tab=reviews");
    } catch (err) {
        console.error(err);
        req.flash("error", "Failed to delete review.");
        res.redirect("/admin/dashboard?tab=reviews");
    }
});

module.exports = router;
