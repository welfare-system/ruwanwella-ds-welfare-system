/**
 * PostgreSQL Data Access Store
 * 
 * Replaces in-memory storage with asynchronous SQL queries against Neon PostgreSQL.
 * Handles database pooling, transactional integrity, data mapping, and in-memory dev fallback.
 */

const bcrypt = require('bcryptjs');
const db = require('../config/db');

// ── In-Memory Fallback State (used only if DATABASE_URL is not provided) ───────
let memSettings = {
  organizationName: "Staff Welfare Association",
  currency: "LKR",
  currencySymbol: "Rs.",
  defaultContributionRate: 2500,
  maxLoanLimit: 500000,
  defaultInterestRate: 4.5,
  autoPayrollDeduction: true
};
let memMembers = [
  { id: "mem_1", memberId: "WLF-1001", name: "Dr. Evelyn Vance", email: "evelyn.vance@org.internal", phone: "+1 (555) 234-5678", department: "Medical Operations", role: "Chairperson", status: "Active", monthlyContribution: 150, totalContributed: 3600, joinDate: "2024-01-15", notes: "Founding member of the welfare committee." },
  { id: "mem_2", memberId: "WLF-1002", name: "Marcus Aurelius Thorne", email: "marcus.thorne@org.internal", phone: "+1 (555) 345-6789", department: "Logistics & Transport", role: "Member", status: "Active", monthlyContribution: 100, totalContributed: 2400, joinDate: "2024-03-10", notes: "Consistent monthly payroll deductions." },
  { id: "mem_3", memberId: "WLF-1003", name: "Sophia Chen", email: "sophia.chen@org.internal", phone: "+1 (555) 456-7890", department: "Information Technology", role: "Treasurer", status: "Active", monthlyContribution: 200, totalContributed: 4800, joinDate: "2024-02-01", notes: "Oversees fund auditing and disbursements." },
  { id: "mem_4", memberId: "WLF-1004", name: "David K. O'Connor", email: "david.oconnor@org.internal", phone: "+1 (555) 567-8901", department: "Human Resources", role: "Member", status: "Active", monthlyContribution: 120, totalContributed: 2880, joinDate: "2024-05-20", notes: "Active contributor with one completed loan." },
  { id: "mem_5", memberId: "WLF-1005", name: "Amara Ndiaye", email: "amara.ndiaye@org.internal", phone: "+1 (555) 678-9012", department: "Field Research", role: "Member", status: "Active", monthlyContribution: 100, totalContributed: 1900, joinDate: "2024-08-14", notes: "Enrolled via new hire welfare orientation." }
];
let memUsers = [
  { id: "usr_admin", email: "admin@welfare.org", passwordHash: bcrypt.hashSync("AdminPassword123!", 10), name: "System Administrator", role: "admin", memberId: null, department: "Executive Committee", phone: "+1 (555) 000-1122" },
  { id: "usr_marcus", email: "marcus.thorne@org.internal", passwordHash: bcrypt.hashSync("MemberPassword123!", 10), name: "Marcus Aurelius Thorne", role: "member", memberId: "WLF-1002", department: "Logistics & Transport", phone: "+1 (555) 345-6789" },
  { id: "usr_evelyn", email: "evelyn.vance@org.internal", passwordHash: bcrypt.hashSync("MemberPassword123!", 10), name: "Dr. Evelyn Vance", role: "admin", memberId: "WLF-1001", department: "Medical Operations", phone: "+1 (555) 234-5678" }
];
let memLoans = [
  { id: "loan_1", loanId: "LN-2026-001", memberId: "WLF-1002", memberName: "Marcus Aurelius Thorne", principalAmount: 3000, interestRate: 4.5, termMonths: 12, totalRepayable: 3135, monthlyPayment: 261.25, amountRepaid: 1567.50, remainingBalance: 1567.50, purpose: "Home repair emergency assistance", status: "Active", applicationDate: "2026-02-01", disbursedDate: "2026-02-05", nextDueDate: "2026-10-05", notes: "" },
  { id: "loan_2", loanId: "LN-2026-002", memberId: "WLF-1005", memberName: "Amara Ndiaye", principalAmount: 1500, interestRate: 4.0, termMonths: 6, totalRepayable: 1530, monthlyPayment: 255.00, amountRepaid: 0, remainingBalance: 1530.00, purpose: "Higher education certification course", status: "Pending", applicationDate: "2026-09-01", disbursedDate: null, nextDueDate: null, notes: "" },
  { id: "loan_3", loanId: "LN-2025-089", memberId: "WLF-1004", memberName: "David K. O'Connor", principalAmount: 2000, interestRate: 4.0, termMonths: 10, totalRepayable: 2080, monthlyPayment: 208.00, amountRepaid: 2080.00, remainingBalance: 0.00, purpose: "Medical expenditure reimbursement", status: "Fully Repaid", applicationDate: "2025-08-10", disbursedDate: "2025-08-15", nextDueDate: null, notes: "" }
];
let memContributions = [
  { id: "cnt_1", receiptNo: "REC-9001", memberId: "WLF-1001", memberName: "Dr. Evelyn Vance", amount: 150, monthCovered: "September 2026", paymentMethod: "Payroll Deduction", paymentDate: "2026-09-01", notes: "Auto-deducted" },
  { id: "cnt_2", receiptNo: "REC-9002", memberId: "WLF-1002", memberName: "Marcus Aurelius Thorne", amount: 100, monthCovered: "September 2026", paymentMethod: "Payroll Deduction", paymentDate: "2026-09-01", notes: "Auto-deducted" },
  { id: "cnt_3", receiptNo: "REC-9003", memberId: "WLF-1003", memberName: "Sophia Chen", amount: 200, monthCovered: "September 2026", paymentMethod: "Bank Transfer", paymentDate: "2026-09-02", notes: "Direct EFT transfer" },
  { id: "cnt_4", receiptNo: "REC-9004", memberId: "WLF-1004", memberName: "David K. O'Connor", amount: 120, monthCovered: "September 2026", paymentMethod: "Payroll Deduction", paymentDate: "2026-09-01", notes: "Auto-deducted" },
  { id: "cnt_5", receiptNo: "REC-9005", memberId: "WLF-1005", memberName: "Amara Ndiaye", amount: 100, monthCovered: "September 2026", paymentMethod: "Cash / Direct Deposit", paymentDate: "2026-09-04", notes: "Receipt verified by Treasurer" }
];
let memTransactions = [
  { id: "tx_1", voucherNo: "INC-2026-001", type: "income", category: "hall_rent", categoryName: "ශාලා කුලිය (Hall Rent)", amount: 45000, date: "2026-09-02", title: "ප්‍රජා ශාලාව විවාහ උත්සවයක් සඳහා කුලියට දීම", description: "ප්‍රධාන ශාලාව සහ ශබ්ද පරිපාලන පද්ධතිය පැය 8ක කාලයක් සඳහා කුලියට දීම", partyName: "කේ. එම්. නිහාල් විජේසිංහ මහතා", paymentMethod: "Bank Transfer", receiptOrVoucherRef: "RCT-9912", recordedBy: "admin@welfare.org" },
  { id: "tx_2", voucherNo: "INC-2026-002", type: "income", category: "shop_rent", categoryName: "වෙළඳසැල් කුලිය (Shop Rent)", amount: 35000, date: "2026-09-01", title: "සුබසාධක සංකීර්ණ අංක 03 වෙළඳසැල් මාසික කුලිය", description: "2026 සැප්තැම්බර් මස සඳහා මාසික වෙළඳ කුලිය", partyName: "එස්. කුමාර වෙළඳ සහෝදරයෝ", paymentMethod: "Bank Transfer", receiptOrVoucherRef: "RCT-9913", recordedBy: "admin@welfare.org" },
  { id: "tx_3", voucherNo: "INC-2026-003", type: "income", category: "donations", categoryName: "විශේෂ පරිත්‍යාග (Donations)", amount: 25000, date: "2026-08-28", title: "වාර්ෂික සුබසාධක ප්‍රදාන සහ සුබපැතුම් ආධාර", description: "විධායක සාමාජිකයන්ගේ ස්වේච්ඡා අරමුදල් පරිත්‍යාගය", partyName: "වෛද්‍ය සංගම් සුබසාධක අංශය", paymentMethod: "Cheque", receiptOrVoucherRef: "CHQ-8820", recordedBy: "admin@welfare.org" },
  { id: "tx_4", voucherNo: "INC-2026-004", type: "income", category: "fund_interest", categoryName: "අරමුදල් පොලී ආදායම් (Bank Interest)", amount: 12500, date: "2026-08-31", title: "සුබසාධක ස්ථාවර තැන්පතු අගෝස්තු මස පොලී ලාභය", description: "මහජන බැංකු ඉතිරි කිරීමේ සහ ස්ථාවර තැන්පතු පොලිය", partyName: "People's Bank Sri Lanka", paymentMethod: "Bank Transfer", receiptOrVoucherRef: "BNK-INT-08", recordedBy: "admin@welfare.org" },
  { id: "tx_5", voucherNo: "EXP-2026-001", type: "expense", category: "funeral_aid", categoryName: "මරණාධාර (Funeral Aid)", amount: 25000, date: "2026-09-03", title: "සාමාජික පවුලේ අවමංගල්‍ය මරණාධාර ප්‍රදානය", description: "සාමාජික WLF-1002 මාකස් තෝර්න් මහතාගේ මවගේ අභාවය වෙනුවෙන් සුබසාධක ආධාරය", partyName: "මාකස් තෝර්න් මහතා", paymentMethod: "Bank Transfer", receiptOrVoucherRef: "VCH-701", recordedBy: "admin@welfare.org" },
  { id: "tx_6", voucherNo: "EXP-2026-002", type: "expense", category: "sports", categoryName: "ක්‍රීඩා කටයුතු (Sports)", amount: 18500, date: "2026-08-25", title: "අන්තර් දෙපාර්තමේන්තු ක්‍රිකට් තරගාවලි වියදම්", description: "ක්‍රිකට් ක්‍රීඩාංගණ ගාස්තු, පිති සහ පන්දු මිලදී ගැනීම්", partyName: "ස්පෝර්ට්ස් ප්ලැනට් පුද්ගලික සමාගම", paymentMethod: "Cash", receiptOrVoucherRef: "VCH-702", recordedBy: "admin@welfare.org" },
  { id: "tx_7", voucherNo: "EXP-2026-003", type: "expense", category: "religious_festivals", categoryName: "ආගමික උත්සව (Religious Festivals)", amount: 22000, date: "2026-08-15", title: "වාර්ෂික සර්වරාත්‍රික පරිත්‍රාණ ධර්ම දේශනය සහ දානමය පුණ්‍යකර්මය", description: "මල්, පහන්, මණ්ඩප සැරසිලි සහ මහා සංඝරත්නය උදෙසා දානමය වියදම්", partyName: "ශ්‍රී සුදර්ශනාරාම විහාරස්ථ කාර්ය සාධක සභාව", paymentMethod: "Bank Transfer", receiptOrVoucherRef: "VCH-703", recordedBy: "admin@welfare.org" },
  { id: "tx_8", voucherNo: "EXP-2026-004", type: "expense", category: "maintenance", categoryName: "නඩත්තු සහ අලුත්වැඩියා (Maintenance)", amount: 14000, date: "2026-08-20", title: "ප්‍රජා ශාලාවේ විදුලි පරිපථ සහ LED ආලෝක පද්ධති අලුත්වැඩියාව", description: "ප්‍රධාන ශාලාවේ දැවීගිය බල්බ මාරු කිරීම සහ පරිපථ පරීක්ෂාව", partyName: "ලංකා විදුලි සහ ඉලෙක්ට්‍රොනික් සේවා", paymentMethod: "Cash", receiptOrVoucherRef: "VCH-704", recordedBy: "admin@welfare.org" }
];
const INITIAL_RESERVE = 45000;

// ── Data Mapping Helpers (PostgreSQL snake_case -> JS camelCase) ─────────────

function mapSettings(row) {
  if (!row) return null;
  return {
    organizationName: row.organization_name,
    currency: "LKR",
    currencySymbol: "Rs.",
    defaultContributionRate: Number(row.default_contribution_rate) || 2500,
    maxLoanLimit: Number(row.max_loan_limit) || 500000,
    defaultInterestRate: Number(row.default_interest_rate) || 4.5,
    autoPayrollDeduction: Boolean(row.auto_payroll_deduction)
  };
}

function formatDate(val) {
  if (!val) return null;
  if (typeof val === 'string') return val.split('T')[0];
  if (val instanceof Date) return val.toISOString().split('T')[0];
  return String(val);
}

function mapMember(row) {
  if (!row) return null;
  return {
    id: row.id,
    memberId: row.member_id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    department: row.department,
    role: row.role,
    status: row.status,
    monthlyContribution: Number(row.monthly_contribution) || 0,
    totalContributed: Number(row.total_contributed) || 0,
    joinDate: formatDate(row.join_date),
    notes: row.notes || ""
  };
}

function mapUser(row) {
  if (!row) return null;
  return {
    id: row.id,
    email: row.email,
    passwordHash: row.password_hash,
    name: row.name,
    role: row.role,
    memberId: row.member_id,
    department: row.department,
    phone: row.phone
  };
}

function mapLoan(row) {
  if (!row) return null;
  return {
    id: row.id,
    loanId: row.loan_id,
    memberId: row.member_id,
    memberName: row.member_name,
    principalAmount: Number(row.principal_amount) || 0,
    interestRate: Number(row.interest_rate) || 0,
    termMonths: Number(row.term_months) || 0,
    totalRepayable: Number(row.total_repayable) || 0,
    monthlyPayment: Number(row.monthly_payment) || 0,
    amountRepaid: Number(row.amount_repaid) || 0,
    remainingBalance: Number(row.remaining_balance) || 0,
    purpose: row.purpose,
    status: row.status,
    applicationDate: formatDate(row.application_date),
    disbursedDate: formatDate(row.disbursed_date),
    nextDueDate: formatDate(row.next_due_date),
    notes: row.notes || ""
  };
}

function mapContribution(row) {
  if (!row) return null;
  return {
    id: row.id,
    receiptNo: row.receipt_no,
    memberId: row.member_id,
    memberName: row.member_name,
    amount: Number(row.amount) || 0,
    monthCovered: row.month_covered,
    paymentMethod: row.payment_method,
    paymentDate: formatDate(row.payment_date),
    notes: row.notes || ""
  };
}

function mapTransaction(row) {
  if (!row) return null;
  return {
    id: row.id,
    voucherNo: row.voucher_no,
    type: row.type,
    category: row.category,
    categoryName: row.category_name,
    amount: Number(row.amount) || 0,
    date: formatDate(row.date),
    title: row.title,
    description: row.description || "",
    partyName: row.party_name,
    paymentMethod: row.payment_method,
    receiptOrVoucherRef: row.receipt_or_voucher_ref || "",
    recordedBy: row.recorded_by,
    recordedAt: row.recorded_at ? new Date(row.recorded_at).toISOString() : new Date().toISOString()
  };
}

// ── Main Store Interface ─────────────────────────────────────────────────────

module.exports = {
  // ── System Settings ──
  getSystemSettings: async () => {
    if (!db.isConfigured()) return { ...memSettings };
    try {
      const res = await db.query('SELECT * FROM system_settings WHERE id = 1 LIMIT 1');
      if (res.rows.length === 0) return { ...memSettings };
      return mapSettings(res.rows[0]);
    } catch {
      return { ...memSettings };
    }
  },

  updateSystemSettings: async (updates) => {
    if (!db.isConfigured()) {
      memSettings = { ...memSettings, ...updates, currency: "LKR", currencySymbol: "Rs." };
      return { ...memSettings };
    }

    const current = await module.exports.getSystemSettings();
    const merged = { ...current, ...updates, currency: "LKR", currencySymbol: "Rs." };

    await db.query(`
      UPDATE system_settings
      SET organization_name = $1,
          currency = $2,
          currency_symbol = $3,
          default_contribution_rate = $4,
          max_loan_limit = $5,
          default_interest_rate = $6,
          auto_payroll_deduction = $7,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = 1
    `, [
      merged.organizationName,
      merged.currency,
      merged.currencySymbol,
      merged.defaultContributionRate,
      merged.maxLoanLimit,
      merged.defaultInterestRate,
      merged.autoPayrollDeduction
    ]);

    return merged;
  },

  // ── Authentication Users ──
  getUsers: async () => {
    if (!db.isConfigured()) return memUsers;
    const res = await db.query('SELECT * FROM users ORDER BY created_at ASC');
    return res.rows.map(mapUser);
  },

  getUserByEmail: async (email) => {
    if (!db.isConfigured()) {
      return memUsers.find(u => u.email.toLowerCase() === email.toLowerCase()) || null;
    }
    const res = await db.query('SELECT * FROM users WHERE LOWER(email) = LOWER($1) LIMIT 1', [email]);
    return res.rows.length > 0 ? mapUser(res.rows[0]) : null;
  },

  getUserById: async (id) => {
    if (!db.isConfigured()) {
      return memUsers.find(u => u.id === id) || null;
    }
    const res = await db.query('SELECT * FROM users WHERE id = $1 LIMIT 1', [id]);
    return res.rows.length > 0 ? mapUser(res.rows[0]) : null;
  },

  addUser: async (user) => {
    if (!db.isConfigured()) {
      memUsers.push(user);
      return user;
    }
    await db.query(`
      INSERT INTO users (id, email, password_hash, name, role, member_id, department, phone)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    `, [
      user.id,
      user.email.toLowerCase().trim(),
      user.passwordHash,
      user.name,
      user.role || 'member',
      user.memberId || null,
      user.department || null,
      user.phone || null
    ]);
    return user;
  },

  updateUserProfile: async (userId, updates) => {
    if (!db.isConfigured()) {
      const user = memUsers.find(u => u.id === userId);
      if (!user) return null;
      if (updates.name) user.name = updates.name.trim();
      if (updates.email) user.email = updates.email.trim().toLowerCase();
      if (updates.phone) user.phone = updates.phone.trim();
      if (updates.department) user.department = updates.department.trim();

      if (user.memberId) {
        const member = memMembers.find(m => m.memberId === user.memberId);
        if (member) {
          if (updates.name) member.name = updates.name.trim();
          if (updates.email) member.email = updates.email.trim().toLowerCase();
          if (updates.phone) member.phone = updates.phone.trim();
          if (updates.department) member.department = updates.department.trim();
        }
      }
      return { id: user.id, email: user.email, name: user.name, role: user.role, memberId: user.memberId, department: user.department, phone: user.phone };
    }

    const current = await module.exports.getUserById(userId);
    if (!current) return null;

    const newName = updates.name ? updates.name.trim() : current.name;
    const newEmail = updates.email ? updates.email.trim().toLowerCase() : current.email;
    const newPhone = updates.phone ? updates.phone.trim() : current.phone;
    const newDept = updates.department ? updates.department.trim() : current.department;

    await db.query(`
      UPDATE users
      SET name = $1, email = $2, phone = $3, department = $4, updated_at = CURRENT_TIMESTAMP
      WHERE id = $5
    `, [newName, newEmail, newPhone, newDept, userId]);

    // Sync corresponding member record if mapped
    if (current.memberId) {
      await db.query(`
        UPDATE members
        SET name = $1, email = $2, phone = $3, department = $4, updated_at = CURRENT_TIMESTAMP
        WHERE member_id = $5
      `, [newName, newEmail, newPhone, newDept, current.memberId]);
    }

    return {
      id: userId,
      email: newEmail,
      name: newName,
      role: current.role,
      memberId: current.memberId,
      department: newDept,
      phone: newPhone
    };
  },

  changeUserPassword: async (userId, currentPassword, newPassword) => {
    if (!db.isConfigured()) {
      const user = memUsers.find(u => u.id === userId);
      if (!user) return { success: false, error: 'User not found.' };
      const valid = bcrypt.compareSync(currentPassword, user.passwordHash);
      if (!valid) return { success: false, error: 'Incorrect current password.' };
      user.passwordHash = bcrypt.hashSync(newPassword, 10);
      return { success: true };
    }

    const user = await module.exports.getUserById(userId);
    if (!user) return { success: false, error: 'User not found.' };

    const valid = bcrypt.compareSync(currentPassword, user.passwordHash);
    if (!valid) {
      return { success: false, error: 'Incorrect current password.' };
    }

    const newHash = bcrypt.hashSync(newPassword, 10);
    await db.query('UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [newHash, userId]);
    return { success: true };
  },

  // ── Members ──
  getMembers: async () => {
    if (!db.isConfigured()) return memMembers;
    const res = await db.query('SELECT * FROM members ORDER BY created_at DESC');
    return res.rows.map(mapMember);
  },

  getMemberById: async (id) => {
    if (!db.isConfigured()) {
      return memMembers.find(m => m.id === id || m.memberId === id) || null;
    }
    const res = await db.query('SELECT * FROM members WHERE id = $1 OR member_id = $1 LIMIT 1', [id]);
    return res.rows.length > 0 ? mapMember(res.rows[0]) : null;
  },

  getNextMemberId: async () => {
    if (!db.isConfigured()) {
      let maxNum = 1000;
      const existing = new Set();
      for (const m of memMembers) {
        if (!m.memberId) continue;
        const mid = m.memberId.trim();
        existing.add(mid.toUpperCase());
        const match = mid.match(/^WLF-(\d+)$/i);
        if (match) {
          const num = parseInt(match[1], 10);
          if (!isNaN(num) && num > maxNum) maxNum = num;
        }
      }
      let candidateNum = maxNum + 1;
      let candidateId = `WLF-${candidateNum}`;
      while (existing.has(candidateId.toUpperCase())) {
        candidateNum++;
        candidateId = `WLF-${candidateNum}`;
      }
      return candidateId;
    }

    try {
      const res = await db.query('SELECT member_id FROM members');
      let maxNum = 1000;
      const existing = new Set();
      for (const row of res.rows) {
        if (!row.member_id) continue;
        const mid = row.member_id.trim();
        existing.add(mid.toUpperCase());
        const match = mid.match(/^WLF-(\d+)$/i);
        if (match) {
          const num = parseInt(match[1], 10);
          if (!isNaN(num) && num > maxNum) maxNum = num;
        }
      }
      let candidateNum = maxNum + 1;
      let candidateId = `WLF-${candidateNum}`;
      while (existing.has(candidateId.toUpperCase())) {
        candidateNum++;
        candidateId = `WLF-${candidateNum}`;
      }
      return candidateId;
    } catch (err) {
      return `WLF-${Date.now().toString().slice(-6)}`;
    }
  },

  addMember: async (member) => {
    const cleanId = member.id || `mem_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const cleanMemberId = member.memberId || (await module.exports.getNextMemberId());
    const cleanEmail = member.email && typeof member.email === 'string' && member.email.trim() ? member.email.trim().toLowerCase() : null;

    const toInsert = {
      ...member,
      id: cleanId,
      memberId: cleanMemberId,
      email: cleanEmail
    };

    if (!db.isConfigured()) {
      memMembers.unshift(toInsert);
      return toInsert;
    }
    await db.query(`
      INSERT INTO members (
        id, member_id, name, email, phone, department, role, status, 
        monthly_contribution, total_contributed, join_date, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
    `, [
      toInsert.id,
      toInsert.memberId,
      toInsert.name,
      toInsert.email,
      toInsert.phone,
      toInsert.department || 'Operations',
      toInsert.role || 'Member',
      toInsert.status || 'Active',
      toInsert.monthlyContribution || 100,
      toInsert.totalContributed || 0,
      toInsert.joinDate || new Date().toISOString().split('T')[0],
      toInsert.notes || ''
    ]);
    return toInsert;
  },

  updateMember: async (id, updates) => {
    if (!db.isConfigured()) {
      const idx = memMembers.findIndex(m => m.id === id || m.memberId === id);
      if (idx === -1) return null;
      memMembers[idx] = { ...memMembers[idx], ...updates };
      return memMembers[idx];
    }

    const existing = await module.exports.getMemberById(id);
    if (!existing) return null;

    const name = updates.name !== undefined ? updates.name : existing.name;
    const email = updates.email !== undefined ? (updates.email && updates.email.trim ? updates.email.trim().toLowerCase() : null) : existing.email;
    const phone = updates.phone !== undefined ? updates.phone : existing.phone;
    const department = updates.department !== undefined ? updates.department : existing.department;
    const role = updates.role !== undefined ? updates.role : existing.role;
    const status = updates.status !== undefined ? updates.status : existing.status;
    const monthlyContribution = updates.monthlyContribution !== undefined ? Number(updates.monthlyContribution) : existing.monthlyContribution;
    const totalContributed = updates.totalContributed !== undefined ? Number(updates.totalContributed) : existing.totalContributed;
    const notes = updates.notes !== undefined ? updates.notes : existing.notes;

    const res = await db.query(`
      UPDATE members
      SET name = $1, email = $2, phone = $3, department = $4, role = $5,
          status = $6, monthly_contribution = $7, total_contributed = $8,
          notes = $9, updated_at = CURRENT_TIMESTAMP
      WHERE id = $10 OR member_id = $10
      RETURNING *
    `, [name, email, phone, department, role, status, monthlyContribution, totalContributed, notes, id]);

    return res.rows.length > 0 ? mapMember(res.rows[0]) : null;
  },

  deleteMember: async (id) => {
    if (!db.isConfigured()) {
      const idx = memMembers.findIndex(m => m.id === id || m.memberId === id);
      if (idx === -1) return false;
      memMembers.splice(idx, 1);
      return true;
    }
    const res = await db.query('DELETE FROM members WHERE id = $1 OR member_id = $1 RETURNING id', [id]);
    return res.rows.length > 0;
  },

  // ── Loans ──
  getLoans: async () => {
    if (!db.isConfigured()) return memLoans;
    const res = await db.query('SELECT * FROM loans ORDER BY created_at DESC');
    return res.rows.map(mapLoan);
  },

  getLoanById: async (id) => {
    if (!db.isConfigured()) {
      return memLoans.find(l => l.id === id || l.loanId === id) || null;
    }
    const res = await db.query('SELECT * FROM loans WHERE id = $1 OR loan_id = $1 LIMIT 1', [id]);
    return res.rows.length > 0 ? mapLoan(res.rows[0]) : null;
  },

  addLoan: async (loan) => {
    if (!db.isConfigured()) {
      memLoans.unshift(loan);
      return loan;
    }
    await db.query(`
      INSERT INTO loans (
        id, loan_id, member_id, member_name, principal_amount, interest_rate, 
        term_months, total_repayable, monthly_payment, amount_repaid, remaining_balance, 
        purpose, status, application_date, disbursed_date, next_due_date, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
    `, [
      loan.id,
      loan.loanId,
      loan.memberId,
      loan.memberName,
      loan.principalAmount,
      loan.interestRate,
      loan.termMonths,
      loan.totalRepayable,
      loan.monthlyPayment,
      loan.amountRepaid || 0,
      loan.remainingBalance,
      loan.purpose,
      loan.status || 'Pending',
      loan.applicationDate || new Date().toISOString().split('T')[0],
      loan.disbursedDate || null,
      loan.nextDueDate || null,
      loan.notes || ''
    ]);
    return loan;
  },

  updateLoan: async (id, updates) => {
    if (!db.isConfigured()) {
      const idx = memLoans.findIndex(l => l.id === id || l.loanId === id);
      if (idx === -1) return null;
      memLoans[idx] = { ...memLoans[idx], ...updates };
      return memLoans[idx];
    }

    const existing = await module.exports.getLoanById(id);
    if (!existing) return null;

    const status = updates.status !== undefined ? updates.status : existing.status;
    const amountRepaid = updates.amountRepaid !== undefined ? Number(updates.amountRepaid) : existing.amountRepaid;
    const remainingBalance = updates.remainingBalance !== undefined ? Number(updates.remainingBalance) : existing.remainingBalance;
    const disbursedDate = updates.disbursedDate !== undefined ? updates.disbursedDate : existing.disbursedDate;
    const nextDueDate = updates.nextDueDate !== undefined ? updates.nextDueDate : existing.nextDueDate;
    const notes = updates.notes !== undefined ? updates.notes : existing.notes;

    const res = await db.query(`
      UPDATE loans
      SET status = $1, amount_repaid = $2, remaining_balance = $3,
          disbursed_date = $4, next_due_date = $5, notes = $6, updated_at = CURRENT_TIMESTAMP
      WHERE id = $7 OR loan_id = $7
      RETURNING *
    `, [status, amountRepaid, remainingBalance, disbursedDate, nextDueDate, notes, id]);

    return res.rows.length > 0 ? mapLoan(res.rows[0]) : null;
  },

  // ── Contributions ──
  getContributions: async () => {
    if (!db.isConfigured()) return memContributions;
    const res = await db.query('SELECT * FROM contributions ORDER BY created_at DESC');
    return res.rows.map(mapContribution);
  },

  addContribution: async (contribution) => {
    if (!db.isConfigured()) {
      memContributions.unshift(contribution);
      const member = memMembers.find(m => m.memberId === contribution.memberId);
      if (member) {
        member.totalContributed = (Number(member.totalContributed) || 0) + Number(contribution.amount);
      }
      return contribution;
    }

    const client = await db.getClient();
    try {
      await client.query('BEGIN');

      await client.query(`
        INSERT INTO contributions (
          id, receipt_no, member_id, member_name, amount, month_covered, payment_method, payment_date, notes
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `, [
        contribution.id,
        contribution.receiptNo,
        contribution.memberId,
        contribution.memberName,
        contribution.amount,
        contribution.monthCovered,
        contribution.paymentMethod || 'Payroll Deduction',
        contribution.paymentDate || new Date().toISOString().split('T')[0],
        contribution.notes || ''
      ]);

      // Atomically increment member's totalContributed
      await client.query(`
        UPDATE members
        SET total_contributed = total_contributed + $1, updated_at = CURRENT_TIMESTAMP
        WHERE member_id = $2
      `, [contribution.amount, contribution.memberId]);

      await client.query('COMMIT');
      return contribution;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },

  // ── Financial Transactions (Income & Expenses) ──
  getTransactions: async () => {
    if (!db.isConfigured()) return memTransactions;
    const res = await db.query('SELECT * FROM transactions ORDER BY date DESC, recorded_at DESC');
    return res.rows.map(mapTransaction);
  },

  getTransactionById: async (id) => {
    if (!db.isConfigured()) {
      return memTransactions.find(t => t.id === id || t.voucherNo === id) || null;
    }
    const res = await db.query('SELECT * FROM transactions WHERE id = $1 OR voucher_no = $1 LIMIT 1', [id]);
    return res.rows.length > 0 ? mapTransaction(res.rows[0]) : null;
  },

  addTransaction: async (tx) => {
    if (!db.isConfigured()) {
      memTransactions.unshift(tx);
      return tx;
    }
    await db.query(`
      INSERT INTO transactions (
        id, voucher_no, type, category, category_name, amount, date, 
        title, description, party_name, payment_method, receipt_or_voucher_ref, recorded_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
    `, [
      tx.id,
      tx.voucherNo,
      tx.type,
      tx.category,
      tx.categoryName,
      tx.amount,
      tx.date || new Date().toISOString().split('T')[0],
      tx.title,
      tx.description || '',
      tx.partyName,
      tx.paymentMethod || 'Cash',
      tx.receiptOrVoucherRef || '',
      tx.recordedBy || 'admin@welfare.org'
    ]);
    return tx;
  },

  deleteTransaction: async (id) => {
    if (!db.isConfigured()) {
      const idx = memTransactions.findIndex(t => t.id === id || t.voucherNo === id);
      if (idx === -1) return false;
      memTransactions.splice(idx, 1);
      return true;
    }
    const res = await db.query('DELETE FROM transactions WHERE id = $1 OR voucher_no = $1 RETURNING id', [id]);
    return res.rows.length > 0;
  },

  // ── Fund Analytics Aggregate ──
  getFundSummary: async () => {
    if (!db.isConfigured()) {
      const allMembersContributed = memMembers.reduce((sum, m) => sum + (Number(m.totalContributed) || 0), 0);
      const disbursedLoans = memLoans.filter(l => l.status === "Active" || l.status === "Fully Repaid");
      const totalDisbursed = disbursedLoans.reduce((sum, l) => sum + (Number(l.principalAmount) || 0), 0);
      const totalRepaid = disbursedLoans.reduce((sum, l) => sum + (Number(l.amountRepaid) || 0), 0);
      const totalOutstanding = disbursedLoans.filter(l => l.status === "Active").reduce((sum, l) => sum + (Number(l.remainingBalance) || 0), 0);
      const totalOtherIncome = memTransactions.filter(t => t.type === "income").reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
      const totalExpenses = memTransactions.filter(t => t.type === "expense").reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

      const currentCashPool = INITIAL_RESERVE + allMembersContributed + totalRepaid + totalOtherIncome - totalDisbursed - totalExpenses;

      return {
        currentCashPool: Math.max(0, currentCashPool),
        initialReserve: INITIAL_RESERVE,
        totalContributionsCollected: allMembersContributed,
        totalDisbursedLoans: totalDisbursed,
        totalRepaymentsReceived: totalRepaid,
        totalOutstandingDebt: totalOutstanding,
        totalOtherIncome,
        totalExpenses,
        netCashFlow: (allMembersContributed + totalRepaid + totalOtherIncome) - (totalDisbursed + totalExpenses),
        totalMembers: memMembers.length,
        activeMembers: memMembers.filter(m => m.status === "Active").length,
        activeLoansCount: memLoans.filter(l => l.status === "Active").length,
        pendingLoansCount: memLoans.filter(l => l.status === "Pending").length,
        recentContributionsCount: memContributions.length,
        transactionsCount: memTransactions.length
      };
    }

    // Execute optimized aggregate queries on PostgreSQL
    const [memberAgg, loanAgg, txAgg, contCount] = await Promise.all([
      db.query(`
        SELECT 
          COUNT(*) AS total_members,
          COUNT(*) FILTER (WHERE status = 'Active') AS active_members,
          COALESCE(SUM(total_contributed), 0) AS total_contributed
        FROM members
      `),
      db.query(`
        SELECT 
          COUNT(*) FILTER (WHERE status = 'Active') AS active_loans,
          COUNT(*) FILTER (WHERE status = 'Pending') AS pending_loans,
          COALESCE(SUM(principal_amount) FILTER (WHERE status IN ('Active', 'Fully Repaid')), 0) AS total_disbursed,
          COALESCE(SUM(amount_repaid) FILTER (WHERE status IN ('Active', 'Fully Repaid')), 0) AS total_repaid,
          COALESCE(SUM(remaining_balance) FILTER (WHERE status = 'Active'), 0) AS total_outstanding
        FROM loans
      `),
      db.query(`
        SELECT 
          COUNT(*) AS total_transactions,
          COALESCE(SUM(amount) FILTER (WHERE type = 'income'), 0) AS total_other_income,
          COALESCE(SUM(amount) FILTER (WHERE type = 'expense'), 0) AS total_expenses
        FROM transactions
      `),
      db.query(`SELECT COUNT(*) AS count FROM contributions`)
    ]);

    const m = memberAgg.rows[0];
    const l = loanAgg.rows[0];
    const t = txAgg.rows[0];
    const c = contCount.rows[0];

    const allMembersContributed = Number(m.total_contributed) || 0;
    const totalDisbursed = Number(l.total_disbursed) || 0;
    const totalRepaid = Number(l.total_repaid) || 0;
    const totalOutstanding = Number(l.total_outstanding) || 0;
    const totalOtherIncome = Number(t.total_other_income) || 0;
    const totalExpenses = Number(t.total_expenses) || 0;

    const currentCashPool = INITIAL_RESERVE + allMembersContributed + totalRepaid + totalOtherIncome - totalDisbursed - totalExpenses;

    return {
      currentCashPool: Math.max(0, currentCashPool),
      initialReserve: INITIAL_RESERVE,
      totalContributionsCollected: allMembersContributed,
      totalDisbursedLoans: totalDisbursed,
      totalRepaymentsReceived: totalRepaid,
      totalOutstandingDebt: totalOutstanding,
      totalOtherIncome,
      totalExpenses,
      netCashFlow: (allMembersContributed + totalRepaid + totalOtherIncome) - (totalDisbursed + totalExpenses),
      totalMembers: parseInt(m.total_members, 10) || 0,
      activeMembers: parseInt(m.active_members, 10) || 0,
      activeLoansCount: parseInt(l.active_loans, 10) || 0,
      pendingLoansCount: parseInt(l.pending_loans, 10) || 0,
      recentContributionsCount: parseInt(c.count, 10) || 0,
      transactionsCount: parseInt(t.total_transactions, 10) || 0
    };
  }
};
