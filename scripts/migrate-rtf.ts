import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import { neon } from '@neondatabase/serverless';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error('DATABASE_URL is missing.');
  process.exit(1);
}

const sql = neon(databaseUrl);

async function runRtfMigration() {
  console.log('--- Starting RTF Migration & Faculty Seeding ---');

  try {
    // 1. Update check constraints on faculty and feedback_submissions
    console.log('1. Updating table constraints to allow RTF...');
    await sql.query(`ALTER TABLE faculty DROP CONSTRAINT IF EXISTS faculty_feedback_type_check`);
    await sql.query(`ALTER TABLE faculty ADD CONSTRAINT faculty_feedback_type_check CHECK (feedback_type IN ('FRM', 'SRM', 'RTF'))`);
    console.log('✓ faculty_feedback_type_check updated (FRM, SRM, RTF)');

    await sql.query(`ALTER TABLE feedback_submissions DROP CONSTRAINT IF EXISTS feedback_submissions_feedback_type_check`);
    await sql.query(`ALTER TABLE feedback_submissions ADD CONSTRAINT feedback_submissions_feedback_type_check CHECK (feedback_type IN ('FRM', 'SRM', 'RTF'))`);
    console.log('✓ feedback_submissions_feedback_type_check updated (FRM, SRM, RTF)');

    // 2. Fetch colleges and branches
    const colleges = await sql.query(`SELECT id, code, name FROM colleges`);
    const branches = await sql.query(`SELECT id, code, name FROM branches`);

    console.log('Colleges in DB:', colleges);
    console.log('Branches in DB:', branches);

    const collegeMap: Record<string, number> = Object.fromEntries(
      colleges.map((c: any) => [c.code.toUpperCase(), c.id])
    );
    const branchMap: Record<string, number> = Object.fromEntries(
      branches.map((b: any) => [b.code.toUpperCase(), b.id])
    );

    // Common 5 faculty requested:
    // PHYSCIS = MAHA LAKSHMI
    // CHEMISTRY = G SHYAM
    // LA & C = RAJU
    // C&DS = BHARATHI
    // FDL = ANITHA
    const rtfFacultyTemplates = [
      { subject: 'Physics', facultyName: 'MAHA LAKSHMI', email: 'maha.lakshmi@kiet.edu' },
      { subject: 'Chemistry', facultyName: 'G SHYAM', email: 'g.shyam@kiet.edu' },
      { subject: 'LA & C', facultyName: 'RAJU', email: 'raju@kiet.edu' },
      { subject: 'C&DS', facultyName: 'BHARATHI', email: 'bharathi@kiet.edu' },
      { subject: 'FDL', facultyName: 'ANITHA', email: 'anitha@kiet.edu' },
    ];

    const targetColleges = ['KIET', 'KIETW'];
    const targetBranches = ['AID', 'CAI', 'CSD', 'CSM', 'CYBER'];

    let inserted = 0;
    let updated = 0;

    for (const collegeCode of targetColleges) {
      const collegeId = collegeMap[collegeCode];
      if (!collegeId) {
        console.warn(`College ${collegeCode} not found in DB!`);
        continue;
      }

      for (const branchCode of targetBranches) {
        const branchId = branchMap[branchCode];
        if (!branchId) {
          console.warn(`Branch ${branchCode} not found in DB!`);
          continue;
        }

        // Also ensure college_branches mapping exists
        await sql.query(
          `INSERT INTO college_branches (college_id, branch_id, active)
           VALUES ($1, $2, TRUE)
           ON CONFLICT (college_id, branch_id) DO UPDATE SET active = TRUE`,
          [collegeId, branchId]
        );

        for (const item of rtfFacultyTemplates) {
          // Check if already exists for this college, branch, RTF, subject
          const existing = await sql.query(
            `SELECT id FROM faculty 
             WHERE college_id = $1 
               AND branch_id = $2 
               AND feedback_type = 'RTF' 
               AND (LOWER(subject_name) = LOWER($3) OR LOWER(subject_name) = LOWER($4))
             LIMIT 1`,
            [collegeId, branchId, item.subject, item.subject.replace(/\s+/g, '')]
          );

          if (existing.length > 0) {
            await sql.query(
              `UPDATE faculty 
               SET name = $1,
                   subject_name = $2,
                   email = $3,
                   designation = '',
                   active_flag = TRUE,
                   updated_at = NOW()
               WHERE id = $4`,
              [item.facultyName, item.subject, item.email, existing[0].id]
            );
            updated++;
          } else {
            await sql.query(
              `INSERT INTO faculty (name, subject_name, college_id, branch_id, feedback_type, designation, email, active_flag, created_at, updated_at)
               VALUES ($1, $2, $3, $4, 'RTF', '', $5, TRUE, NOW(), NOW())`,
              [item.facultyName, item.subject, collegeId, branchId, item.email]
            );
            inserted++;
          }
        }
      }
    }

    console.log(`\n✓ RTF Faculty Seeding completed! Inserted: ${inserted}, Updated: ${updated}`);

    // Query back sample
    const sample = await sql.query(
      `SELECT f.id, f.name, f.subject_name, c.code as college, b.code as branch, f.feedback_type, f.active_flag
       FROM faculty f
       JOIN colleges c ON c.id = f.college_id
       JOIN branches b ON b.id = f.branch_id
       WHERE f.feedback_type = 'RTF'
       ORDER BY c.code, b.code, f.id
       LIMIT 15`
    );
    console.log('\nSample RTF Faculty in DB:', sample);

    const totalRtf = await sql.query(`SELECT COUNT(*) as count FROM faculty WHERE feedback_type = 'RTF' AND active_flag = TRUE`);
    console.log(`\nTotal Active RTF Faculty Count: ${totalRtf[0]?.count}`);

  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}

runRtfMigration();
