const { client } = require("../config/client");


const createAmenity = async (req, res) => {
  try {
    const {
      society_id,
      name,
      is_active = true,
      start_time,
      end_time,
      images = [],
    } = req.body;

    const query = `
      INSERT INTO amenities (society_id, name, is_active, start_time, end_time, images)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *;
    `;

    const values = [society_id, name, is_active, start_time, end_time, images];

    const { rows } = await client.query(query, values);

    res.status(201).json({
      success: true,
      data: rows[0],
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const getAllAmenities = async (req, res) => {
    try {
      let { page = 1, limit = 10 } = req.query;
  
      page = parseInt(page);
      limit = parseInt(limit);
      const offset = (page - 1) * limit;
  
      const query = `
        SELECT 
          a.*,
          s.id AS society_id,
          s.name AS society_name
        FROM amenities a
        LEFT JOIN societies s ON a.society_id = s.id
        ORDER BY a.created_at DESC NULLS LAST
        LIMIT $1 OFFSET $2;
      `;
  
      const countQuery = `SELECT COUNT(*) FROM amenities`;
  
      const [data, count] = await Promise.all([
        client.query(query, [limit, offset]),
        client.query(countQuery),
      ]);
  
      res.json({
        success: true,
        data: data.rows,
        pagination: {
          total: parseInt(count.rows[0].count),
          page,
          limit,
          totalPages: Math.ceil(count.rows[0].count / limit),
        },
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  const getAmenitiesBySociety = async (req, res) => {
    try {
      const { society_id } = req.params;
  
      let { page = 1, limit = 10 } = req.query;
  
      page = parseInt(page);
      limit = parseInt(limit);
      const offset = (page - 1) * limit;
  
      const query = `
        SELECT 
          a.*,
          s.name AS society_name
        FROM amenities a
        LEFT JOIN societies s ON a.society_id = s.id
        WHERE a.society_id = $1
        ORDER BY a.created_at DESC NULLS LAST
        LIMIT $2 OFFSET $3;
      `;
  
      const countQuery = `
        SELECT COUNT(*) FROM amenities WHERE society_id = $1
      `;
  
      const [data, count] = await Promise.all([
        client.query(query, [society_id, limit, offset]),
        client.query(countQuery, [society_id]),
      ]);
  
      res.json({
        success: true,
        data: data.rows,
        pagination: {
          total: parseInt(count.rows[0].count),
          page,
          limit,
          totalPages: Math.ceil(count.rows[0].count / limit),
        },
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  const updateAmenity = async (req, res) => {
    try {
      const { id } = req.params;
  
      const {
        name,
        is_active,
        start_time,
        end_time,
        images,
      } = req.body;
  
      const query = `
        UPDATE amenities
        SET 
          name = COALESCE($1, name),
          is_active = COALESCE($2, is_active),
          start_time = COALESCE($3, start_time),
          end_time = COALESCE($4, end_time),
          images = COALESCE($5, images)
        WHERE id = $6
        RETURNING *;
      `;
  
      const values = [name, is_active, start_time, end_time, images, id];
  
      const { rows } = await client.query(query, values);
  
      if (!rows.length) {
        return res.status(404).json({ success: false, message: "Amenity not found" });
      }
  
      res.json({ success: true, data: rows[0] });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  const deleteMultipleAmenities = async (req, res) => {
    try {
      const { ids } = req.body; // array of UUIDs
  
      if (!ids || !ids.length) {
        return res.status(400).json({ message: "IDs are required" });
      }
  
      const query = `
        DELETE FROM amenities
        WHERE id = ANY($1::uuid[])
      `;
  
      await client.query(query, [ids]);
  
      res.json({
        success: true,
        message: "Amenities deleted successfully",
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  module.exports = {
    createAmenity,
    getAllAmenities,
    getAmenitiesBySociety,
    updateAmenity,
    deleteMultipleAmenities,
  };

 
