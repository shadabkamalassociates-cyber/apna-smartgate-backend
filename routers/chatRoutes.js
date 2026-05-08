const express = require("express");

const chatRoutes = express.Router();

const {
  createOrGetChat,
  sendMessage,
  getMessages,
  seenMessages
} = require("../controllers/chatController");

chatRoutes.post("/create", createOrGetChat);

chatRoutes.post("/send", sendMessage);

chatRoutes.get("/messages/:chatId", getMessages);

chatRoutes.put("/seen/:chatId", seenMessages);

module.exports = chatRoutes;