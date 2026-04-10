const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { generateToken } = require("./generateToken");
const { client } = require("../../config/client");
const path = require("path");
const signup = async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      password,
      role,
      address_line1,
      address_line2,
      gender
    } = req.body;
    console.log(req.body)
    if (!name || !email || !password) {
      return res.status(400).json({ message: "Required fields missing" });
    }

    const normalizedEmail = email.toLowerCase();

    const aadhar_photo = req.file
      ? path.posix.join("uploads", req.file.filename)
      : null;

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await client.query(
      `INSERT INTO admins 
       (name, email, phone, password, role, aadhar_photo, address_line1, address_line2, gender)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING id, name, email, role`,
      [name, normalizedEmail, phone, hashedPassword, role, aadhar_photo, address_line1, address_line2, gender],
    );

    res.status(201).json({
      message: "Signup successful",
      user: newUser.rows[0],
    });

  } catch (error) {
    if (error.code === "23505") {
      return res.status(400).json({ message: "Email already registered" });
    }

    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};
const signin = async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log(email,password)

    const userResult = await client.query(
      "SELECT * FROM admins WHERE email = $1",
      [email],
    );

    if(!userResult.rows[0].is_verified){
      return res.status(400).json({ message: "Your account is not verified, please check your email for verification!" });
    }

    if (userResult.rows.length === 0) {
      return res.status(400).json({ message: "Invalid credentials!" });
    }

    const result = userResult.rows[0];
    
    console.log(result);
    const isMatch = await bcrypt.compare(password, result.password);

    if (!isMatch) {
      return res.status(400).json({ message: "Invalid Password!" });
    }

    const token = generateToken({
      id: result.id,
      role: result.role,
      email: result.email,
    });

  // res.cookie("token", token, {
  //   httpOnly: true,
  //   secure: true,
  //   sameSite: "strict",
  //   maxAge: 30 * 24 * 60 * 60 * 1000, // 1 month
  // });

  const isProduction = process.env.NODE_ENV === "production";

  res.cookie("token", token, {
    httpOnly: true,
    secure: true,                 // 🔥 must be true (HTTPS)
    sameSite: "none",             // 🔥 required for cross-origin
    domain: ".kamalhousing.com",  // 🔥 best choice
    maxAge: 30 * 24 * 60 * 60 * 1000,
  });
    res.status(200).json({
      message: "Login successful",
      token,
      user: result,
    });


  } catch (error) {
    // console.log(error);
    res.status(500).json({ message: "Server error" });
  }
};



module.exports = { signin, signup };
