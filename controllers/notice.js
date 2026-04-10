const { client } = require("../config/client");


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

module.exports = {
  createNotice,
  updateNotice,
  deleteNotice,
  fetchBySociety,
  fetchByCreatedBy
};