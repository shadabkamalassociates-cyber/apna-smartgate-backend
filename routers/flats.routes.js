const express = require("express");
const { createFlat, updateFlat, deleteFlat, fetchFlatByBlocks, filterHierarchy } = require("../controllers/flat.controller");
const flatRouter = express.Router();

flatRouter.post("/create", createFlat);
flatRouter.put("/udpate/:id", updateFlat);
flatRouter.delete("/delete/:id",deleteFlat);
flatRouter.get("/fetch-by-block/:id", fetchFlatByBlocks);
flatRouter.get("/filter",filterHierarchy)
module.exports = flatRouter;
