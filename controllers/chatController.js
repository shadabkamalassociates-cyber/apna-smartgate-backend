const { client } = require("../config/client");

const createOrGetChat = async (req, res) => {

  try {

    const { resident_id, vendor_id } = req.body;

    const existingChat = await client.query(
      `
      SELECT *
      FROM chats
      WHERE resident_id = $1
      AND vendor_id = $2
      `,
      [resident_id, vendor_id]
    );

    if (existingChat.rows.length > 0) {
      return res.status(200).json({
        success: true,
        data: existingChat.rows[0]
      });
    }

    const newChat = await client.query(
      `
      INSERT INTO chats
      (resident_id, vendor_id)
      VALUES ($1, $2)
      RETURNING *
      `,
      [resident_id, vendor_id]
    );

    return res.status(201).json({
      success: true,
      data: newChat.rows[0]
    });

  } catch (error) {

    console.log(error);

    return res.status(500).json({
      success: false,
      message: "Server error"
    });

  }

};


const sendMessage = async (req, res) => {

    try {
  
      const {
        chat_id,
        sender_id,
        message
      } = req.body;
  
      const result = await client.query(
        `
        INSERT INTO messages
        (chat_id, sender_id, message)
        VALUES ($1, $2, $3)
        RETURNING *
        `,
        [chat_id, sender_id, message]
      );
  
      return res.status(201).json({
        success: true,
        data: result.rows[0]
      });
  
    } catch (error) {
  
      console.log(error);
  
      return res.status(500).json({
        success: false,
        message: "Server error"
      });
  
    }
  
  };



  const getMessages = async (req, res) => {

    try {
  
      const { chatId } = req.params;
  
      const messages = await client.query(
        `
        SELECT *
        FROM messages
        WHERE chat_id = $1
        ORDER BY created_at ASC
        `,
        [chatId]
      );
  
      return res.status(200).json({
        success: true,
        data: messages.rows
      });
  
    } catch (error) {
  
      console.log(error);
  
      return res.status(500).json({
        success: false,
        message: "Server error"
      });
  
    }
  
  };


  const seenMessages = async (req, res) => {

    try {
  
      const { chatId } = req.params;
  
      await client.query(
        `
        UPDATE messages
        SET is_seen = true
        WHERE chat_id = $1
        `,
        [chatId]
      );
  
      return res.status(200).json({
        success: true,
        message: "Messages seen"
      });
  
    } catch (error) {
  
      console.log(error);
  
      return res.status(500).json({
        success: false,
        message: "Server error"
      });
  
    }
  
  };


  module.exports = {
    createOrGetChat,
    sendMessage,
    getMessages,
    seenMessages
  };