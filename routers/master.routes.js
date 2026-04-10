const express = require("express");
const { signup, signin } = require("../controllers/common/Authentication");
const {
  
  getAllAdmins,
  updateAdmin,
  deleteAdmin,
  profileImageUpload,
  checkAuth,
} = require("../controllers/admin");
const { authMiddleware } = require("../middlewares/protect");
const { checkAuthentication } = require("../controllers/residents");
const { upload } = require("../controllers/common/multer");
const masterRoutes = express.Router()

masterRoutes.post("/sign-up", upload.single("aadhar_photo"), signup);
masterRoutes.post("/sign-in",signin);
masterRoutes.get("/get-all",getAllAdmins);
masterRoutes.put("/updateAdmin",
  upload.single("profile_image")
  //  profileImageUpload.single("profile_image")
   ,authMiddleware,updateAdmin);
masterRoutes.delete("/delete/:id", deleteAdmin);  
masterRoutes.get("/check-auth", authMiddleware, checkAuth);

// masterRoutes.put("/update", updateAdmin);

module.exports = masterRoutes