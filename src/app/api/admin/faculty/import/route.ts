import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApi } from '@/lib/auth';
import { query } from '@/lib/db';
import { sanitizeInput } from '@/lib/sanitize';

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdminApi(request);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { csvText } = await request.json();
    if (!csvText || typeof csvText !== 'string') {
      return NextResponse.json({ error: 'CSV data is required' }, { status: 400 });
    }

    // Split lines
    const lines = csvText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    if (lines.length < 2) {
      return NextResponse.json({ error: 'CSV file must have a header and at least one data row' }, { status: 400 });
    }

    // Parse header
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/['"]/g, ''));

    const nameIdx = headers.findIndex(h => h.includes('name'));
    const collegeIdx = headers.findIndex(h => h.includes('college') || h.includes('campus'));
    const branchIdx = headers.findIndex(h => h.includes('branch'));
    const typeIdx = headers.findIndex(h => h.includes('type') || h.includes('feedback'));
    const desigIdx = headers.findIndex(h => h.includes('designation') || h.includes('role') || h.includes('desig'));
    const emailIdx = headers.findIndex(h => h.includes('email'));

    if (nameIdx === -1 || collegeIdx === -1 || branchIdx === -1 || typeIdx === -1) {
      return NextResponse.json(
        { error: 'CSV must contain headers: name, college/campus, branch, feedback_type (and optional designation, email)' },
        { status: 400 }
      );
    }

    // Pre-fetch college and branch maps
    const colleges = await query<{ id: number; code: string }>(`SELECT id, code FROM colleges`);
    const branches = await query<{ id: number; code: string }>(`SELECT id, code FROM branches`);

    const collegeMap = Object.fromEntries(colleges.map(c => [c.code.toUpperCase(), c.id]));
    const branchMap = Object.fromEntries(branches.map(b => [b.code.toUpperCase(), b.id]));

    const allowedBranches = ['CYBER', 'AID', 'CSM', 'CAI', 'CSD'];

    let importedCount = 0;
    const errors: { row: number; reason: string }[] = [];

    for (let i = 1; i < lines.length; i++) {
      const rowLine = lines[i];
      if (!rowLine.trim()) continue;

      // Basic CSV token parser handling quotes
      const regex = /(?:,|\n|^)("(?:(?:"")*[^"]*)*"|[^",\n]*|(?:\n|$))/g;
      const values: string[] = [];
      let match;
      while ((match = regex.exec(rowLine)) !== null) {
        if (match.index === regex.lastIndex) regex.lastIndex++;
        let val = match[1] || '';
        if (val.startsWith('"') && val.endsWith('"')) {
          val = val.slice(1, -1).replace(/""/g, '"');
        }
        values.push(val.trim());
        if (regex.lastIndex >= rowLine.length) break;
      }

      const name = sanitizeInput(values[nameIdx] || '');
      const collegeCode = sanitizeInput(values[collegeIdx] || '').toUpperCase();
      const branchCode = sanitizeInput(values[branchIdx] || '').toUpperCase();
      const feedbackType = sanitizeInput(values[typeIdx] || '').toUpperCase();
      const designation = desigIdx !== -1 ? sanitizeInput(values[desigIdx] || 'Assistant Professor') : 'Assistant Professor';
      const email = emailIdx !== -1 ? sanitizeInput(values[emailIdx] || '').toLowerCase() : `${name.toLowerCase().replace(/\s+/g, '.')}@kiet.edu`;

      if (!name || name.length < 2) {
        errors.push({ row: i + 1, reason: 'Invalid or missing name' });
        continue;
      }

      if (!collegeMap[collegeCode]) {
        errors.push({ row: i + 1, reason: `Invalid campus '${collegeCode}'. Must be KIET or KIETW.` });
        continue;
      }

      if (!allowedBranches.includes(branchCode) || !branchMap[branchCode]) {
        errors.push({ row: i + 1, reason: `Invalid branch '${branchCode}'. Must be CYBER, AID, CSM, CAI, or CSD.` });
        continue;
      }

      if (!['FRM', 'SRM'].includes(feedbackType)) {
        errors.push({ row: i + 1, reason: `Invalid feedback type '${feedbackType}'. Must be FRM or SRM.` });
        continue;
      }

      await query(
        `INSERT INTO faculty (name, college_id, branch_id, feedback_type, designation, email, active_flag, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, TRUE, NOW(), NOW())`,
        [name, collegeMap[collegeCode], branchMap[branchCode], feedbackType, designation || 'Assistant Professor', email]
      );

      importedCount++;
    }

    return NextResponse.json({
      success: true,
      importedCount,
      errorCount: errors.length,
      errors: errors.slice(0, 20), // return up to first 20 errors
      message: `Successfully imported ${importedCount} faculty member(s).${errors.length > 0 ? ` ${errors.length} rows skipped due to invalid data.` : ''}`,
    });
  } catch (error) {
    console.error('Error during faculty CSV import:', error);
    return NextResponse.json({ error: 'Failed to process CSV import' }, { status: 500 });
  }
}
