const { client } = require("../config/client");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const SOCIETY_LOGOS_DIR = path.join(__dirname, "..", "uploads", "society-logos");

const societyLogoUpload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      try {
        fs.mkdirSync(SOCIETY_LOGOS_DIR, { recursive: true });
        cb(null, SOCIETY_LOGOS_DIR);
      } catch (e) {
        cb(e);
      }
    },
    filename: (req, file, cb) => {
      const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      const ext = path.extname(file?.originalname || "").toLowerCase();
      cb(null, `society-logo-${unique}${ext || ".img"}`);
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ok = file?.mimetype?.startsWith("image/");
    if (!ok) {
      req.fileValidationError = "logo must be an image file";
      return cb(null, false);
    }
    cb(null, true);
  },
});

function parseOptionalInt(v) {
  if (v === undefined || v === null || v === "") return null;
  const n = parseInt(String(v), 10);
  return Number.isFinite(n) ? n : null;
}

function parseOptionalNumeric(v) {
  if (v === undefined || v === null || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function parseAmenities(raw) {
  if (raw === undefined || raw === null || raw === "") return null;
  if (typeof raw === "object") return raw;
  if (typeof raw === "string") {
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }
  return null;
}
const createSocietyByOwner = async (req, res) => {
  try {
    // 🔴 File validation
    if (req.fileValidationError) {
      return res.status(400).json({
        success: false,
        message: req.fileValidationError,
      });
    }

    const b = req.body;

    // 🔴 Required field
    const name = b.name?.trim();
    if (!name) {
      return res.status(400).json({
        success: false,
        message: "name is required",
      });
    }

    // 🔴 Auth user
    const created_by_admin = req.user?.id || null;

    // 🔴 Logo handling
    const logo_url = req.file
      ? path.posix.join("uploads", req.file.filename)
      : b.logo_url ?? null;

    // =========================
    // ✅ AMENITIES PARSER (STRONG)
    // =========================
    let amenities = null;

    if (b.amenities) {
      if (Array.isArray(b.amenities)) {
        // Already array (rare case)
        amenities = b.amenities;
      } else if (typeof b.amenities === "string") {
        try {
          // Try JSON parse first
          amenities = JSON.parse(b.amenities);
        } catch (err) {
          // Fallback: comma-separated string
          amenities = b.amenities
            .split(",")
            .map((a) => a.trim())
            .filter((a) => a.length > 0);
        }
      }

      // Final validation
      if (!Array.isArray(amenities)) {
        return res.status(400).json({
          success: false,
          message:
            "amenities must be JSON array or comma-separated string",
        });
      }
    }

    // =========================
    // ✅ INSERT QUERY
    // =========================
    const newSociety = await client.query(
      `INSERT INTO societies (
        name, address, created_by_admin,
        city, state, country, pincode,
        contact_phone, contact_email, website, registration_number,
        total_blocks, total_flats, year_established,
        latitude, longitude, logo_url, description, amenities, status
      )
      VALUES (
        $1, $2, $3,
        $4, $5, $6, $7,
        $8, $9, $10, $11,
        $12, $13, $14,
        $15, $16, $17, $18, $19::jsonb, $20::society_status
      )
      RETURNING *`,
      [
        name,
        b.address ?? null,
        created_by_admin,
        b.city ?? null,
        b.state ?? null,
        b.country ?? "India",
        b.pincode ?? null,
        b.contact_phone ?? null,
        b.contact_email ?? null,
        b.website ?? null,
        b.registration_number ?? null,
        parseOptionalInt(b.total_blocks),
        parseOptionalInt(b.total_flats),
        parseOptionalInt(b.year_established),
        parseOptionalNumeric(b.latitude),
        parseOptionalNumeric(b.longitude),
        logo_url,
        b.description ?? null,
        amenities ? JSON.stringify(amenities) : null, // ✅ IMPORTANT
        b.status ?? "PENDING",
      ]
    );

    return res.status(201).json({
      success: true,
      message: "Society created successfully",
      society: newSociety.rows[0],
    });

  } catch (error) {
    console.error("Create Society Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};
// const createSocietyByOwner = async (req, res) => {
//   try {
//     if (req.fileValidationError) {
//       return res.status(400).json({
//         success: false,
//         message: req.fileValidationError,
//       });
//     }

//     const b = req.body;
//     const name = b.name?.trim();
//     if (!name) {
//       return res.status(400).json({
//         success: false,
//         message: "name is required",
//       });
//     }

//     const created_by_admin = req.user.id;
//     const logo_url = req.file
//       ? path.posix.join("uploads", "society-logos", req.file.filename)
//       : b.logo_url ?? null;

//     const amenities = parseAmenities(b.amenities);
//     if (b.amenities && amenities === null && typeof b.amenities === "string") {
//       return res.status(400).json({
//         success: false,
//         message: "amenities must be valid JSON",
//       });
//     }

//     const newSociety = await client.query(
//       `INSERT INTO societies (
//         name, address, created_by_admin,
//         city, state, country, pincode,
//         contact_phone, contact_email, website, registration_number,
//         total_blocks, total_flats, year_established,
//         latitude, longitude, logo_url, description, amenities, status
//       )
//       VALUES (
//         $1, $2, $3,
//         $4, $5, $6, $7,
//         $8, $9, $10, $11,
//         $12, $13, $14,
//         $15, $16, $17, $18, $19::jsonb, $20::society_status
//       )
//       RETURNING *`,
//       [
//         name,
//         b.address ?? null,
//         created_by_admin,
//         b.city ?? null,
//         b.state ?? null,
//         b.country ?? "India",
//         b.pincode ?? null,
//         b.contact_phone ?? null,
//         b.contact_email ?? null,
//         b.website ?? null,
//         b.registration_number ?? null,
//         parseOptionalInt(b.total_blocks),
//         parseOptionalInt(b.total_flats),
//         parseOptionalInt(b.year_established),
//         parseOptionalNumeric(b.latitude),
//         parseOptionalNumeric(b.longitude),
//         logo_url,
//         b.description ?? null,
//         amenities,
//         b.status ?? "PENDING",
//       ],
//     );

//     return res.status(201).json({
//       success: true,
//       message: "Society created successfully",
//       society: newSociety.rows[0],
//     });
//   } catch (error) {
//     console.error(error);
//     return res.status(500).json({
//       success: false,
//       message: "Server error",
//     });
//   }
// };



const fetchSocietyByOwner = async (req, res) => {
  try {
    const adminId = req.params.ownerId ?? req.params.id;
    if (!adminId || String(adminId).trim() === "") {
      return res.status(400).json({
        success: false,
        message: "owner id is required",
      });
    }

    const result = await client.query(
      `
      SELECT
        s.*,
        COALESCE(
          json_agg(
            DISTINCT jsonb_build_object(
              'block_id', b.id,
              'block_name', b.name,
              'flats', (
                SELECT COALESCE(
                  json_agg(
                    jsonb_build_object(
                      'flat_id', f.id,
                      'flat_number', f.flat_number,
                      'floor', f.floor,
                      'status', f.status,
                      'owner_id', f.owner_id
                    )
                  ), '[]'
                )
                FROM flats f
                WHERE f.block_id = b.id
              )
            )
          ) FILTER (WHERE b.id IS NOT NULL),
          '[]'
        ) AS blocks
      FROM societies s
      LEFT JOIN blocks b ON s.id = b.society_id
      WHERE s.created_by_admin = $1::uuid
      GROUP BY s.id
      `,
      [adminId],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No societies found for this admin",
      });
    }

    return res.status(200).json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch societies",
    });
  }
};

const updateSocietyByOwner = async (req, res) => {
  try {
    if (req.fileValidationError) {
      return res.status(400).json({
        success: false,
        message: req.fileValidationError,
      });
    }

    const ownerId = req.user.id;
    const b = req.body;

    const sets = [];
    const vals = [];
    let i = 1;

    const add = (col, val) => {
      if (val !== undefined) {
        sets.push(`${col} = $${i}`);
        vals.push(val);
        i += 1;
      }
    };

    if (b.name !== undefined) {
      const n = String(b.name).trim();
      if (!n) {
        return res.status(400).json({
          success: false,
          message: "name cannot be empty",
        });
      }
      add("name", n);
    }
    add("address", b.address);
    add("city", b.city);
    add("state", b.state);
    add("country", b.country);
    add("pincode", b.pincode);
    add("contact_phone", b.contact_phone);
    add("contact_email", b.contact_email);
    add("website", b.website);
    add("registration_number", b.registration_number);
    if (b.total_blocks !== undefined)
      add("total_blocks", parseOptionalInt(b.total_blocks));
    if (b.total_flats !== undefined)
      add("total_flats", parseOptionalInt(b.total_flats));
    if (b.year_established !== undefined)
      add("year_established", parseOptionalInt(b.year_established));
    if (b.latitude !== undefined)
      add("latitude", parseOptionalNumeric(b.latitude));
    if (b.longitude !== undefined)
      add("longitude", parseOptionalNumeric(b.longitude));
    if (b.description !== undefined) add("description", b.description);
    if (b.status !== undefined) add("status", b.status);

    if (req.file) {
      sets.push(`logo_url = $${i}`);
      vals.push(
        path.posix.join("uploads", req.file.filename),
      );
      i += 1;
    } else if (b.logo_url !== undefined) {
      add("logo_url", b.logo_url);
    }

    if (b.amenities !== undefined) {
      const amenities = parseAmenities(b.amenities);
      if (typeof b.amenities === "string" && b.amenities !== "" && amenities === null) {
        return res.status(400).json({
          success: false,
          message: "amenities must be valid JSON",
        });
      }
      sets.push(`amenities = $${i}::jsonb`);
      vals.push(amenities);
      i += 1;
    }

    if (sets.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No fields to update",
      });
    }

    sets.push("updated_at = CURRENT_TIMESTAMP");

    vals.push(ownerId);
    const whereParam = i;

    const result = await client.query(
      `UPDATE societies
       SET ${sets.join(", ")}
       WHERE id = (
         SELECT society_id FROM society_owners WHERE id = $${whereParam}
       )
       RETURNING *`,
      vals,
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Society not found or unauthorized",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Society updated successfully",
      society: result.rows[0],
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

const deleteSocietyById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await client.query(
      `DELETE FROM societies
       WHERE id = $1
       RETURNING *`,
      [id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Society not found or unauthorized",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Society deleted successfully",
      society: result.rows[0],
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

const fetchAllSociety = async (req, res) => {
  try {
    const result = await client.query(
      "SELECT * FROM societies ORDER BY created_at DESC",
    );

    return res.status(200).json({
      success: true,
      count: result.rows.length,
      data: result.rows,
    });
  } catch (error) {
    console.error("Fetch Society Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch societies",
    });
  }
};

module.exports = {
  createSocietyByOwner,
  fetchSocietyByOwner,
  updateSocietyByOwner,
  deleteSocietyById,
  fetchAllSociety,
  societyLogoUpload,
};
