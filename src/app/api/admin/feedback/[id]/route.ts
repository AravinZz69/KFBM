import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApi } from '@/lib/auth';
import { query, queryOne } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdminApi(request);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const subId = parseInt(id, 10);
    if (isNaN(subId)) {
      return NextResponse.json({ error: 'Invalid submission ID' }, { status: 400 });
    }

    const submission = await queryOne(
      `SELECT s.id, s.student_name, s.email, s.phone, s.roll_number,
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
       WHERE s.id = $1
       GROUP BY s.id, c.code, c.name, b.code, b.name`,
      [subId]
    );

    if (!submission) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
    }

    return NextResponse.json({ submission });
  } catch (error) {
    console.error('Error fetching submission detail:', error);
    return NextResponse.json({ error: 'Failed to fetch submission' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdminApi(request);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const subId = parseInt(id, 10);
    if (isNaN(subId)) {
      return NextResponse.json({ error: 'Invalid submission ID' }, { status: 400 });
    }

    // Check if submission exists
    const existing = await queryOne(`SELECT id FROM feedback_submissions WHERE id = $1`, [subId]);
    if (!existing) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
    }

    // Delete feedback_faculty mappings and then submission
    await query(`DELETE FROM feedback_faculty WHERE submission_id = $1`, [subId]);
    await query(`DELETE FROM feedback_submissions WHERE id = $1`, [subId]);

    return NextResponse.json({
      success: true,
      message: `Feedback submission #${subId} deleted successfully.`,
    });
  } catch (error) {
    console.error('Error deleting submission:', error);
    return NextResponse.json({ error: 'Failed to delete submission' }, { status: 500 });
  }
}
