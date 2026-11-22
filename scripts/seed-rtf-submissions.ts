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

async function main() {
  console.log('--- Checking & Seeding RTF Submissions ---');

  // Check current count
  const currentRtf = await sql`SELECT COUNT(*) as count FROM feedback_submissions WHERE feedback_type = 'RTF'`;
  console.log('Current RTF submissions count:', currentRtf[0]?.count);

  if (Number(currentRtf[0]?.count || 0) > 0) {
    console.log('RTF submissions already exist! Count:', currentRtf[0]?.count);
    return;
  }

  // Fetch college and branch IDs
  const colleges = await sql`SELECT id, code FROM colleges`;
  const branches = await sql`SELECT id, code FROM branches`;
  const collegeMap = Object.fromEntries(colleges.map((c: any) => [c.code, c.id]));
  const branchMap = Object.fromEntries(branches.map((b: any) => [b.code, b.id]));

  // Fetch RTF faculty
  const rtfFaculty = await sql`
    SELECT f.id, f.name, f.subject_name, c.code as college, b.code as branch
    FROM faculty f
    JOIN colleges c ON c.id = f.college_id
    JOIN branches b ON b.id = f.branch_id
    WHERE f.feedback_type = 'RTF' AND f.active_flag = TRUE
  `;

  console.log(`Found ${rtfFaculty.length} active RTF faculty.`);

  const sampleSubmissions = [
    {
      roll: '23B91A0501',
      name: 'Aditya Varma',
      college: 'KIET',
      branch: 'AID',
      q1: 'Finding Physics electrostatics complex; concepts in C&DS need additional visual problem sets.',
      q2: 'More interactive problem-solving sessions in C&DS and practical illustrations in Chemistry.',
      q3: 'RTF faculty are very regular and punctual. Doubts in LA & C are cleared promptly.',
    },
    {
      roll: '23B91A0508',
      name: 'P. Sai Teja',
      college: 'KIET',
      branch: 'CSM',
      q1: 'FDL state machine reduction and minimization problems require more practice hours.',
      q2: 'Step-by-step whiteboard derivations for linear algebra transformations in LA & C.',
      q3: 'Overall satisfaction is high. Chemistry sessions with Shyam sir are very energetic.',
    },
    {
      roll: '23B91A0515',
      name: 'K. Sneha',
      college: 'KIETW',
      branch: 'AID',
      q1: 'Chemistry thermodynamics numericals and Physics wave optics equations.',
      q2: 'Providing chapter-wise formula cheat sheets and mock tests before mid exams.',
      q3: 'Maha Lakshmi maam explains physics fundamentals exceptionally well with real life examples.',
    },
    {
      roll: '23B91A0522',
      name: 'G. Harini',
      college: 'KIETW',
      branch: 'CYBER',
      q1: 'C&DS pointer operations and doubly linked lists traversal.',
      q2: 'Hands-on laboratory time alongside classroom explanation in C&DS.',
      q3: 'Bharathi maam provides clear notes and Anitha maam covers FDL logic gates thoroughly.',
    },
    {
      roll: '23B91A0530',
      name: 'V. Rajesh Kumar',
      college: 'KIET',
      branch: 'CAI',
      q1: 'LA & C eigenvalues and matrix diagonalization problems.',
      q2: 'Extra tutorial hours after regular lecture schedule for numerical problem walkthroughs.',
      q3: 'Raju sir explains LA & C concepts patiently. Very supportive faculty team.',
    },
    {
      roll: '23B91A0541',
      name: 'Ch. Manasa',
      college: 'KIETW',
      branch: 'CSM',
      q1: 'FDL flip-flop conversion and sequential counter designs.',
      q2: 'Clear summary notes at the end of each unit in Physics and Chemistry.',
      q3: 'RTF schedule allows solid academic continuity throughout the semester.',
    },
  ];

  for (const s of sampleSubmissions) {
    const cId = collegeMap[s.college];
    const bId = branchMap[s.branch];
    if (!cId || !bId) continue;

    const studentEmail = `${s.roll.toLowerCase()}@kiet.edu`;

    // Insert submission
    const subRes = await sql`
      INSERT INTO feedback_submissions (
        student_name, email, phone, roll_number, college_id, branch_id, feedback_type,
        q1_subject_challenges, q2_improvements, q3_additional_comments, created_at
      ) VALUES (
        ${s.name}, ${studentEmail}, '9848012345', ${s.roll}, ${cId}, ${bId}, 'RTF',
        ${s.q1}, ${s.q2}, ${s.q3}, NOW()
      ) RETURNING id
    `;
    const subId = subRes[0]?.id;

    // Get matching RTF faculty for this college & branch
    const matchedFac = rtfFaculty.filter(
      (f: any) => f.college === s.college && f.branch === s.branch
    );

    for (const fac of matchedFac) {
      // Link to feedback_faculty
      await sql`
        INSERT INTO feedback_faculty (submission_id, faculty_id, created_at)
        VALUES (${subId}, ${fac.id}, NOW())
        ON CONFLICT (submission_id, faculty_id) DO NOTHING
      `;

      // Check if feedback_ratings table exists
      try {
        await sql`
          INSERT INTO feedback_ratings (
            submission_id, faculty_id,
            subject_knowledge, communication_skills, punctuality, concept_clarity,
            practical_examples, syllabus_coverage, doubt_clarification, student_engagement,
            evaluation_fairness, overall_effectiveness, created_at
          ) VALUES (
            ${subId}, ${fac.id},
            4.5, 4.3, 4.8, 4.6, 4.2, 4.7, 4.4, 4.5, 4.6, 4.5, NOW()
          ) ON CONFLICT DO NOTHING
        `;
      } catch (e) {
        // feedback_ratings may or may not exist depending on schema
      }
    }
  }

  console.log(`✓ Seeded ${sampleSubmissions.length} RTF submissions!`);

  const updatedCounts = await sql`
    SELECT feedback_type, COUNT(*) as count 
    FROM feedback_submissions 
    GROUP BY feedback_type
  `;
  console.log('Updated submission counts:', updatedCounts);
}

main().catch(console.error);
