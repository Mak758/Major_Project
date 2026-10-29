const Listing = require("../models/listing");
const mbxGeocoding = require('@mapbox/mapbox-sdk/services/geocoding');
const mapToken = process.env.MAP_TOKEN;
const geocodingClient = mbxGeocoding({ accessToken: mapToken });

module.exports.index = async (req, res) => {
const q = typeof req.query.q === "string" ? req.query.q.trim() : "";

let filter = {};

if (q) {
    const escapedQuery = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const searchRegex = new RegExp(escapedQuery, "i");

    filter = {
        $or: [
            { title: searchRegex },
            { location: searchRegex },
            { country: searchRegex }
        ]
    };
}

const allListings = await Listing.find(filter);

res.render("listings/index.ejs", {
    allListings,
    q
});

};

module.exports.renderNewForm = (req, res) => {
  res.render("listings/new.ejs");
};

module.exports.showListing = async (req, res) => {
    const { id } = req.params;
    const listing = await Listing.findById(id)
    .populate({path:"reviews",
      populate: {
        path: "author",
      },
    })
    .populate("owner");
    if(!listing) {
      req.flash("error", "Listing you requested for deos not exist!");
      return res.redirect("/listings")
    }
    res.render("listings/show.ejs", { listing });
};

module.exports.createListing = async (req, res) => {
  if (!req.file) {
    req.flash("error", "Please upload a listing image.");
    return res.redirect("/listings/new");
  }

  const response = await geocodingClient
    .forwardGeocode({
      query: req.body.listing.location,
      limit: 1
    })
    .send();

  const feature = response.body.features?.[0];

  if (!feature) {
    req.flash("error", "Location could not be found. Please check the location and try again.");
    return res.redirect("/listings/new");
  }

  const newListing = new Listing(req.body.listing);

  newListing.owner = req.user._id;
  newListing.image = {
    url: req.file.path,
    filename: req.file.filename
  };
  newListing.geometry = feature.geometry;

  await newListing.save();

  req.flash("success", "New Listing Created!");
  res.redirect("/listings");
};

module.exports.renderEditForm = async(req, res) => {
  const { id } = req.params;
  const listing = await Listing.findById(id);
  if(!listing) {
    req.flash("error", "Listing you requested for deos not exist!");
    return res.redirect("/listings")
  } 
  let originalImageUrl = listing.image.url;
  originalImageUrl = originalImageUrl.replace("/upload", "/upload/w_250");
  res.render("listings/edit.ejs", {listing, originalImageUrl});
};

module.exports.updateListing = async (req, res) => {
  const { id } = req.params;

  const response = await geocodingClient
    .forwardGeocode({
      query: req.body.listing.location,
      limit: 1
    })
    .send();

  const feature = response.body.features?.[0];

  if (!feature) {
    req.flash(
      "error",
      "Location could not be found. Please check the location and try again."
    );
    return res.redirect(`/listings/${id}/edit`);
  }

  const listing = await Listing.findByIdAndUpdate(
    id,
    {
      ...req.body.listing,
      geometry: feature.geometry
    },
    { runValidators: true }
  );

  if (!listing) {
    req.flash("error", "Listing not found!");
    return res.redirect("/listings");
  }

  if (req.file) {
    listing.image = {
      url: req.file.path,
      filename: req.file.filename
    };

    await listing.save();
  }

  req.flash("success", "Listing Updated!");
  res.redirect(`/listings/${id}`);
};

module.exports.deleteListing = async(req, res) => {
    const { id } = req.params;
    let delListing = await Listing.findByIdAndDelete(id);
    req.flash("success", "Listing Deleted!");
    res.redirect("/listings");
};