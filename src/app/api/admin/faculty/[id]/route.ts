import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApi } from '@/lib/auth';
import { query, queryOne } from '@/lib/db';
import { sanitizeInput } from '@/lib/sanitize';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdminApi(request);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const facId = parseInt(id, 10);
    if (isNaN(facId)) {
      return NextResponse.json({ error: 'Invalid faculty ID' }, { status: 400 });
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

    const college = await queryOne<{ id: number }>(`SELECT id FROM colleges WHERE UPPER(code) = UPPER($1)`, [collegeCode]);
    const branch = await queryOne<{ id: number }>(`SELECT id FROM branches WHERE UPPER(code) = UPPER($1)`, [branchCode]);

    if (!college || !branch) {
      return NextResponse.json({ error: 'Invalid college or branch' }, { status: 400 });
    }

    await query(
      `UPDATE faculty
       SET name = $1,
           college_id = $2,
           branch_id = $3,
           feedback_type = $4,
           designation = $5,
           email = $6,
           updated_at = NOW()
       WHERE id = $7`,
      [name, college.id, branch.id, feedbackType, designation, email, facId]
    );

    return NextResponse.json({
      success: true,
      message: 'Faculty member updated successfully',
    });
  } catch (error) {
    console.error('Error updating faculty:', error);
    return NextResponse.json({ error: 'Failed to update faculty member' }, { status: 500 });
  }
}
