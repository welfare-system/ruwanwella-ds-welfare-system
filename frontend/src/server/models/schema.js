/**
 * Neon PostgreSQL Schema Definition & Seed Migration (Next.js Serverless Edition)
 * 
 * Automatically initializes database tables and seeds realistic default data
 * on initial deployment or when connecting to a fresh database instance.
 */

const bcrypt = require('bcryptjs');
const db = require('../config/db');

const CREATE_TABLES_SQL = `
-- 1. System Settings Table
CREATE TABLE IF NOT EXISTS system_settings (
  id INTEGER PRIMARY KEY DEFAULT 1,
  organization_name VARCHAR(255) NOT NULL DEFAULT 'Staff Welfare Association',
  currency VARCHAR(10) NOT NULL DEFAULT 'LKR',
  currency_symbol VARCHAR(10) NOT NULL DEFAULT 'Rs.',
  default_contribution_rate NUMERIC(12,2) NOT NULL DEFAULT 2500,
  max_loan_limit NUMERIC(12,2) NOT NULL DEFAULT 500000,
  default_interest_rate NUMERIC(5,2) NOT NULL DEFAULT 4.5,
  auto_payroll_deduction BOOLEAN NOT NULL DEFAULT TRUE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 2. Members Table
CREATE TABLE IF NOT EXISTS members (
  id VARCHAR(64) PRIMARY KEY,
  member_id VARCHAR(32) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(50) NOT NULL,
  department VARCHAR(100) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'Member',
  status VARCHAR(20) NOT NULL DEFAULT 'Active',
  monthly_contribution NUMERIC(12,2) NOT NULL DEFAULT 100,
  total_contributed NUMERIC(12,2) NOT NULL DEFAULT 0,
  join_date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 3. Users Table (Authentication)
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(64) PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'member',
  member_id VARCHAR(32) REFERENCES members(member_id) ON DELETE SET NULL,
  department VARCHAR(100),
  phone VARCHAR(50),
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 4. Loans Table
CREATE TABLE IF NOT EXISTS loans (
  id VARCHAR(64) PRIMARY KEY,
  loan_id VARCHAR(32) UNIQUE NOT NULL,
  member_id VARCHAR(32) REFERENCES members(member_id) ON DELETE CASCADE,
  member_name VARCHAR(255) NOT NULL,
  principal_amount NUMERIC(12,2) NOT NULL,
  interest_rate NUMERIC(5,2) NOT NULL DEFAULT 4.5,
  term_months INTEGER NOT NULL,
  total_repayable NUMERIC(12,2) NOT NULL,
  monthly_payment NUMERIC(12,2) NOT NULL,
  amount_repaid NUMERIC(12,2) NOT NULL DEFAULT 0,
  remaining_balance NUMERIC(12,2) NOT NULL,
  purpose TEXT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'Pending',
  application_date DATE NOT NULL DEFAULT CURRENT_DATE,
  disbursed_date DATE,
  next_due_date DATE,
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 5. Contributions Table
CREATE TABLE IF NOT EXISTS contributions (
  id VARCHAR(64) PRIMARY KEY,
  receipt_no VARCHAR(32) UNIQUE NOT NULL,
  member_id VARCHAR(32) REFERENCES members(member_id) ON DELETE CASCADE,
  member_name VARCHAR(255) NOT NULL,
  amount NUMERIC(12,2) NOT NULL,
  month_covered VARCHAR(50) NOT NULL,
  payment_method VARCHAR(50) NOT NULL DEFAULT 'Payroll Deduction',
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 6. Transactions Table (Incomes and Expenses)
CREATE TABLE IF NOT EXISTS transactions (
  id VARCHAR(64) PRIMARY KEY,
  voucher_no VARCHAR(32) UNIQUE NOT NULL,
  type VARCHAR(20) NOT NULL,
  category VARCHAR(50) NOT NULL,
  category_name VARCHAR(255) NOT NULL,
  amount NUMERIC(12,2) NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  title VARCHAR(255) NOT NULL,
  description TEXT DEFAULT '',
  party_name VARCHAR(255) NOT NULL,
  payment_method VARCHAR(50) NOT NULL DEFAULT 'Cash',
  receipt_or_voucher_ref VARCHAR(100),
  recorded_by VARCHAR(255) NOT NULL DEFAULT 'admin@welfare.org',
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
`;

/**
 * Initializes database tables and inserts seed records if empty
 */
async function initDatabase() {
  if (!db.isConfigured()) {
    return;
  }

  try {
    await db.query(CREATE_TABLES_SQL);

    // 1. Seed System Settings
    const settingsCheck = await db.query('SELECT COUNT(*) FROM system_settings');
    if (parseInt(settingsCheck.rows[0].count, 10) === 0) {
      await db.query(`
        INSERT INTO system_settings (
          id, organization_name, currency, currency_symbol, 
          default_contribution_rate, max_loan_limit, default_interest_rate, auto_payroll_deduction
        ) VALUES (1, 'Staff Welfare Association', 'LKR', 'Rs.', 2500, 500000, 4.5, TRUE)
      `);
    }

    // 2. Seed Members
    const membersCheck = await db.query('SELECT COUNT(*) FROM members');
    if (parseInt(membersCheck.rows[0].count, 10) === 0) {
      const seedMembers = [
        ['mem_1', 'WLF-1001', 'Dr. Evelyn Vance', 'evelyn.vance@org.internal', '+1 (555) 234-5678', 'Medical Operations', 'Chairperson', 'Active', 150, 3600, '2024-01-15', 'Founding member of the welfare committee.'],
        ['mem_2', 'WLF-1002', 'Marcus Aurelius Thorne', 'marcus.thorne@org.internal', '+1 (555) 345-6789', 'Logistics & Transport', 'Member', 'Active', 100, 2400, '2024-03-10', 'Consistent monthly payroll deductions.'],
        ['mem_3', 'WLF-1003', 'Sophia Chen', 'sophia.chen@org.internal', '+1 (555) 456-7890', 'Information Technology', 'Treasurer', 'Active', 200, 4800, '2024-02-01', 'Oversees fund auditing and disbursements.'],
        ['mem_4', 'WLF-1004', 'David K. O\'Connor', 'david.oconnor@org.internal', '+1 (555) 567-8901', 'Human Resources', 'Member', 'Active', 120, 2880, '2024-05-20', 'Active contributor with one completed loan.'],
        ['mem_5', 'WLF-1005', 'Amara Ndiaye', 'amara.ndiaye@org.internal', '+1 (555) 678-9012', 'Field Research', 'Member', 'Active', 100, 1900, '2024-08-14', 'Enrolled via new hire welfare orientation.']
      ];

      for (const m of seedMembers) {
        await db.query(`
          INSERT INTO members (
            id, member_id, name, email, phone, department, role, status, 
            monthly_contribution, total_contributed, join_date, notes
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        `, m);
      }
    }

    // 3. Seed Users
    const usersCheck = await db.query('SELECT COUNT(*) FROM users');
    if (parseInt(usersCheck.rows[0].count, 10) === 0) {
      const adminHash = bcrypt.hashSync('AdminPassword123!', 10);
      const memberHash = bcrypt.hashSync('MemberPassword123!', 10);

      const seedUsers = [
        ['usr_admin', 'admin@welfare.org', adminHash, 'System Administrator', 'admin', null, 'Executive Committee', '+1 (555) 000-1122'],
        ['usr_marcus', 'marcus.thorne@org.internal', memberHash, 'Marcus Aurelius Thorne', 'member', 'WLF-1002', 'Logistics & Transport', '+1 (555) 345-6789'],
        ['usr_evelyn', 'evelyn.vance@org.internal', memberHash, 'Dr. Evelyn Vance', 'admin', 'WLF-1001', 'Medical Operations', '+1 (555) 234-5678']
      ];

      for (const u of seedUsers) {
        await db.query(`
          INSERT INTO users (
            id, email, password_hash, name, role, member_id, department, phone
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `, u);
      }
    }

    // 4. Seed Loans
    const loansCheck = await db.query('SELECT COUNT(*) FROM loans');
    if (parseInt(loansCheck.rows[0].count, 10) === 0) {
      const seedLoans = [
        ['loan_1', 'LN-2026-001', 'WLF-1002', 'Marcus Aurelius Thorne', 3000, 4.5, 12, 3135, 261.25, 1567.50, 1567.50, 'Home repair emergency assistance', 'Active', '2026-02-01', '2026-02-05', '2026-10-05', ''],
        ['loan_2', 'LN-2026-002', 'WLF-1005', 'Amara Ndiaye', 1500, 4.0, 6, 1530, 255.00, 0, 1530.00, 'Higher education certification course', 'Pending', '2026-09-01', null, null, ''],
        ['loan_3', 'LN-2025-089', 'WLF-1004', 'David K. O\'Connor', 2000, 4.0, 10, 2080, 208.00, 2080.00, 0.00, 'Medical expenditure reimbursement', 'Fully Repaid', '2025-08-10', '2025-08-15', null, '']
      ];

      for (const l of seedLoans) {
        await db.query(`
          INSERT INTO loans (
            id, loan_id, member_id, member_name, principal_amount, interest_rate, 
            term_months, total_repayable, monthly_payment, amount_repaid, remaining_balance, 
            purpose, status, application_date, disbursed_date, next_due_date, notes
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
        `, l);
      }
    }

    // 5. Seed Contributions
    const contCheck = await db.query('SELECT COUNT(*) FROM contributions');
    if (parseInt(contCheck.rows[0].count, 10) === 0) {
      const seedCont = [
        ['cnt_1', 'REC-9001', 'WLF-1001', 'Dr. Evelyn Vance', 150, 'September 2026', 'Payroll Deduction', '2026-09-01', 'Auto-deducted'],
        ['cnt_2', 'REC-9002', 'WLF-1002', 'Marcus Aurelius Thorne', 100, 'September 2026', 'Payroll Deduction', '2026-09-01', 'Auto-deducted'],
        ['cnt_3', 'REC-9003', 'WLF-1003', 'Sophia Chen', 200, 'September 2026', 'Bank Transfer', '2026-09-02', 'Direct EFT transfer'],
        ['cnt_4', 'REC-9004', 'WLF-1004', 'David K. O\'Connor', 120, 'September 2026', 'Payroll Deduction', '2026-09-01', 'Auto-deducted'],
        ['cnt_5', 'REC-9005', 'WLF-1005', 'Amara Ndiaye', 100, 'September 2026', 'Cash / Direct Deposit', '2026-09-04', 'Receipt verified by Treasurer']
      ];

      for (const c of seedCont) {
        await db.query(`
          INSERT INTO contributions (
            id, receipt_no, member_id, member_name, amount, month_covered, payment_method, payment_date, notes
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        `, c);
      }
    }

    // 6. Seed Transactions
    const txCheck = await db.query('SELECT COUNT(*) FROM transactions');
    if (parseInt(txCheck.rows[0].count, 10) === 0) {
      const seedTx = [
        ['tx_1', 'INC-2026-001', 'income', 'hall_rent', 'ශාලා කුලිය (Hall Rent)', 45000, '2026-09-02', 'ප්‍රජා ශාලාව විවාහ උත්සවයක් සඳහා කුලියට දීම', 'ප්‍රධාන ශාලාව සහ ශබ්ද පරිපාලන පද්ධතිය පැය 8ක කාලයක් සඳහා කුලියට දීම', 'කේ. එම්. නිහාල් විජේසිංහ මහතා', 'Bank Transfer', 'RCT-9912', 'admin@welfare.org'],
        ['tx_2', 'INC-2026-002', 'income', 'shop_rent', 'වෙළඳසැල් කුලිය (Shop Rent)', 35000, '2026-09-01', 'සුබසාධක සංකීර්ණ අංක 03 වෙළඳසැල් මාසික කුලිය', '2026 සැප්තැම්බර් මස සඳහා මාසික වෙළඳ කුලිය', 'එස්. කුමාර වෙළඳ සහෝදරයෝ', 'Bank Transfer', 'RCT-9913', 'admin@welfare.org'],
        ['tx_3', 'INC-2026-003', 'income', 'donations', 'විශේෂ පරිත්‍යාග (Donations)', 25000, '2026-08-28', 'වාර්ෂික සුබසාධක ප්‍රදාන සහ සුබපැතුම් ආධාර', 'විධායක සාමාජිකයන්ගේ ස්වේච්ඡා අරමුදල් පරිත්‍යාගය', 'වෛද්‍ය සංගම් සුබසාධක අංශය', 'Cheque', 'CHQ-8820', 'admin@welfare.org'],
        ['tx_4', 'INC-2026-004', 'income', 'fund_interest', 'අරමුදල් පොලී ආදායම් (Bank Interest)', 12500, '2026-08-31', 'සුබසාධක ස්ථාවර තැන්පතු අගෝස්තු මස පොලී ලාභය', 'මහජන බැංකු ඉතිරි කිරීමේ සහ ස්ථාවර තැන්පතු පොලිය', 'People\'s Bank Sri Lanka', 'Bank Transfer', 'BNK-INT-08', 'admin@welfare.org'],
        ['tx_5', 'EXP-2026-001', 'expense', 'funeral_aid', 'මරණාධාර (Funeral Aid)', 25000, '2026-09-03', 'සාමාජික පවුලේ අවමංගල්‍ය මරණාධාර ප්‍රදානය', 'සාමාජික WLF-1002 මාකස් තෝර්න් මහතාගේ මවගේ අභාවය වෙනුවෙන් සුබසාධක ආධාරය', 'මාකස් තෝර්න් මහතා', 'Bank Transfer', 'VCH-701', 'admin@welfare.org'],
        ['tx_6', 'EXP-2026-002', 'expense', 'sports', 'ක්‍රීඩා කටයුතු (Sports)', 18500, '2026-08-25', 'අන්තර් දෙපාර්තමේන්තු ක්‍රිකට් තරගාවලි වියදම්', 'ක්‍රිකට් ක්‍රීඩාංගණ ගාස්තු, පිති සහ පන්දු මිලදී ගැනීම්', 'ස්පෝර්ට්ස් ප්ලැනට් පුද්ගලික සමාගම', 'Cash', 'VCH-702', 'admin@welfare.org'],
        ['tx_7', 'EXP-2026-003', 'expense', 'religious_festivals', 'ආගමික උත්සව (Religious Festivals)', 22000, '2026-08-15', 'වාර්ෂික සර්වරාත්‍රික පරිත්‍රාණ ධර්ම දේශනය සහ දානමය පුණ්‍යකර්මය', 'මල්, පහන්, මණ්ඩප සැරසිලි සහ මහා සංඝරත්නය උදෙසා දානමය වියදම්', 'ශ්‍රී සුදර්ශනාරාම විහාරස්ථ කාර්ය සාධක සභාව', 'Bank Transfer', 'VCH-703', 'admin@welfare.org'],
        ['tx_8', 'EXP-2026-004', 'expense', 'maintenance', 'නඩත්තු සහ අලුත්වැඩියා (Maintenance)', 14000, '2026-08-20', 'ප්‍රජා ශාලාවේ විදුලි පරිපථ සහ LED ආලෝක පද්ධති අලුත්වැඩියාව', 'ප්‍රධාන ශාලාවේ දැවීගිය බල්බ මාරු කිරීම සහ පරිපථ පරීක්ෂාව', 'ලංකා විදුලි සහ ඉලෙක්ට්‍රොනික් සේවා', 'Cash', 'VCH-704', 'admin@welfare.org']
      ];

      for (const t of seedTx) {
        await db.query(`
          INSERT INTO transactions (
            id, voucher_no, type, category, category_name, amount, date, 
            title, description, party_name, payment_method, receipt_or_voucher_ref, recorded_by
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        `, t);
      }
    }
  } catch (err) {
    console.error('❌ Database initialization error:', err);
    throw err;
  }
}

module.exports = {
  CREATE_TABLES_SQL,
  initDatabase
};
