const { client } = require("../config/client");
const path = require("path");

const createVendorService = async (req, res) => {
    try {
      const { vendor_id, name, description, price, category } = req.body;
      const imagesFromBody = req.body?.images;
      const images =
        req.files?.length > 0
          ? req.files.map((f) =>
              path.posix.join("uploads", f.filename),
            )
          : imagesFromBody || [];
      
      const isVendorApproved = await client.query(
        `SELECT * FROM vendors WHERE id = $1 and verification_status = 'approved'`,
        [vendor_id]
      );
      
      if(isVendorApproved.rows.length === 0){
        return res.status(400).json({ message: "Please wait for admin approval" });
      }
      const result = await client.query(
        `INSERT INTO vendor_services (vendor_id, name, description, price, images, category)
         VALUES ($1,$2,$3,$4,$5,$6)
         RETURNING *`,
        [vendor_id, name, description, price, images, category]
      );
  
      res.status(201).json({
        message: "Service created and pending admin approval",
        data: result.rows[0]
      });
  
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
};
const updateVendorService = async (req, res) => {
    try {
      const { id } = req.params;
      const { name, description, price, images,category } = req.body;
  
      const result = await client.query(
        `UPDATE vendor_services
         SET name=$1, description=$2, price=$3, images=$4,category=$5
         WHERE id=$5
         RETURNING *`,
        [name, description, price, images,category, id]
      );
  
      res.json({
        message: "Service updated",
        data: result.rows[0]
      });
  
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
};
const deleteVendorService = async (req, res) => {
    try {
      const { id } = req.params;
  
      await client.query(
        `DELETE FROM vendor_services WHERE id=$1`,
        [id]
      );
  
      res.json({
        message: "Service deleted successfully"
      });
  
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
};
 const getServicesByVendor = async (req, res) => {
    try {
      const { vendor_id } = req.params;
  
      const result = await client.query(
        `SELECT * FROM vendor_services
         WHERE vendor_id = $1`,
        [vendor_id]
      );
  
      res.json(result.rows);
  
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
};
const getServicesByVendorAll = async (req, res) => {
    try {
      const { vendor_id } = req.params;
      
      const isVendorApproved = await client.query(
        `SELECT * FROM vendors WHERE id = $1 and verification_status = 'approved'`,
        [vendor_id]
      );
      
      if(isVendorApproved.rows.length === 0){
        return res.status(400).json({ message: "Not available!" });
      }
      
      const result = await client.query(
        `SELECT * FROM vendor_services
         WHERE vendor_id = $1`,
        [vendor_id]
      );
  
      res.json(result.rows);
  
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
};
const getApprovedServices = async (req, res) => {
  try {
      const { id } = req.params;     
      const { status } = req.body;   
  
      const result = await client.query(
        `UPDATE vendor_services
         SET verification_status = $1
         WHERE id = $2
         RETURNING *`,
        [status, id]
      );
  
      if (result.rows.length === 0) {
        return res.status(404).json({ message: "Service not found" });
      }
  
      res.json({
        message: "Service status updated successfully",
        service: result.rows[0]
      });
  
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
};
const getServiceById = async (req, res) => {
    try {
      const { id } = req.params;
  
      const result = await client.query(
        `SELECT * FROM vendor_services
         WHERE id = $1`,
        [id]
      );
  
      res.json(result.rows[0]);
  
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
};
const getServices = async (req, res) => {
  try {
    const { rows } = await client.query(
      "SELECT * FROM vendor_services WHERE status = 'approved'"
    );

    res.json(rows);
  } catch (error) {
    console.error(error); 
    res.status(500).json({ message: "Server error" });
  }
};
const getServicesByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    const { rows } = await client.query(
      "SELECT * FROM vendor_services WHERE category = $1 AND verification_status = 'approved'",
      [category]
    );
  }
  catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};
const getVendorsByCategory = async (req, res) => {
  const { category } = req.params;

  try {
    const result = await client.query(
      `
      SELECT 
        v.id AS vendor_id,
        v.business_name,
        v.city,
        v.state,
        v.email,
        vs.id AS service_id,
        vs.name AS service_name,
        vs.price,
        vs.category,
        vs.images
      FROM vendor_services vs
      JOIN vendors v ON v.id = vs.vendor_id
      WHERE vs.category = $1
      `,
      [category]
    );

    res.json({
      success: true,
      count: result.rows.length,
      data: result.rows,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
};


module.exports = {
    createVendorService,
    getServicesByCategory,
    updateVendorService,
    deleteVendorService,
    getServicesByVendor,
    getServicesByVendorAll,
    getApprovedServices,
    getVendorsByCategory,
    getServices,
    getServiceById,
  }