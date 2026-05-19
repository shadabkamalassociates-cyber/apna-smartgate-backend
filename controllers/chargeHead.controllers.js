exports.createChargeHead = async (req, res) => {
  try {

    const {
      society_id,
      name,
      default_amount,
      billing_cycle
    } = req.body;

    const result = await pool.query(
      `
      INSERT INTO charge_heads (
        society_id,
        name,
        default_amount,
        billing_cycle,
        active
      )
      VALUES ($1,$2,$3,$4,$5)
      RETURNING *
      `,
      [
        society_id,
        name,
        default_amount,
        billing_cycle,
        true
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