const billingRouter = require("express").Router();

const { createChargeHead } = require("../controllers/chargeHead.controllers");
const { generateMonthlyInvoices, getResidentInvoices, getInvoiceById, fetchAllInvoices } = require("../controllers/invoices.countrellers");
const { getResidentLedger, fetchAllLedgers } = require("../controllers/ledger.controllers");
const { sendDueReminders } = require("../controllers/reminderController");
const { getCollectionReport } = require("../controllers/reportc.ontroller");


billingRouter.post("/generate-monthly-invoices", generateMonthlyInvoices);
billingRouter.post("/create-charge-head", createChargeHead);
billingRouter.get("/get-resident-invoices/:residentId", getResidentInvoices);
billingRouter.get("/get-invoice-by-id/:invoiceId", getInvoiceById);
billingRouter.get("/get-ledger/:residentId", getResidentLedger);
billingRouter.post("/send-due-reminders", sendDueReminders);
billingRouter.get("/get-collection-report/:societyId", getCollectionReport);
billingRouter.get("/fetch-all-invoices", fetchAllInvoices);
billingRouter.get("/fetch-all-ledgers", fetchAllLedgers);
// billingRouter.post("/pay/:invoiceId", payInvoice);

module.exports = billingRouter;