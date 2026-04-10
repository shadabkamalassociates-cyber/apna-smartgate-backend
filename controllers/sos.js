const { client } = require("../config/client");

const createSOS = async (req,res) => {
    try {
        const {
          society_id,
          title,
           flat_id,             
          description,
          priority,
          alert_type,
          created_by        
        } = req.body;
        
        console.log(req.body,"||||||||||||||||||||||");              
        
        const query = `
        INSERT INTO sos_alerts (society_id, flat_id, title, description, created_by, priority, alert_type)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
        `;
        
        const { rows } = await client.query(query, [
          society_id,
           flat_id   ,
          title,
          description,
          created_by,
          priority,
          alert_type,
        ]);

        res.status(201).json({
            success:true,
            message:"Success created.",
            data:rows[0]
        })
    } catch (error) {
        console.log(error)
        res.status(500).json({message:"Server error!",success:false})
    }
}                         
const updateSOS = async (req,res)=>{
    try {
        const {id} = req.params;
        const {status, resolved_at, resolution_notes} = req.body;

        const query = `
            UPDATE sos_alerts 
            SET status = $1
            ,updated_at = NOW()
            resolved_at = $2
            resolution_notes = $3
            WHERE id = $4
            RETURNING *
        `;

        const {rows} = await client.query(query, [status, resolved_at, resolution_notes, id])

        if(rows.length === 0){
            res.status(404).json({message:"SOS not found!",success:false})
        }

        res.json({message:"SOS updates successfully.",success:true,data:rows[0]})


    } catch (error) {
        res.status(500).json({message:"Server error!",success:false})
    }
}
const fetchAll = async (req, res) => {
  try {
    const result = await client.query(`SELECT * FROM post`);

    res.status(200).json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};
const deleteSOS = async (req, res) => {
  try {
    const { id } = req.params;

    const query = `
      DELETE FROM sos_alerts
      WHERE id = $1
      RETURNING *
    `;

    const { rows } = await client.query(query, [id]);

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: "SOS not found" });
    }

    res.json({
      success: true,
      message: "SOS deleted successfully"
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
const getSOSBySociety = async (req, res) => {
  try {
    const { society_id } = req.params;

   const query = `
  SELECT 
    s.id,
    s.title,
    s.description,
    s.status,
    s.created_at,

    json_build_object(
      'id', soc.id,
      'name', soc.name
    ) AS society,

    json_build_object(
      'id', u.id,
      'name', u.name,
      'email', u.email
    ) AS created_by,

    json_build_object(
      'id', f.id,
      'flat_number', f.flat_number,
      'floor', f.floor
    ) AS flat
        
  FROM sos_alerts s
  LEFT JOIN societies soc 
    ON s.society_id = soc.id
  LEFT JOIN users u 
    ON s.created_by = u.id
  LEFT JOIN flats f
    ON s.flat_id = f.id
  WHERE s.society_id = $1
  ORDER BY s.created_at DESC
`;
    const { rows } = await client.query(query, [society_id]);

    res.json({
      success: true,
      data: rows,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
const getSOSByUser = async (req, res) => {
  try {
    const { id } = req.params;

    const query = `
      SELECT * FROM sos_alerts
      WHERE created_by = $1
      ORDER BY created_at DESC
    `;

    const { rows } = await client.query(query, [id]);

    res.json({ success: true, data: rows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
const getSOSByStatus = async (req, res) => {
  try {
    const { status } = req.params;

    const query = `
      SELECT * FROM sos_alerts
      WHERE status = $1
      ORDER BY created_at DESC
    `;

    const { rows } = await client.query(query, [status]);

    res.json({ success: true, data: rows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};


module.exports = {
  createSOS,
  updateSOS,
  deleteSOS,
  fetchAll,
  getSOSBySociety,
  getSOSByUser,
  getSOSByStatus,
};