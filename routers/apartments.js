const express = require("express");
const apartmentRouter = express.Router();
const { createApartment, updateApartment, deleteApartment, getApartments } = require("../controllers/apartnment");

apartmentRouter.post("/create", createApartment);
apartmentRouter.put("/update/:id", updateApartment);
apartmentRouter.delete("/delete/:id", deleteApartment);
apartmentRouter.get("/fetch", getApartments);

module.exports = apartmentRouter;    
 