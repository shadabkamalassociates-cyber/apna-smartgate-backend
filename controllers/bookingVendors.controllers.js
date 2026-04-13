const { client } = require("../config/client");

const bookVendorService = async (req, res) => {
    try {
      const {
        user_id,
        vendor_id,
        service_id,
        booking_date,
        booking_time,
        address
      } = req.body;
  
      if (!user_id || !vendor_id || !service_id || !booking_date || !booking_time) {
        return res.status(400).json({
          message: "Missing required fields"
        });
      }
  
      const resident = await client.query(
        "SELECT id FROM users WHERE id = $1",
        [user_id]
      );
  
      if (resident.rows.length === 0) {
        return res.status(404).json({ message: "Resident not found" });
      }
  
      const vendor = await client.query(
        "SELECT id FROM vendors WHERE id = $1",
        [vendor_id]
      );
  
      if (vendor.rows.length === 0) {
        return res.status(404).json({ message: "Vendor not found" });
      }
  
      const existingBooking = await client.query(
        `SELECT id FROM service_bookings
         WHERE vendor_id = $1
         AND booking_date = $2
         AND booking_time = $3`,
        [vendor_id, booking_date, booking_time]
      );
  
      if (existingBooking.rows.length > 0) {
        return res.status(409).json({
          message: "Vendor already booked for this time slot"
        });
      }
  
      // 5️⃣ Insert booking
      const result = await client.query(
        `INSERT INTO service_bookings
         (user_id, vendor_id, service_id, booking_date, booking_time, address)
         VALUES ($1,$2,$3,$4,$5,$6)
         RETURNING *`,
        [user_id, vendor_id, service_id, booking_date, booking_time, address]
      );
  
      res.status(201).json({
        message: "Service booked successfully",
        booking: result.rows[0]
      });
  
    } catch (error) {
      console.error(error);
      res.status(500).json({
        message: "Internal server error",
        error: error.message
      });
    }
};

const getResidentBookings = async (req, res) => {
    try {
      const  user_id  = req.params.id;
  
      const result = await client.query(
        `SELECT sb.*, vs.name, vs.price, v.name as vendor_name
         FROM service_bookings sb
         JOIN vendor_services vs
         ON sb.service_id = vs.id
         JOIN vendors v
         ON sb.vendor_id = v.id
         WHERE sb.user_id = $1
         ORDER BY sb.created_at DESC`,
        [user_id]
      );
      res.json(result.rows);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
};

const getVendorBookings = async (req, res) => {
  try {
    const vendor_id = req.params.id;
    
    const result = await client.query(
      //  `SELECT *
      //   FROM service_bookings
      //   WHERE vendor_id = $1 
      //   `,
      `SELECT 
        service_bookings.id AS booking_id,
        service_bookings.booking_date AS booking_date,
        service_bookings.booking_time AS booking_time,
        service_bookings.address AS address,
        service_bookings.status AS status,
        service_bookings.created_at AS created_at,
        vendor_services.name AS service_name,
        vendor_services.price AS service_price,
        vendors.name AS vendor_name,
        users.name AS user_name,
        users.phone AS user_phone,
        flats.flat_number AS flat_number,
        flats.floor AS floor,
        societies.name AS society_name,
        blocks.name AS block_name
        FROM service_bookings
        INNER JOIN vendor_services ON service_bookings.service_id = vendor_services.id
        INNER JOIN vendors ON service_bookings.vendor_id = vendors.id
        INNER JOIN users ON service_bookings.user_id = users.id
        INNER JOIN flats ON users.flat_id = flats.id
        INNER JOIN societies ON flats.society_id = societies.id
        INNER JOIN blocks ON flats.block_id = blocks.id
        WHERE vendors.id = $1`,
       [vendor_id]
    );
  
    res.json(result.rows);
  
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
};

const fetchAllBookings = async (req, res) => {
    try {
      const { rows } = await client.query(`
        SELECT 
          sb.*,
          vs.name AS service_name,
          vs.price
        FROM service_bookings sb
        JOIN vendor_services vs
        ON sb.service_id = vs.id
        ORDER BY sb.created_at DESC
      `);
  
      res.json({
        success: true,
        bookings: rows
      });
  
    } catch (error) {
      console.log(error);
      res.status(500).json({
        message: "Server error!",
        success: false
      });
    }
};

module.exports = {
  bookVendorService,
  fetchAllBookings,
  getVendorBookings,
  getResidentBookings
};