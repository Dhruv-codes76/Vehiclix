const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync");
const { isLoggedIn, isAuthorised } = require("../middleware");
const multer = require("multer");
const { storage } = require("../cloudConfig");
const upload = multer({ storage });
const listingController = require("../controllers/listings");


router.get("/new", isLoggedIn, listingController.newForm);


router.get("/filter", wrapAsync(listingController.filterListing));
router.get("/search", wrapAsync(listingController.searchListings));


router.route("/")
  .get(wrapAsync(listingController.index))
  .post(
    isLoggedIn,
    upload.single('listing[image]'), // Ensure this matches form field name
    wrapAsync(listingController.createListing) // Removed validateListing temporarily
  );


router.route("/:id")
  .get(wrapAsync(listingController.showListing))
  .put(
    isLoggedIn,
    isAuthorised,
    upload.single('listing[image]'),
    wrapAsync(listingController.updateListing))
  .delete(
    isLoggedIn,
    isAuthorised,
    wrapAsync(listingController.deleteListing));


router.post("/:id/book", isLoggedIn, wrapAsync(listingController.bookVehicle));
router.get("/:id/edit", isLoggedIn, isAuthorised, wrapAsync(listingController.editForm));

module.exports = router;
