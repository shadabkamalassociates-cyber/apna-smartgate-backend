const { client } = require("../config/client");

const createChargeHead = async (req, res) => {
  try {

    const { society_id, name, amount,charge_type, calculation_type,is_recurring } = req.body;

    const result = await client.query(
      `
      INSERT INTO charge_heads (
       society_id, name, amount,charge_type, calculation_type,is_recurring
      )
      VALUES ($1,$2,$3,$4,$5,$6)
      RETURNING *
      `,
      [
        society_id, name, amount,charge_type, calculation_type,is_recurring
      ]
    );

    return res.status(201).json({
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
  createChargeHead
};