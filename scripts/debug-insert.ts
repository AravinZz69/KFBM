import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

async function debug() {
  try {
    const studentName = 'Anonymous';
    const email = '';
    const phone = '';
    const rollNumber = 'TEST_DEBUG_' + Date.now();
    const college = await sql.query(`SELECT id FROM colleges WHERE code = 'KIETW'`);
    const branch = await sql.query(`SELECT id FROM branches WHERE code = 'CSM'`);
    const collegeId = college[0].id;
    const branchId = branch[0].id;
    const feedbackType = 'FRM';
    const q1 = 'Q1 test';
    const q2 = 'Q2 test';
    const q3 = 'Q3 test';

    console.log('Inserting into feedback_submissions...');
    const res = await sql.query(
      `INSERT INTO feedback_submissions (
        student_name, email, phone, roll_number, college_id, branch_id, feedback_type,
        q1_subject_challenges, q2_improvements, q3_additional_comments, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
      RETURNING id`,
      [studentName, email, phone, rollNumber, collegeId, branchId, feedbackType, q1, q2, q3]
    );
    console.log('Inserted submission id:', res[0].id);

    const subId = res[0].id;

    // Faculty check
    const faculty = await sql.query(`SELECT id FROM faculty WHERE college_id = $1 AND branch_id = $2 AND feedback_type = $3 LIMIT 1`, [collegeId, branchId, feedbackType]);
    const facId = faculty[0].id;
    console.log('Faculty ID:', facId);

    // Try ratings insert
    console.log('Inserting ratings with ON CONFLICT...');
    await sql.query(
      `INSERT INTO feedback_ratings (
        submission_id, faculty_id, subject_name,
        concept_clarity, subject_knowledge, teaching_methodology,
        practical_examples, student_interaction, doubt_clarification,
        regularity_punctuality, assignments_assessments, my_understanding,
        my_ability_apply, average_rating, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW())
      ON CONFLICT (submission_id, faculty_id) DO UPDATE SET
        concept_clarity = EXCLUDED.concept_clarity,
        subject_knowledge = EXCLUDED.subject_knowledge,
        teaching_methodology = EXCLUDED.teaching_methodology,
        practical_examples = EXCLUDED.practical_examples,
        student_interaction = EXCLUDED.student_interaction,
        doubt_clarification = EXCLUDED.doubt_clarification,
        regularity_punctuality = EXCLUDED.regularity_punctuality,
        assignments_assessments = EXCLUDED.assignments_assessments,
        my_understanding = EXCLUDED.my_understanding,
        my_ability_apply = EXCLUDED.my_ability_apply,
        average_rating = EXCLUDED.average_rating`,
      [subId, facId, 'Test Subject', 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, '5.00']
    );
    console.log('Ratings insert succeeded!');
  } catch (err) {
    console.error('Error details:', err);
  }
}

debug();
