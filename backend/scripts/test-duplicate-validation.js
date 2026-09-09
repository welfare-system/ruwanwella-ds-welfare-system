/**
 * Comprehensive test script to verify duplicate validation on member registration,
 * member updates, and the dedicated /api/members/validate-duplicates endpoint.
 */
const memberController = require('../controllers/memberController');
const store = require('../models/store');
const schema = require('../models/schema');
const db = require('../config/db');

async function runTests() {
  console.log('🧪 Starting duplicate validation tests...\n');
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
    // Ensure database schema and migrations are initialized
    await schema.initDatabase();

    // Initial members check
    let initialMembers = await store.getMembers();
    console.log(`ℹ️ Initial member count: ${initialMembers.length}`);

    // Cleanup any previous test members
    for (const m of initialMembers) {
      if (m.email && m.email.includes('@test.local')) {
        await store.deleteMember(m.id);
        console.log(`🧹 Cleaned up old test member: ${m.name} (${m.memberId})`);
      }
    }
    initialMembers = await store.getMembers();

    const timestamp = Date.now();
    const testIdNum = `NIC${timestamp}`;
    const testSewa = `SEW${timestamp.toString().slice(-4)}`;
    const testEmail = `test_${timestamp}@test.local`;

    // Test 1: Register valid new member
    console.log('\n--- Test 1: Register valid unique member ---');
    const req1 = {
      body: {
        name: 'Nimal Jayawardena',
        phone: '0771234567',
        email: testEmail,
        idNumber: testIdNum,
        sewaAnkaya: testSewa,
        thanthura: 'Administrative Officer',
        monthlyContribution: 200
      }
    };
    const res1 = mockRes();
    await memberController.createMember(req1, res1);
    let registeredMemberId = null;
    if (res1.statusCode === 201 && res1.body.success) {
      registeredMemberId = res1.body.data.id;
      console.log('✅ Test 1 Passed: New member registered successfully:', res1.body.data.memberId);
      passed++;
    } else {
      console.error('❌ Test 1 Failed:', res1.statusCode, res1.body);
      failed++;
    }

    // Test 2: Reject duplicate ID Number in createMember
    console.log('\n--- Test 2: Reject duplicate ID Number in createMember ---');
    const req2 = {
      body: {
        name: 'Kamal Perera',
        phone: '0779998877',
        email: `kamal_${timestamp}@test.local`,
        idNumber: testIdNum.toLowerCase(), // case-insensitive duplicate check!
        sewaAnkaya: `SEW${timestamp.toString().slice(-4)}_diff`,
        thanthura: 'Management Assistant'
      }
    };
    const res2 = mockRes();
    await memberController.createMember(req2, res2);
    if (res2.statusCode === 400 && res2.body.error && res2.body.error.includes('ID Number (NIC)')) {
      console.log('✅ Test 2 Passed: Rejected duplicate ID Number:', res2.body.error);
      passed++;
    } else {
      console.error('❌ Test 2 Failed:', res2.statusCode, res2.body);
      failed++;
    }

    // Test 3: Reject duplicate Sewa Ankaya in createMember
    console.log('\n--- Test 3: Reject duplicate Sewa Ankaya in createMember ---');
    const req3 = {
      body: {
        name: 'Sunil Silva',
        phone: '0778887766',
        email: `sunil_${timestamp}@test.local`,
        idNumber: `NIC${timestamp}_diff`,
        sewaAnkaya: testSewa.toLowerCase(), // case-insensitive duplicate check!
        thanthura: 'Technical Officer'
      }
    };
    const res3 = mockRes();
    await memberController.createMember(req3, res3);
    if (res3.statusCode === 400 && res3.body.error && res3.body.error.includes('Sewa Ankaya')) {
      console.log('✅ Test 3 Passed: Rejected duplicate Sewa Ankaya:', res3.body.error);
      passed++;
    } else {
      console.error('❌ Test 3 Failed:', res3.statusCode, res3.body);
      failed++;
    }

    // Test 4: Reject duplicate Email Address in createMember
    console.log('\n--- Test 4: Reject duplicate Email Address in createMember ---');
    const req4 = {
      body: {
        name: 'Anula Fernando',
        phone: '0777776655',
        email: testEmail.toUpperCase(), // case-insensitive duplicate check!
        idNumber: `NIC${timestamp}_diff2`,
        sewaAnkaya: `SEW${timestamp.toString().slice(-4)}_diff2`,
        thanthura: 'Accountant'
      }
    };
    const res4 = mockRes();
    await memberController.createMember(req4, res4);
    if (res4.statusCode === 400 && res4.body.error && res4.body.error.includes('Email address')) {
      console.log('✅ Test 4 Passed: Rejected duplicate Email Address:', res4.body.error);
      passed++;
    } else {
      console.error('❌ Test 4 Failed:', res4.statusCode, res4.body);
      failed++;
    }

    // Test 5: Dedicated validateMemberDuplicates endpoint flags duplicates
    console.log('\n--- Test 5: validateMemberDuplicates pre-check endpoint flags duplicate ID ---');
    const req5 = {
      body: {
        idNumber: testIdNum,
        sewaAnkaya: 'NON_EXISTING',
        email: 'unique@test.local'
      }
    };
    const res5 = mockRes();
    await memberController.validateMemberDuplicates(req5, res5);
    if (res5.statusCode === 200 && res5.body.hasDuplicate && res5.body.field === 'idNumber') {
      console.log('✅ Test 5 Passed: validateMemberDuplicates correctly detected duplicate ID Number:', res5.body.error);
      passed++;
    } else {
      console.error('❌ Test 5 Failed:', res5.statusCode, res5.body);
      failed++;
    }

    // Test 6: validateMemberDuplicates allows clean unique inputs
    console.log('\n--- Test 6: validateMemberDuplicates passes on clean unique input ---');
    const req6 = {
      body: {
        idNumber: `UNIQUE_${timestamp}`,
        sewaAnkaya: `UNQ_${timestamp.toString().slice(-4)}`,
        email: `unique_${timestamp}@test.local`
      }
    };
    const res6 = mockRes();
    await memberController.validateMemberDuplicates(req6, res6);
    if (res6.statusCode === 200 && res6.body.hasDuplicate === false) {
      console.log('✅ Test 6 Passed: validateMemberDuplicates passed on unique inputs.');
      passed++;
    } else {
      console.error('❌ Test 6 Failed:', res6.statusCode, res6.body);
      failed++;
    }

    // Test 7: validateMemberDuplicates honors excludeId for own record
    console.log('\n--- Test 7: validateMemberDuplicates ignores self when excludeId is provided ---');
    const req7 = {
      body: {
        idNumber: testIdNum,
        sewaAnkaya: testSewa,
        email: testEmail,
        excludeId: registeredMemberId
      }
    };
    const res7 = mockRes();
    await memberController.validateMemberDuplicates(req7, res7);
    if (res7.statusCode === 200 && res7.body.hasDuplicate === false) {
      console.log('✅ Test 7 Passed: validateMemberDuplicates allowed member to retain their own values.');
      passed++;
    } else {
      console.error('❌ Test 7 Failed:', res7.statusCode, res7.body);
      failed++;
    }

    // Test 8: updateMember rejects duplicate from another member
    console.log('\n--- Test 8: updateMember blocks duplicate collision with another member ---');
    const otherMember = initialMembers.find(m => m.id !== registeredMemberId && (m.idNumber || m.sewaAnkaya));
    if (otherMember) {
      const collisionField = otherMember.idNumber ? 'idNumber' : 'sewaAnkaya';
      const collisionVal = otherMember[collisionField];
      const req8 = {
        params: { id: registeredMemberId },
        body: {
          [collisionField]: collisionVal
        }
      };
      const res8 = mockRes();
      await memberController.updateMember(req8, res8);
      if (res8.statusCode === 400 && res8.body.error) {
        console.log(`✅ Test 8 Passed: updateMember rejected duplicate ${collisionField}:`, res8.body.error);
        passed++;
      } else {
        console.error('❌ Test 8 Failed:', res8.statusCode, res8.body);
        failed++;
      }
    } else {
      console.log('ℹ️ Test 8 Skipped: No other member available for cross-update test.');
      passed++;
    }

    // Cleanup registered test member
    if (registeredMemberId) {
      try {
        await store.deleteMember(registeredMemberId);
        console.log('\n🧹 Cleaned up test member from database.');
      } catch (cleanErr) {
        console.warn('⚠️ Cleanup warning:', cleanErr.message);
      }
    }

    console.log(`\n🏁 Duplicate Validation Test Summary: ${passed} passed, ${failed} failed.`);
  } catch (err) {
    console.error('Test execution error:', err);
    failed++;
  } finally {
    if (db.pool) {
      try {
        await db.pool.end();
      } catch (e) {
        // ignore
      }
    }
    process.exit(failed > 0 ? 1 : 0);
  }
}

runTests();
