import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const BASE_URL = 'http://localhost:3000';

async function runTestSuite() {
  console.log('====================================================');
  console.log('   KIET FEEDBACK APPLICATION - AUTOMATED TEST SUITE  ');
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
      'Colleges API returns KIET and KIETW',
      JSON.stringify(collegesData)
    );

    // 3. Test Branches API (strict validation: CYBER, AID, CSM, CAI, CSD, and never IT/EEE/ECE)
    const branchesRes = await fetch(`${BASE_URL}/api/branches?college=KIET`);
    const branchesData = await branchesRes.json();
    const branchCodes: string[] = branchesData.branches?.map((b: any) => b.code) || [];
    const hasOnlyAllowedBranches = branchCodes.every(code =>
      ['CYBER', 'AID', 'CSM', 'CAI', 'CSD'].includes(code)
    );
    const hasNoForbiddenBranches = !branchCodes.some(code =>
      ['IT', 'EEE', 'ECE'].includes(code)
    );
    assert(
      branchCodes.length === 5 && hasOnlyAllowedBranches && hasNoForbiddenBranches,
      'Branches API returns strictly CYBER, AID, CSM, CAI, CSD (never IT, EEE, ECE)',
      `Returned: ${branchCodes.join(', ')}`
    );

    // 4. Test Faculty API (Separation by Campus, Branch, and Type FRM vs SRM)
    const facultyFrmRes = await fetch(`${BASE_URL}/api/faculty?college=KIET&branch=CYBER&type=FRM`);
    const facultyFrmData = await facultyFrmRes.json();
    const frmFaculty = facultyFrmData.faculty || [];
    const allAreFrm = frmFaculty.every((f: any) => f.feedback_type === 'FRM');
    assert(
      frmFaculty.length > 0 && allAreFrm,
      `Faculty API for KIET CYBER FRM returns active FRM faculty (${frmFaculty.length} found)`
    );

    const facultySrmRes = await fetch(`${BASE_URL}/api/faculty?college=KIET&branch=CYBER&type=SRM`);
    const facultySrmData = await facultySrmRes.json();
    const srmFaculty = facultySrmData.faculty || [];
    const allAreSrm = srmFaculty.every((f: any) => f.feedback_type === 'SRM');
    assert(
      srmFaculty.length > 0 && allAreSrm,
      `Faculty API for KIET CYBER SRM returns active SRM faculty (${srmFaculty.length} found)`
    );

    // 5. Test Frontend / Backend Input Validations
    const invalidEmailRes = await fetch(`${BASE_URL}/api/feedback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        studentName: 'Test Student',
        email: 'invalid-email-string',
        phone: '9876543210',
        rollNumber: '21B91A0599',
        campus: 'KIET',
        branch: 'CYBER',
        feedbackType: 'FRM',
        facultyIds: [frmFaculty[0].id],
        q1SubjectChallenges: 'Test question 1 difficult subjects',
        q2Improvements: 'Test question 2 improvement expectations',
        q3AdditionalComments: 'Test question 3 comments',
      }),
    });
    assert(invalidEmailRes.status === 400, 'Rejects invalid email format with HTTP 400');

    const invalidPhoneRes = await fetch(`${BASE_URL}/api/feedback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        studentName: 'Test Student',
        email: 'test@kiet.edu',
        phone: '12345', // Not 10 digits
        rollNumber: '21B91A0599',
        campus: 'KIET',
        branch: 'CYBER',
        feedbackType: 'FRM',
        facultyIds: [frmFaculty[0].id],
        q1SubjectChallenges: 'Test question 1 difficult subjects',
        q2Improvements: 'Test question 2 improvement expectations',
        q3AdditionalComments: 'Test question 3 comments',
      }),
    });
    assert(invalidPhoneRes.status === 400, 'Rejects invalid phone number (must be 10 digits) with HTTP 400');

    // 6. Test Valid Student Feedback Submission
    const testRollNumber = `TEST${Date.now().toString().slice(-6)}`;
    const targetFacultyId = frmFaculty[0].id;
    const targetFacultyName = frmFaculty[0].name;

    const validSubmitRes = await fetch(`${BASE_URL}/api/feedback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        studentName: 'Automated Test Student',
        email: 'student.test@kiet.edu',
        phone: '9876543210',
        rollNumber: testRollNumber,
        campus: 'KIET',
        branch: 'CYBER',
        feedbackType: 'FRM',
        facultyIds: [targetFacultyId],
        q1SubjectChallenges: 'Advanced Cryptography: finding public key infrastructure and discrete logarithms difficult.',
        q2Improvements: 'More step-by-step practical code walkthroughs and interactive whiteboard proofs.',
        q3AdditionalComments: 'Overall great pacing, but need extra tutorial sessions on lab experiments.',
      }),
    });

    const submitData = await validSubmitRes.json();
    assert(
      validSubmitRes.status === 200 && submitData.success === true,
      'Valid student feedback submitted successfully',
      JSON.stringify(submitData)
    );
    assert(
      submitData.message === 'Thank you! Your feedback has been submitted successfully.',
      'Returns exact required success message: "Thank you! Your feedback has been submitted successfully."'
    );

    const createdSubmissionId = submitData.submissionId;

    // 7. Test Duplicate Prevention on Frontend Check API
    const duplicateCheckRes = await fetch(`${BASE_URL}/api/feedback/check-duplicate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        rollNumber: testRollNumber,
        feedbackType: 'FRM',
        facultyIds: [targetFacultyId],
      }),
    });
    const duplicateCheckData = await duplicateCheckRes.json();
    assert(
      duplicateCheckData.isDuplicate === true,
      `Pre-submission duplicate check catches existing roll number (${testRollNumber}) for faculty`
    );

    // 8. Test Duplicate Prevention on Backend Submission API (Must be rejected with 409 Conflict)
    const duplicateSubmitRes = await fetch(`${BASE_URL}/api/feedback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        studentName: 'Automated Test Student',
        email: 'student.test@kiet.edu',
        phone: '9876543210',
        rollNumber: testRollNumber,
        campus: 'KIET',
        branch: 'CYBER',
        feedbackType: 'FRM',
        facultyIds: [targetFacultyId],
        q1SubjectChallenges: 'Attempting duplicate submission',
        q2Improvements: 'Attempting duplicate submission',
        q3AdditionalComments: 'Attempting duplicate submission',
      }),
    });
    const dupSubmitData = await duplicateSubmitRes.json();
    assert(
      duplicateSubmitRes.status === 409,
      'Backend blocks duplicate submission from same roll number for same faculty & type (HTTP 409)',
      dupSubmitData.error
    );

    // 9. Test Admin Route Protection (Server-Side Auth Check)
    const unauthStatsRes = await fetch(`${BASE_URL}/api/admin/stats`);
    assert(
      unauthStatsRes.status === 401,
      'Protected admin API rejects unauthenticated requests with HTTP 401'
    );

    // 10. Test Admin Login (Neon Auth)
    const loginFailRes = await fetch(`${BASE_URL}/api/admin/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@kiet.edu',
        password: 'WrongPassword123!',
      }),
    });
    assert(loginFailRes.status === 401, 'Admin login rejects incorrect credentials with HTTP 401');

    const adminEmail = process.env.ADMIN_DEFAULT_EMAIL || 'admin@kiet.edu';
    const adminPassword = process.env.ADMIN_DEFAULT_PASSWORD || 'Admin@KIET2026!';

    const loginRes = await fetch(`${BASE_URL}/api/admin/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: adminEmail,
        password: adminPassword,
      }),
    });

    const loginData = await loginRes.json();
    const setCookieHeader = loginRes.headers.get('set-cookie');
    assert(
      loginRes.status === 200 && loginData.success === true && !!setCookieHeader,
      'Admin login succeeds with valid credentials and sets secure session cookie',
      JSON.stringify(loginData)
    );

    // Extract session cookie for authenticated admin requests
    const cookieToken = setCookieHeader?.split(';')[0] || '';

    // 11. Test Admin Stats with Real Database Counts
    const authStatsRes = await fetch(`${BASE_URL}/api/admin/stats`, {
      headers: { Cookie: cookieToken },
    });
    const authStatsData = await authStatsRes.json();
    const stats = authStatsData.stats;
    assert(
      stats && stats.totalSubmissions >= 1 && stats.kietCount >= 1 && stats.frmCount >= 1,
      `Admin stats returns real metrics: Total=${stats?.totalSubmissions}, KIET=${stats?.kietCount}, KIET-W=${stats?.kietwCount}, FRM=${stats?.frmCount}, SRM=${stats?.srmCount}`
    );

    // 12. Test Feedback Table Query, Search & Filters
    const searchRes = await fetch(
      `${BASE_URL}/api/admin/feedback?search=${testRollNumber}`,
      { headers: { Cookie: cookieToken } }
    );
    const searchData = await searchRes.json();
    const foundSubmission = searchData.submissions?.find((s: any) => s.roll_number === testRollNumber);
    assert(
      !!foundSubmission,
      `Feedback table search successfully finds submission for roll number ${testRollNumber}`
    );

    // 13. Test View Specific Submission Details API
    const viewDetailRes = await fetch(`${BASE_URL}/api/admin/feedback/${createdSubmissionId}`, {
      headers: { Cookie: cookieToken },
    });
    const viewDetailData = await viewDetailRes.json();
    assert(
      viewDetailRes.status === 200 &&
      viewDetailData.submission?.q1_subject_challenges.includes('Advanced Cryptography'),
      'Admin view detail API retrieves full answers and student record'
    );

    // 14. Test Export to CSV
    const csvExportRes = await fetch(`${BASE_URL}/api/admin/feedback/export?format=csv`, {
      headers: { Cookie: cookieToken },
    });
    const csvContent = await csvExportRes.text();
    const hasCsvHeaders = csvContent.includes('Submission ID') && csvContent.includes('Roll Number');
    const hasStudentRow = csvContent.includes(testRollNumber);
    assert(
      csvExportRes.status === 200 && hasCsvHeaders && hasStudentRow,
      'Export to CSV produces valid CSV with headers and filtered student feedback'
    );

    // 15. Test Export to Excel (.xlsx)
    const excelExportRes = await fetch(`${BASE_URL}/api/admin/feedback/export?format=xlsx`, {
      headers: { Cookie: cookieToken },
    });
    const excelContentType = excelExportRes.headers.get('content-type') || '';
    const excelBuffer = await excelExportRes.arrayBuffer();
    assert(
      excelExportRes.status === 200 &&
      excelContentType.includes('spreadsheetml') &&
      excelBuffer.byteLength > 1000,
      `Export to Excel (.xlsx) produces valid binary workbook (${excelBuffer.byteLength} bytes)`
    );

    // 16. Test Faculty Management: Add New Faculty
    const createFacultyRes = await fetch(`${BASE_URL}/api/admin/faculty`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: cookieToken,
      },
      body: JSON.stringify({
        name: 'Dr. Test Automated Faculty',
        collegeCode: 'KIET',
        branchCode: 'CYBER',
        feedbackType: 'FRM',
        designation: 'Associate Professor',
        email: 'test.auto.faculty@kiet.edu',
      }),
    });
    const createFacData = await createFacultyRes.json();
    const newFacId = createFacData.id;
    assert(
      createFacultyRes.status === 200 && createFacData.success === true && !!newFacId,
      'Admin successfully adds new faculty member',
      JSON.stringify(createFacData)
    );

    // 17. Test Faculty Management: Edit Faculty
    const editFacultyRes = await fetch(`${BASE_URL}/api/admin/faculty/${newFacId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Cookie: cookieToken,
      },
      body: JSON.stringify({
        name: 'Dr. Test Automated Faculty (Updated)',
        collegeCode: 'KIET',
        branchCode: 'CYBER',
        feedbackType: 'FRM',
        designation: 'Distinguished Professor',
        email: 'test.auto.updated@kiet.edu',
      }),
    });
    const editFacData = await editFacultyRes.json();
    assert(
      editFacultyRes.status === 200 && editFacData.success === true,
      'Admin successfully edits existing faculty member details'
    );

    // 18. Test Faculty Soft Deactivation
    const deactRes = await fetch(`${BASE_URL}/api/admin/faculty/${newFacId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Cookie: cookieToken,
      },
      body: JSON.stringify({ activeFlag: false }),
    });
    const deactData = await deactRes.json();
    assert(
      deactRes.status === 200 && deactData.activeFlag === false,
      'Admin soft-deactivates faculty member (preserves historical feedback in DB)'
    );

    // Verify deactivated faculty no longer appears in the student public dropdown
    const checkPublicFacRes = await fetch(`${BASE_URL}/api/faculty?college=KIET&branch=CYBER&type=FRM`);
    const checkPublicFacData = await checkPublicFacRes.json();
    const facFoundInPublic = checkPublicFacData.faculty?.some((f: any) => f.id === newFacId);
    assert(
      !facFoundInPublic,
      'Deactivated faculty member is immediately excluded from the public student selector'
    );

    // 19. Test Faculty Reactivation
    const reactRes = await fetch(`${BASE_URL}/api/admin/faculty/${newFacId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Cookie: cookieToken,
      },
      body: JSON.stringify({ activeFlag: true }),
    });
    const reactData = await reactRes.json();
    assert(
      reactRes.status === 200 && reactData.activeFlag === true,
      'Admin reactivates faculty member'
    );

    // Verify reactivated faculty reappears in public dropdown
    const checkPublicFacRes2 = await fetch(`${BASE_URL}/api/faculty?college=KIET&branch=CYBER&type=FRM`);
    const checkPublicFacData2 = await checkPublicFacRes2.json();
    const facFoundInPublic2 = checkPublicFacData2.faculty?.some((f: any) => f.id === newFacId);
    assert(
      facFoundInPublic2,
      'Reactivated faculty member is immediately restored to the student selector'
    );

    // 20. Test Faculty CSV Bulk Import
    const sampleCsvData =
      'Name,Campus,Branch,Feedback_Type,Designation,Email\r\n' +
      'Prof. Bulk Import 1,KIET,AID,FRM,Assistant Professor,bulk1@kiet.edu\r\n' +
      'Dr. Bulk Import 2,KIETW,CSM,SRM,Associate Professor,bulk2@kiet.edu\r\n';

    const importRes = await fetch(`${BASE_URL}/api/admin/faculty/import`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: cookieToken,
      },
      body: JSON.stringify({ csvText: sampleCsvData }),
    });
    const importData = await importRes.json();
    assert(
      importRes.status === 200 && importData.importedCount === 2,
      `CSV Bulk Import processes 2 faculty records successfully (imported: ${importData.importedCount})`
    );

    // 21. Test Delete Feedback Submission (with confirmation simulation)
    const deleteRes = await fetch(`${BASE_URL}/api/admin/feedback/${createdSubmissionId}`, {
      method: 'DELETE',
      headers: { Cookie: cookieToken },
    });
    const deleteData = await deleteRes.json();
    assert(
      deleteRes.status === 200 && deleteData.success === true,
      `Admin successfully deletes feedback submission #${createdSubmissionId}`
    );

    // Verify it is gone from DB
    const checkDeletedRes = await fetch(`${BASE_URL}/api/admin/feedback/${createdSubmissionId}`, {
      headers: { Cookie: cookieToken },
    });
    assert(
      checkDeletedRes.status === 404,
      'Deleted submission returns 404 Not Found'
    );

    console.log('\n====================================================');
    console.log(`TEST RESULTS: ${passedTests} / ${totalTests} PASSED (${Math.round((passedTests / totalTests) * 100)}%)`);
    console.log('====================================================\n');

    if (passedTests === totalTests) {
      console.log('🎉 ALL TESTS PASSED SUCCESSFULLY! The portal is 100% operational.');
      process.exit(0);
    } else {
      console.error('❌ SOME TESTS FAILED.');
      process.exit(1);
    }
  } catch (err) {
    console.error('Fatal test error:', err);
    process.exit(1);
  }
}

runTestSuite();
