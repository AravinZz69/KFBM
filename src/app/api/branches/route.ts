export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const collegeCode = searchParams.get('college');

    if (!collegeCode) {
      return NextResponse.json({ error: 'College parameter is required' }, { status: 400 });
    }

    // Only allow CYBER, AID, CSM, CAI, CSD (never IT, EEE, ECE)
    const allowedBranches = ['CYBER', 'AID', 'CSM', 'CAI', 'CSD'];

    const branches = await query(
      `SELECT b.id, b.code, b.name
       FROM branches b
       JOIN college_branches cb ON b.id = cb.branch_id
       JOIN colleges c ON c.id = cb.college_id
       WHERE UPPER(c.code) = UPPER($1)
         AND cb.active = TRUE
         AND UPPER(b.code) = ANY($2)
       ORDER BY b.code ASC`,
      [collegeCode, allowedBranches]
    );

    return NextResponse.json({ branches });
  } catch (error) {
    console.error('Error fetching branches:', error);
    return NextResponse.json({ error: 'Failed to fetch branches' }, { status: 500 });
  }
}
