const express = require("express");
const { guardSignup, guardLogin, getAllGuards, deleteGuardByUuid, validation, checkAuthentication, signupGuard, signinGuard, fetchGuardsBySociety, updateGaurd, guardProfileUpload } = require("../controllers/guards");
const { guardProtect, authMiddleware } = require("../middlewares/protect");
const { signup, signin } = require("../controllers/common/Authentication");
const { upload } = require("../controllers/common/multer");

const routerGuards = express.Router();

function maybeUploadSingle(fieldName) {
  return (req, res, next) => {
    const ct = req.headers["content-type"] || "";
    if (ct.includes("multipart/form-data")) {
      return upload.single(fieldName)(req, res, next);
    }
    return next();
  };
}
    
routerGuards.post(
  "/signup",
  maybeUploadSingle("profile_image"),
  // guardProfileUpload.single("profile_image"),
  signupGuard,
);
routerGuards.post(
  "/update/:id",
  maybeUploadSingle("profile_image"),
  // guardProfileUpload.single("profile_image"),
  updateGaurd,
);
routerGuards.post("/login", signinGuard);
// routerGuards.put("/update/:id", updateGaurd);
routerGuards.get("/fetch",authMiddleware, getAllGuards);
routerGuards.get("/validation", validation);
routerGuards.delete("/delete/:id", authMiddleware, deleteGuardByUuid);
routerGuards.get("/authenticate",  checkAuthentication);
routerGuards.get("/fetch-by-society/:society_id", fetchGuardsBySociety);
module.exports = routerGuards;
