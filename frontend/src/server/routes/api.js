const express = require('express');
const router = express.Router();

const authController = require('../controllers/authController');
const memberController = require('../controllers/memberController');
const loanController = require('../controllers/loanController');
const contributionController = require('../controllers/contributionController');
const fundController = require('../controllers/fundController');
const settingsController = require('../controllers/settingsController');
const financeController = require('../controllers/financeController');
const db = require('../config/db');
const { authenticateToken, optionalAuth, requireRole } = require('../middleware/auth');

// ── Health & Diagnostics ────────────────────────────────────────────────────
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'Welfare Management Backend',
    version: '1.5.0',
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    database: db.isConfigured() ? (db.isConnected() ? 'connected' : 'ready') : 'in-memory-fallback'
  });
});

// ── Authentication Routes ───────────────────────────────────────────────────
router.post('/auth/login', authController.login);
router.get('/auth/me', authenticateToken, authController.getMe);
router.post('/auth/logout', authController.logout);

// ── Settings Routes ─────────────────────────────────────────────────────────
router.get('/settings/system', settingsController.getSystemSettings);
router.put('/settings/system', authenticateToken, requireRole('admin'), settingsController.updateSystemSettings);
router.put('/settings/profile', authenticateToken, settingsController.updateProfile);
router.put('/settings/password', authenticateToken, settingsController.changePassword);

// ── Fund Analytics ──────────────────────────────────────────────────────────
router.get('/fund/summary', fundController.getFundSummary);

// ── Members API ─────────────────────────────────────────────────────────────
router.get('/members', memberController.getAllMembers);
router.get('/members/:id', memberController.getMemberById);
router.post('/members', authenticateToken, requireRole('admin', 'member'), memberController.createMember);
router.put('/members/:id', authenticateToken, requireRole('admin'), memberController.updateMember);
router.delete('/members/:id', authenticateToken, requireRole('admin'), memberController.deleteMember);

// ── Loans API ───────────────────────────────────────────────────────────────
router.get('/loans', loanController.getAllLoans);
router.get('/loans/:id', loanController.getLoanById);
router.post('/loans', optionalAuth, loanController.createLoan);
router.patch('/loans/:id/status', authenticateToken, requireRole('admin'), loanController.updateLoanStatus);
router.post('/loans/:id/pay', optionalAuth, loanController.recordLoanPayment);

// ── Contributions API ───────────────────────────────────────────────────────
router.get('/contributions', contributionController.getAllContributions);
router.post('/contributions', optionalAuth, contributionController.recordContribution);

// ── Finance (Income & Expenses) API ─────────────────────────────────────────
router.get('/finance/summary', financeController.getTransactionSummary);
router.get('/finance/transactions', financeController.getAllTransactions);
router.get('/finance/transactions/:id', financeController.getTransactionById);
router.post('/finance/transactions', optionalAuth, financeController.createTransaction);
router.delete('/finance/transactions/:id', authenticateToken, requireRole('admin'), financeController.deleteTransaction);

module.exports = router;
