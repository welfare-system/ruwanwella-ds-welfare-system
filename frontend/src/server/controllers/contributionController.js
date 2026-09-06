const store = require('../models/store');

exports.getAllContributions = async (req, res) => {
  try {
    const { memberId, month, search } = req.query;
    let list = await store.getContributions();

    if (memberId) {
      list = list.filter(c => c.memberId === memberId);
    }

    if (month && month !== 'All') {
      list = list.filter(c => c.monthCovered && c.monthCovered.toLowerCase().includes(month.toLowerCase()));
    }

    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        c =>
          (c.receiptNo && c.receiptNo.toLowerCase().includes(q)) ||
          (c.memberName && c.memberName.toLowerCase().includes(q)) ||
          (c.memberId && c.memberId.toLowerCase().includes(q)) ||
          (c.paymentMethod && c.paymentMethod.toLowerCase().includes(q))
      );
    }

    res.status(200).json({
      success: true,
      count: list.length,
      data: list
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.recordContribution = async (req, res) => {
  try {
    const { memberId, amount, monthCovered, paymentMethod, notes } = req.body;

    if (!memberId || !amount) {
      return res.status(400).json({
        success: false,
        error: 'Member ID and contribution amount are required.'
      });
    }

    const member = await store.getMemberById(memberId);
    if (!member) {
      return res.status(404).json({
        success: false,
        error: `Member with ID ${memberId} not found.`
      });
    }

    const numAmount = parseFloat(amount);
    if (numAmount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Contribution amount must be greater than zero.'
      });
    }

    const allContributions = await store.getContributions();
    const receiptNum = 9000 + allContributions.length + 1;
    const receiptNo = `REC-${receiptNum}`;

    const newContribution = {
      id: `cnt_${Date.now()}`,
      receiptNo,
      memberId: member.memberId,
      memberName: member.name,
      amount: numAmount,
      monthCovered: monthCovered ? monthCovered.trim() : new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' }),
      paymentMethod: paymentMethod ? paymentMethod.trim() : 'Payroll Deduction',
      paymentDate: new Date().toISOString().split('T')[0],
      notes: notes ? notes.trim() : 'Regular contribution'
    };

    const created = await store.addContribution(newContribution);

    res.status(201).json({
      success: true,
      message: `Contribution receipt ${receiptNo} recorded for ${member.name}.`,
      data: created
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
