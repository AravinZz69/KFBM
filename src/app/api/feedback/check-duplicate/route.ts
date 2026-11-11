export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { sanitizeInput } from '@/lib/sanitize';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const rollNumber = sanitizeInput(body.rollNumber || '').toUpperCase();
    const feedbackType = sanitizeInput(body.feedbackType || '').toUpperCase();
    const facultyIds: number[] = Array.isArray(body.facultyIds)
      ? body.facultyIds.map((id: unknown) => Number(id)).filter((id: number) => Number.isInteger(id) && id > 0)
      : [];

    if (!rollNumber || !feedbackType || facultyIds.length === 0) {
      return NextResponse.json({ isDuplicate: false, duplicates: [] });
    }

    // Dynamic placeholders for cross-driver safety (avoiding ANY($N::int[]) array serialization issues)
    const placeholders = facultyIds.map((_val: number, i: number) => `$${i + 3}`).join(', ');

    // Query for any existing submissions for this roll number and faculty IDs with the same feedback type
    const existing = await query<{ faculty_id: number; faculty_name: string }>(
      `SELECT DISTINCT ff.faculty_id, f.name as faculty_name
       FROM feedback_submissions s
       JOIN feedback_faculty ff ON s.id = ff.submission_id
       JOIN faculty f ON f.id = ff.faculty_id
       WHERE UPPER(s.roll_number) = UPPER($1)
         AND s.feedback_type = $2
         AND ff.faculty_id IN (${placeholders})`,
      [rollNumber, feedbackType, ...facultyIds]
    );

    if (existing.length > 0) {
      return NextResponse.json({
        isDuplicate: true,
        duplicates: existing.map(e => ({
          facultyId: e.faculty_id,
          facultyName: e.faculty_name,
        })),
        message: `Feedback has already been submitted for Roll Number ${rollNumber} for: ${existing.map(e => e.faculty_name).join(', ')} under ${feedbackType}. Duplicate submissions are not allowed.`,
      });
    }

    return NextResponse.json({ isDuplicate: false, duplicates: [] });
  } catch (error: any) {
    console.error('Error checking duplicate submission:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to verify duplicate status', isDuplicate: false },
      { status: 500 }
    );
  }
}
