const { client } = require("../config/client");

const getCollectionReport = async (req, res) => {
  try {

    const { society_id } = req.params;

    const result = await client.query(
      `
      SELECT
        COUNT(*) AS total_invoices,
        SUM(total_amount) AS total_amount,
        SUM(paid_amount) AS total_collected,
        SUM(total_amount - paid_amount) AS pending_amount
      FROM invoices
      WHERE society_id = $1
      `,
      [society_id]
    );

    return res.status(200).json({
      success: true,
      data: result.rows[0]
    });

  } catch (error) {

    console.log(error);

    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

module.exports = {
  getCollectionReport
};