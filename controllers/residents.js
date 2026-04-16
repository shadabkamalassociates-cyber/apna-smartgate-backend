const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
// const generateToken = require("./common/generateToken");
const { client } = require("../config/client");
const { generateToken } = require("./common/generateToken");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const RESIDENT_PROFILE_IMAGES_DIR = path.join(
  __dirname,
  "..",
  "uploads",
  "resident-profile-images",
);

// Multipart field name: `profile_image` (optional single image).
const residentProfileUpload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      try {
        fs.mkdirSync(RESIDENT_PROFILE_IMAGES_DIR, { recursive: true });
        cb(null, RESIDENT_PROFILE_IMAGES_DIR);
      } catch (e) {
        cb(e);
      }
    },
    filename: (req, file, cb) => {
      const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      const ext = path.extname(file?.originalname || "").toLowerCase();
      cb(null, `resident-${unique}${ext || ".img"}`);
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const isImage = file?.mimetype?.startsWith("image/");
    if (!isImage) {
      req.fileValidationError = "profile_image must be an image file";
      return cb(null, false);
    }
    cb(null, true);
  },
});

const usersOnboard = async (req, res) => {
  try {
    if (req.fileValidationError) {
      return res.status(400).json({
        success: false,
        message: req.fileValidationError,
      });
    }

    const {
      name,
      email,
      password,
      phone_number,
      fcm_tokens,
      society_id,
      flat_id,
    } = req.body;

    const profile_image = req.file
      ? path.posix.join("uploads", req.file.filename)
      : req.body.profile_image ?? null;

    const hashPasword = await bcrypt.hash(password, 3);

    const result = await client.query(
      `INSERT INTO users (name, email, password, phone, fcm_token, society_id, flat_id, profile_image)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id, name, email, phone, fcm_token, society_id, flat_id, profile_image`,
      [
        name,
        email,
        hashPasword,
        phone_number,
        fcm_tokens,
        society_id,
        flat_id,
        profile_image,
      ],
    );

    const residents = result.rows[0];

    const token = generateToken({
      id: residents.id,
      role: "residence",
      email: residents.email,
    });

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.json({
      success: true,
      token: token,
      message: "Resident onboard successfully.",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Server error!",
      success: false,
    });
  }
};

const getAllusers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const countResult = await client.query("SELECT COUNT(*) FROM users");
    const totalRecords = parseInt(countResult.rows[0].count);

    const result = await client.query(
      `SELECT id, name, email, phone, role_id, fcm_token, profile_image
       FROM users
       ORDER BY created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset],
    );

    res.status(200).json({
      success: true,
      message: "Users fetched successfully",
      data: result.rows,
      pagination: {
        totalRecords,
        currentPage: page,
        totalPages: Math.ceil(totalRecords / limit),
        limit,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};


const residentLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    
  const result = await client.query(
    `
    SELECT 
      u.*,

      json_build_object(
        'id', s.id,
        'name', s.name
      ) AS society,

      json_build_object(
        'id', f.id,
        'flat_number', f.flat_number,
        'floor', f.floor
      ) AS flat

    FROM users u
    LEFT JOIN societies s
      ON u.society_id = s.id
    LEFT JOIN flats f
      ON u.flat_id = f.id

    WHERE u.email = $1
    `,
    [email],
  );

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Invalid email!",
      });
    }

    const resident = result.rows[0];

    const isMatch = await bcrypt.compare(password, resident.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid password!",
      });
    }

    const token = generateToken({
      id: resident.id,
  
    });


    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      success: true,
      message: "Login successful",   
      token: token,
      resident
    });

   

  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};




const validation = async (req, res) => {
  try {
    const { email, id_proof_number, password, phone_number } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required!",
      });
    }

    // if (!id_proof_number) {
    //   return res.status(400).json({
    //     success: false,
    //     message: "ID proof is required!",
    //   });
    // }

    if (!password) {
      return res.status(400).json({
        success: false,
        message: "Password is required!",
      });
    }

    if (!phone_number) {
      return res.status(400).json({
        success: false,
        message: "Phone number is required!",
      });
    }

    
    const emailCheck = await client.query(
      `SELECT id FROM users WHERE email = $1 LIMIT 1`,
      [email],
    );

    if (emailCheck.rowCount > 0) {
      return res.status(409).json({
        success: false,
        message: "Email already exists",
      });
    }

    // const idProofCheck = await client.query(
    //   `SELECT id FROM users WHERE id_proof_number = $1 LIMIT 1`,
    //   [id_proof_number],
    // );

    // if (idProofCheck.rowCount > 0) {
    //   return res.status(409).json({
    //     success: false,
    //     message: "ID proof number already exists",
    //   });
    // }

    const phoneCheck = await client.query(
      `SELECT id FROM users WHERE phone = $1 LIMIT 1`,
      [phone_number],
    );

    if (phoneCheck.rowCount > 0) {
      return res.status(409).json({
        success: false,
        message: "Phone number already exists",
      });
    }

    return res.status(200).json({
      success: true,
      message: "All validations passed",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Server error!",
    });
  }
};



const deleteResidentById = async (req, res) => {
  try {
    const { id } = req.params;

    // const uuidRegex =
    //   /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

    // if (!uuidRegex.test(uuid)) {
    //   return res
    //     .status(400)
    //     .json({ success: false, message: "Invalid resident ID" });
    // }

    const existing = await client.query(
      "SELECT uuid FROM users WHERE id=$1",
      [id],
    );
    if (existing.rows.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Resident not found" });
    }

    await client.query("DELETE FROM users WHERE id=$1", [uuid]);

    res
      .status(200)
      .json({ success: true, message: "Resident deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};


const updateresident = async (req, res) => {
  try {
    if (req.fileValidationError) {
      return res.status(400).json({
        success: false,
        message: req.fileValidationError,
      });
    }

    const userId = req.params.id;
    const { name, email, phone_number } = req.body;

    const profilePath = req.file
      ? path.posix.join("uploads", req.file.filename)
      : null;

    const result = req.file
      ? await client.query(
          `
      UPDATE users
      SET name = $1,
          email = $2,
          phone = $3,
          profile_image = $4
      WHERE id = $5
      RETURNING id, name, email, phone, profile_image
      `,
          [name, email, phone_number, profilePath, userId],
        )
      : await client.query(
          `
      UPDATE users
      SET name = $1,
          email = $2,
          phone = $3
      WHERE id = $4
      RETURNING id, name, email, phone, profile_image
      `,
          [name, email, phone_number, userId],
        );

    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Resident not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: result.rows[0],
      message: "Resident updated successfully.",
    });
  } catch (error) {
    console.error("Update Resident Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error!",
    });
  }
};

const fetchByFlatId = async (req, res) => {
  try {
    const { flat_id } = req.params;

    if (!flat_id) {
      return res.status(400).json({
        success: false,
        message: "flat_id is required",
      });
    }

    const result = await client.query(
      `SELECT id, name, email, phone, role_id, flat_id, society_id, is_active, created_at, profile_image
       FROM users
       WHERE flat_id = $1`,
      [flat_id]
    );

    return res.status(200).json({
      success: true,
      count: result.rows.length,
      data: result.rows,
    });
  } catch (error) {
    console.error("Error fetching users by flat_id:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

const fetchBySociety = async (req, res) => {
  try {
    const { society_id } = req.params;
    const result = await client.query("SELECT * FROM users WHERE society_id = $1", [society_id]);
    res.status(200).json({
      success: true,
      message: "Residents fetched successfully",
      data: result.rows,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};


module.exports = {
  validation,
  residentLogin,
  usersOnboard,
  fetchByFlatId,
  fetchBySociety,
  deleteResidentById,
  getAllusers,
  updateresident,
  residentProfileUpload,
};