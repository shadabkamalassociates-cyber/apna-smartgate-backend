const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { generateToken } = require("./generateToken");
const { client } = require("../../config/client");
const axios = require("axios");
const path = require("path");

const { getMailTransporter } = require("./uniqueId");



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
    const { mobileNumber, password } = req.body;
    console.log(mobileNumber, password)
    if (!mobileNumber || !password) {
      return res.status(400).json({
        message: "Phone and password are required.",
      });
    }

    // Search by phone OR phone2
    const userResult = await client.query(
      `
      SELECT *
      FROM admins
      WHERE phone = $1 OR phone2 = $1
      LIMIT 1
      `,
      [mobileNumber]
    );

    console.log(userResult.rows)

    if (userResult.rows.length === 0) {
      return res.status(400).json({
        message: "Invalid phone number or password.",
      });
    }

    const admin = userResult.rows[0];

    // Check verification
    if (!admin.verification_status === 'pending') {
      return res.status(400).json({
        message:
          "Your account is pending. Please wait for verification.",
      });
    }
    if (!admin.verification_status === 'rejected') {
      return res.status(400).json({
        message:
          "Your account is Suspended. Please contact the administrator.",
      });
    }
    // Optional: Check if admin is active
    if (admin.verification_status === 'approved') {
      return res.status(403).json({
        message: "Your account has been deactivated.",
      });
    }

    // Optional: Check if admin is banned
    if (admin.is_banned === true) {
      return res.status(403).json({
        message: "Your account has been banned.",
      });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, admin.password);

    if (!isMatch) {
      return res.status(400).json({
        message: "Invalid phone number or password.",
      });
    }

    // Generate JWT
    const token = generateToken({
      id: admin.id,
      role: admin.role,
      email: admin.email,
    });

    const sameSite = process.env.COOKIE_SAMESITE || "lax";
    const isProd = process.env.NODE_ENV === "production";

    const secureEnv = String(process.env.COOKIE_SECURE || "").toLowerCase();
    const secure =
      secureEnv === "true"
        ? true
        : secureEnv === "false"
        ? false
        : isProd;

    // Set Cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure,
      sameSite,
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    });

    // Remove password before sending response
    const { password: hashedPassword, ...adminData } = admin;

    return res.status(200).json({
      success: true,
      message: "Login successful.",
      token,
      user: adminData,
    });
  } catch (error) {
    console.error("Signin Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error.",
    });
  }
};



const otpSenderForAdmin = async (req, res)=>{
    try {
        const { mobileNumber } = req.body;

        const checkInAdmin = await client.query(
          `SELECT * FROM admins WHERE phone = $1 OR phone2 = $1`,
          [mobileNumber]
        )
         
        if(checkInAdmin.rows.length === 0){
          return res.status(400).json({ message: "Admin not found" });
        }
        const otp = Math.floor(100000 + Math.random() * 900000);
        const whatsappUrl = `https://webhooks.wappblaster.com/webhook/67722d68ea04d946eaf743ac?number=91${mobileNumber}&otp=${otp}`;
        await axios.post(whatsappUrl);
        const salt = await bcrypt.genSalt(10);
        const hashOTP = await bcrypt.hash(String(otp), salt);

        res.status(200).json({ message: "OTP sent successfully", hashOTP });

    } catch (error) {
        console.log(error)
        res.status(500).json({ message: "Internal server error" });
    }
}



const otpSenderForResident = async (req, res)=>{
  try {
    const { mobileNumber } = req.body;

    const checkInResident = await client.query(
      `SELECT * FROM users WHERE phone = $1`,
      [mobileNumber]
    )
     
    if(checkInResident.rows.length === 0){
      return res.status(400).json({ message: "User not found" });
    }
    const otp = Math.floor(100000 + Math.random() * 900000);
    const whatsappUrl = `https://webhooks.wappblaster.com/webhook/67722d68ea04d946eaf743ac?number=91${mobileNumber}&otp=${otp}`;
    await axios.post(whatsappUrl);
    const salt = await bcrypt.genSalt(10);
    const hashOTP = await bcrypt.hash(String(otp), salt);

    res.status(200).json({ message: "OTP sent successfully", hashOTP });

} catch (error) {
    console.log(error)
    res.status(500).json({ message: "Internal server error" });
}
}

const signUpOtpSender = async (req, res)=>{
  try {
    const { mobileNumber } = req.body;

    const checkInResident = await client.query(
      `SELECT * FROM users WHERE phone = $1`,
      [mobileNumber]
    )
     
    if(checkInResident.rows.length !== 0){
      return res.status(400).json({ message: "Phone number already exist!" });
    }
    const otp = Math.floor(100000 + Math.random() * 900000);
    const whatsappUrl = `https://webhooks.wappblaster.com/webhook/67722d68ea04d946eaf743ac?number=91${mobileNumber}&otp=${otp}`;
    await axios.post(whatsappUrl);
    const salt = await bcrypt.genSalt(10);
    const hashOTP = await bcrypt.hash(String(otp), salt);

    res.status(200).json({ message: "OTP sent successfully", hashOTP });

} catch (error) {
    console.log(error)
    res.status(500).json({ message: "Internal server error" });
}
}

const otpCheck = async (req, res)=>{
  try {
    const { hashOTP, otp, phone } = req.body;
  
    const checkInResident = await client.query(
      `SELECT * FROM users WHERE phone = $1`,
      [phone]
    );
  
    // Bypass for testing number
    if (phone === "9289444951" || Number(phone) === 9289444951) {
      if (checkInResident.rows.length === 0) {
        return res.status(200).json({
          message: "OTP verified successfully",
        });
      }
  
      const data = checkInResident.rows[0];
  
      const token = generateToken({
        id: data.id,
        role: "resident",
      });
  
      return res.status(200).json({
        message: "OTP verified successfully",
        token,
        data,
      });
    }
  
    // Verify OTP for all other numbers
    const matchOTP = await bcrypt.compare(otp, hashOTP);
  
    if (!matchOTP) {
      return res.status(400).json({
        message: "Invalid OTP!",
      });
    }
  
    if (checkInResident.rows.length === 0) {
      return res.status(200).json({
        message: "OTP verified successfully",
      });
    }
  
    const data = checkInResident.rows[0];
  
    const token = generateToken({
      id: data.id,
      role: "resident",
    });
  
    return res.status(200).json({
      message: "OTP verified successfully",
      token,
      data,
    });
  
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
}

const passwordReset = async (req, res) => {
  try {
    const { email} = req.body;

    const user = await client.query(
      "SELECT * FROM users WHERE email = $1",
      [email],
    );
    console.log(user.rows[0])
    // if (user.rows.length === 0) {
    //   return res.status(400).json({ message: "User not found" });
    // }

    const mail = getMailTransporter();
    // if (!mail) {
    //   return res.status(503).json({
    //     message:
    //       "Password reset email is not available: set EMAIL and EMAIL_PASSWORD (e.g. Gmail App Password) in the server environment.",
    //   });
    // }

    const token = generateToken({
      id: user.rows[0].id,
      role: user.rows[0].role,
    });

    await client.query(
      "UPDATE users SET reset_token = $1, reset_token_expiry = $2 WHERE id = $3",
      [token, new Date(Date.now() + 5 * 60 * 1000), user.rows[0].id],
    );

    const link = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;

    await mail.sendMail({
      from: process.env.EMAIL,
      to: email,
      subject: "Password Reset",
      text: `Click the link to reset your password: ${link}`,
    });


    res.status(200).json({ message: "Password reset successful"});

  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal server error" });
  }
}
module.exports = { signUpOtpSender , signin, signup, otpSenderForAdmin, passwordReset, otpSenderForResident, otpCheck };
