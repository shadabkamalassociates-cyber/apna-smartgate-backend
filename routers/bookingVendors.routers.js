const express = require("express");
const { bookVendorService, getVendorBookings, getResidentBookings, fetchAllBookings, createPaymentOrder } = require("../controllers/bookingVendors.controllers");
// const { RemoteConfigFetchResponse } = require("firebase-admin/remote-config");
const bookingVendorsRouter = express.Router();

bookingVendorsRouter.post("/booking-service", bookVendorService);
bookingVendorsRouter.post("/create-payment", createPaymentOrder);
bookingVendorsRouter.post("/create-payment-order", createPaymentOrder);
bookingVendorsRouter.get("/fetch-residents-bookings/:id",getResidentBookings)
bookingVendorsRouter.get("/fetch-vendors-bookings/:id",getVendorBookings)
bookingVendorsRouter.get("/fetch-all",fetchAllBookings)

module.exports = bookingVendorsRouter;