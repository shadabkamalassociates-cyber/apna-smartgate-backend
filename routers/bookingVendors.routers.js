const express = require("express");
const { bookVendorService, getVendorBookings, getResidentBookings, fetchAllBookings } = require("../controllers/bookingVendors.controllers");
// const { RemoteConfigFetchResponse } = require("firebase-admin/remote-config");
const bookingVendorsRouter = express.Router();

// bookingVendorsRouter.post("/booking-service", bookVendorService);
bookingVendorsRouter.get("/fetch-residents-bookings/:id",getResidentBookings)
bookingVendorsRouter.get("/fetch-vendors-bookings/:id",getVendorBookings)
bookingVendorsRouter.get("/fetch-all",fetchAllBookings)

module.exports = bookingVendorsRouter;