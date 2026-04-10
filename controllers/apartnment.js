const createApartment = async (req, res) => {
  try {
    const { society_id, flat_number, floor, owner_id } = req.body;

    if (!society_id || !flat_number) {
      return res
        .status(400)
        .json({ message: "society_id and flat_number required" });
    }

    const result = await client.query(
      `INSERT INTO apartments (society_id, flat_number, floor, owner_id)
       VALUES ($1, $2, $3, $4)
       RETURNING id, society_id, flat_number, floor, owner_id, status`,
      [society_id, flat_number, floor, owner_id]
    );

    res.status(201).json({
      message: "Apartment created successfully",
      apartment: result.rows[0],
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
const updateApartment = async (req, res) => {
  try {
    const { id } = req.params;
    const { flat_number, floor, owner_id, status } = req.body;

    const result = await client.query(
      `UPDATE apartments
       SET flat_number = COALESCE($1, flat_number),
           floor = COALESCE($2, floor),
           owner_id = COALESCE($3, owner_id),
           status = COALESCE($4, status)
       WHERE id = $5
       RETURNING id, society_id, flat_number, floor, owner_id, status`,
      [flat_number, floor, owner_id, status, id]
    );

    if (!result.rows.length) {
      return res.status(404).json({ message: "Apartment not found" });
    }

    res.json({
      message: "Apartment updated successfully",
      apartment: result.rows[0],
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
const deleteApartment = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await client.query(
      `UPDATE apartments
       SET status = 'INACTIVE'
       WHERE id = $1
       RETURNING id`,
      [id]
    );

    if (!result.rows.length) {
      return res.status(404).json({ message: "Apartment not found" });
    }

    res.json({ message: "Apartment deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
const getApartments = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const apartments = await client.query(
      `SELECT 
          a.id,
          a.flat_number,
          a.floor,
          a.status,
          u.name AS owner_name,
          u.email AS owner_email
       FROM apartments a
       LEFT JOIN users u ON u.id = a.owner_id
       WHERE a.status = 'ACTIVE'
       ORDER BY a.created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    const total = await client.query(
      `SELECT COUNT(*) FROM apartments WHERE status = 'ACTIVE'`
    );

    res.json({
      page,
      limit,
      total: parseInt(total.rows[0].count),
      apartments: apartments.rows,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  createApartment,
  updateApartment,
  deleteApartment,
  getApartments,
};