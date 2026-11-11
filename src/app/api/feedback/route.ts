export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { sanitizeInput } from '@/lib/sanitize';
import { checkRateLimit } from '@/lib/ratelimit';

// Email validation regex (RFC 5322 compliant simplified)
const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)+$/;
// 10-digit Indian mobile number validation
const PHONE_REGEX = /^[6-9]\d{9}$/;

export async function POST(request: NextRequest) {
  try {
    // 1. Rate limiting by IP and Roll Number
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
               request.headers.get('x-real-ip') ||
               'anonymous';

    const rateLimit = await checkRateLimit(ip, 'feedback_submit', 10, 600); // 10 submits per 10 mins
    if (!rateLimit.success) {
      return NextResponse.json(
        { error: `Too many submissions. Please wait ${rateLimit.resetSeconds} seconds before trying again.` },
        { status: 429 }
      );
    }

    const rawBody = await request.json();

    // 2. Sanitize all text inputs against XSS
    const studentName = sanitizeInput(rawBody.studentName || '');
    const email = sanitizeInput(rawBody.email || '').toLowerCase();
    const phone = sanitizeInput(rawBody.phone || '').replace(/\D/g, ''); // strip non-digits
    const rollNumber = sanitizeInput(rawBody.rollNumber || '').toUpperCase();
    const campusCode = sanitizeInput(rawBody.campus || '').toUpperCase();
    const branchCode = sanitizeInput(rawBody.branch || '').toUpperCase();
    const feedbackType = sanitizeInput(rawBody.feedbackType || '').toUpperCase();
    const q1SubjectChallenges = sanitizeInput(rawBody.q1SubjectChallenges || '');
    const q2Improvements = sanitizeInput(rawBody.q2Improvements || '');
    const q3AdditionalComments = sanitizeInput(rawBody.q3AdditionalComments || '');

    const facultyIds: number[] = Array.isArray(rawBody.facultyIds)
      ? rawBody.facultyIds.map((id: any) => Number(id)).filter((id: number) => !isNaN(id) && id > 0)
      : [];

    // 3. Strict Validations
    if (!studentName || studentName.length < 2) {
      return NextResponse.json({ error: 'Student Name is required (minimum 2 characters).' }, { status: 400 });
    }

    if (!email || !EMAIL_REGEX.test(email)) {
      return NextResponse.json({ error: 'A valid email address is required.' }, { status: 400 });
    }

    if (!phone || !PHONE_REGEX.test(phone)) {
      return NextResponse.json({ error: 'Student Phone must be a valid 10-digit mobile number.' }, { status: 400 });
    }

    if (!rollNumber || rollNumber.length < 3) {
      return NextResponse.json({ error: 'Roll Number is required.' }, { status: 400 });
    }

    if (!['KIET', 'KIETW'].includes(campusCode)) {
      return NextResponse.json({ error: 'Campus must be either KIET or KIETW.' }, { status: 400 });
    }

    const allowedBranches = ['CYBER', 'AID', 'CSM', 'CAI', 'CSD'];
    if (!allowedBranches.includes(branchCode)) {
      return NextResponse.json({ error: 'Branch must be one of: CYBER, AID, CSM, CAI, CSD.' }, { status: 400 });
    }

    if (!['FRM', 'SRM'].includes(feedbackType)) {
      return NextResponse.json({ error: 'Feedback Type must be either FRM or SRM.' }, { status: 400 });
    }

    if (facultyIds.length === 0) {
      return NextResponse.json({ error: 'Please select at least one faculty member.' }, { status: 400 });
    }

    if (!q1SubjectChallenges || q1SubjectChallenges.length < 5) {
      return NextResponse.json({
        error: 'Question 1: Please specify which subject you find most difficult and the challenging topics.',
      }, { status: 400 });
    }

    if (!q2Improvements || q2Improvements.length < 5) {
      return NextResponse.json({
        error: 'Question 2: Please specify the most important improvement you expect from your faculty.',
      }, { status: 400 });
    }

    if (!q3AdditionalComments || q3AdditionalComments.length < 2) {
      return NextResponse.json({
        error: 'Question 3: Please provide additional comments or suggestions.',
      }, { status: 400 });
    }

    // 4. Verify College and Branch records in DB
    const college = await queryOne<{ id: number }>(`SELECT id FROM colleges WHERE UPPER(code) = UPPER($1)`, [campusCode]);
    if (!college) {
      return NextResponse.json({ error: 'Invalid college selected.' }, { status: 400 });
    }

    const branch = await queryOne<{ id: number }>(`SELECT id FROM branches WHERE UPPER(code) = UPPER($1)`, [branchCode]);
    if (!branch) {
      return NextResponse.json({ error: 'Invalid branch selected.' }, { status: 400 });
    }

    // Verify all selected faculty belong to this campus, branch, feedback type, and are active
    const validFaculty = await query<{ id: number; name: string }>(
      `SELECT id, name FROM faculty
       WHERE id = ANY($1::int[])
         AND college_id = $2
         AND branch_id = $3
         AND feedback_type = $4
         AND active_flag = TRUE`,
      [facultyIds, college.id, branch.id, feedbackType]
    );

    if (validFaculty.length !== facultyIds.length) {
      return NextResponse.json(
        { error: 'One or more selected faculty are invalid, inactive, or do not match the chosen campus/branch/type.' },
        { status: 400 }
      );
    }

    // 5. Backend duplicate check: Prevent duplicate submissions from the same roll number for the same faculty and feedback type
    const duplicateCheck = await query<{ faculty_id: number; faculty_name: string }>(
      `SELECT DISTINCT ff.faculty_id, f.name as faculty_name
       FROM feedback_submissions s
       JOIN feedback_faculty ff ON s.id = ff.submission_id
       JOIN faculty f ON f.id = ff.faculty_id
       WHERE UPPER(s.roll_number) = UPPER($1)
         AND s.feedback_type = $2
         AND ff.faculty_id = ANY($3::int[])`,
      [rollNumber, feedbackType, facultyIds]
    );

    if (duplicateCheck.length > 0) {
      const dupNames = duplicateCheck.map(d => d.faculty_name).join(', ');
      return NextResponse.json(
        {
          error: `Duplicate Submission Detected: Roll Number ${rollNumber} has already submitted ${feedbackType} feedback for: ${dupNames}. Duplicate feedback is strictly prohibited.`,
        },
        { status: 409 }
      );
    }

    // 6. Insert Feedback Submission
    const insertSubRes = await query<{ id: number }>(
      `INSERT INTO feedback_submissions (
        student_name, email, phone, roll_number, college_id, branch_id, feedback_type,
        q1_subject_challenges, q2_improvements, q3_additional_comments, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
      RETURNING id`,
      [
        studentName,
        email,
        phone,
        rollNumber,
        college.id,
        branch.id,
        feedbackType,
        q1SubjectChallenges,
        q2Improvements,
        q3AdditionalComments,
      ]
    );

    const submissionId = insertSubRes[0].id;

    // 7. Insert links to selected faculty in feedback_faculty table
    for (const facId of facultyIds) {
      await query(
        `INSERT INTO feedback_faculty (submission_id, faculty_id, created_at)
         VALUES ($1, $2, NOW())`,
        [submissionId, facId]
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Thank you! Your feedback has been submitted successfully.',
      submissionId,
    });
  } catch (error: any) {
    console.error('Error submitting feedback:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred while saving your feedback. Please try again.' },
      { status: 500 }
    );
  }
}
