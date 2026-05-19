const { client } = require("../config/client");
const { getIO } = require("./common/socket");

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

const getInboxMessages = async (req, res) => {
  try {

    const { resident_id, vendor_id } = req.body;

    console.log(resident_id, vendor_id);

    // RESIDENT CHAT
    if (resident_id && !vendor_id) {

      const messages = await client.query(
        `
        SELECT 
            c.id,
            c.resident_id,
            c.vendor_id,
          
            v.business_name as vendor_business_name,
            v.name as vendor_name,
            v.profile_image as vendor_profile_image
    
        FROM chats c
        LEFT JOIN vendors v 
        ON c.vendor_id = v.id
    
        WHERE c.resident_id = $1
    
        ORDER BY c.created_at DESC
        `,
        [resident_id]
      );
    
      return res.status(200).json({
        success: true,
        count: messages.rows.length,
        data: messages.rows
      });
    
    }
    //   SELECT 
    //   chats.*,
    //   users.name as resident_name,
    //   users.profile_image as resident_profile_image

    // FROM chats

    // JOIN users 
    //   ON chats.resident_id = users.id

    // WHERE chats.resident_id = $1

    // ORDER BY chats.created_at ASC
    // VENDOR CHAT
    if (vendor_id && !resident_id) {

      const messages = await client.query(
        `
        SELECT 
          chats.*,
    
      
          users.name as resident_name,
          users.profile_image as resident_profile_image,
          users.society_id
    
        FROM chats
  
        JOIN users
          ON chats.resident_id = users.id
    
        WHERE chats.vendor_id = $1
    
        ORDER BY chats.created_at ASC
        `,
        [vendor_id]
      );
    
      return res.status(200).json({
        success: true,
        count: messages.rows.length,
        data: messages.rows
      });
    
    }

    // INVALID REQUEST
    return res.status(400).json({
      success: false,
      message: "Provide either resident_id or vendor_id"
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

    const io = getIO();
    // emit realtime event
    io.to(chatId).emit("messagesSeen", {
      chatId,
    });



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
  getInboxMessages,
  getMessages,
  seenMessages
};