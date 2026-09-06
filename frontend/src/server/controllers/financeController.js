const store = require('../models/store');

const CATEGORY_NAMES = {
  // Incomes
  hall_rent: "ශාලා කුලිය (Hall Rent)",
  shop_rent: "වෙළඳසැල් කුලිය (Shop Rent)",
  donations: "විශේෂ පරිත්‍යාග සහ ආධාර (Donations)",
  fund_interest: "අරමුදල් පොලී ආදායම් (Fund Interest)",
  other_income: "වෙනත් ආදායම් (Other Income)",

  // Expenses
  funeral_aid: "මරණාධාර / මරණධාරා (Funeral Aid)",
  sports: "ක්‍රීඩා සහ තරුණ කටයුතු (Sports)",
  religious_festivals: "ආගමික උත්සව සහ සංස්කෘතික (Religious Festivals)",
  welfare_events: "සුබසාධක උත්සව (Welfare Events)",
  medical_aid: "හදිසි වෛද්‍ය ආධාර (Medical Aid)",
  maintenance: "නඩත්තු සහ අලුත්වැඩියා (Maintenance)",
  admin_expenses: "පරිපාලන වියදම් (Admin Expenses)",
  other_expense: "වෙනත් වියදම් (Other Expense)"
};

exports.CATEGORY_NAMES = CATEGORY_NAMES;

exports.getAllTransactions = async (req, res) => {
  try {
    const { type, category, search } = req.query;
    let transactions = await store.getTransactions();

    if (type && type !== 'all') {
      transactions = transactions.filter(t => t.type === type.toLowerCase());
    }

    if (category && category !== 'all') {
      transactions = transactions.filter(t => t.category === category);
    }

    if (search) {
      const q = search.toLowerCase();
      transactions = transactions.filter(t =>
        (t.voucherNo && t.voucherNo.toLowerCase().includes(q)) ||
        (t.title && t.title.toLowerCase().includes(q)) ||
        (t.description && t.description.toLowerCase().includes(q)) ||
        (t.partyName && t.partyName.toLowerCase().includes(q)) ||
        (t.categoryName && t.categoryName.toLowerCase().includes(q)) ||
        (t.receiptOrVoucherRef && t.receiptOrVoucherRef.toLowerCase().includes(q))
      );
    }

    res.status(200).json({
      success: true,
      count: transactions.length,
      data: transactions
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.getTransactionById = async (req, res) => {
  try {
    const { id } = req.params;
    const tx = await store.getTransactionById(id);

    if (!tx) {
      return res.status(404).json({ success: false, error: 'ගනුදෙනුව සොයාගත නොහැකි විය.' });
    }

    res.status(200).json({ success: true, data: tx });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.getTransactionSummary = async (req, res) => {
  try {
    const transactions = await store.getTransactions();
    const totalIncome = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

    const totalExpenses = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

    const netBalance = totalIncome - totalExpenses;

    // Aggregate category breakdowns
    const incomeByCategory = {};
    const expenseByCategory = {};

    transactions.forEach(t => {
      const catKey = t.category || 'other';
      const catName = t.categoryName || CATEGORY_NAMES[catKey] || catKey;
      const amt = Number(t.amount) || 0;

      if (t.type === 'income') {
        if (!incomeByCategory[catKey]) {
          incomeByCategory[catKey] = { category: catKey, name: catName, total: 0, count: 0 };
        }
        incomeByCategory[catKey].total += amt;
        incomeByCategory[catKey].count += 1;
      } else if (t.type === 'expense') {
        if (!expenseByCategory[catKey]) {
          expenseByCategory[catKey] = { category: catKey, name: catName, total: 0, count: 0 };
        }
        expenseByCategory[catKey].total += amt;
        expenseByCategory[catKey].count += 1;
      }
    });

    res.status(200).json({
      success: true,
      summary: {
        totalIncome,
        totalExpenses,
        netBalance,
        transactionsCount: transactions.length,
        incomeByCategory: Object.values(incomeByCategory),
        expenseByCategory: Object.values(expenseByCategory)
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.createTransaction = async (req, res) => {
  try {
    const {
      type,
      category,
      amount,
      title,
      description,
      partyName,
      paymentMethod,
      receiptOrVoucherRef,
      date
    } = req.body;

    if (!type || !['income', 'expense'].includes(type.toLowerCase())) {
      return res.status(400).json({
        success: false,
        error: 'වලංගු ගනුදෙනු වර්ගයක් තෝරන්න (income හෝ expense).'
      });
    }

    if (!category) {
      return res.status(400).json({
        success: false,
        error: 'ගනුදෙනු කාණ්ඩය (Category) අවශ්‍ය වේ.'
      });
    }

    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'වලංගු මුදලක් ඇතුළත් කරන්න (0ට වැඩි).'
      });
    }

    if (!title || !title.trim()) {
      return res.status(400).json({
        success: false,
        error: 'ගනුදෙනු ශීර්ෂය හෝ විස්තරය අවශ්‍ය වේ.'
      });
    }

    const txType = type.toLowerCase();
    const currentYear = new Date().getFullYear();
    const countAll = (await store.getTransactions()).length + 1;
    const prefix = txType === 'income' ? 'INC' : 'EXP';
    const voucherNo = `${prefix}-${currentYear}-${String(countAll).padStart(3, '0')}`;
    const id = `tx_${Date.now()}`;

    const txDate = date && !isNaN(new Date(date).getTime())
      ? new Date(date).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0];

    const categoryName = req.body.categoryName || CATEGORY_NAMES[category] || category;

    const newTransaction = {
      id,
      voucherNo,
      type: txType,
      category,
      categoryName,
      amount: numAmount,
      date: txDate,
      title: title.trim(),
      description: description ? description.trim() : '',
      partyName: partyName ? partyName.trim() : (txType === 'income' ? 'ගෙවන්නා' : 'ලබන්නා'),
      paymentMethod: paymentMethod || 'Cash',
      receiptOrVoucherRef: receiptOrVoucherRef ? receiptOrVoucherRef.trim() : voucherNo,
      recordedBy: req.user ? req.user.email : (req.body.recordedBy || 'admin@welfare.org'),
      recordedAt: new Date().toISOString()
    };

    const saved = await store.addTransaction(newTransaction);

    res.status(201).json({
      success: true,
      message: txType === 'income'
        ? 'නව ආදායම් වාර්තාව සාර්ථකව සුරකින ලදී.'
        : 'නව වියදම් වාර්තාව සාර්ථකව සුරකින ලදී.',
      data: saved
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.deleteTransaction = async (req, res) => {
  try {
    const { id } = req.params;
    const success = await store.deleteTransaction(id);

    if (!success) {
      return res.status(404).json({
        success: false,
        error: 'ඉවත් කිරීමට අදාළ ගනුදෙනුව සොයාගත නොහැකි විය.'
      });
    }

    res.status(200).json({
      success: true,
      message: 'ගනුදෙනු වාර්තාව සාර්ථකව ඉවත් කරන ලදී.'
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
