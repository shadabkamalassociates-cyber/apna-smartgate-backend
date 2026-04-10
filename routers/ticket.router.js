const express = require('express');
const { createTicket, replyTicket, getTickets, getTicketById, getTicketRepliesByResident, getTicketRepliesByAdmin, ticketImagesUpload } = require('../controllers/tickets');
const { upload } = require('../controllers/common/multer');
const ticketRouter = express.Router();

ticketRouter.post('/create', upload.array("images", 10), createTicket);
ticketRouter.post('/reply/:id', replyTicket);
ticketRouter.get('/fetch-all', getTickets);
ticketRouter.get('/fetch-by-id/:id', getTicketById);
ticketRouter.get('/replies/resident/:id', getTicketRepliesByResident);
ticketRouter.get('/replies/admin/:id', getTicketRepliesByAdmin);
module.exports = ticketRouter;