const { client } = require("../config/client");

const generateMonthlyInvoices = async (req, res) => {

  // const client = await pool.connect();

  try {

    // await client.query("BEGIN");

    const {
      society_id,
      resident_ids,
      billing_month,
      due_date,
      invoice_type = "MAINTENANCE",
      notes = "",
      generated_by
    } = req.body;

    // ================================
    // VALIDATIONS
    // ================================

    if (!society_id) {
      return res.status(400).json({
        success: false,
        message: "society_id is required"
      });
    }

    if (
      !resident_ids ||
      !Array.isArray(resident_ids) ||
      resident_ids.length === 0
    ) {
      return res.status(400).json({
        success: false,
        message: "resident_ids is required"
      });
    }

    // ================================
    // CHECK RESIDENTS BELONG TO SOCIETY
    // ================================

    const residentsQuery = await client.query(
      `
      SELECT id
      FROM users
      WHERE society_id = $1
      AND id = ANY($2::uuid[])
      `,
      [society_id, resident_ids]
    );

    if (
      residentsQuery.rows.length !== resident_ids.length
    ) {

      // await client.query("ROLLBACK");

      return res.status(400).json({
        success: false,
        message:
          "Some residents do not belong to this society"
      });
    }

    // ================================
    // FETCH ACTIVE CHARGE HEADS
    // ================================

    const chargeHeadsQuery = await client.query(
      `
      SELECT *
      FROM charge_heads
      WHERE society_id = $1
      AND active = true
      `,
      [society_id]
    );

    if (chargeHeadsQuery.rows.length === 0) {

      // await client.query("ROLLBACK");
// 
      return res.status(400).json({
        success: false,
        message: "No active charge heads found"
      });
    }

    const generatedInvoices = [];

    // ================================
    // LOOP RESIDENTS
    // ================================

    for (const resident of residentsQuery.rows) {

      // ================================
      // CHECK DUPLICATE INVOICE
      // ================================

      const existingInvoice = await client.query(
        `
        SELECT id
        FROM invoices
        WHERE resident_id = $1
        AND billing_month = $2
        AND invoice_type = $3
        LIMIT 1
        `,
        [
          resident.id,
          billing_month,
          invoice_type
        ]
      );

      if (existingInvoice.rows.length > 0) {
        continue;
      }

      // ================================
      // CALCULATE TOTAL
      // ================================

      let subtotal = 0;

      for (const charge of chargeHeadsQuery.rows) {

        subtotal += Number(charge.amount);
      }

      const penalty = 0;
      const tax = 0;

      const total_amount =
        subtotal + penalty + tax;

      // ================================
      // GENERATE INVOICE NUMBER
      // ================================

      const invoiceNumber =
        `INV-${Date.now()}-${resident.id.slice(0,5)}`;

      // ================================
      // CREATE INVOICE
      // ================================

      const invoiceResult = await client.query(
        `
        INSERT INTO invoices (
          society_id,
          resident_id,
          invoice_number,
          billing_month,
          due_date,
          subtotal,
          penalty,
          tax,
          total_amount,
          status,
          invoice_type,
          notes,
          generated_by
        )
        VALUES (
          $1,$2,$3,$4,$5,
          $6,$7,$8,$9,$10,
          $11,$12,$13
        )
        RETURNING *
        `,
        [
          society_id,
          resident.id,
          invoiceNumber,
          billing_month,
          due_date,
          subtotal,
          penalty,
          tax,
          total_amount,
          "PENDING",
          invoice_type,
          notes,
          generated_by
        ]
      );

      const invoice = invoiceResult.rows[0];

      // ================================
      // CREATE INVOICE ITEMS
      // ================================

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
            charge.amount,
            0
          ]
        );
      }

      // ================================
      // FETCH PREVIOUS BALANCE
      // ================================

      const balanceResult = await client.query(
        `
        SELECT balance
        FROM ledgers
        WHERE resident_id = $1
        ORDER BY created_at DESC
        LIMIT 1
        `,
        [resident.id]
      );

      const previousBalance =
        balanceResult.rows.length > 0
          ? Number(balanceResult.rows[0].balance)
          : 0;

      const newBalance =
        previousBalance + total_amount;

      // ================================
      // CREATE LEDGER ENTRY
      // ================================

      await client.query(
        `
        INSERT INTO ledgers (
          resident_id,
          invoice_id,
          transaction_type,
          debit,
          credit,
          balance,
          reference_type,
          reference_id,
          remarks
        )
        VALUES (
          $1,$2,$3,$4,$5,
          $6,$7,$8,$9
        )
        `,
        [
          resident.id,
          invoice.id,
          "INVOICE",
          total_amount,
          0,
          newBalance,
          "INVOICE",
          invoice.id,
          `Invoice generated for ${billing_month}`
        ]
      );

      generatedInvoices.push(invoice);
    }

    // await client.query("COMMIT");

    return res.status(201).json({
      success: true,
      message: "Invoices generated successfully",
      total_generated: generatedInvoices.length,
      data: generatedInvoices
    });

  } catch (error) {

    // await client.query("ROLLBACK");

    console.log(error);

    return res.status(500).json({
      success: false,
      message: error.message
    });

  } finally {

    client.release();
  }
};

const getResidentInvoices = async (req, res) => {
  try {

    const { resident_id } = req.params;

    const invoices = await client.query(
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



const fetchAllInvoices = async (req, res)=>{
  try {
    const invoices = await client.query(
      `
      SELECT *
      FROM invoices
      `
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
}


module.exports = {
  generateMonthlyInvoices,
  getResidentInvoices,
  getInvoiceById,
  fetchAllInvoices
};