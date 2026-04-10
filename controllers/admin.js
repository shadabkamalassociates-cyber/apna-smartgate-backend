const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
// const { generateToken } = require("../utils/jwt");
const { client } = require("../config/client");
const {generateToken} = require("./common/generateToken");
const path = require("path");
const fs = require("fs");
const multer = require("multer");

const ADMIN_PROFILE_IMAGES_DIR = path.join(
  __dirname,
  "..",
  "uploads",
  "admin-profile-images"
);

// Multer upload for admin profile images.
// Accepts ONLY WebP images; stores the file on disk and lets the controller
// decide whether to persist the DB value.


const profileImageUpload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      try {
        fs.mkdirSync(ADMIN_PROFILE_IMAGES_DIR, { recursive: true });
        cb(null, ADMIN_PROFILE_IMAGES_DIR);
      } catch (e) {
        cb(e);
      }
    },
    filename: (req, file, cb) => {
      const userId = req.user?.id || "unknown";
      const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      cb(null, `admin-${userId}-${unique}.webp`);
    },
  }),
  limits: {
    // Adjust if you want to allow bigger images.
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter: (req, file, cb) => {
    const isWebpMime = file?.mimetype === "image/webp";
    const isWebpExt = path.extname(file?.originalname || "").toLowerCase() === ".webp";

    // Only accept WebP (reject jpg/png/pdf/anything else).
    if (!isWebpMime || !isWebpExt) {
      req.fileValidationError = "profile_image must be a .webp image";
      return cb(null, false);
    }
    cb(null, true);
  },
});

const getAllAdmins = async (req, res) => {
  try {
    // if (
    //   req.user.role === "super_admin" &&
    //   req.user.role === "admin" &&
    //   req.user.role === "guard"
    // ) {
    //   res.status(404).json({ message: "Unauthorized person!" });
    // }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const offset = (page - 1) * limit;

    const totalResult = await client.query("SELECT COUNT(*) FROM admins");

    const admins = await client.query(
      `SELECT * FROM admins
       ORDER BY created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset],
    );

    res.json({
      total: parseInt(totalResult.rows[0].count),
      page,
      limit,
      totalPages: Math.ceil(totalResult.rows[0].count / limit),
      data: admins.rows,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

const updateAdmin = async (req, res) => {
  try {
    const userId = req.user?.id;
    console.log(req.user, "++++++++++++++++++++++");

    if (req.fileValidationError) {
      return res.status(400).json({ message: req.fileValidationError });
    }

    const { name, email, phone } = req.body;

    const updates = [];
    const values = [];

    // Dynamically build query
    if (name !== undefined) {
      values.push(name);
      updates.push(`name = $${values.length}`);
    }

    if (email !== undefined) {
      values.push(email);
      updates.push(`email = $${values.length}`);
    }

    if (phone !== undefined) {
      values.push(phone);
      updates.push(`phone = $${values.length}`);
    }

    // Handle file upload
    if (req.file) {
      const storedProfileImagePath = path.posix.join(
        "uploads",
        "admin-profile-images",
        req.file.filename
      );
      values.push(storedProfileImagePath);
      updates.push(`profile_image = $${values.length}`);
    }

    // Always update timestamp
    updates.push(`updated_at = CURRENT_TIMESTAMP`);

    // ❗ Prevent empty update
    if (updates.length === 1) {
      return res.status(400).json({ message: "No fields to update" });
    }

    values.push(userId);

    const result = await client.query(
      `UPDATE admins
       SET ${updates.join(", ")}
       WHERE id = $${values.length}
       RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Admin not found" });
    }

    res.json({
      message: "Admin updated successfully",
      data: result.rows[0],
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};
const deleteAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    
    if(id === "d00483d9-5230-4944-9983-853189ddb598"){
      res.status(404).json({message:"Master admin cannot delete!"})
    }

    const result = await client.query(
      "DELETE FROM admins WHERE id = $1 RETURNING *",
      [id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Admin not found" });
    }

    res.json({
      message: "Admin deleted successfully",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
}; 

const checkAuth = async (req, res) => {
  try {
    const userId = req.user?.id;

    console.log(userId,"++++++++++++++++++++++");
    
    if(!userId){
      return res.status(401).json({ message: "You are logout!" });
    }
    const data = await client.query("SELECT * FROM admins WHERE id = $1", [userId]);
    res.status(200).json({ message: "Authentication successful", user: data.rows[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

const updateMaster = async (req, res) => {

  try {
    // console.log(req.user)                                                                                                                
    const { name, email, phone } = req.body;
    const userId = req.user.id;

    const userResult = await client.query("SELECT * FROM admins WHERE id = $1", [
      userId,
    ]);

    if (!userResult.rows.length) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

   
    const updatedUser = await client.query(
      `UPDATE admins
       SET name = $1,
           email = $2,
           phone = $3,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $4
       RETURNING id, name, email, phone, role`,
      [name, email, phone, userId],
    );

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: updatedUser.rows[0],
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Server error!",
    });
  }
};

// Expose upload middleware so routes can attach it:
//   profileImageUpload.single("profile_image")
module.exports = {
  deleteAdmin,
  updateAdmin,
  getAllAdmins,
  checkAuth,
  updateMaster,
  profileImageUpload,
};