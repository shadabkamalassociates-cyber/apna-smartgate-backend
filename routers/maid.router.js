const express = require('express');
const { registerMaid, fetchAllMaids, updateMaid, updateMaidStatus, fetchMaidBySociety } = require('../controllers/maids.controllers');
const maidRouter = express.Router();

maidRouter.post('/register', registerMaid);
maidRouter.get('/fetch-all', fetchAllMaids);
maidRouter.put('/update/:id', updateMaid);
maidRouter.delete('/delete/:id', deleteMaid);
maidRouter.put('/update-status/:id', updateMaidStatus);
maidRouter.get('/fetch-by-society/:society_id', fetchMaidBySociety);
module.exports = maidRouter;