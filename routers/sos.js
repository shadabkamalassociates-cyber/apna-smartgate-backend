const express = require('express');
const {
  createSOS,
  updateSOS,
  deleteSOS,
  getSOSBySociety,
  getSOSByUser,
  getSOSByStatus,
  fetchAll,
} = require("../controllers/sos");
const { authMiddleware } = require('../middlewares/protect');
const sosRouter = express.Router();

sosRouter.post("/create", createSOS);
sosRouter.get("/fetch-all",fetchAll);
sosRouter.put("/update/:id", updateSOS);
sosRouter.delete("/delete/:id", deleteSOS);
sosRouter.get("/fetch-by-society/:society_id", getSOSBySociety);
sosRouter.get("/fetch-by-user/:id", getSOSByUser);
sosRouter.get("/status/:status", getSOSByStatus);

module.exports = sosRouter