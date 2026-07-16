const { client } = require("../../config/client");
const messaging = require("../../config/firebase");
const sendVoipPush = require("../../utils/sendVoipPush");

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

      console.log("++++++++++++++++++++++++++++++++",result.rows)
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

      // console.log("++++++++++++++++++++++++++++++++",tokens)
      // const messaging = admin.messaging();

      // await messaging.sendEachForMulticast({
      //   tokens: tokens,
      //   notification: {
      //     title: "Visitor Entry Request",
      //     body: `${visitor.name} is waiting at the gate`,
      //   },
      //   data: {
      //     visitorId: String(visitor.id),
      //     actionType: "VISITOR_ENTRY",
      //     flatId: String(id),
      //   },
      //   android: {
      //     priority: "high",
      //   },
      // });

    //  await messaging.sendEachForMulticast({
    //     tokens: uniqueTokens,
    //     notification: {
    //       title: "Visitor Entry Request",
    //       body: `${visitor.rows[0].name} is waiting at the gate`,
    //     },
    //     data: {
    //       visitorId: String(visitorId),
    //       actionType: "VISITOR_ENTRY",
    //       flatId: String(id),
    //     },
    //     android: {
    //       priority: "high",
    //     },
    //     apns: {
    //       headers: {
    //         "apns-priority": "10",
    //       },
    //       payload: {
    //         aps: {
    //           sound: "alert.mp3",
    //           badge: 1,
    //         },
    //       },
    //     },
    //   });
    // await messaging.sendEachForMulticast({
    //   tokens: uniqueTokens,
    
    //   notification: {
    //     title: "Visitor Entry Request",
    //     body: `${visitor.rows[0].name} is waiting at the gate`,
    //   },
    
    //   data: {
    //     visitorId: String(visitorId),
    //     actionType: "VISITOR_ENTRY",
    //     flatId: String(id),
    //   },
    
    //   android: {
    //     priority: "high",
    //     notification: {
    //       channelId: "visitor_alert_channel", // 🔥 REQUIRED
    //       sound: "mygate.mp3", // 🔥 no .mp3
    //       priority: "high",
    //     },
    //   },
    
    //   apns: {
    //     headers: {
    //       "apns-priority": "10",
    //     },
    //     payload: {
    //       aps: {
    //         alert: {
    //           title: "Visitor Entry Request",
    //           body: `${visitor.rows[0].name} is waiting at the gate`,
    //         },
    //         sound: "mygate.mp3",
    //         badge: 1,
    //         contentAvailable: true,
    //       },
    //     },
    //   },
    // });

    await messaging.sendEachForMulticast({
      tokens: uniqueTokens,
    
      // No top-level notification
      data: {
        title: "Visitor Entry Request",
        body: `${visitor.rows[0].name} is waiting at the gate`,
        visitorId: String(visitorId),
        actionType: "VISITOR_ENTRY",
        flatId: String(id),
      },
    
      android: {
        priority: "high",
      },
    
      apns: {
        headers: {
          "apns-priority": "10",
        },
        payload: {
          aps: {
            alert: {
              title: "Visitor Entry Request",
              body: `${visitor.rows[0].name} is waiting at the gate`,
            },
            sound: "alert.mp3", // or "mygate.mp3" if that's the bundled sound
            badge: 1,
            contentAvailable: true,
          },
        },
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

// const sendResidenceAlert = async (req, res) => {
//   try {
//     console.log("========== sendResidenceAlert ==========");
//     console.log("Request Body:", req.body);

//     const { id, visitorId } = req.body;

//     if (!id || !visitorId) {
//       return res.status(400).json({
//         success: false,
//         message: "id and visitorId are required",
//       });
//     }

//     console.log("Fetching resident VoIP token...");

//     const userResult = await client.query(
//       `SELECT id, name, voip_token
//        FROM users
//        WHERE flat_id = $1`,
//       [id]
//     );

//     console.log("User Query Result:", userResult.rows);

//     if (!userResult.rows.length) {
//       return res.status(404).json({
//         success: false,
//         message: "No resident found for this flat",
//       });
//     }

//     const resident = userResult.rows[0];

//     console.log("Resident:", resident);

//     if (!resident.voip_token) {
//       return res.status(400).json({
//         success: false,
//         message: "Resident does not have a VoIP token",
//       });
//     }

//     console.log("Fetching visitor...");

//     const visitorResult = await client.query(
//       `SELECT id, name, phone
//        FROM visitors
//        WHERE id = $1`,
//       [visitorId]
//     );

//     console.log("Visitor Query Result:", visitorResult.rows);

//     if (!visitorResult.rows.length) {
//       return res.status(404).json({
//         success: false,
//         message: "Visitor not found",
//       });
//     }

//     const visitor = visitorResult.rows[0];

//     console.log("Visitor:", visitor);

//     console.log("Sending VoIP Push...");
//     console.log({
//       voipToken: resident.voip_token,
//       callerName: visitor.name,
//       phoneNumber: visitor.phone,
//     });

//     const response = await sendVoipPush(
//       resident.voip_token,
//       visitor.name,
//       visitor.phone
//     );

//     console.log("APNs Response:");
//     console.dir(response, { depth: null });

//     return res.status(200).json({
//       success: true,
//       message: "Notification sent successfully",
//       response,
//     });
//   } catch (error) {
//     console.error("========== ERROR ==========");
//     console.error(error);
//     console.error(error.stack);

//     return res.status(500).json({
//       success: false,
//       message: error.message,
//     });
//   }
// };


// const sendResidenceAlert = async (req, res) => {
//   try {
//     const { id, visitorId } = req.body;


//       const result = await client.query(
//       `SELECT voip_token FROM users WHERE flat_id = $1`,
//       [id],
//     );

//     if (!result.rows.length) {
//       return res.status(404).json({ message: "Flat not found!" });
//     }


//      const visitor = await client.query(
//       `SELECT id, name FROM visitors WHERE id = $1`,
//       [visitorId],
//     );


//      if (!visitor.rows.length) {
//       return res.status(404).json({ message: "Visitor not found" });
//     }


//     console.log(data,"+++++++++++++++++++++++++++++++++++");

//     const data = await sendVoipPush(visitor.id,visitor.name, visitor.phone_number);
//     res.json({ success: true, message: "Notification sent successfully" });
//   } catch (error) {
//     res.status(500).json({ message: "Server error!", success: false });
//   }
// }


const getpassApproval = async (req, res) => {
  try {
    const { status, id } = req.body;
    console.log(req.body,"+++++++++++++++++++++++++++++++++++");
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