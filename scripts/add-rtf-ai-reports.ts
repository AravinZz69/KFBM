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
  console.log('--- Adding RTF to AI Model Reports & Faculty Reports ---');

  // 1. Insert/Update RTF in ai_model_reports
  await sql`
    INSERT INTO ai_model_reports (
      feedback_type, model_name, total_submissions, average_score,
      criteria_averages, comparative_advantages, challenges_observed,
      residential_impact_analysis, action_plan, updated_at
    ) VALUES (
      'RTF', 'RTF Academic Model', 6, 4.52,
      ${JSON.stringify({
        conceptClarity: 4.55,
        subjectKnowledge: 4.65,
        teachingMethodology: 4.50,
        practicalExamples: 4.40,
        studentInteraction: 4.50,
        doubtClarification: 4.45,
        regularityPunctuality: 4.75,
        assignmentsAssessments: 4.50,
        myUnderstanding: 4.45,
        myAbilityApply: 4.45
      })},
      ${JSON.stringify([
        'High punctuality and consistent syllabus coverage across branches',
        'Strong student interaction in fundamental core curriculum',
        'Effective doubt resolution during interactive classroom discussions'
      ])},
      ${JSON.stringify([
        'Request for additional lab coding walkthroughs in C&DS',
        'Students seeking chapter-wise formula summaries for Physics and LA & C'
      ])},
      'RTF academic cohorts exhibit steady attendance, balanced theoretical retention, and disciplined evaluation responses.',
      ${JSON.stringify([
        'Schedule weekly hands-on laboratory practice sessions for C&DS and FDL',
        'Provide standardized question banks and unit-wise formula sheets prior to mid exams'
      ])},
      NOW()
    )
    ON CONFLICT (feedback_type) DO UPDATE SET
      model_name = EXCLUDED.model_name,
      total_submissions = EXCLUDED.total_submissions,
      average_score = EXCLUDED.average_score,
      criteria_averages = EXCLUDED.criteria_averages,
      comparative_advantages = EXCLUDED.comparative_advantages,
      challenges_observed = EXCLUDED.challenges_observed,
      residential_impact_analysis = EXCLUDED.residential_impact_analysis,
      action_plan = EXCLUDED.action_plan,
      updated_at = NOW()
  `;
  console.log('✓ ai_model_reports updated for RTF');

  // 2. Insert ai_faculty_reports for sample RTF faculty if missing
  const rtfFaculty = await sql`
    SELECT f.id, f.name, f.subject_name, c.code as college, b.code as branch
    FROM faculty f
    JOIN colleges c ON c.id = f.college_id
    JOIN branches b ON b.id = f.branch_id
    WHERE f.feedback_type = 'RTF' AND f.active_flag = TRUE
  `;

  let facReportsAdded = 0;
  for (const fac of rtfFaculty) {
    const scores = {
      conceptClarity: 4.5 + Math.random() * 0.3,
      subjectKnowledge: 4.6 + Math.random() * 0.3,
      teachingMethodology: 4.4 + Math.random() * 0.3,
      practicalExamples: 4.3 + Math.random() * 0.4,
      studentInteraction: 4.4 + Math.random() * 0.4,
      doubtClarification: 4.5 + Math.random() * 0.3,
      regularityPunctuality: 4.7 + Math.random() * 0.2,
      assignmentsAssessments: 4.5 + Math.random() * 0.3,
      myUnderstanding: 4.4 + Math.random() * 0.3,
      myAbilityApply: 4.3 + Math.random() * 0.4,
    };
    const avgScore = (Object.values(scores).reduce((a, b) => a + b, 0) / 10).toFixed(2);
    const tier = Number(avgScore) >= 4.5 ? 'Outstanding / Role Model' : 'Proficient / Strong Delivery';

    await sql`
      INSERT INTO ai_faculty_reports (
        faculty_id, faculty_name, subject_name, college_code, branch_code, feedback_type,
        total_reviews, overall_score, performance_tier, criteria_scores,
        strengths, weaknesses, recommendations, student_sentiment, ai_summary, updated_at
      ) VALUES (
        ${fac.id}, ${fac.name}, ${fac.subject_name}, ${fac.college}, ${fac.branch}, 'RTF',
        6, ${avgScore}, ${tier},
        ${JSON.stringify(scores)},
        ${JSON.stringify(['Clear conceptual foundations', 'High punctuality', 'Encouraging classroom atmosphere'])},
        ${JSON.stringify(['Can increase real-world problem sets', 'Extra practice for numerical problems'])},
        ${JSON.stringify(['Offer short doubt-clearing sessions after unit completions', 'Share chapter reference notes'])},
        'Positive',
        ${`${fac.name} demonstrates exemplary dedication and structured pedagogy in ${fac.subject_name}. Students appreciate clear explanations and disciplined curriculum delivery.`},
        NOW()
      )
      ON CONFLICT (faculty_id) DO UPDATE SET
        overall_score = EXCLUDED.overall_score,
        performance_tier = EXCLUDED.performance_tier,
        criteria_scores = EXCLUDED.criteria_scores,
        updated_at = NOW()
    `;
    facReportsAdded++;
  }

  console.log(`✓ ai_faculty_reports added/updated for ${facReportsAdded} RTF faculty.`);
}

main().catch(console.error);
