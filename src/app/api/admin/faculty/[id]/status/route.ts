import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApi } from '@/lib/auth';
import { query, queryOne } from '@/lib/db';

export async function PATCH(
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
    const activeFlag = Boolean(body.activeFlag);

    const existing = await queryOne(`SELECT id, name FROM faculty WHERE id = $1`, [facId]);
    if (!existing) {
      return NextResponse.json({ error: 'Faculty member not found' }, { status: 404 });
    }

    // Soft update active_flag - never delete from DB so historical feedback remains intact!
    await query(
      `UPDATE faculty
       SET active_flag = $1,
           updated_at = NOW()
       WHERE id = $2`,
      [activeFlag, facId]
    );

    const statusText = activeFlag ? 'reactivated' : 'deactivated';
    return NextResponse.json({
      success: true,
      message: `Faculty member "${existing.name}" has been ${statusText} successfully. Historical feedback is preserved.`,
      activeFlag,
    });
  } catch (error) {
    console.error('Error updating faculty status:', error);
    return NextResponse.json({ error: 'Failed to update faculty status' }, { status: 500 });
  }
}
