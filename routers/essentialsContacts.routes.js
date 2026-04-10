const express = require("express")
const { createBySociety, fetchAllEssentialContacts, fetchEssentialContactsBySociety, deleteEssentialContactById } = require("../controllers/EssentialContacts");
const { upload } = require("../controllers/common/multer");
const essentialContactRouter = express.Router()

essentialContactRouter.post(
  "/create-by-society/:society_id",
  upload.single("profile_image"),
  createBySociety,
);
essentialContactRouter.get("/fetch-all", fetchAllEssentialContacts);
essentialContactRouter.get("/fetch-by-society/:society_id",fetchEssentialContactsBySociety);
essentialContactRouter.delete("/delete/:id", deleteEssentialContactById);
module.exports = essentialContactRouter;



