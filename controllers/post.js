const { client } = require("../config/client");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const POST_IMAGES_DIR = path.join(__dirname, "..", "uploads", "post-images");

// Multer upload for post images.
// Client should send files using multipart field name: `images` (multiple).

const postImagesUpload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      try {
        fs.mkdirSync(POST_IMAGES_DIR, { recursive: true });
        cb(null, POST_IMAGES_DIR);
      } catch (e) {
        cb(e);
      }
    },
    filename: (req, file, cb) => {
      const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      const ext = path.extname(file?.originalname || "").toLowerCase();
      cb(null, `post-${unique}${ext || ".img"}`);
    },
  }),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB per image
  },
  fileFilter: (req, file, cb) => {
    const isImage = file?.mimetype?.startsWith("image/");
    if (!isImage) {
      req.fileValidationError = "images must be image files";
      return cb(null, false);
    }
    cb(null, true);
  },
});

const fetchAll = async () => {
  try {
    const { rows } = await client.query(`SELECT * FROM post ORDER BY created_at DESC`);
    return rows; // return the fetched data
  } catch (error) {
    console.log(error);
    throw error; // optional: rethrow for upstream handling
  }
};

const getPostsByOwner = async (req, res) => {
  try {
    // console.log(req.params.id, "||||||||||||||||||||||||||||");
    const ownerId  = req.params.id;
    const result = await client.query(
      `
      SELECT *
      FROM post
      WHERE "createdByOwner" = $1
      ORDER BY created_at DESC
      `,
      [ownerId],
    );

    res.status(200).json({
      success: true,
      total: result.rows.length,
      posts: result.rows,
    });
  } catch (error) {
    console.error("Fetch owner posts error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

const getPostsByResident = async (req, res) => {
  try {
    const residentId = req.params.id;

    const result = await client.query(
      `
      SELECT *
      FROM post
      WHERE "createdByResident" = $1
      ORDER BY created_at DESC
      `,
      [residentId],
    );

    res.status(200).json({
      success: true,
      total: result.rows.length,
      posts: result.rows,
    });

  } catch (error) {
    console.error("Fetch resident posts error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

const createPostByOwner = async (req, res) => {
  try {
    if (req.fileValidationError) {
      return res.status(400).json({ message: req.fileValidationError });
    }

    const { title, description } = req.body;
    const imagesFromBody = req.body?.images;
    const images =
      req.files?.length > 0
        ? req.files.map((f) =>
            path.posix.join("uploads", f.filename),
          )
        : imagesFromBody || [];
    // console.log(title, description, images, req.params.id);
    const ownerId = req.params.id; // ya req.user.id (recommended)

    if (!title) {
      return res.status(400).json({
        success: false,
        message: "Title is required",
      });
    }

    const ownerCheck = await client.query(
      `SELECT id FROM society_owners WHERE id = $1`,
      [ownerId],
    );

    if (ownerCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Owner not found in society_owners table",
      });
    }

  
    const result = await client.query(
      `INSERT INTO post 
      (title, description, images, "createdByOwner")
      VALUES ($1, $2, $3, $4)
      RETURNING *`,
      [title, description || null, images || [], ownerId],
    );

    return res.status(201).json({
      success: true,
      message: "Post created by owner successfully",
      post: result.rows[0],
    });
  } catch (error) {
    console.error("Owner create post error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

const updatePost = async (req, res) => {
  try {
    const { id } = req.params;
    if (req.fileValidationError) {
      return res.status(400).json({ message: req.fileValidationError });
    }

    const { title, description } = req.body;
    const imagesFromBody = req.body?.images;
    const images =
      req.files?.length > 0
        ? req.files.map((f) =>
            path.posix.join("uploads", f.filename),
          )
        : imagesFromBody;

    const result = await client.query(
      `UPDATE post SET title = $1, description = $2, images = $3 WHERE id = $4 RETURNING *`,
      [title, description, images, id],
    );
    return res.status(200).json({ success: true, message: "Post updated successfully", post: result.rows[0] });
  }
  catch (error) {
    console.log(error);
    throw error;
  }
}

const createPostByResident = async (req, res) => {
  try {
    if (req.fileValidationError) {
      return res.status(400).json({ message: req.fileValidationError });
    }

    const { title, description } = req.body;
    const imagesFromBody = req.body?.images;
    const images =
      req.files?.length > 0
        ? req.files.map((f) =>
            path.posix.join("uploads", "post-images", f.filename),
          )
        : imagesFromBody || [];
    const residentId = req.params.id;

    if (!title) {
      return res.status(400).json({
        success: false,
        message: "Title is required",
      });
    }

    const result = await client.query(
      `
      INSERT INTO post 
      (title, description, images, "createdByResident")
      VALUES ($1, $2, $3, $4)
      RETURNING *
      `,
      [title, description, images || [], residentId],
    );

    res.status(201).json({
      success: true,
      message: "Post created by resident successfully",
      post: result.rows[0],
    });
  } catch (error) {
    console.error("Resident create post error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

const deletePostById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await client.query(`
      DELETE FROM post
      WHERE id = $1
      RETURNING *
      `,
      [id], 
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        message: "Post not found",
        success: false,
      });
    }

    res.status(200).json({
      message: "Post deleted successfully",
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

const postLikeByResident = async (req, res)=>{
  try {
    const { residentId } = req.params;
    const { post_id } = req.body;

    if (!post_id) {
      return res.status(400).json({
        success: false,
        message: "Post ID is required",
      });
    }

    const post = await client.query(
      `
      SELECT id FROM post WHERE id = $1`,
      [post_id],
    );

    if (!post) {
      res.status(404).json({
        message: "Post does not exist!",
      });
    }

    const checkLike = await client.query(
      `SELECT id FROM post_likes 
        WHERE post_id = $1 AND user_id = $2`,
      [post_id, residentId],
    );

    if (checkLike.rows.length > 0) {
      await client.query(
        `DELETE FROM post_likes 
         WHERE post_id = $1 AND user_id = $2`,
        [post_id, residentId],
      );

      return res.status(200).json({
        success: true,
        message: "Post unliked successfully",
      });
    }

    const result = await client.query(
      `INSERT INTO post_likes (post_id, user_id)
       VALUES ($1, $2)
       RETURNING *`,
      [post_id, residentId],
    );

    return res.status(201).json({
      success: true,
      message: "Post liked successfully",
      data: result.rows[0],
    });

  } catch (error) {
    console.log(error)
    res.status(500).json({
      successL:false,
      message:"Server error!"
    })
  }
}

const fetchLikes = async (req, res) => {
  try {
    const { id } = req.params;
    const { rows } = await client.query(`SELECT * FROM post_likes WHERE user_id = $1`, [id]);
    
    res.status(200).json({
      success: true,
      data: rows,
    });
  }
  catch (error) {
    console.log(error);
    throw error;
  }
}

module.exports = {
  fetchLikes,
  updatePost,
  getPostsByOwner,
  createPostByOwner,
  createPostByResident,
  getPostsByResident,
  postLikeByResident,
  deletePostById,
  fetchAll,
  postImagesUpload,
};