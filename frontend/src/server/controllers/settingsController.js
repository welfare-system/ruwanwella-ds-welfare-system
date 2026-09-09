const store = require('../models/store');

exports.getSystemSettings = async (req, res) => {
  try {
    const settings = await store.getSystemSettings();
    res.status(200).json({ success: true, data: settings });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.updateSystemSettings = async (req, res) => {
  try {
    const {
      organizationName,
      currency,
      currencySymbol,
      defaultContributionRate,
      maxLoanLimit,
      defaultInterestRate,
      autoPayrollDeduction,
      initialReserve
    } = req.body;

    const updates = {};
    if (organizationName !== undefined) updates.organizationName = organizationName.trim();
    // System currency is locked to Sri Lankan Rupees (Rs.)
    updates.currency = "LKR";
    updates.currencySymbol = "Rs.";
    if (defaultContributionRate !== undefined) updates.defaultContributionRate = Number(defaultContributionRate);
    if (maxLoanLimit !== undefined) updates.maxLoanLimit = Number(maxLoanLimit);
    if (defaultInterestRate !== undefined) updates.defaultInterestRate = Number(defaultInterestRate);
    if (autoPayrollDeduction !== undefined) updates.autoPayrollDeduction = Boolean(autoPayrollDeduction);
    if (initialReserve !== undefined && !isNaN(Number(initialReserve))) updates.initialReserve = Number(initialReserve);

    const updated = await store.updateSystemSettings(updates);

    res.status(200).json({
      success: true,
      message: 'System preferences updated successfully.',
      data: updated
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, email, phone, department } = req.body;

    if (!name || !email) {
      return res.status(400).json({
        success: false,
        error: 'Name and email are required.'
      });
    }

    const updated = await store.updateUserProfile(userId, { name, email, phone, department });
    if (!updated) {
      return res.status(404).json({ success: false, error: 'User profile not found.' });
    }

    res.status(200).json({
      success: true,
      message: 'Profile details updated successfully.',
      data: updated
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        error: 'Current password and new password are required.'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'New password must be at least 6 characters long.'
      });
    }

    const result = await store.changeUserPassword(userId, currentPassword, newPassword);
    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.error
      });
    }

    res.status(200).json({
      success: true,
      message: 'Password changed successfully.'
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
