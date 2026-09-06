const store = require('../models/store');

exports.getAllMembers = async (req, res) => {
  try {
    const { search, department, status } = req.query;
    let members = await store.getMembers();

    if (search) {
      const q = search.toLowerCase();
      members = members.filter(
        m =>
          (m.name && m.name.toLowerCase().includes(q)) ||
          (m.memberId && m.memberId.toLowerCase().includes(q)) ||
          (m.email && m.email.toLowerCase().includes(q)) ||
          (m.phone && m.phone.toLowerCase().includes(q))
      );
    }

    if (department && department !== 'All') {
      members = members.filter(m => m.department === department);
    }

    if (status && status !== 'All') {
      members = members.filter(m => m.status === status);
    }

    res.status(200).json({
      success: true,
      count: members.length,
      data: members
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.getMemberById = async (req, res) => {
  try {
    const { id } = req.params;
    const member = await store.getMemberById(id);

    if (!member) {
      return res.status(404).json({ success: false, error: 'Member not found.' });
    }

    // Attach member's loans & contributions
    const allLoans = await store.getLoans();
    const allContributions = await store.getContributions();
    const loans = allLoans.filter(l => l.memberId === member.memberId);
    const contributions = allContributions.filter(c => c.memberId === member.memberId);

    res.status(200).json({
      success: true,
      data: {
        ...member,
        loans,
        contributions
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.createMember = async (req, res) => {
  try {
    const { name, email, phone, department, role, monthlyContribution, notes } = req.body;

    if (!name || !email || !phone) {
      return res.status(400).json({
        success: false,
        error: 'Name, email, and phone number are required.'
      });
    }

    const allMembers = await store.getMembers();
    // Generate next member ID
    const nextNum = 1001 + allMembers.length;
    const memberId = `WLF-${nextNum}`;

    const newMember = {
      id: `mem_${Date.now()}`,
      memberId,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      department: department ? department.trim() : 'Operations',
      role: role ? role.trim() : 'Member',
      status: 'Active',
      monthlyContribution: Number(monthlyContribution) || 100,
      totalContributed: 0,
      joinDate: new Date().toISOString().split('T')[0],
      notes: notes ? notes.trim() : ''
    };

    const created = await store.addMember(newMember);

    res.status(201).json({
      success: true,
      message: 'Member successfully registered.',
      data: created
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.updateMember = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await store.getMemberById(id);

    if (!existing) {
      return res.status(404).json({ success: false, error: 'Member not found.' });
    }

    const updates = { ...req.body };
    // Prevent overriding system IDs
    delete updates.id;
    delete updates.memberId;

    if (updates.monthlyContribution !== undefined) {
      updates.monthlyContribution = Number(updates.monthlyContribution);
    }
    if (updates.totalContributed !== undefined) {
      updates.totalContributed = Number(updates.totalContributed);
    }

    const updated = await store.updateMember(id, updates);

    res.status(200).json({
      success: true,
      message: 'Member details updated.',
      data: updated
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.deleteMember = async (req, res) => {
  try {
    const { id } = req.params;
    const success = await store.deleteMember(id);

    if (!success) {
      return res.status(404).json({ success: false, error: 'Member not found.' });
    }

    res.status(200).json({
      success: true,
      message: 'Member removed successfully.'
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
