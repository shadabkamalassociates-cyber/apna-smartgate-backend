const { client } = require("../config/client");

// const createFlat = async (req, res) => {
//   try {
//     const { society_id, block_id, flat_number, floor, owner_id, status } = req.body;

//     if (!society_id || !block_id || !flat_number) {
//       return res.status(400).json({
//         message: "Society ID, Block ID and Flat number are required",
//       });
//     }

//     const result = await client.query(
//       `INSERT INTO flats
//       (society_id, block_id, flat_number, floor, owner_id, sta mm
//       RETURNING *`,
//       [
//         society_id,
//         block_id,
//         flat_number,
//         floor || null,
//         owner_id || null,
//         status || "ACTIVE",
//       ],
//     );

//     res.status(201).json({
//       message: "Flat created successfully",
//       data: result.rows[0],
//     });
//   } catch (error) {
//     res
//       .status(500)
//       .json({ message: "Failed to create flat", error: error.message });
//   }
// };

const createFlat = async (req, res) => {
  try {
    const { society_id, block_id, floors } = req.body;

    const {rows} = await client.query(
      "SELECT name FROM blocks WHERE id = $1",
      [block_id]
    );
   
    const block_name = rows[0].name
  
    const result = await client.query(
      `
      INSERT INTO flats (society_id, block_id, flat_number, floor, status)
      SELECT
        $1,
        $2,
        CONCAT($4::text, f.floor, LPAD(gs.flat::text, 2, '0')),
        f.floor,
        'ACTIVE'
      FROM jsonb_to_recordset($3::jsonb) AS f(floor INT, flats INT)
      JOIN LATERAL generate_series(1, f.flats) AS gs(flat) ON true
      RETURNING *;
      `,
      [society_id, block_id, JSON.stringify(floors), block_name || ""]
    );

    res.status(201).json({
      message: "Flats created successfully",
      total: result.rowCount,
      data: result.rows
    });

  } catch (error) {
    res.status(500).json({
      message: "Error creating flats",
      error: error.message
    });
  }
};
const updateFlat = async (req, res) => {
  try {
    const { id } = req.params;
    const { flat_number, floor, owner_id, status } = req.body;

    const result = await client.query(
      `UPDATE flats

       SET flat_number = $1,
           floor = $2,
           owner_id = $3,
           status = $4
       WHERE id = $5
       RETURNING *`,
      [flat_number, floor, owner_id, status, id],
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Flat not found" });
    }

    res.json({
      message: "Flat updated successfully",
      data: result.rows[0],
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to update flat", error: error.message });
  }
};

const deleteFlat = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await client.query(
      `DELETE FROM flats WHERE id = $1 RETURNING *`,
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Flat not found" });
    }

    res.json({
      message: "Flat deleted successfully",
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete flat", error: error.message });
  }
};

const fetchFlatByBlocks = async (req,res)=>{
  try {
    const {id} = req.params
    const result = await client.query(`
      SELECT * FROM flats WHERE block_id = $1
      `,[id]);
    const data = result.rows

    res.json({data})
  } catch (error) {
    console.log(error)
  }
}

const filterHierarchy = async (req, res) => {
  try {
    let { admin_id, society_id, block_id } = req.body;

    admin_id = admin_id?.trim();
    society_id = society_id?.trim();
    block_id = block_id?.trim();

    // flats
    if (admin_id && society_id && block_id) {
      const flats = await client.query(
        `SELECT id, flat_number, floor, status
         FROM flats
         WHERE block_id = $1
         ORDER BY floor, flat_number`,
        [block_id]
      );

      return res.json({
        type: "flats",
        total: flats.rowCount,
        data: flats.rows
      });
    }

    // blocks
    if (admin_id && society_id) {
      const blocks = await client.query(
        `SELECT id, name
         FROM blocks
         WHERE society_id = $1
         ORDER BY name`,
        [society_id]
      );

      return res.json({
        type: "blocks",
        total: blocks.rowCount,
        data: blocks.rows
      });
    }

    // societies
    if (admin_id) {
      const societies = await client.query(
        `SELECT id, name
         FROM societies
         WHERE created_by_admin = $1
         ORDER BY name`,
        [admin_id]
      );

      return res.json({
        type: "societies",
        total: societies.rowCount,
        data: societies.rows
      });
    }

  } catch (error) {
    res.status(500).json({
      message: "Error fetching data",
      error: error.message
    });
  }
};


module.exports = { deleteFlat, updateFlat, createFlat, fetchFlatByBlocks,filterHierarchy };