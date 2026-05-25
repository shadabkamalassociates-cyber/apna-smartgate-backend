const express = require('express');
const { otpSenderForAdmin, passwordReset, otpSenderForResident, otpCheck } = require('../controllers/common/Authentication');
// const { otpSender } = require('../controllers/common/otpSender');
const authRouter = express.Router();
// const { otpSender } = require('../controllers/common/otpSender');

authRouter.post('/otp-sender', otpSenderForAdmin);
authRouter.post('/otp-sender-resident', otpSenderForResident);
authRouter.post('/otp-check', otpCheck);
authRouter.post('/password-reset', passwordReset);
module.exports = authRouter;