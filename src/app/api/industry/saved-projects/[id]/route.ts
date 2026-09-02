import { NextResponse } from 'next/server';
import { eq, and } from 'drizzle-orm';
import { db } from '@/db';
import { savedProjects } from '@/db/schema';
import { requireRole, createRbacErrorResponse } from '@/lib/auth/require-role';

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const authResult = await requireRole(['CITIZEN', 'STUDENT', 'FACULTY', 'COMPANY_REP', 'ADMIN']);
    if (!authResult.success) {
      return createRbacErrorResponse(authResult);
    }
    const user = authResult.user;
    const { id: savedId } = await context.params;

    const existing = await db.query.savedProjects.findFirst({
      where: and(eq(savedProjects.id, savedId), eq(savedProjects.userId, user.id)),
    });

    if (!existing) {
      return NextResponse.json({ error: 'Saved project record not found.' }, { status: 404 });
    }

    await db.delete(savedProjects).where(eq(savedProjects.id, savedId));

    return NextResponse.json({ message: 'Project removed from saved watchlist.' });
  } catch (error: any) {
    console.error('Delete saved project error:', error);
    return NextResponse.json({ error: 'Failed to remove saved project.' }, { status: 500 });
  }
}
