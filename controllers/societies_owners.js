    const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { client } = require('../config/client');
const SALT_ROUNDS = 10;
const JWT_SECRET = process.env.JWT_SECRET || "supersecretkey";

const deleteOwner = async (req, res) => {
  try {
    const { id } = req.params;

    const deleted = await client.query(
      "DELETE FROM society_owners WHERE id = $1 RETURNING *",
      [id],
    );

    if (deleted.rows.length === 0) {
      return res.status(404).json({ message: "Owner not found" });
    }

    res.status(200).json({
      message: "Owner deleted successfully",
      owner: deleted.rows[0],
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

const getAllOwners = async (req, res) => {  
  try {
    const owners = await client.query(
      `SELECT id, society_id, name, email, phone, profile_photo, created_at 
       FROM society_owners
       ORDER BY created_at DESC`,
    );

    res.status(200).json(owners.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};


module.exports = {deleteOwner, getAllOwners };