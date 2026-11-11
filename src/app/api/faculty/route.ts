export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const collegeCode = searchParams.get('college');
    const branchCode = searchParams.get('branch');
    const feedbackType = searchParams.get('type');

    if (!collegeCode || !branchCode || !feedbackType) {
      return NextResponse.json(
        { error: 'college, branch, and type parameters are all required' },
        { status: 400 }
      );
    }

    if (feedbackType !== 'FRM' && feedbackType !== 'SRM') {
      return NextResponse.json(
        { error: 'feedback type must be FRM or SRM' },
        { status: 400 }
      );
    }

    // Only active faculty belonging to this campus, branch, and feedback type
    const faculty = await query(
      `SELECT f.id, f.name, f.designation, f.email, f.feedback_type,
              c.code as college_code, b.code as branch_code
       FROM faculty f
       JOIN colleges c ON c.id = f.college_id
       JOIN branches b ON b.id = f.branch_id
       WHERE UPPER(c.code) = UPPER($1)
         AND UPPER(b.code) = UPPER($2)
         AND f.feedback_type = $3
         AND f.active_flag = TRUE
       ORDER BY f.name ASC`,
      [collegeCode, branchCode, feedbackType]
    );

    return NextResponse.json({ faculty });
  } catch (error) {
    console.error('Error fetching faculty:', error);
    return NextResponse.json({ error: 'Failed to fetch faculty' }, { status: 500 });
  }
}
