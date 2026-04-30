const { client } = require("../config/client");

const registerMaid = async (req, res) => {
  try {
    const {
      society_id,
      name,
      phone,
      aadhaar_number,
      address,
      photo
    } = req.body;

    // 🔴 Basic validation
    if (!society_id || !name || !phone) {
      return res.status(400).json({
        success: false,
        message: "society_id, name and phone are required"
      });
    }

    // 🔴 Check if maid already exists (by phone)
    const existingMaid = await client.query(
      `SELECT id FROM maids WHERE phone = $1`,
      [phone]
    );

    if (existingMaid.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: "Maid already registered with this phone"
      });
    }

    // ✅ Insert maid
    const newMaid = await client.query(
      `INSERT INTO maids 
      (society_id, name, phone, aadhaar_number, address, photo)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *`,
      [society_id, name, phone, aadhaar_number, address, photo]
    );

    return res.status(201).json({
      success: true,
      message: "Maid registered successfully",
      data: newMaid.rows[0]
    });

  } catch (error) {
    console.error("Register Maid Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

const fetchAllMaids = async (req, res) => {
  try {
    const maids = await client.query("SELECT * FROM maids ORDER BY created_at DESC");
    return res.status(200).json({
      success: true,
      data: maids.rows
    });
  } catch (error) {
    console.error("Fetch All Maids Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

const deleteMaid = async (req, res) => {
    try {
      const { id } = req.params;
      if (!id) {
        return res.status(400).json({
          success: false,
          message: "id is required",
        });
      }
      const result = await client.query(
        `DELETE FROM maids WHERE id = $1 RETURNING *`,
        [id]
      );
  
      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Maid not found"
        });
      }
  
      return res.status(200).json({
        success: true,
        message: "Maid deleted successfully"
      });
  
    } catch (error) {
      console.error("Delete Maid Error:", error);
  
      return res.status(500).json({
        success: false,
        message: "Internal server error"
      });
    }
};

const updateMaid = async (req, res) => {
    try {
      const { id } = req.params;
      const {
        name,
        phone,
        aadhaar_number,
        address,
        photo,
        is_verified
      } = req.body;
  
      // 🔴 Check if maid exists
      const maidCheck = await client.query(
        `SELECT * FROM maids WHERE id = $1`,
        [id]
      );
  
      if (maidCheck.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Maid not found"
        });
      }
  
      // 🔴 If phone is being updated → check duplicate
      if (phone) {
        const existingPhone = await client.query(
          `SELECT id FROM maids WHERE phone = $1 AND id != $2`,
          [phone, id]
        );
  
        if (existingPhone.rows.length > 0) {
          return res.status(409).json({
            success: false,
            message: "Phone already in use"
          });
        }
      }
  
      // ✅ Update query (COALESCE keeps old value if not provided)
      const updatedMaid = await client.query(
        `UPDATE maids SET
          name = COALESCE($1, name),
          phone = COALESCE($2, phone),
          aadhaar_number = COALESCE($3, aadhaar_number),
          address = COALESCE($4, address),
          photo = COALESCE($5, photo),
          is_verified = COALESCE($6, is_verified),
          updated_at = NOW()
        WHERE id = $7
        RETURNING *`,
        [name, phone, aadhaar_number, address, photo, is_verified, id]
      );
  
      return res.status(200).json({
        success: true,
        message: "Maid updated successfully",
        data: updatedMaid.rows[0]
      });
  
    } catch (error) {
      console.error("Update Maid Error:", error);
  
      return res.status(500).json({
        success: false,
        message: "Internal server error"
      });
    }
};

const updateMaidStatus = async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
  
      const allowedStatus = ['pending', 'verified', 'blocked'];
  
      // 🔴 Validate status
      if (!status || !allowedStatus.includes(status)) {
        return res.status(400).json({
          success: false,
          message: "Invalid status value"
        });
      }
  
      // 🔴 Check maid exists
      const maidCheck = await pool.query(
        `SELECT id FROM maids WHERE id = $1`,
        [id]
      );
  
      if (maidCheck.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Maid not found"
        });
      }
  
      // ✅ Update status
      const updated = await pool.query(
        `UPDATE maids
         SET status = $1, updated_at = NOW()
         WHERE id = $2
         RETURNING id, name, phone, status`,
        [status, id]
      );
  
      return res.status(200).json({
        success: true,
        message: "Maid status updated successfully",
        data: updated.rows[0]
      });
  
    } catch (error) {
      console.error("Status Update Error:", error);
  
      return res.status(500).json({
        success: false,
        message: "Internal server error"
      });
    }
  };
  

module.exports = {
    registerMaid,
    fetchAllMaids,
    updateMaid,
    deleteMaid,
    updateMaidStatus
};