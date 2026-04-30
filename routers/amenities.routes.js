const express = require("express");
const amenitiesRouter = express.Router();
const controller = require("../controllers/amenities.controller");
const { createAmenity, getAllAmenities, getAmenitiesBySociety, updateAmenity, deleteMultipleAmenities } = require("../controllers/amenities.controllers");

amenitiesRouter.post("/create", createAmenity);
amenitiesRouter.get("/fetch-all", getAllAmenities);
amenitiesRouter.get("/fetch-by-society/:society_id", getAmenitiesBySociety);
amenitiesRouter.put("/update/:id", updateAmenity);
amenitiesRouter.post("/delete-multiple", deleteMultipleAmenities);

module.exports = amenitiesRouter;