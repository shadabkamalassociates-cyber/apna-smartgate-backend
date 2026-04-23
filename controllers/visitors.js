const { client } = require("../config/client");

const visitorsValidation = async (req, res) => {
  try {
    const { vehicleInfo, number } = req.body;
    if (!vehicleInfo) {
      res
        .status(400)
        .json({ success: false, message: "Vehcile information is required!" });
    }
    if (!number) {
      res.status(400).json({
        success: false,
        message: "Phone number is required!",
      });
    }

    const vehicleInfoCheck = await client.query(
      `SELECT id FROM visitors WHERE vehicleInfo = $1 LIMIT 1`,
      [vehicleInfo],
    );

    if (!vehicleInfoCheck) {
      res.status(400).json({
        success: false,
        message: "Vehcile already exist!",
      });
    }

    const numberCheck = await client.query(
      `SELECT id FROM visitors WHERE number = $1 LIMIT 1`,
      [vehicleInfo],
    );

    if (!numberCheck) {
      res.status(400).json({
        success: false,
        message: "Number already exist!",
      });
    }

    res.json({
      message: "All fields are valid.",
      success: true,
    });
  } catch (error) {
    console.log(error);
    res.status(5000).json({
      message: "Server error!",
      success: false,
    });
  }
};
const getAllVisitors = async (req, res) => {
  try {
    const result = await client.query(`
      SELECT 
json_build_object(
  'id', v.id,
  'name', v.name,
  'phone', v.phone,
  'vehicleinfo', v.vehicleinfo,

  'resident', json_build_object(
      'name', u.name,
      'email', u.email,
      'phone', u.phone,
      'flat', json_build_object(
          'flat_number', f.flat_number,
          'floor', f.floor
      ),
      'society', json_build_object(
          'name', s.name,
          'address', s.address
      ) 
  ),

  'attendance', json_build_object(
      'check_in', va.check_in,
      'check_out', va.check_out,
      'status', va.status
  )

) AS visitor

FROM visitors v

LEFT JOIN visitor_attendance va 
  ON v.id = va.visitor_id   -- 🔥 IMPORTANT FIX

LEFT JOIN users u 
  ON va.resident_id = u.id  -- 🔥 CORRECT JOIN

LEFT JOIN flats f 
  ON u.flat_id = f.id

LEFT JOIN societies s 
  ON u.society_id = s.id

ORDER BY v.id DESC;
    `);

    res.json({
      success: true,
      data: result.rows.map((r) => r.visitor),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};
const fetchVisitorsBySociety = async (req, res) => {
  try {
    const { societyId } = req.params;

    const result = await client.query(
      `SELECT 
   va.*,
   f.flat_number,
   f.floor,
   v.name,
   v.phone,
   v.vehicleinfo
FROM visitor_attendance va 
JOIN flats f
   ON va.flat_id = f.id 
  JOIN visitors v
   ON va.visitor_id = v.id
WHERE va.society_id = $1;`,
      [societyId],
    );

    res.status(200).json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    console.error("ERROR:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};
const getVisitorById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await client.query(
      "SELECT * FROM visitor_attendance WHERE id = $1",
      [id],
    );
    if (result.rows.length === 0)
      return res.status(404).send("Visitor not found");
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};
const createVisitor = async (req, res) => {
  try {
    const { name, phone, vehicleinfo, flat_id, check_in, societyId } = req.body;

    if (!name || !phone || !flat_id || !societyId) {
      return res.status(400).json({
        success: false,
        message: "Name, phone, flat_id and societyId are required",
      });
    }

    // 1️⃣ Create visitor profile
    const visitorResult = await client.query(
      `INSERT INTO visitors (name, phone, vehicleinfo)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [name, phone, vehicleinfo || null]
    );

    const visitor = visitorResult.rows[0];

    // 2️⃣ Create attendance record
    const attendanceResult = await client.query(
      `INSERT INTO visitor_attendance 
       (check_in, visitor_id, status, flat_id, society_id)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [check_in || new Date(), visitor.id, "waiting", flat_id, societyId]
    );

    const attendance = attendanceResult.rows[0];

    return res.status(201).json({
      success: true,
      message: "Visitor created successfully",
      data: {
        id: attendance.id,
        check_in: attendance.check_in,
        check_out: attendance.check_out,
        status: attendance.status,
        society_id: attendance.society_id,
        visitor: {
          id: visitor.id,
          name: visitor.name,
          phone: visitor.phone,
          vehicleinfo: visitor.vehicleinfo
        },
      },
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};
const reEnteryVisitor = async (req, res) => {
  try {
    const { visitor_id, flat_id,societyId } = req.body;
    if(!societyId){
      return res.status(400).json({
        success: false,
        message: "Society ID is required visitor_id, flat_id and societyId are required",
      });
    }
    const result = await client.query(
      `INSERT INTO visitor_attendance 
      (visitor_id, check_in, flat_id, society_id)
      VALUES ($1, NOW(), $2, $3)
      RETURNING *`,
      [visitor_id, resident_id, societyId],
    );

    res.status(201).json({
      success: true,
      message: "Visitor check-in created successfully",
      data: result.rows[0],
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};
const updateVisitor = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, phone, vehicleinfo, flat_id } = req.body;
    const result = await client.query(
      "UPDATE visitors SET name=$1, phone=$2, vehicleinfo=$3, flat_id=$4 WHERE id=$5 RETURNING *",
      [name, phone, vehicleinfo, flat_id, id],
    );
    if (result.rows.length === 0)
      return res.status(404).send("Visitor not found");
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};
const deleteVisitor = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await client.query(
      "DELETE FROM visitors WHERE id=$1 RETURNING *",
      [id],
    );
    if (result.rows.length === 0)
      return res.status(404).send("Visitor not found");
    res.json({ message: "Visitor deleted successfully" });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};
const getVisitorsByResident = async (req, res) => {
  try {
    const { flat_id } = req.params;

    const residentCheck = await client.query(
      "SELECT id FROM flats WHERE id = $1",
      [flat_id],
    );

    if (residentCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Flat not found",
      });
    }

    const attendanceResult = await client.query(
      "SELECT * FROM visitor_attendance WHERE flat_id = $1",
      [flat_id],
    );

    const attendanceData = attendanceResult.rows;

    if (attendanceData.length === 0) {
      return res.status(200).json({
        success: true,
        message: "No visitors found",
        data: [],
      });
    }

    const visitorsData = [];

    for (let record of attendanceData) {
      const visitorResult = await client.query(
        "SELECT * FROM visitors WHERE id = $1",
        [record.visitor_id],
      );

      const visitor = visitorResult.rows[0];

      visitorsData.push({
        id: record.id,
        check_in: record.check_in,
        check_out: record.check_out,
        status: record.status,
        visitor: visitor
          ? {
              id: visitor.id,
              name: visitor.name,
              phone: visitor.phone,
              vehicleinfo: visitor.vehicleinfo,
              flat_id: visitor.flat_id,
            }
          : null,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Visitors fetched successfully",
      data: visitorsData,
    });               
  } catch (err) {
    console.error("Get Visitors Error:", err);
    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

module.exports = {
  visitorsValidation,
  getVisitorsByResident,
  getAllVisitors,
  getVisitorById,
  reEnteryVisitor,
  fetchVisitorsBySociety,
  createVisitor,
  updateVisitor,
  deleteVisitor,
};
