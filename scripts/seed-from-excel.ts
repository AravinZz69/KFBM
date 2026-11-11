import dotenv from 'dotenv';
import path from 'path';
import XLSX from 'xlsx';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import { neon } from '@neondatabase/serverless';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error('DATABASE_URL is missing.');
  process.exit(1);
}

const sql = neon(databaseUrl);

async function importFromExcel() {
  console.log('--- Migrating Database Schema & Seeding from SUB .xlsx ---');

  // 1. Add subject_name column to faculty if not exists
  await sql.query(`
    ALTER TABLE faculty ADD COLUMN IF NOT EXISTS subject_name VARCHAR(255);
  `);
  console.log('✓ faculty.subject_name column verified');

  // 2. Create feedback_ratings table for the 10 criteria
  await sql.query(`
    CREATE TABLE IF NOT EXISTS feedback_ratings (
      id SERIAL PRIMARY KEY,
      submission_id INT NOT NULL REFERENCES feedback_submissions(id) ON DELETE CASCADE,
      faculty_id INT NOT NULL REFERENCES faculty(id) ON DELETE CASCADE,
      subject_name VARCHAR(255) NOT NULL,
      concept_clarity INT NOT NULL CHECK (concept_clarity BETWEEN 1 AND 5),
      subject_knowledge INT NOT NULL CHECK (subject_knowledge BETWEEN 1 AND 5),
      teaching_methodology INT NOT NULL CHECK (teaching_methodology BETWEEN 1 AND 5),
      practical_examples INT NOT NULL CHECK (practical_examples BETWEEN 1 AND 5),
      student_interaction INT NOT NULL CHECK (student_interaction BETWEEN 1 AND 5),
      doubt_clarification INT NOT NULL CHECK (doubt_clarification BETWEEN 1 AND 5),
      regularity_punctuality INT NOT NULL CHECK (regularity_punctuality BETWEEN 1 AND 5),
      assignments_assessments INT NOT NULL CHECK (assignments_assessments BETWEEN 1 AND 5),
      my_understanding INT NOT NULL CHECK (my_understanding BETWEEN 1 AND 5),
      my_ability_apply INT NOT NULL CHECK (my_ability_apply BETWEEN 1 AND 5),
      average_rating NUMERIC(3,2) NOT NULL,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(submission_id, faculty_id)
    );
  `);
  await sql.query(`CREATE INDEX IF NOT EXISTS idx_feedback_ratings_sub ON feedback_ratings(submission_id);`);
  await sql.query(`CREATE INDEX IF NOT EXISTS idx_feedback_ratings_fac ON feedback_ratings(faculty_id);`);
  console.log('✓ feedback_ratings table verified');

  // 3. Read Excel file
  const excelPath = 'C:\\Users\\knox8\\Downloads\\SUB .xlsx';
  const workbook = XLSX.readFile(excelPath);
  const sheet = workbook.Sheets['Sheet1'];
  const rawData: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });

  // Get colleges & branches from DB
  const colleges = await sql.query(`SELECT id, code FROM colleges`);
  const branches = await sql.query(`SELECT id, code FROM branches`);

  const collegeMap: Record<string, number> = Object.fromEntries(
    colleges.map((c: any) => [c.code.toUpperCase(), c.id])
  );
  const branchMap: Record<string, number> = Object.fromEntries(
    branches.map((b: any) => [b.code.toUpperCase(), b.id])
  );

  let curCollegeRaw = '';
  let curBranchRaw = '';
  let curTypeRaw = '';

  const parsedItems: {
    collegeCode: string;
    branchCode: string;
    feedbackType: 'FRM' | 'SRM';
    subjectName: string;
    facultyName: string;
  }[] = [];

  for (let i = 0; i < rawData.length; i++) {
    const row = rawData[i] || [];
    if (row[0]) curCollegeRaw = String(row[0]).trim();
    if (row[1]) curBranchRaw = String(row[1]).trim();
    if (row[2]) curTypeRaw = String(row[2]).trim();

    const subjectRaw = row[3] ? String(row[3]).trim() : '';
    const facultyRaw = row[4] ? String(row[4]).trim() : '';

    if (!subjectRaw || !facultyRaw) continue;

    // Normalize College
    const collegeCode = curCollegeRaw.toUpperCase().includes('W') ? 'KIETW' : 'KIET';

    // Normalize Branch
    let branchCode = 'CYBER';
    const brUpper = curBranchRaw.toUpperCase();
    if (brUpper.includes('CYBER')) branchCode = 'CYBER';
    else if (brUpper.includes('AID')) branchCode = 'AID';
    else if (brUpper.includes('CSM')) branchCode = 'CSM';
    else if (brUpper.includes('CAI')) branchCode = 'CAI';
    else if (brUpper.includes('CSD')) branchCode = 'CSD';

    // Normalize Feedback Type
    const typeUpper = curTypeRaw.toUpperCase();
    const types: ('FRM' | 'SRM')[] = [];
    if (typeUpper.includes('FRM/SRM')) {
      types.push('FRM', 'SRM');
    } else if (typeUpper.includes('FRM')) {
      types.push('FRM');
    } else if (typeUpper.includes('SRM')) {
      types.push('SRM');
    } else {
      types.push('FRM', 'SRM');
    }

    // Capitalize / clean subject and faculty names
    const cleanSubject = subjectRaw.replace(/\s+/g, ' ');
    const cleanFaculty = facultyRaw.replace(/\s+/g, ' ');

    for (const t of types) {
      parsedItems.push({
        collegeCode,
        branchCode,
        feedbackType: t,
        subjectName: cleanSubject,
        facultyName: cleanFaculty,
      });
    }
  }

  // Also ensure KIETW has CYBER and CSD coverage if missing in raw sheet
  const hasKietwCyber = parsedItems.some(x => x.collegeCode === 'KIETW' && x.branchCode === 'CYBER');
  if (!hasKietwCyber) {
    const defaultWFaculty = [
      { subject: 'C&DS', name: 'N Gopi sir' },
      { subject: 'English', name: 'Dharani' },
      { subject: 'LA&C', name: 'N D Pavani' },
      { subject: 'Chemistry', name: 'A Sowjanaya' },
    ];
    for (const f of defaultWFaculty) {
      parsedItems.push(
        { collegeCode: 'KIETW', branchCode: 'CYBER', feedbackType: 'FRM', subjectName: f.subject, facultyName: f.name },
        { collegeCode: 'KIETW', branchCode: 'CYBER', feedbackType: 'SRM', subjectName: f.subject, facultyName: f.name }
      );
    }
  }

  const hasKietwCsd = parsedItems.some(x => x.collegeCode === 'KIETW' && x.branchCode === 'CSD');
  if (!hasKietwCsd) {
    const defaultWFaculty = [
      { subject: 'C&DS', name: 'N Gopi sir' },
      { subject: 'Chemistry', name: 'A Sowjanaya' },
      { subject: 'DTI', name: 'Y V SANTHOSHINI' },
      { subject: 'LA&C', name: 'N D Pavani' },
    ];
    for (const f of defaultWFaculty) {
      parsedItems.push(
        { collegeCode: 'KIETW', branchCode: 'CSD', feedbackType: 'FRM', subjectName: f.subject, facultyName: f.name },
        { collegeCode: 'KIETW', branchCode: 'CSD', feedbackType: 'SRM', subjectName: f.subject, facultyName: f.name }
      );
    }
  }

  console.log(`Parsed ${parsedItems.length} subject-faculty mappings from Excel.`);

  // Clear or update faculty table with these exact subjects & faculty
  // To avoid breaking historical tests, we can soft-deactivate old placeholder records and insert the official ones
  await sql.query(`UPDATE faculty SET active_flag = FALSE WHERE subject_name IS NULL`);

  let insertedCount = 0;
  for (const item of parsedItems) {
    const collegeId = collegeMap[item.collegeCode];
    const branchId = branchMap[item.branchCode];

    if (!collegeId || !branchId) {
      console.warn('Unknown college or branch for:', item);
      continue;
    }

    const email = `${item.facultyName.toLowerCase().replace(/[^a-z0-9]/g, '.')}@kiet.edu`;
    const designation = item.facultyName.toLowerCase().includes('sir') || item.facultyName.toLowerCase().includes('dr')
      ? 'Professor'
      : 'Assistant Professor';

    // Insert or update
    await sql.query(
      `INSERT INTO faculty (name, subject_name, college_id, branch_id, feedback_type, designation, email, active_flag, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, TRUE, NOW(), NOW())
       ON CONFLICT DO NOTHING`,
      [item.facultyName, item.subjectName, collegeId, branchId, item.feedbackType, designation, email]
    );
    insertedCount++;
  }

  console.log(`✓ Inserted/Updated ${insertedCount} official faculty members with subject mappings.`);

  // Verify counts by college and branch
  const activeFacultyRes = await sql.query(`
    SELECT c.code as college, b.code as branch, f.feedback_type, COUNT(*) as count
    FROM faculty f
    JOIN colleges c ON c.id = f.college_id
    JOIN branches b ON b.id = f.branch_id
    WHERE f.active_flag = TRUE
    GROUP BY c.code, b.code, f.feedback_type
    ORDER BY c.code, b.code, f.feedback_type
  `);
  console.log('\n--- Active Faculty Roster Summary ---');
  for (const row of activeFacultyRes) {
    console.log(`${row.college} | ${row.branch} | ${row.feedback_type} => ${row.count} faculty/subjects`);
  }

  console.log('\n--- Seeding from Excel Finished Successfully! ---');
}

importFromExcel().catch(err => {
  console.error('Import from Excel failed:', err);
  process.exit(1);
});
