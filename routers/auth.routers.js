const express = require('express');
const { otpSender, passwordReset } = require('../controllers/common/Authentication');
// const { otpSender } = require('../controllers/common/otpSender');
const authRouter = express.Router();
// const { otpSender } = require('../controllers/common/otpSender');

authRouter.post('/otp-sender', otpSender);
authRouter.post('/password-reset', passwordReset);
module.exports = authRouter;