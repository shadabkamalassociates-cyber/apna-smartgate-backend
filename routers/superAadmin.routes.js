const express = require("express");
const { signin } = require("../controllers/common/Authentication");
const {  updateAdmin, profileImageUpload } = require("../controllers/admin");
const { authMiddleware } = require("../middlewares/protect");
const { signup, getAllSuperAdmins } = require("../controllers/superAdmin");
const { upload } = require("../controllers/common/multer");

const superAdminRouter = express.Router();

superAdminRouter.post("/sign-in", signin);
superAdminRouter.get("/fetch-all", authMiddleware, getAllSuperAdmins);
// Accept JSON or multipart/form-data (supports optional files)
superAdminRouter.post(
  "/register",
  authMiddleware,
  upload.fields([
    { name: "aadhar_photo", maxCount: 1 }
  ]),
  signup,
);
// superAdminRouter.put("/update",  profileImageUpload.single("profile_image"), updateAdmin);

module.exports = superAdminRouter;
