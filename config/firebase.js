const admin = require("firebase-admin");
const  serviceAccount = require("./kamal-associate-firebase-adminsdk-fbsvc-066349f56b.json")

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

module.exports = admin;
