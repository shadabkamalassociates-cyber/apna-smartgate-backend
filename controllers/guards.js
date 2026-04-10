const bcrypt = require("bcrypt");
// const jwt = require("jsonwebtoken");
const { client } = require("../config/client");
const { generateToken } = require("./common/generateToken");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// const GUARD_PROFILE_IMAGES_DIR = path.join(
//   __dirname,
//   "..",
//   "uploads",
//   "guard-profile-images",
// );

const guardProfileUpload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      try {
        fs.mkdirSync(GUARD_PROFILE_IMAGES_DIR, { recursive: true });
        cb(null, GUARD_PROFILE_IMAGES_DIR);
      } catch (e) {
        cb(e);
      }
    },
    filename: (req, file, cb) => {
      const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      const ext = path.extname(file?.originalname || "").toLowerCase();
      cb(null, `guard-${unique}${ext || ".img"}`);
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

const getAllGuards = async (req, res) => { 
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    // Get total count
    const countResult = await client.query("SELECT COUNT(*) FROM guards");
    const totalRecords = parseInt(countResult.rows[0].count);

    // Get paginated data
    const result = await client.query(
      `SELECT 
        g.id,
        g.name,
        g.email,
        g.society_id,
        g.profile_image,
        s.name AS society_name
      FROM guards g
      LEFT JOIN societies s 
      ON g.society_id = s.id
      ORDER BY g.id DESC
      LIMIT $1 OFFSET $2;`,
      [limit, offset],
    );

    res.status(200).json({
      success: true,
      message: "Guards fetched successfully",
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
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

const signupGuard = async (req, res) => {
  try {
    if (req.fileValidationError) {
      return res.status(400).json({
        success: false,
        message: req.fileValidationError,
      });
    }

    const { name, email, password, society_id } = req.body;

    const profile_image = req.file
      ? path.posix.join("uploads", "guard-profile-images", req.file.filename)
      : req.body.profile_image ?? null;

    const existingUser = await client.query(
      "SELECT * FROM guards WHERE email = $1",
      [email],
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({ message: "Email already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 2);

    const newUser = await client.query(
      `INSERT INTO guards 
       (name, email, password, society_id, profile_image)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, name, email, society_id, profile_image`,
      [name, email, hashedPassword, society_id, profile_image],
    );

    return res.status(201).json({
      message: "Signup successful",
      user: newUser.rows[0],
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};

const signinGuard = async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log(email, password);
      
   const userResult = await client.query(
     `SELECT 
      g.id,
      g.name,
      g.email,
      g.password,
      g.society_id,
      g.profile_image,
      s.name AS society_name,
      s.address
   FROM guards g
   JOIN societies s
   ON g.society_id = s.id
   WHERE g.email = $1`,
     [email],
   );

  //  console.log(userResult.rows[0]);

    if (userResult.rows.length === 0) {
      return res.status(400).json({ message: "Invalid credentials!" });
    }

    const data = userResult.rows[0];

    // console.log(result);
    const isMatch = await bcrypt.compare(password, data.password);

    if (!isMatch) {
      return res.status(400).json({ message: "Invalid Password!" });
    }

    const token = jwt.sign(
        { id: data?.id, role: data?.role },
        process.env.JWT_SECRET,
        { expiresIn: "7d" },
        );

    res.cookie("token", token, {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      maxAge: 30 * 24 * 60 * 60 * 1000, // 1 month
    });

    res.status(200).json({
      message: "Login successful",
      token,
      data: data,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server error" });
  }
};
const deleteGuardByUuid = async (req, res) => {
  try {
    const { id } = req.params;


    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

    if (!uuidRegex.test(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid guard ID",
      });
    }


    const existing = await client.query("SELECT id FROM guards WHERE id = $1", [
      id,
    ]);

    if (existing.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Guard not found",
      });
    }

    await client.query("DELETE FROM guards WHERE id = $1", [id]);

    return res.status(200).json({
      success: true,
      message: "Guard deleted successfully",
    });
  } catch (error) {
    console.error("Delete guard error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};
const validation= async (req,res)=>{
try {
  const { name, email, password, confirmPassword } = req.body;

  if(!name){
    res.status(401).json({success:false, message:"Name is required!"})
  }
  if(!email){
    res.status(401).json({success:false,message:"Email is required!"})
  }
  if(!password){
    res.send(401).json({success:false, message:"Password is required!"})
  }
  if(confirmPassword !== password){
    res.send(401).json({success:false,message:"Password do not match!"})
  }
  res.json({success:true,message:"Your details are valid."})
} catch (error) {
  res.status(500).json({success:false,message:"Server error!"})
}
}
const checkAuthentication = async (req, res) => {
  try {
    return res.status(200).json({
      message: "You are logged in.",
      success: true,
      data: req.user,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Server error!",
      success: false,
    });
  }
};
const fetchGuardsBySociety = async (req, res) => {
  try {
    const { society_id } = req.params;
    const result = await client.query("SELECT * FROM guards WHERE society_id = $1", [society_id]);
    res.status(200).json({
      success: true,
      message: "Guards fetched successfully",
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
const updateGaurd = async (req, res) => {
  try {
    if (req.fileValidationError) {
      return res.status(400).json({
        success: false,
        message: req.fileValidationError,
      });
    }

    const { uuid } = req.params;
    const { name, email, phone } = req.body;

    const result = req.file
      ? await client.query(
          `UPDATE guards
           SET name = $1, email = $2, phone = $3,
               profile_image = $4
           WHERE uuid = $5
           RETURNING id, name, email, phone, profile_image, society_id`,
          [
            name,
            email,
            phone,
            path.posix.join("uploads", "guard-profile-images", req.file.filename),
            uuid,
          ],
        )
      : await client.query(
          `UPDATE guards
           SET name = $1, email = $2, phone = $3
           WHERE uuid = $4
           RETURNING id, name, email, phone, profile_image, society_id`,
          [name, email, phone, uuid],
        );

    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Guard not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Guard updated successfully",
      data: result.rows[0],
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};
module.exports = {
  validation,
  getAllGuards,
  updateGaurd,
  signupGuard,
  signinGuard,
  deleteGuardByUuid,
  fetchGuardsBySociety,
  checkAuthentication,
  guardProfileUpload,
};