const Booking = require("../models/booking"); // Import the Booking model
const Listing = require("../models/listing"); // Ensure Listing is also imported
const User = require("../models/user"); // Import User if needed
const Review = require("../models/review"); // Import Review if needed
const mbxGeocoding = require('@mapbox/mapbox-sdk/services/geocoding');
const mapToken = process.env.MAP_TOKEN;
const geocodingClient = mbxGeocoding({ accessToken: mapToken });


module.exports.index = async (req, res) => {
    try {
        const allListings = await Listing.find({});
        res.render("listings/index", { allListings, category: null }); // Pass category as null
    } catch (err) {
        console.error("Error fetching listings:", err);
        req.flash("error", "Failed to load listings.");
        res.redirect("/");
    }
};

module.exports.newForm = (req, res) => {
    res.render("listings/new.ejs");
}

module.exports.showListing = async (req, res) => {
    const { id } = req.params;

    try {
        const listing = await Listing.findById(id)
            .populate({ path: "reviews", populate: { path: "createdBy" } }) // Populate reviews and their authors
            .populate("owner"); // Populate the owner of the listing

        if (!listing) {
            req.flash("error", "Listing not found.");
            return res.redirect("/listings");
        }

        // Fetch bookings for the current listing
        const bookings = await Booking.find({ vehicle: id });

        // Check if the vehicle is currently booked
        const now = new Date();
        const isCurrentlyBooked = bookings.some(booking => {
            return now >= booking.fromDate && now <= booking.toDate;
        });

        res.render("listings/show", { listing, bookings, isCurrentlyBooked });
    } catch (err) {
        console.error("Error fetching listing details:", err);
        req.flash("error", "Failed to load listing details.");
        res.redirect("/listings");
    }
};

module.exports.createListing = async (req, res) => {
    try {
        console.log("Form data received:", req.body.listing); // Debugging: Log the form data

        const geoData = await geocodingClient
            .forwardGeocode({
                query: req.body.listing.location,
                limit: 1,
            })
            .send();

        const newListing = new Listing(req.body.listing);

        newListing.geometry = geoData.body.features[0].geometry;

        if (req.file) {
            newListing.image = {
                url: req.file.path,
                filename: req.file.filename,
            };
        }

        newListing.owner = req.user._id;

        await newListing.save();

        console.log("New listing created:", newListing); // Debugging: Log the new listing

        req.flash("success", "New vehicle listing added successfully!");
        res.redirect(`/listings/${newListing._id}`);
    } catch (err) {
        console.error("Error creating listing:", err); // Debugging: Log the error
        req.flash("error", "Failed to create vehicle listing.");
        res.redirect("/listings/new");
    }
};

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
    try {
        const { id } = req.params;
        const listing = await Listing.findById(id);

        if (!listing) {
            req.flash("error", "Listing not found.");
            return res.redirect("/listings");
        }

        // Update all fields except image
        Object.assign(listing, req.body.listing);

        // ✅ Only update image if a new file is uploaded
        if (req.file) {
            listing.image = {
                url: req.file.path,
                filename: req.file.filename
            };
        }

        await listing.save();
        req.flash("success", "Listing updated successfully!");
        res.redirect(`/listings/${listing._id}`);
    } catch (err) {
        console.error("Error updating listing:", err);
        req.flash("error", "Failed to update listing.");
        res.redirect("/listings");
    }
};


module.exports.deleteListing = async (req, res) => {
    let { id } = req.params;
    let deletedListing = await Listing.findByIdAndDelete(id);
    console.log(deletedListing);
    req.flash("success", "Listing Deleted")
    res.redirect("/listings");
}


module.exports.filterListing = async (req, res) => {
    const { category } = req.query; // Extract the category from the query string
    let filter = {};

    if (category) {
        filter["vtype"] = category; // Ensure this matches your Listing model
    }

    try {
        const allListings = await Listing.find(filter);
        res.render("listings/index", { allListings, category }); // Pass category to the template
    } catch (err) {
        console.error("Error fetching filtered listings:", err);
        req.flash("error", "Failed to load filtered listings.");
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

module.exports.bookVehicle = async (req, res) => {
    const { id } = req.params;
    const { from, to } = req.body;
    const listing = await Listing.findById(id);

    if (!listing) {
        req.flash('error', 'Vehicle not found!');
        return res.redirect('/listings');
    }

    const booking = new Booking({
        vehicle: listing._id,
        bookedBy: req.user._id,
        fromDate: new Date(from),
        toDate: new Date(to)
    });

    await booking.save();
    req.flash('success', 'Vehicle successfully booked!');
    res.redirect(`/listings/${id}`);
};
