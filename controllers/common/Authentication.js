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

    if (userResult.rows.length === 0) {
      return res.status(400).json({ message: "Invalid credentials!" });
    }

    const result = userResult.rows[0];

    if (result.is_verified === false) {
      return res.status(400).json({
        message:
          "Your account is not verified, please check your email for verification!",
      });
    }
    
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

  // Cookies are unreliable for cross-site browser requests (e.g. Vite on :5173 calling API on :5001).
  // Prefer `Authorization: Bearer <token>` from the client for those cases.
  // If you truly need cross-site cookies, set COOKIE_SAMESITE=none and serve HTTPS (secure cookies).
  const sameSite = process.env.COOKIE_SAMESITE || "lax";
  const isProd = process.env.NODE_ENV === "production";
  // For local http dev, `Secure` cookies won't be sent to `http://localhost:PORT`.
  // In production behind HTTPS, default `secure: true`.
  // Note: `SameSite=None` requires `Secure=true` in modern browsers — use HTTPS locally if you need that.
  const secureEnv = String(process.env.COOKIE_SECURE || "").toLowerCase();
  const secure =
    secureEnv === "true" ? true : secureEnv === "false" ? false : isProd;

  res.cookie("token", token, {
    httpOnly: true,
    secure,
    sameSite,
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
