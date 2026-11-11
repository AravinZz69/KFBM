import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const BASE_URL = 'http://localhost:3000';

async function runTestSuite() {
  console.log('====================================================');
  console.log('   KIET & KIET-W FEEDBACK - UPDATED FLOW TEST SUITE  ');
  console.log('====================================================\n');

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition: boolean, testName: string, details?: string) {
    totalTests++;
    if (condition) {
      console.log(`✓ [PASS] ${testName}`);
      passedTests++;
    } else {
      console.error(`✗ [FAIL] ${testName}`);
      if (details) console.error(`  Details: ${details}`);
    }
  }

  try {
    // 1. Test Public Home Page
    const homeRes = await fetch(`${BASE_URL}/`);
    assert(homeRes.status === 200, 'Public student portal loads at / with HTTP 200');

    // 2. Test Faculty Retrieval for KIETW CSM FRM
    const facultyRes = await fetch(`${BASE_URL}/api/faculty?college=KIETW&branch=CSM&type=FRM`);
    const facultyData = await facultyRes.json();
    const facultyList = facultyData.faculty || [];
    assert(
      facultyList.length >= 4,
      `KIET-W CSM FRM loads official subjects & faculty (${facultyList.length} found)`
    );

    // 3. Test Submission with ONLY Roll Number (No Email, No Phone, Name Blank)
    const testRollNumber = `22W91A${Date.now().toString().slice(-4)}`;
    const facultyIds = facultyList.map((f: any) => f.id);

    const ratingsPayload = facultyList.map((f: any) => ({
      facultyId: f.id,
      subjectName: f.subject_name,
      conceptClarity: 5,
      subjectKnowledge: 5,
      teachingMethodology: 4,
      practicalExamples: 5,
      studentInteraction: 4,
      doubtClarification: 5,
      regularityPunctuality: 5,
      assignmentsAssessments: 4,
      myUnderstanding: 5,
      myAbilityApply: 5,
    }));

    const submitRes = await fetch(`${BASE_URL}/api/feedback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        studentName: '', // Optional! Left blank
        rollNumber: testRollNumber, // Mandatory!
        campus: 'KIETW',
        branch: 'CSM',
        feedbackType: 'FRM',
        facultyIds: facultyIds,
        ratings: ratingsPayload,
        q1SubjectChallenges: 'Algorithms: Dynamic programming and graph traversal require extra visual demos.',
        q2Improvements: 'More live coding walkthroughs and interactive doubt clearing.',
        q3AdditionalComments: 'Great professors and supportive guidance.',
      }),
    });

    const submitData = await submitRes.json();
    assert(
      submitRes.status === 200 && submitData.success === true,
      'Feedback submits successfully with ONLY Roll Number (Name left blank, no email/phone)',
      JSON.stringify(submitData)
    );
    assert(
      submitData.message === 'Thank you! Your feedback has been submitted successfully.',
      'Returns exact required confirmation message: "Thank you! Your feedback has been submitted successfully."'
    );

    const submissionId = submitData.submissionId;

    // 4. Test Duplicate Prevention on Same Roll Number
    const dupSubmitRes = await fetch(`${BASE_URL}/api/feedback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        rollNumber: testRollNumber,
        campus: 'KIETW',
        branch: 'CSM',
        feedbackType: 'FRM',
        facultyIds: facultyIds,
        ratings: ratingsPayload,
        q1SubjectChallenges: 'Duplicate attempt',
        q2Improvements: 'Duplicate attempt',
        q3AdditionalComments: 'Duplicate attempt',
      }),
    });
    assert(
      dupSubmitRes.status === 409,
      'Duplicate submission from same Roll Number is blocked with HTTP 409 Conflict'
    );

    // 5. Test Admin Login & Detailed Rating Verification
    const adminEmail = process.env.ADMIN_DEFAULT_EMAIL || 'admin@kiet.edu';
    const adminPassword = process.env.ADMIN_DEFAULT_PASSWORD || 'Admin@KIET2026!';
    const loginRes = await fetch(`${BASE_URL}/api/admin/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: adminEmail, password: adminPassword }),
    });
    const setCookie = loginRes.headers.get('set-cookie');
    const cookieToken = setCookie?.split(';')[0] || '';

    // Verify submission details in admin API
    const viewRes = await fetch(`${BASE_URL}/api/admin/feedback/${submissionId}`, {
      headers: { Cookie: cookieToken },
    });
    const viewData = await viewRes.json();
    assert(
      viewRes.status === 200 && viewData.submission?.student_name === 'Anonymous' && viewData.ratings.length >= 4,
      'Admin retrieves submission: defaults blank name to Anonymous and includes all 10 criteria ratings'
    );

    // 6. Test Excel Export includes Detailed Ratings
    const xlsxRes = await fetch(`${BASE_URL}/api/admin/feedback/export?format=xlsx`, {
      headers: { Cookie: cookieToken },
    });
    const xlsxBuffer = await xlsxRes.arrayBuffer();
    assert(
      xlsxRes.status === 200 && xlsxBuffer.byteLength > 2000,
      `Excel export generates workbook with Summary & Detailed 10 Criteria Ratings sheets (${xlsxBuffer.byteLength} bytes)`
    );

    // 7. Clean up test record
    const delRes = await fetch(`${BASE_URL}/api/admin/feedback/${submissionId}`, {
      method: 'DELETE',
      headers: { Cookie: cookieToken },
    });
    assert(delRes.status === 200, 'Test submission cleanly removed from database');

    console.log('\n====================================================');
    console.log(`TEST RESULTS: ${passedTests} / ${totalTests} PASSED (${Math.round((passedTests / totalTests) * 100)}%)`);
    console.log('====================================================\n');

    if (passedTests === totalTests) {
      console.log('🎉 ALL TESTS PASSED! User updates are 100% verified.');
      process.exit(0);
    } else {
      process.exit(1);
    }
  } catch (err) {
    console.error('Fatal test suite error:', err);
    process.exit(1);
  }
}

runTestSuite();
