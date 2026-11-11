export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApi } from '@/lib/auth';
import { query } from '@/lib/db';
import { sanitizeInput } from '@/lib/sanitize';

export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdminApi(request);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '10', 10)));
    const offset = (page - 1) * limit;

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

    // 1. Get total count for pagination
    const countSql = `
      SELECT COUNT(DISTINCT s.id) as total
      FROM feedback_submissions s
      JOIN colleges c ON c.id = s.college_id
      JOIN branches b ON b.id = s.branch_id
      WHERE ${whereClause}
    `;
    const countRes = await query<{ total: string }>(countSql, queryParams);
    const total = parseInt(countRes[0]?.total || '0', 10);

    // 2. Query paginated submissions with faculty array
    const dataSql = `
      SELECT s.id, s.student_name, s.email, s.phone, s.roll_number,
             s.feedback_type, s.q1_subject_challenges, s.q2_improvements,
             s.q3_additional_comments, s.created_at,
             c.code as college_code, c.name as college_name,
             b.code as branch_code, b.name as branch_name,
             COALESCE(
               json_agg(
                 json_build_object(
                   'id', f.id,
                   'name', f.name,
                   'designation', f.designation,
                   'email', f.email
                 )
               ) FILTER (WHERE f.id IS NOT NULL), '[]'
             ) as faculty_list
      FROM feedback_submissions s
      JOIN colleges c ON c.id = s.college_id
      JOIN branches b ON b.id = s.branch_id
      LEFT JOIN feedback_faculty ff ON ff.submission_id = s.id
      LEFT JOIN faculty f ON f.id = ff.faculty_id
      WHERE ${whereClause}
      GROUP BY s.id, c.code, c.name, b.code, b.name
      ORDER BY s.created_at DESC
      LIMIT $${paramIdx} OFFSET $${paramIdx + 1}
    `;

    const dataParams = [...queryParams, limit, offset];
    const submissions = await query(dataSql, dataParams);

    return NextResponse.json({
      submissions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching admin feedback:', error);
    return NextResponse.json({ error: 'Failed to fetch feedback records' }, { status: 500 });
  }
}
