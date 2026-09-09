/**
 * Test script to verify account balance management and fund summary calculations
 */
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const fundController = require('../controllers/fundController');
const store = require('../models/store');
const schema = require('../models/schema');
const db = require('../config/db');

async function runTests() {
  console.log('🧪 Starting account balance management tests...\n');
  await schema.initDatabase();
  let passed = 0;
  let failed = 0;

  function mockRes() {
    return {
      statusCode: 200,
      body: null,
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(data) {
        this.body = data;
        return this;
      }
    };
  }

  try {
    // Check initial fund summary
    console.log('--- Test 1: Fetch initial fund summary ---');
    const initialSummary = await store.getFundSummary();
    console.log(`ℹ️ Current Cash Pool: ${initialSummary.currentCashPool}`);
    console.log(`ℹ️ Base Reserve: ${initialSummary.initialReserve}`);
    if (typeof initialSummary.currentCashPool === 'number' && typeof initialSummary.initialReserve === 'number') {
      console.log('✅ Test 1 Passed: Fund summary returned valid numeric cash pool and initial reserve.');
      passed++;
    } else {
      console.error('❌ Test 1 Failed: Invalid fund summary structure.');
      failed++;
    }

    const originalReserve = initialSummary.initialReserve;

    // Test 2: Update Initial Reserve via controller
    console.log('\n--- Test 2: Update initial reserve directly (e.g. 50,000) ---');
    const req2 = {
      user: { email: 'admin@welfare.org', role: 'admin' },
      body: { initialReserve: 50000 }
    };
    const res2 = mockRes();
    await fundController.updateFundBalance(req2, res2);

    if (res2.statusCode === 200 && res2.body.success && res2.body.data.initialReserve === 50000) {
      console.log('✅ Test 2 Passed: Initial reserve successfully updated to 50000.');
      passed++;
    } else {
      console.error('❌ Test 2 Failed:', res2.statusCode, res2.body);
      failed++;
    }

    // Test 3: Set target current cash balance without recording transaction (Reserve adjust mode)
    console.log('\n--- Test 3: Set target current balance without ledger transaction (e.g. 100,000) ---');
    const req3 = {
      user: { email: 'admin@welfare.org', role: 'admin' },
      body: { currentBalance: 100000, recordTransaction: false }
    };
    const res3 = mockRes();
    await fundController.updateFundBalance(req3, res3);

    if (res3.statusCode === 200 && res3.body.success && res3.body.data.currentCashPool === 100000) {
      console.log('✅ Test 3 Passed: Target current balance accurately set to 100000.');
      passed++;
    } else {
      console.error('❌ Test 3 Failed:', res3.statusCode, res3.body);
      failed++;
    }

    // Test 4: Set target current balance with ledger transaction (Audit mode)
    console.log('\n--- Test 4: Set target current balance with ledger transaction (e.g. 105,000) ---');
    const req4 = {
      user: { email: 'admin@welfare.org', role: 'admin' },
      body: { currentBalance: 105000, recordTransaction: true, notes: 'Automated test reconciliation' }
    };
    const res4 = mockRes();
    await fundController.updateFundBalance(req4, res4);

    if (res4.statusCode === 200 && res4.body.success && res4.body.data.currentCashPool === 105000) {
      console.log('✅ Test 4 Passed: Balance updated with transaction to 105000.');
      passed++;
    } else {
      console.error('❌ Test 4 Failed:', res4.statusCode, res4.body);
      failed++;
    }

    // Cleanup: Restore original reserve and clean test transaction
    console.log('\n--- Cleanup: Restoring original settings ---');
    await store.updateSystemSettings({ initialReserve: originalReserve });
    const transactions = await store.getTransactions();
    const testTx = transactions.find(t => t.description === 'Automated test reconciliation');
    if (testTx) {
      await store.deleteTransaction(testTx.id);
      console.log('🧹 Cleaned up test audit transaction:', testTx.voucherNo);
    }
    const finalSummary = await store.getFundSummary();
    console.log(`ℹ️ Final Restored Cash Pool: ${finalSummary.currentCashPool}, Reserve: ${finalSummary.initialReserve}`);

    console.log(`\n================================`);
    console.log(`Tests Completed: ${passed} Passed, ${failed} Failed`);
    console.log(`================================`);
  } catch (err) {
    console.error('Unexpected error in tests:', err);
    failed++;
  } finally {
    if (db.pool) {
      await db.pool.end();
    }
    process.exit(failed > 0 ? 1 : 0);
  }
}

runTests();
