const express = require("express");
const { deleteBlock, updateBlock, createBlock, fetchBlocksBySociety } = require("../controllers/blocks.controllers");
const blockRouter = express.Router();

blockRouter.post("/create", createBlock);
blockRouter.put("/update/:id", updateBlock);
blockRouter.delete("/delete/:id", deleteBlock);
blockRouter.get("/fetch-blocks-by-society/:id", fetchBlocksBySociety);

module.exports = blockRouter;
