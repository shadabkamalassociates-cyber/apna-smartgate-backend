const express = require('express');
const { otpSender } = require('../controllers/common/Authentication');
// const { otpSender } = require('../controllers/common/otpSender');
const authRouter = express.Router();
// const { otpSender } = require('../controllers/common/otpSender');

authRouter.post('/otp-sender', otpSender);

module.exports = authRouter;