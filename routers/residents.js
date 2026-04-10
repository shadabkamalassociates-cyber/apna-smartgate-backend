const express = require('express');
const { protect } = require('../middlewares/protect');

const {
  validation,
  residentLogin,
  deleteResidentById,
  getAllusers,
  usersOnboard,
  updateresident,
  fetchByFlatId,
  residentProfileUpload,
} = require("../controllers/residents");

const { checkAuthentication } = require('../controllers/guards');
const { fetchBySociety } = require('../controllers/notice');
const { upload } = require('../controllers/common/multer');

const residentsRouter = express.Router()

residentsRouter.post(
  "/signUp",
  upload.single("profile_image"),
  // residentProfileUpload.single("profile_image"),
  usersOnboard,
);

residentsRouter.post("/validation", validation)

residentsRouter.post("/login", residentLogin);
    
residentsRouter.get("/fetch",  getAllusers);

residentsRouter.get("/checkAuth",checkAuthentication)

residentsRouter.delete("/delete/:id",  deleteResidentById);

residentsRouter.put(
  "/update/:id",
  upload.single("profile_image"),
  // residentProfileUpload.single("profile_image"),
  updateresident,
);

residentsRouter.put("/fetch_by_flat/:flat_id", fetchByFlatId)

residentsRouter.get("/fetch-by-society/:society_id", fetchBySociety);

module.exports = residentsRouter


