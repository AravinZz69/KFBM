import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import XLSX from 'xlsx';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import { neon } from '@neondatabase/serverless';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error('DATABASE_URL is missing.');
  process.exit(1);
}

const sql = neon(databaseUrl);

const CRITERIA_KEYS = [
  { key: 'conceptClarity', dbCol: 'concept_clarity', label: 'Concept Clarity & First Principles' },
  { key: 'subjectKnowledge', dbCol: 'subject_knowledge', label: 'Subject Knowledge & Depth' },
  { key: 'teachingMethodology', dbCol: 'teaching_methodology', label: 'Teaching Methodology & Pace' },
  { key: 'practicalExamples', dbCol: 'practical_examples', label: 'Practical Examples & Coding Demos' },
  { key: 'studentInteraction', dbCol: 'student_interaction', label: 'Student Interaction & Inclusiveness' },
  { key: 'doubtClarification', dbCol: 'doubt_clarification', label: 'Doubt Clarification & Approachability' },
  { key: 'regularityPunctuality', dbCol: 'regularity_punctuality', label: 'Regularity & Classroom Punctuality' },
  { key: 'assignmentsAssessments', dbCol: 'assignments_assessments', label: 'Assignments & Fair Evaluation' },
  { key: 'myUnderstanding', dbCol: 'my_understanding', label: 'Student Retention & Understanding' },
  { key: 'myAbilityApply', dbCol: 'my_ability_apply', label: 'Ability to Apply Concepts in Labs' },
] as const;

async function runEnrichment() {
  console.log('========================================================');
  console.log('  GENERATING 6 FEEDBACK REVIEW POINTS & 5 IMPROVEMENTS  ');
  console.log('========================================================\n');

  // Fetch all active faculty
  const facultyList = await sql`
    SELECT f.id, f.name, f.subject_name, f.feedback_type,
           c.code as college_code, c.name as college_name,
           b.code as branch_code, b.name as branch_name
    FROM faculty f
    JOIN colleges c ON c.id = f.college_id
    JOIN branches b ON b.id = f.branch_id
    WHERE f.active_flag = TRUE
    ORDER BY c.code, b.code, f.feedback_type, f.name
  `;

  const ratingsList = await sql`
    SELECT r.faculty_id, r.concept_clarity, r.subject_knowledge, r.teaching_methodology,
           r.practical_examples, r.student_interaction, r.doubt_clarification,
           r.regularity_punctuality, r.assignments_assessments, r.my_understanding,
           r.my_ability_apply, r.average_rating
    FROM feedback_ratings r
  `;

  console.log(`Analyzing ${facultyList.length} faculty and ${ratingsList.length} ratings.`);

  // Calculate averages for benchmarking
  const branchScores: Record<string, { total: number; count: number }> = {};
  const collegeScores: Record<string, { total: number; count: number }> = {};
  let institutionalTotal = 0;
  let institutionalCount = 0;

  for (const r of ratingsList) {
    const fac = facultyList.find((f: any) => f.id === r.faculty_id);
    if (!fac) continue;
    const branchKey = `${fac.college_code}-${fac.branch_code}`;
    const collegeKey = fac.college_code;
    const score = Number(r.average_rating) || 0;

    if (!branchScores[branchKey]) branchScores[branchKey] = { total: 0, count: 0 };
    branchScores[branchKey].total += score;
    branchScores[branchKey].count += 1;

    if (!collegeScores[collegeKey]) collegeScores[collegeKey] = { total: 0, count: 0 };
    collegeScores[collegeKey].total += score;
    collegeScores[collegeKey].count += 1;

    institutionalTotal += score;
    institutionalCount += 1;
  }

  const instAvg = institutionalCount > 0 ? Math.round((institutionalTotal / institutionalCount) * 100) / 100 : 4.02;

  const enrichedReports: any[] = [];

  for (const fac of facultyList) {
    const facRatings = ratingsList.filter((r: any) => r.faculty_id === fac.id);
    const count = facRatings.length;

    let overallScore = 0;
    const criteriaScores: Record<string, number> = {};

    if (count > 0) {
      for (const crit of CRITERIA_KEYS) {
        const sum = facRatings.reduce((acc: number, cur: any) => acc + Number(cur[crit.dbCol] || 0), 0);
        criteriaScores[crit.key] = Math.round((sum / count) * 100) / 100;
      }
      const totalAvgSum = facRatings.reduce((acc: number, cur: any) => acc + Number(cur.average_rating || 0), 0);
      overallScore = Math.round((totalAvgSum / count) * 100) / 100;
    } else {
      for (const crit of CRITERIA_KEYS) {
        criteriaScores[crit.key] = 0;
      }
    }

    const branchKey = `${fac.college_code}-${fac.branch_code}`;
    const branchAvg = branchScores[branchKey] && branchScores[branchKey].count > 0
      ? Math.round((branchScores[branchKey].total / branchScores[branchKey].count) * 100) / 100
      : instAvg;
    const collegeAvg = collegeScores[fac.college_code] && collegeScores[fac.college_code].count > 0
      ? Math.round((collegeScores[fac.college_code].total / collegeScores[fac.college_code].count) * 100) / 100
      : instAvg;

    let tier = 'Pending Evaluations';
    let tierColor = '#64748b';
    if (count >= 1) {
      if (overallScore >= 4.5) { tier = 'Outstanding / Role Model'; tierColor = '#10b981'; }
      else if (overallScore >= 4.0) { tier = 'Proficient / Strong Delivery'; tierColor = '#2563eb'; }
      else if (overallScore >= 3.5) { tier = 'Developing / Targeted Support'; tierColor = '#d97706'; }
      else { tier = 'Needs Urgent Intervention'; tierColor = '#ef4444'; }
    }

    // EXACTLY 6 FEEDBACK REVIEW POINTS (in bold text style)
    const clarityScore = (criteriaScores.conceptClarity || overallScore).toFixed(2);
    const knowScore = (criteriaScores.subjectKnowledge || overallScore).toFixed(2);
    const methodScore = (criteriaScores.teachingMethodology || overallScore).toFixed(2);
    const punctScore = (criteriaScores.regularityPunctuality || overallScore).toFixed(2);
    const interactScore = (criteriaScores.studentInteraction || overallScore).toFixed(2);
    const practicalScore = (criteriaScores.practicalExamples || overallScore).toFixed(2);

    const sixFeedbackPoints: string[] = [
      `Strong Concept Clarity & First Principles: Demonstrates clear conceptual explanations with structured step-by-step logic, rated at ${clarityScore} / 5.00 (${Math.round((Number(clarityScore) / 5) * 100)}%).`,
      `Extensive Subject Knowledge & Syllabus Mastery: Exhibits comprehensive command of university course units and theoretical depth, rated at ${knowScore} / 5.00 (${Math.round((Number(knowScore) / 5) * 100)}%).`,
      `Effective Teaching Methodology & Classroom Pacing: Maintains structured instructional sequencing, transitioning systematically from fundamental to advanced topics, rated at ${methodScore} / 5.00 (${Math.round((Number(methodScore) / 5) * 100)}%).`,
      `High Punctuality, Regularity & Timetable Discipline: Exemplary adherence to scheduled lecture hours with consistent classroom attendance, rated at ${punctScore} / 5.00 (${Math.round((Number(punctScore) / 5) * 100)}%).`,
      `Active Student Interaction & Doubt Clarification: Encourages interactive two-way communication and patiently addresses student queries, rated at ${interactScore} / 5.00 (${Math.round((Number(interactScore) / 5) * 100)}%).`,
      `Practical Demonstration & Lab Application Alignment: Effectively illustrates theoretical principles with live problem solving and laboratory relevance, rated at ${practicalScore} / 5.00 (${Math.round((Number(practicalScore) / 5) * 100)}%).`,
    ];

    // Ranked criteria to customize 5 Improvement Points
    const rankedCriteria = CRITERIA_KEYS.map(c => ({
      key: c.key,
      label: c.label,
      score: criteriaScores[c.key] || 0,
    })).sort((a, b) => a.score - b.score);

    const lowest1 = rankedCriteria[0];
    const lowest2 = rankedCriteria[1];

    // EXACTLY 5 IMPROVEMENT POINTS
    const fiveImprovementPoints: string[] = [
      `Targeted Improvement in ${lowest1.label}: Rated ${lowest1.score.toFixed(2)}/5.00; implement stepped conceptual breakdowns and structured check-in questions during lectures.`,
      `Enhanced Practical & Hands-On Problem Walkthroughs: Increase live coding / board-solved problem modeling to bridge the transition between theory and lab exercises.`,
      `Lecture Pacing Calibration for Varied Learners: Dedicate the opening 5 minutes to reviewing previous formulas and decelerate transitions on complex topics.`,
      `Structured Doubt Resolution Desks: Reserve 10 minutes at the close of every lecture for focused Q&A, specifically supporting students needing foundational reinforcement.`,
      `Comprehensive Exam Preparation Support: Distribute annotated sample solution sheets and practice problem sets ahead of mid-term examinations.`,
    ];

    const comparativeMetrics = {
      facultyScore: overallScore,
      branchAverage: branchAvg,
      collegeAverage: collegeAvg,
      institutionalAverage: instAvg,
      totalEvaluations: count,
      tier,
      tierColor,
    };

    enrichedReports.push({
      faculty_id: fac.id,
      faculty_name: fac.name,
      subject_name: fac.subject_name,
      college_code: fac.college_code,
      branch_code: fac.branch_code,
      feedback_type: fac.feedback_type,
      total_reviews: count,
      overall_score: overallScore,
      performance_tier: tier,
      criteria_scores: criteriaScores,
      strengths: sixFeedbackPoints,
      weaknesses: fiveImprovementPoints,
      recommendations: fiveImprovementPoints,
      student_highlights: [],
      student_sentiment: overallScore >= 4.3 ? 'Highly Positive' : overallScore >= 3.8 ? 'Positive' : overallScore >= 3.3 ? 'Moderate' : 'Needs Support',
      ai_summary: `${fac.name} evaluated across ${count} student submissions with an overall rating of ${overallScore.toFixed(2)}/5.00 (${tier}).`,
      detailed_paragraphs: {},
      action_plan: fiveImprovementPoints,
      comparative_metrics: comparativeMetrics,
    });
  }

  // Push updates to Neon DB
  console.log(`Pushing 6 feedback points & 5 improvements for all ${enrichedReports.length} faculty into Neon DB...`);
  for (const rep of enrichedReports) {
    await sql.query(
      `UPDATE ai_faculty_reports SET
        total_reviews = $1,
        overall_score = $2,
        performance_tier = $3,
        criteria_scores = $4,
        strengths = $5,
        weaknesses = $6,
        recommendations = $7,
        student_sentiment = $8,
        ai_summary = $9,
        action_plan = $10,
        comparative_metrics = $11,
        updated_at = NOW()
      WHERE faculty_id = $12`,
      [
        rep.total_reviews,
        rep.overall_score,
        rep.performance_tier,
        JSON.stringify(rep.criteria_scores),
        JSON.stringify(rep.strengths),
        JSON.stringify(rep.weaknesses),
        JSON.stringify(rep.recommendations),
        rep.student_sentiment,
        rep.ai_summary,
        JSON.stringify(rep.action_plan),
        JSON.stringify(rep.comparative_metrics),
        rep.faculty_id,
      ]
    );
  }

  // Update Excel & CSV
  console.log('Generating updated Excel and CSV reports...');
  const reportsDir = path.resolve(process.cwd(), 'public', 'reports');
  const excelPath = path.join(reportsDir, 'KIET_AI_Feedback_Analysis_Report.xlsx');
  const csvPath = path.join(reportsDir, 'KIET_Faculty_AI_Detailed_Report.csv');

  const csvHeaders = [
    'Faculty ID',
    'Faculty Name',
    'Subject',
    'Campus',
    'Branch',
    'Model (FRM/SRM)',
    'Total Reviews',
    'Overall Rating (5.0)',
    'Performance Tier',
    'Concept Clarity',
    'Subject Knowledge',
    'Teaching Methodology',
    'Practical Examples',
    'Student Interaction',
    'Doubt Clarification',
    'Regularity & Punctuality',
    'Assignments & Assessments',
    'Student Understanding',
    'Ability to Apply',
    'Student Sentiment',
    '6 Feedback Review Points (Bold)',
    '5 Areas for Improvement',
  ];

  const csvRows = enrichedReports.map(r => [
    r.faculty_id,
    `"${r.faculty_name}"`,
    `"${r.subject_name}"`,
    r.college_code,
    r.branch_code,
    r.feedback_type,
    r.total_reviews,
    r.overall_score,
    `"${r.performance_tier}"`,
    r.criteria_scores.conceptClarity || 0,
    r.criteria_scores.subjectKnowledge || 0,
    r.criteria_scores.teachingMethodology || 0,
    r.criteria_scores.practicalExamples || 0,
    r.criteria_scores.studentInteraction || 0,
    r.criteria_scores.doubtClarification || 0,
    r.criteria_scores.regularityPunctuality || 0,
    r.criteria_scores.assignmentsAssessments || 0,
    r.criteria_scores.myUnderstanding || 0,
    r.criteria_scores.myAbilityApply || 0,
    r.student_sentiment,
    `"${r.strengths.join(' | ').replace(/"/g, '""')}"`,
    `"${r.weaknesses.join(' | ').replace(/"/g, '""')}"`,
  ]);

  const csvContent = [csvHeaders.join(','), ...csvRows.map(row => row.join(','))].join('\n');
  fs.writeFileSync(csvPath, csvContent, 'utf-8');

  // Excel
  const wb = XLSX.utils.book_new();
  const facultySheetData = enrichedReports.map(r => ({
    'Faculty ID': r.faculty_id,
    'Faculty Name': r.faculty_name,
    'Subject': r.subject_name,
    'Campus': r.college_code,
    'Branch': r.branch_code,
    'Model': r.feedback_type,
    'Reviews': r.total_reviews,
    'Rating (5.0)': r.overall_score,
    'Tier': r.performance_tier,
    'Concept Clarity': r.criteria_scores.conceptClarity || 0,
    'Subject Knowledge': r.criteria_scores.subjectKnowledge || 0,
    'Teaching Methodology': r.criteria_scores.teachingMethodology || 0,
    'Practical Examples': r.criteria_scores.practicalExamples || 0,
    'Student Interaction': r.criteria_scores.studentInteraction || 0,
    'Doubt Clarification': r.criteria_scores.doubtClarification || 0,
    'Punctuality': r.criteria_scores.regularityPunctuality || 0,
    'Assessments': r.criteria_scores.assignmentsAssessments || 0,
    'Understanding': r.criteria_scores.myUnderstanding || 0,
    'Ability Apply': r.criteria_scores.myAbilityApply || 0,
    'Sentiment': r.student_sentiment,
    '6 Feedback Review Points': r.strengths.join('\n'),
    '5 Improvement Points': r.weaknesses.join('\n'),
  }));
  const wsFaculty = XLSX.utils.json_to_sheet(facultySheetData);
  XLSX.utils.book_append_sheet(wb, wsFaculty, 'Faculty Scorecards');

  XLSX.writeFile(wb, excelPath);
  console.log('✓ Successfully updated database, CSV, and Excel with 6 Feedback Points and 5 Improvements!');
}

runEnrichment().catch(console.error);
