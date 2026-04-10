const { client } = require("../config/client");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// const ESSENTIAL_CONTACT_IMAGES_DIR = path.join(
//   __dirname,
//   "..",
//   "uploads",
//   "essential-contact-images",
// );

// Multipart field name: `profile_image` (single image file).
// const profileImageUpload = multer({
//   storage: multer.diskStorage({
//     destination: (req, file, cb) => {
//       try {
//         fs.mkdirSync(ESSENTIAL_CONTACT_IMAGES_DIR, { recursive: true });
//         cb(null, ESSENTIAL_CONTACT_IMAGES_DIR);
//       } catch (e) {
//         cb(e);
//       }
//     },
//     filename: (req, file, cb) => {
//       const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
//       const ext = path.extname(file?.originalname || "").toLowerCase();
//       cb(null, `essential-contact-${unique}${ext || ".img"}`);
//     },
//   }),
//   limits: { fileSize: 5 * 1024 * 1024 },
//   fileFilter: (req, file, cb) => {
//     const isImage = file?.mimetype?.startsWith("image/");
//     if (!isImage) {
//       req.fileValidationError = "profile_image must be an image file";
//       return cb(null, false);
//     }
//     cb(null, true);
//   },
// });

const createBySociety = async (req, res) => {
  try {
    if (req.fileValidationError) {
      return res.status(400).json({
        message: req.fileValidationError,
        success: false,
      });
    }

    const { name, mobile_number1, mobile_number2, designation, title } =
      req.body;
    const { society_id } = req.params;

    const profile_image = req.file
      ? path.posix.join("uploads", "essential-contact-images", req.file.filename)
      : req.body.profile_image ?? null;

    if (!designation) {
      return res
        .status(400)
        .json({ message: "Designation is require!", success: false });
    }

    if (!mobile_number1 && !mobile_number2) {
      return res.status(400).json({
        message: "Atleast add one mobile number!",
        success: false,
      });
    }

    if (!name) {
      return res
        .status(400)
        .json({ message: "Name is require!", success: false });
    }

    if (!title) {
      return res
        .status(400)
        .json({ message: "Title is require!", success: false });
    }

    const result = await client.query(
      `INSERT INTO essential_contacts
       (name, mobile_number1, mobile_number2, designation, title, society_id, profile_image)
       VALUES ($1,$2,$3,$4,$5,$6,$7)
       RETURNING *`,
      [
        name,
        mobile_number1 ?? null,
        mobile_number2 ?? null,
        designation,
        title,
        society_id,
        profile_image,
      ],
    );

    return res.status(201).json({
      message: "Essential contact created successfully.",
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Server error",
      success: false,
    });
  }
};
const fetchAllEssentialContacts = async (req, res) => {
  try {
    const result = await client.query(
      `SELECT *
       FROM essential_contacts
       ORDER BY created_at DESC`,
    );

    return res.status(200).json({
      success: true,
      count: result.rows.length,
      data: result.rows,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

const fetchEssentialContactsBySociety = async (req, res) => {
  try {
    const { society_id } = req.params;

    if (!society_id || String(society_id).trim() === "") {
      return res.status(400).json({
        success: false,
        message: "society_id is required",
      });
    }

    const result = await client.query(
      `SELECT *
       FROM essential_contacts
       WHERE society_id = $1
       ORDER BY created_at DESC`,
      [society_id],
    );

    return res.status(200).json({
      success: true,
      count: result.rows.length,
      data: result.rows,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};
const deleteEssentialContactById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await client.query(
      `
      DELETE FROM essential_contacts
      WHERE id = $1
      RETURNING *
      `,
      [id],
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        message: "Contacts not found",
        success: false,
      });
    }

    res.status(200).json({
      message: "Contacts deleted successfully",
      success: true,
      deletedPost: result.rows[0],
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "Server error",
      success: false,
    });
  }
};
module.exports = {
  deleteEssentialContactById,
  createBySociety,
  fetchAllEssentialContacts,
  fetchEssentialContactsBySociety
  // profileImageUpload,
};