export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireAdminApi } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdminApi(request);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized. Admin session required.' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const college = searchParams.get('college');
    const branch = searchParams.get('branch');
    const type = searchParams.get('type');
    const tier = searchParams.get('tier');
    const facultyId = searchParams.get('facultyId');

    // 1. Fetch Institutional Overview
    const overview = await query(
      `SELECT * FROM ai_institutional_overview ORDER BY report_date DESC LIMIT 1`
    );

    // 2. Fetch Model Reports
    const modelReports = await query(
      `SELECT * FROM ai_model_reports ORDER BY feedback_type ASC`
    );

    // 3. Fetch Branch Reports
    const branchReports = await query(
      `SELECT * FROM ai_branch_reports ORDER BY college_code ASC, average_score DESC`
    );

    // 4. Fetch Faculty Reports with optional filtering
    let facultyQuery = `SELECT * FROM ai_faculty_reports WHERE 1=1`;
    const params: any[] = [];
    let pIdx = 1;

    if (facultyId) {
      facultyQuery += ` AND faculty_id = $${pIdx++}`;
      params.push(Number(facultyId));
    }

    if (college && college !== 'ALL') {
      facultyQuery += ` AND UPPER(college_code) = UPPER($${pIdx++})`;
      params.push(college);
    }
    if (branch && branch !== 'ALL') {
      facultyQuery += ` AND UPPER(branch_code) = UPPER($${pIdx++})`;
      params.push(branch);
    }
    if (type && type !== 'ALL') {
      facultyQuery += ` AND feedback_type = $${pIdx++}`;
      params.push(type);
    }
    if (tier && tier !== 'ALL') {
      facultyQuery += ` AND performance_tier = $${pIdx++}`;
      params.push(tier);
    }

    facultyQuery += ` ORDER BY overall_score DESC, total_reviews DESC, faculty_name ASC`;

    const facultyReports = await query(facultyQuery, params);

    return NextResponse.json({
      overview: overview[0] || null,
      modelReports,
      branchReports,
      facultyReports,
    });
  } catch (error) {
    console.error('Error fetching AI reports:', error);
    return NextResponse.json({ error: 'Failed to fetch AI reports' }, { status: 500 });
  }
}
