const express = require("express");
const { createEvent, getEvents, updateEvent, deleteEvent, getEventsBySociety } = require("../controllers/events.controller");
const eventRouter = express.Router();



eventRouter.post("/create", createEvent);
eventRouter.get("/get", getEvents);
eventRouter.put("/update", updateEvent);
eventRouter.delete("/delete", deleteEvent);
eventRouter.get("/get-by-society", getEventsBySociety);

module.exports = eventRouter;