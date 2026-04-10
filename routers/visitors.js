const express = require("express");
const { visitorsValidation, getAllVisitors, getVisitorById, createVisitor, updateVisitor, deleteVisitor, getVisitorsByResident, fetchVisitorsBySociety, reEnteryVisitor } = require("../controllers/visitors");
const { protect, guardProtect } = require("../middlewares/protect");
const visitorsRouter = express.Router()

visitorsRouter.get("/validation",visitorsValidation);
visitorsRouter.get("/fetch", getAllVisitors);
visitorsRouter.get("/fetch-by-society/:societyId", fetchVisitorsBySociety);
visitorsRouter.get("/fetch/:id", getVisitorById);
visitorsRouter.post("/create", createVisitor);
visitorsRouter.post("/re-entry", reEnteryVisitor);
visitorsRouter.put("/update", updateVisitor);
visitorsRouter.delete("/delete/:id", deleteVisitor);
visitorsRouter.get("/get/:resident_id", getVisitorsByResident);

module.exports = {visitorsRouter}