const express = require('express');
const { registerMaid, fetchAllMaids, updateMaid, updateMaidStatus } = require('../controllers/maids.controllers');
const maidRouter = express.Router();

maidRouter.post('/register', registerMaid);
maidRouter.get('/fetch-all', fetchAllMaids);
maidRouter.put('/update/:id', updateMaid);
maidRouter.delete('/delete/:id', deleteMaid);
maidRouter.put('/update-status/:id', updateMaidStatus);

module.exports = maidRouter;