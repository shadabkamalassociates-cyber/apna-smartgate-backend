const { client } = require("../config/client");

// const createBlock = async (req, res) => {
//   try {
//     const { society_id, name } = req.body;

//     if (!society_id || !name) {
//       return res
//         .status(400)
//         .json({ message: "Society ID and block name are required" });
//     }

//     const result = await client.query(
//       `INSERT INTO blocks (society_id, name)
//        VALUES ($1, $2)
//        RETURNING *`,
//       [society_id, name],
//     );

//     res.status(201).json({
//       message: "Block created successfully",
//       data: result.rows[0],
//     });
//   } catch (error) {
//     res
//       .status(500)
//       .json({ message: "Failed to create block", error: error.message });
//   }
// };
const createBlock = async (req, res) => {
  try {
    const { society_id, blocks } = req.body;
    console.log(req.body,"||||||||||||||||||||||");
    if (!society_id || !Array.isArray(blocks) || blocks.length === 0) {
      return res.status(400).json({
        message: "Society ID and blocks array are required",
      });
    }

    // check society exists
    const society = await client.query(
      "SELECT id FROM societies WHERE id = $1",
      [society_id]
    );

    if (society.rows.length === 0) {
      return res.status(404).json({
        message: "Society not found",
      });
    }

    const result = await client.query(
      `INSERT INTO blocks (society_id, name)
       SELECT $1, UNNEST($2::text[])
       ON CONFLICT (society_id, name) DO NOTHING
       RETURNING *`,
      [society_id, blocks]
    );

    res.status(201).json({
      message: "Blocks created successfully",
      data: result.rows,
    });

  } catch (error) {
    res.status(500).json({
      message: "Failed to create blocks",
      error: error.message,
    });
  }
};
const updateBlock = async (req, res) => {
  try {
    const { id } = req.params;                                                                                                                                                                                                  
    const { name } = req.body;

    const result = await client.query(
      `UPDATE blocks
       SET name = $1
       WHERE id = $2
       RETURNING *`,
      [name, id],
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Block not found" });
    }

    res.json({
      message: "Block updated successfully",
      data: result.rows[0],
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to update block", error: error.message });
  }
};

const deleteBlock = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await client.query(
      `DELETE FROM blocks WHERE id = $1 RETURNING *`,
      [id],
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Block not found" });
    }

    res.json({
      message: "Block deleted successfully",
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to delete block", error: error.message });
  }
};

const fetchBlocksBySociety = async (req, res) => {
  try {
    const  societyId  = req.params.id;

    if (!societyId) {
      return res.status(400).json({
        success: false,
        message: "Society ID is required",
      });
    }

    const query = `
      SELECT * FROM blocks
      WHERE society_id = $1
      ORDER BY created_at DESC
    `;

    const result = await client.query(query, [societyId]);

    res.status(200).json({
      success: true,
      count: result.rows.length,
      data: result.rows,
    });
  } catch (error) {
    console.error("Fetch Blocks Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch blocks",
    });
  }
};


module.exports = {
  createBlock,
  updateBlock,
  deleteBlock,
  fetchBlocksBySociety,
};