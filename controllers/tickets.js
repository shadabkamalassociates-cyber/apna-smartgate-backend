const { client } = require("../config/client");

const createTicket = async (req, res) => {
  try {
    const {
      title,
      description,
      created_by_admin,
      created_by_resident
    } = req.body;

    // Get uploaded files
    const imagePaths = req.files
      ? req.files.map(file => file.path)
      : [];

    const result = await client.query(
      `INSERT INTO tickets 
      (title, description, created_by_admin, created_by_resident, images)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *`,
      [title, description, created_by_admin, created_by_resident, imagePaths]
    );

    res.status(201).json({
      message: "Ticket created",
      data: result.rows[0]
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
  
const replyTicket = async (req, res) => {
  try {
    const ticket_id = req.params.id;
    const {
      
      message,
      replied_by_admin,
      replied_by_resident
    } = req.body;

    const result = await client.query(
      `INSERT INTO ticket_replies
      (ticket_id, message, replied_by_admin, replied_by_resident)
      VALUES ($1, $2, $3, $4)
      RETURNING *`,
      [ticket_id, message, replied_by_admin, replied_by_resident]
    );

    res.status(201).json({
      message: "Reply added",
      data: result.rows[0]
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getTickets = async (req, res) => {
  try {
    const result = await client.query(
      `SELECT * FROM tickets`
    );
    res.status(200).json({
      message: "Tickets fetched",
      data: result.rows
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getTicketById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `SELECT * FROM tickets WHERE id = $1`,
      [id]
    );
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getTicketReplies = async (req, res) => {
  try {
    const { ticket_id } = req.params;
    const result = await pool.query(
      `SELECT * FROM ticket_replies WHERE ticket_id = $1`,
      [ticket_id]
    );
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getTicketRepliesByResident= async (req, res) => {
  try {
    const { id } = req.params;
    const result = await client.query(
      `SELECT * FROM ticket_replies WHERE replied_by_resident = $1 ORDER BY created_at DESC`,
      [id]
    );
    res.status(200).json({
      message: "Ticket replies fetched",
      data: result.rows
    })
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getTicketRepliesByAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `SELECT * FROM ticket_replies WHERE replied_by_admin = $1 ORDER BY created_at DESC`,
      [id]
    );
    res.status(200).json({
      message: "Ticket replies fetched",
      data: result.rows
    })
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  createTicket,
  replyTicket,
  getTickets,
  getTicketById,
  getTicketReplies,
  getTicketRepliesByResident,
  getTicketRepliesByAdmin
};