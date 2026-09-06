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
