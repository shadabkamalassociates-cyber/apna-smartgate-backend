const express = require("express");
const { upload } = require("../controllers/common/multer");
const {  createVendorService, updateVendorService, deleteVendorService,getServices, getServicesByVendor, getApprovedServices, getServiceById, getServicesByVendorAll, getServicesByCategory, getVendorsByCategory } = require("../controllers/vendors_services.controllers");
// const { createVendorService, updateVendorService, deleteVendorService, getServicesByVendor, getApprovedServices, getServiceById, updateServiceStatus } = require("./vendors_services.routers");
const vendorsServicesRouter = express.Router();

vendorsServicesRouter.post("/create", upload.array("images", 10), createVendorService);
vendorsServicesRouter.put("/update/:id", updateVendorService);
vendorsServicesRouter.delete("/delete/:id", deleteVendorService);
vendorsServicesRouter.get("/fetch-by-vendor-approved/:vendor_id", getServicesByVendor);
vendorsServicesRouter.get("/fetch-by-vendor-all/:vendor_id", getServicesByVendorAll);
vendorsServicesRouter.put("/approved/:id", getApprovedServices);
vendorsServicesRouter.get("/fetch-by-id/:id", getServiceById);
vendorsServicesRouter.get("/fetch-all", getServices);
vendorsServicesRouter.get("/fetch-by-category/:category", getServicesByCategory);
vendorsServicesRouter.get("/fetch-vendors-by-category/:category", getVendorsByCategory);

module.exports = vendorsServicesRouter;