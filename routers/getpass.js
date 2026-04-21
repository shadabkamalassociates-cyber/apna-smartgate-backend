const express = require("express");
const {  allowGetpass, denyGetpass, sendResidenceAlert, getpassApproval, updateFcm } = require("../controllers/feature/getpass");
const alertRouter= express.Router()


alertRouter.post("/send-notification", sene.dResidenceAlert);
alertRouter.put("/approve-gatepass", getpassApproval);
alertRouter.put("/update-fcm",updateFcm);
// alertRouter.put("/deny-gatepass",denyGetpass);
module.exports = alertRouter