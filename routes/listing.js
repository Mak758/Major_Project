const express = require("express");
const router = express.Router();
const wrapAsync = require('../utils/wrapAsync.js');
const {isLoggedIn, isOwner, validateListing} = require("../middleware.js");

const listingController = require("../controllers/listings.js");
const multer  = require('multer');
const {storage} = require("../cloudConfig.js");

const allowedMimeTypes = [
    "image/png",
    "image/jpeg",
    "image/webp",
    "image/avif",
    "image/gif",
    "image/bmp",
    "image/tiff"
];

const upload = multer({
    storage,
    fileFilter: (req, file, cb) => {
        if (allowedMimeTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error("Only supported image files are allowed!"));
        }
    }
});

const handleUpload = (getRedirectPath) => {
  return (req, res, next) => {
    upload.single("listing[image]")(req, res, (err) => {
      if (err) {
        req.flash("error", err.message);

        const redirectPath =
        typeof getRedirectPath === "function"
          ? getRedirectPath(req)
          : getRedirectPath;

        return req.session.save(() => {
        res.redirect(redirectPath);
    });
      }
      next();
      });
    };
};

router
.route("/")
.get(wrapAsync(listingController.index))
.post(
  isLoggedIn,
  handleUpload("/listings/new"),
  validateListing,
  wrapAsync(listingController.createListing)
);


//New Route to display a form for creating a new listing
router.get("/new", isLoggedIn, listingController.renderNewForm);


router
.route("/:id")
.get( 
  wrapAsync(listingController.showListing)
)
.put(
  isLoggedIn, 
  isOwner,
  handleUpload(req => `/listings/${req.params.id}/edit`),
  validateListing,
  wrapAsync(listingController.updateListing)
)
.delete(
  isLoggedIn,
  isOwner,
  wrapAsync(listingController.deleteListing)
);


//Edit Route to display a form for editing a listing
router.get(
  "/:id/edit", 
  isLoggedIn,
  isOwner,
  wrapAsync(listingController.renderEditForm)
);


module.exports = router;