const { client } = require("../config/client");
const bcrypt = require("bcrypt");
const path = require("path");

const signup = async (req, res) => {
  try {
    const role = "super_admin"
    console.log(req.user)
    const { name, email, phone, password, address_line1, address_line2, gender } =
      req.body || {};
    const { id } = req.user

    console.log(req.body,"++++++++++++++++++++++++")

    const aadharFile = req.files?.aadhar_photo?.[0] || null;
    const aadhar_photo = aadharFile
      ? path.posix.join("uploads", aadharFile.filename)
      : null;

    if (!name || !email || !phone || !password) {
      return res.status(400).json({
        message: "name, email, phone, password are required",
      });
    }

    const existingUser = await client.query(
      "SELECT * FROM admins WHERE email = $1",
      [email],
    );
    const existingPhone = await client.query(
      "SELECT * FROM admins WHERE phone = $1",
      [phone],
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({ message: "Email already registered" });
    }

    if (existingPhone.rows.length > 0) {
      return res.status(400).json({ message: "Phone number already registered!" });
    }

    const hashedPassword = await bcrypt.hash(password, 2);

    const newUser = await client.query(
      `INSERT INTO admins 
       (name, email, phone, password, role, created_by, aadhar_photo, address_line1, address_line2, gender)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING id, name, email`,
      [
        name,
        email,
        phone,
        hashedPassword,
        role,
        id,
        aadhar_photo,
        address_line1 ?? null,
        address_line2 ?? null,
        gender ?? null,
      ],
    );

    res.status(201).json({
      message: "Signup successful",
      user: newUser.rows[0],
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

const getAllSuperAdmins = async (req, res) => {
  try {
    const { id } = req.user;
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const offset = (page - 1) * limit;
    const countResult = await client.query(
      "SELECT COUNT(*) FROM admins WHERE role = 'super_admin' AND created_by = $1",
      [id],
    );
    const totalCount = parseInt(countResult.rows[0].count, 10);

    const secretaries = await client.query(
      "SELECT * FROM admins WHERE role = 'super_admin' AND created_by = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3",
      [id, limit, offset],
    );

    res.status(200).json({
      message: "Super Admins fetched successfully",
      secretaries: secretaries.rows,
      totalCount,
      page,
      limit,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};  


module.exports = { getAllSuperAdmins,signup }