const Booking = require("../models/booking");
const mongoose = require("mongoose");
const Listing = require("../models/listing");
const User = require("../models/user");
const Review = require("../models/review");
const mbxGeocoding = require("@mapbox/mapbox-sdk/services/geocoding");
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
    res.render("listings/new");
};

module.exports.showListing = async (req, res) => {
    const { id } = req.params;

    // Validate the ID format
    if (!mongoose.Types.ObjectId.isValid(id)) {
        req.flash("error", "Invalid vehicle ID.");
        return res.redirect("/listings");
    }

    const listing = await Listing.findById(id)
        .populate("owner")
        .populate({
            path: "reviews",
            populate: { path: "createdBy" }
        });

    if (!listing) {
        req.flash("error", "Listing not found.");
        return res.redirect("/listings");
    }

    // Fetch bookings for the vehicle
const bookings = await Booking.find({ vehicle: id })
    .populate("bookedBy")
    .sort({ createdAt: -1 });  // Sort descending by fromDate (latest first)

    // ✅ Update this logic:
    const today = new Date();
    const isCurrentlyBooked = bookings.some(
        booking => booking.isCurrentlyBooked && booking.fromDate <= today && booking.toDate >= today
    );

    res.render("listings/show", { listing, bookings, isCurrentlyBooked });
};


module.exports.createListing = async (req, res) => {
    try {
        console.log("Request Body:", req.body); // Debugging log
        console.log("Uploaded File:", req.file); // Debugging log

        const geoData = await geocodingClient.forwardGeocode({
            query: req.body.listing.city,
            limit: 1,
        }).send();

        console.log("GeoData:", geoData.body.features); // Debugging log

        if (!geoData.body.features.length) {
            req.flash("error", "Invalid city. Please provide a valid city name.");
            return res.redirect("/listings/new");
        }

        const { 
            vname, vtype, vfuel, vpower, cost, 
            location, city, state, vlimit, plimit, vinfo 
        } = req.body.listing;

        const newListing = new Listing({
            vname, vtype, vfuel, vpower, cost,
            location, city, state, vlimit, plimit, vinfo,
            owner: req.user._id,
            geometry: geoData.body.features[0].geometry,
            image: {
                url: req.file.path,
                filename: req.file.filename,
            },
        });

        await newListing.save();
        console.log("New Listing Saved:", newListing); // Debugging log

        req.flash("success", "Vehicle added successfully!");
        res.redirect(`/listings/${newListing._id}`);
    } catch (err) {
        console.error("CREATE LISTING ERROR:", err);
        req.flash("error", "Failed to create vehicle listing.");
        res.redirect("/listings/new");
    }
};


module.exports.editForm = async (req, res) => {
    const { id } = req.params;
    const listing = await Listing.findById(id);

    if (!listing) {
        req.flash("error", "Listing not found.");
        return res.redirect("/listings");
    }

    res.render("listings/edit", { listing });
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

        // Handle new image upload
        if (req.file) {
            if (listing.image && listing.image.filename) {
                await cloudinary.uploader.destroy(listing.image.filename);
            }
            listing.image = {
                url: req.file.path,
                filename: req.file.filename,
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
    const { id } = req.params;

    // Delete associated bookings
    await Booking.deleteMany({ vehicle: id });

    // Delete the listing
    const deletedListing = await Listing.findByIdAndDelete(id);

    if (!deletedListing) {
        req.flash("error", "Listing not found.");
        return res.redirect("/listings");
    }

    req.flash("success", "Listing and associated bookings deleted.");
    res.redirect("/listings");
};

module.exports.filterListing = async (req, res) => {
    const { category, city } = req.query;

    try {
        let filter = {};
        if (category) filter.vtype = category;
        if (city) filter.city = { $regex: city, $options: "i" };

        const allListings = await Listing.find(filter);
        res.render("listings/index", {
            allListings,
            category: category || null,
            city: city || null,
        });
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
        res.render("listings/index.ejs", {
            allListings,
            category: null,
            city: query,
        });
    } catch (err) {
        console.error("Error fetching search results:", err);
        req.flash("error", "Error fetching search results.");
        res.redirect("/listings");
    }
};

module.exports.bookVehicle = async (req, res) => {
    const { id } = req.params;
    const { from, to } = req.body;

    const fromDate = new Date(from);
    const toDate = new Date(to);

    if (fromDate >= toDate) {
        req.flash("error", "Invalid dates - 'From' date must be before 'To' date.");
        return res.redirect(`/listings/${id}`);
    }

    const existingBookings = await Booking.find({
        vehicle: id,
        isCurrentlyBooked: true,
        fromDate: { $lte: toDate },
        toDate: { $gte: fromDate }
    });

    if (existingBookings.length > 0) {
        req.flash("error", "Vehicle is already booked for selected dates.");
        return res.redirect(`/listings/${id}`);
    }

    const booking = new Booking({
        vehicle: id,
        bookedBy: req.user._id,
        fromDate,
        toDate,
        isCurrentlyBooked: true
    });

    await booking.save();
    req.flash("success", "Vehicle booked successfully!");
    res.redirect(`/listings/${id}`);
};

module.exports.userCancelBooking = async (req, res) => {
    const bookingId = req.params.id;
    const userId = req.user._id;

    try {
        const booking = await Booking.findById(bookingId);

        if (!booking) {
            req.flash("error", "Booking not found.");
            return res.redirect("back");
        }

        if (!booking.bookedBy.equals(userId)) {
            req.flash("error", "You are not authorized to cancel this booking.");
            return res.redirect("back");
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0); // Normalize to start of day
        
        const lastBookingDay = new Date(booking.toDate);
        lastBookingDay.setHours(0, 0, 0, 0);

        if (today > lastBookingDay) {
            req.flash("error", "You can only cancel before or on the last day of booking.");
            return res.redirect("back");
        }

        booking.isCurrentlyBooked = false;
        await booking.save();

        req.flash("success", "Booking cancelled successfully.");
        res.redirect("back");
    } catch (err) {
        console.error("User Cancel Booking Error:", err);
        req.flash("error", "Failed to cancel booking.");
        res.redirect("back");
    }
};