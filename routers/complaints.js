const express = require("express");
const complaintsRouter = express.Router();

const { createComplaint, updateComplaint, getComplaintsByRaisedId, deleteComplaintById, getComplaintsBySocietyId, fetchAllComplaints } = require("../controllers/complaints");
const { authMiddleware } = require("../middlewares/protect");
const { upload } = require("../controllers/common/multer");

complaintsRouter.post("/create", upload.single("attachment_url"), createComplaint);
complaintsRouter.get("/fetch-all",  fetchAllComplaints);
complaintsRouter.put("/status-update/:id", updateComplaint);
complaintsRouter.get("/raised-by/:raised_by",getComplaintsByRaisedId); 
complaintsRouter.get("/fetch-by-society/:id", getComplaintsBySocietyId);
complaintsRouter.delete("/delete/:id",deleteComplaintById);
// complaintsRouter.get("/fetch-by-id/:id",getComplaintById);
module.exports = complaintsRouter;