const express = require("express");
const router = express.Router();
const Listing = require("../models/listing"); // Ensure Listing is also imported
const Booking = require("../models/booking"); // Import the Booking model
const User = require("../models/user"); // Import User if needed
const Review = require("../models/review"); // Import Review if needed
const wrapAsync=require("../utils/wrapAsync.js");
const { isLoggedIn, isAuthorised, validateListing }=require("../middleware.js");
const multer = require("multer");
const { storage } = require("../cloudConfig.js");
const upload = multer({ storage});

const listingController = require("../controllers/listings.js");  


// Search Route
router.get("/search", listingController.searchListings);

//Filters
router.get("/filter", wrapAsync(listingController.filterListing));

 //New Route
router.get("/new",isLoggedIn, listingController.newForm);
  

router
  .route("/")
  //Index Route
  .get( wrapAsync(listingController.index))
  
  .post(
    isLoggedIn, 
    upload.single('listing[image]'),
    validateListing,
    wrapAsync(listingController.createListing)
  );
  
 
router
  .route("/:id")
  //Show Route or Read Operation
  .get( wrapAsync(listingController.showListing))
  //Update Route
  .put(
    isLoggedIn,
    isAuthorised,
    upload.single('listing[image]'),
    validateListing, 
    wrapAsync(listingController.updateListing))
  //Delete Route
  .delete(
    isLoggedIn,
    isAuthorised,
    wrapAsync(listingController.deleteListing));
  

//Edit Route
router.get("/:id/edit",isLoggedIn, wrapAsync(listingController.editForm));

//Booking
router.post("/:id/bookings", isLoggedIn, listingController.bookVehicle);
 
module.exports=router;