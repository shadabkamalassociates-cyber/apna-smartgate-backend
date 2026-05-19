const router = require("express").Router();

const {
  generateInvoice,
  getResidentInvoices,
  payInvoice
} = require("./billing.controller");

router.post("/generate", generateInvoice);

router.get("/resident/:residentId", getResidentInvoices);

router.post("/pay/:invoiceId", payInvoice);

module.exports = router;