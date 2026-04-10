const express = require("express");
const { postFetchByUser, createPostByUser, createPost, createPostByResident, createPostByOwner, getPostsByResident, getPostsByOwner, deletePostById, postLikeByResident, fetchLikes, updatePost, postImagesUpload } = require("../controllers/post");
const { fetchAll } = require("../controllers/sos");
const { upload } = require("../controllers/common/multer");
const postRouter = express.Router()

postRouter.get("/fetch-by-resident/:id", getPostsByResident);
postRouter.get("/fetch-by-owner/:id", getPostsByOwner)
postRouter.get("/fetch-all", fetchAll)
postRouter.get("/update-post/:id", updatePost)
postRouter.post("/create-postByRes/:id",
    //  postImagesUpload.array("images", 10),
    upload.array("images", 10),
    createPostByResident);
postRouter.post("/create-post/:id",
    //  postImagesUpload.array("images", 10),
    upload.array("images", 10),
    createPostByOwner);
postRouter.delete("/delete/:id", deletePostById);
postRouter.get("/check-like/:id", fetchLikes)
postRouter.post("/like-by-resident/:residentId", postLikeByResident);
module.exports = { postRouter }               