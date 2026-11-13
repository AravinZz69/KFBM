import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

async function inspectFeedback() {
  const submissions = await sql`
    SELECT s.id, s.student_name, s.email, s.phone, s.roll_number,
           c.code as college_code, b.code as branch_code, s.feedback_type,
           s.q1_subject_challenges, s.q2_improvements, s.q3_additional_comments,
           s.created_at
    FROM feedback_submissions s
    JOIN colleges c ON c.id = s.college_id
    JOIN branches b ON b.id = s.branch_id
    ORDER BY s.id DESC
  `;

  console.log('Total submissions:', submissions.length);

  // Filter and score for genuineness
  const scored = submissions.map(s => {
    const q1 = (s.q1_subject_challenges || '').trim();
    const q2 = (s.q2_improvements || '').trim();
    const q3 = (s.q3_additional_comments || '').trim();
    const fullText = `${q1} ${q2} ${q3}`.trim();

    // Spam / trivial filters
    const isTrivial = (txt: string) => {
      const lower = txt.toLowerCase().replace(/[^a-z0-9]/g, '');
      return ['none', 'no', 'nothing', 'good', 'verygood', 'nice', 'ok', 'test', 'allgood', 'nil', 'na', ''].includes(lower);
    };

    let score = 0;
    if (q1.length > 5 && !isTrivial(q1)) score += q1.length;
    if (q2.length > 5 && !isTrivial(q2)) score += q2.length * 1.2;
    if (q3.length > 5 && !isTrivial(q3)) score += q3.length * 1.5;

    // Bonus for specific keywords indicating real feedback
    const keywords = [
      'teach', 'understand', 'explain', 'fast', 'slow', 'pace', 'doubt', 'lab', 'code',
      'programming', 'physics', 'math', 'chemistry', 'problem', 'solve', 'example',
      'board', 'projector', 'faculty', 'sir', 'madam', 'practice', 'exam', 'time',
      'hours', 'residential', 'hostel', 'bus', 'study', 'class', 'lecture', 'concept'
    ];
    for (const kw of keywords) {
      if (fullText.toLowerCase().includes(kw)) score += 15;
    }

    return {
      ...s,
      q1,
      q2,
      q3,
      fullLength: fullText.length,
      genuineScore: score,
    };
  });

  const genuineOnly = scored.filter(s => s.genuineScore > 10).sort((a, b) => b.genuineScore - a.genuineScore);
  console.log('Genuine submissions count:', genuineOnly.length);

  console.log('\nTop 5 sample genuine submissions:');
  for (const s of genuineOnly.slice(0, 5)) {
    console.log(`\nID: #${s.id} | ${s.student_name} (${s.college_code} - ${s.branch_code} ${s.feedback_type}) [Score: ${s.genuineScore}]`);
    console.log(`Challenges: "${s.q1}"`);
    console.log(`Improvements: "${s.q2}"`);
    if (s.q3) console.log(`Comments: "${s.q3}"`);
  }
}

inspectFeedback().catch(console.error);
