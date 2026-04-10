const express = require('express');
const {
  createSocietyByOwner,
  fetchSocietyByOwner,
  updateSocietyByOwner,
  deleteSocietyById,
  fetchAllSociety,
  societyLogoUpload,
} = require("../controllers/society");
const { authMiddleware } = require('../middlewares/protect');
const societiesRouter = express.Router();

societiesRouter.post(
  "/create",
  authMiddleware,
  societyLogoUpload.single("logo"),
  createSocietyByOwner,
);
societiesRouter.get("/my-society/:id", fetchSocietyByOwner);
societiesRouter.put(
  "/update",
  authMiddleware,
  societyLogoUpload.single("logo"),
  updateSocietyByOwner,
);
societiesRouter.get("/fetch-all", fetchAllSociety);
societiesRouter.delete("/delete/:id", deleteSocietyById);
societiesRouter.get("/fetch-society-by-owner/:ownerId", fetchSocietyByOwner);

module.exports = societiesRouter;