const { client } = require("../config/client");

const multer = require("multer");
const path = require("path");
const fs = require("fs");

// const COMPLAINT_ATTACHMENTS_DIR = path.join(
//   __dirname,
//   "..",
//   "uploads",
//   "complaint-attachments"
// );

// Multer upload for complaint attachments.
// Client should send the file using multipart field name: `attachment_url`.
// const attachmentUpload = multer({
//   storage: multer.diskStorage({
//     destination: (req, file, cb) => {
//       try {
//         fs.mkdirSync(COMPLAINT_ATTACHMENTS_DIR, { recursive: true });
//         cb(null, COMPLAINT_ATTACHMENTS_DIR);
//       } catch (e) {
//         cb(e);
//       }
//     },
//     filename: (req, file, cb) => {
//       const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
//       const ext = path.extname(file?.originalname || "").toLowerCase();
//       cb(null, `complaint-${unique}${ext || ".img"}`);
//     },
//   }),
//   limits: {
//     fileSize: 5 * 1024 * 1024, // 5MB
//   },
//   fileFilter: (req, file, cb) => {
//     const isImage = file?.mimetype?.startsWith("image/");
//     if (!isImage) {
//       req.fileValidationError = "attachment_url must be an image file";
//       return cb(null, false);
//     }
//     cb(null, true);
//   },
// });

const createComplaint = async (req, res) => {
  try {
    if (req.fileValidationError) {
      return res.status(400).json({ message: req.fileValidationError });
    }

    const { society_id, raised_by, title, description, category } = req.body;

    // Backward-compatible:
    // - If multipart file is uploaded, save its stored path into `attachment_url`
    // - Else, allow clients to send `attachment_url` as a plain string
    const attachmentUrlFromBody = req.body?.attachment_url;
    const attachment_url = req.file
      ? path.posix.join("uploads", req.file.filename)
      : attachmentUrlFromBody ?? null;


    const result = await client.query(
      `INSERT INTO complaints 
       (society_id, raised_by, title, description, attachment_url, category )
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [society_id, raised_by, title, description, attachment_url, category],
    );

    res.status(201).json({
      success: true,
      message: "Complaint created successfully",
      data: result.rows[0],
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create complaint" });
  }
};


const fetchAllComplaints = async (req, res) => {
  try {
    const result = await client.query(`
      SELECT 
        c.id,
        c.title,
        c.description,
        c.status,
        c.attachment_url,
        c.created_at,

        c.society_id,
        c.apartment_id,

        c.raised_by,
        u1.name AS raised_by_name,
        u1.email AS raised_by_email,

        c.assigned_to,
        u2.name AS assigned_to_name,
        u2.email AS assigned_to_email,

        json_build_object(
          'id', f.id,
          'flat_number', f.flat_number,
          'floor', f.floor
        ) AS flat,

        json_build_object(
          'id', s.id,
          'name', s.name,
          'address', s.address,
          'status', s.status
        ) AS society

      FROM complaints c

      LEFT JOIN users u1 
        ON c.raised_by = u1.id

      LEFT JOIN users u2 
        ON c.assigned_to = u2.id

      LEFT JOIN flats f
        ON c.apartment_id = f.id

      LEFT JOIN societies s
        ON c.society_id = s.id

      ORDER BY c.created_at DESC
    `);

    res.status(200).json({
      success: true,
      data: result.rows,
    });

  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};


const updateComplaint = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const result = await client.query(
      `UPDATE complaints
       SET 
           status = $1,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING *`,
      [status, id],
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Complaint not found" });
    }

    res.json(result.rows[0]);
    
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update complaint" });
  }
};

const getComplaintsByRaisedId = async (req, res) => {
  try {
    const { raised_by } = req.params;

    const result = await client.query(
      `
      SELECT 
        c.id,
        c.title,
        c.description,
        c.status,
        c.attachment_url,
        c.created_at,

        c.society_id,
        c.apartment_id,

        json_build_object(
          'id', u1.id,
          'name', u1.name,
          'email', u1.email
        ) AS raised_by_user,

        json_build_object(
          'id', u2.id,
          'name', u2.name,
          'email', u2.email
        ) AS assigned_to_user,

        json_build_object(
          'id', f.id,
          'flat_number', f.flat_number,
          'floor', f.floor
        ) AS flat,

        json_build_object(
          'id', s.id,
          'name', s.name,
          'address', s.address,
          'status', s.status
        ) AS society

      FROM complaints c

      LEFT JOIN users u1 
        ON c.raised_by = u1.id

      LEFT JOIN users u2 
        ON c.assigned_to = u2.id

      LEFT JOIN flats f
        ON c.apartment_id = f.id

      LEFT JOIN societies s
        ON c.society_id = s.id

      WHERE c.raised_by = $1
      ORDER BY c.created_at DESC
      `,
      [raised_by]
    );

    res.json({
      success: true,
      data: result.rows,
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch complaints" });
  }
};

const getComplaintsBySocietyId = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await client.query(
      `
      SELECT 
        c.id,
        c.title,
        c.description,
        c.status,
        c.created_at,

        c.society_id,
        c.apartment_id,

        json_build_object(
          'id', u1.id,
          'name', u1.name,
          'email', u1.email
        ) AS raised_by_user,

        json_build_object(
          'id', u2.id,
          'name', u2.name,
          'email', u2.email
        ) AS assigned_to_user,

        json_build_object(
          'id', f.id,
          'flat_number', f.flat_number,
          'floor', f.floor
        ) AS flat,

        json_build_object(
          'id', s.id,
          'name', s.name,
          'address', s.address,
          'status', s.status
        ) AS society

      FROM complaints c

      LEFT JOIN users u1 
        ON c.raised_by = u1.id

      LEFT JOIN users u2 
        ON c.assigned_to = u2.id

      LEFT JOIN flats f
        ON c.apartment_id = f.id

      LEFT JOIN societies s
        ON c.society_id = s.id

      WHERE c.society_id = $1
      ORDER BY c.created_at DESC
      `,
      [id]
    );

    res.json({
      success: true,
      data: result.rows,
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch complaints" });
  }
};

const deleteComplaintById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await client.query(
      `DELETE FROM complaints
       WHERE id = $1`,
      [id],
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Complaint not found" });
    }

    res.json({ message: "Complaint deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete complaint" });
  }
};

module.exports = {
  createComplaint,
  updateComplaint,
  getComplaintsByRaisedId,
  deleteComplaintById,
  fetchAllComplaints,
  getComplaintsBySocietyId,
  
};