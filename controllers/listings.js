const Listing = require("../models/listing");
const mbxGeocoding = require('@mapbox/mapbox-sdk/services/geocoding');
const mapToken = process.env.MAP_TOKEN;
const geocodingClient = mbxGeocoding({ accessToken: mapToken });


module.exports.index = async (req, res) => {
    const allListings = await Listing.find({});
    res.render("listings/index.ejs", { allListings });
  }

  module.exports.newForm = (req, res) => {
    res.render("listings/new.ejs");
  }

  module.exports.showListing = async (req, res) => {
    let { id } = req.params;
    const listing = await Listing.findById(id)
    .populate({path:"reviews",populate:{path:"createdBy"}})
    .populate("owner");
    //console.log(listing.image.url)
    if(!listing){
      req.flash("error","Listing you requested for does not exist")
      res.redirect("/listings")
    }
    console.log(listing); 
    res.render("listings/show.ejs", { listing });
  }

  module.exports.createListing = async (req, res,next) => {
    let response = await geocodingClient.forwardGeocode({
      query: req.body.listing.city,
      limit: 1,
    })
      .send()


    let url = req.file.path;
    let filename = req.file.filename;
    const newListing = new Listing(req.body.listing);
    newListing.owner=req.user._id;

    newListing.geometry = response.body.features[0].geometry;
    newListing.image = {url, filename};
    let savedListing = await newListing.save();
    console.log(savedListing);
    req.flash("success", "New Listing Created")
    res.redirect("/listings");
  }

  module.exports.editForm = async (req, res) => {
    let { id } = req.params;
    const listing = await Listing.findById(id);
    console.log(listing.image.url)
    if(!listing){
      req.flash("error","Listing you requested for does not exist")
      res.redirect("/listings")
    }

    let originalImageUrl = listing.image.url;
    originalImageUrl = originalImageUrl.replace("upload", "upload/w_250");
    res.render("listings/edit.ejs", { listing, originalImageUrl });
  }

  module.exports.updateListing = async (req, res) => {
    let { id } = req.params;
    let listing = await Listing.findByIdAndUpdate(id, { ...req.body.listing });

    if(typeof req.file !== "undefined"){
      let url = req.file.path;
      let filename = req.file.filename;
      listing.image = { url, filename };
      await listing.save();
    }
    req.flash("success", "Listing Updated");
    res.redirect(`/listings/${id}`);
  }

  module.exports.deleteListing = async (req, res) => {
    let { id } = req.params;
    let deletedListing = await Listing.findByIdAndDelete(id);
    console.log(deletedListing);
    req.flash("success", "Listing Deleted")
    res.redirect("/listings");
  }


  module.exports.filterListing = async (req, res) => {
    let { category } = req.query;
    let filter = {};
  
    // Filter by category
    if (category) {
      filter["category"] = category; // Ensure this matches your `Listing` model
    }
  
    try {
      const allListings = await Listing.find(filter);
      // console.log(filter);
      // console.log(allListings);
      res.render("listings/index.ejs", { allListings });
    } catch (err) {
      console.error(err);
      req.flash("error", "Error fetching filtered listings");
      res.redirect("/listings");
    }
  };

  module.exports.searchListings = async (req, res) => {
    const { query } = req.query; // Get the search query from the request
    let filter = {};
  
    if (query) {
      filter["city"] = { $regex: query, $options: "i" }; // Case-insensitive search
    }
  
    try {
      const allListings = await Listing.find(filter);
      res.render("listings/index.ejs", { allListings });
    } catch (err) {
      console.error(err);
      req.flash("error", "Error fetching search results");
      res.redirect("/listings");
    }
  };