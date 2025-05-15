const express = require("express");
const router = express.Router();
const { isAdminOrSuperadmin } = require("../middleware.js");
const User = require("../models/user");
const Listing = require("../models/listing");
const Booking = require("../models/booking");
const Review = require("../models/review");
const adminController = require("../controllers/admin");

// Admin Dashboard
router.get("/dashboard", isAdminOrSuperadmin,adminController.dashboard);

// Promote User to Admin
router.put("/users/:id/promote", isAdminOrSuperadmin,adminController.promoteUser); 

// Demote Admin to User
router.put("/users/:id/demote", isAdminOrSuperadmin,adminController.demoteUser); 

// Delete User + Listings + Listing Reviews
router.delete("/users/:id", isAdminOrSuperadmin, adminController.deleteUser);

router.post("/bookings/:id/cancel", isAdminOrSuperadmin, adminController.cancelBooking);
// Delete Listing
router.delete("/listings/:id", isAdminOrSuperadmin,adminController.deleteListing );

// Delete Review
router.delete("/reviews/:id", isAdminOrSuperadmin,adminController.deleteReview );

module.exports = router;
