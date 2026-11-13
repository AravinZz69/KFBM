export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApi } from '@/lib/auth';
import { query } from '@/lib/db';
import { sanitizeInput } from '@/lib/sanitize';

export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdminApi(request);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized. Admin session required.' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = sanitizeInput(searchParams.get('search') || '');
    const campus = sanitizeInput(searchParams.get('campus') || 'ALL');
    const branch = sanitizeInput(searchParams.get('branch') || 'ALL');
    const type = sanitizeInput(searchParams.get('type') || 'ALL');
    const theme = sanitizeInput(searchParams.get('theme') || 'ALL');

    const whereConditions: string[] = ['1=1'];
    const queryParams: any[] = [];
    let pIdx = 1;

    if (campus && campus !== 'ALL') {
      whereConditions.push(`UPPER(college_code) = UPPER($${pIdx++})`);
      queryParams.push(campus);
    }

    if (branch && branch !== 'ALL') {
      whereConditions.push(`UPPER(branch_code) = UPPER($${pIdx++})`);
      queryParams.push(branch);
    }

    if (type && type !== 'ALL') {
      whereConditions.push(`feedback_type = $${pIdx++}`);
      queryParams.push(type);
    }

    if (theme && theme !== 'ALL') {
      whereConditions.push(`primary_theme = $${pIdx++}`);
      queryParams.push(theme);
    }

    if (search) {
      whereConditions.push(`(
        student_name ILIKE $${pIdx} OR 
        roll_number ILIKE $${pIdx} OR 
        q1_subject_challenges ILIKE $${pIdx} OR 
        q2_improvements ILIKE $${pIdx} OR 
        q3_additional_comments ILIKE $${pIdx} OR
        primary_theme ILIKE $${pIdx}
      )`);
      queryParams.push(`%${search}%`);
      pIdx++;
    }

    const sqlStr = `
      SELECT id, rank, submission_id, student_name, roll_number, email, phone,
             college_code, college_name, branch_code, branch_name, feedback_type,
             student_avg_rating, q1_subject_challenges, q2_improvements, q3_additional_comments,
             primary_theme, genuine_score, submission_date, created_at
      FROM genuine_student_feedback
      WHERE ${whereConditions.join(' AND ')}
      ORDER BY rank ASC
    `;

    const items = await query(sqlStr, queryParams);

    // Compute stats
    const statsRes = await query<{
      total_count: number;
      avg_rating: string;
      c_count: number;
      math_count: number;
      kiet_count: number;
      kietw_count: number;
    }>(`
      SELECT 
        COUNT(*)::int as total_count,
        ROUND(AVG(student_avg_rating)::numeric, 2) as avg_rating,
        COUNT(CASE WHEN primary_theme = 'C Programming & Pointers' THEN 1 END)::int as c_count,
        COUNT(CASE WHEN primary_theme = 'Engineering Mathematics (LA&C)' THEN 1 END)::int as math_count,
        COUNT(CASE WHEN college_code = 'KIET' THEN 1 END)::int as kiet_count,
        COUNT(CASE WHEN college_code = 'KIETW' THEN 1 END)::int as kietw_count
      FROM genuine_student_feedback
    `);

    // Theme breakdown
    const themesRes = await query<{ primary_theme: string; count: number }>(`
      SELECT primary_theme, COUNT(*)::int as count 
      FROM genuine_student_feedback 
      GROUP BY primary_theme 
      ORDER BY count DESC
    `);

    return NextResponse.json({
      items,
      stats: statsRes[0] || null,
      themes: themesRes,
    });
  } catch (error) {
    console.error('Error fetching genuine feedback:', error);
    return NextResponse.json({ error: 'Failed to fetch genuine feedback' }, { status: 500 });
  }
}
