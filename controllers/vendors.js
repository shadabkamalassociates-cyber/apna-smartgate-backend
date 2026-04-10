
const { client } = require("../config/client");
const bcrypt = require("bcrypt");
const { generateToken } = require("./common/generateToken");


const createVendorProfile = async (req, res) => {
  try {
    const {
      user_id,
      name,
      phone_1,
      phone_2,
      business_name,
      business_registration_number,
      business_address,
      city,
      state,
      pincode,
      gst_number,
      pan_number,
      years_of_experience,
      website_url,
      description,
      email,
      password
    } = req.body;

    // ✅ Get image path from multer
    const profile_image = req.file ? req.file.path : null;

    console.log(req.body);
    console.log(req.file);

    // 🔎 Validations (same as your code)
    const existingEmail = await client.query(
      `SELECT * FROM vendors WHERE email = $1`,
      [email]
    );

    if (existingEmail.rows.length > 0) {
      return res.status(400).json({ message: "Email already exists" });
    }

    const businessCheck = await client.query(
      `SELECT * FROM vendors WHERE business_registration_number = $1`,
      [business_registration_number]
    );

    if (businessCheck.rows.length > 0) {
      return res.status(400).json({
        message: "Business registration number already exists"
      });
    }

    const existingGst = await client.query(
      `SELECT * FROM vendors WHERE gst_number = $1`,
      [gst_number]
    );
    if (existingGst.rows.length > 0) {
      return res.status(400).json({ message: "GST already exists" });
    }

    const existingPhone1 = await client.query(
      `SELECT * FROM vendors WHERE phone_1 = $1`,
      [phone_1]
    );
    if (existingPhone1.rows.length > 0) {
      return res.status(400).json({ message: "Phone 1 exists" });
    }

    const existingPhone2 = await client.query(
      `SELECT * FROM vendors WHERE phone_2 = $1`,
      [phone_2]
    );
    if (existingPhone2.rows.length > 0) {
      return res.status(400).json({ message: "Phone 2 exists" });
    }

    const existingPan = await client.query(
      `SELECT * FROM vendors WHERE pan_number = $1`,
      [pan_number]
    );
    if (existingPan.rows.length > 0) {
      return res.status(400).json({ message: "PAN exists" });
    }

    const hashPassword = await bcrypt.hash(password, 10);

    // ✅ FIXED QUERY (18 placeholders)
    const result = await client.query(
      `INSERT INTO vendors
      (user_id, business_name, business_registration_number, business_address, profile_image,
       phone_1, phone_2, name,
       city, state, pincode, gst_number, pan_number, 
       years_of_experience, website_url, description, email, password)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)
      RETURNING *`,
      [
        user_id,
        business_name,
        business_registration_number,
        business_address,
        profile_image,
        phone_1,
        phone_2,
        name,
        city,
        state,
        pincode,
        gst_number,
        pan_number,
        years_of_experience,
        website_url,
        description,
        email,
        hashPassword
      ]
    );

    res.status(201).json({
      message: "Vendor profile created successfully",
      vendor: result.rows[0]
    });

  } catch (error) {
    console.log(error);
    res.status(500).json({ error: error.message });
  }
};

const getVendorProfiles = async (req, res) => {
  try {

    const result = await client.query(`
      SELECT 
          vp.id,
          vp.business_name,
          vp.city,
          vp.state,
          vp.pincode,
          vp.gst_number,
          vp.business_name,
          vp.business_registration_number,
          vp.city,
          vp.business_address,
          vp.state,
          vp.pincode,
          vp.pan_number,
        
          vp.years_of_experience,
          vp.website_url,
          vp.description,
          vp.verification_status,
          vp.verification_date,
          vp.created_at,
          u.id AS user_id,
          u.name,
          u.phone,
          u.email
      FROM vendors vp
      LEFT JOIN users u ON vp.user_id = u.id
    `);

    res.json(result.rows);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
const deleteVendorProfile = async (req, res) => {
  try {

    const { id } = req.params;

    const result = await client.query(
      `DELETE FROM vendors
         WHERE id = $1
         RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Vendor profile not found"
      });
    }

    res.json({
      message: "Vendor profile deleted successfully",
      vendor: result.rows[0]
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
const verifyVendor = async (req, res) => {
  try {

    const { id } = req.params;
    const { verification_status } = req.body; // pending | approved | rejected
    const verification_date = new Date();
    const result = await client.query(
      `UPDATE vendors
       SET verification_status = $2,
           verification_date = $3,
           updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [id, verification_status, verification_date]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Vendor not found"
      });
    }

    res.json({
      message: "Vendor status updated successfully",
      vendor: result.rows[0]
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
const getVendorProfileById = async (req, res) => {
  try {

    const { id } = req.params;

    const result = await client.query(
      `SELECT * FROM vendors WHERE id=$1`,
      [id]
    );

    res.json(result.rows[0]);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
const vendorSignin = async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log(email,password)

    const userResult = await client.query(
      "SELECT * FROM vendors WHERE email = $1",
      [email],
    );

    if (userResult.rows.length === 0) {
      return res.status(400).json({ message: "Invalid credentials!" });
    }

    const result = userResult.rows[0];
    
    console.log(result);
    const isMatch = await bcrypt.compare(password, result.password);

    if (!isMatch) {
      return res.status(400).json({ message: "Invalid Password!" });
    }

    const token = generateToken({
      id: result.id,
      role: result.role,
      email: result.email,
    });

  // res.cookie("token", token, {
  //   httpOnly: true,
  //   secure: true,
  //   sameSite: "strict",
  //   maxAge: 30 * 24 * 60 * 60 * 1000, // 1 month
  // });


    res.status(200).json({
      message: "Login successful",
      token,
      user: result,
    });


  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server error" });
  }
};
module.exports = {
  createVendorProfile,
  vendorSignin,
  getVendorProfiles,
  deleteVendorProfile,
  verifyVendor,
  getVendorProfileById
};