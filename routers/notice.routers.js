const express = require('express');
const { createNotice, updateNotice, deleteNotice, fetchBySociety, fetchByCreatedBy } = require('../controllers/notice');
const noticeRouter = express.Router();


noticeRouter.post('/create', createNotice);
noticeRouter.put('/update/:id',updateNotice);
noticeRouter.delete('/delete/:id', deleteNotice);
noticeRouter.get('/fetch-by-society/:society_id', fetchBySociety);
noticeRouter.get('/fetch-by-created-by/:created_by', fetchByCreatedBy);

module.exports = noticeRouter;