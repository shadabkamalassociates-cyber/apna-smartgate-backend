const nodemailer = require("nodemailer");
const dotenv = require('dotenv');

dotenv.config({ path: './.env' });
const generateSmartGateId = (role) => {
    const rolePrefix = {
      secretary: "SEC",
      admin: "ADM",
      user: "USR",
      guard: "GRD",
      vendor: "VND",
    };
  
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let randomPart = "";
  
    for (let i = 0; i < 6; i++) {
      randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
    }
  
    return `${rolePrefix[role] || "USR"}-${randomPart}`;
  };

  /** Returns a Gmail transporter, or null if EMAIL / EMAIL_PASSWORD are not set. */
  const getMailTransporter = () => {
    const user = process.env.EMAIL;
    const pass = process.env.EMAIL_PASSWORD;
    if (!user || !pass) {
      return null;
    }
    return nodemailer.createTransport({
      service: "gmail",
      auth: { user, pass },
    });
  };

  module.exports = { generateSmartGateId, getMailTransporter };