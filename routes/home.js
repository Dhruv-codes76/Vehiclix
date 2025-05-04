const express = require("express");
const router = express.Router();
const listingController = require("../controllers/listings.js");
const wrapAsync = require("../utils/wrapAsync.js");

// Homepage Route
router.get("/home", wrapAsync(listingController.homepage));

module.exports = router;