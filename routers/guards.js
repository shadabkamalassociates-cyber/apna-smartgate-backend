const express = require("express");
const { guardSignup, guardLogin, getAllGuards, deleteGuardByUuid, validation, checkAuthentication, signupGuard, signinGuard, fetchGuardsBySociety, updateGaurd, guardProfileUpload } = require("../controllers/guards");
const { guardProtect, authMiddleware } = require("../middlewares/protect");
const { signup, signin } = require("../controllers/common/Authentication");
const { upload } = require("../controllers/common/multer");

const routerGuards = express.Router();
    
routerGuards.post(
  "/signup",
  upload.single("profile_image"),
  // guardProfileUpload.single("profile_image"),
  signupGuard,
);
routerGuards.post(
  "/update/:uuid",
  upload.single("profile_image"),
  // guardProfileUpload.single("profile_image"),
  updateGaurd,
);
routerGuards.post("/login", signinGuard);
routerGuards.get("/fetch",authMiddleware, getAllGuards);
routerGuards.get("/validation", validation);
routerGuards.delete("/delete/:uuid", authMiddleware, deleteGuardByUuid);
routerGuards.get("/authenticate",  checkAuthentication);
routerGuards.get("/fetch-by-society/:society_id", fetchGuardsBySociety);
module.exports = routerGuards;
