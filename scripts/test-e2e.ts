import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const BASE_URL = 'http://localhost:3000';

async function runTestSuite() {
  console.log('====================================================');
  console.log('   KIET & KIET-W FEEDBACK ONBOARDING TEST SUITE     ');
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

    // 2. Test Colleges API
    const collegesRes = await fetch(`${BASE_URL}/api/colleges`);
    const collegesData = await collegesRes.json();
    const collegeCodes = collegesData.colleges?.map((c: any) => c.code) || [];
    assert(
      collegeCodes.includes('KIET') && collegeCodes.includes('KIETW'),
      'Colleges API returns KIET and KIETW'
    );

    // 3. Test KIET-W CSM FRM Subjects from SUB.xlsx
    const kietwFacultyRes = await fetch(`${BASE_URL}/api/faculty?college=KIETW&branch=CSM&type=FRM`);
    const kietwFacultyData = await kietwFacultyRes.json();
    const facultyList = kietwFacultyData.faculty || [];
    assert(
      facultyList.length >= 4,
      `KIETW CSM FRM loads official subjects & faculty (found: ${facultyList.length})`
    );

    const hasGopiSir = facultyList.some((f: any) => f.name.toLowerCase().includes('gopi'));
    const hasPhysics = facultyList.some((f: any) => f.subject_name.toLowerCase().includes('physics'));
    assert(
      hasGopiSir && hasPhysics,
      'KIETW CSM FRM includes N Gopi sir (C&DS) and Physics (Thoto Sudharani) from SUB.xlsx'
    );

    // 4. Test Valid Submission with 10 Criteria Ratings per Subject
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
        studentName: 'KIETW Test Student',
        email: 'student.kietw@kiet.edu',
        phone: '9876543210',
        rollNumber: testRollNumber,
        campus: 'KIETW',
        branch: 'CSM',
        feedbackType: 'FRM',
        facultyIds: facultyIds,
        ratings: ratingsPayload,
        q1SubjectChallenges: 'Data Structures: Tree traversals and graph algorithms require more visual explanations.',
        q2Improvements: 'More live coding sessions on whiteboard and debug exercises during lab.',
        q3AdditionalComments: 'Great syllabus coverage and interactive faculty overall.',
      }),
    });

    const submitData = await submitRes.json();
    assert(
      submitRes.status === 200 && submitData.success === true,
      'Student submits feedback with 10 common evaluation criteria ratings for all subjects',
      JSON.stringify(submitData)
    );
    assert(
      submitData.message === 'Thank you! Your feedback has been submitted successfully.',
      'Returns exact required success message: "Thank you! Your feedback has been submitted successfully."'
    );

    const submissionId = submitData.submissionId;

    // 5. Test Duplicate Prevention on Both Frontend & Backend
    const dupCheckRes = await fetch(`${BASE_URL}/api/feedback/check-duplicate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        rollNumber: testRollNumber,
        feedbackType: 'FRM',
        facultyIds: facultyIds,
      }),
    });
    const dupCheckData = await dupCheckRes.json();
    assert(
      dupCheckData.isDuplicate === true,
      'Pre-submission check detects duplicate submission for roll number'
    );

    const dupSubmitRes = await fetch(`${BASE_URL}/api/feedback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        studentName: 'KIETW Test Student',
        email: 'student.kietw@kiet.edu',
        phone: '9876543210',
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
      'Backend blocks duplicate submission with HTTP 409 Conflict'
    );

    // 6. Test Admin Login & Session
    const adminEmail = process.env.ADMIN_DEFAULT_EMAIL || 'admin@kiet.edu';
    const adminPassword = process.env.ADMIN_DEFAULT_PASSWORD || 'Admin@KIET2026!';
    const loginRes = await fetch(`${BASE_URL}/api/admin/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: adminEmail, password: adminPassword }),
    });
    const setCookie = loginRes.headers.get('set-cookie');
    const cookieToken = setCookie?.split(';')[0] || '';
    assert(
      loginRes.status === 200 && !!cookieToken,
      'Admin logs in and receives secure session cookie'
    );

    // 7. Test Admin View Details retrieves Common Grid Ratings
    const viewRes = await fetch(`${BASE_URL}/api/admin/feedback/${submissionId}`, {
      headers: { Cookie: cookieToken },
    });
    const viewData = await viewRes.json();
    assert(
      viewRes.status === 200 && viewData.ratings && viewData.ratings.length >= 4,
      `Admin view details retrieves common feedback grid ratings (${viewData.ratings?.length} subject evaluations found)`
    );

    // 8. Test Export to CSV & Excel with Ratings
    const csvRes = await fetch(`${BASE_URL}/api/admin/feedback/export?format=csv`, {
      headers: { Cookie: cookieToken },
    });
    const csvText = await csvRes.text();
    assert(
      csvRes.status === 200 && csvText.includes('Overall Criteria Score') && csvText.includes(testRollNumber),
      'CSV export contains 10 criteria scores and student record'
    );

    const xlsxRes = await fetch(`${BASE_URL}/api/admin/feedback/export?format=xlsx`, {
      headers: { Cookie: cookieToken },
    });
    const xlsxBuffer = await xlsxRes.arrayBuffer();
    assert(
      xlsxRes.status === 200 && xlsxBuffer.byteLength > 1000,
      `Excel (.xlsx) export produces valid workbook (${xlsxBuffer.byteLength} bytes)`
    );

    // 9. Clean up test submission
    const delRes = await fetch(`${BASE_URL}/api/admin/feedback/${submissionId}`, {
      method: 'DELETE',
      headers: { Cookie: cookieToken },
    });
    assert(delRes.status === 200, 'Test submission cleanly removed from database');

    console.log('\n====================================================');
    console.log(`TEST RESULTS: ${passedTests} / ${totalTests} PASSED (${Math.round((passedTests / totalTests) * 100)}%)`);
    console.log('====================================================\n');

    if (passedTests === totalTests) {
      console.log('🎉 ALL ONBOARDING & EVALUATION TESTS PASSED 100%!');
      process.exit(0);
    } else {
      process.exit(1);
    }
  } catch (err) {
    console.error('Test suite error:', err);
    process.exit(1);
  }
}

runTestSuite();
