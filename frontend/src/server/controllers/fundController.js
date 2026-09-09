const store = require('../models/store');

exports.getFundSummary = async (req, res) => {
  try {
    const summary = await store.getFundSummary();
    res.status(200).json({
      success: true,
      data: summary
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.updateFundBalance = async (req, res) => {
  try {
    const { initialReserve, currentBalance, notes, recordTransaction } = req.body;
    const summary = await store.updateFundBalance({
      initialReserve,
      currentBalance,
      notes,
      recordTransaction: Boolean(recordTransaction),
      recordedBy: req.user?.email || 'admin@welfare.org'
    });
    res.status(200).json({
      success: true,
      message: 'Fund balance updated successfully.',
      data: summary
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
