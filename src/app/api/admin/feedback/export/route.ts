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
          s.email ILIKE $${paramIdx} OR
          EXISTS (
            SELECT 1 FROM feedback_faculty ff_search
            JOIN faculty f_search ON f_search.id = ff_search.faculty_id
            WHERE ff_search.submission_id = s.id AND f_search.name ILIKE $${paramIdx}
          )
        )`
      );
      queryParams.push(`%${search}%`);
      paramIdx++;
    }

    const whereClause = whereConditions.join(' AND ');

    const dataSql = `
      SELECT s.id, s.created_at, s.student_name, s.roll_number, s.email, s.phone,
             c.code as college, b.code as branch, s.feedback_type,
             STRING_AGG(f.name, ', ' ORDER BY f.name) as faculty_names,
             s.q1_subject_challenges, s.q2_improvements, s.q3_additional_comments
      FROM feedback_submissions s
      JOIN colleges c ON c.id = s.college_id
      JOIN branches b ON b.id = s.branch_id
      LEFT JOIN feedback_faculty ff ON ff.submission_id = s.id
      LEFT JOIN faculty f ON f.id = ff.faculty_id
      WHERE ${whereClause}
      GROUP BY s.id, s.created_at, s.student_name, s.roll_number, s.email, s.phone,
               c.code, b.code, s.feedback_type, s.q1_subject_challenges, s.q2_improvements, s.q3_additional_comments
      ORDER BY s.created_at DESC
    `;

    const rows = await query(dataSql, queryParams);

    const exportData = rows.map((r, index) => ({
      'S.No': index + 1,
      'Submission ID': r.id,
      'Date & Time': new Date(r.created_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
      'Student Name': r.student_name,
      'Roll Number': r.roll_number,
      'Student Email': r.email,
      'Phone Number': r.phone,
      'Campus': r.college,
      'Branch': r.branch,
      'Feedback Type': r.feedback_type,
      'Faculty Evaluated': r.faculty_names || 'N/A',
      'Q1: Difficult Subject & Topics': r.q1_subject_challenges,
      'Q2: Expected Faculty Improvements': r.q2_improvements,
      'Q3: Comments & Suggestions': r.q3_additional_comments,
    }));

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);

    if (format === 'xlsx' || format === 'excel') {
      const worksheet = XLSX.utils.json_to_sheet(exportData);

      // Auto-fit column widths
      const colWidths = [
        { wch: 6 },  // S.No
        { wch: 14 }, // Sub ID
        { wch: 20 }, // Date
        { wch: 22 }, // Name
        { wch: 16 }, // Roll No
        { wch: 25 }, // Email
        { wch: 14 }, // Phone
        { wch: 10 }, // Campus
        { wch: 10 }, // Branch
        { wch: 14 }, // Type
        { wch: 30 }, // Faculty
        { wch: 40 }, // Q1
        { wch: 40 }, // Q2
        { wch: 40 }, // Q3
      ];
      worksheet['!cols'] = colWidths;

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Feedback');

      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });

      return new NextResponse(excelBuffer, {
        status: 200,
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="KIET_Feedback_Export_${timestamp}.xlsx"`,
        },
      });
    }

    // Default to CSV
    const csvHeaders = [
      'S.No',
      'Submission ID',
      'Date & Time',
      'Student Name',
      'Roll Number',
      'Student Email',
      'Phone Number',
      'Campus',
      'Branch',
      'Feedback Type',
      'Faculty Evaluated',
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
      ...exportData.map(row =>
        [
          row['S.No'],
          row['Submission ID'],
          escapeCsv(row['Date & Time']),
          escapeCsv(row['Student Name']),
          escapeCsv(row['Roll Number']),
          escapeCsv(row['Student Email']),
          escapeCsv(row['Phone Number']),
          escapeCsv(row['Campus']),
          escapeCsv(row['Branch']),
          escapeCsv(row['Feedback Type']),
          escapeCsv(row['Faculty Evaluated']),
          escapeCsv(row['Q1: Difficult Subject & Topics']),
          escapeCsv(row['Q2: Expected Faculty Improvements']),
          escapeCsv(row['Q3: Comments & Suggestions']),
        ].join(',')
      ),
    ];

    const csvContent = '\uFEFF' + csvRows.join('\r\n'); // Add UTF-8 BOM for Excel compatibility

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
