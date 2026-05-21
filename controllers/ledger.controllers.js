const { client } = require("../config/client");

const getResidentLedger = async (req, res) => {
  try {

    const { resident_id } = req.params;

    const ledger = await client.query(
      `
      SELECT *
      FROM ledgers
      WHERE resident_id = $1
      ORDER BY created_at DESC
      `,
      [resident_id]
    );

    const balanceQuery = await client.query(
      `
      SELECT COALESCE(SUM(debit-credit),0) AS balance
      FROM ledgers
      WHERE resident_id = $1
      `,
      [resident_id]
    );

    return res.status(200).json({
      success: true,
      balance: balanceQuery.rows[0].balance,
      data: ledger.rows
    });

  } catch (error) {

    console.log(error);

    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

const fetchAllLedgers = async (req,res)=>{
  try {
    const ledgers = await client.query(
      `
      SELECT *
      FROM ledgers
      `
    );
    return res.status(200).json({
      success: true,
      data: ledgers.rows
    });
    }
  catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
}
module.exports = {
  getResidentLedger,
  fetchAllLedgers
};