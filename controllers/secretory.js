const { client } = require("../config/client");

const bcrypt = require("bcrypt");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const SECRETARY_PROFILE_IMAGES_DIR = path.join(
  __dirname,
  "..",
  "uploads",
  "secretary-profile-images",
);

const secretaryProfileUpload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      try {
        fs.mkdirSync(SECRETARY_PROFILE_IMAGES_DIR, { recursive: true });
        cb(null, SECRETARY_PROFILE_IMAGES_DIR);
      } catch (e) {
        cb(e);
      }
    },
    filename: (req, file, cb) => {
      const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      const ext = path.extname(file?.originalname || "").toLowerCase();
      cb(null, `secretary-${unique}${ext || ".img"}`);
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

const ADMIN_PUBLIC_FIELDS =
  "id, name, email, phone, role, society_id, profile_image, is_active, created_at, updated_at, created_by";

const signup = async (req, res) => {
  try {
    if (req.fileValidationError) {
      return res.status(400).json({
        success: false,
        message: req.fileValidationError,
      });
    }
    console.log(req.user,"++++++++++++++++++++++++")
    const { name, email, phone, password, role, society_id, address_line1, address_line2, gender } =
      req.body;
    const { id } = req.user;

    const profileFile = req.files?.profile_image?.[0] || null;
    const aadharFile = req.files?.aadhar_photo?.[0] || null;

    const profile_image = profileFile
      ? path.posix.join("uploads", profileFile.filename)
      : req.body.profile_image ?? null;

    const aadhar_photo = aadharFile
      ? path.posix.join("uploads", aadharFile.filename)
      : req.body.aadhar_photo ?? null;

    const existingUser = await client.query(
      "SELECT id FROM admins WHERE email = $1",
      [email],
    );

    const existingPhone = await client.query(
      "SELECT id FROM admins WHERE phone = $1",
      [phone],
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({ message: "Email already registered!" });
    }

    if (existingPhone.rows.length > 0) {
      return res.status(400).json({ message: "Phone already registered!" });
    }

    const hashedPassword = await bcrypt.hash(password, 2);

    const newUser = await client.query(
      `INSERT INTO admins 
       (name, email, phone, password, role, created_by, society_id, profile_image, aadhar_photo, address_line1, address_line2, gender)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING ${ADMIN_PUBLIC_FIELDS}`,
      [
        name,
        email,
        phone,
        hashedPassword,
        role,
        id,
        society_id,
        profile_image,
        aadhar_photo,
        address_line1 ?? null,
        address_line2 ?? null,
        gender ?? null,
      ],
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

const updateSecretary = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      name,
      email,
      phone,
      address_line1,
      address_line2,
      gender,
    } = req.body;

    // files
    const profileFile = req.files?.profile_image?.[0] || null;
    const aadharFile = req.files?.aadhar_photo?.[0] || null;

    const profile_image = profileFile
      ? path.posix.join("uploads", profileFile.filename)
      : null;

    const aadhar_photo = aadharFile
      ? path.posix.join("uploads", aadharFile.filename)
      : null;

    // check if admin exists
    const existing = await client.query(
      "SELECT * FROM admins WHERE id = $1",
      [id]
    );

    if (existing.rows.length === 0) {
      return res.status(404).json({ message: "Admin not found" });
    }

    // update query
    const updatedUser = await client.query(
      `UPDATE admins SET
        name = COALESCE($1, name),
        email = COALESCE($2, email),
        phone = COALESCE($3, phone),
        address_line1 = COALESCE($4, address_line1),
        address_line2 = COALESCE($5, address_line2),
        gender = COALESCE($6, gender),
        profile_image = COALESCE($7, profile_image),
        aadhar_photo = COALESCE($8, aadhar_photo),
        updated_at = NOW()
       WHERE id = $9
       RETURNING id, name, email, phone, profile_image`,
      [
        name || null,
        email || null,
        phone || null,
        address_line1 || null,
        address_line2 || null,
        gender || null,
        profile_image,
        aadhar_photo,
        id,
      ]
    );

    res.status(200).json({
      message: "Admin updated successfully",
      user: updatedUser.rows[0],
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// const updateSecretary = async (req, res) => {
//   try {
//     if (req.fileValidationError) {
//       return res.status(400).json({
//         success: false,
//         message: req.fileValidationError,
//       });
//     }

//     const { id } = req.params;
//     const { name, email, phone } = req.body;

//     const result = req.file
//       ? await client.query(
//           `
//       UPDATE admins
//       SET name = $1,
//           email = $2,
//           phone = $3,
//           profile_image = $4,
//           updated_at = CURRENT_TIMESTAMP
//       WHERE id = $5
//       RETURNING ${ADMIN_PUBLIC_FIELDS}
//     `,
//           [
//             name,
//             email,
//             phone,
//             path.posix.join(
//               "uploads",
              
//               req.file.filename,
//             ),
//             id,
//           ],
//         )
//       : await client.query(
//           `
//       UPDATE admins
//       SET name = $1,
//           email = $2,
//           phone = $3,
//           updated_at = CURRENT_TIMESTAMP
//       WHERE id = $4
//       RETURNING ${ADMIN_PUBLIC_FIELDS}
//     `,
//           [name, email, phone, id],
//         );

//     if (result.rowCount === 0) {
//       return res.status(404).json({
//         success: false,
//         message: "Secretary not found",
//       });
//     }

//     return res.json({
//       success: true,
//       admin: result.rows[0],
//     });
//   } catch (error) {
//     console.error(error);
//     return res.status(500).json({ error: "Failed to update admin" });
//   }
// };
const updateStatusSecretary = async (req, res) => {
  try {
    const { id } = req.params;
    const { is_active } = req.body;

    const values = [is_active, id];

    const result = await client.query(
      `UPDATE admins
       SET is_active = $1,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING ${ADMIN_PUBLIC_FIELDS}`,
      values,
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Secretary not found",
      });
    }

    return res.json({
      success: true,
      admin: result.rows[0],
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to update admin" });
  }
};
const deleteSecretary = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await client.query(`DELETE FROM admins WHERE id = $1`, [
      id,
    ]);

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Secretary not found" });
    }

    res.json({
      success: true,
      message: "Secretary deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getAllSecretaries = async (req, res) => {
  try {
    const { id } = req.user;
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const offset = (page - 1) * limit;

    const countResult = await client.query(
      `SELECT COUNT(*) FROM admins
       WHERE role = 'admin' AND created_by = $1`,
      [id],
    );

    const totalRecords = parseInt(countResult.rows[0].count, 10);

    const dataResult = await client.query(
      `SELECT ${ADMIN_PUBLIC_FIELDS}
       FROM admins
       WHERE role = 'admin' AND created_by = $3
       ORDER BY created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset, id],
    );

    return res.json({
      success: true,
      pagination: {
        totalRecords,
        currentPage: page,
        totalPages: Math.ceil(totalRecords / limit) || 1,
        limit,
      },
      data: dataResult.rows,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getSecretariesBySociety = async (req, res) => {
  try {
    const { societyId } = req.params;
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const offset = (page - 1) * limit;

    if (!societyId || String(societyId).trim() === "") {
      return res.status(400).json({
        success: false,
        message: "societyId is required",
      });
    }

    const countResult = await client.query(
      `SELECT COUNT(*) FROM admins WHERE society_id = $1`,
      [societyId],
    );

    const totalRecords = parseInt(countResult.rows[0].count, 10);

    const dataResult = await client.query(
      `SELECT ${ADMIN_PUBLIC_FIELDS}
       FROM admins
       WHERE society_id = $3
       ORDER BY created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset, societyId],
    );

    return res.json({
      success: true,
      pagination: {
        totalRecords,
        currentPage: page,
        totalPages: Math.ceil(totalRecords / limit) || 1,
        limit,
      },
      data: dataResult.rows,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  updateSecretary,
  deleteSecretary,
  updateStatusSecretary,
  getSecretariesBySociety,
  signup,
  getAllSecretaries,
  secretaryProfileUpload,
};