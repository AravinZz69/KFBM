import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

async function syncGenuineFeedback() {
  console.log('========================================================');
  console.log('   SYNCING TOP 100 GENUINE FEEDBACK INTO NEON DB        ');
  console.log('========================================================\n');

  // 1. Create table
  console.log('1. Creating genuine_student_feedback table in Neon PostgreSQL...');
  await sql.query(`
    CREATE TABLE IF NOT EXISTS genuine_student_feedback (
      id SERIAL PRIMARY KEY,
      rank INT NOT NULL,
      submission_id INT NOT NULL,
      student_name VARCHAR(255) NOT NULL,
      roll_number VARCHAR(100) DEFAULT '',
      email VARCHAR(255) DEFAULT '',
      phone VARCHAR(50) DEFAULT '',
      college_code VARCHAR(20) NOT NULL,
      college_name VARCHAR(255) NOT NULL,
      branch_code VARCHAR(20) NOT NULL,
      branch_name VARCHAR(255) NOT NULL,
      feedback_type VARCHAR(10) NOT NULL,
      student_avg_rating NUMERIC(3,2) DEFAULT 0.00,
      q1_subject_challenges TEXT NOT NULL DEFAULT '',
      q2_improvements TEXT NOT NULL DEFAULT '',
      q3_additional_comments TEXT NOT NULL DEFAULT '',
      primary_theme VARCHAR(100) NOT NULL DEFAULT '',
      genuine_score INT NOT NULL DEFAULT 0,
      submission_date TIMESTAMPTZ,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(submission_id)
    );
  `);

  // 2. Read Top 100 JSON
  const jsonPath = path.resolve(process.cwd(), 'scripts', 'top100_genuine_feedback.json');
  const top100: any[] = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
  console.log(`2. Found ${top100.length} records to sync into DB.`);

  // Clear existing records to ensure fresh rank ordering
  await sql.query(`DELETE FROM genuine_student_feedback;`);

  for (let i = 0; i < top100.length; i++) {
    const s = top100[i];
    const rank = i + 1;
    const fullText = `${s.q1} ${s.q2} ${s.q3}`.toLowerCase();

    // Determine primary theme
    let theme = 'General Curriculum & Teaching';
    if (fullText.includes('pointer') || fullText.includes('c language') || fullText.includes('c program') || fullText.includes('programming') || fullText.includes('code') || fullText.includes('coding')) {
      theme = 'C Programming & Pointers';
    } else if (fullText.includes('matrix') || fullText.includes('matrices') || fullText.includes('eigen') || fullText.includes('calculus') || fullText.includes('math')) {
      theme = 'Engineering Mathematics (LA&C)';
    } else if (fullText.includes('afternoon') || fullText.includes('sleep') || fullText.includes('fast') || fullText.includes('pace') || fullText.includes('pacing')) {
      theme = 'Pacing & Afternoon Engagement';
    } else if (fullText.includes('hostel') || fullText.includes('bus') || fullText.includes('doubt') || fullText.includes('evening') || fullText.includes('study hours')) {
      theme = 'Doubt Clearing & Residential Support';
    } else if (fullText.includes('physics') || fullText.includes('chemistry') || fullText.includes('lab')) {
      theme = 'Physics/Chemistry Labs & Demonstrations';
    }

    await sql.query(
      `INSERT INTO genuine_student_feedback (
        rank, submission_id, student_name, roll_number, email, phone,
        college_code, college_name, branch_code, branch_name, feedback_type,
        student_avg_rating, q1_subject_challenges, q2_improvements, q3_additional_comments,
        primary_theme, genuine_score, submission_date, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, NOW())
      ON CONFLICT (submission_id) DO UPDATE SET
        rank = EXCLUDED.rank,
        student_name = EXCLUDED.student_name,
        roll_number = EXCLUDED.roll_number,
        student_avg_rating = EXCLUDED.student_avg_rating,
        q1_subject_challenges = EXCLUDED.q1_subject_challenges,
        q2_improvements = EXCLUDED.q2_improvements,
        q3_additional_comments = EXCLUDED.q3_additional_comments,
        primary_theme = EXCLUDED.primary_theme,
        genuine_score = EXCLUDED.genuine_score,
        submission_date = EXCLUDED.submission_date`,
      [
        rank,
        s.id,
        s.student_name || 'Anonymous Student',
        s.roll_number || 'N/A',
        s.email || '',
        s.phone || '',
        s.college_code,
        s.college_name,
        s.branch_code,
        s.branch_name,
        s.feedback_type,
        s.student_avg_rating || null,
        s.q1 || '',
        s.q2 || '',
        s.q3 || '',
        theme,
        s.score || 0,
        s.created_at ? new Date(s.created_at) : null,
      ]
    );
  }

  const countRes = await sql.query(`SELECT COUNT(*) as count FROM genuine_student_feedback`);
  console.log(`✓ Successfully pushed ${countRes[0].count} genuine feedback records into Neon PostgreSQL!`);
}

syncGenuineFeedback().catch(console.error);
