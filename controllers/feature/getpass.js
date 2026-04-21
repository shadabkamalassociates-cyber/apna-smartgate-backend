const { client } = require("../../config/client");
const admin = require("../../config/firebase");

const sendResidenceAlert = async (req, res) => {
  try {
    const { id, visitorId } = req.body;

    const result = await client.query(
      `SELECT fcm_token FROM users WHERE flat_id = $1`,
      [id],
    );

    if (!result.rows.length) {
      return res.status(404).json({ message: "Flat not found!" });
    }


    const tokens = result.rows
      .map(row => row.fcm_token?.trim())
      .filter(Boolean);

    const uniqueTokens = [...new Set(tokens)];

    if (!uniqueTokens.length) {
      return res.status(400).json({ message: "No valid tokens" });
    }
    const visitor = await client.query(
      `SELECT id, name FROM visitors WHERE id = $1`,
      [visitorId],
    );

    if (!visitor.rows.length) {
      return res.status(404).json({ message: "Visitor not found" });
    }

    console.log("++++++++++++++++++++++++++++++++",tokens)
    const messaging = admin.messaging();

    await messaging.sendEachForMulticast({
      tokens: tokens,
      notification: {
        title: "Visitor Entry Request",
        body: `${visitor.name} is waiting at the gate`,
      },
      data: {
        visitorId: String(visitor.id),
        actionType: "VISITOR_ENTRY",
        flatId: String(id),
      },
      android: {
        priority: "high",
      },
    });

    res.json({
      success: true,
      message: "Notification sent successfully",
    });
  } catch (error) {
    console.error("FCM Error:", error);
    res.status(500).json({ message: "Failed to send notification" });
  }
};

const getpassApproval = async (req, res) => {
  try {
    const { status, id } = req.body;
    const result = await client.query(
      `UPDATE visitor_attendance SET status = $1 WHERE id = $2 RETURNING *`,
      [status, id],
    );

    if (result.rowCount === 0) {
      return res
        .status(404)
        .json({ status: false, message: "Visitor not found!" });
    }

    if (status === "approve") {
      res.json({ success: true, message: "Visitor is allowed for entry." });
    }

    if (status === "unapprove") {
      res.json({ success: true, message: "Visitor is not allowed for entry." });
    }

  } catch (error) {
    res.status(500).json({ message: "Server error!", success: false });
  }
};

const denyGetpass = async (req, res) => {
  try {
    const { status, id } = req.body;
    const result = await client.query(
      `UPDATE visitor_attendance SET status = $1 WHERE id = $2 RETURNING *`,
      [status, id],
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ status: false, message: "Visitor not found!" })
    }


    res.json({ success: true, message: "Visitor is not allowed!" })


  } catch (error) {
    res.status(500).json({ message: "Server error!", success: false })
  }
};

const updateFcm = async (req, res) => {
  try {
    const { id, fcm_token } = req.body;
    const result = await client.query(
      `UPDATE users SET fcm_token = $1 WHERE id = $2 RETURNING *`,
      [fcm_token, id],
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ status: false, message: "User not found!" })
    }
    res.json({ success: true, message: "FCM token updated successfully!" })
  }
  catch (error) {
    res.status(500).json({ message: "Server error!", success: false })
  }
}

// const sendResidenceAlert = async (req, res) => {
//   try {
//     const { id, visitorId } = req.body;

//     const result = await client.query(
//       `SELECT fcm_token FROM users WHERE id = $1`,
//       [id],
//     );

//     if (!result.rows.length) {
//       return res.status(404).json({ message: "Resident not found" });
//     }

//     console.log(result.rows[0].fcm_token)

//     const token = result.rows[0].fcm_token?.trim();

//     if (!token) {
//       return res.status(400).json({ message: "User has no FCM token" });
//     }

//     const visitorResult = await client.query(
//       `SELECT id, name FROM visitors WHERE id = $1`,
//       [visitorId],
//     );

//     if (!visitorResult.rows.length) {
//       return res.status(404).json({ message: "Visitor not found" });
//     }

//     const visitor = visitorResult.rows[0];

//     console.log(token);
//     await admin.messaging().send({
//       token: token,
//       notification: {
//         title: "Visitor Entry Request",
//         body: `${visitor.name} is waiting at the gate`,
//       },
//       data: {
//         visitorId: visitor.id,
//         actionType: "VISITOR_ENTRY",
//       },
//       android: {
//         priority: "high",
//         notification: {
//           sound: "alert.mp3",
//           clickAction: "VISITOR_ACTION",
//         },
//       },
//     });

//     res.json({
//       success: true,
//       message: "Notification sent successfully",
//     });
//   } catch (error) {
//     console.error("FCM Error:", error);
//     res.status(500).json({ message: "Failed to send notification" });
//   }
// };

module.exports = { sendResidenceAlert, getpassApproval, updateFcm };