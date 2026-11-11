export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApi } from '@/lib/auth';
import { query } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdminApi(request);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 1. Total Submissions
    const totalRes = await query<{ count: string }>(
      `SELECT COUNT(*) as count FROM feedback_submissions`
    );
    const totalSubmissions = parseInt(totalRes[0]?.count || '0', 10);

    // 2. Campus counts (KIET vs KIETW)
    const campusRes = await query<{ code: string; count: string }>(
      `SELECT c.code, COUNT(s.id) as count
       FROM colleges c
       LEFT JOIN feedback_submissions s ON s.college_id = c.id
       GROUP BY c.code`
    );
    let kietCount = 0;
    let kietwCount = 0;
    for (const row of campusRes) {
      if (row.code.toUpperCase() === 'KIET') kietCount = parseInt(row.count, 10);
      if (row.code.toUpperCase() === 'KIETW') kietwCount = parseInt(row.count, 10);
    }

    // 3. Feedback type counts (FRM vs SRM)
    const typeRes = await query<{ feedback_type: string; count: string }>(
      `SELECT feedback_type, COUNT(*) as count
       FROM feedback_submissions
       GROUP BY feedback_type`
    );
    let frmCount = 0;
    let srmCount = 0;
    for (const row of typeRes) {
      if (row.feedback_type === 'FRM') frmCount = parseInt(row.count, 10);
      if (row.feedback_type === 'SRM') srmCount = parseInt(row.count, 10);
    }

    // 4. Branch-wise distribution
    const branchRes = await query<{ code: string; name: string; count: string }>(
      `SELECT b.code, b.name, COUNT(s.id) as count
       FROM branches b
       LEFT JOIN feedback_submissions s ON s.branch_id = b.id
       GROUP BY b.code, b.name
       ORDER BY b.code ASC`
    );

    // 5. Total Faculty Count (Active vs Inactive)
    const facultyCountRes = await query<{ active_flag: boolean; count: string }>(
      `SELECT active_flag, COUNT(*) as count FROM faculty GROUP BY active_flag`
    );
    let activeFacultyCount = 0;
    let inactiveFacultyCount = 0;
    for (const row of facultyCountRes) {
      if (row.active_flag) activeFacultyCount = parseInt(row.count, 10);
      else inactiveFacultyCount = parseInt(row.count, 10);
    }

    // 6. Recent 5 Submissions for dashboard preview
    const recentSubmissions = await query(
      `SELECT s.id, s.student_name, s.roll_number, s.feedback_type, s.created_at,
              c.code as college_code, b.code as branch_code,
              COALESCE(
                json_agg(json_build_object('id', f.id, 'name', f.name))
                FILTER (WHERE f.id IS NOT NULL), '[]'
              ) as faculty_list
       FROM feedback_submissions s
       JOIN colleges c ON c.id = s.college_id
       JOIN branches b ON b.id = s.branch_id
       LEFT JOIN feedback_faculty ff ON ff.submission_id = s.id
       LEFT JOIN faculty f ON f.id = ff.faculty_id
       GROUP BY s.id, s.student_name, s.roll_number, s.feedback_type, s.created_at, c.code, b.code
       ORDER BY s.created_at DESC
       LIMIT 5`
    );

    return NextResponse.json({
      stats: {
        totalSubmissions,
        kietCount,
        kietwCount,
        frmCount,
        srmCount,
        activeFacultyCount,
        inactiveFacultyCount,
        branchDistribution: branchRes.map(b => ({
          code: b.code,
          name: b.name,
          count: parseInt(b.count, 10),
        })),
        recentSubmissions,
      },
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    return NextResponse.json({ error: 'Failed to fetch admin statistics' }, { status: 500 });
  }
}
