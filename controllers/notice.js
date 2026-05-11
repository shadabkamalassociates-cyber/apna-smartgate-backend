
const { client } = require("../config/client");
const { getIO } = require("./common/socket");



const createNotice = async (req, res) => {
  try {
    const { society_id, created_by, title, description } = req.body;
    const result = await client.query(
      `INSERT INTO notice (society_id, created_by, title, description)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [society_id, created_by, title, description]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

const updateNotice = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description } = req.body;
    const result = await client.query(
      `UPDATE notice
       SET title = $1,
           description = $2
       WHERE id = $3
       RETURNING *`,
      [title, description, id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

const deleteNotice = async (req, res) => {
  try {
    const { id } = req.params;
    await client.query(`DELETE FROM notice WHERE id = $1`, [id]);
    res.json({ message: 'Notice deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

const fetchBySociety = async (req, res) => {
  try {
    const { society_id } = req.params;
    const result = await client.query(
      `SELECT n.*, a.name AS created_by_name, s.name AS society_name
       FROM notice n
       JOIN admins a ON n.created_by = a.id
       JOIN societies s ON n.society_id = s.id
       WHERE n.society_id = $1
       ORDER BY n.created_at DESC`,
      [society_id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

const fetchByCreatedBy = async (req, res) => {
  try {
    const { created_by } = req.params;
    const result = await client.query(
      `SELECT n.*, a.name AS created_by_name, s.name AS society_name
       FROM notice n
       JOIN admins a ON n.created_by = a.id
       JOIN societies s ON n.society_id = s.id
       WHERE n.created_by = $1
       ORDER BY n.created_at DESC`,
      [created_by]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

// const markNoticeViewed = async (req, res) => {
//   const { noticeId, userId, societyId } = req.body;

//   // Insert view (avoid duplicate)
//   await client.query(
//     `INSERT INTO notice_views (notice_id, user_id)
//      VALUES ($1, $2)
//      ON CONFLICT (notice_id, user_id) DO NOTHING`,
//     [noticeId, userId]
//   );

//   // Get updated seen/unseen
//   const result = await client.query(
//     `SELECT 
//         COUNT(DISTINCT u.id) FILTER (WHERE nv.user_id IS NOT NULL) AS seen,
//         COUNT(DISTINCT u.id) FILTER (WHERE nv.user_id IS NULL) AS unseen
//      FROM users u
//      LEFT JOIN notice_views nv 
//         ON u.id = nv.user_id AND nv.notice_id = $1
//      WHERE u.society_id = $2`,
//     [noticeId, societyId]
//   );

//   const data = result.rows[0];

//   io.to(`notice_${noticeId}`).emit("notice_view_update", {
//     noticeId,
//     seen: data.seen,
//     unseen: data.unseen
//   });

//   res.json({ success: true });
// };


const markNoticeViewed = async (req, res) => {
  try {
    const { noticeId, userId } = req.body;

    // Check notice exists
    const noticeExists = await client.query(
      `SELECT id FROM notice WHERE id = $1`,
      [noticeId]
    );

    if (noticeExists.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Notice not found",
      });
    }

    // Insert view only once
    await client.query(
      `INSERT INTO notice_views (notice_id, user_id)
       VALUES ($1, $2)
       ON CONFLICT (notice_id, user_id)
       DO NOTHING`,
      [noticeId, userId]
    );

    // Get viewed users
    const viewedUsers = await client.query(
      `
      SELECT 
        u.id,
        u.name,
        u.profile_image,
        nv.viewed_at
      FROM notice_views nv
      JOIN users u ON u.id = nv.user_id
      WHERE nv.notice_id = $1
      ORDER BY nv.viewed_at DESC
      `,
      [noticeId]
    );
    const io = getIO();
    // Emit realtime update
    io.to(`notice_${noticeId}`).emit(
      "notice_view_update",
      {
        noticeId,
        viewers: viewedUsers.rows,
        totalViewed: viewedUsers.rows.length,
      }
    );

    return res.json({
      success: true,
      viewers: viewedUsers.rows,
    });
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};
const getNoticeViews = async (req, res) => {
  try {
    const { noticeId } = req.params;
    
    // const viewedUsers = await client.query(
    //   `
    //   SELECT 
    //     u.id,
    //     u.name,
    //     u.profile_image,
    //     nv.viewed_at
    //   FROM notice_views nv
    //   JOIN users u ON u.id = nv.user_id
    //   WHERE nv.notice_id = $1
    //   ORDER BY nv.viewed_at DESC
    //   `,
    //   [noticeId]
    // );
    const viewedUsers = await client.query(
        `
        SELECT * FROM notice_views WHERE notice_id = $1
        `,
        [noticeId]
      );
    return res.json({
      success: true,
      totalViewed: viewedUsers.rows.length,
      viewers: viewedUsers.rows,
    });

  } catch (error) {
    console.log(error);

    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};
module.exports = {
  createNotice,
  updateNotice,
  deleteNotice,
  getNoticeViews,
  markNoticeViewed,
  fetchBySociety,
  fetchByCreatedBy
};