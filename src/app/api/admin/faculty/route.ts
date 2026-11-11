export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApi } from '@/lib/auth';
import { query, queryOne } from '@/lib/db';
import { sanitizeInput } from '@/lib/sanitize';

export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdminApi(request);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const campus = sanitizeInput(searchParams.get('campus') || '');
    const branch = sanitizeInput(searchParams.get('branch') || '');
    const feedbackType = sanitizeInput(searchParams.get('type') || '');
    const status = sanitizeInput(searchParams.get('status') || ''); // 'active', 'inactive', 'all'
    const search = sanitizeInput(searchParams.get('search') || '');

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
      whereConditions.push(`f.feedback_type = $${paramIdx}`);
      queryParams.push(feedbackType);
      paramIdx++;
    }

    if (status === 'active') {
      whereConditions.push(`f.active_flag = TRUE`);
    } else if (status === 'inactive') {
      whereConditions.push(`f.active_flag = FALSE`);
    }

    if (search) {
      whereConditions.push(
        `(f.name ILIKE $${paramIdx} OR f.email ILIKE $${paramIdx} OR f.designation ILIKE $${paramIdx})`
      );
      queryParams.push(`%${search}%`);
      paramIdx++;
    }

    const whereClause = whereConditions.join(' AND ');

    const faculty = await query(
      `SELECT f.id, f.name, f.designation, f.email, f.feedback_type, f.active_flag,
              f.created_at, f.updated_at,
              c.code as college_code, c.name as college_name,
              b.code as branch_code, b.name as branch_name,
              COUNT(ff.id) as feedback_count
       FROM faculty f
       JOIN colleges c ON c.id = f.college_id
       JOIN branches b ON b.id = f.branch_id
       LEFT JOIN feedback_faculty ff ON ff.faculty_id = f.id
       WHERE ${whereClause}
       GROUP BY f.id, c.code, c.name, b.code, b.name
       ORDER BY f.active_flag DESC, f.name ASC`,
      queryParams
    );

    return NextResponse.json({ faculty });
  } catch (error) {
    console.error('Error fetching admin faculty:', error);
    return NextResponse.json({ error: 'Failed to fetch faculty' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdminApi(request);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const name = sanitizeInput(body.name || '');
    const collegeCode = sanitizeInput(body.collegeCode || '').toUpperCase();
    const branchCode = sanitizeInput(body.branchCode || '').toUpperCase();
    const feedbackType = sanitizeInput(body.feedbackType || '').toUpperCase();
    const designation = sanitizeInput(body.designation || '');
    const email = sanitizeInput(body.email || '').toLowerCase();

    if (!name || name.length < 2) {
      return NextResponse.json({ error: 'Faculty Name is required' }, { status: 400 });
    }

    if (!['KIET', 'KIETW'].includes(collegeCode)) {
      return NextResponse.json({ error: 'Valid college is required (KIET or KIETW)' }, { status: 400 });
    }

    const allowedBranches = ['CYBER', 'AID', 'CSM', 'CAI', 'CSD'];
    if (!allowedBranches.includes(branchCode)) {
      return NextResponse.json({ error: 'Valid branch is required (CYBER, AID, CSM, CAI, CSD)' }, { status: 400 });
    }

    if (!['FRM', 'SRM'].includes(feedbackType)) {
      return NextResponse.json({ error: 'Feedback type must be FRM or SRM' }, { status: 400 });
    }

    if (!designation) {
      return NextResponse.json({ error: 'Designation is required' }, { status: 400 });
    }

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Valid email is required' }, { status: 400 });
    }

    const college = await queryOne<{ id: number }>(`SELECT id FROM colleges WHERE UPPER(code) = UPPER($1)`, [collegeCode]);
    const branch = await queryOne<{ id: number }>(`SELECT id FROM branches WHERE UPPER(code) = UPPER($1)`, [branchCode]);

    if (!college || !branch) {
      return NextResponse.json({ error: 'Invalid college or branch' }, { status: 400 });
    }

    const res = await query<{ id: number }>(
      `INSERT INTO faculty (name, college_id, branch_id, feedback_type, designation, email, active_flag, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, TRUE, NOW(), NOW())
       RETURNING id`,
      [name, college.id, branch.id, feedbackType, designation, email]
    );

    return NextResponse.json({
      success: true,
      message: 'Faculty member added successfully',
      id: res[0].id,
    });
  } catch (error) {
    console.error('Error adding faculty:', error);
    return NextResponse.json({ error: 'Failed to create faculty member' }, { status: 500 });
  }
}
