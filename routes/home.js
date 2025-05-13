const express = require("express");
const router = express.Router();
const homepageController = require("../controllers/homepage.js");
const wrapAsync = require("../utils/wrapAsync.js");

// Homepage Route
router.get("/", homepageController.homepage);

router.get("/privacy", (req, res) => {
  res.render("homepage/privacy");
});

router.get("/terms", (req, res) => {
    res.render("homepage/terms");
  });

module.exports = router;