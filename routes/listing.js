const express = require("express");
const router = express.Router();
const Listing = require("../models/listing"); // Ensure Listing is also imported
const Booking = require("../models/booking"); // Import the Booking model
const User = require("../models/user"); // Import User if needed
const Review = require("../models/review"); // Import Review if needed
const wrapAsync = require("../utils/wrapAsync.js");
const { isLoggedIn, isAuthorised, validateListing } = require("../middleware.js");
const multer = require("multer");
const { storage } = require("../cloudConfig.js");
const upload = multer({ storage });

const listingController = require("../controllers/listings.js");

// Route for filtering listings
router.get("/filter", wrapAsync(listingController.filterListing));

// Route for displaying all listings
router.get("/", wrapAsync(listingController.index));

// Route for displaying a specific listing
router.get("/:id", wrapAsync(listingController.showListing));

// Route for creating a new listing
router.post("/", wrapAsync(listingController.createListing));

// Route for updating a listing
router.put("/:id", wrapAsync(listingController.updateListing));

// Route for deleting a listing
router.delete("/:id", wrapAsync(listingController.deleteListing));

module.exports = router;