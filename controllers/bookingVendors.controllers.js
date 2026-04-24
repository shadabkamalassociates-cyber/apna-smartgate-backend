const { client } = require("../config/client");
const Razorpay = require("razorpay");
const crypto = require("crypto");

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET

});


const bookVendorService = async (req, res) => {
  try {
    const {
      user_id,
      vendor_id,
      service_id,
      booking_date,
      booking_time,
      address,
      amount
    } = req.body;

    if (!user_id || !vendor_id || !service_id || !booking_date || !booking_time || !amount) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    
    const existing = await client.query(
      `SELECT id FROM service_bookings
       WHERE vendor_id = $1
       AND booking_date = $2
       AND booking_time = $3
       AND status IN ('pending', 'confirmed')`,
      [vendor_id, booking_date, booking_time]
    );

    if (existing.rows.length > 0) {
      return res.status(409).json({
        message: "Vendor already booked for this time slot"
      });
    }

    // 🧾 Create booking
    const bookingRes = await client.query(
      `INSERT INTO service_bookings
       (user_id, vendor_id, service_id, booking_date, booking_time, address, status, amount)
       VALUES ($1,$2,$3,$4,$5,$6,'pending',$7)
       RETURNING *`,
      [user_id, vendor_id, service_id, booking_date, booking_time, address, amount]
    );

    const booking = bookingRes.rows[0];

    // 💳 Create payment entry
    const paymentRes = await client.query(
      `INSERT INTO payments (booking_id, amount, status, payment_gateway)
       VALUES ($1, $2, 'pending', 'razorpay')
       RETURNING *`,
      [booking.id, amount]
    );

    res.status(201).json({
      message: "Booking created. Proceed to payment",
      booking,
      payment: paymentRes.rows[0]
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};


const createPaymentOrder = async (req, res) => {
  try {
    const { booking_id } = req.body;
    
    const booking = await client.query(
      `SELECT amount FROM service_bookings WHERE id = $1`,
      [booking_id]
    );

    if (!booking.rows.length) {
      return res.status(404).json({ message: "Booking not found" });
    }

    const amount = booking.rows[0].amount;

    const options = {
      amount: amount , 
      currency: "INR",
      receipt: `bk_${booking_id}`,
    };

    const order = await razorpay.orders.create(options);

    // save order_id in payments table
    console.log(order,"+++++++++++++++++");
    const a = await client.query(
      `UPDATE payments
       SET gateway_order_id = $1
       WHERE booking_id = $2`,
      [order.id, booking_id]
    );



    res.json({
      message: "Order created",
      order
    });

  } catch (err) {
    console.log(err);
    res.status(500).json({ message: err.message });
  }
};



const verifyPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      booking_id
    } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ message: "Missing payment data" });
    }

    const generated_signature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    console.log("Generated:", generated_signature);
    console.log("Received :", razorpay_signature);

    if (generated_signature !== razorpay_signature) {
      await client.query(
        `UPDATE payments 
         SET status = 'failed', updated_at = CURRENT_TIMESTAMP 
         WHERE booking_id = $1`,
        [booking_id]
      );

      return res.status(400).json({ message: "Invalid signature" });
    }

    // ✅ Success: update payment
    await client.query(
      `UPDATE payments
       SET status = 'success',
           gateway_payment_id = $1,
           gateway_signature = $2,
           updated_at = CURRENT_TIMESTAMP
       WHERE booking_id = $3`,
      [razorpay_payment_id, razorpay_signature, booking_id]
    );

    // ✅ Confirm booking
    await client.query(
      `UPDATE service_bookings
       SET status = 'confirmed'
       WHERE id = $1`,
      [booking_id]
    );

    return res.json({
      success: true,
      message: "Payment verified & booking confirmed"
    });

  } catch (err) {
    console.error("Verify Error:", err);
    res.status(500).json({ message: err.message });
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
  createPaymentOrder,

  getVendorBookings,
  getResidentBookings
};