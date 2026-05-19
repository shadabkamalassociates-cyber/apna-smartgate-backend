const Razorpay = require('razorpay');
const crypto = require('crypto');
const pool = require('../../config/db');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY,
  key_secret: process.env.RAZORPAY_SECRET
});

// Create Razorpay Order
const createPaymentOrder = async (req, res) => {
  try {

    const { invoice_id } = req.body;

    const invoiceQuery = await pool.query(
      `
      SELECT *
      FROM invoices
      WHERE id = $1
      `,
      [invoice_id]
    );

    const invoice = invoiceQuery.rows[0];

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }

    const remainingAmount =
      Number(invoice.total_amount) - Number(invoice.paid_amount);

    const order = await razorpay.orders.create({
      amount: remainingAmount * 100,
      currency: 'INR'
    });

    return res.status(200).json({
      success: true,
      data: order
    });

  } catch (error) {

    console.log(error);

    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Verify Payment
const verifyPayment = async (req, res) => {

  const client = await pool.connect();

  try {

    await client.query('BEGIN');

    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      invoice_id,
      amount
    } = req.body;

    const generatedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (generatedSignature !== razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment signature'
      });
    }

    const invoiceResult = await client.query(
      `
      SELECT *
      FROM invoices
      WHERE id = $1
      `,
      [invoice_id]
    );

    const invoice = invoiceResult.rows[0];

    const updatedPaidAmount =
      Number(invoice.paid_amount) + Number(amount);

    let status = 'PARTIAL';

    if (updatedPaidAmount >= Number(invoice.total_amount)) {
      status = 'PAID';
    }

    await client.query(
      `
      INSERT INTO billing_payments (
        invoice_id,
        resident_id,
        transaction_id,
        payment_gateway,
        payment_method,
        amount,
        status
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7)
      `,
      [
        invoice.id,
        invoice.resident_id,
        razorpay_payment_id,
        'RAZORPAY',
        'ONLINE',
        amount,
        'SUCCESS'
      ]
    );

    await client.query(
      `
      UPDATE invoices
      SET paid_amount = $1,
          status = $2
      WHERE id = $3
      `,
      [updatedPaidAmount, status, invoice.id]
    );

    const balanceResult = await client.query(
      `
      SELECT COALESCE(SUM(debit-credit),0) AS balance
      FROM ledgers
      WHERE resident_id = $1
      `,
      [invoice.resident_id]
    );

    const currentBalance = Number(balanceResult.rows[0].balance);

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
        invoice.resident_id,
        invoice.id,
        'PAYMENT',
        0,
        amount,
        currentBalance - amount
      ]
    );

    await client.query('COMMIT');

    return res.status(200).json({
      success: true,
      message: 'Payment successful'
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


module.exports = {
  createPaymentOrder,
  verifyPayment
};