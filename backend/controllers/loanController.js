const store = require('../models/store');

exports.getAllLoans = async (req, res) => {
  try {
    const { status, memberId, search } = req.query;
    let loans = await store.getLoans();

    if (status && status !== 'All') {
      loans = loans.filter(l => l.status === status);
    }

    if (memberId) {
      loans = loans.filter(l => l.memberId === memberId);
    }

    if (search) {
      const q = search.toLowerCase();
      loans = loans.filter(
        l =>
          (l.loanId && l.loanId.toLowerCase().includes(q)) ||
          (l.memberName && l.memberName.toLowerCase().includes(q)) ||
          (l.purpose && l.purpose.toLowerCase().includes(q))
      );
    }

    res.status(200).json({
      success: true,
      count: loans.length,
      data: loans
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.getLoanById = async (req, res) => {
  try {
    const { id } = req.params;
    const loan = await store.getLoanById(id);

    if (!loan) {
      return res.status(404).json({ success: false, error: 'Loan record not found.' });
    }

    res.status(200).json({ success: true, data: loan });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.createLoan = async (req, res) => {
  try {
    const { memberId, principalAmount, interestRate, termMonths, purpose } = req.body;

    if (!memberId || !principalAmount || !termMonths || !purpose) {
      return res.status(400).json({
        success: false,
        error: 'Member, principal amount, loan term (months), and purpose are required.'
      });
    }

    const member = await store.getMemberById(memberId);
    if (!member) {
      return res.status(404).json({
        success: false,
        error: `Member with ID ${memberId} not found.`
      });
    }

    const principal = parseFloat(principalAmount);
    const months = parseInt(termMonths, 10);
    const rate = parseFloat(interestRate) || 4.5; // Default 4.5% annual simple interest

    if (principal <= 0 || months <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Principal amount and term months must be greater than zero.'
      });
    }

    // Simple welfare interest formula: Total Interest = Principal * (Rate / 100) * (Months / 12)
    const totalInterest = Math.round((principal * (rate / 100) * (months / 12)) * 100) / 100;
    const totalRepayable = Math.round((principal + totalInterest) * 100) / 100;
    const monthlyPayment = Math.round((totalRepayable / months) * 100) / 100;

    const allLoans = await store.getLoans();
    const loanNum = 100 + allLoans.length + 1;
    const year = new Date().getFullYear();
    const loanId = `LN-${year}-${loanNum}`;

    const newLoan = {
      id: `loan_${Date.now()}`,
      loanId,
      memberId: member.memberId,
      memberName: member.name,
      principalAmount: principal,
      interestRate: rate,
      termMonths: months,
      totalRepayable,
      monthlyPayment,
      amountRepaid: 0,
      remainingBalance: totalRepayable,
      purpose: purpose.trim(),
      status: 'Pending',
      applicationDate: new Date().toISOString().split('T')[0],
      disbursedDate: null,
      nextDueDate: null
    };

    const created = await store.addLoan(newLoan);

    res.status(201).json({
      success: true,
      message: 'Loan application submitted for review.',
      data: created
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.updateLoanStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    const validStatuses = ['Pending', 'Approved', 'Active', 'Fully Repaid', 'Rejected'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      });
    }

    const loan = await store.getLoanById(id);
    if (!loan) {
      return res.status(404).json({ success: false, error: 'Loan record not found.' });
    }

    const updates = { status };
    if (notes) updates.notes = notes;

    // When moving to Active / Disbursed
    if (status === 'Active' && !loan.disbursedDate) {
      const today = new Date();
      updates.disbursedDate = today.toISOString().split('T')[0];
      
      // Due date set to 1 month from today
      const nextDue = new Date(today);
      nextDue.setMonth(nextDue.getMonth() + 1);
      updates.nextDueDate = nextDue.toISOString().split('T')[0];
    }

    const updated = await store.updateLoan(id, updates);

    res.status(200).json({
      success: true,
      message: `Loan status changed to ${status}.`,
      data: updated
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.recordLoanPayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, paymentMethod, notes } = req.body;

    const paymentAmount = parseFloat(amount);
    if (!paymentAmount || paymentAmount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'A positive payment amount is required.'
      });
    }

    const loan = await store.getLoanById(id);
    if (!loan) {
      return res.status(404).json({ success: false, error: 'Loan record not found.' });
    }

    if (loan.status === 'Fully Repaid') {
      return res.status(400).json({
        success: false,
        error: 'This loan has already been fully repaid.'
      });
    }

    const newAmountRepaid = Math.round((loan.amountRepaid + paymentAmount) * 100) / 100;
    const newRemaining = Math.max(0, Math.round((loan.totalRepayable - newAmountRepaid) * 100) / 100);
    const isCompleted = newRemaining <= 0;

    const updates = {
      amountRepaid: newAmountRepaid,
      remainingBalance: newRemaining,
      status: isCompleted ? 'Fully Repaid' : loan.status === 'Pending' ? 'Active' : loan.status
    };

    if (isCompleted) {
      updates.nextDueDate = null;
    } else {
      // Advance next due date by 1 month
      const currentDue = loan.nextDueDate ? new Date(loan.nextDueDate) : new Date();
      currentDue.setMonth(currentDue.getMonth() + 1);
      updates.nextDueDate = currentDue.toISOString().split('T')[0];
    }

    const updated = await store.updateLoan(id, updates);

    res.status(200).json({
      success: true,
      message: isCompleted
        ? `Payment of $${paymentAmount.toFixed(2)} received. Loan is now fully repaid!`
        : `Payment of $${paymentAmount.toFixed(2)} applied successfully. Remaining balance: $${newRemaining.toFixed(2)}.`,
      data: updated
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
