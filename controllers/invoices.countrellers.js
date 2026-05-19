const generateMonthlyInvoices = async (req, res) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const { society_id, billing_month, due_date } = req.body;

    const residentsQuery = await client.query(
      `
      SELECT id
      FROM users
      WHERE society_id = $1
      AND role = 'RESIDENT'
      `,
      [society_id]
    );

    const chargeHeadsQuery = await client.query(
      `
      SELECT *
      FROM charge_heads
      WHERE society_id = $1
      AND active = true
      `,
      [society_id]
    );

    for (const resident of residentsQuery.rows) {

      let subtotal = 0;

      for (const charge of chargeHeadsQuery.rows) {
        subtotal += Number(charge.default_amount);
      }

      const total = subtotal;

      const invoiceResult = await client.query(
        `
        INSERT INTO invoices (
          society_id,
          resident_id,
          invoice_number,
          billing_month,
          due_date,
          subtotal,
          total_amount,
          status
        )
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
        RETURNING *
        `,
        [
          society_id,
          resident.id,
          `INV-${Date.now()}`,
          billing_month,
          due_date,
          subtotal,
          total,
          'PENDING'
        ]
      );

      const invoice = invoiceResult.rows[0];

      for (const charge of chargeHeadsQuery.rows) {

        await client.query(
          `
          INSERT INTO invoice_items (
            invoice_id,
            charge_head_id,
            description,
            amount,
            tax
          )
          VALUES ($1,$2,$3,$4,$5)
          `,
          [
            invoice.id,
            charge.id,
            charge.name,
            charge.default_amount,
            0
          ]
        );
      }

      await client.query(
        `
        INSERT INTO ledgers (
          resident_id,
          invoice_id,
          transaction_type,
          debit,
          credit,
          balance
        )
        VALUES ($1,$2,$3,$4,$5,$6)
        `,
        [
          resident.id,
          invoice.id,
          'INVOICE',
          total,
          0,
          total
        ]
      );
    }

    await client.query('COMMIT');

    return res.status(201).json({
      success: true,
      message: 'Invoices generated successfully'
    });

  } catch (error) {

    await client.query('ROLLBACK');

    console.log(error);

    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });

  } finally {
    client.release();
  }
};

const getResidentInvoices = async (req, res) => {
  try {

    const { resident_id } = req.params;

    const invoices = await pool.query(
      `
      SELECT *
      FROM invoices
      WHERE resident_id = $1
      ORDER BY created_at DESC
      `,
      [resident_id]
    );

    return res.status(200).json({
      success: true,
      data: invoices.rows
    });

  } catch (error) {

    console.log(error);

    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

const getInvoiceById = async (req, res) => {
  try {

    const { invoice_id } = req.params;

    const invoice = await pool.query(
      `
      SELECT *
      FROM invoices
      WHERE id = $1
      `,
      [invoice_id]
    );

    const items = await pool.query(
      `
      SELECT ii.*, ch.name AS charge_head_name
      FROM invoice_items ii
      LEFT JOIN charge_heads ch
      ON ii.charge_head_id = ch.id
      WHERE ii.invoice_id = $1
      `,
      [invoice_id]
    );

    return res.status(200).json({
      success: true,
      data: {
        invoice: invoice.rows[0],
        items: items.rows
      }
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
  generateMonthlyInvoices,
  getResidentInvoices,
  getInvoiceById
};