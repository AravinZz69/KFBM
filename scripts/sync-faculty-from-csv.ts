import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import { neon } from '@neondatabase/serverless';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error('DATABASE_URL is missing.');
  process.exit(1);
}

const sql = neon(databaseUrl);

interface CsvRow {
  collegeCode: string;
  year: string;
  branchCode: string;
  section: string;
  feedbackType: 'FRM' | 'SRM';
  subjectName: string;
  facultyName: string;
  facultyContact: string;
}

function parseCsv(filePath: string): CsvRow[] {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split(/\r?\n/).filter(line => line.trim().length > 0);
  const rows: CsvRow[] = [];

  // Skip header line
  for (let i = 1; i < lines.length; i++) {
    const parts = lines[i].split(',').map(s => s.trim());
    if (parts.length < 7) continue;

    const [college, year, branch, section, type, subject, facultyName, contact] = parts;
    if (!college || !branch || !type || !subject || !facultyName) continue;

    rows.push({
      collegeCode: college.toUpperCase(),
      year: year || '1st Year',
      branchCode: branch.toUpperCase(),
      section: section || 'All',
      feedbackType: type.toUpperCase() as 'FRM' | 'SRM',
      subjectName: subject,
      facultyName: facultyName,
      facultyContact: contact || '',
    });
  }

  return rows;
}

async function runSync() {
  console.log('========================================================');
  console.log('   SYNCING FACULTY ROSTER FROM UPDATED CSV TO DATABASE  ');
  console.log('========================================================\n');

  // 1. Add phone and subject_name columns if not exist
  await sql.query(`ALTER TABLE faculty ADD COLUMN IF NOT EXISTS subject_name VARCHAR(255);`);
  await sql.query(`ALTER TABLE faculty ADD COLUMN IF NOT EXISTS phone VARCHAR(50);`);
  console.log('✓ faculty schema verified (subject_name and phone columns exist)');

  // 2. Load colleges & branches maps
  const colleges = await sql.query(`SELECT id, code FROM colleges`);
  const branches = await sql.query(`SELECT id, code FROM branches`);

  const collegeMap: Record<string, number> = Object.fromEntries(
    colleges.map((c: any) => [c.code.toUpperCase(), c.id])
  );
  const branchMap: Record<string, number> = Object.fromEntries(
    branches.map((b: any) => [b.code.toUpperCase(), b.id])
  );

  console.log('Colleges:', collegeMap);
  console.log('Branches:', branchMap);

  // 3. Read the updated CSV
  const csvPath = path.resolve(process.cwd(), 'public', 'SUB_Updated_Subject_Faculty.csv');
  const csvRows = parseCsv(csvPath);
  console.log(`\nParsed ${csvRows.length} rows from CSV (${csvPath}).`);

  // Deduplicate by key: (college, branch, feedbackType, subjectName)
  // so FRM 1 & 2 doesn't duplicate faculty in DB
  const uniqueItemsMap = new Map<string, CsvRow>();
  for (const row of csvRows) {
    const key = `${row.collegeCode}|${row.branchCode}|${row.feedbackType}|${row.subjectName.toLowerCase()}`;
    if (!uniqueItemsMap.has(key)) {
      uniqueItemsMap.set(key, row);
    }
  }

  const uniqueItems = Array.from(uniqueItemsMap.values());
  console.log(`Found ${uniqueItems.length} unique (College, Branch, Type, Subject) canonical slots.`);

  // 4. Soft-deactivate all current active faculty so we start clean without breaking foreign keys
  await sql.query(`UPDATE faculty SET active_flag = FALSE`);
  console.log('✓ Set existing faculty records active_flag = FALSE for clean synchronization.');

  let updatedCount = 0;
  let insertedCount = 0;

  for (const item of uniqueItems) {
    const collegeId = collegeMap[item.collegeCode];
    const branchId = branchMap[item.branchCode];

    if (!collegeId || !branchId) {
      console.warn(`[SKIP] Missing collegeId/branchId for ${item.collegeCode} - ${item.branchCode}`);
      continue;
    }

    const designation =
      item.facultyName.toLowerCase().includes('sir') ||
      item.facultyName.toLowerCase().includes('dr') ||
      item.facultyName.toLowerCase().includes('prof')
        ? 'Professor'
        : 'Assistant Professor';

    const email = `${item.facultyName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '.')
      .replace(/\.+/g, '.')
      .replace(/^\.|\.$/g, '')}@kiet.edu`;

    // Check if an existing row matches this slot (college, branch, type, subject)
    const existing = await sql.query(
      `SELECT id FROM faculty 
       WHERE college_id = $1 
         AND branch_id = $2 
         AND feedback_type = $3 
         AND LOWER(subject_name) = LOWER($4)
       ORDER BY id ASC
       LIMIT 1`,
      [collegeId, branchId, item.feedbackType, item.subjectName]
    );

    if (existing.length > 0) {
      const facId = existing[0].id;
      await sql.query(
        `UPDATE faculty 
         SET name = $1,
             subject_name = $2,
             phone = $3,
             designation = $4,
             email = $5,
             active_flag = TRUE,
             updated_at = NOW()
         WHERE id = $6`,
        [item.facultyName, item.subjectName, item.facultyContact, designation, email, facId]
      );
      updatedCount++;
    } else {
      await sql.query(
        `INSERT INTO faculty (
           name, subject_name, college_id, branch_id, feedback_type, designation, email, phone, active_flag, created_at, updated_at
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, TRUE, NOW(), NOW())`,
        [
          item.facultyName,
          item.subjectName,
          collegeId,
          branchId,
          item.feedbackType,
          designation,
          email,
          item.facultyContact,
        ]
      );
      insertedCount++;
    }
  }

  console.log(`\n✓ Sync complete! Updated: ${updatedCount}, Newly Inserted: ${insertedCount}`);

  // 4b. Sync college_branches: active only if active faculty exist in that college
  await sql.query(`UPDATE college_branches SET active = FALSE`);
  await sql.query(`
    UPDATE college_branches cb
    SET active = TRUE
    WHERE EXISTS (
      SELECT 1 FROM faculty f
      WHERE f.college_id = cb.college_id
        AND f.branch_id = cb.branch_id
        AND f.active_flag = TRUE
    )
  `);
  console.log('✓ Synchronized college_branches active states.');

  // 5. Verification queries
  const rosterSummary = await sql.query(`
    SELECT c.code as college, b.code as branch, f.feedback_type, COUNT(*) as count
    FROM faculty f
    JOIN colleges c ON c.id = f.college_id
    JOIN branches b ON b.id = f.branch_id
    WHERE f.active_flag = TRUE
    GROUP BY c.code, b.code, f.feedback_type
    ORDER BY c.code, b.code, f.feedback_type
  `);

  console.log('\n--- VERIFIED ACTIVE FACULTY SUMMARY ---');
  for (const row of rosterSummary) {
    console.log(`  ${row.college.padEnd(6)} | ${row.branch.padEnd(6)} | ${row.feedback_type} => ${row.count} subjects/faculty`);
  }

  const totalActive = await sql.query(`SELECT COUNT(*) as count FROM faculty WHERE active_flag = TRUE`);
  console.log(`\nTotal Active Faculty in DB: ${totalActive[0].count}`);
  console.log('========================================================\n');
}

runSync().catch(err => {
  console.error('Fatal error during sync:', err);
  process.exit(1);
});
