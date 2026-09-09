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

exports.validateMemberDuplicates = async (req, res) => {
  try {
    const { idNumber, sewaAnkaya, email, excludeId } = req.body;
    const check = await store.checkMemberDuplicate({ idNumber, sewaAnkaya, email, excludeId });
    res.status(200).json({ success: true, ...check });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.createMember = async (req, res) => {
  try {
    const { name, email, phone, department, role, monthlyContribution, notes, thanthura, idNumber, sewaAnkaya } = req.body;

    if (!name || !phone) {
      return res.status(400).json({
        success: false,
        error: 'Name and phone number are required.'
      });
    }

    const cleanEmail = email && typeof email === 'string' && email.trim() ? email.trim().toLowerCase() : null;
    const resolvedThanthura = (thanthura && thanthura.trim()) || (department ? department.trim() : 'General Staff');
    const resolvedIdNumber = idNumber ? idNumber.trim() : '';
    const resolvedSewaAnkaya = sewaAnkaya ? sewaAnkaya.trim() : '';

    const metaNotes = [];
    if (resolvedIdNumber) metaNotes.push(`NIC/ID: ${resolvedIdNumber}`);
    if (resolvedSewaAnkaya) metaNotes.push(`Service No: ${resolvedSewaAnkaya}`);
    const finalNotes = [
      metaNotes.length ? `[${metaNotes.join(' | ')}]` : '',
      notes ? notes.trim() : ''
    ].filter(Boolean).join(' ');

    // Duplicate validation: Check ID Number (NIC), Sewa Ankaya (Service ID), and Email Address
    const dupCheck = await store.checkMemberDuplicate({
      idNumber: resolvedIdNumber,
      sewaAnkaya: resolvedSewaAnkaya,
      email: cleanEmail
    });

    if (dupCheck.hasDuplicate) {
      return res.status(400).json({
        success: false,
        field: dupCheck.field,
        error: dupCheck.error,
        conflictingMember: dupCheck.conflictingMember
      });
    }

    // Retry loop with sequence check to guarantee zero duplicate key constraint violations
    let attempts = 0;
    const maxAttempts = 5;
    let created = null;

    while (attempts < maxAttempts) {
      attempts++;
      const memberId = await store.getNextMemberId();
      const uniqueId = `mem_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

      const newMember = {
        id: uniqueId,
        memberId,
        name: name.trim(),
        email: cleanEmail,
        phone: phone.trim(),
        department: resolvedThanthura,
        thanthura: resolvedThanthura,
        idNumber: resolvedIdNumber,
        sewaAnkaya: resolvedSewaAnkaya,
        role: role ? role.trim() : 'Member',
        status: 'Active',
        monthlyContribution: Number(monthlyContribution) || 100,
        totalContributed: 0,
        joinDate: new Date().toISOString().split('T')[0],
        notes: finalNotes
      };

      try {
        created = await store.addMember(newMember);
        break; // Successfully registered
      } catch (insertErr) {
        const isDuplicateMemberId =
          insertErr.code === '23505' &&
          (insertErr.constraint === 'members_member_id_key' ||
           (insertErr.detail && insertErr.detail.includes('member_id')) ||
           (insertErr.message && insertErr.message.includes('member_id')));

        const isDuplicateEmail =
          insertErr.code === '23505' &&
          (insertErr.constraint === 'members_email_key' ||
           (insertErr.detail && insertErr.detail.includes('email')) ||
           (insertErr.message && insertErr.message.includes('email')));

        if (isDuplicateEmail) {
          return res.status(400).json({
            success: false,
            error: `Email address "${cleanEmail}" is already registered to another member.`
          });
        }

        if (isDuplicateMemberId) {
          console.warn(`[Member ID Collision] Auto-assigned ${memberId} collided. Re-syncing sequence on attempt ${attempts}...`);
          try {
            await store.syncMemberIdSequence();
          } catch (syncErr) {
            console.error('Failed to re-sync sequence:', syncErr.message);
          }
          continue;
        }

        // Handle generic fallback error where id primary key collided
        if (insertErr.code === '23505' && (insertErr.constraint === 'members_pkey' || (insertErr.detail && insertErr.detail.includes('Key (id)')))) {
          newMember.id = `mem_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
          created = await store.addMember(newMember);
          break;
        }

        throw insertErr;
      }
    }

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

    const dupCheck = await store.checkMemberDuplicate({
      idNumber: updates.idNumber !== undefined ? updates.idNumber : existing.idNumber,
      sewaAnkaya: updates.sewaAnkaya !== undefined ? updates.sewaAnkaya : existing.sewaAnkaya,
      email: updates.email !== undefined ? updates.email : existing.email,
      excludeId: existing.id
    });

    if (dupCheck.hasDuplicate) {
      return res.status(400).json({
        success: false,
        field: dupCheck.field,
        error: dupCheck.error,
        conflictingMember: dupCheck.conflictingMember
      });
    }

    if (updates.idNumber !== undefined || updates.sewaAnkaya !== undefined) {
      const newIdNum = updates.idNumber !== undefined ? updates.idNumber.trim() : (existing.idNumber || '');
      const newSewa = updates.sewaAnkaya !== undefined ? updates.sewaAnkaya.trim() : (existing.sewaAnkaya || '');
      let baseNotes = (updates.notes !== undefined ? updates.notes : (existing.notes || '')).replace(/\[NIC\/ID:[^\]]+\]\s*/g, '').trim();
      const meta = [];
      if (newIdNum) meta.push(`NIC/ID: ${newIdNum}`);
      if (newSewa) meta.push(`Service No: ${newSewa}`);
      updates.notes = [meta.length ? `[${meta.join(' | ')}]` : '', baseNotes].filter(Boolean).join(' ');
      updates.idNumber = newIdNum;
      updates.sewaAnkaya = newSewa;
    }

    if (updates.thanthura) {
      updates.department = updates.thanthura.trim();
    }
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
