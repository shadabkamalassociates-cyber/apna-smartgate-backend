const express = require("express");
const vendorsRouter = express.Router();
const { createVendorProfile, getVendorProfiles, getVendorProfileById, verifyVendor, deleteVendorProfile, vendorSignin, vendorProfileImageUpload } = require("../controllers/vendors");
const { upload } = require("../controllers/common/multer");

vendorsRouter.post(
  "/register",
  upload.single("profile_image"),
  createVendorProfile,
);
vendorsRouter.get("/fetch-all", getVendorProfiles);
vendorsRouter.post("/login", vendorSignin);
vendorsRouter.get("/fetch-by-id/:id", getVendorProfileById);
vendorsRouter.put("/status/:id", verifyVendor);
vendorsRouter.delete("/delete/:id", deleteVendorProfile);

module.exports = vendorsRouter;