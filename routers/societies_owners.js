const express = require("express");
const societiesOwnerRouters = express.Router();

const { deleteOwner, getAllOwners } = require("../controllers/societies_owners");

module.exports = societiesOwnerRouters;
