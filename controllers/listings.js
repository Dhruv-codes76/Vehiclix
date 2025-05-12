// Updated listing.js controller
const Booking = require("../models/booking");
const Listing = require("../models/listing");
const User = require("../models/user");
const Review = require("../models/review");
const mbxGeocoding = require('@mapbox/mapbox-sdk/services/geocoding');
const mapToken = process.env.MAP_TOKEN;
const geocodingClient = mbxGeocoding({ accessToken: mapToken });

module.exports.index = async (req, res) => {
    try {
        const allListings = await Listing.find({});
        res.render("listings/index", { allListings, category: null, city: null });
    } catch (err) {
        console.error("Error fetching listings:", err);
        req.flash("error", "Failed to load listings.");
        res.redirect("/");
    }
};

module.exports.newForm = (req, res) => {
    res.render("listings/new.ejs");
};

module.exports.showListing = async (req, res) => {
    const { id } = req.params;

    try {
        const listing = await Listing.findById(id)
            .populate({ path: "reviews", populate: { path: "createdBy" } })
            .populate("owner");

        if (!listing) {
            req.flash("error", "Listing not found.");
            return res.redirect("/listings");
        }

        const isCurrentlyBooked = req.isCurrentlyBooked;
        const bookings = req.bookings;

        res.render("listings/show", { listing, bookings, isCurrentlyBooked });
    } catch (err) {
        console.error("Error fetching listing details:", err);
        req.flash("error", "Failed to load listing details.");
        res.redirect("/listings");
    }
};

module.exports.createListing = async (req, res) => {
    try {
        const geoData = await geocodingClient.forwardGeocode({
            query: req.body.listing.location,
            limit: 1
        }).send();

        const newListing = new Listing(req.body.listing);
        newListing.geometry = geoData.body.features[0].geometry;
        newListing.image = req.files.map(f => ({ url: f.path, filename: f.filename }));
        newListing.owner = req.user._id;

        await newListing.save();

        req.flash("success", "New vehicle listing added successfully!");
        res.redirect(`/listings/${newListing._id}`);
    } catch (err) {
        console.error("Error creating listing:", err);
        req.flash("error", "Failed to create vehicle listing.");
        res.redirect("/listings/new");
    }
};

module.exports.editForm = async (req, res) => {
    let { id } = req.params;
    const listing = await Listing.findById(id);

    if (!listing) {
        req.flash("error", "Listing you requested for does not exist");
        return res.redirect("/listings");
    }

    res.render("listings/edit.ejs", { listing });
};

module.exports.updateListing = async (req, res) => {
    try {
        const { id } = req.params;
        const listing = await Listing.findById(id);

        if (!listing) {
            req.flash("error", "Listing not found.");
            return res.redirect("/listings");
        }

        Object.assign(listing, req.body.listing);

        const newImages = req.files.map(f => ({ url: f.path, filename: f.filename }));
        listing.image.push(...newImages);

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
    req.flash("success", "Listing Deleted");
    res.redirect("/listings");
};

module.exports.filterListing = async (req, res) => {
    const { category, city } = req.query;

    try {
        let filter = {};

        if (category) {
            filter.vtype = category;
        }

        if (city) {
            filter.city = { $regex: city, $options: "i" };
        }

        const allListings = await Listing.find(filter);
        res.render("listings/index", { allListings, category: category || null, city: city || null });
    } catch (err) {
        console.error("Error fetching filtered listings:", err);
        req.flash("error", "Failed to load filtered listings.");
        res.redirect("/listings");
    }
};

module.exports.searchListings = async (req, res) => {
    const { query } = req.query;
    let filter = {};

    if (query) {
        filter["city"] = { $regex: query, $options: "i" };
    }

    try {
        const allListings = await Listing.find(filter);
        res.render("listings/index.ejs", { allListings, category: null, city: query });
    } catch (err) {
        console.error("Error fetching search results:", err);
        req.flash("error", "Error fetching search results.");
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
