const express = require("express");
const { signin } = require("../controllers/common/Authentication");
const { authMiddleware } = require("../middlewares/protect");
const { updateSecretary, deleteSecretary, getAllSecretaries, getSecretariesBySociety, signup, updateStatusSecretary, secretaryProfileUpload } = require("../controllers/secretory");
const { upload } = require("../controllers/common/multer");
const adminRouter = express.Router();

adminRouter.post("/sign-in",signin)

adminRouter.post(
  "/sign-up",
  authMiddleware,
  upload.fields([
    { name: "profile_image", maxCount: 1 },
    { name: "aadhar_photo", maxCount: 1 },
  ]),

  // secretaryProfileUpload.single("profile_image"),  
  signup,
);

adminRouter.put(
  "/update/:id",
  authMiddleware,
  upload.single("profile_image"),
  // secretaryProfileUpload.single("profile_image"),
  updateSecretary,
);
adminRouter.put("/update-status/:id", authMiddleware, updateStatusSecretary);
adminRouter.delete("/delete/:id", authMiddleware, deleteSecretary);
adminRouter.get("/fetch-all", authMiddleware, getAllSecretaries);
// adminRouter.put("/update-secretory", profileImageUpload.single("profile_image"), updateAdmin);
adminRouter.get("/get-secretory-by-society/:societyId",getSecretariesBySociety)

module.exports = adminRouter;
