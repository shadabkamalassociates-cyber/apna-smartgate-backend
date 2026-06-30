const { initializeApp, cert, getApps } = require("firebase-admin/app");
const { getMessaging } = require("firebase-admin/messaging");

const serviceAccount = require("./kamal-associate-firebase-adminsdk-fbsvc-066349f56b.json");

if (getApps().length === 0) {
  initializeApp({
    credential: cert(serviceAccount),
  });
}

module.exports = getMessaging();