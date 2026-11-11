export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApi } from '@/lib/auth';
import { query } from '@/lib/db';
import { sanitizeInput } from '@/lib/sanitize';
import * as XLSX from 'xlsx';

export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdminApi(request);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const format = (searchParams.get('format') || 'csv').toLowerCase();

    const search = sanitizeInput(searchParams.get('search') || '');
    const campus = sanitizeInput(searchParams.get('campus') || '');
    const branch = sanitizeInput(searchParams.get('branch') || '');
    const feedbackType = sanitizeInput(searchParams.get('type') || '');
    const startDate = sanitizeInput(searchParams.get('startDate') || '');
    const endDate = sanitizeInput(searchParams.get('endDate') || '');

    // Build parameterized conditions dynamically
    const whereConditions: string[] = ['1=1'];
    const queryParams: any[] = [];
    let paramIdx = 1;

    if (campus && campus !== 'ALL') {
      whereConditions.push(`UPPER(c.code) = UPPER($${paramIdx})`);
      queryParams.push(campus);
      paramIdx++;
    }

    if (branch && branch !== 'ALL') {
      whereConditions.push(`UPPER(b.code) = UPPER($${paramIdx})`);
      queryParams.push(branch);
      paramIdx++;
    }

    if (feedbackType && feedbackType !== 'ALL') {
      whereConditions.push(`s.feedback_type = $${paramIdx}`);
      queryParams.push(feedbackType);
      paramIdx++;
    }

    if (startDate) {
      whereConditions.push(`s.created_at >= $${paramIdx}::timestamptz`);
      queryParams.push(`${startDate} 00:00:00`);
      paramIdx++;
    }

    if (endDate) {
      whereConditions.push(`s.created_at <= $${paramIdx}::timestamptz`);
      queryParams.push(`${endDate} 23:59:59`);
      paramIdx++;
    }

    if (search) {
      whereConditions.push(
        `(
          s.student_name ILIKE $${paramIdx} OR
          s.roll_number ILIKE $${paramIdx} OR
          EXISTS (
            SELECT 1 FROM feedback_faculty ff_search
            JOIN faculty f_search ON f_search.id = ff_search.faculty_id
            WHERE ff_search.submission_id = s.id AND (f_search.name ILIKE $${paramIdx} OR f_search.subject_name ILIKE $${paramIdx})
          )
        )`
      );
      queryParams.push(`%${search}%`);
      paramIdx++;
    }

    const whereClause = whereConditions.join(' AND ');

    // 1. Fetch main submissions
    const dataSql = `
      SELECT s.id, s.created_at, s.student_name, s.roll_number, s.email, s.phone,
             c.code as college, b.code as branch, s.feedback_type,
             STRING_AGG(DISTINCT CONCAT(COALESCE(f.subject_name, 'Subject'), ': ', f.name), '; ' ORDER BY CONCAT(COALESCE(f.subject_name, 'Subject'), ': ', f.name)) as subjects_and_faculty,
             ROUND(AVG(r.average_rating), 2) as overall_score,
             s.q1_subject_challenges, s.q2_improvements, s.q3_additional_comments
      FROM feedback_submissions s
      JOIN colleges c ON c.id = s.college_id
      JOIN branches b ON b.id = s.branch_id
      LEFT JOIN feedback_faculty ff ON ff.submission_id = s.id
      LEFT JOIN faculty f ON f.id = ff.faculty_id
      LEFT JOIN feedback_ratings r ON r.submission_id = s.id
      WHERE ${whereClause}
      GROUP BY s.id, s.created_at, s.student_name, s.roll_number, s.email, s.phone,
               c.code, b.code, s.feedback_type, s.q1_subject_challenges, s.q2_improvements, s.q3_additional_comments
      ORDER BY s.created_at DESC
    `;

    const rows = await query(dataSql, queryParams);

    // 2. Fetch all detailed criteria ratings for these submissions
    const subIds = rows.map(r => r.id);
    let detailedRatingsRows: any[] = [];
    if (subIds.length > 0) {
      detailedRatingsRows = await query(
        `SELECT r.submission_id, s.roll_number, s.student_name, c.code as college, b.code as branch, s.feedback_type,
                r.subject_name, f.name as faculty_name,
                r.concept_clarity, r.subject_knowledge, r.teaching_methodology,
                r.practical_examples, r.student_interaction, r.doubt_clarification,
                r.regularity_punctuality, r.assignments_assessments, r.my_understanding,
                r.my_ability_apply, r.average_rating, r.created_at
         FROM feedback_ratings r
         JOIN feedback_submissions s ON s.id = r.submission_id
         JOIN colleges c ON c.id = s.college_id
         JOIN branches b ON b.id = s.branch_id
         JOIN faculty f ON f.id = r.faculty_id
         WHERE r.submission_id = ANY($1::int[])
         ORDER BY r.submission_id DESC, r.subject_name ASC`,
        [subIds]
      );
    }

    const exportSummary = rows.map((r, index) => ({
      'S.No': index + 1,
      'Submission ID': r.id,
      'Date & Time': new Date(r.created_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
      'Roll Number': r.roll_number,
      'Student Name': r.student_name || 'Anonymous',
      'Campus': r.college,
      'Branch': r.branch,
      'Type': r.feedback_type,
      'Overall Criteria Score (1-5)': r.overall_score || 'N/A',
      'Subjects & Faculty Evaluated': r.subjects_and_faculty || 'N/A',
      'Q1: Difficult Subject & Topics': r.q1_subject_challenges,
      'Q2: Expected Faculty Improvements': r.q2_improvements,
      'Q3: Comments & Suggestions': r.q3_additional_comments,
    }));

    const exportDetailedRatings = detailedRatingsRows.map((dr, index) => ({
      'S.No': index + 1,
      'Submission ID': dr.submission_id,
      'Roll Number': dr.roll_number,
      'Student Name': dr.student_name || 'Anonymous',
      'Campus': dr.college,
      'Branch': dr.branch,
      'Type': dr.feedback_type,
      'Subject Name': dr.subject_name,
      'Faculty Name': dr.faculty_name,
      '1. Concept Clarity (1-5)': dr.concept_clarity,
      '2. Subject Knowledge (1-5)': dr.subject_knowledge,
      '3. Teaching Methodology (1-5)': dr.teaching_methodology,
      '4. Practical Examples (1-5)': dr.practical_examples,
      '5. Student Interaction (1-5)': dr.student_interaction,
      '6. Doubt Clarification (1-5)': dr.doubt_clarification,
      '7. Regularity & Punctuality (1-5)': dr.regularity_punctuality,
      '8. Assignments & Assessments (1-5)': dr.assignments_assessments,
      '9. My Understanding (1-5)': dr.my_understanding,
      '10. My Ability to Apply (1-5)': dr.my_ability_apply,
      'Average Rating (1-5)': dr.average_rating,
    }));

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);

    if (format === 'xlsx' || format === 'excel') {
      const workbook = XLSX.utils.book_new();

      // Sheet 1: Submissions Summary
      const summaryWorksheet = XLSX.utils.json_to_sheet(exportSummary);
      summaryWorksheet['!cols'] = [
        { wch: 6 },  // S.No
        { wch: 14 }, // Sub ID
        { wch: 20 }, // Date
        { wch: 16 }, // Roll No
        { wch: 20 }, // Student Name
        { wch: 10 }, // Campus
        { wch: 10 }, // Branch
        { wch: 8 },  // Type
        { wch: 25 }, // Overall score
        { wch: 45 }, // Subjects & Faculty
        { wch: 40 }, // Q1
        { wch: 40 }, // Q2
        { wch: 40 }, // Q3
      ];
      XLSX.utils.book_append_sheet(workbook, summaryWorksheet, 'Feedback Summary');

      // Sheet 2: Detailed 10 Criteria Ratings
      if (exportDetailedRatings.length > 0) {
        const ratingsWorksheet = XLSX.utils.json_to_sheet(exportDetailedRatings);
        ratingsWorksheet['!cols'] = [
          { wch: 6 },  // S.No
          { wch: 14 }, // Sub ID
          { wch: 16 }, // Roll No
          { wch: 20 }, // Name
          { wch: 10 }, // Campus
          { wch: 10 }, // Branch
          { wch: 8 },  // Type
          { wch: 20 }, // Subject
          { wch: 22 }, // Faculty
          { wch: 20 }, // 1
          { wch: 20 }, // 2
          { wch: 22 }, // 3
          { wch: 20 }, // 4
          { wch: 20 }, // 5
          { wch: 20 }, // 6
          { wch: 24 }, // 7
          { wch: 24 }, // 8
          { wch: 22 }, // 9
          { wch: 22 }, // 10
          { wch: 18 }, // Average
        ];
        XLSX.utils.book_append_sheet(workbook, ratingsWorksheet, 'Criteria Ratings (1-5)');
      }

      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });

      return new NextResponse(excelBuffer, {
        status: 200,
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="KIET_Feedback_with_Ratings_${timestamp}.xlsx"`,
        },
      });
    }

    // Default to CSV
    const csvHeaders = [
      'S.No',
      'Submission ID',
      'Date & Time',
      'Roll Number',
      'Student Name',
      'Campus',
      'Branch',
      'Type',
      'Overall Criteria Score (1-5)',
      'Subjects & Faculty Evaluated',
      'Q1: Difficult Subject & Topics',
      'Q2: Expected Faculty Improvements',
      'Q3: Comments & Suggestions',
    ];

    const escapeCsv = (val: any) => {
      if (val === null || val === undefined) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    const csvRows = [
      csvHeaders.join(','),
      ...exportSummary.map(row =>
        [
          row['S.No'],
          row['Submission ID'],
          escapeCsv(row['Date & Time']),
          escapeCsv(row['Roll Number']),
          escapeCsv(row['Student Name']),
          escapeCsv(row['Campus']),
          escapeCsv(row['Branch']),
          escapeCsv(row['Type']),
          escapeCsv(row['Overall Criteria Score (1-5)']),
          escapeCsv(row['Subjects & Faculty Evaluated']),
          escapeCsv(row['Q1: Difficult Subject & Topics']),
          escapeCsv(row['Q2: Expected Faculty Improvements']),
          escapeCsv(row['Q3: Comments & Suggestions']),
        ].join(',')
      ),
    ];

    const csvContent = '\uFEFF' + csvRows.join('\r\n');

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="KIET_Feedback_Export_${timestamp}.csv"`,
      },
    });
  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json({ error: 'Failed to export feedback data' }, { status: 500 });
  }
}
