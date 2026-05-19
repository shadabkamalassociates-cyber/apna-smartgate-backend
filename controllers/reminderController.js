
exports.sendDueReminders = async (req, res) => {
  try {

    const invoices = await pool.query(
      `
      SELECT i.*, u.name, u.mobile
      FROM invoices i
      JOIN users u
      ON i.resident_id = u.id
      WHERE i.status IN ('PENDING','PARTIAL')
      `
    );

    for (const invoice of invoices.rows) {

      const message = `
        Hello ${invoice.name},
        Your maintenance bill of ₹${invoice.total_amount}
        is pending.
        Please pay before due date.
      `;

      console.log(message);

      // WhatsApp API integration here
    }

    return res.status(200).json({
      success: true,
      message: 'Reminders sent successfully'
    });

  } catch (error) {

    console.log(error);

    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};