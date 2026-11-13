import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

async function run() {
  const submissions = await sql`
    SELECT s.id, s.student_name, s.email, s.phone, s.roll_number,
           c.code as college_code, c.name as college_name,
           b.code as branch_code, b.name as branch_name,
           s.feedback_type,
           s.q1_subject_challenges, s.q2_improvements, s.q3_additional_comments,
           s.created_at,
           ROUND(AVG(r.average_rating)::numeric, 2) as student_avg_rating,
           COUNT(r.id) as rated_faculty_count
    FROM feedback_submissions s
    JOIN colleges c ON c.id = s.college_id
    JOIN branches b ON b.id = s.branch_id
    LEFT JOIN feedback_ratings r ON r.submission_id = s.id
    GROUP BY s.id, c.code, c.name, b.code, b.name
    ORDER BY s.id DESC
  `;

  console.log(`Fetched ${submissions.length} total submissions.`);

  // Genuine scoring algorithm
  const isTrivial = (txt: string) => {
    const lower = txt.toLowerCase().replace(/[^a-z0-9]/g, '');
    return ['none', 'no', 'nothing', 'good', 'verygood', 'nice', 'ok', 'test', 'allgood', 'nil', 'na', 'q1test', 'q2test', ''].includes(lower);
  };

  const scored = submissions.map(s => {
    const q1 = (s.q1_subject_challenges || '').trim();
    const q2 = (s.q2_improvements || '').trim();
    const q3 = (s.q3_additional_comments || '').trim();
    const fullText = `${q1} ${q2} ${q3}`.trim();

    let score = 0;
    // Length & depth scoring
    if (q1.length > 10 && !isTrivial(q1)) score += Math.min(q1.length, 300);
    if (q2.length > 10 && !isTrivial(q2)) score += Math.min(q2.length * 1.2, 350);
    if (q3.length > 10 && !isTrivial(q3)) score += Math.min(q3.length * 1.3, 350);

    // Penalize trivial / repetitive boilerplate
    if (isTrivial(q1)) score -= 50;
    if (isTrivial(q2)) score -= 50;

    // Substantive pedagogical & subject keywords
    const keywords = [
      'c language', 'c programming', 'pointer', 'pointers', 'array', 'arrays', 'logic',
      'mathematics', 'maths', 'matrix', 'matrices', 'eigen', 'calculus', 'physics',
      'chemistry', 'fdi', 'digital', 'english', 'communication', 'lab', 'labs',
      'doubt', 'doubts', 'pace', 'fast', 'slow', 'explain', 'board', 'projector',
      'understand', 'understanding', 'practice', 'problem', 'problems', 'solve',
      'assignment', 'exam', 'mid', 'hostel', 'residential', 'frm', 'srm', 'bus',
      'afternoon', 'sleep', 'active', 'interactive', 'mentor', 'madam', 'sir',
      'teacher', 'faculty', 'teaching', 'improve', 'suggestion'
    ];

    const lower = fullText.toLowerCase();
    let kwHits = 0;
    for (const kw of keywords) {
      if (lower.includes(kw)) {
        score += 20;
        kwHits++;
      }
    }

    // Specificity bonus for detailed feedback
    if (kwHits >= 3) score += 50;
    if (kwHits >= 6) score += 100;

    // Detect duplicate / template repetition
    return {
      ...s,
      q1,
      q2,
      q3,
      fullText,
      kwHits,
      score: Math.round(score),
    };
  });

  // Filter out any entries that are trivial or have less than 15 score
  const validGenuine = scored.filter(s => s.score > 40 && !isTrivial(s.q1) && !isTrivial(s.q2));

  // Sort by genuine score descending
  validGenuine.sort((a, b) => b.score - a.score);

  console.log(`Identified ${validGenuine.length} genuine submissions.`);

  const top100 = validGenuine.slice(0, 100);

  // Write top 100 to a JSON scratch file for processing
  const scratchDir = path.resolve(process.cwd(), 'scripts');
  fs.writeFileSync(path.join(scratchDir, 'top100_genuine_feedback.json'), JSON.stringify(top100, null, 2));

  console.log('Top 100 saved to scripts/top100_genuine_feedback.json');
}

run().catch(console.error);
